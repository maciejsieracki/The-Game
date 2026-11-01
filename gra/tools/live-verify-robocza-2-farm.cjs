'use strict';
/**
 * live-verify-robocza-2-farm.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-2-Q1, T2 (farma przed trzoda).
 * ZYWA gra (bundle gra-robocza/Gra-ROBOCZA.html): nowa gra (hak startNewGame = REALNY doStartGame, mapa Maly, ziarno 778899,
 * rzeki Normalnie) -> snapshot zywej mapy PRZED zalozeniem miasta -> wybor heksa wg wariantu -> REALNE zalozenie miasta
 * (hak foundPlayerCity = tryFoundPlayerCityAt jak klik) -> polityka auto-ulepszen przez REALNY restoreGameFromSave
 * -> N tur REALNEGO endTurn -> odczyt warstw (getPlacedLayers). Zero fixture lasu.
 * Wariant: rodos (trawa OBOK rzeki, nie na rzece) | rzeka (heks NA rzece) | las (heks z lasem wokol; uzyj wolno=on).
 * Usage: NODE_PATH=/opt/node-tools/node_modules node gra/tools/live-verify-robocza-2-farm.cjs <outJson> <variant> <focus> <wolno on|off> [turns=25]
 */
const fs = require('fs');
const C = require('./live-verify-robocza-2-common.cjs');
const OUT = process.argv[2], VARIANT = process.argv[3], FOCUS = process.argv[4] || 'zrownowazone';
const WOLNO = (process.argv[5] || 'off') === 'on', TURNS = Number(process.argv[6] || 25);
const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const dist = (a, b) => { const dq = a.q - b.q, dr = a.r - b.r; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };

async function pollUntil(page, label, fn, timeoutMs) {
  const end = Date.now() + timeoutMs; let last = null;
  while (Date.now() < end) { last = await page.evaluate(fn); if (last && last.ready) return last; await C.wait(500); }
  throw new Error('pollUntil(' + label + '): timeout ' + JSON.stringify(last));
}

function mapHelpers(m) {
  const idx = new Map();
  for (let i = 0; i < m.n; i++) idx.set(m.q[i] + ',' + m.r[i], i);
  const riverEdge = new Set(m.rzekaKrawedzie.hexIdx);
  const riverPathHex = new Set();
  for (const p of m.riverPaths) for (const h of p) riverPathHex.add(h.q + ',' + h.r);
  const onRiver = (q, r) => { const i = idx.get(q + ',' + r); return (i !== undefined && (m.rzekaObecna[i] === 1 || riverEdge.has(i))) || riverPathHex.has(q + ',' + r); };
  const nearRiver = (q, r) => onRiver(q, r) || NB.some(([dq, dr]) => onRiver(q + dq, r + dr));
  const terr = (q, r) => { const i = idx.get(q + ',' + r); return i === undefined ? '?' : m.dict[m.terenIdx[i]]; };
  const nak = (q, r) => { const i = idx.get(q + ',' + r); return i === undefined ? '?' : m.dict[m.nakladkaIdx[i]]; };
  return { idx, onRiver, nearRiver, terr, nak };
}

