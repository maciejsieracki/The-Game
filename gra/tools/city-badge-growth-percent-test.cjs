'use strict';
/**
 * city-badge-growth-percent-test.cjs — R-ETYKIETA-MIASTA-WZROST-PROCENT
 * Run: cd gra && node tools/city-badge-growth-percent-test.cjs
 *
 * Pilnuje segmentu WZROST% na plakietce miasta (dawne „W5”), w trzech warstwach:
 *   1. FORMAT etykiety — `formatCityGrowthPercentLabel` (zero / dodatni / ułamkowy / ujemny / głód);
 *   2. KLUCZ CACHE tekstury — bez procentu w kluczu zmiana wartości trafiałaby w starą teksturę;
 *   3. PRZEWÓD ŻYWEJ WARTOŚCI — `CityRenderer` pyta `options.getCityGrowth` przy KAŻDYM
 *      odświeżeniu plakietki, więc zmiana racji w trakcie tury natychmiast zmienia napis
 *      (a nie zostaje przy migawce z końca poprzedniej tury).
 *
 * Warstwa 4 (dlaczego to musi być SUMA sześciu składników, a nie sam składnik racji) pilnuje
 * regresji wycofanej pierwszej próby naprawy — patrz sekcja „sześć składników” niżej.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.city-badge-growth-percent-entry.ts');
const BUNDLE = path.join(__dirname, '.city-badge-growth-percent-bundle.cjs');

fs.writeFileSync(ENTRY, `
import * as THREE from 'three';
export { THREE };
export {
  formatCityGrowthPercentLabel,
  cityMapBadgeKey,
  drawCityMapBadgeCanvas,
} from '../src/render/cityMapStatChip';
export { CityRenderer } from '../src/render/cities';
export {
  computeGrowthPercentV85,
  buildRationParams,
  rationGrowthPercent,
} from '../src/game/population-growth-v85';
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
  console.error('[city-badge-growth-percent-test] bundle failed:', e.message || e);
  process.exit(1);
}

// --- Atrapa DOM/kanwy (ten sam wzorzec co city-map-badge-test.cjs) ----------------
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
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData() {},
    measureText: (s) => ({ width: String(s).length * 9 }),
    fillText(s) { canvas._texts.push(String(s)); },
    font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: '', textBaseline: '',
    globalAlpha: 1, globalCompositeOperation: 'source-over', shadowBlur: 0, shadowColor: '',
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
global.Image = class { constructor() { this.width = 64; this.height = 64; } set src(_v) { if (this.onload) this.onload(); } };
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

console.log('city-badge-growth-percent-test (R-ETYKIETA-MIASTA-WZROST-PROCENT)\n');

// Znak minus na plakietce to U+2212 (MINUS SIGN), nie dywiz — ten sam znak, co w komunikatach
// gry („−5 Zauf./para”, „−4 🍞/t”). Zapisany kodem, żeby test nie zależał od tego, co przeżyje
// kopiowanie pliku między edytorami.
const MINUS = '−';
const EM_DASH = '—';

// --- 1. FORMAT ETYKIETY -----------------------------------------------------------
console.log('\n[1] format etykiety WZROST%');
eq(M.formatCityGrowthPercentLabel(0), '0%', 'wzrost zerowy → „0%” (nie puste, nie „—”)');
eq(M.formatCityGrowthPercentLabel(5), '5%', 'wzrost całkowity → „5%” bez zbędnego „,0”');
eq(M.formatCityGrowthPercentLabel(5.5), '5,5%', 'wzrost ułamkowy → „5,5%” z przecinkiem (zapis polski)');
eq(M.formatCityGrowthPercentLabel(12.5), '12,5%', 'dwucyfrowy ułamkowy → „12,5%”');
eq(M.formatCityGrowthPercentLabel(-2.1), `${MINUS}2,1%`, 'wzrost ujemny → znak minus, wartość NIE ukryta');
eq(M.formatCityGrowthPercentLabel(-10), `${MINUS}10%`, 'głęboko ujemny całkowity → „−10%”');
eq(M.formatCityGrowthPercentLabel(-0.02), '0%', 'wartość zaokrąglona do zera → „0%”, nigdy „−0%”');
eq(M.formatCityGrowthPercentLabel(5.54), '5,5%', 'zaokrąglenie do 1 miejsca po przecinku');
eq(M.formatCityGrowthPercentLabel(5.5, true), EM_DASH, 'głód → „—”, jak wiersz WZROST% w panelu miasta');
eq(M.formatCityGrowthPercentLabel(0, true), EM_DASH, 'głód wygrywa nad wartością 0');
assert(
  !M.formatCityGrowthPercentLabel(5).includes('W'),
  'etykieta NIE zawiera już litery „W” (prośba właściciela: „a nie W5 bez litery W”)',
);

// --- 2. KLUCZ CACHE TEKSTURY ------------------------------------------------------
console.log('\n[2] klucz cache tekstury zawiera WZROST%');
const keyOf = (extra) => M.cityMapBadgeKey({
  cityName: 'Ateny', population: 5, defenseTier: 1, civIconId: 'grecy', prodActive: false, ...extra,
});
const keyBrak = keyOf({});
const key5 = keyOf({ growthPercent: 5 });
const key55 = keyOf({ growthPercent: 5.5 });
const key55Glod = keyOf({ growthPercent: 5.5, growthStarving: true });
const keyUjemny = keyOf({ growthPercent: -2.1 });
assert(keyBrak.includes('|g-|'), 'brak WZROST% (miasto nie gracza) → segment „g-” jak dotąd');
assert(key55.includes('g5,5%'), 'klucz zawiera GOTOWĄ etykietę „5,5%”, nie surową liczbę');
assert(key5 !== key55, '5% vs 5,5% → różne klucze (inaczej stara tekstura z cache)');
assert(key55 !== key55Glod, 'ta sama wartość, ale głód → inny klucz (napis „—” musi się przerysować)');
assert(keyUjemny !== key5, 'wzrost ujemny → własny klucz');
assert(keyBrak !== key5, 'pojawienie się segmentu WZROST% zmienia klucz');

// --- 3. NAPIS NA KANWIE PLAKIETKI -------------------------------------------------
console.log('\n[3] napis faktycznie narysowany na kanwie');
const paint = (extra) => M.drawCityMapBadgeCanvas({
  cityName: 'Ateny', population: 5, defenseTier: 1, civIconId: 'grecy', ...extra,
})._texts;
const textsBrak = paint({});
const texts55 = paint({ growthPercent: 5.5 });
const textsUjemny = paint({ growthPercent: -2.1 });
const textsGlod = paint({ growthPercent: 5.5, growthStarving: true });
assert(texts55.includes('5,5%'), 'plakietka rysuje „5,5%”');
assert(!texts55.some((t) => /^W\d/.test(t)), 'plakietka NIE rysuje już skrótu „W<poziom>”');
assert(textsUjemny.includes(`${MINUS}2,1%`), 'plakietka rysuje wzrost ujemny ze znakiem minus');
assert(textsGlod.includes(EM_DASH), 'plakietka przy głodzie rysuje „—”');
assert(!textsBrak.some((t) => t.includes('%')), 'bez WZROST% (miasto obce) — żadnego procentu na plakietce');

// --- 4. SZEŚĆ SKŁADNIKÓW, NIE JEDEN (regresja wycofanej pierwszej próby) ----------
// Pierwsza próba naprawy (wycofana 2026-08-08) wpisała na plakietkę sam składnik racji
// `rationGrowthPercent(poziomRacji)` — 1 z 6 składników `computeGrowthPercentV85`. Panel miasta
// pokazuje SUMĘ. Ten blok pilnuje, że dla realnego stanu miasta obie liczby się różnią, więc
// podpięcie samych racji byłoby widoczną rozbieżnością mapa↔panel, a nie niuansem.
console.log('\n[4] WZROST% to suma sześciu składników, nie sam składnik racji');
const society = require('../data/society-params.json');
const rationParams = M.buildRationParams(society, 'normal');
const spichlerzOff = { ceramikaActive: false, solActive: false, maSpichlerzPop: false, maSpichlerzIIPop: false };
const stanMiasta = {
  population: 4,          // małe miasto → składnik „małe miasto” = 6 − 4 = 2 pkt %
  poziomRacji: 5,         // składnik racji = 5,5 pkt %
  zdrowie: 30,            // składnik zdrowia = floor(30/10) = 3 pkt %
  szczescieNetto: 20,     // składnik szczęścia = floor(20/10) = 2 pkt %
  wealthPoziom: 1,
  spichlerzState: spichlerzOff,
  civKey: null,
  rationParams,
};
const bd = M.computeGrowthPercentV85(stanMiasta);
const sameRacje = M.rationGrowthPercent(stanMiasta.poziomRacji, rationParams);
eq(bd.racje, sameRacje, 'składnik racji odczytany bez zmian (kontrola spójności testu)');
assert(bd.total !== bd.racje, `suma (${bd.total}%) różni się od samego składnika racji (${bd.racje}%)`);
assert(
  M.formatCityGrowthPercentLabel(bd.total) !== M.formatCityGrowthPercentLabel(bd.racje),
  'etykieta z SUMY różni się od etykiety z samych racji — podpięcie racji = widoczny rozjazd z panelem',
);
eq(M.formatCityGrowthPercentLabel(bd.total), '12,5%', 'suma 5,5+2+0+3+2+0 → etykieta „12,5%”');

// --- 5. PRZEWÓD ŻYWEJ WARTOŚCI PRZEZ CityRenderer ---------------------------------
console.log('\n[5] CityRenderer pyta o WZROST% na żywo (nie migawka z końca tury)');
const scene = new M.THREE.Scene();
const renderer = new M.CityRenderer(scene, { hexes: {} });
const miastoGracza = { id: 'c-gracz', ownerId: 0, q: 0, r: 0, name: 'Ateny', population: 4 };
const miastoAI = { id: 'c-ai', ownerId: 1, q: 3, r: 0, name: 'Rzym', population: 6 };
const cities = [miastoGracza, miastoAI];

/** Stan „silnika” — to, co zwróciłby cityGrowthLive(city, map) w danej chwili. */
let growthNow = { procentNaTure: 5.5, nakarmione: true };
const zapytaneOId = [];
const opts = {
  playerOwnerId: 0,
  isVisible: () => true,
  hideStatChips: false,
  getCityGrowth: (city) => {
    zapytaneOId.push(city.id);
    return growthNow;
  },
};

