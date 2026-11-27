# R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1
GOAL: wektory pinu `07d2fbd72` dla zmiany prędkości w trakcie odcinka `_raf` (krok falangi, `_advanceToward`, cios wypadu przesunięty o klatkę, koniec wypadu) oraz zgodność `SiegeLoop::respeed` bajt w bajt; mutanty E3/E7/E8 i plan kroku falangi / `_advanceToward` mają ginąć OD WEKTORÓW.
ZMIANY/COMMIT: oceniany jest `8ff4e1d0e` (gałąź `obrona-414-r1`: Operator `5315b646c`, potem Evaluator `174d9dac4`, potem Obrona `4bccf5293`/`91f196af4`/`8ff4e1d0e`). Baza: `bb92c80fa` = `origin/rust-port/parity-v2`, co potwierdza `merge-base --is-ancestor`. FC nie zmienia kodu, jedynym plikiem FC jest ten raport (gałąź `fc-414-r1`).
TESTY: fmt EXIT 0, clippy `--all-targets -D warnings` EXIT 0, pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (559 binarek, 4380 passed / 0 failed / 1 ignored). Regeneracja `speed_change_vectors_2.json` z tekstu pinu: 4 shardy + merge, 14/14, MD5 `7cb931b2cfcda6df86fbe6f85d5c7745`, plik identyczny z wersją w commicie. Mutanty M-Z1a i E3 sprawdzone samodzielnie (§3).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge na `rust-port/parity-v2` po `merge-base --is-ancestor`), potem pełny `cargo test` engine na wyniku integracji.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki (odtworzone samodzielnie)

`CARGO_TARGET_DIR` leżał w scratchpadzie FC i został usunięty po bramkach. Ustawione były `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0` i `CARGO_PROFILE_TEST_DEBUG=0`. Przed bramkami było 13–14 GB wolnego miejsca.

| bramka | wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (debug) | EXIT 0; 559 binarek; 4380 / 0 / 1 ignored. W tym `zmiana_predkosci_w_trakcie_klasy_raf_wektory_pinu_bajt_w_bajt` ok i `..._klasy_raf_mutanty_sterownika_daja_fail` ok |
| `git diff --check bb92c80fa..8ff4e1d0e` | czysto |

Renderera i klienta nie zmieniono, więc ich bramki nie dotyczą tego tematu (D-414).

## 2. Allowlista i jakość zmian

- `git diff --stat bb92c80fa 8ff4e1d0e` obejmuje 6 plików: `p6_k5loop_wiring_a_gen.mjs`, `p6_k5loop_wiring_a_pin.rs`, nowy `speed_change_vectors_2.json` oraz raporty 01/02/02a. Wszystkie są na allowliście. Kod produkcyjny (`siege_tactics_loop.rs`, `siege_battle_session.rs`) nie został zmieniony, co jest poprawne według D-414-3, bo nie ujawniono rozbieżności.
- D-414-1: istniejące pliki wektorów nie zostały ruszone. Strażnik SHA-256 pinu się nie zmienił: generator sprawdza go w każdym shardzie i każdy shard zakończył się EXIT 0.
- Generator dostał 5 linii usuniętych i zastąpionych. Wszystkie zmiany działają wyłącznie przy `sc.probe2`. Dotyczą: warunku opakowania `|| sc.probe2`, klasy kroku w `moves.push`, pola `round` w `lunges.push` oraz mapy `when`. Dla starych trybów zmiana niczego nie robi. Stare testy wektorów są zielone w pełnym teście.
- Test Rust zawiera wyłącznie dopiski. `apply_vector_doctrine` w `run_midchange` bez pola `doctrine` niczego nie zmienia (40 starych wektorów jest zielonych). Nie ma nowych `#[ignore]` ani osłabionych asercji. Doszły asercje `movingPh` ≥ 2 bitwy i `n_extra` ≥ 2.
- Budżet D-414-2 jest dotrzymany: 14 bitew (limit ≤ 16), 4 shardy.

## 3. Weryfikacja kryteriów końca

### 1. Wektory z wykonania tekstu pinu i pokrycie klas

Regeneracja FC dała 14/14 przypadków, a MD5 zgadza się z plikiem w commicie. Liczniki zastosowanych zmian odczytane z logów generatora FC:

| klasa | liczba bitew |
|---|---|
| `movingPh` | 2 (`sc2_ev_falangi_manual_pal_x1_movingPh4` w klatce 237; `sc2_ev_falangi_manual_mur_x2_movingPh1` w klatce 259) |
| `movingAdv` | 4 |
| `lungeShift` | 4 |
| `lungeTail` | 4 |

Kryterium ≥ 8 bitew jest spełnione (14). Każda klasa ma licznik > 0.

