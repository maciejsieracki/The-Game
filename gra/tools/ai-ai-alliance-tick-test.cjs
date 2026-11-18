'use strict';
/**
 * ai-ai-alliance-tick-test.cjs -- R-WEB-AI-AI-ALLIANCES-E3-WIRING-FLAGGED-Q1 (etap B1).
 * Czysty krok sojuszy AI↔AI (gra/src/game/ai-ai-alliance-tick.ts): planAiAiAllianceTickFull.
 *
 *  (S1) flaga torSojuszyAktywny = false domyślnie (isAiAiAllianceTickEnabled); hak testowy działa i wraca do danych;
 *  (S2) limit 2 sojusze na cywilizację: sekwencja tur 8,16,...,40 z dodawaniem sojuszy -> max liczba <= 2;
 *  (S3) brak sojuszu w stanie wojny (planer odrzuca nawet przy evaluate = zawsze akceptuj);
 *  (S4) brak duplikatów pary (A->B i B->A w jednej turze, zawarte pary wykluczone);
 *  (S5) flaga/hak: gdy brak kandydatów (wszystkie pary odfiltrowane) -> zero zmian;
 *  (S6) wybór celu: najwyższa willingness; przy remisie wspólny wróg; potem najniższe id;
 *  (S7) kadencja: 0 sojuszy = próba co turę; 1 sojusz = tylko gdy tura % alliancePonowneProbyTur === 0;
 *  (S8) skarbiec płatnika nigdy poniżej zera; dopłata D przelana złotem;
 *  (S9) co najwyżej 1 próba (evaluate) na proponenta na turę;
 *  (S10) determinizm i brak mutacji wejścia;
 *  (S11) E1 (prawdziwe evaluateTreatyOffer): rdzeń 150/100 + gotowość 0,6 -> akceptacja, bezterminowy, callToWar;
 *        gotowość 0,53 -> odmowa; wojna -> odmowa;
 *  (S13) limit proponenta: proponent z 2 sojuszami nie proponuje kolejnego;
 *  (S14) para z istniejącym sojuszem nie jest proponowana (prefilter przepuszcza, evaluate akceptuje);
 *  (S12) main.ts: tickAiAiAllianceRequests zaczyna się od bramki flagi i jest wołane w bloku try po tickAiAiTreatyRequests;
 *        moduł bez Math.random / Date / DOM.
 *  Mutanty (kopia źródła w pamięci, esbuild; NIE git checkout) — każdy musi czerwienić test:
 *  M1 limit sojuszy usunięty; M2 bramka wojny usunięta (przy evaluate = akceptuj); M3 bramka duplikatów usunięta;
 *  M4 kadencja 1-sojuszowa usunięta; M5 sortowanie willingness odwrócone; M6 kontrola skarbca usunięta;
 *  M7 limit proponenta off-by-one (> zamiast >=); M8 bramka hasAlliance usunięta.
 *
 *   node tools/ai-ai-alliance-tick-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const SRC_FILE = path.resolve(GAME_DIR, 'ai-ai-alliance-tick.ts');
const MAIN_FILE = path.resolve(GRA_ROOT, 'src', 'main.ts');
const ORIG = fs.readFileSync(SRC_FILE, 'utf8');

function loadModule(replacements) {
  let src = ORIG;
  for (const [from, to] of replacements || []) {
    if (!src.includes(from)) throw new Error('mutant anchor missing: ' + from.slice(0, 60));
    src = src.replace(from, to);
  }
  const res = esbuild.buildSync({
    stdin: { contents: src, resolveDir: GAME_DIR, sourcefile: 'ai-ai-alliance-tick.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

const ACCEPT_ALL = () => ({ accept: true, reason: 'ok', paymentGold: 0, payer: null, parity: { S: 0, W: 0, D: 0, r: 1 }, durationTurns: undefined });

/** Budowa wejścia kroku. `o.pairs` = Set kluczy "a_b" już sojuszniczych (aktualizowane przez wołającego). */
function makeInput(o) {
  const pairs = o.pairs || new Set();
  const key = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  const base = { warStatus: 'pokoj', hasNap: false, sharesBorder: true, relacja: 150, zaufanie: 100, willingness: 0.6 };
  return {
    turn: o.turn ?? 1,
    owners: o.owners,
    alliancesCount: new Map(o.counts || o.owners.map(x => [x, 0])),
    pairPrefilter: o.prefilter || ((p, t) => !pairs.has(key(p, t))),
    pairInfo: (p, t) => Object.assign({}, base, { hasAlliance: pairs.has(key(p, t)) }, o.info ? o.info(p, t) : {}),
    sideOf: (oid) => ({
      power: 1000,
      treasuryGold: 0,
      allies: [],
      enemies: (o.enemies && o.enemies[oid]) || [],
    }),
    treasury: new Map(o.treasury || o.owners.map(x => [x, 500])),
    maxSojuszy: o.maxSojuszy,
    ponowneProbyTur: o.ponowne,
    evaluate: o.real ? undefined : (o.evaluate || ACCEPT_ALL),
  };
}

