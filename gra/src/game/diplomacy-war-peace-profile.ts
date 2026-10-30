// R-WEB-PEACE-RULES-Q1 (runda 1) — czyste reguły wojny i pokoju per cywilizacja.
// Bez zależności od stanu gry: wejścia podaje silnik (main.ts / ai.ts / diplomacy-proposals.ts),
// wynik wraca jako wartość. Parametry: gra/data/diplomacy-war-peace-params.json;
// wartości cywilizacji: gra/data/civ-matrix.json (dip_prog_wojny, ai_*).
// EN: pure war/peace rules per civilization (R1-R7 of R-WEB-PEACE-RULES-Q1).

import matrixRaw from '../../data/civ-matrix.json';
import paramsRaw from '../../data/diplomacy-war-peace-params.json';

export interface WarPeaceParams {
  progWojnyRelacji: { baza: number; wagaProgWojny: number; wagaEkspansja: number; ekspansjaSrodek: number; wagaPodboj: number; podbojSrodek: number; min: number; max: number; bazaBrakDanych: number };
  progPokojSlabosc: { baza: number; agresjaSrodek: number; wagaAgresja: number; premiaProfilObronny: number; min: number; max: number; bazaBrakDanych: number };
  progKrytyczny: { baza: number; agresjaSrodek: number; wagaAgresja: number; min: number; max: number; bazaBrakDanych: number };
  progZdrowia: { baza: number; tolerancjaSrodek: number; wagaTolerancja: number; min: number; max: number; bazaBrakDanych: number };
  minTurWojny: { baza: number; agresjaWysoka: number; premiaAgresjaWysoka: number; agresjaNiska: number; karaAgresjaNiska: number; karaProfilObronny: number; min: number; max: number; bazaBrakDanych: number };
  zmeczenie: { maksUdzial: number; bazaTur: number; wagaAgresja: number; maksTur: number; progSygnaluPokoju: number; bazaTurBrakDanych: number };
  sygnalyPokoju: { progRwMiasta: number; patTurWojny: number; patBrakZmianyTur: number };
  cenaPokoju: {
    odrzucenieRwProg: number; odrzucenieMaxTurWojny: number; progSilyWysoki: number; wagaSily: number; maxMnoznikSily: number;
    progSilyNiski: number; mnoznikSilyNiski: number; agresjaSrodek: number; wagaAgresja: number; podbojSrodek: number;
    wagaPodboj: number; mnoznikCywMin: number; mnoznikCywMax: number; turyBezOgraniczenAi: number;
  };
  hamulecRelacji: { progKryzysuMinusPunkty: number; bazaN: number; wagaProgWojny: number; minN: number; maxN: number };
}

export const WAR_PEACE_PARAMS = paramsRaw as unknown as WarPeaceParams;

/** Maksymalny udział zmęczenia wojną (0..0.5) — "pełne zmęczenie" po T turach. */
export const WAR_WEARINESS_MAX_SHARE = WAR_PEACE_PARAMS.zmeczenie.maksUdzial;

export interface WarPeaceProfile {
  /** Klucz cywilizacji (typCywilizacji) albo null dla gracza/nieznanego. */
  civKey: string | null;
  /** true gdy znaleziono wiersz macierzy; false = wartości bazowe. */
  hasData: boolean;
  agresywnosc: number;
  ekspansywnosc: number;
  sklonnoscPodboju: number;
  tolerancjaRyzyka: number;
  progWojnyMacierz: number;
  profilObronny: boolean;
  /** Próg Relacji (0–200), poniżej którego AI może wypowiedzieć wojnę (zastępuje progMinimalnyRelacja=30). */
  progWojnyRelacji: number;
  /** Udział rw (0..1), poniżej którego AI proponuje pokój jako słabsze. */
  progPokojSlabosc: number;
  /** Udział rw, poniżej którego AI płaci trybut za pokój (krytyczna słabość). */
  progKrytyczny: number;
  /** Udział zdrowia armii, poniżej którego AI szuka pokoju (sygnał c — parametr bez źródła danych). */
  progZdrowia: number;
  /** Minimalna liczba tur wojny, zanim AI przyjmie pokój od gracza. */
  minTurWojny: number;
  /** Liczba tur wojny do pełnego zmęczenia (T ≤ 20). */
  zmeczenieT: number;
  /** Liczba kolejnych tur kryzysu Relacji do wojny z progu (hamulec N). */
  hamulecN: number;
}

