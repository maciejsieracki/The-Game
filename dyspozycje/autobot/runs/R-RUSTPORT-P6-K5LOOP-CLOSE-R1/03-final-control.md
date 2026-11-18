# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — Final Control, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5: `update_facing` prawdziwy po każdym kroku ruchu; każde `ActivateEvent` spoza listy wykonane wg pinu albo jawnie udowodnione/oznaczone. Cel końcowy tematu (puste `unported` dla wszystkich gałęzi) NIE jest jeszcze osiągnięty — runda 1 jest niepełna zgodnie z planem dispatchu, reszta = runda 2.

OCENIANY STAN: `9f9930230` (obrona, gałąź `k5loop-close-r1-obrona`) nad `e50ed830e` (Evaluator) → `d25db7b56` (raport Operatora) → `aa0f55121` (kod Operatora), rodzic `4b27bc689` = aktualny wierzchołek `origin/rust-port/parity-v2` (sprawdzone `git fetch` + `git log -1`). Gałąź FC: `fc/k5loop-close-r1` = `9f9930230` + ten raport.

## ZMIANY/COMMIT
FC nie zmieniał kodu. Jedyny nowy plik: ten raport.

## Allowlista (sprawdzona samodzielnie)
`git diff --stat 4b27bc689..9f9930230`: `siege_tactics_loop.rs`, `tests/p6_k5loop_close.rs`, `tests/p6_k5loop_close_gen.mjs`, `tests/p6_k5loop_close_vectors/vectors.json`, 3 raporty w katalogu runs. Wszystko w allowliście. Nie ruszono `siege_tactics_inputs_pos.rs`, `siege_tactics_move_effects.rs`, innych modułów T4–T7, `gra/**`, `data/**`, `Cargo.*`, wektorów `p6_siege_tactics_loop*`.
- `#[ignore]` dodany: brak (trafienia `grep` tylko w zdaniach raportów). Usunięte asercje w `*.rs`: brak. `git diff --check`: czysto. Commity bez `Co-Authored-By` (#289).

## TESTY (odtworzone przez FC; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)
| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close` | 0 | 5 passed |
| `cargo test --test 'p6_siege*'` | 0 | 40 binarek, 0 failed |
| pozostali konsumenci `ProdBody` + `--lib` (`p4_1i3_actions`, `p6_k5doc_t4e`, `p4_1i2_frame_fire`, `p6_tower_target_wiring`, `p6_wieze_2b1/2b2`, `p6_k5loop_outcome_pin`, `p6_k5doc_state`, `p4_1i2_frame`) | 0 | 10 binarek, 200 passed |
| **pełny `cargo test --all-targets --no-fail-fast`** (w tle `setsid nohup`, EXIT w logu, 00:51–01:02 UTC) | **0** | **527 binarek, 3933 passed, 0 failed, 1 ignored** (istniejący, sprzed tematu) |

Dysk przed pełną bramką: 13 GB wolne (≥ 8 GB). BLOCK INFRA z obrony (pełna bramka nieuruchomiona przy 5,6 GB) jest tym samym ZAMKNIĘTY: pełna bramka na stanie po obronie = EXIT 0. 3933 = 3931 (r1) + 2 nowe testy Z3.

Generator: `node rust-port/engine/tests/p6_k5loop_close_gen.mjs` → EXIT 0, SHA-256 wycinków pinu `bdc91c51…559c` (strażnik), 600 wektorów, `vectors.json` bajt w bajt identyczny z zacommitowanym (`cmp`), drzewo czyste po przebiegu.

## Mutacje (własne FC; skrypt w scratchpadzie, plik przywrócony i `cmp` = RESTORED)
| mutant | wynik |
|---|---|
| (a) `_updateFacing` po kroku wyłączony (`if false && facing_requested`) | FAIL (1 test) — zabity |
| (b) gałąź `AdvanceStep` pominięta (`=> {}`) | FAIL (3 testy) — zabity |
| (Z1) tag C-FLANK wyłączony (marsz czołowy) | FAIL (1 test) — zabity |
| (c) kolejność RNG | N/A — `_advanceStep`/`_doMove`/`_updateFacing` w pinie nie losują; test używa `SequenceRolls::new(vec![])`, więc każdy rzut = panika |

## Weryfikacja wobec pinu
- `_advanceStep` `battleScene.ts:8198-8235` przeczytane z `git show 07d2fbd72`: preludium (`finished`, `dead/fadingOut`, `moveLeft <= 0`) przed C-FLANK — zgodne z `ProdBody::advance_step` (`prelude_done` przed tagiem; `NaN` nie kończy, jak w JS).
- D-K5C-1: facing ustawiany wyłącznie w `move_step_core` po kroku (`_updateFacing` po `ru.q/ru.r` i `moveLeft`), przez istniejące `ProdBody::update_facing`. Brak własnej heurystyki.
- D-K5C-3: klocki T4a/T4b/T4c/EXEC-T2 wołane bez zmian, adaptery w tym samym pliku.
- D-K5C-4: `formation_rank`, `group_meta`, `attack_direction` w `ProdBody` z domyślnymi wartościami pinu (`?? 0`, pusta mapa, `'front'`), wypisane w raportach.

## ORZECZENIA W SPRAWIE ZARZUTÓW
| zarzut | orzeczenie | uzasadnienie |
|---|---|---|
| Z1 C-FLANK po cichu jako front | ODDAL (zamknięty w obronie) | pole `attack_direction`, jawny tag `krok-naprzod-flanka`, 120 wektorów z pinu (94 w bloku, 26 preludium), mutant zabity (także przez FC). Uwaga do r2: tag jest zachowawczy — pin przy braku kroku na flankę (`dirStepKey` null, `:8231-8233`) wraca do marszu czołowego; port T4d musi to odwzorować. To jawne `unported`, nie ciche pominięcie. |
| Z2 mutant E4 (filtr `routed` linii) | ODDAL (zamknięty) | rodzina `rank-routed` 60 wektorów, każdy rozróżnia mutanta; asercja `>= 50`. |
| Z3 `release_tile` bez wektora | ODDAL (zamknięty) | testy `rout_po_okrazeniu_zwalnia_pole`, `zabicie_zwalnia_pole` z liniami pinu `:9812`, `:9915`; mutant E5 zabity. |
| Z4 zakres niepełny / kolejność r2 | ODDAL dla r1 | dispatch dopuszcza rundę niepełną z jawną listą (jest, z liniami pinu). Kolejność r2 (C-FLANK → kawaleria → strzelec razem z `FallBackStep` → falanga → `_fleeStep`) to decyzja techniczna orkiestratora (reguła 8), nie decyzja człowieka. |
| Z5 brak `Move` w `BattleAction`, czas nominalny | ODDAL (informacyjny) | plik poza allowlistą; NIE_ZMIERZONO jawnie zapisane; do I5/#113. |
| b4 `_passableForUnit` = `passable` przeżywa | ODDAL | mutant równoważny dla piechoty (`:7436-7441`: `Infinity` tylko przy `!passable`, mnożnik tylko `mounted`); musi zostać zabity w rundzie z kawalerią. |
| BLOCK INFRA pełnej bramki (obrona) | ODDAL (zamknięty przez FC) | pełna bramka EXIT 0 na `9f9930230`. |

NAPRAW: brak. DO DECYZJI CZŁOWIEKA: brak.

## BLOKADY
Brak. Cel końcowy tematu niezamknięty (runda niepełna, planowo).

## Gałęzie NIEZROBIONE (runda 2 tego ID, z linią pinu)
1. C-FLANK w `_advanceStep` (T4d) `battleScene.ts:8204-8235` (z fallbackiem na marsz czołowy `:8231-8233`) — tag `krok-naprzod-flanka`.
2. `CavalryAction` `_cavalryAction` `:6372-6412` (T6; ruch przez `move_step_core`, nie emulację `moveLeft -= 1`) — tag `kawaleria`; zabić mutant b4.
3. Strzelec: `RangedAction` `:6656` + `FallBackStep` `:7228` (zdjęcie strażnika `strzelec`; T5a/T5b/T7b) — mutacja (c) RNG wraca tutaj.
4. `PhalanxAction` `:6546-6578` (+ `_phalanxStep` `:6588-6636`, T7a) — tag `falanga`.
5. `Flee` `_fleeStep` `:9845` (nowy port) — tag `ucieczka-routed`.

## RUNDY
1/5 (Operator r1 + obrona r1; FC r1 = PASS-WITH-NOTES)

## NASTĘPNY KROK
Orkiestrator: zabezpieczyć `refs/keep/R-RUSTPORT-P6-K5LOOP-CLOSE-R1-fc` → integracja r1 na `rust-port/parity-v2` (kod `aa0f55121` + obrona `9f9930230` są przodkami gałęzi FC) albo dopisek r2 w `00-dispatch.md` z BAZĄ = SHA tej gałęzi FC; runda 2 wg listy wyżej. Po całości: K5LOOP-WIRING (#113), potem I5.

## DEPLOY/PUSH
NIE WYKONANO
