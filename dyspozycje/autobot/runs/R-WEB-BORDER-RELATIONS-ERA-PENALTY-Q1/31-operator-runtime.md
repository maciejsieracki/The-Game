# R-WEB-BORDER-RELATIONS-ERA-PENALTY-Q1 — runtime proof

STATUS: PASS — production pair/preview/tick and IndexedDB save/load gate
KANDYDAT: `codex/border-era-penalty`
CZAS: 2026-11-10, Chromium run 20:12:32–20:14:45 UTC (approx.)

## Środowisko i fixture

- Uruchomiłem Vite z worktree kandydata pod `http://127.0.0.1:18904/?playtest=mapa` i gate `GAME_URL=... node tools/diplomacy-border-era-penalty-live-test.cjs` w osobnym, headless Chromium. ROOTAUDIO613 pozostawał uruchomiony; po pomiarze zasobów root zezwolił na równoległy bounded run. Użyłem własnego portu i profilu przeglądarki.
- Playtest miał mniej niż dwóch zarejestrowanych ownerów AI. Gate uruchomił rzeczywistą nową grę, poczekał na `playerStartHex`, wywołał `foundPlayerStartCity()` i poczekał na miasto gracza. Fixture wybrał zarejestrowanych ownerów AI 1 i 3 (Inkowie i Grecy); kopie rzeczywistych rekordów miast dały 4 i 4 miasta oraz wspólną granicę. Początkowa para nie miała granicy.
- Owner A miał epokę startową Brązu (2); owner B startował w Brązie i otrzymał technologie zapisane przez prawdziwe `aiResearchDone` oraz stan cudów wymagany dla awansu. Produkcyjny `syncOwnerEraFromResearch` przed zapisem obliczył epoki 2 i 3. Resolver stawki, warunek granicy ani kontekst UI nie są kopiowane w hooku.

## Wyniki ścieżki produkcyjnej

- Dla epok 2/3 `buildDiplomacyTickCtxForPair`, podgląd i rozbicie czynników zwróciły wiersz granicy `−4`. Całkowity podgląd wyniósł `−3.51`; prawdziwy `tickDiplomacy` zmienił zaufanie z `19` na `15.49` (delta `−3.51`), czyli uwzględnił pozostałe aktywne czynniki dokładnie tak jak podgląd.
- `persistSaveToSlot` zapisał slot do IndexedDB. Odczyt tego slotu przez prawdziwe `loadFromLocal` potwierdził roster `[[1,"inkowie"],[3,"grecy"]]`, epoki `[[1,2],[3,3]]`, epoki startowe `[[1,2],[3,2]]` i 12 zapisanych technologii ownera 3. Po `loadGameFromSlot` produkcyjna synchronizacja badań odtworzyła epoki 2/3; wiersz UI nadal wynosił `−4`, a tick i preview nadal wynosiły `−3.51`.
- Po zmianie ownera B na Brąz produkcyjny kontekst zwrócił `−3` dla kolejności `(1,3)` i `(3,1)`; oba rozbicia UI pokazały `−3`. Następnie fixture przeniósł wszystkie miasta ownera B na istniejące lądowe heksy poza sąsiedztwem miast A. Obaj ownerzy nadal mieli ponad dwa miasta, `sharedLandBorder` stał się `false`, a breakdown nie zawierał czynnika (`null`). Całkowity preview w tym stanie wyniósł `+0.11` z pozostałych czynników.
- Gate zakończył się: `RESULT PASS: production pair context, preview, breakdown, tick and IndexedDB save/load`. Asercja page errors przeszła; Chromium wypisał ostrzeżenia WebGL i pojedyncze 404 zasobu, bez błędów strony.

## Bramka i ograniczenia

- `node tools/diplomacy-border-era-penalty-test.cjs` — PASS, 39/39.
- `npm run typecheck` — PASS (`tsc --noEmit`). `git diff --check` — PASS.
- Runtime gate przechodzi przez istniejące funkcje zamknięte w `main.ts` i realny slot IndexedDB; nazwany hook wyłącznie tworzy/odczytuje fixture i wywołuje te funkcje. Test nie dowodzi wizualnego wyglądu ekranu ani zachowania podczas pełnej wieloturowej rozgrywki. Nie zmienia produkcyjnej logiki restore ani schematu zapisu.
- Przy przeglądarce działał równoległy ROOTAUDIO613 po jawnej korekcie polityki wyłączności na podstawie pomiaru zasobów; Vite i Chromium tego gate'a używały portu i profilu odseparowanego od procesu root. Nie przerywałem ani nie zmieniałem procesu root.

DEPLOY/PUSH/MERGE: NIE WYKONANO
