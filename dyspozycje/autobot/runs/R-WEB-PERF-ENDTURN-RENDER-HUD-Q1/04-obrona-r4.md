# RUNDA 4/5 — OBRONA (Operator R4, odpowiedź na zarzuty FC R3)

STATUS: DECISION_REQUIRED (kod i bramki zielone; kryterium liczbowe −35,7% NIE SPEŁNIONE: R4 −18,9%, R3 −30,0%; wybór opcji A/B/C należy do orkiestratora)
DOMAIN: GAME (WEB), wydajność render/HUD w końcu tury
TEMAT: R-WEB-PERF-ENDTURN-RENDER-HUD-Q1
GOAL: odpowiedzieć na zarzuty FC R3 (pomiar kryterium, luka refreshFog, dowody klatki pośredniej, bramki).
BAZA: operator R3 `fc3c631acee22d75c99fc0b1b07dfe67f2b0ea12`. Kod R4: commit podany w odpowiedzi końcowej (parent = fc3c631). Baza pomiaru baza = `6a673c838` (main).

## Odpowiedzi na zarzuty

**Zarzut 1 (brak A/B baza vs R3 na finalnym kodzie): PRZYJMUJĘ.** Pomiar wykonany: harness `perf-endturn-render-hud-live-test.cjs` (identyczny z `46f3c49ca`), profile CDP, 5 par naprzemiennie, mediana (min/max), ms inkluzywnie:
- R3 (`fc3c631`) vs baza: UNIA EOT1 1790→995 (−44,4%), EOT2 1168→940 (−19,5%), EOT3 2744→2066 (−24,7%), **ŁĄCZNIE EOT1+2+3 5740→4017 (−30,0%)**; SUMA −34,3%.
- R4 (kod poniżej) vs baza: UNIA EOT1 1790→1055 (−41,1%), EOT2 1168→953 (−18,4%), EOT3 2744→2468 (−10,1%), **ŁĄCZNIE 5740→4658 (−18,9%)**; SUMA −23,3%.
- Kryterium ECHO −35,7% NIE SPEŁNIONE ani przez R3 (−30,0%), ani przez R4 (−18,9%). Baza w tym przebiegu 5740 ms (w R1 5133 ms): porównuję tylko w obrębie przebiegu. Pliki: `evidence/r4/ab-base-vs-fc3c631.txt`, `evidence/r4/ab-base-vs-r4.txt`.

**Zarzut 2 (test zachowania to model, brak sceny): PRZYJMUJĘ jako lukę.** Harness nie ma wstrzykiwania bitwy w fazie AI; live scenariusza bitwa→wznowienie nie zbudowano w R4 (NIE ZMIERZONO na żywo). Ścieżka wznowienia pozostaje pokryta testem zachowania na modelu (3 scenariusze × mutacja) i przeglądem kodu (`finally` flushuje po każdym wyjściu). Dodano natomiast test LIVE klatek końca tury (`perf-endturn-render-progress-live-test.cjs`, sekcja `progress`), patrz zarzut 4.

**Zarzut 3 (klatka pośrednia bez dowodu): PRZYJMUJĘ częściowo.** Dowód statyczny: `.civ-turn-transition` ma `pointer-events:none`, tło `transparent` do 55% wysokości, panel tylko na dole (`src/ui/turnTransitionOverlay.ts`). Komentarz w `refreshFog` („ekran przejścia przykrywa mapę”) był NIEPRAWDZIWY i został poprawiony. Zrzutu pikselowego w połowie fazy nie wykonano (NIE ZMIERZONO). Zakres flushu dla zmian z refreshFog nie zależy już od tego założenia (pkt 4).

