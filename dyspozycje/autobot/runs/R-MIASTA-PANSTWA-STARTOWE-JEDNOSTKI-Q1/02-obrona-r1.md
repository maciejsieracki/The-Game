STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1
GOAL: Przy foundowaniu miasta-panstwa nadaj mu startowe jednostki wojskowe wg
cityStateDifficulty: easy=0, normal=1, hard=2 — na mapie, przypisane do miasta,
zero zmian w foundowaniu gracza/major AI.
MODEL+EFFORT: claude-sonnet-5, effort high
RUNDA: 1/5

ZMIANY/COMMIT: autobot/R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1, HEAD `ca19f469`
(ta runda dopisuje na wierzchu, jeszcze niezacommitowane w chwili tego raportu):
- gra/src/main.ts: `dumpState()` haka `__cityStateStartUnitsTestDebug` (juz
  istniejacego z `ca19f469`) rozszerzony o `menuCivId: _menuCivId` i per-miasto
  `civTypeId: aiOwnerCivMap.get(c.ownerId) ?? null` — surowy odczyt istniejacego
  stanu silnika (ten sam `Map` co uzywa realny kod foundowania), zero nowej
  logiki liczenia. +12 linii.
- gra/tools/city-state-start-units-live-test.cjs: nowy blok assercji per
  `cityStateDifficulty` dzielacy miasta-panstwa na dwie ROZLACZNE grupy wg
  `civTypeId === menuCivId` (rywal tego samego typu, `spawnPendingSameTypeRivals`)
  vs `civTypeId !== menuCivId` (kopia klastra obcego typu, `spawnPendingForeignClusters`)
  i sprawdzajacy DOKLADNA liczbe jednostek W KAZDEJ Z OSOBNA. +37 linii.

OBRONA: 1 -> PRZYJMUJE + dowod (zywy test).

Zarzut mial dwie czesci — obie zaadresowane:

**Czesc 1 (zywa generacja + realne przeliczenie per miasto-panstwo).** Juz
zaadresowana w poprzednim kroku tej samej rundy (commit `ca19f469`,
`gra/tools/city-state-start-units-live-test.cjs`): realny `vite build --outDir
gra/dist-city-state-start-units-live-test` (dozwolona komenda), headless
Chromium, hak `__cityStateStartUnitsTestDebug` steruje WYLACZNIE danymi
wejsciowymi realnego `doStartGame`/`tryFoundPlayerCityAt` (zero reimplementacji
`grantCityStateStartUnits`/`spawnDifficultyBonusUnit`/`spawnPendingSameTypeRivals`/
`spawnPendingForeignClusters` — wszystkie zamkniete w `main.ts`, nieeksportowane,
wykonuja sie w PRAWDZIWYM `boot()`). 3 pelne generacje swiata w JEDNYM biegu
(hard/normal/easy), `dumpState()` to surowy odczyt `cities`/`units` po
zakonczeniu generacji — zero logiki liczenia w haku, porownanie z oczekiwana
liczba robi test w `tools/`.

**Czesc 2 (anty-duplikacja na OBU punktach foundowania) — dodatek tej rundy.**
Statyczny recon potwierdza strukturalna rozlacznosc dwoch punktow wywolania
`grantCityStateStartUnits`:
- `spawnPendingSameTypeRivals` (main.ts:8144+) — rywale tego samego typu co
  gracz, hexy generowane DYNAMICZNIE po zalozeniu stolicy gracza
  (`buildSameTypeRivalCandidateHexes`), `pendingSameTypeRivalCount` drenowane
  do 0 NA SAMYM POCZATKU funkcji (main.ts:8147), przed petla — powtorne
  wywolanie funkcji (np. przy zalozeniu drugiego miasta gracza) jest no-opem.
- `spawnPendingForeignClusters` (main.ts:8337+) — kopie klastrow OBCEGO typu,
  zrodlo `pendingForeignSpawnCities` = `plan.spawnCities` z
  `buildClusterSpawnPlan` (gra/src/map/cluster-spawn.ts:330-371), ktora
  BUDUJE `slots` WYLACZNIE z klastrow `klaster.typIndex !== placement.playerTypIndex`
  (cluster-spawn.ts:332: `if (klaster.typIndex === placement.playerTypIndex) continue;`)
  — rywale tego samego typu NIGDY nie trafiaja do tej listy, wiec zbiory miast
  obslugiwane przez oba punkty sa z definicji rozlaczne (zaden hex/ownerId nie
  moze byc przetworzony przez OBIE funkcje). `pendingForeignSpawnCities`
  rowniez drenowane do `[]` na poczatku funkcji (main.ts:8340).
