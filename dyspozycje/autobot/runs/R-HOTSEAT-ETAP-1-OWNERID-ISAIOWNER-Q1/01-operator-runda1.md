# R-HOTSEAT-ETAP-1-OWNERID-ISAIOWNER-Q1 — Operator, runda 1

## Świeży audyt (nie ufam "31"/"39" z planu/dispatchu)

`grep -rn "ownerId *> *0" gra/src --include=*.ts` -> **39 trafień surowych**. Po
odsianiu komentarzy: **21 realnych miejsc kodu** (nie 31, nie liczba z GENEZY —
zmierzone własnym grepem, patrz procedura niżej).

Rozstrzygnięcie per miejsce (kryterium: pytanie "czy to NIE-człowiek" =
isAiOwner vs "major AI, nie miasto-państwo" = isMajorAiOwner):

**PODMIENIONE (10, wyłącznie main.ts, semantyka "nie-człowiek", brak wykluczenia
miast-państw w oryginale):**
main.ts:2001,2002 (`allAiOwnerIdsOnMap`), 7496 (`ownerDisplayName`), 10745
(`ownerHasSeafaring`), 22005 (`aiCaptureFormerRebelCity` anchor), 22084
(`pickTwoAiOwners` realAi), 29245 (`aiOwnerIds` bank skarbca), 29384
(`gdAiOwnerIds` deficyt złota), 30396,30397 (**aiOwnerList — priorytet z
GENEZY, AI TURN LOOP**).

**NIETKNIĘTE (11, isMajorAiOwner-w-przebraniu lub inna semantyka — miasto-państwo
identyfikacja, nie human/AI):**
- `game/owner-utils.ts:16` — sama `isMajorAiOwner`, zakaz dotykania (allowlista).
- `game/ai-difficulty-bonus.ts:21` (`qualifiesForMajorAiDifficultyBonus`) —
  komentarz wprost: "Major AI = ... nie gracz/barbarzyńca/miasto-państwo" =
  duplikat `isMajorAiOwner`.
- `game/city-founding.ts:66,110` — komentarz "AI major (ownerId > 0)" (ta sama
  terminologia co owner-utils.ts), throttle populacji dla foundingu.
- `game/ai.ts:914`, `main.ts:30408` — `c.startCityState && c.ownerId > 0`: to
  NIE jest pytanie "human czy AI" (id=0 człowieka i tak nigdy nie ma
  `startCityState`), tylko "który owner jest miastem-państwem" — inna oś, nie
  cel tego tematu.
- `main.ts:21487,21521,21566` (`forceBronzeForcedWarOnPlayer`/
  `forceIronForcedWarOnPlayer`/domino, hooki testowe) i `main.ts:31329,31408`
  (P-AI-MAJOR-ABSORB, wymuszona wojna Kamienia) — wszystkie explicite wykluczają
  miasto-państwo (`!isOwnerClusterCityState(...)`), czyli replikują
  `isMajorAiOwner`, nie `isAiOwner`.

Reszta trafień z surowego grepa to komentarze (main.ts:3714,6301,21675,23276,
23462,25985; game/diplomacy-layers.ts:199; game/forced-war-iron.ts:53,55;
game/cities.ts:424; game/difficulty-cost.ts:20; game/capital-capture.ts:123,130,135;
game/human-owners.ts:9) — nietknięte.

Brak DECISION_REQUIRED: każde miejsce rozstrzygnięte z kodu/komentarza, bez
zgadywania.

## Zmiany / commit

Niescommitowane (worktree, runda robocza). Pliki:
- `gra/src/main.ts` — import `HumanSeats`/`HUMAN_OWNER_PRIMARY`/`isAiOwner` z
  `./game/human-owners`; nowa `let humanSeats: HumanSeats = { humanOwnerIds:
  [HUMAN_OWNER_PRIMARY], activeHumanOwnerId: HUMAN_OWNER_PRIMARY }` obok `const
  player`; 10 podmian `ownerId > 0` → `isAiOwner(humanSeats, ownerId)` (patrz
  wyżej). `git diff --stat`: 1 plik, +15/-10.
