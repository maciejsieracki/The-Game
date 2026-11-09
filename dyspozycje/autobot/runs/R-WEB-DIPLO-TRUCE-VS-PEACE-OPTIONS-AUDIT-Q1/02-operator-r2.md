STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-DIPLO-TRUCE-VS-PEACE-OPTIONS-AUDIT-Q1
GOAL: Odpowiedź Operatora na FAIL rundy 1: odtworzenie stanu z 7620dd14a, odpowiedź na każdy zarzut (PRZYJMUJĘ / ODRZUCAM z dowodem), poprawa AUDYT-ROZEJM-POKOJ.md. Zero zmian w gra/.
ZMIANY/COMMIT: baza odtworzona z 7620dd14a (detach w worktree wf_fbd0b010-f02-3). Commit r2: SHA w sekcji „Commit” poniżej. Allowlista: wyłącznie dyspozycje/autobot/runs/R-WEB-DIPLO-TRUCE-VS-PEACE-OPTIONS-AUDIT-Q1/ (AUDYT-ROZEJM-POKOJ.md zmieniony, 02-operator-r2.md nowy). Brak zmian w gra/, WERSJE.md, docs.
TESTY: NIE_URUCHAMIANO (audyt read-only). Weryfikacja: rg/grep po gra/src, odczyt linii z 7620dd14a (patrz AUDYT, sekcja „Zakres kontroli r2”).

## Odpowiedzi na zarzuty

Zarzut 1 (licznik „runda 1/3”, NEGOTIATION_MAX_ROUNDS): PRZYJMUJĘ. Licznik istnieje: NEGOTIATION_MAX_ROUNDS = 3 (gra/src/game/diplomacy-proposals.ts:2230), PendingNegotiation.round (2251), canPlayerCounterNegotiation (2358-2360), format subtitle w gra/src/main.ts:15295 (`' (runda ${n.round}/${NEGOTIATION_MAX_ROUNDS})'`), UI „Kontroferta r/max” w gra/src/ui/diplomacyAudience.ts ~1890-1910. Dodany mechanizm kontrofert do audytu (R2-1) i pytanie G (czy rozejm/pokój przez stół z kontrofertami).

Zarzut 2 (źródło „Rozejm na 10 tur”; hipoteza PEACE_TREATY_LOCK; pytanie F): PRZYJMUJĘ. Tekst „Rozejm na N tur” nie występuje w gra/src (rg, 7620dd14a). negotiationSummary dla `pokoj` zwraca „Propozycja pokoju (PW baza 500)” (main.ts:17106), dla `nap` „Pakt nieagresji na N tur” (main.ts:17080-17083). Hipoteza „10 tur = PEACE_TREATY_LOCK_TURNS” wycofana jako spekulacja; źródło zrzutu oznaczone NIE_ZMIERZONO. Pytanie F usunięte z listy ABC (źródło jest kwestią audytu, nie decyzji właściciela). ODRZUCAM jedynie sugestię, że NAP jest źródłem zrzutu: NAP ma inną etykietę, więc nie jest dowodem.

Zarzut 3 (logika AI niepełna; willingnessPeace; turnsAtWar=5; AI→AI): PRZYJMUJĘ. Dodano: priorytety ai.ts:5233-5252 wyłącznie na `rw`; willingnessPeace (diplomacy.ts:1284-1294, zwrot 1349) bez odczytu w gra/src, czyli martwa dla decyzji; heurystyka turnsAtWar=5 (ai.ts:5205, diplomacy-proposals.ts:371); wypowiedzenie wojny używa willingnessWar (ai.ts:5395). AI→AI: decideAIDiplomacy wołane w main.ts:33438 w pętli po właścicielach AI; pełny przepływ AI↔AI oznaczony NIE_ZMIERZONO (luka do domknięcia przed implementacją).

Zarzut 4 (zakres kontroli: kolejka zdarzeń, etykiety, render pendingów, spec sprzeczny z kodem): PRZYJMUJĘ. Dodano: kolejka zdarzeń main.ts:15275-15300 i diploPendingTitle (main.ts:16365-16376); renderPnBalancePanelForPeace (ui/diplomacyAcceptanceBalance.ts:874) to alias do „Traktat pokoju”; spec gra/data/diplomacy.json:302-307 opisuje rozejm (5–15 tur) i pokój (Relacja po czasie), a kod ma dZ=5 Zaufanie natychmiast (diplomacy.ts:883-889, „soft approximation”). Sprzeczność spec↔kod opisana w R2-4. Render w przeglądarce i testy runtime: NIE_ZMIERZONO.

## Commit
Patrz odpowiedź końcowa (SHA commitu r2). Commit zawiera wyłącznie dwa pliki w katalogu runu.

## Wynik r2 w skrócie
- Główna teza r1 (brak rozejmu z wyborem długości; StanWojny.Rozejm i RodzajTraktatu.Rozejm nigdzie nie przypisane; gracz ma tylko przycisk „Zaproponuj pokój”) — POTWIERDZONA w r2.
- Korekta: licznik rund istnieje i wyjaśnia część zrzutu; stół negocjacyjny z kontrofertami działa dla pokoju.
- Korekta: „10 tur” NIE jest powiązane z kodem w tym SHA (NIE_ZMIERZONO).

BLOKADY: (1) Źródło tekstu „Rozejm na 10 tur” NIE_ZMIERZONO w tym SHA. (2) Pytania ABC A–E i G zadaje orkiestrator; nie zadano ich w tej rundzie. (3) Pełny przepływ AI↔AI i render w przeglądarce NIE_ZMIERZONO.
RUNDY: 2/5 (runda 1: FAIL; runda 2: ta odpowiedź obrony)
NASTĘPNY KROK: orkiestrator ponownie wystawia Evaluator/Final Control na tym samym ID; po PASS — pytania ABC A–E, G (F usunięte) do właściciela.
DEPLOY/PUSH: NIE WYKONANO
