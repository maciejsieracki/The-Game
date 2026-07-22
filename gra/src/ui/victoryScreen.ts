/**
 * victoryScreen.ts — pełnoekranowy ekran końca gry (E-15 · 1E cinematic).
 *
 * Typy zwycięstwa: dominacja (Power>50%, ostatnia epoka) · nauka (tech+rakieta) · przegrana.
 * Wpięcie w silnik: handoff CYWILIZACJE-do-INTEGRATOR_victory-screen-2026-07-02.md (Grupa F).
 */

import type { VictoryResult } from '../game/victory';
import { PROG_DOMINACJI_POWER } from '../game/victory';
import { CIV_BRAND_SCOPE_VARS, ensureBrandRootTokens } from './brandTokenVars';

export type VictoryRodzaj = VictoryResult['rodzaj'];

export interface VictoryScreenStats {
  turn: number;
  /** Udział Power gracza 0..1 (dominacja). */
  powerShare?: number;
  /** Etykieta epoki gracza, np. „Żelazo”. */
  eraLabel?: string;
  /** Nazwa cywilizacji gracza. */
  civLabel?: string;
}

export interface VictoryScreenData {
  rodzaj: VictoryRodzaj;
  stats: VictoryScreenStats;
}

const OVERLAY_ID = '__victory_screen__';

let overlayEl: HTMLDivElement | null = null;
let styleInjected = false;

/** Tytuł główny — testowalne bez DOM. */
export function formatVictoryTitle(rodzaj: VictoryRodzaj, turn: number): string {
  switch (rodzaj) {
    case 'dominacja':
      return `ZWYCIĘSTWO — dominacja (tura ${turn})`;
    case 'nauka':
      return `ZWYCIĘSTWO NAUKOWE (tura ${turn})`;
    case 'przegrana':
      return `PRZEGRANA (tura ${turn})`;
  }
}

/** Podtytuł / opis warunku — testowalne bez DOM. */
export function formatVictorySubtitle(rodzaj: VictoryRodzaj, stats: VictoryScreenStats): string {
  const progPct = Math.round(PROG_DOMINACJI_POWER * 100);
  switch (rodzaj) {
    case 'dominacja': {
      const share = stats.powerShare != null
        ? Math.round(stats.powerShare * 100)
        : null;
      const shareLine = share != null
        ? `Twój Power: ${share}% świata (próg ${progPct}%). `
        : '';
      return `${shareLine}Dominacja w ostatniej epoce — nie musisz eliminować wszystkich nacji.`;
    }
    case 'nauka':
      return 'Wszystkie technologie w zakresie gry zbadane. Rakieta z robotami wyruszyła na najbliższą planetę.';
    case 'przegrana':
      return 'Twoje panowanie dobiegło końca. Utraciłeś wszystkie miasta i osadników.';
  }
}

/** Krótka etykieta warunku (panel statystyk). */
export function formatVictoryConditionLabel(rodzaj: VictoryRodzaj): string {
  switch (rodzaj) {
    case 'dominacja':
      return 'Warunek: dominacja (Power)';
    case 'nauka':
      return 'Warunek: zwycięstwo naukowe';
    case 'przegrana':
      return 'Warunek: utrata imperium';
  }
}

/** Buduje payload UI z wyniku `checkVictory` + kontekstu silnika. */
export function buildVictoryScreenData(
  result: VictoryResult,
  stats: VictoryScreenStats,
): VictoryScreenData {
  return { rodzaj: result.rodzaj, stats };
}

