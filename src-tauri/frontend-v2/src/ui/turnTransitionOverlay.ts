/**
 * turnTransitionOverlay.ts — B5-A: pasek postępu + „Teraz gra: …” przy końcu tury.
 * Decyzja Macieja 2026-07-07.
 */
import { CIV_BRAND_SCOPE_VARS, ensureBrandRootTokens } from './brandTokenVars';

const STYLE_ID = 'civ-turn-transition-css';

let root: HTMLDivElement | null = null;
let barEl: HTMLDivElement | null = null;
let phaseEl: HTMLParagraphElement | null = null;
let actorEl: HTMLParagraphElement | null = null;
let turnEl: HTMLParagraphElement | null = null;

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  ensureBrandRootTokens();
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.civ-turn-transition{
  ${CIV_BRAND_SCOPE_VARS}
  position:fixed;inset:0;z-index:100400;pointer-events:none;
  display:flex;align-items:flex-end;justify-content:center;
  padding:0 1rem 5.5rem;
  background:linear-gradient(180deg,transparent 55%,rgba(4,8,14,.55) 100%);
  font-family:var(--civ-font-ui,system-ui,sans-serif);
  opacity:0;transition:opacity .18s ease-out;
}
.civ-turn-transition.on{opacity:1;}
.civ-turn-transition-panel{
  min-width:min(520px,94vw);
  padding:.85rem 1.15rem 1rem;
  background:rgba(12,16,24,.92);
  border:1px solid var(--border-mid,rgba(232,216,138,.35));
  border-radius:var(--radius-lg,10px);
  box-shadow:0 8px 32px rgba(0,0,0,.45);
  backdrop-filter:blur(6px);
}
.civ-turn-transition-turn{
  margin:0 0 .25rem;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;
  color:var(--text-muted,#9aa4b2);
}
.civ-turn-transition-actor{
  margin:0 0 .35rem;font-size:1.05rem;font-weight:700;color:var(--text-gold,#e8d88a);
  min-height:1.35em;
}
.civ-turn-transition-phase{
  margin:0 0 .55rem;font-size:.82rem;color:var(--text-primary,#e8ecf0);
  min-height:1.2em;
}
.civ-turn-transition-bar-wrap{
  height:7px;background:rgba(255,255,255,.1);border-radius:4px;overflow:hidden;
}
.civ-turn-transition-bar{
  height:100%;width:0%;
  background:linear-gradient(90deg,var(--gold-dim,#a08030),var(--gold,#e8d88a));
  border-radius:4px;transition:width .22s ease-out;
}
`;
  document.head.appendChild(style);
}

/** Pokaż overlay (tura docelowa = numer po kliknięciu „Zakończ turę”). */
export function beginTurnTransition(nextTurn: number): void {
  ensureStyles();
  endTurnTransition();
  root = document.createElement('div');
  root.className = 'civ-turn-transition';
  root.setAttribute('aria-live', 'polite');
  root.innerHTML = `
    <div class="civ-turn-transition-panel">
      <p class="civ-turn-transition-turn" id="civ-turn-trans-turn">Przejście · tura ${nextTurn}</p>
      <p class="civ-turn-transition-actor" id="civ-turn-trans-actor">Teraz gra: Gracz</p>
      <p class="civ-turn-transition-phase" id="civ-turn-trans-phase">Przygotowanie…</p>
      <div class="civ-turn-transition-bar-wrap">
        <div class="civ-turn-transition-bar" id="civ-turn-trans-bar"></div>
      </div>
    </div>`;
  document.body.appendChild(root);
  turnEl = root.querySelector('#civ-turn-trans-turn') as HTMLParagraphElement;
  actorEl = root.querySelector('#civ-turn-trans-actor') as HTMLParagraphElement;
  phaseEl = root.querySelector('#civ-turn-trans-phase') as HTMLParagraphElement;
  barEl = root.querySelector('#civ-turn-trans-bar') as HTMLDivElement;
  requestAnimationFrame(() => root?.classList.add('on'));
  setTurnTransition(0, 'Przygotowanie…', 'Gracz', nextTurn);
}

/** progress 0–100; actorLabel → „Teraz gra: Sparta”. */
export function setTurnTransition(
  progress: number,
  phase: string,
  actorLabel?: string,
  turnNum?: number,
): void {
  if (!root || !barEl || !phaseEl || !actorEl) return;
  const pct = Math.min(100, Math.max(0, progress));
  barEl.style.width = `${pct}%`;
  phaseEl.textContent = phase;
  if (turnNum != null && turnEl) {
    turnEl.textContent = `Przejście · tura ${turnNum}`;
  }
  if (actorLabel != null) {
    actorEl.textContent = `Teraz gra: ${actorLabel}`;
  }
}

export function isTurnTransitionActive(): boolean {
  return root != null;
}

export function endTurnTransition(): void {
  if (root) {
    root.classList.remove('on');
    const el = root;
    root = null;
    barEl = null;
    phaseEl = null;
    actorEl = null;
    turnEl = null;
    window.setTimeout(() => el.remove(), 200);
  }
}

/** Oddaj klatkę UI — bez tego pasek nie maluje się w trakcie sync end-turn. */
export function yieldTurnTransitionUi(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}
