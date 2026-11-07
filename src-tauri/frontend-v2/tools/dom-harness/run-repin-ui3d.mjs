#!/usr/bin/env node
/**
 * run-repin-ui3d.mjs — harness partii REPIN UI-3-D (R-RUSTPORT-REPIN-WEB-UI-3-D-Q1, runda 1).
 *
 * Moduły partii (web `origin/main` `9b019a7d8`, `tools/repin-ui3-manifest.json` sekcja `ui3d`, klasa PORT-D):
 *   minimapHud.ts  web + 2 edycje (jasność mgły z katalogu „Rust”); NOWE: warstwa bazowa raz na `update()`,
 *                  `updateViewport()` składa canvas tylko przy zmianie prostokąta, `sameMinimapViewport`;
 *   hud.ts         web + adapter `createStateFrame` (`game/frame-memo`) + most P5.7; NOWE: baner 3+3 (brutto/netto,
 *                  `pracaPrognoza`, `surowceBrutto/Netto/Bilans`, niedobory na czerwono), przycisk „Rekrutacja”,
 *                  rekruci skracani k/M, `updateMinimapViewport`, jedna migawka `getState()` na `updateHud()`.
 *
 * WEB:  `git archive 9b019a7d8 gra/src gra/data` (`--web-dir`), moduły spakowane `build.mjs`, WYKONANE w Chromium
 *       (Playwright `/opt/node-tools`, `/opt/pw-browsers/chromium-1194`), HTTP localhost.
 * PORT: `src/ui/**` frontend-v2 (`--src`), ten sam `build.mjs`, ta sama instancja Chromium; rolę „Rust” (producent
 *       `StaticCatalogDto`) grają dane i funkcje TEGO SAMEGO weba (jak `run-repin-ui2c.mjs`).
 * Każda scena w dwóch oknach 1280×720 i 360×640 (deviceScaleFactor 1, `reducedMotion`), PRAWDZIWE kliknięcia.
 *
 * Porównanie (EXIT 0 <=> wszystko zgodne):
 *   VEC   każdy krok każdej sceny (DOM `.civ-hud` + minimapy, `toDataURL` canvasu, liczba `getState()` i `drawImage`,
 *         log akcji) i każdy wektor funkcji: web === port (JSON);
 *   PIX   zrzuty PNG web vs port: bajty równe;
 *   ERR   `pageerror` + `console.error` = 0 po obu stronach;
 *   COVER asercje na wynikach WEBU (harness naprawdę ćwiczy nowe funkcje).
 * `--out <plik>`: fixtura (sha256 wektorów WEB, każdego kroku, PNG); `--out-full <plik>` pełne wektory WEB. `--png-dir` zapis zrzutów. `--kinds` podzbiór
 * (mini,hud,vec).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui3d.mjs --web-dir <WEB3_DIR> [--src <src>] [--out <plik>] [--png-dir <dir>] [--kinds <lista>]
 * EXIT 0 <=> brak różnic; 1 <=> >= 1 różnica; 2 <=> błąd harnessu.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
  console.error('Użycie: node tools/dom-harness/run-repin-ui3d.mjs --web-dir <katalog z gra/src i gra/data 9b019a7d8> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const WEB_DATA = join(resolve(WEB_DIR), 'gra/data');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
const ALL_KINDS = 'mini,hud,vec';
const KINDS = new Set((argOf('--kinds') ?? ALL_KINDS).split(','));
const VIEWPORTS = [{ width: 1280, height: 720 }, { width: 360, height: 640 }];
for (const m of ['hud', 'minimapHud']) {
  for (const dir of [join(SRC, 'ui'), join(WEB_SRC, 'ui')]) {
    if (!existsSync(join(dir, m + '.ts'))) {
      console.error(`BRAK modułu ${join(dir, m + '.ts')}`);
      process.exit(2);
    }
  }
}
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui3d-'));
const J = (p) => JSON.stringify(p);
const W = (m) => J(join(WEB_SRC, m));
const D = (f) => J(join(WEB_DATA, f));

/* ── „Rust”: StaticCatalogDto z danych i funkcji webu 9b019a7d8 (jak run-repin-ui2c.mjs; jasność mgły = web) ───── */
const RUST_TS = `
import unitsJson from ${D('units.json')};
import buildingsJson from ${D('buildings.json')};
import techJson from ${D('tech.json')};
import tiJson from ${D('terrain-improvements.json')};
import wondersJson from ${D('wonders.json')};
import countersJson from ${D('counters.json')};
import civsJson from ${D('civs.json')};
import uiParamsJson from ${D('ui-params.json')};
import { categoryOf } from ${W('units/setup.ts')};
import { FOG_EXPLORED_BRIGHTNESS } from ${W('game/visibility.ts')};
import * as CITIES from ${W('game/cities.ts')};
import * as PG from ${W('game/population-growth-v85.ts')};
import * as CU from ${W('game/citizen-resource-upkeep.ts')};
import * as BSC from ${W('game/building-stock-cost.ts')};
import { RESEARCH_QUEUE_MAX } from ${W('game/playerState.ts')};
import { TEMPO_GRY } from ${W('game/tech-tempo.ts')};
import { MAP_GEN_PHASE_LABELS } from ${W('map/mapGenProgress.ts')};
import { mocLabel } from ${W('ui/power-labels.ts')};
import { daninaLabelGenitive } from ${W('game/danina-nazwa.ts')};
import { CIV_BUILD_STAMP } from ${W('buildInfo.ts')};
import { getRiverGenEnabled, getRiverGenPhase } from ${W('map/riverGenSwitch.ts')};
export function catalog(): any {
  const units: any[] = unitsJson as any[];
  const unitCategory: Record<string, string> = {};
  const unitCategoryNameOnly: Record<string, string> = {};
  for (const u of units) {
    unitCategory[u.Jednostka] = categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    unitCategoryNameOnly[u.Jednostka] = categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  return {
    contentHash: 'harness-web-ui3d', buildings: buildingsJson, units, tech: techJson, terrainImprovements: tiJson,
    wonders: wondersJson, counters: countersJson, civs: civsJson, cityNamesPools: {}, powerParams: {}, uiParams: uiParamsJson,
    wiki: { poradnik: [], encyklopedia: [] },
    constants: {
      handelPctStep: CITIES.HANDEL_PCT_STEP, maxProcentNauka: CITIES.MAX_PROCENT_NAUKA,
      maxProcentPuliImperium: CITIES.MAX_PROCENT_PULI_IMPERIUM, maxUlepszeniaPracaAutoPercent: CITIES.MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
      wyzywienieMin: PG.WYZYWIENIE_MIN, wyzywienieMax: PG.WYZYWIENIE_MAX, wyzywienieStep: PG.WYZYWIENIE_STEP,
      citizenUpkeepRatePerCitizen: CU.CITIZEN_UPKEEP_RATE_PER_CITIZEN, researchQueueMax: RESEARCH_QUEUE_MAX,
      tempoGry: { ...TEMPO_GRY }, mapGenPhaseLabels: { ...MAP_GEN_PHASE_LABELS }, fogExploredBrightness: FOG_EXPLORED_BRIGHTNESS,
      zywnoscNaPn: 0, progDarRelacja: 0, handelZaufaniePerTura: 0, handelSurowceKeys: [], audienceMultiOwnActionIds: [],
    },
    labels: {
      podzialPracyPulaLbl: CITIES.PODZIAL_PRACY_PULA_LBL, podzialPracyPulaPelna: CITIES.PODZIAL_PRACY_PULA_LBL_PELNA,
      podzialPracyPulaTip: CITIES.PODZIAL_PRACY_PULA_TIP, powerHudLabelPl: mocLabel(),
      stockResourceLabels: { ...BSC.STOCK_RESOURCE_LABEL }, daninaGenitive: daninaLabelGenitive(), resourceKeyLabels: {},
    },
    unitCategory, unitCategoryNameOnly, techTerrainUnlockLabels: {},
  };
}
export const diag = () => ({ buildStamp: CIV_BUILD_STAMP, riverGenEnabled: getRiverGenEnabled(), riverGenPhase: getRiverGenPhase() });
`;

