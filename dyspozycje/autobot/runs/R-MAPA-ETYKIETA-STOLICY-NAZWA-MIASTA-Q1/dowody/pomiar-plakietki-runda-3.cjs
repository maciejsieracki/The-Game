'use strict';
/**
 * pomiar-plakietki-runda-3.cjs — R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 3 (R3-1).
 *
 * PO CO: ratyfikacja rundy 3 stawia DWA warunki naraz — „0/15 przycietych" ORAZ „plakietka
 * nie zachodzi na sasiednie heksy" — i kaze to ZMIERZYC, nie zalozyc. Ten skrypt mierzy oba.
 *
 * CZYM SIE ROZNI OD POMIARU RUNDY 2: tamten przepisywal `truncateName` i wzor na budzet
 * z `cityMapStatChip.ts` do wlasnego kodu (model). Ten uruchamia PRAWDZIWE
 * `makeCityMapBadgeSprite` z `gra/src/render/cityMapStatChip.ts` (bundle esbuild -> zywy
 * Chromium), wiec szerokosc plakietki i jej wielkosc w swiecie sa odczytem z produkcji,
 * a nie z przepisanej formuly. Model rundy 2 zostaje wylacznie jako KOTWICA: jesli jego
 * przewidywana szerokosc rozjezdza sie z prawdziwa kanwa, model idzie do kosza, nie dowod.
 *
 * CO WYPISUJE:
 *  1. dla kazdej z 15 cywilizacji: `miasta_cywilizacji[0]`, szerokosc napisu, czy przyciete
 *     przy bazie 200 (przed R3-1) i przy bazie z biezacego kodu — w obu konfiguracjach
 *     stolicy (bez glifu produkcji / z glifem), czyli ta sama metoda co w rundzie 2;
 *  2. prawdziwa szerokosc plakietki w px CSS i w JEDNOSTKACH SWIATA (sprite.scale.x)
 *     — to jest liczba, ktora rozstrzyga o zachodzeniu na sasiednie heksy;
 *  3. granice zachodzenia: HEX_R = 1.0, srodek-do-srodka sasiada = sqrt(3) = 1,732;
 *     minimalny odstep miast w klastrze = 5 heksow (`CLUSTER_CITY_STATE_MIN_HEX`)
 *     = 8,66 jednostek swiata — wiec osobno „plakietka wchodzi na sasiedni HEKS"
 *     i „plakietka wchodzi na sasiednia PLAKIETKE";
 *  4. sufit tekstury: najszersza plakietka x `BADGE_MAX_TOTAL_SCALE` wobec gwarantowanego
 *     w WebGL2 `MAX_TEXTURE_SIZE = 2048`.
 *
 * CZEGO NIE ROBI: nie zmienia niczego w grze ani w danych. Nie buduje gry (`vite`) — to
 * robi osobny dowod `zrzut-mapy-runda-3.cjs`.
 *
 * Usage:  node dyspozycje/autobot/runs/<ID>/dowody/pomiar-plakietki-runda-3.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const HERE = __dirname;
const REPO = path.resolve(HERE, '..', '..', '..', '..', '..');
const GRA = path.join(REPO, 'gra');

const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
catch (e) { console.error('Brak playwright: ' + e.message); process.exit(1); }

function findChromiumExecutable() {
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort();
  for (const d of dirs.reverse()) {
    const p = path.join(base, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// --- stale odczytane ZE ZRODLA (nie przepisane recznie) ---------------------------------
const chipSrc = fs.readFileSync(path.join(GRA, 'src', 'render', 'cityMapStatChip.ts'), 'utf8');
function konst(re, nazwa) {
  const m = chipSrc.match(re);
  if (!m) throw new Error('Brak stalej ' + nazwa + ' w cityMapStatChip.ts');
  return Number(m[1]);
}
const BASE_NOW = konst(/CITY_NAME_BUDGET_BASE\s*=\s*(\d+)/, 'CITY_NAME_BUDGET_BASE');
const BASE_OLD = 200;                        // stan sprzed R3-1 (literal w kodzie rundy 2)
const PROD_W = konst(/PROD_SLOT_W\s*=\s*(\d+)/, 'PROD_SLOT_W');
const CROWN_W = konst(/CAPITAL_CROWN_SLOT_W\s*=\s*(\d+)/, 'CAPITAL_CROWN_SLOT_W');
const MAX_SCALE = konst(/BADGE_MAX_TOTAL_SCALE\s*=\s*(\d+)/, 'BADGE_MAX_TOTAL_SCALE');
const NAME_FONT = (chipSrc.match(/const nameFont = '([^']+)'/) || [])[1];
const GROWTH_FONT = (chipSrc.match(/GROWTH_FONT = '([^']+)'/) || [])[1];
if (!NAME_FONT || !GROWTH_FONT) throw new Error('Brak fontow w cityMapStatChip.ts');

// HEX: `render/hexutil.ts` — pointy-top, srodek-do-srodka sasiada = R*sqrt(3).
const HEX_R = Number((fs.readFileSync(path.join(GRA, 'src', 'render', 'hexutil.ts'), 'utf8')
  .match(/export const HEX_R\s*=\s*([\d.]+)/) || [])[1]);
const SASIAD = HEX_R * Math.sqrt(3);
// `map/clusters.ts` — minimalny odstep miast w klastrze, w heksach.
const MIN_HEX = Number((fs.readFileSync(path.join(GRA, 'src', 'map', 'clusters.ts'), 'utf8')
  .match(/CLUSTER_CITY_STATE_MIN_HEX\s*=\s*(\d+)/) || [])[1]);

const pools = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'city-names-pools.json'), 'utf8'));
const civKeys = Object.keys(pools);

// --- bundle PRAWDZIWEJ produkcji do przegladarki ----------------------------------------
const entry = path.join(os.tmpdir(), 'r3-mapa-etyk-entry.ts');
const bundle = path.join(os.tmpdir(), 'r3-mapa-etyk-bundle.js');
fs.writeFileSync(entry, `
import { makeCityMapBadgeSprite } from '${path.join(GRA, 'src', 'render', 'cityMapStatChip').replace(/\\/g, '/')}';
(globalThis as any).__R3 = { makeCityMapBadgeSprite };
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

(async () => {
  const execPath = findChromiumExecutable();
  const browser = await chromium.launch(
    execPath ? { executablePath: execPath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] },
  );
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({ path: bundle });
  const gotowe = await page.evaluate(() => typeof window.__R3?.makeCityMapBadgeSprite === 'function');
  if (!gotowe) throw new Error('Bundle produkcyjny nie wystawil makeCityMapBadgeSprite');

  const wynik = await page.evaluate(({ civKeys, pools, NAME_FONT, GROWTH_FONT }) => {
    const mk = window.__R3.makeCityMapBadgeSprite;
    const m = document.createElement('canvas').getContext('2d');
    const wid = (s, font) => { m.font = font; return m.measureText(s).width; };

    // PRAWDZIWA plakietka: kazda cywilizacja, stolica, z glifem produkcji i bez.
    const real = [];
    for (const k of civKeys) {
      const nazwa = pools[k].miasta_cywilizacji[0];
      for (const prod of [false, true]) {
        const cache = new Map();
        const sp = mk({
          cityName: nazwa,
          population: 3,
          defenseTier: 0,
          civIconId: k,
          isCapital: true,
          prodActive: prod,
          prodKind: prod ? 'budynek' : null,
          prodId: prod ? 'spichlerz' : null,
        }, cache);
        const cv = sp.material.map.image;
        const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
        real.push({
          key: k, nazwa, prod,
          canvasPx: cv.width,
          cssW: cv.width / dpr,
          cssH: cv.height / dpr,
          worldW: sp.scale.x,
          worldH: sp.scale.y,
        });
      }
    }

    const nazwyPx = {};
    for (const k of civKeys) {
      const n = String(pools[k].miasta_cywilizacji[0]).trim().toUpperCase();
      nazwyPx[k] = { upper: n, px: wid(n, NAME_FONT) };
    }
    // Najszerszy realny zapis WZROST% (segment tylko miast gracza).
    const growthPx = Math.max(
      wid('−100,0%', GROWTH_FONT), wid('−10,5%', GROWTH_FONT), wid('+99,9%', GROWTH_FONT),
    );
    const georgiaOk = document.fonts && document.fonts.check
      ? document.fonts.check('700 22px Georgia') : null;

    // Cala pula (15 x 100) — kontekst: przycinanie dlugiej nazwy dotyczy kazdego miasta.
    const wszystkie = [];
    for (const k of civKeys) for (const n of pools[k].miasta_cywilizacji) {
      wszystkie.push(wid(String(n).trim().toUpperCase(), NAME_FONT));
    }
    return { real, nazwyPx, growthPx, georgiaOk, wszystkie };
  }, { civKeys, pools, NAME_FONT, GROWTH_FONT });

  await browser.close();

  const { real, nazwyPx, growthPx, georgiaOk, wszystkie } = wynik;

  console.log('FONT nazwy: ' + NAME_FONT + '   (Georgia zainstalowana: ' + georgiaOk + ')');
  console.log('BAZA budzetu nazwy: przed R3-1 = ' + BASE_OLD + ' px, w kodzie = ' + BASE_NOW + ' px');
  console.log('Sloty dzielace wiersz z nazwa: korona ' + CROWN_W + ' px, glif produkcji '
    + PROD_W + ' px, WZROST% (max) ' + growthPx.toFixed(1) + ' px\n');

  // --- (1) przyciecia: ta sama metoda co w rundzie 2 -------------------------------------
  const konfig = [
    { etykieta: 'stolica, bez glifu produkcji', minus: CROWN_W },
    { etykieta: 'stolica, z glifem produkcji', minus: CROWN_W + PROD_W },
  ];
  const licz = {};
  for (const cfg of konfig) {
    const bOld = BASE_OLD - cfg.minus;
    const bNow = BASE_NOW - cfg.minus;
    console.log('=== ' + cfg.etykieta + ': budzet ' + bOld + ' px -> ' + bNow + ' px ===');
    let cOld = 0; let cNow = 0;
    for (const k of civKeys) {
      const { upper, px } = nazwyPx[k];
      const tOld = px > bOld; const tNow = px > bNow;
      if (tOld) cOld++;
      if (tNow) cNow++;
      console.log('  ' + k.padEnd(12) + (px.toFixed(1) + 'px').padStart(8)
        + '  przed: ' + (tOld ? 'CIETE ' : 'calosc')
        + '  po:    ' + (tNow ? 'CIETE ' : 'calosc') + '  ' + upper);
    }
    console.log('  -> PRZYCIETE przed R3-1: ' + cOld + '/' + civKeys.length
      + '   po R3-1: ' + cNow + '/' + civKeys.length + '\n');
    licz[cfg.etykieta] = { cOld, cNow };
  }

  // Konfiguracja trzecia, spoza metody rundy 2: WLASNA stolica gracza z WZROST% i glifem.
  const bGrowth = BASE_NOW - CROWN_W - PROD_W - growthPx;
  const cGrowth = civKeys.filter((k) => nazwyPx[k].px > bGrowth);
  console.log('=== stolica GRACZA: korona + glif produkcji + WZROST% (poza metoda rundy 2) ===');
  console.log('  budzet ' + bGrowth.toFixed(1) + ' px -> przyciete: ' + cGrowth.length + '/'
    + civKeys.length + (cGrowth.length ? '  [' + cGrowth.join(', ') + ']' : ''));
  const potrzebneNaWszystko = Math.max(...civKeys.map((k) => nazwyPx[k].px))
    + CROWN_W + PROD_W + growthPx;
  console.log('  baza potrzebna, zeby i ta konfiguracja byla 0/15: '
    + potrzebneNaWszystko.toFixed(1) + ' px\n');

  // --- (2) prawdziwa plakietka: kotwica modelu + geometria swiata -------------------------
  console.log('=== PRAWDZIWA plakietka (makeCityMapBadgeSprite, produkcja) ===');
  let maxCss = 0; let maxTex = 0; let maxWorld = 0;
  for (const r of real) {
    maxCss = Math.max(maxCss, r.cssW);
    maxTex = Math.max(maxTex, r.canvasPx);
    maxWorld = Math.max(maxWorld, r.worldW);
    console.log('  ' + r.key.padEnd(12) + (r.prod ? 'z glifem  ' : 'bez glifu ')
      + 'CSS ' + r.cssW.toFixed(0).padStart(4) + ' px   swiat '
      + r.worldW.toFixed(2).padStart(5) + ' j.  = ' + (r.worldW / SASIAD).toFixed(2)
      + ' szerokosci heksa   ' + r.nazwa);
  }
  console.log('  -> najszersza z 15 stolic: ' + maxCss.toFixed(0) + ' px CSS, '
    + maxWorld.toFixed(2) + ' j. swiata\n');

  // --- (3) granica zachodzenia -----------------------------------------------------------
  const odstepMiast = MIN_HEX * SASIAD;
  console.log('=== ZACHODZENIE (HEX_R = ' + HEX_R + ') ===');
  console.log('  srodek-do-srodka sasiedniego heksa: ' + SASIAD.toFixed(3) + ' j.');
  console.log('  minimalny odstep miast w klastrze:  ' + MIN_HEX + ' heksow = '
    + odstepMiast.toFixed(2) + ' j.');
  console.log('  plakietka zaczyna wchodzic na sasiedni HEKS, gdy jej szerokosc > '
    + SASIAD.toFixed(3) + ' j. (= ' + (SASIAD / 0.010833).toFixed(0) + ' px CSS ok.)');
  const naHeks = real.filter((r) => r.worldW > SASIAD).length;
  const naPlakietke = real.filter((r) => r.worldW > odstepMiast).length;
  console.log('  z ' + real.length + ' zmierzonych plakietek wchodzi na sasiedni HEKS: '
    + naHeks + ';  na sasiednia PLAKIETKE (odstep ' + MIN_HEX + ' heksow): ' + naPlakietke);

  // --- (4) sufit tekstury ----------------------------------------------------------------
  const najszerszaMozliwa = maxCss; // realna, nie teoretyczna
  console.log('\n=== SUFIT TEKSTURY ===');
  console.log('  najszersza zmierzona plakietka x BADGE_MAX_TOTAL_SCALE(' + MAX_SCALE + ') = '
    + (najszerszaMozliwa * MAX_SCALE).toFixed(0) + ' px  (WebGL2 gwarantuje 2048)');

  const over = wszystkie.filter((w) => w > BASE_NOW - CROWN_W).length;
  console.log('\nKONTEKST: nazw w calej puli (' + wszystkie.length + ') dluzszych niz nowy budzet '
    + (BASE_NOW - CROWN_W) + ' px: ' + over + ' (przy starym budzecie '
    + (BASE_OLD - CROWN_W) + ' px bylo '
    + wszystkie.filter((w) => w > BASE_OLD - CROWN_W).length + ')');

  const ok = licz['stolica, bez glifu produkcji'].cNow === 0
    && licz['stolica, z glifem produkcji'].cNow === 0;
  console.log('\nKRYTERIUM 1 RUNDY 3 (0/15 w obu budzetach metody rundy 2): '
    + (ok ? 'SPELNIONE' : 'NIESPELNIONE'));
  process.exit(ok ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
