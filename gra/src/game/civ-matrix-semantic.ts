/**
 * civ-matrix-semantic.ts — read-only semantic presentation of the civilization matrix.
 *
 * The classifier is deliberately separate from gameplay consumers. It derives a
 * Normal-only comparison from the raw matrix and never writes game/save state.
 * A status chip tells the player whether a value is active, display-only, or
 * still unwired; a relative badge must not be mistaken for a gameplay effect.
 */
import matrixRaw from '../../data/civ-matrix.json';
import type { CivMatrixData, CivMatrixParamDef, CivMatrixRow } from './civ-matrix';

export const CIV_MATRIX_SEMANTIC_VERSION = 'normal-median-signed-v1';
export const CIV_MATRIX_SEMANTIC_DIFFICULTY = 'normal' as const;

export type CivMatrixSemanticPolarity = 'beneficial' | 'harmful' | 'neutral/not-applicable';
export type CivMatrixConsumerStatus =
  | 'REAL_GAMEPLAY'
  | 'UI_ONLY'
  | 'REFERENCE_NEEDS_REVIEW'
  | 'UNWIRED'
  | 'DEAD_UNWIRED'
  | 'PROPOSAL'
  | 'BLOCKED'
  | 'DECISION_REQUIRED';
export type CivMatrixSemanticLabel = 'POZYTYWNY' | 'NEGATYWNY' | 'NEUTRALNY';

export interface CivMatrixNeutralBand {
  policyId: 'unit-aware-v1';
  tolerance: number;
  key: 'exact_flag' | 'fraction_0_005' | 'scale_0_5' | 'decimal_0_05' | 'integer_0_5';
}

export interface CivMatrixSemanticCell {
  parameterId: string;
  civilizationId: string;
  civilizationName: string;
  domain: string;
  unit: string;
  formula: string;
  rawValue: number | null;
  baselineKind: 'normal-median-all-15';
  baselineValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  maxDistance: number | null;
  correctedDelta: number | null;
  polarity: CivMatrixSemanticPolarity;
  neutralBand: CivMatrixNeutralBand;
  label: CivMatrixSemanticLabel;
  signedIntensity: number;
  consumerStatus: CivMatrixConsumerStatus;
  statusLabelPl: string;
  statusReasonPl: string;
  explanationPl: string;
  difficultyBehaviorPl: string;
  source: 'gra/data/civ-matrix.json' | 'default' | 'missing';
  provenance: {
    matrixVersion: string;
    semanticVersion: string;
    consumerEvidence: string[];
  };
}

export interface CivMatrixSemanticProfile {
  civilizationId: string;
  civilizationName: string;
  difficulty: 'normal';
  baselineKind: 'normal-median-all-15';
  parameterCount: number;
  activeCount: number;
  inactiveCount: number;
  cells: CivMatrixSemanticCell[];
  blockedReasonPl?: string;
}

export interface CivMatrixSemanticSnapshot {
  version: typeof CIV_MATRIX_SEMANTIC_VERSION;
  difficulty: 'normal';
  parameterCount: number;
  civilizationCount: number;
  expectedCellCount: number;
  cells: CivMatrixSemanticCell[];
  profiles: CivMatrixSemanticProfile[];
}

const DATA = matrixRaw as CivMatrixData;
const PARAMETER_IDS = Object.keys(DATA.paramDefs);
const CIVILIZATION_ROWS = DATA.cywilizacje;

