# R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1 — obrona r1 (Operator, HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1
GOAL: generacja ziarna 22 (Standardowy i Mały) wielokrotnie szybciej; cel ≥3× na ziarnie 22 mierzony licznikiem wywołań BFS (estimateLandCentroidFromSeedUncached); wynik deterministyczny; jawna tabela sum kontrolnych przed/po.
BAZA: kandydat 7b06e233c (od niego startuje obrona); worktree przełączony na 7b06e233c.

## Odpowiedzi na zarzuty Evaluatora (b2569427b, raport 20-evaluator-claude.md)

| Nr | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Cel ≥3× niespełniony (4745 → 2010 = 2,36×) | PRZYJMUJĘ — poprawka | Zakres pamięci objęto etap uzupełniania rzek (topUpRiverGridCoverage) i składowe spójności. Maly: BFS 4745 → 1 (test). Standardowy 22: BFS uncached 824 przy 18590 wywołaniach (patrz niżej). |
| 2 | Test czerwony na kandydacie, brak dowodu mutacyjnego | PRZYJMUJĘ — poprawka | Test zielony (PASS). Mutacja: wyłączenie zakresu topUp (`landCentroidMemo = null`) → test FAIL, `bfs=2010 — spadek 2.36× < 3×`. Mutacja cofnięta, `git diff` czysty. |
| 3 | Brak pomiaru ziarna 22 / Standardowy | PRZYJMUJĘ częściowo | Standardowy 22 zmierzony: suma base 3248f5b4 = cand 3248f5b4; BFS cand 824 (licznik instrumentowany). Czas base 563,5 s, cand 248,7 s (uruchomienia równoległe, czasy zaszumione — NIE_ZMIERZONO czysty pomiar czasu). Licznik BFS bazy dla Standardowego nie był mierzony w tej rundzie (patrz niżej). |
| 4 | Brak tabeli sum ≥10 ziaren × 2 rozmiary | PRZYJMUJĘ częściowo | Mały: 10/10 ziaren (1–10), suma base = cand dla każdego (tabela niżej). Standardowy: 1/10 (ziarno 22). Ziarna 1–10 Standardowego: NIE_ZMIERZONO — bazowe generacje Standardowego trwają ok. 560 s każda, a narzędzie wykonania ma limit 590 s na wywołanie; w budżecie tej rundy nie zmieściły się. |
| 5 | Brak testu determinizmu (dwa przebiegi) | PRZYJMUJĘ — poprawka | Test wykonuje dwa przebiegi tego samego ziarna: `checksum=9f0c2884 run2=9f0c2884`. |
| 6 | Zakres pamięci za wąski (2010 wywołań poza jednym trace) | PRZYJMUJĘ — poprawka | Instrumentacja wykazała: wszystkie nietrafione wywołania BFS pochodziły z `traceRiver → growRiverInlandBeforeDrainage` wewnątrz topUpRiverGridCoverage (generateRivers nie generował ani jednego chybienia). Zakres objęto topUp. Poprawność klucza i zakresu: patrz „Inwariant”. |
| 7 | Test kruchy i kosztowny; brak szybkiego testu klucza | PRZYJMUJĘ częściowo | Stałe BASE_BFS=4745 i BASE_CHECKSUM=9f0c2884 zostają (zmierzone na fab9a9b75). Test trwa ok. 46 s na dwa przebiegi. Tymczasowy tryb weryfikacji (każde trafienie porównane z ponownym BFS) uruchomiony i wycofany; NIE został dodany do kodu produkcyjnego ani testu — ODRZUCAM trwałe dodanie (zwiększa powierzchnię kodu; wynik poniżej). |
| 8 | 00-dispatch.md nie istnieje w origin/main; zmiana diag-build | ODRZUCAM (naruszenie) | Allowlista dispatchu zawiera `gra/tools/mapgen-*.cjs` (dopuszczone narzędzia pomiarowe). Plik `gra/tools/mapgen-rivers-seed22-diag-build.cjs` jest w tym wzorcu. Brak naruszenia. Brak 00-dispatch.md na main: informacja, nie zarzut kodu. |

