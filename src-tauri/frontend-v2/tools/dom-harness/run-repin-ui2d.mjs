#!/usr/bin/env node
/**
 * run-repin-ui2d.mjs — harness partii REPIN UI-2-D (R-RUSTPORT-REPIN-UI-2-D-Q1).
 *
 * Moduły partii (PORTY DOM/adaptery repinowane do aktualnego weba `origin/main` 86d510c66, NIE kopie bajtowe):
 *   ui/hexContextTooltip.ts            buildHexContextTooltipHtml (produkcja ulepszeń przed plonami, bez „magazyn państwa”,
 *                                      blok „Surowce z terenu (przy 👤)”, nowa stopka, możliwe ulepszenia), karta jednostki
 *                                      (stos: Wódz/Generał, etykieta „Wybrana jednostka”), CSS `.commander`;
 *   ui/preBattle.ts                    `automaticOnly` (od razu onAuto, także po kolejce odroczonych), `manualControlAllowed`
 *                                      (notka o Wodzu/Generale), chipy bonusów = `effectiveCombatBonusChipTexts` (DTO);
 *   ui/buildModeHud.ts                 wskaźnik „Budżet niewydany” + „Wyłącz filtr”, nowa etykieta profilu Zrównoważone;
 *   ui/entityCards/buildingAdapter.ts  `civBonusy` w stanie karty → koszt Pracy (DTO `BuildingCardRulesDto.workCost`);
 *   ui/entityCards/improvementAdapter.ts „Koszt (Praca)” = `scaleTerrainImprovementWorkCost` (DTO `terrainImprovementWorkCost`).
 *
 * WEB:  moduły z URUCHOMIONEGO weba — katalog `git archive origin/main gra/src gra/data` (`--web-dir`), spakowane `build.mjs`
 *       (emulacja Vite) i WYKONANE w Chromium (Playwright `/opt/node-tools`), serwowane po HTTP z localhost.
 *       Strona web liczy też DTO dla portu funkcjami `game/**` weba (harness gra rolę „Rust”, jak run-cycles/run-c4):
 *       `HexTooltipViewDto` (transkrypcja `hexContextTooltip.ts` main z `ownerEra` = `currentEra`), `FieldPowerDto`,
 *       `UnitCardBadgesDto`, `PreBattleSide.bonusChips` (`effectiveCombatBonusChipTexts` + `civCombatUnitShapeFromCategory`),
 *       `BuildingCardRulesDto` (z `civBonusy`), `StaticCatalogDto` (dane `gra/data` + `terrainImprovementWorkCost`).
 * PORT: moduły `src/**` frontend-v2 (`--src`), spakowane tym samym `build.mjs`, wykonane w TEJ SAMEJ instancji Chromium.
 *
 * Porównanie (EXIT 0 <=> wszystko zgodne, pokrycie spełnione, 0 `pageerror`/`console.error`):
 *   VEC   każdy przypadek → wynik (HTML po parsowaniu przeglądarki / JSON / log callbacków) web === port;
 *   PIX   zrzuty PNG scen (tooltip heksa + karta stosu z Wodzem, okno przed bitwą z notką, HUD budowy z „Budżet
 *         niewydany”) w 1280×720 i 360×640: bajty PNG web === port (próg 0 — ten sam silnik, ten sam DOM);
 *   COVER każda grupa ma ≥ 1 przypadek i wyniki web nie są wszystkie równe; znaczniki nowych hunków występują w wynikach
 *         web (lista `MARKERS`) — harness widzi każdy nowy tekst/klasę;
 *   ASSERT asercje portu (fallback ZAŁOŻENIE UI2D-Z3: katalog bez `terrainImprovementWorkCost` → surowe `koszt_praca`).
 * Zapis wektorów: `--out <plik.json>` (sha256 każdego wyniku web + `webVectorsSha256`; niezależny weryfikator porównuje hash
 * z 2 katalogów `git archive`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui2d.mjs --web-dir <WEB_DIR> [--src <katalog src>] [--out <plik>] [--tmp-dir <dir>]
 *        [--chromium <ścieżka>] [--png-dir <dir>]
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
  console.error('Użycie: node tools/dom-harness/run-repin-ui2d.mjs --web-dir <katalog z gra/src i gra/data origin/main> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const WEB_DATA = join(resolve(WEB_DIR), 'gra/data');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui2d-'));

const MODULES = ['ui/hexContextTooltip.ts', 'ui/preBattle.ts', 'ui/buildModeHud.ts', 'ui/entityCards/buildingAdapter.ts', 'ui/entityCards/improvementAdapter.ts'];
for (const m of MODULES) {
  for (const dir of [SRC, WEB_SRC]) {
    if (!existsSync(join(dir, m))) {
      console.error(`BRAK modułu ${join(dir, m)}`);
      process.exit(2);
    }
  }
}

/** Teksty/klasy nowych hunków main — muszą wystąpić w wynikach web (dowód, że przypadki je pokrywają). */
const MARKERS = [
  'cp-prod-line', 'Surowce z terenu (przy 👤)', 'w wierszu produkcji przy ulepszeniu', 'data-commander="true"',
  'sp-unit-stack-commander-role', '★ Wódz', '★ Generał', 'Wódz — ', 'Generał — ', 'Bez Wodza lub Generała',
  'data-ulepszenia-unspent', 'Budżet niewydany:', 'przy niedoborze tylko brakujący surowiec', 'LOG:onAuto',
  'LOG:onUnspentBudgetDisableFilter', 'sp-unit-stack-card.commander',
];
/** Teksty usunięte w main — nie mogą wystąpić w wynikach web tooltipa heksa. */
const GONE = ['magazyn państwa', 'Do magazynu państwa', '· automatycznie'];

