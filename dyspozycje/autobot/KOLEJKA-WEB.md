# KOLEJKA WEB — stan na 2026-11-14 (baza origin/main 85f7961b1)

Czytana przez heartbeat :17 i :47. Plik odświeżony w runie `R-PROC-KOLEJKA-WEB-REFRESH-Q1`
(`dyspozycje/autobot/runs/R-PROC-KOLEJKA-WEB-REFRESH-Q1/10-operator-claude.md`).
W bazie 85f7961b1 plik nie istniał (historyczne wersje z commitów `f994d1de4`, `4e15ad222`
nie leżą na main), dlatego powstał od nowa. Każda pozycja ma potwierdzenie w repo (ścieżka)
albo w TaskList (numer `#`). Pozycje zamknięte nie są tu wymienione jako „do startu”.

## Reguły (obowiązują heartbeat i operatorów)

- Zawsze do 4 aktywnych tematów web (właściciel 2026-11-12). Heartbeat uruchamia kolejny
  temat **tylko z sekcji GOTOWE DO STARTU** i tylko po wypchnięciu dispatchu na gałąź orkiestratora.
- Operatorzy NIE zakładają sesji: `create_session`, `spawn_task`, `create_trigger`, `send_later`
  są zakazane (zakaz właściciela 2026-11-13).
- Heartbeat NIE startuje tematu bez dispatchu i NIE zmienia balansu bez zgody właściciela
  (balans = pozycje z sekcji DECYZJA).
