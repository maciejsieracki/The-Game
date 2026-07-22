/**
 * victory.ts
 * Victory / defeat condition checks (warunki zwyciestwa).
 *
 * Decyzja Macieja 10=A* (2026-06-27):
 *
 *   1. 'dominacja' — Power gracza > 50% sumy Power wszystkich cywilizacji,
 *      tylko w ostatniej epoce gry (v0.1: Żelazo = era 3).
 *      BEZ wymogu eliminacji wszystkich nacji.
 *
 *   2. 'nauka' — wszystkie technologie w zakresie gry zbadane ORAZ
 *      rakieta z robotami wystrzelona (flaga od SILNIK).
 *
 *   3. 'przegrana' — brak miast i osadników (jak wcześniej).
 *
 * Pure logic — no DOM, no THREE, no side effects.
 */

import type { City } from './cities';
import {
  eStartDominacjaWymagaOstatniejEpoki,
  eStartNaukaWymagaRakiety,
  eStartOstatniaEpokaV1,
  eStartProgDominacjiPower,
} from '../data/e-start-params-loader';

// ---------------------------------------------------------------------------
// Constants (Panel-E JSON + fallback)
// ---------------------------------------------------------------------------

/** Ostatnia epoka dostępna w menu v0.1 (Żelazo). */
export const OSTATNIA_EPOKA_GRY_V1 = eStartOstatniaEpokaV1();

/** Próg dominacji Power (decyzja 10=A*). */
export const PROG_DOMINACJI_POWER = eStartProgDominacjiPower();

/** Flagi zwycięstwa z Panel-E (dla testów / przyszłego UI). */
export const DOMINACJA_WYMAGA_OSTATNIEJ_EPOKI = eStartDominacjaWymagaOstatniejEpoki();
export const NAUKA_WYMAGA_RAKIETY = eStartNaukaWymagaRakiety();

// ---------------------------------------------------------------------------
// Input / output shapes
// ---------------------------------------------------------------------------

export interface VictoryPlayer {
  id: number;
  typCywilizacji: string;
  ai: boolean;
}

/** Warunki zwycięstwa z kreatora (Maciej 2026-07-04). */
export type VictoryMode =
  | 'moc'
  | 'dominacja'
  | 'moc_i_dominacja';

export function victoryModeAllowsDominacja(mode: VictoryMode | undefined): boolean {
  return mode === undefined
    || mode === 'dominacja'
    || mode === 'moc_i_dominacja';
}

export function victoryModeAllowsMoc(mode: VictoryMode | undefined): boolean {
  return mode === undefined
    || mode === 'moc'
    || mode === 'moc_i_dominacja';
}

export interface VictoryInput {
  players: VictoryPlayer[];
  cities: City[];
  gracz: number;
  /** Z kreatora — które ścieżki zwycięstwa są aktywne. */
  victoryMode?: VictoryMode;
  /** Moc (objective Power) ocenianego gracza — wartość absolutna P-A. */
  potegaGracza?: number;
  /** Moc każdej cywilizacji (human + AI) — do udziału dominacji. */
  potegiWszystkich?: number[];
  /** Epoka ocenianego gracza (1 = Kamień …). */
  graczEra?: number;
  /** Ostatnia epoka w tej wersji gry (domyślnie OSTATNIA_EPOKA_GRY_V1). */
  ostatniaEpoka?: number;
  /** Wszystkie tech w zakresie gry zbadane. */
  wszystkieTechZbadane?: boolean;
  /** Projekt rakietowy ukończony / wystrzelony. */
  rakietaWystrzelona?: boolean;
  /** @deprecated użyj wszystkieTechZbadane + rakietaWystrzelona */
  epokaKoncowa?: boolean;
  /** @deprecated użyj wszystkieTechZbadane + rakietaWystrzelona */
  naukaUkonczona?: boolean;
  liczbaOsadnikow?: number;
  graczKiedysMialMiasto?: boolean;
}

export interface VictoryResult {
  winner: number;
  rodzaj: 'dominacja' | 'nauka' | 'przegrana';
}

// ---------------------------------------------------------------------------
// Helpers (exported for tests + SILNIK)
// ---------------------------------------------------------------------------

export function playersOfType(
  players: VictoryPlayer[],
  typ: string,
  exceptId?: number,
): VictoryPlayer[] {
  const out: VictoryPlayer[] = [];
  for (const p of players) {
    if (p.typCywilizacji !== typ) continue;
    if (exceptId !== undefined && p.id === exceptId) continue;
    out.push(p);
  }
  return out;
}

export function citiesOf(playerId: number, cities: City[]): City[] {
  const out: City[] = [];
  for (const c of cities) {
    if (c.ownerId === playerId) out.push(c);
  }
  return out;
}

