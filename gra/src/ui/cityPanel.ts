/**
 * cityPanel.ts
 * FULL-SCREEN city view (UI task 1, design = Widok-miasta.html mockup, approved by Naster).
 *
 * A fixed full-viewport overlay reproducing the mockup: header (+ city nav + font
 * scale), 3 columns (citizens/buildings | yields/production | garrison/resources/
 * culture), footer, and the "Okolica" hex grid.  Sections the engine can already
 * feed are REAL; the rest are faithful placeholders that light up once the engine
 * exposes their data.
 *
 *   REAL now (no new engine work required):
 *     - header: name / owner / era / population, prev/next-city nav, font scale
 *     - Bilans plonow (Praca/Pieniadz/Nauka/Kultura/Zywnosc, computed like the tick)
 *     - Produkcja: current item + progress + ETA, Usun, queue reorder, Wykup (rush)*
 *     - Kolejka: production queue
 *     - Dostepne do budowy: Buduj / Ulepsz
 *     - Magazyn Zywnosci: net food + store + growth ETA (when granary present)
 *     - Garnizon: real units standing on the city hex (via getUnitsAt hook)*
 *     - Okolica: real hex neighbourhood drawn from the map
 *     (* light up when the matching optional hook is injected)
 *   PLACEHOLDER (until engine exposes them): Mieszkancy, Specjalisci, Zdrowie,
 *     Podzial Handlu, Magazyny Surowcow, Kultura i Religia, footer nav.
 *
 * LANE: src/ui/* only.  Imports TYPES and PURE functions from game/* + data/*
 * (read-only); never edits them, never touches main.ts, no THREE.  Public API
 * (showCityPanel / hideCityPanel / isCityPanelOpen) is unchanged & backward
 * compatible.  All engine wiring stays optional via configureCityPanel().
 *
 * Source uses literal UTF-8 Polish strings (consistent with main.ts).
 */

import type { City } from '../game/cities';
import type { GameMap } from '../types/map';
import { TerenBazowy, Nakladka } from '../types/hex';
import { loadGameData, type GameData } from '../data/loader';
import {
  availableProduction,
  frontItem,
  enqueue,
  dequeue,
  setPaused,
  buildingProductionItem,
  buildingLevelForEpoch,
  type CityProduction,
  type ProductionItem,
} from '../game/production';
import {
  buildEconParams,
  workedTilesForCity,
  toEconomyCity,
  type Difficulty,
} from '../game/turn-economy';
import {
  cityYieldPerTurn,
  populationGrowth,
  type CityYieldContext,
} from '../game/economy';
import { UI_PARAMS } from './uiParams';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A unit garrisoned in the city (supplied by the engine via getUnitsAt). */
export interface GarrisonUnit {
  nazwa: string;
  category?: string;
  health?: number;
  maxHealth?: number;
}

/** Optional hooks the engine may supply so the view reflects real game state. */
export interface CityPanelConfig {
  data?: GameData;
  difficulty?: Difficulty;
  getCities?: () => City[];
  getEpoch?: (ownerId: number) => number;
  getUnlockedTechs?: (ownerId: number) => string[];
  getBuiltBuildingIds?: (cityId: string) => string[];
  getProduction?: (cityId: string) => CityProduction | null;
  setProduction?: (cityId: string, prod: CityProduction) => void;
  getCityBuildingFlags?: (cityId: string) => Partial<CityYieldContext>;
  /** Units standing on the city hex -> real Garnizon panel. */
  getUnitsAt?: (q: number, r: number) => GarrisonUnit[];
  /** Player treasury (gold) -> enables the Wykup (rush-buy) button. */
  getTreasury?: (ownerId: number) => number;
  /** Engine performs the actual rush-buy spend + completion. */
  onRushBuy?: (cityId: string, item: ProductionItem, koszt: number) => void;
  /** Called after the queue changes so the engine can react (e.g. refresh HUD). */
  onChange?: (cityId: string) => void;
  /** Zmiana nazwy miasta — silnik wykonuje faktyczną zmianę w modelu. */
  onRename?: (cityId: string, newName: string) => void;
  /** Przełącz zarządcę automatycznego dla miasta. */
  onAutoManage?: (cityId: string) => void;
  /** Otwórz widok artystyczny miasta. */
  onArtView?: (cityId: string) => void;
  /** Stan kultury miasta -> dynamiczna sekcja Kultura i Religia. */
  getCultureState?: (cityId: string) => {
    kulturaSuma: number;
    przyrost: number;
    borderRadius: number;
    thresholds: number[];
    zrodla?: { nazwa: string; wartosc: number }[];
  } | null;
  /** Lista surowców do których miasto ma dostęp (v0.1 = boolean). */
  getResourceAccess?: (cityId: string) => string[];
  /**
   * Promień okolicy roboczej (pól obrabianych) wg EKONOMII:
   * cityRangeForPopulation(pop): pop<5 -> 5, pop>=5 -> 10, pop>=10 -> 15.
   * UI rysuje obwódkę zasięgu; pełne terytorium renderuje MAPA (świat).
   */
  getCityWorkedRange?: (cityId: string) => number;
  /**
   * Pola faktycznie obrabiane (N = populacja) wg EKONOMII (assignWorkedTiles).
   * UI podświetla te pola w kompaktowym podglądzie okolicy.
   */
  getWorkedTiles?: (cityId: string) => { q: number; r: number }[];
}

let cfg: CityPanelConfig = {};

/** Inject engine hooks.  Merges into any previous config; call once at startup. */
export function configureCityPanel(config: CityPanelConfig): void {
  cfg = { ...cfg, ...config };
}

// ---------------------------------------------------------------------------
// Data + production access (with graceful fallbacks)
// ---------------------------------------------------------------------------

let cachedData: GameData | null = null;
function gameData(): GameData | null {
  if (cfg.data) return cfg.data;
  if (cachedData) return cachedData;
  try { cachedData = loadGameData(); } catch { cachedData = null; }
  return cachedData;
}

const localProd = new Map<string, CityProduction>();
function getProd(cityId: string): CityProduction {
  if (cfg.getProduction) { const p = cfg.getProduction(cityId); if (p) return p; }
  return localProd.get(cityId) ?? { kolejka: [], postep: 0 };
}
function setProd(cityId: string, prod: CityProduction): void {
  if (cfg.setProduction) cfg.setProduction(cityId, prod);
  else localProd.set(cityId, prod);
  cfg.onChange?.(cityId);
}

/** Move a queued item (index>=1) up/down.  Index 0 (in progress) never moves. */
function moveQueueItem(prod: CityProduction, index: number, dir: -1 | 1): CityProduction {
  const j = index + dir;
  if (index < 1 || j < 1 || j >= prod.kolejka.length) {
    return { kolejka: [...prod.kolejka], postep: prod.postep };
  }
  const k = [...prod.kolejka];
  const a = k[index] as ProductionItem;
  k[index] = k[j] as ProductionItem;
  k[j] = a;
  return { kolejka: k, postep: prod.postep };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}
function signed(n: number): string { return (n > 0 ? '+' : '') + String(n); }
function tury(n: number): string {
  const a = Math.abs(n), m10 = a % 10, m100 = a % 100;
  if (a === 1) return 'tura';
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'tury';
  return 'tur';
}
function etaTurns(koszt: number, postep: number, praca: number): number | null {
  if (!(praca > 0)) return null;
  return Math.max(1, Math.ceil(Math.max(0, koszt - postep) / praca));
}

