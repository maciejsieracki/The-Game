/**
 * hud.ts
 * HUD w grze (UI plan pkt 3, D1=C) — gorny pasek zasobow + minimapa + panel boczny.
 * Uklad wg Makieta-HUD-mapa-swiata.html (grupy zasobow: Zloto/Praca, Moc/Nauka,
 * Kultura/Zadowolenie; Wiki/Menu po prawej; epoka w panelu Moc).
 *
 * DOM-only, DECOUPLED: dane podaje silnik przez getState(); akcje przez callbacki.
 *
 * MINIMAPA (D15=B): minimapHud.ts rysuje siatke z getMinimapData() od MAPY.
 * PANEL BOCZNY (D1=C): sidePanelHud.ts — szkielet wydarzen z tury.
 *
 * LANE: src/ui/*.  Pokazanie + onEndTurn wpina MASTER (main.ts).
 */

import {
  createMinimapHud,
  setMinimapTurnLabel,
  type MinimapData,
  type MinimapHexData,
  type MinimapLayerHooks,
  type MinimapPlaytestFogHooks,
  type MinimapWorkerOverlayHooks,
} from './minimapHud';
import { naukaHudWordHtml } from './naukaLabel';
// Liczby do wyswietlenia bez smieci zmiennoprzecinkowych (Maciej 2026-07-26).
import { signedPl } from './formatPl';
import {
  createSidePanelHud,
  type ContextPanelData,
  type SidePanelEvent,
  type SidePanelEventKind,
} from './sidePanelHud';
import { createBottomBarHud } from './bottomBarHud';
import { createMapToolbarHud, type MapToolbarHudConfig } from './mapToolbarHud';
import { createBuildModeHud, type BuildModeHudConfig } from './buildModeHud';
import { refreshCityListHudIfOpen } from './cityListHud';
import { refreshArmyListHudIfOpen } from './armyListHud';
import { refreshDiploListHudIfOpen } from './diploListHud';
import { refreshScienceHubIfOpen } from './scienceHubHud';
import { type UnitPanelState } from './unitPanelHud';
import { createArmyStackHud, type ArmyStackHudConfig } from './armyStackHud';
import { showPowerOverlay, hidePowerOverlay, type PowerOverlayData } from './powerOverlayHud';
import { mocLabel } from './power-labels';
import { wikiBookIcon } from './icons/wikiBookIcon';
import { iconHtml, type IconId } from './icons/iconRegistry';
import { brandIconSvg, civIconSvg } from './icons/brandAssets';
import { leaderPortraitUrl } from './leaderPortraits';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import { chip6cHtml, chip6cSep } from './hudChip6c';
import { createLeaderBannersHud, type LeaderBannersHudApi } from './leaderBannersHud';
import { createContextPanelHud, type ContextPanelHudApi } from './contextPanelHud';
import {
  showCultureOverlay, showReligionOverlay, hideEmpireOverlay,
  type CultureOverlayData, type ReligionOverlayData,
} from './empireOverlayHud';
import { empireSectionFromHudAct } from './empireDetailPanel';
import './buildStampToggle';

export type { PowerOverlayData, CultureOverlayData, ReligionOverlayData };

/** Wojna z graczem — badge na ikonie Wojsko (lista dyplomacji). */
export interface WarWithPlayer {
  civName: string;
  civId?: string;
  ownerId?: number;
}

export interface HudState {
  zloto: number;
  zlotoRate: number;
  praca: number;
  pracaRate: number;
  /** ZADANIE 1 (Maciej 2026-07-23): Praca/turę odjęta z puli za utrzymanie ulepszeń
   *  surowcowych (civ-wide) w ostatniej turze — do rozbicia w panelu Bilans/ZASOBY IMPERIUM. */
  pracaUpkeep?: number;
  /** B5 — zapasy państwa (wojsko), nie magazyn miasta. */
  zywnoscLabel: string;
  /** B5-SP — max zapasów (100 × Spichlerze); 0 = brak magazynu armii. */
  zywnoscMax?: number;
  zywnoscRate?: number;
  /** Wpływ miast do zapasów państwa/turę (po suwaku Rozwój) — rozbicie chipu Armia. */
  zywnoscWplywMiast?: number;
  /** Koszt utrzymania wojska/turę (pkt Żywności) — rozbicie chipu Armia. */
  zywnoscKosztWojska?: number;
  /** true → czerwony alert głodu wojska na HUD mapy. */
  glodWojska?: boolean;
  /** C-GLOD-Q1=A (Maciej 2026-07-26): liczba tur do startu atrycji HP wojska (karencja
   *  jeszcze trwa, zapasy już ujemne); undefined = nie dotyczy (zapasy nieujemne lub
   *  atrycja już aktywna teraz — patrz glodWojska). Ostrzeżenie z wyprzedzeniem w chipie „Armia". */
  zywnoscKarencjaZaTur?: number;
  nauka: number;
  naukaRate?: number;
  kultura: number;
  kulturaRate?: number;
  bogactwo: number;
  /** Przyrost Skarbca NETTO/turę (wplywy - utrzymanie budynkow - utrzymanie jednostek).
   *  Rozbicie do podpowiedzi chipu w polach ponizej (NAPRAWA HUD-SKARBIEC, Maciej 2026-07-26). */
  bogactwoRate?: number;
  /** Wplywy BRUTTO/turę (Podatek + pieniadz z budynkow + Handel ze szlakow), przed utrzymaniem. */
  bogactwoWplywyBrutto?: number;
  /** Czesc wplywow brutto pochodzaca z dochodu dystansowego tras handlowych (ta sama liczba co chip „Handel"). */
  bogactwoHandel?: number;
  /** Utrzymanie budynkow/turę (Pieniadz) — odjete od wplywow brutto przy koncu tury. */
  bogactwoUtrzymanieBudynkow?: number;
  /** Utrzymanie jednostek/turę (Pieniadz) — odjete od wplywow brutto przy koncu tury. */
  bogactwoUtrzymanieJednostek?: number;
  ludnosc: number;
  ludnoscRate?: number;
  /** A1-Q15 / P-C3 — Moc (absolutna, P-A). Kod: objectivePower. */
  power: number;
  /** Suma rekrutów (Manpower) imperium — pod Mocą na mapie. */
  rekruci?: number;
  rekruciLabel?: string;
  ludnoscAbsLabel?: string;
  osiedla: number;
  osiedlaMax: number;
  tura: number;
  epoka: string;
  epokaPostep?: number;
  /** Postęp aktywnej technologii [0..1] — nauka skumulowana / koszt badanej tech. */
  researchProgress?: number;
  badana?: string | null;
  /** Chipy dyplomacji na [A] (A1-revB) */
  sojusze?: number;
  pakty?: number;
  wojny?: number;
  /** @deprecated stary slot — nie renderuj */
  wplyw?: number;
  zadowolenie?: number;
  nacja?: string;
  /** Suma wiernych religii państwa (imperium). */
  religionStock?: number;
  /** Suma szerzenia wiernych / turę (wszystkie miasta). */
  religionRate?: number;
  stateReligion?: string | null;
  /** ikonaId cywilizacji gracza (medalion Mocy na HUD). */
  civIconId?: string;
  /** kolorHex cywilizacji gracza (ramka medalionu). */
  civKolorHex?: string;
  /** Epoka gracza (1=kamień…) — portret władcy w medalionie Mocy (PORTRETY-WLADCOW). */
  playerEra?: number;
  /** Imię władcy gracza (tooltip medalionu). */
  playerWodz?: string;
  /** SUROW-HUD-01 (Maciej 2026-07-24) — wartość chipa „Surowce" (np. „7/9" dobrze/wszystkie). */
  surowceSummary?: string;
  /** true → czerwony/bursztynowy alert: co najmniej jeden surowiec na capie lub w niedoborze. */
  surowceAlert?: boolean;
  /** TEMAT 14 (Maciej 2026-07-24) — dochód z aktywnych tras handlowych (gracz↔obca cyw.) tej tury. */
  handelIncome?: number;
  /** Liczba aktywnych tras handlowych gracza (do tytułu chipa). */
  handelRouteCount?: number;
  /**
   * PYTANIE-84-U23A: bonus solny Spichlerza II (≥1 płaci Sól) — żywność armii poza
   * własnym terytorium 2→1 pkt/turę. Ustawia silnik w buildHudState (main.ts).
   */
  uchwalaSolAktywna?: boolean;
  /** Ile Spichlerzy II faktycznie płaci Sól w tej turze (do tooltipu / panelu). */
  uchwalaSolSpichlerzIICount?: number;
  /** Wojsko gracza na mapie (bez osadnika) — chip „Armia". */
  armyUnitsOnMap?: number;
  /** Suma odnowy puli rekrutów / turę (wszystkie miasta) — chip „Armia". */
  rekruciRegenPerTurn?: number;
}

export interface HudConfig {
  getState: () => HudState;
  onEndTurn?: () => void;
  onOpenCities?: () => void;
  onOpenScience?: () => void;
  onOpenDiplomacy?: () => void;
  onOpenMenu?: () => void;
  /** Wikipedia — poradnik + encyklopedia (toolbar + przycisk przy minimapie). */
  onOpenWiki?: () => void;
  isWikiActive?: () => boolean;

  /**
   * WARIANT A — MAPA renderuje swoj render do podanego elementu.
   * Wywolywane raz przy montowaniu minimapy. MAPA powinna startowac swoj
   * renderer (np. WebGL canvas) wewnatrz `el` o podanych wymiarach.
   * Priorytet: jesli obecny, uzyje sie tego wariantu (ignoruje getMinimapData).
   */
  onMountMinimap?: (el: HTMLElement, api: { width: number; height: number }) => void;

