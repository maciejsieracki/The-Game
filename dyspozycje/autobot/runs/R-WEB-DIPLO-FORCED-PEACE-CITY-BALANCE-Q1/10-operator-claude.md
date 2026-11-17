# R-WEB-DIPLO-FORCED-PEACE-CITY-BALANCE-Q1 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (dyplomacja / zmęczenie wojną)
TEMAT: R-WEB-DIPLO-FORCED-PEACE-CITY-BALANCE-Q1
GOAL: pokój wymuszony (100% zmęczenia): przegrywający oddaje DOKŁADNIE tyle miast, ile trzeba do zrównoważenia ceny pokoju; stały próg „min. 3 miasta” do zdjęcia. FAZA 1 (pomiar) wykonana. FAZA 2 (kod) WSTRZYMANA: pomiar pokazuje, że reguła „minimum równoważące” degeneruje się do jednego miasta, które przy tej wycenie daje nadpłatę 1225–1655 PN bez możliwości wydania reszty (kryterium absurdu z dispatchu). Potrzebna decyzja właściciela.
BAZA: `439b1e1ae0a6dbec769495941dff30867aa8857e` (= origin/main, detached). Ancestry sprawdzone (`git merge-base --is-ancestor`: OK).

## ZMIANY-COMMIT

- Dodany tylko pomiar (bez zmiany `gra/src`, `gra/data`, `WERSJE.md`, `gra-robocza`):
  - `gra/tools/diplo-weariness-city-table-measure.cjs` — bundle esbuild z PRAWDZIWYCH funkcji gry (`diplomacy-value-catalog`, `diplomacy-ai-offer-balance`, `diplomacy-ai-forced-peace`, `diplomacy-proposals`, `war-weariness`); zapis tymczasowy tylko w `/tmp/wear-q1`.
  - ten raport.
