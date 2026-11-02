'use strict';
/**
 * live-verify-autoimprove-fort.cjs — R-WEB-AUTOIMPROVE-LIVE-SCENARIOS-Q1, scenariusz D (fort/posterunek z automatu) na ZYWEJ grze.
 * ZALOZENIE: E-FORT wymaga wyczerpanego limitu miast, wiec ustawiamy "Limit miast (baza)" = 1 przez zapamietane preferencje
 * kreatora (localStorage civ-newgame-prefs-v2, ten sam kanal co wybor gracza; kreator oferuje 10/15/20 — wartosc 1 to jedyne
 * odstepstwo od UI, bez niego trzeba by zalozyc 10 miast). Mapa Malenki, ziarno SEED (domyslnie 18).
 * Usage: ROBOCZA_HTML=... NODE_PATH=... node gra/tools/live-verify-autoimprove-fort.cjs [tury=30] [focus=zrownowazone]
 * Zapis: evidence/fort-<focus>.json
 */
const C = require('./live-verify-autoimprove-common.cjs');
const SEED = Number(process.env.SEED || 18);

const PAGE_SNAPSHOT = () => {
  const T = window.__civTest;
  const st = T.state();
  const forts = T.forts();
  const RAD = { fort: 5, posterunek: 3 };
  const dist = (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r));
  const out = { turn: st.turn, me: st.me, forts: [], cities: st.cities.map((c) => ({ id: c.id, o: c.ownerId, q: c.q, r: c.r, pop: c.pop })) };
  for (const f of forts) {
    const rad = RAD[f.type] || 0;
    const hexes = T.around(f.q, f.r, rad, false);
    const counts = {};
    for (const h of hexes) { const k = String(h.owner); counts[k] = (counts[k] || 0) + 1; }
    const water = hexes.filter((h) => h.teren === 'plytkie_morze' || h.teren === 'morze').length;
    // miasta (dowolnego wlasciciela) w promieniu fortu + wlasciciel heksu miasta
    const citiesIn = st.cities.filter((c) => dist(c, f) <= rad).map((c) => ({ id: c.id, o: c.ownerId, d: dist(c, f), ownerAtCity: T.ownerAt(c.q, c.r) }));
    const terr = T.hex(f.q, f.r);
    out.forts.push({ ...f, rad, nHex: hexes.length, water, ownerCounts: counts, citiesIn, onHex: terr && { teren: terr.teren, nakladka: terr.nakladka, layers: terr.layers, owner: terr.owner } });
  }
  // nakladania sie okregow fortow (dowolni wlasciciele) i wlasciciel heksow w czesci wspolnej
  out.overlaps = [];
  for (let i = 0; i < forts.length; i++) for (let j = i + 1; j < forts.length; j++) {
    const a = forts[i], b = forts[j]; const ra = RAD[a.type] || 0, rb = RAD[b.type] || 0;
    if (dist(a, b) > ra + rb) continue;
    const shared = T.around(a.q, a.r, ra, false).filter((h) => dist(h, b) <= rb);
    const own = {}; for (const h of shared) own[String(h.owner)] = (own[String(h.owner)] || 0) + 1;
    out.overlaps.push({ a: [a.q, a.r, a.ownerId, a.seq, a.builtAtTurn], b: [b.q, b.r, b.ownerId, b.seq, b.builtAtTurn], shared: shared.length, ownerCounts: own });
  }
  // Parytet terytorium: niezalezne wyliczenie wlasciciela wg territory.ts (miasto r=clamp(pop,5,15); fort 5; posterunek 3;
  // miasto ma pierwszenstwo, najblizsze miasto wygrywa; sposrod fortow wczesniejszy wg {turn,seq}, inaczej najblizszy)
  // porownane z zywym T.ownerAt na kwadracie wokol kazdego fortu (r+3).
  const cityR = (pop) => (pop <= 0 ? 0 : Math.min(Math.max(5, Math.floor(pop)), 15));
  const expect = (q, r) => {
    let bc = null, bcd = Infinity, bf = null, bfd = Infinity, bfo = null;
    for (const c of st.cities) { const d = dist({ q, r }, c); if (d <= cityR(c.pop) && d < bcd) { bcd = d; bc = c.ownerId; } }
    for (const f of forts) {
      const rad = RAD[f.type] || 0; const d = dist({ q, r }, f); if (d > rad) continue;
      const o = { turn: f.builtAtTurn, seq: f.seq };
      const hasO = bf !== null && bfo && o.turn !== undefined && bfo.turn !== undefined;
      const better = hasO ? (o.turn !== bfo.turn ? o.turn < bfo.turn : o.seq < bfo.seq) : d < bfd;
      if (better) { bfd = d; bf = f.ownerId; bfo = o; }
    }
    return bc !== null ? bc : bf;
  };
  const seen = new Set(); let cmp = 0, bad = []; let nonNull = 0;
  for (const f of forts) {
    const rad = RAD[f.type] || 0;
    for (const h of T.around(f.q, f.r, rad + 3, false)) {
      const k = h.q + ',' + h.r; if (seen.has(k)) continue; seen.add(k);
      const e = expect(h.q, h.r); const live = T.ownerAt(h.q, h.r);
      cmp++; if (e !== null) nonNull++;
      if (e !== live && bad.length < 8) bad.push({ q: h.q, r: h.r, expected: e, live });
    }
  }
  out.parity = { compared: cmp, expectedOwned: nonNull, mismatches: bad.length, sample: bad };
  return out;
};

