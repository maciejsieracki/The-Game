'use strict';
/**
 * zrzut-dowodow.cjs — POWTARZALNA procedura zrzutów dowodowych tematu
 * P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1 (panel miasta + HUD mapy świata).
 *
 * PO CO ISTNIEJE (zarzuty 1, 2 i 8 Evaluatora, runda 1):
 * w rundzie 1 zrzuty robił skrypt jednorazowy, trzymany poza repo. Skutek:
 *   • `po-hud-mapy-*` powstały po `keyboard.press('Escape')` w sandboxie
 *     `?playtest=miasto` — Escape NIE wraca do mapy z HUD-em, więc pliki
 *     złapały ekran bez HUD-u i nikt tego nie zauważył (0 px koloru surowca);
 *   • `mutacja-panel-miasta-*` wyszły bajtowo identyczne z `po-panel-miasta-*`
 *     (0 px koloru mutacji) i też przeszły bez alarmu.
 * Oba defekty łączy jedna przyczyna: zrzut, którego nikt nie weryfikował
 * i którego nie dało się powtórzyć. Ten skrypt naprawia obie rzeczy naraz —
 * jest wersjonowany razem z raportem i SAM SIĘ SPRAWDZA: po każdym zapisie
 * PNG liczy piksele wymaganych kolorów w zapisanym pliku i przy zerze
 * przerywa z kodem 1. Pusty albo nieaktualny zrzut nie ma jak przejść.
 *
 * ŹRÓDŁA SCEN (dwa NIEZALEŻNE wczytania strony, nie jedno z Escape):
 *   • panel miasta — `index.html?playtest=miasto`, czekanie na 6 chipów W3;
 *   • HUD mapy świata — `index.html?playtest=mapa`, czekanie na chipy `.civ-hud`.
 *
 * DRUGA PUŁAPKA, ZŁAPANA PRZY NAPRAWIE: `.civ-hud` istnieje w DOM (z prawidłowymi
 * klasami i `getComputedStyle` = kolor palety) na długo zanim gracz go widzi —
 * generacja świata trzyma na wierzchu `.civ-map-load-overlay` (`z-index:3000000`,
 * tło `rgba(8,12,18,.92)`). Zrzut zrobiony po samym `waitForSelector('.civ-hud')`
 * pokazuje CIEMNY PROSTOKĄT zamiast chipów — pomiar w DOM świeci na zielono,
 * a obraz jest pusty. Dlatego czekamy na ZNIKNIĘCIE overlaya, a nie na DOM HUD-u.
 *
 * TRZECIA PUŁAPKA: WYBÓR SUROWCA DO MUTACJI. W scenie `?playtest=miasto` przy
 * 1920×1080 chip **Pracy** (skrajnie lewy) jest ZASŁONIĘTY panelem produkcji, a chipy
 * Kultury i Religii panelem prawym — `getComputedStyle` pokazuje na nich kolor mutacji,
 * ale na ekranie ich nie ma. Runda 1 mutowała właśnie Pracę i dlatego zrzut mutacji
 * panelu miasta wyszedł identyczny ze zrzutem PO. Mutuj surowiec widoczny na OBU
 * ekranach — Żywność albo Skarbiec (sprawdzone: nie zasłonięte).
 *
 * Usage:
 *   node zrzut-dowodow.cjs --dist <katalog build> --shots <katalog> --prefix przed|po|mutacja
 * Build robi się osobno, komendą dozwoloną przez C-001 (z `gra/`):
 *   node ./node_modules/vite/bin/vite.js build --outDir <POZA repo, unikalny sufiks> --emptyOutDir
 */
const path = require('path');
const fs = require('fs');

