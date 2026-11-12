STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1
GOAL: obrona r4 po zarzutach Evaluatora (7 punktow): kazdy zarzut PRZYJMUJE (z dowodem odczytu kodu) albo ODRZUCAM (z dowodem).
ZMIANY/COMMIT: w tej obronie NIE zmieniono kodu. Kod r4 pozostaje na ac3f0664727422a3e2f0e48056a68a95ab9a74a2 (raport 01-operator-r4.md na ee69d5d9da373d98684671ac752ef9adea7768ee). Commit obrony: ten plik, SHA w sekcji SHA na dole. Allowlista: tylko dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1/02a-obrona.md. Cargo.lock nie dotyczy (brak cargo). NIE wypchnieto.
TESTY: NIE_ZMIERZONO w tej obronie (brak uruchomienia cargo; ponowne bramki nie byly potrzebne, bo kod sie nie zmienil). Dowody ponizej to odczyt kodu i testow (grep, sed).
BLOKADY: punkty 1, 2, 3, 4, 5, 6 PRZYJETE jako dlug r5 (nie naprawione w r4). Punkt 7 ODRZUCONY w czesci o bazie. Otwarte: wspolna granica i epoki w produkcji (pkt 1), wywolania web/rust_owner_id (pkt 2), izolacja bramki R1/R2 (pkt 3), Provided(0) bez ExplicitZero (pkt 4), egzekwowanie KNOWN_GAPS (pkt 5), cichy profil dla wlasciciela bez wpisu w players (pkt 6).
RUNDY: obrona po zarzutach Evaluatora do r4 (numer rundy ustala orkiestrator; w dispatchu r4 jest to runda 1/5 Operatora r4).
NASTEPNY KROK: orkiestrator decyduje, czy dlug r5 (pkt 1-6) wchodzi do dispatchu r5, a bazowy rekord sciezki bazy (pkt 7) zostaje jak w dispatchu r4 (56cb59bdc).
DEPLOY/PUSH: NIE WYKONANO

## Tabela odpowiedzi na zarzuty

