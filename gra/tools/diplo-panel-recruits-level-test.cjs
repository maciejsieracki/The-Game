'use strict';
/**
 * diplo-panel-recruits-level-test.cjs — R-WEB-DIPLO-PANEL-CIV-RECRUITS-LEVEL-Q1.
 *
 * Panel dyplomacji/audiencji ma pokazywać liczbę rekrutów (pula werbu, Manpower)
 * rozpatrywanej cywilizacji obok Mocy militarnej. Test chroni:
 *
 *  CZĘŚĆ A (main.ts, tekstowy pin wiązania):
 *    A1. getState audiencji wpina playerRecruits/playerRecruitsMax/otherRecruits/otherRecruitsMax.
 *    A2. audienceRecruitsForOwner używa tej samej definicji co panel werbu:
 *        empirePoborTotals(...).rekruci + civManpowerMultsForOwner(...).maxMult + cityManpowerMax.
 *
 *  CZĘŚĆ B (UI, esbuild + realne playerCardHtml / otherCardHtml):
 *    B1. Rozmówca: wiersz „Rekruci” z „1 240 / 2 000” (spacje tysięcy), pasek 62%, tooltip.
 *    B2. Gracz: ten sam wiersz z „Rekruci” i własnymi liczbami.
 *    B3. Brak danych (undefined) → wiersz pominięty, HTML bez „Rekruci”.
 *    B4. Maksimum 0 → „0 / 0”, pasek 0%, bez NaN.
 *    B5. Wartości ujemne/ułamkowe są obcinane (brak „-” i „NaN” w wyjściu).
 *
 * Usage (z gra/): node tools/diplo-panel-recruits-level-test.cjs
 */
const fs = require('fs');
const path = require('path');

let esbuild;
try {
  esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
} catch (_) {
  esbuild = require('esbuild');
}

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  OK:', label); }
  else { fail++; console.error('  FAIL:', label); }
}

