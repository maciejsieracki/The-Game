'use strict';
/**
 * plakietka-przed-po-runda-3.cjs — R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 3 (R3-1).
 *
 * PO CO: zrzut z partii (`zrzut-mapy-runda-3.cjs`, seed 778899) pokazuje uklad GESTY, ale ta
 * partia stawia Rzymian, Grekow i Chinczykow — zadna z tych nazw nie byla przycinana ani
 * przed R3-1, ani po. Najgorszy przypadek, dla ktorego wlasciciel kazal poszerzyc budzet, to
 * zuluskie `uMgungundlovu` (213,9 px). Ten dowod pokazuje WLASNIE ten przypadek: PRAWDZIWA
 * plakietke z produkcyjnego `makeCityMapBadgeSprite`, w dwoch wariantach — z budzetem sprzed
 * R3-1 (baza 200) i z budzetem po R3-1 (baza z kodu) — polozona na siatce heksow narysowanej
 * w TEJ SAMEJ skali swiata, w jakiej sprite laduje na mapie.
 *
 * SKALA (bez zgadywania): `makeCityMapBadgeSprite` ustawia `sprite.scale.x = 0,52 × aspect`,
 * czyli szerokosc plakietki w jednostkach swiata. `hexutil.ts` daje HEX_R = 1, wiec srodek
 * sasiedniego heksa lezy sqrt(3) = 1,732 jednostki dalej. Siatka na obrazie jest rysowana
 * dokladnie w tej metryce, wiec „ile heksow zaslania plakietka" da sie z obrazu POLICZYC,
 * nie oszacowac.
 *
 * BUDZET SPRZED R3-1 uzyskiwany jest plugin'em esbuild, ktory podmienia wartosc stalej
 * W PAMIECI podczas bundlowania — zaden plik w repo nie jest modyfikowany.
 *
 * Usage:  node dyspozycje/autobot/runs/<ID>/dowody/plakietka-przed-po-runda-3.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const HERE = __dirname;
const REPO = path.resolve(HERE, '..', '..', '..', '..', '..');
const GRA = path.join(REPO, 'gra');
const CHIP = path.join(GRA, 'src', 'render', 'cityMapStatChip.ts');

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

const chipSrc = fs.readFileSync(CHIP, 'utf8');
const BASE_NOW = Number((chipSrc.match(/CITY_NAME_BUDGET_BASE\s*=\s*(\d+)/) || [])[1]);
const BASE_OLD = 200;
const HEX_R = Number((fs.readFileSync(path.join(GRA, 'src', 'render', 'hexutil.ts'), 'utf8')
  .match(/export const HEX_R\s*=\s*([\d.]+)/) || [])[1]);
const SASIAD = HEX_R * Math.sqrt(3);
const pools = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'city-names-pools.json'), 'utf8'));
const NAZWA = pools.zulusi.miasta_cywilizacji[0];

async function bundleZBaza(base, outfile) {
  const entry = path.join(os.tmpdir(), 'r3-przedpo-entry-' + base + '.ts');
  fs.writeFileSync(entry,
    `import { makeCityMapBadgeSprite } from '${CHIP.replace(/\.ts$/, '').replace(/\\/g, '/')}';\n`
    + `(globalThis as any).__R3_${base} = makeCityMapBadgeSprite;\n`, 'utf8');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    loader: { '.ts': 'ts' },
    outfile,
    absWorkingDir: GRA,
    logLevel: 'silent',
    plugins: [{
      name: 'podmien-baze-budzetu',
      setup(build) {
        build.onLoad({ filter: /cityMapStatChip\.ts$/ }, (args) => {
          const s = fs.readFileSync(args.path, 'utf8')
            .replace(/CITY_NAME_BUDGET_BASE = \d+/, 'CITY_NAME_BUDGET_BASE = ' + base);
          return { contents: s, loader: 'ts' };
        });
      },
    }],
  });
  return outfile;
}

(async () => {
  const bOld = await bundleZBaza(BASE_OLD, path.join(os.tmpdir(), 'r3-przedpo-old.js'));
  const bNew = await bundleZBaza(BASE_NOW, path.join(os.tmpdir(), 'r3-przedpo-new.js'));

  const execPath = findChromiumExecutable();
  const browser = await chromium.launch(
    execPath ? { executablePath: execPath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] },
  );
  const page = await browser.newPage({ viewport: { width: 1180, height: 640 } });
  await page.goto('about:blank');
  await page.addScriptTag({ path: bOld });
  await page.addScriptTag({ path: bNew });

  const opis = await page.evaluate(({ NAZWA, BASE_OLD, BASE_NOW, SASIAD, HEX_R }) => {
    const PX_NA_JEDNOSTKE = 62;               // skala rysunku: 1 jednostka swiata = 62 px
    const wiersze = [];

    function plakietka(fn) {
      const sp = fn({
        cityName: NAZWA, population: 4, defenseTier: 0, civIconId: 'zulusi',
        isCapital: true, prodActive: true, prodKind: 'budynek', prodId: 'spichlerz',
      }, new Map());
      return { canvas: sp.material.map.image, worldW: sp.scale.x, worldH: sp.scale.y };
    }
    const warianty = [
      { etyk: 'PRZED R3-1 — baza budzetu ' + BASE_OLD + ' px', b: plakietka(window['__R3_' + BASE_OLD]) },
      { etyk: 'PO R3-1 — baza budzetu ' + BASE_NOW + ' px', b: plakietka(window['__R3_' + BASE_NOW]) },
    ];

    document.body.style.margin = '0';
    document.body.style.background = '#10141c';
    document.body.style.font = '13px Arial, Helvetica, sans-serif';
    document.body.style.color = '#e8d88a';

    for (const w of warianty) {
      const box = document.createElement('div');
      box.style.padding = '10px 14px';
      const tytul = document.createElement('div');
      tytul.textContent = w.etyk + '   —   plakietka ' + w.b.worldW.toFixed(2)
        + ' j. swiata = ' + (w.b.worldW / SASIAD).toFixed(2) + ' odleglosci do sasiedniego heksa';
      box.appendChild(tytul);

      const cv = document.createElement('canvas');
      cv.width = 1140; cv.height = 250;
      const g = cv.getContext('2d');
      g.fillStyle = '#1b2a1e'; g.fillRect(0, 0, cv.width, cv.height);

      // Siatka heksow (pointy-top, promien HEX_R) w skali PX_NA_JEDNOSTKE.
      const R = HEX_R * PX_NA_JEDNOSTKE;
      g.strokeStyle = 'rgba(255,255,255,0.30)'; g.lineWidth = 1;
      for (let rr = -2; rr <= 2; rr++) {
        for (let qq = -8; qq <= 8; qq++) {
          const cx = cv.width / 2 + R * Math.sqrt(3) * (qq + rr * 0.5);
          const cy = cv.height / 2 + R * 1.5 * rr;
          g.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = Math.PI / 180 * (60 * i - 30);
            const px = cx + R * Math.cos(a); const py = cy + R * Math.sin(a);
            if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
          }
          g.closePath(); g.stroke();
        }
      }
      // Heks miasta na zolto, sasiedzi na czerwono — zeby „zachodzenie" bylo widoczne.
      const zazn = [[0, 0, 'rgba(255,233,168,0.9)'], [-1, 0, 'rgba(255,90,90,0.9)'],
        [1, 0, 'rgba(255,90,90,0.9)'], [-2, 0, 'rgba(255,150,90,0.7)'], [2, 0, 'rgba(255,150,90,0.7)']];
      for (const [qq, rr, kol] of zazn) {
        const cx = cv.width / 2 + R * Math.sqrt(3) * (qq + rr * 0.5);
        const cy = cv.height / 2 + R * 1.5 * rr;
        g.strokeStyle = kol; g.lineWidth = 3;
        g.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 180 * (60 * i - 30);
          const px = cx + R * Math.cos(a); const py = cy + R * Math.sin(a);
          if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.closePath(); g.stroke();
      }

      // Plakietka w skali swiata, wysrodkowana nad heksem miasta (sprite.position.y = 0,92).
      const dw = w.b.worldW * PX_NA_JEDNOSTKE;
      const dh = w.b.worldH * PX_NA_JEDNOSTKE;
      g.drawImage(w.b.canvas, cv.width / 2 - dw / 2, cv.height / 2 - 0.92 * PX_NA_JEDNOSTKE - dh / 2,
        dw, dh);
      box.appendChild(cv);
      document.body.appendChild(box);
      wiersze.push({
        etyk: w.etyk, worldW: w.b.worldW, cssW: w.b.canvas.width,
        heksow: w.b.worldW / SASIAD,
      });
    }
    return wiersze;
  }, { NAZWA, BASE_OLD, BASE_NOW, SASIAD, HEX_R });

  await page.screenshot({ path: path.join(HERE, 'plakietka-zulu-przed-po-runda3.png'), fullPage: true });
  await browser.close();

  console.log('Nazwa najgorszego przypadku: ' + NAZWA);
  for (const w of opis) {
    console.log('  ' + w.etyk + '  -> kanwa ' + w.cssW + ' px, swiat '
      + w.worldW.toFixed(2) + ' j. = ' + w.heksow.toFixed(2) + ' x odleglosc do sasiada');
  }
  console.log('Rysunek: ' + path.join(HERE, 'plakietka-zulu-przed-po-runda3.png'));
})().catch((e) => { console.error(e); process.exit(1); });
