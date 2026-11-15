STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B2-Q1
GOAL: strzal wiezy oblezniczej (_fireOneTower): cel w chwili strzalu, _singleBlow ranged ze statystykami najmocniejszego strzelca epoki, sprawdzenie destroyed.
ZMIANY/COMMIT: oceniany SHA 64ddbd19dd4ec45c56d9d2b7fb855ee606062373 (przodek: af7a0be6a operator -> 64ddbd19d obrona; baza 14d5e50b9 jest przodkiem, potwierdzone merge-base --is-ancestor). Allowlista zachowana (git diff --name-only 14d5e50b9..HEAD: 01/02a raporty, siege_tactics_loop.rs, 4 pliki testow, p6_wieze_2b2.rs). Cargo.lock nieskomitowany.
TESTY (odtworzone samodzielnie): cargo fmt --check EXIT 0; cargo test --test p6_wieze_2b2 9/9 ok. Pelny cargo test (3373 passed, 0 failed) i clippy -D warnings EXIT 0 - wynik Evaluatora/Operatora dla af7a0be6a; obrona zmienila wylacznie plik testowy, pelny test po obronie NIE_ZMIERZONO przeze mnie.
BLOKADY: patrz rozstrzygniecie zarzutow.
RUNDY: 1/5
NASTEPNY KROK: runda 2 Operatora (to samo ID, baza 64ddbd19d), zakres wylacznie pozycje NAPRAW nizej.
DEPLOY/PUSH: NIE WYKONANO

## Rozstrzygniecie zarzutow
1. Brak wektorow z pina, tautologia oczekiwania (kryterium 4 dispatchu: wektory z generatora LUB wartosci pina z cytatem linii) -- NAPRAW. Test liczy oczekiwanie ta sama funkcja single_blow_full; zadna wartosc nie pochodzi z pina. Dodac p6_wieze_2b2_gen.mjs + wektory ze straznikiem SHA-256, albo wartosci pina z cytatem linii.
2. Szablon strzelca neutral_tower_shot_template() zamiast towerShooterRow z strongest_ranged_unit_for_era -- NAPRAW. Zakres pkt 1 i zalozenie dispatchu (dane strzelca z city_towers dla epoki/nacji obroncy) niezrealizowane; produkcyjnie Some(neutral) daje obrazenia spoza pina (naruszenie zasady 9, parytet 1:1). Podpiac city_towers::strongest_ranged_unit_for_era -> FullBlowInput; brak wiersza -> None.
3. destroyed jako !wall_tile_rows.contains(row) -- ODDAL. Dowod obrony zgodny z pinem 07d2fbd72 (battleScene.ts:4194-4198, 4216, 7646-7648; wallTileHp.set tylko przy init/uszkodzeniu): destroyed <=> brak kafla. Ograniczenie testu (wylom symulowany czyszczeniem wektora) jawne, brak funkcji wylomu w tym zakresie.
4. Brak kroku czerwonego przed zmiana -- ODDAL. Baza nie kompiluje testow (brak symboli), czerwony bylby artefaktem; NIE_ZMIERZONO udokumentowane.
5. hit_arc Front i first_blow_of_pair true na sztywno -- ODDAL (zalezy od portu facing/_nearestEnemy, osobny temat K5LOOP-FACING); jawny dlug, do wpisu w rejestrze.
6. tower_blow tylko dopisuje do unported, brak wpisu w rejestrze -- ODDAL orkiestratorowi (wpis wieza-resolveBlowOutcome-efekty wg tekstu z 02a; plik poza allowlista).
7. Brak testu gałezi dead/fading w tower_hit -- rozwiazane obrona (3 testy, mutacja zweryfikowana przez Obrone); ODDAL (zamkniete).
8. Test TOWER_FLY_MS asercja >= nie wykrywa wydluzenia -- NAPRAW (drobne, ta sama runda): zmienic na dokladne ==380 po wystrzale (zegar wirtualny deterministyczny).
9. Bramki -- potwierdzone wyzej, nie jest zarzutem.