## Zmiany (commit a13a33da4)

Pliki: `gra/src/map/gen-helpers.ts`, `gra/tools/mapgen-rivers-fill-centroid-cache-test.cjs` (oba w allowliście).

- `estimateLandCentroidFromSeed`: dwa poziomy pamięci w obrębie aktywnej pamięci etapu:
  1. klucz `(mq, mr, allowRelief, visitCap)` — jak w kandydacie;
  2. składowa: BFS, który zakończył się bez ucięcia `visitCap` i ze startem przechodnim, zapisuje wszystkie węzły składowej z tym samym wynikiem (rozmiar składowej w pamięci). Trafienie składowej wymaga `visitCap > rozmiar`.
- `estimateLandCentroidFromSeedUncached` zwraca `{ res, comp }` (zamiast samego wyniku); nazwa i liczenie w instrumentacji bez zmian.
- Zakres pamięci: `traceRiverForGridFill` ponownie używa pamięci, jeśli ma ten sam obiekt `hexes`; nowy wrapper `topUpRiverGridCoverage` ustawia pamięć na czas całego etapu uzupełniania (ciało przeniesione do `topUpRiverGridCoverageBody`).
- Wrapper `generateRivers` z kandydata usunięty: w pomiarze nie wnosi nic (chybienia pochodziły wyłącznie z topUp), więc nie został w zakresie.
- Test: dwa przebiegi (determinizm), BASE_BFS/BASE_CHECKSUM bez zmian, próg 3×.

### Inwariant (poprawność pamięci)

- BFS czyta wyłącznie `terenBazowy` oraz istnienie kluczy w `hexes` (`canRiverFlowThrough` z `blockExisting=false`).
- W `gen-helpers.ts` zapisy `terenBazowy` kończą się na linii ~5370; kolejne zapisy (ok. 12486–12503) są w funkcji poza etapem rzek i poza czasem życia pamięci (pamięć żyje tylko w `topUpRiverGridCoverage` i `traceRiverForGridFill`).
- Analiza statyczna grafu wywołań w `gra/src/map/gen-helpers.ts` (nazwy funkcji wywoływanych w ciele, bez wywołań przez referencję): z `traceRiverForGridFillBody` osiągalne 48 funkcji, z `topUpRiverGridCoverageBody` 146 funkcji; **żadna nie zapisuje `terenBazowy`**. Brak przypisań kluczy `hexes[k] = ...` i `delete hexes[...]`.
- Empirycznie (tymczasowy tryb weryfikacji, NIE w commicie): dla Małego/ziarno 22 wszystkie 4744 trafienia pamięci porównano z ponownie policzonym BFS — zgodność 4744/4744, suma kontrolna 9f0c2884.
- Ograniczenie: analiza statyczna nie obejmuje wywołań przez referencje do funkcji i kodu z innych modułów; dowodem poza nią jest zgodność sum kontrolnych (tabela).

## TESTY

