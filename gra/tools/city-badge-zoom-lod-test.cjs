'use strict';
/**
 * city-badge-zoom-lod-test.cjs — BUG-ETYKIETA-MIASTA-ROZMYTA-ZOOM
 * Run: cd gra && node tools/city-badge-zoom-lod-test.cjs
 *
 * Plakietka miasta to THREE.Sprite o STAŁEJ wysokości w świecie (worldH = 0,52 j.św.), więc
 * przy zbliżeniu kamery jej tekstura jest rozciągana na ekranie (przy minDist = 8/3 j.św.
 * i FOV 50° — ~3,9× dla viewportu 900 px CSS) i rozmywa się. Istniejący fix `badgePixelRatio()`
 * (2026-08-08) koryguje TYLKO gęstość ekranu (devicePixelRatio) — to drugi, niezależny
 * mnożnik i sam nie zmniejsza rozciągnięcia przez zoom ani o krok.
 *
 * Ta bramka pilnuje czterech rzeczy:
 *   1. PROGI  — czysta funkcja `cityBadgeLodLevelForDist` (odległość bezwzględna, nie `t`);
 *   2. KLUCZ  — `cityMapBadgeKey` zmienia się z poziomem LOD (inaczej zmiana progu trafia
 *               w starą, rozmytą teksturę z cache);
 *   3. PIKSELE — poziom 0 daje DOKŁADNIE dzisiejszą kanwę (zero regresji), poziomy 1/2 dają
 *               ×2 / ×3 pikseli przy NIEZMIENIONEJ wielkości plakietki w świecie;
 *   4. PRZEWÓD — CityRenderer przełącza poziom z odległości kamery, przemalowuje plakietki
 *               (tex.needsUpdate) i zwalnia tekstury poprzedniego poziomu.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.city-badge-zoom-lod-entry.ts');
const BUNDLE = path.join(__dirname, '.city-badge-zoom-lod-bundle.cjs');

fs.writeFileSync(ENTRY, `
import * as THREE from 'three';
export { THREE };
export {
  cityMapBadgeKey,
  drawCityMapBadgeCanvas,
  makeCityMapBadgeSprite,
  disposeCityMapBadgeTexturesForOtherLod,
  setCityMapBadgeCivSigil,
} from '../src/render/cityMapStatChip';
export {
  cityBadgeLodLevelForDist,
  cityBadgeLodTextureScale,
  CITY_BADGE_LOD_NEAR_DIST,
  CITY_BADGE_LOD_MID_DIST,
} from '../src/render/zoomLod';
export { CityRenderer } from '../src/render/cities';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[city-badge-zoom-lod-test] bundle failed:', e.message || e);
  process.exit(1);
}

// --- Atrapa DOM/kanwy (ten sam wzorzec co city-map-badge-test.cjs) ------------------
function makeStubCtx(canvas) {
  let t = [1, 0, 0, 1, 0, 0];
  return {
    _transform: () => t,
    setTransform(a, b, c, d, e, f) { t = [a, b, c, d, e, f]; },
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, closePath() {}, fill() {}, stroke() {}, clip() {},
    arc() {}, clearRect() {}, fillRect() {}, rect() {}, translate() {}, rotate() {}, scale() {},
    drawImage() { canvas._imageCount++; },
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    measureText: (s) => ({ width: String(s).length * 9 }),
    fillText(s) { canvas._texts.push(String(s)); },
    font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: '', textBaseline: '',
    globalAlpha: 1,
  };
}
function makeStubCanvas() {
  const c = { width: 300, height: 150, _imageCount: 0, _texts: [], _ctx: null, nodeName: 'CANVAS' };
  c.getContext = () => (c._ctx || (c._ctx = makeStubCtx(c)));
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

const M = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(got, want, msg) {
  assert(got === want, `${msg} (got=${JSON.stringify(got)} want=${JSON.stringify(want)})`);
}

console.log('city-badge-zoom-lod-test (BUG-ETYKIETA-MIASTA-ROZMYTA-ZOOM)\n');

// --- 1. PROGI ODLEGŁOŚCI ------------------------------------------------------------
// Progi są na odległości BEZWZGLĘDNEJ (j.św.), nie na znormalizowanym `t` z zoomLod:
// `t` dzieli przez maxDist, a maxDist zależy od rozmiaru mapy (main.ts: max(320, mapSpan*1,2)),
// więc ta sama odległość kamery dawałaby inną ostrość na mapie małej i dużej.
console.log('\n[1] progi LOD z odległości kamery');
eq(M.CITY_BADGE_LOD_MID_DIST, 11, 'próg poziomu 1 = 11 j.św. (od tej odległości nic się nie rozciąga)');
eq(M.CITY_BADGE_LOD_NEAR_DIST, 5.5, 'próg poziomu 2 = 5,5 j.św. (~1,9× rozciągnięcia)');
eq(M.cityBadgeLodLevelForDist(320), 0, 'maksymalne oddalenie → poziom 0 (dzisiejsza rozdzielczość)');
eq(M.cityBadgeLodLevelForDist(20), 0, 'daleko (20 j.św.) → poziom 0');
eq(M.cityBadgeLodLevelForDist(11), 0, 'dokładnie na progu 11 → jeszcze poziom 0');
eq(M.cityBadgeLodLevelForDist(10.99), 1, 'tuż poniżej 11 → poziom 1');
eq(M.cityBadgeLodLevelForDist(5.5), 1, 'dokładnie na progu 5,5 → jeszcze poziom 1');
eq(M.cityBadgeLodLevelForDist(5.49), 2, 'tuż poniżej 5,5 → poziom 2');
eq(M.cityBadgeLodLevelForDist(8 / 3), 2, 'minDist gry (8/3 ≈ 2,67 j.św.) → poziom 2 (najostrzejszy)');
eq(M.cityBadgeLodLevelForDist(NaN), 0, 'niepoprawna odległość → poziom 0, nigdy droższy');
eq(M.cityBadgeLodLevelForDist(Infinity), 0, 'Infinity → poziom 0');
eq(M.cityBadgeLodTextureScale(0), 1, 'poziom 0 → mnożnik 1 (bez zmian względem dziś)');
eq(M.cityBadgeLodTextureScale(1), 2, 'poziom 1 → ×2 pikseli kanwy');
eq(M.cityBadgeLodTextureScale(2), 3, 'poziom 2 → ×3 pikseli kanwy');
eq(M.cityBadgeLodTextureScale(9), 1, 'poziom spoza zakresu → mnożnik 1 (bezpieczny fallback)');

// --- 2. KLUCZ CACHE TEKSTURY --------------------------------------------------------
console.log('\n[2] poziom LOD w kluczu cache tekstury');
const keyOf = (extra) => M.cityMapBadgeKey({
  cityName: 'Ateny', population: 5, defenseTier: 1, civIconId: 'grecy', prodActive: false, ...extra,
});
const keyBrakPola = keyOf({});
const keyLod0 = keyOf({ lodLevel: 0 });
const keyLod1 = keyOf({ lodLevel: 1 });
const keyLod2 = keyOf({ lodLevel: 2 });
eq(keyLod0, keyBrakPola, 'brak pola lodLevel = poziom 0 → DOKŁADNIE dzisiejszy klucz (zero regresji)');
assert(keyBrakPola.includes('Ateny|5|d1|cgrecy|p-|g-|w0'), 'stary prefiks klucza nietknięty');
assert(keyLod0.endsWith('|l0'), 'segment LOD jest OSTATNI (po nim rozpoznaje poziom sprzątanie cache)');
assert(keyLod1.endsWith('|l1'), 'poziom 1 → segment „l1” na końcu klucza');
assert(keyLod2.endsWith('|l2'), 'poziom 2 → segment „l2” na końcu klucza');
assert(keyLod0 !== keyLod1, 'przejście progu 0→1 zmienia klucz (inaczej stara, rozmyta tekstura z cache)');
assert(keyLod1 !== keyLod2, 'przejście progu 1→2 zmienia klucz');
assert(
  keyOf({ lodLevel: 2, population: 6 }) !== keyLod2,
  'LOD nie zjada pozostałych segmentów — populacja dalej rozróżnia klucze',
);

// --- 3. ROZDZIELCZOŚĆ KANWY --------------------------------------------------------
console.log('\n[3] rozdzielczość kanwy: poziom 0 = dziś, wyższe = ostrzej, świat bez zmian');
const paint = (extra) => M.drawCityMapBadgeCanvas({
  cityName: 'Ateny', population: 5, defenseTier: 1, civIconId: 'grecy', ...extra,
});
window.devicePixelRatio = 1;
const cDzis = paint({});                 // stan sprzed zmiany: brak pola w ogóle
const c0 = paint({ lodLevel: 0 });
const c1 = paint({ lodLevel: 1 });
const c2 = paint({ lodLevel: 2 });
eq(c0.width, cDzis.width, 'poziom 0: szerokość kanwy identyczna jak dziś (zero regresji)');
eq(c0.height, cDzis.height, 'poziom 0: wysokość kanwy identyczna jak dziś');
eq(c1.width, c0.width * 2, 'poziom 1: DOKŁADNIE ×2 pikseli w poziomie');
eq(c1.height, c0.height * 2, 'poziom 1: DOKŁADNIE ×2 pikseli w pionie');
eq(c2.width, c0.width * 3, 'poziom 2: DOKŁADNIE ×3 pikseli w poziomie');
eq(c2.height, c0.height * 3, 'poziom 2: DOKŁADNIE ×3 pikseli w pionie');
assert(c2.width > c1.width && c1.width > c0.width, 'bliżej = więcej pikseli, monotonicznie');
// Wielkość plakietki w ŚWIECIE liczy się z ilorazu wymiarów — musi zostać ta sama, inaczej
// „poprawka ostrości” urosłaby na mapie i zasłaniała heksy.
const aspect = (c) => c.width / c.height;
assert(Math.abs(aspect(c1) - aspect(c0)) < 1e-9, 'proporcja kanwy bez zmian na poziomie 1 (świat ten sam)');
assert(Math.abs(aspect(c2) - aspect(c0)) < 1e-9, 'proporcja kanwy bez zmian na poziomie 2');
// Układ pigułki jest w px CSS — rośnie tylko gęstość rasteryzacji, nie geometria i nie font.
assert(
  JSON.stringify(c2._texts) === JSON.stringify(c0._texts),
  'ten sam komplet napisów na obu poziomach (rośnie gęstość, nie treść/układ)',
);
eq(c2._ctx._transform()[0], 3, 'kontekst przeskalowany ×3 — rysowanie dalej w px CSS');

// Sufit ŁĄCZNEGO mnożnika (DPI × LOD): bez niego dpr 3 × LOD ×3 = 9 wypchnęłoby najszerszą
// pigułkę (~427 px CSS) do 3843 px, ponad gwarantowane w WebGL2 MAX_TEXTURE_SIZE = 2048.
window.devicePixelRatio = 2;
const c0dpr2 = paint({ lodLevel: 0 });
const c1dpr2 = paint({ lodLevel: 1 });
const c2dpr2 = paint({ lodLevel: 2 });
eq(c0dpr2.width, c0.width * 2, 'dpr 2, poziom 0: dalej dokładnie dzisiejsze zachowanie (×dpr)');
eq(c1dpr2.width, c0.width * 4, 'dpr 2, poziom 1: 2×2 = ×4');
eq(c2dpr2.width, c0.width * 4, 'dpr 2, poziom 2: 2×3 = 6 przycięte sufitem do ×4');
window.devicePixelRatio = 3;
eq(paint({ lodLevel: 2 }).width, c0.width * 4, 'dpr 3, poziom 2: sufit trzyma ×4, nie ×9');
window.devicePixelRatio = 1;

// --- 4. SPRITE, TEKSTURA I needsUpdate ---------------------------------------------
console.log('\n[4] sprite: nowa tekstura na nowym poziomie, wielkość w świecie bez zmian');
const badge = {
  cityName: 'Ateny', population: 5, defenseTier: 1, civIconId: 'grecy', era: 2, ownerColor: 0xffd54a,
};
const texCache = new Map();
const sprite0 = M.makeCityMapBadgeSprite({ ...badge, lodLevel: 0 }, texCache);
const sprite2 = M.makeCityMapBadgeSprite({ ...badge, lodLevel: 2 }, texCache);
eq(texCache.size, 2, 'dwa poziomy → dwie osobne tekstury w cache (klucz je rozróżnia)');
assert(sprite2.material.map !== sprite0.material.map, 'poziom 2 dostaje INNĄ teksturę niż poziom 0');
assert(
  sprite2.material.map.image.width === sprite0.material.map.image.width * 3,
  'tekstura poziomu 2 ma ×3 pikseli w poziomie',
);
eq(sprite0.scale.y, 0.52, 'wysokość sprite w świecie = worldH 0,52 j.św.');
eq(sprite2.scale.y, 0.52, 'poziom 2 NIE zmienia wysokości plakietki w świecie');
assert(Math.abs(sprite2.scale.x - sprite0.scale.x) < 1e-9, 'szerokość plakietki w świecie też bez zmian');

// needsUpdate przy przemalowaniu: sygnet cywilizacji dociąga się ASYNCHRONICZNIE, już po
// utworzeniu tekstury. Przemalowanie MUSI (a) zostać w rozdzielczości bieżącego poziomu LOD —
// gdyby zgubiło `lodLevel`, kanwa skurczyłaby się z powrotem i plakietka znów byłaby rozmyta —
// oraz (b) podnieść `needsUpdate`, żeby GPU zobaczyło nowe piksele (three.js: version++).
console.log('\n[4b] przemalowanie po dociągnięciu sygnetu trzyma poziom LOD i podnosi needsUpdate');
deferImageLoads = true;
pendingImageLoads = [];
M.setCityMapBadgeCivSigil((civId) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="SIGIL-${civId}"/></svg>`);
const badgeAsync = { ...badge, cityName: 'Sparta' };
const szerokoscPoziom0 = paint({ ...badgeAsync, lodLevel: 0 }).width;
const texCacheAsync = new Map();
const spriteAsync = M.makeCityMapBadgeSprite({ ...badgeAsync, lodLevel: 2 }, texCacheAsync);
const texAsync = spriteAsync.material.map;
const szerokoscPrzed = texAsync.image.width;
// THREE.CanvasTexture podnosi needsUpdate już w konstruktorze (version startuje z 1), więc
// dowodem przemalowania jest PRZYROST version, nie jego wartość bezwzględna.
const wersjaPrzed = texAsync.version;
eq(szerokoscPrzed, szerokoscPoziom0 * 3, 'tekstura przed przemalowaniem: ×3 (poziom 2)');
assert(pendingImageLoads.length > 0, 'sygnet zamówiony i czeka w kolejce (kontrola harnessu)');
pendingImageLoads.forEach((fire) => fire());
assert(texAsync.version > wersjaPrzed, 'po przemalowaniu ustawiono tex.needsUpdate (three.js: version++)');
eq(texAsync.image.width, szerokoscPrzed, 'przemalowanie ZOSTAJE w rozdzielczości poziomu 2 (nie wraca do bazowej)');
eq(texAsync.image.width, szerokoscPoziom0 * 3, 'kanwa po przemalowaniu dalej ×3 względem poziomu 0');
deferImageLoads = false;
pendingImageLoads = [];

// --- 5. PRZEWÓD PRZEZ CityRenderer -------------------------------------------------
console.log('\n[5] CityRenderer: przełączenie poziomu z odległości kamery');
const scene = new M.THREE.Scene();
const renderer = new M.CityRenderer(scene, { hexes: {} });
const miasto = { id: 'c-gracz', ownerId: 0, q: 0, r: 0, name: 'Ateny', population: 5 };
const miastoB = { id: 'c-ai', ownerId: 1, q: 4, r: 0, name: 'Rzym', population: 7 };
const cities = [miasto, miastoB];
const opts = { playerOwnerId: 0, isVisible: () => true, hideStatChips: false };

function badgeTex(cityId) {
  let tex = null;
  scene.traverse((o) => {
    if (o.isSprite && o.userData && o.userData.cityId === cityId && o.material && o.material.map) {
      tex = o.material.map;
    }
  });
  return tex;
}

renderer.sync(cities, opts);
eq(renderer.getBadgeZoomLod(), 0, 'start: poziom 0 (kamera nie zgłosiła jeszcze odległości)');
const texDaleko = badgeTex('c-gracz');
assert(texDaleko !== null, 'plakietka powstała (kontrola harnessu)');
const szerokoscDaleko = texDaleko.image.width;

// Pętla renderu woła to CO KLATKĘ — bez zmiany progu musi być darmowa i nie przemalowywać.
eq(renderer.setBadgeZoomLod(40), false, 'ta sama strefa odległości → false, zero przemalowań');
eq(renderer.setBadgeZoomLod(12), false, 'dalej powyżej progu 11 → false');
assert(badgeTex('c-gracz') === texDaleko, 'bez zmiany poziomu tekstura jest ta sama (brak pracy co klatkę)');

// Gracz przybliża kamerę do maksimum.
eq(renderer.setBadgeZoomLod(8 / 3), true, 'zbliżenie do minDist → zmiana poziomu, wywołujący ma odświeżyć');
eq(renderer.getBadgeZoomLod(), 2, 'poziom 2 po zbliżeniu');
renderer.syncStatChips(cities, opts);
const texBlisko = badgeTex('c-gracz');
assert(texBlisko !== texDaleko, 'po przejściu progu plakietka dostaje NOWĄ teksturę');
eq(texBlisko.image.width, szerokoscDaleko * 3, 'tekstura z bliska ma ×3 pikseli — sedno naprawy');
eq(renderer.setBadgeZoomLod(3), false, 'kolejna klatka w tej samej strefie → już bez pracy');

// Sprzątanie: bez niego każde przybliżenie/oddalenie zostawiałoby w VRAM komplet tekstur
// poprzedniego poziomu NA STAŁE (cache żyje do dispose()), czyli koszt by się kumulował
// zamiast przenosić — a sedno tego podejścia jest takie, że płacą TYLKO bliskie plakietki.
console.log('\n[5b] cache trzyma tylko bieżący poziom (koszt się przenosi, nie kumuluje)');
const kluczeCache = () => [...renderer.statTexCache.keys()];
assert(kluczeCache().length > 0, 'cache niepusty (kontrola harnessu)');
assert(
  kluczeCache().every((k) => k.endsWith('|l2')),
  'po przejściu na poziom 2 w cache zostają WYŁĄCZNIE tekstury poziomu 2',
);
assert(
  [...renderer.statTexCache.values()].includes(texBlisko),
  'tekstura ŻYWEGO sprite NIE została zwolniona przy sprzątaniu',
);
const rozmiarNaPoziomie2 = renderer.statTexCache.size;
eq(renderer.setBadgeZoomLod(40), true, 'oddalenie z powrotem → zmiana poziomu');
renderer.syncStatChips(cities, opts);
assert(
  kluczeCache().every((k) => k.endsWith('|l0')),
  'po powrocie na poziom 0 w cache zostają WYŁĄCZNIE tekstury poziomu 0',
);
eq(renderer.statTexCache.size, rozmiarNaPoziomie2, 'liczba tekstur w cache stała — koszt przeniesiony, nie skumulowany');
eq(badgeTex('c-gracz').image.width, szerokoscDaleko, 'z powrotem daleko → z powrotem dzisiejsza rozdzielczość');
assert(
  [...renderer.statTexCache.values()].includes(badgeTex('c-ai')),
  'plakietka drugiego miasta też przeżyła sprzątanie (nie tylko pierwsza z listy)',
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
