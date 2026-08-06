/**
 * diplomacyAudience.ts — ekran audiencji dyplomatycznej (D3-Q1…Q4).
 * DECOUPLED: zero importów game/*; callbacki z SILNIK.
 */
import type { CivBonusLite } from '../game/production';
import { startDiplomacyMusic, stopDiplomacyMusic } from '../audio/muzyka-antyczna';
import {
  effectiveNastawienieScores,
  nastawienieHintPl,
  nastawienieLabelFromScore,
  TRAKTAT_HANDLOWY_LABEL,
  wiarygodnoscBadgeHtml,
  wiarygodnoscTooltipPl,
  wiarygodnoscTooltipDefPl,
  type FormalDiplomaticKind,
} from '../game/diplomacy-display';
import {
  wiarygodnoscLabelPl,
  wiarygodnoscTooltipRozbiciePl,
  type WiarygodnoscRozbicie,
  type WiarygodnoscBreakdown,
} from '../game/diplomacy-credibility';
import {
  civLeaderMedallionHtmlById,
  dipBrandIconHtml,
  dipCapitalLocateBtnHtml,
  DIPLO_1E_SHARED_CSS,
  ensureDiploBrandScope,
} from './diploUiSkin';
import { notifyDiploUiVisibilityChange } from './unitCtxDockDiploGate';
import { pushOverlay, popOverlay } from './escapeOverlayStack';
import {
  actionNeedsNegotiation,
  showNegotiationModal,
  type NegotiationModalContext,
  type NegotiationPayload,
} from './diplomacyNegotiationModal';
import { actionUsesTradeBasket, getTradeBasketMode, showTradeBasketModal, openQuickDealBasket, type TradeBasketInitial } from './diplomacyTradeBasket';
import { civCardDisplayName, leaderName } from './leaderPortraits';
import { civBrandLineForKey } from './civBrandDisplay';
import type { TradeGoodsCategories } from '../game/diplomacy-goods';
import { renderNegotiationTableDealSideHtml } from './diplomacyDealDisplay';
import { bilateralTreatyDisplayPw, partnerTreatyDisplayPw, playerTreatyDisplayPw } from '../game/diplomacy-acceptance-points';
import {
  balancePanelDataFromRows,
  filterActionableNegotiationRows,
  renderPnBalancePanelHtml,
} from './diplomacyAcceptanceBalance';
import {
  proposalHasResourceAccess,
  RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON,
} from '../game/diplomacy-proposals';
import type { ProposalPayload } from '../game/diplomacy-proposals';
import {
  audienceActionBarLockNote,
  audienceActionStatusNote,
} from '../game/diplomacy-audience-actions';

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
  /** REL-WIARYG-DRIFT-Q1 — efektywna Δ Zaufania co turę (W + umowy). */
  zaufanieDeltaPerTurn?: number;
  /** REL-WIARYG-DRIFT-Q1 — Δ Relacji co turę (= Δ Zaufania; Respekt nie dryfuje). */
  relacjaDeltaPerTurn?: number;
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
  /** C-BITWA-WLADCA=B: imię władcy rozmówcy przydzielone per właściciel (pula 10/civ). */
  otherWodz?: string;
  /** Epoka rozmówcy (1=kamien,2=braz,3=zelazo) — portret władcy w medalionie (leaderPortraits.ts). */
  otherEra?: number;
  /** kolorHex rozmówcy (#RRGGBB). */
  otherKolorHex?: string;
  /**
   * R-MP-PORTRET (Maciej 2026-07-24) — rozmówca to miasto-państwo klastra
   * (isOwnerClusterCityState). Gdy true, medalion NIE pokazuje portretu-zdjęcia władcy
   * głównej cywilizacji (forceCultureIcon w civLeaderMedallionHtmlById) — MP wraca do
   * symbolu kultury, żeby 10-11 MP tej samej kultury nie wyglądało jak główna AI/gracz.
   */
  otherIsCityState?: boolean;
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
  /** C-BITWA-WLADCA=B: imię władcy gracza przydzielone per właściciel (pula 10/civ). */
  playerWodz?: string;
  /** kolorHex gracza (#RRGGBB) — ramka medalionu karty lewej. */
  playerKolorHex?: string;
  /** Epoka gracza (1=kamien,2=braz,3=zelazo) — portret władcy w medalionie (leaderPortraits.ts). */
  playerEra?: number;
  /**
   * Globalna Wiarygodność gracza (−100…+100) — reputacja imperium (nie per-relacja).
   * SILNIK: getWiarygodnosc(0) · diplomacy-credibility.ts.
   */
  playerWiarygodnosc?: number;
  /** Rozbicie W: trwały życiorys vs bieżące uczynki (§4 pkt 9) — tooltip audiencji. */
  playerWiarygodnoscRozbicie?: WiarygodnoscRozbicie;
  /** Rejestr czynników W gracza per zdarzenie (WIAR-UI-REJESTR). */
  playerWiarygodnoscBreakdown?: WiarygodnoscBreakdown;
  /**
   * Globalna Wiarygodność rozmówcy (−100…+100) — reputacja imperium rozmówcy.
   * SILNIK: getWiarygodnosc(otherOwnerId).
   */
  otherWiarygodnosc?: number;
  /** Rozbicie W rozmówcy — tooltip badge przy tytule. */
  otherWiarygodnoscRozbicie?: WiarygodnoscRozbicie;
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
  /** „Dobra handlowe" gracza — kategorie Surowce · Technologie · Inne (R-DYPLO-DOBRA-KAT). */
  playerGoodsCats?: TradeGoodsCategories;
  /** „Dobra handlowe" rozmówcy — kategorie Surowce · Technologie · Inne. */
  otherGoodsCats?: TradeGoodsCategories;
  /**
   * Szczegóły bannera statusu formalnego (pkt 2) — od ilu tur trwa DOMINUJĄCY traktat
   * (ten sam co formalStatus.kind) + kara zerwania. Brak gdy kind=wojna/pokoj/brak
   * (nie ma traktatu, do którego by się to odnosiło).
   */
  formalStatusDetail?: { sinceTurns?: number; breakPenaltyLabel?: string };

  /**
   * C-DYP-Q1=A (2026-07-26, Maciej — pełny stół negocjacyjny z kontrofertą): wpisy
   * OCZEKUJĄCE odpowiedzi dla tej pary (własne wysłane + przychodzące od tej
   * cywilizacji), z terminem ważności. SILNIK: getNegotiationsForPair (main.ts).
   */
  pendingNegotiations?: readonly PendingNegotiationRow[];
}

/** Jeden wiersz stołu „Oni oferują" — patrz DiplomacyAudienceState.pendingNegotiations. */
export interface PendingNegotiationRow {
  id: string;
  /** 'own' = gracz czeka na odpowiedź AI; 'incoming' = to gracz musi odpowiedzieć. */
  direction: 'own' | 'incoming';
  actionLabel: string;
  /** Krótki opis bieżących warunków (kwota/tury/typ) — main.ts formatuje z payloadu. */
  summary: string;
  /** Rozszerzony opis treści oferty (koszyk PN, kwoty) — ten sam tekst co summary dla handlu. */
  dealDetails?: string;
  /** Surowy payload — do renderu HTML z ikonami surowców. */
  dealPayload?: ProposalPayload;
  /** Prefill koszyka przy „Kontruj" (perspektywa gracza). */
  counterInitial?: TradeBasketInitial;
  round: number;
  maxRounds: number;
  /** Ile tur zostało do wygaśnięcia bez odpowiedzi (0 = ostatnia tura ważności). */
  expiresInTurns: number;
  /** Czy „Kontruj" jest dostępne (limit rund + wsparcie silnika dla tej akcji). */
  canCounter: boolean;
  /** Id akcji formularza negocjacji ('2'..'13') — do ponownego otwarcia modalu przy „Kontruj". */
  uiActionId: string;
  /**
   * Podgląd oceny warunków przez stronę, która ma odpowiedzieć (evaluateProposal).
   * incoming → czy gracz może przyjąć; own → czy AI spełnia warunki oferty.
   */
  responderPreview?: { accepted: boolean; reason?: string };
  /** incoming: Przyjmij dostępne tylko gdy warunki spełnione (i brak legacy access). */
  canAccept?: boolean;
  /** own: czekamy na odpowiedź AI — akcja Przyjmij w panelu PN. */
  awaitingAiResponse?: boolean;
  /** Jednostronny dar od nich (My puste) — nie pokazuj karty wymiany po stronie My. */
  isGift?: boolean;
  /** Saldo punktów akceptacji (PN) — perspektywa gracza. */
  acceptanceMy?: import('../game/diplomacy-acceptance-points').AcceptanceSideBalance;
  acceptanceTheir?: import('../game/diplomacy-acceptance-points').AcceptanceSideBalance;
}

