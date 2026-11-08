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
  lud_spadek_proc: 'population-growth-v85.ts:339–365, 490–528 — centralny głód skaluje istniejący ubytek liniowo przez bufor ułamkowy; minimum populacji zachowane',
  lud_zdrowie_proc: 'population-growth-v85.ts:248–255, 496–503 — centralny growthPct skaluje raz istniejący wkład floor(max(0, zdrowie)/10); raw health i legacy healthModifier bez zmian',
  lud_zadowolenie_bazowe: 'main.ts:32134–32149 + population-growth-v85.ts:248–255, 496–503 — jeden resolved bonus ownerCivMap trafia do Order/rewolty i bounded happiness-to-growth',
  lud_limit_populacji: 'economy.ts:1143–1160 + population-growth-v85.ts:293–297, 537–538 — buildingCap 5/8/12 plus approved Matrix delta -1/0/+1/+2, shared by legacy and central growth paths',
  meta_mnoznik_waluta: 'economy.ts:826–877 + turn-economy.ts:297 + cityPanel.ts:1196,10897; civ-matrix-meta-roster-wiring-test.cjs:60–100 — matrix-backed currency multiplier, owner-approved Q69 difficulty delta and 63/63 roster/yield receipt',
  walka_atak_morska: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/morska; civCombatStatMultipliers()/bonusApplies() require unit category morska; combat.ts:874–881,904–907 applies attacker stats; main.ts owner bonus resolution→BattleScene attackerCivBonusy. Existing effect only; no new difficulty rule.',
  walka_atak_kawaleria: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/kawaleria; bonusApplies() unit category gate; civCombatStatMultipliers()/applyWalkBonus() produce atk; combat.ts:874–881,904–907 applies attacker stats; main.ts:8213–8219 supplies matrix bonuses for each owner. Existing effect only; no new difficulty rule.',
  walka_atak_rydwany: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/rydwany; bonusApplies() unit category gate; civCombatStatMultipliers()/applyWalkBonus() produce atk; combat.ts:874–881,904–907 applies attacker stats; main.ts:8213–8219 supplies matrix bonuses for each owner. Existing effect only; no new difficulty rule.',
  walka_atak_obleczenie: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/obleczenie; bonusApplies() siege-category gate; civCombatStatMultipliers()/applyWalkBonus() produce atk; combat.ts:874–881,904–907 applies attacker stats; main.ts:8213–8219 supplies matrix bonuses for each owner. Existing effect only; no new difficulty rule.',
  walka_obrona_morska: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_obrona/morska; civCombatStatMultipliers()/bonusApplies() require unit category morska and defender side; combat.ts:887–894,909–912 applies defender stats; main.ts owner bonus resolution→BattleScene defenderCivBonusy. Existing effect only; no new difficulty rule.',
  walka_atak_piechota_teren_plytkie_morze: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/piechota; civCombatStatMultipliers()/bonusApplies() require infantry and ctx.shallowSea=true; combat.ts:874–881 passes the shallow-sea context and applies attacker stats; main.ts owner bonus resolution→BattleScene attackerCivBonusy. Existing conditional effect only.',
  walka_obrona_piechota_teren_plytkie_morze: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_obrona/piechota; civCombatStatMultipliers()/bonusApplies() require infantry, defender side and ctx.shallowSea=true; combat.ts:887–894 passes context and applies defender stats; main.ts owner bonus resolution→BattleScene defenderCivBonusy. Existing conditional effect only.',
  walka_dystans_rydwany: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/rydwany; civCombatStatMultipliers() maps the entry to rangedAtk (combat.ts:874–912) and civAttackRangeMultiplier() applies the chariot range factor (battleScene.ts:7186–7190); main.ts owner bonus resolution supplies BattleScene attacker/defender entries. Existing effect only.',
  walka_obrona_piechota_teren_las: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_obrona/piechota; civCombatStatMultipliers()/bonusApplies() require infantry, defender side and terrainIsForestOrJungle (forest/jungle/mountain); combat.ts:887–894 passes defender terrain; main.ts owner bonus resolution→BattleScene defenderCivBonusy. Existing conditional effect only.',
  walka_uderzenie_piechota: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/piechota; bonusApplies() category gate and applyWalkBonus() maps walka_uderzenie_* to uderzenie (194); combat.ts:1080–1105,1115–1126 applies it to charge hit/damage; main.ts:8213–8219 supplies matrix bonuses for each owner. Existing effect only; no new difficulty rule.',
  walka_uderzenie_kawaleria: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/kawaleria; bonusApplies() category gate and applyWalkBonus() maps walka_uderzenie_* to uderzenie (194); combat.ts:1080–1105,1115–1126 applies it to charge hit/damage; main.ts:8213–8219 supplies matrix bonuses for each owner. Existing effect only; no new difficulty rule.',
  walka_atak_piechota_teren_las: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/piechota; bonusApplies() gates _teren_las by terrainIsForestOrJungle (117–120,159); combat.ts:874–881 passes defender terrain and 904–907 applies attacker stats; main.ts:8213–8219 supplies matrix bonuses for each owner. Existing conditional effect only.',
  walka_obrona_piechota_terytorium_wlasne: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_obrona/piechota; bonusApplies() requires ownTerritory (154–157) and defender side; combat.ts:887–894 passes defender ownership and 909–912 applies defense; main.ts:8213–8219 supplies matrix bonuses for each owner. Existing conditional effect only.',
  walka_obrona_piechota_w_murze: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_obrona/piechota; civWallDefenseMultiplier() matches this ID (340–342); combat.ts:976–982 and battleScene.ts:8231–8234 apply it only on the wall walkway; main.ts:8213–8219 supplies matrix bonuses for each owner. Existing conditional effect only.',
  walka_atak_piechota_runda_szarzy: 'civ-bonuses.ts:264–295 MATRIX_COMBAT_SPECS→bonus_walka/piechota; bonusApplies() requires isChargeRound for _runda_szarzy (161); combat.ts:1080–1105,1115–1126 passes the round condition and applies attacker stats; main.ts:8213–8219 supplies matrix bonuses for each owner. Existing conditional effect only.',
  mp_regen_proc: 'manpower.ts + turn-economy.ts — exact civ-matrix multiplier is applied to live city regeneration for player and AI owners',
  mp_max_proc: 'manpower.ts + turn-economy.ts + population-growth-v85.ts — exact civ-matrix multiplier is applied to city max/current caps and population-change refresh',
  mp_koszt_jednostki_proc: 'manpower.ts + production.ts + main.ts + cityPanel.ts — exact civ-matrix multiplier is applied to recruitment, queued completion/refund, replenishment and UI cost previews',
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
  'walka_atak_piechota': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/10-final-control-runda3.md; gra/tools/pr141-g1-combat-activation-test.cjs',
  'walka_obrona_piechota': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/10-final-control-runda3.md; gra/tools/pr141-g1-combat-activation-test.cjs',
  'walka_pancerz_piechota': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/10-final-control-runda3.md; gra/tools/pr141-g1-combat-activation-test.cjs',
  'walka_dystans_lukownicy': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/10-final-control-runda3.md; gra/tools/pr141-g1-combat-activation-test.cjs',
  'walka_hp_piechota': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/10-final-control-runda3.md; gra/tools/pr141-g1-combat-activation-test.cjs',
  'walka_hp_rydwany': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/11-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-G1-ACTIVATION-20261018/10-final-control-runda3.md; gra/tools/pr141-g1-combat-activation-test.cjs',
  'dip_nastawienie_bazowe': 'bounded pair initialization; direct generateMap boundary skipped; no full-world runtime claim: dyspozycje/autobot/runs/R-PR141-CODEX-DIP-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-DIP-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-dip-activation-test.cjs',
  'dip_agresja_archetyp': 'bounded pair initialization; direct generateMap boundary skipped; no full-world runtime claim: dyspozycje/autobot/runs/R-PR141-CODEX-DIP-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-DIP-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-dip-activation-test.cjs',
  'eko_praca_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-WORK-ACTIVATION-20261018/06-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-WORK-ACTIVATION-20261018/05-final-control.md; gra/tools/pr141-f04-work-activation-test.cjs',
  'prod_koszt_budynku_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-COST-ACTIVATION-20261018/06-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-COST-ACTIVATION-20261018/05-final-control.md; gra/tools/pr141-f04-cost-activation-test.cjs',
  'prod_koszt_jednostki_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-COST-ACTIVATION-20261018/06-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-COST-ACTIVATION-20261018/05-final-control.md; gra/tools/pr141-f04-cost-activation-test.cjs',
  'walka_ruch_bitwa_proc': 'bounded accepted F05 evidence: dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925/attempt-codex-f05-20261017/01-operator.md; gra/src/game/civ-bonuses.ts::civMatrixBonusyForCivKey/civMovementMultiplier; gra/src/battle/battleScene.ts::_movementPointsFor; gra/tools/egypt-movement-precedence-test.cjs; dyspozycje/autobot/runs/R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018/01-operator.md. Owner decision 1B suppresses Egypt overlapping general field in favor of its specific chariot field, while the Zulu general field remains active; this per-ID evidence does not claim every civilization cell has a nonzero runtime effect. Bounded evidence only; no full-world/map-generation claim.',
  'walka_ruch_rydwany': 'bounded accepted Egypt movement-precedence evidence (owner decision 1B): dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925/attempt-codex-f05-20261017/01-operator.md; gra/src/game/civ-bonuses.ts::civMatrixBonusyForCivKey/civMovementMultiplier; gra/src/battle/battleScene.ts::_movementPointsFor; gra/tools/egypt-movement-precedence-test.cjs; dyspozycje/autobot/runs/R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018/01-operator.md. Bounded evidence only.',
  'walka_ruch_piechota_teren_plytkie_morze': 'bounded accepted shallow-sea context evidence (owner decision 4B): dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925/attempt-codex-f05-20261017/01-operator.md; civ-bonuses.ts::civMovementMultiplier/civEmbarkationMovementMultiplier; embarkation.ts::moveCostFnFor; gra/tools/egypt-movement-precedence-test.cjs; dyspozycje/autobot/runs/R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018/01-operator.md. Bounded evidence only; no map-generation claim.',
  'walka_koszt_rekrutacji_proc': 'bounded accepted G11 evidence (owner decision 2A): dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-EKO-WEALTH-MANPOWER-SPOL-PROD-REBASE-Q1-20260925/attempt-codex-g11-20261017/01-operator.md; gra/src/game/civ-bonuses.ts::civMatrixBonusyForCivKey; gra/src/game/production.ts::civRecruitmentDiscount/unitMoneyCost; gra/tools/impi-recruitment-discount-test.cjs; gra/tools/pr141-f04-cost-activation-test.cjs; dyspozycje/autobot/runs/R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018/01-operator.md. Zulu discount is Impi-only and additively floored once; bounded evidence only.',
  'wealth_cap_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/05-final-control.md; gra/tools/pr141-f04-society-activation-test.cjs',
  'kultura_naplyw_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/05-final-control.md; gra/tools/pr141-f04-society-activation-test.cjs',
  'porzadek_produkcja_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/05-final-control.md; gra/tools/pr141-f04-society-activation-test.cjs',
  'porzadek_nauka_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/05-final-control.md; gra/tools/pr141-f04-society-activation-test.cjs',
  'porzadek_kultura_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/05-final-control.md; gra/tools/pr141-f04-society-activation-test.cjs',
  'porzadek_wzrost_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/06-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-ACTIVATION-20261018/05-final-control.md; gra/tools/pr141-f04-society-activation-test.cjs',
  'wealth_mnoznik_proc': 'bounded Wealth caller AST evidence; no full-world runtime claim: dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/14-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/13-final-control.md; gra/tools/pr141-f04-society-remaining-activation-test.cjs',
  'religia_spread_proc': 'source-inspected main owner route plus bounded helper/component evidence; no main-loop numeric execution: dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/14-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/13-final-control.md; gra/tools/pr141-f04-society-remaining-activation-test.cjs',
  'porzadek_pieniadz_proc': 'source-inspected main owner route plus bounded helper/component evidence; no main-loop numeric execution: dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/14-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018/13-final-control.md; gra/tools/pr141-f04-society-remaining-activation-test.cjs',
  'eko_handel_brutto_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-f04-yields-activation-test.cjs',
  'eko_pieniadz_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-f04-yields-activation-test.cjs',
  'eko_pieniadz_port_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-f04-yields-activation-test.cjs',
  'eko_zywnosc_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-f04-yields-activation-test.cjs',
  'eko_nauka_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-f04-yields-activation-test.cjs',
  'eko_kultura_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-f04-yields-activation-test.cjs',
  'eko_luksus_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-f04-yields-activation-test.cjs',
  'eko_zadowolenie_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-f04-yields-activation-test.cjs',
  'eko_korupcja_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/08-integration.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md; gra/tools/pr141-f04-yields-activation-test.cjs',
  'prod_szybkosc_budynku_proc': 'bounded accepted integration evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/07-integration-building-speed.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/06-final-control-building-speed.md; gra/tools/pr141-f04-building-speed-activation-test.cjs',
  'prod_szybkosc_jednostki_proc': 'bounded accepted unit-speed evidence: dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/08-unit-speed-operator.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/09-unit-speed-fixture-addendum.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/10-unit-speed-evaluator.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/11-unit-speed-final-control.md; dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018/12-unit-speed-integration.md; gra/tools/pr141-f04-unit-speed-activation-test.cjs; gra/tools/ai-jednostki-tylko-zakup-test.cjs. Bounded actual-source owner-routing and integer-capacity evidence only; no per-cell behavior PASS or full-runtime claim.',
  'prod_rush_koszt_proc': 'owner-approved signed price convention: docs/decyzje/R-PR141-CODEX-F04-RUSH-DECISION-20261018.md; bounded actual-source helper/UI quote/main owner-payment evidence: dyspozycje/autobot/runs/R-PR141-CODEX-MATRIX-ONLY-BONUSES-20261018/01-rush-operator-addendum.md; gra/src/game/production.ts::rushCost; gra/src/ui/cityPanel.ts::rushCostModifierForCity/renderProd; gra/src/main.ts::onRushBuy; gra/tools/pr141-f04-rush-activation-test.cjs. Positive raw increases the integer rush price and is harmful; all 15 current raw source cells are zero. Bounded owner-route evidence only; no browser or full-runtime claim.',
};

