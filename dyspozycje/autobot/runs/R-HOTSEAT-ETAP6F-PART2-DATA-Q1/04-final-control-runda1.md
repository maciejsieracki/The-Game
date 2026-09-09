STATUS: PASS
TEMAT: R-HOTSEAT-ETAP6F-PART2-DATA-Q1
RUNDA: 1/5 (Obrona w tej samej rundzie)

WERDYKT ZARZUT 1: ODDAL (naprawa potwierdzona). Przeczytałem implementację
`pickSecondHumanStartHex` (cluster-spawn.ts) — filtr `occupiedHexes.every(o =>
hexDistanceAxial(...) >= minDistance)` sprawdza promień od KAŻDEJ zajętej pozycji, nie tylko
najbliższej — logika poprawna. `buildClusterStartPlan` (cluster-start.ts) buduje
`occupiedHexes` z `aiStartHexes` (zaakceptowane, po filtrze) + `spawnPlan.pendingSameTypeRivalHexes`
(pole pre-istniejące, publicznie eksponowane na planie). Napisałem WŁASNY, niezależny skrypt
weryfikacyjny (esbuild bundle realnego kodu, inny zakres seedów niż Operator/Evaluator: 500
seedów × 3 tryby = 1500 planów z drugim heksem, mapa 50×50): **0 dokładnych kolizji, 0
przypadków poniżej progu, minimalny zaobserwowany dystans = dokładnie próg (3)** — granica
działa poprawnie na krawędzi. Zarzut realnie oddalony.

WERDYKT ZARZUT 2: ODDAL (akceptowalne odłożenie, nie wymaga NAPRAW). Potwierdziłem czytaniem
kodu: `doStartGame()` (main.ts:35318) rzeczywiście nie przekazuje `params.civId2`/
`humanDistanceMode` do `applyClusterStartPlan`; jedyne miejsca wywołujące generator z drugą
cywilizacją to haki testowe. Sprawdziłem `newGameFlow.ts` — `selCiv2` jest zapisywany
WYŁĄCZNIE przy resecie (zawsze `null`), żaden ekran kreatora go dziś nie ustawia, więc
`params.civId2` jest zawsze `undefined` na jedynej dziś istniejącej ścieżce menu. To czyni
brak wpięcia genuinie zero-ryzykownym no-opem, nie ukrytym defektem. Dodatkowo: pełne
domknięcie end-to-end i tak wymaga jeszcze pola `humanDistanceMode` w `NewGameParams`
(którego dziś brak — selektor to jawnie następny pod-temat, ABC-Q4), więc częściowe wpięcie
samego `civId2` teraz i tak wymagałoby powtórnej zmiany w `R-HOTSEAT-ETAP6F-PART2-UI-Q1`.
Sensowniejsze technicznie jest jedno spójne wpięcie razem z UI. To decyzja czysto
techniczna/sekwencyjna — rozstrzygam ODDAL.

DOWÓD WŁASNEJ WERYFIKACJI: pełny diff 5 plików przeczytany (3 commity łącznie); `git diff
--stat 2c1049b7 HEAD` — allowlist 1:1 zgodny, zero plików spoza dispatchu, zero DOM/UI w
`newGameFlow.ts` (potwierdzone czytaniem diffu — 3 elementy: interfejs, moduł-var,
`buildParams()`); `tsc --noEmit` → 0 błędów; `node tools/hotseat-etap6f-part2-data-test.cjs`
→ 24/24; 5 bramek referencyjnych zielone (logic 213/213, tech-tree 19/19, research 33/33,
unit-replace 13/13, combat 6/6); regresje zielone (`hotseat-etap6f-start-migracja-test` PASS,
`hotseat-human-owners-test` 29/29, `hotseat-etap5-no-leak-test` A=PASS/B=PASS żywy Chromium);
własny niezależny test kolizji 1500 planów → 0 kolizji. Obie Blokady Operatora (1-2)
ponownie ocenione — runda 2 nie dotknęła main.ts/newGameFlow.ts, więc wcześniejsza ocena
Evaluatora ("obie akceptowalne") pozostaje aktualna.

PODSUMOWANIE DO COMMIT MESSAGE: R-HOTSEAT-ETAP6F-PART2-DATA-Q1 — Final Control PASS po
rundzie 2 (Obrona naprawiła kolizję pozycji drugiego heksu z miastami AI w
`pickSecondHumanStartHex`/`buildClusterStartPlan`, potwierdzone niezależnie 1500 planami/0
kolizji; brak wpięcia `civId2` do produkcyjnego `doStartGame` uznany za bezpieczne, świadome
odłożenie do `R-HOTSEAT-ETAP6F-PART2-UI-Q1`).

NASTĘPNY KROK: integracja orkiestratora → READY_FOR_DEPLOY. Po integracji: dispatch
`R-HOTSEAT-ETAP6F-PART2-UI-Q1`.
DEPLOY/PUSH: NIE WYKONANO