const PROVEN_CONSUMERS: Readonly<Record<string, string>> = {
  lud_wzrost_proc: 'population-growth-v85.ts:230–232 — wkład wzrostu ludności; trudność ×0.50/×1.00/×1.50',
  dip_handlowosc_archetyp: 'civ-ai-data.ts:184–198 + diplomacy.ts:1267–1308 — skłonność AI do handlu',
  ai_agresywnosc: 'civ-ai-data.ts:39–53/156–178 + diplomacy.ts:1261–1285 — gotowość AI do wojny',
  ai_ekspansywnosc: 'civ-ai-data.ts:88–101 + ai-expansion.ts — scoring ekspansji i zakładania miast',
  ai_priorytet_militarny: 'civ-ai-data.ts:88–101 + ai-production-priorities.ts — scoring produkcji wojskowej',
  ai_priorytet_ekonomia: 'civ-ai-data.ts:88–101 + ai-production-priorities.ts — scoring produkcji ekonomicznej',
  ai_priorytet_nauka: 'civ-ai-data.ts:88–101 + ai-production-priorities.ts — scoring produkcji naukowej',
  ai_tolerancja_ryzyka: 'civ-ai-data.ts:88–101 + main.ts:19783–19795 — bias decyzji dyplomatycznych',
  ai_sklonnosc_podboju: 'civ-ai-data.ts:88–101 + ai.ts:3165–3166 — decyzje podboju/patroli',
  ai_profil_obronna: 'civ-ai-data.ts:56–68/88–101 + main.ts:9171–9173 — rola defensywnej kopii miasta',
  dip_sklonnosc_sojusze: 'diplomacy-display.ts:55 + TAG_RULES — tag relacyjny tylko w UI',
  dip_lojalnosc: 'diplomacy-display.ts:64 + TAG_RULES — tag relacyjny tylko w UI',
  dip_prog_wojny: 'diplomacy-display.ts:73 + TAG_RULES — tag relacyjny tylko w UI',
  dip_pamietliwosc: 'diplomacy-display.ts:82 + TAG_RULES — tag relacyjny tylko w UI',
  dip_otwartosc_handel: 'diplomacy-display.ts:46 + TAG_RULES — tag relacyjny tylko w UI',
};

const REAL_GAMEPLAY = new Set([
  'lud_wzrost_proc',
  'dip_handlowosc_archetyp',
  'ai_agresywnosc',
  'ai_ekspansywnosc',
  'ai_priorytet_militarny',
  'ai_priorytet_ekonomia',
  'ai_priorytet_nauka',
  'ai_tolerancja_ryzyka',
  'ai_sklonnosc_podboju',
  'ai_profil_obronna',
]);

const UI_ONLY = new Set([
  'dip_sklonnosc_sojusze',
  'dip_lojalnosc',
  'dip_prog_wojny',
  'dip_pamietliwosc',
  'dip_otwartosc_handel',
]);

// superseded by R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922, owner decided full
// removal instead of reference-only retention: the four meta-epoch/roster-tier
// fields formerly classified REFERENCE_ONLY here were the Wariant C outcome of
// R-CYWILIZACJE-MACIERZ-META-EPOCH-TIER-REFERENCE-Q1 (2026-09-22); the owner then
// uchylił that decision and ordered the parameters removed entirely from
// civ-matrix.json rather than kept as inert reference data. See
// dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922/
// OWNER-DECISION-20260922.md for the full rationale and the exact parameter names.

/**
 * R-CYWILIZACJE-MACIERZ-WIRING-AI-RECON-ORIGIN-20260922 runda 2: oba pola
 * ponownie zweryfikowane w kodzie runtime (nie tylko w metadanych macierzy)
 * i żadne nie ma legalnego, jednoznacznego kontraktu gameplay bez decyzji
 * właściciela — patrz `civMatrixConsumerEvidence`/`statusReason` i pakiet
 * A/B/C w `dyspozycje/autobot/runs/.../02-decision-packet.md`.
 * `dip_nastawienie_bazowe`: pomocnik `nastawienieBazoweZaufanieDelta` jest
 * czytany wyłącznie przez czysty `initialRelation`, który nie ma żadnego
 * wywołania runtime — żywy start klastra korzysta z `startRelationForPair`,
 * które tego pola nie dotyka (granica potwierdzona przez Defense Z1 rundy 1,
 * ponownie zweryfikowana w rundzie 2).
 * `dip_agresja_archetyp`: brak jakiegokolwiek wywołania runtime w `gra/src`
 * poza klasyfikatorem/danymi macierzy; istniejący konsument agresji
 * (`resolveArchetypeAggression`) czyta wyłącznie `ai_agresywnosc` — mapowanie
 * dip_agresja_archetyp na ten sam konsument groziłoby podwójnym liczeniem i
 * nie zostało wykonane.
 */
const DECISION_REQUIRED = new Set([
  'dip_nastawienie_bazowe',
  'dip_agresja_archetyp',
]);

const HARMFUL = new Set([
  'walka_koszt_rekrutacji_proc',
  'spec_Dezercja_proc',
  'spec_Koszt_pieniadz',
  'spec_Utrzymanie',
  'spec_Zywnosc_ture',
  'eko_korupcja_proc',
  'prod_koszt_budynku_proc',
  'prod_koszt_jednostki_proc',
  'prod_rush_koszt_proc',
  'lud_spadek_proc',
  'mp_koszt_jednostki_proc',
]);

