# R-WEB-DIPLO-ZERO-TRUST-TREATY-BREAK-PROTECTOR-Q1 — obrona (runda 2) — Operator Haiku 5.5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (funkcja AI za flagą, domyślnie OFF)
TEMAT: R-WEB-DIPLO-ZERO-TRUST-TREATY-BREAK-PROTECTOR-Q1
GOAL: odpowiedzieć na zarzuty 1-6 raportu Evaluatora (commit 6e934c80) na bazie kandydata 3aba287b; zachować flagę OFF = zachowanie gry bez zmian.
ZMIANY/COMMIT: pliki: gra/src/game/diplomacy-zero-trust.ts (plan zerwania `zeroTrustBreakOrders` jako czysta funkcja; reset licznika w `zeroTrustRecordBreak`; import typów), gra/src/main.ts (tickZeroTrustTreaties korzysta z planu; `breakTreatyVoluntarily` dostał parametr `pokazPodpowiedz`; wiersz w warEventLog dla zerwań z udziałem gracza; zeroTrustOwners bez filtru wasali), gra/tools/diplomacy-zero-trust-unit-test.cjs (nowe testy planu). Commit: patrz SHA w odpowiedzi zwrotnej.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ. Filtr handel/NAP, wykluczenie wasali, próg i licznik wyciągnięte z closure main.ts do czystej funkcji `zeroTrustBreakOrders` (diplomacy-zero-trust.ts). Testy wołają prawdziwą funkcję: flaga OFF = brak zleceń i brak zmiany licznika; tura 5 = zlecenia tylko handel/NAP, sojusz i pokój nietknięte; partner = gracz i = AI; wasal (gracz i AI) wykluczony po obu stronach; próg 5 (4 tury = brak); zaufanie > 0 zeruje licznik; powtórka po zerwaniu dopiero po kolejnych 5 turach. Mutacja A (usunięcie filtru rodzajów) → FAIL 3. Mutacja B (brak zerowania licznika po zerwaniu) → FAIL 1. Oba mutanty przywrócone, plik zweryfikowany `cmp`.
2. PRZYJMUJĘ. `breakTreatyVoluntarily(dealId, initiatorOwnerId, pokazPodpowiedz = true)`; tick przekazuje `false`. Podpowiedź „Zerwano traktat" pozostaje tylko dla zerwań przyciskiem gracza. Dla partnera-gracza tick pokazuje komunikat zdarzenia.
3. PRZYJMUJĘ (z założeniem). Wiersz trafia do istniejącego dziennika Wydarzeń (`warEventLog`, `trimWarEventLog`, `refreshD1bHud`), gdy partnerem jest gracz. Zerwania AI↔AI nie trafiają do dziennika gracza; to zgodne z filtrem wpisów wojen AI↔AI w dzienniku. ZAŁOŻENIE do ABC, jeśli właściciel chce widzieć też zerwania AI↔AI.
4. PRZYJMUJĘ. `zeroTrustRecordBreak` zeruje licznik pary, więc zerwanie nie powtarza się co turę; kolejne zerwanie dopiero po 5 kolejnych turach zerowego zaufania. ZAŁOŻENIE: kara Wiarygodności wraca co 5 tur, gdy zero się utrzymuje. NIE_ZMIERZONO: czy AI w ogóle proponuje umowy przy Zaufaniu 0. To pytanie ABC pozostaje otwarte.
5. PRZYJMUJĘ jako NIE_ZMIERZONO. Brak biegu dymnego ≤30 tur seed 4242 z flagą ON. Nie uruchomiono przeglądarki w tej rundzie. Hak `window.__truceTestDebug.zeroTrustForTest` (runTick, count, stats) istnieje w main.ts, więc bieg może wykonać orkiestrator.
6. (a) PRZYJMUJĘ `<= 0` jako bezpieczną nadzbiór `= 0`; decyzja zapisana tutaj. Nie zbadałem w pełni ścieżki zapisu Zaufania w applyDiplomaticEvent, więc nie potwierdzam, że wartości ujemne są niemożliwe (NIE_ZMIERZONO). (b) PRZYJMUJĘ: gracz-wasal nie jest partnerem (wykluczenie symetryczne, test). Proponent-wasal też wykluczony, jak dotąd.

## TESTY (liczby z surowego wyjścia, uruchomione w tej rundzie)

- `npx`/`node node_modules/typescript/bin/tsc --noEmit` → exit 0 (bez błędów)
- `node tools/diplomacy-zero-trust-unit-test.cjs` → PASS=43 FAIL=0 (przed mutacjami i po przywróceniu)
- logic-test → LOGIC OK (213/213)
- tech-tree-test → 20 pass, 0 fail
- research-test → PASSED 33 / FAILED 0
- unit-replace-test → 21/21
- combat-test → 6/6
- diplomacy-test → 149 passed, 0 failed
- diplomacy-harder-unit-test → PASS 50 FAIL 0
- ai-ai-alliance-tick-test → suite 19/19 OK; mutants detected 8/8
- Bieg dymny ≤30 tur seed 4242, flaga ON: NIE_ZMIERZONO (przeglądarka nie uruchomiona w tej rundzie)
- Build (vite) nie uruchamiany (zakaz w gra/)

## BLOKADY

Brak. Bieg dymny z flagą ON jako NIE_ZMIERZONO (zob. pkt 5).

## UWAGI-DLA-ORKIESTRATORA

- W worktree pozostał nieśledzony plik `gra/src/game/.zt-backup.txt` (kopia zapasowa z mutacji). Nie mogłem go usunąć (zakaz rm). Należy usunąć przed integracją; nie został dodany do commita.
- Lista partnerów w planerze C1 (`tickAiAiAllianceRequests`, `partnerzy = [ME(), ...owners]`) nadal nie wyklucza gracza-wasala. Poza zakresem tej rundy; do decyzji orkiestratora.
- `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` (ignorowane przez git).

RUNDY: 2/5 (runda 1 = Operator r1; obecna = obrona)
NASTĘPNY KROK: Evaluator (ponowna ocena zmian z tego commita) → Final Control; orkiestrator: bieg dymny ON seed 4242 przez hak zeroTrustForTest.
DEPLOY/PUSH: NIE WYKONANO
