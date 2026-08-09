'use strict';
/** node tools/city-map-badge-test.cjs — pigułka miasta v1: defenseTier + cityMapBadgeKey */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.city-map-badge-entry.ts');
const bundle = path.join(__dirname, '.city-map-badge-bundle.cjs');

fs.writeFileSync(entry, `
export {
  defenseTierFromCity,
  defenseTierFromWallKind,
  wallKindFromBuilt,
  cityMapBadgeKey,
  civInitialForIconId,
  drawCityMapBadgeCanvas,
  makeCityMapBadgeSprite,
  setCityMapBadgeCivSigil,
  setCityMapBadgeLeaderPortrait,
  setCityMapBadgeProdIcon,
} from '../src/render/cityMapStatChip';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

// --- Atrapa DOM/kanwy: pigułka rysuje się na canvasie, a sygnet doczytuje przez Image. ---
// Potrzebne dla asercji BUG-ETYKIETA-MIASTA-ROZMYTA (dpr) i BUG-IKONA-KULTURY-PLACEHOLDER
// (kolejka onReady). Instalowane PRZED require(bundle).
const stubCanvases = [];
function makeStubCtx(canvas) {
  let t = [1, 0, 0, 1, 0, 0];
  return {
    _transform: () => t,
    setTransform(a, b, c, d, e, f) { t = [a, b, c, d, e, f]; },
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, closePath() {}, fill() {}, stroke() {}, clip() {},
    arc() {}, clearRect() {},
    // `_drawnSrcs` (a nie sam licznik) jest tu konieczne: przy współdzielonych żądaniach
    // plakietka dostaje przerysowanie także od SYGNETU, więc `_imageCount` rośnie nawet gdy
    // callback portretu / ikony produkcji zginął. Bez rozróżnienia ŹRÓDŁA obrazka asercja
    // przechodziłaby niezależnie od tego, czy naprawa jest obecna.
    drawImage(img) { canvas._imageCount++; canvas._drawnSrcs.push((img && img._src) || ''); },
    createLinearGradient: () => ({ addColorStop() {} }),
    measureText: (s) => ({ width: String(s).length * 9 }),
    fillText(s) { canvas._texts.push(String(s)); },
    font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: '', textBaseline: '',
  };
}
function makeStubCanvas() {
  const c = {
    width: 300, height: 150, _imageCount: 0, _texts: [], _drawnSrcs: [],
    _ctx: null, nodeName: 'CANVAS',
  };
  c.getContext = () => (c._ctx || (c._ctx = makeStubCtx(c)));
  stubCanvases.push(c);
  return c;
}
global.document = { createElement: (tag) => (tag === 'canvas' ? makeStubCanvas() : {}) };
global.window = { devicePixelRatio: 1 };
global.self = global;
let pendingImageLoads = [];
let deferImageLoads = false;
global.Image = class {
  constructor() { this.width = 64; this.height = 64; this._src = ''; }
  set src(v) {
    this._src = String(v);
    const fire = () => { if (this.onload) this.onload(); };
    if (deferImageLoads) pendingImageLoads.push(fire); else fire();
  }
  get src() { return this._src; }
};
global.HTMLImageElement = global.Image;
global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');

const M = require(bundle);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('city-map-badge-test (pigułka miasta v1)\n');

assert(M.defenseTierFromCity([]) === 0, 'brak budynków → tier 0');
assert(M.defenseTierFromCity(['koszary']) === 0, 'koszary nie dają tieru obrony');
assert(M.defenseTierFromCity(['palisada']) === 1, 'palisada → tier 1 (szara)');
assert(M.defenseTierFromCity(['mury']) === 2, 'mury → tier 2 (złota)');
assert(M.defenseTierFromCity(['fort']) === 2, 'fort/cytadela → tier 2');
assert(M.defenseTierFromCity(['mury', 'fort']) === 2, 'mury+fort → tier 2');
assert(M.defenseTierFromCity([], true) === 0, 'maMur ignorowane (Q1=A) → tier 0');

assert(M.defenseTierFromWallKind('none') === 0, 'wallKind none → tier 0');
assert(M.defenseTierFromWallKind('palisada') === 1, 'wallKind palisada → tier 1');
assert(M.defenseTierFromWallKind('stone') === 2, 'wallKind stone → tier 2');
assert(M.wallKindFromBuilt(['palisada']) === 'palisada', 'built palisada → palisada');
assert(M.wallKindFromBuilt(['mury']) === 'stone', 'built mury → stone');
assert(M.wallKindFromBuilt([]) === 'none', 'built pusta → none');

const keyBase = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 1,
  civIconId: 'grecy',
  prodActive: false,
});
assert(keyBase.includes('Ateny|5|d1|cgrecy|p-|g-|w0'), 'klucz cache zawiera defense+civ+growth');
assert(keyBase.includes('cs0|e-'), 'klucz domyślny: major bez epoki');

const keyMajorPortrait = M.cityMapBadgeKey({
  cityName: 'Rzym',
  population: 8,
  defenseTier: 2,
  civIconId: 'rzym',
  isCityState: false,
  era: 2,
});
assert(keyMajorPortrait.includes('cs0|e2'), 'major AI: cs0 + epoka w kluczu');
assert(keyMajorPortrait.includes('crzym'), 'major: civ w kluczu');

const keyCityState = M.cityMapBadgeKey({
  cityName: 'Sparta',
  population: 3,
  defenseTier: 0,
  civIconId: 'grecy',
  isCityState: true,
  era: 1,
});
assert(keyCityState.includes('cs1|e1'), 'miasto-państwo: cs1 w kluczu');
assert(keyCityState !== keyMajorPortrait, 'MP vs major — różne klucze cache');

const keyProd = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 2,
  civIconId: 'rzym',
  prodActive: true,
  prodKind: 'jednostka',
  prodId: 'Wojownik',
});
assert(keyProd !== keyBase, 'prod zmienia klucz cache');
assert(keyProd.includes('pjednostka:Wojownik'), 'klucz zawiera rodzaj+id produkcji');

const keyProdBld = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 2,
  civIconId: 'rzym',
  prodActive: true,
  prodKind: 'budynek',
  prodId: 'koszary',
});
assert(keyProdBld.includes('pbudynek:koszary'), 'klucz budynku zawiera id');

const keyGrowth = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 0,
  civIconId: 'grecy',
  prodActive: false,
  growthLevel: 3,
});
assert(keyGrowth.includes('g3'), 'klucz zawiera poziom Wyżywienia');
assert(keyGrowth !== keyBase, 'growth zmienia klucz cache');

// --- MAP-UX-MARKER-Q1 = C — marker stolicy w kluczu cache -------------------
// Bez tego segmentu przejście stolica↔nie-stolica trafiłoby w starą teksturę i marker
// (złota obwódka + korona) nie przerysowałby się na mapie.
const keyNieStolica = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 1,
  civIconId: 'grecy',
  prodActive: false,
  isCapital: false,
});
const keyStolica = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 1,
  civIconId: 'grecy',
  prodActive: false,
  isCapital: true,
});
assert(keyStolica.endsWith('|k1'), 'stolica → segment k1 na końcu klucza cache');
assert(keyNieStolica.endsWith('|k0'), 'nie-stolica → segment k0 na końcu klucza cache');
assert(keyStolica !== keyNieStolica, 'stolica vs nie-stolica — różne klucze cache');
assert(keyNieStolica === keyBase, 'brak isCapital === isCapital:false (ten sam klucz)');

assert(M.civInitialForIconId('grecy') === 'G', 'grecy → G');
assert(M.civInitialForIconId('rzym') === 'R', 'rzym → R');
assert(M.civInitialForIconId('') === '?', 'pusty → ?');

// --- BUG-ETYKIETA-MIASTA-ROZMYTA — gęstość pikseli tekstury pigułki ---------------
// Kanwa musi rosnąć z window.devicePixelRatio (inaczej sprite rozmywa się przy zoomie),
// ale aspect musi zostać bez zmian, żeby plakietka miała tę samą wielkość w świecie.
const badgeBase = { cityName: 'Ateny', population: 5, defenseTier: 1, civIconId: 'grecy' };
global.window.devicePixelRatio = 1;
const canvasDpr1 = M.drawCityMapBadgeCanvas({ ...badgeBase });
global.window.devicePixelRatio = 2;
const canvasDpr2 = M.drawCityMapBadgeCanvas({ ...badgeBase });
global.window.devicePixelRatio = 8;
const canvasDpr8 = M.drawCityMapBadgeCanvas({ ...badgeBase });
global.window.devicePixelRatio = 1;
assert(
  canvasDpr2.width === canvasDpr1.width * 2 && canvasDpr2.height === canvasDpr1.height * 2,
  'dpr=2 → kanwa pigułki 2× w obu wymiarach (ostrość przy zoomie)',
);
assert(
  Math.abs((canvasDpr2.width / canvasDpr2.height) - (canvasDpr1.width / canvasDpr1.height)) < 1e-9,
  'dpr nie zmienia aspect → sprite tej samej wielkości w świecie',
);
assert(
  canvasDpr8.width === canvasDpr1.width * 3 && canvasDpr8.height === canvasDpr1.height * 3,
  'dpr=8 przycięte capem do 3× (bez patologicznych tekstur)',
);
assert(
  canvasDpr2._ctx._transform()[0] === 2 && canvasDpr2._ctx._transform()[3] === 2,
  'kontekst przeskalowany o dpr → geometria dalej liczona w px CSS',
);

// --- BUG-IKONA-KULTURY-PLACEHOLDER — kolejka onReady dla sygnetu w locie ----------
// Dwie plakietki tej samej cywilizacji zamawiają ten sam sygnet; druga trafia, gdy pierwsza
// jest jeszcze 'loading'. Obie muszą dostać przerysowanie, inaczej druga zostaje z rombem.
M.setCityMapBadgeCivSigil(() => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1"/></svg>');
deferImageLoads = true;
pendingImageLoads = [];
const texCache = new Map();
const spriteA = M.makeCityMapBadgeSprite({ ...badgeBase, cityName: 'Ateny', isCityState: true }, texCache);
const spriteB = M.makeCityMapBadgeSprite({ ...badgeBase, cityName: 'Teby', isCityState: true }, texCache);
const canvasA = spriteA.material.map.image;
const canvasB = spriteB.material.map.image;
assert(pendingImageLoads.length === 1, 'wspólny sygnet ładowany tylko raz dla obu plakietek');
assert(
  canvasA._texts.includes('◆') && canvasB._texts.includes('◆'),
  'przed doczytaniem obie plakietki mają placeholder-romb (stan wyjściowy)',
);
const imgCountBefore = { a: canvasA._imageCount, b: canvasB._imageCount };
canvasA._texts.length = 0;
canvasB._texts.length = 0;
pendingImageLoads.forEach((fire) => fire());
assert(canvasA._imageCount > imgCountBefore.a, 'pierwszy zamawiający dostaje przerysowanie z sygnetem');
assert(
  canvasB._imageCount > imgCountBefore.b,
  'DRUGI zamawiający (przegrał wyścig) też dostaje sygnet — brak trwałego rombu',
);
assert(
  canvasB._texts.length > 0 && !canvasB._texts.includes('◆'),
  'po doczytaniu druga plakietka przerysowana BEZ rombu',
);

// Przewiązanie sygnetu (setCityMapBadgeCivSigil leci z wireUnitRendererRingStance, m.in. przy
// wypowiedzeniu wojny) NIE MOŻE gubić kolejki żądań będących w locie.
deferImageLoads = true;
pendingImageLoads = [];
const texCacheWar = new Map();
const spriteWar = M.makeCityMapBadgeSprite(
  { ...badgeBase, cityName: 'Sparta', civIconId: 'persja', isCityState: true },
  texCacheWar,
);
const canvasWar = spriteWar.material.map.image;
assert(pendingImageLoads.length === 1, 'żądanie sygnetu Sparty wystartowało (w locie)');
M.setCityMapBadgeCivSigil(() => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2"/></svg>');
const warImgBefore = canvasWar._imageCount;
canvasWar._texts.length = 0;
pendingImageLoads.forEach((fire) => fire());
assert(
  canvasWar._imageCount > warImgBefore,
  'przewiązanie sygnetu w trakcie ładowania NIE gubi callbacku (brak trwałego rombu)',
);
// Najtrudniejszy przeplot: żądanie A w locie → przewiązanie (clear kasuje TYLKO bookkeeping,
// prawdziwe ładowanie obrazka leci dalej) → żądanie B o TEN SAM sygnet trafia na pustą mapę
// i idzie ścieżką „świeżego ładowania". Ta ścieżka MUSI dopisać się do kolejki A, nie nadpisać ją
// — inaczej callback A ginie na zawsze i plakietka A zostaje z rombem.
deferImageLoads = true;
pendingImageLoads = [];
const texCacheRace = new Map();
const spriteRaceA = M.makeCityMapBadgeSprite(
  { ...badgeBase, cityName: 'Memfis', civIconId: 'egipt', isCityState: true },
  texCacheRace,
);
const canvasRaceA = spriteRaceA.material.map.image;
assert(pendingImageLoads.length === 1, 'żądanie A (Memfis) wystartowało — sygnet w locie');
// Przewiązanie w trakcie ładowania A: czyści civSigilImageById, więc znacznik 'loading' znika,
// ale obrazek A wciąż się ładuje i jego onload dopiero nadejdzie.
M.setCityMapBadgeCivSigil(() => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 3"/></svg>');
const spriteRaceB = M.makeCityMapBadgeSprite(
  { ...badgeBase, cityName: 'Teby', civIconId: 'egipt', isCityState: true },
  texCacheRace,
);
const canvasRaceB = spriteRaceB.material.map.image;
assert(
  pendingImageLoads.length === 2,
  'żądanie B po przewiązaniu startuje własne ładowanie (bookkeeping był wyczyszczony)',
);
assert(canvasRaceA !== canvasRaceB, 'A i B to dwie różne plakietki (różne klucze cache tekstur)');
const raceImgBefore = { a: canvasRaceA._imageCount, b: canvasRaceB._imageCount };
canvasRaceA._texts.length = 0;
canvasRaceB._texts.length = 0;
pendingImageLoads.forEach((fire) => fire());
assert(
  canvasRaceA._imageCount > raceImgBefore.a,
  'przeplot A→clear→B: callback A NIE zginął — plakietka A dostała sygnet',
);
assert(
  canvasRaceB._imageCount > raceImgBefore.b,
  'przeplot A→clear→B: plakietka B też dostała sygnet',
);
// Warunek `_texts.length > 0` jest tu istotny: na kanwie, która NIE została przerysowana,
// „brak rombu" byłby prawdziwy pusto (nic nie narysowano) i asercja nic by nie wykrywała.
assert(
  canvasRaceA._texts.length > 0 && !canvasRaceA._texts.includes('◆'),
  'przeplot A→clear→B: plakietka A faktycznie przerysowana i BEZ rombu',
);
assert(
  canvasRaceB._texts.length > 0 && !canvasRaceB._texts.includes('◆'),
  'przeplot A→clear→B: plakietka B faktycznie przerysowana i BEZ rombu',
);
// --- R-PORTRET-PRODIKONA-DROPPED-CALLBACK ----------------------------------------
// Ten sam wzorzec błędu co wyżej, w dwóch pozostałych funkcjach pliku:
// `requestLeaderPortraitImage` i `requestProdIconImage` robiły `if (cached === 'loading') return;`,
// czyli gubiły callback drugiego zamawiającego zamiast go kolejkować.
// Realny zbieg: `_syncStatChip` (render/cities.ts) buduje plakietkę osobno dla KAŻDEGO miasta,
// więc dwa miasta tej samej cywilizacji (ten sam portret) albo produkujące to samo (ta sama
// ikona) trafiają na siebie w jednej klatce.
//
// UWAGA METODYCZNA: obie plakietki zamawiają też WSPÓLNY SYGNET, którego kolejka już działa —
// więc przegrany wyścigu dostaje przerysowanie tak czy inaczej i `_imageCount` rośnie nawet
// z cofniętą naprawą. Dlatego asercje niżej sprawdzają, KTÓRY obrazek trafił na kanwę
// (`_drawnSrcs`), a nie ile ich było.
const SIGIL_MARK = 'SIGIL-MARK';
function decodeDrawnSrc(src) {
  const prefix = 'data:image/svg+xml;charset=utf-8,';
  if (typeof src === 'string' && src.startsWith(prefix)) {
    try { return decodeURIComponent(src.slice(prefix.length)); } catch (_e) { return src; }
  }
  return String(src || '');
}
function drewSrcContaining(canvas, needle) {
  return canvas._drawnSrcs.some((s) => decodeDrawnSrc(s).includes(needle));
}

// (1) PORTRET WŁADCY — dwa miasta tej samej cywilizacji i epoki (ten sam klucz portretu).
M.setCityMapBadgeCivSigil(
  () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${SIGIL_MARK}"/></svg>`,
);
M.setCityMapBadgeLeaderPortrait((civId, era) => `portret://${civId}/${era}`);
deferImageLoads = true;
pendingImageLoads = [];
const texCachePortret = new Map();
const majorBase = {
  population: 5, defenseTier: 1, civIconId: 'rzym', isCityState: false, era: 2,
};
const spritePortA = M.makeCityMapBadgeSprite({ ...majorBase, cityName: 'Rzym' }, texCachePortret);
const spritePortB = M.makeCityMapBadgeSprite({ ...majorBase, cityName: 'Ostia' }, texCachePortret);
const canvasPortA = spritePortA.material.map.image;
const canvasPortB = spritePortB.material.map.image;
assert(canvasPortA !== canvasPortB, 'portret: dwa miasta = dwie różne plakietki');
assert(
  pendingImageLoads.length === 2,
  'portret: wspólny sygnet + wspólny portret ładowane po razie (drugi zamawiający tylko czeka)',
);
canvasPortA._drawnSrcs.length = 0;
canvasPortB._drawnSrcs.length = 0;
pendingImageLoads.forEach((fire) => fire());
assert(
  drewSrcContaining(canvasPortA, 'portret://rzym/2'),
  'portret: pierwszy zamawiający dostaje portret władcy na medalionie',
);
assert(
  drewSrcContaining(canvasPortB, SIGIL_MARK),
  'portret: druga plakietka W OGÓLE się przerysowała (kontrola — inaczej asercja niżej nic nie znaczy)',
);
assert(
  drewSrcContaining(canvasPortB, 'portret://rzym/2'),
  'portret: DRUGI zamawiający (przegrał wyścig) też dostaje portret — nie zostaje na fallbacku sygnetu',
);

