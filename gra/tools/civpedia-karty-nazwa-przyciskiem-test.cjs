'use strict';
/**
 * civpedia-karty-nazwa-przyciskiem-test.cjs
 *
 * TEMAT: P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 (GOAL 4).
 *
 * Zgłoszenie właściciela: „brązowienie powinno być przyciskiem bez szczegółów, otoczone
 * ramką, i po najechaniu ma się podświetlać" — czyli przyciskiem ma być SAMA NAZWA encji,
 * a tekst „Szczegóły →" ma zniknąć całkowicie, spójnie na wszystkich typach kart.
 * Wzorzec odniesienia (wskazany przez właściciela jako JEDYNY zrobiony dobrze):
 * pigułka Wymagań `button.entity-card-pill-text` — sama nazwa w ramce, bez podkreślenia.
 *
 * DLACZEGO NOWA BRAMKA, a nie rozszerzenie istniejącej (decyzja Operatora):
 * żadna z bramek `civpedia-*` nie mierzy dziś kluczowej asercji tego tematu — zgodności
 * prostokąta NARYSOWANEGO pudełka z prostokątem elementu realnie ŁAPIĄCEGO klik. To jest
 * asercja przeciw konkretnemu, historycznie potwierdzonemu w TYM module błędowi (RUNDA 1
 * OBRONA, `renderer.ts`: pudełko pomalowane na KONTENERZE `.entity-card-pill`, zmierzone
 * 88,1x22,2 px „przycisku" wobec 52,0x16,2 px realnie klikalnego tekstu — 41% szerokości
 * martwej strefy z mylącym `cursor:pointer`). Trzymanie jej w osobnym pliku razem z resztą
 * kontraktu „nazwa = przycisk" jest czytelniejsze niż doklejanie do bramek o innym temacie
 * i nie destabilizuje bramek już zielonych.
 *
 * ŻYWY CHROMIUM, nie jsdom: jsdom nie robi realnego hit-testingu (`elementFromPoint`),
 * nie liczy `getComputedStyle` kaskady ani nie odtwarza `:hover` — a wszystkie trzy są tu
 * przedmiotem pomiaru (precedens: `tech-discovery-card-real-click-test.cjs`,
 * `entity-card-cross-links-button-style-real-render-test.cjs`).
 *
 * Usage (z gra/): node tools/civpedia-karty-nazwa-przyciskiem-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-karty-nazwa-przyciskiem-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ENTRY = path.resolve(__dirname, '.civpedia-nazwa-przyciskiem-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-nazwa-przyciskiem-bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Pomiar jednego przycisku: pudełko, styl, hit-test, zgodność prostokątów. */
