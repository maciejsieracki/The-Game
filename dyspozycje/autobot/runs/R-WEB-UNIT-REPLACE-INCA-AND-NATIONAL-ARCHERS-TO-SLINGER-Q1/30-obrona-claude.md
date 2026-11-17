# R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1 — obrona Operatora (odpowiedź na zarzuty Evaluatora r1)

STATUS: DECISION_REQUIRED (zarzut 3 i część zarzutu 2 wymagają decyzji właściciela; dodany test AI, pomiar bazy i testy zielone)
DOMAIN: GAME (Zastąp, tabela zamian w units.json, testy gra/tools)
TEMAT: R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1
GOAL: tabela zamian obejmuje Inków i narodowych łuczników z przejściem do Procarza na tych samych zasadach co Łucznik; przy niejednoznacznym celu DECISION_REQUIRED, bez zgadywania.
BAZA: kandydat ce9ac7488fb3347a2d2ca35efe1010ea004efe1a (origin/main 76a1739fd jako baza). Commit obrony: patrz sekcja ZMIANY-COMMIT.

## Źródła
- Dispatch `00-dispatch.md` istnieje tylko na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (w `origin/main` brak). Sprawdzone ponownie.
- `00-dispatch-DODATEK-claude.md` nie istnieje w żadnej gałęzi (sprawdzone `git ls-tree` na `origin/main` i `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`). Zakres = GOAL/KRYTERIA z dispatchu.
- Środowisko testowe: `gra/node_modules` nie było w worktree; zainstalowane poza repo w scratchpadzie (`npm ci --ignore-scripts` w kopii `package.json`/`package-lock.json`) i podlinkowane jako `gra/node_modules` (gitignored, nie w commicie).

## Odpowiedź na zarzuty

### Zarzut 1 — `unit-replace-full-cost-test` czerwony 39/1 (ACCEPT: dług bazowy, zmierzony)
PRZYJMUJĘ ustalenie, ZMIERZONO na bazie (wcześniej NIE ZWERYFIKOWANO):
- baza `76a1739` (eksport `git archive` do scratchpadu): `unit-replace pelny koszt: 39 passed, 1 failed`, FAIL: `performUnitReplace (gracz): pobiera PELNY Pieniadz + surowiec z puli panstwa (wspolny executeUnitReplace)`.
- kandydat `ce9ac7488`: ta sama liczba 39/1, ten sam FAIL.
- Wniosek: dług przedtematowy, nie regresja. Test nie został naprawiony w tym temacie (poza allowlistą: asercja dotyczy `main.ts`/`unit-replace-execute.ts`, których ten temat nie rusza). Do rejestru orkiestratora jako dług testowy.

### Zarzut 2 — niespójność egipski/sumeryjski vs nubijski/akadyjski/asyryjski (ODRZUCAM część „błąd kryterium”; PRZYJMUJĘ jako uwagę balansową dla właściciela)
Fakty z `gra/data/units.json` (kandydat):
- Łucznik egipski: Kamień, Specjalna, Distance, koszt 7, atak dyst. 5, zdrowie 20, pociski 12 → Procarz.
- Łucznik sumeryjski: Kamień, Specjalna, Distance, koszt 5, atak dyst. 4, zdrowie 20, pociski 14 → Procarz.
- Procarz: Brąz, Standardowa, Slinger, koszt 4, atak dyst. 4, zdrowie 16, pociski 15.
- Nubijski/akadyjski/asyryjski: Brąz, Specjalna → Procarz (Brąz, Standardowa) odrzucone jako ta sama epoka i niższa klasa (DECISION_REQUIRED).

Kryterium użyte w tabeli i walidatorze to przejście EPOKI w górę (`unit-replace-promotion-table-test.cjs` `rank()` czyta pole `Epoka`), i ta reguła jest spójna:
- Kamień → Brąz (egipski, sumeryjski, Łucznik): przejście epoki, dozwolone.
- Brąz → Brąz (nubijski, akadyjski, asyryjski): brak przejścia epoki, odrzucone.
ODRZUCAM zarzut, że to „ta sama degradacja”: Procarz jest w Brązie, więc dla Kamienia to awans epoki. Zarzut „egipski/sumeryjski nie są wzmocnieniem” jest jednak zasadny: przejście to też spadek klasy Specjalna → Standardowa i spadek statystyk bojowych (egipski: dyst. 5 → 4, zdrowie 20 → 16; sumeryjski: koszt 5 → 4). To jest decyzja balansowa, której Operator nie ma prawa rozstrzygnąć sam. Zostawiam zmianę zgodną z GOAL („na tych samych zasadach co Łucznik”, czyli Kamień → Procarz) i oznaczam ją w DECISION_REQUIRED (pytanie do właściciela: czy zamiana Specjalna Kamień → Standardowa Brąz ma zostać, czy cofamy egipski/sumeryjski do DECISION_REQUIRED razem z nubijskim).

### Zarzut 3 — niepełny zakres (ODRZUCAM jako defekt; to zgodne z klauzulą DECISION_REQUIRED)
GOAL dispatchu: przy niejednoznacznym celu DECISION_REQUIRED, bez zgadywania. Dowód braku jednoznaczności (dane kandydata):
- Nubijski, akadyjski, asyryjski: cel Procarz = Brąz Standardowa, ta sama epoka co źródło (Brąz Specjalna) → nie jest awansem (DECISION_REQUIRED, opcje A/B/C w `10-operator-claude.md`).
- Inkowie: w danych dwie jednostki (`Oszczepnik (Estólica)`, Kamień, Distance; `Procarz (Huaracoc)`, Brąz, Slinger, cel już ustawiony na Procarz). Brak jednoznacznego „łucznika Inków”, więc brak zgadywania celu.
Nie ma w repo decyzji właściciela dla tych pozycji, więc nie są zmieniane. Zarzut „2 z 5 łuczników” dotyczy zakresu DECISION_REQUIRED, nie błędu wykonania.

