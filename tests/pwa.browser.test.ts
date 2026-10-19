import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { build, preview } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PHONE, SMALL_PHONE } from './browser';

// The PRODUCTION build, as shipped: its CSP, its service worker, offline use,
// and the backup path. The dev-server journeys can't see any of these.
// Offline needs a service worker, which Playwright runs in Chromium only, so
// WebKit checks the CSP and Export → Restore.

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

describe.each([
  ['chromium', PHONE],
  ['chromium', SMALL_PHONE],
  ['webkit', PHONE],
  ['webkit', SMALL_PHONE],
] as const)('production build (%s, %o)', (engine, viewport) => {
  it('runs under its CSP, works offline where it can, and round-trips a backup', async () => {
    const browser = await (engine === 'chromium' ? chromium : webkit).launch();
    try {
      const context = await browser.newContext({ viewport, acceptDownloads: true, locale: 'en-GB', timezoneId: 'Europe/London' });
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
      await page.getByRole('heading', { name: 'Pick a situation' }).waitFor();
      expect(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')).toContain("connect-src 'self'");

      if (engine === 'chromium') {
        // Install: the worker activates, and the next load is under its control.
        await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
        await page.reload();
        expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
      }

      // Play a situation to its end.
      await page.getByRole('link', { name: /The winter order/ }).click();
      await page.locator('button.option').first().click();
      await page.getByRole('heading', { name: 'What you did' }).waitFor();

      if (engine === 'chromium') {
        // Offline, the app and the play are still there.
        await context.setOffline(true);
        await page.reload();
        await page.getByRole('heading', { name: 'What you did' }).waitFor();
        await page.getByRole('link', { name: 'Map', exact: true }).click();
        await page.getByRole('heading', { name: 'What you chose' }).waitFor();
        await context.setOffline(false);
      }

      // Export a backup, then restore it through the same validation door.
      await page.getByRole('link', { name: 'About', exact: true }).click();
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export a backup' }).click()]);
      expect(download.suggestedFilename()).toMatch(/^tell-backup-\d{4}-\d{2}-\d{2}\.json$/);
      const file = (await download.path())!;
      const backup = JSON.parse(readFileSync(file, 'utf8'));
      expect(backup.plays).toHaveLength(1);

      await page.evaluate(() => localStorage.clear());
      await page.reload();
      page.once('dialog', (d) => {
        expect(d.message()).toBe('Restore this backup of 1 play?');
        void d.accept();
      });
      await page.getByLabel('Backup file').setInputFiles(file);
      await page.getByText('Restored.').waitFor();
      expect(JSON.parse((await page.evaluate(() => localStorage.getItem('tell')))!)).toEqual(backup);

      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  });
});
