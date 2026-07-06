/**
 * empireDetailPanel.ts — panel boczny imperium (HUD mapy): parametry + zasoby + kultura.
 */
import type { EmpireDetailSnap } from './empireDetailTypes';
import { mocLabel, mocWithValue } from './power-labels';

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
.civ-emp-panel{position:fixed;top:0;right:0;bottom:0;width:min(420px,94vw);z-index:450;
  background:linear-gradient(180deg,#1a2030 0%,#121820 100%);
  border-left:2px solid rgba(224,178,74,0.35);
  box-shadow:-8px 0 32px rgba(0,0,0,0.55);
  font:13px 'Segoe UI',Tahoma,sans-serif;color:#e8ebf0;
  display:flex;flex-direction:column;transform:translateX(100%);
  transition:transform .22s ease;pointer-events:none;}
.civ-emp-panel.open{transform:translateX(0);pointer-events:auto;}
.civ-emp-panel *{box-sizing:border-box;}
.civ-emp-hdr{padding:14px 16px 10px;border-bottom:1px solid rgba(224,178,74,0.2);
  background:rgba(224,178,74,0.05);flex-shrink:0;}
.civ-emp-hdr-top{display:flex;align-items:center;gap:10px;}
.civ-emp-civ-em{font-size:28px;line-height:1;}
.civ-emp-civ-name{font-size:17px;font-weight:700;color:#e0b24a;letter-spacing:.04em;}
.civ-emp-civ-sub{font-size:11px;color:#9aa6b6;margin-top:2px;}
.civ-emp-close{margin-left:auto;background:none;border:1px solid rgba(255,255,255,0.2);
  color:#9aa6b6;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:16px;line-height:1;}
.civ-emp-close:hover{color:#fff;border-color:rgba(224,178,74,0.5);}
.civ-emp-body{flex:1;overflow-y:auto;padding:12px 14px 20px;}
.civ-emp-body::-webkit-scrollbar{width:5px;}
.civ-emp-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:3px;}
.civ-emp-sect{margin-bottom:14px;scroll-margin-top:8px;}
.civ-emp-sect-h{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:#9aa6b6;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.08);}
.civ-emp-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.civ-emp-chip{background:rgba(255,255,255,0.04);border:1px solid rgba(224,178,74,0.15);
  border-radius:6px;padding:7px 9px;}
.civ-emp-chip .k{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#9aa6b6;}
.civ-emp-chip .v{font-size:13px;font-weight:600;color:#e8ebf0;margin-top:2px;}
.civ-emp-chip .v.gold{color:#e0b24a;}
.civ-emp-chip.wide{grid-column:1/-1;}
.civ-emp-bonus{font-size:12px;color:#b8c4d8;line-height:1.45;padding:6px 8px;
  border-left:2px solid rgba(90,155,212,0.5);margin-bottom:5px;background:rgba(255,255,255,0.02);}
.civ-emp-bonus .tag{font-size:9px;color:#7a8a9a;text-transform:uppercase;margin-left:6px;}
.civ-emp-econ-row{display:flex;align-items:center;gap:8px;padding:6px 4px;
  border-bottom:1px solid rgba(255,255,255,0.05);scroll-margin-top:8px;}
.civ-emp-econ-row .ic{font-size:16px;width:22px;text-align:center;}
.civ-emp-econ-row .lbl{flex:1;font-size:12px;color:#c8d0e0;}
.civ-emp-econ-row .stock{font-weight:700;font-size:13px;min-width:52px;text-align:right;}
.civ-emp-econ-row .rate{font-size:11px;color:#6bbf59;min-width:48px;text-align:right;}
.civ-emp-econ-row .rate.neg{color:#e07070;}
.civ-emp-econ-row .rate.z{color:#8a96a8;}
.civ-emp-kult-sum{font-size:12px;color:#c8b0e8;margin-bottom:8px;line-height:1.45;}
.civ-emp-kult-sum b{color:#e0c8ff;}
.civ-emp-kult-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px;}
.civ-emp-kult-table th,.civ-emp-kult-table td{padding:4px 6px;text-align:left;
  border-bottom:1px solid rgba(255,255,255,0.06);}
.civ-emp-econ-detail{margin:4px 0 10px 30px;}
.civ-emp-recruit-sum{font-size:12px;color:#c8d0e0;margin:8px 0 6px;line-height:1.45;}
.civ-emp-recruit-sum b{color:#e0b24a;}
.civ-emp-recruit-bar{height:10px;background:rgba(255,255,255,0.08);border-radius:5px;overflow:hidden;margin:0 0 10px;}
.civ-emp-recruit-bar .fill{height:100%;background:linear-gradient(90deg,#4a6820,#8bc34a);}
.civ-emp-recruit-bar .fill.warn{background:linear-gradient(90deg,#6a4010,#e0b24a);}
.civ-emp-recruit-bar .fill.low{background:linear-gradient(90deg,#5a2020,#e07070);}
.civ-emp-kult-note{font-size:11px;color:#9aa6b6;margin-top:8px;line-height:1.45;}
.civ-emp-kult-prog{font-size:11px;color:#c080e0;margin:6px 0 0;}
.civ-emp-pow-sum{font-size:14px;color:#e0b24a;font-weight:700;margin-bottom:8px;}
.civ-emp-pow-row{display:flex;align-items:center;gap:8px;margin:6px 0;}
.civ-emp-pow-row .lbl{flex:0 0 148px;font-size:12px;color:#c8d0e0;}
.civ-emp-pow-row .bar{flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;}
.civ-emp-pow-row .fill{height:100%;background:linear-gradient(90deg,#8a6418,#e0b24a);}
.civ-emp-pow-row .pts{flex:0 0 52px;text-align:right;font-size:11px;color:#9aa6b6;}
.civ-emp-pow-rank{font-size:12px;line-height:1.55;margin-top:8px;color:#c8d0e0;}
.civ-emp-pow-rank .you{color:#e0b24a;font-weight:600;}
.civ-emp-pow-resp{margin-top:8px;padding:8px;background:rgba(224,178,74,0.08);border-radius:6px;font-size:12px;}
.civ-emp-pow-table{width:100%;border-collapse:collapse;font-size:11px;margin:8px 0;}
.civ-emp-pow-table th,.civ-emp-pow-table td{padding:5px 6px;text-align:left;
  border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:top;}
.civ-emp-pow-table th{color:#9aa6b6;font-size:10px;text-transform:uppercase;letter-spacing:.06em;}
.civ-emp-pow-table .num{text-align:right;font-variant-numeric:tabular-nums;}
.civ-emp-pow-table .sum{font-weight:700;color:#e0b24a;}
.civ-emp-pow-table .note{font-size:10px;color:#7a8494;max-width:140px;line-height:1.35;}
.civ-emp-pow-total{font-size:12px;color:#c8d0e0;margin:6px 0 4px;}
.civ-emp-pow-total b{color:#e0b24a;}
.civ-emp-pobor{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;}
.civ-emp-pobor .box{background:rgba(255,255,255,0.04);border:1px solid rgba(224,178,74,0.18);
  border-radius:6px;padding:8px 10px;}
.civ-emp-pobor .box .k{font-size:9px;text-transform:uppercase;color:#9aa6b6;}
.civ-emp-pobor .box .v{font-size:15px;font-weight:700;color:#f4e6a8;margin-top:3px;}
.civ-emp-res-grid{display:flex;flex-direction:column;gap:4px;}
.civ-emp-res{display:grid;grid-template-columns:22px 1fr auto auto;gap:6px;align-items:center;
  padding:7px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);
  background:rgba(255,255,255,0.02);}
.civ-emp-res.off{opacity:.45;}
.civ-emp-res .nm{font-size:12px;font-weight:600;}
.civ-emp-res .sub{font-size:10px;color:#8a96a8;margin-top:1px;}
.civ-emp-res .st{font-weight:700;text-align:right;font-size:12px;}
.civ-emp-res .rt{font-size:10px;text-align:right;color:#6bbf59;}
.civ-emp-res .rt.z{color:#8a96a8;}
.civ-emp-hint{font-size:10px;color:#7a8494;line-height:1.45;margin-top:8px;font-style:italic;}
.civ-emp-empty{font-size:12px;color:#8a96a8;padding:8px 4px;}
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

function signed(n: number): string {
  if (n === 0) return '—';
  return (n > 0 ? '+' : '') + String(n);
}

function formatRawCount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function cityEconTableSkarbiec(rows: EmpireDetailSnap['cityEcon']): string {
  if (rows.length === 0) {
    return '<div class="civ-emp-empty">Brak miast — dochód pojawi się po założeniu osiedli.</div>';
  }
  let h = '<table class="civ-emp-kult-table"><tr><th>Miasto</th><th>💰 /t</th></tr>';
  for (const c of rows) {
    h += `<tr><td>${esc(c.name)}</td><td>${signed(c.pieniadz)}</td></tr>`;
  }
  h += '</table>';
  h += '<div class="civ-emp-hint">Suma wierszy = dochód miast. Utrzymanie budynków i wojska schodzi ze skarbca imperium osobno.</div>';
  return h;
}

function cityEconTablePraca(rows: EmpireDetailSnap['cityEcon']): string {
  if (rows.length === 0) {
    return '<div class="civ-emp-empty">Brak miast.</div>';
  }
  let h = '<table class="civ-emp-kult-table"><tr><th>Miasto</th><th>Do puli</th><th>Do budynków</th></tr>';
  for (const c of rows) {
    h += `<tr><td>${esc(c.name)}</td><td>${signed(c.pracaPula)}</td><td>${signed(c.pracaBudynki)}</td></tr>`;
  }
  h += '</table>';
  h += '<div class="civ-emp-hint">„Do puli” trafia do globalnej puli Pracy (górny pasek). „Do budynków” zasila kolejkę w mieście.</div>';
  return h;
}

function cityEconTableNauka(rows: EmpireDetailSnap['cityEcon']): string {
  if (rows.length === 0) {
    return '<div class="civ-emp-empty">Brak miast.</div>';
  }
  let h = '<table class="civ-emp-kult-table"><tr><th>Miasto</th><th>🦉 /t</th></tr>';
  for (const c of rows) {
    h += `<tr><td>${esc(c.name)}</td><td>${signed(c.nauka)}</td></tr>`;
  }
  h += '</table>';
  h += '<div class="civ-emp-hint">Nauka z miast trafia do banku badań. Hub badań — przycisk Nauka na lewym pasku.</div>';
  return h;
}

function cityPoborTableLudnosc(rows: EmpireDetailSnap['cityPobor']): string {
  if (rows.length === 0) {
    return '<div class="civ-emp-empty">Brak miast.</div>';
  }
  let h = '<table class="civ-emp-kult-table"><tr><th>Miasto</th><th>Ludki</th><th>Ludność abs.</th></tr>';
  for (const c of rows) {
    h += `<tr><td>${esc(c.name)}</td><td>${c.ludki}</td><td>${esc(c.ludnoscAbsLabel)}</td></tr>`;
  }
  h += '</table>';
  h += '<div class="civ-emp-hint">Ludki to mieszkańcy miasta (1–10). Ludność absolutna rośnie z epoką imperium.</div>';
  return h;
}

function cityPoborTableRekruci(
  rows: EmpireDetailSnap['cityPobor'],
  p: EmpireDetailSnap['power'],
): string {
  const pct = p.rekruciMax > 0 ? Math.round((p.rekruci / p.rekruciMax) * 100) : 0;
  const fillCls = pct >= 60 ? 'fill' : (pct >= 25 ? 'fill warn' : 'fill low');
  let h = `<div class="civ-emp-recruit-sum">Pula rekrutów imperium: <b>${esc(p.rekruciLabel)}</b> / `
    + `<b>${esc(p.rekruciMaxLabel)}</b> · można werbować: <b>${p.rekrutEkw}</b> jedn. `
    + `(koszt ${p.kosztJednostki} rekr./szt.) · wojsko na mapie: <b>${p.unitsOnMap}</b></div>`;
  h += `<div class="civ-emp-recruit-bar"><div class="${fillCls}" style="width:${pct}%"></div></div>`;
  if (rows.length === 0) {
    h += '<div class="civ-emp-empty">Brak miast.</div>';
    return h;
  }
  h += '<table class="civ-emp-kult-table"><tr><th>Miasto</th><th>Rekruci</th><th>Max</th><th>Odnowa/t</th></tr>';
  for (const c of rows) {
    h += `<tr><td>${esc(c.name)}</td><td>${c.rekruci}</td><td>${c.rekruciMax}</td>`
      + `<td>+${c.regenPerTurn}</td></tr>`;
  }
  h += '</table>';
  h += '<div class="civ-emp-hint">Werb jednostki zużywa rekrutów z puli miasta. Pasek = wypełnienie puli względem maksimum imperium.</div>';
  return h;
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

  const bonusHtml = g.bonusy.map(b =>
    `<div class="civ-emp-bonus">${esc(b.opis)}<span class="tag">${esc(b.realizuje)}</span></div>`,
  ).join('');

  type EconRow = { id: string; ic: string; lbl: string; stock: string; rate: number };
  const econRows: EconRow[] = [
    { id: 'zywnosc', ic: '🍞', lbl: 'Żywność armii (zapasy)', stock: e.zywnoscLabel + (e.zywnoscMax ? ` / ${e.zywnoscMax}` : ''), rate: e.zywnoscRate ?? 0 },
    { id: 'praca', ic: '🔨', lbl: 'Praca (pula)', stock: String(e.praca), rate: e.pracaRate },
    { id: 'skarbiec', ic: '💰', lbl: 'Skarbiec', stock: String(e.bogactwo), rate: e.bogactwoRate ?? 0 },
    { id: 'nauka', ic: '🦉', lbl: 'Bank nauki', stock: String(Math.floor(e.nauka)), rate: e.naukaRate ?? 0 },
    { id: 'kultura', ic: '🎭', lbl: 'Kultura (suma miast)', stock: String(e.kultura), rate: e.kulturaRate ?? 0 },
    { id: 'religia', ic: '🛕', lbl: 'Wierni religii', stock: String(e.religionStock ?? '—'), rate: e.religionRate ?? 0 },
    { id: 'ludnosc', ic: '👥', lbl: 'Ludność (ludki w miastach)', stock: String(e.ludnosc), rate: e.ludnoscRate ?? 0 },
    { id: 'rekruci', ic: '⚔', lbl: 'Rekruci (pula werbu)', stock: e.rekruciLabel ?? String(p.rekruci), rate: 0 },
  ];
  const econHtml = econRows.map(r => {
    const rtCls = r.rate === 0 ? 'rate z' : (r.rate < 0 ? 'rate neg' : 'rate');
    let detail = '';
    if (r.id === 'skarbiec') {
      detail = `<div class="civ-emp-econ-detail" data-section="econ-skarbiec">${cityEconTableSkarbiec(ce)}</div>`;
    } else if (r.id === 'praca') {
      detail = `<div class="civ-emp-econ-detail" data-section="econ-praca">${cityEconTablePraca(ce)}</div>`;
    } else if (r.id === 'nauka') {
      detail = `<div class="civ-emp-econ-detail" data-section="econ-nauka">${cityEconTableNauka(ce)}</div>`;
    } else if (r.id === 'ludnosc') {
      detail = `<div class="civ-emp-econ-detail" data-section="econ-ludnosc">${cityPoborTableLudnosc(cp)}</div>`;
    } else if (r.id === 'rekruci') {
      detail = `<div class="civ-emp-econ-detail" data-section="econ-rekruci">${cityPoborTableRekruci(cp, p)}</div>`;
    }
    return `<div class="civ-emp-econ-row" data-section="econ-${r.id}">`
      + `<span class="ic">${r.ic}</span><span class="lbl">${r.lbl}</span>`
      + `<span class="stock">${esc(r.stock)}</span>`
      + `<span class="${rtCls}">${signed(r.rate)}/t</span></div>${detail}`;
  }).join('');

  let kultHtml = `<div class="civ-emp-kult-sum">Imperium: <b>${k.total}</b> 🎭 · `
    + `<b>${signed(k.rate)}</b>/t · ${k.cities.length} miast</div>`;
  if (k.thresholds.length > 0) {
    kultHtml += `<div class="civ-emp-kult-note">Progi zasięgu w mieście: ${k.thresholds.join(' · ')} pkt</div>`;
  }
  if (k.nextThreshold != null && k.pctToNext != null) {
    kultHtml += `<div class="civ-emp-kult-prog">Najbliższy próg (${k.nextThreshold}): ${k.pctToNext}% (najsilniejsze miasto)</div>`;
  }
  kultHtml += `<div class="civ-emp-kult-note">${esc(k.happinessNote)}</div>`;
  kultHtml += '<table class="civ-emp-kult-table"><tr><th>Miasto</th><th>🎭</th><th>Zasięg</th></tr>';
  for (const c of k.cities) {
    kultHtml += `<tr><td>${esc(c.name)}</td><td>${c.kultura}</td><td>+${c.borderRadius} hex</td></tr>`;
  }
  kultHtml += '</table>';
  kultHtml += '<div class="civ-emp-hint">Szczegóły per miasto (źródła, progi) — panel miasta → zakładka Kultura. '
    + 'Przycisk 🎭 na toolbarze = zasięg na mapie.</div>';

  let powHtml = `<div class="civ-emp-pow-sum">⚜ ${esc(mocWithValue(p.power))}</div>`;
  powHtml += `<div class="civ-emp-pow-total">Suma składników: <b>${Math.round(p.powerBase)}</b> pkt `
    + `(kanon P-A · bez mnożnika epoki)</div>`;
  powHtml += `<div class="civ-emp-pobor">`
    + `<div class="box" data-section="econ-ludnosc"><div class="k">👥 Ludność</div>`
    + `<div class="v">${e.ludnosc} ludki · ${esc(p.ludnoscAbsLabel)} abs.</div></div>`
    + `<div class="box" data-section="econ-rekruci"><div class="k">⚔ Rekruci</div>`
    + `<div class="v">${esc(p.rekruciLabel)} / ${esc(p.rekruciMaxLabel)} · ${p.rekrutEkw} werb.</div></div></div>`;
  powHtml += '<table class="civ-emp-pow-table"><tr><th>Składnik</th><th class="num">Ilość</th>'
    + '<th class="num">× wsp.</th><th class="num">= pkt</th><th class="num">%</th><th>Skąd</th></tr>';
  for (const c of p.components) {
    powHtml += `<tr><td>${esc(c.label)}</td>`
      + `<td class="num">${formatRawCount(c.rawCount)}</td>`
      + `<td class="num">${c.weightPct}</td>`
      + `<td class="num sum">${Math.round(c.points)}</td>`
      + `<td class="num">${c.sharePct}%</td>`
      + `<td class="note">${esc(c.formulaNote ?? '—')}</td></tr>`;
  }
  powHtml += '</table>';
  powHtml += '<div class="civ-emp-hint">Respekt w dyplomacji = stosunek Twojej Mocy do Mocy rozmówcy (nie to samo co % udziału w tabeli).</div>';
  if (p.ranking.length > 0) {
    powHtml += `<div class="civ-emp-pow-rank"><b style="color:#e0b24a">Ranking ${esc(mocLabel())}</b><br>`;
    for (const r of p.ranking) {
      const cls = r.isPlayer ? ' class="you"' : '';
      powHtml += `<span${cls}>${r.isPlayer ? '▸ ' : '  '}#${r.rank} ${esc(r.civ)} — ${esc(mocWithValue(r.power))}</span><br>`;
    }
    powHtml += '</div>';
  }
  if (p.respektExample) {
    const ex = p.respektExample;
    powHtml += `<div class="civ-emp-pow-resp">Respekt wobec <b>${esc(ex.civ)}</b>: `
      + `${ex.respekt}% (Twoja ${esc(mocLabel().toLowerCase())} ${ex.playerPower} vs ${ex.theirPower})</div>`;
  }

  let resBlock = '';
  if (snap.resources.length > 0) {
    const resHtml = snap.resources.map(r => {
      const rt = r.ratePerTurn === 0
        ? '<span class="rt z">—</span>'
        : `<span class="rt">${signed(r.ratePerTurn)}/t</span>`;
      const sub = [r.typ, r.assigned, r.dostep ? '' : 'brak dostępu'].filter(Boolean).join(' · ');
      return `<div class="civ-emp-res${r.dostep ? '' : ' off'}">`
        + `<span>${r.icon}</span>`
        + `<div><div class="nm">${esc(r.label)}</div><div class="sub">${esc(sub)}</div></div>`
        + `<span class="st">${r.stock}</span>${rt}</div>`;
    }).join('');
    resBlock = `<div class="civ-emp-sect" data-section="surowce">`
      + `<div class="civ-emp-sect-h">Surowce strategiczne</div>`
      + `<div class="civ-emp-res-grid">${resHtml}</div></div>`;
  } else {
    resBlock = `<div class="civ-emp-sect" data-section="surowce">`
      + `<div class="civ-emp-sect-h">Surowce strategiczne</div>`
      + `<div class="civ-emp-empty">Magazyny surowców per miasto — w panelu miasta (stopka). `
      + `Tu pojawi się zbiorczy widok po podpięciu magazynów imperium.</div></div>`;
  }

  bodyEl.innerHTML =
    `<div class="civ-emp-sect"><div class="civ-emp-sect-h">Parametry globalne</div>`
    + `<div class="civ-emp-meta">`
    + `<div class="civ-emp-chip"><div class="k">Epoka</div><div class="v gold">${esc(e.epoka)}</div></div>`
    + `<div class="civ-emp-chip"><div class="k">Tura</div><div class="v">${e.tura}</div></div>`
    + `<div class="civ-emp-chip"><div class="k">Moc ⚜</div><div class="v gold">${e.power}</div></div>`
    + `<div class="civ-emp-chip"><div class="k">Osiedla</div><div class="v">${e.osiedla}/${e.osiedlaMax}</div></div>`
    + `<div class="civ-emp-chip wide"><div class="k">Religia państwowa</div><div class="v">${esc(g.religiaPanstwowa)}</div></div>`
    + `<div class="civ-emp-chip wide"><div class="k">Badania</div><div class="v">${esc(e.badana ?? '—')}</div></div>`
    + `<div class="civ-emp-chip wide"><div class="k">Bonus startowy</div><div class="v">${esc(g.bonusStartowy)}</div></div>`
    + `</div>${bonusHtml}</div>`
    + `<div class="civ-emp-sect" data-section="moc"><div class="civ-emp-sect-h">${esc(mocLabel())} imperium</div>${powHtml}</div>`
    + `<div class="civ-emp-sect" data-section="ekonomia"><div class="civ-emp-sect-h">Zasoby imperium (stan + /turę)</div>${econHtml}`
    + `<div class="civ-emp-hint">Klik w górnym pasek zasobów przewija do tabeli per miasto. Duża liczba = stan · zielone = netto / turę.</div></div>`
    + `<div class="civ-emp-sect" data-section="kultura"><div class="civ-emp-sect-h">Kultura imperium</div>${kultHtml}</div>`
    + resBlock;

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
    root.innerHTML = '<div class="civ-emp-hdr"><div class="civ-emp-hdr-top">'
      + '<span class="civ-emp-civ-em" data-civ-em></span>'
      + '<div><div class="civ-emp-civ-name" data-civ-name></div>'
      + '<div class="civ-emp-civ-sub" data-civ-sub></div></div>'
      + '<button type="button" class="civ-emp-close" data-close aria-label="Zamknij">✕</button>'
      + '</div></div><div class="civ-emp-body"></div>';
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

/** section: np. kultura, ekonomia, econ-skarbiec, econ-praca, econ-ludnosc */
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
