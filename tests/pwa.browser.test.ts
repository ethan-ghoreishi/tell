import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PHONE } from './browser';

// The PRODUCTION build, as shipped: its CSP, its service worker, offline use,
// and the backup path. The dev-server journeys can't see any of these.
// Chromium only: Playwright's WebKit doesn't run service workers.

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let server: Awaited<ReturnType<typeof preview>>;
let url: string;

beforeAll(async () => {
  await build({ root: ROOT, logLevel: 'error' });
  server = await preview({ root: ROOT, logLevel: 'error', preview: { port: 0, strictPort: false } });
  url = server.resolvedUrls!.local[0];
});
afterAll(async () => {
  await new Promise<void>((resolve) => server?.httpServer.close(() => resolve()));
});

describe('production build (chromium)', () => {
  it('runs under its CSP, works offline after install, and round-trips a backup', async () => {
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({ viewport: PHONE, acceptDownloads: true, locale: 'en-GB', timezoneId: 'Europe/London' });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) => {
          console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`);
        });
      });

      await page.goto(url);
      await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
      expect(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')).toContain("connect-src 'self'");

      // Install: the worker activates, and the next load is under its control.
      await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
      await page.reload();
      expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

      // Play an experiment, then carry on offline.
      await page.getByRole('button', { name: 'Start today’s set' }).click();
      await page.getByRole('button', { name: 'Skip the guess' }).click();
      for (let i = 0; i < 3; i++) await page.locator('.option').first().click();
      await page.locator('.reveal').waitFor();
      await context.setOffline(true);
      await page.reload();
      await page.getByText('Experiment 2 of 3').waitFor();
      await context.setOffline(false);

      // Export a backup, then restore it through the same validation door.
      await page.getByRole('link', { name: 'About', exact: true }).click();
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export a backup' }).click()]);
      expect(download.suggestedFilename()).toMatch(/^tell-backup-\d{4}-\d{2}-\d{2}\.json$/);
      const file = (await download.path())!;
      expect(JSON.parse(readFileSync(file, 'utf8')).runs).toHaveLength(1);

      page.once('dialog', (d) => {
        expect(d.message()).toContain('Restore this backup of 1 experiment and 0 calls?');
        void d.accept();
      });
      await page.getByLabel('Backup file').setInputFiles(file);
      await page.getByText('Restored.').waitFor();

      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  });
});
