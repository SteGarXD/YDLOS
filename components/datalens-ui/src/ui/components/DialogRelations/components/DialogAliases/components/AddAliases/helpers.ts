import type {DatasetsListData} from '../../../../types';

/**
 * Check if new alias is in current aliases row,
 * ex: newAlias = ['City_ds_1', 'City_ds_3'] and currentAliasRow = ['City_ds_1', 'City_ds_2', 'City_ds_3']
 * in such case currentAliasRow contains newAlias fully
 * @param currentAliasRow
 * @param newAlias
 */
export const isAddingAliasExists = (currentAliasRow: string[], newAlias: string[]) => {
    if (currentAliasRow.length < newAlias.length) {
        return false;
    }

    const currentAliasDict: Record<string, string> = {};
    currentAliasRow.forEach((item) => {
        currentAliasDict[item] = item;
    });

    let counter = 0;
    newAlias.forEach((item) => {
        if (item in currentAliasDict) {
            counter++;
        }
    });

    return counter === newAlias.length;
};

/**
 * We prevent adding new alias in selected fields in the same dataset, no need check it again,
 * but we still need to check if we add alias that connection already added separate aliases for the same dataset
 * ex. old aliases = [['City1', 'City2'], ['Year1', 'Year3']], dataset1 contains City1 and Year1,
 * and when add alias ['City2', 'Year3'] we receive resulted addedAliases = ['City1', 'City2', 'Year1', 'Year3'],
 * but there is no sense to add different fields of one dataset, so we throw error
 * @param addedAliases
 * @param datasets
 */
export const hasAliasWithSameDataset = (
    addedAliases: string[][],
    datasets: DatasetsListData | null,
) => {
    if (!datasets) {
        return false;
    }
    const datasetsFields: Record<string, Record<string, string>> = {};
    for (const [datasetId, datasetData] of Object.entries(datasets)) {
        datasetsFields[datasetId] = datasetData.fields.reduce((previousValue, currentValue) => {
            return {...previousValue, [currentValue.guid]: currentValue.guid};
        }, {});
    }

    const datasetEntries = Object.entries(datasetsFields);
    for (let i = 0; i < addedAliases.length; i++) {
        // no need to check aliases contains of 2 fields (already checked the, earlier) with addAlias helper
        if (addedAliases[i].length < 3) {
            continue;
        }

        const fieldsByDataset: Record<string, string[]> = {};
        let hasErrors = false;

        for (let j = 0; j < addedAliases[i].length; j++) {
            const field = addedAliases[i][j];
            for (const [id, datasetFields] of datasetEntries) {
                if (field in datasetFields) {
                    if (fieldsByDataset[id]) {
                        fieldsByDataset[id].push(field);
                        hasErrors = true;
                    } else {
                        fieldsByDataset[id] = [field];
                    }
                }
            }
        }

        if (hasErrors) {
            const perDatasetFieldCounts = Object.values(fieldsByDataset).map((f) => f.length);
            const countTwos = perDatasetFieldCounts.filter((c) => c === 2).length;
            const countOnes = perDatasetFieldCounts.filter((c) => c === 1).length;
            const countGt2 = perDatasetFieldCounts.filter((c) => c > 2).length;
            // Селектор даты + dt1/dt2 из одного чарта: addAlias сливает [ds,dt1] и [ds,dt2] в одну группу.
            // Раньше это блокировалось как «два поля одного датасета»; для «один датасет ×2 поля, остальные ×1» — разрешаем.
            const isDateRangeSplitStyleGroup =
                addedAliases[i].length >= 3 &&
                countGt2 === 0 &&
                countTwos === 1 &&
                countOnes === perDatasetFieldCounts.length - 1;

            if (isDateRangeSplitStyleGroup) {
                continue;
            }

            return {
                alias: addedAliases[i],
                errors: Object.values(fieldsByDataset).reduce((memo, fields) => {
                    if (fields.length > 1) {
                        memo.push(...fields);
                    }

                    return memo;
                }, []),
            };
        }
    }

    return false;
};

export const getParamsSelectOptions = (item: string) => ({content: item, value: item});
