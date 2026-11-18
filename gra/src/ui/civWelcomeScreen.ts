/**
 * civWelcomeScreen.ts — ekran „Odkryłeś nową cywilizację” (R-WEB-UI-CIV-WELCOME-SCREEN-Q1).
 *
 * Pokazywany RAZ przy pierwszym kontakcie z cywilizacją (main.ts: tryOpenNextFirstContactCard)
 * oraz na żądanie z przycisku „O cywilizacji” w panelu audiencji (bez zmiany stanu audiencji).
 * Treść i wybór powitania: civWelcomeLogic.ts (czysta logika, testowana w Node).
 *
 * Przyciski: „Audiencja” (zamyka ekran; wywołujący otwiera audiencję) i „Zamknij”.
 * Esc i klik w tło = Zamknij (stos Esc: escapeOverlayStack).
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { civIconSvg } from './icons/brandAssets';
import { leaderPortraitUrl } from './leaderPortraits';
import { startDiplomacyMusic, stopDiplomacyMusic } from '../audio/muzyka-antyczna';
import {
  civWelcomeInfo,
  pickWelcomeGreeting,
  WELCOME_VISIBLE_MINUSES,
  WELCOME_VISIBLE_PLUSES,
  type CivWelcomeInfo,
} from './civWelcomeLogic';

const OVERLAY_ID = 'civ-welcome-screen';
const ROOT_ID = 'civ-welcome-screen-root';
const STYLE_ID = 'civ-welcome-screen-css-v1';

export interface CivWelcomeOpts {
  /** ownerId rozmówcy (do zwrotnego callbacku). */
  ownerId: number;
  /** Klucz cywilizacji (ikonaId / typCywilizacji / nazwa) — jak w civKeyForOwner. */
  civKey: string;
  /** Nastawienie wobec gracza: true = przyjazne (wg isFriendlyStance w logice). */
  friendly: boolean;
  /** Ziarno gry — deterministyczny wybór powitania. */
  seed: number;
  /** Epoka rozmówcy (empireEpochForOwner) — do portretu i podpisu władcy. */
  era: number;
  /** Imię władcy (leaderName) — podpis pod powitaniem; null gdy brak. */
  leaderName: string | null;
  /** Czy grać przywitanie cywilizacji (tylko pierwszy kontakt; przy „O cywilizacji” bez muzyki). */
  playMusic: boolean;
  /** „Audiencja”: ekran zamknięty przed wywołaniem. */
  onAudience: () => void;
  /** „Zamknij” / Esc / tło: ekran zamknięty przed wywołaniem. */
  onClose: () => void;
}

let open: { opts: CivWelcomeOpts; musicStarted: boolean } | null = null;

function esc(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${ROOT_ID}{position:fixed;inset:0;z-index:9650;display:flex;align-items:center;justify-content:center;
  background:rgba(8,6,4,.62);padding:16px;box-sizing:border-box;}
#${ROOT_ID} .cww-card{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;
  background:#f6efdf;color:#2a2118;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.45);
  border:2px solid #b8893a;font-family:inherit;}
#${ROOT_ID} .cww-head{display:flex;gap:14px;align-items:center;padding:16px 18px 10px;}
#${ROOT_ID} .cww-medal{width:64px;height:64px;flex:0 0 64px;border-radius:50%;overflow:hidden;
  display:flex;align-items:center;justify-content:center;background:#e9dcc0;border:2px solid #b8893a;}
#${ROOT_ID} .cww-medal img{width:100%;height:100%;object-fit:cover;}
#${ROOT_ID} .cww-kicker{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#7a5a20;}
#${ROOT_ID} .cww-name{font-size:24px;font-weight:700;line-height:1.2;}
#${ROOT_ID} .cww-sub{font-size:13px;color:#5b4a36;margin-top:2px;}
#${ROOT_ID} .cww-body{padding:4px 18px 8px;font-size:14px;line-height:1.5;}
#${ROOT_ID} .cww-sec{margin-top:12px;}
#${ROOT_ID} .cww-sec h3{margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#7a5a20;}
#${ROOT_ID} .cww-list{margin:0;padding-left:18px;}
#${ROOT_ID} .cww-more{font-size:12px;color:#6b5a44;cursor:help;margin-top:2px;}
#${ROOT_ID} .cww-greet{margin:14px 0 0;padding:12px 14px;background:#fbf6ea;border-left:4px solid #b8893a;
  border-radius:6px;font-style:italic;}
#${ROOT_ID} .cww-greet-sig{display:block;margin-top:6px;font-style:normal;font-weight:600;color:#5b4a36;}
#${ROOT_ID} .cww-foot{display:flex;gap:10px;justify-content:flex-end;padding:12px 18px 16px;}
#${ROOT_ID} .cww-btn{font:inherit;font-size:14px;padding:8px 16px;border-radius:8px;cursor:pointer;
  border:1px solid #b8893a;background:#fff;color:#2a2118;}
