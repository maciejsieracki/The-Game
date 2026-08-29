/**
 * buildModeHud.ts — tryb 🔨 Budowa (A4-Q1=A, A4-D4-Q1=A).
 * Panel 15 ulepszeń + banner; dane/kwalifikacja od MAPA (SILNIK wpina API).
 * LANE: src/ui/* — bez main.ts.
 */

import type { ImprovementKey } from '../render/improvements';
import {
  EVENTS_PANEL_ABOVE_TURN_GAP_PX,
  HUD_EDGE_PX,
  HUD_ZOOM_EDGE_PX,
  turnStackBottomPx,
} from './hudLayout';
import { improvementIconSvg } from './icons/brandAssets';
import { techIconSvg } from './techIcons';
import { openEntityCard } from './entityCards/renderer';
import type { UlepszeniaFocus, UlepszeniaTryb, UlepszeniaPracaPercent, UlepszeniaEmpirePolicy } from '../game/cities';
// R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1: `PODZIAL_PRACY_PULA_LBL*` / `PODZIAL_PRACY_PULA_TIP`
// (nazwy warstwy (a) — `CityPodzialPracy.procentBudynki`) juz tu NIE sa importowane: ten panel
// nie renderuje warstwy (a). `MAX_PROCENT_PULI_IMPERIUM` zostaje wylacznie jako liczba w tooltipie
// warstwy (c), zeby jawnie powiedziec, ze warstwa (c) tego capu NIE dziedziczy.
import {
  MAX_PROCENT_PULI_IMPERIUM,
  MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
} from '../game/cities';

export interface BuildTypeInfo {
  key: ImprovementKey;
  label: string;
  kosztPraca: number;
  epoka: number;
  typ?: 'wycinka' | 'ulepszenie';
  techId?: string | null;
  techUnlocked?: boolean;
  techLabel?: string | null;
  /** Pełny tekst wymagań gdy zablokowane (hover). */
  lockHint?: string | null;
}

/** Cud świata — wybór z panelu budowy, placement na heksie mapy. */
export interface WonderBuildTypeInfo {
  id: string;
  label: string;
  kosztPraca: number;
  epokaWejscia: number;
  /** E = wyłączny cywilizacji, R = wyścig światowy. */
  dostep?: string;
  /** Już w budowie na mapie (nie kolejka miasta). */
  building?: boolean;
  lockHint?: string | null;
}

export interface BuildModeHudConfig {
  /** Lista typów (np. createImprovementBuildApi().listTypes). */
  listTypes: () => BuildTypeInfo[];
  getActiveKey: () => ImprovementKey | null;
  onSelectType: (key: ImprovementKey | null) => void;
  onExit: () => void;
  /** Czy tryb budowy aktywny (pokaz panel). */
  isOpen: () => boolean;
  /** Cuda świata — lista na dole panelu (tylko aktualnie dostępne dla cywilizacji). */
  listWonders?: () => WonderBuildTypeInfo[];
  onSelectWonder?: (wonderId: string) => void;
  getActiveWonderId?: () => string | null;
  /** Podtytuł sekcji cudów (np. postęp budowy na mapie). */
  getWonderTargetLabel?: () => string | null;
  /** A-START-05: gracz bez miasta — przycisk Załóż miasto. */
  canFoundCity?: () => boolean;
  isFoundCityActive?: () => boolean;
  onSelectFoundCity?: () => void;
  /** Etykieta kosztu założenia miasta (np. „20 P · 1 👤"). */
  getFoundCityCostLabel?: () => string;
  /** Podpowiedź gdy założenie zablokowane (za mało P / ludności). */
  getFoundCityLockHint?: () => string | null;
  /** R-PIERWSZE-MIASTO: tylko przycisk Załóż miasto (bez ulepszeń/cudów). */
  isFoundCityOnly?: () => boolean;
  /**
   * R-STAWKI-KOSZT-ULEPSZEN-X2-PRZYSTEPNOSC (Maciej, ECHO A): aktualna pula Pracy gracza —
   * pozycje z kosztem wyższym niż pula są wyszarzane i zablokowane (jak tech-lock) zamiast
   * dowiadywać się o braku Pracy dopiero po kliknięciu w hex.
   * / EN: player's current Work pool — items costing more than the pool are grayed out and
   * blocked (same as tech-lock) instead of failing only after a hex click.
   */
  getPracaPool?: () => number;
  /** Auto-ulepszenia terenu — polityka państwa + wyjątek per miasto (R-AUTO-V2-Q3=C). */
  listPlayerCities?: () => { id: string; name: string }[];
  getUlepszeniaCityId?: () => string | null;
  onUlepszeniaCityIdChange?: (cityId: string) => void;
  getUlepszeniaEmpireState?: () => UlepszeniaEmpirePolicy | null;
  /**
   * R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1: pozycje `getEmpirePracaSplit` /
   * `onEmpirePracaSplitChange` USUNIETE. Sterowaly warstwa (a) — polem
   * `CityPodzialPracy.procentBudynki` (podzial Pracy miasta: budynki vs pula
   * imperium, 0–50%) — mimo ze nazwa mowila o nieistniejacej warstwie (b).
   * Warstwa (a) ma dokladnie dwa prawowite miejsca w UI: `empireDetailPanel.ts`
   * (globalnie) i `cityPanel.ts` (per miasto); trzeci egzemplarz w panelu trybu
   * budowy byl duplikatem tego samego pola i tego samego suwaka. W tym panelu
   * zostaje WYLACZNIE warstwa (c) — `UlepszeniaEmpirePolicy.pracaAutoPercent`
   * i `City.ulepszeniaPracaPercent` (0–100%), nizej.
   */
  onUlepszeniaEmpireFocusChange?: (focus: UlepszeniaFocus) => void;
  onUlepszeniaEmpireTrybChange?: (tryb: UlepszeniaTryb) => void;
  onUlepszeniaEmpireOnlyWorkedChange?: (onlyWorked: boolean) => void;
  /** R4-Q2=C: „wolno wycinać las" dla automatu GRACZA — zakres PAŃSTWO. */
  onUlepszeniaEmpireWyrabChange?: (wolnoWycinacLas: boolean) => void;
  /** Historyczny budżet automatu ulepszeń; zakres 0–100%, osobny od nadrzędnego splitu Pracy. */
  onUlepszeniaEmpirePracaPercentChange?: (pracaAutoPercent: UlepszeniaPracaPercent) => void;
  getUlepszeniaCityOverride?: (cityId: string) => boolean;
  onUlepszeniaCityOverrideChange?: (cityId: string, override: boolean) => void;
  /** Efektywne ustawienia wybranego miasta (empire lub override). */
  getUlepszeniaEffectiveState?: (cityId: string) => {
    focus: UlepszeniaFocus;
    tryb: UlepszeniaTryb;
    onlyWorked: boolean;
    pracaAutoPercent: UlepszeniaPracaPercent;
    /** R4-Q2=C: „wolno wycinać las" — efektywna wartość dla tego miasta. */
    wolnoWycinacLas: boolean;
    override: boolean;
  } | null;
  onUlepszeniaCityFocusChange?: (cityId: string, focus: UlepszeniaFocus) => void;
  onUlepszeniaCityTrybChange?: (cityId: string, tryb: UlepszeniaTryb) => void;
  onUlepszeniaCityOnlyWorkedChange?: (cityId: string, onlyWorked: boolean) => void;
  /** R4-Q2=C: „wolno wycinać las" dla automatu GRACZA — zakres MIASTO. */
  onUlepszeniaCityWyrabChange?: (cityId: string, wolnoWycinacLas: boolean) => void;
  onUlepszeniaCityPracaPercentChange?: (cityId: string, pracaAutoPercent: UlepszeniaPracaPercent) => void;
}

