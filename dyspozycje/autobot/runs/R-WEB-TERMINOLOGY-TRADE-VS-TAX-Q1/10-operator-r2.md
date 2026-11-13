STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1
RUNDA: 2/5
MODEL / EFFORT: GPT-6 Luna / High
BAZA: origin/main d0ccc260edb35c952e6cd9eb5477cff02a4e2b3f

CEL: odsprzężyć focused terminology guard od niepowiązanej walidacji gotowości wszystkich kart odkryć, bez usuwania asercji terminologicznych i bez poprawiania danych produktu.

DIAGNOZA: `gen-tech-cards-top5.cjs --check` uruchamia pełne generowanie i walidację wszystkich kart odkryć, zanim porówna wygenerowany JSON. Zawodzi na `Sztuka wojenna: Top3 = NIE_USTALONO nie może trafić na kartę`, niezależnie od testu terminologii. To istniejący dług Top3 i warunek przynależny do `tech-cards-top5-test.cjs`, który już ma własną asercję `[A] gen-tech-cards-top5.cjs --check: dane zgodne z generatorem`. `gen-tech-cards-top5-test.cjs` również dalej uruchamia pełny check; jego próba przerwała się potem na brak zainstalowanego Chromium. Nie zmieniano Top3, CSV, pliku zdań, generatora ani kart.

ZMIANA: w `gra/tools/terminology-trade-vs-tax-test.cjs` usunięto wyłącznie wywołanie pełnego `gen-tech-cards-top5.cjs --check`. Zachowano wszystkie istniejące asercje terminologiczne; dodano dwie bezpośrednie asercje normalizatora CSV (`+3 handlu` → `+3 podatku`; `klucza` → `klucz`). Sprawdzanie generatora kart budynków pozostało. Pełna integralność/gotowość kart odkryć nadal ma osobną bramkę w ich dedykowanym suite, nie jest pominięta ani maskowana.

WERYFIKACJA:
- `node tools/terminology-trade-vs-tax-test.cjs` z `gra/`: exit 0, 796 pass, 0 fail.
- `git diff --check -- gra/tools/terminology-trade-vs-tax-test.cjs dyspozycje/autobot/runs/R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1/00-dispatch.md`: exit 0.
- `node tools/gen-tech-cards-top5.cjs --check` z `gra/`: exit 1, ten sam błąd Top3; dług pozostaje widoczny w dedykowanej bramce.
- `node tools/tech-cards-top5-test.cjs` z `gra/`: własna asercja generatora zwróciła ten sam błąd Top3; wykonanie następnie przerwało się na braku Chromium (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`).

ZAKRES FAKTYCZNY: zmieniono tylko `gra/tools/terminology-trade-vs-tax-test.cjs`, ten run dispatch i ten raport. Brak commit/deploy/push; brak zmian w danych produktu.

NASTĘPNY KROK: niezależna ocena rundy 2. Po akceptacji temat wymaga osobnego rozstrzygnięcia długów Top3/Chromium w `R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1`; nie są one wprowadzane jako regresje terminologii.
