// R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 probe: canvas measureText at fractional font sizes (effective FreeType size).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ASSETS = new URL('../../../../../rust-port/renderer/assets/', import.meta.url).pathname;
const FACE_FILES = [['CivLiberationSans','400','fonts/LiberationSans-Regular.ttf'],['CivLiberationSans','700','fonts/LiberationSans-Bold.ttf'],['CivDejaVuSans','400','fonts/DejaVuSans.ttf'],['CivDejaVuSans','700','fonts/DejaVuSans-Bold.ttf'],['CivNotoEmoji','400','emoji/NotoColorEmoji-civ-subset.ttf']];
const faces = FACE_FILES.map(([fam, w, file]) => [fam, w, readFileSync(ASSETS + file).toString('base64')]);
const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
await page.setContent(`<!DOCTYPE html><html lang="pl"><head><style>* { margin: 0; padding: 0; box-sizing: border-box; }</style></head><body></body></html>`);
const res = await page.evaluate(async ({ faces }) => {
  for (const [fam, w, b64] of faces) { const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const f = new FontFace(fam, bin, { weight: w }); await f.load(); document.fonts.add(f); }
  const FAM = 'CivLiberationSans, CivDejaVuSans, CivNotoEmoji';
  const c = document.createElement('canvas').getContext('2d');
  const out = [];
  for (const fs of [9.09375, 9.1, 9.125, 9.15625, 9.1666667, 9.171875, 9.18, 10, 12.3, 12.296875, 13]) {
    for (const t of ['Stare Miasto na Morawach', 'M', 'Lu']) {
      c.font = `bold ${fs}px ${FAM}`; out.push([fs, t, c.measureText(t).width].join(' | '));
    }
  }
  return out;
}, { faces });
console.log(res.join('\n'));
await browser.close();