Werdykt: FAIL (NAPRAW: 1, 2, 8).

---

# FINAL CONTROL r2 (WIEZE-2B2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B2-Q1
GOAL: strzał wieży oblężniczej (`_fireOneTower`) z danych strzelca `city_towers`, wektory z pinu, bez tautologii
ZMIANY/COMMIT: SHA oceniany `6aa9b154e713cf6b4d26511b3644d86e296cb023`; ancestry względem bazy `ef8eeedc9`: baza JEST przodkiem (merge-base = ef8eeedc9). Allowlista zachowana (diff: siege_tactics_loop.rs, p6_wieze_2b2.rs, p6_wieze_2b2_gen.mjs, p6_wieze_2b2_vectors/vectors.json, raporty w runs/R-RUSTPORT-P6-WIEZE-2B2-Q1). `gra/`, Cargo.toml nietknięte; Cargo.lock nieskomitowany. Brak `#[ignore]` w zmienionych plikach.
TESTY (zmierzone samodzielnie przez FC na 6aa9b154e): pełny `cargo test --no-fail-fast` EXIT=0, passed=3380 failed=0 ignored=1 (ignorowany nie z tego tematu); `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo fmt --check` EXIT=0; generator `p6_wieze_2b2_gen.mjs` odtwarza `vectors.json` bez zmian w drzewie (strażnik SHA-256 przechodzi; 240 przypadków, 105 strzałów).
BLOKADY: brak
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree, ancestry, pełny test), wpisy w REJESTR-RUST
DEPLOY/PUSH: NIE WYKONANO

## Rozstrzygnięcie zarzutów Evaluatora r2

| # | Zarzut | Decyzja | Uzasadnienie |
|---|---|---|---|
| 1 | wejście do single_blow_full nie asertowane vs pin | ODDAL (naprawione w Obronie) | test asertuje kategoria, hp, Jednostka, ranged, cel, opóźnienie z wektorów; 4 kształty wiersza |
| 2 | 380 ms tautologia | ODDAL (naprawione) | opóźnienie mierzone `due - now` w kolejce zegara, porównane z `expectDelayMs` z pinu |
| 3 | tower_setup_from_units bez wołającego | ODDAL | dług wiringu #113/#116/#146, poza zakresem tematu (dispatch r2 pkt 1 wymaga wejścia z danych, nie wpięcia w produkcję); orkiestrator wpisuje do REJESTR-RUST |
| 4 | Typ/hp nie testowane vs pin | ODDAL | pokryte wektorami (kategoria, hp) i formułami pina na 486 przypadkach city_towers; Health jako napis: w `units.json` brak napisowych Health (zmierzone grepem), ryzyko niskie, dług jawny |
| 5 | czerwień kompilacyjna | ODDAL | dispatch pkt 3 spełniony kodem wyjścia 101; dowód behawioralny przez mutacje M1-M3 (Obrona) |
| 6 | NIE_ZMIERZONO pełny test | ODDAL (zmierzone) | FC zmierzył: 3380/0/1, EXIT 0 |
| 7 | długi hit_arc/first_blow/_resolveBlowOutcome/destroyed-proxy | ODDAL | jawne długi zgodne z dispatchem r2 pkt 4 |

Brak NAPRAW. Brak DO DECYZJI CZŁOWIEKA.

## Notatki (długi do rejestru, nie blokują)
- wiring produkcyjny `tower_setup_from_units` (#113/#116/#146)
- `Health` jako napis (JS `Number("10")`=10, Rust hp=1): brak takich wierszy w `units.json`
- wynik liczbowy ciosu wieży z pina niezweryfikowany (test okablowania, nie parytetu matematyki); hit_arc/first_blow stałe (#107/#178); `_resolveBlowOutcome` (#109/#147); moment zastosowania trafienia w klatce nieasertowany
