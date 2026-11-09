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


// R-WEB-DIPLO-QUICK-ACTIONS-BAR-READABLE-Q1 — pasek szybkich decyzji dyplomacji.
// Kontrakt: pod każdą ikoną JEDNO krótkie słowo (≤ 12 znaków, bez wielokropka); pełny powód
// blokady idzie do title/aria (nie pod ikonę); zablokowana akcja = przygaszona + kłódka;
// etykiety białe/jasne (nie czerwone); kafelek SZYBKA WYMIANA nie jest ściśnięty do 74 px.

try {
  const { actionBarHtml } = require(path.join(ROOT, 'src/ui/diplomacyAudience.ts'));
  const html = actionBarHtml(baseState({
    actions: [
      { id: '11', label: 'Wypowiedz wojnę', enabled: false, locked: true, lockNote: 'niedostępna — nie trwa wojna' },
      { id: '10', label: 'Zaproponuj pokój', enabled: true },
      { id: '3', label: 'Sojusz', enabled: false, locked: true, lockNote: 'zablokowana — wymaga Zaufania 91 (masz 34)' },
      { id: '2', label: 'Pakt o nieagresji', enabled: true },
      { id: '5', label: 'Traktat handlowy', enabled: true },
      { id: '14', label: 'Umowa wymiany', enabled: false, locked: true, lockNote: 'zablokowana — nie zbadano technologii Wymiana' },
      { id: '13', label: 'Przekaż dar', enabled: true },
      { id: '12', label: 'Wasalizacja', enabled: false, locked: true, lockNote: 'zablokowana — brak aktywnej wasalizacji' },
      { id: '15', label: 'Wchłonięcie', enabled: true },
    ],
  }));

  // (1) Każda z 9 akcji ma etykietę-słowo pod ikoną.
  const lbls = [...html.matchAll(/<span class="da-abtn-lbl">([^<]*)<\/span>/g)].map(m => m[1]);
  ok(lbls.length === 9, '(1) pasek ma 9 etykiet pod ikonami (jest ' + lbls.length + ')');
  for (const t of lbls) {
    ok(!/\s/.test(t) && t.length > 0 && t.length <= 12, '(1) etykieta „' + t + '” to jedno słowo ≤ 12 znaków');
    ok(!t.includes('…') && !t.includes('...'), '(1) etykieta „' + t + '” bez elipsy');
  }
  ok(new Set(lbls).size === lbls.length, '(1) etykiety są unikalne (brak dwóch akcji o tym samym słowie)');

  // (2) Pełny powód blokady zostaje w title i aria-label przycisku (nie znika).
  ok(html.includes('title="zablokowana — wymaga Zaufania 91 (masz 34)" aria-label="zablokowana — wymaga Zaufania 91 (masz 34)"'),
    '(2) powód blokady Sojuszu zachowany w title/aria-label');
  ok(html.includes('title="niedostępna — nie trwa wojna"'), '(2) powód blokady wojny zachowany w title');
  ok(!html.includes('da-abtn-note'), '(2) brak starej, wielosłownej notki pod ikoną (klasa da-abtn-note usunięta)');

  // (3) Zablokowane = stan wizualny: klasa is-locked + kłódka + disabled.
  const lockedBtns = [...html.matchAll(/<button type="button" class="da-abtn[^"]*is-locked[^"]*"[^>]*disabled[^>]*>/g)].length;
  ok(lockedBtns === 4, '(3) cztery zablokowane przyciski (wojna, sojusz, wymiana, wasal) mają is-locked i disabled (jest ' + lockedBtns + ')');
  ok((html.match(/da-abtn-lock/g) || []).length >= 4, '(3) kłódka (da-abtn-lock) przy zablokowanych akcjach');

  // (4) Kolor etykiet: biały / jasny, nie czerwony (CSS).
  const src = fs.readFileSync(path.join(ROOT, 'src/ui/diplomacyAudience.ts'), 'utf8');
  const lblRule = src.match(/\.da-abtn-lbl\{[^}]*\}/);
  ok(lblRule && /color:#ffffff/.test(lblRule[0]), '(4) etykieta pod ikoną ma kolor #ffffff');
  ok(!/\.da-abtn-lbl[^{]*\{[^}]*#e08a8a/.test(src), '(4) etykiety nie używają czerwonego #e08a8a');
  const lockedLbl = src.match(/\.da-abtn-cell\.is-locked \.da-abtn-lbl\{[^}]*\}/);
  ok(lockedLbl && /color:#c9ced8/.test(lockedLbl[0]), '(4) zablokowana etykieta jasna przygaszona (#c9ced8), nie czerwona');
  // Kontrast WCAG AA (≥ 4,5:1) #c9ced8 i #ffffff na tle paska #0a0d14.
  const lum = hex => {
    const c = [0, 2, 4].map(i => parseInt(hex.slice(1 + i, 3 + i), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  ok(contrast('#c9ced8', '#0a0d14') >= 4.5, '(4) kontrast #c9ced8 na #0a0d14 ≥ 4,5:1 (WCAG AA)');
  ok(contrast('#ffffff', '#0a0d14') >= 4.5, '(4) kontrast #ffffff na #0a0d14 ≥ 4,5:1 (WCAG AA)');

  // (5) Wyrównanie: stały slot wysokości 52 px dla każdej ikony/CTA, stała szerokość kafelka;
  //     CTA nie jest ściśnięte do 74 px (stara przyczyna nachodzenia na sąsiednie kafelki).
  ok(/\.da-abtn-slot\{height:52px;/.test(src), '(5) wspólny slot wysokości 52 px (linia bazowa etykiet)');
  ok(/\.da-abtn-cell\{[^}]*width:84px;/.test(src), '(5) stała szerokość kafelka 84 px');
  ok(/\.da-abtn-cell--cta\{width:auto;/.test(src), '(5) CTA ma auto-szerokość (nie max-width:74px)');
  ok(!/max-width:74px/.test(src), '(5) brak starego max-width:74px na kafelkach paska');
  ok(html.includes('class="da-abtn-cell da-abtn-cell--cta') && html.includes('da-quickdeal'),
    '(5) CTA SZYBKA WYMIANA renderowany w osobnej komórce --cta');

  // (6) SZYBKA WYMIANA zachowuje klasę i stan (kontrakt testu wiązania).
  ok(html.includes('class="da-quickdeal" disabled'), '(6) SZYBKA WYMIANA zablokowana = disabled');
  const enabledHtml = actionBarHtml(baseState());
  ok(enabledHtml.includes('class="da-quickdeal"') && !enabledHtml.includes('class="da-quickdeal" disabled'),
    '(6) SZYBKA WYMIANA odblokowana = klikalna (brak disabled)');
  ok(enabledHtml.includes('aria-label="Przekaż dar"') && enabledHtml.includes('aria-label="auto-uczciwa wymiana"'),
    '(6) aria-label odblokowanych akcji i CTA bez zmian');

  console.log(`[diplo-quick-actions-labels-test] ${pass} OK, ${fail} FAIL`);
  process.exitCode = fail > 0 ? 1 : 0;
} catch (error) {
  console.error('[ERROR]', error.stack || error.message || error);
  process.exitCode = 1;
} finally {
  Module._load = originalLoad;
  if (originalTsLoader) require.extensions['.ts'] = originalTsLoader;
  else delete require.extensions['.ts'];
}