// R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922 round 2 (2026-09-22):
// 17 combat multiplier parameters with non-default per-civilization values. Read
// evidence (civ-bonuses.ts, combat.ts, production.ts) shows the SAME gameplay
// effect these IDs describe is already delivered today through the independent
// `civs.json` → `bonusy[]` → `civ-bonuses.ts civCombatStatMultipliers()` /
// `production.ts civRecruitmentDiscount()` pipeline (verified per-row: e.g.
// `walka_atak_piechota`/rzymianie=0.15 duplicates the live Legion `bonus_walka`
// opis "+15% ataku i pancerza piechoty" applied via civ-bonuses.ts today).
// Wiring `civ-matrix.json` on top, without an owner-stated precedence rule
// (replace vs. stack vs. ignore), would silently double or conflict with an
// already-active bonus for the matching civilizations and silently no-op (or
// invent a rule) for the non-matching ones — anti-self-deception forbids
// guessing that rule. See 02-decision-packet-combat.md.
const BLOCKED_COMBAT_MULTIPLIER = new Set([
  'walka_atak_piechota',
  'walka_atak_kawaleria',
  'walka_atak_rydwany',
  'walka_atak_obleczenie',
  'walka_obrona_piechota',
  'walka_pancerz_piechota',
  'walka_uderzenie_piechota',
  'walka_uderzenie_kawaleria',
  'walka_dystans_lukownicy',
  'walka_hp_piechota',
  'walka_hp_rydwany',
  'walka_ruch_bitwa_proc',
  'walka_koszt_rekrutacji_proc',
  'walka_atak_piechota_teren_las',
  'walka_obrona_piechota_terytorium_wlasne',
  'walka_obrona_piechota_w_murze',
  'walka_atak_piechota_runda_szarzy',
]);

// Same round: 18 `spec_*` special-unit stat parameters with non-default values.
// Read evidence (`gra/data/units.json`, the 9 `Super-jednostka: "TAK"` rows) shows
// no unambiguous 1:1 mapping onto an existing unit field: where a same-named field
// exists (Atak, Obrona, Uderzenie, Pancerz, Przebicie, Health, Ruch, Widok pola,
// Morale bazowe), the matrix value equals the units.json field only for 2 of 7
// civilizations with a special unit (egipt, sumer); for the other 5 the matrix
// value is a different, non-derivable number (e.g. grecy spec_Atak=48 vs.
// units.json Hieros Lochos Atak=8; grecy spec_Health=100 vs. units.json Health=170).
// Several IDs (spec_Obrazenia, spec_Zasieg_hex, spec_Pociski, spec_Dezercja_proc,
// spec_Koszt_pieniadz, spec_Utrzymanie) have no matching units.json field at all.
// No sibling matrix parameter already wires a per-unit stat override this way.
// See 02-decision-packet-special-unit.md.
const BLOCKED_SPECIAL_UNIT_STAT = new Set([
  'spec_Atak',
  'spec_Obrazenia',
  'spec_Obrona',
  'spec_Uderzenie',
  'spec_Pancerz',
  'spec_Przebicie',
  'spec_Health',
  'spec_Atak_dystansowy',
  'spec_Zasieg_hex',
  'spec_Pociski',
  'spec_Ruch_bitwa',
  'spec_Ruch_mapa',
  'spec_Widok',
  'spec_Dezercja_proc',
  'spec_Morale',
  'spec_Koszt_pieniadz',
  'spec_Utrzymanie',
  'spec_Zywnosc_ture',
]);

// Same round: 25 combat/siege/fortification parameters where all 15 civilization
// cells equal the declared default (no differentiated signal in the matrix data
// itself). Closed dead for this scope — matches the DEAD_UNWIRED convention
// already established for non-combat domains; do not add a zero adapter.
const DEAD_UNWIRED_COMBAT = new Set([
  'walka_atak_lukownicy',
  'walka_atak_morska',
  'walka_atak_wszystkie',
  'walka_obrona_lukownicy',
  'walka_obrona_kawaleria',
  'walka_obrona_rydwany',
  'walka_obrona_obleczenie',
  'walka_obrona_morska',
  'walka_pancerz_lukownicy',
  'walka_pancerz_kawaleria',
  'walka_pancerz_rydwany',
  'walka_uderzenie_rydwany',
  'walka_dystans_rydwany',
  'walka_hp_kawaleria',
  'walka_zasieg_proc',
  'walka_oblezenie_proc',
  'walka_obrona_piechota_teren_las',
  'walka_atak_piechota_terytorium_wlasne',
  'walka_atak_piechota_w_murze',
  'walka_obrona_piechota_runda_szarzy',
  'walka_atak_piechota_teren_plytkie_morze',
  'walka_obrona_piechota_teren_plytkie_morze',
  'obl_obrona_miasta_proc',
  'obl_mur_proc',
  'obl_machines_proc',
]);

