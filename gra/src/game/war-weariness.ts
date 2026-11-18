// R-WEB-AI-WAR-WEARINESS-PEACE-Q1 — postępujące zmęczenie wojną + eskalacja oferty pokoju przegrywającego.
//
// Zgłoszenie właściciela (2026-11-04): (1) po ~200 turach wojny obie strony chcą pokoju; (2) wyraźnie przegrywająca
// cywilizacja z czasem składa BARDZO dobre warunki (złoto/surowce, potem miasto/miasta) — „za wszelką cenę".
//
// PURE: bez DOM / stanu gry. Wszystkie progi z `data/war-weariness-params.json`. Wejścia podaje main.ts / ai.ts.
// Zmęczenie jest funkcją długości wojny i strat (deterministyczne); stan pary (szczyt, stopień, licznik ofert)
// jest zapisywany w save (main.ts) i kasowany przy pokoju (nowa wojna = nowy stan).

import paramsRaw from '../../data/war-weariness-params.json';
import {
  isAiAiPeaceBalanceAllowed,
  planCityPeacePayment,
  type PeaceAsset,
  type PeacePaymentPlan,
} from './diplomacy-ai-forced-peace';
import { PEACE_PROPOSAL_MIN_WAR_TURNS } from './diplomacy-peace-proposal-timing';
import { peaceStanceOf, type PeaceStanceSide } from './diplomacy-military-strength';

export interface WarWearinessParams {
  zmeczenie: {
    pelneTur: number; wagaStratMiasta: number; progChetnosci: number; progWzajemnyPokoj: number;
    /** Prog 80% pokazywany w widoku zmeczenia (war-weariness-view.ts: „AI proponuje pokoj z miastami”). NIE wyzwala pokoju bezwarunkowego. */
    progKoncaZmeczenia: number;
    /** DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1: od tego poziomu pokój jest WYMUSZONY (1,0 = 100%). */
    progWymuszonyPokoj: number;
  };
  przegrywajacy: {
    udzialWyraznie: number; wagaZmeczenia: number; wagaSily: number; wagaStrat: number; stratyNasycenie: number;
    progiStopni: number[];
    cooldownOfertTur: number; odrzuceniaDoKapitulacji: number;
    /** LIVE-AUDIT-Q1: najwcześniejsza tura wojny, od której wyraźnie przegrywający składa ofertę (bez czekania na zmęczenie). */
    ofertaOdTurWojny: number;
    /** LIVE-AUDIT-Q1: gdy przegrywający nie stracił żadnego miasta — oferta dopiero od tylu tur wojny. */
    ofertaBezStratOdTur: number;
    /** LIVE-AUDIT-Q1: ochrona przed snowballem — przegrywający z <= tylu miast jest „chroniony”. */
    ochronaMaxMiast: number;
    /** LIVE-AUDIT-Q1: ochrona przed snowballem — przegrywający, który stracił >= tylu miast w tej wojnie, jest „chroniony”. */
    ochronaUtratyWojny: number;
    /** LIVE-AUDIT-Q1: 1 = zwycięzca MUSI przyjąć ofertę chronionego przegrywającego (0 = zwykła wycena). */
    zwyciezcaMusiPrzyjac: number;
    /** LIVE-AUDIT-Q1: symetria — zmęczenie obniża wymagania zwycięzcy o tolerancjaZmeczenia*poziom*cena. */
    tolerancjaZmeczenia: number;
    /** LIVE-AUDIT-Q1 r2: karencja DOW (tury) po pokoju z zmeczenia/oferty — zamiast domyslnych 10 (cykl wojna->pokoj->ta sama wojna). */
    karencjaPoPokojuTur: number;
    /** LIVE-AUDIT-Q1 r2: karencja DOW (tury) po pokoju CHRONIONEGO przegrywajacego (<= ochronaMaxMiast miast / >= ochronaUtratyWojny utrat) — zapobiega serii wojen do eliminacji. */
    karencjaChronionegoTur: number;
  };
  czlowiek: { rwProgBonusMax: number; minMiastAi: number };
  /** R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1: cena pokoju = cenaStartPn × (1 − L). */
  cenaPokoju: { cenaStartPn: number };
}

