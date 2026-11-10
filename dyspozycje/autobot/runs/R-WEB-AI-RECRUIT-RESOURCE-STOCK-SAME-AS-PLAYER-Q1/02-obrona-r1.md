STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-RECRUIT-RESOURCE-STOCK-SAME-AS-PLAYER-Q1
GOAL: Obrona audytu (runda 2) na zarzuty weryfikatora wobec raportu operatora r1 (commit 71fabea65). Naprawa tylko przy potwierdzonej luce; luki nie potwierdzono, zmian kodu gry brak.
ZMIANY/COMMIT: brak zmian kodu gry, WERSJE.md, gra-robocza/ ani testów. Jedyna zmiana: dyspozycje/autobot/runs/R-WEB-AI-RECRUIT-RESOURCE-STOCK-SAME-AS-PLAYER-Q1/02-obrona-r1.md (nowy plik, uzupełnienie audytu). Commit lokalny na bazie 71fabea65 (detached HEAD w worktree wf_eeefe62b-b2c-3). Nie wypchnięto (operator nie pushuje).
TESTY: NIE_URUCHOMIONO — brak zmian kodu; brak build/dev w gra/; brak pomiaru w symulacji (zarzut 3). Podstawa: odczyt kodu i gra/data/units.json (75 rekordów, policzone skryptem python -I).
BLOKADY: (1) Runtime tej roli to Haiku 5.5, dispatch zakładał Sonnet 5.5. (2) Pomiar źródeł Brązu ×1994 u AI: NIE_ZMIERZONO (osobny temat). (3) Dysk: 5.2 GB wolnego przy starcie obrony.
RUNDY: 2/5 (runda 1: audyt 71fabea65; runda 2: ta obrona)
NASTĘPNY KROK: orkiestrator: zintegrować commit obrony (git merge-base --is-ancestor 71fabea65 <SHA>; git diff --stat), zamknąć temat jako audyt bez zmian (PASS-WITH-NOTES); pomiar źródeł Brązu AI jako osobny temat albo ABC do właściciela.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty weryfikatora

### Z1. Brak AIREPL/executeUnitReplace w raporcie: PRZYJMUJĘ (uzupełniono)
Sprawdzone na kodzie (baza 71fabea65):
- Ścieżka zamiany AI: gra/src/main.ts l. 7974-8031 (komentarz l. 7974: AI i gracz używają executeUnitReplace z gra/src/game/unit-replace-execute.ts). Wywołanie AI: l. 8031 `executeUnitReplace(u, newTypeId, unitReplaceExecuteDeps(u.ownerId, true))`.
- Koszt surowca: l. 7997 `stockCost: newTypeId => unitStockCost(lookupUnitDef(newTypeId))`.
- Bramka zapasu: l. 7998 `canPayStock: cost => !unitReplaceStockMissingLabel({ money: 0, stock: cost }, ownerSurowcePoolFor(ownerId))`. Pula = ownerSurowcePoolFor (l. 9742), ta sama co przy zakupie.
- Silnik: gra/src/game/unit-replace-execute.ts l. 63-66: `if (hasStock && !deps.canPayStock(stock, unit)) return { ok: false, reason: 'stock', ... }`. Odmowa następuje PRZED zapłatą pieniędzy (l. 68-69, setTreasury) i PRZED payStock (l. 70). Zapas nie spada poniżej 0 (building-stock-cost.ts l. 137, Math.max(0, ...)).
- Drugi wywołujący: gra/src/game/ai-era-unit-promotion.ts l. 65-66 deleguje canPayStock i stockCost z deps (interfejs l. 30-32). Wiring tych deps w main.ts NIE zweryfikowano w tej rundzie. Zapisane jako ograniczenie.
- Nazewnictwo: „AIREPL” nie jest nazwą modułu w kodzie. Przyjęto, że chodzi o zamianę jednostek przez AI (unit-replace). Jeśli chodziło o inny mechanizm, do potwierdzenia.
Wniosek: zamiana AI ma tę samą bramkę zapasu co zakup. Luki nie ma. Zmian kodu brak.

### Z2. Wyjątek: wolny spawn garnizonów barbarzyńców: PRZYJMUJĘ (dopisano jako wyjątek)
- gra/src/game/barbarians.ts l. 1376 `tickBarbarianCityGarrisons` zwraca spawny (l. 1386 `const spawns`).
- gra/src/main.ts l. 42071-42085: spawn tworzy jednostkę z `ownerId: BARBARIAN_OWNER_ID`, bez sprawdzenia zapasu i skarbca, bez deductBuildingStockCostAcrossCities.
- Ocena: to nie jest zakup przez cywilizację AI. Właścicielem są barbarzyńcy, nie państwo z pulą zapasu. Wyjątek jest poza zakresem tematu „AI vs gracz”. Nie zmieniam go. Zapisuję jako świadomy wyjątek: jedyna ścieżka, w której jednostka powstaje bez zapasu cywilizacji.

