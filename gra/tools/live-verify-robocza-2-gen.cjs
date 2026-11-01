'use strict';
/**
 * live-verify-robocza-2-gen.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-2-Q1, T1 (rozproszenie stolic), T3 (udzial ladu), T4 (bieguny).
 * Dla kazdej specyfikacji typ:ziarno:tury: kreator (Standardowy, domyslny udzial ladu) -> Start -> stolica gracza ->
 * dumpState (miasta) + snapshot ZYWEJ gry (teren z buildSaveGameSnapshot, nie z odtworzenia offline) ->
 * opcjonalnie N tur obserwatora (gracz konczy ture) -> ponowny dumpState + snapshot.
 * Usage: NODE_PATH=/opt/node-tools/node_modules node gra/tools/live-verify-robocza-2-gen.cjs kontynenty:1001:0 pangea:4242:30
 * Zapis: evidence/gen2-<typ><ziarno>.json (czesciowy po kazdej turze), evidence/gen2-<typ><ziarno>.DONE na koncu.
 */
const fs = require('fs');
const C = require('./live-verify-robocza-2-common.cjs');
const TYPE_LABEL = { kontynenty: 'Kontynenty', pangea: 'Pangea', wyspy: 'Wyspy', ziemia: 'Ziemia' };
const { analyse } = C;

(async () => {
  const specs = process.argv.slice(2).map((a) => { const [typ, seed, turns] = a.split(':'); return { typ, seed: Number(seed), turns: Number(turns || 0) }; });
  const browser = await C.launch();
  try {
    for (const sp of specs) {
      const name = `gen2-${sp.typ}${sp.seed}`;
      const t0 = Date.now();
      const s = await C.openMenu(browser);
      await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
      await C.gotoStep(s.page, 'Ustawienia');
      const okType = await C.setWorldType(s.page, TYPE_LABEL[sp.typ]);
      const grid = await C.gridRows(s.page);
      const start = await C.startFromWizard(s, sp.seed);
      const out = { typ: sp.typ, seedWanted: sp.seed, okType, uiLand: C.valueOf(grid, 'Udział lądu na mapie'), uiSize: C.valueOf(grid, 'Rozmiar mapy'), ...start, turnsPlanned: sp.turns, ok: false, turnLog: [] };
      try {
        await C.waitAwaitingCity(s.page);
        let st = await C.foundCapital(s.page);
        const stats0 = await C.snapshotStats(s.page, []);
        out.start = analyse(st, stats0); out.menuCivId = st.menuCivId; out.ok = true;
        await s.page.screenshot({ path: `${C.EVID}/${name}-start.png` });
        console.log(`[gen2] ${name} start capMin=${out.start.capMin} land=${out.start.landPct}% polarHexes=${out.start.polarHexes} polarAI=${out.start.polarAiCities.length}`);
        C.save(`${name}.json`, out);
        for (let t = 0; t < sp.turns; t++) {
          const r = await C.endTurnAndWait(s);
          out.turnLog.push(r);
          if (!r.ok) { out.stalledAt = t; await s.page.screenshot({ path: `${C.EVID}/${name}-stall.png` }); break; }
          C.save(`${name}.json`, out);
        }
        if (sp.turns > 0) {
          st = await s.page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
          const stats1 = await C.snapshotStats(s.page, []);
          out.end = analyse(st, stats1);
          await s.page.screenshot({ path: `${C.EVID}/${name}-end.png` });
          console.log(`[gen2] ${name} END turn=${out.end.turn} aiCities=${out.end.aiCitiesTotal} polarAI=${out.end.polarAiCities.length}`);
        }
      } catch (e) { out.error = String(e.message || e); console.error('[gen2] blad', name, out.error); }
      out.polarFallbackLogs = s.logs.filter((l) => /polar-fallback/.test(l)).slice(0, 10); out.pageErrors = s.errors.slice(0, 10); out.totalMs = Date.now() - t0;
      C.save(`${name}.json`, out);
      fs.writeFileSync(`${C.EVID}/${name}.DONE`, String(out.ok));
      await s.ctx.close();
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error('[gen2] fatal:', e); process.exit(2); });
