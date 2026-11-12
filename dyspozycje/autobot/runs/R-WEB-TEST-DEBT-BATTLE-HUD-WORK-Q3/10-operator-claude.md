# R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME-TEST (zmiany tylko w gra/tools/*-test.cjs; zero zmian w gra/src, JSON balansu, WERSJE.md, rust-port)
TEMAT: R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3
GOAL: dług testowy z FAL 651–658 — dla każdego testu: wynik na bazie, klasyfikacja (nieaktualny test | realny defekt | timeout środowiska), poprawka tylko przy klasyfikacji „nieaktualny test”, bez osłabiania asercji.
BAZA: origin/main = b0b0e3f86 (worktree wf_afd18b8f-fb2-1, `git checkout --detach origin/main`, bez zmian w src przed pomiarem „na bazie”).
UWAGA: dispatch 00-dispatch.md NIE istnieje w origin/main; odczytany z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (plik dodatku odczytany poprawnie).

## ZMIANY / COMMIT
Commit: patrz sekcja „SHA” na końcu raportu (commit z kodem testów + tym raportem).
Allowlista: gra/tools/{auto-battle-simultaneous,battle-dead-unit-disappearance,grupy-budynkow,hint-toast-zindex-empire-panel,load-fail-toast-zindex,mgla-sciezka-inwariant,pre-battle-save}-test.cjs oraz dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3/**.
Poza allowlistą: NIC nie zmienione (praca-jeden-podzial-kontrakt-test, battle-attack-move-pointer, battle-natural-chariot-r5, battle-ranged-approach-regression, sidepanel-hud-deadzone — bez zmian).
Środowisko: `npm ci --ignore-scripts` w gra/ (node_modules w worktree). Brak `npm run build`/`dev`.

## TABELA: test → wynik na bazie / po poprawce / klasyfikacja

| # | Test (gra/tools/) | Baza (b0b0e3f86) | Po poprawce | Klasyfikacja | Zmiana |
|---|---|---|---|---|---|
| 1 | auto-battle-simultaneous-test | 28 pass / 1 FAIL („dead/routed/previously-acted units cannot enter a later phase”, `resolveAutoBatchPhase` zwraca 1 rozstrzygnięcie zamiast 0) | 29 pass / 0 FAIL | nieaktualny test | asercja dla zroutowanego: zostaje żywy i wykonuje ucieczkę (`src/battle/autoBatchPhase.ts`, decyzja W21 R-WEB-BATTLE-ROUTED-UNITS-PURSUED-AND-DESTROYED-Q1); martwy atakujący i `acted` nadal wykluczone |
| 2 | battle-attack-move-pointer-test | FAIL: `locator.evaluate: Timeout 30000ms`; diagnostyka: „Unexpected token '<'” (skrypt zwrócił HTML zamiast JS) | nie naprawiono | NIE ROZSTRZYGNIĘTE — hipoteza: timeout/środowisko serwowania bundla (strona dostała HTML). Niezweryfikowane. | brak |
| 3 | battle-dead-unit-disappearance-test (node) | FAIL: `occByKey.has('7,12')` oczekiwane false (zroutowany zwalnia pole) | PASS | nieaktualny test | `src/battle/battleScene.ts:9935–9936`: zroutowany ZOSTAJE w occByKey (komentarz W21); asercja zmieniona na `true` z komentarzem |
| 3b | battle-dead-unit-disappearance-browser-test | nie uruchomiono | — | NIE_ZMIERZONO | brak |
| 4 | battle-natural-chariot-r5-test | FAIL: `locator.click: Timeout 30000ms` na `button[data-deploy-main-btn="lines"]` (element znaleziony, nie „visible, enabled and stable”) | nie naprawiono | NIE ROZSTRZYGNIĘTE (nie zbadane: możliwy zasłonięty przycisk / kolejność kroków testu; brak dowodu) | brak |
| 5 | battle-ranged-approach-regression-test | baza: timeout 280 s (wg dispatchu). Mój przebieg: koniec po ~40 s, FAIL `page.evaluate: activation timeout atk/infantry/steady/1` | nie naprawiono | NIE ROZSTRZYGNIĘTE (timeout bazowy nie odtworzony w tym przebiegu; błąd aktywacji jednostki nie zbadany) | brak |
| 6 | pre-battle-save-test | crash bundlera: esbuild bez loadera `?raw` (SVG) i bez `import.meta.glob` (cjs); potem FAIL/zawieszenie: `document` niezdefiniowany przy require, asercja synchroniczna wobec `async onSave` | PASS (`pre-battle-save-test: OK`) | nieaktualny test + dług narzędzia testowego (brak shimów Vite; kolejność require; brak await) | shim plugin esbuild (`?raw` jako tekst, `import.meta.glob(` → pusta mapa w src/*.ts), async build, JSDOM przed require, `await` na tick po kliknięciu |
| 7 | hint-toast-zindex-empire-panel-test | FAIL (4): regex wymaga starej formuły bez gałęzi `aboveBattle ? '10030'`; przebieg 280 s = exit 124 | exit 0 (zielony) | nieaktualny test | regex (4) oraz FIXED/BROKEN_ZINDEX_LINE zaktualizowane do bieżącej formuły (`src/main.ts:17433`), intencja bez zmian |
| 8 | load-fail-toast-zindex-test | 12 pass / 3 FAIL (marker sygnatury `showHintMessage`, formuła z-index) | 15 pass / 0 FAIL | nieaktualny test | marker `function showHintMessage(`; regex formuły z `aboveBattle` i `isEmpireDetailPanelOpen` |
| 9 | grupy-budynkow-test | 80 pass / 3 FAIL (buildings.json: 44 zamiast 43; „Wojsko i obrona” 8 zamiast 7) | 83 pass / 0 FAIL | nieaktualny test (dane rozrosły się o 1 budynek; zgodne z `building-cards-top5-test` „ma 44 budynki”) | TOTAL 43→44; „Wojsko i obrona” 7→8. UWAGA: nie ustaliłem id nowego budynku (historia git jest spłaszczona) — do weryfikacji przez FC |
| 10 | mgla-sciezka-inwariant-test | 41 pass / 1 FAIL: 4 nieskasyfikowane zapisy pozycji w `src/game/ai.ts` (3736, 3771–3772, 3819) | 42 pass / 0 FAIL | klasyfikacja NOWYCH miejsc (nie osłabienie) — decyzja do potwierdzenia przez FC | dopisane 4 wpisy KLASYFIKACJA = BEZ-MGLY-GRACZA (kopie `sim`/`pos` jednostek AI w `applyArmySeeksEnemyArmy` i `orderMovesToUnblock`; realny ruch = komendy `move`) |
| 11 | praca-jeden-podzial-kontrakt-test | 635 OK / 2 FAIL: „kontrola negatywna: przy budżecie z PRZYROSTU … daje 0 Pracy” (got 1460 i 1520, want 0) | nie naprawiono | NIE ROZSTRZYGNIĘTE — podejrzenie: kontrfaktyczny wiring „przyrost” (`improvementBudgetCap`) nie odwzorowuje już silnika: cap jest honorowany tylko w `pickAutoImprovementsStaged` (`src/game/auto-improvements.ts:904`), nie w `pickAutoImprovementsSinglePass`. NIEZWERYFIKOWANE (nie zbadano ścieżki staged/single dla tego wejścia) | brak; wymaga decyzji FC |
| 12 | sidepanel-hud-deadzone-test | timeout 110 s (wg dispatchu) | exit 0 przy limicie 580 s (wszystkie asercje OK, w tym mutacje CSS) | timeout środowiska (limit 110 s za krótki) — czas całkowity nie zmierzony | brak |

Dodatkowo: `npx tsc --noEmit` w gra/ → exit 0, 0 linii wyjścia (po zmianach).

## TESTY (dokładne wyniki z surowego wyjścia)
- auto-battle-simultaneous-test: `29 pass, 0 fail` (exit 0)
- battle-dead-unit-disappearance-test: `PASS — killed unit detached immediately; routed unit still flees visibly` (exit 0)
- grupy-budynkow-test: `83 pass, 0 fail` (exit 0)
- hint-toast-zindex-empire-panel-test: exit 0
- load-fail-toast-zindex-test: `15 passed, 0 failed` (exit 0)
- mgla-sciezka-inwariant-test: `42 pass, 0 fail` (exit 0)
- pre-battle-save-test: `pre-battle-save-test: OK` (exit 0)
- sidepanel-hud-deadzone-test: exit 0 (limit 580 s)
- tsc --noEmit: exit 0

## BLOKADY
1. Nierozstrzygnięte (bez poprawki): battle-attack-move-pointer, battle-natural-chariot-r5, battle-ranged-approach-regression, praca-jeden-podzial-kontrakt (2 FAIL).
2. Nie uruchomiono: battle-dead-unit-disappearance-browser-test.
3. Pięć bramek z dispatchu (poza tsc) nie zostało uruchomione w tej rundzie — brak dowodu, NIE_ZMIERZONO.
4. Do decyzji FC: czy klasyfikacja 4 zapisów ai.ts jako BEZ-MGLY-GRACZA jest właściwa (mgla); czy nowy budynek w „Wojsko i obrona” jest zaakceptowany (grupy).

## ZAŁOŻENIA (luki rozstrzygnięte założeniem)
- Zroutowany zostaje na polu (occByKey / live) — zgodnie z komentarzami W21 w kodzie, nie z testem.
- Nowe zapisy pozycji w ai.ts dotyczą kopii planistycznych AI, nie jednostek gracza (potwierdzone czytaniem kodu: `sim`/`pos` budowane z `units` AI; `playerId` = AI).

## RUNDY
1/5 (runda 1). Nie było rund poprawkowych.

## NASTĘPNY KROK
FC (Sonnet): zweryfikować klasyfikacje z tabeli, zwłaszcza #10 (mgla) i #9 (id nowego budynku); osobny temat na praca-jeden (ścieżka cap staged vs single) i na trzy testy przeglądarkowe (serwowanie bundla / widoczność przycisku / aktywacja jednostki).

## DEPLOY/PUSH: NIE WYKONANO
