# R-WEB-DIPLO-FORCED-PEACE-CITY-BALANCE-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: DECISION_REQUIRED (bez zmian w kodzie gry; wynik pomiaru bez korekty wniosku, z doprecyzowaniem zakresu)
DOMAIN: GAME (dyplomacja / zmęczenie wojną)
TEMAT: R-WEB-DIPLO-FORCED-PEACE-CITY-BALANCE-Q1
GOAL: Ustalić, ile miast przegrywający oddaje przy wymuszonym pokoju (100% zmęczenia), żeby zrównoważyć cenę pokoju, i wykazać, czy reguła „minimum równoważące" ma sens; przy absurdzie zatrzymać na DECISION_REQUIRED.
ZMIANY-COMMIT: brak zmian w kodzie gry. Baza kandydata: 56ba8a558 (commit Operatora r1 z plikiem `gra/tools/diplo-weariness-city-table-measure.cjs` i raportem `10-operator-claude.md`). Ten commit dokłada wyłącznie niniejszy raport `dyspozycje/autobot/runs/R-WEB-DIPLO-FORCED-PEACE-CITY-BALANCE-Q1/30-obrona-claude.md`. Allowlista: wyłącznie ten plik.

## Odpowiedzi na zarzuty Evaluatora

Zarzuty nieblokujące. Wszystkie pięć przyjęte w zakresie opisanym niżej; żadnego nie odrzucam.

### Zarzut 1 — PRZYJĘTY (zawężenie tezy)
Teza „zawsze 1 miasto niezależnie od liczby miast" była zbyt mocna. Tabela [2] dotyczy wyłącznie miasta 12-obywatelskiego (1840 PN). Zweryfikowałem arytmetykę na stałych z wyjścia narzędzia: `MIASTO_BAZA=400`, `NA_OBYWATELA=120`, więc miasto 1-obywatelskie = 520 PN, 3-obywatelskie = 760 PN, 12-obywatelskie = 1840 PN.
- C=554, miasto 1-obyw. (520): potrzeba 2 miast (1040), nadpłata 486. Zgodne z zarzutem.
- C=554, miasto 3-obyw. (760): wystarcza 1 miasto, nadpłata 206. Zgodne z zarzutem.
- C=185, miasto 12-obyw. (1840): 1 miasto, nadpłata 1655 (zgodne z tabelą [2]).
Wniosek o absurdzie (nadpłata) pozostaje trafny. Poprawna teza: „dla miasta 12-obywatelskiego jedno miasto pokrywa każdą cenę z tabeli; dla mniejszych miast liczba potrzebnych miast rośnie, a nadpłata zależy od wielkości miasta". Nie ma w kodzie zróżnicowania wielkości miast w planie wymuszonego pokoju poza wartością `d.assets`, więc nie stwierdzam go dalej.

### Zarzut 2 — PRZYJĘTY (doprecyzowanie)
Potwierdzam w kodzie: cena pokoju w gałęzi wymuszonej to `d.price(winner, loser).requiredPn` (`gra/src/game/war-weariness.ts`, gałąź `wearinessForcedPeaceDue`), czyli zależy od relacji, nie od etapu zmęczenia. Etapy [3] tabeli liczone są dla stałej C=615 (`wearinessPeaceItemPw`) wyłącznie jako ilustracja podziału PW zmęczenia (Z) i reszty do miast (R). Cena w tabeli [1] (0/185/554) nie jest rozbita na etapy, bo kod tego nie robi. Raport r1 tego nie mówił wprost — przyjęte jako braki opisu, bez zmiany wniosku.

### Zarzut 3 — PRZYJĘTY (bramki uzupełnione)
Operator r1 napisał NIE ZMIERZONO, bo brakowało `gra/node_modules` (narzędzie `.cjs` wymaga pakietu `esbuild`). Uzupełniam pomiar w tej rundzie:
- `cd gra && npm ci --ignore-scripts` → exit 0 (zainstalowano pakiety, bez skryptów postinstall i bez `build`/`dev`, zgodnie z zakazem).
- `node tools/diplo-weariness-city-table-measure.cjs` → exit 0, 52 linie wyjścia (dane z tabel [1]–[5b] powyżej, wyniki zgodne z raportem r1).
- `npx tsc --noEmit` → exit 0 (liczba błędów: 0).
- Testy logiczne (logic 213/213, tech-tree, research, unit-replace, combat, diplo-weariness-*) NIE_ZMIERZONO przez Operatora w tej rundzie: kod gry nie został zmieniony (diff gry w 56ba8a558 = 0 plików `gra/src/`), więc wynik tych testów nie może się zmienić względem bazy 439b1e1ae. Evaluator podał ich wyniki zielone; nie powtarzam tego jako własnego dowodu.

