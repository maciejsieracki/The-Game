# Wymogi budowy i utrzymania — projekt nowych parametrów (do potwierdzenia)

Praca = koszt budowy (kosztBudowy), Utrz. = utrzymanie na turę (pole `utrzymanie`; **nie zmieniane** żadną z tych reguł). Surowce w polu JSON; faktyczny koszt w grze = JSON × 2 × mnożnik epoki (Kamień ×1, Brąz ×2, Żelazo ×4 → efektywnie ×2 / ×4 / ×8).

## 1. Epoka Kamienia (po przeniesieniu Garncarstwa na poziom 1): budynki z technologii poziomu 2 i 3 — drewno = kamień (ta sama ilość)

| Budynek | Tech (poz.) | Praca | Utrz. | Teraz (drewno/kamień) | NOWE (drewno/kamień) | Nowy kamień? |
|---|---|---|---|---|---|---|
| Warsztat kamieniarski | Murarstwo (2) | 20 | 1 | 30/0 | 30/30 | TAK (nowy wymóg kamienia) |
| Stela / Pomnik | Murarstwo (2) | 15 | 0 | 0/30 | 30/30 | nie (dopisane drewno) |
| Kamienne kręgi | Mistycyzm (2) | 18 | 1 | 0/40 | 40/40 | nie (dopisane drewno) |
| Targowisko (Rynek) | Wymiana (2) | 25 | 1 | 30/0 | 30/30 | TAK (nowy wymóg kamienia) |
| Studnia | Gospodarka wodna (2) | 15 | 1 | 25/0 | 25/25 | TAK (nowy wymóg kamienia) |

Bez zmian (tylko drewno): Stolarnia, Palisada drewniana, Spichlerz, Garncarnia (po przeniesieniu Garncarstwa na poz. 1), Pałac, Dom starszyzny, Garnizon.

## 2. Epoka Brązu — każdy budynek: drewno = kamień = cegła = dzisiejsza ilość kamienia

| Budynek | Tech (poz.) | Praca | Utrz. | Teraz (drewno/kamień/cegła) | NOWE (drewno/kamień/cegła) | Uwaga |
|---|---|---|---|---|---|---|
| Biblioteka | Pismo | 25 | 1 | 30/30/0 | 30/30/30 | po Cegielni |
| Spichlerz II | — | 35 | 2 | 40/50/0 | 50/50/50 | po Cegielni |
| Świątynia | — | 25 | 1 | 30/40/0 | 40/40/40 | po Cegielni |
| Magazyn | Handel | 20 | 1 | 50/30/0 | 30/30/30 | po Cegielni |
| Dwór Zarządcy | Kodeks | 45 | 2 | 30/30/0 | 30/30/30 | po Cegielni |
| Trybunał | Kodeks | 30 | 1 | 30/40/0 | 40/40/40 | po Cegielni |
| Mury | Budownictwo | 35 | 2 | 40/80/0 | 80/80/80 | po Cegielni |
| Akwedukt | Budownictwo | 30 | 2 | 30/60/0 | 60/60/60 | po Cegielni |
| Mennica | Waluta | 28 | 2 | 30/40/0 | 40/40/40 | po Cegielni |
| Kuźnia brązu | Brązownictwo | 30 | 2 | 30/30/0 | 30/30/0 | ZAŁOŻENIE: bez cegły (budynek może stanąć przed Cegielnią; Cegielnia nie może kosztować cegły) — do decyzji |
| Odlewnia brązu | Brązownictwo | 28 | 2 | 30/40/0 | 40/40/0 | ZAŁOŻENIE: bez cegły (budynek może stanąć przed Cegielnią; Cegielnia nie może kosztować cegły) — do decyzji |
| Port handlowy | Żegluga | 30 | 2 | 60/30/0 | 30/30/0 | ZAŁOŻENIE: bez cegły (budynek może stanąć przed Cegielnią; Cegielnia nie może kosztować cegły) — do decyzji |
| Koszary | Wojskowość | 25 | 2 | 40/40/0 | 40/40/0 | ZAŁOŻENIE: bez cegły (budynek może stanąć przed Cegielnią; Cegielnia nie może kosztować cegły) — do decyzji |
| Pałac II | — | 60 | 3 | 50/50/0 | 50/50/0 | ZAŁOŻENIE: bez cegły (budynek może stanąć przed Cegielnią; Cegielnia nie może kosztować cegły) — do decyzji |
| Cegielnia | Garncarstwo | 22 | 1 | 30/30/0 | 30/30/0 | ZAŁOŻENIE: bez cegły (budynek może stanąć przed Cegielnią; Cegielnia nie może kosztować cegły) — do decyzji |

