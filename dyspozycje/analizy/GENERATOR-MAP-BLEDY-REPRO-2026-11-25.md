# Generator map — odtworzenia 5 kandydatów BŁĄD-GRY (R-WEB-MAP-GEN-BUG-REPRO-Q1)

Data: 2026-11-25 · baza: origin/main `069de0d41f8fee134579ec286028ede02cb9e002` · Operator HAIKU 5.5, runda 1/5 (obrona po zarzutach Evaluatora, zob. `dyspozycje/autobot/runs/R-WEB-MAP-GEN-BUG-REPRO-Q1/30-obrona-claude.md`).
Zero zmian w `gra/src` i `gra/data`. Skrypty odtworzeń: `dyspozycje/autobot/runs/R-WEB-MAP-GEN-BUG-REPRO-Q1/repro/` (bundler szuka `gra/` względem własnego położenia w repo; opcjonalnie zmienna `GRA_DIR`).
Czasy: wszystkie wartości zmierzone w obronie (zob. sekcja „Czasy”).

## Podsumowanie

| # | Kandydat | Odtworzone? | Klasyfikacja | Waga dla gracza | Priorytet tematu |
|---|---|---|---|---|---|
| 1 | 72 łąki poza maską Ziemi | TAK (seed 777 i 42: identyczny wynik, 72) | BŁĄD GRY (naruszona reguła maski) | niska (68/72 przy brzegu) | P3 |
| 2 | Antarktyda r=85 bez lądu | TAK (asercja failuje; wynik z pierwszej rundy, nie ponowiony w obronie) | STARY-PIN (reguła zmieniona przez C-MAP-Q3c) | niska (wygląd) | test-only + pytanie |
| 3 | Ujście głównej rzeki 15–18 hex od ujścia przy limicie 7 | TAK częściowo: 8 z 20 mas (kontynenty 42), 1 z 1 masy (pangea 7) | BŁĄD GRY (reguła właściciela, FALA 170) | średnia–wysoka | P1 |
| 4 | Pojedyncze lądy na oceanie | CZĘŚCIOWO: 1 heks (wyspy 108×74 seed 42), 0 (kontynenty 168×120 seed 42); „15 FAIL z 3” NIE ODTWORZONO | BŁĄD GRY (naruszony postwarunek w komentarzu kodu), potwierdzony na 1 przypadku; częstość NIE ZMIERZONO | niska | P4 |
| 5 | Monotonia gęstości (rzeki, pustynia) | TAK: test `world-density-test.cjs` sam zgłasza 2 FAIL na tych samych liczbach | NIEJEDNOZNACZNE (różnica pustyni 1 heks; rzeki niemonotoniczne w obu kierunkach per ziarno; źródło wymogu „AC-7” nie potwierdzone) | niska | P2 (po potwierdzeniu wymogu) |

Metryki złóż i lasu (pkt 5) liczone wg definicji z `gra/tools/world-density-test.cjs` (linie 48–72): złoża i las = nakładka. Obie są monotoniczne (zob. pkt 5).

## Czasy (zmierzone w obronie, wall clock)

| Odtworzenie | Rozmiar | Czas |
|---|---|---|
| r1 Ziemia seed 777 | Standardowy 168×120 | 44 s |
| r1 Ziemia seed 42 | Standardowy 168×120 | 43 s |
| r4 wyspy seed 42 | Mały 108×74 | 74 s |
| r4 kontynenty seed 42 | Standardowy 168×120 | 122 s |
| r3 kontynenty seed 42 | Standardowy 168×120 | 121 s |
| r3 pangea seed 7 | Standardowy 168×120 | 20 s |
| r5 gęstość (5 ziaren × 3 tiery) | Mały | 118 s |
| `world-density-test.cjs` (pełny test, referencja) | Mały | 243 s |

Kryterium dispatchu „< 10 min na odtworzenie” jest spełnione. Wcześniejsze szacunki „5–10 s / 40–60 s” były zaniżone i są zastąpione powyższymi.

## 1. Łąki poza maską szablonu Ziemi

**Odtworzenie:** `node dyspozycje/autobot/runs/R-WEB-MAP-GEN-BUG-REPRO-Q1/repro/r1-earth-offmask.cjs 777` oraz `… 42`. Typ `ziemia`, rozmiar standardowy 168×120.

