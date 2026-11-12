# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — Final Control (runda 3)

STATUS: FAIL
DOMAIN: GAME (pomiar; hooki za ?civTest=1; zero zmian reguł)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1
GOAL: zmierzyć częstość ofert handlowych AI→gracz w pełnej rozgrywce: ≥3 ziarna × ≥150 tur × ≥3 poziomy relacji (jeśli da się ustawić); oferty/100 tur, aktywne Przyjmij, pary surowców.
KANDYDAT: 3f729c9c4d861ab1bb65b8e68d06fbaf4a0aba99 (potomek 486c4ef2d; merge-base z origin/main = b4853c8e6; origin/main poszedł dalej do aeb52465e). integration_sha: brak (nie integrować).

## ZMIANY/COMMIT (diff b4853c8e6..3f729c9c4, poza dyspozycje/)
gra/src/game/civ-test-hooks.ts (+19), gra/src/main.ts (+49/-6: hooki w obiekcie testowym za ?civTest=1, civTestSeedOverride, civTestRuntime.skipRender domyślnie false), gra/tools/measure-ai-trade-offer-frequency.cjs, gra/tools/measure-ai-trade-offer-frequency-matrix.cjs. Mieści się w allowliście DODATKU r2/r3. Zero zmian reguł handlu.

## TESTY (własne, surowe wyjście)
tsc --noEmit: EXIT 0. logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0. Wszystkie zielone na kandydacie (brak czerwonych, więc porównanie z bazą zbędne). Mutantów i bramki bez flagi nie powtarzano (przebiegi 6-7 min każdy); poleganie na evidence/obrona-r4.

## WERDYKT PER ZARZUT
1. NAPRAW. Dane własne potwierdzone: relBeforeEnd = pin, ale relTotalAi po endTurn: pin20 -> 29,19,21,23,25; pin80 i pin140 -> 29 stale. Kod: main.ts relTicked zapisane (setDiploRelation) przed pickAiPlayerCyclicBarter. AI decyduje przy wartości po ticku; trzy poziomy relacji nie są rozdzielone. Kryterium GOAL (3 poziomy relacji) niespełnione, a da się je spełnić (hak testowy może przypiąć relację tuż przed decyzją albo odczytać relację w chwili decyzji; hooki dozwolone w DODATKU r2). Skutek: wiersze prepared r20/r80/r140 (2/1/1 ofert) to szum, nie zależność od relacji. To nie jest decyzja produktowa.
2. NAPRAW (zakres pomiaru). Ramię naturalne = pasywny gracz, 0 ofert handlowych; 3 z 6 ziaren kończą się ok. t100 utratą jedynego miasta (99-102 tury < 150). Nie odpowiada na pytanie o częstość. Wymagane: pomiar w warunkach, w których oferty handlowe są możliwe, na ≥3 ziarnach, z utrzymaniem miasta gracza do 150 tur (albo rezygnacja z tego ramienia).
3. NAPRAW. Jedyne ramię z ofertami handlowymi (prepared) ma 1 ziarno (1111), 2 z 3 komórek NIEDOKOŃCZONE (149 tur) — potwierdzone w summary.md. GOAL wymaga ≥3 ziaren.
4. ODDAL (zamknięty). Etykiety przeliczone z offerLog (relabel-r4, labelsBeforeRelabel zachowane); summary.md poprawnie rozdziela handel i dyplomację (rozejm/trybut) — zweryfikowane.
5. ODDAL z notą. Osobne mutanty A (setRelationTotal), B (entries), C (civTestSeedOverride), E (closeBattleSummary) i klasyfikacja wykryte; D (flushBattles) niewykryty — mutant równoważny dla ścieżki, uczciwie opisany; battleState niemutowany (NIE_ZMIERZONO). Samo w sobie nie wymaga naprawy.
6. NAPRAW (częściowo). Fast = normal potwierdzone w 20 turach (1 ziarno, ramię bez ofert handlowych — słaby dowód); wznowienie zgodne dla perTurn/offerLog, ale liczniki bitew po wznowieniu rozjechane (16 vs 10; flush 3). Wymagane: naprawa lub wyłączenie liczników bitew dla przebiegów wznawianych oraz porównanie fast/normal na przebiegu z ofertami handlowymi.

## ZGODNOŚĆ Z GOAL
Niespełniona: brak ≥3 ziaren z ofertami handlowymi, brak rozdzielonych poziomów relacji, wniosek o częstości opiera się na 1 ziarnie. Zarzuty 1-3 są do naprawy bez decyzji właściciela (hak + runner), więc nie ma tu pytania ABC.

## BLOKADY
Brak blokad technicznych; wymagana runda 4/5.

## RUNDY
3/5 zużyte (Operator r3 Sonnet). Kolejna: 4/5, to samo ID.

## NASTĘPNY KROK
Runda 4: (a) przypiąć relację bezpośrednio przed decyzją AI (lub hak odczytu relacji decyzyjnej) i wykazać, że relTotal widziany w decyzji = pin; (b) prepared na ≥3 ziarnach × ≥150 tur × 3 rozdzielone relacje; (c) ramię naturalne: 150 tur albo rezygnacja; (d) liczniki bitew przy wznowieniu; (e) fast vs normal na przebiegu z ofertami.

DEPLOY/PUSH: NIE WYKONANO
