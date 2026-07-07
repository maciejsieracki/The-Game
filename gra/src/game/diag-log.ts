/**
 * diag-log.ts — pierścień zdarzeń diagnostycznych (błędy, load/save, sesja).
 * F10 = panel w grze; Ctrl+Shift+D = kopiuj raport JSON do schowka.
 */

export type DiagLevel = 'info' | 'warn' | 'error';

export interface DiagEntry {
  ts: string;
  level: DiagLevel;
  tag: string;
  msg: string;
}

const MAX_ENTRIES = 200;
const entries: DiagEntry[] = [];

let panelEl: HTMLDivElement | null = null;
let panelVisible = false;

function pushEntry(level: DiagLevel, tag: string, msg: string): void {
  entries.push({
    ts: new Date().toISOString(),
    level,
    tag,
    msg: String(msg),
  });
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
  if (panelVisible) refreshDiagPanel();
}

export function diagInfo(tag: string, msg: string): void {
  pushEntry('info', tag, msg);
  console.log(`[Diag:${tag}]`, msg);
}

export function diagWarn(tag: string, msg: string): void {
  pushEntry('warn', tag, msg);
  console.warn(`[Diag:${tag}]`, msg);
}

export function diagError(tag: string, msg: string): void {
  pushEntry('error', tag, msg);
  console.error(`[Diag:${tag}]`, msg);
}

export function getDiagEntries(): readonly DiagEntry[] {
  return entries;
}

export function buildDiagReport(extra?: Record<string, unknown>): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      location: typeof location !== 'undefined' ? location.href : '',
      entries: [...entries],
      extra,
    },
    null,
    2,
  );
}

export async function copyDiagReport(extra?: Record<string, unknown>): Promise<boolean> {
  const text = buildDiagReport(extra);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function ensureDiagPanel(): HTMLDivElement {
  if (panelEl) return panelEl;
  panelEl = document.createElement('div');
  panelEl.id = 'civ-diag-panel';
  panelEl.style.cssText = [
    'position:fixed', 'right:12px', 'bottom:12px', 'z-index:650',
    'width:min(420px,calc(100vw - 24px))', 'max-height:min(42vh,320px)',
    'display:none', 'flex-direction:column',
    'background:rgba(8,10,18,0.94)', 'color:#dce4f0',
    'border:1px solid rgba(224,178,74,0.45)', 'border-radius:10px',
    'font:11px/1.4 Consolas,Monaco,monospace',
    'box-shadow:0 12px 36px rgba(0,0,0,0.55)',
  ].join(';');

  const header = document.createElement('div');
  header.style.cssText = 'padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;gap:8px;align-items:center;';
  header.innerHTML = '<b style="color:#e0b24a;flex:1">Diag (F10)</b>';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.textContent = 'Kopiuj';
  copyBtn.style.cssText = 'cursor:pointer;background:#2a3348;color:#e8ebf0;border:1px solid #556;padding:2px 8px;border-radius:4px;font:inherit;';
  copyBtn.onclick = () => {
    void copyDiagReport().then((ok) => {
      copyBtn.textContent = ok ? 'Skopiowano!' : 'Błąd';
      setTimeout(() => { copyBtn.textContent = 'Kopiuj'; }, 1500);
    });
  };

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.style.cssText = copyBtn.style.cssText;
  closeBtn.onclick = () => toggleDiagPanel(false);

  header.append(copyBtn, closeBtn);

  const body = document.createElement('div');
  body.id = 'civ-diag-body';
  body.style.cssText = 'padding:8px 10px;overflow:auto;flex:1;white-space:pre-wrap;word-break:break-word;';

  panelEl.append(header, body);
  document.body.appendChild(panelEl);
  return panelEl;
}

function refreshDiagPanel(): void {
  const body = document.getElementById('civ-diag-body');
  if (!body) return;
  if (entries.length === 0) {
    body.textContent = '(brak wpisów — graj dalej; błędy i load/save trafią tutaj)';
    return;
  }
  body.textContent = entries
    .slice()
    .reverse()
    .map((e) => `${e.ts.slice(11, 19)} [${e.level}] ${e.tag}: ${e.msg}`)
    .join('\n');
}

export function toggleDiagPanel(force?: boolean): boolean {
  ensureDiagPanel();
  panelVisible = force ?? !panelVisible;
  panelEl!.style.display = panelVisible ? 'flex' : 'none';
  if (panelVisible) refreshDiagPanel();
  return panelVisible;
}

export function isDiagPanelVisible(): boolean {
  return panelVisible;
}

/** Dodatkowe hooki globalne (obok showErr w main.ts). */
export function installGlobalDiagHooks(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => {
    diagError('window.error', `${e.message} @${e.filename}:${e.lineno}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    diagError('promise', String((e as PromiseRejectionEvent).reason));
  });
}
