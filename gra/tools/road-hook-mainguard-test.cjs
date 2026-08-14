'use strict';
/**
 * road-hook-mainguard-test.cjs — WPIĘCIE sieci dróg w main.ts (R-DROGA-WZOR-6-RAMION, runda 2).
 *
 * PO CO TEN PLIK. Evaluator (2026-08-14) wykazał dwie dziury w pokryciu, obie w main.ts:
 *  (M11-M13) usunięcie wywołania `syncRoadNetworkAt(...)` z `spawnImprovementMesh` nie było
 *            łapane przez ŻADNĄ bramkę repo — nawet przez `tsc`;
 *  (BLOKUJĄCE) `roadRenderedHexes` był czyszczony TYLKO przy wczytaniu zapisu. Cztery pozostałe
 *            ścieżki restartu (`doStartGame` + 3 playtesty z huba) kasowały `improvementMeshes`,
 *            ale NIE pamięć sieci dróg — a żadna z nich nie przeładowuje strony. Stary wpis
 *            przeżywał restart, więc wczesny `return` w `syncRoadNetworkAt` („stan drogi tego
 *            heksa się nie zmienił") blokował odświeżenie SĄSIADA i drogi przestawały się stykać.
 *
 * DWIE WARSTWY:
 *  §1 STRAŻNIK TEKSTOWY — wpięcie hooka i struktura resetu (wzorzec kanoniczny w repo:
 *     `army-merge-separate-return-mainguard-test.cjs`, `border-march-wygasanie-test.cjs`).
 *  §2 TEST BEHAWIORALNY — wycina PRAWDZIWY tekst `syncRoadNetworkAt` i
 *     `resetImprovementRenderState` z bieżącego main.ts (nie reimplementację-kopię), wykonuje go
 *     NAPRAWDĘ przez `new Function` na prawdziwym `map/road-network.ts` i odgrywa scenariusz
 *     restartu rozgrywki bez przeładowania strony (wzorzec `fort-nodes-save-load-test.cjs`).
 *  §3 SAMOSPRAWDZENIE — te same asercje puszczone na ZMUTOWANYCH W PAMIĘCI kopiach main.ts
 *     (bez dotykania dysku) muszą zaświecić na czerwono.
 *
 * Bramka (z katalogu gra/): node tools/road-hook-mainguard-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const realSrc = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; } else { fail++; console.error('FAIL:', label); } }

// --- moduł logiki sieci dróg (prawdziwy, nie atrapa) -----------------------
const ENTRY = path.resolve(__dirname, '.road-hook-entry.ts');
const BUNDLE = path.resolve(__dirname, '.road-hook-bundle.cjs');
fs.writeFileSync(ENTRY, `
export * from '../src/map/road-network';
export { isRoadImprovementKey } from '../src/map/road-movement';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
  absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const RN = require(BUNDLE);
const { computeRoadMask, roadHexesToRefresh, roadMaskIsLonePatch, roadDirBit, ROAD_DIRS,
  isRoadImprovementKey } = RN;

// ---------------------------------------------------------------------------
// Wycinanie funkcji po SYGNATURZE (nie po numerze linii — te się przesuwają przy
// każdym commicie, patrz nota N-2 o nieaktualnych numerach w komentarzach main.ts).
// / EN: extract a function body by signature, never by line number.
// ---------------------------------------------------------------------------
function wytnijFunkcje(src, sygnatura) {
  const start = src.indexOf(sygnatura);
  if (start < 0) return null;
  let i = src.indexOf('{', start);
  if (i < 0) return null;
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

const SYG_SYNC = 'function syncRoadNetworkAt(';
const SYG_RESET = 'function resetImprovementRenderState(';
const SYG_SPAWN = 'function spawnImprovementMesh(';
const SCIEZKI_RESETU = [
  'function restorePlacedImprovementsFromSave(',
  'async function doStartGame(',
  'async function doStartPlaytestWalkaMapy(',
  'async function doStartPlaytestMiastoEkonomia(',
  'async function doStartPlaytestMapaSwiata(',
];

// ===========================================================================
// §1. STRAŻNIK TEKSTOWY
// ===========================================================================
/** Zwraca listę komunikatów o naruszeniach (pusta = struktura w porządku). */
function naruszeniaStruktury(src) {
  const b = [];
  const spawn = wytnijFunkcje(src, SYG_SPAWN);
  if (!spawn) { b.push('brak spawnImprovementMesh w main.ts'); return b; }

  // (a) hook MUSI być wołany wewnątrz spawnImprovementMesh...
  const wywolanie = /syncRoadNetworkAt\s*\(\s*hexKey\s*,\s*q\s*,\s*r\s*,\s*layers\s*\)/.exec(spawn);
  if (!wywolanie) b.push('spawnImprovementMesh NIE woła syncRoadNetworkAt(hexKey, q, r, layers)');

  // (b) ...i to PRZED wczesnym `return` dla pustego heksa — inaczej ZBURZENIE drogi (layers=[])
  //     nigdy nie odświeżyłoby sąsiadów, bo funkcja wyszłaby przed hookiem.
  const pustyHeks = spawn.indexOf('if (layers.length === 0)');
  if (pustyHeks < 0) b.push('nie znaleziono wczesnego return dla pustego heksa w spawnImprovementMesh');
  else if (wywolanie && wywolanie.index > pustyHeks) {
    b.push('syncRoadNetworkAt wołany PO wczesnym return dla pustego heksa (zburzenie drogi nie odświeży sąsiadów)');
  }

  // (c) cały reset stanu renderu ulepszeń żyje w JEDNEJ funkcji: skoro `improvementMeshes.clear()`
  //     występuje wyłącznie tam, gdzie `roadRenderedHexes.clear()`, to żadna ścieżka nie może
  //     wyczyścić meshy zapominając o pamięci sieci dróg. To jest dokładnie ten błąd z rundy 1.
  const reset = wytnijFunkcje(src, SYG_RESET);
  if (!reset) b.push('brak resetImprovementRenderState w main.ts');
  const ileMeshClear = (src.match(/improvementMeshes\.clear\(\)/g) || []).length;
  const ileRoadClear = (src.match(/roadRenderedHexes\.clear\(\)/g) || []).length;
  if (ileMeshClear !== 1) b.push(`improvementMeshes.clear() występuje ${ileMeshClear}× (ma być 1×, w resetImprovementRenderState)`);
  if (ileRoadClear !== 1) b.push(`roadRenderedHexes.clear() występuje ${ileRoadClear}× (ma być 1×, w resetImprovementRenderState)`);
  if (reset) {
    if (!/improvementMeshes\.clear\(\)/.test(reset)) b.push('resetImprovementRenderState nie czyści improvementMeshes');
    if (!/roadRenderedHexes\.clear\(\)/.test(reset)) b.push('resetImprovementRenderState nie czyści roadRenderedHexes');
  }

  // (d) KAŻDA z 5 ścieżek (4 restarty gry + wczytanie zapisu) musi wołać reset. Żadna nie
  //     przeładowuje strony, więc pominięta ścieżka = zombie stan z poprzedniej rozgrywki.
  for (const syg of SCIEZKI_RESETU) {
    const cialo = wytnijFunkcje(src, syg);
    if (!cialo) b.push(`nie znaleziono ${syg} w main.ts`);
    else if (!/resetImprovementRenderState\s*\(\s*\)/.test(cialo)) {
      b.push(`${syg.replace(/^(async )?function /, '')} NIE woła resetImprovementRenderState()`);
    }
  }
  return b;
}

