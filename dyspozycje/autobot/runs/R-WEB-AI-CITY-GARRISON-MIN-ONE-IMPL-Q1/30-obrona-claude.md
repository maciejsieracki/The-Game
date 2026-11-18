STATUS: DECISION_REQUIRED
DOMAIN: GAME (zachowanie AI)
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: stały garnizon min. 1 bojowej w każdym mieście AI także w pokoju, wyłączony z armii; pomiar PRZED/PO w grze.
ZMIANY-COMMIT: f4cb11cbc (ai-city-garrison.ts, wykluczenia, rekrutacja w pokoju, testy); 95023931b (miasta-państwa); 805f00012 (raport). Baza 04f870acd.
ODPOWIEDZI NA ZARZUTY:
1. Wspólna funkcja -- PRZYJMUJĘ, zrobione: getCityGarrisonUnitIds / cityNeedsGarrison / isGarrisonEligibleUnit.
2. Ścieżki -- PRZYJMUJĘ CZĘŚCIOWO. Zrobione: planArmyConcentration i planArmyFrontMerge (decideAITurn i defensiveCopy), planArmySeeksArmy. NIE zrobione: armyMerge (auto-scalanie), wysyłanie do generała, all-in wojny, odsiecz, ruchy zwiadowcze. homeDefenderPool celowo NIE wyklucza garnizonu (zasada g: garnizon liczy się do obrońców).
3. Rekrutacja w pokoju -- PRZYJMUJĘ, zrobione: emptyCityGarrisonRecruitIds bez warunku wojna/zagrożenie, dla obu ścieżek.
4. Test i mutacje -- PRZYJMUJĘ, zrobione: tools/ai-city-garrison-min-one-test.cjs 13/0; mutacja C2 (usunięte wykluczenie) czerwona. Mutacji rekrutacji nie uruchomiłem osobno.
5. Pomiar -- PRZYJMUJĘ, wykonany (seed 4242, 60 tur, świeży start, 1 Chromium, bundle vite poza repo), wynik poniżej.
6. Commit -- PRZYJMUJĘ.
TESTY (liczby z surowego wyjścia):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: ALL GREEN; unit-replace-test: 21/21; combat-test: All sanity checks passed
- siege-ai-test: 17 ok, 0 fail; siege-last-stand-sortie: 71 OK, 0 FAIL; ai-war-army-seeks-army: 22 PASS, 0 FAIL; ai-war-defend-home: 30/0; ai-home-defense-civilian-filter: 8/0; ai-home-defense-vs-barbarians: 46/0; ai-unit-replace-same-rules: 45/0
- army-concentration-test: 56/0 po korekcie progu sc.4 (6 -> 9; zmierzone 9: 5 garnizonów osobno + rezerwy)
- ai-war-city-garrison-test: 21/0 po korekcie G7/G9 (kontrakt pokoju zmieniony żądaniem właściciela)
- ai-city-garrison-min-one-test: 13/0
POMIAR (seed 4242, liczba pustych miast AI, peace/war):
- t30 peace 78/91 PO = 78/91 PRZED (audyt) -- BEZ ZMIANY
- t60: PO peace 9/10, war 152/183; PRZED (audyt) war 131/154 -- NIE PORÓWNYWALNE 1:1 (inna liczba miast).
WNIOSEK: w żywej grze rekrutacja garnizonu NIE zmienia liczby pustych miast w pokoju. Przyczyna NIE ZMIERZONA kauzalnie; kod wskazuje kandydata: main.ts ~47000-47040, gałąź 'jednostka' wymaga aiUpkeepRunwayAllows(...) i !aiNnsHoldOwners. Garnizon idzie zwykłą ścieżką zakupu, więc bramka runway go blokuje (reguła d: bez zadłużania).
BLOKADY: (1) DECYZJA: czy garnizon omija bramkę runway (ryzyko zadłużenia AI) czy czeka na nią. (2) Brak wykluczenia w armyMerge, odsieczy, marszach do generała, all-in. (3) Koszt utrzymania PRZED/PO (Pieniądz/turę) NIE ZMIERZONO. (4) Wznowienie przebiegu ze slotu zwróciło błąd openGame -- pomiar wykonany świeżymi startami.
RUNDY: 1/5 w tej sesji obrony (runda 2 tego ID).
NASTĘPNY KROK: pytanie ABC do właściciela: (A) garnizon kupowany poza bramką runway, kosztem możliwego zadłużenia AI; (B) garnizon kupowany tylko gdy runway pozwala (obecna bramka), skutek: część pustych miast zostaje pusta; (C) garnizon z bramką, ale przy braku środków rezerwacja z priorytetem zamiast ominięcia. Rekomendacja: C. Po decyzji: runda 3 (armyMerge, odsiecz, generał) i diagnostyka odrzuceń przez console.warn w pomiarze.
UWAGI-DLA-ORKIESTRATORA: node_modules zostawiony w worktree. Wyniki: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/po2/wyniki/seed4242.jsonl.
DEPLOY/PUSH: NIE WYKONANO
