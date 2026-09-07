# R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1 — Operator runda 1

## GOAL pkt 1-3 — dwa miejsca z GENEZY

Świeży grep (`grep -n "pendingAutoRationForNextTurn"` i
`grep -n "promptMergeIfCoLocated|deferredMergePrompts"` na aktualnym stanie
`gra/src/main.ts`) potwierdził numery linii zbliżone do dyspozycji:

1. **main.ts:10910** (`promptMergeIfCoLocated`, guard PRZED logiką odkładania):
   `if (!rep || rep.ownerId !== 0) return;` → `if (!rep || !isHuman(rep.ownerId)) return;`
2. **main.ts:28907** (`pendingAutoRationForNextTurn`, wewnątrz
   `triggerPlayerEndTurn()`): `if (ownerId === 0) { pendingAutoRationForNextTurn = ... }`
   → `if (isHuman(ownerId)) { ... }`

Kontekst przeczytany w całości przed zmianą (obie funkcje, komentarze wokół).
Semantyka obu warunków to rzeczywiście "czy to fotel człowieka" — nie coś innego
przebrane pod `ownerId===0` (np. nie test "czy stolica", nie test kolejności).

## Zasięg domknięcia `isHuman`

`isHuman` zdefiniowana main.ts:10296, wewnątrz TEGO SAMEGO domknięcia najwyższego
poziomu co `promptMergeIfCoLocated` (10898) i `triggerPlayerEndTurn` (28497) —
potwierdzone: wszystkie trzy na wcięciu 4 spacje (ten sam poziom zagnieżdżenia),
`isHuman` już używana wewnątrz `triggerPlayerEndTurn` (linie 1894, 26035, 26047,
26068 itd. — akcesory Etapu 3, w tym samym domknięciu). Brak potrzeby importu.

## Dowód no-op

`isHuman(ownerId) = isHumanOwner(humanSeats, ownerId) = humanSeats.humanOwnerIds.includes(ownerId)`.
Dziś `humanSeats.humanOwnerIds = [HUMAN_OWNER_PRIMARY] = [0]` (main.ts:10284,
`human-owners.ts:21`). Domena realna `ownerId`: `0` (gracz) → `[0].includes(0)===true`
= `ownerId===0`. Dodatni (AI, `isAiOwner`) → `[0].includes(N>0)===false` =
`ownerId===0` też `false`. Sentinel barbarzyńca `BARBARIAN_OWNER_ID=-1` i rebelianci
`-99` (main.ts:5006, import `BARBARIAN_OWNER_ID` main.ts:1142) → `[0].includes(-1|-99)===false`,
identyczne. Behawioralny no-op potwierdzony dla całej domeny.

## GOAL pkt 4 — inne analogiczne miejsca w `triggerPlayerEndTurn()`

Świeży grep całej funkcji (28497-33102) pod kątem `pending*`/kolejek/`defer*`
zawężonych do `ownerId===0`: znaleziono TRZECIE miejsce tej klasy —
`deferredPlayerUnitRevealIds.add(newUnitId)` @ main.ts:30095, guard
`if (city.ownerId === 0) { if (endTurnInProgress) { ...add... } }`.

**NIE dodałem go do zakresu tej rundy.** To NIE jest coś, co recon przeoczył —
recon (`01-operator-runda1-analiza.md`) opisuje je explicite jako **„Ryzyko #4
(potwierdzenie z dyspozycji, nie nowe)"**, ze WŁASNĄ rekomendacją inną niż #4b/#4c
(struktura keyowana ownerem / generalizacja, do zaplanowania osobno w rundzie 2
implementacji Etapu 4 — nie prosta podmiana warunku w tym audycie). Dyspozycja
tego tematu (00-dispatch.md, GENEZA) wymienia wyłącznie #4b i #4c jako cel —
#4 świadomie zostawiam poza allowlistą, żeby nie rozszerzać zakresu ponad to,
co orkiestrator zdecydował. Inne przeszukane wzorce (`enqueueDiplomacyPendingFromCmd`,
`pendingImprovementsTurn`, `pendingMarchHint` — poza funkcją) nie są tej klasy
(operują na realnym `ownerId`, bez zawężenia do 0, albo nie są odroczonymi
zdarzeniami per-owner).

## Rozszerzona bramka jednostkowa (BINARNE KRYTERIUM)

Rozszerzyłem `tools/hotseat-etap3-akcesory-test.cjs` (allowlista: „Nowa/rozszerzona
bramka testowa") o dwie nowe sekcje (7, 8) dowodzące dla PEŁNEJ domeny
(0, dwie dodatnie AI, `BARBARIAN_OWNER_ID`, `REBEL_FACTION_OWNER_ID`):
`!isHuman(rep.ownerId) === (rep.ownerId !== 0)` (guard `promptMergeIfCoLocated`)
oraz `isHuman(ownerId) === (ownerId === 0)` (guard `pendingAutoRationForNextTurn`).
Import `BARBARIAN_OWNER_ID`/`REBEL_FACTION_OWNER_ID` skopiowany z istniejącego
wzorca `hotseat-etap1-ownerid-test.cjs` (te same moduły źródłowe). Wynik po
rozszerzeniu: 64 PASS, 0 FAIL (było 52; +12 = 6 wartości domeny × 2 sekcje).

## TESTY

`tsc --noEmit`: czysto (0 błędów). Bramki: `hotseat-etap1-ownerid-test` 14/14,
`hotseat-etap3-akcesory-test` **64/64 (rozszerzona)**, `hotseat-human-owners-test` 29/29,
`army-merge-colocated-test` 4/4, `army-merge-bounce-test` 4/4,
`army-merge-separate-return-test` 16/16,
`army-merge-separate-return-mainguard-test` 73/73,
`army-merge-stackgroupid-test` 11045/11045 (fuzz), `merge-decor-no-regress-test`
49/49, `empire-food-b5-test` 28/28 — wszystkie zielone. Dedykowanej bramki dla
mechaniki `pendingAutoRationForNextTurn`/racji żywności (grep `autoRation`/`racj`
w `tools/`) NIE ma osobno — pokryta teraz przez rozszerzenie powyżej (guard
warunku, nie całej mechaniki auto-wyrównania, która jest poza zakresem tej
rundy).

STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1
GOAL: podmiana `ownerId===0`→`isHuman(ownerId)` w dwóch odroczonych miejscach main.ts (recon Etap 4, Ryzyko #4b/#4c)
ZMIANY/COMMIT: gra/src/main.ts (2 linie: 10910, 28907) + tools/hotseat-etap3-akcesory-test.cjs (rozszerzenie, sekcje 7-8) — bez commitu (Operator nie commituje/nie pushuje)
TESTY: tsc --noEmit czysto; 10 bramek referencyjnych zielonych, w tym rozszerzona hotseat-etap3-akcesory-test 64/64 (patrz wyżej)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
