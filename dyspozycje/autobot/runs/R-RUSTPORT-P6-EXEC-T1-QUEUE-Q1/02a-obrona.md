STATUS: INTEGRATION_PENDING
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1 (runda 1, obrona Operatora)
GOAL: odpowiedz na 4 zarzuty Evaluatora do r1 (commit operatora 9b8ef8560).
ZMIANY/COMMIT: NIE_ZMIERZONO (brak commita obrony). Zmiany na dysku, jeszcze niezacommitowane:
  - rust-port/engine/tests/p6_player_order_queue_gen.mjs: +7 linii, cztery nowe scenariusze:
    acted_przed_busy_nie_odracza, dead_przed_busy_nie_odracza, routed_przed_busy_nie_odracza
    (busy [false,true,false]), busy_planowanie_dwa_razy (planning, busy [true,true,false]).
  - rust-port/engine/tests/p6_player_order_queue_vectors/vectors.json: regenerowany generatorem
    z pinu 07d2fbd72; 19 scenariuszy (bylo 15); fragment sha256 bez zmian
    db40eb37544c98982858347cb3f60165ce79dc1ce66151938f77e37dc76c76cf; istniejace 15 wektorow nietkniete
    (diff tylko dopisuje 174 linie).
  - src/domain/player_order_queue.rs: bez zmian wzgledem 9b8ef8560 (po mutacji a1 przywrocone przez Edit, do potwierdzenia git diff).
TESTY:
  - Przed mutacjami (kod operatora + nowe wektory): cargo test --test p6_player_order_queue: 4 passed (przeprowadzone przed zablokowaniem Basha, potwierdza zielone wektory z 19 scenariuszami).
  - Mutacja a1 (usuniety warunek !u.acted z filtra startowego, linia 88): FAIL. Wektor acted_przed_busy_nie_odracza:
    left ["suspend:false","schedule:40","perform:B","refresh"], right ["suspend:false","perform:B","refresh"].
    Dowod, ze mutant jest odrozniany przez busy (zarzuty 1 i 2 przyjete dla a1).
  - Mutacje a1-dead (bez !u.dead w filtrze startowym) i a1-routed (bez !u.routed): NIE_ZMIERZONO. Uruchomienie cargo zablokowane
    (Bash niedostepny: classifier bez werdyktu, kilka prob). Wektory dead_przed_busy_nie_odracza i routed_przed_busy_nie_odracza
    sa napisane pod ten sam mechanizm, ale ich czulosc NIE jest jeszcze zmierzona.
  - Bramki pelne (fmt --check, clippy -D warnings, cargo test --all-targets --no-fail-fast): NIE_ZMIERZONO po dodaniu wektorow.
BLOKADY:
  - Brak dostepu do Basha w tej rundzie obrony (classifier bez werdyktu). Bez niego nie zrobiono: mutacji a1-dead i a1-routed,
    pelnych bramek, commita i push. Kolejne uruchomienie musi wykonac te kroki.
ODPOWIEDZI NA ZARZUTY:
  1. (mutacja a1 nie jest równoważna) PRZYJMUJĘ. Dowód: wektor acted_przed_busy_nie_odracza daje FAIL dla a1 (wynik wyzej).
     Operator w r1 blednie uznal a1 za rownowazny, bo pominal skutek uboczny odczytu `busy` w runNext.
  2. (brak wektora dla dead/routed z busy) PRZYJMUJĘ. Dodano wektory dead_przed_busy_nie_odracza i routed_przed_busy_nie_odracza.
     Czulosc tych wektorow na mutacje a1-dead i a1-routed NIE_ZMIERZONO (do wykonania).
  3. (nieskonczona petla w planowaniu przy stale busy, nietestowana) CZESCIOWO PRZYJMUJĘ. Dodano wektor
     busy_planowanie_dwa_razy (dwa kolejne busy w trybie planowania, petla RunNow ponawia bez odroczenia; wynik:
     suspend:false, perform:A, perform:B, refresh). Przypadku nieskonczonego NIE da sie przetestowac bez zawieszenia testu;
     pozostaje udokumentowana, znana rozbieznosc: web przepelnia stos (RangeError), Rust petla bez konca.
  4. (Evaluator nie powtorzyl pelnego cargo test --all-targets) ODRZUCAM jako zarzut do Operatora: to zakres Evaluatora.
     Operator podaje wynik pelnej bramki z r1 (3631 passed, 0 failed, 1 ignored pre-existing), ale po dodaniu wektorow
     bramka musi byc powtorzona: NIE_ZMIERZONO.
NASTEPNY KROK: (1) git checkout/diff potwierdzic, ze player_order_queue.rs == 9b8ef8560; (2) mutacje a1-dead i a1-routed z FAIL;
  (3) cargo fmt --check, clippy -D warnings, cargo test --all-targets; (4) commit jawnym git add (generator, vectors.json, 02a-obrona.md), bez Cargo.lock;
  (5) przekazac SHA do Evaluatora.
DEPLOY/PUSH: NIE WYKONANO
