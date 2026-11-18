STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1
GOAL: odpowiedź na zarzuty Evaluatora (db52137a0, baza 455d864e7): (1) test live omijał realne miejsca wywołania w main.ts; (2) przemarsz i wasal bez pomiaru live. Obie strony zmierzone na realnej ścieżce akceptacji.
ZMIANY-COMMIT: SHA w sekcji DEPLOY-PUSH (commit obrony). Pliki: gra/src/main.ts, gra/tools/diplo-treaty-payment-live-test.cjs, ten raport.

## Zarzut 1 — PRZYJMUJĘ (poprawka + dowód)
Poprawka: wszystkie akceptacje oferty AI przez gracza (8 realnych miejsc: przycisk „Przyjmij", stół, kontroferta, odpowiedź AI, hooki) idą przez jedną funkcję `resolvePlayerAcceptsAiPendingWired` (main.ts ~l.26001), która sama dołącza `carrierCtx`. Ctx nie da się już pominąć w pojedynczym miejscu wywołania. Jedyne bezpośrednie wywołanie `resolvePlayerAcceptsAiPending(` poza wrapperem to AI↔AI (applyAiAiHandelSurowiecCmd) — poza zakresem tematu.
Dowód statyczny (live test, sekcja S, zielone): S1 wrapper dołącza ctx; S2 `carrierCtx:` tylko w wrapperze (1 wystąpienie); S3 bezpośrednie wywołania = 2 (wrapper + AI↔AI); S4 drugie to AI↔AI; S5 wywołań przez wrapper >= 7.
Dowód mutacyjny (zarzut 1 Evaluatora): usunięcie `carrierCtx` z wrappera → live 67/79, FAIL na wszystkich 5 traktatach AI→gracz (`carrier=null`, brak przelewu) oraz S1/S2. Źródło przywrócone z kopii, cmp zgodny.

## Zarzut 2 — PRZYJMUJĘ (pomiar wykonany; wynik: jedna luka zakresu)
Test live ustawia siłę tak, by wnioskodawca spełniał próg Respektu (przemarsz ≥55%, wasal ≥70%) i asertuje precondycję przed propozycją (`precondycja Respekt ... ≥ N%`, zielone).
Wyniki realnej akceptacji (zielone = stan po zgodny z wierszem okna):
- AI→gracz (płatnik gracz): NAP, sojusz obronny, sojusz pełny, przemarsz (AI 69%), wasal (AI 82%, zapasy bogate) — nośnik przelany, zapasy płatnika −ilość, odbiorca +ilość, technologia tylko gdy odbiorca jej nie ma, wiersz okna = nośnik.
- gracz→AI (płatnik gracz): NAP, sojusz obronny, sojusz pełny — jak wyżej.
- gracz→AI przemarsz i wasal (gracz 88% / 94% siły → płatnik AI): NIE ZMIERZONO przelewu. Traktat zaakceptowany, `carrier=null`, zapasy AI nietknięte. Test przypina ten stan jako ZNANĄ LUKĘ (nie PASS): `treatyCarrierPlanForPlayerPayer` zwraca null, gdy `split.strongerSide === 'a'`; planer obsługuje wyłącznie gracza jako płatnika (komentarz „Stopień technologii NIE jest tu jeszcze podłączony"; W5 z r2 — płatnik AI nie podłączony).
Ta luka dotyczy każdej akcji w kierunku gracz→AI, gdy gracz jest silniejszy (nie tylko przemarszu/wasala). Nie naprawiona tutaj: wymaga planera z zapasami i technologiami AI oraz decyzji właściciela, czy płatnik-AI ma płacić (decyzja 2 dispatchu mówi o słabszej stronie, ale FALA 826 mówi o gracz-płatniku w bramce).

## Testy (kolejność: przed = 455d864e7, po = ten commit)
- tsc --noEmit: exit 0 (przed i po).
- logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/0; unit-replace-test 21/21; combat-test 6/6.
- diplo-treaty-payment-wiring-test: 468 pass / 0 fail.
- diplo-treaty-payment-carrier-test: 11 pass / 0 fail; mutanty niewykryte 0.
- diplo-treaties-power-parity-test: 50/0; diplo-treaties-ai-parity-test: 80 PASS (exit 0); diplo-rozejm-parity-test: 25/0.
- diplo-peace-tail-integration-test: 42/0; diplo-peace-tail-proposal-test: exit 0 (9 PASS); diplo-war-peace-sim-test: exit 0 (25 PASS); diplo-peace-last-stage-payment-test: 12/12.
- Live (diplo-treaty-payment-live-test.cjs, Chromium, bundle z vite poza repo): 149/149 passed, plus 2 znane luki (NIE ZMIERZONO). Jeden przebieg zakończył się zamknięciem przeglądarki w trakcie „wasal gracz→AI" (`Target page ... closed`, log GPU); ponowny przebieg czysty. Log: scratchpad/live-r4-run3.log.

## BLOKADY
- Decyzja właściciela: czy płatnik-AI (gracz silniejszy, przemarsz/wasal/każda akcja gracz→AI) ma płacić D z zapasów AI i jaka kolejność dla AI. Do tego czasu kierunek gracz→AI przy silniejszym graczu przechodzi bez przelewu (test to przypina).
- Stopnie „praca" i „pieniądze (¤)" — poza zakresem (decyzja 3b, czeka na rano).

## RUNDY
Obrona r4 (odpowiedź na zarzuty FC r4). Poprzednie: r1 FC FAIL, r2 FC FAIL, r3 FC FAIL (defekt AI→gracz, naprawiony w 455d864).

## NASTĘPNY KROK
Orkiestrator: decyzja właściciela o płatniku-AI (ABC). Dopóki brak decyzji — nie integrować jako READY_FOR_DEPLOY. Jeśli właściciel potwierdzi „płaci AI": osobny temat na planer z zapasami AI (treatyCarrierPlanForPlayerPayer z parametrem płatnika).

## DEPLOY/PUSH: NIE WYKONANO