const REAL_GAMEPLAY = new Set([
  'lud_wzrost_proc',
  'lud_spadek_proc',
  'lud_zdrowie_proc',
  'lud_zadowolenie_bazowe',
  'lud_limit_populacji',
  'meta_mnoznik_waluta',
  'walka_atak_morska',
  'walka_atak_kawaleria',
  'walka_atak_rydwany',
  'walka_atak_obleczenie',
  'walka_obrona_morska',
  'walka_atak_piechota_teren_plytkie_morze',
  'walka_obrona_piechota_teren_plytkie_morze',
  'walka_dystans_rydwany',
  'walka_obrona_piechota_teren_las',
  'walka_uderzenie_piechota',
  'walka_uderzenie_kawaleria',
  'walka_atak_piechota_teren_las',
  'walka_obrona_piechota_terytorium_wlasne',
  'walka_obrona_piechota_w_murze',
  'walka_atak_piechota_runda_szarzy',
  'mp_regen_proc',
  'mp_max_proc',
  'mp_koszt_jednostki_proc',
  'dip_handlowosc_archetyp',
  'ai_agresywnosc',
  'ai_ekspansywnosc',
  'ai_priorytet_militarny',
  'ai_priorytet_ekonomia',
  'ai_priorytet_nauka',
  'ai_tolerancja_ryzyka',
  'ai_sklonnosc_podboju',
  'ai_profil_obronna',
  'walka_ruch_bitwa_proc',
  'walka_ruch_rydwany',
  'walka_ruch_piechota_teren_plytkie_morze',
  'walka_koszt_rekrutacji_proc',
  'walka_atak_piechota',
  'walka_obrona_piechota',
  'walka_pancerz_piechota',
  'walka_dystans_lukownicy',
  'walka_hp_piechota',
  'walka_hp_rydwany',
  'dip_nastawienie_bazowe',
  'dip_agresja_archetyp',
  'eko_praca_proc',
  'prod_koszt_budynku_proc',
  'prod_koszt_jednostki_proc',
  'wealth_cap_proc',
  'kultura_naplyw_proc',
  'porzadek_produkcja_proc',
  'porzadek_nauka_proc',
  'porzadek_kultura_proc',
  'porzadek_wzrost_proc',
  'wealth_mnoznik_proc',
  'religia_spread_proc',
  'porzadek_pieniadz_proc',
  'eko_handel_brutto_proc',
  'eko_pieniadz_proc',
  'eko_pieniadz_port_proc',
  'eko_zywnosc_proc',
  'eko_nauka_proc',
  'eko_kultura_proc',
  'eko_luksus_proc',
  'eko_zadowolenie_proc',
  'eko_korupcja_proc',
  'prod_szybkosc_budynku_proc',
  'prod_szybkosc_jednostki_proc',
  'prod_rush_koszt_proc',
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

// Prior DIP holds are resolved by bounded activation records; no other ID is promoted.
const DECISION_REQUIRED = new Set<string>();

const HARMFUL = new Set([
  'eko_korupcja_proc',
  'prod_rush_koszt_proc',
  'lud_spadek_proc',
  'mp_koszt_jednostki_proc',
]);

// All previously blocked movement/G11 fields now have bounded accepted consumer
// evidence; this metadata change does not alter runtime paths or balance values.
const BLOCKED_COMBAT_MULTIPLIER = new Set<string>();

// Same round: 19 combat/siege/fortification parameters where all 15 civilization
// cells equal the declared default (no differentiated signal in the matrix data
// itself). Closed dead for this scope — matches the DEAD_UNWIRED convention
// already established for non-combat domains; do not add a zero adapter.
const DEAD_UNWIRED_COMBAT = new Set([
  'walka_atak_lukownicy',
  'walka_atak_wszystkie',
  'walka_obrona_lukownicy',
  'walka_obrona_kawaleria',
  'walka_obrona_rydwany',
  'walka_obrona_obleczenie',
  'walka_pancerz_lukownicy',
  'walka_pancerz_kawaleria',
  'walka_pancerz_rydwany',
  'walka_uderzenie_rydwany',
  'walka_hp_kawaleria',
  'walka_zasieg_proc',
  'walka_oblezenie_proc',
  'walka_atak_piechota_terytorium_wlasne',
  'walka_atak_piechota_w_murze',
  'walka_obrona_piechota_runda_szarzy',
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
  if (BLOCKED_COMBAT_MULTIPLIER.has(parameterId)) return 'BLOCKED';
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
  civilizationId?: string,
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
      if (parameterId === 'walka_ruch_bitwa_proc' && civilizationId === 'egipt') {
        return 'Wyłączone dla Egiptu zgodnie z decyzją właściciela 1B: pole ogólnego ruchu w bitwie jest zastąpione przez specyficzne pole ruchu rydwanów. Konsument ID pozostaje aktywny dla innych nacji; wartość komórki Egiptu nie jest stosowana.';
      }
      if (BLOCKED_COMBAT_MULTIPLIER.has(parameterId)) {
        return `Zablokowane do decyzji właściciela (runda 2, R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922): ${parameterId} opisuje ten sam efekt walki, który już dziś dostarcza niezależny kanał civs.json→bonusy[]→civ-bonuses.ts; bez decyzji o precedencji (zastąp / sumuj / ignoruj macierz) podłączenie civ-matrix.json ryzykuje ciche podwojenie lub konflikt bonusu. Patrz 02-decision-packet-combat.md.`;
      }
      return 'Pole zablokowane do decyzji; nie ma efektywnego wpływu.';
    case 'DECISION_REQUIRED':
      if (parameterId === 'dip_nastawienie_bazowe') {
        return 'Runda 2: potwierdzono ponownie brak żywego konsumenta — pomocnik nastawienieBazoweZaufanieDelta jest wołany wyłącznie z czystego initialRelation, a initialRelation nie ma żadnego wywołania runtime w main.ts/cluster-start.ts (żywy start klastra używa startRelationForPair, który tego pola nie czyta). Decyzja właściciela (aktor, warunek, precedencja) wymagana przed jakimkolwiek wiringiem — patrz pakiet A/B/C.';
      }
      if (parameterId === 'dip_agresja_archetyp') {
        return 'Runda 2: potwierdzono ponownie brak jakiegokolwiek wywołania runtime dla dip_agresja_archetyp w gra/src poza samym klasyfikatorem/danymi macierzy; istniejący konsument agresji (resolveArchetypeAggression) czyta wyłącznie ai_agresywnosc. Decyzja właściciela (aktor, warunek, relacja wobec ai_agresywnosc) wymagana przed jakimkolwiek wiringiem — patrz pakiet A/B/C.';
      }
      return 'Pole wymaga decyzji właściciela przed wiringiem; brak jednoznacznego kontraktu aktora, warunku, formuły i precedencji.';
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
  if (
    parameterId === 'lud_spadek_proc'
    || parameterId === 'lud_zdrowie_proc'
    || parameterId === 'lud_zadowolenie_bazowe'
  ) {
    return 'Normal ×1.00; Easy i Hard nie wzmacniają ani nie osłabiają wartości macierzy — istniejąca logika trudności pozostaje bez zmian.';
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
  const egyptGeneralMovementExcluded = input.parameterId === 'walka_ruch_bitwa_proc'
    && input.civilizationId === 'egipt' && !blocked;
  // Decision 1B is a cell-level policy invariant: a caller-supplied REAL_GAMEPLAY
  // status cannot make Egypt's superseded general field appear active.
  const effectiveStatus = blocked || egyptGeneralMovementExcluded ? 'BLOCKED' : status;
  const blockedReason = !def
    ? `Nieznany parametr ${input.parameterId}; brak cichego fallbacku.`
    : !validNumbers
      ? `Brak wartości dla ${input.civilizationId}/${input.parameterId}; brak cichego fallbacku do Grecji.`
      : statusReason(effectiveStatus, input.parameterId, polarity, input.civilizationId);
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
    statusReasonPl: blocked ? blockedReason : statusReason(effectiveStatus, input.parameterId, polarity, input.civilizationId),
    explanationPl: blocked || egyptGeneralMovementExcluded
      ? blockedReason
      : consumerExplanation(input.parameterId, effectiveStatus),
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
