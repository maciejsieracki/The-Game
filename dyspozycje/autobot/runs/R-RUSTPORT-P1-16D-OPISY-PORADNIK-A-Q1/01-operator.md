STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-PORADNIK-A-Q1
GOAL: Przegląd treści głównej Poradnika 00,01,02,04,05,08,09,10 pod kątem rozjazdu z kodem/danymi na pinie edb8fb56; status per twierdzenie.
ZMIANY/COMMIT: nowy plik dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-A.md (allowlista, runda 2: poprawki dowodów i statusów); ten plik 01-operator.md (runda 2, obrona). Brak commitów, brak push/deploy.
TESTY: weryfikacja przez git show edb8fb56:<ścieżka> oraz odczyt gra/data/*.json i gra/src/**/*.ts na pinie. Runda 2 dodatkowo odczytała bezpośrednio: tartak (terrain-improvements), magazyn i glod_wojska (econ-params), Rola (linia) (units.json, 6 wartości), tech.json (Brązownictwo, Hutnictwo żelaza), ui-params map_size, generator.ts ROZMIAR_MENU_LABELS (6 pozycji, Super Huge l.787), miasto-params zasieg_okolicy_miasta=10, e-start-params skala_mapy.Standardowy (hex 168×120), buildings.json Akademia (cegla 70), difficulty-cost.ts (FALA2 l.96–98, mnożniki l.70–71), veteran.ts. Wynik: 99 pozycji; statusy po rundzie 2 w pliku docelowym (zmienione: 02.11, 05.8, 08.7, 09.3, 09.7, 10.2, 10.11; dowody poprawione: 00.4, 01.5, 01.14, 08.9, 08.10).
BLOKADY: brak. Nierozstrzygnięte pozycje mają powód w pliku docelowym; przy wierszach bez przeszukania powód opisuje, czego nie sprawdzono.
RUNDY: 2/5

OBRONA (odpowiedź na zarzuty Evaluatora rundy 1, każdy osobno):

OBRONA: 1 -> PRZYJMUJE. Rozjazd zakresu: 00.4–00.6 (ch00 l.225–226), 02.4–02.7 (ch02 l.68–69), 09.9 (ch09 l.170), 10.12–10.13 (ch10 l.173–174) pochodzą z bloków „Przykład liczbowy", które dispatch wyłączał. Zostały ocenione, bo rozjeżdżają się z danymi, ale pokrywa je też BOILERPLATE. Dodano jawną sekcję „Zakres dodatkowy" w pliku docelowym z numerami wierszy i zakresem bloków.

OBRONA: 2 -> PRZYJMUJE. 05.8 zmieniony na NADAL ISTNIEJE, źródło poprawione na ch08 §53.6 blok przykładu l.383 (nie ch05). Dowód: `terrain-improvements.json` `tartak` ma `bonus {praca: 3, handel: 3}`, stawka drewna po skali ×5 = 50/turę (uwaga `surowiecOdblokowany_uwaga`). Poradnik „+6 drewna/t" nie zgadza się z danymi. Zdanie „+3 drewno/pole" nie występuje w ch05 (grep `53.6` w ch05: 0 trafień).

OBRONA: 3 -> PRZYJMUJE. 10.2 zmieniony na NADAL ISTNIEJE. `units.json` `Rola (linia)`: Wręcz 45, Flanka 13, Dystans 11, Oblężnicza 4, Wsparcie 1, Morska 1 (6 wartości). Poradnik ch10 nie wymienia „Morska" w pięciu rolach.

OBRONA: 4 -> PRZYJMUJE. 08.9 uzupełniony: `econ-params.json` `magazyn_bonus_surowce_na_budynek = 500` (szt/typ, PAŃSTWO, za każdy Magazyn w imperium), poradnik l.314 podaje +100. Rozjazd dwukrotny (baza 500 vs 50000 i +100 vs +500). `magazyn_centralny_bonus_zywnosc_na_budynek = 100` dotyczy żywności — tak jak zapisał operator.

OBRONA: 5 -> PRZYJMUJE. 08.7 zmieniony na NAPRAWIONY z notką. `econ-params.json` `glod_wojska_hp_frac` normal = 0,08 (−8% maxHP/tura), zgodne z poradnikiem. Notka: poradnik l.143 pomija karencję 3 tur (`glod_wojska_karencja_tur`) oraz mnożnik ×0,75 parametrów bojowych (`glod_wojska_stat_mult`).

