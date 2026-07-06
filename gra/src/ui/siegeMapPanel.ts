/**
 * siegeMapPanel.ts — panel oblężenia na mapie (C3-Q7=A: boczny overlay, mapa widoczna).
 * Etap 2 po „Oblężaj" · styl spójny z cityAttackChoice (złoto / slate).
 */

import type { City } from '../game/cities';
import type { MapSiegeContext } from '../game/mapSiegeDetect';
import { getCityFood } from '../game/turn-economy';
import type { SiegeMachineKind, SiegeMachinesState } from '../game/siegeMachines';
import { brandIconSvg } from './icons/brandAssets';

export interface SiegeMapPanelActions {
  /** Zatwierdź oblężenie — wojsko zostaje, panel się zamyka. */
  onBesiege: (cityId: string) => void;
  onStorm: (ctx: MapSiegeContext) => void;
  onRetreat: (cityId: string) => void;
  onQueueMachine?: (cityId: string, kind: SiegeMachineKind) => void;
}

let root: HTMLDivElement | null = null;
let activeCtx: MapSiegeContext | null = null;
let actions: SiegeMapPanelActions | null = null;
let siegeTurn = 0;
let besiegerUnitCount = 0;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-siege-map-css-v3';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes smp-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
.civ-smp-overlay{
  position:fixed;top:120px;right:10px;bottom:72px;z-index:650;
  display:flex;align-items:stretch;justify-content:flex-end;
  pointer-events:none;
  animation:smp-in .22s ease-out;
}
.civ-smp{
  --gold:#e8d88a;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8ebf0;--sub:#b8c0cc;
  --panel:linear-gradient(165deg,rgba(14,20,36,0.97) 0%,rgba(8,12,24,0.98) 100%);
  --border:rgba(232,216,138,0.38);--border-hi:rgba(232,216,138,0.62);
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  width:min(360px,calc(100vw - 24px));max-height:100%;
  pointer-events:auto;
  background:var(--panel);border:1px solid var(--border);border-radius:12px;
  box-shadow:0 12px 40px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.06);
  padding:0;overflow:hidden;display:flex;flex-direction:column;
  animation:smp-in .28s ease-out;
}
.civ-smp *{box-sizing:border-box;}
.civ-smp-hdr{
  padding:18px 22px 14px;text-align:center;
  border-bottom:1px solid rgba(232,216,138,0.15);
  background:linear-gradient(180deg,rgba(232,216,138,0.06) 0%,transparent 100%);
}
.civ-smp-orn{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px;}
.civ-smp-orn i{display:block;height:1px;width:48px;background:linear-gradient(90deg,transparent,var(--gold-dim));}
.civ-smp-orn i.r{background:linear-gradient(270deg,transparent,var(--gold-dim));}
.civ-smp-title{
  font:700 11px/1.2 Georgia,"Times New Roman",serif;
  letter-spacing:.14em;text-transform:uppercase;color:var(--gold);
}
.civ-smp-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.civ-smp-body{padding:16px 20px 14px;overflow-y:auto;flex:1;min-height:0;}
.civ-smp-target{
  display:flex;align-items:center;gap:12px;padding:10px 12px;margin-bottom:12px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;
}
.civ-smp-target-ic{
  width:44px;height:44px;border-radius:8px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  background:rgba(200,120,64,0.12);border:1px solid rgba(200,120,64,0.35);
}
.civ-smp-target-ic .siege-modal-ic{width:28px;height:28px;color:var(--gold);}
.civ-smp-orn span,.civ-smp-attacker span,.civ-smp-act-ic{display:inline-flex;align-items:center;justify-content:center;line-height:0;}
.civ-smp-orn .siege-modal-ic{width:20px;height:20px;color:var(--gold);}
.civ-smp-attacker .siege-modal-ic{width:18px;height:18px;color:var(--gold);}
.civ-smp-act-ic .siege-modal-ic{width:20px;height:20px;color:var(--gold);}
.civ-smp-tag .siege-modal-ic{display:inline-flex;width:12px;height:12px;vertical-align:middle;margin-right:3px;}
.civ-smp-warn .siege-modal-ic{display:inline-flex;width:14px;height:14px;vertical-align:middle;margin-right:4px;color:#ffb0b0;}
.civ-smp-target-meta{flex:1;min-width:0;}
.civ-smp-target-name{font-size:15px;font-weight:700;color:var(--gold);}
.civ-smp-target-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px;}
.civ-smp-tag{
  font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;
  background:rgba(232,216,138,0.1);border:1px solid rgba(232,216,138,0.22);color:#f0e8b8;
}
.civ-smp-tag.wall{background:rgba(200,120,64,0.12);border-color:rgba(200,120,64,0.35);color:#ffc898;}
.civ-smp-attacker{
  display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:12px;color:var(--sub);
}
.civ-smp-attacker b{color:var(--text);font-weight:600;}
.civ-smp-stats{
  display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-bottom:12px;
  padding:10px 12px;border-radius:10px;
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
  font-size:11px;color:var(--sub);line-height:1.4;
}
.civ-smp-stats b{color:var(--text);font-weight:600;}
.civ-smp-stats .full{grid-column:1/-1;}
.civ-smp-warn{
  margin-bottom:10px;padding:8px 10px;border-radius:8px;font-size:11px;
  color:#ffb0b0;background:rgba(200,64,64,0.12);border:1px solid rgba(200,64,64,0.35);
}
.civ-smp-mach{
  margin-bottom:14px;padding:10px 12px;border-radius:10px;
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
}
.civ-smp-mach-h{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;}
.civ-smp-mach-meta{font-size:11px;color:var(--sub);line-height:1.45;}
.civ-smp-mach-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
.civ-smp-mach-btn{
  font:inherit;font-size:11px;font-weight:600;cursor:pointer;padding:5px 10px;border-radius:6px;
  background:rgba(232,216,138,0.1);color:#f0e8b8;border:1px solid rgba(232,216,138,0.28);
}
.civ-smp-mach-btn:hover{background:rgba(232,216,138,0.18);border-color:var(--border-hi);}
.civ-smp-prompt{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
.civ-smp-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.civ-smp-act{
  display:flex;flex-direction:column;align-items:flex-start;gap:3px;
  padding:12px 10px;border-radius:10px;cursor:pointer;text-align:left;
  border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);
  color:var(--text);font:inherit;transition:border-color .15s,background .15s,transform .12s;
}
.civ-smp-act:hover{border-color:var(--border-hi);background:rgba(255,255,255,0.06);transform:translateY(-1px);}
.civ-smp-act:active{transform:translateY(0);}
.civ-smp-act:disabled{opacity:.45;cursor:default;transform:none;}
.civ-smp-act-ic{font-size:20px;line-height:1;}
.civ-smp-act-label{font-size:12px;font-weight:700;color:var(--gold);}
.civ-smp-act-desc{font-size:9px;line-height:1.35;color:var(--muted);}
.civ-smp-act.besiege:hover{border-color:rgba(200,120,64,0.5);background:rgba(200,120,64,0.08);}
.civ-smp-act.besiege .civ-smp-act-label{color:#ffc898;}
.civ-smp-act.storm:hover{border-color:rgba(58,106,208,0.55);background:rgba(58,106,208,0.08);}
.civ-smp-act.storm .civ-smp-act-label{color:#a8c8ff;}
.civ-smp-act.retreat:hover{border-color:rgba(255,255,255,0.22);background:rgba(255,255,255,0.05);}
.civ-smp-act.retreat .civ-smp-act-label{color:var(--sub);}
.civ-smp-foot{
  padding:0 20px 16px;text-align:center;
  font-size:10px;color:var(--muted);line-height:1.45;
}
@media(max-width:480px){
  .civ-smp-overlay{top:auto;left:8px;right:8px;bottom:64px;}
  .civ-smp{width:100%;}
  .civ-smp-actions{grid-template-columns:1fr;}
  .civ-smp-stats{grid-template-columns:1fr;}
}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function modalIcon(id: string, size: 20 | 24 = 24): string {
  const svg = brandIconSvg(id, size);
  return svg ? svg.replace('<svg ', '<svg class="siege-modal-ic" ') : '';
}

function tagHtml(iconId: string, text: string, extraClass = ''): string {
  return '<span class="civ-smp-tag' + (extraClass ? ' ' + extraClass : '') + '">' +
    modalIcon(iconId, 20) + esc(text) + '</span>';
}

function ownerLabel(ownerId: number): string {
  return ownerId === 0 ? 'Gracz' : ('AI ' + ownerId);
}

function detachKeyboard(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

function attachKeyboard(cityId: string): void {
  detachKeyboard();
  keyHandler = (e: KeyboardEvent) => {
    if (!activeCtx || !actions) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      actions.onRetreat(cityId);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      actions.onBesiege(cityId);
    } else if (e.key === '1') {
      e.preventDefault();
      actions.onBesiege(cityId);
    } else if (e.key === '2' && activeCtx.oblegajacyOwnerId === 0) {
      e.preventDefault();
      actions.onStorm(activeCtx);
    } else if (e.key === '3') {
      e.preventDefault();
      actions.onRetreat(cityId);
    }
  };
  document.addEventListener('keydown', keyHandler);
}

function render(): void {
  if (!root || !activeCtx || !actions) return;
  const { city, atakujacy, oblegajacyOwnerId } = activeCtx;
  const food = getCityFood(city);
  const garnizon = city.garnizon ?? 0;
  const zuzycie = city.population + garnizon;
  const atrycjaNext = garnizon > 0 ? Math.max(1, Math.floor(garnizon * 0.08)) : 0;
  const milicjaEst = garnizon <= 0 ? 0
    : Math.max(1, Math.floor((city.population ?? 0) * 0.2));
  const playerCanStorm = oblegajacyOwnerId === 0;
  const sm: SiegeMachinesState | undefined = city.siegeMachines;
  const qLabel = sm?.queue?.length
    ? sm.queue.map(k => (k === 'taran' ? 'Taran' : 'Wieża')).join(', ')
    : '—';
  const rLabel = sm?.ready?.length
    ? sm.ready.map(k => (k === 'taran' ? 'Taran' : 'Wieża')).join(', ')
    : '—';
  const prog = sm?.buildProgress ?? 0;

  root.className = 'civ-smp-overlay';
  root.style.display = 'flex';
  root.innerHTML = '';

  const box = document.createElement('div');
  box.className = 'civ-smp';
  box.innerHTML =
    '<div class="civ-smp-hdr">' +
      '<div class="civ-smp-orn"><i></i><span>' + modalIcon('imp-fort', 20) + '</span><i class="r"></i></div>' +
      '<div class="civ-smp-title">Oblężenie</div>' +
      '<div class="civ-smp-sub">Tura oblężenia: <b>' + siegeTurn + '</b></div>' +
    '</div>' +
    '<div class="civ-smp-body">' +
      '<div class="civ-smp-target">' +
        '<div class="civ-smp-target-ic">' + modalIcon('cp-buildings', 24) + '</div>' +
        '<div class="civ-smp-target-meta">' +
          '<div class="civ-smp-target-name">' + esc(city.name) + '</div>' +
          '<div class="civ-smp-target-tags">' +
            (city.maMur ? tagHtml('bld-mury', 'Mur miejski', 'wall') : '') +
            (garnizon > 0
              ? tagHtml('tb-army', 'Garnizon ' + garnizon)
              : tagHtml('chip-garrison', 'Pusty garnizon')) +
            tagHtml('res-population', String(city.population)) +
            tagHtml('chip-map', ownerLabel(city.ownerId)) +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="civ-smp-attacker">' +
        '<span>' + modalIcon('tb-army', 20) + '</span> Atakujący: <b>' + esc(atakujacy.typeId) + '</b> (' + esc(ownerLabel(atakujacy.ownerId)) + ')' +
      '</div>' +
      '<div class="civ-smp-stats">' +
        '<div>Zapasy: <b>' + food + '</b></div>' +
        '<div>Zużycie/turę: <b>' + zuzycie + '</b></div>' +
        '<div>Oblegających: <b>' + besiegerUnitCount + '</b></div>' +
        '<div>Atrycja: <b>−' + atrycjaNext + '</b>/turę</div>' +
        (milicjaEst > 0
          ? '<div class="full">Milicja przy szturmie: ~<b>' + milicjaEst + '</b></div>'
          : '') +
      '</div>' +
      (city.siegeCapitulationPending
        ? '<div class="civ-smp-warn">' + modalIcon('chip-warning', 20) + 'Kapitulacja za 1 turę — magazyn wyczerpany!</div>'
        : '') +
      '<div class="civ-smp-mach">' +
        '<div class="civ-smp-mach-h">Machiny oblężnicze</div>' +
        '<div class="civ-smp-mach-meta">Kolejka: ' + esc(qLabel) + ' · Gotowe: ' + esc(rLabel) +
        (prog > 0 ? ' · postęp ' + Math.round(prog * 10) / 10 : '') + '</div>' +
        (playerCanStorm && actions.onQueueMachine
          ? '<div class="civ-smp-mach-row" data-mach-row></div>'
          : '') +
      '</div>' +
      '<div class="civ-smp-prompt">Potwierdź działanie</div>' +
      '<div class="civ-smp-actions">' +
        '<button type="button" class="civ-smp-act besiege" data-act="besiege">' +
          '<span class="civ-smp-act-ic">' + modalIcon('imp-fort', 20) + '</span>' +
          '<span class="civ-smp-act-label">Oblegaj</span>' +
          '<span class="civ-smp-act-desc">Zostaw wojsko · postęp co turę N</span>' +
        '</button>' +
        '<button type="button" class="civ-smp-act storm" data-act="storm"' +
          (playerCanStorm ? '' : ' disabled') + '>' +
          '<span class="civ-smp-act-ic">' + modalIcon('dip-war', 20) + '</span>' +
          '<span class="civ-smp-act-label">Szturm</span>' +
          '<span class="civ-smp-act-desc">preBattle · bitwa z murem</span>' +
        '</button>' +
        '<button type="button" class="civ-smp-act retreat" data-act="retreat">' +
          '<span class="civ-smp-act-ic">' + modalIcon('cp-order', 20) + '</span>' +
          '<span class="civ-smp-act-label">Odwrót</span>' +
          '<span class="civ-smp-act-desc">Koniec oblężenia · Esc</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="civ-smp-foot">Ruch zablokowany do decyzji · Enter = Oblegaj · 1/2/3 skróty</div>';

  const machRow = box.querySelector('[data-mach-row]');
  if (machRow && actions.onQueueMachine) {
    const mkQ = (label: string, kind: SiegeMachineKind) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'civ-smp-mach-btn';
      b.textContent = '+ ' + label;
      b.addEventListener('click', () => actions!.onQueueMachine!(city.id, kind));
      return b;
    };
    machRow.appendChild(mkQ('Taran', 'taran'));
    machRow.appendChild(mkQ('Wieża', 'wieza'));
  }

  box.querySelector('[data-act="besiege"]')?.addEventListener('click', () => actions!.onBesiege(city.id));
  box.querySelector('[data-act="storm"]')?.addEventListener('click', () => {
    if (playerCanStorm) actions!.onStorm(activeCtx!);
  });
  box.querySelector('[data-act="retreat"]')?.addEventListener('click', () => actions!.onRetreat(city.id));
  box.addEventListener('click', (e) => e.stopPropagation());

  root.appendChild(box);
  attachKeyboard(city.id);
}

export function setSiegePanelBesiegerCount(n: number): void {
  besiegerUnitCount = Math.max(0, n);
  if (isSiegeMapPanelOpen()) render();
}

export function showSiegeMapPanel(ctx: MapSiegeContext, panelActions: SiegeMapPanelActions, turnNum = 1): void {
  ensureStyles();
  if (!root) {
    root = document.createElement('div');
    root.id = 'civ-siege-map-panel';
    document.body.appendChild(root);
  }
  activeCtx = ctx;
  actions = panelActions;
  siegeTurn = turnNum;
  root.style.display = 'flex';
  render();
}

export function updateSiegeMapPanelTurn(turnNum: number, city?: City): void {
  siegeTurn = turnNum;
  if (city && activeCtx) activeCtx = { ...activeCtx, city };
  if (isSiegeMapPanelOpen()) render();
}

export function hideSiegeMapPanel(): void {
  detachKeyboard();
  if (root) root.style.display = 'none';
  activeCtx = null;
  actions = null;
  besiegerUnitCount = 0;
}

export function isSiegeMapPanelOpen(): boolean {
  return root !== null && root.style.display !== 'none';
}

export function getActiveSiegeCityId(): string | null {
  return activeCtx?.city.id ?? null;
}
