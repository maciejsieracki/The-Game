/**
 * cityCaptureNotice.ts — tabliczka po zdobyciu pustego miasta (bez bitwy).
 * Styl spójny z cityAttackChoice / siegeMapPanel.
 */

import { brandIconSvg } from './icons/brandAssets';

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-city-capture-css-v1';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes ccn-in{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:none}}
.civ-ccn-overlay{
  position:fixed;inset:0;z-index:660;display:flex;align-items:center;justify-content:center;
  background:rgba(4,8,18,0.62);backdrop-filter:blur(3px);animation:ccn-in .22s ease-out;
}
.civ-ccn{
  --gold:#e8d88a;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8ebf0;
  --panel:linear-gradient(165deg,rgba(14,20,36,0.97),rgba(8,12,24,0.98));
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  min-width:min(360px,calc(100vw - 32px));max-width:420px;
  background:var(--panel);border:1px solid rgba(232,216,138,0.42);border-radius:14px;
  box-shadow:0 20px 60px rgba(0,0,0,0.65);overflow:hidden;animation:ccn-in .28s ease-out;
  text-align:center;
}
.civ-ccn *{box-sizing:border-box;}
.civ-ccn-hdr{padding:20px 22px 12px;}
.civ-ccn-ic{
  display:flex;align-items:center;justify-content:center;margin-bottom:10px;line-height:0;
}
.civ-ccn-ic .siege-modal-ic{width:48px;height:48px;color:var(--gold);}
.civ-ccn-title{
  font:700 12px/1.2 Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);
}
.civ-ccn-name{font-size:20px;font-weight:700;color:#f0e8b8;margin:10px 0 6px;}
.civ-ccn-sub{font-size:12px;color:var(--muted);line-height:1.45;padding:0 18px 16px;}
.civ-ccn-foot{padding:0 22px 20px;}
.civ-ccn-btn{
  font:inherit;font-size:12px;font-weight:700;cursor:pointer;width:100%;
  padding:10px 16px;border-radius:8px;border:1px solid rgba(232,216,138,0.35);
  background:linear-gradient(135deg,rgba(232,216,138,0.22),rgba(201,168,76,0.18));
  color:#f0e8b8;
}
.civ-ccn-btn:hover{filter:brightness(1.08);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function modalIcon(id: string, size: 20 | 24 = 24): string {
  const svg = brandIconSvg(id, size);
  return svg ? svg.replace('<svg ', '<svg class="siege-modal-ic" ') : '';
}

function close(onDismiss?: () => void): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
  if (root) {
    root.remove();
    root = null;
  }
  onDismiss?.();
}

/** Tabliczka: miasto zdobyte bez walki (brak obrońców). */
export function showCityCaptureNotice(
  cityName: string,
  opts?: { subtitle?: string; onDismiss?: () => void },
): void {
  close();
  ensureStyles();

  const subtitle = opts?.subtitle
    ?? 'Miasto było bez obrońców — wojsko weszło bez strat.';

  root = document.createElement('div');
  root.className = 'civ-ccn-overlay';
  root.addEventListener('click', (e) => {
    if (e.target === root) close(opts?.onDismiss);
  });

  const box = document.createElement('div');
  box.className = 'civ-ccn';
  box.innerHTML =
    '<div class="civ-ccn-hdr">' +
      '<div class="civ-ccn-ic">' + modalIcon('cp-buildings', 24) + '</div>' +
      '<div class="civ-ccn-title">Miasto zdobyte</div>' +
      '<div class="civ-ccn-name">' + esc(cityName) + '</div>' +
      '<div class="civ-ccn-sub">' + esc(subtitle) + '</div>' +
    '</div>' +
    '<div class="civ-ccn-foot">' +
      '<button type="button" class="civ-ccn-btn" data-ok>Rozumiem · Enter</button>' +
    '</div>';

  box.querySelector('[data-ok]')?.addEventListener('click', () => close(opts?.onDismiss));
  box.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(box);
  document.body.appendChild(root);

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      close(opts?.onDismiss);
    }
  };
  document.addEventListener('keydown', keyHandler);
}

export function hideCityCaptureNotice(): void {
  close();
}

export function isCityCaptureNoticeOpen(): boolean {
  return root !== null;
}
