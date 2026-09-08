STATUS: PASS

DOMAIN: GAME

TEMAT: R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1

GOAL: Część A — strażnik ponownej weryfikacji lasu przy komicie budowy AI tartak/oboz_lowiecki
(naprawa wyścigu). Część B — świadome dołączenie `tartak` do
`FOREST_DEPENDENT_IMPROVEMENT_KEYS` (odwrócenie wcześniejszego kanonu, zgodnie z decyzją
orkiestratora do potwierdzenia rano przez ABC).

ZMIANY/COMMIT: commit `678fd999` na `autobot/R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1`.
`gra/src/main.ts`: dodano strażnik `hexForImprovement.nakladka !== Nakladka.Las` przed komitem
`tartak`/`oboz_lowiecki` do `placedImprovements` w pętli AI (~linia 32588). Ścieżka gracza
(`applyBuildRequest`/`commitBuildRequest`) zweryfikowana i NIE wymaga symetrycznej łaty: dla
tartak/oboz_lowiecki (budowa NA lesie, nie usuwająca go) `needsConfirm` jest false, więc commit
jest synchroniczny z klikiem — brak okna wyścigu analogicznego do AI. `gra/src/map/improvement-build.ts`:
`'tartak'` dodany do `FOREST_DEPENDENT_IMPROVEMENT_KEYS`, komentarze zaktualizowane. Przekotwiczono
8 asercji w 6 plikach `gra/tools/*.cjs` (map-improvement-qualify-test, oboz-lowiecki-las-test,
oboz-lowiecki-ev-r2-mainpath, oboz-lowiecki-fc-r2-nowa-sciezka, hodowla-las-test,
stadnina-las-test) zależnych od poprzedniego kanonu — każda z jawnym komentarzem odnotowującym
świadome odwrócenie. Nowy plik `gra/tools/tartak-oboz-wyscig-race-test.cjs`.

TESTY: `tsc --noEmit` 0 błędów (C-029: symlink `node_modules` z `/home/user/The-Game/gra`, wersja
zweryfikowana 5.9.3, symlink usunięty po). Nowy test wyścigu: 8/8 PASS po zmianie; zweryfikowany
przez `git stash` na kodzie sprzed zmiany — 4/8 FAIL (A1/A2/B1/B2), dowód nietautologiczności
zgodnie z kryterium binarnym. Testy end-to-end silnika (P7-C/D w `oboz-lowiecki-las-test.cjs`,
sekcja D w `oboz-lowiecki-ev-r2-mainpath.cjs`) potwierdzają tartak faktycznie znika z
`placedImprovements` po wyrębie (gracz i AI, 538/538 heksów). Wszystkie 8 zmienionych plików
`.cjs` uruchomione: 0 nowych regresji względem stanu przed zmianą (zweryfikowane `git stash` —
identyczne 19/1/1 pre-istniejących FAIL w `oboz-lowiecki-las-test`/`map-improvement-qualify-test`/
`oboz-lowiecki-ev-r2-mainpath`, niezwiązane z tym tematem, obecne też na bazie). Potwierdzono:
kontrakt `auto-improvements.ts` (spłaszczanie wzgórza) logicznie niezależny — brak zmian tam.

BLOKADY: brak.

RUNDY: 1/5.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow).

DEPLOY/PUSH: NIE WYKONANO
