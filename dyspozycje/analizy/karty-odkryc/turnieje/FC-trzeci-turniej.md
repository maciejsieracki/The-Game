# Final Control r1 — trzeci, niezależny turniej

Zakres (DODATEK 1 pkt 4): odkrycia ze sporem po Obronie (Prawo — ziarnistość Z2; Łowiectwo, Mistycyzm, Religia, Matematyka, Inżynieria, Oblężnictwo, Obróbka żelaza — Top1 zmieniony w Obronie, Z3; Koło — nowy kandydat Z4) oraz próbka 6 odkryć zgodnych (Waluta/Mennica, Wymiana, Brązownictwo, Żegluga, Wojskowość, Budownictwo).

Metoda: te same kandydatury i dowody (`narzedzia/techdata.py`), WŁASNE oceny FC 0–5 (`narzedzia/fc_final.py`, z uzasadnieniem każdej oceny), te same wagi 3/3/2/2/2/1, pojedynki każdy z każdym, reguły R-K1 i E1 (§1.3 analizy). Wynik FC jest FINALNY i trafia do CSV (kolumna `Status_TOP5`). Pozostałe 16 odkryć: FINALNE bez trzeciego turnieju (zgodność Operator/Evaluator ≥ 3/5).

## Macierz zgodności Obrona → FC (TOP 5)

| Odkrycie | Top5 Obrony (ID) | Top5 FC (ID) | Zgodność zbioru | Zgodność pozycji | Werdykt |
|---|---|---|---|---|---|
| Łowiectwo | a > b | a > b | 2/2 | 2/2 | zgodny |
| Mistycyzm | b > c > a > d | b > c > a > d | 4/4 | 4/4 | zgodny |
| Wymiana | a > c > d > g > b | a > c > d > g > b | 5/5 | 5/5 | zgodny |
| Koło | a > c > e > b > d | a > c > e > b > d | 5/5 | 5/5 | zgodny |
| Brązownictwo | a > c > b > d > f | a > c > b > d > f | 5/5 | 5/5 | zgodny |
| Żegluga | a > d > f > c > e | a > d > f > c > e | 5/5 | 5/5 | zgodny |
| Religia | a > c > d > b | a > c > d > b | 4/4 | 4/4 | zgodny |
| Wojskowość | a > b > d > e > f | a > b > d > e > f | 5/5 | 5/5 | zgodny |
| Matematyka | b > a | b > a | 2/2 | 2/2 | zgodny; Top1 → Q7 |
| Budownictwo | b > a > f > e > g | b > a > f > e > g | 5/5 | 5/5 | zgodny |
| Waluta | a > b > d > e > c | a > b > d > e > c | 5/5 | 5/5 | zgodny |
| Inżynieria | a > d > b > c > e | a > d > b > c > e | 5/5 | 5/5 | zgodny |
| Oblężnictwo | b > a > d > c | a > b > d > c | 4/4 | 2/4 | FC zmienia kolejność |
| Prawo | a > d > b > c > e | a > d > b > c > e | 5/5 | 5/5 | zgodny |
| Obróbka żelaza | d > e > c > a > b | d > e > c > a > b | 5/5 | 5/5 | zgodny; Top1 → Q7 |

Razem: zgodność zbioru 66/66; identyczna kolejność w 14/15 odkryciach.

## Łowiectwo

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Obóz łowiecki: +1 żywności, +1 Pracy, +1 pieniądza, +2 handlu | 2 | 3 | 4 | 3 | 2 | 4 | 37 | Wymaga Tartaku na tym samym polu (Obróbka drewna) — ODCZUWALNOŚĆ 2. |
| b | Otwiera Łucznictwo (Łucznik) | 3 | 0 | 4 | 2 | 1 | 4 | 27 | Droga badań — R-K1 obniża N i O. (R-K1: N=0, O≤1) |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 37:27.

Ranking FC: a(1W/37) > b(0W/27)

FINALNE TOP 5 (po E1): a > b

