# Generator map — odtworzenia 5 kandydatów BŁĄD-GRY (R-WEB-MAP-GEN-BUG-REPRO-Q1)

Data: 2026-11-25 · baza: origin/main `069de0d41f8fee134579ec286028ede02cb9e002` · Operator HAIKU 5.5, runda 1/5.
Zero zmian w `gra/src` i `gra/data`. Skrypty odtworzeń: `dyspozycje/autobot/runs/R-WEB-MAP-GEN-BUG-REPRO-Q1/repro/`.
Każdy skrypt uruchamia jedną generację mapy (~40–60 s na mapie standardowej, Mała ~5–10 s) i wypisuje surowe liczby.

## Podsumowanie

| # | Kandydat | Odtworzone? | Klasyfikacja | Waga dla gracza | Priorytet tematu |
|---|---|---|---|---|---|
| 1 | 72 łąki poza maską Ziemi | TAK (2/2 seedy: 777, 42) | BŁĄD GRY (naruszona reguła maski; niska waga, 68/72 to brzeg) | niska | P3 |
| 2 | Antarktyda r=85 bez lądu | TAK (asercja failuje) | STARY-PIN (reguła zmieniona przez C-MAP-Q3c); pytanie o wygląd do właściciela | niska (wygląd) | test-only + pytanie |
| 3 | Ujście głównej rzeki 15–18 hex od ujścia przy limicie 7 | TAK (2/2 mapy: kontynenty 42, pangea 7) | BŁĄD GRY (reguła właściciela, FALA 170) | średnia–wysoka | P1 |
| 4 | Pojedyncze lądy na oceanie | TAK częściowo (1 heks na wyspy-42 mała; 0 na kontynenty-42 standard) | BŁĄD GRY (postwarunek z komentarza kodu) | niska | P4 |
| 5 | Monotonia gęstości (rzeki, pustynia) | TAK (5 ziaren, tiery low/med/high) | BŁĄD GRY wg nagłówka AC-7 w teście (źródło AC-7 NIE ZMIERZONO) | niska–średnia | P2 |

## 1. Łąki poza maską szablonu Ziemi

**Odtworzenie:** `node dyspozycje/autobot/runs/R-WEB-MAP-GEN-BUG-REPRO-Q1/repro/r1-earth-offmask.cjs 777` (oraz argument `42`). Typ `ziemia`, rozmiar standardowy 168×120, opcje jak w `gra/tools/earth-template-test.cjs`.

Surowe wyjście (seed 777):
```
{"W":168,"H":120,"north":30,"south":30,"totalHexes":20160,"offMaskLand":72,"byTerrain":{"laka":72}}
offMask hexes with >=1 in-mask neighbour (brzeg): 68 of 72
offMask r min/max: 34 57 q min/max: 42 130
```
Seed 42: identyczne `offMaskLand: 72`, ten sam zestaw (`byTerrain: {"laka":72}`, pierwsze heksy (50,34), (48,35)…). Zbieżność dwóch seedów sugeruje, że dla Ziemi układ lądu nie zależy od seeda (NIE ZMIERZONO dlaczego; nie szukano przyczyny w generatorze).

Oczekiwane (reguła): 0 heksów lądu poza maską (`gra/tools/earth-template-test.cjs:51`, `ok(outsideLand === 0, …)`; opis maski: `gra/src/map/earth-land-mask.ts:1–10`, „Maska szablonu Ziemi … ZAKRES: wyłącznie typ świata Ziemia”).
Faktyczne: 72 łąki poza maską; 68 z nich sąsiaduje z lądem w masce (efekt brzegu, 1 heks), 4 dalej.

**Klasyfikacja:** BŁĄD GRY (naruszona reguła maski), waga niska. Przyczyna techniczna (który etap dokłada łąki na brzegu) NIE ZMIERZONO.
**Skutek dla gracza:** pojedyncze łąki wystające o 1 heks poza konturem kontynentu szablonu Ziemi; widoczne jako lekko „wybrzuszony” brzeg. Częstość: 2/2 zbadane seedy (N=2).
**Propozycja naprawy (bez implementacji):** po etapie lądu przyciąć łąki poza maską (albo świadomie dopuścić 1-heksowy bufor i zapisać to w regule maski). Testy do zmiany: `gra/tools/earth-template-test.cjs:51` (tylko jeśli właściciel zaakceptuje bufor 1 heks).

## 2. Antarktyda r=85 bez lądu

**Odtworzenie:** ten sam przebieg co w pkt 1 (`earth-template-test.cjs`, linia 82): `ok(antLand > 0, …)`, wynik: `found 0 heksów przy r=85`.
Surowe wyjście testu (seed 777, `node gra/tools/earth-template-test.cjs`): `FAIL: ziemia: Antarktyda w szablonie nad buforem południowym (found 0 heksów przy r=85)`.

