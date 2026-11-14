# KOLEJKA WEB — stan na 2026-11-14 (baza origin/main 6a373373e, po FALI 697)

Czytana przez heartbeat :17 i :47. Plik odświeżony w runie `R-PROC-KOLEJKA-WEB-REFRESH-Q1`
(`dyspozycje/autobot/runs/R-PROC-KOLEJKA-WEB-REFRESH-Q1/10-operator-claude.md`; poprawki po
zarzutach Evaluatora: `dyspozycje/autobot/runs/R-PROC-KOLEJKA-WEB-REFRESH-Q1/30-obrona-claude.md`).
W bazie 85f7961b1 plik nie istniał (historyczne wersje z commitów `f994d1de4`, `4e15ad222`
nie leżą na main), dlatego powstał od nowa. Każda pozycja ma potwierdzenie w repo (ścieżka)
albo w TaskList (numer `#`). Pozycje zamknięte nie są tu wymienione jako „do startu”.
Nazwy w nawiasach z dopiskiem „robocza” nie są ID tematów w repo.

## Reguły (obowiązują heartbeat i operatorów)

- Zawsze do 4 aktywnych tematów web (właściciel 2026-11-12). Heartbeat uruchamia kolejny
  temat **tylko z sekcji GOTOWE DO STARTU** i tylko po wypchnięciu dispatchu na gałąź orkiestratora.
  Obecnie sekcja GOTOWE DO STARTU jest PUSTA: nic nie startuje automatycznie.
- Operatorzy NIE zakładają sesji: `create_session`, `spawn_task`, `create_trigger`, `send_later`
  są zakazane (zakaz właściciela 2026-11-13).
- Heartbeat NIE startuje tematu bez dispatchu i NIE zmienia balansu bez zgody właściciela
  (balans = pozycje z sekcji CZEKA NA DECYZJĘ).
