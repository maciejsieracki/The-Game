# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — Evaluator (adwersarialny), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5: `update_facing` prawdziwy po każdym kroku ruchu; każde `ActivateEvent` spoza listy wykonane wg pinu albo jawnie udowodnione jako nieosiągalne.
OCENIANY STAN: gałąź robocza `eval/R-RUSTPORT-P6-K5LOOP-CLOSE-R1` = `d25db7b56` (raport) nad kodem `aa0f55121`, rodzic `4b27bc689` = aktualne `origin/rust-port/parity-v2` (sprawdzone `git fetch` + `rev-parse`; `4b27bc689` jest przodkiem i jest wierzchołkiem parity).

## ZMIANY/COMMIT
Evaluator nie zmieniał kodu. Jedyny nowy plik: ten raport.

## Allowlista
`git diff --stat 4b27bc689 HEAD`: 5 plików — `siege_tactics_loop.rs` (+508/-21), `tests/p6_k5loop_close.rs`, `tests/p6_k5loop_close_gen.mjs`, `tests/p6_k5loop_close_vectors/vectors.json`, `runs/.../01-operator-r1.md`. Wszystkie w allowliście dispatchu. **Pliki spoza allowlisty: brak** (nie ruszono `siege_tactics_inputs_pos.rs`, `siege_tactics_move_effects.rs`, innych modułów T4/T5/T6/T7, `gra/**`, `data/**`, `Cargo.*`, istniejących wektorów `p6_siege_tactics_loop*`). D-K5C-3 dotrzymane: klocki T4a/T4b/T4c/EXEC-T2 wołane, nie zmienione.
- `#[ignore]` dodany: brak (jedyne trafienie `grep '^\+.*#\[ignore'` to zdanie w raporcie Operatora). Usunięte/osłabione asercje (`grep '^-.*assert'`): brak.
- `git diff --check 4b27bc689 HEAD`: czysto. Commity bez linii `Co-Authored-By` (#289).

## TESTY (odtworzone niezależnie; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)
| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close` | 0 | 3 passed |
| `cargo test --test 'p6_siege*'` | 0 | 40 binarek, 0 failed |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | 0 | 527 binarek, 3931 passed, 0 failed, 1 ignored (istniejący) |

Dysk: 8,3 GB wolne przed startem bramek; w chwili startu pełnej bramki 7,7 GB (spadek = własny `CARGO_TARGET_DIR` tej samej sesji, ~0,8 GB). Bramka przeszła; po sprzątnięciu 10 GB.

Generator: `node rust-port/engine/tests/p6_k5loop_close_gen.mjs` (Node 22.23.4) → EXIT 0, SHA-256 wycinków `bdc91c51…59c` (strażnik zgodny), `vectors.json` **bajt w bajt identyczny** z zacommitowanym (`cmp`). Determinizm i odtwarzalność potwierdzone.

## Wektory z TEKSTU pinu (nie reimplementacja)
Generator wycina z `git show 07d2fbd72:gra/src/battle/battleScene.ts` i `formationRules.ts` ciała metod (`_activateUnit` 6048-6299, `_advanceStep` 8198-8285, `_doMove` 8685-8776, `_updateFacing` 8334, `_nearestEnemy`, `_canAttackFrom`, `_firstStepAlongPathToAttack`, `_compactAttackAllowsStep`, `_shouldAvoidAutoBacktrack`, `_getEffectiveDoctrine`, `_moveCostForUnit`, `compactLineAllowsAdvance` itd.), sprawdza nagłówki linii i końce metod, liczy SHA-256 i transpiluje TS → JS bez wstawek w logice. Jedyne zmiany tekstu: zmiana nazw 3 metod na `*Pin` i cienkie wrappery instrumentacji (ślad/czas), co przejrzałem — nie zmieniają stanu. Stuby są jawne i rzucają przy osiągnięciu gałęzi spoza zakresu (więc wektor nie może po cichu przejść przez nieportowaną ścieżkę). Ręcznie sprawdziłem tekst pinu: `_updateFacing(ru)` jest wołane w `_doMove` po `ru.q/ru.r` i `moveLeft`, przed animacją (`:8704`, `:8756`), co odpowiada `move_step_core` (facing z nowej pozycji, czas = początek kroku).

## Zgodność z D-K5C
- D-K5C-1: facing po kroku dokładnie w miejscu pinu; brak własnej heurystyki (`ProdBody::update_facing` = `_nearestEnemy` + `facingFromTo`). OK.
- D-K5C-2: gałąź nie losuje (pin `_advanceStep`/`_doMove`/`_updateFacing` bez `Math.random`); test używa `SequenceRolls::new(vec![])`, każdy rzut = panika. Mutacja (c) słusznie N/A w tej rundzie. OK.
- D-K5C-3: OK (wyżej).
- D-K5C-4: `formation_rank`, `group_meta` dodane do `ProdBody` z domyślną wartością pinu, wypisane w raporcie. OK — ale patrz zarzut Z1 (brak pola `attackDirection`).
- D-K5C-5: czas wirtualny `MOVE_STEP_MS`/`STEP_GAP_MS` nominalnie; kwantyzacja rAF jawnie NIE_ZMIERZONO. OK.

## Tabela wariantów `ActivateEvent`
Zweryfikowana wobec `siege_tactics_activate.rs:136-171` (19 wariantów) i `ProdBody::start` (strażniki `tryb-reczny`/`oblezenie`/`strzelec`/`doktryna` przed maszyną, `prod_tag`). Tabela Operatora jest kompletna i zgodna z kodem: po r1 do `skipped` trafiają realnie tylko `Flee` (po okrążeniu), `CavalryAction`, `PhalanxAction`; `RangedAction`/`FallBackStep` są za strażnikiem `strzelec`, `AttackWallTile`/`AdvanceToward` za `oblezenie`, `DoctrineStep` za `doktryna`. Każdy przypadek ma tag w `unported` — brak cichego pominięcia na poziomie zdarzeń.

## Mutacje (własne, niezależne od Operatora)
Skrypt w scratchpadzie: `sed` na `siege_tactics_loop.rs` → `cargo test --test p6_k5loop_close` → przywrócenie (`cmp` = RESTORED).
| mutant | wynik |
|---|---|
| E1 facing po kroku z czasem `now0` zamiast `now0+elapsed` | FAIL (41) — zabity |
| E2 `_enemiesOf` bez filtra `routed` | FAIL (133) — zabity |
| E3 `MOVE_STEP_MS` 240 → 250 | FAIL (401) — zabity |
| E6 `moveLeft` z `pend.move_left` nie zapisany w `complete` | FAIL (360) — zabity |
| E4 linia szyku `in_play` bez filtra `routed` (`:8154`) | **PRZEŻYŁ** |
| E5 `release_tile` = no-op (rout/śmierć) | **PRZEŻYŁ** (zgłoszone przez Operatora jako NIE_ZMIERZONO) |

## ZARZUTY (do rundy 2; żaden nie łamie bramek r1)
- **Z1 (ciche pominięcie, MUSI być zamknięte przed FC całości):** C-FLANK w `_advanceStep` (`battleScene.ts:8204-8235`, `desiredHitForDirection(ru.attackDirection)`) jest w `ProdBody` traktowany po cichu jak `'front'`: ani `ProdUnit`, ani `ProdBody` nie niosą `attackDirection`, T4b świadomie pomija krok 2 (`siege_tactics_advance.rs:11`), a `ProdBody::advance_step` nie zapisuje żadnego tagu. Pin ustawia `attackDirection` = `'bok'/'tyl'` z UI (`:13917`, `:16975`, grupy `:13921`/`:16979`), więc jednostka gracza z doktryną nie-auto i kierunkiem bok/tył idzie w pinie inną ścieżką. Generator też nie ustawia pola (`undefined` → front), więc wektory tego nie widzą. Raport mówi „`AdvanceStep` ZROBIONE” bez tego zastrzeżenia. Wymagane: pole `attack_direction` (D-K5C-4, domyślnie `'front'` jak spawn `:4577/:4722/:5492/:17265`) i albo port (T4d), albo jawny tag `krok-naprzod-flanka` + wektor.
- **Z2 (pokrycie):** mutant E4 przeżywa — filtr `!u.routed` (i pokrewne) linii poprzedniej rangi w `_compactAttackAllowsStep` nie jest pokryty wektorami (wymaga: działająca jednostka `steady`, `formationRank > 0`, najbliższy sojusznik rangi `rank-1` uciekający). Dopisać scenariusze.
- **Z3 (pokrycie):** `release_tile` w `start_rout`/`start_fade` (pin `:9812`, `:9915`) bez wektora (mutant E5 przeżywa); Operator to zgłosił — do pokrycia, gdy wejdą scenariusze z routem w aktywacji (kawaleria/ciosy).
- **Z4 (zakres rundy):** cel końcowy nie osiągnięty — `CavalryAction`, `RangedAction`+`FallBackStep` (zdjęcie strażnika `strzelec`), `PhalanxAction`, `Flee` (`_fleeStep` `:9845`, brak portu) pozostają; lista z liniami pinu jest w raporcie Operatora (zgodne z dispatchem dla rundy niepełnej). Kolejność rundy 2 Operatora (kawaleria przed `FallBackStep`) różni się od kolejności dispatchu (`AdvanceStep` → `FallBackStep` → kawaleria → strzelec); uzasadnienie (strażnik `strzelec` wspólny dla `FallBackStep` i `RangedAction`) jest rozsądne, ale orkiestrator powinien to zatwierdzić.
- **Z5 (NIE_ZMIERZONO, informacyjnie):** brak akcji `Move` w `BattleAction` (renderer I5 nie dostanie animacji kroku; plik poza allowlistą), czas kroku nominalny.

## BLOKADY
Brak blokad technicznych.

## RUNDY
1/5

## NASTĘPNY KROK
Final Control r1. Runda 2 tego ID: Z1 (C-FLANK: pole + port/tag), Z2, potem gałęzie z Z4.

## DEPLOY/PUSH
NIE WYKONANO
