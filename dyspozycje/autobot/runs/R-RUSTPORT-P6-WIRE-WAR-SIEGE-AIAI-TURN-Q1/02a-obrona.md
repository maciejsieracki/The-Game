# 02a-obrona — R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1 (Operator, obrona r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1
GOAL: obrona przeciw zarzutom Evaluatora r1 (commit operatora 4c3e09a48, baza 8bb118dc7); poprawka sekwencyjnosci i memoizacji callbackow AI-AI, testy z mutujacym stanem.
ZMIANY/COMMIT: SHA obrony: patrz sekcja "SHA" na dole (commit na lokalnej galezi wip/R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1-obrona-r1, bez push).
Allowlista: rust-port/engine/src/domain/war_turn_ai_ai.rs (zmieniony), rust-port/engine/tests/p6_wire_war_siege_aiai_seq.rs (nowy), dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1/02a-obrona.md (nowy). Brak zmian w gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock.
TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: EXIT 0 (37 passed)
- cargo test --test p6_wire_war_siege_aiai: EXIT 0 (5 passed)
- cargo test --test p6_wire_war_siege_aiai_peace: EXIT 0 (4 passed; wektory bez zmian, nadal zgodne)
- cargo test --test p6_wire_war_siege_aiai_seq (NOWY): EXIT 0 (3 passed)
- Kontrola negatywna: nowe testy uruchomione na starym module (4c3e09a48): 3 FAILED (second_entry: Wait zamiast AcceptPaid; memoized: assets 4 zamiast 2; balance_hold: decyzja None). Czyli testy lapia zarzuty 1, 2, 3.
- Cargo.lock wygenerowany przez cargo usuniety, nie jest w commicie.
BLOKADY: brak nowych. Zarzut 4 odrzucony (patrz nizej), wpis w NASTĘPNY KROK.
RUNDY: 1/5 (Operator, obrona r1); bez dodatkowej rundy Operatora.
NASTĘPNY KROK: Evaluator r2 na nowym SHA (obrona) i tym samym ID; FC dopiero po Evaluatorze.
DEPLOY/PUSH: NIE WYKONANO (brak pushu, brak integracji, brak zmian w rust-port/parity-v2 ani origin/main).

## Odpowiedzi na zarzuty

### Bramki odtworzone (potwierdzenie)
PRZYJMUJĘ jako potwierdzenie. Po poprawce ponownie: fmt, clippy -D warnings, lib 37, siege 5, peace 4, seq 3 — wszystkie EXIT 0.

### Zarzut 1 (istotny): przebieg wstepny liczy wszystkie wpisy przed zaplata
PRZYJMUJĘ. Poprawka w `run_ai_ai_peace_turn`: wpisy sa rozstrzygane sekwencyjnie (jak web w petli). Dla kazdego wpisu: najpierw `pair_eligible`/`isStillLosing` (przez tick), potem `peaceAllowed` (wait bez planu), potem wycena i bramka bilansu AI-AI (wait z planem), dopiero potem `run_ai_ai_peace_tick` na jednoelementowym magazynie (zaplata i finalize). Wpis N+1 widzi stan po zaplacie wpisu N.
Dowod: test `second_entry_gate_sees_payment_of_first_entry` (mutujacy env: pay zwieksza bilans zwyciezcy, `Cell`). Wpis A placi 10 (bilans -10 -> 0), wpis B wymaga 5 i przechodzi (AcceptPaid, pay [(1,10),(2,5)], bilans koncowy 5). Na starym module: B = Wait (FAILED, zmierzone).

### Zarzut 2: env.assets i city_cession_ok wolane dwukrotnie na wpis
PRZYJMUJĘ. Wywolania sa spamietywane na czas jednego wpisu (klucz: posortowany zbior pominietych miast dla `assets`, id miasta dla `city_cession_ok`). Pamiec nie przechodzi miedzy wpisami, bo po zaplacie stan sie zmienia. Kontrakt udokumentowany w doc-komentarzu `run_ai_ai_peace_turn`.
Dowod: test `asset_and_city_callbacks_are_memoized_within_one_entry`: assets 2 wywolania, cco 1 wywolanie (zmierzone). Stary modul: assets 4 (FAILED, zmierzone).

