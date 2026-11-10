// R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 probe: DOM box heights / text rects for CSS structures given as JSON [[css, html], ...]
// (03-probe-structures.json, 03-probe-lineheights.json). Run: NODE_PATH=... PLAYWRIGHT_BROWSERS_PATH=... node 03-probe2.mjs <json>
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ASSETS = new URL('../../../../../rust-port/renderer/assets/', import.meta.url).pathname;
const FACE_FILES = [['CivLiberationSans','400','fonts/LiberationSans-Regular.ttf'],['CivLiberationSans','700','fonts/LiberationSans-Bold.ttf'],['CivDejaVuSans','400','fonts/DejaVuSans.ttf'],['CivDejaVuSans','700','fonts/DejaVuSans-Bold.ttf'],['CivNotoEmoji','400','emoji/NotoColorEmoji-civ-subset.ttf']];
const faces = FACE_FILES.map(([fam, w, file]) => [fam, w, readFileSync(ASSETS + file).toString('base64')]);
const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
await page.setContent(`<!DOCTYPE html><html lang="pl"><head><style>* { margin: 0; padding: 0; box-sizing: border-box; } body{background:transparent;font-family:monospace}</style></head><body></body></html>`);
const probes = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const res = await page.evaluate(async ({ faces, probes }) => {
  for (const [fam, w, b64] of faces) { const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const f = new FontFace(fam, bin, { weight: w }); await f.load(); document.fonts.add(f); }
  const FAM = 'CivLiberationSans, CivDejaVuSans, CivNotoEmoji';
  return probes.map(([css, html]) => { const el = document.createElement('div'); el.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;' + css; el.style.fontFamily = FAM; el.innerHTML = html; document.body.appendChild(el); const r = el.getBoundingClientRect(); const t=[]; const walk=(n)=>{for(const c of n.childNodes){if(c.nodeType===3){const rg=document.createRange();rg.selectNodeContents(c);for(const q of rg.getClientRects())t.push(q.y+'/'+q.height);}else walk(c);}}; walk(el); el.remove(); return [css, html, r.width, r.height, t.join(',')]; });
}, { faces, probes });
for (const r of res) console.log(r.join(' | '));
await browser.close();