### Zarzut 4 — brak testu ścieżki AI dla egipskiego i sumeryjskiego (PRZYJMUJĘ: poprawka + dowód)
Dodano blok testu `10.` w `gra/tools/unit-replace-archer-slinger-test.cjs` (helper `aiPromote` = `promoteAiUnitForEra`, te same bramki co gracz):
- AI w Brązie: Łucznik egipski → Procarz, `ok`, Pieniądz 100 → 96, drewno 100 → 75 (pełny koszt Procarza).
- AI w Kamieniu: Łucznik egipski → brak awansu (epoka).
- AI w Brązie: Łucznik sumeryjski → Procarz, `ok`, Pieniądz 96, drewno 75.
- AI w Kamieniu: Łucznik sumeryjski → brak awansu.
Wynik po poprawce (surowe wyjście): `[unit-replace-archer-slinger-test] 27 OK, 0 FAIL` (przed poprawką 20 OK).

### Zarzut 5 — żywy Chromium NIE ZMIERZONO (PRZYJMUJĘ: nie zmierzono)
Zmiana jest danymi (`units.json`) i testami, bez zmian UI. Żywy Chromium (okno „Zastąp” z przejściem) NIE ZMIERZONO w tej rundzie. Dług Rust REPIN tabeli zamian: wzmiankowany, bez wpisu w rejestrze (do decyzji orkiestratora, patrz UWAGI).

### Zarzut 6 — drobne (PRZYJMUJĘ; dowody uzupełnione)
- Pięć bramek: uruchomione w tej rundzie (surowe wyniki poniżej). Wcześniejsze „nieuruchomione” było błędne.
- `wikiBundle`: regeneracja `node tools/bundle-wiki-for-game.cjs` → exit 0, `wikiBundle.json: 22 rozdz. + 185 haseł (~1317 KB)`; `git status --short` po regeneracji: tylko `gra/tools/unit-replace-archer-slinger-test.cjs` (brak zmiany wikiBundle potwierdzona).
- Brak `00-dispatch-DODATEK-claude.md` (patrz Źródła) — bez zmian.

## Zmiany (ZMIANY-COMMIT)
- `gra/tools/unit-replace-archer-slinger-test.cjs`: dodany blok testu 10 (ścieżka AI dla egipskiego i sumeryjskiego, 7 asercji). Plik w allowliście (`gra/tools/`).
- `dyspozycje/autobot/runs/R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1/30-obrona-claude.md`: ten raport.
- Brak zmian w `gra/data/units.json` (dane z kandydata ce9ac7488 zostają bez zmian, zgodnie z odpowiedzią na zarzut 2).

## TESTY (liczby z surowego wyjścia, kandydat + poprawka)
- `npx tsc --noEmit` (gra/): exit 0, 0 linii wyjścia.
- `node tools/unit-replace-promotion-table-test.cjs`: `PASS: 26 wpisów źródłowych, 57 krawędzi, brak cykli` (exit 0).
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)` (exit 0).
- `node tools/unit-replace-archer-slinger-test.cjs`: `27 OK, 0 FAIL` (exit 0).
- `node tools/unit-replace-full-cost-test.cjs`: `unit-replace pelny koszt: 39 passed, 1 failed` (exit 1) — IDENTYCZNIE na bazie 76a1739 (dług, patrz zarzut 1).
- `node tools/ai-era-unit-promotion-test.cjs`: `17 passed, 0 failed` (exit 0).
- `node tools/ai-unit-replace-same-rules-test.cjs`: `45 passed, 0 failed` (exit 0).
- `node tools/bundle-wiki-for-game.cjs`: exit 0, bez zmiany pliku wiki (patrz zarzut 6).
- NIE ZMIERZONO: żywy Chromium (zarzut 5).

## BLOKADY
- Decyzja właściciela (DECISION_REQUIRED): (a) nubijski/akadyjski/asyryjski i Inkowie (oba warianty) bez przejścia; (b) egipski/sumeryjski — czy zamiana Specjalna Kamień → Standardowa Brąz ma zostać (spadek klasy i statystyk), czy cofamy je do DECISION_REQUIRED.
- Dług testowy bazowy: `unit-replace-full-cost-test` 39/1 (asercja `performUnitReplace (gracz)`), obecny na 76a1739.
- Brak zmierzonego Chromium.

## RUNDY
2/5 (runda 1: Operator; runda 2: ta obrona). Ostatni werdykt Evaluatora: PASS-WITH-NOTES (695a8d6a9). Decyzja wymagana: patrz BLOKADY (a) i (b).

## UWAGI-DLA-ORKIESTRATORA
- Znaleziska poza zakresem (nie tworzono zadań ani sesji, zgodnie z zakazem): dług Rust REPIN tabeli zamian (`Zastąp` Łucznik/egipski/sumeryjski → Procarz) — wpis do rejestru; dług testowy `unit-replace-full-cost-test` (39/1 na bazie) — wpis do rejestru jako dług bazowy.
- Brak `00-dispatch-DODATEK-claude.md` w repo; zakres przyjęty z dispatchu.

## NASTĘPNY KROK
Evaluator: sprawdzić `27 OK, 0 FAIL` (archer-slinger), pomiar bazy 39/1 (full-cost) i commit obrony. Final Control po decyzji właściciela (a)/(b). Chromium przed deployem: NIE ZMIERZONO.

DEPLOY/PUSH: NIE WYKONANO
