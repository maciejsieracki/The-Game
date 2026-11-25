STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-FOODRESERVE-Q1
GOAL: dokończyć migrację literału 0 → fotel wyświetlany w HUD żywności (zapas, cap, tempo netto, wpływ, koszt armii, niedokarmione miasta, głód wojska, tick) tak, by HUD fotela ownerId ≠ 0 nie mieszał danych z fotela 0; strażnik testowy czerwony po przywróceniu każdego literała.
ZMIANY/COMMIT: baza be414ecd749d84349cd623e1cb7c9239967746e6 (kandydat Operatora r1), runda obrony r2. Allowlista: gra/src/main.ts (projectPlayerFoodProjection + HUD buildHudStateRaw), gra/tools/hud-me-literal-zero-test.cjs (dopisane asercje), dyspozycje/autobot/runs/R-WEB-HUD-ME-FOODRESERVE-Q1/30-obrona-claude.md. SHA czubka = pole sha w StructuredOutput (commit obrony).

## Odpowiedzi na zarzuty Evaluatora (34d73e4d237413d5c09ed42f9f3a3c8d0b869544)

### Zarzut 1 (ważny): niespójność HUD dla ownerId != 0 w projectPlayerFoodProjection
PRZYJMUJĘ. Poprawka w tej rundzie.
- gra/src/main.ts L23361: `function projectPlayerFoodProjection(): {` → `function projectPlayerFoodProjection(ownerId: number = 0): {`.
- Wewnątrz ciała wszystkie literały właściciela 0 w roli fotela liczącego zastąpione przez `ownerId`:
  - `cities.filter(c => c.ownerId === 0 && ...)` → `=== ownerId` (miasta fotela),
  - `new Map([[0, civ]])` → `new Map([[ownerId, ownerId === 0 ? (player.civType || 'grecy') : civTypeForOwner(ownerId)]])` (gałąź `ownerId === 0` zachowuje dotychczasowe zachowanie bit-identyczne dla wszystkich wywołań bez argumentu; dla innych foteli cywilizacja z `civTypeForOwner`, czyli istniejący helper per-właściciel),
  - `buildWonderCityYieldsByOwnerMap([0])` → `([ownerId])`,
  - `tk.ownerId !== 0` (dwa miejsca, preview.perCity) → `!== ownerId`,
  - `spichlerzSolArmyBonusActive(0)` → `(ownerId)`,
  - `u.ownerId === 0` (jednostki) → `=== ownerId`,
  - `militaryFoodConsumptionWithSpichlerz(playerUnits, 0, ...)` → `(playerUnits, ownerId, ...)`,
  - `getEmpireFoodReserve(0)` → `getEmpireFoodReserve(ownerId)`.
- Zostawione celowo: `player.era` i `player.zbadane` jako argumenty ME-level w `previewCityEconomy`. Preview i tak dostaje resolwery per właściciel (`empireEpochForOwner`, `unlockedTechSetForOwner`, `makeOwnerZlotoAccessResolver`, `makeOwnerEmpireStockResolver` itd.), ten sam wzorzec co w innych wywołaniach previewCityEconomy (L23594 w buildEmpireResourceRows). Nie rozszerzam zakresu o to.
- L24048 buildHudStateRaw: `const foodProj = projectPlayerFoodProjection();` → `projectPlayerFoodProjection(ownerId)`. Ta jedna zmienna `foodProj` zasila zarówno `foodNetRate`, `zywnoscWplywMiast`, `zywnoscKosztWojska`, jak i fallback `zywnoscMiastNiedokarmionych` (`foodProj.unfedCityCount`), więc wszystkie pola HUD żywności są teraz z jednego fotela.
- `projectPlayerFoodNetRate()` (L23488) i wywołanie w `buildEmpireFoodSnap` (bez argumentu) zostają na domyślnym 0. Zachowanie tych ścieżek nie zmienia się.

