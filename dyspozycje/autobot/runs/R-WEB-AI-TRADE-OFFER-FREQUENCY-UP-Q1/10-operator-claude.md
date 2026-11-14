# R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1 — Operator, runda 3/5 (O1: parytet wyceny)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (oferty handlowe AI->gracz, pomiar w pełnej grze)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1
GOAL: w scenariuszu „prepared” z ekonomią gracza (3 ziarna × 150 tur) oferty AI->gracz 3–6 na 100 tur, bez spamu.
BAZA: 6612d1596 (origin/main, dispatch r3). Kod poprawki: ten commit (czubek).
ZMIANY-COMMIT: gra/src/main.ts, gra/tools/measure-ai-trade-offer-frequency.cjs (MEAS_ECON + lejek, przeniesione z db887a9c1), gra/tools/ai-trade-offer-frequency-up-test.cjs (nowy), runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1/** (raport + evidence). gra/data/ai-params.json NIE zmieniono (cooldown propozycji 15, bez zmiany).

## WYNIK (liczby z surowych JSON, evidence/)

Scenariusz: MEAS_ARM=prepared MEAS_ECON=1 MEAS_REL=80 MEAS_TURNS=150, ziarna 1111/2222/3333, tryb przyspieszony, realny endTurn.

| wariant | s1111 | s2222 | s3333 | razem | ofert /100 tur |
|---|---|---|---|---|---|
| baza (6612d15), r3-diag | 0 | 0 | 1 | 1 / 450 | 0,22 |
| po parytecie (r3-fix3) | 1 (sol->glina) | 1 (sol->glina) | 2 (sol->glina, drewno->glina) | 4 / 450 | **0,89** |

Cel 3–6/100 NIE osiągnięty (0,89). Rozkład: 1/0,67/0,67/1,33 na 100 tur per ziarno; nie wszystkie 3 relacje (relacja przypięta na 80, jedna wartość; nie mnożona, zgodnie z dispatchem).

Lejek po poprawce (r3-fix3, tury z 150): 
| ziarno | pod cooldownem | pary (cd) | brak pary | brak nadwyżki AI | para null po obu stronach | ofert |
|---|---|---|---|---|---|---|
| 1111 | 15 | 2 | 135 | 6 | 129 | 1 |
| 2222 | 15 | 5 | 135 | 7 | 128 | 1 |
| 3333 | 30 | 3 | 120 | 6 | 114 | 2 |

Uwaga: „pod cooldownem” = tury z aktywnym cooldownem propozycji (pole cdTurns w JSON); „pary” = tury z parą surowców, które przypadły w cooldownie (cdWithPair). Kolumny „brak pary”/„brak nadwyżki”/„para null” pochodzą z funnelLog-agregatu (noCdPair, noCdNoPair, noCdNoAiSurplus, noCdPairNullBothSides) i liczone są poza cooldownem; nie sumują się do 150, bo kategorie się nakładają. Przed poprawką (baza, r3-diag) pary były znajdowane w 121–137 turach, ale ofert było 0–1.

## DIAGNOZA (dane, nie domysły; evidence/r3-diag/ — instrumentacja tylko logująca, cofnięta)

Warunek odcinający w bazie: wybrana para NIE docierała na stół, bo wycena na wejściu różniła się od wyceny wyboru pary:
1. Mnożnik tur: pick liczył PN z `proposalPnTurnsMultiplier` (×10), wejście na stół (`pnBalanceOpts`) nie. Dane: enqGive=10 vs pickGive=100 (s1111, s3333), 15 vs 150 (s2222) — dokładnie ×turns w każdym wierszu. Pick i wejście liczyły ten sam payload różnymi skalami.
2. Trim po wyborze pary (`trimProposalForZeroBalance`) zmieniał wybrany koszyk: receive 10 -> 0 (po trimie zostawało „AI daje za darmo”), bramka givePn > receivePn odcinała ofertę.
3. Clamp do realnych zasobów wejścia (`clampNegotiationPayloadToRealResources`, turnsMult = 10) usuwał stronę gracza, gdy gracz nie miał zasobu na cały czas wymiany. Wybór pary sprawdzał tylko nadwyżkę na turę, więc wybierał pary nieosiągalne.
Cooldown NIE był ogranicznikiem (zgodnie z r2).

## POPRAWKA (parytet, bez obniżania wymogu uczciwości)

- `gra/src/main.ts`, ścieżka AI->gracz (`zaproponuj_wymiane_cykliczna`):
  a) `pnCyclicOpts` = `pnBalanceOpts` + `tempoGry` + `proposalPnTurnsMultiplier(clampedPayload)` — używane w filtrze bilansu PW i bramce givePn/receivePn (dla innych typów: bez zmian, to ten sam obiekt).
  b) Dla wymiany cyklicznej trim po wyborze jest POMIJANY (`balancedPayload = clampedPayload`). Uzasadnienie: wybór pary już sprawdza te same PN, bramkę uczciwości i podgląd gracza („Przyjmij”); trim zmieniał wybrany koszyk. Filtr bilansu PW i podgląd gracza nadal działają. **Decyzja do oceny Evaluatora** (zmiana zachowania trimu dla wymiany cyklicznej).
  c) `pickAiPlayerCyclicBarter` → `evaluateExactPayload` dodatkowo wymaga `payloadKeepsRealResourcesForPick` (clamp nie zmienia koszyka). Wybierane są tylko pary wykonalne przez cały czas wymiany.
- Brak zmian w ai-params.json, cooldownach, bramkach NNS i wojny/kontaktu/technologii.

Wniosek o ryzyku spamu (dla przyszłej decyzji): po poprawce max 2 oferty/AI/150 tur w pomiarze (1,33/100 tur). Teoretyczny sufit przy cooldownie propozycji 15 tur i limicie 1 aktywnej oferty na parę: ~6,7 ofert/100 tur/AI. Pomiar go nie osiąga (głównie brak wykonalnej pary).

## TESTY (surowe wyniki)

- `npx tsc --noEmit` → exit 0.
- Bramki referencyjne (node tools/…): logic-test „LOGIC OK (213/213)”; tech-tree-test „20 pass, 0 fail”; research-test „PASSED: 33 / FAILED: 0”; unit-replace-test exit 0 (wszystkie [OK]); combat-test „All sanity checks passed.”; ai-trade-proposal-branch-test „10 passed, 0 failed”; ai-trade-proposal-to-player-test „25 assertions passed”.
- Nowy test `gra/tools/ai-trade-offer-frequency-up-test.cjs`: „WYNIK: 12 OK, 0 FAIL” (exit 0). Części: A) zachowanie silnika (mnożnik per_turn); B) strażnik źródła parytetu w main.ts (pnCyclicOpts, brak trimu dla cyklicznej, bramka na pnCyclicOpts, evaluateExactPayload z payloadKeepsRealResourcesForPick); C) cooldown propozycji = 15 (bez zmian).
  - Czerwony na bazie 6612d15: „WYNIK: 4 OK, 7 FAIL” (exit 1).
  - Dowód mutacyjny (przywrócona stara bramka na pnBalanceOpts): „WYNIK: 9 OK, 2 FAIL” (exit 1). Plik main.ts przywrócono (cmp OK).
- `gra/tools/ai-trade-oneshot-overpay-limit-test.cjs`: exit 1 — znany dług z bazy (asercja tekstowa „main.ts enqueue filter calls aiOneshotHandelOverpaysPlayer(...)”); linia wywołania NIE zmieniona (sprawdzone grep: 1 trafienie w bazie i w poprawce). Nie naprawiano (dispatch r3 pkt 5).
- `git diff --check`: czysto.
- NIE_ZMIERZONO: zachowanie limitu „1 aktywna oferta/AI” i odstępu 15 tur na żywo (test r3 sprawdza tylko wartość cooldownu i strażnika parytetu; dedup/limit to istniejący kod). Nie dodano testu behawioralnego limitu/odstępu.

## DECYZJA WŁAŚCICIELA (wymagana)

Parytet usunął błąd (0,22 -> 0,89/100 tur; 4 oferty zamiast 1), ale cel 3–6 wymaga zmiany reguły. Opcje:
- A. Przyjąć 0,89/100 tur jako wynik parytetu i zamknąć temat (cel nieosiągnięty, udokumentowany).
- B. Sprawdzać zasoby gracza przy wyborze pary tylko na 1 turę zamiast na cały czas wymiany (10 tur). Więcej par, ale oferty, których gracz nie udźwignie przez czas wymiany. Zmiana reguły wykonalności (wymaga ABC).
- C. Dobierać mniejszą paczkę (giveQty/receiveQty) do realnych zasobów zamiast odrzucać parę. Najmniej zmienia zasady gry (oferta zostaje w pełni wykonalna), ale to nowy mechanizm — nie zmierzono.
- D. Zmienić scenariusz pomiaru (realna produkcja zamiast stanu ECON). To zmiana pomiaru, nie gry.
Rekomendacja orkiestratora: C (nowy temat + pomiar); NIE_ZMIERZONO, czy C osiągnie 3–6.

## EVIDENCE

- runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1/evidence/r3-base/ — baza (ECON), s1111, pełny JSON + log.
- runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1/evidence/r3-diag/ — baza + instrumentacja [R3PN] (enq vs pick PN), s1111/s2222/s3333 (cofnięta po pomiarze).
- runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1/evidence/r3-fix3/ — poprawka (finalna), s1111/s2222/s3333.
- Pośrednie kroki (poprawka bez trimu / bez clampu pick) są opisane powyżej; ich surowe pliki usunięto z worktree, bo nie są wynikiem finalnym.

## TEMATY POZA ZAKRESEM (UWAGI-DLA-ORKIESTRATORA)

- ai-trade-oneshot-overpay-limit-test: czerwony na bazie (dług, osobny temat).
- Dispatch r2 wskazywał `cdBlockedPairOrProbe` (agregat nieistniejący w repo) — pominięty, zastąpiony lejkiem.

NASTĘPNY KROK: decyzja właściciela A/B/C/D (po niej ewentualnie r4 Operator lub zamknięcie); Evaluator: ocena zmiany trimu dla wymiany cyklicznej (pkt b).
RUNDY: 3/5.
DEPLOY/PUSH: NIE WYKONANO.
