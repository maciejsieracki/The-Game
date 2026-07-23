/**
 * wondersView.ts — pełnoekranowy ekran „Cuda świata” (TEMAT #16).
 * 1:1 wg makiety KANON: docs/ux/claude-design/.../mockupy/The Game - Cuda swiata v1 (1E).dc.html
 * Pasma wg epoki wejścia (Kamień/Brąz/Żelazo) → karty → karta szczegółów → Esc zamyka.
 * Czysta prezentacja: dane (VM) i akcje przychodzą z main.ts (silnik cudów bez zmian).
 */

export type WonderCardState =
  | 'available'
  | 'locked'
  | 'exclusive_other'
  | 'building'
  | 'built_mine'
  | 'built_other'
  | 'lost';

export interface WonderCardVM {
  id: string;
  nazwa: string;
  dostep: 'E' | 'R';
  accessLabel: string;
  state: WonderCardState;
  badgeLabel: string;
  reqLabel: string;
  costLabel: string;
  effectsLabel: string;
  progressPct?: number;
  whyLocked?: string;
}

export interface WonderEpochBand {
  epoch: 1 | 2 | 3;
  label: string;
  accentColor: string;
  iconSvg: string;
  sub: string;
  cards: WonderCardVM[];
}

export interface WonderDetailRow {
  label: string;
  html: string;
}

export interface WonderDetailVM {
  id: string;
  nazwa: string;
  subtitle: string;
  state: WonderCardState;
  badgeLabel: string;
  borderColor: string;
  rows: WonderDetailRow[];
  footerHtml?: string;
  footerColor?: string;
  /** Etykieta CTA głównego (np. „Wybierz hex budowy”) — obecność = pokaż przycisk. */
  ctaBuildLabel?: string;
  ctaShowOnMap?: boolean;
}

export interface WondersViewConfig {
  getSubtitle: () => string;
  getBands: () => WonderEpochBand[];
  getDetail: (id: string) => WonderDetailVM | null;
  onBuild: (id: string) => void;
  onShowOnMap: (id: string) => void;
  onClose?: () => void;
}