export const WAR_WEARINESS_PARAMS = paramsRaw as unknown as WarWearinessParams;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export interface WarWearinessInput {
  turnsAtWar: number;
  /** Suma miast utraconych przez OBIE strony w tej wojnie. */
  lostCitiesTotal: number;
  /**
   * Tury od ostatniej zmiany posiadania miast. R-WEB-DIPLO-WEARINESS-20-TURNS-Q1: bez wpływu na poziom
   * (składnik zastoju usunięty — jeden licznik). Pole zostaje tylko dla zgodności wywołań.
   */
  turnsSinceCityChange?: number;
}

/**
 * R-WEB-DIPLO-WEARINESS-PW-FOLLOWUP-C615-BOTH-CITIES-Q1 (ABC właściciela 2026-11-14, wariant A): JEDNA liczba miast dla
 * zmęczenia wojną pary = miasta utracone przez OBIE strony w tej wojnie (suma). Używana przez tabelę PW
 * (diplomacy-proposals.ts, przez main.ts) i przez tick AI↔AI (runWarWearinessTick) — ta sama dana wojny ⇒ ta sama liczba.
 */
export function lostCitiesForWeariness(lostA: number, lostB: number): number {
  return Math.max(0, lostA) + Math.max(0, lostB);
}

/**
 * Poziom zmęczenia 0..1 (bez pamięci szczytu — szczyt trzyma stan pary). Jeden licznik:
 * turyWojny/pelneTur + wagaStratMiasta * miastaZmienioneWlasciciela, min(1, …).
 */
export function warWearinessLevel(inp: WarWearinessInput, P: WarWearinessParams = WAR_WEARINESS_PARAMS): number {
  const Z = P.zmeczenie;
  const turns = Math.max(0, inp.turnsAtWar);
  return clamp(turns / Z.pelneTur + Z.wagaStratMiasta * Math.max(0, inp.lostCitiesTotal), 0, 1);
}

/**
 * R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (decyzja właściciela 2026-11-17): cena pokoju w PN po wojnie maleje
 * liniowo z poziomem zmęczenia pary: cena = round(cenaStartPn × (1 − L)), L = clamp(level, 0, 1).
 * Na starcie wojny (L = 0) ≈ 6000 PN (3 miasta przegrywającego); przy L = 1 cena 0 (pokój bez oddania miasta).
 * Jedyne miejsce liczenia tej ceny (jedna prawda). Czysta funkcja.
 */
export function wearinessPeaceCashPn(level: number, P: WarWearinessParams = WAR_WEARINESS_PARAMS): number {
  const start = Math.max(0, P.cenaPokoju.cenaStartPn);
  return Math.round(start * (1 - clamp(level, 0, 1)));
}

export function isWarWeary(level: number, P: WarWearinessParams = WAR_WEARINESS_PARAMS): boolean {
  return level >= P.zmeczenie.progChetnosci;
}

export interface DespairInput {
  level: number;
  /** Udział siły przegrywającego (0..1). */
  share: number;
  /** Miasta utracone przez przegrywającego w tej wojnie. */
  lostCities: number;
}

/** Desperacja przegrywającego 0..1 (zmęczenie + słabość siłowa + utrata miast). Poza „wyraźnie przegrywa" = 0. */
export function loserDespair(inp: DespairInput, P: WarWearinessParams = WAR_WEARINESS_PARAMS): number {
  const L = P.przegrywajacy;
  if (inp.share > L.udzialWyraznie) return 0;
  const weak = clamp((L.udzialWyraznie - inp.share) / L.udzialWyraznie, 0, 1);
  const loss = clamp(Math.max(0, inp.lostCities) / L.stratyNasycenie, 0, 1);
  return clamp(L.wagaZmeczenia * inp.level + L.wagaSily * weak + L.wagaStrat * loss, 0, 1);
}

/** Stopień oferty 0..3 = liczba progów ≤ desperacja. */
export function despairStage(despair: number, P: WarWearinessParams = WAR_WEARINESS_PARAMS): number {
  let s = 0;
  for (const t of P.przegrywajacy.progiStopni) if (despair >= t) s++;
  return s;
}

/**
 * Plan zapłaty miastami (re-eksport z diplomacy-ai-forced-peace: jedna implementacja dla pokoju wymuszonego, ofert
 * dobrowolnych i próśb AI↔AI). Zob. planCityPeacePayment.
 */
export const planEscalatedPeacePayment = planCityPeacePayment;

// ---------------------------------------------------------------------------
// Stan pary (save/load) + tick AI↔AI
// ---------------------------------------------------------------------------

