// R-WEB-DIPLO-WAR-BY-ALLIANCE-STRENGTH-Q1 (etap C, część 2) — wojna wypowiedziana SIŁĄ BLOKU sojuszniczego, za flagą.
// Flaga domyślnie ON (data/diplomacy-alliance-war-params.json, decyzja 2026-11-19); OFF = porównanie jak dotąd (ai.ts P4).
//
// Blok = strona porównania przy wypowiedzeniu wojny: suma siły militarnej właściciela i jego aktywnych sojuszników.
//   Po stronie AI: AI + sojusznicy AI, z wyłączeniem wasali, sojuszników w wojnie z tym AI oraz partnera-celu.
//   Po stronie partnera: partner + jego sojusznicy, z wyłączeniem wasali oraz samego AI.
// Dane sojuszników wypełnia main.ts (aktywne traktaty sojuszu, istniejące struktury); ten moduł nie czyta stanu gry.
// Czysta logika: bez efektów ubocznych poza hakiem testowym flagi.

import alliance from '../../data/diplomacy-alliance-war-params.json';
import { compareMilitaryStrength, DEFAULT_MILITARY_STRENGTH_PARAMS, type MilitarySide } from './diplomacy-military-strength';

export interface AllianceWarParams {
  wojnaSilaSojuszuAktywna: boolean;
}

export const ALLIANCE_WAR_PARAMS: AllianceWarParams = alliance as AllianceWarParams;

let flagOverride: boolean | null = null;

/** Tylko testy (hak civTest, NIE z UI). null = wróć do wartości z danych. */
export function setWarByAllianceStrengthForTest(value: boolean | null): void {
  flagOverride = value;
}

/** Flaga wojny siłą sojuszu. Domyślnie true (dane: wojnaSilaSojuszuAktywna); false = zachowanie dotychczasowe. */
export function isWarByAllianceStrengthEnabled(): boolean {
  if (flagOverride !== null) return flagOverride;
  return ALLIANCE_WAR_PARAMS.wojnaSilaSojuszuAktywna === true;
}

/** Sojusznik bloku z danymi do porównania siły (wypełniane w main.ts z aktywnych traktatów sojuszu). */
export interface BlokSojusznik {
  id: string;
  sila: number;
  armiaPkt: number;
  /** Sojusznik jest wasalem (traktat Wasalizacja) — nie liczy się do bloku. */
  wasal: boolean;
  /** Sojusznik jest w stanie wojny z właścicielem bloku po stronie AI — nie liczy się do bloku AI. */
  wojnaZAI: boolean;
}

/**
 * Siła bloku: siła właściciela + suma sił sojuszników kwalifikujących się do bloku.
 * Strona 'ai': pomija wasali, sojuszników w wojnie z AI, partnera-celu (wykluczone) i duplikaty.
 * Strona 'partner': pomija wasali, samo AI (wykluczone) i duplikaty; wojna z AI nie wyklucza.
 * Sojusznik bez danych siły nie wnosi nic (bezpieczny brak wkładu).
 */
export function blockStrength(
  strona: 'ai' | 'partner',
  owner: MilitarySide,
  allies: readonly BlokSojusznik[],
  wykluczone: ReadonlySet<string>,
): MilitarySide {
  let sila = Number.isFinite(owner.sila) ? owner.sila : 0;
  let armiaPkt = Number.isFinite(owner.armiaPkt) ? owner.armiaPkt : 0;
  const widziane = new Set<string>([owner.id]);
  for (const s of allies) {
    if (widziane.has(s.id) || wykluczone.has(s.id)) continue;
    if (s.wasal) continue;
    if (strona === 'ai' && s.wojnaZAI) continue;
    widziane.add(s.id);
    if (Number.isFinite(s.sila)) sila += s.sila;
    if (Number.isFinite(s.armiaPkt)) armiaPkt += s.armiaPkt;
  }
  return { id: owner.id, sila, armiaPkt };
}

/**
 * Czy strona A (blok) ma przewagę militarną nad B przy progu `progPrzewagiProc` (%). Ten sam predykat co
 * compareMilitaryStrength w ai.ts P4 (przewaga === 'A').
 */
export function blockHasAdvantage(a: MilitarySide, b: MilitarySide, progPrzewagiProc: number): boolean {
  return compareMilitaryStrength(a, b, {
    ...DEFAULT_MILITARY_STRENGTH_PARAMS,
    progPrzewagiProc,
  }).przewaga === 'A';
}
