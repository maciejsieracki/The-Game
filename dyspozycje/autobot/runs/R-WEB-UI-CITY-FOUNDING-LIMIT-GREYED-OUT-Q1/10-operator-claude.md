STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, drobna poprawka)
TEMAT: R-WEB-UI-CITY-FOUNDING-LIMIT-GREYED-OUT-Q1
GOAL: Gdy gracz osiągnął limit miast swojej epoki, przycisk „Załóż miasto” w panelu budowy jest wyszarzony i nieklikalny, z komunikatem „Osiągnięto limit miast (X/Y w tej epoce)” i małym napisem przy nagłówku „Miasto”. Stan „brak zasobów” bez zmian, gdy limit nie jest osiągnięty; limit ma pierwszeństwo, gdy oba warunki zachodzą naraz.
ZMIANY/COMMIT: baza ac35200a1 (origin/main). Allowlista: gra/src/game/cities.ts (nowa czysta funkcja `cityFoundingLimitState` = jedno źródło prawdy; `canFoundCity` używa jej bez zmiany logiki), gra/src/main.ts (wiring: `getFoundCityLimitState`, limit przed brakiem zasobów w `getFoundCityLockHint`, pierwsze miasto pomijane), gra/src/ui/buildModeHud.ts (klasa `limit`, aria-disabled, meta „limit X/Y”, napis przy „Miasto”, CSS), nowe testy gra/tools/city-founding-limit-greyed-test.cjs i gra/tools/city-founding-limit-greyed-live-test.cjs, ten raport. COMMIT: SHA w polu sha orkiestratora.
ZBADANE PUNKTY (GOAL 6): wejścia zakładania miasta: przycisk panelu (onSelectFoundCity) — jedyna ścieżka dla 2.+ miasta, objęta; main.ts ~17356, ~28179, ~35234 (tryb zakładania przy pierwszym mieście) — NIE DOTYCZY (limit nie działa przed pierwszym miastem); klik hexa `canFoundPlayerCityAt` i `canFoundCity` — nadal odrzucają z powodem limitu (zabezpieczenie w głębi, bez zmiany).
TESTY:
- tsc --noEmit: exit 0
- city-founding-limit-greyed-test.cjs (nowy, statyczny + parytet): 14 OK / 0 FAIL. Parytet z oracle n>=limit dla base 10/15/20 x era 0..5 x n in {limit-1,limit,limit+1}, miasta zdobyte nie liczą się, obcy właściciel nie liczy się.
- Mutacja 1 (w kopii src: wyczerpanie `count >= limit + 1000` w cities.ts): 13 OK / 1 FAIL (test czerwony); przywrócona wersja: 14/0 zielone.
- Mutacja 2 (w kopii src: usunięta klasa `limit` w buildModeHud): 13/1 FAIL. Uwaga: mutacja usunięcia gałęzi `if (lim.exhausted)` w main.ts NIE jest wykrywana testem statycznym (sekcja E sprawdza tylko obecność kodu) — NIE ZMIERZONO w tej formie.
- city-founding-limit-greyed-live-test.cjs (nowy, Chromium headless, realny DOM, realne kliki, panel zamontowany przez createBuildModeHud z konfiguracją kontraktu main.ts): 22 PASS / 0 FAIL, bez błędów JS.
- Regresja: logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; build-mode-hud-affordability-test 7/0; build-mode-lock-tip-position-real-render-test 21/0.
- vite build (poza repo, --outDir /tmp/cw1/dist-cityLimit): exit 0.
BLOKADY / NIE ZMIERZONO:
- Pełna gra (?civTest=1, prawdziwa sesja z miastami, otwarcie panelu z gry, zmiana limitu w trakcie tury przez awans epoki/utratę miasta): NIE ZMIERZONO — odświeżenie następuje przy wywołaniu render() (otwarcie/zmiana trybu); nie zweryfikowano w pełnej grze.
- Zrzut panelu: próba zrzutu wyszła z obciętym kadrem (panel poza clip) — NIE uznaję za dowód wizualny; dowodem są asercje DOM/computed style.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja diffu (tylko 3 pliki src + 2 testy), ewentualnie ręczny przegląd przy limicie w pełnej grze (civTest).
UWAGI-DLA-ORKIESTRATORA: brak znalezisk poza zakresem.
DEPLOY/PUSH: NIE WYKONANO
