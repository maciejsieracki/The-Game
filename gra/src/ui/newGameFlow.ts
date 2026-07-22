/**
 * newGameFlow.ts
 * New-game wizard (UI task 5) — port of Makieta-flow-nowa-gra.html.
 * 5 kroki: Intro -> Epoka -> Cywilizacja -> Ustawienia -> Generowanie.
 *
 * Visual language: dark + gold, Palatino serif (jak menu glowne / makieta).
 * DECOUPLED: lista cywilizacji z danych gry (civs.json przez loader), reszta to
 * UI + jeden callback onStart(params).  Co robi onStart (generacja mapy, start
 * rozgrywki) = silnik.
 *
 * LANE: src/ui/* only.  Wpiecie (showNewGameFlow z menu "Nowa Gra", a onStart ->
 * generacja + przejscie do mapy) robi SILNIK.
 *
 * UWAGA: ustawienia rozgrywki (trudnosc/mapa/rywale/predkosc) ladowane z
 * ui-params.json (sekcja nowa_gra) przez UI_PARAMS.
 *
 * Source: literalny UTF-8 dla polskich napisow; symbole przez encje HTML.
 */

import { loadGameData, type GameData } from '../data/loader';
import {
  isCivAvailableAtGameEpoch,
  type CivEntryEpochRow,
} from '../game/civ-entry-epoch';
import { CIV_BRAND_SCOPE_VARS, ensureBrandRootTokens } from './brandTokenVars';
import { UI_PARAMS } from './uiParams';
import {
  DEFAULT_PLAYER_CIV_ID,
  DEFAULT_START_EPOCH_ID,
  DEFAULT_RENDER_QUALITY,
  bundledMapQualityFromLabel,
  civTypesMenuForMapLabel,
  defaultCivTypesFromMapLabel,
  defaultMiastaPanstwaFromMapLabel,
  clampMiastaPanstwaCount,
  miastaPanstwaMenuForMapLabel,
  qualityTierFromLabel,
  qualityTierToLabel,
  typSwiataFromMenuLabel,
  worldGenerationPresetFromLabels,
  LAND_FRACTION_PERCENT_OPTS,
  defaultLandFractionPercentForTyp,
  type LandFractionPercent,
  type QualityTier,
  type WorldGenerationPreset,
} from '../map/newGameMapDefaults';
import { buildStartPreview, startPreviewSummaryRows, type StartPreview } from '../game/start-preview';
import type { BuildingCostPace } from '../game/building-cost-tempo';
import type { KosztJednostekPace } from '../game/unit-cost-tempo';
import type { WzrostLudnosciPace } from '../game/population-growth-tempo';
import { civIconSvg, epochIconSvg, newGameIntroEmblemSvg, settingIconSvg } from './icons/brandAssets';
import heroIntroUrl from './assets/hero/hero-intro.png?url';

// ---------------------------------------------------------------------------
// Typy publiczne
// ---------------------------------------------------------------------------

export interface CivOption {
  id: string;
  name: string;
  styl?: string;
  superJednostka?: string;
  bonusy?: string[];
  religia?: string;
  typGlowny?: string;
  /** epokaWejscia — kanon kaskady (D-CYW-EPOKA-WEJSCIA). */
  epokaWejscia: string;
  /** Legacy — min = epokaWejscia. */
  epokiStartowe: string[];
  /** Kolor nacji (#RRGGBB) z civs.json. */
  kolorHex?: string;
}

export interface NewGameParams {
  /** ikonaId z civs.json (np. rzymianie) — NIE etykieta PL. */
  civId: string;
  civName: string;
  /** Etykieta PL epoki (np. Epoka Kamienia). */
  epoch: string;
  /** Id epoki dla silnika: kamien | braz | zelazo. */
  epochId: string;
  difficulty: string;
  mapSize: string;
  rivals: string;
  speed: string;
  /** Etykieta menu typu świata (np. Kontynenty). */
  worldType: string;
  /** Klucz silnika: kontynenty | pangea | wyspy | ziemia. */
  typSwiata: string;
  seed: number;
  /** Etykieta PL: Niska | Średnia | Wysoka — preset wyglądu mapy (MAPA). */
  mapQualityLabel: string;
  mapQuality: QualityTier;
  /** Etykieta PL: Niska | Średnia | Wysoka */
  renderQualityLabel: string;
  /** Etykieta PL: Niska | Średnia | Wysoka */
  mapDetailQualityLabel: string;
  renderQuality: QualityTier;
  mapDetailQuality: QualityTier;
  /** Liczba głównych typów cywilizacji na mapie (suwak głównej siatki). */
  civTypesCount: number;
  /** Miasta-państwa w klastrze gracza (suwak głównej siatki). */
  cityStatesCount: number;
  /** Gęstość generatora (zaawansowane — E2). */
  worldDensity: WorldGenerationPreset;
  worldDensityLabels: {
    resources: string;
    rivers: string;
    desert: string;
    forest: string;
    relief: string;
  };
  /** Zaawansowane opcje kreatora (decyzja Macieja B, 2026-06-27). */
  advanced?: NewGameAdvancedOptions;
  /** Udział lądu w % (reszta morze) — z zaawansowanych opcji. */
  landFractionPercent: number;
  /** Podgląd startu klastra (E1/D-START) — z kreatora do SILNIK. */
  startPreview?: StartPreview;
}

/** Decyzja B — modal „Zaawansowane opcje” krok 4. */
export type BarbariansLevel = 'wielu' | 'nieliczni' | 'wylaczeni';
export type VictoryMode = 'moc' | 'dominacja' | 'moc_i_dominacja';

export interface NewGameAdvancedOptions {
  barbariansLevel: BarbariansLevel;
  battleAlwaysManual: boolean;
  victoryMode: VictoryMode;
  /** Koszty budynkow: niski x1 / normalny x2 / wysoki x4 (bazowy = niski). */
  buildingCostPace: BuildingCostPace;
  /** Koszty jednostek: niski x1 / normalny x2 / wysoki x4 (bazowy = niski). */
  kosztJednostekPace: KosztJednostekPace;
  /** Wzrost ludnosci: wysoki x1 / normalny x2 / wolny x4 (bazowy prog = wysoki). */
  wzrostLudnosciPace: WzrostLudnosciPace;
  /** Procent lądu (20–80); reszta morze. */
  landFractionPercent: LandFractionPercent;
  /** Gdy false — przy zmianie typu świata ustaw domyślny udział lądu. */
  landFractionCustom: boolean;
}

const DEFAULT_ADVANCED: NewGameAdvancedOptions = {
  barbariansLevel: 'wielu',
  battleAlwaysManual: false,
  victoryMode: 'moc_i_dominacja',
  buildingCostPace: 'niski',
  kosztJednostekPace: 'niski',
  wzrostLudnosciPace: 'wysoki',
  landFractionPercent: 30,
  landFractionCustom: false,
};

/** Kanon v1 (2026-07-07) — stabilny klucz localStorage kreatora. */
const NEWGAME_PREFS_KEY = 'civ-new-game-prefs-v1';
/** Legacy (Grupa E) — odczyt migracyjny, zapis tylko do v1. */
const NEWGAME_PREFS_KEY_LEGACY = 'civ-newgame-prefs-v2';

interface SavedNewGamePrefs {
  v: 3;
  selEpoch: string;
  selCiv: string | null;
  /** Indeksy opcji (legacy / fallback). */
  settings: Record<string, number>;
  /** Etykiety PL opcji — preferowane przy wczytywaniu (odporne na skalowanie mapy). */
  settingLabels: Record<string, string>;
  advanced: NewGameAdvancedOptions;
}

/** Zapis tylko po zmianie użytkownika — unikamy nadpisywania prefs domyślnymi przy otwarciu kreatora. */
let prefsDirty = false;

function getPrefsStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readStoredNewGamePrefsRaw(): string | null {
  const storage = getPrefsStorage();
  if (!storage) return null;
  return storage.getItem(NEWGAME_PREFS_KEY) ?? storage.getItem(NEWGAME_PREFS_KEY_LEGACY);
}

function saveNewGamePrefs(): void {
  if (!prefsDirty) return;
  const storage = getPrefsStorage();
  if (!storage) return;
  try {
    const settings: Record<string, number> = {};
    const settingLabels: Record<string, string> = {};
    for (const s of SETT) {
      settings[s.key] = s.idx;
      settingLabels[s.key] = s.opts[s.idx] ?? '';
    }
    const payload: SavedNewGamePrefs = {
      v: 3,
      selEpoch,
      selCiv,
      settings,
      settingLabels,
      advanced: { ...advOpts },
    };
    storage.setItem(NEWGAME_PREFS_KEY, JSON.stringify(payload));
    prefsDirty = false;
  } catch {
    /* prywatny tryb / brak localStorage */
  }
}

function markNewGamePrefsDirtyAndSave(): void {
  prefsDirty = true;
  saveNewGamePrefs();
}

function flushNewGamePrefs(): void {
  prefsDirty = true;
  saveNewGamePrefs();
}

