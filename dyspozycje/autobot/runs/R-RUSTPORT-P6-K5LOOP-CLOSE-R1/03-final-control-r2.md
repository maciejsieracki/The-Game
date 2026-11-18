# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — Final Control, runda 2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` wykonuje gałęzie `_activateUnit` jak pin `07d2fbd72`. Zakres r2 (DODATEK r2, D-K5C-r2-1..4): C-FLANK (T4d), `_cavalryAction`, akcja `BattleAction::Move` dla I5; strzelec i odwrót wg kolejności D-K5C-r2-1.
ZMIANY/COMMIT: ocenione SHA `e4fddd050` (gałąź `obrona/k5loop-close-r2`). Łańcuch: BAZA r2 `0941c8225` (= obecny `origin/rust-port/parity-v2`) → Operator r2 `ff9a7aaa6` → Evaluator r2 `526b746e0` → Obrona r2 `e4fddd050`. Oba `merge-base --is-ancestor` (baza → obrona, Operator → obrona) dają OK, więc możliwy jest FF. FC nie zmienia kodu, dodaje tylko ten raport (commit FC na gałęzi `fc/k5loop-close-r2b`).
TESTY: odtworzone samodzielnie, wyniki niżej.
BLOKADY: brak blokujących. Punkt (3) D-K5C-r2-1 (strzelec i odwrót) jest jawnie przeniesiony do rundy 3.
RUNDY: 2/5. Werdykt Evaluatora r2: FAIL (Z1). Obrona r2 naprawiła Z1. FC r2: PASS-WITH-NOTES.
NASTĘPNY KROK: integracja przez orkiestratora (FF `parity-v2` ← commit FC). Potem runda 3 tego samego ID: `_rangedAction` `:6656` i `_fallBackStep` `:7228` (strażnik `strzelec`), potem `PhalanxAction` `:6546-6578` i `Flee`/`_fleeStep` `:9845`.
DEPLOY/PUSH: NIE WYKONANO

## Bramki (odtworzone przez FC)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad `fc_k5c_r2_tgt`, usunięty po bramkach. Wolne miejsce przed pełną bramką: 11,3 GB (`df -B1M`: 11324 MB). W trakcie spadło do 3,2 GB, bo równolegle budowali inni workerzy. Pełna bramka i tak skończyła się poprawnie.

| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | brak ostrzeżeń |
| `cargo test --test p6_k5loop_close` | 0 | 5 passed / 0 failed |
| `cargo test --test p6_k5loop_close_r2` | 0 | 6 passed / 0 failed, w tym `kawaleria_nan_move_left_zgodna_z_pinem` |
| `p6_siege*` (z logu pełnej bramki) | 0 | 40 binarek, 222 passed / 0 failed |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **0** | 529 binarek, 3959 passed / 0 failed / 1 ignored (ten sam co wcześniej, nowych `#[ignore]` brak) |
| `git diff --check 0941c8225 e4fddd050` | 0 | — |

## Wektory (reprodukcja przez FC)
Uruchomiłem `p6_k5loop_close_r2_gen.mjs` na kopii w katalogu tymczasowym, poza plikami w repo. Katalog po wszystkim usunąłem. Generator przeszedł strażnika SHA pinu i wypisał statystyki identyczne z raportami. sha256 wyników:
- `vectors_r2.json` = `2cf29030…4a5945`, bajt w bajt tak samo jak w commicie i przed obroną (760 wektorów);
- `vectors_r2_nan.json` = `2f88474f…cf69ec`, bajt w bajt tak samo jak w commicie (320 wektorów `cavalry-nan`: 283 z krokiem, 25 z ciosem, 12 bez akcji).

Sekcję NaN w generatorze dopisano po zapisie `vectors_r2.json` i nie woła `rnd`. Kopiuje wejścia scenariuszy `cavalry`, ustawia `moveLeft = NaN` i wykonuje ten sam tekst pinu, a generator sam sprawdza, że pin robi najwyżej 1 krok. To jest wykonanie pinu, nie reimplementacja.
Przeniesienie 94 scenariuszy r1 z tagiem `krok-naprzod-flanka` (`continue` w `p6_k5loop_close.rs`) sprawdziłem niezależnie. Rodzina `flank-r1` w `vectors_r2.json` ma 120 scenariuszy, a wszystkie 120 mają wejścia (`acting/atk/def/groupMeta/tiles`) identyczne z 120 scenariuszami `flank` r1, w tej samej kolejności. W r2 wszystkie 120 mają puste `unported`. To przeniesienie asercji, a nie jej osłabienie.

## Mutacje (odtworzone przez FC)
| mutant | miejsce | wynik |
|---|---|---|
| M-Z1a: `\|\| move_left.is_nan()` → `\|\| false` | pętla C-FLANK, `siege_tactics_loop.rs:2231` | FAIL, EXIT 101, „659 rozbieżności” |
| M-Z1b: to samo | pętla `_cavManeuverStep`, `:2283` | FAIL, EXIT 101, „brak końca w 90 s” (strażnik czasu działa, binarka się nie zawiesza) |

