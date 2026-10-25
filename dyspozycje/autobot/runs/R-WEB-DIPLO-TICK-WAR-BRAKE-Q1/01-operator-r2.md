STATUS: INCOMPLETE (runda 2: poprawki P7/P6-funkcji i odpowiedzi na zarzuty; integracja z silnikiem P3/P4/P6/P7 NIEZROBIONA; nie PASS, nie READY_FOR_DEPLOY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TICK-WAR-BRAKE-Q1
GOAL: P3, P4, P6, P7 za flagą DIPLO_TICK_WAR_BRAKE_ENABLED.

BAZA: c843ef60 (fast-forward z 00fe8dc4). ZMIANY/COMMIT: 4d7833c7 (3 pliki: gra/data/diplomacy-tick-params.json, gra/src/game/diplomacy-tick-war-brake.ts, gra/tools/diplo-tick-war-brake-unit-test.cjs). Push NIE, deploy NIE.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. P3 — PRZYJMUJĘ. Nie zaimplementowano: pętla tickDiplomacy (main.ts:34760–34790) nadal tylko gracz↔AI. NIEZROBIONE.
2. Źródło umów AI↔AI — PRZYJMUJĘ (ZAŁOŻENIE potwierdzone kodem): AI↔AI trafiają do activeDeals z kanoniczną parą strony (main.ts:19500 sojusz_siostry_, main.ts:34977 ai_cs_trybut_). Umowy szlaków AI↔AI NIE zweryfikowane (NIE_ZMIERZONO).
3. P4 — PRZYJMUJĘ. main.ts:19364–19365 i 34779–34780 nadal `false`. NIEZROBIONE.
4. P6 w silniku — PRZYJMUJĘ. Brak liczników per para w save/load, UI, wypowiedzenia. NIEZROBIONE. (parseCrisisCounters nadal nieużywane.)
5. P7 w silniku — PRZYJMUJĘ. Brak podpięcia pod tickDiplomacyPayments/akcję 14. NIEZROBIONE.
6. Flaga — PRZYJMUJĘ częściowo. Nazwa jako stała `DIPLO_TICK_WAR_BRAKE_FLAG` i `flagaDomyslna:false` w JSON; NIE ma jeszcze bramkowania silnika, więc flaga nic nie zmienia. Kryterium OFF=hash NIE_ZMIERZONO (brak zmian w silniku, więc hash = baza z konstrukcji: `git diff b4828f4c HEAD -- gra/src/main.ts gra/src/game/diplomacy.ts gra/src/game/ai.ts gra/src/ui` puste).
7. Podwajanie ×2 i klucze epok — PRZYJMUJĘ, NAPRAWIONE. Klucze `kamien/braz/zelazo` były błędne: `empireEpochForOwner` zwraca liczbę 1..10 (main.ts:2114). Tabela JSON teraz ma klucze "1".."10": 100, 200, 400, 800 … 51200 (×2 od epoki 3). `krokPktWymiany` przycina epokę do 1..10 i rzuca wyjątek przy braku wpisu. Test: kroki 1..10, epoka 0→1, 11→10, 799/800 (ep. 4), 51199/51200 (ep. 10). Usunięto `wymianaKrokPktDomyslny`. ZAŁOŻENIE: krok liczony wg epoki płacącego.
8. Sufit i handel +1 — PRZYJMUJĘ z dowodem: test „zaufanie 75 → 0” i „59,8 → +0,2” przechodzi. Arytmetyka: handel +1 (diplomacy.ts:1706 okolice, `handel_zaufanie_perTura`) + bonus max 5 = 6 ≤ 6 (brak dodatkowych źródeł handlu w computeTickZaufanieDelta).
9. Ostrzeżenie jednorazowe — PRZYJMUJĘ, NAPRAWIONE: `warnNow` = okno N−2 ≤ licznik < N (tury 3 i 4 przy N=5). Test: po load z licznikiem 2 ostrzeżenie jest od razu; krótkie N (N=2, ostrzeżenie 5) → ostrzeżenie od pierwszej tury (ZAŁOŻENIE). Samo wyświetlenie w UI NIEZROBIONE.
10. Brak diplo-tick-war-brake-test.cjs i mutacji — PRZYJMUJĘ. NIEZROBIONE (wymaga silnika).
11. Symulacja ≥5 seedów × 80 tur — PRZYJMUJĘ. NIE_ZMIERZONO: brak podpiętego silnika, nie ma czego symulować.
12. Istniejące suite'y — PRZYJMUJĘ, WYKONANO w tej rundzie (na HEAD 4d7833c7): logic-test 213/213; diplomacy-test 148/0; diplomacy-treaties-test 17/17; diplomacy-economy-test 21/21; diplomacy-war-gates-test 19/0; diplomacy-barbarian-cooperation-test 10/0; diplomacy-value-catalog-test 82/0; unit P6/P7 52/0; tsc --noEmit exit 0. NIE_ZMIERZONO: forced-war-*, war-allin-capital, ai-move-range-test 46/0, endturn-battle-deadlock 38/0 + exec 46/0, load-game-regression 34/0, ai-test 276/18, build Vite, smoke Chromium, pomiar czasu tury.
13. P1/P2/P5/Respekt — ODRZUCAM. Dowód: `git diff --stat b4828f4c HEAD` obejmuje tylko 3 pliki gra/ (params JSON, war-brake.ts, unit-test) plus poprzedni commit; żadne z P1/P2/P5/Respekt nie jest w diffie (grep `zaufaniePerNadwyzkaPn`/`wygladz` w diffie: brak).
14. Zatrzymanie na pytaniu do orkiestratora — PRZYJMUJĘ. Runda 2 idzie na ZAŁOŻENIACH z dispatchu, bez pytań.
15. SHA w raporcie — PRZYJMUJĘ: niniejszy raport podaje SHA (4d7833c7).

TESTY:
- node tools/diplo-tick-war-brake-unit-test.cjs → 52 pass / 0 fail.
- npx tsc --noEmit → exit 0.
- Regresje (lista w pkt 12) — wszystkie zielone; wynik nie dotyczy zmian P6/P7 (silnik nietknięty).

BLOKADY (realne, nie do obejścia w tej rundzie):
- Integracja silnika P3/P4/P6/P7 (main.ts: tickDiplomacy, buildDiplomacyTickCtxForPair, save/load, UI ostrzeżenie, wypowiedzenie przez stronę silniejszą z R1–R3 w pętli dipCmds). To zakres kilku rund; jedna runda Operatora nie domknie go z weryfikacją.
- Symulacja, smoke Chromium, mutacje — zależą od integracji.

RUNDY: 2/5

NASTĘPNY KROK (propozycja orkiestratora, do decyzji): rozbić dispatch na tematy: (a) P7 w silniku (dostawy akcji 14 + tickDiplomacyPayments, flaga); (b) P6 w silniku (liczniki, save/load, ostrzeżenie, wojna z R1–R3); (c) P3+P4 (pętla AI↔AI, dobra wola, wspólny wróg). Każdy z własnym testem silnikowym i mutacjami; symulacja i smoke na końcu.

DEPLOY/PUSH: NIE WYKONANO