## Mistycyzm

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Kamienne kręgi: +1 Kultury i +1 zadowolenia (na poziom) | 2 | 2 | 3 | 2 | 4 | 5 | 35 | Płaskie +1 Kultury, +1 zadowolenia. |
| b | Kamienne kręgi: szerzą religię +2% na turę | 2 | 3 | 3 | 2 | 3 | 4 | 35 | Konwersja religijna +2%/turę (society-params.json:588) — mechanika religii. |
| c | Cud Wyrocznia: +3 Kultury, +3 Zaufania, +2 Wpływu | 3 | 4 | 5 | 4 | 1 | 3 | 44 | Cud-wyścig maxNaSwiecie=1 — dostanie go 1 z 15 cywilizacji; E1 wyklucza z Top1. |
| d | Otwiera Religię (Świątynia) | 2 | 0 | 4 | 3 | 1 | 4 | 26 | Droga badań — R-K1. (R-K1: N=0, O≤1) |

- a vs b → **b** — remis 35:35, rozstrzyga NOWA MECHANIKA (3 vs 2).
- a vs c → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 44:35.
- a vs d → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 35:26.
- b vs c → **c** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 44:35.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 35:26.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 44:26.

Ranking FC: c(3W/44) > b(2W/35) > a(1W/35) > d(0W/26)

FINALNE TOP 5 (po E1): b > c > a > d

## Wymiana

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Otwiera handel: bez Wymiany żadnych tras handlowych | 5 | 5 | 5 | 5 | 4 | 4 | 62 | Bramka handlu: TRADE_TECH = Wymiana (trade-routes.ts:1086-1093). |
| b | Targowisko: +5 pieniądza (+3 na poziom, maks. 3) | 3 | 1 | 2 | 2 | 4 | 5 | 33 | Płaskie przyrosty. |
| c | Targowisko: +50% dochodu z tras handlowych miasta | 4 | 3 | 4 | 2 | 3 | 5 | 44 | +50% dochodu z tras (econ-params.json:278). |
| d | Targowisko: +1 trasa handlowa i premia 5% trasy | 3 | 3 | 3 | 2 | 3 | 4 | 38 | +1 trasa. |
| e | Targowisko: +2 zdrowia miasta | 1 | 1 | 2 | 2 | 4 | 5 | 27 | +2 zdrowia. |
| f | Targowisko jest warunkiem Mennicy i Emporionu | 2 | 2 | 4 | 2 | 1 | 3 | 29 | Warunek budynków. |
| g | Cud narodowy: Pałac Weiyang (Chiny, z Murarstwem) | 3 | 3 | 4 | 1 | 2 | 3 | 35 | Cud narodowy Chin. |
| h | Otwiera Pismo i Matematykę | 3 | 0 | 4 | 5 | 1 | 3 | 32 | Droga badań — R-K1. (R-K1: N=0, O≤1) |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 62:33.
- a vs c → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 62:44.
- a vs d → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 62:38.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 62:27.
- a vs f → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 62:29.
- a vs g → **a** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 62:35.
- a vs h → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 62:32.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 44:33.
- b vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:33.
- b vs e → **b** — przewaga w kryterium SKALA (3 vs 1), suma ważona 33:27.
- b vs f → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 33:29.
- b vs g → **g** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 35:33.
- b vs h → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 33:32.
- c vs d → **c** — przewaga w kryterium SKALA (4 vs 3), suma ważona 44:38.
- c vs e → **c** — przewaga w kryterium SKALA (4 vs 1), suma ważona 44:27.
- c vs f → **c** — przewaga w kryterium SKALA (4 vs 2), suma ważona 44:29.
- c vs g → **c** — przewaga w kryterium SKALA (4 vs 3), suma ważona 44:35.
- c vs h → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 44:32.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:27.
- d vs f → **d** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 38:29.
- d vs g → **d** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 2), suma ważona 38:35.
- d vs h → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 38:32.
- e vs f → **f** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 2), suma ważona 29:27.
- e vs g → **g** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 35:27.
- e vs h → **h** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 32:27.
- f vs g → **g** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 35:29.
- f vs h → **h** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 32:29.
- g vs h → **g** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 35:32.

