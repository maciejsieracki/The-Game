'use strict';
/**
 * ai-ai-alliance-limit-test.cjs -- R-WEB-AI-AI-ALLIANCE-LIMIT-2-VIOLATED-Q1.
 * Wspólne sprawdzenie limitu sojuszy na cywilizację (gra/src/game/ai-ai-alliance-limit.ts) na PRAWDZIWYCH
 * funkcjach (esbuild), oraz planer toru (gra/src/game/ai-ai-alliance-tick.ts) zasilany tym licznikiem.
 *
 *  (L1) liczenie z pełnego stanu: sojusz AI↔AI i sojusz AI↔gracz liczą się obu stronom (po 1);
 *       sojusz z państwem-miastem i nie-sojusz (NAP) się nie liczą;
 *  (L2) cywilizacja z 2 sojuszami: sojuszLimitPozwala = false dla KAŻDEJ pary z tą cywilizacją;
 *  (L3) symulacja toru (planAiAiAllianceTickFull, accept-all, 80 tur) + ścieżka sióstr (sojuszLimitPozwala
 *       przed każdym dodaniem): ŻADNA cywilizacja nie przekracza 2 sojuszy; sojusze powstają (>0);
 *  (L4) planer z licznikiem zapełnionym (civ 1 ma 2): żadna zaakceptowana para nie zawiera civ 1.
 *  Mutanty (esbuild, kopia źródła w pamięci; plik na dysku NIE zmieniany) -- każdy MUSI czerwienić test:
 *  M1 off-by-one (<= zamiast <); M2 liczenie strony AI usunięte; M3 gracz nie liczony; M4 sprawdzana tylko strona a.
 *
 *   node tools/ai-ai-alliance-limit-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const LIMIT_FILE = path.resolve(GAME_DIR, 'ai-ai-alliance-limit.ts');
const TICK_FILE = path.resolve(GAME_DIR, 'ai-ai-alliance-tick.ts');
const LIMIT_SRC = fs.readFileSync(LIMIT_FILE, 'utf8');

function bundleCjs(opts) {
  const out = esbuild.buildSync(Object.assign({ bundle: true, format: 'cjs', platform: 'node', write: false }, opts));
  const m = { exports: {} };
  new Function('module', 'exports', out.outputFiles[0].text)(m, m.exports);
  return m.exports;
}
function loadFile(file) { return bundleCjs({ entryPoints: [file] }); }
function loadSource(src) {
  return bundleCjs({ stdin: { contents: src, loader: 'ts', resolveDir: GAME_DIR, sourcefile: 'mut.ts' } });
}

const ALLIANCE_KINDS = new Set(['sojusz_pelny', 'sojusz_defensywny', 'sojusz_wojskowy']);
const isAlliance = r => ALLIANCE_KINDS.has(r);
const AI = [1, 4, 7, 10, 13];
const PLAYER = 0;
const CITY_STATE = 99;

function baseInput(mod, deals) {
  return {
    deals,
    isAlliance,
    aiCivs: new Set(AI),
    liczoneStrony: new Set([PLAYER, ...AI]),
    maxSojuszy: 2,
  };
}

// Sprawdzenia; zwraca listę nazw porażek (pusta = zielono).
function checkAll(mod) {
  const fails = [];
  const deals0 = [
    { rodzaj: 'sojusz_pelny', strony: [1, 4] },
    { rodzaj: 'sojusz_pelny', strony: [1, PLAYER] },
    { rodzaj: 'sojusz_pelny', strony: [7, 10] },
    { rodzaj: 'sojusz_pelny', strony: [1, CITY_STATE] },
    { rodzaj: 'nap', strony: [13, 7] },
  ];
  // L1
  const counts = mod.liczbaSojuszyCywilizacji(baseInput(mod, deals0));
  const exp = { 1: 2, 4: 1, 7: 1, 10: 1, 13: 0 };
  for (const k of Object.keys(exp)) {
    if ((counts.get(Number(k)) ?? -1) !== exp[k]) fails.push(`L1 licznik civ ${k} = ${counts.get(Number(k))}, oczekiwano ${exp[k]}`);
  }
  // L2: civ 1 ma 2 sojusze -> każda para z 1 odrzucona; para bez 1 dopuszczona.
  const in0 = baseInput(mod, deals0);
  for (const other of [4, 7, 10, 13]) {
    if (mod.sojuszLimitPozwala(in0, 1, other)) fails.push(`L2 para 1-${other} dopuszczona mimo limitu civ 1`);
    if (mod.sojuszLimitPozwala(in0, other, 1)) fails.push(`L2 para ${other}-1 dopuszczona mimo limitu civ 1 (kolejność odwrotna)`);
  }
  if (mod.sojuszLimitPozwala(in0, 13, 4) !== true) fails.push('L2 para 13-4 odrzucona (oba poniżej limitu)');
  // L3: symulacja toru + ścieżka sióstr.
  const deals = [];
  const pairKey = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  for (let turn = 1; turn <= 80; turn++) {
    const input = baseInput(mod, deals);
    const alliancesCount = mod.liczbaSojuszyCywilizacji(input);
    const plan = tick.planAiAiAllianceTickFull({
      turn,
      owners: AI,
      koalicja: null,
      alliancesCount,
      pairPrefilter: (p, t) => !deals.some(d => isAlliance(d.rodzaj) && d.strony.includes(p) && d.strony.includes(t)),
      pairInfo: () => ({ warStatus: 'pokoj', hasNap: false, hasAlliance: false, sharesBorder: true,
        relacja: 100, zaufanie: 100, willingness: 0.9 }),
      sideOf: oid => ({ power: 1, treasuryGold: 0, allies: [], enemies: [] }),
      treasury: new Map(AI.map(o => [o, 1000])),
      evaluate: () => ({ accept: true, paymentGold: 0, payer: null, reason: 'ok' }),
    });
    for (const tr of plan.accepted) deals.push({ rodzaj: 'sojusz_pelny', strony: [tr.proposer, tr.target] });
    // Ścieżka sióstr: próba każdej pary, dodanie tylko gdy limit pozwala.
    for (let i = 0; i < AI.length; i++) {
      for (let j = i + 1; j < AI.length; j++) {
        const a = AI[i];
        const b = AI[j];
        if (deals.some(d => isAlliance(d.rodzaj) && d.strony.includes(a) && d.strony.includes(b))) continue;
        if ((turn * 7 + a + b) % 3 !== 0) continue; // deterministyczna częstotliwość prób
        if (mod.sojuszLimitPozwala(baseInput(mod, deals), a, b)) deals.push({ rodzaj: 'sojusz_pelny', strony: [a, b] });
      }
    }
  }
  const finalCounts = mod.liczbaSojuszyCywilizacji(baseInput(mod, deals));
  const maxFinal = Math.max(...Array.from(finalCounts.values()));
  if (maxFinal > 2) fails.push(`L3 po symulacji max sojuszy civ = ${maxFinal} (> 2)`);
  const totalPairs = deals.filter(d => isAlliance(d.rodzaj) && AI.includes(d.strony[0]) && AI.includes(d.strony[1])).length;
  if (totalPairs === 0) fails.push('L3 zero sojuszy w symulacji (test bez pokrycia)');
  // L4: planer z civ 1 zapełnionym dwoma sojuszami.
  const fullCounts = new Map([[1, 2], [4, 0], [7, 0], [10, 0], [13, 0]]);
  for (let turn = 8; turn <= 64; turn += 8) {
    const plan = tick.planAiAiAllianceTickFull({
      turn, owners: AI, koalicja: null, alliancesCount: fullCounts,
      pairPrefilter: () => true,
      pairInfo: () => ({ warStatus: 'pokoj', hasNap: false, hasAlliance: false, sharesBorder: true,
        relacja: 100, zaufanie: 100, willingness: 0.9 }),
      sideOf: () => ({ power: 1, treasuryGold: 0, allies: [], enemies: [] }),
      treasury: new Map(AI.map(o => [o, 1000])),
      evaluate: () => ({ accept: true, paymentGold: 0, payer: null, reason: 'ok' }),
    });
    if (plan.accepted.some(tr => tr.proposer === 1 || tr.target === 1)) { fails.push(`L4 planer zawarł sojusz z civ 1 (tura ${turn})`); break; }
  }
  return fails;
}

const tick = loadFile(TICK_FILE);
let failures = 0;
const real = loadFile(LIMIT_FILE);
const realFails = checkAll(real);
console.log(`PRAWDZIWY MODUŁ: ${realFails.length === 0 ? 'OK' : 'FAIL'}`);
for (const f of realFails) console.log('  - ' + f);
if (realFails.length) failures++;

// (W) Wiring w main.ts: test statyczny (czyta źródło main.ts; nie uruchamia boot()).
// Każda ścieżka zawierania sojuszu musi wołać wspólne sprawdzenie limitu.
const MAIN_FILE = path.resolve(GRA_ROOT, 'src', 'main.ts');
const MAIN_SRC = fs.readFileSync(MAIN_FILE, 'utf8');
const WIRING = [
  { nazwa: 'tor tick: licznik z pełnego stanu', wzorzec: 'const alliancesCount = liczbaSojuszyCywilizacji(aiAiAllianceLimitInput(owners));' },
  { nazwa: 'gałąź sióstr: bramka limitu', wzorzec: 'if (isAiAiAllianceTickEnabled() && !aiAiAllianceLimitPozwala(a, b)) continue;' },
  { nazwa: 'ścieżka wniosków (gracz↔AI): blokada', wzorzec: 'if (result.accepted && result.deal && aiAiAllianceLimitBlokujeDeal(result.deal)) {' },
  { nazwa: 'blokada wniosku: flaga + rodzaj + pozwala', wzorzec: 'return !aiAiAllianceLimitPozwala(a, b);' },
];
function wiringFails(src) {
  return WIRING.filter(w => !src.includes(w.wzorzec)).map(w => `W brak wiązania: ${w.nazwa}`);
}
const wFails = wiringFails(MAIN_SRC);
console.log(`WIRING main.ts: ${wFails.length === 0 ? 'OK' : 'FAIL'}`);
for (const f of wFails) console.log('  - ' + f);
if (wFails.length) failures++;

const mutants = {
  M1_off_by_one: LIMIT_SRC.replace('(licznik.get(oid) ?? 0) < input.maxSojuszy', '(licznik.get(oid) ?? 0) <= input.maxSojuszy'),
  M2_ai_side_not_counted: LIMIT_SRC.replace('licznik.set(x, (licznik.get(x) ?? 0) + 1);\n    if (input.aiCivs.has(y)', 'if (false) licznik.set(x, 0);\n    if (input.aiCivs.has(y)'),
  M3_player_not_counted: LIMIT_SRC.replace('input.liczoneStrony.has(y)) licznik.set(x', 'input.aiCivs.has(y)) licznik.set(x'),
  M4_only_side_a_checked: LIMIT_SRC.replace('return ok(a) && ok(b);', 'return ok(a);'),
};
for (const [name, src] of Object.entries(mutants)) {
  if (src === LIMIT_SRC) { console.log(`MUTANT ${name}: NIE ZASTOSOWANO (wzorzec nieznaleziony)`); failures++; continue; }
  const mod = loadSource(src);
  const f = checkAll(mod);
  if (f.length === 0) { console.log(`MUTANT ${name}: NIE WYKRYTY`); failures++; }
  else console.log(`MUTANT ${name}: wykryty (${f.length} porażek)`);
}
// Mutanty wiringu: usunięcie każdego wiązania z kopii main.ts (w pamięci) MUSI być wykryte.
for (const w of WIRING) {
  const mutSrc = MAIN_SRC.split(w.wzorzec).join('/* usunięto */');
  if (wiringFails(mutSrc).length === 0) { console.log(`MUTANT WIRING ${w.nazwa}: NIE WYKRYTY`); failures++; }
  else console.log(`MUTANT WIRING ${w.nazwa}: wykryty`);
}
console.log(failures === 0 ? 'SUMMARY: limit suite OK; mutants detected 4/4 + wiring 4/4' : `SUMMARY: FAILURES ${failures}`);
process.exit(failures === 0 ? 0 : 1);