**Zarzut 4 (luka refreshFog): PRZYJMUJĘ.** Potwierdzone w kodzie: hak `deferRefreshFogUnitSync` odraczał wyłącznie `markDirty()`, bez flagi widoczności, więc zmiany z refreshFog w fazie AI mogły czekać do granicy bitwy/końca fazy także w klatce postępu. Poprawka R4: hak ustawia też `aiUnitVisiblePending = true` (klatka postępu flushuje żetony po każdej zmianie z refreshFog). Koszt zmierzony: −30,0% → −18,9% (pkt 1). Dowód live (`evidence/r4/progress-*.json`): próbki „PRZED vs PO wymuszonej pełnej synchronizacji” w trakcie końca tury: baza 12/204 próbek z niezgodnością, R3 6/178, R4 6/268. Duże klasy niezgodności (689, 92, 533, 28 obiektów) mają te same indeksy grup sceny co w bazie, czyli R4 nie wprowadza nowych dużych klas; małych klas (1–3 obiekty) nie porównywano indeks po indeksie. To NIE jest dowód braku niezgodności: metryka ma szum bazowy, który występuje także w bazie. Pełna klatka po końcu tury (`evidence/r4/pixel-r4.json`): digest 38739 obiektów, 0 niezgodnych dzieci; po EOT vs po wymuszonej synchronizacji 125 px, max Δ1, bbox x1584–1587 y839–880 (znany pasek HUD); dwie wymuszone synchronizacje 83 px w tym samym pasku (szum). Poza paskiem 0 px.

**Zarzut 5 (bramki INFRA): PRZYJMUJĘ, bramki odtworzone.** `npm ci` w worktree (71 pakietów, bez `build`/`dev`). Wyniki, `evidence/r4/gates/`:
tsc EXIT=0; logic 213/213 EXIT=0; resume-flush OK (3 scenariusze × {kod, mutacja}); deferral-regression OK (7 grup, test zaktualizowany do nowej postaci haka); unit-renderer-overlay-sync 17/0; capture-render-sync 23/0; city-badge-zoom-lod 67/0; memory-static-geometry-pool 18/0 (wymaga `--gra <ścieżka>`); memory-static-material-pool-pixel 7/0.

**Zarzut 6 (ai-city-render-batch-test): PRZYJMUJĘ jako dług przedistniejący.** Ten sam komunikat, ta sama linia 70, na bazie `6a673c838` i na R4 (`evidence/r4/gates/ai-city-render-batch-*.txt`). Nie naprawiano w R4 (poza zakresem: test sprawdza tekst przed zmianą). Do rejestru długów testowych.

**Zarzut 7 (allowlista): brak zarzutu.** Diff R4 vs `fc3c631`: `gra/src/main.ts`, `gra/tools/perf-endturn-render-deferral-regression-test.cjs`, nowy `gra/tools/perf-endturn-render-progress-live-test.cjs`, `evidence/r4/**`, ten raport. Harness `perf-endturn-render-hud-live-test.cjs` nietknięty (przywrócony do `46f3c49ca`).

## Zmiany kodu R4
1. `gra/src/main.ts`: `deferRefreshFogUnitSync` = `markDirty()` + `aiUnitVisiblePending = true`; flaga zadeklarowana przed hakiem; komentarze R3/refreshFog poprawione.
2. Test statyczny odroczenia zaktualizowany do nowej postaci haka (sprawdza markDirty i flagę).
3. Nowy test live `perf-endturn-render-progress-live-test.cjs` (sekcja `progress`).

## DECYZJA DLA ORKIESTRATORA (nie rozstrzygam sam)
- Opcja A (rekomendacja Obrony): akceptować R4 — jedyny stan, w którym klatka postępu jest zgodna z zasadą R3 bez znanej luki; koszt −18,9% unii (kryterium −35,7% nie spełnione o 16,8 pp). Wymaga jawnej decyzji o zmianie kryterium w ECHO albo statusu FAIL.
- Opcja B: fc3c631 (−30,0%) z udokumentowanym ryzykiem: zmiany z refreshFog widoczne w klatce postępu nie są flushowane. Live nie wykazano nowej klasy niezgodności, ale nie wykazano też braku.
- Opcja C: węższa reguła (flush tylko, gdy refreshFog zmienia zbiór widocznych hexów albo HP widocznego żetonu) — NIE zaimplementowano ani nie zmierzono.

## BLOKADY
- Live scenariusz bitwa→wznowienie: nie zbudowany (zarzut 2).
- Zrzut w połowie fazy AI: nie wykonany (zarzut 3).
- Kryterium −35,7%: niespełnione (pkt 1).

RUNDY: 4/5
NASTĘPNY KROK: Evaluator R4 (ten sam ID), potem Final Control; orkiestrator rozstrzyga opcję A/B/C.
DEPLOY/PUSH: NIE WYKONANO
