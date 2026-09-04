'use strict';
/**
 * wyrab-wycinka-nazwa-live-test.cjs
 *
 * TEMAT: P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1.
 *
 * Zywy dowod w headless Chromium (nie zalozenie z kodu): panel budowy (build mode HUD)
 * renderuje etykiete ulepszenia terenu `wyrab` jako "Wycinka", nie "Wyrab" -- dokladnie
 * tym samym mechanizmem co produkcja: `label: meta?.nazwa ?? label` z
 * `createImprovementBuildApi.listTypes()` (gra/src/map/improvement-build.ts), gdzie `meta`
 * pochodzi z `getImprovementMeta('wyrab')` (gra/src/game/improvement-tech.ts, czyta
 * `gra/data/terrain-improvements.json`) i zawsze wygrywa nad statyczna etykieta z
 * `gra/src/render/improvements.ts` (ta druga jest wiec martwa dla tego klucza -- test to
 * potwierdza asercja [2]).
 *
 * Sprawdza takze hinty z main.ts (kryterium 2 dispatchu) na poziomie zrodla (dokladny
 * literal), bo wywolanie tych fragmentow main.ts wymagaloby pelnego stanu gry.
 *
 * Usage (z gra/): node tools/wyrab-wycinka-nazwa-live-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[wyrab-wycinka-nazwa-live-test] playwright missing');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
/** Zrzuty dowodowe rundy 5 (R5-K1). */
const SHOTS = path.resolve(REPO, 'dyspozycje', 'autobot', 'runs',
  'P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1', 'dowody');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ENTRY = path.resolve(__dirname, '.wyrab-wycinka-live-entry.ts');
const OUTFILE = path.resolve(__dirname, '.wyrab-wycinka-live-bundle.cjs');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'build-panel-scroll-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'build-panel-scroll-scienceOwlIcon-stub.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) { return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] }); }
}