function migrateAdvanced(raw: Record<string, unknown>): NewGameAdvancedOptions {
  const base = { ...DEFAULT_ADVANCED };
  if (typeof raw.landFractionPercent === 'number') {
    base.landFractionPercent = raw.landFractionPercent as LandFractionPercent;
  }
  if (typeof raw.landFractionCustom === 'boolean') base.landFractionCustom = raw.landFractionCustom;
  if (typeof raw.battleAlwaysManual === 'boolean') base.battleAlwaysManual = raw.battleAlwaysManual;
  if (raw.barbariansLevel === 'wielu' || raw.barbariansLevel === 'nieliczni' || raw.barbariansLevel === 'wylaczeni') {
    base.barbariansLevel = raw.barbariansLevel;
  } else if (raw.barbariansEnabled === false) {
    base.barbariansLevel = 'wylaczeni';
  }
  if (raw.victoryMode === 'moc' || raw.victoryMode === 'dominacja' || raw.victoryMode === 'moc_i_dominacja') {
    base.victoryMode = raw.victoryMode;
  } else if (raw.victoryPowerAndDominance === false) {
    base.victoryMode = 'dominacja';
  } else if (raw.victoryPowerAndDominance === true) {
    base.victoryMode = 'moc_i_dominacja';
  }
  if (raw.buildingCostPace === 'niski' || raw.buildingCostPace === 'normalny' || raw.buildingCostPace === 'wysoki') {
    base.buildingCostPace = raw.buildingCostPace;
  }
  if (raw.kosztJednostekPace === 'niski' || raw.kosztJednostekPace === 'normalny' || raw.kosztJednostekPace === 'wysoki') {
    base.kosztJednostekPace = raw.kosztJednostekPace;
  }
  if (raw.wzrostLudnosciPace === 'wysoki' || raw.wzrostLudnosciPace === 'normalny' || raw.wzrostLudnosciPace === 'wolny') {
    base.wzrostLudnosciPace = raw.wzrostLudnosciPace;
  }
  return base;
}

function applySettingLabel(key: string, label: string | undefined): boolean {
  if (!label) return false;
  const row = SETT.find(x => x.key === key);
  if (!row) return false;
  const idx = row.opts.indexOf(label);
  if (idx < 0) return false;
  row.idx = idx;
  return true;
}

function applySettingFromPrefs(
  parsed: SavedNewGamePrefs & { v?: number; settingLabels?: Record<string, string> },
  key: string,
): void {
  const labels = parsed.settingLabels;
  if (labels && typeof labels[key] === 'string' && applySettingLabel(key, labels[key])) return;
  const idx = parsed.settings?.[key];
  const row = SETT.find(x => x.key === key);
  if (!row || typeof idx !== 'number') return;
  if (idx >= 0 && idx < row.opts.length) row.idx = idx;
}

function loadNewGamePrefs(): void {
  try {
    const raw = readStoredNewGamePrefsRaw();
    if (!raw) return;
    const parsed = JSON.parse(raw) as SavedNewGamePrefs & { v?: number; settingLabels?: Record<string, string> };
    if (parsed.selEpoch && EPOCHS.some(e => e.id === parsed.selEpoch)) selEpoch = parsed.selEpoch;
    if (parsed.selCiv) selCiv = parsed.selCiv;
    if (parsed.settings && typeof parsed.settings === 'object') {
      applySettingFromPrefs(parsed, 'map_size');
      syncMapScaleOptions();
      for (const s of SETT) {
        if (s.key === 'map_size') continue;
        applySettingFromPrefs(parsed, s.key);
      }
    }
    if (parsed.advanced && typeof parsed.advanced === 'object') {
      advOpts = migrateAdvanced(parsed.advanced as unknown as Record<string, unknown>);
    }
    migrateAdvLandFractionFromLegacy();
    syncAdvLandFromWorldType();
    ensureSelCivForEpoch();
  } catch {
    /* ignore corrupt prefs — nie zapisuj domyślnych nadpisując stare dane */
  }
}

function syncAdvLandFromWorldType(): void {
  if (advOpts.landFractionCustom) return;
  const worldLabel = settingValue('world_type') || 'Kontynenty';
  advOpts.landFractionPercent = defaultLandFractionPercentForTyp(typSwiataFromMenuLabel(worldLabel));
}

/** Zmiana typu świata → domyślny udział lądu per typ (chyba że gracz znów ruszy suwak). */
function resetAdvLandOnWorldTypeChange(): void {
  const worldLabel = settingValue('world_type') || 'Kontynenty';
  advOpts.landFractionPercent = defaultLandFractionPercentForTyp(typSwiataFromMenuLabel(worldLabel));
  advOpts.landFractionCustom = false;
}

/** Stary kanon 20% lądu (2026-07-04) → per typ przy wczytaniu prefs. */
function migrateAdvLandFractionFromLegacy(): void {
  if (advOpts.landFractionCustom) return;
  if (advOpts.landFractionPercent === 20) {
    syncAdvLandFromWorldType();
  }
}

function landFractionOptLabels(): string[] {
  return LAND_FRACTION_PERCENT_OPTS.map((p) => `${p}% lądu / ${100 - p}% morze`);
}

interface AdvSettingRow {
  key: string;
  lbl: string;
  hint: string;
  opts: string[];
  /** Dla pól boolean — indeks 0 = true-ish, 1 = false-ish */
  getIdx: () => number;
  setIdx: (i: number) => void;
}

let advOpts: NewGameAdvancedOptions = { ...DEFAULT_ADVANCED };

export interface NewGameFlowConfig {
  data?: GameData;
  /** Nadpisanie listy cywilizacji; domyslnie z data.civs. */
  getCivs?: () => CivOption[];
  /** Silnik startuje gre z wybranymi parametrami. */
  onStart: (params: NewGameParams) => void;
  /** Powrot do menu glownego (przycisk Wstecz na kroku 1). */
  onCancel?: () => void;
}

let cfg: NewGameFlowConfig | null = null;

// ---------------------------------------------------------------------------
// Dane
// ---------------------------------------------------------------------------

let cachedData: GameData | null = null;
function gameData(): GameData | null {
  if (cfg && cfg.data) return cfg.data;
  if (cachedData) return cachedData;
  try { cachedData = loadGameData(); } catch { cachedData = null; }
  return cachedData;
}

const DEFAULT_CIV_START_EPOCHS = ['kamien', 'braz', 'zelazo'] as const;
const START_EPOCH_ORDER = ['kamien', 'braz', 'zelazo'] as const;

function startEpochIndex(epochId: string): number {
  const i = START_EPOCH_ORDER.indexOf(epochId as (typeof START_EPOCH_ORDER)[number]);
  return i >= 0 ? i : START_EPOCH_ORDER.length;
}

/** Najwcześniejsza epoka startu z civs.json (min z epokiStartowe). */
function civMinStartEpochIndex(c: CivOption): number {
  if (c.epokiStartowe.length === 0) return 0;
  return Math.min(...c.epokiStartowe.map(startEpochIndex));
}

function parseEpokiStartowe(raw: Record<string, unknown>): string[] {
  const arr = raw['epokiStartowe'];
  if (!Array.isArray(arr)) {
    const ew = raw['epokaWejscia'];
    if (typeof ew === 'string' && ew.length > 0) return [ew];
    return [...DEFAULT_CIV_START_EPOCHS];
  }
  const out = arr.filter((x): x is string => typeof x === 'string' && x.length > 0);
  return out.length > 0 ? out : [...DEFAULT_CIV_START_EPOCHS];
}

function parseEpokaWejscia(raw: Record<string, unknown>, epokiStartowe: string[]): string {
  const ew = raw['epokaWejscia'];
  if (typeof ew === 'string' && ew.length > 0) return ew;
  return epokiStartowe[0] ?? 'kamien';
}

function civsFromData(data: GameData): CivOption[] {
  const list = data.civs && data.civs.cywilizacje ? data.civs.cywilizacje : [];
  return list
    .filter(c => !!c.Cywilizacja)
    .map(c => {
      const raw = c as unknown as Record<string, unknown>;
      const ikonaId = typeof raw['ikonaId'] === 'string' ? raw['ikonaId'] : c.Cywilizacja;
      const religia = typeof raw['Religia'] === 'string' ? raw['Religia'] : undefined;
      const typGlowny = typeof raw['Typ główny'] === 'string' ? raw['Typ główny'] : undefined;
      const bonusyFromJson = Array.isArray(raw['bonusy'])
        ? (raw['bonusy'] as Array<{ opis?: string }>)
            .map(b => (typeof b.opis === 'string' ? b.opis.trim() : ''))
            .filter(s => s.length > 0)
        : [];
      const legacyBonusy = [c['Bonus startowy'], c['Bonusy/minusy (do dopracowania)']]
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
      const epokiStartowe = parseEpokiStartowe(raw);
      const kolorHex = typeof raw['kolorHex'] === 'string' ? raw['kolorHex'] : undefined;
      return {
        id: ikonaId,
        name: c.Cywilizacja,
        styl: c['Styl / charakter'] ?? undefined,
        superJednostka: c['Jednostka specjalna'] ?? undefined,
        bonusy: bonusyFromJson.length > 0 ? bonusyFromJson : legacyBonusy,
        religia,
        typGlowny,
        epokaWejscia: parseEpokaWejscia(raw, epokiStartowe),
        epokiStartowe,
        kolorHex,
      };
    });
}

function civs(): CivOption[] {
  if (cfg && cfg.getCivs) return cfg.getCivs();
  const data = gameData();
  return data ? civsFromData(data) : [];
}

/** Cywilizacja dostępna, gdy wybrana epoka gry >= jej najwcześniejszej epoki startu. */
function civAvailableAtEpoch(c: CivOption, selectedEpochId: string): boolean {
  return civMinStartEpochIndex(c) <= startEpochIndex(selectedEpochId);
}

function civsForEpoch(epochId: string): CivOption[] {
  return civs().filter(c => civAvailableAtEpoch(c, epochId));
}

function epochHasCivs(epochId: string): boolean {
  return civsForEpoch(epochId).length > 0;
}

function ensureSelCivForEpoch(): void {
  const list = civsForEpoch(selEpoch);
  if (list.length === 0) {
    selCiv = null;
    return;
  }
  if (!selCiv || !list.some(c => c.id === selCiv)) {
    const preferred = list.find(c => c.id === DEFAULT_PLAYER_CIV_ID);
    selCiv = preferred?.id ?? list[0]!.id;
  }
}

