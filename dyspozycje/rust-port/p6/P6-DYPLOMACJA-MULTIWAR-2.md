# P6-DYPLOMACJA-MULTIWAR-2 — tabela symboli (runda 1, partia A)

Pin webu: `origin/main` 5dd53e60f (zawiera FALA 546–547). Baza Rust: `origin/rust-port/parity-v2` 9e6d26c4b.
Run: `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1/`.

## Zrobione (partia A, commit be9927351)

| Symbol web (`gra/src/game/war-rules-multiwar.ts`) | Symbol Rust | Plik Rust | Wektory / testy |
|---|---|---|---|
| `isEraForcedWarIgnoringR1` | `is_era_forced_war_ignoring_r1` | `domain/diplomacy_multiwar_gate.rs` | `eraign.json` (5), `p6_dyplo_multiwar2_eraign.rs` |
| `evaluateInterCivWarGate` (pole `eraTag`) | `evaluate_inter_civ_war_gate` + `InterCivWarGateInput.era_tag` | `domain/diplomacy_multiwar_gate.rs` | `eraign.json` (160), `intercivgate.json` (23, bez zmian) |
| `isWarTreatyBlocked` (ERAIGN) | `is_war_treaty_blocked` | `domain/diplomacy_multiwar_gate.rs` | `eraign.json` (16) |
| `WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra` bronze/iron = 20 | `ERA_FORCED_WAR_START_TURNS_BRONZE/IRON` | `domain/diplomacy_multiwar_gate.rs` | `eraign.json` (2) |

Generator wektorów: `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1/gen-eraign-vectors.mts`
(Node 22.22, `--experimental-strip-types`; jedyny patch: import JSON zamieniony na `readFileSync`, `patch-import.mjs`).

Bramki partii A: `cargo fmt --check` OK; `cargo clippy --all-targets -- -D warnings` OK;
`cargo test --lib` 22/22; `p6_dyplo_multiwar2_eraign` 3/3; `p6_dyplo_multiwar_interciv` 2/2.

## Zrobione (partia B, runda 3)

Baza: `origin/rust-port/parity-v2` 707b50c41 (partia A zintegrowana). Pin webu bez zmian (5dd53e60f;
`war-weariness.ts` i `war-weariness-params.json` nie zmieniły się od a61337844).

