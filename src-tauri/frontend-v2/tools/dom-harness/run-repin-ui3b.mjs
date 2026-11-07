#!/usr/bin/env node
/**
 * run-repin-ui3b.mjs — harness partii REPIN UI-3-B (R-RUSTPORT-REPIN-WEB-UI-3-B-Q1): porty DOM przepięte z web `86d510c66`
 * na web `origin/main` `9b019a7d8` (FALA 509–532), `tools/repin-ui3-manifest.json` → `portDomUI3B`.
 *
 * Moduły partii (klasa PD — port DOM, DTO zamiast `game/*`):
 *   siegeMapPanel.ts      atrycja HP garnizonu WYŁĄCZNIE w etapie głodu: „brak (zapasy)” / „brak garnizonu” / „−N% HP/turę (głód)”;
 *                         web: `setSiegePanelStarveFracProvider`, port: `SiegePanelDto.starveFrac` (ten sam ułamek, „Rust”);
 *   unitRecruitCard.ts    `initialQuantity` (clamp 1..max, zaokrąglenie), `onQuantityChange`, licznik NIE resetuje się po „Rekrutuj”;
 *   armyStackHud.ts       `ArmyStackCard.commanderTitle: ArmyCommanderTitle` (adapter UI-3-A), pole `picked` (bez wpływu na render);
 *   empireDetailTypes.ts  `buildUchwalaSolSpichlerzII` — teksty „Spichlerz Królewski”;
 *   newGameFlow.ts        ustawienie „Automatyzacja budowy” (`auto_build_enabled`, glif `Au`, główna siatka) →
 *                         `NewGameParams.autoBuildEnabled` (= wartość „Włączona”; domyślnie „Wyłączona” → false).
 *
 * WEB:  `git archive 9b019a7d8 gra/src gra/data` (`--web-dir`), moduły spakowane `build.mjs`, WYKONANE w Chromium (Playwright
 *       `/opt/node-tools`, `/opt/pw-browsers/chromium-1194`), serwowane po HTTP z localhost.
 * PORT: `src/ui/**` frontend-v2 (`--src`), ten sam `build.mjs`, ta sama instancja Chromium. Harness gra rolę „Rust”: DTO
 *       z tych samych liczb, które web dostaje przez providery (`food` = web `getCityFood`), katalog = dane weba `9b019a7d8`.
 * Sceny w dwóch oknach 1280×720 i 360×640 (deviceScaleFactor 1, `reducedMotion`), PRAWDZIWE kliknięcia/klawisze Playwright.
 *
 * Porównanie (EXIT 0 <=> wszystko zgodne):
 *   VEC   każdy krok każdej sceny (DOM + log akcji) i każdy wektor funkcji: web === port (JSON);
 *   PIX   zrzuty PNG scen `shot` web vs port: bajty równe;
 *   ERR   `pageerror` + `console.error` = 0 po obu stronach;
 *   COVER asercje na wynikach WEBU (harness naprawdę ćwiczy zmiany FALI 509–532).
 * `--out <plik>`: fixtura (sha256 wektorów WEB, sha256 każdego kroku, sha256 PNG). `--kinds` podzbiór (siege,recruit,stack,edt,ng).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui3b.mjs --web-dir <WEB3_DIR> [--src <src>] [--out <plik>] [--png-dir <dir>] [--kinds <lista>]
 * EXIT 0 <=> brak różnic; 1 <=> >= 1 różnica; 2 <=> błąd harnessu.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const WEB_DIR = argOf('--web-dir');
if (!WEB_DIR) {
  console.error('Użycie: node tools/dom-harness/run-repin-ui3b.mjs --web-dir <katalog z gra/src i gra/data 9b019a7d8> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const WEB_DATA = join(resolve(WEB_DIR), 'gra/data');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
const ALL_KINDS = 'siege,recruit,stack,edt,ng';
const KINDS = new Set((argOf('--kinds') ?? ALL_KINDS).split(','));
const MODULES = ['siegeMapPanel', 'unitRecruitCard', 'armyStackHud', 'empireDetailTypes', 'newGameFlow', 'escapeOverlayStack'];
const VIEWPORTS = [{ width: 1280, height: 720 }, { width: 360, height: 640 }];
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui3b-'));
const J = (p) => JSON.stringify(p);

for (const m of MODULES) {
  for (const dir of [join(SRC, 'ui'), join(WEB_SRC, 'ui')]) {
    if (!existsSync(join(dir, m + '.ts'))) {
      console.error(`BRAK modułu ${join(dir, m + '.ts')}`);
      process.exit(2);
    }
  }
}
if (!existsSync(join(WEB_DATA, 'ui-params.json'))) {
  console.error(`BRAK ${join(WEB_DATA, 'ui-params.json')} (--web-dir musi zawierać gra/data)`);
  process.exit(2);
}

/* ── Wejścia (strona `pd` = panele, strona `ng` = kreator nowej gry — osobne strony, kreator czyta katalog przy ewaluacji) ── */
const W = (m) => J(join(WEB_SRC, m));
// „Rust”: dane i czyste funkcje WEBA wspólne dla obu stron (web używa ich tylko do wejść, port — do DTO).
const RUST_TS = `
import unitsJson from ${J(join(WEB_DATA, 'units.json'))};
import { categoryOf } from ${W('units/setup.ts')};
import { getCityFood } from ${W('game/turn-economy.ts')};
import * as UB from ${W('game/unit-building-bonuses.ts')};
import * as VT from ${W('game/veteran.ts')};
export const units: any[] = (unitsJson as any[]).filter((u) => u && u.Jednostka);
export function catalog(): any {
  const unitCategory: Record<string, string> = {};
  const unitCategoryNameOnly: Record<string, string> = { '': categoryOf('', '', false, undefined) };
  for (const u of units) {
    unitCategory[u.Jednostka] = categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    unitCategoryNameOnly[u.Jednostka] = categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  return { contentHash: 'harness-ui3b', units, unitCategory, unitCategoryNameOnly };
}
export const food = (c: any) => getCityFood(c);
export const badges = (inp: any) => ({
  softPath: UB.softPathBadgeLevel({ parametryBonusProc: inp.parametryPathPp ?? 0 } as any),
  armorPath: UB.armorPathBadgeLevel({ pancerzBonusProc: inp.pancerzPathPp ?? 0 } as any),
  veteranStars: VT.veteranStarCount(inp.veteranProgress ?? null),
});
`;