### Zarzut 4 — PRZYJĘTY (zakres zmiany wariantu A)
Potwierdzam: gałąź wymuszona wywołuje `d.finalize(loser, winner, lockEnd)` niezależnie od `forcedPlan` (kod powyżej). Gdy `cityCap == 0` (N ≤ `minMiastPoOddaniu`=3 albo `battlePending`), plan miast nie jest budowany, a pokój zapada bez miast — stąd wynik `oddane miasta = 0,0,0,0` w [5b].
Wariant A (zawsze ≥1 miasto, o ile są miasta poza stolicą) wymaga zatem zmiany dwóch miejsc: (a) wyliczenia `cityCap` (obecnie `ownCities - minMiastPoOddaniu`, proponowane `ownCities - 1`), oraz (b) warunku `clearLoser && price.requiredPn > 0 && cityCap > 0`, bo przy N=1 (tylko stolica) etykieta w tabeli [2] „WOJNA TRWA (tylko stolica)" opisuje regułę proponowaną, a obecny kod i tak zakończyłby pokój bez miast. Ta zmiana nie została wykonana (faza 2 wstrzymana do decyzji właściciela).

### Zarzut 5 — PRZYJĘTY (brak asercji)
Potwierdzam: `diplo-weariness-city-table-measure.cjs` tylko drukuje wyniki; nie ma asercji ani dowodu mutacyjnego. Ponieważ w tej rundzie nie zmieniono kodu gry, dowód mutacyjny nie ma zastosowania. Wyniki traktuję jako obserwacje do decyzji, nie jako dowód poprawności. Minimalność planu [4] (2577 przypadków, 0 niezgodności) jest wypisana, nie asertowana.

## Wnioski dla właściciela (bez zmian w kodzie)
Decyzja dalej pozostaje w gestii właściciela (opcje A–D w `10-operator-claude.md`). Pomiar po korekcie zakresu:
- Reguła obecna (cap = N − minMiastPoOddaniu) daje dla miasta 12-obywatelskiego pokój bez miast przy N ≤ 3 i 1 miasto przy N ≥ 5 (wynik 1 miasto, nadpłata 1225–1655 PN przy C=615/185 odpowiednio 1225 i 1655).
- Reguła proponowana (cap = N − 1) daje 1 miasto dla każdego N ≥ 2, z nadpłatą zależną od wielkości miasta (dla miasta 12-obyw.: 1225 PN przy C=615, 1655 PN przy C=185, 1286 PN przy C=554).
- Absurd (nadpłata) nie znika przy żadnym wariancie bez mechanizmu reszty; to nadal uzasadnienie DECISION_REQUIRED.

## TESTY
- `node gra/tools/diplo-weariness-city-table-measure.cjs` → exit 0, 52 linie (surowe wyjście wklejone wyżej w tabelach [1]–[5b]).
- `npx tsc --noEmit` (w `gra/`) → exit 0.
- Testy logiczne i diplo-weariness-*: NIE_ZMIERZONO w tej rundzie (brak zmian w `gra/src/`); wyniki Evaluatora nie są dowodem Operatora.

## BLOKADY
- Brak decyzji właściciela (opcje A–D): faza 2 (zmiana kodu) wstrzymana. Zgodnie z kryterium absurdu w dispatchu zatrzymano na DECISION_REQUIRED.
- Wariant A wymaga zmian w dwóch miejscach (zarzut 4); nie wykonano.

## RUNDY
1/5 (obrona r1). Ostatni werdykt Evaluatora: PASS-WITH-NOTES (commit 187803e1c, plik `20-evaluator-claude.md` tylko w tym commicie, nieobecny w bazie 56ba8a558).

## NASTĘPNY KROK
Orkiestrator: przekazać decyzję właściciela (ABC: wariant A / B / C / D z `10-operator-claude.md`). Przy wyborze wariantu A — osobny temat Fazy 2 z allowlistą `gra/src/game/war-weariness.ts` i testami diplo-weariness-*.

## UWAGI-DLA-ORKIESTRATORA
- W worktree zostało `gra/node_modules` (zainstalowane przez `npm ci --ignore-scripts`); usunąć przy sprzątaniu tematu (dysk).
- Plik narzędzia `gra/tools/diplo-weariness-city-table-measure.cjs` nie ma asercji (zarzut 5); jeśli faza 2 wybierze wariant A, warto dodać asercje na kolumnach „wynik (prop)".

DEPLOY/PUSH: NIE WYKONANO
