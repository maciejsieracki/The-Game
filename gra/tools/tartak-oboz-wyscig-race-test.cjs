'use strict';
/**
 * tartak-oboz-wyscig-race-test.cjs — bramka Operatora dla CZĘŚCI A tematu
 * R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1.
 *
 * Zgłoszenie właściciela: "system znowu stawia tartak i obóz łowiecki w miejscu, gdzie
 * w ogóle nie ma lasu". Hipoteza: komit AI `buildImprovement` NIE weryfikował ponownie
 * `nakladka === Nakladka.Las` tuż przed dopisaniem `tartak`/`oboz_lowiecki` do
 * `placedImprovements` — więc plan budowy powstały gdy hex miał las mógł się wykonać
 * PO tym, jak inny komit w tej samej turze (własna wycinka albo wycinka innego miasta)
 * zdążył usunąć las.
 *
 * METODA: wycina DOSŁOWNY tekst źródłowy strażnika + komitu z main.ts (dopasowanie
 * anchorów tekstowych, NIE transkrypcja), uruchamia go esbuildem przeciw REALNEMU
 * `Nakladka` z improvement-build.ts. Test jest zaprojektowany tak, by CZERWIENIEĆ na
 * main.ts SPRZED poprawki (brak strażnika) i ZIELENIEĆ PO poprawce — Operator
 * zweryfikował to przez `git stash` przed commitem (patrz raport rundy).
 *
 * Uruchamiaj z gra/:  node tools/tartak-oboz-wyscig-race-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.RACE_SRC_DIR || path.resolve(__dirname, '..', 'src');
const MAIN_TS = path.join(SRC, 'main.ts');
const ENTRY = path.resolve(__dirname, '.tartak-race-entry.ts');
const BUNDLE = path.resolve(__dirname, '.tartak-race-bundle.cjs');

let pass = 0, fail = 0;
const ok = (c, name, extra) => {
  if (c) { pass++; console.log('  [OK] ' + name); }
  else { fail++; console.log('  [FAIL] ' + name + (extra !== undefined ? ' :: ' + extra : '')); }
};

// ---------------------------------------------------------------- ekstrakcja
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

const START_ANCHOR = "const prevLayers = placedImprovements.get(hexKey) ?? [];";
const END_ANCHOR = "console.log(`[AI ${ownerId}] Ulepszenie: ${cmd.key} @ (${cmd.q},${cmd.r}) (-${koszt} Pracy)`);";

// Strażnik (jeśli istnieje) stoi BEZPOŚREDNIO PRZED START_ANCHOR — więc szukamy go
// wstecz od START_ANCHOR aż do poprzedniego `continue;` (koniec bloku 'wycinka' AI),
// żeby wyciąć DOKŁADNIE to, co main.ts robi między "mamy tartak/oboz do zbudowania"
// a "wpisz do placedImprovements", niezależnie od tego, czy strażnik już tam jest.
const iStart0 = mainSrc.indexOf(START_ANCHOR);
if (iStart0 < 0) throw new Error('NIE ZNALEZIONO kotwicy startowej w main.ts: ' + START_ANCHOR);
if (mainSrc.indexOf(START_ANCHOR, iStart0 + 1) >= 0) {
  throw new Error('NIEJEDNOZNACZNA kotwica startowa: ' + START_ANCHOR);
}
// cofnij się do końca poprzedniego bloku 'wycinka' (`continue;\n                  }\n\n`)
// -- to obejmuje ewentualny strażnik dodany PRZED prevLayers (może, ale nie musi, tam być).
const iWycinkaEndSearch = mainSrc.lastIndexOf("continue;\n                  }\n\n", iStart0);
const iBlockStart = iWycinkaEndSearch >= 0 ? iWycinkaEndSearch + "continue;\n                  }\n\n".length : iStart0;

const iEnd = mainSrc.indexOf(END_ANCHOR, iStart0);
if (iEnd < 0) throw new Error('NIE ZNALEZIONO kotwicy końcowej w main.ts: ' + END_ANCHOR);
const iEndFull = iEnd + END_ANCHOR.length;

const SRC_COMMIT_BLOCK = mainSrc.slice(iBlockStart, iEndFull);
const hasGuard = /hexForImprovement\.nakladka\s*!==\s*Nakladka\.Las/.test(SRC_COMMIT_BLOCK);
console.log('  [info] wycięty blok komitu AI zawiera strażnik lasu: ' + hasGuard
  + ' (linie main.ts ' + (mainSrc.slice(0, iBlockStart).split('\n').length) + '-'
  + (mainSrc.slice(0, iEndFull).split('\n').length) + ')');

// ------------------------------------------------------------------- entry
fs.writeFileSync(ENTRY, `
import { Nakladka } from ${JSON.stringify(SRC + '/types/hex')};

type PlacedLayers = string[];

/** DOSŁOWNY tekst main.ts (blok komitu AI 'tartak'/'oboz_lowiecki', ze strażnikiem
 *  jeśli main.ts go ma), opakowany w komplet zmiennych z domknięcia AI. */
