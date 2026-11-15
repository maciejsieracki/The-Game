# 10-operator-claude — R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1 (Operator, runda 2/5 wg dispatchu; zadanie = zrzut Chromium r3 z dodatku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane + dokumentacja + test; dowód UI)
TEMAT: R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1
GOAL: Ceramika zużywana przez obywateli w Kamieniu (1 na obywatela na turę); kara −2 Szczęścia / −1% Rozwoju za brakujący surowiec do czasu Garncarni. Ta runda: domknięcie punktu (e) — zrzut panelu pokrycia surowców obywateli w epoce 1 (stan z ceramiką i bez niej). Bez zmian logiki gry, balansu ani AI.
BAZA: e0be467a8 (`git checkout --detach e0be467a8`). Kod gry identyczny z 01b4593bb: `git diff --stat 01b4593bb e0be467a8` = jedna linia (dodany `50-final-control-claude.md`, dokument). `origin/main` NIE zawiera jeszcze gałęzi ceramiki (`git merge-base --is-ancestor e0be467a8 origin/main` = NIE); scalenie z origin/main nie było w zakresie tej rundy — do integratora.

ZMIANY/COMMIT (allowlista: runs/<ID>/** + gra/tools/*citizen*):
- NOWY `gra/tools/citizen-ceramics-panel-shot.cjs` — narzędzie zrzutu: kopiuje `gra/` do katalogu scratch poza repo, wstawia do KOPII main.ts hak (`showPanel`, `hidePanel`, `zeroCeramika`, `setEraAll`, `fixture`), buduje vite, steruje headless Chromium (viewport 1280x900, seed 7). Repo nie zmienione poza tym plikiem.
- NOWE `dyspozycje/autobot/runs/R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1/evidence/panel-kamien-z-ceramika-seed7.png`
- NOWE `.../evidence/panel-kamien-bez-ceramiki-seed7.png`
- NOWE `.../evidence/panel-kamien-seed7.json` (wynik: era, usunięta ceramika, odczyty tekstów panelu)
- Commit: SHA w polu `sha` raportu StructuredOutput (czubek gałęzi detach).
- Brak zmian w `gra/src`, `gra/data`, `wikiBundle`, testach, dokumentacji, `WERSJE.md`, manifeście, `rust-port`.

TESTY (surowe wyniki z tego przebiegu):
- Zrzut: `node tools/citizen-ceramics-panel-shot.cjs run <scratch> <evidence> 7` → `BUILD_OK`, `RESULT_FILE=.../panel-kamien-seed7.json`, `{"era":1,"removed":5000,"obywatelZ":3,"obywatelBez":3,"errors":[]}` (0 błędów pageerror).
- Stan Z ceramiką (magazyn 5000): wiersz „Ceramika 5000 / 50000” z tagiem `Obywatele: POKRYTE`; podsumowanie „obywatele: pokryte”; Drewno i Glina też „POKRYTE”. Dowód: `evidence/panel-kamien-z-ceramika-seed7.png`.
- Stan BEZ ceramiki (usunięto 5000, `zeroCeramika` zwrócił 5000): wiersz „Ceramika 0 / 50000” z tagiem `Obywatele: NIEDOBÓR`; podsumowanie „obywatele: niedobór”; Drewno/Glina nadal POKRYTE. Dowód: `evidence/panel-kamien-bez-ceramiki-seed7.png`.
- Panel widoczny: prawy panel „Rzymianie / Magazyn państwa (wspólny)” — 14 surowców w obiegu; w stanie bez ceramiki „Brutto +131 → netto +88 szt./turę”, w stanie z ceramiką „netto +68” (różnica = zużycie obywateli, zgodnie z oczekiwaniem).
- `npx tsc --noEmit` (w gra/): exit 0, 0 linii wyjścia.
- `git diff --check`: exit 0 (czysto).
- Test jednostkowy/mutacja z poprzedniej rundy (sekcja L `citizen-resource-upkeep-test.cjs`) nie była uruchamiana ponownie — kod nie zmieniony; wynik r1/r2: 122 pass / 2 fail, 2 czerwone = czerwone-na-bazie (kotwica `ordPctRaw` w main.ts, F1 mutant 1).
- Pomiar w grze (`sim-seed{1,2,3}-60t.json`, wcześniejsze pliki z r2): bez zmian; nie powtarzane (dispatch: „potwierdź, nie powtarzaj bez potrzeby”).

BLOKADY:
- Zrzut wykonany dla panelu pełnego (bez wyboru sekcji `surowce`); kontekst pod panelem to okno „Audiencja dyplomatyczna” otwarte w headless od startu gry — to tło, nie wpływa na wiersze surowców. NIE_ZMIERZONO: zrzut w czystym HUD bez okna dyplomacji.
- NIE_ZMIERZONO: bilans „jedno miasto, 20 obywateli, Kamień” (Garncarnia 30 − obywatele 20 − Spichlerz I 10) — nie liczony w tej rundzie, bo nie był wymagany w dodatku (wynik z r2 pomiaru stoi).
- DECISION_REQUIRED (bez zmian, dla orkiestratora): gracz pasywny bez Garncarni nie ma ceramiki 60/60 tur (pomiar r2). Wariant A (literalne polecenie właściciela, bez zmian kary i bez ceramiki startowej) — zgodnie z dodatkiem NIE wdrażam B ani C.
- Dług Rust: REPIN tabeli obywateli (Kamień + ceramika) — poza zakresem.

UWAGI-DLA-ORKIESTRATORA:
- Kandydat: dispatch wskazuje „origin/main” jako bazę, a `e0be467a8` nie jest jego przodkiem; zastosowano `e0be467a8` wg polecenia uruchomienia (kod = 01b4593bb). Integrator musi zrobić merge origin/main przed deployem.
- Tekst panelu w `empireDetailPanel.ts` ~l.3410–3412 („+1 Szczęście każde miasto” / „kara −1 Szczęście”) rozjeżdża się z kodem (±2) — zgłoszone w r2 jako osobny drobny temat tekstowy. NIE_ZMIERZONO w tej rundzie: czy tekst jest widoczny w zrzucie (nie rozwijano bloku „Obywatele”; nie był w zakresie zrzutu). Do decyzji: osobny temat albo r3 w allowliście gra/src/ui (tylko teksty).
- `gra/node_modules` zainstalowany w worktree (`npm ci --ignore-scripts`, ignorowane przez git); do sprzątnięcia po integracji.
- Pliki scratch build: `<scratchpad>/ceram-panel` (poza repo).

RUNDY: 2/5 wg dispatchu (dodatek „runda 2”; FC r2 = FAIL z jednym zarzutem: zrzut Chromium). Ta runda domyka zarzut 6.

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja dwóch PNG i JSON w `evidence/`, odczyt surowych tekstów z JSON, potwierdzenie `tsc 0` i `git diff --check`; potem Final Control.

DEPLOY/PUSH: NIE WYKONANO
