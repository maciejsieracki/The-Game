STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — analiza + propozycja treści, bez zmian w kodzie gry
TEMAT: R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1
GOAL: Etap 2/5 kart — dla 43 budynków `gra/data/buildings.json` realne korzyści z dowodem, turniej TOP 5 (zamiast `top3`), „Co możesz teraz zrobić” CZYNNOŚĆ → KORZYŚĆ, lista martwych efektów, plan etapów 3–5.
ZMIANY-COMMIT: 4886c8b5a (treść analizy + ten raport; baza 397f84f29); zapis SHA w raporcie — commit następny. Allowlista: `dyspozycje/analizy/karty-budynkow/**` (ANALIZA-KART-BUDYNKOW.md, budynki-top5.csv, turnieje/43 + README.md, narzedzia/bldata.py + gen.py), `dyspozycje/autobot/runs/R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1/01-operator-r1.md`. Zero zmian w `gra/**`.
TESTY (=WERYFIKACJA):
- Generator `python3 -I dyspozycje/analizy/karty-budynkow/narzedzia/gen.py <repo>`: OK; 43/43 budynki (asercja), 121 kandydatów, 149 pojedynków, 120 pozycji TOP, każdy `plik:linia` sprawdzony (`check_ev`).
- 43/43: 40 z TOP 5 (5 pełnych, reszta tylko realne pozycje), 3 × NIE_USTALONO = budynek niedostępny (Wielka odlewnia, Wielka Kuźnia — epoka 4; Teatr — suppressed).
- Mennica: Top1 „×1,5 podatku w każdym mieście państwa” — econ-params.json:585-591 (1,62/1,50/1,38), economy.ts:952-955, :962-967, :644-653; koszt 1 Złota/turę (zloto-access.ts:31).
- Pomiar wstępny potwierdzony: `top3` 43/43, 129 pozycji, 47/129 wg regexu etapu 1; klasyfikacja Operatora: 71 zachowane, 46 warunek/ogólnik, 12 martwe/nieprawdziwe. Komentarz „0/42” (buildingAdapter.ts:234) nieaktualny.
- Karta budynku: TOP stoi już zaraz po Rysie (buildingAdapter.ts:232-236, renderer.ts:461,486); sekcji „Co możesz teraz zrobić” brak (grep) → propozycja nowej sekcji (Q1).
- CSV: UTF-8 z BOM, LF (0 × CR), `;`, 43 wiersze, 16 kolumn wg dispatchu.
- `git diff --cached --check`: czysto. Baza 397f84f29 = origin/main.
- Zgodność Operator–Evaluator: NIE_ZMIERZONO (liczy Evaluator po ślepym turnieju).
BLOKADY: brak. Uwagi do decyzji (ABC dla orkiestratora, §10): Q1 nowa sekcja CMZ; Q2 warunki/rozbudowy w Top2–5; Q3 ukrycie 3 budynków niedostępnych; Q4 Pałac II/III tracą −30% korupcji (economy.ts:1226 — prawdopodobny błąd); Q5 Trybunał „ogranicza korupcję” nieprawda; Q6 asymilacja kultury; Q7 zamiana Pracy na podatek tylko gracz.
Najważniejsze znaleziska: 5 najgorszych kart — Mennica (brak ×1,5), Koszary (brak bramki rekrutacji Brązu/Żelaza, production.ts:1068-1076), Warsztat oblężniczy (Top1 „Odblokowuje Katapultę” nieprawdziwy, cities.ts:845 REZERWA), Akwedukt (brak limitu 20), Garnizon (brak Milicji, combat-params.json:51-58). 15 martwych efektów do ukrycia (§8).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — ślepy, niezależny turniej 43 budynków (bez czytania TOP 5 Operatora do zapisania własnych), macierz zgodności na 5 pozycji.
DEPLOY-PUSH: NIE WYKONANO
