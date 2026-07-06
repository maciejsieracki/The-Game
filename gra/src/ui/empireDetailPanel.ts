/**
 * empireDetailPanel.ts — panel boczny imperium (HUD mapy): parametry + Moc + zasoby + kultura.
 * Wygląd: mockup „Panel Moc imperium v3" (1E, 2026-07-06) — RESKIN, nic nie usunięte.
 * Dane: EmpireDetailSnap.
 */
import type { EmpireDetailSnap } from './empireDetailTypes';
import { mocLabel, mocWithValue } from './power-labels';
import { brandIconSvg } from './icons/brandAssets';

export type { EmpireDetailSnap } from './empireDetailTypes';

const STYLE_ID = 'civ-empire-panel-css';
let root: HTMLDivElement | null = null;
let bodyEl: HTMLDivElement | null = null;
let getSnap: (() => EmpireDetailSnap) | null = null;
let open = false;
let pendingScrollSection: string | null = null;

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

function cityEconMiniSkarbiec(rows: EmpireDetailSnap['cityEcon']): string {
  if (rows.length === 0) return '<div class="civ-emp-empty">Brak miast — dochód pojawi się po założeniu osiedli.</div>';
  const grid = '1fr 1fr';
  let h = `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'PIENIĄDZ'], grid)}`;
  for (const c of rows) h += miniRow([esc(c.name), signedTxt(c.pieniadz)], grid);
  h += '</div><div class="civ-emp-foot">Suma wierszy = dochód miast. Utrzymanie budynków i wojska schodzi ze skarbca imperium osobno.</div>';
  return h;
}