function badgeTexts(cityId) {
  let texts = null;
  scene.traverse((o) => {
    if (o.isSprite && o.userData && o.userData.cityId === cityId && o.material && o.material.map) {
      texts = o.material.map.image._texts;
    }
  });
  return texts;
}

renderer.sync(cities, opts);
assert(zapytaneOId.includes('c-gracz'), 'renderer pyta o WZROST% miasta gracza');
assert(!zapytaneOId.includes('c-ai'), 'renderer NIE pyta o miasta obce (segment tylko dla gracza, jak dotąd)');
const tekstyGracza = badgeTexts('c-gracz');
assert(tekstyGracza !== null, 'plakietka miasta gracza powstała');
assert(tekstyGracza.includes('5,5%'), 'plakietka gracza pokazuje 5,5% z żywego odczytu');
const tekstyAI = badgeTexts('c-ai');
assert(tekstyAI !== null && !tekstyAI.some((t) => t.includes('%')), 'plakietka obcego miasta bez segmentu WZROST%');

// Gracz rusza suwak Wyżywienia W TRAKCIE tury: silnik zwraca już nową wartość.
// Plakietka MUSI pokazać nową liczbę — to jest cały sens tego zgłoszenia. Gdyby wartość szła
// z migawki `getLastEmpireFoodTick` (aktualizowanej tylko w `advanceEmpireFood`, na końcu tury),
// napis zostałby przy 5,5% aż do końca tury.
const pytanPrzed = zapytaneOId.length;
growthNow = { procentNaTure: 7, nakarmione: true };
renderer.syncStatChips(cities, opts);
assert(zapytaneOId.length > pytanPrzed, 'każde odświeżenie plakietki pyta silnik od nowa (brak zamrożonej wartości)');
const tekstyPoZmianie = badgeTexts('c-gracz');
assert(tekstyPoZmianie.includes('7%'), 'po zmianie racji plakietka pokazuje NOWĄ wartość (7%)');
assert(!tekstyPoZmianie.includes('5,5%'), 'stara tekstura z cache NIE jest reużyta (brak 5,5% na nowej plakietce)');

