# R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1 — 02a Obrona Operatora (r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1
GOAL: odpowiedź na zarzuty Evaluatora r1 (`02-evaluator.md`, commit `a0605a0a0`); domknięcie mutanta B06 testem; jawna rejestracja długów.
BAZA: kod Operatora r1 `978a63ea1` (gałąź `rust-port-wip/k5loop-pin2-probe-q1-r1`, baza tematu `2e5bf370a` = `origin/rust-port/parity-v2` w chwili startu).
ZMIANY/COMMIT: gałąź `obrona/k5loop-pin2-probe-q1` (worktree `.claude/worktrees/wf_40925a79-57f-3`):
- `edb28096d` — test niezmiennika B06 `zagrozenia_strzelcow_przeliczaja_zasieg_terenu` (`rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs`) + komentarz N1 (`rust-port/engine/src/domain/siege_tactics_loop.rs`, tylko komentarz);
- `bf6571cae` — clippy (`sort_by_key`) w tym teście;
- commit raportu: patrz NASTĘPNY KROK / SHA w odpowiedzi strukturalnej.
Wszystkie pliki w allowliście dispatchu. Bez `#[ignore]`, bez linii Co-Authored-By. Wektory (`vectors.json`) i generator NIETKNIĘTE (MD5 wektorów bez zmian względem `978a63ea1`).

## Odpowiedzi na zarzuty

### Z1 (medium): mutant B06 przeżywa — **PRZYJMUJĘ**

Najpierw pin (`gra/src/battle/battleScene.ts` @ `07d2fbd72`):
- `_siegeShooterThreats` (`:7924-7937`) woła `this._applyTerrainRange(d)` (`:7929`) dla każdego obrońcy-strzelca przed odczytem `d.range` — to MUTACJA `d.range`.
- Obrońcy na koronie dostają `_applyTerrainRange(ru)` przy rozstawieniu (`:4730`), ale `restUnits` (`:4735-4741`, `placeOne` za murem, `rearCol = wallCol + 2 + …`) — NIE: startują z `range = rangeBase`.
- `_applyTerrainRange` (`:7490-7502`): `max(0, rangeBase + delta)`, x2 na koronie.

Pomiar przed poprawką (diagnostyka, usunięta): we wszystkich 14 wektorach obrońcy-strzelcy stoją na koronie (`onWallWalkway = true`, `range = 6` = (3+0)·2 już po `:4730`), kafle korony mają deltę 0 — więc nieaktualne `d.range` w oknie `_siegeShooterThreats` nigdy nie występuje i wektory pełnej bitwy nie mogą rozróżnić B06. Dlatego, tak jak dla B07, test niezmiennika na stanie sesji.

Test `zagrozenia_strzelcow_przeliczaja_zasieg_terenu` (`p6_k5loop_wiring_a_pin.rs`):
1. Dla każdego wektora: `SiegeBattleSession::prepare_scene`, pierwszy atakujący objęty `_siegeApproachRestricted` (`siege_approach_restricted` z publicznego stanu ciała).
2. Strzelec obrońcy `k` w stanie pinu z `restUnits`: poza koroną, `range = rangeBase`, na kaflu za murem (`q >= wallCol + 2`) z deltą zasięgu != 0 (kolejność kafli deterministyczna).
3. Cel kroku w odległości `D = floor(max(stary, przeliczony))` od strzelca, gdzie `D` > min z obu — odmowa `_siegeMoveRefused` z zasięgu przeliczonego różni się od odmowy z nieaktualnego.
4. `ProdBody::move_step` (publiczne API, ta sama bramka `siege_move_refused_now` co produkcja) i asercje: (1) każdy żywy strzelec obrońcy ma `range` = `apply_terrain_range` na swoim kaflu (bitowo — mutacja `d.range` jak `:7929`); (2) odmowa ciała == `siege_move_refused` z zasięgami przeliczonymi.
5. Moc: ≥ 3 przypadki rozróżniające i obie gałęzie (pin odmawia / pin nie odmawia).

Wynik (kod tematu): `1 passed`, 14 przypadków rozróżniających, obie gałęzie (2× odmowa=true w `mur_jazda_rzeka*`, delta +1: zasięg 3→4; 12× odmowa=false, delta -1: 3→2).

Mutant B06 przerobiony (skrypt w scratchpadzie: warunek odświeżenia w `siege_move_refused_now` zamieniony na `false && …`) i ZABITY:
```
assertion `left == right` failed: mur_bez_machin_sufit: a0 krok na (51, 34): d1 range 3 != 2 (brak `_applyTerrainRange` w `_siegeShooterThreats`)
test result: FAILED. 0 passed; 1 failed
```
Po przywróceniu kodu: `git status` czysty w `src/` (mutant cofnięty), test zielony.

### Z2 (low): brak pokrycia `morale-konflikt-zegara` — **PRZYJMUJĘ jako dług NIE_ZMIERZONO (rejestr)**

