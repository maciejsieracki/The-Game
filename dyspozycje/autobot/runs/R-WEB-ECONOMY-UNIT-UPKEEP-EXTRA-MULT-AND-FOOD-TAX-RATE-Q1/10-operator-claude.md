# R-WEB-ECONOMY-UNIT-UPKEEP-EXTRA-MULT-AND-FOOD-TAX-RATE-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-UPKEEP-EXTRA-MULT-AND-FOOD-TAX-RATE-Q1 (Dodatek 1 wg decyzji wlasciciela 2026-11-19)
GOAL: fala 875 anulowana; zywnosc jednostek = geometria x4 na epoke (Kamien x1 / Braz x4 / Zelazo x16 przed R_STAWKI); pieniadz i surowce utrzymania bez zmian (x1/x2/x4); kurs Zywnosc->Podatek 0,2.
ZMIANY-COMMIT: baza 3e978f882; allowlista: econ-era-rebalance.ts, economy-upkeep.ts, econ-era-rebalance-params.json (jednostkiZywnoscMnoznikNaEpoke=4, usunieto jednostkiUtrzymanieMnoznikEpoki), econ-params.json (tylko targowisko_zywnosc_na_podatek_kurs = 0,2), unit-upkeep-era-scale-test.cjs, econ-era-rebalance-test.cjs, food-to-tax-conversion-test.cjs, ten raport. HUD/karta/AI nie wymagaly zmian: czytaja te same funkcje (unitFoodCardValue, buildUnitFoodTable, unitUpkeep).
TESTY:
- tsc --noEmit: exit 0
- logic-test: 213 PASS / 0 FAIL; tech-tree: 20 pass / 0 fail; research: 33/0; unit-replace: 21 OK / 0 FAIL; combat-test: exit 0
- unit-upkeep-era-scale-test: 21 ok / 0 FAIL (mutanty M1-M5 wykryte)
- econ-era-rebalance-test: 38 ok / 0 FAIL (mutanty M1-M10 wykryte; piny E3/E4/E8 zmienione, opis w tescie)
- food-to-tax-conversion-test: 71 PASS / 0 FAIL
- Testy zielone takze: upkeep, unit-epoch-cost, unit-resource-upkeep, ai-recruit-upkeep-gate, citystate-army-food-difficulty, glod-wojska-karencja, no-negative-stocks-projection, oblezenie, upkeep-difficulty-per-owner
- empire-food-b5-test: FAIL (2 asercje: racje "era-scaled affordability"). To samo na 3e978f882 (zweryfikowane podmiana plikow na baze): PRZED-existing, NIE zwiazane ze zmiana.
JAK TO WYGLADA W GRZE PO ZMIANIE (flaga ON, domyslnie): zywnosc/ture jednostki po x4 R_STAWKI: Kamien 4, Braz 16, Zelazo 64 (przed fala 875: 4/12/36 przy x3; fala 875: 4/8/16). Pieniadz i surowce: bez zmian. Karta jednostki i silnik pokazuja te sama liczbe. Flaga OFF = zachowanie bazy bez zmian.
POMIAR (seed 4242, 90 tur, runner ai-economy-measure-run.cjs, bundle poza repo, PRZED = 3e978f882, PO = ta zmiana):
| tura | AI jednostki PRZED/PO | AI Braz jednostki PRZED/PO | zapas zywnosci AI (suma) PRZED/PO | glod |
|---|---|---|---|---|
| 30 | 62/63 | 62/63 | 81/94 | 0 |
| 50 | 165/164 | 165/164 | 1237/869 | 0 |
| 70 | 247/245 | 247/245 | 39420/34272 | 0 |
| 80 | 327/310 | 250/218 (12 wlascicieli) | 108884/101391 | 0 |
| 90 | 479/493 | 127/112 (7 vs 6 wlascicieli) | 247374/235979 | 0 |
NIE ZMIERZONO: netto zywnosci HUD (brak w metrykach); uzyto zapasu zywnosci (spichlerz). Gracz (owner 0) identyczny PRZED/PO: stracil wszystkie miasta do t70 w obu biegach (nie badany wplyw).
BLOKADY: brak. Uwaga: Chromium padal przy wznowieniu ze slotu; przebieg wykonano od zera w dwoch wywolaniach.
UWAGI-DLA-ORKIESTRATORA: (1) wynik pomiaru: brak masowego rozpadu armii i brak glodu; zapasy zywnosci AI w PO nizsze o ok. 5% (t90), w Braz skladzie zmiana wlascicieli utrudnia porownanie; wplyw destrukcyjny NIE stwierdzony. (2) w PRZED/PO gracz jest martwy po t70 — pomiar gracza bez wartosci. (3) units.json ma tylko 3 nazwane epoki (Kamien/Braz/Zelazo); epoki numeryczne 4-5 wystepuja tylko w tescie matematycznym (256/1024, bez obciecia jak przed fala 875).
- Zmiana pinow testowych (kazda opisana w tescie z powolaniem na decyzje 2026-11-19): unit-upkeep E3/E4/E8 zywnosc 4/8/16 -> 4/16/64; econ-era E4 -> 256/1024; food-to-tax kurs 1 -> 0,2; econ-era E1 mnoznik utrzymania -> jednostkiZywnoscMnoznikNaEpoke=4.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora po Final Control (bez deployu tej rundy)
DEPLOY/PUSH: NIE WYKONANO
