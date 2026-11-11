'use strict';
/**
 * R-WEB-CITY-ADMINISTRATOR-Q1 — dowód w REALNEJ turze: autobudowa budynków gracza działa TYLKO w mieście z działającym
 * administratorem. Dwa miasta w trybie auto (Zrównoważone), automatyzacja włączona; A = z administratorem, B = bez.
 * Po końcu tury: kolejka A niepusta (albo postęp), kolejka B pusta. Potem „brak środków” (skarbiec 0) -> A też nie buduje.
 * Usage: ROBOCZA_HTML=<index.html> EVID_DIR=<katalog> node tools/live-verify-city-administrator-autobuild.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');
const { wait } = C;

(async () => {
  const browser = await C.launch();
  const out = {};
  try {
    const s = await C.openMenu(browser);
    const page = s.page;
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(page);
    await C.foundCapital(page);
    await wait(1500);
    const st0 = await page.evaluate(() => window.__civTest.state());
    const capital = st0.cities.find((c) => c.ownerId === 0);
    await page.evaluate(() => window.__civTest.unlockAllTech());
    await page.evaluate(() => window.__civTest.setCityLimit(5));
    await page.evaluate(() => window.__civTest.setAutoBuild(true));
    const cands = await page.evaluate((c) => window.__civTest.foundCandidates(60).filter((h) => Math.max(Math.abs(h.q - c.q), Math.abs(h.r - c.r)) >= 3), capital);
    let ok = false;
    for (const h of cands.slice(0, 20)) { ok = await page.evaluate((hh) => window.__civTest.foundCity(hh.q, hh.r), h); if (ok) break; }
    await wait(1200);
    const st1 = await page.evaluate(() => window.__civTest.state());
    const mine = st1.cities.filter((c) => c.ownerId === 0);
    out.cities = mine.map((c) => ({ id: c.id, name: c.name }));
    if (mine.length < 2) throw new Error('brak drugiego miasta: ' + JSON.stringify(out.cities));
    const A = mine[0], B = mine[1];
    // A: Pałac (stolica) + administrator; B: Dom Starszyzny BEZ administratora. Oba w trybie auto.
    await page.evaluate((id) => window.__civTest.adminSetup(id, ['palac'], 5000, 'zrownowazone', { drewno: 500, kamien: 500, cegla: 500 }), A.id);
    await page.evaluate((id) => window.__civTest.adminSetup(id, ['dom_starszyzny'], 5000, 'zrownowazone'), B.id);
    out.hire = await page.evaluate((id) => window.__civTest.adminHire(id), A.id);
    if (process.env.HIRE_B === '1') out.hireB = await page.evaluate((id) => window.__civTest.adminHire(id), B.id);
    if (process.env.NOFUNDS === '1') await page.evaluate((id) => window.__civTest.adminSetup(id, null, 1), A.id);
    out.pre = { A: await page.evaluate((id) => window.__civTest.adminState(id), A.id), B: await page.evaluate((id) => window.__civTest.adminState(id), B.id) };
    console.log('PRZED turą', JSON.stringify({ A: [out.pre.A.hired, out.pre.A.working, out.pre.A.queueLen, out.pre.A.treasury], B: [out.pre.B.hired, out.pre.B.working, out.pre.B.queueLen] }));
    const logs0 = s.logs.length;
    out.turns = [];
    const N = Number(process.env.TURNS || 1);
    for (let t = 0; t < N; t++) {
      const e1 = await C.endTurnAndWait(s);
      const A1 = await page.evaluate((id) => window.__civTest.adminState(id), A.id);
      const B1 = await page.evaluate((id) => window.__civTest.adminState(id), B.id);
      out.turns.push({ ok: e1.ok, A: { hired: A1.hired, working: A1.working, queue: A1.prod, treasury: A1.treasury }, B: { hired: B1.hired, working: B1.working, queue: B1.prod, treasury: B1.treasury } });
      console.log('PO turze ' + (t + 1), JSON.stringify(out.turns[t]));
    }
    out.logAuto = s.logs.slice(logs0).filter((l) => /AutoManage|Administrator|administrator|autobud/i.test(l)).slice(0, 10);

    // brak środków: skarbiec 0 -> administrator A nie pracuje -> autobudowa A wyłączona (wyczyść kolejkę A przez zwolnienie nie jest potrzebne — sprawdzamy flagę)
    await page.evaluate((id) => window.__civTest.adminSetup(id, null, 0), A.id);
    out.noFunds = await page.evaluate((id) => window.__civTest.adminState(id), A.id);
    console.log('SKARBIEC 0', JSON.stringify([out.noFunds.hired, out.noFunds.working, out.noFunds.treasury]));
    out.errors = s.errors.slice(0, 10);
    C.save('city-administrator-autobuild-live.json', out);
    await s.ctx.close();
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('LIVE FAIL', e); process.exit(1); });
