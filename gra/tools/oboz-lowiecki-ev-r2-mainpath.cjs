'use strict';
/**
 * oboz-lowiecki-ev-r2-mainpath.cjs — sonda Evaluatora RUNDY 2 dla
 * R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1.
 *
 * METODA INNA NIŻ OPERATORA (reguła b dispatchu rundy 2).
 * Operator PRZEPISAŁ ręcznie sekwencję wyrębu z main.ts do swojej bramki
 * (`oboz-lowiecki-las-test.cjs`, funkcje `wyrabGracza`/`wyrabAI`). Transkrypcja
 * dowodzi zachowania KOPII, nie oryginału — jeśli main.ts kiedykolwiek rozjedzie
 * się z transkrypcją, bramka Operatora tego nie zobaczy.
 *
 * Ta sonda NIE przepisuje niczego. Wycina DOSŁOWNY tekst źródłowy z `src/main.ts`
 * (dopasowanie nawiasów od nagłówka funkcji), kompiluje go esbuildem i URUCHAMIA:
 *   • `improvementKeyToUlepszenie`      (main.ts:11307)
 *   • `syncHexUlepszenieFields`         (main.ts:11321)
 *   • `stripForestDependentImprovements`(main.ts:11893)
 *   • `finalizeHexClearing`             (main.ts:11907)  <- ŚCIEŻKA GRACZA
 *   • blok `if (meta?.typ === 'wycinka') { ... }` (main.ts:28879) <- ŚCIEŻKA AI
 * Zależności silnikowe (mesh/decor/overlay) są zaślepione; wszystko, co dotyka
 * warstw heksa, jest oryginalne.
 *
 * Heksy pochodzą z `generateMap` (ziarna WŁASNE Evaluatora, inne niż 42/1337/2026/7
 * Operatora). Odczyt = `placedImprovements` ORAZ pola `hex.ulepszenia`/`hex.ulepszenie`.
 *
 * Uruchamiaj z gra/:  node tools/oboz-lowiecki-ev-r2-mainpath.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.OBOZ_SRC_DIR || path.resolve(__dirname, '..', 'src');
const MAIN_TS = path.join(SRC, 'main.ts');
const ENTRY = path.resolve(__dirname, '.oboz-ev-r2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.oboz-ev-r2-bundle.cjs');

let pass = 0, fail = 0;
const ok = (c, name, extra) => {
  if (c) { pass++; console.log('  [OK] ' + name); }
  else { fail++; console.log('  [FAIL] ' + name + (extra !== undefined ? ' :: ' + extra : '')); }
};

// ---------------------------------------------------------------- ekstrakcja
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

/** Wytnij DOSŁOWNY tekst bloku zaczynającego się od `anchor`, po dopasowaniu klamer. */
function cut(anchor) {
  const i = mainSrc.indexOf(anchor);
  if (i < 0) throw new Error('NIE ZNALEZIONO w main.ts: ' + anchor);
  if (mainSrc.indexOf(anchor, i + 1) >= 0) throw new Error('NIEJEDNOZNACZNA kotwica: ' + anchor);
  let j = mainSrc.indexOf('{', i);
  let depth = 0;
  for (let k = j; k < mainSrc.length; k++) {
    const ch = mainSrc[k];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return mainSrc.slice(i, k + 1); }
  }
  throw new Error('brak domknięcia dla: ' + anchor);
}

const SRC_KEY2UL   = cut('function improvementKeyToUlepszenie(');
const SRC_SYNC     = cut('function syncHexUlepszenieFields(');
const SRC_STRIP    = cut('function stripForestDependentImprovements(');
const SRC_FINALIZE = cut('function finalizeHexClearing(');
const SRC_AI       = cut("if (meta?.typ === 'wycinka') {");

// linia w main.ts (dla raportu)
const lineOf = (txt) => mainSrc.slice(0, mainSrc.indexOf(txt)).split('\n').length;

