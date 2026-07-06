/**
 * cityAttackChoice.ts — wybór akcji przy ataku miasta z murem (C3-Q1=A).
 * Paleta spójna z preBattle + armyStackHud (złoto / slate).
 */

import type { MapSiegeContext } from '../game/mapSiegeDetect';
import { brandIconSvg } from './icons/brandAssets';

export interface CityAttackChoiceActions {
  onSiege: () => void;
  onStorm: () => void;
  onCancel: () => void;
}

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-city-attack-css-v2';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes cac-fadeIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:none}}
.civ-cac-overlay{
  position:fixed;inset:0;z-index:650;display:flex;align-items:center;justify-content:center;
  background:rgba(4,8,18,0.62);backdrop-filter:blur(3px);
  animation:cac-fadeIn .22s ease-out;
}
.civ-cac{
  --gold:#e8d88a;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8ebf0;--sub:#b8c0cc;
  --panel:linear-gradient(165deg,rgba(14,20,36,0.97) 0%,rgba(8,12,24,0.98) 100%);
  --border:rgba(232,216,138,0.38);--border-hi:rgba(232,216,138,0.62);
  --siege:#c87840;--storm:#3a6ad0;
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  min-width:min(420px,calc(100vw - 32px));max-width:480px;
  background:var(--panel);border:1px solid var(--border);border-radius:14px;
  box-shadow:0 20px 60px rgba(0,0,0,0.65),inset 0 1px 0 rgba(255,255,255,0.06);
  padding:0;overflow:hidden;
  animation:cac-fadeIn .28s ease-out;
}
.civ-cac *{box-sizing:border-box;}
.civ-cac-hdr{
  padding:18px 22px 14px;text-align:center;
  border-bottom:1px solid rgba(232,216,138,0.15);
  background:linear-gradient(180deg,rgba(232,216,138,0.06) 0%,transparent 100%);
}
.civ-cac-orn{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px;}
.civ-cac-orn i{display:block;height:1px;width:48px;background:linear-gradient(90deg,transparent,var(--gold-dim));}
.civ-cac-orn i.r{background:linear-gradient(270deg,transparent,var(--gold-dim));}
.civ-cac-orn span{font-size:18px;line-height:1;}
.civ-cac-title{
  font:700 11px/1.2 Georgia,"Times New Roman",serif;
  letter-spacing:.14em;text-transform:uppercase;color:var(--gold);
}
.civ-cac-body{padding:16px 20px 18px;}
.civ-cac-target{
  display:flex;align-items:center;gap:12px;padding:10px 12px;margin-bottom:14px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;
}
.civ-cac-target-ic{
  width:44px;height:44px;border-radius:8px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  background:rgba(200,120,64,0.12);border:1px solid rgba(200,120,64,0.35);
}
.civ-cac-target-ic .siege-modal-ic{width:28px;height:28px;color:var(--gold);}
.civ-cac-act-ic,.civ-cac-attacker-ic,.civ-cac-orn span{display:inline-flex;align-items:center;justify-content:center;line-height:0;}
.civ-cac-act-ic .siege-modal-ic,.civ-cac-attacker-ic .siege-modal-ic{width:22px;height:22px;color:var(--gold);}
.civ-cac-orn .siege-modal-ic{width:20px;height:20px;color:var(--gold);}
.civ-cac-tag .siege-modal-ic{display:inline-flex;width:12px;height:12px;vertical-align:middle;margin-right:3px;}
.civ-cac-target-meta{flex:1;min-width:0;}
.civ-cac-target-name{font-size:15px;font-weight:700;color:var(--gold);letter-spacing:.02em;}
.civ-cac-target-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px;}
.civ-cac-tag{
  font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;
  background:rgba(232,216,138,0.1);border:1px solid rgba(232,216,138,0.22);color:#f0e8b8;
}
.civ-cac-tag.wall{background:rgba(200,120,64,0.12);border-color:rgba(200,120,64,0.35);color:#ffc898;}
.civ-cac-attacker{
  display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:12px;color:var(--sub);
}
.civ-cac-attacker b{color:var(--text);font-weight:600;}
.civ-cac-attacker-ic{font-size:16px;}
.civ-cac-prompt{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
.civ-cac-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.civ-cac-act{
  display:flex;flex-direction:column;align-items:flex-start;gap:4px;
  padding:14px 12px;border-radius:10px;cursor:pointer;text-align:left;
  border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);
  color:var(--text);font:inherit;transition:border-color .15s,background .15s,transform .12s;
}
.civ-cac-act:hover{border-color:var(--border-hi);background:rgba(255,255,255,0.06);transform:translateY(-1px);}
.civ-cac-act:active{transform:translateY(0);}
.civ-cac-act-ic{font-size:22px;line-height:1;margin-bottom:2px;}
.civ-cac-act-label{font-size:13px;font-weight:700;color:var(--gold);}
.civ-cac-act-desc{font-size:10px;line-height:1.35;color:var(--muted);}
.civ-cac-act.siege:hover{border-color:rgba(200,120,64,0.55);background:rgba(200,120,64,0.08);}
.civ-cac-act.siege .civ-cac-act-label{color:#ffc898;}
.civ-cac-act.storm:hover{border-color:rgba(58,106,208,0.55);background:rgba(58,106,208,0.08);}
.civ-cac-act.storm .civ-cac-act-label{color:#a8c8ff;}
.civ-cac-foot{
  padding:0 20px 16px;display:flex;justify-content:center;
}
.civ-cac-cancel{
  font:inherit;font-size:11px;cursor:pointer;padding:6px 14px;
  background:none;border:1px solid rgba(255,255,255,0.12);border-radius:6px;
  color:var(--muted);transition:color .15s,border-color .15s;
}
.civ-cac-cancel:hover{color:var(--sub);border-color:rgba(255,255,255,0.22);}
@media(max-width:420px){
  .civ-cac-actions{grid-template-columns:1fr;}
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
  return `<span class="civ-cac-tag${extraClass ? ' ' + extraClass : ''}">${modalIcon(iconId, 20)}${esc(text)}</span>`;
}

function detachKeyboard(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

function removeRoot(): void {
  detachKeyboard();
  if (root) {
    root.remove();
    root = null;
  }
}

function pickAction(fn: () => void): void {
  removeRoot();
  fn();
}

function attachKeyboard(actions: CityAttackChoiceActions): void {
  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      pickAction(actions.onCancel);
    } else if (e.key === '1') {
      e.preventDefault();
      pickAction(actions.onSiege);
    } else if (e.key === '2') {
      e.preventDefault();
      pickAction(actions.onStorm);
    }
  };
  document.addEventListener('keydown', keyHandler);
}

export function hideCityAttackChoice(): void {
  removeRoot();
}

export function showCityAttackChoice(ctx: MapSiegeContext, actions: CityAttackChoiceActions): void {
  removeRoot();
  ensureStyles();

  const city = ctx.city;
  const unit = ctx.atakujacy;
  const hasGarrison = ctx.garnizonUnit !== null || (city.garnizon ?? 0) > 0;

  root = document.createElement('div');
  root.id = 'civ-city-attack-choice';
  root.className = 'civ-cac-overlay';
  root.addEventListener('click', (e) => {
    if (e.target === root) pickAction(actions.onCancel);
  });

  const box = document.createElement('div');
  box.className = 'civ-cac';
  box.innerHTML = `
    <div class="civ-cac-hdr">
      <div class="civ-cac-orn"><i></i><span>${modalIcon('tb-army', 20)}</span><i class="r"></i></div>
      <div class="civ-cac-title">Atak na miasto</div>
    </div>
    <div class="civ-cac-body">
      <div class="civ-cac-target">
        <div class="civ-cac-target-ic">${modalIcon('cp-buildings', 24)}</div>
        <div class="civ-cac-target-meta">
          <div class="civ-cac-target-name">${esc(city.name)}</div>
          <div class="civ-cac-target-tags">
            ${city.maMur ? tagHtml('bld-mury', 'Mur miejski', 'wall') : ''}
            ${hasGarrison ? tagHtml('tb-army', 'Garnizon') : tagHtml('chip-garrison', 'Pusty garnizon')}
            ${tagHtml('res-population', String(city.population))}
          </div>
        </div>
      </div>
      <div class="civ-cac-attacker">
        <span class="civ-cac-attacker-ic">${modalIcon('tb-army', 20)}</span>
        Atakujesz jednostką <b>${esc(unit.typeId)}</b>
      </div>
      <div class="civ-cac-prompt">Wybierz sposób działania</div>
      <div class="civ-cac-actions">
        <button type="button" class="civ-cac-act siege" data-act="siege">
          <span class="civ-cac-act-ic">${modalIcon('imp-fort', 20)}</span>
          <span class="civ-cac-act-label">Oblężaj</span>
          <span class="civ-cac-act-desc">Obóz na mapie · głód garnizonu · machiny oblężnicze</span>
        </button>
        <button type="button" class="civ-cac-act storm" data-act="storm">
          <span class="civ-cac-act-ic">${modalIcon('dip-war', 20)}</span>
          <span class="civ-cac-act-label">Szturm</span>
          <span class="civ-cac-act-desc">Bitwa 3D od razu · mur jako przeszkoda</span>
        </button>
      </div>
    </div>
    <div class="civ-cac-foot">
      <button type="button" class="civ-cac-cancel" data-act="cancel">Anuluj · Esc</button>
    </div>
  `;

  box.querySelector('[data-act="siege"]')?.addEventListener('click', () => pickAction(actions.onSiege));
  box.querySelector('[data-act="storm"]')?.addEventListener('click', () => pickAction(actions.onStorm));
  box.querySelector('[data-act="cancel"]')?.addEventListener('click', () => pickAction(actions.onCancel));
  box.addEventListener('click', (e) => e.stopPropagation());

  root.appendChild(box);
  document.body.appendChild(root);
  attachKeyboard(actions);
}

export function isCityAttackChoiceOpen(): boolean {
  return root !== null;
}