const imp = (p) => JSON.stringify(p);
function writeEntries() {
  const W = (m) => imp(join(WEB_SRC, m));
  const webEntry = join(TMP, 'entry-web.ts');
  writeFileSync(webEntry, `
import * as HX from ${W('ui/hexContextTooltip.ts')};
import * as PB from ${W('ui/preBattle.ts')};
import * as BM from ${W('ui/buildModeHud.ts')};
import * as BA from ${W('ui/entityCards/buildingAdapter.ts')};
import * as IA from ${W('ui/entityCards/improvementAdapter.ts')};
import * as REG from ${W('ui/entityCards/registry.ts')};
import * as TI from ${W('game/terrain-improvements.ts')};
import * as EC from ${W('game/economy.ts')};
import * as RA from ${W('game/resource-access.ts')};
import * as LU from ${W('game/livestock-unlock.ts')};
import * as IB from ${W('map/improvement-build.ts')};
import * as UP from ${W('game/unit-power.ts')};
import * as UB from ${W('game/unit-building-bonuses.ts')};
import * as VT from ${W('game/veteran.ts')};
import * as DN from ${W('game/display-names.ts')};
import * as CB from ${W('game/civ-bonuses.ts')};
import * as PR from ${W('game/production.ts')};
import * as SC from ${W('game/building-stock-cost.ts')};
import * as EU from ${W('game/economy-upkeep.ts')};
import * as BU from ${W('game/building-upgrades.ts')};
import * as CI from ${W('game/cities.ts')};
import * as ST from ${W('units/setup.ts')};
import * as IT from ${W('game/improvement-tech.ts')};
import * as PS from ${W('game/playerState.ts')};
import unitsJson from ${imp(join(WEB_DATA, 'units.json'))};
import buildingsJson from ${imp(join(WEB_DATA, 'buildings.json'))};
import techJson from ${imp(join(WEB_DATA, 'tech.json'))};
import terrainJson from ${imp(join(WEB_DATA, 'terrain-improvements.json'))};
import wondersJson from ${imp(join(WEB_DATA, 'wonders.json'))};
import countersJson from ${imp(join(WEB_DATA, 'counters.json'))};
import civsJson from ${imp(join(WEB_DATA, 'civs.json'))};
import uiParamsJson from ${imp(join(WEB_DATA, 'ui-params.json'))};
(globalThis as any).__ui2dWeb = { HX, PB, BM, BA, IA, REG, TI, EC, RA, LU, IB, UP, UB, VT, DN, CB, PR, SC, EU, BU, CI, ST, IT, PS,
  data: { unitsJson, buildingsJson, techJson, terrainJson, wondersJson, countersJson, civsJson, uiParamsJson } };
`);
  const P = (m) => imp(join(SRC, m));
  const portEntry = join(TMP, 'entry-port.ts');
  writeFileSync(portEntry, `
import { installStaticCatalog } from ${P('controller/staticCatalog.ts')};
import { installBuildingCardRulesProvider } from ${P('controller/entityCardRules.ts')};
(globalThis as any).__ui2dPortInit = async (catalog: any, rules: any) => {
  installStaticCatalog(catalog);
  installBuildingCardRulesProvider((id: string, st: any) => {
    const k = JSON.stringify([id, st]);
    // Brak odpowiedzi „Rust” dla stanu (np. mutacja gubiąca civBonusy) → wartość-wartownik (różnica wykrywalna, nie wyjątek).
    return rules[k] ?? { ...Object.values(rules)[0], workCost: -1 };
  });
  const HX = await import(${P('ui/hexContextTooltip.ts')});
  const PB = await import(${P('ui/preBattle.ts')});
  const BM = await import(${P('ui/buildModeHud.ts')});
  const BA = await import(${P('ui/entityCards/buildingAdapter.ts')});
  const IA = await import(${P('ui/entityCards/improvementAdapter.ts')});
  const REG = await import(${P('ui/entityCards/registry.ts')});
  (globalThis as any).__ui2dPort = { HX, PB, BM, BA, IA, REG, installStaticCatalog };
};
`);
  return { webEntry, portEntry };
}

