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
  planPeacePayment,
  type PeaceAsset,
  type PeacePaymentPlan,
} from './diplomacy-ai-forced-peace';

export interface WarWearinessParams {
  zmeczenie: {
    pelneTur: number; wagaStratMiasta: number; stagnacjaOdTur: number; stagnacjaWaga: number;
    stagnacjaSkalaTur: number; progChetnosci: number; progWzajemnyPokoj: number;
  };
  przegrywajacy: {
    udzialWyraznie: number; wagaZmeczenia: number; wagaSily: number; wagaStrat: number; stratyNasycenie: number;
    progiStopni: number[]; mnozniStopni: number[]; mnoznikNaOdrzucenie: number; maxMiastNaPokoj: number;
    minMiastPoOddaniu: number; cooldownOfertTur: number; odrzuceniaDoKapitulacji: number;
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
  };
  czlowiek: { rwProgBonusMax: number; minMiastAi: number; rabatCenyPokojuMax: number };
}

export const WAR_WEARINESS_PARAMS = paramsRaw as unknown as WarWearinessParams;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export interface WarWearinessInput {
  turnsAtWar: number;
  /** Suma miast utraconych przez OBIE strony w tej wojnie. */
  lostCitiesTotal: number;
  /** Tury od ostatniej zmiany posiadania miast (undefined = od początku wojny). */
  turnsSinceCityChange?: number;
}

/** Poziom zmęczenia 0..1 (bez pamięci szczytu — szczyt trzyma stan pary). */
export function warWearinessLevel(inp: WarWearinessInput, P: WarWearinessParams = WAR_WEARINESS_PARAMS): number {
  const Z = P.zmeczenie;
  const turns = Math.max(0, inp.turnsAtWar);
  const since = inp.turnsSinceCityChange ?? turns;
  const stagn = Z.stagnacjaWaga * clamp((since - Z.stagnacjaOdTur) / Z.stagnacjaSkalaTur, 0, 1);
  return clamp(turns / Z.pelneTur + Z.wagaStratMiasta * Math.max(0, inp.lostCitiesTotal) + stagn, 0, 1);
}

/** Czynnik (0..1] ceny pokoju zadanej przez AI od gracza: maleje z zmęczeniem powyżej progu chęci. */
export function wearinessPeacePriceFactor(level: number, P: WarWearinessParams = WAR_WEARINESS_PARAMS): number {
  const t = P.zmeczenie.progChetnosci;
  const x = clamp((level - t) / Math.max(1e-9, 1 - t), 0, 1);
  return 1 - P.czlowiek.rabatCenyPokojuMax * x;
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

/** Ile miast wolno oddać na danym stopniu (0 / 1 / maxMiastNaPokoj). */
export function stageCityLimit(stage: number, P: WarWearinessParams = WAR_WEARINESS_PARAMS): number {
  if (stage <= 1) return 0;
  if (stage === 2) return Math.min(1, P.przegrywajacy.maxMiastNaPokoj);
  return P.przegrywajacy.maxMiastNaPokoj;
}

/** Mnożnik wartości oferty: bazowy stopnia + przyrost za każdą odrzuconą ofertę. */
export function offerMultiplier(stage: number, rejectedOffers: number, P: WarWearinessParams = WAR_WEARINESS_PARAMS): number {
  const arr = P.przegrywajacy.mnozniStopni;
  const base = arr[Math.min(Math.max(0, stage), arr.length - 1)] ?? 1;
  return base * (1 + P.przegrywajacy.mnoznikNaOdrzucenie * Math.max(0, rejectedOffers));
}

/**
 * Plan zapłaty eskalowanej: najpierw złoto, potem surowce, dopiero potem miasta (do `maxCities`, najtańsze pokrywające
 * resztę, inaczej najcenniejsze i kolejne). Miasta `forbidden` (stolica / ostatnie) nigdy. maxCities=0 → bez miast.
 * Czysta, deterministyczna (remisy: mniejsze id).
 */
export function planEscalatedPeacePayment(requiredPn: number, assets: readonly PeaceAsset[], maxCities: number): PeacePaymentPlan {
  const noCity = assets.filter(a => a.kind !== 'miasto');
  const base = planPeacePayment(requiredPn, noCity);
  if (base.full || maxCities <= 0) return base;
  const items: PeaceAsset[] = [...base.items];
  let covered = base.coveredPn;
  const need0 = Math.max(0, Math.ceil(requiredPn));
  let rem = need0 - covered;
  const byId = (a: PeaceAsset, b: PeaceAsset): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const pool = assets.filter(a => a.kind === 'miasto' && !a.forbidden && a.pn > 0)
    .sort((a, b) => a.pn - b.pn || byId(a, b));
  for (let n = 0; n < maxCities && rem > 0 && pool.length > 0; n++) {
    const cover = pool.find(c => c.pn >= rem) ?? pool[pool.length - 1]!;
    pool.splice(pool.indexOf(cover), 1);
    items.push(cover);
    covered += cover.pn;
    rem -= cover.pn;
  }
  const histogram = { zloto: 0, surowiec_ilosc: 0, miasto: 0 };
  for (const it of items) histogram[it.kind] += 1;
  return { items, coveredPn: covered, shortfallPn: Math.max(0, need0 - covered), full: covered >= need0, histogram };
}

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
  warInfo: (a: number, b: number) => WearinessWarInfo;
  /** Udział siły x w parze (x vs y). */
  shareOf: (x: number, y: number) => number;
  cityCountOf: (owner: number) => number;
  price: (winner: number, loser: number) => { requiredPn: number; balanceFor: (coveredPn: number) => number; tolerancePn: number };
  assets: (loser: number, winner: number, skipCityIds: ReadonlySet<string>) => PeaceAsset[];
  cityCessionOk: (cityId: string, loser: number, winner: number) => boolean;
  battlePending: boolean;
  pay: (loser: number, winner: number, plan: PeacePaymentPlan) => void;
  finalize: (loser: number, winner: number) => void;
  log?: (msg: string) => void;
  params?: WarWearinessParams;
}