function writeEntries() {
  writeFileSync(join(TMP, 'rust-ui3b.ts'), RUST_TS);
  const ui = (dir, m) => J(join(dir, 'ui', m));
  const files = {};
  files['pd-web'] = join(TMP, 'entry-pd-web.ts');
  writeFileSync(files['pd-web'], [
    `import * as R from './rust-ui3b';`,
    `(globalThis as any).__boot = async () => {`,
    `  const [sg, urc, ash, edt, eo] = await Promise.all([import(${ui(WEB_SRC, 'siegeMapPanel')}), import(${ui(WEB_SRC, 'unitRecruitCard')}),`,
    `    import(${ui(WEB_SRC, 'armyStackHud')}), import(${ui(WEB_SRC, 'empireDetailTypes')}), import(${ui(WEB_SRC, 'escapeOverlayStack')})]);`,
    `  (globalThis as any).__ui3b = { side: 'web', sg, urc, ash, edt, eo, R, cat: null };`,
    `};`, '',
  ].join('\n'));
  files['pd-port'] = join(TMP, 'entry-pd-port.ts');
  writeFileSync(files['pd-port'], [
    `import * as R from './rust-ui3b';`,
    `import { installStaticCatalog } from ${J(join(SRC, 'controller/staticCatalog'))};`,
    `(globalThis as any).__boot = async () => {`,
    `  const cat = R.catalog();`,
    `  installStaticCatalog(cat);`,
    `  const [sg, urc, ash, edt, eo] = await Promise.all([import(${ui(SRC, 'siegeMapPanel')}), import(${ui(SRC, 'unitRecruitCard')}),`,
    `    import(${ui(SRC, 'armyStackHud')}), import(${ui(SRC, 'empireDetailTypes')}), import(${ui(SRC, 'escapeOverlayStack')})]);`,
    `  (globalThis as any).__ui3b = { side: 'port', sg, urc, ash, edt, eo, R, cat };`,
    `};`, '',
  ].join('\n'));
  // Kreator: jak `run-repin-ui2f.mjs` — „Rust” = dane i funkcje WEBA `9b019a7d8` (katalog `uiParams` = `gra/data/ui-params.json`).
  files['ng-web'] = join(TMP, 'entry-ng-web.ts');
  writeFileSync(files['ng-web'], [
    `import { loadGameData } from ${W('data/loader')};`,
    `import { startPreviewSummaryRows } from ${W('game/start-preview')};`,
    `(globalThis as any).__boot = async () => {`,
    `  const flow = await import(${ui(WEB_SRC, 'newGameFlow')});`,
    `  (globalThis as any).__ng = { side: 'web', flow, data: loadGameData(), summaryRows: (p: any) => startPreviewSummaryRows(p) };`,
    `};`, '',
  ].join('\n'));
  files['ng-port'] = join(TMP, 'entry-ng-port.ts');
  writeFileSync(files['ng-port'], [
    `import { loadGameData } from ${W('data/loader')};`,
    `import * as ND from ${W('map/newGameMapDefaults')};`,
    `import * as SP from ${W('game/start-preview')};`,
    `import * as CM from ${W('game/civ-matrix-semantic')};`,
    `import uiParams from ${J(join(WEB_DATA, 'ui-params.json'))};`,
    `import { installStaticCatalog } from ${J(join(SRC, 'controller/staticCatalog'))};`,
    `import { installNewGameQueries } from ${J(join(SRC, 'controller/newGameQueries'))};`,
    `(globalThis as any).__boot = async () => {`,
    `  const data: any = loadGameData();`,
    `  installStaticCatalog({`,
    `    contentHash: 'harness-web-9b019a7d8', buildings: [], units: [], tech: { technologie: [] }, terrainImprovements: {},`,
    `    wonders: { cuda: [] }, counters: {}, civs: data.civs, cityNamesPools: data.cityNamesPools, powerParams: {},`,
    `    uiParams: JSON.parse(JSON.stringify(uiParams)), wiki: { poradnik: [], encyklopedia: [] },`,
    `    constants: { newGameDefaultPlayerCivId: ND.DEFAULT_PLAYER_CIV_ID, newGameDefaultStartEpochId: ND.DEFAULT_START_EPOCH_ID,`,
    `      newGameDefaultRenderQuality: ND.DEFAULT_RENDER_QUALITY, maxTypyCywilizacjiMenu: ND.MAX_TYPY_CYWILIZACJI_MENU,`,
    `      landFractionPercentOpts: [...ND.LAND_FRACTION_PERCENT_OPTS] },`,
    `    labels: {}, unitCategory: {}, unitCategoryNameOnly: {}, techTerrainUnlockLabels: {},`,
    `  } as any);`,
    `  const ORDER = ['kamien', 'braz', 'zelazo'];`,
    `  const idx = (id: string) => { const i = ORDER.indexOf(id); return i >= 0 ? i : ORDER.length; };`,
    `  const minIdx = (ep: readonly string[]) => (ep.length === 0 ? 0 : Math.min(...ep.map(idx)));`,
    `  installNewGameQueries({`,
    `    miastaPanstwaMenuForMapLabel: (l: string) => ND.miastaPanstwaMenuForMapLabel(l),`,
    `    civTypesMenuForMapLabel: (l: string, e: string, r: any) => ND.civTypesMenuForMapLabel(l, e, r),`,
    `    defaultMiastaPanstwaFromMapLabel: (l: string) => ND.defaultMiastaPanstwaFromMapLabel(l),`,
    `    defaultCivTypesFromMapLabel: (l: string, e: string, r: any) => ND.defaultCivTypesFromMapLabel(l, e, r),`,
    `    maxCivTypesForStartEpoch: (e: string, r: any) => ND.maxCivTypesForStartEpoch(e, r),`,
    `    clampMiastaPanstwaCount: (n: number) => ND.clampMiastaPanstwaCount(n),`,
    `    typSwiataFromMenuLabel: (l: string) => ND.typSwiataFromMenuLabel(l),`,
    `    defaultLandFractionPercentForTyp: (t: any) => ND.defaultLandFractionPercentForTyp(t),`,
    `    worldGenerationPresetFromLabels: (x: any) => ND.worldGenerationPresetFromLabels(x),`,
    `    buildStartPreview: (input: any) => { const p: any = SP.buildStartPreview(input); return { ...p, summaryRows: SP.startPreviewSummaryRows(p) }; },`,
    `    civMatrixProfile: (civKey: string) => { const pr: any = CM.buildCivMatrixSemanticProfile(civKey); return {`,
    `      civilizationId: pr.civilizationId, civilizationName: pr.civilizationName, parameterCount: pr.parameterCount,`,
    `      activeCount: pr.activeCount, inactiveCount: pr.inactiveCount, blockedReasonPl: pr.blockedReasonPl,`,
    `      cells: pr.cells.map((c: any) => ({ paramLabel: CM.civMatrixParameterLabelPl(c.parameterId), formatted: CM.civMatrixFormattedValue(c.rawValue, c.unit),`,
    `        baselineFormatted: CM.civMatrixFormattedValue(c.baselineValue, c.unit), intensity: c.signedIntensity,`,
    `        intensityLabel: CM.civMatrixIntensityLabel(c.signedIntensity), visibleByDefault: CM.statusAllowsDefaultVisibility(c.consumerStatus),`,
    `        parameterId: c.parameterId, domain: c.domain, consumerStatus: c.consumerStatus, statusLabelPl: c.statusLabelPl,`,
    `        statusReasonPl: c.statusReasonPl, explanationPl: c.explanationPl, label: c.label, polarity: c.polarity })) }; },`,
    `    civAvailableAtEpoch: (ep: readonly string[], e: string) => minIdx(ep) <= idx(e),`,
    `  } as any);`,
    `  const flow = await import(${ui(SRC, 'newGameFlow')});`,
    `  (globalThis as any).__ng = { side: 'port', flow, data, summaryRows: null };`,
    `};`, '',
  ].join('\n'));
  return files;
}