Ranking FC: a(7W/62) > c(6W/44) > d(5W/38) > g(4W/35) > b(3W/33) > h(2W/32) > f(1W/29) > e(0W/27)

FINALNE TOP 5 (po E1): a > c > d > g > b

## Koło

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Droga: ruch po niej 3× szybszy | 5 | 5 | 4 | 4 | 4 | 5 | 59 | Ruch po drodze ×3 (road-movement.ts:14). |
| b | Droga: +2 handlu na polu | 2 | 1 | 3 | 3 | 4 | 5 | 34 | +2 handlu na polu drogi. |
| c | Rydwan (woły): Atak 12, 400 HP, bez Koszar | 4 | 4 | 4 | 1 | 4 | 4 | 46 | Rydwan (woły) 400 HP bez Koszar (epoka Kamienia). |
| d | Z Brązownictwem otwiera Jeździectwo (Konnica) | 3 | 0 | 4 | 4 | 1 | 3 | 30 | Droga badań — R-K1. (R-K1: N=0, O≤1) |
| e | Wódz epoki Kamienia to Rydwan (woły): 400 HP zamiast 60 | 3 | 2 | 4 | 3 | 3 | 4 | 39 | Wódz-Rydwan (generals.ts:71-73, main.ts:7304-7305) — tylko w epoce Kamienia; zamiana modelu istniejącej mechaniki wodza, N=2. |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 59:34.
- a vs c → **a** — przewaga w kryterium ZASIĘG (4 vs 1), suma ważona 59:46.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 59:30.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 59:39.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 46:34.
- b vs d → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 34:30.
- b vs e → **e** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 39:34.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 46:30.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 46:39.
- d vs e → **e** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 39:30.

Ranking FC: a(4W/59) > c(3W/46) > e(2W/39) > b(1W/34) > d(0W/30)

FINALNE TOP 5 (po E1): a > c > e > b > d

## Brązownictwo

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Awans do epoki Brązu: nowe budynki i wyższe ich poziomy | 5 | 5 | 5 | 5 | 4 | 3 | 61 | Awans epoki. |
| b | Limit wodzów rośnie z 1 do 2 | 4 | 3 | 5 | 5 | 4 | 5 | 54 | Limit wodzów 1→2 (generals.ts:2-4). |
| c | Odlewnia brązu: wytwarza brąz (ruda + drewno + cyna) | 4 | 5 | 5 | 5 | 2 | 3 | 54 | Odlewnia brązu — jedyne źródło brązu. |
| d | Kopalnia miedzi: +20 rudy na turę, +5 handlu | 3 | 4 | 5 | 5 | 3 | 4 | 51 | Kopalnia miedzi +20/turę. |
| e | Kopalnia cyny: +20 rudy cyny na turę | 2 | 3 | 5 | 5 | 3 | 4 | 45 | Kopalnia cyny. |
| f | Kuźnia brązu: +15% Pancerza jednostek w mieście | 4 | 4 | 4 | 3 | 3 | 5 | 49 | Kuźnia +15% Pancerza. |
| g | 20 jednostek z brązu, np. Włócznik 160 HP | 4 | 3 | 4 | 2 | 1 | 4 | 39 | Jednostki z brązu — wymagają Koszar (Wojskowość). |
| h | Wieża oblężnicza i Taran okuty | 2 | 2 | 3 | 1 | 1 | 3 | 25 | Machiny oblężnicze Brązu. |
| i | Otwiera Wojskowość, Hutnictwo żelaza, Jeździectwo | 3 | 0 | 5 | 5 | 1 | 3 | 34 | Droga badań — R-K1. (R-K1: N=0, O≤1) |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 61:54.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 61:54.
- a vs d → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 61:51.
- a vs e → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 61:45.
- a vs f → **a** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 61:49.
- a vs g → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 61:39.
- a vs h → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 61:25.
- a vs i → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 61:34.
- b vs c → **c** — remis 54:54, rozstrzyga NOWA MECHANIKA (5 vs 3).
- b vs d → **b** — przewaga w kryterium SKALA (4 vs 3), suma ważona 54:51.
- b vs e → **b** — przewaga w kryterium SKALA (4 vs 2), suma ważona 54:45.
- b vs f → **b** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 54:49.
- b vs g → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 54:39.
- b vs h → **b** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 54:25.
- b vs i → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 54:34.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 4), suma ważona 54:51.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 54:45.
- c vs f → **c** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 54:49.
- c vs g → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 54:39.
- c vs h → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 54:25.
- c vs i → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 54:34.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 51:45.
- d vs f → **d** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 51:49.
- d vs g → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 51:39.
- d vs h → **d** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 51:25.
- d vs i → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 51:34.
- e vs f → **f** — przewaga w kryterium SKALA (4 vs 2), suma ważona 49:45.
- e vs g → **e** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 45:39.
- e vs h → **e** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 45:25.
- e vs i → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 45:34.
- f vs g → **f** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 49:39.
- f vs h → **f** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 49:25.
- f vs i → **f** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 49:34.
- g vs h → **g** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:25.
- g vs i → **g** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 39:34.
- h vs i → **i** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 34:25.

