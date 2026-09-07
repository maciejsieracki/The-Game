STATUS: PASS
DOMAIN: GAME
TEMAT: R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1
GOAL: Limit miast per cywilizacja rozróżnia prowenincję zdobytego miasta — od
niezależnego miasta-państwa liczy się (bez zmian), od innej cywilizacji nie liczy się
(częściowe odwrócenie R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1, ECHO 2026-09-07).

ZMIANY-COMMIT: `9f0eda6f` na branchu `autobot/R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1`,
zweryfikowane niezależnie `git diff origin/main --stat` (origin/main @ `3f7c68e3`, potwierdzone
`git fetch`): wyłącznie pliki z allowlisty — `gra/src/game/cities.ts` (+34, nowa
`wasIndependentCityStateBeforeCapture`), `gra/src/game/post-battle-map.ts` (+22/-4,
`applyCityCaptureAfterBattle`), `gra/src/main.ts` (+18/-6, import + wyłącznie
`resolveSiegeSurrender`, reszta pliku nietknięta), `gra/tools/city-limit-conquered-test.cjs`
(+191/-91), oraz raporty w `dyspozycje/.../R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1/`.
`git diff origin/main --check` czysty (brak whitespace errors). Formuła limitu
(`cityLimitBase`, `base + (era-1)*5` odpowiednik) nietknięta — potwierdzone grepem
`cityLimitBase` w diffie: zero trafień.

ARCHITEKTURA (zweryfikowana samodzielnie, nie tylko na słowo Operatora):
- `city.startCityState` ustawiane na `true` wyłącznie w dwóch miejscach
  (`main.ts:8572`, `main.ts:8692`, oba spawn klastra) + warunkowo w `foundCityAt`
  (`cities.ts:1247`) sterowane tym samym `foundingCityState` — zero innych miejsc w
  całym `gra/src` (grep potwierdzony).
- `clearCityStateFlagOnCapture` (`game/display-names.ts:88-94`) czyta
  `city.startCityState !== true → return false`, inaczej ustawia trwale na `false` —
  jednokierunkowa, nieodwracalna operacja, dokładnie jak twierdzi Operator.
- `applyCityCaptureAfterBattle` (post-battle-map.ts): `wasIndependentCityState` czytane
  na samym początku funkcji, PRZED `city.ownerId = atkOwner` i PRZED
  `captureOpts?.onOwnerChanged?.(city)`. `onOwnerChanged` (main.ts:26983) woła
  `clearCityStateFlagOnCapture(c)` — zweryfikowane bezpośrednio w main.ts, hak
  faktycznie wykonuje się PO ustawieniu nowego właściciela. Kolejność operacji
  poprawna.
- `resolveSiegeSurrender` (main.ts:13415-13444): `wasIndependentCityState` czytane
  zaraz po `oldOwner = city.ownerId`, PRZED `city.ownerId = newOwner` (linia 13428) i
  PRZED `clearCityStateFlagOnCapture(city)` (linia 13430). Kolejność poprawna.
- `if (!wasIndependentCityState) city.foundedByOwner = false;` obecne w obu funnelach,
  we właściwym miejscu (po zmianie ownera, przed powrotem funkcji).

TESTY (URUCHOMIONE SAMODZIELNIE w /home/user/wt-miasta-limit-prowenienencja):
- `node ./node_modules/typescript/bin/tsc --noEmit` w `gra/` — exit 0, brak błędów.
- `node tools/city-limit-conquered-test.cjs` — 24/24 PASS. Sprawdzone ręcznie
  wszystkie trzy scenariusze binarne z dispatchu: (i) podbój niezależnego
  miasta-państwa → `foundedByOwner` pozostaje `true`, `countsTowardCityFoundingLimit`
  `true`, limit 9+1=10 wyczerpany (regres zachowania — poprawnie BEZ ZMIAN);
  (ii) podbój zwykłego miasta obcej cywilizacji → `foundedByOwner=false`,
  `countsTowardCityFoundingLimit` `false`, limit NIE wyczerpany po 9+1 (poprawna
  ZMIANA); (iii) podbój miasta-państwa wcześniej przejętego przez inną cywilizację
  (`startCityState: false`, `foundedByOwner: false` z tamtej konkwisty) → nowa
  konkwista jawnie ustawia `foundedByOwner=false` ponownie, `countsTowardCityFoundingLimit`
  `false` (poprawne rozróżnienie od scenariusza (i), dokładnie to czego domagało się
  ECHO właściciela). Test także sprawdzono pod kątem regresji sygnatury `makeCity`
  (zmiana z pozycyjnego `foundedByOwner` na `opts`) — wszystkie wywołania w pliku
  używają nowej formy obiektowej, zero pozycyjnych wywołań typu `makeCity(id,o,q,r,true)`
  które przy starej sygnaturze zadziałałyby inaczej niż przy nowej.
- `node tools/logic-test.cjs` — 213/213.
- `node tools/post-battle-map-test.cjs` — 32/32.
- `node tools/barb-city-owner-contract-test.cjs` — 3/3.
- `node tools/barb-city-behavior-test.cjs` — 177/177.
- `node tools/forced-war-bronze-main-guard-test.cjs` — 28/28.
- `node tools/forced-war-iron-main-guard-test.cjs` — 37/37.
- `node tools/forced-war-stone-main-guard-test.cjs` — 19/19.
- `node tools/flaga-mp-nie-gasnie-test.cjs` — 31 PASS / 1 FAIL (T14). Potwierdzone
  NIEZALEŻNIE (nie przez `git stash` w tym samym worktree, tylko przez uruchomienie
  identycznego testu w `/home/user/The-Game` — worktree główny, stojący dokładnie na
  `origin/main` @ `3f7c68e3`): identyczny wynik `31 PASS, 1 FAIL (T14)` bez żadnych
  zmian tego tematu. Pre-istniejący, niepowiązany.
- `node tools/okolica-ownership-change-reconcile-test.cjs` — 12/15 (3 FAIL).
  Potwierdzone tą samą metodą w `/home/user/The-Game` — identyczny wynik `12/15`.
  Pre-istniejący, niepowiązany.
- Dodatkowa kontrola kompletności (poza tym co sprawdzał raport Operatora): grep
  wszystkich miejsc `city.ownerId = ` w `main.ts`/`game/*.ts` poza dwoma objętymi
  funnelami — `annexCityStateToOwner` (wchłonięcie dyplomatyczne, main.ts:26352,
  świadomie poza zakresem tego zlecenia i dispatchu) i przejście miasta do
  `REBEL_FACTION_OWNER_ID` (main.ts:29851, bunt, nie podbój przez inną cywilizację) —
  oba poprawnie NIE dotknięte, zgodnie z allowlistą i zakresem ECHO właściciela
  ("wynikiem wojny z inną cywilizacją" nie obejmuje wchłonięcia dyplomatycznego ani
  buntu wewnętrznego).

BLOKADY: brak.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator → Final Control → integracja allowlist-only.
ZARZUTY: brak
DEPLOY/PUSH: NIE WYKONANO