/* ── Sceny paneli ──────────────────────────────────────────────────────────────────────────────────────── */
const SCENES = [];
// Oblężenie: zapasy (magazyn) × garnizon × ułamek głodu (null = web bez providera / port bez pola DTO).
const STARVE = [null, 0.06, 0.08, 0.123, 0.005, -0.1];
let si = 0;
for (const mag of [7, 1, 0, -3]) {
  for (const garnizon of [0, 3, 40]) {
    for (const sf of STARVE) {
      if (mag > 1 && sf !== null && sf !== 0.08) continue; // etap zapasów: ułamek nieistotny (2 warianty wystarczą)
      if (mag < 0 && sf !== null && sf !== 0.123) continue; // głęboki głód: 2 warianty
      si++;
      const owner = si % 3 === 0 ? 0 : 2;
      SCENES.push({ id: `siege-m${mag}-g${garnizon}-s${sf}`, kind: 'siege', owner, sf, sf2: sf === null ? 0.1 : sf,
        shot: (mag === 0 && garnizon === 40 && sf === 0.08) || (mag === 7 && garnizon === 40 && sf === 0.08) || (mag === 0 && garnizon === 0 && sf === null),
        city: { id: 'c' + si, name: 'Sparta <x>', ownerId: 1, q: 3, r: 4, population: 6 + (si % 7), garnizon, maMur: garnizon > 0, magazynZywnosci: mag,
          siegeCapitulationPending: si % 5 === 0, siegeMachines: { queue: si % 2 ? ['taran'] : [], ready: si % 3 ? [] : ['wieza'], buildProgress: (si % 4) * 0.35 } },
        steps: si % 4 === 0 ? [{ k: 'update' }, { k: 'key', key: '1' }, { k: 'key', key: '2' }, { k: 'key', key: 'Escape' }] : [{ k: 'update' }] });
    }
  }
}
// Karta rekrutacji: zapamiętana liczba × sufit × odpowiedź backendu.
const INITQ = [undefined, 3, 2.6, 2.4, -5, 999, NaN, Infinity, 7];
let ri = 0;
for (const initialQuantity of INITQ) {
  for (const [maxQuantity, accept] of [[undefined, true], [5, false], [10, true]]) {
    ri++;
    const canPurchase = ri % 7 !== 0;
    SCENES.push({ id: `recruit-i${initialQuantity}-m${maxQuantity}-${accept ? 'ok' : 'no'}`, kind: 'recruit', initialQuantity, maxQuantity, accept, canPurchase,
      track: ri % 4 !== 0, skarb: ri % 6 === 0 ? 5 : 500, unitIdx: ri,
      shot: (initialQuantity === 3 && maxQuantity === 5) || (initialQuantity === undefined && maxQuantity === undefined),
      steps: [
        { k: 'click', sel: '[data-recruit-quantity-action="increase"]' }, { k: 'click', sel: '.unit-recruit-submit' },
        { k: 'click', sel: '[data-recruit-quantity-action="increase"]' }, { k: 'click', sel: '[data-recruit-quantity-action="decrease"]' },
        { k: 'click', sel: '.unit-recruit-submit', shot: initialQuantity === 3 && maxQuantity === 5 },
        { k: 'fill', sel: '.unit-recruit-quantity-input', val: '4' }, { k: 'click', sel: '.unit-recruit-submit' },
        { k: 'fill', sel: '.unit-recruit-quantity-input', val: '-2' }, { k: 'key', key: 'Tab' }, { k: 'click', sel: '.unit-recruit-submit' },
        { k: 'rebuild' }, { k: 'click', sel: '.unit-recruit-submit' },
      ] });
  }
}
// Roster armii: karty z rolą dowódcy i polem `picked`.
const STACKS = {
  plain: [['a', 'Hoplita <x>'], ['b', 'Łucznik', undefined, true]],
  gen: [['a', 'Hoplita', 'Generał', true], ['b', 'Wojownik', 'Wódz', false], ['c', 'Zwiadowca', undefined, true], ['d', 'Łucznik']],
  allPicked: [['a', 'Katapulta z bardzo długą nazwą jednostki', 'Generał', true], ['b', 'Jeździec', undefined, true], ['c', 'Osadnik', undefined, true]],
};
for (const [set] of Object.entries(STACKS)) {
  for (const canMS of [false, true]) {
    SCENES.push({ id: `stack-${set}-${canMS ? 'ms' : 'x'}`, kind: 'stack', set, canMS, shot: set === 'gen' && canMS,
      steps: [{ k: 'clickSel', sel: '.ash-card:nth-child(2)' }, { k: 'update' }, { k: 'key', key: 'Escape' }] });
  }
}

