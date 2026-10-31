// R-WEB-WAR-AGGRESSOR-FLAG-Q1 — flaga agresora i casus belli (czyste funkcje, bez stanu gry).
// Parametry: gra/data/diplomacy-aggressor-params.json. Silnik (main.ts) podaje przyczynę
// wypowiedzenia i turę, dostaje nowy stan. Funkcje zwracają nowe obiekty (bez mutacji).

import aggressorParamsJson from '../../data/diplomacy-aggressor-params.json';

export interface AggressorParams {
  flagaAgresora: { trwaTur: number };
  wplywNaAI: { relacjaDeltaSojusz: number; willingnessAllyMnoznik: number };
  casusBelli: { trwaTur: number };
}

export const AGGRESSOR_PARAMS: AggressorParams = aggressorParamsJson as unknown as AggressorParams;

/** Przyczyna wypowiedzenia wojny. Tylko 'bez_powodu' nadaje flagę agresora. */
export type WarCause = 'bez_powodu' | 'casus_belli' | 'wymuszona_epoka' | 'hamulec';

/** Czy wypowiedzenie wojny tej przyczyny nadaje flagę agresora (GOAL 1 i 3). */
export function czyDajeFlageAgresora(cause: WarCause): boolean {
  return cause === 'bez_powodu';
}

/** Mapa ownerId -> tura, do której (wyłącznie) trwa flaga agresora. */
export type AggressorState = Record<string, number>;

/** Nadaje flagę agresora od `turn` (jeśli przyczyna na to pozwala). Zwraca nowy stan. */
export function ustawFlageAgresora(
  state: AggressorState,
  ownerId: number,
  turn: number,
  cause: WarCause,
  params: AggressorParams = AGGRESSOR_PARAMS,
): AggressorState {
  if (!czyDajeFlageAgresora(cause)) return state;
  if (!Number.isFinite(turn) || !Number.isFinite(ownerId)) return state;
  const doTury = turn + params.flagaAgresora.trwaTur;
  const prev = state[String(ownerId)];
  if (prev !== undefined && prev >= doTury) return state;
  return { ...state, [String(ownerId)]: doTury };
}

/** Czy `ownerId` jest agresorem w turze `turn` (aktywna dla turn < doTury). */
export function czyAgresor(state: AggressorState, ownerId: number, turn: number): boolean {
  const doTury = state[String(ownerId)];
  if (doTury === undefined || !Number.isFinite(doTury) || !Number.isFinite(turn)) return false;
  return turn < doTury;
}

/** Mnożnik willingnessAlly wobec agresora u INNEGO AI (1 = bez zmian). */
export function mnoznikWillingnessAlly(aktywnaFlaga: boolean, params: AggressorParams = AGGRESSOR_PARAMS): number {
  return aktywnaFlaga ? params.wplywNaAI.willingnessAllyMnoznik : 1;
}

/** Delta progu Relacji dla sojuszu/paktu wobec agresora (0 gdy brak flagi). */
export function deltaRelacjiSojusz(aktywnaFlaga: boolean, params: AggressorParams = AGGRESSOR_PARAMS): number {
  return aktywnaFlaga ? params.wplywNaAI.relacjaDeltaSojusz : 0;
}

/** Casus belli: klucz `requester>target` -> tura końca (wyłącznie). */
export type CasusBelliState = Record<string, number>;

export function ustawCasusBelli(
  state: CasusBelliState,
  requester: number,
  target: number,
  turn: number,
  params: AggressorParams = AGGRESSOR_PARAMS,
): CasusBelliState {
  if (!Number.isFinite(requester) || !Number.isFinite(target) || !Number.isFinite(turn)) return state;
  if (requester === target) return state;
  const key = `${requester}>${target}`;
  const doTury = turn + params.casusBelli.trwaTur;
  const prev = state[key];
  if (prev !== undefined && prev >= doTury) return state;
  return { ...state, [key]: doTury };
}

export function maCasusBelli(state: CasusBelliState, requester: number, target: number, turn: number): boolean {
  const doTury = state[`${requester}>${target}`];
  if (doTury === undefined || !Number.isFinite(doTury) || !Number.isFinite(turn)) return false;
  return turn < doTury;
}

/** Serializacja do zapisu: tylko wpisy z poprawną liczbą. */
export function serializujMape(state: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of Object.keys(state)) {
    const v = state[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/** Wczytanie z zapisu; brak lub uszkodzone dane = pusty stan (stary zapis bez pola). */
export function wczytajMape(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return serializujMape(raw as Record<string, number>);
}