Dowód (kod po zmianie): `grep -n "projectPlayerFoodProjection(" gra/src/main.ts` daje: definicja `(ownerId: number = 0)`, wywołanie HUD `(ownerId)`, wywołania bez argumentu tylko w `projectPlayerFoodNetRate` i ewentualnie w miejscach poza buildHudStateRaw (nie zmienione).

### Zarzut 2 (ważny): test strażnik nie pokrywa miejsca z zarzutu 1
PRZYJMUJĘ. Dopisano 10 asercji w gra/tools/hud-me-literal-zero-test.cjs (wynik po zmianie: 26 PASS / 0 FAIL):
- buildHudStateRaw: `projectPlayerFoodProjection(ownerId)` obecne, brak `projectPlayerFoodProjection()` i `projectPlayerFoodProjection(0)`,
- ciało projectPlayerFoodProjection (wycinek od sygnatury do `function projectPlayerFoodNetRate(` — bez dopasowania klamer, bo typ zwracany `{...}` w sygnaturze zrywał dopasowanie nawiasów; to poprawka własna testu w trakcie pracy): brak `getEmpireFoodReserve(0)`, `c.ownerId === 0`, `tk.ownerId !== 0`, `u.ownerId === 0`, `buildWonderCityYieldsByOwnerMap([0])`, `spichlerzSolArmyBonusActive(0)`, `militaryFoodConsumptionWithSpichlerz(playerUnits, 0,`, `new Map([[0,`,
- sygnatura `(ownerId: number = 0)` i użycie `getEmpireFoodReserve(ownerId)` oraz `militaryFoodConsumptionWithSpichlerz(playerUnits, ownerId,` w ciele.
Asercje nie osłabiane, istniejące 16 bez zmian.

Mutacje (kopia main.ts w scratchpad, HUD_ME_GUARD_MAIN, każda czerwona):
- M1 HUD `projectPlayerFoodProjection(ownerId)` → `projectPlayerFoodProjection()`: exit=1, 25 PASS / 1 FAIL
- M2 projekcja `getEmpireFoodReserve(ownerId)` → `(0)`: exit=1, 24 PASS / 2 FAIL
- M3 projekcja `militaryFoodConsumptionWithSpichlerz(playerUnits, ownerId,` → `0,`: exit=1, 24 PASS / 2 FAIL
- M4 projekcja `cities.filter(c => c.ownerId === ownerId ...)` → `=== 0`: exit=1, 25 PASS / 1 FAIL
- M5 HUD `const foodReserve = Math.floor(getEmpireFoodReserve(ownerId));` → `(0)`: exit=1, 24 PASS / 2 FAIL
Poprzednie mutacje z r1 (6 miejsc w buildHudStateRaw: reserve, cap, capfn, starve, tick, hungry) dalej czerwone w tym samym strażniku (16 asercji r1 nienaruszone).

### Zarzut 3 (drobne): ownerId zamiast ME() w dispatchu, nieopisane jako odstępstwo
PRZYJMUJĘ jako wyjaśnienie, bez zmiany kodu. Sygnatura `buildHudStateRaw(ownerId: number = ME())` (gra/src/main.ts L24011) — domyślna wartość ownerId to ME(), więc `ownerId` w ciele jest równe ME() dla wywołania bez argumentu i równe fotelowi wyświetlanemu dla wywołania z hotseat. Pozostałe literały 0 w buildHudStateRaw (ownerReligionForOwnerId, buildEmpireResourceRows, empirePoborTotals, civManpowerMultsForOwner, wonderTradeRouteBonusForOwner, civKolorHexFn, leaderNameForOwnerId, civDisplayNameForOwner, L24031 arg. ery, L24057/L24147 `?? 0`) zostają — poza zakresem tematu (nie żywność), wypisane jako kandydaci w UWAGACH.

### Zarzut 4 (bez zarzutu wobec kodu): zakres „sąsiedztwo” z tytułu
PRZYJMUJĘ jako lukę, rozstrzygniętą założeniem (brak zmiany kodu). Dispatch nie definiuje „sąsiedztwa”; nie wykonano. Do decyzji orkiestratora (patrz UWAGI).

