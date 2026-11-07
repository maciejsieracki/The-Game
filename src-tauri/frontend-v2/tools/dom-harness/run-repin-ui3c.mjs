#!/usr/bin/env node
/**
 * run-repin-ui3c.mjs — harness partii REPIN UI-3-C (R-RUSTPORT-REPIN-WEB-UI-3-C-Q1, runda 1).
 *
 * Moduły partii (PORTY DOM przepięte na web `origin/main` `9b019a7d8`, sekcja `portDomUI3C` w `tools/repin-ui3-manifest.json`):
 *   ui/hexContextTooltip.ts  karta stosu: pasek „Zaznacz do rozwiązania” (`picked`, `pick-all`/`pick-none`), pole wyboru na karcie,
 *                            generałowie pierwsi / cywile ostatni (`sortArmyStackGeneralsFirst`), etykieta `armyStackCardLabel`,
 *                            CSS dowódcy/wyboru; tooltip heksa: etykiety odblokowań bez surowca z wiersza produkcji
 *                            (`unlockLabelsBeyondProduction` na DTO), deduplikacja linii surowców (ZAŁOŻENIE U3C-Z2), etykiety terenu;
 *   ui/buildModeHud.ts       hak `isAutoBuildEnabled` (blok „Automatyzacja ulepszeń terenu” → podpowiedź `AUTO_BUILD_DISABLED_HINT`),
 *                            usunięte przyciski „Tylko pola z obywatelami” / „Wolno wycinać las” / „Wyłącz filtr”, nowy tekst
 *                            „Budżet niewydany”, etykieta efektu w mieście bez „· tylko 👤”;
 *   ui/empireDetailPanel.ts  suwaki: wypełnienie do środka uchwytu (`sliderFillGradient`/`sliderRangePct`/`sliderThumbCenterCss`,
 *                            także aktualizacja po `input`), wiersze „Brutto → netto” (Nauka/Spichlerz/Surowce/Handel),
 *                            `formatManpowerCompact` (k/M), mnożnik epoki w stopce zużycia obywateli.
 *
 * WEB:  moduły z URUCHOMIONEGO weba (`--web-dir`): zalecany katalog `WEB86U3` = `repin-ui2-overlay.mjs --pin-dir $WEB86
 *       --web-dir $WEB86 --web3-dir $WEB3` (web 86d510c66 + pliki UI-3 z 9b019a7d8 — partie B/D/E przepinają rozłączne pliki,
 *       ZAŁOŻENIE U3C-Z5); także pełny `git archive 9b019a7d8` (różnice wyłącznie z plików innych partii — raport informacyjny).
 *       Pakowane `build.mjs`, wykonane w Chromium (Playwright `/opt/node-tools`, `/opt/pw-browsers/chromium-1194`), HTTP localhost.
 *       Strona web liczy też DTO dla portu funkcjami weba („Rust”): `HexTooltipViewDto` (transkrypcja `hexContextTooltip.ts`
 *       9b019a7d8 — możliwe ulepszenia wg `hexHasHorseDeposit`/`hexHasRiverAccess`→`isHexNearRiver`), `StaticCatalogDto`,
 *       `EmpireQueriesProvider`, pola snapshotu v2 (jak `run-repin-ui2c.mjs`).
 * PORT: `src/**` frontend-v2 (`--src`), ten sam `build.mjs`, ta sama instancja Chromium.
 *
 * Porównanie (EXIT 0 <=> wszystko zgodne):
 *   VEC   każdy przypadek (HTML po parsowaniu przeglądarki / log akcji / `style.background` suwaków po `input`) web === port;
 *         `resourceLabels` z „Rust” w DWÓCH wariantach (stary filtr małych liter i filtr 9b019a7d8) — port musi dać wynik webu w obu;
 *   PIX   zrzuty PNG scen w 1280×720 i 360×640: bajty PNG web === port;
 *   ERR   `pageerror` + `console.error` = 0 po obu stronach;
 *   COVER znaczniki nowych hunków występują w wynikach web, usunięte teksty nie występują; asercje rozróżnialności
 *         (filtr odblokowań i deduplikacja surowców faktycznie coś usuwają w ≥ 1 przypadku).
 * `--out <plik>`: fixtura (sha256 wektorów WEB + PNG). `--kinds` podzbiór (hex,unit,bm,emp,pix).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui3c.mjs --web-dir <WEB_DIR> [--src <src>] [--out <plik>] [--png-dir <dir>] [--kinds <lista>] [--tmp-dir <dir>]
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
  console.error('Użycie: node tools/dom-harness/run-repin-ui3c.mjs --web-dir <katalog z gra/src i gra/data> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const WEB_DATA = join(resolve(WEB_DIR), 'gra/data');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
const ALL_KINDS = 'hex,unit,bm,emp,pix';
const KINDS = new Set((argOf('--kinds') ?? ALL_KINDS).split(','));
const MODULES = ['ui/hexContextTooltip.ts', 'ui/buildModeHud.ts', 'ui/empireDetailPanel.ts'];
for (const m of MODULES) {
  for (const dir of [SRC, WEB_SRC]) {
    if (!existsSync(join(dir, m))) {
      console.error(`BRAK modułu ${join(dir, m)}`);
      process.exit(2);
    }
  }
}
// Web 9b019a7d8 tej partii: bez tych plików odniesienie nie jest wersją UI-3 (np. czysty web 86d510c66) — błąd harnessu.
for (const [m, needle] of [['ui/buildModeHud.ts', 'isAutoBuildEnabled'], ['ui/hexContextTooltip.ts', 'unlockLabelsBeyondProduction'], ['ui/empireDetailPanel.ts', 'sliderThumbCenterCss']]) {
  if (!readFileSync(join(WEB_SRC, m), 'utf8').includes(needle)) {
    console.error(`--web-dir: ${m} nie jest wersją 9b019a7d8 (brak „${needle}”)`);
    process.exit(2);
  }
}
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui3c-'));
const J = (p) => JSON.stringify(p);

// Etykiety zasobów dyplomacji czytane ze źródła webu (jak `run-repin-ui2c.mjs`: stała niewyeksportowana).
const ddSrc = readFileSync(join(WEB_SRC, 'game/diplomacy-display.ts'), 'utf8');
const rkl = ddSrc.slice(ddSrc.indexOf('const RESOURCE_KEY_LABEL'), ddSrc.indexOf('};', ddSrc.indexOf('const RESOURCE_KEY_LABEL')));
const resourceKeyLabels = {};
for (const m of rkl.matchAll(/^\s*([a-z_]+):\s*'([^']*)',/gm)) resourceKeyLabels[m[1]] = m[2];
// `labelPl` jednego źródła etykiet terenu weba (`map/terrain-names.ts` 9b019a7d8) — porównywane z tabelą portu (ZAŁOŻENIE U3C).
const terrainNamesSrc = existsSync(join(WEB_SRC, 'map/terrain-names.ts')) ? readFileSync(join(WEB_SRC, 'map/terrain-names.ts'), 'utf8') : '';
const webTerrainLabels = [...terrainNamesSrc.matchAll(/labelPl: '([^']*)'/g)].map((m) => m[1]);
const portTooltipSrc = readFileSync(join(SRC, 'ui/hexContextTooltip.ts'), 'utf8');
const tl = portTooltipSrc.slice(portTooltipSrc.indexOf('const TEREN_LABEL'), portTooltipSrc.indexOf('};', portTooltipSrc.indexOf('const TEREN_LABEL')));
const portTerrainLabels = [...tl.matchAll(/\]: '([^']*)'/g)].map((m) => m[1]);
// Stała tekstu bramki automatyzacji (port: kopia lokalna; web: `game/auto-build-gate.ts`).
const gateSrc = readFileSync(join(WEB_SRC, 'game/auto-build-gate.ts'), 'utf8');
const webHint = /AUTO_BUILD_DISABLED_HINT = '([^']*)'/.exec(gateSrc)?.[1];
const portHint = /const AUTO_BUILD_DISABLED_HINT = '([^']*)'/.exec(readFileSync(join(SRC, 'ui/buildModeHud.ts'), 'utf8'))?.[1];

/* ── „Rust”: dane i funkcje webu (kopie wzorca `run-repin-ui2c.mjs` + widok heksa 9b019a7d8) ─────────────────── */
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
import * as TI from ${W('game/terrain-improvements.ts')};
import * as EC from ${W('game/economy.ts')};
import * as RA from ${W('game/resource-access.ts')};
import * as LU from ${W('game/livestock-unlock.ts')};
import * as IB from ${W('map/improvement-build.ts')};
import * as UP from ${W('game/unit-power.ts')};
import * as UB from ${W('game/unit-building-bonuses.ts')};
import * as VT from ${W('game/veteran.ts')};
import * as DN from ${W('game/display-names.ts')};
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
    contentHash: 'harness-web-ui3c', buildings: buildingsJson, units, tech: techJson, terrainImprovements: tiJson,
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
export const fieldPower = (c: any) => UP.fieldPower({ meleeAttack: c.atakEffective, meleeDefence: c.obronaEffective, armor: c.pancerzEffective,
  health: c.hpMaxEffective, weaponDamage: c.weaponDamageEffective, piercing: c.piercingEffective, chargeBonus: c.chargeBonusEffective,
  missileAttack: c.missileAttackEffective });
