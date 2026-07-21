/**
 * diplomacyAudience.ts — ekran audiencji dyplomatycznej (D3-Q1…Q4).
 * DECOUPLED: zero importów game/*; callbacki z SILNIK.
 */
import type { CivBonusLite } from '../game/production';
import { tierLabel } from './diplomacyPanel';
import {
  civLeaderMedallionHtmlById,
  dipBrandIconHtml,
  DIPLO_1E_SHARED_CSS,
  ensureDiploBrandScope,
  tierBadgeHtml,
} from './diploUiSkin';
import { mocLabel } from './power-labels';
import {
  actionNeedsNegotiation,
  showNegotiationModal,
  type NegotiationModalContext,
  type NegotiationPayload,
} from './diplomacyNegotiationModal';
import { actionUsesTradeBasket, showTradeBasketModal } from './diplomacyTradeBasket';

export interface AudienceAction {
  id: string;
  label: string;
  enabled: boolean;
  tooltip?: string;
  opis?: string;
}

export interface DiplomacyAudienceState {
  playerTitle: string;
  playerCivName: string;
  otherTitle: string;
  otherCivName: string;
  zaufanie: number;
  respekt: number;
  tier: number;
  layer: 'simplified' | 'full' | 'pre_contact';
  contactEstablished: boolean;
  actions: readonly AudienceAction[];
  /** Suma zaufanie + respekt (0–200). */
  relacjaTotal?: number;
  /** D4: ile Zauf. z PN już w tej turze (limit 5). */
  trustPnGainedThisTurn?: number;
  /** D4-W3-B: próg Relacji na czysty dar. */
  progDarRelacja?: number;
  /** Obiektywna Moc gracza (P-A). */
  playerPower?: number;
  /** Obiektywna Moc rozmówcy. */
  otherPower?: number;
  /** Stosunek tekstowy np. „2:1". */
  powerRatioLabel?: string;
  /** Aktywne traktaty do wyświetlenia (v1.1). */
  activeTreaties?: readonly { label: string; detail?: string }[];
  /**
   * J: JAWNY formalny status relacji (odrębny od nastawienia/tier). Odpowiada na
   * pytanie „wojna czy tylko nastawienie?": wojna / sojusz / pakt / pokój / brak kontaktu.
   */
  formalStatus?: { label: string; kind: 'wojna' | 'sojusz' | 'pakt' | 'pokoj' | 'brak' };
  /** Tagi charakteru (D3-UX-3B) — bez liczb. */
  personalityTags?: readonly string[];
  /** Epoka rozmówcy (etykieta PL). */
  otherEpochLabel?: string;
  /** ikonaId rozmówcy (z civs.json — nie po nazwie wyświetlanej). */
  otherIkonaId?: string;
  /** kolorHex rozmówcy (#RRGGBB). */
  otherKolorHex?: string;
  /** Progi na paskach (readonly z JSON). */
  thresholds?: { sojuszZaufanie?: number; techZaufanie?: number };
}

export interface DiplomacyAudienceConfig {
  ownerId: number;
  getState: () => DiplomacyAudienceState | null;
  /** payload opcjonalny — po modalu negocjacji v1.1 */
  onAction: (ownerId: number, actionId: string, payload?: NegotiationPayload) => void;
  onBack: () => void;
  /** Etykieta przycisku zamknięcia — „Wróć” (lista) lub „Wyjście” (mapa). */
  backLabel?: string;
  /** Bonusy cywilizacji (civs.json) — SILNIK: civBonusyForOwnerId. */
  getCivBonusy?: (ownerId: number) => readonly CivBonusLite[];
  /** Kontekst modali negocjacji (wrogowie, tech, opłaty granic). */
  getNegotiationContext?: (actionId: string) => NegotiationModalContext | null;
}

let cfg: DiplomacyAudienceConfig | null = null;
let rootEl: HTMLDivElement | null = null;
let modalOverlay: HTMLDivElement | null = null;

function childModalBlocksExit(): boolean {
  if (modalOverlay !== null) return true;
  const neg = document.querySelector('.civ-diplo-neg-overlay') as HTMLElement | null;
  if (neg && neg.style.display !== 'none') return true;
  const basket = document.querySelector('.civ-diplo-basket-overlay') as HTMLElement | null;
  if (basket && basket.style.display !== 'none') return true;
  return false;
}

