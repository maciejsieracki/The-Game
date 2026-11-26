/**
 * diplomacy-proposals.ts — ocena propozycji dyplomatycznych v1.1 (lane CYW).
 * SILNIK/UI wołają evaluateProposal; EKO tick osobno po akceptacji trybutu.
 */
import {
  PEACE_TAIL_ORDER, composePeaceTail, peaceTailPnPerUnit, peaceTailStep, peaceTailLabel,
  peaceTailBasketItems, type PeaceTailItem,
} from './peace-tail-payment';
import { composeTreatyPayment, treatyPaymentLabel, type TreatyPaymentResult } from './treaty-payment';
import { formatTurCountAcc } from '../ui/formatPl';
import {
  aiDiplomacyStance,
  clampRelationForWar,
  diplomacyProposerStrengthEase,
  diplomacyAllianceStrengthAdjust,
  diplomacyAllianceMinZaufanie,
  diplomacyTreatyMinRelacja,
  allianceCoreMet,
  getEffectiveDiplomacyParams,
  relationScore,
  type AIDiplomacyContext,
  type Relation,
} from './diplomacy';
import type { GameDifficulty } from './difficulty-cost';
import type { AIDiplomacyCommand } from './ai';
import {
  addTreaty,
  type ActiveDeal,
  type HandelDealPayload,
  type HandelSurowiecCyklicznyItem,
  type TreatyKind,
  normalizeTreatyKind,
} from './diplomacy-treaties';
import { RodzajTraktatu } from '../types/diplomacy';
import { czyAgresorAktywny, deltaRelacjiSojusz } from './diplomacy';
import { resolveWarPeaceProfile, evaluatePeaceAiGate } from './diplomacy-war-peace-profile';
import type { PeaceMilitaryPosition } from './diplomacy-military-strength';
import { peaceProposalBlocked, PEACE_PROPOSAL_MIN_WAR_TURNS } from './diplomacy-peace-proposal-timing';
import { warWearinessLevel, wearinessPeaceCashPn, peacePwPointsByPowerRatio, type PeacePwPowerSplit, type PeacePowerSplitInfo } from './war-weariness';
import type { Player } from '../types/player';
import { TypCywilizacji } from '../types/player';
import {
  effectiveTreatyPnRequired,
  partnerTreatyPnRequired,
  pnDealAcceptedByAi,
  pnFromLegacyGold,
  pnGiftAllowed,
  proposalPnTurnsMultiplier,
  relationTotal,
  resolveProposalPn,
  type BasketItem,
  type ResolveProposalPnOptions,
} from './diplomacy-pn-engine';
import {
  diplomacyProgDarRelacja, diplomacyFairGivePn, diplomacyNormalizeSurowiecIlosc,
  withDiplomacyTradeEra, diplomacyTradeEra, diplomacyClampQtyToEraBlock, diplomacyPnTech,
} from './diplomacy-value-catalog';
import {
  isCurrencyProposalForbiddenDuringWar,
} from './diplomacy-war-gates';
import acceptancePointsJson from '../../data/diplomacy-acceptance-points.json';
import {
  AI_TRADE_GOLD_MAX,
  AI_TRIBUTE_PEACE_MAX,
  capAiGoldOffer,
} from './diplomacy-economy';
import {
  aiOfferPwSurplusTolerance,
  aiOfferTargetsZeroBalance,
  playerBenefitSurplusByRole,
  trimProposalForZeroBalance,
} from './diplomacy-ai-offer-balance';
import { BARBARIAN_COOPERATION_TURNS } from './diplomacy-barbarian-cooperation';
import { normalizeTruceDuration, TRUCE_DEFAULT_TURNS } from './diplomacy-peace-lock';
import { truceEndSurowceSubstituteCovers } from './diplomacy-truce-end-price';

export { AI_TRADE_GOLD_MAX, AI_TRIBUTE_PEACE_MAX, capAiGoldOffer } from './diplomacy-economy';

// ---------------------------------------------------------------------------
// Typy propozycji (UI → SILNIK → CYW)
// ---------------------------------------------------------------------------

export type ProposalActionId =
  | 'nap'
  | 'sojusz_defensywny'
  | 'sojusz_pelny'
  | 'handel'
  /**
   * E6 (2026-07-23): alias traktatu szlaków — AI (`zaproponuj_umowe_handlowa`) i legacy save.
   * Oceniana w evaluateProposal jak `umowa_szlakow` (ten sam deal UmowaSzlakow).
   */
  | 'umowa_handlowa'
  /** HANDEL-SPLIT-Q1=B: traktat szlaków — gracz lub AI (bez koszyka PN). */
  | 'umowa_szlakow'
  | 'trybut_zadanie'
  | 'trybut_oferta'
  | 'granice'
  | 'tech'
  | 'namow_wojne'
  | 'ultimatum'
  | 'wasal'
  /** R-GRACZ-WCHLONIECIE: wchłonięcie miasta-państwa po wasalu (gracz→MP, v1). */
  | 'wchloniecie'
  /** Zakończenie wojny — stoł negocjacyjny, PN bazowe 500 (Maciej 2026-07-29). */
  | 'pokoj'
  /** R-WEB-TRUCE-Q1: rozejm 5/10/15 tur — te same bramki co pokój, PN baza z acceptance-points. */
  | 'rozejm';

export interface ProposalPayload {
  /** NAP: 10–20 tur (terminowy); 0 lub brak po UI „bezterminowy” → wygasaTura null */
  turns?: number;
  goldPerTurn?: number;
  goldOnce?: number;
  resource?: string;
  amount?: number;
  /** Namów do wojny — cel */
  targetOwnerId?: number;
  borderMilitary?: boolean;
  /** R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1: wojskowy przemarsz + wspólna walka. */
  barbarianCooperation?: boolean;
  /** Sojusz: defensywny vs pełny (Maciej 2026-07-29). */
  allianceKind?: 'defensywny' | 'pelny';
  techId?: string;
  /**
   * R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A (runda 2): kierunek handlu technologią (akcja
   * '6' — patrz diplomacy-tech-trade.ts::resolveTechTradeParties). 'sell' (domyślne, brak
   * pola = stary zapis) — proponent oddaje `techId`, respondent płaci. 'buy' — respondent
   * oddaje `techId`, proponent płaci. Zapłata (patrz `techPaymentMode`) może być gotówkowa
   * LUB inną technologią.
   */
  techDirection?: 'sell' | 'buy';
  /**
   * R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A (runda 2, rozszerzenie decyzji właściciela —
   * pełny zakres dokumentu, nie tylko tryb gotówkowy): sposób zapłaty za `techId`. 'gold'
   * (domyślne, brak pola = stary zapis) — zapłata `techPrice`/`goldOnce`. 'tech' — zapłata
   * technologią `techOfferId` (diplomacy.json „Wymiana bezpłatna" — bez przepływu gotówki).
   */
  techPaymentMode?: 'gold' | 'tech';
  /** Technologia oferowana w zamian, gdy `techPaymentMode === 'tech'` (płaci ją payer, patrz resolveTechTradeParties). */
  techOfferId?: string;
  /** Łapówka przy namówieniu (¤) */
  bribeGold?: number;
  /** Cena tech sprzedaży */
  techPrice?: number;
  /** Suma PN oddawana (koszyk / silnik) */
  givePn?: number;
  /** Suma PN oczekiwana od respondenta */
  receivePn?: number;
  /** Pozycje koszyka — oddaję */
  giveItems?: readonly BasketItem[];
  /** Pozycje koszyka — dostaję */
  receiveItems?: readonly BasketItem[];
  /** Czysty dar (prezent) bez towaru w zamian */
  isGift?: boolean;
  /**
   * HANDEL-SUROWCE-CYKL (2026-07-24): tryb wymiany surowca ilościowego
   * (`surowiec_ilosc` w giveItems/receiveItems). 'once' (domyślnie, brak pola)
   * = jednorazowy transfer natychmiast (istniejące zachowanie, oneShotTrade).
   * 'per_turn' = surowiec↔zapłata płynie CO TURĘ przez `turns` tur (deal
   * cykliczny, ActiveDeal.handelSurowiecCykliczny) — ownerId-agnostyczne,
   * działa identycznie gdy proponentem jest gracz LUB AI.
   */
  resourceTradeMode?: 'once' | 'per_turn';
  /** Jawny czas cyklicznej wymiany: brak = historyczny fallback do `turns`, null = bezterminowo. */
  exchangeDurationTurns?: number | null;
  /**
   * R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 (Obrona runda 1, zarzut 1 Evaluatora
   * PRZYJĘTY): czas TRWANIA TRAKTATU wybrany jawnie w formularzu „Warunki traktatu"
   * (`nap`, `umowa_szlakow`, `trybut_*`). `0` = bezterminowy. Celowo ODDZIELONE od
   * `turns`: `turns` niesie częstotliwość/czas WYMIANY z koszyka i jest mnożnikiem
   * wyceny PN (`proposalPnTurnsMultiplier`), a `treatyTurns` decyduje wyłącznie
   * o `wygasaTura` traktatu. Pole opcjonalne — jego brak = zachowanie historyczne
   * (fallback na `turns`; wszystkie payloady AI i starsze zapisy idą tą ścieżką).
   */
  treatyTurns?: number;
  /** Ultimatum wojenne — odmowa respondenta = casus belli (wypowiedzenie wojny przez proponenta). */
  warThreat?: boolean;
}

export interface DiplomaticProposal {
  actionId: ProposalActionId;
  proposerOwnerId: number;
  responderOwnerId: number;
  payload: ProposalPayload;
}

/** Kontekst oceny — SILNIK dostarcza relację i siłę. */
export interface ProposalEvalContext {
  relation: Relation;
  stanWojny: boolean;
  turn: number;
  epoka?: number;
  /**
   * R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 r3: epoka UMOWY handlowej = WYŻSZA z epok proponenta i
   * respondenta (diplomacyDealTradeEra). `evaluateProposal`/`generateCounterOffer` wyceniają i
   * normalizują ilości surowców w tej epoce (okno gracza, bramka uczciwości i walidacja
   * zatwierdzenia liczą tak samo). Brak = globalna epoka handlu.
   */
  tradeEra?: number;
  /**
   * R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1: zapas płatnika ogona pokoju (klucz surowca → sztuki), z main.ts.
   * Brak pola = bez limitu zapasu (testy/AI bez wiązania). Nigdy nie schodzi poniżej zera.
   */
  payerStock?: Readonly<Record<string, number>>;
  /**
   * R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1 (r2): okno „po rozejmie” pary gracz→AI (main.ts). `open` = tura
   * w oknie (truceEndWindowOpen) i to GRACZ płaci cenę wg truceEndPriceRule; `requiredPn` = ta cena (Pn).
   * Brak pola / open=false = zwykła ocena propozycji pokoju (bez zmian).
   */
  truceEndWindow?: { open: boolean; requiredPn: number; currency?: 'surowce' | 'miasto'; cityAvailable?: boolean };
  /**
   * R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (r3): zapas GRACZA (złoto = Skarbiec państwa, brąz/żelazo/rudy = Spichlerz państwa).
   * Płatnikiem ogona w gałęzi „gracz jest autorem pokoju" jest gracz — nie zawsze proponent (kontroferta, AI proponuje graczowi).
   * Brak pola = jak `payerStock`.
   */
  playerStock?: Readonly<Record<string, number>>;
  /**
   * R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1 (r2): technologie GRACZA i drugiej strony (nazwy jak w tech.json), z main.ts.
   * Stopień „technologie” dopłaty D: płatnik-gracz oddaje technologię, której druga strona NIE ma. Brak pola = brak stopnia.
   */
  playerTechs?: readonly string[];
  partnerTechs?: readonly string[];
  /** r3 (zarzut 5): tempo gry do wyceny technologii nośnika (jak diplomacyPnTech). Brak = standardowa. */
  tempoGry?: Parameters<typeof diplomacyPnTech>[1];
  /** Respekt proponującego (0–100) w oczach respondenta */
  proposerRespekt: number;
  /** Respekt respondenta (0–100) w oczach proponującego */
  responderRespekt: number;
  /** stosunek siły respondenta / proponenta (>1 = respondent silniejszy) */
  militaryRatio?: number;
  /** Frakcja siły respondenta 0..1 (jak decideAIDiplomacy respektWzgledny) */
  respektWzgledny?: number;
  /**
   * R-WEB-PEACE-RULES-Q1 R1/R5: stan wojny pary (tylko gdy stanWojny). `responderRw` = udział
   * siły RESPONDENTA (AI) 0..1; `lostCitiesResponder` = NAZWA HISTORYCZNA: licznik zmęczenia = miasta utracone przez OBIE strony w tej wojnie (suma, lostCitiesForWeariness w war-weariness.ts), nie tylko respondenta.
   * Brak pola = brak bramki pokoju R5 (zachowanie sprzed rundy).
   */
  warState?: {
    turnsAtWar: number;
    lostCitiesResponder: number;
    turnsSinceCityChange?: number;
    responderRw: number;
    /**
     * R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1: pozycja RESPONDENTA wg siły militarnej wobec proponenta
     * (peaceMilitaryPosition). 'silniejsza' = odrzuca pokój bez miasta o wartości PN ≥ ceny.
     */
    responderPozycjaMilitarna?: PeaceMilitaryPosition;
    /**
     * R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1: moc POWER (power-objective.ts) gracza i drugiej strony pary.
     * Gdy podane (obie) — bramka PW pokoju liczy podział P·r / P/r (silniejszy: wymaganie 0; słabszy dopłaca D).
     * Brak = dotychczasowa bramka (bit-identycznie).
     */
    powerPlayer?: number;
    powerOther?: number;
  };
  /**
   * R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1: moc POWER gracza i drugiej strony pary dla traktatów z parytetem
   * (sojusz, NAP, przemarsz, wasal — flaga `parytet` w diplomacy-acceptance-points.json). Brak = bramka parytetu pominięta.
   */
  treatyPower?: { powerPlayer: number; powerOther: number };
  /** Realne sąsiedztwo terytorialne (granica lądowa) + obie strony >2 miasta. */
  karaWspolnaGranica?: boolean;
  /** Benchmark wartości handlu (fair value) */
  fairTradeValue?: number;
  techMinPrice?: number;
  /** Opcjonalnie pełne obiekty graczy dla aiDiplomacyStance */
  responderPlayer?: Player;
  proposerPlayer?: Player;
  isMinorCiv?: boolean;
  /** Miasto-państwo klastra — blokuje trybut (Maciej 2026-08-02). */
  proposerIsCityState?: boolean;
  responderIsCityState?: boolean;
  /** Ludność miast respondenta (suma) — koszt wchłonięcia */
  responderPopulation?: number;
  /** Ile tur trwa aktywny wasal (proposer=suzeren, responder=wasal); undefined = brak */
  wasalAgeTurns?: number;
  /** Istniejące traktaty — blokada duplikatów */
  activeDeals?: readonly ActiveDeal[];
  /** Poziom trudności gry — skaluje progi relacji/zaufania (Maciej 2026-07-21). */
  difficulty?: GameDifficulty;
  /** Globalna Wiarygodność proponenta (−100…+100) — Dźwignia 3 (WIARYGODNOSC §5). */
  proposerWiarygodnosc?: number;
  /** Globalna Wiarygodność respondenta (−100…+100) — Dźwignia 3 (opcjonalnie). */
  responderWiarygodnosc?: number;
  /**
   * R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2=A: PW z INNYCH pozycji na TYM SAMYM stole negocjacji,
   * między tymi samymi stronami i w TYM SAMYM kierunku (identyczny proposerOwnerId/
   * responderOwnerId) — doliczane WYŁĄCZNIE do `treatyBaseFairnessGap` traktatu handlowego
   * (`umowa_szlakow`/`umowa_handlowa`), żeby pakiet {traktat bez własnego koszyka + osobna
   * wymiana (np. `handel`) na tym samym stole} mógł pokryć bazę traktatu SUMĄ pakietu, nie
   * tylko koszykiem samego traktatu (właściciel, opcja A). SCOPED (Q2, Przeciw #1): to NIE
   * jest ogólna pula PW dla wszystkich akcji — pola te wpływają WYŁĄCZNIE na case
   * 'umowa_handlowa'/'umowa_szlakow' poniżej; wywołujący (main.ts) liczy je z pominięciem
   * innych pozycji objętych WŁASNĄ bramką treatyBaseFairnessGap (`pokoj`/`umowa_szlakow`/
   * `umowa_handlowa`) — czyli dedykowany koszyk `pokoj` (baza 500 PW) nie zasila też progu
   * traktatu handlowego jako „sąsiad". KOREKTA (Evaluator): to NIE jest ogólna ochrona
   * przed dwoma traktatami handlowymi na jednym stole obiema czerpiącymi z tego samego
   * niehandlowego sąsiada (np. `handel`) — packageSiblingPn liczy każdy traktat osobno,
   * więc taki scenariusz nie jest wykluczony; jest dziś nieosiągalny inaczej niż z legacy
   * save (obecne UI tworzy zawsze `umowa_szlakow`, nigdy dwóch traktatów handlowych
   * naraz), więc świadomie NIE naprawiane w tym zleceniu. `undefined` = brak sąsiadów /
   * nieliczone (domyślne dla wywołań spoza stołu).
   */
  packageSiblingGivePn?: number;
  packageSiblingReceivePn?: number;
  /**
   * R-HANDEL-WYMIANA-TECH-GATE-Q1: czy proponent/respondent zbadali technologię
   * handlu szlakowego (`TRADE_TECH`, trade-routes.ts). Bramuje WYŁĄCZNIE
   * 'umowa_handlowa'/'umowa_szlakow' (obie strony wymagane) — nie duplikuje
   * logiki, moduł nie zna `player.zbadane`/`aiResearchDone`, wywołujący
   * (main.ts, `buildProposalEvalContext`) wstrzykuje realne wartości.
   * `undefined` = WSTECZNA ZGODNOŚĆ (bramka pominięta) dla wywołujących spoza
   * allowlisty tego tematu.
   */
  hasTradeTechProposer?: boolean;
  hasTradeTechResponder?: boolean;
  /**
   * R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1 (Maciej, ECHO 2026-09-07): autor AKTUALNYCH
   * warunków na stole — DYNAMICZNY, zmienia się po każdej kontrofercie (patrz
   * `PendingNegotiation.authorOwnerId`/`applyCounterOffer`), W ODRÓŻNIENIU od
   * `proposal.proposerOwnerId` (STAŁY od rundy 1, patrz komentarz przy `PendingNegotiation`).
   * Używane WYŁĄCZNIE przez `case 'pokoj'` niżej, żeby bramkę bilansu PW oprzeć o to, KTO
   * TERAZ autoryzuje warunki (kierunek 'own'/'incoming' z perspektywy gracza), nie o to, kto
   * zainicjował rundę 1 — inaczej po kontrofercie (proponent=partner, ale gracz właśnie
   * wylicytował nowe warunki) bramka patrzyłaby na niewłaściwą stronę. `undefined` (wywołujący
   * spoza stołu negocjacji, np. `evaluatePendingFromAI`/`generateCounterOffer` — bez pojęcia
   * kontroferty) = fallback na `proposerOwnerId` (bit-identyczne ze stanem sprzed tej rundy).
   */
  authorOwnerId?: number;
}

export interface ProposalEvalResult {
  accepted: boolean;
  reason: string;
  /**
   * R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (runda 3, zarzut 4): podział PW traktatu z parytetem (sojusz, NAP,
   * przemarsz, wasal, rozejm bez wearinessInfo) — moc obu stron, r, S, W, D, D po rabacie relacji. Ustawiane w
   * evaluateProposal (attachTreatyPowerSplit); pusty dla traktatów spoza listy parytetu i dla pokoju.
   */
  treatyPowerSplit?: PeacePowerSplitInfo;
  /**
   * R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1: nośnik dopłaty D (gracz = płatnik traktatu z parytetem), gdy pokrywa D
   * w całości z zapasów. `items` = pozycje koszyka (zloto / surowiec_ilosc) do przelewu razem z zawarciem traktatu
   * (main.ts dopisuje je do giveItems gracza). Brak pola = brak dopłaty do wykonania.
   */
  /** r3 (zarzut 2): podsumowanie nośnika dla okna propozycji (wiersz „Dopłata traktatu"). */
  treatyPayment?: TreatyPaymentUiInfo;
  treatyCarrier?: {
    items: Array<{ typ: 'zloto' | 'surowiec_ilosc' | 'tech'; id: string; ilosc: number }>;
    coveredPn: number;
    /** Strona koszyka, do której dopisać `items` (treatyCarrierPayloadPatch): 'proposer' = giveItems, 'responder' = receiveItems. */
    side: 'proposer' | 'responder';
  };
  /** Traktat do dodania (NAP, sojusz, trybut, wasal, granice) */
  deal?: ActiveDeal;
  /** Jednorazowy handel T3A — bez trwałego dealu */
  oneShotTrade?: boolean;
  /**
   * P-DYPLO-BILANS-GATE-NIESPOJNY (Maciej 2026-08-14): JEDNA liczba PW = givePn − próg
   * wymagany PRZEZ TĘ SAMĄ bramkę, która zdecydowała `accepted` (relacja + ewentualny
   * mnożnik chęci partnera — wszystko, co bramka faktycznie policzyła). Ustawiane
   * WYŁĄCZNIE przez bramki PW-fairness, które mają realny, numeryczny próg
   * (`handelFairnessGate` dla 'handel', `treatyBaseFairnessGap` dla
   * 'umowa_handlowa'/'umowa_szlakow') — `undefined` gdy akcja nie ma takiej bramki
   * (np. nap/sojusz/wasal — tam decyduje wyłącznie próg Relacji/Zaufania, nie PW).
   * UI (diplomacyAcceptanceBalance.ts) używa TEGO pola jako jedynego źródła
   * wyświetlanego "Bilans", gdy jest dostępne — zamiast osobno liczonej, surowej
   * różnicy givePn−receivePn, żeby "Bilans ≥ 0" i akceptacja bramki ZAWSZE się zgadzały.
   * / EN: ONE PW number = givePn − the threshold THE SAME gate used to decide
   * `accepted` (relation + any partner-willingness multiplier — everything the gate
   * actually computed). Set ONLY by PW-fairness gates that have a real numeric
   * threshold; `undefined` when the action has no such gate (e.g. nap/alliance/vassal
   * — decided purely by a Relation/Trust threshold, not PW). The UI uses this as the
   * sole source for the displayed "Bilans" when present, instead of a separately
   * computed raw give−receive difference, so "Bilans ≥ 0" and gate acceptance never
   * disagree again.
   */
  pwBalance?: number;
  /**
   * R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1: Z = pozycja PW „Zmęczenie wojną” (round(C×x²)) w tabeli
   * oceniającego AI przy pokoju od gracza. `pwBalance` = givePn − (C − Z), więc tabela (Z + oddawane) − C = pwBalance.
   * `undefined` poza tą gałęzią (brak zmęczenia w bilansie).
   */
  wearinessPw?: number;
  /** Dane do podpowiedzi wiersza „Zmęczenie wojną” (tury wojny, utracone miasta, poziom zmęczenia 0..1). */
  wearinessInfo?: WearinessPwInfo;
  /** R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1 r3 (zarzut 1): strona, której wiersz Z trafia do tabeli: 'ai' = oferta gracz->AI (kolumna AI), 'player' = oferta AI->gracz (kolumna gracza). */
  wearinessSide?: 'ai' | 'player';
  /**
   * R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (r3): ogon ceny pokoju złożony z RESZTY po miastach (złoto → brąz → żelazo → rudy),
   * gdy `applied` = true — pozycje dopisuje do koszyka warstwa wykonująca (applyProposalOutcome) po stronie `giver`.
   */
  peaceTail?: PeaceTailInfo;
}

/** Ogon ceny pokoju (dane tooltipa „Dopłata: …" i pozycje do wykonania). */
export interface PeaceTailInfo {
  items: PeaceTailItem[];
  /** Reszta ceny po miastach i pozycjach już oferowanych (PN), którą ogon miał pokryć. */
  restPn: number;
  /** Ile ogon pokrywa (PN) i ile brakuje mimo ogona. */
  coveredPn: number;
  shortfallPn: number;
  /** true = ogon pokrywa całą resztę i jest dopisywany do oferty automatycznie. */
  applied: boolean;
  /** Strona, która oddaje ogon (proponent albo respondent). */
  giver: 'proposer' | 'responder';
  /** Gotowy tekst „Dopłata: X złota, Y rudy żelaza". */
  label: string;
}

/** R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1 (runda 2): dane tooltipa wiersza Z. */
export interface WearinessPwInfo {
  turnsAtWar: number;
  lostCities: number;
  level: number;
  /** R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1: aktualna cena pokoju w PN (wearinessPeaceCashPn(level) po bramce relacji) — pokazywana w panelu/audiencji. */
  cenaPokojuPn?: number;
  /** R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (r3): ogon ceny pokoju (tooltip „Dopłata: …"). */
  peaceTail?: PeaceTailInfo;
  /** R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 (D4): podział PW pokoju wg POWER (moce, r, S, W, D, D po rabacie) — tooltip panelu PW. */
  powerSplit?: PeacePowerSplitInfo;
}

export interface PendingProposal {
  id: string;
  fromOwnerId: number;
  toOwnerId: number;
  actionId: ProposalActionId;
  payload: ProposalPayload;
  createdTurn: number;
  expiresTurn: number | null;
  source: 'ai' | 'player';
  aiPowod?: string;
}

const STUB_RESPONDER: Player = { typCywilizacji: TypCywilizacji.Grecy } as Player;
const STUB_PROPOSER: Player = { typCywilizacji: TypCywilizacji.Rzymianie } as Player;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function pairHasKind(
  deals: readonly ActiveDeal[] | undefined,
  a: number,
  b: number,
  rodzaj: TreatyKind,
): boolean {
  if (!deals?.length) return false;
  const p0 = Math.min(a, b);
  const p1 = Math.max(a, b);
  const k = normalizeTreatyKind(rodzaj);
  return deals.some(
    d => d.strony[0] === p0 && d.strony[1] === p1 && normalizeTreatyKind(d.rodzaj) === k,
  );
}

/** R-GRACZ-WCHLONIECIE: koszt jednorazowego wchłonięcia MP (¤). */
export function graczWchloniecieKosztZloto(
  population: number,
  p: ReturnType<typeof getEffectiveDiplomacyParams> = getEffectiveDiplomacyParams('normal'),
): number {
  return Math.max(
    p.graczWchloniecieKosztMin,
    p.graczWchloniecieKosztBaza + p.graczWchloniecieKosztPerLudnosc * Math.max(0, population),
  );
}

/** Aktywny wasalizacja: suzeren=`suzerenId`, wasal=`wasalId`. */
export function findWasalDeal(
  deals: readonly ActiveDeal[] | undefined,
  suzerenId: number,
  wasalId: number,
): ActiveDeal | undefined {
  if (!deals?.length) return undefined;
  const p0 = Math.min(suzerenId, wasalId);
  const p1 = Math.max(suzerenId, wasalId);
  return deals.find(d => {
    if (d.strony[0] !== p0 || d.strony[1] !== p1) return false;
    if (normalizeTreatyKind(d.rodzaj) !== RodzajTraktatu.Wasalizacja) return false;
    const econ = d.ekonomia;
    if (!econ) return true;
    return econ.receiverOwnerId === suzerenId && econ.payerOwnerId === wasalId;
  });
}

export function wasalAgeTurns(deal: ActiveDeal | undefined, turn: number): number | undefined {
  if (!deal || deal.zawartaTura == null) return undefined;
  return Math.max(0, turn - deal.zawartaTura);
}

export function makeDealId(
  prefix: string,
  turn: number,
  a: number,
  b: number,
): string {
  const [p0, p1] = a < b ? [a, b] : [b, a];
  return `${prefix}-${p0}-${p1}-t${turn}`;
}

function stanceForEval(
  ctx: ProposalEvalContext,
  celAgresorAktywny: boolean,
): ReturnType<typeof aiDiplomacyStance> {
  const responder = ctx.responderPlayer ?? STUB_RESPONDER;
  const proposer = ctx.proposerPlayer ?? STUB_PROPOSER;
  const proposerMil = ctx.militaryRatio ?? 1;
  // aiDiplomacyStance oczekuje stosunku M_AI / M_rozmówcy (nie proponent/respondent).
  const responderMilRatio = proposerMil > 0 ? 1 / proposerMil : 99;
  const dipCtx: AIDiplomacyContext = {
    isMinorCiv: ctx.isMinorCiv ?? false,
    militaryRatio: responderMilRatio,
    currentTurn: ctx.turn,
    // R-WEB-PEACE-RULES-Q1 R1: realny czas wojny (dawna stała 5 usunięta).
    turnsAtWar: ctx.stanWojny ? Math.max(0, ctx.warState?.turnsAtWar ?? 0) : 0,
    // R-WEB-WAR-AGGRESSOR-FLAG-Q1: proponent (druga strona stance) z aktywną flagą agresora.
    celAgresorAktywny,
  };
  return aiDiplomacyStance(responder, proposer, ctx.relation, dipCtx);
}

