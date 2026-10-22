/**
 * empireOverlayHud.ts — overlaye imperium: Kultura + Religia (A1-Q16=A).
 */

import { brandIconSvg } from './icons/brandAssets';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

export interface CultureOverlayData {
  kulturaTotal: number;
  kulturaRate: number;
  cityCount: number;
  cities: Array<{ name: string; kultura: number; borderRadius: number }>;
  /** Opcjonalnie — pełniejszy A1-Q12a gdy silnik dostarczy. */
  thresholds?: number[];
  nextThreshold?: number | null;
  pctToNext?: number;
  happinessNote?: string;
  sourcesNote?: string;
}

export interface ReligionOverlayData {
  stateReligion: string;
  cityCount: number;
  cities: Array<{ name: string; dominujaca: string; udzialPct: number }>;
  /** Opcjonalnie — pełniejszy A1-Q12b gdy silnik dostarczy. */
  spreadNote?: string;
  dominanceThresholdPct?: number;
  dominantCityCount?: number;
  foreignCityCount?: number;
  happinessNote?: string;
}

const STYLE_ID = 'civ-empire-overlay-css';
let root: HTMLDivElement | null = null;

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-emp-ov{position:fixed;inset:0;z-index:800;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.72);font:13px 'Segoe UI',Tahoma,sans-serif;color:#e8ebf0;}
.civ-emp-box{min-width:320px;max-width:440px;max-height:80vh;overflow:auto;
  background:linear-gradient(180deg,#1e2430,#141820);border:2px solid rgba(180,140,220,0.4);
  border-radius:10px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,0.65);}
.civ-emp-box h2{margin:0 0 8px;font-size:16px;}
.civ-emp-box .sum{font-size:12px;color:#9aa6b6;margin-bottom:10px;}
.civ-emp-box table{width:100%;border-collapse:collapse;font-size:12px;}
.civ-emp-box th,.civ-emp-box td{padding:4px 6px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.06);}
.civ-emp-close{margin-top:12px;width:100%;padding:8px;cursor:pointer;border-radius:6px;
  border:1px solid rgba(180,140,220,0.35);background:rgba(180,140,220,0.1);color:#f5e6c8;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function mount(title: string, bodyHtml: string, onClose?: () => void): void {
  hideEmpireOverlay();
  ensureStyles();
  root = document.createElement('div');
  root.className = 'civ-emp-ov';
  const box = document.createElement('div');
  box.className = 'civ-emp-box';
  box.innerHTML = '<h2>' + title + '</h2>' + bodyHtml
    + '<button type="button" class="civ-emp-close">Zamknij</button>';
  root.appendChild(box);
  document.body.appendChild(root);
  root.addEventListener('click', (e) => { if (e.target === root) { hideEmpireOverlay(); onClose?.(); } });
  box.querySelector('.civ-emp-close')?.addEventListener('click', () => {
    hideEmpireOverlay();
    onClose?.();
  });
  // P-MENU-ESCAPE-NIEPELNOEKRANOWE (Maciej 2026-08-14): wpięcie w stos overlayów, żeby
  // Escape zamykał ten panel zamiast przebijać do przeglądarki i wychodzić z pełnego ekranu
  // (patrz escapeOverlayStack.ts). / EN: wired into the overlay stack so Escape closes this
  // panel instead of falling through to the browser and exiting fullscreen.
  pushOverlay('empire-overlay', () => { hideEmpireOverlay(); onClose?.(); });
}

export function showCultureOverlay(data: CultureOverlayData, onClose?: () => void): void {
  let body = '<div class="sum">Imperium: <b>' + data.kulturaTotal + '</b> kultury · '
    + (data.kulturaRate >= 0 ? '+' : '') + data.kulturaRate + '/t · '
    + data.cityCount + ' miast</div>';
  if (data.thresholds && data.thresholds.length > 0) {
    body += '<p style="font-size:11px;color:#9aa6b6;margin:0 0 8px">Progi zasięgu: '
      + data.thresholds.join(' · ') + '</p>';
  }
  if (data.nextThreshold != null && data.pctToNext != null) {
    body += '<p style="font-size:11px;color:#c080e0;margin:0 0 8px">Do progu '
      + data.nextThreshold + ': <b>' + data.pctToNext + '%</b></p>';
  }
  if (data.happinessNote) {
    body += '<p style="font-size:11px;color:#9aa6b6;margin:0 0 8px">' + esc(data.happinessNote) + '</p>';
  }
  body += '<table><tr><th>Miasto</th><th>Kultura</th><th>Zasięg</th></tr>';
  for (const c of data.cities) {
    body += '<tr><td>' + esc(c.name) + '</td><td>' + c.kultura + '</td><td>' + c.borderRadius + ' hex</td></tr>';
  }
  body += '</table>';
  if (data.sourcesNote) {
    body += '<p style="font-size:11px;color:#7a8494;margin-top:8px">' + esc(data.sourcesNote) + '</p>';
  }
  body += '<p style="font-size:11px;color:#7a8494;margin-top:8px">Klik ' + brandIconSvg('res-culture', 14)
    + ' przy minimapie = zasięg na mapie · dblclick = ten panel.</p>';
  mount(brandIconSvg('res-culture', 18) + ' Kultura imperium', body, onClose);
}

export function showReligionOverlay(data: ReligionOverlayData, onClose?: () => void): void {
  let body = '<div class="sum">Religia państwa: <b>' + esc(data.stateReligion) + '</b> · '
    + data.cityCount + ' miast</div>';
  if (data.dominanceThresholdPct != null) {
    body += '<p style="font-size:11px;color:#9aa6b6;margin:0 0 8px">Próg dominacji: '
      + data.dominanceThresholdPct + '% · miasta z własną wiarą: '
      + (data.dominantCityCount ?? '—') + ' · obca: ' + (data.foreignCityCount ?? '—') + '</p>';
  }
  if (data.spreadNote) {
    body += '<p style="font-size:11px;color:#d98a3a;margin:0 0 8px">' + esc(data.spreadNote) + '</p>';
  }
  if (data.happinessNote) {
    body += '<p style="font-size:11px;color:#9aa6b6;margin:0 0 8px">' + esc(data.happinessNote) + '</p>';
  }
  body += '<table><tr><th>Miasto</th><th>Dominująca</th><th>Udział</th></tr>';
  for (const c of data.cities) {
    body += '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.dominujaca) + '</td><td>' + c.udzialPct + '%</td></tr>';
  }
  body += '</table><p style="font-size:11px;color:#7a8494;margin-top:8px">Klik ' + brandIconSvg('res-religion', 14)
    + ' przy minimapie = zasięg na mapie · dblclick = ten panel.</p>';
  mount(brandIconSvg('res-religion', 18) + ' Religia imperium', body, onClose);
}

export function hideEmpireOverlay(): void {
  popOverlay('empire-overlay');
  if (root !== null) { root.remove(); root = null; }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