function onAudienceEsc(ev: KeyboardEvent): void {
  if (ev.key !== 'Escape' || cfg === null || rootEl === null || rootEl.style.display === 'none') return;
  if (childModalBlocksExit()) return;
  ev.preventDefault();
  cfg.onBack();
}

const RESPEKT_TOOLTIP_PL =
  'Respekt = jak duża jest wasza Moc w porównaniu z tą nacją. 50 = równi. Wyżej = jesteś silniejszy.';

const STYLE_ID = 'civ-diplo-aud-css-1e';

function ensureStyles(): void {
  ensureDiploBrandScope();
  document.getElementById('civ-diplo-aud-css')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
${DIPLO_1E_SHARED_CSS}
.civ-diplo-aud{position:fixed;inset:0;z-index:400;background:rgba(5,6,10,.88);
  display:flex;align-items:center;justify-content:center;padding:16px;
  font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;}
.civ-diplo-aud-box{width:min(860px,96vw);max-height:90vh;overflow:auto;
  background:var(--tg-panel-grad,linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98)));
  border:var(--tg-border-gold,2px solid rgba(232,216,138,.4));border-radius:var(--tg-radius-panel,14px);
  padding:0;box-shadow:0 16px 44px rgba(0,0,0,.75);}
.civ-diplo-aud-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px 12px;gap:0.75em;}
.civ-diplo-aud-head h2{margin:0;font-family:var(--tg-font-title,Georgia,serif);font-size:1.15em;
  color:var(--tg-gold-primary,#e8d88a);letter-spacing:.04em;display:flex;align-items:center;gap:8px;}
.civ-diplo-aud-head h2 .dip-ic{width:22px;height:22px;}
.civ-diplo-aud-hero{height:220px;background:radial-gradient(400px 220px at 50% 40%,rgba(201,162,74,.22),transparent 70%),
  linear-gradient(180deg,#1a1610,#0c0a08);display:flex;align-items:center;justify-content:center;
  border-bottom:1px solid rgba(232,216,138,.2);}
.civ-diplo-aud-body{padding:20px 24px 18px;text-align:center;}
.civ-diplo-aud-name{font-family:var(--tg-font-title,Georgia,serif);font-weight:700;font-size:1.65em;color:var(--tg-gold-primary,#e8d88a);}
.civ-diplo-aud-title{font-size:0.72em;color:var(--tg-text-muted,#8a8070);margin-top:4px;
  letter-spacing:.14em;text-transform:uppercase;}
.civ-diplo-aud-player{font-size:0.72em;color:var(--tg-text-muted,#8a8070);margin-bottom:12px;text-align:left;padding:0 20px;}
.civ-diplo-aud-mood{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:6px 16px;
  border-radius:20px;background:rgba(80,176,112,.08);border:1px solid rgba(80,176,112,.35);
  font-size:0.72em;letter-spacing:.08em;text-transform:uppercase;color:#7ad0a0;}
.civ-diplo-aud-mood.war{background:rgba(200,64,64,.08);border-color:rgba(200,64,64,.35);color:#e08a8a;}
.civ-diplo-aud-bonus{margin-top:10px;text-align:center;font-size:0.68em;line-height:1.4;color:var(--tg-text-muted,#8a8070);}
.civ-diplo-aud-bonus li{margin:2px 0;padding-left:0;list-style:none;}
.civ-diplo-aud-bonus li::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;
  background:#e8d88a;margin-right:6px;vertical-align:middle;}
.civ-diplo-aud-rel{text-align:center;padding:12px 20px;margin:0;
  border-top:1px solid rgba(232,216,138,.18);border-bottom:1px solid rgba(232,216,138,.18);
  color:var(--civ-text-pergament,#c8b898);font-size:0.84em;}
.civ-diplo-aud-rel b{color:var(--tg-gold-primary,#e8d88a);}
.civ-diplo-aud-rel-badge{margin-bottom:8px;}
.civ-diplo-aud-bar-row{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:0.78em;}
.civ-diplo-aud-bar-lbl{min-width:72px;text-align:right;color:#8a8070;}
.civ-diplo-aud-bar-track{flex:1;height:8px;background:rgba(20,26,36,.8);border-radius:4px;overflow:hidden;
  border:1px solid rgba(232,216,138,.12);}
.civ-diplo-aud-bar-fill{height:100%;background:linear-gradient(90deg,rgba(232,216,138,.35),rgba(232,216,138,.75));border-radius:4px;}
.civ-diplo-aud-bar-val{min-width:28px;text-align:left;color:#e8d88a;}
.civ-diplo-aud-power{margin:6px 0;font-size:0.78em;color:#a8a090;}
.civ-diplo-aud-treaties{margin:6px 0;font-size:0.72em;color:#8a8070;}
.civ-diplo-aud-treaty{display:inline-block;padding:2px 8px;margin:2px 3px;border-radius:12px;
  border:1px solid rgba(80,176,112,.35);background:rgba(80,176,112,.08);color:#a8d8b8;}
.civ-diplo-aud-tags{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;justify-content:center;}
.civ-diplo-aud-tag{font-size:0.65em;padding:3px 8px;border-radius:10px;
  border:1px solid rgba(160,140,200,.35);background:rgba(100,80,140,.12);color:#c8b8e8;}
.civ-diplo-aud-epoch{font-size:0.68em;color:#8a8070;margin-top:4px;}
.civ-diplo-aud-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;padding:14px 20px 18px;}
.civ-diplo-aud-card{text-align:left;padding:10px 12px;border-radius:8px;cursor:pointer;
  border:1px solid rgba(232,216,138,.22);background:rgba(232,216,138,.05);color:#e8e0c8;font-family:inherit;}
.civ-diplo-aud-card:hover:not(.locked){background:rgba(232,216,138,.14);border-color:rgba(232,216,138,.45);}
.civ-diplo-aud-card.locked{opacity:0.45;cursor:not-allowed;border-color:rgba(80,90,100,0.35);}
.civ-diplo-aud-card-title{font-weight:700;font-size:0.84em;margin-bottom:3px;color:#e8d88a;}
.civ-diplo-aud-card-hint{font-size:0.68em;color:#8a8070;}
.civ-diplo-modal-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.55);
  display:flex;align-items:center;justify-content:center;}
.civ-diplo-modal{background:linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98));
  border:2px solid rgba(232,216,138,.4);border-radius:12px;padding:18px 20px;max-width:340px;color:#e8e0c8;
  font:14px 'Segoe UI',Tahoma,sans-serif;}
.civ-diplo-modal h3{margin:0 0 10px;font-family:Georgia,serif;font-size:1em;color:#e8d88a;}
.civ-diplo-modal p{margin:0 0 14px;line-height:1.45;color:#c8b898;}
.civ-diplo-modal .cd-modal-btns{display:flex;gap:8px;justify-content:flex-end;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function showWarConfirmModal(civName: string, onConfirm: () => void): void {
  if (modalOverlay !== null) modalOverlay.remove();
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'civ-diplo-modal-overlay';
  modalOverlay.innerHTML =
    '<div class="civ-diplo-modal" role="dialog" aria-modal="true">' +
      '<h3>Wypowiedzieć wojnę?</h3>' +
      '<p>Na pewno wypowiadasz wojnę <strong>' + esc(civName) + '</strong>?</p>' +
      '<div class="cd-modal-btns">' +
        '<button type="button" class="dip-muted-btn cd-modal-cancel">Anuluj</button>' +
        '<button type="button" class="dip-gold-btn cd-modal-ok" style="border-color:rgba(200,64,64,.5);color:#e08a8a;">Tak</button>' +
      '</div></div>';
  document.body.appendChild(modalOverlay);
  const close = (): void => {
    if (modalOverlay !== null) { modalOverlay.remove(); modalOverlay = null; }
  };
  modalOverlay.querySelector('.cd-modal-cancel')?.addEventListener('click', close);
  modalOverlay.querySelector('.cd-modal-ok')?.addEventListener('click', () => { close(); onConfirm(); });
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) close(); });
}

function bonusListHtml(bonusy: readonly CivBonusLite[]): string {
  const lines = bonusy.map(b => (b.opis ?? '').trim()).filter(Boolean).slice(0, 3);
  if (lines.length === 0) return '';
  return '<ul class="civ-diplo-aud-bonus">' + lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>';
}

function progressBarHtml(label: string, value: number, max: number, tooltip?: string): string {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const tip = tooltip ? ' title="' + esc(tooltip) + '"' : '';
  return (
    '<div class="civ-diplo-aud-bar-row"' + tip + '>' +
      '<span class="civ-diplo-aud-bar-lbl">' + esc(label) + '</span>' +
      '<div class="civ-diplo-aud-bar-track"><div class="civ-diplo-aud-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="civ-diplo-aud-bar-val">' + value + '</span>' +
    '</div>'
  );
}

function relationSectionHtml(st: DiplomacyAudienceState): string {
  const relTotal = st.relacjaTotal ?? (st.zaufanie + st.respekt);
  let html = '<div class="civ-diplo-aud-rel">';
  if (st.formalStatus) {
    const fsColors: Record<string, string> = {
      wojna: '#e05a5a', sojusz: '#5ad07a', pakt: '#8ec5ff', pokoj: '#d4cba0', brak: '#8b97a8',
    };
    const c = fsColors[st.formalStatus.kind] ?? '#d4cba0';
    html += '<div class="civ-diplo-aud-formal" title="Formalny stan relacji — odrębny od nastawienia"' +
      ' style="font-weight:700;letter-spacing:.05em;text-transform:uppercase;font-size:0.8em;color:' + c +
      ';border:1px solid ' + c + '66;border-radius:5px;padding:3px 9px;margin-bottom:7px;display:inline-block">' +
      'STATUS: ' + esc(st.formalStatus.label) + '</div>';
  }
  html += '<div class="civ-diplo-aud-rel-badge">' + tierBadgeHtml(st.tier, tierLabel(st.tier)) + '</div>';
  html += '<div>Relacja <b>' + relTotal + '</b></div>';
  html += progressBarHtml('Zaufanie', st.zaufanie, 100);
  html += progressBarHtml('Respekt', st.respekt, 100, RESPEKT_TOOLTIP_PL);
  if (st.playerPower !== undefined && st.otherPower !== undefined) {
    const ratio = st.powerRatioLabel ? ' (' + st.powerRatioLabel + ')' : '';
    html += '<div class="civ-diplo-aud-power">' + esc(mocLabel()) + ': ' +
      st.playerPower + ' vs ' + st.otherPower + ratio + '</div>';
  }
  if (st.activeTreaties && st.activeTreaties.length > 0) {
    html += '<div class="civ-diplo-aud-treaties">Traktaty: ';
    html += st.activeTreaties.map(t =>
      '<span class="civ-diplo-aud-treaty"' +
      (t.detail ? ' title="' + esc(t.detail) + '"' : '') + '>' + esc(t.label) + '</span>',
    ).join('');
    html += '</div>';
  }
  if (!st.contactEstablished) {
    html += '<div style="color:#e0b24a;margin-top:4px">Brak formalnego kontaktu</div>';
  }
  html += '</div>';
  return html;
}

function personalityTagsHtml(tags: readonly string[] | undefined): string {
  if (!tags || tags.length === 0) return '';
  return '<div class="civ-diplo-aud-tags">' +
    tags.map(t => '<span class="civ-diplo-aud-tag">' + esc(t) + '</span>').join('') +
    '</div>';
}

function moodLabel(tier: number): string {
  const t = Math.max(0, Math.min(4, Math.round(tier)));
  if (t === 0) return 'Wrogi';
  if (t === 1) return 'Nieufny';
  if (t === 2) return 'Neutralny';
  if (t === 3) return 'Życzliwy';
  return 'Przyjazny';
}

function render(): void {
  if (rootEl === null || cfg === null) return;
  const st = cfg.getState();
  if (st === null) {
    rootEl.innerHTML = '<div class="civ-diplo-aud-box"><p>Brak danych audiencji.</p></div>';
    return;
  }

  const cards = st.actions.map(a => {
    const cls = a.enabled ? 'civ-diplo-aud-card' : 'civ-diplo-aud-card locked';
    const hint = a.tooltip || a.opis || '';
    return (
      '<button type="button" class="' + cls + '" data-aid="' + esc(a.id) + '"' +
      (a.enabled ? '' : ' disabled title="' + esc(hint) + '"') + '>' +
      '<div class="civ-diplo-aud-card-title">' + esc(a.label) + '</div>' +
      (hint ? '<div class="civ-diplo-aud-card-hint">' + esc(hint.length > 80 ? hint.slice(0, 77) + '…' : hint) + '</div>' : '') +
      '</button>'
    );
  }).join('');

  const playerBon = cfg.getCivBonusy?.(0) ?? [];
  const otherBon = cfg.getCivBonusy?.(cfg.ownerId) ?? [];
  const headIc = dipBrandIconHtml('tb-diplomacy', 24, 'dip-ic') ?? '';
  const moodCls = st.tier <= 1 ? 'civ-diplo-aud-mood war' : 'civ-diplo-aud-mood';

  rootEl.innerHTML =
    '<div class="civ-diplo-aud-box">' +
      '<div class="civ-diplo-aud-head">' +
        '<h2>' + headIc + 'Audiencja dyplomatyczna</h2>' +
        '<button type="button" class="dip-muted-btn civ-diplo-aud-back">' + esc(cfg!.backLabel ?? 'Wyjście') + '</button>' +
      '</div>' +
      '<div class="civ-diplo-aud-player">Ty: ' + esc(st.playerCivName) + ' · ' + esc(st.playerTitle) +
        (playerBon.length ? ' · ' + esc((playerBon[0]?.opis ?? '').trim()) : '') +
      '</div>' +
      '<div class="civ-diplo-aud-hero">' +
        civLeaderMedallionHtmlById(st.otherIkonaId ?? 'grecy', st.otherKolorHex) +
      '</div>' +
      '<div class="civ-diplo-aud-body">' +
        '<div class="civ-diplo-aud-name">' + esc(st.otherCivName) + '</div>' +
        /* otherCivName — sformatowane przez silnik (formatEntityDisplayName / ownerDiploLabel) */
        '<div class="civ-diplo-aud-title">' + esc(st.otherTitle) +
          (st.otherEpochLabel ? ' · ' + esc(st.otherEpochLabel) : '') + '</div>' +
        '<div class="' + moodCls + '">Nastawienie: ' + esc(moodLabel(st.tier)) + '</div>' +
        personalityTagsHtml(st.personalityTags) +
        bonusListHtml(otherBon) +
      '</div>' +
      relationSectionHtml(st) +
      '<div class="civ-diplo-aud-grid">' + cards + '</div>' +
    '</div>';

  rootEl.querySelector('.civ-diplo-aud-back')?.addEventListener('click', () => cfg!.onBack());
  rootEl.querySelectorAll<HTMLButtonElement>('button[data-aid]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const aid = btn.getAttribute('data-aid');
      if (!aid || cfg === null) return;

      const action = st.actions.find(a => a.id === aid);
      if (action && action.enabled && cfg.getNegotiationContext) {
        const negCtx = cfg.getNegotiationContext(aid);
        if (negCtx && actionUsesTradeBasket(aid)) {
          const basketCtx: NegotiationModalContext = {
            ...negCtx,
            relacjaTotal: negCtx.relacjaTotal ?? st.relacjaTotal ?? (st.zaufanie + st.respekt),
            trustPnGainedThisTurn: negCtx.trustPnGainedThisTurn ?? st.trustPnGainedThisTurn ?? 0,
            progDarRelacja: negCtx.progDarRelacja ?? st.progDarRelacja,
          };
          showTradeBasketModal(
            aid === '13' ? 'gift' : 'trade',
            action,
            basketCtx,
            (payload) => cfg!.onAction(cfg!.ownerId, aid, payload),
            () => { /* anulowano */ },
          );
          return;
        }
        if (action && action.enabled && actionNeedsNegotiation(aid) && negCtx) {
          showNegotiationModal(
            action,
            negCtx,
            (payload) => cfg!.onAction(cfg!.ownerId, aid, payload),
            () => { /* anulowano */ },
          );
          return;
        }
      }
      cfg.onAction(cfg.ownerId, aid);
    });
  });
}

export function showDiplomacyAudience(config: DiplomacyAudienceConfig): void {
  cfg = config;
  ensureStyles();
  if (rootEl === null) {
    rootEl = document.createElement('div');
    rootEl.className = 'civ-diplo-aud';
    document.body.appendChild(rootEl);
  }
  render();
  rootEl.style.display = 'flex';
  document.addEventListener('keydown', onAudienceEsc);
}

export function updateDiplomacyAudience(): void {
  render();
}

export function hideDiplomacyAudience(): void {
  document.removeEventListener('keydown', onAudienceEsc);
  if (rootEl !== null) rootEl.style.display = 'none';
}

export function isDiplomacyAudienceOpen(): boolean {
  return rootEl !== null && rootEl.style.display !== 'none';
}

export { type NegotiationPayload, type NegotiationModalContext } from './diplomacyNegotiationModal';
export { showTradeBasketModal, hideTradeBasketModal, actionUsesTradeBasket } from './diplomacyTradeBasket';
export { showDiplomacyProposalBanner, hideDiplomacyProposalBanner } from './diplomacyProposalBanner';
