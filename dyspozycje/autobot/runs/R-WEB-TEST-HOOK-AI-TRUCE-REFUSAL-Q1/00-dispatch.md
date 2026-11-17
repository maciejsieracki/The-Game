# R-WEB-TEST-HOOK-AI-TRUCE-REFUSAL-Q1 (HOOKAI)

DOMAIN: GAME/PROCESS (hak testowy; bez zmiany reguł gry) · Operator HAIKU · Evaluator SONNET · Obrona HAIKU · FC SONNET · max 5 rund. Priorytet niski (zadanie #438).

## Tło
`gra/tools/diplo-truce-live-test.cjs` (linie ~253–271) ma niezmierzoną gałąź **L2b-odmowa**: „AI odmawia wobec propozycji GRACZA (inicjator gracz): NIE_ZMIERZONO — brak haka odpowiedzi AI w main.ts (poza allowlistą)”. Dziś nie da się z testu wymusić odmowy AI na propozycję rozejmu gracza.

## GOAL
Dodać hak testowy, widoczny WYŁĄCZNIE gdy `isCivTestEnabled(window.location.search)` (wzorzec: `window.__civSetHitMode` w `main.ts` ~28716; w produkcji hak = `undefined`), który pozwala testowi wymusić decyzję AI (przyjmij/odmów) na propozycję rozejmu gracza — bez zmiany domyślnej decyzji AI, gdy hak nieustawiony. Następnie dopisać do `diplo-truce-live-test.cjs` asercję L2b-odmowa (odmowa AI → wojna trwa/brak rozejmu, bez kary Wiarygodności za samą odmowę — wg aktualnego zachowania kodu, ODCZYTAJ je, nie zakładaj).

## Zakres
- `gra/src/main.ts` (tylko rejestracja haka pod `isCivTestEnabled`) i ewentualnie jedna funkcja decyzyjna AI w `gra/src/game/` (parametr nadpisania tylko gdy hak ustawiony). Zero zmian domyślnych ścieżek; `git diff` w src ma być minimalny.
- `gra/tools/diplo-truce-live-test.cjs`: nowa asercja + usunięcie linii „NIE_ZMIERZONO” dla L2b-odmowa.

## Kryteria binarne
- Test: asercja L2b-odmowa zielona; mutacja (hak ignorowany) → czerwona (kopia pliku, NIE `git checkout`).
- Dowód, że bez haka zachowanie AI jest identyczne (istniejące testy rozejmu: diplo-truce-impl, diplo-truce-r4-ai, diplo-truce-until-turn, diplo-truce-live bez nowych czerwieni względem bazy — podaj tabelę baza vs kandydat).
- Dowód, że w produkcji hak nie istnieje (sprawdzenie warunku `isCivTestEnabled`; test bez parametru `?civtest`).
- tsc bez nowych błędów, 5 bramek referencyjnych.

## Zakazy
`npm run build/dev` w `gra/`, `git add -A`, `rm/rmdir/unlink` w komendach, logi do /tmp, nie commituj cudzych PNG nadpisanych testami. Żadnych zmian w `gra/data`, `gra-robocza`, `WERSJE.md`, balansie.
