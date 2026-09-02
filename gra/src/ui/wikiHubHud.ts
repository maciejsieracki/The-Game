/**
 * wikiHubHud.ts — Civpedia in-game: Poradnik + Encyklopedia (rev. E bundle).
 */

import wikiBundle from '../data/wikiBundle.json';
import { markdownToHtml } from './markdownLite';
import { wikiBookIcon } from './icons/wikiBookIcon';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import { bindHudPanelOutsideDismiss } from './hudPanelDismiss';
import { SIDE_PANEL_LEFT, SIDE_PANEL_TOP } from './sidePanelLayout';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

export interface WikiHubHudConfig {
  onClose?: () => void;
}

/** Opcje przy otwarciu (np. z menu głównego „O grze”). */
export interface WikiHubShowOptions {
  tab?: Tab;
  /** `overlay` — modal nad menu (z-index > 500); domyślnie panel boczny na mapie. */
  layout?: 'dock' | 'overlay';
  /** Otwórz od razu rozdział poradnika (id z bundle, np. `01-pierwsze-kroki`). */
  openPoradnikId?: string;
}

export interface WikiHubHudApi {
  el: HTMLDivElement;
  isOpen: () => boolean;
  toggle: () => void;
  show: (opts?: WikiHubShowOptions) => void;
  hide: () => void;
  destroy: () => void;
  /**
   * T9 (R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1): otwiera hasło CivPedii z zewnątrz
   * (np. z przyszłej karty encji, T10) po parze (folder, id) zamiast `EncyEntry`.
   * `id` to identyfikator gry (surowy klucz JSON albo pochodny slug — patrz
   * EntityId, sekcja 2 planu) — najpierw sprawdzany przez `gameIds` (mostek dla
   * niejednoznacznych wpisów), potem fallback na `slug === id`. Brak trafienia
   * → no-op (panel się nie otwiera).
   */
  openEncyEntry: (folder: string, id: string) => void;
}

type Tab = 'poradnik' | 'encyklopedia';
type Depth = 's' | 'm' | 'full';

interface PoradnikChapter {
  id: string;
  file: string;
  title: string;
  content: string;
}

interface EncyEntry {
  id: string;
  slug: string;
  folder: string;
  category: string;
  title: string;
  /** T9 (R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1): mostek gra-id — opcjonalne
   * alternatywne identyfikatory z JSON-ów gry (`gra-id` we frontmatterze), dla
   * haseł, gdzie prosty derywowany slug NIE wystarcza (np. warianty kopalni). */
  gameIds: string[];
  wikiS: string;
  wikiM: string;
  full: string;
  /** R-CIVPEDIA-HISTORIA-INFRA-Q1: rys historyczny (sekcja `## Rys historyczny`
   * w źródłowym .md) — dopisywany na końcu widoku 'm'/'full', pominięty w 's'. */
  historia: string;
}

const PORADNIK = wikiBundle.poradnik as PoradnikChapter[];
const ENCY = wikiBundle.encyklopedia as EncyEntry[];

const STYLE_ID = 'civ-wiki-hub-hud-css-w2full';
const TOP_H = SIDE_PANEL_TOP;
const BOTTOM_BAR_H = 56;
/** 340px — ten sam wzorzec co scienceHub / diploList (handoff W-WIKI-1). */
const PANEL_W = 340;
const LEFT_INSET = SIDE_PANEL_LEFT;

function depthMetaLabel(d: Depth): string {
  if (d === 's') return 'Skrót';
  if (d === 'm') return 'Hasło';
  return 'Pełny artykuł';
}

function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-wiki-hub-hud-css-v1')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-wiki-hub{position:fixed;top:${TOP_H};left:${LEFT_INSET};bottom:calc(${BOTTOM_BAR_H}px + 2mm);
  width:min(24vw,${PANEL_W}px);min-width:300px;max-width:calc(100vw - ${LEFT_INSET} - 12px);z-index:405;
  display:none;flex-direction:column;pointer-events:auto;overflow:hidden;
  ${CIV_BRAND_SCOPE_VARS}
  background:linear-gradient(90deg,rgba(6,10,20,0.97) 0%,rgba(8,14,28,0.92) 88%,rgba(8,14,28,0.85) 100%);
  border-right:1px solid rgba(212,175,90,0.28);box-shadow:6px 0 28px rgba(0,0,0,0.45);
  font:14px var(--civ-font-ui);color:#e8ebf0;
  --panel:#1e2430;--border:#2e3848;--muted:#8b97a8;--gold:#e0b24a;--wiki:var(--civ-wiki-accent,#a8c878);}