/* ── Przypadki (wspólne wejście obu stron) ──────────────────────────────────────────────────────────────── */
const ERAS = [undefined, 1, 2, 3, 4];
const HEXES = [];
const TERR = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'pustynia', 'polarny'];
const OVER = ['brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_owiec', 'zloze_bydla', 'zloze_lamy'];
for (const t of TERR) for (const o of OVER) HEXES.push([`${t}/${o}`, { coords: { q: 2, r: -1 }, terenBazowy: t, nakladka: o, ulepszenie: 'brak' }]);
for (const t of ['laka', 'wzgorza', 'gory']) HEXES.push([`${t}/rzeka`, { coords: { q: 0, r: 0 }, terenBazowy: t, nakladka: 'brak', rzeka: { obecna: true } }]);
/* Ulepszenia postawione (klucze z terrain-improvements.json, wypełniane na stronie web — tu lista stała typowych). */
const BUILT = [
  ['tartak', 'laka', 'las', undefined], ['tartak', 'wzgorza', 'las', undefined], ['kamieniolom', 'gory', 'brak', undefined],
  ['kamieniolom', 'wzgorza', 'brak', undefined], ['kopalnia_zelaza', 'gory', 'brak', 'zelazo'], ['kopalnia_miedzi', 'wzgorza', 'zloze_rudy', 'ruda'],
  ['kopalnia_zlota', 'gory', 'brak', 'zloto'], ['kopalnia_cyny', 'gory', 'brak', 'cyna'], ['glinianka', 'laka', 'zloze_gliny', 'glina'],
  ['warzelnia_soli', 'plytkie_morze', 'brak', 'sol'], ['warzelnia_soli', 'gory', 'brak', 'sol'], ['farma', 'laka', 'brak', undefined],
  ['stadnina', 'laka', 'zloze_konia', undefined], ['bydlo', 'laka', 'zloze_bydla', undefined], ['owce', 'wzgorza', 'zloze_owiec', undefined],
  ['oboz_lowiecki', 'laka', 'las', undefined], ['wyrab', 'laka', 'las', undefined], ['droga', 'laka', 'brak', undefined],
  ['irygacja', 'laka', 'brak', undefined], ['fort', 'wzgorza', 'brak', undefined],
];
for (const [k, t, o, z] of BUILT) {
  HEXES.push([`imp:${k}@${t}/${o}${z ? '/' + z : ''}`, { coords: { q: 1, r: 1 }, terenBazowy: t, nakladka: o, ulepszenia: [k], zloze: z, rzeka: k === 'irygacja' ? { obecna: true } : undefined }]);
}
HEXES.push(['multi:tartak+oboz', { coords: { q: 5, r: 5 }, terenBazowy: 'laka', nakladka: 'las', ulepszenia: ['tartak', 'oboz_lowiecki'] }]);
HEXES.push(['multi:kamieniolom+droga', { coords: { q: 6, r: 5 }, terenBazowy: 'gory', nakladka: 'brak', ulepszenia: ['kamieniolom', 'droga'] }]);
for (const z of ['sol', 'zelazo', 'miedz', 'zloto', 'cyna', 'glina', 'kamien']) HEXES.push([`zloze:${z}@gory`, { coords: { q: 3, r: 3 }, terenBazowy: 'gory', nakladka: 'brak', zloze: z }]);
const CITY = [{}, { cityName: 'Ateny <x>', cityIsCityState: false, cityOwnerLabel: 'Grecy', cityPopulation: 7.6 }, { cityName: 'Sparta', cityIsCityState: true }];
const HEX_CASES = [];
let hi = 0;
for (const [name, hex] of HEXES) {
  for (const era of ERAS) {
    const worked = hi % 2 === 0;
    HEX_CASES.push({ name: `${name}/era${era}/${worked}`, hex, era, civ: hi % 7 === 0 ? 'inkowie' : 'grecy', worked, city: CITY[hi % 3] });
    hi++;
  }
}
const STACK = [
  { id: 'u1', name: 'Hoplita', icon: '', hp: 7.6, hpMax: 10, ruchLeft: 1, ruchMax: 2, active: true },
  { id: 'w<1>', name: 'Wojownik', commanderTitle: 'Wódz', icon: '', hp: 10, hpMax: 10, ruchLeft: 2, ruchMax: 2, active: false },
  { id: 'g1', name: 'Rydwan & co', commanderTitle: 'Generał', icon: '<svg></svg>', hp: 3, hpMax: 0, ruchLeft: 0, ruchMax: 0, active: false },
];
const STACK_CMD_ACTIVE = STACK.map((c, i) => ({ ...c, active: i === 1 }));
const STACK_GEN_ACTIVE = STACK.map((c, i) => ({ ...c, active: i === 2 }));
const STACK_ODD = [{ ...STACK[0], commanderTitle: 'Król' }, { ...STACK[1], active: true, commanderTitle: '' }];
const UNIT_CASES = [
  ['armia-wódz-nieaktywny', { displayName: 'Armia (3)', q: 2, r: 2, ruchLeft: 1, ruchMax: 2, stackCards: STACK, k: 3 }],
  ['armia-wódz-aktywny', { displayName: 'Armia (3)', q: 2, r: 2, ruchLeft: 1, ruchMax: 2, stackCards: STACK_CMD_ACTIVE, k: 2, expandable: true }],
  ['armia-generał-aktywny', { displayName: 'Armia', q: 2, r: 2, ruchLeft: 1, ruchMax: 2, stackCards: STACK_GEN_ACTIVE, k: 1 }],
  ['armia-nieznany-tytuł', { displayName: 'Armia', q: 0, r: 0, ruchLeft: 0, ruchMax: 2, stackCards: STACK_ODD, k: 0 }],
  ['solo', { displayName: 'Solo', q: 2, r: 2, ruchLeft: 1, ruchMax: 2, stackCards: STACK.slice(1, 2), k: 4 }],
];
const PB_UNITS = [
  ['Hoplita', 'piechota'], ['Łucznik <x>', 'lucznik'], ['Jeźdźcy', 'kawaleria'], ['Katapulta', 'machina oblezenie'], ['Galera', 'galera'],
  ['Procarz', 'dystans'], ['Wódz', 'dowodca'], ['Garnizon', 'garnizon'],
].map(([n, k], i) => ({ nazwa: n, kategoria: k, hp: 7 - (i % 3), maxHp: 10, atak: 5 + i, ilosc: 1 + (i % 2) }));
const SIDE = (o) => ({ nazwa: 'Strona', units: PB_UNITS.slice(0, 3), ...o });
const PB_INFOS = [
  ['atak-gracza', { atakujacy: SIDE({ nazwa: 'Grecy', cywilizacja: 'Grecja', wodz: 'Leonidas', ownerId: 0, civId: 'grecy', era: 2 }), obronca: SIDE({ nazwa: 'Rzym <x>', ownerId: 1, civId: 'rzymianie', units: PB_UNITS }), teren: 'Łąka', szanseAtkPct: 71.6, tura: 12 }],
  ['obrona-gracza', { atakujacy: SIDE({ nazwa: 'Barbarzyńcy', isBarbarian: true, ownerId: 9, units: PB_UNITS.slice(2, 6) }), obronca: SIDE({ nazwa: 'Ty', ownerId: 0, civId: 'egipcjanie' }), teren: 'Góry', szanseAtkPct: 30, canRetreat: false, defenderCanRetreat: true }],
  ['teren-wzgórza', { atakujacy: SIDE({ nazwa: 'P', ownerId: 2, units: PB_UNITS.slice(4) }), obronca: SIDE({ nazwa: 'Q', ownerId: 3, units: PB_UNITS.slice(1, 5) }), teren: 'Wzgórza', szanseAtkPct: 50 }],
  ['bez-teren', { atakujacy: SIDE({ nazwa: 'A', ownerId: 4, units: [] }), obronca: SIDE({ nazwa: '', ownerId: 5, units: PB_UNITS.slice(5) }), teren: '', szanseAtkPct: 65 }],
];
const PB_OPTS = [
  ['brak', undefined], ['automaticOnly', { automaticOnly: true }], ['automaticOnly=false', { automaticOnly: false }],
  ['manual=false', { manualControlAllowed: false }], ['manual=true', { manualControlAllowed: true }],
  ['manual=false+auto-domyślne', { manualControlAllowed: false, defaultAction: 'auto' }],
  ['automaticOnly+manual=false', { automaticOnly: true, manualControlAllowed: false }],
];
const BM_WARN = [['brak-hooka', '__none__'], ['null', null], ['zero', { waitingHexes: 0 }], ['jedno', { waitingHexes: 1 }], ['dużo', { waitingHexes: 37 }]];
const BM_EMP = [['auto', { focus: 'zrownowazone', tryb: 'auto', onlyWorked: true, pracaAutoPercent: 40, wolnoWycinacLas: false }],
  ['ręczny', { focus: 'zrownowazone', tryb: 'reczny', onlyWorked: true, pracaAutoPercent: 40, wolnoWycinacLas: false }],
  ['auto-surowce', { focus: 'surowce', tryb: 'auto', onlyWorked: false, pracaAutoPercent: 75, wolnoWycinacLas: true }]];
const BUILD_IDS_MAX = 40;
const BUILD_STATES = [
  { hasCity: true, displayLevel: 1, buildCostPace: 'niski', difficulty: 'normal', ownerId: 0 },
  { hasCity: true, displayLevel: 2, buildCostPace: 'normalny', difficulty: 'hard', ownerId: 1, civIdx: 0 },
  { hasCity: false, displayLevel: 1, buildCostPace: 'wysoki', difficulty: 'easy', ownerId: 0, civIdx: 3 },
  { hasCity: true, displayLevel: 3, buildCostPace: 'niski', difficulty: 'normal', ownerId: 2, civIdx: -1 },
];
const INPUT = { HEX_CASES, UNIT_CASES, PB_INFOS, PB_OPTS, BM_WARN, BM_EMP, BUILD_IDS_MAX, BUILD_STATES };