### Z3. Brak pomiaru w symulacji: PRZYJMUJĘ jako ograniczenie, ODRZUCAM jako warunek zamknięcia tematu
- Przyjmuję: hipoteza „skąd Brąz ×1994 u AI” pozostaje NIE_ZMIERZONO. Raport tej części nie zamyka.
- ODRZUCAM, że pomiar warunkuje zamknięcie tego tematu. Cel tematu to zapas przy zakupie. Cel jest zamknięty dowodem z kodu: bramka zapasu działa identycznie dla gracza i AI (Z1 oraz sekcja „Ścieżka zakupu”). DODATEK 1 dispatchu dopuszcza audyt bez zmian kodu, gdy nie znaleziono luki.
- Pomiar źródła Brązu wymaga symulacji, poza tym tematem. Rekomendacja: osobny temat „pomiar źródeł Brązu AI” albo ABC do właściciela.

### Z4. Tabela zagregowana zamiast per jednostka: PRZYJMUJĘ (poprawiono)
Dodano tabelę 75 wierszy (jednostka × typ × surowiec i ilość × dodatek Mount × AI × gracz), wygenerowaną skryptem python -I z gra/data/units.json. Zagregowana tabela z 71fabea65 zgadza się z tymi danymi. Zbiorczo: Brąz 34, Żelazo 25, Drewno 15, brak 1 (Zwiadowca).

### Z5. Commit tylko lokalny, niewypchnięty: PRZYJMUJĘ (fakt)
- 71fabea65 jest w repo (git cat-file: commit). Nie był wypchnięty przez operatora i nie jest pushowany w tej rundzie.
- Commit obrony leży na 71fabea65. Orkiestrator integruje go przez merge-base i diff --stat przed uznaniem raportu za dowód (zasada 5 CLAUDE.md, incydent 2026-11-08).
- Precyzja bramki: sprawdzenie skarbca w main.ts l. 4583 (`ownerTreasury(ownerId) < totalGoldCost`) jest odczytem bez zmiany stanu. Mutacje (Manpower od l. 4672, pobranie zapasu) następują PO bramce zapasu l. 4649-4669. Zdanie „przed Manpower i skarbcem” z raportu 71fabea65 rozumiem jako „przed każdą mutacją Manpower i skarbca”.

## Ścieżka zakupu (potwierdzenie, gra/src/main.ts)
- purchaseRecruitmentUnit: l. 4552. Gracz: onPurchaseUnit. AI: l. 41746 `purchaseRecruitmentUnit(cmd.cityId, candId, item.koszt, ownerId)`.
- Bramka zapasu: l. 4649 `unitStockCost(unitDef)`, l. 4653 `ownerResourceStockAll(cities, ownerId)`, odmowy l. 4658 i 4669 (return false) przed Manpower (l. 4626 sprawdzenie, l. 4672 koszt).
- Wybór kandydata AI: l. 41700 `canAffordUnitRecruitFull(ownerSurowcePoolFor(ownerId), unitDef)`; precheck l. 40036; gracz l. 18027 i 18100 (ta sama funkcja).
- canAffordUnitRecruitFull = canAffordUnitRecruitStock (economy-upkeep.ts l. 907).
- Pula: ownerResourceStockAll (building-stock-cost.ts l. 200), niezależna od ownerId.
- Brak odgałęzienia „sam dostęp” dla AI ani po poziomie trudności w tych bramkach.

## Tabela: jednostka × surowiec × co sprawdza AI vs gracz (75 jednostek)
Źródło: gra/data/units.json. Ilość kosztu > 0 dla 74 jednostek. Zwiadowca (5) bez kosztu surowcowego.