function buildDeal(
  rodzaj: TreatyKind,
  a: number,
  b: number,
  turn: number,
  wygasaTura: number | null,
  ekonomia?: ActiveDeal['ekonomia'],
  handelJednorazowy?: boolean,
  handelPayload?: HandelDealPayload,
  handelSurowiecCykliczny?: HandelSurowiecCyklicznyItem[],
  wspolnaWalkaBarbarzyncy = false,
): ActiveDeal {
  return {
    id: makeDealId(rodzaj, turn, a, b),
    rodzaj,
    strony: a < b ? [a, b] : [b, a],
    wygasaTura,
    zawartaTura: turn,
    ekonomia,
    handelJednorazowy,
    handelPayload,
    handelSurowiecCykliczny,
    wspolnaWalkaBarbarzyncy: wspolnaWalkaBarbarzyncy || undefined,
  };
}

/** SUROW-TERYT: trwały dostęp (złoże / surowiec_boolean) wycofany z handlu dyplomatycznego. */
const RESOURCE_ACCESS_TYPES = new Set<BasketItem['typ']>(['zloze', 'surowiec_boolean']);

export const RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON =
  'Handel dostępem do surowców nieaktualny — wycofany po polityce terytorialnej (SUROW-TERYT)';

/** Czy propozycja obejmuje trwały dostęp do surowców/złóż (nie jednorazowy PN). */
export function proposalHasResourceAccess(payload: {
  giveItems?: readonly BasketItem[];
  receiveItems?: readonly BasketItem[];
}): boolean {
  const items = [...(payload.giveItems ?? []), ...(payload.receiveItems ?? [])];
  return items.some(i => RESOURCE_ACCESS_TYPES.has(i.typ));
}

/** Usuwa wycofane pozycje dostępu z koszyka (bezpieczny filtr UI / quick-deal). */
export function stripWithdrawnResourceAccessItems(items: readonly BasketItem[]): BasketItem[] {
  return items.filter(i => !RESOURCE_ACCESS_TYPES.has(i.typ));
}

/** Czas trwałej umowy handlowej: 1–20 tur (Maciej 2026-07-21). */
export function clampDealTurns(turns: number | undefined, defaultTurns = 15): number {
  return clamp(turns ?? defaultTurns, 1, 20);
}

/** Cyclic quantity-exchange duration is distinct from treaty duration (1–30). */
export function clampExchangeDurationTurns(turns: number | undefined, defaultTurns = 15): number {
  return clamp(turns ?? defaultTurns, 1, 30);
}

function exchangeValuationTurns(payload: Pick<ProposalPayload, 'turns' | 'exchangeDurationTurns'>): number {
  // Only new, explicitly versioned UI offers can use the new 21–30 valuation horizon.
  // Legacy and AI payloads retain their historical 1–20 clamp.
  return payload.exchangeDurationTurns !== undefined
    ? clampExchangeDurationTurns(payload.turns)
    : clampDealTurns(payload.turns);
}

/** Resolve active cyclic exchange expiry while preserving legacy finite payload behavior. */
export function resolveExchangeExpiry(turn: number, payload: Pick<ProposalPayload, 'turns' | 'exchangeDurationTurns'>): number | null {
  if (payload.exchangeDurationTurns === null) return null;
  if (payload.exchangeDurationTurns !== undefined) return turn + clampExchangeDurationTurns(payload.exchangeDurationTurns);
  return turn + clampDealTurns(payload.turns);
}

/**
 * R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 (Obrona runda 1, zarzut 1 Evaluatora PRZYJĘTY):
 * JEDNO miejsce odczytu „czasu trwania traktatu" z payloadu. `treatyTurns` (jawny wybór
 * gracza w formularzu „Warunki traktatu") ma pierwszeństwo; `turns` jest wyłącznie
 * fallbackiem historycznym (payloady AI, stare zapisy) — bo `turns` niesie też
 * częstotliwość WYMIANY z koszyka i jest mnożnikiem wyceny PN, więc nie wolno tych
 * dwóch wielkości utożsamiać. Zwraca `undefined` = „nie podano czasu",
 * `null` = bezterminowy, liczbę = liczba tur (bez clampu — clamp należy do wywołującego,
 * bo widełki różnią się per traktat: NAP 10–20, umowa szlaków 1–20, trybut bez clampu).
 */
export function resolveTreatyDurationTurns(
  payload: { turns?: number; treatyTurns?: number },
): number | null | undefined {
  // `treatyTurns` jest polem NOWYM i jednoznacznym: `0` = bezterminowy.
  if (payload.treatyTurns != null) return payload.treatyTurns > 0 ? payload.treatyTurns : null;
  // Ścieżka historyczna (payloady AI, starsze zapisy) zwracana BEZ REINTERPRETACJI — żeby
  // `turns: 0` znaczyło tam dokładnie to, co znaczyło przed tą rundą (per traktat:
  // dla `umowa_szlakow` 1 tura po clampie, dla trybutu `ctx.turn + 0`), a nie „bezterminowy".
  return payload.turns;
}

/** §9.1 WIAR-NAP-IMP: NAP terminowy (10–20 tur) lub bezterminowy (wygasaTura null). */
export function resolveNapDealExpiry(
  turn: number,
  payload: { turns?: number; treatyTurns?: number },
): { wygasaTura: number | null; label: string } {
  const raw = payload.treatyTurns ?? payload.turns;
  if (raw != null && raw <= 0) {
    return { wygasaTura: null, label: 'Pakt nieagresji (bezterminowy)' };
  }
  const turns = clamp(raw ?? 15, 10, 20);
  return { wygasaTura: turn + turns, label: `Pakt nieagresji na ${formatTurCountAcc(turns)}` };
}

// ---------------------------------------------------------------------------
// C-DYP-STOL-Q1=B (2026-07-25): KOSZYK-TRAKTAT — „słodzik" dołożony do propozycji
// traktatowej (pakt/sojusz/granice/wasal/trybut) OBOK samego traktatu. Wycena =
// TA SAMA suma PN co koszyk handlu/daru (diplomacy-value-catalog przez
// resolveProposalPn z diplomacy-pn-engine) — brak nowej ekonomii. Netto =
// max(0, givePn − receivePn): jeśli respondent w payload.receiveItems też coś
// oddaje, słodzik netto się o tyle kurczy (symetria — respondent nie powinien
// tracić dodatkowo NA korzyść niższego progu akceptacji).
// ownerId-agnostyczne: proposerOwnerId/responderOwnerId w evaluateProposal to
// zwykłe liczby — ta sama ścieżka niezależnie od tego, kto proponuje (gracz/AI).
// ---------------------------------------------------------------------------

/** PLACEHOLDER (strojenie w playteście): 25 PN słodzika = 1 punkt „ease" progu. */
const SWEETENER_PN_PER_EASE_POINT = 25;
/** PLACEHOLDER (strojenie w playteście): sufit ease — złoto/dobra nie zastępują relacji całkowicie. */
const SWEETENER_EASE_MAX_POINTS = 20;

/**
 * R-DYPLO-PAKT-WETO-EKSPANSJA-Q1: narzut na próg Relacji dla Paktu o nieagresji, gdy
 * aktywny jest czynnik „Kara za wspólną granicę" (`ctx.karaWspolnaGranica`; do
 * R-DYPLO-NAP-KARA-GRANICA-REDEFINICJA-Q1 nazywany `ekspansjaPrzyGranicy` —
 * przemianowany na uczciwą nazwę, WARTOŚĆ narzutu bez zmian).
 * WYPROWADZONY, nie wymyślony: równy `SWEETENER_EASE_MAX_POINTS`, więc maksymalny słodzik
 * dokładnie kasuje narzut i sprowadza próg z powrotem do `progNapRelacja`. Ta równość jest
 * TREŚCIĄ decyzji — gwarantuje, że czynnik nigdy nie czyni paktu nieosiągalnym, tylko
 * droższym. Zmiana jednej z tych dwóch stałych bez drugiej łamie tę gwarancję.
 */
export const NAP_GRANICA_RELACJA_NARZUT = SWEETENER_EASE_MAX_POINTS;

/**
 * R-WEB-DIPLO-NAP-UI-BORDER-THRESHOLD-Q1: JEDEN efektywny próg Relacji dla Paktu o nieagresji.
 * Używany przez silnik (evaluateProposal::case 'nap'), blokadę UI (diplomacy-locks.ts case '2')
 * i notkę/tooltip — UI nie może liczyć progu inaczej niż silnik.
 * Składowe: `progNapRelacja` (już po skalowaniu trudności), narzut „Kara za wspólną granicę",
 * delta flagi agresora proponenta (`deltaRelacjiSojusz`), minus słodzik (`napEase`).
 * Blokada UI nie zna payloadu propozycji, więc woła z `napEase = 0` (słodzik działa dopiero
 * w ocenie konkretnej oferty — ta sama reguła co wcześniej).
 */
export function napRelacjaProgEfektywny(
  progNapRelacja: number,
  opts: { karaWspolnaGranica?: boolean; proponentAgresor?: boolean; napEase?: number } = {},
): number {
  const narzut = opts.karaWspolnaGranica ? NAP_GRANICA_RELACJA_NARZUT : 0;
  return Math.max(
    0,
    progNapRelacja + narzut - (opts.napEase ?? 0) + deltaRelacjiSojusz(opts.proponentAgresor === true),
  );
}

/** Wartość netto słodzika w PN (koszyk giveItems minus receiveItems, floor 0). */
export function sweetenerNetPn(payload: ProposalPayload, pnOpts?: ResolveProposalPnOptions): number {
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  return Math.max(0, givePn - receivePn);
}

/**
 * Punkty „ease" ze słodzika — obniżają progi akceptacji traktatu (Relacja/
 * Zaufanie/Respekt, w zależności od akcji), analogicznie do
 * diplomacyProposerStrengthEase (przewaga militarna/Respekt) w diplomacy.ts.
 * PLACEHOLDER: liniowe, sufit 20 punktów — strojenie właściciela w playteście.
 */
export function sweetenerEasePoints(payload: ProposalPayload, pnOpts?: ResolveProposalPnOptions): number {
  const netPn = sweetenerNetPn(payload, pnOpts);
  if (netPn <= 0) return 0;
  return Math.min(SWEETENER_EASE_MAX_POINTS, Math.floor(netPn / SWEETENER_PN_PER_EASE_POINT));
}

/**
 * HANDEL-SUROWCE-CYKL (2026-07-24): koszyk `surowiec_ilosc` (+ opcjonalna zapłata
 * zloto/praca po stronie przeciwnej) → przepływy CO TURĘ. `ilosc` na pozycji
 * `surowiec_ilosc` to SZTUKI/turę (ta sama jednostka co w trybie jednorazowym —
 * R-DYP-PAKIET-USUN 2026-08-08: bez mnożenia przez pakiet, main.ts transferBasketItems
 * i tickCyclicResourceTradeDeals traktują `ilosc`/`pakietyPerTura` jako sztuki wprost).
 * Obsługuje oba kierunki naraz (barter surowiec-za-surowiec) — zwykle jeden wpis.
 * ownerId-agnostyczne: proposerId/responderId mogą być gracz LUB dowolne AI.
 */
export function buildHandelSurowiecCykliczny(
  proposerId: number,
  responderId: number,
  giveItems: readonly BasketItem[] = [],
  receiveItems: readonly BasketItem[] = [],
  /** R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 r3: jawna epoka umowy (brak = globalna epoka handlu). */
  tradeEra?: number,
): HandelSurowiecCyklicznyItem[] {
  const out: HandelSurowiecCyklicznyItem[] = [];
  const giveRes = giveItems.find(i => i.typ === 'surowiec_ilosc' && (i.ilosc ?? 0) > 0);
  const givePayment = giveItems.find(i => i.typ === 'zloto' || i.typ === 'praca');
  const recvRes = receiveItems.find(i => i.typ === 'surowiec_ilosc' && (i.ilosc ?? 0) > 0);
  const recvPayment = receiveItems.find(i => i.typ === 'zloto' || i.typ === 'praca');
  // R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 r4 (zarzut Evaluatora 1): epoka umowy zamrożona przy zawarciu.
  const epokaRaw = Math.floor(Number(tradeEra ?? diplomacyTradeEra()));
  const epokaUmowy: 1 | 2 | 3 = epokaRaw >= 3 ? 3 : epokaRaw === 2 ? 2 : 1;

  // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): pakietyPerTura zostaje ZAMROŻONE na cały czas
  // trwania dealu cyklicznego (tickCyclicResourceTradeDeals transferuje tę samą wartość co
  // turę, bez ponownej walidacji kroku) — floor do wielokrotności kroku handlu MUSI więc
  // nastąpić TU, przy budowie dealu, nie tylko przy jednorazowym transferze.
  if (giveRes) {
    out.push({
      surowiecKey: giveRes.id,
      pakietyPerTura: diplomacyNormalizeSurowiecIlosc(giveRes.id, giveRes.ilosc ?? 0, undefined, epokaUmowy),
      epokaUmowy,
      sellerOwnerId: proposerId,
      buyerOwnerId: responderId,
      zaplataTyp: recvPayment?.typ as 'zloto' | 'praca' | undefined,
      zaplataPerTura: recvPayment?.ilosc,
    });
  }
  if (recvRes) {
    out.push({
      surowiecKey: recvRes.id,
      pakietyPerTura: diplomacyNormalizeSurowiecIlosc(recvRes.id, recvRes.ilosc ?? 0, undefined, epokaUmowy),
      epokaUmowy,
      sellerOwnerId: responderId,
      buyerOwnerId: proposerId,
      zaplataTyp: givePayment?.typ as 'zloto' | 'praca' | undefined,
      zaplataPerTura: givePayment?.ilosc,
    });
  }
  return out;
}

/**
 * R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 r4 (obrona, zarzut Evaluatora 1): epoka pozycji cyklicznej =
 * zamrożona `epokaUmowy` (umowy zawarte od r4); brak pola (zapis sprzed r4) → epoka pary właścicieli
 * `pairEra(seller, buyer)` (wyższa z epok stron). Nigdy globalna epoka gracza.
 */
export function cyclicItemTradeEra(
  item: Pick<HandelSurowiecCyklicznyItem, 'epokaUmowy' | 'sellerOwnerId' | 'buyerOwnerId'>,
  pairEra: (ownerA: number, ownerB: number) => 1 | 2 | 3,
): 1 | 2 | 3 {
  return item.epokaUmowy ?? pairEra(item.sellerOwnerId, item.buyerOwnerId);
}

/**
 * Self-heal ilości pozycji cyklicznej (tura): wielokrotność bloku EPOKI UMOWY, min. 1 blok.
 * Nie zeruje umowy (floor do 0 usuwałby dostawę na stałe); 0 zostaje 0 (pozycja bez ilości).
 */
export function cyclicSelfHealPakiety(
  item: Pick<HandelSurowiecCyklicznyItem, 'epokaUmowy' | 'sellerOwnerId' | 'buyerOwnerId' | 'surowiecKey' | 'pakietyPerTura'>,
  pairEra: (ownerA: number, ownerB: number) => 1 | 2 | 3,
): number {
  return diplomacyClampQtyToEraBlock(item.surowiecKey, item.pakietyPerTura, cyclicItemTradeEra(item, pairEra));
}

/** Etykieta UI traktatu przemarszu (Maciej 2026-07-29 — zamiast „granice"). */
export function marchTreatyLabel(borderMilitary?: boolean): string {
  return borderMilitary ? 'Traktat przemarszu (wojskowy)' : 'Traktat przemarszu (cywilny)';
}

/**
 * R-DYPLO-KOSZT-CZAS-TRWANIA-TRAKTATU-Q1: traktaty o stałej bazie PW, które w UI
 * (diplomacyNegotiationModal.ts::buildFormBody) faktycznie mają selektor czasu trwania.
 * `nap` (case '2'): chipy 10/15/20/Bezterminowy + pole ręczne. Sojusz (case '3') ma tam
 * tylko wybór typu (pełny/defensywny), przemarsz (case '4') tylko checkbox prawa
 * wojskowego, wasal (case '12') tylko trybut ¤/turę — żaden z tych trzech nie wybiera
 * czasu trwania, więc mnożnik się do nich NIE stosuje.
 * Runda 2 (obrona, zarzut Evaluatora): `trybut_zadanie` (case '8', tryb „Żądaj trybutu")
 * MA własne pole „Czas (tur, 0 = bezterminowy)" (`cdn-turns-trib`,
 * diplomacyNegotiationModal.ts ~330) i własną stałą bazę PW w tej samej tabeli config
 * (`traktaty.trybut_zadanie.punkty=120`), czytaną przez ten sam choke-point
 * (`treatyBaseAcceptancePn`/`computePlayerAcceptanceSides`) co `nap` — więc dołączony
 * tutaj. Realny efekt jest WYŁĄCZNIE na WYŚWIETLANĄ bazę PW w panelu akceptacji stołu
 * negocjacji: rzeczywista bramka akceptacji/odrzucenia żądania trybutu
 * (`evaluateProposal` case `trybut_zadanie`, diplomacy-proposals.ts) liczy próg
 * WYŁĄCZNIE z `payload.goldPerTurn` vs `progTrybutMinGoldPerTurn`/
 * `progTrybutZadanieMaxGoldBase` — nie z `treatyBasePnFromConfig` — i `treatyPnGate`
 * (jedyne miejsce, gdzie `basePn` trybutu wpływa na inny wynik niż samo wyświetlanie)
 * używa `basePn` tylko jako bramki `if (basePn <= 0) return null` przed logiką
 * specyficzną dla `pokoj`/koszyka — mnożnik nie zmienia tej bramki (basePn>0 zarówno
 * przed, jak i po). Zatem rozszerzenie jest bezpieczne względem realnej mechaniki
 * akceptacji trybutu — naprawia wyłącznie rozjazd UI (selektor czasu widoczny, baza PW
 * w panelu go ignorująca), czyli dokładnie tę samą klasę usterki co zgłoszenie
 * właściciela.
 * `trybut_oferta` (tryb „Zaproponuj trybut" w TYM SAMYM case '8' — jeden dropdown
 * `cdn-trib-mode` demand/offer, jeden współdzielony `numInput('cdn-turns-trib', ...)`,
 * `readPayload` case '8' zwraca `turns` niezależnie od trybu, `pickActionIdForTribute`
 * w diplomacyNegotiationModal.ts mapuje `tributeMode==='offer'→trybut_oferta`) ma
 * DOKŁADNIE ten sam selektor czasu co `trybut_zadanie` — więc dołączony z tego samego
 * powodu. `evaluateProposal` case `trybut_oferta` też liczy próg wyłącznie z
 * `payload.goldPerTurn`/`goldOnce` vs `progTrybutOferta*` — nie z
 * `treatyBasePnFromConfig` — więc identycznie bezpieczne (tylko display).
 * `pokoj` poza zakresem z definicji (brak selektora w ogóle).
 */
const TREATY_DURATION_MULTIPLIER_ACTIONS: ReadonlySet<string> = new Set<string>([
  'nap',
  'trybut_zadanie',
  'trybut_oferta',
]);

/**
 * R-DYPLO-KOSZT-CZAS-TRWANIA-TRAKTATU-Q1: mnożnik bazy PW traktatu wg czasu trwania —
 * geometryczny, kalibrowany na trzech punktach odniesienia właściciela: 10 tur → ×1,
 * 15 tur → ×2, 20 tur → ×4, bezterminowy → ×8 (każdy próg dwa razy droższy od
 * poprzedniego). Wzór wiążący (nie wolno zastąpić np. progowym zaokrągleniem):
 *   turns <= 0  → 8
 *   inaczej     → 2 ^ ((clamp(turns, 10, 20) - 10) / 5)
 * Brak `payload.turns` (np. wywołania testowe bez kontekstu czasu — w realnej
 * rozgrywce UI/AI zawsze wysyłają konkretną wartość) NIE amplifikuje bazy: traktowany
 * jako dolna granica clampu (10 tur → ×1), żeby nie zmieniać istniejącej semantyki
 * „baza traktatu" tam, gdzie czas trwania jest nieznany/nieistotny dla testu.
 */
export function treatyDurationPnMultiplier(
  actionId: string,
  payload: { turns?: number; treatyTurns?: number },
): number {
  if (!TREATY_DURATION_MULTIPLIER_ACTIONS.has(actionId)) return 1;
  // R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1: mnożnik liczy się z CZASU TRAKTATU
  // (`treatyTurns`), nie z częstotliwości wymiany koszyka, która żyje w `turns`.
  const raw = payload.treatyTurns ?? payload.turns;
  if (raw != null && raw <= 0) return 8;
  const turns = clamp(raw ?? 10, 10, 20);
  return Math.pow(2, (turns - 10) / 5);
}

/**
 * R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1: eksportowana (była lokalna) — jedyne miejsce czytające
 * bazę traktatu z konfiguracji (`diplomacy-acceptance-points.json` „traktaty"), żeby
 * `enqueueNegotiationFromAiCmd` (main.ts) mogło przekazać ją do generatora oferty AI
 * zamiast duplikować odczyt configu.
 * R-DYPLO-KOSZT-CZAS-TRWANIA-TRAKTATU-Q1: `payload` opcjonalny — gdy podany, baza jest
 * przemnożona przez `treatyDurationPnMultiplier` (efekt realny tylko dla `nap`, patrz tam).
 */
export function treatyBasePnFromConfig(
  actionId: string,
  payload?: { turns?: number; treatyTurns?: number },
): number {
  const t = (acceptancePointsJson.traktaty as Record<string, { punkty?: number } | undefined>);
  const base = t[actionId]?.punkty ?? 0;
  return payload ? base * treatyDurationPnMultiplier(actionId, payload) : base;
}

/** Relacja do progu PN traktatu — w wojnie Zaufanie = 0 (clampRelationForWar), bez limitu 29 na sumę. */
export function treatyEvalRelationTotal(rel: Relation): number {
  const clamped = rel.status === 'wojna' ? clampRelationForWar(rel) : rel;
  return relationTotal(clamped);
}

/**
 * Skuteczna oferta PN na pokój: propozycja pokoju = wymagane PN traktatu po stronie
 * proponenta (gracz @ Relacji, partner = baza) + słodzik netto z koszyka.
 */
export function peaceProposalOfferPn(
  givePn: number,
  receivePn: number,
  basePn: number,
  rel: Relation,
  proposerIsPlayer = false,
): { offerPn: number; required: number } {
  const relTotal = treatyEvalRelationTotal(rel);
  const required = proposerIsPlayer
    ? effectiveTreatyPnRequired(basePn, relTotal)
    : partnerTreatyPnRequired(basePn);
  const basketNet = Math.max(0, givePn - receivePn);
  return { offerPn: required + basketNet, required };
}

/**
 * R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (wersja 1, tylko autor = gracz): parytet siły dla traktatów z
 * `parytet: true` w diplomacy-acceptance-points.json. X = cena bazowa (z konfigu, już po ×10), S/W/D z
 * `peacePwPointsByPowerRatio(X, moc gracza, moc partnera)`. Silniejszy gracz: brak blokady. Słabszy gracz:
 * oferta musi pokryć D (po rabacie relacji, `effectiveTreatyPnRequired`) — inaczej blokada z kwotą.
 * Brak `powerPower` (undefined) → null (bramka pominięta, zachowanie sprzed rundy).
 * Nie obejmuje: rozejmu (ścieżka pokoju), ścieżki AI-autora, płatności surowcami.
 */
/** R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (runda 2): czy traktat objęty parytetem siły (flaga `parytet` w JSON). */
export function treatyParityEnabled(actionId: string): boolean {
  const cfg = acceptancePointsJson.traktaty as Record<string, { parytet?: boolean; platnik?: string } | undefined>;
  return cfg[actionId]?.parytet === true && cfg[actionId]?.platnik === 'slabsza';
}

/**
 * Poziom zmęczenia wojną pary L (0..1) z ctx.warState; brak stanu wojny → 0 (bez redukcji).
 * Jedno miejsce liczenia L dla X rozejmu (X_rozejm = 2000 × (1 − L)).
 */
export function treatyWearinessLevelOf(ctx: { warState?: { turnsAtWar: number; lostCitiesResponder: number; turnsSinceCityChange?: number } }): number {
  if (!ctx.warState) return 0;
  return warWearinessLevel({
    turnsAtWar: Math.max(0, ctx.warState.turnsAtWar),
    lostCitiesTotal: Math.max(0, ctx.warState.lostCitiesResponder),
    turnsSinceCityChange: ctx.warState.turnsSinceCityChange,
  });
}

/**
 * Cena bazowa X traktatu z parytetem: cena z configu; dla rozejmu skalowana zmęczeniem wojną (× (1 − L)).
 */
export function treatyParityBaseX(actionId: string, payload: ProposalPayload, wearinessL: number): number {
  const base = treatyBasePnFromConfig(actionId, payload);
  if (actionId === 'rozejm') return Math.round(base * (1 - clamp(wearinessL, 0, 1)));
  return base;
}

/** Technologie do stopnia technologii nośnika (+ tempo gry do wyceny). */
export interface CarrierTechs {
  payerTechs: readonly string[];
  otherTechs: readonly string[];
  tempoGry?: Parameters<typeof diplomacyPnTech>[1];
}

/**
 * R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1: plan nośnika dopłaty D dla GRACZA-płatnika traktatu z parytetem
 * (gracz słabszy, autor = gracz). `null` = bramka nie dotyczy (silniejszy gracz, brak mocy, brak parytetu,
 * koszyk już pokrywa D). Czysty: zapasy płatnika = `payerStock` (ctx.playerStock), pozycje koszyka już oferowane
 * (giveItems zloto/surowce) są odejmowane od zapasu, żeby nie liczyć tego samego złota dwa razy.
 * Stopień technologii NIE jest tu jeszcze podłączony (brak listy technologii w ctx) — patrz raport.
 */
export function treatyCarrierPlanForPlayerPayer(
  actionId: string,
  payload: ProposalPayload,
  relation: Relation,
  pnOpts: ResolveProposalPnOptions,
  treatyPower: { powerPlayer: number; powerOther: number } | undefined,
  wearinessL: number,
  payerStock: Readonly<Record<string, number>> | undefined,
  era: number | undefined,
  techs?: CarrierTechs,
): TreatyCarrierPlan | null {
  if (!treatyPower) return null;
  if (!treatyParityEnabled(actionId)) return null;
  // r3 (zarzut 1): płatnikiem jest GRACZ, gdy jest słabszą stroną — niezależnie od tego, kto proponuje.
  // Propozycja gracza: jego pozycje = giveItems / givePn. Propozycja AI→gracz: gracz odpowiada, jego pozycje = receiveItems / receivePn.
  const proposerIsPlayer = (pnOpts.proposerOwnerId ?? 0) === (pnOpts.playerOwnerId ?? 0);
  // Kierunek AI→gracz tylko dla traktatów z zweryfikowanym nośnikiem (r3). Rozejm (AI autor) zostaje jak dotąd: bez planu.
  if (!proposerIsPlayer && !TREATY_CARRIER_ACTIONS.has(actionId)) return null;
  const X = treatyParityBaseX(actionId, payload, wearinessL);
  if (X <= 0) return null;
  const split = peacePwPointsByPowerRatio(X, treatyPower.powerPlayer, treatyPower.powerOther);
  if (split.strongerSide === 'a') return null;
  const relTotal = treatyEvalRelationTotal(relation);
  const requiredD = effectiveTreatyPnRequired(split.D, relTotal);
  const { givePn: proposerGivePn, receivePn } = resolveProposalPn(payload, pnOpts);
  // PN wnoszone przez GRACZA (płatnika) w samej propozycji.
  const givePn = proposerIsPlayer ? proposerGivePn : receivePn;
  if (givePn >= requiredD) return null;
  // Zapas płatnika pomniejszony o pozycje koszyka już oferowane (jedno złoto nie liczy się dwa razy).
  const left: Record<string, number> = {};
  // Brak zapasu (undefined) = zero zapasów: bramka parytetu nadal odrzuca (jak przed nośnikiem), tylko z komunikatem.
  for (const k of PEACE_TAIL_ORDER) left[k] = Math.max(0, Math.floor((payerStock ?? {})[k] ?? 0));
  const payerBasket = (proposerIsPlayer ? payload.giveItems : payload.receiveItems) ?? [];
  for (const i of payerBasket) {
    if (i.typ !== 'zloto' && i.typ !== 'surowiec_ilosc') continue;
    const k = i.typ === 'zloto' ? 'zloto' : i.id;
    if (k in left) left[k] = Math.max(0, left[k]! - Math.max(0, Math.floor(i.ilosc ?? 0)));
  }
  // Zarzut 6 (FC r2): technologia już oferowana w koszyku płatnika nie może być dobrana drugi raz do nośnika.
  const offeredTechs = new Set(payerBasket.filter(i => i.typ === 'tech').map(i => i.id));
  const duePn = requiredD - givePn;
  const payment = composeTreatyPayment({
    duePn,
    // Stopień technologii: tylko techy płatnika, których druga strona NIE ma i które nie są już w koszyku.
    payerTechs: (techs?.payerTechs ?? []).filter(t => !offeredTechs.has(t)),
    otherTechs: techs?.otherTechs ?? [],
    // Zarzut 5 (FC r2): wycena technologii w tempie gry (ctx.tempoGry), nie domyślnym „standardowa”.
    techPn: name => diplomacyPnTech(name, techs?.tempoGry ?? 'standardowa'),
    pricing: {
      holdings: left,
      pnPerUnit: k => peaceTailPnPerUnit(k, era),
      stepOf: k => peaceTailStep(k, era),
    },
  });
  return {
    requiredD, givePn, duePn, split, payment,
    supported: TREATY_CARRIER_ACTIONS.has(actionId),
    payerSide: proposerIsPlayer ? 'proposer' : 'responder',
  };
}

