STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1 (runda 2, obrona Operatora po FC FAIL 9b8ef8560)
GOAL: odpowiedz na zarzuty Evaluatora (wejscie r2) do kodu Operatora; pin 07d2fbd72 (battleScene.ts:18578-18614).
BAZA: wip 3e370995e (detached), zgodnie z dodatkiem r2.
ZMIANY/COMMIT: commit obrony r2 = SHA podany w raporcie orkiestratora (po commicie); pliki:
  - rust-port/engine/src/domain/player_order_queue.rs: guard `if id.is_empty() { idx += 1; continue; }` przed odczytem
    jednostki (pin :18591-18594, `if (!id) runNext(idx + 1)`); dopisana uwaga o kontrakcie mark_acted po id (zarzut 2).
  - rust-port/engine/tests/p6_player_order_queue_gen.mjs: +2 linie, scenariusz pusty_id_pomijany.
  - rust-port/engine/tests/p6_player_order_queue_vectors/vectors.json: regenerowany generatorem z 07d2fbd72 (stdout;
    stderr ExperimentalWarning nie trafia do pliku); 20 scenariuszy (bylo 19); fragment sha256 bez zmian
    db40eb37544c98982858347cb3f60165ce79dc1ce66151938f77e37dc76c76cf.
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1/02a-obrona.md (ten plik).
  Cargo.lock nie commitowany; brak push; gra/ nietknięta.
TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
  - Czerwone przed poprawka: pusty_id_pomijany -> FAIL, left ["suspend:false","perform:","perform:B","refresh"],
    right ["suspend:false","perform:B","refresh"] (zarzut 1 potwierdzony wektorem, nie tylko opisem).
  - Zielone po poprawce: cargo test --test p6_player_order_queue: 4 passed, 0 failed (exit 0).
  - Mutacja a1-dead (usuniety !u.dead z filtra startowego, player_order_queue.rs:88): FAIL, test result FAILED,
    wektor dead_przed_busy_nie_odracza: left ["suspend:false","schedule:40","perform:B","refresh"],
    right ["suspend:false","perform:B","refresh"]. Cargo exit 101 (wynik FAILED; kod wyjscia nie zostal zapisany osobno).
  - Mutacja a1-routed (usuniety !u.routed z filtra startowego): FAIL, test result FAILED, ten sam wzorzec roznicy
    (wektor routed_przed_busy_nie_odracza). Cargo exit 101 jak wyzej.
  - Mutacja a1-acted: NIE_ZMIERZONO w tej rundzie (wynik z r1: FAIL na acted_przed_busy_nie_odracza, nie powtorzony).
  - Mutacje b (odwrocona kolejnosc) i c (brak busy-gate): NIE_ZMIERZONO w tej rundzie (wyniki z r1, nie powtorzone).
  - Bramki: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0;
    cargo test --all-targets --no-fail-fast: wynik w sekcji WYNIK BRAMKI ponizej.
  - Generator: node tests/p6_player_order_queue_gen.mjs 07d2fbd72 EXIT 0.
ODPOWIEDZI NA ZARZUTY:
  1. (brak galezi `if (!id) runNext(idx+1)`) PRZYJMUJE. Poprawka: guard dodany 1:1 z pinem. Dowod: wektor
     pusty_id_pomijany FAIL przed poprawka i PASS po niej. Realny skutek: tylko gdy jednostka o pustym id istnieje
     w scenie; praktycznie nieosiagalne, ale kod jest teraz zgodny z pinem.
  2. (mark_acted po id, web po obiekcie u) PRZYJMUJE CZESCIOWO: nie dodano wektora, bo test wymagalby modelowania
     usuniecia jednostki miedzy busy a done, a to nie jest zachowanie T1 (zmiana sceny lezy w T3/T4). Dopisano
     w doc-komentarzu traitu PlayerOrderExec kontrakt: implementacja mark_acted musi trafic w jednostke, ktora
     nadal istnieje. Brak testu = NIE_ZMIERZONO.
  3. (nieskonczona petla w planowaniu przy stale busy) PRZYJMUJE jako znana, udokumentowana rozbieznosc.
     Web: rekurencja synchroniczna -> RangeError (przepelnienie stosu). Rust: petla bez limitu. Nie da sie tego
     przetestowac bez zawieszenia testu. Warunek przed wpieciem (T7): limit iteracji albo ochrona w sterowniku
     sceny. Wektor busy_planowanie_dwa_razy pokrywa tylko dwa kolejne busy.
  4. (timery drenowane po najmniejszym `due`, FIFO generatora) ODRZUCAM dla tego modulu. Uzasadnienie strukturalne:
     run_from zwraca po Defer, a kolejny timer tej kolejki powstaje dopiero w on_timer po odpaleniu poprzedniego.
     Czyli w jednej kolejce zawsze co najwyzej jeden oczekujacy timer, wiec kolejnosc timerow o roznym `due`
     nie wplywa na wynik tego modulu. Kolejnosc timerow zegara lezy w siege_tactics_clock (testy:
     tests/p6_siege_tactics_siege_tactics_clock.rs; zakresu nie weryfikowano w tej rundzie).
WYNIK BRAMKI: cargo test --all-targets --no-fail-fast: EXIT 0, passed=3631, failed=0, ignored=1 (pre-existing, jak w r1).
NASTEPNY KROK: przekazac SHA obrony do Evaluatora r2 (weryfikacja mutacji a1-acted, b, c nieobjetych ta runda).
DEPLOY/PUSH: NIE WYKONANO