function runSuite(M) {
  const out = [];
  const check = (name, fn) => {
    try { const r = fn(); out.push({ name, ok: r === true, detail: r === true ? '' : String(r) }); }
    catch (e) { out.push({ name, ok: false, detail: String(e && e.message || e) }); }
  };

  check('S1 flaga domyslnie false; hak testowy nadpisuje i wraca do danych', () => {
    M.setAiAiAllianceTickEnabledForTest(null);
    if (M.isAiAiAllianceTickEnabled() !== false) return 'domyslnie nie false';
    M.setAiAiAllianceTickEnabledForTest(true);
    if (M.isAiAiAllianceTickEnabled() !== true) return 'hak true nie dziala';
    M.setAiAiAllianceTickEnabledForTest(null);
    if (M.isAiAiAllianceTickEnabled() !== false) return 'powrot do danych nie dziala';
    return true;
  });

  check('S2 limit 2 sojusze na cywilizacje (sekwencja tur 8..40, 6 AI)', () => {
    const owners = [0, 1, 2, 3, 4, 5];
    const pairs = new Set();
    const counts = new Map(owners.map(x => [x, 0]));
    for (const turn of [8, 16, 24, 32, 40]) {
      const r = M.planAiAiAllianceTickFull(makeInput({ turn, owners, counts, pairs }));
      for (const a of r.accepted) pairs.add(a.proposer < a.target ? `${a.proposer}_${a.target}` : `${a.target}_${a.proposer}`);
      for (const [k, v] of r.alliancesCountPo) counts.set(k, v);
    }
    const recount = new Map(owners.map(x => [x, 0]));
    for (const k of pairs) { const [a, b] = k.split('_').map(Number); recount.set(a, recount.get(a) + 1); recount.set(b, recount.get(b) + 1); }
    const max = Math.max(...recount.values());
    if (max > 2) return `max sojuszy ${max} > 2`;
    if (pairs.size < 2) return 'za mało sojuszy (test bez treści)';
    return true;
  });

  check('S3 brak sojuszu w stanie wojny (nawet przy evaluate = akceptuj)', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({
      turn: 1, owners: [0, 1],
      info: (p, t) => ({ warStatus: 'wojna' }),
      prefilter: () => true,
    }));
    if (r.accepted.length !== 0) return 'sojusz zawarty w stanie wojny';
    return true;
  });

  check('S4 brak duplikatow pary w jednej turze (0 proponuje 1, 1 proponuje 0 przy turze 8)', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({ turn: 8, owners: [0, 1], counts: [[0, 0], [1, 1]], maxSojuszy: 3 }));
    if (r.accepted.length !== 1) return `zawarto ${r.accepted.length} sojuszy zamiast 1`;
    return true;
  });

  check('S5 brak kandydatow (prefilter odrzuca wszystko) -> zero zmian', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({ turn: 1, owners: [0, 1, 2], prefilter: () => false }));
    if (r.accepted.length !== 0) return 'zawarto mimo braku kandydatow';
    for (const [k, v] of r.alliancesCountPo) if (v !== 0) return `licznik ${k} zmieniony`;
    return true;
  });

  check('S6a wybor celu: najwyzsza willingness', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({
      turn: 1, owners: [0, 1, 2, 3],
      info: (p, t) => ({ willingness: t === 1 ? 0.55 : t === 2 ? 0.7 : 0.6 }),
    }));
    const first = r.accepted.find(a => a.proposer === 0);
    if (!first || first.target !== 2) return `cel ${first && first.target} zamiast 2`;
    return true;
  });

  check('S6b remis willingness -> wspolny wrog wygrywa', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({
      turn: 1, owners: [0, 1, 2, 3],
      info: (p, t) => ({ willingness: t === 2 ? 0.7 : t === 3 ? 0.7 : 0.55 }),
      enemies: { 0: [7], 3: [7] },
    }));
    const first = r.accepted.find(a => a.proposer === 0);
    if (!first || first.target !== 3) return `cel ${first && first.target} zamiast 3 (wspolny wrog)`;
    return true;
  });

  check('S6c remis bez wspolnego wroga -> najnizsze id', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({
      turn: 1, owners: [0, 1, 2, 3],
      info: (p, t) => ({ willingness: t === 2 ? 0.7 : t === 3 ? 0.7 : 0.55 }),
    }));
    const first = r.accepted.find(a => a.proposer === 0);
    if (!first || first.target !== 2) return `cel ${first && first.target} zamiast 2 (najnizsze id)`;
    return true;
  });

  check('S7a kadencja: 0 sojuszy = proba co ture (tura 3)', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({ turn: 3, owners: [0, 1], counts: [[0, 0], [1, 0]] }));
    if (r.accepted.length !== 1) return `brak proby przy 0 sojuszach (tura 3)`;
    return true;
  });

  check('S7b kadencja: 1 sojusz = tylko przy turze podzielnej przez 8', () => {
    const off = M.planAiAiAllianceTickFull(makeInput({ turn: 1, owners: [0, 1], counts: [[0, 1], [1, 1]] }));
    if (off.accepted.length !== 0) return 'proba w turze 1 mimo 1 sojuszu';
    const on = M.planAiAiAllianceTickFull(makeInput({ turn: 8, owners: [0, 1], counts: [[0, 1], [1, 1]] }));
    if (on.accepted.length !== 1) return 'brak proby w turze 8 przy 1 sojuszu';
    return true;
  });

  check('S8 skarbiec platnika nigdy ponizej zera; D zlotem na odbiorce', () => {
    const payEval = () => ({ accept: true, reason: 'ok', paymentGold: 100, payer: 'proposer', parity: { S: 0, W: 0, D: 0, r: 1 } });
    const pusty = M.planAiAiAllianceTickFull(makeInput({ turn: 1, owners: [0, 1], treasury: [[0, 0], [1, 0]], evaluate: payEval }));
    if (pusty.accepted.length !== 0) return 'zawarto mimo braku zlota na D';
    if (pusty.treasuryPo.get(0) < 0) return 'skarbiec ujemny';
    const ok = M.planAiAiAllianceTickFull(makeInput({ turn: 1, owners: [0, 1], treasury: [[0, 300], [1, 500]], evaluate: payEval }));
    if (ok.accepted.length !== 1) return 'brak zawarcia przy wystarczajacym skarbcu';
    if (ok.treasuryPo.get(0) !== 200 || ok.treasuryPo.get(1) !== 600) return `przelew: ${ok.treasuryPo.get(0)} / ${ok.treasuryPo.get(1)}`;
    return true;
  });

  check('S9 co najwyzej 1 proba (evaluate) na proponenta na ture', () => {
    const calls = [];
    const evaluate = (ctx) => { calls.push(ctx); return { accept: false, reason: 'x', paymentGold: 0, payer: null, parity: { S: 0, W: 0, D: 0, r: 1 } }; };
    M.planAiAiAllianceTickFull(makeInput({ turn: 1, owners: [0, 1, 2, 3], evaluate }));
    if (calls.length > 4) return `evaluate ${calls.length} razy dla 4 proponentow`;
    return true;
  });

  check('S10 determinizm i brak mutacji wejscia', () => {
    const mk = () => makeInput({ turn: 8, owners: [0, 1, 2], counts: [[0, 0], [1, 1], [2, 0]] });
    const i1 = mk();
    const before = JSON.stringify([...i1.alliancesCount.entries()]);
    const a = JSON.stringify(M.planAiAiAllianceTickFull(i1).accepted.map(x => [x.proposer, x.target]));
    const b = JSON.stringify(M.planAiAiAllianceTickFull(mk()).accepted.map(x => [x.proposer, x.target]));
    if (a !== b) return 'niedeterministyczny wynik';
    if (JSON.stringify([...i1.alliancesCount.entries()]) !== before) return 'wejscie zmodyfikowane';
    return true;
  });

  check('S11a E1 prawdziwe evaluate: rdzen 150/100, gotowosc 0,6 -> akceptacja bezterminowa, callToWar', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({ turn: 1, owners: [0, 1], real: true }));
    if (r.accepted.length !== 1) return `brak akceptacji (${r.accepted.length})`;
    const a = r.accepted[0];
    if (a.wygasaTura !== null) return 'sojusz nie jest bezterminowy';
    if (a.result.callToWar !== true) return 'brak callToWar';
    return true;
  });

  check('S11b E1 prawdziwe evaluate: gotowosc 0,53 (ponizej 0,54) -> odmowa', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({ turn: 1, owners: [0, 1], real: true, info: () => ({ willingness: 0.53 }) }));
    if (r.accepted.length !== 0) return 'zawarto mimo gotowosci 0,53';
    return true;
  });

  check('S11c E1 prawdziwe evaluate: wojna -> odmowa', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({ turn: 1, owners: [0, 1], real: true, info: () => ({ warStatus: 'wojna' }) }));
    if (r.accepted.length !== 0) return 'zawarto w stanie wojny';
    return true;
  });

  check('S13 limit proponenta: gracz z 2 sojuszami (= limit) nie proponuje kolejnego', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({
      turn: 8, owners: [0, 1, 2, 3], counts: [[0, 2], [1, 0], [2, 0], [3, 0]], maxSojuszy: 2,
    }));
    if (r.accepted.some(a => a.proposer === 0)) return 'proponent na limicie 2 zawarl kolejny sojusz';
    if ((r.alliancesCountPo.get(0) ?? 0) !== 2) return 'licznik proponenta zmieniony';
    return true;
  });

  check('S14 para z istniejacym sojuszem (hasAlliance=true) nie jest proponowana, nawet gdy prefilter przepuszcza i evaluate akceptuje', () => {
    const r = M.planAiAiAllianceTickFull(makeInput({
      turn: 1, owners: [0, 1], prefilter: () => true, info: () => ({ hasAlliance: true }),
    }));
    if (r.accepted.length !== 0) return 'zawarto duplikat istniejacego sojuszu';
    return true;
  });

  check('S12 main.ts: bramka flagi na poczatku tickAiAiAllianceRequests, wolanie po NAP; moduł bez Math.random/Date/DOM', () => {
    const main = fs.readFileSync(MAIN_FILE, 'utf8');
    if (!/function tickAiAiAllianceRequests\(\): void \{\s*if \(!isAiAiAllianceTickEnabled\(\)\) return;/.test(main)) return 'brak bramki flagi';
    if (!/tickAiAiTreatyRequests\(\);\s*\} catch \(eAiAiTreaty\)[\s\S]*?tickAiAiAllianceRequests\(\);\s*\} catch/.test(main)) return 'brak wolania po kroku NAP';
    if (/Math\.random|new Date|document\.|window\./.test(ORIG)) return 'modul zawiera niedozwolone API';
    return true;
  });

  return out;
}