/* ── Kod wspólny przeglądarki ───────────────────────────────────────────────────────────────────────────── */
const COMMON = String.raw`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const host = () => document.getElementById('host');
const parsed = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.innerHTML; };
const bodyState = () => [...document.body.children].filter((e) => e.id !== 'host' && e.tagName !== 'SCRIPT').map((e) => e.outerHTML).join('\n');
const combat = (k) => ({ atakBase: 4, atakEffective: 4 + k, obronaBase: 6, obronaEffective: 6 - k / 2, hpMaxBase: 10, hpMaxEffective: 10 + k,
  pancerzBase: 1, pancerzEffective: 1 + k * 1.25, weaponDamageBase: 2, weaponDamageEffective: 2 + k, piercingBase: 1, piercingEffective: 1,
  chargeBonusBase: 3, chargeBonusEffective: 3 + k * 2, missileAttackBase: 0, missileAttackEffective: k > 2 ? 5 : 0 });
const BM_TYPES = [
  { key: 'farma', label: 'Farma', kosztPraca: 20, epoka: 1, typ: 'ulepszenie', techUnlocked: true },
  { key: 'tartak', label: 'Tartak', kosztPraca: 45, epoka: 1, techUnlocked: false, techLabel: null },
  { key: 'kopalnia_miedzi', label: 'Kopalnia miedzi', kosztPraca: 60, epoka: 2, techId: 'brazownictwo', techUnlocked: false, techLabel: 'Brązownictwo', lockHint: 'Wymaga «Brązownictwo»' },
];
function bmConfig(side, warn, emp, log) {
  const pool = 40;
  const types = BM_TYPES.map((t) => (side === 'web' ? { ...t } : { ...t, affordable: !(t.kosztPraca > pool) }));
  const act = (n) => (...a) => log.push('LOG:' + n + ':' + JSON.stringify(a));
  const o = { listTypes: () => types, getActiveKey: () => 'farma', onSelectType: act('onSelectType'), onExit: act('onExit'), isOpen: () => true,
    getPracaPool: () => pool,
    listPlayerCities: () => [{ id: 'c1', name: 'Ateny' }, { id: 'c2', name: 'Sparta' }], getUlepszeniaCityId: () => null, onUlepszeniaCityIdChange: act('onUlepszeniaCityIdChange'),
    getUlepszeniaEmpireState: () => emp, onUlepszeniaEmpireFocusChange: act('onUlepszeniaEmpireFocusChange'), onUlepszeniaEmpireTrybChange: act('onUlepszeniaEmpireTrybChange'),
    onUlepszeniaEmpireOnlyWorkedChange: act('onUlepszeniaEmpireOnlyWorkedChange'), onUlepszeniaEmpireWyrabChange: act('onUlepszeniaEmpireWyrabChange'),
    onUlepszeniaEmpirePracaPercentChange: act('onUlepszeniaEmpirePracaPercentChange'), getUlepszeniaCityOverride: () => false,
    onUlepszeniaCityOverrideChange: act('onUlepszeniaCityOverrideChange'), getUlepszeniaEffectiveState: () => null,
    onUnspentBudgetDisableFilter: (...a) => { filterOff = true; act('onUnspentBudgetDisableFilter')(...a); } };
  // Jak w grze: po „Wyłącz filtr” warunek ustępuje → hook zwraca null (render po kliknięciu musi zdjąć wskaźnik).
  let filterOff = false;
  if (warn !== '__none__') o.getUnspentBudgetWarning = () => (filterOff ? null : warn);
  return o;
}
function runBuildMode(M, side, I) {
  const out = [];
  for (const [wn, warn] of I.BM_WARN) for (const [en, emp] of I.BM_EMP) {
    const log = [];
    const api = M.BM.createBuildModeHud(bmConfig(side, warn, emp, log));
    document.body.append(api.el, api.bannerEl);
    api.update();
    const before = api.el.outerHTML;
    const btn = api.el.querySelector('[data-ulepszenia-unspent-disable-filter]');
    if (btn) btn.click();
    const after = api.el.outerHTML;
    out.push({ k: 'bm(' + wn + ',' + en + ')', v: before + '\n--klik--\n' + after + '\n' + log.join('\n') });
    api.destroy();
  }
  return out;
}
function runPreBattle(M, side, I, infosFor, cfgFor) {
  const out = [];
  for (const [iname] of I.PB_INFOS) for (const [oname, opts] of I.PB_OPTS) for (const act of ['brak', 'deploy', 'auto', 'cancel', 'Enter']) {
    const log = [];
    M.PB.configurePreBattle(cfgFor(() => false));
    const cb = { onAuto: () => log.push('LOG:onAuto'), onBattlefield: () => log.push('LOG:onBattlefield'), onCancel: () => log.push('LOG:onCancel') };
    M.PB.showPreBattle(infosFor(iname), cb, opts);
    const open = M.PB.isPreBattleOpen();
    const dom = bodyState();
    if (act === 'Enter') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    else if (act !== 'brak') document.querySelector('[data-act="' + act + '"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const openAfter = M.PB.isPreBattleOpen();
    M.PB.hidePreBattle();
    out.push({ k: 'pb(' + iname + ',' + oname + ',' + act + ')', v: (act === 'brak' ? dom : '') + '\nopen=' + open + '/' + openAfter + '\n' + log.join('\n') });
  }
  // Kolejka odroczonych automatycznych (inny modal końca tury otwarty) → flush → automaticOnly dalej onAuto (FIFO).
  for (const [oname, opts] of I.PB_OPTS) {
    const log = [];
    let other = true;
    M.PB.configurePreBattle(cfgFor(() => other));
    const cb = (n) => ({ onAuto: () => log.push('LOG:onAuto:' + n), onBattlefield: () => log.push('LOG:onBattlefield:' + n), onCancel: () => log.push('LOG:onCancel:' + n) });
    M.PB.showPreBattle(infosFor('atak-gracza'), cb(1), { ...(opts ?? {}), auto: true });
    M.PB.showPreBattle(infosFor('obrona-gracza'), cb(2), { ...(opts ?? {}), auto: true });
    const pending = M.PB.hasPendingAutoPreBattle();
    other = false;
    M.PB.flushDeferredAutoPreBattle();
    const open = M.PB.isPreBattleOpen();
    const dom = bodyState();
    M.PB.hidePreBattle();
    M.PB.flushDeferredAutoPreBattle();
    const open2 = M.PB.isPreBattleOpen();
    M.PB.hidePreBattle();
    M.PB.clearDeferredAutoPreBattleQueue();
    out.push({ k: 'pb-kolejka(' + oname + ')', v: 'pending=' + pending + ' open=' + open + '/' + open2 + '\n' + dom + '\n' + log.join('\n') });
  }
  return out;
}
`;

