STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-VERIFY-LIVE-MAX-Q2
GOAL: domknąć pozycje NIE ZMIERZONO z VLIVE Q1 na poziomie maksymalnym (Dyplomacja Trudna, Koszty jednostek Wysoki ×4, flagi ON).
ZMIANY/COMMIT: allowlista: `gra/tools/diplomacy-harder-measure-run.cjs` (opcje `--unit-pace`, `--culture`, domyślnie bez zmiany zachowania), `dyspozycje/analizy/VERIFY-LIVE-MAX-Q2-2026-11-27.md`, `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q2/**`. Zmiany w `gra/src`: brak. Baza: origin/main 01795c329. SHA commita: patrz pole sha w wyniku Operatora.
TESTY: tsc exit 0; logic 213/213; tech-tree 20 pass / 0 fail; research 33/0 (TOTAL 33); unit-replace 21/21; combat 6/6; ai-test 297 passed / 0 failed. Pomiar live: seed 4242, tury 2–150, 149 wierszy, Trudna + Wysoki ×4 + flagi ON (kultura Łatwy).
Wyniki: (1) limit wojen z graczem seed 4242: 0 naruszeń (gracz ≤1 naturalna + ≤1 epoki w turze; 66 tur w wojnie). (2) limit sojuszy AI↔AI seed 4242: maks. 2 na cywilizację (t120), 0 tur z >2 na cywilizację. (3)–(5) NIE ZMIERZONO. Seed 7 NIE ZMIERZONO. Porównanie Łatwa/Normalna NIE ZMIERZONO.
BLOKADY: (a) Kultura i religia NIE była na maksimum w biegu seed 4242 (runner nie ustawiał klucza; poprawiony opcją `--culture trudny`, bieg nie powtórzony). (b) Czas: tempo 2–8 min/turę przy load 5–8 uniemożliwiło seed 7, porównania Łatwa/Normalna, Targowisko (wymaga haka), cesję >1 miasta (wymaga haka) i FORTRING. (c) Chromium przy wznowieniach segmentów (1–2 próby na segment), bez utraty danych.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje: (1) powtórzyć seed 4242 z `--culture trudny` (150 tur), (2) seed 7 do t120/t150, (3) biegi Łatwa/Normalna do t100 (seed 4242), (4) osobny temat na haki Targowiska i cesji >1 miasta oraz runner FORTRING.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: znalezisko poza zakresem: brak; obserwacja do oceny: w tym biegu sojusze AI↔AI pojawiają się na Wysokim kosztach jednostek (w Q1 na Niski ich nie było) — jedno ziarno, bez wniosku o błędzie gry.