**Klasyfikacja: STARY-PIN.** Asercja pochodzi z commitu `e9c4c965d` (2026-07-24, „fix(mapa-ziemia): bufor poludniowy + przywroc Antarktyde”). Późniejsza reguła `C-MAP-Q3c` usuwa Antarktydę z maski: `gra/src/map/earth-land-mask.ts:5` („Antarktyda usunięta z maski; ląd redystrybuowany”), commit `f776d4d60` (FALA 33, 2026-07-27). Brak lądu w r=85 to zgodne z obecną maską, więc asercja jest przestarzała.
**Uwaga:** dokument `docs/decyzje/A-MAP-ZIEMIA-1.md:15` nadal mówi „Antarktyda: ZOSTAJE”, a linia 32 opisuje opcję B (usunięcie). Dokumenty są niespójne z kodem — to decyzja wyglądu do właściciela (patrz niżej).
**Propozycja:** nie naprawiać generatora; zaktualizować asercję w `earth-template-test.cjs:81–83` do obecnej reguły (po decyzji właściciela).

## 3. Ujście głównej rzeki poza limitem odstępu wzdłuż wybrzeża

**Reguła:** `gra/src/map/gen-helpers.ts:5726–5727` — „Max odstęp wzdłuż wybrzeża między ujściami głównych rzek (Maciej 2026-08-02, FALA 170)”, `MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7`; dla Standardu `mainRiverCoastMouthMaxGapForDims` zwraca 7 (Mała: 5).
**Test:** `gra/tools/river-sea-buffer-test.cjs:84` — `coastTol = typ === 'ziemia' ? maxGap + 35 : maxGap`.

**Odtworzenie A:** `node .../repro/r3-river-mouth-gap.cjs kontynenty 42` (168×120):
```
{"typ":"kontynenty","seed":42,"limitMaxGap":7,"landMassesChecked":20,"mainRiverPaths":120,
 "badMasses":[{"size":265,"worstGap":15},{"size":145,"worstGap":11},{"size":12,"worstGap":12},
 {"size":12,"worstGap":9},{"size":10,"worstGap":10},{"size":590,"worstGap":10},
 {"size":1011,"worstGap":8},{"size":19,"worstGap":18}],"worstGapAll":18}
```
**Odtworzenie B:** `node .../repro/r3-river-mouth-gap.cjs pangea 7`:
```
{"typ":"pangea","seed":7,"limitMaxGap":7,"landMassesChecked":1,"mainRiverPaths":25,
 "badMasses":[{"size":7056,"worstGap":15}],"worstGapAll":15}
```
Oczekiwane: każda masa ≤7. Faktyczne: 8 z 20 mas (kontynenty 42), 1 z 1 (pangea 7); najgorzej 18 (masa 19 heksów) i 15.

**Klasyfikacja:** BŁĄD GRY (reguła właściciela, FALA 170). **Waga: średnia–wysoka** — na długim odcinku wybrzeża brak ujścia rzeki (rzeka „kończy się” w głębi lądu, kilkanaście heksów od morza).
**Częstość:** 2/2 zbadane mapy nie-Ziemia z tym seedem/typem łamią limit; N=2.
**Uwaga:** dla typu Ziemia test dopuszcza 42 (7+35). To jest rozluźnienie testu, nie reguły gry — pytanie o wygląd (patrz niżej).
**Propozycja:** w wyborze ujść wymusić kolejne ujście, gdy odstęp wzdłuż wybrzeża > limit (dla mas bez ujścia); testy do zmiany: `river-sea-buffer-test.cjs` (ew. nowe asercje), brak zmian oczekiwanych w tolerancji dla Ziemi bez decyzji właściciela.

## 4. Pojedyncze lądy na otwartym oceanie

**Reguła (postwarunek w kodzie):** `gra/src/map/gen-helpers.ts:5177–5179` — „Suchy ląd bez sąsiada-lądu … artefakt szumu w oceanie. Po removeTinyLandIslands powinno być 0”. Test: `gra/tools/stranded-land-test.cjs:77`.

**Odtworzenie A:** `node .../repro/r4-stranded-specks.cjs 108 74 wyspy 42` (mała mapa):
```
{"typ":"wyspy","seed":42,"w":108,"h":74,"totalHexes":7992,"landHexes":3996,"openOceanLandSpecks":1}
```
**Odtworzenie B:** `node .../repro/r4-stranded-specks.cjs 168 120 kontynenty 42`:
```
{"typ":"kontynenty","seed":42,"w":168,"h":120,"totalHexes":20160,"landHexes":6047,"openOceanLandSpecks":0}
```
Oczekiwane: 0. Faktyczne: 1 (wyspy, mała, seed 42), 0 (kontynenty, standard, seed 42).