  /**
   * WARIANT B — UI pobiera dane i rysuje przegladowa minimape na <canvas>.
   * Wywolywane przy kazdym updateHud(). Zwroc null jesli dane niedostepne.
   */
  getMinimapData?: () => MinimapData | null;

  /**
   * Opcjonalny hak klikniecia na minimapie — przesuniecie kamery.
   * Argumenty q, r to przyblizony aksjalny hex pod kursorem.
   * Dostepny w obu wariantach.
   */
  onMinimapClick?: (q: number, r: number) => void;

  /** F2: przełączniki zasięgu kultury/religii obok minimapy. */
  minimapLayers?: MinimapLayerHooks;

  /** Playtest/dev: batony F/M obok minimapy (brak w produkcji). */
  minimapPlaytestFog?: MinimapPlaytestFogHooks;

  /** E-map-worker-overlay: toggle 👤 na mapie świata. */
  minimapWorkerOverlay?: MinimapWorkerOverlayHooks;

  /** D17=A: treść panelu kontekstowego (null = ukryty). @deprecated użyj getContextPanel */
  getContextPanelMessage?: () => string | null;

  /** D17=A + redesign 2026-07-28: karta heks/jednostka w panelu bocznym. */
  getContextPanel?: () => ContextPanelData | null;
  onContextExpand?: () => void;
  isContextExpanded?: () => boolean;
  onContextAction?: (actionId: string) => void;
  onContextSelectUnit?: (unitId: string) => void;

  /** Panel boczny (D1=C): wydarzenia z tury od silnika. */
  getEvents?: () => SidePanelEvent[];
  onEventClick?: (id: string) => void;
  onEventDismiss?: (id: string) => void;

  /**
   * A1-Q5: wojny prowadzone Z GRACZEM — tylko te na pasku mapy (minimalizm).
   * Brak haka → pasek ukryty. Klik chip → onOpenDiplomacy.
   */
  getWarsWithPlayer?: () => WarWithPlayer[];

  /** A1-Q9: WYKONAJ (przypomnienia) + koniec tury zawsze dostępny (D1B dolny pasek). */
  onExecutePending?: () => void;
  canEndTurn?: () => boolean;
  getBlockingCount?: () => number;
  getYearLabel?: () => string;
  /** Playtest walki: ukryj koniec tury. */
  hideEndTurn?: () => boolean;

  /** A1-Q6 / D1B: lewy toolbar mapy. */
  mapToolbar?: Omit<MapToolbarHudConfig, 'getWarBadge' | 'isBuildModeActive'>;
  /** A4: tryb budowy ulepszeń z mapy. */
  buildMode?: BuildModeHudConfig;
  /** Q-ARMIA-1 A: dolny pasek stosu armii (zamiast pojedynczego panelu jednostki). */
  armyStack?: ArmyStackHudConfig;

  /** P-C3: overlay Moc — dane od silnika. */
  getPowerOverlay?: () => PowerOverlayData | null;
  /** A1-Q16: overlaye imperium. */
  getCultureOverlay?: () => CultureOverlayData | null;
  getReligionOverlay?: () => ReligionOverlayData | null;
  /** Chip dyplomacji → panel z fokusem. */
  onDiploChip?: (kind: 'sojusz' | 'pakt' | 'wojna') => void;
  /** Panel boczny imperium (klik chipów zasobów). section = np. kultura, econ-praca. */
  onOpenEmpireDetail?: (section?: string) => void;
}

// ---------------------------------------------------------------------------
// Kolory terenu dla wariantu B (przeglad 2D)
// ---------------------------------------------------------------------------

const TEREN_KOLOR: Record<string, string> = {
  Laka: '#5a9e48',
  Rownina: '#9ab85c',
  Wzgorza: '#7b6e50',
  Gory: '#8a8a8a',
  Wybrzeze: '#78b8c8',
  Morze: '#2a6080',
  Pustynia: '#c8b46a',
};
const TEREN_KOLOR_DEFAULT = '#3a4450';

// ---------------------------------------------------------------------------
// Stan modulu
// ---------------------------------------------------------------------------

let cfg: HudConfig | null = null;
let barEl: HTMLDivElement | null = null;
let miniEl: HTMLDivElement | null = null;
let miniCanvas: HTMLCanvasElement | null = null;
let miniMounted = false;
let minimapApi: ReturnType<typeof createMinimapHud> | null = null;
let sidePanelApi: ReturnType<typeof createSidePanelHud> | null = null;
let bottomBarApi: ReturnType<typeof createBottomBarHud> | null = null;
let mapToolbarApi: ReturnType<typeof createMapToolbarHud> | null = null;
let buildModeApi: ReturnType<typeof createBuildModeHud> | null = null;
let armyStackApi: ReturnType<typeof createArmyStackHud> | null = null;
let leaderBannersApi: LeaderBannersHudApi | null = null;
let contextPanelApi: ContextPanelHudApi | null = null;
/** Ukryj dolny/prawy chrome mapy gdy otwarty panel miasta (nie przebija przez dim). */
let mapChromeSuppressed = false;
/** Ukryj panel rosteru armii (dolny stos „Armia · (x,y)") gdy otwarty overlay pre-battle
 * (T-BITWA-ROSTER, 2026-07-24) — niezalezne od mapChromeSuppressed, bo przy pre-battle
 * stos armii zostaje zaznaczony (nie jest czyszczony jak przy otwarciu panelu miasta). */
let armyStackSuppressed = false;
/** HUD zamontowany przez showHud (nie mylić z chwilowym ukryciem w panelu miasta). */
let hudSessionActive = false;
let barActionsBound = false;

// ---------------------------------------------------------------------------
// Pełny ekran + zoom UI (Maciej 2026-07-25 / 2026-07-28) — dock lewy dolny (mapa) lub lewy górny (miasto).
// Zero flagowania własnego stanu: zawsze pytamy document.fullscreenElement na
// żywo (renderBar czyta go przy każdym renderze), a zdarzenie 'fullscreenchange'
// tylko WYZWALA odświeżenie — dzięki temu F11 przeglądarki i Esc też trzymają
// przycisk/podpowiedź w zgodzie ze stanem (nie rozjeżdża się jak własna flaga).
// ---------------------------------------------------------------------------

let fsListenerBound = false;
let fsHintEl: HTMLDivElement | null = null;
let fsHintHideTimer: ReturnType<typeof setTimeout> | null = null;
let fsHintFadeTimer: ReturnType<typeof setTimeout> | null = null;

function isDocFullscreen(): boolean {
  return document.fullscreenElement != null;
}

function fullscreenSupported(): boolean {
  return typeof document.documentElement.requestFullscreen === 'function';
}

function ensureFsHintEl(): HTMLDivElement {
  if (fsHintEl !== null) return fsHintEl;
  const el = document.createElement('div');
  el.className = 'civ-fs-hint';
  el.textContent = 'Esc — wyjście z pełnego ekranu';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  fsHintEl = el;
  return el;
}

/** Dyskretna podpowiedź po wejściu w pełny ekran — sama gaśnie po ~4s. */
function showFullscreenHint(): void {
  const el = ensureFsHintEl();
  if (fsHintHideTimer !== null) { clearTimeout(fsHintHideTimer); fsHintHideTimer = null; }
  if (fsHintFadeTimer !== null) { clearTimeout(fsHintFadeTimer); fsHintFadeTimer = null; }
  el.style.display = 'block';
  void el.offsetWidth; // reflow — żeby transition opacity zadziałał od 0
  el.classList.add('show');
  fsHintHideTimer = setTimeout(() => {
    el.classList.remove('show');
    fsHintFadeTimer = setTimeout(() => { if (fsHintEl !== null) fsHintEl.style.display = 'none'; }, 300);
  }, 4000);
}

function hideFullscreenHint(): void {
  if (fsHintHideTimer !== null) { clearTimeout(fsHintHideTimer); fsHintHideTimer = null; }
  if (fsHintFadeTimer !== null) { clearTimeout(fsHintFadeTimer); fsHintFadeTimer = null; }
  if (fsHintEl !== null) { fsHintEl.classList.remove('show'); fsHintEl.style.display = 'none'; }
}

/** Rejestrowany raz na dokument — reaguje na zmianę stanu wywołaną ZARÓWNO
 *  naszym przyciskiem, jak i F11/Esc przeglądarki. */
function ensureFullscreenListener(): void {
  if (fsListenerBound) return;
  fsListenerBound = true;
  document.addEventListener('fullscreenchange', () => {
    renderBar();
    if (isDocFullscreen()) showFullscreenHint();
    else hideFullscreenHint();
  });
}

/** Cały DOM gry (canvas + HUD) wisi bezpośrednio pod <body> — brak osobnego
 *  kontenera-roota — więc fullscreenujemy documentElement, żeby w pełnym
 *  ekranie zostały widoczne i canvas, i cały HUD (siblingi canvasu). */
function toggleFullscreen(): void {
  if (isDocFullscreen()) {
    void document.exitFullscreen().catch(() => {
      // Przeglądarka odrzuciła wyjście — stan i tak czytamy na żywo z
      // document.fullscreenElement przy każdym renderze, więc UI nie rozjedzie się.
    });
    return;
  }
  if (!fullscreenSupported()) return;
  void document.documentElement.requestFullscreen().catch(() => {
    // Odrzucone (np. brak gestu użytkownika / brak wsparcia w danym kontekście) —
    // fullscreenchange się nie odpali, więc przycisk po prostu zostaje widoczny.
  });
}