const naruszenia = naruszeniaStruktury(realSrc);
ok(naruszenia.length === 0, 'struktura wpięcia sieci dróg w main.ts' + (naruszenia.length ? ' → ' + naruszenia.join(' | ') : ''));
for (const syg of SCIEZKI_RESETU) {
  const cialo = wytnijFunkcje(realSrc, syg);
  ok(!!cialo && /resetImprovementRenderState\s*\(\s*\)/.test(cialo),
    `${syg.replace(/^(async )?function /, '').replace('(', '')} woła resetImprovementRenderState()`);
}

// ===========================================================================
// §2. TEST BEHAWIORALNY — prawdziwy kod main.ts wykonany w izolacji
// ===========================================================================
/**
 * Buduje działające `syncRoadNetworkAt` + `resetImprovementRenderState` z PODANEGO tekstu
 * źródła (prawdziwego albo zmutowanego w pamięci). Wolne zmienne domknięcia main.ts
 * podstawiamy atrapami; logika sieci dróg jest prawdziwa (RN z bundla wyżej).
 */
function zbudujHarness(src) {
  const syncTxt = wytnijFunkcje(src, SYG_SYNC);
  const resetTxt = wytnijFunkcje(src, SYG_RESET);
  if (!syncTxt || !resetTxt) return null;
  const js = esbuild.transformSync(syncTxt + '\n' + resetTxt, { loader: 'ts', target: 'node18' }).code;

  const stan = {
    roads: new Set(),                 // hexKey → jest droga na mapie (odpowiednik hex.ulepszenia)
    renderedMask: new Map(),          // hexKey → maska, którą GRACZ WIDZI na ekranie
    spawnCalls: [],
  };
  const roadRenderedHexes = new Set();
  const improvementMeshes = new Map();
  const keyOf = (q, r) => q + ',' + r;
  const hexHasRoadAt = (q, r) => stan.roads.has(keyOf(q, r));

  const deps = {
    isRoadImprovementKey, roadHexesToRefresh, hexHasRoadAt, keyOf,
    roadRenderedHexes, improvementMeshes,
    bulkImprovementRebuild: false,
    scene: { remove() {} },
    disposeMergedDecor() {},
    spawnImprovementMesh: null,       // podpięte niżej (rekurencja przez hook)
  };
  const fabryka = new Function('deps', `
    const { isRoadImprovementKey, roadRenderedHexes, roadHexesToRefresh, hexHasRoadAt, keyOf,
            improvementMeshes, scene, disposeMergedDecor } = deps;
    const bulkImprovementRebuild = deps.bulkImprovementRebuild;
    const spawnImprovementMesh = (k) => deps.spawnImprovementMesh(k);
    ${js}
    return { syncRoadNetworkAt, resetImprovementRenderState };
  `);
  const F = fabryka(deps);

  /** Atrapa spawnImprovementMesh: ta sama KOLEJNOŚĆ co w main.ts — najpierw hook, potem render. */
  function spawnImprovementMesh(hexKey) {
    const [q, r] = hexKey.split(',').map(Number);
    const layers = stan.roads.has(hexKey) ? ['droga'] : [];
    stan.spawnCalls.push(hexKey);
    F.syncRoadNetworkAt(hexKey, q, r, layers);
    if (layers.length === 0) { stan.renderedMask.delete(hexKey); improvementMeshes.delete(hexKey); return; }
    stan.renderedMask.set(hexKey, computeRoadMask(q, r, hexHasRoadAt));
    improvementMeshes.set(hexKey, { mesh: true });
  }
  deps.spawnImprovementMesh = spawnImprovementMesh;

  return {
    stan, roadRenderedHexes, improvementMeshes,
    postawDroge(q, r) { stan.roads.add(keyOf(q, r)); spawnImprovementMesh(keyOf(q, r)); },
    zburzDroge(q, r) { stan.roads.delete(keyOf(q, r)); spawnImprovementMesh(keyOf(q, r)); },
    /** Restart rozgrywki BEZ przeładowania strony — dokładnie to, co robią doStart*. */
    restartGry() { F.resetImprovementRenderState(); stan.roads.clear(); stan.renderedMask.clear(); },
    maska(q, r) { return stan.renderedMask.get(keyOf(q, r)); },
  };
}

