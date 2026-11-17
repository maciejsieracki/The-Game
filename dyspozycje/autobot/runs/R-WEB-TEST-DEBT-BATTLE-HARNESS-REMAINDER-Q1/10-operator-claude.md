# R-WEB-TEST-DEBT-BATTLE-HARNESS-REMAINDER-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (częściowo: punkt (3) DECISION_REQUIRED; punkt (2) naprawiony tylko na poziomie asercji tekstowej)
DOMAIN: PROCESS (narzędzia testowe, tylko `gra/tools`)
TEMAT: R-WEB-TEST-DEBT-BATTLE-HARNESS-REMAINDER-Q1
GOAL: (1) fixture standoff/auto-battle; (2) F8 army-stack; (3) archer-behind — diagnoza; (4) brandAssets svg?raw / import.meta.glob w harnessach. Bez zmian w `gra/src`.
BAZA: 604a4f873b878a37d45010ba6d39dc5110e6b697 (origin/main), `git checkout --detach`.
ZMIANY-COMMIT: patrz sekcja „Commit" na końcu (commit tylko jawnie wymienionych plików `gra/tools/*.cjs` i tego raportu).

## Wyniki per punkt

### (1) fixture `_queuedOrderUnitIds` / TypeError — ZROBIONE
- `battle-standoff-two-warriors-test.cjs`: dodano `_manualArbOwner: new Map()` do fixture sceny (pole używane przez `_computeManualArbitrationClaims`, battleScene.ts ~5830). Wynik surowy: `exit=0`, 9 × PASS, 0 × FAIL (przed zmianą: TypeError `reading 'clear'`, exit=1).
- `auto-battle-simultaneous-test.cjs`: dodano `_manualArbOwner`, `log`, `vTimers`, `routedUnits`, `occByKey` do `makeTurnFixture`. Dodatkowo: `_activateUnit` w fixture ignoruje wywołania planera (`this._autoBatchPlanning` ustawione) i nie zapisuje ich w rejestrze aktywacji. Powód: planer `_snapshotAutoBatchIntents` (battleScene.ts ~5966–6030) wywołuje realne `_activateUnit` na klonach; bez tej zmiany rejestr zawierał 4 fałszywe aktywacje (zmierzone stack trace). Wynik surowy: `exit=0`, `29 pass, 0 fail` (przed: TypeError `clear`, potem `reading 'length'`, potem assertion).

### (2) F8 army-stack-limit — naprawione asercję tekstową, KOD NIE ZMIENIANY
- Przyczyna: `army-stack-limit-test.cjs` F8 szukał `truncatePath: (fullPath) => trimPathToStackRoom(units, [u], …)`. W `src/main.ts` ~45741 parametr nazywa się `fullPathIn`, a przed `trimPathToStackRoom` jest `aiAmbushCutter.cut(...)` (zasadzki). Wywołanie `trimPathToStackRoom(units, [u], …, armyStackLimit())` istnieje i jest poprawne — stara regex była nieaktualna.
- Zmiana: regex F8 uogólniony (`truncatePath: \(\w+\) => \{ … trimPathToStackRoom(units,[u], … armyStackLimit()`). Nie osłabiono warunku: nadal wymaga przycinania trasy AI do miejsca w stosie.
- Wynik surowy: `exit=0`, `army-stack-limit-test: 51 asercji, wszystkie OK` (przed: F8 FAIL, exit=1).
- NIE ZMIERZONO: mutacja (usunięcie bramki z `truncatePath`) — nie wykonana w tej rundzie.

