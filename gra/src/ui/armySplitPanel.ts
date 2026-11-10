/**
 * armySplitPanel.ts — rozdzielenie stosu armii na dwa heksy (v1.1).
 * v1.1 (R-WEB-ARMY-SPLIT-PANEL-SCROLL-GRID-BRAND-Q1): lista budowana RAZ (zaznaczenie
 * aktualizuje tylko klasy/atrybuty — scrollTop listy zostaje), siatka 3x5, tokeny brand-booka.
 */

import type { ArmyMergeUnitRow } from './armyMergePanel';
import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { unitIconSvg } from './icons/brandAssets';
import { armyStackCardLabel, sortArmyStackGeneralsFirst } from './armyStackLabel';

export interface SplitDestOption {
  q: number;
  r: number;
  label: string;
}

export interface SplitNeighborOption {
  q: number;
  r: number;
  direction: 'E' | 'NE' | 'NW' | 'W' | 'SW' | 'SE';
  terrain: string;
  detail?: string;
  available: boolean;
  reason?: string;
}

export interface ArmySplitPanelOpts {
  hexLabel: string;
  units: ArmyMergeUnitRow[];
  destHexes: SplitDestOption[];
  /** Six physical neighbors in the same axial directions used by the map. */
  neighbors?: SplitNeighborOption[];
  onSplit: (unitIds: string[], destQ: number, destR: number) => void;
  onCancel: () => void;
}

let root: HTMLDivElement | null = null;

