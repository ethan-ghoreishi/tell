import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Colour is checked by a test, not by eye, against the SHIPPED stylesheet.
// The pairs are written out so an omission is visible. Text needs 4.5:1
// (WCAG AA); the map's bars and progress dots are graphics and need 3:1.

const CSS = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const darkAt = CSS.indexOf('@media (prefers-color-scheme: dark)');
const PALETTES = {
  light: CSS.slice(CSS.indexOf(':root {'), darkAt),
  dark: CSS.slice(darkAt, CSS.indexOf('* {', darkAt)),
};

type RGB = [number, number, number];

function token(block: string, name: string): { rgb: RGB; alpha: number } {
  const m = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`--${name} is not declared in this palette`);
  const value = m[1].trim();
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) return { rgb: [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as RGB, alpha: 1 };
  const rgba = value.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (rgba) return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alpha: Number(rgba[4]) };
  throw new Error(`--${name}: ${value} is not a colour this test can read`);
}

/** A background token, composited over `over` when translucent. */
function background(block: string, name: string, over?: string): RGB {
  const { rgb, alpha } = token(block, name);
  if (alpha === 1) return rgb;
  const base = background(block, over!);
  return rgb.map((c, i) => c * alpha + base[i] * (1 - alpha)) as RGB;
}

const luminance = (rgb: RGB) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = 4.5;
const GRAPHIC = 3;

const PAIRS: { fg: string; bg: string; over?: string; min: number; where: string }[] = [
  { fg: 'text', bg: 'bg', min: TEXT, where: 'body text on the page' },
  { fg: 'text', bg: 'surface', min: TEXT, where: 'scenes and options in a .card' },
  { fg: 'text', bg: 'surface-2', min: TEXT, where: '.card-quiet and then/now boxes' },
  { fg: 'text-dim', bg: 'bg', min: TEXT, where: '.dim / .lede on the page' },
  { fg: 'text-dim', bg: 'surface', min: TEXT, where: '.dim in a .card' },
  { fg: 'text-dim', bg: 'surface-2', min: TEXT, where: 'unselected segments' },
  { fg: 'text-faint', bg: 'bg', min: TEXT, where: '.eyebrow / .faint / tabs on the page' },
  { fg: 'text-faint', bg: 'surface', min: TEXT, where: '.eyebrow in a .card' },
  { fg: 'text-faint', bg: 'surface-2', min: TEXT, where: '.eyebrow in then/now boxes' },
  { fg: 'accent', bg: 'bg', min: TEXT, where: '.link / active tab / picked angle' },
  { fg: 'accent', bg: 'surface', min: TEXT, where: '.pick-mark in a .card' },
  { fg: 'accent', bg: 'accent-soft', over: 'bg', min: TEXT, where: '.chip.on / .keep.on' },
  { fg: 'text', bg: 'accent-soft', over: 'bg', min: TEXT, where: 'the .added box' },
  { fg: 'accent-contrast', bg: 'accent', min: TEXT, where: '.btn-primary' },
  { fg: 'bar-fill', bg: 'bar-track', min: GRAPHIC, where: 'map bars' },
  { fg: 'accent', bg: 'bar-track', min: GRAPHIC, where: 'progress dots' },
];

describe.each(Object.entries(PALETTES))('%s palette', (_, block) => {
  it.each(PAIRS)('$fg on $bg ($where)', ({ fg, bg, over, min }) => {
    const value = ratio(token(block, fg).rgb, background(block, bg, over));
    expect(value, `${value.toFixed(2)}:1`).toBeGreaterThanOrEqual(min);
  });
});
