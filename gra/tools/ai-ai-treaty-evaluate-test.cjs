'use strict';
/**
 * ai-ai-treaty-evaluate-test.cjs -- R-WEB-AI-AI-TREATIES-E1-EVALUATE-PURE-Q1 (etap E1).
 * Czysta ocena traktatów AI↔AI (gra/src/game/ai-ai-treaty-evaluate.ts): evaluateTreatyOffer.
 *
 *  (A1) NAP: równe moce -> akceptacja, D = 0, płatnik null, durationTurns = 15;
 *  (A2) próg gotowości 0,54 z danych (granica 0,539 odmowa / 0,54 akceptacja);
 *  (A3) r = 1 => D = 0 (brak płatnika);
 *  (A4) słabsza strona płaci D ZŁOTEM (płatnik = słabszy, paymentGold = round(D * 0,5), mnożnik z danych; R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-HALF-Q1);
 *  (A5) skarbiec płatnika za mały => odmowa „brakuje X PN”; skarbiec = D => akceptacja;
 *  (A6) wasal (proposer/target) i akcja spoza zakresu => unsupported, accept = false;
 *  (A7) wojna między stronami => odmowa;
 *  (A8) NAP już istniejący => odmowa (duplikat);
 *  (A9) NAP: Relacja 109 / Zaufanie 29 => odmowa (progi diplomacy.json 110 / 30);
 *  (A10) sojusz defensywny i pełny: rdzeń 130/90 (129 i 89 odmowa), callToWar = true, bez durationTurns;
 *  (A11) sojusz z wrogiem (sojusznik jednej strony = wróg drugiej) => odmowa;
 *  (A12) przemarsz: brak wspólnej granicy => odmowa; ze granicą => akceptacja, bez kar P-4;
 *  (A13) kary P-4 (−30 Relacji / −20 Zaufania) w wyniku NAP i sojuszu, nie przy przemarszu;
 *  (A14) długość NAP z konfiguracji (treatyParams.napCzasTur) — nie magiczna liczba;
 *  (A15) próg gotowości czytany z params (0,6 w params => 0,59 odmowa) — nie stała w kodzie;
 *  (A16) determinizm: 100 wywołań tego samego wejścia => identyczny wynik;
 *  (A17) brak mutacji wejścia (JSON przed = po);
 *  (A18) źródło: brak Math.random, Date, DOM, importu main.ts; brak literału 0.54 w kodzie;
 *  (A19) duplikat sojuszu => odmowa.
 *  Mutanty (kopia źródła w pamięci, esbuild onLoad; NIE git checkout) — każdy musi czerwienić test:
 *  M1 próg gotowości zmieniony; M2 zamiana płatnika; M3 brak limitu skarbca; M4 zła długość NAP;
 *  M5 brak bramki sojusz-z-wrogiem; M6 brak kary P-4 przy NAP.
 *
 *   node tools/ai-ai-treaty-evaluate-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const SRC_FILE = path.resolve(GAME_DIR, 'ai-ai-treaty-evaluate.ts');
const ORIG = fs.readFileSync(SRC_FILE, 'utf8');

/** Buduje moduł z kopii źródła; `replacements` = mutacje tekstu (w pamięci, bez zapisu plików). */
function loadModule(replacements) {
  let src = ORIG;
  for (const [from, to] of replacements || []) src = src.replace(from, to);
  const res = esbuild.buildSync({
    stdin: { contents: src, resolveDir: GAME_DIR, sourcefile: 'ai-ai-treaty-evaluate.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

/** Bazowe wejście: pokój, równe moce, Relacja 150, Zaufanie 60, gotowość 0,6, skarbce 500. */
function base(over) {
  const side = (power, treasuryGold) => ({ power, treasuryGold, allies: [], enemies: [] });
  return Object.assign({
    actionId: 'nap',
    proposer: side(1000, 500),
    target: side(1000, 500),
    relacja: 150,
    zaufanie: 60,
    willingness: 0.6,
    warStatus: 'pokoj',
    hasNap: false,
    hasAlliance: false,
    sharesBorder: true,
  }, over || {});
}

function runSuite(M) {
  const out = [];
  const check = (name, fn) => {
    try { const r = fn(); out.push({ name, ok: r === true, detail: r === true ? '' : String(r) }); }
    catch (e) { out.push({ name, ok: false, detail: String(e && e.message || e) }); }
  };
  const ev = (over) => M.evaluateTreatyOffer(base(over));
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  check('A1 NAP równe moce: akceptacja, D=0, płatnik null, 15 tur', () => {
    const r = ev();
    if (!r.accept) return `odmowa: ${r.reason}`;
    if (r.paymentGold !== 0 || r.payer !== null) return `D/płatnik: ${r.paymentGold}/${r.payer}`;
    if (r.durationTurns !== 15) return `durationTurns=${r.durationTurns}`;
    return true;
  });

  check('A2 próg gotowości 0,54: 0,539 odmowa, 0,54 akceptacja', () => {
    const lo = ev({ willingness: 0.539 });
    const hi = ev({ willingness: 0.54 });
    if (lo.accept) return 'gotowość 0,539 zaakceptowana';
    if (!/gotowość/.test(lo.reason)) return `powód: ${lo.reason}`;
    if (!hi.accept) return `0,54 odmowa: ${hi.reason}`;
    return true;
  });

  check('A3 r = 1 => D = 0', () => {
    const r = ev();
    return r.parity.r === 1 && r.parity.D === 0 ? true : `r=${r.parity.r} D=${r.parity.D}`;
  });

  check('A4a słabszy (proposer 1000 < target 2000) płaci D złotem', () => {
    const r = ev({ proposer: { power: 1000, treasuryGold: 1e9, allies: [], enemies: [] }, target: { power: 2000, treasuryGold: 500, allies: [], enemies: [] } });
    if (!r.accept) return `odmowa: ${r.reason}`;
    if (r.payer !== 'proposer') return `płatnik=${r.payer}`;
    if (!(r.parity.D > 0) || r.paymentGold !== Math.round(r.parity.D * 0.5)) return `paymentGold=${r.paymentGold} D=${r.parity.D}`;
    return true;
  });

  check('A4b słabszy (target 1000 < proposer 2000) płaci D złotem', () => {
    const r = ev({ proposer: { power: 2000, treasuryGold: 500, allies: [], enemies: [] }, target: { power: 1000, treasuryGold: 1e9, allies: [], enemies: [] } });
    if (!r.accept) return `odmowa: ${r.reason}`;
    if (r.payer !== 'target') return `płatnik=${r.payer}`;
    if (!(r.parity.D > 0) || r.paymentGold !== Math.round(r.parity.D * 0.5)) return `paymentGold=${r.paymentGold} D=${r.parity.D}`;
    return true;
  });

  check('A5a skarbiec o 1 PN za mały => odmowa „brakuje 1 PN”', () => {
    const probe = ev({ proposer: { power: 1000, treasuryGold: 1e9, allies: [], enemies: [] }, target: { power: 2000, treasuryGold: 0, allies: [], enemies: [] } });
    const need = Math.round(probe.parity.D * 0.5);
    const r = ev({ proposer: { power: 1000, treasuryGold: need - 1, allies: [], enemies: [] }, target: { power: 2000, treasuryGold: 0, allies: [], enemies: [] } });
    if (r.accept) return 'zaakceptowano przy za małym skarbcu';
    if (!/brakuje 1 PN/.test(r.reason)) return `powód: ${r.reason}`;
    return true;
  });

  check('A5b skarbiec = D => akceptacja (skarbiec nie schodzi poniżej zera)', () => {
    const D = Math.round(ev({ proposer: { power: 1000, treasuryGold: 1e9, allies: [], enemies: [] }, target: { power: 2000, treasuryGold: 0, allies: [], enemies: [] } }).parity.D * 0.5);
    const r = ev({ proposer: { power: 1000, treasuryGold: D, allies: [], enemies: [] }, target: { power: 2000, treasuryGold: 0, allies: [], enemies: [] } });
    return r.accept ? true : `odmowa: ${r.reason}`;
  });

  check('A6 wasal i akcja spoza zakresu => unsupported', () => {
    const v1 = ev({ target: { power: 1000, treasuryGold: 500, isVassal: true, allies: [], enemies: [] } });
    const v2 = ev({ proposer: { power: 1000, treasuryGold: 500, isVassal: true, allies: [], enemies: [] } });
    const v3 = ev({ actionId: 'wasal' });
    if (!(v1.unsupported && !v1.accept && v2.unsupported && !v2.accept && v3.unsupported && !v3.accept)) {
      return `unsupported: ${v1.unsupported}/${v2.unsupported}/${v3.unsupported}`;
    }
    return true;
  });

  check('A7 wojna między stronami => odmowa', () => {
    const r = ev({ warStatus: 'wojna' });
    return !r.accept && /wojny/.test(r.reason) ? true : `wynik: ${r.accept} ${r.reason}`;
  });

  check('A8 NAP już istnieje => odmowa (duplikat)', () => {
    const r = ev({ hasNap: true });
    return !r.accept && /już istnieje/.test(r.reason) ? true : `wynik: ${r.accept} ${r.reason}`;
  });

  check('A9 NAP: Relacja 109 / Zaufanie 29 => odmowa', () => {
    const a = ev({ relacja: 109 });
    const b = ev({ zaufanie: 29 });
    if (a.accept || b.accept) return `zaakceptowano: ${a.accept}/${b.accept}`;
    return true;
  });

  check('A10 sojusz defensywny i pełny: rdzeń 130/90, callToWar, bez durationTurns', () => {
    for (const act of ['sojusz_defensywny', 'sojusz_pelny']) {
      const ok = ev({ actionId: act, relacja: 130, zaufanie: 90 });
      const lowR = ev({ actionId: act, relacja: 129, zaufanie: 90 });
      const lowZ = ev({ actionId: act, relacja: 130, zaufanie: 89 });
      if (!ok.accept) return `${act} odmowa: ${ok.reason}`;
      if (lowR.accept || lowZ.accept) return `${act} zaakceptowano poniżej rdzenia`;
      if (ok.callToWar !== true) return `${act} callToWar=${ok.callToWar}`;
      if (ok.durationTurns !== undefined) return `${act} durationTurns=${ok.durationTurns}`;
    }
    return true;
  });

  check('A11 sojusz z wrogiem (sojusznik proposera = wróg targetu) => odmowa', () => {
    const r = ev({
      actionId: 'sojusz_pelny', relacja: 150, zaufanie: 95,
      proposer: { power: 1000, treasuryGold: 500, allies: [3], enemies: [] },
      target: { power: 1000, treasuryGold: 500, allies: [], enemies: [3] },
    });
    return !r.accept && /wrogiem/.test(r.reason) ? true : `wynik: ${r.accept} ${r.reason}`;
  });

  check('A12 przemarsz: bez granicy odmowa; ze granicą akceptacja bez kar P-4', () => {
    const no = ev({ actionId: 'granice', sharesBorder: false });
    const yes = ev({ actionId: 'granice', sharesBorder: true });
    if (no.accept) return 'przemarsz bez granicy zaakceptowany';
    if (!yes.accept) return `odmowa: ${yes.reason}`;
    if (yes.breachRelationDelta !== undefined || yes.breachTrustDelta !== undefined) return 'kara P-4 przy przemarszu';
    return true;
  });

  check('A13 kary P-4 (−30 / −20) w wyniku NAP i sojuszu', () => {
    const n = ev();
    const s = ev({ actionId: 'sojusz_defensywny', relacja: 130, zaufanie: 90 });
    if (n.breachRelationDelta !== -30 || n.breachTrustDelta !== -20) return `NAP: ${n.breachRelationDelta}/${n.breachTrustDelta}`;
    if (s.breachRelationDelta !== -30 || s.breachTrustDelta !== -20) return `sojusz: ${s.breachRelationDelta}/${s.breachTrustDelta}`;
    return true;
  });

  check('A14 długość NAP z konfiguracji (treatyParams.napCzasTur = 10 => 10)', () => {
    const r = M.evaluateTreatyOffer(base({ treatyParams: { napCzasTur: 10, zerwanieRelacja: -30, zerwanieZaufanie: -20 } }));
    return r.durationTurns === 10 ? true : `durationTurns=${r.durationTurns}`;
  });

  check('A15 próg gotowości z params (0,6 => 0,59 odmowa, 0,6 akceptacja)', () => {
    const params = {
      progSojuszWillingnessMin: 0.6, progNapRelacja: 110, progNapZaufanie: 30,
      progSojuszRelacja: 130, progSojuszZaufanie: 90, progUmowaMinRelacja: 130,
    };
    const lo = M.evaluateTreatyOffer(base({ params, willingness: 0.59 }));
    const hi = M.evaluateTreatyOffer(base({ params, willingness: 0.6 }));
    if (lo.accept) return 'gotowość 0,59 zaakceptowana przy progu 0,6';
    if (!hi.accept) return `0,6 odmowa: ${hi.reason}`;
    return true;
  });

  check('A16 determinizm: 100 wywołań, identyczny wynik', () => {
    const first = JSON.stringify(ev({ target: { power: 1500, treasuryGold: 900, allies: [], enemies: [] } }));
    for (let i = 0; i < 100; i++) {
      if (JSON.stringify(ev({ target: { power: 1500, treasuryGold: 900, allies: [], enemies: [] } })) !== first) return `różny wynik przy ${i}`;
    }
    return true;
  });

  check('A17 brak mutacji wejścia', () => {
    const c = base({ target: { power: 2000, treasuryGold: 900, allies: [5], enemies: [6] } });
    const before = JSON.stringify(c);
    M.evaluateTreatyOffer(c);
    return JSON.stringify(c) === before ? true : 'wejście zmienione';
  });

  check('A18 źródło czyste: brak Math.random/Date/DOM/main, brak literału 0.54', () => {
    const bad = [];
    const code = ORIG.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    if (/Math\.random/.test(code)) bad.push('Math.random');
    if (/\bDate\b|Date\.now/.test(code)) bad.push('Date');
    if (/document\.|window\./.test(code)) bad.push('DOM');
    if (/from '\.\/main'|from "\.\/main"|\/main\.ts/.test(code)) bad.push('import main');
    if (/\b0\.54\b/.test(code)) bad.push('literał 0.54');
    return bad.length === 0 ? true : bad.join(', ');
  });

  check('A19 duplikat sojuszu => odmowa', () => {
    const r = ev({ actionId: 'sojusz_pelny', relacja: 150, zaufanie: 95, hasAlliance: true });
    return !r.accept && /sojusz już istnieje/.test(r.reason) ? true : `wynik: ${r.accept} ${r.reason}`;
  });

  return out;
}

const live = loadModule([]);
const liveRes = runSuite(live);
let pass = 0; let fail = 0;
for (const r of liveRes) {
  if (r.ok) pass++; else fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : ' :: ' + r.detail}`);
}

const MUTANTS = [
  ['M1 próg gotowości zmieniony (> zamiast >=)', [['!(ctx.willingness >= params.progSojuszWillingnessMin)', '!(ctx.willingness > params.progSojuszWillingnessMin)']]],
  ['M2 zamiana płatnika', [["const payer: 'proposer' | 'target' = split.strongerSide === 'a' ? 'target' : 'proposer';", "const payer: 'proposer' | 'target' = split.strongerSide === 'a' ? 'proposer' : 'target';"]]],
  ['M3 brak limitu skarbca', [['if (D > have) {', 'if (false) {']]],
  ['M4 zła długość NAP', [['if (actionId === \'nap\') extras.durationTurns = treatyParams.napCzasTur;', "if (actionId === 'nap') extras.durationTurns = 10;"]]],
  ['M5 brak bramki sojusz-z-wrogiem', [['if (isAllianceAction(actionId) && allianceWithEnemy(ctx.proposer, ctx.target)) {', 'if (false) {']]],
  ['M6 brak kary P-4 przy NAP', [['extras.breachRelationDelta = treatyParams.zerwanieRelacja;', 'extras.breachRelationDelta = 0;']]],
];
let mutFail = 0;
for (const [name, reps] of MUTANTS) {
  let applied = true;
  for (const [from] of reps) if (!ORIG.includes(from)) applied = false;
  if (!applied) { console.log(`FAIL ${name} :: mutacja nie trafiła w źródło`); mutFail++; continue; }
  let res;
  try { res = runSuite(loadModule(reps)); } catch (e) { res = [{ ok: false, name: 'load', detail: String(e.message || e) }]; }
  const killed = res.some(r => !r.ok);
  console.log(`${killed ? 'KILLED' : 'SURVIVED'} ${name}`);
  if (!killed) mutFail++;
}

console.log(`\nai-ai-treaty-evaluate-test: ${pass} pass / ${fail} fail; mutanty niewykryte: ${mutFail}`);
process.exit(fail === 0 && mutFail === 0 ? 0 : 1);