- Pozycje z sekcji CZEKA NA DECYZJĘ, WSTRZYMANE i WYKLUCZONE nie są uruchamiane automatycznie (TaskList #325).
- Po zakończeniu tematu: integracja, deploy ROBOCZA, push, sprzątanie dysku (worktree zakończonych workflowów).

## TRWAJĄCE (nie uruchamiać drugi raz)

Brak pozycji. R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1 (W77, TaskList #368, bramka „Zakończ turę”)
i R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1 (W78, TaskList #373) są WDROŻONE jako FALA 697 (TaskList: oba `completed`;
origin/main 6a373373e „ROBOCZA a02ef8a8 FALA 697”, merge FC fdee4d469 i ea98aebe8). Nie uruchamiać ich ponownie.
Ich otwarte pytania są w sekcji CZEKA NA DECYZJĘ WŁAŚCICIELA (#375).

## GOTOWE DO STARTU (jest dispatch w repo i brak zamknięcia)

- R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1 (okno „Umowa wymiany surowców” bez przeładowania; HAIKU; dispatch `runs/…/00-dispatch.md` wypchnięty; skrypt `scratchpad/WEB-R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1.js`; args: id, tag A2-TRADE, mode full, cand 75e238e52, opModel haiku, round 1). Start gdy zwolni się slot.
- B2 (reszta punktów W80B: panel bez nakładki, wojna AI↔AI ≥16 tur, zmiana miasta +10%) — dispatch do napisania PO diagnozie nakładki (R-WEB-WORLD-CREATION-OVERLAY-MIDGAME-DIAG-Q1) i wyniku B1.

## CZEKA NA DECYZJĘ WŁAŚCICIELA (nie uruchamiać bez odpowiedzi ABC)

| TaskList / ID | Temat | Co daje w grze | Co trzeba rozstrzygnąć | Model Operatora | Pliki (konflikty) | Stan repo / dowód |
|---|---|---|---|---|---|---|
| #374 | Balans miedzi | Ujście miedzi zgodne z kopalniami | A bez zmian / B ujście proporcjonalne do kopalni (rekomendacja) / C niższy cap ruda / D limit kopalni | HAIKU (po decyzji) | NIE_ZMIERZONO — lista plików do ustalenia po decyzji | `runs/R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1/` FC PASS-WITH-NOTES; brak błędu kodu (#283) |
| #355 | Częstość ofert handlowych AI | Ile ofert AI dostaje gracz | Zwiększyć czy zostawić (pomiar ok. 0,89 oferty / 100 tur) | HAIKU (po decyzji) | NIE_ZMIERZONO — lista plików do ustalenia po decyzji | `runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/`; runda 5 zamknięta (#333) |
| #360 | Zwolnienie administratora | Czy zwolnienie wymaga potwierdzenia | A: potwierdzenie w grze / B: jeden przycisk | HAIKU (po decyzji) | UI administratora | Brak dispatchu; zgłoszenie z #313 |
| #361 | Próg końca zmęczenia wojną | Kiedy kończy się zmęczenie wojną | Domyślnie 0,8, do potwierdzenia | HAIKU (po decyzji) | `war-weariness.ts` | Powiązane z #363 (wariant A, zamknięty) |
| #370 | Zaufanie w wojnie (D1 dryf vs licznik N, D2 N=6 vs martwe pole 5) | Zaufanie w wojnie zachowuje się przewidywalnie | D1, D2 | HAIKU (po decyzji) | `diplomacy*`, `war-weariness.ts` | Zmierzone W76 (#370); tik zostawia 0 |
| #311, #321, #334 | Przepływ surowca na szlaku (czy szlak przesuwa zapasy) | Czy szlak handlowy przenosi surowiec | Tak/nie; kandydat 605036e6b do przeglądu | HAIKU (po decyzji) | szlak handlowy | `runs/R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1/` (kontakt bez połączenia, zamknięty) |
| R-WEB-AI-ARMY-UPKEEP-Q1 (dispatch `runs/R-WEB-AI-ARMY-UPKEEP-Q1/00-dispatch.md`, status FAIL po 4 z 5 rund) | AI przestaje trzymać ~80 rozproszonych jednostek bez opłaty (zrzut Egipt, 2026-10-25) | Czy wznowić temat od rundy 5 (`backup/final-4b3bc46f`), czy napisać nowy dispatch na świeżej bazie; decyzja właściciela o zwrocie manpower przy rozwiązaniu jednostek; kolizja z wycofaną bramką rekrutacji (`docs/decyzje/R-AI-RECRUIT-UPKEEP-GATE.md`, WYCOFANA 2026-08-26) | HAIKU (po decyzji) | `gra/src/game/ai*.ts`, `auto-manage.ts`, `army-starvation.ts`, `citizen-resource-upkeep.ts` (konflikt z R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1, FC PASS-WITH-NOTES, już w kodzie), `ai-upkeep*.ts` (nowy), `gra/data/ai-upkeep-params.json` (nowy); lista z dispatchu z 2026-10-25, do odświeżenia | `dyspozycje/autobot/BACKLOG-PO-ODNOWIENIU-LIMITU.md:7`: „runda 5 (branch `backup/final-4b3bc46f`; decyzja ownera o zwrocie manpower; flaga OFF)”; gałąź `origin/backup/final-4b3bc46f` istnieje; flaga `AI_UPKEEP_AWARE_RECRUITMENT_ENABLED` i `gra/data/ai-upkeep-params.json` NIE istnieją w bazie 85f7961b1 (grep pusty). `dyspozycje/rust-port/LEDGER.md` l.233–234 (wiersze z 2026-10-26): „FAIL r4/5, flaga OFF” oraz „FAIL 4/5, runda 5 + decyzja ownera o manpower”. Do startu wymagana decyzja właściciela (runda 5 lub nowy dispatch), nie jest to pozycja GOTOWA DO STARTU. |
| AI od tury 1 (decyzja „AI od tury 1”, TaskList #365, #367; pytanie zebrane w #375) | Skarbiec/spichlerz AI od tury 1 nie schodzą poniżej zera (rozszerzenie bramki na AI) | Czy AI ma spełniać tę samą bramkę skarbca od pierwszej tury; warianty do ustalenia z właścicielem przed pytaniem ABC | Decyzja właściciela (warianty ABC do przygotowania przez orkiestratora) | HAIKU (po decyzji) | NIE_ZMIERZONO — pliki do ustalenia w dispatchu (bramka tury AI) | TaskList #365 i #367: „decyzja „AI od tury 1” otwarta” (oba completed, pytanie w #375 pending); brak wpisu w repo (nie cytować rejestru jako źródła) |
| Dźwignia wycofania z kolejki w bramce „Zakończ turę” (W77, TaskList #368 completed / FALA 697; pytanie #375) | Bramka gracza nie blokuje kolejki wycofania | Prognoza gracza nie zawiera kolejki: usunąć dźwignię (b) albo zdefiniować model kolejki | Decyzja właściciela: usunąć (b) / zdefiniować model | HAIKU (po decyzji) | bramka „Zakończ turę” (kolizja z FALĄ 697) | `runs/R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1/50-final-control-claude.md` (FC: prognoza gracza nie zawiera kolejki, wycofanie nie zmienia salda); TaskList #368 completed; origin/main 6a373373e |
| Walka taktyczna (ręczna) a determinizm (W78, TaskList #373 completed / FALA 697; pytanie #375) | Ta sama walka ręczna daje ten sam wynik przy tym samym ziarnie | Czy walka ręczna ma być deterministyczna jak automatyczna (#362) | Decyzja właściciela: zakres determinizmu w walce ręcznej | HAIKU (po decyzji) | walka taktyczna (bitwa ręczna), wznowienie z zapisu | `runs/R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1/50-final-control-claude.md`; TaskList #373 completed; #362 completed (walki automatyczne) |
| ai-fog W2 | Mgła AI (ścieżka `ai-zdobycie K1b`/`ai-fog`) | Czy celowy FAIL W2 jest akceptowany | Akceptacja FAIL celowego / poprawka | HAIKU (po decyzji) | mgła AI | `runs/R-WEB-AI-ZDOBYCIE-FOG-DIAG-Q1/` FC PASS-WITH-NOTES; FAIL W2 celowy |

## DO WERYFIKACJI PRZEZ ORKIESTRATORA (status w TaskList niespójny z repo)

- #272 / #335 (obserwacje na żywo: LIVE-VERIFY W18/W24 i pomiar strat zwycięzcy w trybie ręcznym):
  pozycja OBSERWACJA, nie gotowy temat. Nie ma dispatchu ani katalogu w repo, a ID
  `R-WEB-LIVE-VERIFY-W18-W24` to nazwa robocza. Część W24 (baner) jest już potwierdzona przez
  #276 (W34 r2, `R-WEB-LIVE-VERIFY-WAVE-650-664-Q1`: r1 4 z 5 punktów PASS, r2 domyka punkt 4).
  Pomiar strat zwycięzcy w trybie ręcznym pozostaje niezrealizowany. Do startu potrzebny
  osobny dispatch (orkiestrator decyduje, czy go napisać).
- #309 (Z-3, bitwa: po utracie morale brak ucieczki i pościgu): zgłoszenie do weryfikacji pokrycia,
  NIE decyzja właściciela. Pokrycie możliwe przez #245 (W21, pościg, FALA 653) i #314 (NEVERROUT-HOLD-FIGHT,
  completed). Orkiestrator potwierdza pokrycie i zamyka albo przenosi do CZEKA NA DECYZJĘ.
- #299 (audyt obrażeń dystansowych vs pancerz): pending, ale audyt #305 i decyzja #323 (opcje A–D) są completed. Wybrana opcja nie jest w repo — potwierdzić, zamknąć zadanie.
- #312 (respekt AI i zaufanie w wojnie bez granicy): pending, ale decyzja #322 completed — zamknąć, jeśli nie ma nowej pozycji.
- #108 (lista długów): `ai-zdobycie K1b` i `ai-fog` — dispatch `runs/R-WEB-AI-ZDOBYCIE-FOG-DIAG-Q1/` FC PASS-WITH-NOTES; ai-fog W2 FAIL celowy, do decyzji właściciela (→ CZEKA NA DECYZJĘ). `P-AI-ZDOBYCIE-MIASTA-CZTERY-LUKI-Q1` ma tylko operator-runda1, bez FC (status nieznany).
- #108: `diplomacy-proposal r5Gate`, `audience 13160/27749`, `AI-CLOUD-GATHER-PERF` — brak dispatchu w repo i brak wpisu w TaskList; NIEPOTWIERDZONE, nie wpisywać do kolejki bez dispatchu.
- #296 (sojusznik dołącza do wojny na wezwanie): completed, ale opis mówi „nie wdrożone” — potwierdzić.
- #57 (nowe epoki Klasyczna/Średniowieczna): pending, WSTRZYMANE decyzją właściciela (dopiero przy nowej wersji Rust) — poza kolejką.

## WYKLUCZONE

- #286 (wojownik barbarzyńców „z supermocą” zniszczył gracza bez strat) — na żądanie właściciela, nie uruchamiać.

## ZAMKNIĘTE (nie wpisywać do kolejki)

- PROC-GATE-REFERENCE-REFRESH-Q2 (#278, FALA 665), CITYSTATE-ARMY-FOOD-DIFFICULTY (FC PASS-WITH-NOTES), CITIZEN-UPKEEP-ERA-MULT (FC PASS-WITH-NOTES), mgla-sciezka-inwariant (#292), DIPLO-TRUCE-IMPL (#169, FC PASS-WITH-NOTES), W35 pomiar ofert (#277, runda 5), W40 tempo mieszanej armii (#282), W41 miedź (#283), R-WEB-MARCH-RESUME-NEXT-TURN (#176) i pozostałe pozycje TaskList oznaczone completed.

## DECYZJE WŁAŚCICIELA 2026-11-14 (odpowiedzi ABC 1–14 + starsze) — tematy do dispatchu po zwolnieniu slotu (kolejno, ten sam plik = sekwencyjnie)
Ruszyły od razu (dispatche wypchnięte): RIVERS-FILL-CENTROID-PERF (nr 12 A), BATTLE-MANUAL-RNG-DETERMINISM (nr 11 A), UI-SIEGE-PANEL-NARROW-MACHINES-BLOCK (nr 6), UI-ADMIN-DISMISS-CONFIRM (admin A).
Do napisania dispatchu i startu (Haiku, Evaluator/FC Sonnet):
1. R-WEB-UI-NOTIF-DIPLO-TAB-COUNT-BLOCKING-Q1 (nr 14 = B): licznik zakładki „Dyplomacja” wlicza blokujące propozycje diplo (sidePanelHud.ts ~760–769) ORAZ lista po kliknięciu zakładki pokazuje tę kartę (sidePanelEventFilter.ts filterSidePanelEventsByTab) — licznik musi odpowiadać liście; uwaga na „N wymaga decyzji” nad zakładkami (bez dublowania/spójnie). Diagnoza: runs/R-WEB-UI-NOTIF-DIPLO-TAB-COUNTER-DIAG-Q1/10-operator-claude.md.
2. R-WEB-UI-UNIT-CARD-STATS-ENGINE-CANON-Q1 (nr 8 = A): statystyki silnika są kanoniczne; karty jednostek (PL/EN kolumny) mają pokazywać dokładnie wartości silnika — audyt rozbieżności z runs/R-WEB-BARB-WARRIOR-SUPERPOWER-AUDIT-Q1 (PL/EN mismatch), poprawić wyświetlanie, nie silnik.
3. R-WEB-NNS-AI-BALANCE-FROM-TURN1-Q1 (nr 3 = tak): AI bilansuje skarbiec/spichlerz od tury 1 (bez wyjątku tur 1–10, który ma gracz); ai.ts/ai-economy; sekwencyjnie z pozycją 5 i 6 (ten sam plik ai.ts).
4. R-WEB-NNS-GATE-REMOVE-QUEUE-LEVER-Q1 (nr 4 = usunąć): usunąć dźwignię „kolejka produkcji” z bramki „Zakończ turę” (nnsGateForPlayer/decideEndTurnGate/nnsEndTurnTooltipText, main.ts), zostają podatek i racje.
5. R-WEB-AI-CITY-FOR-PEACE-BRANCH-ORDER-Q1 (nr 5 = przestawić kolejność, żeby gałąź „miasto za pokój” zaczęła działać; ai.ts ~7050–7080): ZMIENIA zachowanie AI przy pokoju → obowiązkowy pomiar na żywo wojen (nie psuć nr 13 = A: wojny AI↔AI zostają krótkie), testy diplo-war-peace-sim/ai-peace.
6. R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1 (oferty AI = A: zwiększyć do kilku na 100 tur): dostroić częstość ofert handlowych AI do gracza (z pomiaru W35: ~0,89/100 tur) bez spamu; cel kilka (np. 3–6) na 100 tur w scenariuszu pomiarowym; narzędzie pomiarowe z W35 (runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1).
7. R-WEB-DIPLO-TRUST-WAR-N6-CLEANUP-Q1 (D2 = N=6, usunąć martwe pole 5) + dokumentacja Civpedii (nr 2 = A: zostawić zachowanie i opisać w Civpedii zaufanie w wojnie: tik zostawia 0, licznik wojny N=6).
Bez zmian (zamknięte decyzją): miedź A (bez zmian), nr 7 oferta 1:1 zostaje darem, nr 9 AUTO zostaje, nr 10 „pewne”: atakujący wygrywa w lustrze, nr 13 wojny AI↔AI zostają krótkie, szlak handlowy = tylko premia (bez przesuwania zapasów; kandydat 605036e6b NIE wchodzi), próg zmęczenia 0,8 potwierdzony.