/**
 * SCENARIUSZ BŁĘDU Z RUNDY 1 (odgrywany na prawdziwym kodzie main.ts):
 *  (a) rozgrywka nr 1: droga na X(0,0) → X trafia do roadRenderedHexes;
 *  (b) restart z huba (żadne przeładowanie strony) — meshe i mapa czyszczone;
 *  (c) rozgrywka nr 2 na tym samym presecie: droga na Y(1,0), potem droga na X;
 *  (d) Y MUSI pokazywać ramię w stronę X, nie samotny placyk.
 * PRZED naprawą krok (c) wychodził wczesnym `return` (stary wpis X przeżył restart), więc Y
 * nigdy nie był przerysowany i zostawał z maską 0 = placyk mimo drogi tuż obok.
 * Zwraca listę rozbieżności (pusta = zachowanie poprawne).
 */
function scenariuszRestartu(src) {
  const h = zbudujHarness(src);
  if (!h) return ['nie udało się wyciąć syncRoadNetworkAt/resetImprovementRenderState z main.ts'];
  const b = [];
  const BIT_DO_Y = roadDirBit(0);   // z X(0,0) w stronę Y(1,0) = ROAD_DIRS[0]
  const BIT_DO_X = roadDirBit(3);   // z Y(1,0) w stronę X(0,0) = ROAD_DIRS[3]

  h.postawDroge(0, 0);                                     // (a) rozgrywka 1
  if (h.maska(0, 0) !== 0) b.push('rozgrywka 1: samotna droga powinna mieć maskę 0 (placyk)');
  if (!h.roadRenderedHexes.has('0,0')) b.push('rozgrywka 1: hook nie zapamiętał drogi na X');

  h.restartGry();                                          // (b)
  if (h.roadRenderedHexes.size !== 0) {
    b.push(`restart nie wyczyścił pamięci sieci dróg (zostało ${h.roadRenderedHexes.size} wpisów) `
      + '→ sąsiad heksa z POPRZEDNIEJ rozgrywki nie zostanie odświeżony');
  }

  h.postawDroge(1, 0);                                     // (c) rozgrywka 2: najpierw sąsiad Y
  if (h.maska(1, 0) !== 0) b.push('rozgrywka 2: pierwsza droga (Y) powinna być placykiem — X jeszcze bez drogi');
  h.postawDroge(0, 0);                                     //     ...potem X, tuż obok Y

  if (h.maska(0, 0) !== BIT_DO_Y) b.push(`(d) X pokazuje maskę ${h.maska(0, 0)}, oczekiwano ramienia do Y (${BIT_DO_Y})`);
  if (h.maska(1, 0) !== BIT_DO_X) {
    b.push(`(d) Y pokazuje maskę ${h.maska(1, 0)}, oczekiwano ramienia do X (${BIT_DO_X})`
      + ' — sąsiad nie został przerysowany, drogi się nie stykają');
  }
  if (roadMaskIsLonePatch(h.maska(1, 0) ?? 0)) b.push('(d) Y nadal rysuje SAMOTNY PLACYK zamiast ramienia w stronę X');

  // Niezmiennik ogólny: to, co widać na ekranie, zgadza się ze stanem mapy dla KAŻDEGO heksa.
  for (const key of h.stan.roads) {
    const [q, r] = key.split(',').map(Number);
    const oczek = computeRoadMask(q, r, (a, c) => h.stan.roads.has(a + ',' + c));
    if (h.stan.renderedMask.get(key) !== oczek) {
      b.push(`niezmiennik: heks ${key} narysowany maską ${h.stan.renderedMask.get(key)}, stan mapy mówi ${oczek}`);
    }
  }
  return b;
}

