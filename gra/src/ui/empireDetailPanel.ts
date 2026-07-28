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
import { formatObywateleLabel } from '../game/manpower';
import { mocLabel, mocWithValue } from './power-labels';
// Liczby do wyswietlenia bez smieci zmiennoprzecinkowych (Maciej 2026-07-26).
import { signedPl } from './formatPl';
import { brandIconSvg, mapResourceIconSvg } from './icons/brandAssets';
import { daninaLabelGenitive } from '../game/danina-nazwa';
import { HANDEL_PCT_STEP, adjustHandelSplit, normalizePodzialHandlu } from '../game/cities';
import type { CityPodzialHandlu } from '../game/cities';
export type { EmpireDetailSnap } from './empireDetailTypes';

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

const STYLE_ID = 'civ-empire-panel-css';
let root: HTMLDivElement | null = null;
let bodyEl: HTMLDivElement | null = null;
let getSnap: (() => EmpireDetailSnap) | null = null;
let open = false;
let pendingScrollSection: string | null = null;
/** C-PANEL=B (Maciej 2026-07-24): klik żetonu HUD otwiera panel z TYLKO jednym blokiem
 *  (żeby klik „Surowce" pokazywał magazyn, a nie całą ekonomię z Nauką). Trzymane między
 *  renderami (refresh nie resetuje widoku). null = pełny panel (wszystkie bloki). */
let activeSection: string | null = null;

