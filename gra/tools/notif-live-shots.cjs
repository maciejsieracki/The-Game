'use strict';
/**
 * notif-live-shots.cjs — R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 (dowod wizualny w ZYWEJ grze).
 * Startuje prawdziwa gre (Chromium), seeduje istniejacym hakiem `__sidePanelLinkTestDebug.seedEvents`
 * wpisy o ksztalcie produkowanym przez main.ts (hinty EOT: title '', subtitle = tresc) i robi zrzuty
 * panelu WYDARZENIA (.civ-side-panel) w kazdej z 3 zakladek + weryfikuje geometrie (licznik zakladki
 * nie zachodzi na etykiete, przycisk „Zamknij wszystkie informacyjne” jest NAD zakladkami).
 *
 * Usage (z gra/): ROBOCZA_HTML=<index.html> SEED=18 SHOTS_DIR=<katalog> node tools/notif-live-shots.cjs
 */
const fs = require('fs');
const path = require('path');
const C = require('./live-verify-autoimprove-common.cjs');

const SEED = Number(process.env.SEED || 18);
const SHOTS = process.env.SHOTS_DIR;
if (!SHOTS) throw new Error('Ustaw SHOTS_DIR');

const hint = (i, subtitle, extra) => Object.assign({ id: 'eot-hint-shot-' + i, icon: 'ℹ️', title: '', subtitle, kind: 'info' }, extra || {});
const EVENTS = [
  hint(0, 'Harappa: magazyn wyczerpany — kapitulacja za 1 turę oblężenia!'),
  hint(1, 'Ur: magazyn wyczerpany — kapitulacja za 1 turę oblężenia!'),
  hint(2, 'Głód: spadek populacji w 2 miastach'),
  hint(3, '\u{1F54A} Pokój zawarty'),
  hint(4, '⚔ Egipt wypowiada wojnę (ultimatum)'),
  hint(5, 'Rzym handluje z Egiptem', { title: 'Dyplomacja', kind: 'diplo', origin: 'other-civs' }),
  hint(6, 'Miasto-państwo wchłonięte do imperium'),
  hint(7, 'Odkryto chatkę: +20 złota'),
];

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await C.launch();
  const s = await C.openMenu(browser, { query: '&playtest=1' });
  const out = { tabs: {} };
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    // Zamknij ewentualne karty cywilizacji/miasta otwarte na starcie (zaslanialyby panel WYDARZENIA).
    for (let k = 0; k < 3; k++) { await s.page.keyboard.press('Escape'); await C.wait(200); }
    await s.page.evaluate((evs) => window.__sidePanelLinkTestDebug.seedEvents(evs), EVENTS);
    await C.wait(600);
    for (const tab of ['wazne', 'dyplomacja', 'inne']) {
      await s.page.evaluate((t) => { const b = document.querySelector('[data-sp-tab="' + t + '"]'); if (b) b.click(); }, tab);
      await C.wait(300);
      out.tabs[tab] = await s.page.evaluate(() => {
        const panel = document.querySelector('.civ-side-panel');
        const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
        const tabs = Array.from(document.querySelectorAll('.sp-tab')).map((t) => {
          const lab = t.querySelector('.sp-tab-label'); const cnt = t.querySelector('.sp-tab-count');
          const lr = lab && lab.getBoundingClientRect(); const cr = cnt && cnt.getBoundingClientRect();
          return { tab: t.getAttribute('data-sp-tab'), text: (t.textContent || '').trim(), overlap: !!(lr && cr && lr.right > cr.left + 0.5), clipped: lab ? lab.scrollWidth > lab.clientWidth + 1 : null, box: r(t) };
        });
        const dismiss = document.querySelector('[data-sp-dismiss-all]');
        const tabsEl = document.querySelector('.sp-tabs');
        return {
          header: (document.querySelector('.sp-header') || {}).textContent,
          tabs,
          dismissAboveTabs: !!(dismiss && tabsEl && dismiss.getBoundingClientRect().bottom <= tabsEl.getBoundingClientRect().top + 1),
          cards: Array.from(document.querySelectorAll('.sp-event[data-id]')).map((c) => (c.textContent || '').trim().slice(0, 70)),
          panelBox: r(panel),
        };
      });
      // Zrzut obszaru prawego panelu (z calej strony — widac, co faktycznie lezy na wierzchu).
      const pb = out.tabs[tab].panelBox;
      if (pb) {
        await s.page.screenshot({
          path: path.join(SHOTS, 'zrzut-live-zakladka-' + tab + '.png'),
          clip: { x: Math.max(0, pb.x - 12), y: Math.max(0, pb.y - 6), width: Math.min(pb.w + 24, 340), height: 430 },
        });
      }
    }
  } catch (e) { out.error = String(e.stack || e); }
  fs.writeFileSync(path.join(SHOTS, 'live-shots-geometry.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1).slice(0, 4000));
  await browser.close();
})();
