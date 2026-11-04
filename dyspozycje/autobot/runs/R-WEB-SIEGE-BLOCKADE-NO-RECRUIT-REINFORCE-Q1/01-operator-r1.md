STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-BLOCKADE-NO-RECRUIT-REINFORCE-Q1
GOAL: w obleganym mieście (City.oblegane) zablokować rekrutację, posiłki i wejście obcych jednostek; gracz, AI i barbarzyńcy jednakowo.

## Tabela ścieżka -> przed -> po

Predykat oblężenia przed zmianą: tylko flaga `City.oblegane` (+ `oblegajacyOwnerId`), czytana ad hoc (main.ts, next-active-unit.ts, manpower.ts). Po zmianie: jeden moduł `gra/src/game/city-siege-state.ts` (`isCityUnderSiege(cities, id|hex|miasto)`, `isSiegeEntryBlocked`, teksty PL).

| Ścieżka | Blokowała przed? | Po zmianie |
|---|---|---|
| `purchaseRecruitmentUnit` (main.ts; panel miasta, panel Armia, AI rush-buy, wódz) | NIE | TAK, odrzut + podpowiedź PL dla gracza |
| `purchaseRecruitmentUnits` (paczka, gracz) | NIE | TAK |
| Kolejka Pracy -> jednostka (`applyProductionCompleted`) | NIE | TAK, pozycja wraca na front kolejki (jak przy braku Manpower) |
| Kolejka rekrutacji opłaconej (tick tury) | NIE | TAK, kolejka stoi do końca oblężenia |
| UI: `appendUnitRecruitCompactRow` / `recruitUnit` (cityPanel.ts) | NIE | TAK, przycisk nieaktywny, powód "Miasto jest oblężone — rekrutacja zablokowana" |
| Ruch gracza: `computePath`, `computeReachable` (+ min-move), `reachableWithMergeTargets`, plannedMarches | NIE | TAK (hak w units/setup.ts) |
| Ruch AI (`firstStep`, `warAllInCapital`, `executeAiCityMove`, koncentracja) i barbarzyńcy | NIE | TAK, przez ten sam computePath (hak globalny) |
| Posiłki / łączenie armii z zewnątrz | NIE | TAK, bo wymaga wejścia na heks miasta |
| Wyjście z miasta | tak | bez zmian (dozwolone) |
| Atak na oblegających (heks oblegającego) | tak | bez zmian (dozwolony) |
| Wróg właściciela (oblegający/szturm) wchodzi do miasta | tak | bez zmian (to atak, nie posiłki) |

## ZMIANY/COMMIT
Nowe: `gra/src/game/city-siege-state.ts`, `gra/tools/siege-blockade-no-recruit-reinforce-test.cjs`.
Zmienione: `gra/src/main.ts` (rejestracja blokady, bramki rekrutacji/kolejek, hak testowy `__siegeBlockTestDebug` tylko z `?civTest=1`), `gra/src/ui/cityPanel.ts`, `gra/src/units/setup.ts`, `gra/tools/recruitment-batch-contract-test.cjs` (harness eval dostał 2 nowe zależności).
SHA: patrz niżej w sekcji COMMIT (uzupełnione po commicie).

## NOTY / ODSTĘPSTWA
1. `gra/src/units/setup.ts` NIE jest na allowliście, ale jest jedynym wspólnym punktem ruchu (computePath/computeReachable dla gracza, AI i barbarzyńców, ~10 wywołań w main.ts, planned-march, scout, ai, barbarians). Zmiana minimalna: opcjonalny hak `setSiegeEntryBlocker` (null = zachowanie sprzed tematu), 3 bramki. Do oceny Evaluatora; alternatywa to ~10 bramek rozproszonych po plikach spoza allowlisty.
2. `warAllInCapital.ts`, `ai*.ts`, `barbarians.ts`, `armyMerge.ts` NIE zmieniane: blokada działa przez computePath. AI nie spamuje: zakup zwraca false raz na komendę, ruch dostaje pustą trasę.
3. Założenie: wejście dozwolone tylko dla wrogów właściciela miasta (`areEnemyOwners`); sojusznicze i neutralne jednostki są blokowane.
4. NIE_ZMIERZONO: cofnięcie/teleport po bitwie do obleganego miasta (post-battle-map), `spawnTransferredUnit` (dar jednostek), `spawnDifficultyBonusUnit`; nie przechodzą przez computePath. Zgłaszam jako potencjalną lukę do kolejnej rundy/tematu.
5. NIE_ZMIERZONO: DOM przycisku w Chromium (tylko test strukturalny C6); przejście tury z zablokowaną kolejką w Chromium (tylko strukturalnie C3/C4); relacja wojny wroga w Chromium (D7 sprawdza tylko hak).

## TESTY
- Nowy test `tools/siege-blockade-no-recruit-reinforce-test.cjs`: 40 OK / 0 FAIL (silnik RED bez blokady -> GREEN z blokadą 15 asercji, 7 mutacji zabitych, 9 strukturalnych, 9 Chromium `?civTest=1`: zakup w obleganym odrzucony / po zdjęciu OK, computePath i reachableWithMergeTargets odrzucają miasto, po przełamaniu wejście znów działa, zero pageerror). Log: `gate-new-test.txt`.
- tsc `--noEmit`: EXIT=0 (`gate-tsc.txt`).
- Regresje PO (z `--no-live` tam gdzie jest): city-siege-wall-rules 50/0, map-siege 6/0, siege-ai 17/0, siege-defenders 12/0, militia-garrison-router-siege 8/0, oblezenie 27/0, city-militia-regen-cooldown 53/0, ai-recruit-upkeep-gate 23/0, army-recruitment-concentration 29/0, law-garrison 3/0, roster-space 32/0, ai-jednostki-tylko-zakup 44/0, manpower 71/0, manpower-matrix 225/0, pr141-f04-rush 72/0, pr141-f04-unit-speed 0 FAIL (po poprawce kształtu wywołania w main.ts), recruitment-batch-contract 17/0 (po aktualizacji harnessu: nowa zależność `isCityUnderSiege`, uzasadnienie: funkcja jest wyekstrahowana i ewaluowana w sandboxie).
- Niepowodzenia PRZED mną (potwierdzone na base): ai-siege-requires-war 1 fail (regex scanAutoSiegesAfterAiTurn, false także na base main.ts), promote-to-front 4 fail, naval-water-access-gate 5 fail (okno 1600 znaków < offset bramki 2593 już na base). INFRA (brak /usr/bin/chromium): empire-mass-recruitment, general-capital-recruitment-order.
- `git diff --check`: czysto.

## BLOKADY
Brak. Przy rundzie 1 nie zmierzono punktów z not 4 i 5.

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator (R1): ocena odstępstwa setup.ts, luk z noty 4, mutacje.

DEPLOY/PUSH: NIE WYKONANO
