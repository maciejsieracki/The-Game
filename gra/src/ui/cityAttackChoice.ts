/**
 * cityAttackChoice.ts -- wybor akcji przy ataku miasta z murem (C3-Q1=A).
 * KANON v1.1 (2026-07-23): kompaktowa nakladka dol-srodek nad mapa swiata (KLATKA B),
 * spojna z preBattle.ts (te same tokeny -- panel gradient + blur, zloty primary/danger CTA).
 * Zrodlo wizualne: docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/
 *   "The Game - PreBattle nakladka v1.1 (1E).dc.html" (KLATKA B) + DYSPOZYCJA-WDROZENIE.md.
 * Kontrakt danych (MapSiegeContext / CityAttackChoiceActions) NIEZMIENIONY -- restyling +
 * rekompozycja layoutu, bez zmian logiki silnika. Sekcje bez zrodla danych (Teren, Tura,
 * Region, "Szanse szturmu", pigulki modyfikatorow) pominiete -- patrz komentarze TODO nizej;
 * MapSiegeContext nie niesie tych pol (nie wymyslamy nowych mechanik silnika).
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

const STYLE_ID = 'civ-city-attack-css-v3';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes cac-fadeIn{from{opacity:0}to{opacity:1}}
.civ-cac-overlay{
  position:fixed;inset:0;z-index:650;pointer-events:none;
  animation:cac-fadeIn .18s ease-out;
}
.civ-cac{
  --gold:#e8d88a;--gold-bright:#f4e6a8;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8e0c8;--sub:#b8c0cc;
  --panel:linear-gradient(180deg,rgba(22,28,40,.78),rgba(8,10,16,.84));
  --border:rgba(232,216,138,.45);--border-soft:rgba(232,216,138,.22);
  --siege:#c87840;--storm:#3a6ad0;
  position:absolute;bottom:18px;left:50%;transform:translateX(-50%);pointer-events:auto;
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  width:min(560px,calc(100vw - 32px));
  background:var(--panel);backdrop-filter:blur(8px);border:2px solid var(--border);border-radius:14px;
  box-shadow:0 14px 44px rgba(0,0,0,.65),inset 0 1px 0 rgba(232,216,138,.12);
  padding:0;overflow:hidden;
}
.civ-cac *{box-sizing:border-box;}
.civ-cac-hdr{
  padding:9px 20px 8px;text-align:center;border-bottom:1px solid var(--border-soft);
  background:linear-gradient(180deg,rgba(232,216,138,.09),transparent);
}
.civ-cac-kick{font-size:9.5px;letter-spacing:.28em;text-transform:uppercase;color:#b09a55;white-space:nowrap}
.civ-cac-title{
  font:20px/1.3 Georgia,"Times New Roman",serif;color:var(--gold);letter-spacing:.03em;margin-top:2px;
}
.civ-cac-body{padding:10px 20px 14px;}
.civ-cac-tags{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:10px;}
.civ-cac-tag{
  display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;padding:2px 9px;border-radius:999px;
  white-space:nowrap;font-variant-numeric:tabular-nums;
  background:rgba(232,216,138,.09);border:1px solid rgba(232,216,138,.22);color:#f0e8b8;
}
.civ-cac-tag.wall{background:rgba(200,120,64,.12);border-color:rgba(200,120,64,.4);color:#ffc898;}
.civ-cac-tag svg{width:11px;height:11px;}
.civ-cac-attacker{
  display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;font-size:11.5px;color:var(--sub);
  text-align:center;
}
.civ-cac-attacker b{color:var(--text);font-weight:600;}
.civ-cac-attacker svg{width:14px;height:14px;color:var(--gold);flex:none;}
.civ-cac-note{font-size:10.5px;color:var(--muted);line-height:1.5;text-align:center;margin-bottom:10px;}
.civ-cac-prompt{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.14em;text-align:center;margin-bottom:8px;}
.civ-cac-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.civ-cac-act{
  position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;
  padding:10px 12px;border-radius:10px;cursor:pointer;text-align:left;font:inherit;
  border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:var(--text);
  transition:border-color .15s,background .15s,box-shadow .15s,transform .12s;
}
.civ-cac-act:hover{transform:translateY(-1px);}
.civ-cac-act:active{transform:translateY(0);}
.civ-cac-kb{
  position:absolute;top:8px;right:9px;font-size:9px;font-weight:700;color:#c8b898;
  border:1px solid rgba(232,216,138,.3);border-radius:4px;padding:0 5px;background:rgba(232,216,138,.06);
}
.civ-cac-act-lbl{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;letter-spacing:.06em;}
.civ-cac-act-lbl svg{width:15px;height:15px;}
.civ-cac-act-desc{font-size:10px;line-height:1.35;color:var(--muted);}
.civ-cac-act.siege{border-color:rgba(200,120,64,.4);}
.civ-cac-act.siege .civ-cac-act-lbl{color:#ffc898;}
.civ-cac-act.siege:hover{border-color:rgba(200,120,64,.7);background:rgba(200,120,64,.08);box-shadow:0 0 12px rgba(200,120,64,.2);}
.civ-cac-act.storm{border-color:rgba(58,106,208,.4);}
.civ-cac-act.storm .civ-cac-act-lbl{color:#a8c8ff;}
.civ-cac-act.storm:hover{border-color:rgba(90,155,212,.75);background:rgba(58,106,208,.08);box-shadow:0 0 12px rgba(58,106,208,.25);}
.civ-cac-btns{display:flex;justify-content:center;margin-bottom:8px;}
.civ-cac-cancel{
  border-radius:9px;padding:8px 15px;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  display:inline-flex;align-items:center;gap:8px;border:2px solid rgba(200,64,64,.5);color:#e08a8a;
  background:linear-gradient(180deg,rgba(40,18,18,.85),rgba(20,10,10,.85));font:inherit;cursor:pointer;
  transition:border-color .15s,box-shadow .15s;
}
.civ-cac-cancel:hover{border-color:#e08a8a;box-shadow:0 0 10px rgba(200,64,64,.3);}
.civ-cac-cancel svg{width:14px;height:14px;}
.civ-cac-keys{font-size:9.5px;color:#6a6250;text-align:center;letter-spacing:.05em;}
.civ-cac-keys b{color:#c8b898;font-weight:600;border:1px solid rgba(232,216,138,.3);border-radius:4px;padding:0 5px;background:rgba(232,216,138,.06);}
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

function modalIcon(id: string, size: number = 20): string {
  const svg = brandIconSvg(id, size);
  return svg ? svg.replace('<svg ', '<svg class="cac-ic" ') : '';
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
  const garrisonTag = city.garnizon !== undefined && city.garnizon > 0
    ? tagHtml('tb-army', 'Garnizon: ' + String(city.garnizon) + ' oddz.')
    : hasGarrison
      ? tagHtml('tb-army', 'Garnizon')
      : tagHtml('chip-garrison', 'Pusty garnizon');

  root = document.createElement('div');
  root.id = 'civ-city-attack-choice';
  root.className = 'civ-cac-overlay';

  const box = document.createElement('div');
  box.className = 'civ-cac';
  box.innerHTML = `
    <div class="civ-cac-hdr">
      <div class="civ-cac-kick">Atak na miasto</div>
      <div class="civ-cac-title">Atakujesz: ${esc(city.name)}</div>
    </div>
    <div class="civ-cac-body">
      <div class="civ-cac-tags">
        ${city.maMur ? tagHtml('bld-mury', 'Mur miejski', 'wall') : ''}
        ${garrisonTag}
        ${tagHtml('res-population', 'Ludność ' + String(city.population))}
      </div>
      <div class="civ-cac-attacker">${modalIcon('tb-army', 20)}Atakujesz jednostką <b>${esc(unit.typeId)}</b></div>
      <!-- TODO (brak danych w kontrakcie MapSiegeContext): makieta KLATKA B pokazuje tu
           Region/Teren/Ture oraz pasek "Szanse szturmu" + pigulki modyfikatorow --
           MapSiegeContext niesie tylko city/atakujacy/garnizonUnit, bez sil/tereny/tury/
           szans walki. Pominieto zamiast wymyslac nowe pola/mechaniki silnika. -->
      <div class="civ-cac-prompt">Wybierz sposób działania</div>
      <div class="civ-cac-actions">
        <button type="button" class="civ-cac-act siege" data-act="siege">
          <span class="civ-cac-kb">1</span>
          <span class="civ-cac-act-lbl">${modalIcon('imp-fort', 18)}OBLEGAJ</span>
          <span class="civ-cac-act-desc">Obóz na mapie · głód garnizonu · czas na machiny oblężnicze</span>
        </button>
        <button type="button" class="civ-cac-act storm" data-act="storm">
          <span class="civ-cac-kb">2</span>
          <span class="civ-cac-act-lbl">${modalIcon('dip-war', 18)}SZTURM</span>
          <span class="civ-cac-act-desc">Bitwa 3D od razu · mur jako przeszkoda</span>
        </button>
      </div>
      <div class="civ-cac-btns">
        <button type="button" class="civ-cac-cancel" data-act="cancel">${modalIcon('ui-close', 14)}Wycofaj</button>
      </div>
      <div class="civ-cac-keys"><b>1</b> = Oblegaj · <b>2</b> = Szturm · <b>Esc</b> = Wycofaj</div>
    </div>
  `;

  box.querySelector('[data-act="siege"]')?.addEventListener('click', () => pickAction(actions.onSiege));
  box.querySelector('[data-act="storm"]')?.addEventListener('click', () => pickAction(actions.onStorm));
  box.querySelector('[data-act="cancel"]')?.addEventListener('click', () => pickAction(actions.onCancel));

  root.appendChild(box);
  document.body.appendChild(root);
  attachKeyboard(actions);
}

export function isCityAttackChoiceOpen(): boolean {
  return root !== null;
}