/* ── Kod strony paneli ───────────────────────────────────────────────────────────────────────────────── */
const LIB = (DATA) => {
  const U = globalThis.__ui3b;
  const log = [];
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') U.eo.handleEscapeKeydown(e); });
  const act = (n, ret) => (...a) => { log.push(n + JSON.stringify(a)); return ret; };
  const r2 = (v) => Math.round(v * 100) / 100;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map(r2).join(',');
  };
  const desc = (el) => {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    return el.tagName + ['data-act', 'data-uid', 'data-recruit-quantity-action', 'class'].map((a) => (el.hasAttribute(a) ? `[${a}=${el.getAttribute(a)}]` : '')).join('');
  };
  const host = document.createElement('div');
  host.id = 'ui3b-host';
  host.style.cssText = 'position:absolute;left:8px;top:8px;right:8px;background:#141a26;color:#eee;padding:6px';
  document.body.appendChild(host);
  let cur = null;
  let stackApi = null;
  const combat0 = { atakBase: 4, atakEffective: 4, obronaBase: 6, obronaEffective: 6, hpMaxBase: 10, hpMaxEffective: 10, pancerzBase: 1, pancerzEffective: 1,
    weaponDamageBase: 2, weaponDamageEffective: 2, piercingBase: 0, piercingEffective: 0, chargeBonusBase: 0, chargeBonusEffective: 0, missileAttackBase: 0, missileAttackEffective: 0 };
  const siegeCtx = (sc, city) => ({ tryb: 'oblezenie', city, atakujacy: { id: 'a1', typeId: 'Hoplita <h>', ownerId: sc.owner }, garnizonUnit: null, oblegajacyOwnerId: sc.owner });
  /** „Rust”: SiegePanelDto z tych samych liczb co web (wzory pinu dla zużycia, `food` = web getCityFood, `starveFrac` = provider). */
  const siegeDto = (sc, city, sf, est) => {
    const garnizon = city.garnizon ?? 0;
    return {
      ctx: siegeCtx(sc, city),
      city: { id: 0, owner: city.ownerId, q: city.q, r: city.r, name: city.name, mapLabel: city.name, population: city.population, isCapital: false, isMine: false },
      food: U.R.food(city), garnizon, zuzycie: city.population + garnizon,
      atrycjaNext: garnizon > 0 ? Math.max(1, Math.floor(garnizon * 0.08)) : 0,
      milicjaEst: Math.max(0, est), ...(sf === null ? {} : { starveFrac: sf }),
      playerCanStorm: sc.owner === 0, machines: city.siegeMachines,
    };
  };
  const recruitOpts = (sc) => {
    const u = U.R.units[sc.unitIdx % U.R.units.length];
    const koszt = 30 + (sc.unitIdx % 5) * 20;
    const nazwa = u.Jednostka + ' «' + sc.unitIdx + '»';
    const common = {
      udef: u, skarb: sc.skarb, canPurchase: sc.canPurchase, treasuryIconHtml: '<i class="tr">¤</i>', mpCost: sc.unitIdx % 3, manpowerAvailable: 50,
      ...(sc.maxQuantity === undefined ? {} : { maxQuantity: sc.maxQuantity }),
      ...(sc.initialQuantity === undefined && sc.unitIdx % 2 ? {} : { initialQuantity: sc.initialQuantity }),
      ...(sc.track ? { onQuantityChange: act('onQuantityChange') } : {}),
      onRecruit: act('onRecruit', sc.accept),
    };
    return U.side === 'port'
      ? { ...common, data: U.cat, affordable: sc.skarb >= koszt, item: { kind: 'unit', id: u.Jednostka, label: nazwa, koszt, postep: 0, etaTurns: null, stockCost: {}, stockMissing: {} } }
      : { ...common, data: {}, item: { kind: 'unit', id: u.Jednostka, nazwa, koszt } };
  };
  const stackState = (sc) => {
    const st0 = { hexLabel: 'Heks <1>', unitCount: DATA.STACKS[sc.set].length, displayName: 'Hoplita', combat: combat0, mov: 2, rng: 0, hp: 9, actions: [],
      cards: DATA.STACKS[sc.set].map(([id, name, commanderTitle, picked], i) => ({ id, name, ...(commanderTitle ? { commanderTitle } : {}), icon: i % 2 ? '🛡' : '',
        hp: 10 - i, hpMax: 10, ruchLeft: i % 3, ruchMax: 2, active: i === 0, ...(picked === undefined ? {} : { picked }) })) };
    return U.side === 'port' ? { ...st0, badges: U.R.badges(st0) } : st0;
  };
  const H = {
    open(sc) {
      cur = sc;
      log.length = 0;
      host.innerHTML = '';
      if (sc.kind === 'siege') {
        const acts = { onBesiege: act('onBesiege'), onStorm: (c) => log.push('onStorm' + JSON.stringify([c.city.id])), onRetreat: act('onRetreat'), onQueueMachine: act('onQueueMachine') };
        if (U.side === 'web') {
          U.sg.setSiegePanelMilitiaEstimator(() => 2);
          U.sg.setSiegePanelStarveFracProvider(sc.sf === null ? null : () => sc.sf);
          U.sg.showSiegeMapPanel(siegeCtx(sc, sc.city), acts, 3);
        } else U.sg.showSiegeMapPanel(siegeDto(sc, sc.city, sc.sf, 2), acts, 3);
        U.sg.setSiegePanelBesiegerCount(4);
      } else if (sc.kind === 'recruit') {
        if (!document.getElementById('ui3b-urc-css')) {
          const style = document.createElement('style');
          style.id = 'ui3b-urc-css';
          style.textContent = U.urc.UNIT_RECRUIT_CARD_CSS;
          document.head.appendChild(style);
        }
        host.appendChild(U.urc.buildUnitRecruitCard(recruitOpts(sc)));
      } else if (sc.kind === 'stack') {
        const st = stackState(sc);
        stackApi = U.ash.createArmyStackHud({ getStack: () => st, onSelectUnit: act('sel'), onAction: act('act'), onClose: act('close'),
          canMerge: () => sc.canMS, canSplit: () => sc.canMS, onMerge: act('merge'), onSplit: act('split') });
        document.body.appendChild(stackApi.el);
        stackApi.update();
      }
    },
    step(st) {
      const sc = cur;
      if (st.k === 'update' && sc.kind === 'siege') {
        // Następna tura oblężenia: zapasy −2, garnizon +1, inny ułamek głodu.
        const city = { ...sc.city, magazynZywnosci: sc.city.magazynZywnosci - 2, garnizon: (sc.city.garnizon ?? 0) + 1 };
        if (U.side === 'web') {
          U.sg.setSiegePanelMilitiaEstimator(() => 3);
          U.sg.setSiegePanelStarveFracProvider(() => sc.sf2);
          U.sg.updateSiegeMapPanelTurn(4, city);
        } else U.sg.updateSiegeMapPanelTurn(4, siegeDto(sc, city, sc.sf2, 3));
      } else if (st.k === 'update' && stackApi) stackApi.update();
      else if (st.k === 'rebuild') {
        // Przebudowa panelu (np. po „Rekrutuj”): nowa karta z zapamiętaną liczbą = ostatnia zgłoszona przez onQuantityChange.
        const last = [...log].reverse().find((l) => l.startsWith('onQuantityChange'));
        const q = last ? JSON.parse(last.slice('onQuantityChange'.length))[0] : sc.initialQuantity;
        host.innerHTML = '';
        host.appendChild(U.urc.buildUnitRecruitCard(recruitOpts({ ...sc, initialQuantity: q })));
      }
    },
    close() {
      U.sg.hideSiegeMapPanel();
      if (U.side === 'web') { U.sg.setSiegePanelMilitiaEstimator(null); U.sg.setSiegePanelStarveFracProvider(null); }
      if (stackApi) { stackApi.destroy(); stackApi.el.remove(); stackApi = null; }
      host.innerHTML = '';
    },
    state() {
      const sc = cur;
      const st = { html: null, active: desc(document.activeElement), log: log.join(' | ') };
      if (sc.kind === 'siege') {
        const el = document.getElementById('civ-siege-map-panel');
        st.html = el ? el.outerHTML : null;
        st.open = U.sg.isSiegeMapPanelOpen();
        st.cityId = U.sg.getActiveSiegeCityId();
        st.rect = rect(el && el.firstElementChild);
      } else if (sc.kind === 'recruit') {
        st.html = host.innerHTML;
        const inp = host.querySelector('.unit-recruit-quantity-input');
        st.qty = inp ? inp.value : null;
        st.ctl = [...host.querySelectorAll('button,input')].map((b) => b.className + ':' + b.disabled + ':' + b.title).join('\n');
        st.rect = rect(host.firstElementChild);
      } else if (sc.kind === 'stack' && stackApi) {
        st.html = stackApi.el.outerHTML;
        st.rect = rect(stackApi.el);
      }
      return JSON.stringify(st);
    },
    vectors() {
      const safe = (f) => { try { return f(); } catch (e) { return 'THROW:' + String(e && e.message); } };
      const out = {};
      out.uchwala = [];
      for (const aktywna of [true, false]) for (const n of [undefined, null, 0, 1, 2, 5, -3, 2.5]) out.uchwala.push(safe(() => JSON.stringify(U.edt.buildUchwalaSolSpichlerzII(aktywna, n))));
      out.uchwalaId = U.edt.UCHWALA_SOL_SPICHLERZ_II_ID;
      out.identity = [[{ isGeneral: true }, 'Hoplita', 'Generał'], [{}, 'Wojownik', undefined], [{ isGeneral: false }, 'Zwiadowca', 'Wódz']]
        .map(([u, n, t]) => safe(() => JSON.stringify(U.ash.armyStackCardIdentity(u, n, t))));
      out.mp = [[0, 0], [5, 3], [1000, 2500], [1_250_000, 1]].map(([a, r]) => safe(() => U.urc.manpowerStatusTitle(a, r)));
      return JSON.stringify(out);
    },
  };
  globalThis.__h = H;
};
const DATA = { STACKS };

