/**
 * R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1 (ABC właściciela 2026-11-18 + decyzje wiążące z dispatchu): nośnik dopłaty D
 * (parytet siły, FALA 826) w traktatach — sojusz obronny, sojusz pełny, NAP, przemarsz, wasal.
 *
 * Kolejność płatności D (strona słabsza):
 *   1. TECHNOLOGIE — tylko te, których druga strona NIE posiada; od najdroższej; technologia nie przekracza
 *      pozostałej kwoty (bez nadpłaty);
 *   2. złoto (Skarbiec) → brąz → żelazo → rudy (miedzi, cyny, żelaza) — ogon z `peace-tail-payment.ts`
 *      (kolejność z danych PEACE_TAIL_ORDER, ta sama wycena i zaokrąglanie do bloku co ogon pokoju);
 *   3. praca (Praca) → pieniądze (¤) — stopnie opcjonalne, podawane przez wywołującego (domyślnie brak zapasów).
 *
 * Brak surowca / złota / techu = stopień pominięty, idziemy dalej. Zapasy nigdy poniżej zera. Suma zapasów < D →
 * `shortfallPn` > 0 (propozycja niedostępna z powodem „brakuje X PN"). Funkcja czysta: nie czyta stanu gry.
 *
 * Pokój NIE korzysta z tej funkcji (ogon pokoju = peace-tail-payment.ts, FALA 830, bez zmian). Rozejm — bez zmian.
 */
import { composePeaceTail, PEACE_TAIL_ORDER, type PeaceTailItem, type PeaceTailPricing } from './peace-tail-payment';

/** Stopień dodatkowy po ogonie (praca, pieniądze ¤): zapas w sztukach + wycena PN za sztukę. */
export interface TreatyExtraStage {
  /** Klucz stopnia; kolejność wyniku = kolejność tablicy wejściowej. */
  key: string;
  /** Zapas płatnika w sztukach. */
  have: number;
  /** PN za 1 sztukę; null/0 = stopień pominięty. */
  pnPerUnit: number | null | undefined;
}

export interface TreatyTechPick {
  name: string;
  pn: number;
}

export interface TreatyPaymentInput {
  /** Dopłata D w PN (strona słabsza). Zero → pusta płatność (np. r = 1 ⇒ D = 0). */
  duePn: number;
  /** Technologie płatnika (nazwy jak w tech.json). */
  payerTechs: readonly string[];
  /** Technologie drugiej strony — te NIE wchodzą do płatności. */
  otherTechs: readonly string[];
  /** Wycena technologii w PN; null/0/NaN = technologia pominięta. */
  techPn: (name: string) => number | null | undefined;
  /** Zapasy złota/metali/rud płatnika + wycena + krok bloku (ta sama wycena co ogon pokoju). */
  pricing: PeaceTailPricing;
  /** Stopnie po ogonie (praca → pieniądze); domyślnie brak. */
  extraStages?: readonly TreatyExtraStage[];
}

export interface TreatyPaymentResult {
  /** Technologie przekazywane drugiej stronie (odkrycie dla odbiorcy), w kolejności wyboru (najdroższe pierwsze). */
  techs: TreatyTechPick[];
  /** Złoto → brąz → żelazo → rudy. */
  tail: PeaceTailItem[];
  /** Praca / pieniądze (kolejność wejścia). */
  extra: Array<{ key: string; qty: number; pn: number }>;
  coveredByTechPn: number;
  coveredByTailPn: number;
  coveredByExtraPn: number;
  /** Suma pokrytych PN. */
  coveredPn: number;
  /** Niedobór (>= 0). */
  shortfallPn: number;
  /** Cała dopłata pokryta. */
  full: boolean;
}

/** Kolejność stopni płatności traktatu (dokumentacyjnie; wykonanie w composeTreatyPayment). */
export const TREATY_PAYMENT_STAGES: readonly string[] = Object.freeze(['tech', 'ogon', 'praca', 'pieniadze']);

/** Polskie etykiety stopni (tooltip / okno propozycji — bez surowych ID). */
export const TREATY_STAGE_LABEL: Readonly<Record<string, string>> = Object.freeze({
  tech: 'technologia', zloto: 'złoto', braz: 'brąz', zelazo: 'żelazo', ruda: 'ruda miedzi',
  ruda_cyny: 'ruda cyny', ruda_zelaza: 'ruda żelaza', praca: 'praca', pieniadze: 'pieniądze',
});

