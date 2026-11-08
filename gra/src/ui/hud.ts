/**
 * hud.ts
 * HUD w grze (UI plan pkt 3, D1=C) — gorny pasek zasobow + minimapa + panel boczny.
 * Uklad wg Makieta-HUD-mapa-swiata.html (lewy: Zloto/Praca/Spichlerz/Nauka/Surowce/Handel;
 * prawy: Armia/Miasta/Kultura/Religia; epoka w panelu Moc).
 *
 * DOM-only, DECOUPLED: dane podaje silnik przez getState(); akcje przez callbacki.
 *
 * MINIMAPA (D15=B): minimapHud.ts rysuje siatke z getMinimapData() od MAPY.
 * PANEL BOCZNY (D1=C): sidePanelHud.ts — szkielet wydarzen z tury.
 *
 * LANE: src/ui/*.  Pokazanie + onEndTurn wpina MASTER (main.ts).
 */

import { createStateFrame } from '../game/frame-memo';
import {
  createMinimapHud,
  setMinimapTurnLabel,
  type MinimapData,
  type MinimapHexData,
  type MinimapLayerHooks,
  type MinimapPlaytestFogHooks,
  type MinimapWorkerOverlayHooks,
  type MinimapResourceDepositOverlayHooks,
} from './minimapHud';
import { naukaHudWordHtml } from './naukaLabel';
// Liczby do wyswietlenia bez smieci zmiennoprzecinkowych (Maciej 2026-07-26).
import { signedPl } from './formatPl';
import { exactCompactNote, formatCompactNumber, formatCompactSigned, formatFullNumber } from './formatCompactNumber';
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
import { refreshDiploListHudIfOpen, isDiploListHudOpen } from './diploListHud';
import { isDiplomacyAudienceOpen } from './diplomacyAudience';
import {
  onDiploUiVisibilityChange,
  setDiploOpenChecker,
} from './unitCtxDockDiploGate';
import { refreshScienceHubIfOpen } from './scienceHubHud';
import { type UnitPanelState } from './unitPanelHud';
import { createArmyStackHud, type ArmyStackHudConfig } from './armyStackHud';
import { MINIMAP_H_PX, MINIMAP_W_PX, utilDockBottomCss, utilDockLeftCss } from './minimapLayout';
import {
  cityViewRightClusterRightCss,
  CITY_EDGE_PX,
  HUD_EDGE_PX,
  HUD_GAP_MD_PX,
  HUD_POWER_TOP_PX,
  HUD_RIGHT_RAIL_ROW_GAP_PX,
  HUD_TOP_PX,
  HUD_ZOOM_EDGE_PX,
  TOOLBAR_TOP_PX,
} from './hudLayout';
import { showPowerOverlay, hidePowerOverlay, type PowerOverlayData } from './powerOverlayHud';
import { mocLabel } from './power-labels';
import { recruitHudLabel } from './recruitHudLabel';
import { wikiBookIcon } from './icons/wikiBookIcon';
import { iconHtml, type IconId } from './icons/iconRegistry';
import { brandIconSvg, civIconSvg } from './icons/brandAssets';
import { leaderPortraitUrl } from './leaderPortraits';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import { chip6cHtml, chip6cSep, formatGrossNet } from './hudChip6c';
import { resourceColorClassCss, resourceTextClass } from './resourceColors';
import { installHudTitleTooltips } from './hudTitleTooltip';
import { createLeaderBannersHud, type LeaderBannersHudApi } from './leaderBannersHud';
import { createContextPanelHud, type ContextPanelHudApi } from './contextPanelHud';
import {
  showCultureOverlay, showReligionOverlay, hideEmpireOverlay,
  type CultureOverlayData, type ReligionOverlayData,
} from './empireOverlayHud';
import { empireSectionFromHudAct } from './empireDetailPanel';
import './buildStampToggle';

export type { PowerOverlayData, CultureOverlayData, ReligionOverlayData };

/** Wojna z graczem — badge na ikonie Dyplomacja (lista dyplomacji). */
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
  /** R-WEB-HUD-TOPBAR-GRID-GROSS-NET-Q1: PROGNOZA netto Pracy na następny koniec tury (wpływ + nadwyżka
   *  z ukończonego budynku − utrzymanie ulepszeń), liczona jak tick; `pracaRate` = zrealizowane saldo
   *  OSTATNIEJ tury. Brak → komórka Praca pokazuje `pracaRate`. */
  pracaPrognoza?: number;
  /** ZADANIE 1 (Maciej 2026-07-23): Praca/turę odjęta z puli za utrzymanie ulepszeń
   *  surowcowych (civ-wide) w ostatniej turze — do rozbicia w panelu Bilans/ZASOBY IMPERIUM. */
  pracaUpkeep?: number;
  /** P-PRACA-IMPERIUM-AI-ULEPSZENIA-MIESZANE-Q1 (Maciej 2026-08-29): civ-wide
   *  suma `pick.kosztPraca` ze WSZYSTKICH auto-postawionych ulepszeń gracza w
   *  ostatniej turze — już wliczona (odjęta) w `pracaRate`, do rozbicia osobno
   *  w tooltipie/panelu (nie na głównym żetonie, patrz zgłoszenie właściciela). */
  pracaAutoUlepszeniaKoszt?: number;
  /** R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1 (Maciej 2026-09-07): civ-wide Praca zużyta na
   *  postęp Cudów na mapie (`advanceOwnerWonderMapBuilds`) w ostatniej turze — już
   *  wliczona (odjęta) w `pracaRate`, do rozbicia osobno w tooltipie/panelu, ostatni
   *  (4.) z 4 znanych drenaży brutto→netto Pracy, analogicznie do
   *  `pracaAutoUlepszeniaKoszt`/`pracaUpkeep`. */
  pracaCudaKoszt?: number;
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
  /** P-SPICHLERZ-ZERO-MYLACE (ECHO C Maciej 2026-08-10): liczba miast gracza niedokarmionych
   *  w ostatnim ticku (perCityRows[].nakarmione===false) — tooltip chipu „Spichlerz" scala
   *  tę informację z samą liczbą magazynu, zamiast pokazywać gołe „0" bez kontekstu deficytu.
   *  / EN: number of player cities left unfed in the last tick — the "Spichlerz" chip tooltip
   *  merges this into the stock number itself, instead of showing a bare "0" with no deficit
   *  context. */
  zywnoscMiastNiedokarmionych?: number;
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
  /** Utrzymanie surowców budynków/turę (magazyn państwa) — 1 na typ z koszt_surowce. */
  bogactwoUtrzymanieSurowcowBudynkow?: Record<string, number>;
  /** Utrzymanie jednostek/turę (Pieniadz) — odjete od wplywow brutto przy koncu tury. */
  bogactwoUtrzymanieJednostek?: number;
  /** P-BRAK-LACZNEJ-LICZBY-OBYWATELI-W-HUD (Maciej 2026-08-12): suma `population` wszystkich
   *  miast gracza (cities.filter(ownerId===0).reduce(+population)) — teraz wyświetlana wprost
   *  w górnym pasku HUD (chip „Obywatele"), nie tylko w panelu Moc/MIASTA.
   *  / EN: sum of `population` across all player cities — now shown directly in the top HUD
   *  bar (the "Obywatele"/Citizens chip), not only buried in the Power/CITIES detail panel. */
  ludnosc: number;
  ludnoscRate?: number;
  /** A1-Q15 / P-C3 — Moc (absolutna, P-A). Kod: objectivePower. */
  power: number;
  /** Suma rekrutów (Manpower) imperium — pod Mocą na mapie. */
  rekruci?: number;
  rekruciLabel?: string;
  /** P-ARMIA-CHIP-PELNE-JEDNOSTKI (Maciej 2026-08-12): ile PEŁNYCH jednostek da się
   *  zwerbować z całej puli rekrutów imperium — Math.floor(rekruci / kosztJednostki),
   *  liczone jedynym źródłem `unitManpowerCost`/`rekrutUnitEquivalents`
   *  (gra/src/game/manpower.ts), tym samym co panel "Rekruci (pula werbu)"
   *  (empireDetailPanel.ts: p.rekrutEkw). Zastępuje na chipie "Armia" surową liczbę
   *  rekrutów, która nie mówi ile wojska da się realnie wystawić.
   *  / EN: how many FULL units can be recruited from the empire's entire recruit pool —
   *  Math.floor(rekruci / kosztJednostki), computed from the single source
   *  `unitManpowerCost`/`rekrutUnitEquivalents` (gra/src/game/manpower.ts), the same one
   *  the "Rekruci (pula werbu)" panel uses (empireDetailPanel.ts: p.rekrutEkw). Replaces
   *  the raw recruit count on the "Armia" chip, which didn't say how many units that
   *  pool can actually field. */
  rekrutEkw?: number;
  /** Koszt Manpower jednej jednostki w bieżącej epoce (gra/src/game/manpower.ts:
   *  unitManpowerCost) — do tooltipu chipu "Armia", to samo źródło co rekrutEkw wyżej. */
  kosztJednostki?: number;
  ludnoscAbsLabel?: string;
  osiedla: number;
  osiedlaMax: number;
  tura: number;
  epoka: string;
  epokaPostep?: number;
  /** R-EPOKA-CUD-ZAKRES-Q1=B: tooltip „co brakuje do awansu" na `.p-epoch` (panel Moc) —
   *  `undefined`/brak gdy nic nie blokuje (silnik: era-gate-ui.ts, formatEraGateSummary).
   *  / EN: ".p-epoch" tooltip explaining what's blocking era advance; unset when nothing is. */
  eraGateSummary?: string;
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
  /** R-WEB-HUD-RESOURCE-DEFICIT-RED-Q1: etykiety surowców magazynowanych w niedoborze
   *  (ratePerTurn<0 — ta sama definicja „niedoboru" co alert chipu „Surowce" w main.ts). */
  surowceNiedoborLabels?: string[];
  /** R-WEB-HUD-TOPBAR-GRID-GROSS-NET-Q1: suma BRUTTO produkcji (+ przychód z umów) wszystkich
   *  magazynowanych surowców/turę (buildEmpireResourceRows.rateProductionPerTurn + diploIn). */
  surowceBrutto?: number;
  /** Suma NETTO surowców/turę = ratePerTurn − zapotrzebowanie (obywatele+budynki+wojsko,
   *  `usage` z resource-usage-breakdown). Te same rekordy co panel Surowców — bez 2. kalkulacji. */
  surowceNetto?: number;
  /** Rozbicie per surowiec (tylko magazynowane) do tooltipu i „najgorszego deficytu". */
  surowceBilans?: Array<{ label: string; brutto: number; netto: number }>;
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
  /** Civpedia — poradnik + encyklopedia (toolbar + przycisk przy minimapie). */
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

  /** Toggle ikon złóż / surowców na mapie 3D (⛏). */
  minimapResourceDepositOverlay?: MinimapResourceDepositOverlayHooks;

  /** D17=A: treść panelu kontekstowego (null = ukryty). @deprecated użyj getContextPanel */
  getContextPanelMessage?: () => string | null;

  /** D17=A + redesign 2026-07-28: karta heks/jednostka w panelu bocznym. */
  getContextPanel?: () => ContextPanelData | null;
  onContextExpand?: () => void;
  isContextExpanded?: () => boolean;
  onContextAction?: (actionId: string) => void;
  onContextSelectUnit?: (unitId: string) => void;
  /** R-KARTA-JEDNOSTKI-STRZALKI-CYKL: strzałki ◀▶ karty własnej jednostki w panelu bocznym. */
  onContextCycleUnit?: (delta: -1 | 1) => void;
  canContextCycleUnit?: () => boolean;

  /** Panel boczny (D1=C): wydarzenia z tury od silnika. */
  getEvents?: () => SidePanelEvent[];
  onEventClick?: (id: string) => void;
  /** P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1: przelot do panelu bocznego — skrót karty
   * NIE-blokującej do istniejącego miejsca w grze (patrz `getEventLink` w sidePanelHud.ts). */
  getEventLink?: (ev: SidePanelEvent) => { label: string } | null;
  onEventDismiss?: (id: string) => void;
  /** R-WYDARZENIA-FILTR-KATEGORII: przycisk „Usuń wszystkie" w toolbarze panelu WYDARZENIA. */
  onDismissAll?: () => void;

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
  /** R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1: przycisk „Rekrutacja” w górnym pasku — panel zamówień dla całej cywilizacji. */
  onOpenEmpireRecruit?: () => void;
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
let utilDockEl: HTMLDivElement | null = null;

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

