STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-CITIZENS-VS-RECRUITS-SEPARATE-Q1
GOAL: DODATEK 2 (nadrzędny): w uproszczonej karcie listy dyplomacji (diploListHud.ts / diplomacy-display.ts) dodać wiersz "Rekruci" w pełnych jednostkach werbu, bieżąca / maks., dla obu stron, obok Ludność/Armia. Audiencja bez zmian.
BAZA: origin/main = 06e6d782c (HEAD worktree). Gałąź dispatchu claude/sprawdzenie-funkcjonalnosci-ek4ra0 (a83202dd5) jest starsza od main; diplomacy-display.ts i test są w niej identyczne w miejscach zmian, diploListHud.ts na main jest nowszy.

ZMIANY/COMMIT:
- ALLOWLISTA (OK): gra/src/game/diplomacy-display.ts (import formatFullNumber; pola recruitsUnits/recruitsUnitsMax w DiploPlayerSummaryInput oraz theirRecruitsUnits/theirRecruitsUnitsMax w DiploCivListEntryInput; helper formatRecruitsUnitsPart zwraca "Rekruci: X / Y"), gra/src/ui/diploListHud.ts (pola rel recruitsUnits/recruitsUnitsMax przekazywane do formatDiploCivListLines), gra/tools/diplomacy-display-test.cjs (+5 asercji).
- POZA ALLOWLISTĄ (WYMAGA ROZSZERZENIA ALLOWLISTY ALBO ODRZUCENIA): gra/src/main.ts (+19: helper diploListRecruitUnitsForOwner obok audienceRecruitsForOwner; przekazanie danych w buildPlayerDiploSummary i w buildPlayerDiploRelations) oraz gra/src/ui/diplomacyPanel.ts (+3: pola recruitsUnits/recruitsUnitsMax w interfejsie DiploRelation, wymagane przez typecheck dla literału w main.ts). Bez main.ts wiersz NIE pojawi się w grze (brak danych), więc temat nie jest domknięty.

ZAŁOŻENIE (do potwierdzenia przez Evaluatora): "w jednostkach pełnych" = floor(pula / koszt jednostki epoki), ta sama funkcja co rekrutEkw w panelu "Rekruci (pula werbu)" (rekrutUnitEquivalents z manpower.ts, mnożnik costMult jak w buildEmpireDetailSnap). Sprzeczność w dispatchu: "ta sama wartość co w audiencji" vs "w jednostkach pełnych". Audiencja pokazuje SUROWY Manpower (recruitsAttrHtml, formatFullNumber), więc wybrano jednostki pełne, zgodnie z zapisem "w jednostkach pełnych" i z prośbą właściciela ("ogólną liczbę rekrutów pełnych jednostek"). Audiencja NIE została zmieniona. Jeśli właściciel chce surowy Manpower także w karcie, to zmiana w formatRecruitsUnitsPart i w main.ts (pool.rekruci / pool.max zamiast rekrutUnitEquivalents).
Nazwa "Ludność" NIE zmieniona na "Obywatele" (opcjonalne; poza zakresem, by nie ruszać testów).

TESTY:
- node gra/tools/diplomacy-display-test.cjs: 40 OK, 0 FAIL (w tym 5 nowych asercji: format "Rekruci: 1 234 / 5 678", clamp <0, wiersz w karcie obcej, brak wiersza bez danych, wiersz w karcie gracza).
- node gra/tools/diplo-panel-recruits-level-test.cjs (RECRLVL): PASSED 22 / FAILED 0.
- node gra/tools/diplomacy-lista-podglad-przed-wizyta-test.cjs: 53 pass, 0 fail.
- gra/node_modules/.bin/tsc --noEmit: exit 0 (po dodaniu pól do DiploRelation).
- gra/recruit-hud-label-test.cjs: FAIL PRZED ZMIANĄ (pre-existing). Oczekuje tekstu "pełnych jedn.", a recruitHudLabel.ts zwraca "(N)". Pliku nie zmieniano, NIE naprawiano.
- git diff --check: czysto.
- NIE_ZMIERZONO: wiersz w żywej grze / przeglądarce nie był oglądany.

BLOKADY:
1. Allowlista nie obejmuje gra/src/main.ts i gra/src/ui/diplomacyPanel.ts. Bez nich dane nie docierają do karty. Decyzja orkiestratora: rozszerzyć allowlistę o te 2 pliki (wtedy cherry-pick commitu 2) albo zakończyć BLOCK.
2. Dysk: przy starcie 3,5 GB wolnego (próg web >= 4 GB). Przekroczone o 0,5 GB. npm ci --ignore-scripts w gra/ (node_modules, ignorowane przez git) do usunięcia przy sprzątaniu.
3. Pre-existing FAIL recruit-hud-label-test.cjs (patrz wyżej).

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o allowlist (main.ts, diplomacyPanel.ts). Potem Evaluator (Sonnet) na commitach; w razie zgody na rozszerzenie FC z cherry-pick commitu 2.
DEPLOY/PUSH: NIE WYKONANO
