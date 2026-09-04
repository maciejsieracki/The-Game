# R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1 — tabela prog(pop, epoka)

Wygenerowane z kodu (`szMaxForCity`/`prawMaxForCity` + `gra/data/society-params.json`), nie przepisane recznie.
PRZED = stan na bazie 2bb422aa: prog zalezny WYLACZNIE od epoki (SZMAX_DEFAULTS / PRAWMAX_DEFAULTS).
Formula PO (runda 1, po obronie): `prog = prog_epoki x (1 + wsp) ^ max(0, pop - 2)` — wzrost SKLADANY,
staly procent na mieszkanca; przy tym samym mnozniku koncowym daje najmniejszy mozliwy najwiekszy
skok progu na jednym przyroscie ludnosci. Cap ludnosci w grze to 12 (econ-params.json ->
akwedukt_max_ludnosci), wiec wiersz pop 12 jest realnym szczytem gry.

## easy (wsp. Sz 0.038, wsp. Prawo 0.033, populacja odniesienia 2; mnoznik na pop 12: Sz 1.45x, Prawo 1.38x)

| pop | szMax e1 PRZED→PO | szMax e2 PRZED→PO | szMax e3 PRZED→PO | prawMax e1 PRZED→PO | prawMax e2 PRZED→PO | prawMax e3 PRZED→PO |
|---|---|---|---|---|---|---|
| 1 | 14 → 14 | 20 → 20 | 28 → 28 | 50 → 50 | 75 → 75 | 100 → 100 |
| 2 | 14 → 14 | 20 → 20 | 28 → 28 | 50 → 50 | 75 → 75 | 100 → 100 |
| 3 | 14 → 14.56 | 20 → 20.8 | 28 → 29.12 | 50 → 51.5 | 75 → 77.25 | 100 → 103 |
| 4 | 14 → 15.12 | 20 → 21.6 | 28 → 30.24 | 50 → 53.5 | 75 → 80.25 | 100 → 107 |
| 5 | 14 → 15.68 | 20 → 22.4 | 28 → 31.36 | 50 → 55 | 75 → 82.5 | 100 → 110 |
| 6 | 14 → 16.24 | 20 → 23.2 | 28 → 32.48 | 50 → 57 | 75 → 85.5 | 100 → 114 |
| 8 | 14 → 17.5 | 20 → 25 | 28 → 35 | 50 → 61 | 75 → 91.5 | 100 → 122 |
| 10 | 14 → 18.9 | 20 → 27 | 28 → 37.8 | 50 → 65 | 75 → 97.5 | 100 → 130 |
| 12 | 14 → 20.3 | 20 → 29 | 28 → 40.6 | 50 → 69 | 75 → 103.5 | 100 → 138 |

## normal (wsp. Sz 0.048, wsp. Prawo 0.041, populacja odniesienia 2; mnoznik na pop 12: Sz 1.60x, Prawo 1.49x)

| pop | szMax e1 PRZED→PO | szMax e2 PRZED→PO | szMax e3 PRZED→PO | prawMax e1 PRZED→PO | prawMax e2 PRZED→PO | prawMax e3 PRZED→PO |
|---|---|---|---|---|---|---|
| 1 | 14 → 14 | 20 → 20 | 28 → 28 | 50 → 50 | 75 → 75 | 100 → 100 |
| 2 | 14 → 14 | 20 → 20 | 28 → 28 | 50 → 50 | 75 → 75 | 100 → 100 |
| 3 | 14 → 14.7 | 20 → 21 | 28 → 29.4 | 50 → 52 | 75 → 78 | 100 → 104 |
| 4 | 14 → 15.4 | 20 → 22 | 28 → 30.8 | 50 → 54 | 75 → 81 | 100 → 108 |
| 5 | 14 → 16.1 | 20 → 23 | 28 → 32.2 | 50 → 56.5 | 75 → 84.75 | 100 → 113 |
| 6 | 14 → 16.94 | 20 → 24.2 | 28 → 33.88 | 50 → 58.5 | 75 → 87.75 | 100 → 117 |
| 8 | 14 → 18.48 | 20 → 26.4 | 28 → 36.96 | 50 → 63.5 | 75 → 95.25 | 100 → 127 |
| 10 | 14 → 20.44 | 20 → 29.2 | 28 → 40.88 | 50 → 69 | 75 → 103.5 | 100 → 138 |
| 12 | 14 → 22.4 | 20 → 32 | 28 → 44.8 | 50 → 74.5 | 75 → 111.75 | 100 → 149 |

## hard (wsp. Sz 0.058, wsp. Prawo 0.049, populacja odniesienia 2; mnoznik na pop 12: Sz 1.76x, Prawo 1.61x)

| pop | szMax e1 PRZED→PO | szMax e2 PRZED→PO | szMax e3 PRZED→PO | prawMax e1 PRZED→PO | prawMax e2 PRZED→PO | prawMax e3 PRZED→PO |
|---|---|---|---|---|---|---|
| 1 | 14 → 14 | 20 → 20 | 28 → 28 | 50 → 50 | 75 → 75 | 100 → 100 |
| 2 | 14 → 14 | 20 → 20 | 28 → 28 | 50 → 50 | 75 → 75 | 100 → 100 |
| 3 | 14 → 14.84 | 20 → 21.2 | 28 → 29.68 | 50 → 52.5 | 75 → 78.75 | 100 → 105 |
| 4 | 14 → 15.68 | 20 → 22.4 | 28 → 31.36 | 50 → 55 | 75 → 82.5 | 100 → 110 |
| 5 | 14 → 16.52 | 20 → 23.6 | 28 → 33.04 | 50 → 57.5 | 75 → 86.25 | 100 → 115 |
| 6 | 14 → 17.5 | 20 → 25 | 28 → 35 | 50 → 60.5 | 75 → 90.75 | 100 → 121 |
| 8 | 14 → 19.6 | 20 → 28 | 28 → 39.2 | 50 → 66.5 | 75 → 99.75 | 100 → 133 |
| 10 | 14 → 21.98 | 20 → 31.4 | 28 → 43.96 | 50 → 73.5 | 75 → 110.25 | 100 → 147 |
| 12 | 14 → 24.64 | 20 → 35.2 | 28 → 49.28 | 50 → 80.5 | 75 → 120.75 | 100 → 161 |
