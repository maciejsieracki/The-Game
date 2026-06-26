# PACZKA: MIASTO -> MASTER : kontrakty ulepszeń terenu + granice miast

**Data:** 2026-06-24
**Kanał:** jednokierunkowy (MIASTO -> MASTER)

---

## KONTRAKT 1 — KOSZT ULEPSZEŃ + ŹRÓDŁO PRACY

### Źródło prawdy: `gra/data/terrain-improvements.json`, pole `koszt_praca`

| Ulepszenie | koszt_praca |
|---|---|
| farma | 20 |
| irygacja | 30 |
| pastwisko | 20 |
| kopalnia | 25 |
| glinianka | 20 |
| kamieniolom | 22 |
| oboz_lowiecki | 18 |
| wyrab | 20 |
| tarasy | 25 |
| lodzie_rybackie | 20 |
| plantacja | 22 |
| warzelnia_soli | 20 |
| fort | 25 |
| droga | 15 |
| posterunek | 30 |

### Płatność

Koszt pokrywany z **puli „odłożonej Pracy"** w skarbcu (decyzja Q4). Praca miasta jest dzielona:
- część → kolejka budynków miasta,
- reszta → **globalna pula Pracy**; ta pula zasila zlecenia ulepszeń na polach w zasięgu roboczym.

### Parametr podziału

Param `praca_udzial_budynki` w `gra/data/miasto-params.json` (domyślnie `0.7`).

Helper do wystawienia z `production.ts`:

```
splitPraca(cityPraca: number, udzial: number) -> { doBudynkow: number, doPuli: number }
```

> **STATUS: DO WYSTAWIENIA przez MIASTO** (jeszcze NIE zaimplementowany).

### Model postępu ulepszenia

1. Gracz/silnik wystawia **zlecenie** ulepszenia pola (q, r).
2. Co turę z puli globalnej dolewa się Praca do zlecenia.
3. Gdy suma osiągnie `koszt_praca` → ulepszenie **ukończone**.
4. **MAPA stawia flagę** na heksie (stan pola trzyma MAPA, nie MIASTO).

---

## KONTRAKT 2 — GRANICE / ZASIĘG MIAST

*(dla panelu budowania + ograniczeń + zakładania nowych miast)*

### Test zasięgu/granicy

Funkcja: `cityBorderRadius(culturePoints, params)` z `gra/src/game/culture-religion.ts`

- Zwraca wartość `0..3`, rośnie z punktami kultury.
- **POSTERUNKI** rozszerzają granicę o promień 3 (pole `zasieg_posterunku` w `terrain-improvements.json`, wartość: `3`).

### Okolica robocza miasta

Promień: **5** (`zasieg_okolicy_miasta` w `gra/data/miasto-params.json`).

> Okolica robocza (pola na plony) jest **OSOBNA** od granicy zakładania nowych miast.

### Reguła zakładania miasta

Funkcja: `canFoundCity(q, r, cities, map)` w `gra/src/game/cities.ts`

Wymagania:
- Teren dopuszczalny (nie morze, nie góry).
- Dystans ≥ 5 od każdego innego miasta (`MIN_CITY_DISTANCE = 5`, param `min_dystans_miast` w `miasto-params.json`).
- **Wyłącznie w terytorium** (granica miasta LUB w zasięgu posterunku) — predykat terytorium dostarcza **MAPA/silnik**; MIASTO może wystawić **opcjonalny** check `withinTerritory` jako 5. argument `canFoundCity`.

### Co MAPA dostaje od MIASTO

| Element | Wartość / źródło |
|---|---|
| Funkcja zasięgu granicy | `cityBorderRadius` z `culture-religion.ts` |
| Promień posterunku | `3` (pole `zasieg_posterunku` w `terrain-improvements.json`) |
| Min. dystans między miastami | `5` (stała `MIN_CITY_DISTANCE` / `min_dystans_miast` w `miasto-params.json`) |
| Zasięg okolicy roboczej | `5` (pole `zasieg_okolicy_miasta` w `miasto-params.json`) |

Panel budowania po stronie MAPA: pokazuje zasięgi i blokuje placement poza granicą.

---

## CO POZOSTAJE PO STRONIE MIASTO (do wystawienia, addytywnie)

1. **Helper `splitPraca`** w `gra/src/game/production.ts` — implementacja + testy jednostkowe.
2. **Opcjonalny territory-check** w `canFoundCity` jako 5. arg `opts.withinTerritory` (boolean predykat przekazywany z zewnątrz, domyślnie brak) — implementacja + backup + test.

Oba punkty do zrobienia przez MIASTO osobno, niezależnie od odbioru kontraktów przez MASTER/MAPA.
