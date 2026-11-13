/**
 * diplomacy-military-strength.ts — Siła militarna pary w wojnie (R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1).
 *
 * Miara OSOBNA od Power: nie zmienia Power, Respektu, Zaufania ani etykiet relacji.
 * Gospodarka (miasta, technologie, kultura, budynki) NIE wchodzi do siły militarnej.
 *
 * Czyste funkcje: moduł nie importuje silnika gry, tylko JSON z parametrami.
 * Parametry: data/diplomacy-military-strength-params.json (wartosc + opis po polsku).
 *
 * Wejścia armiaPkt i rekrutPkt są gotowymi punktami z Power (składniki `military: true`
 * w power-params.json: jednostka_wojskowa + rekrut_ekw_jednostki). Ta funkcja ich nie liczy.
 *
 * / EN: Military strength of a war pair, separate from Power. Pure functions; only JSON params.
 */
import militaryParamsJson from '../../data/diplomacy-military-strength-params.json';

export interface MilitaryStrengthParams {
  /** Próg przewagi w procentach: przewaga, gdy siła ≥ słabszej × (1 + próg/100). */
  progPrzewagiProc: number;
  /** Mnożnik punktów wygranych bitew z bieżącej wojny tej pary. */
  wagaBitew: number;
  /** Bonus siły dla strony pobierającej trybut, w procentach. */
  trybutBonusProc: number;
  /** Czas trwania bonusu trybutu w turach (licznik po stronie integracji). */
  trybutBonusTur: number;
}

type MilitaryParamsFile = { [K in keyof MilitaryStrengthParams]: { wartosc: number; opis: string } };

/** Wczytuje parametry z JSON (pole `wartosc` każdego parametru). */
export function loadMilitaryStrengthParams(
  raw: MilitaryParamsFile = militaryParamsJson as unknown as MilitaryParamsFile,
): MilitaryStrengthParams {
  return {
    progPrzewagiProc: raw.progPrzewagiProc.wartosc,
    wagaBitew: raw.wagaBitew.wartosc,
    trybutBonusProc: raw.trybutBonusProc.wartosc,
    trybutBonusTur: raw.trybutBonusTur.wartosc,
  };
}

export const DEFAULT_MILITARY_STRENGTH_PARAMS: MilitaryStrengthParams = loadMilitaryStrengthParams();

export interface MilitaryStrengthInput {
  /** Składnik Armia z Power (punkty, już przeliczone). */
  armiaPkt: number;
  /** Składnik Rekruci z Power (punkty, już przeliczone; pula liczona RAZ). */
  rekrutPkt: number;
  /** Punkty wygranych bitew TYLKO z bieżącej wojny tej pary. */
  punktyWygranychBitewWojna: number;
  /** Czy strona pobiera trybut (bonus czasowy). */
  trybutBonusAktywny: boolean;
}

function nonNeg(x: number): number {
  return x > 0 ? x : 0;
}

/**
 * Siła militarna jednej strony:
 * (armiaPkt + rekrutPkt + wagaBitew · punktyWygranychBitewWojna) · (trybut ? 1 + trybutBonusProc/100 : 1).
 * Wartości ujemne są traktowane jako 0.
 */
export function computeMilitaryStrength(
  input: MilitaryStrengthInput,
  params: MilitaryStrengthParams = DEFAULT_MILITARY_STRENGTH_PARAMS,
): number {
  const bazowa =
    nonNeg(input.armiaPkt) +
    nonNeg(input.rekrutPkt) +
    params.wagaBitew * nonNeg(input.punktyWygranychBitewWojna);
  const mnoznik = input.trybutBonusAktywny ? 1 + params.trybutBonusProc / 100 : 1;
  return bazowa * mnoznik;
}

/** Strona porównania: identyfikator, siła i suma armii (do rozstrzygnięcia remisu). */
export interface MilitarySide {
  id: string;
  sila: number;
  armiaPkt: number;
}

export type MilitaryAdvantage = 'A' | 'B' | 'brak';

export interface MilitaryComparison {
  /** 'A' / 'B' gdy strona przekracza próg przewagi, inaczej 'brak'. */
  przewaga: MilitaryAdvantage;
  /** siłaA / siłaB; 1 gdy obie 0; Infinity gdy tylko B = 0. */
  stosunek: number;
  /**
   * Silniejsza strona wg reguły rozstrzygania (zawsze wyznaczona, także przy 'brak'):
   * 1) większa siła; 2) przy równej sile — większa suma armii (armiaPkt);
   * 3) przy równej armii — mniejszy id (porównanie leksykograficzne). Wynik nie zależy od kolejności argumentów.
   */
  silniejszyId: string;
}

/**
 * Porównuje siły dwóch stron z progiem przewagi z parametrów (domyślnie 20%).
 * Progi liczone w całkowitych procentach: A·100 ≥ B·(100 + próg), bez zmiennoprzecinkowych progów.
 * Obie siły 0 → 'brak'.
 */
export function compareMilitaryStrength(
  silaA: MilitarySide,
  silaB: MilitarySide,
  params: MilitaryStrengthParams = DEFAULT_MILITARY_STRENGTH_PARAMS,
): MilitaryComparison {
  const sa = nonNeg(silaA.sila);
  const sb = nonNeg(silaB.sila);
  const prog = 100 + nonNeg(params.progPrzewagiProc);

  let przewaga: MilitaryAdvantage = 'brak';
  if (sa > 0 || sb > 0) {
    if (sa * 100 >= sb * prog) przewaga = 'A';
    else if (sb * 100 >= sa * prog) przewaga = 'B';
  }

  let stosunek: number;
  if (sa === 0 && sb === 0) stosunek = 1;
  else if (sb === 0) stosunek = Infinity;
  else stosunek = sa / sb;

  let silniejsza: MilitarySide;
  if (sa !== sb) silniejsza = sa > sb ? silaA : silaB;
  else if (silaA.armiaPkt !== silaB.armiaPkt) silniejsza = silaA.armiaPkt > silaB.armiaPkt ? silaA : silaB;
  else silniejsza = silaA.id <= silaB.id ? silaA : silaB;

  return { przewaga, stosunek, silniejszyId: silniejsza.id };
}