| # | Zarzut (skrot) | Odpowiedz | Dowod |
|---|---|---|---|
| 1 | Test tick->brake wstrzykuje shared_border i epoki recznie; produkcyjne build_war_inputs zostawia shared_border puste, epoki = epoka startu | PRZYJMUJE (dlug r5) | Odczyt: `turn_war_inputs.rs:436` `inputs.epochs.insert(id, epoch)` z jednej `start_epoch_number(...)` dla wszystkich wlascicieli. `shared_border` nie jest wypelniane w zadnym producencie (`grep shared_border` daje tylko pole w `turn_war_pipeline.rs:117`, uzycie w `:343` i KNOWN_GAPS w `turn_war_inputs.rs:82`). Dispatch r4 pkt 1 (producent epok z forcedEra/PairMeta i wspolna granica z realnych epok) NIE jest zrealizowany. Zgodnie z zarzutem: wektor tick->brake weryfikuje skladanie, nie produkcyjne wejscie. Poprawka w r4 nie wykonana. |
| 2 | web_owner_id/rust_owner_id bez wolajacego w src; test sprawdza arytmetyke | PRZYJMUJE (dlug r5) | Odczyt: `grep -rn web_owner_id rust-port/engine/src` daje tylko definicje w `turn_war_inputs.rs:117-122` i komentarze; wolajacy sa w `tests/p6_wire_war_inputs.rs:71-80`. Dispatch r4 pkt 5 (mapowanie 1 vs 0 w produkcji) jest spelniony tylko formalnie. |
| 3 | Bramka R1/R2 nie zasercjonowana; asercja 2-3 nigdy nie deklarowana przechodzi dzieki blokadzie pokoju | PRZYJMUJE (dlug r5) | Odczyt: `tests/p6_wire_war_inputs.rs:261` nazwa testu `peace_lock_from_state_blocks_declaration_and_gate_r1_is_applied_in_rust_order`, ale `:280` wstawia blokade `KEY_ERA_PEACE_LOCK` dla "2-3", a asercja `:303-307` sprawdza brak deklaracji i brak `at_war`. Bramka nie jest izolowana, wektora z pinu brak (NIE_ZMIERZONO, zgodnie z raportem Operatora). |
| 4 | Provided(0) z pustych magazynow (budynki, tech, miasta_jednosc_religii) zamiast ExplicitZero z powodem; suma_ludkow i kultura ze stalych FOUNDING_* | PRZYJMUJE (dlug r5) | Odczyt: `turn_war_inputs.rs:278` `budynki = Provided(count_buildings_for_owner(&built, ...))` z `let built: [(u64, usize); 0] = []` (pusta tablica, wynik 0); `:279` `tech_zbadane = Provided(...)` z `None`; `:282-287` `miasta_jednosc_religii = Provided(...)` z `religion_state: None`. `EXPLICIT_ZERO_REASONS` (`:65-79`) obejmuje tylko bitwy, ulepszenia, zdobycze. `suma_ludkow`/`kultura` ida ze stalych `FOUNDING_POPULATION` (`:57`) i `FOUNDING_CULTURE` (`:59`), co KNOWN_GAPS (`:85`) przyznaje. Zarzut trafny w czesci o zerach. Poprawka (ExplicitZero z uzasadnieniem pin plik:linia albo Missing) nie wykonana w r4. |
| 5 | KNOWN_GAPS to stala bez egzekwowania; test sprawdza tylko !is_empty | PRZYJMUJE (dlug r5) | Odczyt: `tests/p6_wire_war_inputs.rs:200` `assert!(!KNOWN_GAPS.is_empty(), ...)`. Nic nie laczy wpisow z producentami. Lista jest jawna (nie ukryta), ale nie wymusza zamkniecia luk. |
| 6 | pair_params_for: wlasciciel z miastem bez wpisu w players dostaje cicho profil gracza (civ=None) | PRZYJMUJE (dlug r5) | Odczyt: `all_owner_ids` (`turn_war_inputs.rs:159-166`) dokleja wlascicieli miast do id graczy. Domkniecie `civ` (`:374-381`) przez `state.players.iter().find(...)` zwraca `None`, gdy brak wpisu, a `resolve_war_peace_profile(None, ...)` daje profil domyslny bez bledu. To jest ciche zero w sensie dispatchu. Poprawka (blad zamiast profilu) nie wykonana w r4. |
| 7 | Odchylenie od polecenia: baza 56cb59bdc zamiast parity-v2 f207ea6b1 | ODRZUCAM w czesci o odchyleniu; PRZYJMUJE uwage o Evaluatorze | Dowod: dispatch r4 (sekcja `DODATEK r4`, pierwsza linia tej sekcji) ustawia `Baza: 56cb59bdc (BATCH7-tip ...)`. Wiersz `f207ea6b1` z pierwszej czesci dispatchu zostal nadpisany przez dodatek r4 (dodatek r3 wskazywal ec4e11741, dodatek r4 56cb59bdc). Baza zgodna z poleceniem. Przy tym: nota orkiestratora w dispatchu r4 mowi, ze parity-v2 94cba6667 nie zawiera pipeline'u, co potwierdza wybor bazy. Pelny `cargo test --no-fail-fast` w tej obronie NIE powtorzony (NIE_ZMIERZONO), wynik 387 ok pochodzi z raportu Operatora r4. Naprawa kompilacji bazy (`PowerComponentsMissing`) jest w `turn_war_pipeline.rs` i jest zgodna z dispatchem r4 (naprawa kompilacji, bez cichego zera). |

## Co nie zmienilo sie w tej obronie

- Brak zmian w kodzie i w testach. Kod r4 = ac3f0664727422a3e2f0e48056a68a95ab9a74a2.
- Brak uruchomienia cargo w tej obronie (NIE_ZMIERZONO). Wyniki bramek sa z raportu Operatora r4 i nie sa tu powtorzone.
- Brak pushu, brak integracji, gra/ nietkniete, Cargo.lock nie dodany.

## SHA

Zob. commit obrony (ostatni commit na galezi wip/R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1-r4-obrona, sprawdzany po zapisie).
