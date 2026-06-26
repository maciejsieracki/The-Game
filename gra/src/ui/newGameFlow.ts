/**
 * newGameFlow.ts
 * New-game wizard (UI task 5) — port of Makieta-flow-nowa-gra.html.
 * 5 kroki: Intro -> Cywilizacja -> Epoka -> Ustawienia -> Generowanie.
 *
 * Visual language: dark + gold, Palatino serif (jak menu glowne / makieta).
 * DECOUPLED: lista cywilizacji z danych gry (civs.json przez loader), reszta to
 * UI + jeden callback onStart(params).  Co robi onStart (generacja mapy, start
 * rozgrywki) = silnik.
 *
 * LANE: src/ui/* only.  Wpiecie (showNewGameFlow z menu "Nowa Gra", a onStart ->
 * generacja + przejscie do mapy) robi SILNIK.
 *
 * UWAGA: ustawienia rozgrywki (trudnosc/mapa/rywale/predkosc) ladowane z
 * ui-params.json (sekcja nowa_gra) przez UI_PARAMS.
 *
 * Source: literalny UTF-8 dla polskich napisow; symbole przez encje HTML.
 */

import { loadGameData, type GameData } from '../data/loader';
import { UI_PARAMS } from './uiParams';

// ---------------------------------------------------------------------------
// Typy publiczne
// ---------------------------------------------------------------------------

export interface CivOption {
  id: string;
  name: string;
  styl?: string;
  superJednostka?: string;
  bonusy?: string[];
  religia?: string;
  typGlowny?: string;
}

export interface NewGameParams {
  civId: string;
  civName: string;
  epoch: string;
  difficulty: string;
  mapSize: string;
  rivals: string;
  speed: string;
  seed: number;
}

export interface NewGameFlowConfig {
  data?: GameData;
  /** Nadpisanie listy cywilizacji; domyslnie z data.civs. */
  getCivs?: () => CivOption[];
  /** Silnik startuje gre z wybranymi parametrami. */
  onStart: (params: NewGameParams) => void;
  /** Powrot do menu glownego (przycisk Wstecz na kroku 1). */
  onCancel?: () => void;
}

let cfg: NewGameFlowConfig | null = null;

// ---------------------------------------------------------------------------
// Dane
// ---------------------------------------------------------------------------

let cachedData: GameData | null = null;
function gameData(): GameData | null {
  if (cfg && cfg.data) return cfg.data;
  if (cachedData) return cachedData;
  try { cachedData = loadGameData(); } catch { cachedData = null; }
  return cachedData;
}

function civsFromData(data: GameData): CivOption[] {
  const list = data.civs && data.civs.cywilizacje ? data.civs.cywilizacje : [];
  return list
    .filter(c => !!c.Cywilizacja)
    .map(c => {
      const raw = c as unknown as Record<string, unknown>;
      const religia = typeof raw['Religia'] === 'string' ? raw['Religia'] : undefined;
      const typGlowny = typeof raw['Typ główny'] === 'string' ? raw['Typ główny'] : undefined;
      return {
        id: c.Cywilizacja,
        name: c.Cywilizacja,
        styl: c['Styl / charakter'] ?? undefined,
        superJednostka: c['Jednostka specjalna'] ?? undefined,
        bonusy: [c['Bonus startowy'], c['Bonusy/minusy (do dopracowania)']].filter((x): x is string => typeof x === 'string' && x.trim().length > 0),
        religia,
        typGlowny,
      };
    });
}

function civs(): CivOption[] {
  if (cfg && cfg.getCivs) return cfg.getCivs();
  const data = gameData();
  return data ? civsFromData(data) : [];
}

