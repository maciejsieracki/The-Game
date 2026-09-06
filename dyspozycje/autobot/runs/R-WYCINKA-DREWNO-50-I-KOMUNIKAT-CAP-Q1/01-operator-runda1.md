# R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1 — Operator, Runda 1

MODEL+EFFORT: Sonnet 5, effort medium.

## Rozbieżność „5 vs 25” (GOAL pkt 3, zbadane, nie zgadywane)

`gra/data/terrain-improvements.json` (pole `uwagi` wpisu `wyrab`, przed edycją)
zawierało wprost historię: „plon +25 Drewna × 1 tura (…) R-EKONOMIA-SUROWCE-SKALA-5X-Q1
Runda 2, Maciej 2026-08-13, B2: x5 -> 25, bylo 5”. Czyli: pierwotna wartość
`praca_per_tura` faktycznie wynosiła **5**, a globalna decyzja balansowa
R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (skalowanie surowców ×5 dla całej gospodarki)
podniosła ją do 25 dnia 2026-08-13. Właściciel w zgłoszeniu pamiętał punkt
startowy sprzed tamtej decyzji („5, jak teraz” — w jego percepcji „teraz” =
przed jego własną wcześniejszą decyzją x5, którą prawdopodobnie już zapomniał).
To NIE jest efekt cichego przycięcia magazynem (PROBLEM 2) — cap wpływałby
tylko gdyby magazyn był blisko limitu w danej turze, a wpis w danych jawnie
dokumentuje inne źródło liczby 5. Nie zmieniałem ECHO ani celu 50 — zgodnie
z dyspozycją to tylko wyjaśnienie, nie DECISION_REQUIRED.

## Zmiany

1. `gra/data/terrain-improvements.json`: `wyrab.wycinka.praca_per_tura` 25 → 50,
   `tury` bez zmian (1). `warunek` i `uwagi` zaktualizowane (nowy wpis
   decyzyjny dopisany, stara historia 5→25 zachowana, nieusunięta).
2. `gra/src/main.ts` (WYŁĄCZNIE ok. linii 28955-28963, ścieżka gracza —
   numery linii zweryfikowane grepem PRZED edycją, zgodne z ostrzeżeniem
   dyspozycji): `creditOwnerResourceStock(...)` teraz przypisane do nowej
   zmiennej `drewnoCredited`, komunikat `showHintMessage('Wycinka: +' + ... )`
   używa `drewnoCredited` zamiast surowego `drewnoCredit` — identyczny wzorzec
   jak ścieżka AI (l. ok. 32374-32388), która była już poprawna i pozostała
   nietknięta.
3. `gra/src/game/improvement-tech.ts`: NIE dotknięty — fallbacki `?? 20`/`?? 3`
   pozostają martwe (JSON zawsze ma `wycinka.praca_per_tura`), naprawa #2 tego
   nie wymagała.
4. UI/CivPedia: grep `25.*Drewna|Drewna.*25` w `gra/src/` — zero trafień.
   Opis w `improvement-tech.ts:80` buduje tekst DYNAMICZNIE z
   `meta.clearing.pracaPerTura` (JSON), więc automatycznie pokaże 50 — brak
   sztywnego „25” do naprawy.
