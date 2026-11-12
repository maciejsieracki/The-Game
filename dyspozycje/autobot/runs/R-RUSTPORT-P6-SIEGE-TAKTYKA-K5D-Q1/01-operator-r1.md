STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5D-Q1
GOAL: Port licznika roundNo i sufitu tur wokol round_cap_verdict jako czysta maszyna stanu (stan: roundNo, cap; wejscie: werdykt/ratio; wyjscie: Continue|Finish), bez petli tur. Wektory z pinu 07d2fbd72, >= 300 przypadkow, galezie, NaN/Inf.
ZMIANY/COMMIT: baza 46c42deab (= origin/rust-port/parity-v2 po INTEG-B12), detached; lokalna gałąź robocza rust-port-wip/SIEGE-TAKTYKA-K5D-Q1-op (nie pushowana). SHA commita: patrz sekcja DEPLOY/PUSH i wiadomosc commita.
  Allowlista (zmienione/nowe):
  - rust-port/engine/src/domain/siege_tactics_roundcap.rs (nowy): RoundCapState, RoundCapStep, cap_gate, ff_cap_step, begin_turn.
  - rust-port/engine/src/domain/mod.rs (tylko rejestracja: pub mod siege_tactics_roundcap;).
  - rust-port/engine/tests/p6_siege_tactics_roundcap.rs (nowy): 7 testow (3 wektory, pokrycie, 3 jednostkowe).
  - rust-port/engine/tests/p6_siege_tactics_roundcap_gen.mjs (nowy): generator; wycina pin po liniach z asercja tresci i straznikiem SHA-256.
  - rust-port/engine/tests/p6_siege_tactics_roundcap_vectors/vectors.json (nowy, 18116 linii).
  - dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md (tylko akapit statusu K5d, +2 linie).
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5D-Q1/ (00-dispatch.md, 01-operator-r1.md).
  Zrodla pinu (07d2fbd72, SHA-256 battleScene.ts d784735e... zgodny): FF_MAX_ROUNDS :1125; _beginTurn :5631-5636 (_checkEnd :5635 przed roundNo++ :5636); _runFastForward :9415-9437 (werdykt :9424); _roundCapVerdict :9449-9464; _ffRoundCapResult :9485-9497 (werdykt :9486); bramka sufitu w _checkEnd :10199-10206. Linie z dispatchu (:9415-9437, :9486) zgodne z pinem.
  Werdykt: istniejace round_cap_verdict (siege_no_breach.rs), bez duplikacji logiki.
  Nie zmieniano: gra/**, WERSJE.md, Cargo.toml, Cargo.lock (wygenerowany lokalnie przez cargo, NIE commitowany), origin/main, rust-port/parity-v2 (brak push).
TESTY:
  - cargo fmt --check: zielone (exit 0).
  - cargo clippy --all-targets -- -D warnings: zielone (exit 0).
  - cargo test --lib: 49 passed, 0 failed.
  - cargo test --test p6_siege_tactics_end: 8 passed.
  - cargo test --test p6_siege_tactics_endcheck: 9 passed.
  - cargo test --test p6_siege_tactics_breach: 15 passed.
  - cargo test --test p6_siege_tactics_walk: 7 passed.
  - cargo test --test p6_siege_tactics_roundcap: 7 passed (wektory gate/beginTurn/ff, pokrycie, 3 testy jednostkowe).
  - Testy siege_tactics_* nie zmienione (kryterium 2): diff HEAD ogranicza sie do mod.rs i nowych plikow.
  Wektory (generator node v22.23.4, seed 217, wykonanie tekstu pinu; stuby: _armyMoraleRatio, _finishDraw, _showEndScreen, _battleUnitsForMapExport, _updateStallWatch):
  - gate: 600 przypadkow (bramka aktywna 382 = remis 77 + obronca 30 + atakujacy 33 + kontynuacja 242; bramka pominieta 218, gdy zywa jest co najmniej jedna strona z flag false).
  - beginTurn: 400 przypadkow (roundNo++ 268, werdykt bez roundNo++ 132; remis 69, obronca 33, atakujacy 30).
  - ff: 500 przypadkow (kontynuacja 348, remis 78, obronca 37, atakujacy 37; oblezenie bez wylomu 152).
  - Pule: RATIO_POOL zawiera NaN, Infinity, -Infinity, -0; roundNo {0,1,2,149,150,151,399,400,401,500} + losowe 0..500; cap {1,2,150,400,500,1000} (clamp do 400 w werdykcie).
  Pokrycie galezi (liczniki z testu pokrycie_galezi_wektorow, stdout): "begin: roundNo++" 268; "begin: werdykt (bez roundNo++)" 132; "ff: atakujacy" 37; "ff: kontynuacja" 348; "ff: oblezenie bez wylomu" 152; "ff: obronca" 37; "ff: remis" 78; "gate: atakujacy" 33; "gate: bramka aktywna" 382; "gate: bramka pominieta (zywe nie obie)" 218; "gate: kontynuacja" 242; "gate: oblezenie bez wylomu" 133; "gate: obronca" 30; "gate: remis" 77.
  Galezie kodu nowego modulu: cap_gate (zywe nie obie / obie) - pokryte; ff_cap_step (Some/None) - pokryte; begin_turn (Finish / Continue) - pokryte; round_cap_verdict galezie (bez wylomu: ponizej/na sufitcie; z wylomem: ponizej/na sufitcie; morale <= / >) - pokryte przez wektory ff i testy limit_400.
  NaN/Inf: wektory zawieraja NaN i +-Infinity w ratio; test limit_400_bez_oblezenia sprawdza NaN -> atakujacy (JS NaN <= x jest false).
  Naprawiony blad generatora w trakcie rundy: mapowanie zwyciezcy w bramce bylo odwrocone (obronca -> aliveA=false, wiec zwyciezca = obronca). Poprawka przed commitem; test wykryl rozjazd i zostal zielony po poprawce.
BLOKADY:
  - Pelna pętla tur nie jest portowana (wymog dispatchu: NIE wiazac z petla tur). Wpiecie do _checkEnd/_beginTurn: K5c/K5f.
  - Blok stall (:10172-10188) i reszta _checkEnd (:10208-10240) poza zakresem tego klocka (K5c). Gdy jedna strona martwa, cap_gate zwraca Continue, a zakonczenie robi wywolujacy.
  - Efekty sceny (log, _finishDraw, _showEndScreen, _endSurvivors, _startRout) poza modulem. Wejscia ratio sa jawne (web liczy je leniwie; wywolujacy podaje wartosc po ewentualnym _startRout).
  - _updateStallWatch (:5634) w generatorze stub (K5b).
  - Zachowanie gry bez zmian: modul nie jest jeszcze wywolywany przez zaden kod produkcyjny (NIE_ZMIERZONO w runtime).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) przeglad commita; potem Final Control. Integracja wylacznie przez orkiestratora po FC.
DEPLOY/PUSH: NIE WYKONANO (brak push; brak integracji; wymagana osobna autoryzacja po READY_FOR_DEPLOY).