- Statyczny straznik z `city-state-start-units-test.cjs` (Sekcja B, juz
  istniejacy z `59ecd496`) potwierdza tekstowo: `grantCityStateStartUnits`
  wystepuje DOKLADNIE 3x w `main.ts` (1 definicja + 2 wywolania) — nie ma
  trzeciego, ukrytego miejsca wywolania.

Dodatkowo (dowod dynamiczny, ten dodatek): `dumpState()` teraz eksponuje
`civTypeId` per miasto (surowy odczyt `aiOwnerCivMap`, ten sam `Map` co uzywa
`spawnPendingSameTypeRivals`/`spawnPendingForeignClusters` do klasyfikacji
`isCS`) i `menuCivId`. Test dzieli miasta-panstwa kazdego biegu na dwie grupy
wg `civTypeId === menuCivId` i sprawdza DOKLADNA liczbe jednostek W KAZDEJ Z
OSOBNA — nie tylko na polaczonej liscie. Gdyby `grantCityStateStartUnits` byla
wywolana wielokrotnie dla tego samego miasta w KTORYMKOLWIEK z dwoch punktow,
odpowiednia grupa dostalaby 2x/3x oczekiwana liczbe (np. 4 zamiast 2 na hard)
i test tej WLASNIE grupy poczerwienialby — bez maskowania przez druga grupe,
bo liczone osobno.

TESTY (wszystkie uruchomione niezaleznie w tym worktree, HEAD `ca19f469` +
niezacommitowane zmiany tej rundy):

- `node ./node_modules/typescript/bin/tsc --noEmit` → 0 bledow.
- `node gra/tools/city-state-start-units-live-test.cjs` (zaktualizowany, zywy
  bieg w headless Chromium, `CS_LIVE_DEBUG=1`) → **22 pass, 0 fail**. Log
  potwierdza dla KAZDEJ z 3 trudnosci: `[ClusterStart] deferred same-type
  rivals=4/4` ORAZ `[ClusterStart] deferred foreign clusters=10/10` — OBA
  punkty foundowania faktycznie sie uruchomily w tym samym biegu (nie tylko
  jeden), po czym: `KAZDE miasto-panstwo ma DOKLADNIE {2,1,0} jednostek NA
  MAPIE` (polaczona lista) i NASTEPNIE osobno `[rywale tego samego typu]
  KAZDE miasto-panstwo ma DOKLADNIE {2,1,0} jednostek` oraz `[kopie klastrow
  obcego typu] KAZDE miasto-panstwo ma DOKLADNIE {2,1,0} jednostek` —
  wszystkie PASS, na kazdym z 3 poziomow trudnosci, na obu grupach osobno.
  Zero bledow konsoli/JS przez caly bieg (3 pelne generacje).
- `node gra/tools/city-state-start-units-test.cjs` (Sekcja A+B, statyczny
  straznik wpiecia) → 16/16 PASS, w tym potwierdzenie "grantCityStateStartUnits
  wystepuje dokladnie 3x w main.ts (1 definicja + 2 wywolania)".
- `node gra/tools/ai-difficulty-bonus-test.cjs` → 68/68 (bez zmian od `59ecd496`).
- `node gra/tools/city-state-alliance-test.cjs` → 67/67 (regresja, bez zmian).
- `node gra/tools/city-state-cluster-diff-test.cjs` → 31/31 (regresja, bez zmian).
- 5 bramek referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs`
  19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13,
  `combat-test.cjs` 6/6.
- `git diff --check` (worktree wobec `ca19f469`) → czysty, brak bialych znakow.
- `git status --porcelain` → wylacznie `gra/src/main.ts` i
  `gra/tools/city-state-start-units-live-test.cjs` zmodyfikowane (zgodne z
  allowlista dispatchu: "Nowe lub rozszerzone testy w gra/tools/*-test.cjs" +
  "gra/src/main.ts — WYLACZNIE punkt foundowania miasta-panstwa" — tu:
  wylacznie hak testowy `__cityStateStartUnitsTestDebug.dumpState()`, zero
  zmian w samej logice foundowania/spawnu).

BLOKADY: brak dla zakresu tego zarzutu. `cluster-start-test.cjs` (12/470 FAIL
niepowiazanych z diffem tego tematu — patrz `01-operator.md`) nie byl
ponownie uruchamiany w tej rundzie obrony — bez zmian w plikach, ktore ten
test importuje (`cluster-start.ts`, `map/cluster-spawn.ts`, `map/generator.ts`,
`map/clusters.ts`, `map/gen-helpers.ts`, `game/civ-entry-epoch.ts`,
`game/cities.ts` — zaden nie jest w diffie ani tej, ani poprzedniej rundy),
wynik pozostaje w mocy z `01-operator.md`.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet 5, effort high) — niezalezna weryfikacja
zywego dowodu (22/22 PASS w headless Chromium) i statycznego reconu
rozlacznosci dwoch punktow foundowania.
DEPLOY/PUSH: NIE WYKONANO