(async () => {
  const turns = Number(process.argv[2] || 30);
  const focus = process.argv[3] || 'zrownowazone';
  const browser = await C.launch();
  const s = await C.openMenu(browser, { newGamePrefs: { v: 4, advanced: { cityLimitBase: 1 } } });
  const out = { scenario: 'D', seed: SEED, focus, turns: [], snaps: [] };
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    out.start = await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    out.setup = await s.page.evaluate(({ focus }) => {
      const T = window.__civTest;
      T.unlockAllTech(); T.setPraca(100000);
      T.setPolicy(0, { focus, tryb: 'auto', onlyWorked: false, pracaAutoPercent: 100, wolnoWycinacLas: true });
      T.debugOn(); T.drainDecisions();
      const st = T.state();
      const me = st.cities.filter((c) => c.ownerId === 0);
      const dist = (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r));
      const foreign = st.cities.filter((c) => c.ownerId !== 0).map((c) => ({ ...c, d: Math.min(...me.map((m) => dist(m, c))) })).sort((x, y) => x.d - y.d).slice(0, 6);
      // limit miast efektywny? probujemy zalozyc miasto na pierwszym kandydacie
      const cand = T.foundCandidates(5);
      const tryFound = cand.length ? T.foundCity(cand[0].q, cand[0].r) : null;
      const valuables = T.around(me[0].q, me[0].r, 5, false).filter((h) => h.teren === 'gory' || /^zloze/.test(h.nakladka || '')).map((h) => [h.q, h.r, h.teren, h.nakladka, h.owner]);
      return { valuables, me, nearestForeign: foreign, candidates: cand, tryFoundSecondCityResult: tryFound, forts0: T.forts() };
    }, { focus });
    // wojna z najblizszym obcym wlascicielem (scenariusz "przy granicy z wrogiem")
    const enemy = out.setup.nearestForeign.find((c) => c.ownerId < 1000) || out.setup.nearestForeign[0];
    out.enemyOwner = enemy ? enemy.ownerId : null;
    if (enemy) await s.page.evaluate((o) => window.__civTest.setWar(0, o), enemy.ownerId);
    for (let t = 0; t < turns; t++) {
      const r = await C.endTurnAndWait(s);
      const snap = await s.page.evaluate(() => {
        const T = window.__civTest;
        const d = T.drainDecisions();
        return { nDec: d.length, fortDec: d.filter((x) => /fort|posterunek/i.test(JSON.stringify(x.scope || '') + JSON.stringify(x.reason || ''))).slice(0, 12), forts: T.forts(), turn: T.state().turn };
      });
      out.turns.push({ end: r, ...snap });
      if ((t + 1) % 10 === 0 || snap.forts.length !== (out.turns[out.turns.length - 2] || { forts: [] }).forts.length) {
        out.snaps.push(await s.page.evaluate(PAGE_SNAPSHOT));
      }
      C.save(`fort-${focus}.json`, out);
      if (!r.ok) break;
    }
    out.final = await s.page.evaluate(PAGE_SNAPSHOT);
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = s.errors.slice(0, 10);
  C.save(`fort-${focus}.json`, out);
  console.log(JSON.stringify({ error: out.error, setup: out.setup && { me: out.setup.me, near: out.setup.nearestForeign.slice(0, 3), tryFound: out.setup.tryFoundSecondCityResult, ncand: out.setup.candidates.length }, enemy: out.enemyOwner, fortsPerTurn: out.turns.map((t) => `${t.turn}:${t.forts.length}`).join(' '), final: out.final && out.final.forts, overlaps: out.final && out.final.overlaps, parity: out.final && out.final.parity, valuables: out.setup && out.setup.valuables }).slice(0, 7000));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(2); });
