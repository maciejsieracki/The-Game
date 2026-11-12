STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K1B-Q1 (klocek K1b, runda 1/5, Operator)
GOAL: port czystej czesci petli marszu oblezniczego: _bfsFirstStep (BFS pierwszego kroku) i decyzyjny rdzen _siegeWalkTo; efekty sceny (_doMove poza bramka, _schedule) jako jawny kontrakt, bez stubow; wektory z pinu 07d2fbd72.
ZMIANY/COMMIT: branch lokalny rust-port-wip/SIEGE-TAKTYKA-K1b-Q1, kod commit e0cc8051a (baza: 759621568, FC K1). Allowlista: rust-port/engine/src/domain/siege_tactics_walk.rs (nowy), siege_tactics_approach.rs (tylko komentarze), mod.rs (rejestracja), tests/p6_siege_tactics_walk.rs (nowy), tests/p6_siege_tactics_walk_gen.mjs (nowy), tests/p6_siege_tactics_walk_vectors/vectors.json (nowy), dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md (wiersze 30, 32.18, 33.22), runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-K1B-Q1/01-operator-r1.md. Nie dotknieto gra/, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (untracked, nie dodany), plikow K2. Nic nie wypchnieto.
TESTY:
- cargo fmt --check: PASS (rustfmt na dwoch nowych plikach).
- cargo clippy --all-targets -- -D warnings: PASS (rc 0).
- cargo test --lib: PASS, 48 passed, 0 failed.
- cargo test --test p6_siege_tactics_approach --test p6_siege_tactics_approach_k1 --test p6_siege_tactics_end --test p6_siege_tactics_walk: PASS (approach 5/5, approach_k1 8/8, end 8/8, walk 7/7).
- Wektory bfsFirstStep: 500 przypadkow (83 z trafieniem, 417 bez sciezki; czesc z allowTile i prefRow; przypadki z limitem odwiedzen).
- Wektory siegeWalkTo: 710 przypadkow; zdarzenia move 1049, schedule 744, done 700, refused 4 (3 losowe + 1 jawny). Przypadki jawne: 10 (cel=start, finished, moveLeft=0, fadingOut, walled-in, BFS cap, odmowa na linii przez strefe, dopuszczenie poza strefa, otwarta brama, brak muru).
- Straznik zrodla: SHA-256 wyciętych fragmentow pinu (7951-7960, 7962-7970, 7972-8019, 8685-8693) = 74ef696158ac76c75d64a8f4912a1f2c404c5a19b1396854f432abb8cec4ce6a; zweryfikowany niezaleznie przez sha256sum na tekscie z git show.
- Dodatkowe testy jednostkowe: tie-break N,E,S,W; start nie jest kandydatem; start poza siatka; maxVisited=1; decide (finished, dead, fadingOut, moveLeft<=0, cel, NaN); bramka bez muru = Proceed.
- Wizualnie: NIE_ZMIERZONO (zmiana czysto domenowa, bez UI).
- Rozmiar vectors.json: 1.6 MB (jedna linia JSON).
BLOKADY:
- ROZBIEZNOSC BAZY: zlecenie wskazuje baze origin/rust-port/parity-v2 (f207ea6b1 lub nowszy), a dispatch wskazuje baze 759621568 (FC K1). Sprawdzono: origin/rust-port/parity-v2 (b9800e0a7) NIE zawiera 759621568. Zastosowano baze z dispatchu, bo K1b rozszerza moduly K1, ktorych nie ma na parity-v2. Decyzja bazy integracji nalezy do orkiestratora (K1 i K1b razem, mozliwy konflikt w mod.rs).
- Wiersz 30 POZOSTAJE PARTIAL: _siegeRamTowerStep, _trySiegeTowerClimb, _siegeInfantryToTowerStep nadal BRAK (K2/K4). Kryterium (1) dispatchu dla _bfsFirstStep i decyzyjnego rdzenia _siegeWalkTo jest spelnione.
- Efekty sceny _doMove (occByKey, koszt wejscia, bród, _updateFacing, intent.steps, animacja, busy, _autoBatchPlanning) oraz _schedule NIE sa portowane; sa kontraktem WalkWorld::do_move i zdarzeniem Schedule (opis w module).
- Uwaga semantyczna: siege_walk_to kontynuuje synchronicznie po Schedule; rownowaznosc z timerem sceny zachodzi tylko przy jednej jednostce bez przeplatania timerow. Scena musi uzywac walk_decide / walk_after_move w callbackach.
RUNDY: 1/5 (Operator). Bramki zielone w tej rundzie; bez FAIL.
NASTEPNY KROK: Evaluator (Sonnet) na commicie e0cc8051a: niezalezna weryfikacja wektorow z pinu, pokrycia galezi i zgodnosci kontraktu WalkWorld; potem Final Control. Orkiestrator decyduje o bazie integracji (parity-v2 vs 759621568).
DEPLOY/PUSH: NIE WYKONANO (zakaz dla Operatora; brak push, brak integracji).