const SUITE_NAMES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6a', 'S6b', 'S6c', 'S7a', 'S7b', 'S8', 'S9', 'S10', 'S11a', 'S11b', 'S11c', 'S12', 'S13', 'S14'];

function main() {
  const M = loadModule([]);
  const base = runSuite(M);
  let fail = base.filter(r => !r.ok);
  for (const r of base) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name}${r.ok ? '' : ' :: ' + r.detail}`);

  const mutants = {
    M1_limit_removed: [
      ['if (ileP >= maxSojuszy) continue;', 'if (false) continue;'],
      ['if (liczba(t) >= maxSojuszy) continue;', 'if (false) continue;'],
    ],
    M2_war_gate_removed: [
      ["if (info.warStatus === 'wojna' || info.warStatus === 'rozejm') continue;", "if (info.warStatus === 'rozejm') continue;"],
    ],
    M3_duplicate_gate_removed: [
      ['if (t === p || zawartePary.has(kluczPary(p, t))) continue;', 'if (t === p) continue;'],
    ],
    M4_cadence_removed: [
      ['if (ileP >= 1 && (ponowne <= 0 || input.turn % ponowne !== 0)) continue;', 'if (false) continue;'],
    ],
    M5_willingness_reversed: [
      ['kandydat.willingness > best.willingness', 'kandydat.willingness < best.willingness'],
    ],
    M6_treasury_gate_removed: [
      ['if (D > have) continue;', ''],
    ],
    M7_proposer_limit_off_by_one: [
      ['if (ileP >= maxSojuszy) continue;', 'if (ileP > maxSojuszy) continue;'],
    ],
    M8_has_alliance_gate_removed: [
      ['if (info.hasAlliance) continue;', ''],
    ],
  };
  const mutantReport = [];
  for (const [name, reps] of Object.entries(mutants)) {
    let res;
    try {
      res = runSuite(loadModule(reps));
    } catch (e) {
      mutantReport.push({ name, detected: true, why: 'build: ' + (e.message || e) });
      continue;
    }
    const red = res.filter(r => !r.ok).map(r => r.name);
    mutantReport.push({ name, detected: red.length > 0, why: red.join('; ') });
  }
  for (const m of mutantReport) console.log(`${m.detected ? 'MUT-DETECTED' : 'MUT-MISSED  '} ${m.name}${m.why ? ' :: ' + m.why : ''}`);
  M.setAiAiAllianceTickEnabledForTest(null);

  const missedMut = mutantReport.filter(m => !m.detected);
  const ok = fail.length === 0 && missedMut.length === 0;
  console.log(`\nSUMMARY: suite ${base.length - fail.length}/${base.length} OK; mutants detected ${mutantReport.length - missedMut.length}/${mutantReport.length}`);
  process.exit(ok ? 0 : 1);
}

main();
