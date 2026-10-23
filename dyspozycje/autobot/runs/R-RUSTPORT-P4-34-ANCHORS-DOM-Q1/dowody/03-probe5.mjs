// R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 probe: canvas measureText of words given as JSON [[font, text], ...] (kerning scale at 9.1666667 px).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ASSETS = new URL('../../../../../rust-port/renderer/assets/', import.meta.url).pathname;
const FACE_FILES = [['CivLiberationSans','400','fonts/LiberationSans-Regular.ttf'],['CivLiberationSans','700','fonts/LiberationSans-Bold.ttf'],['CivDejaVuSans','400','fonts/DejaVuSans.ttf'],['CivDejaVuSans','700','fonts/DejaVuSans-Bold.ttf'],['CivNotoEmoji','400','emoji/NotoColorEmoji-civ-subset.ttf']];
const faces = FACE_FILES.map(([fam, w, file]) => [fam, w, readFileSync(ASSETS + file).toString('base64')]);
const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage();
await page.setContent(`<!DOCTYPE html><html><body></body></html>`);
const words = JSON.parse(process.argv[2]);
const res = await page.evaluate(async ({ faces, words }) => {
  for (const [fam, w, b64] of faces) { const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const f = new FontFace(fam, bin, { weight: w }); await f.load(); document.fonts.add(f); }
  const c = document.createElement('canvas').getContext('2d');
  return words.map(([font, t]) => { c.font = font; return [font, t, c.measureText(t).width]; });
}, { faces, words });
for (const r of res) console.log(r.join(' | '));
await browser.close();