Ścieżka falangi przez doktrynę `'manual'` zgadza się z tekstem pinu. Sprawdziłem ją przez `git show 07d2fbd72:gra/src/battle/battleScene.ts`:
- `_isUnitDoctrineAuto` zwraca `false` dla `'manual'`;
- gałąź doktryny jest pomijana;
- wykonanie dochodzi do `if (ru.phalanx) { this._phalanxAction(ru, done); return; }`.

### 2. Zgodność bajt w bajt

14/14 wektorów jest zgodnych w pełnym teście. Porównanie obejmuje chwilę zmiany, strumień zdarzeń C/R/K/D z czasem, liczbę klatek i wynik. Rozbieżności nie ma.

### 3. Mutanty (pomiar FC, `cargo test --release --test p6_k5loop_wiring_a_pin -- klasy_raf_wektory_pinu_bajt_w_bajt`)

Każdy mutant był nakładany na plik i po pomiarze plik przywracano. Po wszystkich pomiarach `git status` był czysty.

| ID | mutacja | wynik FC |
|---|---|---|
| M-Z1a | `put_step_done_plan` w `phalanx_action` (`siege_tactics_loop.rs:5537`) usunięty | FAILED; rozbieżny `sc2_ev_falangi_manual_mur_x2_movingPh1`. **Mutant ginie od wektorów.** |
| E3 | `respeed` bez `+ p.then` (`:843`) | FAILED; rozbieżne 4 wektory `lungeTail`. **Mutant ginie od wektorów na zestawie 14.** |
| E8, M-Z1b (`_advanceToward` `:7788`), MT | jak w `02-evaluator.md` §4 | Pomiar Evaluatora na 12 wektorach, które są podzbiorem 14. FC tego nie powtarzał. |
| E7 | strażnik planu `due.is_some() && planned.is_finite()` | Mutant równoważny w produkcji (§4) |

### 4. Brak regresji

Pełny `cargo test` jest zielony, łącznie ze wszystkimi wcześniejszymi plikami wektorów.

## 4. Orzeczenia zarzutów

| Zarzut | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z1: krok falangi jest osiągalny, a dowód nieosiągalności jest fałszywy | Evaluator §3 | ODDAL (naprawione w Obronie) | Dodano 2 wektory `movingPh` przez doktrynę `'manual'`. Są bajt w bajt zgodne z pinem, a regeneracja FC je potwierdza. Komentarze o nieosiągalności usunięto. |
| Z2a: M-Z1a przeżywa | Evaluator §4 | ODDAL (naprawione) | Pomiar FC: mutant ginie od wektora `movingPh`. |
| Z2b: E7 nie jest ani zabity, ani pokazany jako równoważny | Evaluator §4, §7 | ODDAL | Strażnik w `schedule_body` (`:810`) odrzuca plan tylko wtedy, gdy `due != planned` bitowo. W `ProdBody` oba wyrażenia to `now + frame_raf(F, ms) + then` na całkowitych wartościach ≪ 2^53, więc są równe bitowo. Obrona zmierzyła 0 odrzuceń na 347 417 planach całej binarki `p6_k5loop_wiring_a_pin`. Evaluator dopuszczał wariant „udokumentowana równoważność”. Strażnik zostaje pokryty testem jednostkowym `respeed_tests` z #413. |
| Z3: komentarze, `RAF_KLASY_WYMAGANE`, doktryna w teście, gałąź `None` w `base2` | Evaluator §2, §6 | ODDAL (naprawione) | `RAF_KLASY_WYMAGANE` ma 4 klasy. Gałąź `None` jest używana przez 2 wektory i chroni ją asercja `n_extra >= 2`. |
| MB: `<=` → `<` w `respeed` | Evaluator §4 | ODDAL | Mutant równoważny: przy `end_old == now` nowy `due` równa się staremu. Argument Evaluatora przyjmuję. |

Żaden zarzut nie dostał orzeczenia NAPRAW ani DO DECYZJI CZŁOWIEKA.

## 5. Uwagi (PASS-WITH-NOTES)

1. E7 nie jest zabijany wektorem. Jest równoważny w produkcji, co pokazuje argument z kodu i pomiar 0 odrzuceń. Kryterium 3 jest dla E7 spełnione w wariancie „równoważność”, a nie „zabity od wektorów”.
2. Numery linii pinu w komentarzach (`:6092-6098`, `:17621-17623`, `:6290`) zgadzają się z tekstem pinu z dokładnością do kilku linii.
3. Pełny test engine trwa około 40 min w debug. Integrator powinien uruchomić go w tle.

## 6. NIE_ZMIERZONO

- E8, M-Z1b i MT na zestawie 14 wektorów. Zmierzył je Evaluator na podzbiorze 12, FC nie powtarzał.
- E7 jako uruchomiony mutant. Jest tylko dowód równoważności.
- Regeneracja starych plików wektorów nowym generatorem (dopiski są bramkowane, a stare testy Rust są zielone).
- Pozostałe 19/40 scenariuszy sondy Operatora (nie wpływa to na wynik, wszystkie klasy są pokryte).