// (2) IKONA PRODUKCJI — dwa miasta produkujące TO SAMO (ten sam klucz ikony).
M.setCityMapBadgeProdIcon(
  (kind, id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="PROD-${kind}-${id}"/></svg>`,
);
deferImageLoads = true;
pendingImageLoads = [];
const texCacheProd = new Map();
const prodBase = {
  population: 4, defenseTier: 0, civIconId: 'grecy', isCityState: true,
  prodActive: true, prodKind: 'budynek', prodId: 'koszary',
};
const spriteProdA = M.makeCityMapBadgeSprite({ ...prodBase, cityName: 'Ateny' }, texCacheProd);
const spriteProdB = M.makeCityMapBadgeSprite({ ...prodBase, cityName: 'Korynt' }, texCacheProd);
const canvasProdA = spriteProdA.material.map.image;
const canvasProdB = spriteProdB.material.map.image;
assert(canvasProdA !== canvasProdB, 'ikona produkcji: dwa miasta = dwie różne plakietki');
assert(
  pendingImageLoads.length === 2,
  'ikona produkcji: wspólny sygnet + wspólna ikona ładowane po razie',
);
canvasProdA._drawnSrcs.length = 0;
canvasProdB._drawnSrcs.length = 0;
pendingImageLoads.forEach((fire) => fire());
assert(
  drewSrcContaining(canvasProdA, 'PROD-budynek-koszary'),
  'ikona produkcji: pierwszy zamawiający dostaje glif produkcji',
);
assert(
  drewSrcContaining(canvasProdB, SIGIL_MARK),
  'ikona produkcji: druga plakietka W OGÓLE się przerysowała (kontrola)',
);
assert(
  drewSrcContaining(canvasProdB, 'PROD-budynek-koszary'),
  'ikona produkcji: DRUGI zamawiający (przegrał wyścig) też dostaje glif — pigułka nie zostaje bez ikony',
);

// (3) Przewiązanie w trakcie ładowania (wireUnitRendererRingStance, 9 wywołań w main.ts)
// NIE MOŻE gubić kolejek portretu ani ikony produkcji — settery czyszczą cache obrazków,
// więc znacznik 'loading' znika, a żądanie w locie leci dalej.
deferImageLoads = true;
pendingImageLoads = [];
const texCacheRewire = new Map();
const spriteRewireA = M.makeCityMapBadgeSprite(
  { ...majorBase, civIconId: 'persja', cityName: 'Persepolis', prodActive: true,
    prodKind: 'jednostka', prodId: 'Wojownik' },
  texCacheRewire,
);
const canvasRewireA = spriteRewireA.material.map.image;
assert(pendingImageLoads.length === 3, 'przewiązanie: sygnet + portret + ikona w locie');
M.setCityMapBadgeLeaderPortrait((civId, era) => `portret://${civId}/${era}`);
M.setCityMapBadgeProdIcon(
  (kind, id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="PROD-${kind}-${id}"/></svg>`,
);
canvasRewireA._drawnSrcs.length = 0;
pendingImageLoads.forEach((fire) => fire());
assert(
  drewSrcContaining(canvasRewireA, 'portret://persja/2'),
  'przewiązanie portretu w trakcie ładowania NIE gubi callbacku',
);
assert(
  drewSrcContaining(canvasRewireA, 'PROD-jednostka-Wojownik'),
  'przewiązanie ikony produkcji w trakcie ładowania NIE gubi callbacku',
);

deferImageLoads = false;

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
