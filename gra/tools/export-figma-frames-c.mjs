/**
 * Eksport frame'ów Grupa C → docs/ux/figma/grupa-C/export/
 * Uruchom: node tools/export-figma-frames-c.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const HTML = join(ROOT, 'docs/ux/figma/grupa-C/FIGMA-FRAMES-C.html');
const OUT = join(ROOT, 'docs/ux/figma/grupa-C/export');

const FRAMES = [
  ['C-01', 'frame-C-01', 'C-01_pre-bitwa.png'],
  ['C-06', 'frame-C-06', 'C-06_deployment.png'],
  ['C-07', 'frame-C-07', 'C-07_pole-bitwy.png'],
  ['C-08', 'frame-C-08', 'C-08_hud-gora-bitwa.png'],
  ['C-09', 'frame-C-09', 'C-09_pasek-komend.png'],
  ['C-19', 'frame-C-19', 'C-19_oblezenie-mur-hud.png'],
  ['C-21', 'frame-C-21', 'C-21_ekran-konca-bitwy.png'],
];

async function main() {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  const url = 'file:///' + HTML.replace(/\\/g, '/').replace(/ /g, '%20');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(800);

  for (const [, id, filename] of FRAMES) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await el.screenshot({ path: join(OUT, filename), type: 'png' });
    console.log('OK', filename);
  }

  await browser.close();
  console.log('\nEksport:', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
