# Final Control — R-WEB-BRONZEWORKING-RESEARCH-COST-480-Q1

**Werdykt: PASS. Etap 8 — Final Control; kandydat gotowy do przeglądu integracyjnego.** Kontrolę wykonał niezależnie Codex GPT-6 Luna / High.

- Baza: `41218f7ed5dc9ee392a21f260ffab21b1d642c63`
- Kandydat: `d3216eb2a2e3d8e959e560f21e3c47109819bae6`

## Zakres i bezpośrednie potwierdzenie

Decyzja właściciela jest jednoznaczna: Brązownictwo ma koszt bazowy 480 PN. Garncarstwo 40 PN, Gospodarka wodna 180 PN i Koło 180 PN pozostały bez zmian. Porównanie danych technologii bazy z kandydatem wykazało dokładnie jedno zmienione pole: `technologie[11].Koszt nauki`, Brązownictwo 180 → 480. Nie zmieniły się inne rekordy ani pola danych technologii.

Porównanie bundla z bazą wykazało dokładnie jeden zmieniony wpis encyklopedii: `technologie/brazownictwo`. Wpis zawiera aktualne Wiki-S i Wiki-M. Świeży wynik generatora (`22 rozdziały, 170 haseł`) jest bajtowo identyczny z `gra/src/data/wikiBundle.json`.

## Bramy

- **PASS** — `node gra/tools/stone-research-costs-test.cjs`: 48 zaliczonych, 0 niezaliczonych; obejmuje rzeczywiste `techCost`, tempa 1/2/4 dla wszystkich czterech zatwierdzonych kosztów oraz niezmienione epoki, poziomy, prerekwizyty i odblokowania.
- **PASS** — `npm run typecheck` z `gra/`.
- **PASS** — `git diff --check HEAD^ HEAD`.
- **PASS** — generator odtworzył obecny bundle bez różnic bajtowych.
- **PASS** — po normalizacji zatwierdzonych kosztów test kontrolny potwierdza niezmienność pozostałych danych technologii.
- **PASS** — kandydat jest wskazanym, odizolowanym commitem; podczas tej kontroli nie zmieniano kodu ani danych produktu. Przed kontrolą istniał nieśledzony raport Evaluatora `20-evaluator.md`; ta kontrola dodaje wyłącznie niniejszy raport.

Nie wykonywano kontroli przeglądarkowej: koszt runtime pochodzi z danych technologii, a bezpośredni test wywołuje obliczenie `techCost` i mnożniki tempa. Integracja, push, merge i deployment pozostają poza zakresem tej kontroli. Raport nie oznacza `READY_FOR_DEPLOY`.
