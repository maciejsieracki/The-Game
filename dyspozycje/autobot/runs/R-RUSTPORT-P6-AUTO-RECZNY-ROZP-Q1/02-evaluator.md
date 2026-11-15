STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-AUTO-RECZNY-ROZP-Q1
GOAL: Weryfikacja rozpoznania trybu ręcznego (01-rozpoznanie.md, SHA 28a4c0b98, baza f7baa3848) względem pinu 07d2fbd72 i Rust.
ZMIANY/COMMIT: tylko ten plik (02-evaluator.md). Diff 28a4c0b98 vs f7baa3848 = wyłącznie 01-rozpoznanie.md (allowlista OK, zero kodu, brak #[ignore]/asercji do oceny).
TESTY: bramki cargo (fmt/clippy/test) NIE URUCHAMIANE: dispatch to rozpoznanie tylko do odczytu, zero zmian kodu, brak testu z dispatchu. Weryfikacja: git show/grep pinu i git grep f7baa3848.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (poprawić zarzuty 1-7), potem FC.
DEPLOY/PUSH: NIE WYKONANO

# Potwierdzone (próbki sprawdzone wprost)
Numery linii pinu zgodne: 2286, 2289, 2718, 3572, 6067-6068, 10007-10016, 10539, 11813, 17348-17419, 18280-18296, 18435. Cytaty Rust zgodne: activate.rs:238-241/248-255, loop.rs:444/753-756/995, turnseq.rs:246/280/310/342/350, autobatch.rs:351/403/654/733. Gating `!_manualMode` w pinie (5684/5697/5708/5930/5962) poprawny. Brak `manualControlAllowed` w rust-port potwierdzony (0 trafień).

# Zarzuty
1. BRAK w tabeli kolejnych wołających `_performPlayerOrder`: pin 18082 i 18122 (`_executeSkirmishDoctrineStep` i drugi krok doktryny ustawiają `playerOrder=move` i wołają `_performPlayerOrder` rekurencyjnie) oraz 18608 (wykonanie kolejki rozkazów po SPACJI, pętla `runNext` z `u.acted=true`). Raport podaje tylko 6068. To zmienia zależności: doktryna (#112) zależy od modelu `playerOrder.move`, a kolejka SPACJA to osobny producent wejścia, którego raport nie nazywa. Pominięte w sekcjach 2, 3, 4.
2. BŁĄD: "logika utraty dowódcy po stronie domeny BRAK" i "brak wejścia isArmyCommander w ProdUnit". W Rust istnieje `army_leadership.rs:26` (`is_army_commander`), `:128`, `:156` (filtr `is_army_commander && !dead && !fading_out && !routed` = predykat pinu z 10010/17352). Brakuje tylko podania go do `ProdUnit` (`siege_tactics_loop.rs:350` hardkoduje `false`). Poprawna ocena: CZĘŚCIOWE/ROZBIEŻNE, nie BRAK.
3. NIE_ZMIERZONO podane przez Operatora, a odpowiedź jest jednym grepem: wołający `manualControlAllowed` to `gra/src/main.ts:33581, 33635, 34312, 34399, 36988, 37043` (`roster.some(u => u.isGeneral === true)`), więc gate w produkcji jest zawsze zdefiniowany, a źródłem jest `isGeneral`, nie `isArmyCommander`. Rozbieżność nazw pól nie jest odnotowana. Brak notatki, że start (3570-3572) sprawdza `!dead && !routed`, a przełącznik i utrata dowódcy (17352, 10010) dodatkowo `!fadingOut`.
4. Niedokładność wiersza `_manualMode = true`: oznaczone ROZBIEŻNE (domyślna odwrotna), a pin ustawia wartość i tak na starcie bitwy (3572 = `!gate || hasCommander`). Prawdziwa rozbieżność: Rust nie ma żadnego odpowiednika tego przypisania; false to tylko wartość konstrukcji. Ścieżka 10539 (reset `_manualMode = true`) nieopisana.
5. Pominięte FF (pin 3695-3711): `_ffPendingAuto = _manualMode && busy` (dokończ rozkaz gracza, potem AUTO) i `_ffEnterAuto` (`if _manualMode -> _toggleManualMode`, potem kickoff). To wejście portu i ryzyko podwójnej aktywacji jednostki z `acted=false`; powinno być w sekcji 2. Brak też wołających `_disableManualIfCommanderLost` (9805, 9931; warunek `!_autoBatchPlanning` i `_schedule(0)` z 10008-10009), istotnych dla zegara wirtualnego.
6. Sekcja 4: allowlista pomija `siege_tactics_autobatch.rs` (halt i wznowienie batcha z `_toggleManualMode`) oraz `army_leadership.rs`/`ProdUnit` (wejście dowódcy). Zależność od #112 podana jako "najlepiej przed startem", a rekurencja z zarzutu 1 czyni ją twardą dla gałęzi `none` z doktryną. Szacunek 3-4 rund nierealistyczny wobec 6 funkcji i 4 zależności (w tym `_performSiegeManualOrder`); ryzyko limitu 5 rund. "Wektory z pinu" bez wskazania generatora.
7. `attackMove` (18355-18434) i `_performSiegeManualOrder` to NIE_ZMIERZONO lub tylko nagłówek, a tabela daje "BRAK" bez opisu zachowania; kryterium 3 (szacunek) opiera się więc na nieprzeczytanym kodzie.

# Ocena
Kryteria 1 i 4 spełnione w zasadniczej części, linie i cytaty wiarygodne, NIE_ZMIERZONO podane jawnie. Błąd merytoryczny: zarzut 2. Luki istotne dla zakresu: 1, 5, 6. Zarzuty 3 i 5 dało się ustalić jednym grepem. Brak zarzutów blokujących; wymagana poprawka raportu przed FC.