Surowe wyjście, seed 777:
```
{"W":168,"H":120,"north":30,"south":30,"totalHexes":20160,"offMaskLand":72,"byTerrain":{"laka":72}}
sample: [{"q":50,"r":34,"t":"laka"},{"q":48,"r":35,"t":"laka"},{"q":49,"r":35,"t":"laka"},{"q":50,"r":35,"t":"laka"},{"q":45,"r":36,"t":"laka"},{"q":46,"r":36,"t":"laka"},{"q":47,"r":36,"t":"laka"},{"q":48,"r":36,"t":"laka"},{"q":49,"r":36,"t":"laka"},{"q":50,"r":36,"t":"laka"},{"q":42,"r":37,"t":"laka"},{"q":43,"r":37,"t":"laka"}]
offMask hexes with >=1 in-mask neighbour (brzeg): 68 of 72
offMask r min/max: 34 57 q min/max: 42 130
```
Surowe wyjście, seed 42 (ten sam format):
```
{"W":168,"H":120,"north":30,"south":30,"totalHexes":20160,"offMaskLand":72,"byTerrain":{"laka":72}}
sample: [{"q":50,"r":34,"t":"laka"},{"q":48,"r":35,"t":"laka"},{"q":49,"r":35,"t":"laka"},{"q":50,"r":35,"t":"laka"},{"q":45,"r":36,"t":"laka"},{"q":46,"r":36,"t":"laka"},{"q":47,"r":36,"t":"laka"},{"q":48,"r":36,"t":"laka"},{"q":49,"r":36,"t":"laka"},{"q":50,"r":36,"t":"laka"},{"q":42,"r":37,"t":"laka"},{"q":43,"r":37,"t":"laka"}]
offMask hexes with >=1 in-mask neighbour (brzeg): 68 of 72
offMask r min/max: 34 57 q min/max: 42 130
```

Oczekiwane (reguła): 0 heksów lądu poza maską (`gra/tools/earth-template-test.cjs:51`; opis maski: `gra/src/map/earth-land-mask.ts:1–10`).
Faktyczne: 72 łąki poza maską; 68 z nich sąsiaduje z lądem w masce (efekt brzegu), 4 dalej.

**Klasyfikacja:** BŁĄD GRY (naruszona reguła maski), waga niska. Lista heksów jest identyczna dla seedów 777 i 42, więc w tym typie mapy układ dokładanych łąk nie zależy od seeda w obserwowanym przypadku. Przyczyna techniczna (który etap dokłada łąki) NIE ZMIERZONO.
**Skutek dla gracza:** pojedyncze łąki wystające o 1 heks poza kontur kontynentu szablonu Ziemi.
**Częstość:** 2 z 2 zbadanych seedów (777, 42); N=2.
**Propozycja naprawy (bez implementacji):** po etapie lądu przyciąć łąki poza maską albo świadomie dopuścić bufor 1 heks i zapisać to w regule maski. Testy do zmiany: `gra/tools/earth-template-test.cjs:51` tylko przy akceptacji bufora przez właściciela.

## 2. Antarktyda r=85 bez lądu

**Odtworzenie:** `gra/tools/earth-template-test.cjs`, asercja `ok(antLand > 0, …)` (linia 82). Wynik z pierwszej rundy (seed 777): `FAIL: ziemia: Antarktyda w szablonie nad buforem południowym (found 0 heksów przy r=85)`. Pełnego testu nie ponowiono w obronie (ok. 6,5 min); wynik traktować jako obserwację pierwszej rundy.

**Klasyfikacja: STARY-PIN.** Asercja pochodzi z commitu `e9c4c965d` (2026-07-24, „fix(mapa-ziemia): bufor poludniowy + przywroc Antarktyde”). Późniejsza reguła `C-MAP-Q3c` usuwa Antarktydę z maski: `gra/src/map/earth-land-mask.ts:5` („Antarktyda usunięta z maski; ląd redystrybuowany”), commit `f776d4d60` (FALA 33, 2026-07-27).
**Uwaga:** `docs/decyzje/A-MAP-ZIEMIA-1.md:15` nadal mówi „Antarktyda: ZOSTAJE”, a linia 32 opisuje opcję B (usunięcie). Dokumenty są niespójne z kodem — decyzja wyglądu do właściciela.
**Propozycja:** nie naprawiać generatora; zaktualizować asercję w `earth-template-test.cjs:81–83` do obecnej reguły po decyzji właściciela.

## 3. Ujście głównej rzeki poza limitem odstępu wzdłuż wybrzeża

**Reguła:** `gra/src/map/gen-helpers.ts:5726–5727` — „Max odstęp wzdłuż wybrzeża między ujściami głównych rzek (Maciej 2026-08-02, FALA 170)”, `MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7`; dla Standardu `mainRiverCoastMouthMaxGapForDims` zwraca 7 (Mała: 5).
**Test:** `gra/tools/river-sea-buffer-test.cjs:84` — `coastTol = typ === 'ziemia' ? maxGap + 35 : maxGap`.

