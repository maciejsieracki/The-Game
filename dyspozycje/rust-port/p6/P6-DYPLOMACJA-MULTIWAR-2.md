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

## NIE zrobione (kolejne partie, NIE_ZMIERZONO)

- (B) `runWarWearinessTick` + reszta `war-weariness.ts` / `war-weariness-params.json`.
- (C) forced-peace AI↔AI: `registerAiPeaceRequest`, `isForcedPeaceDue`, `decideAiPeaceRequest`, `runAiAiPeaceTick` (`diplomacy-ai-forced-peace.ts`, `tury_do_pokoju_po_prosbie`).
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