#${ROOT_ID} .cww-btn.primary{background:#b8893a;color:#fff;}
#${ROOT_ID} .cww-btn:focus-visible{outline:2px solid #2a6df4;outline-offset:2px;}
@media (prefers-color-scheme: dark){
  #${ROOT_ID} .cww-card{background:#262019;color:#efe6d4;border-color:#b8893a;}
  #${ROOT_ID} .cww-sub,#${ROOT_ID} .cww-more,#${ROOT_ID} .cww-greet-sig{color:#c9b898;}
  #${ROOT_ID} .cww-greet{background:#302820;}
  #${ROOT_ID} .cww-btn{background:#302820;color:#efe6d4;}
}
@media (max-width:480px){
  #${ROOT_ID} .cww-name{font-size:20px;}
  #${ROOT_ID} .cww-medal{width:52px;height:52px;flex-basis:52px;}
}`;
  document.head.appendChild(style);
}

function listHtml(items: string[], visible: number, tipLabel: string): string {
  if (items.length === 0) return '<div class="cww-sub">—</div>';
  const shown = items.slice(0, visible);
  const rest = items.length - shown.length;
  const full = items.join('\n');
  const more = rest > 0
    ? `<div class="cww-more" title="${esc(tipLabel + ': ' + full)}">+ ${rest} więcej (najedź, aby zobaczyć)</div>`
    : '';
  return `<ul class="cww-list">${shown.map(t => `<li>${esc(t)}</li>`).join('')}</ul>${more}`;
}

function bodyHtml(info: CivWelcomeInfo, greeting: string, leader: string | null): string {
  const sig = leader ? `<span class="cww-greet-sig">— ${esc(leader)}</span>` : '';
  return `
    ${info.rys ? `<div class="cww-sec"><h3>Rys historyczny</h3><p>${esc(info.rys)}</p></div>` : ''}
    <div class="cww-sec"><h3>Plusy</h3>${listHtml(info.plusy, WELCOME_VISIBLE_PLUSES, 'Plusy')}</div>
    <div class="cww-sec"><h3>Minusy</h3>${listHtml(info.minusy, WELCOME_VISIBLE_MINUSES, 'Minusy')}</div>
    <div class="cww-sec"><h3>Jednostka specjalna</h3><p>${esc(info.jednostka || '—')}</p></div>
    <div class="cww-sec"><h3>Styl</h3><p>${esc(info.styl || '—')}</p></div>
    <div class="cww-sec"><h3>Religia</h3><p>${esc(info.religia || '—')}</p></div>
    ${greeting ? `<blockquote class="cww-greet">${esc(greeting)}${sig}</blockquote>` : ''}`;
}

function close(kind: 'close' | 'audience'): void {
  const cur = open;
  if (!cur) return;
  open = null;
  popOverlay(OVERLAY_ID);
  document.getElementById(ROOT_ID)?.remove();
  if (cur.musicStarted) stopDiplomacyMusic();
  if (kind === 'audience') cur.opts.onAudience();
  else cur.opts.onClose();
}

/** Pokazuje ekran powitalny. Gdy już otwarty — nic nie robi (jedna instancja). */
export function showCivWelcomeScreen(opts: CivWelcomeOpts): boolean {
  if (open) return false;
  const info = civWelcomeInfo(opts.civKey);
  if (!info) return false;
  if (typeof document === 'undefined') return false;
  ensureStyles();
  const greeting = pickWelcomeGreeting(opts.civKey, opts.friendly, opts.seed);
  const portrait = leaderPortraitUrl(info.ikonaId, opts.era);
  const medal = portrait
    ? `<img alt="" src="${esc(portrait)}">`
    : civIconSvg(info.ikonaId, 48);

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Odkryłeś nową cywilizację: ' + info.name);
  root.innerHTML = `
    <div class="cww-card">
      <div class="cww-head">
        <div class="cww-medal">${medal}</div>
        <div>
          <div class="cww-kicker">Odkryłeś nową cywilizację</div>
          <div class="cww-name">${esc(info.name)}</div>
          <div class="cww-sub">${esc([info.styl, info.jednostka].filter(s => s && s !== '—').join(' · '))}</div>
        </div>
      </div>
      <div class="cww-body">${bodyHtml(info, greeting, opts.leaderName)}</div>
      <div class="cww-foot">
        <button type="button" class="cww-btn" data-cww="audience">Audiencja</button>
        <button type="button" class="cww-btn primary" data-cww="close">Zamknij</button>
      </div>
    </div>`;
  document.body.appendChild(root);

  open = { opts, musicStarted: false };
  if (opts.playMusic) {
    startDiplomacyMusic(opts.civKey);
    open.musicStarted = true;
  }
  root.querySelector('[data-cww="audience"]')?.addEventListener('click', () => close('audience'));
  root.querySelector('[data-cww="close"]')?.addEventListener('click', () => close('close'));
  root.addEventListener('click', (ev) => {
    if (ev.target === root) close('close');
  });
  pushOverlay(OVERLAY_ID, () => close('close'));
  return true;
}

/** Zamyka ekran bez wywoływania callbacków (np. przy czyszczeniu stanu gry). */
export function hideCivWelcomeScreen(): void {
  const cur = open;
  open = null;
  popOverlay(OVERLAY_ID);
  document.getElementById(ROOT_ID)?.remove();
  if (cur?.musicStarted) stopDiplomacyMusic();
}

export function isCivWelcomeScreenOpen(): boolean {
  return open !== null;
}