// ---------------------------------------------------------------------------
// Powiększenie UI (Maciej 2026-07-28) — jak Ctrl +/- w przeglądarce; obok ⛶.
// Skaluje cały dokument (canvas + HUD + panele). Zapamiętuje wybór w localStorage.
// ---------------------------------------------------------------------------

const UI_ZOOM_STORAGE_KEY = 'civ-ui-zoom-v1';
const UI_ZOOM_MIN = 0.85;
const UI_ZOOM_MAX = 1.5;
const UI_ZOOM_STEP = 0.05;

let uiZoomLevel = 1;

function loadUiZoom(): number {
  try {
    const raw = localStorage.getItem(UI_ZOOM_STORAGE_KEY);
    if (raw === null) return 1;
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return 1;
    return Math.min(UI_ZOOM_MAX, Math.max(UI_ZOOM_MIN, Math.round(n * 100) / 100));
  } catch {
    return 1;
  }
}

function persistUiZoom(): void {
  try {
    localStorage.setItem(UI_ZOOM_STORAGE_KEY, String(uiZoomLevel));
  } catch {
    /* prywatny tryb / blokada storage */
  }
}

function applyUiZoom(): void {
  const root = document.documentElement;
  const body = document.body;
  const z = uiZoomLevel;
  if (z === 1) {
    root.classList.remove('civ-ui-zoom-active');
    root.style.removeProperty('--civ-ui-zoom');
    root.style.zoom = '';
    body.style.width = '';
    body.style.height = '';
    body.style.transform = '';
    body.style.transformOrigin = '';
    body.style.overflow = '';
    window.dispatchEvent(new Event('resize'));
    return;
  }
  // transform + odwrotna szerokość — skala wizualna bez „uciekania” menu poza viewport
  // (zoom na <html> powiększa layout poza oknem; transform trzyma wszystko w kadrze).
  root.classList.add('civ-ui-zoom-active');
  root.style.setProperty('--civ-ui-zoom', String(z));
  root.style.zoom = '';
  body.style.width = `${100 / z}vw`;
  body.style.height = `${100 / z}vh`;
  body.style.transform = `scale(${z})`;
  body.style.transformOrigin = 'top left';
  body.style.overflow = 'hidden';
  window.dispatchEvent(new Event('resize'));
}

function setUiZoom(next: number): void {
  uiZoomLevel = Math.min(UI_ZOOM_MAX, Math.max(UI_ZOOM_MIN, Math.round(next * 100) / 100));
  persistUiZoom();
  applyUiZoom();
  renderBar();
}

function stepUiZoom(delta: number): void {
  setUiZoom(uiZoomLevel + delta);
}

function renderZoomControls(): string {
  const pct = Math.round(uiZoomLevel * 100);
  const atMin = uiZoomLevel <= UI_ZOOM_MIN + 1e-6;
  const atMax = uiZoomLevel >= UI_ZOOM_MAX - 1e-6;
  return '<div class="civ-hud-zoom" title="Powiększenie całej gry (85%–150%) — menu pozostaje w kadrze">'
    + `<button type="button" class="b-zoom" data-act="zoom-out" aria-label="Pomniejsz"${atMin ? ' disabled' : ''}>−</button>`
    + `<span class="civ-hud-zoom-pct" aria-live="polite">${pct}%</span>`
    + `<button type="button" class="b-zoom" data-act="zoom-in" aria-label="Powiększ"${atMax ? ' disabled' : ''}>+</button>`
    + '</div>';
}

function ensureUiZoomApplied(): void {
  uiZoomLevel = loadUiZoom();
  applyUiZoom();
}

const useD1BLayout = (): boolean => cfg?.onExecutePending !== undefined || cfg?.mapToolbar !== undefined;

const MINI_W = 280;
const MINI_H = 170;

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-hud-css-w2ring3';
function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-hud-css')?.remove();
  document.getElementById('civ-hud-css-w2')?.remove();
  document.getElementById('civ-hud-css-w2b')?.remove();
  document.getElementById('civ-hud-css-w2full')?.remove();
  document.getElementById('civ-hud-css-w2ring2')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
html.civ-ui-zoom-active{overflow:hidden;width:100%;height:100%;}
html.civ-ui-zoom-active .civ-hud .civ-hud-banner-left{left:10px;max-width:min(38vw,480px);}
html.civ-ui-zoom-active .civ-hud .hud-right-cluster{right:10px;max-width:min(38vw,520px);}
html.civ-ui-zoom-active .civ-hud .civ-hud-banner-shell{padding:7px 10px;}
html.civ-ui-zoom-active .civ-hud .hud-chip-row{flex-wrap:wrap;max-width:100%;row-gap:2px;}
/* Etykiety PL (Skarbiec, Armia…) zostają widoczne także przy zoom UI — kanon mockup 6C. */
html.civ-ui-zoom-active .civ-hud .civ-hud-chip-lbl{font-size:10px;}
html.civ-ui-zoom-active .civ-hud .civ-hud-chip-sep{height:18px;margin:0 4px;}
html.civ-ui-zoom-active .civ-hud .power-center{min-width:210px;padding:9px 14px 7px;}
html.civ-ui-zoom-active .civ-hud .power-center .p-epoch{font-size:11px;margin-bottom:5px;}
html.civ-ui-zoom-active .civ-hud .power-center .p-val-num{font-size:21px;}
html.civ-ui-zoom-active .civ-hud .b-menu,
html.civ-ui-zoom-active .civ-hud .b-wiki{padding:0 11px;font-size:11px;letter-spacing:.12em;}
.civ-hud{position:fixed;inset:0;z-index:310;pointer-events:none;
  ${CIV_BRAND_SCOPE_VARS}
  --orange:var(--tg-orange);--green:var(--tg-green);--blue:var(--civ-science);--muted:var(--civ-text-muted);}
.civ-hud *{box-sizing:border-box;}
.civ-hud button{font-family:var(--civ-font-ui);cursor:pointer;}
.civ-hud .civ-hud-banner-shell{display:flex;align-items:center;padding:10px 14px;
  border-radius:12px;background:linear-gradient(180deg,rgba(20,26,38,.94),rgba(8,10,16,.95));
  border:1px solid rgba(232,216,138,.3);box-shadow:inset 0 1px 0 rgba(232,216,138,.18),0 6px 18px rgba(0,0,0,.55);
  flex-shrink:0;width:max-content;overflow:visible;}
.civ-hud .civ-hud-banner-left{pointer-events:auto;position:fixed;top:16px;left:20px;z-index:3;
  max-width:min(calc(50vw - 150px),600px);}
.civ-hud .civ-hud-banner-right{flex-shrink:0;max-width:min(calc(50vw - 340px),780px);}
.civ-hud .hud-right-cluster{pointer-events:auto;position:fixed;top:16px;right:20px;z-index:3;
  display:flex;align-items:center;gap:12px;max-width:calc(50vw - 150px);}
.civ-hud .hud-chip-row{display:flex;align-items:center;gap:0;flex-wrap:nowrap;flex-shrink:0;}
.civ-hud .civ-hud-chip{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;}
.civ-hud .civ-hud-chip-click{cursor:pointer;border-radius:8px;padding:2px 4px;margin:-2px -4px;}
.civ-hud .civ-hud-chip-click:hover{background:rgba(232,216,138,.06);}
.civ-hud .civ-hud-chip-sep{width:1px;height:24px;background:rgba(232,216,138,.2);margin:0 8px;flex-shrink:0;}
.civ-hud .civ-hud-chip-med{width:30px;height:30px;border-radius:50%;flex-shrink:0;
  display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.6);}
