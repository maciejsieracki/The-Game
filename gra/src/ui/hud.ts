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
import {
  createSidePanelHud,
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
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import { chip6cHtml, chip6cSep } from './hudChip6c';
import { createLeaderBannersHud, type LeaderBannersHudApi } from './leaderBannersHud';
import { createContextPanelHud, type ContextPanelHudApi } from './contextPanelHud';
import {
  showCultureOverlay, showReligionOverlay, hideEmpireOverlay,
  type CultureOverlayData, type ReligionOverlayData,
} from './empireOverlayHud';
import { empireSectionFromHudAct } from './empireDetailPanel';

export type { PowerOverlayData, CultureOverlayData, ReligionOverlayData };

/** Wojna z graczem — minimalny wpis na HUD mapy (A1-Q5). */
export interface WarWithPlayer {
  civName: string;
  civId?: string;
}

export interface HudState {
  zloto: number;
  zlotoRate: number;
  praca: number;
  pracaRate: number;
  /** B5 — zapasy państwa (wojsko), nie magazyn miasta. */
  zywnoscLabel: string;
  /** B5-SP — max zapasów (100 × Spichlerze); 0 = brak magazynu armii. */
  zywnoscMax?: number;
  zywnoscRate?: number;
  /** true → czerwony alert głodu wojska na HUD mapy. */
  glodWojska?: boolean;
  nauka: number;
  naukaRate?: number;
  kultura: number;
  kulturaRate?: number;
  bogactwo: number;
  bogactwoRate?: number;
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

  /** D17=A: treść panelu kontekstowego (null = ukryty). */
  getContextPanelMessage?: () => string | null;

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
let warStripEl: HTMLDivElement | null = null;
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
/** HUD zamontowany przez showHud (nie mylić z chwilowym ukryciem w panelu miasta). */
let hudSessionActive = false;
let barActionsBound = false;

const useD1BLayout = (): boolean => cfg?.onExecutePending !== undefined || cfg?.mapToolbar !== undefined;

const MINI_W = 280;
const MINI_H = 170;

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-hud-css-w2banners';
function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-hud-css')?.remove();
  document.getElementById('civ-hud-css-w2')?.remove();
  document.getElementById('civ-hud-css-w2b')?.remove();
  document.getElementById('civ-hud-css-w2full')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
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
.civ-hud .civ-hud-chip-med.science{background:radial-gradient(circle at 35% 30%,#8fb6e0,#3a5f8a);border:1px solid #26456a;color:#0e2038;}
.civ-hud .civ-hud-chip-med.science .civ-science-owl-ic{width:17px;height:17px;color:#0a1628;}
.civ-hud .civ-hud-chip-med svg{width:17px;height:17px;display:block;}
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
.civ-hud.is-city-view .hud-right-cluster{top:10px;right:14px;z-index:5;}
.civ-mini{position:fixed;left:20px;bottom:20px;width:${MINI_W}px;height:${MINI_H}px;z-index:309;display:none;}
.civ-war-strip{pointer-events:auto;position:fixed;top:46px;left:0;right:0;z-index:309;display:flex;flex-wrap:wrap;gap:6px;align-items:center;
  padding:3px 12px;background:rgba(48,12,12,0.92);border-bottom:1px solid rgba(211,55,55,0.55);
  font:12px var(--civ-font-ui);color:#ffd0cc;}
.civ-war-strip .lbl{font-size:0.68em;text-transform:uppercase;letter-spacing:.06em;color:#ff9999;margin-right:4px;}
.civ-war-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;cursor:pointer;
  background:rgba(120,20,20,0.85);border:1px solid rgba(255,80,80,0.7);color:#ffe0e0;font-weight:600;}
.civ-war-chip:hover{background:rgba(160,30,30,0.95);}
.civ-mini-placeholder{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#9aa6b6;font:11px monospace;text-align:center;}
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

function signed(n: number): string { return (n > 0 ? '+' : '') + String(n); }

function formatFoodHudLabel(s: HudState): string {
  const max = s.zywnoscMax;
  if (max != null && max > 0) return `${s.zywnoscLabel} / ${max}`;
  return s.zywnoscLabel;
}

function hudIc(id: IconId): string {
  return iconHtml(id, 24) || '';
}

/** Medalion Mocy — znak cywilizacji gracza (fallback: res-influence). */
function powerCenterIconHtml(s: HudState): string {
  const civId = s.civIconId ?? 'grecy';
  const civSvg = civIconSvg(civId, 28);
  const border = s.civKolorHex ? ` style="border-color:${s.civKolorHex}"` : '';
  if (civSvg) {
    return `<span class="p-ic p-ic-civ"${border} aria-hidden="true">${civSvg}</span>`;
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
  if (svg) return `<span class="p-power-ic" aria-hidden="true" title="Moc imperium">${svg}</span>`;
  return '<span class="p-power-ic p-power-fleur" aria-hidden="true" title="Moc imperium">⚜</span>';
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
      title: 'Skarbiec — kliknij po szczegóły',
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-work',
      label: 'Praca',
      value: String(s.praca),
      rate: signed(s.pracaRate),
      rateWarn: s.pracaRate < 0,
      act: 'praca',
      title: 'Praca — kliknij po szczegóły',
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-science',
      label: 'Nauka',
      value: String(Math.floor(s.nauka)),
      rate: signed(s.naukaRate ?? 0),
      medVariant: 'science',
      valClass: ' science',
      act: 'nauka',
      title: 'Nauka — kliknij po podsumowanie imperium',
    }),
  ];
  const rightChips: string[] = [
    chip6cHtml({
      iconId: 'res-food',
      label: 'Zaopatrzenie',
      value: formatFoodHudLabel(s),
      rate: signed(s.zywnoscRate ?? 0),
      rateWarn: !!(s.glodWojska || (s.zywnoscRate ?? 0) < 0),
      act: 'zywnosc',
      title: 'Zaopatrzenie armii (Supply) — całe państwo — klik po szczegóły',
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-population',
      label: 'Ludność',
      value: String(s.ludnosc),
      rate: signed(s.ludnoscRate ?? 0),
      act: 'ludnosc',
      title: 'Ludność imperium — klik po szczegóły',
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-culture',
      label: 'Kultura',
      value: signed(s.kultura),
      rate: signed(s.kulturaRate ?? 0),
      act: 'kultura',
      title: 'Kultura — kliknij po szczegóły imperium',
    }),
    chip6cSep(),
    chip6cHtml({
      iconId: 'res-religion',
      label: 'Religia',
      value: String(Math.round(s.religionStock ?? 0)),
      rate: signed(s.religionRate ?? 0),
      act: 'religia',
      title: 'Religia państwa — klik po szczegóły imperium',
    }),
  ];

  const rekrLabel = s.rekruciLabel ?? '—';

  let html = '<div class="civ-hud-banner-shell civ-hud-banner-left"><div class="hud-chip-row">'
    + leftChips.join('') + '</div></div>';

  html += '<div class="power-center" data-act="power" title="Klik — składniki Mocy imperium">'
    + '<div class="p-epoch">' + escHtml(s.epoka) + '</div>'
    + '<div class="p-row">'
    + `<span class="p-side p-side-left" data-act="rekruci" title="Rekruci (pula werbu) — klik po szczegóły">`
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
  const wikiBtn = cfg?.onOpenWiki
    ? '<button type="button" class="b-wiki' + (wikiOn ? ' on' : '') + '" data-act="wiki" title="Wikipedia — poradnik i encyklopedia">'
      + wikiBookIcon(16)
      + '<span>Wiki</span></button>'
    : '';
  html += '<div class="hud-right-cluster">'
    + '<div class="civ-hud-banner-shell civ-hud-banner-right"><div class="hud-chip-row">'
    + rightChips.join('') + '</div></div>'
    + '<div class="hud-right">'
    + wikiBtn
    + '<button type="button" class="b-menu" data-act="menu">'
    + (menuIc || '') + '<span>Menu</span></button>'
    + '</div></div>';
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
  else if (act === 'power') {
    hideEmpireOverlay();
    hidePowerOverlay();
    if (cfg.onOpenEmpireDetail) cfg.onOpenEmpireDetail(empireSectionFromHudAct('moc'));
    else {
      const data = cfg.getPowerOverlay?.();
      if (data) showPowerOverlay(data);
    }
  } else if (act === 'religia' || act === 'kultura' || act === 'skarbiec' || act === 'praca' || act === 'nauka'
    || act === 'ludnosc' || act === 'rekruci' || act === 'zywnosc') {
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

/** A1-Q5: minimalny pasek — tylko wrogowie prowadzący wojnę z graczem. */
function renderWarStrip(): void {
  if (cfg === null) return;
  if (warStripEl === null) {
    warStripEl = document.createElement('div');
    warStripEl.className = 'civ-war-strip';
    document.body.appendChild(warStripEl);
  }
  const wars = cfg.getWarsWithPlayer?.() ?? [];
  if (wars.length === 0) {
    warStripEl.style.display = 'none';
    return;
  }
  warStripEl.style.display = 'flex';
  let html = '<span class="lbl">Wojna z:</span>';
  for (const w of wars) {
    html += '<button type="button" class="civ-war-chip" data-civ="' + escAttr(w.civName) + '">'
      + '<span class="swords">\u2694\uFE0F</span><span>' + escHtml(w.civName) + '</span></button>';
  }
  warStripEl.innerHTML = html;
  warStripEl.querySelectorAll('.civ-war-chip').forEach(btn => {
    btn.addEventListener('click', () => { cfg?.onOpenDiplomacy?.(); });
  });
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s: string): string {
  return escHtml(s).replace(/"/g, '&quot;');
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
    getHexContext: () => cfg?.getContextPanelMessage?.() ?? null,
    onEventClick: cfg.onEventClick,
    onEventDismiss: cfg.onEventDismiss,
  });
  document.body.appendChild(sidePanelApi.el);
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
  });
}

function mountBuildMode(): void {
  if (cfg === null || buildModeApi !== null || cfg.buildMode === undefined) return;
  buildModeApi = createBuildModeHud(cfg.buildMode);
}

function mountArmyStack(): void {
  if (cfg === null || armyStackApi !== null || cfg.armyStack === undefined) return;
  armyStackApi = createArmyStackHud(cfg.armyStack);
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
  if (warStripEl !== null) warStripEl.style.display = showMapChrome ? '' : 'none';
  if (minimapApi !== null) minimapApi.el.style.display = showMapChrome ? 'flex' : 'none';
  if (sidePanelApi !== null) sidePanelApi.el.style.display = showMapChrome ? 'flex' : 'none';
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
  renderWarStrip();
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
  renderWarStrip();
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
  if (warStripEl !== null) warStripEl.style.display = 'none';
  if (miniEl !== null) miniEl.style.display = 'none';
  if (minimapApi !== null) minimapApi.el.style.display = 'none';
  if (sidePanelApi !== null) sidePanelApi.el.style.display = 'none';
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
export type { SidePanelEvent, SidePanelEventKind } from './sidePanelHud';
export type { UnitPanelState } from './unitPanelHud';
export type { BuildTypeInfo } from './buildModeHud';
