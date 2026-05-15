import React from 'react';

import type {DashKit} from '@gravity-ui/dashkit';
import isEmpty from 'lodash/isEmpty';
import type {DashTabItem, WorkbookId} from 'shared';
import {DashTabItemType} from 'shared';

import type {GetEntriesDatasetsFieldsResponse} from '../../../../shared/schema';
import {getSdk} from '../../../libs/schematic-sdk';
import {getRowTitle} from '../components/Content/helpers';
import {DEFAULT_ALIAS_NAMESPACE} from '../constants';
import type {
    AliasContextProps,
    ConnectionsData,
    DashkitMetaData,
    DashkitMetaDataItem,
    DatasetsListData,
} from '../types';

import {
    getCurrentWidgetMeta,
    getMetaDataWithDatasetInfo,
    getPreparedMetaData,
    getRelationsData,
} from './helpers';

export const AliasesContext = React.createContext<AliasContextProps>({} as AliasContextProps);

export const useRelations = ({
    dashKitRef,
    widget,
    dialogAliases,
    workbookId,
    itemId,
    widgetsCurrentTab,
}: {
    dashKitRef: React.RefObject<DashKit>;
    widget: DashTabItem | null;
    dialogAliases: Record<string, string[][]>;
    workbookId: WorkbookId;
    itemId: string | null;
    widgetsCurrentTab: Record<string, string>;
}) => {
    const [isInited, setIsInited] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [relations, setRelations] = React.useState<Array<DashkitMetaDataItem>>([]);
    const [currentWidgetMeta, setCurrentWidgetMeta] = React.useState<DashkitMetaDataItem | null>(
        null,
    );
    const [invalidAliases, setInvalidAliases] = React.useState<string[]>([]);

    const [dashWidgetsMeta, setDashWidgetsMeta] = React.useState<
        Omit<DashkitMetaDataItem, 'relations'>[] | null
    >(null);
    const [datasets, setDatasets] = React.useState<DatasetsListData | null>(null);

    const [prevItemId, setPrevItemId] = React.useState(itemId);
    const [prevWidgetId, setPrevWidgetId] = React.useState(widget?.id ?? null);

    const getCurrentWidgetInfo = React.useCallback(
        (
            dashWidgetsMetaData: Omit<DashkitMetaDataItem, 'relations'>[],
            datasetsList: DatasetsListData,
        ) => {
            if (!dashKitRef?.current || !widget) {
                return;
            }

            const {connections} = dashKitRef.current.props.config;

            const widgetCurrentTabId = widgetsCurrentTab[widget.id];

            const currentMeta = getCurrentWidgetMeta({
                metaData: dashWidgetsMetaData,
                dashkitData: dashKitRef.current,
                widget,
                itemId,
                tabId: widgetCurrentTabId,
            });
            if (!currentMeta || (!currentMeta.widgetId && !currentMeta.itemId)) {
                setCurrentWidgetMeta(null);
                setRelations([]);
                return;
            }

            const currentRelations = getRelationsData({
                metaData: dashWidgetsMetaData,
                widgetMeta: currentMeta,
                aliases: dialogAliases,
                connections: connections as ConnectionsData,
                datasets: datasetsList,
            });

            // GroupControl: some meta payloads include an aggregate row with widgetId of the group and no itemId.
            // For a selected selector item this row behaves like a self-link shadow and later causes unstable links.
            const selectedGroupItemTitle =
                widget.type === DashTabItemType.GroupControl && itemId
                    ? widget.data.group.find((g) => g.id === itemId)?.title || ''
                    : '';
            const currentMetaId = currentMeta.itemId || currentMeta.widgetId || '';
            const currentMetaTitle = String(currentMeta.title || currentMeta.label || '').trim();
            const currentMetaUsedParams = new Set((currentMeta.usedParams || []).filter(Boolean));
            const safeRelations =
                widget.type === DashTabItemType.GroupControl && itemId
                    ? currentRelations.filter((rel) => {
                          const relId = rel.itemId || rel.widgetId || '';
                          const relTitle = String(rel.title || rel.label || '').trim();
                          const relUsedParams = (rel.usedParams || []).filter(Boolean);
                          const hasSameParamSignature =
                              currentMetaUsedParams.size > 0 &&
                              relUsedParams.length > 0 &&
                              relUsedParams.every((p) => currentMetaUsedParams.has(p)) &&
                              relUsedParams.length === currentMetaUsedParams.size;

                          // Hard-stop self links even if meta returns mixed ids for group selectors.
                          if (
                              relId === currentMetaId ||
                              (currentMetaTitle &&
                                  relTitle &&
                                  currentMetaTitle === relTitle &&
                                  hasSameParamSignature)
                          ) {
                              return false;
                          }

                          if (rel.itemId === itemId) {
                              return false;
                          }
                          if (
                              !rel.itemId &&
                              rel.widgetId === widget.id &&
                              selectedGroupItemTitle &&
                              (rel.title === selectedGroupItemTitle ||
                                  rel.label === selectedGroupItemTitle)
                          ) {
                              return false;
                          }
                          return true;
                      })
                    : currentRelations;

            setCurrentWidgetMeta(currentMeta);
            setRelations(safeRelations);
        },
        [dashKitRef, dialogAliases, itemId, widget, widgetsCurrentTab],
    );

    /**
     * Смена виджета / пункта группы после загрузки меты: только пересчёт связей (без повторного getItemsMeta).
     * Раньше это выполнялось синхронно во время render — React предупреждал и при закрытии диалога
     * во время async-инициализации срабатывали setState на размонтированном компоненте.
     */
    React.useEffect(() => {
        if (!isInited || !dashWidgetsMeta || !datasets || !widget) {
            return;
        }
        if (itemId === prevItemId && widget.id === prevWidgetId) {
            return;
        }
        getCurrentWidgetInfo(dashWidgetsMeta, datasets);
        setPrevWidgetId(widget.id);
        setPrevItemId(itemId);
    }, [
        isInited,
        itemId,
        prevItemId,
        prevWidgetId,
        widget,
        dashWidgetsMeta,
        datasets,
        getCurrentWidgetInfo,
    ]);

    React.useEffect(() => {
        let cancelled = false;

        const getMetaData = async () => {
            if (!dashKitRef?.current || !widget) {
                return;
            }

            setIsLoading(true);
            try {
                const data = (await Promise.all(dashKitRef.current.getItemsMeta())) as DashkitMetaData;
                if (cancelled) {
                    return;
                }
                const {metaData, datasetsList, entriesList, controlsList} = getPreparedMetaData(
                    data,
                    dashKitRef.current,
                );

                let entriesDatasetsFields: GetEntriesDatasetsFieldsResponse = [];
                if (!isEmpty(entriesList) && (!isEmpty(datasetsList) || !isEmpty(controlsList))) {
                    // TODO does not return the dataType of the field (to study whether it is needed in the links)
                    entriesDatasetsFields = await getSdk().sdk.mix.getEntriesDatasetsFields({
                        entriesIds: entriesList,
                        datasetsIds: Object.keys(datasetsList),
                        workbookId,
                    });
                }
                if (cancelled) {
                    return;
                }
                const dashWidgetsMetaData = entriesDatasetsFields.length
                    ? getMetaDataWithDatasetInfo({
                          metaData,
                          entriesDatasetsFields,
                          datasetsList,
                      })
                    : metaData;

                dashWidgetsMetaData.sort((prevItem, item) => {
                    const prevItemTitle = getRowTitle(prevItem.title, prevItem.label);
                    const itemTitle = getRowTitle(item.title, item.label);
                    return prevItemTitle.localeCompare(itemTitle);
                });

                const fetchedDatasets =
                    entriesDatasetsFields?.filter((item) => item.type === 'dataset') || [];

                if (fetchedDatasets?.length) {
                    fetchedDatasets.forEach((datasetItem) => {
                        if (datasetItem.datasetId && datasetItem.datasetId in datasetsList) {
                            const datasetListItem = datasetsList[datasetItem.datasetId];
                            if (!datasetListItem.name && datasetItem.datasetName) {
                                datasetListItem.name = datasetItem.datasetName;
                            }
                            if (!datasetListItem.fields && datasetItem.datasetFields) {
                                datasetListItem.fields = datasetItem.datasetFields;
                            }
                        }
                    });
                }

                const allUsedParams = dashWidgetsMetaData.reduce<Set<string>>((result, item) => {
                    (item.usedParams || []).forEach(result.add, result);
                    Object.keys(item.widgetParams || {}).forEach(result.add, result);

                    return result;
                }, new Set());

                const invalidAliasesData: string[] = [];
                if (DEFAULT_ALIAS_NAMESPACE in dialogAliases) {
                    dialogAliases[DEFAULT_ALIAS_NAMESPACE].forEach((aliasRow) => {
                        aliasRow.forEach((item) => {
                            if (!allUsedParams.has(item)) {
                                invalidAliasesData.push(item);
                            }
                        });
                    });
                }

                if (cancelled) {
                    return;
                }

                getCurrentWidgetInfo(dashWidgetsMetaData, datasetsList);

                setIsInited(true);
                setIsLoading(false);
                setDatasets(datasetsList);
                setDashWidgetsMeta(dashWidgetsMetaData);
                setInvalidAliases(invalidAliasesData);
            } catch {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        if (!isInited && dashKitRef?.current && widget) {
            void getMetaData();
        }

        return () => {
            cancelled = true;
        };
    }, [dashKitRef, isInited, widget, itemId, dialogAliases, workbookId, getCurrentWidgetInfo]);

    return {isLoading, relations, currentWidgetMeta, datasets, dashWidgetsMeta, invalidAliases};
};
