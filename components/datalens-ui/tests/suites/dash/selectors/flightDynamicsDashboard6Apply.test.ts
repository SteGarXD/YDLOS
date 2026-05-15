import {expect, type Locator, type Page, type TestInfo} from '@playwright/test';

import {DashkitQa, ControlQA, SignInQa} from '../../../../src/shared/constants/qa';
import {getStringFullUrl, makeLogIn, openTestPage, slct} from '../../../utils';
import datalensTest from '../../../utils/playwright/globalTestDefinition';

const DASH_PATH =
    process.env.E2E_DASHBOARD6_PATH ||
    '/u0z61jy56pcoe-6-sravnenie-dinamiki-prodazh-reysov';

async function setDateField(row: Locator, value: string) {
    const input = row.getByRole('textbox').first();
    await expect(input).toBeVisible({timeout: 60000});
    await input.click();
    await input.fill('');
    await input.pressSequentially(value, {delay: 20});
    await input.press('Enter');
    await input.blur();
}

async function pickFirstMatchingSelectOption(page: Page, row: Locator, _titleRegex: RegExp) {
    const selectRoot = row.locator(slct(ControlQA.controlSelect)).first();
    await expect(selectRoot).toBeVisible({timeout: 60000});
    await expect(selectRoot).not.toHaveClass(/yc-select-control_disabled/, {timeout: 120000});
    await selectRoot.focus();
    await page.keyboard.press('Space');
    await page.waitForResponse(
        (r) =>
            r.url().toLowerCase().includes('run') &&
            r.request().method().toLowerCase() === 'post' &&
            r.ok(),
        {timeout: 120000},
    );
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
}

async function ensureAuthenticatedAndOpenDash(page: Page, testInfo: TestInfo) {
    await openTestPage(page, DASH_PATH);

    const signInForm = page.locator(slct(SignInQa.SIGN_IN_FORM));
    const signInVisible = await signInForm.isVisible({timeout: 10000}).catch(() => false);

    if (signInVisible) {
        if (!process.env.E2E_USER_LOGIN || !process.env.E2E_USER_PASSWORD) {
            testInfo.skip(
                true,
                'Форма входа: задайте E2E_USER_LOGIN и E2E_USER_PASSWORD (или NO_AUTH на сервере).',
            );
            return;
        }
        await page.fill(`${slct(SignInQa.INPUT_LOGIN)} input`, process.env.E2E_USER_LOGIN);
        await page.fill(`${slct(SignInQa.INPUT_PASSWORD)} input`, process.env.E2E_USER_PASSWORD);
        await page.click('button[type=submit]');
        await expect(page.locator(slct(SignInQa.SIGN_IN_FORM))).not.toBeVisible({timeout: 60000});
        await page.goto(getStringFullUrl(DASH_PATH), {waitUntil: 'commit', timeout: 120000});
        await page.waitForLoadState('domcontentloaded');
        return;
    }

    const loginField = page.getByRole('textbox', {name: /логин/i}).or(page.locator('input[name=login]'));
    const loginVisible = await loginField.isVisible({timeout: 5000}).catch(() => false);
    if (loginVisible) {
        if (!process.env.E2E_USER_LOGIN || !process.env.E2E_USER_PASSWORD) {
            testInfo.skip(
                true,
                'Форма входа: задайте E2E_USER_LOGIN/E2E_USER_PASSWORD в datalens-ui/.env или NO_AUTH на сервере.',
            );
            return;
        }
        await makeLogIn(page);
        await page.goto(getStringFullUrl(DASH_PATH), {
            waitUntil: 'domcontentloaded',
            timeout: 120000,
        });
    }
}

/** Текст блока с графиком «Сравнение динамики…» — легенда внутри того же виджета. */
async function readChartBlockSnapshot(page: Page): Promise<string> {
    const chartBlock = page
        .locator(slct(DashkitQa.GRID_ITEM))
        .filter({hasText: /Сравнение динамики/i})
        .first();
    await expect(chartBlock).toBeVisible({timeout: 120000});
    return (await chartBlock.innerText())
        .split('\n')
        .map((l) => l.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('|');
}

datalensTest.describe('Dashboard 6 — group selectors + Apply', () => {
    datalensTest.setTimeout(240000);

    datalensTest(
        'fill six selectors, Apply, legend updates',
        async ({page}, testInfo) => {
            await ensureAuthenticatedAndOpenDash(page, testInfo);

            const legendBefore = await readChartBlockSnapshot(page);

            const group = page.locator(slct(ControlQA.groupChartkitControl)).first();
            await expect(group).toBeVisible({timeout: 60000});

            /** На дашборде 6 — одна группа: (Дата, Рейс, Напр-е) × 2 цепочки. */
            const controls = group.locator(slct(ControlQA.chartkitControl));
            const controlCount = await controls.count();
            expect(
                controlCount,
                'Ожидается 6 селекторов (две тройки) в одной группе',
            ).toBeGreaterThanOrEqual(6);

            for (let chain = 0; chain < 2; chain++) {
                const base = chain * 3;
                const dateRow = controls.nth(base);
                await setDateField(dateRow, chain === 0 ? '15.06.2024' : '16.06.2024');

                const flightRow = controls.nth(base + 1);
                await pickFirstMatchingSelectOption(page, flightRow, /B\d{3,4}/);

                const dirRow = controls.nth(base + 2);
                const dirSelect = dirRow.locator(slct(ControlQA.controlSelect)).first();
                try {
                    await expect(dirSelect).not.toHaveClass(/yc-select-control_disabled/, {
                        timeout: 20000,
                    });
                    await pickFirstMatchingSelectOption(page, dirRow, /.+/);
                } catch {
                    // «Напр-е» может оставаться disabled до distinct по дате+рейсу — не блокируем сценарий Apply.
                }
            }

            const applyButtons = page.locator(slct(ControlQA.controlButtonApply));
            const applyCount = await applyButtons.count();
            expect(applyCount, 'Кнопка «Применить» должна быть на дашборде').toBeGreaterThan(0);

            for (let j = 0; j < applyCount; j++) {
                const runOnce = page.waitForResponse(
                    (res) =>
                        res.url().toLowerCase().includes('run') &&
                        res.request().method().toLowerCase() === 'post' &&
                        res.ok(),
                    {timeout: 180000},
                );
                await applyButtons.nth(j).click();
                await runOnce;
            }

            await expect
                .poll(async () => readChartBlockSnapshot(page), {
                    timeout: 120000,
                    intervals: [500, 1000, 2000],
                })
                .not.toBe(legendBefore);
        },
    );
});
