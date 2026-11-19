STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-IMPL-Q1
GOAL: AI: fort od 40 nowych heksow, posterunek od 16, po wyczerpaniu limitu miast, do 15% puli Pracy w oknie t30-t90, przy zagrozeniu wojsko pierwsze; gracz bez zmian.
ZMIANY-COMMIT: baza kandydat 29efdb4dc (checkout detach). Poprawka obrony w commicie tej rundy (SHA = czubek, patrz pole sha w wyniku). Allowlista: gra/src/game/ai.ts (tylko planExpansionFortBuilding + wpiecie territoryRace w decideAITurnCore), gra/tools/ai-territory-race-test.cjs (sekcja H), ten raport. Nie dotknieto main.ts, terrain-improvements.ts, WERSJE.md, gra-robocza, istniejacych testow.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. PRZYJMUJE. planExpansionFortBuilding (druga sciezka: jednostka poza zasiegiem) nie miala progow 40/16, udzialu 15%, bramki zagrozenia ani cityLimitExhausted. Poprawka: gdy przekazano territoryRace (tylko decideAITurnCore), funkcja wymaga (a) cityLimitExhausted, (b) przy zagrozeniu w oknie brak fortu, (c) koszt fortu <= 15% puli w oknie, (d) zysk NOWYCH heksow >= 40 dla fortu / >= 16 dla posterunku (helper raceNewHexGain, ta sama definicja co pickFortClaims). Bez territoryRace (decideDefensiveCopyTurn, testy) zachowanie bez zmian. Dowod: sekcja H testu; mutacje kopii: usuniecie progu -> H2 FAIL, usuniecie bramki miast -> H3 FAIL, usuniecie zagrozenia -> H4 FAIL.
2. ODRZUCAM z dowodem. Dispatch (d): "poza oknem bez osobnego udzialu (jak dziś); przy zagrozeniu ... udzial forty = 0". Udzial istnieje tylko w oknie, wiec zerowanie udzialu przy zagrozeniu dotyczy okna. Test D i H6: tura 100 z zagrozeniem -> forty dozwolone. Do potwierdzenia przez orkiestratora (ABC).
3. PRZYJMUJE i domknieto. Dodano H8/H9 na PRODUKCYJNYCH progach (bez nadpisania JSON): heks poza zasiegiem z zyskiem 39 -> fort zablokowany; heks z zyskiem >=40 -> fort dozwolony. Wynik: H8 OK, H9 OK.
4. PRZYJMUJE czesciowo. Dodano test H3 (cityLimitExhausted=false blokuje sciezke ekspansji). Pelna sciezka planCityImprovements -> decideAITurn nie jest testowana end-to-end (brak fixtury); zostaje luka.
5. ODRZUCAM jako bug, ZOSTAWIAM jako decyzje liczbowa. Dispatch: "do 15% puli Pracy w oknie"; implementacja: limit per wywolanie (per tura) na sume wydatkow fortow. Skutek opisany przez Evaluatora (fort 100 Pracy zablokowany przy puli < ~667) wynika z literalnego 15%. Parametru nie zmieniam bez ABC. DO DECYZJI ORKIESTRATORA: czy 15% ma byc kumulatywne w oknie, czy per tura.
6. PRZYJMUJE: zmiana runtime nie zmierzona w tej rundzie. Bieg dymny 45 tur NIE WYKONANO (CPU: load average ~10 na 4 rdzeniach, runy innych sesji). Dowod runtime PRZED/PO na 2 ziarnach (150 tur) zostaje dla orkiestratora.

TESTY (surowe wyniki w tej rundzie):
- tsc --noEmit (gra/): exit 0, brak wyjscia
- ai-territory-race-test.cjs: WYNIK 29 OK / 0 FAIL (exit 0); przed poprawka 18 OK
- Mutacje kopii src (AI_RACE_SRC_DIR): m1 usuniety prog zysku w planExpansionFortBuilding -> 1 FAIL (H2); m2 usuniety warunek limitu miast -> 1 FAIL (H3); m3 usuniety warunek zagrozenia -> 1 FAIL (H4). Wszystkie czerwone.
- logic-test.cjs: LOGIC OK (213/213), exit 0
- ai-improvements-test.cjs: 56 passed, 0 failed
- fort-strazniaca-zasieg-zakladania-test.cjs: 85 passed, 0 failed
- fort-outpost-placement-rules-test.cjs: 40 passed, 0 failed
- ai2-heks-po-heksie-test.cjs: 39 passed, 0 failed
- auto-improvements-test.cjs: 46 passed, 0 failed
- auto-fort-claim-test.cjs: 61 OK / 2 FAIL (te same 2 bledy co na bazie wg Evaluatora; nie z tego tematu)
- Bieg dymny 45 tur: NIE WYKONANO (CPU)

BLOKADY: brak. Uwaga srodowiskowa: gra/node_modules w worktree to symlink tylko do odczytu na node_modules innego worktree (nie robiono npm ci; nic nie usunieto).
ZALOZENIA/UWAGI-DLA-ORKIESTRATORA:
- Pytania ABC do potwierdzenia: zagrozenie zeruje udzial fortow tylko w oknie (pkt 2); 15% per tura czy w calym oknie (pkt 5).
- Przy puli Pracy < ~667 fort (koszt 100) jest w oknie niemozliwy przy 15% per tura. Liczba do decyzji wlasciciela.
- Luka: planCityImprovements -> pickFortClaims bez testu E2E z decideAITurn.
RUNDY: 1/5 (obrona)
NASTEPNY KROK: Final Control (Sonnet) na czubku tej rundy; potem bieg PRZED/PO 150 tur (orkiestrator).
DEPLOY/PUSH: NIE WYKONANO