function cityEconMiniPraca(rows: EmpireDetailSnap['cityEcon']): string {
  if (rows.length === 0) return '<div class="civ-emp-empty">Brak miast.</div>';
  const grid = '1fr 1fr 1fr';
  let h = `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'DO PULI', 'DO BUDYNKÓW'], grid)}`;
  for (const c of rows) h += miniRow([esc(c.name), signedTxt(c.pracaPula), signedTxt(c.pracaBudynki)], grid);
  h += '</div><div class="civ-emp-foot">„Do puli" trafia do globalnej puli Pracy (górny pasek). „Do budynków" zasila kolejkę w mieście.</div>';
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

function cityPoborMiniLudnosc(rows: EmpireDetailSnap['cityPobor']): string {
  if (rows.length === 0) return '<div class="civ-emp-empty">Brak miast.</div>';
  const grid = '1fr 1fr 1fr';
  let h = `<div class="civ-emp-mini">${miniHeader(['MIASTO', 'LUDKI', 'LUDNOŚĆ ABS.'], grid)}`;
  for (const c of rows) h += miniRow([esc(c.name), String(c.ludki), esc(c.ludnoscAbsLabel)], grid);
  h += '</div><div class="civ-emp-foot">Ludki to mieszkańcy miasta (1–10). Ludność absolutna rośnie z epoką imperium.</div>';
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
  h += '</div><div class="civ-emp-foot">Werb jednostki zużywa rekrutów z puli miasta. Pasek = wypełnienie puli względem maksimum imperium.</div>';
  return h;
}

function signedTxt(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '—';
  return (n > 0 ? '+' : '') + String(n);
}

function scrollToSection(section: string | null | undefined): void {
  if (!section || bodyEl === null) return;
  const target = bodyEl.querySelector(`[data-section="${section}"]`) as HTMLElement | null;
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    + `</div>${bonusHtml}</div>`;

  // — MOC IMPERIUM —
  let moc = `<div class="civ-emp-sect sep" data-section="moc">`
    + `<div class="civ-emp-eyebrow">${esc(mocLabel().toUpperCase())} IMPERIUM</div>`
    + `<div class="civ-emp-moc-big">${esc(mocWithValue(p.power))}</div>`
    + `<div class="civ-emp-moc-sub">Suma składników: <b>${Math.round(p.powerBase)}</b> pkt (kanon P‑A · bez mnożnika epoki)</div>`
    + `<div class="civ-emp-two">`
    + `<div class="civ-emp-box" data-section="econ-ludnosc"><div class="k">LUDNOŚĆ</div>`
    + `<div class="v">${e.ludnosc} ludki · ${esc(p.ludnoscAbsLabel)} abs.</div></div>`
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
    moc += `<div class="civ-emp-title" style="margin-top:12px">Ranking ${esc(mocLabel())}</div><div class="civ-emp-rank">`;
    for (const r of p.ranking) {
      if (r.isPlayer) {
        moc += `<div class="you">▸ #${r.rank} ${esc(r.civ)} — ${esc(mocWithValue(r.power))}</div>`;
      } else {
        moc += `#${r.rank} ${esc(r.civ)} — ${esc(mocWithValue(r.power))}<br>`;
      }
    }
    moc += `</div>`;
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
    { id: 'zywnosc', lbl: 'Żywność armii (zapasy)', stock: e.zywnoscLabel + (e.zywnoscMax ? ` / ${e.zywnoscMax}` : ''), rate: e.zywnoscRate ?? 0 },
    { id: 'praca', lbl: 'Praca (pula)', stock: String(e.praca), rate: e.pracaRate },
    { id: 'skarbiec', lbl: 'Skarbiec', stock: String(e.bogactwo), rate: e.bogactwoRate ?? 0 },
    { id: 'nauka', lbl: 'Bank nauki', stock: String(Math.floor(e.nauka)), rate: e.naukaRate ?? 0 },
    { id: 'kultura', lbl: 'Kultura (suma miast)', stock: String(e.kultura), rate: e.kulturaRate ?? 0 },
    { id: 'religia', lbl: 'Wierni religii', stock: String(e.religionStock ?? '—'), rate: e.religionRate ?? 0 },
    { id: 'ludnosc', lbl: 'Ludność (ludki w miastach)', stock: String(e.ludnosc), rate: e.ludnoscRate ?? 0, noRate: true },
    { id: 'rekruci', lbl: 'Rekruci (pula werbu)', stock: e.rekruciLabel ?? String(p.rekruci), rate: 0, gold: true, noRate: true },
  ];
  const detailFor: Record<string, string> = {
    skarbiec: cityEconMiniSkarbiec(ce),
    praca: cityEconMiniPraca(ce),
    nauka: cityEconMiniNauka(ce),
    ludnosc: cityPoborMiniLudnosc(cp),
    rekruci: cityPoborMiniRekruci(cp, p),
  };
  let zasoby = `<div class="civ-emp-sect sep" data-section="ekonomia">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:8px">ZASOBY IMPERIUM (STAN + PRZYROST)</div>`;
  for (const r of econRows) {
    const detail = detailFor[r.id];
    const val = r.noRate
      ? `<b${r.gold ? ' class="gold"' : ''}>${esc(r.stock)}</b>`
      : `<b>${esc(r.stock)}</b> ${deltaHtml(r.rate)}`;
    zasoby += `<div class="civ-emp-zrow${detail ? '' : ' brd'}" data-section="econ-${r.id}">`
      + `<span class="lbl">${r.lbl}</span><span class="val">${val}</span></div>`;
    if (detail) zasoby += `<div data-section="econ-${r.id}">${detail}</div>`;
  }
  zasoby += `<div class="civ-emp-foot">Klik w górnym pasku zasobów przewija do tabeli per miasto. Duża liczba = stan · zielone = netto.</div></div>`;

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

  // — SUROWCE STRATEGICZNE —
  let sur = `<div class="civ-emp-sect sep" data-section="surowce">`
    + `<div class="civ-emp-eyebrow" style="margin-bottom:10px">SUROWCE STRATEGICZNE</div>`;
  if (snap.resources.length > 0) {
    const grid = '22px 1fr auto auto';
    sur += `<div class="civ-emp-mini">`;
    for (const r of snap.resources) {
      const sub = [r.typ, r.assigned, r.dostep ? '' : 'brak dostępu'].filter(Boolean).join(' · ');
      const rt = r.ratePerTurn === 0 ? '—' : signedTxt(r.ratePerTurn);
      sur += miniRow([
        esc(r.icon),
        `<div style="color:${r.dostep ? '#e2e6ec' : '#6f7889'}">${esc(r.label)}</div>`
          + `<div style="font-size:10px;color:#6f7889">${esc(sub)}</div>`,
        `<span style="text-align:right;font-weight:700">${r.stock}</span>`,
        `<span style="text-align:right;color:#78c95a">${rt}</span>`,
      ], grid);
    }
    sur += `</div>`;
  } else {
    sur += `<div class="civ-emp-note" style="font-style:italic">Magazyny surowców per miasto — w panelu miasta (stopka). `
      + `Tu pojawi się zbiorczy widok po podpięciu magazynów imperium.</div>`;
  }
  sur += `</div>`;

  bodyEl.innerHTML = params + moc + zasoby + kult + sur;

  const scrollTarget = pendingScrollSection;
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
    case 'ludnosc': return 'econ-ludnosc';
    case 'rekruci': return 'econ-rekruci';
    case 'power':
    case 'moc': return 'moc';
    case 'nauka': return 'econ-nauka';
    case 'religia': return 'econ-religia';
    case 'empire': return 'ekonomia';
    default: return undefined;
  }
}