interface EpochOption { id: string; name: string; flavor: string; avail: boolean; badge: string; }
const EPOCHS: EpochOption[] = [
  { id: 'kamien', name: 'Epoka Kamienia', flavor: 'Pierwsze osady, kamienne narzedzia. Fundamenty imperium.', avail: true, badge: 'Dostepna' },
  { id: 'braz', name: 'Epoka Brazu', flavor: 'Metalurgia i pierwsze armie. Rydwany, mury, wczesna dyplomacja.', avail: true, badge: 'Dostepna' },
  { id: 'zelazo', name: 'Epoka Zelaza', flavor: 'Hartowane ostrza, potezne legiony, szlaki handlowe.', avail: false, badge: 'Wkrotce' },
];

interface Setting { key: string; lbl: string; opts: string[]; descs: string[]; idx: number; }
const SETT: Setting[] = UI_PARAMS.nowa_gra.ustawienia.map(s => ({
  key: s.key,
  lbl: s.label,
  opts: s.opts,
  descs: s.descs,
  idx: s.domyslny,
}));

// ---------------------------------------------------------------------------
// Stan
// ---------------------------------------------------------------------------

let rootEl: HTMLDivElement | null = null;
let curStep = 1;
let selCiv: string | null = null;
let selEpoch = 'kamien';

// ---------------------------------------------------------------------------
// Style (scoped .civ-newgame)
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-newgame-css';
function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-newgame{position:fixed;inset:0;z-index:500;overflow:auto;
  --gold:#C9A84C;--gold-light:#E8C97A;--gold-dim:#7A6030;--bg-deep:#0A0A0F;--bg-card:#1A1A26;--bg-card-h:#222235;--bg-sel:#1E1A0A;
  --bd-sub:rgba(201,168,76,0.18);--bd-mid:rgba(201,168,76,0.38);--bd-strong:rgba(201,168,76,0.65);
  --tx:#F0E8D0;--tx2:#A09070;--tx-muted:#554E3A;--radius:6px;--radius-lg:10px;
  background:var(--bg-deep);color:var(--tx);font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;
  display:flex;flex-direction:column;}
