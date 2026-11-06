'use strict';
/**
 * R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1 — dowód w prawdziwej grze (Chromium + Playwright), bundle zbudowany POZA repo.
 * Usage: ROBOCZA_HTML=<bundle index.html> NODE_PATH=<gra/node_modules> EVID_DIR=<katalog> node tools/live-verify-autobuild-toggle.cjs
 * Scenariusze: (1) kreator Nowa gra -> krok Ustawienia: opcja w głównych ustawieniach, domyślnie „Wyłączona” (zrzut),
 * (2) nowa gra: 10 tur przy włączonej polityce auto — brak auto-ulepszeń/budowy gracza (OFF),
 * (3) włączenie opcji (hak ?civTest=1) — auto-ulepszenia i auto-budowa działają, (4) panel miasta: kontrolki Auto wyszarzone/aktywne (zrzuty).
 */
const C = require('./live-verify-autoimprove-common.cjs');
const { wait } = C;
const TURNS = Number(process.env.AB_TURNS || 10);

async function snap(page) {
  return page.evaluate(() => {
    window.__capSnap = null;
    window.__pracaPoolSaveLoadTestDebug.roundTrip();
    const s = window.__capSnap;
    if (!s) return null;
    const mine = s.cities.filter((c) => c.ownerId === 0).map((c) => c.id);
    const prod = {}; const built = {};
    for (const id of mine) {
      const p = s.cityProd && s.cityProd[id]; prod[id] = p ? { kolejka: (p.kolejka || []).map((i) => i.id), postep: p.postep } : null;
      built[id] = (s.cityBuilt && s.cityBuilt[id]) || [];
    }
    return { turn: s.meta.turn, autoBuildEnabled: s.meta.autoBuildEnabled, prod, built, budowaTryb: s.cities.filter((c) => c.ownerId === 0).map((c) => c.budowaTryb) };
  });
}

async function improvements(page) {
  return page.evaluate(() => {
    const st = window.__civTest.state();
    const cap = st.cities.find((c) => c.ownerId === 0);
    const hexes = window.__civTest.around(cap.q, cap.r, 4, true);
    return { praca: st.praca, layers: hexes.reduce((a, h) => a + h.layers.length, 0), hexesWithLayers: hexes.filter((h) => h.layers.length > 0).length };
  });
}

async function turns(sess, n, tag, log) {
  for (let i = 0; i < n; i++) {
    const r = await C.endTurnAndWait(sess);
    const im = await improvements(sess.page); const sn = await snap(sess.page);
    log.push({ tag, ...r, im, queue: sn.prod, builtN: Object.values(sn.built).map((b) => b.length), flag: sn.autoBuildEnabled });
    console.log(tag, JSON.stringify({ t: r.after, ok: r.ok, layers: im.layers, praca: Math.round(im.praca), queue: sn.prod, builtN: Object.values(sn.built).map((b) => b.length) }));
    if (!r.ok) throw new Error('endTurn failed at ' + tag + ' ' + i);
  }
}

(async () => {
  const browser = await C.launch();
  const out = { turns: TURNS, steps: [] };
  try {
    // ---- (1) kreator: opcja w głównych ustawieniach ----
    const s1 = await C.openMenu(browser);
    await C.clickText(s1.page, /Rozpocznij grę/);
    await wait(500);
    await C.gotoStep(s1.page, 'Ustawienia');
    const rows = await s1.page.evaluate(() => Array.from(document.querySelectorAll('.civ-newgame .srow')).map((r) => ({
      lbl: (r.querySelector('.sl')?.textContent || '').trim(), val: (r.querySelector('.sv')?.textContent || '').trim(),
      inAdvanced: !!r.closest('.adv-modal, .modal, [class*=advanced]'),
    })));
    out.wizardRows = rows;
    const row = rows.find((r) => r.lbl === 'Automatyzacja budowy');
    out.wizardAutoBuildRow = row || null;
    console.log('wizard row:', JSON.stringify(row));
    await s1.page.screenshot({ path: C.EVID + '/01-ustawienia-glowne-automatyzacja-budowy.png' });
    await s1.ctx.close();

    // ---- (2) nowa gra (hak startNewGame = ścieżka doStartGame bez zmiany opcji => domyślna) ----
    const sess = await C.openMenu(browser);
    await sess.page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(sess.page);
    await C.foundCapital(sess.page);
    await wait(1000);
    const base = await snap(sess.page);
    out.afterFound = base;
    console.log('po założeniu stolicy:', JSON.stringify(base));
    // polityka auto (jak po ręcznym włączeniu profilu przed zmianą) + duża pula Pracy; bez zmiany flagi autoBuildEnabled
    await sess.page.evaluate(() => {
      window.__civTest.unlockAllTech();
      window.__civTest.setPraca(3000);
      window.__civTest.setPolicy(0, { tryb: 'auto', focus: 'zrownowazone', pracaAutoPercent: 100 });
    });
    out.policy = await sess.page.evaluate(() => window.__civTest.state().policyMe);
    const log = [];
    const imBefore = await improvements(sess.page);
    out.imBefore = imBefore;
    await turns(sess, TURNS, 'OFF', log);
    const imOff = await improvements(sess.page);
    out.imAfterOff = imOff;
    out.offFlag = (await snap(sess.page)).autoBuildEnabled;

    // panel miasta przy OFF
    const cityId = await sess.page.evaluate(() => window.__civTest.state().cities.find((c) => c.ownerId === 0).id);
    await sess.page.evaluate((id) => { const el = document.querySelector('[data-city-id="' + id + '"]'); if (el) el.click(); }, cityId);
    await wait(800);
    await sess.page.screenshot({ path: C.EVID + '/02-gra-off.png' });

    // ---- (3) włączenie opcji ----
    await sess.page.evaluate(() => { window.__civTest.setAutoBuild(true); window.__civTest.setPraca(3000); });
    const onLog = [];
    await turns(sess, Math.min(TURNS, 5), 'ON', onLog);
    const imOn = await improvements(sess.page);
    out.imAfterOn = imOn;
    out.onFlag = (await snap(sess.page)).autoBuildEnabled;
    await sess.page.screenshot({ path: C.EVID + '/03-gra-on.png' });
    out.log = log; out.onLog = onLog;
    out.errors = sess.errors.slice(0, 10);
    out.verdict = {
      defaultOff: !!row && row.val === 'Wyłączona',
      offNoImprovements: imOff.layers === imBefore.layers,
      offNoQueue: log.every((x) => Object.values(x.queue).every((q) => q && q.kolejka.length === 0)),
      offNoNewBuildings: log[log.length - 1].builtN.every((n, i) => n === log[0].builtN[i]),
      onDoesSomething: imOn.layers > imOff.layers || onLog.some((x) => Object.values(x.queue).some((q) => q && q.kolejka.length > 0)),
    };
    console.log('VERDICT', JSON.stringify(out.verdict));
    await sess.ctx.close();
  } finally {
    C.save('autobuild-toggle-live.json', out);
    await browser.close();
  }
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
