STATUS: BLOCK
DOMAIN: GAME (zachowanie AI, nowa funkcja)
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: Staly garnizon min. 1 jednostki bojowej w kazdym miescie AI, takze w pokoju, wylaczony z armii; pomiar PRZED/PO w grze.
ZMIANY-COMMIT: brak zmian w kodzie gry (gra/). Commit zawiera wylacznie ten raport. Baza: 04f870acd420ad712a7fe44f123709a60d810198 (checkout --detach OK).
TESTY: NIE ZMIERZONO. tsc, logic-test, testy AI i pomiar w grze nie zostaly uruchomione. Powod: brak node_modules w worktree i w gra/ w repo glownym; `npm ci --ignore-scripts` wymaga df -h / >= 4 GB, a na starcie wolne jest 3.1 GB (df -h /: 36G uzyte z 252G, 3.1G dostepne, 93%). Bramka dyspozycji zabrania startu bez 4 GB.
BLOKADY: (1) DYSK: 3.1 GB wolnego na / < wymagane 4 GB przed npm ci w gra/. Potrzebne: sprzatanie worktree zakonczonych tematow (w .claude/worktrees zajete ok. 18 GB) przez orkiestratora, potem ponowny start. (2) Testy .cjs bundluja ai.ts przez esbuild, wiec bez npm ci nie ma czego uruchomic. (3) Brak implementacji: sciezki z dispatchu (homeDefenderPool, army-concentration, armyMerge, marsze wojenne, wysylanie do generala, all-in, odsiecz) nie zostaly zmienione ani zweryfikowane. Istniejacy zalazek: ai.ts ~1935-1960 (EMPTY_CITY_GARRISON_UNIT_ID, emptyCityGarrisonRecruitIds) dziala tylko w wojnie/zagrozeniu.
RUNDY: 1/5 (zuzyta 1; BLOCK nie wymaga decyzji wlasciciela, wymaga wolnego dysku).
NASTEPNY KROK: Orkiestrator zwalnia dysk do co najmniej 4 GB (sprzatanie worktree po zapisanych refs/keep), potem uruchamia runde 2 tego samego ID z tym samym dispatchem. Zalozenia (a)-(g) z dispatchu bez zmian.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: Pomiar w grze (PRZED/PO, seed 4242) nie wykonany; wymaga wolnego dysku i jednego Chromium. Dispatch zaklada 4 GB przed npm ci, a worktree dla web zajmuje ok. 0,6-1 GB.