function writeEntries() {
  writeFileSync(join(TMP, 'rust-ui3d.ts'), RUST_TS);
  const ui = (dir, m) => J(join(dir, 'ui', m));
  writeFileSync(join(TMP, 'entry-web.ts'), [
    `(globalThis as any).__boot = async () => {`,
    `  const [hud, mini] = await Promise.all([import(${ui(WEB_SRC, 'hud')}), import(${ui(WEB_SRC, 'minimapHud')})]);`,
    `  (globalThis as any).__ui3d = { side: 'web', hud, mini };`,
    `};`, '',
  ].join('\n'));
  writeFileSync(join(TMP, 'entry-port.ts'), [
    `import * as R from './rust-ui3d';`,
    `import { installStaticCatalog } from ${J(join(SRC, 'controller/staticCatalog'))};`,
    `import { installPerfDiagnostics } from ${J(join(SRC, 'controller/diagnostics'))};`,
    `(globalThis as any).__boot = async () => {`,
    `  installStaticCatalog(R.catalog()); installPerfDiagnostics(R.diag() as any);`,
    `  const [hud, mini] = await Promise.all([import(${ui(SRC, 'hud')}), import(${ui(SRC, 'minimapHud')})]);`,
    `  (globalThis as any).__ui3d = { side: 'port', hud, mini };`,
    `};`, '',
  ].join('\n'));
}

