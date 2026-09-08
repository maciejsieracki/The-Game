STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1
GOAL: Migracja 3 funkcji AI-rosteru (część (i), "prosta migracja") tak, żeby
wykluczały WSZYSTKICH `humanOwnerIds` z puli AI, nie tylko `ownerId===0`. Bez
części (ii) (drugi heks startowy, drugi wybór cywilizacji).

ZMIANY/COMMIT:
- `gra/src/main.ts` — `restoreAiRosterFromSave` (ok. linii 7554-7557): filtr
  budowy `ownerIds` z legacy-save zmieniony z `.filter(id => id !== 0)` na
  `.filter(id => isAiOwner(humanSeats, id))` — reużyty istniejący pattern
  z `game/human-owners.ts` (ten sam alias, którego funkcja już używa kilka
  linii niżej dla `ownerDisplayName`). Efekt uboczny (zgodny z semantyką
  `isAiOwner`): dodatkowo wyklucza sentinel barbarzyńcy/rebelianta z puli AI,
  gdyby wystąpiły w `saved.cities`/`saved.units` — patrz test scenariusz C.
- `repairAiRosterFromMap` (main.ts:2129) — BEZ zmiany kodu. Operuje na
  `allAiOwnerIdsOnMap()` (main.ts:2073-2076), która już wewnętrznie filtruje
  `isAiOwner(humanSeats, ownerId)` — strukturalnie generyczna, poprawna dla
  dowolnej liczby foteli ludzkich. Potwierdzone świeżym `Read`/`Grep`.
- `fillAiOwnerCivMap` (main.ts:7524) — BEZ zmiany kodu, w allowlisty zakresie
  (`gra/src/main.ts`). Buduje `aiOwnerIds` z `aiStartHexes.map(a=>a.ownerId)`.
  Sprawdzone źródło `aiStartHexes` (`units/setup.ts:computeStartPlacements`,
  POZA allowlistą tego tematu) — `nextOwnerId` startuje od `1`, gracz (ownerId
  0) nigdy nie trafia do `aiStarts`; dziś (część (i), bez drugiego heksu
  startowego) żaden fotel ludzki nie może mieć ownerId>0 w `aiStartHexes`, więc
  `aiOwnerIds` z definicji nie zawiera humanOwnerIds. Zmiana potrzebna dopiero
  gdy część (ii) doda drugi heks startowy z ownerId drugiego człowieka do
  `aiStartHexes`/`cluster-start.ts` — poza zakresem i poza allowlistą tej
  rundy, jawnie odłożone (nie zgaduję, nie dotykam `units/setup.ts`).
- NOWY: `gra/tools/hotseat-etap6f-start-migracja-test.cjs` — headless Node
  (bez DOM), reimplementuje PRE/POST filtr 1:1 z main.ts i porównuje wyniki.

TESTY:
- `node tools/hotseat-etap6f-start-migracja-test.cjs` → 11/11 PASS. Kluczowy
  dowód przeciw samooszukiwaniu: scenariusz B, `humanOwnerIds=[0,1]` (NIE
  jednoelementowy) — PRE (kod sprzed migracji) błędnie wrzuca `ownerId=1`
  (drugi human) do puli AI; POST poprawnie wyklucza OBA `0` i `1`. Scenariusz A
  potwierdza no-op dla dzisiejszego `[0]` (PRE==POST). Scenariusz C:
  barbarzyńca/rebeliant też wykluczeni pod POST.
- `node ./node_modules/typescript/bin/tsc --noEmit` (po `npm install` w tym
  worktree — brakował `node_modules`) → 0 błędów.
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19,
  `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 —
  wszystkie zgodne z wartościami referencyjnymi §6.

BLOKADY: brak.

RUNDY: 1/5
NASTĘPNY KROK: Operator → Evaluator.
DEPLOY/PUSH: NIE WYKONANO