// ------------------------------------------------------------------- entry
fs.writeFileSync(ENTRY, `
import { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
import { stripImprovementsWhenForestRemoved, computeImprovementBuildImpact,
         buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
import { TerenBazowy, Nakladka, Ulepszenie } from ${JSON.stringify(SRC + '/types/hex')};

type ImprovementKey = string;
type PlacedLayers = string[];

// ==== stan wstrzykiwany (odpowiedniki domknięcia main.ts) ====
let map: any = null;
let placedImprovements: Map<string, string[]> = new Map();
// zaślepki silnika 3D/UI — NIE dotykają warstw heksa
const hideDecorAtHex = (_k: string) => {};
const removeClearingMesh = (_k: string) => {};
const syncResourceOverlayAtHex = (_k: string) => {};
const spawnImprovementMesh = (_k: string) => {};

// ==== DOSŁOWNY tekst z main.ts (nie transkrypcja) ====
${SRC_KEY2UL}
${SRC_SYNC}
${SRC_STRIP}
${SRC_FINALIZE}

/** ŚCIEŻKA AI — dosłowny blok main.ts, opakowany w pętlę 1x (blok używa \`continue\`). */
function wyrabAI_realny(ctx: any): void {
  const { meta, hexForImprovement, hexKey, ownerId, cmd, koszt, poolBefore,
          aiPracaPoolByOwner, cities, cityBuilt, data, _menuDifficulty } = ctx;
  const loadThroughput = (..._a: any[]) => 0.10;
  const applyStolarniaDrewnoMapInflow = (p: number, ..._a: any[]) => p;
  const ownerResourceCap = (..._a: any[]) => 9999;
  const creditOwnerResourceStock = (..._a: any[]) => 0;
  const empireEpochForOwner = (..._a: any[]) => 1;
  for (let _once = 0; _once < 1; _once++) {
    ${SRC_AI}
  }
}

export const api = {
  generateMap, stripImprovementsWhenForestRemoved, computeImprovementBuildImpact,
  buildImprovementQualifier, TerenBazowy, Nakladka, Ulepszenie,
  finalizeHexClearing, wyrabAI_realny,
  setState(m: any, p: Map<string, string[]>) { map = m; placedImprovements = p; },
  getPlaced() { return placedImprovements; },
};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, outfile: BUNDLE, platform: 'node',
  format: 'cjs', target: 'node18', logLevel: 'silent',
});
const { api: A } = require(BUNDLE);
const { Nakladka, TerenBazowy, Ulepszenie } = A;

// --------------------------------------------------------------- pomocnicze
function genMap(seed) {
  return A.generateMap(36, 28, seed, 'kontynenty');
}
function findHex(map, pred) {
  for (const k of Object.keys(map.hexes)) {
    const h = map.hexes[k];
    if (h && pred(h)) return k;
  }
  return null;
}
function layersOf(map, placed, key) {
  return {
    placed: placed.get(key) ?? null,
    ulepszenia: map.hexes[key].ulepszenia ?? null,
    improvementKey: map.hexes[key].improvementKey ?? null,
    ulepszenie: map.hexes[key].ulepszenie ?? null,
    nakladka: map.hexes[key].nakladka,
  };
}
/** Postaw warstwy tak, jak robi to commit gry (placed + pola heksa). */
function place(map, placed, key, layers) {
  placed.set(key, [...layers]);
  const hex = map.hexes[key];
  hex.ulepszenia = [...layers];
  hex.improvementKey = layers[layers.length - 1];
}

console.log('=== SONDA EVALUATORA RUNDA 2 — REALNY TEKST main.ts (nie transkrypcja) ===');
console.log('  main.ts: improvementKeyToUlepszenie:' + lineOf(SRC_KEY2UL)
  + ' · syncHexUlepszenieFields:' + lineOf(SRC_SYNC)
  + ' · stripForestDependentImprovements:' + lineOf(SRC_STRIP)
  + ' · finalizeHexClearing:' + lineOf(SRC_FINALIZE)
  + ' · blok wycinki AI:' + lineOf(SRC_AI));

// === X. ISTOTNOŚĆ EKSTRAKCJI — sonda mierzy to, co trzeba ===================
console.log('\n=== X. ISTOTNOŚĆ: wycięty tekst faktycznie zawiera hook ===');
ok(/stripForestDependentImprovements\(hexKey\)/.test(SRC_FINALIZE),
  'X1 finalizeHexClearing (gracz) faktycznie woła stripForestDependentImprovements');
ok(/stripForestDependentImprovements\(hexKey\)/.test(SRC_AI),
  'X2 blok wycinki AI faktycznie woła stripForestDependentImprovements');
ok(/stripImprovementsWhenForestRemoved\(prev\)/.test(SRC_STRIP),
  'X3 stripForestDependentImprovements woła stripImprovementsWhenForestRemoved z improvement-build');
ok(!/wyrabGracza|wyrabAI\b/.test(SRC_FINALIZE + SRC_AI),
  'X4 kontrola: uruchamiany jest tekst main.ts, nie funkcje bramki Operatora');

// === A. GRACZ — pełna ścieżka finalizeHexClearing ==========================
console.log('\n=== A. GRACZ: finalizeHexClearing na heksie z generateMap (ziarno 90210) ===');
{
  const map = genMap(90210);
  const placed = new Map();
  A.setState(map, placed);
  const key = findHex(map, h => h.nakladka === Nakladka.Las && h.terenBazowy === TerenBazowy.Wzgorza)
           || findHex(map, h => h.nakladka === Nakladka.Las);
  ok(!!key, 'A0 istotność: mapa 90210 ma heks z lasem (z generateMap)');
  const hex = map.hexes[key];
  const teren = hex.terenBazowy;
  // legalność przed wyrębem — realnym gate'em commitu, nie deklaracją
  const impact = A.computeImprovementBuildImpact('oboz_lowiecki', hex, []);
  ok(impact !== null, 'A1 istotność: obóz JEST legalny na tym heksie PRZED wyrębem (gate commitu)', String(impact));
  place(map, placed, key, ['oboz_lowiecki']);
  ok((placed.get(key) || []).includes('oboz_lowiecki'), 'A2 istotność: obóz faktycznie stoi przed wyrębem');

  A.finalizeHexClearing(key);                       // <- REALNY tekst main.ts
  const after = layersOf(map, placed, key);
  ok(after.nakladka === Nakladka.Brak, 'A3 finalizeHexClearing zdjął las (nakladka=Brak)', after.nakladka);
  ok(after.placed === null, 'A4 GRACZ: obóz ZNIKA z placedImprovements', JSON.stringify(after.placed));
  ok(after.ulepszenia === null, 'A5 GRACZ: obóz ZNIKA z hex.ulepszenia (pole idące do zapisu)', JSON.stringify(after.ulepszenia));
  ok(after.improvementKey === null, 'A6 GRACZ: hex.improvementKey wyczyszczony', String(after.improvementKey));
  ok(after.ulepszenie === Ulepszenie.Brak, 'A7 GRACZ: hex.ulepszenie = Brak (render/zapis)', String(after.ulepszenie));
  ok(A.computeImprovementBuildImpact('oboz_lowiecki', map.hexes[key], []) === null,
    'A8 GRACZ: nowego obozu na tym heksie już nie postawisz (spójność z gate\'em)');
  console.log('     teren pod lasem: ' + teren + ' · stan po wyrębie: ' + JSON.stringify(after));
}

// === B. AI — dosłowny blok wycinki z main.ts ===============================
console.log('\n=== B. AI: dosłowny blok `if (meta?.typ === "wycinka")` (ziarno 777) ===');
{
  const map = genMap(777);
  const placed = new Map();
  A.setState(map, placed);
  const key = findHex(map, h => h.nakladka === Nakladka.Las);
  ok(!!key, 'B0 istotność: mapa 777 ma heks z lasem');
  const hex = map.hexes[key];
  place(map, placed, key, ['oboz_lowiecki']);
  A.wyrabAI_realny({
    meta: { typ: 'wycinka', clearing: { pracaPerTura: 5, tury: 4 } },
    hexForImprovement: hex, hexKey: key, ownerId: 1,
    cmd: { q: hex.coords.q, r: hex.coords.r }, koszt: 20, poolBefore: 100,
    aiPracaPoolByOwner: new Map(), cities: [], cityBuilt: new Map(),
    data: { econParams: {} }, _menuDifficulty: 'normalny',
  });
  const after = layersOf(map, placed, key);
  ok(after.nakladka === Nakladka.Brak, 'B1 istotność: AI faktycznie wycięło las (nie weszło w continue)', after.nakladka);
  ok(after.placed === null, 'B2 AI: obóz ZNIKA z placedImprovements', JSON.stringify(after.placed));
  ok(after.ulepszenia === null, 'B3 AI: obóz ZNIKA z hex.ulepszenia', JSON.stringify(after.ulepszenia));
  ok(after.ulepszenie === Ulepszenie.Brak, 'B4 AI: hex.ulepszenie = Brak', String(after.ulepszenie));
}

// === C. KONTROLA ODWROTNA — filtr NIE jest za szeroki ======================
console.log('\n=== C. ODWROTNIE: co MA zostać po wyrębie (ziarno 31415) ===');
{
  const map = genMap(31415);
  const placed = new Map();
  A.setState(map, placed);
  const keys = [];
  for (const k of Object.keys(map.hexes)) {
    if (map.hexes[k].nakladka === Nakladka.Las) keys.push(k);
    if (keys.length >= 6) break;
  }
  ok(keys.length >= 5, 'C0 istotność: mapa 31415 ma co najmniej 5 heksów z lasem', String(keys.length));

  place(map, placed, keys[0], ['tartak']);
  A.finalizeHexClearing(keys[0]);
  ok(JSON.stringify(placed.get(keys[0])) === JSON.stringify(['tartak']),
    'C1 TARTAK ZOSTAJE po wyrębie (kanon: las zostaje przy tartaku)', JSON.stringify(placed.get(keys[0])));
  ok(JSON.stringify(map.hexes[keys[0]].ulepszenia) === JSON.stringify(['tartak']),
    'C2 tartak zostaje też w polach heksa (nie skasowany po cichu)', JSON.stringify(map.hexes[keys[0]].ulepszenia));

  place(map, placed, keys[1], ['farma']);
  A.finalizeHexClearing(keys[1]);
  ok(JSON.stringify(placed.get(keys[1])) === JSON.stringify(['farma']),
    'C3 FARMA ZOSTAJE (świadomie poza zbiorem — osobna decyzja właściciela)', JSON.stringify(placed.get(keys[1])));

  place(map, placed, keys[2], ['glinianka']);
  A.finalizeHexClearing(keys[2]);
  ok(JSON.stringify(placed.get(keys[2])) === JSON.stringify(['glinianka']),
    'C4 GLINIANKA ZOSTAJE (warunek = złoże gliny, nie las)', JSON.stringify(placed.get(keys[2])));

  place(map, placed, keys[3], ['tartak', 'oboz_lowiecki', 'droga']);
  A.finalizeHexClearing(keys[3]);
  ok(JSON.stringify(placed.get(keys[3])) === JSON.stringify(['tartak', 'droga']),
    'C5 heks mieszany: znika WYŁĄCZNIE obóz, kolejność reszty zachowana', JSON.stringify(placed.get(keys[3])));
  ok(map.hexes[keys[3]].improvementKey === 'droga',
    'C6 heks mieszany: improvementKey przeliczony na ostatnią pozostałą warstwę', String(map.hexes[keys[3]].improvementKey));

  place(map, placed, keys[4], ['droga', 'fort', 'kamieniolom', 'irygacja', 'pastwisko']);
  A.finalizeHexClearing(keys[4]);
  ok(JSON.stringify(placed.get(keys[4])) === JSON.stringify(['droga', 'fort', 'kamieniolom', 'irygacja', 'pastwisko']),
    'C7 pozostałe ulepszenia nietknięte', JSON.stringify(placed.get(keys[4])));
}

// === D. SKALA — na ilu heksach obóz zostaje poza lasem (odpowiednik sondy FC) ===
console.log('\n=== D. SKALA: 5 map × wszystkie heksy z lasem, ścieżka GRACZA i AI ===');
{
  let hexy = 0, zostalGracz = 0, zostalAI = 0, tartakZostal = 0, tartakOgolem = 0;
  for (const seed of [90210, 777, 31415, 5150, 424242]) {
    const map = genMap(seed);
    const placed = new Map();
    A.setState(map, placed);
    for (const k of Object.keys(map.hexes)) {
      const h = map.hexes[k];
      if (!h || h.nakladka !== Nakladka.Las) continue;
      hexy++;
      const uzyjAI = (hexy % 2) === 0;
      place(map, placed, k, ['oboz_lowiecki']);
      if (uzyjAI) {
        A.wyrabAI_realny({
          meta: { typ: 'wycinka', clearing: { pracaPerTura: 5, tury: 4 } },
          hexForImprovement: h, hexKey: k, ownerId: 1,
          cmd: { q: h.coords.q, r: h.coords.r }, koszt: 20, poolBefore: 100,
          aiPracaPoolByOwner: new Map(), cities: [], cityBuilt: new Map(),
          data: { econParams: {} }, _menuDifficulty: 'normalny',
        });
      } else {
        A.finalizeHexClearing(k);
      }
      const zostal = (placed.get(k) || []).includes('oboz_lowiecki')
                  || (h.ulepszenia || []).includes('oboz_lowiecki');
      if (zostal) { if (uzyjAI) zostalAI++; else zostalGracz++; }
    }
    // kontrola odwrotna na tej samej skali
    const map2 = genMap(seed);
    const placed2 = new Map();
    A.setState(map2, placed2);
    for (const k of Object.keys(map2.hexes)) {
      const h = map2.hexes[k];
      if (!h || h.nakladka !== Nakladka.Las) continue;
      tartakOgolem++;
      place(map2, placed2, k, ['tartak']);
      A.finalizeHexClearing(k);
      if ((placed2.get(k) || []).includes('tartak')) tartakZostal++;
    }
  }
  console.log('     heksy Las poddane wyrębowi: ' + hexy
    + ' · obóz ZOSTAŁ poza lasem — gracz: ' + zostalGracz + ', AI: ' + zostalAI);
  console.log('     tartak poddany wyrębowi: ' + tartakOgolem + ' · tartak ZOSTAŁ: ' + tartakZostal);
  ok(hexy >= 200, 'D0 istotność: próba ma co najmniej 200 heksów z lasem', String(hexy));
  ok(zostalGracz === 0, 'D1 GRACZ: obóz nie został poza lasem na ŻADNYM heksie', String(zostalGracz));
  ok(zostalAI === 0, 'D2 AI: obóz nie został poza lasem na ŻADNYM heksie', String(zostalAI));
  ok(tartakZostal === tartakOgolem, 'D3 TARTAK został na WSZYSTKICH heksach (kanon)',
    tartakZostal + '/' + tartakOgolem);
}

console.log('\noboz-lowiecki-ev-r2-mainpath: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
