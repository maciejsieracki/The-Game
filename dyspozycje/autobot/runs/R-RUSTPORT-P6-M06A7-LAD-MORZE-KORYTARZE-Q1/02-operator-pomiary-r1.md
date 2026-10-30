STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1
GOAL: Operator-pomiary partii 1 (pangeaAnnularMaxCorridorWidth :4329, isPangeaBridgeWater :4371): weryfikator niezalezny, mutacje, pomiar granic, gate'y na commicie 689d6ecc.
ZMIANY/COMMIT: Baza: 689d6ecc (detach). Dodane: dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1/{verify-m06a7-independent.py, mut-runner-m06a7.py, mut-results-m06a7.json, 02-operator-pomiary-r1.md, gate-fmt-m1.log, gate-clippy-m1.log, gate-test-m1.log}; zmodyfikowane: dyspozycje/rust-port/p6/P6-M06A7-LAD-MORZE-KORYTARZE.md (sekcja "Pomiary"). Kod (landsea.rs, derived.rs, JSON, testy, wektory) NIE zmieniony. Commit: patrz nizej (SHA po commicie). Cargo.lock nieśledzony, nie dodany.
TESTY:
- cargo fmt --all -- --check: EXIT=0 (gate-fmt-m1.log)
- cargo clippy --all-targets -- -D warnings: EXIT=0 (gate-clippy-m1.log)
- cargo test (pelny silnik): 1330 passed, 0 failed, EXIT=0 (gate-test-m1.log)
- Weryfikator niezalezny (Python, formula web od zera): 112 254 wierszy annular, 0 rozbieznosci; 7 wierszy nieskonczonych zgodne; bridge 8/8 zgodne.
- Mutacje: 19 mutantow (K1-K10, B1-B4, D1-D5), 17 zabitych (exit 101), 2 przezyly:
  - K5 round -> floor(x+0.5): przezyl. Rownowaznosc na domenie wektorow: 0 rozbieznosci; margines frac(x) od 0.5 >= 5.4e-7 (dowod ulp w dossier). Rozni sie tylko w pasie ~1e-15 - ryzyko zapisane.
  - D4 annular_min 6 -> 5: przezyl. Dowod rownowaznosci z kodu: map_scale >= 0 lub NaN, baza 6, mnoznik 2.6 > 0 => round >= 6 => dolny clamp nieaktywny.
- Pomiar graniczny: progi k+0.5 (k=6..22) maja po ok. 720-780 punktow siatki po kazdej stronie w pasmie 0.05; dokladny tie raw==12.5 (k=12) trafiony. Liczby z rundy 1 (15 284 / 4 621) NIE odtworzone: poprawne wartosci w dossier, sekcja "Pomiary".
- Dla N-1/N/N+1: dla kazdego progu zaokraglenia i klampu 6/22 wystepuja punkty po obu stronach; porownania `<`/`>=` w js_round i clampach pokryte mutantami K1, K2, K9, K10 (wszystkie zabite poza K5 i D4 z dowodem).
- Stare kategorie wektorow jako prefiks: NIE DOTYCZY (partia 1 nie ma poprzednich kategorii).
BLOKADY: Brak technicznych. Ryzyka (nie blokady): K5 przezyl z dowodem na domenie, D4 martwy clamp przy obecnych danych. Liczby granicy z rundy 1 nieodtworzalne (ZALOZENIE: przyjeto pomiary z tego raportu jako obowiazujace).
RUNDY: 1/5 (Operator-pomiary runda 1; runda Operator-impl = 1/5 zuzyta wczesniej, ta sama numeracja tematu)
NASTEPNY KROK: Evaluator (sprawdzenie dowodow K5/D4 i pomiarow), potem Final Control; partia 2 = groupDryLandMassKeys.
DEPLOY/PUSH: NIE WYKONANO
