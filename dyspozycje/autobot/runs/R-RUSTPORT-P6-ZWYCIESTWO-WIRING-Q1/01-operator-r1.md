STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1 (P6.19-C, runda 1)
GOAL: wpiecie konca gry do PlayableState i petli tury (flaga konca gry, graczKiedysMialMiasto, odrzucanie konca tury po zakonczeniu gry, sprawdzenie zwyciestwa po turze dla gracza czlowieka).
ZMIANY/COMMIT: rust-port/engine/src/domain/playable.rs (pola PlayableState gracz_kiedys_mial_miasto/koniec_gry z serde default i pominieciem gdy brak; PlayableError::GameAlreadyOver/VictoryCheck; advance_turn: odrzucenie po koncu gry na poczatku, sprawdzenie zwyciestwa na fazie Victory z przywroceniem kolejki i wojny przy bledzie; evaluate_victory; victory_power_inputs). NOWY: rust-port/engine/tests/p6_victory_wiring.rs (6 testow). Commit: patrz sekcja DEPLOY/PUSH. Cargo.lock NIE commitowany (nieSledzony, wygenerowany przez cargo).
TESTY:
- cargo test --test p6_victory_wiring: 6 passed, 0 failed (kod 0)
- cargo test --lib: 110 passed, 0 failed (kod 0)
- cargo clippy --all-targets -- -D warnings: kod 0 (po poprawce Entry::Vacant)
- rustfmt --check src/domain/playable.rs tests/p6_victory_wiring.rs: kod 0
- git diff --check: czysto
- cargo test --no-fail-fast (pelny): w toku w tle; czesciowo 1742 passed / 0 failed przed limitem 590 s; wynik pelny: NIE_ZMIERZONO do zakonczenia biegu (patrz log scratchpad test-full-r1-bg.log)
BLOKADY:
1. Kryterium 1 NIE ZREALIZOWANE: brak generatora `p6_victory_wiring_gen.mjs` wykonujacego tekst pina i wektorow `p6_victory_wiring_vectors/**`. Testy sa napisane recznie wg semantyki pina, a nie z wektorow wygenerowanych z pina (SHA fragmentu nie podano). Bez tego kryterium 1 nie jest spelnione.
2. Wczytanie gry (pin main.ts:47333 reset gameOver): w Rust nie ma produkcyjnej sciezki wczytania PlayableGame (tylko deserializacja PlayableState). Reset konca gry przy wczytaniu NIE wpiety. NIE_ZMIERZONO.
3. Miejsca ustawiania flagi z pinu (main.ts:16508, 17816, 36218, 45646, 45877-8) nie maja odpowiednikow w playable.rs (brak zakladania miasta i zmiany wlasciciela miasta w tej warstwie). Flaga jest ustawiana na fazie Victory po skanie miast gracza (monotonicznie) i przy nowej grze = Some(false); legacy zapis bez pola = None i odtwarzanie z miast (ścieżka zgodnosci).
4. Druga sciezka pinu sprawdzajaca przegrana po utracie miasta (main.ts:34018-34025) NIE wpieta - brak utraty miasta w Rust playable.
5. Menu victoryMode: pin uzywa `_menuAdvanced?.victoryMode ?? 'moc_i_dominacja'`; Rust przekazuje domyslnie MocIDominacja (brak pola w StartGameParams). NIE_ZMIERZONO dla wyboru z menu.
6. wszystkieTechZbadane przekazane jako false (brak danych zbadanych w Rust playable); bez wplywu na wynik, bo rakieta nigdy nie jest true a NAUKA_WYMAGA_RAKIETY=true (nauka nieosiagalna, zgodnie z decyzja orkiestratora).
7. Mapowanie id: pin gracz 0 = Rust HUMAN_PLAYER_ID (1). Zrodlo prawdy: HUMAN_OWNER_PRIMARY===0 w pinie (main.ts:13747); w Rust czlowiek to PlayerId 1. Do potwierdzenia przez FC.
8. Odrzucanie komend: wg pinu tylko koniec tury (main.ts:37997, :38043, :43827); ruchy/wybor jednostek NIE blokowane (zgodnie z pinem).
9. Power: moc liczona przez build_war_inputs + objective_power_for_owner; gdy nie ma miasta AI, tylko gracz z epoka startu (start_epoch_number). Epoka gracza = epoka z inputs.epochs, a gdy brak - epoka startu.
RUNDY: 1/5
NASTEPNY KROK: FC ma odrzucic status BLOCK do czasu dostarczenia generatora wektorow z pina (kryterium 1) i decyzji o punktach 2-5; alternatywnie rozbic temat na P6.19-C1 (logika i testy, obecny kod) oraz P6.19-C2 (generator wektorow + reset przy wczytaniu).
DEPLOY/PUSH: NIE WYKONANO
