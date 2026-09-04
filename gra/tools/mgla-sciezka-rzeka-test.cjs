'use strict';
/**
 * mgla-sciezka-rzeka-test.cjs — P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1, GOAL 4.
 *
 * ZGLOSZENIE WLASCICIELA (doslownie): „Czasem, kiedy jednostka bardzo szybko przejdzie,
 * ZWLASZCZA RZEKAMI, to nie zdazy system odnotowac tego przejscia i odkryc terenu.
 * Dopiero odkrywa sie w tym miejscu, w ktorym pojawi sie na koncu, a nie odkrywa nic
 * po drodze."
 *
 * HIPOTEZA RZECZNA — SPRAWDZONA WPROST, NIE PRZYJETA NA WIARE (Tryb czwarty dispatchu).
 *   Ruch rzeczny NIE ma wlasnej sciezki kodu. `terrainMoveCost` (units/setup.ts:653) to
 *   jedno `if (hex.rzeka?.obecna === true) return RIVER_HEX_MOVE_COST` — plaska WARTOSC
 *   kosztu, ignorujaca kary za wzgorza/las/gory. Nie ma osobnej funkcji ruchu rzecznego,
 *   osobnego pathfindingu ani osobnego zapisu pozycji. Rzeka NIE jest wiec osobnym bugiem:
 *   jest MNOZNIKIEM tego samego. Blok [A] mierzy to liczbowo.
 *
 * DLACZEGO TEN TEST ZOSTAJE MIMO OBALENIA HIPOTEZY: bo dokladnie ten przypadek zglosil
 * wlasciciel, i bo dluga sciezka jest najostrzejszym probierzem inwariantu — im tanszy
 * heks, tym wiecej heksow posrednich przepada przy odkrywaniu z samej pozycji koncowej.
 *
 * KOD TESTOWANY JEST PRAWDZIWY: bundlowane `advanceScoutAutoExplore` (game/scout-auto-
 * explore.ts — CZWARTE miejsce wzorca, naprawione w tej rundzie), `terrainMoveCost`,
 * `computeVisibleAt`. Zero reimplementacji formuly po stronie testu (C-046).
 *
 * BLOKI:
 *   [A] rzeka jako mnoznik dlugosci sciezki -- liczbowo, na prawdziwym terrainMoveCost.
 *   [B] PRZED (bug): odkrycie WYLACZNIE z pozycji koncowej -> heksy posrednie przepadaja.
 *   [C] PO (naprawa): hak `onAfterStep` jak w main.ts -> KAZDY heks posredni w `explored`.
 *   [D] wpiecie: hak w main.ts robi dokladnie to, co hak z bloku [C] (nie tautologia).
 *
 * Usage (z gra/): node tools/mgla-sciezka-rzeka-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.mgla-rzeka-entry.ts');
const BUNDLE = path.join(__dirname, '.mgla-rzeka-bundle.cjs');
const MAIN_TS_PATH = path.join(GRA_ROOT, 'src', 'main.ts');

fs.writeFileSync(
  ENTRY,
  `export { advanceScoutAutoExplore } from '../src/game/scout-auto-explore';
export { terrainMoveCost, keyOf } from '../src/units/setup';
export { computeVisibleAt, computeVisibleAlongPath, addExplored } from '../src/game/visibility';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  advanceScoutAutoExplore,
  terrainMoveCost,
  keyOf,
  computeVisibleAt,
  addExplored,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function assert(cond, msg, detail) {
  if (cond) {
    pass++;
    console.log('  OK:', msg);
  } else {
    fail++;
    console.error('  FAIL:', msg, detail !== undefined ? '-- ' + JSON.stringify(detail) : '');
  }
}

// ---------------------------------------------------------------------------
// Fixture: korytarz mapy z RZEKA wzdluz r === 0.
// Teren wszedzie identyczny (Wzgorza + Las) -- JEDYNA roznica miedzy pasem
// rzecznym a reszta to `rzeka.obecna`. Dzieki temu blok [A] mierzy wplyw samej
// rzeki, nie terenu.
// ---------------------------------------------------------------------------
const Q_MIN = -2;
const Q_MAX = 16;
const R_MIN = -3;
const R_MAX = 3;

function hex(q, r, rzeka) {
  return {
    coords: { q, r },
    terenBazowy: 'wzgorza',
    nakladka: 'las',
    ulepszenie: 'brak',
    wlasciciel: null,
    wioska: { istnieje: false, ludnosc: 0 },
    widocznosc: {},
    rzeka: { obecna: rzeka, kierunek: null },
  };
}

function buildRiverMap() {
  const hexes = {};
  for (let q = Q_MIN; q <= Q_MAX; q++) {
    for (let r = R_MIN; r <= R_MAX; r++) {
      hexes[keyOf(q, r)] = hex(q, r, r === 0);
    }
  }
  return {
    szerokoscQ: Q_MAX - Q_MIN + 1,
    wysokoscR: R_MAX - R_MIN + 1,
    hexes,
    seed: 1,
    riverPaths: [],
  };
}

const map = buildRiverMap();
const SIGHT = 1;
const RUCH = 12;

function makeScout() {
  return {
    id: 'zwiadowca-1',
    ownerId: 0,
    typeId: 'Zwiadowca',
    category: 'zwiadowca',
    q: 0,
    r: 0,
    ruch: RUCH,
    ruchLeft: RUCH,
    autoExplore: true,
  };
}

console.log('========================================================================');
console.log('P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1 -- GOAL 4: scenariusz RZECZNY');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// [A] Rzeka jako MNOZNIK dlugosci sciezki -- nie jako osobna sciezka kodu.
// ---------------------------------------------------------------------------
console.log('[A] rzeka = plaski koszt w terrainMoveCost, nie osobna sciezka kodu');

const kosztRzeka = terrainMoveCost(map.hexes[keyOf(5, 0)]);
const kosztLad = terrainMoveCost(map.hexes[keyOf(5, 2)]);

assert(kosztRzeka === 1,
  '[A] heks z rzeka (Wzgorza+Las) kosztuje 1 MP -- plaski RIVER_HEX_MOVE_COST ignoruje kary terenu',
  kosztRzeka);
assert(kosztLad > kosztRzeka,
  '[A] IDENTYCZNY teren BEZ rzeki kosztuje wiecej -- rzeka wydluza sciezke przebywana w jednej turze',
  { kosztRzeka, kosztLad });
assert(Math.floor(RUCH / kosztRzeka) > Math.floor(RUCH / kosztLad),
  '[A] przy tym samym budzecie ruchu rzeka daje WIECEJ heksow na ture'
  + ' -- to jest cala tresc obserwacji „zwlaszcza rzekami" (mnoznik, nie osobny bug)',
  { rzeka: Math.floor(RUCH / kosztRzeka), lad: Math.floor(RUCH / kosztLad) });

// ---------------------------------------------------------------------------
// [B] PRZED (bug): odkrycie WYLACZNIE z pozycji koncowej.
//     Hak `onAfterStep` NIE odkrywa niczego -- dokladnie stan sprzed tej rundy,
//     gdzie jedynym odkryciem bylo `refreshFog()` PO calej petli zwiadowcy.
// ---------------------------------------------------------------------------
console.log('\n[B] PRZED (bug): odkrycie tylko z pozycji koncowej -> heksy posrednie przepadaja');

const scoutPrzed = makeScout();
const exploredPrzed = new Set(computeVisibleAt(scoutPrzed.q, scoutPrzed.r, map, SIGHT));
const trasaPrzed = [];
const wynikPrzed = advanceScoutAutoExplore(
  scoutPrzed,
  map,
  exploredPrzed,
  [scoutPrzed],
  SIGHT,
  () => 0.5,
  (u) => { trasaPrzed.push({ q: u.q, r: u.r }); },   // BEZ odkrywania -- stary stan
);

assert(wynikPrzed.moved === true && wynikPrzed.steps >= 4,
  '[B] zwiadowca przeszedl WIELE heksow w JEDNEJ turze (sanity scenariusza)',
  { steps: wynikPrzed.steps, trasa: trasaPrzed });

// `refreshFog()` po petli = widocznosc z pozycji KONCOWEJ.
addExplored(exploredPrzed, computeVisibleAt(scoutPrzed.q, scoutPrzed.r, map, SIGHT));

const posrednie = trasaPrzed.slice(0, -1);
const zgubionePrzed = posrednie.filter((h) => !exploredPrzed.has(keyOf(h.q, h.r)));
assert(zgubionePrzed.length > 0,
  '[B] BUG ODTWORZONY: heksy POSREDNIE trasy NIE sa w `explored` po samym refreshFog()'
  + ' -- dokladnie objaw zgloszony przez wlasciciela',
  { zgubione: zgubionePrzed, kroki: wynikPrzed.steps });

// ---------------------------------------------------------------------------
// [C] PO (naprawa): hak `onAfterStep` odkrywa po KAZDYM kroku -- tak jak main.ts.
// ---------------------------------------------------------------------------
console.log('\n[C] PO (naprawa): hak onAfterStep odkrywa po kazdym kroku');

const scoutPo = makeScout();
const exploredPo = new Set(computeVisibleAt(scoutPo.q, scoutPo.r, map, SIGHT));
const trasaPo = [];
const wynikPo = advanceScoutAutoExplore(
  scoutPo,
  map,
  exploredPo,
  [scoutPo],
  SIGHT,
  () => 0.5,
  (u) => {
    trasaPo.push({ q: u.q, r: u.r });
    // Dokladnie to, co robi main.ts: revealAlongPathForStack([u], [{ q: u.q, r: u.r }])
    // -> addExplored(explored, computeVisibleAlongPath([{q,r}], map, unitSight(u))).
    addExplored(exploredPo, computeVisibleAt(u.q, u.r, map, SIGHT));
  },
);
addExplored(exploredPo, computeVisibleAt(scoutPo.q, scoutPo.r, map, SIGHT));

assert(wynikPo.steps === wynikPrzed.steps,
  '[C] naprawa NIE zmienia trasy ani liczby krokow (zero wplywu na ruch/koszty)',
  { przed: wynikPrzed.steps, po: wynikPo.steps });

const zgubionePo = trasaPo.filter((h) => !exploredPo.has(keyOf(h.q, h.r)));
assert(zgubionePo.length === 0,
  '[C] KAZDY heks trasy (nie tylko koncowy) jest w `explored`',
  zgubionePo);

// Kryterium GOAL 4: kazdy heks POSREDNI, nie tylko poczatek i koniec.
const posrednePo = trasaPo.slice(0, -1);
assert(posrednePo.length > 0 && posrednePo.every((h) => exploredPo.has(keyOf(h.q, h.r))),
  '[C] KAZDY heks POSREDNI (bez konca) jest w `explored` -- kryterium konca GOAL 4',
  posrednePo.filter((h) => !exploredPo.has(keyOf(h.q, h.r))));

// Sasiedztwo heksow posrednich tez -- to jest realne „odkrycie terenu po drodze",
// nie samo odnotowanie przebytego heksu.
const sasiedziPosrednich = new Set();
for (const h of posrednePo) {
  for (const k of computeVisibleAt(h.q, h.r, map, SIGHT)) sasiedziPosrednich.add(k);
}
const brakSasiadow = [...sasiedziPosrednich].filter((k) => !exploredPo.has(k));
assert(brakSasiadow.length === 0,
  '[C] odkryty jest TEREN wokol heksow posrednich (zasieg wzroku), nie tylko sam heks',
  brakSasiadow);

assert(exploredPo.size > exploredPrzed.size,
  '[C] REGRESJA/ZYSK: `explored` po naprawie jest ISTOTNIE wieksze niz przed',
  { przed: exploredPrzed.size, po: exploredPo.size });

let przedPodzbiorem = true;
for (const k of exploredPrzed) { if (!exploredPo.has(k)) { przedPodzbiorem = false; break; } }
assert(przedPodzbiorem,
  '[C] zero regresji: wszystko, co bylo odkryte PRZED, jest odkryte takze PO');

// ---------------------------------------------------------------------------
// [D] WPIECIE -- hak w main.ts robi to samo co hak z bloku [C].
//     Bez tego bloku [C] dowodzilby tylko wlasnego haka testowego.
// ---------------------------------------------------------------------------
console.log('\n[D] wpiecie w main.ts (static)');

const mainSrc = fs.readFileSync(MAIN_TS_PATH, 'utf8');

const wywolanie = mainSrc.match(/runScoutsAutoExplore\(([\s\S]*?)\n\s{10}\);/);
assert(wywolanie !== null, '[D] wywolanie `runScoutsAutoExplore(` znalezione w main.ts');
if (wywolanie) {
  assert(/revealAlongPathForStack\(\[u\], \[\{ q: u\.q, r: u\.r \}\]\)/.test(wywolanie[1]),
    '[D] hak `onAfterStep` w main.ts odkrywa mgle dla BIEZACEGO heksu kroku'
    + ' -- odpowiednik haka z bloku [C]',
    { arg: wywolanie[1].slice(0, 300) });
}

assert(/function revealAlongPathForStack\([\s\S]*?addExplored\(explored, computeVisibleAlongPath\(pathHexes, map, unitSight\(su\)\)\)/.test(mainSrc),
  '[D] `revealAlongPathForStack` faktycznie dopisuje do `explored` (helper nie wydrazony)');

fs.unlinkSync(ENTRY);
fs.unlinkSync(BUNDLE);

console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
