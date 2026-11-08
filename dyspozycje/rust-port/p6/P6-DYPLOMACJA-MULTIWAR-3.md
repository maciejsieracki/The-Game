# P6-DYPLOMACJA-MULTIWAR-3 — tabela symboli (runda 1, partia F)

Pin webu: `origin/main` (wypakowanie `git archive origin/main gra/src gra/data` poza repo, Node 22.22).
Baza Rust: `origin/rust-port/parity-v2` d6414fcf1.
Run: `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1/`.

## Pomiar (przed portem)

| Partia | Plik web | Rozmiar web | Stan Rust przed rundą |
|---|---|---|---|
| D `diplomacy-siege-war-gate.ts` | `gra/src/game/diplomacy-siege-war-gate.ts` | 111 linii, 6 eksportów | brak modułu; zależy od `classifyCityAttack` (`mapSiegeDetect.ts`) i typów `City`/`RuntimeUnit` — NIE_ZMIERZONO w Rust (brak portu) |
| E `diplomacy-locks.ts` case '2' i inne case'y (l.245–380) | `gra/src/game/diplomacy-locks.ts` | ok. 136 linii, 13 case'ów | brak `diplomacy_locks.rs` — NIE_ZMIERZONO |
| F `brakeWarOutcome` | `gra/src/game/diplomacy-tick-war-brake.ts` | +23 linie (l.172–194) | BRAK → PORTOWANE w tej rundzie |
| F `isWarMarchOpenForPair` | `gra/src/game/war-rules-multiwar.ts` (~l.112) | 1 funkcja | BRAK → PORTOWANE w tej rundzie |
| F `evaluateInterCivWarGate` (hunk l.~123/156) | `gra/src/game/war-rules-multiwar.ts` | — | obecne od partii A (`eraTag`); pełna zgodność semantyki NIE_ZMIERZONO ponownie |

## Zrobione (partia F, runda 1)

| Symbol web | Symbol Rust | Plik Rust | Wektory / testy |
|---|---|---|---|
| `brakeWarOutcome(a, b, isPlayer)` | `brake_war_outcome(WarPower, WarPower, impl Fn(i64)->bool) -> BrakeWarOutcome` | `src/domain/diplomacy_tick_war_brake.rs` | `tests/p6_dyplomacja_multiwar3_f_data/brake.json` (784 wiersze, NaN/±Infinity/remisy/gracz jako declarer), `tests/p6_dyplomacja_multiwar3_f.rs::brake_war_outcome_matches_web_vectors` |
| `isWarMarchOpenForPair(turn, activePairEraTag)` | `is_war_march_open_for_pair(f64, Option<ForcedEraTag>) -> bool` | `src/domain/diplomacy_multiwar_gate.rs` | `tests/p6_dyplomacja_multiwar3_f_data/march.json` (35 wierszy: tury 0/19/39/40/41/NaN/undefined × tagi), test granic N-1/N/N+1 wokół tury 40 |

Generator: `gen-f.mts` (poza repo; kopia w `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1/`), loader `hooks.mjs`/`reg.mjs` z runu MULTIWAR-2.

## Założenia

- `pickWarDeclarer` przy NaN / remisie: jak w istniejącym porcie (`pick_war_declarer`), bez zmian.
- `undefined`/`null` tagu epoki = `None`; `undefined` tury = NaN (web: `undefined >= 40` = false).
- `mayDeclare` = `!isPlayer(declarer)`; w Rust `is_player` jest zamknięciem (brak zależności od stanu gry).

## Odstępstwa świadome

- `PeaceBalanceShape::Kinked` (`src/domain/diplomacy_ai_forced_peace.rs`) NIE został usunięty: używają go wektory `p6_dyplo_multiwar2_peace_ai` (przypadek `"kinked"`) i `p6_dyplo_multiwar2_peace_helpers`. Zgodnie z dispatchem usuwany tylko gdy nic go nie używa — używa się, zostaje oznaczony `ODSTEPSTWO OD WEBU`.

## NIE zrobione w rundzie 1 (NIE_ZMIERZONO / do kolejnej rundy)

- D `diplomacy-siege-war-gate.ts` (siegeAllowedBetween, enemyUnitsAdjacentToCity, detectWarAutoSiegeOnCity, isSiegeStillValid, aiAutoSiegeAllowed, autoSiegeCandidateForScan) — wymaga portu typów `City`/`RuntimeUnit` i `classifyCityAttack`; szacunek 120–160 LOC, 1 partia.
- E `diplomacy-locks.ts` — case '2' i pozostałe; szacunek 180–260 LOC, 1 partia.
- Pełny `cargo test` (wszystkie binarki) i `clippy --all-targets` — NIE_ZMIERZONO (uruchomiono: `--lib` 22/22, `p6_dyplomacja_multiwar3_f` 3/3, `p6_repin_wojna_c_war_brake` 2/2, `p6_dyplo_multiwar_interciv` 2/2; `clippy --lib --test p6_dyplomacja_multiwar3_f -D warnings` OK).
- Mutacje dla partii F — NIE_ZMIERZONO.
