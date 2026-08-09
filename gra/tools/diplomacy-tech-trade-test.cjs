'use strict';
/**
 * diplomacy-tech-trade-test.cjs — R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE (2026-08-08).
 * Zgłoszenie Macieja (playtest): koszyk handlu technologiami pokazywał identyczną listę
 * po obu stronach (daję/dostaję), bez filtrowania po tym, czy druga strona już ją ma.
 * Test pokrywa czystą funkcję filtrującą (game/diplomacy-tech-trade.ts), używaną
 * symetrycznie przez main.ts::getSellableTechForPlayer („daję") i getBuyableTechFromOwner
 * („dostaję") — patrz PARITY.
 *
 * ROZSZERZENIE (2026-08-09, dwa follow-up zgłoszenia tej samej naprawy):
 *   - P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE: `techIdsWithPrereqsMetForRecipient` — druga
 *     warstwa filtra listy, tym razem po prerekwizytach drzewka odbiorcy (nie po tym, czy
 *     druga strona już zna technologię). Bramka epoki/tieru osobno pokryta w
 *     diplomacy-basket-transfer-test.cjs razem z silnikową blokadą (grantTechToOwner) —
 *     tu katalog celowo BEZ pól Epoka/Poziom, żeby izolować oś prereq od osi epoki.
 *   - P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU: `buildAddForm`/`readItemFromForm`
 *     (ui/diplomacyTradeBasket.ts) — placeholder pustej listy + brak pozycji-widma.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

async function main() {
  console.log('diplomacy-tech-trade-test');

  // =========================================================================
  // Część 1 — tradeableTechIdsForSide (istniejące pokrycie) + techIdsWithPrereqsMetForRecipient
  // =========================================================================
  {
    const BUNDLE = path.resolve(__dirname, '.dip-tech-trade-bundle.cjs');
    const entry = path.resolve(__dirname, '.dip-tech-trade-entry.ts');
    fs.writeFileSync(entry, `
export { tradeableTechIdsForSide, techIdsWithPrereqsMetForRecipient } from '../src/game/diplomacy-tech-trade.ts';
`);
    esbuild.buildSync({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: BUNDLE,
      absWorkingDir: path.resolve(__dirname, '..'),
      logLevel: 'silent',
    });
    const { tradeableTechIdsForSide, techIdsWithPrereqsMetForRecipient } = require(BUNDLE);

    // Scenariusz: gracz (offering) zna 'rolnictwo' i 'garncarstwo'; responder zna
    // 'garncarstwo' i 'ceramika'. Wspólna: garncarstwo. Tylko-offering: rolnictwo.
    // Tylko-responder: ceramika. Żadna strona: 'zelazo'.
    const offeringKnown = new Set(['rolnictwo', 'garncarstwo']);
    const responderKnown = new Set(['garncarstwo', 'ceramika']);

    const giveList = tradeableTechIdsForSide(offeringKnown, responderKnown);
    const receiveList = tradeableTechIdsForSide(responderKnown, offeringKnown);

    // 1) Tech znana przez OBIE strony (garncarstwo) wykluczona z obu list.
    ok(!giveList.includes('garncarstwo'), 'garncarstwo (obie strony) NIE na liście "daję"');
    ok(!receiveList.includes('garncarstwo'), 'garncarstwo (obie strony) NIE na liście "dostaję"');

    // 2) Tech znana TYLKO przez oferującego (rolnictwo) -> tylko na liście "daję".
    ok(giveList.includes('rolnictwo'), 'rolnictwo (tylko oferujący) NA liście "daję"');
    ok(!receiveList.includes('rolnictwo'), 'rolnictwo (tylko oferujący) NIE na liście "dostaję"');

    // 2b) symetrycznie: tech znana tylko przez respondenta (ceramika) -> tylko "dostaję".
    ok(receiveList.includes('ceramika'), 'ceramika (tylko responder) NA liście "dostaję"');
    ok(!giveList.includes('ceramika'), 'ceramika (tylko responder) NIE na liście "daję"');

    // 3) Tech znana przez ŻADNĄ ze stron (zelazo) nie pojawia się jako tradeable w żadnym
    //    kierunku (funkcja operuje tylko na przekazanych zbiorach zbadanych technologii —
    //    nieznana obu stronom nigdy nie wejdzie do ownKnown, więc nie może się pojawić).
    ok(!giveList.includes('zelazo') && !receiveList.includes('zelazo'), 'zelazo (żadna strona) nietradeable w żadnym kierunku');

    // Parytet rozmiaru: dokładnie 1 pozycja na każdej liście (po odjęciu wspólnej).
    ok(giveList.length === 1 && receiveList.length === 1, 'po 1 unikalnej technologii na każdej stronie');

    // -----------------------------------------------------------------------
    // P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE — techIdsWithPrereqsMetForRecipient
    // Katalog celowo BEZ Epoka/Poziom -> izoluje oś prereq (Zasada epoki/tieru
    // pokryta osobno, patrz diplomacy-basket-transfer-test.cjs).
    // -----------------------------------------------------------------------
    console.log('techIdsWithPrereqsMetForRecipient (P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE)');

    const catalog = [
      { Technologia: 'Rolnictwo' },
      { Technologia: 'Kolo', 'Wymaga (prereq)': 'Rolnictwo' },
      { Technologia: 'Ceramika' },
    ];

    // a) Odbiorca BEZ Rolnictwo → Kolo (prereq: Rolnictwo) odpada z listy, Ceramika (bez
    //    prereq) zostaje.
    {
      const recipientKnown = new Set();
      const out = techIdsWithPrereqsMetForRecipient(['Kolo', 'Ceramika'], recipientKnown, catalog);
      ok(!out.includes('Kolo'), 'Kolo (prereq Rolnictwo niespełniony) odpada z listy odbiorcy');
      ok(out.includes('Ceramika'), 'Ceramika (bez prereq) zostaje na liście odbiorcy');
    }

    // b) Odbiorca MA Rolnictwo → Kolo wraca na listę.
    {
      const recipientKnown = new Set(['Rolnictwo']);
      const out = techIdsWithPrereqsMetForRecipient(['Kolo', 'Ceramika'], recipientKnown, catalog);
      ok(out.includes('Kolo'), 'Kolo (prereq Rolnictwo spełniony) NA liście odbiorcy');
    }

    // c) Id spoza katalogu przechodzi bez zmian (walidacja istnienia — gdzie indziej).
    {
      const out = techIdsWithPrereqsMetForRecipient(['NieznanaTech'], new Set(), catalog);
      ok(out.includes('NieznanaTech'), 'id spoza katalogu przechodzi bez zmian (nie jest tu walidowane)');
    }

    // d) Integracja jak w main.ts: tradeableTechIdsForSide → techIdsWithPrereqsMetForRecipient.
    //    Responder zna Ceramika+Kolo (ale NIE Rolnictwo — stan niespójny z drzewkiem, możliwy
    //    np. po starcie z bonusem); gracz nie zna nic. Lista "dostaję" (odbiorcą jest gracz,
    //    który nie zna Rolnictwo) musi odrzucić Kolo mimo że responder je ma.
    {
      const responderKnown = new Set(['Ceramika', 'Kolo']);
      const playerKnown = new Set();
      const tradeable = tradeableTechIdsForSide(responderKnown, playerKnown);
      ok(tradeable.includes('Kolo'), 'kontrola: bez drugiej warstwy Kolo byłoby na liście "dostaję"');
      const filtered = techIdsWithPrereqsMetForRecipient(tradeable, playerKnown, catalog);
      ok(!filtered.includes('Kolo'), 'PO drugiej warstwie: Kolo znika (gracz nie ma prereq Rolnictwo)');
      ok(filtered.includes('Ceramika'), 'Ceramika (bez prereq) zostaje mimo tej samej warstwy filtra');
    }

    try { fs.unlinkSync(entry); } catch (_) {}
    try { fs.unlinkSync(BUNDLE); } catch (_) {}
  }

  // =========================================================================
  // Część 2 — P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU: placeholder + no-op
  // (ui/diplomacyTradeBasket.ts::buildAddForm / readItemFromForm)
  // =========================================================================
  {
    console.log('buildAddForm / readItemFromForm — pusta lista technologii (P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU)');

    let JSDOM;
    try { ({ JSDOM } = require('jsdom')); }
    catch (e) {
      console.error('jsdom missing — npm i -D jsdom');
      process.exit(1);
    }

    const STUB_DIR = path.resolve(__dirname, '.stubs');
    const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'leaderPortraits-tech-trade-stub.ts');
    const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'brandAssets-tech-trade-stub.ts');
    fs.mkdirSync(STUB_DIR, { recursive: true });
    fs.writeFileSync(
      LEADER_PORTRAITS_STUB,
      [
        "export function leaderPortraitUrl() { return null; }",
        "export function leaderName() { return null; }",
        "export function leaderNameFromPool() { return null; }",
        "export function civDisplayNameFromKey() { return null; }",
        "export function civCardDisplayName(label) { return label; }",
        "export function civIconIdFromCivLabel() { return null; }",
      ].join('\n'),
      'utf8',
    );
    fs.writeFileSync(
      BRAND_ASSETS_STUB,
      [
        "export function brandIconSvg() { return ''; }",
        "export function improvementIconSvg() { return ''; }",
        "export function mapResourceIconSvg() { return ''; }",
        "export function terrainIconSvg() { return ''; }",
        "export function buildingIconSvg() { return ''; }",
        "export function unitIconSvg() { return ''; }",
        "export function civIconSvg() { return ''; }",
        "export function epochIconSvg() { return ''; }",
        "export function settingIconSvg() { return ''; }",
        "export function brandMenuComponentsCss() { return ''; }",
        "export function menuIconSvg() { return ''; }",
        "export function brandMenuEmblemSvg() { return ''; }",
        "export function newGameIntroEmblemSvg() { return ''; }",
        "export function brandMotionCss() { return ''; }",
        "export function brandMenuBackgroundCss() { return ''; }",
        "export function svgThumbHtml() { return ''; }",
      ].join('\n'),
      'utf8',
    );

    const BUNDLE = path.resolve(__dirname, '.dip-tech-trade-ui-bundle.cjs');
    const entryFile = path.resolve(__dirname, '.dip-tech-trade-ui-entry.ts');
    fs.writeFileSync(entryFile, `
export { buildAddForm, readItemFromForm } from '../src/ui/diplomacyTradeBasket.ts';
`);

    const stubViteAssetsPlugin = {
      name: 'stub-vite-assets',
      setup(build) {
        build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_PORTRAITS_STUB }));
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
      },
    };

    await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: BUNDLE,
      absWorkingDir: path.resolve(__dirname, '..'),
      logLevel: 'silent',
      loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
      plugins: [stubViteAssetsPlugin],
    });

    const { buildAddForm, readItemFromForm } = require(BUNDLE);

    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;

    function baseCtx(over) {
      return Object.assign({ civName: 'Test', relacjaTotal: 200, progHandelRelacja: 100 }, over || {});
    }

    function mount(html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div;
    }

    // a) Lista PUSTA (give): placeholder zamiast siatki chipów; hidden input .cdb-tech = ''.
    {
      const html = buildAddForm('give', baseCtx({ giveTechOptions: [] }), 'trade', '14');
      ok(html.includes('brak technologii'), 'give: pusta lista → placeholder „— brak technologii (SILNIK) —"');
      ok(!html.includes('cdb-chip-tech'), 'give: pusta lista → ZERO chipów cdb-chip-tech w markupie');
      const box = mount(html);
      const hidden = box.querySelector('.cdb-tech[data-side="give"]');
      ok(hidden !== null && hidden.value === '', 'give: pusta lista → hidden .cdb-tech ma wartość "" (nie stary/losowy id)');
    }

    // b) Lista PUSTA (receive) — obie strony pokrywa ten sam placeholder.
    {
      const html = buildAddForm('receive', baseCtx({ receiveTechOptions: [] }), 'trade', '14');
      ok(html.includes('brak technologii'), 'receive: pusta lista → placeholder obecny');
      ok(!html.includes('cdb-chip-tech'), 'receive: pusta lista → ZERO chipów cdb-chip-tech');
    }

    // c) readItemFromForm na formularzu z pustą listą techów (typ ręcznie ustawiony na
    //    'tech', jak po kliknięciu chipa typu) MUSI zwrócić null — nie pozycję-widmo.
    {
      const html = buildAddForm('give', baseCtx({ giveTechOptions: [] }), 'trade', '14');
      const box = mount(html);
      const typInput = box.querySelector('.cdb-typ[data-side="give"]');
      typInput.value = 'tech';
      const item = readItemFromForm('give', box, baseCtx({ giveTechOptions: [] }));
      ok(item === null, '„Dodaj" z pustą listą technologii → readItemFromForm zwraca null (bez pozycji-widma)');
    }

    // d) Kontrola pozytywna: lista NIEpusta renderuje chipy i zwraca prawdziwą pozycję.
    {
      const opts = [{ id: 'Kolo', label: 'Kolo', suggestedPrice: 50 }];
      const html = buildAddForm('give', baseCtx({ giveTechOptions: opts }), 'trade', '14');
      ok(!html.includes('brak technologii'), 'give: lista niepusta → BEZ placeholdera');
      ok(html.includes('cdb-chip-tech'), 'give: lista niepusta → chip(y) cdb-chip-tech obecne');
      const box = mount(html);
      const typInput = box.querySelector('.cdb-typ[data-side="give"]');
      typInput.value = 'tech';
      const item = readItemFromForm('give', box, baseCtx({ giveTechOptions: opts }));
      ok(item !== null && item.id === 'Kolo', 'kontrola pozytywna: readItemFromForm zwraca realną pozycję (Kolo)');
    }

    try { fs.unlinkSync(entryFile); } catch (_) {}
    try { fs.unlinkSync(BUNDLE); } catch (_) {}
    try { fs.unlinkSync(LEADER_PORTRAITS_STUB); } catch (_) {}
    try { fs.unlinkSync(BRAND_ASSETS_STUB); } catch (_) {}
  }

  console.log(`\ndiplomacy-tech-trade-test: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