export const CITIZEN_RATE = CU.CITIZEN_UPKEEP_RATE_PER_CITIZEN;
export const resourceUsageTotal = RUB.resourceUsageTotal;
export const computeMiastaSummaryRow = EMT.computeMiastaSummaryRow;
export const cityDisplayLabel = (name: string, cs: boolean) => DN.formatEntityDisplayName({ baseName: name, isCityState: cs });

// ── Widok heksa = transkrypcja \`hexContextTooltip.ts\` 9b019a7d8 (\`:246-295,330-363,385-472\`) na funkcjach weba.
const RIVER_BONUS = { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0, glina: 2, ruda: 0, ruda_zelaza: 0 };
const FOREST_BONUS = { zywnosc: -1, praca: 3, handel: -1, drewno: 3, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };
const bonusToTileYield = (b: any) => ({ zywnosc: b.zywnosc ?? 0, praca: b.praca ?? 0, handel: (b.handel ?? 0) + (b.pieniadz ?? 0), drewno: b.drewno ?? 0, kamien: b.kamien ?? 0, glina: b.glina ?? 0, ruda: 0, ruda_zelaza: 0 });
const cityYieldOnly = (y: any) => ({ zywnosc: y.zywnosc ?? 0, praca: y.praca ?? 0, handel: y.handel ?? 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 });
const impLine = (key: string, zloze: any, ye: any) => ({ key, name: TI.improvementDisplayName(key), bonus: TI.improvementBonusForKey(key, ye),
  magazyn: TI.territoryResourceYieldForImprovement(key, zloze, ye) ?? null, unlockLabels: RA.labelsForImprovementUnlock(key) });