Po obu mutantach przywróciłem plik z kopii (`cmp` zgodny, 3 wystąpienia `move_left.is_nan()`) i drzewo jest czyste. Wynik mutanta M7 (wyłączenie emisji `Move` → FAIL) przyjmuję z raportu Evaluatora r2.

## Allowlista i zakazy (`git diff --stat 0941c8225 e4fddd050`)
Zmienione pliki:
- `siege_tactics_loop.rs`;
- `siege_tactics_actions.rs` (D-K5C-r2-2: wariant `Move`, `ActionError::MoveWithoutDto`, ramię w `actions_to_dto`);
- `tests/p4_1i3_actions.rs`: tylko mechaniczne ramię `match` dla `Move`, jawnie wypisane, co dopuszcza D-K5C-r2-2;
- `tests/p6_k5loop_close.rs`, `p6_k5loop_close_r2.rs`, `p6_k5loop_close_r2_gen.mjs`, `vectors_r2.json`, `vectors_r2_nan.json`;
- raporty w katalogu runs.

Nie ruszono: `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`, `p6_siege_tactics_loop*`, `vectors.json` r1. Klocki T4/T5/T6/T7 nie mają diffu, więc D-K5C-3 jest dotrzymane. Nowych `#[ignore]` nie ma. W commitach nie ma `Co-Authored-By` z nazwą modelu (#289).

## Rozstrzygnięcie zarzutów

| zarzut | źródło | rozstrzygnięcie FC | uzasadnienie |
|---|---|---|---|
| Z1: `moveLeft = NaN` w pętli jazdy daje wiele kroków albo zawieszenie | Evaluator r2 | **ODDAL** (naprawiony, zweryfikowany) | Pin w callbacku `_doMove` (`battleScene.ts:6439`, `:6496`) kontynuuje tylko przy `ru.moveLeft > 0`, co sprawdziłem w tekście pinu. Rust ma teraz w obu pętlach `move_left <= 0.0 \|\| move_left.is_nan()`, czyli dokładną negację. Pozostałe miejsca są zgodne: pierwszy krok `gate` przepuszcza NaN jak `if (ru.moveLeft <= 0) return false` w `:6429`/`:6458`, a szarża ma `move_left > 0.0` (`:6403-6409`). Zgodność potwierdza 320 wektorów pinu, a oba mutanty dają FAIL. |
| Z2: punkt (3) D-K5C-r2-1 (strzelec `:6656` i odwrót `:7228`) nie zrobiony | Evaluator r2 | **ODDAL** jako blokadę tej rundy, z obowiązkiem w r3 | Kryteria końca dispatchu dopuszczają niepełną rundę z jawną listą gałęzi i linią pinu. Lista jest w `01-operator-r2.md` i `02a-obrona-r2.md`. Strażnik `strzelec` jest jawnym tagiem `unported`, nie cichym pominięciem. Cel końcowy („`unported` puste”) NIE jest jeszcze osiągnięty, więc temat nie jest zamknięty i runda 3 zaczyna od tego punktu. |
| U1: nazwa licznika `flank_already` | Evaluator r2 | **ODDAL** (poprawione) | Pole nazywa się teraz `flank_bez_ruchu_0ms`, z komentarzem, a próg `>= 20` się nie zmienił. Gałąź `:8212-8214` pokrywa osobny test. |
| U2: `actions_to_dto` → `Err(MoveWithoutDto)` | Evaluator r2 | **ODDAL** (świadomy kontrakt do I5) | Jest jawny błąd i test negatywny `move_bez_dto_to_jawny_blad`. Wymaganie dla I5 jest zapisane. |
| U3: brak `MoveTerrain` = tura jazdy bez akcji (`kawaleria-brak-terenu`) | Evaluator r2 | **ODDAL** (wymaganie dla #113) | Jest jawny tag i test. #113 musi podawać produkcyjny teren. |
| U4: `cios-bez-szablonu` przy innym celu niż szablon | Evaluator r2 | **ODDAL** (wymaganie dla #113) | Jest jawny tag. Adapter #113 musi budować szablon dla celu wybranego przez T6. |
| U5: NIE_ZMIERZONO (240+70 ms, `attackDirection` `:8402`, priorytety UI) | Operator r2 | **ODDAL** | To jest zgodne z D-K5C-r2-3 i D-K5C-r2-4. |

Liczba zarzutów NAPRAW: 0. Liczba DO DECYZJI CZŁOWIEKA: 0.

## Uwagi dla orkiestratora (nieblokujące)
- N1: `parity-v2` nadal wskazuje `0941c8225`, więc integracja jest czystym FF na commit FC (zawiera `e4fddd050`).
- N2: wymagania przekazane do #113/I5: (a) `MoveTerrain` jest obowiązkowy; (b) szablon ciosu dla celu z T6; (c) `BattleActionDto` dla `Move` dostarcza I5, do tego czasu nie wolno wołać `actions_dto` z produkcyjnej pętli z ruchem.
- N3: dysk jest wąskim gardłem. W trakcie tej bramki wolne miejsce spadło do 3,2 GB przez równoległe buildy.