function isVictoryRodzaj(rodzaj: VictoryRodzaj): boolean {
  return rodzaj === 'dominacja' || rodzaj === 'nauka';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const STYLE_ID = 'civ-victory-screen-css';

const LAUREL_SVG = [
  '<svg class="vsc-emblem-svg" width="72" height="72" viewBox="0 0 24 24" fill="none"',
  ' stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
  '<path d="M12 21C7 19 5 14 5 9M5 9c2 .3 3.4 1.4 4 3M6 12c1.6 .3 2.8 1.2 3.4 2.6M7.6 15c1.4 .3 2.4 1.1 3 2.3M6 6.4c1.6 .3 2.8 1.2 3.4 2.6"/>',
  '<path d="M12 21c5-2 7-7 7-12M19 9c-2 .3-3.4 1.4-4 3M18 12c-1.6 .3-2.8 1.2-3.4 2.6M16.4 15c-1.4 .3-2.4 1.1-3 2.3M18 6.4c-1.6 .3-2.8 1.2-3.4 2.6"/>',
  '</svg>',
].join('');

const SHIELD_FAIL_SVG = [
  '<svg class="vsc-emblem-svg" width="76" height="76" viewBox="0 0 24 24" fill="none"',
  ' stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
  '<path d="M12 3 5 5.5v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9v-5Z"/>',
  '<path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5"/>',
  '</svg>',
].join('');

function ensureStyles(): void {
  ensureBrandRootTokens();
  if (styleInjected || document.getElementById(STYLE_ID)) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = [
    '@keyframes vsc-glow{0%,100%{opacity:.6}50%{opacity:1}}',
    '.vsc-overlay{position:fixed;inset:0;z-index:10150;overflow:hidden;',
    `${CIV_BRAND_SCOPE_VARS}`,
    'font-family:var(--civ-font-ui,"Segoe UI",Tahoma,sans-serif);color:var(--civ-text-primary,#e8e0c8);}',
    '.vsc-overlay.win{background:radial-gradient(1000px 800px at 50% 34%,rgba(232,216,138,.14),transparent 60%),#080a12;}',
    '.vsc-overlay.lose{background:radial-gradient(1000px 800px at 50% 34%,rgba(200,64,64,.14),transparent 60%),#0a0708;}',
    '.vsc-vignette{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 300px 90px rgba(0,0,0,.78);}',
    '.vsc-overlay.lose .vsc-vignette{box-shadow:inset 0 0 300px 90px rgba(0,0,0,.82);}',
    '.vsc-stage{position:absolute;top:0;left:50%;transform:translateX(-50%);width:min(820px,94vw);height:100%;',
    'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem 1rem;}',
    '.vsc-emblem{margin-bottom:10px;display:flex;align-items:center;justify-content:center;}',
    '.vsc-overlay.win .vsc-emblem{color:#e8d88a;animation:vsc-glow 5s ease-in-out infinite;}',
    '.vsc-overlay.lose .vsc-emblem{color:#c05050;}',
    '.vsc-kind{font-size:15px;letter-spacing:.5em;text-transform:uppercase;margin-bottom:14px;}',
    '.vsc-overlay.win .vsc-kind{color:#a08030;}',
    '.vsc-overlay.lose .vsc-kind{color:#8a5a5a;}',
    '.vsc-headline{margin:0;font-family:var(--civ-font-title,Georgia,serif);font-weight:400;',
    'font-size:clamp(2.8rem,8vw,6.5rem);letter-spacing:.1em;line-height:1.05;}',
    '.vsc-overlay.win .vsc-headline{color:#e8d88a;text-shadow:0 2px 20px rgba(0,0,0,.6),0 0 50px rgba(232,216,138,.25);}',
    '.vsc-overlay.lose .vsc-headline{color:#c84040;text-shadow:0 2px 20px rgba(0,0,0,.7),0 0 46px rgba(200,64,64,.22);}',
    '.vsc-divider{display:flex;align-items:center;justify-content:center;gap:18px;margin:24px 0 8px;width:100%;}',
    '.vsc-divider-line{height:1px;width:min(180px,28vw);}',
    '.vsc-overlay.win .vsc-divider-line{background:linear-gradient(90deg,transparent,#a08030);}',
    '.vsc-overlay.win .vsc-divider-line.right{background:linear-gradient(90deg,#a08030,transparent);}',
    '.vsc-overlay.lose .vsc-divider-line{background:linear-gradient(90deg,transparent,#8a3a3a);}',
    '.vsc-overlay.lose .vsc-divider-line.right{background:linear-gradient(90deg,#8a3a3a,transparent);}',
    '.vsc-divider-mark{font-size:14px;line-height:1;}',
    '.vsc-overlay.win .vsc-divider-mark{color:#a08030;}',
    '.vsc-overlay.lose .vsc-divider-mark{color:#8a3a3a;}',
    '.vsc-flavor{margin:0;font-family:var(--civ-font-title,Georgia,serif);font-size:clamp(1.1rem,2.4vw,1.625rem);',
    'color:#e8e0c8;line-height:1.35;max-width:36rem;}',
    '.vsc-overlay.lose .vsc-flavor{color:#d8c8c8;}',
    '.vsc-cards{display:flex;flex-wrap:wrap;justify-content:center;gap:18px;margin-top:44px;width:100%;}',
    '.vsc-card{flex:0 1 200px;min-width:160px;border-radius:12px;padding:22px 18px;text-align:center;}',
    '.vsc-overlay.win .vsc-card{border:2px solid rgba(232,216,138,.4);',
    'background:linear-gradient(180deg,rgba(18,24,32,.96),rgba(8,10,16,.96));}',
    '.vsc-overlay.lose .vsc-card{border:2px solid rgba(200,64,64,.35);',
    'background:linear-gradient(180deg,rgba(26,18,18,.96),rgba(10,8,8,.96));}',
    '.vsc-card.vsc-card-accent{border-color:rgba(232,216,138,.5);',
    'background:linear-gradient(180deg,rgba(28,24,16,.96),rgba(10,8,6,.96));box-shadow:0 0 26px rgba(232,216,138,.18);}',
    '.vsc-card-val{margin:0;font-family:var(--civ-font-title,Georgia,serif);font-size:clamp(1.8rem,4vw,2.5rem);line-height:1.1;}',
    '.vsc-overlay.win .vsc-card-val{color:#e8d88a;}',
    '.vsc-overlay.win .vsc-card-accent .vsc-card-val{color:#f4e6a8;}',
    '.vsc-overlay.lose .vsc-card-val{color:#e8c8c8;}',
    '.vsc-card-label{margin:4px 0 0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#8a8070;}',
    '.vsc-overlay.win .vsc-card-accent .vsc-card-label{color:#a08030;}',
    '.vsc-overlay.lose .vsc-card-label{color:#8a7070;}',
    '.vsc-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin-top:48px;}',
    '.vsc-btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:60px;',
    'padding:0 44px;border-radius:8px;cursor:pointer;font-family:var(--civ-font-ui,"Segoe UI",Tahoma,sans-serif);',
    'font-size:16px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;border:1px solid #6a5212;',
    'border-top-color:#f8eea8;color:#2e2708;',
    'background:linear-gradient(180deg,#f0dc88,#b99a28);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 6px 20px rgba(232,216,138,.22);}',
    '.vsc-btn-primary:hover{filter:brightness(1.06);}',
    '.vsc-footer{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);',
    'font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#5a564c;pointer-events:none;}',
    '.vsc-overlay.lose .vsc-footer{color:#5a4a4a;}',
  ].join('');
  document.head.appendChild(s);
}

function displayKindBanner(rodzaj: VictoryRodzaj): string {
  switch (rodzaj) {
    case 'dominacja':
      return 'Zwycięstwo przez Dominację';
    case 'nauka':
      return 'Zwycięstwo naukowe';
    case 'przegrana':
      return 'Twoje imperium upadło';
    default:
      return 'Koniec gry';
  }
}

function displayHeadline(rodzaj: VictoryRodzaj): string {
  switch (rodzaj) {
    case 'dominacja':
      return 'ZWYCIĘSTWO';
    case 'nauka':
      return 'ZWYCIĘSTWO NAUKOWE';
    case 'przegrana':
      return 'KLĘSKA';
    default:
      return 'KONIEC GRY';
  }
}

function displayFlavorLine(data: VictoryScreenData): string {
  const { rodzaj, stats } = data;
  const civ = stats.civLabel?.trim();
  switch (rodzaj) {
    case 'dominacja':
      return civ ? `${civ} panuje nad znanym światem` : 'Dominacja w ostatniej epoce osiągnięta.';
    case 'nauka':
      return civ
        ? `${civ} wyrusza ku gwiazdom`
        : 'Wszystkie technologie opanowane — rakieta w drodze.';
    case 'przegrana':
      return civ
        ? `${civ} — koniec epoki`
        : 'Twoje panowanie dobiegło końca.';
    default:
      return '';
  }
}

function displayDividerMark(win: boolean): string {
  return win ? '&#9670;' : '&#10005;';
}

interface StatCard {
  value: string;
  label: string;
  accent?: boolean;
}

function buildStatCards(data: VictoryScreenData): StatCard[] {
  const { rodzaj, stats } = data;
  const cards: StatCard[] = [];

  if (rodzaj === 'przegrana') {
    cards.push({ value: String(stats.turn), label: 'Tur przetrwanych' });
    if (stats.eraLabel) {
      cards.push({ value: stats.eraLabel, label: 'Ostatnia epoka' });
    }
    cards.push({
      value: stats.civLabel?.trim() || '—',
      label: 'Cywilizacja',
      accent: true,
    });
    return cards;
  }

  cards.push({ value: String(stats.turn), label: 'Tur' });
  if (stats.eraLabel) {
    cards.push({ value: stats.eraLabel, label: 'Epoka' });
  }
  if (rodzaj === 'dominacja' && stats.powerShare != null) {
    cards.push({
      value: `${Math.round(stats.powerShare * 100)}%`,
      label: 'Power świata',
    });
  } else if (rodzaj === 'nauka') {
    cards.push({ value: '100%', label: 'Technologie' });
  }
  cards.push({
    value: stats.civLabel?.trim() || '—',
    label: 'Cywilizacja',
    accent: true,
  });
  return cards;
}

function renderStatCards(data: VictoryScreenData): string {
  return buildStatCards(data).map((card) => {
    const cls = 'vsc-card' + (card.accent ? ' vsc-card-accent' : '');
    return [
      `<div class="${cls}">`,
      `<div class="vsc-card-val">${esc(card.value)}</div>`,
      `<div class="vsc-card-label">${esc(card.label)}</div>`,
      '</div>',
    ].join('');
  }).join('');
}

function primaryButtonLabel(rodzaj: VictoryRodzaj): string {
  return rodzaj === 'przegrana' ? 'Spróbuj ponownie' : 'Nowa gra';
}

function buildOverlay(data: VictoryScreenData, onNewGame: () => void): HTMLDivElement {
  ensureStyles();
  const win = isVictoryRodzaj(data.rodzaj);
  const el = document.createElement('div');
  el.id = OVERLAY_ID;
  el.className = 'vsc-overlay ' + (win ? 'win' : 'lose');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', formatVictoryTitle(data.rodzaj, data.stats.turn));

  const footer = win
    ? 'The Game · Koniec gry · 1E'
    : 'The Game · Koniec gry — porażka · 1E';

  el.innerHTML = [
    '<div class="vsc-vignette" aria-hidden="true"></div>',
    '<div class="vsc-stage">',
    `<div class="vsc-emblem">${win ? LAUREL_SVG : SHIELD_FAIL_SVG}</div>`,
    `<div class="vsc-kind">${esc(displayKindBanner(data.rodzaj))}</div>`,
    `<h1 class="vsc-headline">${esc(displayHeadline(data.rodzaj))}</h1>`,
    '<div class="vsc-divider" aria-hidden="true">',
    '<span class="vsc-divider-line"></span>',
    `<span class="vsc-divider-mark">${displayDividerMark(win)}</span>`,
    '<span class="vsc-divider-line right"></span>',
    '</div>',
    `<p class="vsc-flavor">${esc(displayFlavorLine(data))}</p>`,
    `<div class="vsc-cards">${renderStatCards(data)}</div>`,
    '<div class="vsc-actions">',
    `<button type="button" class="vsc-btn-primary" id="vsc-new-game">${esc(primaryButtonLabel(data.rodzaj))}</button>`,
    '</div>',
    '</div>',
    `<div class="vsc-footer" aria-hidden="true">${esc(footer)}</div>`,
  ].join('');

  el.querySelector('#vsc-new-game')?.addEventListener('click', () => {
    hideVictoryScreen();
    onNewGame();
  });

  return el;
}

/** Pełnoekranowy ekran końca gry. */
export function showVictoryScreen(data: VictoryScreenData, onNewGame: () => void): void {
  hideVictoryScreen();
  overlayEl = buildOverlay(data, onNewGame);
  document.body.appendChild(overlayEl);
}

export function hideVictoryScreen(): void {
  overlayEl?.remove();
  overlayEl = null;
  document.getElementById('__gameover_overlay__')?.remove();
}

export function isVictoryScreenOpen(): boolean {
  return overlayEl !== null;
}
