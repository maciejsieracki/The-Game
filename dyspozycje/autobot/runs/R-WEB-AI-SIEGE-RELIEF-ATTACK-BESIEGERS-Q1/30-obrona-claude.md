# R-WEB-AI-SIEGE-RELIEF-ATTACK-BESIEGERS-Q1 — raport Operatora, obrona (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-SIEGE-RELIEF-ATTACK-BESIEGERS-Q1
GOAL: AI atakuje oblegajacych swoje miasto przy przewadze >= 20% (priorytet przed ofensywa). Obrona: poprawki zarzutow 1-5.
ZMIANY-COMMIT: kod w commicie poprawek (SHA w polu sha wyniku); pliki: gra/src/game/ai.ts, gra/tools/ai-siege-relief-test.cjs, ten raport. Brak zmian w ai-siege-relief.ts, ai-params.json, main.ts.

## Odpowiedzi na zarzuty
1. PRZYJMUJE. applySiegeRelief wykluczal ownerId -1. Usunieto wykluczenie (ai.ts ~3577). Dowod: canEngageOwner/hasContactWith w main.ts ~45074-45080 zwracaja true dla barbarzyncow. Test (h): mutacja z przywroconym wykluczeniem -> 1 FAIL.
2. PRZYJMUJE. Asercje (a) wzmocnione: PRZED 3 rozkazy na oblegajacych, PO 7; zadna jednostka nie wchodzi na wlasne miasto (4,10); dla 7 vs 5 kazda jednostka zbliza sie do oblegajacych lub atakuje (naruszen=0). Scena bez "bazowego" ataku: jednostki w odleglosci >= 2 od oblegajacych, bo bazowa obrona domu i army-seeks-army w tej scenie maskowaly odsiecz (wyjscie 1000 = 0.2, identyczne).
3. PRZYJMUJE. Dodano granice: 5v5 (1,0) nie; 5v7 (1,4) tak; 6v7 (1,17) nie; 6v8 (1,33) tak. Parametr: 5v7 przy 0,5 nie, przy 0,2 tak; 6v7 przy 0,2 nie, przy 0,1 tak. Przypadki 1,2 dokladnie nie testowane (float 6/5), tylko sasiedztwo.
4. PRZYJMUJE. Mutacja wykonana na kopii ai.ts (zapis w scratchpad, przywrocenie, cmp OK): usuniecie wywolania applySiegeRelief -> 10 FAIL (PRZED nie jest juz overlayem progu 1000).
5. CZESCIOWO. ODRZUCAM "tylko 1 krok": firstStep = farthestStepWithinBudget(path, ruchLeft) (ai.ts ~985), jednostka idzie tak daleko, jak pozwala budzet. PRZYJMUJE: krok nie moze konczyc sie na wlasnym obleganym miescie (dodany warunek, ai.ts ~3634); garnizon jest wykluczony z uczestnikow. Znane ograniczenie: jednostka nieprzylegajaca nie atakuje w tej samej turze (approach, atak w nastepnej).
6. NIE_ZMIERZONO: zywa gra w Chromium (zrzut PRZED/PO) nie wykonana. Panstwa-miasta: NIE SPRAWDZONO w tej rundzie w pelni. Znaleziono: decideAITurn i applySiegeRelief zwracaja wczesnie dla opts.defensiveCopy (ai.ts ~3557 i ~3574); main.ts ustawia defensiveCopy dla typCityCopyOwners. Oznacza to, ze odsiecz NIE dziala dla owner w trybie defensiveCopy. Nie zmieniono (decyzja zakresu, nie bledu testu).

## Testy (kod po poprawkach, tsc i testy uruchomione w worktree)
- tsc --noEmit: exit 0.
- ai-siege-relief-test.cjs: 23 OK / 0 FAIL (wynik EXIT=0).
- Mutacja M2 (bez wywolania odsiecz): 10 FAIL. Mutacja M1 (przywrocone wykluczenie -1): 1 FAIL. Oba przywrocone, cmp OK.
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test: all sanity checks passed.
- Regresje AI: ai-home-defense-civilian-filter 8/0; ai-home-defense-vs-barbarians 46/0; ai-siege-requires-war 49/0; ai-war-army-seeks-army 22/0; ai-war-city-garrison 20/0; ai-war-defend-home 30/0; ai-war-gate 24/0; army-concentration 56/0; siege-ai 17/0; siege-last-stand-sortie 71/0.
- Asercje istniejacych testow nie zmienione.

## Ograniczenia / NIE_ZMIERZONO
- Zywa gra w przegladarce: NIE_ZMIERZONO.
- Panstwa-miasta (defensiveCopy): odsiecz nie dziala, patrz zarzut 6. Wymaga decyzji zakresu.
- Test (g) jest w symulatorze, nie w grze.
- Tematy poza zakresem do rozwazenia przez orkiestratora: brak.

BLOKADY: decyzja orkiestratora co do defensiveCopy (panstwa-miasta).
RUNDY: 2/5; ostatni werdykt: brak (Evaluator po rundzie 1: 6 zarzutow).
NASTEPNY KROK: Evaluator — przeglad poprawek 1-5, decyzja o panstwach-miastach.
DEPLOY-PUSH: NIE WYKONANO
