# R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1
GOAL: przyspieszyć generację ziarna 22 (cel ≥3× spadku licznika BFS `estimateLandCentroidFromSeed`) bez zmiany wyniku, z testem regresji i uczciwym raportem zmian map.
BAZA: fab9a9b75 (origin/main), worktree odłączony (detached).

## ZMIANY / COMMIT
- `gra/src/map/gen-helpers.ts`: pamięć podręczna środka lądu, zakres = jedno wywołanie `traceRiverForGridFill` (wrapper + `traceRiverForGridFillBody`); `estimateLandCentroidFromSeed` (publiczna sygnatura bez zmian) → `estimateLandCentroidFromSeedUncached` (dawna treść BFS).
- `gra/tools/mapgen-rivers-seed22-diag-build.cjs`: dodana nazwa `estimateLandCentroidFromSeedUncached` do listy liczników instrumentacji (narzędzie diagnostyczne, bez zmiany wyniku).
- `gra/tools/mapgen-rivers-fill-centroid-cache-test.cjs` (nowy): test regresji (suma kontrolna + licznik BFS ≥3×).
- `dyspozycje/autobot/runs/R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1/10-operator-claude.md` (ten raport).

Inwariant pamięci: wpis żyje tylko w obrębie jednego `traceRiverForGridFill`. W tym zakresie ścieżki trace/grow/aStar/greedy/extend/finish wyłącznie czytają `hexes` (zweryfikowane grepem: brak zapisów `terenBazowy` w ciele traceRiver i jego wołanych funkcji). Klucz: start, allowReliefTraversal, visitCap oraz tożsamość obiektu `hexes`. Poza zakresem (wołania ~7937, ~8042 i wołania z innych ścieżek) pamięci nie ma — zachowanie jak dotąd.

Commit: patrz sekcja DEPLOY/PUSH (SHA podany w polu `sha` zwrotki).

## TESTY (surowe liczby z wyjścia)
- `tsc --noEmit` (gra/): exit 0.
- Bramki referencyjne: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `ALL GREEN`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `All sanity checks passed.` — wszystkie exit 0.
- `git diff --check`: czysto.
- Nowy test `mapgen-rivers-fill-centroid-cache-test.cjs`: **FAIL** — `checksum=9f0c2884 bfs=2010 bazowe_bfs=4745 spadek=2.36x`, `BFS 2010 — spadek 2.36× < 3×`. Test jest czerwony także na bazie (bazowy BFS 4745), więc nie ma dowodu mutacyjnego zielony/czerwony w tej postaci.

## POMIAR ZIARNA 22 / MAŁY (Node, instrumentacja diag-build --instr)

| wersja | suma kontrolna | czas | growRiver | BFS (uncached) | aStarRiverToTarget |
|---|---|---|---|---|---|
| baza fab9a9b75 | 9f0c2884 | 89,3 s | 4745 | 4745 | 7317 |
| poprawka (zakres traceRiverForGridFill) | 9f0c2884 | 52–55 s | 4745 | 2010 | 7317 |

Wynik generacji identyczny (ta sama suma kontrolna) — zgodnie z oczekiwaniem: pamięć jest czysta funkcyjnie. Spadek BFS 2,36× (cel ≥3×) — **cel NIE osiągnięty**.

## NIE_ZMIERZONO
- Suma kontrolna ≥10 ziaren × 2 rozmiary (przed/po) — NIE_ZMIERZONO (czas na hoście: ~1 min na Mały, Standardowy zwykle kilkaset sekund; nie zmieściłem w jednej rundzie).
- Dwa przebiegi tego samego ziarna (determinizm między przebiegami) — NIE_ZMIERZONO osobno (checksum jednego przebiegu jest zgodny z bazą, co pośrednio to potwierdza dla ziarna 22/Mały).
- Dowód mutacyjny — NIE_ZMIERZONO (test nie jest jeszcze zielony na żadnym wariancie).
- Ziarno 22 / Standardowy — NIE_ZMIERZONO.

## BLOKADY
1. Cel ≥3× nieosiągnięty zakresem bezpiecznym (2,36×). Pełne memo na czas całej etapu „Rzeki — uzupełnianie” (między wieloma wywołaniami `traceRiver`, które w tym etapie zapisują `hex.rzeka` i być może `terenBazowy` w innych fazach) wymaga ustalenia listy mutacji `terenBazowy` w całym przebiegu generatora (grep wykazał zapisy w wielu fazach generatora, m.in. ~2912–3136, ~4061–5370, ~12406–12423 w `gen-helpers.ts`). To decyzja inwariantu dla orkiestratora/Evaluatora, nie zgadywanie.
2. Dodatkowe źródło BFS: wołania spoza `traceRiverForGridFill` (~7937, ~8042, ~6174) nadal nieobjęte pamięcią.

## UWAGI-DLA-ORKIESTRATORA
- Pamięć per-trace jest tania i bezpieczna; wynik nie zmienia się (suma kontrolna identyczna). Rozszerzenie zakresu wymaga osobnego tematu z listą faz mutujących `terenBazowy` i testem inwariantu.
- Plik `dyspozycje/.../00-dispatch.md` istnieje tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie na `origin/main` (zgłoszenie do wiedzy orkiestratora).
- Worktree zawiera `gra/node_modules` (instalacja `npm ci --ignore-scripts`), nieśledzone; do sprzątania po integracji.

## NASTĘPNY KROK
Evaluator/FC: ocena inwariantu zakresu i decyzja, czy rozszerzać pamięć (runda 2) czy zaakceptować 2,36× i zmienić próg testu (wymaga decyzji właściciela — ABC).

RUNDY: 1/5 (ostatni werdykt: brak — pierwsza runda Operatora)
DEPLOY/PUSH: NIE WYKONANO
