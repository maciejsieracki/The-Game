/**
 * diplomacyAudience.ts — ekran audiencji dyplomatycznej (D3-Q1…Q4).
 * DECOUPLED: zero importów game/*; callbacki z SILNIK.
 */
import type { CivBonusLite } from '../game/production';
import {
  nastawienieHintPl,
  nastawienieLabelFromScore,
  type FormalDiplomaticKind,
} from '../game/diplomacy-display';
import {
  civLeaderMedallionHtmlById,
  dipBrandIconHtml,
  DIPLO_1E_SHARED_CSS,
  ensureDiploBrandScope,
} from './diploUiSkin';
import {
  actionNeedsNegotiation,
  showNegotiationModal,
  type NegotiationModalContext,
  type NegotiationPayload,
} from './diplomacyNegotiationModal';
import { actionUsesTradeBasket, showTradeBasketModal, openQuickDealBasket } from './diplomacyTradeBasket';

export interface AudienceAction {
  id: string;
  label: string;
  enabled: boolean;
  tooltip?: string;
  opis?: string;
  /**
   * FAZA 1 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 4) — blokada progowa spójna z
   * diplomacy-locks.ts. `locked` === `!enabled` z powodu progu/stanu (nie
   * "brak kontaktu", ta bramka zostaje osobna — patrz buildAudienceActions).
   */
  locked?: boolean;
  /** Notka w formacie makiety: „zablokowana — wymaga Zaufania 91 (masz 34)". */
  lockNote?: string;
  /** Umowa/traktat już zawarta między stronami (stan `active` z makiety v1.1). */
  active?: boolean;
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
  /**
   * Aktywne traktaty do wyświetlenia (v1.1). FAZA 2 (KROK 3 pkt 2+3): rozszerzone o
   * `sinceTurns`/`breakPenaltyLabel` (kolumna „Aktywne traktaty" stołu negocjacji +
   * baner statusu formalnego) — dane realne z ActiveDeal.zawartaTura/DIPLOMACY_PARAMS.
   */
  activeTreaties?: readonly {
    id?: string;
    label: string;
    detail?: string;
    sinceTurns?: number;
    breakPenaltyLabel?: string;
  }[];
  /**
   * J: JAWNY formalny status relacji (odrębny od nastawienia/tier). Odpowiada na
   * pytanie „wojna czy tylko nastawienie?": wojna / sojusz / pakt / pokój / brak kontaktu.
   */
  formalStatus?: { label: string; kind: FormalDiplomaticKind };
  /** Tagi charakteru (D3-UX-3B) — bez liczb. */
  personalityTags?: readonly string[];
  /** Epoka rozmówcy (etykieta PL). */
  otherEpochLabel?: string;
  /** ikonaId rozmówcy (z civs.json — nie po nazwie wyświetlanej). */
  otherIkonaId?: string;
  /** kolorHex rozmówcy (#RRGGBB). */
  otherKolorHex?: string;
  /** Etykieta okręgu kulturowego rozmówcy (np. „Grecka", „Chetycka"). */
  otherCultureLabel?: string;
  /** true = ten sam typ/okręg co gracz (silnik: typCywilizacji). */
  cultureCircleSame?: boolean;
  /** Progi na paskach (readonly z JSON). */
  thresholds?: { sojuszZaufanie?: number; techZaufanie?: number };
  /**
   * FAZA 1 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 6) — rozbicie relacji „za/przeciw"
   * z DIPLOMACY_PARAMS (rejestr jednorazowych zdarzeń + czynniki ciągłe aktywne
   * teraz). UI (kafelki) dopiero w fazie 2/3 — na razie dane płyną w stanie.
   */
  relationBreakdown?: { pozytywne: readonly { label: string; value: number; perTurn?: boolean }[]; negatywne: readonly { label: string; value: number; perTurn?: boolean }[] };

  // ---------------------------------------------------------------------
  // FAZA 2 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 1/2/5) — layout dwustronny.
  // ---------------------------------------------------------------------
  /** ikonaId gracza (civs.json) — medalion karty lewej. */
  playerIkonaId?: string;
  /** kolorHex gracza (#RRGGBB) — ramka medalionu karty lewej. */
  playerKolorHex?: string;
  /** Skarbiec gracza (kwota złota) — pkt 5: u gracza zamiast paska Zaufanie/Respekt. */
  playerSkarbiec?: number;
  /** Dochód złota/turę gracza (informacyjnie, jeśli dostępny — cache silnika). */
  playerZlotoPerTura?: number;
  /**
   * „Potencjał sojuszniczy" tej PARY (0–100 + etykieta) — dystans do progu sojuszu
   * (progSojuszZaufanie/progSojuszRelacja). Wartość jest per-relacja (nie per-cywilizacja
   * niezależnie), więc identyczna na obu kartach — mirror zgodny z makietą.
   */
  sojuszPotencjal?: { pct: number; label: string };
  /** „Dobra handlowe" gracza — nazwy (tech zbadane + katalog surowców, patrz main.ts). */
  playerGoods?: readonly string[];
  /** „Dobra handlowe" rozmówcy — nazwy (tech zbadane rozmówcy + katalog surowców). */
  otherGoods?: readonly string[];
  /**
   * Szczegóły bannera statusu formalnego (pkt 2) — od ilu tur trwa DOMINUJĄCY traktat
   * (ten sam co formalStatus.kind) + kara zerwania. Brak gdy kind=wojna/pokoj/brak
   * (nie ma traktatu, do którego by się to odnosiło).
   */
  formalStatusDetail?: { sinceTurns?: number; breakPenaltyLabel?: string };
}

export interface DiplomacyAudienceConfig {
  ownerId: number;
  getState: () => DiplomacyAudienceState | null;
  /** payload opcjonalny — po modalu negocjacji v1.1 */
  onAction: (ownerId: number, actionId: string, payload?: NegotiationPayload) => void;
  onBack: () => void;
  /** Etykieta przycisku zamknięcia — „Wróć” (lista) lub „Wyjście” (mapa). */
  backLabel?: string;
  /**
   * FAZA 2 (Makieta DYPLOMACJA v1.1, KROK 3) — zakładka „Znane frakcje" w środkowej
   * kolumnie, przełącza na istniejący ekran diploListHud (osobny od audiencji — patrz
   * dyspozycja). Brak = zakładka ukryta (np. wywołanie audiencji bez kontekstu listy).
   */
  onOpenKnownFactions?: () => void;
  /** Bonusy cywilizacji (civs.json) — SILNIK: civBonusyForOwnerId. */
  getCivBonusy?: (ownerId: number) => readonly CivBonusLite[];
  /** Kontekst modali negocjacji (wrogowie, tech, opłaty granic). */
  getNegotiationContext?: (actionId: string) => NegotiationModalContext | null;
  /**
   * Zaległość #2 — „Zerwij": dobrowolne zerwanie traktatu wskazanego przez `id`
   * (kolumna „Aktywne traktaty"). Brak = przycisk pozostaje wyłączony ("wkrótce").
   */
  onBreakTreaty?: (dealId: string) => void;
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
  display:flex;align-items:center;justify-content:center;padding:14px;
  font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;}