**Odtworzenie A:** `node .../repro/r3-river-mouth-gap.cjs kontynenty 42` (168×120), surowe wyjście:
```
{"typ":"kontynenty","seed":42,"limitMaxGap":7,"zyskTolerancjiZiemia":null,"landMassesChecked":20,"mainRiverPaths":120,"badMasses":[{"size":265,"worstGap":15},{"size":145,"worstGap":11},{"size":12,"worstGap":12},{"size":12,"worstGap":9},{"size":10,"worstGap":10},{"size":590,"worstGap":10},{"size":1011,"worstGap":8},{"size":19,"worstGap":18}],"worstGapAll":18}
```
**Odtworzenie B:** `node .../repro/r3-river-mouth-gap.cjs pangea 7`, surowe wyjście:
```
{"typ":"pangea","seed":7,"limitMaxGap":7,"zyskTolerancjiZiemia":null,"landMassesChecked":1,"mainRiverPaths":25,"badMasses":[{"size":7056,"worstGap":15}],"worstGapAll":15}
```
Oczekiwane: każda masa ≤ 7. Faktyczne: 8 z 20 mas (kontynenty 42), 1 z 1 (pangea 7); najgorzej 18 (masa 19 heksów) i 15.

**Klasyfikacja:** BŁĄD GRY (reguła właściciela, FALA 170). **Waga: średnia–wysoka** — na odcinku wybrzeża brak ujścia rzeki w zasięgu limitu.
**Częstość:** 2 mapy nie-Ziemia (kontynenty 42, pangea 7) łamią limit; N=2.
**Uwaga:** dla typu Ziemia test dopuszcza 42 (7+35). To rozluźnienie testu, nie reguły gry — pytanie wyglądu do właściciela (poniżej).
**Propozycja:** w wyborze ujść wymusić kolejne ujście, gdy odstęp wzdłuż wybrzeża > limit. Testy: `river-sea-buffer-test.cjs` (nowe asercje).

## 4. Pojedyncze lądy na otwartym oceanie

**Reguła (postwarunek w kodzie):** `gra/src/map/gen-helpers.ts:5177–5179` — „Suchy ląd bez sąsiada-lądu … artefakt szumu w oceanie. Po removeTinyLandIslands powinno być 0”. Test: `gra/tools/stranded-land-test.cjs:77`.

**Odtworzenie A:** `node .../repro/r4-stranded-specks.cjs 108 74 wyspy 42` (mała mapa, 74 s):
```
{"typ":"wyspy","seed":42,"w":108,"h":74,"totalHexes":7992,"landHexes":3996,"openOceanLandSpecks":1}
```
**Odtworzenie B:** `node .../repro/r4-stranded-specks.cjs 168 120 kontynenty 42` (standard, 122 s):
```
{"typ":"kontynenty","seed":42,"w":168,"h":120,"totalHexes":20160,"landHexes":6047,"openOceanLandSpecks":0}
```
Oczekiwane: 0. Faktyczne: 1 (wyspy, mała, seed 42), 0 (kontynenty, standard, seed 42).

**Klasyfikacja:** BŁĄD GRY potwierdzony na 1 przypadku (naruszony postwarunek z komentarza kodu); **waga niska**. Częstość NIE ZMIERZONO: 2 przypadki na 2 mapach, z czego 1 łamie postwarunek.
**Nie odtworzono:** „15 FAIL z 3” z dispatchu — NIE ZMIERZONO (nie uruchomiono `stranded-land-test.cjs`; zbadano 2 przypadki z ok. 9 w teście). Ten zarzut nie jest potwierdzony.
**Propozycja:** dodać przebieg usuwania samotnych heksów po ostatecznym wybrzeżu (albo podnieść próg usuwania dla małych map). Testy: `stranded-land-test.cjs` bez zmian oczekiwań.

## 5. Monotonia gęstości świata (rzeki, pustynia)

**Asercje testu:** `gra/tools/world-density-test.cjs:141` (rzeki) i `:142` (pustynia); suma po 5 ziarnach `[1,7,42,99,2026]`, mapa Mała, typ kontynenty; tiery low/medium/high.

**Odtworzenie:** `node .../repro/r5-density-monotone.cjs` (118 s; metryki jak w teście, linie 48–72). Surowe wyjście:
```
{"perSeed":[{"seed":1,"dep":[620,923,1212],"riv":[120,114,108],"des":[105,105,105],"for":[868,1330,1627]},{"seed":7,"dep":[602,907,1249],"riv":[122,111,127],"des":[99,99,99],"for":[842,1261,1569]},{"seed":42,"dep":[652,929,1252],"riv":[107,112,109],"des":[90,90,90],"for":[846,1279,1609]},{"seed":99,"dep":[719,977,1313],"riv":[138,114,128],"des":[129,128,128],"for":[849,1252,1592]},{"seed":2026,"dep":[640,975,1285],"riv":[115,120,112],"des":[81,81,81],"for":[857,1299,1623]}]}
{"S":{"depLow":3233,"depMed":4711,"depHigh":6311,"rivLow":602,"rivMed":571,"rivHigh":584,"desLow":504,"desMed":503,"desHigh":503,"forLow":4262,"forMed":6421,"forHigh":8020,"mtnLow":0,"mtnMed":0,"mtnHigh":0},"monoDep":true,"monoRiv":false,"monoDes":false,"monoFor":true}
```
**Weryfikacja referencyjna:** pełny `node gra/tools/world-density-test.cjs` (243 s) zwraca `29 pass, 2 fail` z dokładnie dwoma liniami:
```
FAIL: rzeki sum low=602 med=571 high=584
FAIL: pustynia sum low=504 med=503 high=503
```
Złoża i las (metryki testu) są monotoniczne: złoża 3233 ≤ 4711 ≤ 6311, las 4262 ≤ 6421 ≤ 8020; test ich nie zgłasza.

