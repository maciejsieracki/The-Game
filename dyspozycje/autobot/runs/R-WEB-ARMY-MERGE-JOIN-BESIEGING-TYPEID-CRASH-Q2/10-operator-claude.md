# R-WEB-ARMY-MERGE-JOIN-BESIEGING-TYPEID-CRASH-Q2 — raport Operatora (runda 1/5)

STATUS: BLOCK (brak reprodukcji błędu na realnych funkcjach; brak poprawki kodu)
DOMAIN: GAME (armie / oblężenie / scalanie)
TEMAT: R-WEB-ARMY-MERGE-JOIN-BESIEGING-TYPEID-CRASH-Q2
GOAL: (1) scalenie z armią oblegającą nie rzuca `Cannot read properties of undefined (reading 'typeId')`; (2) brak ekranu BOOT ERROR przy brakującej jednostce w handlerach scalania/podziału.
BAZA: origin/main = `4ac6654472fa97a046b4da9ffaf8ac5df90d75b9` (FALA 775, ancestor ≥ b160459c9: TAK, sprawdzone `git merge-base --is-ancestor b160459c9 HEAD`).
ZMIANY/COMMIT: brak zmian w `gra/src` i `gra/tools`. Commit zawiera tylko ten raport oraz harness reprodukcyjny `dyspozycje/autobot/runs/R-WEB-ARMY-MERGE-JOIN-BESIEGING-TYPEID-CRASH-Q2/repro-merge-click-live.cjs`.

## Co zrobiono

1. Odczytano dispatch z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`00-dispatch.md` + `00-dispatch-DODATEK-claude.md`). `origin/main` nie zawiera pliku dispatchu (sprawdzone `git ls-tree`).
2. Przeanalizowano ścieżkę kliku „Połącz”:
   - `gra/src/main.ts:15549` `promptMergeIfCoLocated` → `besiegersHere` (`besiegingUnitsOnHex`, armyMerge.ts:136), `onHex = [...coLocatedForMergePrompt(...), ...besiegersHere]` (main.ts:15567), `arrivingRow` (main.ts:15576–15580).
   - `applyMerge` (main.ts:15612–15650): `inheritSiegeOnJoin`, `normalizeMergedFortify`, `assignSharedStackGroupId`, `besiegedCity` (main.ts:15629), `syncStackRuchLeft`, `syncUnitsRender` (main.ts:15235), `refreshFog`, `pickStackRepresentative(onHex, unitAttackScore)`, `selectPlayerUnit`, `refreshD1bHud`, `flushDeferredMergePrompts`, `flushDeferredAutoPreBattle`.
   - Sprawdzone i wykluczone jako źródło `typeId` na `undefined` w tej ścieżce: `mergeUnitRow` (main.ts:15531; wywołanie tylko na `arrivingUnits[0]!`, a ta lista jest niepusta, gdy `movedUnitIds[0]` należy do `onHex`), `unitAttackScore` (main.ts:15230), `pickStackLeader` (stack-leader.ts:28), `selectPlayerUnit` (main.ts:7383, guard `!u`), `healInconsistentUnits` (main.ts:13891), `normalizeMergedFortify`/`exitFieldFortify`/`exitGarnizon` (armyMerge.ts:352–422; żadne nie czyta `typeId`), `followLeaderAutoMergeDecision` (army-follow-auto-merge.ts), `armyMergePanel.ts` (`showArmyMergePanel`, klik `[data-act="merge"]` → `pick(opts.onMerge)`).
   - Najbardziej prawdopodobny kandydat strukturalny (NIE potwierdzony): `syncUnitsRender` → `computeStackDisplay(src, ...)` (main.ts:15270 `defForUnit(u)` czyta `u.typeId`; armyMerge.ts:610 `computeStackDisplay` iteruje `units` bez guardów). Gdyby w `src` znalazł się `undefined`, stos wywołań pasuje do zrzutu (`Iz`=defForUnit-podobna, `g8`=syncUnitsRender). Nie zweryfikowano, skąd mógłby pochodzić `undefined`.
3. Reprodukcja live w Chromium (`/usr/bin/chromium`, Playwright 1.61) na buildzie vite z NIEZMIENIONYCH źródeł + jedna linia debug w KOPII poza repo (`window.__mergeDbg`: promptMerge/units/cities/select). Build: `vite build --minify false` → exit 0. Scenariusze (każdy: `?playtest=mapa&civTest=1`, `__civTest.foundCity` na kandydacie, `addUnit` oblegającej A obok miasta, `addUnit` dołączającej B na heksie A, `promptMerge([B], q+2, r)`, klik DOM `[data-act="merge"]`):

| Wariant | Ustawienie | Panel otwarty | pageerror | BOOT ERROR |
|---|---|---|---|---|
| siege | A.oblegaCityId = fikcyjne id miasta, A.ruchLeft=0 | TAK | 0 | NIE |
| siege2 | A.oblegaCityId = realne id miasta, city.oblegane=true, city.siegeArmyGroupId=A.stackGroupId | TAK | 0 | NIE |
| select | jak siege2 + zaznaczona armia A przed promptem i jednostka B po nim (`selectPlayerUnit`) | TAK | 0 | NIE |

   Surowy wynik ostatniego przebiegu: `SETUP {"A":"civtest-0-22-9-2","B":"civtest-0-22-9-3","q":22,"r":9,"city":[21,9]}`, `PANEL_OPEN true`, `ERRORS 0`, `BOOT_ERROR_SCREEN false`.
   Wariant bez klikniecia Playwright (`page.click`) przerwał się timeoutem (przycisk zasłonięty przez overlay), więc klik zrobiono przez `element.click()` w DOM; to nie zmienia wywołania `onMerge`.