## Stan kodu po rundzie obrony (ostateczne literały 0 w HUD żywności)
- buildHudStateRaw: getEmpireFoodReserve(ownerId), projectPlayerFoodMaxCap(ownerId), projectPlayerFoodProjection(ownerId), getArmyStarvationCountdown(ownerId, …), getLastEmpireFoodTick(ownerId), isArmyHungry(ownerId). Brak literału 0 w roli fotela żywności.
- projectPlayerFoodProjection: brak literału 0 w roli fotela (poza gałęzią `ownerId === 0` w civ-mapie, celową dla zachowania bit-identycznego dla domyślnego wywołania; oraz player.era / player.zbadane jako argumenty ME-level, patrz wyżej).
- W single-player ownerId = ME() = 0: zachowanie bit-identyczne.

## TESTY (liczby z surowego wyjścia, cwd gra/, po zmianie main.ts)
- npm ci --ignore-scripts (bez skryptów postinstall, bez npm run build/dev)
- tsc --noEmit: EXIT=0
- logic-test: LOGIC OK (213/213), EXIT=0
- tech-tree-test: 20 pass, 0 fail, EXIT=0
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33, EXIT=0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), EXIT=0
- combat-test: COMBAT TEST: 6/6 pass, EXIT=0
- ai-test: 297 passed, 0 failed, EXIT=0
- hud-moc-warstwa-test: WYNIK: 28 PASS, 0 FAIL, EXIT=0
- hud-me-literal-zero-test: 26 PASS / 0 FAIL, EXIT=0
- moc-ranking-rozjazd-test: WYNIK: 19 PASS, 0 FAIL, EXIT=0
- era-war-pairing-alliance-test: 19 pass, 0 fail, EXIT=0
- hotseat-etap6d-podetap-e-source-test: 77 PASS, 0 FAIL, EXIT=0
- granice-relacja-dyplomatyczna-test: 52 passed, 0 failed, EXIT=0
- git diff --check: czysto.
- Przeglądarka / live: NIE ZMIERZONO (brak uruchomienia gry w przeglądarce w tej rundzie; zarzut 1 dotyczy hotseat ownerId ≠ 0, co wymaga żywego testu do potwierdzenia).

## BLOKADY
Brak twardych blokad. Zostaje: brak żywego dowodu w przeglądarce dla hotseat fotela 2 (NIE ZMIERZONO).

## RUNDY
2/5 (ostatni werdykt Evaluatora: FAIL z zarzutami 1–4 — zarzut 1 i 2 przyjęte i poprawione w tej rundzie; zarzut 3 wyjaśniony; zarzut 4 bez zmiany kodu).

## NASTĘPNY KROK
Evaluator: sprawdzić diff projectPlayerFoodProjection (zarzut 1) i nowe asercje + mutacje M1–M5 (zarzut 2). Final Control: decyzja o zakresie player.era/player.zbadane (ME-level w preview) i o żywym teście hotseat fotela 2 przed deployem.

## UWAGI-DLA-ORKIESTRATORA
- Kandydaci na osobne tematy (ta sama klasa błędu, poza allowlistą): buildEmpireFoodSnap L20666–20667 (getLastEmpireFoodTick(0), getEmpireFoodReserve(0), getEmpireFoodMaxCap(0)) — panel żywności, nie buildHudState; empirePoborTotals(cities, 0, …) i civManpowerMultsForOwner(0) w buildHudStateRaw; ownerReligionForOwnerId(0), buildEmpireResourceRows(0) i pozostałe *ForOwner(0) w buildHudStateRaw; player.era / player.zbadane jako argumenty ME-level w previewCityEconomy projectPlayerFoodProjection (preview dostaje już resolwery per właściciel).
- „Sąsiedztwo” z tytułu tematu nie zostało zdefiniowane w dispatchu ani w DODATKU; nie zinterpretowano, nie wykonano. Do decyzji orkiestratora.
- node_modules w gra/ powstał przez npm ci --ignore-scripts; usunięty po commicie (patrz DEPLOY/PUSH sekcja poniżej i wynik sprzątania).

DEPLOY/PUSH: NIE WYKONANO