interface EpochOption { id: string; name: string; icon: string; flavor: string; avail: boolean; badge: string; }
const EPOCHS: EpochOption[] = [
  { id: 'kamien', name: 'Epoka Kamienia', icon: 'K', flavor: 'Pierwsze osady, kamienne narzedzia. Fundamenty imperium.', avail: true, badge: 'Dostepna' },
  { id: 'braz', name: 'Epoka Brazu', icon: 'B', flavor: 'Metalurgia i pierwsze armie. Rydwany, mury, wczesna dyplomacja.', avail: true, badge: 'Dostepna' },
  { id: 'zelazo', name: 'Epoka Zelaza', icon: 'Z', flavor: 'Hartowane ostrza, potezne legiony, szlaki handlowe. Start: cale Kamien + caly Braz juz zbadane.', avail: true, badge: 'Dostepna' },
];

/** Medalion cywilizacji (Brand Book W1b — SVG z civ-icon-map). */
function civMedallionHtml(
  ikonaId: string,
  active: boolean,
  variant: 'card' | 'detail',
  kolorHex?: string,
): string {
  const size = variant === 'detail' ? 28 : 24;
  const dim = variant === 'detail' ? 58 : 52;
  const cls = 'tg-medallion' + (active ? ' tg-medallion--active' : '');
  const border = kolorHex ? `border-color:${kolorHex};` : '';
  const svg = civIconSvg(ikonaId, size);
  return `<span class="${cls}" style="width:${dim}px;height:${dim}px;flex-shrink:0;${border}">${svg}</span>`;
}

/** Medalion epoki (Brand Book W1e — SVG z epoch-icon-map). */
function epochMedallionHtml(epochId: string, active: boolean): string {
  const cls = 'tg-medallion' + (active ? ' tg-medallion--active' : '');
  const svg = epochIconSvg(epochId, 40);
  return `<span class="${cls}" style="width:64px;height:64px;flex-shrink:0;">${svg}</span>`;
}
const SETTING_GLYPHS: Record<string, string> = {
  difficulty: 'Tr',
  map_size: 'Mx',
  world_type: 'Sw',
  city_states_count: 'MP',
  civ_types_count: 'Cy',
  game_speed: 'Tp',
  map_quality: 'Gf',
  resources_density: 'Su',
  rivers_density: 'Rz',
  desert_density: 'Ps',
  forest_density: 'Ls',
  relief_density: 'Gw',
};

function settingIcon(key: string): string {
  const svg = settingIconSvg(key, 20);
  if (svg) return svg;
  const g = SETTING_GLYPHS[key] ?? 'Op';
  return '<span class="ng-glyph ng-glyph-sm">' + g + '</span>';
}

function bonusRowClass(text: string): 'bp' | 'bm' {
  const t = text.toLowerCase();
  if (/^[-−]|słab|slab|brak |trudn|wolniej|wysokie koszty|gorsz/.test(t)) return 'bm';
  return 'bp';
}

function appendBonusRow(parent: HTMLElement, text: string): void {
  const row = el('div', 'bonus ' + bonusRowClass(text));
  row.innerHTML = '<div class="bdot"></div><span></span>';
  (row.querySelector('span') as HTMLElement).textContent = text;
  parent.appendChild(row);
}

interface Setting { key: string; lbl: string; opts: string[]; descs: string[]; idx: number; }
const SETT: Setting[] = UI_PARAMS.nowa_gra.ustawienia.map(s => ({
  key: s.key,
  lbl: s.label,
  opts: [...s.opts],
  descs: [...s.descs],
  idx: s.domyslny,
}));

/** Skaluje opcje miast-państw do wybranej wielkości mapy. */
function syncMiastaPanstwaOptions(): void {
  const mapRow = SETT.find(x => x.key === 'map_size');
  const cityRow = SETT.find(x => x.key === 'city_states_count');
  if (!mapRow || !cityRow) return;
  const mapLabel = mapRow.opts[mapRow.idx] ?? 'Standardowy';
  const bundle = miastaPanstwaMenuForMapLabel(mapLabel);
  const prev = cityRow.opts[cityRow.idx];
  cityRow.opts = bundle.opts;
  cityRow.descs = bundle.descs;
  const keepIdx = prev != null ? bundle.opts.indexOf(prev) : -1;
  cityRow.idx = keepIdx >= 0 ? keepIdx : bundle.domyslny;
}

function syncCivTypesOptions(): void {
  const mapRow = SETT.find(x => x.key === 'map_size');
  const civRow = SETT.find(x => x.key === 'civ_types_count');
  if (!mapRow || !civRow) return;
  const mapLabel = mapRow.opts[mapRow.idx] ?? 'Standardowy';
  const bundle = civTypesMenuForMapLabel(mapLabel);
  const prev = civRow.opts[civRow.idx];
  civRow.opts = bundle.opts;
  civRow.descs = bundle.descs;
  const keepIdx = prev != null ? bundle.opts.indexOf(prev) : -1;
  civRow.idx = keepIdx >= 0 ? keepIdx : bundle.domyslny;
}

function syncMapScaleOptions(): void {
  syncMiastaPanstwaOptions();
  syncCivTypesOptions();
}

function resetSettingsFromParams(): void {
  SETT.length = 0;
  for (const s of UI_PARAMS.nowa_gra.ustawienia) {
    SETT.push({
      key: s.key,
      lbl: s.label,
      opts: [...s.opts],
      descs: [...s.descs],
      idx: s.domyslny,
    });
  }
  syncMapScaleOptions();
  advOpts = { ...DEFAULT_ADVANCED };
}

// ---------------------------------------------------------------------------
// Stan
// ---------------------------------------------------------------------------

let rootEl: HTMLDivElement | null = null;
let curStep = 1;
let selCiv: string | null = null;
let selEpoch = 'kamien';

// ---------------------------------------------------------------------------
// Style (scoped .civ-newgame)
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-newgame-css-v2';
function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-newgame-css')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-newgame{position:fixed;inset:0;z-index:500;overflow:auto;
  ${CIV_BRAND_SCOPE_VARS}
  background:var(--bg-deep);color:var(--tx);font-family:var(--civ-font-title);
  display:flex;flex-direction:column;}
.civ-newgame *{box-sizing:border-box;}
.civ-newgame .hdr{text-align:center;padding:1.8rem 2rem 1rem;border-bottom:1px solid var(--bd-sub);position:relative;}
.civ-newgame .hdr-menu-back{position:absolute;left:1.2rem;top:50%;transform:translateY(-50%);
  background:transparent;border:1px solid var(--bd-mid);color:var(--tx2);padding:7px 14px;border-radius:var(--radius);
  cursor:pointer;font-family:Arial,sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;}
.civ-newgame .hdr-menu-back:hover{border-color:var(--gold);color:var(--gold-light);background:rgba(201,168,76,.06);}
.civ-newgame .hdr .lab{font-size:10px;letter-spacing:.5em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .hdr h1{font-size:34px;font-weight:400;letter-spacing:.18em;color:var(--gold-light);text-shadow:0 0 50px rgba(201,168,76,.28);margin-top:4px;}
.civ-newgame .stepbar{display:flex;align-items:center;justify-content:center;padding:1rem;background:#12121A;border-bottom:1px solid var(--bd-sub);flex-wrap:wrap;}
.civ-newgame .si{display:flex;align-items:center;cursor:pointer;}
.civ-newgame .si-b{display:flex;align-items:center;gap:8px;padding:5px 14px;border-radius:20px;border:1px solid transparent;}
.civ-newgame .si-n{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--tx-muted);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--tx-muted);font-family:Arial,sans-serif;}
.civ-newgame .si-l{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--tx-muted);font-family:Arial,sans-serif;}
.civ-newgame .si.active .si-b{border-color:var(--bd-mid);background:rgba(201,168,76,.08);}
.civ-newgame .si.active .si-n{border-color:var(--gold);background:var(--gold);color:#0A0A0F;font-weight:700;}
.civ-newgame .si.active .si-l{color:var(--gold);}
.civ-newgame .si.done .si-n{border-color:var(--gold-dim);color:var(--gold-dim);}
.civ-newgame .si-c{width:26px;height:1px;background:var(--bd-sub);margin:0 3px;}
.civ-newgame .flow-body{flex:0 0 auto;max-width:1000px;width:100%;margin:0 auto;padding:0 0 1.25rem;}
.civ-newgame .content{flex:0 0 auto;padding:1.4rem 2rem 0.25rem;max-width:1000px;width:100%;margin:0 auto;}
.civ-newgame .sh{text-align:center;margin-bottom:1.6rem;}
.civ-newgame .sh h2{font-size:24px;font-weight:400;letter-spacing:.1em;color:var(--gold-light);}
.civ-newgame.hero-flow{background:transparent;}
.civ-newgame .hero-bg{position:fixed;inset:0;z-index:0;pointer-events:none;}
.civ-newgame .hero-bg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;display:block;}
.civ-newgame .hero-bg .hero-veil-radial{position:absolute;inset:0;background:radial-gradient(1200px 900px at 50% 38%,rgba(8,10,18,.68),rgba(8,10,18,.45) 45%,rgba(8,10,18,.82) 100%);}
.civ-newgame .hero-bg .hero-veil-linear{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,10,18,.45),transparent 18%,transparent 58%,rgba(8,10,18,.92));}
.civ-newgame.hero-flow .hdr,
.civ-newgame.hero-flow .stepbar,
.civ-newgame.hero-flow .flow-body,
.civ-newgame.hero-flow .content,
.civ-newgame.hero-flow .nav{position:relative;z-index:2;}
.civ-newgame.hero-flow .hdr{background:transparent;border-bottom-color:rgba(201,168,76,.12);}
.civ-newgame.hero-flow .stepbar{background:rgba(18,18,26,.72);backdrop-filter:blur(4px);border-bottom-color:rgba(201,168,76,.12);}
.civ-newgame.hero-flow .nav{background:rgba(18,18,26,.72);backdrop-filter:blur(4px);border-top-color:rgba(201,168,76,.12);}
.civ-newgame.hero-flow .sh h2{text-shadow:0 2px 12px rgba(0,0,0,.85);}
.civ-newgame.hero-flow .card,
.civ-newgame.hero-flow .ec,
.civ-newgame.hero-flow .srow,
.civ-newgame.hero-flow .detail,
.civ-newgame.hero-flow .civ-grid-panel,
.civ-newgame.hero-flow .epoch-info,
.civ-newgame.hero-flow .gp,
.civ-newgame.hero-flow .gen-visual,
.civ-newgame.hero-flow .start-preview{background:rgba(18,18,26,.84);backdrop-filter:blur(8px);}
.civ-newgame.hero-flow .card.sel,
.civ-newgame.hero-flow .ec.sel{background:rgba(28,24,14,.88);}
.civ-newgame.hero-flow .card:hover:not(.sel),
.civ-newgame.hero-flow .ec:hover:not(.lock):not(.sel){background:rgba(22,22,30,.9);}
.civ-newgame.hero-flow .intro{min-height:min(62vh,520px);justify-content:center;padding:1rem 0 2rem;}
.civ-newgame.hero-flow .intro .em{width:104px;height:104px;border:2px solid var(--gold-dim);
  background:radial-gradient(circle at 40% 34%,rgba(21,27,38,.85),rgba(8,10,18,.7));
  box-shadow:inset 0 2px 6px rgba(232,216,138,.22),0 0 40px rgba(232,216,138,.2),0 6px 24px rgba(0,0,0,.6);backdrop-filter:blur(2px);}