5. `gra/tools/wyrab-wycinka-nazwa-live-test.cjs` (istniejąca bramka nazewnictwa,
   allowlista): zaktualizowany literal-check `[3]` na nową zmienną
   `drewnoCredited` w komunikacie gracza (stary test asertował dosłowny
   string ze starą nazwą zmiennej — bez tej poprawki bramka fałszywie
   czerwieniałaby po naprawie #2).
6. Nowa bramka `gra/tools/wycinka-drewno-cap-test.cjs`: patrz TESTY niżej.

## TESTY

- `node ./node_modules/typescript/bin/tsc --noEmit` z `gra/` → **0 błędów**.
- 5 bramek referencyjnych — wszystkie zielone:
  logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6.
- Istniejące bramki wyrębu (grep `tools/*wyrab*`, `*clearing*`, `*wycink*`):
  znalezione `wyrab-wycinka-nazwa-live-test.cjs` (zaktualizowany, patrz wyżej,
  49/49 PASS po poprawce) i `rzeka-farma-wyrab-krok1-measure.cjs` (POMIAR,
  nie bramka — czyta `praca_per_tura` dynamicznie z JSON, bez zmian
  wymaganych; stały komentarz `// 25 x 1` przy jednej stałej pozostawiony
  nietknięty, poza allowlistą jako nieistotny dla wyniku).
- Nowa bramka `gra/tools/wycinka-drewno-cap-test.cjs` — **15/15 PASS**:
  - [0] `praca_per_tura === 50`, `tury === 1`.
  - [1] statyczna weryfikacja źródła: `drewnoCredited` przypisane ze zwrotu
    `creditOwnerResourceStock`, komunikat gracza go używa, stary wzorzec
    (`+ drewnoCredit + ' Drewna'`) zniknął, ścieżka AI nietknięta.
  - [2]-[3] DOWÓD REALNY: PRAWDZIWA (nie mock) `creditOwnerResourceStock` z
    magazynem `cap-10` (cap=100, stock=90), surowy plon 50 → zwrócone i
    zapisane do magazynu **10** (nie 50); komunikat zbudowany z tej wartości
    zgadza się z faktycznym przyrostem magazynu.
  - [4] KONTROLA MUTACYJNA: w tym samym scenariuszu komunikat zbudowany
    STARYM wzorcem (surowe `drewnoCredit=50`) daje „+50 Drewna”, podczas gdy
    faktyczny przyrost magazynu to 10 — **NIEZGODNE**, asercja to jawnie
    potwierdza (log `[M]` w konsoli). Naprawiony wzorzec pozostaje zgodny.
  - [5] scenariusz kontrolny (magazyn daleko od capu): stary i nowy wzorzec
    dają tę samą wartość — naprawa nie zmienia normalnego przypadku.
  - **Dodatkowa weryfikacja mutacyjna na PRAWDZIWYM `main.ts`** (nie tylko
    symulacja wewnątrz testu): cofnięto naprawę #2 w `gra/src/main.ts`
    (kopia zapasowa, string-replace do stanu sprzed naprawy), uruchomiono
    `wycinka-drewno-cap-test.cjs` → **2 asercje w bloku [1] poczerwieniały**
    (exit 1, 13 pass/2 fail), następnie przywrócono plik z kopii zapasowej
    (`diff` potwierdził identyczność z wersją naprawioną) i ponowne
    uruchomienie dało 15/15 PASS. Dowód mutacyjny wymagany dyspozycją
    dostarczony.

## BLOKADY

Brak.

## ZMIANY/COMMIT

Commit `7bfa0724` na gałęzi `autobot/R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1`
(worktree `/home/user/wt-wycinka`), pliki: `gra/data/terrain-improvements.json`,
`gra/src/main.ts`, `gra/tools/wycinka-drewno-cap-test.cjs` (nowy),
`gra/tools/wyrab-wycinka-nazwa-live-test.cjs`. Zgodne z allowlistą, `git add`
tylko wymienionych plików (bez `-A`/`.`). `git diff --check`: czysto.

---

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1
GOAL: praca_per_tura 25->50 + komunikat gracza pokazuje faktycznie zapisaną (przyciętą do capu) ilość Drewna, nie surową wartość przed capem
ZMIANY/COMMIT: 7bfa0724 (gra/data/terrain-improvements.json, gra/src/main.ts, gra/tools/wycinka-drewno-cap-test.cjs [nowy], gra/tools/wyrab-wycinka-nazwa-live-test.cjs)
TESTY: tsc --noEmit 0 błędów; logic-test 213/213; tech-tree-test 19/19; research-test 33/33; unit-replace-test 13/13; combat-test 6/6; wyrab-wycinka-nazwa-live-test 49/49; nowa bramka wycinka-drewno-cap-test 15/15 (w tym dowód mutacyjny na realnym main.ts: cofnięcie naprawy → 2 FAIL/exit 1, przywrócenie → 15/15 PASS)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
