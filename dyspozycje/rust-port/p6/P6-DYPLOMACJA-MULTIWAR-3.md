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

---

# Runda 2 (ta sama baza `0672c26ff`, partie D, E, G)

Pin webu bez zmian: `origin/main` (wypakowanie `git archive origin/main gra/src gra/data` poza repo, Node 22.22).
Loader TS: `hooks2.mjs` (transpilacja `.ts` przez `typescript` z `/opt/node22/lib/node_modules`), bo `--experimental-strip-types` odrzuca `enum` w `gra/`.
Generator wektorów: `gen-de.mts` (kopia w `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1/`).

## Tabela symboli runda 2

| Partia | Symbol web (plik) | Symbol Rust | Plik Rust | Wektory / testy |
|---|---|---|---|---|
| D | `siegeAllowedBetween`, `enemyUnitsAdjacentToCity`, `detectWarAutoSiegeOnCity`, `isSiegeStillValid`, `aiAutoSiegeAllowed`, `autoSiegeCandidateForScan` (`diplomacy-siege-war-gate.ts`) + `classifyCityAttack` (`mapSiegeDetect.ts`) | `siege_allowed_between`, `enemy_units_adjacent_to_city`, `detect_war_auto_siege_on_city`, `is_siege_still_valid`, `ai_auto_siege_allowed`, `auto_siege_candidate_for_scan`, `classify_city_attack`, `hex_distance` | `src/domain/diplomacy_siege_war_gate.rs` | `tests/p6_dyplomacja_multiwar3_d_data/siege.json` (1500 przypadków + 36 `aiAllow`), `tests/p6_dyplomacja_multiwar3_d.rs` (wektory + granica dystansu N-1/N/N+1) |
| E | `resolveDiplomacyActionLock` (`diplomacy-locks.ts`, wszystkie case'y 2–15 + default) | `resolve_diplomacy_action_lock`, `LockCtx`, `LockResult` | `src/domain/diplomacy_locks.rs` | `tests/p6_dyplomacja_multiwar3_e_data/locks.json` (2500 kontekstów), `tests/p6_dyplomacja_multiwar3_e.rs` (wektory + granica wieku wasala 9/10/11 + kolejność bramek handlu) |
| G | `evaluateInterCivWarGate` (`war-rules-multiwar.ts`, hunk l.~123/156) | `evaluate_inter_civ_war_gate` (istniejący, bez zmian w src) | `src/domain/diplomacy_multiwar_gate.rs` (bez zmian) | `tests/p6_dyplomacja_multiwar3_g_data/war-gate.json` (12288 kombinacji), `tests/p6_dyplomacja_multiwar3_g.rs` (wektory + granica R1 39/40/41 + limit N-1/N/N+1) |

Zależności reużyte, nie kopiowane: case `'2'` = `diplomacy_nap_trust::resolve_nap_lock`; `dualGate` = `diplomacy_nap_trust::dual_gate` (zmieniona widoczność na `pub`); `fmtProg` = `diplomacy_nap_trust::fmt_prog`; `napRelacjaProgEfektywny` = `diplomacy_nap_trust::nap_relacja_prog_efektywny`.

## Założenia (runda 2)

- D: web `City`/`RuntimeUnit` odchudzone do pól używanych przez bramkę (`SiegeCity`, `SiegeUnit`); jednostki w wynikach jako indeks w `units` (web `indexOf`). `areEnemies` jako zamknięcie; w wektorach tabela par wrogów.
- E: pola web `?:` -> `Option` albo `bool` (`false`); `hasTradeTechSelf/Other` -> `Option<bool>` (`=== false`); `active` -> `bool` (`false` = pole nieobecne); `${n}` w notce case '15' przez `js_num`. Pole `contact` pominięte (web `resolveDiplomacyActionLock` go nie czyta).
- G: bez zmian w `src` (funkcja istniała od partii A); dodane wektory i testy granic.

## Mutacje (sprawdzenie czułości testów)

| Mutacja | Test | Wynik |
|---|---|---|
| E: bramka zaufanie/relacja `masz >= prog` -> `masz > prog` | `p6_dyplomacja_multiwar3_e` | KILLED |
| D: kotwica przy murze `== 1` -> `<= 1` (`is_siege_still_valid`) | `p6_dyplomacja_multiwar3_d` | KILLED |
| G: limit napastnika `>=` -> `>` | `p6_dyplomacja_multiwar3_g` | KILLED |
| F: `isWarMarchOpenForPair` `\|\|` -> `&&` | `p6_dyplomacja_multiwar3_f` | KILLED |

Każda mutacja: jedna zmiana w źródle, uruchomienie testu, przywrócenie z kopii (sprawdzone `grep`: kod po mutacjach identyczny z wersją commitowaną).

## Bramki (runda 2)

- `cargo fmt -- --check`: OK.
- `cargo clippy --lib --test p6_dyplomacja_multiwar3_{d,e,f,g} -- -D warnings`: OK.
- `cargo test --lib`: 22/22 OK.
- `cargo test --test <każda z 311 binarek tests/*.rs>` (po jednej, binarka usuwana po przebiegu z powodu dysku): 311/311 binarek `test result: ok`, w tym `p6_8i_pick` 5/5 (debug, 385 s, przekroczył limit 300 s pętli, uruchomiony osobno z dłuższym limitem).
- `cargo clippy --all-targets -- -D warnings` (lib, testy, bench): OK (rc 0).
- `cargo test --doc`: OK (0 testów doc).

## NIE zrobione w rundzie 2

- `PeaceBalanceShape::Kinked` (`src/domain/diplomacy_ai_forced_peace.rs`) NIE usunięty: używany przez wektory `p6_dyplo_multiwar2_peace_ai` i `p6_dyplo_multiwar2_peace_helpers` (odstępstwo od webu, zostaje oznaczone).