**Klasyfikacja: NIEJEDNOZNACZNE.** Potwierdzone: test zgłasza 2 FAIL na tych liczbach. Nie rozstrzygnięte:
- pustynia: 504 vs 503 to różnica 1 heksa na 5 map;
- rzeki: różnice per ziarno idą w obu kierunkach (np. ziarno 7: 122/111/127; ziarno 99: 138/114/128), więc to szum, a nie jednokierunkowa wada tieru;
- źródło wymogu monotonii „AC-7” nie jest potwierdzone: `dyspozycje/_handoff/MASTER-do-MAPA_E2-gestosc-generator.md:34` wymienia AC-7 jako kryterium testów (krowy na górach, determinism, world-density-test), bez jawnego zapisu monotonii tierów; commit wprowadzający asercje NIE ZMIERZONO.
**Skutek dla gracza (jeśli wymóg jest prawdziwy):** tier „Mało rzek” może dać tyle samo lub więcej ścieżek rzek niż „Normalnie”; tier pustyni praktycznie bez efektu. **Waga: niska–średnia.**
**Propozycja:** najpierw potwierdzić wymóg (źródło AC-7 lub decyzja właściciela), dopiero potem ewentualnie zwiększyć próbę ziaren lub sprawdzić cap `maxRivers` po zawężeniu.

## Tematy naprawcze (priorytet, po obronie)

1. **P1 — ujścia rzek na wybrzeżu (pkt 3):** wymusić ujście, gdy odstęp > 7 (Standard) / 5 (Mała). BŁĄD GRY, bez pytania (reguła właściciela już istnieje).
2. **P2 — monotonia tierów rzek i pustyni (pkt 5):** najpierw potwierdzić źródło wymogu; dopiero potem naprawa lub zmiana testu.
3. **P3 — łąki poza maską Ziemi (pkt 1):** przyciąć do maski albo zaakceptować bufor 1 heks (decyzja właściciela, wygląd).
4. **P4 — pojedyncze lądy na oceanie (pkt 4):** dodać przebieg usuwania samotnych heksów; częstość przed naprawą do zmierzenia.
5. **Dług testowy (nie gra):** asercja Antarktydy (pkt 2) → aktualizacja do reguły C-MAP-Q3c po decyzji właściciela.

## Pytania do właściciela (TYLKO wygląd mapy; ABC robi orkiestrator)

- **Antarktyda na mapie Ziemi:** w kodzie została usunięta (C-MAP-Q3c, 2026-07-27), a dokument A-MAP-ZIEMIA-1 nadal mówi „zostaje”. Czy Antarktyda ma być na mapie Ziemi? (Szczegóły: `earth-land-mask.ts:5`, `A-MAP-ZIEMIA-1.md:15,32`.)
- **Ziemia a limit ujść rzek:** test dopuszcza dla Ziemi odstęp do 42 hex (zamiast 7). Czy Ziemia ma mieć łagodniejszy limit, czy ma spełniać ten sam limit co inne typy? (Szczegóły: `river-sea-buffer-test.cjs:84`.)

## Niezmierzone / ograniczenia

- Nie uruchamiano pełnych testów ciężkich (deposit-coast, map-gen-regression) — zgodnie z dispatchem.
- `stranded-land-test.cjs` (w tym „15 FAIL z 3”) i pozostałe przypadki pustyni w oceanie, pangei i Ziemi — NIE ZMIERZONO.
- Antarktyda (pkt 2): wynik z pierwszej rundy, nie ponowiony w obronie.
- Przyczyny etapowe (pkt 1 i 5) — NIE ZMIERZONO.
- Częstości oparte na N=2 (pkt 1, 3, 4) i N=5 ziaren (pkt 5).
- Lista łąk dla seedów 777 i 42 jest identyczna; czy to ogólna własność typu Ziemia, czy artefakt dwóch seedów — NIE ZMIERZONO (brak trzeciego seeda).
