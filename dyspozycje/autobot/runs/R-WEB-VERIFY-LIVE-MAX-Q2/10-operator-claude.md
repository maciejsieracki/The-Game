STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-VERIFY-LIVE-MAX-Q2
GOAL: domknąć pozycje 1–2 (limit wojen z graczem, limit 2 sojuszy AI↔AI, porównanie poziomów dyplomacji) na poziomie maksymalnym.
ZMIANY/COMMIT: tylko dane i dokument: dane/seed7-r3 (dokończony do t150), dane/analiza-limitow-q2.seed7-r3.wynik.txt, dane/analiza-sojuszy-t100-porownanie-r3.wynik.txt, dyspozycje/analizy/VERIFY-LIVE-MAX-Q2-2026-11-27.md (sekcja RUNDA 3), ten raport. gra/src: brak zmian. Baza 116a8e5faadd5280239cc8d70c8595667162b766.
TESTY: seed 4242 t2–150 i seed 7 t2–150 (po 149 wierszy, ciągłe): wojny z graczem 0 naruszeń na obu; limit sojuszy 2/cyw. dotrzymany (4242: max 1, 17 tur; seed 7: max 2, 76 tur, 0 tur >2 na cyw.). Porównanie 4242 t≤100: tury z sojuszem Łatwa 64 / Normalna 42 / Trudna 7 → zamierzone. Readback unit-pace=wysoki, culture=trudny, diplo-level w logach segmentów (4242: 14/14, 7: 17/17 udanych). Bramki: tsc 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat sanity OK; ai-test 297/0.
BLOKADY: brak. Chromium padał przy wznowieniach (5 z 6 prób seed 7 rc=124 lub częściowe), każdorazowo ponowione, bez utraty danych. Pole deklarującego wojnę odroczone (wymaga zmiany gry, decyzja orkiestratora). Pozycje 3–5 → VLIVE3.
RUNDY: 3/5
NASTĘPNY KROK: Evaluator → Final Control.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: skrypt analiza-limitow-q2.py liczy „tury z >2 sojuszami” sumarycznie (nie per cywilizację) — mylące, kryterium jest linia „na cywilizację”; kandydat na poprawkę etykiety (tools/dane, nie gra).