const REPO = path.resolve(__dirname, '..', '..', '..', '..');
const GRA = path.join(REPO, 'gra');
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const { PNG } = require(path.join(GRA, 'node_modules', 'pngjs'));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const DIST = arg('dist');
const SHOTS = arg('shots');
const PREFIX = arg('prefix');
if (!DIST || !SHOTS || !['przed', 'po', 'mutacja'].includes(PREFIX)) {
  console.error('Usage: node zrzut-dowodow.cjs --dist <dir> --shots <dir> --prefix przed|po|mutacja');
  process.exit(2);
}
fs.mkdirSync(SHOTS, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Dokładne (bez tolerancji) zliczenie pikseli danego #rrggbb w zapisanym PNG. */
function countHex(file, hex) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i] === r && png.data[i + 1] === g && png.data[i + 2] === b && png.data[i + 3] === 255) n++;
  }
  return n;
}
function uniqueColors(file) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const set = new Set();
  for (let i = 0; i < png.data.length; i += 4) {
    set.add((png.data[i] << 16) | (png.data[i + 1] << 8) | png.data[i + 2]);
    if (set.size > 4096) break;
  }
  return set.size;
}

const GOLD = '#e8d88a';
const SCI = '#5a9bd4';
const MUT = '#ff3fb0'; // kolor mutacji Pracy (kryterium końca 5)

let fail = 0;
const seen = {}; // nazwa zrzutu → { hex: liczba pikseli }

/** Zrzut + natychmiastowy pomiar zawartości ZAPISANEGO pliku (nie DOM-u). */
async function shot(target, name, measure) {
  const file = path.join(SHOTS, `${PREFIX}-${name}.png`);
  await target.screenshot({ path: file });
  const counts = {};
  for (const h of measure) counts[h] = countHex(file, h);
  const uniq = uniqueColors(file);
  seen[name] = counts;
  if (uniq < 20) { fail++; console.log(`FAIL ${path.basename(file)} — zrzut praktycznie pusty (${uniq} kolorów)`); return; }
  console.log(`     ${path.basename(file)} · ${uniq} kolorów · `
    + measure.map((h) => `${h}=${counts[h]}`).join(' '));
}

/** Kryterium końca: co MUSI być widoczne na obrazie. Zero → exit 1. */
function need(label, cond, detail) {
  if (cond) { console.log('OK   ' + label + (detail ? ' · ' + detail : '')); }
  else { fail++; console.log('FAIL ' + label + (detail ? ' · ' + detail : '')); }
}