/** Plan nośnika dopłaty D dla gracza-płatnika (wynik treatyCarrierPlanForPlayerPayer). */
export interface TreatyCarrierPlan {
  requiredD: number;
  givePn: number;
  duePn: number;
  split: PeacePwPowerSplit;
  payment: TreatyPaymentResult;
  /** Strona koszyka płatnika-gracza: 'proposer' = giveItems (gracz proponuje), 'responder' = receiveItems (AI proponuje). */
  payerSide: 'proposer' | 'responder';
  /** false = akcja spoza zweryfikowanego zakresu wykonania (granice, wasal): nośnik nie przelewa, bramka odrzuca jak dotąd. */
  supported: boolean;
}

/**
 * R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1: traktaty, których ścieżka akceptacji (main.ts, gałąź transferu giveItems)
 * jest zweryfikowana dla nośnika dopłaty. Granice (przemarsz) i wasal (r2): zawarcie idzie gałęzią `else if` w main.ts
 * (transferBasketItems z payload.giveItems / receiveItems) — koszyk nośnika jest przelewany razem z traktatem.
 * Kierunek (r3, zarzut 1): płatnik = gracz także gdy to AI proponuje (pozycje w receiveItems, treatyCarrierPayloadPatch).
 */
const TREATY_CARRIER_ACTIONS: ReadonlySet<string> = new Set(['nap', 'sojusz_defensywny', 'sojusz_pelny', 'granice', 'wasal']);

/** Podsumowanie dopłaty nośnika do okna propozycji (etykiety z treatyPaymentLabel, bez surowych ID). */
export interface TreatyPaymentUiInfo {
  label: string;
  coveredPn: number;
  shortfallPn: number;
  full: boolean;
}

function treatyPaymentUiInfo(plan: TreatyCarrierPlan): TreatyPaymentUiInfo {
  const hasItems = plan.payment.techs.length + plan.payment.tail.length + plan.payment.extra.length > 0;
  return {
    label: hasItems ? treatyPaymentLabel(plan.payment).replace('Dopłata: ', '') : '',
    coveredPn: plan.payment.coveredPn,
    shortfallPn: plan.payment.shortfallPn,
    full: plan.payment.full,
  };
}

function treatyParityPowerGate(
  actionId: string,
  payload: ProposalPayload,
  relation: Relation,
  pnOpts: ResolveProposalPnOptions,
  treatyPower: { powerPlayer: number; powerOther: number } | undefined,
  wearinessL = 0,
  payerStock?: Readonly<Record<string, number>>,
  era?: number,
  techs?: CarrierTechs,
): ProposalEvalResult | null {
  const plan = treatyCarrierPlanForPlayerPayer(actionId, payload, relation, pnOpts, treatyPower, wearinessL, payerStock, era, techs);
  if (!plan) return null;
  // Nośnik pokrywa całą dopłatę D (zapasy płatnika) → bramka przepuszcza; przelew wykonuje ścieżka akceptacji
  // (treatyCarrierForAcceptance / attachTreatyCarrier), a nie tekst oferty.
  if (plan.supported && plan.payment.full) return null;
  const hasStock = plan.supported && (plan.payment.tail.length > 0 || plan.payment.extra.length > 0);
  const hint = hasStock
    ? ` (możesz dopłacić: ${treatyPaymentLabel(plan.payment).replace('Dopłata: ', '')}; brakuje jeszcze ${plan.payment.shortfallPn} PN)`
    : ` (brak zapasów płatnika na dopłatę: brakuje ${plan.payment.shortfallPn} PN)`;
  return {
    accepted: false,
    reason: `Brakuje ${plan.duePn} PW do parytetu siły — słabszy gracz dopłaca D = ${plan.split.D} PW `
      + `(po rabacie relacji: ${plan.requiredD}; r = ${plan.split.r.toFixed(2)})${hint}`,
    treatyPayment: treatyPaymentUiInfo(plan),
  };
}

/** Technologie płatnika-gracza i drugiej strony z kontekstu oceny (stopień technologii nośnika). Brak pól = puste listy. */
function treatyCarrierTechsOf(ctx: ProposalEvalContext): CarrierTechs {
  return { payerTechs: ctx.playerTechs ?? [], otherTechs: ctx.partnerTechs ?? [], tempoGry: ctx.tempoGry };
}

/**
 * Dołącza do wyniku akceptacji (accepted = true) pozycje nośnika dopłaty, gdy nośnik pokrywa D w całości.
 * Ścieżka akceptacji w main.ts dopisuje `treatyCarrier.items` do giveItems gracza przed przelewem.
 */
function attachTreatyCarrier(
  proposal: DiplomaticProposal,
  ctx: ProposalEvalContext,
  result: ProposalEvalResult,
): ProposalEvalResult {
  if (!result.accepted || !ctx.treatyPower) return result;
  // Te same opcje co w evaluateProposalImpl (pnOpts), żeby givePn w planie = givePn w bramce.
  const pnOpts: ResolveProposalPnOptions = {
    difficulty: ctx.difficulty ?? 'normal',
    proposerOwnerId: proposal.proposerOwnerId,
    playerOwnerId: 0,
    actionId: proposal.actionId,
    tradeEra: ctx.tradeEra,
    ...proposalPnTurnsMultiplier(proposal.payload),
  };
  const plan = treatyCarrierPlanForPlayerPayer(
    proposal.actionId, proposal.payload, ctx.relation, pnOpts,
    ctx.treatyPower, treatyWearinessLevelOf(ctx), ctx.playerStock ?? ctx.payerStock, ctx.tradeEra,
    treatyCarrierTechsOf(ctx),
  );
  if (!plan || !plan.supported || !plan.payment.full) return result;
  // Technologie najpierw (stopień 1), potem ogon (złoto/metale/rudy): pozycje koszyka `typ: 'tech'` przelewa
  // transferBasketItems (grantTechToOwner = odkrycie dla odbiorcy).
  const techItems = plan.payment.techs.map(t => ({ typ: 'tech' as const, id: t.name, ilosc: 1 }));
  const items = [...techItems, ...peaceTailBasketItems(plan.payment.tail)];
  if (items.length === 0) return result;
  return {
    ...result,
    treatyCarrier: { items, coveredPn: plan.payment.coveredPn, side: plan.payerSide },
    treatyPayment: treatyPaymentUiInfo(plan),
  };
}

/**
 * r3 (zarzut 3 FC r2): dopisuje nośnik dopłaty do właściwej strony koszyka traktatu. Gracz proponuje → pozycje płatnika
 * idą do `giveItems` (gracz oddaje); AI proponuje → gracz odpowiada, pozycje idą do `receiveItems` (gracz oddaje).
 * Czysta: używana przez main.ts przed gałęzią przelewu traktatu (transferBasketItems). Brak pozycji → payload bez zmian.
 */
export function treatyCarrierPayloadPatch<P extends { giveItems?: readonly BasketItem[]; receiveItems?: readonly BasketItem[] }>(
  payload: P,
  carrier: { side: 'proposer' | 'responder'; items: ReadonlyArray<{ typ: string; id: string; ilosc: number }> },
): P {
  if (carrier.items.length === 0) return payload;
  const items = carrier.items as unknown as BasketItem[];
  if (carrier.side === 'proposer') return { ...payload, giveItems: [...(payload.giveItems ?? []), ...items] };
  return { ...payload, receiveItems: [...(payload.receiveItems ?? []), ...items] };
}

/**
 * Bramka PN traktatu @ Relacji (mod ±90%). Zwraca wynik odrzucenia lub null = OK.
 *
 * Pokój: propozycja pokoju liczy się jako PN traktatu @ Relacji (+ słodzik z koszyka).
 * Inne traktaty (NAP, sojusz…): próg Relacji jest główną bramką; koszyk to
 * słodzik / wymiana. Dawniej: jakikolwiek giveItems wymagał givePn ≥ pełne PN
 * traktatu (~200 przy NAP) — UI doliczało bazę NAP do obu stron (210=210,
 * bilans 0), a silnik odrzucał 10¤ vs 10¤. Maciej 2026-07-30.
 */
function treatyPnGate(
  actionId: string,
  payload: ProposalPayload,
  relation: Relation,
  pnOpts?: ResolveProposalPnOptions,
  skipTruceFlatGate = false,
): ProposalEvalResult | null {
  const basePn = treatyBasePnFromConfig(actionId, payload);
  if (basePn <= 0) return null;
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  const proposerIsPlayer = (pnOpts?.proposerOwnerId ?? 0) === (pnOpts?.playerOwnerId ?? 0);
  const relTotal = treatyEvalRelationTotal(relation);

  // R-WEB-TRUCE-Q1 (runda 2): rozejm dzieli bramkę PW pokoju (ta sama formuła i komunikat).
  // R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (runda 2): rozejm z parytetem (autor = gracz) ma bramkę
  // parytetu (treatyParityPowerGate, X = 2000 × (1 − L)) zamiast bramki pokoju z nieskalowaną bazą.
  if ((actionId === 'pokoj' || actionId === 'rozejm') && !(actionId === 'rozejm' && skipTruceFlatGate)) {
    const { offerPn, required } = peaceProposalOfferPn(givePn, receivePn, basePn, relation, proposerIsPlayer);
    if (offerPn < required) {
      return {
        accepted: false,
        reason: `Oferta za niska na pokój (wymagane ≥ ${required} PW @ Relacji, baza ${basePn})`,
      };
    }
    return null;
  }

  // R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A: sprawdzamy OBIE strony koszyka (nie tylko
  // `give`) — inaczej koszyk „tylko odbieram" (receiveItems bez giveItems) omija
  // bramkę fair-trade poniżej, bo hasBasket byłby false. Realne dla nap/sojusz/
  // granice/wasal/umowa_szlakow/umowa_handlowa odkąd te akcje wypadły z
  // PROPOSER_PW_FAIRNESS_ACTIONS (ta funkcja jest teraz ich jedyną ochroną koszyka).
  // ŚWIADOMIE zawężone do proposerIsPlayer (jak dawna proposerUnfairToPartnerGate
  // miała `if (!proposerIsPlayer) return null;`) — decyzja Q1=A dotyczy WYŁĄCZNIE
  // komunikatu (bug UX), nie logiki akceptacji; poszerzenie tej bramki na AI-jako-
  // proponenta zmieniałoby balans/mechanikę akceptacji poza literą decyzji, co
  // wymaga osobnej ABC (R-PROC-ABC-BALANS) — zgłoszone jako temat na przyszłość,
  // nie wdrożone tutaj.
  if (!proposerIsPlayer) return null;
  const hasBasket = givePn > 0 || receivePn > 0
    || (payload.giveItems?.length ?? 0) > 0
    || (payload.receiveItems?.length ?? 0) > 0;
  if (!hasBasket) return null;
  // Dwustronna wymiana przy traktacie — tylko fair trade koszyka (bez dublowania bazy NAP).
  if (receivePn > 0) {
    if (!pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
      // P-DYPLO-BILANS-GATE-NIESPOJNY runda 2 (N1, Evaluator FAIL c94de5c8): TA bramka
      // odrzuca `umowa_handlowa`/`umowa_szlakow` PRZED switch(actionId), więc dawniej
      // wynik nie niósł `pwBalance` w ogóle — UI (balancePanelDataFromRows,
      // renderPnBalancePanelHtml) spadał na stary, niespójny surowy net
      // myOfferPn−theirOfferPn ("Bilans +30 zielone" mimo odrzucenia). `fairMin` to
      // DOKŁADNIE ta sama liczba, którą właśnie policzył pnDealAcceptedByAi (jedyne
      // źródło progu tutaj — ta ogólna bramka nie ma dostępu do mnożnika chęci AI
      // per-akcja, w przeciwieństwie do handelFairnessGate).
      // EN: this gate rejects `umowa_handlowa`/`umowa_szlakow` BEFORE switch(actionId),
      // so the result used to carry no `pwBalance` at all — the UI fell back to the old,
      // inconsistent raw net. `fairMin` is the exact same number pnDealAcceptedByAi just
      // computed (this generic gate has no access to the per-action AI willingness
      // multiplier, unlike handelFairnessGate).
      const fairMin = diplomacyFairGivePn(receivePn, Math.min(100, relTotal));
      return {
        accepted: false,
        reason: `Oferta nieuczciwa dla partnera — poniżej wartości PW @ Relacji (masz ${givePn} PW, potrzeba więcej wobec ${receivePn} PW od partnera)`,
        pwBalance: givePn - fairMin,
      };
    }
    return null;
  }
  // Jednostronny słodzik: nie wymagaj pełnego PN traktatu z koszyka — próg Relacji
  // (+ sweetenerEasePoints) wystarczy. Mały słodzik nie może psuć akceptacji.
  return null;
}

/**
 * Bramka chęci do handlu przy akceptacji oferty gracza.
 * willingnessTrade dotyczy inicjatywy AI (decideAIDiplomacy); przy ocenie propozycji
 * na stole — uczciwa oferta PW @ Relacji nie może paść na „Brak chęci do handlu",
 * a sam traktat handlowy bez koszyka wymaga tylko progów Relacji (Maciej 2026-08-02).
 */
/**
 * Akcje z bilansem PW — gracz-proponent nie może dać partnerowi ujemnego netto.
 *
 * R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A (2026-08-07): PUSTY zbiór — ta ogólna,
 * przed-switchowa bramka jest teraz INERTNA dla wszystkich 8 akcji, które kiedyś
 * przez nią przechodziły. Nie usunięto samej funkcji (`proposerUnfairToPartnerGate`
 * niżej) ani jej wywołania w `evaluateProposal`, żeby nie zmieniać kształtu funkcji
 * przy okazji — ale przy pustym zbiorze `PROPOSER_PW_FAIRNESS_ACTIONS.has(actionId)`
 * jest zawsze `false`, więc funkcja zwraca `null` dla każdej akcji (early return,
 * patrz jej ciało).
 *
 * Historia rozdziału (dwie rundy naprawy tej samej klasy błędu):
 *  - `'handel'` naprawiony jako pierwszy, osobno (`R-DYPLOMACJA-HANDEL-BRAMKA-
 *    PRIORYTET-Q1=B+C`, 4 rundy, commit `9fc3821`) — dostał WŁASNĄ, w pełni
 *    autonomiczną bramkę `handelFairnessGate` bezpośrednio w `case 'handel'`
 *    (patrz niżej), z mnożnikiem chęci partnera i podłogą parytetu. Case 'handel'
 *    NIE odczytuje `PROPOSER_PW_FAIRNESS_ACTIONS` w żaden sposób — usunięcie
 *    `'handel'` STĄD (już zrobione w rundzie 3 tamtej naprawy) jest NIEZALEŻNE
 *    od tej zmiany i pozostaje bez zmian.
 *  - Pozostałe 7 akcji (`nap`, `sojusz_defensywny`, `sojusz_pelny`, `granice`,
 *    `wasal`, `umowa_szlakow`, `umowa_handlowa`, `pokoj`) miały tu ten sam
 *    kod uruchamiany BEZWARUNKOWO przed `switch(actionId)` — przy niskiej Relacji
 *    (relTotal<100) zawsze dawał generyczny komunikat „Przewaga u Ciebie" nawet
 *    przy PUSTYM koszyku, maskując dedykowane komunikaty w case'ach (np. „Relacja
 *    zbyt niska na pakt" dla `nap`). Rozdzielone tak (`R-DYPLO-FAIRNESS-GATE-
 *    ZAKRES-Q1=A`):
 *     - `nap`/`sojusz_defensywny`/`sojusz_pelny`/`granice`/`wasal` mają REALNE,
 *       niezerowe progi Relacji/Zaufania/Respektu we własnym case'ie
 *       (progNapRelacja=110, progSojuszRelacja=130, progGraniceRelacja=100,
 *       progWasalizacjaRespekt=70) — przy pustym koszyku wystarczy im próg
 *       case'a; ochrona przed koszykiem nieuczciwym dla partnera (np. „daj mi
 *       coś za darmo w koszyku") zostaje w `treatyPnGate` (uruchamianym i tak
 *       przed switch, dla WSZYSTKICH akcji traktatowych — poszerzonym niżej o
 *       sprawdzanie strony `receive`, nie tylko `give`).
 *     - `pokoj` i `umowa_szlakow`/`umowa_handlowa` mają w acceptance-points.json
 *       prog_relacja=0 (dla traktatów handlowych) albo brak progu w ogóle
 *       (pokój) — czyli w praktyce TA bramka była jedynym realnym wymuszeniem
 *       zapłaty bazy PN traktatu. Dostały więc DEDYKOWANĄ bramkę lokalnie w
 *       swoim case'ie (patrz `treatyBaseFairnessGap`), żeby nie otworzyć
 *       exploita „traktat/pokój za darmo".
 */
const PROPOSER_PW_FAIRNESS_ACTIONS: ReadonlySet<string> = new Set<string>([]);

/**
 * R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A: matematyka bazowej uczciwości PW traktatu —
 * identyczna z dawną, przed-switchową `proposerUnfairToPartnerGate` (gracz @
 * Relacji vs partner na stałej bazie), przeniesiona do współdzielonego helpera
 * używanego lokalnie w case'ach `pokoj` i `umowa_szlakow`/`umowa_handlowa`
 * (jedyne dwie grupy akcji bez realnego progu Relacji blokującego pusty koszyk —
 * patrz komentarz przy PROPOSER_PW_FAIRNESS_ACTIONS). Dodatnia wartość = ile PW
 * proponentowi brakuje do parytetu (0 lub ujemna = oferta uczciwa lub proponent
 * daje więcej).
 *
 * R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1: eksportowana (była lokalna) — patrz komentarz
 * przy `handelRequiredPn` powyżej, ten sam powód (reużycie w diplomacy-ai-offer-balance.ts
 * zamiast duplikowania matematyki bazy traktatu).
 */
export function treatyBaseFairnessGap(
  basePn: number,
  givePn: number,
  receivePn: number,
  relTotal: number,
): number {
  const playerRequired = effectiveTreatyPnRequired(basePn, relTotal);
  const partnerRequired = partnerTreatyPnRequired(basePn);
  const proposerDisplay = playerRequired + givePn;
  const responderDisplay = partnerRequired + receivePn;
  return responderDisplay - proposerDisplay;
}

/**
 * Bramka bilateralnego netto PW (proponent vs respondent) — spójna z
 * computePlayerAcceptanceSides / incomingTradeNetBalancePw (R-PW-ACCEPT-OVERPAY-Q1=A).
 * Ujemne netto = respondent oddaje więcej niż proponent → AI jako respondent odrzuca.
 * pnDealAcceptedByAi @ wysokiej Relacji może przejść przy give < receive — ta bramka domyka lukę.
 * Po R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A dotyczy już tylko `'handel'` (patrz zbiór wyżej).
 */
function proposerUnfairToPartnerGate(
  actionId: string,
  payload: ProposalPayload,
  relation: Relation,
  pnOpts: ResolveProposalPnOptions,
): ProposalEvalResult | null {
  if (!PROPOSER_PW_FAIRNESS_ACTIONS.has(actionId)) return null;
  const proposerIsPlayer = (pnOpts.proposerOwnerId ?? 0) === (pnOpts.playerOwnerId ?? 0);
  if (!proposerIsPlayer) return null;
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  const hasBasket = givePn > 0 || receivePn > 0
    || (payload.giveItems?.length ?? 0) > 0
    || (payload.receiveItems?.length ?? 0) > 0;
  const basePn = treatyBasePnFromConfig(actionId, payload);
  if (basePn <= 0 && !hasBasket) return null;
  const relTotal = treatyEvalRelationTotal(relation);
  const playerTreaty = basePn > 0 ? effectiveTreatyPnRequired(basePn, relTotal) : 0;
  const partnerTreaty = basePn > 0 ? partnerTreatyPnRequired(basePn) : 0;
  const proposerDisplay = playerTreaty + givePn;
  const responderDisplay = partnerTreaty + receivePn;
  if (proposerDisplay < responderDisplay) {
    return {
      accepted: false,
      reason: `Przewaga u Ciebie — oferta nieuczciwa dla partnera (${responderDisplay - proposerDisplay} PW)`,
    };
  }
  if (receivePn > 0 && !pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
    return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji' };
  }
  return null;
}