function probeFn(sel) {
  const btn = document.querySelector(sel);
  if (!btn) return null;
  // Przycisk musi być W POLU WIDZENIA przyciętego, przewijalnego boxa karty — inaczej
  // elementFromPoint mierzy punkt POZA kartą i zwraca tło (to nie jest defekt produktu,
  // tylko artefakt pomiaru; patrz GOAL 3 tematu).
  btn.scrollIntoView({ block: 'center' });
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hit = document.elementFromPoint(cx, cy);
  const hr = hit ? hit.getBoundingClientRect() : null;
  const cs = getComputedStyle(btn);
  return {
    tag: btn.tagName,
    cls: btn.className,
    text: (btn.textContent || '').trim(),
    kind: btn.getAttribute('data-entity-kind'),
    id: btn.getAttribute('data-entity-id'),
    borderWidth: cs.borderTopWidth,
    borderColor: cs.borderTopColor,
    textDecorationLine: cs.textDecorationLine,
    padding: cs.paddingTop + ' ' + cs.paddingRight,
    box: { w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
    cx, cy,
    hitIsSelf: hit === btn,
    hitTag: hit ? hit.tagName : null,
    hitCls: hit ? String(hit.className) : null,
    dLeft: hr ? +Math.abs(hr.left - r.left).toFixed(2) : null,
    dTop: hr ? +Math.abs(hr.top - r.top).toFixed(2) : null,
    dW: hr ? +Math.abs(hr.width - r.width).toFixed(2) : null,
    dH: hr ? +Math.abs(hr.height - r.height).toFixed(2) : null,
  };
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { openEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { showTechDiscoveryNotice } from '../src/ui/techDiscoveryNotice.ts';",
    'window.__openEntityCard = openEntityCard;',
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    'window.__showTechDiscoveryNotice = showTechDiscoveryNotice;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: path.resolve(STUB_DIR, 'improvement-callsites-brandAssets-stub.ts') }));
        build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: path.resolve(STUB_DIR, 'improvement-callsites-scienceOwlIcon-stub.ts') }));
      },
    }],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  try {
    // =====================================================================
    // A) KARTA TECHNOLOGII — realny call-site (popup odkrycia), pełny arkusz.
    //    „Obróbka drewna" ma NIEPUSTE sekcje Budynki / Jednostki / Ulepszenia
    //    terenu / Kolejne technologie, więc ćwiczy wszystkie cztery kształty wiersza.
    // =====================================================================
    await page.setContent('<!DOCTYPE html><html><head><title>nazwa-przyciskiem</title></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
    await page.evaluate(() => {
      window.__showTechDiscoveryNotice({ techName: 'Obróbka drewna', eraIndex: 1, kind: 'preview' });
    });

    // Sekcja „Ulepszenia terenu" jest collapsible (openDefault:false) — rozwiń realnym klikiem.
    const headRect = await page.evaluate(() => {
      const h = document.querySelector('[data-section-key="improvements"] .entity-card-section-head');
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
    check('fixture: karta technologii „Obróbka drewna" ma sekcję „Ulepszenia terenu"', !!headRect, headRect);
    if (headRect) await page.mouse.click(headRect.cx, headRect.cy);

    const TECH_HOST = '#civ-tech-discovery-notice-host ';

    // --- (1) wiersz BUDYNKU: przyciskiem jest NAZWA, nie „Szczegóły →" ---------------
    const bld = await page.evaluate(probeFn, TECH_HOST + '[data-section-key="buildings"] button[data-entity-kind="building"]');
    check('(1) karta technologii: wiersz Budynku ma <button data-entity-kind="building">',
      !!bld && bld.tag === 'BUTTON' && bld.kind === 'building', bld);
    check('(1) treścią tego przycisku jest NAZWA budynku, nie „Szczegóły →"',
      !!bld && bld.text.length > 0 && !/Szczegóły/.test(bld.text) && bld.text === 'Stolarnia', bld && bld.text);
    check('(1) przycisk nazwy budynku niesie klasę .entity-card-row-key (etykieta = kotwica linku)',
      !!bld && /entity-card-row-key/.test(bld.cls), bld && bld.cls);

    // --- (2) styl: ramka jest, podkreślenia nie ma ------------------------------------
    check('(2) getComputedStyle: border-width przycisku nazwy ≠ 0',
      !!bld && parseFloat(bld.borderWidth) > 0, bld && bld.borderWidth);
    check('(2) getComputedStyle: text-decoration-line przycisku nazwy = none (bez podkreślenia)',
      !!bld && bld.textDecorationLine === 'none', bld && bld.textDecorationLine);

    // --- (3) pudełko == obszar łapiący klik (tolerancja 2px) ---------------------------
    // ASERCJA PRZECIW POWTÓRCE RUNDY 1 OBRONY: element rysujący ramkę MUSI być tym samym
    // elementem, który łapie kliknięcie. Inaczej „przycisk" jest tylko obrazkiem przycisku.
    check('(3) pudełko przycisku pokrywa się z elementem łapiącym klik (tolerancja ≤2px)',
      !!bld && bld.hitIsSelf === true
        && bld.dLeft <= 2 && bld.dTop <= 2 && bld.dW <= 2 && bld.dH <= 2, bld);

    // --- (4) hover podświetla ramkę na złoto -------------------------------------------
    const hoverProbe = await page.evaluate(probeFn, TECH_HOST + '[data-section-key="buildings"] button[data-entity-kind="building"]');
    const before = hoverProbe && hoverProbe.borderColor;
    await page.mouse.move(hoverProbe.cx, hoverProbe.cy);
    await page.waitForTimeout(120);
    const after = await page.evaluate(() => {
      const b = document.querySelector('#civ-tech-discovery-notice-host [data-section-key="buildings"] button[data-entity-kind="building"]');
      const cs = getComputedStyle(b);
      return { borderColor: cs.borderTopColor, color: cs.color };
    });
    // Złoty #e8d88a = rgb(232, 216, 138); stan spoczynku to ta sama barwa z alfa .42.
    check('(4) hover zmienia border-color przycisku nazwy (pomiar przed/po)',
      !!before && !!after && before !== after.borderColor, { before, after });
    check('(4) border-color po najechaniu to pełny złoty rgb(232, 216, 138)',
      !!after && after.borderColor.replace(/\s/g, '') === 'rgb(232,216,138)', after);
    await page.mouse.move(5, 5);

    // --- (6) realny klik w NAZWĘ otwiera właściwą kartę encji ---------------------------
    const hitBeforeClick = await page.evaluate(probeFn, TECH_HOST + '[data-section-key="buildings"] button[data-entity-kind="building"]');
    check('(6) elementFromPoint w środku nazwy budynku trafia w BUTTON (nie w tło/kartę)',
      !!hitBeforeClick && hitBeforeClick.hitTag === 'BUTTON', hitBeforeClick);
    await page.mouse.click(hitBeforeClick.cx, hitBeforeClick.cy);
    await page.waitForTimeout(200);
    const nested = await page.evaluate(() => {
      const c = document.querySelector('.entity-card-building');
      return c ? { kind: c.getAttribute('data-entity-kind'), id: c.getAttribute('data-entity-id') } : null;
    });
    check('(6) realny klik w NAZWĘ budynku otwiera kartę encji building/stolarnia',
      !!nested && nested.kind === 'building' && nested.id === 'stolarnia', nested);

    // --- (7) parytet z WZORCEM: pigułka Wymagań ----------------------------------------
    // Właściciel wskazał `button.entity-card-pill-text` jako jedyny wiersz zrobiony dobrze.
    // Przycisk nazwy ma wyglądać TAK SAMO, nie „podobnie".
    const pill = await page.evaluate(probeFn, TECH_HOST + 'button.entity-card-pill-text, ' + TECH_HOST + 'button.entity-card-row-action-text');
    check('(7) wzorzec odniesienia (pigułka/nazwa w ramce) istnieje i jest <button>',
      !!pill && pill.tag === 'BUTTON', pill);
    check('(7) przycisk nazwy ma TĘ SAMĄ ramkę, padding i brak podkreślenia co wzorzec',
      !!bld && !!pill
        && bld.borderWidth === pill.borderWidth
        && bld.padding === pill.padding
        && bld.textDecorationLine === pill.textDecorationLine,
      { nazwa: bld && { b: bld.borderWidth, p: bld.padding, d: bld.textDecorationLine },
        wzorzec: pill && { b: pill.borderWidth, p: pill.padding, d: pill.textDecorationLine } });

    // --- (5) SKAN NEGATYWNY: „Szczegóły →" nie istnieje w DOM ŻADNEJ z czterech kart ----
    // Skan na karcie technologii wykonujemy tu (wszystkie sekcje rozwinięte), pozostałe
    // trzy typy kart poniżej, w bloku B.
    const techScan = await page.evaluate(() => {
      const host = document.getElementById('civ-tech-discovery-notice-host');
      // rozwiń WSZYSTKIE sekcje, żeby skan objął też treść schowaną za akordeonem
      host.querySelectorAll('.entity-card-section-head').forEach((h) => {
        const sec = h.closest('.entity-card-section');
        if (sec && sec.querySelector('[hidden]')) h.click();
      });
      host.querySelectorAll('[hidden]').forEach((el) => el.removeAttribute('hidden'));
      return { text: host.textContent || '', buttons: host.querySelectorAll('button').length };
    });
    check('(5) karta TECHNOLOGII: „Szczegóły →" NIE występuje w DOM',
      !/Szczegóły/.test(techScan.text), techScan.text.match(/.{0,40}Szczegóły.{0,20}/));

    // =====================================================================
    // B) POZOSTAŁE TRZY TYPY KART — budynek / jednostka / ulepszenie terenu.
    //    `openEntityCard` NIE wstrzykuje arkusza sam (robi to wołający), więc
    //    wstrzykujemy ENTITY_CARD_CSS jawnie — bez tego pomiar stylu jest bezwartościowy.
    // =====================================================================
    // Czwarta kolumna = OCZEKIWANA liczba linków krzyżowych na karcie. Nazywamy ją JAWNIE,
    // bo `links.every(...)` na zbiorze PUSTYM jest prawdziwe — bez tej asercji karta bez
    // linków przechodziłaby kontrolę stylu, nie mając czego sprawdzić, i nikt by nie
    // zauważył, gdyby linki zniknęły też z pozostałych kart. Karta budynku nie ma dziś
    // ANI JEDNEGO wiersza z `linkTo` (`buildingAdapter.ts` nie ustawia go nigdzie) — to
    // udokumentowany stan zastany, nie brak pokrycia; jeśli kiedyś dostanie link, ta
    // asercja zaczerwieni się i wymusi świadomą aktualizację zamiast cichego przejścia.
    const others = [
      ['building', 'stolarnia', 'BUDYNKU', 0],
      ['unit', 'taran', 'JEDNOSTKI', 1],
      ['improvement', 'tartak', 'ULEPSZENIA TERENU', 1],
    ];
    for (const [kind, id, label, expectedLinks] of others) {
      await page.setContent('<!DOCTYPE html><html><head><title>' + kind + '</title></head><body></body></html>');
      await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
      await page.evaluate(() => {
        const st = document.createElement('style');
        st.textContent = window.__ENTITY_CARD_CSS;
        document.head.appendChild(st);
      });
      const opened = await page.evaluate(({ k, i }) => {
        window.__openEntityCard(k, i, { mode: 'dialog' });
        return !!document.querySelector('.entity-card');
      }, { k: kind, i: id });
      check('fixture: karta ' + label + ' (' + kind + '/' + id + ') otwiera się', opened === true, opened);

      const scan = await page.evaluate(() => {
        document.querySelectorAll('[hidden]').forEach((el) => el.removeAttribute('hidden'));
        const card = document.querySelector('.entity-card');
        return { text: card ? (card.textContent || '') : '' };
      });
      check('(5) karta ' + label + ': „Szczegóły →" NIE występuje w DOM',
        !/Szczegóły/.test(scan.text), scan.text.match(/.{0,40}Szczegóły.{0,20}/));

      // Każdy link krzyżowy na tej karcie musi spełniać kontrakt „pudełko == klik".
      const links = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('.entity-card button[data-entity-kind]').forEach((btn) => {
          btn.scrollIntoView({ block: 'center' });
          const r = btn.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          const hr = hit ? hit.getBoundingClientRect() : null;
          const cs = getComputedStyle(btn);
          out.push({
            text: (btn.textContent || '').trim(),
            borderWidth: cs.borderTopWidth,
            textDecorationLine: cs.textDecorationLine,
            hitIsSelf: hit === btn,
            dW: hr ? +Math.abs(hr.width - r.width).toFixed(2) : null,
            dH: hr ? +Math.abs(hr.height - r.height).toFixed(2) : null,
          });
        });
        return out;
      });
      // Najpierw NAZWIJ liczbę mierzonych linków, dopiero potem mierz ich styl — inaczej
      // `every` na pustym zbiorze daje zielone „sprawdziłem" tam, gdzie nie sprawdzono nic.
      check('(3) karta ' + label + ': liczba linków krzyżowych = ' + expectedLinks
        + (expectedLinks === 0 ? ' (buildingAdapter.ts nie ustawia `linkTo` nigdzie — stan zastany, nie luka)' : ''),
        links.length === expectedLinks, { kind, oczekiwano: expectedLinks, zmierzono: links.length, links });
      check('(3) karta ' + label + ': każdy link krzyżowy ma ramkę, brak podkreślenia i pudełko == obszar klikalny (≤2px)',
        links.length === expectedLinks
          && links.every((l) => parseFloat(l.borderWidth) > 0 && l.textDecorationLine === 'none'
            && l.hitIsSelf === true && l.dW <= 2 && l.dH <= 2),
        { kind, links });
    }

    check('zero błędów konsoli/pageerror w całym przebiegu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('\n[civpedia-karty-nazwa-przyciskiem-test] ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