- Pozycje z sekcji DECYZJA, WSTRZYMANE i WYKLUCZONE nie są uruchamiane automatycznie (TaskList #325).
- Po zakończeniu tematu: integracja, deploy ROBOCZA, push, sprzątanie dysku (worktree zakończonych workflowów).

## TRWAJĄCE (nie uruchamiać drugi raz)

| ID | Co daje w grze | Źródło | Uwagi |
|---|---|---|---|
| R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1 (TaskList #368, bramka „Zakończ turę”) | Skarbiec i spichlerz nie schodzą poniżej zera; dźwignie podatków/kolejki w bramce gracza | `runs/R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1/` (10-operator-claude, 30-obrona-claude; brak FC) | W TaskList nazwa `…-GATE-LEVERS-Q1`; w repo katalog bez `GATE-LEVERS`. Model: Haiku. |
| R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1 (TaskList #373, W78 r1) | Wznowienie z zapisu odtwarza ten sam przebieg, co gra bez zapisu | TaskList #373 (in_progress); brak katalogu w bazie | Potwierdzić w worktree operatora przed startem kolejnego. Model: Haiku. |

## GOTOWE DO STARTU (jest dispatch lub zadanie w TaskList, brak zamknięcia)

| ID | Co daje w grze | Model Operatora | Pliki (konflikty) |
|---|---|---|---|
| R-WEB-AI-ARMY-UPKEEP-Q1 | AI przestaje trzymać ~80 rozproszonych jednostek bez opłaty (zrzut Egipt, 2026-10-25); diagnoza na danych, potem poprawka | HAIKU | `gra/src/game/ai*.ts`, `auto-manage.ts`, `army-starvation.ts`, `citizen-resource-upkeep.ts`, `ai-upkeep*.ts`(nowy), `gra/data/ai-upkeep-params.json`(nowy). Konflikt z R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (FC PASS-WITH-NOTES, już w kodzie) — pliki `citizen-resource-upkeep.ts`. Dispatch `runs/R-WEB-AI-ARMY-UPKEEP-Q1/00-dispatch.md`, runda 1/5, bez outputu Operatora. |
| R-WEB-LIVE-VERIFY-W18-W24 (TaskList #335, #272) | Potwierdzenie na żywo: pasek/tryb ręczny (W18, W24) i pomiar strat zwycięzcy w trybie ręcznym | HAIKU (read-only) | Brak allowlisty kodu; wymaga DISPATCH DO NAPISANIA przed startem (dispatch nie istnieje w repo). |

## CZEKA NA DECYZJĘ WŁAŚCICIELA (nie uruchamiać bez odpowiedzi ABC)

| TaskList | Temat | Co trzeba rozstrzygnąć | Stan repo / dowód |
|---|---|---|---|
| #374 | Balans miedzi | A bez zmian / B ujście proporcjonalne do kopalni (rekomendacja) / C niższy cap ruda / D limit kopalni | `runs/R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1/` FC PASS-WITH-NOTES; brak błędu kodu (#283) |
| #355 | Częstość ofert handlowych AI | Zwiększyć czy zostawić (pomiar ok. 0,89 oferty / 100 tur) | `runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/`; runda 5 zamknięta (#333) |
| #360 | Zwolnienie administratora | A: potwierdzenie w grze / B: jeden przycisk | Brak dispatchu; zgłoszenie z #313 |
| #361 | Próg końca zmęczenia wojną | Domyślnie 0,8, do potwierdzenia | Powiązane z #363 (wariant A, zamknięty) |
| #370 | Zaufanie w wojnie (D1 dryf vs licznik N, D2 N=6 vs martwe pole 5) | D1, D2 | Zmierzone W76 (#370); tik zostawia 0 |
| #311, #321, #334 | Przepływ surowca na szlaku (czy szlak przesuwa zapasy) | Tak/nie; kandydat 605036e6b do przeglądu | `runs/R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1/` (kontakt bez połączenia, zamknięty) |
| #309 (Z-3) | Po utracie morale brak ucieczki i pościgu | Czy pokryte przez #245 i #314 | Brak dispatchu; weryfikacja pokrycia przed decyzją |
| #272 / #335 | Pomiar strat zwycięzcy (ręczny) | Czy mierzyć i wdrażać | Patrz GOTOWE DO STARTU (LIVE-VERIFY) |

## DO WERYFIKACJI PRZEZ ORKIESTRATORA (status w TaskList niespójny z repo)

- #299 (audyt obrażeń dystansowych vs pancerz): pending, ale audyt #305 i decyzja #323 (opcje A–D) są completed. Wybrana opcja nie jest w repo — potwierdzić, zamknąć zadanie.
- #312 (respekt AI i zaufanie w wojnie bez granicy): pending, ale decyzja #322 completed — zamknąć, jeśli nie ma nowej pozycji.
- #108 (lista długów): `ai-zdobycie K1b` i `ai-fog` — dispatch `runs/R-WEB-AI-ZDOBYCIE-FOG-DIAG-Q1/` FC PASS-WITH-NOTES; ai-fog W2 FAIL celowy, do decyzji właściciela (→ DECYZJA). `P-AI-ZDOBYCIE-MIASTA-CZTERY-LUKI-Q1` ma tylko operator-runda1, bez FC (status nieznany).
- #108: `diplomacy-proposal r5Gate`, `audience 13160/27749`, `AI-CLOUD-GATHER-PERF` — brak dispatchu w repo i brak wpisu w TaskList; NIEPOTWIERDZONE, nie wpisywać do kolejki bez dispatchu.
- #296 (sojusznik dołącza do wojny na wezwanie): completed, ale opis mówi „nie wdrożone” — potwierdzić.
- #57 (nowe epoki Klasyczna/Średniowieczna): pending, WSTRZYMANE decyzją właściciela (dopiero przy nowej wersji Rust) — poza kolejką.

## WYKLUCZONE

- #286 (wojownik barbarzyńców „z supermocą” zniszczył gracza bez strat) — na żądanie właściciela, nie uruchamiać.

## ZAMKNIĘTE (nie wpisywać do kolejki)

- PROC-GATE-REFERENCE-REFRESH-Q2 (#278, FALA 665), CITYSTATE-ARMY-FOOD-DIFFICULTY (FC PASS-WITH-NOTES), CITIZEN-UPKEEP-ERA-MULT (FC PASS-WITH-NOTES), mgla-sciezka-inwariant (#292), DIPLO-TRUCE-IMPL (#169, FC PASS-WITH-NOTES), W35 pomiar ofert (#277, runda 5), W40 tempo mieszanej armii (#282), W41 miedź (#283), R-WEB-MARCH-RESUME-NEXT-TURN (#176) i pozostałe pozycje TaskList oznaczone completed.