OBRONA: 6 -> PRZYJMUJE częściowo. Każdy NIEROZSTRZYGNIĘTY ma teraz konkretny powód. Dla 08.13 i 02.12 przeszukano dane i kod: 08.13 — `trade-routes.ts:1646` (`TRADE_ROUTE_BUILDING_BONUS_RATE = 0.05`), `trade-routes.ts:1732` („mnożnik Handlu +5%/trasa") — kod mówi o mnożniku Handlu, poradnik o Danina netto; rozstrzygnięcie wymaga lektury `trade-routes.ts` ok. l.1640–1760 (NIEROZSTRZYGNIĘTY z opisem, nie „nie zweryfikowano"). 02.12 — `society-params.json` `kultura_konwersja_*` (l.416, 579) istnieje, wartości 30%/−2/−1 nie odczytano (powód podany). 08.13 i 02.12 pozostają NIEROZSTRZYGNIĘTY z jawnym powodem. 04.8 — przeszukano `gra/data/*.json` i `ai.ts`, brak promienia 1. 10.11 zmieniony na NAPRAWIONY (pancerz) z notką o kumulacji. Pozostałe wiersze (np. 01.17, 02.14, 02.15, 04.9, 05.9, 10.14) nadal nie mają przeszukania; ich powód mówi wprost, czego nie sprawdzono. To jest świadoma luka, nie ukryty rozjazd.

OBRONA: 7 -> PRZYJMUJE. 09.7 zmieniony na NAPRAWIONY. `tech.json`: Brązownictwo `Epoka = Kamień`, `Poziom 3`, Uwagi „kończy Epokę 1"; Hutnictwo żelaza `Epoka = Brąz`, `Poziom 6`, Uwagi „kończy Epokę 2 / otwiera Epokę 3". Zgodne z poradnikiem. Kolumna Epoka + Uwagi wystarcza do rozstrzygnięcia.

OBRONA: 8 -> PRZYJMUJE. 02.11 zmieniony na NADAL ISTNIEJE. Wyszukiwanie `1[.,]15` w `gra/data` — puste. W `gra/src/game` jedyne `1.15` to niezwiązane parametry (`ai-cs-absorption.ts:151`, `auto-battle-params.ts:40`). Model kosztów: `difficulty-cost.ts` l.11–13, 62–71 — Trudny: gracz koszt ×2, AI ×1. Poradnik opisuje efekt (AI +15% produkcji), którego w danych i kodzie nie ma.

OBRONA: 9 -> PRZYJMUJE (dowód poprawiony, status bez zmian). Błędne twierdzenie „brakuje Super Huge" w `ui-params` i `generator.ts` usunięte. Na pinie: `ui-params.json` `map_size.opts` l.108 zawiera „Super Huge"; `generator.ts` `ROZMIAR_MENU_LABELS` l.787 zawiera „Super Huge" (6. pozycja). Brak Super Huge jest tylko w poradniku `01-pierwsze-kroki` l.92 (5 rozmiarów). Status NADAL ISTNIEJE.

OBRONA: 10 -> PRZYJMUJE (dowód uzupełniony, status bez zmian). `miasto-params.json` `zasieg_okolicy_miasta = 10` („promien okolicy = 10 (bylo 5)"), `zasieg_okolicy_baza = 5` (minimum przy pop 1–4), `zasieg_okolicy_max = 15`. Poradnik l.140 podaje promień 3 — rozjazd z każdą wartością danych.

OBRONA: 11 -> PRZYJMUJE (dowód uzupełniony). `e-start-params.json` `skala_mapy.Standardowy`: `hex_w 168, hex_h 120` (rywale 6). Dodano też rozjazd wewnętrzny danych UI: `ui-params.json` opis Malenki „~1000 hex (38×26)" (l.111) vs e-start Malenki 76×52. Status NADAL ISTNIEJE.

OBRONA: 12 -> PRZYJMUJE częściowo. Dodano wartość z pliku: `buildings.json` Akademia `koszt_surowce {drewno 40, cegla 70}` (poradnik: 14 cegły). Mnożnik ×5 (R-EKONOMIA-SUROWCE-SKALA-5X) ODRZUCAM jako dowód dla budynków: w `buildings.json` nie ma wpisu SKALA-5X (0 trafień), więc nie mogę potwierdzić, że 70 jest po skali ×5. Zapisano to wprost w 08.10. Status NADAL ISTNIEJE (rozjazd z poradnikiem zachowany).

OBRONA: 13 -> PRZYJMUJE. Twierdzenie „przykład dotyczy innej epoki" usunięte, bo przykład nie podaje epoki. 09.3 zostaje NAPRAWIONY z doprecyzowaniem: wynik 96 zgadza się z kodem dla epoki Kamień, bo FALA2 ×2 (`difficulty-cost.ts` l.96–98) dotyczy tylko Brązu i Żelaza. Dla tych epok kod da wynik ×2 wyższy; przykład należy uzupełnić o epokę (zalecenie dla autora poradnika).

NASTĘPNY KROK: Evaluator (Haiku 5.5 medium), runda 2 — sprawdzenie poprawionych wierszy: 02.11, 05.8, 08.7, 08.9, 08.10, 09.3, 09.7, 10.2, 10.11 oraz wierszy NIEROZSTRZYGNIĘTY 08.13 i 02.12 (czy powód jest konkretny).
DEPLOY/PUSH: NIE WYKONANO