const rozbieznosci = scenariuszRestartu(realSrc);
ok(rozbieznosci.length === 0,
  'scenariusz restartu gry bez przeładowania strony: drogi z NOWEJ rozgrywki stykają się poprawnie'
  + (rozbieznosci.length ? ' → ' + rozbieznosci.join(' | ') : ''));

// Zburzenie drogi też musi odświeżyć sąsiada (hook stoi PRZED wczesnym return dla pustego heksa).
{
  const h = zbudujHarness(realSrc);
  h.postawDroge(0, 0);
  h.postawDroge(1, 0);
  ok(h.maska(0, 0) === roadDirBit(0) && h.maska(1, 0) === roadDirBit(3),
    'dwa sąsiadujące odcinki → oba pokazują ramię ku sobie');
  h.zburzDroge(1, 0);
  ok(h.maska(0, 0) === 0, 'po zburzeniu sąsiada zostały odcinek wraca do placyka (maska 0)');
  ok(h.maska(1, 0) === undefined, 'zburzony heks nie ma już renderu drogi');
  ok(h.roadRenderedHexes.has('1,0') === false, 'zburzenie usuwa heks z pamięci sieci dróg');
}
// Trzy styki naraz — każdy sąsiad musi dostać swój bit (nie tylko pierwszy napotkany).
{
  const h = zbudujHarness(realSrc);
  for (const [q, r] of [[1, 0], [0, -1], [-1, 1]]) h.postawDroge(q, r);
  h.postawDroge(0, 0);
  const oczekSrodek = roadDirBit(0) | roadDirBit(2) | roadDirBit(4);
  ok(h.maska(0, 0) === oczekSrodek, `skrzyżowanie: heks środkowy ma 3 ramiona (got ${h.maska(0, 0)})`);
  ok(h.maska(1, 0) === roadDirBit(3) && h.maska(0, -1) === roadDirBit(5) && h.maska(-1, 1) === roadDirBit(1),
    'skrzyżowanie: WSZYSCY trzej sąsiedzi przerysowani z ramieniem do środka');
}

