STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1
GOAL: Migracja 3 funkcji AI-rosteru (część (i)) tak, żeby wykluczały WSZYSTKICH
humanOwnerIds z puli AI, nie tylko ownerId 0.

TESTY (niezależna weryfikacja Evaluatora):
- `git show 272484e6` — zmienione WYŁĄCZNIE 3 pliki: `gra/src/main.ts` (1 linia,
  `main.ts:7557`), nowy `gra/tools/hotseat-etap6f-start-migracja-test.cjs`, raport
  Operatora. Diff dokładnie: `.filter(id => id !== 0)` → `.filter(id => isAiOwner(humanSeats, id))`.
- Świeży `Read` `repairAiRosterFromMap` (main.ts:2129): potwierdzone — operuje na
  `allAiOwnerIdsOnMap()`, która sama filtruje przez `isAiOwner(humanSeats, ...)`
  (main.ts:2073-2079) — już generyczna, bez zmiany kodu.
- Świeży `Read` `fillAiOwnerCivMap` (main.ts:7524): buduje `aiOwnerIds` z
  `aiStartHexes.map(a => a.ownerId)`. Zweryfikowane w `units/setup.ts:505-591`
  (`computeStartPlacements`): AI dostają ownerId 1..N, gracz (ownerId 0) NIE
  trafia do `aiStarts`. Jedyne miejsce wstrzykujące drugi ludzki fotel w runtime
  (`__hotSeatTestDebug.seedSecondSeat`, main.ts:22639) NIE modyfikuje
  `aiStartHexes`, tylko `humanSeats`/istniejące miasto — potwierdza, że
  `aiStartHexes` z definicji nie zawiera ludzi w części (i). Brak zmiany kodu
  uzasadniony.
- `node tools/hotseat-etap6f-start-migracja-test.cjs` → 11/11 OK (własne
  uruchomienie). Scenariusz B faktycznie używa `humanOwnerIds=[0,1]`
  (nietautologiczny), pokazuje regresję PRE (`ownerId=1` w puli AI) i fix POST
  (oba `0` i `1` wykluczone). Scenariusz C dodatkowo pokrywa barbarzyńcę/rebelianta.
- `node ./node_modules/typescript/bin/tsc --noEmit` → 0 błędów (własne
  uruchomienie w worktree).
- 5 bramek referencyjnych, własne uruchomienie: logic-test 213/213,
  tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13,
  combat-test 6/6 — wszystkie zgodne z raportem Operatora.
- Część (ii): brak dotknięcia — commit nie zawiera zmian w drugim heksie
  startowym/wyborze cywilizacji w menu; region bootstrapu (~2400-2520/10380-10400)
  i ekonomia nie naruszone (poza allowlistą tego tematu, `git show --stat`
  potwierdza tylko 3 pliki).

BLOKADY: brak.
RUNDY: 1/5
ZARZUTY: brak.
NASTEPNY KROK: Evaluator → Final Control.
DEPLOY/PUSH: NIE WYKONANO
