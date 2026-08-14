/**
 * powerOverlayHud.ts — overlay Moc (P-A, P-C3): składniki + ranking.
 */

import { mocLabel, mocTitle, mocWithValue } from './power-labels';
import { pushOverlay, popOverlay } from './escapeOverlayStack';
// UWAGA: celowo BEZ statycznego `import ... from './icons/brandAssets'` tutaj — ten moduł
// zawiera `import.meta.glob` (konstrukcja Vite), która wybucha przy esbuild-bundlowaniu do
// CJS/node (np. tools/power-ranking-view-test.cjs, który re-eksportuje stąd
// sortPowerRankingForMode/powerRankingValueForMode). Dlatego ikona SVG Mocy przychodzi
// gotowa od wywołującego (hud.ts, który bezpiecznie importuje brandAssets — ten plik NIE jest
// bundlowany przez esbuild w żadnym teście .cjs).
// / EN: deliberately NOT a static top-level import of brandAssets here — that module uses
// Vite's `import.meta.glob`, which throws when esbuild-bundled to CJS/node (as
// power-ranking-view-test.cjs does for this file's other exports). The Power SVG icon is
// therefore passed in pre-rendered by the caller (hud.ts) instead.

export interface PowerComponentRow {
  key: string;
  label: string;
  weightPct: number;
  /** Znormalizowany wkład 0..1 */
  normalized: number;
  /** Punkty ważone (normalized × waga) */
  points: number;
}

export interface PowerRankingRow {
  civ: string;
  /** Moc całkowita (suma wszystkich składników) — wartość i sortowanie domyślne. */
  power: number;
  /**
   * P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): Moc militarna = WYŁĄCZNIE Armia + Rekruci
   * (ekw. jedn.) — suma składników oznaczonych `military: true`.
   */
  powerMilitary: number;
  /**
   * P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): Moc gospodarcza = wszystkie składniki OPRÓCZ
   * Armii i Rekrutów (Obywatele, Miasta, Terytorium, Infrastruktura, Odkrycia/tech,
   * Ulepszenia terenu, Kultura, Jedność religii, Wygrane bitwy, Zdobycze/eliminacje).
   */
  powerEconomic: number;
  rank: number;
  isPlayer?: boolean;
  /** Globalna Wiarygodność (−100…+100) — WIAR §7 UI. */
  wiarygodnosc?: number;
}

/** P-MOC-PODZIAL-WIDOK: tryb widoku Rankingu Mocy — Całkowita/Gospodarcza/Militarna. */
export type PowerRankingViewMode = 'total' | 'economic' | 'military';

/** Wartość rankingowa danego wiersza dla wybranego trybu widoku. */
export function powerRankingValueForMode(row: PowerRankingRow, mode: PowerRankingViewMode): number {
  if (mode === 'economic') return row.powerEconomic;
  if (mode === 'military') return row.powerMilitary;
  return row.power;
}

/** Ranking Mocy re-posortowany i re-ponumerowany wg wybranego trybu widoku (cała lista, nie tylko gracz). */
export function sortPowerRankingForMode(
  rows: readonly PowerRankingRow[],
  mode: PowerRankingViewMode,
): PowerRankingRow[] {
  const sorted = [...rows].sort((a, b) => powerRankingValueForMode(b, mode) - powerRankingValueForMode(a, mode));
  return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
}

export interface AiMocDiagRow {
  ownerId: number;
  label: string;
  moc: number;
  miasta: number;
  /** Pula Pracy imperium — stan bieżący. */
  pracaPool: number;
  kolejkaPuste: number;
  kolejkaAktywne: number;
}

export interface PowerOverlayData {
  power: number;
  components: PowerComponentRow[];
  ranking: PowerRankingRow[];
  /** AI-MOC-NEXT-Q1=B: metryki diag per major owner (gracz + major AI). */
  diagMajorAi?: AiMocDiagRow[];
  respektExample?: { civ: string; respekt: number; playerPower: number; theirPower: number };
  /**
   * R-RANKING-MOC (Maciej 2026-07-24): pozycja ABSOLUTNA wśród WSZYSTKICH żyjących
   * cywilizacji (także nieodkrytych) — gracz ma znać swoje konkretne miejsce, nawet
   * nie znając rywali. `ranking` powyżej pokazuje tylko cywilizacje odkryte.
   */
  absoluteRank?: { rank: number; total: number };
}