/** Strona WEB: wyniki + DTO dla portu. */
const EVAL_WEB = ([inputStr, common]) => {
  // eslint-disable-next-line no-new-func
  const C = new Function('M_', common + '; return { esc, parsed, bodyState, combat, bmConfig, runBuildMode, runPreBattle };')();
  const I = JSON.parse(inputStr);
  const M = globalThis.__ui2dWeb;
  const { HX, TI, EC, RA, LU, IB, UP, UB, VT, DN, CB, PR, SC, EU, BU, CI, ST, IT, PS, data } = M;
  const out = {};
  const dto = {};
  // StaticCatalogDto (dane main + mapy liczone „w Rust”).
  const unitCategory = {};
  const unitCategoryNameOnly = {};
  for (const u of data.unitsJson) {
    unitCategory[u.Jednostka] = ST.categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    unitCategoryNameOnly[u.Jednostka] = ST.categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  const techTerrainUnlockLabels = {};
  for (const t of data.techJson.technologie) techTerrainUnlockLabels[t.Technologia] = IT.terrainUnlockLabelsForTech(t.Technologia);
  const terrainImprovementWorkCost = {};
  for (const [k, row] of Object.entries(data.terrainJson)) {
    if (k.startsWith('_') || !row || typeof row !== 'object' || row.koszt_praca == null) continue;
    terrainImprovementWorkCost[k] = TI.scaleTerrainImprovementWorkCost(row.koszt_praca, row.epoka);
  }
  dto.catalog = {
    contentHash: 'harness-main-86d510c66', buildings: data.buildingsJson, units: data.unitsJson, tech: data.techJson, terrainImprovements: data.terrainJson,
    wonders: data.wondersJson, counters: data.countersJson, civs: data.civsJson, cityNamesPools: {}, powerParams: {}, uiParams: data.uiParamsJson, wiki: {},
    constants: { researchQueueMax: PS.RESEARCH_QUEUE_MAX, maxProcentPuliImperium: CI.MAX_PROCENT_PULI_IMPERIUM, maxUlepszeniaPracaAutoPercent: CI.MAX_ULEPSZENIA_PRACA_AUTO_PERCENT },
    labels: {}, unitCategory, unitCategoryNameOnly, techTerrainUnlockLabels, terrainImprovementWorkCost,
  };
  // ── 1. hexContextTooltip: „Rust” = transkrypcja main (`:250-295,327-358,436-509`) na funkcjach main, ownerEra = currentEra.
  const RIVER_BONUS = { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0, glina: 2, ruda: 0, ruda_zelaza: 0 };
  const FOREST_BONUS = { zywnosc: -1, praca: 3, handel: -1, drewno: 3, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };
  const bonusToTileYield = (b) => ({ zywnosc: b.zywnosc ?? 0, praca: b.praca ?? 0, handel: (b.handel ?? 0) + (b.pieniadz ?? 0), drewno: b.drewno ?? 0, kamien: b.kamien ?? 0, glina: b.glina ?? 0, ruda: 0, ruda_zelaza: 0 });
  const cityYieldOnly = (y) => ({ zywnosc: y.zywnosc ?? 0, praca: y.praca ?? 0, handel: y.handel ?? 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 });
  const impLine = (key, zloze, ye) => ({ key, name: TI.improvementDisplayName(key), bonus: TI.improvementBonusForKey(key, ye),
    magazyn: TI.territoryResourceYieldForImprovement(key, zloze, ye) ?? null, unlockLabels: RA.labelsForImprovementUnlock(key) });
  const hexView = (hex, era, civ, ye) => {
    const keys = TI.improvementKeysForHex(hex);
    const zloze = hex.zloze;
    const fullY = EC.tileYield({ terenBazowy: hex.terenBazowy, nakladka: hex.nakladka ?? 'brak', maRzeke: !!(hex.rzeka && hex.rzeka.obecna), zloze, ulepszeniaKeys: keys, wlascicielEra: ye });
    const parts = [{ label: 'teren bazowy', delta: EC.tileYield({ terenBazowy: hex.terenBazowy, nakladka: 'brak', maRzeke: false }) }];
    if (hex.nakladka === 'las') parts.push({ label: 'las', delta: { ...FOREST_BONUS } });
    if (hex.rzeka?.obecna) parts.push({ label: 'rzeka', delta: { ...RIVER_BONUS } });
    for (const k of keys) {
      const bonus = cityYieldOnly(bonusToTileYield(TI.improvementBonusForKey(k, ye)));
      if (!['zywnosc', 'praca', 'handel'].some((yk) => (bonus[yk] ?? 0) !== 0)) continue;
      parts.push({ label: `${TI.improvementDisplayName(k)} (postawione)`, delta: bonus });
    }
    const res = [];
    const seen = new Set();
    const push = (label) => { const k = label.toLowerCase(); if (seen.has(k)) return; seen.add(k); res.push(label); };
    if (!(hex.nakladka === 'zloze_lamy' && !LU.isLamaDepositVisibleForCiv(civ))) {
      const d = RA.hexDepositDisplayLabel(hex, era); if (d) push(d);
      const h = RA.hexHiddenDepositHint(hex, era); if (h) push(h);
    }
    for (const k of keys) for (const u of RA.labelsForImprovementUnlock(k)) push(u);
    if (hex.nakladka === 'las') push('Las (drewno)');
    if (hex.rzeka?.obecna) push('Rzeka');
    const active = new Set(keys);
    const teren = hex.terenBazowy;
    const nak = hex.nakladka;
    const possible = [];
    for (const k of TI.IMPROVEMENT_KEYS) {
      if (active.has(k)) continue;
      if (!TI.isImprovementAllowedForCiv(k, civ)) continue;
      if (!IB.galleryTerrainEligible(k, teren)) continue;
      if (IB.isImprovementBlockedOnForest(k, nak)) continue;
      if (k === 'bydlo' && nak !== 'zloze_bydla') continue;
      if (k === 'owce' && nak !== 'zloze_owiec') continue;
      if (k === 'lama' && nak !== 'zloze_lamy') continue;
      if (k === 'stadnina' && nak !== 'zloze_konia') continue;
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
      if (k === 'irygacja' && !HX.hexHasRiverAccess(hex, undefined)) continue;
      possible.push(impLine(k, undefined, ye));
      if (possible.length >= 10) break;
    }
    return { terrainBase: String(hex.terenBazowy), resourceLabels: res, built: keys.map((k) => impLine(k, zloze, ye)), implicit: [], yieldParts: parts, yieldFull: fullY, possible };
  };
  out.hex = [];
  dto.hex = [];
  for (const c of I.HEX_CASES) {
    const base = { q: c.hex.coords.q, r: c.hex.coords.r, esc: C.esc, hexWorkedForMagazyn: c.worked, ...c.city };
    out.hex.push(C.parsed(HX.buildHexContextTooltipHtml({ ...base, hex: c.hex, currentEra: c.era ?? undefined, playerCivType: c.civ })));
    dto.hex.push({ view: hexView(c.hex, c.era ?? 99, c.civ, c.era ?? undefined),
      cityDisplayLabel: c.city.cityName ? DN.formatEntityDisplayName({ baseName: c.city.cityName, isCityState: c.city.cityIsCityState }) : null });
  }
  out.unit = [];
  dto.unit = [];
  for (const [, u] of I.UNIT_CASES) for (const expanded of [false, true]) {
    const c = C.combat(u.k);
    const base = { ...u, combat: c, expanded, esc: C.esc };
    delete base.k;
    out.unit.push(C.parsed(HX.buildUnitContextTooltipHtml(base)));
    dto.unit.push({
      fieldPower: UP.fieldPower({ meleeAttack: c.atakEffective, meleeDefence: c.obronaEffective, armor: c.pancerzEffective, health: c.hpMaxEffective, weaponDamage: c.weaponDamageEffective, piercing: c.piercingEffective, chargeBonus: c.chargeBonusEffective, missileAttack: c.missileAttackEffective }),
      badges: { softPath: UB.softPathBadgeLevel({ parametryBonusProc: base.parametryPathPp ?? 0 }), armorPath: UB.armorPathBadgeLevel({ pancerzBonusProc: base.pancerzPathPp ?? 0 }), veteranStars: VT.veteranStarCount(base.veteranProgress ?? null) },
    });
  }
  out.css = [HX.UNIT_CONTEXT_PANEL_CSS];
  // ── 2. preBattle: chipy = effectiveCombatBonusChipTexts (main :725-728) — „Rust” podaje gotowe teksty.
  const civs = data.civsJson.cywilizacje;
  const getCivBonusy = (o) => (civs[o % civs.length]?.bonusy ?? []);
  const infos = Object.fromEntries(I.PB_INFOS);
  const chipsFor = (side, role, terrain) => {
    const bonusy = side.ownerId !== undefined ? getCivBonusy(side.ownerId) : [];
    const roster = side.units.map((u) => CB.civCombatUnitShapeFromCategory(u.nazwa, u.kategoria));
    return CB.effectiveCombatBonusChipTexts(bonusy, roster, { side: role === 'atk' ? 'attacker' : 'defender', terrain: terrain ?? '', isChargeRound: false });
  };
  dto.pbInfos = {};
  for (const [n, info] of I.PB_INFOS) {
    dto.pbInfos[n] = { ...info, atakujacy: { ...info.atakujacy, bonusChips: chipsFor(info.atakujacy, 'atk', info.teren) }, obronca: { ...info.obronca, bonusChips: chipsFor(info.obronca, 'def', info.teren) } };
  }
  const isMe = (o) => o === 0;
  out.pb = C.runPreBattle(M, 'web', I, (n) => infos[n], (other) => ({ getCivBonusy, isMe, isOtherEndTurnModalOpen: other }));
  // ── 3. buildModeHud.
  out.bm = C.runBuildMode(M, 'web', I);
  // ── 4. adaptery kart.
  const buildings = data.buildingsJson.slice(0, I.BUILD_IDS_MAX);
  dto.rules = {};
  out.building = [];
  for (const b of buildings) for (const s0 of I.BUILD_STATES) {
    const st = { hasCity: s0.hasCity, displayLevel: s0.displayLevel, buildCostPace: s0.buildCostPace, difficulty: s0.difficulty, ownerId: s0.ownerId };
    if (s0.civIdx !== undefined) st.civBonusy = s0.civIdx >= 0 ? (civs[s0.civIdx]?.bonusy ?? []) : [];
    out.building.push(JSON.stringify(M.BA.buildingAdapter(b, { city: st })));
    const def = b;
    const YK = ['praca', 'pieniadz', 'zywnosc', 'nauka', 'kultura', 'zadowolenie', 'obrona'];
    const yieldAtDisplayLevel = {};
    const yieldScale = {};
    for (const k of YK) {
      const baza = def.baza?.[k] ?? 0;
      const inc = def.przyrost?.[k] ?? 0;
      yieldAtDisplayLevel[k] = PR.buildingEffectAtLevel(baza, inc, st.displayLevel);
      yieldScale[k] = Array.from({ length: Math.max(0, def.maksPoziom) }, (_, i) => PR.buildingEffectAtLevel(baza, inc, i + 1));
    }
    const baseWork = PR.itemCost('budynek', def.id, { buildings: data.buildingsJson, units: [] }, 1);
    const stockCost = SC.buildingStockCost(def);
    const upkeepResources = EU.buildingResourceUpkeep(def);
    const resourceLabels = {};
    for (const k of [...Object.keys(stockCost), ...Object.keys(upkeepResources)]) resourceLabels[k] = SC.stockResourceLabel(k);
    dto.rules[JSON.stringify([def.id, st])] = {
      yieldAtDisplayLevel, yieldScale, mnoznikRole: UB.mnoznikRoleForBuildingId(def.id), cumulativeMnoznik: UB.cumulativeMnoznikForBuildingId(def.id, data.buildingsJson),
      structuralDefenseLine: BU.buildingStructuralDefenseBonusLine(def.id),
      workCost: PR.buildingWorkCost(baseWork, st.civBonusy, st.buildCostPace, st.ownerId, st.difficulty),
      stockCost, upkeepGold: EU.buildingUpkeep(def, 1), upkeepResources, resourceLabels,
    };
  }
  out.improvement = [];
  dto.improvementKeys = [];
  for (const k of Object.keys(data.terrainJson)) {
    const row = M.REG.resolveImprovementRow(k);
    if (!row) continue;
    dto.improvementKeys.push(k);
    out.improvement.push(JSON.stringify(M.IA.improvementAdapter(row, {})));
  }
  // Wiersz spoza katalogu (kopia obiektu) — port: klucz po nazwie (NAME_TO_KEY).
  const anyKey = dto.improvementKeys.find((k) => data.terrainJson[k]?.koszt_praca != null && String(terrainImprovementWorkCost[k]) !== String(data.terrainJson[k].koszt_praca));
  out.improvementCopy = [JSON.stringify(M.IA.improvementAdapter({ ...data.terrainJson[anyKey] }, {}))];
  dto.improvementCopyKey = anyKey;
  return { out, dto };
};

/** Strona PORT: te same przypadki na DTO ze strony web. */
const EVAL_PORT = ([inputStr, dtoStr, common]) => {
  // eslint-disable-next-line no-new-func
  const C = new Function('M_', common + '; return { esc, parsed, bodyState, combat, bmConfig, runBuildMode, runPreBattle };')();
  const I = JSON.parse(inputStr);
  const D = JSON.parse(dtoStr);
  const M = globalThis.__ui2dPort;
  const out = {};
  const asserts = [];
  out.hex = I.HEX_CASES.map((c, i) => {
    const base = { q: c.hex.coords.q, r: c.hex.coords.r, esc: C.esc, hexWorkedForMagazyn: c.worked, ...c.city };
    delete base.cityIsCityState;
    return C.parsed(M.HX.buildHexContextTooltipHtml({ ...base, view: D.hex[i].view, cityDisplayLabel: D.hex[i].cityDisplayLabel }));
  });
  out.unit = [];
  let ui = 0;
  for (const [, u] of I.UNIT_CASES) for (const expanded of [false, true]) {
    const base = { ...u, combat: C.combat(u.k), expanded, esc: C.esc };
    delete base.k;
    out.unit.push(C.parsed(M.HX.buildUnitContextTooltipHtml({ ...base, fieldPower: D.unit[ui].fieldPower, badges: D.unit[ui].badges })));
    ui++;
  }
  out.css = [M.HX.UNIT_CONTEXT_PANEL_CSS];
  const isMe = (o) => o === 0;
  out.pb = C.runPreBattle(M, 'port', I, (n) => D.pbInfos[n], (other) => ({ isMe, isOtherEndTurnModalOpen: other }));
  out.bm = C.runBuildMode(M, 'port', I);
  const buildings = D.catalog.buildings.slice(0, I.BUILD_IDS_MAX);
  out.building = [];
  for (const b of buildings) for (const s0 of I.BUILD_STATES) {
    const st = { hasCity: s0.hasCity, displayLevel: s0.displayLevel, buildCostPace: s0.buildCostPace, difficulty: s0.difficulty, ownerId: s0.ownerId };
    if (s0.civIdx !== undefined) st.civBonusy = s0.civIdx >= 0 ? (D.catalog.civs.cywilizacje[s0.civIdx]?.bonusy ?? []) : [];
    out.building.push(JSON.stringify(M.BA.buildingAdapter(b, { city: st })));
  }
  out.improvement = D.improvementKeys.map((k) => JSON.stringify(M.IA.improvementAdapter(M.REG.resolveImprovementRow(k), {})));
  const cat = M.REG.resolveImprovementRow(D.improvementCopyKey);
  out.improvementCopy = [JSON.stringify(M.IA.improvementAdapter({ ...cat }, {}))];
  // ASSERT ZAŁOŻENIE UI2D-Z3: katalog bez `terrainImprovementWorkCost` → surowe `koszt_praca` (port niczego nie liczy).
  const raw = cat.koszt_praca;
  const scaled = D.catalog.terrainImprovementWorkCost[D.improvementCopyKey];
  M.installStaticCatalog({ ...D.catalog, terrainImprovementWorkCost: undefined });
  const rowNoMap = JSON.parse(JSON.stringify(M.IA.improvementAdapter(cat, {})));
  const costRow = rowNoMap.sections.flatMap((s) => s.rows ?? []).find((r) => r.label === 'Koszt (Praca)');
  asserts.push(['UI2D-Z3 fallback: brak mapy → surowe koszt_praca', costRow?.value === `${raw} P`]);
  asserts.push(['mapa ≠ surowe dla wiersza testowego (inaczej asercja niczego nie rozróżnia)', String(scaled) !== String(raw)]);
  M.installStaticCatalog(D.catalog);
  return { out, asserts };
};

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

/** Sceny PNG (renderowane po obu stronach z tych samych danych). */
const SCENES = ['hex+unit', 'preBattle', 'buildModeHud'];
const VIEWPORTS = [[1280, 720], [360, 640]];
const SCENE = (side, scene, common, dtoStr) => {
  // eslint-disable-next-line no-new-func
  const C = new Function('M_', common + '; return { esc, parsed, bodyState, combat, bmConfig, runBuildMode, runPreBattle };')();
  const D = dtoStr ? JSON.parse(dtoStr) : null;
  const M = side === 'web' ? globalThis.__ui2dWeb : globalThis.__ui2dPort;
  const h = document.getElementById('host');
  h.innerHTML = '';
  for (const e of [...document.body.children]) if (e.id !== 'host' && e.tagName !== 'SCRIPT') e.remove();
  try { M.PB.hidePreBattle(); } catch { /* brak */ }
  const I = globalThis.__ui2dInput;
  if (scene === 'hex+unit') {
    const st = document.createElement('style');
    st.textContent = M.HX.UNIT_CONTEXT_PANEL_CSS + '\n.cp-sub,.cp-yield-head,.cp-total{font:12px sans-serif;color:#eee}#host{background:#141820;color:#eee;padding:8px}';
    h.appendChild(st);
    const idxs = [I.HEX_CASES.findIndex((c) => c.name.startsWith('imp:kamieniolom@gory') && c.era === 3), I.HEX_CASES.findIndex((c) => c.name.startsWith('multi:tartak+oboz'))];
    for (const i of idxs) {
      const c = I.HEX_CASES[i];
      const base = { q: c.hex.coords.q, r: c.hex.coords.r, esc: C.esc, hexWorkedForMagazyn: true, ...c.city };
      const d = document.createElement('div');
      if (side === 'web') d.innerHTML = M.HX.buildHexContextTooltipHtml({ ...base, hex: c.hex, currentEra: c.era ?? undefined, playerCivType: c.civ });
      else { delete base.cityIsCityState; d.innerHTML = M.HX.buildHexContextTooltipHtml({ ...base, view: D.hex[i].view, cityDisplayLabel: D.hex[i].cityDisplayLabel }); }
      h.appendChild(d);
    }
    const u = { ...I.UNIT_CASES[1][1], combat: C.combat(2), expanded: true, esc: C.esc };
    delete u.k;
    const d = document.createElement('div');
    d.className = 'sp-ctx';
    d.innerHTML = side === 'web' ? M.HX.buildUnitContextTooltipHtml(u) : M.HX.buildUnitContextTooltipHtml({ ...u, fieldPower: D.unit[2].fieldPower, badges: D.unit[2].badges });
    h.insertBefore(d, st.nextSibling);
  } else if (scene === 'preBattle') {
    const civs = side === 'web' ? M.data.civsJson.cywilizacje : null;
    M.PB.configurePreBattle(side === 'web' ? { getCivBonusy: (o) => (civs[o % civs.length]?.bonusy ?? []), isMe: (o) => o === 0, isOtherEndTurnModalOpen: () => false } : { isMe: (o) => o === 0, isOtherEndTurnModalOpen: () => false });
    const info = side === 'web' ? Object.fromEntries(I.PB_INFOS)['atak-gracza'] : D.pbInfos['atak-gracza'];
    M.PB.showPreBattle(info, { onAuto() {}, onBattlefield() {}, onCancel() {} }, { manualControlAllowed: false });
  } else {
    const api = M.BM.createBuildModeHud(C.bmConfig(side, { waitingHexes: 12 }, I.BM_EMP[0][1], []));
    document.body.append(api.el, api.bannerEl);
    api.update();
  }
  return true;
};

let exitCode = 0;
let browser = null;
const servers = [];
try {
  const { webEntry, portEntry } = writeEntries();
  const sides = {};
  for (const [side, entry] of [['web', webEntry], ['port', portEntry]]) {
    const outdir = join(TMP, side);
    const pad = join(TMP, `pad-${side}.ts`);
    writeFileSync(pad, 'export {};\n');
    await bundle([entry, pad], outdir);
    const entryJs = readdirSync(outdir, { recursive: true }).map(String).find((f) => f.split('/').pop() === `entry-${side}.js`);
    if (!entryJs) throw new Error(`${side}: brak entry-${side}.js w ${outdir}`);
    writeFileSync(join(outdir, 'index.html'), `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><body style="margin:0;background:#fff"><div id="host" style="width:100%"></div><script type="module" src="./${entryJs}"></script>`);
    sides[side] = outdir;
  }
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu', '--autoplay-policy=user-gesture-required'] });
  const pageErrors = [];
  const pages = {};
  const COMMON_WITH_BM = COMMON;
  for (const side of ['web', 'port']) {
    const srv = await serve(sides[side]);
    servers.push(srv);
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => pageErrors.push(`${side}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`${side}: ${m.text()}`); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
    const flag = side === 'web' ? '__ui2dWeb' : '__ui2dPortInit';
    try {
      await page.waitForFunction((f) => globalThis[f] !== undefined, flag, { timeout: 120000 });
    } catch (e) {
      throw new Error(`${side}: moduły nie załadowane (${pageErrors.join(' | ') || e.message})`);
    }
    await page.evaluate((s) => { globalThis.__ui2dInput = JSON.parse(s); }, JSON.stringify(INPUT));
    pages[side] = page;
  }
  const web = await pages.web.evaluate(EVAL_WEB, [JSON.stringify(INPUT), COMMON_WITH_BM]);
  const dtoStr = JSON.stringify(web.dto);
  await pages.port.evaluate(async ([cat, rules]) => { await globalThis.__ui2dPortInit(JSON.parse(cat), JSON.parse(rules)); }, [JSON.stringify(web.dto.catalog), JSON.stringify(web.dto.rules)]);
  const port = await pages.port.evaluate(EVAL_PORT, [JSON.stringify(INPUT), dtoStr, COMMON_WITH_BM]);
  const ua = await pages.web.evaluate(() => navigator.userAgent);

  let diffs = 0;
  const results = [];
  for (const key of Object.keys(web.out)) {
    const w = web.out[key].map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
    const p = (port.out[key] ?? []).map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
    let d = 0;
    let first = '';
    for (let i = 0; i < Math.max(w.length, p.length); i++) {
      if (w[i] !== p[i]) {
        d++;
        if (!first) {
          let j = 0;
          while (j < Math.min(w[i]?.length ?? 0, p[i]?.length ?? 0) && w[i][j] === p[i][j]) j++;
          first = `#${i} @${j} web=${JSON.stringify((w[i] ?? '').slice(Math.max(0, j - 60), j + 140))} port=${JSON.stringify((p[i] ?? '').slice(Math.max(0, j - 60), j + 140))}`;
        }
      }
    }
    const distinct = new Set(w).size;
    const coverOk = w.length >= 1 && (w.length === 1 || distinct > 1);
    diffs += d + (coverOk ? 0 : 1);
    results.push({ key, n: w.length, distinct, diffs: d, coverOk, first });
  }
  const allWeb = Object.values(web.out).flat().map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n');
  // R-RUSTPORT-REPIN-WEB-UI-3-C-Q1: po repinie `buildModeHud.ts` na web 9b019a7d8 (odniesienie `WEB86U3`) przycisk „Wyłącz filtr”
  // usunięto (R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1) — znacznik jego callbacku NIE_DOTYCZY, gdy web go nie ma (jawnie w logu).
  const bmWebSrc = readFileSync(join(WEB_SRC, 'ui/buildModeHud.ts'), 'utf8');
  const notApplicable = bmWebSrc.includes('data-ulepszenia-unspent-disable-filter') ? [] : ['LOG:onUnspentBudgetDisableFilter'];
  if (notApplicable.length) console.log(`MARKERS NIE_DOTYCZY (web bez „Wyłącz filtr”, UI-3-C): ${notApplicable.join(' | ')}`);
  const missing = MARKERS.filter((m) => !notApplicable.includes(m) && !allWeb.includes(m));
  const hexWeb = web.out.hex.join('\n');
  const stillThere = GONE.filter((g) => hexWeb.includes(g));
  diffs += missing.length + stillThere.length;
  const failedAsserts = port.asserts.filter(([, ok]) => !ok);
  diffs += failedAsserts.length;

  // PIX: sceny × rozdzielczości.
  const pix = [];
  for (const scene of SCENES) for (const [w, h] of VIEWPORTS) {
    const png = {};
    for (const side of ['web', 'port']) {
      const page = pages[side];
      await page.setViewportSize({ width: w, height: h });
      await page.evaluate(SCENE_RUNNER, [side, scene, COMMON, side === 'port' ? dtoStr : null, SCENE.toString()]);
      // Animacje wejścia (`pb-scrimIn .24s`, `pb-fadeIn .22s`) i obrazy (portrety) — zrzut dopiero po ustaleniu się sceny.
      await page.waitForFunction(() => [...document.images].every((im) => im.complete), null, { timeout: 30000 });
      await page.waitForTimeout(800);
      png[side] = await page.screenshot({ fullPage: false });
    }
    const eq = Buffer.compare(png.web, png.port) === 0;
    if (!eq) diffs++;
    const sha = createHash('sha256').update(png.web).digest('hex');
    pix.push({ scene, vp: `${w}x${h}`, eq, bytes: png.web.length, sha });
    if (PNG_DIR) {
      mkdirSync(PNG_DIR, { recursive: true });
      for (const side of ['web', 'port']) writeFileSync(join(PNG_DIR, `ui2d-${scene.replace(/[^a-z]/gi, '')}-${w}x${h}-${side}.png`), png[side]);
    }
  }
  if (pageErrors.length) diffs += pageErrors.length;

  for (const r of results) {
    console.log(`${r.key.padEnd(16)} przypadki=${String(r.n).padStart(5)} różne_wyniki=${String(r.distinct).padStart(5)} różnice=${r.diffs}${r.coverOk ? '' : ' COVER-FAIL'}${r.first ? ' ' + r.first : ''}`);
  }
  for (const p of pix) console.log(`PIX ${p.scene.padEnd(13)} ${p.vp.padEnd(9)} ${p.eq ? 'identyczny' : 'RÓŻNY'} (PNG ${p.bytes} B, sha256 ${p.sha.slice(0, 16)}…)`);
  console.log(`MARKERS ${MARKERS.length - missing.length}/${MARKERS.length}${missing.length ? ' BRAK: ' + missing.join(' | ') : ''}; usunięte teksty w tooltipie web: ${stillThere.length ? stillThere.join(' | ') : 'brak (OK)'}`);
  for (const [n, ok] of port.asserts) console.log(`ASSERT ${ok ? 'OK ' : 'FAIL'} ${n}`);
  console.log(`pageerror/console.error: ${pageErrors.length}${pageErrors.length ? ' ' + pageErrors.slice(0, 5).join(' | ') : ''}`);
  console.log(`Chromium: ${ua}`);
  const vecHashes = Object.fromEntries(Object.entries(web.out).map(([k, arr]) => [k, arr.map((x) => createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex').slice(0, 24))]));
  const webHash = createHash('sha256').update(JSON.stringify(web.out)).digest('hex');
  if (OUT) {
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-UI-2-D-Q1', source: 'web origin/main 86d510c66 (Chromium)', chromium: ua, webVectorsSha256: webHash,
      png: pix, vectorSha256Prefix24: vecHashes }, null, 1) + '\n');
  }
  const nCases = results.reduce((a, r) => a + r.n, 0);
  console.log(`run-repin-ui2d: modułów=${MODULES.length} grup=${results.length} przypadków=${nCases} png=${pix.length} różnic=${diffs} webVectorsSha256=${webHash}`);
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

/** Uruchamia `SCENE` (przekazane jako tekst) w stronie. */
function SCENE_RUNNER([side, scene, common, dtoStr, src]) {
  // eslint-disable-next-line no-new-func
  const f = new Function(`return (${src});`)();
  return f(side, scene, common, dtoStr);
}
