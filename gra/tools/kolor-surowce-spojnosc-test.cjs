'use strict';
/**
 * kolor-surowce-spojnosc-test.cjs
 *
 * TEMAT: P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1.
 *
 * PO CO: zgłoszenie właściciela (2026-08-09) brzmiało „różne miejsca używają różnych
 * konwencji kolorystycznych dla tych samych sześciu surowców" — Praca, Żywność,
 * Skarbiec, Nauka, Kultura, Religia. Rozjazd powstał, bo kolor surowca był wpisywany
 * literałem albo klasą ('gold'/'blue') w KAŻDYM panelu z osobna. Naprawa bez bramki
 * wróci przy pierwszym nowym panelu — dokładnie tak, jak w tym repo wracał inwariant
 * mgły (cztery zgłoszenia, trzy „ostateczne" naprawy).
 *
 * CO SPRAWDZA (skan źródeł, bez przeglądarki — ma być tani i uruchamialny zawsze):
 *   A1  paleta `src/ui/resourceColors.ts` definiuje DOKŁADNIE sześć surowców;
 *   A2  każdy kolor palety jest tokenem marki z FROZEN `icons/brand/tokens.css`
 *       (Nauka = --tg-science-blue, pozostałe = --tg-gold-primary) — to jest asercja,
 *       która czerwienieje po zmianie wartości w palecie (dowód nietautologiczności)
 *       i która mechanicznie blokuje „wymyślenie" nowego koloru gry;
 *   A3  ikona marki `res-science.svg` ma ten sam błękit co paleta (ikona i liczba
 *       nie mogą się rozjechać);
 *   A4  HUD mapy (`src/ui/hud.ts`) — każdy z sześciu chipów niesie klasę palety;
 *   A5  panel miasta (`src/ui/cityPanel.ts`) — każdy z sześciu chipów paska W3
 *       przekazuje swój klucz palety do `w3CityChip(...)`;
 *   A6  OBEJŚCIE PALETY: w plikach objętych paletą żadna linia nazywająca jeden
 *       z sześciu surowców nie może jednocześnie nieść literału koloru ani starej
 *       klasy tożsamości 'gold'/'blue' (whitelist jawna i uzasadniona niżej);
 *   A7  historyczne literały kolorów surowców nie wracają do tych plików;
 *   A8  oba ekrany faktycznie importują paletę.
 *
 * ZAKRES: para ekranów wskazana przez właściciela — panel miasta i HUD mapy świata —
 * plus wspólna paleta. Panel cywilizacji (`empireDetailPanel.ts`) i martwy panel
 * debugowy `empireBalance.ts` mają WŁASNE, wciąż rozjechane odcienie; są wypisane
 * w raporcie rundy 1 jako osobne znalezisko, świadomie poza zakresem tego tematu
 * (C-025) — dlatego nie ma ich na liście plików skanowanych.
 *
 * Usage (z gra/): node tools/kolor-surowce-spojnosc-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const PALETTE = path.join(SRC, 'ui', 'resourceColors.ts');
const TOKENS = path.join(SRC, 'ui', 'icons', 'brand', 'tokens.css');
const HUD = path.join(SRC, 'ui', 'hud.ts');
const CITY = path.join(SRC, 'ui', 'cityPanel.ts');
const TOOLBAR = path.join(SRC, 'ui', 'mapToolbarHud.ts');
const SCIENCE_SVG = path.join(SRC, 'ui', 'icons', 'brand', 'res-science.svg');

/** Pliki objęte paletą — każdy nowy panel kolorujący sześć surowców ma tu trafić. */
const COVERED = [HUD, CITY, TOOLBAR];

