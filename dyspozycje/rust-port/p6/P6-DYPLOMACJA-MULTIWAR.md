# P6-DYPLOMACJA-MULTIWAR — tabela symboli (runda 5, domknięcie zakresu R1–R4)

Pin webu: `origin/main` = `a61337844` (`git archive a61337844 gra/src gra/data`).
Baza Rust: `rust-port/parity-v2` = `3a40d458e` (gałąź wf zawiera ją jako przodka; rebase w r5 bez konfliktów).
Ten temat (ID `R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1`) obejmuje WYŁĄCZNIE symbole ze statusem
„ZROBIONE” poniżej. Symbole „PRZENIESIONE → MULTIWAR-2” zostały wydzielone decyzją orkiestratora (dispatch r5).

Legenda kolumny „zrobione / przeniesione do MULTIWAR-2”:
- `ZROBIONE (rN)` = port 1:1 + wektory z uruchomionego weba + testy (runda N, ostatnio zmieniona w r5 gdzie wskazano),
- `ZROBIONE wcześniej` = poza tym tematem, bez zmian w r5,
- `PRZENIESIONE → MULTIWAR-2` = nowy temat `R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1` (założony przez orkiestratora),
- `DŁUG → #8` = zapis liczników wojen epoki (pole zapisu, `save_load.rs` poza allowlistą tego tematu),
- `POZA ZAKRESEM` = wg dispatchu (`forced-war-*` = temat #5 kolejki).

## Web -> Rust

| Symbol (web) | Plik:linia (web, pin a61337844) | Rust | zrobione / przeniesione do MULTIWAR-2 |
|---|---|---|---|
| `WAR_RULES_PARAMS` (enabledForcedWarEras, maxEraForcedWarsPerEra, maxEraForcedWarsPerCivPerEra) | `war-rules-multiwar.ts:32` + `data/war-rules-params.json` | `diplomacy_multiwar.rs::ERA_WAR_PARAMS`, `ENABLED_FORCED_WAR_ERAS` (literal) | ZROBIONE (r2; r5: asercja pełnej listy Kamień/Brąz/Żelazo) |
| `forcedEraTagFromPowod` | `war-rules-multiwar.ts:139` | `diplomacy_multiwar::forced_era_tag_from_powod` | ZROBIONE (r2) |
| `isForcedEraWarEnabled` | `war-rules-multiwar.ts:168` | `diplomacy_multiwar::is_forced_era_war_enabled` | ZROBIONE (r2) |
| `canDeclareEraForcedWar` | `war-rules-multiwar.ts:154` | `diplomacy_multiwar::can_declare_era_forced_war` (licznik jawnie) | ZROBIONE (r2) |
| `eraWarCivKey` / `eraWarCountFor` | `war-rules-multiwar.ts:180` / `:185` | `diplomacy_multiwar::era_war_civ_key` / `era_war_count_for` | ZROBIONE (r2) |
| `canCivJoinEraForcedWar` | `war-rules-multiwar.ts:197` | `diplomacy_multiwar::can_civ_join_era_forced_war` | ZROBIONE (r2) |
| `evaluateEraForcedWarGate` (ok / era-disabled / era-cap / civ-cap-attacker / civ-cap-target) | `war-rules-multiwar.ts:266` | `diplomacy_multiwar::evaluate_era_forced_war_gate` + `EraWarGateVerdict` | ZROBIONE (r2) |
| `playerEpochWarEnabled` = `params.playerEpochWarEnabled ?? true` | `main.ts:43049` (flaga `war-rules-multiwar.ts:72`, stała ON) | `diplomacy_multiwar::player_epoch_war_enabled(Option<bool>)` | ZROBIONE (r2) |
| `recordEraForcedWarParticipation` | `war-rules-multiwar.ts:208` | — | DŁUG → #8 (zapis licznika; wymaga pola zapisu) |
| `rebuildEraWarCountsFromActivePairs` / `restoreEraWarCounts` | `war-rules-multiwar.ts:225` / `:243` | — | DŁUG → #8 (odczyt zapisu bez pola) |
| `evaluateInterCivWarGate` (R1 tura 40, R2 limit Kamienia) + `isInterCivWarOpenAtTurn` (:82) + `concurrentWarLimitForEra` (:90) | `war-rules-multiwar.ts:82-130` | `diplomacy_multiwar_gate::evaluate_inter_civ_war_gate`, `is_inter_civ_war_open_at_turn`, `concurrent_war_limit_for_era` | ZROBIONE (r4; test `p6_dyplo_multiwar_interciv`, wektory `intercivgate.json`) |
| `pickPlayerReferenceCity` | `war-rules-multiwar.ts:292` | `diplomacy_multiwar_gate::pick_player_reference_city` | ZROBIONE (r4; wektory `intercivgate.json`) |
| `pickEngagementArmy` / `allocateGroupsToEnemies` | `war-rules-multiwar.ts:312` / `:351` | `war_rules_multiwar.rs` (REPIN-WOJNA-NOWE-D) | PRZENIESIONE → MULTIWAR-2 (REPIN wobec pinu `a61337844`) |
| `warWearinessLevel` | `war-weariness.ts:59` | `diplomacy_multiwar::war_weariness_level` (`Option` = `undefined`) | ZROBIONE (r2; r5: wektory ujemnych tur/strat) |
| `wearinessPeacePriceFactor` | `war-weariness.ts:68` | `diplomacy_multiwar::weariness_peace_price_factor` | ZROBIONE (r2) |
| `isWarWeary` | `war-weariness.ts:74` | `diplomacy_multiwar::is_war_weary` | ZROBIONE (r2) |
| `loserDespair` | `war-weariness.ts:87` | `diplomacy_multiwar::loser_despair` | ZROBIONE (r2) |
| `despairStage` | `war-weariness.ts:96` | `diplomacy_multiwar::despair_stage` | ZROBIONE (r2) |
| `stageCityLimit` | `war-weariness.ts:103` | `diplomacy_multiwar::stage_city_limit` | ZROBIONE (r2) |
| `offerMultiplier` | `war-weariness.ts:110` | `diplomacy_multiwar::offer_multiplier` | ZROBIONE (r2) |
| `WAR_WEARINESS_PARAMS` (zmęczenie / przegrywający / czlowiek.rabatCenyPokojuMax) | `war-weariness.ts:46` + `data/war-weariness-params.json` | `diplomacy_multiwar::WAR_WEARINESS_PARAMS` (literal) | ZROBIONE (r2; podzbiór pól używanych przez funkcje czyste) |
| `planEscalatedPeacePayment` | `war-weariness.ts:121` | `diplomacy_multiwar_peace::plan_escalated_peace_payment` | ZROBIONE (r3; r5: wektory `peace.json`, remis `pn == reszta`) |
| `stepPairState` | `war-weariness.ts:163` | `diplomacy_multiwar_peace::step_pair_state` | ZROBIONE (r3; wektory sekwencji) |
| `planPeacePayment` | `diplomacy-ai-forced-peace.ts:127` | `diplomacy_multiwar_peace::plan_peace_payment` | ZROBIONE (r3; r5: wektory `goldFrac` (ceil ilości złota) i `tie`) |
| `runWarWearinessTick` | `war-weariness.ts:216` | — | PRZENIESIONE → MULTIWAR-2 (tick AI↔AI) |
| `diplomacy-ai-forced-peace.ts` (reszta: `registerAiPeaceRequest`, `isForcedPeaceDue`, `decideAiPeaceRequest`, `runAiAiPeaceTick`) | `:17`–`:275` | — | PRZENIESIONE → MULTIWAR-2 |
| `napRelacjaProgEfektywny` | `diplomacy-proposals.ts:544` | `diplomacy_nap_trust::nap_relacja_prog_efektywny` | ZROBIONE (r2) |
| `NAP_GRANICA_RELACJA_NARZUT` (= `SWEETENER_EASE_MAX_POINTS` = 20) | `diplomacy-proposals.ts:533`, `:521` | `diplomacy_nap_trust::NAP_GRANICA_RELACJA_NARZUT` | ZROBIONE (r2) |
| `deltaRelacjiSojusz(true)` = 15 | `diplomacy.ts:1885` + `data/diplomacy-aggressor-params.json` | `diplomacy_nap_trust::NAP_DELTA_AGRESOR` (literal 15) | ZROBIONE (r2) |
| `NAP_ZAUFANIE_FALLBACK` = 30 | `diplomacy-locks.ts:50` | `diplomacy_nap_trust::NAP_ZAUFANIE_FALLBACK` | ZROBIONE (r2) |
| `dualGate` / `zaufanieGate` / `relacjaGate` / `fmtProg` | `diplomacy-locks.ts:187` / `:156` / `:174` / `:146` | `diplomacy_nap_trust::dual_gate` (prywatna), `fmt_prog` | ZROBIONE (r2; r5: `fmt_prog` = JS `toFixed(1)` z remisem w górę, wektory i test `fmt_prog_matches_js_to_fixed_1`) |
| `resolveDiplomacyActionLock`, case '2' (pakt) | `diplomacy-locks.ts:220`, `:222-242` | `diplomacy_nap_trust::resolve_nap_lock` | ZROBIONE (r2; tylko case '2') |
| `resolveDiplomacyActionLock`, pozostałe case'y | `diplomacy-locks.ts:244`+ | — | PRZENIESIONE → MULTIWAR-2 |
| `diplomacy-siege-war-gate.ts` (`siegeAllowedBetween`, `enemyUnitsAdjacentToCity`, `detectWarAutoSiegeOnCity`, `isSiegeStillValid`, `aiAutoSiegeAllowed`, `autoSiegeCandidateForScan`) | `:21`–`:98` | — | PRZENIESIONE → MULTIWAR-2 |
| `isNapBlockingWarDeclaration` | `diplomacy-war-gates.ts:19` | `diplomacy_war_gates::is_nap_blocking_war_declaration` | ZROBIONE wcześniej (REPIN w MULTIWAR-2) |
| `alliance-war-obligation.ts` (`trustToRequestingAlly`) | `:25`, `:51` | `alliance_war_obligation.rs` | ZROBIONE wcześniej; PRZENIESIONE → MULTIWAR-2 (REPIN) |
| REPIN `diplomacy_tick_war_brake.rs`, `diplomacy_war_peace_profile.rs` | (pin a61337844) | pliki allowlisty | PRZENIESIONE → MULTIWAR-2 (REPIN) |
| `forced-war-*` (temat #5 kolejki) | — | — | POZA ZAKRESEM |

## Zasady portu

- Parametry: literały w kodzie Rust. JSON tylko jako wektory w `tests/p6_dyplo_multiwar_gates_data/` (nowe pliki w `rust-port/engine/data/` łamią `tests/data_compliance.rs:384` i `tests/data_loader.rs:88`).
- JS-semantyka: `js_max`, `js_min`, `js_clamp` propagują NaN i rozróżniają -0 (`diplomacy_multiwar.rs`). `fmt_prog` = `Number.isInteger ? String : toFixed(1)` (`diplomacy_nap_trust.rs`, `js_to_fixed_1`: remis dokładny zaokrąglany w górę, `NaN`/`Infinity` jak w JS).
- Symbole zależne od stanu sesji przyjmują wejścia jawnie: `evaluate_era_forced_war_gate` (liczniki `counts`, `declared_for_tag`, `multiwar_enabled`), `resolve_nap_lock` (`NapLockCtx`), `player_epoch_war_enabled(Option<bool>)`.
- Odstępstwa od weba (do akceptacji właściciela): brak w zakresie tematu. Znane poza domeną: `fmt_prog` dla liczb całkowitych |n| >= 2^63 (JS: notacja wykładnicza, Rust: saturacja `as i64`); progi Zaufania/Relacji nie przyjmują takich wartości (NIE_ZMIERZONO w grze).

## Wektory i testy

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1/gen-multiwar-vectors.cjs` (typescript.transpileModule + prawdziwe pliki weba z `git archive a61337844`).
- Wektory (r5, po regeneracji; dopiski addytywne, stare przypadki bit-w-bit bez zmian): `weariness.json` 66 (było 64), `era.json` 63, `nap.json` 67 (było 64; dodano progi ułamkowe 0.3/0.25/29.5), `peace.json` 528 wpisów `payment` + 3 sekwencje `stepPairState` (dodano sety `goldFrac`, `tie`).
- Testy: `p6_dyplo_multiwar_gates` 10 (r5: +`fmt_prog_matches_js_to_fixed_1`), `p6_dyplo_multiwar_interciv` 2, `p6_dyplo_multiwar_peace` 3.
- Mutacje (r5, narzędzie własne: `mut.py` w `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1/mutacje/`, wyniki `mutacje/wyniki.txt`): 105 mutantów na 4 modułach (`diplomacy_multiwar.rs`, `diplomacy_multiwar_gate.rs`, `diplomacy_multiwar_peace.rs`, `diplomacy_nap_trust.rs`). 101 zabitych, 4 ocalałych:
  - `MW01` (`js_max`: usunięty warunek `b.is_nan()`) — EKWIWALENT: gałąź `a > b` z NaN w `b` jest fałszywa, więc zwracane jest `b` = NaN, tak jak w oryginale.
  - `PC12` (`if rem >= 0.0` w gałęzi `else` planu) — EKWIWALENT: w gałęzi `else` jest `res_total < rem`, więc `rem - res_total > 0` zawsze.
  - `PC17` (`if base.full` bez `|| max_cities <= 0.0`) — EKWIWALENT: pętla `while n < max_cities` nie wykonuje się dla `max_cities <= 0` (także NaN), a wynik odtwarza `base` pole po polu.
  - `PC07` (`res_total > rem` zamiast `>=`) — EKWIWALENT dla pn całkowitych (pn w wektorach są całkowite): obie gałęzie dodają te same zasoby w tej samej kolejności, a `rem` wychodzi jako 0. Dla ułamkowych pn możliwa rozbieżność przez zaokrąglenie sumy (`rem - Σ` vs sekwencyjne odejmowanie) — NIE_ZMIERZONO, bez wektora.
- Wynik: 101/105 zabitych (96,2%); po wykluczeniu 4 ocalałych jako ekwiwalentów 101/101 nieekwiwalentnych.