const MINI_W = MINIMAP_W_PX;
const MINI_H = MINIMAP_H_PX;

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-hud-css-w2ring7-util-z';
// R-WEB-HUD-NUMBER-ABBREV-Q1: `export` WYŁĄCZNIE dla bramki tools/hud-number-abbrev-test.cjs
// (pomiar układu w Chromium z prawdziwym CSS); zero zmiany zachowania.
export function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-hud-css')?.remove();
  document.getElementById('civ-hud-css-w2')?.remove();
  document.getElementById('civ-hud-css-w2b')?.remove();
  document.getElementById('civ-hud-css-w2full')?.remove();
  document.getElementById('civ-hud-css-w2ring2')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
html.civ-ui-zoom-active{overflow:hidden;width:100%;height:100%;}
html.civ-ui-zoom-active .civ-hud .civ-hud-banner-left{left:${HUD_ZOOM_EDGE_PX}px;max-width:min(calc(100vw - 240px),820px);}
html.civ-ui-zoom-active .civ-hud .hud-right-cluster{right:${HUD_ZOOM_EDGE_PX}px;max-width:min(calc(100vw - 120px),960px);}
html.civ-ui-zoom-active .civ-hud .civ-hud-banner-shell{padding:7px 10px;}
html.civ-ui-zoom-active .civ-hud .civ-hud-banner-right .hud-chip-row{flex-wrap:nowrap;max-width:100%;}
html.civ-ui-zoom-active .civ-hud .civ-hud-banner-left .hud-chip-row{flex-wrap:wrap;max-width:100%;row-gap:2px;}
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
  flex-shrink:0;width:max-content;max-width:100%;box-sizing:border-box;}
.civ-hud .civ-hud-banner-left{pointer-events:none;position:fixed;top:${HUD_TOP_PX}px;left:${HUD_EDGE_PX}px;z-index:3;
  max-width:min(calc(100vw - 260px),860px);}
.civ-hud .civ-hud-banner-left>.civ-hud-banner-shell{pointer-events:auto;}
.civ-hud .civ-hud-banner-left .hud-chip-row{flex-wrap:wrap;row-gap:2px;max-width:100%;}
.civ-hud .hud-chip-tail-group{display:inline-flex;align-items:center;flex-wrap:nowrap;flex-shrink:0;}
.civ-hud .civ-hud-banner-right{flex-shrink:0;max-width:min(calc(50vw - 340px),780px);}
/* Prawy klaster: jeden wiersz — chipy Armia…Religia, odstęp, Civpedia + Menu (prawy róg). */
.civ-hud .hud-right-cluster{pointer-events:auto;position:fixed;top:${HUD_TOP_PX}px;right:${HUD_EDGE_PX}px;z-index:320;
  display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:${HUD_RIGHT_RAIL_ROW_GAP_PX}px;
  max-width:min(calc(100vw - 200px),960px);}
.civ-hud .hud-right-cluster .hud-right{width:auto;max-width:none;justify-content:flex-end;flex-shrink:0;}
.civ-hud .hud-chip-row{display:flex;align-items:center;gap:0;flex-wrap:nowrap;flex-shrink:0;}
.civ-hud .civ-hud-chip{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;}
.civ-hud .civ-hud-chip-click{cursor:pointer;border-radius:8px;padding:2px 4px;margin:-2px -4px;}
.civ-hud .civ-hud-chip-click:hover{background:rgba(232,216,138,.06);}
/* GOAL 2: podświetlenie chipa Kultura/Religia gdy zasięg jest aktywny na mapie 3D —
   analogon dawnego stanu .on na usuniętych ikonach mapBtn/searchBtn przy minimapie. */
.civ-hud .civ-hud-chip-range-on{background:rgba(232,216,138,.12);border-radius:8px;
  box-shadow:inset 0 0 0 1px var(--tg-gold-primary,#e8d88a);}
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
/* P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1: kolor tozsamosci szesciu surowcow pochodzi
   WYLACZNIE z palety resourceColors.ts — z tego samego modulu czyta panel miasta.
   Wczesniej Nauka miala tu wlasny literal #7cb4e4, nieobecny w kanonie tokenow.
   Reguly palety sa DOKLEJANE PO tym literale szablonowym (patrz koniec ensureStyles),
   a nie wstawiane wstawka szablonowa: build-panel-ulepszenia-scroll-real-render-test.cjs
   replikuje ten literal i czerwienieje na kazdej wstawce spoza swojej mapy. Doklejenie
   na koncu zachowuje tez kolejnosc kaskady wobec .civ-hud .civ-hud-chip-val. */
.civ-hud .civ-hud-chip-rate{font-size:10px;color:var(--tg-green);}
.civ-hud .civ-hud-chip-rate.warn{color:var(--tg-orange);}
/* R-WEB-HUD-TOPBAR-LAYOUT-A-Q1 (decyzja wlasciciela 2026-11-07: uklad A + prawy baner w jednej linii).
   LEWY BANER = 6 zetonow (Skarbiec·Praca·Spichlerz·Handel·Nauka·Surowce). Zeton ma dwa pietra:
   ikona po lewej na cala wysokosc; po prawej mala etykieta / DUZA liczba sumaryczna (--hud-cell-val) /
   „+brutto / +netto" = 70% liczby sumarycznej (--hud-cell-sm). Tryb wybiera fitHudTopbar() (JS, po renderze):
   wszystkie 6 w JEDNEJ linii (6 rownych kolumn => pozycje zetonow STALE przy zmianie liczb), a gdy
   najszerszy zeton sie nie miesci — klasa .hud-left-fallback = 2 rzedy po 3 (ten sam zeton, bez uciec).
   Baner zajmuje cala szerokosc od lewego marginesu do medalionu Mocy (50vw − 150 px). */
.civ-hud{--hud-cell-med:30px;--hud-cell-lbl:10px;--hud-cell-val:22px;}
.civ-hud .civ-hud-banner-left{--hud-k:1;}
.civ-hud .hud-left-compact{--hud-k:.82;}
.civ-hud .hud-left-compact.hud-left-tiny{--hud-k:.66;}
.civ-hud .civ-hud-banner-left{width:calc(50vw - 150px);max-width:calc(50vw - 150px);}
.civ-hud .civ-hud-banner-left>.civ-hud-banner-shell{width:100%;max-width:100%;box-sizing:border-box;}
.civ-hud .civ-hud-banner-left .civ-hud-banner-shell{padding:5px 8px;}
.civ-hud .hud-chip-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));width:100%;
  column-gap:6px;row-gap:4px;align-items:center;}
.civ-hud .hud-left-fallback .hud-chip-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
.civ-hud .civ-hud-chip-line{display:flex;flex-direction:column;align-items:flex-start;gap:1px;min-width:0;min-height:0;height:auto;}
.civ-hud .civ-hud-chip-figs{display:inline-flex;flex-direction:row;align-items:baseline;gap:3px;flex-shrink:0;
  margin-left:0;height:auto;line-height:1.1;font-size:calc(var(--hud-cell-val) * .7 * var(--hud-k,1));}