| Symbol web (`gra/src/game/war-weariness.ts`) | Symbol Rust | Plik Rust | Wektory / testy |
|---|---|---|---|
| `runWarWearinessTick` (:~280) | `run_war_weariness_tick` + `WearinessTickEnv` | `domain/diplomacy_war_weariness_tick.rs` | `tests/p6_dyplo_multiwar2_tick_data/tick.json` (16 scenariuszy, 23 tury), `p6_dyplo_multiwar2_tick.rs` (5 testów) |
| parametry `przegrywajacy` / `zmeczenie.progWzajemnyPokoj` (ofertaOdTurWojny, cooldown, ochrona, karencje, …) | `OFFER_PARAMS` (literały) | `domain/diplomacy_war_weariness_tick.rs` | jak wyżej |
| `warWearinessLevel`, `loserDespair`, `despairStage`, `stageCityLimit`, `offerMultiplier`, `planEscalatedPeacePayment`, `stepPairState` | już zrobione w rundzie 2 / a61337844 | `diplomacy_multiwar.rs`, `diplomacy_multiwar_peace.rs` | `weariness.json`, `p6_dyplo_multiwar_gates`, `p6_dyplo_multiwar_peace` (zielone, nie zmieniane) |

Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1/gen-weariness-tick.mts`
(Node 22.22, `--experimental-strip-types`; loader `hooks.mjs`/`reg.mjs` dorzuca `.ts` do importów bez rozszerzenia
i czyta `*.json` jako moduł — źródła weba bez zmian; wypakowanie `git archive origin/main gra/src gra/data` poza repo).

Założenia partii B:
- `price(winner, loser).balanceFor` (closure w TS) modelowane liniowo: `balance0 + slope * covered` (`PeacePriceQuote`); logika ticka nie zależy od postaci wyceny.
- `d.log` porównywany jako liczba wywołań (tekst z `toFixed` pominięty).
- `cityCountOf(loser)` dla brakującego klucza = 0 w teście (w TS `undefined`); wartość używana dopiero po wczesnych wyjściach, więc neutralna.
- Wyjście awaryjne (`exhausted`) i `mustAccept` liczone jak w TS; `zwyciezcaMusiPrzyjac` = true.

Mutanty ręczne (tick): M1 cooldown `<=` zabity; M2 brak `mustAccept` zabity; M3 brak wyczerpania zabity;
M4 brak członu tolerancji zmęczenia zabity (test granicy); M5 bitwa w toku ignorowana zabity; M6 oferta od tury N+1 zabity;
M7 `>` zamiast `>=` przy bilansie zabity (test granicy). 7/7 zabitych. Pełny mutation score ≥85% — NIE_ZMIERZONO.

## Zrobione (partia C, runda 4)

Baza: `origin/rust-port/parity-v2` 707b50c41 + partia B (44c80e96f / 9b8f68c88). Pin webu bez zmian (5dd53e60f).

| Symbol web (`gra/src/game/diplomacy-ai-forced-peace.ts`) | Symbol Rust | Plik Rust | Wektory / testy |
|---|---|---|---|
| `AI_PEACE_TURNS_AFTER_REQUEST` / `aiPeaceTurnsAfterRequest` (`tury_do_pokoju_po_prosbie` = 2) | `AI_PEACE_TURNS_AFTER_REQUEST` (literal 2.0) | `domain/diplomacy_ai_forced_peace.rs` | `unit.due` (limit domyślny, jawny, NaN) |
| `registerAiPeaceRequest` (Map, brak nadpisania) | `register_ai_peace_request` + `AiPeaceRequestStore` (kolejność wstawiania jak Map) | `domain/diplomacy_ai_forced_peace.rs` | `unit.register` |
| `turnsSincePeaceRequest`, `isForcedPeaceDue` | `turns_since_peace_request`, `is_forced_peace_due(_default)` | `domain/diplomacy_ai_forced_peace.rs` | `unit.turns`, `unit.due` |
| `isForcedPeaceEligiblePair` | `is_forced_peace_eligible_pair` | `domain/diplomacy_ai_forced_peace.rs` | `unit.eligible` (6 kombinacji) |
| `requesterShare`, `isClearlyLosing`, `isStillLosing` (0.45 / 0.5) | `requester_share`, `is_clearly_losing`, `is_still_losing` | `domain/diplomacy_ai_forced_peace.rs` | `unit.share` (granice 0.45/0.5, 0/0, NaN) |
| `decideAiPeaceRequest` (Math.round, tolerancja, bramka) | `decide_ai_peace_request` + `AiPeaceDecision` | `domain/diplomacy_ai_forced_peace.rs` | `unit.decide` (8 przypadków) |
| `planPeacePayment` | `plan_peace_payment` (już był; nie kopiowany) | `domain/diplomacy_multiwar_peace.rs` | `p6_dyplo_multiwar_peace` (3/3, bez zmian) |
| `runAiAiPeaceTick` (dropy, guard 8, battlePending, pay/finalize/log) | `run_ai_ai_peace_tick` + `AiPeaceTickEnv` | `domain/diplomacy_ai_forced_peace.rs` | `ticks` (15 scenariuszy, 22 tury), log tekstowo |

Wektory: `tests/p6_dyplo_multiwar2_peace_ai_data/peace_ai.json` (pin 5dd53e60f), test `tests/p6_dyplo_multiwar2_peace_ai.rs` (8 testów).
Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1/gen-forced-peace.mts`
(Node 22.22, `--experimental-strip-types --import reg.mjs`; loader `hooks.mjs`/`reg.mjs` w tym samym katalogu).