.civ-diplo-aud-box{width:min(1720px,98vw);max-height:94vh;overflow:auto;position:relative;
  /* FAZA 3 pkt 9 — tło granat 1E dokładnie wg makiety (NIE brąz), nie tokeny wspólne (przybliżenie). */
  background:
    radial-gradient(140% 100% at 50% -10%, rgba(55,50,32,.45) 0%, transparent 40%),
    linear-gradient(180deg,#111722 0%,#0b0f16 40%,#070a0f 100%);
  border:2px solid rgba(232,216,138,.4);border-radius:14px;
  padding:14px 16px 16px;box-shadow:0 16px 44px rgba(0,0,0,.75);
  display:flex;flex-direction:column;gap:11px;}
.civ-diplo-aud-head{display:flex;justify-content:space-between;align-items:center;gap:0.75em;}
.civ-diplo-aud-head h2{margin:0;font-family:var(--tg-font-title,Georgia,serif);font-size:1.15em;
  color:var(--tg-gold-primary,#e8d88a);letter-spacing:.04em;display:flex;align-items:center;gap:8px;}
.civ-diplo-aud-head h2 .dip-ic{width:22px;height:22px;}

/* ===== FAZA 2 pkt 2 — baner statusu formalnego ===== */
.da-banner{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;
  padding:8px 18px;border-radius:10px;border:1px solid rgba(232,216,138,.4);
  background:var(--tg-panel-grad,linear-gradient(180deg,rgba(18,24,32,.9),rgba(8,10,16,.9)));}
.da-banner .da-b-ic{width:19px;height:19px;flex-shrink:0;}
.da-banner .da-b-lbl{font-family:var(--tg-font-title,Georgia,serif);font-size:1.05em;font-weight:700;letter-spacing:.03em;}
.da-banner .da-b-sub{font-size:0.68em;color:#8a8070;letter-spacing:.02em;padding-left:9px;border-left:1px solid rgba(232,216,138,.2);}
.da-banner.da-tone-wojna{color:#e08a8a;border-color:rgba(200,64,64,.5);}
.da-banner.da-tone-sojusz{color:#7ad0a0;}
.da-banner.da-tone-pakt{color:#8ec5ff;}
.da-banner.da-tone-handel{color:#d4b870;}
.da-banner.da-tone-pokoj{color:#d4cba0;}
.da-banner.da-tone-brak{color:#8b97a8;}

/* ===== FAZA 2 pkt 1 — układ dwustronny ===== */
.da-mainrow{display:flex;gap:11px;align-items:stretch;min-width:0;flex-wrap:nowrap;}
.da-card{position:relative;width:230px;flex:0 0 230px;min-width:180px;
  background:var(--tg-panel-grad,linear-gradient(180deg,rgba(18,24,32,.97),rgba(8,10,16,.97)));
  border:2px solid rgba(232,216,138,.22);border-radius:12px;padding:12px;
  display:flex;flex-direction:column;gap:9px;box-shadow:0 6px 20px rgba(0,0,0,.4);}
.da-card.you{border-color:rgba(58,106,208,.5);}
.da-card.them{border-color:rgba(210,120,30,.45);}
.da-portrait{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;
  padding-bottom:8px;border-bottom:1px solid rgba(232,216,138,.18);}
.da-portrait .dip-leader-medallion{width:64px;height:64px;}
.da-portrait .dip-leader-ic{width:32px;height:32px;}
.da-civname{font-family:var(--tg-font-title,Georgia,serif);font-size:1.05em;color:var(--tg-gold-primary,#e8d88a);letter-spacing:.02em;}
.da-civtitle{font-size:0.68em;color:#8a8070;line-height:1.5;}
.da-stance-badge{display:inline-flex;align-items:center;gap:5px;font-size:0.6em;font-weight:700;letter-spacing:.05em;
  text-transform:uppercase;border-radius:999px;padding:3px 10px;margin-top:2px;
  color:#e0a868;border:1px solid rgba(210,120,30,.5);background:rgba(210,120,30,.1);}
.da-stance-badge.hostile{color:#e08a8a;border-color:rgba(200,64,64,.5);background:rgba(200,64,64,.1);}
.da-stance-badge svg{width:11px;height:11px;}
.da-sec-title{font-size:0.6em;text-transform:uppercase;letter-spacing:.08em;color:#8a8070;
  display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.da-sec-title::after{content:"";flex:1;height:1px;background:rgba(232,216,138,.18);}
.da-sec-title svg{width:11px;height:11px;color:var(--tg-gold-primary,#e8d88a);flex:none;}
.da-attr-row{display:flex;align-items:baseline;justify-content:space-between;font-size:0.72em;margin-bottom:2px;color:#8a8070;}
.da-attr-row .v{font-weight:700;font-variant-numeric:tabular-nums;color:#e8e0c8;}
.da-abar{height:5px;border-radius:4px;background:rgba(0,0,0,.4);overflow:hidden;margin-bottom:7px;border:1px solid rgba(0,0,0,.3);}
.da-abar i{display:block;height:100%;background:linear-gradient(90deg,#9a7420,#e8d88a);}
.da-abar.you i{background:linear-gradient(90deg,#2c53ad,#5a8ae8);}
.da-abar.them i{background:linear-gradient(90deg,#a86018,#e0a868);}
.da-rel-row{display:flex;align-items:baseline;justify-content:space-between;font-size:0.72em;margin-bottom:2px;color:#8a8070;}
.da-rel-row .v{font-weight:700;font-variant-numeric:tabular-nums;}
.da-rel-row.trust .v{color:#7ad0a0;} .da-rel-row.respect .v{color:#e8d88a;}
.da-rbar{height:6px;border-radius:4px;background:rgba(0,0,0,.4);overflow:hidden;margin-bottom:6px;border:1px solid rgba(0,0,0,.3);}
.da-rbar i{display:block;height:100%;}
.da-rbar.trust i{background:linear-gradient(90deg,#2f7a4a,#5ad07a);}
.da-rbar.respect i{background:linear-gradient(90deg,#9a7420,#e8d88a);}
.da-goods{display:flex;flex-wrap:wrap;gap:5px;}
.da-good{font-size:0.62em;padding:3px 8px;border-radius:7px;border:1px solid rgba(232,216,138,.2);
  background:rgba(24,30,42,.65);color:#c8b898;white-space:nowrap;}
.da-goods-empty{font-size:0.62em;color:#6a7280;}
.da-mood{font-size:0.66em;letter-spacing:.04em;padding:2px 0;color:#8a8070;}
.da-culture{font-size:0.64em;color:#a8c0d8;}
.da-tags{display:flex;flex-wrap:wrap;gap:4px;}
.da-tag{font-size:0.6em;padding:2px 7px;border-radius:9px;border:1px solid rgba(160,140,200,.35);
  background:rgba(100,80,140,.12);color:#c8b8e8;}
.da-bonus{font-size:0.6em;line-height:1.4;color:#8a8070;}
.da-bonus li{margin:2px 0;list-style:none;}
.da-bonus li::before{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;
  background:#e8d88a;margin-right:5px;vertical-align:middle;}

/* ===== środek: zakładki + stół negocjacji ===== */
.da-center{flex:1;min-width:0;display:flex;flex-direction:column;gap:9px;}
.da-tabs{display:flex;justify-content:center;gap:6px;}
.da-tab{font-size:0.68em;padding:5px 14px;border-radius:999px;border:1px solid rgba(232,216,138,.22);
  color:#8a8070;background:rgba(0,0,0,.2);cursor:pointer;display:flex;align-items:center;gap:6px;
  font-weight:600;letter-spacing:.02em;font-family:inherit;}
/* FAZA 3 pkt 9 — złoty primary dokładnie wg makiety v1.1 (nie przybliżenie #e8d88a→#cdb45f). */
.da-tab.on{color:#2e2708;background:linear-gradient(180deg,#f0dc88,#b99a28);
  border:1px solid #6a5212;border-top-color:#f8eea8;font-weight:700;cursor:default;}
.da-tab:not(.on):hover{border-color:rgba(232,216,138,.5);color:#e8d88a;}
.da-tab svg{width:12px;height:12px;}

.da-table{flex:1;display:grid;grid-template-columns:1.1fr 0.95fr 1.05fr;gap:10px;min-height:0;}
.da-col{background:rgba(0,0,0,.22);border:1px solid rgba(232,216,138,.18);border-radius:10px;
  padding:9px 9px 10px;display:flex;flex-direction:column;gap:6px;max-height:400px;overflow-y:auto;min-width:180px;}
.da-col h3{font-family:var(--tg-font-title,Georgia,serif);font-size:0.78em;color:var(--tg-gold-primary,#e8d88a);
  letter-spacing:.02em;display:flex;align-items:center;gap:6px;padding-bottom:6px;
  border-bottom:1px solid rgba(232,216,138,.18);margin:0 0 2px;}
.da-col h3 svg{width:12px;height:12px;}
.da-col h3 .cnt{margin-left:auto;font-size:0.85em;color:#8a8070;font-weight:400;}

.da-deal{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;
  border:1px solid rgba(232,216,138,.18);background:linear-gradient(180deg,rgba(26,32,44,.7),rgba(12,16,24,.7));
  cursor:pointer;font-family:inherit;color:#e8e0c8;text-align:left;width:100%;}
.da-deal svg.da-di{width:14px;height:14px;color:var(--tg-gold-primary,#e8d88a);flex:none;}
.da-deal .da-body{flex:1;min-width:0;}
.da-deal .da-nm{font-size:0.72em;font-weight:600;color:#e8e0c8;}
.da-deal .da-note{font-size:0.62em;color:#8a8070;margin-top:1px;}
.da-deal.locked{opacity:.48;cursor:not-allowed;}
.da-deal.locked .da-note{color:#e08a8a;}
.da-deal.active{border-color:rgba(142,197,255,.5);background:linear-gradient(180deg,rgba(142,197,255,.09),rgba(12,16,24,.75));cursor:default;}
.da-deal.active .da-note{color:#8ec5ff;}
.da-deal:not(.locked):not(.active):hover{border-color:#e8d88a;box-shadow:0 0 8px rgba(232,216,138,.25);}
.da-lockic{width:12px;height:12px;color:#e08a8a;}
.da-checkic{width:13px;height:13px;color:#8ec5ff;}

.da-treaty{display:flex;align-items:flex-start;gap:8px;padding:7px 8px;border-radius:8px;
  border:1px solid rgba(232,216,138,.18);background:linear-gradient(180deg,rgba(26,32,44,.7),rgba(12,16,24,.7));}
.da-treaty svg.da-ti{width:14px;height:14px;color:#8ec5ff;flex:none;margin-top:1px;}
.da-treaty .da-nm{font-size:0.72em;font-weight:600;color:#e8e0c8;}
.da-treaty .da-meta{font-size:0.62em;color:#8a8070;margin-top:2px;}
.da-treaty .da-pen{font-size:0.62em;color:#e08a8a;margin-top:3px;}
/* Zaległość #2 — „Zerwij" = SAMA IKONA rozerwanego ogniwa (SVG z makiety) + podpis na hover
   (.da-ttip); aktywny gdy SILNIK dostarcza onBreakTreaty (main.ts breakTreatyVoluntarily). */
.da-treaty .da-ttip{margin-left:auto;align-self:center;}
.da-treaty .da-brk{font-size:0;color:#8a8070;border:1px solid rgba(140,150,165,.3);
  border-radius:6px;padding:5px 6px;white-space:nowrap;align-self:center;background:none;font-family:inherit;
  cursor:pointer;opacity:.85;display:inline-flex;align-items:center;line-height:0;}
.da-treaty .da-brk:hover{border-color:rgba(200,64,64,.6);color:#e08a8a;}
.da-treaty .da-brk:disabled{cursor:not-allowed;opacity:.45;}
.da-treaty .da-brk:disabled:hover{border-color:rgba(140,150,165,.3);color:#8a8070;}
.da-treaty .da-brk svg{width:14px;height:14px;}
.da-empty{font-size:0.68em;color:#6a7280;padding:6px 2px;}

.da-offer-hint{font-size:0.66em;color:#8a8070;line-height:1.5;padding:2px 2px 4px;}
.da-offer-hint b{color:#e8d88a;}
.da-offer-btn{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:8px;
  border:1px solid rgba(232,216,138,.3);background:rgba(232,216,138,.06);color:#e8e0c8;
  cursor:pointer;font-family:inherit;font-size:0.72em;font-weight:600;text-align:left;width:100%;}
.da-offer-btn:hover{border-color:#e8d88a;background:rgba(232,216,138,.12);}
.da-offer-btn svg{width:14px;height:14px;color:var(--tg-gold-primary,#e8d88a);flex:none;}
.da-offer-btn:disabled{opacity:.4;cursor:not-allowed;}

/* ===== rozbicie relacji ===== */
.da-relbreak{display:grid;grid-template-columns:1fr 1fr;gap:0;background:rgba(0,0,0,.22);
  border:1px solid rgba(232,216,138,.18);border-radius:10px;overflow:hidden;}
.da-relcol{padding:9px 13px 10px;}
.da-relcol.pos{border-right:1px solid rgba(232,216,138,.18);}
.da-relcol h4{font-size:0.62em;text-transform:uppercase;letter-spacing:.04em;display:flex;align-items:center;
  gap:6px;margin:0 0 6px;}
.da-relcol.pos h4{color:#7ad0a0;} .da-relcol.neg h4{color:#e08a8a;}
.da-relcol h4 svg{width:11px;height:11px;}
.da-rfact{display:flex;align-items:center;justify-content:space-between;font-size:0.68em;padding:2.5px 0;color:#e8e0c8;}
.da-rfact .lbl{color:#8a8070;}
.da-rfact .val{font-weight:700;font-variant-numeric:tabular-nums;flex:none;margin-left:8px;}
.da-relcol.pos .val{color:#7ad0a0;} .da-relcol.neg .val{color:#e08a8a;}
.da-relbreak-foot{grid-column:1/-1;border-top:1px solid rgba(232,216,138,.18);padding:6px 13px;font-size:0.66em;color:#8a8070;}
.da-relbreak-foot b{color:#e8d88a;}

@media (max-width:1200px){.da-table{grid-template-columns:1fr;}.da-card{flex:0 0 200px;width:200px;}}
@media (max-width:920px){.da-relbreak{grid-template-columns:1fr;}.da-relcol.pos{border-right:none;border-bottom:1px solid rgba(232,216,138,.18);}}
@media (max-width:760px){.da-mainrow{flex-wrap:wrap;}.da-card{width:100%;flex:1 1 auto;}}

/* ===== FAZA 3 pkt 8 — pasek szybkich akcji (SAME IKONY, 46×46) + „Szybka Umowa" ===== */
.da-actionbar{display:flex;align-items:center;gap:9px;justify-content:center;flex-wrap:wrap;padding-top:2px;}
.da-ttip{position:relative;display:inline-flex;}
.da-ttip>.da-ttip-lbl{position:absolute;bottom:54px;left:50%;transform:translateX(-50%);opacity:0;
  pointer-events:none;transition:opacity .12s;white-space:nowrap;background:rgba(8,10,16,.96);
  border:1px solid rgba(232,216,138,.4);color:#e8d88a;padding:3px 9px;border-radius:6px;font-size:9.5px;
  font-weight:700;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 4px 12px rgba(0,0,0,.55);z-index:9;}
.da-ttip:hover>.da-ttip-lbl{opacity:1;}
.da-abtn{width:46px;height:46px;border-radius:10px;border:1px solid rgba(232,216,138,.3);
  background:linear-gradient(180deg,#161c28,#0a0d14);color:#e8d88a;display:flex;align-items:center;
  justify-content:center;cursor:pointer;box-shadow:0 1px 6px rgba(0,0,0,.4);}
.da-abtn svg{width:19px;height:19px;}
.da-abtn:hover{border-color:#e8d88a;color:#f4e6a8;box-shadow:0 0 10px rgba(232,216,138,.3);}
.da-abtn:disabled{opacity:.42;cursor:not-allowed;box-shadow:none;}
.da-abtn:disabled:hover{border-color:rgba(232,216,138,.3);color:#e8d88a;box-shadow:0 1px 6px rgba(0,0,0,.4);}
.da-abtn.warbtn{border-color:rgba(200,64,64,.5);color:#e08a8a;}
.da-abtn.warbtn:hover{border-color:#c84040;color:#f0a0a0;box-shadow:0 0 10px rgba(200,64,64,.35);}
.da-abtn.warbtn:disabled:hover{border-color:rgba(200,64,64,.5);color:#e08a8a;box-shadow:none;}
.da-abtn.peacebtn{border-color:rgba(90,208,122,.45);color:#7ad0a0;}
.da-abtn.peacebtn:hover{border-color:#5ad07a;color:#8ee0ae;box-shadow:0 0 10px rgba(90,208,122,.3);}
.da-abtn.peacebtn:disabled:hover{border-color:rgba(90,208,122,.45);color:#7ad0a0;box-shadow:none;}
.da-quickdeal{height:52px;padding:0 20px;border-radius:10px;border:1px solid #6a5212;border-top-color:#f8eea8;
  background:linear-gradient(180deg,#f0dc88,#b99a28);color:#2e2708;display:flex;align-items:center;gap:8px;
  font-family:var(--tg-font-title,Georgia,serif);font-size:0.92em;font-weight:700;letter-spacing:.02em;
  cursor:pointer;box-shadow:0 3px 12px rgba(232,216,138,.3);margin-left:6px;}
.da-quickdeal svg{width:18px;height:18px;}
.da-quickdeal small{display:block;font-family:var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);font-size:0.6em;
  font-weight:400;color:#3a2e0c;letter-spacing:0;}
.da-quickdeal:hover{filter:brightness(1.07);}
.da-quickdeal:disabled{opacity:.5;cursor:not-allowed;filter:none;}

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

/**
 * Zaległość #2 — potwierdzenie dobrowolnego zerwania traktatu (przycisk „Zerwij" w kolumnie
 * „Aktywne traktaty"). Ten sam wzorzec co showWarConfirmModal (drugi klik = modal, nie
 * pojedynczy klik na krytyczną, nieodwracalną akcję).
 */
export function showBreakTreatyConfirmModal(
  treatyLabel: string,
  penaltyLabel: string | undefined,
  onConfirm: () => void,
): void {
  if (modalOverlay !== null) modalOverlay.remove();
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'civ-diplo-modal-overlay';
  const penaltyLine = penaltyLabel
    ? '<p style="color:#e08a8a">Kara: ' + esc(penaltyLabel) + '</p>'
    : '';
  modalOverlay.innerHTML =
    '<div class="civ-diplo-modal" role="dialog" aria-modal="true">' +
      '<h3>Zerwać traktat?</h3>' +
      '<p>Na pewno zrywasz: <strong>' + esc(treatyLabel) + '</strong>?</p>' +
      penaltyLine +
      '<div class="cd-modal-btns">' +
        '<button type="button" class="dip-muted-btn cd-modal-cancel">Anuluj</button>' +
        '<button type="button" class="dip-gold-btn cd-modal-ok" style="border-color:rgba(200,64,64,.5);color:#e08a8a;">Zerwij</button>' +
      '</div></div>';
  document.body.appendChild(modalOverlay);
  const close = (): void => {
    if (modalOverlay !== null) { modalOverlay.remove(); modalOverlay = null; }
  };
  modalOverlay.querySelector('.cd-modal-cancel')?.addEventListener('click', close);
  modalOverlay.querySelector('.cd-modal-ok')?.addEventListener('click', () => { close(); onConfirm(); });
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) close(); });
}

/** FAZA 2 pkt 2 — baner statusu formalnego (odrębny od nastawienia). */
function formalBannerHtml(st: DiplomacyAudienceState): string {
  if (!st.formalStatus) return '';
  const iconByKind: Record<FormalDiplomaticKind, string> = {
    wojna: 'dip-war', sojusz: 'dip-alliance', pakt: 'dip-pact', handel: 'cp-trade', pokoj: 'dip-peace', brak: 'dip-peace',
  };
  const icon = dipBrandIconHtml(iconByKind[st.formalStatus.kind] ?? 'dip-peace', 19, 'da-b-ic');
  const detail = st.formalStatusDetail;
  const subParts: string[] = [];
  if (detail?.sinceTurns !== undefined) subParts.push('obowiązuje od ' + detail.sinceTurns + ' tur');
  if (detail?.breakPenaltyLabel) subParts.push('zerwanie: ' + detail.breakPenaltyLabel);
  const sub = subParts.length > 0
    ? '<span class="da-b-sub">' + esc(subParts.join(' · ')) + '</span>'
    : '';
  return (
    '<div class="da-banner da-tone-' + st.formalStatus.kind + '"' +
    ' title="Formalny stan umów — odrębny od nastawienia (Zaufanie/Respekt)">' +
    icon + '<span class="da-b-lbl">' + esc(st.formalStatus.label.toUpperCase()) + '</span>' + sub +
    '</div>'
  );
}

function stanceBadgeHtml(st: DiplomacyAudienceState): string {
  const label = nastawienieLabelFromScore(st.zaufanie, st.respekt);
  const hostile = label === 'Wrogi' || label === 'Nieufny';
  const cls = hostile ? 'da-stance-badge hostile' : 'da-stance-badge';
  return (
    '<span class="' + cls + '" title="' + esc(nastawienieHintPl()) + '">' +
    esc(label) + '</span>'
  );
}

function personalityTagsHtml(tags: readonly string[] | undefined): string {
  if (!tags || tags.length === 0) return '';
  return '<div class="da-tags">' +
    tags.map(t => '<span class="da-tag">' + esc(t) + '</span>').join('') +
    '</div>';
}

function cultureLineHtml(st: DiplomacyAudienceState): string {
  if (!st.otherCultureLabel?.trim()) return '';
  let html = '<div class="da-culture">Kultura: <b>' + esc(st.otherCultureLabel.trim()) + '</b>';
  if (st.cultureCircleSame === true) {
    html += ' · <span style="color:#7ad0a0">ten sam okręg</span>';
  } else if (st.cultureCircleSame === false) {
    html += ' · <span style="color:#d4a870">obca kultura</span>';
  }
  html += '</div>';
  return html;
}

function bonusListHtml(bonusy: readonly CivBonusLite[]): string {
  const lines = bonusy.map(b => (b.opis ?? '').trim()).filter(Boolean).slice(0, 2);
  if (lines.length === 0) return '';
  return '<ul class="da-bonus">' + lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>';
}

/** Pasek atrybutu (Moc militarna / Potencjał sojuszniczy) — bez wartości bezwzględnej 0..100. */
function attrBarHtml(label: string, valueLabel: string, pct: number, tone: 'you' | 'them' | 'gold'): string {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    '<div class="da-attr-row"><span>' + esc(label) + '</span><span class="v">' + esc(valueLabel) + '</span></div>' +
    '<div class="da-abar ' + tone + '"><i style="width:' + p + '%"></i></div>'
  );
}

function goodsHtml(goods: readonly string[] | undefined): string {
  if (!goods || goods.length === 0) {
    return '<div class="da-goods-empty">Brak danych o dobrach</div>';
  }
  return '<div class="da-goods">' + goods.map(g => '<span class="da-good">' + esc(g) + '</span>').join('') + '</div>';
}

/** FAZA 2 pkt 1 — LEWA karta (gracz): medalion, atrybuty, SKARBIEC, dobra handlowe. */
function playerCardHtml(st: DiplomacyAudienceState, playerBon: readonly CivBonusLite[]): string {
  const maxPower = Math.max(st.playerPower ?? 0, st.otherPower ?? 0, 1);
  const powerPct = ((st.playerPower ?? 0) / maxPower) * 100;
  const potencjal = st.sojuszPotencjal;
  const skarbiec = st.playerSkarbiec ?? 0;
  const dochod = st.playerZlotoPerTura;
  return (
    '<div class="da-card you">' +
      '<div class="da-portrait">' +
        civLeaderMedallionHtmlById(st.playerIkonaId ?? 'rzymianie', st.playerKolorHex) +
        '<div class="da-civname">' + esc(st.playerCivName) + '</div>' +
        '<div class="da-civtitle">' + esc(st.playerTitle) + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Atrybuty</div>' +
        attrBarHtml('Moc militarna', String(st.playerPower ?? 0), powerPct, 'you') +
        (potencjal ? attrBarHtml('Potencjał sojuszniczy', potencjal.label, potencjal.pct, 'gold') : '') +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Skarbiec</div>' +
        '<div class="da-attr-row"><span>Złoto</span><span class="v">' + skarbiec + '</span></div>' +
        (dochod !== undefined
          ? '<div class="da-attr-row"><span>Dochód</span><span class="v">' + (dochod >= 0 ? '+' : '') + dochod + ' / turę</span></div>'
          : '') +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Dobra handlowe</div>' +
        goodsHtml(st.playerGoods) +
      '</div>' +
      bonusListHtml(playerBon) +
    '</div>'
  );
}

/** FAZA 2 pkt 1+5 — PRAWA karta (rozmówca): medalion, atrybuty, RELACJE (raz), dobra. */
function otherCardHtml(st: DiplomacyAudienceState, otherBon: readonly CivBonusLite[]): string {
  const maxPower = Math.max(st.playerPower ?? 0, st.otherPower ?? 0, 1);
  const powerPct = ((st.otherPower ?? 0) / maxPower) * 100;
  const potencjal = st.sojuszPotencjal;
  return (
    '<div class="da-card them">' +
      '<div class="da-portrait">' +
        civLeaderMedallionHtmlById(st.otherIkonaId ?? 'grecy', st.otherKolorHex) +
        '<div class="da-civname">' + esc(st.otherCivName) + '</div>' +
        '<div class="da-civtitle">' + esc(st.otherTitle) + (st.otherEpochLabel ? ' · ' + esc(st.otherEpochLabel) : '') + '</div>' +
        stanceBadgeHtml(st) +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Atrybuty</div>' +
        attrBarHtml('Moc militarna', String(st.otherPower ?? 0), powerPct, 'them') +
        (potencjal ? attrBarHtml('Potencjał sojuszniczy', potencjal.label, potencjal.pct, 'gold') : '') +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Relacje z Tobą</div>' +
        progressBarHtml('Zaufanie', st.zaufanie, 100, undefined, 'trust') +
        progressBarHtml('Respekt', st.respekt, 100, RESPEKT_TOOLTIP_PL, 'respect') +
        (!st.contactEstablished ? '<div class="da-mood" style="color:#e0b24a">Brak formalnego kontaktu</div>' : '') +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Dobra handlowe</div>' +
        goodsHtml(st.otherGoods) +
      '</div>' +
      cultureLineHtml(st) +
      personalityTagsHtml(st.personalityTags) +
      bonusListHtml(otherBon) +
    '</div>'
  );
}

function progressBarHtml(label: string, value: number, max: number, tooltip?: string, kind?: 'trust' | 'respect'): string {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const tip = tooltip ? ' title="' + esc(tooltip) + '"' : '';
  const rowCls = kind ? 'da-rel-row ' + kind : 'da-rel-row';
  const barCls = kind ? 'da-rbar ' + kind : 'da-rbar';
  return (
    '<div class="' + rowCls + '"' + tip + '><span>' + esc(label) + '</span><span class="v">' + value + ' / ' + max + '</span></div>' +
    '<div class="' + barCls + '"><i style="width:' + pct + '%"></i></div>'
  );
}

/** Ikona kafelka „Możliwe umowy" — dopasowana per id akcji (data/diplomacy.json akcje_dyplomatyczne). */
function actionIconId(id: string): string {
  switch (id) {
    case '2': return 'dip-pact';
    case '3': return 'dip-alliance';
    case '5': return 'cp-trade';
    case '6': return 'tb-science';
    case '8': return 'res-treasury';
    case '9': return 'chip-warning';
    case '10': return 'dip-peace';
    case '11': return 'dip-war';
    case '12': return 'tb-army';
    case '13': return 'res-culture';
    default: return 'tb-diplomacy';
  }
}

/** Ikona traktatu w kolumnie „Aktywne traktaty" — dopasowana per treść etykiety (treatyDisplayLabel). */
function treatyIconId(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('sojusz')) return 'dip-alliance';
  if (l.includes('nieagresji')) return 'dip-pact';
  if (l.includes('handlow')) return 'cp-trade';
  if (l.includes('rozejm')) return 'dip-peace';
  if (l.includes('wasal')) return 'tb-army';
  return 'dip-pact';
}

/**
 * FAZA 3 pkt 8 — pasek szybkich akcji: inline SVG 1:1 z Makieta DYPLOMACJA v1.1
 * (KROK 3 pkt 8, linie 483-490 + 369 dla „Zerwij"). Brand-icon-manifest nie ma
 * odpowiedników (dar/rozerwane ogniwo), więc — jak w makiecie — SVG jest wpisane
 * wprost, nie przez dipBrandIconHtml/manifest.
 */
const ACTION_BAR_SVG: Record<string, string> = {
  war: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 5l-7 7 7 7M20 5l-7 7 7 7"/></svg>',
  peace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 16c3 0 4-6 8-6s4 4 8 4"/><path d="M4 16l1 3h14l1-3"/><path d="M12 8V3"/></svg>',
  alliance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 12l3 3 7-7"/><path d="M4 20V6l8-3 8 3v14"/></svg>',
  pact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 4h14v3a7 7 0 01-7 7 7 7 0 01-7-7z"/></svg>',
  trade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 9l8-5 8 5"/><path d="M12 4v5"/></svg>',
  vassal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 18l2-9 4 4 2-6 2 6 4-4 2 9z"/><path d="M4 18h16v2H4z"/></svg>',
  quickdeal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z"/></svg>',
  brk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 6.5 7.5 5A3.2 3.2 0 003 9.5L5.5 12"/><path d="M15 17.5l1.5 1.5a3.2 3.2 0 004.5-4.5L18.5 12"/><path d="M9.5 14.5 7 19M14.5 9.5 17 5"/></svg>',
};

/** Mapowanie przycisk paska → id akcji z siatki (data/diplomacy.json akcje_dyplomatyczne). */
const ACTION_BAR_SPECS: ReadonlyArray<{ svg: keyof typeof ACTION_BAR_SVG; aid: string; label: string; extraCls?: string }> = [
  { svg: 'war', aid: '11', label: 'Wypowiedz wojnę', extraCls: 'warbtn' },
  { svg: 'peace', aid: '10', label: 'Zaproponuj pokój', extraCls: 'peacebtn' },
  { svg: 'alliance', aid: '3', label: 'Sojusz' },
  { svg: 'pact', aid: '2', label: 'Pakt o nieagresji' },
  { svg: 'trade', aid: '5', label: 'Umowa handlowa' },
  { svg: 'gift', aid: '13', label: 'Przekaż dar' },
  { svg: 'vassal', aid: '12', label: 'Wasalizacja' },
];

/**
 * FAZA 3 pkt 8 — pasek szybkich akcji. SAME IKONY (46×46, bez podpisów), pełna nazwa
 * tylko na hover (pigułka .da-ttip). Każdy przycisk używa TEGO SAMEGO id/action co
 * kafelek w kolumnie „Możliwe umowy" — data-aid trafia w istniejący listener (render()),
 * więc onAction/blokady/negocjacje są dokładnie te same, disabled gdy `locked`.
 * „Szybka Umowa" (jedyny tekstowy CTA) BEZ data-aid — ma WŁASNY listener (render(),
 * `.da-quickdeal`) który woła openQuickDealBasket (zaległość #1: realna auto-uczciwa
 * oferta, nie zaślepka) zamiast generycznego handlera po data-aid.
 */
function actionBarHtml(st: DiplomacyAudienceState): string {
  const byId = new Map(st.actions.map(a => [a.id, a] as const));
  const btns = ACTION_BAR_SPECS.map(spec => {
    const action = byId.get(spec.aid);
    const enabled = action ? action.enabled : false;
    const tip = enabled ? spec.label : (action?.lockNote || action?.tooltip || spec.label);
    const cls = 'da-abtn' + (spec.extraCls ? ' ' + spec.extraCls : '');
    return (
      '<span class="da-ttip"><span class="da-ttip-lbl">' + esc(spec.label) + '</span>' +
      '<button type="button" class="' + cls + '" data-aid="' + esc(spec.aid) + '"' +
      (enabled ? '' : ' disabled') + ' title="' + esc(tip) + '">' + ACTION_BAR_SVG[spec.svg] + '</button>' +
      '</span>'
    );
  }).join('');

  const handel = byId.get('5');
  const handelEnabled = handel ? handel.enabled : false;
  const qdTitle = handelEnabled ? 'auto-uczciwa oferta' : (handel?.lockNote || handel?.tooltip || 'Handel niedostępny');
  const quickdeal =
    '<button type="button" class="da-quickdeal"' + (handelEnabled ? '' : ' disabled') +
    ' title="' + esc(qdTitle) + '">' + ACTION_BAR_SVG.quickdeal +
    '<span>SZYBKA UMOWA<small>auto-uczciwa oferta</small></span></button>';

  return '<div class="da-actionbar">' + btns + quickdeal + '</div>';
}

/** FAZA 2 pkt 3 kol.1 — „Możliwe umowy" (12 akcji; bez „Nawiązanie kontaktu" gdy kontakt jest). */
function dealsColumnHtml(st: DiplomacyAudienceState): string {
  const visible = st.actions.filter(a => !(a.id === '1' && st.contactEstablished));
  const items = visible.map(a => {
    let cls = a.enabled ? 'da-deal' : 'da-deal locked';
    if (a.active) cls += ' active';
    const note = a.active ? 'już zawarta' : (a.lockNote || a.tooltip || a.opis || '');
    const icon = dipBrandIconHtml(actionIconId(a.id), 14, 'da-di');
    const endIc = a.active
      ? dipBrandIconHtml('ui-check', 13, 'da-checkic')
      : (!a.enabled ? dipBrandIconHtml('ui-lock', 12, 'da-lockic') : '');
    return (
      '<button type="button" class="' + cls + '" data-aid="' + esc(a.id) + '"' +
      (a.enabled ? '' : ' disabled title="' + esc(note) + '"') + '>' +
      icon +
      '<div class="da-body"><div class="da-nm">' + esc(a.label) + '</div>' +
      (note ? '<div class="da-note">' + esc(note.length > 70 ? note.slice(0, 67) + '…' : note) + '</div>' : '') +
      '</div>' + endIc +
      '</button>'
    );
  }).join('');
  return (
    '<div class="da-col da-col-deals">' +
      '<h3>Możliwe umowy<span class="cnt">' + visible.length + '</span></h3>' +
      (items || '<div class="da-empty">Brak dostępnych akcji.</div>') +
    '</div>'
  );
}

/** FAZA 2 pkt 3 kol.2 — „Aktywne traktaty" (od ilu tur + kara zerwania + „Zerwij" — zaległość #2). */
function treatiesColumnHtml(st: DiplomacyAudienceState): string {
  const treaties = st.activeTreaties ?? [];
  const canBreak = typeof cfg?.onBreakTreaty === 'function';
  const items = treaties.map(t => {
    const icon = dipBrandIconHtml(treatyIconId(t.label), 14, 'da-ti');
    const metaParts: string[] = [];
    if (t.sinceTurns !== undefined) metaParts.push('od ' + t.sinceTurns + ' tur');
    else if (t.detail) metaParts.push(t.detail);
    const meta = metaParts.length > 0 ? '<div class="da-meta">' + esc(metaParts.join(' · ')) + '</div>' : '';
    const pen = t.breakPenaltyLabel ? '<div class="da-pen">kara zerwania: ' + esc(t.breakPenaltyLabel) + '</div>' : '';
    const dealId = t.id;
    const enabled = canBreak && !!dealId;
    const brkTitle = enabled
      ? 'Zerwij traktat' + (t.breakPenaltyLabel ? ' — kara: ' + t.breakPenaltyLabel : '')
      : 'Zerwij traktat — niedostępne';
    return (
      '<div class="da-treaty">' + icon +
        '<div><div class="da-nm">' + esc(t.label) + '</div>' + meta + pen + '</div>' +
        /* Zaległość #2 — ikona rozerwanego ogniwa + podpis „Zerwij traktat" TYLKO na hover. */
        '<span class="da-ttip"><span class="da-ttip-lbl" style="bottom:34px">Zerwij traktat</span>' +
        '<button type="button" class="da-brk" data-deal-id="' + esc(dealId ?? '') + '"' +
        (enabled ? '' : ' disabled') + ' title="' + esc(brkTitle) + '">' + ACTION_BAR_SVG.brk + '</button></span>' +
      '</div>'
    );
  }).join('');
  return (
    '<div class="da-col da-col-treaties">' +
      '<h3>Aktywne traktaty<span class="cnt">' + treaties.length + '</span></h3>' +
      (items || '<div class="da-empty">Brak aktywnych traktatów.</div>') +
    '</div>'
  );
}

/** FAZA 2 pkt 3 kol.3 — „Żądania/Oferty": wejście do istniejącego koszyka PN (Umowa handlowa/Dar) —
 * ten sam handler co kafelek w kol. 1 (data-aid), więc modal/logika zostają nietknięte. Pełny
 * embedded formularz (bilans na żywo w tabeli) — faza 3; tu wpis + uzasadnienie bilansu (pkt 7)
 * jest już liczony w samym koszyku (diplomacyTradeBasket summaryHtml — Jednorazowo/Co turę/Werdykt). */
function offersColumnHtml(st: DiplomacyAudienceState): string {
  const offerActions = st.actions.filter(a => a.id === '5' || a.id === '13');
  const buttons = offerActions.map(a => {
    const icon = dipBrandIconHtml(actionIconId(a.id), 14, 'da-di');
    const disabled = !a.enabled;
    const hint = disabled ? (a.lockNote || a.tooltip || '') : (a.id === '5' ? 'Otwórz koszyk wymiany (PN)' : 'Otwórz formularz daru (PN)');
    return (
      '<button type="button" class="da-offer-btn" data-aid="' + esc(a.id) + '"' +
      (disabled ? ' disabled title="' + esc(hint) + '"' : ' title="' + esc(hint) + '"') + '>' +
      icon + '<span>' + esc(a.label) + '</span>' +
      '</button>'
    );
  }).join('');
  return (
    '<div class="da-col da-col-offers">' +
      '<h3>Żądania / Oferty</h3>' +
      '<div class="da-offer-hint">Otwórz <b>Umowę handlową</b> lub <b>Dar</b>, by ułożyć koszyk PN — ' +
      'bilans (jednorazowo / co turę) i werdykt liczone są tam na żywo, z tych samych danych co progi obok.</div>' +
      (buttons || '<div class="da-empty">Brak dostępnych ofert przy obecnych progach.</div>') +
    '</div>'
  );
}

/** FAZA 2 (dyspozycja, sekcja pod stołem) — rozbicie relacji za/przeciw, prosta wersja. */
function relBreakdownHtml(st: DiplomacyAudienceState): string {
  const rb = st.relationBreakdown;
  if (!rb) return '';
  const fmtVal = (v: number, perTurn?: boolean): string => {
    const sign = v > 0 ? '+' : '';
    return sign + (Number.isInteger(v) ? String(v) : v.toFixed(1)) + (perTurn ? ' / turę' : '');
  };
  const posRows = rb.pozytywne.map(f =>
    '<div class="da-rfact"><span class="lbl">' + esc(f.label) + '</span><span class="val">' + fmtVal(f.value, f.perTurn) + '</span></div>',
  ).join('') || '<div class="da-empty">Brak czynników.</div>';
  const negRows = rb.negatywne.map(f =>
    '<div class="da-rfact"><span class="lbl">' + esc(f.label) + '</span><span class="val">' + fmtVal(f.value, f.perTurn) + '</span></div>',
  ).join('') || '<div class="da-empty">Brak czynników.</div>';
  const label = nastawienieLabelFromScore(st.zaufanie, st.respekt);
  return (
    '<div class="da-relbreak">' +
      '<div class="da-relcol pos"><h4>Za co Cię lubią</h4>' + posRows + '</div>' +
      '<div class="da-relcol neg"><h4>Za co Cię nie lubią</h4>' + negRows + '</div>' +
      '<div class="da-relbreak-foot">Stan bieżący: <b>Zaufanie ' + st.zaufanie + ' / 100</b> · ' +
        '<b>Respekt ' + st.respekt + ' / 100</b> · nastawienie: <b>' + esc(label) + '</b></div>' +
    '</div>'
  );
}

function render(): void {
  if (rootEl === null || cfg === null) return;
  const st = cfg.getState();
  if (st === null) {
    rootEl.innerHTML = '<div class="civ-diplo-aud-box"><p>Brak danych audiencji.</p></div>';
    return;
  }

  const playerBon = cfg.getCivBonusy?.(0) ?? [];
  const otherBon = cfg.getCivBonusy?.(cfg.ownerId) ?? [];
  const headIc = dipBrandIconHtml('tb-diplomacy', 24, 'dip-ic') ?? '';
  const knownFactionsTab = cfg.onOpenKnownFactions
    ? '<button type="button" class="da-tab da-tab-known">' +
      dipBrandIconHtml('tb-cities', 12) + 'Znane frakcje</button>'
    : '';

  rootEl.innerHTML =
    '<div class="civ-diplo-aud-box">' +
      '<div class="civ-diplo-aud-head">' +
        '<h2>' + headIc + 'Audiencja dyplomatyczna</h2>' +
        '<button type="button" class="dip-muted-btn civ-diplo-aud-back">' + esc(cfg!.backLabel ?? 'Wyjście') + '</button>' +
      '</div>' +
      formalBannerHtml(st) +
      '<div class="da-mainrow">' +
        playerCardHtml(st, playerBon) +
        '<div class="da-center">' +
          '<div class="da-tabs">' + knownFactionsTab +
            '<span class="da-tab on">' + dipBrandIconHtml('tb-diplomacy', 12) + 'Stół negocjacji</span>' +
          '</div>' +
          '<div class="da-table">' +
            dealsColumnHtml(st) + treatiesColumnHtml(st) + offersColumnHtml(st) +
          '</div>' +
          relBreakdownHtml(st) +
        '</div>' +
        otherCardHtml(st, otherBon) +
      '</div>' +
      actionBarHtml(st) +
    '</div>';

  /** Dopełnia kontekst koszyka polami wspólnymi ze stanu audiencji (jak dotąd inline w handlerze). */
  const mergeBasketCtx = (negCtx: NegotiationModalContext): NegotiationModalContext => ({
    ...negCtx,
    relacjaTotal: negCtx.relacjaTotal ?? st.relacjaTotal ?? (st.zaufanie + st.respekt),
    trustPnGainedThisTurn: negCtx.trustPnGainedThisTurn ?? st.trustPnGainedThisTurn ?? 0,
    progDarRelacja: negCtx.progDarRelacja ?? st.progDarRelacja,
    playerSkarbiec: negCtx.playerSkarbiec ?? st.playerSkarbiec,
  });

  rootEl.querySelector('.civ-diplo-aud-back')?.addEventListener('click', () => cfg!.onBack());
  rootEl.querySelector('.da-tab-known')?.addEventListener('click', () => cfg!.onOpenKnownFactions?.());
  rootEl.querySelectorAll<HTMLButtonElement>('button[data-aid]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const aid = btn.getAttribute('data-aid');
      if (!aid || cfg === null) return;

      const action = st.actions.find(a => a.id === aid);
      if (action && action.enabled && cfg.getNegotiationContext) {
        const negCtx = cfg.getNegotiationContext(aid);
        if (negCtx && actionUsesTradeBasket(aid)) {
          showTradeBasketModal(
            aid === '13' ? 'gift' : 'trade',
            action,
            mergeBasketCtx(negCtx),
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

  /** Zaległość #1 — „SZYBKA UMOWA" realna: bez data-aid (osobny listener), otwiera koszyk
   *  WYPEŁNIONY auto-uczciwą propozycją (openQuickDealBasket — diplomacyTradeBasket.ts). */
  rootEl.querySelector('.da-quickdeal')?.addEventListener('click', () => {
    if (cfg === null) return;
    const handel = st.actions.find(a => a.id === '5');
    if (!handel || !handel.enabled || !cfg.getNegotiationContext) return;
    const negCtx = cfg.getNegotiationContext('5');
    if (!negCtx) return;
    openQuickDealBasket(
      handel,
      mergeBasketCtx(negCtx),
      (payload) => cfg!.onAction(cfg!.ownerId, '5', payload),
      () => { /* anulowano */ },
    );
  });

  /** Zaległość #2 — „Zerwij": potwierdzenie (modal) → onBreakTreaty(dealId) w SILNIKU. */
  rootEl.querySelectorAll<HTMLButtonElement>('.da-brk[data-deal-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled || cfg === null) return;
      const dealId = btn.getAttribute('data-deal-id');
      if (!dealId) return;
      const treaty = (st.activeTreaties ?? []).find(t => t.id === dealId);
      showBreakTreatyConfirmModal(
        treaty?.label ?? 'Traktat',
        treaty?.breakPenaltyLabel,
        () => { cfg!.onBreakTreaty?.(dealId); },
      );
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
