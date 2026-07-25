/**
 * powerOverlayHud.ts — overlay Moc (P-A, P-C3): składniki + ranking.
 */

import { mocLabel, mocTitle, mocWithValue } from './power-labels';

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
  power: number;
  rank: number;
  isPlayer?: boolean;
}

export interface PowerOverlayData {
  power: number;
  components: PowerComponentRow[];
  ranking: PowerRankingRow[];
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
.civ-pow-box h2{margin:0 0 4px;font-size:17px;color:#e0b24a;}
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
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

export function showPowerOverlay(data: PowerOverlayData, onClose?: () => void, onRefresh?: () => void): void {
  hidePowerOverlay();
  ensureStyles();
  root = document.createElement('div');
  root.className = 'civ-pow-ov';
  const box = document.createElement('div');
  box.className = 'civ-pow-box';
  let html = '<h2>' + esc(mocTitle(data.power)) + '</h2>';
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
      html += (r.isPlayer ? '▸ ' : '  ') + '#' + r.rank + ' ' + esc(r.civ)
        + ' — ' + esc(mocWithValue(r.power)) + '<br>';
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
}

export function hidePowerOverlay(): void {
  if (root !== null) { root.remove(); root = null; }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