/** Czeka, aż zniknie nakładka generacji świata — inaczej zrzut łapie ciemny ekran. */
async function waitScene(page) {
  await page.waitForSelector('.civ-hud', { timeout: 240000 });
  await page.waitForFunction(() => {
    const o = document.querySelector('.civ-map-load-overlay');
    return !o || getComputedStyle(o).display === 'none' || o.getBoundingClientRect().width === 0;
  }, null, { timeout: 300000 });
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--use-gl=angle', '--enable-webgl', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const base = 'file://' + path.join(DIST, 'index.html');
  const MEAS = [GOLD, SCI, MUT, '#e8b84a', '#7cb4e4'];

  // ---- Scena 1: panel miasta -------------------------------------------------
  const city = await ctx.newPage();
  city.on('pageerror', (e) => console.log('[pageerror/miasto]', String(e).slice(0, 160)));
  await city.goto(base + '?playtest=miasto', { waitUntil: 'load', timeout: 180000 });
  await waitScene(city);
  await city.waitForFunction(() => document.querySelectorAll('.civ-v-w3-chip').length >= 6, null, { timeout: 300000 });
  await wait(4000);
  await shot(city, 'panel-miasta-pelny', MEAS);
  await shot(city.locator('.civ-v-w3-chips-left').first(), 'panel-miasta-chipy-lewe', MEAS);
  await shot(city.locator('.civ-v-w3-chips-right').first(), 'panel-miasta-chipy-prawe', MEAS);
  await city.close();

  // ---- Scena 2: HUD mapy świata (OSOBNE wczytanie, nie Escape) ---------------
  const map = await ctx.newPage();
  map.on('pageerror', (e) => console.log('[pageerror/mapa]', String(e).slice(0, 160)));
  await map.goto(base + '?playtest=mapa', { waitUntil: 'load', timeout: 180000 });
  await waitScene(map);
  await map.waitForFunction(() => document.querySelectorAll('.civ-hud .civ-hud-chip').length >= 6, null, { timeout: 300000 });
  await wait(4000);
  const chips = await map.evaluate(() => document.querySelectorAll('.civ-hud .civ-hud-chip').length);
  need('HUD mapy zamontowany', chips >= 6, `chipów ${chips}`);
  await shot(map, 'hud-mapy-pelny', MEAS);
  await shot(map.locator('.civ-hud-banner-left').first(), 'hud-mapy-lewy', MEAS);
  await shot(map.locator('.hud-right-cluster').first(), 'hud-mapy-prawy', MEAS);
  await map.close();
  await browser.close();

  // ---- KRYTERIA KOŃCA na OBRAZIE, nie w DOM ---------------------------------
  const px = (n, h) => (seen[n] ? seen[n][h] : 0);
  const flank = (h) => px('panel-miasta-chipy-lewe', h) + px('panel-miasta-chipy-prawe', h);
  if (PREFIX === 'mutacja') {
    // Kryterium końca 5: mutację widać NA OBU ekranach.
    need('mutacja widoczna w panelu miasta', px('panel-miasta-pelny', MUT) > 0 && flank(MUT) > 0,
      `pełny=${px('panel-miasta-pelny', MUT)} chipy=${flank(MUT)}`);
    need('mutacja widoczna w HUD mapy', px('hud-mapy-pelny', MUT) > 0 && px('hud-mapy-lewy', MUT) > 0,
      `pełny=${px('hud-mapy-pelny', MUT)} lewy=${px('hud-mapy-lewy', MUT)}`);
  } else if (PREFIX === 'po') {
    // Kryterium końca 2: po zmianie oba ekrany niosą kolor Z PALETY, a stare odcienie znikły.
    need('panel miasta: złoto palety widoczne', px('panel-miasta-pelny', GOLD) > 0 && flank(GOLD) > 0);
    need('panel miasta: błękit Nauki z palety widoczny', px('panel-miasta-pelny', SCI) > 0);
    need('HUD mapy: złoto palety widoczne', px('hud-mapy-pelny', GOLD) > 0 && px('hud-mapy-lewy', GOLD) > 0,
      `pełny=${px('hud-mapy-pelny', GOLD)} lewy=${px('hud-mapy-lewy', GOLD)}`);
    need('HUD mapy: błękit Nauki z palety widoczny', px('hud-mapy-lewy', SCI) > 0, `lewy=${px('hud-mapy-lewy', SCI)}`);
    need('stary odcień #7cb4e4 zniknął z obu ekranów',
      px('hud-mapy-lewy', '#7cb4e4') === 0 && px('panel-miasta-pelny', '#7cb4e4') === 0);
    need('stary odcień zapasu #e8b84a zniknął z panelu miasta', flank('#e8b84a') === 0);
  } else {
    // PRZED — dowód, że rozjazd był widoczny gołym okiem (a nie tylko w grepie).
    need('PRZED: HUD mapy niesie stary błękit #7cb4e4', px('hud-mapy-lewy', '#7cb4e4') > 0,
      `lewy=${px('hud-mapy-lewy', '#7cb4e4')}`);
    need('PRZED: panel miasta niesie stary zapas #e8b84a', flank('#e8b84a') > 0, `chipy=${flank('#e8b84a')}`);
  }

  console.log(fail === 0 ? `\n[zrzut-dowodow ${PREFIX}] OK — zrzuty niepuste i zgodne z kryteriami`
    : `\n[zrzut-dowodow ${PREFIX}] ${fail} niespełnionych kryteriów obrazu`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