Założenia partii C:
- `price(winner, loser, kind).balanceFor` (closure w TS) modelowane jako `PeaceBalanceShape` (`Linear` | `Kinked`, dwie postacie);
  logika ticka działa na dowolnej postaci, ale rzeczywista wycena z `ai.ts` (`peaceOfferAiOwnBilans`) NIE jest portowana.
- Log `d.log` odtwarzany tekstowo (`js_num` = `String(number)`); porównywany 1:1 w wektorach.
- `kind` w prośbie zawsze ustawiony (web: brak pola = 'pokoj'; w Rust rejestracja domyślnie `Pokoj`).

Bramki partii C: `cargo fmt --check` OK; `cargo clippy --lib --test p6_dyplo_multiwar2_peace_ai -- -D warnings` OK
(pełne `--all-targets` NIE_ZMIERZONO: dysk); `--lib` 22/22; `p6_dyplo_multiwar2_tick` 5/5; `p6_dyplo_multiwar2_peace_ai` 8/8;
`p6_dyplo_multiwar_peace` 3/3; `p6_dyplo_multiwar2_eraign` 3/3.
Mutanty ręczne (`diplomacy_ai_forced_peace.rs`, 11 sztuk): M1 `>` zamiast `>=` przy limicie; M2 brak filtra udziału;
M3 brak blokady miast przy bitwie; M4 brak sprawdzenia cesji; M5 brak `Math.round`; M6 bramka ignorowana; M7 tolerancja ostra;
M8 rejestracja nadpisuje; M9 brak wykluczenia eliminacji; M10 próg 0.5 ostry; M11 `sum >= 0`. Zabite 11/11.
Pełny mutation score ≥85% — NIE_ZMIERZONO (11 ręcznych mutantów, bez dowodu równoważności reszty).

## Odstępstwa świadome (log tekstowy partii B)

- Partia B (`run_war_weariness_tick`) porównuje `d.log` tylko jako liczbę wywołań. Tekst TS zawiera sufiksy
  (`, ochrona przegrywającego`, `, wyczerpanie`, `oferta #N`, `toFixed(2)`, histogram) — NIE odtworzone. Świadome odstępstwo
  diagnostyczne (warstwa logu, nie stan gry); do ewentualnego domknięcia osobnym tematem.

## NIE zrobione (kolejne partie, NIE_ZMIERZONO)

- (G) timer ERADELAY / `forced_war_bronze|iron|stone` + podpięcie `is_war_treaty_blocked` — osobny moduł, wycena LOC NIE wykonana.
- (D) `diplomacy-siege-war-gate.ts`.
- (E) case'y locks poza '2' (`diplomacy-locks.ts:244+`).
- (F) REPIN modułów `diplomacy_war_gates`, `war_rules_multiwar`, `alliance_war_obligation`, `diplomacy_tick_war_brake`, `diplomacy_war_peace_profile` wobec origin/main (diff nie zmierzony w tej rundzie).
- Egzekwowanie ERADELAY po stronie timera wojny epoki (`forced-war-bronze.ts` / `forced-war-iron.ts`: start po 20 turach od wejścia w epokę) — w Rust brak modułu `forced_war_*`; tu portowane są tylko stałe i bramka R1.
- Wiązanie `isWarTreatyBlocked` z wywołaniem wypowiedzenia wojny (main.ts) — brak w Rust.
- Mutacje ≥85% — NIE_ZMIERZONO.
- Pełny `cargo test` (391 plików testowych) — NIE_ZMIERZONO w tej partii; zmieniona sygnatura `InterCivWarGateInput` używana tylko przez `p6_dyplo_multiwar_interciv.rs`.
- `save_load.rs` nietknięty (dług #8 poza zakresem).

## Założenia

- Wartości progów jako literały (zgodnie z dotychczasową praktyką: `data/` nie zmieniane, bo liczą testy data_compliance).
- `eraTag` = `Option<ForcedEraTag>`; `undefined`/`null` ⇒ `None` (zwykłe wypowiedzenie, R1 obowiązuje).
- Porównanie NaN tury: jak w webie (`!(NaN >= 40)` = true; wojna Brazu/Żelaza i tak omija R1).
