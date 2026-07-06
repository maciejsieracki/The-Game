/**
 * Playwright: zapis 8 PNG (Minecraft + Roblox x 4 widoki) z Legionista-Minecraft-vs-Roblox.html
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dir, '../../Civ-UNITS/Legionista-Minecraft-vs-Roblox.html');
const outDir = resolve(__dir, '../../Civ-UNITS/style-compare');

const styles = ['minecraft', 'roblox'];
const views = ['front', 'back', 'left', 'right'];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`);
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 60000 });

  const exports = await page.evaluate(() => window.__styleCompareExports ?? {});

  for (const style of styles) {
    for (const view of views) {
      const key = `${style}-${view}`;
      const dataUrl = exports[key];
      const filename = `${style}-legionista-${view}.png`;
      const filepath = resolve(outDir, filename);
      if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
        const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        await writeFile(filepath, Buffer.from(b64, 'base64'));
        console.log('OK', filepath);
      } else {
        const sel = `#img-${style}-${view}`;
        const el = page.locator(sel);
        await el.screenshot({ path: filepath, type: 'png' });
        console.log('OK (screenshot)', filepath);
      }
    }
  }

  await browser.close();
  console.log('Done:', outDir);
}

main().catch(e => { console.error(e); process.exit(1); });
