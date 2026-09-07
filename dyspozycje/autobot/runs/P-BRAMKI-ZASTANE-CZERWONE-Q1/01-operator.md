# P-BRAMKI-ZASTANE-CZERWONE-Q1 — Operator, runda 1/5

**Uwaga proceduralna:** agent Operator zwrócił kompletną treść tego raportu przez
StructuredOutput, ale proces zakończył się przed zapisaniem/zacommitowaniem pliku na dysku
(ani zmian w kodzie). Orkiestrator odtwarza ten raport z zarejestrowanej treści zwrotnej
agenta, bez zmiany choćby jednego znaku, i commituje w jego imieniu (patrz commit `fa1a608a`,
łączący pracę Operatora i Obrony — nie dało się ich retroaktywnie rozdzielić).

STATUS: PASS
DOMAIN: PROCESS
TEMAT: P-BRAMKI-ZASTANE-CZERWONE-Q1
GOAL: Naprawić dwie zastane czerwone bramki (punkty A i B z 00-dispatch.md), wyłącznie testy, zero zmiany balansu/mechaniki.

ZMIANY/COMMIT: worktree `/home/user/wt-bramki-zastane`, gałąź `autobot/P-BRAMKI-ZASTANE-CZERWONE-Q1`, HEAD `a29540b6` (base f0174f2a potwierdzone). Niescommitowane zmiany robocze (integracja poza rolą Operatora):
- `gra/tools/building-queue-refund-test.cjs` — literał `cost.drewno`: 10→50 (realna `buildingStockCost()`: drewno=25×FALA2×2=50, zweryfikowane `node -e` na buildings.json+r-stawki-strojenie.ts); scenariusz `c1:22/c2:33=55` (>=50, żadne miasto samo nie pokrywa kosztu → pobór realnie rozproszony po obu). 5 asercji (było 3), zero ubytku.
- `gra/tools/barb-city-capture-cluster-test.cjs` — okno 2h-static: zamiast stałej 4000 znaków, koniec okna = index najbliższej deklaracji (`function|const|let|var`) na TYM SAMYM wcięciu co `function applyCityCaptureToMap(` (sąsiad strukturalny, zmierzone dziś: 13423 znaków — pełna funkcja, sibling to `refreshMapAfterCityCapture`), z assertem że margines > 6412 i fallbackiem 40000 gdy sibling nie znaleziony. Skaluje się automatycznie z przyszłym wzrostem funkcji, nie wymaga ręcznej aktualizacji stałej.

TESTY:
- `node tools/building-queue-refund-test.cjs` → 5/5 PASS (było 2/5 fail).
- `node tools/barb-city-capture-cluster-test.cjs` → 96/96 PASS (było 92/93; +3 nowe asercje strażnicze okna).
- Dowód mutacyjny B: tymczasowa podmiana `isBarbarian(atkOwner)`→`false` w main.ts (w pamięci, skryptem) → test poprawnie czerwienieje (2 FAIL: 2h-static + regresja-guard) z NOWYM oknem; natychmiast `git checkout -- gra/src/main.ts`, `git diff --stat main.ts` = puste.
- `npx tsc --noEmit` → 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
- `git status --porcelain` końcowy: wyłącznie 2 allowlistowane pliki testowe; `git diff --check` czyste; brak `gra/data/`, `gra/src/main.ts`, `building-stock-cost.ts`, `r-stawki-strojenie.ts` w diffie.

BLOKADY: brak. Rozbieżność clamp/refund opisana w dispatch (pkt A) NIE jest realnym ryzykiem produkcyjnym — potwierdzone: afordancja (`canAffordBuildingStock`) zawsze poprzedza deduct w obu wołaniach (`ui/cityPanel.ts`, `main.ts`), scenariusz niedoboru nieosiągalny — brak DECISION_REQUIRED.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high) — weryfikacja zarzutów na tym diffie.
DEPLOY/PUSH: NIE WYKONANO
