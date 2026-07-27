/**
 * post-capture-law.ts — bonus Prawa po zdobyciu miasta (B-LAW-Q1).
 * PURE — bez DOM, bez main.ts.
 *
 * | Sytuacja                         | Prawo | Czas   |
 * |----------------------------------|-------|--------|
 * | Odbicie po buncie (rebelia)      | 100%  | 10 tur |
 * | Świeży podbój (obce miasto)      | 100%  | 5 tur  |
 */
import type { Difficulty, SocietyParamsLike } from './order';
import { loadOrderParams } from './order';
import {
  computePorPct,
  orderEffectsFromPorPct,
  porPctBand,
  POR_BAND_LABELS,
  REBEL_FACTION_OWNER_ID,
  tierFromPorPct,
  type OrderPctBreakdown,
  type SocietyLine,
} from './society-breakdown';

export const POST_CAPTURE_FRESH_TURNS = 5;
export const POST_CAPTURE_REBELLION_RECONQUEST_TURNS = 10;
export const POST_CAPTURE_LAW_PCT = 100;

export interface PostCaptureLawCity {
  postCaptureLawTurnsRemaining?: number;
  wasRebellionReconquest?: boolean;
  rebelPreviousOwnerId?: number;
  rebelState?: boolean;
  revoltGraceRemaining?: number | null;
}

/** Miasto zbuntowało się — zapamiętaj właściciela przed przejęciem przez rebeliantów. */
export function markCityRebellionStarted(city: PostCaptureLawCity & { ownerId: number }): void {
  city.rebelPreviousOwnerId = city.ownerId;
}

/** Odbicie po buncie: poprzedni właściciel to frakcja rebeliantów, a my byliśmy właścicielem sprzed buntu. */
export function isRebellionReconquest(
  prevOwner: number,
  newOwner: number,
  city: PostCaptureLawCity,
): boolean {
  return prevOwner === REBEL_FACTION_OWNER_ID && city.rebelPreviousOwnerId === newOwner;
}

/** Ustaw bonus Prawa po zmianie właściciela (wołane z applyCityCaptureAfterBattle / kapitulacji). */
export function applyPostCaptureLawOnCapture(
  city: PostCaptureLawCity,
  newOwner: number,
  prevOwner: number,
): void {
  if (prevOwner === newOwner) return;

  const reconquest = isRebellionReconquest(prevOwner, newOwner, city);
  city.postCaptureLawTurnsRemaining = reconquest
    ? POST_CAPTURE_REBELLION_RECONQUEST_TURNS
    : POST_CAPTURE_FRESH_TURNS;
  city.wasRebellionReconquest = reconquest;
  city.revoltGraceRemaining = null;
  delete city.rebelPreviousOwnerId;
}

export function isPostCaptureLawActive(city: PostCaptureLawCity): boolean {
  const n = city.postCaptureLawTurnsRemaining;
  return typeof n === 'number' && n > 0;
}

/** Koniec tury właściciela — odlicz pozostały czas bonusu. */
export function tickPostCaptureLawEndOfTurn(city: PostCaptureLawCity): void {
  const n = city.postCaptureLawTurnsRemaining;
  if (typeof n !== 'number' || n <= 0) return;
  const next = n - 1;
  if (next <= 0) {
    delete city.postCaptureLawTurnsRemaining;
    delete city.wasRebellionReconquest;
  } else {
    city.postCaptureLawTurnsRemaining = next;
  }
}

export function postCaptureLawBannerLabel(city: PostCaptureLawCity): string | null {
  const n = city.postCaptureLawTurnsRemaining;
  if (!isPostCaptureLawActive(city) || n == null) return null;
  if (city.wasRebellionReconquest) {
    return `Odbicie po buncie — Prawo 100% (${n} tur)`;
  }
  return `Po podboju — Prawo 100% (${n} tur)`;
}

/** Wymuś Prawo 100% i wyłącz ryzyko buntu na czas bonusu. */
export function applyPostCaptureLawOverride(
  ordPct: OrderPctBreakdown,
  city: PostCaptureLawCity,
  society?: SocietyParamsLike | null,
  difficulty: Difficulty = 'normal',
): OrderPctBreakdown {
  if (!isPostCaptureLawActive(city)) return ordPct;

  const params = loadOrderParams(society, difficulty);
  const prawPct = POST_CAPTURE_LAW_PCT;
  const porPct = computePorPct(ordPct.sz.szPct, prawPct, params);
  const tier = tierFromPorPct(porPct);
  const effects = orderEffectsFromPorPct(porPct, params);
  const band = porPctBand(porPct);
  const banner = postCaptureLawBannerLabel(city) ?? 'Podbój — wymuszone Prawo';

  const overrideLine: SocietyLine = {
    id: 'post_capture_law',
    label: banner,
    value: prawPct,
  };

  return {
    ...ordPct,
    prawo: {
      ...ordPct.prawo,
      lines: [overrideLine, ...ordPct.prawo.lines],
      prawPct,
      netto: prawPct,
    },
    porPct,
    tier,
    band,
    bandLabel: POR_BAND_LABELS[band],
    effects: {
      ...effects,
      revoltRisk: 0,
    },
  };
}

export function shouldSuppressRevoltDuringPostCaptureLaw(city: PostCaptureLawCity): boolean {
  return isPostCaptureLawActive(city);
}

export { REBEL_FACTION_OWNER_ID } from './society-breakdown';