const STYLE_ID = 'civ-army-split-css-v1';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  // Tokeny: brand-book (icons/brand/tokens.css, --tg-*) z fallbackami = wartosci kanonu.
  const css = `
.civ-asp-overlay{
  position:fixed;inset:0;z-index:525;display:flex;align-items:center;justify-content:center;
  padding:14px;background:rgba(4,8,18,0.58);backdrop-filter:blur(3px);
}
.civ-asp{
  --gold:var(--tg-gold-primary,#e8d88a);--gold-dim:var(--tg-gold-dim,#a08030);
  --muted:var(--tg-text-muted,#8a8070);--text:var(--tg-text-primary,#e8e0c8);--sub:#b8b09a;
  --ring:var(--tg-focus-ring,var(--tg-gold-primary,#e8d88a));--warn:var(--tg-orange,#d08030);
  --asp-row:46px;--asp-gap:6px;--asp-pad:4px;
  font:13px var(--tg-font-ui,"Segoe UI",Tahoma,sans-serif);color:var(--text);
  width:min(580px,100%);max-height:calc(100vh - 28px);max-height:calc(100dvh - 28px);
  display:flex;flex-direction:column;
  background:var(--tg-panel-grad,linear-gradient(180deg,rgba(18,24,32,.96),rgba(8,10,16,.96)));
  border:var(--tg-border-gold,2px solid rgba(232,216,138,.45));border-radius:var(--tg-radius-panel,12px);
  box-shadow:0 12px 40px rgba(0,0,0,.6);overflow:hidden;
}
.civ-asp *{box-sizing:border-box;}
.civ-asp-hdr{flex:0 0 auto;padding:16px 18px 10px;text-align:center;border-bottom:1px solid rgba(232,216,138,0.14);
  background:linear-gradient(180deg,rgba(232,216,138,0.07),transparent);}
.civ-asp-orn{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;}
.civ-asp-orn i{display:block;height:1px;width:40px;background:linear-gradient(90deg,transparent,var(--gold-dim));}
.civ-asp-orn i.r{background:linear-gradient(270deg,transparent,var(--gold-dim));}
.civ-asp-title{font:700 12px/1.2 var(--tg-font-title,Georgia,serif);letter-spacing:.12em;text-transform:uppercase;color:var(--gold);}
.civ-asp-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.civ-asp-body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:14px 18px;}
.civ-asp-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;}
.civ-asp-units{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:var(--asp-row);gap:var(--asp-gap);
  padding:var(--asp-pad);margin-bottom:6px;overflow-y:auto;overflow-x:hidden;
  max-height:calc(5*var(--asp-row) + 4*var(--asp-gap) + 2*var(--asp-pad) + 2px);
  border:1px solid rgba(255,255,255,0.08);border-radius:10px;background:rgba(0,0,0,0.18);
  scrollbar-width:thin;scrollbar-color:var(--gold-dim) transparent;}
.civ-asp-u{position:relative;display:flex;align-items:center;gap:8px;min-width:0;padding:0 8px;border-radius:8px;
  border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);cursor:pointer;}
.civ-asp-u:hover{border-color:rgba(232,216,138,0.4);}
.civ-asp-u.on{border-color:var(--gold);background:rgba(232,216,138,0.12);}
.civ-asp-u.cmd{border-color:rgba(232,216,138,0.55);}
.civ-asp-u.cmd .civ-asp-u-name{color:#ffe27a;font-weight:800;}
.civ-asp-u:has(input:focus-visible){outline:2px solid var(--ring);outline-offset:1px;}
.civ-asp-u input{position:absolute;opacity:0;width:1px;height:1px;margin:0;pointer-events:none;}
.civ-asp-cb{flex:0 0 18px;width:18px;height:18px;border-radius:4px;border:1.5px solid var(--gold-dim);
  display:inline-flex;align-items:center;justify-content:center;color:transparent;background:rgba(0,0,0,0.3);}
.civ-asp-u.on .civ-asp-cb{background:var(--gold);border-color:var(--gold);color:var(--tg-btn-primary-ink,#2e2708);}
.civ-asp-cb svg{width:12px;height:12px;}
.civ-asp-u-ic{flex:0 0 24px;width:24px;height:24px;color:var(--gold);display:inline-flex;align-items:center;justify-content:center;}
.civ-asp-u-ic svg{width:24px;height:24px;}
.civ-asp-u-name{flex:1;min-width:0;font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-asp-status{font-size:11px;color:var(--sub);margin:0 0 14px;min-height:15px;}
.civ-asp-status.warn{color:var(--warn);font-weight:700;}
.civ-asp-dests{display:flex;flex-wrap:wrap;gap:6px;}
.civ-asp-map{position:relative;width:min(100%,340px);aspect-ratio:340/224;margin:0 auto 12px;}
.civ-asp-cell{position:absolute;width:29.4%;height:38.4%;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:2px;padding:7px 5px;text-align:center;clip-path:polygon(25% 3%,75% 3%,99% 50%,75% 97%,25% 97%,1% 50%);
  border:0;background:rgba(255,255,255,.08);color:var(--text);font:inherit;cursor:pointer;}
.civ-asp-cell:before{content:"";position:absolute;inset:3px;background:rgba(13,18,27,.96);clip-path:polygon(25% 3%,75% 3%,99% 50%,75% 97%,25% 97%,1% 50%);z-index:-1;}
.civ-asp-cell b,.civ-asp-cell small,.civ-asp-cell span{position:relative;pointer-events:none;}
.civ-asp-cell b{font-size:10px;letter-spacing:.05em;color:var(--gold);}
.civ-asp-cell small{font-size:9px;color:var(--sub);line-height:1.1;}
.civ-asp-cell span{font-size:11px;max-width:84px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-asp-cell.center{left:35.3%;top:30.8%;z-index:2;border:1px solid rgba(232,216,138,.5);background:rgba(232,216,138,.2);cursor:default;}
.civ-asp-cell.center[data-dq]{cursor:pointer;}
.civ-asp-cell.E{left:67.1%;top:30.8%}.civ-asp-cell.NE{left:51.2%;top:3.6%}.civ-asp-cell.NW{left:19.4%;top:3.6%}
.civ-asp-cell.W{left:3.5%;top:30.8%}.civ-asp-cell.SW{left:19.4%;top:58%}.civ-asp-cell.SE{left:51.2%;top:58%}
.civ-asp-cell.on{background:rgba(232,216,138,.44);color:var(--gold);outline:2px solid var(--gold);}
.civ-asp-cell:disabled{opacity:.38;cursor:not-allowed;filter:grayscale(.8);}
.civ-asp-cell:focus-visible{outline:3px solid var(--ring);outline-offset:2px;}
.civ-asp.graphical .civ-asp-dests{display:none;}
.civ-asp-dest{font:inherit;font-size:11px;font-weight:600;cursor:pointer;padding:7px 12px;border-radius:var(--tg-radius-btn,8px);
  border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.05);color:var(--sub);}
.civ-asp-dest:hover{border-color:rgba(232,216,138,0.45);}
.civ-asp-dest.on{border-color:var(--gold);background:rgba(232,216,138,0.12);color:var(--gold);}
.civ-asp-dest:disabled{opacity:.35;cursor:not-allowed;}
.civ-asp-hint{font-size:11px;color:var(--muted);margin-top:10px;line-height:1.4;}
.civ-asp-foot{flex:0 0 auto;padding:10px 18px 16px;display:flex;gap:10px;justify-content:flex-end;}
.civ-asp-btn{font:inherit;font-size:12px;cursor:pointer;border-radius:var(--tg-radius-btn,8px);padding:10px 18px;
  letter-spacing:.14em;text-transform:uppercase;}
.civ-asp-btn-go{background:var(--tg-btn-primary,linear-gradient(180deg,#f0dc88,#b99a28));
  border:1px solid #6a5212;border-top-color:#f8eea8;color:var(--tg-btn-primary-ink,#2e2708);font-weight:700;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 18px rgba(232,216,138,.2);}
.civ-asp-btn-go[aria-disabled="true"]{opacity:.45;cursor:not-allowed;box-shadow:none;}
.civ-asp-btn-cancel{background:linear-gradient(180deg,#161c28,#0a0d14);border:2px solid rgba(232,216,138,.4);
  color:var(--gold);font-weight:600;}
.civ-asp-btn:not([aria-disabled="true"]):hover{filter:brightness(1.08);}
.civ-asp-btn:focus-visible,.civ-asp-dest:focus-visible{outline:2px solid var(--ring);outline-offset:3px;}
@media(prefers-reduced-motion:no-preference){
  .civ-asp-u,.civ-asp-dest,.civ-asp-btn{transition:border-color .15s,background .15s,color .15s,filter .15s;}
}
@media(max-width:559px){.civ-asp-units{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:359px){.civ-asp-units{grid-template-columns:1fr;}}
@media(max-height:520px){.civ-asp-overlay{align-items:flex-start;}}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function closePanel(): void {
  popOverlay('army-split');
  if (root) {
    root.remove();
    root = null;
  }
}

export function hideArmySplitPanel(): void {
  closePanel();
}

export function isArmySplitPanelOpen(): boolean {
  return root !== null;
}

const CHECK_SVG = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.2 6.4 4.9 9 9.8 3.2" fill="none" '
  + 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function showArmySplitPanel(opts: ArmySplitPanelOpts): void {
  closePanel();
  ensureStyles();

  if (opts.units.length < 2 || opts.destHexes.length === 0) return;

  const selected = new Set<string>([opts.units[opts.units.length - 1]!.id]);
  let destQ = opts.destHexes[0]!.q;
  let destR = opts.destHexes[0]!.r;

  root = document.createElement('div');
  root.className = 'civ-asp-overlay';
  root.addEventListener('click', (e) => {
    if (e.target === root) { closePanel(); opts.onCancel(); }
  });

  const box = document.createElement('div');
  box.className = 'civ-asp' + (opts.neighbors?.length ? ' graphical' : '');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Rozdziel armię');

  // Generał/wódz na początku listy i z etykietą roli (wcześniej tylko typ, np. „Wojownik").
  let uHtml = '';
  for (const u of sortArmyStackGeneralsFirst(opts.units)) {
    const label = armyStackCardLabel({ name: u.name, commanderTitle: u.commanderTitle });
    const cmdCls = u.commanderTitle ? ' cmd' : '';
    uHtml += '<label class="civ-asp-u' + cmdCls + '" title="' + esc(label) + '">'
      + '<input type="checkbox" data-uid="' + esc(u.id) + '" aria-label="' + esc(label) + '">'
      + '<span class="civ-asp-cb">' + CHECK_SVG + '</span>'
      + '<span class="civ-asp-u-ic" aria-hidden="true">' + (u.icon || unitIconSvg(undefined)) + '</span>'
      + '<span class="civ-asp-u-name">' + esc(label) + '</span></label>';
  }
  let dHtml = '';
  for (const d of opts.destHexes) {
    dHtml += '<button type="button" class="civ-asp-dest" data-dq="' + d.q + '" data-dr="' + d.r + '">'
      + esc(d.label) + '</button>';
  }
  const directionOrder: SplitNeighborOption['direction'][] = ['E', 'NE', 'NW', 'W', 'SW', 'SE'];
  const directionNames: Record<SplitNeighborOption['direction'], string> = {
    E: 'wschód', NE: 'północny wschód', NW: 'północny zachód', W: 'zachód', SW: 'południowy zachód', SE: 'południowy wschód',
  };
  const neighborByDirection = new Map((opts.neighbors ?? []).map(n => [n.direction, n]));
  const cellFor = (direction: SplitNeighborOption['direction']): string => {
    const n = neighborByDirection.get(direction);
    if (!n) return '<button type="button" class="civ-asp-cell ' + direction + '" disabled aria-label="' + direction + ': brak danych sąsiada"><b>' + direction + '</b><small>Brak danych</small></button>';
    const target = opts.destHexes.find(d => d.q === n.q && d.r === n.r);
    const disabled = !n.available || !target;
    const reason = n.reason || (!target ? 'Cel niedostępny' : '');
    const aria = directionNames[direction] + ' (' + direction + '), ' + n.terrain + (n.detail ? ', ' + n.detail : '')
      + (disabled ? ', niedostępne: ' + reason : ', dostępne');
    const detailHtml = n.detail || (disabled ? reason : '');
    return '<button type="button" class="civ-asp-cell ' + direction + '" data-dq="' + n.q + '" data-dr="' + n.r + '"'
      + (disabled ? ' disabled title="' + esc(reason) + '"' : ' title="' + esc(aria) + '"')
      + ' aria-label="' + esc(aria) + '" aria-pressed="false"><b>' + direction + '</b><span>' + esc(n.terrain) + '</span>'
      + (detailHtml ? '<small>' + esc(detailHtml) + '</small>' : '') + '</button>';
  };
  const cityDest = opts.neighbors?.length ? opts.destHexes.find(d => d.label?.includes('mieście')) : undefined;
  const centerTag = cityDest ? 'button type="button" data-dq="' + cityDest.q + '" data-dr="' + cityDest.r + '" aria-label="'
    + esc(cityDest.label) + '" aria-pressed="false"' : 'div';
  const centerHtml = '<' + centerTag + ' class="civ-asp-cell center' + (cityDest ? '' : ' source') + '"><b>ARMIA</b>'
    + '<small>' + opts.units.length + ' jedn.</small>' + (cityDest ? '<small>Miasto</small>' : '') + '</' + (cityDest ? 'button' : 'div') + '>';
  const mapHtml = '<div class="civ-asp-map" role="group" aria-label="Sąsiednie heksy wokół źródła">'
    + centerHtml + directionOrder.map(cellFor).join('') + '</div>';
  // Budowane RAZ: zmiana zaznaczenia aktualizuje tylko klasy/atrybuty (scrollTop listy zostaje).
  box.innerHTML =
    '<div class="civ-asp-hdr">'
      + '<div class="civ-asp-orn"><i></i><i class="r"></i></div>'
      + '<div class="civ-asp-title">Rozdziel armię</div>'
      + '<div class="civ-asp-sub">' + (opts.neighbors?.length
        ? 'Wybierz jednostki i sąsiedni heks' : 'Heks ' + esc(opts.hexLabel)) + '</div>'
    + '</div>'
    + '<div class="civ-asp-body">'
      + '<div class="civ-asp-lbl">Wybierz jednostki do odłączenia</div>'
      + '<div class="civ-asp-units" role="group" aria-label="Jednostki do odłączenia">' + uHtml + '</div>'
      + '<div class="civ-asp-status" role="status" aria-live="polite" data-status></div>'
      + '<div class="civ-asp-lbl">Docelowy heks</div>'
      + mapHtml
      + '<div class="civ-asp-dests" role="group" aria-label="Docelowy heks">' + dHtml + '</div>'
      + '<div class="civ-asp-hint">Na heksie Źródłowym musi zostać co najmniej 1 jednostka.'
      + (opts.destHexes.some(d => d.label?.includes('mieście'))
        ? ' W mieście możesz odłączyć jednostkę bez wychodzenia poza miasto.'
        : '')
      + '</div>'
    + '</div>'
    + '<div class="civ-asp-foot">'
      + '<button type="button" class="civ-asp-btn civ-asp-btn-cancel" data-cancel>Anuluj</button>'
      + '<button type="button" class="civ-asp-btn civ-asp-btn-go" data-go>Rozdziel</button>'
    + '</div>';

  const list = box.querySelector('.civ-asp-units') as HTMLElement;
  const inputs = Array.from(box.querySelectorAll<HTMLInputElement>('input[data-uid]'));
  const destBtns = Array.from(box.querySelectorAll<HTMLElement>('[data-dq]'));
  const statusEl = box.querySelector('[data-status]') as HTMLElement;
  const goBtn = box.querySelector('[data-go]') as HTMLElement;

  function canSplit(): boolean {
    return selected.size > 0 && opts.units.length - selected.size >= 1;
  }

  function sync(): void {
    for (const inp of inputs) {
      const on = selected.has(inp.getAttribute('data-uid') ?? '');
      inp.checked = on;
      inp.closest('.civ-asp-u')?.classList.toggle('on', on);
    }
    for (const btn of destBtns) {
      const on = Number(btn.getAttribute('data-dq')) === destQ && Number(btn.getAttribute('data-dr')) === destR;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    const n = selected.size;
    const stay = opts.units.length - n;
    statusEl.classList.toggle('warn', !canSplit());
    statusEl.textContent = n === 0
      ? 'Zaznacz co najmniej 1 jednostkę do odłączenia.'
      : stay < 1
        ? 'Na heksie Źródłowym musi zostać co najmniej 1 jednostka.'
        : 'Zaznaczono ' + n + ' z ' + opts.units.length + ' · zostaje na heksie: ' + stay;
    goBtn.setAttribute('aria-disabled', canSplit() ? 'false' : 'true');
  }

  function setRoving(active: HTMLInputElement): void {
    for (const inp of inputs) inp.tabIndex = inp === active ? 0 : -1;
  }

  inputs.forEach((inp, idx) => {
    inp.addEventListener('change', () => {
      const id = inp.getAttribute('data-uid');
      if (!id) return;
      if (inp.checked) selected.add(id);
      else selected.delete(id);
      setRoving(inp);
      sync();
    });
    inp.addEventListener('focus', () => setRoving(inp));
    inp.addEventListener('keydown', (e) => {
      const cols = Math.max(1, getComputedStyle(list).gridTemplateColumns.split(' ').length);
      let to: number;
      if (e.key === 'ArrowRight') to = idx + 1;
      else if (e.key === 'ArrowLeft') to = idx - 1;
      else if (e.key === 'ArrowDown') to = idx + cols;
      else if (e.key === 'ArrowUp') to = idx - cols;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = inputs.length - 1;
      else return;
      e.preventDefault();
      inputs[Math.max(0, Math.min(inputs.length - 1, to))]!.focus();
    });
  });
  destBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      destQ = Number(btn.getAttribute('data-dq'));
      destR = Number(btn.getAttribute('data-dr'));
      sync();
    });
  });
  box.querySelector('[data-cancel]')?.addEventListener('click', () => {
    closePanel();
    opts.onCancel();
  });
  goBtn.addEventListener('click', () => {
    const ids = [...selected];
    const stay = opts.units.length - ids.length;
    if (ids.length === 0 || stay < 1) return;
    closePanel();
    opts.onSplit(ids, destQ, destR);
  });

  box.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(box);
  document.body.appendChild(root);
  sync();
  // Wejscie klawiatura: pierwsza zaznaczona (domyslnie ostatnia) jednostka; roving tabindex.
  const firstSel = inputs.find(i => i.checked) ?? inputs[0]!;
  setRoving(firstSel);
  firstSel.focus();

  pushOverlay('army-split', () => {
    closePanel();
    opts.onCancel();
  });
}