export interface BuildModeHudApi {
  el: HTMLDivElement;
  bannerEl: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-build-mode-hud-css-w2-scroll-reserve-floor-fixedtop';

/**
 * P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1 — pion panelu budowy.
 *
 * Było: `top:90px; max-height:calc(100vh - 180px)`. Dwie zmierzone wady tej pary:
 *
 * 1. `180px` to sztywna liczba mniejsza niż realna wysokość stosu WYKONAJ + ZAKOŃCZ TURĘ
 *    (`turnStackBottomPx()` = 172px od dołu). Dolna krawędź panelu wypadała 90px nad dołem
 *    okna, czyli 75px WEWNĄTRZ prostokąta dolnego paska — w każdym powiększeniu i przy każdej
 *    wysokości okna. Panel ma z-index 311, pasek 310, więc to lista połykała kliknięcie
 *    w przycisk WYKONAJ (pomiar: `elementFromPoint` na środku WYKONAJ trafiał w
 *    `.civ-build-item`).
 * 2. `vh` liczy się ZAWSZE od viewportu, a powiększenie UI gry (`hud.ts::applyUiZoom`) skaluje
 *    <body> transformem — przez co body staje się blokiem zawierającym dla `position:fixed`,
 *    a jego wysokość to `100/z vh`. `calc(100vh - 180px)` dawało więc przy z=1.5 limit 1.5×
 *    większy niż cała dostępna wysokość: pasek przewijania dojeżdżał do końca, a ostatnie
 *    pozycje listy nadal leżały POD dolną krawędzią ekranu (zgłoszenie właściciela: „menu się
 *    nie przesuwa, nie można otworzyć ulepszeń na samym dole").
 *
 * Jest: rezerwa liczona z jednego źródła prawdy (`hudLayout.ts`) i limit w `%`, który — inaczej
 * niż `vh` — liczy się od bloku zawierającego, więc jest poprawny w OBU układach współrzędnych
 * (viewport bez powiększenia UI, przeskalowane <body> z powiększeniem UI). Ten sam wzorzec co
 * `.civ-side-panel` (`sidePanelHud.ts`), łącznie z osobną regułą `html.civ-ui-zoom-active`.
 *
 * RUNDA 2 — PODŁOGA. Sama rezerwa nie wystarczy: rezerwa całkowita to `90 + 184` (`174` przy
 * powiększeniu UI) = 274/264px, więc gdy blok zawierający jest NIŻSZY niż ta rezerwa
 * (przeglądarka 200% × okno 640 → viewport 320px CSS → body przy UI 125% = 256px),
 * `calc(100% - 274px)` schodzi poniżej zera, `max-height` zapada się do ~0 i panel kurczy się
 * do 23–31px — dla gracza praktycznie znika (zmierzone: 5/60 punktów siatki łączonej
 * przeglądarka × UI × wysokość, w tym 2 punkty, w których PRZED naprawą klikało się dobrze).
 *
 * Dlatego podłoga: `max-height: max(52px, calc(...))` — panel nigdy nie jest niższy niż JEDEN
 * pełny wiersz listy z chromem panelu, więc zawsze zostaje przewijalny i klikalny.
 *
 * RUNDA 3 — `top` WRACA DO STAŁEJ WARTOŚCI. Runda 2 sprzęgła podłogę z ruchomym
 * `top: min(90px, max(0px, calc(100% - rezerwa_dolna - 52px)))`: gdy pełny wiersz nie mieścił
 * się pod `top:90px`, panel jechał W GÓRĘ, zamiast wchodzić na stos WYKONAJ/ZAKOŃCZ TURĘ.
 * Cena okazała się wyższa niż zysk: górna granica ruchu schodziła do `0px`, czyli W PAS
 * ZAREZERWOWANY DLA GÓRNEGO PRAWEGO HUD-u. Ten pas ma w kodzie jedno źródło prawdy —
 * `hudLayout.ts::hudRightRailBottomPx()` (= HUD_TOP_PX + max(wiersz chipów, wiersz Civpedia/Menu)
 * = 68px), z którego korzysta też `eventsPanelTopPx()` dla panelu wydarzeń. Zmierzone na siatce
 * 60 punktów Z ZAMONTOWANYM `.hud-right-cluster`: w 8 komórkach panel wchodził w ten pas
 * (górna krawędź 18–66px CSS), a w 13 zasłaniał sobą przyciski Civpedia i Menu — panel budowy
 * ma `z-index:311`, a cały `.civ-hud` (wraz z klastrem) `z-index:310`, więc to PANEL zakrywa
 * HUD, nie odwrotnie. Stałe `top:90px` respektuje ten pas w każdej komórce siatki.
 *
 * ŚWIADOMY KOMPROMIS. W najciaśniejszych kombinacjach (np. przeglądarka 200% × UI 150% × okno
 * 640px → blok zawierający 213px CSS) pas górnego HUD-u + jeden pełny wiersz listy + rezerwa
 * stosu tury po prostu się nie mieszczą naraz. Wybór jest wtedy między „panel nachodzi na stos
 * WYKONAJ/ZAKOŃCZ TURĘ" (jak w stanie zastanym, gdzie było to 60/60) a „lista ulepszeń znika
 * albo zakrywa górny HUD". Wybrane jest nachodzenie: przycisk pod panelem da się odsłonić
 * zamknięciem trybu budowy, listy schowanej pod HUD-em nie da się odzyskać niczym.
 */
const BUILD_PANEL_TOP_PX = 90;
/** Rezerwa od dołu: cały stos WYKONAJ/ZAKOŃCZ TURĘ + ten sam odstęp co panel wydarzeń. */
const BUILD_PANEL_BOTTOM_PX = turnStackBottomPx() + EVENTS_PANEL_ABOVE_TURN_GAP_PX;
const BUILD_PANEL_BOTTOM_ZOOM_PX = turnStackBottomPx(true) + EVENTS_PANEL_ABOVE_TURN_GAP_PX;
/** Wysokość jednego wiersza listy `.civ-build-item`: padding 7+7 + ikona 18 + ramka 1+1
 *  (zmierzone w Chromium: `getBoundingClientRect().height` = 34px dla każdej pozycji). */
const BUILD_ITEM_ROW_H_PX = 7 + 7 + 18 + 1 + 1;
/** Podłoga wysokości panelu = jeden PEŁNY wiersz + padding panelu 8+8 + ramka 1+1 (52px).
 *  Mniej znaczy wiersz przycięty w połowie; więcej niepotrzebnie zjada pas przewijania. */
const BUILD_PANEL_MIN_H_PX = BUILD_ITEM_ROW_H_PX + 8 + 8 + 1 + 1;

const ULEPSZENIA_FOCUS_LABELS: Record<UlepszeniaFocus, string> = {
  zywnosc: 'Żywność',
  surowce: 'Surowce',
  infrastruktura: 'Infra',
  zrownowazone: 'Zrówn.',
};

const ULEPSZENIA_FOCUS_TITLES: Record<UlepszeniaFocus, string> = {
  zywnosc: 'Żywność — farma, hodowla, irygacja',
  surowce: 'Surowce — tartak, kamieniołom, kopalnie',
  infrastruktura: 'Infrastruktura — drogi, fort',
  zrownowazone: 'Zrównoważone — żywność, surowce, infra',
};

const ULEPSZENIA_PROFILES: UlepszeniaFocus[] = [
  'zywnosc', 'surowce', 'infrastruktura', 'zrownowazone',
];

function impIconHtml(key: ImprovementKey | string): string {
  const svg = improvementIconSvg(key, 18);
  return svg ? svg.replace('<svg ', '<svg class="civ-build-imp-ic" ') : '';
}

function ensureStyles(): void {
  // Wzorzec z `bottomBarHud.ts`/`sidePanelHud.ts`: przy zmianie CSS zmienia się STYLE_ID,
  // a poprzedni znacznik jest jawnie usuwany, żeby stary arkusz nie przeżył w dokumencie.
  document.getElementById('civ-build-mode-hud-css')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-build-banner{position:fixed;top:48px;left:50%;transform:translateX(-50%);z-index:312;
  display:none;align-items:center;gap:12px;padding:8px 16px;
  background:rgba(48,32,8,.94);border:1px solid rgba(232,176,74,.55);border-radius:6px;
  font:12px 'Segoe UI',Tahoma,sans-serif;color:#ffe8c0;box-shadow:0 4px 20px rgba(0,0,0,.5);}
.civ-build-banner.open{display:flex;}
.civ-build-banner button{background:rgba(255,255,255,.08);border:1px solid rgba(232,176,74,.4);
  color:#ffe8c0;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px;}
.civ-build-panel{position:fixed;z-index:311;width:270px;right:${HUD_EDGE_PX}px;
  top:${BUILD_PANEL_TOP_PX}px;
  max-height:max(${BUILD_PANEL_MIN_H_PX}px,calc(100% - ${BUILD_PANEL_TOP_PX + BUILD_PANEL_BOTTOM_PX}px));
  overflow-y:auto;display:none;flex-direction:column;gap:4px;padding:8px;
  background:rgba(12,18,35,.94);border:1px solid rgba(232,216,138,.28);border-radius:8px;
  font:12px 'Segoe UI',Tahoma,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.55);}
html.civ-ui-zoom-active .civ-build-panel{right:${HUD_ZOOM_EDGE_PX}px;
  max-height:max(${BUILD_PANEL_MIN_H_PX}px,calc(100% - ${BUILD_PANEL_TOP_PX + BUILD_PANEL_BOTTOM_ZOOM_PX}px));}
.civ-build-panel.open{display:flex;}
.civ-build-panel .lbl{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#7a7055;margin-bottom:4px;}
.civ-build-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:5px;cursor:pointer;
  border:1px solid transparent;color:#d4cba0;transition:background .15s,border-color .15s;}
.civ-build-item:hover{background:rgba(232,216,138,.06);border-color:rgba(232,216,138,.25);}
.civ-build-item.sel{background:rgba(232,216,138,.12);border-color:rgba(232,216,138,.5);color:#f0e8b8;}
.civ-build-item .ic{display:flex;align-items:center;justify-content:center;width:22px;height:18px;flex-shrink:0;color:#e8d88a;}
.civ-build-item .ic svg{display:block;}
.civ-build-info-ic{flex-shrink:0;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:9px;font-weight:800;line-height:1;cursor:pointer;
  background:#141a24;border:1px solid rgba(232,216,138,.55);color:#e8d88a;}
.civ-build-info-ic:hover,.civ-build-info-ic:focus-visible{background:rgba(232,216,138,.24);outline:none;}
.civ-build-item .meta{font-size:9px;color:#7a7055;margin-left:auto;}
.civ-build-item.disabled{opacity:.38;pointer-events:none;filter:grayscale(.85);}
.civ-build-item.locked{opacity:.48;cursor:help;}
.civ-build-item.locked:hover{background:rgba(232,176,74,.08);border-color:rgba(232,176,74,.35);}
.civ-build-item.locked .meta{color:#c9a060;font-size:8px;max-width:95px;text-align:right;line-height:1.2;}
/* box-sizing jawnie w regule (nie tylko z globalnego gwiazdkowego resetu w index.html) —
   showLockTip() liczy pozycję z offsetWidth, więc padding MUSI mieścić się w max-width,
   inaczej tooltip wychodzi 42px szerszy niż wolny pas obok listy i znów ją zasłania.
   max-height + overflow:hidden — twardy limit dla skrajnie długiego lockHintu. */
.civ-build-lock-tip{position:fixed;z-index:320;box-sizing:border-box;max-width:480px;
  max-height:calc(100vh - 16px);overflow:hidden;padding:16px 20px;
  background:rgba(24,16,8,.96);border:1px solid rgba(232,176,74,.5);border-radius:12px;
  font:22px/1.35 'Segoe UI',Tahoma,sans-serif;color:#ffe8c0;pointer-events:none;
  box-shadow:0 8px 32px rgba(0,0,0,.55);display:none;}
.civ-build-wonders-gap{margin-top:10px;padding-top:8px;border-top:1px solid rgba(232,216,138,.22);}
.civ-build-wonders-sub{font-size:9px;color:#9a9070;line-height:1.35;margin:-2px 0 6px 2px;}
.civ-build-item.wonder{border-color:rgba(212,175,95,.12);}
.civ-build-item.wonder:hover{border-color:rgba(212,175,95,.38);}
.civ-build-item.wonder.sel{background:rgba(212,175,95,.14);border-color:rgba(212,175,95,.55);}
.civ-build-item.wonder .ic{color:#e8c878;}
.civ-build-wonders-empty{font-size:10px;color:#7a7055;line-height:1.4;padding:4px 2px 2px;}
.civ-build-auto{margin-top:8px;padding-top:8px;border-top:1px solid rgba(232,216,138,.22);}
.civ-build-auto-city{width:100%;margin:4px 0 6px;padding:5px 8px;background:rgba(0,0,0,.35);
  border:1px solid rgba(232,216,138,.25);border-radius:4px;color:#d4cba0;font-size:11px;cursor:pointer;}
.civ-build-auto-profiles{display:flex;flex-wrap:wrap;gap:3px;margin:4px 0 2px;}
.civ-build-auto-btn{padding:4px 7px;font-size:9px;border:1px solid rgba(232,216,138,.25);
  background:rgba(255,255,255,.04);color:#d4cba0;border-radius:3px;cursor:pointer;font-family:inherit;}
.civ-build-auto-btn:hover{background:rgba(232,216,138,.08);border-color:rgba(232,216,138,.35);}
.civ-build-auto-btn.on{background:rgba(232,216,138,.15);border-color:rgba(232,216,138,.5);color:#f0e8b8;}
.civ-build-auto-btn.reczny{margin-left:2px;}
.civ-build-auto-row{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:10px;color:#9a9070;flex-wrap:wrap;}
.civ-build-auto-row label{display:inline-flex;align-items:center;gap:4px;cursor:pointer;}
.civ-build-auto-city-wrap{margin-top:4px;}
.civ-build-auto-eff{font-size:9px;color:#8a8060;line-height:1.35;margin:4px 0 2px;}
.civ-build-auto-override{font-size:10px;color:#9a9070;margin:4px 0;}
.civ-build-hbtn{background:rgba(232,216,138,.08);border:1px solid rgba(232,216,138,.22);color:#d4cba0;
  font-size:10px;padding:4px 8px;border-radius:4px;cursor:pointer;font-family:inherit;
  display:inline-flex;align-items:center;justify-content:center;min-height:1.75em;}
.civ-build-hbtn:hover{background:rgba(232,216,138,.16);border-color:rgba(232,216,138,.45);}
.civ-build-hbtn.active{background:linear-gradient(180deg,#2a5a28,#1e4020);border-color:#6bbf59;color:#dff5d8;
  box-shadow:0 0 8px rgba(107,191,89,.45);}
/* R-AUTO-PRACA-BUDZET-PROCENT-Q1=B: historyczny suwak 0-100% globalnego
   budżetu automatu, osobny od nadrzędnego splitu puli Pracy. */
.civ-build-percent-row{display:flex;flex-direction:column;gap:3px;margin-top:6px;}
.civ-build-percent-head{display:flex;align-items:baseline;gap:6px;font-size:10px;color:#9a9070;}
.civ-build-percent-head b{font-size:11px;color:#f0e8b8;}
.civ-build-city-split-note{font-size:9px;color:#9a9070;line-height:1.35;margin:4px 0 2px;}
/* R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1: suwak warstwy (c) jest renderowany takze
   przy trybie recznym — wtedy nieaktywny, z krotkim wyjasnieniem pod spodem. */
.civ-build-percent-row.off .civ-build-percent-head{opacity:.55;}
.civ-build-percent-slider:disabled{cursor:not-allowed;opacity:.45;}
.civ-build-percent-note{font-size:9px;color:#9a9070;line-height:1.35;margin-top:2px;}
.civ-build-percent-slider{-webkit-appearance:none;-moz-appearance:none;appearance:none;
  width:100%;height:6px;border-radius:999px;cursor:pointer;margin:0;background:rgba(0,0,0,.35);
  display:block;}
.civ-build-percent-slider::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;
  border-radius:50%;border:2px solid #1a1408;box-shadow:0 1px 4px rgba(0,0,0,.6);cursor:pointer;
  background:#e8d88a;}
.civ-build-percent-slider::-moz-range-thumb{width:13px;height:13px;border-radius:50%;
  border:2px solid #1a1408;box-shadow:0 1px 4px rgba(0,0,0,.6);cursor:pointer;background:#e8d88a;}
.civ-build-percent-slider::-moz-range-track{height:6px;border-radius:999px;background:transparent;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function renderUlepszeniaProfileRow(
  focus: UlepszeniaFocus,
  tryb: UlepszeniaTryb,
  scope: 'empire' | 'city',
): string {
  let html = '<div class="civ-build-auto-profiles">';
  for (const id of ULEPSZENIA_PROFILES) {
    const on = tryb !== 'reczny' && id === focus ? ' on' : '';
    html += `<button type="button" class="civ-build-auto-btn${on}" data-ulepszenia-${scope}-focus="${id}"`
      + ` title="${ULEPSZENIA_FOCUS_TITLES[id]}">${ULEPSZENIA_FOCUS_LABELS[id]}</button>`;
  }
  const recOn = tryb === 'reczny' ? ' on' : '';
  html += `<button type="button" class="civ-build-auto-btn reczny${recOn}" data-ulepszenia-${scope}-reczny`
    + ` title="Ręczny — buduj ulepszenia na mapie (🔨)">Ręczny</button>`;
  html += '</div>';
  return html;
}

/** Tor suwaka wypełniony do `pct` (%) — reszta w kolorze tła (natywny input[type=range]
 *  z -webkit-appearance:none renderuje swoje tło wprost jako tor). */
function ulepszeniaPercentSliderFillStyle(pct: number): string {
  const p = Math.max(0, Math.min(100, pct));
  return `background:linear-gradient(90deg,#8a6a20 0%,#e8d88a ${p}%,rgba(0,0,0,.35) ${p}%,rgba(0,0,0,.35) 100%)`;
}

/**
 * P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1: udział ulepszeń terenu w całej puli Pracy
 * imperium. 0% = całość budżetu pozostaje dostępna dla budynków, 50% = maksymalnie
 * połowa puli może trafić na ulepszenia. To nie jest drugi limit wewnętrznego
 * automatu.
 */
function renderUlepszeniaPercentRow(
  pct: number,
  scope: 'empire' | 'city',
  label: string,
  sliderTitle: string,
  max = 100,
  opts?: { disabled?: boolean; note?: string },
): string {
  const safePct = Math.max(0, Math.min(max, Math.round(pct)));
  const disabled = opts?.disabled === true;
  const note = opts?.note ?? '';
  return `<div class="civ-build-percent-row${disabled ? ' off' : ''}">`
    + '<div class="civ-build-percent-head"><span title="' + sliderTitle.replace(/"/g, '&quot;') + '">'
    + label + '</span><b data-ulepszenia-' + scope + '-percent-label>' + safePct + '%</b></div>'
    + `<input type="range" class="civ-build-percent-slider" min="0" max="${max}" step="1" value="${safePct}" `
    + `style="${ulepszeniaPercentSliderFillStyle(pct)}" data-ulepszenia-${scope}-percent `
    + (disabled ? 'disabled aria-disabled="true" ' : '')
    + `title="${sliderTitle.replace(/"/g, '&quot;')}" />`
    + (note ? `<div class="civ-build-percent-note" data-ulepszenia-${scope}-percent-note>${note}</div>` : '')
    + '</div>';
}

/** Montuje banner + panel wyboru ulepszeń (D1B mockup G2). */
export function createBuildModeHud(config: BuildModeHudConfig): BuildModeHudApi {
  ensureStyles();

  const bannerEl = document.createElement('div');
  bannerEl.className = 'civ-build-banner';
  bannerEl.innerHTML = '<span id="civ-build-banner-text">🔨 TRYB BUDOWY — wybierz ulepszenie, kliknij hex (ESC = wyjście)</span>'
    + '<button type="button" data-exit>✕ Wyjdź</button>';
  bannerEl.querySelector('[data-exit]')?.addEventListener('click', () => config.onExit());

  const el = document.createElement('div');
  el.className = 'civ-build-panel';

  const lockTip = document.createElement('div');
  lockTip.className = 'civ-build-lock-tip';
  document.body.appendChild(lockTip);

  let unbindOutside: (() => void) | null = null;

  function syncOutsideDismiss(): void {
    unbindOutside?.();
    unbindOutside = null;
    if (!config.isOpen()) return;

    const onPointer = (ev: PointerEvent): void => {
      if (!config.isOpen()) return;
      const target = ev.target;
      if (!(target instanceof Node)) return;
      if (el.contains(target) || bannerEl.contains(target)) return;
      // Cały lewy toolbar — przełączenie trybu w jednym kliknięciu (nie dismiss przed click).
      if (target instanceof Element && target.closest('.civ-map-toolbar')) return;
      // Klik w mapę — zawsze obsługuje main.ts (mouseup); nie zamykaj trybu przed założeniem miasta.
      if (target instanceof Element && target.closest('canvas')) return;
      config.onExit();
    };
    document.addEventListener('pointerdown', onPointer, true);
    unbindOutside = () => document.removeEventListener('pointerdown', onPointer, true);
  }

  /**
   * Pozycjonowanie tooltipa blokady — flip/clamp wzorem `techTreeView.ts::showCardFor()`
   * (pomiar `offsetWidth/offsetHeight`, flip przy braku miejsca, clamp do viewportu),
   * rozszerzony o JEDEN dodatkowy warunek wymuszony przez kontekst tego HUD-a:
   * anchorem jest wiersz PRZEWIJANEJ listy `.civ-build-panel`, więc sam clamp do
   * viewportu nie wystarcza — tooltip musi wylądować poza prostokątem CAŁEJ listy,
   * inaczej (stary sztywny `left = r.left - 250`, przy `max-width:480px`) rozlewa się
   * z powrotem na panel i zasłania wiersze pod/nad triggerem.
   * Dlatego kotwicą poziomą jest rect PANELU, nie rect wiersza.
   */
  function showLockTip(text: string, anchor: HTMLElement): void {
    lockTip.textContent = '🔒 ' + text;
    lockTip.style.display = 'block';
    // Reset PRZED pomiarem: dla elementu `position:fixed` szerokość shrink-to-fit jest
    // ograniczona przez `viewport - left`, więc pozostałość po poprzednim hoverze (albo
    // po zmianie rozmiaru okna) zaniża `offsetWidth` i cała arytmetyka niżej liczy się
    // ze złej szerokości — tooltip ląduje wtedy z powrotem na liście.
    lockTip.style.left = '0px';
    lockTip.style.top = '0px';

    const pad = 8;   // margines od krawędzi viewportu
    const gap = 12;  // odstęp tooltip ↔ panel (jak `+12` w techTreeView.ts)
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = anchor.getBoundingClientRect();
    const panel = el.getBoundingClientRect();
    // Panel może być jeszcze niezmierzony (width 0) — wtedy fallback na rect wiersza.
    const listLeft = panel.width > 0 ? panel.left : r.left;
    const listRight = panel.width > 0 ? panel.right : r.right;

    // Szerokość ograniczona do wolnego pasa NA LEWO od listy — gwarantuje, że tooltip
    // fizycznie nie ma jak nachodzić na wiersze (bazowe 480px z CSS jako górny limit).
    const spaceLeft = listLeft - gap - pad;
    const spaceRight = vw - listRight - gap - pad;
    const useLeftSide = spaceLeft >= spaceRight;
    const avail = Math.max(160, Math.floor(useLeftSide ? spaceLeft : spaceRight));
    lockTip.style.maxWidth = Math.min(480, avail) + 'px';

    const tw = lockTip.offsetWidth;
    const th = lockTip.offsetHeight;

    // Poziomo: domyślnie na lewo od całej listy, flip na prawo gdy tam ciasno.
    let x = useLeftSide ? listLeft - tw - gap : listRight + gap;
    if (x + tw > vw - pad) x = vw - tw - pad;
    if (x < pad) x = pad;

    // Pionowo: start przy wierszu-triggerze, clamp do dołu i góry viewportu.
    let y = r.top;
    if (y + th > vh - pad) y = vh - th - pad;
    if (y < pad) y = pad;

    lockTip.style.left = x + 'px';
    lockTip.style.top = y + 'px';
  }
  function hideLockTip(): void {
    lockTip.style.display = 'none';
  }

  function render(): void {
    const open = config.isOpen();
    bannerEl.classList.toggle('open', open);
    el.classList.toggle('open', open);
    if (!open) {
      syncOutsideDismiss();
      return;
    }

    const active = config.getActiveKey();
    const activeWonder = config.getActiveWonderId?.() ?? null;
    const foundCityOnly = config.isFoundCityOnly?.() ?? false;
    const types = foundCityOnly
      ? []
      : config.listTypes().filter(t => t.key !== 'pole_irygowane');
    const showFound = config.canFoundCity?.() ?? false;
    const foundActive = config.isFoundCityActive?.() ?? false;
    const bannerText = bannerEl.querySelector('#civ-build-banner-text');
    if (bannerText) {
      bannerText.textContent = foundActive
        ? '🏛️ ZAŁÓŻ MIASTO — kliknij podświetlony hex (ESC = wyjście)'
        : activeWonder
          ? '🏛️ CUD ŚWIATA — kliknij hex w terytorium (ESC = wyjście)'
          : foundCityOnly
            ? '🏛️ ZAŁÓŻ PIERWSZE MIASTO — wybierz «Załóż miasto» w panelu'
            : active
              ? '🔨 TRYB BUDOWY — wybierz ulepszenie, kliknij hex (ESC = wyjście)'
              : '🔨 TRYB BUDOWY — wybierz ulepszenie lub cud, kliknij hex (ESC = wyjście)';
    }
    let html = '';
    if (showFound) {
      const fcLabel = config.getFoundCityCostLabel?.() ?? '';
      const fcHint = config.getFoundCityLockHint?.() ?? null;
      html += '<div class="lbl">Miasto</div>';
      html += '<div class="civ-build-item' + (foundActive ? ' sel' : '') + (fcHint ? ' locked' : '') + '" data-found-city="1"'
        + (fcHint ? ' data-lock-hint="' + fcHint.replace(/"/g, '&quot;') + '"' : '')
        + ' title="' + (fcHint ? fcHint : 'Załóż nowe miasto') + '">'
        + '<span class="ic">🏛️</span><span>Załóż miasto</span>'
        + (fcLabel ? '<span class="meta">' + fcLabel + '</span>' : '')
        + '</div>';
    }
    if (!foundCityOnly) {
      const wonders = config.listWonders?.() ?? [];
      const wonderTarget = config.getWonderTargetLabel?.() ?? null;
      if (wonders.length > 0) {
        html += '<div class="civ-build-wonders-gap"></div>';
        html += '<div class="lbl">Cuda świata</div>';
        if (wonderTarget) {
          html += '<div class="civ-build-wonders-sub">' + wonderTarget + '</div>';
        }
        for (const w of wonders) {
          const locked = w.building === true;
          const sel = w.id === activeWonder ? ' sel' : '';
          const hint = w.lockHint ?? (locked ? 'Już w budowie na mapie' : null);
          const tag = w.dostep === 'R' ? ' · wyścig' : '';
          const costLabel = w.kosztPraca + ' P';
          html += '<div class="civ-build-item wonder' + sel + (locked ? ' locked' : '') + '" data-wonder-id="' + w.id + '"'
            + (locked && hint ? ' data-lock-hint="' + hint.replace(/"/g, '&quot;') + '"' : '')
            + ' title="' + (locked && hint ? hint : (w.label + ' — epoka ' + w.epokaWejscia)) + '">'
            + '<span class="ic">🏛</span>'
            + '<span>' + w.label + '</span>'
            + '<span class="meta">' + (locked && hint ? hint : ('E' + w.epokaWejscia + ' · ' + costLabel + tag)) + '</span></div>';
        }
      }
      const playerCities = config.listPlayerCities?.() ?? [];
      const uCityId = config.getUlepszeniaCityId?.() ?? null;
      const empireState = config.getUlepszeniaEmpireState?.() ?? null;
      const effState = uCityId ? config.getUlepszeniaEffectiveState?.(uCityId) ?? null : null;
      const cityOverride = uCityId ? (config.getUlepszeniaCityOverride?.(uCityId) ?? false) : false;
      if (playerCities.length > 0 && empireState) {
        html += '<div class="civ-build-auto">';
        html += '<div class="lbl">Automatyzacja ulepszeń terenu</div>';
        html += renderUlepszeniaProfileRow(
          empireState.focus,
          empireState.tryb,
          'empire',
        );
        if (empireState.tryb === 'auto') {
          const onE = empireState.onlyWorked ? ' active' : '';
          html += '<div class="civ-build-auto-row">';
          html += `<button type="button" class="civ-build-hbtn${onE}" data-ulepszenia-empire-only-worked`
            + ` aria-pressed="${empireState.onlyWorked ? 'true' : 'false'}"`
            + ` title="Buduj tylko na polach z obywatelami (👤); złoża surowców są wyjątkiem">Tylko pola z obywatelami</button>`;
          html += '</div>';
          // R4-Q2=C (R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, runda 4): przełącznik wyrębu dla
          // automatu GRACZA, zakres PAŃSTWO. Domyślnie WYŁĄCZONY.
          const onW = empireState.wolnoWycinacLas ? ' active' : '';
          html += '<div class="civ-build-auto-row">';
          html += `<button type="button" class="civ-build-hbtn${onW}" data-ulepszenia-empire-wyrab`
            + ` aria-pressed="${empireState.wolnoWycinacLas ? 'true' : 'false'}"`
            + ` title="Pozwól automatowi wycinać las (wyrąb pod farmę przy rzece). Domyślnie wyłączone.">`
            + `Wolno wycinać las</button>`;
          html += '</div>';
        }
        // R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1 (pkt 2): suwak warstwy (c)
        // (`UlepszeniaEmpirePolicy.pracaAutoPercent`) renderuje sie TAKZE przy
        // `tryb === 'reczny'` — wtedy `disabled`, z wyjasnieniem. Wczesniej byl schowany
        // pod `tryb === 'auto'`, a domyslnym trybem nowej gry jest 'reczny', wiec gracz
        // w tym panelu nie widzial wlasciwej warstwy wcale.
        {
          const trybAuto = empireState.tryb === 'auto';
          html += renderUlepszeniaPercentRow(
            empireState.pracaAutoPercent,
            'empire',
            'Z puli imperium na pracę automatyczną:',
            `Ile ze skumulowanej puli Pracy imperium może w jednej turze wydać automat ulepszeń terenu; `
              + `reszta puli zostaje na prace ręczne (ulepszenia stawiane 🔨, cuda na mapie, zakładanie miast). `
              + `Zakres 0–${MAX_ULEPSZENIA_PRACA_AUTO_PERCENT}% (P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1: własny, `
              + `niezależny zakres tego pola — NIE respektuje capu ${MAX_PROCENT_PULI_IMPERIUM}% podziału Pracy `
              + `między budynki a pulę imperium, który ustawia się w panelu imperium i w panelu miasta). `
              + `To NIE jest ten podział — to tempo wydawania samego automatu.`,
            MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
            {
              disabled: !trybAuto,
              note: trybAuto
                ? ''
                : 'Tryb ręczny — cała pula zostaje na pracę ręczną. Suwak zadziała po włączeniu automatyzacji (profil powyżej).',
            },
          );
        }
        if (playerCities.length > 1) {
          html += '<div class="civ-build-auto-city-wrap">';
          html += '<select class="civ-build-auto-city" data-ulepszenia-city>';
          for (const c of playerCities) {
            const sel = c.id === uCityId ? ' selected' : '';
            html += `<option value="${c.id.replace(/"/g, '&quot;')}"${sel}>${c.name}</option>`;
          }
          html += '</select></div>';
        } else if (playerCities.length === 1) {
          const sole = playerCities[0];
          if (sole) html += `<div class="civ-build-wonders-sub">${sole.name}</div>`;
        }
        if (effState) {
          const effLabel = effState.tryb === 'reczny'
            ? 'Ręczny'
            : `${ULEPSZENIA_FOCUS_LABELS[effState.focus]} · ${effState.pracaAutoPercent}% Pracy`
              + (effState.onlyWorked ? ' · tylko 👤' : '');
          html += `<div class="civ-build-auto-eff">Efekt w mieście: ${effLabel}`
            + (effState.override ? ' (własne)' : ' (państwo)') + '</div>';
        }
        const onOv = cityOverride ? ' active' : '';
        html += `<div class="civ-build-auto-override">`
          + `<button type="button" class="civ-build-hbtn${onOv}" data-ulepszenia-city-override`
          + ` aria-pressed="${cityOverride ? 'true' : 'false'}">Własne ustawienia tego miasta</button>`
          + '</div>';
        if (cityOverride && uCityId && effState) {
          html += '<div class="lbl">Ustawienia miasta — lokalny split</div>';
          html += '<div class="civ-build-city-split-note">'
            + 'Lokalny suwak dotyczy tylko wybranego miasta i nie zmienia globalnego podziału całej puli Pracy imperium.'
            + '</div>';
          html += renderUlepszeniaProfileRow(
            effState.focus,
            effState.tryb,
            'city',
          );
          if (effState.tryb === 'auto') {
            const onC = effState.onlyWorked ? ' active' : '';
            html += '<div class="civ-build-auto-row">';
            html += `<button type="button" class="civ-build-hbtn${onC}" data-ulepszenia-city-only-worked`
              + ` aria-pressed="${effState.onlyWorked ? 'true' : 'false'}">Tylko pola z obywatelami</button>`;
            html += '</div>';
            // R4-Q2=C: ten sam przełącznik w zakresie MIASTA (override lokalny).
            const onWC = effState.wolnoWycinacLas ? ' active' : '';
            html += '<div class="civ-build-auto-row">';
            html += `<button type="button" class="civ-build-hbtn${onWC}" data-ulepszenia-city-wyrab`
              + ` aria-pressed="${effState.wolnoWycinacLas ? 'true' : 'false'}">Wolno wycinać las</button>`;
            html += '</div>';
          }
          // R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1 (pkt 2): ten sam wzorzec co wyzej,
          // dla lokalnego pola warstwy (c) `City.ulepszeniaPracaPercent`.
          {
            const trybAutoC = effState.tryb === 'auto';
            html += renderUlepszeniaPercentRow(
              effState.pracaAutoPercent,
              'city',
              'Z puli imperium na automat tego miasta:',
              `Lokalny limit tego miasta na wydatek automatu ulepszeń terenu ze skumulowanej puli Pracy `
                + `imperium; reszta zostaje na prace ręczne. Zakres 0–${MAX_ULEPSZENIA_PRACA_AUTO_PERCENT}% `
                + `(P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1: własny, niezależny zakres tego pola, także w trybie `
                + `„Indywidualne"). To NIE jest podział Pracy między budynki a pulę imperium.`,
              MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
              {
                disabled: !trybAutoC,
                note: trybAutoC
                  ? ''
                  : 'Ręczny w tym mieście — suwak zadziała po wybraniu profilu automatu powyżej.',
              },
            );
          }
        }
        html += '</div>';
      }
      html += '<div class="lbl">Ulepszenia terenu</div>';
    }
    const pracaPool = config.getPracaPool?.() ?? Infinity;
    for (const t of types) {
      const techLocked = t.techUnlocked === false;
      // Za mało Pracy: ten sam wzorzec wizualny co tech-lock (wyszarzenie + tooltip na hover +
      // klik blokowany), żeby gracz widział brak dostępności PRZED klikiem w hex, nie po nim.
      // / EN: not enough Work: same visual pattern as tech-lock (grayed out + hover tooltip +
      // blocked click), so the player sees unavailability BEFORE clicking a hex, not after.
      const insufficientPraca = !techLocked && t.kosztPraca > pracaPool;
      const locked = techLocked || insufficientPraca;
      const sel = t.key === active ? ' sel' : '';
      const ic = impIconHtml(t.key);
      const costLabel = t.kosztPraca <= 0 ? 'FREE' : t.kosztPraca + ' P';
      const hint = techLocked
        ? (t.lockHint ?? (t.techLabel ? 'Technologia: «' + t.techLabel + '»' : 'Zablokowane'))
        : insufficientPraca
          ? `Za mało Pracy: potrzeba ${t.kosztPraca} P, masz ${Math.floor(pracaPool)} P`
          : '';
      const techHint = locked ? ' · 🔒' : '';
      const hintTechIc = (locked && t.techLabel) ? (techIconSvg(t.techLabel, 12) ?? '') : '';
      const hintTechIcWrap = hintTechIc
        ? '<span style="display:inline-flex;width:12px;height:12px;vertical-align:-2px;margin-right:3px">' + hintTechIc + '</span>'
        : '';
      html += '<div class="civ-build-item' + sel + (locked ? ' locked' : '') + '" data-key="' + t.key + '"'
        + (locked && hint ? ' data-lock-hint="' + hint.replace(/"/g, '&quot;') + '"' : '')
        + ' title="' + (locked && hint ? hint : t.label) + '">'
        + '<span class="ic">' + ic + '</span>'
        + '<span>' + t.label + '</span>'
        // Etykieta kosztu: SAM koszt („40 P" / „FREE"), bez prefiksu ery „E{epoka} · "
        // (P-ULEPSZENIA-INFO-IKONA-POZYCJA-ETYKIETA-KOSZTU-Q1). Gałąź `locked` (ikonka
        // technologii + lockHint) bez zmian. `.meta` ma `margin-left:auto` — to ona spycha
        // resztę wiersza na prawą krawędź.
        + '<span class="meta">' + (locked && hint ? (hintTechIcWrap + hint) : (costLabel + techHint)) + '</span>'
        // Osobna, zawsze widoczna ikonka info — niezależna strefa klikalna od wyboru typu
        // budowy (T7b KARTA-ULEPSZENIA-TERENU): klik reszty wiersza (wybór typu) bez zmian,
        // klik TEJ ikonki otwiera kartę encji ulepszenia, z własnym stopPropagation (wzorem
        // `.ttv-info-ic` w techTreeView.ts, R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 faza 1).
        // POZYCJA: na SAMYM KOŃCU wiersza, za etykietą kosztu — zgłoszenie właściciela
        // (P-ULEPSZENIA-INFO-IKONA-POZYCJA-ETYKIETA-KOSZTU-Q1): tuż po nazwie ikonka leżała
        // w zasięgu naturalnego kliku w nazwę ulepszenia i łapała przypadkowe trafienia.
        + '<span class="civ-build-info-ic" role="button" tabindex="0" title="Podgląd karty ulepszenia"'
        + ' aria-label="Podgląd karty: ' + t.label + '">ⓘ</span></div>';
    }

    el.innerHTML = html;

    el.querySelector('[data-found-city]')?.addEventListener('click', () => {
      const fcHint = config.getFoundCityLockHint?.() ?? null;
      if (fcHint) {
        flashBanner('🔒 ' + fcHint);
        return;
      }
      config.onSelectFoundCity?.();
      render();
    });

    el.querySelectorAll('.civ-build-item[data-key]').forEach(item => {
      const elItem = item as HTMLElement;
      const hint = elItem.getAttribute('data-lock-hint');
      if (hint) {
        elItem.addEventListener('mouseenter', () => showLockTip(hint, elItem));
        elItem.addEventListener('mouseleave', hideLockTip);
      }
      elItem.addEventListener('click', () => {
        const key = elItem.getAttribute('data-key') as ImprovementKey;
        if (elItem.classList.contains('locked')) {
          if (hint) flashBanner('🔒 ' + hint);
          return;
        }
        config.onSelectType(key === active ? null : key);
        render();
      });
      // Ikonka info: strefa klikalna NIEZALEŻNA od wyboru typu budowy — `stopPropagation`
      // uniemożliwia dotarciu kliku do listenera wiersza wyżej (wybór typu bez zmian,
      // T7b KARTA-ULEPSZENIA-TERENU). Działa nawet gdy wiersz jest `locked` — podgląd karty
      // encji nie jest akcją budowy, więc nie podlega blokadzie technologii/Pracy.
      const infoIc = elItem.querySelector<HTMLElement>('.civ-build-info-ic');
      infoIc?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const key = elItem.getAttribute('data-key') as ImprovementKey | null;
        if (key) openEntityCard('improvement', key, { mode: 'dialog' });
      });
      infoIc?.addEventListener('keydown', (ev) => {
        const key = (ev as KeyboardEvent).key;
        if (key !== 'Enter' && key !== ' ') return;
        ev.stopPropagation();
        ev.preventDefault();
        const impKey = elItem.getAttribute('data-key') as ImprovementKey | null;
        if (impKey) openEntityCard('improvement', impKey, { mode: 'dialog' });
      });
    });

    el.querySelectorAll('[data-found-city][data-lock-hint]').forEach(item => {
      const elItem = item as HTMLElement;
      const hint = elItem.getAttribute('data-lock-hint');
      if (!hint) return;
      elItem.addEventListener('mouseenter', () => showLockTip(hint, elItem));
      elItem.addEventListener('mouseleave', hideLockTip);
    });

    el.querySelectorAll('.civ-build-item[data-wonder-id]').forEach(item => {
      const elItem = item as HTMLElement;
      const hint = elItem.getAttribute('data-lock-hint');
      if (hint) {
        elItem.addEventListener('mouseenter', () => showLockTip(hint, elItem));
        elItem.addEventListener('mouseleave', hideLockTip);
      }
      elItem.addEventListener('click', () => {
        if (elItem.classList.contains('locked')) {
          if (hint) flashBanner('🔒 ' + hint);
          return;
        }
        const id = elItem.getAttribute('data-wonder-id');
        if (id) {
          const togglingOff = id === activeWonder;
          config.onSelectWonder?.(togglingOff ? '' : id);
        }
        render();
      });
    });

    el.querySelectorAll('[data-ulepszenia-empire-focus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const focus = (btn as HTMLElement).getAttribute('data-ulepszenia-empire-focus') as UlepszeniaFocus;
        if (focus) config.onUlepszeniaEmpireFocusChange?.(focus);
        render();
      });
    });

    el.querySelector('[data-ulepszenia-empire-reczny]')?.addEventListener('click', () => {
      config.onUlepszeniaEmpireTrybChange?.('reczny');
      render();
    });

    const empireOnlyWorkedBtn = el.querySelector('[data-ulepszenia-empire-only-worked]') as HTMLButtonElement | null;
    empireOnlyWorkedBtn?.addEventListener('click', () => {
      const current = config.getUlepszeniaEmpireState?.()?.onlyWorked ?? false;
      config.onUlepszeniaEmpireOnlyWorkedChange?.(!current);
      render();
    });

    // R4-Q2=C: przełącznik wyrębu automatu GRACZA — zakres PAŃSTWO.
    const empireWyrabBtn = el.querySelector('[data-ulepszenia-empire-wyrab]') as HTMLButtonElement | null;
    empireWyrabBtn?.addEventListener('click', () => {
      const current = config.getUlepszeniaEmpireState?.()?.wolnoWycinacLas ?? false;
      config.onUlepszeniaEmpireWyrabChange?.(!current);
      render();
    });

    // R-AUTO-PRACA-BUDZET-PROCENT-Q1=B: `input` = tylko lokalny podgląd (etykieta + wypełnienie
    // toru) BEZ pełnego render() -- wzorzec `wireSkarbiecTaxSplitInputs` w empireDetailPanel.ts,
    // żeby przebudowa innerHTML w trakcie przeciągania nie przerywała gestu. `change` (puszczenie
    // suwaka) commituje wartość do stanu gry i dopiero wtedy robi pełny render().
    const empirePercentInput = el.querySelector('[data-ulepszenia-empire-percent]') as HTMLInputElement | null;
    empirePercentInput?.addEventListener('input', () => {
      const pct = Math.max(0, Math.min(100, Math.round(Number(empirePercentInput.value))));
      empirePercentInput.style.background = ulepszeniaPercentSliderFillStyle(pct);
      const label = el.querySelector('[data-ulepszenia-empire-percent-label]');
      if (label) label.textContent = `${pct}%`;
    });
    empirePercentInput?.addEventListener('change', () => {
      const pct = Math.max(0, Math.min(100, Math.round(Number(empirePercentInput.value))));
      config.onUlepszeniaEmpirePracaPercentChange?.(pct);
      render();
    });

    el.querySelectorAll('[data-ulepszenia-city-focus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cityId = config.getUlepszeniaCityId?.();
        const focus = (btn as HTMLElement).getAttribute('data-ulepszenia-city-focus') as UlepszeniaFocus;
        if (cityId && focus) config.onUlepszeniaCityFocusChange?.(cityId, focus);
        render();
      });
    });

    el.querySelector('[data-ulepszenia-city-reczny]')?.addEventListener('click', () => {
      const cityId = config.getUlepszeniaCityId?.();
      if (cityId) config.onUlepszeniaCityTrybChange?.(cityId, 'reczny');
      render();
    });

    const cityOnlyWorkedBtn = el.querySelector('[data-ulepszenia-city-only-worked]') as HTMLButtonElement | null;
    cityOnlyWorkedBtn?.addEventListener('click', () => {
      const cityId = config.getUlepszeniaCityId?.();
      if (cityId) {
        const current = config.getUlepszeniaEffectiveState?.(cityId)?.onlyWorked ?? false;
        config.onUlepszeniaCityOnlyWorkedChange?.(cityId, !current);
      }
      render();
    });

    // R4-Q2=C: przełącznik wyrębu automatu GRACZA — zakres MIASTO.
    const cityWyrabBtn = el.querySelector('[data-ulepszenia-city-wyrab]') as HTMLButtonElement | null;
    cityWyrabBtn?.addEventListener('click', () => {
      const cityId = config.getUlepszeniaCityId?.();
      if (cityId) {
        const current = config.getUlepszeniaEffectiveState?.(cityId)?.wolnoWycinacLas ?? false;
        config.onUlepszeniaCityWyrabChange?.(cityId, !current);
      }
      render();
    });

    const cityPercentInput = el.querySelector('[data-ulepszenia-city-percent]') as HTMLInputElement | null;
    cityPercentInput?.addEventListener('input', () => {
      const pct = Math.max(0, Math.min(100, Math.round(Number(cityPercentInput.value))));
      cityPercentInput.style.background = ulepszeniaPercentSliderFillStyle(pct);
      const label = el.querySelector('[data-ulepszenia-city-percent-label]');
      if (label) label.textContent = `${pct}%`;
    });
    cityPercentInput?.addEventListener('change', () => {
      const cityId = config.getUlepszeniaCityId?.();
      const pct = Math.max(0, Math.min(100, Math.round(Number(cityPercentInput.value))));
      if (cityId) config.onUlepszeniaCityPracaPercentChange?.(cityId, pct);
      render();
    });

    const overrideBtn = el.querySelector('[data-ulepszenia-city-override]') as HTMLButtonElement | null;
    overrideBtn?.addEventListener('click', () => {
      const cityId = config.getUlepszeniaCityId?.();
      if (cityId) {
        const current = config.getUlepszeniaCityOverride?.(cityId) ?? false;
        config.onUlepszeniaCityOverrideChange?.(cityId, !current);
      }
      render();
    });

    const citySel = el.querySelector('[data-ulepszenia-city]') as HTMLSelectElement | null;
    citySel?.addEventListener('change', () => {
      const id = citySel.value;
      if (id) config.onUlepszeniaCityIdChange?.(id);
      render();
    });

    syncOutsideDismiss();
  }

  function flashBanner(msg: string): void {
    const bannerText = bannerEl.querySelector('#civ-build-banner-text');
    if (!bannerText) return;
    const prev = bannerText.textContent ?? '';
    bannerText.textContent = msg;
    setTimeout(() => { bannerText.textContent = prev; }, 3500);
  }

  document.body.appendChild(bannerEl);
  document.body.appendChild(el);
  render();

  return {
    el,
    bannerEl,
    update: render,
    destroy: () => {
      unbindOutside?.();
      unbindOutside = null;
      hideLockTip();
      lockTip.remove();
      bannerEl.remove();
      el.remove();
    },
  };
}
