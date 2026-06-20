// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: true,
    reporter: [['list']],
    use: {
        baseURL: 'http://127.0.0.1:4123',
        trace: 'off',
        screenshot: 'only-on-failure'
    },
    projects: [
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
        },
        {
            name: 'mobile',
            use: {
                browserName: 'chromium',
                viewport: { width: 390, height: 844 },
                deviceScaleFactor: 3,
                isMobile: true,
                hasTouch: true,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
            }
        }
    ],
    webServer: {
        // Servidor que emula el cleanUrls de Vercel (ver scripts/static-server.js)
        // para que los tests validen las URLs sin .html igual que en prod.
        command: 'node scripts/static-server.js 4123',
        url: 'http://127.0.0.1:4123/consultoria-ia',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000
    }
});