Ranking FC: a(8W/61) > c(7W/54) > b(6W/54) > d(5W/51) > f(4W/49) > e(3W/45) > g(2W/39) > i(1W/34) > h(0W/25)

FINALNE TOP 5 (po E1): a > c > b > d > f

## Żegluga

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Wojsko lądowe może wchodzić na wodę (zaokrętowanie) | 5 | 5 | 5 | 5 | 5 | 4 | 64 | Zaokrętowanie (embarkation.ts:25). |
| b | Port handlowy: +5 pieniądza i +1 Pracy | 3 | 1 | 3 | 2 | 4 | 5 | 35 | Płaskie przyrosty. |
| c | Port: +1 trasa handlowa miasta | 3 | 3 | 3 | 2 | 3 | 4 | 38 | +1 trasa. |
| d | Łodzie rybackie: +2 żywności, +3 Pracy, +3 handlu | 3 | 4 | 5 | 3 | 4 | 5 | 50 | Łodzie rybackie. |
| e | Galera: okręt wojenny (miasto nad wodą + Koszary) | 3 | 4 | 5 | 1 | 1 | 3 | 38 | Galera — wymaga Koszar. |
| f | Cud Kamień Ha'amonga: +15% dochodu z tras morskich | 3 | 3 | 5 | 4 | 1 | 3 | 41 | Cud-wyścig. |
| g | Z Pismem otwiera Handel (Emporion, Magazyn) | 3 | 0 | 4 | 5 | 1 | 3 | 32 | Droga badań — R-K1. (R-K1: N=0, O≤1) |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 64:35.
- a vs c → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 64:38.
- a vs d → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 64:50.
- a vs e → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 1), suma ważona 64:38.
- a vs f → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 1), suma ważona 64:41.
- a vs g → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 64:32.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:35.
- b vs d → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 50:35.
- b vs e → **e** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 38:35.
- b vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 41:35.
- b vs g → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 35:32.
- c vs d → **d** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 3), suma ważona 50:38.
- c vs e → **c** — remis 38:38, rozstrzyga ZASIĘG (2 vs 1).
- c vs f → **f** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 41:38.
- c vs g → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 38:32.
- d vs e → **d** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 50:38.
- d vs f → **d** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 50:41.
- d vs g → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 50:32.
- e vs f → **f** — przewaga w kryterium ZASIĘG (4 vs 1), suma ważona 41:38.
- e vs g → **e** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 38:32.
- f vs g → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 41:32.

Ranking FC: a(6W/64) > d(5W/50) > f(4W/41) > c(3W/38) > e(2W/38) > b(1W/35) > g(0W/32)