Zgoda co do faktów: mutanty E2/E3 przeżywają, bo żaden z 14 wektorów nie ma okrążenia w `start` jednocześnie z trafieniem zegara w oknie `start..complete`. Gałąź jest fail-closed: wystąpienie wpisuje tag `morale-konflikt-zegara` do `unported`, a test wektorów żąda pustego `unported` — więc nie da cichego złego wyniku. Wartość pinu jest obliczalna (pin `:6103-6117`: `ru.morale = max(0, m - MORALE_SURROUND_HIT)` od razu na początku `_activateUnit`, potem trafienia wież `_fireOneTower → _resolveBlowOutcome → _applyMoraleDamage` `:9722` działają na bieżącej wartości), ale wierne odtworzenie wymaga kolejności zdarzeń w czasie (np. `_checkRout` po okrążeniu może zmienić gałąź na `_fleeStep`, a trafienie po nim działa już na jednostkę rozbitą) — to ten sam problem co `ucieczka-konflikt-zegara` (dług #369, sterownik czasu rzeczywistego). Nie domykam tego w obronie (wymaga nowego wektora generatora z kandydatów + implementacji kolejności), więc proszę orkiestratora o wpis do `dyspozycje/rust-port/REJESTR-RUST.md` (poza allowlistą tego tematu):

> **NIE_ZMIERZONO — PIN2-MORALE-KONFLIKT-ZEGARA**: `ProdBody::complete` (D-PIN2-1) przy jednoczesnej zmianie morale przez aktywację (okrążenie, `:6103-6117`) i przez zegar (trafienie wieży w oknie `start..complete`) daje tag `morale-konflikt-zegara` i wartość zegara. Wartość pinu: okrążenie najpierw (`max(0, m - MORALE_SURROUND_HIT)`, `_checkRout`), potem trafienia na bieżącej wartości. Brak wektora; mutanty E2/E3 Evaluatora PIN2-PROBE-Q1 nieodróżnialne. Fail-closed (tag w `unported`). Temat docelowy: #369 (sterownik czasu rzeczywistego) razem z `ucieczka-konflikt-zegara`.

### N1 (kosmetyczne): `morale_before: seq.morale` w gałęzi ucieczki to martwy kod — **PRZYJMUJĘ (komentarz)**

Sprawdzone: `complete` z `pend.flee` (`siege_tactics_loop.rs`, blok `if pend.flee { … return; }`) wraca przed logiką D-PIN2-1, więc pole nie jest czytane. Pole musi być zainicjowane (struktura `ProdPending`), więc nie usuwam go; dopisany komentarz „nieczytane, mutant E4 = równoważny” (commit `edb28096d`, zmiana tylko komentarza). E4 = mutant równoważny.

### N2 (rejestr): 23/128 rozjazdów produkcyjnego Rust vs pin @16 ms; nazwa `mk.py` — **PRZYJMUJĘ (do orkiestratora) + korekta nazwy tutaj**

Rejestr `REJESTR-RUST.md` i otwarcie tematów są poza allowlistą Operatora — przekazuję do orkiestratora: otworzyć **FRAME-QUANT** (12/128, kwantyzacja klatki 16 ms) i **B-WIRA-PIN-3** (11/128, rzeczywiste różnice logiki, przyczyna NIE_ZMIERZONO) oraz wpisać D-PIN2-1/2/3 z `01-operator-r1.md`. Korekta raportu Operatora §4.3: generator kandydatów to pliki `01-operator-r1-kandydaci-c1.py`, `…-c2.py`, `…-c3.py` w katalogu runu (nie `mk.py`, które było nazwą roboczą w scratchpadzie).

### N3 (proces): wspólny scratchpad z innym Workflow — **PRZYJMUJĘ**

W tej rundzie wszystkie pliki robocze mają unikalne nazwy z prefiksem tematu: `CARGO_TARGET_DIR=…/scratchpad/tgt-pin2-obrona`, logi `pin2-obrona-*.log`, skrypty `mut_b06.py`, `pin2-obrona-full.sh`. Rekomendacja dla orkiestratora: w szablonie dispatchu wymagać prefiksu ID tematu dla targetów i logów.

### Potwierdzenia Evaluatora — przyjęte, bez zmian.

## Długi
- PIN2-MORALE-KONFLIKT-ZEGARA (Z2) — NIE_ZMIERZONO, do rejestru (#369).
- FRAME-QUANT i B-WIRA-PIN-3 (N2) — do otwarcia przez orkiestratora.
- Test B06 jest testem niezmiennika na stanie zbudowanym ręcznie (strzelec przestawiony do stanu `restUnits`), nie wektorem pełnej bitwy z pinu: wektory pinu z obrońcą-strzelcem w `restUnits` na kaflu z deltą wymagałyby rosteru z konnym strzelcem obrońcy — możliwe w przyszłym temacie generatora, NIE_ZMIERZONO.

## Bramki (kod `bf6571cae`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (pierwsze podejście: `unnecessary_sort_by` w nowym teście → poprawione w `bf6571cae`) |
| `cargo test --test p6_k5loop_wiring_a_pin zagrozenia_strzelcow` | ok, 14 przypadków B06 |
| mutant B06 (`false && …` w `siege_move_refused_now`) | FAILED (zabity), kod przywrócony |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`) | **FULL_EXIT=0**: 547 × `test result: ok`, 4156 passed / 0 failed / 1 ignored (istniejący; +1 = nowy test względem 4155 Operatora) |
| `vectors.json` MD5 | `7048c640aa6aeba3e148d0aca4e2f164` (bez zmian względem `978a63ea1`) |
| `git diff --stat 978a63ea1 bf6571cae` | 2 pliki: `siege_tactics_loop.rs` +2 (komentarz), `p6_k5loop_wiring_a_pin.rs` +210 |

TESTY: jak w tabeli wyżej.

BLOKADY: brak.
RUNDY: 1/5 (obrona r1).
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.