.civ-hud .civ-hud-chip-med.gold{background:radial-gradient(circle at 35% 30%,#f4e0a0,#a9861f);border:1px solid #6a5212;color:#3a2e08;}
.civ-hud .civ-hud-chip-med.science{background:radial-gradient(circle at 35% 30%,#8fb6e0,#3a5f8a);border:none;color:#0e2038;}
.civ-hud .civ-hud-chip-med.science.civ-science-med-ring{position:relative;border:none;box-shadow:none;}
.civ-hud .civ-hud-chip-med.science.civ-science-med-ring > .civ-science-prog-ring{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.civ-hud .civ-hud-chip-med.science.civ-science-med-ring .civ-hud-chip-med-ic{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;}
.civ-hud .civ-hud-chip-med.science .civ-science-owl-ic{width:17px;height:17px;color:#0a1628;position:relative;z-index:1;}
.civ-hud .civ-hud-chip-med svg:not(.civ-science-prog-ring){width:17px;height:17px;display:block;}
.civ-hud .civ-hud-chip-lbl{font-size:11px;color:var(--civ-text-muted);}
.civ-hud .civ-hud-chip-val{font-size:15px;font-weight:700;color:var(--civ-gold-primary);}
.civ-hud .civ-hud-chip-val.science{color:#7cb4e4;}
.civ-hud .civ-hud-chip-rate{font-size:10px;color:var(--tg-green);}
.civ-hud .civ-hud-chip-rate.warn{color:var(--tg-orange);}
.civ-hud .hud-right{display:flex;align-items:center;gap:12px;flex-shrink:0;}
.civ-hud .hud-meta{text-align:right;}
.civ-hud .b-menu{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 16px;
  border-radius:9px;border:1px solid rgba(232,216,138,.35);
  background:linear-gradient(180deg,#161c28,#0a0d14);color:var(--civ-gold-primary);
  font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;cursor:pointer;font-family:var(--civ-font-ui);}
.civ-hud .b-menu:hover{filter:brightness(1.06);border-color:rgba(232,216,138,.55);}
.civ-hud .b-menu svg{width:16px;height:16px;}
.civ-hud .civ-hud-zoom{display:inline-flex;align-items:stretch;flex-shrink:0;
  border-radius:9px;border:1px solid rgba(232,216,138,.35);
  background:linear-gradient(180deg,#161c28,#0a0d14);overflow:hidden;}
.civ-hud .b-zoom{display:inline-flex;align-items:center;justify-content:center;width:34px;height:42px;
  border:none;background:transparent;color:var(--civ-gold-primary);
  font-size:18px;font-weight:700;line-height:1;cursor:pointer;font-family:var(--civ-font-ui);}
.civ-hud .b-zoom:hover:not(:disabled){background:rgba(232,216,138,.1);}
.civ-hud .b-zoom:disabled{opacity:.35;cursor:default;}
.civ-hud .civ-hud-zoom-pct{min-width:40px;display:inline-flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--civ-text-muted);letter-spacing:.02em;padding:0 2px;border-left:1px solid rgba(232,216,138,.2);
  border-right:1px solid rgba(232,216,138,.2);}
/* Zoom + pełny ekran — tylko mapa świata, obok minimapy (Maciej 2026-07-28). */
.civ-hud .civ-hud-util-dock{pointer-events:auto;position:fixed;z-index:315;
  display:flex;align-items:center;gap:8px;
  left:calc(20px + ${MINI_W}px + 10px + 48px);bottom:20px;}
.civ-hud.is-city-view .civ-hud-util-dock{display:none!important;}
html.civ-ui-zoom-active .civ-hud .civ-hud-util-dock{
  left:calc(10px + ${MINI_W}px + 8px + 48px);bottom:16px;}
.civ-hud .b-wiki{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 16px;
  border-radius:9px;border:1px solid rgba(168,200,120,.38);cursor:pointer;font-family:var(--civ-font-ui);
  background:linear-gradient(180deg,#161c28,#0a0d14);color:var(--civ-wiki-accent,#a8c878);
  font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;}
.civ-hud .b-wiki:hover{filter:brightness(1.06);border-color:rgba(168,200,120,.55);}
.civ-hud .b-wiki.on{border-color:rgba(168,200,120,.72);background:linear-gradient(180deg,#1a2218,#0c100c);
  box-shadow:inset 0 0 0 1px rgba(168,200,120,.15),0 0 12px rgba(168,200,120,.12);}
.civ-hud .b-wiki .civ-wiki-ic{width:16px;height:16px;flex-shrink:0;}
.civ-hud .power-center{pointer-events:auto;position:fixed;left:50%;top:6px;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:stretch;gap:0;padding:12px 24px 10px;cursor:pointer;min-width:240px;z-index:4;
  background:linear-gradient(180deg,rgba(30,24,12,.96),rgba(14,10,6,.96));
  border:1px solid #a08030;border-top:none;border-radius:0 0 18px 18px;
  box-shadow:0 6px 22px rgba(0,0,0,.6),0 0 30px rgba(232,216,138,.18);}
.civ-hud .power-center:hover{filter:brightness(1.06);}
.civ-hud .power-center .p-epoch{text-align:center;font-family:var(--civ-font-title);font-size:13px;
  color:var(--civ-gold-primary);letter-spacing:.08em;line-height:1.2;margin:0 0 8px;white-space:nowrap;}
.civ-hud .power-center .p-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;width:100%;}
.civ-hud .power-center .p-side-left{justify-self:start;display:inline-flex;align-items:flex-start;
  cursor:pointer;border-radius:6px;padding:2px 6px;margin:-2px -6px;}
.civ-hud .power-center .p-side-left:hover{background:rgba(232,216,138,.08);}
.civ-hud .power-center .p-side-center{justify-self:center;display:inline-flex;align-items:center;justify-content:center;}
.civ-hud .power-center .p-side-right{justify-self:end;display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
.civ-hud .power-center .p-stack{display:flex;flex-direction:column;align-items:flex-start;gap:3px;}
.civ-hud .power-center .p-stack.p-stack-right{align-items:flex-end;}
.civ-hud .power-center .p-val-num{font-family:var(--civ-font-title);font-size:24px;color:#f4e6a8;line-height:1;}
.civ-hud .power-center .p-ic{display:inline-flex;align-items:center;justify-content:center;
  width:44px;height:44px;border-radius:50%;flex-shrink:0;
  background:radial-gradient(circle at 35% 30%,#f4e0a0,#a9861f);border:1.5px solid #6a5212;
  box-shadow:0 0 10px rgba(232,216,138,.22);}
.civ-hud .power-center .p-ic svg{width:28px;height:28px;display:block;color:#f4e6a8;}
.civ-hud .power-center .p-ic.p-ic-civ{background:radial-gradient(circle at 35% 30%,#2a3248,#0e1420);
  border:1.5px solid rgba(160,128,48,0.6);box-shadow:0 0 12px rgba(160,128,48,.25);}
.civ-hud .power-center .p-ic.p-ic-civ svg{width:30px;height:30px;}
.civ-hud .power-center .p-ic.p-ic-leader{position:relative;overflow:visible;padding:0;}
.civ-hud .power-center .p-ic.p-ic-leader .p-ic-portrait{display:block;width:44px;height:44px;border-radius:50%;
  object-fit:cover;object-position:center top;}
.civ-hud .power-center .p-ic .p-ic-signet{position:absolute;right:-3px;bottom:-3px;width:18px;height:18px;
  border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 35% 30%,#2a3248,#0e1420);border:1.5px solid rgba(160,128,48,0.75);
  box-shadow:0 0 6px rgba(0,0,0,.55);overflow:hidden;}
.civ-hud .power-center .p-ic .p-ic-signet svg{width:12px;height:12px;display:block;color:#f4e6a8;}
.civ-hud .power-center .p-recruit-ic{display:inline-flex;align-items:center;justify-content:center;color:#c8b888;}
.civ-hud .power-center .p-recruit-ic svg{width:20px;height:20px;display:block;}
.civ-hud .power-center .p-power-ic{display:inline-flex;align-items:center;justify-content:center;color:#d4bc78;}
.civ-hud .power-center .p-power-ic svg{width:20px;height:20px;display:block;}
.civ-hud .power-center .p-power-fleur{font-size:17px;line-height:1;color:#d4bc78;}
.civ-hud .power-center .p-recruit-val{font-size:15px;color:#f4e6a8;font-weight:700;font-family:var(--civ-font-title);}
.civ-hud .power-center .p-lbl{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:#a08030;}
.civ-hud .power-center .p-sub{display:none;}
.civ-hud.is-city-view .civ-hud-banner-left,
.civ-hud.is-city-view .civ-hud-banner-right,
.civ-hud.is-city-view .power-center{display:none!important;}
.civ-hud.is-city-view .hud-meta{display:none!important;}
.civ-hud.is-city-view .hud-right-cluster{top:8px;
  right:calc(32px + min(26vw,300px) + 16px + 46px + 10px);
  z-index:407;flex-direction:column;align-items:stretch;gap:5px;max-width:min(148px,calc(100vw - 32px));}
.civ-hud.is-city-view .hud-right-cluster .hud-right{flex-direction:column;align-items:stretch;gap:5px;}
.civ-hud.is-city-view .hud-right-cluster .b-menu,
.civ-hud.is-city-view .hud-right-cluster .b-wiki{height:36px;padding:0 10px;font-size:10px;letter-spacing:.12em;justify-content:center;}
.civ-mini{position:fixed;left:20px;bottom:20px;width:${MINI_W}px;height:${MINI_H}px;z-index:309;display:none;}
.civ-mini-placeholder{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#9aa6b6;font:11px monospace;text-align:center;}
.civ-fs-hint{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;
  display:none;padding:6px 14px;border-radius:8px;pointer-events:none;
  background:rgba(8,12,20,.92);color:var(--civ-text-muted);
  border:1px solid rgba(232,216,138,.3);font:12px var(--civ-font-ui);letter-spacing:.02em;
  opacity:0;transition:opacity .3s ease;box-shadow:0 6px 20px rgba(0,0,0,.45);}
.civ-fs-hint.show{opacity:1;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Pasek zasobow
// ---------------------------------------------------------------------------

function res(icon: string, val: string, lbl: string, rate?: string, rateO?: boolean, act?: string): string {
  const clickCls = act ? ' res-click' : '';
  const actAttr = act ? ` data-act="${act}" role="button" tabindex="0" title="Klik — ${lbl}"` : '';
  let r = '<div class="res' + clickCls + '"' + actAttr + '><div class="top"><span class="ic">' + icon + '</span><span class="val">' + val + '</span>';
  if (rate !== undefined) r += '<span class="rate' + (rateO === true ? ' o' : '') + '">' + rate + '</span>';
  r += '</div><span class="lbl">' + lbl + '</span></div>';
  return r;
}

function signed(n: number): string { return signedPl(n); }

/** Pierścień Nauki: postęp bieżącej tech (nie epoki). buildHudState ustawia researchProgress. */
function resolveResearchProgress(s: HudState): number {
  const p = s.researchProgress ?? s.epokaPostep ?? 0;
  return Math.max(0, Math.min(1, p));
}

function formatFoodHudLabel(s: HudState): string {
  const max = s.zywnoscMax;
  const base = `${s.zywnoscLabel} 🍞`;
  if (max != null && max > 0) return `${s.zywnoscLabel} / ${max} 🍞`;
  return base;
}

/** Odmiana „tura" w bierniku ("za 1 turę" / "za 2 tury" / "za 5 tur"). */
function slowoTuraHud(n: number): string {
  const a = Math.abs(n);
  if (a === 1) return 'turę';
  const m10 = a % 10;
  const m100 = a % 100;
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'tury';
  return 'tur';
}

/**
 * NAPRAWA HUD-SKARBIEC (Maciej 2026-07-26, zgłoszenie z playtestu, bundle
 * 2f928932): tooltip chipu „Skarbiec" rozbija liczbę „+N" na składniki, żeby
 * gracz widział skąd się bierze przyrost/spadek — wpływy (Podatek +
 * budynki, Handel ze szlaków) minus utrzymanie (budynki, jednostki). Suma
 * składników równa się dokładnie wyświetlanemu „+N" (oba liczone z tych samych
 * pól HudState, patrz main.ts buildHudState()).
 */
function skarbiecChipTitle(s: HudState): string {
  const base = 'Skarbiec — bilans na turę';
  const wplywyBrutto = s.bogactwoWplywyBrutto ?? 0;
  const handel = s.bogactwoHandel ?? 0;
  const daninaIBudynki = wplywyBrutto - handel;
  const utrzymanieBudynkow = s.bogactwoUtrzymanieBudynkow ?? 0;
  const utrzymanieJednostek = s.bogactwoUtrzymanieJednostek ?? 0;
  const netto = s.bogactwoRate ?? 0;
  return `${base}: Podatek i budynki: ${signed(daninaIBudynki)} pkt Pieniądza`
    + ` · Handel ze szlaków: ${signed(handel)} pkt Pieniądza`
    + ` · Utrzymanie budynków: ${signed(-utrzymanieBudynkow)} pkt Pieniądza`
    + ` · Utrzymanie jednostek: ${signed(-utrzymanieJednostek)} pkt Pieniądza`
    + ` · Razem netto: ${signed(netto)} pkt Pieniądza. Kliknij po szczegóły.`;
}

/**
 * NAPRAWA HUD-PRACA (Maciej 2026-07-26, ten sam wzorzec/zgłoszenie co Skarbiec):
 * tooltip chipu „Praca" rozbija „+N" na wpływ brutto do puli imperium minus
 * utrzymanie ulepszeń surowcowych (civ-wide/turę). pracaRate jest już NETTO
 * (main.ts), więc brutto = pracaRate + pracaUpkeep.
 */
function pracaChipTitle(s: HudState): string {
  const base = 'Praca — bilans na turę';
  const netto = s.pracaRate ?? 0;
  const utrzymanie = s.pracaUpkeep ?? 0;
  const wplywBrutto = netto + utrzymanie;
  return `${base}: Wpływ do puli imperium: ${signed(wplywBrutto)} pkt Pracy`
    + ` · Utrzymanie ulepszeń surowcowych: ${signed(-utrzymanie)} pkt Pracy`
    + ` · Razem netto: ${signed(netto)} pkt Pracy. Kliknij po szczegóły.`;
}

function naukaChipTitle(s: HudState): string {
  const stock = Math.floor(s.nauka);
  const rate = s.naukaRate ?? 0;
  return `Nauka — badania technologiczne`
    + ` · Duża liczba: ${stock} pkt Nauki (skumulowane do bieżącej technologii)`
    + ` · Zielone +N: ${signed(rate)} pkt Nauki/turę (przyrost netto)`
    + ` · Kliknij po szczegóły.`;
}

/** Tooltip chipu „Spichlerz" — magazyn centralny żywności imperium. */
function spichlerzChipTitle(s: HudState): string {
  const maxPart = s.zywnoscMax != null && s.zywnoscMax > 0 ? ` / ${s.zywnoscMax}` : '';
  const netto = s.zywnoscRate ?? 0;
  const wplyw = s.zywnoscWplywMiast ?? 0;
  const koszt = s.zywnoscKosztWojska ?? 0;
  let title = `Spichlerz — magazyn centralny żywności`
    + ` · W magazynie: ${s.zywnoscLabel}${maxPart} 🍞`
    + ` · Przyrost zapasów (prognoza): ${signed(netto)} 🍞/turę`
    + ` · Nadwyżka miast → centrala: ${signed(wplyw)} 🍞/turę`
    + ` · Koszt armii: ${signed(-koszt)} 🍞/turę`;
  if (s.glodWojska) title += ` · Głód wojska: atrycja HP trwa!`;
  else if (s.zywnoscKarencjaZaTur != null && s.zywnoscKarencjaZaTur > 0) {
    title += ` · Głód wojska za ${s.zywnoscKarencjaZaTur} ${slowoTuraHud(s.zywnoscKarencjaZaTur)} — magazyn ujemny!`;
  }
  if (s.uchwalaSolAktywna) {
    const n = s.uchwalaSolSpichlerzIICount ?? 1;
    title += ` · Uchwała „Solanka zapasowa" (Spichlerz II · Sól): armia poza terytorium 2→1 🍞/turę`
      + (n > 1 ? ` · ${n}× Spichlerz II` : '');
  }
  return `${title} · Kliknij po szczegóły.`;
}

/** Tooltip chipu „Armia" — wojsko na mapie i pula rekrutów. */
function armiaChipTitle(s: HudState): string {
  const units = s.armyUnitsOnMap ?? 0;
  const regen = s.rekruciRegenPerTurn ?? 0;
  const koszt = s.zywnoscKosztWojska ?? 0;
  const maxPart = s.zywnoscMax != null && s.zywnoscMax > 0 ? ` / ${s.zywnoscMax}` : '';
  let title = `Armia — wojsko i rekruci`
    + ` · Jednostki na mapie: ${units}`
    + ` · Pula rekrutów: ${s.rekruciLabel ?? '—'}`
    + ` · Odnowa puli: ${signed(regen)} rekr./turę`;
  if (koszt > 0) title += ` · Koszt żywności armii: ${signed(-koszt)} 🍞/turę`;
  title += ` · W magazynie państwa: ${s.zywnoscLabel}${maxPart} 🍞`;
  if (s.glodWojska) title += ` · Głód wojska: atrycja HP trwa!`;
  return `${title} · Kliknij po szczegóły.`;
}

function ludnoscChipTitle(s: HudState): string {
  const rate = s.ludnoscRate ?? 0;
  return `Ludność — ludność w miastach imperium`
    + ` · Duża liczba: ${s.ludnosc} ludności (łącznie we wszystkich miastach)`
    + ` · Zielone +N: ${signed(rate)} ludności/turę (przyrost netto)`
    + ` · Kliknij po szczegóły.`;
}

function kulturaChipTitle(s: HudState): string {
  const stock = Math.floor(s.kultura);
  const rate = s.kulturaRate ?? 0;
  return `Kultura — wpływ kulturowy imperium`
    + ` · Duża liczba: ${stock} pkt Kultury (zapas imperium)`
    + ` · Zielone +N: ${signed(rate)} pkt Kultury/turę (przyrost netto)`
    + ` · Kliknij po szczegóły.`;
}

function religiaChipTitle(s: HudState): string {
  const stock = Math.round(s.religionStock ?? 0);
  const rate = s.religionRate ?? 0;
  const rel = s.stateReligion ? ` (${s.stateReligion})` : '';
  return `Religia — wierni religii państwa${rel}`
    + ` · Duża liczba: ${stock} wiernych (łącznie w imperium)`
    + ` · Zielone +N: ${signed(rate)} wiernych/turę (szerzenie netto)`
    + ` · Kliknij po szczegóły.`;
}

function surowceChipTitle(s: HudState): string {
  const summary = s.surowceSummary ?? '—';
  let title = `Surowce — magazyn państwa`
    + ` · Podsumowanie: ${summary} surowców magazynowanych bez alertu (OK / wszystkie)`;
  if (s.surowceAlert) {
    title += ` · ⚠ Alert: co najmniej jeden surowiec na limicie magazynu lub w niedoborze`;
  }
  return `${title} · Kliknij po szczegóły.`;
}

function handelChipTitle(s: HudState): string {
  const income = s.handelIncome ?? 0;
  const routes = s.handelRouteCount ?? 0;
  return `Handel — wymiana z obcymi cywilizacjami`
    + ` · Liczba na chipie: ${signed(income)} pkt Pieniądza/turę (dochód z ${routes} aktywnych tras handlowych)`
    + ` · Kliknij po szczegóły.`;
}

function hudIc(id: IconId): string {
  return iconHtml(id, 24) || '';
}

/**
 * Medalion Mocy — portret władcy gracza + sygnet cywilizacji (PORTRETY-WLADCOW 2026-07-23).
 * Fallback: sam sygnet SVG gdy brak pliku portretu.
 */
function powerCenterIconHtml(s: HudState): string {
  const civId = s.civIconId ?? 'grecy';
  const era = s.playerEra ?? 1;
  const borderColor = s.civKolorHex ?? '';
  const border = borderColor ? ` style="border-color:${borderColor}"` : '';
  const signetStyle = borderColor ? ` style="border-color:${borderColor}"` : '';
  const civSignetSvg = civIconSvg(civId, 24);
  const signetHtml = civSignetSvg
    ? `<span class="p-ic-signet"${signetStyle} aria-hidden="true">${civSignetSvg.replace(
      '<svg ',
      '<svg width="12" height="12" ',
    )}</span>`
    : '';
  const portraitUrl = leaderPortraitUrl(civId, era);
  const titleParts = [s.playerWodz, s.nacja].filter(Boolean);
  const titleAttr = titleParts.length > 0
    ? ` title="${escHtml(titleParts.join(' · '))}"`
    : '';
  if (portraitUrl) {
    return `<span class="p-ic p-ic-civ p-ic-leader"${border}${titleAttr} aria-hidden="true">`
      + `<img class="p-ic-portrait" src="${escHtml(portraitUrl)}" alt="">`
      + signetHtml
      + `</span>`;
  }
  if (civSignetSvg) {
    return `<span class="p-ic p-ic-civ"${border}${titleAttr} aria-hidden="true">${civSignetSvg}</span>`;
  }
  const fallback = brandIconSvg('res-influence', 32) || hudIc('res-influence');
  return `<span class="p-ic" aria-hidden="true">${fallback}</span>`;
}

function recruitSideIconHtml(): string {
  const svg = brandIconSvg('tb-army', 22) || brandIconSvg('cp-recruit', 22);
  if (svg) return `<span class="p-recruit-ic" aria-hidden="true">${svg}</span>`;
  return '<span class="p-recruit-ic" aria-hidden="true">⚔</span>';
}

/** Symbol Mocy (cygnet / wpływ) — nad liczbą po prawej. */
function powerSymbolHtml(): string {
  const svg = brandIconSvg('res-influence', 22);
  if (svg) {
    return `<span class="p-power-ic" aria-hidden="true" title="Moc imperium — siła absolutna państwa">${svg}</span>`;
  }
  return '<span class="p-power-ic p-power-fleur" aria-hidden="true" title="Moc imperium — siła absolutna państwa">⚜</span>';
}

function renderBarD1B(s: HudState): string {
  const powerIconHtml = powerCenterIconHtml(s);
  const leftChips: string[] = [
    chip6cHtml({
      iconId: 'res-treasury',
      label: 'Skarbiec',
      value: String(s.bogactwo),
      rate: signed(s.bogactwoRate ?? 0),
      act: 'skarbiec',
      title: skarbiecChipTitle(s),
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-work',
      label: 'Praca',
      value: String(s.praca),
      rate: signed(s.pracaRate),
      rateWarn: s.pracaRate < 0,
      act: 'praca',
      title: pracaChipTitle(s),
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-food',
      iconAssetId: 'cp-granary',
      label: 'Spichlerz',
      value: formatFoodHudLabel(s),
      rate: signed(s.zywnoscRate ?? 0),
      rateWarn: !!(s.glodWojska || (s.zywnoscRate ?? 0) < 0),
      act: 'spichlerz',
      title: spichlerzChipTitle(s),
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-resources',
      label: 'Surowce',
      value: '',   // Maciej 2026-07-24: bez liczby na chipie (był „9/9") — sam żeton + klik po magazyn
      rate: s.surowceAlert ? '⚠' : undefined,
      rateWarn: !!s.surowceAlert,
      act: 'surowce',
      title: surowceChipTitle(s),
    }),
    chip6cSep(),
    // DYSPOZYCJA 85 (Maciej 2026-07-26): Handel przeniesiony NA KONIEC, za Surowce.
    // Kolejność paska: Skarbiec · Praca · Spichlerz · Surowce · Handel.
    chip6cHtml({
      iconId: 'res-trade',
      label: 'Handel',
      value: signed(s.handelIncome ?? 0),
      act: 'handel',
      title: handelChipTitle(s),
    }),
  ];
  const rightChips: string[] = [
    chip6cHtml({
      iconId: 'res-science',
      label: 'Nauka',
      value: String(Math.floor(s.nauka)),
      rate: signed(s.naukaRate ?? 0),
      medVariant: 'science',
      valClass: ' science',
      act: 'nauka',
      title: naukaChipTitle(s),
      researchProgress: resolveResearchProgress(s),
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'tb-army',
      label: 'Armia',
      value: String(s.armyUnitsOnMap ?? 0),
      rate: signed(s.rekruciRegenPerTurn ?? 0),
      rateWarn: !!s.glodWojska,
      act: 'armia',
      title: armiaChipTitle(s),
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-population',
      label: 'Ludność',
      value: String(s.ludnosc),
      rate: signed(s.ludnoscRate ?? 0),
      act: 'ludnosc',
      title: ludnoscChipTitle(s),
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-culture',
      label: 'Kultura',
      value: signed(s.kultura),
      rate: signed(s.kulturaRate ?? 0),
      act: 'kultura',
      title: kulturaChipTitle(s),
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-religion',
      label: 'Religia',
      value: String(Math.round(s.religionStock ?? 0)),
      rate: signed(s.religionRate ?? 0),
      act: 'religia',
      title: religiaChipTitle(s),
    }),
  ];

  const rekrLabel = s.rekruciLabel ?? '—';

  let html = '<div class="civ-hud-banner-shell civ-hud-banner-left"><div class="hud-chip-row">'
    + leftChips.join('') + '</div></div>';

  html += '<div class="power-center" data-act="power" title="Moc imperium — siła absolutna państwa · Duża liczba: punkty Mocy (łączna siła imperium) · Kliknij po szczegóły.">'
    + '<div class="p-epoch">' + escHtml(s.epoka) + '</div>'
    + '<div class="p-row">'
    + `<span class="p-side p-side-left" data-act="rekruci" title="Rekruci — pula rekrutacji (Manpower) · Liczba: aktualna pula werbu do szkolenia wojsk · Kliknij po szczegóły.">`
    + '<span class="p-stack">'
    + recruitSideIconHtml()
    + `<span class="p-recruit-val">${rekrLabel}</span>`
    + '</span></span>'
    + `<span class="p-side p-side-center">${powerIconHtml}</span>`
    + `<span class="p-side p-side-right">`
    + '<span class="p-stack p-stack-right">'
    + powerSymbolHtml()
    + `<span class="p-val-num">${s.power}</span>`
    + '</span>'
    + `<span class="p-lbl">${mocLabel()}</span>`
    + `</span></div></div>`;

  const menuIc = brandIconSvg('ui-menu', 24);
  const wikiOn = cfg?.isWikiActive?.() ?? false;
  const wikiBtn = (!mapChromeSuppressed && cfg?.onOpenWiki)
    ? '<button type="button" class="b-wiki' + (wikiOn ? ' on' : '') + '" data-act="wiki" title="Civpedia — poradnik i encyklopedia">'
      + wikiBookIcon(16)
      + '<span>Civpedia</span></button>'
    : '';
  // Pełny ekran ⛶ — przy minimapie na mapie świata; w mieście obok Menu.
  const fsBtn = (fullscreenSupported() && !isDocFullscreen())
    ? '<button type="button" class="b-menu" data-act="fullscreen" title="Pełny ekran" aria-label="Pełny ekran">'
      + '<span aria-hidden="true">⛶</span></button>'
    : '';
  const showMapZoomDock = !mapChromeSuppressed;
  const menuBtn = (!mapChromeSuppressed && cfg?.onOpenMenu)
    ? '<button type="button" class="b-menu" data-act="menu" title="Menu główne">'
      + (menuIc || '') + '<span>Menu</span></button>'
    : '';
  html += '<div class="hud-right-cluster">'
    + '<div class="civ-hud-banner-shell civ-hud-banner-right"><div class="hud-chip-row">'
    + rightChips.join('') + '</div></div>'
    + '<div class="hud-right">'
    + wikiBtn
    + menuBtn
    + (showMapZoomDock ? '' : fsBtn)
    + '</div></div>';
  if (showMapZoomDock) {
    html += '<div class="civ-hud-util-dock" title="Powiększenie UI i pełny ekran">'
      + renderZoomControls()
      + fsBtn
      + '</div>';
  }
  return html;
}

function renderBarLegacy(s: HudState): string {
  let html = '';
  html += '<div class="grp">' + res('\u{1FA99}', String(s.zloto), 'Złoto', signed(s.zlotoRate))
    + res('\u{1F528}', String(s.praca), 'Praca', signed(s.pracaRate), true) + '</div>';
  html += '<div class="grp">' + res(naukaHudWordHtml(), String(Math.floor(s.nauka)), 'Badania', signed(s.naukaRate ?? 0), false, 'science')
    + res('\u{1F3BC}', signed(s.kultura), 'Kultura', signed(s.kulturaRate ?? 0)) + '</div>';
  html += '<div class="grp">' + res('\u{1F3D8}\uFE0F', s.osiedla + '<span class="lim">/' + s.osiedlaMax + '</span>', 'Osiedla') + '</div>';
  const pct = Math.round(Math.max(0, Math.min(1, s.epokaPostep ?? 0)) * 100);
  html += '<div class="epoch"><span class="e-l">Epoka: <b style="color:var(--gold)">' + s.epoka + '</b>'
    + (s.badana != null ? ' · ' + s.badana : '') + '</span><div class="e-b"><div class="e-f" style="width:' + pct + '%"></div></div></div>';
  html += '<div class="right"><span class="turn">Tura <b>' + s.tura + '</b></span>';
  html += '<button class="b" data-act="cities">\u{1F3D9} Miasta</button>'
    + '<button class="b" data-act="science">Nauka</button>'
    + '<button class="b" data-act="diplo">\u{1F91D} Dyplomacja</button>'
    + '<button class="b" data-act="menu">\u2630</button>'
    + '<button class="end" data-act="end">Zakończ turę \u25B6</button></div>';
  return html;
}

function handleHudBarAction(act: string): void {
  if (cfg === null) return;
  if (act === 'end') cfg.onEndTurn?.();
  else if (act === 'cities') cfg.onOpenCities?.();
  else if (act === 'science') cfg.onOpenScience?.();
  else if (act === 'diplo') cfg.onOpenDiplomacy?.();
  else if (act === 'wiki') cfg.onOpenWiki?.();
  else if (act === 'menu') cfg.onOpenMenu?.();
  else if (act === 'fullscreen') toggleFullscreen();
  else if (act === 'zoom-in') stepUiZoom(UI_ZOOM_STEP);
  else if (act === 'zoom-out') stepUiZoom(-UI_ZOOM_STEP);
  else if (act === 'power') {
    hideEmpireOverlay();
    hidePowerOverlay();
    if (cfg.onOpenEmpireDetail) cfg.onOpenEmpireDetail(empireSectionFromHudAct('moc'));
    else {
      const data = cfg.getPowerOverlay?.();
      if (data) {
        const hudCfg = cfg;
        const refreshPower = () => {
          const fresh = hudCfg.getPowerOverlay?.();
          if (fresh) showPowerOverlay(fresh, undefined, refreshPower);
        };
        showPowerOverlay(data, undefined, refreshPower);
      }
    }
  } else if (act === 'religia' || act === 'kultura' || act === 'skarbiec' || act === 'praca' || act === 'nauka'
    || act === 'ludnosc' || act === 'rekruci' || act === 'spichlerz' || act === 'zywnosc' || act === 'armia'
    || act === 'surowce' || act === 'handel') {
    hideEmpireOverlay();
    const section = empireSectionFromHudAct(act);
    if (cfg.onOpenEmpireDetail) cfg.onOpenEmpireDetail(section);
    else if (act === 'kultura') {
      const data = cfg.getCultureOverlay?.();
      if (data) showCultureOverlay(data);
    } else if (act === 'religia') {
      const data = cfg.getReligionOverlay?.();
      if (data) showReligionOverlay(data);
    }
  }
}

function ensureBarActionsBound(): void {
  if (barEl === null || barActionsBound) return;
  barActionsBound = true;
  barEl.addEventListener('click', (e: MouseEvent) => {
    const t = e.target as HTMLElement | null;
    if (t === null || cfg === null) return;
    const el = t.closest('[data-act]') as HTMLElement | null;
    if (el === null || !barEl!.contains(el)) return;
    const act = el.getAttribute('data-act');
    if (act === null) return;
    handleHudBarAction(act);
  });
  barEl.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target as HTMLElement | null;
    if (t === null || cfg === null) return;
    const el = t.closest('[data-act]') as HTMLElement | null;
    if (el === null || !barEl!.contains(el)) return;
    const act = el.getAttribute('data-act');
    if (act === null) return;
    e.preventDefault();
    handleHudBarAction(act);
  });
}

function renderBar(): void {
  if (barEl === null || cfg === null) return;
  const s = cfg.getState();
  barEl.innerHTML = useD1BLayout() ? renderBarD1B(s) : renderBarLegacy(s);
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// ---------------------------------------------------------------------------
// Minimapa — wariant B: rysowanie na canvas
// ---------------------------------------------------------------------------

function renderMinimapCanvas(data: MinimapData): void {
  if (miniCanvas === null) return;
  const ctx = miniCanvas.getContext('2d');
  if (ctx === null) return;

  const W = MINI_W;
  const H = MINI_H;
  miniCanvas.width = W;
  miniCanvas.height = H;

  const cellW = W / data.cols;
  const cellH = H / data.rows;

  // Rysuj komorki heksow (uproszczone prostokaty — przegladowa minimapa)
  for (const hex of data.hexes) {
    const px = hex.q * cellW;
    const py = hex.r * cellH;
    const kolor = TEREN_KOLOR[hex.teren] ?? TEREN_KOLOR_DEFAULT;
    ctx.fillStyle = kolor;
    ctx.fillRect(Math.floor(px), Math.floor(py), Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);

    // Obrys wlasciciela (cienka ramka w kolorze gracza)
    if (hex.ownerColor !== undefined && hex.ownerColor !== '') {
      ctx.strokeStyle = hex.ownerColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.floor(px) + 0.5, Math.floor(py) + 0.5, Math.ceil(cellW), Math.ceil(cellH));
    }
  }

  // Prostokat widoku (viewport)
  if (data.viewport !== undefined) {
    const vp = data.viewport;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      Math.floor(vp.x * cellW) + 0.5,
      Math.floor(vp.y * cellH) + 0.5,
      Math.ceil(vp.w * cellW),
      Math.ceil(vp.h * cellH)
    );
  }
}

// ---------------------------------------------------------------------------
// Minimapa — montowanie slotu
// ---------------------------------------------------------------------------

function buildMinimapLayers(): MinimapLayerHooks | undefined {
  if (cfg === null) return undefined;
  const base = cfg.minimapLayers ?? {};
  const layers: MinimapLayerHooks = { ...base };
  if (!layers.onOpenCulturePanel && (cfg.onOpenEmpireDetail || cfg.getCultureOverlay)) {
    layers.onOpenCulturePanel = () => {
      if (cfg?.onOpenEmpireDetail) {
        hideEmpireOverlay();
        cfg.onOpenEmpireDetail(empireSectionFromHudAct('kultura'));
      } else {
        const data = cfg?.getCultureOverlay?.();
        if (data) showCultureOverlay(data);
      }
    };
  }
  if (!layers.onOpenReligionPanel && cfg.getReligionOverlay) {
    layers.onOpenReligionPanel = () => {
      const data = cfg?.getReligionOverlay?.();
      if (data) showReligionOverlay(data);
    };
  }
  const hasAny = layers.onToggleCulture || layers.onToggleReligion || layers.onToggleTerritory
    || layers.onOpenCulturePanel || layers.onOpenReligionPanel;
  return hasAny ? layers : undefined;
}

function mountMinimap(): void {
  if (cfg === null || miniMounted) return;

  // D15=B: modul minimapHud (preferowany gdy getMinimapData)
  if (cfg.getMinimapData !== undefined && minimapApi === null) {
    minimapApi = createMinimapHud({
      getMinimapData: cfg.getMinimapData,
      onMinimapClick: cfg.onMinimapClick,
      layers: buildMinimapLayers(),
      playtestFog: cfg.minimapPlaytestFog,
      workerOverlay: cfg.minimapWorkerOverlay,
      width: MINI_W,
      height: MINI_H,
    });
    document.body.appendChild(minimapApi.el);
    miniMounted = true;
    return;
  }

  if (miniEl === null) return;

  if (cfg.onMountMinimap !== undefined) {
    // Wariant A: MAPA renderuje do naszego elementu
    miniEl.innerHTML = '';
    cfg.onMountMinimap(miniEl, { width: MINI_W, height: MINI_H });
    miniMounted = true;
  } else if (cfg.getMinimapData !== undefined) {
    // Wariant B: canvas rysowany przez UI
    miniEl.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = MINI_W;
    canvas.height = MINI_H;
    miniEl.appendChild(canvas);
    miniCanvas = canvas;
    miniMounted = true;

    // Klik na minimapie — mapowanie pikseli na hex
    canvas.addEventListener('click', (e: MouseEvent) => {
      if (cfg?.onMinimapClick === undefined || cfg.getMinimapData === undefined) return;
      const data = cfg.getMinimapData();
      if (data === null) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const q = Math.floor((px / rect.width) * data.cols);
      const r = Math.floor((py / rect.height) * data.rows);
      cfg.onMinimapClick(q, r);
    });
  } else {
    // Placeholder
    miniEl.innerHTML = '<div class="civ-mini-placeholder">Minimapa\n— render: dział MAPA</div>';
    miniMounted = true;
  }

  // Klik na minimapie w wariancie A (przekazujemy do onMinimapClick przez element)
  if (cfg.onMountMinimap !== undefined && cfg.onMinimapClick !== undefined) {
    miniEl.addEventListener('click', (e: MouseEvent) => {
      if (cfg?.onMinimapClick === undefined || cfg.getMinimapData === undefined) return;
      // W wariancie A dane heksow nie sa dostepne — przekazujemy pozycje -1,-1
      // (MAPA moze dostarczyc onMinimapClick bezposrednio przez swoj renderer)
      const rect = miniEl!.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      // Przyblizenie: znormalizowane wspolrzedne jako q,r (MAPA przelicza sama)
      cfg.onMinimapClick(Math.round(nx * 100), Math.round(ny * 100));
    });
  }
}

let minimapDirty = true;
/** D11: minimapa przerysowuje 320k heksów — rób to TYLKO gdy mapa/mgła/terytorium się zmieni
 *  (wołane z refreshFog), nie na każdym odświeżeniu HUD (wejście do miasta/hover/ekonomia). */
export function markMinimapDirty(): void { minimapDirty = true; }
function refreshMinimap(): void {
  if (cfg === null) return;
  if (!miniMounted) { mountMinimap(); }
  if (!minimapDirty) return;
  minimapDirty = false;
  if (minimapApi !== null) {
    minimapApi.update();
    if (cfg.getState !== undefined) setMinimapTurnLabel(minimapApi, cfg.getState().tura);
    return;
  }
  if (miniEl === null) return;
  if (cfg.getMinimapData !== undefined && miniCanvas !== null) {
    const data = cfg.getMinimapData();
    if (data !== null) renderMinimapCanvas(data);
  }
}

function mountSidePanel(): void {
  if (cfg === null || sidePanelApi !== null) return;
  sidePanelApi = createSidePanelHud({
    getEvents: cfg.getEvents,
    getContextPanel: cfg.getContextPanel
      ?? (cfg.getContextPanelMessage
        ? () => {
          const html = cfg!.getContextPanelMessage?.() ?? null;
          return html ? { kind: 'hex' as const, html } : null;
        }
        : undefined),
    getHexContext: cfg.getContextPanelMessage
      ? () => cfg!.getContextPanelMessage?.() ?? null
      : undefined,
    onContextExpand: cfg.onContextExpand,
    isContextExpanded: cfg.isContextExpanded,
    onContextAction: cfg.onContextAction,
    onContextSelectUnit: cfg.onContextSelectUnit,
    onEventClick: cfg.onEventClick,
    onEventDismiss: cfg.onEventDismiss,
  });
  document.documentElement.appendChild(sidePanelApi.el);
  document.documentElement.appendChild(sidePanelApi.ctxEl);
}

function refreshSidePanel(): void {
  if (sidePanelApi !== null) sidePanelApi.update();
}

function mountBottomBar(): void {
  if (cfg === null || bottomBarApi !== null) return;
  if (!useD1BLayout()) return;
  bottomBarApi = createBottomBarHud({
    getTurn: () => cfg!.getState().tura,
    getYearLabel: cfg.getYearLabel,
    onExecutePending: cfg.onExecutePending,
    onEndTurn: cfg.onEndTurn,
    canEndTurn: cfg.canEndTurn,
    getBlockingCount: cfg.getBlockingCount,
    hideEndTurn: cfg.hideEndTurn,
  });
}

function mountMapToolbar(): void {
  if (cfg === null || mapToolbarApi !== null || cfg.mapToolbar === undefined) return;
  const base = cfg.mapToolbar;
  mapToolbarApi = createMapToolbarHud({
    ...base,
    getWarBadge: () => cfg!.getWarsWithPlayer?.().length ?? 0,
    isBuildModeActive: () => cfg!.buildMode?.isOpen() ?? false,
    isCityListActive: base.isCityListActive,
    isArmyListActive: base.isArmyListActive,
    isDiploListActive: base.isDiploListActive,
    isScienceHubActive: base.isScienceHubActive,
    getResearchProgress: () => resolveResearchProgress(cfg!.getState()),
  });
}

function mountBuildMode(): void {
  if (cfg === null || buildModeApi !== null || cfg.buildMode === undefined) return;
  buildModeApi = createBuildModeHud(cfg.buildMode);
}

function mountArmyStack(): void {
  if (cfg === null || armyStackApi !== null || cfg.armyStack === undefined) return;
  armyStackApi = createArmyStackHud(cfg.armyStack);
  if (armyStackSuppressed) armyStackApi.el.style.display = 'none';
}

function refreshD1BModules(): void {
  bottomBarApi?.update();
  mapToolbarApi?.update();
  buildModeApi?.update();
  armyStackApi?.update();
  refreshCityListHudIfOpen();
  refreshArmyListHudIfOpen();
  refreshDiploListHudIfOpen();
  refreshScienceHubIfOpen();
}

function mountLeaderBanners(): void {
  /* D16=A (Maciej 2026-07-03): banery liderów ukryte do v1.0 — wrócą z rankingiem CYWILIZACJE. */
}

function mountContextPanel(): void {
  /* Karta heksu w sidePanelHud (strefa H) — osobny pływający panel wyłączony od 2026-07-03. */
}

function refreshContextPanel(): void {
  refreshSidePanel();
}

function destroyExtraHudModules(): void {
  if (leaderBannersApi !== null) { leaderBannersApi.destroy(); leaderBannersApi = null; }
  if (contextPanelApi !== null) { contextPanelApi.destroy(); contextPanelApi = null; }
}

function destroyD1BModules(): void {
  destroyExtraHudModules();
  if (bottomBarApi !== null) { bottomBarApi.destroy(); bottomBarApi = null; }
  if (mapToolbarApi !== null) { mapToolbarApi.destroy(); mapToolbarApi = null; }
  if (buildModeApi !== null) { buildModeApi.destroy(); buildModeApi = null; }
  if (armyStackApi !== null) { armyStackApi.destroy(); armyStackApi = null; }
}

function applyMapChromeVisibility(): void {
  const showMapChrome = hudSessionActive && !mapChromeSuppressed;
  if (barEl !== null) {
    barEl.style.display = hudSessionActive ? 'block' : 'none';
    barEl.style.zIndex = mapChromeSuppressed ? '404' : '310';
    barEl.classList.toggle('is-city-view', mapChromeSuppressed);
  }
  if (minimapApi !== null) minimapApi.el.style.display = showMapChrome ? 'flex' : 'none';
  if (sidePanelApi !== null) {
    sidePanelApi.el.style.display = showMapChrome ? 'flex' : 'none';
    sidePanelApi.ctxEl.style.display = showMapChrome ? '' : 'none';
  }
  if (bottomBarApi !== null) bottomBarApi.el.style.display = showMapChrome ? 'flex' : 'none';
  if (mapToolbarApi !== null) mapToolbarApi.el.style.display = showMapChrome ? 'flex' : 'none';
  if (miniEl !== null) {
    miniEl.style.display = showMapChrome && minimapApi === null ? 'block' : 'none';
  }
  refreshContextPanel();
}

/** Ukryj/przywróć elementy HUD mapy (tura, wydarzenia, minimapa…) przy panelu miasta. */
export function setMapHudChromeSuppressed(suppressed: boolean): void {
  if (mapChromeSuppressed === suppressed) return;
  mapChromeSuppressed = suppressed;
  applyMapChromeVisibility();
  renderBar();
}

/**
 * Ukryj/przywroc panel rosteru armii (dolny stos „Armia · (x,y)" z LISTA/ROZDZIEL/POLACZ)
 * — uzywane przez overlay pre-battle (T-BITWA-ROSTER, 2026-07-24), zeby nie zaslaniac
 * dialogu "ROZSTAWIENIE BITWY". Widocznosc po przywroceniu jest odtwarzana z biezacego
 * stanu gry (armyStackApi.update() ponownie odpytuje getStack()), wiec panel wraca do
 * dokladnie takiego stanu w jakim byl przed ukryciem (otwarty/zamkniety) bez osobnej flagi.
 */
export function setArmyStackHudSuppressed(suppressed: boolean): void {
  if (armyStackSuppressed === suppressed) return;
  armyStackSuppressed = suppressed;
  if (armyStackApi === null) return;
  if (suppressed) {
    armyStackApi.el.style.display = 'none';
  } else {
    armyStackApi.el.style.display = '';
    armyStackApi.update();
  }
}

// ---------------------------------------------------------------------------
// API publiczne
// ---------------------------------------------------------------------------

/** Pokaz HUD (gorny pasek + slot minimapy). */
export function showHud(config: HudConfig): void {
  cfg = config;
  miniMounted = false;
  miniCanvas = null;
  if (minimapApi !== null) { minimapApi.destroy(); minimapApi = null; }
  if (sidePanelApi !== null) { sidePanelApi.destroy(); sidePanelApi = null; }
  destroyD1BModules();
  ensureStyles();
  ensureFullscreenListener();
  ensureUiZoomApplied();
  if (barEl === null) {
    barEl = document.createElement('div');
    barEl.className = 'civ-hud';
    document.body.appendChild(barEl);
    ensureBarActionsBound();
  }
  if (miniEl === null) {
    miniEl = document.createElement('div');
    miniEl.className = 'civ-mini';
    document.body.appendChild(miniEl);
  } else {
    miniEl.innerHTML = '';
    miniMounted = false;
    miniCanvas = null;
  }
  renderBar();
  mountMinimap();
  mountSidePanel();
  mountBottomBar();
  mountMapToolbar();
  mountBuildMode();
  mountArmyStack();
  mountLeaderBanners();
  mountContextPanel();
  hudSessionActive = true;
  applyMapChromeVisibility();
}

/** Odswiez wartosci HUD (po turze / zmianie stanu) — odswieza tez minimape B. */
export function updateHud(): void {
  renderBar();
  refreshMinimap();
  refreshSidePanel();
  refreshD1BModules();
  refreshContextPanel();
}

/** Ukryj HUD. */
export function hideHud(): void {
  hudSessionActive = false;
  hidePowerOverlay();
  hideEmpireOverlay();
  if (barEl !== null) barEl.style.display = 'none';
  if (miniEl !== null) miniEl.style.display = 'none';
  if (minimapApi !== null) minimapApi.el.style.display = 'none';
  if (sidePanelApi !== null) {
    sidePanelApi.el.style.display = 'none';
    sidePanelApi.ctxEl.style.display = 'none';
  }
  if (contextPanelApi !== null) contextPanelApi.el.style.display = 'none';
  if (leaderBannersApi !== null) leaderBannersApi.el.style.display = 'none';
  if (bottomBarApi !== null) bottomBarApi.el.style.display = 'none';
  if (mapToolbarApi !== null) mapToolbarApi.el.style.display = 'none';
  buildModeApi?.update();
  armyStackApi?.update();
}

/** Czy HUD widoczny (sesja gry aktywna — niezależnie od panelu miasta). */
export function isHudOpen(): boolean { return hudSessionActive; }

export type { MinimapHexData, MinimapData, MinimapPlaytestFogHooks, MinimapWorkerOverlayHooks } from './minimapHud';
export type { ContextPanelData, SidePanelEvent, SidePanelEventKind } from './sidePanelHud';
export type { UnitPanelState } from './unitPanelHud';
export type { BuildTypeInfo } from './buildModeHud';