function tradeWillingnessBlocksAcceptance(
  stance: ReturnType<typeof aiDiplomacyStance>,
  params: ReturnType<typeof getEffectiveDiplomacyParams>,
  givePn: number,
  receivePn: number,
  relTotal: number,
  payload: ProposalPayload,
): boolean {
  if (stance.willingnessTrade >= params.progHandelWillingnessMin) return false;
  const hasBasket = givePn > 0 || receivePn > 0
    || (payload.giveItems?.length ?? 0) > 0
    || (payload.receiveItems?.length ?? 0) > 0;
  if (!hasBasket) return false;
  if (pnDealAcceptedByAi(givePn, receivePn, relTotal)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1=B+C (2026-08-06/07): uczciwość PW @
// Relacji zostaje GŁÓWNYM kryterium akceptacji case'u 'handel'; chęć partnera
// do handlu (willingnessTrade) przestaje być osobną, wykluczającą bramką "przed"
// i staje się MODYFIKATOREM wymaganego progu PW (niska chęć podnosi próg, wysoka
// go obniża) — nigdy osobnym niezależnym odrzuceniem. Komunikat dla gracza zawsze
// pokazuje PRAWDZIWY powód z realnymi liczbami PW (nie generyczny tekst).
//
// KIERUNEK: modyfikator odzwierciedla chęć RESPONDENTA. Gdy respondentem jest
// realne AI (proposerIsPlayer, czyli gracz proponuje AI — najczęstszy scenariusz,
// dla którego mechanizm został zaprojektowany), stance.willingnessTrade to
// prawdziwa chęć tego AI i modyfikator ma sens. Gdy respondentem jest GRACZ
// (AI proponuje graczowi), "chęć AI" nikt nie pyta w tym kierunku — AI jest
// proponentem, nie respondentem — więc stance liczona przez stanceForEval(ctx)
// dla tego kierunku to sztuczne "nastawienie" cywilizacji gracza wstawione przez
// buildProposalEvalContext (main.ts) wyłącznie jako placeholder kontekstu, NIE
// prawdziwa chęć. Używanie jej jako modyfikatora fałszywie przypisywało winę
// odrzucenia "niechęci AI", której nikt nie liczył (regresja rundy 2, naprawiona
// tu przez wymuszenie multiplier=1 gdy responderIsPlayer===true).
//
// PODŁOGA PARYTETU (runda 4, naprawa FAIL rundy 3): niezależnie od modyfikatora,
// wymagany próg PW nigdy nie spada poniżej receivePn (parytet — „oddaje tyle ile
// bierze"). Ulga z wysokiej chęci respondenta może obniżać próg TYLKO w obszarze
// powyżej parytetu (realnie działa gdy relTotal < 100 pkt Relacji, gdzie fair >
// receivePn) — nigdy poniżej. Bez tej podłogi gracz mógł "skimować" do ~15%
// wartości transakcji przy relTotal=100 pkt (fair=receivePn=parytet) i wysokiej
// chęci partnera, dopłacając np. 5 PW zamiast oddać pełne 110 PW za 110 PW.
// ---------------------------------------------------------------------------

/** Max ulga progu PW przy willingnessTrade=1 (pełna chęć respondenta-AI do handlu). */
const HANDEL_WILLINGNESS_EASE_MAX_PCT = 0.15;
/** Max kara progu PW przy willingnessTrade=0 (zero chęci respondenta-AI do handlu). */
const HANDEL_WILLINGNESS_PENALTY_MAX_PCT = 0.20;

/**
 * Mnożnik wymaganego progu PW handlu — ciągła funkcja liniowa willingnessTrade
 * wokół punktu neutralnego params.progHandelWillingnessMin (multiplier=1 dokładnie
 * na progu, bez „martwej strefy" płaskiej wokół niego — obie gałęzie dochodzą do 1
 * z przeciwnych stron tym samym tempem względem odległości do progu).
 */
/**
 * R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1: eksportowana (była lokalna) — patrz komentarz przy
 * `handelRequiredPn` powyżej. `responderIsPlayer=true` (AI proponuje graczowi, dzisiejsza
 * jedyna ścieżka `enqueueNegotiationFromAiCmd`) zawsze zwraca 1 — no-op dla tej ścieżki;
 * realnie nietrywialna dopiero gdy responderem jest AI (np. kontroferta AI na propozycję
 * gracza, `generateCounterOffer`).
 */
export function handelWillingnessMultiplier(
  stance: ReturnType<typeof aiDiplomacyStance>,
  params: ReturnType<typeof getEffectiveDiplomacyParams>,
  responderIsPlayer: boolean,
): number {
  if (responderIsPlayer) return 1;
  const w = stance.willingnessTrade;
  const mid = params.progHandelWillingnessMin;
  if (w >= mid) {
    const span = Math.max(1e-6, 1 - mid);
    const t = Math.min(1, (w - mid) / span);
    return 1 - HANDEL_WILLINGNESS_EASE_MAX_PCT * t;
  }
  const span = Math.max(1e-6, mid);
  const t = Math.min(1, (mid - w) / span);
  return 1 + HANDEL_WILLINGNESS_PENALTY_MAX_PCT * t;
}

/** Komunikat odrzucenia bramki uczciwości handlu — realne liczby PW, prawdziwa przyczyna. */
function handelFairnessReject(
  givePn: number,
  requiredPn: number,
  multiplier: number,
): ProposalEvalResult {
  if (multiplier > 1) {
    const pct = Math.round((multiplier - 1) * 100);
    return {
      accepted: false,
      reason: `Niechęć partnera do handlu podniosła wymagany próg PW o ${pct}% `
        + `— oferta nieuczciwa dla partnera (wymagane ≥ ${requiredPn} PW, oferujesz ${givePn} PW)`,
    };
  }
  return {
    accepted: false,
    reason: `Oferta nieuczciwa dla partnera — poniżej uczciwej wartości PW @ Relacji `
      + `(wymagane ≥ ${requiredPn} PW, oferujesz ${givePn} PW)`,
  };
}

/**
 * R-WEB-AI-TRADE-WIRING-E2E-Q1 r3 (ABC A1): relTotal bramki uczciwosci dla ofert AI
 * (proponent) -> gracz (responder). 100 = wspolczynnik relacji 1 (handelRequiredPn clampuje
 * do 100): wymagane givePn >= receivePn. Podglad „Przyjmij" gracza (previewIncomingPlayerAccept,
 * netPw >= 0) wymaga receivePn >= givePn -- przeciecie to oferty „rowne za rowne".
 * Bramka gracz->AI NIE uzywa tej stalej.
 */
export const AI_PROPOSER_FAIRNESS_REL_TOTAL = 100;

/**
 * R-WEB-AI-TRADE-ONESHOT-OVERPAY-LIMIT-Q1: górny limit nadpłaty w jednorazowej ofercie
 * handlowej AI -> gracz. Ta sama reguła co cykliczna (A1): AI nie oddaje więcej PW, niż
 * otrzymuje (givePn <= receivePn). Dar (isGift) jest wyłączony — dar AI nie ma receivePn.
 * Zwraca true, gdy jednorazowa oferta handlowa (actionId 'handel', typ inny niż cykliczna)
 * z perspektywy proponenta AI przekracza ten limit. Jedyne miejsce tej reguły — wołane z
 * filtra enqueue w main.ts (boot, łańcuch komend AI -> gracz).
 */
export function aiOneshotHandelOverpaysPlayer(
  actionId: string | undefined,
  cmdType: string | undefined,
  payload: ProposalPayload,
  pnOpts?: ResolveProposalPnOptions,
): boolean {
  if (actionId !== 'handel' || cmdType === 'zaproponuj_wymiane_cykliczna') return false;
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  const isGift = payload.isGift === true
    || ((payload.giveItems?.length ?? 0) > 0 && !(payload.receiveItems?.length) && (payload.receivePn ?? 0) <= 0);
  const hasPnPath = givePn > 0 || receivePn > 0
    || (payload.giveItems?.length ?? 0) > 0 || (payload.receiveItems?.length ?? 0) > 0;
  return !isGift && hasPnPath && givePn > receivePn;
}

/**
 * Wymagany próg PW handlu @ Relacji × mnożnik chęci — JEDYNE miejsce, które to liczy
 * (handelFairnessGate i pwBalance przy sukcesie muszą użyć TEJ SAMEJ liczby, inaczej
 * wraca P-DYPLO-BILANS-GATE-NIESPOJNY). PODŁOGA PARYTETU (runda 4): nigdy poniżej receivePn.
 *
 * R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1: eksportowana (była lokalna) — jedyne miejsce, które
 * liczy ten próg, żeby generator startowej oferty AI (diplomacy-ai-offer-balance.ts) mógł
 * celować w DOKŁADNIE tę samą liczbę zamiast reimplementować/pomijać mnożnik chęci.
 */
export function handelRequiredPn(receivePn: number, relTotal: number, multiplier: number): number {
  const relForFair = Math.min(100, Math.max(1, relTotal));
  return Math.max(receivePn, Math.ceil(diplomacyFairGivePn(receivePn, relForFair) * multiplier));
}

/**
 * Bramka uczciwości PW handlu z modyfikatorem chęci (patrz komentarz bloku wyżej).
 * Zwraca wynik odrzucenia lub null = próg spełniony. Wynik odrzucenia niesie `pwBalance`
 * (givePn − requiredPn, ta sama liczba co bramka) — P-DYPLO-BILANS-GATE-NIESPOJNY.
 */
export function handelFairnessGate(
  givePn: number,
  receivePn: number,
  relTotal: number,
  multiplier: number,
): ProposalEvalResult | null {
  if (givePn <= 0 && receivePn <= 0) {
    return { accepted: false, reason: 'Brak wartości w ofercie', pwBalance: givePn - receivePn };
  }
  const requiredPn = handelRequiredPn(receivePn, relTotal, multiplier);
  if (givePn < requiredPn) {
    return { ...handelFairnessReject(givePn, requiredPn, multiplier), pwBalance: givePn - requiredPn };
  }
  return null;
}

/**
 * Ocena propozycji gracza (lub odwrotnej strony) przez AI/respondenta.
 * Pure function — bez mutacji stanu gry.
 */
export function evaluateProposal(
  proposal: DiplomaticProposal,
  ctx: ProposalEvalContext,
): ProposalEvalResult {
  // R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 r3: ocena w jawnej epoce umowy (ctx.tradeEra), nie w
  // epoce, którą akurat zostawił globalny stan (domyślna epoka handlu zostaje fallbackiem).
  const result = withDiplomacyTradeEra(ctx.tradeEra ?? diplomacyTradeEra(), () => evaluateProposalImpl(proposal, ctx));
  return attachTreatyCarrier(proposal, ctx, attachTreatyPowerSplit(proposal, ctx, result));
}

/**
 * R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (runda 3, zarzut 4): dołącza podział PW (S/W/D, r, moce) do wyniku oceny
 * traktatu z parytetem, żeby panel stołu pokazał ten sam wiersz co dla pokoju. Nie zmienia `accepted`/`reason`.
 * Pomija wyniki z wearinessInfo (pokój/rozejm mają już powerSplit w tej strukturze).
 */
function attachTreatyPowerSplit(
  proposal: DiplomaticProposal,
  ctx: ProposalEvalContext,
  result: ProposalEvalResult,
): ProposalEvalResult {
  if (!ctx.treatyPower || result.wearinessInfo || !treatyParityEnabled(proposal.actionId)) return result;
  const X = treatyParityBaseX(proposal.actionId, proposal.payload, treatyWearinessLevelOf(ctx));
  if (!(X > 0)) return result;
  const { powerPlayer, powerOther } = ctx.treatyPower;
  const split = peacePwPointsByPowerRatio(X, powerPlayer, powerOther);
  const relTotal = treatyEvalRelationTotal(ctx.relation);
  return {
    ...result,
    treatyPowerSplit: {
      playerPower: powerPlayer, otherPower: powerOther,
      r: split.r, S: split.S, W: split.W, D: split.D,
      dAfterRelief: effectiveTreatyPnRequired(split.D, relTotal),
      playerStronger: split.strongerSide === 'a',
    },
  };
}

/**
 * R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (r3): kompozytor ogona ceny pokoju dla GRACZA-płatnika. Z reszty `restPn` (po miastach i
 * pozycjach już oferowanych) składa złoto → brąz → żelazo → rudy z zapasów płatnika (pomniejszonych o to, co już leży w
 * `offered`) — TA SAMA funkcja co AI/AI↔AI (composePeaceTail). Brak zapasu (`stock` undefined) → null (brak składania).
 */
function composePlayerPeaceTail(
  restPn: number,
  stock: Readonly<Record<string, number>> | undefined,
  offered: ReadonlyArray<{ typ: string; id: string; ilosc?: number }>,
  era: number | undefined,
  giver: 'proposer' | 'responder',
): PeaceTailInfo | null {
  if (!stock || !(restPn > 0)) return null;
  const left: Record<string, number> = {};
  for (const k of PEACE_TAIL_ORDER) left[k] = Math.max(0, Math.floor(stock[k] ?? 0));
  for (const i of offered) {
    const k = i.typ === 'zloto' ? 'zloto' : i.id;
    if (k in left) left[k] = Math.max(0, left[k]! - Math.max(0, Math.floor(i.ilosc ?? 0)));
  }
  const t = composePeaceTail(restPn, {
    holdings: left,
    pnPerUnit: k => peaceTailPnPerUnit(k, era),
    stepOf: k => peaceTailStep(k, era),
  });
  return {
    items: t.tail,
    restPn: Math.ceil(restPn),
    coveredPn: t.coveredPn,
    shortfallPn: t.shortfallPn,
    applied: t.shortfallPn <= 0 && t.tail.length > 0,
    giver,
    label: peaceTailLabel(t.tail),
  };
}

function evaluateProposalImpl(
  proposal: DiplomaticProposal,
  ctx: ProposalEvalContext,
): ProposalEvalResult {
  const { actionId, proposerOwnerId, responderOwnerId, payload } = proposal;
  const { relation, stanWojny } = ctx;
  const p = getEffectiveDiplomacyParams(ctx.difficulty ?? 'normal');
  const pnOpts: ResolveProposalPnOptions = {
    difficulty: ctx.difficulty ?? 'normal',
    proposerOwnerId,
    playerOwnerId: 0,
    // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2 defekt r2): bez actionId pozycja 'miasto' wyceniana
    // jako null (fail-safe) → cesja miasta nie wchodziła do bilansu PW propozycji.
    actionId,
    tradeEra: ctx.tradeEra,
    ...proposalPnTurnsMultiplier(payload),
  };
  const score = relationScore(relation);
  // R-WEB-WAR-AGGRESSOR-FLAG-Q1: proponent z aktywną flagą agresora → gorszy próg/chęć (JSON).
  const proponentAgresor = czyAgresorAktywny(proposerOwnerId, ctx.turn);
  const stance = stanceForEval(ctx, proponentAgresor);

  // R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1 (r2): okno „po rozejmie” — propozycja pokoju GRACZA do AI. AI przyjmuje,
  // gdy pakiet gracza pokrywa cenę pokoju (truceEndPriceRule): waluta surowcowa (pasmo ≤20%) liczy wartość całego
  // pakietu, waluta miejska (pasmo >20%) liczy WYŁĄCZNIE miasta w giveItems. Niepokryta oferta w oknie (oraz poza
  // oknem / bez ceny) idzie dalej dotychczasową oceną bez zmian (dispatch r2: „w pozostałych przypadkach evaluateProposal”).
  const truceWindow = ctx.truceEndWindow;
  if (
    actionId === 'pokoj'
    && truceWindow?.open === true
    && truceWindow.requiredPn > 0
    && proposerOwnerId === (pnOpts.playerOwnerId ?? 0)
    && responderOwnerId !== (pnOpts.playerOwnerId ?? 0)
  ) {
    const offeredPn = resolveProposalPn(payload, pnOpts).givePn;
    const cityItemsTE = (payload.giveItems ?? []).filter(i => i.typ === 'miasto');
    const cityPnTE = cityItemsTE.length > 0
      ? resolveProposalPn({ giveItems: cityItemsTE, actionId }, pnOpts).givePn
      : 0;
    // R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1 (11A): waluta miejska bez cedowalnego miasta → wariant zastępczy surowcami
    // (truceEndSurowceSubstituteCovers, ta sama reguła co pickTruceEndSettlementPlan).
    const coveredTE = truceWindow.currency === 'miasto'
      ? cityPnTE >= truceWindow.requiredPn
        || truceEndSurowceSubstituteCovers(truceWindow.requiredPn, offeredPn, truceWindow.cityAvailable !== false)
      : offeredPn >= truceWindow.requiredPn;
    if (coveredTE) {
      return { accepted: true, reason: 'Pokój zawarty — cena po rozejmie pokryta', oneShotTrade: true };
    }
  }

  if (ctx.warState && peaceProposalBlocked(actionId, stanWojny, ctx.warState.turnsAtWar)) {
    return { accepted: false, reason: `Pokój i rozejm dostępne po ${PEACE_PROPOSAL_MIN_WAR_TURNS} pełnych turach wojny` };
  }

  if (actionId === 'pokoj' && !stanWojny) {
    return { accepted: false, reason: 'Pokój — brak trwającej wojny' };
  }
  if (actionId === 'rozejm' && !stanWojny) {
    return { accepted: false, reason: 'Rozejm — brak trwającej wojny' };
  }
  if (stanWojny && actionId !== 'trybut_oferta' && actionId !== 'ultimatum' && actionId !== 'pokoj' && actionId !== 'rozejm') {
    return { accepted: false, reason: 'Trwa wojna — ta akcja jest niedostępna' };
  }
  if (stanWojny && isCurrencyProposalForbiddenDuringWar(actionId, payload, true)) {
    return { accepted: false, reason: 'W wojnie pieniądze tylko w ugodzie pokojowej' };
  }
  if (TRIBUTE_PROPOSAL_ACTIONS.has(actionId) && tributeBlockedForCityState(ctx)) {
    return { accepted: false, reason: CITY_STATE_TRIBUTE_BLOCK_REASON };
  }

  const unfairToPartner = proposerUnfairToPartnerGate(actionId, payload, relation, pnOpts);
  if (unfairToPartner) return unfairToPartner;

  const wearinessL = treatyWearinessLevelOf(ctx);
  const parityOwnedByPlayer = ctx.treatyPower !== undefined && treatyParityEnabled(actionId)
    && (pnOpts.proposerOwnerId ?? 0) === (pnOpts.playerOwnerId ?? 0);
  const pnReject = treatyPnGate(actionId, payload, relation, pnOpts, parityOwnedByPlayer);
  if (pnReject) return pnReject;

  const parityReject = treatyParityPowerGate(
    actionId, payload, relation, pnOpts, ctx.treatyPower, wearinessL, ctx.playerStock ?? ctx.payerStock, ctx.tradeEra,
    treatyCarrierTechsOf(ctx),
  );
  if (parityReject) return parityReject;

  switch (actionId) {
    case 'nap': {
      if ((ctx.proposerWiarygodnosc ?? 0) < p.wiarygodnoscProgNapMin) {
        return {
          accepted: false, pwBalance: -1,
          reason: `Wiarygodność zbyt niska na pakt (wymagana ≥ ${p.wiarygodnoscProgNapMin})`,
        };
      }
      // R-WEB-DIPLO-NAP-TRUST-30-Q1: pakt wymaga TEŻ Zaufania ≥ progNapZaufanie (stała, bez ±trudność).
      // Fail-closed: brak wartości w parametrach = odrzut, nie pominięcie bramki.
      if (!(relation.zaufanie >= p.progNapZaufanie)) {
        return {
          accepted: false, pwBalance: -1,
          reason: `Zaufanie zbyt niskie na pakt (wymagane ≥ ${p.progNapZaufanie}, masz ${relation.zaufanie})`,
        };
      }
      // C-DYP-STOL-Q1=B: słodzik (giveItems/receiveItems w payload) obniża próg Relacji.
      const napEase = sweetenerEasePoints(payload, pnOpts);
      // R-DYPLO-PAKT-WETO-EKSPANSJA-Q1: „Ekspansja przy granicy" była TU binarnym wetem
      // (`if (ctx.ekspansjaPrzyGranicy) return accepted:false`) tuż POD progiem, który dwie
      // linijki wyżej jest jawnie kompensowalny słodzikiem. Pomiar: przy Relacji 200/200
      // i słodziku 100 000 ¤ pakt nadal był odrzucany — żadna Relacja, żaden słodzik go nie
      // przebijał. Flaga jest w main.ts czystą funkcją liczby miast („obie strony > 2 miasta"),
      // liczoną co turę, więc od ~3. miasta obu stron trwa BEZ KOŃCA i gracz nie ma żadnej
      // akcji, która ją zdejmuje — Pakt był strukturalnie nieosiągalny.
      // Żadne źródło projektowe nie ustanawia tego weta: `Dyplomacja/Dyplomacja-zasady.md`
      // §3.2, `Dyplomacja-DOKUMENTACJA-DEV.md:180` i `gra/data/diplomacy.json` modelują ten
      // czynnik WYŁĄCZNIE jako ciągłe −2 Zaufania/turę, w żadnej tabeli progów/warunków.
      // Dlatego weto zamienione na NARZUT na próg Relacji, kompensowalny tą samą drogą co
      // reszta tej bramki. Narzut = SWEETENER_EASE_MAX_POINTS (sufit słodzika), więc
      // MAKSYMALNY słodzik dokładnie go kasuje — to jest gwarancja, że warunek nigdy nie
      // jest nieosiągalny. Wartość WYPROWADZONA z istniejącej stałej, nie nowy balans.
      // R-WEB-DIPLO-NAP-UI-BORDER-THRESHOLD-Q1: próg liczy WSPÓLNY helper (ten sam co blokada UI).
      const napExpansionSurcharge = ctx.karaWspolnaGranica ? NAP_GRANICA_RELACJA_NARZUT : 0;
      const napThreshold = napRelacjaProgEfektywny(p.progNapRelacja, {
        karaWspolnaGranica: ctx.karaWspolnaGranica,
        proponentAgresor,
        napEase,
      });
      if (score < napThreshold) {
        return {
          accepted: false, pwBalance: -1,
          reason: napExpansionSurcharge > 0
            ? `Relacja zbyt niska na pakt (wymagana ≥ ${napThreshold}; +${napExpansionSurcharge}`
              + ' za wspólną granicę — dołóż do oferty lub podnieś Relację)'
            : `Relacja zbyt niska na pakt (wymagana ≥ ${napThreshold})`,
        };
      }
      if (pairHasKind(ctx.activeDeals, proposerOwnerId, responderOwnerId, RodzajTraktatu.PaktNieagresji)) {
        return { accepted: false, pwBalance: -1, reason: 'Pakt nieagresji już obowiązuje' };
      }
      const napExpiry = resolveNapDealExpiry(ctx.turn, payload);
      const deal = buildDeal(
        RodzajTraktatu.PaktNieagresji,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        napExpiry.wygasaTura,
      );
      return { accepted: true, pwBalance: 0, reason: napExpiry.label, deal };
    }

    case 'sojusz_defensywny':
    case 'sojusz_pelny': {
      if ((ctx.proposerWiarygodnosc ?? 0) < p.wiarygodnoscProgSojuszMin) {
        return {
          accepted: false, pwBalance: -1,
          reason: `Wiarygodność zbyt niska na sojusz (wymagana ≥ ${p.wiarygodnoscProgSojuszMin})`,
        };
      }
      const kind = actionId === 'sojusz_defensywny' ? 'sojusz_defensywny' : 'sojusz_pelny';
      const milRatio = ctx.militaryRatio ?? 1;
      const adj = diplomacyAllianceStrengthAdjust(
        milRatio,
        ctx.proposerRespekt,
        ctx.responderRespekt,
        p,
      );
      // C-DYP-STOL-Q1=B: słodzik obniża progi tak samo jak przewaga militarna/Respekt
      // (diplomacyProposerStrengthEase) — komponuje się z istniejącą ulgą, nie ją zastępuje.
      // diplomacyTreatyMinRelacja i tak nie zejdzie poniżej progUmowaMinRelacja (twarda podłoga).
      const sojuszEase = sweetenerEasePoints(payload, pnOpts);
      // R-WEB-DIPLO-ALLIANCE-THRESHOLD-130-TRUST-90-Q1: rdzeń 130 Relacji + 90 Zaufania
      // (po słodziku/agresorze) wyłącza bramki siły (hegemon, kara siły, słaby proponent); gotowość AI zostaje (runda 2).
      const relThresholdCore = p.progSojuszRelacja - sojuszEase + deltaRelacjiSojusz(proponentAgresor);
      const coreMet = allianceCoreMet(relation.zaufanie, score, relThresholdCore, p, sojuszEase);
      const minZ = coreMet
        ? Math.max(0, p.progSojuszZaufanie - sojuszEase)
        : Math.max(0, diplomacyAllianceMinZaufanie(adj, milRatio, p) - sojuszEase);
      const minScore = coreMet
        ? diplomacyTreatyMinRelacja(relThresholdCore, p)
        : diplomacyTreatyMinRelacja(relThresholdCore - adj.ease.scoreThresholdDelta + adj.penaltyScore, p);
      // Runda 2 (A): gotowość AI ZOSTAJE przy rdzeniu 130/90 — pomijamy tylko karę siły (penaltyAlly).
      const minAlly = Math.max(
        0,
        p.progSojuszWillingnessMin - adj.ease.allyThresholdDelta + (coreMet ? 0 : adj.penaltyAlly),
      );

      if (!coreMet && adj.hegemonBlocksAlliance) {
        return {
          accepted: false, pwBalance: -1,
          reason: 'Hegemon nie potrzebuje sojuszu — wola wobec słabszego to trybut lub wasalizacja',
        };
      }
      if (relation.zaufanie < minZ) {
        return { accepted: false, pwBalance: -1, reason: `Sojusz wymaga Relacji ${minScore} i Zaufania ${minZ} (masz Zaufanie ${relation.zaufanie})` };
      }
      if (score < minScore) {
        return { accepted: false, pwBalance: -1, reason: `Sojusz wymaga Relacji ${minScore} i Zaufania ${minZ} (masz Relację ${score})` };
      }
      if (
        !coreMet &&
        milRatio < p.progSojuszSlabyProponentMilRatio &&
        ctx.proposerRespekt <= ctx.responderRespekt &&
        score < p.progUmowaMinRelacja
      ) {
        return { accepted: false, pwBalance: -1, reason: 'Za słaby proponent bez pełnej relacji — sojusz nierealny' };
      }
      if (stance.willingnessAlly < minAlly) {
        return {
          accepted: false, pwBalance: -1,
          reason: `Brak gotowości do sojuszu (gotowość ${stance.willingnessAlly.toFixed(2)}, wymagana ${minAlly.toFixed(2)})`,
        };
      }
      if (pairHasKind(ctx.activeDeals, proposerOwnerId, responderOwnerId, kind)) {
        return { accepted: false, pwBalance: -1, reason: 'Sojusz tego typu już istnieje' };
      }
      const deal = buildDeal(kind, proposerOwnerId, responderOwnerId, ctx.turn, null);
      const label = kind === 'sojusz_defensywny' ? 'Sojusz obronny' : 'Sojusz wojskowy';
      return { accepted: true, pwBalance: 0, reason: `${label} zawarty`, deal };
    }

    case 'trybut_zadanie': {
      const perTurn = payload.goldPerTurn ?? 0;
      if (perTurn < p.progTrybutMinGoldPerTurn) {
        return { accepted: false, pwBalance: -1, reason: `Minimalny trybut to ${p.progTrybutMinGoldPerTurn} ¤/turę` };
      }
      // C-DYP-STOL-Q1=B: słodzik obniża próg Respektu wymaganego do żądania trybutu.
      const trybutEase = sweetenerEasePoints(payload, pnOpts);
      const trybutRespektThreshold = Math.max(0, p.progTrybutZadanieMinRespekt - trybutEase);
      if (ctx.proposerRespekt <= trybutRespektThreshold) {
        return {
          accepted: false, pwBalance: -1,
          reason: `Żądanie trybutu wymaga Respekt > ${trybutRespektThreshold} (masz ${ctx.proposerRespekt})`,
        };
      }
      // Górny limit kwoty — skaluje się z Respektem proponenta (audyt #21, decyzja A5=A).
      const maxPerTurn = p.progTrybutZadanieMaxGoldBase
        + Math.max(0, ctx.proposerRespekt - p.progTrybutZadanieMinRespekt) * p.progTrybutZadanieMaxGoldPerRespekt;
      if (perTurn > maxPerTurn) {
        return {
          accepted: false, pwBalance: -1,
          reason: `Żądanie trybutu przekracza limit przy tym Respekcie (max ${Math.round(maxPerTurn)} ¤/turę)`,
        };
      }
      // Guard duplikatu — bez tego trybut/wasalizacja stackuje się co turę (audyt #21).
      if (pairHasKind(ctx.activeDeals, proposerOwnerId, responderOwnerId, RodzajTraktatu.Wasalizacja)) {
        return { accepted: false, pwBalance: -1, reason: 'Trybut/wasalizacja z tym państwem już obowiązuje' };
      }
      const trybutDurationTurns = resolveTreatyDurationTurns(payload) ?? null;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        // R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1: czas TRAKTATU (`treatyTurns`), nie
        // częstotliwość wymiany koszyka z `turns` (ta zostaje mnożnikiem wyceny PN).
        trybutDurationTurns != null ? ctx.turn + trybutDurationTurns : null,
        {
          payerOwnerId: responderOwnerId,
          receiverOwnerId: proposerOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, pwBalance: 0, reason: `Trybut ${perTurn} ¤/turę`, deal };
    }

    case 'pokoj':
    case 'rozejm': {
      // R-WEB-TRUCE-Q1: rozejm dzieli CAŁĄ gałąź pokoju (bramki czasu wojny, siły, PW);
      // różni się wyłącznie bazą PW (klucz actionId) i poprawnością długości 5/10/15.
      if (actionId === 'rozejm' && normalizeTruceDuration(payload.turns ?? TRUCE_DEFAULT_TURNS) == null) {
        return { accepted: false, reason: 'Rozejm: dozwolone długości to 5, 10 lub 15 tur' };
      }
      // R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A, wymóg #2 (ostrożność „darmowy pokój"):
      // peaceProposalOfferPn ma samospełniający się warunek przy pustym koszyku
      // (offerPn = required + max(0, 0-0) = required, więc offerPn < required
      // nigdy nie jest prawdą) — jedyną realną ochroną przed „darmowym pokojem
      // podczas wojny" była dawna generyczna proposerUnfairToPartnerGate. Ta
      // bramka przenosi TĘ SAMĄ matematykę (treatyBaseFairnessGap) lokalnie,
      // z dedykowanym komunikatem, żeby pokój dalej wymagał albo Relacji bliskiej
      // neutralnej, albo dopłaty koszykiem pokrywającej różnicę.
      const { givePn: givePnOffered, receivePn } = resolveProposalPn(payload, pnOpts);
      // r3: wartość oferty gracza + ogon złożony automatycznie z reszty ceny (kompozytor) — jedna liczba dla bramek uczciwości PW.
      let givePn = givePnOffered;
      const basePnCfg = treatyBasePnFromConfig(actionId, payload);
      // R-WEB-PEACE-RULES-Q1 R5: gdy GRACZ jest autorem warunków, a respondentem jest AI (nie
      // miasto-państwo), bramka AI: minimalny czas wojny, „czuje się silniejsze" i mnożnik ceny.
      const r5AuthorOwnerId = ctx.authorOwnerId ?? proposerOwnerId;
      const r5PlayerAuthors = r5AuthorOwnerId === (pnOpts.playerOwnerId ?? 0);
      const r5RespondentIsAi = responderOwnerId !== (pnOpts.playerOwnerId ?? 0);
      let basePn = basePnCfg;
      // R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1: Z (PW) zmęczenia wojną w tabeli; undefined poza gałęzią R5.
      let wearyPwItem: number | undefined;
      // R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (r3): ogon złożony z reszty ceny (obie gałęzie: silniejsza AI i słabszy gracz).
      let autoPeaceTail: PeaceTailInfo | undefined;
      let wearyInfo: WearinessPwInfo | undefined;
      let wearySide: 'ai' | 'player' = 'ai';
      // R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1 r3 (zarzut 1 Evaluatora, DODATEK pkt 3): kierunek AI -> gracz.
      // Gdy AI jest autorem pokoju, a respondentem jest gracz, informacja o zmęczeniu trafia do kolumny GRACZA
      // (bez pozycji PW — patrz komentarz niżej). Informacyjnie: basePn / pokojPwBalance / accepted NIE zmieniaja sie w tej galezi.
      if (ctx.warState && !r5PlayerAuthors && !r5RespondentIsAi && !ctx.responderIsCityState) {
        const aiToPlayerLevel = warWearinessLevel({
          turnsAtWar: Math.max(0, ctx.warState.turnsAtWar),
          lostCitiesTotal: Math.max(0, ctx.warState.lostCitiesResponder),
          turnsSinceCityChange: ctx.warState.turnsSinceCityChange,
        });
        // R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1: stara pozycja Z (krzywa kwadratowa) usunieta — jedyna cena pokoju to
        // wearinessPeaceCashPn(poziom pary).
        // Wiersz „Zmęczenie wojną” zostaje tylko jako informacja (tury, miasta, poziom) bez pozycji PW.
        wearyPwItem = undefined;
        // JEDNA cena (DR-2): ta sama funkcja co w ofercie AI (ai.ts), pokazana w panelu; bramka relacji jak w gałęzi gracz→AI.
        const aiToPlayerPriceGate = evaluatePeaceAiGate(
          { rw: 0.5, turnsAtWar: Math.max(0, ctx.warState.turnsAtWar), lostCitiesInWar: 0 },
          resolveWarPeaceProfile(typeof ctx.proposerPlayer?.typCywilizacji === 'string' ? ctx.proposerPlayer.typCywilizacji : undefined),
        );
        const aiToPlayerPriceMult = aiToPlayerPriceGate.verdict === 'ok' ? aiToPlayerPriceGate.priceMultiplier : 1;
        const aiToPlayerCenaPn = basePnCfg * aiToPlayerPriceMult > 0 ? wearinessPeaceCashPn(aiToPlayerLevel) : 0;
        if (actionId === 'pokoj') basePn = aiToPlayerCenaPn;
        wearyInfo = {
          turnsAtWar: Math.max(0, ctx.warState.turnsAtWar),
          lostCities: Math.max(0, ctx.warState.lostCitiesResponder),
          level: aiToPlayerLevel,
          ...(actionId === 'pokoj' ? { cenaPokojuPn: aiToPlayerCenaPn } : {}),
        };
        wearySide = 'player';
      }
      if (ctx.warState && r5PlayerAuthors && r5RespondentIsAi && !ctx.responderIsCityState) {
        const r5Profile = resolveWarPeaceProfile(
          typeof ctx.responderPlayer?.typCywilizacji === 'string' ? ctx.responderPlayer.typCywilizacji : undefined,
        );
        const r5Gate = evaluatePeaceAiGate(
          {
            rw: ctx.warState.responderRw,
            turnsAtWar: Math.max(0, ctx.warState.turnsAtWar),
            lostCitiesInWar: Math.max(0, ctx.warState.lostCitiesResponder),
            // R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1: pozycja respondenta wg siły militarnej (main.ts).
            pozycjaMilitarna: ctx.warState.responderPozycjaMilitarna,
          },
          r5Profile,
        );
        if (r5Gate.verdict === 'too_early') {
          return { accepted: false, reason: r5Gate.reason ?? 'AI odrzuca pokój' };
        }
        // R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1: JEDNA cena pokoju = wearinessPeaceCashPn(L) (malejaca z
        // zmeczeniem pary; 0 przy L = 1). Pozycja Z (krzywa kwadratowa) i stala cena relacyjna odpadaja: cala cena
        // pokrywana miastami (stolica nigdy). Bramka relacji: cena 0, gdy wycena bazowa daje 0 (r5Gate.priceMultiplier).
        const wearyLevel = warWearinessLevel({
          turnsAtWar: Math.max(0, ctx.warState.turnsAtWar),
          lostCitiesTotal: Math.max(0, ctx.warState.lostCitiesResponder),
          turnsSinceCityChange: ctx.warState.turnsSinceCityChange,
        });
        const cenaPokojuPn = basePnCfg * r5Gate.priceMultiplier > 0 ? wearinessPeaceCashPn(wearyLevel) : 0;
        wearyPwItem = undefined;
        wearyInfo = {
          turnsAtWar: Math.max(0, ctx.warState.turnsAtWar),
          lostCities: Math.max(0, ctx.warState.lostCitiesResponder),
          level: wearyLevel,
          ...(actionId === 'pokoj' ? { cenaPokojuPn } : {}),
        };
        // Rozejm (osobna baza PW z diplomacy-acceptance-points.json) NIE podlega cenie pokoju — decyzja dispatchu (cena dotyczy pokoju, nie rozejmu).
        const cenaWymaganaPn = actionId === 'pokoj' ? cenaPokojuPn : basePnCfg * r5Gate.priceMultiplier;
        basePn = cenaWymaganaPn;
        // R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 (zarzut 5 / wymóg 4): złoto i surowce NIE są
        // słodzikiem pokoju ani rozejmu — w każdej pozycji (słabsza i silniejsza AI) oferta z nimi jest
        // odrzucana. Słodzikiem jest wyłącznie miasto (poniżej, dla 'stronger').
        // R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (ABC 2026-11-18, wariant A): ZAKAZ złota/surowców wycofany DLA
        // POKOJU — końcówka ceny pokoju (po miastach) może być złotem i metalami/rudami (ogon, peace-tail-payment).
        // Rozejm bez zmian: złoto i surowce nie są słodzikiem rozejmu.
        const nonCityItems = (payload.giveItems ?? []).filter(i => i.typ === 'zloto' || i.typ === 'surowiec_ilosc');
        if (actionId !== 'pokoj' && nonCityItems.length > 0) {
          return {
            accepted: false,
            reason: 'Złoto i surowce nie są słodzikiem pokoju ani rozejmu — w ofercie wymagane są wyłącznie miasta',
          };
        }
        // Ogon pokoju: tylko kolejność z danych (PEACE_TAIL_ORDER), nie więcej sztuk niż zapas płatnika (ctx.payerStock).
        const tailKeyOf = (i: { typ: string; id: string }): string => (i.typ === 'zloto' ? 'zloto' : i.id);
        const tailBad = nonCityItems.find(i => !PEACE_TAIL_ORDER.includes(tailKeyOf(i)));
        if (tailBad) {
          return { accepted: false, reason: `Ogon ceny pokoju: nieobsługiwany surowiec „${tailKeyOf(tailBad)}” (dozwolone: złoto, brąz, żelazo, rudy)` };
        }
        if (ctx.payerStock) {
          const short = nonCityItems.find(i => (i.ilosc ?? 0) > (ctx.payerStock?.[tailKeyOf(i)] ?? 0));
          if (short) {
            return { accepted: false, reason: `Ogon ceny pokoju: brak zapasu „${tailKeyOf(short)}” w państwie płatnika` };
          }
        }
        const tailPn = nonCityItems.length > 0
          ? resolveProposalPn({ giveItems: nonCityItems, actionId }, pnOpts).givePn
          : 0;
        // R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1: militarnie silniejsza AI odrzuca pokój, chyba że
        // oferta zawiera MIASTO gracza o wartości PN ≥ ceny. Liczą się WYŁĄCZNIE miasta w giveItems
        // (pieniądze i surowce nie są słodzikiem). Cena jak dotąd (bez mnożnika od siły).
        if (r5Gate.verdict === 'stronger') {
          const cityItems = (payload.giveItems ?? []).filter(i => i.typ === 'miasto');
          const cityGivePn = cityItems.length > 0
            ? resolveProposalPn({ giveItems: cityItems, actionId }, pnOpts).givePn
            : 0;
          // R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1: silna AI nadal wymaga miasta o wartości PEŁNEJ ceny C
          // (regula siły bez wygasania, R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1; testy C1/C2 diplo-peace-balance-accept
          // i S3b/S3c diplo-war-peace-sim czerwieniały przy wymaganiu R = C − Z). Rozjazd z tabelą przy Z = C
          // = DECISION_REQUIRED (raport, sekcja BLOKADY).
          // Ogon (złoto/metale/rudy po miastach) liczy się TAKŻE przy odrzuceniu i ZASTĘPUJE brakujące miasto (ABC B).
          if (!(cityGivePn + tailPn >= cenaWymaganaPn)) {
            // Kompozytor ogona (ABC B): reszta po miastach i oferowanym złocie/surowcach ZASTĘPUJE brakujące miasto, gdy płatnik (gracz)
            // ma zapasy; niepełny ogon nie wystarcza (AI odrzuca, tooltip pokazuje, ile można dopłacić).
            const comp = actionId === 'pokoj'
              ? composePlayerPeaceTail(
                cenaWymaganaPn - cityGivePn - tailPn, ctx.playerStock ?? ctx.payerStock, nonCityItems, ctx.tradeEra,
                proposerOwnerId === (pnOpts.playerOwnerId ?? 0) ? 'proposer' : 'responder',
              )
              : null;
            if (comp?.applied) {
              autoPeaceTail = comp;
              givePn += comp.coveredPn;
              wearyInfo = wearyInfo ? { ...wearyInfo, peaceTail: comp } : wearyInfo;
            } else {
              if (comp && wearyInfo) wearyInfo = { ...wearyInfo, peaceTail: comp };
              return {
                accepted: false,
                reason: `${r5Gate.reason ?? 'AI odrzuca pokój'} — Silniejsza AI wymaga miasta o wartości ≥ ${cenaWymaganaPn} PW `
                  + `(cena pokoju maleje ze zmęczeniem wojną); miasta w ofercie warte ${Math.round(cityGivePn)} PN`
                  + (tailPn > 0 ? `, złoto i rudy warte ${Math.round(tailPn)} PN` : '')
                  + `, wymagane ${cenaWymaganaPn} PN`
                  + (comp && comp.items.length > 0 ? ` (możesz dopłacić: ${comp.label.replace('Dopłata: ', '')}, brakuje jeszcze ${comp.shortfallPn} PN)` : ''),
                wearinessInfo: wearyInfo,
                ...(comp ? { peaceTail: comp } : {}),
              };
            }
          }
        }
      }
      const proposerIsPlayer = proposerOwnerId === (pnOpts.playerOwnerId ?? 0);
      const relTotal = treatyEvalRelationTotal(relation);
      // R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (runda 2): rozejm z parytetem — X = 2000 × (1 − L) (jedna cena, jak
      // wearinessPeaceCashPn dla pokoju, ale z bazą rozejmu). Dotyczy też AI-autora (ta sama formuła).
      if (actionId === 'rozejm' && treatyParityEnabled(actionId) && ctx.treatyPower !== undefined
        && proposerOwnerId === (pnOpts.playerOwnerId ?? 0) && basePn > 0) {
        basePn = treatyParityBaseX(actionId, payload, wearinessL);
      }
      // OBRONA runda 2 (P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA, zarzut 1 Evaluatora,
      // POTWIERDZONY żywym testem — AI proponuje pokój z pustym koszykiem podczas wojny →
      // dawniej ZAWSZE `accepted:true` BEZ `pwBalance`, dokładnie ten sam strukturalny defekt
      // (traktat bez własnej bramki PW) naprawiony tej rundy dla 6 innych case'ów, zostawiony
      // tu). `gap` (treatyBaseFairnessGap) liczony TERAZ ZAWSZE, nie tylko w gałęzi
      // gracz-proponent — to DOKŁADNIE ta sama, już wcześniej zaakceptowana jako poprawna,
      // role-agnostyczna matematyka, którą `diplomacy-ai-offer-balance.ts::responderPwSurplus`
      // woła BEZWARUNKOWO (bez `if (proposerIsPlayer)`) dla generatora WŁASNEJ oferty AI —
      // komentarz tam: "dodatni gap = proponentowi brakuje do parytetu → ujemny surplus
      // respondenta (dokładnie ta sama liczba, ze znakiem odwróconym, co evaluateProposal
      // zwraca jako pwBalance = -gap)". ZERO zmian `accepted`/`reason` — bramka ODRZUCENIA
      // (gap>0 → reject) zostaje WYŁĄCZNIE w gałęzi gracz-proponent, tak jak przed tą poprawką
      // (R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A: poszerzenie NA `accepted` dla AI-proponenta to
      // osobna ABC balansu, nie wdrożone tu) — to wyłącznie dopisanie liczby `pwBalance` dla
      // OBU kierunków, którą downstream GOAL3 (`balancePanelDataFromRows`) używa jako twardej,
      // NIEZALEŻNEJ od `accepted` bramki UI „Przyjmij" (dokładnie ten sam mechanizm, którym
      // GOAL3 już dziś blokuje np. WASAL mimo `accepted:true` — patrz tamten komentarz).
      // OBRONA runda 3 (P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA, regresja zgłoszona przez
      // niezależnego Evaluatora rundy 2, dispatch 00-dispatch.md rundy 3): runda 2 (komentarz
      // wyżej) wołała `treatyBaseFairnessGap` BEZWARUNKOWO TĄ SAMĄ matematyką dla OBU kierunków.
      // Wewnątrz tej funkcji rabat Relacji (`effectiveTreatyPnRequired`) jest ZAWSZE dodawany do
      // PIERWSZEGO argumentu danych (`givePn`), a płaska baza (`partnerTreatyPnRequired`) do
      // DRUGIEGO (`receivePn`) — poprawne WYŁĄCZNIE gdy proposerIsPlayer (pierwszy argument =
      // WŁASNY wkład gracza-proponenta). Gdy proponentem jest AI, pierwszy argument (`givePn`)
      // to wkład AI — rabat trafiał do AI, płaska baza do gracza — DOKŁADNIE odwrotnie niż
      // dokumentuje `effectiveTreatyPnRequired`: "Partner (AI) zawsze na bazie". Żywy dowód
      // Evaluatora: pusty koszyk + zła/neutralna/bardzo dobra Relacja podczas wojny → pwBalance
      // ujemny WE WSZYSTKICH (np. -450/-355/-355), bo `partnerTreatyPnRequired(basePn)`=basePn
      // (500 dla pokoju) jest STAŁA, porównywana z rabatowaną `effectiveTreatyPnRequired`
      // ograniczoną przez `clampRelationForWar` (wywoływaną wewnątrz `treatyEvalRelationTotal`)
      // [AKTUALIZACJA R-WEB-DIPLO-WAR-TRUST-ZERO: limit 29 zniesiony; w wojnie obniżane jest
      // tylko Zaufanie do 0. Liczby poniżej (29/145/69/101) opisują stan SPRZED tej zmiany.]
      // do relTotal<=WAR_RELATION_SCORE_CAP(29) w trakcie wojny — `effectiveTreatyPnRequired
      // (500,29)`=145 << 500, więc bilans jest ujemny NIEZALEŻNIE od tego, jak dobra jest
      // relacja, dopóki trwa wojna (co dla 'pokoj' jest ZAWSZE prawdą — `!stanWojny` guard
      // wyżej), aż relTotal>=~101 — realnie NIEOSIĄGALNE w trakcie wojny (clamp tnie do 29).
      //
      // WAŻNE — sama ZAMIANA argumentów (`treatyBaseFairnessGap(basePn, receivePn, givePn,
      // relTotal)`, dosłowna literatura kierunku naprawy z dispatchu) NIE NAPRAWIA tego:
      // zweryfikowane reconem tej rundy wyczerpująco (4 kombinacje zamiana-argumentów × znak
      // wyniku, patrz gra/tools/dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs sekcja
      // "PROOF"). Dla pustego koszyka (`givePn=receivePn=0`) zamiana NIE ZMIENIA WYNIKU (0
      // zamienione z 0 to nadal 0) — `partnerTreatyPnRequired(basePn)=500` wciąż dominuje nad
      // maksymalnie osiągalnym podczas wojny `effectiveTreatyPnRequired(basePn,29)=145`
      // niezależnie od kolejności argumentów, więc bilans zostaje bit-identyczny (nadal
      // -450/-355/-355) — kryterium końca #2 tej rundy (neutralna/dobra → canAccept=true) NIE
      // zostałoby spełnione. Co więcej, sama zamiana (bez dalszych zmian) ODWRACA polaryzację
      // koszyka: scenariusz "AI daje 300 PW za darmo" POGARSZA SIĘ (bilans jeszcze bardziej
      // ujemny — zweryfikowane: -750/-655 zamiast dawnych -150/-55), bo `givePn` (dar AI) trafia
      // wtedy do argumentu ODEJMOWANEGO zamiast DODAWANEGO — sprzeczne z intencją właściciela
      // (dar powinien POMAGAĆ, nigdy szkodzić bilansowi).
      //
      // NAPRAWA: zachowana DOKŁADNIE ta sama struktura wywołania i polaryzacja koszyka co
      // gałąź gracz-proponent (`givePn` pomaga, `receivePn` szkodzi — zweryfikowane testem
      // regresji, w tym scenariuszem daru) — zmieniony WYŁĄCZNIE `relTotal` wejściowy dla
      // gałęzi AI-proponenta: `relationTotal(relation)` SUROWA (bez `clampRelationForWar`),
      // zamiast `treatyEvalRelationTotal` (wojennie: Zaufanie=0, dawniej także limit 29 — usunięty). `clampRelationForWar`
      // istnieje po to, by relacja WYŚWIETLANA (etykieta "Przyjazny"/"Życzliwy") i INNE traktaty
      // (sojusz, NAP — progi Relacji, które dawałyby "przyjazny" status mimo trwającej wojny)
      // nie ujawniały fałszywie dobrego stanu w trakcie wojny — nie po to, by WEWNĘTRZNA
      // matematyka uczciwości JEDNEJ, KONKRETNEJ oferty pokoju od AI ślepo ignorowała, jak
      // dobra FAKTYCZNIE jest leżąca u podstaw relacja (a to właśnie ta relacja decyduje, czy
      // AI w ogóle skłonne jest zaproponować pokój — `stanceForEval`/`aiDiplomacyStance` gdzie
      // indziej już czytają surowe pola Zaufanie/Respekt, nie `treatyEvalRelationTotal`, dla
      // podobnych decyzji AI). `partnerTreatyPnRequired` (płaska baza AI, 500) NIE ZMIENIONA —
      // AI nadal nigdy nie dostaje rabatu, "zawsze na bazie", zgodnie z dokumentacją. Efekt
      // (zweryfikowany żywo): zła relacja (5/5, relTotal surowy=10 — clamp i tak nie miał
      // wpływu, bo już poniżej 29) → bilans bit-identyczny z rundą 2 (-450), nadal blokuje —
      // gałąź gracz-proponent I to konkretne zachowanie zła-relacja-blokuje zostają nietknięte.
      // Neutralna (50/50, relTotal surowy=100) → effReq(500,100)=500=partnerRequired → bilans
      // DOKŁADNIE 0 (właściciel wprost: "co najmniej na zero lub na plusie" — akceptowalne).
      // Bardzo dobra (95/95, relTotal surowy=190) → effReq(500,190)=950>500 → bilans wyraźnie
      // dodatni (+450). Dar 300 PW za darmo → bilans dodatni przy neutralnej/dobrej relacji
      // (rośnie liniowo z wielkością daru, poprawna polaryzacja — zweryfikowane).
      // R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (r3): rozejm AI → gracz z parytetem. Baza luki = dopłata D, którą ma pokryć
      // SŁABSZA strona (X = 2000 × (1 − L)): AI silniejsze wg POWER żąda od gracza D, AI słabsze/równe nie żąda niczego (0) —
      // ta sama liczba, od której main.ts liczy `receiveItems` oferty AI (enqueueNegotiationFromAiCmd). Bez tego luka liczyłaby
      // się od surowej bazy 2000 (×10) i pokazywała graczowi zawyżony ujemny bilans AI-owego rozejmu.
      let gapBasePn = basePn;
      if (actionId === 'rozejm' && !proposerIsPlayer && treatyParityEnabled(actionId) && ctx.treatyPower !== undefined && basePn > 0) {
        const aiSplit = peacePwPointsByPowerRatio(
          treatyParityBaseX(actionId, payload, wearinessL), ctx.treatyPower.powerPlayer, ctx.treatyPower.powerOther,
        );
        gapBasePn = aiSplit.strongerSide === 'a' ? 0 : aiSplit.D;
      }
      let gap = gapBasePn > 0
        ? (proposerIsPlayer
            ? treatyBaseFairnessGap(basePn, givePn, receivePn, relTotal)
            : treatyBaseFairnessGap(gapBasePn, givePn, receivePn, relationTotal(relation)))
        : 0;
      // R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 (ABC 2026-11-18, D1–D4): gdy znana moc POWER obu stron, podział P·r / P/r.
      // Autor = gracz: silniejszy gracz ma wymaganie 0 (nigdy blokada „Brakuje"); słabszy gracz pokrywa D = S − W
      // miastami (cena bazowa P = basePn, rabat relacji zostaje w effectiveTreatyPnRequired). Autor = AI: bramka
      // tylko informacyjna (AI nie jest blokowane tą liczbą). r = 1 daje D = 0 (pokój bez dopłaty — konsekwencja wzoru).
      let powerSplitNote: string | undefined;
      const pkPowerSplit: PeacePwPowerSplit | undefined = (actionId === 'pokoj' || (actionId === 'rozejm' && treatyParityEnabled(actionId)))
        && ctx.warState && ctx.warState.powerPlayer != null && ctx.warState.powerOther != null
        && !ctx.responderIsCityState && basePn > 0
        ? peacePwPointsByPowerRatio(basePn, ctx.warState.powerPlayer, ctx.warState.powerOther)
        : undefined;
      if (pkPowerSplit && ((ctx.authorOwnerId ?? proposerOwnerId) === (pnOpts.playerOwnerId ?? 0))) {
        if (pkPowerSplit.strongerSide === 'a') {
          gap = 0;
          powerSplitNote = `silniejszy gracz nie dopłaca (S = ${pkPowerSplit.S} PW)`;
        } else {
          const requiredD = effectiveTreatyPnRequired(pkPowerSplit.D, relTotal);
          gap = requiredD - givePn;
          powerSplitNote = `słabszy gracz dopłaca D = ${pkPowerSplit.D} PW miastami `
            + `(po rabacie relacji: ${requiredD} PW; S = ${pkPowerSplit.S}, W = ${pkPowerSplit.W}, r = ${pkPowerSplit.r.toFixed(2)})`;
          // R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (r3): POKÓJ — reszta D po miastach i oferowanych pozycjach płatna ogonem
          // (złoto → brąz → żelazo → rudy z zapasów gracza; kompozytor jak AI/AI↔AI). Pokrywa całość → brak „Brakuje"; inaczej
          // zostaje blokada jak dziś, a tooltip pokazuje, ile ogon pokrywa. Rozejm bez ogona.
          if (actionId === 'pokoj' && gap > 0) {
            const alreadyTail = (autoPeaceTail?.items ?? []).map(t => ({ typ: t.key === 'zloto' ? 'zloto' : 'surowiec_ilosc', id: t.key, ilosc: t.qty }));
            const comp = composePlayerPeaceTail(
              gap, ctx.playerStock ?? ctx.payerStock,
              [...(payload.giveItems ?? []).filter(i => i.typ === 'zloto' || i.typ === 'surowiec_ilosc'), ...alreadyTail], ctx.tradeEra,
              proposerOwnerId === (pnOpts.playerOwnerId ?? 0) ? 'proposer' : 'responder',
            );
            if (comp) {
              if (comp.applied) {
                // scal z ogonem z bramki silniejszej AI (te same klucze sumujemy)
                const byKey = new Map<string, PeaceTailItem>();
                for (const it of [...(autoPeaceTail?.items ?? []), ...comp.items]) {
                  const cur = byKey.get(it.key);
                  byKey.set(it.key, cur ? { key: it.key, qty: cur.qty + it.qty, pn: cur.pn + it.pn } : { ...it });
                }
                const items = PEACE_TAIL_ORDER.filter(k => byKey.has(k)).map(k => byKey.get(k)!);
                autoPeaceTail = { ...comp, items, label: peaceTailLabel(items), coveredPn: (autoPeaceTail?.coveredPn ?? 0) + comp.coveredPn };
                gap = 0;
              }
              if (wearyInfo) wearyInfo = { ...wearyInfo, peaceTail: autoPeaceTail ?? comp };
            }
          }
        }
      }
      if (pkPowerSplit && wearyInfo) {
        wearyInfo = {
          ...wearyInfo,
          powerSplit: {
            playerPower: ctx.warState!.powerPlayer!, otherPower: ctx.warState!.powerOther!,
            r: pkPowerSplit.r, S: pkPowerSplit.S, W: pkPowerSplit.W, D: pkPowerSplit.D,
            dAfterRelief: effectiveTreatyPnRequired(pkPowerSplit.D, relTotal),
            playerStronger: pkPowerSplit.strongerSide === 'a',
          },
        };
      }
      const pokojPwBalanceRaw = basePn > 0 ? -gap : undefined;
      // Normalizacja -0 → 0 (JS: `-0 < 0` jest `false`, więc bramka canAccept działa poprawnie
      // nawet bez tego, ale `-0` w komunikacie/liczbie wyświetlanej graczowi wyglądałby myląco).
      const pokojPwBalance = pokojPwBalanceRaw != null && Object.is(pokojPwBalanceRaw, -0)
        ? 0
        : pokojPwBalanceRaw;
      // DECYZJA WŁAŚCICIELA runda 4 (P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA,
      // 00-dispatch.md rundy 4 — decyzja PRODUKTOWA, nie techniczna, cytat dosłowny):
      // "Pokój bez bramki PW — propozycje pokoju NIGDY nie są blokowane liczbą pwBalance;
      // przycisk Przyjmij zawsze aktywny dla oferowanego pokoju. Sama liczba bilansu może
      // nadal być pokazywana informacyjnie, ale nie decyduje o canAccept." Powód (dowód
      // matematyczny Evaluatora rundy 3, patrz OBRONA runda 3 wyżej): podczas wojny
      // `clampRelationForWar` (sprzed R-WEB-DIPLO-WAR-TRUST-ZERO: ograniczał relTotal<=29; dziś zeruje
      // tylko Zaufanie) a AI w ogóle proponuje gołą (bez
      // koszyka) ofertę pokoju WYŁĄCZNIE gdy jest słabsze — realny sufit relTotal w tym
      // stanie (sprzed zmiany) to 69, co nigdy nie wystarcza do `partnerTreatyPnRequired`(=500 dla pokoju)
      // przy jakiejkolwiek realnie osiągalnej Relacji podczas wojny — SAMA formuła
      // (nawet po naprawie kierunku rundy 3) nie da się naprawić bez zmiany zasad gry,
      // więc właściciel zdecydował: dla 'pokoj' (OBA kierunki — proposerIsPlayer=true I
      // false) `accepted` NIGDY nie zależy od `gap`/pwBalance — usunięte oba dawne
      // `return {accepted:false,...}` z tej gałęzi (gap>0 "Brakuje N PW..." i
      // receivePn>0 && !pnDealAcceptedByAi "Oferta poniżej uczciwej wartości PW"). `gap`/
      // `pokojPwBalance` WYŻEJ zostają NIETKNIĘTE — nadal liczone DOKŁADNIE tą samą
      // matematyką (GOAL 2 dispatchu: liczba ma nadal być poprawnie obliczana i
      // wyświetlana w panelu jako informacja "AI dorzuciło coś ekstra do pokoju" albo
      // "oferta poniżej sugerowanej wartości", ale nigdy nie blokuje). Downstream:
      // `balancePanelDataFromRows` (diplomacyAcceptanceBalance.ts) ma osobną, generyczną
      // bramkę „pwBalance<0 → blockReason" (GOAL3 rundy 2, dla nap/sojusz/wasal/trybut/
      // granice, gdzie `accepted:true` NIE gwarantuje pwBalance>=0) — TA bramka teraz
      // jawnie pomija wiersze 'pokoj' (`row.uiActionId !== '10'`) z DOKŁADNIE tego samego
      // powodu, inaczej sama liczba (nadal ujemna podczas wojny) blokowałaby Przyjmij
      // przez TĘ bramkę mimo `accepted:true` tutaj — patrz komentarz tam. Inne typy
      // propozycji (handel/sojusz/nap/trybut/granice/wasal…) NIETKNIĘTE — nadal blokowane
      // pwBalance jak dotąd, to WYŁĄCZNIE 'pokoj' traci tę zależność.
      // Non-PW warunki blokady dla pokoju zostają bez zmian: guard `!stanWojny` (pokój
      // wymaga trwającej wojny, linia ~992 wyżej w tej funkcji) i wszelkie przyszłe
      // cooldown/tury-od-wypowiedzenia — żadnych takich dodatkowych warunków NIE ma dziś
      // w kodzie (zweryfikowane reconem tej rundy — jedyne dwie bramki blokujące 'pokoj'
      // to była ta usunięta tutaj i martwa treatyPnGate 'pokoj' — patrz komentarz przy
      // `peaceProposalOfferPn`/`treatyPnGate` wyżej w pliku, samospełniający się warunek,
      // NIGDY nie blokuje, bez zmian tej rundy).
      //
      // R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1 (Maciej, ECHO 2026-09-07, doprecyzowanie/
      // częściowe odwrócenie runda 4 wyżej — cytat dosłowny): "Jeżeli inna cywilizacja lub
      // państwo-miasto proponuje mi pokój, to nawet jeżeli bilans jest ujemny, powinienem
      // mieć możliwość zaakceptowania (...). Ale jeżeli ja chcę zaproponować pokój, a bilans
      // jest ujemny, muszę go wyrównać." Bramka wraca, ale KIERUNKOWO — wyłącznie gdy GRACZ
      // jest autorem AKTUALNYCH warunków (a nie po prostu proponentem rundy 1, patrz komentarz
      // `authorOwnerId` przy `ProposalEvalContext`). `ctx.authorOwnerId` (DYNAMICZNY,
      // `PendingNegotiation.authorOwnerId`, main.ts::previewNegotiationEntry) — fallback na
      // statyczny `proposerOwnerId` gdy wywołujący nie ma pojęcia kontroferty (bit-identyczne
      // ze stanem sprzed tej rundy dla `evaluatePendingFromAI`/`generateCounterOffer`).
      // ZASTRZEŻENIE ARCHITEKTONICZNE (recon dispatchu): użycie tu statycznego `proposerIsPlayer`
      // zamiast dynamicznego autora dałoby ten sam błąd co runda 4 próbowała naprawić, tylko
      // przesunięty — po kontrofercie gracza na propozycję partnera, `proposerOwnerId` nadal
      // wskazuje na partnera, mimo że to gracz autoryzuje warunki NA STOLE TERAZ (kryterium
      // testowe tej rundy, patrz dyplo-pokoj-kierunek-runda1-test.cjs).
      const authorOwnerId = ctx.authorOwnerId ?? proposerOwnerId;
      const authorIsPlayer = authorOwnerId === (pnOpts.playerOwnerId ?? 0);
      if (authorIsPlayer && pokojPwBalance != null && pokojPwBalance < 0) {
        return {
          accepted: false,
          pwBalance: pokojPwBalance,
          wearinessPw: wearyPwItem, wearinessSide: wearySide,
          wearinessInfo: wearyInfo,
          ...(wearyInfo?.peaceTail ? { peaceTail: wearyInfo.peaceTail } : {}),
          reason: powerSplitNote != null
            ? `Brakuje ${Math.abs(pokojPwBalance)} PW do wyrównania mocy — ${powerSplitNote} — dopłać, by wysłać`
            : `Brakuje ${Math.abs(pokojPwBalance)} PW do uczciwej oferty pokoju @ Relacji `
              + `(baza ${basePn} PW) — dopłać, by wysłać`,
        };
      }
      return {
        accepted: true, pwBalance: pokojPwBalance, wearinessPw: wearyPwItem, wearinessSide: wearySide, wearinessInfo: wearyInfo,
        reason: autoPeaceTail ? `Warunki pokoju spełnione — ${autoPeaceTail.label}` : 'Warunki pokoju spełnione', oneShotTrade: true,
        ...(autoPeaceTail ? { peaceTail: autoPeaceTail } : {}),
      };
    }

    case 'trybut_oferta': {
      const perTurn = payload.goldPerTurn ?? payload.goldOnce ?? 0;
      const threshold = p.progTrybutOfertaBaseGold + (ctx.epoka ?? 0) * p.progTrybutOfertaEpokaGold;
      const nearWar = (ctx.militaryRatio ?? 1) > p.progTrybutOfertaNearWarRatio
        || relation.zaufanie < p.progTrybutOfertaNearWarZaufanie;
      if (!nearWar && perTurn < threshold) {
        return { accepted: false, pwBalance: -1, reason: 'Oferta trybutu zbyt niska' };
      }
      if (perTurn < p.progTrybutOfertaMinGold) {
        return { accepted: false, pwBalance: -1, reason: `Minimalna oferta to ${p.progTrybutOfertaMinGold} ¤` };
      }
      if (payload.goldOnce != null && payload.goldOnce > 0) {
        return { accepted: true, pwBalance: 0, reason: 'Jednorazowy trybut za pokój', oneShotTrade: true };
      }
      const trybutOfertaDurationTurns = resolveTreatyDurationTurns(payload) ?? null;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        // R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1: czas TRAKTATU (`treatyTurns`), nie
        // częstotliwość wymiany koszyka z `turns` (ta zostaje mnożnikiem wyceny PN).
        trybutOfertaDurationTurns != null ? ctx.turn + trybutOfertaDurationTurns : null,
        {
          payerOwnerId: proposerOwnerId,
          receiverOwnerId: responderOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, pwBalance: 0, reason: `Oferta trybutu ${perTurn} ¤/turę przyjęta`, deal };
    }

    case 'handel': {
      const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
      const relTotal = relationTotal(relation);
      const isGift = payload.isGift === true
        || ((payload.giveItems?.length ?? 0) > 0 && !(payload.receiveItems?.length) && (payload.receivePn ?? 0) <= 0);

      if (isGift) {
        if (!pnGiftAllowed(relTotal, ctx.difficulty ?? 'normal')) {
          return {
            accepted: false,
            reason: `Relacja zbyt niska na dar (wymagane ≥ ${diplomacyProgDarRelacja(undefined, ctx.difficulty ?? 'normal')})`,
          };
        }
        if (givePn <= 0) {
          return { accepted: false, reason: 'Brak wartości w darze' };
        }
        return { accepted: true, reason: 'Dar przyjęty', oneShotTrade: true };
      }

      if (score < p.progHandelRelacja) {
        return { accepted: false, reason: `Relacja zbyt niska na handel (wymagane ≥ ${p.progHandelRelacja})` };
      }

      // R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1=B+C: JEDNA deklaracja mnożnika chęci
      // dla całego case'u 'handel' (współdzielona przez ścieżkę cykliczną i PW).
      // responderIsPlayer=true (AI proponuje graczowi) → multiplier=1 zawsze — patrz
      // komentarz bloku handelWillingnessMultiplier wyżej (naprawa regresji rundy 2).
      const responderIsPlayer = responderOwnerId === 0;
      const handelMultiplier = handelWillingnessMultiplier(stance, p, responderIsPlayer);
      // R-WEB-AI-TRADE-WIRING-E2E-Q1 r3 (ABC A1): AI proponent -> gracz: bramka uczciwosci
      // z wspolczynnikiem 1 (AI oddaje co najwyzej tyle PW, ile dostaje). Gracz->AI bez zmian.
      const fairnessRelTotal = responderIsPlayer ? AI_PROPOSER_FAIRNESS_REL_TOTAL : relTotal;

      const hasPnPath = givePn > 0 || receivePn > 0 || payload.giveItems?.length || payload.receiveItems?.length;
      if (proposalHasResourceAccess(payload)) {
        return { accepted: false, reason: RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON };
      }

      // HANDEL-SUROWCE-CYKL (2026-07-24): tryb „Wymiana przez X tur" — surowiec_ilosc
      // (+ ewentualna zapłata zloto/praca) płynie CO TURĘ zamiast raz. ownerId-agnostyczne:
      // ta sama ścieżka niezależnie od tego, czy proponentem jest gracz czy AI (obie strony
      // oceniane tą samą bramką uczciwości @ mnożnik chęci — AI realnie może odrzucić
      // ofertę gracza).
      const hasQuantityResourceItems =
        (payload.giveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false)
        || (payload.receiveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false);
      if (payload.resourceTradeMode === 'per_turn' && hasQuantityResourceItems) {
        const cyklFairnessReject = handelFairnessGate(givePn, receivePn, fairnessRelTotal, handelMultiplier);
        if (cyklFairnessReject) return cyklFairnessReject;
        const cyklPwBalance = givePn - handelRequiredPn(receivePn, fairnessRelTotal, handelMultiplier);
        const turns = exchangeValuationTurns(payload);
        const cyklicznyItems = buildHandelSurowiecCykliczny(
          proposerOwnerId, responderOwnerId, payload.giveItems, payload.receiveItems, ctx.tradeEra,
        );
        if (!cyklicznyItems.length) {
          return { accepted: false, reason: 'Brak surowca do cyklicznej wymiany' };
        }
        const deal = buildDeal(
          RodzajTraktatu.UmowaWymiany,
          proposerOwnerId,
          responderOwnerId,
          ctx.turn,
          resolveExchangeExpiry(ctx.turn, payload),
          undefined,
          false,
          undefined,
          cyklicznyItems,
        );
        return {
          accepted: true,
          reason: payload.exchangeDurationTurns === null
            ? 'Umowa handlowa (surowiec co turę) bezterminowa'
            : `Umowa handlowa (surowiec co turę) na ${formatTurCountAcc(turns)}`,
          deal,
          pwBalance: cyklPwBalance,
        };
      }

      if (hasPnPath) {
        const fairnessReject = handelFairnessGate(givePn, receivePn, fairnessRelTotal, handelMultiplier);
        if (fairnessReject) return fairnessReject;
        const pwBalance = givePn - handelRequiredPn(receivePn, fairnessRelTotal, handelMultiplier);
        return { accepted: true, reason: 'Wymiana PW zaakceptowana', oneShotTrade: true, pwBalance };
      }

      // Legacy: goldOnce → PN 1:1, strict fair (W4-A)
      const legacyGive = pnFromLegacyGold(payload.goldOnce ?? (payload.amount ?? 0) * 10);
      const legacyReceive = pnFromLegacyGold(ctx.fairTradeValue ?? legacyGive);
      if (legacyGive <= 0) {
        return { accepted: false, reason: 'Brak wartości w ofercie' };
      }
      if (!pnDealAcceptedByAi(legacyGive, legacyReceive, relTotal)) {
        return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji' };
      }
      return { accepted: true, reason: 'Wymiana jednorazowa (T3A)', oneShotTrade: true };
    }

    case 'umowa_handlowa':
    case 'umowa_szlakow': {
      // R-HANDEL-WYMIANA-TECH-GATE-Q1: twarda bramka techniczna, przed każdą
      // inną oceną tej propozycji — bez technologii "Wymiana" po którejkolwiek
      // stronie nie ma o czym negocjować. `undefined` (wywołujący spoza
      // allowlisty) = bramka pominięta, wsteczna zgodność.
      if (ctx.hasTradeTechProposer === false || ctx.hasTradeTechResponder === false) {
        return { accepted: false, reason: 'Brak zbadanej technologii Wymiana po jednej ze stron' };
      }
      const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
      // treatyEvalRelationTotal (nie goły relationTotal) — spójne z dawną
      // proposerUnfairToPartnerGate/treatyPnGate (clamp wojenny), choć w praktyce
      // nieosiągalne tutaj (evaluateProposal blokuje te akcje przy stanWojny wcześniej).
      const relTotal = treatyEvalRelationTotal(relation);
      if (tradeWillingnessBlocksAcceptance(stance, p, givePn, receivePn, relTotal, payload)) {
        return { accepted: false, reason: 'Brak chęci do handlu' };
      }
      if (score < p.progHandelRelacja) {
        return { accepted: false, reason: `Relacja zbyt niska na traktat handlowy (wymagane ≥ ${p.progHandelRelacja})` };
      }
      // R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A: umowa_szlakow/umowa_handlowa mają
      // prog_relacja=0 w acceptance-points.json (efektywnie wyłączone — score<0
      // nigdy prawda) — czyli check wyżej NIGDY nie blokuje. Baza PN traktatu
      // (80 PW) była więc egzekwowana wyłącznie przez dawną generyczną
      // proposerUnfairToPartnerGate; ta bramka przenosi tę samą matematykę
      // (treatyBaseFairnessGap) lokalnie, żeby traktat handlowy bez koszyka przy
      // niskiej Relacji dalej wymagał dopłaty zamiast przechodzić za darmo.
      const treatyBasePn = treatyBasePnFromConfig(actionId, payload);
      const proposerIsTreatyPlayer = proposerOwnerId === (pnOpts.playerOwnerId ?? 0);
      // P-DYPLO-BILANS-GATE-NIESPOJNY (Maciej 2026-08-14): `-gap` to JEDYNA liczba, którą
      // ta bramka realnie liczy — `pwBalance` musi być dokładnie nią, żeby wyświetlany
      // "Bilans" (diplomacyAcceptanceBalance.ts) i próg akceptacji nigdy się nie rozjechały
      // (undefined gdy bramka w ogóle nie dotyczy tej oferty — brak treatyBasePn/nie-gracz).
      let pwBalance: number | undefined;
      if (treatyBasePn > 0 && proposerIsTreatyPlayer) {
        // R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2=A: dolicz PW z sąsiednich pozycji NA TYM SAMYM
        // stole (np. osobny `handel` między tymi samymi stronami) — pakiet jako całość
        // pokrywa bazę traktatu, nawet gdy sam traktat nie ma własnego koszyka. Sąsiad
        // NIE wpływa na wyświetlany koszyk traktatu (givePn/receivePn poniżej, hasItems) —
        // tylko na próg tej bramki, żeby nie dublować PW w sumie pakietu na panelu (main.ts).
        const siblingGivePn = ctx.packageSiblingGivePn ?? 0;
        const siblingReceivePn = ctx.packageSiblingReceivePn ?? 0;
        const gap = treatyBaseFairnessGap(
          treatyBasePn, givePn + siblingGivePn, receivePn + siblingReceivePn, relTotal,
        );
        pwBalance = -gap;
        if (gap > 0) {
          const packageNote = (siblingGivePn > 0 || siblingReceivePn > 0)
            ? ', licząc pakiet na stole'
            : '';
          return {
            accepted: false,
            reason: `Brakuje ${gap} PW do uczciwej oferty traktatu handlowego @ Relacji (baza ${treatyBasePn} PW${packageNote}) — oferta nieuczciwa dla partnera`,
            pwBalance,
          };
        }
      }
      const hasItems = (payload.giveItems?.length ?? 0) > 0 || (payload.receiveItems?.length ?? 0) > 0;
      if (hasItems) {
        if (!pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
          return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji', pwBalance };
        }
      }
      // R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 (Obrona runda 1, zarzut 1 Evaluatora
      // PRZYJĘTY): wygaśnięcie traktatu szlaków liczymy z `treatyTurns` — jawnego wyboru
      // gracza „Czas traktatu handlowego" — a NIE z `payload.turns`, które dla tej akcji
      // niesie czas/częstotliwość WYMIANY z koszyka i jest mnożnikiem wyceny PN
      // (`proposalPnTurnsMultiplier`). Sprzęgnięcie obu ról w jednym polu powodowało, że
      // wybór długości traktatu przeliczał wycenę słodzika (7 vs 20 tur → −42%/+1900%),
      // mimo że `umowa_szlakow` transferuje koszyk JEDNORAZOWO. `treatyTurns === 0`
      // (chip „Bezterminowy") → `wygasaTura === null`. Brak obu pól (payloady AI) →
      // zachowanie historyczne przez fallback w `resolveTreatyDurationTurns`.
      const szlakiDurationTurns = resolveTreatyDurationTurns(payload);
      const wygasa = szlakiDurationTurns != null
        ? ctx.turn + clampDealTurns(szlakiDurationTurns)
        : null;
      const deal = buildDeal(
        RodzajTraktatu.UmowaSzlakow,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        wygasa,
      );
      return {
        accepted: true,
        reason: hasItems ? 'Traktat handlowy (ze słodzikiem) zawarty' : 'Traktat handlowy zawarty',
        deal,
        pwBalance,
      };
    }

    case 'namow_wojne': {
      if (relation.zaufanie < p.progNamowWojneZaufanie) {
        return { accepted: false, reason: `Zaufanie zbyt niskie (wymagane ≥ ${p.progNamowWojneZaufanie})` };
      }
      const epoka = ctx.epoka ?? 0;
      const minBribe = p.progNamowWojneBribeBase * (epoka + 1);
      const bribe = payload.bribeGold ?? 0;
      if (bribe < minBribe) {
        return { accepted: false, reason: `Łapówka zbyt mała (min. ${minBribe} ¤)` };
      }
      if (payload.targetOwnerId == null) {
        return { accepted: false, reason: 'Brak wskazanego wroga' };
      }
      return { accepted: true, reason: 'Zgoda na wypowiedzenie wojny wskazanemu wrogowi' };
    }

    case 'tech': {
      const techRelOk = score >= p.progHandelRelacja;
      const techZaufOk = relation.zaufanie >= p.progWymianaTechZaufanie;
      if (!techRelOk && !techZaufOk) {
        return {
          accepted: false,
          reason: `Relacja zbyt niska na wymianę tech (wymagana Relacja ≥ ${p.progHandelRelacja} i Zaufanie ≥ ${p.progWymianaTechZaufanie})`,
        };
      }
      if (!techRelOk) {
        return { accepted: false, reason: `Relacja zbyt niska na wymianę tech (wymagane ≥ ${p.progHandelRelacja})` };
      }
      if (!techZaufOk) {
        return { accepted: false, reason: `Zaufanie zbyt niskie na wymianę tech (wymagane ≥ ${p.progWymianaTechZaufanie})` };
      }
      if (!payload.techId) {
        return { accepted: false, reason: 'Brak technologii w ofercie' };
      }
      // R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A (2026-08-09): tryb 'tech' (wymiana
      // technologia-za-technologię, diplomacy.json „Wymiana bezpłatna") płaci OFEROWANĄ
      // TECHNOLOGIĄ zamiast gotówki — próg minimalnej ceny (`techMinPrice`) dotyczy
      // WYŁĄCZNIE trybu gotówkowego, tu nie ma go czym mierzyć.
      if (payload.techPaymentMode === 'tech') {
        if (!payload.techOfferId) {
          return { accepted: false, reason: 'Brak oferowanej technologii w zamian' };
        }
        if (payload.techOfferId === payload.techId) {
          return { accepted: false, reason: 'Nie można wymienić technologii na samą siebie' };
        }
        return { accepted: true, reason: 'Wymiana technologia-za-technologię zaakceptowana', oneShotTrade: true };
      }
      const minPrice = ctx.techMinPrice ?? 50;
      const price = payload.techPrice ?? 0;
      if (price < minPrice) {
        return { accepted: false, reason: `Cena poniżej minimum (${minPrice} ¤)` };
      }
      return {
        accepted: true,
        reason: payload.techDirection === 'buy' ? 'Kupno technologii zaakceptowane' : 'Sprzedaż technologii zaakceptowana',
        oneShotTrade: true,
      };
    }

    case 'granice': {
      // C-DYP-STOL-Q1=B: słodzik obniża oba progi (Relacja/Zaufanie) o tyle samo.
      const graniceEase = sweetenerEasePoints(payload, pnOpts);
      const graniceRelThreshold = Math.max(0, p.progGraniceRelacja - graniceEase);
      const graniceZaufThreshold = Math.max(0, p.progGraniceZaufanie - graniceEase);
      const granRelOk = score >= graniceRelThreshold;
      const granZaufOk = relation.zaufanie >= graniceZaufThreshold;
      if (!granRelOk && !granZaufOk) {
        return {
          accepted: false, pwBalance: -1,
          reason: `Relacja zbyt niska na traktat przemarszu (wymagana Relacja ≥ ${graniceRelThreshold} i Zaufanie ≥ ${graniceZaufThreshold})`,
        };
      }
      if (!granRelOk) {
        return { accepted: false, pwBalance: -1, reason: `Relacja zbyt niska na traktat przemarszu (wymagana ≥ ${graniceRelThreshold})` };
      }
      if (!granZaufOk) {
        return { accepted: false, pwBalance: -1, reason: `Zaufanie zbyt niskie (wymagane ≥ ${graniceZaufThreshold})` };
      }
      if (payload.borderMilitary && ctx.proposerRespekt < p.progGraniceWojskoweRespekt) {
        return { accepted: false, pwBalance: -1, reason: `Prawo wojskowe wymaga Respekt ≥ ${p.progGraniceWojskoweRespekt}` };
      }
      if (payload.barbarianCooperation && !payload.borderMilitary) {
        return { accepted: false, pwBalance: -1, reason: 'Wspólna walka z barbarzyńcami wymaga wariantu wojskowego' };
      }
      const rodzaj = payload.barbarianCooperation
        ? RodzajTraktatu.WspolnaWalkaBarbarzyncy
        : payload.borderMilitary
          ? RodzajTraktatu.PrawoWojskowePrzemarszu
          : RodzajTraktatu.OtwartGranice;
      const deal = buildDeal(
        rodzaj,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        payload.barbarianCooperation ? ctx.turn + BARBARIAN_COOPERATION_TURNS : null,
        undefined,
        undefined,
        undefined,
        undefined,
        payload.barbarianCooperation,
      );
      return {
        accepted: true, pwBalance: 0,
        reason: payload.barbarianCooperation
          ? 'Wspólna walka z barbarzyńcami i przemarsz — 3 tury'
          : marchTreatyLabel(payload.borderMilitary),
        deal,
      };
    }

    case 'ultimatum': {
      const rw = ctx.militaryRatio ?? 1;
      if (rw < p.progUltimatumMilitaryRatio) {
        return { accepted: false, reason: 'Ultimatum wymaga wyraźnej przewagi militarnej' };
      }
      if (payload.goldOnce != null && payload.goldOnce >= p.progUltimatumMinGold) {
        return { accepted: true, reason: 'Warunki ultimatum spełnione', oneShotTrade: true };
      }
      return { accepted: false, reason: 'Ultimatum odrzucone — warunki zbyt surowe' };
    }

    case 'wasal': {
      // C-DYP-STOL-Q1=B: słodzik obniża próg Respektu wymaganego do wasalizacji.
      const wasalEase = sweetenerEasePoints(payload, pnOpts);
      const wasalRespektThreshold = Math.max(0, p.progWasalizacjaRespekt - wasalEase);
      if (ctx.proposerRespekt < wasalRespektThreshold) {
        return { accepted: false, pwBalance: -1, reason: `Wasalizacja wymaga Respekt ≥ ${wasalRespektThreshold}` };
      }
      const perTurn = payload.goldPerTurn ?? p.progWasalDefaultGoldPerTurn;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        null,
        {
          payerOwnerId: responderOwnerId,
          receiverOwnerId: proposerOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, pwBalance: 0, reason: 'Wasalizacja zaakceptowana', deal };
    }

    case 'wchloniecie': {
      if (!ctx.responderIsCityState) {
        return { accepted: false, reason: 'Wchłonięcie v1 tylko miasta-państwa' };
      }
      const wasalDeal = findWasalDeal(ctx.activeDeals, proposerOwnerId, responderOwnerId);
      if (!wasalDeal) {
        return { accepted: false, reason: 'Brak aktywnej wasalizacji z tym miastem-państwem' };
      }
      const age = ctx.wasalAgeTurns ?? wasalAgeTurns(wasalDeal, ctx.turn);
      if (age == null || age < p.graczWchlonieciePoWasaluTur) {
        const remain = p.graczWchlonieciePoWasaluTur - (age ?? 0);
        return {
          accepted: false,
          reason: `Wasal musi trwać ≥ ${p.graczWchlonieciePoWasaluTur} tur (pozostało ${remain})`,
        };
      }
      if (ctx.proposerRespekt < p.progWchloniecieRespekt) {
        return {
          accepted: false,
          reason: `Wchłonięcie wymaga Respekt ≥ ${p.progWchloniecieRespekt}`,
        };
      }
      // Q3A: zgoda wasala — Relacja ≥ 60 (środek pasma Przyjazny, consent gate).
      const WCHLONIECIE_CONSENT_REL = 60;
      if (score < WCHLONIECIE_CONSENT_REL) {
        return { accepted: false, reason: 'Wasal odmawia wchłonięcia — zbyt niska Relacja' };
      }
      const pop = ctx.responderPopulation ?? 0;
      const koszt = graczWchloniecieKosztZloto(pop, p);
      const goldOnce = payload.goldOnce ?? 0;
      if (goldOnce < koszt) {
        return {
          accepted: false,
          reason: `Wchłonięcie wymaga jednorazowej opłaty ≥ ${koszt} ¤`,
        };
      }
      return { accepted: true, reason: `Wchłonięcie zaakceptowane (${koszt} ¤)` };
    }

    default:
      return { accepted: false, reason: 'Nieznana akcja dyplomatyczna' };
  }
}

/** Po akceptacji — dodaj deal do tablicy (helper dla SILNIK). */
export function applyAcceptedProposal(
  deals: ActiveDeal[],
  result: ProposalEvalResult,
): ActiveDeal[] {
  if (!result.accepted || !result.deal) return deals;
  return addTreaty(deals, result.deal);
}

/** @deprecated alias — użyj AI_TRADE_GOLD_MAX */
export const AI_TRADE_GOLD_ONCE = AI_TRADE_GOLD_MAX;
const AI_TRIBUTE_PER_TURN = 15;

/** Wzbogaca komendę AI o kwoty ze skarbca; null gdy brak środków na gold-only. */
export function enrichAiCommandWithTreasury(
  cmd: AIDiplomacyCommand,
  treasuryBalance: number,
): AIDiplomacyCommand | null {
  switch (cmd.type) {
    case 'zaproponuj_handel': {
      const goldOnce = cmd.goldOnce ?? capAiGoldOffer(treasuryBalance, AI_TRADE_GOLD_MAX);
      return goldOnce > 0 ? { ...cmd, goldOnce } : null;
    }
    case 'oferuj_trybut_za_pokoj': {
      const goldOnce = cmd.goldOnce ?? capAiGoldOffer(treasuryBalance, AI_TRIBUTE_PEACE_MAX);
      return goldOnce > 0 ? { ...cmd, goldOnce } : null;
    }
    default:
      return cmd;
  }
}

/**
 * Tekst propozycji dyplomatycznej AI dla gracza (UI / inbox).
 * cmd.powod pozostaje diagnostyką silnika — nie pokazuj w UI.
 */
export function formatAiDiplomacyPlayerMessage(cmd: AIDiplomacyCommand): string {
  switch (cmd.type) {
    case 'zaproponuj_handel':
      return `Proponujemy jednorazową wymianę: ${cmd.goldOnce ?? 0} ¤ na rzecz twojego państwa.`;
    case 'zaproponuj_umowe_handlowa':
      return cmd.sweetenerGold
        ? `Proponujemy stałą umowę handlową (szlaki handlowe) — w geście dobrej woli dokładamy ${cmd.sweetenerGold} ¤.`
        : 'Proponujemy stałą umowę handlową — otwiera i utrzymuje szlaki handlowe między naszymi miastami.';
    case 'zaproponuj_sojusz':
      return cmd.allianceKind === 'defensywny'
        ? 'Proponujemy sojusz obronny — wchodzimy do wojny tylko gdy któryś z nas jest atakowany.'
        : 'Proponujemy sojusz wojskowy — wspólna obrona i wsparcie militarnie.';
    case 'zaproponuj_przemarsz':
      return 'Prosimy o zgodę na przemarsz naszych wojsk przez Twoje ziemie — w wojnie z innym państwem chcemy ominąć Twoje granice bez naruszeń.';
    case 'zaproponuj_pakt':
      return cmd.turns != null && cmd.turns <= 0
        ? 'Proponujemy bezterminowy pakt nieagresji — żadna strona nie zaatakuje drugiej.'
        : `Proponujemy pakt nieagresji na ${formatTurCountAcc(cmd.turns ?? 15)} — żadna strona nie zaatakuje drugiej.`;
    case 'zaproponuj_pokoj':
      return cmd.rodzaj === 'rozejm'
        ? 'Proponujemy rozejm — na czas ustalony w propozycji wstrzymujemy działania wojenne.'
        : 'Proponujemy zawarcie pokoju i zakończenie wojny.';
    case 'zadaj_trybut':
      return `Żądamy trybut: ${AI_TRIBUTE_PER_TURN} ¤ co turę na rzecz naszego państwa.`;
    case 'oferuj_trybut_za_pokoj':
      return `Oferujemy jednorazową zapłatę ${cmd.goldOnce ?? 0} ¤ w zamian za pokój.`;
    case 'oferuj_miasto_za_pokoj':
      if (cmd.rodzaj !== 'rozejm' && cmd.ogon?.length) {
        return cmd.cityId
          ? 'Oferujemy pokój w zamian za przekazanie naszych miast oraz dopłatę złotem i surowcami.'
          : 'Oferujemy pokój w zamian za dopłatę złotem i surowcami — nie mamy już miast, które możemy oddać.';
      }
      return cmd.rodzaj === 'rozejm'
        ? (cmd.dodatkoweMiasta?.length ? 'Oferujemy rozejm w zamian za przekazanie kilku naszych miast.' : 'Oferujemy rozejm w zamian za przekazanie jednego z naszych miast.')
        : (cmd.dodatkoweMiasta?.length ? 'Oferujemy pokój w zamian za przekazanie kilku naszych miast.' : 'Oferujemy pokój w zamian za przekazanie jednego z naszych miast.');
    case 'zada_miasto_za_pokoj':
      return 'Warunkiem pokoju jest przekazanie jednego z twoich miast.';
    case 'wypowiedz_wojne':
      return 'Wypowiadamy wojnę — nasze wojska są gotowe do walki.';
    case 'zaproponuj_handel_surowiec': {
      const zaplataLabel = cmd.zaplataTyp === 'praca' ? 'Praca' : '¤';
      const reasonSuffix = cmd.reasonHandlu ? ` Uzasadnienie: ${cmd.reasonHandlu}` : '';
      if (cmd.kierunek === 'zakup') {
        return `Kupię od ciebie ${cmd.label} — ${cmd.pakietyPerTura} sztuk na turę`
          + ` za ${cmd.zaplataPerTura} ${zaplataLabel}/turę przez ${formatTurCountAcc(cmd.turns)}.${reasonSuffix}`;
      }
      return `Mamy nadwyżkę surowca ${cmd.label} — oferujemy ${cmd.pakietyPerTura} sztuk na turę`
        + ` za ${cmd.zaplataPerTura} ${zaplataLabel}/turę przez ${formatTurCountAcc(cmd.turns)}.${reasonSuffix}`;
    }
    default:
      return 'Propozycja dyplomatyczna od tego państwa.';
  }
}

/** Pozycje miast oferowanych przez AI w pokoju (pierwsze miasto planu + kolejne = minimum równoważące cenę). */
function aiOfferedCityItems(cmd: Extract<AIDiplomacyCommand, { type: 'oferuj_miasto_za_pokoj' }>): BasketItem[] {
  const out: BasketItem[] = [];
  // cityId '' = AI nie ma miast do oddania i płaci samym ogonem ceny pokoju (złoto → brąz → żelazo → rudy).
  if (cmd.cityId) out.push({ typ: 'miasto', id: cmd.cityId, ilosc: 1, cityPn: cmd.cityPn, cityWeight: cmd.cityWeight });
  for (const m of cmd.dodatkoweMiasta ?? []) {
    out.push({ typ: 'miasto' as const, id: m.cityId, ilosc: 1, cityPn: m.cityPn, cityWeight: cmd.cityWeight });
  }
  // R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1: ogon ceny pokoju po miastach (złoto = Skarbiec, metale/rudy = Spichlerz państwa AI).
  for (const t of cmd.rodzaj === 'rozejm' ? [] : (cmd.ogon ?? [])) {
    out.push({ typ: t.key === 'zloto' ? 'zloto' : 'surowiec_ilosc', id: t.key, ilosc: t.qty } as BasketItem);
  }
  return out;
}

/** Konwersja komendy AI → propozycja oczekująca (banner audiencji). */
export function aiCommandToPendingProposal(
  cmd: AIDiplomacyCommand,
  fromOwnerId: number,
  toOwnerId: number,
  turn: number,
): PendingProposal | null {
  const base = {
    fromOwnerId,
    toOwnerId,
    createdTurn: turn,
    expiresTurn: turn + 5,
    source: 'ai' as const,
    aiPowod: formatAiDiplomacyPlayerMessage(cmd),
  };

  switch (cmd.type) {
    case 'zaproponuj_sojusz': {
      const allianceKind = cmd.allianceKind === 'defensywny' ? 'defensywny' : 'pelny';
      return {
        ...base,
        id: makeDealId('pending-sojusz', turn, fromOwnerId, toOwnerId),
        actionId: allianceKind === 'defensywny' ? 'sojusz_defensywny' : 'sojusz_pelny',
        payload: { allianceKind },
      };
    }
    case 'zaproponuj_wymiane_cykliczna':
      if (cmd.giveQty <= 0 || cmd.receiveQty <= 0 || cmd.giveKey === cmd.receiveKey) return null;
      return {
        ...base,
        id: makeDealId('pending-barter', turn, fromOwnerId, toOwnerId),
        actionId: 'handel',
        payload: {
          giveItems: [{ typ: 'surowiec_ilosc', id: cmd.giveKey, ilosc: cmd.giveQty }],
          receiveItems: [{ typ: 'surowiec_ilosc', id: cmd.receiveKey, ilosc: cmd.receiveQty }],
          resourceTradeMode: 'per_turn', turns: cmd.turns, exchangeDurationTurns: cmd.turns,
        },
      };
    case 'zaproponuj_pakt':
      return {
        ...base,
        id: makeDealId('pending-nap', turn, fromOwnerId, toOwnerId),
        actionId: 'nap',
        payload: { turns: cmd.turns ?? 15 },
      };
    case 'zaproponuj_przemarsz':
      return {
        ...base,
        id: makeDealId('pending-przemarsz', turn, fromOwnerId, toOwnerId),
        actionId: 'granice',
        payload: { borderMilitary: true },
      };
    case 'zaproponuj_pokoj':
      // R-WEB-TRUCE-Q1 r4 (N4): rozejm proponowany przez AI idzie tą samą ścieżką co pokój
      // (stół → applyProposalOutcome 'rozejm'), z domyślną długością okna.
      if (cmd.rodzaj === 'rozejm') {
        return {
          ...base,
          id: makeDealId('pending-rozejm', turn, fromOwnerId, toOwnerId),
          actionId: 'rozejm',
          payload: { turns: TRUCE_DEFAULT_TURNS },
        };
      }
      return {
        ...base,
        id: makeDealId('pending-pokoj', turn, fromOwnerId, toOwnerId),
        actionId: 'pokoj',
        payload: {},
      };
    case 'oferuj_miasto_za_pokoj':
      // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N1a): AI (proponent) oddaje swoje miasto → giveItems.
      // R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 (wymóg 3): rodzaj 'rozejm' → rozejm z tym samym miastem.
      if (cmd.rodzaj === 'rozejm') {
        return {
          ...base,
          id: makeDealId('pending-rozejm-miasto', turn, fromOwnerId, toOwnerId),
          actionId: 'rozejm',
          payload: {
            turns: TRUCE_DEFAULT_TURNS,
            giveItems: aiOfferedCityItems(cmd),
          },
        };
      }
      return {
        ...base,
        id: makeDealId('pending-pokoj-miasto', turn, fromOwnerId, toOwnerId),
        actionId: 'pokoj',
        payload: {
          giveItems: aiOfferedCityItems(cmd),
        },
      };
    case 'zada_miasto_za_pokoj':
      // R-WEB-PEACE-CITY-CESSION-Q1 r3 (N1b): AI żąda miasta gracza → receiveItems (strona gracza).
      return {
        ...base,
        id: makeDealId('pending-pokoj-zadanie', turn, fromOwnerId, toOwnerId),
        actionId: 'pokoj',
        payload: {
          receiveItems: [{ typ: 'miasto', id: cmd.cityId, ilosc: 1, cityPn: cmd.cityPn }],
        },
      };
    case 'zaproponuj_handel': {
      const goldOnce = cmd.goldOnce ?? 0;
      if (goldOnce <= 0) return null;
      const goldBasket: BasketItem = { typ: 'zloto', id: 'zloto', ilosc: goldOnce };
      return {
        ...base,
        id: makeDealId('pending-handel', turn, fromOwnerId, toOwnerId),
        payload: {
          goldOnce,
          giveItems: [goldBasket],
          isGift: true,
        },
        actionId: 'handel',
      };
    }
    case 'zaproponuj_umowe_handlowa': {
      return {
        ...base,
        id: makeDealId('pending-umowahandlowa', turn, fromOwnerId, toOwnerId),
        actionId: 'umowa_handlowa',
        payload: cmd.sweetenerGold ? { goldOnce: cmd.sweetenerGold } : {},
      };
    }
    case 'zadaj_trybut':
      return {
        ...base,
        id: makeDealId('pending-trybut', turn, fromOwnerId, toOwnerId),
        actionId: 'trybut_zadanie',
        payload: { goldPerTurn: AI_TRIBUTE_PER_TURN },
      };
    case 'oferuj_trybut_za_pokoj': {
      const goldOnce = cmd.goldOnce ?? 0;
      if (goldOnce <= 0) return null;
      return {
        ...base,
        id: makeDealId('pending-trybut-oferta', turn, fromOwnerId, toOwnerId),
        actionId: 'trybut_oferta',
        payload: { goldOnce },
      };
    }
    case 'zaproponuj_handel_surowiec': {
      if (cmd.pakietyPerTura <= 0) return null;
      const isBuy = cmd.kierunek === 'zakup';
      return {
        ...base,
        id: makeDealId('pending-handelsurowiec', turn, fromOwnerId, toOwnerId),
        actionId: 'handel',
        payload: isBuy
          ? {
              giveItems: cmd.zaplataPerTura > 0
                ? [{ typ: cmd.zaplataTyp, id: cmd.zaplataTyp, ilosc: cmd.zaplataPerTura }]
                : undefined,
              receiveItems: [{ typ: 'surowiec_ilosc', id: cmd.surowiecKey, ilosc: cmd.pakietyPerTura }],
              resourceTradeMode: 'per_turn',
              turns: cmd.turns,
            }
          : {
              giveItems: [{ typ: 'surowiec_ilosc', id: cmd.surowiecKey, ilosc: cmd.pakietyPerTura }],
              receiveItems: cmd.zaplataPerTura > 0
                ? [{ typ: cmd.zaplataTyp, id: cmd.zaplataTyp, ilosc: cmd.zaplataPerTura }]
                : undefined,
              resourceTradeMode: 'per_turn',
              turns: cmd.turns,
            },
      };
    }
    default:
      return null;
  }
}

/** Gracz akceptuje propozycję AI — ocena odwrotna (gracz = responder). */
export function evaluatePendingFromAI(
  pending: PendingProposal,
  ctx: ProposalEvalContext,
): ProposalEvalResult {
  const proposal: DiplomaticProposal = {
    actionId: pending.actionId,
    proposerOwnerId: pending.fromOwnerId,
    responderOwnerId: pending.toOwnerId,
    payload: pending.payload,
  };
  return evaluateProposal(proposal, ctx);
}

/**
 * Akcje, dla których wybuch wojny między stronami unieważnia propozycję. Świadomie
 * POZA tym zbiorem: 'trybut_oferta' i 'ultimatum' — dotyczą WŁAŚNIE stanu
 * wojny/napięcia, więc jej wybuch ich nie gasi (odwrotnie — to ich kontekst).
 * 'namow_wojne' też poza zbiorem — nie wymaga pokoju między proponentem/respondentem.
 */
/** Akcje sensowne WYŁĄCZNIE w trakcie wojny pary (po pokoju martwe): propozycja pokoju / rozejmu (też z miastami). */
export const WAR_DEPENDENT_ACTIONS: ReadonlySet<ProposalActionId> = new Set<ProposalActionId>(['pokoj', 'rozejm']);

const NEGOTIATION_PEACE_REQUIRED: ReadonlySet<ProposalActionId> = new Set([
  'nap', 'sojusz_defensywny', 'sojusz_pelny', 'handel',
  'umowa_handlowa' as ProposalActionId, 'umowa_szlakow', 'granice', 'tech', 'wasal', 'wchloniecie', 'trybut_zadanie',
]);

/**
 * Gracz klika AKCEPTUJ na propozycji AI — bez ponownej oceny progów AI/respondenta.
 * Zwraca wynik gotowy do applyProposalOutcome (deal / oneShotTrade).
 *
 * C-DYP-Q1=A (2026-07-26): STÓŁ NEGOCJACYJNY woła tę funkcję dla KAŻDEGO wpisu, który
 * gracz ręcznie akceptuje — niezależnie od tego, czy rundę 1 zainicjował gracz, czy AI
 * (patrz negotiationToLegacyPending). Dlatego rozszerzona o WSZYSTKIE warianty
 * ProposalActionId (wcześniej tylko podzbiór realnie wysyłany przez decideAIDiplomacy) —
 * nowe gałęzie (nap/sojusz_defensywny/granice/tech/namow_wojne/ultimatum/wasal) kopiują
 * 1:1 budowę traktatu z odpowiadającej gałęzi `accepted` w evaluateProposal powyżej,
 * bez progów (gracz już się zgodził ręcznie — jak reszta tej funkcji).
 */
const PEACE_ACTIONS_DURING_WAR: ReadonlySet<ProposalActionId> = new Set([
  'pokoj', 'rozejm', 'trybut_oferta', 'ultimatum',
]);

export function resolvePlayerAcceptsAiPending(
  pending: PendingProposal,
  turn: number,
  difficulty: GameDifficulty = 'normal',
  // R-HANDEL-WYMIANA-TECH-GATE-Q1: `hasTradeTech` opcjonalny — wsteczna zgodność
  // dla wywołujących spoza allowlisty tego tematu (undefined = bramka pominięta).
  // R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1 (r3): `carrierCtx` = ten sam kontekst oceny co w oknie propozycji
  // (buildProposalEvalContext). Gdy podany, akceptacja oferty AI-traktatu (autor = AI) z parytetem siły dostaje
  // TEN SAM nośnik dopłaty D co wiersz okna (attachTreatyCarrier z zapasów GRACZA) albo odmowę, gdy zapasów brak.
  opts?: { atWar?: boolean; hasTradeTech?: (ownerId: number) => boolean; tradeEra?: number; carrierCtx?: ProposalEvalContext },
): ProposalEvalResult {
  const result = resolvePlayerAcceptsAiPendingBase(pending, turn, difficulty, opts);
  return applyTreatyCarrierToAiAcceptance(pending, difficulty, opts?.carrierCtx, result);
}

/**
 * Nośnik dopłaty D przy akceptacji oferty AI przez gracza (r3, defekt główny FC): realna akceptacja idzie przez
 * resolvePlayerAcceptsAiPending, która nie liczyła parytetu — wiersz okna obiecywał płatność, a przelewu nie było.
 * Tylko traktaty z TREATY_CARRIER_ACTIONS i tylko gdy autorem jest strona inna niż gracz (kierunek AI→gracz;
 * kierunek gracz→AI przechodzi przez evaluateProposal, który już dołącza nośnik).
 * Bez zapasów pokrywających D: odmowa z tym samym powodem co bramka okna (treatyParityPowerGate).
 */
function applyTreatyCarrierToAiAcceptance(
  pending: PendingProposal,
  difficulty: GameDifficulty,
  ctx: ProposalEvalContext | undefined,
  result: ProposalEvalResult,
): ProposalEvalResult {
  if (!ctx || !result.accepted || !result.deal) return result;
  if (!TREATY_CARRIER_ACTIONS.has(pending.actionId)) return result;
  if (pending.fromOwnerId === 0) return result;
  if (!ctx.treatyPower || !treatyParityEnabled(pending.actionId)) return result;
  const proposal: DiplomaticProposal = {
    actionId: pending.actionId,
    proposerOwnerId: pending.fromOwnerId,
    responderOwnerId: pending.toOwnerId,
    payload: pending.payload,
  };
  const pnOpts: ResolveProposalPnOptions = {
    difficulty: ctx.difficulty ?? difficulty,
    proposerOwnerId: proposal.proposerOwnerId,
    playerOwnerId: 0,
    actionId: proposal.actionId,
    tradeEra: ctx.tradeEra,
    ...proposalPnTurnsMultiplier(proposal.payload),
  };
  const gate = treatyParityPowerGate(
    proposal.actionId, proposal.payload, ctx.relation, pnOpts, ctx.treatyPower, treatyWearinessLevelOf(ctx),
    ctx.playerStock ?? ctx.payerStock, ctx.tradeEra, treatyCarrierTechsOf(ctx),
  );
  if (gate) return { accepted: false, reason: gate.reason, treatyPayment: gate.treatyPayment };
  return attachTreatyCarrier(proposal, ctx, result);
}

function resolvePlayerAcceptsAiPendingBase(
  pending: PendingProposal,
  turn: number,
  difficulty: GameDifficulty,
  opts?: { atWar?: boolean; hasTradeTech?: (ownerId: number) => boolean; tradeEra?: number },
): ProposalEvalResult {
  const { actionId, fromOwnerId, toOwnerId, payload } = pending;
  if (opts?.atWar === true) {
    if (isCurrencyProposalForbiddenDuringWar(actionId, payload, true)) {
      return { accepted: false, reason: 'W wojnie pieniądze tylko w ugodzie pokojowej' };
    }
    if (NEGOTIATION_PEACE_REQUIRED.has(actionId) && !PEACE_ACTIONS_DURING_WAR.has(actionId)) {
      return { accepted: false, reason: 'Wybuchła wojna — warunki straciły aktualność' };
    }
  }
  switch (actionId) {
    case 'nap': {
      // PARYTET (rule_108) — R-DYPLO-PAKT-WETO-EKSPANSJA-Q1, zapis JAWNY, żeby asymetria
      // nie była przypadkowa. Ta ścieżka (AI zaproponowało pakt, GRACZ klika „Przyjmij")
      // celowo NIE stosuje narzutu „Kara za wspólną granicę" ani progów Relacji/
      // Wiarygodności — bo tu responderem jest CZŁOWIEK, a jego bramką jest własne
      // kliknięcie (C-DYP-Q1=A: „bez progów — gracz już się zgodził ręcznie"). Odwrotna
      // strona tej symetrii: gdy responderem jest AI, bramką jest evaluateProposal::case
      // 'nap' wyżej.
      // ZNANA, ZMIERZONA LUKA POZA ALLOWLISTĄ tego tematu: inicjatywa AI
      // (`ai.ts` Priorytet 3b, ~4344) sprawdza wyłącznie `score >= progNapRelacja -
      // napScoreEase` i nie zna flagi `karaWspolnaGranica` w ogóle (`AIDiplomacyInput`
      // jej nie niesie), więc AI potrafi SAMO zaproponować pakt przy Relacji między
      // `progNapRelacja` a `progNapRelacja + NAP_GRANICA_RELACJA_NARZUT`, którego samo
      // by nie przyjęło. Domknięcie wymaga `ai.ts` + `main.ts` (oba poza allowlistą) —
      // zgłoszone jako osobny temat, nie poszerzane w biegu (R-PROC-AUTOBOT §14).
      const napExpiry = resolveNapDealExpiry(turn, payload);
      const deal = buildDeal(
        RodzajTraktatu.PaktNieagresji,
        fromOwnerId,
        toOwnerId,
        turn,
        napExpiry.wygasaTura,
      );
      return { accepted: true, reason: napExpiry.label, deal };
    }
    case 'sojusz_defensywny':
    case 'sojusz_pelny': {
      const deal = buildDeal(
        actionId,
        fromOwnerId,
        toOwnerId,
        turn,
        null,
      );
      const label = actionId === 'sojusz_defensywny' ? 'Sojusz obronny' : 'Sojusz wojskowy';
      return { accepted: true, reason: `${label} zawarty`, deal };
    }
    case 'pokoj':
      return { accepted: true, reason: 'Pokój zawarty', oneShotTrade: true };
    case 'rozejm':
      return { accepted: true, reason: 'Rozejm zawarty', oneShotTrade: true };
    case 'granice': {
      if (payload.barbarianCooperation && !payload.borderMilitary) {
        return { accepted: false, reason: 'Wspólna walka z barbarzyńcami wymaga wariantu wojskowego' };
      }
      const rodzaj = payload.barbarianCooperation
        ? RodzajTraktatu.WspolnaWalkaBarbarzyncy
        : payload.borderMilitary
          ? RodzajTraktatu.PrawoWojskowePrzemarszu
          : RodzajTraktatu.OtwartGranice;
      const deal = buildDeal(
        rodzaj,
        fromOwnerId,
        toOwnerId,
        turn,
        payload.barbarianCooperation ? turn + BARBARIAN_COOPERATION_TURNS : null,
        undefined,
        undefined,
        undefined,
        undefined,
        payload.barbarianCooperation,
      );
      return {
        accepted: true,
        reason: payload.barbarianCooperation
          ? 'Wspólna walka z barbarzyńcami i przemarsz — 3 tury'
          : marchTreatyLabel(payload.borderMilitary),
        deal,
      };
    }
    case 'tech': {
      // N-B (Evaluator runda 3, nota nieblokująca): etykieta zależna od kierunku/trybu, tak
      // samo jak evaluateProposal::case 'tech' wyżej i main.ts::negotiationSummary. Dziś
      // NIEOSIĄGALNE z UI (AI nigdy nie tworzy propozycji actionId:'tech' — akcja '6' jest
      // zawsze player-initiated, patrz main.ts::buildProposalFromPayload proposerOwnerId=0
      // na sztywno) — ale gdyby to się kiedyś zmieniło (znana mina na przyszłość), etykieta
      // ma być poprawna od razu, nie cicho myląca.
      return {
        accepted: true,
        reason: payload.techPaymentMode === 'tech'
          ? 'Wymiana technologia-za-technologię zaakceptowana'
          : (payload.techDirection === 'buy' ? 'Kupno technologii zaakceptowane' : 'Sprzedaż technologii zaakceptowana'),
        oneShotTrade: true,
      };
    }
    case 'namow_wojne': {
      return { accepted: true, reason: 'Zgoda na wypowiedzenie wojny wskazanemu wrogowi' };
    }
    case 'ultimatum': {
      return { accepted: true, reason: 'Warunki ultimatum spełnione', oneShotTrade: true };
    }
    case 'wasal': {
      const p = getEffectiveDiplomacyParams(difficulty);
      const perTurn = payload.goldPerTurn ?? p.progWasalDefaultGoldPerTurn;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        fromOwnerId,
        toOwnerId,
        turn,
        null,
        {
          payerOwnerId: toOwnerId,
          receiverOwnerId: fromOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, reason: 'Wasalizacja zaakceptowana', deal };
    }
    case 'handel': {
      if (proposalHasResourceAccess(payload)) {
        return { accepted: false, reason: RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON };
      }
      // HANDEL-SUROWCE-CYKL (2026-07-24): AI zaproponowała cykliczny handel
      // surowcem (zaproponuj_handel_surowiec) — gracz akceptuje DOKŁADNIE tę ofertę
      // (AI już wyceniła ją fair @ katalog PN przy budowaniu propozycji, main.ts
      // pickResourceSurplusForOwnerPair), bez ponownej oceny pnDealAcceptedByAi.
      const hasQuantityResourceItems =
        (payload.giveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false)
        || (payload.receiveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false);
      if (payload.resourceTradeMode === 'per_turn' && hasQuantityResourceItems) {
        const turns = exchangeValuationTurns(payload);
        const cyklicznyItems = buildHandelSurowiecCykliczny(
          fromOwnerId, toOwnerId, payload.giveItems, payload.receiveItems, opts?.tradeEra,
        );
        if (!cyklicznyItems.length) {
          return { accepted: false, reason: 'Brak surowca do cyklicznej wymiany' };
        }
        const deal = buildDeal(
          RodzajTraktatu.UmowaWymiany,
          fromOwnerId,
          toOwnerId,
          turn,
          resolveExchangeExpiry(turn, payload),
          undefined,
          false,
          undefined,
          cyklicznyItems,
        );
        return {
          accepted: true,
          reason: payload.exchangeDurationTurns === null
            ? 'Umowa handlowa (surowiec co turę) bezterminowa'
            : `Umowa handlowa (surowiec co turę) na ${formatTurCountAcc(turns)}`,
          deal,
        };
      }
      if (payload.goldOnce != null && payload.goldOnce > 0) {
        return { accepted: true, reason: 'Wymiana jednorazowa (T3A)', oneShotTrade: true };
      }
      return { accepted: true, reason: 'Wymiana PW zaakceptowana', oneShotTrade: true };
    }
    case 'umowa_handlowa':
    case 'umowa_szlakow': {
      // E6 / HANDEL-SPLIT-Q1=B: gracz akceptuje propozycję traktatu szlaków od AI.
      // R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1: ta sama zasada co w `evaluateProposal`
      // — czas TRAKTATU z `treatyTurns`, fallback na `turns` dla payloadów AI.
      // R-HANDEL-WYMIANA-TECH-GATE-Q1: druga warstwa tej samej bramki — nawet gdy
      // AI zdążyło zaproponować traktat zanim/gdy tech przestał być spełniony,
      // gracz nie może go PRZYJĄĆ bez technologii "Wymiana" po obu stronach.
      if (opts?.hasTradeTech && (!opts.hasTradeTech(fromOwnerId) || !opts.hasTradeTech(toOwnerId))) {
        return { accepted: false, reason: 'Brak zbadanej technologii Wymiana po jednej ze stron' };
      }
      const szlakiAiDurationTurns = resolveTreatyDurationTurns(payload);
      const deal = buildDeal(
        RodzajTraktatu.UmowaSzlakow,
        fromOwnerId,
        toOwnerId,
        turn,
        szlakiAiDurationTurns != null ? turn + clampDealTurns(szlakiAiDurationTurns) : null,
      );
      return { accepted: true, reason: 'Traktat handlowy zawarty', deal };
    }
    case 'trybut_zadanie': {
      const perTurn = payload.goldPerTurn ?? AI_TRIBUTE_PER_TURN;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        fromOwnerId,
        toOwnerId,
        turn,
        payload.turns != null ? turn + payload.turns : null,
        {
          payerOwnerId: toOwnerId,
          receiverOwnerId: fromOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, reason: `Trybut ${perTurn} ¤/turę`, deal };
    }
    case 'trybut_oferta': {
      if (payload.goldOnce != null && payload.goldOnce > 0) {
        return { accepted: true, reason: 'Jednorazowy trybut za pokój', oneShotTrade: true };
      }
      const perTurn = payload.goldPerTurn ?? 0;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        fromOwnerId,
        toOwnerId,
        turn,
        payload.turns != null ? turn + payload.turns : null,
        {
          payerOwnerId: fromOwnerId,
          receiverOwnerId: toOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, reason: `Oferta trybutu ${perTurn} ¤/turę przyjęta`, deal };
    }
    default:
      return { accepted: false, reason: 'Nieznana akcja dyplomatyczna' };
  }
}

// ---------------------------------------------------------------------------
// C-DYP-Q1=A (2026-07-26, Maciej): STÓŁ NEGOCJACYJNY — pełny stan „propozycja
// oczekuje" per para właścicieli, z kontrofertą. SILNIK (main.ts) trzyma tablicę
// PendingNegotiation[] (zapis/odczyt gry — meta.negotiationTable); ten moduł
// dostarcza WYŁĄCZNIE czyste funkcje:
//   - createNegotiation / applyCounterOffer — budowa i mutacja (czysta, zwraca kopię)
//     wpisu przez kolejne rundy;
//   - generateCounterOffer — 2. i 3. reakcja AI („składa kontrofertę"), NIE liczy
//     nowej wyceny — evaluateProposal (już wyżej w tym pliku) jest WYROCZNIĄ, szukamy
//     minimalnej zmiany jednego pola, która przełącza jej wynik na accepted;
//   - resolveNegotiationAsResponder — pełny dispatcher rundy z perspektywy AI
//     (jedyna zautomatyzowana decyzja; decyzje GRACZA są zawsze ręczne — UI);
//   - negotiationStillValid — RYZYKO ze zlecenia: świat mógł się zmienić między
//     propozycją a odpowiedzią (wojna/eliminacja) — wpis wygasa z czytelnym powodem
//     zamiast wykonać się na nieaktualnych warunkach;
//   - negotiationToLegacyPending — adapter do resolvePlayerAcceptsAiPending (wyżej),
//     żeby ręczna akceptacja gracza (KTÓRAKOLWIEK strona zainicjowała rundę 1) używała
//     JEDNEGO buildera traktatu zamiast duplikować konstrukcję deal.
//
// Role proposerOwnerId/responderOwnerId w PendingNegotiation są STAŁE od rundy 1
// (określają kierunek koszyka giveItems/receiveItems — "proposerOwnerId daje
// giveItems, dostaje receiveItems" — patrz ProposalPayload) i NIE zmieniają się przy
// kontrofertach — zmienia się tylko payload (liczby) oraz awaitingOwnerId/authorOwnerId
// (kto teraz odpowiada / kto ustawił bieżące warunki). evaluateProposal jest zawsze
// wołane z tymi STAŁYMI rolami — jego `accepted` to bramka „czy ta treść+kwota mieści
// się w progu inżynierskim tej pary", niezależna od tego, kto ostatnio ją zmienił
// (patrz przykład trybut_zadanie w raporcie zadania — próg jest o STAŁEJ stronie
// żądającej, nie o „aktualnym autorze").
// ---------------------------------------------------------------------------

/** Limit rund kontrofert w JEDNEJ negocjacji (Maciej 2026-07-26, C-DYP-Q1=A pkt 3). Runda 1 = pierwsza propozycja; każda kontroferta +1. Po osiągnięciu limitu — silnik dopuszcza już tylko Przyjmij/Odrzuć. */
export const NEGOTIATION_MAX_ROUNDS = 3;

/** Ile tur od ostatniej aktywności (propozycja / kontroferta) zanim wpis wygasa bez odpowiedzi drugiej strony. */
export const NEGOTIATION_EXPIRY_TURNS = 5;

/**
 * Akcje bez auto-kontroferty silnika (evaluateProposal nie ma sensownego pola do
 * skalującej poprawki jednym krokiem). Gracz wciąż może Przyjąć/Odrzucić/Kontruj ręcznie.
 */
const NEGOTIATION_NO_ENGINE_COUNTER: ReadonlySet<ProposalActionId> = new Set([
  // (pusto — umowa_handlowa / umowa_szlakow obsługiwane w evaluateProposal)
]);

export interface PendingNegotiation {
  id: string;
  /** STAŁE przez całą negocjację — patrz komentarz bloku wyżej. */
  proposerOwnerId: number;
  responderOwnerId: number;
  actionId: ProposalActionId;
  /** Warunki AKTUALNIE na stole — każda runda NADPISUJE poprzednie (nie kumuluje). */
  payload: ProposalPayload;
  /** 1 = pierwsza propozycja; +1 za każdą kontrofertę (limit NEGOTIATION_MAX_ROUNDS). */
  round: number;
  /** Kto MUSI teraz odpowiedzieć (Przyjmij / Odrzuć / Kontruj). */
  awaitingOwnerId: number;
  /** Kto ustawił BIEŻĄCE warunki (drugi z pary awaitingOwnerId). */
  authorOwnerId: number;
  createdTurn: number;
  lastActionTurn: number;
  expiresTurn: number;
  /** Kto zainicjował rundę 1 — UI (własne/przychodzące) + parytet AI/gracz (ta sama droga). */
  source: 'player' | 'ai';
  /** R-WEB-DIPLO-DEALS-SENSIBLE-Q1: uzasadnienie oferty handlowej AI (niedobór/nadwyżka). */
  reason?: string;
  /**
   * R-WEB-DIPLO-CITY-OFFER-REJECT-OWN-COOLDOWN-Q1: klucz cooldownu odrzucenia, gdy inny niż actionId
   * (oferta miasta za pokój ma actionId 'pokoj', ale własny klucz 'miasto_za_pokoj').
   * Brak pola = cooldown wg actionId (zachowanie sprzed zmiany; stare zapisy bez pola działają).
   */
  rejectCooldownKey?: 'miasto_za_pokoj' | 'wymiana_cykliczna';
  /** Marker for an AI initiated barter sharing actionId='handel'. Optional in old saves. */
  aiCyclicBarter?: boolean;
}

function otherPartyOf(
  entry: Pick<PendingNegotiation, 'proposerOwnerId' | 'responderOwnerId'>,
  ownerId: number,
): number {
  return ownerId === entry.proposerOwnerId ? entry.responderOwnerId : entry.proposerOwnerId;
}

export function makeNegotiationId(
  actionId: ProposalActionId,
  turn: number,
  a: number,
  b: number,
  seq: number,
): string {
  const [p0, p1] = a < b ? [a, b] : [b, a];
  return `negot-${actionId}-${p0}-${p1}-t${turn}-${seq}`;
}

/** Czy para ma już aktywną propozycję danego typu na stole (oba kierunki). */
export function hasPendingNegotiationForPair(
  table: readonly PendingNegotiation[],
  ownerA: number,
  ownerB: number,
  actionId: ProposalActionId,
): boolean {
  return table.some(n =>
    n.actionId === actionId
    && ((n.proposerOwnerId === ownerA && n.responderOwnerId === ownerB)
      || (n.proposerOwnerId === ownerB && n.responderOwnerId === ownerA)),
  );
}

/**
 * DIPLO-5 (R-WEB-DIPLO-AI-PEACE-OFFER-DEDUP-ONE-ACTIVE-Q1): planowanie wstawienia propozycji AI na stół.
 * Pokój/rozejm (WAR_DEPENDENT_ACTIONS) — na parę co najwyżej JEDNA aktywna propozycja:
 *  - propozycja GRACZA tej pary już na stole → AI nie dokłada drugiej (accept=false);
 *  - w przeciwnym razie nowa propozycja AI zastępuje wszystkie wcześniejsze propozycje AI tej pary
 *    (replacedIds — do usunięcia ze stołu przed wstawieniem).
 * Pozostałe typy: dotychczasowy dedup tego samego typu (hasPendingNegotiationForPair), bez zastępowania.
 * EN: at most one active war-peace (peace/truce) offer per pair; a player's pending one blocks the AI,
 * an AI offer replaces the AI's previous one. Other action types keep the same-type dedup.
 */
export function planAiOfferOnTable(
  table: readonly PendingNegotiation[],
  aiOwnerId: number,
  playerOwnerId: number,
  actionId: ProposalActionId,
): { accept: boolean; replacedIds: string[] } {
  if (!WAR_DEPENDENT_ACTIONS.has(actionId)) {
    const dup = hasPendingNegotiationForPair(table, playerOwnerId, aiOwnerId, actionId);
    return { accept: !dup, replacedIds: [] };
  }
  const pairEntries = table.filter(n =>
    WAR_DEPENDENT_ACTIONS.has(n.actionId)
    && ((n.proposerOwnerId === playerOwnerId && n.responderOwnerId === aiOwnerId)
      || (n.proposerOwnerId === aiOwnerId && n.responderOwnerId === playerOwnerId)),
  );
  // DIPLO-5 r2 (zarzut Evaluatora, kontrkontrofertą gracza): wpis z proposerem AI, którego kontroferte
  // złożył GRACZ (applyCounterOffer zachowuje proposerOwnerId, zmienia authorOwnerId) też zajmuje stół —
  // inaczej AI nadpisałaby kontrofertę gracza własną nową ofertą.
  const playerOccupies = (n: PendingNegotiation): boolean =>
    n.proposerOwnerId === playerOwnerId || n.authorOwnerId === playerOwnerId;
  if (pairEntries.some(playerOccupies)) return { accept: false, replacedIds: [] };
  return { accept: true, replacedIds: pairEntries.map(n => n.id) };
}

/** Własna propozycja gracza (proposer=0) oczekująca u partnera — bez duplikatu tego typu. */
export function findOwnOutgoingNegotiation(
  table: readonly PendingNegotiation[],
  partnerOwnerId: number,
  actionId: ProposalActionId,
): PendingNegotiation | undefined {
  return table.find(n =>
    n.proposerOwnerId === 0
    && n.responderOwnerId === partnerOwnerId
    && n.actionId === actionId,
  );
}

/**
 * R-DYPLO-UMOWA-SUROWCOW-WIELOKROTNA (2026-08-13): typy propozycji zwolnione z blokady
 * „nasza propozycja tego typu jest już na stole" (findOwnOutgoingNegotiation) — mogą trafić
 * na stół wielokrotnie w jednej negocjacji, jako osobne wpisy sumujące się do wspólnego
 * bilansu PW. Dziś wyłącznie 'handel' (silnikowy actionId UI '14' „Umowa wymiany surowców" —
 * współdzielony z darem UI '13' przez CYW_ACTION_TO_UI_ID w main.ts). Woła to `main.ts`
 * (handleNegotiatedProposal) PRZED zapytaniem findOwnOutgoingNegotiation.
 * EN: proposal types exempt from the "our own proposal of this type is already on the table"
 * guard (findOwnOutgoingNegotiation) — may be placed on the table multiple times per
 * negotiation, as separate entries summing into one shared PW balance. Today only 'handel'
 * (engine actionId for UI '14' resource-exchange, shared with gift UI '13'). Called by
 * `main.ts` (handleNegotiatedProposal) BEFORE querying findOwnOutgoingNegotiation.
 */
export function allowsMultipleOwnOutgoingNegotiations(actionId: ProposalActionId): boolean {
  return actionId === 'handel';
}

/** Tworzy nowy wpis (runda 1) z propozycji — respondent = ten, kto musi teraz odpowiedzieć. */
export function createNegotiation(
  proposal: DiplomaticProposal,
  turn: number,
  source: 'player' | 'ai',
  seq: number,
): PendingNegotiation {
  return {
    id: makeNegotiationId(proposal.actionId, turn, proposal.proposerOwnerId, proposal.responderOwnerId, seq),
    proposerOwnerId: proposal.proposerOwnerId,
    responderOwnerId: proposal.responderOwnerId,
    actionId: proposal.actionId,
    payload: proposal.payload,
    round: 1,
    awaitingOwnerId: proposal.responderOwnerId,
    authorOwnerId: proposal.proposerOwnerId,
    createdTurn: turn,
    lastActionTurn: turn,
    expiresTurn: turn + NEGOTIATION_EXPIRY_TURNS,
    source,
  };
}

export function negotiationAsProposal(entry: PendingNegotiation): DiplomaticProposal {
  return {
    actionId: entry.actionId,
    proposerOwnerId: entry.proposerOwnerId,
    responderOwnerId: entry.responderOwnerId,
    payload: entry.payload,
  };
}

/** Czy gracz może wysłać kontrofertę (limit rund negocjacji). */
export function canPlayerCounterNegotiation(entry: PendingNegotiation): boolean {
  return entry.round < NEGOTIATION_MAX_ROUNDS;
}

/** Czy silnik AI może wygenerować auto-kontrofertę (limit rund + ocena evaluateProposal). */
export function canCounterNegotiation(entry: PendingNegotiation): boolean {
  return canPlayerCounterNegotiation(entry) && !NEGOTIATION_NO_ENGINE_COUNTER.has(entry.actionId);
}

/** Nakłada kontrofertę (nowe warunki) — woła SILNIK zarówno dla ręcznej kontry gracza, jak i automatycznej AI (resolveNegotiationAsResponder). */
export function applyCounterOffer(
  entry: PendingNegotiation,
  newPayload: ProposalPayload,
  authorOwnerId: number,
  turn: number,
): PendingNegotiation {
  return {
    ...entry,
    payload: newPayload,
    round: entry.round + 1,
    authorOwnerId,
    awaitingOwnerId: otherPartyOf(entry, authorOwnerId),
    lastActionTurn: turn,
    expiresTurn: turn + NEGOTIATION_EXPIRY_TURNS,
  };
}

/**
 * R-PROPOZYCJA-BRAK-EDYCJI (Maciej, wariant A, 2026-08-10): edycja WŁASNEJ, jeszcze
 * nierozstrzygniętej propozycji (direction='own' w UI, czyli `entry.awaitingOwnerId !== 0`)
 * W MIEJSCU — podmienia WYŁĄCZNIE `payload` (nowa treść oferty z formularza koszyka),
 * `round`/`awaitingOwnerId`/`authorOwnerId` zostają BEZ ZMIAN. To jest ISTOTA wariantu A:
 * brak resetu kontekstu negocjacji — w odróżnieniu od `applyCounterOffer` (kontroferta),
 * które zawsze +1 rundę i przełącza stronę odpowiadającą.
 * / EN: in-place edit of the player's OWN, still-pending proposal (UI direction='own', i.e.
 * `entry.awaitingOwnerId !== 0`) — swaps ONLY `payload` (new offer content from the basket
 * form); `round`/`awaitingOwnerId`/`authorOwnerId` stay untouched. This is the essence of
 * variant A: no negotiation-context reset — unlike `applyCounterOffer` (counter-offer),
 * which always bumps the round and flips the responding side.
 */
export function applyOwnProposalEdit(
  entry: PendingNegotiation,
  newPayload: ProposalPayload,
): PendingNegotiation {
  return { ...entry, payload: newPayload };
}

export interface NegotiationWorldCtx {
  turn: number;
  isAtWar: boolean;
  /**
   * DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1: true = para jest w pokoju STAŁYM (status pokoj/sojusz, bez
   * aktywnego rozejmu). Wpisy zależne od wojny (pokoj / rozejm - także z miastami AI jako "ceną") są wtedy martwe.
   * Pole WYMAGANE (tsc wymusza je we wszystkich wywołaniach — brak pola = reguła po cichu nie działała;
   * wiring w main.ts: buildNegotiationWorldCtx, handleNegotiationAccept, buildPendingNegotiationRows).
   */
  isAtPeace: boolean;
  proposerEliminated: boolean;
  responderEliminated: boolean;
  /** Gdy któraś strona to miasto-państwo — trybut niedostępny. */
  proposerIsCityState?: boolean;
  responderIsCityState?: boolean;
  /** DIPLO-5: właściciel miasta o danym id (undefined = miasto nie istnieje). Wiring: main.ts buildNegotiationWorldCtx. */
  cityOwnerOf?: (cityId: string) => number | undefined;
}

/** Akcje trybutu — blokada u miast-państw + gaszenie przy wojnie (poza ofertą pokojową majorów). */
export const TRIBUTE_PROPOSAL_ACTIONS: ReadonlySet<ProposalActionId> = new Set([
  'trybut_zadanie',
  'trybut_oferta',
]);

const CITY_STATE_TRIBUTE_BLOCK_REASON = 'Trybut niedostępny u miasta-państwa';

function tributeBlockedForCityState(ctx: ProposalEvalContext): boolean {
  return ctx.proposerIsCityState === true || ctx.responderIsCityState === true;
}

export interface NegotiationValidity {
  valid: boolean;
  reason?: string;
}

/**
 * RYZYKO ze zlecenia (2026-07-26): świat mógł się zmienić między złożeniem a
 * odpowiedzią (wybuchła wojna, zginęła strona/miasto stolica → eliminacja, zerwano
 * traktat) — wpis WYGASA z czytelnym komunikatem zamiast wykonać się na nieaktualnych
 * warunkach. SILNIK (main.ts) dostarcza world ctx PER WPIS (per parę) — nie ma tu
 * dostępu do stanu gry (moduł pozostaje pure/bez importu main.ts).
 */
export function negotiationStillValid(
  entry: PendingNegotiation,
  world: NegotiationWorldCtx,
): NegotiationValidity {
  if (world.proposerEliminated || world.responderEliminated) {
    return { valid: false, reason: 'Jedna ze stron została wyeliminowana z gry — propozycja wygasła' };
  }
  if (world.turn > entry.expiresTurn) {
    return { valid: false, reason: 'Propozycja wygasła — brak odpowiedzi w terminie' };
  }
  if (
    TRIBUTE_PROPOSAL_ACTIONS.has(entry.actionId)
    && (world.proposerIsCityState || world.responderIsCityState)
  ) {
    return { valid: false, reason: CITY_STATE_TRIBUTE_BLOCK_REASON };
  }
  if (world.isAtPeace === true && !world.isAtWar && WAR_DEPENDENT_ACTIONS.has(entry.actionId)) {
    return { valid: false, reason: 'Wojna już się zakończyła — oferta pokoju/miast straciła aktualność' };
  }
  if (world.isAtWar && NEGOTIATION_PEACE_REQUIRED.has(entry.actionId)) {
    return { valid: false, reason: 'Wybuchła wojna — warunki straciły aktualność' };
  }
  if (world.isAtWar && entry.actionId === 'trybut_oferta'
    && (world.proposerIsCityState || world.responderIsCityState)) {
    return { valid: false, reason: 'Wybuchła wojna — warunki straciły aktualność' };
  }
  // DIPLO-5 (kryterium 3): oferta miasta, której nie da się wykonać (miasto utracone / oddane), wygasa.
  // Miasto z giveItems musi należeć do proposera, z receiveItems do respondera. Brak miasta (undefined) = utracone.
  // Pole opcjonalne: bez wiringu (cityOwnerOf undefined) reguła nie działa — stan zachowany jak dotąd.
  if (world.cityOwnerOf) {
    const cityOk = (items: readonly { typ: string; id: string }[] | undefined, owner: number): boolean =>
      (items ?? []).every(i => i.typ !== 'miasto' || world.cityOwnerOf!(i.id) === owner);
    if (!cityOk(entry.payload.giveItems, entry.proposerOwnerId)
      || !cityOk(entry.payload.receiveItems, entry.responderOwnerId)) {
      return { valid: false, reason: 'Miasto z oferty nie należy już do strony oferującej — oferta straciła aktualność' };
    }
  }
  return { valid: true };
}

// --- Generator kontroferty (2. i 3. reakcja AI) -----------------------------

/** Jeden „krok" słodzika = SWEETENER_PN_PER_EASE_POINT (ta sama stawka co sweetenerEasePoints wyżej — brak nowego cennika). */
const NEGOTIATION_SWEETENER_STEP_GOLD = SWEETENER_PN_PER_EASE_POINT;
/** Sufit prób — tyle samo punktów ease ile sweetenerEasePoints dopuszcza maksymalnie. */
const NEGOTIATION_SWEETENER_MAX_STEPS = SWEETENER_EASE_MAX_POINTS;
/** Krok dopłaty/obniżki pieniężnej (trybut/tech/łapówka/ultimatum/handel) — ±20% na próbę. */
const NEGOTIATION_MONEY_STEP_PCT = 0.2;
/** Maks. prób na kierunek (± do 80% od bieżącej kwoty) zanim uznajemy impas. */
const NEGOTIATION_MONEY_MAX_STEPS = 4;

// R-WEB-TRUCE-Q1 r3 (N3): rozejm ma ten sam słodzik kontrprzeciwny co pokój (ta sama bramka PW).
const SWEETENER_COUNTER_ELIGIBLE: ReadonlySet<ProposalActionId> = new Set([
  'nap', 'sojusz_defensywny', 'sojusz_pelny', 'granice', 'wasal', 'pokoj', 'rozejm',
]);

function withExtraSweetenerGold(payload: ProposalPayload, extraGold: number): ProposalPayload {
  const items: BasketItem[] = [...(payload.giveItems ?? [])];
  const idx = items.findIndex(i => i.typ === 'zloto');
  if (idx >= 0) {
    items[idx] = { ...items[idx]!, ilosc: (items[idx]!.ilosc ?? 0) + extraGold };
  } else {
    items.push({ typ: 'zloto', id: 'zloto', ilosc: extraGold });
  }
  return { ...payload, giveItems: items };
}

type NegotiationMoneyField = 'goldPerTurn' | 'goldOnce' | 'techPrice' | 'bribeGold';

function getMoneyField(payload: ProposalPayload, field: NegotiationMoneyField): number {
  switch (field) {
    case 'goldPerTurn': return payload.goldPerTurn ?? 0;
    case 'goldOnce': return payload.goldOnce ?? 0;
    case 'techPrice': return payload.techPrice ?? 0;
    case 'bribeGold': return payload.bribeGold ?? 0;
  }
}

function withMoneyField(payload: ProposalPayload, field: NegotiationMoneyField, value: number): ProposalPayload {
  const v = Math.max(0, Math.round(value));
  switch (field) {
    case 'goldPerTurn': return { ...payload, goldPerTurn: v };
    case 'goldOnce': return { ...payload, goldOnce: v };
    case 'techPrice': return { ...payload, techPrice: v };
    case 'bribeGold': return { ...payload, bribeGold: v };
  }
}

export interface CounterOfferResult {
  payload: ProposalPayload;
  note: string;
}

/**
 * Generator kontroferty — Maciej 2026-07-26 (C-DYP-Q1=A pkt 2): „AI... składa
 * kontrofertę (ta sama treść z innymi warunkami — np. żąda dopłaty albo oferuje
 * mniej)". CELOWO nie liczy nowej wyceny: evaluateProposal (ISTNIEJĄCA ocena — patrz
 * sweetenerEasePoints/pnDealAcceptedByAi wyżej w tym pliku) jest tu WYROCZNIĄ —
 * funkcja szuka MINIMALNEJ zmiany JEDNEGO pola (słodzik / kwota), która przełącza jej
 * wynik na accepted=true. Zwraca null, gdy żadna próba w limicie kroków (stałe
 * NEGOTIATION_*_STEP/_MAX_STEPS wyżej) nie domyka propozycji — impas, silnik kończy
 * negocjację zwykłym odrzuceniem.
 *
 * Świadomie POZA zasięgiem (brak kontroferty, `null` od razu): koszyk wielo-pozycyjny PN w 'handel'/
 * 'zaproponuj_handel_surowiec' (giveItems/receiveItems niescalarne — patrz raport
 * zadania), 'namow_wojne' bez wskazanego celu.
 */
export function generateCounterOffer(
  proposal: DiplomaticProposal,
  ctx: ProposalEvalContext,
): CounterOfferResult | null {
  return withDiplomacyTradeEra(ctx.tradeEra ?? diplomacyTradeEra(), () => generateCounterOfferImpl(proposal, ctx));
}

function generateCounterOfferImpl(
  proposal: DiplomaticProposal,
  ctx: ProposalEvalContext,
): CounterOfferResult | null {
  const { actionId, payload } = proposal;
  if (NEGOTIATION_NO_ENGINE_COUNTER.has(actionId)) return null;

  const difficulty = ctx.difficulty ?? 'normal';
  const relTotal = treatyEvalRelationTotal(ctx.relation);
  const pnOpts: ResolveProposalPnOptions = { difficulty, tradeEra: ctx.tradeEra };

  // P-DYPLO-BILANS-GATE-NIESPOJNY runda 2 (GOAL 4 — kryterium końca 3): `tryPayload` bramkuje
  // KAŻDĄ kandydacką kontrofertę w tej funkcji (jedno miejsce, wszystkie ścieżki niżej), więc to
  // JEDYNY punkt, w którym trzeba dopiąć regułę "AI nie proponuje graczowi pakietu o ujemnym dla
  // gracza bilansie" strukturalnie, zamiast łatać każdą gałąź osobno. Gdy proponentem TEJ
  // negocjacji jest AI (`proposal.proposerOwnerId !== 0` — role stałe od rundy 1, patrz komentarz
  // bloku wyżej), a `evaluateProposal` dla kandydata zwraca numeryczny `pwBalance < 0` (dodane w
  // tej samej rundzie dla nap/sojusz/wasal/trybut_zadanie/trybut_oferta/granice — GOAL 2/6; dla
  // handel/umowa_szlakow/umowa_handlowa `pwBalance` już istniał), kandydat jest ODRZUCANY tu,
  // ZANIM funkcja go w ogóle rozważy jako `bestUp`/`bestDown`/wynik — mirror twardej reguły z
  // `balancePanelDataFromRows` (diplomacyAcceptanceBalance.ts, GOAL 3), tu zastosowany PRZED
  // wysłaniem propozycji do gracza, nie tylko przy jej wyświetleniu. Gdy proponentem jest gracz
  // (`proposerOwnerId === 0`, AI kontruje WŁASNĄ ofertę gracza), reguła nie dotyczy — to gracz
  // decyduje, czy jego własna, jeszcze niezaakceptowana propozycja mu się opłaca.
  const proposerIsAi = proposal.proposerOwnerId !== 0;
  const tryPayload = (p: ProposalPayload): boolean => {
    const evalResult = evaluateProposal({ ...proposal, payload: p }, ctx);
    if (!evalResult.accepted) return false;
    if (proposerIsAi && evalResult.pwBalance != null && evalResult.pwBalance < 0) return false;
    return true;
  };

  // R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C (GOAL b): `entry.proposerOwnerId` jest stałe od rundy 1
  // (patrz komentarz przy `resolveNegotiationAsResponder`) i bywa GRACZEM (gracz zainicjował
  // negocjację, AI odpowiada kontrofertą tutaj) — wtedy payload.giveItems/goldPerTurn itd.
  // reprezentują "co daje/żąda GRACZ", nie AI. `playerBenefitSurplusByRole` (nowa, w
  // diplomacy-ai-offer-balance.ts) jest jedynym punktem, który to rozróżnia poprawnie: dla
  // `proposerIsPlayer=false` (AI proponent — dzisiejsza jedyna zweryfikowana ścieżka, np.
  // AI negocjuje własną wcześniejszą ofertę) deleguje BIT-IDENTYCZNIE do dawnego
  // `aiProposalPlayerBenefitSurplus` (zero zmiany zachowania); dla `proposerIsPlayer=true`
  // (NOWA poprawka: gracz zainicjował, AI kontruje) liczy odwrotnie — matematyka opisana
  // w docstringu tamtej funkcji. `fairness` (multiplier/treatyBasePn) nadal CELOWO pominięty
  // (nieużywany dziś przez żadne wywołanie tej funkcji) — patrz osobny komentarz przy
  // `finalizePayload` niżej, który z tego samego powodu zostaje bez zmian.
  const proposerIsPlayer = proposal.proposerOwnerId === 0;
  const playerBenefitSurplus = (p: ProposalPayload): number =>
    playerBenefitSurplusByRole(p, relTotal, proposerIsPlayer, pnOpts);

  // `finalizePayload`/`trimProposalForZeroBalance` operują WYŁĄCZNIE na payload.giveItems
  // (złoto/surowiec w koszyku) — żadna z akcji obsługiwanych przez pętlę `moneyField` niżej
  // (trybut_oferta/tech/namow_wojne/ultimatum/handel-bez-koszyka) nie wypełnia koszyka, więc
  // to wywołanie jest tu no-op niezależnie od roli (zweryfikowane: `trimProposalGoldForZeroBalance`
  // wraca payload bez zmian gdy `goldIdx<0`, `trimResourcePaymentTradeForZeroBalance` wraca
  // bez zmian gdy `!hasResourcePaymentTrade`) — rozjazd ról w JEGO wewnętrznym użyciu
  // `aiProposalPlayerBenefitSurplus` pozostaje więc martwym kodem na tej ścieżce, poza
  // zakresem tego dispatchu (GOAL b dotyczy `generateCounterOffer`, nie tych helperów).
  const finalizePayload = (p: ProposalPayload): ProposalPayload =>
    aiOfferTargetsZeroBalance(difficulty)
      ? trimProposalForZeroBalance(p, relTotal, difficulty, pnOpts)
      : p;

  // trybut_zadanie: dźwignia naturalna to SAMA kwota żądania (respondent „oferuje
  // mniej" / proponent „żąda dopłaty") — dwukierunkowe przeszukanie PRZED słodzikiem.
  if (actionId === 'trybut_zadanie') {
    const base = payload.goldPerTurn ?? 0;
    if (base > 0) {
      let bestDown: CounterOfferResult | null = null;
      let bestUp: CounterOfferResult | null = null;
      for (let step = 1; step <= NEGOTIATION_MONEY_MAX_STEPS; step++) {
        const down = withMoneyField(payload, 'goldPerTurn', base * (1 - NEGOTIATION_MONEY_STEP_PCT * step));
        if ((down.goldPerTurn ?? 0) > 0 && tryPayload(down)) {
          const note = `obniżone żądanie trybutu (${down.goldPerTurn} ¤/turę)`;
          if (!bestDown || (down.goldPerTurn ?? 0) > (bestDown.payload.goldPerTurn ?? 0)) {
            bestDown = { payload: down, note };
          }
        }
        const up = withMoneyField(payload, 'goldPerTurn', base * (1 + NEGOTIATION_MONEY_STEP_PCT * step));
        if (tryPayload(up)) {
          const note = `podniesione żądanie trybutu (${up.goldPerTurn} ¤/turę)`;
          if (!bestUp || (up.goldPerTurn ?? 0) < (bestUp.payload.goldPerTurn ?? 0)) {
            bestUp = { payload: up, note };
          }
        }
      }
      return bestDown ?? bestUp;
    }
    return null;
  }

  if (SWEETENER_COUNTER_ELIGIBLE.has(actionId)) {
    if (tryPayload(payload)) return null;
    for (let step = 1; step <= NEGOTIATION_SWEETENER_MAX_STEPS; step++) {
      const extra = step * NEGOTIATION_SWEETENER_STEP_GOLD;
      const candidate = withExtraSweetenerGold(payload, extra);
      if (tryPayload(candidate)) {
        return { payload: candidate, note: `+${extra} ¤ słodzika do umowy` };
      }
    }
    if (actionId === 'granice' && payload.borderMilitary) {
      const candidate: ProposalPayload = { ...payload, borderMilitary: false };
      if (tryPayload(candidate)) {
        return { payload: candidate, note: 'rezygnacja z prawa wojskowego (tylko cywilne)' };
      }
    }
    return null;
  }

  const moneyField: NegotiationMoneyField | null =
    actionId === 'trybut_oferta' ? (payload.goldPerTurn != null ? 'goldPerTurn' : 'goldOnce')
    : actionId === 'tech' ? 'techPrice'
    : actionId === 'namow_wojne' ? 'bribeGold'
    : actionId === 'ultimatum' ? 'goldOnce'
    : (actionId === 'handel' && !payload.giveItems?.length && !payload.receiveItems?.length) ? 'goldOnce'
    : null;

  if (moneyField) {
    const base = getMoneyField(payload, moneyField);
    if (base > 0) {
      const tolerance = aiOfferPwSurplusTolerance(difficulty);
      let bestUp: CounterOfferResult | null = null;
      let bestDown: CounterOfferResult | null = null;
      for (let step = 1; step <= NEGOTIATION_MONEY_MAX_STEPS; step++) {
        const up = withMoneyField(payload, moneyField, base * (1 + NEGOTIATION_MONEY_STEP_PCT * step));
        if (tryPayload(up)) {
          const surplus = playerBenefitSurplus(up);
          if (surplus <= tolerance) {
            if (!bestUp || surplus < playerBenefitSurplus(bestUp.payload)) {
              bestUp = { payload: finalizePayload(up), note: `podbita oferta (${getMoneyField(up, moneyField)})` };
            }
          } else if (!aiOfferTargetsZeroBalance(difficulty)) {
            bestUp = { payload: up, note: `podbita oferta (${getMoneyField(up, moneyField)})` };
          }
        }
        if (actionId === 'trybut_oferta') {
          const down = withMoneyField(payload, moneyField, base * (1 - NEGOTIATION_MONEY_STEP_PCT * step));
          if (getMoneyField(down, moneyField) > 0 && tryPayload(down)) {
            const surplus = playerBenefitSurplus(down);
            if (surplus <= tolerance) {
              if (!bestDown || surplus < playerBenefitSurplus(bestDown.payload)) {
                bestDown = {
                  payload: finalizePayload(down),
                  note: `obniżona oferta (${getMoneyField(down, moneyField)})`,
                };
              }
            }
          }
        }
      }
      return bestUp ?? bestDown;
    }
  }

  return null;
}

export type NegotiationRoundOutcome =
  | { kind: 'accepted'; result: ProposalEvalResult }
  | { kind: 'rejected'; reason: string }
  | { kind: 'countered'; entry: PendingNegotiation; note: string };

/**
 * Rozstrzyga rundę z perspektywy AI — JEDYNA zautomatyzowana decyzja silnika (decyzje
 * GRACZA są zawsze ręczne, main.ts nie woła tej funkcji dla wpisów
 * awaitingOwnerId=gracz). Role proposerOwnerId/responderOwnerId brane ZAWSZE z entry
 * (stałe od rundy 1 — patrz komentarz bloku wyżej), niezależnie od tego, czy bieżącym
 * autorem warunków (authorOwnerId) jest ta sama, czy odwrotna strona.
 */
export function resolveNegotiationAsResponder(
  entry: PendingNegotiation,
  ctx: ProposalEvalContext,
  turn: number,
): NegotiationRoundOutcome {
  const proposal = negotiationAsProposal(entry);
  const result = evaluateProposal(proposal, ctx);
  if (result.accepted) return { kind: 'accepted', result };
  if (canCounterNegotiation(entry)) {
    const counter = generateCounterOffer(proposal, ctx);
    if (counter) {
      const nextEntry = applyCounterOffer(entry, counter.payload, entry.awaitingOwnerId, turn);
      return { kind: 'countered', entry: nextEntry, note: counter.note };
    }
  }
  return { kind: 'rejected', reason: result.reason };
}

/**
 * Adapter PendingNegotiation → (istniejący) PendingProposal — żeby ręczna akceptacja
 * gracza (KTÓRAKOLWIEK strona zainicjowała rundę 1) mogła użyć JEDNEGO buildera
 * traktatu (resolvePlayerAcceptsAiPending, wyżej w tym pliku) zamiast duplikować
 * konstrukcję deal po raz trzeci.
 */
export function negotiationToLegacyPending(entry: PendingNegotiation): PendingProposal {
  return {
    id: entry.id,
    fromOwnerId: entry.proposerOwnerId,
    toOwnerId: entry.responderOwnerId,
    actionId: entry.actionId,
    payload: entry.payload,
    createdTurn: entry.createdTurn,
    expiresTurn: entry.expiresTurn,
    source: entry.source,
  };
}