/** Sekcja/żeton → który TOP-LEVEL blok panelu pokazać. 'all' = cały panel. */
function blockForSection(section: string | null): 'all' | 'parametry' | 'moc' | 'ekonomia' | 'kultura' | 'surowce' | 'spichlerz' | 'armia' | 'handel' {
  if (!section) return 'all';
  if (section === 'ekonomia') return 'all';
  if (section === 'armia') return 'armia';
  if (section === 'spichlerz') return 'spichlerz';
  if (section === 'surowce' || section.startsWith('econ-surowiec-')) return 'surowce';
  if (section === 'handel') return 'handel';                        // TEMAT 14 (Maciej 2026-07-24) — szlaki handlowe imperium
  if (section === 'kultura') return 'kultura';
  if (section === 'moc') return 'moc';
  if (section === 'parametry') return 'parametry';
  return 'ekonomia';                                                // skarbiec/praca/nauka/zywnosc/religia/ludnosc/rekruci → filtr do własnego wiersza
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
.civ-emp-hdr-ic{flex:none;width:34px;height:34px;border-radius:8px;background:#1d2634;
  display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;}
.civ-emp-hdr-tx{flex:1;min-width:0;}
.civ-emp-civ-name{font-size:18px;font-weight:700;color:#e8ebf0;line-height:1.1;}
.civ-emp-civ-sub{font-size:11.5px;color:#8a93a4;margin-top:3px;}
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
.civ-emp-mini-h,.civ-emp-mini-r{display:grid;padding:7px 10px;}
.civ-emp-mini-h{font-size:10px;letter-spacing:0.5px;color:#7d8798;font-weight:600;background:#1a2230;}
.civ-emp-mini-r{font-size:12px;color:#cfd5de;}
.civ-emp-mini-r+.civ-emp-mini-r{border-top:1px solid #1f2733;}
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
.civ-emp-res-eyebrow-row{display:flex;justify-content:space-between;align-items:baseline;
  flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.civ-emp-res-cap-sub{font-size:11px;color:#7d8798;}
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
.civ-emp-res-amt .flag{margin-left:auto;font-size:9.5px;letter-spacing:.03em;text-transform:uppercase;
  font-weight:700;}
.civ-emp-res-amt .flag.warn{color:#d9a441;}
.civ-emp-res-amt .flag.bad{color:#e07a7a;}
.civ-emp-res-bar{height:6px;border-radius:999px;background:#1f2733;overflow:hidden;}
.civ-emp-res-bar>span{display:block;height:100%;border-radius:999px;}
.civ-emp-res-bar.good>span{background:linear-gradient(90deg,#4e9a3f,#78c95a);}
.civ-emp-res-bar.warn>span{background:linear-gradient(90deg,#6a4010,#d9a441);}
.civ-emp-res-bar.bad>span{background:linear-gradient(90deg,#5a2020,#e07a7a);}
.civ-emp-res-access-row{display:flex;gap:8px;flex-wrap:wrap;}
.civ-emp-res-acc{display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:8px;
  border:1px solid #2b3543;background:#171e2a;min-width:120px;flex:1 1 auto;}
.civ-emp-res-acc .ic{flex:none;width:16px;height:16px;display:flex;align-items:center;
  justify-content:center;color:#cfd5de;}
.civ-emp-res-acc .ic svg{width:100%;height:100%;display:block;}
.civ-emp-res-acc .dot{width:8px;height:8px;border-radius:50%;flex:none;}
.civ-emp-res-acc.on .dot{background:#78c95a;box-shadow:0 0 6px #78c95a;}
.civ-emp-res-acc.off .dot{background:#e07a7a;}
.civ-emp-res-acc .nm-wrap{min-width:0;display:flex;flex-direction:column;gap:1px;}
.civ-emp-res-acc .nm{font-size:12.5px;font-weight:600;color:#e2e6ec;}
.civ-emp-res-acc .src{font-size:10px;color:#7d8798;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-emp-res-acc .st{margin-left:auto;flex:none;font-size:10px;letter-spacing:.03em;text-transform:uppercase;
  font-weight:700;}
.civ-emp-res-acc.on .st{color:#78c95a;}
.civ-emp-res-acc.off .st{color:#e07a7a;}
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

function miniHeader(cols: string[], grid: string): string {
  const cells = cols.map(c => `<div>${c}</div>`).join('');
  return `<div class="civ-emp-mini-h" style="grid-template-columns:${grid}">${cells}</div>`;
}

function miniRow(cells: string[], grid: string): string {
  const c = cells.map(x => `<div>${x}</div>`).join('');
  return `<div class="civ-emp-mini-r" style="grid-template-columns:${grid}">${c}</div>`;
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
  const utrzJ = economy.bogactwoUtrzymanieJednostek ?? 0;
  const netto = economy.bogactwoRate ?? 0;

  const sumGrid = '1fr auto';
  let h = '<div class="civ-emp-mini">';
  h += miniHeader(['SKARBIEC IMPERIUM — bilans / turę', ''], sumGrid);
  h += miniRow(['Wpływy brutto (podatek + budynki)', signedTxt(daninaBud)], sumGrid);
  h += miniRow(['Handel ze szlaków', signedTxt(handel)], sumGrid);
  h += miniRow(['Utrzymanie budynków', signedTxt(-utrzB)], sumGrid);
  h += miniRow(['Utrzymanie jednostek', signedTxt(-utrzJ)], sumGrid);
  h += miniRow(['<b>Netto skarbiec</b>', `<b>${signedTxt(netto)}</b>`], sumGrid);
  h += '</div>';

  const grid = '1fr 0.7fr 0.9fr';
  h += `<div class="civ-emp-mini" style="margin-top:8px">${miniHeader(['MIASTO', 'DO SKARBCA', 'UTRZYMANIE'], grid)}`;
  for (const c of rows) {
    h += miniRow([
      esc(c.name),
      signedTxt(c.pieniadz),
      c.utrzymanieBudynkow ? signedTxt(-c.utrzymanieBudynkow) : '—',
    ], grid);
  }
  h += '</div>';
  h += '<div class="civ-emp-foot">„Do skarbca" = wpływ miasta po suwakach (Skarb %). Utrzymanie budynków i wojska schodzi ze skarbca imperium — suma w bilansie u góry. Jednostki na mapie = koszt imperium, nie per miasto w tabeli.</div>';
  return h;
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

function cityMiastaMiniDetail(
  ce: EmpireDetailSnap['cityEcon'],
  cp: EmpireDetailSnap['cityPobor'],
  food: EmpireFoodSnap,
  e: EmpireDetailSnap['economy'],
): string {
  if (cp.length === 0) {
    return '<div class="civ-emp-empty">Brak miast — załóż osiedle na mapie.</div>';
  }
  const foodByName = new Map(food.perCityRows.map(r => [r.name, r]));
  const grid = '1.05fr 0.45fr 0.75fr 0.55fr 0.55fr 0.6fr 0.6fr';
  let h = `<div class="civ-emp-note">Miasta imperium: <b>${e.osiedla}</b>`
    + ` · przyrost ludności łącznie: <b>${signedPl(e.ludnoscRate ?? 0)}</b> obyw./turę</div>`;
  h += `<div class="civ-emp-mini">${miniHeader(
    ['MIASTO', 'OBYW.', 'LUDNOŚĆ', 'WZROST', 'PRACA', 'PIENIĄDZ', 'ŻYWNOŚĆ'],
    grid,
  )}`;
  for (const pob of cp) {
    const econ = ce.find(c => c.name === pob.name);
    const fd = foodByName.get(pob.name);
    const praca = (econ?.pracaPula ?? 0) + (econ?.pracaBudynki ?? 0);
    const wzrost = fd != null ? `${Math.round(fd.wzrostProcent)}%` : '—';
    const zywnosc = fd != null ? foodSignedTxt(fd.bilans, true) : '—';
    h += miniRow([
      esc(pob.name),
      String(pob.ludki),
      esc(pob.ludnoscAbsLabel),
      wzrost,
      signedTxt(praca),
      signedTxt(econ?.pieniadz ?? 0),
      zywnosc,
    ], grid);
  }
  h += '</div>';
  h += '<div class="civ-emp-foot">'
    + 'PRACA = suma do puli imperium i do budynków w mieście / turę · '
    + 'PIENIĄDZ = wpływ netto do skarbca po suwakach · '
    + 'ŻYWNOŚĆ = bilans lokalny miasta (produkcja − racje) · '
    + 'WZROST = szacowany % wzrostu ludności (szczegóły w panelu miasta).</div>';
  return h;
}

function cityPoborMiniRekruci(
  rows: EmpireDetailSnap['cityPobor'],
  p: EmpireDetailSnap['power'],
): string {
  const pct = p.rekruciMax > 0 ? Math.round((p.rekruci / p.rekruciMax) * 100) : 0;
  const fillCls = pct >= 60 ? 'fill' : (pct >= 25 ? 'fill warn' : 'fill low');
  let h = `<div class="civ-emp-note">Pula rekrutów imperium: <b style="color:#d9a441">${esc(p.rekruciLabel)}</b> / `
    + `<b style="color:#d9a441">${esc(p.rekruciMaxLabel)}</b> · można werbować: <b>${p.rekrutEkw}</b> jedn. `
    + `(koszt ${p.kosztJednostki} rekr./szt.) · wojsko na mapie: <b>${p.unitsOnMap}</b></div>`;
  h += `<div class="civ-emp-bar"><div class="${fillCls}" style="width:${pct}%"></div></div>`;
  if (rows.length === 0) {
    h += '<div class="civ-emp-empty">Brak miast.</div>';
    return h;
  }
  const grid = '1fr 1fr 0.8fr 0.9fr';
  h += `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'REKRUCI', 'MAX', 'ODNOWA'], grid)}`;
  for (const c of rows) {
    h += miniRow([esc(c.name), String(c.rekruci), String(c.rekruciMax),
      `<span style="color:#78c95a">+${c.regenPerTurn}</span>`], grid);
  }
  h += '</div><div class="civ-emp-foot">Werb jednostki zużywa rekrutów z puli całej cywilizacji (suma miast). Pasek = wypełnienie puli względem maksimum imperium.</div>';
  return h;
}

function signedTxt(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '—';
  return signedPl(n);
}

/** PYTANIE-85 — wartość żywności z emoji 🍞 (np. „+72 🍞", „−48 🍞"). */
function foodSignedTxt(n: number, forceSign = true): string {
  if (!Number.isFinite(n)) return '—';
  const r = Math.round(n);
  if (r === 0) return '0 🍞';
  if (!forceSign) return `${r} 🍞`;
  return `${r > 0 ? '+' : ''}${r} 🍞`;
}

/** PYTANIE-85 — wiersz podsumowania tury Spichlerza centralnego. */
function foodSummaryRow(label: string, value: number, opts?: { expense?: boolean; pool?: boolean }): string {
  const cls = value > 0 ? 'pos' : value < 0 ? 'neg' : 'z';
  let display: string;
  if (opts?.expense) {
    display = `−${Math.abs(Math.round(value))} 🍞`;
  } else if (opts?.pool) {
    display = `+${Math.round(value)} 🍞`;
  } else {
    display = foodSignedTxt(value);
  }
  return `<div class="civ-emp-zrow brd" style="padding:6px 0">`
    + `<span class="lbl">${esc(label)}</span>`
    + `<span class="val"><span class="d ${cls}">${display}</span></span></div>`;
}

/**
 * PYTANIE-85 — Spichlerz centralny: nagłówek magazynu, podsumowanie tury
 * (kanoniczne etykiety) + tabela miast.
 */
function renderSpichlerzCentralnySection(food: EmpireFoodSnap): string {
  const capPart = food.maxCap > 0 ? ` / ${food.maxCap}` : '';
  const pct = food.maxCap > 0
    ? Math.max(0, Math.min(100, Math.round((food.zapasy / food.maxCap) * 100)))
    : 0;
  const barCls = food.zapasy < 0 ? 'low' : (pct >= 95 ? 'warn' : 'fill');

  let h = `<div class="civ-emp-sect" data-section="spichlerz-centralny">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:6px">SPICHLERZ CENTRALNY</div>`
    + `<div class="civ-emp-kult-line" style="font-size:14px;margin-bottom:6px">`
    + `W magazynie: <b>${food.zapasy}${capPart} 🍞</b></div>`;
  if (food.maxCap > 0) {
    h += `<div class="civ-emp-bar"><div class="${barCls}" style="width:${pct}%"></div></div>`;
  }
  if (food.glodWojska) {
    h += `<div class="civ-emp-note" style="color:#e07a7a;margin-bottom:8px">`
      + `<b>Głód wojska</b> — magazyn centralny na minusie po koszcie armii.</div>`;
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
    h += foodSummaryRow('Przyrost zapasów', t.przyrostZapasow);
  } else {
    h += `<div class="civ-emp-note" style="margin-top:10px;font-style:italic">`
      + `Podsumowanie tury pojawi się po zakończeniu pierwszej tury.</div>`;
  }

  if (food.perCityRows.length > 0) {
    const grid = '1.1fr 0.7fr 0.8fr 0.65fr 0.6fr';
    h += `<div class="civ-emp-res-lbl" style="margin-top:14px">Miasta</div>`;
    h += `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'PRODUKCJA', 'KOSZT RACJI', 'BILANS', 'WZROST%'], grid)}`;
    for (const row of food.perCityRows) {
      const bilansCls = row.bilans > 0 ? 'pos' : row.bilans < 0 ? 'neg' : 'z';
      const bilansTxt = row.bilans === 0 ? '0' : `${row.bilans > 0 ? '+' : ''}${Math.round(row.bilans)}`;
      const wzrostTxt = `${Math.round(row.wzrostProcent)}%`;
      const fedMark = row.nakarmione === false ? ' <span style="color:#e07a7a" title="Miasto nie nakarmione z centrali">⚠</span>' : '';
      h += miniRow([
        esc(row.name) + fedMark,
        String(Math.round(row.produkcja)),
        String(Math.round(row.kosztRacji)),
        `<span class="d ${bilansCls}">${bilansTxt}</span>`,
        wzrostTxt,
      ], grid);
    }
    h += `</div>`;
  }

  h += `<div class="civ-emp-foot">Magazyn centralny: nadwyżki miast trafiają do puli, niedobory są pokrywane stamtąd. `
    + `Kolejność: dopłaty do miast → wojsko → zmiana zapasów. Wzrost ludności zależy od racji i bonusów lokalnych — nie z nadwyżki centralnej.</div>`;
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

/** Karta pojedynczego surowca magazynowanego (pasek zapełnienia stock/cap). */
function resCardHtml(r: EmpireResourceRow): string {
  const cap = r.cap ?? 0;
  const pct = cap > 0 ? Math.max(0, Math.min(100, Math.round((r.stock / cap) * 100))) : 0;
  const state = resStateOf(r);
  const flag = state === 'bad' ? 'spada' : (state === 'warn' ? 'pełny' : '');
  return `<div class="civ-emp-res-card ${state}" data-section="econ-surowiec-${esc(r.id)}" title="${resTooltipHtml(r)}">`
    + `<div class="civ-emp-res-top"><span class="civ-emp-res-ic">${resIconHtml(r.label)}</span>`
    + `<div class="civ-emp-res-nm"><div class="nm">${esc(r.label)}</div></div>`
    + resRateHtml(r, state) + `</div>`
    + `<div class="civ-emp-res-amt"><span class="cur">${r.stock}</span><span class="cap">/ ${cap}</span>`
    + (flag ? `<span class="flag ${state}">${esc(flag)}</span>` : '')
    + `</div>`
    + `<div class="civ-emp-res-bar ${state}"><span style="width:${pct}%"></span></div>`
    + `</div>`;
}

/**
 * Wiersz dostępu (boolean) — surowce nie magazynowane (dziś: brak w katalogu).
 * Zachowane na wypadek przyszłych surowców „tylko dostęp".
 * (nawet gdy dostep=false — "masz"/"brak"), a gdy źródło jest znane (r.zrodlo — własne
 * złoże/budynek albo szlak handlowy) pokazujemy je jako podpis pod nazwą surowca.
 */
function resAccessHtml(r: EmpireResourceRow): string {
  const cls = r.dostep ? 'on' : 'off';
  const zrodloHtml = r.dostep && r.zrodlo
    ? `<div class="src">${esc(r.zrodlo)}</div>`
    : '';
  return `<div class="civ-emp-res-acc ${cls}" data-section="econ-surowiec-${esc(r.id)}" title="${resTooltipHtml(r)}">`
    + `<span class="dot"></span><span class="ic">${resIconHtml(r.label, 16)}</span>`
    + `<div class="nm-wrap"><div class="nm">${esc(r.label)}</div>${zrodloHtml}</div>`
    + `<span class="st">${r.dostep ? 'masz' : 'brak'}</span></div>`;
}

/** Sekcja SUROWCE (magazyn państwa) — mockup „Magazyn surowców" (Maciej 2026-07-24). */
function renderSurowceSection(rows: EmpireResourceRow[]): string {
  let sur = `<div class="civ-emp-sect sep" data-section="surowce">`;
  if (rows.length === 0) {
    sur += `<div class="civ-emp-eyebrow" style="margin-bottom:10px">MAGAZYN PAŃSTWA</div>`
      + `<div class="civ-emp-note" style="font-style:italic">Magazyny surowców per miasto — w panelu miasta (stopka). `
      + `Tu pojawi się zbiorczy widok po podpięciu magazynów imperium.</div></div>`;
    return sur;
  }

  const stored = rows.filter(r => r.cap != null);
  const access = rows.filter(r => r.cap == null);
  const cap = stored[0]?.cap ?? 0;
  const capBase = stored[0]?.capBase;
  const capBonus = stored[0]?.capBonusPerMagazyn;
  // SUROW-UI-A1: liczba Magazynów wyliczona z REALNEJ bazy/bonusu (econ-params.json),
  // nie z zaszytej na sztywno starej wartości 100 — baza dziś to 500 (Maciej 2026-07-24).
  const magazyny = (capBase != null && capBonus != null && capBonus > 0 && cap > capBase)
    ? Math.round((cap - capBase) / capBonus)
    : 0;
  const magSlowo = magazyny === 1 ? 'Magazyn' : (magazyny >= 2 && magazyny <= 4 ? 'Magazyny' : 'Magazynów');

  sur += `<div class="civ-emp-res-eyebrow-row">`
    + `<span class="civ-emp-eyebrow">MAGAZYN PAŃSTWA${cap > 0 ? ` · pojemność ${cap}/typ` : ''}</span>`
    + (cap > 0 && capBase != null && capBonus != null
      ? `<span class="civ-emp-res-cap-sub">${capBase} baza + ${capBonus} × ${magazyny} ${magSlowo} · nadmiar przepada</span>`
      : '')
    + `</div>`;

  if (stored.length > 0) {
    sur += `<div class="civ-emp-res-lbl">Magazynowane — wspólne dla całego imperium</div>`
      + `<div class="civ-emp-res-grid">${stored.map(resCardHtml).join('')}</div>`;
  }

  if (access.length > 0) {
    // ZGŁOSZENIE (Maciej 2026-07-26): podsekcja osobna od magazynu, zawsze widoczna
    // (także gdy owner nie ma dostępu do żadnego z tych surowców — kafelek pokazuje
    // wtedy "brak", nie znika) + krótkie wyjaśnienie różnicy wobec magazynu powyżej.
    sur += `<div class="civ-emp-res-lbl">Dostęp — nie magazynowane</div>`
      + `<div class="civ-emp-note" style="margin:-2px 0 8px;font-size:11.5px">`
      + `Te surowce nie gromadzą się w magazynie państwa — liczy się tylko, czy imperium ma do nich dostęp `
      + `(własne złoże/budynek albo szlak handlowy). „Brak" = jeszcze nieodblokowane, nie błąd.</div>`
      + `<div class="civ-emp-res-access-row">${access.map(resAccessHtml).join('')}</div>`;
  }

  sur += `<div class="civ-emp-res-foodnote"><span class="k">Żywność</span>`
    + `<span>ma osobny <b>magazyn centralny</b> — chip HUD „Spichlerz" · panel Spichlerz centralny. `
    + `Nie wchodzi do wspólnej puli surowców powyżej.</span></div>`;

  sur += `<div class="civ-emp-res-legend">`
    + `<span><i class="good"></i> nadwyżka / rośnie</span>`
    + `<span><i class="warn"></i> na cap — nadmiar przepada</span>`
    + `<span><i class="bad"></i> niedobór / spada</span>`
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
 */
function renderHandelSection(t: EmpireDetailSnap['trade']): string {
  let h = `<div class="civ-emp-sect sep" data-section="handel">`
    + `<div class="civ-emp-title">Handel — szlaki handlowe</div>`
    + `<div class="civ-emp-kult-line">Dochód z tras: <b class="gold">+${t.totalIncome}</b>/turę · `
    + `${t.routes.length} ${routeCountWord(t.routes.length)} aktywnych</div>`;

  if (t.routes.length > 0) {
    const grid = '1.1fr 1.2fr 1fr 0.7fr';
    h += `<div class="civ-emp-mini">${miniHeader(['TWOJE MIASTO', 'PARTNER', 'MEDIUM · DYSTANS', 'DOCHÓD/TURĘ'], grid)}`;
    for (const r of t.routes) {
      h += miniRow([
        esc(r.cityName),
        `${esc(r.partnerCityName)} (${esc(r.partnerOwnerLabel)})`,
        `${r.medium === 'morze' ? 'Morze' : 'Ląd'} · ${r.dystans} heks.`,
        `+${r.income}`,
      ], grid);
    }
    h += `</div>`;
  } else {
    h += `<div class="civ-emp-note" style="font-style:italic">Brak aktywnych tras handlowych. Wymagany: budynek handlowy `
      + `(Targowisko/Port) w mieście + zawarta Umowa Handlowa z obcą cywilizacją w zasięgu (bez wojny).</div>`;
  }

  // DYSPOZYCJA 85 (Maciej 2026-07-26): bonus cudów świata "handel_procent" (Petra,
  // Kamień Ha'amonga, Kolos Rodyjski, Brama wszystkich narodów, Pałac Weiyang) —
  // już wliczony w dochód powyżej (CUDA-HANDEL-01), tu tylko pokazany jako czynnik.
  if (t.wonderBonusLadPct > 0 || t.wonderBonusMorzePct > 0) {
    h += `<div class="civ-emp-kult-line">Bonus cudów świata: `
      + `<b class="gold">+${t.wonderBonusLadPct}%</b> ląd`
      + (t.wonderBonusMorzePct !== t.wonderBonusLadPct ? ` · <b class="gold">+${t.wonderBonusMorzePct}%</b> morze` : '')
      + ` (już wliczone w dochód tras powyżej)</div>`;
  }

  // DYSPOZYCJA 85: surowce, do których gracz ma dostęp DZIĘKI aktywnej trasie
  // handlowej — zebrane tu (panel Handel = handel międzynarodowy i tylko on),
  // USUNIĘTE z panelu miasta (tam było 🔗/tradeSources per surowiec).
  if (t.resourceGrants.length > 0) {
    h += `<div class="civ-emp-res-lbl" style="margin-top:10px">Surowce z wymiany handlowej</div>`;
    const grid2 = '1fr 1fr';
    h += `<div class="civ-emp-mini">${miniHeader(['SUROWIEC', 'PARTNER'], grid2)}`;
    for (const g of t.resourceGrants) {
      h += miniRow([esc(g.label), esc(g.partnerLabel)], grid2);
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
    + `<div class="civ-emp-chip"><div class="k">Moc ⚜</div><div class="v gold">${e.power}</div></div>`
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
    moc += `<div class="civ-emp-title" style="margin-top:12px">Ranking ${esc(mocLabel())}</div>`;
    moc += `<div class="civ-emp-rank">`;
    for (const r of p.ranking) {
      if (r.isPlayer) {
        moc += `<div class="you">▸ #${r.rank} ${esc(r.civ)} — ${esc(mocWithValue(r.power))}</div>`;
      } else {
        moc += `#${r.rank} ${esc(r.civ)} — ${esc(mocWithValue(r.power))}<br>`;
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
    miasta: cityMiastaMiniDetail(ce, cp, snap.food, e),
    ludnosc: cityMiastaMiniDetail(ce, cp, snap.food, e),
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
    const val = r.noRate
      ? `<b${r.gold ? ' class="gold"' : ''}>${esc(r.stock)}</b>`
      : `<b>${esc(r.stock)}</b> ${deltaHtml(r.rate)}`;
    zasoby += `<div class="civ-emp-zrow${detail ? '' : ' brd'}" data-section="econ-${r.id}">`
      + `<span class="lbl">${r.lbl}</span><span class="val">${val}</span></div>`;
    if (detail) zasoby += `<div data-section="econ-${r.id}">${detail}</div>`;
  }
  if (!onlyEconId) zasoby += renderDefaultHandelSplitSection();
  zasoby += `<div class="civ-emp-foot">Klik w górnym pasku zasobów przewija do tabeli per miasto. Duża liczba = stan · zielone = netto.</div></div>`;

  // — SPICHLERZ (Maciej 2026-07-28) — magazyn centralny żywności, bez wojska.
  const spichlerz = renderSpichlerzCentralnySection(snap.food)
    .replace('data-section="spichlerz-centralny"', 'data-section="spichlerz"')
    .replace('class="civ-emp-sect"', 'class="civ-emp-sect sep"');

  // — ARMIA — wojsko + rekruci; żywność tylko skrót zaopatrzenia (reszta w Spichlerzu).
  const kosztWojska = Math.round(e.zywnoscKosztWojska ?? 0);
  const maxZywnPart = e.zywnoscMax != null && e.zywnoscMax > 0 ? ` / ${e.zywnoscMax}` : '';
  let armia = `<div class="civ-emp-sect sep" data-section="armia">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:8px">ARMIA</div>`
    + `<div class="civ-emp-zrow brd"><span class="lbl">Wojsko na mapie</span>`
    + `<span class="val"><b>${p.unitsOnMap}</b> jednostek</span></div>`;
  const rekrRow = econRows.find(r => r.id === 'rekruci');
  if (rekrRow) {
    armia += `<div class="civ-emp-zrow brd" data-section="econ-rekruci">`
      + `<span class="lbl">${rekrRow.lbl}</span>`
      + `<span class="val"><b class="gold">${esc(rekrRow.stock)}</b></span></div>`;
    armia += `<div data-section="econ-rekruci">${detailFor.rekruci}</div>`;
  }
  armia += `<div class="civ-emp-res-lbl" style="margin-top:12px">Zaopatrzenie wojska</div>`
    + `<div class="civ-emp-note">Koszt żywności armii: <b>−${kosztWojska} 🍞</b>/turę`
    + ` · W magazynie państwa: <b>${esc(e.zywnoscLabel)}${maxZywnPart} 🍞</b></div>`;
  if (e.glodWojska) {
    armia += `<div class="civ-emp-note" style="color:#e07a7a"><b>Głód wojska</b> — uzupełnij Spichlerz centralny.</div>`;
  } else if (e.zywnoscKarencjaZaTur != null && e.zywnoscKarencjaZaTur > 0) {
    armia += `<div class="civ-emp-note" style="color:#e8c84a">Głód wojska za ${e.zywnoscKarencjaZaTur} tur — magazyn ujemny.</div>`;
  }
  if (uchwaly.length > 0) {
    armia += renderUchwalyHtml(uchwaly);
  }
  armia += `<div class="civ-emp-foot">Pełna bilans żywności imperium — przycisk Spichlerz na lewym pasku. Ludność miast — zakładka Ludność.</div></div>`;

  // — KULTURA IMPERIUM —
  let kult = `<div class="civ-emp-sect sep" data-section="kultura">`
    + `<div class="civ-emp-title">Kultura imperium</div>`
    + `<div class="civ-emp-kult-line">Imperium: <b>${k.total}</b> · ${signedTxt(k.rate)} · ${k.cities.length} miast</div>`;
  if (k.thresholds.length > 0) {
    kult += `<div class="civ-emp-kult-line muted">Progi zasięgu w mieście: ${k.thresholds.join(' · ')} pkt</div>`;
  }
  if (k.nextThreshold != null && k.pctToNext != null) {
    kult += `<div class="civ-emp-kult-line gold">Najbliższy próg (${k.nextThreshold}): ${k.pctToNext}% (najsilniejsze miasto)</div>`;
  }
  kult += `<div class="civ-emp-note" style="font-style:italic">${esc(k.happinessNote)}</div>`;
  if (k.cities.length > 0) {
    const grid = '1fr 1fr 1fr';
    kult += `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'KULTURA', 'ZASIĘG'], grid)}`;
    for (const c of k.cities) kult += miniRow([esc(c.name), String(c.kultura), `+${c.borderRadius} hex`], grid);
    kult += `</div>`;
  }
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
  if (block === 'spichlerz') body += spichlerz;
  if (block === 'armia') body += armia;
  if (block === 'all' || block === 'kultura') body += kult;
  if (block === 'all' || block === 'surowce') body += sur;
  if (block === 'all' || block === 'handel') body += handel;
  bodyEl.innerHTML = body;

  // Scroll do podsekcji ma sens tylko w pełnym widoku; przy pojedynczym bloku i tak widać całość.
  const scrollTarget = block === 'all' ? pendingScrollSection : null;
  pendingScrollSection = null;
  if (scrollTarget) {
    requestAnimationFrame(() => scrollToSection(scrollTarget));
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
  const nm = root.querySelector('[data-civ-name]');
  const sub = root.querySelector('[data-civ-sub]');
  if (em) em.textContent = g.civEmoji;
  if (nm) nm.textContent = g.civName;
  if (sub) sub.textContent = `${g.styl} · ${g.jednostkaSpec}`;
}

/** Montuje panel; getSnap wywoływany przy każdym renderze. */
export function mountEmpireDetailPanel(snapFn: () => EmpireDetailSnap): void {
  getSnap = snapFn;
  ensureDom();
}

/** section: np. parametry, moc, ekonomia, econ-skarbiec, econ-praca, econ-ludnosc, kultura, surowce */
export function showEmpireDetailPanel(section?: string): void {
  ensureDom();
  pendingScrollSection = section ?? null;
  activeSection = section ?? null;   // C-PANEL=B: zapamiętaj wybrany blok (pełny panel gdy brak)
  open = true;
  renderHeader();
  render();
  root!.classList.add('open');
  backdrop!.classList.add('open');
}

export function hideEmpireDetailPanel(): void {
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

/** Mapowanie data-act z chipów HUD → sekcja panelu. */
export function empireSectionFromHudAct(act: string): string | undefined {
  switch (act) {
    case 'skarbiec': return 'econ-skarbiec';
    case 'praca': return 'econ-praca';
    case 'kultura': return 'kultura';
    case 'miasta':
    case 'ludnosc': return 'econ-miasta';
    case 'rekruci': return 'econ-rekruci';
    case 'power':
    case 'moc': return 'moc';
    case 'nauka': return 'econ-nauka';
    case 'zywnosc':
    case 'spichlerz': return 'spichlerz';
    case 'armia': return 'armia';
    case 'religia': return 'econ-religia';
    case 'empire': return 'ekonomia';
    case 'surowce': return 'surowce';
    case 'handel': return 'handel';
    default: return undefined;
  }
}
