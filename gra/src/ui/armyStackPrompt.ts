import { pushOverlay, popOverlay } from './escapeOverlayStack';

/**
 * armyStackPrompt.ts
 * Okno „Zajęty heks" — pyta o scalenie armii gdy jednostka wchodzi na zajęty heks.
 *
 * CEL: decyzja Macieja #167 — UI pyta [Połącz armie] / [Nie łącz]; merge wykonuje UNITS.
 *   Brak importów z game/* ani types/*. DOM-only, DECOUPLED.
 *
 * Tło + paleta: slate rgba(20,24,32,.94), złoto #e0b24a — spójne z empireBalance.ts.
 * Scope CSS: .civ-stack.
 *
 * API publiczne:
 *   showArmyStackPrompt(opts)  — wyświetla modal
 *   hideArmyStackPrompt()      — zamyka modal (bez wywołania callbacków)
 *   isArmyStackPromptOpen()    — zwraca stan widoczności
 */

// ---------------------------------------------------------------------------
// Typy publiczne
// ---------------------------------------------------------------------------

/** Opcje okna „Zajęty heks". */
export interface ArmyStackPromptOpts {
  /** Callback wywoływany gdy użytkownik wybierze Połącz armie. */
  onMerge: () => void;
  /** Callback wywoływany gdy użytkownik wybierze Nie łącz (lub Esc / klik tła). */
  onKeep: () => void;
  /** Nazwa/opis atakującej jednostki lub armii (opcjonalne). */
  atakujacy?: string;
  /** Nazwa/opis jednostki lub armii stojącej na celu (opcjonalne). */
  cel?: string;
}

// ---------------------------------------------------------------------------
// Stan modułu
// ---------------------------------------------------------------------------

let overlayEl: HTMLDivElement | null = null;
let modalEl: HTMLDivElement | null = null;
let currentOpts: ArmyStackPromptOpts | null = null;

// ---------------------------------------------------------------------------
// Style (raz, scoped .civ-stack)
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-stack-css';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-stack-overlay{
  position:fixed;inset:0;z-index:500;
  background:rgba(0,0,0,0.55);
  display:flex;align-items:center;justify-content:center;
}
.civ-stack{
  --gold:#e0b24a;--muted:#9aa6b6;--sub:#c0c8d4;
  background:rgba(20,24,32,0.96);color:#e8ebf0;
  border:1px solid rgba(224,178,74,0.35);border-radius:10px;
  padding:22px 26px 18px;font:14px monospace;
  box-shadow:0 6px 32px rgba(0,0,0,0.7);
  min-width:300px;max-width:380px;
  position:relative;
}
.civ-stack *{box-sizing:border-box;}
.civ-stack .cs-title{
  font-size:0.82em;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:var(--gold);border-bottom:1px solid rgba(224,178,74,0.25);
  padding-bottom:6px;margin-bottom:12px;
}
.civ-stack .cs-body{
  font-size:0.9em;line-height:1.5;color:var(--sub);
  margin-bottom:18px;
}
.civ-stack .cs-body strong{color:#e8ebf0;}
.civ-stack .cs-btns{
  display:flex;gap:10px;justify-content:flex-end;
}
.civ-stack .cs-btn{
  font:inherit;font-size:0.82em;cursor:pointer;
  border:none;border-radius:5px;padding:7px 16px;font-weight:700;
  transition:opacity .15s;
}
.civ-stack .cs-btn:hover{opacity:0.82;}
.civ-stack .cs-btn-merge{
  background:rgba(224,178,74,0.88);color:#111;
}
.civ-stack .cs-btn-keep{
  background:rgba(255,255,255,0.10);color:#c0c8d4;
  border:1px solid rgba(255,255,255,0.15);
}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function buildText(opts: ArmyStackPromptOpts): string {
  const celPart = opts.cel ? ' — ' + opts.cel : '';
  const atakPart = opts.atakujacy ? opts.atakujacy : 'twoją armię';
  return (
    'Na tym polu stoi już armia' + celPart + '. Co zrobić z <strong>' + esc(atakPart) + '</strong>?'
  );
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function render(opts: ArmyStackPromptOpts): void {
  if (modalEl === null) return;
  modalEl.innerHTML =
    '<div class="cs-title">Zajęty heks</div>' +
    '<div class="cs-body">' + buildText(opts) + '</div>' +
    '<div class="cs-btns">' +
      '<button class="cs-btn cs-btn-keep" id="civ-stack-keep">Nie łącz</button>' +
      '<button class="cs-btn cs-btn-merge" id="civ-stack-merge">Połącz armie</button>' +
    '</div>';

  const btnMerge = document.getElementById('civ-stack-merge');
  const btnKeep  = document.getElementById('civ-stack-keep');

  if (btnMerge !== null) {
    btnMerge.addEventListener('click', () => { triggerMerge(); });
  }
  if (btnKeep !== null) {
    btnKeep.addEventListener('click', () => { triggerKeep(); });
  }
}

// ---------------------------------------------------------------------------
// Akcje
// ---------------------------------------------------------------------------

function triggerMerge(): void {
  const cb = currentOpts?.onMerge;
  hideArmyStackPrompt();
  if (cb) cb();
}

function triggerKeep(): void {
  const cb = currentOpts?.onKeep;
  hideArmyStackPrompt();
  if (cb) cb();
}

function onOverlayClick(e: MouseEvent): void {
  if (e.target === overlayEl) {
    triggerKeep();
  }
}

// ---------------------------------------------------------------------------
// API publiczne
// ---------------------------------------------------------------------------

/**
 * Wyświetla modal „Zajęty heks".
 * Wywołuje onMerge() albo onKeep() przy zamknięciu (nigdy oba).
 */
export function showArmyStackPrompt(opts: ArmyStackPromptOpts): void {
  currentOpts = opts;
  ensureStyles();

  if (overlayEl === null) {
    overlayEl = document.createElement('div');
    overlayEl.className = 'civ-stack-overlay';

    modalEl = document.createElement('div');
    modalEl.className = 'civ-stack';
    overlayEl.appendChild(modalEl);
    document.body.appendChild(overlayEl);
  }

  render(opts);
  overlayEl.style.display = 'flex';

  overlayEl.addEventListener('click', onOverlayClick);
  pushOverlay('army-stack-prompt', triggerKeep);
}

/**
 * Zamknij modal bez wywoływania callbacków.
 */
export function hideArmyStackPrompt(): void {
  popOverlay('army-stack-prompt');
  if (overlayEl !== null) {
    overlayEl.style.display = 'none';
  }
  currentOpts = null;
  if (overlayEl !== null) {
    overlayEl.removeEventListener('click', onOverlayClick);
  }
}

/**
 * Czy modal jest aktualnie widoczny.
 */
export function isArmyStackPromptOpen(): boolean {
  return overlayEl !== null && overlayEl.style.display !== 'none';
}
