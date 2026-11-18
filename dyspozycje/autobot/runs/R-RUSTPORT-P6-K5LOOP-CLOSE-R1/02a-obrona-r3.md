# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — runda 3, Operator (obrona)

STATUS: PASS-WITH-NOTES (zarzut N1 przyjęty i poprawiony wektorem pinu plus testem, mutant E11 teraz zabity; N2 przyjęty i poprawiony w generatorze; N3, N4 i N5 bez zmian w kodzie, z uzasadnieniem niżej)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1 (DODATEK r3)
GOAL: `ProdBody::unported` puste dla scenariuszy z pinu; każda dotąd pominięta gałąź ma wektor z pinu (r3: strzelec, odwrót, falanga)
ZMIANY/COMMIT: patrz sekcja „Commit” (jeden commit nad commitem Operatora `1e67ae15c`, gałąź `obrona/k5loop-close-r3`). Kod produkcyjny (`src/**`) bez zmian.
TESTY: fmt/clippy EXIT 0; p6_k5loop_close_r3 6 passed; pełny engine EXIT 0 (3965 passed, 0 failed, 1 ignored spoza tematu); mutant E11 daje FAIL
BLOKADY: brak
RUNDY: 3/5 (obrona)
NASTĘPNY KROK: Final Control r3 (`03-final-control-r3.md`); r4 tego ID: `_fleeStep` i `strzelec-bez-strzelania` (N5)
DEPLOY/PUSH: NIE WYKONANO

Badany commit: Operator `1e67ae15c` (nad BAZĄ r3 `7bd030ead`). Raport Evaluatora: `02-evaluator-r3.md` (lokalny `ca9840350` na `eval/k5loop-close-r3`).

## Odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź |
|---|---|---|
| 1–5 | Ustalenia Evaluatora: allowlista, bramki, wektory bajt w bajt, zgodność z D-K5C, mutanty E7, E8 i M8 | Bez sporu. To ustalenia, nie zarzuty. |
| N1 | Mutant E11 przeżywa: KITE „przyparty” (`:6719-6721`) z `_rangedTargetInRange ?? nearest` podmienione na `nearest`. Brak wektora z remisem odległości i niższym HP dalej na liście. | **PRZYJMUJĘ.** Dodałem wektor i test, dowód niżej. |
| N2 | Raport podaje dla falangi „stoi 55”, a generator drukuje `phalanxHold=65`. Nazwa licznika nie mówi, co liczy (lekcja r2 b). | **PRZYJMUJĘ.** Poprawka w generatorze, dowód niżej. |
| N3 | Obrażenia strzału nie są porównywane (atrapa `_singleBlow` zwraca 0). | **ODRZUCAM jako wadę r3.** Evaluator sam to akceptuje. Jest to jawnie w NIE_ZMIERZONO (3) w `01-operator-r3.md:97`, a formułę obrażeń pokrywają wektory K5I i `body_pin`. Tutaj sprawdzane są cel, chwila, łuk i liczba rzutów. Bez zmian. |
| N4 | Gałęzie strzelca, odwrotu i falangi bez `MoveTerrain` dostają tag także wtedy, gdy pin terenu nie potrzebuje (np. cios falangi z sąsiadem). | **ODRZUCAM jako regresję, przyjmuję jako wymaganie dla #113.** To świadoma reguła D1 K5DOC-T4e-0, ta sama co `kawaleria-brak-terenu` w r2. Brak terenu daje jawny tag zamiast częściowego wykonania. Pilnuje tego test `bez_terenu_jawne_tagi`. Dispatch r3 („Wymagania dla #113/I5”) ustala już, że `MoveTerrain` jest w adapterze obowiązkowy. Evaluator też pisze, że to nie regresja. Bez zmian w kodzie. Wymóg dla #113 jest zapisany w `01-operator-r3.md:97` (NIE_ZMIERZONO 5). |
| N5 | `_fleeStep` (`:9845-9895`) i `strzelec-bez-strzelania` przechodzą na r4. Cel „unported puste” nie jest jeszcze osiągnięty dla ucieczki. | **PRZYJMUJĘ jako zakres r4, nie jako wadę r3.** DODATEK r3 dopuszcza ten podział („zrób 1, potem 2, i wypisz jawnie, co zostaje na r4”). Lista na r4 z liniami pinu: (1) `Flee` → `_fleeStep` `battleScene.ts:9845-9895` razem z `_removeUnitFromScene` (`:9910`), ripple `_shakeAlliesOnLoss` i stanem `fleeStuck`; tag `ucieczka-routed`. (2) Strzelec z `shootingEnabled=false`: `:6241` (nie wchodzi w `_rangedAction`), ścieżka wręcz z zasięgiem w `_targetInRange`/`_canAttackFrom` `:8373-8377`, `:8436`; tag `strzelec-bez-strzelania`. Te dwa tagi zostają w `unported` jawnie. |
| Proces | Dysk spadł do 7,4 GB przy pełnej bramce, bo równolegle działali inni workerzy. | Przyjmuję do wiadomości. Przed pełną bramką obrony było 8,5 GB wolnego (≥ 8 GB, zgodnie z dispatchem). Mój `CARGO_TARGET_DIR` usunąłem po bramkach. |

## N1: dowód