/**
 * R-WEB-DIPLO-WAR-BATTLE-COUNTER-Q1 — stan pary: punkty wygranych bitew z BIEŻĄCEJ wojny (osobno
 * dla strony o niższym i wyższym id) oraz czasowy bonus trybutu. Czysty kształt pól, bez importu
 * silnika: DiploPairMeta (diplomacy-pn-engine.ts) zawiera te pola jako OPCJONALNE.
 * Brak pola = 0 bitew / brak bonusu (stary zapis).
 *
 * / EN: Per-pair war battle points (low/high id) and time-limited tribute bonus. Pure helpers.
 */
export interface WarBattlePointsPair {
  /** Punkty strony o niższym id (a w parze a_b, a < b). */
  niski: number;
  /** Punkty strony o wyższym id. */
  wysoki: number;
}

export interface TributeBonusState {
  /** Właściciel, który pobiera trybut (dostaje bonus). */
  dla: number;
  /** Bonus aktywny, dopóki tura < doTury (wygasa w turze doTury). */
  doTury: number;
}

export interface MilitaryPairFields {
  wojnaBitwyPkt?: WarBattlePointsPair;
  trybutBonus?: TributeBonusState;
}

/**
 * Dopisuje punkty wygranej bitwy do licznika pary (zwycięzca = winnerId).
 * Zwraca nowy obiekt meta; poza wojną (inWar=false), dla zerowych/ujemnych punktów
 * albo gdy zwycięzca nie należy do pary — zwraca meta bez zmian.
 */
export function addWarBattlePoints<T extends MilitaryPairFields>(
  meta: T,
  lowId: number,
  highId: number,
  winnerId: number,
  pkt: number,
  inWar: boolean,
): T {
  if (!inWar || !(pkt > 0)) return meta;
  if (winnerId !== lowId && winnerId !== highId) return meta;
  const cur: WarBattlePointsPair = meta.wojnaBitwyPkt ?? { niski: 0, wysoki: 0 };
  const next: WarBattlePointsPair = winnerId === lowId
    ? { ...cur, niski: nonNeg(cur.niski) + pkt }
    : { ...cur, wysoki: nonNeg(cur.wysoki) + pkt };
  return { ...meta, wojnaBitwyPkt: next };
}

/** Zeruje licznik bitew (start nowej wojny / koniec wojny). */
export function resetWarBattlePoints<T extends MilitaryPairFields>(meta: T): T {
  return { ...meta, wojnaBitwyPkt: undefined };
}

/**
 * Punkty wygranych bitew strony z meta pary. Poza wojną zawsze 0 (licznik jest nieczytelny).
 * Strona spoza pary → 0.
 */
export function readWarBattlePoints(
  meta: MilitaryPairFields | undefined,
  sideId: number,
  lowId: number,
  highId: number,
  inWar: boolean,
): number {
  if (!inWar || !meta?.wojnaBitwyPkt) return 0;
  if (sideId === lowId) return nonNeg(meta.wojnaBitwyPkt.niski);
  if (sideId === highId) return nonNeg(meta.wojnaBitwyPkt.wysoki);
  return 0;
}

/** Ustawia bonus trybutu dla pobierającego: aktywny przez trybutBonusTur tur od `turn`. */
export function grantTributeBonus<T extends MilitaryPairFields>(
  meta: T,
  receiverId: number,
  turn: number,
  params: MilitaryStrengthParams = DEFAULT_MILITARY_STRENGTH_PARAMS,
): T {
  return { ...meta, trybutBonus: { dla: receiverId, doTury: turn + nonNeg(params.trybutBonusTur) } };
}

/** Czy bonus trybutu jest aktywny dla właściciela w turze T (T < doTury). */
export function isTributeBonusActive(meta: MilitaryPairFields | undefined, ownerId: number, turn: number): boolean {
  const b = meta?.trybutBonus;
  return b !== undefined && b.dla === ownerId && turn < b.doTury;
}

/**
 * R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1 (krok 3): rozstrzygnięcie hamulca zerowego Zaufania.
 * Po N turach zerowego Zaufania wypowiada wojnę strona SILNIEJSZA wg siły militarnej
 * (compareMilitaryStrength: większa siła → remis: większa armia → remis: mniejszy id).
 * Bez progu 20% — nawet przewaga o włos wystarcza. Gdy silniejsza strona jest graczem,
 * mayDeclare = false (gracz nigdy nie wypowiada wojny automatycznie, D7).
 * / EN: Zero-trust brake outcome: the stronger military side declares; the player never auto-declares.
 */
export interface MilitaryBrakeOutcome {
  declarer: string;
  victim: string;
  /** false = silniejsza strona to gracz: brak automatycznej deklaracji. */
  mayDeclare: boolean;
}

export function militaryBrakeOutcome(
  a: MilitarySide,
  b: MilitarySide,
  isPlayer: (id: string) => boolean,
  params: MilitaryStrengthParams = DEFAULT_MILITARY_STRENGTH_PARAMS,
): MilitaryBrakeOutcome {
  const declarer = compareMilitaryStrength(a, b, params).silniejszyId;
  const victim = declarer === a.id ? b.id : a.id;
  return { declarer, victim, mayDeclare: !isPlayer(declarer) };
}
