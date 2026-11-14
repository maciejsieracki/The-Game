'use strict';
/**
 * R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1 — punkt 1 (W18): machiny oblężnicze w panelu rekrutacji
 * PRZED i PO odkryciu technologii (w żywej grze, ?civTest=1). PO = window.__civTest.unlockAllTech() (jedyny dostępny hak;
 * nie izoluje „Obróbki drewna”, odnotowane w raporcie).
 * Usage: ROBOCZA_HTML=<index.html z vite build> EVID_DIR=<katalog> node tools/live-verify-w18-w24-manual-losses-w18.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');
const fs = require('fs');
const path = require('path');
const { wait } = C;

const SIEGE_RE = /Taran|Wieża oblężnicza|Katapult|Balist|Machin|oblęż/i;

async function openRecruit(page) {
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^(Wróć|Zamknij)$/.test((x.textContent || '').trim())); if (b) b.click(); });
  await wait(400);
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^Rekrutacja$/.test((x.textContent || '').trim())); if (b) b.click(); });
  await wait(1200);
}

async function readRecruit(page) {
  return page.evaluate(() => {
    const h = Array.from(document.querySelectorAll('*')).find((el) => el.children.length === 0 && /Rekrutacja — cała cywilizacja/.test(el.textContent || ''));
    let root = h; for (let i = 0; i < 4 && root && root.parentElement; i++) root = root.parentElement;
    const t = root ? root.innerText : '';
    const lines = t.split('\n').map((l) => l.trim()).filter(Boolean);
    const start = lines.indexOf('Generał rekrutujący');
    const names = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === "Rekrutuj" && i >= 6) names.push(lines[i - 6]);
    }
    return { names, siegeHits: lines.filter((l) => /Taran|Wieża|Katapult|Balist|Machin|oblęż/i.test(l)), sample: lines.slice(Math.max(0, start), start + 40) };
  });
}

(async () => {
  const browser = await C.launch();
  const out = { phase: {} };
  try {
    const s = await C.openMenu(browser);
    const page = s.page;
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(page);
    await C.foundCapital(page);
    await wait(1500);
    await openRecruit(page);
    out.phase.przed = await readRecruit(page);
    await page.screenshot({ path: path.join(C.EVID, 'w18-przed-tech-rekrutacja.png') });
    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^Zamknij$/.test((x.textContent || '').trim())); if (b) b.click(); });
    await wait(400);
    await page.evaluate(() => window.__civTest.unlockAllTech());
    await wait(800);
    await openRecruit(page);
    out.phase.po = await readRecruit(page);
    await page.screenshot({ path: path.join(C.EVID, 'w18-po-tech-rekrutacja.png') });
  } catch (e) { out.error = e.stack; }
  await browser.close();
  fs.mkdirSync(C.EVID, { recursive: true });
  fs.writeFileSync(path.join(C.EVID, 'w18-rekrutacja.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
})();