FINALNE TOP 5 (po E1): a > d > f > c > e

## Religia

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Świątynia: szerzy religię +4% na turę | 3 | 3 | 4 | 2 | 3 | 4 | 40 | Świątynia +4%/turę konwersji (society-params.json:581). |
| b | Świątynia: +2 Kultury i +2 zadowolenia | 2 | 1 | 2 | 2 | 4 | 5 | 30 | Płaskie przyrosty. |
| c | Cud narodowy: Stupa w Sanchi (Harappa) | 3 | 3 | 4 | 1 | 2 | 3 | 35 | Cud narodowy jednej cywilizacji — ZASIĘG 1. |
| d | Otwiera Kodeks, Filozofię, Astronomię | 3 | 0 | 5 | 5 | 1 | 3 | 34 | Droga badań — R-K1. (R-K1: N=0, O≤1) |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 40:30.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 2), suma ważona 40:35.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 40:34.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 35:30.
- b vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 34:30.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 35:34.

Ranking FC: a(3W/40) > c(2W/35) > d(1W/34) > b(0W/30)

FINALNE TOP 5 (po E1): a > c > d > b

## Wojskowość

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Koszary: rekrutacja wojska epoki Brązu i Żelaza | 5 | 5 | 5 | 3 | 4 | 5 | 59 | Bramka Koszar dla epoki ≥ 2 (production.ts:1075-1076). |
| b | Koszary: +20% parametrów bojowych jednostek | 4 | 4 | 4 | 3 | 3 | 5 | 49 | +20% parametrów. |
| c | Koszary: +2 Pracy | 1 | 1 | 1 | 2 | 4 | 5 | 25 | +2 Pracy. |
| d | Fort: +100% Obrony obozujących i strefa 5 pól | 4 | 4 | 4 | 3 | 3 | 4 | 48 | Fort terenowy. |
| e | Cuda: Terakotowa armia, Yerkapı, Brama narodów | 3 | 3 | 4 | 2 | 2 | 3 | 37 | Cuda. |
| f | Otwiera Oblężnictwo (Katapulta) | 3 | 0 | 5 | 4 | 1 | 3 | 32 | Droga badań — R-K1. (R-K1: N=0, O≤1) |
| g | Koszary są warunkiem Warsztatu i Akademii wojskowej | 2 | 2 | 4 | 2 | 1 | 3 | 29 | Warunek budynków. |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 4), suma ważona 59:49.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 59:25.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 4), suma ważona 59:48.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 59:37.
- a vs f → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 59:32.
- a vs g → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 59:29.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 49:25.
- b vs d → **b** — przewaga w kryterium CZYTELNOŚĆ (5 vs 4), suma ważona 49:48.
- b vs e → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 49:37.
- b vs f → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 49:32.
- b vs g → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 49:29.
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 48:25.
- c vs e → **e** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 1), suma ważona 37:25.
- c vs f → **f** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 1), suma ważona 32:25.
- c vs g → **g** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 1), suma ważona 29:25.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 48:37.
- d vs f → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 48:32.
- d vs g → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 48:29.
- e vs f → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 37:32.
- e vs g → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 37:29.
- f vs g → **f** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 32:29.

Ranking FC: a(6W/59) > b(5W/49) > d(4W/48) > e(3W/37) > f(2W/32) > g(1W/29) > c(0W/25)

FINALNE TOP 5 (po E1): a > b > d > e > f

## Matematyka

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Otwiera Budownictwo, Walutę, Astronomię, Oblężnictwo | 4 | 0 | 5 | 5 | 1 | 3 | 37 | Droga badań do Murów, Mennicy, Katapult — R-K1. (R-K1: N=0, O≤1) |
| b | Cuda narodowe: Ziggurat (+15% Nauki), Mundo Perdido | 4 | 3 | 4 | 1 | 2 | 3 | 38 | Cuda narodowe 2 z 15 cywilizacji (Sumer, Majowie) — ZASIĘG 1. |