export interface WarWearinessPairState {
  /** Tura startu wojny, której dotyczy stan (inna wojna → reset). */
  warStart: number;
  /** Szczyt zmęczenia (monotoniczność w obrębie wojny). */
  peak: number;
  /** Najwyższy osiągnięty stopień oferty (histereza — nie spada). */
  stage: number;
  rejectedOffers: number;
  /** Tura ostatniej oferty (cooldown); -1 = brak. */
  lastOfferTurn: number;
}

export type WarWearinessStore = Map<string, WarWearinessPairState>;

/** Aktualizuje (lub zakłada) stan pary; zmiana `warStart` = nowa wojna = reset. Zwraca stan ze szczytem. */
export function stepPairState(store: WarWearinessStore, key: string, warStart: number, level: number): WarWearinessPairState {
  const prev = store.get(key);
  const st: WarWearinessPairState = prev && prev.warStart === warStart
    ? prev
    : { warStart, peak: 0, stage: 0, rejectedOffers: 0, lastOfferTurn: -1 };
  st.peak = Math.max(st.peak, level);
  store.set(key, st);
  return st;
}

export interface WearinessPair {
  a: number;
  b: number;
}

export interface WearinessWarInfo {
  warStart: number;
  turnsAtWar: number;
  /** Miasta utracone przez a / b w tej wojnie. */
  lostA: number;
  lostB: number;
  turnsSinceCityChange: number;
}

export interface WearinessTickDeps {
  store: WarWearinessStore;
  turn: number;
  /** Pary AI↔AI aktualnie w wojnie (główne AI, nie wyeliminowane). Kolejność deterministyczna (a<b rosnąco). */
  pairs: readonly WearinessPair[];
  pairKey: (a: number, b: number) => string;
  /**
   * DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1: true = para zawiera gracza. Dla takiej pary tick kończy pokój
   * WYŁĄCZNIE przy wymuszeniu (100% zmęczenia, z oknem i wpisem „Ważne"); bez tego pokój „za cenę" (w tym cena 0)
   * zapadałby po cichu przy niższym zmęczeniu, bez zgody gracza.
   */
  isPlayerPair?: (a: number, b: number) => boolean;
  warInfo: (a: number, b: number) => WearinessWarInfo;
  /** Udział siły MILITARNEJ x w parze (x vs y), 0..1 (R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1: nie Power). */
  shareOf: (x: number, y: number) => number;
  /**
   * Słabsza strona wg reguły siły militarnej (compareMilitaryStrength: większa siła; remis = większa armia; dalej
   * mniejszy id). Gdy brak — przegrywający = strona z udziałem <= 0,5 (lub a przy remisie).
   */
  weakerOf?: (x: number, y: number) => number;
  cityCountOf: (owner: number) => number;
  /** R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1: `level` = poziom zmęczenia pary (cena pokoju = wearinessPeaceCashPn(level)). */
  price: (winner: number, loser: number, level: number) => { requiredPn: number; balanceFor: (coveredPn: number) => number; tolerancePn: number; loserBalanceFor?: (coveredPn: number) => number };
  assets: (loser: number, winner: number, skipCityIds: ReadonlySet<string>) => PeaceAsset[];
  cityCessionOk: (cityId: string, loser: number, winner: number) => boolean;
  battlePending: boolean;
  pay: (loser: number, winner: number, plan: PeacePaymentPlan) => void;
  /** `lockTurns` = karencja DOW po tym pokoju (z JSON); silnik przekazuje ja do finalizePeaceTreatyBetween. */
  finalize: (loser: number, winner: number, lockTurns: number) => void;
  log?: (msg: string) => void;
  params?: WarWearinessParams;
}

export interface WearinessTickOutcome {
  pairKey: string;
  action: 'none' | 'forced_peace' | 'offer_accepted' | 'offer_rejected';
  level: number;
  stage: number;
  plan?: PeacePaymentPlan;
  /** Strony pokoju wymuszonego (DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1): przegrywający i wygrywający. */
  loser?: number;
  winner?: number;
}

/**
 * DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1: czy zmęczenie wojną wymusza pokój (poziom >= progWymuszonyPokoj,
 * 100%). Pokój wymuszony jest ZAWSZE płatny miastami przegrywającego (gdy wyraźnie przegrywa), nigdy bezwarunkowy.
 * Przy 80% (progKoncaZmeczenia) AI tylko PROPONUJE pokój z miastami (istniejąca eskalacja). Czysta funkcja.
 */