const STYLE_ID = 'civ-power-overlay-css';
let root: HTMLDivElement | null = null;

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-pow-ov{position:fixed;inset:0;z-index:800;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.72);font:13px 'Segoe UI',Tahoma,sans-serif;color:#e8ebf0;}
.civ-pow-box{min-width:340px;max-width:480px;background:linear-gradient(180deg,#1e2430,#141820);
  border:2px solid rgba(224,178,74,0.45);border-radius:10px;padding:16px 18px;
  box-shadow:0 12px 40px rgba(0,0,0,0.65);}
.civ-pow-box h2{margin:0 0 4px;font-size:17px;color:#e0b24a;display:flex;align-items:center;gap:6px;}
.civ-pow-h2-ic{display:inline-flex;align-items:center;justify-content:center;color:#e0b24a;flex-shrink:0;}
.civ-pow-h2-ic svg{width:20px;height:20px;display:block;}
.civ-pow-box .sub{font-size:11px;color:#9aa6b6;margin-bottom:12px;}
.civ-pow-row{display:flex;align-items:center;gap:8px;margin:6px 0;}
.civ-pow-row .lbl{flex:0 0 130px;font-size:12px;}
.civ-pow-row .bar{flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;}
.civ-pow-row .fill{height:100%;background:linear-gradient(90deg,#8a6418,#e0b24a);}
.civ-pow-row .pts{flex:0 0 52px;text-align:right;font-size:11px;color:#9aa6b6;}
.civ-pow-rank{margin-top:14px;padding-top:10px;border-top:1px solid rgba(224,178,74,0.2);}
.civ-pow-rank b{color:#e0b24a;}
.civ-pow-resp{margin-top:10px;padding:8px;background:rgba(224,178,74,0.08);border-radius:6px;font-size:12px;}
.civ-pow-close{margin-top:14px;width:100%;padding:8px;cursor:pointer;border-radius:6px;
  border:1px solid rgba(224,178,74,0.35);background:rgba(224,178,74,0.12);color:#f5e6c8;font-weight:600;}
.civ-pow-close:hover{background:rgba(224,178,74,0.22);}
.civ-pow-diag{margin-top:12px;padding-top:10px;border-top:1px solid rgba(224,178,74,0.2);font-size:11px;}
.civ-pow-diag b{color:#e0b24a;font-size:12px;}
.civ-pow-diag table{width:100%;border-collapse:collapse;margin-top:6px;}
.civ-pow-diag th,.civ-pow-diag td{padding:3px 5px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.06);}
.civ-pow-diag th{color:#9aa6b6;font-weight:600;}
.civ-pow-diag td.num{text-align:right;font-variant-numeric:tabular-nums;}
.civ-pow-diag tr.player td:first-child{color:#e0b24a;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

/**
 * @param mocIconSvg Gotowy znacznik `<svg>` ikony Mocy (np. `brandIconSvg('res-influence', 20)`
 *   z ./icons/brandAssets — wywołujący importuje ten moduł sam, patrz uwaga nad importami wyżej).
 *   Gdy pominięty/pusty, nagłówek pokazuje sam tekst tytułu bez ikony (bez fallbacku na `⚜`).
 *   / EN: pre-rendered `<svg>` markup for the Power icon, supplied by the caller.
 */
export function showPowerOverlay(
  data: PowerOverlayData,
  onClose?: () => void,
  onRefresh?: () => void,
  mocIconSvg?: string,
): void {
  hidePowerOverlay();
  ensureStyles();
  root = document.createElement('div');
  root.className = 'civ-pow-ov';
  const box = document.createElement('div');
  box.className = 'civ-pow-box';
  // Ikona SVG dokleja się przed tekstem BEZ esc() (esc() escapowałby znaczniki <svg>),
  // sam tekst tytułu nadal idzie przez esc() jak dotąd.
  // / EN: SVG icon is prepended without esc() (esc() would escape the <svg> markup),
  // the title text itself still goes through esc() as before.
  const mocIconHtml = mocIconSvg ? `<span class="civ-pow-h2-ic" aria-hidden="true">${mocIconSvg}</span>` : '';
  let html = '<h2>' + mocIconHtml + esc(mocTitle(data.power)) + '</h2>';
  html += '<div class="sub">Siła imperium — punkty obiektywne (P-A) · ranking · Respekt %</div>';
  for (const c of data.components) {
    const pct = Math.round(c.normalized * 100);
    html += '<div class="civ-pow-row"><span class="lbl">' + esc(c.label)
      + ' <span style="color:#7a8494">(×' + c.weightPct + ')</span></span>'
      + '<div class="bar"><div class="fill" style="width:' + pct + '%"></div></div>'
      + '<span class="pts">' + Math.round(c.points) + ' pt</span></div>';
  }
  if (data.ranking.length > 0) {
    html += '<div class="civ-pow-rank"><b>Ranking ' + esc(mocLabel()) + '</b><br>';
    for (const r of data.ranking) {
      const wPart = r.wiarygodnosc !== undefined
        ? ' · W ' + (r.wiarygodnosc > 0 ? '+' + Math.round(r.wiarygodnosc) : String(Math.round(r.wiarygodnosc)))
        : '';
      html += (r.isPlayer ? '▸ ' : '  ') + '#' + r.rank + ' ' + esc(r.civ)
        + ' — ' + esc(mocWithValue(r.power)) + wPart + '<br>';
    }
    html += '</div>';
  }
  if (data.absoluteRank) {
    const ar = data.absoluteRank;
    html += '<div class="civ-pow-rank">Twoja pozycja: <b>' + ar.rank + '. z ' + ar.total
      + '</b> cywilizacji (uwzględnia nieodkryte)</div>';
  }
  if (data.respektExample) {
    const ex = data.respektExample;
    html += '<div class="civ-pow-resp">Respekt wobec <b>' + esc(ex.civ) + '</b>: '
      + ex.respekt + '% (Twoja moc ' + ex.playerPower + ' vs ' + ex.theirPower + ')</div>';
  }
  if (data.diagMajorAi && data.diagMajorAi.length > 0) {
    html += '<div class="civ-pow-diag"><b>Diag major AI</b>'
      + '<table><thead><tr>'
      + '<th>Cyw.</th><th class="num">Moc</th><th class="num">Miast</th>'
      + '<th class="num">Praca</th><th class="num">Kol.∅</th><th class="num">Kol.▶</th>'
      + '</tr></thead><tbody>';
    for (const d of data.diagMajorAi) {
      const cls = d.ownerId === 0 ? ' class="player"' : '';
      html += '<tr' + cls + '><td>' + esc(d.label) + '</td>'
        + '<td class="num">' + Math.round(d.moc) + '</td>'
        + '<td class="num">' + d.miasta + '</td>'
        + '<td class="num">' + Math.round(d.pracaPool) + '</td>'
        + '<td class="num">' + d.kolejkaPuste + '</td>'
        + '<td class="num">' + d.kolejkaAktywne + '</td></tr>';
    }
    html += '</tbody></table></div>';
  }
  html += '<button type="button" class="civ-pow-close">Zamknij</button>';
  box.innerHTML = html;
  root.appendChild(box);
  document.body.appendChild(root);
  root.addEventListener('click', (e) => {
    if (e.target === root) { hidePowerOverlay(); onClose?.(); }
  });
  box.querySelector('.civ-pow-close')?.addEventListener('click', () => {
    hidePowerOverlay();
    onClose?.();
  });
  // P-MENU-ESCAPE-NIEPELNOEKRANOWE (Maciej 2026-08-14): wpięcie w stos overlayów, żeby
  // Escape zamykał ten panel zamiast przebijać do przeglądarki i wychodzić z pełnego ekranu
  // (patrz escapeOverlayStack.ts). / EN: wired into the overlay stack so Escape closes this
  // panel instead of falling through to the browser and exiting fullscreen.
  pushOverlay('power-overlay', () => { hidePowerOverlay(); onClose?.(); });
}

export function hidePowerOverlay(): void {
  popOverlay('power-overlay');
  if (root !== null) { root.remove(); root = null; }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
