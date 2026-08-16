/**
 * empireDetailPanel.ts — panel boczny imperium (HUD mapy): parametry + Moc + zasoby + kultura.
 * Wygląd: mockup „Panel Moc imperium v3" (1E, 2026-07-06) — RESKIN, nic nie usunięte.
 * Dane: EmpireDetailSnap.
 */
import {
  buildUchwalaSolSpichlerzII,
  type EmpireDetailSnap,
  type EmpireFoodSnap,
  type EmpireResourceRow,
  type EmpireUchwalaRow,
} from './empireDetailTypes';
import { formatObywateleLabel, formatManpower } from '../game/manpower';
import { stockResourceLabel } from '../game/building-stock-cost';
import { CITIZEN_UPKEEP_RATE_PER_CITIZEN } from '../game/citizen-resource-upkeep';
import { resourceUsageTotal } from '../game/resource-usage-breakdown';
import {
  MIASTA_TABLE_COLUMNS,
  visibleMiastaColumns,
  miastaColumnGridTemplate,
  computeMiastaSummaryRow,
  type MiastaColDef,
} from './empireMiastaTable';
import { mocLabel, mocWithValue } from './power-labels';
import {
  powerRankingValueForMode, sortPowerRankingForMode, type PowerRankingViewMode,
} from './powerOverlayHud';
// Liczby do wyswietlenia bez smieci zmiennoprzecinkowych (Maciej 2026-07-26).
import { formatLiczbaPl, signedPl } from './formatPl';
import { treasuryBalanceSignedTxt } from './treasuryBalanceFormat';
import { brandIconSvg, mapResourceIconSvg } from './icons/brandAssets';
import { daninaLabelGenitive } from '../game/danina-nazwa';
import { HANDEL_PCT_STEP, adjustHandelSplit, normalizePodzialHandlu, snapHandelPct } from '../game/cities';
import type { CityPodzialHandlu, CityPodzialPracy } from '../game/cities';
import {
  WYZYWIENIE_MIN, WYZYWIENIE_MAX, WYZYWIENIE_STEP, formatWyzwienieLabel,
  type PoziomRacji,
} from '../game/population-growth-v85';
import { formatCivBrandLine } from './civBrandDisplay';
import {
  econSliderVisibilityForOnlyEconId,
  empirePanelBlockForSection,
  type EmpirePanelBlock,
} from './empirePanelSectionMap';
import { pushOverlay, popOverlay } from './escapeOverlayStack';
export type { EmpireDetailSnap } from './empireDetailTypes';
export { empireSectionFromHudAct, empirePanelBlockForSection } from './empirePanelSectionMap';

export interface EmpireHandelSplitUiConfig {
  getOwnerDefault?: (ownerId: number) => CityPodzialHandlu | null;
  onOwnerDefaultChange?: (ownerId: number, split: CityPodzialHandlu) => void;
  getDaninaLabel?: () => string;
}

let handelSplitUi: EmpireHandelSplitUiConfig = {};

/** DYSPOZYCJA-85-SUWAK: globalny domyślny podział podatku w panelu imperium. */
export function configureEmpireHandelSplit(cfg: EmpireHandelSplitUiConfig): void {
  handelSplitUi = { ...handelSplitUi, ...cfg };
}

function renderDefaultHandelSplitSection(): string {
  const getDef = handelSplitUi.getOwnerDefault;
  const onChange = handelSplitUi.onOwnerDefaultChange;
  if (!getDef || !onChange) return '';
  const split = normalizePodzialHandlu(getDef(0) ?? { procentPieniadz: 60, procentNauka: 20, procentLuksus: 20 });
  const daninaLbl = handelSplitUi.getDaninaLabel?.() ?? 'Podatek';
  const id = 'emp-handel-split';
  let h = `<div class="civ-emp-sect" data-section="ekonomia-handel-split" id="${id}">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:6px">DOMYŚLNY PODZIAŁ ${esc(daninaLbl.toUpperCase())}</div>`
    + `<div class="civ-emp-note">Nowe miasta dziedziczą ten podział. W panelu miasta możesz włączyć własny override.</div>`;
  h += `<div class="civ-emp-mini" style="margin-top:8px">`;
  for (const row of [
    { key: 'procentPieniadz' as const, label: 'Skarb', cls: 'gold' },
    { key: 'procentNauka' as const, label: 'Nauka', cls: 'blue' },
    { key: 'procentLuksus' as const, label: 'Zamożność', cls: '' },
  ]) {
    h += `<div class="civ-emp-zrow" style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:4px 0">`
      + `<label style="font-size:12px"><span class="${row.cls}">${row.label}</span></label>`
      + `<span data-pct="${row.key}"><b>${split[row.key]}%</b></span></div>`
      + `<input type="range" min="0" max="100" step="${HANDEL_PCT_STEP}" value="${split[row.key]}" `
      + `data-handel-key="${row.key}" style="width:100%;margin:0 0 6px" />`;
  }
  h += `</div><div class="civ-emp-foot">Suma = 100% · kroki ${HANDEL_PCT_STEP}% · dotyczy wszystkich miast bez własnego override.</div></div>`;
  queueMicrotask(() => wireDefaultHandelSplitInputs(split, onChange));
  return h;
}

function wireDefaultHandelSplitInputs(
  initial: CityPodzialHandlu,
  onChange: (ownerId: number, split: CityPodzialHandlu) => void,
): void {
  const host = document.getElementById('emp-handel-split');
  if (!host) return;
  let current = { ...initial };
  for (const inp of Array.from(host.querySelectorAll<HTMLInputElement>('input[data-handel-key]'))) {
    inp.addEventListener('input', () => {
      const key = inp.dataset.handelKey as keyof CityPodzialHandlu;
      current = adjustHandelSplit(current, key, Number(inp.value));
      onChange(0, { ...current });
      for (const other of Array.from(host.querySelectorAll<HTMLInputElement>('input[data-handel-key]'))) {
        const k = other.dataset.handelKey as keyof CityPodzialHandlu;
        other.value = String(current[k]);
        const pct = host.querySelector(`[data-pct="${k}"] b`);
        if (pct) pct.textContent = `${current[k]}%`;
      }
    });
  }
}

/**
 * R-USTAWIENIA-GLOBALNE-LOKALNE (Maciej 2026-08-10, żywa rozmowa): globalne ustawienia
 * grup "Praca" i "Żywność" w panelu cywilizacji na mapie świata — wzorem
 * EmpireHandelSplitUiConfig/renderDefaultHandelSplitSection wyżej (już istniejące dla
 * grupy Skarbiec+Nauka, DYSPOZYCJA-85-SUWAK). Osobna konfiguracja/funkcja żeby NIE
 * dotykać już przetestowanego mechanizmu Handlu (C-025 — zakres tylko tego, co nowe).
 */
export interface EmpireGlobalDefaultsUiConfig {
  getOwnerDefaultPodzialPracy?: (ownerId: number) => CityPodzialPracy | null;
  onOwnerDefaultPodzialPracyChange?: (ownerId: number, split: CityPodzialPracy) => void;
  getOwnerDefaultPoziomRacji?: (ownerId: number) => PoziomRacji | null;
  onOwnerDefaultPoziomRacjiChange?: (ownerId: number, poziom: PoziomRacji) => void;
}

let empireGlobalDefaultsUi: EmpireGlobalDefaultsUiConfig = {};

export function configureEmpireGlobalDefaults(cfg: EmpireGlobalDefaultsUiConfig): void {
  empireGlobalDefaultsUi = { ...empireGlobalDefaultsUi, ...cfg };
}

function renderDefaultPodzialPracySection(): string {
  const getDef = empireGlobalDefaultsUi.getOwnerDefaultPodzialPracy;
  const onChange = empireGlobalDefaultsUi.onOwnerDefaultPodzialPracyChange;
  if (!getDef || !onChange) return '';
  const split = getDef(0) ?? { procentBudynki: 70 };
  const id = 'emp-praca-split';
  const pctB = split.procentBudynki;
  const pctU = 100 - pctB;
  let h = `<div class="civ-emp-sect" data-section="ekonomia-praca-split" id="${id}">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:6px">DOMYŚLNY PODZIAŁ PRACY</div>`
    + `<div class="civ-emp-note">Nowe miasta (i te bez własnego „Indywidualne") dziedziczą ten podział.</div>`;
  h += `<div class="civ-emp-mini" style="margin-top:8px">`
    + `<div class="civ-emp-zrow" style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:4px 0">`
    + `<label style="font-size:12px"><span class="gold">Budynki</span> / <span class="blue">Do puli imperium</span></label>`
    + `<span data-praca-pct><b>${pctB}% / ${pctU}%</b></span></div>`
    + `<input type="range" min="0" max="100" step="${HANDEL_PCT_STEP}" value="${pctB}" `
    + `data-praca-key="procentBudynki" style="width:100%;margin:0 0 6px" /></div>`
    + `<div class="civ-emp-foot">Kroki ${HANDEL_PCT_STEP}% · w lewo → więcej do puli imperium · w prawo → szybsza kolejka budowy.</div></div>`;
  queueMicrotask(() => wireDefaultPodzialPracyInputs(pctB, onChange));
  return h;
}

function wireDefaultPodzialPracyInputs(
  initialPct: number,
  onChange: (ownerId: number, split: CityPodzialPracy) => void,
): void {
  const host = document.getElementById('emp-praca-split');
  if (!host) return;
  const inp = host.querySelector<HTMLInputElement>('input[data-praca-key="procentBudynki"]');
  if (!inp) return;
  inp.addEventListener('input', () => {
    const pctB = snapHandelPct(Number(inp.value));
    onChange(0, { procentBudynki: pctB });
    const lbl = host.querySelector('[data-praca-pct] b');
    if (lbl) lbl.textContent = `${pctB}% / ${100 - pctB}%`;
  });
}

function renderDefaultPoziomRacjiSection(): string {
  const getDef = empireGlobalDefaultsUi.getOwnerDefaultPoziomRacji;
  const onChange = empireGlobalDefaultsUi.onOwnerDefaultPoziomRacjiChange;
  if (!getDef || !onChange) return '';
  const poziom = getDef(0) ?? 4;
  const id = 'emp-zywnosc-racje';
  const steps = poziom / WYZYWIENIE_STEP;
  const minSteps = WYZYWIENIE_MIN / WYZYWIENIE_STEP;
  const maxSteps = WYZYWIENIE_MAX / WYZYWIENIE_STEP;
  // R-DESIGN-11-ZAKLADEK klatka 4 — suwak w stylu `.civ-emp-slider` (zielony, kolor żywności),
  // zamiast systemowego niebieskiego `input[type=range]`; wypełnienie toru liczone z pozycji
  // w zakresie MIN..MAX, tak jak w suwakach Skarbca. / EN: slider restyled to `.civ-emp-slider`
  // (green, the food color) instead of the system-blue range input; track fill from MIN..MAX.
  const fillPct = maxSteps > minSteps ? ((steps - minSteps) / (maxSteps - minSteps)) * 100 : 0;
  let h = `<div class="civ-emp-sect" data-section="ekonomia-zywnosc-racje" id="${id}">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:6px">DOMYŚLNE WYŻYWIENIE</div>`
    + `<div class="civ-emp-note">Nowe miasta (i te bez własnego „Indywidualne") dziedziczą ten poziom Racji.</div>`;
  h += `<div class="civ-emp-mini civ-emp-sp-slider-card">`
    + `<div class="civ-emp-sp-slider-hd">`
    + `<span class="civ-emp-slider-label">Wyżywienie</span>`
    + `<span data-racje-lbl><b>${esc(formatWyzwienieLabel(poziom))}</b></span></div>`
    + `<input type="range" class="civ-emp-slider green" min="${minSteps}" max="${maxSteps}" step="1" `
    + `value="${steps}" style="${sliderFillStyle(fillPct, '#4e9a3f', '#78c95a')}" `
    + `data-racje-key="poziom" /></div>`
    + `<div class="civ-emp-foot">Miasta z lokalnym limitem Spichlerza poniżej tego poziomu i tak obniżą go automatycznie na koniec tury (bez zmiany globalnego ustawienia).</div></div>`;
  queueMicrotask(() => wireDefaultPoziomRacjiInputs(onChange));
  return h;
}

function wireDefaultPoziomRacjiInputs(
  onChange: (ownerId: number, poziom: PoziomRacji) => void,
): void {
  const host = document.getElementById('emp-zywnosc-racje');
  if (!host) return;
  const inp = host.querySelector<HTMLInputElement>('input[data-racje-key="poziom"]');
  if (!inp) return;
  const minSteps = WYZYWIENIE_MIN / WYZYWIENIE_STEP;
  const maxSteps = WYZYWIENIE_MAX / WYZYWIENIE_STEP;
  inp.addEventListener('input', () => {
    const stepsNow = Number(inp.value);
    const poziom = stepsNow * WYZYWIENIE_STEP;
    onChange(0, poziom);
    const lbl = host.querySelector('[data-racje-lbl] b');
    if (lbl) lbl.textContent = esc(formatWyzwienieLabel(poziom));
    // Wypełnienie toru musi nadążać za wartością (jak w suwakach Skarbca) — bez tego zielony
    // pasek zostałby na pozycji z renderu. / EN: keep the track fill in sync with the value.
    const pct = maxSteps > minSteps ? ((stepsNow - minSteps) / (maxSteps - minSteps)) * 100 : 0;
    inp.style.background = sliderFillStyle(pct, '#4e9a3f', '#78c95a');
  });
}

const STYLE_ID = 'civ-empire-panel-css';
let root: HTMLDivElement | null = null;
let bodyEl: HTMLDivElement | null = null;
let getSnap: (() => EmpireDetailSnap) | null = null;
let open = false;
let pendingScrollSection: string | null = null;
/** RUNDA 2 scroll-reset (Evaluator werdykt dla `05328fe6`): ustawiana WYŁĄCZNIE w
 *  `showEmpireDetailPanel()`, tam gdzie wiadomo że to nowe otwarcie/zmiana bloku (nie
 *  zgadywana wewnątrz `render()`, bo `render()` nie odróżnia re-renderu tego samego widoku
 *  od otwarcia nowego — patrz `open` ustawiane PRZED `render()` w obu przypadkach). Panel
 *  zamknięty to `transform:translateX(100%)`, NIE `display:none`, więc `scrollTop` przeżywa
 *  zamknięcie — bez tej flagi ponowne otwarcie/zmiana bloku pokazywałaby scrollTop z
 *  poprzedniego, innego widoku. / EN: set ONLY in `showEmpireDetailPanel()`, at the one place
 *  that actually knows this is a fresh open / block change (not guessed inside `render()`,
 *  since `render()` can't tell a same-view re-render from a fresh open — `open` is set
 *  BEFORE `render()` in both cases). A closed panel is `transform:translateX(100%)`, NOT
 *  `display:none`, so `scrollTop` survives closing — without this flag, reopening / switching
 *  block would show the scrollTop left over from the previous, different view. */
let resetScrollOnNextRender = false;
/** C-PANEL=B (Maciej 2026-07-24): klik żetonu HUD otwiera panel z TYLKO jednym blokiem
 *  (żeby klik „Surowce" pokazywał magazyn, a nie całą ekonomię z Nauką). Trzymane między
 *  renderami (refresh nie resetuje widoku). null = pełny panel (wszystkie bloki). */
let activeSection: string | null = null;
/** P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): tryb widoku Rankingu Mocy — trzymany między
 *  renderami (refresh nie resetuje wyboru), tak jak `activeSection` wyżej. */
let mocViewMode: PowerRankingViewMode = 'total';