async function main() {
  const browser = await C.launch();
  const sess = await C.openMenu(browser);
  const { page, errors } = sess;
  const logs = []; let doneCount = 0;
  page.on('console', (m) => { if (/EndTurn/i.test(m.text())) { logs.push(m.text().slice(0, 200)); if (/DONE tura/.test(m.text())) doneCount++; } });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__pracaPoolSaveLoadTestDebug
    && !!window.__eraTestDebug && !!window.__buildRequestTestDebug && !!window.__cityForestTestDebug, undefined, { timeout: 180000 });
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 0, 'normal'));
  await pollUntil(page, 'world', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    const overlay = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 300000);

  // 1) snapshot PRZED zalozeniem miasta -> wybor heksa
  const pre = await page.evaluate(() => {
    window.__capSnap = null;
    try { window.__pracaPoolSaveLoadTestDebug.roundTrip(); } catch (e) { return { err: String(e) }; }
    const s = window.__capSnap; return s ? { map: s.mapSnapshot, start: window.__cityForestTestDebug.playerStartHex() } : { err: 'brak snapshotu' };
  });
  if (pre.err) throw new Error('snapshot przed miastem: ' + pre.err);
  const H = mapHelpers(pre.map);
  const cand = await page.evaluate(() => window.__cityForestTestDebug.foundCandidates(1000000));
  const GRASS = new Set(['laka', 'rownina']);
  const forestAround = (q, r, R) => { let n = 0; for (let dq = -R; dq <= R; dq++) for (let dr = -R; dr <= R; dr++) { if (Math.abs(dq + dr) > R) continue; if (H.nak(q + dq, r + dr) === 'las') n++; } return n; };
  let pool = cand.filter((c) => GRASS.has(H.terr(c.q, c.r)) && H.nak(c.q, c.r) === 'brak');
  if (VARIANT === 'rodos') pool = pool.filter((c) => !H.onRiver(c.q, c.r) && H.nearRiver(c.q, c.r));
  else if (VARIANT === 'rzeka') pool = pool.filter((c) => H.onRiver(c.q, c.r));
  else if (VARIANT === 'las') pool = pool.filter((c) => forestAround(c.q, c.r, 3) >= 8 && H.nak(c.q, c.r) !== 'las');
  else if (VARIANT === 'lasmax') pool = pool.filter((c) => !H.onRiver(c.q, c.r));
  // najblizszy domyslnemu startowi (stabilny wybor; kandydaci posortowani wg odleglosci, potem q,r)
  if (VARIANT === 'lasmax') pool.sort((a, b) => forestAround(b.q, b.r, 2) - forestAround(a.q, a.r, 2) || dist(a, pre.start) - dist(b, pre.start));
  else pool.sort((a, b) => dist(a, pre.start) - dist(b, pre.start) || a.q - b.q || a.r - b.r);
  console.log('kandydaci lacznie', cand.length, 'po filtrze wariantu', pool.length, 'start domyslny', JSON.stringify(pre.start));
  if (!pool.length) throw new Error('brak heksa dla wariantu ' + VARIANT);
  const pick = pool[0];
  const pickInfo = { q: pick.q, r: pick.r, teren: H.terr(pick.q, pick.r), naRzece: H.onRiver(pick.q, pick.r), obokRzeki: H.nearRiver(pick.q, pick.r), lasR1: forestAround(pick.q, pick.r, 1), lasR3: forestAround(pick.q, pick.r, 3), distOdDomyslnegoStartu: dist(pick, pre.start) };
  console.log('wybrany heks', JSON.stringify(pickInfo));

  // 2) REALNE zalozenie miasta na wybranym heksie
  const founded = await page.evaluate(({ q, r }) => window.__cityForestTestDebug.foundPlayerCity(q, r), pick);
  console.log('foundPlayerCity ->', founded);
  if (!founded) throw new Error('foundPlayerCity zwrocil false (hak/regula zalozenia)');
  await pollUntil(page, 'capital', () => ({ ready: window.__cityStateStartUnitsTestDebug.dumpState().cities.some((c) => c.ownerId === 0) }), 120000);
  await C.wait(500);

  // 3) polityka przez REALNY restoreGameFromSave + odblokowanie tech + pula Pracy
  const policy = { focus: FOCUS, tryb: 'auto', onlyWorked: true, pracaAutoPercent: 33, wolnoWycinacLas: WOLNO };
  await page.evaluate((p) => { window.__buildRequestTestDebug.unlockAllTech(); window.__pracaPoolSaveLoadTestDebug.roundTripMeta({ ulepszeniaEmpireByOwner: [[0, p]] }); }, policy);
  await C.wait(500);
  await page.evaluate(() => { window.__buildRequestTestDebug.unlockAllTech(); window.__buildRequestTestDebug.setPlayerPracaPool(300); });
  const snap = await page.evaluate(() => {
    window.__capSnap = null; window.__pracaPoolSaveLoadTestDebug.roundTrip();
    const s = window.__capSnap;
    return s ? { mapSnapshot: s.mapSnapshot, policy: s.meta.ulepszeniaEmpireByOwner, cities: s.cities.filter((c) => c.ownerId === 0).map((c) => ({ id: c.id, q: c.q, r: c.r, population: c.population })) } : null;
  });
  if (!snap) throw new Error('brak snapshotu po miescie');
  const city = snap.cities[0];
  console.log('city', JSON.stringify(city), 'policy', JSON.stringify(snap.policy));

  const log = []; const R = 5;
  const scan = (c) => page.evaluate(({ cq, cr, R }) => {
    const out = {};
    for (let dq = -R; dq <= R; dq++) for (let dr = -R; dr <= R; dr++) {
      if (Math.abs(dq + dr) > R) continue;
      const q = cq + dq, r = cr + dr;
      const l = window.__buildRequestTestDebug.getPlacedLayers(q, r);
      const nak = window.__cityForestTestDebug.hexNakladka(q, r);
      const clr = window.__buildRequestTestDebug.isClearing(q, r);
      if ((l && l.length) || clr) out[q + ',' + r] = { l, nak, clr };
    }
    return { layers: out, pool: window.__pracaPoolSaveLoadTestDebug.getPool(), pop: window.__cityStateStartUnitsTestDebug.dumpState().turn };
  }, { cq: c.q, cr: c.r, R });
  let prev = (await scan(city)).layers;
  for (let t = 0; t < TURNS; t++) {
    const before = await scan(city);
    const doneBefore = doneCount;
    const r = await C.endTurnAndWait(sess, 120000);
    const after = await scan(city);
    const added = [];
    for (const [hk, v] of Object.entries(after.layers)) {
      const old = prev[hk] ? prev[hk].l : [];
      for (const k of v.l) if (!old.includes(k)) added.push({ hex: hk, key: k });
      if (v.clr && !(prev[hk] && prev[hk].clr)) added.push({ hex: hk, key: 'wyrab(start)' });
    }
    log.push({ turnFrom: before.pop, turnTo: after.pop, poolBefore: before.pool, poolAfter: after.pool, added, ms: r.ms });
    prev = after.layers;
    if (!r.ok) { errors.push('tura nie ruszyla przy t=' + t + ' logi: ' + JSON.stringify(logs.slice(-6))); try { await page.screenshot({ path: OUT.replace(/\.json$/, '-stall.png') }); } catch (e) { /* ignore */ } break; }
    void doneBefore;
  }
  const popEnd = await page.evaluate(() => { window.__capSnap = null; window.__pracaPoolSaveLoadTestDebug.roundTrip(); const s = window.__capSnap; return s ? s.cities.filter((c) => c.ownerId === 0).map((c) => c.population) : null; });
  fs.writeFileSync(OUT, JSON.stringify({ variant: VARIANT, pick: pickInfo, city, policy: snap.policy, mapSnapshot: snap.mapSnapshot, log, errors, popEnd }));
  console.log('turns', log.length, 'adds', log.reduce((n, x) => n + x.added.length, 0), 'errors', errors.length, 'popEnd', JSON.stringify(popEnd));
  for (const e of log) if (e.added.length) console.log(`t${e.turnFrom} pool ${Math.round(e.poolBefore)}->${Math.round(e.poolAfter)} ${e.added.map((a) => a.key + '@' + a.hex).join(' ')}`);
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