// Ten sam przewód dla wzrostu ujemnego (Wyżywienie poniżej 1,5 — miasto się kurczy).
growthNow = { procentNaTure: -2.1, nakarmione: true };
renderer.syncStatChips(cities, opts);
assert(badgeTexts('c-gracz').includes(`${MINUS}2,1%`), 'wzrost ujemny dociera na plakietkę ze znakiem minus');

// Głód: centrala żywności nie nakarmiła miasta — panel pokazuje „—”, plakietka tak samo.
growthNow = { procentNaTure: 4.5, nakarmione: false };
renderer.syncStatChips(cities, opts);
const tekstyGlod = badgeTexts('c-gracz');
assert(tekstyGlod.includes(EM_DASH), 'głód → plakietka pokazuje „—” zamiast liczby (parytet z panelem)');
assert(!tekstyGlod.includes('4,5%'), 'przy głodzie plakietka NIE obiecuje wzrostu');

// Brak przewodu (stary kod / harness bez callbacku) — segment po prostu znika, nic nie wybucha.
const rendererBezHooka = new M.CityRenderer(new M.THREE.Scene(), { hexes: {} });
rendererBezHooka.sync(cities, { playerOwnerId: 0, isVisible: () => true, hideStatChips: false });
assert(true, 'sync bez getCityGrowth nie rzuca wyjątkiem (opcjonalny callback)');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
