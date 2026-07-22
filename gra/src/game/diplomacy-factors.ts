/**
 * diplomacy-factors.ts — rejestr per-para czynników relacji + rozbicie
 * „za/przeciw" (Makieta DYPLOMACJA v1.1, KROK 3 pkt 6 — DYSPOZYCJA-WDROZENIE.md,
 * 2026-07-23, FAZA 1).
 *
 * Pure moduł: zero DOM/THREE/side-effects.
 *
 * Dwa źródła czynników łączone w `buildRelationBreakdown`:
 *   1) REJESTR jednorazowych zdarzeń (`DiploFactorLog`) — SILNIK dopisuje wpis
 *      {eventKey, delta, tura?} przy każdym realnym applyDiplomaticEvent /
 *      applyPnTrustToRelation (main.ts), NIGDY tu (moduł zostaje czysty —
 *      `appendDiploFactor` tylko zwraca NOWĄ tablicę).
 *   2) CIĄGŁE czynniki /turę — wyliczone przez SILNIK NA ŻYWO z aktywnych
 *      umów i stanu pary (ten sam materiał co main.ts TickCtx przy
 *      tickDiplomacy — patrz main.ts ~12700), przekazane jako `ContinuousFactorFlags`.
 *
 * SAVE: `DiploFactorLog` to czysta tablica {eventKey,delta,tura} — trywialnie
 * serializowalna (main.ts trzyma `Map<string, DiploFactorLog>`, zapisuje jako
 * `Array.from(map.entries())`, jak istniejący `diplomacyPairMeta`).
 */

export interface DiploFactorEntry {
  /** Klucz zdarzenia — nazwa z DiplomaticEvent (diplomacy.ts) lub 'dar_pn'/'handel_pn'
   *  dla realnych delt liczonych przez diplomacy-pn-engine.ts (koszyk PN). */
  eventKey: string;
  /** Rzeczywista delta Zaufania (lub Respektu — patrz `*_respekt` sufiks eventKey) zastosowana. */
  delta: number;
  /** Numer tury, w której zaszło zdarzenie (opcjonalny — stare zapisy / testy mogą go nie mieć). */
  tura?: number;
}

export type DiploFactorLog = readonly DiploFactorEntry[];

/** Limit wpisów per para — wystarczający na rozbicie relacji, bez nieograniczonego wzrostu save'a. */
const DEFAULT_MAX_LOG = 40;

/**
 * Dopisuje wpis do rejestru pary i zwraca NOWĄ tablicę (immutable — nie mutuje `log`).
 * Zdarzenia z delta===0 są pomijane (nie wnoszą nic do rozbicia relacji).
 */
export function appendDiploFactor(
  log: DiploFactorLog,
  entry: DiploFactorEntry,
  maxLen: number = DEFAULT_MAX_LOG,
): DiploFactorLog {
  if (entry.delta === 0 || !Number.isFinite(entry.delta)) return log;
  const next = [...log, entry];
  return next.length > maxLen ? next.slice(next.length - maxLen) : next;
}

/** Etykiety PL dla eventKey — wzorowane na notacji makiety v1.1 (KROK 3 pkt 6). */
export const DIPLO_FACTOR_LABELS_PL: Record<string, string> = {
  dar: 'Dar przekazany',
  dar_pn: 'Dar przekazany',
  handel: 'Zawarcie umowy handlowej',
  handel_pn: 'Rozszerzenie handlu',
  wspolny_wrog: 'Wspólny wróg — nawiązanie kooperacji',
  wspolny_wrog_respekt: 'Wspólny wróg — akceptacja',
  pomoc_sojusznikowi: 'Pomoc w wojnie (historia)',
  zlamana_obietnica: 'Złamana umowa (Ty)',
  zlamana_obietnica_ai: 'Złamana umowa (przez AI, przeszłość)',
  zdrada: 'Zdrada / atak z zaskoczenia',
  szpieg_wykryty: 'Szpiegostwo wykryte',
  tarcia_graniczne: 'Tarcia graniczne',
  wspolna_religia: 'Wspólna religia (nawiązanie)',
  wojna_wypowiedziana: 'Wypowiedzenie wojny',
  wojna_casus_belli: 'Wypowiedzenie wojny (casus belli)',
  pokoj: 'Zawarcie pokoju',
  wygrana_bitwa_respekt: 'Wygrana bitwa (historia)',
  przewaga_militarna_respekt: 'Przewaga militarna',
  slabszy_militarnie_respekt: 'Słabszy militarnie',
  trybut_zaakceptowany_respekt: 'Akceptacja trybutu',
  trybut_odmowa: 'Odmowa trybutu',
  trybut_oferta_przyjeta: 'Oferta trybutu przyjęta',
  wymiana_tech_gratis: 'Wymiana technologii (gratis)',
  zerwanie_handlu: 'Zerwana umowa (przeszłość)',
  ultimatum_spelnione: 'Ultimatum spełnione',
  ultimatum_bezpodstawne: 'Ultimatum bezpodstawne',
};

