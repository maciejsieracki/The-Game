'use strict';
/**
 * R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1 (pomiar, bez zmian kodu gry).
 * Prawdziwa bitwa AUTO (3D, Chromium, tryb pomin) przez sonde battle-pursuit-pace-browser-entry.ts.
 *
 * Tryby (BFG_PART):
 *   measure -- (a) strzelcy po zderzeniu: odsetek niewykorzystanego ruchu (pula MP vs stan koncowy aktywacji)
 *              na kilku ziarnach x skladach; (b) doktryny Obrona/Ostrzal i uciekinierzy (flaga doctrineExempt z sondy):
 *              czy po ciosie wykonuja ruch (regula pelnego ruchu nie powinna ich dotyczyc).
 *   det     -- (c) anomalia determinizmu: to samo ziarno N razy, identyczny skrot zdarzen (callers + attackLog).
 *
 * Kryteria (kod wyjscia 1 przy niespelnieniu): mechaniczne niezmienniki -- brak bledow strony, <=1 cios na aktywacje,
 * brak ruchu po ciosie dla doktryn wylaczonych z reguly (b), determinizm (c). Odsetek zmarnowanego ruchu NIE ma progu
 * w tym tescie (prog = decyzja wlasciciela, ABC); jest raportowany z liczb surowych.
 *
 * Uruchom z gra/ (po npm ci): node tools/battle-full-move-gaps-measure.cjs
 *   BFG_PART=measure|det   BFG_SEEDS=1,2,3,4,5   BFG_COMP=0,1,2 (indeksy skladow)   BFG_DET_N=20   BFG_MAX_MS=300000
 *   BFG_OUT=<plik JSON>  (domyslnie runs/.../evidence/measure-<part>.json)
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');

const root = path.resolve(__dirname, '..');
const repo = path.resolve(root, '..');
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')].find(p => p && fs.existsSync(p));
const PART = process.env.BFG_PART || 'measure';
const SEEDS = (process.env.BFG_SEEDS || '1,2,3,4,5').split(',').map(Number);
const MAX_MS = Number(process.env.BFG_MAX_MS || 300000);
const DET_N = Number(process.env.BFG_DET_N || 20);

// Skladay: [atak, obrona]. Indeksy w BFG_COMP.
const COMPS = [
  ['Hastati:8,Lucznik:6,Konnica:4', 'Hastati:14'],
  ['Lucznik:10,Hastati:6', 'Hastati:10,Lucznik:4'],
  ['Lucznik:8,Konnica:6', 'Hastati:8,Konnica:4'],
  // R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1 r2: skladay z kontaktem wrecz (dodane po objeciu FC: C1 daje 0/5 zderzen).
  ['Konnica:8,Hastati:6', 'Hastati:8,Lucznik:6'],
  ['Hastati:12,Lucznik:4', 'Hastati:10,Konnica:4'],
];
const compIdx = (process.env.BFG_COMP || '0,1,2').split(',').map(Number);
const OUT = process.env.BFG_OUT || path.join(repo, 'dyspozycje/autobot/runs/R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1/evidence', `measure-${PART}.json`);

/** Test-only transform sondy (bez zmian plikow w repo): wymusza doktryne jednostek przez window.__ovDoc
 *  (ustawiane addInitScript). Wplyw tylko na _getEffectiveDoctrine w tym jednym przebiegu przegladarki. */
const DOC_INJECT = `{ const __orig = scene._getEffectiveDoctrine.bind(scene); scene._getEffectiveDoctrine = (ru: any) => {
  const ov = (window as any).__ovDoc; if (ov && ru.side === 'def' && ov.def) return ov.def; if (ov && ru.side === 'atk' && ov.atk) return ov.atk; return __orig(ru); }; }
scene.play(() => {});`;
const docPlugin = { name: 'bfg-doctrine-override', enforce: 'pre', transform(code, id) {
  if (!id.includes('battle-pursuit-pace-browser-entry.ts')) return null;
  assert.ok(code.includes('scene.play(() => {});'), 'marker scene.play nie znaleziony');
  return { code: code.replace('scene.play(() => {});', DOC_INJECT), map: null };
} };

