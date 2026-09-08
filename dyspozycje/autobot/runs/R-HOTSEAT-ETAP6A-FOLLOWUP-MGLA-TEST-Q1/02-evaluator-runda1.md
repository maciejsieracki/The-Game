STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP6A-FOLLOWUP-MGLA-TEST-Q1
GOAL: Naprawić FAIL w gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs po Etapie 6a — bez zmian w gra/src/**.

TESTY: Niezależna weryfikacja w /home/user/wt-hotseat-etap6a-followup-mgla (HEAD 16ca94af).
- `node gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` → 17/17 PASS (potwierdzone własnym uruchomieniem).
- Kontrola nie-maskowania: wyciągnięty stary (bazowy, sprzed poprawki) plik testu z `git show 550014be:...` uruchomiony na DZISIEJSZYM main.ts → dokładnie 12 pass, 3 fail, te same trzy asercje wskazane przez Operatora (blok pathHexes.length>0, blok result.movePath.length>0, currentVisible()). Nowa wersja testu naprawia dokładnie te trzy miejsca, nic więcej — nie jest to przypadkowe zamaskowanie.
- Weryfikacja treści źródła: main.ts linia ~23653 ma `if (u.ownerId === humanOwnerId) hutCollected = checkVillageRewardsAlongPath(result.movePath);`, linia ~33728 ma `if (isMe(u.ownerId)) hutCollected = checkVillageRewardsAlongPath(pathHexes);`, a `currentVisible()` (linia 9752) deleguje do `ownPlayerVisibleHexes()` (linia 9717), która filtruje `u.ownerId === ME()` i liczy z bieżącej pozycji `u.q, u.r` — dokładnie zgodne z gałęzią `currentVisibleDelegated` w nowym teście.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
- `tsc --noEmit`: czysty (exit 0).
- `git diff --stat 550014be..HEAD -- gra/src/`: pusty, zero zmian w gra/src/**.
- `git diff --stat 550014be..HEAD`: tylko pliki dispatch/raportów + jedyny plik z allowlisty (mgla-odkrycie-wzdluz-sciezki-test.cjs, +29/-5). `git diff --check`: czysty.
- `git status --porcelain`: czysty (brak resztek po weryfikacji).

BLOKADY: brak.

RUNDY: 1/5

ZARZUTY: brak

NASTEPNY KROK: Final Control (Ścieżka A, Workflow) — DOMAIN: INFRA, kod źródłowy testu, więc Final Control wymagany zgodnie z dispatchem.
DEPLOY/PUSH: NIE WYKONANO