- a vs b → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 38:37.

Ranking FC: b(1W/38) > a(0W/37) · E1: brak kandydata spełniającego E1 (Q7)

FINALNE TOP 5 (po E1): b > a

## Budownictwo

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Mury: +200% Obrony obrońców miasta | 5 | 3 | 4 | 2 | 3 | 5 | 47 | Mury +200% (miasto-params.json:79). |
| b | Akwedukt: limit ludności miasta do 20 | 5 | 3 | 5 | 2 | 3 | 5 | 49 | Akwedukt: limit 20 (economy.ts:1049-1053). |
| c | Akwedukt: +4 zdrowia | 2 | 1 | 3 | 2 | 3 | 5 | 30 | +4 zdrowia. |
| d | Akwedukt: +2 zadowolenia (+1 na poziom) | 2 | 1 | 2 | 2 | 3 | 5 | 28 | +2 zadowolenia. |
| e | Mury są warunkiem Cytadeli i Baszty | 3 | 2 | 5 | 2 | 1 | 3 | 34 | Warunek Cytadeli i Baszty. |
| f | Cud narodowy: Dur-Sharrukin (Asyria) | 3 | 3 | 4 | 1 | 2 | 3 | 35 | Cud narodowy Asyrii. |
| g | Otwiera Inżynierię i Drogi brukowane | 3 | 0 | 5 | 4 | 1 | 3 | 32 | Droga badań — R-K1. (R-K1: N=0, O≤1) |

- a vs b → **b** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 4), suma ważona 49:47.
- a vs c → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 47:30.
- a vs d → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 47:28.
- a vs e → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 47:34.
- a vs f → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 47:35.
- a vs g → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 47:32.
- b vs c → **b** — przewaga w kryterium SKALA (5 vs 2), suma ważona 49:30.
- b vs d → **b** — przewaga w kryterium SKALA (5 vs 2), suma ważona 49:28.
- b vs e → **b** — przewaga w kryterium SKALA (5 vs 3), suma ważona 49:34.
- b vs f → **b** — przewaga w kryterium SKALA (5 vs 3), suma ważona 49:35.
- b vs g → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 49:32.
- c vs d → **c** — przewaga w kryterium BRAK ZASTĘPNIKA (3 vs 2), suma ważona 30:28.
- c vs e → **e** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 3), suma ważona 34:30.
- c vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 35:30.
- c vs g → **g** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 32:30.
- d vs e → **e** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 34:28.
- d vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 35:28.
- d vs g → **g** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 32:28.
- e vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 35:34.
- e vs g → **e** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 34:32.
- f vs g → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 35:32.

Ranking FC: b(6W/49) > a(5W/47) > f(4W/35) > e(3W/34) > g(2W/32) > c(1W/30) > d(0W/28)

FINALNE TOP 5 (po E1): b > a > f > e > g

## Waluta

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Mennica: ×1,5 podatku (handlu) w każdym mieście | 5 | 5 | 5 | 5 | 3 | 5 | 61 | Mennica ×1,50 normal (econ-params.json:585-591) na podatku przed suwakami (economy.ts:952-955), w każdym mieście. |
| b | Kopalnia złota: +10 handlu i +1 złota na turę | 3 | 3 | 5 | 3 | 3 | 4 | 44 | Kopalnia złota +10 handlu i Złoto. |
| c | Mennica: +3 pieniądza (+2 na poziom) | 2 | 1 | 2 | 2 | 3 | 5 | 28 | Płaskie przyrosty. |
| d | Złoto jest warunkiem Mennicy (zużywa 1 złota/turę) | 3 | 2 | 5 | 5 | 2 | 3 | 42 | Warunek Mennicy. |
| e | Złoto w dyplomacji: 50 PN za sztukę | 2 | 2 | 3 | 5 | 2 | 4 | 36 | Złoto w dyplomacji. |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 61:44.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 61:28.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 61:42.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 61:36.
- b vs c → **b** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 44:28.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 44:42.
- b vs e → **b** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 3), suma ważona 44:36.
- c vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 42:28.
- c vs e → **e** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 36:28.
- d vs e → **d** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 3), suma ważona 42:36.

