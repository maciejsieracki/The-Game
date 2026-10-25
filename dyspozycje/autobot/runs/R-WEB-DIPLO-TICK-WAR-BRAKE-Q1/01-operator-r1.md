STATUS: INCOMPLETE (częściowa implementacja: fundament P6/P7 bez integracji z silnikiem)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TICK-WAR-BRAKE-Q1
GOAL: Cztery zmiany dyplomacji (P3 przeliczanie par AI↔AI, P4 aktywacja dobrej woli i wspólnego wroga, P6 hamulec wojny z histerezą, P7 bonus za wymianę „na plusie" wg wersji ostatecznej od właściciela).

BAZA: b4828f4c (detached). Dispatch pobrany z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0.

ZMIANY/COMMIT:
- NOWE gra/data/diplomacy-tick-params.json — parametry p6 (kryzysProgZaufania 0, kryzysTurDoWojny 5, kryzysOstrzezenieTurPrzed 2) i p7 (kroki kamien 100 / braz 200 / zelazo 400, domyslny 400, 0,5 za krok, max 5/turę, sufit 60, min 2 tury dostaw); flagaDomyslna false.
- NOWE gra/src/game/diplomacy-tick-war-brake.ts — czyste funkcje: tradeTrustBonusPerTura (P7), advanceCrisisCounter (P6 histereza), parseCrisisCounters (save/load, stare zapisy → 0), sortCrisisQueue, pickWarDeclarer. Brak importów z silnika.
- NOWE gra/tools/diplo-tick-war-brake-unit-test.cjs.
- Commit: patrz sekcja NASTĘPNY KROK / stan indeksu w odpowiedzi.
- NIE zmieniano: main.ts, diplomacy.ts, ai.ts, UI, diplomacy.json, testów istniejących, gra-robocza, WERSJE.md.

ZAŁOŻENIA (luki w dispatchu):
- Z1: remis mocy przy wypowiadaniu wojny → niższe ownerId (pickWarDeclarer).
- Z2: remis w kolejce wojen z progu → najdłużej na progu, potem niższe min(ownerId) pary.
- Z3: epoki spoza kamien/braz/zelazo używają kroku 400 (wymianaKrokPktDomyslny); podwajanie ×2 na epokę NIE zaimplementowane (brak definicji listy epok w dispatchu).
- Z4: ostrzeżenie P6 pada, gdy licznik osiąga N − 2 (= 3 przy N=5), wojna przy licznik ≥ N.
- Z5: bonus P7 nie podnosi Zaufania powyżej sufitu (przycięcie do headroom).

TESTY:
- node tools/diplo-tick-war-brake-unit-test.cjs → 39 pass / 0 fail (tabela kroków 99/100/199/200/1000/5000 dla kamienia, braz, zelazo; limit 5; sufit 60; 1 tura = 0; histereza P6; reset po przerwie; zapis/odczyt; kolejka).
- npx tsc --noEmit → bez błędów.
- NIE_ZMIERZONO: flaga OFF = hash jak baza; determinizm 2 przebiegów; czas tury ×1,10; smoke Chromium 46 tur; symulacja ≥5 seedów × 80 tur; istniejące suite'y diplomacy*-test.cjs, forced-war-*, load-game-regression, logic-test, ai-test, endturn-battle-deadlock, ai-move-range-test, build Vite (nie uruchamiano w tej rundzie).
- Mutacje (usunięcie P3/P4/histerezy P6 czerwieni test): NIE wykonano, bo P3/P4/P6 nie są podpięte do silnika.

BLOKADY:
- P3 (przeliczanie AI↔AI w tickDiplomacy, main.ts ~34727) — NIE zaimplementowane. Wymaga ustalenia źródła aktywnych umów AI↔AI.
- P4 (dobraWolaAktywna / wspolnyWrog, main.ts ~19350 i ~34712, buildDiplomacyTickCtxForPair) — NIE zaimplementowane.
- P6 w silniku (liczniki per para, zapis w save, ostrzeżenie UI, wypowiedzenie przez stronę silniejszą z R1/R2/R3) — NIE zaimplementowane.
- P7 w silniku (podpięcie pod dostawy realne, dobra wola, reset przy umowie) — NIE zaimplementowane; funkcja gotowa.
- Flaga DIPLO_TICK_WAR_BRAKE_ENABLED — NIE dodana.
- Symulacja ≥40 tur i Chromium smoke — NIE wykonane.

RUNDY: 1/5

NASTĘPNY KROK: kolejna runda Operatora: (1) podpiąć tradeTrustBonusPerTura i advanceCrisisCounter w tickDiplomacy za flagą DIPLO_TICK_WAR_BRAKE_ENABLED; (2) P3/P4 w buildDiplomacyTickCtxForPair i tickCtx; (3) zapis licznika w save/load; (4) testy hash OFF/ON, mutacje, smoke Chromium. Pytanie do orkiestratora przed P3: źródło aktywnych umów AI↔AI (activeDeals czy osobna struktura).

DEPLOY/PUSH: NIE WYKONANO
