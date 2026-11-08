STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — pamięć
TEMAT: R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1
GOAL: ustalić przyczynę wzrostu pamięci, zwolnić niepotrzebne, wykazać efekt w t.50/60/100 bez zmiany reguł i AI.

RUNDA: 2/5 (obrona po FAIL Evaluatora R1). Stan odtworzony z commita Operatora R1 `634f26c6fd1740cb6c56bf81ec4c18e61d57ab41`
(gałąź `memgrow-rootcause-q1-r2`). W worktree leżały niezacommitowane zmiany wcześniejszej, przerwanej próby
(hak `cpuBytes`, narzędzie `memory-growth-gpu-cpu-bytes-measure.cjs`) — niezwiązane z Z1, wycofane. Zostawiłem
tylko sprzątanie katalogu tymczasowego w `memory-growth-merge-index-test.cjs` (odpowiada na N4).

## Z1 — PRZYJMUJĘ

Zarzut potwierdzony reprodukcją (nie tylko analizą): build bez poprawki, test F2 → 3 FAIL —
posterunek na heksie nieodkrytym `visible:true`, na heksie odkrytym `fogDim:null` (pełna jasność zamiast 0,175).
Log: `gate-r2-control-without-fix-cpu-release-test.txt` (17 OK / 3 FAIL, EXIT=1).

Poprawka (`gra/src/main.ts`):
- `rebuildImprovementMeshesAfterContextRestore` na końcu stosuje mgłę do przebudowanych meshy:
  `syncImprovementMeshFog(vis, explored)` z nowej funkcji `improvementFogViewSets()`, która zwraca dokładnie te
  zbiory, jakich używa `refreshFog` (mgła włączona: `currentVisible()` + `fogExploredForRender()`; wyłączona:
  `ALL_KEYS`; galeria: nic).
- ZAŁOŻENIE: celowo NIE `refreshFog()` — ma skutki dla stanu gry (`updateDiplomaticDiscovery`,
  `checkNewDiplomaticContacts`, edukacja weteranów, `addExplored`). Utrata kontekstu GPU nie może zmieniać stanu gry.
- Haki testowe (`__fortTerritoryTestDebug`): `improvementMeshInfo` zwraca też `visible` i `fogDim`;
  nowe `improvementFogMismatches()` (wszystkie meshe ulepszeń vs. to, co ustawiłby refreshFog),
  `farUnexploredLandHex`, `markExploredAndRefreshFog`, `refreshFogNow`.

Test B (`gra/tools/memory-growth-improvement-cpu-release-test.cjs`), nowe asercje F:
- dwa posterunki obcego właściciela daleko od miasta: jeden na heksie nieodkrytym, drugi na odkrytym-niewidocznym;
- F1 (przed utratą) i F2 (po odzyskaniu kontekstu): nieodkryty ukryty, odkryty widoczny i przyciemniony (0,175),
  widoczny w pełnej jasności, `improvementFogMismatches() == []`.
- Wynik z poprawką: 20 OK / 0 FAIL. Bez poprawki: 17 / 3 FAIL (kontrola dowodzi, że test wykrywa wadę).

## TESTY (R2, ten HEAD)
- tsc `--noEmit`: 0 błędów (`gate-r2-tsc.txt`, EXIT=0).
- logic-test 213/213 (`gate-r2-logic-test.txt`).
- memory-growth-merge-index-test 24/0 (`gate-r2-memory-growth-merge-index-test.txt`).
- memory-growth-improvement-cpu-release-test 20/0, Chromium (`gate-r2-memory-growth-improvement-cpu-release-test.txt`).
- war-allin-capital-quick: hashe identyczne z `gate-base-war-allin-capital-quick.txt` (diff bez `ms`) (`gate-r2-war-allin-capital-quick.txt`).
- Nie powtarzałem: ai-test (zmiana dotyczy tylko renderu i haków testowych w `main.ts`, ai-test nie bundluje `main.ts`),
  visual-parity (nie dotyczy heksów widocznych), pomiar 100 tur (NIE_ZMIERZONO; poprawka nie alokuje nowej pamięci).

## UWAGI Evaluatora
- N1 (rozjazd trajektorii jednostek 409 vs 439 w t.100): przyjęte do wiadomości. Po korekcie o ~0,12 MB/jedn.
  nachylenie PO ≈ 0,85 MB/turę, nadal ≥ 2× mniej niż 2,05.
- N4: usunięty `/tmp/civ-merge-index-8UuQAT`; test sprząta katalog także po wyjątku/SIGINT.
- N5: meshe ukryte mgłą trzymają kopię CPU do pierwszego renderu — znane, bez zmian.
- `/tmp/civ-memq1-r2` (wcześniejsza próba) pozostaje — nie utworzony w tym wywołaniu.

BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (ponowna ocena Z1).
DEPLOY/PUSH: NIE WYKONANO