export interface RelationFactorRow {
  label: string;
  value: number;
  /** true = wartość „na turę" (ciągły czynnik), pominięte = jednorazowy. */
  perTurn?: boolean;
}

export interface RelationBreakdown {
  pozytywne: RelationFactorRow[];
  negatywne: RelationFactorRow[];
}

/** Wzajemnie wykluczające tiery pokoju — jak PokojTrustTier w diplomacy-treaties.ts. */
export type BreakdownPeaceTier = 'sojusz' | 'nap' | 'pokoj';

/**
 * Czynniki CIĄGŁE, aktywne TERAZ — SILNIK wylicza je na żywo z activeDeals +
 * stanu pary (ten sam materiał co TickCtx przekazywany do tickDiplomacy).
 */
export interface ContinuousFactorFlags {
  aktywnyHandel?: boolean;
  pokojTrustTier?: BreakdownPeaceTier;
  wspolnaReligia?: boolean;
  odmiennaReligia?: boolean;
  ekspansjaPrzyGranicy?: boolean;
  /** Fakt statyczny pary (ustalony przy starcie kontaktu) — rywale tego samego typu cywilizacji. */
  rywalizacjaTenSamTyp?: boolean;
  /** Fakt statyczny pary — obcy okrąg kulturowy. */
  roznicaKulturowa?: boolean;
}

/** Podzbiór DiplomacyParams potrzebny do wyliczenia wartości czynników ciągłych. */
export interface RelationBreakdownParams {
  handel_zaufanie_perTura: number;
  sojusz_zaufanie_perTura: number;
  nap_zaufanie_perTura: number;
  pokoj_zaufanie_perTura: number;
  wspolnaReligia_zaufanie_perTura: number;
  odmiennaReligia_zaufanie_perTura: number;
  ekspansjaGranica_zaufanie_perTura: number;
  rywalizacjaTenSamTyp_zaufanie: number;
  roznicaKulturowa_zaufanie: number;
}

function pushRow(
  pozytywne: RelationFactorRow[],
  negatywne: RelationFactorRow[],
  label: string,
  value: number,
  perTurn?: boolean,
): void {
  if (value === 0 || !Number.isFinite(value)) return;
  const row: RelationFactorRow = perTurn ? { label, value, perTurn: true } : { label, value };
  if (value > 0) pozytywne.push(row);
  else negatywne.push(row);
}

/**
 * Buduje rozbicie „Za co Cię lubią / nie lubią" (makieta v1.1) z:
 *   - rejestru jednorazowych zdarzeń (`log`, najnowsze pierwsze),
 *   - czynników ciągłych aktywnych teraz (`continuous`),
 * przy użyciu REALNYCH wartości z DIPLOMACY_PARAMS (`params`) — spójnych z
 * paskami Zaufanie/Respekt (KROK 3 pkt 6 zlecenia: „wartości muszą pochodzić
 * z tych samych źródeł co paski").
 */
export function buildRelationBreakdown(
  log: DiploFactorLog,
  continuous: ContinuousFactorFlags,
  params: RelationBreakdownParams,
): RelationBreakdown {
  const pozytywne: RelationFactorRow[] = [];
  const negatywne: RelationFactorRow[] = [];

  if (continuous.aktywnyHandel) {
    pushRow(pozytywne, negatywne, 'Aktywny handel', params.handel_zaufanie_perTura, true);
  }
  if (continuous.pokojTrustTier === 'sojusz') {
    pushRow(pozytywne, negatywne, 'Aktywny sojusz', params.sojusz_zaufanie_perTura, true);
  } else if (continuous.pokojTrustTier === 'nap') {
    pushRow(pozytywne, negatywne, 'Trwający pakt o nieagresji', params.nap_zaufanie_perTura, true);
  } else if (continuous.pokojTrustTier === 'pokoj') {
    pushRow(pozytywne, negatywne, 'Pokojowy kontakt', params.pokoj_zaufanie_perTura, true);
  }
  if (continuous.wspolnaReligia) {
    pushRow(pozytywne, negatywne, 'Wspólna religia', params.wspolnaReligia_zaufanie_perTura, true);
  }
  if (continuous.odmiennaReligia) {
    pushRow(pozytywne, negatywne, 'Odmienna religia', params.odmiennaReligia_zaufanie_perTura, true);
  }
  if (continuous.ekspansjaPrzyGranicy) {
    pushRow(pozytywne, negatywne, 'Ekspansja przy granicy', params.ekspansjaGranica_zaufanie_perTura, true);
  }
  if (continuous.rywalizacjaTenSamTyp) {
    pushRow(pozytywne, negatywne, 'Rywalizacja (ten sam typ nacji)', params.rywalizacjaTenSamTyp_zaufanie);
  }
  if (continuous.roznicaKulturowa) {
    pushRow(pozytywne, negatywne, 'Różna kultura', params.roznicaKulturowa_zaufanie);
  }

  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i]!;
    const label = DIPLO_FACTOR_LABELS_PL[entry.eventKey] ?? entry.eventKey;
    pushRow(pozytywne, negatywne, label, entry.delta);
  }

  return { pozytywne, negatywne };
}