export interface WearinessTickOutcome {
  pairKey: string;
  action: 'none' | 'mutual_peace' | 'offer_accepted' | 'offer_rejected';
  level: number;
  stage: number;
  plan?: PeacePaymentPlan;
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
      { turnsAtWar: w.turnsAtWar, lostCitiesTotal: w.lostA + w.lostB, turnsSinceCityChange: w.turnsSinceCityChange }, P);
    const st = stepPairState(d.store, key, w.warStart, level);
    const lvl = st.peak;
    const none = (): void => { out.push({ pairKey: key, action: 'none', level: lvl, stage: st.stage }); };
    const shareA = d.shareOf(pr.a, pr.b);
    const loser = shareA <= 0.5 ? pr.a : pr.b;
    const winner = loser === pr.a ? pr.b : pr.a;
    const loserShare = loser === pr.a ? shareA : 1 - shareA;
    const lostLoser = loser === pr.a ? w.lostA : w.lostB;
    const L = P.przegrywajacy;
    const clearlyLosing = loserShare <= L.udzialWyraznie;

    if (!clearlyLosing) {
      if (!isWarWeary(lvl, P)) { none(); continue; }
      // Równowaga sił: wzajemne wyczerpanie — pokój bez zapłaty, gdy obie strony dość zmęczone.
      if (lvl >= P.zmeczenie.progWzajemnyPokoj) {
        d.log?.(`pokój z wyczerpania AI${pr.a}↔AI${pr.b} (zmęczenie ${lvl.toFixed(2)}, tury wojny ${w.turnsAtWar})`);
        d.finalize(loser, winner);
        d.store.delete(key);
        out.push({ pairKey: key, action: 'mutual_peace', level: lvl, stage: st.stage });
      } else none();
      continue;
    }

    // LIVE-AUDIT-Q1: wyraźnie przegrywający NIE czeka na zmęczenie pary (>= progChetnosci = min. ~100 tur wojny):
    // oferta od ofertaOdTurWojny (po utracie miasta) albo od ofertaBezStratOdTur (bez strat).
    const ownCities = d.cityCountOf(loser);
    if (w.turnsAtWar < L.ofertaOdTurWojny) { none(); continue; }
    if (lostLoser <= 0 && w.turnsAtWar < L.ofertaBezStratOdTur && !isWarWeary(lvl, P)) { none(); continue; }
    // Ochrona przed snowballem: mało miast albo duże straty => zwycięzca musi przyjąć pokój.
    const protectedLoser = (ownCities <= L.ochronaMaxMiast && lostLoser >= 1) || lostLoser >= L.ochronaUtratyWojny;

    // Wyraźnie przegrywa: eskalowana oferta.
    const despair = loserDespair({ level: lvl, share: loserShare, lostCities: lostLoser }, P);
    st.stage = Math.max(st.stage, despairStage(despair, P), protectedLoser ? 1 : 0);
    if (st.stage <= 0) { none(); continue; }
    if (st.lastOfferTurn >= 0 && d.turn - st.lastOfferTurn < P.przegrywajacy.cooldownOfertTur) { none(); continue; }

    const price = d.price(winner, loser);
    const required = price.requiredPn * offerMultiplier(st.stage, st.rejectedOffers, P);
    const maxCities = d.battlePending
      ? 0
      : Math.max(0, Math.min(stageCityLimit(st.stage, P), ownCities - P.przegrywajacy.minMiastPoOddaniu));
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
    if (mustAccept || exhausted || price.balanceFor(plan.coveredPn) >= -tol) {
      d.pay(loser, winner, plan);
      d.log?.(
        `pokój AI${loser}↔AI${winner} za cenę (stopień ${st.stage}${mustAccept ? ', ochrona przegrywającego' : exhausted ? ', wyczerpanie' : ''}, oferta #${st.rejectedOffers + 1}, zmęczenie ${lvl.toFixed(2)}); `
        + `zloto=${plan.histogram.zloto} surowce=${plan.histogram.surowiec_ilosc} miasto=${plan.histogram.miasto} (${plan.coveredPn}/${Math.round(required)} PW)`,
      );
      d.finalize(loser, winner);
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
