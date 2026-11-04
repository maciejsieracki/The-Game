#!/usr/bin/env node
/**
 * run-repin-ui2c.mjs — harness partii REPIN UI-2-C (R-RUSTPORT-REPIN-UI-2-C-Q1).
 *
 * Moduły partii (PORT DOM z aktualnego weba `origin/main` `86d510c66`, nie kopie bajtowe):
 *   hud.ts               — pasek zasobów: `formatCompactNumber`/`formatCompactSigned`/`exactCompactNote` (`cn()`),
 *                          `foodHudValue`, etykieta rekrutów `recruitHudLabel` + tytuł „Możesz zwerbować N pełnych jednostek”;
 *   empireDetailPanel.ts — `formatRawCount` ≥ 1000 skrócony, „Zamiana Pracy na podatek” (hooki `canConvertOwnerWorkToTax`…),
 *                          rekrutacja w zakładce Armia jako sekcje miast (hooki `mountCityRecruitment`/`mountGeneralRecruitment`,
 *                          „Idź do wodza”), stawka obywateli wg epoki (`citizenRatePerCitizen`), bez „Bonus startowy”;
 *   empireDetailTypes.ts — pole `citizenRatePerCitizen?`;
 *   armyStackHud.ts      — karta dowódcy (`commanderTitle`, `armyStackCardIdentity`), nowe ikony split/merge;
 *   unitRecruitCard.ts   — wiersz w jednej linii (head/sub), `unitLabel`, `disabledReason`, `manpowerStatusTitle`, „brak N”.
 *
 * WEB:  moduły z URUCHOMIONEGO weba — `git archive origin/main gra/src gra/data` (`--web-dir`), pakowane `build.mjs`
 *       i WYKONANE w Chromium (Playwright `/opt/node-tools`, przeglądarka `/opt/pw-browsers/chromium-1194`), HTTP localhost.
 * PORT: `src/ui/**` frontend-v2 (`--src`), ten sam `build.mjs`, ta sama instancja Chromium. Rolę „Rust” (producent DTO:
 *       `StaticCatalogDto`, `EmpireQueriesProvider`, `PerfDiagnosticsDto`, `UnitCardBadgesDto`, pola snapshotu v2) grają
 *       funkcje i dane TEGO SAMEGO weba (jak `run-hud-empire.mjs`, tylko na `origin/main`).
 *
 * Porównanie (EXIT 0 <=> wszystko zgodne):
 *   VEC   wyniki funkcji/HTML dla każdego wektora web === port (granice 999/1000/1001, 999 949/999 950, NaN, ujemne, …);
 *   DOM   `innerHTML` po parsowaniu przeglądarki + log akcji (kliknięcia, `input`/`change`, `confirm`) web === port;
 *   PIX   zrzuty PNG scen (HUD + roster armii, wiersze rekrutacji, panel imperium Praca/Armia) w 1280×720 i 360×640:
 *         bajty PNG web === port (próg 0);
 *   ERR   `pageerror` + `console.error` = 0 po obu stronach;
 *   COVER każda grupa wektorów ma > 1 różny wynik webu (harness coś rozróżnia).
 * `--out <plik.json>`: wektory WEB + sha256 (niezależny weryfikator: ten sam hash z 2 osobnych `git archive`).
 * `--png-dir <dir>`: zapis zrzutów webu (dowód wizualny).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui2c.mjs --web-dir <WEB_DIR> [--src <src>] [--out <plik>] [--png-dir <dir>] [--tmp-dir <dir>]
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
  console.error('Użycie: node tools/dom-harness/run-repin-ui2c.mjs --web-dir <katalog z gra/src i gra/data origin/main> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const WEB_DATA = join(resolve(WEB_DIR), 'gra/data');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
const MODULES = ['hud', 'empireDetailPanel', 'empireDetailTypes', 'armyStackHud', 'unitRecruitCard'];
for (const m of MODULES) {
  for (const dir of [join(SRC, 'ui'), join(WEB_SRC, 'ui')]) {
    if (!existsSync(join(dir, m + '.ts'))) {
      console.error(`BRAK modułu ${join(dir, m + '.ts')}`);
      process.exit(2);
    }
  }
}
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui2c-'));
const J = (p) => JSON.stringify(p);

// Etykiety zasobów dyplomacji czytane ze źródła webu (jak `run-hud-empire.mjs`: stała niewyeksportowana).
const ddSrc = readFileSync(join(WEB_SRC, 'game/diplomacy-display.ts'), 'utf8');
const rkl = ddSrc.slice(ddSrc.indexOf('const RESOURCE_KEY_LABEL'), ddSrc.indexOf('};', ddSrc.indexOf('const RESOURCE_KEY_LABEL')));
const resourceKeyLabels = {};
for (const m of rkl.matchAll(/^\s*([a-z_]+):\s*'([^']*)',/gm)) resourceKeyLabels[m[1]] = m[2];

/* ── „Rust”: dane i funkcje webu (wspólne dla obu stron — web używa ich do własnego snapshotu pin-kształtu) ───────── */
const W = (m) => J(join(WEB_SRC, m));
const D = (f) => J(join(WEB_DATA, f));
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
import * as CITIES from ${W('game/cities.ts')};
import * as PG from ${W('game/population-growth-v85.ts')};
import * as CU from ${W('game/citizen-resource-upkeep.ts')};
import * as BSC from ${W('game/building-stock-cost.ts')};
import * as RUB from ${W('game/resource-usage-breakdown.ts')};
import * as EMT from ${W('ui/empireMiastaTable.ts')};
import * as VC from ${W('game/diplomacy-value-catalog.ts')};
import * as DD from ${W('game/diplomacy-display.ts')};
import * as PR from ${W('game/diplomacy-proposals.ts')};
import * as AA from ${W('game/diplomacy-audience-actions.ts')};
import * as UB from ${W('game/unit-building-bonuses.ts')};
import * as VT from ${W('game/veteran.ts')};
import { RESEARCH_QUEUE_MAX } from ${W('game/playerState.ts')};
import { TEMPO_GRY } from ${W('game/tech-tempo.ts')};
import { MAP_GEN_PHASE_LABELS } from ${W('map/mapGenProgress.ts')};
import { BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS } from ${W('game/diplomacy-barbarian-cooperation.ts')};
import { mocLabel } from ${W('ui/power-labels.ts')};
import { daninaLabelGenitive } from ${W('game/danina-nazwa.ts')};
import { CIV_BUILD_STAMP } from ${W('buildInfo.ts')};
import { getRiverGenEnabled, getRiverGenPhase } from ${W('map/riverGenSwitch.ts')};
export const units: any[] = unitsJson as any[];
export function catalog(): any {
  const unitCategory: Record<string, string> = {};
  const unitCategoryNameOnly: Record<string, string> = {};
  for (const u of units) {
    unitCategory[u.Jednostka] = categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    unitCategoryNameOnly[u.Jednostka] = categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  const multiOwn: string[] = [];
  for (let i = 0; i <= 30; i++) if (AA.uiActionAllowsMultipleOwnOnTable(String(i))) multiOwn.push(String(i));
  return {
    contentHash: 'harness-web-ui2c', buildings: buildingsJson, units, tech: techJson, terrainImprovements: tiJson,
    wonders: wondersJson, counters: countersJson, civs: civsJson, cityNamesPools: {}, powerParams: {}, uiParams: uiParamsJson,
    wiki: { poradnik: [], encyklopedia: [] },
    constants: {
      handelPctStep: CITIES.HANDEL_PCT_STEP, maxProcentNauka: CITIES.MAX_PROCENT_NAUKA,
      maxProcentPuliImperium: CITIES.MAX_PROCENT_PULI_IMPERIUM, maxUlepszeniaPracaAutoPercent: CITIES.MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
      wyzywienieMin: PG.WYZYWIENIE_MIN, wyzywienieMax: PG.WYZYWIENIE_MAX, wyzywienieStep: PG.WYZYWIENIE_STEP,
      citizenUpkeepRatePerCitizen: CU.CITIZEN_UPKEEP_RATE_PER_CITIZEN, researchQueueMax: RESEARCH_QUEUE_MAX,
      tempoGry: { ...TEMPO_GRY }, mapGenPhaseLabels: { ...MAP_GEN_PHASE_LABELS }, fogExploredBrightness: 0.55,
      barbarianCooperationDefaultDurationTurns: BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS,
      zywnoscNaPn: VC.diplomacyZywnoscNaPn(), progDarRelacja: VC.diplomacyProgDarRelacja(),
      handelZaufaniePerTura: VC.diplomacyHandelZaufaniePerTura(), handelSurowceKeys: Object.keys(VC.diplomacyHandelSurowceCatalog()),
      audienceMultiOwnActionIds: multiOwn,
    },
    labels: {
      podzialPracyPulaLbl: CITIES.PODZIAL_PRACY_PULA_LBL, podzialPracyPulaPelna: CITIES.PODZIAL_PRACY_PULA_LBL_PELNA,
      podzialPracyPulaTip: CITIES.PODZIAL_PRACY_PULA_TIP, powerHudLabelPl: mocLabel(),
      traktatHandlowyLabel: DD.TRAKTAT_HANDLOWY_LABEL, resourceAccessTradeWithdrawnReason: PR.RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON,
      resourceKeyLabels: ${J(resourceKeyLabels)}, stockResourceLabels: { ...BSC.STOCK_RESOURCE_LABEL },
      daninaGenitive: daninaLabelGenitive(),
    },
    unitCategory, unitCategoryNameOnly, techTerrainUnlockLabels: {},
  };
}
export const empireQueries = {
  adjustHandelSplit: (c: any, ch: any, v: number) => CITIES.adjustHandelSplit(c, ch, v),
  normalizePodzialHandlu: (s: any) => CITIES.normalizePodzialHandlu(s),
  procentPuliImperiumZBudynkow: (b: any) => CITIES.procentPuliImperiumZBudynkow(b),
  podzialPracyZProcentuPuli: (p: any) => CITIES.podzialPracyZProcentuPuli(p),
};
export const diag = () => ({ buildStamp: CIV_BUILD_STAMP, riverGenEnabled: getRiverGenEnabled(), riverGenPhase: getRiverGenPhase() });
export const badges = (inp: any) => ({
  softPath: UB.softPathBadgeLevel({ parametryBonusProc: inp.parametryPathPp ?? 0 } as any),
  armorPath: UB.armorPathBadgeLevel({ pancerzBonusProc: inp.pancerzPathPp ?? 0 } as any),
  veteranStars: VT.veteranStarCount(inp.veteranProgress ?? null),
});
export const CITIZEN_RATE = CU.CITIZEN_UPKEEP_RATE_PER_CITIZEN;
export const resourceUsageTotal = RUB.resourceUsageTotal;
export const computeMiastaSummaryRow = EMT.computeMiastaSummaryRow;
`;

/* ── Fikstury (kształt webu) + „Rust” toV2Snap — wspólne dla obu stron ─────────────────────────────────────────── */
const FIX_TS = `
import * as R from './rust-ui2c';
export const hudStateBase = (): any => ({
  zloto: 120, zlotoRate: 7, praca: 40.4, pracaRate: 5, pracaUpkeep: 2, pracaAutoUlepszeniaKoszt: 3, pracaCudaKoszt: 1,
  zywnoscLabel: '55', zywnoscMax: 200, zywnoscRate: 3, zywnoscWplywMiast: 9, zywnoscKosztWojska: 4, glodWojska: false,
  zywnoscMiastNiedokarmionych: 0, zywnoscKarencjaZaTur: 2, nauka: 33.7, naukaRate: 4, kultura: 12.4, kulturaRate: 2,
  bogactwo: 120.4, bogactwoRate: 3, bogactwoWplywyBrutto: 40, bogactwoHandel: 8, bogactwoUtrzymanieBudynkow: 12,
  bogactwoUtrzymanieSurowcowBudynkow: { drewno: 2, kamien: 1 }, bogactwoUtrzymanieJednostek: 6, ludnosc: 14, ludnoscRate: 1.4,
  power: 3020, rekruci: 1200, rekruciLabel: '1,2 tys.', rekrutEkw: 3, kosztJednostki: 400, ludnoscAbsLabel: '14 tys.',
  osiedla: 3, osiedlaMax: 5, tura: 42, epoka: 'Brąz', epokaPostep: 0.4, eraGateSummary: 'Brama: 2/3', researchProgress: 0.3,
  badana: 'Pismo <x>', sojusze: 1, pakty: 2, wojny: 1, wplyw: 5, nacja: 'Rzymianie', religionStock: 5.6, religionRate: 1,
  stateReligion: 'Jowisz', civKolorHex: '#aa3322', playerEra: 2, playerWodz: 'Cezar', surowceSummary: 'Drewno 5 · Kamień 2',
  surowceAlert: true, handelIncome: 9, handelRouteCount: 2, uchwalaSolAktywna: true, uchwalaSolSpichlerzIICount: 2,
  armyUnitsOnMap: 4, rekruciRegenPerTurn: 30,
});
/** Duże liczby (≥ 1000) — scena zrzutu i wariant „duze” snapshotu. */
export const hudStateBig = (): any => ({
  ...hudStateBase(), bogactwo: 20860.4, bogactwoWplywyBrutto: 1257, praca: 999949, pracaRate: -1200, zywnoscLabel: '20860',
  zywnoscRate: -1001, nauka: 1250000.7, naukaRate: 999, kultura: 3042.9, kulturaRate: 1000, religionStock: 999950.2,
  religionRate: -1250000, handelIncome: -20860, armyUnitsOnMap: 1001, rekrutEkw: 12, kosztJednostki: 1500,
  rekruciLabel: '1,2 mln', osiedla: 1000, ludnosc: 999950, ludnoscRate: 1049,
});
const recOpt = (id: string, name: string, gold: number, mp: number, stock: any, water: boolean) =>
  ({ id, name, goldCost: gold, manpowerCost: mp, stockCost: stock, requiresWater: water });
const CITIES_FX: any[] = [
  { cityId: 'c1', name: 'Roma <x>', ludki: 7, abs: 7100, rek: 600, rekMax: 900, regen: 15, zdr: 2, prawo: 1, prawoPct: 34, racje: 3.5, racjaG: 1.5,
    econ: { pieniadz: 14, pieniadzBrutto: 20, handelZeSzlakow: 6, utrzymanieBudynkow: 4, utrzymanieSurowcowBudynkow: { drewno: 1, kamien: 1 }, pracaPula: 3, pracaBudynki: 9, nauka: 6 },
    food: { produkcja: 18.4, kosztRacji: 11, bilans: 7.4, wzrostProcent: 2.6, nakarmione: true },
    opts: [recOpt('Wojownik', 'Wojownik', 20, 100, {}, false), recOpt('Trirema', 'Trirema <x>', 60, 200, { drewno: 3 }, true)], water: true },
  { cityId: 'c2', name: 'Ostia', ludki: 4, abs: 3900, rek: 400, rekMax: 600, regen: 9, zdr: 0, prawo: 0, prawoPct: null, racje: 2, racjaG: -0.5,
    econ: { pieniadz: -2, pieniadzBrutto: undefined, handelZeSzlakow: 0, utrzymanieBudynkow: 3, pracaPula: 1, pracaBudynki: 4, nauka: 2 },
    food: { produkcja: 5, kosztRacji: 8, bilans: -3, wzrostProcent: 1.2, nakarmione: false },
    opts: [recOpt('Trirema', 'Trirema <x>', 60, 200, { drewno: 3 }, true)], water: false },
  { cityId: 'c3', name: 'Ostia', ludki: 3, abs: 2400, rek: 200, rekMax: 500, regen: 6, zdr: 1, prawo: 2, prawoPct: 12, racje: 6, racjaG: 3,
    econ: { pieniadz: 5, pieniadzBrutto: 7, handelZeSzlakow: 2, utrzymanieBudynkow: 5, utrzymanieSurowcowBudynkow: { sol: 2 }, pracaPula: 2, pracaBudynki: 6, nauka: 3 },
    food: { produkcja: 9, kosztRacji: 9, bilans: 0, wzrostProcent: 4.5 },
    opts: [], water: true },
];
/** Snapshot w kształcie webu (\`empireDetailTypes.ts\` main); warianty: pelny | duze (≥ 1000, stawka epoki 1,5) | pusty. */
export function snapFor(variant: string): any {
  const big = variant === 'duze';
  const e = big ? hudStateBig() : hudStateBase();
  // \`zeroPraca\`: jak \`pelny\`, ale pula Pracy 0,4 → \`round\` = 0 → przycisk zamiany disabled (main \`empireDetailPanel.ts:1441\`).
  if (variant === 'zeroPraca') e.praca = 0.4;
  const cities = variant === 'pusty' ? [] : CITIES_FX;
  // \`praca: 0.4\` — pula < 1 (przycisk „Zamień na podatek” disabled, main \`empireDetailPanel.ts:1441\`).
  if (variant === 'pusty') Object.assign(e, { osiedla: 0, ludnosc: 0, praca: 0.4, bogactwoWplywyBrutto: 0, bogactwoHandel: 0, bogactwoUtrzymanieSurowcowBudynkow: undefined });
  const K = big ? 1000 : 1;
  const cityEcon = cities.map((c: any, i: number) => ({
    name: c.name, ...c.econ,
    buildingGroups: i === 1 ? [] : [{ grupa: 'Rolnictwo', count: 2 + i }, { grupa: 'Wojsko <x>', count: 1 }],
    queue: i === 2 ? [] : [{ nazwa: 'Koszary', koszt: 40, postep: 12 + i }, { nazwa: 'Mur', koszt: 80 }],
    queueWstrzymana: i === 1, defense: { structBonusPct: 10 * i, hasWalls: i !== 1, garnizonCount: i },
  }));
  const cityPobor = cities.map((c: any) => ({
    cityId: c.cityId, name: c.name, ludki: c.ludki * (big ? 157 : 1), ludnoscAbsLabel: (c.abs / 1000).toFixed(1).replace('.', ',') + ' tys.', ludnoscAbsolutna: c.abs,
    rekruci: c.rek * K, rekruciMax: c.rekMax * K, regenPerTurn: c.regen, zdrowieBuildingCount: c.zdr, prawoAdminBuildingCount: c.prawo,
    prawoPct: c.prawoPct, poziomRacji: c.racje, racjaGrowthPct: c.racjaG,
    massRecruitment: { options: c.opts, queueCount: c.opts.length, waterAccess: c.water },
  }));
  const routes = cities.length === 0 ? [] : [
    { id: 'r1', cityId: 'c1', cityName: 'Roma <x>', partnerCityName: 'Kartago', partnerOwnerLabel: 'Kartagina', medium: 'morze', dystans: 9, income: 11 * K, budynekOdblokowany: true, premiaBudynku: 2 },
    { id: 'r2', cityId: 'c1', cityName: 'Roma <x>', partnerCityName: 'Memfis', partnerOwnerLabel: 'Egipt', medium: 'lad', dystans: 4, income: 6, budynekOdblokowany: false, premiaBudynku: 0 },
  ];
  const rate = big ? { citizenRatePerCitizen: 1.5 } : {};
  const resources = cities.length === 0 ? [] : [
    { id: 'drewno', icon: '🪵', label: 'Drewno', stock: 40 * K, ratePerTurn: 3 * K, rateProductionPerTurn: 5, rateDiploOutPerTurn: 2, typ: 'surowy', dostep: true, cap: 1200 * K, capBase: 1000, capBonusPerMagazyn: 100,
      citizenRequired: true, citizenCovered: true, ...rate, usage: { buildings: 2 * K, citizens: 14 * K, units: 1 } },
    { id: 'kamien', icon: '🪨', label: 'Kamień', stock: 0, ratePerTurn: -2 * K, typ: 'surowy', dostep: true, cap: 1200, capBase: 1000, capBonusPerMagazyn: 100,
      citizenRequired: true, citizenCovered: false, ...rate, usage: { buildings: 1, citizens: 0, units: 0 } },
    { id: 'ceramika', icon: '🏺', label: 'Ceramika', stock: 1200 * K, ratePerTurn: 0, rateProductionPerTurn: 4, rateDiploInPerTurn: 1, typ: 'przetworzony', dostep: true, zrodlo: 'Warsztat', cap: 1200,
      usage: { buildings: 0, citizens: 0, units: 0 } },
    { id: 'zywnosc', icon: '🌾', label: 'Żywność', stock: 55, ratePerTurn: 3, typ: 'podstawowy', dostep: true },
  ];
  return {
    global: {
      civName: 'Rzym <x>', civEmoji: '🏛', civPortraitUrl: null, styl: variant === 'pusty' ? '' : 'Militarny',
      jednostkaSpec: variant === 'pusty' ? '' : 'Legion', bonusStartowy: '+1 Praca <b>', religiaPanstwowa: 'Jowisz',
      bonusy: [{ opis: 'Bonus A <b>', realizuje: 'silnik' }, { opis: 'Bonus B', realizuje: 'UI' }], uchwaly: undefined,
    },
    economy: e,
    kultura: cities.length === 0
      ? { total: 0, rate: 0, thresholds: [], nextThreshold: null, pctToNext: null, happinessNote: 'Brak <x>', cities: [] }
      : { total: 50, rate: 3, thresholds: [10, 30, 60, 100], nextThreshold: 60, pctToNext: 70, happinessNote: 'Nota <x>',
        cities: [{ name: 'Roma <x>', kultura: 42, borderRadius: 2 }, { name: 'Ostia', kultura: 8, borderRadius: 1 }] },
    power: {
      power: 3020 * K, powerBase: 2800.6,
      components: [
        { key: 'ludnosc', label: 'Ludność', rawCount: 14 * K + 0.4, weightPct: 30, normalized: 0.5, points: 900, sharePct: 30, formulaNote: 'x <b>' },
        { key: 'armia', label: 'Armia', rawCount: big ? 999.96 : 4, weightPct: 40, normalized: 0.25, points: 1200, sharePct: 40 },
      ],
      ranking: [
        { civ: 'Rzym', power: 3020, powerMilitary: 1500, powerEconomic: 1520, rank: 1, isPlayer: true, wiarygodnosc: 12 },
        { civ: 'Kartagina <x>', power: 2500, powerMilitary: 1900, powerEconomic: 600, rank: 2, wiarygodnosc: -30 },
      ],
      respektExample: variant === 'pusty' ? undefined : { civ: 'Kartagina', respekt: 10, playerPower: 3020, theirPower: 2500 },
      absoluteRank: { rank: 1, total: 2 },
      ludnoscLudki: 14, ludnoscAbsLabel: '14 tys.', rekruci: 1200 * K, rekruciLabel: '1,2 tys.', rekrutEkw: 3, rekruciMax: 2000 * K,
      rekruciMaxLabel: '2 tys.', unitsOnMap: 4, kosztJednostki: 400,
    },
    cityEcon, cityPobor,
    massRecruitment: { ownerId: 0, treasury: 500 * K + 0.4, manpower: 1200 * K, stock: { drewno: 10 * K, kamien: 0, ceramika: 3, sol: big ? 999.94 : 1 }, queuedCount: 1, completedCount: 2 },
    resources,
    trade: {
      totalIncome: 24, routes,
      activeDeals: cities.length === 0 ? [] : [{ partnerLabel: 'Kartagina', partnerOwnerId: 2, turnsLeft: 5, trustPerTurn: 1, hasActiveRoute: true }],
      daninaLabel: 'Podatek', wonderBonusLadPct: 10, wonderBonusMorzePct: 0,
      resourceGrants: cities.length === 0 ? [] : [{ resourceKey: 'sol', label: 'Sól', partnerLabel: 'Kartagina' }],
    },
    food: {
      zapasy: 55, maxCap: 200, glodWojska: false,
      tick: variant === 'pusty' ? undefined : { uprawaHodowla: 30, wyzwienieLudnosci: 20, nadwyzka: 10, pomocMiastom: 3, spichlerzStolicy: 2, wojsko: 4, przyrostZapasow: 3 },
      perCityRows: cities.map((c: any) => ({ cityId: c.cityId, name: c.name, ...c.food })),
    },
    research: variant === 'pusty' ? null : { targetLabel: 'Pismo <x>', kosztCelu: 120, pula: 33, postepFraction: 0.27, turnsLeft: 6 },
    religion: {
      stateReligionLabel: 'Jowisz', totalAdherents: variant === 'pusty' ? 0 : 12345, ownSharePct: 70, foreignSharePct: 30, foreignLabel: variant === 'pusty' ? null : 'Ozyrys',
      faithRatePerTurn: 2, zadowolenieBonus: 1, templeCount: 2,
      cities: cities.length === 0 ? [] : [{ name: 'Roma <x>', religionLabel: 'Jowisz', isOwn: true, adherents: 9000 }],
    },
    happiness: cities.length === 0 ? { sources: [], totalNetto: 0, hasData: false }
      : { sources: [{ id: 'bud', label: 'Budynki', value: 3.5 }, { id: 'glod', label: 'Głód <x>', value: -2 }], totalNetto: 1.5, hasData: true },
    armiaProdukcja: cities.length === 0 ? [] : [{ cityId: 'c1', name: 'Roma <x>', unitName: 'Wojownik', etaTurns: 2, wstrzymana: false }],
  };
}
/** „Rust”: pola v2 liczone jak web (stawka obywateli = \`citizenRatePerCitizen\` wiersza, fallback stała — main \`:2455-2459\`). */
export function toV2Snap(s: any): any {
  const rate = s.resources.find((r: any) => r.citizenRequired === true && typeof r.citizenRatePerCitizen === 'number')?.citizenRatePerCitizen ?? R.CITIZEN_RATE;
  const foodById = new Map(s.food.perCityRows.map((r: any) => [r.cityId, r]));
  const rows = s.cityPobor.map((pob: any, i: number) => {
    const econ = s.cityEcon[i];
    const fd: any = foodById.get(pob.cityId);
    return { obyw: pob.ludki, ludnoscAbsolutna: pob.ludnoscAbsolutna,
      wzrostProcent: fd != null ? (fd.nakarmione === false ? 0 : fd.wzrostProcent) : null,
      praca: (econ?.pracaPula ?? 0) + (econ?.pracaBudynki ?? 0), pieniadz: econ?.pieniadz ?? 0,
      zywnosc: fd != null ? fd.bilans : 0, surowce: econ?.utrzymanieSurowcowBudynkow };
  });
  const t = s.trade;
  return {
    ...s,
    power: { ...s.power, zuzycieObywateliPerTyp: Math.floor(s.cityPobor.reduce((a: number, c: any) => a + c.ludki, 0) * rate) },
    cityPobor: s.cityPobor.map((c: any) => ({ ...c, zuzycieObywateliPerTurn: Math.floor(c.ludki * rate) })),
    food: { ...s.food, perCityRows: s.food.perCityRows.map((r: any) => ({ ...r, wzrostProcentEff: r.nakarmione === false ? 0 : r.wzrostProcent })) },
    resources: s.resources.map((r: any) => {
      const out: any = r.usage ? { ...r, usage: { ...r.usage, total: R.resourceUsageTotal(r.usage) } } : { ...r };
      if (r.cap != null) {
        out.magazynyCount = (r.capBase != null && r.capBonusPerMagazyn != null && r.capBonusPerMagazyn > 0 && r.cap > r.capBase)
          ? Math.round((r.cap - r.capBase) / r.capBonusPerMagazyn) : 0;
      }
      return out;
    }),
    trade: { ...t, tradeBaseIncome: t.routes.reduce((sum: number, r: any) => {
      const bonusPct = r.medium === 'morze' ? t.wonderBonusMorzePct : t.wonderBonusLadPct;
      return sum + (bonusPct > 0 ? Math.round(r.income / (1 + bonusPct / 100)) : r.income);
    }, 0) },
    miastaSummary: R.computeMiastaSummaryRow(rows),
  };
}
`;

function writeEntries() {
  writeFileSync(join(TMP, 'rust-ui2c.ts'), RUST_TS);
  writeFileSync(join(TMP, 'fix-ui2c.ts'), FIX_TS);
  const ui = (dir, m) => J(join(dir, 'ui', m));
  writeFileSync(join(TMP, 'entry-web.ts'), [
    `import * as R from './rust-ui2c';`,
    `import * as F from './fix-ui2c';`,
    `(globalThis as any).__boot = async () => {`,
    `  const [hud, emp, ash, urc] = await Promise.all([import(${ui(WEB_SRC, 'hud')}), import(${ui(WEB_SRC, 'empireDetailPanel')}),`,
    `    import(${ui(WEB_SRC, 'armyStackHud')}), import(${ui(WEB_SRC, 'unitRecruitCard')})]);`,
    `  (globalThis as any).__ui2c = { side: 'web', hud, emp, ash, urc, R, F, snapOf: (v: string) => F.snapFor(v) };`,
    `};`, '',
  ].join('\n'));
  writeFileSync(join(TMP, 'entry-port.ts'), [
    `import * as R from './rust-ui2c';`,
    `import * as F from './fix-ui2c';`,
    `import { installStaticCatalog } from ${J(join(SRC, 'controller/staticCatalog'))};`,
    `import { installEmpireQueries } from ${J(join(SRC, 'controller/empireQueries'))};`,
    `import { installPerfDiagnostics } from ${J(join(SRC, 'controller/diagnostics'))};`,
    `(globalThis as any).__boot = async () => {`,
    `  const cat = R.catalog();`,
    `  installStaticCatalog(cat); installEmpireQueries(R.empireQueries as any); installPerfDiagnostics(R.diag() as any);`,
    `  const [hud, emp, ash, urc] = await Promise.all([import(${ui(SRC, 'hud')}), import(${ui(SRC, 'empireDetailPanel')}),`,
    `    import(${ui(SRC, 'armyStackHud')}), import(${ui(SRC, 'unitRecruitCard')})]);`,
    `  (globalThis as any).__ui2c = { side: 'port', hud, emp, ash, urc, R, F, cat, snapOf: (v: string) => F.toV2Snap(F.snapFor(v)) };`,
    `};`, '',
  ].join('\n'));
}

/* ── Wektory wejściowe (identyczne dla obu stron) ───────────────────────────────────────────────────────────────── */
const BIGV = [0, 1, 999, 999.4, 999.96, 1000, 1001, -999, -1000, -1001, 1049, 1050, 1250, 20860, -20860, 99_949, 99_950, 999_949,
  999_950, 1_000_000, 1_250_000, -1_250_000, 999_950_000, 2 ** 53];
const HUD_FIELDS = ['bogactwo', 'bogactwoWplywyBrutto', 'bogactwoRate', 'praca', 'pracaRate', 'zywnoscRate', 'nauka', 'naukaRate',
  'handelIncome', 'armyUnitsOnMap', 'rekrutEkw', 'osiedla', 'ludnosc', 'ludnoscRate', 'kultura', 'kulturaRate', 'religionStock',
  'religionRate', 'kosztJednostki'];
const HUD_STATES = [];
for (const f of HUD_FIELDS) for (const v of BIGV) HUD_STATES.push({ [f]: v });
for (const z of ['55', '0', '999', '1000', '20860', '-1200', 'abc', '', '1e6', ' 42 ', 'NaN']) {
  HUD_STATES.push({ zywnoscLabel: z });
  // Stopa ≥ 1000 → nota „Dokładnie…” zależy od tego, czy wartość jest `undefined` (nienumeryczny label) czy 0.
  HUD_STATES.push({ zywnoscLabel: z, zywnoscRate: 1257 });
}
for (const f of ['bogactwoWplywyBrutto', 'bogactwoRate', 'zywnoscRate', 'naukaRate', 'handelIncome', 'armyUnitsOnMap', 'rekrutEkw',
  'kulturaRate', 'religionStock', 'religionRate', 'kosztJednostki', 'rekruciLabel']) HUD_STATES.push({ [f]: { __n: 'U' } });
for (const r of [0, 1, 2.5, -3, 12, 2 ** 53]) for (const k of [{ __n: 'U' }, 0, 400, 1500]) HUD_STATES.push({ rekrutEkw: r, kosztJednostki: k, rekruciLabel: 'Rekruci <b>&' });
HUD_STATES.push({ __big: true });
const IDENT = [];
for (const g of [{ isGeneral: true }, { isGeneral: false }, {}, { isGeneral: 1 }]) {
  for (const t of [{ __n: 'U' }, 'Wódz', 'Generał', '']) IDENT.push([g, 'Hoplita <x>', t]);
}
const MP_PAIRS = [];
for (const a of [0, 1, 999, 1000, 1500, 123456, 2_500_000, -5, NaN, 99999.6]) for (const r of [0, 1000, 1500, 12_345_678, NaN]) MP_PAIRS.push([a, r]);
const RECRUIT_VARIANTS = [
  { skarb: { __n: 'U' }, canPurchase: true },
  { skarb: 1000000, canPurchase: true, mpCost: 1000, mpCostLabel: '1 tys.', manpowerAvailable: 123456, manpowerRequired: 1500, maxQuantity: 4 },
  { skarb: 0, canPurchase: true, mpCost: 0, mpCostLabel: '0', manpowerAvailable: 999 },
  { skarb: 50, canPurchase: false, manpowerAvailable: 2500000, manpowerRequired: 12345678, manpowerMissingLabel: 'Brak rekrutów', stockMissingLabel: 'Brak Brązu',
    stockChipsHtml: '<span class="bld-infocard-chip">2 Brąz</span>', resourceUpkeepChipsHtml: '<span class="bld-infocard-chip">1 Drewno/t</span>' },
  { skarb: 50, canPurchase: false, disabledReason: 'Tylko w stolicy <x>' },
  { skarb: 50, canPurchase: false, disabledReason: 'Limit dowódców', manpowerMissingLabel: 'Brak rekrutów' },
  { skarb: 999, canPurchase: true, mpCost: 200, mpCostLabel: '200', unitLabel: 'Wódz' },
  { skarb: 999, canPurchase: true, mpCost: 200, mpCostLabel: '200', unitLabel: '' },
  { skarb: 999, canPurchase: true, manpowerAvailable: 99999.6, manpowerRequired: 100000, maxQuantity: 9, unitLabel: 'Generał «X»' },
  { skarb: 10, canPurchase: true, mpCost: 1200, mpCostLabel: '1,2 tys.', manpowerAvailable: 1000, manpowerRequired: 1200 },
  // Pula państwa nieznana + koszt „0” (Zwiadowca): gałąź `mpOnly` NIE może się pojawić (main `unitRecruitCard.ts:270`).
  { skarb: 0, canPurchase: true, mpCost: 0, mpCostLabel: '0' },
];
const INPUT = { HUD_STATES, IDENT, MP_PAIRS, RECRUIT_VARIANTS };

/** Kod w przeglądarce: wektory + DOM + log akcji. */
const EVAL = async (inputStr) => {
  const dec = (v) => (v && typeof v === 'object' && '__n' in v ? ({ NaN, Inf: Infinity, NInf: -Infinity, NZ: -0, U: undefined })[v.__n] : v);
  const deep = (x) => (Array.isArray(x) ? x.map(deep) : x && typeof x === 'object' && !('__n' in x)
    ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, deep(v)])) : dec(x));
  const I = deep(JSON.parse(inputStr));
  const G = globalThis.__ui2c;
  const { hud, emp, ash, urc, R, F } = G;
  const port = G.side === 'port';
  const out = {};
  const log = [];
  const act = (name, ret) => (...a) => { log.push(name + '(' + JSON.stringify(a) + ')'); return typeof ret === 'function' ? ret(...a) : ret; };
  const safe = (f) => { try { return f(); } catch (e) { return 'THROW:' + String(e && e.message); } };
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const host = document.getElementById('host');

  // 1. HUD — pasek zasobów `renderBarD1B` (chipy skrócone + `exact`, rekruci).
  out.hudBar = I.HUD_STATES.map((o) => safe(() => hud.renderBarD1B(o.__big ? F.hudStateBig() : { ...F.hudStateBase(), ...o })));
  // 2. Roster armii — tożsamość dowódcy.
  out.armyIdentity = I.IDENT.map(([u, n, t]) => safe(() => JSON.stringify(ash.armyStackCardIdentity(u, n, t))));
  // Roster armii — render kart (dowódca: klasa `commander`, ★, rola + typ, aria/title) i ikony split/merge.
  out.armyStack = [];
  const combat0 = { atakBase: 4, atakEffective: 4, obronaBase: 6, obronaEffective: 6, hpMaxBase: 10, hpMaxEffective: 10, pancerzBase: 1, pancerzEffective: 1,
    weaponDamageBase: 2, weaponDamageEffective: 2, piercingBase: 0, piercingEffective: 0, chargeBonusBase: 0, chargeBonusEffective: 0, missileAttackBase: 0, missileAttackEffective: 0 };
  for (const titles of [[undefined, undefined], ['Wódz', undefined], ['Generał', 'Wódz'], ['', 'Generał'], ['Król', undefined]]) {
    for (const canMS of [false, true]) {
      const st0 = { hexLabel: 'Heks <1>', unitCount: 2, displayName: 'Hoplita', combat: combat0, mov: 2, rng: 0, hp: 9, actions: [],
        cards: [{ id: 'a"1', name: 'Hoplita <x>', commanderTitle: titles[0], icon: '', hp: 10, hpMax: 10, ruchLeft: 1, ruchMax: 2, active: true },
          { id: 'b', name: 'Łucznik', commanderTitle: titles[1], icon: '🛡', hp: 3, hpMax: 0, ruchLeft: 0, ruchMax: 2, active: false }] };
      const st = port ? { ...st0, badges: R.badges(st0) } : st0;
      const api = ash.createArmyStackHud({ getStack: () => st, onSelectUnit: act('sel'), onAction: act('act'), onClose: act('close'),
        canMerge: () => canMS, canSplit: () => canMS, onMerge: act('merge'), onSplit: act('split') });
      api.update();
      out.armyStack.push(api.el.innerHTML);
      api.destroy();
    }
  }
  // 3. Karta rekrutacji — tytuł puli, CSS, wiersze, interakcje.
  out.manpowerStatusTitle = I.MP_PAIRS.map(([a, r]) => safe(() => urc.manpowerStatusTitle(a, r)));
  out.recruitCss = [urc.UNIT_RECRUIT_CARD_CSS];
  const units = R.units;
  const recruitOpts = (k, v, u) => {
    const koszt = 30 + (k % 5) * 20;
    const nazwa = u.Jednostka + ' «etykieta ' + k + '»';
    const common = { ...v, treasuryIconHtml: '<i class="tr">¤</i>', onRecruit: act('onRecruit', k % 2 === 0) };
    return port
      ? { ...common, udef: u, data: G.cat, affordable: v.skarb === undefined || v.skarb >= koszt,
        item: { kind: 'unit', id: u.Jednostka, label: nazwa, koszt, postep: 0, etaTurns: null, stockCost: {}, stockMissing: {} } }
      : { ...common, udef: u, data: {}, item: { kind: 'unit', id: u.Jednostka, nazwa, koszt } };
  };
  out.recruitRows = [];
  for (let k = 0; k < units.length; k++) {
    const v = I.RECRUIT_VARIANTS[k % I.RECRUIT_VARIANTS.length];
    out.recruitRows.push(safe(() => urc.buildUnitRecruitCard(recruitOpts(k, v, units[k])).outerHTML));
  }
  out.recruitInteract = [];
  for (let i = 0; i < I.RECRUIT_VARIANTS.length; i++) {
    host.innerHTML = '';
    log.length = 0;
    const row = urc.buildUnitRecruitCard(recruitOpts(i, I.RECRUIT_VARIANTS[i], units[3]));
    host.appendChild(row);
    const q = (s) => host.querySelector(s);
    q('[data-recruit-quantity-action="increase"]')?.click();
    q('[data-recruit-quantity-action="increase"]')?.click();
    q('[data-recruit-quantity-action="decrease"]')?.click();
    const inp = q('.unit-recruit-quantity-input');
    if (inp) { inp.value = '3'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    q('.unit-recruit-submit')?.click();
    out.recruitInteract.push(host.innerHTML + '\n' + [...host.querySelectorAll('button,input')].map((b) => b.className + ':' + b.disabled + ':' + b.title + ':' + (b.value ?? '')).join('\n') + '\n' + log.join('\n'));
  }
  // 4. Panel imperium — sekcja rekrutacji (czysty render + montaż hooków).
  const snaps = { pelny: G.snapOf('pelny'), duze: G.snapOf('duze'), pusty: G.snapOf('pusty'), zeroPraca: G.snapOf('zeroPraca') };
  out.massSection = [];
  for (const v of Object.keys(snaps)) {
    for (const follow of [undefined, true, false]) {
      emp.configureEmpireMassRecruitment({ getRecruitFollowGeneralDefault: follow === undefined ? undefined : () => follow });
      out.massSection.push(safe(() => emp.renderMassRecruitmentSection(snaps[v].cityPobor, snaps[v].massRecruitment)));
    }
  }
  out.massMount = [];
  const mountVariants = [
    [act('mountCity', true), act('mountGeneral', true)],
    [act('mountCity', (id) => id !== 'c2'), act('mountGeneral', false)],
    [undefined, undefined],
  ];
  for (const v of ['pelny', 'duze', 'pusty']) {
    for (const [mi, [mc, mg]] of mountVariants.entries()) {
      host.innerHTML = '';
      log.length = 0;
      emp.configureEmpireMassRecruitment({ getRecruitFollowGeneralDefault: () => mi !== 1, onRecruitFollowGeneralDefaultChange: act('followChange'),
        mountCityRecruitment: undefined, mountGeneralRecruitment: undefined });
      host.innerHTML = emp.renderMassRecruitmentSection(snaps[v].cityPobor, snaps[v].massRecruitment);
      const mcW = mc ? (id, el) => { const ok = mc(id); if (ok) el.insertAdjacentHTML('beforeend', '<i>miasto ' + id + '</i>'); return ok; } : undefined;
      const mgW = mg ? (el) => { const ok = mg(); if (ok) el.insertAdjacentHTML('beforeend', '<i>dowódca</i>'); return ok; } : undefined;
      safe(() => emp.mountMassRecruitmentControls(host, snaps[v], mcW, mgW));
      const cb = host.querySelector('input[data-recruit-follow-general]');
      if (cb) cb.click();
      if (cb) cb.click();
      out.massMount.push(host.innerHTML + '\n' + log.join('\n'));
    }
  }
  // 5. Pełny panel imperium: sekcje + „Zamiana Pracy na podatek” (hooki, podgląd, confirm) + rekrutacja w Armii.
  const realConfirm = window.confirm;
  out.panel = [];
  const workCfgs = {
    brak: {},
    wl: { canConvertOwnerWorkToTax: () => true, getOwnerWorkTaxRate: () => 2, previewOwnerWorkTaxEffect: (o, tax) => ({ skarb: tax * 0.73, nauka: tax * 0.21 - 0.5 }),
      onConvertOwnerWorkToTax: act('onConvertOwnerWorkToTax', 5) },
    wlBezPodgladu: { canConvertOwnerWorkToTax: () => true, getOwnerWorkTaxRate: undefined, previewOwnerWorkTaxEffect: () => null,
      onConvertOwnerWorkToTax: act('onConvertOwnerWorkToTax', 0) },
    wyl: { canConvertOwnerWorkToTax: () => false, getOwnerWorkTaxRate: () => 3, previewOwnerWorkTaxEffect: undefined, onConvertOwnerWorkToTax: act('onConvertOwnerWorkToTax', 0) },
  };
  const SECTIONS = [undefined, 'econ-praca', 'armia', 'econ-obywatele', 'surowce', 'parametry', 'econ-rekruci', 'moc'];
  for (const v of ['pelny', 'duze', 'pusty', 'zeroPraca']) {
    for (const [wn, wc] of Object.entries(workCfgs)) {
      if (v === 'zeroPraca' && wn !== 'wl') continue;
      for (const sec of SECTIONS) {
        if (wn !== 'wl' && !['econ-praca', undefined].includes(sec)) continue;
        if (v === 'zeroPraca' && sec !== 'econ-praca') continue;
        for (const confirmAns of sec === 'econ-praca' && wn !== 'brak' ? [true, false] : [true]) {
          log.length = 0;
          window.confirm = (m) => { log.push('confirm(' + m + ')'); return confirmAns; };
          emp.configureEmpireHandelSplit({ getOwnerDefault: () => ({ procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 }),
            onOwnerDefaultChange: act('onOwnerDefaultChange'), getDaninaLabel: () => 'Podatek', getActiveOwnerId: () => 0 });
          emp.configureEmpireGlobalDefaults({ getOwnerDefaultPodzialPracy: () => ({ procentBudynki: 70 }), onOwnerDefaultPodzialPracyChange: act('onPodzial'),
            getOwnerDefaultPoziomRacji: () => 3.5, onOwnerDefaultPoziomRacjiChange: act('onRacje'), onOwnerSetAutoWyzywienieForAll: act('onAutoWyz'),
            getActiveOwnerId: () => 0, canConvertOwnerWorkToTax: undefined, getOwnerWorkTaxRate: undefined, previewOwnerWorkTaxEffect: undefined,
            onConvertOwnerWorkToTax: undefined, ...wc });
          emp.configureEmpireMassRecruitment({
            mountCityRecruitment: (id, el) => { log.push('mountCity(' + id + ')'); el.insertAdjacentHTML('beforeend', '<i>miasto ' + id + '</i>'); return id !== 'c3'; },
            mountGeneralRecruitment: (el) => { log.push('mountGeneral'); el.textContent = 'karta dowódcy'; return true; },
            getRecruitFollowGeneralDefault: () => true, onRecruitFollowGeneralDefaultChange: act('followChange'),
          });
          const snap = snaps[v];
          safe(() => { emp.mountEmpireDetailPanel(() => snap); emp.showEmpireDetailPanel(sec); });
          await tick();
          const box = document.querySelector('[data-work-tax-convert]');
          const parts = [];
          if (box) {
            const inp = box.querySelector('[data-work-tax-amount]');
            const pv = box.querySelector('[data-work-tax-preview]');
            for (const val of ['7', '0', '-3', '999999', '2.9', 'x']) {
              inp.value = val;
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              parts.push('input ' + val + ' → ' + pv.textContent);
              inp.dispatchEvent(new Event('change', { bubbles: true }));
              parts.push('change ' + val + ' → ' + pv.textContent);
              box.querySelector('[data-work-tax-submit]').click();
            }
          }
          const panelEl = document.querySelector('.civ-emp-panel') ?? document.body;
          out.panel.push(v + '/' + wn + '/' + (sec ?? 'all') + '/' + confirmAns + '\n' + panelEl.outerHTML + '\n' + parts.join('\n') + '\n' + log.join('\n'));
          safe(() => emp.hideEmpireDetailPanel());
        }
      }
    }
  }
  window.confirm = realConfirm;
  host.innerHTML = '';
  return out;
};

/** Sceny zrzutów (wywoływane osobno przed `page.screenshot`). */
const SCENE = async (name) => {
  const G = globalThis.__ui2c;
  const { hud, emp, urc, R, F } = G;
  const port = G.side === 'port';
  const noop = () => {};
  const tick = () => new Promise((r) => setTimeout(r, 0));
  try { hud.hideHud(); } catch { /* brak HUD */ }
  try { emp.hideEmpireDetailPanel(); } catch { /* brak panelu */ }
  const host = document.getElementById('host');
  host.innerHTML = '';
  if (name === 'hud') {
    const combat = { atakBase: 4, atakEffective: 5, obronaBase: 6, obronaEffective: 5, hpMaxBase: 10, hpMaxEffective: 11, pancerzBase: 1, pancerzEffective: 2,
      weaponDamageBase: 2, weaponDamageEffective: 2, piercingBase: 0, piercingEffective: 1, chargeBonusBase: 0, chargeBonusEffective: 0, missileAttackBase: 0, missileAttackEffective: 1 };
    const stack = { hexLabel: 'Heks 12,7', unitCount: 3, displayName: 'Hoplita', combat, mov: 2, rng: 0, hp: 9, parametryPathPp: 17, pancerzPathPp: 31,
      actions: [{ id: 'fortify', label: 'Fortyfikuj', primary: true }],
      cards: [{ id: 'g', name: 'Hoplita', commanderTitle: 'Wódz', icon: '', hp: 10, hpMax: 10, ruchLeft: 2, ruchMax: 2, active: true },
        { id: 'h', name: 'Generał-typ', commanderTitle: 'Generał', icon: '', hp: 7, hpMax: 10, ruchLeft: 1, ruchMax: 2, active: false },
        { id: 'w', name: 'Wojownik <x>', icon: '', hp: 4, hpMax: 10, ruchLeft: 0, ruchMax: 2, active: false }] };
    const st = port ? { ...stack, badges: R.badges(stack) } : stack;
    hud.showHud({
      getState: () => F.hudStateBig(), onEndTurn: noop, onOpenCities: noop, onOpenScience: noop, onOpenDiplomacy: noop, onOpenMenu: noop,
      onOpenWiki: noop, isWikiActive: () => false, getMinimapData: () => null, onMinimapClick: noop, getContextPanelMessage: () => null,
      getEvents: () => [], onEventClick: noop, onEventDismiss: noop, onDismissAll: noop, getEventLink: () => null, getWarsWithPlayer: () => [],
      onExecutePending: noop, canEndTurn: () => true, getBlockingCount: () => 0, getYearLabel: () => '1200 p.n.e.', hideEndTurn: () => false,
      armyStack: { getStack: () => st, onSelectUnit: noop, onAction: noop, onClose: noop, canMerge: () => true, canSplit: () => true, onMerge: noop, onSplit: noop },
      onDiploChip: noop, onOpenEmpireDetail: noop, getPowerOverlay: () => null, getCultureOverlay: () => null, getReligionOverlay: () => null,
    });
    hud.updateHud();
  } else if (name === 'recruit') {
    const style = document.createElement('style');
    style.id = 'ui2c-recruit-css';
    document.getElementById('ui2c-recruit-css')?.remove();
    style.textContent = urc.UNIT_RECRUIT_CARD_CSS + '\n.civ-cs{--muted:#9aa4b2;--text:#e8e0c8;font:13px sans-serif;color:#e8e0c8;background:#141a24;padding:6px}'
      + '\n.civ-cs .btn{border:1px solid #556;background:#223;color:#ddd;font:inherit}';
    document.head.appendChild(style);
    for (const width of ['min(100%, 340px)', '280px', '640px']) {
      const cs = document.createElement('div');
      cs.className = 'civ-cs';
      cs.style.width = width;
      host.appendChild(cs);
      const variants = [
        { skarb: 1000000, canPurchase: true, mpCost: 1000, mpCostLabel: '1 tys.', manpowerAvailable: 123456, manpowerRequired: 1500, maxQuantity: 4 },
        { skarb: 50, canPurchase: false, manpowerAvailable: 1000, manpowerRequired: 12345678, manpowerMissingLabel: 'Brak rekrutów',
          stockChipsHtml: '<span class="bld-infocard-chip">2 Brąz</span>', resourceUpkeepChipsHtml: '<span class="bld-infocard-chip">1 Drewno/t</span>' },
        { skarb: 999, canPurchase: true, mpCost: 200, mpCostLabel: '200', unitLabel: 'Wódz' },
        { skarb: 5, canPurchase: false, disabledReason: 'Tylko w stolicy' },
      ];
      variants.forEach((v, k) => {
        const u = R.units[k + 2];
        const nazwa = u.Jednostka;
        const opts = port
          ? { ...v, udef: u, data: G.cat, affordable: v.skarb >= 40, treasuryIconHtml: '¤', onRecruit: noop,
            item: { kind: 'unit', id: u.Jednostka, label: nazwa, koszt: 40, postep: 0, etaTurns: null, stockCost: {}, stockMissing: {} } }
          : { ...v, udef: u, data: {}, treasuryIconHtml: '¤', onRecruit: noop, item: { kind: 'unit', id: u.Jednostka, nazwa, koszt: 40 } };
        cs.appendChild(urc.buildUnitRecruitCard(opts));
      });
    }
  } else if (name === 'panel-praca' || name === 'panel-armia') {
    emp.configureEmpireGlobalDefaults({ getActiveOwnerId: () => 0, getOwnerDefaultPodzialPracy: () => ({ procentBudynki: 70 }),
      onOwnerDefaultPodzialPracyChange: noop, canConvertOwnerWorkToTax: () => true, getOwnerWorkTaxRate: () => 2,
      previewOwnerWorkTaxEffect: (o, tax) => ({ skarb: tax, nauka: 1 }), onConvertOwnerWorkToTax: () => 0 });
    emp.configureEmpireMassRecruitment({ mountCityRecruitment: (id, el) => { el.textContent = 'Lista rekrutacji: ' + id; return true; },
      mountGeneralRecruitment: (el) => { el.textContent = 'Karta dowódcy'; return true; }, getRecruitFollowGeneralDefault: () => true });
    const snap = G.snapOf('duze');
    emp.mountEmpireDetailPanel(() => snap);
    emp.showEmpireDetailPanel(name === 'panel-praca' ? 'econ-praca' : 'armia');
  }
  await tick();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // Panel imperium wjeżdża `transition: transform .22s` (+ backdrop `opacity .2s`) — zrzut po zakończeniu animacji.
  await new Promise((r) => setTimeout(r, 450));
  // `hideHud()` zostawia roster armii w DOM — poza sceną HUD chowamy go, żeby nie zasłaniał sceny (obie strony tak samo).
  if (name !== 'hud') document.querySelectorAll('.civ-army-stack').forEach((n) => { n.style.display = 'none'; });
  // Nowe bloki partii są niżej w panelu — przewiń do nich (ta sama operacja po obu stronach).
  const target = name === 'panel-praca' ? '[data-work-tax-convert]' : name === 'panel-armia' ? '[data-mass-recruitment]' : null;
  // Przewinięcie po ustaleniu układu (fonty + obrazy) i na CAŁKOWITĄ pozycję (bez `scrollIntoView` — ułamkowy scrollTop
  // dawał zależny od przebiegu zrzut sceny Armia).
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
  // Fokus po kliknięciach z EVAL (np. checkbox „Idź do wodza”) rysuje pierścień — zdejmij go przed zrzutem.
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  const tEl = target ? document.querySelector(target) : null;
  if (tEl) {
    let sc = tEl.parentElement;
    while (sc && !(sc.scrollHeight > sc.clientHeight && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    if (sc) sc.scrollTop = Math.floor(tEl.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop);
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const scrolls = [...document.querySelectorAll('*')].filter((n) => n.scrollTop > 0).map((n) => n.className + '=' + n.scrollTop).join(';');
  const h = [...document.body.innerHTML].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7);
  return `dom=${document.body.innerHTML.length}/${(h >>> 0).toString(16)} scroll=${scrolls || '0'}`;
};

const enc = (x) => JSON.stringify(x, (_k, v) => {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return { __n: 'NaN' };
    if (v === Infinity) return { __n: 'Inf' };
    if (v === -Infinity) return { __n: 'NInf' };
    if (Object.is(v, -0)) return { __n: 'NZ' };
  }
  if (v === undefined) return { __n: 'U' };
  return v;
});
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
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
// Determinizm: zamrożony czas i `Math.random` (te same po obu stronach).
const INIT = () => {
  const FIXED = Date.UTC(2026, 9, 22, 10, 30, 15);
  const RD = Date;
  class FD extends RD { constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); } static now() { return FIXED; } }
  globalThis.Date = FD;
  let s = 12345;
  Math.random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
};
const SCENES = ['hud', 'recruit', 'panel-praca', 'panel-armia'];
const VIEWPORTS = [[1280, 720], [360, 640]];

let exitCode = 0;
let browser = null;
const servers = [];
try {
  writeEntries();
  const sides = {};
  for (const side of ['web', 'port']) {
    const outdir = join(TMP, 'out-' + side);
    await bundle([join(TMP, `entry-${side}.ts`), join(TMP, 'fix-ui2c.ts')], outdir);
    const entryJs = readdirSync(outdir, { recursive: true }).map(String).find((f) => f.split('/').pop() === `entry-${side}.js`);
    if (!entryJs) throw new Error(`${side}: brak entry-${side}.js w ${outdir}`);
    writeFileSync(join(outdir, 'index.html'), `<!doctype html><html lang="pl"><meta charset="utf-8"><link rel="icon" href="data:,"><body style="margin:0;background:#0b0f16"><div id="host" style="width:100%"></div><script type="module" src="./${entryJs}"></script>`);
    sides[side] = outdir;
  }
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu', '--num-raster-threads=1', '--disable-partial-raster', '--disable-lcd-text'] });
  const res = {};
  const consoleErrors = [];
  for (const side of ['web', 'port']) {
    const srv = await serve(sides[side]);
    servers.push(srv);
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await page.addInitScript(INIT);
    page.on('pageerror', (e) => consoleErrors.push(`${side}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${side}: ${m.text()}`); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
    await page.waitForFunction(() => typeof globalThis.__boot === 'function', null, { timeout: 60000 });
    await page.evaluate(() => globalThis.__boot());
    const vec = await page.evaluate(EVAL, enc(INPUT));
    const png = {};
    const sceneInfo = {};
    for (const sc of SCENES) {
      for (const [w, h] of VIEWPORTS) {
        await page.setViewportSize({ width: w, height: h });
        sceneInfo[`${sc}@${w}x${h}`] = await page.evaluate(SCENE, sc);
        // Zrzut STABILNY: powtarzany, aż dwa kolejne są bajtowo równe (dekodowanie obrazów/układ po przewinięciu bywa
        // asynchroniczne — pojedynczy zrzut sceny Armia różnił się o 3 B między przebiegami tej samej strony).
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
        });
        let prev = await page.screenshot({ animations: 'disabled', caret: 'hide' });
        for (let tries = 0; tries < 8; tries++) {
          await page.waitForTimeout(150);
          const cur = await page.screenshot({ animations: 'disabled', caret: 'hide' });
          if (Buffer.compare(prev, cur) === 0) break;
          prev = cur;
        }
        png[`${sc}@${w}x${h}`] = prev;
      }
    }
    const ua = await page.evaluate(() => navigator.userAgent);
    res[side] = { vec, png, ua, sceneInfo };
    await page.close();
  }
  const results = [];
  let diffs = 0;
  for (const key of Object.keys(res.web.vec)) {
    const w = res.web.vec[key];
    const p = res.port.vec[key] ?? [];
    let d = 0;
    let first = '';
    for (let i = 0; i < Math.max(w.length, p.length); i++) {
      if (w[i] !== p[i]) {
        d++;
        if (!first) {
          const a = String(w[i]);
          const b = String(p[i]);
          let j = 0;
          while (j < a.length && a[j] === b[j]) j++;
          first = `#${i} @${j} web=${JSON.stringify(a.slice(Math.max(0, j - 60), j + 100))} port=${JSON.stringify(b.slice(Math.max(0, j - 60), j + 100))}`;
        }
      }
    }
    const distinct = new Set(w).size;
    const throws = w.filter((x) => String(x).startsWith('THROW:')).length;
    const coverOk = w.length >= 1 && (w.length === 1 || distinct > 1);
    diffs += d + (coverOk ? 0 : 1);
    results.push({ key, n: w.length, distinct, diffs: d, throws, coverOk, first });
  }
  const pixRows = [];
  for (const k of Object.keys(res.web.png)) {
    const eq = Buffer.compare(res.web.png[k], res.port.png[k]) === 0;
    if (!eq) diffs++;
    pixRows.push({ k, eq, bytes: res.web.png[k].length, sha: createHash('sha256').update(res.web.png[k]).digest('hex') });
    if (PNG_DIR) {
      mkdirSync(PNG_DIR, { recursive: true });
      writeFileSync(join(PNG_DIR, `web-${k}.png`), res.web.png[k]);
      if (!eq) writeFileSync(join(PNG_DIR, `port-${k}.png`), res.port.png[k]);
    }
  }
  if (consoleErrors.length) diffs++;
  for (const r of results) {
    console.log(`${r.key.padEnd(22)} wektory=${String(r.n).padStart(5)} różne_wyniki=${String(r.distinct).padStart(5)} THROW_web=${r.throws} różnice=${r.diffs}${r.coverOk ? '' : ' COVER-FAIL'}${r.first ? ' ' + r.first : ''}`);
  }
  for (const r of pixRows) console.log(`PIX ${r.k.padEnd(24)} web vs port: ${r.eq ? 'identyczny' : 'RÓŻNY'} (PNG ${r.bytes} B, sha256 ${r.sha.slice(0, 16)}…)${r.eq ? '' : ` web[${res.web.sceneInfo[r.k]}] port[${res.port.sceneInfo[r.k]}]`}`);
  console.log(`ERR pageerror+console.error: ${consoleErrors.length}${consoleErrors.length ? ' ' + consoleErrors.slice(0, 5).join(' | ') : ''}`);
  console.log(`Chromium: ${res.web.ua}`);
  const webHash = createHash('sha256').update(JSON.stringify(res.web.vec)).digest('hex');
  if (OUT) {
    // Grupy małe — pełna treść; grupy z pełnym DOM panelu/wierszy (MB) — sha256 każdego wektora (fixtura < 1 MB w repo).
    const vectors = {};
    const vectorSha256 = {};
    for (const [k, arr] of Object.entries(res.web.vec)) {
      if (JSON.stringify(arr).length < 200_000) vectors[k] = arr;
      else vectorSha256[k] = arr.map((x) => createHash('sha256').update(String(x)).digest('hex'));
    }
    writeFileSync(OUT, JSON.stringify({
      topic: 'R-RUSTPORT-REPIN-UI-2-C-Q1', source: 'web origin/main 86d510c66 (Chromium, run-repin-ui2c.mjs)', webVectorsSha256: webHash,
      png: Object.fromEntries(pixRows.map((r) => [r.k, { sha256: r.sha, bytes: r.bytes }])), vectors, vectorSha256,
    }, null, 1) + '\n');
  }
  console.log(`run-repin-ui2c: modułów=${MODULES.length} grup=${results.length} wektorów=${results.reduce((a, r) => a + r.n, 0)} zrzutów=${pixRows.length} różnic=${diffs} webVectorsSha256=${webHash}`);
  exitCode = diffs === 0 ? 0 : 1;
} catch (e) {
  console.error('BŁĄD harnessu:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  for (const s of servers) s.close();
  rmSync(TMP, { recursive: true, force: true });
}
process.exitCode = exitCode;