/* ── Dane wejściowe (wspólne) ─────────────────────────────────────────────────────────────────────────────────── */
const HUD_BASE = {
  zloto: 120, zlotoRate: 7, praca: 40.4, pracaRate: 5, pracaUpkeep: 2, pracaAutoUlepszeniaKoszt: 3, pracaCudaKoszt: 1,
  zywnoscLabel: '55', zywnoscMax: 200, zywnoscRate: 3, zywnoscWplywMiast: 9, zywnoscKosztWojska: 4, glodWojska: false,
  zywnoscMiastNiedokarmionych: 0, zywnoscKarencjaZaTur: 0, nauka: 33.7, naukaRate: 4, kultura: 12.4, kulturaRate: 2,
  bogactwo: 120.4, bogactwoRate: 3, bogactwoWplywyBrutto: 40, bogactwoHandel: 8, bogactwoUtrzymanieBudynkow: 12,
  bogactwoUtrzymanieJednostek: 6, ludnosc: 14, ludnoscRate: 1.4, power: 3020, rekruci: 1200, rekruciLabel: '1,2 tys.',
  rekrutEkw: 3, kosztJednostki: 400, ludnoscAbsLabel: '14 tys.', osiedla: 3, osiedlaMax: 5, tura: 42, epoka: 'Brąz',
  epokaPostep: 0.4, eraGateSummary: 'Brama: 2/3', researchProgress: 0.3, badana: 'Pismo <x>', sojusze: 1, pakty: 2, wojny: 1,
  wplyw: 5, nacja: 'Rzymianie', religionStock: 5.6, religionRate: 1, stateReligion: 'Jowisz', civKolorHex: '#aa3322',
  playerEra: 2, playerWodz: 'Cezar', surowceSummary: 'Drewno 5 · Kamień 2', surowceAlert: false, handelIncome: 9,
  handelRouteCount: 2, uchwalaSolAktywna: true, uchwalaSolSpichlerzIICount: 2, armyUnitsOnMap: 4, rekruciRegenPerTurn: 30,
};
// Warianty stanu HUD (nowe pola UI-3-D: pracaPrognoza, surowce*, niedobory, rekruci liczbowo).
const HUD_VARIANTS = {
  base: {},
  gross: { pracaPrognoza: 7, surowceBrutto: 14, surowceNetto: -3, surowceNiedoborLabels: ['Kamień', 'Sól <x>'], surowceAlert: true,
    surowceBilans: [{ label: 'Drewno', brutto: 9, netto: 4 }, { label: 'Kamień', brutto: 3, netto: -6 }, { label: 'Sól <x>', brutto: 2, netto: -1 }, { label: 'Zero', brutto: 0, netto: 0 }] },
  big: { bogactwo: 20860.4, bogactwoWplywyBrutto: 1257, bogactwoRate: -999_950, praca: 999949, pracaRate: -1200, pracaPrognoza: 1_250_000,
    zywnoscLabel: '20860', zywnoscRate: -1001, zywnoscWplywMiast: 999_950, nauka: 1250000.7, naukaRate: 999, kultura: 3042.9,
    kulturaRate: 1000, religionStock: 999950.2, religionRate: -1250000, handelIncome: -20860, armyUnitsOnMap: 1001, rekruci: 2_500_000,
    rekrutEkw: 12, kosztJednostki: 1500, osiedla: 1000, ludnosc: 999950, ludnoscRate: 1049, surowceBrutto: 999_999_999, surowceNetto: -999_999_999 },
  short: { bogactwo: 10, bogactwoRate: -3, zywnoscLabel: '4', zywnoscRate: -1, glodWojska: true, zywnoscKarencjaZaTur: 2,
    zywnoscMiastNiedokarmionych: 2, surowceNiedoborLabels: ['Drewno'], rekruci: Number.NaN, rekruciLabel: 'brak <b>' },
  zero: { bogactwo: 0, bogactwoRate: 0, bogactwoWplywyBrutto: 0, praca: 0, pracaRate: 0, pracaPrognoza: 0, zywnoscLabel: '0', zywnoscRate: 0,
    zywnoscWplywMiast: 0, nauka: 0, naukaRate: 0, handelIncome: 0, surowceBrutto: 0, surowceNetto: 0, rekruci: 0 },
};
const SHORT_CASES = [];
for (const b of [-5, 0, 1, 10, 25, 26, 1000]) for (const r of [-6, -5, -1, -0.4, 0, 0.6, 3]) SHORT_CASES.push({ bogactwo: b, bogactwoRate: r, zywnoscLabel: String(b), zywnoscRate: r });
for (const z of ['abc', '', ' 7 ', 'NaN', '-1']) SHORT_CASES.push({ zywnoscLabel: z, zywnoscRate: -1 });
// Obrona r1 (Evaluator r1 Z1, ui2c H4 → ui3d H23): nienumeryczny Spichlerz przy skróconym brutto (≥ 1000) — nota „Dokładnie:”
// rozróżnia `foodHudValue` = undefined (bez liczby zapasu) od 0.
for (const z of ['abc', 'NaN']) SHORT_CASES.push({ zywnoscLabel: z, zywnoscRate: -1, zywnoscWplywMiast: 1250 });
SHORT_CASES.push({ glodWojska: true }, { zywnoscKarencjaZaTur: 1 }, { zywnoscMiastNiedokarmionych: 1 }, { surowceNiedoborLabels: [] }, { surowceNiedoborLabels: ['X'] });
/** Ramka z `mapData().viewport` — po `update()` ta sama ramka = brak przerysowania. */
const VPD = { x: 0.1, y: 0.1, w: 0.25, h: 0.3 };
const VP = [undefined, { x: 0, y: 0, w: 0.2, h: 0.3 }, { x: 0, y: 0, w: 0.2, h: 0.3 }, { x: 0.5, y: 0.25, w: 0.2, h: 0.3 }, { x: -1, y: 2, w: 0, h: 0 }, { x: 0.5, y: 0.25, w: 0.2, h: 0.31 }];
// Minimapa: siatka 40×24, deterministyczna; mgła mieszana; znaczniki (miasto/posterunek/jednostka, także w mgle).
const TEREN = ['Laka', 'Morze', 'Gory', 'Las', 'Pustynia', 'Wzgorza', 'Ocean', 'Rownina', 'Nieznany <x>'];
function mapData(kind) {
  const cols = kind === 'tiny' ? 6 : 40;
  const rows = kind === 'tiny' ? 4 : 24;
  const hexes = [];
  if (kind !== 'empty') {
    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) {
        const n = (q * 7 + r * 13) % 17;
        const fog = kind === 'allVisible' ? 'visible' : n < 5 ? 'hidden' : n < 9 ? 'explored' : n === 16 ? undefined : 'visible';
        hexes.push({ q: q - Math.floor(r / 2), r, teren: TEREN[(q + r * 3) % TEREN.length], ...(n % 4 === 0 ? { ownerColor: ['#aa3322', '#2255cc', '#33aa55'][n % 3] } : {}), ...(fog ? { fog } : {}) });
      }
    }
  }
  const markers = kind === 'empty' ? [] : [
    { q: 3, r: 2, kind: 'city', color: '#ffcc00' }, { q: 10, r: 5, kind: 'outpost', color: '#00ccff' }, { q: 0, r: 0, kind: 'unit', color: '#ff3366' },
    { q: 20, r: 12, kind: 'unit', color: '#ffffff' }, { q: 1, r: 1, kind: 'city', color: '#aa00aa' },
  ];
  return { cols, rows, hexes, viewport: { ...VPD }, markers };
}
const SCENES = [];
for (const kind of ['full', 'tiny', 'allVisible', 'empty', 'null']) {
  SCENES.push({ id: `mini-${kind}`, kind: 'mini', map: kind, shot: kind === 'full', steps: [
    ...VP.map((v) => ({ k: 'vp', v })),
    { k: 'update' }, { k: 'vp', v: VPD }, { k: 'vp', v: VP[3] }, { k: 'swap', map: kind === 'full' ? 'tiny' : 'full' }, { k: 'vp', v: VP[1] },
    { k: 'clickCanvas' }, { k: 'destroy' }, { k: 'vp', v: VP[3] },
  ] });
}
for (const [variant, recruit] of [['base', true], ['gross', true], ['big', false], ['short', true], ['zero', false]]) {
  SCENES.push({ id: `hud-${variant}`, kind: 'hud', variant, recruit, shot: variant !== 'zero', steps: [
    { k: 'update' }, { k: 'vp', v: VP[3] }, { k: 'vp', v: VP[3] }, { k: 'dirty' }, { k: 'clickSel', sel: '[data-act="empire-recruit"]' },
    { k: 'clickSel', sel: '[data-act="skarbiec"]' }, { k: 'clickSel', sel: '[data-act="surowce"]' }, { k: 'clickSel', sel: '[data-act="handel"]' },
    { k: 'variant', v: variant === 'big' ? 'base' : 'big' }, { k: 'update' }, { k: 'suppress', v: true }, { k: 'update' },
  ] });
}
const DATA = { HUD_BASE, HUD_VARIANTS, SHORT_CASES, VP, MAPS: Object.fromEntries(['full', 'tiny', 'allVisible', 'empty'].map((k) => [k, mapData(k)])) };

