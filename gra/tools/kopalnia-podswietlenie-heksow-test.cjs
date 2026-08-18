'use strict';
/**
 * kopalnia-podswietlenie-heksow-test.cjs — R-KOPALNIA-PODSWIETLENIE-HEKSOW-Q1 (Maciej).
 *
 * Specyfikacja właściciela: po wybraniu w trybie budowy KONKRETNEGO typu kopalni
 * (kopalnia_miedzi / kopalnia_zelaza / kopalnia_cyny / kopalnia_zlota — i tylko tych czterech)
 * wszystkie heksy w zasięgu terytorium gracza, na których TĘ kopalnię da się postawić,
 * podświetlają się na jasnoniebiesko z przezroczystością 30 %.
 *
 * Trzy warstwy asercji:
 *   (1) ZBIÓR HEKSÓW — realny `createImprovementBuildApi().getQualifyingHexes(key)`
 *       z src/map/improvement-build.ts na ręcznie zbudowanej mapie: wzgórze ze złożem miedzi
 *       w terytorium miasta wpada do wyniku dla 'kopalnia_miedzi' i NIE wpada dla pozostałych
 *       trzech kopalń (różne złoża = różne zbiory, więc przełączenie typu MUSI przeliczać).
 *       Plus grupa kopalń: `isMineImprovementKey` obejmuje dokładnie 4 klucze.
 *   (2) STYL I STRUKTURA WARSTWY — `MINE_ELIGIBLE_STYLE` + `buildRangeOverlayGroup`
 *       z src/render/rangeOverlay.ts: kolor jasnoniebieski, krycie DOKŁADNIE 0.30 oraz
 *       siatka oblekająca relief heksa. Test głębi ma pozostać włączony, a warstwa ma być
 *       rysowana poniżej żetonów jednostek (10/12) i etykiet miast (18/20), żeby nie
 *       przebijała globalnie przez teren ani jednostki.
 *   (3) WPIĘCIE W main.ts — asercje na źródle, bo main.ts bootuje całą scenę przy imporcie
 *       (ta sama sytuacja co w granice-relacja-dyplomatyczna-test.cjs / camera-zoom-block-test.cjs).
 *       Strażnik STRUKTURALNY: warstwa buduje się w `refreshBuildHighlight()` (jedyny punkt
 *       zmiany stanu wyboru — NIE w `handleBuildModeHover`, który leci przy każdym ruchu myszy)
 *       i gaśnie na każdej ścieżce wyjścia: inny typ ulepszenia, tryb zakładania miasta, cud,
 *       wyjście z trybu budowy.
 *
 * Uruchamianie z katalogu gra/: node tools/kopalnia-podswietlenie-heksow-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.kopalnia-podswietlenie-entry.ts');
const BUNDLE = path.join(__dirname, '.kopalnia-podswietlenie-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  createImprovementBuildApi,
  isMineImprovementKey,
  MINE_IMPROVEMENT_KEYS,
} from '../src/map/improvement-build';
export {
  buildRangeOverlayGroup,
  disposeRangeOverlayGroup,
  MINE_ELIGIBLE_STYLE,
  MINE_ELIGIBLE_TINT_COLOR,
  MINE_ELIGIBLE_TINT_OPACITY,
  CULTURE_RANGE_STYLE,
  RELIGION_RANGE_STYLE,
} from '../src/render/rangeOverlay';
export { TerenBazowy, Nakladka } from '../src/types/hex';
export { HEX_R } from '../src/render/hexutil';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  external: ['three'], // jak granice-relacja-dyplomatyczna-test.cjs — bundlowanie three puchnie artefakt
  logLevel: 'silent',
});

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log('  OK', msg);
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}
const hex = (n) => '#' + Number(n).toString(16).padStart(6, '0');

console.log('kopalnia-podswietlenie-heksow-test (R-KOPALNIA-PODSWIETLENIE-HEKSOW-Q1)\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. ZBIÓR HEKSÓW — realny getQualifyingHexes na mapie z czterema złożami
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. getQualifyingHexes — który heks kwalifikuje się pod którą kopalnię');

const TB = M.TerenBazowy;
const NK = M.Nakladka;

function mkHex(q, r, teren, zloze) {
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka: NK.Brak,
    zloze,
    rzeka: { obecna: false, krawedzie: [] },
    ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
  };
}

// Miasto gracza w (0,0); cztery wzgórza ze złożami w promieniu terytorium + jedno
// wzgórze BEZ złoża (kontrola: żadna kopalnia nie może tam stanąć).
const hexes = {
  '0,0': mkHex(0, 0, TB.Rownina),
  '1,0': mkHex(1, 0, TB.Wzgorza, 'miedz'),
  '0,1': mkHex(0, 1, TB.Wzgorza, 'zelazo'),
  '1,-1': mkHex(1, -1, TB.Gory, 'cyna'),
  '-1,1': mkHex(-1, 1, TB.Gory, 'zloto'),
  '-1,0': mkHex(-1, 0, TB.Wzgorza),
  '2,0': mkHex(2, 0, TB.Laka),
};
const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };

const cityNodes = [{ q: 0, r: 0, pop: 10, level: 1 }];
const territoryNodes = [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }];

// Wszystkie technologie kopalń jako zbadane — test dotyczy PODŚWIETLENIA, nie bramki tech.
// getQualifyingHexes świadomie nie filtruje po technologii (robi to listTypes/createBuildRequest),
// więc zbiór technologii nie wpływa na wynik tej sekcji; podany dla jasności intencji.
const api = M.createImprovementBuildApi(
  {
    map,
    cityNodes,
    territoryNodes,
    playerOwnerIdNum: 0,
    playerOwnerId: '0',
    playerCivArchetype: 'rzymianie',
    playerEra: 2,
    researchedTechs: new Set(),
  },
  { activeKey: null },
);

const asKeys = (arr) => new Set(arr.map((h) => `${h.q},${h.r}`));

const miedz = asKeys(api.getQualifyingHexes('kopalnia_miedzi'));
const zelazo = asKeys(api.getQualifyingHexes('kopalnia_zelaza'));
const cyna = asKeys(api.getQualifyingHexes('kopalnia_cyny'));
const zloto = asKeys(api.getQualifyingHexes('kopalnia_zlota'));

ok(miedz.has('1,0'), "kopalnia_miedzi: wzgórze ze złożem miedzi (1,0) W ZBIORZE do podświetlenia");
ok(zelazo.has('0,1'), 'kopalnia_zelaza: wzgórze ze złożem żelaza (0,1) w zbiorze');
ok(cyna.has('1,-1'), 'kopalnia_cyny: góra ze złożem cyny (1,-1) w zbiorze');
ok(zloto.has('-1,1'), 'kopalnia_zlota: góra ze złożem złota (-1,1) w zbiorze');

// Każda kopalnia widzi TYLKO swoje złoże — dlatego przełączenie typu MUSI przeliczyć warstwę,
// a nie odtworzyć poprzedni zbiór.
ok(!miedz.has('0,1') && !miedz.has('1,-1') && !miedz.has('-1,1'),
  'kopalnia_miedzi NIE obejmuje heksów żelaza / cyny / złota');
ok(!zelazo.has('1,0') && !cyna.has('1,0') && !zloto.has('1,0'),
  'żadna inna kopalnia nie obejmuje heksu miedzi (1,0)');
{
  const rozne = new Set([[...miedz].join('|'), [...zelazo].join('|'), [...cyna].join('|'), [...zloto].join('|')]);
  ok(rozne.size === 4, 'cztery kopalnie = cztery RÓŻNE zbiory heksów (zmiana typu wymaga przeliczenia)');
}

// Kontrola: wzgórze bez złoża i płaska łąka nie kwalifikują się pod żadną kopalnię.
for (const [nazwa, zbior] of [['miedzi', miedz], ['żelaza', zelazo], ['cyny', cyna], ['złota', zloto]]) {
  ok(!zbior.has('-1,0') && !zbior.has('2,0'),
    `kopalnia ${nazwa}: wzgórze bez złoża (-1,0) i łąka (2,0) poza zbiorem`);
}

// Grupa kopalń — dokładnie cztery klucze, bez kamieniołomu i innych ulepszeń terenu.
ok(M.MINE_IMPROVEMENT_KEYS.size === 4, 'MINE_IMPROVEMENT_KEYS zawiera dokładnie 4 klucze');
for (const k of ['kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'kopalnia_zlota']) {
  ok(M.isMineImprovementKey(k), `isMineImprovementKey('${k}') = true`);
}
for (const k of ['kamieniolom', 'tartak', 'glinianka', 'warzelnia_soli', 'stadnina', 'farma', 'droga']) {
  ok(!M.isMineImprovementKey(k), `isMineImprovementKey('${k}') = false (nie jest kopalnią złoża)`);
}
ok(!M.isMineImprovementKey(null) && !M.isMineImprovementKey(undefined),
  'isMineImprovementKey(null/undefined) = false (brak wyboru = brak warstwy)');

// ─────────────────────────────────────────────────────────────────────────────
// 2. STYL I STRUKTURA WARSTWY — jasnoniebieski, krycie 0.30, widoczny na Wzgórzach/Górach
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. MINE_ELIGIBLE_STYLE + buildRangeOverlayGroup');

const S = M.MINE_ELIGIBLE_STYLE;

ok(S.tintOpacity === 0.30,
  `krycie warstwy = DOKŁADNIE 0.30 (spec właściciela „przezroczystość 30%"), jest ${S.tintOpacity}`);
ok(M.MINE_ELIGIBLE_TINT_OPACITY === 0.30, 'stała MINE_ELIGIBLE_TINT_OPACITY = 0.30');
ok(S.tintColor === M.MINE_ELIGIBLE_TINT_COLOR,
  `styl używa stałej koloru ${hex(M.MINE_ELIGIBLE_TINT_COLOR)} (jedno źródło prawdy)`);

// „Jasnoniebieski": dominanta niebieska, kolor jasny, wyraźnie różny od fioletu kultury
// i pomarańczu religii (inaczej gracz nie odróżni warstw na jednym ekranie).
{
  const chan = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  const [r, g, b] = chan(S.tintColor);
  ok(b > 200, `jasnoniebieski: kanał B > 200 (jest ${b})`);
  ok(b > r + 60, `jasnoniebieski: dominanta niebieska nad czerwonym (B=${b} vs R=${r})`);
  ok(g > 120 && g < b, `jasnoniebieski, nie granatowy: G=${g} podniesione, ale poniżej B=${b}`);
  ok(S.tintColor !== M.CULTURE_RANGE_STYLE.tintColor && S.tintColor !== M.RELIGION_RANGE_STYLE.tintColor,
    'kolor warstwy kopalni różny od warstwy kultury i religii');
}

// Minimalna atrapa mapy dla renderu — buildRangeOverlayGroup czyta teren i coords.
function fakeMap(entries) {
  const h = {};
  for (const [key, teren] of entries) {
    const [q, r] = key.split(',').map(Number);
    h[key] = { coords: { q, r }, terenBazowy: teren };
  }
  return { hexes: h, seed: 0 };
}

{
  const keys = ['1,0', '0,1', '1,-1'];
  const fm = fakeMap([['1,0', TB.Wzgorza], ['0,1', TB.Wzgorza], ['1,-1', TB.Gory]]);
  const group = M.buildRangeOverlayGroup(fm, new Set(keys), S);

  const tint = group.children.find((c) => c.isMesh && !c.isLineSegments);
  ok(!!tint, 'grupa zawiera siatkę podświetlenia (tint)');
  ok(tint && !tint.isInstancedMesh, 'tint reliefowy nie jest płaską instancją krążka');
  ok(
    tint?.userData?.hexKeys?.length === keys.length
      && keys.every((key) => tint.userData.hexKeys.includes(key)),
    'tint reliefowy obejmuje dokładnie wskazane heksy',
  );
  ok(
    tint?.userData?.triangles === keys.length * 96,
    `siatka ma 96 trójkątów na heks (${tint?.userData?.triangles} dla ${keys.length} heksów)`,
  );
  ok(tint?.userData?.subdivisions === 4, 'relief jest dzielony na 4 odcinki w sektorze');
  ok(tint.material.color.getHex() === M.MINE_ELIGIBLE_TINT_COLOR,
    `materiał tinta w kolorze ${hex(M.MINE_ELIGIBLE_TINT_COLOR)}`);
  ok(tint.material.opacity === 0.30, `materiał tinta ma opacity 0.30 (jest ${tint.material.opacity})`);
  ok(tint.material.transparent === true, 'materiał tinta transparent (inaczej opacity nie działa)');

  // Warstwa leży na powierzchni reliefu, więc może być widoczna bez globalnego
  // wyłączenia testu głębi. Dzięki temu teren i obiekty przed nią nadal ją zasłaniają.
  ok(tint.material.depthTest === true,
    'tint reliefowy ma depthTest:true — teren i obiekty nadal mogą go zasłonić');
  ok(tint.material.depthWrite === false, 'tint z depthWrite:false (nie zasłania innych przezroczystości)');
  ok(tint.material.polygonOffset === true, 'tint reliefowy ma polygonOffset przeciw migotaniu');

  const border = group.children.find((c) => c.isLineSegments);
  ok(!!border, 'grupa zawiera obwódkę zbioru heksów');
  ok(border.material.depthTest === true, 'obwódka zachowuje test głębi (nie przebija globalnie terenu)');
  ok(border.renderOrder > tint.renderOrder,
    `obwódka rysowana PO tincie (${border.renderOrder} > ${tint.renderOrder}) — brak migotania na wspólnej płaszczyźnie`);

  // Warstwa nie może przykrywać żetonów jednostek (renderOrder 10/12) ani etykiet miast (18/20).
  ok(tint.renderOrder < 10 && border.renderOrder < 10,
    `kolejność rysowania warstwy (${tint.renderOrder}/${border.renderOrder}) poniżej żetonów jednostek (10) i etykiet miast (18/20)`);
  // …ale powyżej terenu i warstw zasięgu kultury/religii (3/5/6).
  ok(tint.renderOrder > 6, `tint powyżej warstw kultury/religii (renderOrder ${tint.renderOrder} > 6)`);

  M.disposeRangeOverlayGroup(group);
  ok(group.children.length === 0, 'disposeRangeOverlayGroup czyści grupę (brak wycieku geometrii)');
}

// Regresja: kultura i religia NIE dostają alwaysOnTop — ich zachowanie bez zmian.
{
  const fm = fakeMap([['0,0', TB.Laka]]);
  for (const [nazwa, styl] of [['kultury', M.CULTURE_RANGE_STYLE], ['religii', M.RELIGION_RANGE_STYLE]]) {
    ok(styl.hugTerrainRelief !== true, `styl ${nazwa} nadal bez oblewania reliefu (brak regresji)`);
    const g = M.buildRangeOverlayGroup(fm, new Set(['0,0']), styl);
    const t = g.children.find((c) => c.isInstancedMesh);
    ok(t.material.depthTest === true, `warstwa ${nazwa}: depthTest nietknięty (domyślne true)`);
    ok(t.renderOrder === 3, `warstwa ${nazwa}: renderOrder nadal 3`);
    M.disposeRangeOverlayGroup(g);
  }
}

ok(S.hugTerrainRelief === true, 'MINE_ELIGIBLE_STYLE włącza celowane oblewanie reliefu');

// ─────────────────────────────────────────────────────────────────────────────
// 3. WPIĘCIE W main.ts — strażnik strukturalny (main.ts bootuje scenę przy imporcie)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Wpięcie w main.ts (asercje na źródle)');

const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');

ok(/import\s*\{[^}]*\bMINE_ELIGIBLE_STYLE\b[^}]*\}\s*from\s*['"]\.\/render\/rangeOverlay['"]\s*;/.test(mainSrc),
  'main.ts importuje MINE_ELIGIBLE_STYLE z render/rangeOverlay');
ok(/isMineImprovementKey/.test(mainSrc), 'main.ts importuje isMineImprovementKey z map/improvement-build');

// Ciało refreshBuildHighlight — wycięte po nazwie funkcji do pierwszego domknięcia na jej wcięciu
// (pewniejsze niż jeden regex przez komentarze, które potrafią urosnąć i przestrzelić limit).
{
  const start = mainSrc.indexOf('function refreshBuildHighlight(): void {');
  ok(start > 0, 'main.ts: funkcja refreshBuildHighlight istnieje');
  const end = mainSrc.indexOf('\n    }', start);
  const body = start > 0 && end > start ? mainSrc.slice(start, end) : '';

  ok(/isMineImprovementKey\(activeImprovementKey\)/.test(body),
    'refreshBuildHighlight rozgałęzia się po isMineImprovementKey(activeImprovementKey)');
  ok(/refreshMineEligibleOverlay\(hexes\)/.test(body),
    'refreshBuildHighlight buduje warstwę z listy `hexes` policzonej TU raz (zero dodatkowych skanów terytorium)');

  // Każda ścieżka wyjścia MUSI gasić warstwę: zakładanie miasta, cud, brak trybu budowy /
  // braku klucza, oraz wybór ulepszenia NIEbędącego kopalnią.
  const clears = (body.match(/clearMineEligibleOverlay\(\)/g) || []).length;
  ok(clears >= 4,
    `refreshBuildHighlight gasi warstwę na wszystkich ścieżkach wyjścia (${clears} wywołań clearMineEligibleOverlay, wymagane ≥4)`);

  const foundIdx = body.indexOf('if (foundCityMode)');
  const wonderIdx = body.indexOf('if (activeWonderId)');
  const offIdx = body.indexOf('if (!buildModeOpen || !activeImprovementKey || !buildApi)');
  const mineIdx = body.indexOf('isMineImprovementKey(activeImprovementKey)');
  const nth = (from) => body.indexOf('clearMineEligibleOverlay()', from);
  ok(foundIdx >= 0 && nth(foundIdx) > foundIdx && nth(foundIdx) < wonderIdx,
    'tryb zakładania miasta gasi warstwę kopalni');
  ok(wonderIdx >= 0 && nth(wonderIdx) > wonderIdx && nth(wonderIdx) < offIdx,
    'tryb cudu gasi warstwę kopalni');
  ok(offIdx >= 0 && nth(offIdx) > offIdx && nth(offIdx) < mineIdx,
    'wyjście z trybu budowy / brak aktywnego typu gasi warstwę kopalni');
  ok(mineIdx >= 0 && nth(mineIdx) > mineIdx,
    'wybór ulepszenia NIEbędącego kopalnią gasi warstwę kopalni (zmiana typu = przeliczenie od zera)');
}

// Warstwa gaśnie także wtedy, gdy tryb budowy zamyka się „twardo” (Escape, load gry, restart).
{
  const start = mainSrc.indexOf('function clearBuildModeVisuals(): void {');
  ok(start > 0, 'main.ts: funkcja clearBuildModeVisuals istnieje');
  const end = mainSrc.indexOf('\n    }', start);
  const body = start > 0 && end > start ? mainSrc.slice(start, end) : '';
  ok(/clearMineEligibleOverlay\(\)/.test(body),
    'clearBuildModeVisuals gasi warstwę kopalni (Escape / wczytanie gry / restart sesji)');
}

// Regresja N3: nowa scena podmienia referencję scene podczas nowej gry i loadu.
// Samo clearBuildModeVisuals nie wystarcza, bo stara grupa należy do starej sceny;
// applySceneResult musi wyzerować stan referencji przed dalszym odświeżaniem.
{
  const start = mainSrc.indexOf('function applySceneResult(newSceneResult: SceneResult): void {');
  ok(start > 0, 'main.ts: funkcja applySceneResult istnieje');
  const end = mainSrc.indexOf('\n    }', start);
  const body = start > 0 && end > start ? mainSrc.slice(start, end) : '';
  const clearIdx = body.indexOf('clearMineEligibleOverlay();');
  const sceneReplaceIdx = body.indexOf('scene = newSceneResult.scene;');
  ok(clearIdx >= 0 && sceneReplaceIdx > clearIdx,
    'applySceneResult sprząta stary overlay przed podmianą sceny (nowa gra / wczytanie)');
}

// Funkcja czyszcząca faktycznie zdejmuje grupę ze sceny i zwalnia zasoby.
{
  const start = mainSrc.indexOf('function clearMineEligibleOverlay(): void {');
  ok(start > 0, 'main.ts: funkcja clearMineEligibleOverlay istnieje');
  const end = mainSrc.indexOf('\n    }', start);
  const body = start > 0 && end > start ? mainSrc.slice(start, end) : '';
  const disposeIdx = body.indexOf('disposeRangeOverlayGroup(mineEligibleGroup);');
  const resetIdx = body.indexOf('mineEligibleGroup = null;');
  ok(/scene\.remove\(mineEligibleGroup\)/.test(body), 'clearMineEligibleOverlay zdejmuje grupę ze sceny');
  ok(disposeIdx >= 0 && resetIdx > disposeIdx,
    'clearMineEligibleOverlay zwalnia geometrię/materiały przed wyzerowaniem referencji');
}

// WYDAJNOŚĆ: przeliczenie NIE może wisieć na ruchu myszy (handleBuildModeHover leci przy
// każdym mousemove; getQualifyingHexes skanuje promień wokół KAŻDEGO miasta gracza).
{
  const start = mainSrc.indexOf('function handleBuildModeHover(e: MouseEvent): void {');
  ok(start > 0, 'main.ts: funkcja handleBuildModeHover istnieje');
  const end = mainSrc.indexOf('\n    }', start);
  const body = start > 0 && end > start ? mainSrc.slice(start, end) : '';
  ok(!/refreshMineEligibleOverlay/.test(body),
    'handleBuildModeHover NIE przelicza warstwy kopalni (zero pracy na mousemove)');
  ok(!/clearMineEligibleOverlay/.test(body),
    'handleBuildModeHover nie gasi warstwy kopalni (duch pod kursorem to osobna, współistniejąca warstwa)');
}

// Duch-model pod kursorem zostaje nietknięty — dwie warstwy współistnieją.
ok(/function showGhostImprovement\(q: number, r: number\): void \{/.test(mainSrc),
  'showGhostImprovement (duch 3D pod kursorem) nadal istnieje — warstwa kopalni go nie zastępuje');

// ─────────────────────────────────────────────────────────────────────────────
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
