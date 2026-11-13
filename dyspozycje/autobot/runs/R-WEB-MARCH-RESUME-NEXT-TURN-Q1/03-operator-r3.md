STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MARCH-RESUME-NEXT-TURN-Q1
GOAL: Zaplanowana trasa jednostki gracza kontynuowana automatycznie w kolejnych turach; zasadne przerwanie = zatrzymanie + jedno powiadomienie + wskaznik "trasa wstrzymana"; po zdjeciu przeszkody wznowienie bez klikania.
ZMIANY/COMMIT: BAZA = kod r2 455db00fe (web-wip/MARCHRES-r2) zmergowany z origin/main 5c96ff0eb. Allowlista: gra/src/game/planned-march.ts (marchPausedLabel, registerMarchStop, clearMarchStop), gra/src/main.ts (marchStopDetail, noteMarchStop przez registerMarchStop, reset postepem w finishMarchSegmentHints, wskaznik w stackStatusBase), gra/src/ui/unitCardStatus.ts + gra/src/ui/armyStackHud.ts (marchPausedReason -> wiersz "Status: trasa wstrzymana - powod" w panelu jednostki), gra/tools/march-resume-next-turn-test.cjs (przepisany), gra/tools/march-attack-queue-persist-test.cjs (+stan harnessu marchStopDetail). Commit: patrz SHA w wyniku orkiestratora (git log -1 galezi worktree).
NAPRAWA FC r2 (4x NAPRAW):
1. Wskaznik: panel armii/jednostki pokazuje "Status: ⏸ trasa wstrzymana — <powod>" gdy plan istnieje i zatrzymal go obstacle/no_path/blocked_city (marchStopDetail, czyszczone przy ruchu/dojsciu/clearPlannedMarch/resetach).
2. T3: mur obcych na calej szerokosci mapy -> asercje: stopReason === 'no_path', brak dojscia, jednostka stoi przed murem (usunieto "dojscie LUB zatrzymanie").
3. Dedup: logika wydzielona do czystych registerMarchStop/clearMarchStop (uzywa jej noteMarchStop). T5/T6: 3 tury blokady = 1 powiadomienie; zmiana powodu = nowe; no_movement/fog nie powiadamiaja; po clear nowy epizod powiadamia. T7: plannedMarchesToSave -> JSON -> plannedMarchesFromSave zachowuje trase i dochodzi do celu.
4. Wznowienie: T5 asertuje, ze przeszkoda faktycznie zatrzymala marsz w turach 2-4 (3x no_path, jednostka stoi), po zdjeciu dochodzi sama, a stan powiadomien jest wyczyszczony. Gate G9: finishMarchSegmentHints wola clearMarchStop (postep = koniec epizodu).
Zalozenie opcji B z r2 zachowane (powiadomienie w Wazne dla obstacle/no_path/blocked_city; no_movement i fog bez powiadomienia) - do potwierdzenia przez wlasciciela.
TESTY:
- tsc --noEmit (gra/): exit 0.
- march-resume-next-turn-test: 44 pass / 0 fail.
- march-end-of-turn-only-test 0; planned-march-test 18/0; rally-point-automarch-test 30/0; march-attack-queue-persist-test 57/0 (po dodaniu marchStopDetail do harnessu); logic-test OK 213/213; army-stack-limit/ruch, unit-card-3d-preview-coverage exit 0.
- ai-march-avoid-foreign-territory-test: 98 pass / 1 fail (C7, znany czerwony na bazie, nie ruszano).
- army-stack-commander-identity-test: wymaga Chromium (brak /usr/bin/chromium) - NIE_ZMIERZONO.
- Chromium / zywa gra: NIE_ZMIERZONO (brak przegladarki). Wskaznik UI zweryfikowany testem HTML (buildUnitExtraStatusLinesHtml) i gate'ami zrodla, nie wizualnie.
BLOKADY: brak blokad technicznych. Notatki: (a) stack-limit deletion (applyMarchSegmentInstant) nadal kasuje plan tylko z toastem - bez zmian, decyzja wlasciciela; (b) po wczytaniu zapisu stan dedupu jest pusty, wiec pierwsze ponowne przerwanie po loadzie powiadomi raz jeszcze (plan trasy sam jest zapisywany - T7); (c) brak "wznow jednym klikiem" jako osobnego przycisku - plan zostaje i wznawia sie automatycznie na koncu tury po zdjeciu przeszkody.
RUNDY: 3/5
NASTEPNY KROK: Evaluator r3 -> Final Control; weryfikacja wizualna wskaznika w Chromium przy dostepnej przegladarce.
DEPLOY/PUSH: NIE WYKONANO