## Dlaczego BLOCK (a nie poprawka)

- Kryterium (a) dispatchu wymaga odtworzenia błędu PRZED poprawką, z wypisaną funkcją i linią. Żaden z 3 wariantów nie wywołał błędu; nie mam więc dowodu, która linia jest źródłem.
- Bez reprodukcji każda „poprawka” (np. guard w `mergeUnitRow`, `computeStackDisplay`, `defForUnit`) byłaby zgadywaniem i nie spełniłaby kryterium (b) (test z mutacją na kopii musi być czerwony na bazie).
- Zgłoszenie właściciela wspomina `Jedna jednostka oblegała, a druga dołączyła` — nie podał, czy scenariusz obejmował: ruch marszem (`planMarchTo`/`stack` z main.ts:34076), odroczony prompt (`deferredMergePrompts`/`flushDeferredMergePrompts`), wczytanie zapisu, armię 3+ jednostek, czy „Idź do wodza” (`followLeaderAutoMergeDecision`). Nie odtworzono żadnego z tych wariantów poza pojedynczym promptem.

## Ustalenia do dalszego tematu (dla orkiestratora)

1. Ścieżka `applyMerge` nie czyta `typeId` na obiektach z `onHex`, dopóki `units` zawiera te same obiekty — zrzut mógł pochodzić ze STALE obiektu (jednostka usunięta z `units` między promptem a kliknięciem; np. oblegająca zginęła w bitwie, miasto przejęte). Ten wariant NIE był testowany (wymaga usunięcia A z `units` po promptcie przed kliknięciem). To jest następny konkretny wariant do przetestowania (H3 z dispatchu).
2. Scenariusze 3+ (oblegająca armia 3 + 1 dołącza) i „Idź do wodza” nie zostały wykonane.
3. Gdy zrzut pochodzi z bundla produkcyjnego (zminifikowanego), nazwy `Iz/qZ/g8/pe` nie są jednoznaczne; do potwierdzenia linii potrzebny jest build nie-zminifikowany (jak w harnessie).

## Propozycja następnego kroku (runda 2, Sonnet — uzasadnienie: 2 nieudane próby reprodukcji Haiku w tym samym temacie nie wystąpiły, więc Sonnet NIE jest wymagany wg zasady; orkiestrator decyduje)

- Wariant H3: po `promptMerge` usunąć A z `__mergeDbg.units()` (symulacja zniszczenia oblegającej), potem klik „Połącz” i odczyt `pageerror` ze stosem.
- Wariant 3+ oblegających i wariant z `followGeneral`.
- Jeśli żaden wariant nie daje błędu: poprosić właściciela o zapis gry (plik `.json` ze stanem sprzed kliknięcia) i kroki — wtedy odtworzyć na zapisie (`load`).

## Testy / bramki

- `npm ci --ignore-scripts` w `gra/` (worktree): 71 pakietów, exit 0. `gra/node_modules` usunięty po zakończeniu.
- `npx vite build --minify false` (kopia źródeł POZA repo w scratchpad): exit 0 (`built in 18.71s`).
- Reprodukcja: 3 wariantów, wyniki jak w tabeli wyżej (surowe wyjście z konsoli).
- Bramki referencyjne (tsc 0, logic-test, tech-tree-test, research-test, unit-replace-test, combat-test): NIE_ZMIERZONO — brak zmian w `gra/src`, więc nie uruchamiano.
- Testy regresyjne (`siege-nearby-lock-join-test.cjs`, `army-split-*`, `battle-siege-nearby-units-join-test.cjs`, `load-game-regression-test.cjs`): NIE_ZMIERZONO (brak zmian kodu).
- Test regresyjny (d): NIE DODANO — brak reprodukcji.

## Znaleziska poza zakresem (UWAGI-DLA-ORKIESTRATORA)

- `gra/tools/siege-nearby-lock-join-test.cjs` ma część C (Chromium) oznaczoną „NIE_ZMIERZONO w tym przebiegu (brak przeglądarki w kontenerze sesji)”; w tym kontenerze `/usr/bin/chromium` JEST dostępny i działa z Playwright 1.61 (`executablePath: '/usr/bin/chromium'`). Warto to zgłosić, bo część C może być uruchomiona.
- Skrypt `army-merge-panel-production-mount-test.cjs` używa `path.join(REPO, 'gra-robocza', 'Gra-ROBOCZA.html')` — zależy od artefaktu, którego nie ma w tym worktree (nie sprawdzano, czy istnieje w głównym repo).
- `main.ts` ma 50 586 linii; dispatch zakazuje przepisywania — punktowe zmiany są właściwe.

## Stan czystości

- Usunięto `gra/node_modules` po badaniu (ma być usunięte; nie jest śledzone przez git).
- Scratch build (`scratchpad/mergedbg/dist`, `root`) — do usunięcia po zakończeniu (poza repo).
- Worktree nie ma innych zmian (przed commitem raportu `git status` czysty).

NASTĘPNY KROK: orkiestrator decyduje — (a) runda 2 Operatora (wariant H3 + 3+ oblegających + followGeneral; harness w `dyspozycje/autobot/runs/R-WEB-ARMY-MERGE-JOIN-BESIEGING-TYPEID-CRASH-Q2/repro-merge-click-live.cjs`) albo (b) prośba do właściciela o zapis gry sprzed kliknięcia i kroki reprodukcji.
RUNDY: 1/5 (ostatni werdykt: BLOCK — brak reprodukcji; decyzja wymagana: kierunek rundy 2).
DEPLOY/PUSH: NIE WYKONANO
