/**
 * loss-counters.ts — liczniki strat gracza (miasta i jednostki wojskowe utracone w całej grze).
 *
 * Czysty moduł (bez DOM, bez stanu globalnego): main.ts trzyma `LossCounters` i wywołuje
 * `recordCityLoss` przy każdej zmianie właściciela miasta gracza oraz dodaje wynik
 * `applyPostBattleMap` (`playerUnitsLost`) przy stratach jednostek w bitwie.
 *
 * Definicje (dokładnie):
 *  - Utracone miasto: miasto, którego właścicielem był gracz (owner 0) i które po zdarzeniu ma
 *    innego właściciela: zdobycie w bitwie (także przez barbarzyńców), poddanie głodowe,
 *    przejęcie przy zajęciu miasta-państwa (anektowanie), bunt (frakcja rebeliantów), cesja
 *    traktatowa. Zmiana właściciela z innego na gracza NIE liczy się jako strata.
 *  - Utracona jednostka wojskowa: jednostka gracza (owner 0), która brała udział w bitwie
 *    i po jej rozstrzygnięciu nie istnieje (polegli, także unicestwienie armii po wyczerpaniu
 *    limitu odwrotów). Rozwiązanie jednostki (disband) NIE liczy się — nie przechodzi przez
 *    bitwę. Straty AI nie są liczone.
 *
 * Pola w zapisie są OPCJONALNE: stary zapis bez licznika wczytuje się jako 0/0
 * (patrz `normalizeLossCounters`).
 */

import { checkDefeat } from './victory';

/** Właściciel gracza w silniku (ta sama konwencja co `gracz: 0` w checkDefeat). */
export const PLAYER_LOSS_OWNER_ID = 0;

export interface LossCounters {
  /** Miasta utracone przez gracza w całej grze. */
  lostCities: number;
  /** Jednostki wojskowe gracza, które poległy w bitwach w całej grze. */
  lostUnits: number;
}

export function emptyLossCounters(): LossCounters {
  return { lostCities: 0, lostUnits: 0 };
}

/** Czy zmiana właściciela miasta z `oldOwner` na `newOwner` jest utratą miasta gracza. */
export function isPlayerCityLoss(oldOwner: number, newOwner: number): boolean {
  return oldOwner === PLAYER_LOSS_OWNER_ID && newOwner !== oldOwner;
}

/** Zwraca NOWY licznik po utracie miasta (bez mutacji wejścia). */
export function recordCityLoss(counters: LossCounters, oldOwner: number, newOwner: number): LossCounters {
  if (!isPlayerCityLoss(oldOwner, newOwner)) return counters;
  return { ...counters, lostCities: counters.lostCities + 1 };
}

/** Zwraca NOWY licznik po poległych jednostkach gracza (ujemne/niecałkowite wartości -> 0). */
export function recordUnitLosses(counters: LossCounters, count: number): LossCounters {
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  if (n === 0) return counters;
  return { ...counters, lostUnits: counters.lostUnits + n };
}

/**
 * Odczyt z zapisu (surowy JSON, niezaufany). Brak pola / zła wartość -> 0.
 * Stary zapis (bez `meta.lossCounters`) daje {0,0}, co nie zmienia zachowania gry.
 */
export function normalizeLossCounters(raw: unknown): LossCounters {
  if (!raw || typeof raw !== 'object') return emptyLossCounters();
  const r = raw as Record<string, unknown>;
  const pick = (v: unknown): number =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
  return { lostCities: pick(r.lostCities), lostUnits: pick(r.lostUnits) };
}

/**
 * Czy stan gry jest już porażką gracza (brak miast przy wcześniejszym posiadaniu miasta).
 * Używane przez autozapis: zapis wykonany w takim stanie nie jest oferowany na liście
 * „Wczytaj grę” (wczytanie od razu dawałoby porażkę). Reguła = checkDefeat z victory.ts.
 */
export function isDefeatedState(input: {
  cities: ReadonlyArray<{ ownerId: number }>;
  graczKiedysMialMiasto: boolean;
}): boolean {
  const res = checkDefeat({
    cities: input.cities as Parameters<typeof checkDefeat>[0]['cities'],
    gracz: PLAYER_LOSS_OWNER_ID,
    graczKiedysMialMiasto: input.graczKiedysMialMiasto,
  });
  return res !== null;
}
