import {expect} from '@playwright/test';

import {
    ChartkitMenuDialogsQA,
    ChartKitQa,
    WizardPageQa,
    WizardVisualizationId,
} from '../../../../../src/shared';
import {PlaceholderName} from '../../../../page-objects/wizard/SectionVisualization';
import WizardPage from '../../../../page-objects/wizard/WizardPage';
import {openTestPage, slct} from '../../../../utils';
import datalensTest from '../../../../utils/playwright/globalTestDefinition';

/**
 * Проверка, что после изменения размера таблицы (S/M/L) в настройках чарта
 * сводная таблица по-прежнему загружается без ошибки 400 (RESERVED_PARAM_KEYS.size).
 */
datalensTest.describe('Wizard', () => {
    datalensTest.describe('Pivot table', () => {
        datalensTest.beforeEach(async ({page, config}) => {
            await openTestPage(page, config.wizard.urls.WizardBasicDataset);
            const wizardPage = new WizardPage({page});
            await wizardPage.setVisualization(WizardVisualizationId.PivotTable);
        });

        datalensTest(
            'Changing table size in chart settings does not cause error (no 400)',
            async ({page}) => {
                const wizardPage = new WizardPage({page});
                const chartContainer = page.locator(slct(WizardPageQa.SectionPreview));
                const previewLoader = chartContainer.locator(slct(ChartKitQa.Loader));
                const errorBlock = chartContainer.locator(slct(ChartkitMenuDialogsQA.chartError));

                await wizardPage.sectionVisualization.addFieldByClick(
                    PlaceholderName.PivotTableColumns,
                    'country',
                );
                await wizardPage.sectionVisualization.addFieldByClick(
                    PlaceholderName.Measures,
                    'Sales',
                );
                await expect(previewLoader).not.toBeVisible();

                await wizardPage.chartSettings.open();
                await wizardPage.chartSettings.selectTableSize('S');
                await wizardPage.chartSettings.apply();
                await expect(previewLoader).not.toBeVisible({timeout: 10000});
                await expect(errorBlock).not.toBeVisible();

                await wizardPage.chartSettings.open();
                await wizardPage.chartSettings.selectTableSize('L');
                await wizardPage.chartSettings.apply();
                await expect(previewLoader).not.toBeVisible({timeout: 10000});
                await expect(errorBlock).not.toBeVisible();

                const table = wizardPage.chartkit.getTableLocator();
                await expect(table).toBeVisible();
            },
        );

        datalensTest(
            'Columns, measures and size change: table loads without error',
            async ({page}) => {
                const wizardPage = new WizardPage({page});
                const chartContainer = page.locator(slct(WizardPageQa.SectionPreview));
                const previewLoader = chartContainer.locator(slct(ChartKitQa.Loader));
                const errorBlock = chartContainer.locator(slct(ChartkitMenuDialogsQA.chartError));

                await wizardPage.sectionVisualization.addFieldByClick(
                    PlaceholderName.Rows,
                    'country',
                );
                await wizardPage.sectionVisualization.addFieldByClick(
                    PlaceholderName.PivotTableColumns,
                    'category',
                );
                await wizardPage.sectionVisualization.addFieldByClick(
                    PlaceholderName.Measures,
                    'Sales',
                );
                await expect(previewLoader).not.toBeVisible();
                await expect(errorBlock).not.toBeVisible();

                await wizardPage.sectionVisualization.addFieldByClick(
                    PlaceholderName.Measures,
                    'Profit',
                );
                await expect(previewLoader).not.toBeVisible({timeout: 10000});

                await wizardPage.chartSettings.open();
                await wizardPage.chartSettings.selectTableSize('M');
                await wizardPage.chartSettings.apply();
                await expect(previewLoader).not.toBeVisible({timeout: 10000});
                await expect(errorBlock).not.toBeVisible();

                const table = wizardPage.chartkit.getTableLocator();
                await expect(table).toBeVisible();
            },
        );
    });
});