function blockForSection(section: string | null): EmpirePanelBlock {
  return empirePanelBlockForSection(section);
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-emp-panel{position:fixed;top:0;right:0;bottom:0;width:min(404px,94vw);z-index:450;
  background:#141a24;border-left:1px solid #2b3543;color:#e8ebf0;
  box-shadow:-18px 0 44px rgba(0,0,0,0.45);
  font:13px/1.45 'Segoe UI',system-ui,-apple-system,sans-serif;
  display:flex;flex-direction:column;transform:translateX(100%);
  transition:transform .22s ease;pointer-events:none;}
.civ-emp-panel.open{transform:translateX(0);pointer-events:auto;}
.civ-emp-panel *{box-sizing:border-box;}
.civ-emp-hdr{display:flex;align-items:flex-start;gap:12px;padding:16px 16px 14px;
  border-bottom:1px solid #242c3a;background:#141a24;flex-shrink:0;}
.civ-emp-hdr-ic{flex:none;width:34px;height:34px;border-radius:50%;background:#1d2634;
  display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;
  overflow:hidden;}
.civ-emp-hdr-portrait{display:block;width:100%;height:100%;object-fit:cover;
  object-position:center top;border-radius:50%;}
.civ-emp-hdr-tx{flex:1;min-width:0;}
.civ-emp-civ-name{font-size:18px;font-weight:700;color:#e8ebf0;line-height:1.1;}
.civ-emp-civ-name.has-brand-tip{cursor:help;}
.civ-emp-civ-sub{display:none;}
.civ-emp-info-tip{display:inline-flex;align-items:center;justify-content:center;
  width:16px;height:16px;border-radius:50%;border:1px solid #3a4657;
  background:#1a2230;color:#9aa4b2;font-size:10px;font-weight:700;line-height:1;
  cursor:help;flex:none;vertical-align:middle;margin-left:6px;}
.civ-emp-info-tip:hover{color:#e8ebf0;border-color:#4a5668;}
.civ-emp-res-hdr-row{display:flex;align-items:center;gap:6px;margin-bottom:10px;}
.civ-emp-res-hdr-row .civ-emp-eyebrow{margin:0;}
.civ-emp-res-hdr-sub{font-size:11px;color:#7d8798;font-weight:400;letter-spacing:0;}
.civ-emp-res-hdr-ic{flex:none;width:14px;height:14px;display:flex;align-items:center;
  justify-content:center;color:#7d8798;}
.civ-emp-res-hdr-ic svg{width:100%;height:100%;display:block;}
.civ-emp-close{flex:none;width:30px;height:30px;border-radius:7px;border:1px solid #2f3947;
  background:#1a2230;color:#9aa4b2;font-size:15px;cursor:pointer;line-height:1;}
.civ-emp-close:hover{color:#e8ebf0;border-color:#3a4657;}
.civ-emp-body{flex:1;overflow-y:auto;}
.civ-emp-body::-webkit-scrollbar{width:10px;}
.civ-emp-body::-webkit-scrollbar-thumb{background:#2b3543;border-radius:6px;}
.civ-emp-body::-webkit-scrollbar-track{background:transparent;}
.civ-emp-sect{padding:14px 16px 4px;scroll-margin-top:8px;}
.civ-emp-sect.sep{margin-top:6px;border-top:1px solid #242c3a;padding-top:16px;}
.civ-emp-eyebrow{font-size:11px;letter-spacing:1.4px;color:#7d8798;font-weight:600;}
.civ-emp-title{font-size:14px;font-weight:700;color:#d9a441;margin-bottom:8px;}
.civ-emp-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
.civ-emp-chip{border:1px solid #2b3543;border-radius:8px;padding:8px 10px;background:#171e2a;}
.civ-emp-chip .k{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#7d8798;}
.civ-emp-chip .v{font-size:13px;font-weight:600;color:#e8ebf0;margin-top:2px;word-break:break-word;}
.civ-emp-chip .v.gold{color:#d9a441;}
.civ-emp-chip.wide{grid-column:1/-1;}
.civ-emp-bonus{font-size:12px;color:#b8c4d8;line-height:1.45;padding:6px 8px;margin-top:6px;
  border-left:2px solid #3a5572;background:#171e2a;border-radius:0 6px 6px 0;}
.civ-emp-bonus .tag{font-size:9px;color:#7a8a9a;text-transform:uppercase;margin-left:6px;}
.civ-emp-uchwaly{margin-top:10px;}
.civ-emp-uchwaly-title{font-size:10px;letter-spacing:1.1px;color:#d9a441;font-weight:600;margin-bottom:6px;}
.civ-emp-uchwala{font-size:12px;color:#d4e4f4;line-height:1.45;padding:8px 10px;margin-top:6px;
  border-left:3px solid #d9a441;background:#1a2430;border-radius:0 6px 6px 0;}
.civ-emp-uchwala .nm{font-weight:600;color:#e8ebf0;}
.civ-emp-uchwala .tag{font-size:9px;color:#a89060;text-transform:uppercase;margin-left:6px;}
.civ-emp-uchwala .fx{display:block;margin-top:4px;color:#b8c4d8;}
.civ-emp-moc-big{font-size:20px;font-weight:800;color:#d9a441;margin-top:8px;}
.civ-emp-moc-sub{font-size:12px;color:#9aa4b2;margin-top:3px;}
.civ-emp-moc-sub b{color:#d9a441;}
.civ-emp-two{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;}
.civ-emp-box{border:1px solid #2b3543;border-radius:8px;padding:10px 12px;background:#171e2a;}
.civ-emp-box .k{font-size:10px;letter-spacing:1px;color:#7d8798;font-weight:600;}
.civ-emp-box .v{font-size:14px;font-weight:700;margin-top:5px;color:#e8ebf0;}
.civ-emp-tbl{margin-top:14px;}
.civ-emp-tbl-h,.civ-emp-tbl-r{display:grid;grid-template-columns:1.35fr 0.5fr 0.55fr 0.5fr 0.5fr;
  column-gap:6px;}
.civ-emp-tbl-h{font-size:9.5px;letter-spacing:0.6px;color:#7d8798;font-weight:600;
  padding:0 0 8px;border-bottom:1px solid #242c3a;}
.civ-emp-tbl-h>div:not(:first-child){text-align:right;}
.civ-emp-tbl-r{align-items:baseline;padding:9px 0;border-bottom:1px solid #1f2733;}
.civ-emp-tbl-r .nm{font-size:12.5px;color:#e2e6ec;}
.civ-emp-tbl-r .src{font-size:10.5px;color:#6f7889;margin-top:2px;line-height:1.3;}
.civ-emp-tbl-r .qty{text-align:right;font-size:12.5px;color:#cfd5de;}
.civ-emp-tbl-r .wsp{text-align:right;font-size:12.5px;color:#9aa4b2;}
.civ-emp-tbl-r .pkt{text-align:right;font-size:12.5px;color:#d9a441;font-weight:700;}
.civ-emp-tbl-r .pct{text-align:right;font-size:12px;color:#8a93a4;}
.civ-emp-foot{font-size:10.5px;color:#6f7889;font-style:italic;line-height:1.4;margin-top:10px;}
.civ-emp-rank{font-size:13px;color:#cfd5de;line-height:1.9;}
.civ-emp-rank .you{display:flex;align-items:center;gap:6px;color:#d9a441;font-weight:700;margin-top:2px;}
.civ-emp-mocview{display:flex;gap:6px;margin-top:8px;}
.civ-emp-mocview-btn{flex:1;padding:6px 4px;border-radius:6px;border:1px solid #2b3543;
  background:#171e2a;color:#9aa4b2;font-size:11px;font-weight:600;cursor:pointer;text-align:center;}
.civ-emp-mocview-btn:hover{border-color:#3a4657;color:#cfd5de;}
.civ-emp-mocview-btn.active{background:rgba(217,164,65,0.16);border-color:#d9a441;color:#d9a441;}
.civ-emp-resp{margin:12px 0 4px;padding:11px 14px;border-radius:8px;background:#1c2431;
  border:1px solid #2b3543;font-size:12.5px;color:#cfd5de;}
.civ-emp-resp b{color:#e8ebf0;}
.civ-emp-zrow{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;
  scroll-margin-top:8px;}
.civ-emp-zrow.brd{border-bottom:1px solid #1f2733;}
.civ-emp-zrow .lbl{font-size:13px;color:#e2e6ec;}
.civ-emp-zrow .val{white-space:nowrap;}
.civ-emp-zrow .val b{font-size:15px;color:#e8ebf0;}
.civ-emp-zrow .val b.gold{color:#d9a441;}
.civ-emp-zrow .val .d{margin-left:8px;}
.civ-emp-zrow .val .d.pos{color:#78c95a;}
.civ-emp-zrow .val .d.neg{color:#e07a7a;}
.civ-emp-zrow .val .d.z{color:#6f7889;}
.civ-emp-mini{border:1px solid #232b38;border-radius:7px;overflow:hidden;margin:2px 0 8px;
  scroll-margin-top:8px;}
.civ-emp-mini-scroll{overflow-x:auto;}
.civ-emp-mini-h,.civ-emp-mini-r{display:grid;padding:7px 10px;column-gap:6px;}
.civ-emp-mini-h{font-size:10px;letter-spacing:0.35px;color:#7d8798;font-weight:600;background:#1a2230;}
.civ-emp-mini-h-cell{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;}
.civ-emp-mini-h-ic{display:inline-flex;align-items:center;justify-content:center;width:12px;height:12px;color:#9aa4b2;flex-shrink:0;}
.civ-emp-mini-h-ic svg{width:100%;height:100%;display:block;}
.civ-emp-mini-h-txt{font-size:9px;letter-spacing:0.25px;line-height:1.15;white-space:normal;word-break:break-word;}
.civ-emp-mini-r{font-size:12px;color:#cfd5de;}
.civ-emp-mini-r>div{min-width:0;}
.civ-emp-mini-r+.civ-emp-mini-r{border-top:1px solid #1f2733;}
/* — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA punkt 2 (Maciej 2026-08-12) — filtr kolumn + wiersz
   podsumowania tabeli „Miasta" — */
.civ-emp-colfilter{display:flex;flex-wrap:wrap;gap:6px 14px;margin:2px 0 8px;padding:8px 10px;
  border:1px solid #232b38;border-radius:7px;background:#171e2a;}
.civ-emp-colchk{display:flex;align-items:center;gap:5px;font-size:11px;color:#b8c4d8;
  cursor:pointer;user-select:none;}
.civ-emp-colchk input{accent-color:#d9a441;cursor:pointer;margin:0;}
.civ-emp-mini-summary{background:#1a2230;font-weight:700;color:#d9a441;
  border-top:1px solid #3a4657;}
.civ-emp-bar{height:10px;border-radius:6px;background:#1f2733;overflow:hidden;margin:2px 0 10px;}
.civ-emp-bar .fill{height:100%;background:linear-gradient(90deg,#4e9a3f,#78c95a);}
.civ-emp-bar .fill.warn{background:linear-gradient(90deg,#6a4010,#d9a441);}
.civ-emp-bar .fill.low{background:linear-gradient(90deg,#5a2020,#e07a7a);}
.civ-emp-note{font-size:11.5px;color:#9aa4b2;line-height:1.5;margin-bottom:8px;}
.civ-emp-note b{color:#e8ebf0;}
.civ-emp-kult-line{font-size:12.5px;color:#cfd5de;margin-bottom:4px;}
.civ-emp-kult-line b{color:#e8ebf0;}
.civ-emp-kult-line.muted{font-size:12px;color:#9aa4b2;}
.civ-emp-kult-line.gold{font-size:12px;color:#d9a441;}
.civ-emp-empty{font-size:12px;color:#8a93a4;padding:8px 0;}
.civ-emp-backdrop{position:fixed;inset:0;z-index:449;background:rgba(0,0,0,0.35);
  opacity:0;pointer-events:none;transition:opacity .2s;}
.civ-emp-backdrop.open{opacity:1;pointer-events:auto;}

/* — MAGAZYN PAŃSTWA (surowce) — SUROW-UI-A1 (Maciej 2026-07-24) — */
.civ-emp-res-lbl{font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:#7d8798;
  font-weight:600;margin:14px 0 8px;padding-bottom:6px;border-bottom:1px solid #242c3a;}
.civ-emp-res-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px;}
.civ-emp-res-card{border:1px solid #2b3543;border-radius:8px;padding:10px 11px;background:#171e2a;
  display:flex;flex-direction:column;gap:8px;cursor:default;}
.civ-emp-res-card.bad{border-color:#4a2a2a;}
.civ-emp-res-card.warn{border-color:#4a3a1a;}
.civ-emp-res-top{display:flex;align-items:center;gap:8px;}
.civ-emp-res-ic{flex:none;line-height:1;width:18px;height:18px;display:flex;
  align-items:center;justify-content:center;color:#cfd5de;}
.civ-emp-res-ic svg{width:100%;height:100%;display:block;}
.civ-emp-res-nm{flex:1;min-width:0;}
.civ-emp-res-nm .nm{font-size:12.5px;font-weight:600;color:#e2e6ec;}
.civ-emp-res-rate{font-size:10.5px;font-weight:700;font-variant-numeric:tabular-nums;
  padding:2px 6px;border-radius:999px;white-space:nowrap;flex:none;}
.civ-emp-res-rate-stack{display:flex;flex-direction:column;align-items:flex-end;gap:1px;
  padding:3px 6px;border-radius:8px;background:rgba(15,20,28,.55);flex:none;}
.civ-emp-res-rate-line{font-size:9.5px;font-weight:700;font-variant-numeric:tabular-nums;
  line-height:1.2;white-space:nowrap;}
.civ-emp-res-rate-line.prod{color:#78c95a;}
.civ-emp-res-rate-line.diplo-out{color:#e07a7a;}
.civ-emp-res-rate-line.diplo-in{color:#8ec5ff;}
.civ-emp-res-rate-line.net{margin-top:1px;padding-top:2px;border-top:1px solid rgba(255,255,255,.1);}
.civ-emp-res-rate-line.net.good{color:#78c95a;}
.civ-emp-res-rate-line.net.warn{color:#d9a441;}
.civ-emp-res-rate-line.net.bad{color:#e07a7a;}
.civ-emp-res-rate.good{color:#78c95a;background:rgba(120,201,90,.14);}
.civ-emp-res-rate.warn{color:#d9a441;background:rgba(217,164,65,.14);}
.civ-emp-res-rate.bad{color:#e07a7a;background:rgba(224,122,122,.14);}
.civ-emp-res-amt{display:flex;align-items:baseline;gap:5px;font-variant-numeric:tabular-nums;}
.civ-emp-res-amt .cur{font-size:15px;font-weight:700;color:#e8ebf0;}
.civ-emp-res-amt .cap{font-size:11px;color:#7d8798;}
/* Plakietka stanu = kolor + SŁOWO (decyzja Designera 2026-08-14 pkt 4) — nigdy sam kolor ramki.
   / EN: state badge = colour + WORD, never colour alone. */
.civ-emp-res-flag-pill{margin-left:auto;font-size:9.5px;font-weight:700;letter-spacing:.03em;
  text-transform:uppercase;padding:2px 6px;border-radius:999px;white-space:nowrap;flex:none;}
.civ-emp-res-flag-pill.warn{color:#d9a441;background:rgba(217,164,65,.14);}
.civ-emp-res-flag-pill.bad{color:#e07a7a;background:rgba(224,122,122,.14);}
.civ-emp-res-flag-note{font-size:10px;line-height:1.3;font-weight:600;margin-top:-2px;}
.civ-emp-res-flag-note.warn{color:#d9a441;}
.civ-emp-res-flag-note.bad{color:#e07a7a;}
.civ-emp-res-bar{height:6px;border-radius:999px;background:#1f2733;overflow:hidden;}
.civ-emp-res-bar>span{display:block;height:100%;border-radius:999px;}
.civ-emp-res-bar.good>span{background:linear-gradient(90deg,#4e9a3f,#78c95a);}
.civ-emp-res-bar.warn>span{background:linear-gradient(90deg,#6a4010,#d9a441);}
.civ-emp-res-bar.bad>span{background:linear-gradient(90deg,#5a2020,#e07a7a);}
/* — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA (Maciej 2026-08-12) — rozwinięcie „Zobacz szczegóły" — */
.civ-emp-res-usage{margin-top:2px;}
.civ-emp-res-usage>summary{list-style:none;cursor:pointer;font-size:10.5px;color:#8ec5ff;
  font-weight:600;user-select:none;}
.civ-emp-res-usage>summary::-webkit-details-marker{display:none;}
.civ-emp-res-usage>summary::before{content:'▸ ';}
.civ-emp-res-usage[open]>summary::before{content:'▾ ';}
.civ-emp-res-usage-body{margin-top:6px;padding:8px 9px;border-radius:6px;background:rgba(15,20,28,.55);
  display:flex;flex-direction:column;gap:3px;}
.civ-emp-res-usage-row{display:flex;justify-content:space-between;gap:8px;font-size:11px;
  font-variant-numeric:tabular-nums;color:#b8c4d8;}
.civ-emp-res-usage-row .v{color:#e07a7a;font-weight:600;}
.civ-emp-res-usage-row.total{margin-top:2px;padding-top:4px;border-top:1px solid rgba(255,255,255,.1);
  font-weight:700;color:#cfd5de;}
.civ-emp-res-usage-row.total .v{color:#e07a7a;}
.civ-emp-res-usage-note{margin-top:5px;font-size:10px;line-height:1.4;color:#7d8798;}
.civ-emp-res-usage-note b{color:#78c95a;}
.civ-emp-res-foodnote{margin:14px 0 4px;padding:10px 12px;border-radius:8px;border:1px dashed #2b3543;
  background:rgba(142,197,255,.05);font-size:12px;color:#b8c4d8;display:flex;gap:9px;
  align-items:flex-start;}
.civ-emp-res-foodnote .k{color:#8ec5ff;font-weight:700;flex:none;}
.civ-emp-res-foodnote b{color:#cfd5de;}
.civ-emp-res-legend{display:flex;gap:14px;flex-wrap:wrap;padding-top:10px;margin-top:10px;
  border-top:1px solid #242c3a;font-size:11px;color:#7d8798;}
.civ-emp-res-legend span{display:flex;align-items:center;gap:6px;}
.civ-emp-res-legend i{width:18px;height:6px;border-radius:999px;display:inline-block;}
.civ-emp-res-legend i.good{background:linear-gradient(90deg,#4e9a3f,#78c95a);}
.civ-emp-res-legend i.warn{background:linear-gradient(90deg,#6a4010,#d9a441);}
.civ-emp-res-legend i.bad{background:linear-gradient(90deg,#5a2020,#e07a7a);}
/* Podpis hero Surowców — semantyka kolorów TYLKO w tej sekcji (osobna klasa obok
   .civ-emp-hero-sub, żeby nie ruszać podpisów hero w pozostałych zakładkach).
   / EN: Resources hero sub-caption — colour semantics scoped to this section only. */
.civ-emp-res-sub b.good{color:#78c95a;}
.civ-emp-res-sub b.warn{color:#d9a441;}
.civ-emp-res-sub b.bad{color:#e07a7a;}
/* Kubełek „bez zmian" (tempo = 0) — szary neutralny #9aa4b2, ten sam odcień, którego plik
   używa dla wartości bez wydźwięku (podpisy hero, noty italic). NIE zielony: zerowe tempo
   nie jest sukcesem, a przy poprzednim liczeniu wpadało do „rośnie" i zawyżało ten licznik.
   / EN: "no change" bucket (rate = 0) — the file's existing neutral gray, deliberately NOT
   green: a zero rate is not growth, yet it used to be counted as such. */
.civ-emp-res-sub b.neutral{color:#9aa4b2;}

/* — R-DESIGN-11-ZAKLADEK faza 1 (Maciej 2026-08-13) — klasy uogólnione z sekcji Moc na
   wszystkie 11 zakładek panelu (§4 handoffu designera), pierwsze użycie: Skarbiec — */
.civ-emp-hero{font-size:20px;font-weight:800;color:#d9a441;margin-top:8px;}
.civ-emp-hero.pos{color:#d9a441;}
.civ-emp-hero.neg{color:#e07a7a;}
.civ-emp-hero-sub{font-size:12px;color:#9aa4b2;margin-top:3px;}
.civ-emp-hero-sub b{color:#d9a441;}
.civ-emp-alert{margin-top:12px;padding:10px 12px;border-radius:8px;border:1px solid #4a2a2a;
  background:rgba(224,122,122,.07);font-size:12px;color:#e6c4c4;line-height:1.45;}
.civ-emp-alert b{color:#e07a7a;}
/* Wariant OSTRZEGAWCZY (żółty) — zdarzenie NADCHODZĄCE, nie trwające. Odtwarza rozróżnienie
   dwóch poziomów pilności, które istniało przed reskinem (np. „Głód wojska" = czerwony,
   „Głód wojska za N tur" = żółty) i zostało wtedy spłaszczone do jednego czerwonego stylu.
   Kolory to ta sama para semantyczna „warn", której plik używa wszędzie indziej: #d9a441
   z obwódką #4a3a1a i tłem rgba(217,164,65,…) — patrz .civ-emp-res-card.warn / .civ-emp-bar
   .fill.warn. / EN: WARNING variant (amber) for an UPCOMING event, restoring the two urgency
   levels that existed before the reskin flattened both into the red alert. Uses the same
   semantic "warn" palette the rest of the file already uses. */
.civ-emp-alert.warn{border-color:#4a3a1a;background:rgba(217,164,65,.07);color:#e6dcc4;}
.civ-emp-alert.warn b{color:#d9a441;}
/* — R-DESIGN-11-ZAKLADEK faza 3 (§4 handoffu designera) — wiersz kategorii z checkboxem.
   Odznaczony GAŚNIE (modyfikator .off), NIE znika — gracz ma widzieć, co sam odznaczył
   (§6 handoffu: „Odznaczone pozycje gasną (nie znikają) i wypadają z sumy"). Pierwsze użycie:
   typy surowca w zakładce Miasto. / EN: category row with a checkbox; unchecked rows DIM
   instead of disappearing, so the player can see what they switched off, and drop out of the sum. */
.civ-emp-grp-row{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid #2b3543;
  border-radius:7px;background:#171e2a;cursor:pointer;user-select:none;}
.civ-emp-grp-row input{accent-color:#d9a441;cursor:pointer;margin:0;flex:none;}
.civ-emp-grp-row .nm{flex:1;min-width:0;font-size:12px;color:#e2e6ec;}
.civ-emp-grp-row .qty{font-size:11px;color:#7d8798;font-variant-numeric:tabular-nums;}
.civ-emp-grp-row .val{font-size:12px;color:#d9a441;font-weight:700;font-variant-numeric:tabular-nums;
  min-width:58px;text-align:right;}
.civ-emp-grp-row.off .nm{color:#8a93a4;}
.civ-emp-grp-row.off .val{color:#7d8798;font-weight:600;}
.civ-emp-grp-list{display:flex;flex-direction:column;gap:4px;}
/* Wiersz „CAŁA CYWILIZACJA" pod listą kategorii — nazwa wprost z §6 handoffu (NIE „SUMA"). */
.civ-emp-grp-sum{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:7px;
  background:#1a2230;border:1px solid #3a4657;}
.civ-emp-grp-sum .nm{flex:1;font-size:12px;font-weight:700;color:#d9a441;}
.civ-emp-grp-sum .val{font-size:13px;font-weight:800;color:#d9a441;font-variant-numeric:tabular-nums;}
.civ-emp-slider{-webkit-appearance:none;-moz-appearance:none;appearance:none;width:100%;height:8px;
  border-radius:999px;cursor:pointer;margin:0 0 6px;background:#1f2733;display:block;}
.civ-emp-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;
  border-radius:50%;border:2px solid #141a24;box-shadow:0 1px 4px rgba(0,0,0,.6);cursor:pointer;
  background:#d9a441;}
.civ-emp-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;border:2px solid #141a24;
  box-shadow:0 1px 4px rgba(0,0,0,.6);cursor:pointer;background:#d9a441;}
.civ-emp-slider::-moz-range-track{height:8px;border-radius:999px;background:transparent;}
/* Rozbite na OSOBNE regułki -webkit/-moz per wariant (Evaluator, Panel 11 zakladek Faza 1
   Skarbiec, 6afdde92): łączenie ::-webkit-slider-thumb i ::-moz-range-thumb w JEDNEJ liście
   selektorów unieważnia CAŁĄ regułę w OBU przeglądarkach (nieznany pseudo-element jednego
   dostawcy psuje parsowanie selektora dla drugiego) — dowód CSSOM: z 7 zapisanych regułek
   przyjęte tylko 2 (gold, jedyna bez konfliktu). 8 regułek zamiast 4, po jednej per dostawca.
   / EN: split into SEPARATE -webkit/-moz rules per variant — combining ::-webkit-slider-thumb
   and ::-moz-range-thumb in ONE selector list invalidates the WHOLE rule in BOTH browsers
   (an unknown vendor pseudo-element breaks selector parsing for the other vendor too). */
.civ-emp-slider.gold::-webkit-slider-thumb{background:#d9a441;}
.civ-emp-slider.gold::-moz-range-thumb{background:#d9a441;}
.civ-emp-slider.blue::-webkit-slider-thumb{background:#8ec5ff;}
.civ-emp-slider.blue::-moz-range-thumb{background:#8ec5ff;}
.civ-emp-slider.neutral::-webkit-slider-thumb{background:#9aa4b2;}
.civ-emp-slider.neutral::-moz-range-thumb{background:#9aa4b2;}
.civ-emp-slider.green::-webkit-slider-thumb{background:#78c95a;}
.civ-emp-slider.green::-moz-range-thumb{background:#78c95a;}
/* Etykiety suwaków (Skarb/Nauka/Zamożność) — zakresowane pod .civ-emp-slider-label, żeby NIE
   kolidować z niepowiązanymi .gold/.blue z innych komponentów (.civ-emp-chip .v.gold itp.).
   / EN: slider labels — scoped under .civ-emp-slider-label so they don't collide with
   unrelated .gold/.blue selectors from other components. */
.civ-emp-slider-label.gold{color:#d9a441;}
.civ-emp-slider-label.blue{color:#8ec5ff;}
.civ-emp-slider-label.neutral{color:#cfd5de;}
/* — R-DESIGN-11-ZAKLADEK klatka 4 (Maciej 2026-08-13) — SPICHLERZ CENTRALNY, oba stany makiety
   (A: zapas zdrowy, B: realny deficyt). Wszystko zakresowane pod .civ-emp-sp-*, żeby reskin
   tej jednej zakładki nie ruszył pozostałych sekcji panelu.
   EN: GRANARY tab, both mockup states; everything scoped under .civ-emp-sp-* so this one tab's
   reskin cannot leak into the other sections of the panel. */
.civ-emp-sp-eyebrow{display:flex;align-items:center;gap:6px;}
.civ-emp-sp-eyebrow-ic{display:inline-flex;align-items:center;justify-content:center;width:14px;
  height:14px;color:#7d8798;flex:none;}
.civ-emp-sp-eyebrow-ic svg{width:100%;height:100%;display:block;}
.civ-emp-sp-hero{display:flex;align-items:baseline;gap:8px;}
.civ-emp-sp-hero .cap{font-size:13px;color:#7d8798;font-weight:600;}
.civ-emp-sp-hero .ic{display:inline-flex;align-items:center;justify-content:center;width:16px;
  height:16px;align-self:center;flex:none;color:#d9a441;}
.civ-emp-sp-hero.neg .ic{color:#e07a7a;}
.civ-emp-sp-hero .ic svg{width:100%;height:100%;display:block;}
.civ-emp-hero-sub b.pos{color:#78c95a;}
.civ-emp-hero-sub b.neg{color:#e07a7a;}
.civ-emp-sp-bar{margin:10px 0;}
/* Stan alarmowy przy zapasie 0: sama szerokość 0% dałaby pusty tor, nieodróżnialny od stanu „brak
   danych". Makieta (klatka 4B) rysuje w tym miejscu czerwony ślad — minimalna szerokość zapewnia,
   że alarm jest widoczny. Nie zmienia żadnej liczby, tylko widoczność paska.
   EN: alarm state at zero stock — a bare 0% width would render an empty track indistinguishable
   from "no data"; the mockup draws a red sliver here. No number changes, only bar visibility. */
.civ-emp-sp-bar .fill.low{min-width:3%;}
.civ-emp-sp-alert{display:flex;gap:9px;align-items:flex-start;margin-bottom:8px;}
.civ-emp-sp-alert-ic{display:inline-flex;align-items:center;justify-content:center;width:16px;
  height:16px;flex:none;margin-top:1px;}
.civ-emp-sp-alert-ic svg{width:100%;height:100%;display:block;}
.civ-emp-alert b.n{color:#e8ebf0;}
.civ-emp-sp-row{padding:6px 0;}
.civ-emp-sp-row .val .d{font-weight:600;font-variant-numeric:tabular-nums;}
.civ-emp-sp-sum{font-variant-numeric:tabular-nums;}
.civ-emp-sp-city-nm{display:flex;align-items:center;gap:5px;min-width:0;}
.civ-emp-sp-city-nm>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-emp-sp-unfed-ic{display:inline-flex;align-items:center;justify-content:center;width:11px;
  height:11px;flex:none;}
.civ-emp-sp-unfed-ic svg{width:100%;height:100%;display:block;}
/* Kolumny liczbowe (PRODUKCJA / KOSZT RACJI / BILANS / WZROST%) do prawej we WSZYSTKICH wierszach
   — nagłówek, dane i SUMA — jak w tabeli per miasto Skarbca.
   EN: numeric columns right-aligned in ALL rows, as in the Treasury per-city table. */
.civ-emp-sp-city-tbl .civ-emp-mini-h-cell:nth-child(n+2){align-items:flex-end;text-align:right;}
/* Nagłówki tej tabeli w JEDNEJ linii — przy 404px „PRODUKCJA" i „WZROST%" łamały się na dwie
   linie i rozpychały wiersz nagłówka. / EN: single-line headers — at 404px "PRODUKCJA" and
   "WZROST%" wrapped onto two lines and inflated the header row. */
.civ-emp-sp-city-tbl .civ-emp-mini-h-txt{white-space:nowrap;letter-spacing:0.1px;}
.civ-emp-sp-city-tbl .civ-emp-mini-r>div:nth-child(n+2){text-align:right;
  font-variant-numeric:tabular-nums;}
.civ-emp-sp-slider-card{margin-top:8px;padding:11px 12px 12px;background:#171e2a;}
.civ-emp-sp-slider-hd{display:flex;align-items:baseline;gap:8px;margin-bottom:7px;}
.civ-emp-sp-slider-hd .civ-emp-slider-label{flex:1;font-size:12px;color:#cfd5de;}
.civ-emp-sp-slider-hd>span:last-child{font-size:13px;font-weight:700;color:#e8ebf0;}
.civ-emp-tbl-sum{display:grid;column-gap:6px;align-items:baseline;padding:11px 0 9px;}
.civ-emp-tbl-sum>div:first-child{font-size:13px;color:#e8ebf0;font-weight:700;}
.civ-emp-tbl-sum>div:last-child{text-align:right;font-size:15px;color:#d9a441;font-weight:800;}
.civ-emp-tbl-sum>div:last-child.pos{color:#d9a441;}
.civ-emp-tbl-sum>div:last-child.neg{color:#e07a7a;}
/* Tabela per miasto Skarbca — kolumny liczbowe (DO SKARBCA / UTRZYMANIE) wyrównane do prawej we
   WSZYSTKICH wierszach (nagłówek + dane + SUMA), spójnie z makietą — poprzednio tylko wiersz
   SUMA miał text-align:right inline, wiersze danych były do lewej. Zakresowane pod
   .civ-emp-skarbiec-city-tbl, żeby nie ruszać innych tabel .civ-emp-mini w panelu.
   / EN: Treasury per-city table — numeric columns right-aligned in ALL rows (header + data +
   SUM), consistent with the mockup — previously only the SUM row had inline text-align:right.
   Scoped under .civ-emp-skarbiec-city-tbl so other .civ-emp-mini tables are untouched. */
.civ-emp-skarbiec-city-tbl .civ-emp-mini-h-cell:nth-child(2),
.civ-emp-skarbiec-city-tbl .civ-emp-mini-h-cell:nth-child(3){align-items:flex-end;text-align:right;}
.civ-emp-skarbiec-city-tbl .civ-emp-mini-r>div:nth-child(2),
.civ-emp-skarbiec-city-tbl .civ-emp-mini-r>div:nth-child(3){text-align:right;}
/* RECYDYWA naprawy wyżej — Faza 2 (Praca/Nauka/Religia, 9a539197) stworzyła 3 NOWE tabele per
   miasto i żadnej nie dała analogicznej klasy: dane wyrównane do lewej (start), wiersz SUMA
   do prawej (inline) — dwie konwencje w jednej tabeli, ten sam defekt co Skarbiec przed
   naprawą wyżej. Praca/Nauka: wszystkie kolumny liczbowe do prawej (nagłówek + dane), spójnie
   z SUMĄ. Religia: tylko WYZNAWCY jest liczbą — RELIGIA to nazwa (tekst), zostaje do lewej,
   zgodnie z makietą (klatka 11, kolumna RELIGIA bez text-align:right).
   / EN: RELAPSE of the fix above — Phase 2 (Labor/Science/Religion, 9a539197) created 3 NEW
   per-city tables and gave none of them an analogous class: data rows left-aligned (start), SUM
   row right-aligned (inline) — two conventions in one table, same defect as Treasury before its
   fix above. Labor/Science: all numeric columns right-aligned (header + data), consistent with
   SUM. Religion: only WYZNAWCY (adherents) is numeric — RELIGIA is a name (text) and stays left,
   matching the mockup (frame 11, RELIGIA column has no text-align:right). */
.civ-emp-praca-city-tbl .civ-emp-mini-h-cell:nth-child(2),
.civ-emp-praca-city-tbl .civ-emp-mini-h-cell:nth-child(3){align-items:flex-end;text-align:right;}
.civ-emp-praca-city-tbl .civ-emp-mini-r>div:nth-child(2),
.civ-emp-praca-city-tbl .civ-emp-mini-r>div:nth-child(3){text-align:right;}
.civ-emp-nauka-city-tbl .civ-emp-mini-h-cell:nth-child(2){align-items:flex-end;text-align:right;}
.civ-emp-nauka-city-tbl .civ-emp-mini-r>div:nth-child(2){text-align:right;}
.civ-emp-religia-city-tbl .civ-emp-mini-h-cell:nth-child(3){align-items:flex-end;text-align:right;}
.civ-emp-religia-city-tbl .civ-emp-mini-r>div:nth-child(3){text-align:right;}
/* Armia (faza 3, klatka 7 makiety) — tabela rekrutów per miasto: MIASTO tekstem do lewej,
   4 kolumny liczbowe (REKRUCI / MAX / ODNOWA / JEDN.) do prawej w nagłówku, danych i wierszu
   RAZEM — ta sama konwencja co Skarbiec/Praca/Nauka wyżej, bez powtarzania inline styli.
   / EN: Army (phase 3, mockup frame 7) — per-city recruit table: CITY column left, the 4
   numeric columns right-aligned across header, data and the RAZEM row — same convention as
   Treasury/Labor/Science above, with no repeated inline styles. */
.civ-emp-armia-rekr-tbl .civ-emp-mini-h-cell:nth-child(n+2){align-items:flex-end;text-align:right;}
.civ-emp-armia-rekr-tbl .civ-emp-mini-r>div:nth-child(n+2){text-align:right;}
/* Nagłówek sekcji z JEDNĄ ikoną zasobu obok tekstu (Armia: „Zaopatrzenie wojska" + res-food).
   §5 handoffu designera: ikona pojawia się raz, przy nagłówku — nigdy per wiersz tabeli.
   / EN: section heading with ONE resource icon next to the text (Army: "Zaopatrzenie wojska" +
   res-food). Designer handoff §5: the icon appears once, at the heading — never per table row. */
.civ-emp-lbl-ic{display:flex;align-items:center;gap:6px;}

/* — R-DESIGN-11-ZAKLADEK faza 2 (Maciej 2026-08-1x) — Praca/Nauka/Religia (§4 handoffu
   designera: .civ-emp-split2 = "pasek podziału na dwa strumienie", Praca budynki/pula, Religia
   własna/obca) — */
.civ-emp-split2{display:flex;height:12px;border-radius:999px;overflow:hidden;background:#1f2733;
  margin-top:12px;}
.civ-emp-split2>span{display:block;height:100%;}
.civ-emp-relig-medallion{flex:none;width:44px;height:44px;border-radius:9px;background:#1d2634;
  border:1px solid #d9a441;display:flex;align-items:center;justify-content:center;}
.civ-emp-relig-medallion svg{width:24px;height:24px;display:block;}
.civ-emp-relig-name{display:block;font-size:18px;font-weight:800;color:#d9a441;line-height:1.15;}
.civ-emp-relig-sub{display:block;font-size:11px;color:#7d8798;margin-top:2px;}
.civ-emp-relig-fx-hdr{font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:#7d8798;
  font-weight:600;margin:14px 0 8px;padding-bottom:6px;border-bottom:1px solid #242c3a;}
.civ-emp-relig-fx{display:flex;flex-direction:column;gap:3px;padding:9px 10px;border-radius:7px;
  background:#1c2431;border:1px solid #2b3543;}
.civ-emp-relig-fx-row{display:flex;justify-content:space-between;font-size:11.5px;color:#b8c4d8;}
.civ-emp-relig-fx-row .v{color:#78c95a;font-weight:600;}
.civ-emp-relig-fx-row .v.neutral{color:#cfd5de;}

/* — R-DESIGN-11-ZAKLADEK faza 3 (Maciej 2026-08-14) — Kultura, klatka 10. Lista progów
   zasięgu granic jako STANY (.civ-emp-thr z §4 handoffu designera), nie jako zdanie o
   procencie: .done = próg już osiągnięty (wygaszony, status zielony), .now = próg bieżący
   (złote tło rgba(217,164,65,.16) — ten sam akcent co aktywny .civ-emp-mocview-btn — i procent
   dojścia), .next = próg przyszły (ramka przerywana, bez wartości).
   / EN: Culture tab, frame 10. Border-range thresholds rendered as STATES (.civ-emp-thr from
   §4 of the designer handoff) instead of a sentence about a percentage: .done = already
   reached (dimmed, green status), .now = current threshold (gold rgba(217,164,65,.16) tint —
   same accent as the active .civ-emp-mocview-btn — plus progress percentage), .next = future
   threshold (dashed border, no value). */
.civ-emp-thr-list{display:flex;flex-direction:column;gap:4px;margin-bottom:8px;}
.civ-emp-thr{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:7px;
  background:#171e2a;border:1px solid #2b3543;}
.civ-emp-thr .lbl{flex:1;min-width:0;font-size:12px;color:#8a93a4;}
.civ-emp-thr .st{font-size:11px;font-weight:700;color:#78c95a;flex-shrink:0;}
.civ-emp-thr.now{background:rgba(217,164,65,.16);border-color:#d9a441;}
.civ-emp-thr.now .lbl{color:#e8ebf0;font-weight:600;}
.civ-emp-thr.now .st{color:#d9a441;}
.civ-emp-thr.next{background:transparent;border:1px dashed #2b3543;}
.civ-emp-thr.next .st{color:#6f7889;font-weight:400;}
/* Tabela per miasto Kultury — kolumny liczbowe (KULTURA / ZASIĘG) do prawej we wszystkich
   wierszach, tą samą konwencją co Skarbiec/Praca/Nauka wyżej.
   / EN: Culture per-city table — numeric columns (KULTURA / ZASIĘG) right-aligned in all rows,
   same convention as Treasury/Labor/Science above. */
.civ-emp-kult-city-tbl .civ-emp-mini-h-cell:nth-child(2),
.civ-emp-kult-city-tbl .civ-emp-mini-h-cell:nth-child(3){align-items:flex-end;text-align:right;}
.civ-emp-kult-city-tbl .civ-emp-mini-r>div:nth-child(2),
.civ-emp-kult-city-tbl .civ-emp-mini-r>div:nth-child(3){text-align:right;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Delta „+N / −N / —" ze stylem koloru (pos/neg/zero). */
function deltaHtml(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '<span class="d z">—</span>';
  const cls = n > 0 ? 'd pos' : 'd neg';
  return `<span class="${cls}">${n > 0 ? '+' : ''}${n}</span>`;
}

function formatRawCount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

type MiniColHeader = string | { label: string; iconId?: string };

function miniHeaderCell(col: MiniColHeader): string {
  if (typeof col === 'string') {
    return `<div class="civ-emp-mini-h-cell"><span class="civ-emp-mini-h-txt">${col}</span></div>`;
  }
  const icon = col.iconId
    ? `<span class="civ-emp-mini-h-ic" aria-hidden="true">${brandIconSvg(col.iconId, 12)}</span>`
    : '';
  return `<div class="civ-emp-mini-h-cell">${icon}<span class="civ-emp-mini-h-txt">${col.label}</span></div>`;
}

function miniHeader(cols: MiniColHeader[], grid: string): string {
  const cells = cols.map(miniHeaderCell).join('');
  return `<div class="civ-emp-mini-h" style="grid-template-columns:${grid}">${cells}</div>`;
}

function miniRow(cells: string[], grid: string): string {
  const c = cells.map(x => `<div>${x}</div>`).join('');
  return `<div class="civ-emp-mini-r" style="grid-template-columns:${grid}">${c}</div>`;
}

/** Delta netto skarbca — 0 jako „0", nie „—". */
function treasuryDeltaHtml(n: number): string {
  if (!Number.isFinite(n)) return '<span class="d z">—</span>';
  if (n === 0) return '<span class="d z">0</span>';
  const cls = n > 0 ? 'd pos' : 'd neg';
  return `<span class="${cls}">${n > 0 ? '+' : ''}${n}</span>`;
}

/** Bilans skarbca — re-export dla testów (implementacja w treasuryBalanceFormat.ts). */
export { treasuryBalanceSignedTxt } from './treasuryBalanceFormat';

function formatResourceUpkeepEmpireLine(resources: Record<string, number> | undefined): string {
  const keys = Object.keys(resources ?? {});
  if (keys.length === 0) return '—';
  return keys.map(k => `−${resources![k]} ${stockResourceLabel(k)}`).join(' · ');
}

function cityEconMiniSkarbiec(
  rows: EmpireDetailSnap['cityEcon'],
  economy: EmpireDetailSnap['economy'],
): string {
  if (rows.length === 0) return '<div class="civ-emp-empty">Brak miast — dochód pojawi się po założeniu osiedli.</div>';

  const wplywy = economy.bogactwoWplywyBrutto ?? 0;
  const handel = economy.bogactwoHandel ?? 0;
  const daninaBud = wplywy - handel;
  const utrzB = economy.bogactwoUtrzymanieBudynkow ?? 0;
  const utrzRes = economy.bogactwoUtrzymanieSurowcowBudynkow ?? {};
  const utrzJ = economy.bogactwoUtrzymanieJednostek ?? 0;
  const netto = economy.bogactwoRate ?? 0;

  const sumGrid = '1fr auto';
  let h = '<div class="civ-emp-mini">';
  h += miniHeader(['SKARBIEC IMPERIUM — bilans / turę', ''], sumGrid);
  h += miniRow(['Wpływy brutto (podatek + budynki)', treasuryBalanceSignedTxt(daninaBud)], sumGrid);
  h += miniRow(['Handel ze szlaków', treasuryBalanceSignedTxt(handel)], sumGrid);
  h += miniRow(['Utrzymanie budynków', treasuryBalanceSignedTxt(-utrzB)], sumGrid);
  h += miniRow(['Utrzymanie surowców budynków', formatResourceUpkeepEmpireLine(utrzRes)], sumGrid);
  h += miniRow(['Utrzymanie jednostek', treasuryBalanceSignedTxt(-utrzJ)], sumGrid);
  h += miniRow(['<b>Netto skarbiec</b>', `<b>${treasuryBalanceSignedTxt(netto)}</b>`], sumGrid);
  h += '</div>';

  const grid = '1fr 0.7fr 0.9fr';
  h += `<div class="civ-emp-mini" style="margin-top:8px">${miniHeader(['MIASTO', 'DO SKARBCA', 'UTRZYMANIE'], grid)}`;
  for (const c of rows) {
    h += miniRow([
      esc(c.name),
      treasuryBalanceSignedTxt(c.pieniadz),
      treasuryBalanceSignedTxt(-(c.utrzymanieBudynkow ?? 0)),
    ], grid);
  }
  h += '</div>';
  h += '<div class="civ-emp-foot">„Do skarbca" = wpływ miasta po suwakach (Skarb %). Utrzymanie budynków (złoto) i wojska schodzi ze skarbca imperium. Utrzymanie surowców budynków schodzi z magazynu państwa (1/turę na typ z kosztu budowy). Jednostki na mapie = koszt imperium, nie per miasto w tabeli.</div>';
  return h;
}

/** Odmiana „miasto/miasta/miast" wg liczby (bez sufiksu „niedokarmione", inaczej niż
 *  `miastoNiedokarmioneWord` niżej — ten sam wzorzec gramatyczny, inne zastosowanie).
 *  EN: "miasto/miasta/miast" (city, cities, of cities) grammatical form by count — same
 *  pattern as `miastoNiedokarmioneWord` below, different use site. */
function miastoCountWord(n: number): string {
  if (n === 1) return 'miasto';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'miasta';
  return 'miast';
}

/** Kolorowana wartość w tabeli bilansu Skarbca (zielony/czerwony/szary wg znaku). */
function tblValTxt(n: number): string {
  const r = Math.round(n);
  const color = r > 0 ? '#78c95a' : r < 0 ? '#e07a7a' : '#6f7889';
  return `<span style="color:${color};font-weight:700">${treasuryBalanceSignedTxt(r)}</span>`;
}

/** Jak `formatResourceUpkeepEmpireLine`, ale kolorowana/łamana wierszami — dla tabeli bilansu
 *  Skarbca (klatka 1, R-DESIGN-11-ZAKLADEK), gdzie sąsiaduje z kolorowanymi kwotami złota. */
function formatResourceUpkeepEmpireLineColored(resources: Record<string, number> | undefined): string {
  const keys = Object.keys(resources ?? {});
  if (keys.length === 0) return '<span style="color:#6f7889">—</span>';
  const lines = keys.map(k => `−${resources![k]} ${stockResourceLabel(k)}`).join('<br>');
  return `<span style="font-size:11.5px;color:#e07a7a;font-weight:600;line-height:1.35">${lines}</span>`;
}

/** Tor suwaka `.civ-emp-slider` częściowo wypełniony gradientem do wartości `pct` (%),
 *  reszta toru w kolorze tła — natywny input[type=range] z `-webkit-appearance:none` renderuje
 *  swoje tło wprost jako tor, więc to jedyne, czego trzeba do wizualnego „wypełnienia". */
function sliderFillStyle(pct: number, colorFrom: string, colorTo: string): string {
  const p = Math.max(0, Math.min(100, pct));
  return `background:linear-gradient(90deg,${colorFrom} 0%,${colorTo} ${p}%,#1f2733 ${p}%,#1f2733 100%)`;
}

/**
 * R-DESIGN-11-ZAKLADEK faza 1 (Maciej 2026-08-13) — Klatka 1 makiety designera: Skarbiec dostaje
 * własny blok top-level (jak Spichlerz/Surowce/Handel/Armia/Kultura/Moc), z hero-liczbą „Netto
 * ±N / turę" analogiczną do `.civ-emp-moc-big` w sekcji Moc. Wzorzec organizacji kodu skopiowany
 * z `renderSpichlerzCentralnySection()` (nested `.civ-emp-sect` dla suwaka na końcu) — treść
 * własna, 1:1 z etykietami `cityEconMiniSkarbiec()` wyżej (ta funkcja NIE jest usuwana — nadal
 * używana w pełnym przeglądzie „ZASOBY IMPERIUM", blok `ekonomia`, gdy activeSection === null).
 * EN: Treasury gets its own top-level block (like Granary/Resources/Trade/Army/Culture/Power),
 * with a hero number "Net ±N / turn" analogous to `.civ-emp-moc-big` in the Power section. Code
 * organization pattern copied from `renderSpichlerzCentralnySection()` (nested `.civ-emp-sect`
 * for the slider at the end) — content is new, labels 1:1 with `cityEconMiniSkarbiec()` above
 * (that function is NOT removed — still used in the full "ZASOBY IMPERIUM" overview, `ekonomia`
 * block, when activeSection is null).
 */
function renderSkarbiecSection(
  rows: EmpireDetailSnap['cityEcon'],
  economy: EmpireDetailSnap['economy'],
): string {
  const wplywy = Math.round(economy.bogactwoWplywyBrutto ?? 0);
  const handel = Math.round(economy.bogactwoHandel ?? 0);
  const daninaBud = wplywy - handel;
  const utrzB = Math.round(economy.bogactwoUtrzymanieBudynkow ?? 0);
  const utrzRes = economy.bogactwoUtrzymanieSurowcowBudynkow ?? {};
  const utrzJ = Math.round(economy.bogactwoUtrzymanieJednostek ?? 0);
  const koszty = utrzB + utrzJ;
  const netto = Math.round(economy.bogactwoRate ?? 0);
  const stan = Math.round(economy.bogactwo ?? 0);
  const nettoCls = netto < 0 ? 'neg' : 'pos';

  let h = '<div class="civ-emp-sect" data-section="skarbiec">'
    + '<div class="civ-emp-eyebrow">SKARBIEC IMPERIUM</div>'
    + `<div class="civ-emp-hero ${nettoCls}">Netto ${treasuryBalanceSignedTxt(netto)} / turę</div>`;

  if (rows.length === 0) {
    h += `<div class="civ-emp-hero-sub">Stan skarbca <b>${stan}</b></div>`
      + '<div class="civ-emp-empty">Brak miast — dochód pojawi się po założeniu osiedli.</div></div>';
    return h;
  }

  h += `<div class="civ-emp-hero-sub">Stan skarbca <b>${stan}</b> · wpływy <b>${wplywy}</b> − koszty `
    + `<b>${koszty}</b> · ${rows.length} ${miastoCountWord(rows.length)}</div>`;

  if (netto < 0) {
    h += '<div class="civ-emp-alert"><b>Skarbiec się wyczerpuje</b> — koszty przewyższają wpływy. '
      + 'Przy zerze utrzymanie budynków przestaje być pokrywane.</div>';
  }

  const wplywySub = handel > 0
    ? `<span style="font-size:11px;color:#78c95a;font-weight:600">+${handel} handel</span>`
    : '<span style="font-size:11px;color:#7d8798;font-weight:600">bez handlu</span>';
  const kosztySub = utrzB > 0
    ? `<span style="font-size:11px;color:#e07a7a;font-weight:600">${utrzB} budynki</span>` : '';
  h += '<div class="civ-emp-two">'
    + `<div class="civ-emp-box"><div class="k">WPŁYWY / TURĘ</div><div class="v">${wplywy} ${wplywySub}</div></div>`
    + `<div class="civ-emp-box"${netto < 0 ? ' style="border-color:#4a2a2a"' : ''}><div class="k">KOSZTY / TURĘ</div>`
    + `<div class="v"${netto < 0 ? ' style="color:#e07a7a"' : ''}>${koszty} ${kosztySub}</div></div>`
    + '</div>';

  // TABELA BILANSU — .civ-emp-tbl (dziś tylko w Mocy) z gridem 2-kolumnowym przez inline
  // override (klasy `.civ-emp-tbl-h`/`.civ-emp-tbl-r` mają grid-template-columns 5-kolumnowy
  // zaszyty w CSS dla tabeli Mocy — inline style nadpisuje go z wyższym priorytetem kaskady).
  const bg = '1fr 0.62fr';
  h += `<div class="civ-emp-tbl"><div class="civ-emp-tbl-h" style="grid-template-columns:${bg}">`
    + '<div>SKARBIEC IMPERIUM — BILANS / TURĘ</div><div>ZŁOTO</div></div>';
  const balRow = (label: string, sub: string | null, valueHtml: string): string =>
    `<div class="civ-emp-tbl-r" style="grid-template-columns:${bg}"><div><div class="nm">${label}</div>`
    + `${sub ? `<div class="src">${sub}</div>` : ''}</div><div style="text-align:right">${valueHtml}</div></div>`;
  h += balRow('Wpływy brutto (podatek + budynki)', null, tblValTxt(daninaBud));
  h += balRow('Handel ze szlaków', null, tblValTxt(handel));
  h += balRow('Utrzymanie budynków', null, tblValTxt(-utrzB));
  h += balRow('Utrzymanie surowców budynków', 'z magazynu państwa, nie ze złota',
    formatResourceUpkeepEmpireLineColored(utrzRes));
  h += balRow('Utrzymanie jednostek', null, tblValTxt(-utrzJ));
  h += `<div class="civ-emp-tbl-sum" style="grid-template-columns:${bg}"><div>Netto skarbiec</div>`
    + `<div class="${nettoCls}">${treasuryBalanceSignedTxt(netto)}</div></div>`;
  h += '</div>';

  // TABELA PER MIASTO — wzorzec `.civ-emp-mini`/`miniHeader`/`miniRow` (jak reszta panelu),
  // wiersz SUMA w `.civ-emp-mini-summary` — mechanizm już istnieje dla tabeli Miasta.
  const grid = '1fr 0.7fr 0.9fr';
  let sumSkarbiec = 0;
  let sumUtrz = 0;
  h += `<div class="civ-emp-mini civ-emp-skarbiec-city-tbl" style="margin-top:10px">${miniHeader(['MIASTO', 'DO SKARBCA', 'UTRZYMANIE'], grid)}`;
  for (const c of rows) {
    const doSkarbca = c.pieniadz;
    const utrzymanie = -(c.utrzymanieBudynkow ?? 0);
    sumSkarbiec += doSkarbca;
    sumUtrz += utrzymanie;
    h += miniRow([esc(c.name), tblValTxt(doSkarbca), tblValTxt(utrzymanie)], grid);
  }
  h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
    + `<div>SUMA</div><div style="text-align:right">${treasuryBalanceSignedTxt(sumSkarbiec)}</div>`
    + `<div style="text-align:right">${treasuryBalanceSignedTxt(sumUtrz)}</div></div>`;
  h += '</div>';

  h += '<div class="civ-emp-foot">„Do skarbca" = wpływ miasta po suwakach (Skarb %). Utrzymanie '
    + 'budynków (złoto) i wojska schodzi ze skarbca imperium. Utrzymanie surowców budynków schodzi '
    + 'z magazynu państwa (1/turę na typ z kosztu budowy). Jednostki na mapie = koszt imperium, nie '
    + 'per miasto w tabeli.</div>';

  h += renderSkarbiecTaxSplitSection(daninaBud);
  h += '</div>';
  return h;
}

/**
 * Suwak „Domyślny podział podatku" w nowym stylu `.civ-emp-slider` (Klatka 1, §C zlecenia) —
 * WŁASNA funkcja, NIE modyfikuje `renderDefaultHandelSplitSection()` wyżej, która nadal obsługuje
 * suwak podatku wewnątrz filtrowanego wiersza „Nauka" w bloku `ekonomia` (poza zakresem tej fazy).
 * Ten sam mechanizm danych (`handelSplitUi`, `adjustHandelSplit`), inny markup: kwota „≈ ±N/turę"
 * obok procentu, tor suwaka kolorowany wg zasobu (`.gold`/`.blue`/`.neutral`).
 * EN: "Default tax split" slider in the new `.civ-emp-slider` style — its OWN function, does NOT
 * modify `renderDefaultHandelSplitSection()` above, which still serves the tax slider inside the
 * filtered "Science" row of the `ekonomia` block (out of this phase's scope). Same data mechanism,
 * different markup: an "≈ ±N/turn" amount next to the percentage, slider track colored by resource.
 */
function renderSkarbiecTaxSplitSection(baseAmount: number): string {
  const getDef = handelSplitUi.getOwnerDefault;
  const onChange = handelSplitUi.onOwnerDefaultChange;
  if (!getDef || !onChange) return '';
  const split = normalizePodzialHandlu(getDef(0) ?? { procentPieniadz: 60, procentNauka: 20, procentLuksus: 20 });
  const daninaLbl = handelSplitUi.getDaninaLabel?.() ?? 'Podatek';
  const id = 'emp-skarbiec-tax-split';
  const rows: { key: keyof CityPodzialHandlu; label: string; cls: string; from: string; to: string }[] = [
    { key: 'procentPieniadz', label: 'Skarb', cls: 'gold', from: '#6a4010', to: '#d9a441' },
    { key: 'procentNauka', label: 'Nauka', cls: 'blue', from: '#2c4a6b', to: '#8ec5ff' },
    { key: 'procentLuksus', label: 'Zamożność', cls: 'neutral', from: '#3a4657', to: '#9aa4b2' },
  ];
  let h = `<div class="civ-emp-sect" style="margin-top:2px;border-top:1px solid #242c3a;padding-top:16px" id="${id}">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:6px">DOMYŚLNY PODZIAŁ ${esc(daninaLbl.toUpperCase())}</div>`
    + '<div class="civ-emp-note">Nowe miasta dziedziczą ten podział. W panelu miasta możesz włączyć własny override.</div>';
  h += '<div class="civ-emp-mini" style="margin-top:8px;padding:11px 12px 12px;display:flex;flex-direction:column;gap:12px">';
  for (const row of rows) {
    const pct = split[row.key];
    const amount = Math.round((baseAmount * pct) / 100);
    h += '<div>'
      + '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:7px">'
      + `<span style="flex:1;font-size:12px;font-weight:600" class="civ-emp-slider-label ${row.cls}">${row.label}</span>`
      + `<span style="font-size:13px;font-weight:700;color:#e8ebf0" data-pct="${row.key}"><b>${pct}%</b></span>`
      + `<span style="font-size:11px;color:#7d8798" data-amt="${row.key}">≈ ${amount >= 0 ? '+' : ''}${amount}/turę</span></div>`
      + `<input type="range" class="civ-emp-slider ${row.cls}" min="0" max="100" step="${HANDEL_PCT_STEP}" `
      + `value="${pct}" style="${sliderFillStyle(pct, row.from, row.to)}" data-handel-key="${row.key}" `
      + `data-grad-from="${row.from}" data-grad-to="${row.to}" /></div>`;
  }
  h += '<div style="display:flex;align-items:center;gap:8px;padding-top:9px;border-top:1px solid #232b38">'
    + '<span style="flex:1;font-size:10.5px;color:#7d8798">Suma <b style="color:#cfd5de">100%</b> · kroki '
    + `${HANDEL_PCT_STEP}%</span><span data-sum-ok style="font-size:9.5px;font-weight:700;letter-spacing:.04em;`
    + 'color:#78c95a;background:rgba(120,201,90,.14);border-radius:999px;padding:2px 8px">SUMA OK</span></div>';
  h += `</div><div class="civ-emp-foot">Suma = 100% · kroki ${HANDEL_PCT_STEP}% · dotyczy wszystkich miast bez własnego override.</div></div>`;
  queueMicrotask(() => wireSkarbiecTaxSplitInputs(split, baseAmount, onChange));
  return h;
}

function wireSkarbiecTaxSplitInputs(
  initial: CityPodzialHandlu,
  baseAmount: number,
  onChange: (ownerId: number, split: CityPodzialHandlu) => void,
): void {
  const host = document.getElementById('emp-skarbiec-tax-split');
  if (!host) return;
  let current = { ...initial };
  for (const inp of Array.from(host.querySelectorAll<HTMLInputElement>('input[data-handel-key]'))) {
    inp.addEventListener('input', () => {
      const key = inp.dataset.handelKey as keyof CityPodzialHandlu;
      current = adjustHandelSplit(current, key, Number(inp.value));
      onChange(0, { ...current });
      for (const other of Array.from(host.querySelectorAll<HTMLInputElement>('input[data-handel-key]'))) {
        const k = other.dataset.handelKey as keyof CityPodzialHandlu;
        const pct = current[k];
        other.value = String(pct);
        other.style.background = sliderFillStyle(pct, other.dataset.gradFrom ?? '#6a4010', other.dataset.gradTo ?? '#d9a441');
        const pctEl = host.querySelector(`[data-pct="${k}"] b`);
        if (pctEl) pctEl.textContent = `${pct}%`;
        const amtEl = host.querySelector(`[data-amt="${k}"]`);
        if (amtEl) {
          const amount = Math.round((baseAmount * pct) / 100);
          amtEl.textContent = `≈ ${amount >= 0 ? '+' : ''}${amount}/turę`;
        }
      }
    });
  }
}

function cityEconMiniPraca(rows: EmpireDetailSnap['cityEcon'], upkeep?: number): string {
  if (rows.length === 0) return '<div class="civ-emp-empty">Brak miast.</div>';
  const grid = '1fr 1fr 1fr';
  let h = `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'DO PULI', 'DO BUDYNKÓW'], grid)}`;
  for (const c of rows) h += miniRow([esc(c.name), signedTxt(c.pracaPula), signedTxt(c.pracaBudynki)], grid);
  h += '</div><div class="civ-emp-foot">„Do puli" trafia do globalnej puli Pracy (górny pasek). „Do budynków" zasila kolejkę w mieście.</div>';
  if (upkeep && upkeep > 0) {
    h += `<div class="civ-emp-foot">Ulepszenia (utrzymanie): −${Math.round(upkeep)} Praca/turę z puli — imperium płaci za każde zbudowane ulepszenie surowcowe.</div>`;
  }
  return h;
}

function cityEconMiniNauka(rows: EmpireDetailSnap['cityEcon']): string {
  if (rows.length === 0) return '<div class="civ-emp-empty">Brak miast.</div>';
  const grid = '1fr 1fr';
  let h = `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'NAUKA'], grid)}`;
  for (const c of rows) h += miniRow([esc(c.name), signedTxt(c.nauka)], grid);
  h += '</div><div class="civ-emp-foot">Nauka z miast trafia do banku badań. Hub badań — przycisk Nauka na lewym pasku.</div>';
  return h;
}

/** Tor dwukolorowy statyczny (bez interakcji) — hero-pasek podziału na dwa strumienie
 *  (Praca: Budynki/Pula, Religia: własna/obca religia). Odpowiednik wizualny `.civ-emp-split2`
 *  z handoffu designera §4 — DWA niezależne odcinki gradientu, nie „fill do wartości" jak
 *  `sliderFillStyle` (ten używany na suwakach interaktywnych, gdzie reszta toru = tło). */
function split2BarHtml(
  pctA: number, colorFromA: string, colorToA: string,
  pctB: number, colorFromB: string, colorToB: string,
): string {
  const a = Math.max(0, Math.min(100, Math.round(pctA)));
  const b = Math.max(0, Math.min(100, Math.round(pctB)));
  return `<div class="civ-emp-split2"><span style="width:${a}%;background:linear-gradient(90deg,${colorFromA},${colorToA})"></span>`
    + `<span style="width:${b}%;background:linear-gradient(90deg,${colorFromB},${colorToB})"></span></div>`;
}

/** Tor suwaka `.civ-emp-slider` z DWOMA odcinkami gradientu po obu stronach wartości `pctA` (%) —
 *  odpowiednik `sliderFillStyle()` dla suwaka reprezentującego DWA strumienie na raz (Budynki
 *  0..pctA w złocie, Pula imperium pctA..100 w błękicie), nie „wartość + puste tło" jak przy
 *  pojedynczym zasobie (suwak podatku Skarbca). */
function laborSliderFillStyle(pctBudynki: number): string {
  const p = Math.max(0, Math.min(100, pctBudynki));
  return `linear-gradient(90deg,#6a4010 0%,#d9a441 ${p}%,#3a4657 ${p}%,#8ec5ff 100%)`;
}

/**
 * R-DESIGN-11-ZAKLADEK faza 2 (Maciej 2026-08-1x) — Klatka 2: Praca dostaje własny blok
 * top-level, wzorem Skarbca (faza 1). Hero = suma Pracy/turę imperium (Budynki+Pula tej tury,
 * sumowane z `cityEcon`, NIE `economy.pracaRate` — ten opisuje przyrost NETTO puli po utrzymaniu,
 * inna liczba, patrz box PULA IMPERIUM niżej gdzie `economy.pracaRate` jest pokazywany osobno,
 * tak samo jak Skarbiec pokazuje „netto" osobno od sum tabeli per-miasto).
 */
function renderPracaSection(
  rows: EmpireDetailSnap['cityEcon'],
  economy: EmpireDetailSnap['economy'],
): string {
  let h = '<div class="civ-emp-sect" data-section="praca">'
    + '<div class="civ-emp-eyebrow">PRACA IMPERIUM</div>';

  if (rows.length === 0) {
    h += '<div class="civ-emp-hero pos">0 Pracy / turę</div>'
      + '<div class="civ-emp-empty">Brak miast — produkcja Pracy pojawi się po założeniu osiedli.</div></div>';
    return h;
  }

  let sumBudynki = 0;
  let sumPula = 0;
  for (const c of rows) { sumBudynki += c.pracaBudynki; sumPula += c.pracaPula; }
  const total = sumBudynki + sumPula;
  const pctBudynki = total > 0 ? Math.round((sumBudynki / total) * 100) : 0;
  const pctPula = 100 - pctBudynki;
  const upkeep = Math.round(economy.pracaUpkeep ?? 0);
  const stock = Math.round(economy.praca ?? 0);
  const rate = Math.round(economy.pracaRate ?? 0);

  h += `<div class="civ-emp-hero pos">${total} Pracy / turę</div>`
    + `<div class="civ-emp-hero-sub"><b>${sumBudynki}</b> do budynków · <b>${sumPula}</b> do puli imperium · `
    + `${rows.length} ${miastoCountWord(rows.length)}</div>`;

  h += split2BarHtml(pctBudynki, '#6a4010', '#d9a441', pctPula, '#2c4a6b', '#8ec5ff');
  h += '<div style="display:flex;gap:8px;margin-top:6px;font-size:11px">'
    + `<span style="flex:1" class="civ-emp-slider-label gold">Budynki ${pctBudynki}% · ${sumBudynki}</span>`
    + `<span class="civ-emp-slider-label blue">Pula imperium ${pctPula}% · ${sumPula}</span></div>`;

  h += '<div class="civ-emp-two">'
    + `<div class="civ-emp-box"><div class="k">PULA IMPERIUM</div><div class="v">${stock} ${deltaHtml(rate)}</div></div>`
    + `<div class="civ-emp-box"><div class="k">UTRZYMANIE ULEPSZEŃ</div>`
    + `<div class="v"${upkeep > 0 ? ' style="color:#e07a7a"' : ''}>−${upkeep} `
    + '<span style="font-size:11px;color:#7d8798;font-weight:600">z puli</span></div></div>'
    + '</div>';

  const grid = '1fr 1fr 1fr';
  let tblSumPula = 0;
  let tblSumBud = 0;
  h += `<div class="civ-emp-mini civ-emp-praca-city-tbl" style="margin-top:10px">${miniHeader(['MIASTO', 'DO PULI', 'DO BUDYNKÓW'], grid)}`;
  for (const c of rows) {
    tblSumPula += c.pracaPula;
    tblSumBud += c.pracaBudynki;
    h += miniRow([esc(c.name), miniColColor(c.pracaPula, '#8ec5ff'), miniColColor(c.pracaBudynki, '#d9a441')], grid);
  }
  h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
    + `<div>SUMA</div><div style="text-align:right">${signedTxt(tblSumPula)}</div>`
    + `<div style="text-align:right">${signedTxt(tblSumBud)}</div></div>`;
  h += '</div>';

  h += '<div class="civ-emp-foot">„Do puli" trafia do globalnej puli Pracy (górny pasek). „Do budynków" zasila kolejkę w mieście.</div>';
  if (upkeep > 0) {
    h += `<div class="civ-emp-foot">Ulepszenia (utrzymanie): −${upkeep} Praca/turę z puli — imperium płaci za każde zbudowane ulepszenie surowcowe.</div>`;
  }

  h += renderPracaSplitSection();
  h += '</div>';
  return h;
}

/**
 * Suwak „Domyślny podział pracy" w nowym stylu `.civ-emp-slider` (Klatka 2 §C zlecenia) — WŁASNA
 * funkcja, analogicznie do `renderSkarbiecTaxSplitSection` dla Skarbca (faza 1). NIE modyfikuje
 * `renderDefaultPodzialPracySection()` wyżej, która nadal obsługuje ten sam suwak wewnątrz
 * filtrowanego wiersza „Praca" w bloku `ekonomia` (pełny przegląd, gdy activeSection===null) —
 * ten sam mechanizm danych (`empireGlobalDefaultsUi`), inny markup: tor suwaka dwukolorowy
 * (złoto=Budynki, błękit=Pula imperium) przez `laborSliderFillStyle()`.
 */
function renderPracaSplitSection(): string {
  const getDef = empireGlobalDefaultsUi.getOwnerDefaultPodzialPracy;
  const onChange = empireGlobalDefaultsUi.onOwnerDefaultPodzialPracyChange;
  if (!getDef || !onChange) return '';
  const split = getDef(0) ?? { procentBudynki: 70 };
  const id = 'emp-praca-tab-split';
  const pctB = split.procentBudynki;
  const pctU = 100 - pctB;
  let h = `<div class="civ-emp-sect" style="margin-top:2px;border-top:1px solid #242c3a;padding-top:16px" id="${id}">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:6px">DOMYŚLNY PODZIAŁ PRACY</div>`
    + '<div class="civ-emp-note">Nowe miasta (i te bez własnego „Indywidualne") dziedziczą ten podział.</div>';
  h += '<div class="civ-emp-mini" style="margin-top:8px;padding:11px 12px 12px;display:flex;flex-direction:column;gap:7px">'
    + '<div style="display:flex;align-items:baseline;gap:8px">'
    + '<span style="flex:1;font-size:12px"><b class="civ-emp-slider-label gold">Budynki</b> / '
    + '<b class="civ-emp-slider-label blue">Do puli imperium</b></span>'
    + `<span style="font-size:13px;font-weight:700;color:#e8ebf0" data-praca-pct>${pctB}% / ${pctU}%</span></div>`
    + `<input type="range" class="civ-emp-slider gold" min="0" max="100" step="${HANDEL_PCT_STEP}" `
    + `value="${pctB}" style="background:${laborSliderFillStyle(pctB)}" data-praca-key="procentBudynki" /></div>`;
  h += `<div class="civ-emp-foot">Kroki ${HANDEL_PCT_STEP}% · w lewo → więcej do puli imperium · w prawo → szybsza kolejka budowy.</div></div>`;
  queueMicrotask(() => wirePracaSplitInputs(onChange));
  return h;
}

function wirePracaSplitInputs(
  onChange: (ownerId: number, split: CityPodzialPracy) => void,
): void {
  const host = document.getElementById('emp-praca-tab-split');
  if (!host) return;
  const inp = host.querySelector<HTMLInputElement>('input[data-praca-key="procentBudynki"]');
  if (!inp) return;
  inp.addEventListener('input', () => {
    const pctB = snapHandelPct(Number(inp.value));
    onChange(0, { procentBudynki: pctB });
    inp.style.background = laborSliderFillStyle(pctB);
    const lbl = host.querySelector('[data-praca-pct]');
    if (lbl) lbl.textContent = `${pctB}% / ${100 - pctB}%`;
  });
}

/**
 * R-DESIGN-11-ZAKLADEK faza 2 — Klatka 3: Nauka dostaje własny blok top-level. BEZ przycisku
 * „Otwórz hub badań" (rejestr decyzji designera §5/§8, punkt 5, Maciej 2026-08-14: ODŁOŻONE —
 * „do potwierdzenia, czy hub ma istnieć jako cel linku... bez niego klatka zostaje bez zmian") —
 * pominięty CAŁKOWICIE w tej fazie, nie renderowany nawet jako placeholder. BEZ własnego suwaka
 * podatku — Nauka finansowana z TEGO SAMEGO % co Skarbiec/Zamożność (jeden suwak, mieszka w
 * `renderSkarbiecTaxSplitSection`, patrz `econSliderVisibilityForOnlyEconId` i box „ŹRÓDŁO
 * FINANSOWANIA" niżej, który tylko WSKAZUJE suwak, nie duplikuje go).
 */
function renderNaukaSection(
  rows: EmpireDetailSnap['cityEcon'],
  economy: EmpireDetailSnap['economy'],
  research: EmpireDetailSnap['research'],
): string {
  const rate = Math.round(economy.naukaRate ?? 0);
  const bank = Math.floor(economy.nauka ?? 0);
  const getDef = handelSplitUi.getOwnerDefault;
  const split = getDef ? normalizePodzialHandlu(getDef(0) ?? { procentPieniadz: 60, procentNauka: 20, procentLuksus: 20 }) : null;
  const procentNauka = split ? split.procentNauka : 20;
  const heroCls = rate < 0 ? 'neg' : 'pos';

  let h = '<div class="civ-emp-sect" data-section="nauka">'
    + '<div class="civ-emp-eyebrow">NAUKA IMPERIUM</div>'
    + `<div class="civ-emp-hero ${heroCls}">${signedPl(rate)} PN / turę</div>`;

  if (rows.length === 0) {
    h += `<div class="civ-emp-hero-sub">Bank badań <b>${bank}</b> PN</div>`
      + '<div class="civ-emp-empty">Brak miast — produkcja Nauki pojawi się po założeniu osiedli.</div></div>';
    return h;
  }

  h += `<div class="civ-emp-hero-sub">Bank badań <b>${bank}</b> PN · finansowana <b>${procentNauka}%</b> podatku · `
    + `${rows.length} ${miastoCountWord(rows.length)}</div>`;

  h += '<div class="civ-emp-two">';
  // Znalezisko przy tej fazie (NIE naprawiane tu, poza zakresem UI): playtest „?playtest=mapa"
  // (main.ts ok. linii 29253) ustawia `player.badana = 'Metalurgia Brązu'` — nazwa niedopasowana
  // do żadnego wpisu `data/tech.json` (dziś „Brązownictwo") — `getResearchState()` wtedy nie
  // znajduje `def`, więc `kosztCelu` wraca 0. F3 KOREKTA (2026-08-14, Evaluator zweryfikował
  // buildem): poprzednia wersja tego komentarza twierdziła że bez guarda pasek byłby sztucznie
  // pełny („dzielenie przez 0 daje postepFraction=1") — NIEPRAWDA. `getResearchState()`
  // (playerState.ts) inicjalizuje `postepFraction=0` i dzieli WYŁĄCZNIE wewnątrz
  // `if (kosztCelu>0)`; bez guarda pasek renderowałby się PUSTY (0%), nie pełny. Prawdziwy
  // powód guarda to wyświetlany TEKST: bez niego pokazałby mylące „N / 0 PN" (zero widoczne w
  // mianowniku LICZBY, nie dzielenie w kodzie) — guard chroni czytelność tej liczby, nie kształt
  // paska.
  // EN: found during this phase (NOT fixed here, out of UI scope): the "?playtest=mapa" preset
  // sets a stale tech name not matching today's tech.json, so the engine can't resolve `def` and
  // returns kosztCelu=0. F3 CORRECTION (2026-08-14, Evaluator verified via build): the previous
  // version of this comment claimed the bar would render artificially full without the guard
  // ("division by zero gives postepFraction=1") — FALSE. `getResearchState()` (playerState.ts)
  // initializes `postepFraction=0` and divides ONLY inside `if (kosztCelu>0)`; without the guard
  // the bar would render EMPTY (0%), not full. The guard's real purpose is the displayed TEXT:
  // without it, it would show a misleading "N / 0 PN" (the zero visible in the NUMBER's
  // denominator, not an actual division in the code) — the guard protects that number's
  // readability, not the bar's shape.
  if (research && research.kosztCelu > 0) {
    const pctBar = Math.max(0, Math.min(100, Math.round(research.postepFraction * 100)));
    const etaTxt = research.turnsLeft == null
      ? '—'
      : (research.turnsLeft > 0 ? `${research.turnsLeft} tur` : '<1 tury');
    h += '<div class="civ-emp-box"><div class="k">BADANE TERAZ</div>'
      + `<div class="v">${esc(research.targetLabel)}</div>`
      + `<div class="civ-emp-bar" style="margin-top:7px;height:6px;margin-bottom:0">`
      + `<span class="fill" style="width:${pctBar}%;background:linear-gradient(90deg,#2c4a6b,#8ec5ff)"></span></div>`
      + `<div style="font-size:10.5px;color:#7d8798;margin-top:5px">${Math.round(research.pula)} / `
      + `${Math.round(research.kosztCelu)} PN · ETA ${etaTxt}</div></div>`;
  } else if (research) {
    h += '<div class="civ-emp-box"><div class="k">BADANE TERAZ</div>'
      + `<div class="v">${esc(research.targetLabel)}</div>`
      + '<div style="font-size:10.5px;color:#7d8798;margin-top:7px">Koszt celu nieznany (dane techu '
      + 'niedopasowane) · bank <b style="color:#e8ebf0">' + Math.round(research.pula) + '</b> PN</div></div>';
  } else {
    h += '<div class="civ-emp-box"><div class="k">BADANE TERAZ</div>'
      + '<div class="v" style="color:#7d8798;font-size:12px;font-weight:600">Brak wybranego celu</div></div>';
  }
  h += '<div class="civ-emp-box"><div class="k">ŹRÓDŁO FINANSOWANIA</div>'
    + `<div class="v" style="color:#8ec5ff">${procentNauka}% podatku</div>`
    + '<div style="font-size:10.5px;color:#7d8798;margin-top:7px;line-height:1.4">Suwak Skarb / Nauka / '
    + 'Zamożność — sekcja Skarbiec</div></div>';
  h += '</div>';

  const grid = '1fr 1fr';
  let tblSum = 0;
  h += `<div class="civ-emp-mini civ-emp-nauka-city-tbl" style="margin-top:10px">${miniHeader(['MIASTO', 'NAUKA'], grid)}`;
  for (const c of rows) { tblSum += c.nauka; h += miniRow([esc(c.name), miniColColor(c.nauka, '#8ec5ff')], grid); }
  h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
    + `<div>SUMA</div><div style="text-align:right">${signedTxt(tblSum)}</div></div>`;
  h += '</div>';

  h += '<div class="civ-emp-foot">Nauka z miast trafia do banku badań. Hub badań — przycisk Nauka na lewym pasku.</div>';
  h += '</div>';
  return h;
}

/**
 * R-DESIGN-11-ZAKLADEK faza 2 — Klatka 11 (wariant A ZATWIERDZONY 2026-08-14): Religia dostaje
 * własny blok top-level, kompletnie od zera (dotąd tylko jeden filtrowany wiersz `econRows`,
 * `detailFor` bez klucza 'religia', patrz stary komentarz w `render()`).
 *
 * ⚠️ ROZBIEŻNOŚĆ ŚWIADOMA WOBEC MAKIETY — sekcja „Efekty" w makiecie pokazuje 3 pozycje
 * (Zadowolenie/Porządek/Świątynie); tu są WYŁĄCZNIE 2 (Zadowolenie, Świątynie). Sprawdzone w
 * silniku (`gra/src/game/culture-religion.ts`, `ReligionParams`): istnieje
 * `zadowolenieDominujaca`/`karaObca` (religia → Zadowolenie) i `swiatyniaBonusSzerzenia` (religia
 * → tempo szerzenia), ale ŻADEN parametr nie wiąże religii z Porządkiem wprost — `order.ts` bierze
 * Porządek z zupełnie innych wag (`porzadek_waga_szczescie`/`porzadek_waga_prawo`), nie z religii.
 * Wpisanie liczby przy „Porządek" byłoby wymyśloną wartością bez pokrycia w silniku (zakaz z
 * CLAUDE.md §3 „każda liczba ma nazwany parametr" — nazwany parametr musi istnieć NAPRAWDĘ, nie
 * tylko nazewniczo). Zgłoszone do rejestru pytań (nie ABC — brak realnej alternatywy do wyboru,
 * to obserwacja o luce, nie decyzja produktowa) zamiast cichego zgadywania liczby.
 */
function renderReligiaSection(religion: EmpireDetailSnap['religion']): string {
  let h = '<div class="civ-emp-sect" data-section="religia">'
    + '<div class="civ-emp-eyebrow">RELIGIA IMPERIUM</div>';

  if (religion.cities.length === 0) {
    h += `<div class="civ-emp-hero pos">${esc(religion.stateReligionLabel)}</div>`
      + '<div class="civ-emp-empty">Brak miast — wyznawcy pojawią się po założeniu osiedli.</div></div>';
    return h;
  }

  h += '<div style="display:flex;align-items:center;gap:12px;margin-top:4px">'
    + `<span class="civ-emp-relig-medallion">${brandIconSvg('cp-religion', 24)}</span>`
    + '<span style="flex:1;min-width:0">'
    + `<span class="civ-emp-relig-name">${esc(religion.stateReligionLabel)}</span>`
    + '<span class="civ-emp-relig-sub">religia państwowa · własna</span></span></div>';

  h += '<div class="civ-emp-two">'
    + `<div class="civ-emp-box"><div class="k">WYZNAWCY</div><div class="v">${formatManpower(religion.totalAdherents)} `
    + `<span style="font-size:11px;color:#78c95a;font-weight:600">${religion.ownSharePct}%</span></div></div>`
    + `<div class="civ-emp-box"><div class="k">WIARA / TURĘ</div><div class="v">${signedTxt(religion.faithRatePerTurn)}</div></div>`
    + '</div>';

  h += split2BarHtml(religion.ownSharePct, '#6a4010', '#d9a441', religion.foreignSharePct, '#3a4657', '#9aa4b2');
  h += '<div style="display:flex;gap:8px;margin-top:6px;font-size:11px">'
    + `<span style="flex:1" class="civ-emp-slider-label gold">${esc(religion.stateReligionLabel)} ${religion.ownSharePct}%</span>`;
  if (religion.foreignSharePct > 0) {
    h += `<span class="civ-emp-slider-label neutral">${esc(religion.foreignLabel ?? 'Inne religie')} ${religion.foreignSharePct}%</span>`;
  }
  h += '</div>';

  h += '<div class="civ-emp-relig-fx-hdr">Efekty</div>'
    + '<div class="civ-emp-relig-fx">'
    + '<div class="civ-emp-relig-fx-row"><span>Zadowolenie (miasta z dominującą religią państwa)</span>'
    + `<span class="v">+${religion.zadowolenieBonus}</span></div>`
    + `<div class="civ-emp-relig-fx-row"><span>Świątynie</span><span class="v neutral">${religion.templeCount}</span></div>`
    + '</div>';

  const grid = '1fr 1.1fr 0.8fr';
  h += '<div class="civ-emp-relig-fx-hdr">Miasta</div>'
    + `<div class="civ-emp-mini civ-emp-religia-city-tbl">${miniHeader(['MIASTO', 'RELIGIA', 'WYZNAWCY'], grid)}`;
  for (const c of religion.cities) {
    const relCell = c.religionLabel === '—'
      ? '<span style="color:#6f7889">—</span>'
      : `<span style="color:${c.isOwn ? '#d9a441' : '#9aa4b2'}">${esc(c.religionLabel)}</span>`;
    h += miniRow([esc(c.name), relCell, formatManpower(c.adherents)], grid);
  }
  h += '</div>';

  h += '<div class="civ-emp-foot">Pełne rozbicie per miasto — panel miasta, zakładka Religia. '
    + '„Efekty" — bonusy religii państwa aktywne w mieście, gdzie ona dominuje.</div>';
  h += '</div>';
  return h;
}

/**
 * P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA punkt 2 (Maciej 2026-08-12) — kolumny UKRYTE przez
 * checkboxy filtra nad tabelą „Miasta". Trwa między renderami (nie reset przy każdym
 * odświeżeniu), bo to czysto stan wyświetlania — analogicznie do `activeSection` wyżej.
 * MIASTO (id, `toggle:false` w MIASTA_TABLE_COLUMNS) nigdy tu nie trafia — checkbox dla niej
 * się nie renderuje (zobacz `cityMiastaColFilterHtml`).
 */
const miastaHiddenCols = new Set<string>();

/** Checkboxy widoczności kolumn — punkt (a) zadania. Kolejność kolumn (`grid-template-columns`)
 *  zostaje jak dziś; checkbox WYŁĄCZNIE pokazuje/ukrywa, nie zmienia kolejności. */
function cityMiastaColFilterHtml(): string {
  const chips = MIASTA_TABLE_COLUMNS.filter(c => c.toggle).map(c => {
    const checked = miastaHiddenCols.has(c.id) ? '' : ' checked';
    return `<label class="civ-emp-colchk"><input type="checkbox" data-miasta-col="${esc(c.id)}"${checked}> ${esc(c.label)}</label>`;
  }).join('');
  return `<div class="civ-emp-colfilter" id="civ-emp-miasta-colfilter">${chips}</div>`;
}

// Eksport dla testów -- patrz komentarz przy cityMiastaMiniDetail wyżej (ten sam powód: realna
// symulacja checkboxów w jsdom zamiast dopasowania tekstu).
export function wireMiastaColFilter(): void {
  const host = document.getElementById('civ-emp-miasta-colfilter');
  if (!host) return;
  for (const inp of Array.from(host.querySelectorAll<HTMLInputElement>('input[data-miasta-col]'))) {
    inp.addEventListener('change', () => {
      const id = inp.dataset.miastaCol;
      if (!id) return;
      if (inp.checked) miastaHiddenCols.delete(id); else miastaHiddenCols.add(id);
      render();
    });
  }
}

/** Komórka jednego wiersza miasta dla danej kolumny (`colId` = `MiastaColDef.id`). */
function miastaCellFor(r: {
  name: string; obyw: number; ludnoscLabel: string; wzrost: number | null;
  praca: number; pieniadz: number; zywnosc: number | null;
  surowce: Record<string, number> | undefined;
}, colId: string): string {
  switch (colId) {
    case 'miasto': return esc(r.name);
    case 'obyw': return String(r.obyw);
    case 'ludnosc': return esc(r.ludnoscLabel);
    case 'wzrost': return r.wzrost != null ? `${Math.round(r.wzrost)}%` : '—';
    case 'praca': return signedTxt(r.praca);
    case 'pieniadz': return signedTxt(r.pieniadz);
    case 'zywnosc': return r.zywnosc != null ? signedIntTxt(r.zywnosc) : '—';
    // Punkt (b): utrzymanie surowcowe budynków W TYM mieście — patrz JSDoc
    // EmpireCityEconRow.utrzymanieSurowcowBudynkow (empireDetailTypes.ts) skąd DOKŁADNIE
    // pochodzi ta liczba (buildingResourceUpkeepForCityId w main.ts, per-miasto z definicji).
    case 'surowce': return formatResourceUpkeepEmpireLine(r.surowce);
    default: return '—';
  }
}

// Eksport dla testów (ten sam wzorzec co resUsageDetailsHtml wyżej) — pozwala testowi NAPRAWDĘ
// zbundlować i wywołać tę funkcję (esbuild+jsdom, symulacja checkboxów filtra kolumn) zamiast
// dopasowywać tekst w źródle (zadanie 3, empire-miasta-table-test.cjs sekcja L).
// / EN: exported for tests (same pattern as resUsageDetailsHtml above) — lets the test REALLY
// bundle and call this function (esbuild+jsdom, column-filter checkbox simulation) instead of
// matching text in the source.
export function cityMiastaMiniDetail(
  ce: EmpireDetailSnap['cityEcon'],
  cp: EmpireDetailSnap['cityPobor'],
  food: EmpireFoodSnap,
  e: EmpireDetailSnap['economy'],
): string {
  if (cp.length === 0) {
    return '<div class="civ-emp-empty">Brak miast — załóż osiedle na mapie.</div>';
  }
  const foodById = new Map(food.perCityRows.map(r => [r.cityId, r]));
  // Dane per miasto liczone RAZ — użyte zarówno do wierszy, jak i do wiersza podsumowania
  // (punkt c), żeby suma/średnia w stopce dokładnie odpowiadały temu, co widać w wierszach
  // powyżej (nie osobne, mogące się rozjechać przeliczenie).
  // P-EMPIRE-MIASTA-JOIN-INDEX (naprawa F2, Evaluator FAIL na 89c16ec1): `ce` (cityEcon) i `cp`
  // (cityPobor) powstają jako `pc.map(...)` z TEJ SAMEJ tablicy źródłowej w main.ts
  // (buildEmpireDetailSnap) — są RÓWNOLEGŁE INDEKSOWO. Join po nazwie (`ce.find(c => c.name
  // === pob.name)`) był błędny: nazwy miast NIE są unikalne w obrębie jednej cywilizacji
  // (`captureCity()` w siege.ts zachowuje nazwę zdobytego miasta), więc dwa miasta tego samego
  // ownera o tej samej nazwie dawały: oba wiersze dostawały dane PIERWSZEGO dopasowania, a
  // wiersz podsumowania liczył podwójnie i gubił drugie miasto całkowicie. Food joinowane po
  // cityId (patrz EmpireCityPoborRow.cityId, empireDetailTypes.ts) z tego samego powodu.
  // / EN: `ce`/`cp` are index-parallel (built from the same `pc.map()` in main.ts) — joining by
  // name was wrong because city names are not unique within one civilization (captureCity()
  // keeps the conquered city's name); two same-owner cities sharing a name both got the FIRST
  // match's data, and the summary row double-counted one and lost the other entirely. Food is
  // joined by cityId for the same reason.
  const rows = cp.map((pob, i) => {
    const econ = ce[i];
    const fd = foodById.get(pob.cityId);
    return {
      name: pob.name,
      obyw: pob.ludki,
      ludnoscLabel: pob.ludnoscAbsLabel,
      ludnoscAbsolutna: pob.ludnoscAbsolutna,
      wzrost: fd != null ? fd.wzrostProcent : null,
      praca: (econ?.pracaPula ?? 0) + (econ?.pracaBudynki ?? 0),
      pieniadz: econ?.pieniadz ?? 0,
      zywnosc: fd != null ? fd.bilans : null,
      surowce: econ?.utrzymanieSurowcowBudynkow,
    };
  });

  const cols: MiastaColDef[] = visibleMiastaColumns(miastaHiddenCols);
  const grid = miastaColumnGridTemplate(cols);

  let h = `<div class="civ-emp-note">Miasta imperium: <b>${e.osiedla}</b>`
    + ` · przyrost ludności łącznie: <b>${signedPl(e.ludnoscRate ?? 0)}</b> obyw./turę</div>`;
  // Punkt (a): checkboxy widoczności kolumn nad tabelą.
  h += cityMiastaColFilterHtml();
  h += `<div class="civ-emp-mini-scroll"><div class="civ-emp-mini">`;
  h += miniHeader(cols.map(c => (c.iconId ? { label: c.label, iconId: c.iconId } : c.label)), grid);
  for (const r of rows) {
    h += miniRow(cols.map(c => miastaCellFor(r, c.id)), grid);
  }
  // Punkt (c): wiersz podsumowania — suma każdej kolumny, poza WZROST gdzie to ŚREDNIA
  // (computeMiastaSummaryRow, empireMiastaTable.ts — czysta agregacja liczb z wierszy powyżej,
  // zero nowego przeliczenia ekonomii).
  const summary = computeMiastaSummaryRow(rows.map(r => ({
    obyw: r.obyw,
    ludnoscAbsolutna: r.ludnoscAbsolutna,
    wzrostProcent: r.wzrost,
    praca: r.praca,
    pieniadz: r.pieniadz,
    zywnosc: r.zywnosc ?? 0,
    surowce: r.surowce,
  })));
  const summaryCellFor = (colId: string): string => {
    switch (colId) {
      case 'miasto': return 'SUMA / ŚREDNIA';
      case 'obyw': return String(summary.obywTotal);
      case 'ludnosc': return esc(formatManpower(summary.ludnoscAbsolutnaTotal));
      case 'wzrost': return summary.wzrostProcentAvg != null ? `${summary.wzrostProcentAvg}%` : '—';
      case 'praca': return signedTxt(summary.pracaTotal);
      case 'pieniadz': return signedTxt(summary.pieniadzTotal);
      case 'zywnosc': return signedIntTxt(summary.zywnoscTotal);
      case 'surowce': return formatResourceUpkeepEmpireLine(summary.surowceTotal);
      default: return '';
    }
  };
  h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
    + cols.map(c => `<div>${summaryCellFor(c.id)}</div>`).join('') + `</div>`;
  h += '</div></div>';
  h += '<div class="civ-emp-foot">'
    + 'PRACA = suma do puli imperium i do budynków w mieście / turę · '
    + 'PIENIĄDZ = wpływ netto do skarbca po suwakach · '
    + 'ŻYWNOŚĆ = bilans lokalny miasta (produkcja − racje) · '
    + 'WZROST = szacowany % wzrostu ludności (szczegóły w panelu miasta) · '
    + 'SUROWCE = zapotrzebowanie surowcowe budynków wybudowanych W TYM mieście / turę (pełne, '
    + 'bez klamrowania do zapasu magazynu — patrz „Zobacz szczegóły zużycia" niżej) — obywatele '
    + '(magazyn centralny) i wojsko (porusza się po mapie) są civ-wide, bez podziału na miasta; '
    + 'to POPYT przypisany do miasta — faktyczny drenaż magazynu idzie z puli CAŁEGO imperium '
    + '(surowiec może zejść z zapasu innego miasta); pełne rozbicie budynki/obywatele/wojsko per '
    + 'surowiec: sekcja SUROWCE → karta surowca → „Zobacz szczegóły zużycia".</div>'
    + '<div class="civ-emp-foot">Wiersz „SUMA / ŚREDNIA" na dole — suma dla każdej kolumny, poza '
    + 'WZROST (tam średnia z miast, dla których wzrost jest znany).</div>';
  // N1 (Evaluator, notatka na 89c16ec1): queueMicrotask(wireMiastaColFilter) NIE jest tu wołane —
  // ta funkcja bywa wołana 2x na render() (patrz detailFor w render()), co podpinałoby listenery
  // podwójnie. Wiring przeniesiony do JEDNEGO wywołania w render(), po bodyEl.innerHTML=.
  // / EN: queueMicrotask(wireMiastaColFilter) intentionally NOT called here — this function used
  // to be invoked twice per render() (see detailFor in render()), which would double-wire
  // listeners. Wiring moved to a SINGLE call in render(), after bodyEl.innerHTML=.
  return h;
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   R-DESIGN-11-ZAKLADEK faza 3 — Klatki 8 i 9: rozejście wspólnej zakładki `econ-miasta` na dwa
   niezależne bloki „Miasto" (kąt produkcyjny, §8.10) i „Obywatele" (kąt społeczny, §8.11).

   ⚠️ ZAKRES ŚWIADOMIE WĘŻSZY NIŻ MAKIETA — powód i dokładna lista pominięć przy każdej funkcji
   niżej. Reguła przyjęta za precedensem `renderReligiaSection()` w tym samym pliku (pominięty
   wiersz „Porządek" z makiety, bo żaden parametr silnika go nie niesie): pozycja z makiety, dla
   której `EmpireDetailSnap` NIE ma pola, jest POMIJANA i opisana, a NIE wypełniana wymyśloną
   liczbą — CLAUDE.md §3 („każda liczba ma nazwany parametr i jednostkę"; nazwany parametr musi
   istnieć NAPRAWDĘ). Dociągnięcie brakujących danych wymaga zmian w `main.ts`
   (`buildEmpireDetailSnap`) i `empireDetailTypes.ts`, czyli poza zakresem tego zlecenia
   („dane/liczby/logika biznesowa bez zmian").
   Kolejność cięcia zakresu wzięta z rejestru decyzji designera §8 pkt 3: wpływy do skarbca →
   surowce → kolejka → budynki → obrona/populacja.
   EN: the shared `econ-miasta` tab splits into two independent blocks. Scope is deliberately
   narrower than the mockup: any mockup item with no backing field in `EmpireDetailSnap` is
   OMITTED and documented rather than filled with an invented number — same rule the existing
   `renderReligiaSection()` already applies to the mockup's "Order" row.
   ══════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * Zakres zakładki „Miasto": `null` = całe imperium, inaczej `cityId` wybranego miasta.
 * Trwa między renderami (czysty stan wyświetlania — jak `miastaHiddenCols` wyżej).
 * Klucz to `cityId`, NIE indeks ani nazwa — patrz P-EMPIRE-MIASTA-JOIN-INDEX
 * (`EmpireCityPoborRow.cityId` JSDoc): nazwy miast NIE są unikalne po podboju.
 * EN: "Miasto" tab scope: null = whole empire, otherwise the selected city's `cityId` (not an
 * index, not a name — city names are not unique after conquest).
 */
let miastoScopeCityId: string | null = null;

/**
 * Typy surowca ODZNACZONE w sekcji „Produkowane surowce" zakładki Miasto. Rozszerzenie
 * istniejącego wzorca `miastaHiddenCols` (filtr kolumn tabeli Miasta) na typy surowca —
 * §6 handoffu designera wprost zakazuje wymyślania nowego mechanizmu: „Mechanizm «zaznacz
 * i zobacz sumę cywilizacyjną» = rozszerzenie istniejącego filtra kolumn (`miastaHiddenCols`
 * + `computeMiastaSummaryRow()`) na wiersze kategorii i typy surowca. Nowego wzorca nie
 * wprowadzam." UWAGA (Evaluator 2026-08-16): cytat opisuje MECHANIZM (filtr/wygaszanie/sumowanie),
 * nie dosłowne wywołanie `computeMiastaSummaryRow()` — ta funkcja ma sztywny schemat kolumn
 * (obyw/ludność/praca/pieniądz/żywność/wzrost%/surowce) i nie sumuje dowolnej, konfigurowalnej
 * listy typów surowca, więc suma tutaj liczona jest inline tym samym WZOREM (gasną, nie znikają;
 * wypadają z sumy), a nie przez wywołanie tej konkretnej funkcji. Odznaczone GASNĄ
 * (`.civ-emp-grp-row.off`), nie znikają, i wypadają z sumy.
 * EN: resource types UNCHECKED in the Miasto tab — same "hidden set + summary row" pattern as
 * `miastaHiddenCols`, extended to resource types per the designer handoff §6.
 */
const miastoHiddenResKeys = new Set<string>();

/** Przełącznik zakresu w stylu `.civ-emp-mocview-btn` (§6 handoffu designera). */
function miastoScopeSwitchHtml(cp: EmpireDetailSnap['cityPobor']): string {
  const btn = (active: boolean, id: string, label: string): string =>
    `<button type="button" class="civ-emp-mocview-btn${active ? ' active' : ''}" `
    + `data-miasto-scope="${esc(id)}">${esc(label)}</button>`;
  let h = '<div class="civ-emp-mocview" style="flex-wrap:wrap">';
  h += btn(miastoScopeCityId === null, '', 'Całe imperium');
  for (const c of cp) h += btn(miastoScopeCityId === c.cityId, c.cityId, c.name);
  return h + '</div>';
}

/** Podpięcie przycisków zakresu — wzorzec 1:1 z `wireMocViewButtons()`. */
export function wireMiastoScopeButtons(): void {
  if (bodyEl === null) return;
  for (const btn of Array.from(bodyEl.querySelectorAll<HTMLButtonElement>('[data-miasto-scope]'))) {
    btn.addEventListener('click', () => {
      const raw = btn.dataset.miastoScope ?? '';
      const next = raw === '' ? null : raw;
      if (next === miastoScopeCityId) return;
      miastoScopeCityId = next;
      render();
    });
  }
}

/** Podpięcie checkboxów typów surowca — wzorzec 1:1 z `wireMiastaColFilter()`. */
export function wireMiastoResFilter(): void {
  if (bodyEl === null) return;
  for (const inp of Array.from(bodyEl.querySelectorAll<HTMLInputElement>('input[data-miasto-res]'))) {
    inp.addEventListener('change', () => {
      const key = inp.dataset.miastoRes;
      if (!key) return;
      if (inp.checked) miastoHiddenResKeys.delete(key); else miastoHiddenResKeys.add(key);
      render();
    });
  }
}

/** Nagłówek sekcji wewnątrz zakładki (wielkie litery + kreska) — `.civ-emp-res-lbl` z Surowców. */
function subHdr(label: string): string {
  return `<div class="civ-emp-res-lbl">${esc(label)}</div>`;
}

/**
 * Klatka 8 — „Miasto", kąt produkcyjny (§8.10, lista zatwierdzona `R-DESIGN-11-ZAKLADEK` Q2=B).
 *
 * ZREALIZOWANE (dane realnie obecne w `EmpireDetailSnap`): przełącznik zakresu, wpływy do
 * skarbca per miasto (priorytet 1 z rejestru §8 pkt 3), produkcja Nauki per miasto, produkowane
 * surowce z checkboxami i sumą cywilizacyjną (priorytet 2), populacja per miasto.
 *
 * POMINIĘTE ŚWIADOMIE — brak pola w snapshocie, dociągnięcie = zmiana `main.ts`/`empireDetailTypes.ts`
 * (poza zakresem zlecenia):
 *   • „Budynki i ich produkcja" w 8 kategoriach `BUILDING_GROUP_ORDER` — snapshot nie niesie ANI
 *     liczby budynków per kategoria, ANI ich produkcji per kategoria (`EmpireCityEconRow` ma
 *     wyłącznie zagregowane `pieniadz`/`praca*`/`nauka`). 8 wierszy z samymi „—" byłoby gorsze
 *     niż ich brak. Priorytet 4 z 5 w kolejności cięcia zakresu.
 *   • „Kolejka produkcji" (co miasto buduje, ile tur) — snapshot nie ma żadnego pola kolejki.
 *     Priorytet 3 z 5.
 *   • „Obrona miasta" (mury/garnizon/bonusy) i „obrabiane pola" — brak pól. Priorytet 5 z 5.
 *   • Kolumna SZLAKI per miasto — `EmpireTradeRouteRow` niesie tylko `cityName`, a nazwy miast
 *     NIE są unikalne (P-EMPIRE-MIASTA-JOIN-INDEX): join po nazwie policzyłby trasy podwójnie dla
 *     dwóch miast o tej samej nazwie. Zamiast wprowadzać dokładnie ten błąd, który plik już raz
 *     naprawiał, szlaki pokazane są zbiorczo dla imperium z odsyłaczem do zakładki Handel.
 *   • Kolumna „SUROWCE" z dzisiejszej wspólnej tabeli — CELOWO nie wchodzi (§6 handoffu: „to
 *     koszt, nie produkcja; zostaje w Skarbcu i Surowcach").
 *   • Koszt utrzymania JEDNOSTEK — celowo nieobecny, korekta właściciela (koszt całej cywilizacji,
 *     nie per-miasto).
 */
function renderMiastoSection(
  ce: EmpireDetailSnap['cityEcon'],
  cp: EmpireDetailSnap['cityPobor'],
  e: EmpireDetailSnap['economy'],
  trade: EmpireDetailSnap['trade'],
  resources: EmpireResourceRow[],
): string {
  let h = '<div class="civ-emp-sect" data-section="miasto">'
    + '<div style="display:flex;align-items:center;gap:6px">'
    + `<span class="civ-emp-mini-h-ic" aria-hidden="true">${brandIconSvg('tb-cities', 12)}</span>`
    + '<span class="civ-emp-eyebrow">MIASTA — PRODUKCJA</span></div>';

  if (cp.length === 0) {
    h += '<div class="civ-emp-hero pos">0 miast</div>'
      + '<div class="civ-emp-empty">Brak miast — załóż osiedle na mapie.</div></div>';
    return h;
  }

  // Zakres: `cityEcon` i `cityPobor` są RÓWNOLEGŁE INDEKSOWO (patrz P-EMPIRE-MIASTA-JOIN-INDEX),
  // więc zawężenie robimy raz, po indeksie wyliczonym z `cityPobor`, i stosujemy do obu tablic.
  // Samo-naprawa zakresu: wybrane miasto mogło w międzyczasie przestać należeć do gracza
  // (zdobyte przez wroga / zniszczone). Bez tego zakładka pokazywałaby pustkę z nieaktualną
  // nazwą w hero. / EN: self-heal — the pinned city may have been captured or destroyed
  // since it was selected; fall back to the whole empire instead of rendering an empty tab.
  if (miastoScopeCityId !== null && !cp.some(c => c.cityId === miastoScopeCityId)) {
    miastoScopeCityId = null;
  }
  const paired = cp
    .map((pob, i) => ({ pob, econ: ce[i] }))
    .filter(x => miastoScopeCityId === null || x.pob.cityId === miastoScopeCityId);
  const scopeLabel = miastoScopeCityId === null
    ? `${paired.length} ${miastoCountWord(paired.length)}`
    : (paired[0]?.pob.name ?? '—');

  let sumPraca = 0;
  let sumPieniadz = 0;
  let sumNauka = 0;
  for (const { econ } of paired) {
    sumPraca += (econ?.pracaPula ?? 0) + (econ?.pracaBudynki ?? 0);
    sumPieniadz += econ?.pieniadz ?? 0;
    sumNauka += econ?.nauka ?? 0;
  }

  // Surowce produkowane (civ-wide — snapshot nie ma rozbicia produkcji surowców per miasto).
  const prodRows = resources.filter(r => !r.placeholder && r.dostep
    && Math.round(r.rateProductionPerTurn ?? r.ratePerTurn) !== 0);

  h += `<div class="civ-emp-hero">${esc(scopeLabel)}</div>`
    + `<div class="civ-emp-hero-sub">Praca <b>${Math.round(sumPraca)}</b> pkt/turę · `
    + `skarbiec <b>${treasuryBalanceSignedTxt(Math.round(sumPieniadz))}</b>/turę · `
    + `nauka <b>${signedIntTxt(sumNauka)}</b> PN/turę · <b>${prodRows.length}</b> `
    + 'produkowanych surowców (imperium)</div>';

  h += miastoScopeSwitchHtml(cp);

  // — WPŁYWY DO SKARBCA (priorytet 1 kolejności wdrożenia) —
  // Rozkład na trzy składniki DOKŁADNIE tą samą formułą co bilans imperium w
  // `cityEconMiniSkarbiec()`/`renderSkarbiecSection()` wyżej: tam `daninaBud = wplywy − handel`
  // (brutto minus szlaki); tu ta sama różnica na per-miastowych odpowiednikach tych pól
  // (`pieniadzBrutto` − `handelZeSzlakow`). Gdy `pieniadzBrutto` jest `undefined` (brak ticku)
  // kolumna pokazuje „—" zamiast zgadywanej liczby.
  // EN: the three columns use the SAME decomposition as the empire-level treasury balance above.
  h += subHdr('Wpływy do skarbca');
  {
    const grid = '1fr 0.8fr 0.8fr 0.95fr';
    h += `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'PODATEK', 'SZLAKI', 'UTRZ. BUD.'], grid)}`;
    let sPod = 0;
    let sSzl = 0;
    let sUtr = 0;
    let anyPodatek = false;
    for (const { pob, econ } of paired) {
      const szlaki = econ?.handelZeSzlakow ?? 0;
      const utrz = econ?.utrzymanieBudynkow ?? 0;
      const brutto = econ?.pieniadzBrutto;
      const podatek = brutto != null ? brutto - szlaki : null;
      if (podatek != null) { sPod += podatek; anyPodatek = true; }
      sSzl += szlaki;
      sUtr += utrz;
      h += miniRow([
        esc(pob.name),
        podatek != null ? tblValTxt(podatek) : '<span style="color:#6f7889">—</span>',
        tblValTxt(szlaki),
        tblValTxt(-utrz),
      ], grid);
    }
    h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
      + '<div>CAŁA CYWILIZACJA</div>'
      + `<div>${anyPodatek ? treasuryBalanceSignedTxt(Math.round(sPod)) : '—'}</div>`
      + `<div>${treasuryBalanceSignedTxt(Math.round(sSzl))}</div>`
      + `<div>${treasuryBalanceSignedTxt(-Math.round(sUtr))}</div></div>`;
    h += '</div>';
    h += '<div class="civ-emp-foot">PODATEK = wpływ brutto miasta bez dochodu ze szlaków (pkt Pieniądza/turę) · '
      + 'SZLAKI = dochód z tras handlowych · UTRZ. BUD. = utrzymanie budynków tego miasta. '
      + 'Bez utrzymania jednostek — to koszt całej cywilizacji, nie miasta. '
      + 'Pełny bilans imperium: zakładka Skarbiec.</div>';
  }

  // — PRODUKCJA NAUKI —
  h += subHdr('Produkcja nauki');
  {
    const maxN = paired.reduce((m, x) => Math.max(m, x.econ?.nauka ?? 0), 0);
    h += '<div style="display:flex;flex-direction:column;gap:5px">';
    for (const { pob, econ } of paired) {
      const n = econ?.nauka ?? 0;
      const pct = maxN > 0 ? Math.max(0, Math.round((n / maxN) * 100)) : 0;
      h += '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#cfd5de">'
        + `<span style="flex:1;min-width:0">${esc(pob.name)}</span>`
        + '<span style="flex:2;height:8px;border-radius:999px;background:#1f2733;overflow:hidden">'
        + `<span style="display:block;height:100%;width:${pct}%;`
        + 'background:linear-gradient(90deg,#2c4a6b,#8ec5ff)"></span></span>'
        + '<span style="width:62px;text-align:right;color:#8ec5ff;font-weight:600">'
        + `${signedIntTxt(n)} PN</span></div>`;
    }
    h += '</div>';
    h += `<div class="civ-emp-foot">Suma zakresu: <b>${signedIntTxt(sumNauka)}</b> PN/turę · `
      + `bank nauki imperium: <b>${Math.floor(e.nauka)}</b> PN. Pasek = udział miasta względem `
      + 'najsilniejszego w zakresie.</div>';
  }

  // — PRODUKOWANE SUROWCE (priorytet 2) — mechanizm „zaznacz i zobacz sumę cywilizacyjną" —
  h += subHdr('Produkowane surowce');
  if (prodRows.length === 0) {
    h += '<div class="civ-emp-empty">Brak surowców z dodatnią produkcją własną.</div>';
  } else {
    h += '<div class="civ-emp-grp-list">';
    let sumChecked = 0;
    let nChecked = 0;
    for (const r of prodRows) {
      const off = miastoHiddenResKeys.has(r.id);
      const prod = Math.round(r.rateProductionPerTurn ?? r.ratePerTurn);
      if (!off) { sumChecked += prod; nChecked++; }
      h += `<label class="civ-emp-grp-row${off ? ' off' : ''}">`
        + `<input type="checkbox" data-miasto-res="${esc(r.id)}"${off ? '' : ' checked'}>`
        + `<span class="civ-emp-res-ic" aria-hidden="true">${mapResourceIconSvg(r.id, 16)}</span>`
        + `<span class="nm">${esc(r.label)}</span>`
        + `<span class="qty">${Math.round(r.stock)} w mag.</span>`
        + `<span class="val">${signedIntTxt(prod)}</span></label>`;
    }
    h += '<div class="civ-emp-grp-sum">'
      + `<span class="nm">CAŁA CYWILIZACJA · ${nChecked} z ${prodRows.length}</span>`
      + `<span class="val">${signedIntTxt(sumChecked)} szt./turę</span></div>`;
    h += '</div>';
    h += '<div class="civ-emp-foot">Produkcja WŁASNA / turę (teren + konwertery, bez umów '
      + 'dyplomatycznych) — liczba całego imperium: silnik nie rozbija produkcji surowców na '
      + 'miasta, więc ta sekcja nie zmienia się z przełącznikiem zakresu. Odznaczenie gasi pozycję '
      + 'i wyjmuje ją z sumy. Stany magazynu i zużycie: zakładka Surowce.</div>';
  }

  // — POPULACJA I HANDEL —
  h += subHdr('Populacja · handel');
  {
    const grid = '1fr 0.6fr 0.95fr';
    h += `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'OBYW.', 'LUDNOŚĆ'], grid)}`;
    let sObyw = 0;
    let sAbs = 0;
    for (const { pob } of paired) {
      sObyw += pob.ludki;
      sAbs += pob.ludnoscAbsolutna;
      h += miniRow([esc(pob.name), String(pob.ludki), esc(pob.ludnoscAbsLabel)], grid);
    }
    h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
      + `<div>CAŁA CYWILIZACJA</div><div>${sObyw}</div>`
      + `<div>${esc(formatManpower(sAbs))}</div></div>`;
    h += '</div>';
    h += `<div class="civ-emp-foot">Szlaki handlowe imperium: <b>${trade.routes.length}</b> · `
      + `dochód <b>${treasuryBalanceSignedTxt(Math.round(trade.totalIncome))}</b> Pieniądza/turę — `
      + 'rozpiska tras w zakładce Handel (panel imperium nie wiąże trasy z konkretnym miastem '
      + 'jednoznacznie, bo nazwy miast nie są unikalne). Kolejka produkcji, obrona i obrabiane '
      + 'pola — panel miasta.</div>';
  }

  h += '</div>';
  return h;
}

/**
 * Klatka 9 — „Obywatele", kąt społeczny (§8.11, lista zatwierdzona bez korekt).
 *
 * ZREALIZOWANE: hero (obywatele/ludzie/zużycie), podział Pracy, Kultura z progiem, karta Religii,
 * poziom Zadowolenia, Rekruci, zużycie surowców przez obywateli per miasto z sumą cywilizacyjną.
 *
 * POMINIĘTE ŚWIADOMIE — brak pola w snapshocie (ta sama reguła co przy `renderMiastoSection`):
 *   • ROZBICIE Zadowolenia na źródła (Kultura/Religia/Zdrowie/Wyżywienie/Niedobór surowców) —
 *     `HudState` niesie wyłącznie zagregowane `zadowolenie`, żadnego rozbicia. Pokazany jest sam
 *     poziom + istniejąca notatka `kultura.happinessNote`; pięć wymyślonych składników byłoby
 *     złamaniem CLAUDE.md §3.
 *   • Tabela „Zdrowie · prawo · wyżywienie" — wymaga liczby budynków per kategoria (jak w Mieście,
 *     brak) oraz poziomu racji, którego snapshot nie niesie (suwak racji żyje w Spichlerzu).
 *   • „ilu obywateli w polu / w budynkach" — snapshot ma WYŁĄCZNIE `pracaPula`/`pracaBudynki`,
 *     czyli punkty PRACY na turę, nie liczbę obywateli. Etykiety nazywają więc wprost to, co
 *     naprawdę jest mierzone (pkt Pracy/turę), zamiast podpisywać punkty Pracy jako ludzi —
 *     CLAUDE.md §3.
 */
function renderObywateleSection(
  ce: EmpireDetailSnap['cityEcon'],
  cp: EmpireDetailSnap['cityPobor'],
  e: EmpireDetailSnap['economy'],
  p: EmpireDetailSnap['power'],
  k: EmpireDetailSnap['kultura'],
  religion: EmpireDetailSnap['religion'],
  resources: EmpireResourceRow[],
): string {
  let h = '<div class="civ-emp-sect" data-section="obywatele">'
    + '<div style="display:flex;align-items:center;gap:6px">'
    + `<span class="civ-emp-mini-h-ic" aria-hidden="true">${brandIconSvg('res-population', 12)}</span>`
    + '<span class="civ-emp-eyebrow">OBYWATELE IMPERIUM</span></div>';

  if (cp.length === 0) {
    h += '<div class="civ-emp-hero pos">0 obywateli</div>'
      + '<div class="civ-emp-empty">Brak miast — obywatele pojawią się po założeniu osiedli.</div></div>';
    return h;
  }

  let sumObyw = 0;
  let sumAbs = 0;
  for (const c of cp) { sumObyw += c.ludki; sumAbs += c.ludnoscAbsolutna; }
  let sumPula = 0;
  let sumBud = 0;
  for (const c of ce) { sumPula += c.pracaPula; sumBud += c.pracaBudynki; }

  // Zużycie surowców przez obywateli — TA SAMA formuła co silnik: `floor(population × stawka)`
  // na KAŻDY surowiec wymagany w bieżącej epoce (`computeCitizenResourceDrain`,
  // citizen-resource-upkeep.ts). Lista surowców epoki czytana z `citizenRequired` w wierszach
  // Magazynu Państwa — panel nie zna epoki wprost, ale silnik już oznaczył nią te wiersze.
  // EN: same formula the engine uses — floor(population × rate) per resource required this era.
  const citizenResCount = resources.filter(r => r.citizenRequired === true).length;
  const zuzyciePerTyp = Math.floor(sumObyw * CITIZEN_UPKEEP_RATE_PER_CITIZEN);
  const zadow = e.zadowolenie;
  const przyrost = Math.round(e.ludnoscRate ?? 0);

  h += `<div class="civ-emp-hero">${esc(formatObywateleLabel(sumObyw))} · ${esc(formatManpower(sumAbs))} ludzi</div>`;
  h += '<div class="civ-emp-hero-sub">'
    + (zadow != null ? `Zadowolenie <b>${signedIntTxt(zadow)}</b> · ` : '')
    + `przyrost <b>${signedIntTxt(przyrost)}</b> obyw./turę · `
    + `zużycie surowców <b>${zuzyciePerTyp}</b> szt./turę na każdy z <b>${citizenResCount}</b> `
    + 'surowców epoki</div>';

  // — PODZIAŁ PRACY OBYWATELI —
  {
    const total = sumPula + sumBud;
    const pctB = total > 0 ? Math.round((sumBud / total) * 100) : 0;
    h += '<div class="civ-emp-two">'
      + '<div class="civ-emp-box"><div class="k">PRACA DO PULI</div>'
      + `<div class="v">${Math.round(sumPula)} <span style="font-size:11px;color:#7d8798;`
      + `font-weight:600">pkt/turę · ${100 - pctB}%</span></div></div>`
      + '<div class="civ-emp-box"><div class="k">PRACA W BUDYNKACH</div>'
      + `<div class="v">${Math.round(sumBud)} <span style="font-size:11px;color:#7d8798;`
      + `font-weight:600">pkt/turę · ${pctB}%</span></div></div>`
      + '</div>';
  }

  // — KULTURA —
  h += subHdr('Kultura');
  h += '<div style="display:flex;align-items:baseline;gap:8px;font-size:12.5px;color:#cfd5de">'
    + `<span style="flex:1">Zgromadzono <b style="color:#e8ebf0">${k.total}</b> pkt</span>`
    + `<span style="color:#78c95a;font-weight:600">${signedTxt(k.rate)} / turę</span></div>`;
  if (k.nextThreshold != null && k.pctToNext != null) {
    const pct = Math.max(0, Math.min(100, Math.round(k.pctToNext)));
    h += `<div class="civ-emp-bar" style="margin:7px 0 5px"><div class="fill warn" style="width:${pct}%"></div></div>`
      + `<div style="font-size:11px;color:#9aa4b2">${pct}% do progu <b style="color:#e8ebf0">`
      + `${k.nextThreshold}</b> pkt — rozszerzenie granic najsilniejszego miasta</div>`;
  } else {
    h += '<div style="font-size:11px;color:#9aa4b2">Brak kolejnego progu rozszerzenia granic.</div>';
  }

  // — RELIGIA —
  h += subHdr('Religia');
  h += '<div style="display:flex;align-items:center;gap:10px;padding:10px 11px;border:1px solid #2b3543;'
    + 'border-radius:8px;background:#171e2a">'
    + `<span class="civ-emp-relig-medallion">${brandIconSvg('cp-religion', 19)}</span>`
    + '<span style="flex:1;min-width:0">'
    + `<span style="display:block;font-size:13px;font-weight:700;color:#d9a441">${esc(religion.stateReligionLabel)}</span>`
    + '<span style="display:block;font-size:11px;color:#7d8798;margin-top:2px">religia państwowa · własna</span></span>'
    + '<span style="flex:none;text-align:right">'
    + `<span style="display:block;font-size:13px;font-weight:700;color:#e8ebf0">${esc(formatManpower(religion.totalAdherents))}</span>`
    + `<span style="display:block;font-size:10.5px;color:#7d8798">wyznawców · ${religion.ownSharePct}%</span></span></div>`;
  if (religion.foreignSharePct > 0) {
    h += `<div style="font-size:11px;color:#9aa4b2;margin-top:6px">Obca religia: `
      + `<b style="color:#cfd5de">${esc(religion.foreignLabel ?? 'Inne religie')}</b> `
      + `${religion.foreignSharePct}% wyznawców imperium</div>`;
  }

  // — SZCZĘŚCIE / ZADOWOLENIE —
  h += subHdr('Szczęście · zadowolenie');
  if (zadow != null) {
    const cls = zadow > 0 ? '#78c95a' : zadow < 0 ? '#e07a7a' : '#6f7889';
    h += '<div style="display:flex;align-items:baseline;gap:8px">'
      + '<span style="flex:1;font-size:13px;color:#e2e6ec">Poziom imperium</span>'
      + `<span style="font-size:15px;font-weight:800;color:${cls}">${signedIntTxt(zadow)}</span></div>`;
  } else {
    h += '<div class="civ-emp-empty">Poziom zadowolenia pojawi się po pierwszej turze.</div>';
  }
  h += `<div class="civ-emp-resp" style="margin-top:8px">${esc(k.happinessNote)}</div>`;
  h += '<div class="civ-emp-foot">Rozbicie Zadowolenia na źródła (kultura, religia, zdrowie, racje, '
    + 'niedobór surowców) liczone jest per miasto — panel miasta, zakładka Zadowolenie.</div>';

  // — REKRUCI —
  h += subHdr('Rekruci');
  {
    const pct = p.rekruciMax > 0 ? Math.round((p.rekruci / p.rekruciMax) * 100) : 0;
    const fillCls = pct >= 60 ? 'fill' : (pct >= 25 ? 'fill warn' : 'fill low');
    h += '<div style="display:flex;align-items:baseline;gap:8px;font-size:12.5px;color:#cfd5de">'
      + '<span style="flex:1">Pula do powołania</span>'
      + `<span><b style="color:#d9a441">${esc(p.rekruciLabel)}</b> / `
      + `<b style="color:#d9a441">${esc(p.rekruciMaxLabel)}</b></span></div>`
      + `<div class="civ-emp-bar" style="margin-top:7px"><div class="${fillCls}" style="width:${pct}%"></div></div>`
      + '<div class="civ-emp-foot">Rozbicie per miasto i odnowa — zakładka Armia.</div>';
  }

  // — ZUŻYCIE SUROWCÓW PRZEZ OBYWATELI —
  h += subHdr('Zużycie surowców przez obywateli');
  {
    const grid = '1fr 0.6fr 1fr';
    h += `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'OBYW.', 'ZUŻYCIE / TURĘ'], grid)}`;
    for (const c of cp) {
      const z = Math.floor(c.ludki * CITIZEN_UPKEEP_RATE_PER_CITIZEN);
      h += miniRow([
        esc(c.name),
        String(c.ludki),
        `<span style="color:#e07a7a">−${z}</span>`,
      ], grid);
    }
    h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
      + `<div>CYWILIZACJA</div><div>${sumObyw}</div><div>−${zuzyciePerTyp}</div></div>`;
    h += '</div>';
    h += `<div class="civ-emp-foot">${formatLiczbaPl(CITIZEN_UPKEEP_RATE_PER_CITIZEN, 1)} szt. surowca `
      + 'na obywatela na turę, z magazynu CENTRALNEGO imperium — liczba w kolumnie dotyczy KAŻDEGO '
      + `z ${citizenResCount} surowców wymaganych w tej epoce osobno, nie ich sumy. Wiersz `
      + 'CYWILIZACJA to zużycie całego imperium (silnik liczy je od sumy obywateli, nie miasto po '
      + 'mieście). Rozbicie per surowiec: zakładka Surowce → karta → „Zobacz szczegóły zużycia".</div>';
  }

  h += '</div>';
  return h;
}

function cityPoborMiniRekruci(
  rows: EmpireDetailSnap['cityPobor'],
  p: EmpireDetailSnap['power'],
  opts?: { skipHero?: boolean },
): string {
  const pct = p.rekruciMax > 0 ? Math.round((p.rekruci / p.rekruciMax) * 100) : 0;
  const fillCls = pct >= 60 ? 'fill' : (pct >= 25 ? 'fill warn' : 'fill low');
  let h = '';
  // R-DESIGN-11-ZAKLADEK / Armia: zakładka „Armia" pokazuje DOKŁADNIE te same liczby w hero
  // (jednostki na mapie) + podpisie (pula rekrutów, werb, koszt/szt.) i we własnym pasku NAD
  // tabelą, zgodnie z klatką 7 makiety — dlatego tam nagłówek tej funkcji jest pomijany, żeby
  // nie dublować pary „notatka + pasek". Domyślne wywołanie (blok ZASOBY IMPERIUM) bez zmian.
  // / EN: the "Armia" tab renders the very same numbers in its hero (units on map) + subtitle
  // (recruit pool, recruitable units, cost/unit) and its own bar ABOVE the table, per mockup
  // frame 7 — so the header is skipped there to avoid duplicating the note+bar pair. The
  // default call (EMPIRE RESOURCES block) is unchanged.
  if (!opts?.skipHero) {
    h += `<div class="civ-emp-note">Pula rekrutów imperium: <b style="color:#d9a441">${esc(p.rekruciLabel)}</b> / `
      + `<b style="color:#d9a441">${esc(p.rekruciMaxLabel)}</b> · można werbować: <b>${p.rekrutEkw}</b> jedn. `
      + `(koszt ${p.kosztJednostki} rekr./szt.) · wojsko na mapie: <b>${p.unitsOnMap}</b></div>`;
    h += `<div class="civ-emp-bar"><div class="${fillCls}" style="width:${pct}%"></div></div>`;
  }
  if (rows.length === 0) {
    h += '<div class="civ-emp-empty">Brak miast.</div>';
    return h;
  }
  // P-ARMIA-CHIP-PELNE-JEDNOSTKI (Maciej 2026-08-12): kolumna JEDN. = potencjalne pełne
  // jednostki z rekrutów TEGO miasta (rekruci ÷ p.kosztJednostki — TEN SAM koszt/jedn. co
  // "można werbować" w notatce wyżej i chip "Armia" w HUD, gra/src/game/manpower.ts:
  // unitManpowerCost). Wartość informacyjna, NIE floorowana — 1 miejsce po przecinku.
  // Wiersz RAZEM na końcu: suma rekrutów/max/odnowy per kolumnę + p.rekrutEkw (identyczne
  // z HUD i notatką wyżej, nie przeliczane osobno) w kolumnie JEDN.
  // / EN: JEDN. column = potential full units from THIS city's recruits (recruits ÷
  // p.kosztJednostki — the SAME cost/unit as "można werbować" in the note above and the HUD
  // "Armia" chip, gra/src/game/manpower.ts: unitManpowerCost). Informational, NOT floored —
  // one decimal place. RAZEM (total) row at the end: per-column sums of recruits/max/regen +
  // p.rekrutEkw (identical to the HUD and the note above, not recomputed separately) in the
  // JEDN. column.
  const grid = '1fr 0.9fr 0.75fr 0.85fr 0.85fr';
  h += `<div class="civ-emp-mini civ-emp-armia-rekr-tbl">${miniHeader(['MIASTO', 'REKRUCI', 'MAX', 'ODNOWA', 'JEDN.'], grid)}`;
  let sumRekruci = 0;
  let sumMax = 0;
  let sumRegen = 0;
  for (const c of rows) {
    sumRekruci += c.rekruci;
    sumMax += c.rekruciMax;
    sumRegen += c.regenPerTurn;
    const ekwMiasto = p.kosztJednostki > 0 ? c.rekruci / p.kosztJednostki : 0;
    h += miniRow([esc(c.name), String(c.rekruci), String(c.rekruciMax),
      `<span style="color:#78c95a">+${c.regenPerTurn}</span>`,
      formatLiczbaPl(ekwMiasto, 1)], grid);
  }
  h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
    + `<div>RAZEM (imperium)</div><div>${sumRekruci}</div><div>${sumMax}</div>`
    + `<div>+${sumRegen}</div><div>${p.rekrutEkw}</div></div>`;
  h += '</div><div class="civ-emp-foot">Werb jednostki zużywa rekrutów z puli całej cywilizacji (suma miast). '
    + 'Pasek = wypełnienie puli względem maksimum imperium. '
    + 'JEDN. = rekruci miasta ÷ koszt jednostki w bieżącej epoce (informacyjnie, bez zaokrąglania w dół).</div>';
  return h;
}

function signedTxt(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '—';
  return signedPl(n);
}

/** F2 naprawa Panel 11 zakładek Faza 2 (dispatch 2026-08-14) — wartość w tabeli per miasto
 *  pokolorowana kolorem SEMANTYCZNYM KOLUMNY (nie znakiem wartości), zgodnie z makietą designera:
 *  DO PULI/NAUKA błękit, DO BUDYNKÓW złoto. Wcześniej `signedTxt()` zwracał goły tekst bez
 *  `<span>`, więc komórka dziedziczyła domyślny szary `.civ-emp-mini-r`.
 *  EN: per-city table value colored by the COLUMN's semantic color (not the value's sign), per
 *  the designer mockup: DO PULI/NAUKA blue, DO BUDYNKÓW gold. Previously `signedTxt()` returned
 *  bare text with no `<span>` to color, so the cell inherited the default gray from
 *  `.civ-emp-mini-r`. */
function miniColColor(n: number, hex: string): string {
  return `<span style="color:${hex}">${signedTxt(n)}</span>`;
}

/** Wartość liczbowa bez ikony (komórki danych tabel miast). */
function signedIntTxt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const r = Math.round(n);
  if (r === 0) return '0';
  return `${r > 0 ? '+' : ''}${r}`;
}

/**
 * PYTANIE-85 — wartość żywności BEZ emoji (np. „+72", „−48”).
 * R-DESIGN-11-ZAKLADEK klatka 4 (§5 handoffu Designera): jednostka „żywność” wynika z ikony przy
 * hero-liczbie magazynu i z nagłówka sekcji — ikona NIE jest powtarzana per wiersz (14 chlebków
 * w kolumnie to szum, nie informacja).
 * EN: food value WITHOUT emoji — the food unit comes from the single icon next to the storage hero
 * number and from the section header; the icon is NOT repeated per row.
 */
function foodSignedTxt(n: number, forceSign = true): string {
  if (!Number.isFinite(n)) return '—';
  const r = Math.round(n);
  if (r === 0) return '0';
  if (!forceSign) return foodMinus(r);
  return `${r > 0 ? '+' : ''}${foodMinus(r)}`;
}

/**
 * Znak minus U+2212 zamiast ASCII „-” — makieta klatki 4 używa go konsekwentnie, a w tej zakładce
 * część wierszy składała minus ręcznie („−72”), a część przez `${liczba}` („-11”), więc w jednej
 * kolumnie sąsiadowały dwa różne glify. Zmienia się WYŁĄCZNIE glif, nie wartość.
 * EN: U+2212 minus instead of ASCII "-" — the mockup uses it consistently, while this tab mixed a
 * hand-written "−" with the ASCII one from `${number}`. Only the glyph changes, never the value.
 */
function foodMinus(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `${n}`;
}

/**
 * PYTANIE-85 — wiersz podsumowania tury Spichlerza centralnego.
 * R-DESIGN-11-ZAKLADEK klatka 4: wiersze kosztowe (`expense`) są CZERWONE zgodnie z makietą.
 * Wcześniej liczyły kolor z surowej wartości, a `wyzwienieLudnosci`/`pomocMiastom`/`wojsko` to
 * dodatnie magnitudy (`empire-food.ts`) — więc koszt renderował się na ZIELONO mimo minusa przy
 * liczbie. Sama liczba się nie zmienia, wyłącznie klasa koloru.
 * EN: expense rows are RED per the mockup. Previously the color was derived from the raw value,
 * but the cost fields are positive magnitudes, so an expense rendered GREEN despite its minus
 * sign. The number itself is unchanged — only the color class.
 */
function foodSummaryRow(
  label: string,
  value: number,
  opts?: { expense?: boolean; pool?: boolean; last?: boolean },
): string {
  const r = Math.round(value);
  const mag = Math.abs(r);
  let cls: 'pos' | 'neg' | 'z';
  let display: string;
  if (opts?.expense) {
    cls = mag === 0 ? 'z' : 'neg';
    display = mag === 0 ? '0' : `−${mag}`;
  } else if (opts?.pool) {
    cls = r === 0 ? 'z' : 'pos';
    display = r === 0 ? '0' : `+${r}`;
  } else {
    cls = r > 0 ? 'pos' : r < 0 ? 'neg' : 'z';
    display = foodSignedTxt(value);
  }
  if (opts?.last) {
    return `<div class="civ-emp-tbl-sum civ-emp-sp-sum" style="grid-template-columns:1fr auto">`
      + `<div>${esc(label)}</div><div class="${cls}">${display}</div></div>`;
  }
  return `<div class="civ-emp-zrow brd civ-emp-sp-row">`
    + `<span class="lbl">${esc(label)}</span>`
    + `<span class="val"><span class="d ${cls}">${display}</span></span></div>`;
}

/**
 * Podpis pod hero-liczbą magazynu (`.civ-emp-hero-sub`) — makieta klatka 4:
 * „Zapełnienie <b>71%</b> · przyrost <b>+14</b> / turę · wszystkie miasta nakarmione” (stan A)
 * / „Zapełnienie <b>0%</b> · bilans <b>−11</b> / turę” (stan B, deficyt).
 * Każdy człon jest warunkowy — bez limitu magazynu nie ma procentu, przed pierwszą turą nie ma
 * przyrostu. Żadna liczba nie jest tu wyliczana od nowa: `pct` i `tick` przychodzą z wywołania.
 * EN: caption under the storage hero number; every part is conditional and no number is derived
 * here — `pct` and `tick` come from the caller.
 */
function renderSpichlerzHeroSub(
  food: EmpireFoodSnap,
  pct: number,
  alarm: boolean,
  hasDeficit: boolean,
): string {
  const parts: string[] = [];
  if (food.maxCap > 0) {
    parts.push(`Zapełnienie <b class="${alarm ? 'neg' : ''}">${pct}%</b>`);
  }
  const t = food.tick;
  if (t) {
    const r = Math.round(t.przyrostZapasow);
    const word = r < 0 ? 'bilans' : 'przyrost';
    const cls = r > 0 ? 'pos' : r < 0 ? 'neg' : '';
    parts.push(`${word} <b class="${cls}">${r > 0 ? '+' : ''}${foodMinus(r)}</b> / turę`);
  }
  if (!hasDeficit && food.perCityRows.length > 0) {
    parts.push('wszystkie miasta nakarmione');
  }
  if (parts.length === 0) return '';
  return `<div class="civ-emp-hero-sub">${parts.join(' · ')}</div>`;
}

/**
 * PYTANIE-85 — Spichlerz centralny: nagłówek magazynu, podsumowanie tury
 * (kanoniczne etykiety) + tabela miast.
 */
function renderSpichlerzCentralnySection(food: EmpireFoodSnap): string {
  const pct = food.maxCap > 0
    ? Math.max(0, Math.min(100, Math.round((food.zapasy / food.maxCap) * 100)))
    : 0;
  // R-DESIGN-11-ZAKLADEK klatka 4 (Maciej 2026-08-13) — deficyt liczony RAZ i sterujący całą
  // sygnalizacją stanu alarmowego (kolor hero-liczby, kolor paska, callout), zamiast trzech
  // niezależnych warunków. Makieta pokazuje stan B (zapasy 0 + głód wojska) jako CZERWONY —
  // stary warunek `zapasy < 0` malował go jeszcze na zielono. / EN: deficit computed ONCE and
  // driving the whole alarm state (hero color, bar color, callout) instead of three independent
  // conditions; the mockup's state B (0 stock + army hunger) is RED, the old `zapasy < 0` test
  // still painted it green.
  const unfedRows = food.perCityRows.filter(r => r.nakarmione === false);
  const hasDeficit = unfedRows.length > 0 || food.glodWojska === true;
  const alarm = hasDeficit || food.zapasy < 0;
  // N3 (Evaluator, 7a413462): `barCls` niesie CAŁĄ klasę paska ("fill"/"fill warn"/"fill low"),
  // tak jak `fillCls` w cityPoborMiniRekruci (pula rekrutów) — bez osobnego prefiksu "fill "
  // przy użyciu, żeby nie dublować słowa "fill" w stanie zdrowym. / EN: `barCls` carries the
  // WHOLE bar class ("fill"/"fill warn"/"fill low"), same convention as `fillCls` in
  // cityPoborMiniRekruci — no separate "fill " prefix at the call site, so the healthy state
  // doesn't duplicate the word "fill".
  const barCls = alarm ? 'fill low' : (pct >= 95 ? 'fill warn' : 'fill');
  const heroCls = alarm ? 'neg' : 'pos';

  let h = `<div class="civ-emp-sect" data-section="spichlerz-centralny">`
    + `<div class="civ-emp-eyebrow civ-emp-sp-eyebrow">`
    + `<span class="civ-emp-sp-eyebrow-ic" aria-hidden="true">${brandIconSvg('res-food', 14)}</span>`
    + `<span>SPICHLERZ CENTRALNY</span></div>`
    + `<div class="civ-emp-hero ${heroCls} civ-emp-sp-hero"><span>${food.zapasy}</span>`
    + (food.maxCap > 0 ? `<span class="cap">/ ${food.maxCap}</span>` : '')
    + `<span class="ic" aria-hidden="true">${brandIconSvg('res-food', 16)}</span></div>`
    + renderSpichlerzHeroSub(food, pct, alarm, hasDeficit);
  if (food.maxCap > 0) {
    h += `<div class="civ-emp-bar civ-emp-sp-bar"><div class="${barCls}" style="width:${pct}%"></div></div>`;
  }
  // P-SPICHLERZ-ZERO-MYLACE (ECHO C Maciej 2026-08-10): scalenie w JEDNO miejsce prawdy,
  // TUŻ PRZY liczbie magazynu — wcześniej „W magazynie: 0" nie mówiło nic o tym, czy to
  // zero jest zdrowe czy oznacza realny niepokryty deficyt; ostrzeżenie o głodzie wojska
  // i ⚠ przy nazwie miasta (tabela niżej) żyły osobno, rozłącznie. / EN: consolidation into
  // ONE place of truth, RIGHT NEXT TO the stock number — previously "In storage: 0" said
  // nothing about whether that zero is healthy or a real uncovered deficit; the army-hunger
  // note and the per-city ⚠ mark (table below) lived separately, disconnected.
  if (unfedRows.length > 0 || food.glodWojska) {
    const deficitParts: string[] = [];
    if (unfedRows.length > 0) {
      const names = unfedRows.map(r => esc(r.name)).join(', ');
      const miastoWord = miastoNiedokarmioneWord(unfedRows.length);
      deficitParts.push(`<b class="n">${unfedRows.length}</b> ${miastoWord} (${names})`);
    }
    if (food.glodWojska) {
      deficitParts.push('głód wojska — magazyn centralny na minusie po koszcie armii');
    }
    h += `<div class="civ-emp-alert civ-emp-sp-alert">`
      + `<span class="civ-emp-sp-alert-ic" aria-hidden="true">${brandIconSvg('chip-warning', 16)}</span>`
      + `<span><b>Realny niepokryty deficyt żywności</b> — ${deficitParts.join(' · ')}.</span></div>`;
  }

  const t = food.tick;
  if (t) {
    h += `<div class="civ-emp-res-lbl" style="margin-top:10px">Podsumowanie ostatniej tury</div>`;
    h += foodSummaryRow('Uprawa i hodowla', t.uprawaHodowla);
    h += foodSummaryRow('Wyżywienie ludności', t.wyzwienieLudnosci, { expense: true });
    h += foodSummaryRow('Nadwyżka', t.nadwyzka);
    h += foodSummaryRow('Pomoc miastom', t.pomocMiastom, { expense: true });
    h += foodSummaryRow('Spichlerz stolicy', t.spichlerzStolicy, { pool: true });
    h += foodSummaryRow('Wojsko', t.wojsko, { expense: true });
    // `last` = wiersz wyróżniony jak „Netto skarbiec" w Skarbcu (.civ-emp-tbl-sum) — ta sama
    // rola: jedna liczba, po której gracz wie, czy jest dobrze (§ makieta klatka 4, „Zmiany").
    // EN: `last` = row highlighted like "Net treasury" — one number telling the player if it's OK.
    h += foodSummaryRow('Przyrost zapasów', t.przyrostZapasow, { last: true });
  } else {
    h += `<div class="civ-emp-note" style="margin-top:10px;font-style:italic">`
      + `Podsumowanie tury pojawi się po zakończeniu pierwszej tury.</div>`;
  }

  if (food.perCityRows.length > 0) {
    const grid = '1.1fr 0.7fr 0.8fr 0.65fr 0.6fr';
    let sumProdukcja = 0;
    let sumKoszt = 0;
    let sumBilans = 0;
    let sumWzrost = 0;
    h += `<div class="civ-emp-res-lbl" style="margin-top:14px">Miasta</div>`;
    h += `<div class="civ-emp-mini civ-emp-sp-city-tbl">`
      + `${miniHeader(['MIASTO', 'PRODUKCJA', 'KOSZT RACJI', 'BILANS', 'WZROST%'], grid)}`;
    for (const row of food.perCityRows) {
      const bilansCls = row.bilans > 0 ? 'pos' : row.bilans < 0 ? 'neg' : 'z';
      const bilansTxt = row.bilans === 0 ? '0' : `${row.bilans > 0 ? '+' : ''}${foodMinus(Math.round(row.bilans))}`;
      // Znacznik miasta niedokarmionego — ikona chip-warning PRZED nazwą (makieta klatka 4B),
      // wcześniej znak ⚠ po nazwie. / EN: unfed-city marker — chip-warning icon BEFORE the name.
      const unfed = row.nakarmione === false;
      const fedMark = unfed
        ? `<span class="civ-emp-sp-unfed-ic" title="Miasto nie nakarmione z centrali">${brandIconSvg('chip-warning', 11)}</span>`
        : '';
      // P-SPICHLERZ-SUMA-WZROST-NOMINALNY-VS-EFEKTYWNY (ECHO B, Maciej 2026-08-16): WZROST%
      // liczony jako wartość EFEKTYWNA (miasto głodujące → 0), ta sama jednolinijkowa konwencja
      // co `effectiveGrowthPctForUi()` w cityPanel.ts (`fed ? wzrostProcent : 0`) — powtórzona
      // tu lokalnie zamiast eksportować, bo to jednolinijkowa reguła bez dodatkowego stanu.
      // / EN: WZROST% is now the EFFECTIVE value (a starving city → 0), same one-line convention
      // as `effectiveGrowthPctForUi()` in cityPanel.ts (`fed ? wzrostProcent : 0`) — duplicated
      // locally instead of exported since it's a one-line rule with no extra state.
      const wzrostEff = unfed ? 0 : row.wzrostProcent;
      const wzrostTxt = `${Math.round(wzrostEff)}%`;
      sumProdukcja += row.produkcja;
      sumKoszt += row.kosztRacji;
      sumBilans += row.bilans;
      sumWzrost += wzrostEff;
      h += miniRow([
        `<span class="civ-emp-sp-city-nm">${fedMark}<span>${esc(row.name)}</span></span>`,
        String(Math.round(row.produkcja)),
        String(Math.round(row.kosztRacji)),
        `<span class="d ${bilansCls}">${bilansTxt}</span>`,
        unfed ? `<span class="d neg">${wzrostTxt}</span>` : wzrostTxt,
      ], grid);
    }
    // Wiersz SUMA — te same sumy co kolumny wyżej (agregacja liczb już pokazanych, wzorzec
    // `.civ-emp-mini-summary` ze Skarbca). N5 (Evaluator, 7a413462): WZROST% liczony jako ŚREDNIA
    // ARYTMETYCZNA po widocznych miastach (makieta klatka 4A/4B), zaokrąglona RAZ na końcu —
    // dokładnie ta sama konwencja co `wzrostProcentAvg` w computeMiastaSummaryRow
    // (empireMiastaTable.ts, tabela Miasta): `Math.round(sumaSurowa / liczbaMiast)`, nie średnia
    // z już zaokrąglonych komórek. Ta tabela nie ma filtra kolumn/miast (miastaHiddenCols) —
    // `food.perCityRows` to zawsze wszystkie widoczne miasta. / EN: SUM row — aggregates of the
    // already-shown columns. WZROST% is the arithmetic mean over the visible cities, rounded ONCE
    // at the end — same convention as `wzrostProcentAvg` in computeMiastaSummaryRow (the Miasta
    // tab): round the raw sum, not the average of already-rounded cells. This table has no
    // column/city filter (miastaHiddenCols) — `food.perCityRows` is already the full visible set.
    // ECHO B (P-SPICHLERZ-SUMA-WZROST-NOMINALNY-VS-EFEKTYWNY, Maciej 2026-08-16): `sumWzrost`
    // powyżej sumuje już EFEKTYWNE wzrosty (`wzrostEff` per wiersz) — SUMA zgadza się teraz
    // dokładnie z tym, co widać w komórkach per-miasto (obie strony 0% dla głodujących).
    // / EN: `sumWzrost` above now accumulates the EFFECTIVE growth per row — SUM matches exactly
    // what the per-city cells show (both sides read 0% for starving cities).
    const sumBilansR = Math.round(sumBilans);
    const sumBilansCls = sumBilansR > 0 ? 'pos' : sumBilansR < 0 ? 'neg' : 'z';
    const wzrostAvgTxt = `${Math.round(sumWzrost / food.perCityRows.length)}%`;
    h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
      + `<div>SUMA</div><div>${Math.round(sumProdukcja)}</div><div>${Math.round(sumKoszt)}</div>`
      + `<div><span class="d ${sumBilansCls}">${sumBilansR === 0 ? '0' : `${sumBilansR > 0 ? '+' : ''}${foodMinus(sumBilansR)}`}</span></div>`
      + `<div>${wzrostAvgTxt}</div></div>`;
    h += `</div>`;
  }

  h += `<div class="civ-emp-foot">Magazyn centralny: nadwyżki miast trafiają do puli, niedobory są pokrywane stamtąd. `
    + `Kolejność: dopłaty do miast → wojsko → zmiana zapasów. Wzrost ludności zależy od racji i bonusów lokalnych — nie z nadwyżki centralnej.</div>`;
  // R-USTAWIENIA-GLOBALNE-LOKALNE (grupa "Żywność", Maciej 2026-08-10): globalny
  // poziom Wyżywienia imperium — w tej samej sekcji co reszta „Żywności" (Spichlerz).
  h += renderDefaultPoziomRacjiSection();
  h += `</div>`;
  return h;
}

/**
 * Ikona surowca — PRAWDZIWA ikona brand SVG (resources-map/) rozwiązana z etykiety,
 * a nie emoji EmpireResourceRow.icon (dane historyczne main.ts CATALOG). mapResourceIconSvg
 * dopasowuje case-insensitive + substring, więc etykiety PL (np. „Ruda miedzi", „Brąz")
 * trafiają we właściwy plik res-*.svg (design v4 2026-07-24).
 */
function resIconHtml(label: string, size: 16 | 18 = 18): string {
  const svg = mapResourceIconSvg(label, size);
  return svg || '';
}

/** Stan wiersza magazynowanego: niedobór (spada) / na cap (nadmiar przepada) / nadwyżka. */
function resStateOf(r: EmpireResourceRow): 'bad' | 'warn' | 'good' {
  if (r.ratePerTurn < 0) return 'bad';
  if (r.cap != null && r.stock >= r.cap) return 'warn';
  return 'good';
}

/**
 * Tooltip (title, na hover) z typem/regułą magazynu — SUROW-UI-A1 (Maciej 2026-07-24):
 * „Szczegóły na hover, nie w kafelku". Budowany WYŁĄCZNIE z danych, którymi panel realnie
 * dysponuje (EmpireResourceRow) — bez zmyślania nieudokumentowanego źródła/konsumenta per
 * surowiec (to wymagałoby nowego mapowania budynek→surowiec, poza zakresem tego zadania).
 */
function resTooltipHtml(r: EmpireResourceRow): string {
  const parts = [`Typ: ${r.typ}`];
  if (r.cap != null) {
    parts.push(`Magazyn: wspólna pula państwa, limit ${r.cap}/typ — nadmiar przepada`);
    if (r.zrodlo) parts.push(`Źródło dostępu: ${r.zrodlo}`);
  }
  if (r.cap == null) {
    parts.push(r.zrodlo ? `Źródło dostępu: ${r.zrodlo}` : 'Dostęp: brak — nie odblokowano jeszcze tego surowca');
  }
  const prod = r.rateProductionPerTurn ?? r.ratePerTurn;
  const diploOut = r.rateDiploOutPerTurn ?? 0;
  const diploIn = r.rateDiploInPerTurn ?? 0;
  if (diploOut > 0 || diploIn > 0) {
    parts.push(prod === 0 ? 'Produkcja własna: brak' : `Produkcja własna: ${signedTxt(prod)} / turę`);
    if (diploOut > 0) parts.push(`Dyplomacja (oddajesz): −${diploOut} / turę`);
    if (diploIn > 0) parts.push(`Dyplomacja (otrzymujesz): +${diploIn} / turę`);
    parts.push(`Netto magazyn: ${signedTxt(r.ratePerTurn)} / turę`);
  } else {
    parts.push(prod === 0 ? 'Produkcja: brak zmiany w tej turze' : `Produkcja: ${signedTxt(prod)} / turę`);
  }
  // R-ZUZYCIE-SUROWCOW-OBYWATELE N2 (Maciej 2026-08-11): reguła pokrycia = magazyn centralny
  // ZASPOKAJA CAŁĄ populację imperium tego ownera (stawka CITIZEN_UPKEEP_RATE_PER_CITIZEN szt.
  // surowca/obywatela/turę — kanon: citizen-resource-upkeep.ts), NIE starsza binarna
  // „magazyn > 0" — panel musi zgadzać się z tym, co faktycznie liczy silnik tury
  // (citizenUpkeepDrainForOwner / computeCitizenResourceDrain).
  if (r.citizenRequired) {
    parts.push(r.citizenCovered
      ? 'Obywatele: zapotrzebowanie POKRYTE (magazyn ≥ zapotrzebowanie całego imperium; +1 Szczęście każde miasto)'
      : 'Obywatele: NIEDOBÓR w magazynie (poniżej zapotrzebowania całego imperium) — kara −1 Szczęście, −1% Rozwój w KAŻDYM mieście');
  }
  return esc(parts.join(' · '));
}

/** Pill lub stos: produkcja ± dyplomacja = netto (gdy aktywny handel cykliczny). */
function resRateHtml(r: EmpireResourceRow, state: 'bad' | 'warn' | 'good'): string {
  const prod = r.rateProductionPerTurn ?? r.ratePerTurn;
  const diploOut = r.rateDiploOutPerTurn ?? 0;
  const diploIn = r.rateDiploInPerTurn ?? 0;
  const hasDiplo = diploOut > 0 || diploIn > 0;
  if (!hasDiplo) {
    const rateTxt = prod === 0 ? '—' : signedTxt(prod);
    return `<span class="civ-emp-res-rate ${state}">${esc(rateTxt)}</span>`;
  }
  const net = r.ratePerTurn;
  const netState = net < 0 ? 'bad' : (net === 0 ? 'warn' : 'good');
  let html = `<div class="civ-emp-res-rate-stack">`;
  html += `<span class="civ-emp-res-rate-line prod">${esc(signedTxt(prod))}</span>`;
  if (diploOut > 0) html += `<span class="civ-emp-res-rate-line diplo-out">−${diploOut} dypl.</span>`;
  if (diploIn > 0) html += `<span class="civ-emp-res-rate-line diplo-in">+${diploIn} dypl.</span>`;
  html += `<span class="civ-emp-res-rate-line net ${netState}">=${esc(signedTxt(net))}</span>`;
  html += `</div>`;
  return html;
}

/**
 * Badge „Obywatele" (R-ZUZYCIE-SUROWCOW-OBYWATELE N2, Maciej 2026-08-11) — tylko dla surowców
 * wymaganych w bieżącej epoce (`r.citizenRequired`); pokrycie = magazyn centralny ZASPOKAJA
 * CAŁĄ populację imperium tego ownera (ten sam wynik co silnik tury liczy realnie, nie
 * starsza binarna „magazyn > 0"). Inline style: `civ-emp-res-card`/`resCardHtml` nie mają
 * dedykowanej klasy CSS w repo dla nowych badge'y (kolory kart idą przez `${state}` na
 * kontenerze) — bezpieczniej nie zgadywać nieistniejącej klasy niż dodać martwy selektor.
 */
function resCitizenBadgeHtml(r: EmpireResourceRow): string {
  if (!r.citizenRequired) return '';
  const covered = r.citizenCovered === true;
  const bg = covered ? 'rgba(122,208,160,0.18)' : 'rgba(224,90,90,0.18)';
  const fg = covered ? '#7ad0a0' : '#e05a5a';
  const txt = covered ? 'Obywatele: POKRYTE' : 'Obywatele: NIEDOBÓR';
  return `<span class="civ-emp-res-citizen-badge" `
    + `style="display:inline-block;margin-top:4px;padding:1px 6px;border-radius:4px;`
    + `font-size:11px;background:${bg};color:${fg}">${esc(txt)}</span>`;
}

/**
 * P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA (Maciej 2026-08-12) + P-ZUZYCIE-ROZBICIE-NIEDOBOR
 * (Evaluator FAIL, wariant B): rozwinięcie „Zobacz szczegóły" — rozbicie TEGO surowca na
 * budynki/obywateli/wojsko. Czyta WYŁĄCZNIE `r.usage` (`resource-usage-breakdown.ts`) — nie
 * licz nic tutaj. Natywny `<details>/<summary>` — ten sam wzorzec co grupy budynków w
 * cityPanel.ts (GRUPY-BUDYNKOW), zero nowego okablowania JS/zdarzeń. Zwraca '' gdy brak
 * zużycia (żadnej kategorii) — karta wtedy nie pokazuje przycisku wcale.
 *
 * ⚠️ Etykiety Budynki/Wojsko celowo mówią „zapotrzebowanie", NIE „zużycie"/„utrzymanie" —
 * `u.buildings`/`u.units` to PEŁNY popyt, nieklamrowany do zapasu magazynu (patrz JSDoc
 * `ResourceUsageBreakdown` w resource-usage-breakdown.ts); przy niedoborze magazynu może to
 * przewyższać to, co silnik realnie odjął. Obywatele SĄ klamrowani (`u.citizens` = drenaż
 * realny) — jedyna kategoria tu, o której wolno twierdzić „to zostało realnie zużyte".
 * / EN: Budynki/Wojsko rows deliberately say "zapotrzebowanie" (demand), not "usage" — those
 * two fields are full, unclamped demand and can exceed what the engine actually deducted
 * under a warehouse shortage. Obywatele IS clamped (real drain) — the only row here entitled
 * to claim actual consumption.
 */
// Eksport dla testów (ten sam wzorzec co treasuryBalanceSignedTxt wyżej) — pozwala testowi
// naprawdę WOŁAĆ tę funkcję z kontrolowanym `EmpireResourceRow`, zamiast dopasowywać tekst w
// źródle. / EN: exported for tests (same pattern as treasuryBalanceSignedTxt above) — lets the
// test REALLY CALL this function with a controlled row instead of matching text in the source.
export function resUsageDetailsHtml(r: EmpireResourceRow): string {
  if (!r.usage) return '';
  const u = r.usage;
  const total = resourceUsageTotal(u);
  if (total <= 0) return '';
  const row = (label: string, val: number): string => val > 0
    ? `<div class="civ-emp-res-usage-row"><span class="k">${esc(label)}</span><span class="v">−${val}</span></div>`
    : '';
  const prod = r.rateProductionPerTurn ?? r.ratePerTurn;
  return `<details class="civ-emp-res-usage">`
    + `<summary>Zobacz szczegóły zużycia</summary>`
    + `<div class="civ-emp-res-usage-body">`
    + row('Budynki (zapotrzebowanie)', u.buildings)
    + row('Obywatele (drenaż realny)', u.citizens)
    + row('Wojsko (zapotrzebowanie)', u.units)
    + `<div class="civ-emp-res-usage-row total"><span class="k">Suma rozbicia tej tury</span><span class="v">−${total}</span></div>`
    + `<div class="civ-emp-res-usage-note">Budynki i Wojsko pokazują <b>zapotrzebowanie</b> (pełne, bez klamrowania do `
    + `zapasu) — przy niedoborze magazynu suma może przewyższać to, co realnie zeszło z magazynu. Obywatele pokazują `
    + `<b>drenaż realny</b> (klamrowany do dostępnego zapasu).</div>`
    + `<div class="civ-emp-res-usage-note">Produkcja: <b>${esc(signedTxt(prod))}</b> / turę — liczona OSOBNO od `
    + `rozbicia powyżej („${esc(signedTxt(r.ratePerTurn))}/turę” widoczne na karcie to produkcja ± dyplomacja, `
    + `BEZ zużycia).</div>`
    + `</div></details>`;
}

/**
 * P-SUROWCE-KOLEJNOSC-KART (Maciej 2026-08-12): karta placeholder ("Ruda cyny — wkrótce") —
 * surowiec bez realnych danych silnika (nie istnieje w resources.json). Wyszarzona (opacity),
 * bez paska postępu, zawsze „0 / 0", bez tooltipa z produkcją/dostępem/zużyciem (nie ma czego
 * pokazać). EN: placeholder card with no real engine data — dimmed, no progress bar, always
 * "0 / 0", no production/access/usage tooltip (nothing real to show).
 */
function resPlaceholderCardHtml(r: EmpireResourceRow): string {
  return `<div class="civ-emp-res-card placeholder" style="opacity:0.45" `
    + `data-section="econ-surowiec-${esc(r.id)}" title="${esc(r.label)} — surowiec jeszcze nie wdrożony do gry">`
    + `<div class="civ-emp-res-top"><span class="civ-emp-res-ic">${esc(r.icon)}</span>`
    + `<div class="civ-emp-res-nm"><div class="nm">${esc(r.label)}</div></div></div>`
    + `<div class="civ-emp-res-amt"><span class="cur">0</span><span class="cap">/ 0</span></div>`
    + `</div>`;
}

/** Karta pojedynczego surowca magazynowanego (pasek zapełnienia stock/cap). */
function resCardHtml(r: EmpireResourceRow): string {
  if (r.placeholder) return resPlaceholderCardHtml(r);
  const cap = r.cap ?? 0;
  const pct = cap > 0 ? Math.max(0, Math.min(100, Math.round((r.stock / cap) * 100))) : 0;
  const state = resStateOf(r);
  // Plakietka stanu = kolor + SŁOWO (Designer 2026-08-14 pkt 4): magazyn pełny dostaje pigułkę
  // „PEŁNY" plus skutek „marnuje się", niedobór — słowo „spada". Sam kolor ramki nie wystarcza.
  // / EN: state badge = colour + WORD; full storage gets a "PEŁNY" pill plus the consequence
  // ("marnuje się" — it is being wasted), a shortage gets "spada". Colour alone is not enough.
  const flagPill = state === 'bad' ? 'SPADA' : (state === 'warn' ? 'PEŁNY' : '');
  // Skutek pod paskiem, nie obok liczby: kolumna siatki ma 148px, plakietka + skutek w jednym
  // wierszu z „stock / cap" nie mieszczą się i wychodzą poza obrys karty (sprawdzone zrzutem).
  // / EN: consequence goes below the bar, not next to the number — at a 148px grid column the
  // badge plus the wording overflow the card when placed on the amount row.
  const flagNote = state === 'bad' ? 'zapas maleje' : (state === 'warn' ? 'nadmiar się marnuje' : '');
  return `<div class="civ-emp-res-card ${state}" data-section="econ-surowiec-${esc(r.id)}" title="${resTooltipHtml(r)}">`
    + `<div class="civ-emp-res-top"><span class="civ-emp-res-ic">${resIconHtml(r.label)}</span>`
    + `<div class="civ-emp-res-nm"><div class="nm">${esc(r.label)}</div></div>`
    + resRateHtml(r, state) + `</div>`
    + `<div class="civ-emp-res-amt"><span class="cur">${r.stock}</span><span class="cap">/ ${cap}</span>`
    + (flagPill ? `<span class="civ-emp-res-flag-pill ${state}">${esc(flagPill)}</span>` : '')
    + `</div>`
    + `<div class="civ-emp-res-bar ${state}"><span style="width:${pct}%"></span></div>`
    + (flagNote ? `<div class="civ-emp-res-flag-note ${state}">${esc(flagNote)}</div>` : '')
    + resCitizenBadgeHtml(r)
    + resUsageDetailsHtml(r)
    + `</div>`;
}

/** Tooltip nagłówka magazynu państwa — pojemność, formuła, reguła nadmiaru (Maciej UI). */
function magazynPanstwaTooltip(
  cap: number,
  capBase: number | undefined,
  capBonus: number | undefined,
  magazyny: number,
  magSlowo: string,
): string {
  const parts: string[] = ['Wspólna pula całego imperium — każdy typ surowca ma ten sam limit.'];
  if (cap > 0) {
    parts.push(`Pojemność: ${cap} / typ surowca`);
    if (capBase != null && capBonus != null) {
      parts.push(`Formuła: ${capBase} baza + ${capBonus} × ${magazyny} ${magSlowo}`);
    }
    parts.push('Nadmiar ponad limit przepada co turę');
  }
  parts.push('Legenda: nadwyżka/rośnie · na cap — nadmiar przepada · niedobór/spada');
  return esc(parts.join(' · '));
}

function magazynInfoTipHtml(title: string): string {
  return `<span class="civ-emp-info-tip" title="${title}" aria-label="Szczegóły magazynu">i</span>`;
}

/** Odmiana rzeczownika „surowiec" po liczebniku (podpis hero Surowców). */
function surowiecCountWord(n: number): string {
  if (n === 1) return 'surowiec';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'surowce';
  return 'surowców';
}

/**
 * Odmiana PRZYMIOTNIKA „pełny" po liczebniku (kubełek „na cap" w podpisie hero Surowców).
 * Wcześniej podpis brzmiał „0 pełny" / „3 pełny" — forma mianownikowa niezależnie od liczby.
 * Reguła ta sama, trójformowa, co dla rzeczowników: 1 → pełny · 2-4 (poza 12-14) → pełne ·
 * 0, 5+, 12-14 → pełnych. Korzysta ze wspólnego `isPlFewForm()` (deklaracja funkcji hoistuje,
 * tak samo jak przy `dealCountWord`/`typCountWord`).
 * / EN: Polish ADJECTIVE declension for "pełny" (full) after a numeral — same three-form rule
 * as the noun helpers; previously the caption always used the nominative singular.
 */
function pelnyCountWord(n: number): string {
  if (n === 1) return 'pełny';
  return isPlFewForm(n) ? 'pełne' : 'pełnych';
}

/**
 * Sekcja SUROWCE (magazyn państwa) — mockup „Magazyn surowców" (Maciej 2026-07-24),
 * reskin do wzorca sekcji Moc wg klatki 5 handoffu Designera
 * `11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13` (hero + podpis stanu, eyebrow UPPERCASE
 * z ikoną, plakietki stanu kolor+słowo, legenda pasków). Sam RESKIN — liczby, dane
 * i logika bez zmian; hero to wyłącznie agregat kart renderowanych poniżej.
 * / EN: pure reskin to the Power-section pattern — the hero line only aggregates the
 * cards rendered below; no data, numbers or business logic changed.
 */
function renderSurowceSection(rows: EmpireResourceRow[]): string {
  let sur = `<div class="civ-emp-sect sep" data-section="surowce">`;
  if (rows.length === 0) {
    sur += `<div class="civ-emp-eyebrow" style="margin-bottom:10px">MAGAZYN PAŃSTWA</div>`
      + `<div class="civ-emp-note" style="font-style:italic">Surowce w zasięgu miasta — zakładka Okolica w panelu miasta. `
      + `Tu pojawi się zbiorczy widok po podpięciu magazynów imperium.</div></div>`;
    return sur;
  }

  // R-SUROWCE-DOSTEP-ILOSC-Q1 (Maciej 2026-08-08, decyzja A): cofnięcie 331aa180 —
  // wszystkie 13 surowców katalogu mają realny cap, jedna siatka „Magazynowane".
  // Podsekcja „Dostęp — nie magazynowane" usunięta (był to martwy kod po tym cofnięciu).
  const stored = rows.filter(r => r.cap != null);
  const cap = stored[0]?.cap ?? 0;
  const capBase = stored[0]?.capBase;
  const capBonus = stored[0]?.capBonusPerMagazyn;
  // SUROW-UI-A1: liczba Magazynów wyliczona z REALNEJ bazy/bonusu (econ-params.json),
  // nie z zaszytej na sztywno starej wartości 100 — baza z econ-params.json (dziś 1000).
  const magazyny = (capBase != null && capBonus != null && capBonus > 0 && cap > capBase)
    ? Math.round((cap - capBase) / capBonus)
    : 0;
  const magSlowo = magazyny === 1 ? 'Magazyn' : (magazyny >= 2 && magazyny <= 4 ? 'Magazyny' : 'Magazynów');
  const magTip = magazynPanstwaTooltip(cap, capBase, capBonus, magazyny, magSlowo);

  sur += `<div class="civ-emp-res-hdr-row" title="${magTip}">`
    + `<span class="civ-emp-res-hdr-ic" aria-hidden="true">${brandIconSvg('chip-crate', 14)}</span>`
    + `<span class="civ-emp-eyebrow">MAGAZYN PAŃSTWA</span>`
    + `<span class="civ-emp-res-hdr-sub">(wspólny)</span>`
    + magazynInfoTipHtml(magTip)
    + `</div>`;

  // Hero + podpis: zliczenie stanów TYCH SAMYCH kart, które lecą do siatki niżej — karty
  // placeholder (surowiec bez danych silnika) nie mają stanu, więc nie wchodzą do licznika.
  // / EN: hero counters aggregate exactly the cards rendered below; placeholder cards carry no
  // engine state, so they stay out of the tally.
  const real = stored.filter(r => !r.placeholder);
  const nGood = real.filter(r => resStateOf(r) === 'good').length;
  const nWarn = real.filter(r => resStateOf(r) === 'warn').length;
  const nBad = real.filter(r => resStateOf(r) === 'bad').length;
  // Rozbicie kubełka „good" na REALNY wzrost i brak zmiany (naprawa N3 Evaluatora na a6ed0553).
  // `resStateOf()` zwraca 'good' także wtedy, gdy tempo wynosi 0 (to jego dopełnienie: nie
  // spada i nie stoi na capie) — podpis liczył więc surowce o ZEROWEJ produkcji jako rosnące
  // i pokazywał np. „14 rośnie", gdy realny wzrost miały 2 z 14. `nFlat` liczymy jako RESZTĘ
  // (nGood − nGrow), a nie osobnym predykatem `=== 0`, żeby cztery kubełki zawsze sumowały się
  // do `real.length` niezależnie od wartości niecałkowitych czy NaN w `ratePerTurn`.
  // `resStateOf()` i plakietki per-karta (`resCardHtml()`) zostają NIETKNIĘTE — to wyłącznie
  // agregacja podpisu hero.
  // / EN: split the "good" bucket into genuine growth vs. no change. `resStateOf()` returns
  // 'good' for a ZERO rate too (it is the catch-all: neither falling nor capped), so the caption
  // counted idle resources as growing. `nFlat` is the REMAINDER rather than a `=== 0` predicate,
  // so the four buckets always add up to `real.length`. `resStateOf()` and the per-card badges
  // are left untouched — this is the hero caption's aggregation only.
  const nGrow = real.filter(r => resStateOf(r) === 'good' && r.ratePerTurn > 0).length;
  const nFlat = nGood - nGrow;
  const citizenRows = real.filter(r => r.citizenRequired);
  const citizenShort = citizenRows.some(r => r.citizenCovered !== true);
  sur += `<div class="civ-emp-hero">${real.length} ${surowiecCountWord(real.length)} w obiegu</div>`;
  const subParts = [
    `<b class="good">${nGrow}</b> rośnie`,
    `<b class="neutral">${nFlat}</b> bez zmian`,
    `<b class="warn">${nWarn}</b> ${pelnyCountWord(nWarn)}`,
    `<b class="bad">${nBad}</b> spada`,
  ];
  if (citizenRows.length > 0) {
    subParts.push(citizenShort
      ? `obywatele: <b class="bad">niedobór</b>`
      : `obywatele: <b class="good">pokryte</b>`);
  }
  sur += `<div class="civ-emp-hero-sub civ-emp-res-sub">${subParts.join(' · ')}</div>`;

  if (stored.length > 0) {
    sur += `<div class="civ-emp-res-grid" style="margin-top:14px">${stored.map(resCardHtml).join('')}</div>`;
  }

  sur += `<div class="civ-emp-res-foodnote"><span class="k">Żywność</span>`
    + `<span>ma osobny <b>magazyn centralny</b> — chip HUD „Spichlerz" · panel Spichlerz centralny. `
    + `Nie wchodzi do wspólnej puli surowców powyżej.</span></div>`;

  sur += `<div class="civ-emp-res-legend">`
    + `<span><i class="good"></i>rośnie</span>`
    + `<span><i class="warn"></i>pełny</span>`
    + `<span><i class="bad"></i>spada</span>`
    + `</div>`;

  sur += `</div>`;
  return sur;
}

/**
 * Sekcja HANDEL (TEMAT 14, Maciej 2026-07-24) — żeton HUD „Handel" obok Skarbca.
 * Pokazuje WSZYSTKIE aktywne trasy handlowe gracz↔obca cywilizacja (trade-routes.ts
 * refreshTradeRoutes) + dochód z każdej + sumę imperium. Szczegóły algorytmu per
 * miasto zostają w panelu miasta (cityPanel.ts buildTradeRoutesDetailCard) — tu
 * jest zbiorczy widok imperium, nie duplikat.
 *
 * R-DESIGN-11-ZAKLADEK, Klatka 6 (Maciej 2026-08-13; rejestr decyzji 2026-08-14 pkt 2) — reskin do
 * wzorca sekcji Moc/Skarbiec: nagłówek przechodzi z `.civ-emp-title` na `.civ-emp-eyebrow` (jedna
 * konwencja nagłówka wspólna dla 11 zakładek), linia dochodu sumarycznego awansuje na hero
 * (`.civ-emp-hero` + `.civ-emp-hero-sub`), cztery bloki tabel dostają nagłówki `.civ-emp-res-lbl`,
 * bonus cudów staje się calloutem `.civ-emp-resp` (ten sam co Respekt w Mocy), a suma tras dubluje
 * się w wierszu SUMA (`.civ-emp-mini-summary`), żeby gracz mógł sprawdzić hero. Dane, liczby
 * i logika bez zmian — wyłącznie hierarchia wizualna.
 * EN: Trade tab reskinned to the Power/Treasury pattern — eyebrow header (one convention across all
 * 11 tabs), total income promoted to a hero number, section labels above each table, wonder bonus as
 * a callout, and a SUM row echoing the hero. Data, numbers and logic unchanged — visual hierarchy only.
 */
function renderHandelSection(t: EmpireDetailSnap['trade']): string {
  const heroCls = t.totalIncome < 0 ? 'neg' : 'pos';
  const wonderPct = Math.max(t.wonderBonusLadPct, t.wonderBonusMorzePct);

  // Znak drukowany przez `signedPl()`, NIE dosłownym prefiksem „+" (naprawa N6 Evaluatora na
  // a6ed0553): gałąź `heroCls === 'neg'` wyżej zakłada, że `totalIncome` MOŻE być ujemny, ale
  // zaszyty „+" dałby wtedy „+-5". Dziś suma jest zawsze nieujemna (suma nieujemnych `income`
  // tras), więc to nie jest błąd widoczny w grze — konstrukcja była wewnętrznie sprzeczna.
  // `signedPl()` to wzorzec już używany w tym pliku (m.in. Nauka) i pokrywa oba znaki oraz zero.
  // / EN: the sign is printed by `signedPl()` instead of a hardcoded "+" — the `neg` branch above
  // assumes `totalIncome` can go negative, which the literal "+" would render as "+-5". The sum
  // is non-negative today, so this was an internal inconsistency rather than a live bug.
  let h = `<div class="civ-emp-sect sep" data-section="handel">`
    + `<div class="civ-emp-eyebrow">HANDEL — SZLAKI HANDLOWE</div>`
    + `<div class="civ-emp-hero ${heroCls}">${signedPl(t.totalIncome)} złota / turę</div>`
    + `<div class="civ-emp-hero-sub"><b>${t.routes.length}</b> ${routeCountWord(t.routes.length)} · `
    + `<b>${t.activeDeals.length}</b> ${dealCountWord(t.activeDeals.length)}</div>`;

  // Bonus cudów jest JUŻ wliczony w income każdej trasy (CUDA-HANDEL-01), więc stoi jako podpis
  // przy dochodzie, nie jako osobny składnik sumy.
  // EN: the wonder bonus is ALREADY inside each route's income, so it is a caption next to the
  // income, not a separate addend.
  const cudaSub = wonderPct > 0
    ? `<span style="font-size:11px;color:#78c95a;font-weight:600">+${wonderPct}% cuda</span>`
    : '';
  h += `<div class="civ-emp-two">`
    + `<div class="civ-emp-box"><div class="k">DOCHÓD SZLAKÓW</div>`
    + `<div class="v">${signedPl(t.totalIncome)} ${cudaSub}</div></div>`
    + `<div class="civ-emp-box"><div class="k">SUROWCE Z WYMIANY</div>`
    + `<div class="v">${t.resourceGrants.length} ${typCountWord(t.resourceGrants.length)}</div></div>`
    + `</div>`;

  // Aktywne umowy handlowe (traktaty) — przed tabelą tras.
  h += `<div class="civ-emp-res-lbl">Umowy handlowe</div>`;
  if (t.activeDeals.length === 0) {
    h += `<div class="civ-emp-empty">Brak aktywnych umów handlowych.</div>`;
  } else {
    // Kolumna POZOSTAŁO musi zmieścić najdłuższą realną wartość „bezterminowa" (jedno słowo,
    // nie ma gdzie się złamać) — stąd szersza niż w makiecie, gdzie były tylko „8 tur"/„3 tury".
    // EN: the POZOSTAŁO column must fit the longest real value "bezterminowa" (a single unbreakable
    // word), hence wider than in the mockup, which only showed short "N tur" values.
    const dealGrid = '0.9fr 1.05fr 0.8fr 1.05fr';
    h += `<div class="civ-emp-mini">${miniHeader(['PARTNER', 'POZOSTAŁO', 'ZAUFANIE', 'TRASA'], dealGrid)}`;
    for (const d of t.activeDeals) {
      const turnsCell = d.turnsLeft === null ? 'bezterminowa' : `${d.turnsLeft} tur`;
      const trustCell = `<span style="color:#78c95a">+${d.trustPerTurn}/turę</span>`;
      const routeCell = d.hasActiveRoute
        ? 'aktywny szlak'
        : `<span style="font-style:italic;color:#9aa4b2">${esc(d.blockReason ?? 'brak trasy')}</span>`;
      h += miniRow([
        esc(d.partnerLabel),
        turnsCell,
        trustCell,
        routeCell,
      ], dealGrid);
    }
    h += `</div>`;
  }

  h += `<div class="civ-emp-res-lbl">Trasy</div>`;
  if (t.routes.length > 0) {
    // Szerokości zmierzone na realnym renderze przy 404px panelu: „DOCHÓD/TURĘ" (9px) potrzebuje
    // ~74px, inaczej łamie się w środku wyrazu; „Morze · 14 heks." (11px) ~88px.
    // EN: widths measured on the real 404px render: the "DOCHÓD/TURĘ" header needs ~74px or it
    // breaks mid-word; the "Morze · 14 heks." cell needs ~88px.
    const grid = '0.95fr 0.9fr 1.1fr 0.95fr';
    h += `<div class="civ-emp-mini">${miniHeader(['TWOJE MIASTO', 'PARTNER', 'MEDIUM · DYSTANS', 'DOCHÓD/TURĘ'], grid)}`;
    for (const r of t.routes) {
      h += miniRow([
        esc(r.cityName),
        `${esc(r.partnerCityName)} (${esc(r.partnerOwnerLabel)})`,
        `<span style="font-size:11px;color:#9aa4b2">${r.medium === 'morze' ? 'Morze' : 'Ląd'} · ${r.dystans} heks.</span>`,
        `<span style="color:#78c95a">+${r.income}</span>`,
      ], grid);
    }
    // Wiersz SUMA — `totalIncome` to dokładnie suma income wszystkich tras (main.ts), więc gracz
    // może zweryfikować hero-liczbę na tej samej liście.
    // EN: SUM row — `totalIncome` is exactly the sum of every route's income, so the hero number
    // is verifiable against this very table.
    // Ta sama poprawka znaku co w hero (N6) — wiersz SUMA istnieje PO TO, żeby gracz mógł
    // zweryfikować liczbę hero, więc musi ją formatować identycznie; przy ujemnej sumie
    // „+-5" tutaj i „−5" w hero łamałoby dokładnie tę weryfikowalność.
    // / EN: same sign fix as the hero — the SUM row exists to let the player verify the hero
    // number, so it must format it identically.
    h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
      + `<div>SUMA</div><div></div><div></div><div>${signedPl(t.totalIncome)}</div></div>`;
    h += `</div>`;
  } else {
    h += `<div class="civ-emp-empty">Brak aktywnych tras handlowych. Wymagany: budynek handlowy `
      + `(Targowisko/Port) w mieście + zawarta Umowa Handlowa z obcą cywilizacją w zasięgu (bez wojny).</div>`;
  }

  // DYSPOZYCJA 85 (Maciej 2026-07-26): bonus cudów świata "handel_procent" (Petra,
  // Kamień Ha'amonga, Kolos Rodyjski, Brama wszystkich narodów, Pałac Weiyang) —
  // już wliczony w dochód powyżej (CUDA-HANDEL-01), tu tylko pokazany jako czynnik.
  if (t.wonderBonusLadPct > 0 || t.wonderBonusMorzePct > 0) {
    h += `<div class="civ-emp-resp">Bonus cudów świata: `
      + `<b>+${t.wonderBonusLadPct}%</b> ląd`
      + (t.wonderBonusMorzePct !== t.wonderBonusLadPct ? ` · <b>+${t.wonderBonusMorzePct}%</b> morze` : '')
      + ` (już wliczone w dochód tras powyżej)</div>`;
  }

  // DYSPOZYCJA 85: surowce, do których gracz ma dostęp DZIĘKI aktywnej trasie
  // handlowej — zebrane tu (panel Handel = handel międzynarodowy i tylko on),
  // USUNIĘTE z panelu miasta (tam było 🔗/tradeSources per surowiec).
  if (t.resourceGrants.length > 0) {
    h += `<div class="civ-emp-res-lbl">Surowce z wymiany handlowej</div>`;
    const grid2 = '1fr 1fr';
    h += `<div class="civ-emp-mini">${miniHeader(['SUROWIEC', 'PARTNER'], grid2)}`;
    for (const g of t.resourceGrants) {
      const ic = resIconHtml(g.label, 16);
      const nameCell = ic
        ? `<span style="display:inline-flex;align-items:center;gap:6px">`
          + `<span class="civ-emp-mini-h-ic" aria-hidden="true" style="width:14px;height:14px">${ic}</span>`
          + `${esc(g.label)}</span>`
        : esc(g.label);
      h += miniRow([nameCell, esc(g.partnerLabel)], grid2);
    }
    h += `</div>`;
  }

  h += `<div class="civ-emp-foot">Dochód trasy = max(podłoga, bazowy − dystans×współczynnik), kredytowany w pełnej kwocie `
    + `OBU miastom trasy. Każda aktywna trasa dodaje też +5% ${daninaLabelGenitive(t.daninaLabel)} z pól tego miasta (osobno od Targowiska, nie w tej sumie). `
    + `Szczegóły i warunki per miasto — panel miasta → Plony i ${t.daninaLabel.toLowerCase()} → Podział ${daninaLabelGenitive(t.daninaLabel)}.</div>`;
  h += `</div>`;
  return h;
}

function routeCountWord(n: number): string {
  if (n === 1) return 'trasa';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'trasy';
  return 'tras';
}

/**
 * Czy liczebnik bierze formę „mnoga bliska" (2–4, poza 12–14) — wspólna reguła PL dla dwóch
 * odmian poniżej. Istniejące `routeCountWord`/`miastoNiedokarmioneWord` celowo NIE są tu
 * przerabiane (poza zakresem reskinu).
 * EN: whether the numeral takes the Polish "few" form (2–4, excluding 12–14) — shared by the two
 * new word forms below. The existing count-word helpers are deliberately NOT refactored onto this
 * (outside the reskin's scope).
 */
function isPlFewForm(n: number): boolean {
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
}

function dealCountWord(n: number): string {
  if (n === 1) return 'umowa';
  return isPlFewForm(n) ? 'umowy' : 'umów';
}

function typCountWord(n: number): string {
  if (n === 1) return 'typ';
  return isPlFewForm(n) ? 'typy' : 'typów';
}

/**
 * P-SPICHLERZ-ZERO-MYLACE: polska odmiana ma TRZY formy, nie dwie — 1 / 2-4
 * (poza 12-14) / 5+ i 12-14. / EN: Polish plural has THREE forms, not two —
 * 1 / 2-4 (except 12-14) / 5+ and 12-14.
 */
function miastoNiedokarmioneWord(n: number): string {
  if (n === 1) return 'miasto niedokarmione';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'miasta niedokarmione';
  return 'miast niedokarmionych';
}

function scrollToSection(section: string | null | undefined): void {
  if (!section || bodyEl === null) return;
  const target = bodyEl.querySelector(`[data-section="${section}"]`) as HTMLElement | null;
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** U-23A: aktywne uchwały z global.uchwaly lub flagi HUD (fallback bez main.ts). */
function resolveActiveUchwaly(snap: EmpireDetailSnap): EmpireUchwalaRow[] {
  const fromGlobal = (snap.global.uchwaly ?? []).filter(u => u.aktywna);
  if (fromGlobal.length > 0) return fromGlobal;
  if (snap.economy.uchwalaSolAktywna) {
    return [buildUchwalaSolSpichlerzII(true, snap.economy.uchwalaSolSpichlerzIICount)];
  }
  return [];
}

function renderUchwalyHtml(uchwaly: EmpireUchwalaRow[]): string {
  if (uchwaly.length === 0) return '';
  let h = `<div class="civ-emp-uchwaly" data-section="uchwaly">`
    + `<div class="civ-emp-uchwaly-title">UCHWAŁY CYWILIZACYJNE</div>`;
  for (const u of uchwaly) {
    h += `<div class="civ-emp-uchwala">`
      + `<span class="nm">${esc(u.nazwa)}</span><span class="tag">${esc(u.zrodlo)}</span>`
      + `<span class="fx">${esc(u.opis)}</span></div>`;
  }
  h += `</div>`;
  return h;
}

/**
 * P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): wiąże klik zakładek Całkowita/Gospodarcza/Militarna
 * nad Rankingiem Mocy — ten sam wzorzec co inne wiring-funkcje w tym pliku (queueMicrotask po
 * ustawieniu innerHTML). No-op gdy przyciski nie są w bieżącym bloku (np. widok pojedynczej
 * sekcji spoza „moc" — patrz C-PANEL=B). / EN: wires the Total/Economic/Military tab clicks
 * above the Power Ranking — same pattern as the other wiring functions in this file. No-op
 * when the buttons aren't in the current block (e.g. a single-section view other than "moc").
 */
function wireMocViewButtons(): void {
  if (bodyEl === null) return;
  for (const btn of Array.from(bodyEl.querySelectorAll<HTMLButtonElement>('[data-moc-view]'))) {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mocView as PowerRankingViewMode | undefined;
      if (!mode || mode === mocViewMode) return;
      mocViewMode = mode;
      render();
    });
  }
}

function render(): void {
  if (root === null || bodyEl === null || getSnap === null) return;
  const snap = getSnap();
  const g = snap.global;
  const e = snap.economy;
  const k = snap.kultura;
  const p = snap.power;
  const ce = snap.cityEcon;
  const cp = snap.cityPobor;
  const uchwaly = resolveActiveUchwaly(snap);
  const uchwalyHtml = renderUchwalyHtml(uchwaly);

  // — PARAMETRY GLOBALNE (zachowane, reskin) —
  const bonusHtml = g.bonusy.map(b =>
    `<div class="civ-emp-bonus">${esc(b.opis)}<span class="tag">${esc(b.realizuje)}</span></div>`,
  ).join('');
  const params = `<div class="civ-emp-sect" data-section="parametry">`
    + `<div class="civ-emp-eyebrow">PARAMETRY GLOBALNE</div><div class="civ-emp-meta">`
    + `<div class="civ-emp-chip"><div class="k">Epoka</div><div class="v gold">${esc(e.epoka)}</div></div>`
    + `<div class="civ-emp-chip"><div class="k">Tura</div><div class="v">${e.tura}</div></div>`
    + `<div class="civ-emp-chip"><div class="k">Moc <span class="civ-emp-mini-h-ic" aria-hidden="true">${brandIconSvg('res-influence', 12)}</span></div><div class="v gold">${e.power}</div></div>`
    + `<div class="civ-emp-chip"><div class="k">Osiedla</div><div class="v">${e.osiedla}/${e.osiedlaMax}</div></div>`
    + `<div class="civ-emp-chip wide"><div class="k">Religia państwowa</div><div class="v">${esc(g.religiaPanstwowa)}</div></div>`
    + `<div class="civ-emp-chip wide"><div class="k">Badania</div><div class="v">${esc(e.badana ?? '—')}</div></div>`
    + `<div class="civ-emp-chip wide"><div class="k">Bonus startowy</div><div class="v">${esc(g.bonusStartowy)}</div></div>`
    + `</div>${bonusHtml}${uchwalyHtml}</div>`;

  // — MOC IMPERIUM —
  let moc = `<div class="civ-emp-sect sep" data-section="moc">`
    + `<div class="civ-emp-eyebrow">${esc(mocLabel().toUpperCase())} IMPERIUM</div>`
    + `<div class="civ-emp-moc-big">${esc(mocWithValue(p.power))}</div>`
    + `<div class="civ-emp-moc-sub">Suma składników: <b>${Math.round(p.powerBase)}</b> pkt (kanon P‑A · bez mnożnika epoki)</div>`
    + `<div class="civ-emp-two">`
    + `<div class="civ-emp-box" data-section="econ-miasta"><div class="k">MIASTA</div>`
    + `<div class="v">${e.osiedla} · ${formatObywateleLabel(e.ludnosc)} · ${esc(p.ludnoscAbsLabel)} abs.</div></div>`
    + `<div class="civ-emp-box" data-section="econ-rekruci"><div class="k">REKRUCI</div>`
    + `<div class="v">${esc(p.rekruciLabel)} / ${esc(p.rekruciMaxLabel)} · ${p.rekrutEkw} werb.</div></div>`
    + `</div>`;
  moc += `<div class="civ-emp-tbl"><div class="civ-emp-tbl-h">`
    + `<div>SKŁADNIK</div><div>ILOŚĆ</div><div>×<br>WSP.</div><div>=<br>PKT</div><div>%</div></div>`;
  for (const c of p.components) {
    moc += `<div class="civ-emp-tbl-r">`
      + `<div><div class="nm">${esc(c.label)}</div><div class="src">${esc(c.formulaNote ?? '—')}</div></div>`
      + `<div class="qty">${formatRawCount(c.rawCount)}</div>`
      + `<div class="wsp">${c.weightPct}</div>`
      + `<div class="pkt">${Math.round(c.points)}</div>`
      + `<div class="pct">${c.sharePct}%</div></div>`;
  }
  moc += `</div>`;
  moc += `<div class="civ-emp-foot">Respekt w dyplomacji = stosunek Twojej Mocy do Mocy rozmówcy (nie to samo co % udziału w tabeli).</div>`;
  if (p.ranking.length > 0) {
    // P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): przełącznik widoku Rankingu — Całkowita
    // (dzisiejsza suma, domyślna) / Gospodarcza (wszystko OPRÓCZ Armii+Rekrutów) / Militarna
    // (WYŁĄCZNIE Armia+Rekruci). Ranking przelicza się CAŁY wg wybranego trybu (sortPowerRankingForMode)
    // — nie tylko wartość gracza. / EN: Ranking view toggle — Total (today's default sum) /
    // Economic (everything EXCEPT Army+Recruits) / Military (ONLY Army+Recruits). The WHOLE
    // ranking is re-sorted for the chosen mode (sortPowerRankingForMode), not just the player's row.
    const mocViewLabel: Record<PowerRankingViewMode, string> = {
      total: 'Całkowita', economic: 'Gospodarcza', military: 'Militarna',
    };
    moc += `<div class="civ-emp-title" style="margin-top:12px">Ranking ${esc(mocLabel())}</div>`;
    moc += `<div class="civ-emp-mocview">`;
    for (const m of ['total', 'economic', 'military'] as PowerRankingViewMode[]) {
      const cls = m === mocViewMode ? 'civ-emp-mocview-btn active' : 'civ-emp-mocview-btn';
      moc += `<button type="button" class="${cls}" data-moc-view="${m}">${esc(mocViewLabel[m])}</button>`;
    }
    moc += `</div>`;
    const rankingForView = sortPowerRankingForMode(p.ranking, mocViewMode);
    moc += `<div class="civ-emp-rank">`;
    for (const r of rankingForView) {
      const val = Math.round(powerRankingValueForMode(r, mocViewMode));
      if (r.isPlayer) {
        moc += `<div class="you">▸ #${r.rank} ${esc(r.civ)} — ${esc(mocWithValue(val))}</div>`;
      } else {
        moc += `#${r.rank} ${esc(r.civ)} — ${esc(mocWithValue(val))}<br>`;
      }
    }
    moc += `</div>`;
  }
  if (p.absoluteRank) {
    moc += `<div class="civ-emp-foot">Twoja pozycja: <b>${p.absoluteRank.rank}. z ${p.absoluteRank.total}</b> `
      + `cywilizacji (uwzględnia nieodkryte)</div>`;
  }
  if (p.respektExample) {
    const ex = p.respektExample;
    moc += `<div class="civ-emp-resp">Respekt wobec <b>${esc(ex.civ)}</b>: `
      + `${ex.respekt}% (Twoja moc ${ex.playerPower} vs ${ex.theirPower})</div>`;
  }
  moc += `</div>`;

  // — ZASOBY IMPERIUM —
  type EconRow = { id: string; lbl: string; stock: string; rate: number; gold?: boolean; noRate?: boolean };
  const econRows: EconRow[] = [
    { id: 'praca', lbl: 'Praca (pula)', stock: String(e.praca), rate: e.pracaRate },
    { id: 'skarbiec', lbl: 'Skarbiec', stock: String(e.bogactwo), rate: e.bogactwoRate ?? 0 },
    { id: 'nauka', lbl: 'Bank nauki', stock: String(Math.floor(e.nauka)), rate: e.naukaRate ?? 0 },
    { id: 'kultura', lbl: 'Kultura (suma miast)', stock: String(e.kultura), rate: e.kulturaRate ?? 0 },
    { id: 'religia', lbl: 'Wierni religii', stock: String(e.religionStock ?? '—'), rate: e.religionRate ?? 0 },
    { id: 'miasta', lbl: 'Miasta (osiedla imperium)', stock: String(e.osiedla), rate: e.ludnoscRate ?? 0, noRate: true },
    { id: 'rekruci', lbl: 'Rekruci (pula werbu)', stock: e.rekruciLabel ?? String(p.rekruci), rate: 0, gold: true, noRate: true },
  ];
  const detailFor: Record<string, string> = {
    skarbiec: cityEconMiniSkarbiec(ce, e),
    praca: cityEconMiniPraca(ce, e.pracaUpkeep),
    nauka: cityEconMiniNauka(ce),
    // N1 (Evaluator, notatka na 89c16ec1): klucz 'ludnosc' USUNIĘTY — żaden wpis econRows nie ma
    // id 'ludnosc' (patrz tablica econRows wyżej: praca/skarbiec/nauka/kultura/religia/miasta/
    // rekruci), więc detailFor.ludnosc nigdy nie był czytany — tylko wołał cityMiastaMiniDetail()
    // po raz drugi bez potrzeby (double-wiring przez queueMicrotask, patrz N1 w tej funkcji).
    // / EN: 'ludnosc' key REMOVED — no econRows entry has id 'ludnosc', so detailFor.ludnosc was
    // never read — it only called cityMiastaMiniDetail() a needless second time (double-wiring).
    miasta: cityMiastaMiniDetail(ce, cp, snap.food, e),
    rekruci: cityPoborMiniRekruci(cp, p),
  };
  let zasoby = `<div class="civ-emp-sect sep" data-section="ekonomia">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:8px">ZASOBY IMPERIUM (STAN + PRZYROST)</div>`;
  // C-PANEL=B (Maciej 2026-07-24): klik konkretnego żetonu dochodu (np. Nauka) pokazuje TYLKO
  // jego wiersz, nie cały blok „ZASOBY IMPERIUM" (żeby Nauka nie ciągnęła praca/żywność/skarbiec).
  // activeSection 'econ-nauka' -> tylko wiersz id 'nauka'. 'ekonomia' (ogólny) -> wszystkie.
  const onlyEconId = (activeSection && activeSection.startsWith('econ-')) ? activeSection.slice(5) : null;
  for (const r of econRows) {
    if (onlyEconId && r.id !== onlyEconId) continue;
    const detail = detailFor[r.id];
    const rateCell = r.id === 'skarbiec' ? treasuryDeltaHtml(r.rate) : deltaHtml(r.rate);
    const val = r.noRate
      ? `<b${r.gold ? ' class="gold"' : ''}>${esc(r.stock)}</b>`
      : `<b>${esc(r.stock)}</b> ${rateCell}`;
    zasoby += `<div class="civ-emp-zrow${detail ? '' : ' brd'}" data-section="econ-${r.id}">`
      + `<span class="lbl">${r.lbl}</span><span class="val">${val}</span></div>`;
    if (detail) zasoby += `<div data-section="econ-${r.id}">${detail}</div>`;
  }
  // P-EMPIRE-PANEL-SUWAKI-DUPLIKOWANE-NA-WSZYSTKICH-ZAKLADKACH (Maciej 2026-08-12): każda
  // zakładka pokazuje WYŁĄCZNIE tematycznie powiązany suwak, nie oba naraz na każdej — reguła
  // i pełne uzasadnienie w `econSliderVisibilityForOnlyEconId` (empirePanelSectionMap.ts, plik
  // bez importów UI/DOM, testowalny przez esbuild). C-PANEL=B (filtr wierszy econRows wyżej)
  // zostaje nienaruszony — to tylko dwa wywołania suwaków, poza pętlą.
  // EN: each tab shows ONLY its thematically-linked slider, not both on every tab — rule and
  // full rationale live in `econSliderVisibilityForOnlyEconId` (empirePanelSectionMap.ts, a
  // DOM/UI-import-free file, esbuild-testable). C-PANEL=B (econRows row filter above) stays
  // intact — only these two slider calls, outside the loop, are affected.
  const sliderVis = econSliderVisibilityForOnlyEconId(onlyEconId);
  if (sliderVis.showTaxSplit) zasoby += renderDefaultHandelSplitSection();
  if (sliderVis.showLaborSplit) zasoby += renderDefaultPodzialPracySection();
  zasoby += `<div class="civ-emp-foot">Klik w górnym pasku zasobów przewija do tabeli per miasto. Duża liczba = stan · zielone = netto.</div></div>`;

  // — SKARBIEC (R-DESIGN-11-ZAKLADEK faza 1, Maciej 2026-08-13) — hero „Netto ±N / turę",
  // własny blok top-level (patrz empirePanelSectionMap.ts). Miasta zostają na dawnym torze
  // `ekonomia` (kolejna faza) — ce/e potrzebne tu tak samo jak w detailFor niżej.
  const skarbiec = renderSkarbiecSection(ce, e);

  // — PRACA / NAUKA / RELIGIA (R-DESIGN-11-ZAKLADEK faza 2, Maciej 2026-08-1x) — własne bloki
  // top-level, wzorem Skarbca (faza 1). `snap.research`/`snap.religion` liczone raz w
  // `buildEmpireDetailSnap()` (main.ts) i przekazane przez snapshot — panel tylko renderuje.
  const praca = renderPracaSection(ce, e);
  const nauka = renderNaukaSection(ce, e, snap.research);
  const religia = renderReligiaSection(snap.religion);

  // — MIASTO / OBYWATELE (R-DESIGN-11-ZAKLADEK faza 3, Klatki 8 i 9) — dwa niezależne bloki
  // top-level w miejsce dawnej wspólnej zakładki `econ-miasta`. `cityMiastaMiniDetail()` wyżej
  // NIE jest usuwana — nadal obsługuje wiersz „Miasta" w pełnym przeglądzie „ZASOBY IMPERIUM"
  // (blok `ekonomia`, gdy activeSection === null), tak samo jak `cityEconMiniSkarbiec()` przeżyła
  // wydzielenie Skarbca w fazie 1. / EN: two independent top-level blocks replacing the shared
  // `econ-miasta` tab; `cityMiastaMiniDetail()` is NOT removed — it still backs the "Miasta" row
  // of the full overview, exactly as `cityEconMiniSkarbiec()` survived the phase-1 Treasury split.
  const miasto = renderMiastoSection(ce, cp, e, snap.trade, snap.resources);
  const obywatele = renderObywateleSection(ce, cp, e, p, k, snap.religion, snap.resources);

  // — SPICHLERZ (Maciej 2026-07-28) — magazyn centralny żywności, bez wojska.
  const spichlerz = renderSpichlerzCentralnySection(snap.food)
    .replace('data-section="spichlerz-centralny"', 'data-section="spichlerz"')
    .replace('class="civ-emp-sect"', 'class="civ-emp-sect sep"');

  // — ARMIA — wojsko + rekruci; żywność tylko skrót zaopatrzenia (reszta w Spichlerzu).
  // R-DESIGN-11-ZAKLADEK (klatka 7 makiety, §8.7 zlecenia): reskin do wzorca sekcji Moc/Skarbiec
  // — hero „N jednostek na mapie" + podpis z pulą rekrutów, pasek zapełnienia puli, tabela
  // rekrutów, wiersze zaopatrzenia, callout `.civ-emp-alert` przy głodzie wojska. Emoji 🍞
  // zamienione na ikonę brandu `res-food` pokazywaną RAZ, przy nagłówku zaopatrzenia (§5
  // handoffu: ikona przy nagłówku, nie powtarzana per wiersz). Liczby i logika bez zmian.
  // / EN: reskin to the Power/Treasury section pattern — hero "N units on the map" + recruit
  // pool subtitle, pool fill bar, recruit table, supply rows, `.civ-emp-alert` callout on army
  // hunger. The 🍞 emoji is replaced by the `res-food` brand icon shown ONCE, at the supply
  // heading (handoff §5: icon at the heading, never repeated per row). Numbers/logic unchanged.
  const kosztWojska = Math.round(e.zywnoscKosztWojska ?? 0);
  const maxZywnPart = e.zywnoscMax != null && e.zywnoscMax > 0 ? ` / ${e.zywnoscMax}` : '';
  const rekrPct = p.rekruciMax > 0 ? Math.round((p.rekruci / p.rekruciMax) * 100) : 0;
  const rekrFill = rekrPct >= 60 ? 'fill' : (rekrPct >= 25 ? 'fill warn' : 'fill low');
  const glodTeraz = !!e.glodWojska;
  const glodZaTur = e.zywnoscKarencjaZaTur != null && e.zywnoscKarencjaZaTur > 0;
  const magazynCls = glodTeraz || glodZaTur ? 'neg' : 'pos';
  let armia = `<div class="civ-emp-sect sep" data-section="armia">`
    + `<div class="civ-emp-eyebrow">ARMIA</div>`
    + `<div class="civ-emp-hero">${p.unitsOnMap} jednostek na mapie</div>`
    + `<div class="civ-emp-hero-sub">Rekruci <b>${esc(p.rekruciLabel)}</b> / <b>${esc(p.rekruciMaxLabel)}</b>`
    + ` · można werbować <b>${p.rekrutEkw}</b> jedn. (${p.kosztJednostki} rekr./szt.)</div>`
    + `<div class="civ-emp-bar"><div class="${rekrFill}" style="width:${rekrPct}%"></div></div>`;
  // Para boxów z klatki 7 makiety (naprawa N2 Evaluatora na a6ed0553) — reskin przeszedł
  // z paska rekrutów wprost do nagłówka „Rekruci — pula werbu", pomijając `.civ-emp-two`,
  // które Handel i Kultura w tym samym commicie już mają. Obie liczby to dane JUŻ obecne
  // w snapshocie, nic nowego się tu nie liczy:
  //  · KOSZT ZŁOTA  = `economy.bogactwoUtrzymanieJednostek` — DODATNIA wielkość kosztu (to samo
  //    pole i ten sam znak, z którego Skarbiec składa pozycję „koszty", patrz
  //    `renderSkarbiecSection()`), więc minus dokładamy przy druku, jak w cityPanel.ts;
  //  · ZAOPATRZENIE = `kosztWojska` (żywność/turę), policzone już wyżej dla wiersza
  //    „Koszt żywności armii" — tu tylko dublowane do boxa, zgodnie z makietą.
  // Jednostka „/ turę" stoi przy OBU liczbach (makieta miała przy zaopatrzeniu samo
  // „żywności") — wymóg CLAUDE.md §3: każda liczba ma nazwany parametr I jednostkę, a bez
  // „/ turę" liczba czyta się jak stan magazynu, nie koszt na turę.
  // / EN: the mockup's frame-7 box pair, skipped by the reskin. Both numbers already exist in
  // the snapshot — army gold upkeep (a POSITIVE cost magnitude, same field the Treasury sums
  // into "koszty", so the minus is added at print time) and the army food cost computed above.
  // The "/ turę" unit is on BOTH boxes (the mockup had bare "żywności") per CLAUDE.md §3.
  const utrzZloto = Math.round(e.bogactwoUtrzymanieJednostek ?? 0);
  const zlotoTxt = utrzZloto > 0 ? `−${utrzZloto}` : '0';
  const zywTxt = kosztWojska > 0 ? `−${kosztWojska}` : '0';
  const jednostkaSub = (txt: string): string =>
    `<span style="font-size:11px;color:#7d8798;font-weight:600">${txt}</span>`;
  armia += `<div class="civ-emp-two">`
    + `<div class="civ-emp-box"><div class="k">KOSZT ZŁOTA</div>`
    + `<div class="v"${utrzZloto > 0 ? ' style="color:#e07a7a"' : ''}>${zlotoTxt} `
    + `${jednostkaSub('złota / turę')}</div></div>`
    + `<div class="civ-emp-box"><div class="k">ZAOPATRZENIE</div>`
    + `<div class="v">${zywTxt} ${jednostkaSub('żywności / turę')}</div></div>`
    + `</div>`;
  const rekrRow = econRows.find(r => r.id === 'rekruci');
  if (rekrRow) {
    armia += `<div data-section="econ-rekruci">`
      + `<div class="civ-emp-res-lbl">Rekruci — pula werbu</div>`
      + `${cityPoborMiniRekruci(cp, p, { skipHero: true })}</div>`;
  }
  armia += `<div class="civ-emp-res-lbl civ-emp-lbl-ic">Zaopatrzenie wojska`
    + `<span class="civ-emp-mini-h-ic" aria-hidden="true">${brandIconSvg('res-food', 12)}</span></div>`
    + `<div class="civ-emp-zrow brd"><span class="lbl">Koszt żywności armii</span>`
    + `<span class="val"><span class="d neg">−${kosztWojska} / turę</span></span></div>`
    + `<div class="civ-emp-zrow"><span class="lbl">Magazyn państwa</span>`
    + `<span class="val"><span class="d ${magazynCls}">${esc(e.zywnoscLabel)}${maxZywnPart}</span></span></div>`;
  if (glodTeraz) {
    armia += `<div class="civ-emp-alert"><b>Głód wojska</b> — uzupełnij Spichlerz centralny.</div>`;
  } else if (glodZaTur) {
    // Wariant ŻÓŁTY (naprawa N10 Evaluatora na a6ed0553): to zdarzenie NADCHODZĄCE, nie trwające
    // — przed reskinem miało własny, mniej pilny kolor, a reskin spłaszczył oba komunikaty do
    // jednego czerwonego `.civ-emp-alert`. Dwa poziomy pilności wracają przez modyfikator `.warn`.
    // / EN: AMBER variant — this is an UPCOMING event, not one already happening; the reskin had
    // flattened both urgency levels into the single red alert.
    armia += `<div class="civ-emp-alert warn"><b>Głód wojska za ${e.zywnoscKarencjaZaTur} tur</b> — magazyn ujemny.</div>`;
  }
  if (uchwaly.length > 0) {
    armia += renderUchwalyHtml(uchwaly);
  }
  armia += `<div class="civ-emp-foot">Pełna bilans żywności imperium — przycisk Spichlerz na lewym pasku. Ludność miast — zakładka Ludność.</div></div>`;

  // — KULTURA IMPERIUM (R-DESIGN-11-ZAKLADEK faza 3 — klatka 10, RESKIN, nic nie usunięte) —
  // Nagłówek przeszedł z `.civ-emp-title` na eyebrow (rejestr decyzji designera 2026-08-14,
  // punkt 2: jedna konwencja nagłówka wspólna dla wszystkich 11 zakładek). Dane, liczby
  // i logika BEZ ZMIAN — te same pola `snap.kultura` co przed reskinem; zmienia się wyłącznie
  // sposób ich pokazania (hero + boxy + pasek + lista progów zamiast trzech linii tekstu).
  // EN: Culture — reskin to frame 10. The header moved from `.civ-emp-title` to the eyebrow
  // convention shared by all 11 tabs (designer decision log 2026-08-14, item 2). Data, numbers
  // and logic are UNCHANGED — same `snap.kultura` fields as before; only their presentation
  // changes (hero + boxes + progress bar + threshold list instead of three text lines).
  //
  // Najsilniejsze miasto = to o największej Kulturze na liście `k.cities`; ten sam punkt
  // odniesienia, do którego silnik liczy `pctToNext` (poprzednia wersja mówiła o nim wprost
  // w tekście „(najsilniejsze miasto)", tylko bez podania nazwy).
  // EN: strongest city = highest Culture in `k.cities` — the same reference point the engine
  // uses for `pctToNext` (the previous copy already said "(strongest city)", just without a name).
  const kultTop = k.cities.reduce<(typeof k.cities)[number] | null>(
    (best, c) => (best === null || c.kultura > best.kultura ? c : best), null);
  // Trzy przypadki, nie dwa (naprawa N8 Evaluatora na a6ed0553): dotąd warunek sprawdzał tylko
  // `rate < 0`, więc ZEROWY przyrost dostawał kolor zielony — a `signedTxt(0)` drukuje „—",
  // co dawało zieloną kreskę czytaną jak wzrost. Zero to brak zmiany, nie sukces → neutralny
  // szary #9aa4b2, ten sam odcień, którego plik używa dla wartości bez wydźwięku.
  // / EN: three cases, not two — a ZERO rate used to render green, and since `signedTxt(0)`
  // prints "—", the result was a green dash reading like growth. Zero is no change, not success.
  const kultRateColor = k.rate < 0 ? '#e07a7a' : (k.rate > 0 ? '#78c95a' : '#9aa4b2');
  let kult = `<div class="civ-emp-sect sep" data-section="kultura">`
    + `<div class="civ-emp-eyebrow">KULTURA IMPERIUM</div>`
    + `<div class="civ-emp-hero ${k.rate < 0 ? 'neg' : 'pos'}">${k.total} kultury</div>`
    + `<div class="civ-emp-hero-sub">Przyrost <b style="color:${kultRateColor}">${signedTxt(k.rate)}</b>`
    + ` / turę · ${k.cities.length} ${miastoCountWord(k.cities.length)}</div>`;
  kult += `<div class="civ-emp-two">`
    + `<div class="civ-emp-box"><div class="k">NAJSILNIEJSZE MIASTO</div>`
    + `<div class="v">${kultTop ? esc(kultTop.name) : '—'}</div></div>`
    + `<div class="civ-emp-box"><div class="k">DO PROGU</div>`
    + `<div class="v" style="color:#d9a441">${k.pctToNext != null ? `${k.pctToNext}%` : '—'}</div></div>`
    + `</div>`;
  if (kultTop !== null && k.nextThreshold != null && k.pctToNext != null) {
    const pctBar = Math.max(0, Math.min(100, k.pctToNext));
    const brakuje = Math.max(0, k.nextThreshold - kultTop.kultura);
    kult += `<div style="margin-top:14px">`
      + `<div style="display:flex;align-items:baseline;gap:8px;font-size:12px;color:#9aa4b2;margin-bottom:6px">`
      + `<span style="flex:1;min-width:0">${esc(kultTop.name)} — zasięg granic</span>`
      + `<span><b style="color:#e8ebf0">${kultTop.kultura}</b> / ${k.nextThreshold}</span></div>`
      // Wypełnienie paska jako `<div>`, NIE `<span>`: `.civ-emp-bar .fill` ustawia height:100%
      // bez `display:block`, więc na elemencie inline wysokość jest ignorowana i pasek renderuje
      // się pusty. Blokowy `<div>` to wzorzec działający w tym pliku (Spichlerz, Surowce).
      // EN: bar fill is a `<div>`, NOT a `<span>`: `.civ-emp-bar .fill` sets height:100% without
      // `display:block`, so on an inline element the height is ignored and the bar renders empty.
      // The block-level `<div>` is the pattern that works elsewhere in this file.
      + `<div class="civ-emp-bar" style="margin:0"><div class="fill warn" style="width:${pctBar}%"></div></div>`
      + `<div style="font-size:11px;color:#9aa4b2;margin-top:6px">${brakuje} kultury do rozszerzenia granic</div>`
      + `</div>`;
  }
  if (k.thresholds.length > 0) {
    // Stan progu wyprowadzony WYŁĄCZNIE z `k.nextThreshold` (progi < bieżącego = osiągnięte,
    // równy = bieżący, większe = przyszłe) — bez własnego porównywania z Kulturą miasta, żeby
    // nie powielać reguły progu, którą liczy silnik.
    // EN: threshold state derived SOLELY from `k.nextThreshold` (below = reached, equal =
    // current, above = future) — no separate comparison against city Culture, so the engine's
    // threshold rule is not duplicated here.
    kult += `<div class="civ-emp-res-lbl">Progi zasięgu</div><div class="civ-emp-thr-list">`;
    k.thresholds.forEach((t, i) => {
      let cls = 'civ-emp-thr done';
      let st = 'osiągnięty';
      if (k.nextThreshold != null) {
        if (t === k.nextThreshold) {
          cls = 'civ-emp-thr now';
          st = k.pctToNext != null ? `${k.pctToNext}%` : '—';
        } else if (t > k.nextThreshold) {
          cls = 'civ-emp-thr next';
          st = '—';
        }
      }
      kult += `<div class="${cls}"><span class="lbl">Próg ${i + 1} · ${t} kultury</span>`
        + `<span class="st">${st}</span></div>`;
    });
    kult += `</div>`;
  }
  if (k.cities.length > 0) {
    const grid = '1fr 0.8fr 0.8fr';
    let kultSum = 0;
    kult += `<div class="civ-emp-res-lbl">Miasta</div>`
      + `<div class="civ-emp-mini civ-emp-kult-city-tbl">${miniHeader(['MIASTO', 'KULTURA', 'ZASIĘG'], grid)}`;
    for (const c of k.cities) {
      kultSum += c.kultura;
      const zasieg = `+${c.borderRadius} hex`;
      const zasiegHtml = c === kultTop ? `<span style="color:#d9a441">${zasieg}</span>` : zasieg;
      kult += miniRow([esc(c.name), String(c.kultura), zasiegHtml], grid);
    }
    // Wiersz sumy: sumuje się WYŁĄCZNIE Kultura (pkt). Kolumna ZASIĘG zostaje pusta („—"),
    // bo `borderRadius` to PROMIEŃ granicy w heksach — suma promieni różnych miast nie jest
    // żadną wielkością gry (nie jest to ani powierzchnia terytorium, ani promień imperium),
    // więc wpisanie tam liczby łamałoby zasadę „każda liczba ma nazwany parametr".
    // EN: summary row sums Culture (pts) ONLY. The ZASIĘG column stays empty ("—") because
    // `borderRadius` is a border RADIUS in hexes — summing radii across cities is not a real
    // game quantity (neither territory area nor an empire radius), so putting a number there
    // would break the "every number needs a named parameter" rule.
    kult += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`
      + `<div>SUMA</div><div>${kultSum}</div><div>—</div></div>`;
    kult += `</div>`;
  }
  kult += `<div class="civ-emp-resp">${esc(k.happinessNote)}</div>`;
  kult += `<div class="civ-emp-foot">Szczegóły per miasto (źródła, progi) — panel miasta → zakładka Kultura. Przycisk Kultura na toolbarze = zasięg na mapie.</div></div>`;

  // — MAGAZYN PAŃSTWA (surowce, mockup „Magazyn surowców" — Maciej 2026-07-24) —
  const sur = renderSurowceSection(snap.resources);

  // — HANDEL (TEMAT 14, Maciej 2026-07-24) — żeton HUD „Handel" obok Skarbca —
  const handel = renderHandelSection(snap.trade);

  // C-PANEL=B: pokaż tylko blok odpowiadający klikniętemu żetonowi (albo cały panel, gdy 'all').
  const block = blockForSection(activeSection);
  let body = '';
  if (block === 'all' || block === 'parametry') body += params;
  if (block === 'all' || block === 'moc') body += moc;
  if (block === 'all' || block === 'ekonomia') body += zasoby;
  if (block === 'skarbiec') body += skarbiec;
  if (block === 'praca') body += praca;
  if (block === 'nauka') body += nauka;
  if (block === 'religia') body += religia;
  if (block === 'miasto') body += miasto;
  if (block === 'obywatele') body += obywatele;
  if (block === 'spichlerz') body += spichlerz;
  if (block === 'armia') body += armia;
  if (block === 'all' || block === 'kultura') body += kult;
  if (block === 'all' || block === 'surowce') body += sur;
  if (block === 'all' || block === 'handel') body += handel;
  // P-MOC-BALANS-WAGI/scroll (Maciej, zgłoszenie Evaluatora): innerHTML podmienia CAŁĄ treść
  // .civ-emp-body, co samo z siebie zeruje scrollTop — zapamiętujemy pozycję PRZED podmianą i
  // przywracamy PO niej, żeby np. klik zakładki Rankingu Mocy (wireMocViewButtons) czy filtr
  // kolumn (wireMiastaColFilter) nie przewijał panelu z powrotem na sam początek. / EN: innerHTML
  // replaces the ENTIRE .civ-emp-body content, which by itself zeroes scrollTop — we save the
  // position BEFORE the swap and restore it AFTER, so e.g. clicking a Power Ranking view tab
  // (wireMocViewButtons) or a column filter (wireMiastaColFilter) doesn't scroll the panel back
  // to the very top.
  const prevScrollTop = bodyEl.scrollTop;
  bodyEl.innerHTML = body;
  wireMocViewButtons();
  // N1 (Evaluator, notatka na 89c16ec1): JEDNO wywołanie na render() (przeniesione z wnętrza
  // cityMiastaMiniDetail — patrz komentarz tam) — filtr kolumn tabeli Miasta istnieje w DOM
  // tylko gdy blok 'ekonomia'/'all' jest w body; wireMiastaColFilter() jest null-safe
  // (getElementById zwraca null poza tym blokiem, funkcja wtedy po prostu wraca).
  // / EN: SINGLE call per render() (moved out of cityMiastaMiniDetail) — the Miasta column
  // filter only exists in the DOM when the 'ekonomia'/'all' block is in body;
  // wireMiastaColFilter() is null-safe (getElementById returns null otherwise, function
  // returns early).
  queueMicrotask(wireMiastaColFilter);
  // R-DESIGN-11-ZAKLADEK faza 3: przełącznik zakresu i checkboxy surowców zakładki Miasto.
  // Oba null-safe (querySelectorAll zwraca pustą listę poza blokiem `miasto`), więc wołane
  // bezwarunkowo raz na render — jak wireMocViewButtons wyżej. SYNCHRONICZNIE, nie przez
  // queueMicrotask: `bodyEl.innerHTML` jest już podmienione linijkę wyżej, więc węzły istnieją,
  // a odroczenie tworzyłoby okno, w którym kontrolka jest widoczna, ale jeszcze nie reaguje na
  // klik (realnie złapane przy weryfikacji w headless Chromium). Podwójne podpięcie nie grozi —
  // w przeciwieństwie do `wireMiastaColFilter` (nota N1) te funkcje są wołane raz na render.
  // EN: wired SYNCHRONOUSLY, not via queueMicrotask — innerHTML is already swapped one line
  // above, so the nodes exist; deferring would leave a window where the control is visible but
  // does not yet respond to clicks (caught for real during headless-Chromium verification).
  // No double-wiring risk: unlike `wireMiastaColFilter` (note N1) these run once per render.
  wireMiastoScopeButtons();
  wireMiastoResFilter();

  // Scroll do podsekcji ma sens tylko w pełnym widoku; przy pojedynczym bloku i tak widać całość.
  const scrollTarget = block === 'all' ? pendingScrollSection : null;
  pendingScrollSection = null;
  if (scrollTarget) {
    requestAnimationFrame(() => scrollToSection(scrollTarget));
  } else if (resetScrollOnNextRender) {
    // RUNDA 2: nowe otwarcie / zmiana bloku (flaga ustawiona w showEmpireDetailPanel) —
    // pokaż nową treść OD GÓRY, nie scrollTop z poprzedniego, innego widoku.
    // EN: fresh open / block change (flag set in showEmpireDetailPanel) — show the new
    // content from the TOP, not the scrollTop left over from the previous, different view.
    resetScrollOnNextRender = false;
    bodyEl.scrollTop = 0;
  } else {
    bodyEl.scrollTop = prevScrollTop;
  }
}

let backdrop: HTMLDivElement | null = null;

function ensureDom(): void {
  ensureStyles();
  if (backdrop === null) {
    backdrop = document.createElement('div');
    backdrop.className = 'civ-emp-backdrop';
    backdrop.addEventListener('click', () => hideEmpireDetailPanel());
    document.body.appendChild(backdrop);
  }
  if (root === null) {
    root = document.createElement('div');
    root.className = 'civ-emp-panel';
    root.innerHTML = '<div class="civ-emp-hdr">'
      + '<div class="civ-emp-hdr-ic" data-civ-em></div>'
      + '<div class="civ-emp-hdr-tx"><div class="civ-emp-civ-name" data-civ-name></div>'
      + '<div class="civ-emp-civ-sub" data-civ-sub></div></div>'
      + `<button type="button" class="civ-emp-close" data-close aria-label="Zamknij">${brandIconSvg('ui-close', 16)}</button>`
      + '</div><div class="civ-emp-body"></div>';
    bodyEl = root.querySelector('.civ-emp-body') as HTMLDivElement;
    root.querySelector('[data-close]')?.addEventListener('click', () => hideEmpireDetailPanel());
    document.body.appendChild(root);
  }
}

function renderHeader(): void {
  if (root === null || getSnap === null) return;
  const g = getSnap().global;
  const em = root.querySelector('[data-civ-em]');
  const nm = root.querySelector('[data-civ-name]') as HTMLElement | null;
  const sub = root.querySelector('[data-civ-sub]');
  const brandLine = formatCivBrandLine(g.styl, g.jednostkaSpec);
  // Portret władcy zamiast gołego emoji cywilizacji (P-PANEL-IMPERIUM-PORTRET-WLADCA,
  // Maciej 2026-08-14) — jeden wspólny nagłówek `.civ-emp-hdr` dla WSZYSTKICH 11 zakładek
  // panelu (zakładki to tylko zawartość `.civ-emp-body`, ten sam `[data-civ-em]` renderowany
  // raz tutaj), więc jedna naprawa działa naraz na wszystkich. Fallback do `civEmoji` gdy
  // brak pliku portretu (civPortraitUrl null) — patrz JSDoc EmpireGlobalParams. / EN: ruler
  // portrait instead of a bare civ emoji — one shared `.civ-emp-hdr` header for ALL 11 panel
  // tabs (tabs are only `.civ-emp-body` content, this same `[data-civ-em]` node is rendered
  // once here), so a single fix covers all of them at once. Falls back to `civEmoji` when no
  // portrait file exists (civPortraitUrl null) — see EmpireGlobalParams JSDoc.
  if (em) {
    if (g.civPortraitUrl) {
      em.textContent = '';
      const img = document.createElement('img');
      img.className = 'civ-emp-hdr-portrait';
      img.alt = '';
      img.src = g.civPortraitUrl;
      em.appendChild(img);
    } else {
      em.textContent = g.civEmoji;
    }
  }
  if (nm) {
    nm.textContent = g.civName;
    if (brandLine) {
      nm.setAttribute('title', brandLine);
      nm.classList.add('has-brand-tip');
    } else {
      nm.removeAttribute('title');
      nm.classList.remove('has-brand-tip');
    }
  }
  if (sub) sub.textContent = '';
}

/** Montuje panel; getSnap wywoływany przy każdym renderze. */
export function mountEmpireDetailPanel(snapFn: () => EmpireDetailSnap): void {
  getSnap = snapFn;
  ensureDom();
}

/** section: np. parametry, moc, ekonomia, econ-skarbiec, econ-praca, econ-ludnosc, kultura, surowce */
export function showEmpireDetailPanel(section?: string): void {
  ensureDom();
  const newSection = section ?? null;
  // RUNDA 2 scroll-reset: reset scrolla do góry gdy to NIE zwykły re-render tego samego,
  // już otwartego bloku — czyli gdy panel był zamknięty (świeże otwarcie, np. ponowne
  // kliknięcie po zamknięciu) LUB gdy sekcja faktycznie się zmienia (klik INNEGO żetonu
  // HUD, w tym zmiana wiersza w obrębie bloku „ekonomia", np. econ-skarbiec -> econ-praca).
  // Porównanie robimy PRZED nadpisaniem `activeSection` niżej. Przełącznik trybu widoku
  // Rankingu Mocy (wireMocViewButtons) NIE przechodzi przez tę funkcję — woła render()
  // bezpośrednio, więc ta flaga tam nigdy nie jest ustawiana (scroll zachowany, zgodnie
  // z rundą 1). / EN: reset scroll to top when this is NOT an ordinary re-render of the
  // same, already-open block — i.e. the panel was closed (fresh open, e.g. re-clicking
  // after closing) OR the section actually changes (a DIFFERENT HUD chip, including a row
  // change within the "ekonomia" block, e.g. econ-skarbiec -> econ-praca). Compared BEFORE
  // `activeSection` is overwritten below. The Power Ranking view toggle (wireMocViewButtons)
  // does NOT go through this function — it calls render() directly, so this flag is never
  // set there (scroll preserved, per round 1).
  if (!open || newSection !== activeSection) {
    resetScrollOnNextRender = true;
  }
  pendingScrollSection = newSection;
  activeSection = newSection;   // C-PANEL=B: zapamiętaj wybrany blok (pełny panel gdy brak)
  open = true;
  renderHeader();
  render();
  root!.classList.add('open');
  backdrop!.classList.add('open');
  // R-ESC-PELNY-EKRAN-Q1=A / P-MENU-ESCAPE-NIEPELNOEKRANOWE (Maciej 2026-08-14): panel imperium
  // nie był dotąd wpięty w stos overlayów — Escape ani nie zamykał panelu, ani nie był
  // blokowany przez Keyboard Lock, więc przebijał wprost do przeglądarki i wychodził
  // z pełnego ekranu. idempotentne wobec ponownych wywołań przy zmianie zakładki (ten sam id
  // trafia na wierzch stosu). / EN: the empire panel wasn't wired into the overlay stack —
  // Escape neither closed the panel nor was blocked by Keyboard Lock, so it fell straight
  // through to the browser and exited fullscreen. Idempotent across repeated calls when
  // switching tabs (same id just moves to the top of the stack).
  pushOverlay('empire-detail-panel', hideEmpireDetailPanel);
}

export function hideEmpireDetailPanel(): void {
  popOverlay('empire-detail-panel');
  open = false;
  pendingScrollSection = null;
  root?.classList.remove('open');
  backdrop?.classList.remove('open');
}

export function toggleEmpireDetailPanel(section?: string): void {
  if (open) hideEmpireDetailPanel();
  else showEmpireDetailPanel(section);
}

export function refreshEmpireDetailPanel(): void {
  if (open) {
    renderHeader();
    render();
  }
}

export function isEmpireDetailPanelOpen(): boolean {
  return open;
}
