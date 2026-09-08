STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1
GOAL: Część A — strażnik ponownej weryfikacji lasu przy komicie budowy AI tartak/oboz_lowiecki
(naprawa wyścigu). Część B — świadome dołączenie `tartak` do FOREST_DEPENDENT_IMPROVEMENT_KEYS.

OBRONA: 1 -> PRZYJMUJĘ + dowód.
Uzasadnienie ZARZUTU: Evaluator słusznie wskazał trzecie miejsce piszące tartak/oboz_lowiecki do
`placedImprovements` — pętlę automatu ulepszeń GRACZA (`main.ts`, blok "R-AUTO-ULEPSZENIA-Q1=C",
`for (const pick of picks)`, ~30483-30550), którego raport rundy 1 w ogóle nie wspomniał.
Analiza (teraz udokumentowana w kodzie, komentarz przy nowym strażniku ~30517-30530): w TEJ
pętli nie ma dziś aktywnego okna wyścigu — jedyne w tej samej turze usunięcie lasu przed tym
punktem to `tickHexClearing` (~29233), wywoływane WCZEŚNIEJ niż `pickAutoImprovements` (~30441) w
tej samej funkcji EOT, więc `picks` powstaje już PO nim. Wewnątrz samej pętli wyrąb gracza
(branch `typ === 'wycinka'`, ~30503-30516) NIE usuwa lasu instant — startuje wyłącznie
wieloturowe `hexClearingStates`/`tickHexClearing` (w przeciwieństwie do AI, gdzie wyrąb ustawia
`nakladka = Nakladka.Brak` NATYCHMIAST w tej samej pętli — to była przyczyna realnego wyścigu w
Części A). Żaden wcześniejszy `pick` w tym samym przebiegu nie może więc ściąć lasu pod kolejnym
pickiem w tej samej turze.
Mimo to, zgodnie z rekomendacją Evaluatora, dodano w tej samej rundzie analogiczny strażnik
(`(pick.key === 'tartak' || pick.key === 'oboz_lowiecki') && hexForImprovement.nakladka !==
Nakladka.Las -> continue`) — obronnie, dla parytetu strukturalnego ze ścieżką AI i jako
zabezpieczenie na wypadek przyszłej zmiany kolejności komitów w tej pętli — PLUS test (CZĘŚĆ E,
E1-E4) w `tartak-oboz-wyscig-race-test.cjs`, tą samą metodą anchor-based co część A-D, wycinający
dosłowny blok komitu tej pętli.
Dowód nietautologiczności: `git stash` cofający TYLKO zmianę w `main.ts` -> 3/13 FAIL (E1, E1b,
E2) na starym kodzie; po przywróceniu -> 13/13 PASS. `tsc --noEmit`: 0 błędów.

ZMIANY/COMMIT: Nowy commit `3603779b` na `autobot/R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1` (na
`678fd999`). Zmienione WYŁĄCZNIE dwa pliki z allowlisty rundy 1: `gra/src/main.ts` (+18 linii:
strażnik + komentarz w pętli automatu gracza, ~30517-30534) i
`gra/tools/tartak-oboz-wyscig-race-test.cjs` (+112/-2: nowa CZĘŚĆ E). Żaden inny plik nietknięty
(`git status --short` po commicie: puste; worktree czyste, brak osieroconych `.tartak-race-*`).

TESTY:
- `tsc --noEmit` (symlink node_modules z głównego drzewa, usunięty po): 0 błędów.
- `tartak-oboz-wyscig-race-test.cjs` PO zmianie: 13/13 PASS (A1/A2/B1/B2/C1/C2/D1/D2 z rundy 1 bez
  zmian + nowe E1/E1b/E2/E3/E4).
- Ten sam test na kodzie SPRZED tej rundy (git stash tylko `main.ts`, bez ruszania worktree poza
  tym): 3/13 FAIL dokładnie na E1/E1b/E2 (dowód realnej luki zamkniętej tą rundą, nietautologiczności
  strażnika) — po `stash pop` z powrotem 13/13 PASS.
- Regresja: `map-improvement-qualify-test.cjs` 1 FAIL, `oboz-lowiecki-las-test.cjs` 19 FAIL,
  `oboz-lowiecki-ev-r2-mainpath.cjs` 1 FAIL — identyczne liczby jak w raporcie rundy 1
  (pre-istniejące, niedotknięte); `oboz-lowiecki-fc-r2-nowa-sciezka.cjs`/`hodowla-las-test.cjs`/
  `stadnina-las-test.cjs` — 0/0/0 FAIL, bez zmian.

BLOKADY: brak.

RUNDY: 1/5 (Obrona nie zwiększa licznika, §3a).

NASTĘPNY KROK: Final Control (Sonnet 5, effort High).

DEPLOY/PUSH: NIE WYKONANO
