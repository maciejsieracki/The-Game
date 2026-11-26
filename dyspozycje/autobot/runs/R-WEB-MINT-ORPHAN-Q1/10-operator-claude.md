STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MINT-ORPHAN-Q1 (MINTORPHAN #162, odp. 17)
GOAL: Osierocona Mennica poza stolicą jest nieaktywna i nie znika; da się ją wyburzyć; po ukończeniu nowej Mennicy w stolicy stare Mennice poza stolicą znikają; powrót stolicy do miasta z nie wyburzoną Mennicą reaktywuje ją; Mennica działa tylko w stolicy.
BAZA: cb18bff7c5fd1613a9ab6fb8667bdfcd88dabbb6 (origin/main)

ZMIANY/COMMIT:
- NOWE gra/src/game/mennica-orphan.ts: mennicaCityIdsReplacedByCapital (miasta właściciela inne niż stolica, w których stoi Mennica; pusta gdy stolica nie ma Mennicy), builtWithoutMennica, demolishBuildingIds (wyburzenie bez zwrotu; null gdy budynku nie ma).
- ZMIANA gra/src/main.ts (applyProductionCompleted, gałąź budynku): hook po ukończeniu `mennica` tylko gdy capitalCityIdForOwner(city.ownerId) === cityId; usuwa Mennicę z pozostałych miast tego właściciela; komunikat „Mennica w <miasto> została zastąpiona nową w stolicy.” (gracz); updateHud. Import z ./game/mennica-orphan.
- NOWE gra/tools/mint-orphan-test.cjs: 24 PASS / 0 FAIL (scenariusze 1–5 z dispatchu, mutacje M1 bez hooka, M2 zła heurystyka stolicy, M3 brak guardu stolicy, statyczny test okablowania hooka w main.ts).
- Brak zmian w buildings.json, production.ts, turn-economy.ts, cityPanel.ts (bonus i etykieta osieroconej Mennicy były już w FALI 914 i działają; zweryfikowane testem).

TESTY (surowe wyniki, uruchomione w gra/ w worktree):
- tsc --noEmit: exit 0, 0 linii błędów (baseline też 0)
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21); unit-replace-{archer-slinger,army-multi-select,full-cost,multitype-walk,promotion-table}: exit 0
- combat-test: 6/6 pass
- ai-test: 297 passed, 0 failed
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- waluta-mennica-test: 61 passed, 0 failed
- trade-routes-income-test: 135 passed, 0 failed
- mint-capital-only-test: 8 PASS / 0 FAIL (bez regresji)
- mint-orphan-test (nowy): 24 PASS / 0 FAIL
- Mutacje czerwone: M1 (zdjęty hook, stara Mennica zostaje) wykryta asercją; M2 (heurystyka pierwszego miasta) wykryta; M3 (brak guardu stolicy) wykryta. Mutacje działają na funkcji czystej i symulacji hooka; sam hook w main.ts nie jest wykonywany przez test (brak uruchomienia gry), sprawdzony statycznie i przez tsc.
- NIE ZMIERZONO: uruchomienie w przeglądarce / live. Efekt w grze po ukończeniu budowy w stolicy nie został zobaczony na żywo.

BLOKADY: brak twardych blokad. Patrz UWAGI-DLA-ORKIESTRATORA (wyburzenie).

RUNDY: 1/5
NASTĘPNY KROK: FC: weryfikacja hooka w main.ts (pełny przepływ ukończenia budowy) oraz decyzja o UI wyburzania (patrz niżej) przed deployem.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. (2) WYBURZENIE NIE ISTNIEJE W GRZE: przeszukanie gra/src i gra/data nie znajduje żadnej akcji wyburzenia ani sprzedaży ukończonego budynku (brak przycisku, brak funkcji usuwania z city.built, brak flagi „nie do wyburzenia” w buildings.json). Dodano tylko czysty helper demolishBuildingIds (testowany). Nie było flagi do zdjęcia, więc buildings.json nietknięty. Pełna funkcja „Wyburz” (przycisk w panelu miasta, zwrot lub brak zwrotu, potwierdzenie, komunikat, zapis) to NOWY feature z wpływem na grę. Wymaga osobnego tematu i decyzji właściciela o zwrocie (ZASADY ABC). Nie zaimplementowano UI.
2. Hook (4) sprawdza capitalCityIdForOwner z main.ts, czyli ten sam resolver co bonus. Hook działa też dla AI, bo applyProductionCompleted obsługuje wszystkie miasta.
3. Znalezisko poza zakresem: MINTDEBT (#165) nadal opisuje heurystykę „pierwsze miasto” w pozostałych efektach stolicy; ten temat tego nie rusza.
4. Stan roboczy: gra/node_modules zainstalowane lokalnie w worktree (npm install --ignore-scripts, bez build/dev); usunąć po bramkach.