export function isEliminated(playerId: number, cities: City[]): boolean {
  return citiesOf(playerId, cities).length === 0;
}

/** Udział Power gracza w sumie (0..1). */
export function powerShare(potegaGracza: number, potegi: readonly number[]): number {
  let sum = 0;
  for (const p of potegi) sum += Math.max(0, p);
  if (sum <= 0) return 0;
  return Math.max(0, potegaGracza) / sum;
}

/** Dominacja 10=A*: >50% Power w ostatniej epoce. */
export function isDominacjaVictory(
  potegaGracza: number,
  potegi: readonly number[],
  graczEra: number,
  ostatniaEpoka: number = OSTATNIA_EPOKA_GRY_V1,
): boolean {
  if (graczEra < ostatniaEpoka) return false;
  return powerShare(potegaGracza, potegi) > PROG_DOMINACJI_POWER;
}

/** Nauka 10=A*: wszystkie tech w scope + rakieta. */
export function isNaukaVictory(
  wszystkieTechZbadane: boolean,
  rakietaWystrzelona: boolean,
): boolean {
  if (!wszystkieTechZbadane) return false;
  if (!NAUKA_WYMAGA_RAKIETY) return true;
  return rakietaWystrzelona;
}

/** Czy zestaw zbadanych tech pokrywa listę id w scope gry. */
export function allTechInScopeResearched(
  researched: ReadonlySet<string>,
  techIdsInScope: readonly string[],
): boolean {
  if (techIdsInScope.length === 0) return false;
  for (const id of techIdsInScope) {
    if (!researched.has(id)) return false;
  }
  return true;
}

/** Epoki w scope v0.1 menu (era gracza → etykiety Epoka z tech.json). */
const EPOKI_W_SCOPE: Record<number, readonly string[]> = {
  1: ['Kamień'],
  2: ['Kamień', 'Brąz'],
  3: ['Kamień', 'Brąz', 'Żelazo'],
};

/** Id tech w scope gry dla ostatniej epoki v0.1 (SILNIK + loader TechDef). */
export function techIdsInGameScope(
  techs: ReadonlyArray<{ Technologia?: string | null; Epoka?: string | null }>,
  ostatniaEpoka: number = OSTATNIA_EPOKA_GRY_V1,
): string[] {
  const allowed = new Set(EPOKI_W_SCOPE[ostatniaEpoka] ?? EPOKI_W_SCOPE[3]!);
  const out: string[] = [];
  for (const t of techs) {
    const ep = (t.Epoka ?? '').trim();
    const id = (t.Technologia ?? '').trim();
    if (!id || !allowed.has(ep)) continue;
    out.push(id);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main check
// ---------------------------------------------------------------------------

/**
 * Resolution order (10=A*):
 *   1. Dominacja Power > 50% (ostatnia epoka)
 *   2. Przegrana (brak miast + brak osadników)
 *   3. Nauka (wszystkie tech + rakieta)
 */
export function checkVictory(input: VictoryInput): VictoryResult | null {
  const { cities, gracz } = input;
  const ostatniaEpoka = input.ostatniaEpoka ?? OSTATNIA_EPOKA_GRY_V1;
  const graczEra = input.graczEra ?? 1;
  const potegaGracza = input.potegaGracza ?? 0;
  const potegi = input.potegiWszystkich ?? [];

  const mode = input.victoryMode;

  // --- 1. Dominacja Power (10=A*) -------------------------------------------
  if (
    victoryModeAllowsDominacja(mode)
    && potegi.length > 0
    && isDominacjaVictory(potegaGracza, potegi, graczEra, ostatniaEpoka)
  ) {
    return { winner: gracz, rodzaj: 'dominacja' };
  }

  // --- 2. Defeat ------------------------------------------------------------
  const osadnicy = input.liczbaOsadnikow ?? 0;
  const kiedysMial = input.graczKiedysMialMiasto ?? true;
  if (isEliminated(gracz, cities) && osadnicy === 0 && kiedysMial) {
    return { winner: gracz, rodzaj: 'przegrana' };
  }

  // --- 3. Moc / nauka (10=A* — tech + rakieta) ------------------------------
  const wszystkieTech = input.wszystkieTechZbadane
    ?? (input.epokaKoncowa === true && input.naukaUkonczona === true);
  const rakieta = input.rakietaWystrzelona
    ?? (input.naukaUkonczona === true);
  if (victoryModeAllowsMoc(mode) && isNaukaVictory(!!wszystkieTech, !!rakieta)) {
    return { winner: gracz, rodzaj: 'nauka' };
  }

  return null;
}
