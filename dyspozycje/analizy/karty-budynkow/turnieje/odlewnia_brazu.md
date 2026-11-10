# Turniej: Odlewnia brązu (`odlewnia_brazu`)

Kategoria: Produkcja · Epoka wejścia: Brąz · maksPoziom: 1 · technologia: Brązownictwo · definicja: `gra/data/buildings.json:156` · dzisiejszy top3: `:192`

Cena korzyści (nie jest kandydatem): budowa 28 Pracy, 30 drewno + 40 kamien, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Wytapia brąz: do 50 sztuk na turę | Zamienia rudę miedzi, drewno i cynę w brąz (50 cykli na turę, więcej w kolejnych epokach); brąz to koszt wojska epoki Brązu. | 4 | 5 | 5 | 5 | 3 | 4 | 57 | gra/src/game/converters.ts:13; gra/src/game/converters.ts:97; gra/data/econ-params.json:362-368 |
| b | own | +5 Pracy w mieście | Stały dodatek Pracy miasta. | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:156 |
| c | next (R-B1) | Warunek badania Hutnictwa żelaza | Bez Odlewni brązu w państwie nie zbadasz Hutnictwa żelaza (epoka Żelaza). | 4 | 0 | 5 | 5 | 1 | 4 | 38 | gra/data/tech.json:340; gra/src/game/research.ts:154-180 |
| d | next (R-B1) | Rozbudowa do Odlewni żelaza: żelazo i +12 Pracy | Po Hutnictwie żelaza rozbudowa daje drugi konwerter — żelazo. | 4 | 0 | 5 | 5 | 1 | 3 | 37 | gra/data/buildings.json:204; gra/src/game/converters.ts:98-99 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 4 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 57:30.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 57:38.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 57:37.
- b vs c → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 38:30.
- b vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 37:30.
- c vs d → **c** — przewaga w kryterium CZYTELNOŚĆ (4 vs 3), suma ważona 38:37.

## 4. Ranking

1. **a** — Wytapia brąz: do 50 sztuk na turę — wygrane: 3, suma: 57
2. **c** — Warunek badania Hutnictwa żelaza — wygrane: 2, suma: 38
3. **d** — Rozbudowa do Odlewni żelaza: żelazo i +12 Pracy — wygrane: 1, suma: 37
4. **b** — +5 Pracy w mieście — wygrane: 0, suma: 30

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Wytapia brąz: do 50 sztuk na turę** — Zamienia rudę miedzi, drewno i cynę w brąz (50 cykli na turę, więcej w kolejnych epokach); brąz to koszt wojska epoki Brązu.
- Top2: **Warunek badania Hutnictwa żelaza** — Bez Odlewni brązu w państwie nie zbadasz Hutnictwa żelaza (epoka Żelaza).
- Top3: **Rozbudowa do Odlewni żelaza: żelazo i +12 Pracy** — Po Hutnictwie żelaza rozbudowa daje drugi konwerter — żelazo.
- Top4: **+5 Pracy w mieście** — Stały dodatek Pracy miasta.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost Pracy” → ZACHOWANE (w nowym TOP 5)
- 2. „Wytapia brąz” → ZACHOWANE (w nowym TOP 5)
- 3. „Pierwszy stopień łańcucha odlewni” → ZACHOWANE (w nowym TOP 5)
- DODANE: Warunek badania Hutnictwa żelaza

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Odlewnię brązu, aby wytwarzać brąz potrzebny do wojska epoki Brązu.
- Rozbuduj ją do Odlewni żelaza (Hutnictwo żelaza), aby wytwarzać także żelazo.

## 8. Uwagi

Pole przyrost martwe (maksPoziom=1). Konwerter wymaga też cyny (0,1 na cykl, converters.ts:97).
