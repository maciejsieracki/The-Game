'use strict';
/**
 * ruch-swiata-tempo-test.cjs — test src/game/ruch-swiata-tempo.ts + wpiecie w main.ts.
 * Run: node tools/ruch-swiata-tempo-test.cjs
 *
 * main.ts jest zbyt duzy/DOM+THREE.js-zalezny by bundlowac go w calosci w tym tescie
 * (patrz precedens: tools/unit-replace-test.cjs sekcja 4, tools/chlopek-pole-warstwy-test.cjs
 * sekcja E) -- czesc (c)/(d)/(e) nizej to WIEC analiza tekstowa zrodla main.ts (readFileSync +
 * regex/indexOf), a nie wykonanie kodu gry. Czesc (a)/(b) bundluje i uruchamia REALNA logike
 * czystej funkcji applyRuchSwiataPace (esbuild), tak jak building-cost-tempo-test.cjs.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ruch-swiata-tempo-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const SRC = process.env.RST_SRC_DIR || path.join(GRA, 'src');

const ENTRY_FILE  = path.resolve(__dirname, '.ruch-swiata-tempo-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ruch-swiata-tempo-bundle.cjs');
const ENTRY_TS = `
export { RUCH_SWIATA_PACE, applyRuchSwiataPace } from ${JSON.stringify(path.join(SRC, 'game', 'ruch-swiata-tempo'))};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ruch-swiata-tempo-test] esbuild failed:\n', e.message || e);
  process.exit(1);
}

const { RUCH_SWIATA_PACE, applyRuchSwiataPace } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg, `(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
}
function assert(cond, msg, detail) {
  if (cond) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg, detail !== undefined ? `(${detail})` : ''); }
}

console.log('\n[ruch-swiata-tempo-test] Uruchamiam testy...\n');

// ─────────────────────────────────────────────────────────────────────────
// (a) applyRuchSwiataPace — mnozniki dla 3 poziomow (krotki x1 / normalny x3 / dlugi x6)
// ─────────────────────────────────────────────────────────────────────────
console.log('(a) applyRuchSwiataPace — mnozniki 3 poziomow');
eq(RUCH_SWIATA_PACE.krotki, 1, 'RUCH_SWIATA_PACE.krotki === 1');
eq(RUCH_SWIATA_PACE.normalny, 3, 'RUCH_SWIATA_PACE.normalny === 3');
eq(RUCH_SWIATA_PACE.dlugi, 6, 'RUCH_SWIATA_PACE.dlugi === 6');

eq(applyRuchSwiataPace(2, 'krotki'), 2, 'krotki x1: Ruch bazowy 2 -> 2 (Hastati, bez zmian)');
eq(applyRuchSwiataPace(2, 'normalny'), 6, 'normalny x3: Ruch bazowy 2 -> 6');
eq(applyRuchSwiataPace(2, 'dlugi'), 12, 'dlugi x6: Ruch bazowy 2 -> 12');
eq(applyRuchSwiataPace(1, 'dlugi'), 6, 'dlugi x6: Ruch bazowy 1 -> 6 (Osadnik/wolny typ)');
eq(applyRuchSwiataPace(3, 'normalny'), 9, 'normalny x3: Ruch bazowy 3 -> 9 (Konnica)');
eq(applyRuchSwiataPace(2, 2.5), 5, 'mnoznik liczbowy 2.5: 2 -> 5');

// ─────────────────────────────────────────────────────────────────────────
// (b) Jednostka gracza stworzona przy ruchSwiataPace='dlugi' ma u.ruch = def['Ruch'] x 6
//     (obliczeniowy dowod na realnych danych units.json — Hastati Ruch=2 z data/units.json).
// ─────────────────────────────────────────────────────────────────────────
console.log("\n(b) jednostka przy pace='dlugi' -> u.ruch = def['Ruch'] x 6 (dane realne z units.json)");
{
  const unitsData = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
  const hastati = unitsData.find((u) => u['Jednostka'] === 'Hastati');
  assert(hastati !== undefined, 'units.json zawiera Hastati (jednostka referencyjna testu)');
  const bazowyRuch = hastati ? hastati['Ruch'] : null;
  eq(bazowyRuch, 2, "Hastati['Ruch'] (bazowy, data/units.json) === 2 — jesli to sie zmieni, dostosuj test");

  const uRuchKrotki   = applyRuchSwiataPace(bazowyRuch, 'krotki');
  const uRuchNormalny = applyRuchSwiataPace(bazowyRuch, 'normalny');
  const uRuchDlugi    = applyRuchSwiataPace(bazowyRuch, 'dlugi');
  eq(uRuchKrotki, bazowyRuch * 1, "Hastati spawn krotki: u.ruch = def['Ruch'] x 1 (bez zmian, kompat wsteczna)");
  eq(uRuchNormalny, bazowyRuch * 3, "Hastati spawn normalny: u.ruch = def['Ruch'] x 3");
  eq(uRuchDlugi, bazowyRuch * 6, "Hastati spawn dlugi: u.ruch = def['Ruch'] x 6");
}

// ─────────────────────────────────────────────────────────────────────────
// (c)/(e) — analiza tekstowa main.ts: wpiecie mnoznika WYLACZNIE przy spawnie,
// reset tury nietkniety (u.ruchLeft = u.ruch dziedziczy juz-przemnozona wartosc),
// perTurnMoveForUnit preferuje u.ruch, HUD/merge czytaja u.ruch (nie surowy def['Ruch']),
// domyslne 'krotki' wszedzie (kreator, load, PlayerState factory).
// ─────────────────────────────────────────────────────────────────────────
console.log('\n(c)/(e) analiza zrodla main.ts — wpiecie mnoznika, reset tury, fallback "krotki"');

const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');

assert(
  mainSrc.includes("import { applyRuchSwiataPace } from './game/ruch-swiata-tempo';"),
  'main.ts importuje applyRuchSwiataPace z ./game/ruch-swiata-tempo',
);

// Wszystkie spawn-site'y musza przepuscic normFieldVal(...['Ruch']...) przez applyRuchSwiataPace.
const spawnSiteCount = (mainSrc.match(/applyRuchSwiataPace\(\s*(?:normFieldVal|gruchBazowy|ruchBazowy)/g) || []).length;
assert(
  spawnSiteCount >= 6,
  `main.ts: >=6 spawn-site'ow jednostek przepuszcza Ruch przez applyRuchSwiataPace (produkcja, AI-bonus, chatka, rekrutacja EOT, barbarzyncy obóz, barbarzyncy garnizon miasta)`,
  'znaleziono=' + spawnSiteCount,
);

// Reset tury MUSI zostac nietkniety: u.ruchLeft = u.ruch (dziedziczy mnoznik z u.ruch,
// bez ponownego odczytu def['Ruch']) -- zero regresji w tym miejscu.
assert(
  /for \(const u of units\) \{\s*\n\s*u\.ruchLeft = u\.ruch;/.test(mainSrc),
  'main.ts: reset tury "u.ruchLeft = u.ruch" nietkniety -- dziedziczy juz-przemnozona wartosc bez ponownego odczytu def[\'Ruch\']',
);

// perTurnMoveForUnit (planowanie trasy wieloturowej) preferuje u.ruch nad surowym def['Ruch'].
const perTurnFnMatch = mainSrc.match(/function perTurnMoveForUnit\(u: RuntimeUnit\): number \{[\s\S]{0,1500}?\n {4}\}/);
assert(perTurnFnMatch !== null, 'main.ts: znaleziona funkcja perTurnMoveForUnit');
if (perTurnFnMatch) {
  const body = perTurnFnMatch[0];
  assert(
    /normFieldVal\(u\.ruch,/.test(body),
    'perTurnMoveForUnit: u.ruch (juz przemnozone) jest PIERWSZYM argumentem normFieldVal — preferowane nad surowym def[\'Ruch\']',
    body,
  );
}

// mergeUnitRow (prompt scalania stosow) i buildArmyStackHudStateInner (HUD stosu/aktywnej
// jednostki) NIE moga czytac surowego normFieldVal(...['Ruch']...) do ruchMax/mov -- musza
// czytac juz-przemnozone pole jednostki (u.ruch / active.ruch).
assert(
  !/ruchMax: normFieldVal\(def\['Ruch'\]/.test(mainSrc),
  'mergeUnitRow: ruchMax NIE czyta juz surowego normFieldVal(def[\'Ruch\']...) (regresja by pokazala bazowa wartosc w prompcie scalania przy pace!=krotki)',
);
assert(
  !/const movMax = normFieldVal\(udef\['Ruch'\]/.test(mainSrc),
  'buildArmyStackHudStateInner (karty stosu): movMax NIE czyta juz surowego normFieldVal(udef[\'Ruch\']...)',
);
assert(
  !/mov: normFieldVal\(def\['Ruch'\], 2\),/.test(mainSrc),
  'buildArmyStackHudStateInner (HUD aktywnej jednostki): mov NIE czyta juz surowego normFieldVal(def[\'Ruch\'], 2)',
);
const movActiveCount = (mainSrc.match(/mov: active\.ruch,/g) || []).length;
eq(movActiveCount, 2, 'buildArmyStackHudStateInner: obie galezie (isAwaitingFirstPlayerCity + normalna) czytaja mov: active.ruch');

// Domyslne 'krotki' — kreator (start nowej gry) i load (stary zapis bez pola).
assert(
  mainSrc.includes("player.ruchSwiataPace = params.advanced?.ruchSwiataPace ?? 'krotki';"),
  'main.ts: start nowej gry -> player.ruchSwiataPace = params.advanced?.ruchSwiataPace ?? \'krotki\'',
);
assert(
  /player\.ruchSwiataPace = saved\.gracz\.ruchSwiataPace\s*\n\s*\?\? \(saved\.meta\?\.newGameParams as NewGameParams \| undefined\)\?\.advanced\?\.ruchSwiataPace\s*\n\s*\?\? 'krotki';/.test(mainSrc),
  'main.ts: load -> player.ruchSwiataPace = saved.gracz.ruchSwiataPace ?? newGameParams.advanced?.ruchSwiataPace ?? \'krotki\' (stary zapis bez pola = zero zmiany zachowania)',
);

// Save serializuje ruchSwiataPace (persystencja miedzy sesjami) — bez tego kazdy load
// spadalby na fallback newGameParams zamiast na realna wartosc z zapisu.
assert(
  /gracz: \{[\s\S]{0,500}?ruchSwiataPace: player\.ruchSwiataPace,/.test(mainSrc),
  'main.ts: serializacja zapisu gry (gracz: {...}) zawiera ruchSwiataPace: player.ruchSwiataPace',
);

// playerState.ts — PlayerState.ruchSwiataPace + domyslne 'krotki' w createPlayerState().
const playerStateSrc = fs.readFileSync(path.join(SRC, 'game', 'playerState.ts'), 'utf8');
assert(
  /ruchSwiataPace: RuchSwiataPace;/.test(playerStateSrc),
  'playerState.ts: PlayerState.ruchSwiataPace: RuchSwiataPace (pole obowiazkowe)',
);
assert(
  /ruchSwiataPace: 'krotki',/.test(playerStateSrc),
  "playerState.ts: createPlayerState() domyslnie ruchSwiataPace: 'krotki'",
);

// newGameFlow.ts — DEFAULT_ADVANCED.ruchSwiataPace = 'krotki' (kompat wsteczna kreatora).
const newGameFlowSrc = fs.readFileSync(path.join(SRC, 'ui', 'newGameFlow.ts'), 'utf8');
assert(
  /const DEFAULT_ADVANCED: NewGameAdvancedOptions = \{[\s\S]{0,400}?ruchSwiataPace: 'krotki',/.test(newGameFlowSrc),
  "newGameFlow.ts: DEFAULT_ADVANCED.ruchSwiataPace === 'krotki'",
);
assert(
  /opts: \['Krótki', 'Normalny', 'Długi'\]/.test(newGameFlowSrc),
  'newGameFlow.ts: przelacznik kreatora ma opcje [Krótki, Normalny, Długi]',
);

// ─────────────────────────────────────────────────────────────────────────
// (d) 'Ruch w bitwie' / bitwa NIETKNIETA — regresyjna asercja tekstowa. Sprawdzamy
// WSZYSTKIE pliki, ktore realnie czytaja pole "Ruch w bitwie (heksy)" (battleScene.ts,
// manualBattle.ts, combat.ts) ORAZ mapFieldBattle.ts (wskazany wprost w zleceniu) --
// zaden z nich nie moze wspominac ruchSwiataPace/applyRuchSwiataPace/RUCH_SWIATA_PACE.
// ─────────────────────────────────────────────────────────────────────────
console.log('\n(d) bitwa NIETKNIETA — mapFieldBattle.ts / battleScene.ts / manualBattle.ts / combat.ts');

const BATTLE_FILES = [
  ['battle/mapFieldBattle.ts', path.join(SRC, 'battle', 'mapFieldBattle.ts')],
  ['battle/battleScene.ts', path.join(SRC, 'battle', 'battleScene.ts')],
  ['battle/manualBattle.ts', path.join(SRC, 'battle', 'manualBattle.ts')],
  ['game/combat.ts', path.join(SRC, 'game', 'combat.ts')],
];
const RUCH_SWIATA_TOKENS = /ruchSwiataPace|applyRuchSwiataPace|RUCH_SWIATA_PACE|ruch-swiata-tempo/;
for (const [label, filePath] of BATTLE_FILES) {
  const src = fs.readFileSync(filePath, 'utf8');
  assert(
    !RUCH_SWIATA_TOKENS.test(src),
    `${label}: brak jakiegokolwiek odniesienia do mnoznika ruchu mapy swiata (ruchSwiataPace/applyRuchSwiataPace/RUCH_SWIATA_PACE)`,
  );
}
// Pole "Ruch w bitwie (heksy)" musi wciaz istniec i byc uzywane bez zmian (dowod, ze test
// mierzy wlasciwy system, a nie plik ktory juz nic nie robi).
assert(
  fs.readFileSync(path.join(SRC, 'battle', 'battleScene.ts'), 'utf8').includes("'Ruch w bitwie (heksy)'"),
  "battle/battleScene.ts: nadal czyta 'Ruch w bitwie (heksy)' — dowod, ze system bitwy zyje i jest odrebny od Ruch (mapa swiata)",
);

console.log(`\n[ruch-swiata-tempo-test] Wyniki: ${passed} zaliczone, ${failed} niezaliczone`);
if (failed > 0) {
  console.error('[ruch-swiata-tempo-test] FAIL');
  process.exit(1);
}
console.log('[ruch-swiata-tempo-test] ZIELONY');
process.exit(0);