const KEYS = ['praca', 'zywnosc', 'skarbiec', 'nauka', 'kultura', 'religia'];

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function read(p) {
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

/** Usuwa komentarze blokowe i liniowe — komentarz wolno cytować stary kolor. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

// ---------------------------------------------------------------------------
// A1 — paleta istnieje i ma dokładnie sześć surowców
// ---------------------------------------------------------------------------
const paletteSrc = read(PALETTE);
check('A1a paleta src/ui/resourceColors.ts istnieje', paletteSrc !== null, PALETTE);

const paletteColors = {};
if (paletteSrc) {
  const block = paletteSrc.match(/export const RESOURCE_COLOR: Record<ResourceColorKey, string> = \{([\s\S]*?)\};/);
  if (block) {
    const re = /(\w+)\s*:\s*'(#[0-9a-fA-F]{3,8})'/g;
    let m;
    while ((m = re.exec(block[1])) !== null) paletteColors[m[1]] = m[2].toLowerCase();
  }
}
check('A1b paleta definiuje dokładnie sześć surowców',
  Object.keys(paletteColors).length === 6 && KEYS.every(k => paletteColors[k]),
  paletteColors);

// ---------------------------------------------------------------------------
// A2 — żaden kolor palety nie jest wymyślony: to tokeny FROZEN tokens.css
// ---------------------------------------------------------------------------
const tokensSrc = read(TOKENS);
const goldTok = tokensSrc && (tokensSrc.match(/--tg-gold-primary:\s*(#[0-9a-fA-F]{3,8})/) || [])[1];
const sciTok = tokensSrc && (tokensSrc.match(/--tg-science-blue:\s*(#[0-9a-fA-F]{3,8})/) || [])[1];
check('A2a tokeny marki --tg-gold-primary / --tg-science-blue odczytane',
  !!goldTok && !!sciTok, { goldTok, sciTok });

if (goldTok && sciTok) {
  const gold = goldTok.toLowerCase();
  const sci = sciTok.toLowerCase();
  for (const k of KEYS) {
    const want = k === 'nauka' ? sci : gold;
    check(`A2b ${k} = ${k === 'nauka' ? '--tg-science-blue' : '--tg-gold-primary'}`,
      paletteColors[k] === want, { key: k, got: paletteColors[k], want });
  }
}

// ---------------------------------------------------------------------------
// A3 — ikona Nauki nosi ten sam błękit co liczba Nauki
// ---------------------------------------------------------------------------
const sciSvg = read(SCIENCE_SVG);
const sciStroke = sciSvg && (sciSvg.match(/stroke="(#[0-9a-fA-F]{3,8})"/) || [])[1];
check('A3 ikona res-science.svg ma kolor Nauki z palety',
  !!sciStroke && sciStroke.toLowerCase() === paletteColors.nauka,
  { sciStroke, palette: paletteColors.nauka });

// ---------------------------------------------------------------------------
// A4 — HUD mapy: każdy z sześciu chipów czyta z palety
// ---------------------------------------------------------------------------
const hudSrc = read(HUD);
check('A4a src/ui/hud.ts istnieje', hudSrc !== null);
if (hudSrc) {
  const hudCode = stripComments(hudSrc);
  for (const k of KEYS) {
    check(`A4b HUD mapy: chip ${k} czyta z palety`,
      hudCode.includes(`resourceTextClass('${k}')`), k);
  }
}

// ---------------------------------------------------------------------------
// A5 — panel miasta: sześć chipów paska W3 przekazuje swój klucz palety
// ---------------------------------------------------------------------------
const citySrc = read(CITY);
check('A5a src/ui/cityPanel.ts istnieje', citySrc !== null);
if (citySrc) {
  const cityCode = stripComments(citySrc);
  const statMap = (cityCode.match(/const W3_STAT_RES_KEY[\s\S]*?\};/) || [''])[0];
  check('A5b chip W3 wyprowadza klucz palety z data-res-stat',
    statMap.length > 0 && cityCode.includes('W3_STAT_RES_KEY[statId]'), statMap.length);
  check('A5c korzeń chipa W3 nosi klasę zakresu palety',
    cityCode.includes('resourceScopeClass(resKey)'));
  for (const k of KEYS) {
    // klucz palety w mapie data-res-stat → paleta ALBO klasa tekstowa palety
    const used = new RegExp(`:\\s*'${k}'`).test(statMap)
      || cityCode.includes(`resourceTextClass('${k}')`);
    check(`A5d panel miasta: surowiec ${k} czyta z palety`, used, k);
  }
  for (const sel of ['.civ-v-w3-chip-icon', '.civ-v-w3-chip-val', '.civ-v-w3-chip-stock']) {
    const rule = new RegExp(`\\${sel}\\{[^}]*color:var\\(--civ-res-self\\)`).test(cityCode);
    check(`A5e ${sel} czyta kolor tożsamości z palety`, rule, sel);
  }
}

// ---------------------------------------------------------------------------
// A6 — obejście palety: nazwa surowca + literał/stara klasa koloru w jednej linii
// ---------------------------------------------------------------------------
/**
 * WHITELIST — jawna i uzasadniona. Każdy wpis to `plik:fragment linii` oraz powód.
 * Nie rozszerzaj jej, żeby „wyciszyć" nowy panel: nowy panel ma czytać z palety.
 */
const A6_WHITELIST = [
  // Medalion chipa jest wspólnym gradientem obu ekranów (złoty vs naukowy) i jest
  // JUŻ spójny między panelem miasta a HUD mapy — mierzone w Chromium w rundzie 1.
  // To gradient tła medalionu, nie kolor tożsamości liczby; zostaje poza paletą,
  // dopóki właściciel nie zamówi jego ujednolicenia osobnym tematem.
  { file: 'hud.ts', needle: '.civ-hud .civ-hud-chip-med.gold{' },
  { file: 'hud.ts', needle: '.civ-hud .civ-hud-chip-med.science{' },
  { file: 'hud.ts', needle: '.civ-hud .civ-hud-chip-med.science.civ-science-med-ring' },
  { file: 'hud.ts', needle: '.civ-hud .civ-hud-chip-med.science .civ-science-owl-ic' },
  { file: 'cityPanel.ts', needle: '.civ-v-w3-sci-med{' },
  { file: 'cityPanel.ts', needle: '.civ-v-w3-sci-med .civ-science-owl-ic' },
  { file: 'cityPanel.ts', needle: '.civ-v-res-icon .civ-science-owl-ic' },
  { file: 'cityPanel.ts', needle: '.civ-v-w3-chip-icon .civ-science-owl-ic' },
  { file: 'cityPanel.ts', needle: '.slider-nauka input[type=range]' },
];

const RES_MARKER = /(res-work|res-food|res-treasury|res-science|res-culture|res-religion|['"](praca|zywnosc|skarbiec|nauka|kultura|religia)['"]|civ-v-w3-chip-(val|icon|stock)|civ-hud-chip-val|slider-nauka|civ-science-owl-ic|sci-med)/;
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b/;
const LEGACY_CLASS = /['"](gold|blue)['"]/;

const bypasses = [];
for (const f of COVERED) {
  const src = read(f);
  if (src === null) continue;
  const base = path.basename(f);
  stripComments(src).split('\n').forEach((line, i) => {
    if (!RES_MARKER.test(line)) return;
    if (!COLOR_LITERAL.test(line) && !LEGACY_CLASS.test(line)) return;
    if (A6_WHITELIST.some(w => w.file === base && line.includes(w.needle))) return;
    bypasses.push(`${base}:${i + 1}: ${line.trim().slice(0, 140)}`);
  });
}
check('A6 żaden z sześciu surowców nie dostaje koloru z pominięciem palety',
  bypasses.length === 0, bypasses);

// ---------------------------------------------------------------------------
// A7 — historyczne literały kolorów surowców nie wracają
// ---------------------------------------------------------------------------
/**
 * Tylko literały, które w objętych plikach służyły WYŁĄCZNIE do kolorowania sześciu
 * surowców: #7cb4e4 (błękit Nauki w HUD mapy, w pasku W3 panelu miasta i na przycisku
 * Nauki paska narzędzi mapy) oraz #e8b84a (zapas cywilizacji w pasku W3). Odcieni
 * #8ec5ff/#e0b24a/#d9a441 tu NIE ma, bo w tych plikach mają też użycia niesurowcowe
 * (ikona świątyni, przyciski garnizonu, etykiety miast) — ich nawroty w kontekście
 * surowca łapie A6, a nie ślepy grep po całym pliku.
 */
const HISTORICAL = ['#7cb4e4', '#e8b84a'];
const returned = [];
for (const f of COVERED) {
  const src = read(f);
  if (src === null) continue;
  const code = stripComments(src).toLowerCase();
  for (const lit of HISTORICAL) if (code.includes(lit)) returned.push(`${path.basename(f)} → ${lit}`);
}
check('A7 historyczne odcienie surowców nie wróciły do objętych plików',
  returned.length === 0, returned);

// ---------------------------------------------------------------------------
// A8 — oba ekrany importują paletę
// ---------------------------------------------------------------------------
for (const f of [HUD, CITY]) {
  const src = read(f);
  check(`A8 ${path.basename(f)} importuje paletę resourceColors`,
    !!src && /from '\.\/resourceColors'/.test(src), path.basename(f));
}

console.log(`\n[kolor-surowce-spojnosc-test] ${pass}/${pass + fail} PASS`);
process.exit(fail === 0 ? 0 : 1);