/* ── Kod strony ───────────────────────────────────────────────────────────────────────────────────────────────── */
const LIB = (DATA) => {
  const U = globalThis.__ui3d;
  const log = [];
  let getStateCalls = 0;
  let drawImageCalls = 0;
  const di = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (...a) { drawImageCalls++; return di.apply(this, a); };
  const act = (n) => (...a) => { log.push(n + JSON.stringify(a)); };
  const st = (v) => ({ ...DATA.HUD_BASE, ...DATA.HUD_VARIANTS[v] });
  let cur = null;
  let mini = null;
  let mapKind = 'full';
  let variant = 'base';
  const mapOf = () => (mapKind === 'null' ? null : JSON.parse(JSON.stringify(DATA.MAPS[mapKind])));
  const noop = () => {};
  const H = {
    open(sc) {
      cur = sc;
      log.length = 0;
      getStateCalls = 0;
      drawImageCalls = 0;
      mapKind = sc.map ?? 'full';
      if (sc.kind === 'mini') {
        mini = U.mini.createMinimapHud({ getMinimapData: mapOf, onMinimapClick: act('onMinimapClick'), width: 280, height: 170 });
        document.body.appendChild(mini.el);
      } else {
        variant = sc.variant;
        U.hud.showHud({
          getState: () => { getStateCalls++; return st(variant); }, onEndTurn: noop, onOpenCities: act('onOpenCities'), onOpenScience: act('onOpenScience'),
          onOpenDiplomacy: noop, onOpenMenu: act('onOpenMenu'), onOpenWiki: noop, isWikiActive: () => false, getMinimapData: mapOf,
          onMinimapClick: act('onMinimapClick'), getContextPanelMessage: () => null, getEvents: () => [], onEventClick: noop, onEventDismiss: noop,
          onDismissAll: noop, getEventLink: () => null, getWarsWithPlayer: () => [], onExecutePending: noop, canEndTurn: () => true,
          getBlockingCount: () => 0, getYearLabel: () => '1200 p.n.e.', hideEndTurn: () => false, onDiploChip: act('onDiploChip'),
          onOpenEmpireDetail: act('onOpenEmpireDetail'), getPowerOverlay: () => null, getCultureOverlay: () => null, getReligionOverlay: () => null,
          ...(sc.recruit ? { onOpenEmpireRecruit: act('onOpenEmpireRecruit') } : {}),
        });
        U.hud.updateHud();
      }
    },
    step(s) {
      if (cur.kind === 'mini') {
        if (s.k === 'vp') mini.updateViewport(s.v);
        else if (s.k === 'update') mini.update();
        else if (s.k === 'swap') { mapKind = s.map; mini.update(); }
        else if (s.k === 'destroy') mini.destroy();
      } else if (s.k === 'vp') U.hud.updateMinimapViewport(s.v);
      else if (s.k === 'update') U.hud.updateHud();
      else if (s.k === 'dirty') { U.hud.markMinimapDirty(); U.hud.updateHud(); }
      else if (s.k === 'variant') variant = s.v;
      else if (s.k === 'suppress') U.hud.setMapHudChromeSuppressed(s.v);
    },
    close() {
      if (mini) { mini.destroy(); mini = null; }
      try { U.hud.setMapHudChromeSuppressed(false); } catch { /* brak */ }
      try { U.hud.hideHud(); } catch { /* brak HUD */ }
      document.querySelectorAll('.civ-minimap-wrap').forEach((n) => n.remove());
    },
    state() {
      const cv = document.querySelector('.civ-minimap-hud canvas');
      const o = {
        log: log.join(' | '), getState: getStateCalls, drawImage: drawImageCalls,
        mini: document.querySelector('.civ-minimap-wrap')?.outerHTML ?? null,
        canvas: cv ? cv.width + 'x' + cv.height + ':' + cv.toDataURL() : null,
      };
      if (cur.kind === 'hud') {
        o.hud = document.querySelector('.civ-hud')?.outerHTML ?? null;
        o.open = U.hud.isHudOpen();
        const g = document.querySelector('.hud-chip-grid');
        if (g) { const r = g.getBoundingClientRect(); o.grid = [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 100) / 100).join(','); }
      }
      getStateCalls = 0;
      drawImageCalls = 0;
      return JSON.stringify(o);
    },
    vectors() {
      const safe = (f) => { try { return f(); } catch (e) { return 'THROW:' + String(e && e.message); } };
      const out = {};
      out.bar = Object.keys(DATA.HUD_VARIANTS).map((v) => safe(() => U.hud.renderBarD1B(st(v))));
      out.short = DATA.SHORT_CASES.map((c) => { const s = { ...DATA.HUD_BASE, ...c }; return [U.hud.hudGoldShortage(s), U.hud.hudFoodShortage(s), U.hud.hudResourceShortage(s)].map(Number).join(''); }).join(',');
      out.runway = U.hud.HUD_SHORTAGE_RUNWAY_TURNS;
      out.barShort = DATA.SHORT_CASES.map((c) => safe(() => U.hud.renderBarD1B({ ...DATA.HUD_BASE, ...c })));
      out.same = DATA.VP.flatMap((a) => DATA.VP.map((b) => (U.mini.sameMinimapViewport(a, b) ? 1 : 0))).join('');
      out.exportsHud = Object.keys(U.hud).sort().join(',');
      out.exportsMini = Object.keys(U.mini).sort().join(',');
      return JSON.stringify(out);
    },
  };
  globalThis.__h = H;
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
const SHOT_STYLE = '*{scrollbar-color:transparent transparent !important;caret-color:transparent !important}';
async function stableShot(page) {
  let prev = await page.screenshot({ animations: 'disabled', style: SHOT_STYLE });
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(200);
    const cur = await page.screenshot({ animations: 'disabled', style: SHOT_STYLE });
    if (Buffer.compare(prev, cur) === 0) return cur;
    prev = cur;
  }
  return prev;
}

