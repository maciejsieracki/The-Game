STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1
GOAL: Migracja 3 funkcji AI-rosteru (część (i), "prosta migracja") tak, żeby
wykluczały WSZYSTKICH `humanOwnerIds` z puli AI, nie tylko `ownerId===0`. Bez
części (ii) (drugi heks startowy, drugi wybór cywilizacji).

TESTY (niezależna weryfikacja Final Control):
- `git diff --stat 302b6a96..HEAD`: WYŁĄCZNIE 4 pliki — `gra/src/main.ts` (1
  linia), nowy `gra/tools/hotseat-etap6f-start-migracja-test.cjs`, oraz raporty
  Operatora/Evaluatora. Zero dotknięcia regionów zajętych równolegle.
- Własny `Read` diffu `main.ts:7557`: `.filter(id => id !== 0)` →
  `.filter(id => isAiOwner(humanSeats, id))`. Własny `Read`
  `game/human-owners.ts:47` potwierdza `isAiOwner`: `false` dla
  `humanOwnerIds.includes(ownerId)`, `false` dla `BARBARIAN_OWNER_ID=-1` i
  `REBEL_FACTION_OWNER_ID=-99`, inaczej `true`. Dla dzisiejszego
  `humanOwnerIds=[0]`: `isAiOwner([0], id)` = `id!==0 && id!==-1 && id!==-99`
  — identyczne z PRE dla `id∈{cities,units}.ownerId` w praktyce (barbarzyńcy/
  rebelianci normalnie nie trafiają do `saved.cities`/`saved.units` jako
  osobne encje w tej ścieżce) → behawioralny no-op potwierdzony testem.
  Dla `humanOwnerIds=[0,1]`: wyklucza OBA `0` i `1` — dokładna odwrotność
  zamierzona.
- Własne uruchomienie `node tools/hotseat-etap6f-start-migracja-test.cjs` →
  11/11 PASS, w tym scenariusz B (`humanOwnerIds=[0,1]`, nietautologiczny):
  PRE błędnie zawiera `ownerId=1` w puli AI, POST poprawnie wyklucza oba.
  Reimplementacja `isAiOwner`/`isHumanOwner` w pliku .cjs zweryfikowana 1:1
  przeciw źródłu `game/human-owners.ts` (identyczne stałe i logika).
- Własne `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0, brak
  błędów.
- 5 bramek referencyjnych, własne uruchomienie: `logic-test` 213/213,
  `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13,
  `combat-test` 6/6 — identyczne z raportami Operatora/Evaluatora.
- Brak nakładania z równoległymi lanami: `wt-hotseat-etap6c-economy` (diff
  roboczy, niescommitowany) dotyka `main.ts` w liniach ~1986, 2168, 3463, 7722
  (najbliższy hunk — ~165 linii od 7557, brak przecięcia), 29255-30646.
  `wt-hotseat-etap6e-prereq` dotyka ~2435-2497 i ~10384-10402. Żaden nie
  obejmuje main.ts:7557.
- Dokumentacja braku zmian w `repairAiRosterFromMap`/`fillAiOwnerCivMap`:
  potwierdzona własnym `Read` — `allAiOwnerIdsOnMap()` już filtruje przez
  `isAiOwner`; `aiStartHexes` (via `units/setup.ts`) z definicji nie zawiera
  ownerId ludzi dopóki nie istnieje część (ii). Uzasadnienie spójne w obu
  raportach i potwierdzone niezależnie.

BLOKADY: brak.

RUNDY: 1/5

WERDYKT KOŃCOWY: PASS. Zmiana jest dokładnie skoncentrowana (1 linia
main.ts:7557), zweryfikowana trzykrotnie niezależnie (Operator, Evaluator,
Final Control) tym samym diffem i identycznymi wynikami testów. Nowa bramka
jest nietautologiczna (scenariusz `humanOwnerIds=[0,1]` pokazuje realną
regresję PRE i fix POST), reimplementacja logiki w .cjs zgodna ze źródłem.
tsc czysty, 5 bramek referencyjnych zielone z liczbami identycznymi do
poprzednich rund. Brak nakładania z równoległymi lanami 6c/6e potwierdzony
świeżym `git diff` w obu worktree. Decyzje o braku zmian w pozostałych 2
funkcjach są jawne i uzasadnione źródłem, nie milczeniem. Gotowe do
integracji.

NASTEPNY KROK: integracja allowlist-only przez orkiestratora (main.ts:7557,
nowy plik testowy, raporty) do `main`; po integracji aktualizacja rejestru.
DEPLOY/PUSH: NIE WYKONANO