### Zarzut 3: decision = None przy wstrzymaniu bilansem
PRZYJMUJĘ CZESCIOWO.
- Naprawione: wstrzymanie przez bilans AI-AI zwraca teraz `decision: Some(AiPeaceDecision{ action: Wait, balance_before, balance_after (js_round), turns_since })`, jak web (`balanceBefore`, `balanceAfter`, `turnsSince`). Test `balance_hold_reports_decision_fields_and_keeps_entry_queued` sprawdza te pola (-20, -10, 3) i brak zaplaty.
- Odchylenie ZOSTAJE: pole `reason` to kod zastepczy `AiPeaceReason::BalanceBelowTolerance`. Web ma tekst 'ujemny bilans PW jednej z AI (pokoj AI↔AI zablokowany)', a w Rust brak wariantu dla tej reguly. Dopisanie wariantu wymaga zmiany `diplomacy_ai_forced_peace.rs`, czyli poza allowlista W7. Proponowany osobny temat (patrz notatki).
- Wstrzymanie `peaceAllowed`: `decision: None` jest zgodne z webem (pin 07d2fbd72, `diplomacy-ai-forced-peace.ts:340-341`: `out.push({ pairKey, action: 'wait', kind })`, bez decyzji i planu).

### Zarzut 4: brak wektora z pinu dla run_ai_ai_weariness_turn z para w wojnie
ODRZUCAM zadanie wektora z pinu dla tej sciezki (z korekta dowodu):
- Zbieranie par i wywolanie tickAiAiWarWeariness zyje w closure `main.ts` (pin: linie ok. 35908-), nie w eksportowanej funkcji, wiec nie ma czego wyeksportowac do wektorow bez transkrypcji JS (taka transkrypcja juz jest dla par: 200 przypadkow `ai_ai_war_pairs`).
- Korekta dowodu z raportu operatora: nie istnieja pliki `p6_repin_wojna_*`. Samo `run_war_weariness_tick` jest pokryte w `tests/p6_dyplo_multiwar2_tick.rs` (grep). Nie twierdze, ze ta sciezka jest pokryta end-to-end z para w wojnie.
- Zostaje jako jawna zaleznosc do W8 (podpiecie do petli tury): pokrycie `run_ai_ai_weariness_turn` z para w wojnie jest posrednie, NIE_ZMIERZONO end-to-end. Brama (pusta para, pusty magazyn) jest testowana w `p6_wire_war_siege_aiai.rs`.

### Zarzut 5 (notatka): luka w diplomacy_ai_forced_peace.rs
PRZYJMUJĘ jako notatke, bez zmiany kodu w tym temacie. Obejscie w `run_ai_ai_peace_turn` zachowuje web kolejnosc sprawdzen. Osobny temat na usuniecie rozjazdu w zrodle (bramka peaceAllowed, bilans AI-AI, loserBalanceFor w `AiPeaceTickEnv`) jest zapisany w notatkach ponizej. W8 wola `run_ai_ai_peace_turn`, nie `run_ai_ai_peace_tick`.

### Zarzut 6 (notatka): numery linii z innego commita
PRZYJMUJĘ jako notatke. Linie z pinu 07d2fbd72 (blok N3 ok. 38825-38875; tickAiAiPeaceRequests 35846-35905; tickAiAiWarWeariness 35908-; wywolania 43035 i 43041) sa wlasciwe; numery z dispatchu (37226-37262, 34305-34380) pochodza z innej wersji. Bez zmiany kodu.

### Zarzut 7 (notatka): origin/rust-port/parity-v2 = ca25d6fd2
PRZYJMUJĘ czesciowo. Zmierzone: `git merge-tree --write-tree 4c3e09a48 ca25d6fd2` zwraca exit 0 (brak konfliktow tekstowych). NIE_ZMIERZONO: kompilacja i testy po rebasie na ca25d6fd2. Do sprawdzenia przez integracje (nie przez Operatora).

## Notatki dla orkiestratora (poza zakresem tego tematu)
1. Osobny temat: rozszerzyc `AiPeaceReason` o wariant reguly nieujemnego bilansu AI-AI i dodac bilans przegranego do `AiPeaceTickEnv`/`decide_ai_peace_request` w `diplomacy_ai_forced_peace.rs` (zrodlo rozjazdu z zarzutu 5 i 3). Sciezka: `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs`.
2. W8 musi: wolac `run_ai_ai_peace_turn` (nie `run_ai_ai_peace_tick`), wykonac zapis `siegeStarveStartMaxHp`, `applyArmyStarvationHpLoss`, `resolveSiegeSurrender`, `handleSiegeCapitulationPhase`, `tickSiegeMachinesForCity`, `maybeAiAssaultAfterMachines` po stronie wolajacego oraz tiki AI-AI w kolejnosci web: po fazie AI, przed `scanAutoSiegesAfterAiTurn`.
3. Callbacki `pay`/`finalize`/`env` w W8 musza mutowac realny stan: to wlasnie testuje `p6_wire_war_siege_aiai_seq.rs`.

## SHA
Commit obrony: patrz wynik orkiestracji (SHA w odpowiedzi StructuredOutput). Kod: 4c3e09a48 + commit obrony z dwoma plikami kodu i plikiem 02a-obrona.md.