.civ-wiki-hub.open{display:flex;}
.civ-wiki-hub .wh-head{padding:0.4rem 0.5rem 0.35rem;border-bottom:1px solid var(--border);flex-shrink:0;}
.civ-wiki-hub .wh-title{font-size:0.74em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
  color:var(--wiki);display:flex;justify-content:space-between;align-items:center;gap:0.5em;}
.civ-wiki-hub .wh-title-main{display:inline-flex;align-items:center;gap:0.4em;min-width:0;}
.civ-wiki-hub .wh-title-main .civ-wiki-ic{width:16px;height:16px;flex-shrink:0;}
.civ-wiki-hub .wh-close{background:none;border:none;color:var(--muted);font-size:1.15em;cursor:pointer;padding:0.1em 0.25em;border-radius:4px;line-height:1;}
.civ-wiki-hub .wh-close:hover{color:var(--wiki);background:rgba(168,200,120,0.1);}
.civ-wiki-hub .wh-tabs{display:flex;gap:0.35rem;margin-top:0.35rem;}
.civ-wiki-hub .wh-tab{flex:1;padding:0.35em 0.4em;border-radius:5px;cursor:pointer;border:1px solid var(--border);
  background:rgba(0,0,0,0.25);color:var(--muted);font-size:0.78em;font-weight:600;font-family:inherit;
  transition:background .15s,border-color .15s,color .15s;}
.civ-wiki-hub .wh-tab.on{border-color:rgba(168,200,120,0.5);color:var(--wiki);background:rgba(168,200,120,0.1);}
.civ-wiki-hub .wh-tab:hover:not(.on){border-color:rgba(212,175,90,0.35);color:var(--civ-text-primary);}
.civ-wiki-hub .wh-search{width:100%;margin-top:0.35rem;padding:0.35em 0.45em;border-radius:5px;
  border:1px solid var(--border);background:#121820;color:#e8ebf0;font-size:0.85em;font-family:inherit;box-sizing:border-box;}
.civ-wiki-hub .wh-search:focus{outline:none;border-color:rgba(168,200,120,0.45);}
.civ-wiki-hub .wh-body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;}
.civ-wiki-hub .wh-list{flex:1;overflow-y:auto;padding:0.35rem 0.45rem 0.5rem;}
.civ-wiki-hub .wh-list::-webkit-scrollbar{width:6px;}
.civ-wiki-hub .wh-list::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-wiki-hub .wh-cat{font-size:0.68em;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
  color:var(--muted);margin:0.5em 0 0.2em;}
.civ-wiki-hub .wh-cat:first-child{margin-top:0.1em;}
.civ-wiki-hub .wh-item{padding:0.4em 0.35em;margin-top:0.15em;border-radius:5px;border:1px solid transparent;
  cursor:pointer;transition:background .15s,border-color .15s;line-height:1.3;}