### (3) archer-behind (`bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs`) — DECISION_REQUIRED, test BEZ osłabienia
- Wynik surowy: 7 PASS / 5 FAIL (wszystkie 5 FAIL dotyczą łuczników: „keeps the archer behind…”, „does not take a lateral detour…”, „remains behind in same lane”, „advances the archer into the tile vacated…”, „preserves infantry lead…”). Test nie został zmieniony.
- Dowód z dekompozycji: w planerze (`_snapshotAutoBatchIntents`) łucznik w fazie Atak dostaje intent `move` na (2,2) zamiast `hold` (zrzut: `{"u":"archer","k":"move","s":[{"col":2,"row":2}]}`), czyli krok boczny z (2,3).
- Źródło: commit `9dc324bb9` („Fix ranged approach in attack doctrine", 2026-10-29) — świadomie dodał w `_rangedFiringStepStaysBehindMelee`/planerze regułę: „take only the first lateral step when that lane immediately opens forward progress" (komentarz w battleScene.ts ok. 6580–6612). Test `bitwa-auto-atak-…` powstał w `f48894231` (2026-10-28), czyli PRZED tą zmianą; jego asercje (hold, zero kroków bocznych) odpowiadają starej semantyce.
- Ocena: to nie jest błąd techniczny harnessu ani przypadkowy błąd kodu — zachowanie łucznika (boczny krok, by ominąć zablokowany front) jest zamierzone w `9dc324bb9`. Czy ta semantyka gry ma obowiązywać, czy test ma wrócić do „wstrzymaj” — to decyzja o regule gry.
- Status: **DECISION_REQUIRED** — pytanie do właściciela/orkiestratora: (A) zaktualizować asercje do semantyki „pierwszy krok boczny, gdy otwiera pas do przodu” (z cytatem commita 9dc324bb9), (B) przywrócić „wstrzymanie” w kodzie (zmiana src — poza tym tematem), (C) zostawić test czerwony. Ten temat nie zmienia `src`.
- Uwaga: commit `0c74bd52d` (RESIDUAL-INFANTRY-Q2) zmienił ścieżkę strzelców po zderzeniu na BFS; nie sprawdzono, czy to wpływa na ten scenariusz (NIE ZMIERZONO).

### (4) brandAssets `svg?raw` / `import.meta.glob` — ZROBIONE dla harnessów, JEDEN błąd w `src`
- Skan: 131 plików `tools/*.cjs` zawierających `menu-emblem.svg?raw` lub `import.meta.glob`. Uruchomiono każdy (timeout 45 s), sprawdzano komunikaty esbuild („No loader…”, „Could not resolve”, „Build failed”, „Transform failed”).
- Wykryte błędy budowania (przed zmianami): 7 plików:
  - `side-panel-unit-cycle-arrows-test`, `sidepanel-events-toolbar-test`: filtr stuba `/icons\/brandAssets$/` nie łapał importu `./brandAssets` → `No loader for .svg?raw`. **Naprawa:** filtr `/brandAssets$/`. Wynik: exit=0 (oba). 
  - `empire-armia-produkcja-test`, `empire-miasta-table-test`, `empire-panel-miasto-obywatele-content-test`: ten sam filtr + brak pluginu `lib/esbuild-raw-plugin.cjs` (scienceOwlIcon `?raw`) + niepełne exporty stubu. **Naprawa:** filtr `/brandAssets$/`, plugin raw w async `plugins: [...]`, uzupełnione exporty stubu (`brandIconSvg, mapResourceIconSvg, unitIconSvg, improvementIconSvg, buildingIconSvg, terrainIconSvg, epochIconSvg, settingIconSvg, menuIconSvg, civIconSvg, brandMenuEmblemSvg, newGameIntroEmblemSvg, svgThumbHtml` + stałe CSS). Wynik: wszystkie trzy przechodzą BUILD, kończą exit=1 na asercjach (armia-produkcja: `FAIL: B10 … armiaProdukcja`; pozostałe dwa — przyczyny NIE ZMIERZONO, nie analizowane w tej rundzie).
  - `tech-unlock-units-test`: stub brakował `brandIconSvg` i `mapResourceIconSvg`. **Naprawa:** dodano exporty. Wynik: exit=0.
  - `budynek-garnizon-test`: **NIE jest błędem harnessu.** `src/ui/cityPanel.ts:12699:34: ERROR: Multiple exports with the same name "renderBuildList"` — realny błąd w `src` (poza allowlistą tematu). Niezmieniony. Do decyzji orkiestratora (osobny temat w `src`).
- Pozostałe ~124 pliki z listy: build bez błędu (wykrycie błędów po logach). Pełne exit-kody tych plików NIE ZESTAWIONO indywidualnie (NIE ZMIERZONO).
- Uwaga o raporcie dispatchu: w zaktualizowanym stanie HEAD tylko 7 z 131 plików miało błąd budowania, nie „8 harnessów” jak w dispatchu.
- Zalecenie (nie zrobione): `import.meta.glob` w `brandAssets.ts`, `leaderPortraits.ts`, `filePlayer.ts` daje tylko ostrzeżenie esbuild; przy uruchomieniu w CJS `import.meta.glob` jest `undefined` → TypeError przy załadowaniu modułu, jeśli to ładowanie nie jest stubowane. Wymaga osobnej decyzji (wspólny stub zamiast łatania po harnessie).

## Kryteria z dispatchu (a–e)
- (a) PASS: standoff (9/0, exit 0), auto-battle-simultaneous (29/0, exit 0).
- (b) CZĘŚCIOWO: 0 błędów budowania w harnessach po naprawie dla 7 znalezionych; lista exit-kodów pełna tylko dla 7 zmienionych + 4 pierwotnie wskazanych. 
- (c) PASS z dowodem dla F8 (regex, nie kod); (3) archer = DECISION_REQUIRED z dowodem (commit 9dc324bb9).
- (d) NIE ZMIERZONO: mutacja helpera `esbuild-raw-plugin.cjs` (helper nie był zmieniany; dodano plugin w 3 harnessach — mutacja nieprzeprowadzona).
- (e) NIE ZMIERZONO: `tsc --noEmit` i 5 bramek referencyjnych nie uruchomiono w tej rundzie. `gra/src` bez zmian (`git diff --stat -- gra/src` puste).

## Środowisko / sprzątanie
- `npm ci` w `gra/` (node_modules, 71 pakietów) — tylko lokalnie, nie w commicie.
- Harnessy tworzą nieśledzone artefakty: `gra/tools/.tax-slider-bundle-legacy.cjs`, `gra/tools/.tax-slider-scale-bundle-legacy.cjs`, `gra/tools/_fort-chain-shots/` — NIE dodawane do commita; do sprzątania przez orkiestratora.
- W worktree widać `M` na plikach PNG/JSON w `dyspozycje/…` (R-DYPLO…, R-KARTA…, R-PR141…) — występują bez mojej edycji; NIE dodawane do commita.
- Brak `rm` w tej rundzie; żadne `run_in_background`.

## UWAGI-DLA-ORKIESTRATORA
1. `src/ui/cityPanel.ts:12699` — zduplikowany eksport `renderBuildList` (blokuje `budynek-garnizon-test`). Realny błąd w src, poza tym tematem.
2. Decyzja (3) — semantyka łucznika (boczny krok vs „wstrzymaj”), commit 9dc324bb9.
3. Stuby `brandAssets` w harnessach są kopiowane ręcznie per plik — kandydat na wspólny stub (osobny temat, `gra/tools` only).
4. Harnessy z fixture `makeTurnFixture` ignorują teraz planer — zmiana semantyki stuba, do przejrzenia przez Evaluatora.

## RUNDY
1/5. Operator Haiku. Nie wymagano eskalacji do Sonneta.

## NASTĘPNY KROK
Evaluator: sprawdzić diff `gra/tools` (9 plików), zweryfikować punkt (3) jako DECISION_REQUIRED, zdecydować o mutacji F8/helpera (NIE ZMIERZONO).

## DEPLOY/PUSH: NIE WYKONANO

## Commit
(uzupełniony po commicie — patrz wiadomość commita; SHA w polu `sha` odpowiedzi operatora)
