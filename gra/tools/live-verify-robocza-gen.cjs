'use strict';
/**
 * live-verify-robocza-gen.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-Q1, punkty 3 i 5 (żywy start gry, stolice AI).
 * Dla każdej pary typ:ziarno: kreator (Standardowy) -> Start -> założenie stolicy gracza -> dumpState (miasta).
 * Zapis: evidence/live-gen-<typ><ziarno>.json (surowy stan miast) + zrzut.
 * Usage: node gra/tools/live-verify-robocza-gen.cjs kontynenty:4242 pangea:7777 ...
 */
const C = require('./live-verify-robocza-common.cjs');
const TYPE_LABEL = { kontynenty: 'Kontynenty', pangea: 'Pangea', wyspy: 'Wyspy', ziemia: 'Ziemia' };

(async () => {
  const specs = process.argv.slice(2).map((a) => { const [typ, seed] = a.split(':'); return { typ, seed: Number(seed) }; });
  const browser = await C.launch();
  try {
    for (const sp of specs) {
      const t0 = Date.now();
      const s = await C.openMenu(browser);
      await C.clickText(s.page, /Rozpocznij grę/);
      await C.wait(400);
      await C.gotoStep(s.page, 'Ustawienia');
      const okType = await C.setWorldType(s.page, TYPE_LABEL[sp.typ]);
      const rows = await C.gridRows(s.page);
      const start = await C.startFromWizard(s, sp.seed);
      let out = { typ: sp.typ, seedWanted: sp.seed, okType, grid: rows, ...start, ok: false };
      try {
        const st0 = await C.waitAwaitingCity(s.page);
        const st = await C.foundCapital(s.page);
        out = { ...out, ok: true, playerStartHex: st0.playerStartHex, menuCivId: st.menuCivId, turn: st.turn, cities: st.cities, units: st.units.length, totalMs: Date.now() - t0 };
        await s.page.screenshot({ path: `${C.EVID}/live-gen-${sp.typ}${sp.seed}.png` });
      } catch (e) { out.error = String(e.message || e); }
      out.pageErrors = s.errors.slice(0, 5);
      C.save(`live-gen-${sp.typ}${sp.seed}.json`, out);
      console.log(`[gen] ${sp.typ}:${sp.seed} ok=${out.ok} seedSeen=${out.seedSeen} cities=${out.cities ? out.cities.length : '-'} ms=${Date.now() - t0}`);
      await s.ctx.close();
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error('[gen] błąd:', e); process.exit(2); });