const NEUTRAL_DOMAINS = new Set(['ai', 'dyplomacja']);

function findCivilization(civKey: string): CivMatrixRow | undefined {
  const key = civKey.trim().toLowerCase();
  return CIVILIZATION_ROWS.find(row =>
    row.ikonaId.toLowerCase() === key
      || row.typCywilizacji.toLowerCase() === key
      || row.Cywilizacja.toLowerCase() === key,
  );
}

function parameterDef(parameterId: string): CivMatrixParamDef | undefined {
  return DATA.paramDefs[parameterId];
}

export function civMatrixSemanticParameterIds(): readonly string[] {
  return PARAMETER_IDS;
}

export function civMatrixSemanticCivilizations(): readonly CivMatrixRow[] {
  return CIVILIZATION_ROWS;
}

export function civMatrixConsumerStatus(parameterId: string): CivMatrixConsumerStatus {
  if (REAL_GAMEPLAY.has(parameterId)) return 'REAL_GAMEPLAY';
  if (UI_ONLY.has(parameterId)) return 'UI_ONLY';
  if (DECISION_REQUIRED.has(parameterId)) return 'DECISION_REQUIRED';
  if (DEAD_UNWIRED_COMBAT.has(parameterId)) return 'DEAD_UNWIRED';
  if (BLOCKED_COMBAT_MULTIPLIER.has(parameterId) || BLOCKED_SPECIAL_UNIT_STAT.has(parameterId)) return 'BLOCKED';
  return 'UNWIRED';
}

export function civMatrixConsumerEvidence(parameterId: string): readonly string[] {
  const evidence = PROVEN_CONSUMERS[parameterId];
  return evidence ? [evidence] : [];
}

export function civMatrixSemanticPolarity(parameterId: string): CivMatrixSemanticPolarity {
  const def = parameterDef(parameterId);
  if (!def) return 'neutral/not-applicable';
  if (NEUTRAL_DOMAINS.has(def.domena) || parameterId.startsWith('ai_') || parameterId.startsWith('dip_')) {
    return 'neutral/not-applicable';
  }
  if (HARMFUL.has(parameterId)) return 'harmful';
  return 'beneficial';
}

