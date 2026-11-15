# R-WEB-TEST-DEBT-BASE-RED-MAIN-Q2 — obrona (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (obrona; werdykt należy do Evaluatora/FC)
DOMAIN: GAME (tylko gra/tools/*test*.cjs i *live*.cjs; kod gry bez zmian)
TEMAT: R-WEB-TEST-DEBT-BASE-RED-MAIN-Q2
GOAL: po zarzutach Evaluatora doprowadzić diplo-truce-live do zielonego z klasyfikacją przyczyny z dowodem, zamknąć zarzuty 2 i 3 (cleanup, stabilność, pomiar na main).
BAZA: cc7e694de (kandydat Operatora r1) → commit kodu obrony `e09623565` + ten raport (commit osobny).
ZMIANY-COMMIT: `e09623565` — gra/tools/diplo-truce-live-test.cjs, gra/tools/trade-route-remove-stock-flow-live-test.cjs. Allowlista OK; brak zmian w gra/src, gra/data, wikiBundle, WERSJE.md. Dowody PNG w repo nietknięte (live testy uruchamiane z katalogiem dowodów w scratchpadzie).

## Odpowiedzi na zarzuty Evaluatora

**Zarzut 1 (BLOKUJĄCY, diplo-truce-live L2 czerwony) — PRZYJMUJĘ.**
Diagnoza na zmierzonym przebiegu (logi w scratchpadzie sesji: truce-run1.log, truce-run2.log):
- Log `[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)` powtarzany ok. 40 razy od tury 2. Tekst gry w DOM: „Nie można zakończyć tury. Spichlerz państwa (żywność): po zakończeniu tury zabraknie 46.”
- Wykryty overlay `civ-wiki-hub` NIE jest blokadą (w logach brak blokad z jego powodu). Blokadą jest bramka NNS gracza (R-WEB-ECON-NO-NEGATIVE-STOCKS, decyzje #365/#368), która od tury 2 blokuje endTurn, bo scenariusz playtest nie ma bufora żywności.
- Klasa: **A** (nieaktualny scenariusz testu wobec obowiązującej reguły gry; kod gry poprawny, nie zmieniany). Dowód: powyższe linie logu i tekst bramki.
- Poprawka (tylko test): URL dopięty do `?playtest=mapa&civTest=1` (hak `__nnsMeasureDebug.setPlayerGranary` istnieje tylko przy civTest; ten sam wzorzec co end-turn-gate-live-test.cjs) oraz SETUP `setPlayerGranary(999)` po `suppressVictoryForTest`.
- Nie skracałem scenariusza: L2a/L2b wymagają okna rozejmu 5 tur (L1c: tura+5); skrócenie usunęłoby asercje. Stabilizacja = czekanie na stan (overlay, isEndTurnInProgress), nie podnoszenie limitu.
- Wynik: truce-run4.log 24 pass / 0 fail (exit 0); powtórzenie truce-run5.log 24 pass / 0 fail (exit 0). Przed poprawką: truce-run1.log 13 pass / 1 fail (L2).
- Pomyłka po drodze, naprawiona: asercja SETUP na wartości zwracanej przez setPlayerGranary (void) — usunięta; skuteczność potwierdza przejście L2.

**Zarzut 2 (połykanie timeoutu `.catch(() => {})`; L2b bez asercji) — PRZYJMUJĘ część o połykaniu; ODRZUCAM żądanie asercji gałęzi odmowy w tej rundzie.**
- `.catch(() => {})` usunięte. Czekanie na zamknięcie koszyka/audiencji jest teraz asercją `L2-pre` (selektor zawężony do `.civ-diplo-basket-overlay, .civ-diplo-audience`; `[role=dialog]` usunięty, bo łapał civ-wiki-hub, który nie blokuje tury). Wynik: `OK L2-pre`.
- L2b-odmowa: pozostaje jawnie NIE_ZMIERZONO (komunikat konsolowy, poza licznikiem pass/fail). Dispatch dopuszcza oznaczenie jawne; gałąź odmowy wymaga zasiewu armii, którego scenariusz nie ustawia (osobny temat).

**Zarzut 3 (drobne: pomiar na main 46b845913, bundle trade-route w tmp, r-bitwa N>1) — CZĘŚCIOWO.**
- trade-route bundle: PRZYJMUJĘ. Dodane sprzątanie przy każdym wyjściu (`process.on('exit', rmSync)`), tylko dla bundle utworzonego przez test. Dowód: po przebiegu (12 pass / 0 fail, exit 0) nie powstał nowy `civ-trsf-bundle-<pid>`; w /tmp pozostał tylko katalog 21569 sprzed obrony.
- truce-live, domyślny katalog tmp: to samo sprzątanie (tylko gdy nie podano argv[2]).
- r-bitwa real-render N>1: PRZYJMUJĘ. Dodatkowo 2 przebiegi, oba WSZYSTKIE ASERCJE PASS, exit 0 (łącznie z przebiegiem Evaluatora: N=3).
- Pomiar na aktualnym origin/main 46b845913: **NIE_ZMIERZONO**. Różnice gra/src między kandydatem a main (`git diff --stat cc7e694de origin/main -- gra/src gra/data`): 7 plików, 49 wstawień / 23 usunięć (ai-trade-proposal.ts, civ-bonuses.ts, civ-matrix-semantic.ts, defenseBreakdown.ts, main.ts, ui/preBattle.ts, data/wikiBundle.json). Nie przełączałem worktree na origin/main w tej rundzie (wymaga osobnego, bezpiecznego checkoutu; zmerge'owane drzewo mierzy integracja orkiestratora). Ryzyko dla truce-live: zmiany w main.ts dotykają ścieżek preBattle/ai-trade, nie bramki NNS; nieprzeliczone.

## Wyniki bramek (surowe wyjście, worktree na cc7e694de + commit obrony)
- `npx tsc --noEmit -p .` (gra/): exit 0
- logic-test: `LOGIC OK (213/213)`, exit 0
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
- combat-test: `COMBAT TEST: 6/6 pass`, exit 0
- diplomacy-city-cession-r3-test: `72 pass, 0 fail`, exit 0
- json-descriptions-sync-test: `19 pass / 0 fail`, exit 0
- diplo-truce-r1-test: `31 pass / 0 fail`, exit 0
- diplomacy-stol-pw-sum-test: `168 pass, 0 fail`, exit 0
- diplo-truce-live-test: `24 pass / 0 fail`, exit 0 (x2)
- trade-route-remove-stock-flow-live-test: `12 passed, 0 failed`, exit 0
- r-bitwa-etykieta-tozsamosc-strony-real-render-test: `WSZYSTKIE ASERCJE PASS`, exit 0 (x2)
- `git diff --check`: czysto

## Tabela (skrypt | przed | klasa | działanie | po)
| skrypt | przed | klasa | działanie | po |
|---|---|---|---|---|
| diplomacy-city-cession-r3 | 72/0 (r1) | A | bez zmian w r2 | 72/0 |
| json-descriptions-sync | 19/0 | D/A | bez zmian w r2 | 19/0 |
| diplo-truce-r1 | 31/0 | A | bez zmian w r2 | 31/0 |
| diplo-truce-live | 13/1 (L2, ten przebieg) | A (NNS, scenariusz bez bufora) | civTest + SETUP bufora, L2-pre bez połykania | 24/0 x2 |
| diplomacy-stol-pw-sum | 168/0 | — | bez zmian | 168/0 |
| trade-route-remove-stock-flow-live | 12/0 | D (bundle w tmp) | sprzątanie bundle | 12/0 |
| r-bitwa real-render | PASS (1 przebieg Evaluatora) | D | bez zmian w teście | PASS x2 |

## BLOKADY
- Brak blokad po stronie testów. NIE_ZMIERZONO: stan na origin/main 46b845913 (zarzut 3); L2b-odmowa (jawnie poza pass/fail).

## KANDYDACI KLASY B (błąd kodu gry)
- Brak. Żadna z pozycji nie wymaga zmiany kodu gry.

## UWAGI-DLA-ORKIESTRATORA
- /tmp zawiera pozostałości nie-moje w tej rundzie: /tmp/civ-truce-live-23300, /tmp/civ-truce-live-27540 (nie usuwałem) oraz /tmp/civ-trsf-bundle-21569 (root, sprzed obrony). Do sprzątania przez orkiestratora.
- Bramka NNS w harnessie może dotykać innych live testów bez bufora spichlerza; warto sprawdzić przy tematach #390/#417 (harness ekonomii AI).
- Logi i zrzuty przebiegów są w scratchpadzie sesji Operatora, nie w repo.

## RUNDY
2/5 (runda 1: kandydat cc7e694de; runda 2: ten raport). Nie zużyto rund Sonnet.

## NASTĘPNY KROK
Evaluator: ponowna ocena commitu `e09623565` oraz tego raportu i decyzja o zarzucie 3 (pomiar na main: NIE_ZMIERZONO). Integracja i ewentualny pomiar na zmerge'owanym drzewie: orkiestrator.

DEPLOY/PUSH: NIE WYKONANO