/** Font scale (px on the root); module-level so it persists across re-renders. */
const SCALES: ReadonlyArray<{ label: string; px: number }> = UI_PARAMS.panel_miasta.font_scale;
let scalePx = UI_PARAMS.panel_miasta.font_scale_domyslna_px;

// ---------------------------------------------------------------------------
// Yield computation (mirrors turn-economy.advanceCityEconomy per city)
// ---------------------------------------------------------------------------

interface CityView {
  praca: number; pieniadz: number; nauka: number; kultura: number;
  zywnoscNetto: number; maSpichlerz: boolean; magazyn: number; progWzrostu: number;
}
function isCapital(city: City): boolean {
  const all = cfg.getCities?.();
  if (!all || all.length === 0) return true;
  const first = all.find(c => c.ownerId === city.ownerId);
  return first ? first.id === city.id : true;
}
function computeView(city: City, map: GameMap, data: GameData): CityView | null {
  try {
    const params = buildEconParams(data, cfg.difficulty ?? 'normal');
    const econCity = toEconomyCity(city, params, isCapital(city));
    const worked = workedTilesForCity(city, map);
    const base: CityYieldContext = {
      wojskoZuzycieZywnosci: 0, strataFraction: 0,
      maMlyn: false, maCegielnia: false, maTargowisko: false, maMennica: false, mennicaMnoznik: 1,
    };
    const ctx: CityYieldContext = { ...base, ...(cfg.getCityBuildingFlags?.(city.id) ?? {}) };
    const y = cityYieldPerTurn(econCity, worked, [], params, ctx);
    const grow = populationGrowth(econCity, y.zywnosc, params);
    return {
      praca: y.praca, pieniadz: y.pieniadz, nauka: y.nauka, kultura: y.kultura,
      zywnoscNetto: y.zywnosc, maSpichlerz: econCity.maSpichlerz,
      magazyn: grow.nowyMagazynZywnosci,
      progWzrostu: 10 + city.population * params.progWzrostuWspolczynnik,
    };
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Scoped styles (injected once, namespaced under .civ-cs so the game is safe)
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-city-screen-css';
function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-cs{position:fixed;inset:0;z-index:400;overflow:auto;
  --bg:#1b1f26;--panel:#262b33;--panel2:#1e232a;--border:#3c4450;--bord2:#4a5568;
  --text:#e8ebf0;--muted:#9aa6b6;--gold:#e0b24a;--green:#6bbf59;--red:#d36b5e;--blue:#5a9bd4;--happy:#f6c942;
  background:var(--bg);color:var(--text);font-family:'Segoe UI',Tahoma,Verdana,sans-serif;font-size:16px;}
.civ-cs *{box-sizing:border-box;}
.civ-cs .panel{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:0.5em 0.65em;}
.civ-cs .ptitle{font-size:0.78em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gold);
  border-bottom:1px solid var(--border);padding-bottom:0.25em;margin-bottom:0.45em;display:flex;justify-content:space-between;align-items:center;}
.civ-cs .muted{color:var(--muted);} .civ-cs .gold{color:var(--gold);} .civ-cs .green{color:var(--green);}
.civ-cs .red{color:var(--red);} .civ-cs .blue{color:var(--blue);} .civ-cs .val{font-weight:600;}
.civ-cs .rsb{display:flex;justify-content:space-between;align-items:center;gap:0.3em;}
.civ-cs .row{display:flex;align-items:center;gap:0.35em;}
.civ-cs .btn{display:inline-flex;align-items:center;gap:0.2em;background:linear-gradient(180deg,#3a4150,#2a3040);
  border:1px solid var(--bord2);border-radius:3px;color:var(--text);font-size:0.82em;padding:0.18em 0.6em;cursor:pointer;font-family:inherit;}
.civ-cs .btn:hover{background:linear-gradient(180deg,#4a5160,#3a4050);}
.civ-cs .btn:disabled{opacity:0.4;cursor:not-allowed;}
.civ-cs .btn-g{background:linear-gradient(180deg,#c09030,#8a6418);border-color:#c0a040;color:#fff8e0;font-weight:700;}
.civ-cs .btn-g:hover{background:linear-gradient(180deg,#d0a040,#9a7428);}
.civ-cs .btn-sm{padding:0.1em 0.45em;font-size:0.78em;}
.civ-cs .fsbtn{background:linear-gradient(180deg,#2a3040,#1e2530);border:1px solid var(--bord2);border-radius:3px;
  color:var(--muted);font-size:0.74em;padding:0.12em 0.5em;cursor:pointer;font-family:inherit;}
.civ-cs .fsbtn.active{color:var(--gold);border-color:var(--gold);font-weight:700;}
.civ-cs .hbtn{background:rgba(224,178,74,.1);border:1px solid rgba(224,178,74,.3);color:var(--text);font-size:0.8em;padding:4px 8px;border-radius:4px;cursor:pointer;font-family:inherit;}
.civ-cs .hbtn:hover{background:rgba(224,178,74,.22);border-color:rgba(224,178,74,.55);}
.civ-cs .bwrap{background:#111518;border:1px solid var(--border);border-radius:2px;height:0.7em;overflow:hidden;}
.civ-cs .bfill{height:100%;border-radius:2px;}
.civ-cs #hdr{background:linear-gradient(180deg,#222838,#1b1f26);border-bottom:2px solid var(--bord2);
  padding:0.45em 0.9em;display:flex;align-items:center;gap:0.55em;flex-wrap:wrap;}
.civ-cs .nav-arr{background:none;border:1px solid var(--bord2);color:var(--gold);font-size:1em;padding:0 0.45em;height:1.8em;cursor:pointer;border-radius:3px;}
.civ-cs .nav-arr:disabled{opacity:0.35;cursor:not-allowed;}
.civ-cs #cname{font-size:1.45em;font-weight:700;color:var(--gold);text-shadow:0 0 12px rgba(224,178,74,.35);}
.civ-cs .mbadge{background:var(--panel);border:1px solid var(--border);border-radius:3px;padding:0.12em 0.55em;font-size:0.82em;}
.civ-cs .era-b{background:linear-gradient(90deg,#3a2a08,#5a4018,#3a2a08);border:1px solid var(--gold);color:var(--gold);
  font-size:0.76em;font-weight:700;padding:0.12em 0.6em;border-radius:10px;}
.civ-cs #hdr-r{margin-left:auto;display:flex;align-items:center;gap:0.4em;}
.civ-cs .closeb{background:linear-gradient(180deg,#c0402f,#8a2418);border:1px solid #d05040;color:#fff;font-weight:700;
  border-radius:3px;padding:0.12em 0.7em;cursor:pointer;font-size:1em;font-family:inherit;}
.civ-cs #body{display:grid;grid-template-columns:15em 1fr 17em;gap:0.55em;padding:0.55em;align-items:start;}
.civ-cs .col{display:flex;flex-direction:column;gap:0.45em;}
.civ-cs .bld,.civ-cs .spec,.civ-cs .unit,.civ-cs .res{display:flex;align-items:center;gap:0.35em;background:var(--panel2);
  border:1px solid var(--border);border-radius:3px;padding:0.2em 0.42em;margin-bottom:0.18em;}
.civ-cs .bi{font-size:0.95em;width:1.3em;text-align:center;} .civ-cs .bn{flex:1;font-size:0.84em;}
.civ-cs .be{font-size:0.74em;color:var(--green);} .civ-cs .bm{font-size:0.74em;color:var(--red);margin-left:auto;}
.civ-cs .ybox{background:var(--panel2);border:1px solid var(--border);border-radius:3px;padding:0.4em 0.5em;}
.civ-cs .yn{font-size:0.74em;color:var(--muted);} .civ-cs .yv{font-size:1.4em;font-weight:700;line-height:1.1;}
.civ-cs .fbout{background:#111518;border:1px solid var(--border);border-radius:2px;height:1.15em;overflow:hidden;position:relative;}
.civ-cs .fbfil{height:100%;background:linear-gradient(90deg,#1e5a1e,#3a8a2a);}
.civ-cs .fbtxt{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:0.74em;font-weight:700;}
.civ-cs .picon{width:3.4em;height:3.4em;border:2px solid var(--gold);border-radius:4px;background:var(--panel2);display:flex;align-items:center;justify-content:center;font-size:1.9em;flex-shrink:0;}
.civ-cs .qitem{background:var(--panel2);border:1px solid var(--border);border-radius:3px;padding:0.1em 0.45em;font-size:0.8em;display:flex;align-items:center;gap:0.25em;}
.civ-cs .hpb{height:0.4em;background:var(--panel2);border:1px solid var(--border);border-radius:2px;overflow:hidden;margin-top:0.15em;}
.civ-cs .hpf{height:100%;border-radius:2px;background:var(--green);} .civ-cs .hpl{background:var(--red);}
.civ-cs .rgrid{display:grid;grid-template-columns:1fr 1fr;gap:0.25em;}
.civ-cs .cring{display:flex;align-items:center;justify-content:center;width:3.6em;height:3.6em;border:3px solid var(--gold);
  border-radius:50%;font-size:0.9em;font-weight:700;color:var(--gold);margin:0.2em auto;background:radial-gradient(circle,#2a2530,#1b1f26);}
.civ-cs #ftr{background:linear-gradient(180deg,#1b1f26,#141820);border-top:2px solid var(--bord2);padding:0.45em 0.8em;display:flex;align-items:center;gap:0.4em;flex-wrap:wrap;}
.civ-cs #ftr-r{margin-left:auto;display:flex;align-items:center;gap:0.6em;font-size:0.84em;}
.civ-cs .okolica{background:linear-gradient(180deg,#1b1f26,#141820);border-top:2px solid var(--bord2);padding:0.55em 0.9em 1.2em;}
.civ-cs .okolica h3{color:var(--gold);font-size:0.84em;text-transform:uppercase;letter-spacing:.06em;margin:0 0 0.5em;}
.civ-cs .okwrap{display:flex;gap:1em;align-items:flex-start;flex-wrap:wrap;}
.civ-cs .oklegend{font-size:0.78em;color:var(--muted);display:flex;flex-direction:column;gap:0.25em;}
.civ-cs .sw{display:inline-block;width:0.75em;height:0.75em;border-radius:2px;vertical-align:middle;margin-right:0.3em;}
.civ-cs .okstats{display:flex;flex-wrap:wrap;gap:0.45em;margin-bottom:0.2em;}
.civ-cs .okstat{background:var(--panel2);border:1px solid var(--border);border-radius:4px;padding:0.3em 0.65em;font-size:0.82em;line-height:1.3;min-width:5.5em;}
.civ-cs .okstat b{color:var(--gold);font-size:1.1em;}
.civ-cs .okstat .ks{display:block;color:var(--muted);font-size:0.8em;text-transform:uppercase;letter-spacing:.04em;}
.civ-cs .okhint{font-size:0.76em;color:var(--muted);margin-top:0.55em;font-style:italic;flex-basis:100%;}
`;
  const style = el('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Static (placeholder) panels -- faithful to the mockup; light up later
// ---------------------------------------------------------------------------

function PH(): string {
  return '<span class="muted" style="font-size:0.66em;border:1px solid var(--border);border-radius:3px;padding:0 0.3em;">podgląd</span>';
}

function leftPlaceholders(pop: number): string {
  const happy = Math.max(1, Math.round(pop * 0.55));
  const cont = Math.max(0, Math.round(pop * 0.3));
  const unhappy = Math.max(0, pop - happy - cont);
  const dots = '\u{1F604}'.repeat(happy) + '\u{1F610}'.repeat(cont) + '\u{1F620}'.repeat(unhappy);
  return `
  <div class="panel">
    <div class="ptitle"><span>Mieszkańcy (${pop})</span>${PH()}</div>
    <div style="font-size:1.05em;letter-spacing:0.1em;margin-bottom:0.3em;">${dots}</div>
    <div class="row" style="gap:0.6em;font-size:0.78em;">
      <span><span class="gold">●</span> Zad.: <b>${happy}</b></span>
      <span><span class="muted">●</span> Kont.: <b>${cont}</b></span>
      <span><span class="red">●</span> Niezad.: <b>${unhappy}</b></span>
    </div>
  </div>
  <div class="panel">
    <div class="ptitle"><span>Zdrowie miasta (poza v0.1)</span>${PH()}</div>
    <div class="rsb"><span class="green" style="font-weight:700;">♥ +6</span><span class="red" style="font-weight:700;">\u{1F480} -2</span><span class="green" style="font-weight:700;">= +4</span></div>
  </div>
  <div class="panel">
    <div class="ptitle"><span>Specjaliści (poza v0.1)</span>${PH()}</div>
    <div class="spec"><span>\u{1F4DA}</span><span class="bn">Uczony</span><span class="blue" style="font-size:0.78em;">+3 \u{1F52C}/t</span></div>
    <div class="spec"><span>\u{1F4B0}</span><span class="bn">Poborca</span><span class="gold" style="font-size:0.78em;">+2 \u{1F4B1}/t</span></div>
  </div>`;
}

function renderSurowce(mount: HTMLElement, city: City): void {
  mount.innerHTML = '';
  const dostep = cfg.getResourceAccess?.(city.id);
  if (dostep !== undefined) {
    // Hak dostępny — render dynamiczny (dostęp boolean, v0.1)
    mount.appendChild(el('div', 'ptitle', '<span>Surowce (dostęp)</span>'));
    if (dostep.length === 0) {
      mount.appendChild(el('div', 'muted', '(brak dostępu)'));
    } else {
      for (const nazwa of dostep) {
        const row = el('div', 'res');
        row.innerHTML = `<span class="bi green">\u2713</span><span class="bn">${nazwa}</span>`;
        mount.appendChild(row);
      }
    }
  } else {
    // Brak haka — placeholder słupki + nagłówek + badge "podgląd"
    const r = (icon: string, name: string, pct: number, col: string) =>
      `<div class="res"><span class="bi">${icon}</span><div style="flex:1;"><div class="bn">${name}</div><div class="bwrap" style="height:0.3em;"><div class="bfill" style="width:${pct}%;background:${col};"></div></div></div></div>`;
    mount.innerHTML = `
    <div class="ptitle"><span>Surowce (dostęp, nie ilo\u015B\u0107 \u2014 v0.1)</span>${PH()}</div>
    <div class="muted" style="font-size:0.74em;margin-bottom:0.35em;">Dost\u0119p do surowc\u00F3w \u2014 dane gdy silnik dostarczy hak getResourceAccess.</div>
    <div class="rgrid">
      ${r('\u{1FAB5}', 'Drewno', 64, '#5a8030')}
      ${r('\u{1FAA8}', 'Kamie\u0144', 36, '#8a7830')}
      ${r('\u{1F9F1}', 'Ceg\u0142a', 48, '#a05028')}
      ${r('\u2699\uFE0F', 'Br\u0105z', 27, '#4a7890')}
    </div>`;
  }
}

function renderKultura(mount: HTMLElement, city: City, view: CityView | null): void {
  mount.innerHTML = '';
  const state = cfg.getCultureState?.(city.id);
  if (state !== null && state !== undefined) {
    // Hak dostepny â render dynamiczny
    mount.appendChild(el('div', 'ptitle', '<span>Kultura i Religia</span>'));

    // Kultura lacznie + przyrost
    const sumaRow = el('div', 'rsb');
    sumaRow.style.cssText = 'margin-bottom:0.3em;';
    sumaRow.innerHTML =
      `<span>Kultura łącznie: <b class="gold">${state.kulturaSuma}</b></span>` +
      `<span class="green" style="font-size:0.88em;">+${state.przyrost}/turę</span>`;
    mount.appendChild(sumaRow);

    // Pasek postepu do nastepnej granicy (noUncheckedIndexedAccess-safe)
    const thresholds = state.thresholds;
    const prev: number = thresholds.filter((t): t is number => t <= state.kulturaSuma).pop() ?? 0;
    const next: number | undefined = thresholds.find(t => t > state.kulturaSuma);
    let pct: number;
    let progiTekst: string;
    if (next === undefined) {
      pct = 100;
      progiTekst = 'Maksymalny zasięg';
    } else {
      const span = next - prev;
      pct = span > 0 ? Math.round(Math.min(100, Math.max(0, (state.kulturaSuma - prev) / span * 100))) : 0;
      progiTekst = `Następna granica: ${next} pkt`;
    }
    const barWrap = el('div', 'bwrap');
    barWrap.innerHTML = `<div class="bfill" style="width:${pct}%;background:linear-gradient(90deg,#6030a0,#c070ff);"></div>`;
    mount.appendChild(barWrap);
    const barLabel = el('div', 'muted');
    barLabel.style.cssText = 'font-size:0.74em;margin:0.18em 0 0.3em;';
    barLabel.textContent = progiTekst;
    mount.appendChild(barLabel);

    // Zasieg granic z kultury
    const zasiegRow = el('div', 'row');
    zasiegRow.style.cssText = 'font-size:0.82em;margin-bottom:0.28em;';
    zasiegRow.innerHTML = `🌍 Zasięg granic (kultura): <b class="gold">+${state.borderRadius} pierścieni</b>`;
    mount.appendChild(zasiegRow);

    // Zrodla kultury (opcjonalne)
    if (state.zrodla && state.zrodla.length > 0) {
      const zrH = el('div', 'muted');
      zrH.style.cssText = 'font-size:0.74em;font-weight:700;margin:0.2em 0 0.12em;';
      zrH.textContent = 'Źródła kultury:';
      mount.appendChild(zrH);
      for (const z of state.zrodla) {
        const zr = el('div', 'muted');
        zr.style.cssText = 'font-size:0.74em;padding-left:0.5em;';
        zr.innerHTML = `${z.nazwa}: <span class="gold">+${z.wartosc}</span>`;
        mount.appendChild(zr);
      }
    }

    // Religia â placeholder etap 2
    const relRow = el('div', 'muted');
    relRow.style.cssText = 'font-size:0.78em;border-top:1px solid var(--border);padding-top:0.3em;margin-top:0.3em;';
    relRow.innerHTML = '🛕 Religia â etap 2 (wkrótce)';
    mount.appendChild(relRow);

  } else {
    // Brak haka â dotychczasowy placeholder z badge podglad
    const kult = view ? view.kultura : 0;
    mount.innerHTML = `
    <div class="ptitle"><span>Kultura i Religia</span>${PH()}</div>
    <div style="display:flex;gap:0.6em;align-items:center;">
      <div class="cring">142</div>
      <div style="font-size:0.8em;">
        <div class="gold">${signed(kult)} kult./t</div>
        <div class="muted">Zasięg granic: 2 pola</div>
        <div style="margin-top:0.25em;">🛕 <span class="val">Animizm</span></div>
      </div>
    </div>`;
  }
}

function tradeSplitPlaceholder(view: CityView | null): string {
  const nauka = view ? view.nauka : 0;
  const pieniadz = view ? view.pieniadz : 0;
  return `
  <div class="panel">
    <div class="ptitle"><span>Podział Handlu (domyślny 60/30/10) (kontrakt: EKONOMIA)</span>${PH()}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.3em;">
      <div class="ybox" style="padding:0.25em 0.4em;"><div class="blue" style="font-size:0.76em;">\u{1F52C} Nauka</div><div class="blue" style="font-size:1.1em;font-weight:700;">+${nauka}</div><div class="muted" style="font-size:0.68em;">60%</div></div>
      <div class="ybox" style="padding:0.25em 0.4em;"><div class="gold" style="font-size:0.76em;">\u{1F4B0} Pieniądz</div><div class="gold" style="font-size:1.1em;font-weight:700;">+${pieniadz}</div><div class="muted" style="font-size:0.68em;">30%</div></div>
      <div class="ybox" style="padding:0.25em 0.4em;"><div style="font-size:0.76em;color:var(--happy);">\u{1F604} Luksus</div><div style="font-size:1.1em;font-weight:700;color:var(--happy);">+1</div><div class="muted" style="font-size:0.68em;">10%</div></div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Real sections
// ---------------------------------------------------------------------------

function renderBilans(mount: HTMLElement, view: CityView | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', '<span>Bilans plonów / turę</span>'));
  if (!view) { mount.appendChild(el('div', 'muted', 'Brak danych gry')); return; }
  const grid = el('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.4em;';
  const box = (icon: string, name: string, value: number, cls: string) =>
    `<div class="ybox"><div class="yn">${icon} ${name}</div><div class="yv ${cls}">${signed(value)}</div></div>`;
  const foodCls = view.zywnoscNetto > 0 ? 'green' : view.zywnoscNetto < 0 ? 'red' : 'gold';
  grid.innerHTML =
    box('\u{1F35E}', 'Żywność', view.zywnoscNetto, foodCls) +
    box('\u{1F528}', 'Praca', view.praca, 'gold') +
    box('\u{1F4B1}', 'Pieniądz', view.pieniadz, 'blue');
  mount.appendChild(grid);
  const extra = el('div');
  extra.style.cssText = 'display:flex;gap:0.8em;margin-top:0.35em;font-size:0.82em;';
  extra.innerHTML =
    `<span class="muted">\u{1F52C} Nauka: <b class="blue">${signed(view.nauka)}</b></span>` +
    `<span class="muted">\u{1F3AD} Kultura: <b class="gold">${signed(view.kultura)}</b></span>`;
  mount.appendChild(extra);
}

function renderMagazyn(mount: HTMLElement, city: City, view: CityView | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', '<span>Magazyn Żywności — wzrost</span>'));
  if (!view) { mount.appendChild(el('div', 'muted', '—')); return; }
  if (view.maSpichlerz) {
    const prog = Math.round(view.progWzrostu);
    const pct = Math.max(0, Math.min(100, Math.round((view.magazyn / Math.max(1, prog)) * 100)));
    const eta = etaTurns(view.progWzrostu, view.magazyn, Math.max(0, view.zywnoscNetto));
    mount.appendChild(el('div', 'fbout', `<div class="fbfil" style="width:${pct}%"></div><div class="fbtxt">${view.magazyn} / ${prog} \u{1F35E}</div>`));
    mount.appendChild(el('div', 'rsb',
      `<span class="muted" style="font-size:0.78em;">Próg (${city.population} ludzi): <b>${prog}</b></span>` +
      `<span class="gold" style="font-size:0.78em;">${eta !== null ? 'Wzrost za ~' + eta + ' ' + tury(eta) : '—'}</span>`));
  } else {
    mount.appendChild(el('div', 'rsb',
      `<span class="muted" style="font-size:0.82em;">Netto: <b class="${view.zywnoscNetto >= 0 ? 'green' : 'red'}">${signed(view.zywnoscNetto)}/t</b></span>` +
      `<span class="muted" style="font-size:0.78em;">Bez Spichlerza nadwyżka nie jest magazynowana</span>`));
  }
}

function addItem(city: City, item: ProductionItem): void {
  setProd(city.id, enqueue(getProd(city.id), item));
  rerender();
}

function renderProd(mount: HTMLElement, city: City, view: CityView | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', '<span>Produkcja</span>'));
  const prod = getProd(city.id);
  const front = frontItem(prod);
  const praca = view ? view.praca : 0;
  const player = city.ownerId === 0; // AI cities -> read-only (no build/queue controls)

  if (!front) {
    mount.appendChild(el('div', 'muted', 'Kolejka pusta — wybierz co budować poniżej.'));
  } else {
    const paused = getProd(city.id).wstrzymana === true;
    const e = paused ? null : etaTurns(front.koszt, prod.postep, praca);
    const pct = front.koszt > 0 ? Math.round(Math.min(1, prod.postep / front.koszt) * 100) : 100;
    const pauseBadge = paused ? ' <span style="font-size:0.7em;background:#7a4800;color:#ffd090;border:1px solid #c07020;border-radius:3px;padding:0 0.35em;vertical-align:middle;">⏸ wstrzymana</span>' : '';
    const row = el('div');
    row.style.cssText = 'display:flex;gap:0.55em;align-items:flex-start;';
    row.innerHTML =
      `<div class="picon">${front.kind === 'budynek' ? '\u{1F3DB}️' : '⚔️'}</div>` +
      `<div style="flex:1;">` +
        `<div style="font-size:1.05em;font-weight:700;" class="gold">${front.nazwa}${pauseBadge}</div>` +
        `<div class="muted" style="font-size:0.78em;">${front.kind === 'budynek' ? 'Budynek' : 'Jednostka'} • Koszt: ${front.koszt} \u{1F528}</div>` +
        `<div class="rsb" style="font-size:0.78em;margin:0.22em 0 0.15em;">` +
          `<span class="muted">Zebrana Praca: <span class="gold">${prod.postep} / ${front.koszt} \u{1F528}</span></span>` +
          (paused
            ? `<span style="color:#e08030;font-weight:600;">⏸ Wstrzymane — brak postępu</span>`
            : `<span class="blue">${e !== null ? '~' + e + ' ' + tury(e) : 'brak Pracy'}</span>`) +
        `</div>` +
        `<div class="bwrap"><div class="bfill" style="width:${pct}%;background:linear-gradient(90deg,#8a6418,var(--gold));"></div></div>` +
      `</div>`;
    mount.appendChild(row);

    const actions = el('div');
    actions.style.cssText = 'margin-top:0.35em;display:flex;gap:0.3em;flex-wrap:wrap;';
    // Wykup (rush-buy) -- only when the engine exposes treasury + a spend hook.
    if (cfg.getTreasury && cfg.onRushBuy) {
      const koszt = Math.ceil(Math.max(0, front.koszt - prod.postep) * UI_PARAMS.panel_miasta.rush_cost_mnoznik);
      const skarb = cfg.getTreasury(city.ownerId);
      const stac = skarb >= koszt;
      const wykup = el('button', 'btn btn-g', `\u{1F4B0} Wykup (${koszt})`);
      (wykup as HTMLButtonElement).disabled = !stac;
      wykup.title = stac ? 'Zaplac zlotem i ukoncz natychmiast' : 'Za malo zlota (' + skarb + '/' + koszt + ')';
      wykup.addEventListener('click', () => { cfg.onRushBuy?.(city.id, front, koszt); rerender(); });
      actions.appendChild(wykup);
    }
    // Wstrzymaj / Wznów — przełącza flagę wstrzymana dla pozycji w budowie.
    const wstBtn = el('button', 'btn btn-sm', paused ? '▶ Wznów' : '⏸ Wstrzymaj');
    wstBtn.title = paused ? 'Wznów produkcję' : 'Wstrzymaj produkcję (postęp zachowany)';
    wstBtn.addEventListener('click', () => {
      const cur = getProd(city.id);
      setProd(city.id, setPaused(cur, !cur.wstrzymana));
      rerender();
    });
    actions.appendChild(wstBtn);
    const usun = el('button', 'btn btn-sm', '✕ Usuń');
    usun.addEventListener('click', () => { setProd(city.id, dequeue(getProd(city.id), 0)); rerender(); });
    actions.appendChild(usun);
    if (player) mount.appendChild(actions);
  }

  // queue tail with reorder
  const qWrap = el('div');
  qWrap.style.cssText = 'margin-top:0.42em;border-top:1px solid var(--border);padding-top:0.35em;';
  const qh = el('div', 'gold', 'Kolejka budowy:');
  qh.style.cssText = 'font-size:0.78em;font-weight:700;margin-bottom:0.22em;';
  qWrap.appendChild(qh);
  if (prod.kolejka.length <= 1) {
    const none = el('span', 'muted', '— brak dalszych pozycji —');
    none.style.fontSize = '0.75em';
    qWrap.appendChild(none);
  }
  for (let i = 1; i < prod.kolejka.length; i++) {
    const it = prod.kolejka[i] as ProductionItem;
    const qi = el('div', 'qitem', `<span>${it.kind === 'budynek' ? '\u{1F3DB}️' : '⚔️'}</span><span style="flex:1;">${it.nazwa}</span>`);
    qi.style.marginBottom = '0.15em';
    const idx = i;
    const up = el('button', 'btn btn-sm', '↑');
    up.style.cssText = 'padding:0 0.35em;';
    (up as HTMLButtonElement).disabled = i <= 1;
    up.addEventListener('click', () => { setProd(city.id, moveQueueItem(getProd(city.id), idx, -1)); rerender(); });
    const down = el('button', 'btn btn-sm', '↓');
    down.style.cssText = 'padding:0 0.35em;';
    (down as HTMLButtonElement).disabled = i >= prod.kolejka.length - 1;
    down.addEventListener('click', () => { setProd(city.id, moveQueueItem(getProd(city.id), idx, 1)); rerender(); });
    const x = el('button', 'btn btn-sm', '✕');
    x.style.cssText = 'padding:0 0.35em;';
    x.addEventListener('click', () => { setProd(city.id, dequeue(getProd(city.id), idx)); rerender(); });
    if (player) { qi.appendChild(up); qi.appendChild(down); qi.appendChild(x); }
    qWrap.appendChild(qi);
  }
  mount.appendChild(qWrap);
}

function renderBuildList(mount: HTMLElement, city: City, data: GameData | null, view: CityView | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', '<span>Dostępne do budowy</span>'));
  if (!data) { mount.appendChild(el('div', 'muted', 'Brak danych gry')); return; }
  if (city.ownerId !== 0) { mount.appendChild(el('div', 'muted', 'Miasto rywala — budowa niedostępna (podgląd).')); return; }
  const praca = view ? view.praca : 0;
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const items = availableProduction(city, data, techs, { epoch, builtBuildingIds: built, buildingLevel: 1 });

  const group = (title: string, list: ProductionItem[]) => {
    if (list.length === 0) return;
    const h = el('div', 'muted'); h.style.cssText = 'font-size:0.72em;margin:0.3em 0 0.2em;'; h.textContent = title;
    mount.appendChild(h);
    for (const it of list) {
      const e = etaTurns(it.koszt, 0, praca);
      const row = el('div', 'bld');
      row.innerHTML = `<span class="bi">${it.kind === 'budynek' ? '\u{1F3DB}️' : '⚔️'}</span>` +
        `<span class="bn">${it.nazwa}</span>` +
        `<span class="muted" style="font-size:0.72em;">${it.koszt}\u{1F528}${e !== null ? ' · ~' + e + 't' : ''}</span>`;
      const b = el('button', 'btn btn-sm', 'Buduj');
      b.style.marginLeft = '0.3em';
      b.addEventListener('click', () => addItem(city, it));
      row.appendChild(b);
      mount.appendChild(row);
    }
  };
  group('Budynki', items.filter(i => i.kind === 'budynek'));
  group('Jednostki', items.filter(i => i.kind === 'jednostka'));
  if (items.length === 0) mount.appendChild(el('div', 'muted', '(brak — zbadaj technologie)'));

  if (built.length > 0) {
    const ups: HTMLElement[] = [];
    for (const id of built) {
      const def = data.buildings.find(b => b.id === id);
      if (!def || def.maksPoziom <= 1) continue;
      // Gating po epoce: oblicz docelowy poziom budynku dla obecnej epoki miasta.
      // Zakładamy, że wybudowany budynek jest na poziomie 1 (podstawowym).
      const targetLevel = buildingLevelForEpoch(def.epokaWejscia, epoch, def.maksPoziom);
      // Pokaż "Ulepsz" tylko gdy epoka pozwala na wyższy poziom niż 1.
      if (targetLevel <= 1) continue;
      const item = buildingProductionItem(id, data, targetLevel);
      if (!item) continue;
      // Etykieta z nazwą poziomu jeśli jest w nazwyPoziomow
      const nazwaPoziom: string = (def.nazwyPoziomow[targetLevel - 1] ?? '');
      const levelLabel = nazwaPoziom.length > 0
        ? `${def.nazwa} → poz. ${targetLevel} (${nazwaPoziom})`
        : `${def.nazwa} → poziom ${targetLevel}`;
      const row = el('div', 'bld');
      row.innerHTML = `<span class="bi">⬆️</span><span class="bn">${levelLabel}</span>` +
        `<span class="muted" style="font-size:0.72em;">${item.koszt}\u{1F528}</span>`;
      const b = el('button', 'btn btn-sm', 'Ulepsz');
      b.style.marginLeft = '0.3em';
      b.addEventListener('click', () => addItem(city, item));
      row.appendChild(b);
      ups.push(row);
    }
    if (ups.length > 0) {
      const h = el('div', 'muted'); h.style.cssText = 'font-size:0.72em;margin:0.3em 0 0.2em;'; h.textContent = 'Ulepsz';
      mount.appendChild(h);
      for (const r of ups) mount.appendChild(r);
    }
  }
}

function renderBuildingsOwned(mount: HTMLElement, city: City, data: GameData | null): void {
  mount.innerHTML = '';
  const built = cfg.getBuiltBuildingIds?.(city.id);
  mount.appendChild(el('div', 'ptitle',
    `<span>Budynki w mieście${built ? ' (' + built.length + ')' : ''}</span>${built ? '' : PH()}`));
  if (built && data) {
    if (built.length === 0) { mount.appendChild(el('div', 'muted', '(brak — zbuduj pierwszy)')); return; }
    for (const id of built) {
      const def = data.buildings.find(b => b.id === id);
      mount.appendChild(el('div', 'bld', `<span class="bi">\u{1F3DB}️</span><span class="bn">${def ? def.nazwa : id}</span>`));
    }
  } else {
    ['Spichlerz', 'Cegielnia', 'Targowisko', 'Świątynia'].forEach(n =>
      mount.appendChild(el('div', 'bld', `<span class="bi">\u{1F3DB}️</span><span class="bn">${n}</span>`)));
  }
}

function renderGarrison(mount: HTMLElement, city: City): void {
  mount.innerHTML = '';
  const units = cfg.getUnitsAt?.(city.q, city.r);
  mount.appendChild(el('div', 'ptitle',
    `<span>Garnizon${units ? ' (' + units.length + ')' : ''}</span>${units ? '' : PH()}`));
  if (units) {
    if (units.length === 0) { mount.appendChild(el('div', 'muted', '(brak garnizonu)')); return; }
    for (const u of units) {
      const hp = u.health ?? 100;
      const max = u.maxHealth ?? 100;
      const pct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, max)) * 100)));
      const low = pct < 40;
      mount.appendChild(el('div', 'unit',
        `<span class="bi">⚔️</span><div style="flex:1;"><div class="bn">${u.nazwa}</div>` +
        `<div class="hpb"><div class="hpf ${low ? 'hpl' : ''}" style="width:${pct}%"></div></div></div>` +
        `<span style="font-size:0.72em;" class="${low ? 'red' : 'green'}">${hp} HP</span>`));
    }
  } else {
    mount.appendChild(el('div', 'unit', '<span class="bi">\u{1F5E1}️</span><div style="flex:1;"><div class="bn">Włócznik</div><div class="hpb"><div class="hpf" style="width:90%"></div></div></div><span class="green" style="font-size:0.72em;">90 HP</span>'));
    mount.appendChild(el('div', 'unit', '<span class="bi">\u{1F3F9}</span><div style="flex:1;"><div class="bn">Łucznik</div><div class="hpb"><div class="hpf" style="width:65%"></div></div></div><span class="gold" style="font-size:0.72em;">65 HP</span>'));
  }
}

// ---------------------------------------------------------------------------
// Okolica hex grid (real, drawn from the map around the city)
// ---------------------------------------------------------------------------

const TEREN_COL: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]: '#0d2236', [TerenBazowy.Wybrzeze]: '#14506a',
  [TerenBazowy.Laka]: '#243a24', [TerenBazowy.Rownina]: '#3f3815',
  [TerenBazowy.Pustynia]: '#4a3a18', [TerenBazowy.Wzgorza]: '#3a2f18', [TerenBazowy.Gory]: '#2e2e2e',
};
const TEREN_ICON: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]: '\u{1F30A}', [TerenBazowy.Wybrzeze]: '\u{1F30A}',
  [TerenBazowy.Laka]: '\u{1F33F}', [TerenBazowy.Rownina]: '\u{1F33E}',
  [TerenBazowy.Pustynia]: '\u{1F3DC}️', [TerenBazowy.Wzgorza]: '⛰️', [TerenBazowy.Gory]: '\u{1F3D4}️',
};
function hexDist(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q2 - q1, dr = r2 - r1;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}
function rangeName(R: number): string {
  if (R <= 5) return 'małe miasto';
  if (R <= 10) return 'średnie miasto';
  return 'duże miasto';
}
/** Liczba heksów dodanych przez `rings` pierścieni kultury poza promieniem R. */
function ringsTiles(R: number, rings: number): number {
  let n = 0;
  for (let k = 1; k <= rings; k++) n += 6 * (R + k);
  return n;
}
function okStat(key: string, val: string, sub: string): string {
  return `<div class="okstat"><span class="ks">${key}</span><b>${val}</b> <span class="muted">${sub}</span></div>`;
}

/**
 * Kompaktowy podgląd pól obrabianych wokół miasta (ograniczone okno DISPLAY_R).
 * Pełna okolica (do r15) i granice kultury renderuje MAPA na świecie — tu tylko zerknięcie.
 * worked = realny zbiór z getWorkedTiles; brak haka -> fallback (pierścień d<=1).
 */
function renderWorkedPreview(
  gridEl: HTMLElement, city: City, map: GameMap,
  worked: { q: number; r: number }[] | undefined,
): void {
  gridEl.innerHTML = '';
  const DISPLAY_R = Math.min(UI_PARAMS.panel_miasta.okolica_promien, 3);
  const SIZE = UI_PARAMS.panel_miasta.okolica_hex_px, HEX_W = Math.sqrt(3) * SIZE, ROW = 1.5 * SIZE;
  const workedSet = worked ? new Set(worked.map(t => `${t.q},${t.r}`)) : null;
  const cells: { q: number; r: number; cx: number; cy: number; d: number }[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let dq = -DISPLAY_R; dq <= DISPLAY_R; dq++) {
    for (let dr = -DISPLAY_R; dr <= DISPLAY_R; dr++) {
      const q = city.q + dq, r = city.r + dr;
      const d = hexDist(city.q, city.r, q, r);
      if (d > DISPLAY_R) continue;
      const cx = HEX_W * (q + r / 2), cy = ROW * r;
      cells.push({ q, r, cx, cy, d });
      minX = Math.min(minX, cx - HEX_W / 2); maxX = Math.max(maxX, cx + HEX_W / 2);
      minY = Math.min(minY, cy - SIZE); maxY = Math.max(maxY, cy + SIZE);
    }
  }
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const w = Math.ceil(maxX - minX) + 4, h = Math.ceil(maxY - minY) + 4;
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.setAttribute('viewBox', `${minX - 2} ${minY - 2} ${w} ${h}`);
  for (const c of cells) {
    const hex = map.hexes[`${c.q},${c.r}`];
    const teren = hex ? hex.terenBazowy : TerenBazowy.Morze;
    const isLas = hex && hex.nakladka === Nakladka.Las;
    const fill = hex ? (isLas ? '#142714' : (TEREN_COL[teren] ?? '#2a2a2a')) : '#10141a';
    const isCity = c.d === 0;
    const isWorked = !isCity && (workedSet ? workedSet.has(`${c.q},${c.r}`) : c.d <= 1);
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const ang = (60 * i - 30) * Math.PI / 180;
      pts.push((c.cx + SIZE * Math.cos(ang)).toFixed(1) + ',' + (c.cy + SIZE * Math.sin(ang)).toFixed(1));
    }
    const poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('fill', fill);
    poly.setAttribute('stroke', isCity ? '#e0b24a' : (isWorked ? 'rgba(107,191,89,0.9)' : 'rgba(224,178,74,0.22)'));
    poly.setAttribute('stroke-width', isCity ? '2.5' : (isWorked ? '2' : '1'));
    svg.appendChild(poly);
    const txt = document.createElementNS(ns, 'text');
    txt.setAttribute('x', String(c.cx)); txt.setAttribute('y', String(c.cy));
    txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('dominant-baseline', 'central');
    txt.setAttribute('font-size', String(Math.round(SIZE * 0.8)));
    txt.textContent = isCity ? '\u{1F3DB}️' : (hex ? (isLas ? '\u{1F332}' : (TEREN_ICON[teren] ?? '')) : '');
    svg.appendChild(txt);
  }
  gridEl.appendChild(svg);
}

/**
 * Sekcja „Okolica" — kompaktowa (wariant B):
 *  - statystyki: zasięg roboczy (r5/10/15), pól w zasięgu, pól obrabianych (N=ludność), granica kultury,
 *  - mały podgląd pól obrabianych (ograniczone okno),
 *  - hint: pełne terytorium + granice kultury renderuje MAPA na mapie świata.
 * Dane wg haków EKONOMII (getCityWorkedRange / getWorkedTiles); brak haka -> łagodny fallback.
 */
function renderOkolica(root: HTMLElement, city: City, map: GameMap): void {
  const statsEl = root.querySelector('#cs-okstats') as HTMLElement | null;
  const gridEl = root.querySelector('#cs-okolica') as HTMLElement | null;
  const hintEl = root.querySelector('#cs-okhint') as HTMLElement | null;

  const Rwork = cfg.getCityWorkedRange?.(city.id);
  const worked = cfg.getWorkedTiles?.(city.id);
  const borderR = cfg.getCultureState?.(city.id)?.borderRadius ?? 0;

  if (statsEl) {
    const tilesInRange = Rwork !== undefined ? 1 + 3 * Rwork * (Rwork + 1) : undefined;
    statsEl.innerHTML = [
      okStat('Zasięg roboczy', Rwork !== undefined ? `r${Rwork}` : '—', Rwork !== undefined ? rangeName(Rwork) : 'gdy silnik dostarczy'),
      okStat('Pól w zasięgu', tilesInRange !== undefined ? String(tilesInRange) : '—', 'heksów'),
      okStat('Pól obrabianych', worked ? String(worked.length) : '—', `z ${city.population} ludności`),
      okStat('Granica kultury', borderR > 0 ? `+${borderR}` : '0', borderR > 0 ? 'pierścień(e)' : 'brak'),
    ].join('');
  }
  if (gridEl) renderWorkedPreview(gridEl, city, map, worked);
  if (hintEl) {
    if (Rwork !== undefined) {
      const total = 1 + 3 * Rwork * (Rwork + 1) + (borderR > 0 ? ringsTiles(Rwork, borderR) : 0);
      hintEl.textContent = `Pełny zasięg (~${total} pól) i granice kultury widoczne na mapie świata.`;
    } else {
      hintEl.textContent = 'Pełna okolica widoczna na mapie świata (render po stronie MAPY).';
    }
  }
}

// ---------------------------------------------------------------------------
// Compose + render
// ---------------------------------------------------------------------------

let rootEl: HTMLDivElement | null = null;
let activeCity: City | null = null;
let activeMap: GameMap | null = null;
let activeOnClose: () => void = () => {};

/** Cities of the active city's owner (for prev/next navigation). */
function ownerCities(city: City): City[] {
  const all = cfg.getCities?.();
  if (!all) return [city];
  const list = all.filter(c => c.ownerId === city.ownerId);
  return list.length > 0 ? list : [city];
}

function switchCity(dir: -1 | 1): void {
  if (activeCity === null) return;
  const list = ownerCities(activeCity);
  if (list.length < 2) return;
  const idx = list.findIndex(c => c.id === activeCity!.id);
  const next = list[(idx + dir + list.length) % list.length];
  if (next) { activeCity = next; rerender(); }
}

function skeleton(city: City, view: CityView | null): string {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const owner = city.ownerId === 0 ? 'Gracz' : 'AI';
  const multi = ownerCities(city).length > 1;
  const navDis = multi ? '' : 'disabled';
  const fsbtns = SCALES.map(s =>
    `<button class="fsbtn ${s.px === scalePx ? 'active' : ''}" data-px="${s.px}">${s.label}</button>`).join('');
  return `
  <div id="hdr">
    <button class="nav-arr" id="cs-prev" ${navDis} title="Poprzednie miasto">◀</button>
    <span style="color:var(--gold);font-size:1.1em;">★</span>
    <span id="cname">${city.name}</span>
    <button class="nav-arr" id="cs-next" ${navDis} title="Następne miasto">▶</button>
    <div class="mbadge"><span class="muted">Właściciel:</span> <b class="gold">${owner}</b></div>
    <div class="mbadge"><span class="muted">Ludność:</span> <b>${city.population}</b></div>
    <div class="era-b">Epoka ${epoch}</div>
    <div class="mbadge">Nastrój: \u{1F600} <span class="green">Zadowolone</span> ${PH()}</div>
    <div id="hdr-r">
      <button class="hbtn" id="cs-rename" title="Zmień nazwę miasta">✏ Zmień nazwę</button>
      <button class="hbtn" id="cs-manager" title="Zarządca automatyczny">⚙ Zarządca</button>
      <button class="hbtn" id="cs-artview" title="Widok artystyczny">🏛 Widok</button>
      <span class="muted" style="font-size:0.74em;">Czcionka:</span> ${fsbtns}
      <button class="closeb" id="cs-close" title="Zamknij (Esc)">✕</button>
    </div>
  </div>
  <div id="body">
    <div class="col" id="cs-left">${leftPlaceholders(city.population)}<div class="panel" id="cs-owned"></div></div>
    <div class="col" id="cs-center">
      <div class="panel" id="cs-bilans"></div>
      ${tradeSplitPlaceholder(view)}
      <div class="panel" id="cs-magazyn"></div>
      <div class="panel" id="cs-prod"></div>
      <div class="panel" id="cs-build"></div>
    </div>
    <div class="col" id="cs-right"><div class="panel" id="cs-garrison"></div><div class="panel" id="cs-surowce"></div><div class="panel" id="cs-kultura"></div></div>
  </div>
  <div id="ftr">
    <button class="btn" title="Wróć do mapy" id="cs-mapbtn">\u{1F5FA} Mapa</button>
    <button class="btn">\u{1F3D9} Miasta</button>
    <button class="btn">\u{1F52C} Nauka</button>
    <button class="btn">\u{1F91D} Dyplomacja</button>
    <div id="ftr-r"><span>Skarb: <span class="gold">${PH()}</span></span><button class="btn btn-g" title="Kończy ture (klawisz N na mapie)">Zakończ turę ▶</button></div>
  </div>
  <div class="okolica">
    <h3>\u{1F5FA} Okolica miasta</h3>
    <div id="cs-okstats" class="okstats"></div>
    <div class="okwrap">
      <div id="cs-okolica" style="background:var(--panel2);border:1px solid var(--border);border-radius:4px;padding:6px;"></div>
      <div class="oklegend">
        <div class="gold" style="font-weight:700;">Podgląd — pola obrabiane</div>
        <div><span class="sw" style="background:#243a24;"></span>Łąka</div>
        <div><span class="sw" style="background:#3f3815;"></span>Równina</div>
        <div><span class="sw" style="background:#3a2f18;"></span>Wzgórza</div>
        <div><span class="sw" style="background:#142714;"></span>Las</div>
        <div><span class="sw" style="background:#2e2e2e;"></span>Góry</div>
        <div><span class="sw" style="background:#0d2236;"></span>Woda</div>
        <div style="margin-top:0.3em;"><span class="sw" style="outline:2px solid rgba(107,191,89,.9);"></span>Obrabiane (N=ludność)</div>
        <div><span class="sw" style="outline:2px solid #e0b24a;"></span>Centrum miasta</div>
      </div>
      <div id="cs-okhint" class="okhint"></div>
    </div>
  </div>`;
}

function rerender(): void {
  if (rootEl === null || activeCity === null || activeMap === null) return;
  const city = activeCity, map = activeMap, data = gameData();
  const view = data ? computeView(city, map, data) : null;

  rootEl.style.fontSize = scalePx + 'px';
  rootEl.innerHTML = skeleton(city, view);

  const q = (id: string) => rootEl!.querySelector('#' + id) as HTMLElement | null;
  const bil = q('cs-bilans'); if (bil) renderBilans(bil, view);
  const mag = q('cs-magazyn'); if (mag) renderMagazyn(mag, city, view);
  const prod = q('cs-prod'); if (prod) renderProd(prod, city, view);
  const build = q('cs-build'); if (build) renderBuildList(build, city, data, view);
  const owned = q('cs-owned'); if (owned) renderBuildingsOwned(owned, city, data);
  const garr = q('cs-garrison'); if (garr) renderGarrison(garr, city);
  renderOkolica(rootEl, city, map);
  const kult = q('cs-kultura'); if (kult) renderKultura(kult, city, view);
  const sur = q('cs-surowce'); if (sur) renderSurowce(sur, city);

  const close = q('cs-close'); if (close) close.addEventListener('click', () => { activeOnClose(); hideCityPanel(); });
  const mapbtn = q('cs-mapbtn'); if (mapbtn) mapbtn.addEventListener('click', () => { activeOnClose(); hideCityPanel(); });
  const prev = q('cs-prev'); if (prev) prev.addEventListener('click', () => switchCity(-1));
  const next = q('cs-next'); if (next) next.addEventListener('click', () => switchCity(1));
  const rename = q('cs-rename'); if (rename) rename.addEventListener('click', () => {
    const nn = window.prompt('Nowa nazwa miasta:', city.name);
    if (nn && nn.trim()) { cfg.onRename?.(city.id, nn.trim()); rerender(); }
  });
  const manager = q('cs-manager'); if (manager) manager.addEventListener('click', () => { cfg.onAutoManage?.(city.id); });
  const artview = q('cs-artview'); if (artview) artview.addEventListener('click', () => { cfg.onArtView?.(city.id); });
  rootEl.querySelectorAll('.fsbtn').forEach(b => {
    b.addEventListener('click', () => {
      const px = Number((b as HTMLElement).getAttribute('data-px'));
      if (Number.isFinite(px) && px > 0) { scalePx = px; rerender(); }
    });
  });
}

// ---------------------------------------------------------------------------
// Public API (unchanged signatures)
// ---------------------------------------------------------------------------

/** Show the full-screen city view for `city`.  Backward-compatible signature. */
export function showCityPanel(city: City, map: GameMap, onClose: () => void): void {
  ensureStyles();
  if (rootEl === null) {
    rootEl = el('div', 'civ-cs');
    document.body.appendChild(rootEl);
  }
  activeCity = city;
  activeMap = map;
  activeOnClose = onClose;
  rerender();
  rootEl.style.display = 'block';
}

/** Hide the city view. */
export function hideCityPanel(): void {
  if (rootEl) rootEl.style.display = 'none';
}

/** Return true if the city panel is currently visible. */
export function isCityPanelOpen(): boolean {
  return !!rootEl && rootEl.style.display !== 'none';
}