export interface WondersViewApi {
  el: HTMLDivElement;
  isOpen: () => boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-wonders-view-css-v1';

const STATE_BADGE_CLASS: Record<WonderCardState, string> = {
  available: 'cw-stb-av',
  locked: 'cw-stb-lk',
  exclusive_other: 'cw-stb-forx',
  building: 'cw-stb-ip',
  built_mine: 'cw-stb-own',
  built_other: 'cw-stb-bfor',
  lost: 'cw-stb-lost',
};

const CARD_STATE_CLASS: Record<WonderCardState, string> = {
  available: 'cw-wc-av',
  locked: 'cw-wc-lk',
  exclusive_other: 'cw-wc-forx',
  building: 'cw-wc-ip',
  built_mine: 'cw-wc-own',
  built_other: 'cw-wc-forx',
  lost: 'cw-wc-lost',
};

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-wonders-view{position:fixed;inset:0;z-index:500;display:none;flex-direction:column;
  background:#05070b;color:#e8e0c8;font-family:'Segoe UI',Tahoma,sans-serif;}
.civ-wonders-view.open{display:flex;}
.civ-wonders-view .cw-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:14px 20px 34px;}
.civ-wonders-view .cw-wrap{max-width:1560px;margin:0 auto;}
.civ-wonders-view .cw-caption{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px;margin:0 2px 12px;}
.civ-wonders-view .cw-caption h1{font-family:Georgia,serif;font-size:20px;font-weight:600;color:#e8d88a;
  letter-spacing:.02em;margin:0;}
.civ-wonders-view .cw-caption .cw-sub{font-size:12px;color:#8a8070;flex:1;min-width:200px;}
.civ-wonders-view .cw-close{border:2px solid rgba(232,216,138,.4);color:#e8d88a;background:linear-gradient(180deg,#161c28,#0a0d14);
  border-radius:9px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;}
.civ-wonders-view .cw-close:hover{border-color:#e8d88a;box-shadow:0 0 10px rgba(232,216,138,.3);}
.civ-wonders-view .cw-stage{position:relative;border-radius:14px;overflow:hidden;border:1px solid rgba(232,216,138,.25);
  background:radial-gradient(1200px 700px at 50% 0%,#10141f,#080a12 75%);box-shadow:0 10px 34px rgba(0,0,0,.55);}
.civ-wonders-view .cw-legend{display:flex;align-items:center;gap:16px;padding:12px 20px;flex-wrap:wrap;
  border-bottom:1px solid rgba(232,216,138,.2);background:linear-gradient(90deg,rgba(232,216,138,.08),transparent 45%);}
.civ-wonders-view .cw-legend .cw-lgd{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.civ-wonders-view .cw-legend .cw-m{font-size:11px;color:#8a8070;}
.civ-wonders-view .cw-stb{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;border-radius:999px;padding:2px 9px;white-space:nowrap;}
.civ-wonders-view .cw-stb-av{color:#f4e6a8;border:1px solid #f4e6a8;background:rgba(232,216,138,.1);box-shadow:0 0 8px rgba(232,216,138,.3);}
.civ-wonders-view .cw-stb-lk{color:#c88a7a;border:1px solid rgba(200,138,122,.5);background:rgba(200,90,70,.07);}
.civ-wonders-view .cw-stb-ip{color:#8fb6e0;border:1px solid rgba(143,182,224,.6);background:rgba(58,106,208,.1);}
.civ-wonders-view .cw-stb-own{color:#2e2708;border:1px solid #f8eea8;background:linear-gradient(180deg,#f0dc88,#c9a938);}
.civ-wonders-view .cw-stb-lost{color:#ff9b8a;border:1px solid rgba(200,90,70,.55);background:rgba(200,64,64,.12);}
.civ-wonders-view .cw-stb-forx{color:#8a8070;border:1px solid rgba(140,128,112,.4);background:rgba(255,255,255,.02);}
.civ-wonders-view .cw-stb-bfor{color:#c8b898;border:1px solid rgba(232,216,138,.35);background:rgba(232,216,138,.06);}
.civ-wonders-view .cw-band{padding:14px 20px 18px;}
.civ-wonders-view .cw-bh{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.civ-wonders-view .cw-bh img,.civ-wonders-view .cw-bh svg{width:22px;height:22px;flex-shrink:0;}
.civ-wonders-view .cw-bh .cw-bt{font-family:Georgia,serif;font-size:14px;letter-spacing:.16em;text-transform:uppercase;}
.civ-wonders-view .cw-bh .cw-bs{font-size:10.5px;color:#8a8070;letter-spacing:.04em;white-space:nowrap;}
.civ-wonders-view .cw-bh::after{content:"";flex:1;height:1px;background:rgba(232,216,138,.14);}
.civ-wonders-view .cw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;}
.civ-wonders-view .cw-wc{position:relative;border-radius:11px;padding:10px 12px 9px;display:flex;flex-direction:column;gap:5px;
  background:linear-gradient(180deg,rgba(24,30,42,.94),rgba(10,13,20,.96));border:1.5px solid rgba(232,216,138,.24);
  box-shadow:0 3px 10px rgba(0,0,0,.4);text-align:left;font:inherit;color:inherit;cursor:pointer;}
.civ-wonders-view .cw-wc .cw-r1{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
.civ-wonders-view .cw-wc .cw-wn{font-family:Georgia,serif;font-size:14px;color:#e8d88a;line-height:1.2;}
.civ-wonders-view .cw-wc .cw-acc{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;border-radius:5px;padding:1px 7px;white-space:nowrap;align-self:flex-start;
  color:#c8a878;border:1px solid rgba(200,168,120,.4);background:rgba(200,168,120,.07);}
.civ-wonders-view .cw-wc .cw-acc.cw-race{color:#8fc9a0;border-color:rgba(122,208,160,.4);background:rgba(122,208,160,.07);}
.civ-wonders-view .cw-wc .cw-req{font-size:10px;color:#c8b898;line-height:1.35;}
.civ-wonders-view .cw-wc .cw-req b{color:#e8e0c8;font-weight:600;}
.civ-wonders-view .cw-wc .cw-cost{font-size:10px;color:#8a8070;font-variant-numeric:tabular-nums;}
.civ-wonders-view .cw-wc .cw-cost b{color:#e8d88a;font-weight:700;}
.civ-wonders-view .cw-wc .cw-eff{font-size:9.5px;color:#8a8070;line-height:1.4;border-top:1px solid rgba(232,216,138,.12);
  padding-top:5px;margin-top:1px;}
.civ-wonders-view .cw-wc .cw-why{font-size:9.5px;color:#c88a7a;}
.civ-wonders-view .cw-wc .cw-prg{height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;}
.civ-wonders-view .cw-wc .cw-prg i{display:block;height:100%;background:linear-gradient(90deg,#3a6ad0,#8fb6e0);}
.civ-wonders-view .cw-wc-av{border-color:#f4e6a8;box-shadow:0 0 14px rgba(232,216,138,.3),0 3px 10px rgba(0,0,0,.4);}
.civ-wonders-view .cw-wc-ip{border-color:#8fb6e0;box-shadow:0 0 10px rgba(58,106,208,.3),0 3px 10px rgba(0,0,0,.4);}
.civ-wonders-view .cw-wc-own{border-color:rgba(232,216,138,.6);background:linear-gradient(180deg,rgba(46,42,24,.92),rgba(20,17,10,.96));}
.civ-wonders-view .cw-wc-lost{border-color:rgba(200,90,70,.45);background:linear-gradient(180deg,rgba(38,18,16,.9),rgba(16,10,10,.95));}
.civ-wonders-view .cw-wc-lk{opacity:.8;cursor:pointer;}
.civ-wonders-view .cw-wc-forx{opacity:.62;cursor:default;}
.civ-wonders-view .cw-wc:hover:not(.cw-wc-forx){filter:brightness(1.05);}
.civ-wonders-view .cw-foot{margin:16px 2px 0;display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;font-size:11.5px;color:#8a8070;}
.civ-wonders-view .cw-foot b{color:#e8d88a;font-weight:600;}
.civ-wonders-view .cw-foot .cw-badge{font-size:10px;color:#0c1018;background:linear-gradient(180deg,#ffe08a,#e0b24a);
  border-radius:999px;padding:1px 8px;font-weight:700;white-space:nowrap;}
/* --- karta szczegółów (modal) --- */
.civ-wonders-view .cw-backdrop{position:fixed;inset:0;z-index:10;background:rgba(2,3,6,.72);
  display:none;align-items:center;justify-content:center;padding:20px;}
.civ-wonders-view .cw-backdrop.open{display:flex;}
.civ-wonders-view .cw-tt{width:min(420px,94vw);border-radius:12px;border:2px solid rgba(232,216,138,.5);
  background:linear-gradient(180deg,rgba(22,28,38,.99),rgba(8,10,16,.99));box-shadow:0 18px 44px rgba(0,0,0,.7);overflow:hidden;}
.civ-wonders-view .cw-tt .cw-h{padding:12px 15px 10px;border-bottom:1px solid rgba(232,216,138,.2);
  background:linear-gradient(90deg,rgba(232,216,138,.1),transparent);}
.civ-wonders-view .cw-tt .cw-h .cw-r1{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.civ-wonders-view .cw-tt .cw-h b{font-family:Georgia,serif;font-size:16px;color:#e8d88a;font-weight:600;}
.civ-wonders-view .cw-tt .cw-h .cw-sub{font-size:10.5px;color:#8a8070;margin-top:3px;}
.civ-wonders-view .cw-tt .cw-b{padding:11px 15px;display:flex;flex-direction:column;gap:9px;}
.civ-wonders-view .cw-row{display:flex;align-items:flex-start;gap:10px;font-size:12px;line-height:1.4;}
.civ-wonders-view .cw-row .cw-k{color:#8a8070;min-width:72px;letter-spacing:.04em;text-transform:uppercase;font-size:9.5px;
  font-weight:700;padding-top:2px;flex-shrink:0;}
.civ-wonders-view .cw-row .cw-v{color:#e8e0c8;flex:1;font-variant-numeric:tabular-nums;}
.civ-wonders-view .cw-dep{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;border-radius:6px;padding:3px 9px;
  white-space:nowrap;margin:1px 3px 1px 0;}
.civ-wonders-view .cw-dep-ok{color:#7ad0a0;border:1px solid rgba(122,208,160,.35);background:rgba(122,208,160,.06);}
.civ-wonders-view .cw-dep-no{color:#ff9b8a;border:1px solid rgba(200,90,70,.4);background:rgba(200,90,70,.07);}
.civ-wonders-view .cw-tt .cw-ft{padding:9px 15px;border-top:1px solid rgba(232,216,138,.16);font-size:10px;color:#8a8070;
  background:rgba(232,216,138,.03);display:flex;justify-content:center;gap:8px;flex-wrap:wrap;}
.civ-wonders-view .cw-btn{border-radius:9px;padding:8px 15px;font-size:11px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;white-space:nowrap;cursor:pointer;display:inline-flex;align-items:center;gap:7px;
  border:2px solid rgba(232,216,138,.4);color:#e8d88a;background:linear-gradient(180deg,#161c28,#0a0d14);}
.civ-wonders-view .cw-btn:hover{border-color:#e8d88a;box-shadow:0 0 10px rgba(232,216,138,.3);}
.civ-wonders-view .cw-btn-primary{border:1px solid #6a5212;border-top-color:#f8eea8;color:#2e2708;
  background:linear-gradient(180deg,#f0dc88,#b99a28);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 18px rgba(232,216,138,.22);}
.civ-wonders-view .cw-btn-primary:hover{filter:brightness(1.07);}
.civ-wonders-view .cw-close-x{position:absolute;top:14px;right:16px;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

let api: WondersViewApi | null = null;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cardHtml(c: WonderCardVM): string {
  const raceTag = c.dostep === 'R' ? ' cw-race' : '';
  let extra = '';
  if (c.state === 'building' && c.progressPct != null) {
    extra += `<div class="cw-prg"><i style="width:${Math.max(0, Math.min(100, c.progressPct))}%"></i></div>`;
  }
  if (c.whyLocked) {
    extra += `<div class="cw-why">${esc(c.whyLocked)}</div>`;
  }
  return `<button type="button" class="cw-wc ${CARD_STATE_CLASS[c.state]}" data-wonder-id="${esc(c.id)}">
    <div class="cw-r1"><span class="cw-wn">${esc(c.nazwa)}</span>
      <span class="cw-stb ${STATE_BADGE_CLASS[c.state]}">${esc(c.badgeLabel)}</span></div>
    <span class="cw-acc${raceTag}">${esc(c.accessLabel)}</span>
    <div class="cw-req">${c.reqLabel}</div>
    <div class="cw-cost">${c.costLabel}</div>
    ${extra}
    <div class="cw-eff">${esc(c.effectsLabel)}</div>
  </button>`;
}

function bandHtml(b: WonderEpochBand): string {
  return `<div class="cw-band">
    <div class="cw-bh">${b.iconSvg}<span class="cw-bt" style="color:${b.accentColor}">${esc(b.label)}</span>
      <span class="cw-bs">${esc(b.sub)}</span></div>
    <div class="cw-grid">${b.cards.map(cardHtml).join('')}</div>
  </div>`;
}

function detailHtml(d: WonderDetailVM): string {
  const rows = d.rows.map(r =>
    `<div class="cw-row"><span class="cw-k">${esc(r.label)}</span><span class="cw-v">${r.html}</span></div>`,
  ).join('');
  const btns: string[] = [];
  if (d.ctaBuildLabel) {
    btns.push(`<button type="button" class="cw-btn cw-btn-primary" data-act="build">${esc(d.ctaBuildLabel)}</button>`);
  }
  if (d.ctaShowOnMap) {
    btns.push('<button type="button" class="cw-btn" data-act="showmap">Pokaż na mapie</button>');
  }
  btns.push('<button type="button" class="cw-btn" data-act="close">Zamknij</button>');
  const footer = d.footerHtml
    ? `<div class="cw-ft" style="color:${d.footerColor ?? '#8a8070'}">${d.footerHtml}</div>`
    : '';
  return `<div class="cw-backdrop open" data-act="backdrop">
    <div class="cw-tt" style="border-color:${d.borderColor}" data-stop="1">
      <div class="cw-h"><div class="cw-r1"><b>${esc(d.nazwa)}</b>
        <span class="cw-stb ${STATE_BADGE_CLASS[d.state]}">${esc(d.badgeLabel)}</span></div>
        <div class="cw-sub">${esc(d.subtitle)}</div></div>
      <div class="cw-b">${rows}</div>
      ${footer}
      <div class="cw-ft">${btns.join('')}</div>
    </div>
  </div>`;
}

export function createWondersView(config: WondersViewConfig): WondersViewApi {
  ensureStyles();
  if (api !== null) api.destroy();

  const el = document.createElement('div');
  el.className = 'civ-wonders-view';
  document.body.appendChild(el);

  let open = false;
  let selectedId: string | null = null;

  function closeView(): void {
    if (!open) return;
    open = false;
    selectedId = null;
    el.classList.remove('open');
    document.removeEventListener('keydown', onEsc);
    config.onClose?.();
  }

  function onEsc(ev: KeyboardEvent): void {
    if (ev.key !== 'Escape') return;
    ev.preventDefault();
    if (selectedId !== null) {
      selectedId = null;
      render();
      return;
    }
    closeView();
  }

  function render(): void {
    const bands = config.getBands();
    let html = `<div class="cw-scroll"><div class="cw-wrap">
      <div class="cw-caption"><h1>Cuda świata</h1>
        <span class="cw-sub">${esc(config.getSubtitle())}</span>
        <button type="button" class="cw-close" data-act="close-view">Zamknij (Esc)</button></div>
      <div class="cw-stage">
        <div class="cw-legend">
          <span class="cw-m">hex w terytorium · koszt = Praca · bonus miasta działa × każde miasto</span>
          <span class="cw-lgd">
            <span class="cw-stb cw-stb-av">Dostępny</span>
            <span class="cw-stb cw-stb-lk">Zablokowany</span>
            <span class="cw-stb cw-stb-ip">W budowie</span>
            <span class="cw-stb cw-stb-own">Nasz ✓</span>
            <span class="cw-stb cw-stb-lost">Przepadł</span>
            <span class="cw-stb cw-stb-forx">Ekskluzywny / cudzy</span>
          </span>
        </div>
        ${bands.map(bandHtml).join('')}
      </div>
      <div class="cw-foot">
        <span><span class="cw-badge">KANON v1</span></span>
        <span><b>Max 1 na świecie</b> — znika po zbudowaniu przez kogokolwiek</span>
        <span><b>Bonus miasta</b> × każde miasto</span>
        <span><b>Po Średniowieczu</b> bonusy wygasają — cud = atrakcja (+10 handel, utrz. ÷2)</span>
      </div>
    </div></div>`;

    if (selectedId !== null) {
      const d = config.getDetail(selectedId);
      if (d) html += detailHtml(d);
      else selectedId = null;
    }

    el.innerHTML = html;

    el.querySelectorAll('[data-wonder-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).getAttribute('data-wonder-id');
        if (id === null) return;
        selectedId = id;
        render();
      });
    });
    const closeViewBtn = el.querySelector('[data-act="close-view"]');
    closeViewBtn?.addEventListener('click', () => closeView());
    const backdrop = el.querySelector('[data-act="backdrop"]');
    backdrop?.addEventListener('click', (ev) => {
      if (ev.target === backdrop) { selectedId = null; render(); }
    });
    el.querySelector('[data-act="close"]')?.addEventListener('click', () => { selectedId = null; render(); });
    el.querySelector('[data-act="build"]')?.addEventListener('click', () => {
      if (selectedId !== null) config.onBuild(selectedId);
    });
    el.querySelector('[data-act="showmap"]')?.addEventListener('click', () => {
      if (selectedId !== null) config.onShowOnMap(selectedId);
    });
  }

  function show(): void {
    open = true;
    selectedId = null;
    render();
    el.classList.add('open');
    document.addEventListener('keydown', onEsc);
  }

  function hide(): void { closeView(); }
  function toggle(): void { if (open) closeView(); else show(); }
  function update(): void { if (open) render(); }

  function destroy(): void {
    document.removeEventListener('keydown', onEsc);
    el.remove();
    if (api?.el === el) api = null;
  }

  api = { el, isOpen: () => open, show, hide, toggle, update, destroy };
  return api;
}

export function isWondersViewOpen(): boolean { return api?.isOpen() ?? false; }
export function showWondersView(): void { api?.show(); }
export function hideWondersView(): void { api?.hide(); }
export function toggleWondersView(): void { api?.toggle(); }
export function refreshWondersViewIfOpen(): void { api?.update(); }
export function destroyWondersView(): void { api?.destroy(); api = null; }
