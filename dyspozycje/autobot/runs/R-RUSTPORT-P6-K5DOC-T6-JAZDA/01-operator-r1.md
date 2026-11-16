# R-RUSTPORT-P6-K5DOC-T6-JAZDA — raport Operatora, runda 1

STATUS: BLOCK
DOMAIN: GAME (engine Rust, czyste funkcje; bez wpiecia)
TEMAT: R-RUSTPORT-P6-K5DOC-T6-JAZDA (#259, K5DOC-T6)
GOAL: port `_cavalryAction`, `_cavalryTarget`, `_cavAdjacentNonSpear`, `_cavDirectedManeuverStep`, `_cavManeuverStep`, `_bestChargeStepKey` (czesc jazdy) z pinu `07d2fbd72` jako czyste funkcje Rust + wektory z wykonania pina + testy + mutacje.

BAZA: `origin/rust-port/parity-v2` = `2edc808d7` (worktree detached, `git checkout --detach 2edc808d7`). Nie pushowano. Nie integrowano. `gra/`, `origin/main` nie dotykane.

## ZMIANY / COMMIT

Allowlista (tylko te pliki):
- `rust-port/engine/src/domain/siege_tactics_cavalry.rs` (NOWY, 459 linii po rustfmt): funkcje decyzji kawalerii.
- `rust-port/engine/src/domain/mod.rs` (TYLKO linia `pub mod siege_tactics_cavalry;`).
- `rust-port/engine/tests/p6_k5doc_cavalry.rs` (NOWY): testy zgodnosci z wektorami + 6 testow nazwanych (a, b, c, c2, d, e).
- `rust-port/engine/tests/p6_k5doc_cavalry_gen.mjs` (NOWY): generator; wykonuje tekst pina przez TypeScript.
- `rust-port/engine/tests/p6_k5doc_cavalry_vectors/vectors.json` (NOWY): 707 przypadkow (506 `action`, 201 `charge`).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T6-JAZDA/01-operator-r1.md` (ten raport).

Nie zmieniano: `siege_tactics_activate.rs`, `siege_tactics_loop.rs`, `siege_tactics_pathstep.rs`, `siege_tactics_doctrine_*` (po mutacjach przywrocono z gita; `git status` czysty dla tych plikow), `Cargo.lock` (nie commitowany), `gra/**`, `rust-port/view-model/**`, `rust-port/renderer/**`.

Projekt:
- Wejscie jawne: `Combatant` (pola z `siege_tactics_doctrine_target`), zbior `occupied`, `CavTerrain` (domkniecia: przejezdnosc, ford, `_canStrikeTargetFrom`, `_makeCanAttackFromTest`).
- `cav_priority` (6313), `cavalry_target` (6326), `cav_adjacent_non_spear` (6351), `first_step_toward_directed_attack` (8509, BFS), `cav_directed_maneuver_step` (6426), `cav_maneuver_step` (6457, kara spearAdj +0/+5, fordPenalty), `best_charge_step` (17736, spearAdj +0/+4), `cavalry_action_decide` (6372, kolejnosc krokow 1-4 i petla ruchu w turze z callbackow `_doMove`).
- Wynik `cavalry_action_decide` to lista `CavStep::{Attack(idx), Move(tile)}` w kolejnosci wykonania pina.
- Predykaty `isMounted`/`isAntiCavSpear` (pin 1502/1522) nie zostaly przeniesione jako funkcje: flagi `mounted` i `anti_cav_spear` sa juz w `Combatant` (wypelnia je upstream T2, `siege_tactics_doctrine_target`).

Commit: patrz raport koncowy orkiestratora (SHA commitu z kodem i raportem; brak push).

## TESTY

Wykonane:
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=<scratchpad>/t6target`
- `cargo check --lib` (rust-port/engine): EXIT 0, bez ostrzezen.
- `cargo test --test p6_k5doc_cavalry`: EXIT 0, 9 passed, 0 failed (wektory 707/707 zgodne z pinem; testy nazwane a, b, c, c2, d, e; bok_i_tyl_daja_rozne_ciosy; ruch_nie_przekracza_moves_left).
- `rustfmt --edition 2021 --check` na dwoch nowych plikach Rust: EXIT 0 (po `rustfmt` na tych plikach).
- Generator: `node rust-port/engine/tests/p6_k5doc_cavalry_gen.mjs` EXIT 0; straznik wycinkow (SHA-256 tekstu pina zapisane w `fragments`) i asercje nazwanych przypadkow przechodza.

NIE wykonane (NIE_ZMIERZONO / BLOKADA):
- `cargo fmt --check` dla calego crate: nie uruchomiono (ten sam powod co ponizej; poza tym dotyczy tylko nowych plikow — sprawdzono je rustfmt-em).
- `cargo clippy --all-targets -- -D warnings`: NIE uruchomiono — BLOKADA dysku.
- `cargo test --all-targets --no-fail-fast` (pelne): NIE uruchomiono — BLOKADA dysku.

BLOKADA dysku: `df -h /` przed bramka = 6,5 GB wolnych (< 8 GB wymagane dispatchem). Zuzycie w worktree `wf_*` innych sesji ok. 11 GB; wlasny katalog targetu tematu ok. 334 MB. Nie kasowano cudzych worktree. Po zwolnieniu dysku (>= 8 GB) wymagane: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` w `rust-port/engine` (kody wyjscia do raportu).

## MUTACJE (dispatch: muszą dac FAIL, nierownowazne)

Kazda mutacja zastosowana na pliku roboczym, uruchomiony `cargo test --test p6_k5doc_cavalry`, potem przywrocono oryginal (cmp/`git checkout`).

| Mutant | Zmiana | Wynik | Co zlapalo |
|---|---|---|---|
| (a) | pominiety krok 1: cios w sasiada nie-wlocznika (`cavalry_action_decide`) | FAIL: 5 testow (a, c, c2, bok_i_tyl, wektory) | przypadek a i wszystkie sceny z sasiadem |
| (b) | kara spearAdj odwrocona w `cav_maneuver_step` (`if spear_adj {5} else {0}`) | FAIL: 2 testy (b, wektory) | przypadek b: pin wybiera (5,6); mutant wybiera (6,5) |
| (c) | `desired_hit_for_direction`: Bok->Rear, Tyl->Flank (w `siege_tactics_doctrine_target.rs`, przywrocone `git checkout`) | FAIL: 4 testy (c, c2, bok_i_tyl, wektory) | przypadki c/c2: pin wybiera A (flank) i B (rear) |

Nierownowaznosc: (a) zmienia wynik przypadku a (pin: attack 0; mutant: brak ciosu). (b) zmienia wynik przypadku b (pin: move 5,6; mutant: move 6,5). (c) zmienia wynik przypadkow c i c2 (zamiana luku). Kazdy mutant ma przypadek, w ktorym wynik sie rozni.

## OBSERWACJE O PINIE (do rejestru, nie zmieniano pina)

1. `_bestChargeStepKey` jest nieosiagalna z `_cavalryAction` przy `moveLeft > 0`: `_cavManeuverStep` przyjmuje KAZDEGO wolnego, przejezdnego sasiada (`score > -Infinity`), bez wymogu poprawy dystansu. Szarza wymaga tego samego wolnego sasiada (BFS i greedy), wiec odpala sie tylko, gdy manewr juz zwrocil brak kroku. Dlatego przypadek (e) testuje funkcje `_bestChargeStepKey` bezposrednio (kind `charge`), a nie cala tura. Zgodnosc ze wszystkimi wektorami charge (201) jest zachowana.
2. Komentarz pina przy `_cavManeuverStep` mowi „must strictly reduce distance”, a kod nie sprawdza poprawy; port robi to samo co kod (kod jest zrodlem prawdy).

## OGRANICZENIA / ZAKRES

- Brak wpiecia w `siege_tactics_activate.rs` (galaz `U7.7-cavalry` zostaje zwykla emisja zdarzenia): wpiecie do T8 / #113, zgodnie z decyzja w dispatchu.
- `_doMove` w generatorze i driverze to minimum: zajetosc (usun stary kafelek, dodaj nowy), pozycja, `moveLeft -= 1`. Pelna semantyka efektow ruchu (koszt terenu, facing) to T4c (#314). Driver nie aktualizuje facingu jednostki (nie wplywa na decyzje: `relative_hit` czyta facing celu, a cel sie nie rusza w turze jazdy).
- Wektory stubuja `_passableForUnit`, `isFordTile`, `_canStrikeTargetFrom`, `_makeCanAttackFromTest`, `_doAttack`, `_doMove` (jawnie w `stubs` w `vectors.json` i w komentarzu generatora).
- `_pickTargetByPriority`/`_forwardCol` rzucaja w generatorze (nieosiagalne przy podanym celu).

## RUNDY

RUNDY: 1/5 (Operator, runda 1). Ostatni werdykt: brak (Operator nie ma werdyktu).
DECYZJA: brak decyzji wlasciciela wymaganej. Blokada dysku to decyzja operacyjna orkiestratora (zwolnic dysk).

## NASTEPNY KROK

1. Zwolnic dysk do >= 8 GB (orkiestrator; nie kasowac cudzych worktree bez decyzji).
2. Uruchomic bramki z sekcji TESTY (fmt --check, clippy -D warnings, pelny test) i dopisac kody wyjscia.
3. Evaluator (Sonnet) po bramkach; rundy z tym samym ID.

DEPLOY/PUSH: NIE WYKONANO (zgodnie z dispatchem: bez push do parity, bez integracji).
