'use strict';
/**
 * pomiar-plakietki-runda-4.cjs — R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 4 (R4-1).
 *
 * PO CO: ratyfikacja rundy 4 kaze DOBRAC baze budzetu nazwy POMIAREM tak, zeby dac 0/15
 * przyciec w TRZECH konfiguracjach (stolica obca bez glifu produkcji, z glifem, oraz
 * WLASNA stolica gracza z trzecim slotem WZROST%). Wartosc 305 z dispatchu jest SZACUNKIEM
 * orkiestratora — ten skrypt liczy minimum sam i mowi, czy sie z nim zgadza.
 *
 * CZYM SIE ROZNI OD RUNDY 3: tam trzecia konfiguracja byla tylko RAPORTOWANA (decyzja
 * wlasciciela byla otwarta). Tu jest pelnoprawnym kryterium, a skrypt dodatkowo:
 *  - przemiata cala przestrzen baz i podaje MINIMALNA calkowita baze spelniajaca kryterium,
 *    zamiast sprawdzac jedna wartosc wpisana z gory;
 *  - czyta szerokosc wyswietlonej nazwy Z PRAWDZIWEGO SPRITE'A (roznica szerokosci plakietki
 *    dla pelnej nazwy i dla nazwy jednoznakowej), wiec „nie przyciete" jest odczytem
 *    z produkcyjnego `makeCityMapBadgeSprite`, a nie z przepisanej arytmetyki;
 *  - liczy MARGINES do sufitu tekstury (`BADGE_MAX_TOTAL_SCALE` wobec gwarantowanego
 *    w WebGL2 `MAX_TEXTURE_SIZE = 2048`) i zatrzymuje sie bledem, gdy baza go przekracza;
 *  - liczy kolizje plakietka-plakietka przy minimalnym odstepie miast (5 heksow).
 *    Kryterium „brak zachodzenia na sasiedni HEKS" NIE obowiazuje po ratyfikacji rundy 4
 *    (nie spelnia go zadna konfiguracja, takze sprzed tematu) — liczba jest wypisana
 *    wylacznie jako kontekst.
 *
 * CZEGO NIE ROBI: nie zmienia niczego w grze ani w danych. Nie buduje gry (`vite`) — to
 * robi osobny dowod `zrzut-mapy-runda-4.cjs`.
 *
 * Usage:  node dyspozycje/autobot/runs/<ID>/dowody/pomiar-plakietki-runda-4.cjs
 * Exit 0 = kryterium 1 rundy 4 (0/15 w TRZECH konfiguracjach) spelnione.
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
const BASE_R3 = 260;                         // stan po rundzie 3, przed R4-1
const PROD_W = konst(/PROD_SLOT_W\s*=\s*(\d+)/, 'PROD_SLOT_W');
const CROWN_W = konst(/CAPITAL_CROWN_SLOT_W\s*=\s*(\d+)/, 'CAPITAL_CROWN_SLOT_W');
const MAX_SCALE = konst(/BADGE_MAX_TOTAL_SCALE\s*=\s*(\d+)/, 'BADGE_MAX_TOTAL_SCALE');
const NAME_FONT = (chipSrc.match(/const nameFont = '([^']+)'/) || [])[1];
const GROWTH_FONT = (chipSrc.match(/GROWTH_FONT = '([^']+)'/) || [])[1];
if (!NAME_FONT || !GROWTH_FONT) throw new Error('Brak fontow w cityMapStatChip.ts');
const WEBGL2_MIN_MAX_TEXTURE = 2048;

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
const entry = path.join(os.tmpdir(), 'r4-mapa-etyk-entry.ts');
const bundle = path.join(os.tmpdir(), 'r4-mapa-etyk-bundle.js');
fs.writeFileSync(entry, `
import { makeCityMapBadgeSprite, formatCityGrowthPercentLabel }
  from '${path.join(GRA, 'src', 'render', 'cityMapStatChip').replace(/\\/g, '/')}';
(globalThis as any).__R4 = { makeCityMapBadgeSprite, formatCityGrowthPercentLabel };
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

// Najszerszy zapis WZROST%, jaki formatter moze w ogole wyprodukowac przy skrajnej wartosci.
// `formatCityGrowthPercentLabel` nigdy nie stawia plusa, wiec kandydaci ida od minusa.
const GROWTH_KANDYDACI = [-100, -99.9, -10.5, -2.1, 0, 5.5, 99.9];

(async () => {
  const execPath = findChromiumExecutable();
  const browser = await chromium.launch(
    execPath ? { executablePath: execPath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] },
  );
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({ path: bundle });
  const gotowe = await page.evaluate(() => typeof window.__R4?.makeCityMapBadgeSprite === 'function');
  if (!gotowe) throw new Error('Bundle produkcyjny nie wystawil makeCityMapBadgeSprite');

  const wynik = await page.evaluate(({ civKeys, pools, NAME_FONT, GROWTH_FONT, GROWTH_KANDYDACI }) => {
    const mk = window.__R4.makeCityMapBadgeSprite;
    const fmt = window.__R4.formatCityGrowthPercentLabel;
    const m = document.createElement('canvas').getContext('2d');
    const wid = (s, font) => { m.font = font; return m.measureText(s).width; };

    // (a) szerokosci nazw stolic tym samym fontem, co produkcja
    const nazwyPx = {};
    for (const k of civKeys) {
      const n = String(pools[k].miasta_cywilizacji[0]).trim().toUpperCase();
      nazwyPx[k] = { upper: n, px: wid(n, NAME_FONT) };
    }
    // (b) sloty WZROST% — etykieta z PRAWDZIWEGO formattera, szerokosc jak w produkcji
    //     (`growthW = Math.ceil(measureText(...))`)
    const growth = GROWTH_KANDYDACI.map((v) => {
      const label = fmt(v, false);
      return { v, label, px: wid(label, GROWTH_FONT), ceil: Math.ceil(wid(label, GROWTH_FONT)) };
    });

    // (c) PRAWDZIWE sprite'y w trzech konfiguracjach + odczyt szerokosci WYSWIETLONEJ nazwy
    const wLitery = wid('X', NAME_FONT);
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
    const najszerszyGrowth = growth.reduce((a, b) => (b.ceil > a.ceil ? b : a));
    const konfig = [
      { id: 'obca-bez-glifu', prod: false, growthVal: null },
      { id: 'obca-z-glifem', prod: true, growthVal: null },
      { id: 'gracz-3-sloty', prod: true, growthVal: najszerszyGrowth.v },
    ];
    const real = [];
    for (const cfg of konfig) {
      for (const k of civKeys) {
        const nazwa = pools[k].miasta_cywilizacji[0];
        const wej = (name) => ({
          cityName: name,
          population: 3,
          defenseTier: 0,
          civIconId: k,
          isCapital: true,
          prodActive: cfg.prod,
          prodKind: cfg.prod ? 'budynek' : null,
          prodId: cfg.prod ? 'spichlerz' : null,
          growthPercent: cfg.growthVal,
          growthStarving: false,
        });
        const sp = mk(wej(nazwa), new Map());
        const spKrotki = mk(wej('X'), new Map());
        const cv = sp.material.map.image;
        const cvK = spKrotki.material.map.image;
        const cssW = cv.width / dpr;
        const cssWK = cvK.width / dpr;
        // W = padX + leftIconsW + nameW + midExtraW + gap + circleD + padX — wszystko poza
        // `nameW` jest w obu przypadkach identyczne, wiec roznica szerokosci plakietki JEST
        // roznica szerokosci wyswietlonej nazwy. `W` jest zaokraglane w gore -> tolerancja.
        const wyswietlonaPx = cssW - cssWK + wLitery;
        real.push({
          key: k, nazwa, konfig: cfg.id,
          cssW, cssH: cv.height / dpr, canvasPx: cv.width,
          worldW: sp.scale.x, worldH: sp.scale.y,
          pelnaNazwaPx: wid(String(nazwa).trim().toUpperCase(), NAME_FONT),
          wyswietlonaPx,
        });
      }
    }

    const georgiaOk = document.fonts && document.fonts.check
      ? document.fonts.check('700 22px Georgia') : null;

    // (d) cala pula (15 x 100) — kontekst
    const wszystkie = [];
    for (const k of civKeys) for (const n of pools[k].miasta_cywilizacji) {
      wszystkie.push(wid(String(n).trim().toUpperCase(), NAME_FONT));
    }
    // (e) NAJGORSZY OSIAGALNY przypadek SZEROKOSCI plakietki — dla sufitu tekstury i kolizji,
    //     nie dla przyciec. Konfiguracje (c) chodza po `miasta_cywilizacji[0]` i po
    //     `defenseTier: 0`, wiec ich najszersza plakietka NIE jest najszersza osiagalna:
    //     brakuje jej tarczy obrony (22 + odstep 8) i nazwy wypelniajacej caly budzet.
    //     Tu: pelen komplet slotow (tarcza + medalion + korona + WZROST% + glif produkcji)
    //     i nazwy z CALEJ puli. Nazwa dluzsza niz budzet zostaje przycieta DO budzetu,
    //     wiec ta wartosc jest maksimum, ktorego plakietka nie przekroczy.
    let najgorszy = null;
    for (const k of civKeys) for (const n of pools[k].miasta_cywilizacji) {
      const sp = mk({
        cityName: n, population: 3, defenseTier: 1, civIconId: k, isCapital: true,
        prodActive: true, prodKind: 'budynek', prodId: 'spichlerz',
        growthPercent: najszerszyGrowth.v, growthStarving: false,
      }, new Map());
      const w = sp.material.map.image.width / dpr;
      if (!najgorszy || w > najgorszy.cssW) {
        najgorszy = {
          cssW: w, worldW: sp.scale.x, nazwa: n, key: k,
          pelnaNazwaPx: wid(String(n).trim().toUpperCase(), NAME_FONT),
        };
      }
    }

    return { nazwyPx, growth, real, georgiaOk, wszystkie, wLitery, najgorszy };
  }, { civKeys, pools, NAME_FONT, GROWTH_FONT, GROWTH_KANDYDACI });

  await browser.close();

  const { nazwyPx, growth, real, georgiaOk, wszystkie, najgorszy } = wynik;
  const maxNazwaPx = Math.max(...civKeys.map((k) => nazwyPx[k].px));
  const najdluzsza = civKeys.reduce((a, b) => (nazwyPx[b].px > nazwyPx[a].px ? b : a));
  const growthMax = growth.reduce((a, b) => (b.ceil > a.ceil ? b : a));

  console.log('FONT nazwy: ' + NAME_FONT + '   (Georgia zainstalowana: ' + georgiaOk + ')');
  console.log('BAZA budzetu nazwy: po rundzie 3 = ' + BASE_R3 + ' px, w kodzie = ' + BASE_NOW + ' px');
  console.log('Sloty dzielace wiersz z nazwa: korona ' + CROWN_W + ' px, glif produkcji '
    + PROD_W + ' px');
  console.log('Slot WZROST% (`700 13px Arial`, szerokosc jak w produkcji = Math.ceil):');
  for (const g of growth) {
    console.log('   ' + String(g.v).padStart(7) + ' -> "' + g.label + '"'
      + String(g.px.toFixed(1)).padStart(7) + ' px  -> ceil ' + g.ceil + ' px');
  }
  console.log('   najszerszy realny zapis: "' + growthMax.label + '" = ' + growthMax.ceil + ' px');
  console.log('Najdluzsza stolica: ' + nazwyPx[najdluzsza].upper + ' = '
    + maxNazwaPx.toFixed(1) + ' px (' + najdluzsza + ')\n');

  // --- (1) TRZY konfiguracje: przyciecia przed (baza rundy 3) i po ------------------------
  const konfig = [
    { id: 'obca-bez-glifu', etykieta: 'stolica OBCA, bez glifu produkcji', minus: CROWN_W },
    { id: 'obca-z-glifem', etykieta: 'stolica OBCA, z glifem produkcji', minus: CROWN_W + PROD_W },
    {
      id: 'gracz-3-sloty',
      etykieta: 'stolica GRACZA: korona + glif produkcji + WZROST%',
      minus: CROWN_W + PROD_W + growthMax.ceil,
    },
  ];
  const licz = {};
  for (const cfg of konfig) {
    const bOld = BASE_R3 - cfg.minus;
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
    console.log('  -> PRZYCIETE przy bazie ' + BASE_R3 + ': ' + cOld + '/' + civKeys.length
      + '   przy bazie ' + BASE_NOW + ': ' + cNow + '/' + civKeys.length + '\n');
    licz[cfg.id] = { cOld, cNow, budzet: bNow };
  }

  // --- (2) MINIMALNA baza: dobrana pomiarem, nie przepisana z dispatchu -------------------
  const minimalna = maxNazwaPx + CROWN_W + PROD_W + growthMax.ceil;
  const minimalnaCalk = Math.ceil(minimalna);
  console.log('=== MINIMALNA BAZA (dobrana pomiarem) ===');
  console.log('  najdluzsza nazwa ' + maxNazwaPx.toFixed(1) + ' + korona ' + CROWN_W
    + ' + glif ' + PROD_W + ' + WZROST% ' + growthMax.ceil + ' = ' + minimalna.toFixed(1) + ' px');
  console.log('  -> najmniejsza CALKOWITA baza dajaca 0/15 w trzech konfiguracjach: '
    + minimalnaCalk + ' px');
  console.log('  -> baza w kodzie: ' + BASE_NOW + ' px  (zapas nad minimum: '
    + (BASE_NOW - minimalna).toFixed(1) + ' px)');
  console.log('  -> baza z dispatchu rundy 4 (szacunek orkiestratora): 305 px  '
    + (minimalnaCalk === 305 ? 'ZGODNA z pomiarem' : 'ROZBIEZNA z pomiarem!') + '\n');

  // --- (3) PRAWDZIWE sprite'y: czy nazwa faktycznie NIE zostala przycieta -----------------
  console.log('=== PRAWDZIWY SPRITE (makeCityMapBadgeSprite) — odczyt wyswietlonej nazwy ===');
  const TOL = 1.5; // dwa Math.ceil na szerokosci plakietki
  let przycieteReal = 0;
  for (const cfg of konfig) {
    const grupa = real.filter((r) => r.konfig === cfg.id);
    const ciete = grupa.filter((r) => r.wyswietlonaPx < r.pelnaNazwaPx - TOL);
    przycieteReal += ciete.length;
    console.log('  ' + cfg.etykieta.padEnd(48) + ' przyciete wg sprite\'a: '
      + ciete.length + '/' + grupa.length
      + (ciete.length ? '  [' + ciete.map((r) => r.key).join(', ') + ']' : ''));
  }
  const zulu3 = real.find((r) => r.konfig === 'gracz-3-sloty' && r.key === najdluzsza);
  console.log('  kontrola na najdluzszej (' + najdluzsza + ', 3 sloty): pelna '
    + zulu3.pelnaNazwaPx.toFixed(1) + ' px, wyswietlona ' + zulu3.wyswietlonaPx.toFixed(1)
    + ' px, plakietka ' + zulu3.cssW.toFixed(0) + ' px CSS\n');

  // --- (4) KOLIZJE plakietka-plakietka ----------------------------------------------------
  const odstepMiast = MIN_HEX * SASIAD;
  const maxWorld = Math.max(...real.map((r) => r.worldW));
  const kolizje = real.filter((r) => r.worldW > odstepMiast).length;
  const kolizjaNajgorszy = najgorszy.worldW > odstepMiast;
  const naHeks = real.filter((r) => r.worldW > SASIAD).length;
  console.log('=== KOLIZJE (HEX_R = ' + HEX_R + ') ===');
  console.log('  minimalny odstep miast w klastrze: ' + MIN_HEX + ' heksow = '
    + odstepMiast.toFixed(2) + ' j. swiata');
  console.log('  najszersza z trzech konfiguracji:  ' + maxWorld.toFixed(2) + ' j. swiata ('
    + Math.max(...real.map((r) => r.cssW)).toFixed(0) + ' px CSS)');
  console.log('  najszersza OSIAGALNA (pelen komplet slotow, cala pula): '
    + najgorszy.worldW.toFixed(2) + ' j. swiata (' + najgorszy.cssW.toFixed(0) + ' px CSS, "'
    + najgorszy.nazwa + '" / ' + najgorszy.key + ', nazwa ' + najgorszy.pelnaNazwaPx.toFixed(1)
    + ' px > budzet -> przycieta do budzetu)');
  console.log('  KOLIZJE PLAKIETKA<->PLAKIETKA: ' + kolizje + '/' + real.length
    + '; najgorszy osiagalny przypadek: ' + (kolizjaNajgorszy ? 'KOLIDUJE' : 'bez kolizji'));
  console.log('  [kontekst, NIE kryterium po ratyfikacji rundy 4] plakietek szerszych niz '
    + 'jeden heks (' + SASIAD.toFixed(3) + ' j.): ' + naHeks + '/' + real.length);

  // --- (5) SUFIT TEKSTURY -----------------------------------------------------------------
  // Sufit liczymy z NAJGORSZEGO OSIAGALNEGO przypadku (e), nie z najszerszej plakietki
  // trzech konfiguracji: tamte nie maja tarczy obrony ani nazwy wypelniajacej caly budzet,
  // wiec zawyzalyby margines i sufit bazy o dokladnie te 37 px roznicy.
  const maxCss = najgorszy.cssW;
  const tex = maxCss * MAX_SCALE;
  const bazaSufit = Math.floor(WEBGL2_MIN_MAX_TEXTURE / MAX_SCALE - (maxCss - BASE_NOW));
  console.log('\n=== SUFIT TEKSTURY ===');
  console.log('  najszersza plakietka ' + maxCss.toFixed(0) + ' px CSS x BADGE_MAX_TOTAL_SCALE('
    + MAX_SCALE + ') = ' + tex.toFixed(0) + ' px tekstury');
  console.log('  gwarantowany w WebGL2 MAX_TEXTURE_SIZE = ' + WEBGL2_MIN_MAX_TEXTURE + ' px');
  console.log('  MARGINES: ' + (WEBGL2_MIN_MAX_TEXTURE - tex).toFixed(0) + ' px tekstury = '
    + ((WEBGL2_MIN_MAX_TEXTURE - tex) / MAX_SCALE).toFixed(0) + ' px CSS = '
    + (bazaSufit - BASE_NOW) + ' px zapasu na bazie');
  console.log('  sufit przepuszcza baze do ' + bazaSufit + ' px');
  const sufitOk = tex <= WEBGL2_MIN_MAX_TEXTURE;

  const over = wszystkie.filter((w) => w > BASE_NOW - CROWN_W).length;
  console.log('\nKONTEKST: nazw w calej puli (' + wszystkie.length + ') dluzszych niz budzet '
    + (BASE_NOW - CROWN_W) + ' px: ' + over + ' (przy bazie ' + BASE_R3 + ' bylo '
    + wszystkie.filter((w) => w > BASE_R3 - CROWN_W).length + ')');

  const zeroPrzyciec = konfig.every((c) => licz[c.id].cNow === 0) && przycieteReal === 0;
  console.log('\nKRYTERIUM 1 RUNDY 4 (0/15 w TRZECH konfiguracjach): '
    + (zeroPrzyciec ? 'SPELNIONE' : 'NIESPELNIONE'));
  console.log('KRYTERIUM 2 RUNDY 4 (0 kolizji plakietka<->plakietka): '
    + (kolizje === 0 && !kolizjaNajgorszy ? 'SPELNIONE' : 'NIESPELNIONE'));
  console.log('KRYTERIUM 4 RUNDY 4 (margines do sufitu tekstury podany): '
    + (sufitOk ? 'SPELNIONE' : 'PRZEKROCZONY SUFIT -> DECISION_REQUIRED'));
  process.exit(zeroPrzyciec && kolizje === 0 && !kolizjaNajgorszy && sufitOk ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