.civ-wiki-hub .wh-item:hover{background:rgba(168,200,120,0.08);border-color:rgba(168,200,120,0.35);}
.civ-wiki-hub .wh-item-title{font-size:0.92em;font-weight:600;color:var(--gold);}
.civ-wiki-hub .wh-item-sub{font-size:0.72em;color:var(--muted);margin-top:0.12em;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.civ-wiki-hub .wh-detail{flex:1;display:none;flex-direction:column;overflow:hidden;}
.civ-wiki-hub .wh-detail.open{display:flex;}
.civ-wiki-hub .wh-detail-bar{display:flex;flex-wrap:wrap;align-items:center;gap:0.35rem;padding:0.35rem 0.45rem;
  border-bottom:1px solid var(--border);flex-shrink:0;}
.civ-wiki-hub .wh-back{background:none;border:1px solid var(--border);color:var(--muted);border-radius:4px;
  padding:0.2em 0.45em;cursor:pointer;font-size:0.78em;font-family:inherit;flex-shrink:0;}
.civ-wiki-hub .wh-back:hover{color:var(--wiki);border-color:rgba(168,200,120,0.4);}
.civ-wiki-hub .wh-dtitle{flex:1 1 120px;min-width:0;font-size:0.85em;font-weight:700;color:var(--gold);line-height:1.25;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-wiki-hub .wh-depth{display:flex;flex-wrap:wrap;gap:0.2rem;flex-shrink:0;}
.civ-wiki-hub .wh-depth button{padding:0.12em 0.3em;font-size:0.65em;border-radius:4px;cursor:pointer;
  border:1px solid var(--border);background:rgba(0,0,0,0.2);color:var(--muted);font-family:inherit;white-space:nowrap;}
.civ-wiki-hub .wh-depth button.on{color:var(--wiki);border-color:rgba(168,200,120,0.5);background:rgba(168,200,120,0.12);}
.civ-wiki-hub .wh-content{flex:1;overflow-y:auto;padding:0.45rem 0.55rem 0.6rem;line-height:1.45;font-size:0.88em;}
.civ-wiki-hub .wh-content::-webkit-scrollbar{width:6px;}
.civ-wiki-hub .wh-content::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.2);border-radius:3px;}
.civ-wiki-hub .wh-content h2{font-size:1.05em;color:var(--wiki);margin:0.6em 0 0.35em;}
.civ-wiki-hub .wh-content h3{font-size:0.98em;color:var(--gold);margin:0.5em 0 0.3em;}
.civ-wiki-hub .wh-content h4{font-size:0.92em;color:#c8d4e8;margin:0.4em 0 0.25em;}
.civ-wiki-hub .wh-content p{margin:0.35em 0;}
.civ-wiki-hub .wh-content ul{margin:0.3em 0 0.5em 1.1em;padding:0;}
.civ-wiki-hub .wh-content li{margin:0.2em 0;}
.civ-wiki-hub .wh-content .md-table-wrap{overflow-x:auto;margin:0.4em 0;-webkit-overflow-scrolling:touch;}
.civ-wiki-hub .wh-content table{width:100%;min-width:240px;border-collapse:collapse;font-size:0.92em;}
.civ-wiki-hub .wh-content th,.civ-wiki-hub .wh-content td{border:1px solid var(--border);padding:0.25em 0.35em;text-align:left;}
.civ-wiki-hub .wh-content th{background:rgba(168,200,120,0.08);color:var(--wiki);}
.civ-wiki-hub .wh-content blockquote{margin:0.4em 0;padding:0.35em 0.5em;border-left:3px solid var(--wiki);
  background:rgba(168,200,120,0.06);color:var(--muted);font-size:0.95em;}
.civ-wiki-hub .wh-content code{background:rgba(0,0,0,0.35);padding:0.1em 0.25em;border-radius:3px;font-size:0.9em;}
.civ-wiki-hub .wh-content a{color:#8ec4e8;text-decoration:underline;cursor:pointer;}
.civ-wiki-hub .wh-content hr{border:none;border-top:1px solid var(--border);margin:0.6em 0;}
.civ-wiki-hub .wh-meta{font-size:0.68em;color:var(--muted);padding:0 0.45rem 0.35rem;}
.civ-wiki-hub-backdrop{position:fixed;inset:0;z-index:519;background:rgba(4,8,16,0.72);backdrop-filter:blur(2px);}
.civ-wiki-hub.overlay-mode{
  top:50%;left:50%;right:auto;bottom:auto;transform:translate(-50%,-50%);
  width:min(92vw,720px);min-width:min(92vw,300px);max-width:720px;
  height:min(85vh,820px);max-height:85vh;z-index:520;
  border-right:none;border:1px solid rgba(212,175,90,0.32);border-radius:10px;
  box-shadow:0 16px 56px rgba(0,0,0,0.55);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

let api: WikiHubHudApi | null = null;
let configRef: WikiHubHudConfig | null = null;

export function createWikiHubHud(config: WikiHubHudConfig): WikiHubHudApi {
  ensureStyles();
  if (api !== null) api.destroy();
  configRef = config;

  const el = document.createElement('div');
  el.className = 'civ-wiki-hub';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'false');
  el.setAttribute('aria-label', 'Civpedia');
  document.body.appendChild(el);

  let open = false;
  let tab: Tab = 'poradnik';
  let filter = '';
  let detailMode = false;
  let detailTitle = '';
  let detailMd = '';
  let depth: Depth = 'm';
  let encyDepthVisible = false;
  let currentEncyId: string | null = null;
  let unbindOutside: (() => void) | null = null;
  let layoutMode: 'dock' | 'overlay' = 'dock';
  let backdropEl: HTMLDivElement | null = null;

  const head = document.createElement('div');
  head.className = 'wh-head';
  const body = document.createElement('div');
  body.className = 'wh-body';
  const listWrap = document.createElement('div');
  listWrap.className = 'wh-list';
  const detail = document.createElement('div');
  detail.className = 'wh-detail';
  const detailBar = document.createElement('div');
  detailBar.className = 'wh-detail-bar';
  const contentEl = document.createElement('div');
  contentEl.className = 'wh-content';
  const metaEl = document.createElement('div');
  metaEl.className = 'wh-meta';

  detail.appendChild(detailBar);
  detail.appendChild(contentEl);
  detail.appendChild(metaEl);
  body.appendChild(listWrap);
  body.appendChild(detail);
  el.appendChild(head);
  el.appendChild(body);

  function setLayout(mode: 'dock' | 'overlay'): void {
    layoutMode = mode;
    el.setAttribute('aria-modal', mode === 'overlay' ? 'true' : 'false');
    if (mode === 'overlay') {
      el.classList.add('overlay-mode');
      if (backdropEl === null) {
        backdropEl = document.createElement('div');
        backdropEl.className = 'civ-wiki-hub-backdrop';
        backdropEl.addEventListener('click', () => closeHub());
        document.body.appendChild(backdropEl);
      }
      backdropEl.style.display = 'block';
      return;
    }
    el.classList.remove('overlay-mode');
    if (backdropEl !== null) {
      backdropEl.style.display = 'none';
    }
  }

  function closeHub(): void {
    if (!open) return;
    open = false;
    detailMode = false;
    el.classList.remove('open');
    setLayout('dock');
    popOverlay('wiki-hub');
    unbindOutside?.();
    unbindOutside = null;
    configRef?.onClose?.();
  }

  function handleWikiHubEscape(): void {
    if (detailMode) {
      detailMode = false;
      render();
      return;
    }
    closeHub();
  }

  function groupedEncy(): Map<string, EncyEntry[]> {
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? ENCY.filter(e =>
          e.title.toLowerCase().includes(q)
          || e.category.toLowerCase().includes(q)
          || e.wikiS.toLowerCase().includes(q))
      : ENCY;
    const map = new Map<string, EncyEntry[]>();
    for (const e of filtered) {
      const arr = map.get(e.category) ?? [];
      arr.push(e);
      map.set(e.category, arr);
    }
    return map;
  }

  function openPoradnik(ch: PoradnikChapter): void {
    detailMode = true;
    encyDepthVisible = false;
    currentEncyId = null;
    detailTitle = ch.title;
    detailMd = ch.content;
    depth = 'full';
    renderDetail();
  }

  function openEncy(entry: EncyEntry): void {
    detailMode = true;
    encyDepthVisible = true;
    currentEncyId = entry.id;
    detailTitle = entry.title;
    depth = 'm';
    detailMd = pickEncyContent(entry, depth);
    renderDetail();
  }

  /** T9: resolver gra-id → EncyEntry. `gameIds` (mostek) ma pierwszeństwo przed
   * fallbackiem `slug === id`, żeby np. wpis kopalnia.md (gameIds zawiera
   * kopalnia_miedzi/zelaza/cyny/zlota) nie kolidował z hipotetycznym hasłem
   * o slugu dokładnie "kopalnia_miedzi", gdyby taki kiedyś powstał. */
  function findEncyByGameId(folder: string, id: string): EncyEntry | undefined {
    return ENCY.find(e => e.folder === folder && e.gameIds.includes(id))
      ?? ENCY.find(e => e.folder === folder && e.slug === id);
  }

  function openEncyEntry(folder: string, id: string): void {
    const entry = findEncyByGameId(folder, id);
    if (!entry) return;
    show({ tab: 'encyklopedia' });
    openEncy(entry);
  }

  function pickEncyContent(entry: EncyEntry, d: Depth): string {
    const historiaBlock = entry.historia ? `\n\n## Rys historyczny\n\n${entry.historia}` : '';
    if (d === 's') return `## ${entry.title}\n\n${entry.wikiS}`;
    if (d === 'm') return `## ${entry.title}\n\n${entry.wikiM}${historiaBlock}`;
    return `${entry.full}${historiaBlock}`;
  }

  function renderDetail(): void {
    listWrap.style.display = 'none';
    detail.classList.add('open');
    detailBar.innerHTML = '';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'wh-back';
    back.textContent = '← Lista';
    back.addEventListener('click', () => {
      detailMode = false;
      render();
    });
    const dt = document.createElement('div');
    dt.className = 'wh-dtitle';
    dt.textContent = detailTitle;
    detailBar.appendChild(back);
    detailBar.appendChild(dt);

    if (encyDepthVisible) {
      const depthBox = document.createElement('div');
      depthBox.className = 'wh-depth';
      const opts: { k: Depth; label: string }[] = [
        { k: 's', label: 'Skrót' },
        { k: 'm', label: 'Hasło' },
        { k: 'full', label: 'Pełny' },
      ];
      for (const o of opts) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = o.label;
        if (depth === o.k) b.classList.add('on');
        b.addEventListener('click', () => {
          depth = o.k;
          const entry = currentEncyId ? ENCY.find(e => e.id === currentEncyId) : undefined;
          if (entry) detailMd = pickEncyContent(entry, depth);
          renderDetail();
        });
        depthBox.appendChild(b);
      }
      detailBar.appendChild(depthBox);
    }

    contentEl.innerHTML = markdownToHtml(detailMd);
    contentEl.querySelectorAll('a[data-wiki-link]').forEach(a => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const href = (a as HTMLAnchorElement).getAttribute('data-wiki-link') ?? '';
        const slug = href.replace(/^.*\//, '').replace(/\.md$/, '');
        const hit = ENCY.find(e => e.slug === slug || e.id.endsWith('/' + slug));
        if (hit) {
          tab = 'encyklopedia';
          openEncy(hit);
        }
      });
    });
    metaEl.textContent = tab === 'poradnik'
      ? 'Poradnik gracza · pełny rozdział'
      : `Encyklopedia · ${depthMetaLabel(depth)}`;
  }

  function renderList(): void {
    listWrap.style.display = 'block';
    detail.classList.remove('open');
    listWrap.innerHTML = '';

    if (tab === 'poradnik') {
      for (const ch of PORADNIK) {
        const row = document.createElement('div');
        row.className = 'wh-item';
        row.innerHTML = `<div class="wh-item-title">${esc(ch.title)}</div>`;
        row.addEventListener('click', () => openPoradnik(ch));
        listWrap.appendChild(row);
      }
      return;
    }

    const groups = groupedEncy();
    if (groups.size === 0) {
      listWrap.innerHTML = '<div class="wh-item-sub">Brak wyników wyszukiwania.</div>';
      return;
    }
    for (const [cat, items] of groups) {
      const h = document.createElement('div');
      h.className = 'wh-cat';
      h.textContent = cat;
      listWrap.appendChild(h);
      for (const e of items) {
        const row = document.createElement('div');
        row.className = 'wh-item';
        row.innerHTML = `<div class="wh-item-title">${esc(e.title)}</div>`
          + `<div class="wh-item-sub">${esc(e.wikiS.slice(0, 140))}</div>`;
        row.addEventListener('click', () => openEncy(e));
        listWrap.appendChild(row);
      }
    }
  }

  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderHead(): void {
    head.innerHTML = '';
    const titleRow = document.createElement('div');
    titleRow.className = 'wh-title';
    const titleMain = document.createElement('span');
    titleMain.className = 'wh-title-main';
    titleMain.innerHTML = wikiBookIcon(16)
      + '<span id="civ-wiki-hub-title">Civpedia</span>';
    titleRow.appendChild(titleMain);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'wh-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Zamknij Civpedia (Esc)';
    closeBtn.setAttribute('aria-label', 'Zamknij Civpedia');
    closeBtn.addEventListener('click', () => closeHub());
    titleRow.appendChild(closeBtn);
    head.appendChild(titleRow);

    const tabs = document.createElement('div');
    tabs.className = 'wh-tabs';
    const t1 = document.createElement('button');
    t1.type = 'button';
    t1.className = 'wh-tab' + (tab === 'poradnik' ? ' on' : '');
    t1.textContent = 'Poradnik';
    t1.setAttribute('aria-label', 'Zakładka Poradnik');
    t1.addEventListener('click', () => {
      tab = 'poradnik';
      detailMode = false;
      filter = '';
      render();
    });
    const t2 = document.createElement('button');
    t2.type = 'button';
    t2.className = 'wh-tab' + (tab === 'encyklopedia' ? ' on' : '');
    t2.textContent = 'Encyklopedia';
    t2.setAttribute('aria-label', 'Zakładka Encyklopedia');
    t2.addEventListener('click', () => {
      tab = 'encyklopedia';
      detailMode = false;
      render();
    });
    tabs.appendChild(t1);
    tabs.appendChild(t2);
    head.appendChild(tabs);

    if (tab === 'encyklopedia' && !detailMode) {
      const search = document.createElement('input');
      search.type = 'search';
      search.className = 'wh-search';
      search.placeholder = 'Szukaj hasła…';
      search.setAttribute('aria-label', 'Szukaj w encyklopedii Civpedia');
      search.value = filter;
      search.addEventListener('input', () => {
        filter = search.value;
        renderList();
      });
      head.appendChild(search);
    }
  }

  function render(): void {
    renderHead();
    if (detailMode) renderDetail();
    else renderList();
  }

  function show(opts?: WikiHubShowOptions): void {
    if (opts?.tab) {
      tab = opts.tab;
      detailMode = false;
      filter = '';
    }
    setLayout(opts?.layout ?? 'dock');
    if (opts?.openPoradnikId) {
      const ch = PORADNIK.find(c => c.id === opts.openPoradnikId);
      if (ch) {
        renderHead();
        openPoradnik(ch);
      } else {
        render();
      }
    } else if (!detailMode) {
      render();
    } else {
      renderDetail();
    }
    open = true;
    el.classList.add('open');
    pushOverlay('wiki-hub', handleWikiHubEscape);
    unbindOutside?.();
    if (layoutMode === 'dock') {
      unbindOutside = bindHudPanelOutsideDismiss(
        el,
        () => open,
        closeHub,
        '.b-wiki, [data-act="wiki"]',
      );
    }
  }

  function hide(): void { closeHub(); }
  function toggle(): void { if (open) closeHub(); else show(); }

  function destroy(): void {
    popOverlay('wiki-hub');
    unbindOutside?.();
    unbindOutside = null;
    backdropEl?.remove();
    backdropEl = null;
    el.remove();
    if (api?.el === el) api = null;
    configRef = null;
  }

  api = { el, isOpen: () => open, toggle, show, hide, destroy, openEncyEntry };
  return api;
}

export function isWikiHubHudOpen(): boolean {
  return api?.isOpen() ?? false;
}

export function toggleWikiHubHud(): void { api?.toggle(); }
export function showWikiHubHud(opts?: WikiHubShowOptions): void { api?.show(opts); }
export function hideWikiHubHud(): void { api?.hide(); }
export function destroyWikiHubHud(): void { api?.destroy(); api = null; }
