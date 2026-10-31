STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1
GOAL: Przywrócić bazową produkcję Tartaku i Kamieniołomu do 50/turę (epoka 1), zgodnie z decyzją właściciela z R-EKONOMIA-SUROWCE-SKALA-5X-Q1; regres 200 z commita 9175f031f usunięty.
ZMIANY/COMMIT: baza origin/main 5ab3d58e2. Zmienione pliki (allowlista): gra/data/terrain-improvements.json (tartak l.204 i kamieniolom l.146: 200→50, notatki historii); gra/src/game/terrain-improvements.ts (tylko komentarz, bez zmiany logiki); gra/tools/kamieniolom-kamien-epoka-test.cjs (200/300/450 → 50/75/113 + testy granic); gra/tools/improvement-adapter-resource-note-test.cjs (asercja "200 / turę" → "50 / turę", bo wartość wynika z JSON). turn-economy.ts: bez zmian (brak nieaktualnych komentarzy o 200). Runu: dyspozycje/autobot/runs/R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1/ (gate-*.txt). SHA: patrz sekcja commit poniżej.
TESTY:
- Epoki (resourceProductionAmountForEra / resolver): tartak i kamieniołom PRZED 200/300/450, PO 50/75/113 (round(50×1,5^(e−1))). Glinianka bez skalowania = 50. era undefined/0/4/NaN → 50.
- kamieniolom-kamien-epoka-test: base 37 PASS/0 FAIL (przed: 20 PASS/0 FAIL, bo stare asercje 200). Dwa kamieniołomy epoka 1 = 100.
- tartak-glinianka-rate-Q1-test: przed 1276 pass/5 FAIL (200 vs oczekiwane 50 — ten test już wymagał 50, to był dowód regresu); po 1281 pass/0 FAIL.
- improvement-adapter-resource-note-test: 0 FAIL przed i po.
- Mutacja: JSON tartak+kamieniołom 50→200 → kamieniolom-kamien-epoka 17 PASS/20 FAIL (gate-mutacja-200-kamieniolom.txt); pełne 200 we wszystkich 4 pozycjach 50 → tartak-glinianka 8 FAIL. Plik JSON przywrócony i zweryfikowany (cmp).
- ekonomia-5x-inwariant-test: 197/50 FAIL przed i po, zbiór failów identyczny (niezwiązane: np. Wojownik, Równina drewno, wycinka).
- budynek-civ-bonus-u17: przed 4 FAIL, po 3 FAIL. Pre-existing: test porównuje baseKamien z wiersza terytorium (50) z runTick (50+5 z heksu centrum); mismatch był też przed zmianą (200 vs 205). Nie naprawiałem (poza allowlistą logiki testu).
- hex-plony-magazyn: 4 FAIL przed i po (identyczne, pre-existing, glina/kamień heksów).
- zloto-test: 7 FAIL przed i po (pre-existing).
- tsc --noEmit: EXIT=0 przed i po.
- Nie uruchomiono (NIE_ZMIERZONO): diplomacy 148, war-era-counter 82, ring 15 — nie znalazłem plików o tych nazwach w gra/tools; liczby nie zostały zmierzone.
- START: tartak epoka 1 = 50 (JSON + test tartak-glinianka). Składowe karty Drewno (+70 = 50 + 20 centrum) NIE_ZMIERZONO w całości: terrain-yields.json Równina Drewno=5 (l.19), źródło +15 nie zlokalizowane.
BLOKADY: brak. Pre-existing czerwone (ekonomia-5x, zloto, hex-plony, budynek-u17) nie są skutkiem zmiany.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) — niezależna weryfikacja diffu i bramek; Final Control po PASS.
ZAŁOŻENIA: (1) skalowanie epoką z 9175f031f (×1,5, round) zostaje bez zmian; (2) nie zmieniam innych stawek (glinianka 50, warzelnia 50, stadnina 25, kopalnie 20, złoto 1); (3) tekst "bazowo 200" w uwadze kamieniołomu zastąpiony historią; (4) tests w gra/tools nie były dotykane poza dwoma wskazanymi.
DEPLOY/PUSH: NIE WYKONANO
