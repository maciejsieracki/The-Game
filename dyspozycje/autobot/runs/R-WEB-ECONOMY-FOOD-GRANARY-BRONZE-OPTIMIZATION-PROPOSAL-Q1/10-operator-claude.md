STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza i propozycja; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-ECONOMY-FOOD-GRANARY-BRONZE-OPTIMIZATION-PROPOSAL-Q1
GOAL: (1) żywność i Spichlerz Centralny w Brązie: nadwyżka ×3 nad zużyciem — model, odtworzenie zrzutu, warianty; (2) skarbiec w Brązie (PLOC = pułap Brązu): lekka korekta kosztów jednostek, warianty i pytania ABC.
ZMIANY/COMMIT: allowlista — dyspozycje/analizy/ZYWNOSC-SPICHLERZ-BRAZ-OPTYMALIZACJA.md; dyspozycje/analizy/SKARBIEC-BRAZ-KOSZTY-JEDNOSTEK-OPTYMALIZACJA.md; gra/tools/food-granary-model.cjs (nowy); gra/tools/treasury-unit-cost-model.cjs (nowy); niniejszy raport. Commit: SHA w polu sha orkiestratora.
TESTY: node gra/tools/food-granary-model.cjs — exit 0, cap 54000 (zrzut 54000), przyrost 2005 (zrzut +2005). node gra/tools/treasury-unit-cost-model.cjs — exit 0, netto 388 wg sumy, 345 wg panelu. tsc --noEmit NIE_ZMIERZONO (brak node_modules; dysk ~3 GB wolnego, npm ci pominięto zgodnie z progiem 4 GB). Pomiar w grze NIE_ZMIERZONO.
BLOKADY: brak pomiaru w grze (bieg 60 tur seed 4242 nie wykonany); pliki /tmp/rebal-keep/*.jsonl nie użyte (brak dowodu w tej rundzie).
ZAŁOŻENIA: „PLOC-em Brązu” = pułap (zaawansowany) Brązu; zrzuty z zadania są prawdziwe.

KLUCZOWE USTALENIA (ZMIERZONO z kodu i zrzutów):
- Cap żywności = 1000 + 2×(1000·Spichlerz I + 1500·Spichlerz II); 54 000 = np. 10 I + 11 II. Nadwyżka ponad cap PRZEPADA (empire-food.ts ~l.283-290).
- Przyrost zapasów +2005 = 3363 − 1046 − 312 (spójne). Tury do capu ≈ 12,4.
- Pasek „+2267 → +1954” zgadza się z flagą rebalansu OFF (wyżywienie ×0,75), a podsumowanie „+2317” z ON. Niespójność do potwierdzenia przez właściciela.
- Utrzymanie jednostek nie skaluje się z epoką (units.json ×4), a koszt rekrutacji tak (Brąz ×2, Żelazo ×4). Śr. utrzymanie Brąz 7,46 ¤/t.
- Netto skarbca: 1550 − 1162 = 388, panel 345 — różnica 43 NIE_ZMIERZONO.

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator — Evaluator (Sonnet) weryfikuje formuły z plik:linia i liczby z modeli; potem decyzje ABC właściciela.
PROPOZYCJE (do wyboru, bez wartości przyjętych za właściciela):
- Żywność: V1 produkcja ulepszeń −10%; V2 −20% + psucie 2%/t nad 50% capu; V3 −30% + konwersja 0,2 ¤/żywność nad 70% capu. Rekomendacja: konwersja/ujście na Brązie, obserwacja po pomiarze 60 tur.
- Skarbiec: V1 +10% utrzymania jednostek Brąz+ (netto ~307/t) — rekomendacja pierwsza; V2 +20% (~270); V3 +30% (~232). Kontrast ×2 daje netto −31/t (za mocne jako „lekkie”). Koszt rekrutacji bez zmian.
PYTANIA ABC (pełne w dokumentach): (1) która flaga rebalansu w zrzucie; (2) przepadek nadwyżki żywności: bez zmian / psucie / konwersja; (3) redukcja produkcji ulepszeń; (4) korekta utrzymania jednostek +10/+20/+30% i zakres Brąz/Żelazo.
UWAGI-DLA-ORKIESTRATORA: brak spawn/create wywołań (zgodnie z zakazem). Dysk ~3 GB wolnego przy starcie — przed kolejnym tematem Web wymagane ≥4 GB (sprzątanie).
DEPLOY/PUSH: NIE WYKONANO