.civ-newgame.hero-flow .intro .em svg{width:58px;height:58px;}
.civ-newgame.hero-flow .intro .big{font-size:clamp(42px,7vw,82px);letter-spacing:.16em;text-shadow:0 3px 20px rgba(0,0,0,.85),0 0 44px rgba(232,216,138,.22);}
.civ-newgame.hero-flow .intro .sub{font-size:14px;letter-spacing:.28em;color:#c8b898;margin:18px 0 22px;text-shadow:0 2px 8px rgba(0,0,0,.8);}
.civ-newgame.hero-flow .intro .cta-hero{display:inline-flex;align-items:center;gap:12px;margin-top:30px;height:64px;padding:0 48px;
  background:linear-gradient(180deg,#f0dc88,#b99a28);border:1px solid #6a5212;border-top-color:#f8eea8;color:#2e2708;
  font-size:16px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;border-radius:8px;cursor:pointer;font-family:var(--civ-font-ui);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 8px 26px rgba(0,0,0,.5);}
.civ-newgame.hero-flow .intro .cta-hero:hover{filter:brightness(1.05);}
.civ-newgame.hero-flow .intro .cta-menu-back{display:inline-block;margin-top:14px;background:transparent;border:1px solid rgba(201,168,76,.35);
  color:var(--tx2);padding:9px 22px;border-radius:var(--radius);cursor:pointer;font-family:Arial,sans-serif;
  font-size:11px;letter-spacing:.14em;text-transform:uppercase;}
.civ-newgame.hero-flow .intro .cta-menu-back:hover{border-color:var(--gold);color:var(--gold-light);}
.civ-newgame .intro{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:280px;text-align:center;gap:1.2rem;}
.civ-newgame .intro .em{width:72px;height:72px;border-radius:50%;border:2px solid var(--bd-mid);display:flex;align-items:center;justify-content:center;color:var(--gold-light);background:rgba(201,168,76,.08);box-shadow:0 0 28px rgba(201,168,76,.12);}
.civ-newgame .intro .em svg{display:block;}
.civ-newgame .big{font-size:42px;letter-spacing:.2em;color:var(--gold-light);}
.civ-newgame .sub{font-size:11px;letter-spacing:.4em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .intro p{max-width:540px;font-size:14px;line-height:1.7;color:var(--tx2);font-style:italic;}
.civ-newgame .civ-layout{display:grid;grid-template-columns:1fr min(360px,34vw);gap:1.5rem;align-items:stretch;}
.civ-newgame .civ-grid-panel{background:var(--bg-card);border:1px solid var(--bd-sub);border-radius:var(--radius-lg);padding:14px;display:flex;flex-direction:column;height:100%;min-height:360px;}
.civ-newgame .civ-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:10px;align-content:start;flex:1;}
.civ-newgame .card{background:var(--bg-card);border:1.5px solid var(--bd-sub);border-radius:var(--radius-lg);padding:14px 8px;text-align:center;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;transition:all .18s;}
.civ-newgame .card:hover{border-color:var(--bd-mid);background:var(--bg-card-h);transform:translateY(-1px);}
.civ-newgame .card.sel{border-color:var(--gold);background:var(--bg-sel);box-shadow:0 0 0 1px rgba(201,168,76,.18),inset 0 0 18px rgba(201,168,76,.06);}
.civ-newgame .card .tg-medallion svg{display:block;}
.civ-newgame .civ-dh .tg-medallion svg{display:block;}
.civ-newgame .cn{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;line-height:1.3;}
.civ-newgame .card.sel .cn{color:var(--gold);}
.civ-newgame .detail{background:var(--bg-card);border:1px solid var(--bd-sub);border-radius:var(--radius-lg);padding:1.35rem;display:flex;flex-direction:column;gap:1rem;height:100%;min-height:360px;}
.civ-newgame .detail .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;color:var(--tx-muted);gap:10px;font-size:13px;text-align:center;font-style:italic;padding:2rem 1rem;}
.civ-newgame .detail .empty .arr{font-size:28px;opacity:.35;line-height:1;}
.civ-newgame .civ-dh{display:flex;align-items:center;gap:14px;padding-bottom:1rem;border-bottom:1px solid var(--bd-sub);}
.civ-newgame .civ-dmeta{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--tx-muted);font-family:Arial,sans-serif;margin-top:3px;}
.civ-newgame .dn{font-size:20px;letter-spacing:.1em;color:var(--gold-light);margin:0;}
.civ-newgame .dlbl{font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;margin-bottom:4px;}
.civ-newgame .civ-ds{display:flex;flex-direction:column;gap:6px;}
.civ-newgame .bonus{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--tx2);line-height:1.5;}
.civ-newgame .bdot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:6px;}
.civ-newgame .bonus.bp .bdot{background:#4A9A68;}
.civ-newgame .bonus.bm .bdot{background:#9A5040;}
.civ-newgame .meta-row{font-size:12px;color:var(--tx2);padding:6px 10px;background:rgba(255,255,255,.03);border-radius:var(--radius);border-left:2px solid var(--gold-dim);}
.civ-newgame .su{margin-top:.2rem;background:rgba(201,168,76,.08);border:1px solid var(--bd-mid);border-radius:var(--radius);padding:10px 14px;}
.civ-newgame .su .l{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .su .v{font-size:15px;color:var(--gold-light);margin-top:3px;}
.civ-newgame .klaster{margin-top:1rem;padding-top:.85rem;border-top:1px solid var(--bd-sub);}
.civ-newgame .klaster .kh{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold-dim);font-family:Arial,sans-serif;margin-bottom:.5rem;}
.civ-newgame .klaster .kv{font-size:13px;color:var(--gold-light);margin-bottom:.35rem;}
.civ-newgame .klaster .km{font-size:12px;color:var(--tx2);line-height:1.55;font-style:italic;}
.civ-newgame .start-preview{background:rgba(201,168,76,.05);border:1px solid var(--bd-mid);border-radius:var(--radius-lg);padding:14px 16px;max-width:700px;margin:1rem auto 0;text-align:left;}
.civ-newgame .start-preview .kh{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold-dim);font-family:Arial,sans-serif;margin-bottom:.5rem;}
.civ-newgame .epoch-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-width:760px;margin:0 auto;align-items:stretch;}
.civ-newgame .epoch-foot{max-width:760px;margin:.85rem auto 0;display:flex;flex-direction:column;gap:10px;}
.civ-newgame .epoch-info{background:rgba(201,168,76,.06);border:1px solid var(--bd-mid);border-radius:var(--radius-lg);padding:12px 16px;font-size:13px;line-height:1.55;color:var(--tx2);}
.civ-newgame .epoch-info strong{color:var(--gold-light);font-weight:400;}
.civ-newgame .epoch-navhint{text-align:center;font-size:11px;color:var(--tx-muted);font-family:Arial,sans-serif;letter-spacing:.08em;}
.civ-newgame .ec{background:var(--bg-card);border:1.5px solid var(--bd-sub);border-radius:var(--radius-lg);padding:18px 14px;text-align:center;cursor:pointer;display:flex;flex-direction:column;gap:8px;align-items:center;height:100%;min-height:172px;box-sizing:border-box;transition:all .18s;}
.civ-newgame .ec:hover:not(.lock){border-color:var(--bd-mid);background:var(--bg-card-h);}
.civ-newgame .ec.sel{border-color:var(--gold);background:var(--bg-sel);box-shadow:0 0 0 1px rgba(201,168,76,.15);}
.civ-newgame .ec.lock{opacity:.35;cursor:not-allowed;}
.civ-newgame .ec-icon{font-size:32px;line-height:1;display:flex;align-items:center;justify-content:center;}
.civ-newgame .ec .tg-medallion svg{width:36px;height:36px;display:block;}
.civ-newgame .ec .en{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;font-weight:600;}
.civ-newgame .ec.sel .en{color:var(--gold);}
.civ-newgame .ec .bdg{font-size:9px;letter-spacing:.18em;text-transform:uppercase;font-family:Arial,sans-serif;padding:3px 10px;border-radius:12px;border:1px solid var(--gold-dim);color:var(--gold-dim);}
.civ-newgame .ec.sel .bdg{border-color:var(--gold);color:var(--gold-light);background:rgba(201,168,76,.1);}
.civ-newgame .ec .fl{flex:1;width:100%;font-size:11px;color:var(--tx2);font-style:italic;line-height:1.45;min-height:4.35em;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}
.civ-newgame .sett-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.1rem;max-width:720px;margin:0 auto;align-items:stretch;}
.civ-newgame .qual-sect{max-width:700px;margin:1.1rem auto 0;text-align:center;}
.civ-newgame .qual-sect h3{font-size:11px;letter-spacing:.35em;text-transform:uppercase;color:var(--tx2);margin-bottom:.65rem;font-family:Arial,sans-serif;font-weight:400;}
.civ-newgame .qual-hint{color:#E8C060;font-size:12px;line-height:1.55;margin:.75rem auto 0;max-width:520px;font-family:Arial,sans-serif;}
.civ-newgame .srow{background:var(--bg-card);border:1px solid var(--bd-sub);border-radius:var(--radius-lg);padding:14px 16px;display:flex;flex-direction:column;gap:10px;height:100%;min-height:124px;box-sizing:border-box;}
.civ-newgame .srow-hdr{display:flex;align-items:center;gap:10px;min-height:34px;}
.civ-newgame .srow-ic{width:34px;height:34px;border-radius:8px;border:1px solid var(--bd-mid);display:flex;align-items:center;justify-content:center;font-size:17px;background:rgba(201,168,76,.07);flex-shrink:0;color:var(--gold-light);}
.civ-newgame .srow-ic svg{display:block;width:20px;height:20px;}
.civ-newgame .sl{font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;line-height:1.3;flex:1;}
.civ-newgame .sctl{display:flex;align-items:center;gap:10px;flex:1;}
.civ-newgame .arr{width:28px;height:28px;border:1px solid var(--bd-mid);background:transparent;color:var(--gold);cursor:pointer;border-radius:4px;font-size:15px;font-family:Arial,sans-serif;flex-shrink:0;}
.civ-newgame .arr:hover{border-color:var(--gold);background:rgba(201,168,76,.1);}
.civ-newgame .sv{flex:1;text-align:center;font-size:15px;min-height:2.75em;display:flex;flex-direction:column;justify-content:center;}
.civ-newgame .sv .d{display:-webkit-box;font-size:10px;color:var(--tx-muted);font-style:italic;font-family:Arial,sans-serif;margin-top:2px;line-height:1.3;min-height:2.6em;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.civ-newgame .gen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:340px;gap:1rem;text-align:center;}
.civ-newgame .gen-visual{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;max-width:220px;padding:10px;background:rgba(201,168,76,.04);border:1px solid var(--bd-sub);border-radius:var(--radius-lg);}
.civ-newgame .gen-hex{width:28px;height:32px;background:rgba(201,168,76,.12);clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);animation:cng-pulse 1.6s ease-in-out infinite;}
.civ-newgame .gen-hex.ocean{background:rgba(60,100,160,.25);}
.civ-newgame .gen-hex.fog{opacity:.35;}
@keyframes cng-pulse{0%,100%{opacity:.45;transform:scale(.92)}50%{opacity:1;transform:scale(1)}}
.civ-newgame .gen-status{font-size:13px;color:var(--tx2);font-family:Arial,sans-serif;letter-spacing:.04em;min-height:1.2em;}
.civ-newgame .ring{width:70px;height:70px;border-radius:50%;border:2px solid var(--bd-sub);border-top-color:var(--gold);animation:cng-spin 1.3s linear infinite;}
@keyframes cng-spin{to{transform:rotate(360deg);}}
.civ-newgame .gt{font-size:24px;color:var(--gold-light);letter-spacing:.12em;}
.civ-newgame .gp{background:var(--bg-card);border:1px solid var(--bd-sub);border-radius:var(--radius-lg);padding:1rem 1.5rem;text-align:left;max-width:420px;width:100%;}
.civ-newgame .pr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(201,168,76,.06);font-size:13px;}
.civ-newgame .pr .k{color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .pr .v{color:var(--gold);}
.civ-newgame .nav{margin-top:1rem;padding:1rem 2rem 0;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--bd-sub);background:transparent;max-width:1000px;width:100%;margin-left:auto;margin-right:auto;}
.civ-newgame .nb{padding:10px 26px;border-radius:var(--radius);font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-family:Arial,sans-serif;cursor:pointer;}
.civ-newgame .nb.back{background:transparent;border:1px solid var(--bd-mid);color:var(--tx2);}
.civ-newgame .nb.next{background:rgba(201,168,76,.1);border:1.5px solid var(--bd-strong);color:var(--gold-light);}
.civ-newgame .nb:disabled{opacity:.3;cursor:not-allowed;}
.civ-newgame .ni{font-size:11px;color:var(--tx-muted);font-family:Arial,sans-serif;letter-spacing:.15em;text-transform:uppercase;}
.civ-newgame .cta{padding:12px 40px;border:1.5px solid var(--gold-dim);color:var(--gold);background:transparent;font-size:12px;letter-spacing:.25em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);font-family:Arial,sans-serif;}
.civ-newgame .cta:hover{border-color:var(--gold);background:rgba(201,168,76,.1);color:var(--gold-light);}
.civ-newgame .ng-glyph{display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;
  font-family:var(--civ-font-ui);font-size:18px;font-weight:700;letter-spacing:.04em;color:var(--gold-light);}
