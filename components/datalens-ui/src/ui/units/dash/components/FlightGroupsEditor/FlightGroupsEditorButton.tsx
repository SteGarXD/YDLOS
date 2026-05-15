import React from 'react';

import {Folders} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import {useDispatch, useSelector} from 'react-redux';
import type {DashData} from 'shared';
import type {AppDispatch} from 'ui/store';
import history from 'utils/history';

import {load} from '../../store/actions/base/actions';
import {bumpFlightGroupsDatasetRefresh, setPageTab} from '../../store/actions/dashTyped';
import {selectCurrentTabId} from '../../store/selectors/dashTypedSelectors';

import {FlightGroupsEditorDialog} from './FlightGroupsEditorDialog';
import {useFlightGroupsEditorVisibility} from './useFlightGroupsEditorVisibility';

import './FlightGroupsEditorButton.scss';

const b = block('flight-groups-editor-entry');
const i18n = I18n.keyset('dash.flight-groups-editor.view');

export type FlightGroupsEditorButtonVariant = 'default' | 'mobile-inline' | 'mobile-float';

type Props = {
    dashData: DashData | undefined;
    /** default — шапка десктопа; mobile-inline — узкая строка рядом с Share; mobile-float — иконка в FloatMenu */
    variant?: FlightGroupsEditorButtonVariant;
};

export const FlightGroupsEditorButton: React.FC<Props> = ({dashData, variant = 'default'}) => {
    const {visible} = useFlightGroupsEditorVisibility(dashData);
    const dispatch = useDispatch<AppDispatch>();
    const currentTabId = useSelector(selectCurrentTabId);
    const [open, setOpen] = React.useState(false);

    const handleDialogClose = React.useCallback(
        (changed?: boolean) => {
            setOpen(false);
            if (changed) {
                if (currentTabId) {
                    dispatch(setPageTab(currentTabId));
                }
                // Обновляем только связанные селекторы (группы/рейсы), не трогая дату.
                dispatch(bumpFlightGroupsDatasetRefresh());
                dispatch(
                    load({
                        location: history.location,
                        history,
                    }),
                )
                    .then(() => {
                        // Второй bump после load для гарантированного обновления content в селекторах.
                        dispatch(bumpFlightGroupsDatasetRefresh());
                    })
                    .catch(() => {
                        window.location.reload();
                    });
            }
        },
        [dispatch, currentTabId],
    );

    if (!visible) {
        return null;
    }

    const label = i18n('button_open');

    const trigger =
        variant === 'mobile-float' ? (
            <Button view="flat" onClick={() => setOpen(true)} title={label} aria-label={label}>
                <Icon size={24} data={Folders} />
            </Button>
        ) : variant === 'mobile-inline' ? (
            <Button view="normal" size="s" onClick={() => setOpen(true)}>
                {label}
            </Button>
        ) : (
            <Button
                view="normal"
                size="m"
                onClick={() => setOpen(true)}
                qa="dash-flight-groups-editor-open"
            >
                {label}
            </Button>
        );

    return (
        <div
            className={b({
                mobileInline: variant === 'mobile-inline',
                mobileFloat: variant === 'mobile-float',
            })}
        >
            {trigger}
            <FlightGroupsEditorDialog open={open} onClose={handleDialogClose} />
        </div>
    );
};