| # | Jednostka | Typ | Koszt surowcowy (ilość) | AI sprawdza | Gracz sprawdza |
|---|---|---|---|---|---|
| 1 | Wojownik | Swordsman | Drewno (13) | TAK: zapas puli państwa ≥ 13 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 2 | Procarz | Slinger | Drewno (25) | TAK: zapas puli państwa ≥ 25 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 3 | Oszczepnik | Distance | Drewno (13) | TAK: zapas puli państwa ≥ 13 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 4 | Łucznik | Distance | Drewno (13) | TAK: zapas puli państwa ≥ 13 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 5 | Zwiadowca | Civilian | brak (koszt surowcowy 0) | nie dotyczy | nie dotyczy |
| 6 | Włócznik | Spearman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 7 | Wojownik z mieczem i tarczą | Swordsman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 8 | Rydwan (woły) | Mount | Drewno (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Drewno + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 9 | Konnica | Mount | Brąz (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Brąz + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 10 | Galera | Naval | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 11 | Falanga | Falangite | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 12 | Hieros Lochos (Święty Zastęp) | Swordsman | Żelazo (38) | TAK: zapas puli państwa ≥ 38 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 13 | Hastati | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 14 | Triari | Spearman | Żelazo (38) | TAK: zapas puli państwa ≥ 38 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 15 | Jeździec chiński | Mount | Brąz (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Brąz + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 16 | Hu Ben Wei (Gwardia Tygrysa) | Swordsman | Brąz (38) | TAK: zapas puli państwa ≥ 38 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 17 | Impi | Spearman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 18 | Oszczepnik Zulu (Izijula) | Distance | Drewno (13) | TAK: zapas puli państwa ≥ 13 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 19 | uThulwana (Białe Tarcze) | Swordsman | Brąz (38) | TAK: zapas puli państwa ≥ 38 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 20 | Wojownik z maczugą (Chaska) | Offensive | Drewno (13) | TAK: zapas puli państwa ≥ 13 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 21 | Wojownik z toporem | Offensive | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 22 | Procarz (Huaracoc) | Slinger | Drewno (25) | TAK: zapas puli państwa ≥ 25 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 23 | Oszczepnik (Estólica) | Distance | Drewno (13) | TAK: zapas puli państwa ≥ 13 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 24 | Królewska Gwardia | Swordsman | Brąz (38) | TAK: zapas puli państwa ≥ 38 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 25 | Rydwan konny | Mount | Brąz (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Brąz + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 26 | Łucznik egipski | Distance | Drewno (13) | TAK: zapas puli państwa ≥ 13 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 27 | Rydwan egipski | Mount | Brąz (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Brąz + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 28 | Wojownik z khopesh | Swordsman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 29 | Medżaj (Gwardia Faraona) | Swordsman | Brąz (38) | TAK: zapas puli państwa ≥ 38 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 30 | Łucznik nubijski | Distance | Drewno (25) | TAK: zapas puli państwa ≥ 25 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 31 | Łucznik sumeryjski | Distance | Drewno (13) | TAK: zapas puli państwa ≥ 13 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 32 | Rydwan sumeryjski | Mount | Brąz (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Brąz + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 33 | Włócznik sumeryjski | Spearman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 34 | Gwardia Królewska Sumeru | Swordsman | Brąz (38) | TAK: zapas puli państwa ≥ 38 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 35 | Wojownik mykeński | Swordsman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 36 | Rydwan mykeński | Mount | Brąz (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Brąz + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 37 | Wojownik Sherden | Swordsman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 38 | Halabardnik Shang | Swordsman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 39 | Rydwan Shang | Mount | Brąz (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Brąz + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 40 | Łucznik akadyjski | Distance | Drewno (25) | TAK: zapas puli państwa ≥ 25 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 41 | Gaesatae | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 42 | Soldurii | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 43 | Rydwan celtycki | Mount | Żelazo (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Żelazo + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 44 | Wojownik germański | Swordsman | Żelazo (38) | TAK: zapas puli państwa ≥ 38 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 45 | Berserker germański | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 46 | Taran | Siege | Drewno (19) | TAK: zapas puli państwa ≥ 19 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 47 | Taran okuty | Siege | Brąz (38) | TAK: zapas puli państwa ≥ 38 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 48 | Katapulta | Siege | Żelazo (38) | TAK: zapas puli państwa ≥ 38 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 49 | Wieża oblężnicza | Siege | Brąz (38) | TAK: zapas puli państwa ≥ 38 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 50 | Wojownik tyrreński | Offensive | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 51 | Wojownik szekelesz | Spearman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 52 | Konnica lancowa asyryjska | Mount | Żelazo (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Żelazo + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 53 | Konnica łucznicza asyryjska | Mount | Żelazo (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Żelazo + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 54 | Łucznik asyryjski | Distance | Drewno (25) | TAK: zapas puli państwa ≥ 25 Drewno (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 55 | Drużynnik | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 56 | Jeździec z oszczepami | Mount | Żelazo (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Żelazo + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 57 | Strażnik bram Harappy | Spearman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 58 | Piechota induska | Spearman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 59 | Garnizon Harappy | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 60 | Rydwan Kapadokijski | Mount | Brąz (25) + 5 Koni | TAK: zapas puli państwa ≥ 25 Brąz + 5 Koni (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 61 | Piechota hetycka | Spearman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 62 | Gwardia hetycka | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 63 | Gwardia Ishtar | Swordsman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 64 | Wojownik babiloński | Swordsman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 65 | Piechota neobabilońska | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 66 | Tyrski miecznik | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 67 | Wojownik fenicki | Swordsman | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 68 | Gwardia Tyreńska | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 69 | Thorakites | Spearman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 70 | Evocati | Swordsman | Żelazo (38) | TAK: zapas puli państwa ≥ 38 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 71 | iButho z iklwa | Spearman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 72 | Gwardzista z champi | Offensive | Brąz (25) | TAK: zapas puli państwa ≥ 25 Brąz (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 73 | Wojownik z żelaznym khopesh | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 74 | Mur tarcz (Sargonid) | Spearman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
| 75 | Miecznik galijski | Swordsman | Żelazo (25) | TAK: zapas puli państwa ≥ 25 Żelazo (bramka l. 4649-4669; canAfford l. 41700) | TAK: ta sama bramka (purchaseRecruitmentUnit) |
