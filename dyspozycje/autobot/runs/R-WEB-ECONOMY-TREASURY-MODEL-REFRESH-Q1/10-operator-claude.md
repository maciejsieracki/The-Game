STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dokumentacja i modele; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-ECONOMY-TREASURY-MODEL-REFRESH-Q1
GOAL: odświeżyć modele skarbca i kosztów jednostek oraz dokument po FALACH 875–887, liczby z prawdziwych funkcji kodu
ZMIANY/COMMIT: baza 13e869f51 (origin/main); allowlista:
- gra/tools/treasury-unit-cost-model.cjs (przepisany: wywołuje economy-upkeep, production, unit-cost-tempo, population-growth-v85 przez esbuild)
- gra/tools/food-granary-model.cjs (przepisany analogicznie)
- dyspozycje/analizy/KOSZTY-JEDNOSTEK-STAN-2026-11-20.md (nowy)
- SKARBIEC-BRAZ-KOSZTY-JEDNOSTEK-OPTYMALIZACJA.md i ZYWNOSC-SPICHLERZ-BRAZ-OPTYMALIZACJA.md (tylko nagłówek NIEAKTUALNE)
- dyspozycje/autobot/runs/R-WEB-ECONOMY-TREASURY-MODEL-REFRESH-Q1/10-operator-claude.md
SHA: podany w polu sha odpowiedzi (commit operatora)
TESTY:
- node gra/tools/treasury-unit-cost-model.cjs: exit 0 (sekcje 1–4 wypisane)
- node gra/tools/food-granary-model.cjs: exit 0
- git diff --check: czysto
- tsc nie wymagany (brak zmian src)
- npm ci --ignore-scripts w gra/ (tylko esbuild do modeli; node_modules w .gitignore); df / przed: 9,1 GB wolne
BLOKADY: brak
UWAGI-DLA-ORKIESTRATORA:
- Skład armii w zrzucie skarbca (376 jednostek) NIE_ZMIERZONO; przedział netto Brąz Normalny: +12 / −740 / −2244 (k=2/4/8).
- Zrzut 1550−786−376=388, panel 345: różnica 43 NIE_ZMIERZONO.
- Stare dokumenty nie przepisane, tylko nagłówek NIEAKTUALNE.
RUNDY: 1/5 (runda operatora, bez werdyktu)
PYTANIA ABC (w dokumencie, sekcja 6): A) czy skarbiec Brązu przy Normalnym ×2 jest ciasny — rek.: najpierw pomiar składu armii w grze (VERIFY-LIVE); B) żywność Falangi poza terytorium 512 przy Wysokim — rek.: akceptować do pomiaru.
NASTĘPNY KROK: Evaluator (SONNET) — sprawdzić liczby z surowego wyjścia obu skryptów i zgodność z kodem
DEPLOY/PUSH: NIE WYKONANO
