STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-B-Q1
GOAL: Migracja klastra "HUD/panel dyplomacji" (12 z 15 funkcji z recon) na isMe()/ME(), Etap 6d — runda 2: naprawa bramki `exec-test.cjs` wg WERDYKTU 2 Final Control rundy 1.

ZMIANY/COMMIT: WYŁĄCZNIE `gra/tools/hotseat-etap6d-podetap-b-exec-test.cjs`. Worktree
`/home/user/wt-6d-PODETAP-B`, gałąź `autobot/R-HOTSEAT-ETAP6D-PODETAP-B-Q1`, commit `6cda638a`
(na bazie `5ba21cfa`). `gra/src/main.ts` NIETKNIĘTY — `git diff 5ba21cfa -- src/main.ts` = 0
linii (potwierdzone). `tsc --noEmit` exit 0. `git diff --check` czysty.

Poprawki bramki:
1. `collectDiploChipCounts` (sekcja 3 testu): rozdzielone dwa `oid` — AI1 (via `activeDeals` +
   `d.strony.includes(ME())`, L15031) i AI2 kontrolny (bez deala, tylko `getDiploRelation`,
   L15039), `getDiploRelation` zawsze zwraca `'pokoj'` niezależnie od argumentów (odcina maskowanie
   ścieżki (b) przez (a)). Wywołania `getDiploRelation` przechwytywane i asercjonowane WPROST,
   osobno dla każdego z dwóch wywołań, w bloku PRAWDZIWY (mutationExpected=false).
2. `enqueueNegotiationFromAiCmd` (sekcja 4): dwa warianty `cmd.type` (`zaproponuj_umowe_handlowa`,
   `zaproponuj_pokoj`) docierają do obu rozłącznych gałęzi funkcji; wszystkie ok. 12 wywołań
   ME()/isMe() (L15968, L15982, L15986, L15992, L15994, L16001, L16030, L16040, L16049, L16054,
   L16085, L16090) mają teraz osobne przechwytywanie i asercję w bloku PRAWDZIWY.

TESTY:
- `exec-test.cjs` na czystym main.ts: 46 PASS, 0 FAIL (było 23/23; wzrost liczby asercji).
- 8 niezależnych ręcznych mutacji literału `0` bezpośrednio w main.ts (git checkout po każdej,
  `git diff --stat` puste przed i po), każda zaczerwieniła bramkę:
  a) `collectDiploChipCounts` L15031 `includes(ME())→includes(0)`: 44 PASS/2 FAIL.
  b) `collectDiploChipCounts` L15039 `getDiploRelation(ME(),oid)→(0,oid)`: 44 PASS/2 FAIL.
  c) `enqueueNegotiationFromAiCmd` L15968 `getDiploRelation(ownerId,ME())→(ownerId,0)`: 44/2 FAIL
     (złapane w OBU wariantach cmd.type).
  d) `playerFormalRelationLabel` L5596 (dodatkowo, spoza wymaganych 7, dla kompletności): 45/1 FAIL.
  e) `foreignCivsMissingTradeTreatyForCity` L14759 `isMe(city.ownerId)→(city.ownerId===0)`:
     exit 1 (FAIL na pierwszej asercji + crash na niezdefiniowanym — ta sama znana usterka
     metodologiczna braku early-return w skrypcie, opisana przez Final Control; wynik = non-zero
     exit, bramka łapie regresję).
  f) `applyBorderMarchPenaltiesEndTurn` L4869 `...,ME())→...,0)`: 45/1 FAIL.
  g) `currentVisibleForOwner` L9892 `allianceFormalKindBetween(...,ME(),...)→(...,0,...)`: 44/2 FAIL.
  h) `peacefulArchetypeForOwner` L18786 `isMe(ownerId)→(ownerId===0)`: 45/1 FAIL.
  Wszystkie 8/8 (≥7 wymaganych) poprawnie reddens. `tsc --noEmit` exit 0 po każdym przywróceniu
  main.ts do `5ba21cfa`.

BLOKADY: brak — WERDYKT 2 rundy 1 naprawiony i zweryfikowany binarnie (kryterium sukcesu z
dispatchu spełnione: ≥7 mutacji czerwieni, main.ts diff pusty wzgl. 5ba21cfa). Uwaga
metodologiczna nietknięta z rundy 1: bloki `mutationExpected=true` w tym pliku nadal są logiem,
nie bramką (ok() z tą flagą zawsze PASS) — realną siłą wykrywającą jest WYŁĄCZNIE blok PRAWDZIWY
(mutationExpected=false, PLAYER=7), co właśnie ten zweryfikowałem powyżej; nie zmieniałem tego
mechanizmu (poza zakresem NAPRAWY z dispatchu).

RUNDY: 2/5.

NASTĘPNY KROK: Evaluator, potem Final Control — weryfikacja niezależną, własną mutacją (zgodnie
z regułą przeciw samooszukiwaniu) dla wszystkich 7 funkcji objętych bramką, oraz potwierdzenie
main.ts diff=0 wzgl. 5ba21cfa.

DEPLOY/PUSH: NIE WYKONANO
