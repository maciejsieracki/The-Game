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
import { ensureBrandRootTokens } from './brandTokenVars';
import { civIconSvg } from './icons/brandAssets';
import { leaderPortraitUrl } from './leaderPortraits';
import { startDiplomacyMusic, stopDiplomacyMusic } from '../audio/muzyka-antyczna';
import {
  civWelcomeInfo,
  pickWelcomeGreeting,
  type CivWelcomeInfo,
} from './civWelcomeLogic';

const OVERLAY_ID = 'civ-welcome-screen';
const ROOT_ID = 'civ-welcome-screen-root';
const STYLE_ID = 'civ-welcome-screen-css-v2-brand';

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
  ensureBrandRootTokens();
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  // Brand book (dyspozycje/_handoff/UI-do-MASTER_brand-book-w1.md, decyzje 1B/2C/4C): ciemny panel,
  // tytuły Georgia w złocie, treść Segoe UI, przyciski outline 2px złote. Jeden motyw (bez jasnego).
  // Tokeny --civ-* z brandTokenVars; fallbacki = wartości z UI/design-tokens-brand-v1.css.
  style.textContent = `
#${ROOT_ID}{position:fixed;inset:0;z-index:9650;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.55);padding:16px;box-sizing:border-box;}
#${ROOT_ID} .cww-card{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box;
  background-color:var(--civ-panel-bg,#121820);background-image:var(--civ-panel-gradient,linear-gradient(180deg,rgba(14,18,28,.98),rgba(8,10,16,.95)));
  color:var(--civ-text-primary,#e8e0c8);border-radius:var(--civ-radius-panel,12px);
  box-shadow:var(--civ-shadow-panel,0 12px 40px rgba(0,0,0,.65));
  border:2px solid var(--civ-gold-border-strong,rgba(232,216,138,.45));
  font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);}
#${ROOT_ID} .cww-head{flex:0 0 auto;display:flex;gap:14px;align-items:center;padding:16px 18px 10px;}
#${ROOT_ID} .cww-medal{width:64px;height:64px;flex:0 0 64px;border-radius:50%;overflow:hidden;
  display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);
  border:2px solid var(--civ-gold-primary,#e8d88a);}
#${ROOT_ID} .cww-medal img{width:100%;height:100%;object-fit:cover;}
#${ROOT_ID} .cww-kicker{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--civ-gold-dim,#a08030);}
#${ROOT_ID} .cww-name{font-family:var(--civ-font-title,Georgia,'Times New Roman',serif);font-size:24px;font-weight:400;
  line-height:1.2;color:var(--civ-gold-primary,#e8d88a);}
#${ROOT_ID} .cww-sub{font-size:13px;color:var(--civ-text-muted,#8a8070);margin-top:2px;}
#${ROOT_ID} .cww-body{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding:4px 18px 8px;font-size:14px;line-height:1.5;}
#${ROOT_ID} .cww-sec{margin-top:12px;}
#${ROOT_ID} .cww-sec h3{margin:0 0 4px;font-family:var(--civ-font-title,Georgia,'Times New Roman',serif);font-weight:400;
  font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--civ-gold-primary,#e8d88a);}
#${ROOT_ID} .cww-body p{margin:0;}
#${ROOT_ID} .cww-list{margin:0;padding-left:18px;}
#${ROOT_ID} .cww-list li{overflow-wrap:anywhere;}
#${ROOT_ID} .cww-greet{margin:14px 0 0;padding:12px 14px;background:rgba(232,216,138,.06);
  border-left:3px solid var(--civ-gold-primary,#e8d88a);border-radius:6px;font-style:italic;
  color:var(--civ-text-pergament,#c8b898);}
#${ROOT_ID} .cww-greet-sig{display:block;margin-top:6px;font-style:normal;font-weight:600;color:var(--civ-gold-dim,#a08030);}
#${ROOT_ID} .cww-foot{flex:0 0 auto;display:flex;gap:10px;justify-content:flex-end;padding:12px 18px 16px;}
#${ROOT_ID} .cww-btn{font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);font-size:11px;font-weight:600;
  letter-spacing:.06em;text-transform:uppercase;padding:10px 20px;border-radius:var(--civ-radius-btn,6px);cursor:pointer;
  border:2px solid var(--civ-gold-primary,#e8d88a);background:transparent;color:var(--civ-gold-primary,#e8d88a);}
#${ROOT_ID} .cww-btn:hover{background:rgba(232,216,138,.08);}
#${ROOT_ID} .cww-btn.primary{background:var(--tg-btn-primary,linear-gradient(180deg,#f0dc88,#b99a28));
  color:var(--tg-btn-primary-ink,#2e2708);}
#${ROOT_ID} .cww-btn.primary:hover{filter:brightness(1.06);background:var(--tg-btn-primary,linear-gradient(180deg,#f0dc88,#b99a28));}
#${ROOT_ID} .cww-btn:focus-visible{outline:2px solid var(--tg-focus-ring,#e8d88a);outline-offset:2px;}
@media (max-width:480px){
  #${ROOT_ID} .cww-name{font-size:20px;}
  #${ROOT_ID} .cww-medal{width:52px;height:52px;flex-basis:52px;}
}`;
  document.head.appendChild(style);
}

/** Wszystkie pozycje plusów/minusów widoczne od razu (bez ucinania i bez tooltipu); karta przewija się w .cww-body. */
function listHtml(items: string[]): string {
  if (items.length === 0) return '<div class="cww-sub">—</div>';
  return `<ul class="cww-list">${items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
}

function bodyHtml(info: CivWelcomeInfo, greeting: string, leader: string | null): string {
  const sig = leader ? `<span class="cww-greet-sig">— ${esc(leader)}</span>` : '';
  return `
    ${info.rys ? `<div class="cww-sec"><h3>Rys historyczny</h3><p>${esc(info.rys)}</p></div>` : ''}
    <div class="cww-sec"><h3>Plusy</h3>${listHtml(info.plusy)}</div>
    <div class="cww-sec"><h3>Minusy</h3>${listHtml(info.minusy)}</div>
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
        <button type="button" class="cww-btn primary" data-cww="audience">Audiencja</button>
        <button type="button" class="cww-btn" data-cww="close">Zamknij</button>
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