/** Surowa sekwencja etykiet surowców (kolejność weba) — filtr stosowany osobno (\`dedup\`). */
function rawResourceLabels(hex: any, era: number, civ: any): string[] {
  const res: string[] = [];
  if (!(hex.nakladka === 'zloze_lamy' && !LU.isLamaDepositVisibleForCiv(civ))) {
    const d = RA.hexDepositDisplayLabel(hex, era); if (d) res.push(d);
    const h = RA.hexHiddenDepositHint(hex, era); if (h) res.push(h);
  }
  for (const k of TI.improvementKeysForHex(hex)) for (const u of RA.labelsForImprovementUnlock(k)) res.push(u);
  if (hex.nakladka === 'las') res.push('Las (drewno)');
  if (hex.rzeka?.obecna) res.push('Rzeka');
  return res;
}
/** Stary filtr (web 86d510c66 \`:327-338\`, małe litery) — „Rust” sprzed UI-3. */
export function dedupOld(labels: string[]): string[] {
  const out: string[] = []; const seen = new Set<string>();
  for (const l of labels) { const k = l.toLowerCase(); if (seen.has(k)) continue; seen.add(k); out.push(l); }
  return out;
}
/** Filtr 9b019a7d8 (\`:334-346\`) — transkrypcja. */
export function dedupNew(labels: string[]): string[] {
  const out: string[] = []; const seen = new Set<string>();
  const norm = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/ł/g, 'l');
  for (const label of labels) {
    const k = norm(label);
    if (seen.has(k)) continue;
    if (k === 'las (drewno)' && seen.has('drewno')) continue;
    let pref = false; for (const s of seen) if (s.startsWith(k + ' ')) pref = true;
    if (pref) continue;
    seen.add(k); out.push(label);
  }
  return out;
}
export function hexView(hex: any, era: number, civ: any, ye: any, map: any, variant: 'old' | 'new'): any {
  const keys = TI.improvementKeysForHex(hex);
  const zloze = hex.zloze;
  const fullY = EC.tileYield({ terenBazowy: hex.terenBazowy, nakladka: hex.nakladka ?? 'brak', maRzeke: !!(hex.rzeka && hex.rzeka.obecna), zloze, ulepszeniaKeys: keys, wlascicielEra: ye } as any);
  const parts: any[] = [{ label: 'teren bazowy', delta: EC.tileYield({ terenBazowy: hex.terenBazowy, nakladka: 'brak', maRzeke: false } as any) }];
  if (hex.nakladka === 'las') parts.push({ label: 'las', delta: { ...FOREST_BONUS } });
  if (hex.rzeka?.obecna) parts.push({ label: 'rzeka', delta: { ...RIVER_BONUS } });
  for (const k of keys) {
    const bonus: any = cityYieldOnly(bonusToTileYield(TI.improvementBonusForKey(k, ye)));
    if (!['zywnosc', 'praca', 'handel'].some((yk) => (bonus[yk] ?? 0) !== 0)) continue;
    parts.push({ label: TI.improvementDisplayName(k) + ' (postawione)', delta: bonus });
  }
  const raw = rawResourceLabels(hex, era, civ);
  const active = new Set(keys);
  const teren = hex.terenBazowy;
  const nak = hex.nakladka;
  const possible: any[] = [];
  for (const k of TI.IMPROVEMENT_KEYS) {
    if (active.has(k)) continue;
    if (!TI.isImprovementAllowedForCiv(k, civ)) continue;
    if (!IB.galleryTerrainEligible(k as any, teren)) continue;
    if (IB.isImprovementBlockedOnForest(k, nak)) continue;
    if (k === 'bydlo' && nak !== 'zloze_bydla') continue;
    if (k === 'owce' && nak !== 'zloze_owiec') continue;
    if (k === 'lama' && nak !== 'zloze_lamy') continue;
    if (k === 'stadnina' && !TI.hexHasHorseDeposit({ nakladka: nak, zloze } as any)) continue;
    if (k === 'farma' && !IB.isFarmBaseTerrain(teren, nak)) continue;
    if (k === 'tartak' && nak !== 'las') continue;
    if (k === 'wyrab' && nak !== 'las') continue;
    if (k === 'glinianka' && !IB.hexHasClayDeposit(hex)) continue;
    if (k === 'oboz_lowiecki' && nak !== 'las') continue;
    if (k === 'oboz_lowiecki' && !active.has('tartak')) continue;
    if (k === 'warzelnia_soli' && teren !== 'plytkie_morze' && zloze !== 'sol') continue;
    if (k === 'kopalnia_zelaza' && zloze !== 'zelazo') continue;
    if (k === 'kopalnia_miedzi' && zloze !== 'miedz' && nak !== 'zloze_rudy' && zloze !== 'ruda') continue;
    if (k === 'kopalnia_zlota' && zloze !== 'zloto') continue;
    if (k === 'kopalnia_cyny' && zloze !== 'cyna') continue;
    if (k === 'droga_brukowana' && !active.has('droga') && hex.ulepszenie !== 'droga') continue;
    // web 9b019a7d8 \`hexHasRiverAccess\` (\`:394-399\`): flaga heksa albo (z mapą) \`isHexNearRiver\`.
    if (k === 'irygacja' && !(hex.rzeka?.obecna || (map ? IB.isHexNearRiver(map, hex.coords.q, hex.coords.r) : false))) continue;
    possible.push(impLine(k, undefined, ye));
    if (possible.length >= 10) break;
  }
  return { terrainBase: String(hex.terenBazowy), resourceLabels: variant === 'old' ? dedupOld(raw) : dedupNew(raw),
    built: keys.map((k: string) => impLine(k, zloze, ye)), implicit: [], yieldParts: parts, yieldFull: fullY, possible,
    __raw: raw };
}
`;

/* ── Fikstury snapshotu panelu imperium (kształt webu) + „Rust” toV2Snap (wzorzec `run-repin-ui2c.mjs`) ─────────── */
const FIX_TS = `
import * as R from './rust-ui3c';
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
const CITIES_FX: any[] = [
  { cityId: 'c1', name: 'Roma <x>', ludki: 7, abs: 7100, rek: 600, rekMax: 900, regen: 15, zdr: 2, prawo: 1, prawoPct: 34, racje: 3.5, racjaG: 1.5,
    econ: { pieniadz: 14, pieniadzBrutto: 20, handelZeSzlakow: 6, utrzymanieBudynkow: 4, utrzymanieSurowcowBudynkow: { drewno: 1, kamien: 1 }, pracaPula: 3, pracaBudynki: 9, nauka: 6 },
    food: { produkcja: 18.4, kosztRacji: 11, bilans: 7.4, wzrostProcent: 2.6, nakarmione: true } },
  { cityId: 'c2', name: 'Ostia', ludki: 4, abs: 3900, rek: 400, rekMax: 600, regen: 9, zdr: 0, prawo: 0, prawoPct: null, racje: 2, racjaG: -0.5,
    econ: { pieniadz: -2, pieniadzBrutto: undefined, handelZeSzlakow: 0, utrzymanieBudynkow: 3, pracaPula: 1, pracaBudynki: 4, nauka: 2 },
    food: { produkcja: 5, kosztRacji: 8, bilans: -3, wzrostProcent: 1.2, nakarmione: false } },
];
/** Warianty: pelny | duze (≥ 1000 — formatManpowerCompact k/M, stawka epoki 1,5) | grossNet (pola brutto/netto HUD) | ujemne | pusty. */
export function snapFor(variant: string): any {
  const e = hudStateBase();
  const big = variant === 'duze' || variant === 'ujemne';
  if (big) Object.assign(e, { bogactwo: 20860.4, praca: 999949, naukaRate: 999, ludnosc: 999950, ludnoscRate: 1049, handelIncome: -20860 });
  if (variant === 'grossNet') Object.assign(e, { surowceBrutto: 41.6, surowceNetto: -7.4, zywnoscWplywMiast: 12.5, zywnoscRate: -3.5, naukaRate: 7 });
  if (variant === 'ujemne') Object.assign(e, { surowceBrutto: -0.4, surowceNetto: 0.4, zywnoscWplywMiast: undefined, zywnoscRate: -1001, naukaRate: -12 });
  const cities = variant === 'pusty' ? [] : CITIES_FX;
  if (variant === 'pusty') Object.assign(e, { osiedla: 0, ludnosc: 0, praca: 0.4, bogactwoWplywyBrutto: 0, bogactwoHandel: 0 });
  const K = big ? 1000 : 1;
  const adh = variant === 'duze' ? 1_250_000 : variant === 'ujemne' ? 999_950 : variant === 'pusty' ? 0 : 12345;
  const cityEcon = cities.map((c: any, i: number) => ({
    name: c.name, ...c.econ, buildingGroups: [{ grupa: 'Rolnictwo', count: 2 + i }], queue: [{ nazwa: 'Koszary', koszt: 40, postep: 12 + i }],
    queueWstrzymana: i === 1, defense: { structBonusPct: 10 * i, hasWalls: i !== 1, garnizonCount: i },
  }));
  const cityPobor = cities.map((c: any) => ({
    cityId: c.cityId, name: c.name, ludki: c.ludki * (big ? 157 : 1), ludnoscAbsLabel: (c.abs / 1000).toFixed(1).replace('.', ',') + ' tys.', ludnoscAbsolutna: c.abs * K,
    rekruci: c.rek * K, rekruciMax: c.rekMax * K, regenPerTurn: c.regen, zdrowieBuildingCount: c.zdr, prawoAdminBuildingCount: c.prawo,
    prawoPct: c.prawoPct, poziomRacji: c.racje, racjaGrowthPct: c.racjaG, massRecruitment: { options: [], queueCount: 0, waterAccess: true },
  }));
  const routes = cities.length === 0 ? [] : [
    { id: 'r1', cityId: 'c1', cityName: 'Roma <x>', partnerCityName: 'Kartago', partnerOwnerLabel: 'Kartagina', medium: 'morze', dystans: 9, income: 11 * K, budynekOdblokowany: true, premiaBudynku: 2 },
  ];
  const rate = variant === 'duze' ? { citizenRatePerCitizen: 1.5 } : variant === 'ujemne' ? { citizenRatePerCitizen: 2.25 } : {};
  const resources = cities.length === 0 ? [] : [
    { id: 'drewno', icon: '🪵', label: 'Drewno', stock: 40 * K, ratePerTurn: 3 * K, rateProductionPerTurn: 5, typ: 'surowy', dostep: true, cap: 1200 * K, capBase: 1000, capBonusPerMagazyn: 100,
      citizenRequired: true, citizenCovered: true, ...rate, usage: { buildings: 2 * K, citizens: 14 * K, units: 1 } },
    { id: 'kamien', icon: '🪨', label: 'Kamień', stock: 0, ratePerTurn: -2 * K, typ: 'surowy', dostep: true, cap: 1200, capBase: 1000, capBonusPerMagazyn: 100,
      citizenRequired: true, citizenCovered: false, ...rate, usage: { buildings: 1, citizens: 0, units: 0 } },
    { id: 'zywnosc', icon: '🌾', label: 'Żywność', stock: 55, ratePerTurn: 3, typ: 'podstawowy', dostep: true },
  ];
  return {
    global: { civName: 'Rzym <x>', civEmoji: '🏛', civPortraitUrl: null, styl: 'Militarny', jednostkaSpec: 'Legion', bonusStartowy: '',
      religiaPanstwowa: 'Jowisz', bonusy: [{ opis: 'Bonus A <b>', realizuje: 'silnik' }], uchwaly: undefined },
    economy: e,
    kultura: cities.length === 0
      ? { total: 0, rate: 0, thresholds: [], nextThreshold: null, pctToNext: null, happinessNote: 'Brak <x>', cities: [] }
      : { total: 50, rate: 3, thresholds: [10, 30, 60, 100], nextThreshold: 60, pctToNext: 70, happinessNote: 'Nota <x>', cities: [{ name: 'Roma <x>', kultura: 42, borderRadius: 2 }] },
    power: {
      power: 3020 * K, powerBase: 2800.6,
      components: [{ key: 'ludnosc', label: 'Ludność', rawCount: 14 * K + 0.4, weightPct: 30, normalized: 0.5, points: 900, sharePct: 30, formulaNote: 'x <b>' }],
      ranking: [{ civ: 'Rzym', power: 3020, powerMilitary: 1500, powerEconomic: 1520, rank: 1, isPlayer: true, wiarygodnosc: 12 }],
      respektExample: undefined, absoluteRank: { rank: 1, total: 1 },
      ludnoscLudki: 14, ludnoscAbsLabel: '14 tys.', rekruci: 1200 * K, rekruciLabel: '1,2 tys.', rekrutEkw: 3, rekruciMax: 2000 * K,
      rekruciMaxLabel: '2 tys.', unitsOnMap: 4, kosztJednostki: 400,
    },
    cityEcon, cityPobor,
    massRecruitment: { ownerId: 0, treasury: 500 * K + 0.4, manpower: 1200 * K, stock: { drewno: 10 * K }, queuedCount: 0, completedCount: 0 },
    resources,
    trade: {
      totalIncome: variant === 'ujemne' ? -24 : 24 * K, routes,
      activeDeals: cities.length === 0 ? [] : [{ partnerLabel: 'Kartagina', partnerOwnerId: 2, turnsLeft: 5, trustPerTurn: 1, hasActiveRoute: true }],
      daninaLabel: 'Podatek', wonderBonusLadPct: 10, wonderBonusMorzePct: 0, resourceGrants: [],
    },
    food: {
      zapasy: 55, maxCap: variant === 'pusty' ? 0 : 200, glodWojska: variant === 'ujemne',
      tick: variant === 'pusty' ? undefined : { uprawaHodowla: 30, wyzwienieLudnosci: 20, nadwyzka: 10, pomocMiastom: 3, spichlerzStolicy: 2, wojsko: 4, przyrostZapasow: 3 },
      perCityRows: cities.map((c: any) => ({ cityId: c.cityId, name: c.name, ...c.food })),
    },
    research: variant === 'pusty' ? null : { targetLabel: 'Pismo <x>', kosztCelu: 120, pula: 33, postepFraction: 0.27, turnsLeft: 6 },
    religion: {
      stateReligionLabel: 'Jowisz', totalAdherents: adh, ownSharePct: 70, foreignSharePct: 30, foreignLabel: variant === 'pusty' ? null : 'Ozyrys',
      faithRatePerTurn: 2, zadowolenieBonus: 1, templeCount: 2,
      cities: cities.length === 0 ? [] : [{ name: 'Roma <x>', religionLabel: 'Jowisz', isOwn: true, adherents: adh - 345 }, { name: 'Ostia', religionLabel: '—', isOwn: false, adherents: 999 }],
    },
    happiness: cities.length === 0 ? { sources: [], totalNetto: 0, hasData: false }
      : { sources: [{ id: 'bud', label: 'Budynki', value: 3.5 }], totalNetto: 1.5, hasData: true },
    armiaProdukcja: [],
  };
}
/** „Rust”: pola v2 liczone jak web (kopia \`toV2Snap\` z \`run-repin-ui2c.mjs\`). */
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
  writeFileSync(join(TMP, 'rust-ui3c.ts'), RUST_TS);
  writeFileSync(join(TMP, 'fix-ui3c.ts'), FIX_TS);
  const ui = (dir, m) => J(join(dir, m));
  writeFileSync(join(TMP, 'entry-web.ts'), [
    `import * as R from './rust-ui3c';`,
    `import * as F from './fix-ui3c';`,
    `(globalThis as any).__boot = async () => {`,
    `  const [HX, BM, EMP] = await Promise.all([import(${ui(WEB_SRC, 'ui/hexContextTooltip.ts')}), import(${ui(WEB_SRC, 'ui/buildModeHud.ts')}), import(${ui(WEB_SRC, 'ui/empireDetailPanel.ts')})]);`,
    `  (globalThis as any).__ui3c = { side: 'web', HX, BM, EMP, R, F, snapOf: (v: string) => F.snapFor(v) };`,
    `};`, '',
  ].join('\n'));
  writeFileSync(join(TMP, 'entry-port.ts'), [
    `import * as R from './rust-ui3c';`,
    `import * as F from './fix-ui3c';`,
    `import { installStaticCatalog } from ${J(join(SRC, 'controller/staticCatalog'))};`,
    `import { installEmpireQueries } from ${J(join(SRC, 'controller/empireQueries'))};`,
    `import { installPerfDiagnostics } from ${J(join(SRC, 'controller/diagnostics'))};`,
    `(globalThis as any).__boot = async () => {`,
    `  const cat = R.catalog();`,
    `  installStaticCatalog(cat); installEmpireQueries(R.empireQueries as any); installPerfDiagnostics(R.diag() as any);`,
    `  const [HX, BM, EMP] = await Promise.all([import(${ui(SRC, 'ui/hexContextTooltip.ts')}), import(${ui(SRC, 'ui/buildModeHud.ts')}), import(${ui(SRC, 'ui/empireDetailPanel.ts')})]);`,
    `  (globalThis as any).__ui3c = { side: 'port', HX, BM, EMP, R, F, cat, snapOf: (v: string) => F.toV2Snap(F.snapFor(v)) };`,
    `};`, '',
  ].join('\n'));
}

