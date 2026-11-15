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