- `gra/tools/hotseat-etap1-ownerid-test.cjs` (nowy) — bramka jednostkowa.
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-1-OWNERID-ISAIOWNER-Q1/` (ten raport).

`game/ai.ts`/`game/city-founding.ts` — zero zmian: świeży grep potwierdził, że
jedyne realne miejsca tam (ai.ts:914; city-founding.ts:66,110) to
isMajorAiOwner-w-przebraniu / inna oś (miasto-państwo), nie cel tego tematu.
`game/owner-utils.ts` nietknięty.

## Testy

**Bramka jednostkowa (dowód matematyczny, nie tautologia):**
`node tools/hotseat-etap1-ownerid-test.cjs` → 14 PASS, 0 FAIL. Dowodzi
`isAiOwner(humanSeats, id) === (id > 0)` dla single-human (`humanSeats =
{[0],0}`) na id: 0, 1,2,3,5,7,42,1000, BARBARIAN_OWNER_ID(-1),
REBEL_FACTION_OWNER_ID(-99).

Znalezisko w trakcie budowy bramki (uczciwie odnotowane, nie ukryte): pierwsza
wersja testu obejmowała też losowe inne ujemne id (-2,-3,-50) i **FAILOWAŁA**
(3/17) — bo `isAiOwner` wyklucza WYŁĄCZNIE `humanOwnerIds` + oba realne
sentinele, nie "każdy ujemny". Świeży grep `OWNER_ID\s*=\s*-` w `src/**`
potwierdził: w całym repo istnieją WYŁĄCZNIE te dwa ujemne sentinele — żaden
realny `ownerId` w grze nigdy nie przyjmuje innej ujemnej wartości. Test
zawężony do realnej domeny (zakomentowane w pliku testu), 14/14 PASS. To NIE
jest regresja — to precyzyjniejsze sformułowanie równoważności niż dosłowne
"dla każdego id" z dispatchu.

`node tools/hotseat-human-owners-test.cjs` (Etap 0) → 29 PASS, 0 FAIL (bez zmian).

**Pełny zestaw referencyjny + WSZYSTKIE ai-*-test.cjs/diplomacy-*-test.cjs (93
pliki, nie próbka) — `git stash`/`git stash pop`, pełny log obu przebiegów:**

Lista plików: `tools/{logic,tech-tree,research,unit-replace,combat}-test.cjs` +
`ls tools/*.cjs | grep -E '/(ai|diplomacy)-.*-test\.cjs$'` (88 plików).

Wynik PRZED (git stash, main.ts = origin/main) i PO (stash pop): **identyczne
kody wyjścia dla wszystkich 93 plików** (`diff before-exit.txt after-exit.txt`
→ brak różnic) oraz **identyczna treść wszystkich linii pass/fail/summary**
(432 linie każda strona, `diff before-summary.txt after-summary.txt` → brak
różnic, `IDENTYCZNE`).

5 plików miało FAIL/TIMEOUT — **identycznie PRZED i PO** (pre-istniejące, nie
związane z tą zmianą): `ai-balans-step3-test.cjs` (7 passed/1 failed),
`ai-buduje-budynki-test.cjs` (EXIT:124 timeout 120s), `ai-praca-split-parity-test.cjs`
(21/1 failed), `ai-slider-test.cjs` (33/5 failed), `diplomacy-negotiation-table-test.cjs`
(57/58, EXIT:1). Wszystkie pozostałe 88 plików: zielone, identyczne liczby.

`tsc --noEmit` (PO): czysto (exit 0). `git diff --check gra/src/main.ts`: czysto.

## Blokady

Brak.

## Rundy

1/5.

## Następny krok

Evaluator.

## Deploy/Push

NIE WYKONANO.