async function main() {
  console.log('diplo-panel-recruits-level-test');
  const GRA = path.resolve(__dirname, '..');

  // ===========================================================================
  // CZĘŚĆ A — main.ts: wiązanie danych w getState audiencji
  // ===========================================================================
  console.log('CZĘŚĆ A — main.ts (wiązanie puli rekrutów do audiencji)');
  {
    const src = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');

    const fields = ['playerRecruits: recruitsPlayer.rekruci', 'playerRecruitsMax: recruitsPlayer.max',
      'otherRecruits: recruitsOther.rekruci', 'otherRecruitsMax: recruitsOther.max'];
    for (const f of fields) {
      ok(src.includes(f), '[A1] getState audiencji zawiera „' + f + '”');
    }

    const fnIdx = src.indexOf('function audienceRecruitsForOwner(ownerId: number)');
    ok(fnIdx >= 0, '[A2] function audienceRecruitsForOwner(ownerId: number) istnieje w main.ts');
    const fnEnd = fnIdx >= 0 ? src.indexOf('\n    }', fnIdx) : -1;
    const body = (fnIdx >= 0 && fnEnd > fnIdx) ? src.slice(fnIdx, fnEnd) : '';
    ok(body.includes('empirePoborTotals(cities, ownerId, ep, maxMult).rekruci'),
      '[A2] bieżąca pula = empirePoborTotals(...).rekruci (ta sama definicja co panel werbu)');
    ok(body.includes('civManpowerMultsForOwner(ownerId).maxMult'),
      '[A2] mnożnik maxMult z civManpowerMultsForOwner (jak getEmpireRekruciTotal)');
    ok(body.includes('cityManpowerMax(c.population, ep, maxMult)'),
      '[A2] maksimum = suma cityManpowerMax po miastach ownera');
  }

  // ===========================================================================
  // CZĘŚĆ B — UI: realne playerCardHtml / otherCardHtml (esbuild bundle)
  // ===========================================================================
  console.log('CZĘŚĆ B — karty audiencji renderują „Rekruci”');
  {
    const STUB_DIR = path.resolve(__dirname, '.stubs');
    fs.mkdirSync(STUB_DIR, { recursive: true });
    const stubs = {
      music: path.resolve(STUB_DIR, 'recruits-music-stub.ts'),
      diploUiSkin: path.resolve(STUB_DIR, 'recruits-diplouiskin-stub.ts'),
      negotiationModal: path.resolve(STUB_DIR, 'recruits-negotiationmodal-stub.ts'),
      tradeBasket: path.resolve(STUB_DIR, 'recruits-tradebasket-stub.ts'),
      leaderPortraits: path.resolve(STUB_DIR, 'recruits-leaderportraits-stub.ts'),
      civBrandDisplay: path.resolve(STUB_DIR, 'recruits-civbranddisplay-stub.ts'),
      brandAssets: path.resolve(STUB_DIR, 'recruits-brandassets-stub.ts'),
    };
    fs.writeFileSync(stubs.music, [
      'export function startDiplomacyMusic() {}',
      'export function stopDiplomacyMusic() {}',
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.diploUiSkin, [
      "export function civLeaderMedallionHtmlById() { return ''; }",
      "export function dipBrandIconHtml() { return ''; }",
      "export function dipCapitalLocateBtnHtml() { return ''; }",
      "export const DIPLO_1E_SHARED_CSS = '';",
      'export function ensureDiploBrandScope() {}',
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.negotiationModal, [
      'export function actionNeedsNegotiation() { return false; }',
      'export function showNegotiationModal() {}',
      'export function proposalActionIdFromPayload() { return undefined; }',
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.tradeBasket, [
      'export function actionUsesTradeBasket() { return false; }',
      "export function getTradeBasketMode() { return 'trade'; }",
      'export function showTradeBasketModal() {}',
      'export function hideTradeBasketModal() {}',
      'export function openQuickDealBasket() {}',
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.leaderPortraits, [
      'export function leaderPortraitUrl() { return null; }',
      'export function leaderName() { return null; }',
      'export function leaderNameFromPool() { return null; }',
      'export function civDisplayNameFromKey() { return null; }',
      'export function civCardDisplayName(label) { return label; }',
      'export function civIconIdFromCivLabel() { return null; }',
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

    const ENTRY = path.resolve(__dirname, '.recruits-card-entry.ts');
    const BUNDLE = path.resolve(__dirname, '.recruits-card-bundle.cjs');
    fs.writeFileSync(ENTRY,
      "export { otherCardHtml, playerCardHtml } from '../src/ui/diplomacyAudience.ts';\n", 'utf8');

    try {
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
          name: 'stub-vite-assets-recruits',
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

      const { otherCardHtml, playerCardHtml } = require(BUNDLE);

      function baseState(extra) {
        return Object.assign({
          playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Przedstawiciel', otherCivName: 'Grecja',
          zaufanie: 50, respekt: 50, tier: 1, layer: 'full', contactEstablished: true,
          actions: [], playerPower: 100, otherPower: 80,
        }, extra);
      }

      // B1: rozmówca 1240 / 2000 → „1 240 / 2 000”, pasek 62%, tooltip.
      {
        const html = otherCardHtml(baseState({ otherRecruits: 1240, otherRecruitsMax: 2000 }), []);
        ok(html.includes('Rekruci'), '[B1] karta rozmówcy zawiera etykietę „Rekruci”');
        ok(html.includes('1\u00a0240 / 2\u00a0000'), '[B1] wartość „1 240 / 2 000” z separatorem tysięcy (NBSP jak w reszcie gry)');
        ok(/<i style="width:62%"><\/i>/.test(html), '[B1] pasek puli = 62% (1240/2000)');
        ok(html.includes('title="Rekruci = pula werbu'), '[B1] wiersz ma tooltip z wyjaśnieniem');
        ok(html.indexOf('Rekruci') > html.indexOf('Moc militarna'),
          '[B1] wiersz Rekruci leży obok (po) Mocy militarnej w sekcji Atrybuty');
      }

      // B2: gracz — ten sam wiersz z własnymi liczbami.
      {
        const html = playerCardHtml(baseState({ playerRecruits: 300, playerRecruitsMax: 1000 }));
        ok(html.includes('Rekruci') && html.includes('300 / 1\u00a0000'), '[B2] karta gracza: „300 / 1 000”');
        ok(/<i style="width:30%"><\/i>/.test(html), '[B2] pasek gracza = 30%');
      }

      // B3: brak danych → brak wiersza.
      {
        const html = otherCardHtml(baseState({}), []);
        ok(!html.includes('Rekruci'), '[B3] brak danych rekrutów → wiersz pominięty, bez „Rekruci”');
        const html2 = playerCardHtml(baseState({ playerRecruits: 5 }));
        ok(!html2.includes('Rekruci'), '[B3] tylko bieżąca bez maksimum → wiersz pominięty');
      }

      // B4: maksimum 0 → „0 / 0”, pasek 0%, bez NaN.
      {
        const html = otherCardHtml(baseState({ otherRecruits: 0, otherRecruitsMax: 0 }), []);
        ok(html.includes('0 / 0'), '[B4] max 0 → „0 / 0”');
        ok(/<i style="width:0%"><\/i>/.test(html), '[B4] max 0 → pasek 0%');
        ok(!html.includes('NaN') && !html.includes('Infinity'), '[B4] brak NaN/Infinity');
      }

      // B5: wartości ujemne i ułamkowe są obcinane.
      {
        const html = otherCardHtml(baseState({ otherRecruits: -4.6, otherRecruitsMax: 2000.4 }), []);
        ok(html.includes('0 / 2\u00a0000'), '[B5] ujemna pula → 0, ułamek maksimum zaokrąglony („0 / 2 000”)');
        ok(!html.includes('-0') && !html.includes('NaN'), '[B5] brak minusa i NaN w wyjściu');
      }
    } finally {
      for (const f of Object.values(stubs).concat([ENTRY, BUNDLE])) {
        try { fs.unlinkSync(f); } catch (_) {}
      }
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
  console.error('[diplo-panel-recruits-level-test] błąd:', (e && e.stack) || e);
  process.exit(1);
});