**Klasyfikacja:** BŁĄD GRY (naruszony postwarunek z komentarza kodu), **waga niska** (pojedynczy heks na jednej mapie z dwóch zbadanych).
**Nie odtworzono:** „15 FAIL z 3” z dispatchu — NIE ZMIERZONO (nie uruchomiono pełnego zestawu ziaren testu ani pangei/ziemi; tylko 2 z ok. 9 przypadków testu).
**Propozycja:** dodać przebieg usuwania samotnych heksów po ostatecznym wybrzeżu (albo podnieść próg usuwania dla małych map). Testy: `stranded-land-test.cjs` bez zmian oczekiwań.

## 5. Monotonia gęstości świata (rzeki, pustynia)

**Asercje:** `gra/tools/world-density-test.cjs:141` (rzeki) i `:142` (pustynia), suma po 5 ziarnach `[1,7,42,99,2026]`, mapa Mała, typ kontynenty; tiery low/medium/high.

**Odtworzenie:** `node .../repro/r5-density-monotone.cjs` (ok. 2 min, 15 map Mała):
```
S: depLow=1949 depMed=3326 depHigh=4943 | rivLow=602 rivMed=571 rivHigh=584 |
   desLow=504 desMed=503 desHigh=503 | forest (metryka nieprawidłowa: 0 we wszystkich)
monoDep=true  monoRiv=false  monoDes=false  monoFor=NIE ZMIERZONO (metryka)
```
Oczekiwane: low ≤ med ≤ high. Faktyczne: rzeki 602 > 571 (low > med), pustynia 504 > 503 (low > med). Dla pustyni high = med (503): tier „Dużo” nic nie zmienia — NIE ZMIERZONO przyczyny.
Metryka lasu w skrypcie jest błędna (las to nakładka, nie typ terenu) — NIE ZMIERZONO.

**Klasyfikacja:** BŁĄD GRY wg nagłówka „AC-7” w teście (wymóg monotonii tierów). Źródło AC-7 w dokumentach NIE ZMIERZONO.
**Skutek dla gracza:** ustawienie „Mało rzek” może dać tyle samo lub więcej rzek niż „Normalnie”; różnica między tierami rzek i pustyni praktycznie niewidoczna. **Waga: niska–średnia.**
**Propozycja:** sprawdzić, czy tier rzek wpływa na limit po zawężeniu (np. cap `maxRivers` vs liczba ścieżek); ewentualnie zwiększyć próbę (więcej ziaren) przed decyzją o regule. Testy: `world-density-test.cjs:141–142`.

## Tematy naprawcze (priorytet)

1. **P1 — ujścia rzek na wybrzeżu (pkt 3):** wymusić ujście, gdy odstęp > 7 (Standard) / 5 (Mała). BŁĄD GRY, bez pytania (reguła właściciela już istnieje).
2. **P2 — monotonia tierów rzek i pustyni (pkt 5):** zbadać przyczynę; potwierdzić źródło AC-7 przed naprawą.
3. **P3 — łąki poza maską Ziemi (pkt 1):** przyciąć do maski albo zaakceptować 1-heks bufor (decyzja właściciela wygląd, patrz niżej).
4. **P4 — pojedyncze lądy na oceanie (pkt 4):** dodać przebieg usuwania samotnych heksów.
5. **Dług testowy (nie gra):** asercja Antarktydy (pkt 2) → aktualizacja do reguły C-MAP-Q3c po decyzji właściciela.

## Pytania do właściciela (TYLKO wygląd mapy; ABC robi orkiestrator)

- **Antarktyda na mapie Ziemi:** w kodzie została usunięta (C-MAP-Q3c, 2026-07-27), a dokument A-MAP-ZIEMIA-1 nadal mówi „zostaje”. Czy Antarktyda ma być na mapie Ziemi? (Szczegóły: `earth-land-mask.ts:5`, `A-MAP-ZIEMIA-1.md:15,32`.)
- **Ziemia a limit ujść rzek:** test dopuszcza dla Ziemi odstęp do 42 hex (zamiast 7). Czy Ziemia ma mieć łagodniejszy limit, czy ma spełniać ten sam limit co inne typy? (Szczegóły: `river-sea-buffer-test.cjs:84`.)

## Niezmierzone / ograniczenia

- Nie uruchamiano pełnych testów ciężkich (deposit-coast, map-gen-regression) — zgodnie z dispatchem.
- Pozostałe przypadki `stranded-land` (pustynia w oceanie, pangea, ziemia) i „15 FAIL z 3” — NIE ZMIERZONO.
- Przyczyny (który etap generatora) dla pkt 1 i 5 — NIE ZMIERZONO.
- Częstości oparte na N=2 (pkt 1, 3, 4) i N=5 ziaren (pkt 5).
