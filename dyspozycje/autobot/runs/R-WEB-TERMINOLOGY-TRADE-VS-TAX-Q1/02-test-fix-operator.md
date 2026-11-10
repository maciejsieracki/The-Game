STATUS: WSTRZYMANY/BLOCKED
DOMAIN: GAME
TEMAT: R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1
MODEL / EFFORT: GPT-6 Luna / High
BAZA: origin/main d0ccc260edb35c952e6cd9eb5477cff02a4e2b3f
ZAKRES: wyłącznie audyt zatwierdzonego testowego hunku c6b0a58d5 (`web-wip/TERMTAX-test`) względem `origin/main`; ewentualna zmiana wyłącznie `gra/tools/terminology-trade-vs-tax-test.cjs`; ten receipt.

ODBLOKOWANIE: commit i ref nie są dostępne do audytu: `git cat-file -t c6b0a58d5` zwrócił `fatal: Not a valid object name`; `git fetch origin web-wip/TERMTAX-test` zwrócił `fatal: couldn't find remote ref`; `git ls-remote --heads origin 'web-wip/TERMTAX-test' 'web-wip/*TERMTAX*' '*TERMTAX-test*'` nie zwrócił żadnego refu. Nie wykonano innych fetch/update.

STAN MAIN: temat bazowy jest zintegrowany — `git merge-base --is-ancestor 8d0ad983c origin/main` i ten sam odczyt dla `7ba84a818` zwróciły exit 0. Nie można ustalić, czy konkretny test-fix c6b0a58d5 jest zintegrowany, ponieważ obiekt nie istnieje w repozytorium, a ref zdalny nie istnieje.

TEST (wykonano): z katalogu `gra/`, `node tools/terminology-trade-vs-tax-test.cjs` — exit 1; 794 pass, 1 fail. Jedyny fail: `[G] gen-tech-cards-top5.cjs --check zgodny z plikiem danych` — `Sztuka wojenna: Top3 = NIE_USTALONO nie może trafić na kartę`. Samodzielny `node tools/gen-tech-cards-top5.cjs --check` zwraca ten sam błąd i exit 1.

WYNIK: plik testowy pozostawiono bez zmian, bo zatwierdzony diff c6b0a58d5 nie był dostępny do inspekcji; nie odtwarzano go przez zgadywanie. Drzewo zawiera niezwiązane, zastane zmiany `gra/src/game/research.ts`, `dyspozycje/autobot/runs/GITHUB-STATE-SYNC-20261110.md` oraz katalog runu `R-WEB-RESEARCH-POTTERY-COMMENT-SYNC-Q1`; nietknięte.

NASTĘPNY KROK: udostępnić commit `c6b0a58d5` lokalnie albo ponownie opublikować ref `web-wip/TERMTAX-test`, po czym porównać wyłącznie jego testowy hunk i ewentualnie zastosować go.