function commitAiBuild(ctx: any): void {
  const { cmd, hexForImprovement, hexKey, ownerId, koszt, poolBefore,
          aiPracaPoolByOwner, placedImprovements } = ctx;
  const syncHexUlepszenieFields = (_k: string, _l: string[]) => {};
  const registerFortNodeIfNeeded = (..._a: any[]) => {};
  const spawnImprovementMesh = (_k: string) => {};
  const syncResourceOverlayAtHex = (_k: string) => {};
  for (let _once = 0; _once < 1; _once++) {
    ${SRC_COMMIT_BLOCK}
  }
}

export const api = {
  Nakladka, commitAiBuild,
};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, outfile: BUNDLE, platform: 'node',
  format: 'cjs', target: 'node18', logLevel: 'silent',
});
const { api: A } = require(BUNDLE);
const { Nakladka, commitAiBuild } = A;

// --------------------------------------------------------------- scenariusz
console.log('\n=== WYŚCIG: wycinka (ten sam AI, ten sam heks, ta sama tura) PRZED komitem budowy ===');

function scenario(key) {
  // Plan komitu AI powstał, gdy hex miał las (tak jak w main.ts, komendy sa kolejkowane
  // przed wykonaniem). W TEJ SAMEJ turze, PRZED wykonaniem komitu 'tartak'/'oboz_lowiecki',
  // inny komit (własna wycinka albo wycinka innego miasta) już zdjął las z heksa --
  // symulujemy skutek tamtego komitu wprost (nakladka = Brak), tak jak realnie robi go
  // main.ts (hexForImprovement.nakladka = Nakladka.Brak przed stripForestDependentImprovements).
  const hexForImprovement = { nakladka: Nakladka.Brak };
  const placedImprovements = new Map();
  const aiPracaPoolByOwner = new Map([[1, 100]]);
  commitAiBuild({
    cmd: { key, q: 0, r: 0 },
    hexForImprovement,
    hexKey: '0,0',
    ownerId: 1,
    koszt: 20,
    poolBefore: 100,
    aiPracaPoolByOwner,
    placedImprovements,
  });
  return {
    placed: placedImprovements.get('0,0') ?? null,
    poolAfter: aiPracaPoolByOwner.get(1),
  };
}

const rTartak = scenario('tartak');
console.log('     tartak: placed=' + JSON.stringify(rTartak.placed) + ' poolAfter=' + rTartak.poolAfter);
ok(rTartak.placed === null,
  'A1 TARTAK: komit AI NIE dochodzi do skutku, gdy las zniknął między planem a wykonaniem (wyścig)',
  JSON.stringify(rTartak.placed));
ok(rTartak.poolAfter === 100,
  'A2 TARTAK: Praca AI NIE jest pobierana za pominięty komit (brak kosztu bez efektu)',
  String(rTartak.poolAfter));

const rOboz = scenario('oboz_lowiecki');
console.log('     oboz_lowiecki: placed=' + JSON.stringify(rOboz.placed) + ' poolAfter=' + rOboz.poolAfter);
ok(rOboz.placed === null,
  'B1 OBÓZ ŁOWIECKI: komit AI NIE dochodzi do skutku, gdy las zniknął między planem a wykonaniem (wyścig)',
  JSON.stringify(rOboz.placed));
ok(rOboz.poolAfter === 100,
  'B2 OBÓZ ŁOWIECKI: Praca AI NIE jest pobierana za pominięty komit',
  String(rOboz.poolAfter));

// Kontrola: gdy las FAKTYCZNIE jest na heksie (brak wyścigu), komit MUSI się udać —
// dowód, że test nie jest tautologiczny/zbyt szeroki (nie blokuje budowy zawsze).
console.log('\n=== KONTROLA: las JEST na heksie -> komit budowy przechodzi normalnie ===');
function scenarioLasObecny(key) {
  const hexForImprovement = { nakladka: Nakladka.Las };
  const placedImprovements = new Map();
  const aiPracaPoolByOwner = new Map([[1, 100]]);
  commitAiBuild({
    cmd: { key, q: 0, r: 0 },
    hexForImprovement,
    hexKey: '0,0',
    ownerId: 1,
    koszt: 20,
    poolBefore: 100,
    aiPracaPoolByOwner,
    placedImprovements,
  });
  return placedImprovements.get('0,0') ?? null;
}
ok((scenarioLasObecny('tartak') ?? []).includes('tartak'),
  'C1 kontrola: TARTAK buduje się normalnie, gdy las faktycznie jest na heksie (test nie jest zbyt szeroki)');