.civ-newgame .ng-glyph-sm{font-size:11px;letter-spacing:.06em;}
.civ-newgame .ng-glyph-lg{font-size:22px;letter-spacing:.12em;}
.civ-newgame .ng-glyph-ep{font-size:22px;font-weight:600;}
.civ-newgame .start{background:transparent;border:2px solid var(--gold);color:var(--gold-light);font-size:14px;letter-spacing:.3em;text-transform:uppercase;padding:13px 50px;cursor:pointer;border-radius:var(--radius);font-family:var(--civ-font-ui);margin:1.4rem auto 0;display:block;}
.civ-newgame .start:hover{background:rgba(232,216,138,0.12);}
.civ-newgame .sett-actions{max-width:700px;margin:1rem auto 0;display:flex;flex-direction:column;gap:10px;align-items:center;}
.civ-newgame .btn-adv{background:transparent;border:1px solid var(--bd-mid);color:var(--tx2);font-size:12px;letter-spacing:.15em;text-transform:uppercase;padding:9px 28px;cursor:pointer;border-radius:var(--radius);font-family:Arial,sans-serif;}
.civ-newgame .btn-adv:hover{color:var(--tx);background:rgba(255,255,255,.03);}
.civ-newgame .sett-note{font-size:11px;color:var(--tx-muted);text-align:center;max-width:700px;margin:.35rem auto 0;font-family:Arial,sans-serif;line-height:1.4;}
.civ-newgame .adv-overlay{position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:1rem;}
.civ-newgame .adv-overlay.open{display:flex;}
.civ-newgame .adv-modal{background:#12121A;border:1px solid var(--bd-mid);border-radius:var(--radius-lg);max-width:520px;width:100%;max-height:90vh;overflow-y:auto;padding:1.4rem 1.6rem;}
.civ-newgame .adv-modal h3{font-size:18px;font-weight:400;letter-spacing:.12em;color:var(--gold-light);margin-bottom:4px;}
.civ-newgame .adv-sub{font-size:11px;color:var(--tx-muted);font-family:Arial,sans-serif;margin-bottom:1rem;line-height:1.45;}
.civ-newgame .adv-row{background:var(--bg-card);border:1px solid var(--bd-sub);border-radius:var(--radius);padding:12px 14px;margin-bottom:10px;}
.civ-newgame .adv-lbl{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;margin-bottom:6px;}
.civ-newgame .adv-hint{font-size:10px;color:var(--tx-muted);font-family:Arial,sans-serif;margin-top:4px;font-style:italic;line-height:1.35;}
.civ-newgame .adv-btns{display:flex;justify-content:flex-end;margin-top:1rem;}
.civ-newgame .adv-close{background:transparent;border:1px solid var(--bd-mid);color:var(--tx2);padding:8px 20px;border-radius:var(--radius);cursor:pointer;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function el(tag: string, cls?: string, html?: string): HTMLElement {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

const STEP_LABELS = ['Intro', 'Epoka', 'Cywilizacja', 'Ustawienia', 'Start'];

function selectedCiv(): CivOption | null {
  return civs().find(c => c.id === selCiv) ?? null;
}

function currentStartPreview(): StartPreview | null {
  const data = gameData();
  if (!data || !selCiv) return null;
  const mapLabel = curStep >= 4 ? settingValue('map_size') : 'Standardowy';
  const cityN = curStep >= 4 ? parseInt(settingValue('city_states_count'), 10) : NaN;
  const typesN = curStep >= 4 ? parseInt(settingValue('civ_types_count'), 10) : NaN;
  return buildStartPreview({
    civs: data.civs,
    cityNamesPools: data.cityNamesPools,
    playerCivId: selCiv,
    mapSizeMenuLabel: mapLabel,
    cityStatesCount: Number.isFinite(cityN) ? cityN : undefined,
    activeTypesCount: Number.isFinite(typesN) ? typesN : undefined,
  });
}

function appendKlasterBlock(parent: HTMLElement, preview: StartPreview): void {
  const block = el('div', 'klaster');
  block.appendChild(el('div', 'kh', '&#9670; Start w klastrze typu'));
  block.appendChild(el('div', 'kv', 'Stolica: ' + preview.playerCapitalName));
  const rivals = preview.sameTypeRivalNames.slice(0, 5).join(', ')
    + (preview.sameTypeRivalNames.length > 5 ? '…' : '');
  block.appendChild(el('div', 'kv', 'Rywale (' + preview.sameTypeRivalCount + '): ' + rivals));
  if (preview.foreignTypesCount > 0) {
    block.appendChild(el('div', 'kv', 'Obce typy na mapie: ' + preview.foreignTypesCount));
  }
  block.appendChild(el('div', 'km', preview.modelDetail));
  parent.appendChild(block);
}

function renderCivStep(host: HTMLElement): void {
  ensureSelCivForEpoch();
  const available = civsForEpoch(selEpoch);
  const ep = EPOCHS.find(e => e.id === selEpoch);
  const epName = ep?.name ?? selEpoch;
  host.appendChild(el('div', 'epoch-navhint', epName + ' — dostępnych cywilizacji: ' + available.length));

  const layout = el('div', 'civ-layout');
  const grid = el('div', 'civ-grid');
  for (const c of available) {
    const card = el('div', 'card' + (selCiv === c.id ? ' sel' : ''));
    card.innerHTML = civMedallionHtml(c.id, selCiv === c.id, 'card', c.kolorHex) + '<div class="cn">' + c.name + '</div>';
    card.addEventListener('click', () => { selCiv = c.id; markNewGamePrefsDirtyAndSave(); render(); });
    grid.appendChild(card);
  }
  if (available.length === 0) {
    grid.appendChild(el('div', 'cn', 'Brak cywilizacji dostępnych w tej epoce (epokaWejscia + kaskada).'));
  }
  const detail = el('div', 'detail');
  const c = selectedCiv();
  if (!c) {
    const empty = el('div', 'empty');
    empty.innerHTML = '<div class="arr">&#8592;</div><div>Wybierz cywilizację z siatki,<br>aby zobaczyć bonusy i jednostkę specjalną.</div>';
    detail.appendChild(empty);
  } else {
    const head = el('div', 'civ-dh');
    head.innerHTML = civMedallionHtml(c.id, true, 'detail', c.kolorHex) + '<div><div class="dn">' + c.name + '</div><div class="civ-dmeta">Cywilizacja</div></div>';
    detail.appendChild(head);
    const ds = el('div', 'civ-ds');
    ds.appendChild(el('div', 'dlbl', 'Cechy &amp; bonusy'));
    if (c.styl) appendBonusRow(ds, c.styl);
    for (const b of (c.bonusy ?? [])) appendBonusRow(ds, b);
    if (c.religia) {
      const rel = el('div', 'meta-row');
      rel.textContent = 'Religia: ' + c.religia;
      ds.appendChild(rel);
    }
    if (c.typGlowny) {
      const typ = el('div', 'meta-row');
      typ.textContent = 'Typ: ' + c.typGlowny;
      ds.appendChild(typ);
    }
    detail.appendChild(ds);
    if (c.superJednostka) {
      detail.appendChild(el('div', 'su', '<div class="l">\u2694 Jednostka specjalna</div><div class="v">' + c.superJednostka + '</div>'));
    }
    const preview = currentStartPreview();
    if (preview) appendKlasterBlock(detail, preview);
  }
  const gridPanel = el('div', 'civ-grid-panel');
  gridPanel.appendChild(grid);
  layout.appendChild(gridPanel);
  layout.appendChild(detail);
  host.appendChild(layout);
}

function epochTechSummary(epochId: string): string {
  if (epochId === 'kamien') return 'Brak wczesniejszych epok — badasz technologie Kamienia od zera.';
  if (epochId === 'braz') return 'Masz juz <strong>wszystkie technologie epoki Kamienia</strong>. Epoke Braz badasz od zera.';
  if (epochId === 'zelazo') return 'Masz juz <strong>wszystkie technologie Kamienia i Brazu</strong>. Epoke Zelaza badasz od zera.';
  return '';
}

function renderEpochStep(host: HTMLElement): void {
  const wrap = el('div', 'epoch-foot');
  const grid = el('div', 'epoch-grid');
  for (const e of EPOCHS) {
    const hasCivs = epochHasCivs(e.id);
    const count = civsForEpoch(e.id).length;
    const ec = el('div', 'ec' + (hasCivs ? (selEpoch === e.id ? ' sel' : '') : ' lock'));
    const badge = hasCivs ? (count + ' cyw.') : 'Brak cywilizacji';
    ec.innerHTML = '<div class="ec-icon">' + epochMedallionHtml(e.id, selEpoch === e.id) + '</div><div class="en">' + e.name + '</div><div class="bdg">' + badge + '</div><div class="fl">' + e.flavor + '</div>';
    if (hasCivs) {
      ec.addEventListener('click', () => {
        selEpoch = e.id;
        ensureSelCivForEpoch();
        markNewGamePrefsDirtyAndSave();
        render();
      });
    }
    grid.appendChild(ec);
  }
  wrap.appendChild(grid);
  const info = el('div', 'epoch-info');
  info.innerHTML = epochTechSummary(selEpoch);
  wrap.appendChild(info);
  wrap.appendChild(el('div', 'epoch-navhint', 'Wybrana epoka — kliknij „Dalej", aby wybrać cywilizację dostępną w tej epoce.'));
  host.appendChild(wrap);
}

function renderSettingRows(host: HTMLElement, keys: string[]): void {
  const grid = el('div', 'sett-grid');
  for (const key of keys) {
    const s = SETT.find(x => x.key === key);
    if (!s) continue;
    const row = el('div', 'srow');
    row.innerHTML = '<div class="srow-hdr"><div class="srow-ic">' + settingIcon(s.key) + '</div><div class="sl">' + s.lbl + '</div></div><div class="sctl"></div>';
    const ctl = row.querySelector('.sctl') as HTMLElement;
    const left = el('button', 'arr', '&#8249;');
    const sv = el('div', 'sv');
    sv.innerHTML = (s.opts[s.idx] ?? '') + '<span class="d">' + (s.descs[s.idx] ?? '') + '</span>';
    const right = el('button', 'arr', '&#8250;');
    const refreshSv = () => {
      sv.innerHTML = (s.opts[s.idx] ?? '') + '<span class="d">' + (s.descs[s.idx] ?? '') + '</span>';
    };
    const ch = (d: number) => {
      s.idx = (s.idx + d + s.opts.length) % s.opts.length;
      if (s.key === 'map_size') syncMapScaleOptions();
      if (s.key === 'world_type') resetAdvLandOnWorldTypeChange();
      refreshSv();
      markNewGamePrefsDirtyAndSave();
      if (s.key === 'map_size' || s.key === 'city_states_count' || s.key === 'civ_types_count') {
        render();
      }
    };
    left.addEventListener('click', () => ch(-1));
    right.addEventListener('click', () => ch(1));
    ctl.appendChild(left); ctl.appendChild(sv); ctl.appendChild(right);
    grid.appendChild(row);
  }
  host.appendChild(grid);
}

function advRowFromSett(key: string, hint: string): AdvSettingRow {
  const s = SETT.find(x => x.key === key);
  return {
    key,
    lbl: s?.lbl ?? key,
    hint,
    opts: s?.opts ?? [],
    getIdx: () => s?.idx ?? 0,
    setIdx: (i) => { if (s) s.idx = i; },
  };
}

function advancedSettingRows(): AdvSettingRow[] {
  return [
    advRowFromSett('map_quality', 'Jakość renderu mapy 3D — niska / średnia / wysoka (GPU).'),
    advRowFromSett('resources_density', 'Gęstość wszystkich złóż (ruda, bydło, glina…). Reguły terenu bez zmian.'),
    advRowFromSett(
      'rivers_density',
      'Fair play: min. 1 główna rzeka / komórkę siatki (Mało 15×15 · Normalnie 10×10 · Dużo 5×5). Wyższy tier = gęstsza siatka + ewentualnie dłuższe trasy.',
    ),
    advRowFromSett('desert_density', 'Udział pustynnych hexów.'),
    advRowFromSett(
      'forest_density',
      'Fair play: min. 1 las / komórkę siatki (Mało 15 · Normalnie 10 · Dużo 5). Wyższy tier = gęstsza siatka + bonus lasu z szumu (więcej, równomiernie).',
    ),
    advRowFromSett(
      'relief_density',
      'Fair play: min. 2 góry / komórkę żelaza + 2 wzgórza / komórkę miedzi (Mało 35/21 · Normalnie 25/15 · Dużo 20/12). Wyższy tier = gęstsza siatka + bonus ukształtowania.',
    ),
    {
      key: 'landFraction',
      lbl: 'Udział lądu na mapie',
      hint: 'Reszta to morze. Domyślnie: Pangea 60%, Kontynenty 30%, Wyspy 50%. Typ Ziemia = szablon kontynentów (~21%, bez suwaka).',
      opts: landFractionOptLabels(),
      getIdx: () => {
        const i = LAND_FRACTION_PERCENT_OPTS.indexOf(advOpts.landFractionPercent);
        return i >= 0 ? i : LAND_FRACTION_PERCENT_OPTS.indexOf(30);
      },
      setIdx: (i) => {
        advOpts.landFractionPercent = LAND_FRACTION_PERCENT_OPTS[i] ?? 30;
        advOpts.landFractionCustom = true;
      },
    },
    {
      key: 'victory_mode',
      lbl: 'Warunki zwycięstwa',
      hint: 'Moc = tech + rakieta · Dominacja = >50% Power w ostatniej epoce.',
      opts: ['Tylko moc', 'Tylko dominacja', 'Moc + dominacja'],
      getIdx: () => {
        if (advOpts.victoryMode === 'moc') return 0;
        if (advOpts.victoryMode === 'dominacja') return 1;
        return 2;
      },
      setIdx: (i) => {
        advOpts.victoryMode = i === 0 ? 'moc' : i === 1 ? 'dominacja' : 'moc_i_dominacja';
      },
    },
    {
      key: 'barbariansLevel',
      lbl: 'Barbarzyńcy',
      hint: 'Gęstość frakcji barbarzyńskich na mapie.',
      opts: ['Wielu', 'Nieliczni', 'Wyłączeni'],
      getIdx: () => {
        if (advOpts.barbariansLevel === 'nieliczni') return 1;
        if (advOpts.barbariansLevel === 'wylaczeni') return 2;
        return 0;
      },
      setIdx: (i) => {
        advOpts.barbariansLevel = i === 1 ? 'nieliczni' : i === 2 ? 'wylaczeni' : 'wielu';
      },
    },
    {
      key: 'battleAlwaysManual',
      lbl: 'Szczegółowość bitew',
      hint: 'UNITS: auto-resolve vs wejście w scenę bitwy.',
      opts: ['Automatyczne', 'Zawsze ręczna'],
      getIdx: () => (advOpts.battleAlwaysManual ? 1 : 0),
      setIdx: (i) => { advOpts.battleAlwaysManual = i === 1; },
    },
    {
      key: 'buildingCostPace',
      lbl: 'Koszty budynków',
      hint: 'Mnożnik Pracy przy budowie — bazowe koszty z panelu = Niski (×1).',
      opts: ['Niski', 'Normalny', 'Wysoki'],
      getIdx: () => {
        if (advOpts.buildingCostPace === 'normalny') return 1;
        if (advOpts.buildingCostPace === 'wysoki') return 2;
        return 0;
      },
      setIdx: (i) => {
        advOpts.buildingCostPace = i === 1 ? 'normalny' : i === 2 ? 'wysoki' : 'niski';
      },
    },
    {
      key: 'kosztJednostekPace',
      lbl: 'Koszty jednostek',
      hint: 'Mnożnik złota rekrutacji — bazowe koszty z panelu = Niski (×1).',
      opts: ['Niski', 'Normalny', 'Wysoki'],
      getIdx: () => {
        if (advOpts.kosztJednostekPace === 'normalny') return 1;
        if (advOpts.kosztJednostekPace === 'wysoki') return 2;
        return 0;
      },
      setIdx: (i) => {
        advOpts.kosztJednostekPace = i === 1 ? 'normalny' : i === 2 ? 'wysoki' : 'niski';
      },
    },
    {
      key: 'wzrostLudnosciPace',
      lbl: 'Wzrost ludności',
      hint: 'Mnożnik progu 🍞 na +1 mieszkańca — bazowy = Wysoki (×1).',
      opts: ['Wysoki', 'Normalny', 'Wolny'],
      getIdx: () => {
        if (advOpts.wzrostLudnosciPace === 'normalny') return 1;
        if (advOpts.wzrostLudnosciPace === 'wolny') return 2;
        return 0;
      },
      setIdx: (i) => {
        advOpts.wzrostLudnosciPace = i === 1 ? 'normalny' : i === 2 ? 'wolny' : 'wysoki';
      },
    },
  ];
}

let advOverlayEl: HTMLDivElement | null = null;

function ensureAdvOverlay(): HTMLDivElement {
  if (advOverlayEl && advOverlayEl.isConnected) return advOverlayEl;
  advOverlayEl = el('div', 'adv-overlay') as HTMLDivElement;
  advOverlayEl.addEventListener('click', (e) => {
    if (e.target === advOverlayEl) hideAdvancedModal();
  });
  (rootEl ?? document.body).appendChild(advOverlayEl);
  return advOverlayEl;
}

function hideAdvancedModal(): void {
  if (advOverlayEl) advOverlayEl.classList.remove('open');
  saveNewGamePrefs();
}

function showAdvancedModal(): void {
  const overlay = ensureAdvOverlay();
  overlay.innerHTML = '';
  const modal = el('div', 'adv-modal');
  modal.appendChild(el('h3', '', 'Zaawansowane opcje'));
  modal.appendChild(el('div', 'adv-sub', 'Parametry rzadko zmieniane — poza główną siatką kroku 4.'));
  const rows = advancedSettingRows();
  for (const row of rows) {
    const box = el('div', 'adv-row');
    box.appendChild(el('div', 'adv-lbl', row.lbl));
    const ctl = el('div', 'sctl');
    const left = el('button', 'arr', '&#8249;');
    const sv = el('div', 'sv');
    const refresh = () => {
      const i = row.getIdx();
      sv.innerHTML = (row.opts[i] ?? '') + '<span class="d">' + row.hint + '</span>';
    };
    refresh();
    const right = el('button', 'arr', '&#8250;');
    const ch = (d: number) => {
      const cur = row.getIdx();
      const next = (cur + d + row.opts.length) % row.opts.length;
      row.setIdx(next);
      refresh();
      markNewGamePrefsDirtyAndSave();
    };
    left.addEventListener('click', () => ch(-1));
    right.addEventListener('click', () => ch(1));
    ctl.appendChild(left);
    ctl.appendChild(sv);
    ctl.appendChild(right);
    box.appendChild(ctl);
    box.appendChild(el('div', 'adv-hint', row.hint));
    modal.appendChild(box);
  }
  const btns = el('div', 'adv-btns');
  const close = el('button', 'adv-close', 'Zamknij');
  close.addEventListener('click', hideAdvancedModal);
  btns.appendChild(close);
  modal.appendChild(btns);
  overlay.appendChild(modal);
  overlay.classList.add('open');
}

function renderSettStep(host: HTMLElement): void {
  syncMapScaleOptions();
  syncAdvLandFromWorldType();
  renderSettingRows(host, [
    'difficulty', 'map_size', 'world_type', 'game_speed', 'city_states_count', 'civ_types_count',
  ]);

  const preview = currentStartPreview();
  if (preview) {
    const box = el('div', 'start-preview');
    box.appendChild(el('div', 'kh', 'Twój start (podgląd)'));
    box.appendChild(el('div', 'kv', preview.modelLine));
    box.appendChild(el('div', 'km', preview.modelDetail));
    host.appendChild(box);
  }

  const actions = el('div', 'sett-actions');
  const advBtn = el('button', 'btn-adv', '&#9881;&nbsp; Zaawansowane opcje');
  advBtn.addEventListener('click', showAdvancedModal);
  actions.appendChild(advBtn);
  const start = el('button', 'start', '&#9670; ROZPOCZNIJ GRE &#9670;');
  start.addEventListener('click', () => { curStep = 5; render(); });
  actions.appendChild(start);
  host.appendChild(actions);
  host.appendChild(el(
    'div',
    'sett-note',
    'Miasta-państwa = miasta w Twoim klastrze (Sparta, Kapua…). Liczba cywilizacji = ile frakcji / obcych klastrów na mapie. Gęstość świata — w zaawansowanych.',
  ));
}

function settingValue(key: string): string {
  const s = SETT.find(x => x.key === key);
  return s ? (s.opts[s.idx] ?? '') : '';
}

function buildParams(): NewGameParams {
  const c = selectedCiv();
  const ep = EPOCHS.find(e => e.id === selEpoch);
  const worldLabel = settingValue('world_type');
  const mapQualityLabel = settingValue('map_quality') || qualityTierToLabel(DEFAULT_RENDER_QUALITY);
  const bundle = bundledMapQualityFromLabel(mapQualityLabel);
  const bundledLabel = qualityTierToLabel(bundle.renderQuality);
  const densityLabels = {
    resources: settingValue('resources_density') || 'Normalnie',
    rivers: settingValue('rivers_density') || 'Normalnie',
    desert: settingValue('desert_density') || 'Normalnie',
    forest: settingValue('forest_density') || 'Normalnie',
    relief: settingValue('relief_density') || 'Normalnie',
  };
  const worldDensity = worldGenerationPresetFromLabels(densityLabels);
  const mapSizeLabel = settingValue('map_size');
  const cityStatesCount = parseInt(settingValue('city_states_count'), 10);
  const civTypesCount = parseInt(settingValue('civ_types_count'), 10);
  const cityDefault = defaultMiastaPanstwaFromMapLabel(mapSizeLabel || 'Standardowy');
  const typesDefault = defaultCivTypesFromMapLabel(mapSizeLabel || 'Standardowy');
  const data = gameData();
  const startPreview = data
    ? buildStartPreview({
        civs: data.civs,
        cityNamesPools: data.cityNamesPools,
        playerCivId: selCiv ?? DEFAULT_PLAYER_CIV_ID,
        mapSizeMenuLabel: mapSizeLabel,
        cityStatesCount: Number.isFinite(cityStatesCount) ? cityStatesCount : undefined,
        activeTypesCount: Number.isFinite(civTypesCount) ? civTypesCount : undefined,
      })
    : undefined;
  const seed = Math.floor(Math.random() * 1_000_000);
  return {
    civId: selCiv ?? DEFAULT_PLAYER_CIV_ID,
    civName: c ? c.name : '',
    epoch: ep ? ep.name : '',
    epochId: selEpoch,
    difficulty: settingValue('difficulty'),
    mapSize: mapSizeLabel,
    rivals: String(Number.isFinite(cityStatesCount) ? cityStatesCount : cityDefault),
    speed: settingValue('game_speed'),
    worldType: worldLabel,
    typSwiata: typSwiataFromMenuLabel(worldLabel),
    seed,
    mapQualityLabel,
    mapQuality: qualityTierFromLabel(mapQualityLabel),
    renderQualityLabel: bundledLabel,
    mapDetailQualityLabel: bundledLabel,
    renderQuality: bundle.renderQuality,
    mapDetailQuality: bundle.mapDetailQuality,
    civTypesCount: Number.isFinite(civTypesCount) ? civTypesCount : typesDefault,
    cityStatesCount: clampMiastaPanstwaCount(
      Number.isFinite(cityStatesCount) ? cityStatesCount : cityDefault,
    ),
    worldDensity,
    worldDensityLabels: densityLabels,
    landFractionPercent: advOpts.landFractionPercent,
    advanced: { ...advOpts },
    startPreview,
  };
}

function buildGenVisual(): HTMLDivElement {
  const box = el('div', 'gen-visual') as HTMLDivElement;
  for (let i = 0; i < 24; i++) {
    const hx = el('div', 'gen-hex');
    if (i % 7 === 0 || i % 11 === 0) hx.classList.add('ocean');
    if (i > 14) hx.classList.add('fog');
    hx.style.animationDelay = (i * 0.08) + 's';
    box.appendChild(hx);
  }
  return box;
}

const GEN_STATUS = [
  '\u{1F5FA} Generowanie heksów mapy…',
  '\u{1F333} Rozmieszczanie terenu i lasów…',
  '\u{1F916} Inicjalizacja frakcji AI…',
  '\u{1F3DB} Rozmieszczanie cywilizacji…',
  '\u{1F32B} Ustawianie mgły wojennej…',
  '\u2713 Finalizowanie parametrów…',
];

function renderGenStep(host: HTMLElement): void {
  const p = buildParams();
  const wrap = el('div', 'gen');
  wrap.appendChild(buildGenVisual());
  wrap.appendChild(el('div', 'ring'));
  wrap.appendChild(el('div', 'gt', 'Generowanie świata…'));
  wrap.appendChild(el('div', 'gen-status', GEN_STATUS[0]));
  const rows: [string, string][] = [
    ['Cywilizacja', p.civName || '(nie wybrano)'],
    ['Epoka startowa', p.epoch],
    ['Trudnosc', p.difficulty],
    ['Rozmiar mapy', p.mapSize],
    ['Typ swiata', p.worldType],
    ['Miasta-panstwa', String(p.cityStatesCount) + ' w klastrze'],
    ['Liczba cywilizacji', String(p.civTypesCount) + ' na mapie'],
    ['Predkosc', p.speed],
    ['Surowce', p.worldDensityLabels.resources],
    ['Ląd / morze', p.landFractionPercent + '% / ' + (100 - p.landFractionPercent) + '%'],
    ['Rzeki / pustynie / las / góry', p.worldDensityLabels.rivers + ' · ' + p.worldDensityLabels.desert + ' · ' + p.worldDensityLabels.forest + ' · ' + p.worldDensityLabels.relief],
    ['Jakosc grafiki', p.mapQualityLabel],
  ];
  if (p.advanced) {
    const vLabel = p.advanced.victoryMode === 'moc'
      ? 'Tylko moc'
      : p.advanced.victoryMode === 'dominacja'
        ? 'Tylko dominacja'
        : 'Moc + dominacja';
    const bLabel = p.advanced.barbariansLevel === 'wielu'
      ? 'Wielu'
      : p.advanced.barbariansLevel === 'nieliczni'
        ? 'Nieliczni'
        : 'Wylaczeni';
    const costLabel = p.advanced.buildingCostPace === 'normalny'
      ? 'Normalny (x2)'
      : p.advanced.buildingCostPace === 'wysoki'
        ? 'Wysoki (x4)'
        : 'Niski (x1)';
    const unitCostLabel = p.advanced.kosztJednostekPace === 'normalny'
      ? 'Normalny (x2)'
      : p.advanced.kosztJednostekPace === 'wysoki'
        ? 'Wysoki (x4)'
        : 'Niski (x1)';
    const growthPaceLabel = p.advanced.wzrostLudnosciPace === 'normalny'
      ? 'Normalny (x2 prog)'
      : p.advanced.wzrostLudnosciPace === 'wolny'
        ? 'Wolny (x4 prog)'
        : 'Wysoki (x1 prog)';
    rows.push(
      ['Barbarzyncy', bLabel],
      ['Bitwy', p.advanced.battleAlwaysManual ? 'Zawsze reczna' : 'Automatyczne'],
      ['Zwyciestwo', vLabel],
      ['Koszty budynkow', costLabel],
      ['Koszty jednostek', unitCostLabel],
      ['Wzrost ludnosci', growthPaceLabel],
    );
  }
  if (p.startPreview) {
    for (const [k, v] of startPreviewSummaryRows(p.startPreview)) {
      rows.splice(1, 0, [k, v]);
    }
  }
  const gp = el('div', 'gp');
  gp.innerHTML = rows.map(r => '<div class="pr"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>').join('');
  wrap.appendChild(gp);
  host.appendChild(wrap);
  flushNewGamePrefs();
  if (cfg) cfg.onStart(p);
}

function mountHeroBackground(host: HTMLElement): void {
  const bg = el('div', 'hero-bg');
  bg.innerHTML =
    '<img src="' + heroIntroUrl + '" alt="" />' +
    '<div class="hero-veil-radial"></div>' +
    '<div class="hero-veil-linear"></div>';
  host.appendChild(bg);
}

function cancelNewGameFlow(): void {
  cfg?.onCancel?.();
}

function appendMenuBackButton(parent: HTMLElement, className = 'hdr-menu-back'): void {
  if (!cfg?.onCancel) return;
  const btn = el('button', className, '&#8592; Menu g&#322;&#243;wne') as HTMLButtonElement;
  btn.type = 'button';
  btn.addEventListener('click', cancelNewGameFlow);
  parent.appendChild(btn);
}

function render(): void {
  if (rootEl === null) return;
  hideAdvancedModal();
  advOverlayEl = null;
  rootEl.innerHTML = '';
  rootEl.classList.add('hero-flow');
  mountHeroBackground(rootEl);

  const hdr = el('div', 'hdr');
  if (curStep >= 1 && curStep <= 4) appendMenuBackButton(hdr);
  const hdrInner = el('div');
  hdrInner.innerHTML = '<div class="lab">Kreator Nowej Gry</div><h1>THE GAME</h1>';
  hdr.appendChild(hdrInner);
  rootEl.appendChild(hdr);

  const bar = el('div', 'stepbar');
  STEP_LABELS.forEach((lbl, i) => {
    const n = i + 1;
    const si = el('div', 'si' + (n < curStep ? ' done' : n === curStep ? ' active' : ''));
    si.innerHTML = '<div class="si-b"><div class="si-n">' + n + '</div><span class="si-l">' + lbl + '</span></div>';
    if (n < curStep) si.addEventListener('click', () => { curStep = n; render(); });
    bar.appendChild(si);
    if (n < STEP_LABELS.length) bar.appendChild(el('div', 'si-c'));
  });
  rootEl.appendChild(bar);

  const content = el('div', 'content');
  if (curStep === 1) {
    const intro = el('div', 'intro');
    const em = el('div', 'em');
    em.innerHTML = newGameIntroEmblemSvg(44);
    intro.appendChild(em);
    intro.appendChild(el('div', 'big', 'NOWA GRA'));
    intro.appendChild(el('div', 'sub', 'Gra cywilizacyjna 4X \u2022 v0.1 \u2022 Kamień, Brąz &amp; Żelazo'));
    const cta = el('button', 'cta-hero', 'Rozpocznij konfigurację \u2192');
    cta.addEventListener('click', () => { curStep = 2; render(); });
    intro.appendChild(cta);
    if (cfg?.onCancel) {
      appendMenuBackButton(intro, 'cta-menu-back');
    }
    content.appendChild(intro);
  } else if (curStep === 2) {
    content.appendChild(el('div', 'sh', '<h2>Epoka Startowa</h2>'));
    renderEpochStep(content);
  } else if (curStep === 3) {
    content.appendChild(el('div', 'sh', '<h2>Wybór Cywilizacji</h2>'));
    renderCivStep(content);
  } else if (curStep === 4) {
    content.appendChild(el('div', 'sh', '<h2>Ustawienia Rozgrywki</h2>'));
    renderSettStep(content);
  } else {
    renderGenStep(content);
  }

  const flowBody = el('div', 'flow-body');
  flowBody.appendChild(content);

  // nav (kroki 2–4; krok 1 = CTA w treści; krok 5 = generowanie)
  if (curStep >= 2 && curStep <= 4) {
    const nav = el('div', 'nav');
    const back = el('button', 'nb back', '&#8592; Wstecz');
    back.addEventListener('click', () => { curStep -= 1; render(); });
    const info = el('div', 'ni', 'Krok ' + curStep + ' z 5');
    nav.appendChild(back);
    nav.appendChild(info);
    if (curStep >= 2 && curStep <= 3) {
      const next = el('button', 'nb next', 'Dalej &#8594;') as HTMLButtonElement;
      const canNext = curStep === 2
        ? epochHasCivs(selEpoch)
        : !!selCiv && civsForEpoch(selEpoch).some(c => c.id === selCiv);
      next.disabled = !canNext;
      next.addEventListener('click', () => {
        if (curStep === 2 && !epochHasCivs(selEpoch)) return;
        if (curStep === 3 && (!selCiv || !civsForEpoch(selEpoch).some(c => c.id === selCiv))) return;
        if (curStep === 2) ensureSelCivForEpoch();
        curStep += 1;
        render();
      });
      nav.appendChild(next);
    } else {
      nav.appendChild(el('div'));
    }
    flowBody.appendChild(nav);
  }
  rootEl.appendChild(flowBody);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Pokaz kreator nowej gry. */
export function showNewGameFlow(config: NewGameFlowConfig): void {
  cfg = config;
  prefsDirty = false;
  curStep = 1;
  selCiv = DEFAULT_PLAYER_CIV_ID;
  selEpoch = DEFAULT_START_EPOCH_ID;
  ensureSelCivForEpoch();
  resetSettingsFromParams();
  loadNewGamePrefs();
  ensureStyles();
  if (rootEl === null) {
    rootEl = document.createElement('div');
    rootEl.className = 'civ-newgame';
    document.body.appendChild(rootEl);
  }
  rootEl.style.display = 'flex';
  render();
}

/** Ukryj kreator nowej gry. */
export function hideNewGameFlow(): void {
  hideAdvancedModal();
  saveNewGamePrefs();
  if (rootEl !== null) rootEl.style.display = 'none';
}

/** Czy kreator nowej gry jest otwarty. */
export function isNewGameFlowOpen(): boolean {
  return rootEl !== null && rootEl.style.display !== 'none';
}
