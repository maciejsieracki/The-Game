# P6-DYPLOMACJA-MULTIWAR — tabela symboli (runda 3)

Pin webu: `origin/main` = `a61337844` (`git archive a61337844 gra/src gra/data`).
Baza Rust: `rust-port/parity-v2` = `c86c686bb`.
Status: ZROBIONE = port + wektory z uruchomionego weba + testy; NOWE = dopisany w tej rundzie bez webowego odpowiednika;
DO ZROBIENIA = w zakresie tematu, nie zrobione w rundzie 2; POZA ZAKRESEM = wg dispatchu (`forced-war-*` = temat #5 kolejki).

## Web -> Rust

| Symbol (web) | Plik:linia (web, pin a61337844) | Rust | Status |
|---|---|---|---|
| `WAR_RULES_PARAMS` (enabledForcedWarEras, maxEraForcedWarsPerEra, maxEraForcedWarsPerCivPerEra) | `war-rules-multiwar.ts:32` + `data/war-rules-params.json` | `diplomacy_multiwar.rs::ERA_WAR_PARAMS`, `ENABLED_FORCED_WAR_ERAS` (literal, bez pliku JSON w `data/`) | ZROBIONE |
| `forcedEraTagFromPowod` | `war-rules-multiwar.ts:139` | `diplomacy_multiwar::forced_era_tag_from_powod` | ZROBIONE |
| `isForcedEraWarEnabled` | `war-rules-multiwar.ts:168` | `diplomacy_multiwar::is_forced_era_war_enabled` | ZROBIONE |
| `canDeclareEraForcedWar` | `war-rules-multiwar.ts:154` | `diplomacy_multiwar::can_declare_era_forced_war` (licznik podany jawnie) | ZROBIONE |
| `eraWarCivKey` / `eraWarCountFor` | `war-rules-multiwar.ts:180` / `:185` | `diplomacy_multiwar::era_war_civ_key` / `era_war_count_for` | ZROBIONE |
| `canCivJoinEraForcedWar` | `war-rules-multiwar.ts:197` | `diplomacy_multiwar::can_civ_join_era_forced_war` | ZROBIONE |
| `evaluateEraForcedWarGate` (werdykt: ok / era-disabled / era-cap / civ-cap-attacker / civ-cap-target) | `war-rules-multiwar.ts:266` | `diplomacy_multiwar::evaluate_era_forced_war_gate` + `EraWarGateVerdict` | ZROBIONE |
| `playerEpochWarEnabled` = `params.playerEpochWarEnabled ?? true` | `main.ts:43049` (flaga `isWarEpochPlayerFirstEnabled` = `war-rules-multiwar.ts:72`, stała ON) | `diplomacy_multiwar::player_epoch_war_enabled(Option<bool>)` | ZROBIONE (flaga ON jako stała) |
| `recordEraForcedWarParticipation` | `war-rules-multiwar.ts:208` | — | DO ZROBIENIA (zapis licznika; wymaga stanu sesji) |
| `rebuildEraWarCountsFromActivePairs` / `restoreEraWarCounts` | `war-rules-multiwar.ts:225` / `:243` | — | DO ZROBIENIA (odczyt zapisu bez pola) |
| `evaluateInterCivWarGate` (R1 tura 40, R2 limit Kamienia) + `isInterCivWarOpenAtTurn` (:82) + `concurrentWarLimitForEra` (:90) | `war-rules-multiwar.ts:82-130` | `diplomacy_multiwar_gate::evaluate_inter_civ_war_gate`, `is_inter_civ_war_open_at_turn`, `concurrent_war_limit_for_era` | ZROBIONE (r4; wektory `intercivgate.json`, test `p6_dyplo_multiwar_interciv`) |
| `pickPlayerReferenceCity` | `war-rules-multiwar.ts:292` | `diplomacy_multiwar_gate::pick_player_reference_city` | ZROBIONE (r4; wektory `intercivgate.json`) |
| `pickEngagementArmy` / `allocateGroupsToEnemies` | `war-rules-multiwar.ts:312` / `:351` | `war_rules_multiwar.rs` (REPIN-WOJNA-NOWE-D, już na parity-v2) | ZROBIONE wcześniej; DO REPIN wobec nowego pinu (nie zrobione) |
| `warWearinessLevel` | `war-weariness.ts:59` | `diplomacy_multiwar::war_weariness_level` (`Option` = `undefined`) | ZROBIONE |
| `wearinessPeacePriceFactor` | `war-weariness.ts:68` | `diplomacy_multiwar::weariness_peace_price_factor` | ZROBIONE |
| `isWarWeary` | `war-weariness.ts:74` | `diplomacy_multiwar::is_war_weary` | ZROBIONE |
| `loserDespair` | `war-weariness.ts:87` | `diplomacy_multiwar::loser_despair` | ZROBIONE |
| `despairStage` | `war-weariness.ts:96` | `diplomacy_multiwar::despair_stage` | ZROBIONE |
| `stageCityLimit` | `war-weariness.ts:103` | `diplomacy_multiwar::stage_city_limit` | ZROBIONE |
| `offerMultiplier` | `war-weariness.ts:110` | `diplomacy_multiwar::offer_multiplier` | ZROBIONE |
| `WAR_WEARINESS_PARAMS` (zmeczenie / przegrywajacy / czlowiek.rabatCenyPokojuMax) | `war-weariness.ts:46` + `data/war-weariness-params.json` | `diplomacy_multiwar::WAR_WEARINESS_PARAMS` (literal) | ZROBIONE (podzbiór pól używanych przez funkcje czyste) |
| `planEscalatedPeacePayment` | `war-weariness.ts:121` | `diplomacy_multiwar_peace::plan_escalated_peace_payment` | ZROBIONE (r3; wektory `peace.json`) |
| `stepPairState` | `war-weariness.ts:163` | `diplomacy_multiwar_peace::step_pair_state` | ZROBIONE (r3; wektory sekwencji) |
| `runWarWearinessTick` | `war-weariness.ts:216` | — | DO ZROBIENIA (r4; tick AI↔AI) |
| `planPeacePayment` | `diplomacy-ai-forced-peace.ts:127` | `diplomacy_multiwar_peace::plan_peace_payment` | ZROBIONE (r3; wektory `peace.json`; mutant ceil->floor zabity) |
| `diplomacy-ai-forced-peace.ts` (reszta: `registerAiPeaceRequest`, `isForcedPeaceDue`, `decideAiPeaceRequest`, `runAiAiPeaceTick`, …) | `:17`–`:275` | — | DO ZROBIENIA |
| `napRelacjaProgEfektywny` | `diplomacy-proposals.ts:544` | `diplomacy_nap_trust::nap_relacja_prog_efektywny` | ZROBIONE |
| `NAP_GRANICA_RELACJA_NARZUT` (= `SWEETENER_EASE_MAX_POINTS` = 20) | `diplomacy-proposals.ts:533`, `:521` | `diplomacy_nap_trust::NAP_GRANICA_RELACJA_NARZUT` | ZROBIONE |
| `deltaRelacjiSojusz(true)` = 15 | `diplomacy.ts:1885` + `data/diplomacy-aggressor-params.json` (`wplywNaAI.relacjaDeltaSojusz`) | `diplomacy_nap_trust::NAP_DELTA_AGRESOR` (literal 15; istniejący `diplomacy_aggressor::delta_relacji_sojusz` wymaga załadowanego paramsa) | ZROBIONE |
| `NAP_ZAUFANIE_FALLBACK` = 30 | `diplomacy-locks.ts:50` | `diplomacy_nap_trust::NAP_ZAUFANIE_FALLBACK` | ZROBIONE |
| `dualGate` / `zaufanieGate` / `relacjaGate` / `fmtProg` | `diplomacy-locks.ts:187` / `:156` / `:174` / `:146` | `diplomacy_nap_trust::dual_gate` (prywatna), `fmt_prog` | ZROBIONE (tylko ścieżka pakt) |
| `resolveDiplomacyActionLock`, case '2' (pakt) | `diplomacy-locks.ts:220`, `:222-242` | `diplomacy_nap_trust::resolve_nap_lock` | ZROBIONE (tylko case '2'; reszta case'ów = inne tematy) |
| `resolveDiplomacyActionLock`, pozostałe case'y | `diplomacy-locks.ts:244`+ | — | POZA ZAKRESEM (nie w dispatchu r2; do rozpisania) |
| `diplomacy-siege-war-gate.ts` (`siegeAllowedBetween`, `enemyUnitsAdjacentToCity`, `detectWarAutoSiegeOnCity`, `isSiegeStillValid`, `aiAutoSiegeAllowed`, `autoSiegeCandidateForScan`) | `:21`–`:98` | — | DO ZROBIENIA (brak w rundzie 2) |
| `isNapBlockingWarDeclaration` | `diplomacy-war-gates.ts:19` | `diplomacy_war_gates::is_nap_blocking_war_declaration` | ZROBIONE wcześniej (bez zmian) |
| `alliance-war-obligation.ts` (`trustToRequestingAlly`) | `:25`, `:51` | `alliance_war_obligation.rs` | ZROBIONE wcześniej; DO REPIN wobec nowego pinu (nie zrobione) |
| `forced-war-*` (temat #5 kolejki) | — | — | POZA ZAKRESEM |

## Zasady portu

- Parametry: literały w kodzie Rust, kopie JSON tylko jako wektory w `tests/p6_dyplo_multiwar_gates_data/` (nowe pliki w `rust-port/engine/data/` łamią `tests/data_compliance.rs:384` i `tests/data_loader.rs:88`).
- JS-semantyka: `Math.max/min/clamp` propagują NaN i rozróżniają -0 (`js_max`, `js_min`, `js_clamp` w `diplomacy_multiwar.rs`).
- Symbole zależne od stanu sesji przyjmują wejścia jawnie: `evaluate_era_forced_war_gate` (liczniki `counts`, `declared_for_tag`, `multiwar_enabled`), `resolve_nap_lock` (`NapLockCtx`), `player_epoch_war_enabled(Option<bool>)`.
- Odstępstwa od weba (do akceptacji właściciela): brak; wszystkie stałe przeniesione 1:1 z pinu.

## Wektory i testy

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1/gen-multiwar-vectors.cjs` (typescript.transpileModule + prawdziwe pliki weba z `git archive a61337844`; stuby `diplomacy` i `diplomacy-ai-forced-peace` tylko dla importów nietestowanych funkcji; `diplomacy-proposals` = wycinek 1:1 linii 521, 533, 544-553).
- Wektory: `weariness.json` (64), `era.json` (63), `nap.json` (64) — N-1/N/N+1 dla progów Zaufania 29/30/31 i Relacji 49/50/51 (+narzut 20), NaN, `undefined`, brak `progNapZaufanie` (fallback 30).
- Test: `rust-port/engine/tests/p6_dyplo_multiwar_gates.rs` (9 testów).
- Mutacje ręczne (5 mutantów, każdy zabity): narzut granicy 20->19; fallback Zaufania 30->29; `stage == 2` -> `stage == 3`; próg udziału `>` -> `>=` w `loserDespair`. Pełnego narzędzia mutacyjnego nie uruchomiono.

## Zakres niewykonany po rundzie 3 (do r4)

Wszystkie pozycje oznaczone DO ZROBIENIA powyżej: `planPeacePayment` + `diplomacy-ai-forced-peace` (w tym `planEscalatedPeacePayment`, `runWarWearinessTick`), `diplomacy-siege-war-gate`, `recordEraForcedWarParticipation`/`rebuildEraWarCountsFromActivePairs`/`restoreEraWarCounts` (zapis: pole licznika poza allowlistą — dług na temat #8), `evaluateInterCivWarGate`, `pickPlayerReferenceCity`, REPIN `war_rules_multiwar.rs`, `diplomacy_war_gates.rs`, `alliance_war_obligation.rs`, `diplomacy_tick_war_brake.rs`, `diplomacy_war_peace_profile.rs` wobec pinu `a61337844`.