ok((scenarioLasObecny('oboz_lowiecki') ?? []).includes('oboz_lowiecki'),
  'C2 kontrola: OBÓZ ŁOWIECKI buduje się normalnie, gdy las faktycznie jest na heksie');

// Kontrola: inne klucze (np. 'droga') NIE są tknięte przez nowy strażnik (zakres wąski —
// wyłącznie tartak/oboz_lowiecki, nie każda budowa AI).
console.log('\n=== KONTROLA ZAKRESU: strażnik NIE blokuje ulepszeń niezależnych od lasu ===');
ok((scenarioLasObecny('droga') ?? []).includes('droga'), 'D1 kontrola: droga buduje się z lasem (nietknięte)');
const rDrogaBezLasu = scenario('droga');
ok((rDrogaBezLasu.placed ?? []).includes('droga'),
  'D2 kontrola: droga buduje się TAKŻE bez lasu — strażnik dotyczy wyłącznie tartak/oboz_lowiecki, nie poszerza zakresu',
  JSON.stringify(rDrogaBezLasu.placed));

// ============================================================================
// CZĘŚĆ E (runda 2, ZARZUT #1 Evaluatora): analogiczny strażnik w PĘTLI
// AUTOMATU ULEPSZEŃ GRACZA (`for (const pick of picks)`, main.ts ~30483-30550)
// -- trzecie miejsce piszące tartak/oboz_lowiecki do `placedImprovements`, obok
// już zbadanych: pętli AI (części A/B/C/D wyżej) i applyBuildRequest/
// commitBuildRequest gracza (zweryfikowane w raporcie Operatora jako bez okna
// wyścigu -- komit synchroniczny z klikiem). Wycina DOSŁOWNY blok komitu
// nie-wycinkowego tej pętli (branch ELSE po `typ === 'wycinka'`) i dowodzi,
// że nowy strażnik (runda 2) chroni komit tartak/oboz_lowiecki także tutaj.
console.log('\n=== CZĘŚĆ E: pętla automatu ulepszeń GRACZA -- strażnik lasu przy komicie ===');

const PLAYER_START_ANCHOR = 'const prevLayers = workingPlaced.get(hexKey) ?? placedImprovements.get(hexKey) ?? [];';
const PLAYER_END_ANCHOR = 'toastLines.push(`${meta?.nazwa ?? pick.key} @ (${pick.q},${pick.r})`);';

const iPStart = mainSrc.indexOf(PLAYER_START_ANCHOR);
if (iPStart < 0) throw new Error('NIE ZNALEZIONO kotwicy startowej (pętla gracza) w main.ts: ' + PLAYER_START_ANCHOR);
if (mainSrc.indexOf(PLAYER_START_ANCHOR, iPStart + 1) >= 0) {
  throw new Error('NIEJEDNOZNACZNA kotwica startowa (pętla gracza): ' + PLAYER_START_ANCHOR);
}
const iPEnd = mainSrc.indexOf(PLAYER_END_ANCHOR, iPStart);
if (iPEnd < 0) throw new Error('NIE ZNALEZIONO kotwicy końcowej (pętla gracza) w main.ts: ' + PLAYER_END_ANCHOR);
const iPEndFull = iPEnd + PLAYER_END_ANCHOR.length;

const PLAYER_SRC_BLOCK = mainSrc.slice(iPStart, iPEndFull);
const hasPlayerGuard = /pick\.key === 'tartak'[\s\S]{0,80}hexForImprovement\.nakladka\s*!==\s*Nakladka\.Las/.test(PLAYER_SRC_BLOCK);
console.log('  [info] wycięty blok komitu GRACZA (pętla automatu) zawiera strażnik lasu: ' + hasPlayerGuard
  + ' (linie main.ts ' + (mainSrc.slice(0, iPStart).split('\n').length) + '-'
  + (mainSrc.slice(0, iPEndFull).split('\n').length) + ')');

const PLAYER_ENTRY = path.resolve(__dirname, '.tartak-race-player-entry.ts');
const PLAYER_BUNDLE = path.resolve(__dirname, '.tartak-race-player-bundle.cjs');