Ranking FC: a(4W/61) > b(3W/44) > d(2W/42) > e(1W/36) > c(0W/28)

FINALNE TOP 5 (po E1): a > b > d > e > c

## Inżynieria

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Cytadela: +100% Obrony ponad Mury (razem +300%) | 4 | 2 | 4 | 2 | 3 | 5 | 41 | Cytadela +100% ponad Mury (miasto-params.json:84, city-defense.ts:67-69). |
| b | Baszta: kolejne +100% Obrony (komplet +400%) | 4 | 2 | 4 | 2 | 3 | 5 | 41 | Baszta +100% (miasto-params.json:89, city-defense.ts:73) — równa Cytadeli; remis → wyżej na liście. |
| c | Port wielki: +10 pieniądza i +1 trasa handlowa | 3 | 1 | 3 | 2 | 3 | 5 | 33 | Rozbudowa istniejącego Portu. |
| d | Cud Brama narodów: +15% dochodu z tras, +10 Wpływu | 4 | 3 | 5 | 4 | 1 | 3 | 44 | Cud-wyścig + wymaga Wojskowości — E1 wyklucza z Top1. |
| e | Z Budownictwem otwiera Drogi brukowane | 3 | 0 | 5 | 4 | 1 | 3 | 32 | Droga badań — R-K1. (R-K1: N=0, O≤1) |

- a vs b → **a** — remis 41:41 we wszystkich kryteriach rozstrzygających — wygrywa kandydat wyżej na liście.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 41:33.
- a vs d → **d** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 44:41.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 41:32.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 41:33.
- b vs d → **d** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 44:41.
- b vs e → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 41:32.
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 44:33.
- c vs e → **c** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 33:32.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 44:32.

Ranking FC: d(4W/44) > a(3W/41) > b(2W/41) > c(1W/33) > e(0W/32)

FINALNE TOP 5 (po E1): a > d > b > c > e

## Oblężnictwo

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Katapulta: ostrzał z 6 pól, 1000 HP | 3 | 3 | 3 | 1 | 2 | 4 | 34 | Katapulta: Atak dystansowy 8, zasięg 6 heksów, wallAttack 16 (units.json:3482-3505) — jedyna jednostka burząca mury zza linii; Taran okuty (Brąz) ma wallAttack 18, ale w zwarciu, stąd B=3. |
| b | Warsztat oblężniczy: +10% parametrów jednostek | 3 | 1 | 3 | 3 | 2 | 5 | 33 | Warsztat: +10% parametrów (unit-building-bonuses.ts:23-33). NOWA MECHANIKA 1, bo badanie Oblężnictwa WYMAGA Koszar (tech.json „wymagany budynek: Koszary”), a Koszary dają już tę samą ścieżkę parametrów (+20%) — Warsztat tylko ją powiększa (z Koszarami razem +30%). |
| c | Warsztat oblężniczy: +4 Pracy, +2 pieniądza | 2 | 1 | 2 | 2 | 3 | 5 | 28 | Płaskie przyrosty. |
| d | Z Obróbką żelaza otwiera Sztukę wojenną | 3 | 0 | 5 | 4 | 1 | 3 | 32 | Droga badań — R-K1. (R-K1: N=0, O≤1) |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 34:33.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 34:28.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 34:32.
- b vs c → **b** — przewaga w kryterium SKALA (3 vs 2), suma ważona 33:28.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (1 vs 0), suma ważona 33:32.
- c vs d → **d** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 32:28.

Ranking FC: a(3W/34) > b(2W/33) > d(1W/32) > c(0W/28)

FINALNE TOP 5 (po E1): a > b > d > c

