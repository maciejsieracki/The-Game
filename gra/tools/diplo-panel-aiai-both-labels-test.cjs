'use strict';
/**
 * diplo-panel-aiai-both-labels-test.cjs — R-WEB-UI-DIPLO-PANEL-AIAI-BOTH-LABELS-Q1.
 *
 * Wojny AI↔AI na liście „W stanie wojny z" karty rozmówcy mają pokazywać OBIE strony
 * (zmęczenie wygrywającego / desperację przegrywającego), a nie jedną etykietę.
 *
 *  CZĘŚĆ A — renderer (diplomacyAudience.ts, otherCardHtml, esbuild + stuby jak w diplo-weariness-display-test):
 *    A1. wojna AI↔AI, rozmówca przegrywa (desperacja 60%), partner wygrywa (zmęczenie 30%) → OBA znaczniki.
 *    A2. remis (oba zmęczenie 20%) → DWA znaczniki zmęczenia, podpisane czyja to strona.
 *    A3. partner bez danych strony partnera → tylko znacznik rozmówcy, bez prefiksu partnera.
 *    A4. rozmówca bez danych, partner z danymi → tylko znacznik partnera.
 *    A5. brak obu danych → brak znaczników (klasa da-rel-war-wear nieobecna).
 *    A6. wojna gracz↔AI (karta, `warWearinessRowsHtml`) bez regresji: wiersze „Ty" i nazwa rozmówcy.
 *
 *  CZĘŚĆ B — wiązanie w main.ts (statyczne): buildAudienceOtherRelations czyta OBIE strony
 *    selektora (`.own` i `.rival`) i przekazuje partnerowi `warWearinessPartner`.
 *
 *  Mutacja (ręczna, opisana w raporcie): usunięcie `warWearinessPartner` z renderera → A1/A2 czerwone.
 *
 * Usage (z gra/): node tools/diplo-panel-aiai-both-labels-test.cjs
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
  console.log('diplo-panel-aiai-both-labels-test');

  // ===========================================================================
  // CZĘŚĆ A — renderer (otherCardHtml)
  // ===========================================================================
  console.log('CZĘŚĆ A — otherCardHtml: obie strony wojny AI↔AI');
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
    stubPath[key] = path.resolve(STUB_DIR, 'bothlabels-' + key + '-stub.ts');
    fs.writeFileSync(stubPath[key], lines.join('\n'), 'utf8');
  }
  const ENTRY = path.resolve(__dirname, '.dip-bothlabels-card-entry.ts');
  const BUNDLE = path.resolve(__dirname, '.dip-bothlabels-card-bundle.cjs');
  fs.writeFileSync(ENTRY, "export { otherCardHtml } from '../src/ui/diplomacyAudience.ts';\n", 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent', loader: { '.json': 'json' },
    plugins: [{
      name: 'stub-bothlabels-test',
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
  const { otherCardHtml } = require(BUNDLE);
  // Sprzątanie: bundle jest już w pamięci; stuby i wejście są tymczasowe (nie zostają w drzewie roboczym).
  for (const key of Object.keys(stubPath)) fs.rmSync(stubPath[key], { force: true });
  fs.rmSync(ENTRY, { force: true });

  function baseState(extra) {
    return Object.assign({
      playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Przedstawiciel', otherCivName: 'Grecja',
      zaufanie: 0, respekt: 50, tier: 1, layer: 'full', contactEstablished: true,
      actions: [],
    }, extra);
  }

  {
    // A1: Grecja (rozmówca) przegrywa, Hetyci (partner) wygrywają.
    const html = otherCardHtml(baseState({
      otherRelations: {
        wars: [{
          ownerId: 7, name: 'Hetyci',
          warWeariness: { rola: 'przegrywa', desperacja: 0.6 },
          warWearinessPartner: { rola: 'wygrywa', zmeczenie: 0.3 },
        }],
        alliances: [], naps: [], deals: [],
      },
    }), []);
    ok(html.includes('Grecja: Desperacja 60%'), '[A1] znacznik strony rozmówcy: „Grecja: Desperacja 60%”');
    ok(html.includes('Hetyci: Zmęczenie wojną 30%'), '[A1] znacznik strony partnera: „Hetyci: Zmęczenie wojną 30%”');
    ok((html.match(/da-rel-war-wear/g) || []).length === 2, '[A1] dokładnie dwa znaczniki przy wojnie AI↔AI');
  }
  {
    // A2: remis — obie strony zmęczenie 20%.
    const html = otherCardHtml(baseState({
      otherRelations: {
        wars: [{
          ownerId: 8, name: 'Persja',
          warWeariness: { rola: 'rowny', zmeczenie: 0.2 },
          warWearinessPartner: { rola: 'rowny', zmeczenie: 0.2 },
        }],
        alliances: [], naps: [], deals: [],
      },
    }), []);
    ok(html.includes('Grecja: Zmęczenie wojną 20%') && html.includes('Persja: Zmęczenie wojną 20%'),
      '[A2] remis: dwa wiersze zmęczenia podpisane obiema stronami');
    ok((html.match(/Zmęczenie wojną 20%/g) || []).length === 2, '[A2] remis: dokładnie dwa wiersze zmęczenia');
  }
  {
    // A3: partner bez danych strony partnera — tylko znacznik rozmówcy.
    const html = otherCardHtml(baseState({
      otherRelations: {
        wars: [{ ownerId: 7, name: 'Hetyci', warWeariness: { rola: 'wygrywa', zmeczenie: 0.25 } }],
        alliances: [], naps: [], deals: [],
      },
    }), []);
    ok(html.includes('Grecja: Zmęczenie wojną 25%'), '[A3] znacznik rozmówcy obecny');
    ok(!html.includes('Hetyci: '), '[A3] brak znacznika partnera bez jego danych');
  }
  {
    // A4: rozmówca bez danych, partner z danymi — tylko znacznik partnera.
    const html = otherCardHtml(baseState({
      otherRelations: {
        wars: [{ ownerId: 7, name: 'Hetyci', warWearinessPartner: { rola: 'przegrywa', desperacja: 0.8 } }],
        alliances: [], naps: [], deals: [],
      },
    }), []);
    ok(html.includes('Hetyci: Desperacja 80%'), '[A4] znacznik partnera obecny');
    ok(!html.includes('Grecja: '), '[A4] brak znacznika rozmówcy bez jego danych');
  }
  {
    // A5: brak obu danych — brak znaczników.
    const html = otherCardHtml(baseState({
      otherRelations: { wars: [{ ownerId: 7, name: 'Hetyci' }], alliances: [], naps: [], deals: [] },
    }), []);
    ok(!html.includes('da-rel-war-wear') && !html.includes('war-weariness'), '[A5] bez danych brak znaczników');
  }
  {
    // A6: wojna gracz↔AI bez regresji — wiersze „Ty" i rozmówca w karcie.
    const html = otherCardHtml(baseState({
      warWeariness: {
        player: { rola: 'wygrywa', zmeczenie: 0.4 },
        other: { rola: 'przegrywa', desperacja: 0.65 },
      },
    }), []);
    ok(html.includes('Zmęczenie wojną 40%') && html.includes('Desperacja 65%'), '[A6] wojna gracz↔AI: oba wiersze obecne');
    ok(html.includes('<span>Ty</span>') && html.includes('<span>Grecja</span>'), '[A6] wiersze podpisane „Ty” i nazwą rozmówcy');
  }
  {
    // A7: pusta nazwa rozmówcy — znacznik bez prefiksu „: …” (brak ślepego „: Desperacja”).
    const html = otherCardHtml(baseState({
      otherCivName: '',
      otherRelations: {
        wars: [{ ownerId: 7, name: 'Hetyci', warWeariness: { rola: 'przegrywa', desperacja: 0.5 } }],
        alliances: [], naps: [], deals: [],
      },
    }), []);
    ok(html.includes('Desperacja 50%') && !html.includes(': Desperacja 50%'), '[A7] pusta nazwa rozmówcy: znacznik bez prefiksu');
  }

  // ===========================================================================
  // CZĘŚĆ B — wiązanie w main.ts (statyczne)
  // ===========================================================================
  console.log('CZĘŚĆ B — buildAudienceOtherRelations (main.ts)');
  {
    const mainSrc = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
    const m = mainSrc.match(/function buildAudienceOtherRelations\([\s\S]*?\n    \}\n/);
    const body = m ? m[0] : '';
    ok(!!m, '[B0] funkcja buildAudienceOtherRelations znaleziona');
    ok(/side\.own/.test(body) && /side\.rival/.test(body), '[B1] czyta obie strony selektora (.own i .rival)');
    ok(/warWearinessPartner:\s*side\.rival/.test(body), '[B2] partnerowi przekazywana jest strona .rival jako warWearinessPartner');
    ok(/diploWarWearinessPairView\(otherOwnerId, w\.ownerId, 'tick'\)/.test(body), '[B3] widok pary liczony jak dotąd (tryb tick, bez zapisu)');
  }

  console.log('');
  console.log(`Wynik: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