// ===========================================================================
// §3. SAMOSPRAWDZENIE — mutacje w PAMIĘCI (dysk nietknięty)
// ===========================================================================
function zmutuj(src, z, na, etykieta) {
  if (!src.includes(z)) { fail++; console.error('FAIL: mutacja nieprzygotowana —', etykieta, '(nie znaleziono wzorca)'); return null; }
  return src.replace(z, na);
}

// MUT-1: przywrócenie BŁĘDU Z RUNDY 1 — reset nie czyści pamięci sieci dróg.
{
  const mut = zmutuj(realSrc, '      improvementMeshes.clear();\n      roadRenderedHexes.clear();',
    '      improvementMeshes.clear();', 'MUT-1');
  ok(mut !== null && scenariuszRestartu(mut).length > 0,
    '(mutacja MUT-1) reset bez roadRenderedHexes.clear() — scenariusz restartu ZŁAPANY behawioralnie');
  ok(mut !== null && naruszeniaStruktury(mut).length > 0,
    '(mutacja MUT-1) reset bez roadRenderedHexes.clear() — ZŁAPANY też strażnikiem tekstowym');
}
// MUT-2: usunięcie wywołania hooka ze spawnImprovementMesh (M11-M13 Evaluatora).
{
  const mut = zmutuj(realSrc, '      syncRoadNetworkAt(hexKey, q, r, layers);', '', 'MUT-2');
  ok(mut !== null && naruszeniaStruktury(mut).length > 0,
    '(mutacja MUT-2) usunięte wywołanie syncRoadNetworkAt w spawnImprovementMesh — ZŁAPANE');
}
// MUT-3: jedna ze ścieżek restartu przestaje wołać reset (dokładnie stan sprzed tej rundy:
//        4 z 5 ścieżek pomijały czyszczenie). Mutujemy OSTATNIE wystąpienie, czyli
//        doStartPlaytestMapaSwiata — pierwsze należy do wczytania zapisu.
{
  const i = realSrc.lastIndexOf('      resetImprovementRenderState();');
  const mut = i < 0 ? null : realSrc.slice(0, i) + realSrc.slice(i + '      resetImprovementRenderState();'.length);
  ok(mut !== null && naruszeniaStruktury(mut).some(m => m.includes('doStartPlaytestMapaSwiata')),
    '(mutacja MUT-3) ścieżka restartu bez resetu — ZŁAPANA i WSKAZANA po nazwie');
}
// MUT-4: hook przeniesiony ZA wczesny return dla pustego heksa (zburzenie drogi przestaje
//        odświeżać sąsiadów — subtelne, bo budowanie nadal działa).
{
  const bezHooka = realSrc.replace('      syncRoadNetworkAt(hexKey, q, r, layers);\n', '');
  const mut = zmutuj(bezHooka, '      syncImprovementDecorForHex(hexKey, layers);',
    '      syncRoadNetworkAt(hexKey, q, r, layers);\n      syncImprovementDecorForHex(hexKey, layers);', 'MUT-4');
  ok(mut !== null && naruszeniaStruktury(mut).some(m => m.includes('PO wczesnym return')),
    '(mutacja MUT-4) hook przesunięty za wczesny return — ZŁAPANY');
}
// Kontrola pozytywna: nietknięte źródło MUSI przechodzić obie warstwy — inaczej mutacje wyżej
// nie dowodzą niczego (świeciłyby na czerwono zawsze).
ok(naruszeniaStruktury(realSrc).length === 0 && scenariuszRestartu(realSrc).length === 0,
  '(kontrola) nietknięty main.ts przechodzi strażnik i scenariusz — mutacje nie są fałszywie dodatnie');

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log('road-hook-mainguard-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