interface MatrixRowLite {
  typCywilizacji: string;
  Cywilizacja: string;
  ikonaId: string;
  params: Record<string, number>;
}

const MATRIX_ROWS = (matrixRaw as unknown as { cywilizacje: MatrixRowLite[] }).cywilizacje;

function findMatrixRow(civKey: string): MatrixRowLite | undefined {
  const key = civKey.toLowerCase();
  return MATRIX_ROWS.find(c =>
    c.typCywilizacji.toLowerCase() === key
    || c.ikonaId.toLowerCase() === key
    || c.Cywilizacja.toLowerCase() === key,
  );
}

export function clampNum(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Profil wojny i pokoju cywilizacji. Brak wiersza macierzy (gracz, miasto-państwo, nieznany typ)
 * → wartości bazowe z parametrów (bazaBrakDanych), zgodnie z dispatchem R6.
 */
export function resolveWarPeaceProfile(civKey?: string | null, params: WarPeaceParams = WAR_PEACE_PARAMS): WarPeaceProfile {
  const row = civKey ? findMatrixRow(civKey) : undefined;
  if (!row) {
    return {
      civKey: civKey ?? null,
      hasData: false,
      agresywnosc: 5,
      ekspansywnosc: 3,
      sklonnoscPodboju: 2,
      tolerancjaRyzyka: 5,
      progWojnyMacierz: 5,
      profilObronny: false,
      progWojnyRelacji: params.progWojnyRelacji.bazaBrakDanych,
      progPokojSlabosc: params.progPokojSlabosc.bazaBrakDanych,
      progKrytyczny: params.progKrytyczny.bazaBrakDanych,
      progZdrowia: params.progZdrowia.bazaBrakDanych,
      minTurWojny: params.minTurWojny.bazaBrakDanych,
      zmeczenieT: params.zmeczenie.bazaTurBrakDanych,
      hamulecN: clampNum(Math.round(params.hamulecRelacji.bazaN - params.hamulecRelacji.wagaProgWojny * 5), params.hamulecRelacji.minN, params.hamulecRelacji.maxN),
    };
  }
  const p = row.params;
  const dipProg = p['dip_prog_wojny'] ?? 5;
  const agr = p['ai_agresywnosc'] ?? 5;
  const eks = p['ai_ekspansywnosc'] ?? 3;
  const pod = p['ai_sklonnosc_podboju'] ?? 2;
  const risk = p['ai_tolerancja_ryzyka'] ?? 5;
  const obronny = (p['ai_profil_obronna'] ?? 0) === 1;

  const W = params.progWojnyRelacji;
  const progWojnyRelacji = clampNum(
    W.baza + W.wagaProgWojny * dipProg + W.wagaEkspansja * (eks - W.ekspansjaSrodek) + W.wagaPodboj * (pod - W.podbojSrodek),
    W.min,
    W.max,
  );

  const S = params.progPokojSlabosc;
  const progPokojSlabosc = clampNum(
    S.baza - S.wagaAgresja * (agr - S.agresjaSrodek) + (obronny ? S.premiaProfilObronny : 0),
    S.min,
    S.max,
  );

  const K = params.progKrytyczny;
  const progKrytyczny = clampNum(K.baza - K.wagaAgresja * (agr - K.agresjaSrodek), K.min, K.max);

  const Z = params.progZdrowia;
  const progZdrowia = clampNum(Z.baza - Z.wagaTolerancja * (risk - Z.tolerancjaSrodek), Z.min, Z.max);

  const M = params.minTurWojny;
  const minTurWojny = Math.round(clampNum(
    M.baza
      + (agr >= M.agresjaWysoka ? M.premiaAgresjaWysoka : 0)
      + (agr <= M.agresjaNiska ? M.karaAgresjaNiska : 0)
      + (obronny ? M.karaProfilObronny : 0),
    M.min,
    M.max,
  ));

  const T = params.zmeczenie;
  const zmeczenieT = Math.min(T.maksTur, T.bazaTur + T.wagaAgresja * agr);

  const H = params.hamulecRelacji;
  const hamulecN = clampNum(Math.round(H.bazaN - H.wagaProgWojny * dipProg), H.minN, H.maxN);

  return {
    civKey: civKey ?? null,
    hasData: true,
    agresywnosc: agr,
    ekspansywnosc: eks,
    sklonnoscPodboju: pod,
    tolerancjaRyzyka: risk,
    progWojnyMacierz: dipProg,
    profilObronny: obronny,
    progWojnyRelacji,
    progPokojSlabosc,
    progKrytyczny,
    progZdrowia,
    minTurWojny,
    zmeczenieT,
    hamulecN,
  };
}

/**
 * Udział zmęczenia wojną: min(maksUdzial, turyWojny / T). Zero poza wojną (turyWojny <= 0).
 * R4 (D4): T ≤ 20, więc każda cywilizacja osiąga pełne zmęczenie najpóźniej po 20 turach.
 */
export function warWearinessShare(turnsAtWar: number, zmeczenieT: number): number {
  const turns = Number.isFinite(turnsAtWar) ? Math.max(0, turnsAtWar) : 0;
  if (!(zmeczenieT > 0) || turns <= 0) return 0;
  return Math.min(WAR_WEARINESS_MAX_SHARE, turns / zmeczenieT);
}

/** Próg kryzysu Relacji dla pary: progWojnyRelacji wyższej strony − 15 (R7). */
export function brakeRelationThreshold(progWojnyRelacjiWyzszej: number, params: WarPeaceParams = WAR_PEACE_PARAMS): number {
  return progWojnyRelacjiWyzszej - params.hamulecRelacji.progKryzysuMinusPunkty;
}

export interface PeaceSignalInput {
  /** Udział siły AI (0..1) względem partnera. */
  rw: number;
  turnsAtWar: number;
  /** Miasta utracone przez AI w TEJ wojnie. */
  lostCitiesInWar: number;
  /** Tury od ostatniej zmiany posiadania miast w tej wojnie (undefined = od początku wojny). */
  turnsSinceCityChange?: number;
}

export interface PeaceSignalResult {
  wantsPeace: boolean;
  reasons: string[];
}

/**
 * Sygnały „AI chce pokoju" (R3, bez (c) — brak źródła HP armii). Wystarczy jeden.
 * Propozycja co AI_REJECTED_OFFER_COOLDOWN_TURNS tur — cooldown istniejący w silniku.
 */
export function aiPeaceSignals(input: PeaceSignalInput, profile: WarPeaceProfile, params: WarPeaceParams = WAR_PEACE_PARAMS): PeaceSignalResult {
  const reasons: string[] = [];
  const S = params.sygnalyPokoju;
  if (input.rw <= profile.progPokojSlabosc) {
    reasons.push('a');
  }
  if (input.lostCitiesInWar >= 1 && input.rw <= S.progRwMiasta) {
    reasons.push('b');
  }
  const sinceChange = input.turnsSinceCityChange ?? input.turnsAtWar;
  if (input.turnsAtWar >= S.patTurWojny && sinceChange >= S.patBrakZmianyTur) {
    reasons.push('d');
  }
  if (warWearinessShare(input.turnsAtWar, profile.zmeczenieT) >= params.zmeczenie.progSygnaluPokoju) {
    reasons.push('e');
  }
  return { wantsPeace: reasons.length > 0, reasons };
}

/** Mnożnik ceny pokoju za siłę AI (R5c). rw ≥ progSilyWysoki → 1 + wagaSily·(rw−0.5), max; rw ≤ progSilyNiski → 0.5; inaczej 1. */
export function peaceStrengthPriceMultiplier(rw: number, params: WarPeaceParams = WAR_PEACE_PARAMS): number {
  const C = params.cenaPokoju;
  if (rw >= C.progSilyWysoki) {
    return Math.min(C.maxMnoznikSily, 1 + C.wagaSily * (rw - 0.5));
  }
  if (rw <= C.progSilyNiski) return C.mnoznikSilyNiski;
  return 1;
}

/** Mnożnik ceny pokoju za cywilizację (R5d): 1 + 0.05·(agresja−5) + 0.04·(podbój−2), clamp 0.7–1.5. */
export function peaceCivPriceMultiplier(profile: WarPeaceProfile, params: WarPeaceParams = WAR_PEACE_PARAMS): number {
  const C = params.cenaPokoju;
  const raw = 1
    + C.wagaAgresja * (profile.agresywnosc - C.agresjaSrodek)
    + C.wagaPodboj * (profile.sklonnoscPodboju - C.podbojSrodek);
  return clampNum(raw, C.mnoznikCywMin, C.mnoznikCywMax);
}

export interface PeaceAiGateInput {
  /** Udział siły AI (0..1). */
  rw: number;
  turnsAtWar: number;
  lostCitiesInWar: number;
}

export interface PeaceAiGateResult {
  /** 'ok' = pokój rozpatrywany dalej z mnożnikiem ceny; 'too_early' / 'stronger' = odrzucenie. */
  verdict: 'ok' | 'too_early' | 'stronger';
  /** Mnożnik bazowej ceny pokoju (R5c·R5d; po turyBezOgraniczenAi: ≤ 1 z mnożnika cywilizacji, siła = 1). */
  priceMultiplier: number;
  reason?: string;
}

/**
 * Bramka AI dla pokoju proponowanego przez gracza (R5 a/b/c/d/e).
 *  (a) minimalny czas wojny: turnsAtWar < minTurWojny → odrzucenie (zawsze, także po 20 turach — min ≤ 8).
 *  (b) „czuje się silniejsze": rw ≥ 0.55 ∧ brak utraconego miasta ∧ turnsAtWar < 10 → odrzucenie.
 *  (c) mnożnik siły; (d) mnożnik cywilizacji; (e) po 20 turach wojny (b) i (c) nie obowiązują,
 *      mnożnik cywilizacji ograniczony do ≤ 1.0 (ZAŁOŻENIE: „≤ 1.0 efektywnie").
 */
export function evaluatePeaceAiGate(
  input: PeaceAiGateInput,
  profile: WarPeaceProfile,
  params: WarPeaceParams = WAR_PEACE_PARAMS,
): PeaceAiGateResult {
  const C = params.cenaPokoju;
  const turns = Math.max(0, input.turnsAtWar);
  const minTur = profile.minTurWojny;
  if (turns < minTur) {
    return {
      verdict: 'too_early',
      priceMultiplier: 1,
      reason: `za wcześnie na pokój — AI wymaga co najmniej ${minTur} tur wojny (obecnie ${turns})`,
    };
  }
  if (turns >= C.turyBezOgraniczenAi) {
    return { verdict: 'ok', priceMultiplier: Math.min(1, peaceCivPriceMultiplier(profile, params)) };
  }
  if (input.rw >= C.odrzucenieRwProg && input.lostCitiesInWar === 0 && turns < C.odrzucenieMaxTurWojny) {
    return {
      verdict: 'stronger',
      priceMultiplier: 1,
      reason: 'AI czuje się silniejsze — odrzuca pokój, dopóki nie straci miasta lub nie minie więcej tur wojny',
    };
  }
  return {
    verdict: 'ok',
    priceMultiplier: peaceStrengthPriceMultiplier(input.rw, params) * peaceCivPriceMultiplier(profile, params),
  };
}