.civ-newgame *{box-sizing:border-box;}
.civ-newgame .hdr{text-align:center;padding:1.8rem 2rem 1rem;border-bottom:1px solid var(--bd-sub);}
.civ-newgame .hdr .lab{font-size:10px;letter-spacing:.5em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .hdr h1{font-size:34px;font-weight:400;letter-spacing:.18em;color:var(--gold-light);text-shadow:0 0 50px rgba(201,168,76,.28);margin-top:4px;}
.civ-newgame .stepbar{display:flex;align-items:center;justify-content:center;padding:1rem;background:#12121A;border-bottom:1px solid var(--bd-sub);flex-wrap:wrap;}
.civ-newgame .si{display:flex;align-items:center;cursor:pointer;}
.civ-newgame .si-b{display:flex;align-items:center;gap:8px;padding:5px 14px;border-radius:20px;border:1px solid transparent;}
.civ-newgame .si-n{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--tx-muted);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--tx-muted);font-family:Arial,sans-serif;}
.civ-newgame .si-l{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--tx-muted);font-family:Arial,sans-serif;}
.civ-newgame .si.active .si-b{border-color:var(--bd-mid);background:rgba(201,168,76,.08);}
.civ-newgame .si.active .si-n{border-color:var(--gold);background:var(--gold);color:#0A0A0F;font-weight:700;}
.civ-newgame .si.active .si-l{color:var(--gold);}
.civ-newgame .si.done .si-n{border-color:var(--gold-dim);color:var(--gold-dim);}
.civ-newgame .si-c{width:26px;height:1px;background:var(--bd-sub);margin:0 3px;}
.civ-newgame .content{flex:1;padding:2rem;max-width:1000px;width:100%;margin:0 auto;}
.civ-newgame .sh{text-align:center;margin-bottom:1.6rem;}
.civ-newgame .sh h2{font-size:24px;font-weight:400;letter-spacing:.1em;color:var(--gold-light);}
.civ-newgame .intro{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:360px;text-align:center;gap:1.2rem;}
.civ-newgame .big{font-size:42px;letter-spacing:.2em;color:var(--gold-light);}
.civ-newgame .sub{font-size:11px;letter-spacing:.4em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .intro p{max-width:540px;font-size:14px;line-height:1.7;color:var(--tx2);font-style:italic;}
.civ-newgame .civ-layout{display:grid;grid-template-columns:1fr 320px;gap:1.4rem;}
.civ-newgame .civ-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;align-content:start;}
.civ-newgame .card{background:var(--bg-card);border:1.5px solid var(--bd-sub);border-radius:var(--radius-lg);padding:14px 8px;text-align:center;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;transition:all .15s;}
.civ-newgame .card:hover{border-color:var(--bd-mid);background:var(--bg-card-h);}
.civ-newgame .card.sel{border-color:var(--gold);background:var(--bg-sel);}
.civ-newgame .em{width:50px;height:50px;border-radius:50%;border:1.5px solid var(--bd-mid);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--gold-light);background:rgba(0,0,0,.3);}
.civ-newgame .card.sel .em{border-color:var(--gold);background:rgba(201,168,76,.1);}
.civ-newgame .cn{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .card.sel .cn{color:var(--gold);}
.civ-newgame .detail{background:var(--bg-card);border:1px solid var(--bd-sub);border-radius:var(--radius-lg);padding:1.3rem;min-height:320px;}
.civ-newgame .detail .empty{color:var(--tx-muted);font-style:italic;font-size:13px;text-align:center;padding-top:3rem;}
.civ-newgame .dn{font-size:19px;letter-spacing:.1em;color:var(--gold-light);margin-bottom:.5rem;}
.civ-newgame .bonus{font-size:13px;color:var(--tx2);line-height:1.5;margin:.3rem 0;padding-left:12px;position:relative;}
.civ-newgame .bonus::before{content:'\\2022';position:absolute;left:0;color:var(--gold-dim);}
.civ-newgame .su{margin-top:.8rem;background:rgba(201,168,76,.06);border:1px solid var(--bd-mid);border-radius:var(--radius);padding:9px 12px;}
.civ-newgame .su .l{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .su .v{font-size:14px;color:var(--gold-light);}
.civ-newgame .epoch-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;max-width:780px;margin:0 auto;}
.civ-newgame .ec{background:var(--bg-card);border:1.5px solid var(--bd-sub);border-radius:var(--radius-lg);padding:20px 16px;text-align:center;cursor:pointer;display:flex;flex-direction:column;gap:8px;align-items:center;}
.civ-newgame .ec.sel{border-color:var(--gold);background:var(--bg-sel);}
.civ-newgame .ec.lock{opacity:.35;cursor:not-allowed;}
.civ-newgame .ec .en{font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .ec.sel .en{color:var(--gold);}
.civ-newgame .ec .bdg{font-size:10px;letter-spacing:.2em;text-transform:uppercase;font-family:Arial,sans-serif;padding:3px 10px;border-radius:12px;border:1px solid var(--gold-dim);color:var(--gold-dim);}
.civ-newgame .ec .fl{font-size:12px;color:var(--tx2);font-style:italic;line-height:1.5;}
.civ-newgame .sett-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;max-width:700px;margin:0 auto;}
.civ-newgame .srow{background:var(--bg-card);border:1px solid var(--bd-sub);border-radius:var(--radius-lg);padding:14px 16px;}
.civ-newgame .sl{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx2);font-family:Arial,sans-serif;margin-bottom:8px;}
.civ-newgame .sctl{display:flex;align-items:center;gap:10px;}
.civ-newgame .arr{width:28px;height:28px;border:1px solid var(--bd-mid);background:transparent;color:var(--gold);cursor:pointer;border-radius:4px;font-size:15px;font-family:Arial,sans-serif;}
.civ-newgame .arr:hover{border-color:var(--gold);background:rgba(201,168,76,.1);}
.civ-newgame .sv{flex:1;text-align:center;font-size:15px;}
.civ-newgame .sv .d{display:block;font-size:10px;color:var(--tx-muted);font-style:italic;font-family:Arial,sans-serif;margin-top:2px;}
.civ-newgame .gen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:340px;gap:1.2rem;text-align:center;}
.civ-newgame .ring{width:70px;height:70px;border-radius:50%;border:2px solid var(--bd-sub);border-top-color:var(--gold);animation:cng-spin 1.3s linear infinite;}
@keyframes cng-spin{to{transform:rotate(360deg);}}
.civ-newgame .gt{font-size:24px;color:var(--gold-light);letter-spacing:.12em;}
.civ-newgame .gp{background:var(--bg-card);border:1px solid var(--bd-sub);border-radius:var(--radius-lg);padding:1rem 1.5rem;text-align:left;max-width:420px;width:100%;}
.civ-newgame .pr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(201,168,76,.06);font-size:13px;}
.civ-newgame .pr .k{color:var(--tx2);font-family:Arial,sans-serif;}
.civ-newgame .pr .v{color:var(--gold);}
.civ-newgame .nav{padding:1.1rem 2rem;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--bd-sub);background:#12121A;max-width:1000px;width:100%;margin:0 auto;}
.civ-newgame .nb{padding:10px 26px;border-radius:var(--radius);font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-family:Arial,sans-serif;cursor:pointer;}
.civ-newgame .nb.back{background:transparent;border:1px solid var(--bd-mid);color:var(--tx2);}
.civ-newgame .nb.next{background:rgba(201,168,76,.1);border:1.5px solid var(--bd-strong);color:var(--gold-light);}
.civ-newgame .nb:disabled{opacity:.3;cursor:not-allowed;}
.civ-newgame .ni{font-size:11px;color:var(--tx-muted);font-family:Arial,sans-serif;letter-spacing:.15em;text-transform:uppercase;}
.civ-newgame .cta{padding:12px 40px;border:1.5px solid var(--gold-dim);color:var(--gold);background:transparent;font-size:12px;letter-spacing:.25em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);font-family:Arial,sans-serif;}
.civ-newgame .cta:hover{border-color:var(--gold);background:rgba(201,168,76,.1);color:var(--gold-light);}
.civ-newgame .start{background:linear-gradient(135deg,rgba(201,168,76,.22),rgba(201,168,76,.1));border:1.5px solid var(--gold);color:var(--gold-light);font-size:14px;letter-spacing:.3em;text-transform:uppercase;padding:13px 50px;cursor:pointer;border-radius:var(--radius);font-family:Arial,sans-serif;margin:1.4rem auto 0;display:block;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function el(tag: string, cls?: string, html?: string): HTMLElement {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

const STEP_LABELS = ['Intro', 'Cywilizacja', 'Epoka', 'Ustawienia', 'Start'];

function selectedCiv(): CivOption | null {
  return civs().find(c => c.id === selCiv) ?? null;
}

function renderCivStep(host: HTMLElement): void {
  const layout = el('div', 'civ-layout');
  const grid = el('div', 'civ-grid');
  for (const c of civs()) {
    const card = el('div', 'card' + (selCiv === c.id ? ' sel' : ''));
    card.innerHTML = '<div class="em">' + (c.name.charAt(0) || '?') + '</div><div class="cn">' + c.name + '</div>';
    card.addEventListener('click', () => { selCiv = c.id; render(); });
    grid.appendChild(card);
  }
  if (civs().length === 0) grid.appendChild(el('div', 'cn', 'Brak danych cywilizacji (civs.json).'));
  const detail = el('div', 'detail');
  const c = selectedCiv();
  if (!c) {
    detail.appendChild(el('div', 'empty', '&#8592; Wybierz cywilizacje, aby zobaczyc bonusy i jednostke specjalna.'));
  } else {
    detail.appendChild(el('div', 'dn', c.name));
    if (c.typGlowny) detail.appendChild(el('div', 'bonus muted', 'Typ: ' + c.typGlowny));
    if (c.religia) detail.appendChild(el('div', 'bonus muted', 'Religia: ' + c.religia));
    if (c.styl) detail.appendChild(el('div', 'bonus', c.styl));
    for (const b of (c.bonusy ?? [])) detail.appendChild(el('div', 'bonus', b));
    if (c.superJednostka) detail.appendChild(el('div', 'su', '<div class="l">&#9670; Jednostka specjalna</div><div class="v">' + c.superJednostka + '</div>'));
  }
  layout.appendChild(grid);
  layout.appendChild(detail);
  host.appendChild(layout);
}

function renderEpochStep(host: HTMLElement): void {
  const grid = el('div', 'epoch-grid');
  for (const e of EPOCHS) {
    const ec = el('div', 'ec' + (e.avail ? (selEpoch === e.id ? ' sel' : '') : ' lock'));
    ec.innerHTML = '<div class="en">' + e.name + '</div><div class="bdg">' + e.badge + '</div><div class="fl">' + e.flavor + '</div>';
    if (e.avail) ec.addEventListener('click', () => { selEpoch = e.id; render(); });
    grid.appendChild(ec);
  }
  host.appendChild(grid);
}

function renderSettStep(host: HTMLElement): void {
  const grid = el('div', 'sett-grid');
  SETT.forEach((s, i) => {
    const row = el('div', 'srow');
    row.innerHTML = '<div class="sl">' + s.lbl + '</div><div class="sctl"></div>';
    const ctl = row.querySelector('.sctl') as HTMLElement;
    const left = el('button', 'arr', '&#8249;');
    const sv = el('div', 'sv');
    sv.innerHTML = (s.opts[s.idx] ?? '') + '<span class="d">' + (s.descs[s.idx] ?? '') + '</span>';
    const right = el('button', 'arr', '&#8250;');
    const ch = (d: number) => { s.idx = (s.idx + d + s.opts.length) % s.opts.length; sv.innerHTML = (s.opts[s.idx] ?? '') + '<span class="d">' + (s.descs[s.idx] ?? '') + '</span>'; };
    left.addEventListener('click', () => ch(-1));
    right.addEventListener('click', () => ch(1));
    ctl.appendChild(left); ctl.appendChild(sv); ctl.appendChild(right);
    grid.appendChild(row);
  });
  host.appendChild(grid);
  const start = el('button', 'start', '&#9670; ROZPOCZNIJ GRE &#9670;');
  start.addEventListener('click', () => { curStep = 5; render(); });
  host.appendChild(start);
}

function settingValue(key: string): string {
  const s = SETT.find(x => x.key === key);
  return s ? (s.opts[s.idx] ?? '') : '';
}

function buildParams(): NewGameParams {
  const c = selectedCiv();
  const ep = EPOCHS.find(e => e.id === selEpoch);
  return {
    civId: selCiv ?? '',
    civName: c ? c.name : '',
    epoch: ep ? ep.name : '',
    difficulty: settingValue('difficulty'),
    mapSize: settingValue('map_size'),
    rivals: settingValue('rival_count'),
    speed: settingValue('game_speed'),
    seed: Math.floor(Math.random() * 1000000),
  };
}

function renderGenStep(host: HTMLElement): void {
  const p = buildParams();
  const wrap = el('div', 'gen');
  wrap.appendChild(el('div', 'ring'));
  wrap.appendChild(el('div', 'gt', 'Generowanie Swiata...'));
  const rows: [string, string][] = [
    ['Cywilizacja', p.civName || '(nie wybrano)'],
    ['Epoka startowa', p.epoch],
    ['Trudnosc', p.difficulty],
    ['Rozmiar mapy', p.mapSize],
    ['Liczba rywali', p.rivals + ' frakcji'],
    ['Predkosc', p.speed],
    ['Seed mapy', '#' + String(p.seed).padStart(6, '0')],
  ];
  const gp = el('div', 'gp');
  gp.innerHTML = rows.map(r => '<div class="pr"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>').join('');
  wrap.appendChild(gp);
  host.appendChild(wrap);
  // przekaz parametry silnikowi (on robi realna generacje + przejscie do mapy)
  if (cfg) cfg.onStart(p);
}

function render(): void {
  if (rootEl === null) return;
  rootEl.innerHTML = '';

  const hdr = el('div', 'hdr', '<div class="lab">Kreator Nowej Gry</div><h1>THE GAME</h1>');
  rootEl.appendChild(hdr);

  const bar = el('div', 'stepbar');
  STEP_LABELS.forEach((lbl, i) => {
    const n = i + 1;
    const si = el('div', 'si' + (n < curStep ? ' done' : n === curStep ? ' active' : ''));
    si.innerHTML = '<div class="si-b"><div class="si-n">' + n + '</div><span class="si-l">' + lbl + '</span></div>';
    if (n < curStep) si.addEventListener('click', () => { curStep = n; render(); });
    bar.appendChild(si);
    if (n < STEP_LABELS.length) bar.appendChild(el('div', 'si-c'));
  });
  rootEl.appendChild(bar);

  const content = el('div', 'content');
  if (curStep === 1) {
    const intro = el('div', 'intro');
    intro.appendChild(el('div', 'big', 'NOWA GRA'));
    intro.appendChild(el('div', 'sub', 'Gra Cywilizacyjna 4X &bull; v0.1 &bull; Kamien &amp; Braz'));
    intro.appendChild(el('p', '', 'Wybierz narod, epoke startowa i reguly rozgrywki. Kazda cywilizacja to inne bonusy, inna jednostka specjalna, inna droga do zwyciestwa.'));
    const cta = el('button', 'cta', 'Rozpocznij konfiguracje &#8594;');
    cta.addEventListener('click', () => { curStep = 2; render(); });
    intro.appendChild(cta);
    content.appendChild(intro);
  } else if (curStep === 2) {
    content.appendChild(el('div', 'sh', '<h2>Wybor Cywilizacji</h2>'));
    renderCivStep(content);
  } else if (curStep === 3) {
    content.appendChild(el('div', 'sh', '<h2>Epoka Startowa</h2>'));
    renderEpochStep(content);
  } else if (curStep === 4) {
    content.appendChild(el('div', 'sh', '<h2>Ustawienia Rozgrywki</h2>'));
    renderSettStep(content);
  } else {
    renderGenStep(content);
  }
  rootEl.appendChild(content);

  // nav (kroki 1-4; krok 5 = generowanie, bez nawigacji)
  if (curStep < 5) {
    const nav = el('div', 'nav');
    const back = el('button', 'nb back', '&#8592; Wstecz');
    back.addEventListener('click', () => {
      if (curStep === 1) { if (cfg && cfg.onCancel) cfg.onCancel(); hideNewGameFlow(); }
      else { curStep -= 1; render(); }
    });
    const info = el('div', 'ni', curStep === 1 ? 'Menu glowne' : 'Krok ' + curStep + ' z 5');
    nav.appendChild(back);
    nav.appendChild(info);
    if (curStep >= 2 && curStep <= 3) {
      const next = el('button', 'nb next', 'Dalej &#8594;') as HTMLButtonElement;
      next.disabled = (curStep === 2 && !selCiv);
      next.addEventListener('click', () => { if (curStep === 2 && !selCiv) return; curStep += 1; render(); });
      nav.appendChild(next);
    } else {
      nav.appendChild(el('div'));
    }
    rootEl.appendChild(nav);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Pokaz kreator nowej gry. */
export function showNewGameFlow(config: NewGameFlowConfig): void {
  cfg = config;
  curStep = 1;
  selCiv = null;
  selEpoch = 'kamien';
  ensureStyles();
  if (rootEl === null) {
    rootEl = document.createElement('div');
    rootEl.className = 'civ-newgame';
    document.body.appendChild(rootEl);
  }
  rootEl.style.display = 'flex';
  render();
}

/** Ukryj kreator nowej gry. */
export function hideNewGameFlow(): void {
  if (rootEl !== null) rootEl.style.display = 'none';
}

/** Czy kreator nowej gry jest otwarty. */
export function isNewGameFlowOpen(): boolean {
  return rootEl !== null && rootEl.style.display !== 'none';
}