/* ── Przypadki (wspólne wejście obu stron) ───────────────────────────────────────────────────────────────────── */
const ERAS = [undefined, 1, 3];
const HEXES = [];
const TERR = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'pustynia', 'polarny'];
const OVER = ['brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_owiec', 'zloze_bydla', 'zloze_lamy'];
for (const t of TERR) for (const o of OVER) HEXES.push([`${t}/${o}`, { coords: { q: 2, r: -1 }, terenBazowy: t, nakladka: o, ulepszenie: 'brak' }]);
const BUILT = [
  ['tartak', 'laka', 'las', undefined], ['tartak', 'wzgorza', 'las', undefined], ['kamieniolom', 'gory', 'brak', undefined],
  ['kopalnia_zelaza', 'gory', 'brak', 'zelazo'], ['kopalnia_miedzi', 'wzgorza', 'zloze_rudy', 'ruda'], ['kopalnia_miedzi', 'gory', 'zloze_rudy', 'miedz'],
  ['kopalnia_zlota', 'gory', 'brak', 'zloto'], ['kopalnia_cyny', 'gory', 'brak', 'cyna'], ['glinianka', 'laka', 'zloze_gliny', 'glina'],
  ['warzelnia_soli', 'plytkie_morze', 'brak', 'sol'], ['farma', 'laka', 'brak', undefined], ['stadnina', 'laka', 'zloze_konia', undefined],
  ['stadnina', 'laka', 'brak', 'konie'], ['bydlo', 'laka', 'zloze_bydla', undefined], ['oboz_lowiecki', 'laka', 'las', undefined],
  ['wyrab', 'laka', 'las', undefined], ['droga', 'laka', 'brak', undefined], ['irygacja', 'laka', 'brak', undefined],
];
for (const [k, t, o, z] of BUILT) {
  HEXES.push([`imp:${k}@${t}/${o}${z ? '/' + z : ''}`, { coords: { q: 1, r: 1 }, terenBazowy: t, nakladka: o, ulepszenia: [k], zloze: z, rzeka: k === 'irygacja' ? { obecna: true } : undefined }]);
}
HEXES.push(['multi:tartak+oboz', { coords: { q: 5, r: 5 }, terenBazowy: 'laka', nakladka: 'las', ulepszenia: ['tartak', 'oboz_lowiecki'] }]);
HEXES.push(['multi:tartak+rzeka', { coords: { q: 5, r: 6 }, terenBazowy: 'wzgorza', nakladka: 'las', ulepszenia: ['tartak'], rzeka: { obecna: true } }]);
HEXES.push(['multi:kamieniolom+droga', { coords: { q: 6, r: 5 }, terenBazowy: 'gory', nakladka: 'brak', ulepszenia: ['kamieniolom', 'droga'] }]);
for (const z of ['sol', 'zelazo', 'miedz', 'zloto', 'cyna', 'glina', 'kamien', 'konie', 'ruda']) HEXES.push([`zloze:${z}@gory`, { coords: { q: 3, r: 3 }, terenBazowy: 'gory', nakladka: 'brak', zloze: z }]);
for (const z of ['konie', 'Konie ', 'kon']) HEXES.push([`zloze:${z}@laka`, { coords: { q: 4, r: 3 }, terenBazowy: 'laka', nakladka: 'brak', zloze: z }]);
HEXES.push(['ruda+miedz@wzgorza', { coords: { q: 3, r: 4 }, terenBazowy: 'wzgorza', nakladka: 'zloze_rudy', zloze: 'miedz' }]);
// Rzeka u sąsiada (mapa): irygacja możliwa tylko przez `isHexNearRiver` (riverPaths / `rzeka.obecna` sąsiada).
const MAP_PATH = { riverPaths: [[{ q: 10, r: 10 }, { q: 11, r: 10 }]], hexes: { '9,12': { rzeka: { obecna: true } } } };
for (const [n, c] of [['przy-sciezce', { q: 10, r: 11 }], ['na-sciezce', { q: 11, r: 10 }], ['sasiad-flaga', { q: 9, r: 11 }], ['daleko', { q: 20, r: 20 }]]) {
  HEXES.push([`mapa:${n}`, { coords: c, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak' }, MAP_PATH]);
}
const CITY = [{}, { cityName: 'Ateny <x>', cityIsCityState: false, cityOwnerLabel: 'Grecy', cityPopulation: 7.6 }, { cityName: 'Sparta', cityIsCityState: true }];
const HEX_CASES = [];
let hi = 0;
for (const [name, hex, map] of HEXES) {
  for (const era of ERAS) {
    HEX_CASES.push({ name: `${name}/era${era}`, hex, map: map ?? null, era, civ: hi % 7 === 0 ? 'inkowie' : 'grecy', worked: hi % 2 === 0, city: CITY[hi % 3] });
    hi++;
  }
}
const C = (id, name, extra = {}) => ({ id, name, icon: '', hp: 7.6, hpMax: 10, ruchLeft: 1, ruchMax: 2, active: false, ...extra });
const STACKS = [
  ['gen-środek', [C('u1', 'Hoplita', { active: true }), C('u2', 'Zwiadowca'), C('g<1>', 'Rydwan & co', { commanderTitle: 'Generał' }), C('u3', 'Łucznik'), C('w1', 'Wojownik', { commanderTitle: 'Wódz' })]],
  ['picked-część', [C('u1', 'Hoplita', { picked: true }), C('u2', 'Osadnik', { picked: false }), C('w1', 'Wojownik', { commanderTitle: 'Wódz', active: true }), C('u3', 'Robotnik', { picked: true })]],
  ['picked-wszystkie', [C('a', 'Hoplita', { picked: true }), C('b', 'Łucznik <x>', { picked: true, active: true })]],
  ['cywile', [C('u0', 'Osadnik'), C('u1', 'Robotnik'), C('u2', 'Zwiadowca', { active: true }), C('u3', 'Włócznik'), C('u4', 'zwiadowca')]],
  ['dowódca-zwiadowca', [C('z', 'Zwiadowca', { commanderTitle: 'Generał' }), C('h', 'Hoplita', { active: true }), C('y', 'Zwiadowca')]],
  ['nieznany-tytuł', [C('k', 'Hoplita', { commanderTitle: 'Król' }), C('e', 'Łucznik', { commanderTitle: '', active: true })]],
  ['solo', [C('s', 'Hoplita', { active: true, picked: true })]],
  ['duży', Array.from({ length: 14 }, (_, i) => C('d' + i, ['Wojownik', 'Zwiadowca', 'Łucznik', 'Osadnik'][i % 4], { active: i === 3, picked: i % 3 === 0, ...(i === 9 ? { commanderTitle: 'Generał' } : {}) }))],
];
const UNIT_CASES = STACKS.map(([n, cards], k) => [n, { displayName: `Armia (${cards.length})`, q: 2, r: 2, ruchLeft: 1, ruchMax: 2, stackCards: cards, k: k % 4 }]);
const BM_WARN = [['brak-hooka', '__none__'], ['null', null], ['jedno', { waitingHexes: 1 }], ['dużo', { waitingHexes: 37 }]];
const BM_EMP = [['auto', { focus: 'zrownowazone', tryb: 'auto', onlyWorked: true, pracaAutoPercent: 40, wolnoWycinacLas: true }],
  ['ręczny', { focus: 'zywnosc', tryb: 'reczny', onlyWorked: false, pracaAutoPercent: 0, wolnoWycinacLas: false }],
  ['auto-surowce', { focus: 'surowce', tryb: 'auto', onlyWorked: false, pracaAutoPercent: 75, wolnoWycinacLas: true }]];
// `undefined` nie przeżywa JSON (→ null) — brak haka = wartownik `__none__` (zmierzone: mutacja B2 przeżywała z `undefined`).
const BM_AUTO = [['brak-hooka', '__none__'], ['null', null], ['wł', true], ['wył', false]];
const BM_CITY = [['bez-miasta', null], ['miasto-własne', { override: true, tryb: 'auto' }], ['miasto-państwo', { override: false, tryb: 'reczny' }]];
const EMP_VARIANTS = ['pelny', 'duze', 'grossNet', 'ujemne', 'pusty'];
const EMP_SECTIONS = [undefined, 'econ-skarbiec', 'econ-praca', 'econ-nauka', 'spichlerz', 'surowce', 'handel', 'econ-religia', 'econ-obywatele', 'econ-miasto'];
const INPUT = { HEX_CASES, UNIT_CASES, BM_WARN, BM_EMP, BM_AUTO, BM_CITY, EMP_VARIANTS, EMP_SECTIONS, KINDS: [...KINDS] };

/** Teksty/klasy nowych hunków 9b019a7d8 — muszą wystąpić w wynikach web. */
const MARKERS = [
  'sp-unit-pick-bar', 'data-act="pick-all"', 'data-act="pick-none"', 'Zaznaczono 2 z 4', 'Zaznacz do rozwiązania (5)', 'sp-unit-stack-card on picked',
  'role="checkbox"', 'aria-checked="true"', '.sp-unit-pick.on::after', 'data-auto-build-locked="1"', 'Włącz automatyzację budowy w Ustawieniach',
  'żywność powstaje tylko na polach z obywatelami', 'civ-emp-grossnet', 'netto <b class="neg">', 'netto <b class="pos">', 'calc(50% + 0px)',
  'mnożnik epoki ×', '1,3M', 'Konie',
];
/** Teksty usunięte w 9b019a7d8 — nie mogą wystąpić w wynikach web. */
const GONE = ['data-ulepszenia-empire-only-worked', 'data-ulepszenia-empire-wyrab', 'data-ulepszenia-city-only-worked', 'data-ulepszenia-city-wyrab',
  'data-ulepszenia-unspent-disable-filter', 'Wolno wycinać las', '· tylko 👤', 'Wyłącz filtr, by go wydać'];

/* ── Kod przeglądarki ──────────────────────────────────────────────────────────────────────────────────────── */
const EVAL = async ([inputStr, variant]) => {
  const I = JSON.parse(inputStr);
  const K = new Set(I.KINDS);
  const G = globalThis.__ui3c;
  const { HX, BM, EMP, R } = G;
  const port = G.side === 'port';
  const out = {};
  const info = {};
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const parsed = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.innerHTML; };
  const safe = (f) => { try { return f(); } catch (e) { return 'THROW:' + String(e && e.message); } };
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const combat = (k) => ({ atakBase: 4, atakEffective: 4 + k, obronaBase: 6, obronaEffective: 6 - k / 2, hpMaxBase: 10, hpMaxEffective: 10 + k,
    pancerzBase: 1, pancerzEffective: 1 + k * 1.25, weaponDamageBase: 2, weaponDamageEffective: 2 + k, piercingBase: 1, piercingEffective: 1,
    chargeBonusBase: 3, chargeBonusEffective: 3 + k * 2, missileAttackBase: 0, missileAttackEffective: k > 2 ? 5 : 0 });
  // 1. Tooltip heksa.
  if (K.has('hex')) {
    out.hex = [];
    info.unlockFiltered = 0;
    info.resDedup = 0;
    for (const c of I.HEX_CASES) {
      const base = { q: c.hex.coords.q, r: c.hex.coords.r, esc, hexWorkedForMagazyn: c.worked, ...c.city };
      if (!port) {
        out.hex.push(safe(() => parsed(HX.buildHexContextTooltipHtml({ ...base, hex: c.hex, map: c.map ?? undefined, currentEra: c.era ?? undefined, playerCivType: c.civ }))));
        const v = R.hexView(c.hex, c.era ?? 99, c.civ, c.era ?? undefined, c.map ?? undefined, 'old');
        if (R.dedupNew(v.__raw).length < R.dedupOld(v.__raw).length) info.resDedup++;
        for (const b of v.built) {
          if (b.magazyn && b.magazyn.amount > 0 && b.unlockLabels.length) {
            const h = HX.buildHexContextTooltipHtml({ ...base, hex: c.hex, map: c.map ?? undefined, currentEra: c.era ?? undefined, playerCivType: c.civ });
            if (!h.includes('odblok.') || b.unlockLabels.some((u) => !h.includes(u))) info.unlockFiltered++;
          }
        }
      } else {
        delete base.cityIsCityState;
        const v = R.hexView(c.hex, c.era ?? 99, c.civ, c.era ?? undefined, c.map ?? undefined, variant);
        delete v.__raw;
        const label = c.city.cityName ? R.cityDisplayLabel(c.city.cityName, c.city.cityIsCityState) : null;
        out.hex.push(safe(() => parsed(HX.buildHexContextTooltipHtml({ ...base, view: v, cityDisplayLabel: label }))));
      }
    }
  }
  // 2. Karta jednostki (stos).
  if (K.has('unit')) {
    out.unit = [];
    for (const [, u] of I.UNIT_CASES) for (const expanded of [false, true]) {
      const cb = combat(u.k);
      const b = { ...u, combat: cb, expanded, esc };
      delete b.k;
      out.unit.push(safe(() => parsed(HX.buildUnitContextTooltipHtml(port ? { ...b, fieldPower: R.fieldPower(cb), badges: R.badges(b) } : b))));
    }
    out.unitCss = [HX.UNIT_CONTEXT_PANEL_CSS];
  }
  // ASSERT (port, ZAŁOŻENIE U3C-Z2): syntetyczne listy etykiet surowców (kolizje niewystępujące w danych weba: ł/l, diakrytyki,
  // prefiks, „Las (drewno)”) — port z surową listą = port z listą po transkrypcji filtra 9b019a7d8 (`dedupNew`, `:334-346`).
  if (port && K.has('hex')) {
    info.synth = [];
    const SYN = [['Złoto', 'Zloto'], ['Sól', 'Sol', 'SÓL'], ['Ruda miedzi', 'Ruda'], ['Ruda', 'Ruda miedzi'], ['Drewno', 'Las (drewno)'], ['Las (drewno)', 'Drewno'],
      ['Łąka', 'Laka', 'łąka '], ['Glina', 'Glinianka', 'Glin'], ['Koń', 'Kon', 'Konie'], []];
    const v0 = R.hexView(I.HEX_CASES[0].hex, 99, 'grecy', undefined, undefined, 'old');
    delete v0.__raw;
    for (const syn of SYN) {
      const a = parsed(HX.buildHexContextTooltipHtml({ q: 0, r: 0, esc, view: { ...v0, resourceLabels: syn } }));
      const b = parsed(HX.buildHexContextTooltipHtml({ q: 0, r: 0, esc, view: { ...v0, resourceLabels: R.dedupNew(syn) } }));
      info.synth.push([syn.join('|') + ' → ' + R.dedupNew(syn).join('|'), a === b]);
    }
  }
  // 3. HUD budowy.
  if (K.has('bm')) {
    out.bm = [];
    const TYPES = [
      { key: 'farma', label: 'Farma', kosztPraca: 20, epoka: 1, typ: 'ulepszenie', techUnlocked: true },
      { key: 'tartak', label: 'Tartak', kosztPraca: 45, epoka: 1, techUnlocked: true },
      { key: 'kopalnia_miedzi', label: 'Kopalnia miedzi', kosztPraca: 60, epoka: 2, techId: 'brazownictwo', techUnlocked: false, techLabel: 'Brązownictwo', lockHint: 'Wymaga «Brązownictwo»' },
    ];
    for (const [wn, warn] of I.BM_WARN) for (const [en, emp] of I.BM_EMP) for (const [an, auto] of I.BM_AUTO) for (const [cn, city] of I.BM_CITY) {
      if (cn !== 'bez-miasta' && wn !== 'jedno') continue;
      const log = [];
      const act = (n) => (...a) => log.push('LOG:' + n + ':' + JSON.stringify(a));
      const pool = 40;
      let cityId = city ? 'c1' : null;
      const o = { listTypes: () => TYPES.map((t) => (port ? { ...t, affordable: !(t.kosztPraca > pool) } : { ...t })), getActiveKey: () => 'farma',
        onSelectType: act('onSelectType'), onExit: act('onExit'), isOpen: () => true, getPracaPool: () => pool,
        listPlayerCities: () => [{ id: 'c1', name: 'Ateny' }, { id: 'c2', name: 'Sparta <x>' }], getUlepszeniaCityId: () => cityId,
        onUlepszeniaCityIdChange: (id) => { cityId = id; act('onUlepszeniaCityIdChange')(id); },
        getUlepszeniaEmpireState: () => emp, onUlepszeniaEmpireFocusChange: act('onUlepszeniaEmpireFocusChange'), onUlepszeniaEmpireTrybChange: act('onUlepszeniaEmpireTrybChange'),
        onUlepszeniaEmpireOnlyWorkedChange: act('onUlepszeniaEmpireOnlyWorkedChange'), onUlepszeniaEmpireWyrabChange: act('onUlepszeniaEmpireWyrabChange'),
        onUlepszeniaEmpirePracaPercentChange: act('onUlepszeniaEmpirePracaPercentChange'), getUlepszeniaCityOverride: () => !!city?.override,
        onUlepszeniaCityOverrideChange: act('onUlepszeniaCityOverrideChange'),
        getUlepszeniaEffectiveState: () => (city ? { focus: emp.focus, tryb: city.tryb, onlyWorked: true, pracaAutoPercent: 55, wolnoWycinacLas: true, override: city.override } : null),
        onUlepszeniaCityFocusChange: act('onUlepszeniaCityFocusChange'), onUlepszeniaCityTrybChange: act('onUlepszeniaCityTrybChange'),
        onUlepszeniaCityOnlyWorkedChange: act('onUlepszeniaCityOnlyWorkedChange'), onUlepszeniaCityWyrabChange: act('onUlepszeniaCityWyrabChange'),
        onUlepszeniaCityPracaPercentChange: act('onUlepszeniaCityPracaPercentChange'), onUnspentBudgetDisableFilter: act('onUnspentBudgetDisableFilter') };
      if (warn !== '__none__') o.getUnspentBudgetWarning = () => warn;
      if (auto !== '__none__') o.isAutoBuildEnabled = () => auto;
      const api = BM.createBuildModeHud(o);
      document.body.append(api.el, api.bannerEl);
      api.update();
      const before = api.el.outerHTML;
      // Kliknięcia wszystkich przycisków bloku automatu (po kolei, z ponownym wyszukaniem po każdym renderze).
      const sels = [...new Set([...api.el.querySelectorAll('.civ-build-auto button, .civ-build-auto [data-ulepszenia-unspent] button')].map((b) => [...b.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}${a.value ? `="${a.value}"` : ''}]`).join('')))].filter(Boolean);
      for (const s of sels) api.el.querySelector(s)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      for (const r of api.el.querySelectorAll('input[type=range]')) { r.value = '25'; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); }
      out.bm.push(`bm(${wn},${en},${an},${cn})\n${before}\n--po kliknięciach (${sels.length})--\n${api.el.outerHTML}\n${log.join('\n')}`);
      api.destroy();
    }
  }
  // 4. Panel imperium.
  if (K.has('emp')) {
    out.emp = [];
    const log = [];
    const act = (n) => (...a) => log.push(n + '(' + JSON.stringify(a) + ')');
    for (const v of I.EMP_VARIANTS) {
      const snap = G.snapOf(v);
      for (const sec of I.EMP_SECTIONS) {
        if (v === 'pusty' && ![undefined, 'econ-skarbiec', 'surowce', 'spichlerz'].includes(sec)) continue;
        log.length = 0;
        EMP.configureEmpireHandelSplit({ getOwnerDefault: () => ({ procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 }),
          onOwnerDefaultChange: act('onOwnerDefaultChange'), getDaninaLabel: () => 'Podatek', getActiveOwnerId: () => 0 });
        EMP.configureEmpireGlobalDefaults({ getOwnerDefaultPodzialPracy: () => ({ procentBudynki: 70 }), onOwnerDefaultPodzialPracyChange: act('onPodzial'),
          getOwnerDefaultPoziomRacji: () => 3.5, onOwnerDefaultPoziomRacjiChange: act('onRacje'), onOwnerSetAutoWyzywienieForAll: act('onAutoWyz'),
          getActiveOwnerId: () => 0 });
        safe(() => { EMP.mountEmpireDetailPanel(() => snap); EMP.showEmpireDetailPanel(sec); });
        await tick();
        const panel = document.querySelector('.civ-emp-panel') ?? document.body;
        const parts = [];
        // Suwaki: `input` (podgląd: wypełnienie toru, sąsiednie suwaki Skarbca) → zapis `style.background` wszystkich suwaków.
        const ranges = [...panel.querySelectorAll('input[type=range]')];
        const bg = () => [...panel.querySelectorAll('input[type=range]')].map((r) => (r.dataset.handelKey ?? r.className) + '=' + r.value + ':' + r.style.background).join('\n');
        parts.push('ranges=' + ranges.length + '\n' + bg());
        for (const [i, r] of ranges.entries()) {
          for (const val of [String(Number(r.min || 0)), String(Number(r.max || 100)), String(Math.round((Number(r.min || 0) + Number(r.max || 100)) / 3) + i)]) {
            const cur = [...panel.querySelectorAll('input[type=range]')][i];
            if (!cur) break;
            cur.value = val;
            cur.dispatchEvent(new Event('input', { bubbles: true }));
            parts.push('input#' + i + '=' + val + '\n' + bg());
          }
        }
        out.emp.push(`${v}/${sec ?? 'all'}\n${panel.outerHTML}\n${parts.join('\n')}\n${log.join('\n')}`);
        safe(() => EMP.hideEmpireDetailPanel());
      }
    }
  }
  return { out, info };
};

/** Sceny PNG (te same dane po obu stronach). */
const SCENES = [['hex+unit', 'hex'], ['buildModeHud-wył', 'bm'], ['buildModeHud-wł', 'bm'], ['empire-skarbiec', 'emp'], ['empire-surowce', 'emp'], ['empire-spichlerz', 'emp']];
const VIEWPORTS = [[1280, 720], [360, 640]];
const SCENE = async ([scene, inputStr]) => {
  const I = JSON.parse(inputStr);
  const G = globalThis.__ui3c;
  const { HX, BM, EMP, R } = G;
  const port = G.side === 'port';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  try { EMP.hideEmpireDetailPanel(); } catch { /* brak */ }
  // Panel imperium (`root`/`backdrop` modułu) zostaje w DOM — moduł tworzy go raz (`ensureDom`); reszta scen usuwana.
  for (const e of [...document.body.children]) if (e.id !== 'host' && e.tagName !== 'SCRIPT' && !/civ-emp-(panel|backdrop)/.test(e.className)) e.remove();
  const h = document.getElementById('host');
  h.innerHTML = '';
  if (scene === 'hex+unit') {
    const st = document.createElement('style');
    st.textContent = HX.UNIT_CONTEXT_PANEL_CSS + '\n.cp-sub,.cp-yield-head,.cp-total{font:12px sans-serif;color:#eee}#host{background:#141820;color:#eee;padding:8px}';
    h.appendChild(st);
    const u = { ...I.UNIT_CASES[1][1], combat: { atakBase: 4, atakEffective: 5, obronaBase: 6, obronaEffective: 5, hpMaxBase: 10, hpMaxEffective: 11, pancerzBase: 1, pancerzEffective: 2,
      weaponDamageBase: 2, weaponDamageEffective: 2, piercingBase: 0, piercingEffective: 1, chargeBonusBase: 0, chargeBonusEffective: 0, missileAttackBase: 0, missileAttackEffective: 1 }, expanded: true, esc };
    delete u.k;
    const d = document.createElement('div');
    d.className = 'sp-ctx';
    d.innerHTML = HX.buildUnitContextTooltipHtml(port ? { ...u, fieldPower: R.fieldPower(u.combat), badges: R.badges(u) } : u);
    h.appendChild(d);
    const c = I.HEX_CASES.find((x) => x.name.startsWith('multi:tartak+rzeka'));
    const base = { q: c.hex.coords.q, r: c.hex.coords.r, esc, hexWorkedForMagazyn: true, ...c.city };
    const d2 = document.createElement('div');
    if (!port) d2.innerHTML = HX.buildHexContextTooltipHtml({ ...base, hex: c.hex, currentEra: c.era ?? undefined, playerCivType: c.civ });
    else {
      delete base.cityIsCityState;
      const v = R.hexView(c.hex, c.era ?? 99, c.civ, c.era ?? undefined, undefined, 'old');
      delete v.__raw;
      d2.innerHTML = HX.buildHexContextTooltipHtml({ ...base, view: v, cityDisplayLabel: c.city.cityName ? R.cityDisplayLabel(c.city.cityName, c.city.cityIsCityState) : null });
    }
    h.appendChild(d2);
  } else if (scene.startsWith('buildModeHud')) {
    const on = scene.endsWith('wł');
    const types = [{ key: 'farma', label: 'Farma', kosztPraca: 20, epoka: 1, typ: 'ulepszenie', techUnlocked: true }];
    const api = BM.createBuildModeHud({ listTypes: () => types.map((t) => (port ? { ...t, affordable: true } : t)), getActiveKey: () => 'farma', onSelectType() {}, onExit() {},
      isOpen: () => true, getPracaPool: () => 40, listPlayerCities: () => [{ id: 'c1', name: 'Ateny' }], getUlepszeniaCityId: () => 'c1', onUlepszeniaCityIdChange() {},
      getUlepszeniaEmpireState: () => I.BM_EMP[0][1], getUlepszeniaCityOverride: () => true, getUnspentBudgetWarning: () => ({ waitingHexes: 12 }),
      getUlepszeniaEffectiveState: () => ({ focus: 'zrownowazone', tryb: 'auto', onlyWorked: true, pracaAutoPercent: 55, wolnoWycinacLas: true, override: true }),
      isAutoBuildEnabled: () => on });
    document.body.append(api.el, api.bannerEl);
    api.update();
  } else {
    const sec = { 'empire-skarbiec': 'econ-skarbiec', 'empire-surowce': 'surowce', 'empire-spichlerz': 'spichlerz' }[scene];
    EMP.configureEmpireHandelSplit({ getOwnerDefault: () => ({ procentPieniadz: 40, procentNauka: 50, procentLuksus: 10 }), onOwnerDefaultChange() {}, getDaninaLabel: () => 'Podatek', getActiveOwnerId: () => 0 });
    EMP.configureEmpireGlobalDefaults({ getOwnerDefaultPodzialPracy: () => ({ procentBudynki: 70 }), onOwnerDefaultPodzialPracyChange() {}, getOwnerDefaultPoziomRacji: () => 3.5,
      onOwnerDefaultPoziomRacjiChange() {}, onOwnerSetAutoWyzywienieForAll() {}, getActiveOwnerId: () => 0 });
    const snap = G.snapOf('grossNet');
    EMP.mountEmpireDetailPanel(() => snap);
    EMP.showEmpireDetailPanel(sec);
  }
  await new Promise((r) => setTimeout(r, 0));
  // Panel: przewiń do pierwszego nowego bloku (suwak / „Brutto → netto”) na CAŁKOWITĄ pozycję (wzorzec `run-repin-ui2c`).
  const tEl = scene.startsWith('empire') ? document.querySelector(scene === 'empire-skarbiec' ? '.civ-emp-panel input[type=range]' : '.civ-emp-panel .civ-emp-grossnet') : null;
  if (tEl) {
    let sc = tEl.parentElement;
    while (sc && !(sc.scrollHeight > sc.clientHeight && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    if (sc) sc.scrollTop = Math.max(0, Math.floor(tEl.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 120));
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 450));
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  return true;
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
const INIT = () => {
  const FIXED = Date.UTC(2026, 10, 7, 10, 30, 15);
  const RD = Date;
  class FD extends RD { constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); } static now() { return FIXED; } }
  globalThis.Date = FD;
  let s = 12345;
  Math.random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
};

let exitCode = 0;
let browser = null;
const servers = [];
try {
  writeEntries();
  const sides = {};
  for (const side of ['web', 'port']) {
    const outdir = join(TMP, 'out-' + side);
    await bundle([join(TMP, `entry-${side}.ts`), join(TMP, 'fix-ui3c.ts')], outdir);
    const entryJs = readdirSync(outdir, { recursive: true }).map(String).find((f) => f.split('/').pop() === `entry-${side}.js`);
    if (!entryJs) throw new Error(`${side}: brak entry-${side}.js w ${outdir}`);
    writeFileSync(join(outdir, 'index.html'), `<!doctype html><html lang="pl"><meta charset="utf-8"><link rel="icon" href="data:,"><body style="margin:0;background:#0b0f16"><div id="host" style="width:100%"></div><script type="module" src="./${entryJs}"></script>`);
    sides[side] = outdir;
  }
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu', '--num-raster-threads=1', '--disable-partial-raster', '--disable-lcd-text'] });
  const errs = [];
  const res = {};
  for (const side of ['web', 'port']) {
    const srv = await serve(sides[side]);
    servers.push(srv);
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await page.addInitScript(INIT);
    page.on('pageerror', (e) => errs.push(`${side}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(`${side}: ${m.text()}`); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
    await page.waitForFunction(() => typeof globalThis.__boot === 'function', null, { timeout: 120000 });
    await page.evaluate(() => globalThis.__boot());
    const r = { vec: {}, png: {} };
    if (side === 'web') {
      const w = await page.evaluate(EVAL, [JSON.stringify(INPUT), 'web']);
      r.vec = w.out;
      r.info = w.info;
    } else {
      // Port × 2 warianty „Rust” etykiet surowców (stary filtr / filtr 9b019a7d8) — oba muszą dać wynik webu.
      const a = await page.evaluate(EVAL, [JSON.stringify(INPUT), 'old']);
      r.vec = a.out;
      r.synth = a.info.synth ?? [];
      if (KINDS.has('hex')) {
        const b = await page.evaluate(EVAL, [JSON.stringify({ ...INPUT, KINDS: ['hex'] }), 'new']);
        r.vec.hexNewDedup = b.out.hex;
      }
    }
    if (KINDS.has('pix')) {
      for (const [sc, kind] of SCENES) {
        if (!KINDS.has(kind)) continue;
        for (const [w, h] of VIEWPORTS) {
          // Każda scena na ŚWIEŻEJ stronie w docelowym oknie: zrzut nie zależy od poprzedniej sceny (zmierzone: scena HUD budowy
          // po scenie heksa na tej samej stronie różniła się o kilka bajtów PNG między stronami web/port — antyaliasing po
          // przebudowie warstw), ten sam stan startowy po obu stronach.
          const sp = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
          await sp.addInitScript(INIT);
          sp.on('pageerror', (e) => errs.push(`${side}/pix: ${e.message}`));
          sp.on('console', (m) => { if (m.type() === 'error') errs.push(`${side}/pix: ${m.text()}`); });
          await sp.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
          await sp.waitForFunction(() => typeof globalThis.__boot === 'function', null, { timeout: 120000 });
          await sp.evaluate(() => globalThis.__boot());
          await sp.evaluate(SCENE, [sc, JSON.stringify(INPUT)]);
          // Ustalenie sceny (przejścia `opacity`/`transform` paneli, dekodowanie fontów) przed pierwszym zrzutem.
          await sp.waitForTimeout(600);
          let prev = await sp.screenshot({ animations: 'disabled', caret: 'hide' });
          for (let tries = 0; tries < 8; tries++) {
            await sp.waitForTimeout(150);
            const cur = await sp.screenshot({ animations: 'disabled', caret: 'hide' });
            if (Buffer.compare(prev, cur) === 0) break;
            prev = cur;
          }
          r.png[`${sc}@${w}x${h}`] = prev;
          await sp.close();
        }
      }
    }
    r.ua = await page.evaluate(() => navigator.userAgent);
    res[side] = r;
    await page.close();
  }
  if (res.web.vec.hex) res.web.vec.hexNewDedup = res.web.vec.hex;
  let diffs = 0;
  const results = [];
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
          first = `#${i} @${j} web=${JSON.stringify(a.slice(Math.max(0, j - 80), j + 120))} port=${JSON.stringify(b.slice(Math.max(0, j - 80), j + 120))}`;
        }
      }
    }
    const distinct = new Set(w).size;
    const coverOk = w.length >= 1 && (w.length === 1 || distinct > 1) && !w.some((x) => String(x).startsWith('THROW:'));
    diffs += d + (coverOk ? 0 : 1);
    results.push({ key, n: w.length, distinct, d, coverOk, first });
  }
  for (const key of Object.keys(res.port.vec)) if (!(key in res.web.vec)) { diffs++; console.log(`TYLKO-PORT ${key}`); }
  const allWeb = Object.values(res.web.vec).flat().join('\n');
  const full = KINDS.size === ALL_KINDS.split(',').length;
  const missing = full ? MARKERS.filter((m) => !allWeb.includes(m)) : [];
  const stillThere = GONE.filter((g) => allWeb.includes(g));
  const checks = [];
  if (KINDS.has('hex')) {
    checks.push([`filtr odblokowań usuwa etykietę (przypadków ${res.web.info.unlockFiltered})`, res.web.info.unlockFiltered > 0]);
    checks.push([`deduplikacja surowców 9b ≠ stary filtr (przypadków ${res.web.info.resDedup})`, res.web.info.resDedup > 0]);
    checks.push([`etykiety terenu portu = labelPl weba (${portTerrainLabels.length}/${webTerrainLabels.length})`, webTerrainLabels.length === 8 && JSON.stringify(webTerrainLabels) === JSON.stringify(portTerrainLabels)]);
  }
  if (KINDS.has('bm')) checks.push(['AUTO_BUILD_DISABLED_HINT portu = web', !!webHint && webHint === portHint]);
  for (const [n, ok] of res.port.synth ?? []) checks.push([`dedup syntetyczny (port): ${n}`, ok]);
  const failedChecks = checks.filter(([, ok]) => !ok);
  diffs += missing.length + stillThere.length + failedChecks.length;
  const pix = [];
  for (const key of Object.keys(res.web.png)) {
    const eq = !!res.port.png[key] && Buffer.compare(res.web.png[key], res.port.png[key]) === 0;
    if (!eq) diffs++;
    pix.push({ key, eq, bytes: res.web.png[key].length, sha: createHash('sha256').update(res.web.png[key]).digest('hex') });
    if (PNG_DIR) {
      mkdirSync(PNG_DIR, { recursive: true });
      writeFileSync(join(PNG_DIR, `ui3c-web-${key.replace(/[^\w.@-]+/g, '_')}.png`), res.web.png[key]);
      if (!eq && res.port.png[key]) writeFileSync(join(PNG_DIR, `ui3c-port-${key.replace(/[^\w.@-]+/g, '_')}.png`), res.port.png[key]);
    }
  }
  diffs += errs.length;
  for (const r of results) console.log(`${r.key.padEnd(12)} przypadki=${String(r.n).padStart(5)} różne_wyniki=${String(r.distinct).padStart(5)} różnice=${r.d}${r.coverOk ? '' : ' COVER-FAIL'}${r.first ? ' PIERWSZA ' + r.first : ''}`);
  for (const p of pix) console.log(`PIX ${p.key.padEnd(30)} ${p.eq ? 'identyczny' : 'RÓŻNY'} (PNG ${p.bytes} B, sha256 ${p.sha.slice(0, 16)}…)`);
  if (full) console.log(`MARKERS ${MARKERS.length - missing.length}/${MARKERS.length}${missing.length ? ' BRAK: ' + missing.join(' | ') : ''}`);
  console.log(`GONE (usunięte w 9b019a7d8): ${stillThere.length ? 'WYSTĘPUJĄ ' + stillThere.join(' | ') : 'brak (OK)'}`);
  for (const [n, ok] of checks) console.log(`ASSERT ${ok ? 'OK ' : 'FAIL'} ${n}`);
  console.log(`pageerror/console.error: ${errs.length}${errs.length ? ' ' + errs.slice(0, 5).join(' | ') : ''}`);
  console.log(`Chromium: ${res.web.ua}`);
  const webHash = createHash('sha256').update(JSON.stringify(res.web.vec)).digest('hex');
  if (OUT) {
    if (!full) throw new Error('--out wymaga pełnego zestawu (bez --kinds)');
    const h24 = (x) => createHash('sha256').update(String(x)).digest('hex').slice(0, 24);
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-WEB-UI-3-C-Q1', source: 'web 86d510c66 + pliki UI-3 z 9b019a7d8 (WEB86U3, repin-ui2-overlay.mjs --web3-dir; Chromium headless)', chromium: res.web.ua,
      webVectorsSha256: webHash, png: pix.map(({ key, bytes, sha }) => ({ key, bytes, sha })),
      vectorSha256Prefix24: Object.fromEntries(Object.entries(res.web.vec).map(([k, arr]) => [k, arr.map(h24)])) }, null, 0).replace(/\],"/g, '],\n"') + '\n');
  }
  if (argOf('--dump')) writeFileSync(argOf('--dump'), JSON.stringify(res.web.vec) + '\n');
  const nCases = results.reduce((a, r) => a + r.n, 0);
  console.log(`run-repin-ui3c: modułów=${MODULES.length} grup=${results.length} przypadków=${nCases} png=${pix.length} PIX_różnych=${pix.filter((p) => !p.eq).length} asercji=${checks.length - failedChecks.length}/${checks.length} błędów_strony=${errs.length} różnic=${diffs} webVectorsSha256=${webHash}`);
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