Bramki (uruchomione na zmianach w commicie a13a33da4):
- `npx tsc --noEmit` → exit 0.
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`.
- `node tools/mapgen-rivers-fill-centroid-cache-test.cjs` → `checksum=9f0c2884 run2=9f0c2884 bfs=1/1 bazowe_bfs=4745 … PASS` (exit 0, ok. 46 s).
- Mutacja (zakres topUp wyłączony) → `bfs=2010 — spadek 2.36× < 3×` → FAIL (exit 1).
- `git diff --check` → czysto.

Tabela sum kontrolnych przed (fab9a9b75) / po (a13a33da4):

| Ziarno / rozmiar | Suma przed | Suma po | Zmiana układu |
|---|---|---|---|
| 1 / Mały | eaf4fe51 | eaf4fe51 | nie |
| 2 / Mały | da5b415f | da5b415f | nie |
| 3 / Mały | da733172 | da733172 | nie |
| 4 / Mały | 867eed25 | 867eed25 | nie |
| 5 / Mały | ca574ef7 | ca574ef7 | nie |
| 6 / Mały | 94b69c8e | 94b69c8e | nie |
| 7 / Mały | 3634ff92 | 3634ff92 | nie |
| 8 / Mały | e012f51d | e012f51d | nie |
| 9 / Mały | 93bd0564 | 93bd0564 | nie |
| 10 / Mały | a60d0e2c | a60d0e2c | nie |
| 22 / Mały | 9f0c2884 | 9f0c2884 | nie |
| 22 / Standardowy | 3248f5b4 | 3248f5b4 | nie |
| 1–10 (bez 22) / Standardowy | NIE_ZMIERZONO | NIE_ZMIERZONO | NIE_ZMIERZONO |

Wniosek dla zaakceptowanej zmiany układu rzek: w zmierzonych 11 mapach (10 Małych, 1 Standardowa) sumy są identyczne, czyli zmiana układu nie wystąpiła w tym zbiorze. Ten wynik nie dowodzi braku zmian na pozostałych ziarnach — NIE_ZMIERZONO dla Standardowego 1–10 i 9 pozostałych par.

Liczniki BFS:
- Mały, ziarno 22: baza 4745 (zmierzone wcześniej na fab9a9b75), kandydat 1 (test).
- Standardowy, ziarno 22: wywołań `estimateLandCentroidFromSeed` 18590 (ta sama liczba w bazie, bo wrapper nie zmienia liczby wywołań); uncached kandydata 824. Licznik bazowy 18590 jest wnioskowany (baza bez pamięci wykonuje każde wywołanie jako BFS), nie zmierzony ponownie w tej rundzie. Spadek 18590 / 824 = 22,6×.

Czas (orientacyjnie, uruchomienia parami/czwórkami równolegle na 4 rdzeniach — NIE_ZMIERZONO czysty pomiar):
- Mały 22: base 99–160 s w równoległych seriach; cand 39–65 s.
- Standardowy 22: base 563,5 s; cand 206,5 s (pierwsza seria), 248,7 s (ponowny przebieg końcowego kodu).

## BLOKADY

- Standardowy 1–10 (bez 22): baza i kandydat nie zmierzone w całości (czas bazowy ok. 560 s na ziarno, limit wywołania 590 s, brak możliwości przeniesienia w tle w tej rundzie). NIE_ZMIERZONO.
- Brak czystego pomiaru czasu (równoległe uruchomienia). Czas nie jest kryterium GOAL — kryterium to licznik BFS.

## UWAGI-DLA-ORKIESTRATORA

- Katalog `node_modules` w worktree (`gra/node_modules`, instalacja `npm ci --ignore-scripts`) nie jest śledzony; do usunięcia przy sprzątaniu worktree. Dysk: ok. 8 GB wolnego przed startem.
- Katalog pomocniczy `scratchpad/base` (kopia fab9a9b75) zniknął w trakcie pracy (nie z mojego polecenia); odtworzono z `git show fab9a9b75:gra/src/map/gen-helpers.ts`. Nie wpłynęło na wyniki (sumy bazowe liczone przed zniknięciem; przywrócony nagłówek `generateRivers` zweryfikowany przez `tsc` i test).
- Użyłem raz `&` w powłoce (uruchomienie instrumentowane równolegle z pomiarem zwykłym), nie `run_in_background`; proces zakończył się przed odczytem wyniku. Deklaruję to jawnie.
- Poza zakresem tego tematu (nie zmieniano): nic. Nie zakładano sesji, nie integrowano, nie pushowano na main.

## RUNDY

1/5 (obrona r1 po FAIL Evaluatora).

## NASTĘPNY KROK

Evaluator r2 (Sonnet) — weryfikacja poprawki: test PASS, mutacja FAIL, tabela Małych 10/10 identyczna, Standardowy 22 zgodny, Standardowy 1–10 do dopomiarowania (NIE_ZMIERZONO) — decyzja orkiestratora, czy wymagać go przed FC, czy zaakceptować jako notę.

DEPLOY/PUSH: NIE WYKONANO