async function openPage(browser, base, seed, atk, def, ovDoc) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  if (ovDoc) await page.addInitScript(o => { window.__ovDoc = o; }, ovDoc);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/tools/battle-pursuit-pace-browser-entry.html?mode=skip&seed=${seed}&atk=${atk}&def=${def}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
  await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 });
  const r = await page.evaluate(() => ({ result: window.__e2e.result, rounds: window.__e2e.rounds, callers: window.__e2e.callers || [], attackLog: window.__e2e.attackLog || [], rows: window.__e2e.rows || [], ends: window.__e2e.ends || [] }));
  await page.close();
  assert.deepEqual(errors, [], 'bledy strony: ' + errors.join('; '));
  return r;
}

/** Metryki pojedynczego przebiegu. */
function metrics(r) {
  const firstContact = (r.rounds.find(x => x.contact0) || {}).round ?? Infinity;
  const acts = new Map();
  const push = (k, ev) => { if (!acts.has(k)) acts.set(k, []); acts.get(k).push(ev); };
  for (const c of r.callers) push(c.round + '|' + c.id, { t: 'move', seq: c.seq, round: c.round });
  for (const a of r.attackLog) push(a.round + '|' + a.id, { t: 'hit', seq: a.seq, round: a.round, ranged: a.ranged, mounted: a.mounted });
  const endBy = new Map((r.ends || []).map(e => [e.round + '|' + e.id, e]));
  const rowBy = new Map((r.rows || []).filter(x => x.side === 'atk' || x.side === 'def').map(x => [x.round + '|' + x.id, x]));
  const cellsBy = new Map();
  for (const c of r.callers) { const k = c.round + '|' + c.id; if (!cellsBy.has(k)) cellsBy.set(k, new Set()); cellsBy.get(k).add(c.col + ',' + c.row); }

  const m = {
    firstContact, strikesTotal: 0, doubleStrike: 0,
    shooterActs: 0, shooterPool: 0, shooterLeft: 0, shooterLeftUnexplained: 0, shooterLeftBlocked: 0,
    shooterMoveAfterHit: 0,
    shooterLeftUnexplainedNarrow: 0,
    exemptActs: 0, exemptMoveAfterHit: 0, exemptRouted: 0, exemptDoctrine: 0,
    unexplainedList: [], narrowList: [],
  };
  for (const [k, evs] of acts) {
    evs.sort((x, y) => x.seq - y.seq);
    const hits = evs.filter(e => e.t === 'hit');
    m.strikesTotal += hits.length;
    if (hits.length > 1) m.doubleStrike++;
    const round = evs[0].round;
    const row = rowBy.get(k); const e = endBy.get(k);
    const firstHit = evs.findIndex(x => x.t === 'hit');
    const moveAfter = firstHit >= 0 && evs.slice(firstHit + 1).some(x => x.t === 'move');
    if (round < firstContact) continue;
    // (b) doktryny Obrona/Ostrzal oraz uciekinierzy (wyjatki z DODATKU 6, ABC A)
    if (e && e.doctrineExempt) {
      m.exemptActs++;
      if (e.routed) m.exemptRouted++; else m.exemptDoctrine++;
      if (moveAfter) m.exemptMoveAfterHit++;
    }
    // (a) strzelcy po zderzeniu: pula MP i niewykorzystany ruch przy koncu aktywacji
    const isShooter = !!(row && row.dbg && row.dbg.rb) || (hits[0] && hits[0].ranged);
    if (!isShooter || !e || !row) continue;
    m.shooterActs++;
    if (firstHit >= 0 && hits[0].ranged && moveAfter) m.shooterMoveAfterHit++;
    m.shooterPool += row.mp;
    const left = Math.max(0, e.moveLeft);
    m.shooterLeft += left;
    if (left <= 0) continue;
    // fizyczna blokada wg sondy (ta sama logika co w battle-full-move-strike-test): brak wolnego pola, brak sciezki,
    // stoi w zasiegu wolnego wroga albo silnik stwierdzil brak dokad isc po ciosie.
    const visited = new Set([row.q0 + ',' + row.r0, ...(cellsBy.get(k) || [])]);
    const freeNew = (e.freeCells || []).filter(c => !visited.has(c)).length;
    // Definicja SZEROKA (raportowana jako glowna): + canStrike (stoi w zasiegu wolnego wroga = swiadomy wybor).
    // Definicja WABA (wezsza, bez canStrike): tylko fizyczny brak pola/sciezki/ciosu. Roznica = przypadki canStrike.
    const blocked = freeNew === 0 || !e.pathExists || e.canStrike || e.postStrikeBlocked;
    const blockedNarrow = freeNew === 0 || !e.pathExists || e.postStrikeBlocked;
    const item = { k, left, freeNew, pathExists: e.pathExists, canStrike: e.canStrike, psb: e.postStrikeBlocked, mp: row.mp, mounted: row.mounted };
    if (!blockedNarrow) { m.shooterLeftUnexplainedNarrow += left; m.narrowList.push(item); }
    if (blocked) m.shooterLeftBlocked += left;
    else { m.shooterLeftUnexplained += left; m.unexplainedList.push(item); }
  }
  // Przebieg bez zadnego zderzenia nie ma pomiaru zmarnowanego ruchu (firstContact = Infinity) -- zaznacz.
  m.hasContact = Number.isFinite(firstContact);
  m.hash = crypto.createHash('md5').update(JSON.stringify([
    r.callers.map(c => [c.round, c.id, c.col, c.row, c.seq]), r.attackLog.map(a => [a.round, a.id, a.target, a.seq]),
  ])).digest('hex');
  m.winner = r.result && r.result.winner; m.rounds = r.result && r.result.round;
  return m;
}

