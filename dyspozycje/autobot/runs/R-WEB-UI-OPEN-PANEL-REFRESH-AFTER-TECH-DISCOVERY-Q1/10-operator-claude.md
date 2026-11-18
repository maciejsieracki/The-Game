# R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1 — Operator (runda 2/5, Haiku 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1
GOAL: naprawić wyłącznie test-strażnik tak, aby na kandydacie e12764b59 dawał PASS (Murarstwo i Obróbka drewna), na no-op odświeżenia FAIL z właściwą różnicą wierszy, a kontrola bez technologii nie dawała PASS. Kod poprawki w gra/src/main.ts NIE zmieniony (wg FC).
ZMIANY/COMMIT: baza = kandydat e12764b59 (detach). Zmieniony plik: gra/tools/open-panel-refresh-after-tech-live-test.cjs — `prepareNonEraCompletion` wywoływany PRZED pierwszym otwarciem panelu i odczytem A (błąd kolejności z r2 usunięty; blok listy bez zmian: koniec na „Jeszcze zablokowane”). Dowody: dyspozycje/autobot/runs/R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1/dowody/ (katalogi kandydat-murarstwo, kandydat-obrobka-drewna, noop-murarstwo, noop-obrobka-drewna, kandydat-kontrola-bez-techu; każdy z open-panel-refresh-after-tech.json). SHA: patrz sekcja „SHA” w odpowiedzi strukturalnej (commit tego raportu).
TESTY (surowe wyniki, ten build kandydata; build wykonany poza repo w scratchpadzie, vite build exit 0):
- `npx tsc --noEmit` (gra/): exit 0.
- logic-test: `LOGIC OK (213/213)`, exit 0. tech-tree-test: `20 pass, 0 fail`, exit 0. research-test: `ALL GREEN`, exit 0. unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0. combat-test: `All sanity checks passed.`, exit 0.
- Guard, kandydat, TECH=Murarstwo: `VERDICT PASS`, exit 0; blockLinesA 34, visibleChange true, różnice stale/fresh puste.
- Guard, kandydat, TECH="Obróbka drewna": `VERDICT PASS`, exit 0; blockLinesA 37, visibleChange true, różnice puste.
- Guard, no-op odświeżenia (kopia main.ts poza repo, `refreshOpenPanelsAfterTechDiscovery` puste ciało), Murarstwo: `VERDICT FAIL`, exit 1; B≠C, brak w B: „Stela / Pomnik”, „Warsztat kamieniarski”, „Mury kamienne”.
- Guard, no-op, "Obróbka drewna": `VERDICT FAIL`, exit 1; brak w B: „Stolarnia”.
- Kontrola MODE=control (kandydat, bez technologii): `VERDICT BLOCKED` (exit 2), visibleChange false, brak różnic — nie PASS.
- Nie uruchomiono ponownie testów paneli miasta/rekrutacji ani testu W18: kod gry w tej rundzie nie zmieniony (tylko plik testu), więc wpływ możliwy tylko na sam strażnik.

BLOKADY: brak.
NIE ZMIERZONO (luki z zarzutów 3–6, oddalone wg FC): rekrutacja imperium (refreshEmpireRecruitPanel na żywo), handel tech, nauka wioski, scroll/zaznaczenie/wyszarzenie w panelach; powtarzalność przebiegów (po jednym przebiegu na każdą konfigurację).
Uwaga: kopia no-op (`$SCR/pr-noop/gra`) i kopie buildów (`$SCR/pr-build`, ~150 MB każda) pozostają poza repo; do sprzątnięcia przez orkiestratora. Brak rm wykonanego przez Operatora.

RUNDY: 2/5 (r2 = ten przebieg; licznik porażek Haiku = 1).
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje test i dowody; Final Control; integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dowody pokazują, że defekt odtwarza się na no-op i znika z poprawką (zgodnie z FC r2).
- Pliki dowodów w korzeniu `dowody/` (open-panel-refresh-*.{txt,json}, mutacja-*, fix-PASS.json itd.) pochodzą z wcześniejszych rund i pierwszego przebiegu tej rundy (Murarstwo, PASS); katalogi podrzędne zawierają przebiegi porównawcze.
