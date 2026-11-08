# R-WEB-PERF-ENDTURN-RENDER-HUD-Q1 — Obrona, runda 2 (odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (obrona przyjęta częściowo; poprawka kodu odłożona, patrz zarzut 6)
DOMAIN: GAME (WEB), wydajność render/HUD w końcu tury
TEMAT: R-WEB-PERF-ENDTURN-RENDER-HUD-Q1
BAZA OBRONY: `46f3c49ca` (commit Operatora R2; kod gry identyczny jak `70d499059`, zmiany R2 to tylko narzędzia i dowody)
GOAL: bez zmian (kryterium -40% unii łącznie NIE jest spełnione, patrz zarzut 1).

## Odpowiedzi na zarzuty

1. **Kryterium GOAL: PRZYJMUJĘ jako fakt, ODRZUCAM zmianę kryterium po fakcie.**
   Unia łącznie 1+2+3: 5133 → 3303 ms (−35,7%, R1) i 5133 → 3340 ms (−34,9%, R2, ten sam kod). Obie wartości są poniżej −40%. Obrona nie przelicza kryterium na SUMA (−41,3%); SUMA liczy podwójnie `renderLoop`-owe wejścia i nie jest miarą z GOAL. Decyzję o ewentualnym zawężeniu kryterium podejmuje orkiestrator w ECHO. Dowód: `evidence/r2/ab-aggregate-base-r1-r2.txt`.

2. **Niezrealizowane zadania R2 (memo `getCityGrowth`/`computeView`, zamrożenie transformacji): PRZYJMUJĘ jako fakt.**
   Operator nie wdrożył tych zmian w tej rundzie. Zamrożenie transformacji (`matrixAutoUpdate=false`) wymaga `updateMatrix()` w każdej ścieżce zmiany transformacji, a memo wymaga przeglądu wejść `computeView`. Obie zmiany wymagają pełnej bramki (tsc, logic, pikselowa) i nowego A/B, a Obrona nie ma w tej sesji działającego harnessu Chromium z dużą grą. Wdrażanie ich teraz bez pomiaru byłoby gorsze niż ich odłożenie. Rekomendacja: osobny temat na `renderLoop` z testem pikselowym.

3. **Pasek HUD x1584–1587 (154 px): PRZYJMUJĘ korektę opisu wyjątku, ODRZUCAM zarzut o naruszeniu 0 px.**
   Wyjątek w dispatchu (x1584–1586) był zapisany za wąsko. Zmierzony bbox zawiera kolumnę x1587 także na bazie: `ed936904c:.../evidence/pixel-parity-base.txt` pokazuje dla bazy `afterEotVsForcedSync` bbox `[1584,838,1587,881]`, diff 137, max delta 1, a `forcedSyncVsForcedSyncAgain` bbox `[1584,842,1586,877]`, diff 83. Szum na pasku HUD występuje więc identycznie na `6a673c838`. Poza paskiem (x1584–1587, y838–881) różnic nie ma (`pixel-parity-final.txt`: 154 px w całym pasku, digest 38739 obiektów, 0 niezgodnych). Wyjątek należy czytać jako pasek HUD x1584–1587 y838–881. Porównanie pikselowe base vs final pełnej klatki pozostaje NIE_ZMIERZONO, bo gra nie jest deterministyczna między przebiegami.

4. **Niespójność: odroczenie żetonów w klatkach fazy AI: PRZYJMUJĘ, to realne ryzyko.**
   Zarzut jest trafny. Kod z R1 w `gra/src/main.ts` (`flushAiCityRenderBatch(false)` w klatce postępu między właścicielami AI, `aiUnitRenderBatch.markDirty()` po wizycie w chatce) powoduje, że żetony jednostek na mapie mogą pozostać nieodświeżone w klatkach pośrednich fazy AI. Argument „nakładka nie zasłania mapy” dotyczy zarówno pomijania klatek, jak i odroczenia żetonów, więc Obrona nie może bronić różnicy między nimi. Test pikselowy sprawdza tylko stan po końcu tury. Brak poprawki w tej rundzie, bo jej weryfikacja wymaga bramek i nowego A/B. Ryzyko zapisane jako wymóg dla Final Control: zmierzyć klatkę pośrednią fazy AI (żetony po wizycie w chatce AI) albo przywrócić natychmiastowe `syncUnitsRender` w klatce postępu.

