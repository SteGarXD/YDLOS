import {expect, type Page} from '@playwright/test';

import {ChartKitTreeNodeStateQa} from '../../../../src/shared';
import WizardPage from '../../../page-objects/wizard/WizardPage';
import {RobotChartsWizardUrls} from '../../../utils/constants';
import datalensTest from '../../../utils/playwright/globalTestDefinition';
import {openTestPage, slct} from '../../../utils';

/**
 * Path under `E2E_DOMAIN` (pathname and optional `?query`).
 * CI: robot wizard from dump. Local: dashboard with flat row tree, e.g.
 * `/055mqd4bgqgsk-zagruzka-segmentov-reysov` or `...?state=f47f8ee8280`.
 */
const flatTableRowTreePath =
    process.env.E2E_FLAT_TABLE_ROW_TREE_PAGE?.trim() || RobotChartsWizardUrls.FlatTableWithTree;

/**
 * CSS fragment `[data-tree-node='…']` for an exact match.
 * Values are often JSON like `["B2745"]` with double quotes — use single-quoted
 * attribute so the selector is valid (double-quoted attr + inner `"` breaks CSS).
 */
function dataTreeNodeAttr(key: string): string {
    if (!key.includes("'")) {
        return `[data-tree-node='${key.replace(/\\/g, '\\\\')}']`;
    }
    return `[data-tree-node="${key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`;
}

/** Tree toggles: +/- on `button[data-tree-node]` (flat row tree or hierarchy). */
async function pickTwoDistinctTreeKeys(page: Page) {
    const toggles = page.locator('button[data-tree-node]');
    await expect(toggles.first()).toBeVisible({
        timeout: 20_000,
    });

    const count = await toggles.count();
    expect(
        count,
        'Need tree toggle buttons. For a local dashboard set E2E_FLAT_TABLE_ROW_TREE_PAGE to its path (see env_configuration.md).',
    ).toBeGreaterThanOrEqual(2);

    let key0: string | null = null;
    let key1: string | null = null;
    for (let i = 0; i < count; i += 1) {
        const k = await toggles.nth(i).getAttribute('data-tree-node');
        if (!k) {
            continue;
        }
        if (key0 === null) {
            key0 = k;
        } else if (k !== key0) {
            key1 = k;
            break;
        }
    }

    expect(key0, 'First tree node key').toBeTruthy();
    expect(key1, 'Need a second distinct tree node (two parent rows with +/-).').toBeTruthy();

    return {key0: key0!, key1: key1!};
}

async function expandIfClosed(args: {page: Page; key: string; wizardPage: WizardPage}) {
    const {page, key, wizardPage} = args;
    const btn = page.locator(`button${dataTreeNodeAttr(key)}`).first();
    const qa = await btn.getAttribute('data-qa');
    if (qa === ChartKitTreeNodeStateQa.Closed) {
        await btn.click();
        await wizardPage.chartkit.waitUntilLoaderExists();
    }
}

datalensTest.describe('Wizard :: Flat table with tree :: multi expand', () => {
    datalensTest(
        'Expanding two different flights keeps both open (flat row tree / + buttons)',
        async ({page}: {page: Page}) => {
            const wizardPage = new WizardPage({page});
            await openTestPage(page, flatTableRowTreePath);
            await wizardPage.chartkit.waitUntilLoaderExists();

            const {key0, key1} = await pickTwoDistinctTreeKeys(page);

            await expandIfClosed({page, key: key0, wizardPage});
            await expandIfClosed({page, key: key1, wizardPage});

            await expect(
                page.locator(`${slct(ChartKitTreeNodeStateQa.Opened)}${dataTreeNodeAttr(key0)}`),
            ).toBeVisible();
            await expect(
                page.locator(`${slct(ChartKitTreeNodeStateQa.Opened)}${dataTreeNodeAttr(key1)}`),
            ).toBeVisible();
        },
    );
});
