# Turniej: Akwedukt (`akwedukt`)

Kategoria: Zdrowie · Epoka wejścia: Brąz · maksPoziom: 2 · technologia: Budownictwo · definicja: `gra/data/buildings.json:853` · dzisiejszy top3: `:889`

Cena korzyści (nie jest kandydatem): budowa 30 Pracy, 30 drewno + 60 kamien, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Limit ludności miasta do 20 | Najwyższy próg drabinki: bez budynku 5 → Spichlerz 8 → Spichlerz Królewski 12 → Akwedukt 20. | 5 | 3 | 5 | 2 | 3 | 5 | 49 | gra/data/econ-params.json:45-51; gra/src/game/economy.ts:1053 |
| b | own | +4 zdrowia w mieście | Akwedukt liczy się też jako dostęp do świeżej wody. | 2 | 1 | 3 | 2 | 3 | 5 | 30 | gra/data/society-params.json:10-16; gra/src/game/turn-economy.ts:476-498 |
| c | own | +3 Szczęścia w mieście (rośnie z epoką) | Ryczałt +1 i +2 zadowolenia. | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:853; gra/src/game/economy.ts:509-535 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 49:30.
- a vs c → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 49:28.
- b vs c → **b** — przewaga w kryterium BRAK ZASTĘPNIKA (3 vs 2), suma ważona 30:28.

## 4. Ranking

1. **a** — Limit ludności miasta do 20 — wygrane: 2, suma: 49
2. **b** — +4 zdrowia w mieście — wygrane: 1, suma: 30
3. **c** — +3 Szczęścia w mieście (rośnie z epoką) — wygrane: 0, suma: 28

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Limit ludności miasta do 20** — Najwyższy próg drabinki: bez budynku 5 → Spichlerz 8 → Spichlerz Królewski 12 → Akwedukt 20.
- Top2: **+4 zdrowia w mieście** — Akwedukt liczy się też jako dostęp do świeżej wody.
- Top3: **+3 Szczęścia w mieście (rośnie z epoką)** — Ryczałt +1 i +2 zadowolenia.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost zadowolenia” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga Studni” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera Budownictwo” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Limit ludności miasta do 20
- DODANE: +4 zdrowia w mieście

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Akwedukt, aby podnieść limit ludności miasta do 20.

## 8. Uwagi

Dzisiejszy top3 NIE wspomina o limicie ludności 20 — główny powód budowy. Pozycje 2–3 to warunek i wymaganie.