export function wearinessForcedPeaceDue(level: number, P: WarWearinessParams = WAR_WEARINESS_PARAMS): boolean {
  return level >= P.zmeczenie.progWymuszonyPokoj;
}

export function runWarWearinessTick(d: WearinessTickDeps): WearinessTickOutcome[] {
  const P = d.params ?? WAR_WEARINESS_PARAMS;
  const out: WearinessTickOutcome[] = [];
  const live = new Set<string>();
  for (const pr of d.pairs) {
    const key = d.pairKey(pr.a, pr.b);
    live.add(key);
    const w = d.warInfo(pr.a, pr.b);
    const level = warWearinessLevel(
      { turnsAtWar: w.turnsAtWar, lostCitiesTotal: lostCitiesForWeariness(w.lostA, w.lostB), turnsSinceCityChange: w.turnsSinceCityChange }, P);
    const st = stepPairState(d.store, key, w.warStart, level);
    // Migracja (DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1, pkt g): szczyt ze starego zapisu (skala 20 tur)
    // nie może wymusić pokoju po wczytaniu. Poziom jest monotoniczny w wojnie, więc szczyt > bieżący poziom = stary.
    if (st.peak > level) st.peak = level;
    const lvl = st.peak;
    const none = (): void => { out.push({ pairKey: key, action: 'none', level: lvl, stage: st.stage }); };
    // Keep updating the fatigue peak each turn, but do not submit/resolve an automatic peace offer yet.
    if (w.turnsAtWar < PEACE_PROPOSAL_MIN_WAR_TURNS) { none(); continue; }
    // R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1: przegrywający = strona SŁABSZA wg siły militarnej (remis: reguła
    // compareMilitaryStrength, czyli ta strona płaci miastem). Brak pokoju bez zapłaty (zmiana 3).
    const shareA = d.shareOf(pr.a, pr.b);
    const loser = d.weakerOf ? d.weakerOf(pr.a, pr.b) : (shareA <= 0.5 ? pr.a : pr.b);
    const winner = loser === pr.a ? pr.b : pr.a;
    const loserShare = loser === pr.a ? shareA : 1 - shareA;
    const lostLoser = loser === pr.a ? w.lostA : w.lostB;
    const L = P.przegrywajacy;
    const ownCities = d.cityCountOf(loser);
    const protectedLoser = (ownCities <= L.ochronaMaxMiast && lostLoser >= 1) || lostLoser >= L.ochronaUtratyWojny;
    // DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1: 100% zmęczenia = pokój WYMUSZONY. Wyraźnie przegrywający
    // oddaje tyle miast, ile trzeba do zrównoważenia ceny pokoju (bez stałego limitu 1–2; nigdy stolica; BEZ progu
    // min. 3 miast — decyzja właściciela 2026-11-17). Brak wyraźnie przegrywającego albo cena 0 → pokój BEZ miast.
    // Uwaga: przy progWymuszonyPokoj = 1,0 cena = 0 (wearinessPeaceCashPn(1) = 0), więc gałąź „cena > 0” jest
    // nieosiągalna do czasu osobnej decyzji ABC o progu/cenie minimalnej (DECISION_REQUIRED w raporcie). Bez bramki bilansu.
    // Bitwa w toku (battlePending): pokój wymuszony ODROCZONY na następną turę (ABC orkiestratora, zarzut FC 1+2).
    if (wearinessForcedPeaceDue(lvl, P) && d.battlePending) { none(); continue; }
    if (wearinessForcedPeaceDue(lvl, P)) {
      const lockEnd = protectedLoser ? L.karencjaChronionegoTur : L.karencjaPoPokojuTur;
      // R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1: cena = cenaPokojuPn(L) (malejąca; 0 przy 100%). Bez progu min. 3 miast.
      const cashPn = wearinessPeaceCashPn(lvl, P);
      const cityCap = d.battlePending ? 0 : Math.max(0, ownCities);
      const clearLoser = loserShare <= L.udzialWyraznie;
      let forcedPlan: PeacePaymentPlan | undefined;
      if (clearLoser && cashPn > 0 && cityCap > 0) {
        const skipF = new Set<string>();
        const cityPlan = (): PeacePaymentPlan => planEscalatedPeacePayment(
          cashPn, d.assets(loser, winner, skipF).filter(x => x.kind === 'miasto'), cityCap);
        forcedPlan = cityPlan();
        for (let guard = 0; guard < 8; guard++) {
          const bad = forcedPlan.items.find(i => !d.cityCessionOk(i.id, loser, winner));
          if (!bad) break;
          skipF.add(bad.id);
          forcedPlan = cityPlan();
        }
        if (forcedPlan.items.length > 0) d.pay(loser, winner, forcedPlan);
      }
      const given = forcedPlan?.histogram.miasto ?? 0;
      // Cena > 0 i brak pełnego pokrycia miastami (np. tylko stolica) → pokój NIE zapada, wojna trwa (stan pary zostaje).
      if (cashPn > 0 && !forcedPlan?.full) { none(); continue; }
      d.finalize(loser, winner, lockEnd);
      d.log?.(`pokój WYMUSZONY AI${loser}↔AI${winner} przy zmęczeniu ${lvl.toFixed(2)}; miasta oddane: ${given}`);
      d.store.delete(key);
      out.push({ pairKey: key, action: 'forced_peace', level: lvl, stage: st.stage, plan: forcedPlan, loser, winner });
      continue;
    }
    // DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1: para z graczem poza wymuszeniem (wyżej) — brak automatycznego
    // pokoju „za cenę" i brak ofert AI tym torem; pokój za zgodą gracza przez zwykłe negocjacje.
    if (d.isPlayerPair && d.isPlayerPair(pr.a, pr.b)) { none(); continue; }
    // Desperacja liczona z udziałem nie większym niż próg „wyraźnie" (słabsza strona przy remisie nie wypada z oferty).
    const shareForDespair = Math.min(loserShare, L.udzialWyraznie);

    // LIVE-AUDIT-Q1: przegrywający NIE czeka na zmęczenie pary (>= progChetnosci = min. ~100 tur wojny):
    // oferta od ofertaOdTurWojny (po utracie miasta) albo od ofertaBezStratOdTur (bez strat).
    if (w.turnsAtWar < L.ofertaOdTurWojny) { none(); continue; }
    if (lostLoser <= 0 && w.turnsAtWar < L.ofertaBezStratOdTur && !isWarWeary(lvl, P)) { none(); continue; }
    // R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1: cena pokoju 0 → pokój bez oddawania miasta (także przy jednym mieście).
    const price = d.price(winner, loser, lvl);
    const priceZero = price.requiredPn <= 0;
    // Zmiana 4: słabsza strona z JEDNYM miastem nie kupuje pokoju do końca wojny (cena 0 nie jest zakupem).
    if (ownCities <= 1 && !priceZero) { none(); continue; }

    // Słabsza strona: eskalowana oferta (wyłącznie miasta).
    const despair = loserDespair({ level: lvl, share: shareForDespair, lostCities: lostLoser }, P);
    st.stage = Math.max(st.stage, despairStage(despair, P), protectedLoser ? 1 : 0);
    if (st.stage <= 0) { none(); continue; }
    if (st.lastOfferTurn >= 0 && d.turn - st.lastOfferTurn < P.przegrywajacy.cooldownOfertTur) { none(); continue; }

    // R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (DR-2): JEDNA cena = price.requiredPn (= wearinessPeaceCashPn(L) po bramce
    // relacji) — bez mnożników stopnia/odrzuceń i bez limitu liczby miast; liczba miast = minimum równoważące cenę
    // (planEscalatedPeacePayment), stolica nigdy. Bitwa w toku → brak oddawalnych miast.
    const required = price.requiredPn;
    const maxCities = d.battlePending ? 0 : Math.max(0, ownCities);
    const skip = new Set<string>();
    const planFor = (): PeacePaymentPlan => planEscalatedPeacePayment(required, d.assets(loser, winner, skip), maxCities);
    let plan = planFor();
    for (let guard = 0; guard < 8; guard++) {
      const bad = plan.items.find(i => i.kind === 'miasto' && !d.cityCessionOk(i.id, loser, winner));
      if (!bad) break;
      skip.add(bad.id);
      plan = planFor();
    }
    st.lastOfferTurn = d.turn;
    // Zwycięzca akceptuje, gdy jego bilans PO zapłacie mieści się w tolerancji (istniejąca wycena wartości dalszej wojny).
    // Wyjście awaryjne: wyczerpany wygrywający po serii odrzuceń bierze, co przegrywający realnie może dać.
    const exhausted = lvl >= P.zmeczenie.progWzajemnyPokoj
      && st.rejectedOffers >= P.przegrywajacy.odrzuceniaDoKapitulacji;
    const mustAccept = protectedLoser && L.zwyciezcaMusiPrzyjac > 0;
    // Symetria: zmęczenie obniża wymagania zwycięzcy (zmęczona strona bierze mniej).
    const tol = price.tolerancePn + Math.max(0, L.tolerancjaZmeczenia) * lvl * Math.max(0, required);
    // Regula nieujemnego bilansu AI↔AI (2026-11-09): ujemny bilans ktorejkolwiek AI blokuje pokoj takze przy ochronie/wyczerpaniu.
    const balanceOk = isAiAiPeaceBalanceAllowed(price.balanceFor(plan.coveredPn), price.loserBalanceFor?.(plan.coveredPn));
    // R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (decyzja właściciela): cena > 0 bez PEŁNEGO pokrycia miastami = pokój nie
    // zapada, wojna trwa (także przy ochronie/wyczerpaniu — brak „częściowej” zapłaty).
    const priceCovered = priceZero || plan.full;
    if (priceCovered && balanceOk && (mustAccept || exhausted || price.balanceFor(plan.coveredPn) >= -tol)) {
      d.pay(loser, winner, plan);
      d.log?.(
        `pokój AI${loser}↔AI${winner} za cenę (stopień ${st.stage}${mustAccept ? ', ochrona przegrywającego' : exhausted ? ', wyczerpanie' : ''}, oferta #${st.rejectedOffers + 1}, zmęczenie ${lvl.toFixed(2)}); `
        + `zloto=${plan.histogram.zloto} surowce=${plan.histogram.surowiec_ilosc} miasto=${plan.histogram.miasto} (${plan.coveredPn}/${Math.round(required)} PW)`,
      );
      d.finalize(loser, winner, protectedLoser ? L.karencjaChronionegoTur : L.karencjaPoPokojuTur);
      d.store.delete(key);
      out.push({ pairKey: key, action: 'offer_accepted', level: lvl, stage: st.stage, plan });
    } else {
      st.rejectedOffers++;
      out.push({ pairKey: key, action: 'offer_rejected', level: lvl, stage: st.stage, plan });
    }
  }
  // Sprzątanie stanu par, które nie są już w wojnie (pokój innym torem).
  for (const k of Array.from(d.store.keys())) if (!live.has(k)) d.store.delete(k);
  return out;
}