export function civMatrixNeutralBand(definition: CivMatrixParamDef): CivMatrixNeutralBand {
  if (definition.formula === 'flag' || definition.jednostka === 'flag_0_1') {
    return { policyId: 'unit-aware-v1', tolerance: 0, key: 'exact_flag' };
  }
  if (definition.jednostka === 'ulamek' || definition.jednostka === 'ulamek_0_1') {
    return { policyId: 'unit-aware-v1', tolerance: 0.005, key: 'fraction_0_005' };
  }
  if (definition.jednostka === 'skala_1_10') {
    return { policyId: 'unit-aware-v1', tolerance: 0.5, key: 'scale_0_5' };
  }
  if (definition.jednostka === 'integer') {
    return { policyId: 'unit-aware-v1', tolerance: 0.5, key: 'integer_0_5' };
  }
  return {
    policyId: 'unit-aware-v1',
    tolerance: definition.formula === 'add' || definition.formula === 'stat_abs' ? 0.5 : 0.05,
    key: definition.formula === 'add' || definition.formula === 'stat_abs' ? 'integer_0_5' : 'decimal_0_05',
  };
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle]!;
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function roundTwo(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function statusLabel(status: CivMatrixConsumerStatus): string {
  switch (status) {
    case 'REAL_GAMEPLAY': return 'AKTYWNE';
    case 'UI_ONLY': return 'TYLKO INFORMACJA';
    case 'REFERENCE_NEEDS_REVIEW': return 'DO WERYFIKACJI';
    case 'UNWIRED': return 'NIEAKTYWNE — BRAK KONSUMENTA';
    case 'DEAD_UNWIRED': return 'ZAMKNIĘTE — NIEAKTYWNE';
    case 'PROPOSAL': return 'PROPOZYCJA';
    case 'BLOCKED': return 'ZABLOKOWANE';
    case 'DECISION_REQUIRED': return 'WYMAGA DECYZJI WŁAŚCICIELA';
  }
}

function statusReason(
  status: CivMatrixConsumerStatus,
  parameterId: string,
  polarity: CivMatrixSemanticPolarity = civMatrixSemanticPolarity(parameterId),
): string {
  switch (status) {
    case 'REAL_GAMEPLAY':
      return polarity === 'neutral/not-applicable'
        ? 'Wartość ma potwierdzone użycie w profilu AI/relacji; badge pozostaje neutralny, a opis profilu jest osobny.'
        : 'Wartość ma potwierdzony konsument produkcyjny; badge opisuje kierunek względem mediany, nie dodatkowy efekt.';
    case 'UI_ONLY': return 'Wartość służy tylko do opisu relacji/profilu w UI; nie jest premią gameplayową.';
    case 'UNWIRED':
      return parameterId === 'dip_nastawienie_bazowe'
        ? 'Brak potwierdzonego live konsumenta dla dip_nastawienie_bazowe; inicjalizator klastra nie używa tego pola, a kontrakt właściciela dla aktora i warunku pozostaje nierozstrzygnięty.'
        : `Brak potwierdzonego konsumenta dla ${parameterId}; wymagane osobne rozstrzygnięcie aktora, warunku, formuły, precedencji i testu.`;
    case 'DEAD_UNWIRED': return 'Pole zachowane jako proweniencja, bez aktywnego wpływu.';
    case 'PROPOSAL': return 'Wartość/specyfikacja jest propozycją; nie wpływa na runtime.';
    case 'REFERENCE_NEEDS_REVIEW': return 'Znaleziono ślad referencyjny, ale brak dowodu efektu w runtime.';
    case 'BLOCKED':
      if (BLOCKED_COMBAT_MULTIPLIER.has(parameterId)) {
        return `Zablokowane do decyzji właściciela (runda 2, R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922): ${parameterId} opisuje ten sam efekt walki, który już dziś dostarcza niezależny kanał civs.json→bonusy[]→civ-bonuses.ts; bez decyzji o precedencji (zastąp / sumuj / ignoruj macierz) podłączenie civ-matrix.json ryzykuje ciche podwojenie lub konflikt bonusu. Patrz 02-decision-packet-combat.md.`;
      }
      if (BLOCKED_SPECIAL_UNIT_STAT.has(parameterId)) {
        return `Zablokowane do decyzji właściciela (runda 2, R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922): ${parameterId} nie ma jednoznacznego odwzorowania 1:1 na pole jednostki specjalnej w units.json (wartości matrix i units.json zgadzają się tylko dla 2 z 7 cywilizacji z jednostką specjalną; kilka ID nie ma odpowiadającego pola wcale). Wymaga jawnego kontraktu aktora/pola docelowego. Patrz 02-decision-packet-special-unit.md.`;
      }
      return 'Pole zablokowane do decyzji; nie ma efektywnego wpływu.';
    case 'DECISION_REQUIRED':
      return parameterId === 'dip_nastawienie_bazowe'
        ? 'Runda 2: potwierdzono ponownie brak żywego konsumenta — pomocnik nastawienieBazoweZaufanieDelta jest wołany wyłącznie z czystego initialRelation, a initialRelation nie ma żadnego wywołania runtime w main.ts/cluster-start.ts (żywy start klastra używa startRelationForPair, który tego pola nie czyta). Decyzja właściciela (aktor, warunek, precedencja) wymagana przed jakimkolwiek wiringiem — patrz pakiet A/B/C.'
        : 'Runda 2: potwierdzono ponownie brak jakiegokolwiek wywołania runtime dla dip_agresja_archetyp w gra/src poza samym klasyfikatorem/danymi macierzy; istniejący konsument agresji (resolveArchetypeAggression) czyta wyłącznie ai_agresywnosc. Decyzja właściciela (aktor, warunek, relacja wobec ai_agresywnosc) wymagana przed jakimkolwiek wiringiem — patrz pakiet A/B/C.';
  }
}

function difficultyBehavior(parameterId: string, status: CivMatrixConsumerStatus): string {
  if (
    status === 'UI_ONLY'
    || status === 'UNWIRED'
    || status === 'PROPOSAL'
    || status === 'BLOCKED'
    || status === 'DECISION_REQUIRED'
  ) {
    return 'Panel etykiet używa wyłącznie tożsamości Normal; brak deklarowanego efektu Easy/Hard.';
  }
  if (parameterId === 'lud_wzrost_proc') {
    return 'Normal ×1.00; aktywny konsument wzrostu stosuje Easy ×0.50 i Hard ×1.50 do wkładu cywilizacji.';
  }
  if (parameterId.startsWith('ai_')) {
    return 'Tożsamość Normal w panelu; istniejący konsument skali AI ma jawny krok Normal−1 / Normal / Normal+1, ograniczony do 1…10.';
  }
  return 'Tożsamość Normal w panelu; nie przepisuje surowej wartości na Easy/Hard.';
}

function consumerExplanation(parameterId: string, status: CivMatrixConsumerStatus): string {
  const evidence = PROVEN_CONSUMERS[parameterId];
  if (evidence) return evidence;
  return statusReason(status, parameterId);
}

function classifyDirection(
  rawValue: number,
  baselineValue: number,
  minValue: number,
  maxValue: number,
  polarity: CivMatrixSemanticPolarity,
): { label: CivMatrixSemanticLabel; signedIntensity: number; correctedDelta: number; maxDistance: number } {
  if (polarity === 'neutral/not-applicable') {
    return { label: 'NEUTRALNY', signedIntensity: 0, correctedDelta: 0, maxDistance: 0 };
  }
  const correctedDelta = polarity === 'beneficial'
    ? rawValue - baselineValue
    : baselineValue - rawValue;
  const maxDistance = Math.max(Math.abs(maxValue - baselineValue), Math.abs(minValue - baselineValue));
  // D8: the exact median is a small positive identity marker, not a third badge.
  if (rawValue === baselineValue) {
    return { label: 'POZYTYWNY', signedIntensity: 1, correctedDelta, maxDistance };
  }
  if (maxDistance === 0) {
    return { label: correctedDelta >= 0 ? 'POZYTYWNY' : 'NEGATYWNY', signedIntensity: correctedDelta >= 0 ? 1 : -1, correctedDelta, maxDistance };
  }
  const normalized = Math.max(-10, Math.min(10, (correctedDelta / maxDistance) * 10));
  return {
    label: normalized >= 0 ? 'POZYTYWNY' : 'NEGATYWNY',
    signedIntensity: roundTwo(normalized),
    correctedDelta,
    maxDistance,
  };
}

export interface CivMatrixSemanticCellInput {
  parameterId: string;
  civilizationId: string;
  civilizationName?: string;
  rawValue: number | null;
  baselineValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  consumerStatus?: CivMatrixConsumerStatus;
  source?: CivMatrixSemanticCell['source'];
}

export function classifyCivMatrixCell(input: CivMatrixSemanticCellInput): CivMatrixSemanticCell {
  const def = parameterDef(input.parameterId);
  const status = input.consumerStatus ?? civMatrixConsumerStatus(input.parameterId);
  const polarity = civMatrixSemanticPolarity(input.parameterId);
  const neutralBand = def ? civMatrixNeutralBand(def) : { policyId: 'unit-aware-v1' as const, tolerance: 0, key: 'exact_flag' as const };
  const validNumbers = [input.rawValue, input.baselineValue, input.minValue, input.maxValue].every(
    value => typeof value === 'number' && Number.isFinite(value),
  );
  const blocked = !def || !validNumbers;
  const rawValue = typeof input.rawValue === 'number' && Number.isFinite(input.rawValue) ? input.rawValue : null;
  const baselineValue = typeof input.baselineValue === 'number' && Number.isFinite(input.baselineValue) ? input.baselineValue : null;
  const minValue = typeof input.minValue === 'number' && Number.isFinite(input.minValue) ? input.minValue : null;
  const maxValue = typeof input.maxValue === 'number' && Number.isFinite(input.maxValue) ? input.maxValue : null;
  const direction = !blocked && rawValue !== null && baselineValue !== null && minValue !== null && maxValue !== null
    ? classifyDirection(rawValue, baselineValue, minValue, maxValue, polarity)
    : { label: 'NEUTRALNY' as const, signedIntensity: 0, correctedDelta: null, maxDistance: null };
  const effectiveStatus = blocked ? 'BLOCKED' : status;
  const blockedReason = !def
    ? `Nieznany parametr ${input.parameterId}; brak cichego fallbacku.`
    : !validNumbers
      ? `Brak wartości dla ${input.civilizationId}/${input.parameterId}; brak cichego fallbacku do Grecji.`
      : statusReason(effectiveStatus, input.parameterId);
  return {
    parameterId: input.parameterId,
    civilizationId: input.civilizationId,
    civilizationName: input.civilizationName ?? input.civilizationId,
    domain: def?.domena ?? 'unknown',
    unit: def?.jednostka ?? 'unknown',
    formula: def?.formula ?? 'unknown',
    rawValue,
    baselineKind: 'normal-median-all-15',
    baselineValue,
    minValue,
    maxValue,
    maxDistance: direction.maxDistance,
    correctedDelta: direction.correctedDelta,
    polarity,
    neutralBand,
    label: direction.label,
    signedIntensity: direction.signedIntensity,
    consumerStatus: effectiveStatus,
    statusLabelPl: statusLabel(effectiveStatus),
    statusReasonPl: blocked ? blockedReason : statusReason(effectiveStatus, input.parameterId),
    explanationPl: blocked ? blockedReason : consumerExplanation(input.parameterId, effectiveStatus),
    difficultyBehaviorPl: difficultyBehavior(input.parameterId, effectiveStatus),
    source: input.source ?? (blocked ? 'missing' : 'gra/data/civ-matrix.json'),
    provenance: {
      matrixVersion: String(DATA._meta.version ?? 'unknown'),
      semanticVersion: CIV_MATRIX_SEMANTIC_VERSION,
      consumerEvidence: [...civMatrixConsumerEvidence(input.parameterId)],
    },
  };
}

function buildBaselines(): Readonly<Record<string, { median: number; min: number; max: number }>> {
  const out: Record<string, { median: number; min: number; max: number }> = {};
  for (const parameterId of PARAMETER_IDS) {
    const values = CIVILIZATION_ROWS
      .map(row => row.params[parameterId])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (values.length !== CIVILIZATION_ROWS.length) continue;
    out[parameterId] = { median: median(values), min: Math.min(...values), max: Math.max(...values) };
  }
  return out;
}

const BASELINES = buildBaselines();

export function civMatrixSemanticBaseline(parameterId: string): number | undefined {
  return BASELINES[parameterId]?.median;
}

export function buildCivMatrixSemanticProfile(civKey: string): CivMatrixSemanticProfile {
  const row = findCivilization(civKey);
  if (!row) {
    return {
      civilizationId: civKey,
      civilizationName: civKey,
      difficulty: CIV_MATRIX_SEMANTIC_DIFFICULTY,
      baselineKind: 'normal-median-all-15',
      parameterCount: PARAMETER_IDS.length,
      activeCount: 0,
      inactiveCount: 0,
      cells: [],
      blockedReasonPl: `Nieznana cywilizacja „${civKey}”; profil zablokowany. Nie użyto danych Grecji jako fallbacku.`,
    };
  }
  const cells = PARAMETER_IDS.map(parameterId => {
    const baseline = BASELINES[parameterId];
    const rawValue = Object.prototype.hasOwnProperty.call(row.params, parameterId)
      ? row.params[parameterId]!
      : null;
    return classifyCivMatrixCell({
      parameterId,
      civilizationId: row.ikonaId,
      civilizationName: row.Cywilizacja,
      rawValue,
      baselineValue: baseline?.median ?? null,
      minValue: baseline?.min ?? null,
      maxValue: baseline?.max ?? null,
      source: rawValue === null ? 'missing' : 'gra/data/civ-matrix.json',
    });
  });
  return {
    civilizationId: row.ikonaId,
    civilizationName: row.Cywilizacja,
    difficulty: CIV_MATRIX_SEMANTIC_DIFFICULTY,
    baselineKind: 'normal-median-all-15',
    parameterCount: PARAMETER_IDS.length,
    activeCount: cells.filter(cell => cell.consumerStatus === 'REAL_GAMEPLAY').length,
    inactiveCount: cells.filter(cell => cell.consumerStatus !== 'REAL_GAMEPLAY').length,
    cells,
  };
}

export function buildCivMatrixSemanticSnapshot(): CivMatrixSemanticSnapshot {
  const profiles = CIVILIZATION_ROWS.map(row => buildCivMatrixSemanticProfile(row.ikonaId));
  const cells = profiles.flatMap(profile => profile.cells);
  return {
    version: CIV_MATRIX_SEMANTIC_VERSION,
    difficulty: CIV_MATRIX_SEMANTIC_DIFFICULTY,
    parameterCount: PARAMETER_IDS.length,
    civilizationCount: CIVILIZATION_ROWS.length,
    expectedCellCount: PARAMETER_IDS.length * CIVILIZATION_ROWS.length,
    cells,
    profiles,
  };
}

export function statusAllowsDefaultVisibility(status: CivMatrixConsumerStatus): boolean {
  return status === 'REAL_GAMEPLAY';
}

export function civMatrixParameterLabelPl(parameterId: string): string {
  const replacements: Readonly<Record<string, string>> = {
    meta: 'Meta', walka: 'Walka', spec: 'Jednostka specjalna', eko: 'Ekonomia', prod: 'Produkcja',
    lud: 'Ludność', mp: 'Manpower', wealth: 'Bogactwo', kultura: 'Kultura', religia: 'Religia',
    porzadek: 'Porządek', obl: 'Oblężenie', dip: 'Dyplomacja', ai: 'Profil AI',
    atak: 'atak', obrona: 'obrona', pancerz: 'pancerz', uderzenie: 'uderzenie', dystans: 'dystans',
    hp: 'punkty zdrowia', ruch: 'ruch', zasieg: 'zasięg', koszt: 'koszt', szybkosc: 'szybkość',
    piechota: 'piechoty', lukownicy: 'łuczników', kawaleria: 'kawalerii', rydwany: 'rydwanów',
    morska: 'morski', wszystkie: 'wszystkich', oblezenie: 'oblężenia', teren: 'teren', las: 'lasu',
    terytorium: 'własnym terytorium', murze: 'murze', runda: 'rundzie szarży', plytkie: 'płytkim morzu',
    proc: '%', skala: 'skala', agresywnosc: 'agresywność', ekspansywnosc: 'ekspansywność',
    priorytet: 'priorytet', ekonomia: 'ekonomia', nauka: 'nauka', tolerancja: 'tolerancja',
    ryzyka: 'ryzyka', sklonnosc: 'skłonność', podboju: 'podboju', profil: 'profil', obronna: 'obronny',
    epoka: 'epoka', kamien: 'kamienia', braz: 'brązu', zelazo: 'żelaza', mnoznik: 'mnożnik',
    waluta: 'waluty', tier: 'tier', roster: 'puli', praca: 'pracy', pieniadz: 'pieniędzy',
    port: 'portu', zywnosc: 'żywności', luksus: 'luksusu', zadowolenie: 'zadowolenia',
    handel: 'handlu', brutto: 'brutto', korupcja: 'korupcji', wzrost: 'wzrostu', spadek: 'spadku',
    zdrowie: 'zdrowia', limit: 'limitu', regen: 'regeneracji', max: 'maksimum', naplyw: 'napływu',
    spread: 'rozprzestrzeniania', budynku: 'budynku', jednostki: 'jednostki',
    rush: 'przyspieszenia', obrona_miasta: 'obrony miasta', mur: 'muru',
    machines: 'machin', sklonnosc_sojusze: 'skłonność do sojuszy', lojalnosc: 'lojalność',
    prog_wojny: 'próg wojny', pamietliwosc: 'pamiętliwość', otwartosc: 'otwartość',
    handlowosc: 'handlowość', archetyp: 'archetypu', nastawienie: 'nastawienie bazowe',
    morale: 'morale', obrazenia: 'obrażeń', przebicie: 'przebicia',
    health: 'zdrowia', pociski: 'pocisków', widok: 'widoku', dezercja: 'dezercji', utrzymanie: 'utrzymania',
    ture: 'na turę', podwoju: 'podboju',
  };
  return parameterId.split('_').map((part, index) => {
    const replacement = replacements[part] ?? part.replace(/proc$/, '%');
    return index === 0 ? replacement : replacement;
  }).join(' · ');
}

export function civMatrixFormattedValue(value: number | null, unit: string): string {
  if (value === null) return 'brak wartości';
  if (unit === 'flag_0_1') return value === 1 ? 'tak (1)' : 'nie (0)';
  if (unit === 'ulamek' || unit === 'ulamek_0_1') return `${(value * 100).toFixed(1)}% (${value})`;
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(3)));
}

export function civMatrixIntensityLabel(intensity: number): string {
  if (intensity === 0) return '0';
  return intensity > 0 ? `+${intensity}` : String(intensity);
}