async function main() {
  // -----------------------------------------------------------------------
  // [1] Zywy DOM: createBuildModeHud renderuje "Wycinka" dla klucza 'wyrab',
  //     etykieta pochodzi z getImprovementMeta('wyrab').nazwa (JSON), dokladnie
  //     jak listTypes() w improvement-build.ts.
  // -----------------------------------------------------------------------
  fs.writeFileSync(
    ENTRY,
    [
      "import { createBuildModeHud } from '../src/ui/buildModeHud.ts';",
      "import { getImprovementMeta } from '../src/game/improvement-tech.ts';",
      "import { IMPROVEMENTS } from '../src/render/improvements.ts';",
      // RUNDA 5 (R5-K1): zywy render KARTY ulepszenia -- ta sama sciezka produkcyjna
      // co Civpedia/panel (buildEntityCardData -> improvementAdapter -> renderEntityCard).
      "import { buildEntityCardData, renderEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
      'window.__createBuildModeHud = createBuildModeHud;',
      'window.__getImprovementMeta = getImprovementMeta;',
      'window.__IMPROVEMENTS = IMPROVEMENTS;',
      'window.__buildEntityCardData = buildEntityCardData;',
      'window.__renderEntityCard = renderEntityCard;',
      'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
      '',
    ].join('\n'),
    'utf8',
  );

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json', '.css': 'text' },
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /(^|\/)scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundleJs });

  const result = await page.evaluate(() => {
    // Odtwarza DOKLADNIE formule z improvement-build.ts::listTypes():
    //   label: meta?.nazwa ?? label
    const staticEntry = window.__IMPROVEMENTS.find((t) => t.key === 'wyrab');
    const meta = window.__getImprovementMeta('wyrab');
    const types = [{
      key: 'wyrab',
      label: (meta && meta.nazwa) ?? staticEntry.label,
      kosztPraca: meta ? meta.kosztPraca : 0,
      epoka: staticEntry.epoka,
      techUnlocked: true,
      techLabel: null,
      lockHint: null,
    }];
    const hud = window.__createBuildModeHud({
      listTypes: () => types,
      getActiveKey: () => null,
      onSelectType: () => {},
      onExit: () => {},
      isOpen: () => true,
      getPracaPool: () => 999,
      canFoundCity: () => false,
      isFoundCityActive: () => false,
      isFoundCityOnly: () => false,
      getFoundCityCostLabel: () => '0 P',
      listWonders: () => [],
      getActiveWonderId: () => null,
      getWonderTargetLabel: () => '',
      listPlayerCities: () => [{ id: 'c1', name: 'Roma' }],
      getUlepszeniaCityId: () => 'c1',
      getUlepszeniaEmpireState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 30, onlyWorked: false }),
      getUlepszeniaEffectiveState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 30, onlyWorked: false, override: false }),
      getUlepszeniaCityOverride: () => false,
    });
    hud.update();
    const panelText = document.body.textContent || '';
    return {
      staticLabel: staticEntry.label,
      metaNazwa: meta && meta.nazwa,
      effectiveLabel: types[0].label,
      panelText,
      panelHasWycinka: panelText.includes('Wycinka'),
      panelHasWyrab: panelText.includes('Wyrąb'),
    };
  });

  check('[1] JSON meta.nazwa dla "wyrab" == "Wycinka"', result.metaNazwa === 'Wycinka', result.metaNazwa);
  check('[1] panel budowy (zywy DOM) zawiera tekst "Wycinka"', result.panelHasWycinka, result.panelText.slice(0, 300));
  check('[1] panel budowy (zywy DOM) NIE zawiera "Wyrąb"', !result.panelHasWyrab);

  // -----------------------------------------------------------------------
  // [2] improvements.ts label (statyczna lista) potwierdzona MARTWA dla tego
  //     klucza: meta zawsze istnieje dla 'wyrab' (wpis w JSON), wiec fallback
  //     na staticEntry.label nigdy nie jest uzywany w produkcji. Test i tak
  //     zmienia ja (allowlist), bo to jedyna zywa proba jej uzycia w repo.
  // -----------------------------------------------------------------------
  check('[2] improvements.ts static label dla "wyrab" == "Wycinka" (zmieniona zgodnie z allowlista)',
    result.staticLabel === 'Wycinka', result.staticLabel);
  check('[2] meta.nazwa (JSON, zawsze wygrywa w listTypes()) != null -- staticEntry.label jest martwy dla "wyrab"',
    result.metaNazwa !== null && result.metaNazwa !== undefined);

  // -----------------------------------------------------------------------
  // [10] R5-K1: ZYWY RENDER KARTY ULEPSZENIA "Farma" w Chromium -- wiersz "Warunek".
  //      Kryterium rundy 5 wymaga ZRZUTU z zywej karty, nie odczytu JSON: blok [8]
  //      czyta plik danych i nie udowadnia, ze to pole faktycznie dociera do gracza
  //      tym wierszem. Tu idziemy produkcyjna sciezka
  //      buildEntityCardData('improvement','farma') -> improvementAdapter (l. 137:
  //      { label: 'Warunek', value: text(improvement.warunek) }) -> renderEntityCard,
  //      odczytujemy tekst z realnego DOM i zapisujemy PNG.
  // -----------------------------------------------------------------------
  const karta = await page.evaluate(() => {
    const stary = document.getElementById('r5-card-host');
    if (stary) stary.remove();
    const style = document.createElement('style');
    style.textContent = window.__ENTITY_CARD_CSS;
    document.head.appendChild(style);
    const host = document.createElement('div');
    host.id = 'r5-card-host';
    host.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#1b1b1b;padding:16px;';
    const data = window.__buildEntityCardData('improvement', 'farma');
    if (data == null) return { blad: 'buildEntityCardData zwrocilo null' };
    host.appendChild(window.__renderEntityCard(data));
    document.body.appendChild(host);
    // Wiersz "Warunek" wyszukany po ETYKIECIE w DOM, nie po indeksie -- dowod, ze
    // tekst siedzi dokladnie w tym wierszu karty, ktory widzi gracz.
    let warunekText = null;
    for (const el of host.querySelectorAll('*')) {
      if (el.children.length === 0 && (el.textContent || '').trim() === 'Warunek') {
        warunekText = ((el.parentElement && el.parentElement.textContent) || '').trim();
        break;
      }
    }
    return {
      tytul: data.title,
      warunekText,
      kartaText: (host.textContent || '').trim(),
    };
  });

  check('[10] karta ulepszenia "Farma" zbudowana zywa sciezka produkcyjna',
    !karta.blad && karta.tytul === 'Farma', karta);
  check('[10] ZYWY DOM: wiersz "Warunek" karty Farma istnieje i wskazuje "Wycinka"',
    typeof karta.warunekText === 'string' && karta.warunekText.includes('najpierw Wycinka.'),
    karta.warunekText);
  check('[10] ZYWY DOM: wiersz "Warunek" NIE zawiera juz "wyrąb"',
    typeof karta.warunekText === 'string' && !/[Ww]yrąb/.test(karta.warunekText),
    karta.warunekText);
  check('[10] ZYWY DOM: CALA karta Farma bez "wyrąb" (dowod, ze `uwagi` -- zapis'
    + ' decyzyjny z "najpierw wyrąb" -- faktycznie NIE jest renderowane)',
    typeof karta.kartaText === 'string' && !/[Ww]yrąb/.test(karta.kartaText),
    karta.kartaText && karta.kartaText.slice(0, 400));

  fs.mkdirSync(SHOTS, { recursive: true });
  const shotPath = path.join(SHOTS, 'r5-karta-farma-warunek.png');
  const hostEl = await page.$('#r5-card-host');
  if (hostEl) await hostEl.screenshot({ path: shotPath });
  check('[10] zrzut PNG karty Farma zapisany (dowod R5-K1)',
    fs.existsSync(shotPath) && fs.statSync(shotPath).size > 1000, shotPath);
  console.log('       zrzut: ' + shotPath);

  await browser.close();
  check('brak bledow konsoli/pageerror', consoleErrors.length === 0, consoleErrors);

  // -----------------------------------------------------------------------
  // [3] Literalne stringi main.ts (hinty gracza) -- kryterium 2 dispatchu.
  // -----------------------------------------------------------------------
  const mainTs = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
  check('[3] main.ts: hint zaznaczenia akcji wycinki zawiera "Wycinka" (nie "Wyrąb")',
    mainTs.includes("'Wycinka' + costPart + ': +20 Pracy/turę przez 3 tury"));
  check('[3] main.ts: hint po zbiorze Drewna zawiera "Wycinka" (nie "Wyrąb")',
    mainTs.includes("'Wycinka: +' + drewnoCredit + ' Drewna"));
  check('[3] main.ts: log konsoli AI zawiera "Wycinka" (opcjonalne, dla spojnosci)',
    mainTs.includes('] Wycinka @ (${cmd.q},${cmd.r})'));

  // -----------------------------------------------------------------------
  // [4] improvement-build.ts: komunikat blokady lasu -- TYLKO nazwa w nawiasie
  //     zmieniona, czasownik "wyrąb" NIETKNIĘTY.
  // -----------------------------------------------------------------------
  const buildTs = fs.readFileSync(path.join(GRA, 'src', 'map', 'improvement-build.ts'), 'utf8');
  check('[4] improvement-build.ts: "najpierw wyrąb las" (czasownik) NIETKNIĘTY',
    buildTs.includes('najpierw wyrąb las (Wycinka w panelu ulepszeń)'));

  // -----------------------------------------------------------------------
  // [5] wikiBundle.json -- OBIE sekcje bundla (encyklopedia I poradnik).
  //     Dodane w rundzie 2 po zarzucie 1 Evaluatora: raport pominal zmiany
  //     w /poradnik/*, bo sekcja poradnika nie byla w ogole asertowana.
  //     Ten blok zamyka luke na stale -- regeneracja bundla, ktora cofnelaby
  //     nazwe w KTOREJKOLWIEK sekcji, wywala test.
  // -----------------------------------------------------------------------
  const bundle = JSON.parse(
    fs.readFileSync(path.join(GRA, 'src', 'data', 'wikiBundle.json'), 'utf8'));

  const wpis = bundle.encyklopedia.find((e) => e.id === 'ulepszenia/wyrab');
  check('[5] bundle/encyklopedia: wpis "ulepszenia/wyrab" istnieje (klucz NIEZMIENIONY)',
    !!wpis, wpis && wpis.id);
  check('[5] bundle/encyklopedia: title == "Wycinka"',
    wpis && wpis.title === 'Wycinka', wpis && wpis.title);

  for (const id of ['05-budowa-mapa', '28-katalog-ulepszen']) {
    const rozdz = bundle.poradnik.find((p) => p.id === id);
    check(`[5] bundle/poradnik/${id}: rozdzial obecny`, !!rozdz);
    check(`[5] bundle/poradnik/${id}: zawiera "Wycinka"`,
      !!rozdz && rozdz.content.includes('Wycinka'));
    check(`[5] bundle/poradnik/${id}: NIE zawiera "Wyrąb"`,
      !!rozdz && !rozdz.content.includes('Wyrąb'));
  }

  check('[5] bundle (CALY, obie sekcje): zero wystapien "Wyrąb"',
    !JSON.stringify(bundle).includes('Wyrąb'));

  // -----------------------------------------------------------------------
  // [6] TRESC CIVPEDII -- pelne pokrycie, nie tylko wybrane rozdzialy.
  //     Runda 3: resztka "wyrab" jako NAZWA ULEPSZENIA przezyla rundy 1-2 w
  //     02-mapa-swiata.md i 07-miasto-budowa-rekrutacja.md, bo test asertowal
  //     panel budowy i tylko dwa wskazane rozdzialy poradnika. Ten blok
  //     skanuje CALA tresc bundla (poradnik + encyklopedia) i wymaga, by
  //     KAZDE wystapienie "wyrab" mieszczilo sie na jawnej liscie uzyc
  //     pospolitych (czasownik / rzeczownik czynnosci / tresc historyczna).
  //     Kazde NOWE lub NIEZNANE wystapienie = FAIL, wiec nawrot nazwy w
  //     dowolnym rozdziale poradnika wywala test.
  //
  //     Dopuszczone uzycia pospolite (uzasadnienie per pozycja):
  //       "wyrąb lasu"                    -- rzeczownik odczasownikowy (czynnosc),
  //                                          jawnie wylaczony z zakresu w R3-1
  //       "wyrąb AI"                      -- ta sama czynnosc, stopka rewizji
  //       "Sam wyrąb, wykonywany"         -- tresc historyczna encyklopedii
  //
  //     RUNDA 4 -- USUNIETE Z WHITELISTY (byly bledna klasyfikacja autora dispatchu
  //     R3-1, ratyfikowana korekta w sekcji "RUNDA 4" dispatchu):
  //       "najpierw wyrąb → farma"        -- NIE tryb rozkazujacy: trzeci element
  //                                          szeregu nazw ulepszen "wyrąb → farma →
  //                                          irygacja" (lancuch ulepszen na heksie)
  //       "wyrąb tylko gdy potrzebujesz"  -- NIE tryb rozkazujacy: szereg rownolegly
  //                                          do "Tartak" w checkliscie budowy
  //     Dopoki te dwa wpisy tu byly, test byl SLEPY dokladnie na te klase resztki
  //     i przepuscil ja przez trzy rundy. Nie dopisuj tu wpisow "zeby przeszlo" --
  //     whitelista przyjmuje wylacznie realne czasowniki i tresc historyczna.
  // -----------------------------------------------------------------------
  const DOZWOLONE_WYRAB = [
    'wyrąb lasu',
    'wyrąb AI',
    'Sam wyrąb, wykonywany',
  ];

  const sekcjeCivpedii = [
    ...bundle.poradnik.map((p) => ({ zrodlo: 'poradnik/' + p.id, tekst: String(p.content || '') })),
    ...bundle.encyklopedia.map((e) => ({
      zrodlo: 'encyklopedia/' + e.id,
      // UWAGA: wpisy encyklopedii NIE maja pol `content`/`body`/`text` -- realne pola
      // tresci to `wikiS`/`wikiM`/`full`/`historia` (patrz bundle-wiki-for-game.cjs).
      // W pierwszym podejsciu rundy 3 blok [6] skanowal bledna liste pol, wiec obejmowal
      // same tytuly (2 140 z 750 753 znakow = 0,3% tresci) -- nazwa mala litera
      // wstrzyknieta do `wikiM`/`full` przechodzila bez FAIL. Zarzut 2 Evaluatora
      // rundy 3, przyjety. Asercja [7] nizej pilnuje, by ta lista pol nie zwiotczala
      // ponownie (pokrycie liczone w znakach, nie deklarowane w komentarzu).
      tekst: [e.title, e.wikiS, e.wikiM, e.full, e.historia]
        .filter((x) => typeof x === 'string').join('\n'),
    })),
  ];

  // RUNDA 4, zarzut 3 Evaluatora (PRZYJETY): dopasowanie whitelisty bylo KONTEKSTOWE --
  // fraza wystarczyla gdziekolwiek w oknie +-40 znakow wokol trafienia, wiec przyszla
  // NAZWA ulepszenia postawiona w promieniu 40 znakow od "wyrąb lasu" byla by cicho
  // przepuszczona. Teraz dopasowanie jest ZAKOTWICZONE: fraza z whitelisty musi sama
  // zawierac "wyrąb" i lezec w tekscie DOKLADNIE tak, by jej wlasne "wyrąb" pokrylo
  // to konkretne trafienie. Jedno trafienie == jedno uzasadnienie, zero zaslaniania
  // z sasiedztwa.
  function zakotwiczona(tekst, idx, fraza) {
    const off = fraza.search(/[Ww]yrąb/);
    if (off < 0) return false; // fraza bez "wyrąb" nie moze niczego uzasadnic
    const start = idx - off;
    return start >= 0 && tekst.startsWith(fraza, start);
  }

  const nieuzasadnione = [];
  let dozwoloneTrafienia = 0;
  for (const sekcja of sekcjeCivpedii) {
    const re = /[Ww]yrąb/g;
    let m;
    while ((m = re.exec(sekcja.tekst)) !== null) {
      const kontekst = sekcja.tekst.slice(Math.max(0, m.index - 40), m.index + 40);
      if (DOZWOLONE_WYRAB.some((fraza) => zakotwiczona(sekcja.tekst, m.index, fraza))) dozwoloneTrafienia++;
      else nieuzasadnione.push({ zrodlo: sekcja.zrodlo, kontekst });
    }
  }

  check('[6] CIVPEDIA (cala tresc bundla): zero wystapien "wyrab" w roli NAZWY ULEPSZENIA'
    + ' -- kazde trafienie musi byc na liscie uzyc pospolitych',
    nieuzasadnione.length === 0, nieuzasadnione);
  check('[6] sanity: skan objal realna tresc civpedii i znalazl dozwolone uzycia pospolite'
    + ' (asercja nie jest pusta)',
    sekcjeCivpedii.length > 0 && dozwoloneTrafienia > 0,
    { sekcje: sekcjeCivpedii.length, dozwoloneTrafienia });

  for (const [id, oczekiwane] of [
    ['02-mapa-swiata', 'Tartak, wycinka, obóz łowiecki'],
    ['07-miasto-budowa-rekrutacja', 'tartak lub wycinka'],
    // RUNDA 4: obie linie 05-budowa-mapa.md ukrywane wczesniej przez whiteliste.
    ['05-budowa-mapa', 'najpierw wycinka → farma → irygacja'],
    ['05-budowa-mapa', 'wycinka tylko gdy potrzebujesz pola pod farmę'],
  ]) {
    const rozdz = bundle.poradnik.find((p) => p.id === id);
    check(`[6] bundle/poradnik/${id}: nazwa ulepszenia w wyliczeniu == "wycinka"`,
      !!rozdz && rozdz.content.includes(oczekiwane), oczekiwane);
  }

  // -----------------------------------------------------------------------
  // [7] STRAZNIK POKRYCIA bloku [6]. Zarzut 2 Evaluatora rundy 3: blok [6]
  //     deklarowal skan "calej tresci civpedii", a faktycznie czytal nieistniejace
  //     pola encyklopedii i obejmowal 0,3% znakow -- same tytuly. Sam skan nie
  //     potrafi tego wykryc (brak pola == pusty string == zero trafien == PASS).
  //     Ta asercja mierzy pokrycie W ZNAKACH wzgledem calego bundla, wiec kazde
  //     przyszle przemianowanie/dodanie pola tresci w bundle-wiki-for-game.cjs,
  //     ktore wypadnie z listy pol w [6], zwali test zamiast cicho oslepic skan.
  // -----------------------------------------------------------------------
  const znakowSkanowanych = sekcjeCivpedii.reduce((n, s) => n + s.tekst.length, 0);
  const znakowTresci =
    bundle.poradnik.reduce((n, p) => n + String(p.content || '').length, 0)
    + bundle.encyklopedia.reduce((n, e) => n + Object.entries(e)
      .filter(([k, v]) => typeof v === 'string' && !['id', 'slug', 'folder', 'category'].includes(k))
      .reduce((m, [, v]) => m + v.length, 0), 0);
  const pokrycie = znakowSkanowanych / znakowTresci;
  check('[7] blok [6] faktycznie skanuje cala tresc civpedii (pokrycie >= 99% znakow'
    + ' tresciowych bundla, nie same tytuly)',
    pokrycie >= 0.99, { znakowSkanowanych, znakowTresci, pokrycie: pokrycie.toFixed(4) });
  check('[7] skan objal obie sekcje bundla w realnej skali (> 100 000 znakow)',
    znakowSkanowanych > 100000, znakowSkanowanych);

  // -----------------------------------------------------------------------
  // [8] KARTY ULEPSZEN (terrain-improvements.json) -- zarzut 2 Evaluatora rundy 4,
  //     PRZYJETY. Do tej pory zaden blok nie skanowal pol tego pliku renderowanych
  //     graczowi; [5]-[7] pilnuja WYLACZNIE wikiBundle.json. To ta sama klasa
  //     slepoty, ktora przezyla trzy rundy -- tylko w innym pliku.
  //     KOMPLET POL RENDEROWANYCH -- ustalony odczytem
  //     `gra/src/ui/entityCards/improvementAdapter.ts` (nie zgadywany):
  //       nazwa            -> `title`                                (l. 91, 209)
  //       typ, epoka       -> `subtitle`                             (l. 198-201)
  //       teren            -> wiersz "Teren"                         (l. 126)
  //       tech             -> wiersz "Technologia"                   (l. 132-134)
  //       koszt_praca      -> wiersz "Koszt (Praca)"                 (l. 136)
  //       warunek          -> wiersz "Warunek"                       (l. 137)  <-- R5-1
  //       cywilizacje      -> wiersz "Cywilizacje" (join ', ')       (l. 143-147)
  //       upgradeFrom      -> wiersz "Ulepszenie bazowe"             (l. 148)
  //       surowiecOdblokowany -> "Odblokowuje surowiec"              (l. 156-160)
  //       odblokowuje      -> wiersz "Odblokowuje"                   (l. 185-187)
  //       bonus_ruch_uwaga -> doklejane do wiersza "Ruch"            (l. 103-107)
  //       historia         -> `historicalNote`                       (l. 214)
  //     Pola czysto LICZBOWE sa renderowane, ale tekstu nie niosa, wiec nie moga
  //     przemycic nazwy i sa poza skanem: `epoka`, `koszt_praca`,
  //     `surowiec_ilosc_tura`, `zasieg_terytorium|kontroli|pol`, `bonus_*`.
  //     (`epoka` byla tu przez chwile w rundzie 5 -- wywalil ja straznik [8b].)
  //     NIE renderowane (jawnie usuniete w T-KARTY-HISTORIA-INFRA-Q1):
  //       uwagi, tech_uwaga, cywilizacje_uwaga, surowiecOdblokowany_uwaga -- poza
  //       skanem SWIADOMIE (to zapisy decyzyjne; `farma.uwagi` niesie historyczne
  //       "najpierw wyrąb" i ma je zachowac).
  //
  //     RUNDA 5: lista BLOKAD `ZNANE_BLOKADY_JSON` USUNIETA razem ze swoja przyczyna
  //     -- `farma.warunek` naprawiony w R5-1. Asercja jest teraz ZERO-TOLERANCYJNA:
  //     kazde trafienie w polach gracza poza whitelista uzyc pospolitych = FAIL.
  // -----------------------------------------------------------------------
  const POLA_GRACZA = ['nazwa', 'typ', 'teren', 'warunek', 'tech',
    'cywilizacje', 'surowiecOdblokowany', 'odblokowuje', 'bonus_ruch_uwaga',
    'upgradeFrom', 'historia'];
  const improvements = JSON.parse(
    fs.readFileSync(path.join(GRA, 'data', 'terrain-improvements.json'), 'utf8'));

  const trafieniaJson = [];
  for (const [klucz, wpis] of Object.entries(improvements)) {
    if (klucz.startsWith('_')) continue; // `_meta` nie jest wpisem ulepszenia
    for (const pole of POLA_GRACZA) {
      // `cywilizacje` jest tablica stringow (adapter robi join) -- skanuj kazdy element.
      const wartosci = Array.isArray(wpis[pole]) ? wpis[pole] : [wpis[pole]];
      for (const val of wartosci) {
        if (typeof val !== 'string') continue;
        const re = /[Ww]yrąb/g;
        let m;
        while ((m = re.exec(val)) !== null) {
          if (DOZWOLONE_WYRAB.some((fraza) => zakotwiczona(val, m.index, fraza))) continue;
          trafieniaJson.push({ klucz, pole, kontekst: val.slice(Math.max(0, m.index - 40), m.index + 40) });
        }
      }
    }
  }
  check('[8] terrain-improvements.json (KOMPLET pol renderowanych graczowi): ZERO'
    + ' wystapien "wyrab" w roli nazwy ulepszenia -- zadnych wyjatkow',
    trafieniaJson.length === 0, trafieniaJson);
  check('[8] farma.warunek (wiersz "Warunek" karty) wskazuje ulepszenie "Wycinka" (R5-1)',
    improvements.farma && improvements.farma.warunek
      === 'ziemia uprawna; rzeka NIE jest wymagana; NIE na lesie — najpierw Wycinka.',
    improvements.farma && improvements.farma.warunek);
  check('[8] farma.uwagi (zapis decyzyjny, NIE renderowany) NIETKNIETY -- zachowuje'
    + ' historyczne "najpierw wyrąb"',
    improvements.farma && typeof improvements.farma.uwagi === 'string'
      && improvements.farma.uwagi.includes('najpierw wyrąb (Maciej 2026-08-27'),
    improvements.farma && improvements.farma.uwagi);
  check('[8] sanity: skan objal realne pola kart (nazwa wpisu "wyrab" == "Wycinka",'
    + ' historia obecna)',
    improvements.wyrab && improvements.wyrab.nazwa === 'Wycinka'
      && typeof improvements.wyrab.historia === 'string'
      && improvements.wyrab.historia.length > 100,
    improvements.wyrab && improvements.wyrab.nazwa);

  // [8b] STRAZNIK POKRYCIA bloku [8] -- ten sam wzorzec co [7] dla bundla.
  // Sam skan nie wykryje literowki w nazwie pola (brak pola == undefined == zero
  // trafien == PASS). Ta asercja wymaga, by kazde pole z POLA_GRACZA faktycznie
  // istnialo w danych i by skan objal realna objetosc tekstu kart.
  const polaObecne = POLA_GRACZA.filter((pole) => Object.entries(improvements)
    .some(([k, w]) => !k.startsWith('_')
      && (typeof w[pole] === 'string' || Array.isArray(w[pole]))));
  const brakujacePola = POLA_GRACZA.filter((p) => !polaObecne.includes(p));
  check('[8b] kazde pole z POLA_GRACZA istnieje realnie w terrain-improvements.json'
    + ' (literowka/przemianowanie pola oslepiloby skan zamiast go wywalic)',
    brakujacePola.length === 0, brakujacePola);

  // -----------------------------------------------------------------------
  // [9] SAMOTEST MECHANIZMU WHITELISTY (R5-3). Runda 4, zarzut 3: dopasowanie bylo
  //     KONTEKSTOWE (fraza gdziekolwiek w oknie +-40 znakow), wiec nazwa ulepszenia
  //     postawiona blisko dozwolonej frazy byla cicho zaslaniana. Obrona rundy 4
  //     zamienila to na dopasowanie ZAKOTWICZONE (`zakotwiczona`). Ponizsze przypadki
  //     to DOWOD, ze poprawka dziala -- nie deklaracja. Uzywaja tej samej funkcji i
  //     tej samej whitelisty `DOZWOLONE_WYRAB`, co bloki [6] i [8].
  //
  //     Skan pomocniczy: identyczna petla co w [6]/[8], na tekscie syntetycznym.
  // -----------------------------------------------------------------------
  function skanujTekst(tekst) {
    const out = [];
    const re = /[Ww]yrąb/g;
    let m;
    while ((m = re.exec(tekst)) !== null) {
      if (DOZWOLONE_WYRAB.some((fraza) => zakotwiczona(tekst, m.index, fraza))) continue;
      out.push(m.index);
    }
    return out;
  }

  // Dokladnie ta pulapka z zarzutu 3: NAZWA ulepszenia ("Wyrąb" wielka litera, jako
  // pozycja panelu) stoi 24 znaki od dozwolonej frazy "wyrąb lasu" -- czyli wewnatrz
  // dawnego okna +-40. Przy starym, kontekstowym dopasowaniu bylaby przepuszczona.
  const PULAPKA_40 = 'Zlecony wyrąb lasu trwa 3 tury; Wyrąb w panelu ulepszeń.';
  const odlegloscZnakow = PULAPKA_40.indexOf('Wyrąb w panelu') - PULAPKA_40.indexOf('wyrąb lasu');
  check('[9] przypadek testowy stoi w promieniu 40 znakow od dozwolonej frazy'
    + ' (inaczej nie testowalby niczego)',
    odlegloscZnakow > 0 && odlegloscZnakow <= 40, odlegloscZnakow);
  const trafieniaPulapki = skanujTekst(PULAPKA_40);
  check('[9] KOTWICZENIE DZIALA: nazwa ulepszenia w promieniu 40 znakow od dozwolonej'
    + ' frazy JEST wykrywana (dokladnie 1 trafienie -- nazwa, nie czasownik)',
    trafieniaPulapki.length === 1
      && trafieniaPulapki[0] === PULAPKA_40.indexOf('Wyrąb w panelu'),
    { trafieniaPulapki, oczekiwanyIndeks: PULAPKA_40.indexOf('Wyrąb w panelu') });
  check('[9] kontrola negatywna: sama dozwolona fraza (bez nazwy obok) NIE jest'
    + ' zglaszana -- whitelista nadal dziala',
    skanujTekst('Zlecony wyrąb lasu trwa 3 tury.').length === 0);
  check('[9] kontrola negatywna: nazwa ulepszenia BEZ dozwolonej frazy w poblizu'
    + ' jest zglaszana',
    skanujTekst('Wybierz Wyrąb w panelu ulepszeń.').length === 1);

  console.log('');
  console.log(`[wyrab-wycinka-nazwa-live-test] ${pass} pass, ${fail} fail`);
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  process.exit(1);
});