// ---------------------------------------------------------------------------
// R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1 (obrona r1): wiring miary SIŁY MILITARNEJ dla zmęczenia wojną.
// Jedyne miejsca, w których main.ts / ai.ts wiążą udział i „słabszą stronę" z tym modułem. Czyste funkcje
// (bez DOM / stanu): wejściem jest `sideOf` (siła + armia wg silnika), NIE Power. Powrót do Power w okablowaniu
// wymaga zmiany tych funkcji (czerwieni test diplo-weariness-city-only-test.cjs).
// ---------------------------------------------------------------------------

export interface WearinessMilitarySide {
  sila: number;
  armiaPkt: number;
}

/** Udział siły militarnej strony x w parze (0..1); brak siły po obu stronach = 0,5. */
export function wearinessMilitaryShare(silaX: number, silaY: number): number {
  return silaX + silaY > 0 ? silaX / (silaX + silaY) : 0.5;
}

/** Słabsza strona wg reguły peaceStanceOf (siła militarna; remis rozstrzyga armia i id). Zwraca id przegrywającego. */
export function wearinessWeakerOf(
  x: number,
  y: number,
  sideOf: (owner: number, other: number) => WearinessMilitarySide,
): number {
  const sx = sideOf(x, y);
  const sy = sideOf(y, x);
  const self: PeaceStanceSide = { id: x, sila: sx.sila, armiaPkt: sx.armiaPkt };
  const partner: PeaceStanceSide = { id: y, sila: sy.sila, armiaPkt: sy.armiaPkt };
  return peaceStanceOf(self, partner) === 'slabsza' ? x : y;
}

/** Okablowanie dla runWarWearinessTick: shareOf (udział siły) i weakerOf (słabsza strona), oba wg `sideOf`. */
export function militaryWearinessWiring(
  sideOf: (owner: number, other: number) => WearinessMilitarySide,
): { shareOf: (x: number, y: number) => number; weakerOf: (x: number, y: number) => number } {
  return {
    shareOf: (x, y) => wearinessMilitaryShare(sideOf(x, y).sila, sideOf(y, x).sila),
    weakerOf: (x, y) => wearinessWeakerOf(x, y, sideOf),
  };
}