## Prawo

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Sąd: −30% korupcji w mieście | 4 | 3 | 3 | 2 | 3 | 5 | 42 | Sąd: −30% strat z korupcji (economy.ts:1225-1249), w mieście, gdzie stoi. |
| b | Sąd: +19 pkt Prawa | 3 | 2 | 3 | 2 | 3 | 4 | 35 | 19 pkt Prawa (society-params.json:809) — ten sam mechanizm co Trybunał. |
| c | Sąd: +5 Kultury, +2 pieniądza, +2 zadowolenia | 2 | 1 | 2 | 2 | 3 | 4 | 27 | Płaskie przyrosty jednego budynku. |
| d | Pretorium: −30% korupcji i 38 pkt Prawa w regionie | 4 | 2 | 3 | 1 | 3 | 4 | 36 | Pretorium tylko w mieście regionalnym (lokalizacja region) — ZASIĘG 1. |
| e | Pretorium: +3 pieniądza, +5 Kultury, +2 Pracy | 2 | 1 | 2 | 1 | 3 | 5 | 26 | Płaskie przyrosty, tylko region. |

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 42:35.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:27.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 42:36.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:26.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 35:27.
- b vs d → **d** — przewaga w kryterium SKALA (4 vs 3), suma ważona 36:35.
- b vs e → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 35:26.
- c vs d → **d** — przewaga w kryterium SKALA (4 vs 2), suma ważona 36:27.
- c vs e → **c** — przewaga w kryterium ZASIĘG (2 vs 1), suma ważona 27:26.
- d vs e → **d** — przewaga w kryterium SKALA (4 vs 2), suma ważona 36:26.

Ranking FC: a(4W/42) > d(3W/36) > b(2W/35) > c(1W/27) > e(0W/26)

FINALNE TOP 5 (po E1): a > d > b > c > e

## Obróbka żelaza

| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |
|---|---|---|---|---|---|---|---|---|---|
| a | Wielka odlewnia (stal) — dziś niedostępna (epoka 4) | 0 | 2 | 5 | 2 | 0 | 2 | 22 | Martwe: epokaWejscia=4 (production.ts:966). |
| b | Wielka Kuźnia (Pancerz) — dziś niedostępna (epoka 4) | 0 | 2 | 5 | 2 | 0 | 2 | 22 | Martwe: epokaWejscia=4. |
| c | Jednostki Celtów i Germanów, np. Berserker Atak 10 | 3 | 1 | 3 | 1 | 1 | 3 | 25 | Jednostki 2 z 15 cywilizacji. |
| d | Cud narodowy: Posąg Peruna (Słowianie) | 3 | 3 | 4 | 1 | 2 | 3 | 35 | Cud narodowy Słowian — ZASIĘG 1. |
| e | Z Oblężnictwem otwiera Sztukę wojenną | 3 | 0 | 5 | 4 | 1 | 3 | 32 | Droga badań — R-K1. (R-K1: N=0, O≤1) |

- a vs b → **a** — remis 22:22 we wszystkich kryteriach rozstrzygających — wygrywa kandydat wyżej na liście.
- a vs c → **c** — przewaga w kryterium SKALA (3 vs 0), suma ważona 25:22.
- a vs d → **d** — przewaga w kryterium SKALA (3 vs 0), suma ważona 35:22.
- a vs e → **e** — przewaga w kryterium SKALA (3 vs 0), suma ważona 32:22.
- b vs c → **c** — przewaga w kryterium SKALA (3 vs 0), suma ważona 25:22.
- b vs d → **d** — przewaga w kryterium SKALA (3 vs 0), suma ważona 35:22.
- b vs e → **e** — przewaga w kryterium SKALA (3 vs 0), suma ważona 32:22.
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 35:25.
- c vs e → **e** — przewaga w kryterium ZASIĘG (4 vs 1), suma ważona 32:25.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 35:32.

Ranking FC: d(4W/35) > e(3W/32) > c(2W/25) > a(1W/22) > b(0W/22) · E1: brak kandydata spełniającego E1 (Q7)

FINALNE TOP 5 (po E1): d > e > c > a > b
