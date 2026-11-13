'use strict';
/**
 * diplo-weariness-display-test.cjs — R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1.
 *
 * Panel dyplomacji pokazuje: wojna gracz↔AI — zmęczenie wojną strony wygrywającej i desperację strony
 * przegrywającej; wojny AI↔AI — jedną wartość dla rozmówcy w tej wojnie. Wartości NIE są kopiowane:
 * test porównuje wynik selektora z warWearinessLevel / loserDespair (war-weariness.ts).
 *
 *  CZĘŚĆ A — selektor (war-weariness-view.ts, esbuild):
 *    A1. wygrywający → zmęczenie (= warWearinessLevel), przegrywający → desperacja (= loserDespair), w parze oba.
 *    A2. remis (w progu parytetu) → obie strony zmęczenie, bez desperacji.
 *    A3. odwrócone strony (a słabszy) → zamienione role, te same wartości.
 *  CZĘŚĆ B — etykiety (diplomacy-display.ts): procent 0–100 i nazwy „Zmęczenie wojną …" / „Desperacja …".
 *  CZĘŚĆ C — UI (diplomacyAudience.ts, otherCardHtml, esbuild + stuby jak w diplomacy-relacje-ai-ai-audiencja-test):
 *    C1. wojna gracz↔AI: wiersze „Ty" i nazwa rozmówcy z procentami.
 *    C2. wojna AI↔AI: procent przy partnerze w „W stanie wojny z".
 *    C3. brak danych → brak wierszy z klasą war-weariness / da-rel-war-wear.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  OK:', label); }
  else { fail++; console.error('  FAIL:', label); }
}

const GRA = path.resolve(__dirname, '..');

async function main() {
  console.log('diplo-weariness-display-test');

  // ===========================================================================
  // CZĘŚĆ A — selektor
  // ===========================================================================
  console.log('CZĘŚĆ A — war-weariness-view.ts (selektor pary)');
  const ENTRY_A = path.resolve(__dirname, '.dip-weariness-view-entry.ts');
  const BUNDLE_A = path.resolve(__dirname, '.dip-weariness-view-bundle.cjs');
  fs.writeFileSync(ENTRY_A, [
    "export { warWearinessPairView } from '../src/game/war-weariness-view.ts';",
    "export { warWearinessLevel, loserDespair, wearinessMilitaryShare, WAR_WEARINESS_PARAMS } from '../src/game/war-weariness.ts';",
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY_A], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE_A, absWorkingDir: GRA, logLevel: 'silent', loader: { '.json': 'json' },
  });
  const V = require(BUNDLE_A);
  const P = V.WAR_WEARINESS_PARAMS;

  {
    // A1: a silny (800 vs 200 = 4x), b przegrywa, 2 miasta stracone przez b, 120 tur wojny.
    const inp = {
      turnsAtWar: 120,
      a: { id: 'a', sila: 800, armiaPkt: 500, lostCities: 0 },
      b: { id: 'b', sila: 200, armiaPkt: 150, lostCities: 2 },
    };
    const r = V.warWearinessPairView(inp);
    const level = V.warWearinessLevel({ turnsAtWar: 120, lostCitiesTotal: 2 });
    ok(r.a.rola === 'wygrywa' && r.b.rola === 'przegrywa', '[A1] rola: silniejszy = wygrywa, słabszy = przegrywa');
    ok(r.a.zmeczenie === level && r.a.desperacja === undefined, '[A1] wygrywający dostaje zmęczenie = warWearinessLevel');
    const share = 200 / 1000;
    const expDespair = V.loserDespair({ level, share: Math.min(share, P.przegrywajacy.udzialWyraznie), lostCities: 2 });
    ok(r.b.desperacja === expDespair && r.b.zmeczenie === undefined, '[A1] przegrywający dostaje desperację = loserDespair');
    ok(r.level === level, '[A1] wspólny poziom = warWearinessLevel');
  }
  {
    // A2: remis w progu 20% (110 vs 100) → obie strony rowny + zmęczenie.
    const r = V.warWearinessPairView({
      turnsAtWar: 80,
      a: { id: 'a', sila: 110, armiaPkt: 80, lostCities: 1 },
      b: { id: 'b', sila: 100, armiaPkt: 80, lostCities: 0 },
    });
    const level = V.warWearinessLevel({ turnsAtWar: 80, lostCitiesTotal: 1 });
    ok(r.a.rola === 'rowny' && r.b.rola === 'rowny', '[A2] remis: obie strony rola rowny');
    ok(r.a.zmeczenie === level && r.b.zmeczenie === level, '[A2] remis: obie strony pokazują zmęczenie');
    ok(r.a.desperacja === undefined && r.b.desperacja === undefined, '[A2] remis: brak desperacji');
  }
  {
    // A3: odwrócone strony (a słabszy) → te same wartości, zamienione role.
    const fwd = V.warWearinessPairView({
      turnsAtWar: 150,
      a: { id: 'x', sila: 900, armiaPkt: 600, lostCities: 0 },
      b: { id: 'y', sila: 300, armiaPkt: 200, lostCities: 3 },
    });
    const rev = V.warWearinessPairView({
      turnsAtWar: 150,
      a: { id: 'y', sila: 300, armiaPkt: 200, lostCities: 3 },
      b: { id: 'x', sila: 900, armiaPkt: 600, lostCities: 0 },
    });
    ok(fwd.a.rola === rev.b.rola && fwd.b.rola === rev.a.rola, '[A3] role zamieniają się razem z stronami');
    ok(fwd.b.desperacja === rev.a.desperacja, '[A3] desperacja przegrywającego niezależna od kolejności argumentów');
  }
  {
    // A4: brak siły po obu stronach → remis (brak przewagi), bez wyjątku.
    const r = V.warWearinessPairView({
      turnsAtWar: 10,
      a: { id: 'a', sila: 0, armiaPkt: 0, lostCities: 0 },
      b: { id: 'b', sila: 0, armiaPkt: 0, lostCities: 0 },
    });
    ok(r.a.rola === 'rowny' && r.b.rola === 'rowny', '[A4] obie siły 0 → rowny');
  }
  {
    // A5: szczyt pary (peak z warWearinessByPairKey) zastępuje bieżący poziom — jak w runWarWearinessTick (lvl = st.peak).
    const base = {
      turnsAtWar: 20,
      a: { id: 'a', sila: 800, armiaPkt: 500, lostCities: 0 },
      b: { id: 'b', sila: 200, armiaPkt: 150, lostCities: 2 },
    };
    const current = V.warWearinessLevel({ turnsAtWar: 20, lostCitiesTotal: 2 });
    const peak = Math.min(1, current + 0.3);
    const r = V.warWearinessPairView({ ...base, peak });
    const expDespair = V.loserDespair({ level: peak, share: Math.min(1 - V.wearinessMilitaryShare(800, 200), P.przegrywajacy.udzialWyraznie), lostCities: 2 });
    ok(r.level === peak && r.a.zmeczenie === peak, '[A5] z peak: zmęczenie wygrywającego = peak (nie bieżący poziom)');
    ok(r.b.desperacja === expDespair, '[A5] z peak: desperacja liczona z peak (jak w ticku AI↔AI)');
    const noPeak = V.warWearinessPairView(base);
    ok(noPeak.level === current, '[A5] bez peak: zachowanie bez zmian (bieżący warWearinessLevel)');
  }

  // ===========================================================================
  // CZĘŚĆ B — etykiety
  // ===========================================================================
  console.log('CZĘŚĆ B — diplomacy-display.ts (etykiety procentowe)');
  const ENTRY_B = path.resolve(__dirname, '.dip-weariness-label-entry.ts');
  const BUNDLE_B = path.resolve(__dirname, '.dip-weariness-label-bundle.cjs');
  fs.writeFileSync(ENTRY_B, "export { warWearinessLabelPl, warWearinessPercentPl } from '../src/game/diplomacy-display.ts';\n", 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY_B], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE_B, absWorkingDir: GRA, logLevel: 'silent', loader: { '.json': 'json' },
  });
  const L = require(BUNDLE_B);
  {
    const z = L.warWearinessLabelPl({ rola: 'wygrywa', zmeczenie: 0.4 });
    ok(z && z.label === 'Zmęczenie wojną 40%', '[B1] zmęczenie 0.4 → „Zmęczenie wojną 40%”');
    const d = L.warWearinessLabelPl({ rola: 'przegrywa', desperacja: 0.65 });
    ok(d && d.label === 'Desperacja 65%', '[B2] desperacja 0.65 → „Desperacja 65%”');
    ok(z && z.tooltip.length > 0 && d && d.tooltip.length > 0, '[B3] każda etykieta ma podpowiedź');
    ok(L.warWearinessPercentPl(1.7) === '100%' && L.warWearinessPercentPl(-0.2) === '0%', '[B4] procent obcięty do 0–100');
    ok(L.warWearinessLabelPl({ rola: 'rowny' }) === null, '[B5] brak wartości → brak etykiety');
  }

  // ===========================================================================
  // CZĘŚĆ C — UI (diplomacyAudience.ts)
  // ===========================================================================
  console.log('CZĘŚĆ C — otherCardHtml: wiersze zmęczenia/desperacji');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  fs.mkdirSync(STUB_DIR, { recursive: true });
  const stubs = {
    music: ['audio/muzyka-antyczna', ['export function startDiplomacyMusic() {}', 'export function stopDiplomacyMusic() {}']],
    diploUiSkin: ['diploUiSkin', ["export function civLeaderMedallionHtmlById() { return ''; }", "export function dipBrandIconHtml() { return ''; }",
      "export function dipCapitalLocateBtnHtml() { return ''; }", "export const DIPLO_1E_SHARED_CSS = '';", 'export function ensureDiploBrandScope() {}']],
    negotiationModal: ['diplomacyNegotiationModal', ['export function actionNeedsNegotiation() { return false; }', 'export function showNegotiationModal() {}',
      'export function proposalActionIdFromPayload() { return undefined; }']],
    tradeBasket: ['diplomacyTradeBasket', ["export function actionUsesTradeBasket() { return false; }", "export function getTradeBasketMode() { return 'trade'; }",
      'export function showTradeBasketModal() {}', 'export function hideTradeBasketModal() {}', 'export function openQuickDealBasket() {}']],
    leaderPortraits: ['leaderPortraits', ['export function leaderPortraitUrl() { return null; }', 'export function leaderName() { return null; }',
      'export function leaderNameFromPool() { return null; }', 'export function civDisplayNameFromKey() { return null; }',
      'export function civCardDisplayName(label) { return label; }', 'export function civIconIdFromCivLabel() { return null; }']],
    civBrandDisplay: ['civBrandDisplay', ["export function civBrandLineForKey() { return ''; }"]],
    brandAssets: ['icons/brandAssets', ["export function brandIconSvg() { return ''; }", "export function improvementIconSvg() { return ''; }",
      "export function mapResourceIconSvg() { return ''; }", "export function terrainIconSvg() { return ''; }",
      "export function buildingIconSvg() { return ''; }", "export function unitIconSvg() { return ''; }",
      "export function civIconSvg() { return ''; }", "export function epochIconSvg() { return ''; }",
      "export function settingIconSvg() { return ''; }", "export function brandMenuComponentsCss() { return ''; }",
      "export function menuIconSvg() { return ''; }", "export function brandMenuEmblemSvg() { return ''; }",
      "export function newGameIntroEmblemSvg() { return ''; }", "export function brandMotionCss() { return ''; }",
      "export function brandMenuBackgroundCss() { return ''; }", "export function svgThumbHtml() { return ''; }"]],
  };
  const stubPath = {};
  for (const [key, [, lines]] of Object.entries(stubs)) {
    stubPath[key] = path.resolve(STUB_DIR, 'weariness-' + key + '-stub.ts');
    fs.writeFileSync(stubPath[key], lines.join('\n'), 'utf8');
  }
  const ENTRY_C = path.resolve(__dirname, '.dip-weariness-card-entry.ts');
  const BUNDLE_C = path.resolve(__dirname, '.dip-weariness-card-bundle.cjs');
  fs.writeFileSync(ENTRY_C, "export { otherCardHtml } from '../src/ui/diplomacyAudience.ts';\n", 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY_C], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE_C, absWorkingDir: GRA, logLevel: 'silent', loader: { '.json': 'json' },
    plugins: [{
      name: 'stub-weariness-test',
      setup(build) {
        build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: stubPath.music }));
        build.onResolve({ filter: /diploUiSkin$/ }, () => ({ path: stubPath.diploUiSkin }));
        build.onResolve({ filter: /diplomacyNegotiationModal$/ }, () => ({ path: stubPath.negotiationModal }));
        build.onResolve({ filter: /diplomacyTradeBasket$/ }, () => ({ path: stubPath.tradeBasket }));
        build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: stubPath.leaderPortraits }));
        build.onResolve({ filter: /civBrandDisplay$/ }, () => ({ path: stubPath.civBrandDisplay }));
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: stubPath.brandAssets }));
      },
    }],
  });
  const { otherCardHtml } = require(BUNDLE_C);

  function baseState(extra) {
    return Object.assign({
      playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Przedstawiciel', otherCivName: 'Grecja',
      zaufanie: 0, respekt: 50, tier: 1, layer: 'full', contactEstablished: true,
      actions: [],
    }, extra);
  }

  {
    // C1: wojna gracz↔AI — gracz zwycięzca (zmęczenie 40%), AI przegrywa (desperacja 65%).
    const html = otherCardHtml(baseState({
      warWeariness: {
        player: { rola: 'wygrywa', zmeczenie: 0.4 },
        other: { rola: 'przegrywa', desperacja: 0.65 },
      },
    }), []);
    ok(html.includes('Zmęczenie wojną 40%'), '[C1] wiersz zmęczenia wygrywającego gracza (40%)');
    ok(html.includes('Desperacja 65%'), '[C1] wiersz desperacji przegrywającego rozmówcy (65%)');
    ok(html.includes('<span>Ty</span>') && html.includes('<span>Grecja</span>'), '[C1] wiersze podpisane „Ty” i nazwą rozmówcy');
    ok(html.includes('war-weariness'), '[C1] wiersze mają klasę war-weariness');
  }
  {
    // C2: wojny AI↔AI — jedna wartość przy partnerze; partner bez danych bez procentu.
    const html = otherCardHtml(baseState({
      otherRelations: {
        wars: [
          { ownerId: 7, name: 'Hetyci', warWeariness: { rola: 'wygrywa', zmeczenie: 0.25 } },
          { ownerId: 8, name: 'Persja', warWeariness: { rola: 'przegrywa', desperacja: 0.8 } },
          { ownerId: 9, name: 'Egipt' },
        ],
        alliances: [], naps: [], deals: [],
      },
    }), []);
    ok(html.includes('Zmęczenie wojną 25%') && html.includes('Desperacja 80%'), '[C2] procent przy każdym partnerze wojny AI↔AI');
    const egipt = html.indexOf('Egipt');
    ok(egipt >= 0 && !html.slice(egipt, egipt + 120).includes('da-rel-war-wear'), '[C2] partner bez danych — bez procentu');
    ok(html.includes('da-rel-war-wear'), '[C2] klasa da-rel-war-wear obecna przy partnerach z danymi');
  }
  {
    // C3: brak danych — brak wierszy zmęczenia.
    const html = otherCardHtml(baseState({
      otherRelations: { wars: [{ ownerId: 7, name: 'Hetyci' }], alliances: [], naps: [], deals: [] },
    }), []);
    ok(!html.includes('war-weariness') && !html.includes('da-rel-war-wear'), '[C3] bez danych brak wierszy zmęczenia/desperacji');
  }

  // Sprzątanie plików pomocniczych testu (nie do repo — dopisane do .gitignore nie są; kasowane po teście).
  for (const f of [ENTRY_A, BUNDLE_A, ENTRY_B, BUNDLE_B, ENTRY_C, BUNDLE_C, ...Object.values(stubPath)]) {
    try { fs.unlinkSync(f); } catch (_) { /* brak pliku — bez znaczenia */ }
  }

  console.log('PASSED:', pass, '/ FAILED:', fail, '/ TOTAL:', pass + fail);
  if (fail > 0) {
    console.error('FAILED');
    process.exit(1);
  }
  console.log('ALL PASSED');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
