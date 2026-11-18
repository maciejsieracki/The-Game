# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — Final Control, runda 4

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5: każde `ActivateEvent` wykonane wg pinu albo jawnie oznaczone; `unported` puste dla scenariuszy wektorowych pinu (DODATEK r4: `_fleeStep` + `_removeUnitFromScene` + ripple `_shakeAlliesOnLoss`, tag `strzelec-bez-strzelania`).

## Podstawa orzeczenia
- BAZA r4 (dispatch, linia „BAZA r4”): `38f5939e2c74f553c5f1c3928ee7a66cf1f0df5a`. `git merge-base --is-ancestor 38f5939e2 3c5a8be9d` = TAK.
- Oceniany commit (koniec łańcucha r4): `3c5a8be9dd10d6c81d2d36df030894e7182e63ca` (Obrona), nad `eca5edefb` (Evaluator), `76a483a1a` (raport Operatora), `aeb9cfcf1` (kod Operatora).
- Pin `07d2fbd72`, `gra/src/battle/battleScene.ts` czytany przez `git show` (`:9743-9925`, `:8430-8495`, `:1450-1460`).
- Informacyjnie dla integracji: `origin/rust-port/parity-v2` przesunął się na `d21caf8f2`; zawiera bazę `38f5939e2`, nie dotyka plików kodu tego tematu, `git merge-tree --write-tree d21caf8f2 3c5a8be9d` = bez konfliktów.

## Allowlista (zweryfikowana samodzielnie, `git diff --name-only 38f5939e2 3c5a8be9d`)
| plik | ocena |
|---|---|
| `rust-port/engine/src/domain/siege_tactics_loop.rs` | allowlista |
| `rust-port/engine/src/domain/siege_tactics_actions.rs` | allowlista r4: tylko warianty `Leave`, `Shaken`, `LeaveWithoutDto`, `ShakenWithoutDto` i dwa ramiona `actions_to_dto` (diff przeczytany; istniejące warianty bez zmian) |
| `rust-port/engine/tests/p4_1i3_actions.rs` | mechaniczne ramiona `match` (+14/−0), dozwolone w r4 |
| `tests/p6_k5loop_close_r4.rs`, `p6_k5loop_close_r4_gen.mjs`, `vectors_r4.json`, `vectors_r4_nan.json` | nowe pliki r4 |
| `01-operator-r4.md`, `02-evaluator-r4.md`, `02a-obrona-r4.md` | katalog runs |

