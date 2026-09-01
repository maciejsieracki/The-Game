'use strict';
/**
 * diplomacy-relacje-ai-ai-audiencja-test.cjs — R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1.
 *
 * Właściciel: audiencja z cywilizacją AI ma pokazywać, z kim JESZCZE ta cywilizacja
 * (rozmówca) jest w stanie wojny / sojuszu / handlu — niezależnie od tego, czy gracz
 * sam nawiązał kontakt z tą trzecią stroną (faza testowa, docelowo bramkowane jednostką
 * szpiega — 00-dispatch.md GOAL).
 *
 * Trzy części, każda chroni inny warstwę:
 *
 *  CZĘŚĆ A (silnik, engine-only) — `diplomacy-pair-summary.ts`:
 *    A1. `dealPartnerIdsForOwner(..., 'nap')` zwraca partnerów PaktNieagresji (nowa
 *        trzecia kategoria dopisana w tej rundzie — GOAL pkt 4, ActiveDeal REALNIE
 *        niesie 'pakt_nieagresji' jako RodzajTraktatu, sprawdzone w types/diplomacy.ts).
 *    A2. KRYTERIUM KOŃCA 1/2 na poziomie silnika: scenariusz z TRZECIĄ stroną (owner 7),
 *        której gracz (owner 0) NIGDY nie nawiązał kontaktu — `isVisiblePartner` typu
 *        pop-upu (owner!==0 wymaga kontaktu) UKRYWA ją; wywołanie BEZ `isVisiblePartner`
 *        (revealAll, tak jak w nowej ścieżce audiencji) POKAZUJE ją. To jest realny,
 *        jawnie skonstruowany przypadek nieznanego trzeciego gracza (REGUŁA PRZECIW
 *        SAMOOSZUKIWANIU dispatcha), nie scenariusz w którym gracz akurat zna wszystkich.
 *
 *  CZĘŚĆ B (main.ts, tekstowy pin) — chroni WIĄZANIE, nie tylko funkcje w oderwaniu:
 *    B1. `buildDiploPairSummaryData` ma parametr `revealAll = false` (domyślnie
 *        NIETKNIĘTE zachowanie pop-upu — KRYTERIUM KOŃCA 3).
 *    B2. Pop-up `showDiploPairSummary` (linia z `getData: () =>
 *        buildDiploPairSummaryData(ownerId)`) NADAL woła jednoargumentowo — zero
 *        regresu widoczności dla tej ścieżki (allowlista zakazuje zmiany
 *        diplomacyPanel.ts/pop-upu).
 *    B3. Audiencja (`openDiplomacyAudience`) woła `buildAudienceOtherRelations(ownerId)`
 *        i wpina wynik jako `otherRelations:` w stanie audiencji.
 *    B4. `buildAudienceOtherRelations` faktycznie woła `buildDiploPairSummaryData(...,
 *        true)` (revealAll) — nie samo `(otherOwnerId)` bez drugiego argumentu, co
 *        cofnęłoby KRYTERIUM KOŃCA 2 po cichu.
 *
 *  CZĘŚĆ C (UI, esbuild + realny `otherCardHtml`) — render faktycznie CZYTA
 *  `st.otherRelations`, nie tylko że dane istnieją w stanie:
 *    C1. Stan z `otherRelations` niepustym (wars/alliances/naps/deals po jednym wpisie,
 *        w tym partner z `isPlayer:true`) → HTML zawiera sekcję „Relacje z innymi" i
 *        wszystkie cztery podtytuły + nazwy partnerów + „Ty" dla gracza.
 *    C2. Pusta lista w każdej kategorii → każda podsekcja pokazuje „Brak." (wzorem
 *        `renderPairSummarySection` pop-upu, GOAL pkt 3).
 *    C3. `otherRelations` undefined (rozmówca poza aktywną dyplomacją) → cała sekcja
 *        pominięta, HTML nie zawiera „Relacje z innymi” (brak psucia karty, gdy silnik
 *        nie dostarczył danych).
 *    C4. KONTROLA MUTACYJNA: cofnięcie wywołania `otherRelationsSectionHtml(...)` w
 *        `otherCardHtml` (usunięcie linii) sprawiłoby, że C1 czerwienieje — zweryfikowane
 *        ręcznie przez tymczasowe zakomentowanie przy pisaniu testu (nieprzechowywane w
 *        repo; dowód w raporcie Operatora).
 *
 * Usage (z gra/): node tools/diplomacy-relacje-ai-ai-audiencja-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  OK:', label); }
  else { fail++; console.error('  FAIL:', label); }
}

async function main() {
  console.log('diplomacy-relacje-ai-ai-audiencja-test');

  // ===========================================================================
  // CZĘŚĆ A — silnik: diplomacy-pair-summary.ts
  // ===========================================================================
  console.log('CZĘŚĆ A — diplomacy-pair-summary.ts (nap + revealAll)');
  {
    const GRA = path.resolve(__dirname, '..');
    const ENTRY = path.resolve(__dirname, '.dip-relacje-ai-ai-entry.ts');
    const BUNDLE = path.resolve(__dirname, '.dip-relacje-ai-ai-bundle.cjs');
    fs.writeFileSync(ENTRY, [
      "export { warPartnerIdsForOwner, dealPartnerIdsForOwner } from '../src/game/diplomacy-pair-summary.ts';",
    ].join('\n'), 'utf8');

    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: GRA,
      logLevel: 'silent',
    });

    const { warPartnerIdsForOwner, dealPartnerIdsForOwner } = require(BUNDLE);

    // A1: kategoria 'nap' — PaktNieagresji między owner 3 i owner 5.
    {
      const deals = [
        { id: 'd1', rodzaj: 'pakt_nieagresji', strony: [3, 5] },
        { id: 'd2', rodzaj: 'sojusz_pelny', strony: [3, 9] },
      ];
      const naps3 = dealPartnerIdsForOwner(deals, 3, 'nap');
      ok(naps3.length === 1 && naps3[0] === 5,
        '[A1] dealPartnerIdsForOwner(deals, 3, \'nap\') zwraca [5] (PaktNieagresji, nie miesza z sojuszem)');
      const alliances3 = dealPartnerIdsForOwner(deals, 3, 'sojusz');
      ok(alliances3.length === 1 && alliances3[0] === 9,
        '[A1b] kontrola: \'sojusz\' nadal zwraca tylko 9, nie 5 (kategorie nie przeciekają)');
    }

    // A2: KRYTERIUM KOŃCA 1/2 — trzecia strona (owner 7) NIEZNANA graczowi (owner 0).
    // Wojna między owner 2 (rozmówca) i owner 7 (nieznany graczowi) + pakt owner 2/owner 7.
    {
      const relations = new Map([
        ['2_7', { status: 'wojna' }],
      ]);
      const deals = [
        { id: 'dnap', rodzaj: 'pakt_nieagresji', strony: [2, 4] }, // 4 = znany graczowi
      ];
      // Symulacja isVisiblePartner pop-upu: gracz (0) widzi tylko owner 4 (kontakt
      // nawiązany), NIE widzi owner 7 (nigdy nie spotkany) — dokładnie kształt
      // main.ts::buildDiploPairSummaryData(ownerId, false).
      const contactedByPlayer = new Set([4]); // owner 7 świadomie POZA tym zbiorem
      const popupVisible = (id) => id === 0 || contactedByPlayer.has(id);

      const warsPopup = warPartnerIdsForOwner(relations, 2, popupVisible);
      ok(warsPopup.length === 0,
        '[A2] pop-up (isVisiblePartner z mgłą wojny): wojna 2↔7 UKRYTA, bo gracz nigdy nie spotkał 7 (zero regresu KRYTERIUM 3)');

      const warsAudience = warPartnerIdsForOwner(relations, 2); // revealAll — bez isVisiblePartner
      ok(warsAudience.length === 1 && warsAudience[0] === 7,
        '[A2] audiencja (revealAll, BEZ isVisiblePartner): wojna 2↔7 WIDOCZNA mimo że gracz nigdy nie spotkał 7 (KRYTERIUM KOŃCA 1+2)');

      const napsPopup = dealPartnerIdsForOwner(deals, 2, 'nap', popupVisible);
      ok(napsPopup.length === 1 && napsPopup[0] === 4,
        '[A2] pop-up: pakt 2↔4 widoczny (4 znany graczowi) — kontrola pozytywna filtra');
      const napsAudienceReveal = dealPartnerIdsForOwner(deals, 2, 'nap');
      ok(napsAudienceReveal.length === 1 && napsAudienceReveal[0] === 4,
        '[A2] audiencja: pakt 2↔4 nadal widoczny bez isVisiblePartner (kontrola non-regresji dla znanego partnera)');
    }

    for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch (_) {} }
  }

  // ===========================================================================
  // CZĘŚĆ B — main.ts: pin tekstowy na wiązanie (main.ts nie da się zbundlować —
  // ten sam ograniczenie co w innych testach tej rodziny, np.
  // diplomacy-tech-chip-filter-and-multi-deal-test.cjs, komentarz przy CZĘŚCI B tamże).
  // ===========================================================================
  console.log('CZĘŚĆ B — main.ts (pin tekstowy na wiązanie)');
  {
    const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');
    const src = fs.readFileSync(MAIN_TS, 'utf8');

    // B1: sygnatura z domyślnym revealAll=false.
    ok(src.includes('function buildDiploPairSummaryData(ownerId: number, revealAll = false): DiploPairSummaryData | null {'),
      '[B1] buildDiploPairSummaryData ma parametr `revealAll = false` (domyślne zachowanie pop-upu nietknięte)');

    // B2: pop-up nadal woła jednoargumentowo — szukamy dokładnie tego wzorca w KONTEKŚCIE
    // openDiplomacyAudience (getData: () => buildDiploPairSummaryData(oid)); ownerId===0
    // wariant pomijamy (jeden call site, sprawdzony poniżej).
    const popupCallIdx = src.indexOf('getData: () => buildDiploPairSummaryData(');
    ok(popupCallIdx >= 0, '[B2] pop-up wywołuje buildDiploPairSummaryData(...) przez getData');
    if (popupCallIdx >= 0) {
      const callSlice = src.slice(popupCallIdx, popupCallIdx + 80);
      const m = /buildDiploPairSummaryData\(([^)]*)\)/.exec(callSlice);
      const argsStr = m ? m[1].trim() : '<brak>';
      ok(argsStr === 'oid' || argsStr === 'ownerId',
        '[B2] pop-up woła buildDiploPairSummaryData z JEDNYM argumentem (' + JSON.stringify(argsStr) + '), bez revealAll=true — zero regresu KRYTERIUM 3');
    }

    // B3: audiencja wpina otherRelations: buildAudienceOtherRelations(ownerId).
    ok(src.includes('otherRelations: buildAudienceOtherRelations(ownerId)'),
      '[B3] openDiplomacyAudience wpina `otherRelations: buildAudienceOtherRelations(ownerId)` do stanu audiencji');

    // B4: buildAudienceOtherRelations faktycznie woła revealAll=true, nie samo (otherOwnerId).
    const fnIdx = src.indexOf('function buildAudienceOtherRelations(otherOwnerId: number)');
    ok(fnIdx >= 0, '[B4] function buildAudienceOtherRelations(otherOwnerId: number) istnieje w main.ts');
    const fnEnd = fnIdx >= 0 ? src.indexOf('\n    }', fnIdx) : -1;
    const fnBody = (fnIdx >= 0 && fnEnd > fnIdx) ? src.slice(fnIdx, fnEnd) : '';
    ok(fnBody.includes('buildDiploPairSummaryData(otherOwnerId, true)'),
      '[B4] buildAudienceOtherRelations woła buildDiploPairSummaryData(otherOwnerId, true) — revealAll jawnie true, nie domyślne false (KRYTERIUM KOŃCA 2)');
    ok(fnBody.includes("dealPartnerIdsForOwner(activeDeals, otherOwnerId, 'nap')"),
      "[B4b] buildAudienceOtherRelations dolicza kategorię 'nap' BEZ isVisiblePartner (spójne revealAll)");
  }

  // ===========================================================================
  // CZĘŚĆ C — UI: realny otherCardHtml (diplomacyAudience.ts), esbuild bundle.
  // ===========================================================================
  console.log('CZĘŚĆ C — otherCardHtml renderuje sekcję "Relacje z innymi"');
  {
    const GRA = path.resolve(__dirname, '..');
    const STUB_DIR = path.resolve(__dirname, '.stubs');
    fs.mkdirSync(STUB_DIR, { recursive: true });
    const stubs = {
      music: path.resolve(STUB_DIR, 'relacje-ai-ai-music-stub.ts'),
      diploUiSkin: path.resolve(STUB_DIR, 'relacje-ai-ai-diplouiskin-stub.ts'),
      negotiationModal: path.resolve(STUB_DIR, 'relacje-ai-ai-negotiationmodal-stub.ts'),
      tradeBasket: path.resolve(STUB_DIR, 'relacje-ai-ai-tradebasket-stub.ts'),
      leaderPortraits: path.resolve(STUB_DIR, 'relacje-ai-ai-leaderportraits-stub.ts'),
      civBrandDisplay: path.resolve(STUB_DIR, 'relacje-ai-ai-civbranddisplay-stub.ts'),
      brandAssets: path.resolve(STUB_DIR, 'relacje-ai-ai-brandassets-stub.ts'),
    };
    fs.writeFileSync(stubs.music, [
      "export function startDiplomacyMusic() {}",
      "export function stopDiplomacyMusic() {}",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.diploUiSkin, [
      "export function civLeaderMedallionHtmlById() { return ''; }",
      "export function dipBrandIconHtml() { return ''; }",
      "export function dipCapitalLocateBtnHtml() { return ''; }",
      "export const DIPLO_1E_SHARED_CSS = '';",
      "export function ensureDiploBrandScope() {}",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.negotiationModal, [
      "export function actionNeedsNegotiation() { return false; }",
      "export function showNegotiationModal() {}",
      "export function proposalActionIdFromPayload() { return undefined; }",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.tradeBasket, [
      "export function actionUsesTradeBasket() { return false; }",
      "export function getTradeBasketMode() { return 'trade'; }",
      "export function showTradeBasketModal() {}",
      "export function hideTradeBasketModal() {}",
      "export function openQuickDealBasket() {}",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.leaderPortraits, [
      "export function leaderPortraitUrl() { return null; }",
      "export function leaderName() { return null; }",
      "export function leaderNameFromPool() { return null; }",
      "export function civDisplayNameFromKey() { return null; }",
      "export function civCardDisplayName(label) { return label; }",
      "export function civIconIdFromCivLabel() { return null; }",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.civBrandDisplay, [
      "export function civBrandLineForKey() { return ''; }",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.brandAssets, [
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
    ].join('\n'), 'utf8');

    const ENTRY = path.resolve(__dirname, '.dip-relacje-ai-ai-card-entry.ts');
    const BUNDLE = path.resolve(__dirname, '.dip-relacje-ai-ai-card-bundle.cjs');
    fs.writeFileSync(ENTRY, `export { otherCardHtml } from '../src/ui/diplomacyAudience.ts';\n`, 'utf8');

    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: GRA,
      logLevel: 'silent',
      loader: { '.json': 'json' },
      plugins: [{
        name: 'stub-vite-assets-relacje-ai-ai',
        setup(build) {
          build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: stubs.music }));
          build.onResolve({ filter: /diploUiSkin$/ }, () => ({ path: stubs.diploUiSkin }));
          build.onResolve({ filter: /diplomacyNegotiationModal$/ }, () => ({ path: stubs.negotiationModal }));
          build.onResolve({ filter: /diplomacyTradeBasket$/ }, () => ({ path: stubs.tradeBasket }));
          build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: stubs.leaderPortraits }));
          build.onResolve({ filter: /civBrandDisplay$/ }, () => ({ path: stubs.civBrandDisplay }));
          build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: stubs.brandAssets }));
        },
      }],
    });

    const { otherCardHtml } = require(BUNDLE);

    function baseState(otherRelations) {
      return {
        playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Przedstawiciel', otherCivName: 'Grecja',
        zaufanie: 50, respekt: 50, tier: 1, layer: 'full', contactEstablished: true,
        actions: [],
        otherRelations,
      };
    }

    // C1: otherRelations niepuste — wszystkie cztery podsekcje + nazwy + "Ty".
    {
      const st = baseState({
        wars: [{ ownerId: 7, name: 'Nieznani Hetyci' }],
        alliances: [{ ownerId: 9, name: 'Egipt' }],
        naps: [{ ownerId: 4, name: 'Persja' }],
        deals: [{ ownerId: 0, name: 'Rzym', isPlayer: true }],
      });
      const html = otherCardHtml(st, []);
      ok(html.includes('Relacje z innymi'), '[C1] sekcja "Relacje z innymi" obecna w HTML');
      ok(html.includes('W stanie wojny z') && html.includes('Nieznani Hetyci'),
        '[C1] podsekcja wojen zawiera partnera nieznanego graczowi ("Nieznani Hetyci") — KRYTERIUM KOŃCA 1');
      ok(html.includes('W sojuszu z') && html.includes('Egipt'), '[C1] podsekcja sojuszy zawiera "Egipt"');
      ok(html.includes('Pakt o nieagresji z') && html.includes('Persja'), '[C1] podsekcja NAP zawiera "Persja" (GOAL pkt 4)');
      ok(html.includes('Handluje z') && html.includes('>Ty<'), '[C1] podsekcja handlu pokazuje "Ty" dla partnera-gracza (isPlayer)');
    }

    // C2: puste listy — "Brak." w każdej podsekcji.
    {
      const st = baseState({ wars: [], alliances: [], naps: [], deals: [] });
      const html = otherCardHtml(st, []);
      const brakCount = (html.match(/Brak\./g) || []).length;
      ok(brakCount === 4, '[C2] cztery puste podsekcje → dokładnie 4x "Brak." w HTML (got ' + brakCount + ')');
    }

    // C3: otherRelations undefined — sekcja całkowicie pominięta.
    {
      const st = baseState(undefined);
      const html = otherCardHtml(st, []);
      ok(!html.includes('Relacje z innymi'), '[C3] otherRelations=undefined → sekcja "Relacje z innymi" NIEOBECNA (brak psucia karty bez danych silnika)');
    }

    for (const f of Object.values(stubs).concat([ENTRY, BUNDLE])) {
      try { fs.unlinkSync(f); } catch (_) {}
    }
  }

  console.log('');
  console.log('========================================');
  console.log('PASSED:', pass, '/ FAILED:', fail, '/ TOTAL:', pass + fail);
  if (fail > 0) {
    console.error('FAILED');
    process.exit(1);
  }
  console.log('ALL GREEN');
}

main().catch((e) => {
  console.error('[diplomacy-relacje-ai-ai-audiencja-test] błąd:', e && e.stack || e);
  process.exit(1);
});