/**
 * Technologie kandydujące do płatności: posiadane przez płatnika, NIEposiadane przez drugą stronę,
 * z wyceną > 0, bez duplikatów; sortowane od najdroższej (przy równej cenie — po nazwie).
 */
export function treatyTechCandidates(
  payerTechs: readonly string[],
  otherTechs: readonly string[],
  techPn: (name: string) => number | null | undefined,
): TreatyTechPick[] {
  const other = new Set(otherTechs);
  const seen = new Set<string>();
  const out: TreatyTechPick[] = [];
  for (const name of payerTechs) {
    if (seen.has(name) || other.has(name)) continue;
    seen.add(name);
    const pn = techPn(name);
    if (pn == null || !Number.isFinite(pn) || !(pn > 0)) continue;
    out.push({ name, pn: Math.round(pn) });
  }
  out.sort((a, b) => (b.pn - a.pn) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return out;
}

/**
 * Składa nośnik dopłaty D: technologie (najdroższe, bez nadpłaty) → ogon (złoto/metale/rudy) → praca → pieniądze.
 * Zapasy nigdy poniżej zera; niedobór w `shortfallPn`. Czysta.
 */
export function composeTreatyPayment(input: TreatyPaymentInput): TreatyPaymentResult {
  let rem = Math.max(0, Math.ceil(Number.isFinite(input.duePn) ? input.duePn : 0));
  const dueTotal = rem;

  // 1. Technologie — greedy od najdroższej; tech nie przekracza reszty (brak nadpłaty).
  const techs: TreatyTechPick[] = [];
  let coveredByTechPn = 0;
  for (const cand of treatyTechCandidates(input.payerTechs, input.otherTechs, input.techPn)) {
    if (rem <= 0) break;
    if (cand.pn > rem) continue;
    techs.push(cand);
    coveredByTechPn += cand.pn;
    rem -= cand.pn;
  }

  // 2. Ogon: złoto → brąz → żelazo → rudy (kolejność z danych). composePeaceTail sam pomija puste stopnie.
  const order = input.pricing.order ?? PEACE_TAIL_ORDER;
  const tailRes = composePeaceTail(rem, { ...input.pricing, order });
  rem = tailRes.shortfallPn;
  const coveredByTailPn = tailRes.coveredPn;

  // 3. Praca → pieniądze (stopnie dodatkowe, kolejność wejścia).
  const extra: Array<{ key: string; qty: number; pn: number }> = [];
  let coveredByExtraPn = 0;
  for (const st of input.extraStages ?? []) {
    if (rem <= 0) break;
    const price = st.pnPerUnit;
    if (price == null || !Number.isFinite(price) || !(price > 0)) continue;
    const have = Math.max(0, Math.floor(Number.isFinite(st.have) ? st.have : 0));
    if (have <= 0) continue;
    const qty = Math.min(have, Math.ceil(rem / price));
    if (qty <= 0) continue;
    const pn = Math.round(qty * price);
    extra.push({ key: st.key, qty, pn });
    const paid = Math.min(pn, rem);
    coveredByExtraPn += paid;
    rem -= paid;
  }

  const coveredPn = coveredByTechPn + coveredByTailPn + coveredByExtraPn;
  const shortfallPn = Math.max(0, dueTotal - coveredPn);
  return {
    techs,
    tail: tailRes.tail,
    extra,
    coveredByTechPn,
    coveredByTailPn,
    coveredByExtraPn,
    coveredPn,
    shortfallPn,
    full: shortfallPn <= 0,
  };
}

/** Tekst „Dopłata: Technologia X, 3 złota, ..." (polskie nazwy). Pusty ciąg, gdy nic nie płacone. */
export function treatyPaymentLabel(res: TreatyPaymentResult): string {
  const parts: string[] = [];
  for (const t of res.techs) parts.push(`technologia ${t.name}`);
  for (const t of res.tail) parts.push(`${t.qty} ${TREATY_STAGE_LABEL[t.key] ?? t.key}`);
  for (const t of res.extra) parts.push(`${t.qty} ${TREATY_STAGE_LABEL[t.key] ?? t.key}`);
  return parts.length ? 'Dopłata: ' + parts.join(', ') : '';
}
