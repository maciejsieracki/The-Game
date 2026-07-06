/**
 * Eksport referencyjnych assetów review (MASTER prep)
 * node gra/tools/export-figma-review-assets.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const JOBS = [
  {
    html: join(ROOT, 'docs/ux/figma/02-icons/preview-tier1-5.html'),
    out: join(ROOT, 'docs/ux/figma/02-icons/preview-tier1-5.png'),
    sel: '#export-sheet',
    viewport: { width: 1280, height: 900 },
  },
  {
    html: join(ROOT, 'docs/ux/figma/grupa-E/E-01-PO-REFERENCJA.html'),
    out: join(ROOT, 'docs/ux/figma/grupa-E/export/E-01_po_REFERENCJA-MASTER.png'),
    sel: '#frame-e01',
    viewport: { width: 1920, height: 1080 },
  },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const job of JOBS) {
    const outDir = dirname(job.out);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const url = 'file:///' + job.html.replace(/\\/g, '/').replace(/ /g, '%20');
    const page = await browser.newPage({ viewport: job.viewport });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(500);
    await page.locator(job.sel).screenshot({ path: job.out, type: 'png' });
    console.log('OK', job.out.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
