'use strict';
/**
 * budynek-garnizon-test.cjs
 *
 * TEMAT: R-BUDYNEK-GARNIZON-NOWY-Q1 — nowy budynek „Garnizon" (quasi-policja,
 * budynek PRAWA, nie wojska; wyzwalacz: decyzja właściciela D2 w
 * `dyspozycje/BALANS-PRAWO-PRZEBUDOWA.md`).
 *
 * Bramka pokrywa kryteria końca z `00-dispatch.md` §KRYTERIA KOŃCA poz. 2:
 *   [A] rekord `garnizon` istnieje i ma KOMPLET pól, które mają `dwor_zarzadcy`
 *       i `trybunal` — asercja PORÓWNAWCZA po nazwach pól (część wspólna kluczy
 *       obu sąsiadów), nie sztywna lista wpisana ręcznie w test;
 *   [B] `dajeSzczescie === false` — Garnizon NIE daje szczęścia (kategoria
 *       porządkowa, nie kulturowa);
 *   [C] `lokalizacja === 'region'` (jak urzędy, NIE stolica) oraz
 *       `epokaWejscia === 1`;
 *   [D] budynek pojawia się w KOLEJCE BUDOWY miasta epoki 1 — najpierw w silniku
 *       (`availableProduction`/`eraBuildingCatalog`), potem w REALNYM renderze
 *       listy „Dostępne do budowy" (`cityPanel.ts::renderBuildList`) w żywym
 *       Chromium;
 *   [E] karta encji renderuje się bez błędu i zawiera nazwę, koszt, utrzymanie
 *       i rys historyczny — REALNA ścieżka produkcyjna
 *       `cityPanel.ts::buildBuildingDetailCard` (→ `buildingAdapter` →
 *       `renderEntityCard`), w żywym Chromium.
 *
 * Dodatkowo — REGUŁA PRZECIW SAMOOSZUKIWANIU z dispatchu:
 *   [tryb 2] Garnizon NIE JEST w żadnym łańcuchu ulepszeń: `upgradeFrom` puste/
 *       nieobecne ORAZ żaden inny budynek nie ma `upgradeFrom === 'garnizon'`.
 *       Twardy dowód zachowaniem silnika: `applyCompletedBuildingIds` przy
 *       awansie Dom Starszyzny → Dwór Zarządcy NIE usuwa Garnizonu z `builtIds`.
 *   [tryb 1] „budynek-widmo": sama obecność w JSON nie wystarcza — stąd [D]/[E]
 *       w żywej przeglądarce plus ikona (mapa + realny plik SVG), a nie tylko
 *       asercje na danych.
 *
 * ŚWIADOME OGRANICZENIE (udokumentowane, nie przeoczenie): `icons/brandAssets.ts`
 * używa `import.meta.glob` + `?raw` (Vite), których esbuild/node nie rozumie —
 * KAŻDY istniejący test kart w tym repo stubuje ten moduł (patrz
 * `.stubs/citypanel-uwagi-hostcard-brandAssets-stub.ts`). Ten test też go stubuje,
 * ale stub NIE jest pusty: czyta REALNY `building-icon-map.json` i REALNĄ treść
 * plików `brand/buildings/*.svg` (wstrzykiwane przy generowaniu stuba), więc
 * medalion karty w zrzucie pokazuje PRAWDZIWĄ ikonę Garnizonu. Usunięcie wpisu
 * `garnizon` z mapy albo pliku SVG czerwieni asercję ikony — nie jest tautologią.
 * Stub powstaje w katalogu tymczasowym systemu (poza drzewem repo), więc bramka
 * nie dokłada żadnego pliku do repozytorium.
 *
 * Usage (z gra/):
 *   node tools/budynek-garnizon-test.cjs
 *   node tools/budynek-garnizon-test.cjs --shots <katalog-na-zrzuty>
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[budynek-garnizon-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_SRC_DIR = path.resolve(__dirname, '.stubs');
const TMP_STUBS = fs.mkdtempSync(path.join(os.tmpdir(), `garnizon-stubs-${process.pid}-`));
const ENTRY = path.resolve(__dirname, '.budynek-garnizon-entry.ts');
const OUTFILE = path.resolve(__dirname, '.budynek-garnizon-bundle.cjs');
const NODE_ENTRY = path.resolve(__dirname, '.budynek-garnizon-node-entry.ts');
const NODE_BUNDLE = path.resolve(__dirname, '.budynek-garnizon-node-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const ROOT = path.resolve(GRA, '..');
const AI_TS = path.join(GRA, 'src', 'game', 'ai.ts');
const ENCY_MD = path.join(ROOT, 'docs', 'encyklopedia', 'budynki', 'garnizon.md');
const WIKI_BUNDLE = path.join(GRA, 'src', 'data', 'wikiBundle.json');
const ICON_MAP_PATH = path.join(GRA, 'src', 'ui', 'icons', 'brand', 'building-icon-map.json');
const ICON_DIR = path.join(GRA, 'src', 'ui', 'icons', 'brand', 'buildings');
const GARNIZON_SVG = path.join(ICON_DIR, 'bld-garnizon.svg');

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

// ---------------------------------------------------------------------------
// Stuby (katalog tymczasowy SYSTEMU, nie repo) — kopia istniejących stubów
// `.stubs/citypanel-uwagi-hostcard-*` z JEDNĄ różnicą: realny `buildingIconSvg`.
// ---------------------------------------------------------------------------
function prepareStubs() {
  const copy = (srcName, dstName) => {
    const dst = path.join(TMP_STUBS, dstName);
    fs.writeFileSync(dst, fs.readFileSync(path.join(STUB_SRC_DIR, srcName), 'utf8'), 'utf8');
    return dst;
  };
  const owl = copy('citypanel-uwagi-hostcard-scienceOwlIcon-stub.ts', 'scienceOwlIcon-stub.ts');
  const hud = copy('citypanel-uwagi-hostcard-hud-stub.ts', 'hud-stub.ts');
  const portraits = copy('citypanel-uwagi-hostcard-leaderPortraits-stub.ts', 'leaderPortraits-stub.ts');

  const brandSrc = fs.readFileSync(
    path.join(STUB_SRC_DIR, 'citypanel-uwagi-hostcard-brandAssets-stub.ts'), 'utf8',
  );
  const emptyBuildingIcon = /export function buildingIconSvg\([^)]*\): string \{ return ''; \}/;
  if (!emptyBuildingIcon.test(brandSrc)) {
    throw new Error('kotwica buildingIconSvg nie znaleziona w citypanel-uwagi-hostcard-brandAssets-stub.ts');
  }
  const iconMap = JSON.parse(fs.readFileSync(ICON_MAP_PATH, 'utf8')).map;
  const svgByBld = {};
  for (const f of fs.readdirSync(ICON_DIR)) {
    if (f.endsWith('.svg')) svgByBld[f.replace(/\.svg$/, '')] = fs.readFileSync(path.join(ICON_DIR, f), 'utf8');
  }
  const realBuildingIcon = [
    '// PODMIENIONE przez budynek-garnizon-test.cjs: realna mapa id→bld z',
    '// building-icon-map.json + realna treść brand/buildings/*.svg (wstrzyknięte przy',
    '// generowaniu tego stuba), żeby medalion karty pokazywał PRAWDZIWĄ ikonę.',
    `const __BLD_MAP: Record<string, string> = ${JSON.stringify(iconMap)};`,
    `const __BLD_SVG: Record<string, string> = ${JSON.stringify(svgByBld)};`,
    'export function buildingIconSvg(def?: any, id?: string): string {',
    "  const key = String(id ?? (def && def.id) ?? '').toLowerCase();",
    "  const bld = __BLD_MAP[key] ?? __BLD_MAP._default ?? 'bld-default';",
    "  return (__BLD_SVG[bld] ?? '').replace(/stroke=\"#e8d88a\"/gi, 'stroke=\"currentColor\"');",
    '}',
  ].join('\n');
  const brandDst = path.join(TMP_STUBS, 'brandAssets-stub.ts');
  fs.writeFileSync(brandDst, brandSrc.replace(emptyBuildingIcon, realBuildingIcon), 'utf8');
  return { brand: brandDst, owl, hud, portraits };
}

function makeStubPlugin(stubs) {
  return {
    name: 'garnizon-stubs-and-export-private-fns',
    setup(build) {
      build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: stubs.brand }));
      build.onResolve({ filter: /(^|\/)scienceOwlIcon$/ }, () => ({ path: stubs.owl }));
      build.onResolve({ filter: /(^|\/)hud$/ }, () => ({ path: stubs.hud }));
      build.onResolve({ filter: /(^|\/)leaderPortraits$/ }, () => ({ path: stubs.portraits }));
      // `wikiHubHud.ts` → `brandTokenVars.ts` → `import ... from './icons/brand/tokens.css?raw'`
      // (Vite-only). esbuild tego nie rozumie — pusty wirtualny moduł, jak w
      // civpedia-budynki-historia-test.cjs. Nie dotyczy niczego, co ta bramka sprawdza.
      build.onResolve({ filter: /tokens\.css\?raw$/ }, () => ({ path: 'garnizon-empty-css-raw', namespace: 'garnizon-virtual' }));
      build.onLoad({ filter: /^garnizon-empty-css-raw$/, namespace: 'garnizon-virtual' },
        () => ({ contents: 'export default "";', loader: 'js' }));
      // Eksport PRYWATNYCH funkcji cityPanel.ts wyłącznie w buforze esbuild —
      // produkcyjny plik w repo zostaje bez `export` (wzorzec:
      // citypanel-uwagi-hostcard-removed-real-render-test.cjs).
      build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
        let src = fs.readFileSync(args.path, 'utf8');
        if (!/function buildBuildingDetailCard\(/.test(src) || !/function renderBuildList\(/.test(src)) {
          throw new Error('kotwica buildBuildingDetailCard/renderBuildList nie znaleziona w cityPanel.ts');
        }
        src += '\nexport { buildBuildingDetailCard, renderBuildList };\n';
        return { contents: src, loader: 'ts' };
      });
    },
  };
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[budynek-garnizon-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

// ===========================================================================
// CZĘŚĆ A — dane (`buildings.json` + ikona), bez przeglądarki
// ===========================================================================
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const byId = new Map(buildings.map((b) => [b.id, b]));
const G = byId.get('garnizon');
const DWOR = byId.get('dwor_zarzadcy');
const TRYB = byId.get('trybunal');

function partA() {
  console.log('\n--- [A] rekord w buildings.json ---');
  check('[A1] rekord "garnizon" istnieje w buildings.json', !!G);
  check('[A1] sąsiedzi porównawczy istnieją (dwor_zarzadcy, trybunal)', !!DWOR && !!TRYB);
  if (!G || !DWOR || !TRYB) return;

  // [A2] KOMPLET PÓL — porównawczo, po nazwach pól obu sąsiadów (część wspólna).
  // Część wspólna, nie suma: `upgradeFrom` ma tylko Dwór Zarządcy (jest w łańcuchu),
  // a Garnizon — jak Trybunał — w łańcuchu NIE JEST (patrz [U] niżej).
  const kDwor = Object.keys(DWOR);
  const kTryb = Object.keys(TRYB);
  const wspolne = kDwor.filter((k) => kTryb.includes(k));
  const kG = Object.keys(G);
  const brakujace = wspolne.filter((k) => !kG.includes(k));
  check(
    `[A2] garnizon ma KOMPLET pól wspólnych dla dwor_zarzadcy i trybunal (${wspolne.length} pól, porównanie po nazwach)`,
    brakujace.length === 0, { brakujace, wspolne },
  );
  check('[A2] sanity: lista pól wspólnych nie jest pusta (asercja nie jest pusto-zielona)', wspolne.length >= 15, wspolne.length);
  // Pola specyficzne dla urzędu regionalnego, których Trybunał nie ma (bo stoi wszędzie).
  check('[A2] garnizon ma pole "lokalizacja" (jak dwor_zarzadcy — urząd regionalny)', kG.includes('lokalizacja'));

  // Podpola baza/przyrost — ten sam kształt co u sąsiadów.
  for (const blok of ['baza', 'przyrost']) {
    const oczek = Object.keys(DWOR[blok]);
    const maja = Object.keys(G[blok] || {});
    check(`[A3] garnizon.${blok} ma te same podpola co dwor_zarzadcy.${blok}`,
      oczek.every((k) => maja.includes(k)) && maja.length === oczek.length, { oczek, maja });
    check(`[A3] garnizon.${blok} — wszystkie wartości liczbowe`,
      maja.every((k) => typeof G[blok][k] === 'number'), G[blok]);
  }

  // [B] szczęście
  check('[B] garnizon.dajeSzczescie === false (Garnizon NIE daje szczęścia)', G.dajeSzczescie === false, G.dajeSzczescie);
  check('[B] garnizon.baza.zadowolenie === 0 (spójnie z dajeSzczescie=false)', G.baza.zadowolenie === 0, G.baza.zadowolenie);
  check('[B] garnizon.przyrost.zadowolenie === 0 (spójnie z dajeSzczescie=false)', G.przyrost.zadowolenie === 0, G.przyrost.zadowolenie);

  // [C] lokalizacja + epoka
  check("[C] garnizon.lokalizacja === 'region' (jak urzędy, NIE stolica)", G.lokalizacja === 'region', G.lokalizacja);
  check('[C] garnizon.epokaWejscia === 1', G.epokaWejscia === 1, G.epokaWejscia);

  // [U] POZA łańcuchem ulepszeń — obie strony relacji.
  const upFrom = String(G.upgradeFrom ?? '').trim();
  check('[U] garnizon.upgradeFrom jest PUSTE (Garnizon nie zastępuje żadnego budynku)', upFrom === '', G.upgradeFrom);
  const ktoUlepszaZGarnizonu = buildings.filter((b) => String(b.upgradeFrom ?? '').trim() === 'garnizon').map((b) => b.id);
  check('[U] żaden budynek nie ma upgradeFrom === "garnizon" (Garnizon nie znika po awansie)',
    ktoUlepszaZGarnizonu.length === 0, ktoUlepszaZGarnizonu);
  check('[U] sanity: mechanizm wykrywania łańcucha działa — dwor_zarzadcy.upgradeFrom === "dom_starszyzny"',
    String(DWOR.upgradeFrom ?? '').trim() === 'dom_starszyzny', DWOR.upgradeFrom);
  check('[U] garnizon.maksPoziom === 1 (wartość stała per epoka, brak awansu poziomem)', G.maksPoziom === 1, G.maksPoziom);

  // Klasyfikacja i treść
  check("[K] garnizon.grupa === 'Prawo i administracja' (grupa panelu miasta)", G.grupa === 'Prawo i administracja', G.grupa);
  check("[K] garnizon.kategoria === 'Administracja' (jak dwor_zarzadcy/trybunal — NIE wojsko)",
    G.kategoria === 'Administracja' && G.kategoria === DWOR.kategoria && G.kategoria === TRYB.kategoria, G.kategoria);
  check("[K] garnizon.nazwa === 'Garnizon'", G.nazwa === 'Garnizon', G.nazwa);
  check('[K] garnizon.historia jest niepusta (rys historyczny karty encji)',
    typeof G.historia === 'string' && G.historia.trim().length > 200, (G.historia || '').length);
  check('[K] garnizon.uwagi jest niepuste', typeof G.uwagi === 'string' && G.uwagi.trim().length > 0);

  // --------------------------------------------------------------------------
  // [R2-A] LICZBY WŁAŚCICIELA — ZAMROŻONE NA DOKŁADNE WARTOŚCI.
  //
  // W RUNDZIE 1 te asercje CELOWO NIE ISTNIAŁY: liczby były wtedy PROPOZYCJĄ
  // Operatora i zamrożenie propozycji zmusiłoby właściciela do poprawiania testu,
  // żeby zmienić własny balans. Od ratyfikacji rundy 2 (ECHO 2026-09-05, wariant
  // Operatora zatwierdzony BEZ ZMIAN) jest dokładnie odwrotnie: to są liczby
  // właściciela i obowiązuje zakaz ich strojenia, więc bramka ma je trzymać.
  // Bez tych asercji następna fala zmieni koszt Garnizonu i NIKT tego nie zauważy.
  //
  // Zmiana którejkolwiek z tych wartości wymaga NOWEGO ECHO właściciela — i wtedy
  // zmienia się JEDNOCZEŚNIE `buildings.json` i ta tablica, nigdy sam test.
  // --------------------------------------------------------------------------
  const LICZBY_WLASCICIELA = {
    kosztBudowy: 30,
    przyrostKosztu: 6,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    maksPoziom: 1,
    epokaWejscia: 1,
  };
  for (const [f, v] of Object.entries(LICZBY_WLASCICIELA)) {
    check(`[R2-A] garnizon.${f} === ${v} — liczba WŁAŚCICIELA (ECHO 2026-09-05), zakaz strojenia`,
      G[f] === v, { jest: G[f], oczekiwane: v });
  }
  check('[R2-A] garnizon.koszt_surowce === { drewno: 30 } — dokładnie jeden surowiec, dokładnie 30',
    JSON.stringify(G.koszt_surowce) === JSON.stringify({ drewno: 30 }), G.koszt_surowce);
  // Typ i zakres zostają OBOK zamrożenia — łapią podmianę liczby na string ("30")
  // albo na wartość zmiennoprzecinkową, czego samo `=== 30` by nie odróżniło.
  for (const f of Object.keys(LICZBY_WLASCICIELA)) {
    check(`[N] garnizon.${f} jest liczbą całkowitą >= 0`, Number.isInteger(G[f]) && G[f] >= 0, G[f]);
  }
  // Reguła A z koszty-surowcowe-test.cjs: epoka Kamienia = WYŁĄCZNIE drewno
  // (wyjątki: stela, kamienne_kregi). Garnizon jest epoki 1, więc podlega regule.
  const surKeys = Object.keys(G.koszt_surowce || {});
  check('[N] garnizon.koszt_surowce = wyłącznie drewno (reguła epoki Kamienia)',
    surKeys.length === 1 && surKeys[0] === 'drewno' && G.koszt_surowce.drewno > 0, G.koszt_surowce);
  check("[N] garnizon.techUnlock === '-' (bez bramki badań — Prawo potrzebne od startu, jak Dom Starszyzny/Pałac)",
    G.techUnlock === '-', G.techUnlock);

  // Ikona / symbol budynku
  console.log('\n--- [I] ikona budynku ---');
  const iconMap = JSON.parse(fs.readFileSync(ICON_MAP_PATH, 'utf8')).map;
  check('[I1] building-icon-map.json mapuje "garnizon" → "bld-garnizon" (wpis WŁASNY, nie _default)',
    iconMap.garnizon === 'bld-garnizon' && iconMap.garnizon !== iconMap._default, iconMap.garnizon);
  check('[I2] plik brand/buildings/bld-garnizon.svg istnieje', fs.existsSync(GARNIZON_SVG));
  if (fs.existsSync(GARNIZON_SVG)) {
    const svg = fs.readFileSync(GARNIZON_SVG, 'utf8');
    check('[I3] bld-garnizon.svg: viewBox "0 0 24 24" (kanon brand-booka @24)', /viewBox="0 0 24 24"/.test(svg), svg.slice(0, 120));
    check('[I3] bld-garnizon.svg: stroke-width="1.5" i stroke="#e8d88a" (jak reszta zestawu)',
      /stroke-width="1\.5"/.test(svg) && /stroke="#e8d88a"/.test(svg));
    check('[I3] bld-garnizon.svg: ma treść rysunku (>=3 ścieżki)', (svg.match(/<path /g) || []).length >= 3);
    check('[I3] bld-garnizon.svg: dokładnie jeden domknięty element <svg> (plik nieucięty)', (() => {
      const opens = (svg.match(/<svg\b/g) || []).length;
      const closes = (svg.match(/<\/svg>/g) || []).length;
      return opens === 1 && closes === 1 && svg.trim().endsWith('</svg>');
    })());
  }
}

// ===========================================================================
// CZĘŚĆ AI — [R2-D] Garnizon na zaszytej liście budów AI (`infraOrder`, ai.ts)
//
// DLACZEGO ASERCJA NA ŹRÓDLE, A NIE NA ZACHOWANIU: AI nie wybiera budynków
// z `availableProduction`, tylko z list wpisanych ręcznie w `ai.ts` — a to
// znaczy, że KAŻDY nowy budynek jest dla takiej listy niewidoczny, dopóki ktoś
// nie dopisze go ręcznie. Właściciel świadomie przyjął łatkę (ECHO: „Dopisać
// Garnizon do listy AI od razu"), naprawa przyczyny jest osobnym tematem
// (`R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1` — przepiąć AI na
// `availableProduction()`). Ta asercja pilnuje, żeby łatka nie wypadła przy
// pierwszym refaktorze `ai.ts` — bez niej zniknie po cichu.
//
// R3-D (2026-09-06, runda 3): etykieta [AI3] brzmiała wcześniej „bez tego AI nigdy
// go nie zbuduje" i to była NIEPRAWDA — sugerowała pokrycie dużego AI, którego ta
// linia nie daje. Final Control rundy 2 wykazał to na kodzie. Etykieta poniżej mówi
// dziś dokładnie tyle, ile asercja faktycznie pilnuje. Nie przywracaj starej wersji
// i nie cytuj tej asercji jako dowodu parytetu gracz/AI.
//
// ZAKRES ŁATKI — CZYTAJ, ZANIM UZNASZ TO ZA „PARYTET GRACZ/AI": `infraOrder` leży
// wewnątrz gałęzi `if (opts.defensiveCopy)`, a `defensiveCopy` ustawiane jest
// w `main.ts` wyłącznie dla PAŃSTW-MIAST (`typCityCopyOwners`). Ta linia daje więc
// Garnizon państwom-miastom; cywilizacje AI mają własne, osobne listy kandydatów
// w tej samej funkcji i nadal go NIE widzą. Szczegóły w raporcie rundy 2.
// ===========================================================================
function partAI() {
  console.log('\n--- [AI] lista budów AI (ai.ts::infraOrder) ---');
  const src = fs.readFileSync(AI_TS, 'utf8');
  const m = src.match(/const infraOrder = \[([\s\S]*?)\];/);
  check('[AI1] kotwica: ai.ts nadal zawiera listę `const infraOrder = [ ... ];`', !!m);
  if (!m) return;
  const items = m[1]
    .split('\n')
    .map((l) => l.trim())
    .map((l) => {
      const q = l.match(/^'([^']+)'/);          // 'studnia',
      if (q) return q[1];
      const ident = l.match(/^([A-Za-z_$][\w$]*)\s*,/); // adminBuilding,
      return ident ? ident[1] : null;
    })
    .filter(Boolean);
  check('[AI2] sanity: parser wyłuskał REALNĄ listę, nie pustkę (studnia + adminBuilding + >=6 pozycji)',
    items.includes('studnia') && items.includes('adminBuilding') && items.length >= 6, items);
  check('[AI3] `garnizon` JEST na liście budowy PAŃSTW-MIAST (`infraOrder`, gałąź `if (opts.defensiveCopy)`, ai.ts:1455) — asercja NIE mówi nic o cywilizacjach AI, te mają osobne listy i Garnizonu nadal nie widzą',
    items.includes('garnizon'), items);
  console.log(`[info] infraOrder = [${items.join(', ')}]`);
}

// ===========================================================================
// CZĘŚĆ W — [R2-C] hasło CivPedii (docs/encyklopedia/budynki/garnizon.md
//            + wygenerowany gra/src/data/wikiBundle.json)
// ===========================================================================
function partWiki() {
  console.log('\n--- [W] hasło CivPedii ---');
  check('[W1] plik docs/encyklopedia/budynki/garnizon.md istnieje', fs.existsSync(ENCY_MD));
  if (!fs.existsSync(ENCY_MD)) return null;
  const md = fs.readFileSync(ENCY_MD, 'utf8');
  check('[W2] metadane hasła deklarują id `garnizon` (mostek do buildings.json)',
    /\|\s*\*\*id\*\*\s*\|\s*`garnizon`/.test(md));
  check('[W2] hasło ma tytuł „Garnizon" w metadanych', /\|\s*\*\*tytuł\*\*\s*\|\s*Garnizon\s*\|/.test(md));

  // Kontrakt civpedia-budynki-historia-test.cjs: treść pod "## Rys historyczny"
  // MUSI być dokładnie równa polu `historia` z buildings.json (bez parafrazy).
  const idx = md.indexOf('## Rys historyczny');
  const rys = idx === -1 ? null : md.slice(idx + '## Rys historyczny'.length).replace(/^\s*\n+/, '').trimEnd();
  check('[W3] sekcja "## Rys historyczny" === buildings.json.garnizon.historia (dokładnie, bez parafrazy)',
    rys !== null && rys === G.historia, { rysLen: rys ? rys.length : null, historiaLen: String(G.historia).length });

  const bundle = JSON.parse(fs.readFileSync(WIKI_BUNDLE, 'utf8'));
  const entry = bundle.encyklopedia.find((e) => e.folder === 'budynki' && e.slug === 'garnizon');
  check('[W4] wygenerowany wikiBundle.json zawiera hasło budynki/garnizon', !!entry);
  // [R3-E1] — patrz blok [R3-E] niżej. Stoi PRZED guardem świadomie: asercja na
  // OBECNOŚĆ hasła musi się wykonać dokładnie wtedy, gdy hasła nie ma. Mutacja M2
  // rundy 3 (usunięcie wpisu z bundla) pokazała, że za guardem byłaby nieosiągalna.
  check('[R3-E1] hasło budynki/garnizon jest OBECNE w wygenerowanym wikiBundle.json (kryterium 3 w części wykonalnej)',
    !!bundle.encyklopedia.find((e) => e.folder === 'budynki' && e.slug === 'garnizon'));
  if (!entry) return null;
  check('[W5] hasło w bundlu ma niepuste wikiS / wikiM / historia',
    entry.wikiS.length > 40 && entry.wikiM.length > 200 && entry.historia.length > 200,
    { wikiS: entry.wikiS.length, wikiM: entry.wikiM.length, historia: entry.historia.length });

  // Resolver 1:1 z `wikiHubHud.ts::findEncyByGameId` — dokładnie ta funkcja, którą
  // wywołuje przycisk „Więcej informacji (Civpedia)" na karcie budynku.
  const resolve = (folder, id) =>
    bundle.encyklopedia.find((e) => e.folder === folder && e.gameIds.includes(id))
    ?? bundle.encyklopedia.find((e) => e.folder === folder && e.slug === id);
  check("[W6] resolver openEncyEntry('budynki','garnizon') trafia w to hasło (nie w żadne inne)",
    resolve('budynki', 'garnizon') === entry, (resolve('budynki', 'garnizon') || {}).slug);
  check('[W7] sanity: resolver NIE trafia dla nieistniejącego id (asercja nie jest zawsze-zielona)',
    resolve('budynki', 'garnizon-ktorego-nie-ma') === undefined);

  // -------------------------------------------------------------------------
  // [R3-E] ZASTĘPUJE ZDJĘTE KRYTERIUM „DZIAŁAJĄCY KLIK CIVPEDII" (runda 3).
  //
  // Kryterium 3 rundy 2 żądało zrzutu z żywego kliku „Więcej informacji (Civpedia)".
  // Final Control udowodnił, że ten przycisk jest martwy dla WSZYSTKICH 42 budynków
  // (`renderer.ts:378-382` ustawia atrybuty, listener `:434` łapie wyłącznie
  // `button[data-entity-kind]`), więc defekt dotyczy całej rodziny kart, nie Garnizonu.
  // Właściciel zdjął to kryterium z tego tematu i skierował do osobnego tematu na całą
  // rodzinę kart. W zamian ratyfikacja rundy 3 zamawia asercję na to, co JEST w zakresie:
  // hasło `garnizon` obecne w `wikiBundle.json` i z NIEPUSTĄ treścią.
  // Te trzy asercje ([R3-E1] wyżej, [R3-E2]/[R3-E3] niżej) są celowo mocniejsze od
  // [W4]/[W5]: sprawdzają treść po `trim()` (biały znak to nie treść) oraz brak
  // wypełniacza zamiast tekstu.
  // -------------------------------------------------------------------------
  const pola = ['title', 'wikiS', 'wikiM', 'historia'];
  const puste = pola.filter((k) => typeof entry[k] !== 'string' || entry[k].trim().length === 0);
  check('[R3-E2] treść hasła jest NIEPUSTA po trim() w każdym polu title/wikiS/wikiM/historia',
    puste.length === 0, { puste });
  const wypelniacz = pola.filter((k) => /\b(TODO|TBD|Lorem ipsum|placeholder|do uzupełnienia)\b/i.test(String(entry[k] || '')));
  check('[R3-E3] treść hasła nie jest wypełniaczem (brak TODO/TBD/placeholder/„do uzupełnienia")',
    wypelniacz.length === 0, { wypelniacz });

  return entry;
}

// ===========================================================================
// CZĘŚĆ B — silnik (esbuild → node): dostępność w produkcji miasta
// ===========================================================================
function partB() {
  console.log('\n--- [D-silnik] dostępność w produkcji miasta ---');
  fs.writeFileSync(NODE_ENTRY,
    "export { availableProduction, eraBuildingCatalog, applyCompletedBuildingIds } from '../src/game/production';\n",
    'utf8');
  esbuild.buildSync({
    entryPoints: [NODE_ENTRY],
    bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: NODE_BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
  const M = require(NODE_BUNDLE);
  const data = { buildings, units: [] };
  const city = { id: 'c1', ownerId: 0, name: 'Miasto regionalne', q: 0, r: 0, population: 3 };
  const stock = { drewno: 500, kamien: 500, cegla: 500 };

  const region = M.availableProduction(city, data, [], {
    epoch: 1, builtBuildingIds: [], isCapital: false, empireResourceStock: stock,
  }).map((i) => i.id);
  check('[D1] Garnizon DOSTĘPNY do budowy w mieście regionalnym epoki 1 (bez żadnej technologii)',
    region.includes('garnizon'), region);

  const capital = M.availableProduction(city, data, [], {
    epoch: 1, builtBuildingIds: [], isCapital: true, empireResourceStock: stock,
  }).map((i) => i.id);
  check("[D2] Garnizon NIEdostępny w stolicy (lokalizacja: 'region')", !capital.includes('garnizon'), capital);

  const kat = M.eraBuildingCatalog(data, [], {
    epoch: 1, builtBuildingIds: [], isCapital: false, empireResourceStock: stock,
  }).find((e) => e.id === 'garnizon');
  check("[D3] eraBuildingCatalog (epoka 1, miasto regionalne): garnizon status 'ready'", !!kat && kat.status === 'ready', kat);
  check('[D3] wpis katalogu ma nazwę "Garnizon" i dodatni koszt Pracy', !!kat && kat.nazwa === 'Garnizon' && kat.koszt > 0, kat);
  check('[D3] wpis katalogu NIE zgłasza brakującej technologii', !!kat && kat.missingTech === '', kat);

  // [tryb 2] Twardy dowód, że Garnizon nie wypada z miasta przy awansie administracji.
  const poAwansie = M.applyCompletedBuildingIds(['dom_starszyzny', 'garnizon'], 'dwor_zarzadcy', buildings);
  check('[U-silnik] po awansie Dom Starszyzny → Dwór Zarządcy Garnizon ZOSTAJE w mieście',
    poAwansie.includes('garnizon'), poAwansie);
  check('[U-silnik] sanity: ten sam awans faktycznie USUWA Dom Starszyzny (mechanizm działa)',
    !poAwansie.includes('dom_starszyzny'), poAwansie);
  const poGarnizonie = M.applyCompletedBuildingIds(['dom_starszyzny'], 'garnizon', buildings);
  check('[U-silnik] ukończenie Garnizonu NIE usuwa Domu Starszyzny (Garnizon niczego nie zastępuje)',
    poGarnizonie.includes('dom_starszyzny') && poGarnizonie.includes('garnizon'), poGarnizonie);
}

// ===========================================================================
// CZĘŚĆ C — żywe Chromium: lista budowy + karta encji
// ===========================================================================
async function partC(wikiEntry) {
  console.log('\n--- [D/E-render] żywe Chromium ---');
  const stubs = prepareStubs();
  const techRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
  const tech = Array.isArray(techRaw) ? techRaw : (techRaw.technologie ?? []);
  const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));

  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel, buildBuildingDetailCard, renderBuildList } from '../src/ui/cityPanel.ts';",
    // [R2-C] REALNY panel CivPedii z produkcji — ten sam moduł, który gra montuje
    // pod przyciskiem Civpedia w HUD; czyta REALNY wikiBundle.json (import w module).
    "import { createWikiHubHud } from '../src/ui/wikiHubHud.ts';",
    'window.__configureCityPanel = configureCityPanel;',
    'window.__buildBuildingDetailCard = buildBuildingDetailCard;',
    'window.__renderBuildList = renderBuildList;',
    'window.__createWikiHubHud = createWikiHubHud;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [makeStubPlugin(stubs)], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1240, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  await page.setContent(`
    <style>
      /* 380px lewego marginesu: realny panel CivPedii jest position:fixed przy lewej
         krawedzi (SIDE_PANEL_LEFT) i bez tego przykrylby liste budowy na zrzucie. */
      body{background:#12181f;color:#e8e2d4;font-family:system-ui,sans-serif;margin:0;
           padding:16px 16px 16px 380px;display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;}
      #civpedia-note{flex-basis:100%;max-width:1120px;font-size:12px;line-height:1.5;color:#f0c987;
                     border:1px dashed #7a5c22;border-radius:6px;padding:8px 10px;}
      #civpedia-note:empty{display:none;}
      .col{background:#1b232c;border:1px solid #3a4756;border-radius:6px;padding:10px;}
      #buildlist{width:420px;}
      /* 680px, nie 460: kolumna wartosci karty ("60 Drewno - z magazynu panstwa")
         przelewa sie poza wezszy kontener i zrzut elementu #card gubi ja z prawej
         strony (zarzut 5 Evaluatora, runda 1). Nie zwezaj tej wartosci. */
      #card{width:680px;}
      h4{margin:0 0 8px;font-size:13px;color:#e8d88a;letter-spacing:.04em;}
    </style>
    <div class="col" id="buildlist"><h4>Panel miasta — „Dostępne do budowy" (epoka 1, miasto regionalne)</h4><div id="mount"></div></div>
    <div class="col" id="card"><h4>Karta encji — Garnizon</h4><div id="dock"></div></div>
    <div id="civpedia-note"></div>
  `);
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

  const gameData = { tech, buildings, units };
  const city = {
    id: 'c1', ownerId: 0, name: 'Miasto regionalne', q: 0, r: 0,
    population: 4, surowce: { drewno: 200 },
  };

  // --- [D-render] realna lista "Dostępne do budowy" ---
  const lista = await page.evaluate(({ gd, cityObj }) => {
    window.__configureCityPanel({
      getEpoch: () => 1,
      getUnlockedTechs: () => [],
      getBuiltBuildingIds: () => [],
      getCivBonusy: () => [],
      getTreasury: () => 999,
      getBuildingCostPace: () => 'niski',
      getDifficulty: () => 'normal',
      getEmpireStock: () => ({ drewno: 500, kamien: 500, cegla: 500 }),
      getEmpireBuiltBuildingIds: () => [],
      getActiveResourceLabels: () => [],
      getEmpireActiveResourceLabels: () => [],
      getCityHasCoastOrRiver: () => false,
      // Stolicą jest INNE miasto — nasze `c1` jest miastem regionalnym, więc
      // bramka `lokalizacja: 'region'` musi Garnizon przepuścić.
      getCapitalCityId: () => 'stolica-innego-miasta',
    });
    const mount = document.getElementById('mount');
    let err = null;
    try {
      window.__renderBuildList(mount, cityObj, gd, { praca: 40 });
    } catch (e) { err = String(e && e.stack || e); }
    const rows = Array.from(mount.querySelectorAll('*'))
      .filter((n) => n.children.length === 0)
      .map((n) => (n.textContent || '').trim())
      .filter(Boolean);
    return { err, text: mount.textContent || '', rows, html: mount.innerHTML.length };
  }, { gd: gameData, cityObj: city });

  check('[D4] renderBuildList wykonał się bez wyjątku', lista.err === null, lista.err);
  check('[D4] lista "Dostępne do budowy" REALNIE zawiera pozycję „Garnizon"',
    /Garnizon/.test(lista.text), { rows: lista.rows.slice(0, 30) });
  check('[D4] sanity: lista zawiera też Dom Starszyzny (render nie jest pusty/atrapowy)',
    /Dom Starszyzny/.test(lista.text), { rows: lista.rows.slice(0, 30) });

  // --- [E-render] karta encji budynku (realna ścieżka cityPanel → adapter → renderer) ---
  const karta = await page.evaluate(({ gd, def }) => {
    const dock = document.getElementById('dock');
    dock.innerHTML = '';
    let err = null;
    try {
      dock.appendChild(window.__buildBuildingDetailCard(def, gd, undefined));
    } catch (e) { err = String(e && e.stack || e); }
    const txt = dock.textContent || '';
    const medalionSvg = dock.querySelector('svg') ? dock.querySelector('svg').outerHTML : '';
    return {
      err,
      txt,
      hasNazwa: /Garnizon/.test(txt),
      hasKoszt: /Koszt budowy/.test(txt),
      hasUtrzymanie: /Utrzymanie/.test(txt),
      hasHistoria: dock.querySelector('.entity-card-historia') !== null,
      historiaTxt: (dock.querySelector('.entity-card-historia') || { textContent: '' }).textContent.trim(),
      medalionSvg,
    };
  }, { gd: gameData, def: G });

  check('[E1] buildBuildingDetailCard („Garnizon") wykonał się bez wyjątku', karta.err === null, karta.err);
  check('[E2] karta zawiera nazwę „Garnizon"', karta.hasNazwa === true);
  check('[E3] karta zawiera wiersz kosztu budowy', karta.hasKoszt === true, karta.txt.slice(0, 300));
  check('[E4] karta zawiera wiersz utrzymania', karta.hasUtrzymanie === true, karta.txt.slice(0, 300));
  check('[E5] karta zawiera sekcję „Rys historyczny" z treścią z buildings.json',
    karta.hasHistoria === true && karta.historiaTxt.includes(String(G.historia).slice(0, 60)),
    karta.historiaTxt.slice(0, 120));
  const realSvg = fs.existsSync(GARNIZON_SVG)
    ? fs.readFileSync(GARNIZON_SVG, 'utf8').replace(/stroke="#e8d88a"/gi, 'stroke="currentColor"')
    : '';
  const firstPath = (realSvg.match(/<path d="([^"]+)"/) || [])[1] || '__brak__';
  check('[I4] medalion karty pokazuje WŁASNĄ ikonę Garnizonu (bld-garnizon.svg), nie bld-default',
    karta.medalionSvg.includes(firstPath), { firstPath, medalion: karta.medalionSvg.slice(0, 160) });

  if (SHOTS) {
    // Zrzuty rundy 1 — robione ZANIM otworzy się panel CivPedii, żeby dowód
    // „karta + kolejka budowy" pozostał dokładnie tym samym kadrem co poprzednio.
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, 'garnizon-kolejka-budowy-i-karta.png'), fullPage: true });
    await page.locator('#buildlist').screenshot({ path: path.join(SHOTS, 'garnizon-kolejka-budowy.png') });
    await page.locator('#card').screenshot({ path: path.join(SHOTS, 'garnizon-karta-encji.png') });
  }

  // -------------------------------------------------------------------------
  // [CP] — [R2-C] kryterium 3: przycisk „Więcej informacji (Civpedia)" na karcie
  //       Garnizonu a REALNY panel CivPedii.
  //
  // CO TU JEST DOWODZONE, A CO NIE — CZYTAJ ZANIM ZACYTUJESZ ZRZUT:
  //   DOWODZONE: (a) karta Garnizonu ma realny przycisk stopki z realnymi
  //     współrzędnymi `data-civpedia-folder="budynki"` / `data-civpedia-slug="garnizon"`;
  //     (b) REALNY `createWikiHubHud` (ten sam moduł co Civpedia w HUD, czytający
  //     REALNY wikiBundle.json) po podaniu DOKŁADNIE tych współrzędnych otwiera
  //     hasło Garnizonu z jego treścią i rysem historycznym.
  //   NIE DOWODZONE: że robi to sam KLIK gracza. W repozytorium NIE MA listenera
  //     dla `.entity-card-civpedia-link` — `renderer.ts:375-384` tworzy przycisk
  //     i ustawia atrybuty, ale nikt ich nie czyta; `openEncyEntry` nie jest
  //     wywoływane z żadnego miejsca w `gra/src`. Przycisk jest martwy dla
  //     WSZYSTKICH 42 budynków, nie tylko dla Garnizonu — to zastana luka repo,
  //     poza allowlistą tego tematu (zgłoszona jako DECISION_REQUIRED w raporcie
  //     rundy 2). Most klik→panel poniżej dokłada TEST, nie gra, i jest tak
  //     opisany na zrzucie. Gdy ktoś dopnie wiring w produkcji, ta sekcja zmieni
  //     się w jedno `await page.click(...)` bez mostu.
  // -------------------------------------------------------------------------
  console.log('\n--- [CP] CivPedia: przycisk karty → realny panel ---');
  const cp = await page.evaluate(() => {
    const btn = document.querySelector('#dock button.entity-card-civpedia-link');
    if (!btn) return { btn: false };
    const folder = btn.getAttribute('data-civpedia-folder');
    const slug = btn.getAttribute('data-civpedia-slug');
    // MOST TESTOWY (nie produkcyjny — patrz komentarz wyżej): przypinamy handler,
    // który czyta WYŁĄCZNIE atrybuty przycisku i podaje je REALNEMU api panelu.
    const api = window.__createWikiHubHud({});
    window.__wikiApi = api;
    btn.addEventListener('click', () => {
      api.openEncyEntry(btn.getAttribute('data-civpedia-folder'), btn.getAttribute('data-civpedia-slug'));
    });
    return { btn: true, folder, slug, label: (btn.textContent || '').trim() };
  });

  check('[CP1] karta Garnizonu ma przycisk stopki „Więcej informacji (Civpedia)"',
    cp.btn === true && cp.label === 'Więcej informacji (Civpedia)', cp);
  check("[CP2] przycisk niesie współrzędne folder='budynki' / slug='garnizon'",
    cp.folder === 'budynki' && cp.slug === 'garnizon', cp);

  // REALNY klik myszą Playwrighta w REALNY przycisk karty.
  await page.click('#dock button.entity-card-civpedia-link');

  const panel = await page.evaluate(() => {
    const root = document.querySelector('.civ-wiki-hub');
    const content = root ? root.querySelector('.wh-content') : null;
    const note = document.getElementById('civpedia-note');
    if (note) {
      note.innerHTML = '<b>MOST KLIK→PANEL DOKŁADA TEN TEST, NIE GRA.</b> '
        + 'W repo nie ma listenera dla .entity-card-civpedia-link (renderer.ts:375-384) — '
        + 'przycisk jest martwy dla wszystkich 42 budynków. Panel po lewej to realny '
        + 'wikiHubHud na realnym wikiBundle.json, otwarty współrzędnymi odczytanymi z przycisku.';
    }
    return {
      panelIstnieje: !!root,
      otwarty: !!root && root.classList.contains('open'),
      naglowki: content ? Array.from(content.querySelectorAll('h2,h3')).map((h) => h.textContent.trim()) : [],
      tekst: content ? (content.textContent || '') : '',
    };
  });

  check('[CP3] REALNY klik w przycisk karty otworzył panel CivPedii (.civ-wiki-hub.open)',
    panel.panelIstnieje === true && panel.otwarty === true, { panelIstnieje: panel.panelIstnieje, otwarty: panel.otwarty });
  check('[CP4] otwarte hasło to „Garnizon" (nagłówek treści panelu)',
    panel.naglowki.includes('Garnizon'), panel.naglowki);
  check('[CP5] treść panelu zawiera realny fragment rysu historycznego z buildings.json',
    panel.tekst.includes(String(G.historia).slice(0, 60)), { oczekiwanyPoczatek: String(G.historia).slice(0, 60) });
  // Panel renderuje Markdown do HTML, więc SUROWY `wikiM` (z `**`, `###`) nigdy nie
  // pojawi się w `textContent` — porównujemy frazą bez znaczników. Fraza jest
  // sprawdzana w DWÓCH niezależnych miejscach (plik hasła i wyrenderowany panel),
  // więc jej usunięcie z .md czerwieni [CP6a] i wskazuje realną przyczynę,
  // zamiast po cichu przechodzić.
  const FRAZA_WIKIM = 'Wojsko stacjonujące w mieście jest tymczasowe';
  check('[CP6a] Wiki-M hasła zawiera frazę kontrolną (asercja nie jest pusto-zielona)',
    !!wikiEntry && String(wikiEntry.wikiM).includes(FRAZA_WIKIM));
  check('[CP6b] panel CivPedii RENDERUJE treść Wiki-M hasła, nie sam tytuł',
    panel.tekst.includes(FRAZA_WIKIM), { fraza: FRAZA_WIKIM, dlugoscTekstu: panel.tekst.length });

  check('[X] zero błędów strony/konsoli podczas renderu', pageErrors.length === 0, pageErrors.slice(0, 3));

  if (SHOTS) {
    await page.screenshot({ path: path.join(SHOTS, 'garnizon-civpedia-klik-panel.png'), fullPage: true });
    console.log('[budynek-garnizon-test] zrzuty zapisane w', SHOTS);
  }

  await browser.close();
}

(async () => {
  partA();
  partAI();
  const wikiEntry = partWiki();
  partB();
  await partC(wikiEntry);
  console.log(`\nbudynek-garnizon-test: ${pass} pass, ${fail} fail`);
  try { fs.rmSync(TMP_STUBS, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('[budynek-garnizon-test] BŁĄD:', e && e.stack || e);
  process.exit(1);
});
