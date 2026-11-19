'use strict';
/**
 * ai-ai-alliance-surcharge-test.cjs -- R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-SOFTEN-MEASURE-Q1.
 * Mnożnik dopłaty D (parytet siły) WYŁĄCZNIE dla ścieżki sojuszy AI↔AI (gra/src/game/ai-ai-treaty-evaluate.ts).
 *
 *  (D1) domyślny mnożnik z danych = 1,0 (bez zmiany);
 *  (D2) mnożnik 1,0 -> paymentGold = parity.D (bit-w-bit jak przed zmianą);
 *  (D3) mnożnik 0,5 -> paymentGold = round(D * 0,5); parity.D nieskalowane;
 *  (D4) mnożnik 0,25 -> paymentGold = round(D * 0,25);
 *  (D5) setter null -> powrót do wartości z danych (1,0);
 *  (D6) r = 1 (równe moce) -> D = 0 niezależnie od mnożnika, płatnik null;
 *  (D7) skarbiec płatnika: przy mnożniku 0,5 i skarbcu round(D*0,5) -> akceptacja; o 1 PN mniej -> odmowa „brakuje”;
 *  (D8) statycznie: moduły importujące ai-ai-treaty-evaluate to wyłącznie ai-ai-* (ścieżka AI↔AI).
 *  Mutanty (kopia źródła w pamięci, esbuild) — każdy musi czerwienić test:
 *  M1 skalowanie D usunięte; M2 mnożnik zafiksowany na 1; M3 setter bez efektu.
 *
 *   node tools/ai-ai-alliance-surcharge-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const SRC_FILE = path.resolve(GAME_DIR, 'ai-ai-treaty-evaluate.ts');
const ORIG = fs.readFileSync(SRC_FILE, 'utf8');

function loadModule(replacements) {
  let src = ORIG;
  for (const [from, to] of replacements || []) {
    if (!src.includes(from)) throw new Error('mutant anchor missing: ' + from.slice(0, 60));
    src = src.replace(from, to);
  }
  const res = esbuild.buildSync({
    stdin: { contents: src, resolveDir: GAME_DIR, sourcefile: 'ai-ai-treaty-evaluate.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

function side(power, treasuryGold) {
  return { power, treasuryGold, allies: [], enemies: [] };
}

function base(over) {
  return Object.assign({
    actionId: 'sojusz_pelny',
    proposer: side(1000, 1e9),
    target: side(2000, 1e9),
    relacja: 150,
    zaufanie: 100,
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
  const reset = () => M.setAiAiDopłataMnoznikForTest(null);

  check('D1 domyślny mnożnik z danych = 1,0', () => {
    reset();
    const m = M.aiAiDopłataMnoznik();
    return m === 1 ? true : `mnożnik=${m}`;
  });

  check('D2 mnożnik 1,0: paymentGold = parity.D (bez zmiany)', () => {
    reset();
    const r = ev();
    if (!r.accept) return `odmowa: ${r.reason}`;
    if (!(r.parity.D > 0)) return `D=${r.parity.D} (scenariusz bez dopłaty)`;
    return r.paymentGold === r.parity.D && r.payer === 'proposer' ? true : `paymentGold=${r.paymentGold} D=${r.parity.D} payer=${r.payer}`;
  });

  check('D3 mnożnik 0,5: paymentGold = round(D*0,5); parity.D bez zmian', () => {
    reset();
    const D = ev().parity.D;
    M.setAiAiDopłataMnoznikForTest(0.5);
    const r = ev();
    reset();
    if (!r.accept) return `odmowa: ${r.reason}`;
    if (r.parity.D !== D) return `parity.D zmienione: ${r.parity.D} != ${D}`;
    return r.paymentGold === Math.round(D * 0.5) && r.paymentGold > 0 ? true : `paymentGold=${r.paymentGold} D=${D}`;
  });

  check('D4 mnożnik 0,25: paymentGold = round(D*0,25)', () => {
    reset();
    const D = ev().parity.D;
    M.setAiAiDopłataMnoznikForTest(0.25);
    const r = ev();
    reset();
    return r.paymentGold === Math.round(D * 0.25) ? true : `paymentGold=${r.paymentGold} D=${D}`;
  });

  check('D5 setter null wraca do wartości z danych', () => {
    M.setAiAiDopłataMnoznikForTest(0.5);
    M.setAiAiDopłataMnoznikForTest(null);
    const r = ev();
    return r.paymentGold === r.parity.D ? true : `paymentGold=${r.paymentGold} D=${r.parity.D}`;
  });

  check('D6 r = 1 (równe moce): D = 0, płatnik null przy mnożniku 0,5', () => {
    M.setAiAiDopłataMnoznikForTest(0.5);
    const r = ev({ proposer: side(1000, 1e9), target: side(1000, 1e9) });
    reset();
    if (!r.accept) return `odmowa: ${r.reason}`;
    return r.paymentGold === 0 && r.payer === null ? true : `paymentGold=${r.paymentGold} payer=${r.payer}`;
  });

  check('D7 skarbiec: mnożnik 0,5 akceptuje przy round(D*0,5); o 1 PN mniej -> odmowa „brakuje”', () => {
    reset();
    const D = ev().parity.D;
    const need = Math.round(D * 0.5);
    M.setAiAiDopłataMnoznikForTest(0.5);
    const ok = ev({ proposer: side(1000, need) });
    const bad = ev({ proposer: side(1000, need - 1) });
    reset();
    if (!ok.accept) return `przy skarbcu ${need} odmowa: ${ok.reason}`;
    if (bad.accept || !/brakuje/.test(bad.reason)) return `przy skarbcu ${need - 1}: accept=${bad.accept} reason=${bad.reason}`;
    return true;
  });

  check('D8 moduły importujące ai-ai-treaty-evaluate: tylko ai-ai-* (ścieżka AI↔AI)', () => {
    const files = fs.readdirSync(GAME_DIR).filter(f => f.endsWith('.ts'));
    const bad = [];
    for (const f of files) {
      const txt = fs.readFileSync(path.join(GAME_DIR, f), 'utf8');
      if (/from '\.\/ai-ai-treaty-evaluate'/.test(txt) && !f.startsWith('ai-ai-')) bad.push(f);
    }
    return bad.length === 0 ? true : `poza ai-ai-*: ${bad.join(', ')}`;
  });

  check('D9 fallback: ujemny / NaN / Infinity -> mnożnik 1,0 (bez skalowania)', () => {
    const wrong = [];
    for (const v of [-1, NaN, Infinity, -Infinity]) {
      M.setAiAiDopłataMnoznikForTest(v);
      const m = M.aiAiDopłataMnoznik();
      if (m !== 1) wrong.push(`${v}->${m}`);
    }
    reset();
    return wrong.length === 0 ? true : `niebezpieczny fallback: ${wrong.join(', ')}`;
  });

  check('D10 wiring (statyczny): main.ts woła setter z haka civTest; runner ma --mnoznik', () => {
    const mainTxt = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
    const runnerTxt = fs.readFileSync(path.resolve(GRA_ROOT, 'tools', 'ai-ai-alliance-measure-run.cjs'), 'utf8');
    if (!/setAiAiDopłataMnoznikForTest\(\(window as any\)\.__civAiDopłataMnoznikMeasure\)/.test(mainTxt)) return 'brak wywołania settera w main.ts';
    if (!/__civAiDopłataMnoznikMeasure/.test(runnerTxt) || !/--mnoznik/.test(runnerTxt)) return 'runner bez --mnoznik / __civAiDopłataMnoznikMeasure';
    return true;
  });

  return out;
}

const liveRes = runSuite(loadModule([]));

const MUTANTS = [
  ['M1 skalowanie D usunięte', [['const D = mnoznik === 1 ? split.D : Math.round(split.D * mnoznik);', 'const D = split.D;']]],
  ['M2 mnożnik zafiksowany na 1', [['const mnoznik = aiAiDopłataMnoznik();', 'const mnoznik = 1;']]],
  ['M3 setter bez efektu', [['const v = dopłataMnoznikNadpisanieTest ?? ', 'const v = ']]],
  ['M4 fallback usunięty (ujemny/NaN przepuszczone)', [['return typeof v === \'number\' && Number.isFinite(v) && v >= 0 ? v : 1;', 'return v;']]],
];

let allOk = liveRes.every(r => r.ok);
const lines = [];
for (const r of liveRes) lines.push(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name}${r.ok ? '' : ' :: ' + r.detail}`);
for (const [name, repl] of MUTANTS) {
  let res;
  try { res = runSuite(loadModule(repl)); } catch (e) { res = [{ ok: false, name: 'anchor', detail: String(e.message) }]; }
  const detected = res.some(r => !r.ok);
  if (!detected) allOk = false;
  lines.push(`${detected ? 'MUT-OK  ' : 'MUT-MISS'} ${name}`);
}
console.log(lines.join('\n'));
console.log(allOk ? 'RESULT: ALL GREEN (live + mutants detected)' : 'RESULT: FAILED');
process.exit(allOk ? 0 : 1);