fs.writeFileSync(PLAYER_ENTRY, `
import { Nakladka } from ${JSON.stringify(SRC + '/types/hex')};

type PlacedLayers = string[];

/** DOSŁOWNY tekst main.ts (blok komitu pętli automatu ulepszeń GRACZA, branch
 *  ELSE po 'wycinka', ze strażnikiem jeśli main.ts go ma), opakowany w komplet
 *  zmiennych z domknięcia pętli \`for (const pick of picks)\`. */
function commitPlayerPick(ctx: any): void {
  const { pick, hexForImprovement, hexKey, prevLayers, placedImprovements, workingPlaced } = ctx;
  let playerPracaPool = ctx.playerPracaPool;
  let _lastPraca = 0, _lastPracaRate = 0, _lastPracaAutoUlepszeniaKoszt = 0;
  const toastLines: string[] = [];
  const syncHexUlepszenieFields = (_k: string, _l: string[]) => {};
  const registerFortNodeIfNeeded = (..._a: any[]) => {};
  const spawnImprovementMesh = (_k: string) => {};
  const syncResourceOverlayAtHex = (_k: string) => {};
  const getImprovementMeta = (key: string) => ({ nazwa: key });
  for (let _once = 0; _once < 1; _once++) {
    ${PLAYER_SRC_BLOCK}
  }
  ctx.playerPracaPoolAfter = playerPracaPool;
}

export const api = {
  Nakladka, commitPlayerPick,
};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [PLAYER_ENTRY], bundle: true, outfile: PLAYER_BUNDLE, platform: 'node',
  format: 'cjs', target: 'node18', logLevel: 'silent',
});
const { api: AP } = require(PLAYER_BUNDLE);
const { commitPlayerPick } = AP;

function playerScenario(key, nakladka) {
  const hexForImprovement = { nakladka };
  const placedImprovements = new Map();
  const workingPlaced = new Map();
  const ctx = {
    pick: { key, q: 0, r: 0, kosztPraca: 20 },
    hexForImprovement,
    hexKey: '0,0',
    prevLayers: [],
    placedImprovements,
    workingPlaced,
    playerPracaPool: 100,
  };
  commitPlayerPick(ctx);
  return { placed: placedImprovements.get('0,0') ?? null, poolAfter: ctx.playerPracaPoolAfter };
}

console.log('\n--- E: las ZNIKNĄŁ przed komitem pick-a (symulacja okna wyścigu w pętli gracza) ---');
const rPlayerTartakNoForest = playerScenario('tartak', Nakladka.Brak);
ok(rPlayerTartakNoForest.placed === null,
  'E1 TARTAK (pętla gracza): komit NIE dochodzi do skutku, gdy las zniknął przed pick-iem',
  JSON.stringify(rPlayerTartakNoForest.placed));
ok(rPlayerTartakNoForest.poolAfter === 100,
  'E1b TARTAK (pętla gracza): Praca gracza NIE jest pobierana za pominięty pick',
  String(rPlayerTartakNoForest.poolAfter));

const rPlayerObozNoForest = playerScenario('oboz_lowiecki', Nakladka.Brak);
ok(rPlayerObozNoForest.placed === null,
  'E2 OBÓZ ŁOWIECKI (pętla gracza): komit NIE dochodzi do skutku, gdy las zniknął przed pick-iem',
  JSON.stringify(rPlayerObozNoForest.placed));

console.log('\n--- KONTROLA (pętla gracza): las JEST -> komit przechodzi; inne klucze nietknięte ---');
const rPlayerTartakForest = playerScenario('tartak', Nakladka.Las);
ok((rPlayerTartakForest.placed ?? []).includes('tartak'),
  'E3 kontrola: TARTAK buduje się normalnie w pętli gracza, gdy las faktycznie jest na heksie');
const rPlayerDrogaNoForest = playerScenario('droga', Nakladka.Brak);
ok((rPlayerDrogaNoForest.placed ?? []).includes('droga'),
  'E4 kontrola zakresu: droga buduje się w pętli gracza TAKŻE bez lasu -- strażnik dotyczy wyłącznie tartak/oboz_lowiecki');

console.log('\ntartak-oboz-wyscig-race-test: ' + pass + ' passed, ' + fail + ' failed');
console.log(hasGuard
  ? '  [info] main.ts MA strażnik lasu w bloku AI -> oczekiwano PASS na A1/A2/B1/B2.'
  : '  [info] main.ts NIE MA strażnika lasu w bloku AI -> oczekiwano FAIL na A1/A2/B1/B2 (dowód wyścigu sprzed poprawki).');
console.log(hasPlayerGuard
  ? '  [info] main.ts MA strażnik lasu w bloku GRACZA -> oczekiwano PASS na E1/E2.'
  : '  [info] main.ts NIE MA strażnika lasu w bloku GRACZA -> oczekiwano FAIL na E1/E2 (luka runda 2 / ZARZUT #1).');
process.exit(fail ? 1 : 0);
