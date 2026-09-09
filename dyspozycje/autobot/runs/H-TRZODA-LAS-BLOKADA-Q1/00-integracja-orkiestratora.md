STATUS: PASS (integracja orkiestratora, po ECHO właściciela)
TEMAT: H-TRZODA-LAS-BLOKADA-Q1 (PR #137)

PR Hermesa nie zawierał żadnego dokumentu dispatch/operator/evaluator/final-control (jedyny
z pięciu PR-ów tej serii bez śladu procesu), mimo deklaracji "Final Control PASS /
READY_FOR_INTEGRATION" w opisie PR.

Przy review orkiestrator wykrył: PR opisuje się jako "block cattle... preserve sheep block",
ale realny skutek kodu i testów blokuje na lesie ZARÓWNO bydło JAK I owce — cofając fragment
jawnej, datowanej decyzji właściciela (R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1, ECHO
2026-08-27 "Tak, odwracamy — wszystkie trzy": owce/bydło/lama miały zostać odblokowane na
lesie). Opis PR-a był niezgodny z jego własnym skutkiem.

ECHO właściciela (2026-09-09, zapytany wprost): cofnąć całą decyzję z 2026-08-27 — owce i
bydło mają być ponownie zablokowane na lesie, lama zostaje odblokowana (nietknięta tym
tematem).

ZMIANY: `gra/src/map/improvement-build.ts` (PR #137 bez modyfikacji — usunięcie owce/bydlo z
FOREST_COEXIST_IMPROVEMENT_KEYS, dodanie do FOREST_BLOCKED_IMPROVEMENT_KEYS, dedykowany
tooltip dla bydła, usunięcie wyjątku Las z isOwceBaseTerrain), `gra/tools/hodowla-las-test.cjs`
i `gra/tools/map-improvement-qualify-test.cjs` (PR #137 bez modyfikacji — odwrócone asercje).

DODATKOWO (poza zakresem PR #137, znalezione przez orkiestratora przy pełnej weryfikacji
skutków ubocznych): dwa INNE, niezwiązane pliki testowe miały własne asercje "zero regresji"
oparte na starym kanonie (owce/bydło odblokowane), teraz stałe się fałszywie czerwone:
- `gra/tools/stadnina-las-test.cjs` (3 asercje w sekcji KRYTERIUM 3) — zaktualizowane do
  nowego kanonu, 28/28 PASS (było 25/28).
- `gra/tools/oboz-lowiecki-las-znika-render-test.cjs` (1 asercja w sekcji G, lista
  OCZEKIWANE_PRZEPUSZCZONE 5→3 kluczy) — zaktualizowana, 26/27 PASS (jedyna pozostała awaria,
  `TERRAIN_ALLOW.lodzie_rybackie`, jest PRZEDISTNIEJĄCA i niezwiązana — potwierdzone
  identycznym wynikiem na czystym `main` sprzed tej integracji, `git stash` + ponowne
  uruchomienie).

TESTY: hodowla-las-test.cjs 113/113, map-improvement-qualify-test.cjs 133/133,
stadnina-las-test.cjs 28/28, oboz-lowiecki-las-znika-render-test.cjs 26/27 (1 przedistniejąca,
niezwiązana awaria). tsc --noEmit czysty. 5 bramek referencyjnych zielone.

DEPLOY/PUSH: WYKONANO (bezpośredni push do main, zgodnie z ustaloną tego dnia procedurą).
