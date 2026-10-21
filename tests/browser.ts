import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';

// A small harness for driving the REAL app in a real browser from Vitest
// (Playwright as a library, as in Practice Compass). Each journey gets its own
// browser context, so its own localStorage. A missing browser is a FAILURE,
// never a skip: an unverified journey is not a passing one.

export type Engine = 'chromium' | 'webkit';
const ENGINES = { chromium, webkit };
const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const SHOTS = join(ROOT, 'test-results', 'screens');

/** The phones Tell is designed for: iPhone 15/16 and the small iPhone SE. */
export const PHONE = { width: 390, height: 844 };
export const SMALL_PHONE = { width: 375, height: 667 };

export async function startApp() {
  const cacheDir = mkdtempSync(join(tmpdir(), 'tell-vite-'));
  const server = await createServer({
    root: ROOT,
    cacheDir,
    logLevel: 'error',
    clearScreen: false,
    server: { port: 0, strictPort: false },
  });
  await server.listen();
  const url = server.resolvedUrls!.local[0];
  return {
    url,
    async close() {
      await server.close();
      rmSync(cacheDir, { recursive: true, force: true });
    },
  };
}

export interface Session {
  page: Page;
  errors: string[];
  shot(name: string): Promise<void>;
  close(): Promise<void>;
}

export async function openApp(
  engine: Engine,
  url: string,
  opts: { time: Date; colorScheme?: 'light' | 'dark'; viewport?: { width: number; height: number } },
): Promise<Session> {
  let browser: Browser;
  try {
    browser = await ENGINES[engine].launch();
  } catch (e) {
    throw new Error(`Playwright ${engine} is not installed: run \`npx playwright install ${engine}\`. This check never skips.\n${e}`);
  }
  const scheme = opts.colorScheme ?? 'light';
  const context = await browser.newContext({
    viewport: opts.viewport ?? PHONE,
    deviceScaleFactor: 2,
    hasTouch: true,
    colorScheme: scheme,
    locale: 'en-GB',
    timezoneId: 'Europe/London',
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.clock.install({ time: opts.time });
  await page.goto(url);
  mkdirSync(SHOTS, { recursive: true });
  return {
    page,
    errors,
    shot: (name) =>
      page.screenshot({ path: join(SHOTS, `${engine}-${scheme}-${name}.png`), animations: 'disabled' }).then(() => undefined),
    close: () => browser.close(),
  };
}

/** Nothing on the page, or in <main>, may scroll sideways on a phone. */
export const overflowsSideways = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main');
    return document.documentElement.scrollWidth > window.innerWidth + 1 || (!!main && main.scrollWidth > main.clientWidth + 1);
  });

/** Only <main> scrolls: the page itself never does. */
export const pageScrolls = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 1);

/** Controls smaller than 44px in either direction (inline text links excepted). */
export const smallTargets = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, input, textarea, select, summary, a.btn, a.tab, a.cell-head, a.card')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44);
      })
      .map((el) => `${el.tagName.toLowerCase()} “${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)}” ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`),
  );
