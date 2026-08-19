'use strict';

/**
 * Kontrakt R-DYPLO-INFOGRAFIKI-TOOLTIPY-Q1.
 *
 * Test uruchamia rzeczywiste funkcje renderujące z diplomacyAudience.ts. Nie skanuje
 * literalnych stringów: wynik HTML powstaje z actionBarHtml/treatiesColumnHtml dla
 * stanów testowych. Zależności integracyjne są stubowane, ale diploUiSkin i jego
 * dipBrandIconHtml są ładowane z produkcji; brandAssets dostaje tylko testowy adapter
 * dla Vite import.meta.glob, aby ten test CommonJS mógł użyć prawdziwych SVG.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');

function loadTypeScript() {
  try { return require('typescript'); }
  catch (localError) {
    const shared = path.resolve(ROOT, '..', '..', 'gra', 'node_modules', 'typescript');
    try { return require(shared); }
    catch (sharedError) {
      throw new Error('TypeScript niedostępny lokalnie: ' + localError.message + '; ' + sharedError.message);
    }
  }
}

const ts = loadTypeScript();
const originalLoad = Module._load;
const originalTsLoader = require.extensions['.ts'];

// Te moduły są zależnościami integrującymi renderer z DOM/audio/modalami. Stub nie
// zastępuje renderera: zwraca tylko deterministyczne ikony i no-op callbacki.
Module._load = function (request, parent, isMain) {
  if (request.endsWith('/game/diplomacy-display')) {
    return {
      TRAKTAT_HANDLOWY_LABEL: 'Szlak handlowy',
      effectiveNastawienieScores() { return {}; }, nastawienieHintPl() { return ''; },
      nastawienieLabelFromScore() { return ''; }, wiarygodnoscBadgeHtml() { return ''; },
      wiarygodnoscTooltipPl() { return ''; }, wiarygodnoscTooltipDefPl() { return ''; },
    };
  }
  if (request.endsWith('/game/diplomacy-credibility')) {
    return {
      wiarygodnoscLabelPl() { return ''; }, wiarygodnoscTooltipRozbiciePl() { return ''; },
    };
  }
  if (request.endsWith('/game/diplomacy-audience-actions')) {
    return {
      audienceActionBarLockNote(action) { return action?.lockNote || ''; },
      audienceActionStatusNote() { return ''; }, uiActionAllowsMultipleOwnOnTable() { return false; },
    };
  }
  if (request.endsWith('/game/diplomacy-proposals')) {
    return { proposalHasResourceAccess() { return true; }, RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON: '' };
  }
  if (request.endsWith('/game/diplomacy-acceptance-points')) {
    return { bilateralTreatyDisplayPw() { return ''; }, partnerTreatyDisplayPw() { return ''; }, playerTreatyDisplayPw() { return ''; } };
  }
  if (request.endsWith('/unitCtxDockDiploGate')) {
    return { notifyDiploUiVisibilityChange() {} };
  }
  if (request.endsWith('/escapeOverlayStack')) {
    return { pushOverlay() {}, popOverlay() {} };
  }
  if (request.endsWith('/diplomacyDealDisplay')) {
    return { renderNegotiationTableDealSideHtml() { return ''; }, negotiationTableDealSideHasContent() { return false; } };
  }
  if (request.endsWith('/diplomacyAcceptanceBalance')) {
    return {
      balancePanelDataFromRows() { return {}; }, filterActionableNegotiationRows(rows) { return rows || []; },
      renderPnBalancePanelHtml() { return ''; },
    };
  }
  if (request.endsWith('/muzyka-antyczna')) {
    return { startDiplomacyMusic() {}, stopDiplomacyMusic() {} };
  }
  if (request.endsWith('/data/loader')) {
    return { categoryOf() { return 'inne'; } };
  }
  if (request.endsWith('/units/setup')) {
    return { categoryOf() { return 'inne'; } };
  }
  if (request.endsWith('/brandTokenVars')) {
    return { CIV_BRAND_SCOPE_VARS: '', ensureBrandRootTokens() {} };
  }
  if (request.endsWith('/leaderPortraits')) {
    return { civCardDisplayName(label) { return label; }, leaderName() { return null; }, leaderPortraitUrl() { return null; } };
  }
  if (request.endsWith('/civBrandDisplay')) {
    return { civBrandLineForKey() { return ''; } };
  }
  if (request.endsWith('/diplomacyNegotiationModal')) {
    return { actionNeedsNegotiation() { return false; }, showNegotiationModal() {} };
  }
  if (request.endsWith('/diplomacyTradeBasket')) {
    return {
      actionUsesTradeBasket() { return false; }, getTradeBasketMode() { return 'trade'; },
      showTradeBasketModal() {}, hideTradeBasketModal() {}, openQuickDealBasket() {},
    };
  }
  if (request.endsWith('/diploUiSkin')) {
    return originalLoad.call(this, request, parent, isMain);
  }
  return originalLoad.call(this, request, parent, isMain);
};

require.extensions['.ts'] = function transpileOnLoad(module, filename) {
  let source = fs.readFileSync(filename, 'utf8');
  if (filename.endsWith(path.join('ui', 'icons', 'brandAssets.ts'))) {
    const brandDir = path.join(ROOT, 'src', 'ui', 'icons', 'brand');
    const svgFiles = [];
    (function collect(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) collect(full);
        else if (entry.name.endsWith('.svg')) svgFiles.push([`./brand/${path.relative(brandDir, full).replace(/\\/g, '/')}`, fs.readFileSync(full, 'utf8')]);
      }
    })(brandDir);
    source = source
      .replace(/import [^;]+ from ['\"]\.\/brand\/menu-emblem\.svg\?raw['\"];\r?\n/, "const menuEmblemSvg = '';\n")
      .replace(/import [^;]+ from ['\"]\.\/brand\/(?:motion|menu-background|menu-components)\.css\?raw['\"];\r?\n/g, '')
      .replace(/const svgBySuffix =/, "const motionCss = ''; const menuBackgroundCss = ''; const menuComponentsCss = '';\nconst svgBySuffix =")
      .replace(/const svgBySuffix = import\.meta\.glob\([\s\S]*?\) as Record<string, string>;/, `const svgBySuffix = ${JSON.stringify(Object.fromEntries(svgFiles))};`);
  }
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

let pass = 0;
let fail = 0;
function ok(condition, message) {
  if (condition) pass++;
  else { fail++; console.error('[FAIL]', message); }
}

function baseState(overrides = {}) {
  return {
    playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Rozmówca', otherCivName: 'Grecja',
    zaufanie: 80, respekt: 60, tier: 2, layer: 'full', contactEstablished: true,
    actions: [
      { id: '11', label: 'Wypowiedz wojnę', enabled: true }, { id: '10', label: 'Zaproponuj pokój', enabled: true },
      { id: '3', label: 'Sojusz', enabled: true }, { id: '2', label: 'Pakt o nieagresji', enabled: true },
      { id: '5', label: 'Szlak handlowy', enabled: true }, { id: '14', label: 'Umowa wymiany', enabled: true },
      { id: '13', label: 'Przekaż dar', enabled: true }, { id: '12', label: 'Wasalizacja', enabled: true },
      { id: '15', label: 'Wchłonięcie', enabled: true },
    ],
    ...overrides,
  };
}

try {
  const { actionBarHtml, treatiesColumnHtml } = require(path.join(ROOT, 'src/ui/diplomacyAudience.ts'));
  const enabledHtml = actionBarHtml(baseState());
  ok(enabledHtml.includes('<rect x="4" y="9" width="16" height="11"'), 'renderer wyprowadza produkcyjne SVG dip-gift');
  ok(enabledHtml.includes('M4 18l2-9 4 4 2-6 2 6 4-4 2 9z'), 'renderer wyprowadza produkcyjne SVG dip-vassal');
  ok(fs.readFileSync(path.join(ROOT, 'src/ui/icons/brand/dip-gift.svg'), 'utf8').includes('<rect'), 'artefakt produkcyjny dip-gift.svg istnieje i nie jest stubem');
  ok(fs.readFileSync(path.join(ROOT, 'src/ui/icons/brand/dip-vassal.svg'), 'utf8').includes('M4 18h16v2H4'), 'artefakt produkcyjny dip-vassal.svg istnieje i nie jest stubem');
  ok(enabledHtml.includes('aria-label="Przekaż dar"'), 'renderer wyprowadza aria-label daru');
  ok(enabledHtml.includes('aria-label="Wasalizacja"'), 'renderer wyprowadza aria-label wasalizacji');
  ok(enabledHtml.includes('data-aid="13"'), 'akcja daru zachowuje data-aid wiążące ją z istniejącym handlerem');
  ok(enabledHtml.includes('aria-label="auto-uczciwa wymiana"'), 'renderer wyprowadza aria-label szybkiej wymiany');

  const lockedHtml = actionBarHtml(baseState({
    actions: [{ id: '13', label: 'Przekaż dar', enabled: false, lockNote: 'Wymaga Relacji 91 (masz 80)' }],
  }));
  ok(lockedHtml.includes('data-aid="13"') && lockedHtml.includes(' disabled title="Wymaga Relacji 91 (masz 80)" aria-label="Wymaga Relacji 91 (masz 80)"'),
    'niedostępna akcja zachowuje disabled, data-aid oraz powód blokady');

  const treatiesHtml = treatiesColumnHtml(baseState({
    activeTreaties: [{ id: 'deal-1', label: 'Pakt o nieagresji', breakPenaltyLabel: '−10 Wiarygodności' }],
  }));
  ok(treatiesHtml.includes('aria-label="Zerwij traktat — niedostępne"'),
    'produkcyjny renderer traktatów nadaje aria-label ikonowemu „Zerwij traktat”');

  const activeTreatiesHtml = treatiesColumnHtml(baseState({
    activeTreaties: [{ id: 'deal-42', label: 'Pakt o nieagresji', breakPenaltyLabel: '−10 Wiarygodności' }],
  }), () => {});
  ok(activeTreatiesHtml.includes('data-deal-id="deal-42"') && !activeTreatiesHtml.includes('data-deal-id="deal-42" disabled'),
    'aktywna gałąź zerwania zachowuje data-deal-id i usuwa disabled tylko przy istniejącym handlerze');
  ok(activeTreatiesHtml.includes('title="Zerwij traktat — kara: −10 Wiarygodności"'),
    'aktywna gałąź zerwania pokazuje tooltip kary');

  console.log(`[diplomacy-infografiki-tooltipy-test] ${pass} OK, ${fail} FAIL`);
  process.exitCode = fail > 0 ? 1 : 0;
} catch (error) {
  console.error('[ERROR]', error.stack || error.message || error);
  process.exitCode = 1;
} finally {
  Module._load = originalLoad;
  if (originalTsLoader) require.extensions['.ts'] = originalTsLoader;
  else delete require.extensions['.ts'];
}