- Pin `:6719-6721`: `const tgt = this._rangedTargetInRange(ru) ?? nearest;`. `_rangedTargetInRange` (`:7041-7052`) przy remisie odległości bierze niższe HP (`dd === bestD && best && e.bu.hp < best.bu.hp`). `_nearestEnemy` (`:8296-8304`) przy remisie zostaje przy pierwszym na liście (`dd < bestD`).
- Generator `p6_k5loop_close_r3_gen.mjs`, nowa sekcja `tieCases` na końcu pliku. Jest 8 ręcznie ułożonych scenariuszy, bez wywołań `rnd`, więc pliki r3 i r3_nan się nie zmieniają. W każdym jest strzelec z amunicją (`primaryRanged`, `rangedKite`), zagrożenie wręcz w `MELEE_SAFE_GAP`, wszystkie 4 sąsiednie pola nieprzechodnie (`_bestKiteShotStep` zwraca null, więc jednostka jest przyparta) i dwaj wrogowie w remisie odległości, z niższym HP dalej na liście. Warianty obejmują: obie strony, zasięg 1/2/3/4/6, remis na 1 i na 2, wrogów strzelców w remisie (nie są zagrożeniem) oraz `moveLeft` 0, 2.5 i NaN. Oczekiwanie pochodzi z wykonania tekstu pinu (strażnik SHA wycinków `2bba6a05…` bez zmian). Generator przerywa pracę, gdy cel pinu jest równy `nearest`, gdy jednostka zrobi krok albo gdy nie wejdzie w `_rangedAction`. Wynik to `tests/p6_k5loop_close_vectors/vectors_r3_tie.json` (8 wektorów). Cele pinu: 1, 1, 1, 1, 2, 1, 2, 2; `nearest` = 0 we wszystkich.
- Test `kite_przyparty_remis_odleglosci_nizsze_hp` w `tests/p6_k5loop_close_r3.rs` przepuszcza każdy wektor przez `check_case` (cel, chwila, łuk, facing, rzuty, stan końcowy, `unported` puste). Dodatkowo sprawdza, że jest dokładnie 1 strzał, 0 kroków i brak ciosu, oraz że cel pinu ≠ `nearest`.
- **Mutant E11 odtworzony**: w `siege_tactics_loop.rs` w gałęzi „Przyparty” `ranged_target_now(..).unwrap_or(ni)` podmieniony na `ni`. Wynik: `kite_przyparty_remis_odleglosci_nizsze_hp ... FAILED` (40 rozbieżności), a pozostałe 5 testów `p6_k5loop_close_r3` przechodzi. To potwierdza lukę z zarzutu i to, że nowy wektor ją zamyka. Plik przywrócony z kopii, `git status` bez zmian w `src/`.

## N2: dowód

`p6_k5loop_close_r3_gen.mjs` (statystyki):
- `phalanxNoAttackNoStep` = falanga bez ciosu i bez kroku, łącznie z samotnym marszem `phalanxAdvance` bez kroku. To jest dawny licznik `phalanxHold`, teraz z nazwą zgodną z tym, co liczy: **65**.
- `phalanxHold` = rozłączna kategoria testu `phalanx_no_action` (bez ciosu, bez `phalanxAdvance`, bez jednego kroku): **55**. Zgadza się z „stoi 55” w `01-operator-r3.md:54` i z licznikiem w teście.
- Po regeneracji tablica `cases` w `vectors_r3.json` jest identyczna (porównanie JSON z `HEAD`: `cases same True`). Zmienił się tylko obiekt `stats`. Test nie czyta `stats`. `vectors_r3_nan.json` jest bajt w bajt bez zmian. Wektory r1 i r2 nie są dotknięte.

## Bramki (env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p6_k5loop_close_r3`: 6 passed (było 5, plus nowy test N1)
- `p6_siege*` (z logu pełnej bramki): 40 binarek, 0 failed; `p6_k5loop_close` 5 passed, `p6_k5loop_close_r2` 6 passed
- pełny `cargo test --all-targets --no-fail-fast` (engine, w tle `setsid nohup`, EXIT w logu): **EXIT=0**, 530 binarek, 3965 passed, 0 failed, 1 ignored (wcześniejszy `p6_order_lane dump_tick1`, spoza tematu). Względem Evaluatora (3964) przybył nowy test N1. Wolne miejsce przed bramką: 8,5 GB, po usunięciu targetu: 16 GB.

## Allowlista

Zmienione pliki: `rust-port/engine/tests/p6_k5loop_close_r3.rs`, `rust-port/engine/tests/p6_k5loop_close_r3_gen.mjs`, `rust-port/engine/tests/p6_k5loop_close_vectors/vectors_r3.json` (tylko `stats`), nowy `rust-port/engine/tests/p6_k5loop_close_vectors/vectors_r3_tie.json`, ten raport. Wszystkie mieszczą się w allowliście DODATKU r3 (`p6_k5loop_close_r3*.rs/.mjs`, `vectors_r3*.json`, katalog runs). Bez `#[ignore]`, bez osłabiania asercji, bez zmian w `src/`, `Cargo.*`, `gra/**`, `data/**`. Commit bez linii Co-Authored-By (#289).

## Commit

Commit zawierający ten raport (gałąź `obrona/k5loop-close-r3`, rodzic `1e67ae15c`). SHA jest podany w wyniku obrony dla orkiestratora, bo commit nie może zawierać własnego SHA.