## 3. Epoka Żelaza (epoka 3 i 4) — wszystkie budynki: cegła = kamień = drewno = dzisiejsza ilość cegły

| Budynek | Tech | Praca | Utrz. | Teraz (drewno/kamień/cegła) | NOWE (drewno/kamień/cegła) | Uwaga |
|---|---|---|---|---|---|---|
| Akademia | ep.3 | 70 | 3 | 40/0/70 | 70/70/70 |  |
| Akademia wojskowa | ep.3 | 80 | 4 | 50/0/70 | 70/70/70 |  |
| Baszta | ep.3 | 70 | 3 | 50/100/0 | 100/100/100 | ZAŁOŻENIE: dziś bez cegły — przyjęto cegłę = dzisiejszy kamień (budynek obronny/port) — do decyzji |
| Cytadela | ep.3 | 70 | 3 | 50/100/0 | 100/100/100 | ZAŁOŻENIE: dziś bez cegły — przyjęto cegłę = dzisiejszy kamień (budynek obronny/port) — do decyzji |
| Kuźnia żelaza | ep.3 | 60 | 3 | 40/0/50 | 50/50/50 |  |
| Odlewnia żelaza | ep.3 | 35 | 3 | 40/0/50 | 50/50/50 |  |
| Pałac III | ep.3 | 90 | 5 | 50/0/70 | 70/70/70 |  |
| Port wielki | ep.3 | 55 | 3 | 60/50/0 | 50/50/50 | ZAŁOŻENIE: dziś bez cegły — przyjęto cegłę = dzisiejszy kamień (budynek obronny/port) — do decyzji |
| Pretorium | ep.3 | 75 | 3 | 40/0/50 | 50/50/50 |  |
| Sąd | ep.3 | 55 | 2 | 30/0/50 | 50/50/50 |  |
| Teatr | ep.3 | 55 | 2 | 40/0/50 | 50/50/50 |  |
| Warsztat oblężniczy | ep.3 | 65 | 3 | 50/50/0 | 50/50/50 | ZAŁOŻENIE: dziś bez cegły — przyjęto cegłę = dzisiejszy kamień (budynek obronny/port) — do decyzji |
| Łaźnia publiczna | ep.3 | 50 | 2 | 40/0/60 | 60/60/60 |  |
| Wielka Kuźnia | ep.4 | 90 | 4 | 60/0/80 | 80/80/80 |  |
| Wielka odlewnia | ep.4 | 80 | 4 | 60/0/70 | 70/70/70 |  |

## Uwagi
- Koszty rosną wyraźnie: w Brązie każdy budynek kosztuje 3× więcej surowców niż dziś (drewno + kamień + cegła w ilości dzisiejszego kamienia); w Żelazie podobnie.
- Utrzymanie (Utrz.) i koszt Pracy nie ulegają zmianie — jeśli chcesz zmienić utrzymanie, napisz które budynki.
- Kuźnia/Odlewnia żelaza są epoki 3, ale technologia Hutnictwo żelaza leży w Brązie.
- Budynki przed Cegielnią i Cegielnia — patrz uwagi (brak cegły przed jej istnieniem).
- Następny krok po Twoim potwierdzeniu: jeden temat wdrożeniowy zastępujący dotychczasowe STONE-BRICK-IMPL i GARNCARSTWO-L1 (dane + testy + karty), potem REPIN Rust.
