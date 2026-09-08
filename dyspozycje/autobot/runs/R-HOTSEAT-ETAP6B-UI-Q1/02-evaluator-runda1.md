# R-HOTSEAT-ETAP6B-UI-Q1 — Evaluator runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6B-UI-Q1
GOAL: Niezależna weryfikacja raportu Operatora (commit `b123cd1f`): migracja 78 miejsc
rdzeniowych „UI" (U1-U14 main.ts + V1-V11 ui/*.ts) na isMe/ME, podłączenie realnego
`humanOwnerId` dla write-site cache `_last*` w `runWorldEndTurn()`, no-op przy
`humanOwnerIds=[0]`.

TESTY (wszystkie wykonane świeżo, niezależnie, worktree `/home/user/wt-hotseat-etap6b-ui`):
1. Zlokalizowano wszystkie 27 nagłówków funkcji U1-U14 (dziś: 3986-28274) świeżym `grep`
   + zmapowano granice ciała każdej funkcji do najbliższego następnego `function` na tym
   samym poziomie wcięcia. Fresh `grep -nE 'ownerId\s*(===|!==|=|\?\?)\s*0\b'` (bez
   filtrowania do samych `===`/`!==` — pokrywa też formy `= 0`/`?? 0`, zgodnie z regułą
   przeciw samooszukiwaniu) w każdym z tych zakresów: **ZERO trafień** we wszystkich 26
   klastrach main.ts poza `runWorldEndTurn()` (sprawdzonym osobno, p. 2). Potwierdza
   67/67 core main.ts.
2. `runWorldEndTurn(humanOwnerId: number)` — sygnatura potwierdzona. Wszystkie 11 write-site'ów
   cache `_last*` wskazanych w recon §4 sprawdzone bezpośrednio w bieżącym kodzie:
   `_lastLudnoscRate` (linia 29496, `c.ownerId === humanOwnerId`), `_lastBogactwoHandel/
   UtrzymanieBudynkow/Jednostek/Surowcow/Rate` (29610-29644, `econ.upkeepByOwner.get(humanOwnerId)`
   / `resourceUpkeepByOwner.get(humanOwnerId)`) — wszystkie realnie sparametryzowane, nie
   `ME()` global. `refreshPlayerCityEcon(perCity, ownerId)` (main.ts:6724) potwierdzona jako
   przyjmująca i używająca realnego parametru (nie literału), wywoływana z `runWorldEndTurn()`
   jako `refreshPlayerCityEcon(econ.perCity, humanOwnerId)`.
3. `ui/*.ts` V1-V11: wszystkie 8 spotów `cityPanel.ts` (`isMeCity()` wrapper), V9
   `powerOverlayHud.ts:203` (`isMe(d.ownerId)`), V10 `siegeMapPanel.ts:177`, V11
   `preBattle.ts:586` — potwierdzone `Read`/`grep` bezpośrednio, wzorzec wstrzykiwanego
   hooka z fallbackiem `?? (ownerId === 0)` identyczny do `game/army-cycle.ts`. Wiązanie w
   main.ts (`isMe: (ownerId) => isMe(ownerId)`) potwierdzone w 5 miejscach.
4. `tsc --noEmit` (świeże uruchomienie z `gra/`): **0 błędów, exit 0**.
5. 5 bramek referencyjnych uruchomione świeżo: logic-test 213/213, tech-tree-test 19/19,
   research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone,
   zgodne z raportem Operatora.
6. `node tools/hotseat-etap6b-ui-noop-test.cjs` uruchomiona w tle do końca (~11 min,
   przekracza domyślny timeout powłoki, stąd `nohup`+poll): PRZED vs PO = **20/20
   identycznych hashy** (turowe hashe identyczne bit-w-bit), 0 wyjątków JS w obu
   przebiegach; PO vs ZEPSUTY (isMe() na sztywno false) = **0/20 identycznych**,
   rozbieżność od tury 1 — nietautologiczność potwierdzona. Wynik: `PASS`.
7. `git diff --stat` / `git diff --check` względem poprzedniego commitu na tej gałęzi:
   zmienione wyłącznie pliki z allowlisty (`main.ts`, `ui/{cityPanel,siegeMapPanel,
   preBattle,powerOverlayHud}.ts`, nowy `tools/hotseat-etap6b-ui-noop-test.cjs`, raport).
   `git status` czyste, brak `git add -A`.

BLOKADY:
1. Zgodne z ujawnieniem Operatora (BLOKADY 1-3 raportu) — `game/turn-economy.ts:1219`
   (`sumEconomyForPlayerCities`, wciąż hardkodowane `ownerId===0`) rzeczywiście pozostaje
   niezmigrowane, plik poza allowlistą tego tematu, jawnie przypisane Etapowi 6c —
   potwierdzone `Read`, zgadza się z opisem. Brak nowych, nieujawnionych naruszeń w
   zakresie 78+cache.

RUNDY: 1/5

ZARZUTY:
1. [DROBNY, niewiążący dla binarnego kryterium tej rundy] `gra/src/ui/cityPanel.ts:7575`
   (`_legacyBuildBuildingDetailCard`, funkcja NIEobjęta listą V1-V8 recon) zawiera
   przedmigracyjny literał `const ownerId = 0;` przekazywany dalej do
   `buildingWorkCost(...)` → `applyDifficultyCostMultiplier` (`game/production.ts`,
   `game/difficulty-cost.ts` — pliki poza allowlistą tego tematu, kategoria (c)/(d)
   trudność/ekonomia, nie (b) UI). Metoda regex recon (`ownerId\s*(===|!==)\s*0\b`) z
   definicji NIE wykryłaby tej formy przypisania — dokładnie typ przeoczenia, przed
   którym ostrzega REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu (cytat: „Etap 6e znalazł 5
   pominiętych hardkodów formami `= 0`/`?? 0`"). Nie było to wymienione ani w 78
   core, ani w 20 granicznych, ani w BLOKADACH Operatora — pominięcie nieujawnione.
   Bez wpływu na behawioralny no-op DZIŚ (`humanOwnerIds=[0]` — literał i tak zgodny z
   jedynym aktywnym właścicielem), ale przy przyszłym `humanOwnerIds` różnym od `[0]`
   podgląd kosztu budowy w tym legacy-fallbacku liczyłby mnożnik trudności zawsze dla
   właściciela 0, niezależnie od przeglądanego miasta. Rekomendacja: rozliczyć jawnie w
   następnej rundzie (Obrona) lub przekazać do Etapu 6c/6d razem z analogicznym
   `turn-economy.ts:1219`, zamiast pozostawiać bez wzmianki.

NASTĘPNY KROK: Obrona (odpowiedź na zarzut 1 — albo migracja, albo jawne rozliczenie/
przypisanie do innego etapu, analogicznie do już ujawnionych BLOKAD) → Final Control.
DEPLOY/PUSH: NIE WYKONANO