.civ-hud .civ-hud-chip-fsep{color:#968c7c;font-size:calc(var(--hud-cell-val) * .7 * var(--hud-k,1));}
.civ-hud .civ-hud-chip-figs .civ-hud-chip-rate.neg{color:var(--civ-hud-shortage,#ee6c6c);}
.civ-hud .civ-hud-chip-figs .civ-hud-chip-rate.zero{color:#968c7c;}
.civ-hud .civ-hud-chip-figs .civ-hud-chip-net.neg{color:var(--civ-hud-shortage,#ee6c6c);}
.civ-hud .civ-hud-chip-cell{display:grid;grid-template-columns:calc(var(--hud-cell-med) * var(--hud-k,1)) max-content;justify-content:center;
  column-gap:6px;align-items:center;width:100%;min-width:0;overflow:hidden;white-space:nowrap;}
.civ-hud .civ-hud-chip-cell.civ-hud-chip-click{padding:1px 3px;margin:0;width:100%;}
.civ-hud .civ-hud-chip-cell .civ-hud-chip-med{width:calc(var(--hud-cell-med) * var(--hud-k,1));height:calc(var(--hud-cell-med) * var(--hud-k,1));}
.civ-hud .civ-hud-chip-cell .civ-hud-chip-med svg:not(.civ-science-prog-ring){width:calc(calc(var(--hud-cell-med) * var(--hud-k,1)) * .57);height:calc(calc(var(--hud-cell-med) * var(--hud-k,1)) * .57);}
.civ-hud .civ-hud-chip-body{display:flex;flex-direction:column;gap:0;min-width:0;line-height:1.05;}
.civ-hud .civ-hud-chip-top{display:flex;align-items:baseline;gap:4px;min-width:0;min-height:0;line-height:1.05;}
.civ-hud .civ-hud-chip-cell .civ-hud-chip-lbl{font-size:calc(var(--hud-cell-lbl) * var(--hud-k,1));flex-shrink:1;min-width:0;}
.civ-hud .civ-hud-chip-cell .civ-hud-chip-val{font-size:calc(var(--hud-cell-val) * var(--hud-k,1));min-width:0;line-height:1.05;height:auto;}
.civ-hud .civ-hud-chip-cell .civ-hud-chip-val:empty{display:block;min-height:calc(calc(var(--hud-cell-val) * var(--hud-k,1)) * 1.05);}
.civ-hud .civ-hud-chip-cell .civ-hud-chip-lbl,.civ-hud .civ-hud-chip-k{color:#968c7c;}
.civ-hud .civ-hud-chip-k{font-size:calc(var(--hud-cell-val) * .7 * var(--hud-k,1));flex-shrink:0;}
.civ-hud .civ-hud-chip-cell .civ-hud-chip-rate{font-size:calc(var(--hud-cell-val) * .7 * var(--hud-k,1));font-weight:600;}
.civ-hud .civ-hud-chip-net{font-size:calc(var(--hud-cell-val) * .7 * var(--hud-k,1));font-weight:700;}
.civ-hud .civ-hud-chip-net.pos{color:var(--tg-green);}
.civ-hud .civ-hud-chip-net.zero{color:#968c7c;}
.civ-hud .civ-hud-chip-net.neg{color:var(--civ-hud-shortage,#ee6c6c);}
/* Rozmiary schodza z oknem (liczba, etykieta, ikona); plusy zawsze = 70% liczby (--hud-cell-sm). */
@media (max-width:1200px){.civ-hud{--hud-cell-med:24px;--hud-cell-lbl:9px;--hud-cell-val:17px;}
  .civ-hud .hud-chip-grid{column-gap:4px;}
  .civ-hud .civ-hud-chip-cell{column-gap:4px;}
  .civ-hud .civ-hud-banner-left .civ-hud-banner-shell{padding:4px 8px;}}
@media (max-width:1100px){.civ-hud{--hud-cell-med:20px;--hud-cell-lbl:9px;--hud-cell-val:15px;}}
@media (max-width:900px){.civ-hud{--hud-cell-med:18px;--hud-cell-lbl:8px;--hud-cell-val:14px;}
  .civ-hud .civ-hud-banner-left .civ-hud-banner-shell{padding:4px 5px;}
  .civ-hud .hud-chip-grid{column-gap:2px;}
  .civ-hud .civ-hud-chip-cell{column-gap:3px;}
  .civ-hud .civ-hud-chip-cell.civ-hud-chip-click{padding:1px 0;}
  .civ-hud .civ-hud-chip-top{gap:3px;}
  .civ-hud .civ-hud-chip-fsep{display:none;}
  .civ-hud .civ-hud-chip-figs{flex-direction:column;align-items:flex-start;gap:0;}}
@media (max-width:700px){.civ-hud{--hud-cell-med:14px;--hud-cell-lbl:7px;--hud-cell-val:12px;}
  .civ-hud .civ-hud-banner-left .civ-hud-banner-shell{padding:3px 3px;}
  .civ-hud .civ-hud-chip-cell{column-gap:2px;}
  .civ-hud .civ-hud-chip-figs{gap:0;}
  .civ-hud .civ-hud-chip-fsep{display:none;}
  .civ-hud .civ-hud-chip-figs{flex-direction:column;align-items:flex-start;gap:0;height:auto;}}
/* Wysoki lewy baner (fallback 2x3 ma ~95–140 px) nie moze wchodzic na pasek narzedzi mapy: fitHudTopbar()
   ustawia --civ-hud-toolbar-top = dol banera + 8 px, gdy baner siega glebiej niz domyslne TOOLBAR_TOP_PX. */
html .civ-map-toolbar{top:var(--civ-hud-toolbar-top,${TOOLBAR_TOP_PX}px);}
/* PRAWY BANER (Armia·Miasta·Obywatele·Kultura·Religia): WSZYSTKIE chipy w JEDNEJ linii (nowrap, bez zawijania
   ikony do 2. wiersza). Klaster prawy (przyciski Rekrutacja/Civpedia/Menu) jest kolumna: przyciski u gory,
   baner POD nimi, wyrownany do prawej — baner nie wchodzi na medalion Mocy (max-width = 50vw − 148 px) ani na
   lewy baner. Rzad obok przyciskow tylko na bardzo szerokich oknach (>2600 px). Gdy chipy nie mieszcza sie
   w banerze, fitHudTopbar() zaweza je stopniami: .hud-r-tight (mniejsze czcionki/ikony) → .hud-r-stack
   (liczba nad przyrostem) → .hud-r-min (bez przyrostu; pelny opis w tooltipie). Etykiety schodza <= 1500 px. */
.civ-hud .civ-hud-banner-right{max-width:max(150px,min(calc(50vw - 148px),900px));}
.civ-hud .civ-hud-banner-right .hud-chip-row{flex-wrap:nowrap;row-gap:0;max-width:100%;min-width:0;}
.civ-hud .hud-right-cluster{flex-direction:column-reverse;align-items:flex-end;gap:6px;}
.civ-hud .civ-hud-banner-right.civ-hud-banner-shell{padding:4px 8px;}
.civ-hud .civ-hud-banner-right .civ-hud-chip-med{width:24px;height:24px;}
.civ-hud .civ-hud-banner-right .civ-hud-chip-med svg:not(.civ-science-prog-ring){width:14px;height:14px;}
.civ-hud .civ-hud-banner-right .civ-hud-chip-sep{height:20px;margin:0 6px;}
@media (min-width:2601px){
  .civ-hud .hud-right-cluster{flex-direction:row;align-items:center;}
  .civ-hud .civ-hud-banner-right{max-width:max(150px,min(calc(50vw - 521px),780px));}
  .civ-hud .civ-hud-banner-right .civ-hud-chip-med{width:30px;height:30px;}
  .civ-hud .civ-hud-banner-right .civ-hud-chip-med svg:not(.civ-science-prog-ring){width:17px;height:17px;}}
@media (max-width:1500px){
  .civ-hud .civ-hud-banner-right .civ-hud-chip-lbl{display:none;}
  .civ-hud .civ-hud-banner-right .civ-hud-chip-sep{margin:0 4px;}}
@media (max-width:1100px){
  .civ-hud .civ-hud-banner-right .civ-hud-chip-sep{display:none;}
  .civ-hud .civ-hud-banner-right .hud-chip-row{gap:8px;}}
@media (max-width:700px){
  .civ-hud .civ-hud-banner-right{max-width:max(150px,calc(50vw - 105px));}}
.civ-hud .civ-hud-banner-right.civ-hud-banner-shell.hud-r-tight{padding:3px 6px;}
.civ-hud .hud-r-tight .civ-hud-chip{gap:3px;}
.civ-hud .hud-r-tight .civ-hud-chip-med{width:20px;height:20px;}
.civ-hud .hud-r-tight .civ-hud-chip-med svg:not(.civ-science-prog-ring){width:12px;height:12px;}
.civ-hud .hud-r-tight .civ-hud-chip-val{font-size:13px;}
.civ-hud .hud-r-tight .civ-hud-chip-rate{font-size:9px;}
.civ-hud .hud-r-tight .civ-hud-chip-sep{display:none;}
.civ-hud .hud-r-tight .hud-chip-row{gap:6px;}
.civ-hud .hud-r-stack .civ-hud-chip{display:inline-grid;grid-template-columns:auto auto;grid-template-rows:auto auto;column-gap:3px;row-gap:0;align-items:center;}
.civ-hud .hud-r-stack .civ-hud-chip-med{grid-row:1 / span 2;grid-column:1;}
.civ-hud .hud-r-stack .civ-hud-chip-val{grid-column:2;grid-row:1;line-height:1.05;font-size:12px;}
.civ-hud .hud-r-stack .civ-hud-chip-rate{grid-column:2;grid-row:2;line-height:1.05;font-size:9px;}
.civ-hud .hud-r-stack .hud-chip-row{gap:5px;}
.civ-hud .hud-r-min .civ-hud-chip-rate{display:none;}
.civ-hud .hud-r-min .civ-hud-chip{display:inline-flex;}
.civ-hud .hud-r-min .civ-hud-chip-med{width:16px;height:16px;}
.civ-hud .hud-r-min .civ-hud-chip-med svg:not(.civ-science-prog-ring){width:10px;height:10px;}
.civ-hud .hud-r-min .civ-hud-chip-val{font-size:11px;}
.civ-hud .hud-r-min .hud-chip-row{gap:4px;}
/* Ostatnia deska ratunku (okno 640 px, najwieksze liczby): przewijanie poziome zamiast zawijania ikony. */
@media (max-width:700px){
  .civ-hud .civ-hud-banner-right .hud-chip-row{overflow-x:auto;scrollbar-width:none;}}
.civ-hud .hud-right{display:flex;align-items:center;gap:${HUD_GAP_MD_PX}px;flex-shrink:0;}
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
/* Zoom + pełny ekran — nad minimapą i kartą jednostki (root body, z-index 318). */
.civ-hud-util-dock{pointer-events:auto;position:fixed;z-index:318;
  display:flex;align-items:center;gap:8px;
  left:${utilDockLeftCss(MINI_W)};bottom:${utilDockBottomCss()};
  ${CIV_BRAND_SCOPE_VARS}
  font-family:var(--civ-font-ui);}
.civ-hud-util-dock button{font-family:var(--civ-font-ui);cursor:pointer;}
.civ-hud-util-dock .civ-hud-zoom{display:inline-flex;align-items:stretch;flex-shrink:0;
  border-radius:9px;border:1px solid rgba(232,216,138,.35);
  background:linear-gradient(180deg,#161c28,#0a0d14);overflow:hidden;}
.civ-hud-util-dock .b-zoom{display:inline-flex;align-items:center;justify-content:center;width:34px;height:42px;
  border:none;background:transparent;color:var(--civ-gold-primary);
  font-size:18px;font-weight:700;line-height:1;cursor:pointer;font-family:var(--civ-font-ui);}
.civ-hud-util-dock .b-zoom:hover:not(:disabled){background:rgba(232,216,138,.1);}
.civ-hud-util-dock .b-zoom:disabled{opacity:.35;cursor:default;}
.civ-hud-util-dock .civ-hud-zoom-pct{min-width:40px;display:inline-flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--civ-text-muted);letter-spacing:.02em;padding:0 2px;border-left:1px solid rgba(232,216,138,.2);
  border-right:1px solid rgba(232,216,138,.2);}
.civ-hud-util-dock .b-menu{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 16px;
  border-radius:9px;border:1px solid rgba(232,216,138,.35);
  background:linear-gradient(180deg,#161c28,#0a0d14);color:var(--civ-gold-primary);
  font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;cursor:pointer;font-family:var(--civ-font-ui);}
.civ-hud-util-dock .b-menu:hover{filter:brightness(1.06);border-color:rgba(232,216,138,.55);}
.civ-hud-util-dock .b-util-toggle{display:inline-flex;align-items:center;justify-content:center;
  width:42px;height:42px;border-radius:9px;padding:0;font-size:18px;line-height:1;
  border:1px solid rgba(232,216,138,.3);background:linear-gradient(180deg,#161c28,#0a0d14);
  color:#e8d88a;}
.civ-hud-util-dock .b-util-toggle:hover{border-color:rgba(232,216,138,.55);}
.civ-hud-util-dock .b-util-toggle.on{background:rgba(232,216,138,.12);border-color:var(--tg-gold-primary,#e8d88a);}
.civ-hud-util-dock.is-city-view{display:none!important;}
html.civ-ui-zoom-active .civ-hud-util-dock{
  left:${utilDockLeftCss(MINI_W, true)};bottom:${utilDockBottomCss(true)};}
.civ-hud .b-wiki{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 16px;
  border-radius:9px;border:1px solid rgba(168,200,120,.38);cursor:pointer;font-family:var(--civ-font-ui);
  background:linear-gradient(180deg,#161c28,#0a0d14);color:var(--civ-wiki-accent,#a8c878);
  font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;}
.civ-hud .b-wiki:hover{filter:brightness(1.06);border-color:rgba(168,200,120,.55);}
.civ-hud .b-wiki.on{border-color:rgba(168,200,120,.72);background:linear-gradient(180deg,#1a2218,#0c100c);
  box-shadow:inset 0 0 0 1px rgba(168,200,120,.15),0 0 12px rgba(168,200,120,.12);}
.civ-hud .b-wiki .civ-wiki-ic{width:16px;height:16px;flex-shrink:0;}
.civ-hud .power-center{pointer-events:auto;position:fixed;left:50%;top:${HUD_POWER_TOP_PX}px;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:stretch;gap:0;padding:12px 24px 10px;cursor:pointer;min-width:240px;z-index:4;
  background:linear-gradient(180deg,rgba(30,24,12,.96),rgba(14,10,6,.96));
  border:1px solid #a08030;border-top:none;border-radius:0 0 18px 18px;
  box-shadow:0 6px 22px rgba(0,0,0,.6),0 0 30px rgba(232,216,138,.18);}
.civ-hud .power-center:hover{filter:brightness(1.06);}
.civ-hud .power-center .p-epoch{text-align:center;font-family:var(--civ-font-title);font-size:13px;
  color:var(--civ-gold-primary);letter-spacing:.08em;line-height:1.2;margin:0 0 8px;white-space:nowrap;}
.civ-hud .power-center .p-epoch-gated{border-bottom:1px dotted rgba(224,122,95,.75);
  padding-bottom:1px;cursor:help;}
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
/* R-WEB-HUD-GROSS-NET-REST-Q1: zwarty medalion Mocy ≤700 px (po regułach bazowych — kolejność kaskady). */
@media (max-width:700px){
  .civ-hud .power-center{min-width:150px;padding:8px 8px 6px;}
  .civ-hud .power-center .p-epoch{font-size:10px;margin-bottom:4px;}
  .civ-hud .power-center .p-row{gap:5px;}
  .civ-hud .power-center .p-ic{width:30px;height:30px;}
  .civ-hud .power-center .p-ic svg{width:20px;height:20px;}
  .civ-hud .power-center .p-ic.p-ic-civ svg{width:20px;height:20px;}
  .civ-hud .power-center .p-ic.p-ic-leader .p-ic-portrait{width:30px;height:30px;}
  .civ-hud .power-center .p-val-num{font-size:16px;}}
.civ-hud.is-city-view .civ-hud-banner-left,
.civ-hud.is-city-view .civ-hud-banner-right,
.civ-hud.is-city-view .power-center{display:none!important;}
.civ-hud.is-city-view .hud-meta{display:none!important;}
.civ-hud.is-city-view .hud-right-cluster{top:8px;
  right:${cityViewRightClusterRightCss()};
  z-index:407;flex-direction:column;align-items:stretch;gap:5px;max-width:min(148px,calc(100vw - ${CITY_EDGE_PX}px));}
.civ-hud.is-city-view .hud-right-cluster .hud-right{flex-direction:column;align-items:stretch;gap:5px;}
.civ-hud.is-city-view .hud-right-cluster .b-menu,
.civ-hud.is-city-view .hud-right-cluster .b-wiki{height:36px;padding:0 10px;font-size:10px;letter-spacing:.12em;justify-content:center;}
.civ-mini{position:fixed;left:${HUD_EDGE_PX}px;bottom:${HUD_EDGE_PX}px;width:${MINI_W}px;height:${MINI_H}px;z-index:309;display:none;}
.civ-mini-placeholder{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#9aa6b6;font:11px monospace;text-align:center;}
.civ-fs-hint{position:fixed;top:${HUD_TOP_PX}px;left:50%;transform:translateX(-50%);z-index:9999;
  display:none;padding:6px 14px;border-radius:8px;pointer-events:none;
  background:rgba(8,12,20,.92);color:var(--civ-text-muted);
  border:1px solid rgba(232,216,138,.3);font:12px var(--civ-font-ui);letter-spacing:.02em;
  opacity:0;transition:opacity .3s ease;box-shadow:0 6px 20px rgba(0,0,0,.45);}
.civ-fs-hint.show{opacity:1;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  // R-WEB-HUD-RESOURCE-DEFICIT-RED-Q1: niedobór = czerwona czcionka (--tg-red, rozjaśniona do AA
  // na ciemnym pasku: #c84040 daje ~3.9:1 < 4.5:1). Reguła PO palecie, swoistość (0,4,0) > (0,2,0).
  const shortCss = '.civ-hud{--civ-hud-shortage:#ee6c6c;}\n'
    + '.civ-hud .civ-hud-chip.civ-hud-chip-short .civ-hud-chip-val,'
    + '.civ-hud .civ-hud-chip.civ-hud-chip-short .civ-hud-chip-lbl,'
    + '.civ-hud .civ-hud-chip.civ-hud-chip-short .civ-hud-chip-rate{color:var(--civ-hud-shortage);}\n';
  s.textContent = css + '\n' + resourceColorClassCss('.civ-hud') + '\n' + shortCss;
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

/** R-WEB-HUD-NUMBER-ABBREV-Q1: value/rate chipu w formie skróconej („20,9k", „+1,3k") + nota „Dokładnie…". */
function cn(value: number | undefined, rate?: number): { value: string; rate?: string; exact: string } {
  return {
    value: formatCompactNumber(value),
    ...(rate !== undefined ? { rate: formatCompactSigned(rate) } : {}),
    exact: exactCompactNote(value, rate),
  };
}

/** R-WEB-HUD-TOPBAR-GRID-GROSS-NET-Q1: ton koloru linii „netto" (ujemne czerwone, dodatnie zielone). */
function netTone(n: number): 'pos' | 'neg' | 'zero' {
  const r = Math.round(n);
  return r < 0 ? 'neg' : r > 0 ? 'pos' : 'zero';
}

/** Najgorszy (najbardziej ujemny) bilans netto spośród surowców; undefined gdy żaden nie jest < 0. */
function surowceNajgorszy(s: HudState): { label: string; netto: number } | undefined {
  let worst: { label: string; netto: number } | undefined;
  for (const r of s.surowceBilans ?? []) {
    if (r.netto < 0 && (!worst || r.netto < worst.netto)) worst = { label: r.label, netto: r.netto };
  }
  return worst;
}

/** Pierścień Nauki: postęp bieżącej tech (nie epoki). buildHudState ustawia researchProgress. */
function resolveResearchProgress(s: HudState): number {
  const p = s.researchProgress ?? s.epokaPostep ?? 0;
  return Math.max(0, Math.min(1, p));
}

/** Spichlerz: `zywnoscLabel` to liczba w stringu (main.ts: String(foodReserve)); nienumeryczna → 0. */
function foodHudValue(s: HudState): number | undefined {
  const n = Number(s.zywnoscLabel);
  return Number.isFinite(n) ? n : undefined;
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
 * P-SPICHLERZ-ZERO-MYLACE: polska odmiana ma TRZY formy, nie dwie — 1 / 2-4
 * (poza 12-14) / 5+ i 12-14. / EN: Polish plural has THREE forms, not two —
 * 1 / 2-4 (except 12-14) / 5+ and 12-14.
 */
function miastoNiedokarmioneWordHud(n: number): string {
  const a = Math.abs(n);
  if (a === 1) return 'miasto niedokarmione';
  const m10 = a % 10;
  const m100 = a % 100;
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'miasta niedokarmione';
  return 'miast niedokarmionych';
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
  const short = hudGoldShortage(s) ? ' · ⚠ Zaczyna brakować pieniędzy (czerwony)' : '';
  return `${base}${short}: BRUTTO (wpływy przed kosztami) ${signed(wplywyBrutto)} → NETTO (po utrzymaniu, zmiana stanu na turę) ${signed(netto)} pkt Pieniądza`
    + ` · Podatek i budynki: ${signed(daninaIBudynki)} pkt Pieniądza`
    + ` · Handel ze szlaków: ${signed(handel)} pkt Pieniądza`
    + ` · Utrzymanie budynków: ${signed(-utrzymanieBudynkow)} pkt Pieniądza`
    + ` · Utrzymanie jednostek: ${signed(-utrzymanieJednostek)} pkt Pieniądza`
    + ` · Razem netto: ${signed(netto)} pkt Pieniądza. Kliknij po szczegóły.`;
}

/**
 * NAPRAWA HUD-PRACA (Maciej 2026-07-26, ten sam wzorzec/zgłoszenie co Skarbiec):
 * tooltip chipu „Praca" rozbija „+N" na wpływ brutto do puli imperium minus
 * utrzymanie ulepszeń surowcowych (civ-wide/turę). pracaRate jest już NETTO
 * (main.ts).
 *
 * P-PRACA-IMPERIUM-AI-ULEPSZENIA-MIESZANE-Q1 (Maciej 2026-08-29): dochodzi
 * TRZECI składnik — koszt auto-postawionych ulepszeń AI gracza w ostatniej
 * turze (`pracaAutoUlepszeniaKoszt`), więc brutto = pracaRate + pracaUpkeep +
 * pracaAutoUlepszeniaKoszt. Zgłoszenie właściciela: ten drenaż wcześniej
 * wchodził WYŁĄCZNIE do salda netto na głównym żetonie, mylnie się z nim
 * łącząc ("Praca 39 -10" zamiast +80 do puli) -- teraz to osobna, podpisana
 * pozycja w rozbiciu tooltipu, tak jak `pracaUpkeep`.
 *
 * R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1 (Maciej 2026-09-07, ECHO właściciela odwraca
 * poprzednią decyzję na to samo pytanie): CZWARTY składnik dołączony do sumy —
 * `pracaCudaKoszt` ("Cuda na mapie"), dotąd brakujący w rekonstrukcji brutto
 * (rozbicie liczyło tylko 3 z 4 znanych drenaży). Właściciel: „nie powinienem
 * widzieć na żetonie +22, tylko łącznie +22 i 76" — więc GŁÓWNA liczba żetonu
 * (`renderBarD1B` niżej) TERAZ pokazuje to samo brutto co w rozpisce tooltipu
 * (`pracaChipTitle` niżej, ten sam wzór policzony inline — CELOWO NIE woła tej
 * funkcji: `tools/praca-auto-ulepszenia-koszt-split-test.cjs` wycina i uruchamia
 * ciało `pracaChipTitle` w izolacji przez brace-matching, więc ta funkcja musi
 * pozostać SAMOWYSTARCZALNA, bez zależności na inne top-level funkcje modułu),
 * redukcja do netto zostaje WYŁĄCZNIE w tej rozpisce.
 */
function pracaWplywBrutto(s: HudState): number {
  const netto = s.pracaRate ?? 0;
  const utrzymanie = s.pracaUpkeep ?? 0;
  const autoUlepszenia = s.pracaAutoUlepszeniaKoszt ?? 0;
  const cudaNaMapie = s.pracaCudaKoszt ?? 0;
  return netto + utrzymanie + autoUlepszenia + cudaNaMapie;
}

function pracaChipTitle(s: HudState): string {
  const base = 'Praca — bilans na turę';
  const netto = s.pracaRate ?? 0;
  const utrzymanie = s.pracaUpkeep ?? 0;
  const autoUlepszenia = s.pracaAutoUlepszeniaKoszt ?? 0;
  const cudaNaMapie = s.pracaCudaKoszt ?? 0;
  const wplywBrutto = netto + utrzymanie + autoUlepszenia + cudaNaMapie;
  const lead = s.pracaPrognoza !== undefined
    ? `BRUTTO ${signed(s.pracaPrognoza + utrzymanie)} → NETTO ${signed(s.pracaPrognoza)} pkt Pracy/turę (PROGNOZA następnej tury: wpływ z miast + nadwyżka z ukończonego budynku − utrzymanie ulepszeń; bez auto-ulepszeń i Cudów na mapie, których koszt wychodzi dopiero w ticku)`
      + ` · Ostatnia tura (zrealizowane): BRUTTO ${signed(wplywBrutto)} → NETTO ${signed(netto)}`
    : `BRUTTO ${signed(wplywBrutto)} → NETTO ${signed(netto)} pkt Pracy/turę`;
  return `${base}: ${lead}`
    + ` · Wpływ do puli imperium: ${signed(wplywBrutto)} pkt Pracy`
    + ` · Utrzymanie ulepszeń surowcowych: ${signed(-utrzymanie)} pkt Pracy`
    + ` · Auto-ulepszenia AI (gracz): ${signed(-autoUlepszenia)} pkt Pracy`
    + ` · Cuda na mapie: ${signed(-cudaNaMapie)} pkt Pracy`
    + ` · Razem netto: ${signed(netto)} pkt Pracy. Kliknij po szczegóły.`;
}

/**
 * R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1 (Maciej 2026-09-07): Nauka nie ma dziś ŻADNEGO
 * drenażu civ-wide analogicznego do Pracy/Skarbca (żadne ulepszenie/Cud nie kosztuje
 * Nauki z puli — sprawdzone w main.ts, `naukaRate`/`_lastNaukaRate` jest przypisywany
 * WPROST z `playerEcon.nauka`, bez żadnego następnego odjęcia) — więc brutto i netto
 * są tu DZIŚ tą samą liczbą; główny żeton pokazuje więc już brutto bez żadnej zmiany
 * wartości, tylko wcześniejszy opis w tooltipie mylnie sugerował istnienie redukcji.
 */
function naukaChipTitle(s: HudState): string {
  const stock = Math.floor(s.nauka);
  const rate = s.naukaRate ?? 0;
  return `Nauka — badania technologiczne`
    + ` · Duża liczba: ${stock} pkt Nauki (skumulowane do bieżącej technologii)`
    + ` · BRUTTO ${signed(rate)} → NETTO ${signed(rate)} pkt Nauki/turę (brak dziś drenaży Nauki)`
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
    + ` · BRUTTO (nadwyżka miast → centrala): ${signed(wplyw)} 🍞/turę → NETTO (po deficytach miast i armii, zmiana magazynu): ${signed(netto)} 🍞/turę`
    + ` · Deficyty miast pokryte z magazynu: ${signed(-Math.max(0, wplyw - koszt - netto))} 🍞/turę`
    + ` · Nadwyżka miast → centrala: ${signed(wplyw)} 🍞/turę`
    + ` · Koszt armii: ${signed(-koszt)} 🍞/turę`;
  // P-SPICHLERZ-ZERO-MYLACE: liczba magazynu sama w sobie nie mówi, czy zero jest zdrowe
  // czy oznacza realny niepokryty deficyt miast — dopisujemy TU, przy tej samej liczbie.
  // / EN: the stock number alone doesn't say whether zero is healthy or a real uncovered
  // city deficit — appended HERE, next to that same number.
  if ((s.zywnoscMiastNiedokarmionych ?? 0) > 0) {
    const n = s.zywnoscMiastNiedokarmionych!;
    title += ` · ⚠ Realny niepokryty deficyt: ${n} ${miastoNiedokarmioneWordHud(n)}`;
  }
  if (hudFoodShortage(s)) title += ` · ⚠ Zaczyna brakować żywności (czerwony)`;
  if (s.glodWojska) title += ` · Głód wojska: atrycja HP trwa!`;
  else if (s.zywnoscKarencjaZaTur != null && s.zywnoscKarencjaZaTur > 0) {
    title += ` · Głód wojska za ${s.zywnoscKarencjaZaTur} ${slowoTuraHud(s.zywnoscKarencjaZaTur)} — magazyn ujemny!`;
  }
  if (s.uchwalaSolAktywna) {
    const n = s.uchwalaSolSpichlerzIICount ?? 1;
    title += ` · Uchwała „Solanka zapasowa" (Spichlerz Królewski · Sól): armia poza terytorium 2→1 🍞/turę`
      + (n > 1 ? ` · ${n}× Spichlerz Królewski` : '');
  }
  return `${title} · Kliknij po szczegóły.`;
}

/** Tooltip chipu „Armia" — wojsko na mapie i pula rekrutów. */
function armiaChipTitle(s: HudState): string {
  const units = s.armyUnitsOnMap ?? 0;
  const rekrutEkw = s.rekrutEkw ?? 0;
  const regen = s.rekruciRegenPerTurn ?? 0;
  const koszt = s.zywnoscKosztWojska ?? 0;
  const maxPart = s.zywnoscMax != null && s.zywnoscMax > 0 ? ` / ${s.zywnoscMax}` : '';
  // P-ARMIA-CHIP-PELNE-JEDNOSTKI: „+” na chipie pokazuje teraz rekrutEkw (pełne jednostki
  // z całej puli), nie surową pulę — tooltip nazywa to wprost i osobno podaje koszt/jedn.
  // oraz odnowę puli/turę (ta druga zostaje w tooltipie, zeszła z samego chipu).
  // / EN: the chip's „+” now shows rekrutEkw (full units from the whole pool), not the raw
  // pool — the tooltip names it explicitly and separately states cost/unit and pool
  // regen/turn (the latter stays in the tooltip, it moved off the chip itself).
  let title = `Armia — wojsko i rekruci`
    + ` · Jednostki na mapie: ${units}`
    + ` · Pula rekrutów: ${typeof s.rekruci === 'number' && Number.isFinite(s.rekruci) ? formatCompactNumber(s.rekruci) : (s.rekruciLabel ?? '—')}`
    + ` · Można zwerbować: ${rekrutEkw} pełnych jednostek z całej puli`
    + (s.kosztJednostki != null ? ` (koszt ${s.kosztJednostki} rekr./szt.)` : '')
    + ` · Odnowa puli: ${signed(regen)} rekr./turę`;
  if (koszt > 0) title += ` · Koszt żywności armii: ${signed(-koszt)} 🍞/turę`;
  title += ` · W magazynie państwa: ${s.zywnoscLabel}${maxPart} 🍞`;
  if (s.glodWojska) title += ` · Głód wojska: atrycja HP trwa!`;
  return `${title} · Kliknij po szczegóły.`;
}

function miastaChipTitle(s: HudState): string {
  const rate = s.ludnoscRate ?? 0;
  return `Miasta — osiedla imperium`
    + ` · Duża liczba: ${s.osiedla} miast`
    + ` · ${formatGrossNet(rate, rate, 'obyw./turę')} (przyrost ludności łącznie)`
    + ` · Kliknij po tabelę per miasto (obywatele, produkcja, skarbiec, żywność).`;
}

/** Tooltip chipu „Obywatele" (P-BRAK-LACZNEJ-LICZBY-OBYWATELI-W-HUD) — łączna liczba
 *  obywateli imperium (suma populacji wszystkich miast gracza), osobno od liczby miast. */
function obywateleChipTitle(s: HudState): string {
  const rate = s.ludnoscRate ?? 0;
  return `Obywatele — łączna populacja imperium`
    + ` · Duża liczba: ${s.ludnosc} obywateli (suma populacji wszystkich miast gracza)`
    + ` · ${formatGrossNet(rate, rate, 'obyw./turę')} (HUD nie rozdziela przyrostu i strat ludności — pokazuje saldo)`
    + ` · Kliknij po tabelę per miasto (obywatele, produkcja, skarbiec, żywność).`;
}

function kulturaChipTitle(s: HudState): string {
  const stock = Math.floor(s.kultura);
  const rate = s.kulturaRate ?? 0;
  return `Kultura — wpływ kulturowy imperium`
    + ` · Duża liczba: ${stock} pkt Kultury (zapas imperium)`
    + ` · ${formatGrossNet(rate, rate, 'pkt Kultury/turę')} (brak dziś drenaży Kultury)`
    + ` · Kliknij po szczegóły.`;
}

function religiaChipTitle(s: HudState): string {
  const stock = Math.round(s.religionStock ?? 0);
  const rate = s.religionRate ?? 0;
  const rel = s.stateReligion ? ` (${s.stateReligion})` : '';
  return `Religia — wierni religii państwa${rel}`
    + ` · Duża liczba: ${stock} wiernych (łącznie w imperium)`
    + ` · ${formatGrossNet(rate, rate, 'wiernych/turę')} (brak dziś drenaży wiernych; szerzenie łącznie)`
    + ` · Kliknij po szczegóły.`;
}

/**
 * R-WEB-HUD-RESOURCE-DEFICIT-RED-Q1 — „zaczyna brakować" (tylko prezentacja, bez zmian logiki gry).
 * Okno zapasu: bilans netto < 0 i zapas starcza na <= tyle tur (lub zapas <= 0). Gra nie ma
 * istniejącego progu „bankructwa" złota; dla żywności reużywamy istniejących ostrzeżeń o głodzie.
 */
export const HUD_SHORTAGE_RUNWAY_TURNS = 5;

function runwayShort(stock: number, rate: number): boolean {
  // Zapas ujemny = zawsze niedobór. Bilans >= 0 (także 0 po floor() z dodatniego ułamka, np. +0,6)
  // NIE jest niedoborem, nawet przy zapasie 0 (start gry). Zapas 0 + bilans < 0 = niedobór.
  if (stock < 0) return true;
  if (rate >= 0) return false;
  return stock <= 0 || stock / -rate <= HUD_SHORTAGE_RUNWAY_TURNS;
}

/** Skarbiec: zapas < 0 albo ujemny bilans netto wyczerpujący zapas w <= N turach. */
export function hudGoldShortage(s: HudState): boolean {
  return runwayShort(s.bogactwo, s.bogactwoRate ?? 0);
}

/** Spichlerz: istniejące ostrzeżenia o głodzie (głód wojska, karencja, niedokarmione miasta) lub okno zapasu. */
export function hudFoodShortage(s: HudState): boolean {
  if (s.glodWojska) return true;
  if ((s.zywnoscKarencjaZaTur ?? 0) > 0) return true;
  if ((s.zywnoscMiastNiedokarmionych ?? 0) > 0) return true;
  const stock = Number(s.zywnoscLabel);
  return runwayShort(Number.isFinite(stock) ? stock : 0, s.zywnoscRate ?? 0);
}

/** Surowce: choć jeden magazynowany surowiec w niedoborze. */
export function hudResourceShortage(s: HudState): boolean {
  return (s.surowceNiedoborLabels?.length ?? 0) > 0;
}

function surowceChipTitle(s: HudState): string {
  const summary = s.surowceSummary ?? '—';
  let title = `Surowce — magazyn państwa`
    + ` · Podsumowanie: ${summary} surowców magazynowanych bez alertu (OK / wszystkie)`;
  if (s.surowceAlert) {
    title += ` · ⚠ Alert: co najmniej jeden surowiec na limicie magazynu lub w niedoborze`;
  }
  if (hudResourceShortage(s)) {
    title += ` · Niedobór (czerwony): ${s.surowceNiedoborLabels!.join(', ')}`;
  }
  // R-WEB-HUD-TOPBAR-GRID-GROSS-NET-Q1: BRUTTO = suma produkcji (+ przychód z umów) / turę,
  // NETTO = po odjęciu zużycia (obywatele, budynki, wojsko) i umów wychodzących; przy deficycie
  // komórka pokazuje NAJGORSZY surowiec (linia „najgorszy"), nie sumę, która maskuje brak.
  if (s.surowceBrutto !== undefined || s.surowceNetto !== undefined) {
    title += ` · BRUTTO ${signed(s.surowceBrutto ?? 0)} → NETTO ${signed(s.surowceNetto ?? 0)} szt./turę (suma surowców)`;
    const worst = surowceNajgorszy(s);
    if (worst) title += ` · Najgorszy bilans: ${worst.label} ${signed(worst.netto)}/turę`;
    const lines = (s.surowceBilans ?? [])
      .filter(r => r.brutto !== 0 || r.netto !== 0)
      .map(r => `${r.label}: brutto ${signed(r.brutto)}, netto ${signed(r.netto)}`);
    if (lines.length > 0) title += ` · ${lines.join('; ')}`;
  }
  return `${title} · Kliknij po szczegóły.`;
}

function handelChipTitle(s: HudState): string {
  const income = s.handelIncome ?? 0;
  const routes = s.handelRouteCount ?? 0;
  return `Handel — wymiana z obcymi cywilizacjami`
    + ` · BRUTTO: ${signed(income)} pkt Pieniądza/turę (dochód z ${routes} aktywnych tras handlowych) → NETTO: ${signed(income)} (trasy nie mają kosztów; ten dochód jest już wliczony we wpływy Skarbca)`
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

/**
 * R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1: podświetla chip 6C (Kultura/Religia), gdy
 * powiązany zasięg jest aktywny na mapie 3D — analogon dawnego stanu `.on` na ikonach
 * mapBtn/searchBtn przy minimapie (usuniętych, patrz minimapHud.ts). `chip6cHtml()`
 * (hudChip6c.ts) zostaje NIETKNIĘTY — poza allowlistą tego tematu — dopisujemy klasę
 * `civ-hud-chip-range-on` do już wyrenderowanego znacznika. `chip6cHtml()` zawsze
 * otwiera chip z klikalnym `act` dokładnie tak (patrz hudChip6c.ts:
 * `class="civ-hud-chip civ-hud-chip-click"` + `data-act=`), więc podmiana jest
 * deterministyczna, nie zgadywaniem układu znaczników.
 */
function withChipRangeActive(html: string, active: boolean): string {
  if (!active) return html;
  return html.replace('class="civ-hud-chip civ-hud-chip-click"', 'class="civ-hud-chip civ-hud-chip-click civ-hud-chip-range-on"');
}

// R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1: `export` dodany WYŁĄCZNIE po to, żeby bramka
// `tools/hud-zetony-ekonomia-brutto-live-test.cjs` mogła zaimportować i realnie
// wyrenderować ten sam, niezmodyfikowany kod w prawdziwym Chromium (żywy zrzut,
// nie atrapa) — zero zmiany zachowania w main.ts/hud.ts (funkcja nadal wołana
// tylko wewnętrznie w tym module, jak dotąd).
export function renderBarD1B(s: HudState): string {
  const powerIconHtml = powerCenterIconHtml(s);
  // R-WEB-HUD-TOPBAR-GRID-GROSS-NET-Q1: STAŁY układ 3+3 (siatka CSS, 3 kolumny o stałej
  // szerokości, zero zawijania zależnego od liczb): góra Skarbiec · Praca · Spichlerz,
  // dół Handel · Nauka · Surowce. Każda komórka: linia 1 = etykieta + zapas, linia 2 =
  // „brutto" (przychód przed kosztami), linia 3 = „netto" (po wszystkich opłatach = realna
  // zmiana stanu na następną turę). Wartości z TYCH SAMYCH pól HudState co dotąd/panel.
  const skarbiecBrutto = s.bogactwoWplywyBrutto ?? s.bogactwoRate ?? 0;
  const skarbiecNetto = s.bogactwoRate ?? skarbiecBrutto;
  // Praca: netto = PROGNOZA następnego końca tury (gdy dostępna), brutto = prognoza + utrzymanie ulepszeń
  // (auto-ulepszenia i Cuda na mapie zależą od puli w ticku i nie wchodzą do prognozy).
  const pracaNetto = s.pracaPrognoza ?? (s.pracaRate ?? 0);
  const pracaBrutto = s.pracaPrognoza !== undefined ? s.pracaPrognoza + (s.pracaUpkeep ?? 0) : pracaWplywBrutto(s);
  const foodBrutto = s.zywnoscWplywMiast ?? s.zywnoscRate ?? 0;
  const foodNetto = s.zywnoscRate ?? 0;
  const handelBrutto = s.handelIncome ?? 0;
  const naukaStawka = s.naukaRate ?? 0;
  const surBrutto = s.surowceBrutto ?? 0;
  // Surowce: brutto i netto to TA SAMA wielkosc (suma po surowcach), wiec netto = suma netto; deficyt
  // pojedynczego surowca sygnalizuje czerwony chip + ⚠ + tooltip („Najgorszy bilans" i lista per surowiec).
  const surNetto = s.surowceNetto ?? 0;
  // R-WEB-HUD-TOPBAR-NO-LABELS-Q1: w banerze tylko liczby (bez słów); wyjaśnienie w tooltipie komórki.
  const NET_HINT = 'Przyrost: pierwsza liczba = BRUTTO (przychód przed kosztami), druga = NETTO (po wszystkich opłatach = zmiana stanu na turę)';
  const row1: string[] = [
    chip6cHtml({
      iconId: 'res-treasury',
      label: 'Skarbiec',
      value: formatCompactNumber(s.bogactwo),
      rate: formatCompactSigned(skarbiecBrutto),
      net: formatCompactSigned(skarbiecNetto),
      netTone: netTone(skarbiecNetto),
      rateTone: netTone(skarbiecBrutto),
      netHint: NET_HINT,
      exact: exactCompactNote(s.bogactwo, skarbiecBrutto),
      valClass: ` ${resourceTextClass('skarbiec')}`,
      shortage: hudGoldShortage(s),
      act: 'skarbiec',
      title: skarbiecChipTitle(s),
    }),
    chip6cHtml({
      iconId: 'res-work',
      label: 'Praca',
      value: formatCompactNumber(s.praca),
      rate: formatCompactSigned(pracaBrutto),
      net: formatCompactSigned(pracaNetto),
      netTone: netTone(pracaNetto),
      rateTone: netTone(pracaBrutto),
      netHint: NET_HINT,
      exact: exactCompactNote(s.praca, pracaBrutto),
      valClass: ` ${resourceTextClass('praca')}`,
      act: 'praca',
      title: pracaChipTitle(s),
    }),
    chip6cHtml({
      iconId: 'res-food',
      label: 'Spichlerz',
      value: formatCompactNumber(foodHudValue(s)),
      rate: formatCompactSigned(foodBrutto),
      net: formatCompactSigned(foodNetto),
      netTone: netTone(foodNetto),
      rateTone: netTone(foodBrutto),
      netHint: NET_HINT,
      exact: exactCompactNote(foodHudValue(s), foodBrutto),
      valClass: ` ${resourceTextClass('zywnosc')}`,
      // P-SPICHLERZ-ZERO-MYLACE: chip czerwony też przy niedokarmionych miastach, nie
      // tylko przy głodzie wojska/ujemnym tempie — sam kolor ma sygnalizować deficyt.
      // (`hudFoodShortage` obejmuje `zywnoscMiastNiedokarmionych > 0`; dawny `rateWarn` na linii
      // „brutto" zastąpiła czerwona linia „netto" + klasa shortage całego chipu.)
      shortage: hudFoodShortage(s),
      act: 'spichlerz',
      title: spichlerzChipTitle(s),
    }),
  ];
  const row2: string[] = [
    chip6cHtml({
      iconId: 'res-trade',
      label: 'Handel',
      value: '',   // dochód z tras to brutto=netto (brak kosztów tras) — w liniach brutto/netto
      rate: formatCompactSigned(handelBrutto),
      net: formatCompactSigned(handelBrutto),
      netTone: netTone(handelBrutto),
      rateTone: netTone(handelBrutto),
      netHint: NET_HINT,
      exact: exactCompactNote(undefined, handelBrutto),
      act: 'handel',
      title: handelChipTitle(s),
    }),
    chip6cHtml({
      iconId: 'res-science',
      label: 'Nauka',
      value: formatCompactNumber(Math.floor(s.nauka)),
      rate: formatCompactSigned(naukaStawka),
      net: formatCompactSigned(naukaStawka),
      netTone: netTone(naukaStawka),
      rateTone: netTone(naukaStawka),
      netHint: NET_HINT,
      exact: exactCompactNote(Math.floor(s.nauka), naukaStawka),
      medVariant: 'science',
      valClass: ` ${resourceTextClass('nauka')}`,
      act: 'nauka',
      title: naukaChipTitle(s),
      researchProgress: resolveResearchProgress(s),
    }),
    chip6cHtml({
      iconId: 'res-resources',
      label: 'Surowce',
      value: s.surowceAlert ? '⚠' : '',   // bez liczby (Maciej 2026-07-24); ⚠ = alert magazynu/niedoboru
      rate: formatCompactSigned(surBrutto),
      net: formatCompactSigned(surNetto),
      netTone: netTone(surNetto),
      rateTone: netTone(surBrutto),
      netHint: NET_HINT,
      shortage: hudResourceShortage(s),
      act: 'surowce',
      title: surowceChipTitle(s),
    }),
  ];
  const leftChipsHtml = '<div class="hud-chip-grid">' + row1.join('') + row2.join('') + '</div>';
  const rightChips: string[] = [
    chip6cHtml({
      iconId: 'tb-army',
      label: 'Armia',
      ...cn(s.armyUnitsOnMap ?? 0, s.rekrutEkw ?? 0),
      // P-ARMIA-CHIP-PELNE-JEDNOSTKI (Maciej 2026-08-12): "+" pokazywał surową odnowę puli
      // rekrutów/turę (mylące dla dużej puli — czytało się jak liczba rekrutów, nie jak
      // ile wojska da się wystawić). Teraz pokazuje PEŁNE jednostki możliwe do zwerbowania
      // z całej puli imperium (rekrutEkw = floor(rekruci / kosztJednostki), main.ts, to
      // samo źródło co panel "Rekruci (pula werbu)"). Odnowa/turę zostaje w tooltipie.
      // / EN: "+" used to show the raw pool regen/turn (misleading at a large pool — read
      // like a recruit count, not like how much army it can field). Now shows FULL units
      // recruitable from the whole empire pool (rekrutEkw = floor(rekruci / kosztJednostki),
      // main.ts, same source as the "Rekruci (pula werbu)" panel). Regen/turn stays in the
      // tooltip.
      rateWarn: !!s.glodWojska,
      act: 'armia',
      title: armiaChipTitle(s),
    }),
    chip6cSep(),
    chip6cHtml({
      // P-BRAK-LACZNEJ-LICZBY-OBYWATELI-W-HUD: 'res-population' (ikona ludzi) przechodzi
      // na nowy chip „Obywatele" poniżej — Miasta dostaje właściwą ikonę osiedla, żeby
      // dwa sąsiednie chipy nie dzieliły tej samej ikony dla dwóch różnych liczb.
      // / EN: 'res-population' (people icon) moves to the new "Obywatele" chip below —
      // Miasta gets the correct settlement icon so two adjacent chips don't share the
      // same icon for two different numbers.
      iconId: 'res-settlements',
      label: 'Miasta',
      ...cn(s.osiedla, s.ludnoscRate ?? 0),
      act: 'miasta',
      title: miastaChipTitle(s),
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-population',
      label: 'Obywatele',
      ...cn(s.ludnosc, s.ludnoscRate ?? 0),
      act: 'ludnosc',
      title: obywateleChipTitle(s),
    }),
    chip6cSep(),
    // GOAL 2/kryterium końca #3: chip podświetlony gdy zasięg kultury/religii jest widoczny
    // na mapie 3D. hudChip6c.ts NIE jest w allowliście tego tematu (dispatch wymienia
    // WYŁĄCZNIE minimapHud.ts/hud.ts/main.ts/mapToolbarHud.ts) — zamiast rozszerzać
    // Chip6cOpts tam, podświetlenie wstrzykujemy tu, w hud.ts, przez withChipRangeActive()
    // (prosty postprocessing wygenerowanego znacznika, kontrakt chip6cHtml nietknięty).
    withChipRangeActive(chip6cHtml({
      iconId: 'res-culture',
      label: 'Kultura',
      ...cn(Math.floor(s.kultura), s.kulturaRate ?? 0),
      valClass: ` ${resourceTextClass('kultura')}`,
      act: 'kultura',
      title: kulturaChipTitle(s),
    }), cfg?.minimapLayers?.isCultureActive?.() ?? false),
    chip6cSep(),
    withChipRangeActive(chip6cHtml({
      iconId: 'res-religion',
      label: 'Religia',
      ...cn(Math.round(s.religionStock ?? 0), s.religionRate ?? 0),
      valClass: ` ${resourceTextClass('religia')}`,
      act: 'religia',
      title: religiaChipTitle(s),
    }), cfg?.minimapLayers?.isReligionActive?.() ?? false),
  ];

  // R-WEB-HUD-RECRUITS-NUMBER-ABBREV-Q1: liczba rekrutów skracana wspólnym formatterem k/M
  // (jak reszta HUD), pełna wartość w tooltipie; bez liczby → stara etykieta (fallback).
  const recruitNum = typeof s.rekruci === 'number' && Number.isFinite(s.rekruci) ? s.rekruci : undefined;
  const rekrLabel = recruitNum !== undefined ? formatCompactNumber(recruitNum) : (s.rekruciLabel ?? '—');
  const rekrFull = recruitNum !== undefined ? formatFullNumber(recruitNum) : rekrLabel;
  const recruitCount = Number.isSafeInteger(s.rekrutEkw) && (s.rekrutEkw ?? 0) > 0 ? s.rekrutEkw : 0;
  const recruitCostTitle = s.kosztJednostki != null
    ? ` · Koszt jednej jednostki: ${s.kosztJednostki} rekrutów`
    : '';
  const recruitTitle = `Manpower: ${rekrFull} · Możesz zwerbować ${recruitCount} pełnych jednostek${recruitCostTitle} · Kliknij po szczegóły.`;

  let html = '<div class="civ-hud-banner-left"><div class="civ-hud-banner-shell">'
    + leftChipsHtml + '</div></div>';

  const eraGateTitle = s.eraGateSummary ? ' title="' + escHtml(s.eraGateSummary) + '"' : '';
  const eraGateCls = s.eraGateSummary ? ' p-epoch-gated' : '';
  html += '<div class="power-center" data-act="power" title="Moc imperium — siła absolutna państwa · Duża liczba: punkty Mocy (łączna siła imperium) · Kliknij po szczegóły.">'
    + '<div class="p-epoch' + eraGateCls + '"' + eraGateTitle + '>' + escHtml(s.epoka) + '</div>'
    + '<div class="p-row">'
    + `<span class="p-side p-side-left" data-act="rekruci" title="${escHtml(recruitTitle)}">`
    + '<span class="p-stack">'
    + recruitSideIconHtml()
    + `<span class="p-recruit-val">${recruitHudLabel(rekrLabel, s.rekrutEkw)}</span>`
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
    ? '<button type="button" class="b-wiki' + (wikiOn ? ' on' : '') + '" data-act="wiki" aria-label="Civpedia — poradnik i encyklopedia" title="Civpedia — poradnik i encyklopedia">'
      + wikiBookIcon(16)
      + '<span>Civpedia</span></button>'
    : '';
  // Pełny ekran ⛶ — przy minimapie na mapie świata; w mieście obok Menu.
  const fsBtn = (fullscreenSupported() && !isDocFullscreen())
    ? '<button type="button" class="b-menu" data-act="fullscreen" title="Pełny ekran" aria-label="Pełny ekran">'
      + '<span aria-hidden="true">⛶</span></button>'
    : '';
  const showMapZoomDock = !mapChromeSuppressed;
  const recruitBtn = (!mapChromeSuppressed && cfg?.onOpenEmpireRecruit)
    ? '<button type="button" class="b-wiki" data-act="empire-recruit" aria-label="Rekrutacja — cała cywilizacja" '
      + 'title="Rekrutacja wojsk dla całej cywilizacji — zamówienie rozkładane po miastach"><span>Rekrutacja</span></button>'
    : '';
  const menuBtn = (!mapChromeSuppressed && cfg?.onOpenMenu)
    ? '<button type="button" class="b-menu" data-act="menu" title="Menu główne">'
      + (menuIc || '') + '<span>Menu</span></button>'
    : '';
  html += '<div class="hud-right-cluster">'
    + '<div class="civ-hud-banner-shell civ-hud-banner-right"><div class="hud-chip-row">'
    + rightChips.join('') + '</div></div>'
    + '<div class="hud-right">'
    + recruitBtn
    + wikiBtn
    + menuBtn
    + (showMapZoomDock ? '' : fsBtn)
    + '</div></div>';
  renderUtilDock(showMapZoomDock, fsBtn);
  return html;
}

/**
 * R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1: przycisk toggle 👤/⛏ w rzędzie zoom —
 * ten sam wzorzec ikony/tooltipa/zachowania co dawny `mini-tool-btn` w minimapHud.ts,
 * zmienia się WYŁĄCZNIE pozycja w DOM (kryterium końca #2).
 */
function utilToggleBtnHtml(opts: { act: string; icon: string; title: string; active: boolean }): string {
  const t = escHtml(opts.title);
  return `<button type="button" class="b-util-toggle${opts.active ? ' on' : ''}" data-act="${opts.act}" `
    + `aria-label="${t}" aria-pressed="${opts.active ? 'true' : 'false'}" title="${t}">${opts.icon}</button>`;
}

function renderUtilDock(show: boolean, fsBtn: string): void {
  if (utilDockEl === null) return;
  utilDockEl.classList.toggle('is-city-view', mapChromeSuppressed);
  if (!show) {
    utilDockEl.style.display = 'none';
    utilDockEl.innerHTML = '';
    return;
  }
  utilDockEl.style.display = 'flex';
  utilDockEl.title = 'Powiększenie UI i pełny ekran';
  // GOAL 1: worker + deposit — u góry minimapy, obok kontrolki zoom (właściciel: "postawiłbym
  // obok tego plus minus 150"). Ten sam dock jest już wizualnie tuż nad canvasem minimapy
  // (minimapLayout.ts utilDockBottomCss) — nic więcej nie trzeba przesuwać.
  const W = cfg?.minimapWorkerOverlay;
  const D = cfg?.minimapResourceDepositOverlay;
  const workerBtn = W?.onToggleWorkers
    ? utilToggleBtnHtml({
      act: 'worker-toggle',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="7.2" r="3.4"/><path d="M5.4 20v-1.1c0-3.2 2.9-5.4 6.6-5.4s6.6 2.2 6.6 5.4V20"/></svg>',
      title: 'Pokaż robotników w terenie',
      active: W.isWorkersActive?.() ?? false,
    })
    : '';
  const depositBtn = D?.onToggleDeposits
    ? utilToggleBtnHtml({
      act: 'deposit-toggle',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.4 17C4.2 9.4 12.7 3.4 19.8 6.3"/><path d="M7.1 4.4 18.3 20.5"/></svg>',
      title: 'Pokaż złoża i surowce na mapie',
      active: D.isDepositsActive?.() ?? false,
    })
    : '';
  utilDockEl.innerHTML = workerBtn + depositBtn + renderZoomControls() + fsBtn;
}

function renderBarLegacy(s: HudState): string {
  let html = '';
  html += '<div class="grp">' + res('\u{1FA99}', String(s.zloto), 'Złoto', signed(s.zlotoRate))
    + res('\u{1F528}', String(s.praca), 'Praca', signed(s.pracaRate), true) + '</div>';
  html += '<div class="grp">' + res(naukaHudWordHtml(), String(Math.floor(s.nauka)), 'Badania', signed(s.naukaRate ?? 0), false, 'science')
    + res('\u{1F3BC}', String(Math.floor(s.kultura)), 'Kultura', signed(s.kulturaRate ?? 0)) + '</div>';
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
  else if (act === 'empire-recruit') cfg.onOpenEmpireRecruit?.();
  else if (act === 'menu') cfg.onOpenMenu?.();
  else if (act === 'fullscreen') toggleFullscreen();
  else if (act === 'zoom-in') stepUiZoom(UI_ZOOM_STEP);
  else if (act === 'zoom-out') stepUiZoom(-UI_ZOOM_STEP);
  // GOAL 1: worker/deposit przeniesione z minimapHud.ts do rzędu zoom — te same hooki
  // (cfg.minimapWorkerOverlay/minimapResourceDepositOverlay), tylko wołane stąd. Toggle
  // w main.ts sam odświeża HUD (refreshD1bHud), więc nie trzeba tu wołać renderBar().
  else if (act === 'worker-toggle') cfg.minimapWorkerOverlay?.onToggleWorkers?.();
  else if (act === 'deposit-toggle') cfg.minimapResourceDepositOverlay?.onToggleDeposits?.();
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
          if (fresh) showPowerOverlay(fresh, undefined, refreshPower, brandIconSvg('res-influence', 20));
        };
        showPowerOverlay(data, undefined, refreshPower, brandIconSvg('res-influence', 20));
      }
    }
  } else if (act === 'religia' || act === 'kultura' || act === 'skarbiec' || act === 'praca' || act === 'nauka'
    || act === 'miasta' || act === 'ludnosc' || act === 'rekruci' || act === 'spichlerz' || act === 'zywnosc' || act === 'armia'
    || act === 'surowce' || act === 'handel') {
    // GOAL 2: klik chipa Kultura/Religia w górnym pasku PRZEŁĄCZA (toggle) podświetlenie
    // zasięgu na mapie 3D (dawna funkcja ikon mapBtn/searchBtn przy minimapie, usuniętych
    // z minimapHud.ts) — OPRÓCZ dotychczasowego otwarcia panelu szczegółów, nie zamiast
    // niego. Toggle NAJPIERW: toggleCultureRangeOnMap()/toggleReligionRangeOnMap()
    // (main.ts) same wołają hideEmpireOverlay() — gdyby poszły PO otwarciu panelu,
    // zamknęłyby panel, który właśnie otwarliśmy.
    if (act === 'kultura') cfg.minimapLayers?.onToggleCulture?.();
    else if (act === 'religia') cfg.minimapLayers?.onToggleReligion?.();
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

function ensureUtilDockMounted(): void {
  if (utilDockEl !== null) return;
  utilDockEl = document.createElement('div');
  utilDockEl.className = 'civ-hud-util-dock';
  document.body.appendChild(utilDockEl);
}

function hudActionRootContains(el: HTMLElement): boolean {
  if (barEl !== null && barEl.contains(el)) return true;
  if (utilDockEl !== null && utilDockEl.contains(el)) return true;
  return false;
}

function ensureBarActionsBound(): void {
  if (barActionsBound) return;
  if (barEl === null) return;
  barActionsBound = true;
  const onActivate = (e: MouseEvent | KeyboardEvent): void => {
    const t = e.target as HTMLElement | null;
    if (t === null || cfg === null) return;
    const el = t.closest('[data-act]') as HTMLElement | null;
    if (el === null || !hudActionRootContains(el)) return;
    const act = el.getAttribute('data-act');
    if (act === null) return;
    if (e instanceof KeyboardEvent) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
    }
    handleHudBarAction(act);
  };
  barEl.addEventListener('click', onActivate);
  barEl.addEventListener('keydown', onActivate);
  ensureUtilDockMounted();
  utilDockEl!.addEventListener('click', onActivate);
  utilDockEl!.addEventListener('keydown', onActivate);
}

/**
 * R-WEB-HUD-TOPBAR-LAYOUT-A-Q1: dobór trybu banerów po renderze (zależy od treści i szerokości okna, więc
 * nie da się go zapisać samym CSS). LEWY: 6 żetonów w jednej linii, a gdy najszerszy żeton się nie mieści
 * — klasa `.hud-left-fallback` (2 rzędy po 3). PRAWY: wszystkie chipy w jednej linii; gdy nie mieszczą się
 * w banerze — stopnie `.hud-r-tight` → `.hud-r-stack` → `.hud-r-min` (patrz CSS). Wołane synchronicznie
 * zaraz po `innerHTML` (bez malowania pośredniego) i przy zmianie rozmiaru okna.
 */
const HUD_RIGHT_TIERS = ['hud-r-tight', 'hud-r-stack', 'hud-r-min'] as const;
export function fitHudTopbar(root: ParentNode | null = barEl): void {
  if (root === null) return;
  const left = root.querySelector<HTMLElement>('.civ-hud-banner-left');
  const grid = left?.querySelector<HTMLElement>('.hud-chip-grid') ?? null;
  // Medalion Mocy rośnie z liczbą rekrutów (szerszy niż bazowe 240 px) — banery nie mogą na niego wejść.
  const power = root.querySelector<HTMLElement>('.power-center');
  const powerRect = power !== null && power.getClientRects().length > 0 ? power.getBoundingClientRect() : null;
  if (left !== null && grid !== null) {
    left.classList.remove('hud-left-fallback', 'hud-left-compact', 'hud-left-tiny');
    left.style.width = '';
    left.style.maxWidth = '';
    if (powerRect !== null) {
      const room = powerRect.left - 10 - left.getBoundingClientRect().left;
      if (room > 0 && room < left.getBoundingClientRect().width) {
        left.style.width = room + 'px';
        left.style.maxWidth = room + 'px';
      }
    }
    const cells = Array.from(grid.querySelectorAll<HTMLElement>('.civ-hud-chip-cell'));
    const leftOverflows = (): boolean => grid.scrollWidth > grid.clientWidth + 0.5
      || cells.some((c) => c.scrollWidth > c.clientWidth + 0.5);
    if (leftOverflows()) {
      left.classList.add('hud-left-fallback');
      // Ostatnia deska ratunku przy ekstremalnych liczbach: pomniejszenie czcionek/ikon (kolumny zostaja rowne).
      for (const cls of ['hud-left-compact', 'hud-left-tiny']) {
        if (!leftOverflows()) break;
        left.classList.add(cls);
      }
    }
  }
  if (left !== null && typeof document !== 'undefined') {
    const shellRect = left.querySelector<HTMLElement>('.civ-hud-banner-shell')?.getBoundingClientRect();
    const need = shellRect !== undefined && shellRect.height > 0 ? Math.ceil(shellRect.bottom + 8) : 0;
    const docStyle = document.documentElement.style;
    if (need > TOOLBAR_TOP_PX) docStyle.setProperty('--civ-hud-toolbar-top', need + 'px');
    else docStyle.removeProperty('--civ-hud-toolbar-top');
  }
  const right = root.querySelector<HTMLElement>('.civ-hud-banner-right');
  if (right !== null) {
    right.classList.remove(...HUD_RIGHT_TIERS);
    right.style.maxWidth = '';
    const cluster = right.closest<HTMLElement>('.hud-right-cluster');
    if (powerRect !== null && cluster !== null && getComputedStyle(cluster).flexDirection.startsWith('column')) {
      const room = cluster.getBoundingClientRect().right - (powerRect.right + 8);
      if (room > 0 && room < right.getBoundingClientRect().width) right.style.maxWidth = room + 'px';
    }
    const row = right.querySelector<HTMLElement>('.hud-chip-row') ?? right;
    // +4,5 px: ostatni chip klikalny ma margin-right −4 px (pole hover) — to nie jest ucięcie.
    const rightOverflows = (): boolean => right.scrollWidth > right.clientWidth + 0.5
      || row.scrollWidth > row.clientWidth + 4.5;
    for (const tier of HUD_RIGHT_TIERS) {
      if (!rightOverflows()) break;
      right.classList.add(tier);
    }
  }
}

let hudFitResizeBound = false;
function ensureHudFitOnResize(): void {
  if (hudFitResizeBound || typeof window === 'undefined') return;
  hudFitResizeBound = true;
  window.addEventListener('resize', () => { if (hudSessionActive) fitHudTopbar(); });
}

function renderBar(): void {
  if (barEl === null || cfg === null) return;
  const s = hudStateSnapshot();
  if (useD1BLayout()) {
    barEl.innerHTML = renderBarD1B(s);
    fitHudTopbar(barEl);
    ensureHudFitOnResize();
  } else {
    barEl.innerHTML = renderBarLegacy(s);
    renderUtilDock(false, '');
  }
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
    // R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1: worker/deposit NIE jadą już do
    // createMinimapHud — przeniesione do renderUtilDock() (rząd zoom), patrz niżej.
    minimapApi = createMinimapHud({
      getMinimapData: cfg.getMinimapData,
      onMinimapClick: cfg.onMinimapClick,
      layers: buildMinimapLayers(),
      playtestFog: cfg.minimapPlaytestFog,
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
/**
 * R-WEB-MINIMAP-VIEWPORT-RECT-FOLLOW-Q1: ramka widoku na minimapie podąża za kamerą. Wołane z renderLoop
 * w każdej klatce; przerysowuje tylko canvas minimapy i tylko gdy prostokąt się zmienił (minimapHud.updateViewport).
 * Sama kamera NIE ustawia `minimapDirty` (to bramka pełnego przerysowania heksów przy zmianie mgły/mapy).
 */
export function updateMinimapViewport(viewport: { x: number; y: number; w: number; h: number } | undefined): void {
  minimapApi?.updateViewport(viewport);
}
function refreshMinimap(): void {
  if (cfg === null) return;
  if (!miniMounted) { mountMinimap(); }
  if (!minimapDirty) return;
  minimapDirty = false;
  if (minimapApi !== null) {
    minimapApi.update();
    if (cfg.getState !== undefined) setMinimapTurnLabel(minimapApi, hudStateSnapshot().tura);
    return;
  }
  if (miniEl === null) return;
  if (cfg.getMinimapData !== undefined && miniCanvas !== null) {
    const data = cfg.getMinimapData();
    if (data !== null) renderMinimapCanvas(data);
  }
}

let diploUnitDockGateRegistered = false;

function registerDiploUnitDockGate(): void {
  if (diploUnitDockGateRegistered) return;
  diploUnitDockGateRegistered = true;
  setDiploOpenChecker(() => isDiploListHudOpen() || isDiplomacyAudienceOpen());
  onDiploUiVisibilityChange(() => refreshSidePanel());
}

function mountSidePanel(): void {
  if (cfg === null || sidePanelApi !== null) return;
  registerDiploUnitDockGate();
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
    onContextCycleUnit: cfg.onContextCycleUnit,
    canContextCycleUnit: cfg.canContextCycleUnit,
    onEventClick: cfg.onEventClick,
    getEventLink: cfg.getEventLink,
    onEventDismiss: cfg.onEventDismiss,
    onDismissAll: cfg.onDismissAll,
  });
  document.body.appendChild(sidePanelApi.el);
  document.body.appendChild(sidePanelApi.ctxEl);
}

function refreshSidePanel(): void {
  if (sidePanelApi !== null) sidePanelApi.update();
}

function mountBottomBar(): void {
  if (cfg === null || bottomBarApi !== null) return;
  if (!useD1BLayout()) return;
  bottomBarApi = createBottomBarHud({
    getTurn: () => hudStateSnapshot().tura,
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
    getResearchProgress: () => resolveResearchProgress(hudStateSnapshot()),
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
  installHudTitleTooltips();
  ensureFullscreenListener();
  ensureUiZoomApplied();
  if (barEl === null) {
    barEl = document.createElement('div');
    barEl.className = 'civ-hud';
    document.body.appendChild(barEl);
    ensureUtilDockMounted();
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
/**
 * R-WEB-PERF-LATE-GAME-LAG-HUD-Q2: `getState()` (buildHudState w main.ts) jest drogie w dużej
 * cywilizacji, a w obrębie jednego `updateHud()` było wołane kilkanaście razy (pasek, minimapa,
 * dolny pasek, postęp badań...). Podmoduły HUD tylko RENDERUJĄ DOM z tego stanu i nie mutują
 * stanu gry, więc w obrębie jednego synchronicznego `updateHud()` wystarczy JEDNA migawka.
 * Poza `updateHud()` (zdarzenia, timery) każdy odczyt dalej woła `getState()` świeżo.
 */
const hudFrame = createStateFrame<HudState>(() => cfg!.getState());
function hudStateSnapshot(): HudState { return hudFrame.snapshot(); }

export function updateHud(): void {
  hudFrame.run(() => {
    renderBar();
    refreshMinimap();
    refreshSidePanel();
    refreshD1BModules();
    refreshContextPanel();
  });
}

/** Ukryj HUD. */
export function hideHud(): void {
  hudSessionActive = false;
  hidePowerOverlay();
  hideEmpireOverlay();
  if (barEl !== null) barEl.style.display = 'none';
  if (utilDockEl !== null) utilDockEl.style.display = 'none';
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

export type { MinimapHexData, MinimapData, MinimapPlaytestFogHooks, MinimapWorkerOverlayHooks, MinimapResourceDepositOverlayHooks } from './minimapHud';
export type { ContextPanelData, SidePanelEvent, SidePanelEventKind } from './sidePanelHud';
export type { UnitPanelState } from './unitPanelHud';
export type { BuildTypeInfo } from './buildModeHud';