async function main() {
  const server = await createServer({ root, plugins: [docPlugin], configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = { part: PART, startedAt: new Date().toISOString(), runs: [], checks: [] };
  try {
    if (PART === 'measure') {
      for (const ci of compIdx) {
        const [atk, def] = COMPS[ci];
        for (const seed of SEEDS) {
          const t0 = Date.now();
          const m = metrics(await openPage(browser, base, seed, atk, def));
          const run = { comp: ci, atk, def, seed, sec: Math.round((Date.now() - t0) / 1000), ...m };
          out.runs.push(run);
          console.log(JSON.stringify({ comp: ci, seed, sec: run.sec, hasContact: m.hasContact, shooterActs: m.shooterActs, pool: m.shooterPool, left: m.shooterLeft, unexpl: m.shooterLeftUnexplained, blocked: m.shooterLeftBlocked, doubleStrike: m.doubleStrike, exemptActs: m.exemptActs, exemptMoveAfterHit: m.exemptMoveAfterHit, winner: m.winner, rounds: m.rounds }));
        }
      }
      const runs = out.runs;
      const sum = k => runs.reduce((s, x) => s + x[k], 0);
      const pool = sum('shooterPool'), left = sum('shooterLeft'), unexpl = sum('shooterLeftUnexplained');
      out.totals = {
        runs: runs.length, runsWithContact: runs.filter(x => x.hasContact).length,
        shooterActs: sum('shooterActs'), shooterPool: pool, shooterLeft: left, shooterLeftUnexplained: unexpl,
        shooterLeftBlocked: sum('shooterLeftBlocked'),
        shooterLeftUnexplainedNarrow: sum('shooterLeftUnexplainedNarrow'),
        wastedSharePct: pool ? Math.round(1000 * left / pool) / 10 : null,
        unexplainedSharePct: pool ? Math.round(1000 * unexpl / pool) / 10 : null,
        unexplainedNarrowSharePct: pool ? Math.round(1000 * sum('shooterLeftUnexplainedNarrow') / pool) / 10 : null,
        perComp: Object.fromEntries(compIdx.map(ci => { const rs = runs.filter(x => x.comp === ci); const p = rs.reduce((s, x) => s + x.shooterPool, 0); const l = rs.reduce((s, x) => s + x.shooterLeft, 0); const u = rs.reduce((s, x) => s + x.shooterLeftUnexplained, 0); const n = rs.reduce((s, x) => s + x.shooterLeftUnexplainedNarrow, 0); return [ci, { runs: rs.length, withContact: rs.filter(x => x.hasContact).length, pool: p, left: l, unexplained: u, unexplainedNarrow: n, wastedPct: p ? Math.round(1000 * l / p) / 10 : null, unexplainedPct: p ? Math.round(1000 * u / p) / 10 : null, unexplainedNarrowPct: p ? Math.round(1000 * n / p) / 10 : null }]; })),
        doubleStrikeActs: sum('doubleStrike'), exemptActs: sum('exemptActs'), exemptRouted: sum('exemptRouted'), exemptDoctrine: sum('exemptDoctrine'),
        exemptMoveAfterHit: sum('exemptMoveAfterHit'), shooterMoveAfterHit: sum('shooterMoveAfterHit'),
      };
      const chk = (name, ok, msg) => out.checks.push({ name, ok, msg: ok ? '' : msg });
      // (inv) brak bledow strony: egzekwowane w openPage (asercja rzuca wyjatek -> exit 1), nie jako osobny check.
      chk('(inv) <=1 cios na aktywacje (cala bitwa)', out.totals.doubleStrikeActs === 0, 'aktywacje z >1 ciosem: ' + out.totals.doubleStrikeActs);
      chk('(b) doktryna Obrona/Ostrzal i uciekinierzy NIE wykonuja ruchu po ciosie', out.totals.exemptMoveAfterHit === 0, 'ruch po ciosie u wylaczonych: ' + out.totals.exemptMoveAfterHit + ' z ' + out.totals.exemptActs + ' aktywacji');
      chk('(a) pomiar strzelcow po zderzeniu wykonany (>0 aktywacji)', out.totals.shooterActs > 0, 'brak aktywacji strzelcow po zderzeniu');
    } else if (PART === 'doctrine') {
      // (b) doktryny Obrona (strona obrony) i Ostrzal (strona ataku) wymuszone w sondzie; uciekinierzy licza sie osobno.
      const [atk, def] = COMPS[compIdx[0]];
      const variants = [
        ['def-defensive', { def: 'defensive' }],
        ['atk-skirmish', { atk: 'skirmish' }],
      ];
      for (const [label, ov] of variants) {
        for (const seed of SEEDS) {
          const m = metrics(await openPage(browser, base, seed, atk, def, ov));
          out.runs.push({ label, seed, comp: compIdx[0], ...m });
          console.log(label, 'seed', seed, JSON.stringify({ exemptActs: m.exemptActs, exemptDoctrine: m.exemptDoctrine, exemptRouted: m.exemptRouted, exemptMoveAfterHit: m.exemptMoveAfterHit, doubleStrike: m.doubleStrike, winner: m.winner, rounds: m.rounds }));
        }
        const rs = out.runs.filter(x => x.label === label);
        const docActs = rs.reduce((s2, x) => s2 + x.exemptDoctrine, 0);
        const mv = rs.reduce((s2, x) => s2 + x.exemptMoveAfterHit, 0);
        const cAct = docActs > 0, cMv = mv === 0;
        out.checks.push({ name: `(b) ${label}: doktryna aktywna w pomiarze (>0 aktywacji)`, ok: cAct, msg: cAct ? '' : 'NIE ZMIERZONO: brak aktywacji tej doktryny po zderzeniu' });
        out.checks.push({ name: `(b) ${label}: brak ruchu po ciosie (regula pelnego ruchu jej nie dotyczy)`, ok: cMv, msg: cMv ? '' : 'ruch po ciosie: ' + mv + ' z ' + docActs + ' aktywacji' });
      }
      out.totals = { variants: variants.map(v => v[0]), runs: out.runs.length };
    } else if (PART === 'det') {
      const [atk, def] = COMPS[compIdx[0]];
      const seed = SEEDS[0];
      const hashes = [];
      for (let i = 0; i < DET_N; i++) {
        const t0 = Date.now();
        const m = metrics(await openPage(browser, base, seed, atk, def));
        hashes.push(m.hash);
        out.runs.push({ i, seed, comp: compIdx[0], sec: Math.round((Date.now() - t0) / 1000), hash: m.hash, winner: m.winner, rounds: m.rounds });
        console.log('det', i, m.hash.slice(0, 8), 'sec', Math.round((Date.now() - t0) / 1000));
      }
      const counts = {}; for (const h of hashes) counts[h] = (counts[h] || 0) + 1;
      out.totals = { n: hashes.length, distinct: Object.keys(counts).length, counts };
      out.checks.push({ name: '(c) determinizm: ten sam seed -> ten sam skrot zdarzen', ok: Object.keys(counts).length === 1, msg: Object.keys(counts).length === 1 ? '' : 'rozne skroty: ' + JSON.stringify(counts) });
    } else {
      throw new Error('nieznana BFG_PART: ' + PART);
    }
  } finally { await browser.close(); await server.close(); }
  out.finishedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('TOTALS', JSON.stringify(out.totals));
  for (const c of out.checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.ok ? '' : ' -- ' + c.msg}`);
  console.log('zapis:', OUT);
  if (out.checks.some(c => !c.ok)) process.exitCode = 1;
}

main().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
