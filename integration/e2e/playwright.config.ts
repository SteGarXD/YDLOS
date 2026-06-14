import {defineConfig} from '@playwright/test';

export default defineConfig({
    testDir: '.',
    timeout: 420_000,
    expect: {timeout: 120_000},
    use: {
        baseURL: process.env.BI_BASE_URL ?? 'https://<your-bi-domain>',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    reporter: [['list'], ['html', {open: 'never'}]],
});