/* ── Scenariusze kreatora (interpreter jak `run-repin-ui2f.mjs`) ───────────────────────────────────────── */
const S4 = [['show'], ['click', '.cta-hero'], ['nav'], ['nav']];
const NG_SCEN = [
  { name: 'ng-k4-ustawienia', ops: S4, shot: true, expect: [['.sett-grid .srow', 13], ['text', 'Automatyzacja budowy'], ['glyph', 'Au']] },
  { name: 'ng-k4-start-domyslne', ops: [...S4, ['nav']], expect: [['log', '"autoBuildEnabled":false']] },
  { name: 'ng-k4-autobuild-wl', ops: [...S4, ['row', 'Automatyzacja budowy', 1, 1]], shot: true, expect: [['text', 'Włączona']] },
  { name: 'ng-k4-autobuild-wl-start', ops: [...S4, ['row', 'Automatyzacja budowy', 1, 1], ['nav']], expect: [['log', '"autoBuildEnabled":true']] },
  { name: 'ng-k4-autobuild-2x-start', ops: [...S4, ['row', 'Automatyzacja budowy', 0, 2], ['nav']], expect: [['log', '"autoBuildEnabled":false']] },
  { name: 'ng-k4-autobuild-lewo-start', ops: [...S4, ['row', 'Automatyzacja budowy', 0, 1], ['nav']], expect: [['log', '"autoBuildEnabled":true']] },
  { name: 'ng-k4-ziemia', ops: [...S4, ['row', 'Typ świata', 1, 3]], expect: [['.sett-grid .srow', 12], ['text', 'Automatyzacja budowy']] },
  { name: 'ng-k4-zaawansowane', ops: [...S4, ['click', '.btn-adv']], expect: [['.adv-overlay.open', 1]] },
  { name: 'ng-prefs-wl', ops: [['prefs', 'civ-new-game-prefs-v1', JSON.stringify({ v: 4, selEpoch: 'kamien', settings: {}, settingLabels: { auto_build_enabled: 'Włączona' } })], ...S4, ['nav']],
    expect: [['log', '"autoBuildEnabled":true']] },
  { name: 'ng-prefs-zle', ops: [['prefs', 'civ-new-game-prefs-v1', JSON.stringify({ v: 4, settings: { auto_build_enabled: 0 }, settingLabels: { auto_build_enabled: 'Może' } })], ...S4, ['nav']], expect: [['log', '"autoBuildEnabled":true']] },
  { name: 'ng-k4-wl-wstecz-dalej', ops: [...S4, ['row', 'Automatyzacja budowy', 1, 1], ['click', '.nav .nb.back'], ['nav'], ['nav']], expect: [['log', '"autoBuildEnabled":true']] },
];
const NG_DRIVER = async (sc) => {
  const G = globalThis.__ng;
  const log = [];
  Math.random = () => 0.4242;
  Date.now = () => 1792665015000;
  const sleep = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  const $$ = (sel) => [...document.querySelectorAll('.civ-newgame ' + sel)];
  const onStart = (params) => {
    const p = JSON.parse(JSON.stringify(params));
    if (p.startPreview) {
      if (G.side === 'port') { log.push('summaryRows=' + JSON.stringify(p.startPreview.summaryRows)); delete p.startPreview.summaryRows; }
      else log.push('summaryRows=' + JSON.stringify(G.summaryRows(params.startPreview)));
    }
    log.push('onStart(' + JSON.stringify(p) + ')');
  };
  const rowsByLabel = (rowSel, lblSel, lbl) => [...document.querySelectorAll('.civ-newgame ' + rowSel)].filter((r) => r.querySelector(lblSel)?.textContent === lbl);
  const missing = [];
  localStorage.clear();
  for (const op of sc.ops) {
    const [k, a, b, c] = op;
    if (k === 'prefs') localStorage.setItem(a, b);
    else if (k === 'show') G.flow.showNewGameFlow({ data: G.data, onStart, onCancel: () => log.push('onCancel()') });
    else if (k === 'click') { const el = $$(a)[b ?? 0]; if (el) el.click(); else missing.push(a + '#' + (b ?? 0)); }
    else if (k === 'nav') { const el = $$('.nav .nb.next')[0]; if (el) el.click(); else missing.push('nav'); }
    else if (k === 'row') {
      for (let i = 0; i < (c ?? 1); i++) {
        const row = rowsByLabel('.sett-grid .srow', '.sl', a)[0];
        if (!row) { missing.push(k + ':' + a); break; }
        row.querySelectorAll('.arr')[b]?.click();
        await sleep();
      }
    }
    await sleep();
  }
  log.push('open=' + G.flow.isNewGameFlowOpen());
  if (missing.length) log.push('BRAK:' + missing.join(','));
  const ls = ['civ-new-game-prefs-v1', 'civ-newgame-prefs-v2'].map((k) => `ls[${k}]=${localStorage.getItem(k)}`);
  return { log, ls, missing };
};
const NG_SER = () => {
  const ser = (node) => {
    if (node.nodeType === 3) return JSON.stringify(node.data);
    if (node.nodeType === 8) return `<!--${node.data}-->`;
    if (node.nodeType !== 1) return '';
    const tag = node.tagName.toLowerCase();
    if (tag === 'script') return '';
    const attrs = [...node.attributes].map((a) => `${a.name}=${JSON.stringify(a.value)}`).sort().join(' ');
    return `<${tag}${attrs ? ' ' + attrs : ''}>${[...node.childNodes].map(ser).join('')}</${tag}>`;
  };
  const styles = [...document.head.querySelectorAll('style')].map((s) => s.id + ':' + s.textContent).join('\n');
  const texts = document.body.textContent;
  const glyphs = [...document.querySelectorAll('.civ-newgame .ng-glyph')].map((e) => e.textContent).join(',');
  return { body: ser(document.body), styles, texts, glyphs };
};

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function serve(dir) {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      const p = join(dir, decodeURIComponent((req.url ?? '/').split('?')[0]));
      if (!p.startsWith(dir) || !existsSync(p)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}
const settle = (page) => page.evaluate(() => new Promise((res) => {
  let n = 0;
  const tick = () => {
    for (const a of document.getAnimations()) {
      try { a.finish(); } catch { /* nieskończona */ }
    }
    if (++n >= 3) res();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}));
const SHOT_STYLE = '*,*::before,*::after{scrollbar-color:transparent transparent !important;caret-color:transparent !important;animation:none !important;transition:none !important}';
async function stableShot(page) {
  let prev = await page.screenshot({ animations: 'disabled', style: SHOT_STYLE });
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(150);
    const cur = await page.screenshot({ animations: 'disabled', style: SHOT_STYLE });
    if (Buffer.compare(prev, cur) === 0) return cur;
    prev = cur;
  }
  return prev;
}
async function openPage(browser, srv, vp, side, errs, tag) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  page.on('pageerror', (e) => errs.push(`${side}/${tag}: pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`${side}/${tag}: console.error ${m.text()}`); });
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
  await page.waitForFunction(() => typeof globalThis.__boot === 'function', null, { timeout: 60000 });
  await page.evaluate(() => globalThis.__boot());
  return page;
}

async function runPanels(browser, side, dir, errs, shots) {
  const srv = await serve(dir);
  const vec = {};
  try {
    for (const vp of VIEWPORTS) {
      const page = await openPage(browser, srv, vp, side, errs, 'pd');
      await page.evaluate(LIB, DATA);
      const vk = `${vp.width}x${vp.height}`;
      if (KINDS.has('edt')) vec[`edt@${vk}`] = [await page.evaluate(() => globalThis.__h.vectors())];
      for (const sc of SCENES.filter((x) => KINDS.has(x.kind))) {
        const states = [];
        await page.evaluate((s) => globalThis.__h.open(s), sc);
        await settle(page);
        states.push(await page.evaluate(() => globalThis.__h.state()));
        if (sc.shot) shots.push({ side, key: `${sc.id}@${vk}`, png: await stableShot(page) });
        for (const st of sc.steps) {
          if (st.k === 'key') await page.keyboard.press(st.key);
          else if (st.k === 'click' || st.k === 'clickSel') {
            const ok = await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (!el) return 'none';
              el.scrollIntoView({ block: 'nearest' });
              return el.disabled ? 'disabled' : 'ok';
            }, st.sel);
            // Wyłączony przycisk: realny klik nie dociera (Playwright czekałby na „enabled”) — `el.click()` = ten sam brak reakcji.
            if (ok === 'ok') await page.click(st.sel, { timeout: 3000 });
            else if (ok === 'disabled') await page.evaluate((sel) => document.querySelector(sel)?.click(), st.sel);
          } else if (st.k === 'fill') {
            if (await page.$eval(st.sel, (e) => !e.disabled).catch(() => false)) await page.fill(st.sel, st.val, { timeout: 3000 });
          } else await page.evaluate((s) => globalThis.__h.step(s), st);
          await settle(page);
          states.push(await page.evaluate(() => globalThis.__h.state()));
          if (st.shot) shots.push({ side, key: `${sc.id}+${st.k}@${vk}`, png: await stableShot(page) });
        }
        await page.evaluate(() => globalThis.__h.close());
        vec[`${sc.id}@${vk}`] = states;
      }
      await page.close();
    }
  } finally {
    srv.close();
  }
  return vec;
}

async function runNewGame(browser, side, dir, errs, shots) {
  const srv = await serve(dir);
  const vec = {};
  try {
    for (const sc of NG_SCEN) {
      const page = await openPage(browser, srv, VIEWPORTS[0], side, errs, sc.name);
      const r = await page.evaluate(NG_DRIVER, sc);
      const states = [JSON.stringify({ log: r.log, ls: r.ls, missing: r.missing })];
      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((ok) => { im.onload = im.onerror = ok; }))));
          await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
        });
        const d = await page.evaluate(NG_SER);
        const counts = {};
        for (const e of sc.expect ?? []) if (e[0].startsWith('.')) counts[e[0]] = await page.evaluate((s) => document.querySelectorAll('.civ-newgame ' + s).length, e[0]);
        states.push(JSON.stringify({ ...d, counts }));
        if (sc.shot) shots.push({ side, key: `${sc.name}@${vp.width}x${vp.height}`, png: await page.screenshot({ animations: 'disabled', caret: 'hide', style: SHOT_STYLE }) });
      }
      vec[sc.name] = states;
      await page.close();
    }
  } finally {
    srv.close();
  }
  return vec;
}

/** Asercje pokrycia na wektorach WEBU. */
function coverage(vec) {
  const checks = [];
  const c = (kind, name, fn) => {
    if (!KINDS.has(kind)) return;
    let ok = false;
    try { ok = !!fn(); } catch { ok = false; }
    checks.push([name, ok]);
  };
  const S = (k, i) => JSON.parse(vec[k][i]);
  for (const vk of ['1280x720', '360x640']) {
    c('siege', `siege@${vk} etap zapasów → „brak (zapasy)”`, () => S(`siege-m7-g40-s0.08@${vk}`, 0).html.includes('Atrycja: <b>brak (zapasy)</b>'));
    c('siege', `siege@${vk} głód bez garnizonu → „brak garnizonu”`, () => S(`siege-m0-g0-s0.08@${vk}`, 0).html.includes('Atrycja: <b>brak garnizonu</b>'));
    c('siege', `siege@${vk} głód 8% → „−8% HP/turę (głód)”`, () => S(`siege-m0-g40-s0.08@${vk}`, 0).html.includes('Atrycja: <b>−8% HP/turę (głód)</b>'));
    c('siege', `siege@${vk} głód 12,3% → zaokrąglenie 12%`, () => S(`siege-m-3-g3-s0.123@${vk}`, 0).html.includes('−12% HP/turę (głód)'));
    c('siege', `siege@${vk} głód 0,5% → „−1%”`, () => S(`siege-m0-g3-s0.005@${vk}`, 0).html.includes('−1% HP/turę (głód)'));
    c('siege', `siege@${vk} brak providera/ułamek ≤ 0 → „brak garnizonu”`, () => S(`siege-m0-g40-snull@${vk}`, 0).html.includes('Atrycja: <b>brak garnizonu</b>')
      && S(`siege-m0-g40-s-0.1@${vk}`, 0).html.includes('Atrycja: <b>brak garnizonu</b>'));
    c('siege', `siege@${vk} przejście zapasy → głód po turze`, () => S(`siege-m1-g3-s0.06@${vk}`, 0).html.includes('brak (zapasy)') && S(`siege-m1-g3-s0.06@${vk}`, 1).html.includes('−6% HP/turę (głód)'));
    c('siege', `siege@${vk} stara formuła „/turę” znikła`, () => !S(`siege-m0-g40-s0.08@${vk}`, 0).html.includes('</b>/turę'));
    c('recruit', `recruit@${vk} initialQuantity 3 (max 5) → pole 3`, () => S(`recruit-i3-m5-no@${vk}`, 0).qty === '3');
    c('recruit', `recruit@${vk} clamp do max i min, zaokrąglenie`, () => S(`recruit-i999-m5-no@${vk}`, 0).qty === '5' && S(`recruit-i-5-m10-ok@${vk}`, 0).qty === '1'
      && S(`recruit-i2.6-m10-ok@${vk}`, 0).qty === '3' && S(`recruit-i2.4-m10-ok@${vk}`, 0).qty === '2' && S(`recruit-iNaN-m10-ok@${vk}`, 0).qty === '1');
    c('recruit', `recruit@${vk} licznik bez resetu po „Rekrutuj” (także odrzucenie)`, () => { const s = S(`recruit-i3-m5-no@${vk}`, 2); return s.qty === '4' && s.log.includes('onRecruit[4]'); });
    c('recruit', `recruit@${vk} onQuantityChange przy +/−/polu`, () => S(`recruit-i3-m5-no@${vk}`, 4).log.startsWith('onQuantityChange[4] | onRecruit[4] | onQuantityChange[5] | onQuantityChange[4]'));
    c('recruit', `recruit@${vk} przebudowa odtwarza zapamiętaną liczbę`, () => { const s = S(`recruit-i3-m5-no@${vk}`, 11); return s.qty === '1' && S(`recruit-i3-m5-no@${vk}`, 12).log.endsWith('onRecruit[1]'); });
    c('stack', `stack@${vk} picked bez wpływu, rola dowódcy`, () => S(`stack-gen-ms@${vk}`, 0).html.includes('ash-card-role">Generał<') && !S(`stack-gen-ms@${vk}`, 0).html.includes('picked'));
    c('edt', `edt@${vk} Spichlerz Królewski`, () => { const v = JSON.parse(vec[`edt@${vk}`][0]); return v.uchwala.some((x) => x.includes('Aktywne Spichlerze Królewskie płacące Sól: 2.')) && v.uchwala.some((x) => x.includes('Spichlerza Królewskiego z dostępem')) && !v.uchwala.some((x) => x.includes('Spichlerz II')); });
  }
  const NG = (n, i) => JSON.parse(vec[n][i]);
  for (const sc of NG_SCEN) {
    for (const e of sc.expect ?? []) {
      c('ng', `${sc.name} ${e.join(' ')}`, () => {
        const st = NG(sc.name, 1);
        if (e[0] === 'log') return NG(sc.name, 0).log.join('\n').includes(e[1]);
        if (e[0] === 'text') return st.texts.includes(e[1]);
        if (e[0] === 'glyph') return st.glyphs.split(',').includes(e[1]);
        return st.counts[e[0]] === e[1];
      });
    }
    c('ng', `${sc.name} bez brakujących elementów`, () => NG(sc.name, 0).missing.length === 0);
  }
  return checks;
}

let exitCode = 0;
let browser = null;
try {
  const entries = writeEntries();
  const dirs = {};
  for (const key of ['pd-web', 'pd-port', 'ng-web', 'ng-port']) {
    const outdir = join(TMP, key);
    const pad = join(TMP, `pad-${key}.ts`);
    writeFileSync(pad, 'export {};\n');
    await bundle([entries[key], pad], outdir);
    const entryJs = readdirSync(outdir, { recursive: true }).map(String).find((f) => f.split('/').pop() === `entry-${key}.js`);
    if (!entryJs) throw new Error(`${key}: brak entry-${key}.js w ${outdir}`);
    writeFileSync(join(outdir, 'index.html'), `<!doctype html><html lang="pl"><head><meta charset="utf-8"><link rel="icon" href="data:,"></head><body style="margin:0;background:#20283a;font:14px sans-serif"><script type="module" src="./${entryJs}"></script></body></html>`);
    dirs[key] = outdir;
  }
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu', '--num-raster-threads=1'] });
  const errs = [];
  const shots = [];
  const web = {};
  const port = {};
  if ([...KINDS].some((k) => k !== 'ng')) {
    Object.assign(web, await runPanels(browser, 'web', dirs['pd-web'], errs, shots));
    Object.assign(port, await runPanels(browser, 'port', dirs['pd-port'], errs, shots));
  }
  if (KINDS.has('ng')) {
    Object.assign(web, await runNewGame(browser, 'web', dirs['ng-web'], errs, shots));
    Object.assign(port, await runNewGame(browser, 'port', dirs['ng-port'], errs, shots));
  }
  const ua = await (async () => { const p = await browser.newPage(); const u = await p.evaluate(() => navigator.userAgent); await p.close(); return u; })();
  let diffs = 0;
  const groups = new Map();
  for (const key of Object.keys(web)) {
    const w = web[key];
    const p = port[key] ?? [];
    const g = key.split('@')[0].split('-')[0];
    const gr = groups.get(g) ?? { scenes: 0, steps: 0, diffs: 0, first: '' };
    gr.scenes++;
    for (let i = 0; i < Math.max(w.length, p.length); i++) {
      gr.steps++;
      if (w[i] !== p[i]) {
        gr.diffs++;
        diffs++;
        if (!gr.first) {
          let j = 0;
          const a = w[i] ?? '';
          const b = p[i] ?? '';
          while (j < a.length && a[j] === b[j]) j++;
          gr.first = `${key}#${i} @${j} web=…${a.slice(Math.max(0, j - 80), j + 120)} port=…${b.slice(Math.max(0, j - 80), j + 120)}`;
        }
      }
    }
    groups.set(g, gr);
  }
  for (const key of Object.keys(port)) if (!(key in web)) { diffs++; console.log(`TYLKO-PORT ${key}`); }
  for (const [g, gr] of groups) console.log(`${g.padEnd(8)} scen=${String(gr.scenes).padStart(4)} kroków=${String(gr.steps).padStart(5)} różnic=${gr.diffs}${gr.first ? ' PIERWSZA ' + gr.first : ''}`);
  const webShots = shots.filter((s) => s.side === 'web');
  let pixDiff = 0;
  for (const ws of webShots) {
    const ps = shots.find((s) => s.side === 'port' && s.key === ws.key);
    const eq = !!ps && Buffer.compare(ws.png, ps.png) === 0;
    if (!eq) pixDiff++;
    console.log(`PIX ${ws.key.padEnd(44)} ${eq ? 'identyczny' : 'RÓŻNY'} (PNG ${ws.png.length} B, sha256 ${createHash('sha256').update(ws.png).digest('hex').slice(0, 16)}…)`);
    if (PNG_DIR) {
      mkdirSync(PNG_DIR, { recursive: true });
      writeFileSync(join(PNG_DIR, `web-${ws.key.replace(/[^\w.-]+/g, '_')}.png`), ws.png);
      if (ps && !eq) writeFileSync(join(PNG_DIR, `port-${ws.key.replace(/[^\w.-]+/g, '_')}.png`), ps.png);
    }
  }
  diffs += pixDiff;
  const checks = coverage(web);
  const coverFail = checks.filter(([, ok]) => !ok);
  for (const [n] of coverFail) console.log(`COVER-FAIL ${n}`);
  diffs += coverFail.length;
  if (errs.length) {
    console.log('pageerror/console.error:', [...new Set(errs)].slice(0, 10).join(' | '));
    diffs += errs.length;
  }
  console.log(`Chromium: ${ua}`);
  const webHash = createHash('sha256').update(JSON.stringify(web)).digest('hex');
  if (OUT && KINDS.size < ALL_KINDS.split(',').length) throw new Error('--out wymaga pełnego zestawu scen (bez --kinds)');
  const h16 = (x) => createHash('sha256').update(x).digest('hex').slice(0, 16);
  if (OUT) {
    const steps = Object.fromEntries(Object.entries(web).map(([k, v]) => [k, v.map(h16)]));
    const png = Object.fromEntries(webShots.map((s) => [s.key, createHash('sha256').update(s.png).digest('hex')]));
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-WEB-UI-3-B-Q1', source: 'web origin/main 9b019a7d8 (Chromium headless, git archive gra/src gra/data)', webVectorsSha256: webHash, viewports: VIEWPORTS, pngSha256: png, stepSha256_16: steps }, null, 0).replace(/\],"/g, '],\n"') + '\n');
  }
  const nScen = SCENES.filter((x) => KINDS.has(x.kind)).length * VIEWPORTS.length + (KINDS.has('ng') ? NG_SCEN.length : 0);
  const steps = [...groups.values()].reduce((a, g) => a + g.steps, 0);
  console.log(`run-repin-ui3b: scen=${nScen} kroków=${steps} zrzutów=${webShots.length} PIX_różnych=${pixDiff} asercji_pokrycia=${checks.length - coverFail.length}/${checks.length} błędów_strony=${errs.length} różnic=${diffs} webVectorsSha256=${webHash}`);
  exitCode = diffs === 0 ? 0 : 1;
} catch (e) {
  console.error('BŁĄD harnessu:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  rmSync(TMP, { recursive: true, force: true });
}
process.exitCode = exitCode;