Poza allowlistą: BRAK. `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`: nietknięte. Wektory r1/r2/r3 nie występują w diffie (sha256: `vectors.json` 798a2f94…, `vectors_r2.json` 2cf29030…, `vectors_r2_nan.json` 2f88474f…, `vectors_r3.json` 9cde90b7…, `vectors_r3_nan.json` bdf9e2fd…, `vectors_r3_tie.json` 6bb4fb26…). `git diff --check`: czysto. Usunięte linie z `assert`: 0. Nowe `#[ignore]` w kodzie: 0 (4 trafienia grep to wyłącznie tekst raportów). Linie `Co-Authored-By` w commitach r4: 0 (#289).

## Bramki (odtworzone przez FC)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad `k5r4fc/tgt` (usunięty po bramkach; dysk po sprzątnięciu 14 GB wolne). Dysk przed pełną bramką: 8,1 GB (≥ 8 GB).

| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close_r4` | 0 | 7 passed (zgodność wektorów, NaN ze strażnikiem 90 s, tagi bez terenu/przy murze, `Leave`/`Shaken` bez DTO, 2 testy kontraktu `flee_after`) |
| `cargo test --test 'p6_siege*' --test p6_k5loop_close --test …_r2 --test …_r3 --test …_r4` | 0 | 44 binarki, 246 passed, 0 failed |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **0** | **532 binarki, 3995 passed, 0 failed, 1 ignored** (`p6_order_lane::e2e::dump_tick1_econ_for_web_generator`, istniał w bazie) — zgodne z Obroną |

Generator `node rust-port/engine/tests/p6_k5loop_close_r4_gen.mjs`: SHA-256 wycinków pinu `72337be6046fd0541c25dbf2bcd79d10c34e07e6bdf24136c5d6b21d80b92c48`, 1220 + 1120 wektorów, po uruchomieniu `git status` czysty (odtwarzalne bajt w bajt; `vectors_r4.json` sha256 `60d57c91…`, `vectors_r4_nan.json` `7f33f8a1…`). Liczniki: `flee` 400 (zniknięcie 190, kroki 210, ripple 109, kaskada 59), `surround` 240 (`surroundLeft` 40 — U3 Evaluatora domknięte), `nobow` 480 (strzał 279), `ammo2` 60, `steady2` 40.

## Zgodność z tekstem pinu (przegląd FC)
- `flee_run` vs `_fleeStep` `:9845-9898`: preludium (`finished`/`dead`/`fadingOut`/`removed`/`moveLeft <= 0`, NaN przechodzi), krawędź własna, kolumna `q+dir`, wiersze `[0,1,-1,2,-2]`, granice `BF_COLS`/`BF_ROWS`, `occByKey`, przejezdność, `fleeStuck += 1` / `>= 2` / `= 0`, callback z krawędzią i `moveLeft > 0` jako `<= 0 || is_nan` — zgodne. Bez rzutów RNG.
- `remove_unit_from_scene` vs `:9910-9925` i `shake_allies_on_loss` vs `:9743-9753` (pasek przed `_checkRout`, `_checkMeleeScreenLost` gdy `!primaryRanged`) — zgodne; globalna kolejność `S`/`R`/`L` sprawdzana od Obrony r4 (mutant E4 zabity).
- `reach_of` = `canShoot(ru) ? ru.range : 1` (`:8437`, `:8455`, `:8491`) — zgodne z tekstem pinu.
- Kontrakt `flee_after` (start na kopii stanu, `complete` przepisuje): twarde asercje w każdym profilu, test `should_panic` i kontrola poprawnej ścieżki; wszystkie wektory r1–r4 przechodzą z asercjami.

## Mutacje FC (`scratchpad/k5r4fc/mut.py`, testy `p6_k5loop_close{,_r2,_r3,_r4}`, `RESTORED True`)
| mutant | wynik |
|---|---|
| FC1 krawędź po kroku (callback `_doMove`) bez zniknięcia | ZABITY |
| FC2 `reach_of` ignoruje `canShoot` (zawsze `range`) | **PRZEŻYŁ** |
| FC3 `MORALE_ALLY_DEATH_LOSS` 12 → 11 | ZABITY |
| FC4 granica wierszy ucieczki `BF_COLS` zamiast `BF_ROWS` | ZABITY |
| FC5 ripple nie pomija znikających (`fadingOut`) | ZABITY |
| FC6 ucieczka pomija przejezdność pola | ZABITY |
Plus mutacje Operatora 24/24, Evaluatora 5/5 (E4 po Obronie), Obrony U5-M — zabite wg raportów.

## Orzeczenia zarzutów
| # | zarzut | orzeczenie | uzasadnienie |
|---|---|---|---|
| E-U1 | globalna kolejność `Shaken`/`Rout`/`Leave` niesprawdzana (E4 przeżył) | **ODDAL** (naprawione w Obronie) | `expect.order` w generatorze + porównanie w teście; E4 zabity; potwierdzone bramką FC. |
| E-U2 | ripple przy ZABICIU (`_resolveBlowOutcome` `:9048`, `:5937`) tylko tagiem `shakeAlliesOnLoss` | **ODDAL** w zakresie r4 | DODATEK r4 pkt 1 obejmuje ripple z `_fleeStep` (wykonany, pokryty). Ścieżka zabicia leży poza `_activateUnit`; jej wpięcie wymaga zmiany asercji w `p6_siege_tactics_loop_body_pin.rs:407/688` i `p6_k5loop_outcome_pin.rs:268/281` (poza allowlistą, zakaz osłabiania). Tag jest jawny, nie ciche pominięcie; wektory r1–r4 mają `unported` puste. Decyzja techniczna orkiestratora (reguła 8): osobny temat K5LOOP-KILL-RIPPLE PRZED #113 — bez niego gra w Rust ma mniejszy spadek morale sojuszników po śmierci jednostki niż web. |
| E-U3 | brak okrążenia kończącego się zniknięciem | **ODDAL** (naprawione w Obronie) | 40 wektorów `surround-left` + kopie NaN; licznik `surround_left >= 40`; wcześniejsze wektory identyczne. |
| E-U4 | myląca nazwa licznika `nobowShotAdjFar` | **ODDAL** (naprawione) | `nobowShotNoStep`. |
| E-U5 | kontrakt `flee_after` tylko `debug_assert` | **ODDAL** (naprawione) | twarde asercje, dokumentacja kontraktu dla #113, test `should_panic`, mutant U5-M zabity. |
| FC-1 | mutant FC2 przeżywa: brak wektora z jednostką `can_shoot = false` i `range >= 2` na ścieżce `_canAttackFrom`/C-FLANK/kawalerii (np. legionista z wyczerpanymi pilum, `rangedBase && !primaryRanged && ammoLeft = 0`) | **ODDAL** (uwaga do #113) | Kod jest jednolinijkowym odwzorowaniem pinu (`:8437`, `:8455`, `:8491`), a gałąź `false` = dotychczasowe zachowanie `reach = 1` sprzed r4 (zaakceptowane w r1–r3). To luka pokrycia testu, nie defekt kodu; zakres r4 dotyczył gałęzi `true` (strzelec z `shootingEnabled = false`), która jest zabijana mutantami N3/N4/N5. Zalecenie: w #113 (adapter podaje `range` i amunicję z danych) dodać wektor pinu z niegłównym strzelcem bez amunicji i `range >= 2` na ścieżce marszu. |
| FC-2 | NIE_ZMIERZONO: czasy rAF (D-K5C-r2-4), DTO `Move`/`Shot`/`Leave`/`Shaken` (I5), FC-U3 (`Damage` strzału) | **ODDAL** | jawnie przekazane do I5/#113 zgodnie z dispatchem r4 („nie robić tu”). |

Żadnego NAPRAW. Brak decyzji wymagających właściciela (E-U2 i FC-1 to decyzje techniczne orkiestratora).

## Cel tematu
`unported` PUSTE dla wszystkich wektorów pinu r1+r2+r3+r4 (asercja `p6_k5loop_close_r4.rs:805` i odpowiedniki r1–r3, bramka zielona). Pozostałe tagi są jawne, z linią pinu i poza wektorami: `*-brak-terenu`, `ucieczka-routed` (bez `MoveTerrain`), `ucieczka-oblezenie`, `strzal-bez-szablonu`, `cios-bez-szablonu`, `kontratak-bez-szablonu`, `shakeAlliesOnLoss` przy zabiciu, `wieza-resolveBlowOutcome-efekty`, `dowodca-*`, `kontratak-strzelec`, `doktryna`, `oblezenie`, `tryb-reczny`; `krok-naprzod-atak` nieosiągalny z dowodem r1.

## ZMIANY/COMMIT
Tylko ten raport (commit na gałęzi lokalnej `fc/k5loop-close-r4` nad `3c5a8be9d`). Kod bez zmian (mutacje przywrócone). Do integracji: `3c5a8be9d` (kod + raporty) + ten raport.

## TESTY
Jak w tabeli bramek: wszystkie EXIT 0; pełny engine 532 binarki / 3995 passed / 0 failed / 1 ignored (istniejący).

## BLOKADY
Brak.

## RUNDY
4/5

## NASTĘPNY KROK
Integracja orkiestratora (`3c5a8be9d` + raport FC na `origin/rust-port/parity-v2`, obecnie `d21caf8f2`, merge-tree czysty), `refs/keep`, sprzątanie. Następnie: K5LOOP-KILL-RIPPLE (E-U2) przed K5LOOP-WIRING (#113), w #113 kontrakt `flee_after`, `MoveTerrain`, `ammo_left`, szablony `ranged_blows` i wektor FC-1; potem I5 (DTO `Move`/`Shot`/`Leave`/`Shaken`, FC-U3).

## DEPLOY/PUSH
NIE WYKONANO