- Kod gry: BEZ ZMIAN (zgodnie z dispatchem: „jeśli pomiar pokazuje absurd → DECISION_REQUIRED, kod bez zmian w fazie 2").
- Commit: patrz sekcja DEPLOY/PUSH (SHA podany w polu `sha` odpowiedzi).

## POMIAR (FAZA 1) — liczby z uruchomienia `node tools/diplo-weariness-city-table-measure.cjs`

Stan kodu bazowego: `minMiastPoOddaniu` = 3 (JSON), `progWymuszonyPokoj` = 1, `BAZA_POKOJ` (acceptance-points „pokoj”) = 615.

Wartość PW miasta referencyjnego (12 obywateli, bez budynków i złóż) wg `diplomacyPnMiasto`: MIASTO_PN_BAZA 400 + 12 × 120 = **1840 PN**.

**[1] Cena pokoju C = `price.requiredPn` (`aiAiPeaceRequiredPn(peaceOfferAiRequestPn(...), peaceOfferAiOwnBilans(...))`) wg relacji (relTotal):**

| relTotal | easy | normal | hard |
|---|---|---|---|
| −100 … 90 | 0 | 0 | 0 |
| 130 | 185 | 185 | 185 |
| 200, 300 | 554 | 554 | 554 |

Zakres cen w grze: 0 / 185 / 554 PN. Trudność nie zmienia ceny w tym sweepie.

**[2] Plan wymuszonego pokoju (`planEscalatedPeacePayment`), miasta N po 12 obywateli, stolica zakazana:**

Wynik zapisany jako „proponowana reguła” (cap = N − 1, czyli wszystkie poza stolicą). Liczby dotyczą kodu z pliku pomiarowego, nie gry na żywo.

| C (PN) | N miast | cap | oddane miasta | pokryte PW | niedobor | nadpłata (pokryte − C) | wynik |
|---|---|---|---|---|---|---|---|
| 185 | 2 | 1 | 1 | 1840 | 0 | 1655 | pokój |
| 185 | 5 | 4 | 1 | 1840 | 0 | 1655 | pokój |
| 185 | 8 | 7 | 1 | 1840 | 0 | 1655 | pokój |
| 554 | 2 | 1 | 1 | 1840 | 0 | 1286 | pokój |
| 554 | 5 | 4 | 1 | 1840 | 0 | 1286 | pokój |
| 554 | 8 | 7 | 1 | 1840 | 0 | 1286 | pokój |
| 0 | N≥1 | — | 0 | 0 | 0 | 0 | pokój bez miast (bez zmian) |

Uwaga do tabeli: wiersze z `cap = 0` (N = 1) to „wojna trwa (tylko stolica)” według proponowanej reguły. Pełne wiersze dla N = 1, 2, 3, 5, 8 i C = 0, 185, 554, 615 są w wyjściu skryptu.

Wniosek z [2]: przy tej wycenie JEDNO miasto 12-obywatelskie (1840 PN) pokrywa każdą cenę z sweepu (max 554). Plan „minimum równoważące” zawsze daje **1 miasto**, niezależnie od liczby miast przegrywającego (1, 2, 3, 5, 8). Nie da się uzyskać „pięciu miast” — `cap` nigdy nie jest wiążący. Nadpłata to 1225–1655 PN (2,2–4,0 × ceny), a kod nie ma mechanizmu wydania reszty (PN→złoto). To jest absurd z dispatchu („jedno miasto warte wielokrotność ceny; wymagany zwrot reszty”).

**[3] Etapy zmęczenia (C = 615, wartość bazowa z acceptance-points; `wearinessPeaceItemPw`):**

| L (zmęczenie) | x = wearinessPeaceX | Z (PW zmęczenia) | R = C − Z | miasta potrzebne w ofercie (ceil(R/1840)) |
|---|---|---|---|---|
| 0,50 | 0,000 | 0 | 615 | 1 |
| 0,65 | 0,500 | 154 | 461 | 1 |
| 0,80 | 1,000 | 615 | 0 | 0 |
| 0,90 | 1,000 | 615 | 0 | 0 |
| 1,00 | 1,000 | 615 | 0 | 0 |

Uwaga: `wearinessPeaceItemPw` używa stałej C = 615, a cena wymuszonego pokoju (`requiredPn`) wynosi 0 / 185 / 554. To dwie różne ceny w kodzie (pozycja PW zmęczenia w tabeli vs. cena z `aiAiPeaceRequiredPn`). Nie zmieniano; do wyjaśnienia przy decyzji.

**[4] Minimalność planu:** brute force na 4000 losowych pulach (2577 sprawdzonych, gdzie pokrycie istnieje): liczba miast planu = minimum miast pokrywających C w 2577/2577 przypadków (niezgodne: 0). Plan jest minimalny co do LICZBY miast (greedy: najtańsze pokrywające, a gdy żadne — największe). Nadpłata wynika z niepodzielności miast, nie z błędu planu.

**[5]** Przy proponowanym cap (N − 1) wiersze N = 2 z C > 0 oddają 1 miasto z nadpłatą > 0: 3 z 3 (potwierdza absurd z [2]). Przy obecnym cap (N − 3) wiersze N = 2 oddają 0 miast (pokój bez miast), więc dzisiejszy kod nie ma tego absurdu, a wymusza pokój bez zapłaty przy ≤ 3 miastach.

## DO DECYZJI WŁAŚCICIELA (DECISION_REQUIRED, opcje)

Stan obecny w kodzie (bez zmian): wymuszony pokój przy ≤ 3 miastach przegrywającego = pokój BEZ miast (cap = N − 3 ≤ 0); przy ≥ 5 miastach = 1 miasto (jak w [2]). Czyli dziś też praktycznie zawsze 1 miasto albo 0.

- **A — wydawanie reszty:** plan minimalny jak dziś (1 miasto), nadpłata zwracana przegrywającemu w złocie/surowcach (PN→złoto). Wymaga nowej mechaniki zwrotu (kod poza zakresem tego tematu; osobny temat z decyzją o kursie PN→złoto).
- **B — nadpłata zostaje (akceptacja):** pokój wymuszony zawsze oddaje 1 miasto (minimum równoważące = 1 przy tej wycenie), bez zwrotu. Najprostsze; kod zmienia tylko próg (`minMiastPoOddaniu` → 1) i opisy. Zarzut: stolica/jedno miasto dominuje cenę, a „pięć miast” z zakresu ownera nie wystąpi.
- **C — skala wyceny miasta:** zmiana stałych `MIASTO_PN_BAZA` / `MIASTO_PN_NA_OBYWATELA` (np. tak, by 1 miasto ≈ cena), tak aby minimum równoważące dawało 1–5 miast zależnie od wielkości miasta — decyzja balansowa (liczby: właściciel).
- **D — wariant A z dispatchu bez zmian wyceny:** „tylko stolica → wojna trwa” jako jedyne ograniczenie, a cena 0 → pokój (zgodnie z dziś). Nie rozwiązuje nadpłaty (łączyć z A lub B).

Rekomendacja Operatora: B jako najmniejsza zmiana + jawne zapisanie nadpłaty w opisie; C jeśli właściciel chce realnego zakresu 1–5 miast. Bez decyzji kodu nie zmieniano.

## TESTY

- Pomiar: `node tools/diplo-weariness-city-table-measure.cjs` (z `gra/`, z esbuild z `/tmp/wear-q1/npm`) — exit OK, liczby jak wyżej.
- `diplo-weariness-*` (tools/*.cjs) i `tsc --noEmit`: NIE ZMIERZONO — w worktree brak `gra/node_modules` (tylko `/tmp/wear-q1/npm` z esbuild). Kod gry nie zmieniony, więc nie uruchamiano bramek zależnych od `node_modules`. Do zrobienia przy fazie 2 po decyzji.
- Symulacja `weary40-sim-measure.cjs` (≥3×150 tur): NIE ZMIERZONO (wymaga `three`/`node_modules`).
- Mutacja `minMiastPoOddaniu=3`: nie dotyczy (kod bez zmian).

## BLOKADY

- Decyzja właściciela (opcje A–D wyżej) — bez niej faza 2 nie może ruszyć (kryterium dispatchu).
- Brak `gra/node_modules` w worktree (blokuje testy `diplo-weariness-*` i `tsc`).
- Rozbieżność C = 615 (`wearinessPeaceItemPw`) vs `requiredPn` 0/185/554 — do wyjaśnienia (osobna decyzja, nie blokuje wyboru A–D, ale wpływa na liczby).

## RUNDY

1/5 (runda 1). Werdykt: DECISION_REQUIRED.

## NASTĘPNY KROK

Orkiestrator: pytanie ABC do właściciela (opcje A–D + rekomendacja B lub C, z tabelą [2] i [3]). Po decyzji: Runda 2 — FAZA 2 wg wybranej opcji (w tym zmiana `minMiastPoOddaniu`/opisów i testy `diplo-weariness-forced-peace-test.cjs` F1/F3/F8 oraz nowy test „1 miasto + stolica → 1; 5 miast → >1 wg wyceny; tylko stolica → wojna trwa; cena 0 → jak dziś”).

## UWAGI-DLA-ORKIESTRATORA

- Dispatch w `00-dispatch-DODATEK-claude.md` podaje SHA kandydata `bbaa3b27…`; zadanie rundy podaje `439b1e1a…` (origin/main). Pracowano od `439b1e1a…` (zgodnie z zadaniem). `bbaa3b27…` istnieje w repo jako commit (`cat-file -t`), ale nie był użyty jako baza; rozbieżność do rozstrzygnięcia przez orkiestratora.
- Stała C = 615 w `wearinessPeaceItemPw` vs `requiredPn` 0/185/554 — rozbieżność do wyjaśnienia przy okazji decyzji.
- Wiersze planu z `cap = N − 3` (kod dziś) vs proponowany `cap = N − 1` — zmiana obejmuje tylko przypadki N = 2 (dziś 0 miast, po zmianie 1 miasto za 1840 PN).
- Do zgłoszenia (poza zakresem): brak `node_modules` w worktree blokuje bramki `diplo-weariness-*`; warto dodać bootstrap do setupu środowiska (orkiestrator decyduje).

## DEPLOY/PUSH

NIE WYKONANO (commit lokalny w worktree; bez push na main; bez integracji i deployu).
