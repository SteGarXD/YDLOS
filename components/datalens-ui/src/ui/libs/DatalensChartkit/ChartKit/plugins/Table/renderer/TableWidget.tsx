import React from 'react';

import type {ChartKitWidgetRef} from '@gravity-ui/chartkit';
import {Loader} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import debounce from 'lodash/debounce';
import type {StringParams} from 'shared';
import {ChartKitTableQa} from 'shared';

import {getRandomCKId} from '../../../helpers/getRandomCKId';
import Performance from '../../../modules/perfomance';
import type {WidgetDimensions} from '../renderer/types';
import type {TableWidgetProps} from '../types';

import {Table} from './components/Table/Table';

import './TableWidget.scss';

const b = block('chartkit-table-widget');

const TableWidget = React.forwardRef<ChartKitWidgetRef | undefined, TableWidgetProps>(
    (props, forwardedRef) => {
        const {
            id,
            onChange,
            onLoad,
            data: {data: originalData, config},
            backgroundColor,
            isQlPreviewTable = false,
            qa = ChartKitTableQa.Widget,
            emptyDataMessage,
            className,
        } = props;

        const generatedId = React.useMemo(
            () => `${id}_${getRandomCKId()}`,
            [originalData, config, id],
        );
        Performance.mark(generatedId);

        const ref = React.useRef<HTMLDivElement | null>(null);
        const [dimensions, setDimensions] = React.useState<WidgetDimensions | undefined>();
        const handleResize = React.useCallback(() => {
            const el = ref.current;
            if (el) {
                const {clientWidth: initialWidth, clientHeight: height} = el;
                let width = initialWidth;
                if (width < 2 && el.parentElement) {
                    width = el.parentElement.clientWidth;
                }
                setDimensions({width, height});
            }
        }, []);

        const debuncedHandleResize = React.useMemo(
            () => debounce(handleResize, 100),
            [handleResize],
        );

        React.useLayoutEffect(() => {
            handleResize();
        }, [handleResize]);

        React.useLayoutEffect(() => {
            const el = ref.current;
            if (!el || typeof ResizeObserver === 'undefined') {
                return undefined;
            }
            /* Без debounce: размеры виджета должны совпадать с раскладкой сетки дашборда в том же кадре,
             * иначе потребители dimensions получают отстающую ширину (см. mergeTableLayoutWidthPx). */
            const ro = new ResizeObserver(() => {
                handleResize();
            });
            ro.observe(el);
            return () => ro.disconnect();
        }, [handleResize]);

        React.useImperativeHandle(
            forwardedRef,
            () => ({
                reflow() {
                    debuncedHandleResize();
                },
            }),
            [debuncedHandleResize],
        );

        React.useEffect(() => {
            window.addEventListener('resize', debuncedHandleResize);

            return () => {
                window.removeEventListener('resize', debuncedHandleResize);
            };
        }, [debuncedHandleResize]);

        const handleTableReady = React.useCallback(() => {
            const widgetRendering = Performance.getDuration(generatedId);

            if (onLoad && widgetRendering) {
                onLoad({widget: props.data, widgetRendering});
            }
        }, [generatedId, onLoad, props.data]);

        const handleChangeParams = React.useCallback(
            (params: StringParams) => {
                if (onChange) {
                    onChange(
                        {type: 'PARAMS_CHANGED', data: {params}},
                        {forceUpdate: true},
                        true,
                        true,
                    );
                }
            },
            [onChange],
        );

        return (
            <div className={b({}, className)} data-qa={qa} ref={ref}>
                {dimensions ? (
                    <Table
                        widgetData={props.data}
                        dimensions={dimensions}
                        emptyDataMessage={emptyDataMessage}
                        onChangeParams={handleChangeParams}
                        onReady={handleTableReady}
                        backgroundColor={backgroundColor}
                        disableCellFormatting={isQlPreviewTable}
                    />
                ) : (
                    <Loader />
                )}
            </div>
        );
    },
);

TableWidget.displayName = 'TableWidget';

export default React.memo<TableWidgetProps>(TableWidget);