async function runSide(browser, side, dir, errs, shots) {
  const srv = await serve(dir);
  const vec = {};
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      page.on('pageerror', (e) => errs.push(`${side}: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') errs.push(`${side}: ${m.text()}`); });
      await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
      await page.waitForFunction(() => typeof globalThis.__boot === 'function', null, { timeout: 60000 });
      await page.evaluate(() => globalThis.__boot());
      await page.evaluate(LIB, DATA);
      const vk = `${vp.width}x${vp.height}`;
      if (KINDS.has('vec')) vec[`vec@${vk}`] = [await page.evaluate(() => globalThis.__h.vectors())];
      for (const sc of SCENES.filter((x) => KINDS.has(x.kind))) {
        const states = [];
        // Kursor na neutralny środek okna przed sceną: hover (i tooltip z opóźnieniem) po kliknięciach poprzedniej sceny
        // dawał niedeterministyczny zrzut (zmierzone: hud-big@1280x720 raz różny w 1 z 3 przebiegów).
        await page.mouse.move(Math.floor(vp.width / 2), Math.floor(vp.height / 2));
        await page.evaluate((s) => globalThis.__h.open(s), sc);
        await settle(page);
        states.push(await page.evaluate(() => globalThis.__h.state()));
        if (sc.shot) shots.push({ side, key: `${sc.id}@${vk}`, png: await stableShot(page) });
        for (const st of sc.steps) {
          if (st.k === 'clickSel') {
            const ok = await page.evaluate((sel) => !!document.querySelector(sel), st.sel);
            if (ok) await page.click(st.sel, { timeout: 3000 }).catch(() => page.evaluate((sel) => document.querySelector(sel)?.click(), st.sel));
          } else if (st.k === 'clickCanvas') {
            const box = await page.evaluate(() => { const c = document.querySelector('.civ-minimap-hud canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
            if (box) await page.mouse.click(box[0] + box[2] * 0.4, box[1] + box[3] * 0.6);
          } else await page.evaluate((s) => globalThis.__h.step(s), st);
          await settle(page);
          states.push(await page.evaluate(() => globalThis.__h.state()));
        }
        if (sc.kind === 'hud' && sc.shot) shots.push({ side, key: `${sc.id}+end@${vk}`, png: await stableShot(page) });
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
  const V = (k) => JSON.parse(vec[k][0]);
  for (const vk of ['1280x720', '360x640']) {
    // Kroki sceny mini: 0 open, 1..6 vp(VP[0..5]), 7 update, 8 vp(ramka danych), 9 vp, 10 swap, 11 vp, 12 click, 13 destroy, 14 vp.
    c('mini', `mini-full@${vk} vp tej samej ramki = brak przerysowania`, () => S(`mini-full@${vk}`, 3).drawImage === 0 && S(`mini-full@${vk}`, 3).canvas === S(`mini-full@${vk}`, 2).canvas);
    c('mini', `mini-full@${vk} nowa ramka = 1 drawImage i inny canvas`, () => S(`mini-full@${vk}`, 4).drawImage === 1 && S(`mini-full@${vk}`, 4).canvas !== S(`mini-full@${vk}`, 3).canvas);
    c('mini', `mini-full@${vk} vp undefined zdejmuje ramkę`, () => S(`mini-full@${vk}`, 1).canvas !== S(`mini-full@${vk}`, 0).canvas);
    c('mini', `mini-empty@${vk} vp bez heksów nie rysuje ramki`, () => S(`mini-empty@${vk}`, 2).canvas === S(`mini-empty@${vk}`, 1).canvas);
    c('mini', `mini-null@${vk} placeholder, vp no-op`, () => S(`mini-null@${vk}`, 0).canvas === null && S(`mini-null@${vk}`, 4).drawImage === 0 && S(`mini-null@${vk}`, 0).mini.includes('mini-placeholder'));
    c('mini', `mini-full@${vk} update() zapamiętuje ramkę danych (ta sama ramka = brak przerysowania)`, () => S(`mini-full@${vk}`, 7).drawImage === 1 && S(`mini-full@${vk}`, 8).drawImage === 0 && S(`mini-full@${vk}`, 9).drawImage === 1);
    c('mini', `mini-full@${vk} klik minimapy → onMinimapClick`, () => S(`mini-full@${vk}`, 12).log.startsWith('onMinimapClick['));
    c('mini', `mini-full@${vk} po destroy vp no-op`, () => S(`mini-full@${vk}`, 14).drawImage === 0 && S(`mini-full@${vk}`, 14).mini === null);
    // Kroki sceny hud: 0 open, 1 update, 2 vp, 3 vp (ta sama), 4 dirty, 5 rekrutacja, 6 skarbiec, 7 surowce, 8 handel, 9 variant, 10 update, 11 suppress, 12 update.
    c('hud', `hud-base@${vk} jedna migawka getState na updateHud`, () => S(`hud-base@${vk}`, 1).getState === 1 && S(`hud-base@${vk}`, 4).getState === 1);
    c('hud', `hud-base@${vk} baner 3+3 (siatka, 6 komórek)`, () => { const h = S(`hud-base@${vk}`, 0).hud; return h.includes('hud-chip-grid') && (h.split('hud-chip-grid')[1].match(/civ-hud-chip-cell/g) || []).length >= 6; });
    c('hud', `hud-base@${vk} updateMinimapViewport przesuwa ramkę bez getState`, () => S(`hud-base@${vk}`, 2).getState === 0 && S(`hud-base@${vk}`, 2).canvas !== S(`hud-base@${vk}`, 1).canvas && S(`hud-base@${vk}`, 3).drawImage === 0);
    c('hud', `hud-base@${vk} przycisk Rekrutacja → onOpenEmpireRecruit`, () => S(`hud-base@${vk}`, 0).hud.includes('data-act="empire-recruit"') && S(`hud-base@${vk}`, 5).log.includes('onOpenEmpireRecruit[]'));
    c('hud', `hud-big@${vk} bez onOpenEmpireRecruit brak przycisku`, () => !S(`hud-big@${vk}`, 0).hud.includes('data-act="empire-recruit"'));
    c('hud', `hud-short@${vk} niedobory na czerwono (shortage)`, () => (S(`hud-short@${vk}`, 0).hud.match(/civ-hud-chip-short/g) || []).length >= 3);
    c('hud', `hud-gross@${vk} najgorszy bilans surowca w tytule`, () => S(`hud-gross@${vk}`, 0).hud.includes('Najgorszy bilans: Kamień'));
    c('hud', `hud-big@${vk} rekruci: pełna liczba w title, skrót w banerze`, () => /Manpower: 2&nbsp;500&nbsp;000 /.test(S(`hud-big@${vk}`, 0).hud) && S(`hud-big@${vk}`, 0).hud.includes('p-recruit-val">2,5M (12)<'));
    c('hud', `hud-base@${vk} chrome ukryty po suppress`, () => S(`hud-base@${vk}`, 12).hud !== S(`hud-base@${vk}`, 10).hud);
    c('vec', `vec@${vk} shortage różnicuje przypadki`, () => new Set(V(`vec@${vk}`).short.split(',')).size >= 4);
    c('vec', `vec@${vk} sameMinimapViewport (undefined/równe/różne)`, () => V(`vec@${vk}`).same.startsWith('100000') && V(`vec@${vk}`).same.slice(6, 12) === '011000');
    c('vec', `vec@${vk} eksporty nowych API`, () => V(`vec@${vk}`).exportsHud.includes('updateMinimapViewport') && V(`vec@${vk}`).exportsMini.includes('sameMinimapViewport'));
  }
  return checks;
}

let exitCode = 0;
let browser = null;
try {
  writeEntries();
  const sides = {};
  for (const side of ['web', 'port']) {
    const outdir = join(TMP, side);
    const pad = join(TMP, `pad-${side}.ts`);
    writeFileSync(pad, 'export {};\n');
    await bundle([join(TMP, `entry-${side}.ts`), pad], outdir);
    const entryJs = readdirSync(outdir, { recursive: true }).map(String).find((f) => f.split('/').pop() === `entry-${side}.js`);
    if (!entryJs) throw new Error(`${side}: brak entry-${side}.js w ${outdir}`);
    writeFileSync(join(outdir, 'index.html'), `<!doctype html><html lang="pl"><meta charset="utf-8"><link rel="icon" href="data:,"><body style="margin:0;background:#0b0f16"><div id="host" style="width:100%"></div><script type="module" src="./${entryJs}"></script>`);
    sides[side] = outdir;
  }
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu', '--num-raster-threads=1'] });
  const errs = [];
  const shots = [];
  const web = await runSide(browser, 'web', sides.web, errs, shots);
  const port = await runSide(browser, 'port', sides.port, errs, shots);
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
          gr.first = `${key}#${i} @${j} web=…${a.slice(Math.max(0, j - 60), j + 100)} port=…${b.slice(Math.max(0, j - 60), j + 100)}`;
        }
      }
    }
    groups.set(g, gr);
  }
  for (const key of Object.keys(port)) if (!(key in web)) { diffs++; console.log(`TYLKO-PORT ${key}`); }
  for (const [g, gr] of groups) console.log(`${g.padEnd(6)} scen=${String(gr.scenes).padStart(4)} kroków=${String(gr.steps).padStart(5)} różnic=${gr.diffs}${gr.first ? ' PIERWSZA ' + gr.first : ''}`);
  const webShots = shots.filter((s) => s.side === 'web');
  let pixDiff = 0;
  for (const ws of webShots) {
    const ps = shots.find((s) => s.side === 'port' && s.key === ws.key);
    const eq = !!ps && Buffer.compare(ws.png, ps.png) === 0;
    if (!eq) pixDiff++;
    console.log(`PIX ${ws.key.padEnd(26)} ${eq ? 'identyczny' : 'RÓŻNY'} (PNG ${ws.png.length} B, sha256 ${createHash('sha256').update(ws.png).digest('hex').slice(0, 16)}…)`);
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
    console.log('pageerror/console.error:', errs.slice(0, 10).join(' | '));
    diffs += errs.length;
  }
  console.log(`Chromium: ${ua}`);
  const webHash = createHash('sha256').update(JSON.stringify(web)).digest('hex');
  if (OUT && KINDS.size < ALL_KINDS.split(',').length) throw new Error('--out wymaga pełnego zestawu scen (bez --kinds)');
  const h16 = (x) => createHash('sha256').update(x).digest('hex').slice(0, 16);
  if (OUT) {
    const steps = Object.fromEntries(Object.entries(web).map(([k, v]) => [k, v.map(h16)]));
    const png = Object.fromEntries(webShots.map((s) => [s.key, createHash('sha256').update(s.png).digest('hex')]));
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-WEB-UI-3-D-Q1', source: 'web origin/main 9b019a7d8 (Chromium headless, git archive gra/src gra/data)', webVectorsSha256: webHash, viewports: VIEWPORTS, pngSha256: png, stepSha256_16: steps }, null, 0).replace(/\],"/g, '],\n"') + '\n');
  }
  if (argOf('--out-full')) writeFileSync(argOf('--out-full'), JSON.stringify({ webVectorsSha256: webHash, vectors: web }) + '\n');
  const steps = [...groups.values()].reduce((a, g) => a + g.steps, 0);
  console.log(`run-repin-ui3d: scen=${SCENES.filter((x) => KINDS.has(x.kind)).length}×${VIEWPORTS.length} kroków=${steps} zrzutów=${webShots.length} PIX_różnych=${pixDiff} asercji_pokrycia=${checks.length - coverFail.length}/${checks.length} błędów_strony=${errs.length} różnic=${diffs} webVectorsSha256=${webHash}`);
  exitCode = diffs === 0 ? 0 : 1;
} catch (e) {
  console.error('BŁĄD harnessu:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  rmSync(TMP, { recursive: true, force: true });
}
process.exitCode = exitCode;