5. **Brak ponownego pomiaru A/B i bramek na żywo w Evaluatorze: ODRZUCAM jako przesłankę blokującą.**
   Pomiary Operatora są w repo: 5 par naprzemiennych, `evidence/r2/ab-aggregate-base-r1-r2.txt`, profile z CDP, `gate-*.txt` z linią `EXIT=0` (tsc, logic 213/213, capture-render-sync, unit-renderer-overlay-sync, city-badge-zoom-lod, geometry-pool, material-pool-pixel, deferral-regression). Brak node_modules w worktree Obrony oznacza, że Obrona nie odtwarza bramek, a nie że pomiary są fałszywe. Rozrzut min/max jest szeroki, EOT3 zdominowany jest stallem GL SwiftShader obecnym na bazie. To jest ograniczenie mocy statystycznej, które zapisuję jako notatkę, nie jako błąd.

6. **Odroczenie `deferRefreshFogUnitSync` w `main.ts`: CZĘŚCIOWO ODRZUCAM, CZĘŚCIOWO PRZYJMUJĘ.**
   - ODRZUCAM część „hak zostaje ustawiony podczas pauzy bitwy”. Ścieżka bitwy: `aiTurnAwaitingBattle = true` → `flushAiCityRenderBatch()` → `launchIncomingMapFieldBattle` → `break ownerLoop`. Funkcja `runAiPhase` wraca normalnie, a wykonanie przechodzi do bloku po `try/catch eAILoop`: `flushAiCityRenderBatch()` oraz `deferRefreshFogUnitSync = null` (linie ok. 40870–40871 w `46f3c49ca`). Podczas pauzy bitwy hak jest więc zerowany, a `refreshFog` działa natychmiast.
   - ODRZUCAM część „przy wznowieniu hak jest tworzony od nowa”. Wznowienie idzie callbackiem `() => { void runAiPhase(); }` w tym samym domknięciu. `aiUnitRenderBatch` nie jest tworzony ponownie, a hak pozostaje `null`. Wznowiona faza nie ma odroczenia, co jest bezpieczne (tylko wolniejsze).
   - PRZYJMUJĘ ryzyko, którego Evaluator nie wskazał wprost: brudna flaga `aiUnitRenderBatch` ustawiona przez wizytę w chatce **po wznowieniu** nie ma flusha w ścieżce wznowienia. Flush na końcu jest tylko w zewnętrznym bloku, który nie wykonuje się ponownie. Skutek: żetony mogą być nieodświeżone do najbliższej pełnej synchronizacji (prawdopodobnie przy przejęciu sterowania przez gracza, nieweryfikowane). To jest defekt do sprawdzenia, nie tylko ryzyko. Poprawka (jednolinijkowy flush po `runAiPhase()` w callbacku wznowienia) wymaga bramek i testu wznowienia po bitwie, których Obrona nie uruchomi w tej rundzie. Rekomendacja dla Final Control: test scenariusza „wizyta w chatce po wznowieniu fazy AI po bitwie” z pomiarem żetonów po przejęciu sterowania.

7. **Deklaracja sprzątania (buildy, worktree bazy): ODRZUCAM jako niezweryfikowane przez Obronę, nie jako fałsz.**
   Obrona nie ma dostępu do katalogów scratchpad Operatora. W `git worktree list` nie ma worktree z detached `6a673c838` poza worktree Obrony. Dwa worktree `wf_27b620f6-f70-1` i `-2` są na `46f3c49ca` i nie są do zweryfikowania z poziomu Obrony (sprawdzenie wymagałoby wejścia poza worktree Obrony). Status: NIE_ZMIERZONO.

## Co zmienia ta runda

- Brak zmian kodu gry i brak zmian w narzędziach. Obrona ustawia worktree na `46f3c49ca`, dodaje tylko ten plik obrony.
- Korekta opisu wyjątku pikselowego: x1584–1587 y838–881 (pasek HUD), zgodnie z bazą.
- Ryzyka dla Final Control: punkt 4 (klatki pośrednie fazy AI) i punkt 6 (flush po wznowieniu po bitwie).

## Werdykt obrony

- Kryterium −40% unii łącznie nie jest spełnione (−35,7% / −34,9%). Decyzja o kryterium: orkiestrator (ECHO).
- Dwa defekty/ryzyka wymagają testu przed READY_FOR_DEPLOY: punkt 4 i punkt 6 (flush po wznowieniu).
- Nie wykonano: push, deploy, integracja.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (runda 3, to samo ID), potem Final Control z testami z punktów 4 i 6.
DEPLOY/PUSH: NIE WYKONANO
