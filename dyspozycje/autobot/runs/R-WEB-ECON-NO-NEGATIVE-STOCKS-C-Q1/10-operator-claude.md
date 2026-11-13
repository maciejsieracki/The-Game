# R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (podtemat C: AI równoważy się przed końcem tury + runner headless 15×3×150)
GOAL: wpiąć `planAiBalance` (gra/src/game/no-negative-stocks.ts) w turę AI tak, by skarbiec i spichlerz AI nie schodziły poniżej zera od tury 11; runner headless 15 cywilizacji × 3 ziarna × 150 tur; test ai-test; mutacja.
BAZA: origin/main 507d312ce (worktree wf_4f47ec8d-a69-1, detach). Kandydat r1 c43597936 jest przodkiem 507d312ce — jego moduł już jest w main (wersja po podtemacie A, 283 linie zamiast 178), więc nie był przenoszony.

## ZMIANY-COMMIT
Brak zmian w kodzie gry (gra/src, gra/tools). Commit zawiera wyłącznie ten raport.
Powód: patrz BLOKADY. Nie wpinałem równoważenia bez pomiaru — wpięcie bez runnera i bez testu mutacji nie spełnia kryteriów (a)–(e) i byłoby niezweryfikowane.

## TESTY (surowe wyjście, HEAD 507d312ce, przed jakąkolwiek zmianą)
- `npx tsc --noEmit` (gra/): rc=0, bez komunikatów.
- `node tools/no-negative-stocks-test.cjs`: `no-negative-stocks-test: 25 passed, 0 failed`
- `node tools/no-negative-stocks-projection-test.cjs`: `no-negative-stocks-projection-test: 49 passed, 0 failed`
- `npm ci --ignore-scripts` w gra/: rc=0. NIE uruchamiano `npm run build/dev` (zakaz).
- Kryteria (a) symulacja 15×3×150, (b) brak eliminacji, (c) test kar deficytu, (d) mutacja: NIE_ZMIERZONO (nie zaimplementowano runnera ani testu AI).

## BLOKADY (dlaczego BLOCK, z lokalizacjami w gra/src/main.ts i gra/src/game/ai.ts)
1. Brak wpięcia AI. `planAiBalance` nie jest wołany nigdzie poza testami (grep po src/tools: tylko no-negative-stocks*-test.cjs).
2. Kolejność tury: `econ = advanceCityEconomy(...)` ok. linii 39194; `advanceEmpireFood(...)` ok. 39408; blok „Bank treasury” z bankowaniem AI (`aiSkarb`, `aiSkarbiecByOwner.set`) ok. 39795–39830. Równoważenie AI musi zajść PRZED tym blokiem, a prognoza (`projectNnsAfterTick`) wymaga `econ` tej samej tury. Zmiana wydatków (wstrzymanie zakupu, rozwiązanie jednostki) zmienia utrzymanie, więc wymaga ponownego policzenia `econ` albo jawnej korekty prognozy. Nie zaprojektowane w tej rundzie.
3. Rozwiązanie jednostki: `disbandPlayerUnit` (main.ts ok. 7376) sprawdza `u.ownerId !== 0` i zwraca false. AI potrzebuje wariantu per owner (zwrot manpower i surowców dla właściwego ownera) — nie istnieje.
4. Podatki AI: `decideAIEconomySliders` (ai.ts ok. 7779) działa z cooldownem `minOdstepTur` i nie ma trybu „przed końcem tury”. Wymuszenie podatku poza cooldownem wymaga osobnego wejścia.
5. Wstrzymanie zakupów: `shouldAIPurchaseUnit` (ai.ts, import w main.ts ok. 1318) — brak flagi „wstrzymaj” dla tury.
6. Runner headless: istniejące narzędzia (np. `tools/measure-ai-trade-offer-frequency.cjs`) działają na żywym bundle w Chromium z hakami `window.__…` (bramka `?civTest=1`), wznawiane przez MEAS_PROFILE/MEAS_RESULT. Runner 15×3×150 wymaga nowego haka (15 cywilizacji AI, ziarno, quickSave/loadSlot) — nie istnieje. Szacunek: wielogodzinny pomiar w kawałkach 480 s, ok. 45 przebiegów.
7. Test mutacji (wyłączenie równoważenia czerwieni test) wymaga flagi wyłączającej, której nie ma.

## PROPOZYCJA DALSZEGO KROKU (do decyzji orkiestratora)
- Runda 2 rozdzielona na dwa etapy: (C1) pure-helper w no-negative-stocks.ts: `buildAiLevers(stan ownera)` + test jednostkowy, w tym mutacja; (C2) wpięcie w main.ts przed blokiem „Bank treasury” z przeliczeniem `econ` i owner-aware disband (osobna funkcja, nie zmiana `disbandPlayerUnit`), potem runner headless.
- Koszt wołania `projectEmpireFoodAfterTick` (O(owners²) na turę wg dispatchu) — zmierzyć przed wpięciem; jedno wywołanie na turę dla wszystkich AI albo cache.
- Model: temat dotyka main.ts, ai.ts i runnera, więc orkiestrator ma rozważyć SONNET na Operatorze z uzasadnieniem (wiele ścieżek, ponowne liczenie econ). Ta runda nie ma podstawy do eskalacji wg zasady „po 2 nieudanych rundach” (to runda 1).

## UWAGI-DLA-ORKIESTRATORA
- Dispatch referuje `00-dispatch.md` na origin/main; plik istnieje tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Odczytano z tej gałęzi.
- Kandydat r1 c43597936 nie wnosi nic nowego względem main (jest jego przodkiem; main ma wersję po A).
- Nie wypchnięto niczego. Brak integracji, brak deployu.

NASTĘPNY KROK: orkiestrator decyduje o rundzie 2 (podział C1/C2) i o modelu Operatora.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5 (ostatni werdykt: brak; decyzja orkiestratora wymagana)
