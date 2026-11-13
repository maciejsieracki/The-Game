'use strict';
/**
 * R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1 — dowód w REALNEJ grze (Chromium): panel ulepszeń (tryb budowy 🔨) z przyciskiem
 * „Administrator państwa +/✓”; auto-ulepszenia terenu gracza działają TYLKO przy działającym administratorze.
 * Fazy: (1) bez administratora — N tur => warstwy ulepszeń bez zmian; (2) zatrudnienie KLIKIEM w panelu (koszt 40 ze skarbca)
 * — N tur => przybywają ulepszenia; (3) skarbiec 0 => administrator nie pracuje => brak nowych ulepszeń;
 * (4) zapis/wczytanie (round-trip snapshotu) niesie administratora; (5) ikona 16/24 px jasna/ciemna.
 * Usage: ROBOCZA_HTML=<index.html z vite build> EVID_DIR=<katalog> [TURNS=3] node tools/live-verify-improvement-administrator.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');
const { wait } = C;
const TURNS = Number(process.env.TURNS || 3);

const layersAround = (page, cap) => page.evaluate((c) => {
  const hexes = window.__civTest.around(c.q, c.r, 5, true);
  return { layers: hexes.reduce((a, h) => a + h.layers.length, 0), clearing: hexes.filter((h) => h.clearing).length };
}, cap);
const impState = (page, id) => page.evaluate((i) => window.__civTest.impAdminState(i), id);
const iconHtml = (page) => page.evaluate(() => { const i = document.querySelector('.civ-build-imp-admin [data-adm-icon]'); return i ? i.outerHTML : null; });
const panelInfo = (page) => page.evaluate(() => {
  const btn = document.querySelector('[data-imp-admin-state]');
  const hint = document.querySelector('[data-imp-admin-hint]');
  const eff = document.querySelector('.civ-build-auto-eff');
  return {
    panel: !!document.querySelector('.civ-build-panel'),
    button: btn ? { text: btn.textContent.trim(), state: btn.getAttribute('data-imp-admin-state'), disabled: btn.disabled, title: btn.getAttribute('title'), icon: !!btn.querySelector('[data-adm-icon="improvements"]'), warn: !!btn.querySelector('.civ-adm-ic-warn') } : null,
    hint: hint ? hint.textContent.trim() : null,
    eff: eff ? eff.textContent.trim() : null,
  };
});
async function openBuildPanel(page) {
  const vis = () => page.evaluate(() => { const p = document.querySelector('.civ-build-panel'); return !!p && p.getBoundingClientRect().width > 0 && getComputedStyle(p).display !== 'none'; });
  if (await vis()) { await page.evaluate(() => { const b = document.querySelector('[data-act="build"]'); if (b) { b.click(); b.click(); } }); await wait(700); return vis(); }
  await page.evaluate(() => { const b = document.querySelector('[data-act="build"]'); if (b) b.click(); });
  await wait(700);
  return vis();
}

(async () => {
  const browser = await C.launch();
  const out = { turns: TURNS };
  try {
    const s = await C.openMenu(browser);
    const page = s.page;
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(page);
    await C.foundCapital(page);
    await wait(1500);
    const st0 = await page.evaluate(() => window.__civTest.state());
    const cap = st0.cities.find((c) => c.ownerId === 0);
    out.capital = { id: cap.id, name: cap.name };
    await page.evaluate(() => {
      window.__civTest.unlockAllTech();
      window.__civTest.setPraca(3000);
      window.__civTest.setAutoBuild(true);
      window.__civTest.setPolicy(0, { tryb: 'auto', focus: 'zrownowazone', pracaAutoPercent: 100 });
    });
    out.setup = await page.evaluate((id) => window.__civTest.adminSetup(id, null, 500), cap.id);

    // (1) BEZ administratora państwa
    out.state1 = await impState(page, cap.id);
    out.panel1Open = await openBuildPanel(page);
    out.panel1 = await panelInfo(page);
    out.iconOff = await iconHtml(page);
    await page.screenshot({ path: C.EVID + '/01-panel-ulepszen-administrator-plus.png' });
    console.log('1 bez admina', JSON.stringify(out.panel1), JSON.stringify({ hired: out.state1.hired, working: out.state1.working }));
    out.l0 = await layersAround(page, cap);
    out.turns1 = [];
    for (let t = 0; t < TURNS; t++) {
      const e = await C.endTurnAndWait(s);
      await page.evaluate(() => window.__civTest.setPraca(3000));
      const L = await layersAround(page, cap);
      out.turns1.push({ ok: e.ok, ...L });
      console.log('BEZ admina, tura', t + 1, JSON.stringify(L));
    }
    out.l1 = out.turns1[out.turns1.length - 1];

    // (2) zatrudnienie KLIKIEM w panelu
    await page.evaluate((id) => window.__civTest.adminSetup(id, null, 500), cap.id);
    out.panel2Open = await openBuildPanel(page);
    out.tBeforeHire = (await impState(page, cap.id)).treasury;
    await page.evaluate(() => { const b = document.querySelector('[data-imp-admin-hire]'); if (b) b.click(); });
    await wait(800);
    out.state2 = await impState(page, cap.id);
    out.panel2 = await panelInfo(page);
    out.iconOk = await iconHtml(page);
    await page.screenshot({ path: C.EVID + '/02-panel-ulepszen-administrator-zatrudniony.png' });
    console.log('2 po zatrudnieniu', JSON.stringify(out.panel2), 'skarbiec', out.tBeforeHire, '->', out.state2.treasury);
    out.turns2 = [];
    const l2start = await layersAround(page, cap);
    for (let t = 0; t < TURNS; t++) {
      const e = await C.endTurnAndWait(s);
      await page.evaluate(() => window.__civTest.setPraca(3000));
      const L = await layersAround(page, cap);
      const st = await impState(page, cap.id);
      out.turns2.push({ ok: e.ok, ...L, working: st.working, treasury: st.treasury });
      console.log('Z adminem, tura', t + 1, JSON.stringify(out.turns2[t]));
    }
    out.l2start = l2start;

    // (3) brak środków => nie pracuje => brak nowych ulepszeń
    await page.evaluate((id) => window.__civTest.adminSetup(id, null, 0), cap.id);
    out.state3 = await impState(page, cap.id);
    await openBuildPanel(page);
    out.panel3 = await panelInfo(page);
    out.iconIdle = await iconHtml(page);
    await page.screenshot({ path: C.EVID + '/03-panel-ulepszen-administrator-nie-pracuje.png' });
    console.log('3 brak środków', JSON.stringify(out.panel3), JSON.stringify({ hired: out.state3.hired, working: out.state3.working }));
    const l3start = await layersAround(page, cap);
    await page.evaluate(() => window.__civTest.setPraca(3000));
    const e3 = await C.endTurnAndWait(s);
    await page.evaluate(() => window.__civTest.setPraca(3000));
    const l3 = await layersAround(page, cap);
    const st3b = await impState(page, cap.id);
    out.turn3 = { ok: e3.ok, before: l3start, after: l3, working: st3b.working, treasury: st3b.treasury };
    console.log('BRAK ŚRODKÓW, tura', JSON.stringify(out.turn3));

    // (4) zapis/wczytanie niesie administratora
    out.save = await page.evaluate((id) => {
      window.__capSnap = null;
      window.__pracaPoolSaveLoadTestDebug.roundTrip();
      const sn = window.__capSnap;
      if (!sn) return null;
      const c = sn.cities.find((x) => x.id === id);
      return c ? { administratorUlepszen: c.administratorUlepszen || null } : null;
    }, cap.id);
    console.log('4 zapis', JSON.stringify(out.save));

    // (5) ikona w 16/24 px, jasna/ciemna, stany off/ok/idle (prawdziwy HTML z panelu)
    out.icon = await page.evaluate((h) => {
      const sheet = document.createElement('div');
      sheet.id = 'icon-sheet';
      sheet.style.cssText = 'position:fixed;left:20px;top:20px;z-index:99999;display:flex;gap:0;border:1px solid #555;font:12px system-ui;';
      const mk = (bg, fg, cls) => {
        let html = '<div class="' + cls + '" style="padding:14px 18px;background:' + bg + ';color:' + fg + ';"><div style="margin-bottom:8px">' + (cls === 'dark' ? 'Ciemny motyw' : 'Jasny motyw (data-theme=light)') + '</div>';
        for (const [name, ic] of [['brak (off)', h.off], ['pracuje (ok)', h.ok], ['nie pracuje (idle)', h.idle]]) {
          html += '<div style="display:flex;align-items:center;gap:14px;margin:8px 0;">';
          for (const sz of [16, 24]) html += '<span class="sz" data-sz="' + sz + '">' + ic + '</span>';
          html += '<span>' + name + '</span></div>';
        }
        return html + '</div>';
      };
      sheet.innerHTML = mk('#1a1812', '#ddd', 'dark') + '<div data-theme="light">' + mk('#f4efe0', '#222', 'light') + '</div>';
      document.body.appendChild(sheet);
      sheet.querySelectorAll('.sz').forEach((el) => { const z = Number(el.getAttribute('data-sz')); const svg = el.querySelector('svg'); if (svg) { svg.setAttribute('width', z); svg.setAttribute('height', z); } });
      return { cells: sheet.querySelectorAll('[data-adm-icon="improvements"]').length };
    }, { off: out.iconOff, ok: out.iconOk, idle: out.iconIdle });
    await page.screenshot({ path: C.EVID + '/04-ikona-stany-16-24-jasna-ciemna.png', clip: { x: 0, y: 0, width: 700, height: 300 } });
    out.errors = s.errors.slice(0, 10);
    out.verdict = {
      noAdminNoImprovements: out.turns1.every((t) => t.layers === out.l0.layers && t.clearing === 0),
      hireCost40: out.tBeforeHire - out.state2.treasury === 40,
      withAdminImproves: out.turns2.some((t) => t.layers > l2start.layers || t.clearing > 0),
      noFundsStops: out.turn3.after.layers === out.turn3.before.layers,
      saveHasAdmin: !!(out.save && out.save.administratorUlepszen),
      iconCells: out.icon.cells,
    };
    console.log('VERDICT', JSON.stringify(out.verdict));
    C.save('improvement-administrator-live.json', out);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
