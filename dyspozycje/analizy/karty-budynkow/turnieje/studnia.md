# Turniej: Studnia (`studnia`)

Kategoria: Zdrowie · Epoka wejścia: Kamień · maksPoziom: 3 · technologia: Gospodarka wodna · definicja: `gra/data/buildings.json:806` · dzisiejszy top3: `:842`

Cena korzyści (nie jest kandydatem): budowa 15 Pracy, 25 drewno, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +2 zdrowia i koniec kary −2 za brak wody | Miasto bez rzeki dostaje czystą wodę: +2 zdrowia zamiast −2. | 3 | 3 | 4 | 2 | 4 | 4 | 42 | gra/data/society-params.json:17-23; gra/data/society-params.json:116-122; gra/src/game/turn-economy.ts:476-498 |
| b | own | +2 Szczęścia w mieście (rośnie z epoką) | Ryczałt +1 i +1 zadowolenia na poziom. | 1 | 1 | 2 | 2 | 4 | 5 | 27 | gra/data/buildings.json:806; gra/src/game/economy.ts:509-535; gra/src/game/production.ts:252-271 |
| c | next (R-B1) | Warunek Akweduktu (limit 20) i Łaźni | Bez Studni w mieście nie zbudujesz Akweduktu ani Łaźni publicznej. | 4 | 0 | 5 | 2 | 1 | 4 | 32 | gra/src/game/building-resource-gate.ts:110-121; gra/data/buildings.json:853 |
| d | next (R-B1) | Warunek badania Medycyny | Bez Studni w państwie nie zbadasz Medycyny (Łaźnia publiczna). | 2 | 0 | 5 | 5 | 1 | 4 | 32 | gra/data/tech.json:425; gra/src/game/research.ts:154-180 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 4 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:27.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 42:32.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 42:32.
- b vs c → **c** — przewaga w kryterium SKALA (4 vs 1), suma ważona 32:27.
- b vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 32:27.
- c vs d → **c** — remis 32:32, rozstrzyga SKALA (4 vs 2).

## 4. Ranking

1. **a** — +2 zdrowia i koniec kary −2 za brak wody — wygrane: 3, suma: 42
2. **c** — Warunek Akweduktu (limit 20) i Łaźni — wygrane: 2, suma: 32
3. **d** — Warunek badania Medycyny — wygrane: 1, suma: 32
4. **b** — +2 Szczęścia w mieście (rośnie z epoką) — wygrane: 0, suma: 27

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+2 zdrowia i koniec kary −2 za brak wody** — Miasto bez rzeki dostaje czystą wodę: +2 zdrowia zamiast −2.
- Top2: **Warunek Akweduktu (limit 20) i Łaźni** — Bez Studni w mieście nie zbudujesz Akweduktu ani Łaźni publicznej.
- Top3: **Warunek badania Medycyny** — Bez Studni w państwie nie zbadasz Medycyny (Łaźnia publiczna).
- Top4: **+2 Szczęścia w mieście (rośnie z epoką)** — Ryczałt +1 i +1 zadowolenia na poziom.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost zadowolenia” → ZACHOWANE (w nowym TOP 5)
- 2. „Otwiera drogę do Akweduktu” → ZACHOWANE (w nowym TOP 5)
- 3. „Otwiera Gospodarkę wodną” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +2 zdrowia i koniec kary −2 za brak wody
- DODANE: Warunek badania Medycyny

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Studnię, aby dać miastu czystą wodę (+2 zdrowia, bez kary −2).
- Zbuduj obok Akwedukt (Budownictwo), aby podnieść limit ludności miasta do 20.

## 8. Uwagi

Dzisiejszy top3 pomija zdrowie. Pozycja 3 to wymaganie technologii.