export interface DiplomacyAudienceConfig {
  ownerId: number;
  /** typCywilizacji / ikonaId rozmówcy (civs.json) — wybór muzyki per-civ. */
  otherCivId?: string;
  getState: () => DiplomacyAudienceState | null;
  /** payload opcjonalny — po modalu negocjacji v1.1 */
  onAction: (ownerId: number, actionId: string, payload?: NegotiationPayload) => void;
  onBack: () => void;
  /** Etykieta przycisku zamknięcia — „Wróć” (lista) lub „Wyjście” (mapa). */
  backLabel?: string;
  /** Czy w kolejce jest ≥1 inna otwarta propozycja dyplomatyczna. */
  hasNextOpenProposal?: () => boolean;
  /** Przejdź do następnej otwartej propozycji w kolejce (bez wychodzenia z flow wydarzeń). */
  onNextOpenProposal?: () => void;
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
   * TEMAT 9 (2026-07-24, „stół negocjacyjny") — podgląd wstępnej zgody drugiej strony
   * PRZED zawarciem umowy (klik „Zaproponuj" w modalu negocjacji). Woła evaluateProposal
   * bez finalizacji (SILNIK: previewNegotiatedProposal, main.ts). Brak = modal traktuje
   * podgląd jako zawsze zaakceptowany (kompatybilność wstecz, gdyby callback nie był wpięty).
   */
  previewNegotiation?: (
    ownerId: number,
    payload: NegotiationPayload,
  ) => { accepted: boolean; reason?: string };
  /**
   * Zaległość #2 — „Zerwij": dobrowolne zerwanie traktatu wskazanego przez `id`
   * (kolumna „Aktywne traktaty"). Brak = przycisk pozostaje wyłączony ("wkrótce").
   */
  onBreakTreaty?: (dealId: string) => void;
  /** Podgląd kar przed dobrowolnym zerwaniem traktatu (Wiarygodność / Zaufanie). */
  previewBreakTreatyPenalties?: (dealId: string) => DiploPenaltyPreview | undefined;
  /** C-DYP-Q1=A: gracz Przyjmuje wpis stołu (id z pendingNegotiations), w którym to jego kolej. */
  onAcceptNegotiation?: (negotiationId: string) => void;
  /** C-DYP-Q1=A: gracz Odrzuca wpis stołu. */
  onRejectNegotiation?: (negotiationId: string) => void;
  /** R-DYPLO-STOL-ACCEPT-Q1=A: Przyjmij cały pakiet na stole u tego partnera. */
  onAcceptNegotiationPackage?: () => void;
  /** R-DYPLO-STOL-ACCEPT-Q1=A: Odrzuć cały pakiet na stole u tego partnera. */
  onRejectNegotiationPackage?: () => void;
  /** R-DYPLO-STOL-USUN-Q1=A: Usuń pojedynczą pozycję ze stołu (bez odrzucenia reszty). */
  onRemoveNegotiation?: (negotiationId: string) => void;
  /** C-DYP-Q1=A: gracz wysyła kontrofertę (nowy formularz negocjacji) do wpisu stołu. */
  onCounterNegotiation?: (negotiationId: string, payload: NegotiationPayload) => void;
  /**
   * Gracz prosi AI o odpowiedź na własną propozycję leżącą na stole (bez natychmiastowego
   * resolve przy wysłaniu — Maciej 2026-07-29).
   */
  onRequestAiNegotiationResponse?: (negotiationId: string) => void;
  /**
   * Celownik na karcie rozmówcy — wycentruj kamerę na stolicy tego państwa (SILNIK:
   * capitalCityIdForOwner + camCtrl.focusAt). UI zamyka overlay i woła callback.
   */
  onFocusCapital?: (ownerId: number) => void;
}

let cfg: DiplomacyAudienceConfig | null = null;
let rootEl: HTMLDivElement | null = null;
let modalOverlay: HTMLDivElement | null = null;
/** Po kliknięciu wpisu stołu w kolejce zdarzeń — otwórz modal kontroferty zaraz po renderze audiencji. */
let pendingAutoCounterNegotiationId: string | null = null;

/** Woła SILNIK (openDiplomacyAudienceForNegotiation) przed showDiplomacyAudience. */
export function requestAutoCounterNegotiation(negotiationId: string): void {
  pendingAutoCounterNegotiationId = negotiationId;
}

function findIncomingNegotiationRow(
  st: DiplomacyAudienceState,
  aid: string,
): PendingNegotiationRow | undefined {
  return (st.pendingNegotiations ?? []).find(
    r => r.direction === 'incoming' && r.uiActionId === aid,
  );
}

function findOwnOutgoingNegotiationRow(
  st: DiplomacyAudienceState,
  aid: string,
): PendingNegotiationRow | undefined {
  return (st.pendingNegotiations ?? []).find(
    r => r.direction === 'own' && r.uiActionId === aid,
  );
}

/** Blokuje duplikat na stole: ich wpis → kontroferta; nasz → ignoruj klik. */
function blockDuplicateNegotiationClick(
  st: DiplomacyAudienceState,
  aid: string,
  mergeBasketCtx: (negCtx: NegotiationModalContext) => NegotiationModalContext,
): boolean {
  const incoming = findIncomingNegotiationRow(st, aid);
  if (incoming) {
    if (incoming.canCounter) {
      openCounterNegotiationModal(st, incoming, mergeBasketCtx);
    }
    return true;
  }
  return findOwnOutgoingNegotiationRow(st, aid) != null;
}

function openCounterNegotiationModal(
  st: DiplomacyAudienceState,
  row: PendingNegotiationRow,
  mergeBasketCtx: (negCtx: NegotiationModalContext) => NegotiationModalContext,
): void {
  if (!cfg?.getNegotiationContext || !row.canCounter) return;
  const negCtx = cfg.getNegotiationContext(row.uiActionId);
  if (!negCtx) return;
  const syntheticAction: AudienceAction = {
    id: row.uiActionId,
    label: row.actionLabel ?? 'Kontroferta',
    enabled: true,
  };
  if (actionUsesTradeBasket(row.uiActionId)) {
    showTradeBasketModal(
      getTradeBasketMode(row.uiActionId),
      syntheticAction,
      mergeBasketCtx(negCtx),
      (payload) => cfg!.onCounterNegotiation?.(row.id, payload),
      () => { /* anulowano */ },
      row.counterInitial,
      {
        dialogTitle: 'Edytuj propozycję na stole',
        submitLabel: 'Wyślij kontrofertę',
      },
    );
    return;
  }
  showNegotiationModal(
    syntheticAction,
    mergeBasketCtx(negCtx),
    (payload) => cfg!.previewNegotiation
      ? cfg!.previewNegotiation(cfg!.ownerId, payload)
      : { accepted: true },
    (payload) => cfg!.onCounterNegotiation?.(row.id, payload),
    () => { /* anulowano */ },
  );
}

function childModalBlocksExit(): boolean {
  if (modalOverlay !== null) return true;
  const neg = document.querySelector('.civ-diplo-neg-overlay') as HTMLElement | null;
  if (neg && neg.style.display !== 'none') return true;
  const basket = document.querySelector('.civ-diplo-basket-overlay') as HTMLElement | null;
  if (basket && basket.style.display !== 'none') return true;
  return false;
}

function handleAudienceEscape(): void {
  if (cfg === null || rootEl === null || rootEl.style.display === 'none') return;
  if (childModalBlocksExit()) return;
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
.civ-diplo-aud-head-btns{display:flex;gap:8px;align-items:center;flex-shrink:0;}
.civ-diplo-aud-head-btns .dip-muted-btn,.civ-diplo-aud-head-btns .dip-gold-btn{padding:6px 14px;font-size:0.82em;}
.civ-diplo-aud-next[disabled]{opacity:.4;cursor:not-allowed;}
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
.da-card.them .dip-capital-locate{position:absolute;top:8px;right:8px;z-index:2;}
.da-portrait{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;
  padding-bottom:8px;border-bottom:1px solid rgba(232,216,138,.18);}
.da-portrait .dip-leader-medallion{width:64px;height:64px;}
.da-portrait .dip-leader-ic{width:32px;height:32px;}
.da-civname{font-family:var(--tg-font-title,Georgia,serif);font-size:1.05em;color:var(--tg-gold-primary,#e8d88a);letter-spacing:.02em;}
.da-civname.has-brand-tip{cursor:help;}
.da-civleader{font-size:0.72em;font-style:italic;color:var(--tg-gold-dim,#c9a84c);line-height:1.3;}
.da-civtitle{font-size:0.68em;color:#8a8070;line-height:1.5;}
.da-civtitle-row{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;}
.da-wiar-badge{display:inline-flex;align-items:center;font-size:0.6em;font-weight:600;line-height:1.35;
  color:#9ab0c8;border:1px solid rgba(122,152,192,.32);background:rgba(40,52,72,.45);
  border-radius:999px;padding:2px 8px;cursor:help;white-space:nowrap;}
.da-wiar-badge.pos{color:#9ab8e8;border-color:rgba(122,160,232,.38);background:rgba(58,74,122,.28);}
.da-wiar-badge.neg{color:#c8a0a0;border-color:rgba(180,100,100,.35);background:rgba(72,40,40,.28);}
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
.da-per-turn{font-weight:600;font-size:0.92em;color:#9ab8e8;margin-left:4px;}
.da-rel-row.trust .v{color:#7ad0a0;} .da-rel-row.respect .v{color:#e8d88a;}
.da-rel-row.credibility .v{color:#9ab8e8;}
.da-rel-row.relacja-total{margin-top:6px;border-top:1px dashed rgba(232,216,138,.12);padding-top:6px;}
.da-rel-row.relacja-total .v{color:#e8d88a;font-weight:700;}
.da-rel-sum-hint{font-size:0.58em;color:#6a6058;margin-left:4px;}
.da-rbar.relacja-total{background:rgba(232,216,138,.12);}
.da-rbar.relacja-total i{background:linear-gradient(90deg,#8a7050,#e8d88a);}
.da-rbar{height:6px;border-radius:4px;background:rgba(0,0,0,.4);overflow:hidden;margin-bottom:6px;border:1px solid rgba(0,0,0,.3);}
.da-rbar i{display:block;height:100%;}
.da-rbar.trust i{background:linear-gradient(90deg,#2f7a4a,#5ad07a);}
.da-rbar.respect i{background:linear-gradient(90deg,#9a7420,#e8d88a);}
.da-rbar.credibility i{background:linear-gradient(90deg,#3a4a7a,#7aa0e8);}
.da-credibility-hint{font-size:0.58em;color:#6a7080;line-height:1.35;margin-top:2px;}
.da-credbreak{margin-top:6px;background:rgba(0,0,0,.18);border:1px solid rgba(232,216,138,.14);
  border-radius:8px;overflow:hidden;}
.da-credbreak-h{font-size:0.58em;text-transform:uppercase;letter-spacing:.04em;color:#8a8070;
  padding:5px 8px 3px;border-bottom:1px solid rgba(232,216,138,.1);}
.da-credbreak .da-rfact{padding:2px 8px;font-size:0.62em;}
.da-credbreak-foot{padding:4px 8px 5px;font-size:0.58em;color:#6a7080;border-top:1px solid rgba(232,216,138,.1);}
.da-credbreak-foot b{color:#e8d88a;}
.da-goods{display:flex;flex-wrap:wrap;gap:5px;}
.da-good{font-size:0.62em;padding:3px 8px;border-radius:7px;border:1px solid rgba(232,216,138,.2);
  background:rgba(24,30,42,.65);color:#c8b898;white-space:nowrap;}
.da-goods-empty{font-size:0.62em;color:#6a7280;}
.da-goods-acc{display:flex;flex-direction:column;gap:3px;}
.da-goods-cat-hdr{display:flex;align-items:center;gap:4px;width:100%;padding:4px 6px;border-radius:5px;
  border:1px solid rgba(232,216,138,.15);background:rgba(18,22,32,.5);color:#c8b898;font-size:0.64em;
  font-weight:600;cursor:pointer;font-family:inherit;text-align:left;}
.da-goods-cat-hdr.is-empty{color:#6a7280;border-color:rgba(100,100,100,.2);background:rgba(12,14,20,.4);}
.da-goods-cat-hdr.is-open{border-color:rgba(232,216,138,.28);}
.da-goods-cat-hdr.is-open .da-goods-cat-chevron{transform:rotate(90deg);}
.da-goods-cat-chevron{display:inline-block;transition:transform .15s;font-size:0.85em;color:#8a8070;flex:none;}
.da-goods-cat-count{font-weight:400;color:#8a8070;font-size:0.92em;}
.da-goods-cat-body{overflow:hidden;max-height:160px;transition:max-height .2s ease,padding .15s;}
.da-goods-cat-body.is-collapsed{max-height:0;padding:0;margin:0;opacity:0;pointer-events:none;}
.da-goods-cat-body .da-goods{padding:4px 2px 2px;}
.da-goods-cat-none{font-size:0.62em;color:#6a7280;font-style:italic;padding:2px 6px;}
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

.da-table-area{flex:1;display:grid;grid-template-columns:1fr 0.85fr 0.85fr 1fr;grid-template-rows:auto auto auto;gap:10px;min-height:0;align-content:start;}
.da-table-area>.da-col{max-height:400px;}
.da-col-deals{grid-column:1;grid-row:1;}
.da-col-offers{grid-column:2;grid-row:1;}
.da-col-negot{grid-column:3;grid-row:1;}
.da-col-treaties{grid-column:4;grid-row:1;}
.da-pn-balance-bar{grid-column:2/4;grid-row:2;}
.da-negot-actionbar{grid-column:2/4;grid-row:3;display:flex;flex-direction:column;gap:6px;padding:6px 8px;
  border-radius:8px;border:1px solid rgba(90,208,122,.28);background:rgba(12,18,14,.55);}
.da-negot-actionbar:empty{display:none;}
/* C-DYP-Q1=A (2026-07-26) — kolumna „Oni oferują" (ex Oczekujące propozycje; stół z kontrofertą). */
.da-negot{display:flex;flex-direction:column;gap:6px;padding:7px 8px;border-radius:8px;
  border:1px solid rgba(232,216,138,.18);background:linear-gradient(180deg,rgba(26,32,44,.7),rgba(12,16,24,.7));}
.da-negot.incoming{border-color:rgba(90,208,122,.4);}
.da-negot-linked-we{border-style:dashed;border-color:rgba(110,150,220,.35);opacity:.9;}
.da-negot-linked-we .da-nm .dir{border-color:rgba(110,150,220,.4);color:#8ab4e8;}
.da-negot-linked-they{border-color:rgba(90,208,122,.45);}
.da-negot-linked-they[data-negot-linked]::before{content:'';position:absolute;left:-6px;top:50%;
  width:4px;height:60%;transform:translateY(-50%);border-radius:2px;background:rgba(90,208,122,.35);}
.da-negot-linked-they{position:relative;}
.da-negot-linked.can-edit{cursor:pointer;transition:border-color .15s,box-shadow .15s;}
.da-negot-linked.can-edit:hover{border-color:rgba(232,216,138,.55);box-shadow:0 0 0 1px rgba(232,216,138,.25);}
.da-negot-edit-hint{font-size:0.62em;color:#8a8070;margin-top:4px;font-style:italic;}
.da-card-actions{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;}
.da-card-actions button{font-size:0.72em;padding:3px 8px;border-radius:5px;cursor:pointer;
  border:1px solid rgba(232,216,138,.25);background:rgba(30,36,48,.85);color:#e8e0c8;}
.da-card-actions button.da-rm-negot{color:#e08a8a;border-color:rgba(200,64,64,.35);}
.da-package-hint{font-size:0.62em;color:#8a8070;line-height:1.45;margin-top:6px;}
.da-negot-actionbar--package{padding:8px 10px;border-radius:8px;border:1px solid rgba(232,216,138,.2);
  background:rgba(18,22,32,.75);margin-top:8px;}
.da-deal-side-only .da-deal-col{max-width:100%;}
.da-negot .da-nm{font-size:0.72em;font-weight:600;color:#e8e0c8;display:flex;align-items:center;gap:6px;}
.da-negot .da-nm .dir{font-size:0.62em;font-weight:700;letter-spacing:.03em;text-transform:uppercase;
  padding:1px 6px;border-radius:6px;border:1px solid rgba(232,216,138,.3);color:#8a8070;}
.da-negot.incoming .da-nm .dir{border-color:rgba(90,208,122,.45);color:#7ad0a0;}
.da-negot:not(.incoming){border-style:dashed;opacity:.82;}
.da-dir-ic{width:11px;height:11px;vertical-align:-1px;margin-right:3px;color:#8a8070;}
.da-negot.incoming .da-nm .dir .da-dir-ic{color:#7ad0a0;}
.da-negot .da-meta{font-size:0.62em;color:#8a8070;}
.da-negot .da-deal-detail{font-size:0.7em;color:#e8e0c8;line-height:1.45;margin:2px 0 4px;}
.da-deal-table{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 2px;}
.da-deal-col{border:1px solid rgba(232,216,138,.16);border-radius:7px;padding:6px 7px;
  background:linear-gradient(180deg,rgba(18,22,32,.85),rgba(8,10,16,.75));min-width:0;}
.da-deal-col-we{border-color:rgba(110,150,220,.28);}
.da-deal-col-they{border-color:rgba(90,208,122,.32);}
.da-deal-col-head{font-size:0.62em;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  text-align:center;padding-bottom:5px;margin-bottom:5px;border-bottom:1px solid rgba(255,255,255,.06);}
.da-deal-col-we .da-deal-col-head{color:#8ab4e8;}
.da-deal-col-they .da-deal-col-head{color:#7ad0a0;}
.da-deal-col-body{display:flex;flex-direction:column;gap:4px;min-height:28px;}
.da-deal-item{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;line-height:1.35;}
.da-deal-res-ic{display:inline-flex;align-items:center;flex-shrink:0;opacity:.95;}
.da-deal-res-ic svg{display:block;}
.da-deal-amt{font-weight:600;color:#f0e8d8;}
.da-deal-per{font-size:0.92em;color:#9ad4b0;}
.da-deal-once{font-size:0.88em;color:#8a8070;}
.da-deal-total{flex-basis:100%;font-size:0.82em;color:#c8b890;padding-left:0;margin-top:2px;}
.da-deal-sched-foot{margin-top:4px;padding-top:5px;border-top:1px solid rgba(255,255,255,.06);
  font-size:0.88em;color:#b8a888;text-align:center;}
.da-deal-empty{color:#6a6058;font-style:italic;}
.da-deal-single{display:flex;flex-direction:column;gap:5px;margin:4px 0 2px;}
.da-deal-context{padding:5px 7px;border-radius:6px;border:1px dashed rgba(232,216,138,.14);
  background:rgba(0,0,0,.15);}
.da-deal-ctx-label{font-size:0.58em;font-weight:600;letter-spacing:.04em;text-transform:uppercase;
  color:#6a7280;margin-bottom:3px;}
.da-deal-ctx-body{display:flex;flex-direction:column;gap:3px;font-size:0.92em;opacity:.88;}
.da-negot-actionbar .da-neg-act-label{font-size:0.64em;color:#8a8070;margin-bottom:2px;}
.da-negot-actionbar .da-btnrow{display:flex;gap:8px;}
.da-negot-actionbar .da-btnrow button{flex:1;font-size:0.72em;padding:7px 10px;border-radius:6px;
  border:1px solid rgba(232,216,138,.3);background:rgba(232,216,138,.08);color:#e8e0c8;cursor:pointer;font-family:inherit;font-weight:600;}
.da-negot-actionbar .da-btnrow button.acc{border-color:rgba(90,208,122,.55);color:#7ad0a0;}
.da-negot-actionbar .da-btnrow button.rej{border-color:rgba(200,64,64,.55);color:#e08a8a;}
.da-negot-actionbar .da-btnrow button:hover{filter:brightness(1.2);}
.da-negot-actionbar .da-btnrow button:disabled{opacity:.4;cursor:not-allowed;}
.da-cond-verdict{font-size:0.68em;line-height:1.4;margin:4px 0 2px;padding:5px 7px;border-radius:6px;}
.da-cond-verdict.ok{color:#7ad0a0;background:rgba(80,176,112,.1);border:1px solid rgba(80,176,112,.35);}
.da-cond-verdict.no{color:#e0a868;background:rgba(224,168,104,.08);border:1px solid rgba(224,168,104,.35);}
.da-cond-verdict.wait{color:#a8a090;background:rgba(40,48,60,.45);border:1px solid rgba(232,216,138,.2);}
.da-negot .da-req-ai{margin-top:6px;font-size:0.7em;padding:6px 10px;border-radius:6px;
  border:1px solid rgba(140,180,240,.45);background:rgba(90,140,200,.25);color:#e8e0c8;cursor:pointer;width:100%;}
.da-accept-pts{font-size:0.66em;line-height:1.35;margin:4px 0 2px;padding:4px 7px;border-radius:5px;
  border:1px solid rgba(232,216,138,.18);background:rgba(24,28,36,.55);}
.da-accept-pts .ap-row{display:flex;justify-content:space-between;gap:6px;}
.da-accept-pts .ap-lbl{color:#8a8070;}
.da-accept-pts .ap-val{font-weight:600;color:#e8e0c8;}
.da-accept-pts .ap-val.pos{color:#7ad0a0;}
.da-accept-pts .ap-val.neg{color:#e0a868;}
.da-accept-pts .ap-foot{margin-top:3px;padding-top:3px;border-top:1px dashed rgba(255,255,255,.06);font-weight:600;}
.da-accept-pts.ok .ap-foot{color:#7ad0a0;}
.da-accept-pts.no .ap-foot{color:#e0a868;}
/* Panel PN — bilans porozumienia między kolumnami My / Oni (Maciej 2026-07-29). */
.da-pn-balance-bar{border-radius:10px;padding:10px 12px;border:2px solid rgba(232,216,138,.28);
  background:linear-gradient(180deg,rgba(22,28,40,.95),rgba(10,14,22,.92));
  box-shadow:0 4px 16px rgba(0,0,0,.35);}
.da-pn-balance-bar.ok{border-color:rgba(90,208,122,.45);}
.da-pn-balance-bar.no{border-color:rgba(224,136,104,.45);}
.da-pn-balance-bar.idle{border-color:rgba(140,150,165,.25);opacity:.92;}
.da-pn-bal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}
.da-pn-bal-head-titles{display:inline-flex;align-items:baseline;gap:6px;}
.da-pn-bal-title{font-size:0.68em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#e8d88a;cursor:help;}
.da-pn-bal-abbr{font-size:0.62em;font-weight:700;letter-spacing:.06em;color:#c8b898;text-decoration:none;cursor:help;border-bottom:1px dotted rgba(200,184,152,.45);}
.da-pn-bal-deal{font-size:0.72em;color:#c8b898;text-align:right;}
.da-pn-bal-more{display:inline-block;margin-left:6px;font-size:0.85em;color:#8a8070;}
.da-pn-bal-empty{font-size:0.72em;color:#8a8070;line-height:1.45;padding:4px 0;}
.da-pn-bal-cols{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:8px;align-items:stretch;}
.da-pn-bal-cell{border-radius:8px;padding:8px 10px;border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.22);text-align:center;display:flex;flex-direction:column;gap:3px;min-width:0;}
.da-pn-bal-cell.my{border-color:rgba(110,150,220,.35);}
.da-pn-bal-cell.they{border-color:rgba(90,208,122,.35);}
.da-pn-bal-cell.center.ok{border-color:rgba(90,208,122,.5);background:rgba(40,80,50,.25);}
.da-pn-bal-cell.center.no{border-color:rgba(224,136,104,.45);background:rgba(80,40,30,.2);}
.da-pn-bal-lbl{font-size:0.58em;text-transform:uppercase;letter-spacing:.06em;color:#8a8070;}
.da-pn-bal-num{font-size:1.15em;font-weight:700;font-variant-numeric:tabular-nums;color:#f0e8d8;line-height:1.2;
  display:flex;flex-direction:column;align-items:center;gap:2px;}
.da-pn-bal-pw{font-size:1em;font-weight:700;color:inherit;line-height:1.2;}
.da-pn-bal-base{display:block;font-size:0.62em;font-weight:500;color:#8a8070;margin-top:2px;line-height:1.3;white-space:normal;}
.da-pn-bal-num.pos{color:#7ad0a0;}
.da-pn-bal-num.neg{color:#e0a868;}
.da-pn-bal-hint{font-size:0.62em;color:#a8a090;line-height:1.3;}
.da-pn-bal-meta{font-size:0.62em;color:#8a8070;margin-top:6px;}
.da-pn-bal-meta.warn{color:#e0a868;}
.da-pn-rel-mod{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 10px;margin-top:8px;padding:6px 10px;
  border-radius:7px;border:1px solid rgba(140,150,165,.25);background:rgba(0,0,0,.18);cursor:help;}
.da-pn-rel-mod-pct{font-size:0.72em;font-weight:800;padding:2px 7px;border-radius:5px;
  background:rgba(0,0,0,.25);color:#e8d88a;font-variant-numeric:tabular-nums;}
.da-pn-rel-mod.worse .da-pn-rel-mod-pct{color:#e0a868;}
.da-pn-rel-mod.better .da-pn-rel-mod-pct{color:#7ad0a0;}
.da-deal-pw-base{font-size:0.85em;color:#8a8070;font-weight:500;}
.da-pn-rel-mod-label{font-size:0.58em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8a8070;flex:0 0 auto;}
.da-pn-rel-mod-text{font-size:0.7em;line-height:1.35;color:#d8d0c0;}
.da-pn-rel-mod-text strong{color:#f0e8d8;font-weight:700;}
.da-pn-rel-mod-deal{font-weight:600;}
.da-pn-rel-mod-balance{font-size:0.92em;color:#8a8070;}
.da-pn-rel-mod.better{border-color:rgba(90,208,122,.4);background:rgba(40,80,50,.2);}
.da-pn-rel-mod.better .da-pn-rel-mod-deal{color:#7ad0a0;}
.da-pn-rel-mod.worse{border-color:rgba(224,136,104,.4);background:rgba(80,40,30,.18);}
.da-pn-rel-mod.worse .da-pn-rel-mod-deal{color:#e0a868;}
.da-pn-rel-mod.neutral{border-color:rgba(140,150,165,.3);}
.da-pn-rel-mod.neutral .da-pn-rel-mod-deal{color:#c8b898;}
.da-pn-bal-verdict{margin-top:8px;padding:7px 10px;border-radius:7px;font-size:0.72em;font-weight:600;line-height:1.4;}
.da-pn-bal-verdict.ok{color:#7ad0a0;background:rgba(80,176,112,.12);border:1px solid rgba(80,176,112,.35);}
.da-pn-bal-verdict.no{color:#e0a868;background:rgba(224,168,104,.1);border:1px solid rgba(224,168,104,.35);}
.da-pn-bal-verdict.wait{color:#a8a090;background:rgba(40,48,60,.45);border:1px solid rgba(232,216,138,.2);}
.da-accept-compact{font-size:0.62em;line-height:1.35;margin:4px 0 2px;padding:3px 6px;border-radius:5px;
  border:1px dashed rgba(232,216,138,.15);color:#a8a090;}
.da-accept-compact.ok{color:#7ad0a0;border-color:rgba(90,208,122,.3);}
.da-accept-compact.no{color:#e0a868;border-color:rgba(224,168,104,.3);}
.da-negot-gift .da-nm .dir{border-color:rgba(224,168,104,.45);color:#e0a868;}
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
.da-deal.on-table{opacity:.72;border-style:dashed;}
.da-deal.on-table .da-note{color:#8ab4e8;}
.da-multi-deal-hint{font-size:0.62em;color:#8a8070;line-height:1.45;margin-top:6px;padding:6px 8px;
  border-radius:6px;border:1px dashed rgba(232,216,138,.2);background:rgba(0,0,0,.18);}
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

@media (max-width:1200px){.da-table-area{grid-template-columns:1fr;}.da-pn-balance-bar,.da-negot-actionbar{grid-column:1;}.da-card{flex:0 0 200px;width:200px;}}
@media (max-width:920px){.da-relbreak{grid-template-columns:1fr;}.da-relcol.pos{border-right:none;border-bottom:1px solid rgba(232,216,138,.18);}}
@media (max-width:760px){.da-mainrow{flex-wrap:wrap;}.da-card{width:100%;flex:1 1 auto;}}

/* ===== FAZA 3 pkt 8 — pasek szybkich akcji (SAME IKONY, 46×46) + „Szybka Umowa" ===== */
.da-actionbar{display:flex;align-items:flex-end;gap:9px;justify-content:center;flex-wrap:wrap;padding-top:2px;}
.da-abtn-cell{display:inline-flex;flex-direction:column;align-items:center;gap:2px;max-width:74px;}
.da-abtn-note{font-size:0.5em;line-height:1.2;color:#e08a8a;text-align:center;max-width:70px;
  overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
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
.civ-diplo-modal .cd-penalty-wrap{margin:0 0 14px;padding:10px 12px;border-radius:8px;
  border:1px solid rgba(224,122,122,0.35);background:rgba(80,24,24,0.22);}
.civ-diplo-modal .cd-penalty-title{margin:0 0 8px;font-size:12px;font-weight:700;color:#e08a8a;}
.civ-diplo-modal .cd-penalty-list{margin:0;padding-left:1.1em;font-size:12px;line-height:1.45;color:#d8b8b8;}
.civ-diplo-modal .cd-penalty-list li{margin:0 0 4px;}
.civ-diplo-modal .cd-penalty-list li:last-child{margin-bottom:0;}
.civ-diplo-modal .cd-penalty-list b{color:#f0c0c0;}
.civ-diplo-modal .cd-penalty-list .info{color:#c8b898;font-style:italic;}
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

/** Wspólny typ podglądu kar (gra/game/diplomacy-penalty-preview.ts). */
export interface DiploPenaltyPreviewLine {
  kind: 'wiarygodnosc' | 'zaufanie' | 'info';
  delta: number;
  reason: string;
}

export interface DiploPenaltyPreview {
  lines: DiploPenaltyPreviewLine[];
  wiarygodnoscTotal: number;
  zaufanieTotal: number;
}

function signedDelta(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function penaltyKindLabel(kind: DiploPenaltyPreviewLine['kind']): string {
  if (kind === 'wiarygodnosc') return 'Wiarygodność';
  if (kind === 'zaufanie') return 'Zaufanie';
  return '';
}

function penaltyBlockHtml(preview: DiploPenaltyPreview | undefined): string {
  if (!preview?.lines.length) return '';
  const items = preview.lines.map((l) => {
    if (l.kind === 'info') {
      return '<li class="info">' + esc(l.reason) + '</li>';
    }
    return '<li><b>' + esc(penaltyKindLabel(l.kind) + ' ' + signedDelta(l.delta)) + '</b> — '
      + esc(l.reason) + '</li>';
  }).join('');
  return '<div class="cd-penalty-wrap">' +
    '<p class="cd-penalty-title">Czy na pewno? Skutki tej decyzji:</p>' +
    '<ul class="cd-penalty-list">' + items + '</ul></div>';
}

export interface WarConsentModalOptions {
  civName: string;
  previewDeclareOnly: DiploPenaltyPreview;
  previewDeclareAndAttack?: DiploPenaltyPreview;
  /** Domyślnie true — false w audiencji (akcja 11, brak oczekującego ataku). */
  showAttackOption?: boolean;
  onDeclareOnly: () => void;
  onDeclareAndAttack?: () => void;
}

/**
 * C-WIAR-N1-UX=A — modal trzyopcjiowy przy ataku / wypowiedzeniu wojny poza stanem wojny.
 * (1) Wypowiedz wojnę — bez ataku w tej turze · (2) Atakuj bez wypowiedzenia — wojna + atak + N1 · (3) Anuluj.
 */
export function showWarConsentModal(opts: WarConsentModalOptions): void {
  ensureStyles();
  const showAttack = opts.showAttackOption !== false && opts.onDeclareAndAttack != null;
  if (modalOverlay !== null) modalOverlay.remove();
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'civ-diplo-modal-overlay';
  const attackBlock = showAttack
    ? '<div class="cd-war-opt">' +
        '<p class="cd-war-opt-title"><strong>Atakuj bez wypowiedzenia</strong> — wojna od razu i atak w tej turze</p>' +
        penaltyBlockHtml(opts.previewDeclareAndAttack ?? opts.previewDeclareOnly) +
      '</div>'
    : '';
  modalOverlay.innerHTML =
    '<div class="civ-diplo-modal cd-war-consent-modal" role="dialog" aria-modal="true">' +
      '<h3>Konflikt z ' + esc(opts.civName) + '</h3>' +
      '<p class="cd-war-lead">Nie jesteście w stanie wojny. Wybierz, jak chcesz postąpić:</p>' +
      '<div class="cd-war-opt">' +
        '<p class="cd-war-opt-title"><strong>Wypowiedz wojnę</strong> — bez ataku w tej turze (karencja N1)</p>' +
        penaltyBlockHtml(opts.previewDeclareOnly) +
      '</div>' +
      attackBlock +
      '<div class="cd-modal-btns cd-war-consent-btns">' +
        '<button type="button" class="dip-gold-btn cd-war-declare-only">Wypowiedz wojnę</button>' +
        (showAttack
          ? '<button type="button" class="dip-gold-btn cd-war-attack-now" style="border-color:rgba(200,64,64,.5);color:#e08a8a;">Atakuj bez wypowiedzenia</button>'
          : '') +
        '<button type="button" class="dip-muted-btn cd-modal-cancel">Anuluj</button>' +
      '</div></div>';
  document.body.appendChild(modalOverlay);
  const close = (): void => {
    if (modalOverlay !== null) { modalOverlay.remove(); modalOverlay = null; }
  };
  modalOverlay.querySelector('.cd-modal-cancel')?.addEventListener('click', close);
  modalOverlay.querySelector('.cd-war-declare-only')?.addEventListener('click', () => {
    close();
    opts.onDeclareOnly();
  });
  if (showAttack) {
    modalOverlay.querySelector('.cd-war-attack-now')?.addEventListener('click', () => {
      close();
      opts.onDeclareAndAttack!();
    });
  }
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) close(); });
}

export interface AllianceObligationModalOptions {
  allyName: string;
  targetName: string;
  previewRefuse: DiploPenaltyPreview;
  onFulfill: () => void;
  onRefuse: () => void;
}

/**
 * Modal obowiązku sojuszu — gracz musi wypełnić sojusz (wojna) lub odmówić (N4 + zerwanie).
 */
export function showAllianceObligationModal(opts: AllianceObligationModalOptions): void {
  ensureStyles();
  if (modalOverlay !== null) modalOverlay.remove();
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'civ-diplo-modal-overlay';
  modalOverlay.innerHTML =
    '<div class="civ-diplo-modal cd-war-consent-modal" role="dialog" aria-modal="true">' +
      '<h3>Obowiązek sojuszu</h3>' +
      '<p class="cd-war-lead">Sojusznik <strong>' + esc(opts.allyName) + '</strong> wymaga, '
      + 'żebyś wypowiedział wojnę: <strong>' + esc(opts.targetName) + '</strong>.</p>' +
      '<div class="cd-war-opt">' +
        '<p class="cd-war-opt-title"><strong>Odmowa</strong> — kara Wiarygodności i zerwanie sojuszu</p>' +
        penaltyBlockHtml(opts.previewRefuse) +
      '</div>' +
      '<div class="cd-modal-btns cd-war-consent-btns">' +
        '<button type="button" class="dip-gold-btn cd-alliance-fulfill">Wypełnij sojusz</button>' +
        '<button type="button" class="dip-muted-btn cd-alliance-refuse" style="border-color:rgba(200,64,64,.5);color:#e08a8a;">Odmów (kara)</button>' +
      '</div></div>';
  document.body.appendChild(modalOverlay);
  const close = (): void => {
    if (modalOverlay !== null) { modalOverlay.remove(); modalOverlay = null; }
  };
  modalOverlay.querySelector('.cd-alliance-fulfill')?.addEventListener('click', () => {
    close();
    opts.onFulfill();
  });
  modalOverlay.querySelector('.cd-alliance-refuse')?.addEventListener('click', () => {
    close();
    opts.onRefuse();
  });
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) close(); });
}

/** @deprecated Użyj showWarConsentModal — zostawione dla kompatybilności (2 przyciski). */
export function showWarConfirmModal(
  civName: string,
  onConfirm: () => void,
  penaltyPreview?: DiploPenaltyPreview,
): void {
  ensureStyles();
  if (modalOverlay !== null) modalOverlay.remove();
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'civ-diplo-modal-overlay';
  modalOverlay.innerHTML =
    '<div class="civ-diplo-modal" role="dialog" aria-modal="true">' +
      '<h3>Wypowiedzieć wojnę?</h3>' +
      '<p>Na pewno wypowiadasz wojnę <strong>' + esc(civName) + '</strong>?</p>' +
      penaltyBlockHtml(penaltyPreview) +
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
  penaltyPreview: DiploPenaltyPreview | undefined,
  onConfirm: () => void,
): void {
  ensureStyles();
  if (modalOverlay !== null) modalOverlay.remove();
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'civ-diplo-modal-overlay';
  modalOverlay.innerHTML =
    '<div class="civ-diplo-modal" role="dialog" aria-modal="true">' +
      '<h3>Zerwać traktat?</h3>' +
      '<p>Na pewno zrywasz: <strong>' + esc(treatyLabel) + '</strong>?</p>' +
      penaltyBlockHtml(penaltyPreview) +
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

function audienceAtWar(st: DiplomacyAudienceState): boolean {
  return st.formalStatus?.kind === 'wojna';
}

function stanceBadgeHtml(st: DiplomacyAudienceState): string {
  const atWar = audienceAtWar(st);
  const label = nastawienieLabelFromScore(st.zaufanie, st.respekt, { atWar });
  const hostile = atWar || label === 'Wrogi' || label === 'Nieufny';
  const cls = hostile ? 'da-stance-badge hostile' : 'da-stance-badge';
  return (
    '<span class="' + cls + '" title="' + esc(nastawienieHintPl(atWar)) + '">' +
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

function civNameHtml(civName: string, ikonaId: string | undefined, displayIkonaId?: string | null): string {
  const brandLine = civBrandLineForKey(ikonaId);
  const tip = brandLine ? ' title="' + esc(brandLine) + '"' : '';
  const cls = brandLine ? ' has-brand-tip' : '';
  return '<div class="da-civname' + cls + '"' + tip + '>'
    + esc(civCardDisplayName(civName, displayIkonaId ?? ikonaId)) + '</div>';
}

type GoodsAccordionSide = 'player' | 'other';

const GOODS_CAT_LABELS: Readonly<Record<keyof TradeGoodsCategories, string>> = {
  surowce: 'Surowce',
  technologie: 'Technologie',
  inne: 'Inne',
};

const GOODS_CAT_ORDER: readonly (keyof TradeGoodsCategories)[] = ['surowce', 'technologie', 'inne'];

/** Niezależny stan rozwinięcia kategorii per karta (przetrwa re-render audiencji). */
const goodsCatExpanded: Record<GoodsAccordionSide, Set<string>> = {
  player: new Set(),
  other: new Set(),
};

function goodsCategoriesHtml(cats: TradeGoodsCategories | undefined, side: GoodsAccordionSide): string {
  if (!cats) {
    return '<div class="da-goods-empty">Brak danych o dobrach</div>';
  }
  let html = '<div class="da-goods-acc" data-goods-side="' + side + '">';
  for (const key of GOODS_CAT_ORDER) {
    const items = cats[key];
    const isEmpty = items.length === 0;
    const expanded = goodsCatExpanded[side].has(key);
    const hdrCls = 'da-goods-cat-hdr' + (isEmpty ? ' is-empty' : '') + (expanded ? ' is-open' : '');
    const bodyCls = 'da-goods-cat-body' + (expanded ? '' : ' is-collapsed');
    const pills = isEmpty
      ? '<span class="da-goods-cat-none">—</span>'
      : items.map(g => '<span class="da-good">' + esc(g) + '</span>').join('');
    html +=
      '<div class="da-goods-cat">' +
        '<button type="button" class="' + hdrCls + '" data-goods-cat="' + key + '">' +
          '<span class="da-goods-cat-chevron">▸</span>' +
          esc(GOODS_CAT_LABELS[key]) +
          (isEmpty ? '' : ' <span class="da-goods-cat-count">(' + items.length + ')</span>') +
        '</button>' +
        '<div class="' + bodyCls + '"><div class="da-goods">' + pills + '</div></div>' +
      '</div>';
  }
  html += '</div>';
  return html;
}

/** Imię władcy gracza (civs.json wodzowie) pod nazwą cywilizacji, pusty string gdy brak. */
function playerLeaderHtml(st: DiplomacyAudienceState): string {
  const name = st.playerWodz ?? leaderName(st.playerIkonaId, st.playerEra ?? 1);
  return name ? '<div class="da-civleader">' + esc(name) + '</div>' : '';
}

/** Imię władcy rozmówcy (civs.json wodzowie) pod nazwą cywilizacji, pusty string gdy brak. */
function otherLeaderHtml(st: DiplomacyAudienceState): string {
  const name = st.otherWodz ?? leaderName(st.otherIkonaId, st.otherEra ?? 1);
  return name ? '<div class="da-civleader">' + esc(name) + '</div>' : '';
}

/** FAZA 2 pkt 1 — LEWA karta (gracz): medalion, atrybuty, reputacja, skarbiec, dobra handlowe. */
function playerCardHtml(st: DiplomacyAudienceState, playerBon: readonly CivBonusLite[]): string {
  const maxPower = Math.max(st.playerPower ?? 0, st.otherPower ?? 0, 1);
  const powerPct = ((st.playerPower ?? 0) / maxPower) * 100;
  const potencjal = st.sojuszPotencjal;
  const skarbiec = st.playerSkarbiec ?? 0;
  const dochod = st.playerZlotoPerTura;
  return (
    '<div class="da-card you">' +
      '<div class="da-portrait">' +
        civLeaderMedallionHtmlById(st.playerIkonaId ?? 'rzymianie', st.playerKolorHex, st.playerEra) +
        civNameHtml(st.playerCivName, st.playerIkonaId, st.playerIkonaId) +
        playerLeaderHtml(st) +
        '<div class="da-civtitle-row">' +
          '<div class="da-civtitle">' + esc(st.playerTitle) + '</div>' +
          (st.playerWiarygodnosc !== undefined
            ? wiarygodnoscBadgeHtml(st.playerWiarygodnosc, st.playerWiarygodnoscRozbicie)
            : '') +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Atrybuty</div>' +
        attrBarHtml('Moc militarna', String(st.playerPower ?? 0), powerPct, 'you') +
        (potencjal ? attrBarHtml('Potencjał sojuszniczy', potencjal.label, potencjal.pct, 'gold') : '') +
      '</div>' +
      (st.playerWiarygodnosc !== undefined
        ? '<div>' +
            '<div class="da-sec-title">Reputacja</div>' +
            credibilityBarHtml(st.playerWiarygodnosc, st.playerWiarygodnoscRozbicie) +
            credibilityBreakdownHtml(st.playerWiarygodnoscBreakdown, st.playerWiarygodnoscRozbicie) +
          '</div>'
        : '') +
      '<div>' +
        '<div class="da-sec-title">Skarbiec</div>' +
        '<div class="da-attr-row"><span>Pieniądz (¤)</span><span class="v">' + skarbiec + '</span></div>' +
        (dochod !== undefined
          ? '<div class="da-attr-row"><span>Dochód</span><span class="v">' + (dochod >= 0 ? '+' : '') + dochod + ' / turę</span></div>'
          : '') +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Dobra handlowe</div>' +
        goodsCategoriesHtml(st.playerGoodsCats, 'player') +
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
  const atWar = audienceAtWar(st);
  const relScores = effectiveNastawienieScores(st.zaufanie, st.respekt, atWar);
  return (
    '<div class="da-card them">' +
      (cfg?.onFocusCapital ? dipCapitalLocateBtnHtml() : '') +
      '<div class="da-portrait">' +
        civLeaderMedallionHtmlById(st.otherIkonaId ?? 'grecy', st.otherKolorHex, st.otherEra, st.otherIsCityState) +
        civNameHtml(st.otherCivName, st.otherIkonaId, st.otherIkonaId) +
        otherLeaderHtml(st) +
        '<div class="da-civtitle-row">' +
          '<div class="da-civtitle">' + esc(st.otherTitle) + (st.otherEpochLabel ? ' · ' + esc(st.otherEpochLabel) : '') + '</div>' +
          (st.otherWiarygodnosc !== undefined
            ? wiarygodnoscBadgeHtml(st.otherWiarygodnosc, st.otherWiarygodnoscRozbicie)
            : '') +
        '</div>' +
        stanceBadgeHtml(st) +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Atrybuty</div>' +
        attrBarHtml('Moc militarna', String(st.otherPower ?? 0), powerPct, 'them') +
        (potencjal ? attrBarHtml('Potencjał sojuszniczy', potencjal.label, potencjal.pct, 'gold') : '') +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Relacje z Tobą</div>' +
        progressBarHtml('Zaufanie', relScores.zaufanie, 100, undefined, 'trust', st.zaufanieDeltaPerTurn) +
        progressBarHtml('Respekt', relScores.respekt, 100, RESPEKT_TOOLTIP_PL, 'respect') +
        relacjaTotalHtml(st) +
      '</div>' +
      '<div>' +
        '<div class="da-sec-title">Dobra handlowe</div>' +
        goodsCategoriesHtml(st.otherGoodsCats, 'other') +
      '</div>' +
      cultureLineHtml(st) +
      personalityTagsHtml(st.personalityTags) +
      bonusListHtml(otherBon) +
    '</div>'
  );
}

/** Suma Zaufanie + Respekt (0–200) — widoczna w panelu relacji audiencji. */
function relacjaTotalHtml(st: DiplomacyAudienceState): string {
  const relTotal = st.relacjaTotal ?? (st.zaufanie + st.respekt);
  const pct = Math.max(0, Math.min(100, Math.round((relTotal / 200) * 100)));
  const tip = ' title="' + esc(
    'Relacja = Zaufanie + Respekt (0–200). Punkt balansu: 100. '
    + 'Wpływa na wymagane PW traktatów (±90%) i fair-min wymiany.',
  ) + '"';
  return (
    '<div class="da-rel-row relacja-total"' + tip + '>'
    + '<span>Relacja</span>'
    + '<span class="v">' + relTotal + ' / 200' + formatPerTurnDelta(st.relacjaDeltaPerTurn) + '</span>'
    + '<span class="da-rel-sum-hint">(Zaufanie + Respekt)</span>'
    + '</div>'
    + '<div class="da-rbar relacja-total"><i style="width:' + pct + '%"></i></div>'
  );
}

function formatPerTurnDelta(delta: number | undefined): string {
  if (delta === undefined || !Number.isFinite(delta) || delta === 0) return '';
  const sign = delta > 0 ? '+' : '';
  const val = Number.isInteger(delta) ? String(delta) : delta.toFixed(1);
  return ' <span class="da-per-turn">' + sign + val + ' / turę</span>';
}

function progressBarHtml(
  label: string,
  value: number,
  max: number,
  tooltip?: string,
  kind?: 'trust' | 'respect',
  perTurnDelta?: number,
): string {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const tip = tooltip ? ' title="' + esc(tooltip) + '"' : '';
  const rowCls = kind ? 'da-rel-row ' + kind : 'da-rel-row';
  const barCls = kind ? 'da-rbar ' + kind : 'da-rbar';
  return (
    '<div class="' + rowCls + '"' + tip + '><span>' + esc(label) + '</span><span class="v">' + value + ' / ' + max + formatPerTurnDelta(perTurnDelta) + '</span></div>' +
    '<div class="' + barCls + '"><i style="width:' + pct + '%"></i></div>'
  );
}

/** Pasek globalnej Wiarygodności gracza (−100…+100) — skala bipolarna jak Zaufanie/Respekt u rozmówcy. */
function credibilityBarHtml(value: number, rozbicie?: WiarygodnoscRozbicie): string {
  const w = Math.round(Math.max(-100, Math.min(100, value)));
  const pct = Math.round(((w + 100) / 200) * 100);
  const signed = w > 0 ? '+' + w : String(w);
  const band = wiarygodnoscLabelPl(w);
  const tipBody = rozbicie
    ? wiarygodnoscTooltipDefPl() + ' ' + wiarygodnoscTooltipRozbiciePl(rozbicie, band)
    : wiarygodnoscTooltipPl();
  const tip = ' title="' + esc(tipBody) + '"';
  const hint = rozbicie && (rozbicie.trwalyZyciorys !== 0 || rozbicie.biezaceUczynki !== 0)
    ? '<div class="da-credibility-hint">życiorys '
      + formatCredibilityHintPkt(rozbicie.trwalyZyciorys)
      + ' · bieżące '
      + formatCredibilityHintPkt(rozbicie.biezaceUczynki)
      + '</div>'
    : '';
  return (
    '<div class="da-rel-row credibility"' + tip + '><span>Wiarygodność</span><span class="v">' + signed + ' · ' + esc(band) + '</span></div>' +
    '<div class="da-rbar credibility"><i style="width:' + pct + '%"></i></div>' +
    hint
  );
}

function formatCredibilityHintPkt(v: number): string {
  const rounded = Math.round(v * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  const body = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace('.', ',');
  return sign + body;
}

function credibilityBreakdownHtml(
  breakdown?: WiarygodnoscBreakdown,
  rozbicie?: WiarygodnoscRozbicie,
): string {
  if (!breakdown) return '';
  const fmtVal = (v: number, perTurn?: boolean): string => {
    const rounded = Math.round(v * 10) / 10;
    const sign = rounded > 0 ? '+' : '';
    const body = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
    return sign + body + (perTurn ? ' / turę' : '');
  };
  const rows: string[] = [];
  for (const f of breakdown.pozytywne) {
    rows.push(
      '<div class="da-rfact"><span class="lbl">' + esc(f.label) + '</span>'
      + '<span class="val" style="color:#7ad0a0">' + fmtVal(f.value, f.perTurn) + '</span></div>',
    );
  }
  for (const f of breakdown.negatywne) {
    rows.push(
      '<div class="da-rfact"><span class="lbl">' + esc(f.label) + '</span>'
      + '<span class="val" style="color:#e08a8a">' + fmtVal(f.value, f.perTurn) + '</span></div>',
    );
  }
  if (rows.length === 0) {
    rows.push('<div class="da-empty" style="padding:4px 8px">Brak zdarzeń — tylko start.</div>');
  }
  const foot = rozbicie
    ? 'Suma składowych (przed klamrą): <b>'
      + formatCredibilityHintPkt(rozbicie.startowa + rozbicie.trwalyZyciorys + rozbicie.biezaceUczynki)
      + '</b> · klamra: <b>' + formatCredibilityHintPkt(rozbicie.razem) + '</b>'
    : '';
  return (
    '<div class="da-credbreak">' +
      '<div class="da-credbreak-h">Rejestr Wiarygodności</div>' +
      rows.join('') +
      (foot ? '<div class="da-credbreak-foot">' + foot + '</div>' : '') +
    '</div>'
  );
}

/** Ikona kafelka „Możliwe umowy" — dopasowana per id akcji (data/diplomacy.json akcje_dyplomatyczne). */
function actionIconId(id: string): string {
  switch (id) {
    case '2': return 'dip-pact';
    case '3': return 'dip-alliance';
    case '5': return 'cp-trade';
    case '14': return 'cp-trade';
    case '6': return 'tb-science';
    case '8': return 'res-treasury';
    case '9': return 'chip-warning';
    case '10': return 'dip-peace';
    case '11': return 'dip-war';
    case '12': return 'tb-army';
    case '15': return 'tb-army';
    case '13': return 'res-culture';
    default: return 'tb-diplomacy';
  }
}

/** Ikona traktatu w kolumnie „Aktywne traktaty" — dopasowana per treść etykiety (treatyDisplayLabel). */
function treatyIconId(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('sojusz')) return 'dip-alliance';
  if (l.includes('nieagresji')) return 'dip-pact';
  if (l.includes('szlak')) return 'cp-trade';
  if (l.includes('wymian')) return 'cp-trade';
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
  { svg: 'trade', aid: '5', label: TRAKTAT_HANDLOWY_LABEL },
  { svg: 'trade', aid: '14', label: 'Umowa wymiany' },
  { svg: 'gift', aid: '13', label: 'Przekaż dar' },
  { svg: 'vassal', aid: '12', label: 'Wasalizacja' },
  { svg: 'vassal', aid: '15', label: 'Wchłonięcie' },
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
    const isLocked = action ? (action.locked || !action.enabled) : true;
    const tip = enabled ? spec.label : (action?.lockNote || (isLocked ? action?.tooltip : undefined) || spec.label);
    const lockNote = audienceActionBarLockNote(action);
    const cls = 'da-abtn' + (spec.extraCls ? ' ' + spec.extraCls : '');
    const btn =
      '<span class="da-ttip"><span class="da-ttip-lbl">' + esc(spec.label) + '</span>' +
      '<button type="button" class="' + cls + '" data-aid="' + esc(spec.aid) + '"' +
      (enabled ? '' : ' disabled') + ' title="' + esc(tip) + '">' + ACTION_BAR_SVG[spec.svg] + '</button>' +
      '</span>';
    return (
      '<span class="da-abtn-cell">' + btn +
      (lockNote ? '<span class="da-abtn-note" title="' + esc(lockNote) + '">' + esc(lockNote) + '</span>' : '') +
      '</span>'
    );
  }).join('');

  const handel = byId.get('14');
  const handelEnabled = handel ? handel.enabled : false;
  const qdTitle = handelEnabled ? 'auto-uczciwa wymiana' : (handel?.lockNote || handel?.tooltip || 'Wymiana niedostępna');
  const qdLockNote = handelEnabled ? '' : audienceActionBarLockNote(handel);
  const quickdealBtn =
    '<button type="button" class="da-quickdeal"' + (handelEnabled ? '' : ' disabled') +
    ' title="' + esc(qdTitle) + '">' + ACTION_BAR_SVG.quickdeal +
    '<span>SZYBKA WYMIANA<small>auto-uczciwa oferta</small></span></button>';
  const quickdeal =
    '<span class="da-abtn-cell">' + quickdealBtn +
    (qdLockNote ? '<span class="da-abtn-note" title="' + esc(qdLockNote) + '">' + esc(qdLockNote) + '</span>' : '') +
    '</span>';

  return '<div class="da-actionbar">' + btns + quickdeal + '</div>';
}

/** FAZA 2 pkt 3 kol.1 (lewo) — „Możliwe umowy" (12 akcji; bez „Nawiązanie kontaktu" gdy kontakt jest). */
function dealsColumnHtml(st: DiplomacyAudienceState): string {
  const visible = st.actions.filter(a => a.id !== '1');
  const ownOnTable = new Set(
    (st.pendingNegotiations ?? []).filter(r => r.direction === 'own').map(r => r.uiActionId),
  );
  const ownPendingCount = (st.pendingNegotiations ?? []).filter(r => r.direction === 'own').length;
  const items = visible.map(a => {
    const onTable = ownOnTable.has(a.id);
    const isLocked = a.locked || !a.enabled || a.active === true || onTable;
    let cls = isLocked ? 'da-deal locked' : 'da-deal';
    if (a.active) cls += ' active';
    if (onTable) cls += ' on-table';
    const statusNote = audienceActionStatusNote(a, onTable);
    const lockReason = a.lockNote || (isLocked && a.tooltip ? a.tooltip : '');
    const hoverTip = onTable
      ? 'Ta umowa już leży na stole negocjacji — użyj Przyjmij przy panelu PW lub Odrzuć, aby wycofać'
      : a.active
        ? 'Umowa już zawarta'
        : (a.opis || lockReason || a.tooltip || a.label);
    const icon = dipBrandIconHtml(actionIconId(a.id), 14, 'da-di');
    const endIc = a.active
      ? dipBrandIconHtml('ui-check', 13, 'da-checkic')
      : (isLocked ? dipBrandIconHtml('ui-lock', 12, 'da-lockic') : '');
    return (
      '<button type="button" class="' + cls + '" data-aid="' + esc(a.id) + '"' +
      ' title="' + esc(hoverTip) + '"' +
      (isLocked ? ' disabled' : '') + '>' +
      icon +
      '<div class="da-body"><div class="da-nm">' + esc(a.label) + '</div>' +
      (statusNote ? '<div class="da-note">' + esc(statusNote) + '</div>' : '') +
      '</div>' + endIc +
      '</button>'
    );
  }).join('');
  const multiHint = ownPendingCount > 0
    ? '<div class="da-multi-deal-hint">Na stole: <b>' + ownPendingCount
      + '</b> · dodaj kolejną umowę z listy · jeden bilans PW — jedno Przyjmij/Odrzuć; niechcianą pozycję najpierw Usuń</div>'
    : '';
  return (
    '<div class="da-col da-col-deals">' +
      '<h3>Możliwe umowy<span class="cnt">' + visible.length + '</span></h3>' +
      (items || '<div class="da-empty">Brak dostępnych akcji.</div>') +
      multiHint +
    '</div>'
  );
}

/** FAZA 2 pkt 3 kol.4 (prawo) — „Aktywne traktaty" (od ilu tur + kara zerwania + „Zerwij" — zaległość #2). */
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

/** Meta wspólna dla karty oczekującej negocjacji (ważność; runda tylko po kontrofercie). */
function pendingNegotiationMetaHtml(r: PendingNegotiationRow): string {
  const expLabel = r.expiresInTurns <= 0
    ? 'wygasa w tej turze'
    : `wygasa za ${r.expiresInTurns} ${r.expiresInTurns === 1 ? 'turę' : 'tur'}`;
  const tooltip =
    'Brak odpowiedzi — propozycja wygasa. Do '
    + r.maxRounds
    + ' rund negocjacji (kontrofert); potem tylko Przyjmij lub Odrzuć.';
  const visible = r.round > 1
    ? `Kontroferta ${r.round}/${r.maxRounds} · ${expLabel}`
    : expLabel;
  return '<div class="da-meta" title="' + esc(tooltip) + '">' + esc(visible) + '</div>';
}

/** Fallback tekstowy gdy brak dealPayload. */
function pendingDealFallbackHtml(r: PendingNegotiationRow): string {
  if (!r.dealDetails && !r.summary) return '';
  return '<div class="da-deal-detail da-deal-plain">' + esc(r.dealDetails || r.summary) + '</div>';
}

/** Etykieta traktatu dwustronnego — gdy mode=treaty i brak pozycji koszyka. */
function bilateralTreatyLabel(r: PendingNegotiationRow): string | undefined {
  const mode = r.acceptanceMy?.mode ?? r.acceptanceTheir?.mode;
  if (mode === 'treaty' || mode === 'mixed') return r.actionLabel;
  return undefined;
}

/** HTML jednej strony dealu — wyłącznie przedmiot (koszyk lub traktat). */
function tableDealSideHtml(
  r: PendingNegotiationRow,
  focus: 'we' | 'they',
  incoming: boolean,
): string {
  if (!r.dealPayload) return '';
  const treatyLabel = bilateralTreatyLabel(r);
  const treatyBasePw = treatyLabel
    ? (r.acceptanceMy?.treatyBasePn ?? r.acceptanceTheir?.treatyBasePn)
    : undefined;
  const treatyPw = treatyLabel
    ? (focus === 'we'
      ? playerTreatyDisplayPw(r.acceptanceMy) ?? bilateralTreatyDisplayPw(r.acceptanceMy, r.acceptanceTheir)
      : partnerTreatyDisplayPw(r.acceptanceTheir) ?? treatyBasePw)
    : undefined;
  const showBasePw = focus === 'we' ? treatyBasePw : undefined;
  return renderNegotiationTableDealSideHtml(
    r.dealPayload,
    focus,
    incoming,
    treatyLabel,
    treatyPw,
    showBasePw,
  );
}

/** Panel PN między kolumnami My / Oni — pakiet całego stołu (R-DYPLO-STOL-ACCEPT). */
function negotiationBalanceBarHtml(st: DiplomacyAudienceState): string {
  const rows = st.pendingNegotiations ?? [];
  const data = balancePanelDataFromRows(rows);
  return renderPnBalancePanelHtml(data);
}

/** Przyciski Edytuj / Usuń na karcie pozycji stołu (bez stepperów na karcie). */
function negotiationCardActionsHtml(r: PendingNegotiationRow): string {
  const showEdit = !!r.canCounter && actionUsesTradeBasket(r.uiActionId);
  let html = '<div class="da-card-actions">';
  if (showEdit) {
    html += '<button type="button" data-negot-id="' + esc(r.id) + '" data-negot-act="edit" data-negot-aid="'
      + esc(r.uiActionId) + '">Edytuj</button>';
  }
  html += '<button type="button" class="da-rm-negot" data-negot-id="' + esc(r.id)
    + '" data-negot-act="remove">Usuń</button>';
  html += '</div>';
  return html;
}

/** Karta wychodzącej propozycji gracza — kolumna „My oferujemy" (tylko przedmiot dealu). */
function renderOwnPendingCard(r: PendingNegotiationRow): string {
  const dealHtml = r.dealPayload ? tableDealSideHtml(r, 'we', false) : '';
  const dealBlock = dealHtml
    ? '<div class="da-deal-detail">' + dealHtml + '</div>'
    : pendingDealFallbackHtml(r);
  return (
    '<div class="da-negot">' +
      '<div class="da-nm"><span class="dir">' + esc('Twoja propozycja') + '</span>' + esc(r.actionLabel) + '</div>' +
      dealBlock +
      pendingNegotiationMetaHtml(r) +
      negotiationCardActionsHtml(r) +
    '</div>'
  );
}

/** Lewa kolumna — nasza strona linked dealu AI (co oddajemy / „My oferujemy"). */
function renderIncomingPendingWeLinked(r: PendingNegotiationRow): string {
  const dealHtml = r.dealPayload ? tableDealSideHtml(r, 'we', true) : '';
  const dealBlock = dealHtml
    ? '<div class="da-deal-detail">' + dealHtml + '</div>'
    : '<div class="da-deal-detail"><span class="da-deal-empty">—</span></div>';
  const editCls = r.canCounter ? ' can-edit' : '';
  const editHint = r.canCounter
    ? '<div class="da-negot-edit-hint" title="Edytuj kwoty w koszyku">Użyj Edytuj, aby zmienić ilości w koszyku</div>'
    : '';
  return (
    '<div class="da-negot da-negot-linked da-negot-linked-we' + editCls + '" data-negot-id="' + esc(r.id) + '" data-negot-linked="we"'
    + (r.canCounter ? ' data-negot-editable="1"' : '') + '>' +
      '<div class="da-nm"><span class="dir">' + esc('W ofercie oddajemy') + '</span>' + esc(r.actionLabel) + '</div>' +
      dealBlock +
      editHint +
      pendingNegotiationMetaHtml(r) +
      negotiationCardActionsHtml(r) +
    '</div>'
  );
}

/** Prawa kolumna — ich strona linked dealu AI (tylko przedmiot dealu). */
function renderIncomingPendingTheyCard(r: PendingNegotiationRow): string {
  const dirIcon = dipBrandIconHtml('chip-warning', 11, 'da-dir-ic');
  const legacyAccess = r.dealPayload != null && proposalHasResourceAccess(r.dealPayload);
  const dealHtml = r.dealPayload ? tableDealSideHtml(r, 'they', true) : '';
  const dealBlock = dealHtml
    ? '<div class="da-deal-detail">' + dealHtml + '</div>'
    : pendingDealFallbackHtml(r);
  const legacyNote = legacyAccess
    ? '<div class="da-meta da-legacy-access">' + esc(RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON) + '</div>'
    : '';
  const giftCls = r.isGift ? ' da-negot-gift' : '';
  const dirLabel = r.isGift ? 'Prezent od nich' : 'Ich propozycja';
  const titleLabel = r.isGift ? 'Dar / prezent' : r.actionLabel;
  const editCls = r.canCounter && !r.isGift ? ' can-edit' : '';
  const editHint = r.canCounter && !r.isGift
    ? '<div class="da-negot-edit-hint" title="Edytuj kwoty w koszyku">Użyj Edytuj, aby zmienić ilości w koszyku</div>'
    : '';
  return (
    '<div class="da-negot incoming da-negot-linked da-negot-linked-they' + giftCls + editCls + '" data-negot-id="' + esc(r.id) + '" data-negot-linked="they"'
    + (r.canCounter && !r.isGift ? ' data-negot-editable="1"' : '') + '>' +
      '<div class="da-nm"><span class="dir">' + dirIcon + esc(dirLabel) + '</span>' + esc(titleLabel) + '</div>' +
      dealBlock +
      legacyNote +
      editHint +
      pendingNegotiationMetaHtml(r) +
      negotiationCardActionsHtml(r) +
    '</div>'
  );
}

/** Prawa kolumna — ich strona własnej propozycji gracza (symetria traktatu dwustronnego). */
function renderOwnPendingTheyCard(r: PendingNegotiationRow): string {
  const dealHtml = r.dealPayload ? tableDealSideHtml(r, 'they', false) : '';
  const dealBlock = dealHtml
    ? '<div class="da-deal-detail">' + dealHtml + '</div>'
    : pendingDealFallbackHtml(r);
  return (
    '<div class="da-negot da-negot-linked da-negot-linked-they own-outgoing" data-negot-id="' + esc(r.id) + '">' +
      '<div class="da-nm"><span class="dir">' + esc('Oni oferują') + '</span>' + esc(r.actionLabel) + '</div>' +
      dealBlock +
      pendingNegotiationMetaHtml(r) +
      negotiationCardActionsHtml(r) +
    '</div>'
  );
}

/** FAZA 2 pkt 3 kol.2 — „My oferujemy": wyłącznie nasze propozycje na stole (bez katalogu akcji). */
function offersColumnHtml(st: DiplomacyAudienceState): string {
  const ownPending = (st.pendingNegotiations ?? []).filter(r => r.direction === 'own');
  /** Przy darze/prezencie (My puste) — bez karty „Umowa wymiany" po stronie My. */
  const incomingWeLinked = (st.pendingNegotiations ?? []).filter(
    r => r.direction === 'incoming' && !r.isGift,
  );
  const pendingCards = ownPending.map(r => renderOwnPendingCard(r)).join('')
    + incomingWeLinked.map(r => renderIncomingPendingWeLinked(r)).join('');
  const emptyPending = ownPending.length === 0 && incomingWeLinked.length === 0
    ? '<div class="da-empty">Brak naszych ofert.</div>'
    : '';
  return (
    '<div class="da-col da-col-offers">' +
      '<h3>My oferujemy<span class="cnt">' + (ownPending.length + incomingWeLinked.length) + '</span></h3>' +
      pendingCards +
      emptyPending +
    '</div>'
  );
}

/**
 * R-DYPLO-STOL-ACCEPT-Q1=A — jeden pasek Przyjmij/Odrzuć dla całego pakietu na stole.
 */
function negotiationActionBarHtml(st: DiplomacyAudienceState): string {
  const rows = filterActionableNegotiationRows(st.pendingNegotiations ?? []);
  if (rows.length === 0) return '<div class="da-negot-actionbar"></div>';

  const panel = balancePanelDataFromRows(st.pendingNegotiations ?? []);
  const canAccept = panel?.canAccept !== false && rows.every(r => {
    if (r.direction === 'incoming') return r.canAccept !== false;
    if (r.awaitingAiResponse) {
      return r.responderPreview?.accepted !== false
        && (r.acceptanceTheir?.accepted !== false);
    }
    return true;
  });
  const acceptTitle = !canAccept
    ? esc(panel?.responderPreview?.reason ?? 'Warunki pakietu niespełnione')
    : '';

  return (
    '<div class="da-negot-actionbar da-negot-actionbar--package">'
    + '<div class="da-neg-act-label">Decyzja dla całego pakietu (' + rows.length + ')</div>'
    + '<div class="da-btnrow">'
    + '<button type="button" class="acc"' + (!canAccept ? ' disabled title="' + acceptTitle + '"' : '')
    + ' data-negot-act="accept-package">Przyjmij</button>'
    + '<button type="button" class="rej" data-negot-act="reject-package">Odrzuć</button>'
    + '</div>'
    + '<div class="da-package-hint">Jeden bilans PW — jedno Przyjmij/Odrzuć; niechcianą pozycję najpierw Usuń</div>'
    + '</div>'
  );
}

/**
 * C-DYP-Q1=B — kolumna „Oni oferują": wyłącznie przychodzące propozycje AI (direction='incoming'),
 * wymagające decyzji gracza TERAZ (Przyjmij/Odrzuć/Kontruj).
 */
function incomingOffersColumnHtml(st: DiplomacyAudienceState): string {
  const incoming = (st.pendingNegotiations ?? []).filter(r => r.direction === 'incoming');
  const ownAwaitingAi = (st.pendingNegotiations ?? []).filter(r => r.direction === 'own' && r.awaitingAiResponse);
  const rows = [
    ...incoming.map(r => renderIncomingPendingTheyCard(r)),
    ...ownAwaitingAi.map(r => renderOwnPendingTheyCard(r)),
  ];
  const count = incoming.length + ownAwaitingAi.length;
  return (
    '<div class="da-col da-col-negot">' +
      '<h3>Oni oferują<span class="cnt">' + count + '</span></h3>' +
      (rows.join('') || '<div class="da-empty">Brak ofert od nich.</div>') +
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
  const atWar = audienceAtWar(st);
  const relScores = effectiveNastawienieScores(st.zaufanie, st.respekt, atWar);
  const label = nastawienieLabelFromScore(st.zaufanie, st.respekt, { atWar });
  return (
    '<div class="da-relbreak">' +
      '<div class="da-relcol pos"><h4>Za co Cię lubią</h4>' + posRows + '</div>' +
      '<div class="da-relcol neg"><h4>Za co Cię nie lubią</h4>' + negRows + '</div>' +
      '<div class="da-relbreak-foot">Stan bieżący: <b>Relacja '
        + (st.relacjaTotal ?? (st.zaufanie + st.respekt)) + ' / 200</b> · '
        + '<b>Zaufanie ' + relScores.zaufanie + ' / 100</b> · '
        + '<b>Respekt ' + relScores.respekt + ' / 100</b> · nastawienie: <b>' + esc(label) + '</b></div>' +
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
  const hasNext = cfg.hasNextOpenProposal?.() === true;
  const nextBtn = cfg.onNextOpenProposal
    ? '<button type="button" class="dip-gold-btn civ-diplo-aud-next"' + (hasNext ? '' : ' disabled')
      + ' title="Następna otwarta propozycja w kolejce">Następne</button>'
    : '';

  rootEl.innerHTML =
    '<div class="civ-diplo-aud-box">' +
      '<div class="civ-diplo-aud-head">' +
        '<h2>' + headIc + 'Audiencja dyplomatyczna</h2>' +
        '<div class="civ-diplo-aud-head-btns">' +
          nextBtn +
          '<button type="button" class="dip-muted-btn civ-diplo-aud-back">' + esc(cfg!.backLabel ?? 'Wyjście') + '</button>' +
        '</div>' +
      '</div>' +
      formalBannerHtml(st) +
      '<div class="da-mainrow">' +
        playerCardHtml(st, playerBon) +
        '<div class="da-center">' +
          '<div class="da-tabs">' + knownFactionsTab +
            '<span class="da-tab on">' + dipBrandIconHtml('tb-diplomacy', 12) + 'Stół negocjacji</span>' +
          '</div>' +
          '<div class="da-table-area">' +
            dealsColumnHtml(st) + offersColumnHtml(st) + incomingOffersColumnHtml(st) + treatiesColumnHtml(st) +
            negotiationBalanceBarHtml(st) +
            negotiationActionBarHtml(st) +
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
    atWar: negCtx.atWar ?? audienceAtWar(st),
  });

  rootEl.querySelector('.civ-diplo-aud-back')?.addEventListener('click', () => cfg!.onBack());
  rootEl.querySelector('.civ-diplo-aud-next')?.addEventListener('click', () => {
    if (cfg?.hasNextOpenProposal?.() !== true) return;
    cfg.onNextOpenProposal?.();
  });
  rootEl.querySelector('.da-tab-known')?.addEventListener('click', () => cfg!.onOpenKnownFactions?.());
  rootEl.querySelector('.dip-capital-locate')?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (cfg === null) return;
    cfg.onFocusCapital?.(cfg.ownerId);
  });
  rootEl.querySelectorAll<HTMLButtonElement>('.da-goods-cat-hdr').forEach(btn => {
    btn.addEventListener('click', () => {
      const acc = btn.closest('.da-goods-acc');
      const side = acc?.getAttribute('data-goods-side') as GoodsAccordionSide | null;
      const cat = btn.getAttribute('data-goods-cat');
      if (!side || !cat) return;
      const set = goodsCatExpanded[side];
      const body = btn.nextElementSibling;
      if (set.has(cat)) {
        set.delete(cat);
        btn.classList.remove('is-open');
        body?.classList.add('is-collapsed');
      } else {
        set.add(cat);
        btn.classList.add('is-open');
        body?.classList.remove('is-collapsed');
      }
    });
  });
  rootEl.querySelectorAll<HTMLButtonElement>('button[data-aid]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const aid = btn.getAttribute('data-aid');
      if (!aid || cfg === null) return;

      const action = st.actions.find(a => a.id === aid);
      if (action?.active) return;
      if (action && action.enabled && cfg.getNegotiationContext) {
        const negCtx = cfg.getNegotiationContext(aid);
        if (negCtx && actionUsesTradeBasket(aid)) {
          if (blockDuplicateNegotiationClick(st, aid, mergeBasketCtx)) return;
          showTradeBasketModal(
            getTradeBasketMode(aid),
            action,
            mergeBasketCtx(negCtx),
            (payload) => cfg!.onAction(cfg!.ownerId, aid, payload),
            () => { /* anulowano */ },
          );
          return;
        }
        if (aid === '5' && negCtx) {
          if (blockDuplicateNegotiationClick(st, aid, mergeBasketCtx)) return;
          // D-DYPLO-KOSZYK-OD-RAZU: traktat handlowy od razu na stół („My oferujemy"), bez modala potwierdzenia.
          cfg!.onAction(cfg!.ownerId, '5', { actionId: '5', turns: 20 });
          return;
        }
        if (action && action.enabled && actionNeedsNegotiation(aid) && negCtx) {
          if (blockDuplicateNegotiationClick(st, aid, mergeBasketCtx)) return;
          showNegotiationModal(
            action,
            mergeBasketCtx(negCtx),
            (payload) => cfg!.previewNegotiation
              ? cfg!.previewNegotiation(cfg!.ownerId, payload)
              : { accepted: true },
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
    const handel = st.actions.find(a => a.id === '14');
    if (!handel || !handel.enabled || !cfg.getNegotiationContext) return;
    const negCtx = cfg.getNegotiationContext('14');
    if (!negCtx) return;
    openQuickDealBasket(
      handel,
      mergeBasketCtx(negCtx),
      (payload) => cfg!.onAction(cfg!.ownerId, '14', payload),
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
        cfg.previewBreakTreatyPenalties?.(dealId),
        () => { cfg!.onBreakTreaty?.(dealId); },
      );
    });
  });

  /**
   * C-DYP-Q1=A (2026-07-26) — stół negocjacyjny: Przyjmij/Odrzuć trafiają wprost do
   * SILNIKU; Kontruj otwiera TEN SAM formularz negocjacji (showNegotiationModal) co
   * świeża propozycja — submit woła onCounterNegotiation zamiast onAction (nowe
   * warunki NADPISUJĄ poprzednie na tym samym wpisie stołu, nie tworzą nowego).
   */
  rootEl.querySelectorAll<HTMLButtonElement>('[data-negot-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (cfg === null || btn.disabled) return;
      const act = btn.getAttribute('data-negot-act');
      if (!act) return;

      if (act === 'accept-package') {
        cfg.onAcceptNegotiationPackage?.();
        return;
      }
      if (act === 'reject-package') {
        cfg.onRejectNegotiationPackage?.();
        return;
      }

      const negotId = btn.getAttribute('data-negot-id');
      if (!negotId) return;

      if (act === 'accept') { cfg.onAcceptNegotiation?.(negotId); return; }
      if (act === 'reject') { cfg.onRejectNegotiation?.(negotId); return; }
      if (act === 'remove') { cfg.onRemoveNegotiation?.(negotId); return; }
      if (act === 'edit' || act === 'counter') {
        const aid = btn.getAttribute('data-negot-aid');
        if (!aid) return;
        const row = (st.pendingNegotiations ?? []).find(r => r.id === negotId);
        if (!row) return;
        openCounterNegotiationModal(st, row, mergeBasketCtx);
      }
    });
  });

  /** Klik w kartę przychodzącej propozycji → ten sam koszyk co Kontruj (edycja obu stron). */
  rootEl.querySelectorAll<HTMLElement>('.da-negot-linked[data-negot-editable="1"]').forEach(card => {
    card.addEventListener('click', (ev) => {
      if (cfg === null) return;
      const target = ev.target as HTMLElement | null;
      if (target?.closest('button')) return;
      const negotId = card.getAttribute('data-negot-id');
      if (!negotId) return;
      const row = (st.pendingNegotiations ?? []).find(r => r.id === negotId);
      if (!row?.canCounter) return;
      openCounterNegotiationModal(st, row, mergeBasketCtx);
    });
  });

  if (pendingAutoCounterNegotiationId) {
    const autoId = pendingAutoCounterNegotiationId;
    pendingAutoCounterNegotiationId = null;
    const autoRow = (st.pendingNegotiations ?? []).find(r => r.id === autoId);
    if (autoRow?.canCounter) {
      openCounterNegotiationModal(st, autoRow, mergeBasketCtx);
    }
  }
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
  pushOverlay('diplo-audience', handleAudienceEscape);
  startDiplomacyMusic(config.otherCivId);
  notifyDiploUiVisibilityChange();
}

export function updateDiplomacyAudience(): void {
  render();
}

export function hideDiplomacyAudience(): void {
  popOverlay('diplo-audience');
  if (rootEl !== null) rootEl.style.display = 'none';
  stopDiplomacyMusic();
  notifyDiploUiVisibilityChange();
}

export function isDiplomacyAudienceOpen(): boolean {
  return rootEl !== null && rootEl.style.display !== 'none';
}

export { type NegotiationPayload, type NegotiationModalContext } from './diplomacyNegotiationModal';
export { showTradeBasketModal, hideTradeBasketModal, actionUsesTradeBasket, getTradeBasketMode } from './diplomacyTradeBasket';
export { showDiplomacyProposalBanner, hideDiplomacyProposalBanner } from './diplomacyProposalBanner';
