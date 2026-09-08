STATUS: PASS
DOMAIN: GAME
TEMAT: P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1
GOAL RUNDY 2: Napraw WYLACZNIE anchoring bramki zrodlowej
`gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs`, tak zeby poprawnie
lokalizowala blok `_activateUnit` takze na stanie scalonym z
P-BITWA-OBRONCY-PRZED-MUREM-Q1 (`6094c585`, juz w `main`). Zero zmian w
`battleScene.ts` (fix silnika z rundy 1 juz potwierdzony przez Final Control).

PRZYCZYNA (cytat z Final Control, `08-final-control-runda1.md`, zarzut 2):
test lokalizowal blok przez `src.indexOf('if (!this._manualMode) {', ...)` --
literalny string. Fix obroncow-muru zmienia ten warunek na
`if (!this._manualMode && !siegeDefenderNeverDoctrine) {`, wiec literalny
string juz nie wystepuje w tym miejscu; `indexOf` przeskakiwal do INNEGO
wystapienia tego samego stringu dalej w pliku (inna funkcja, linia ok. 16015),
a asercja "okno zawiera reset ksiegowosci" fałszywie czerwieniala identycznie
w obu wariantach (z fixem lucznikow i bez) -- test byl slepy na stanie
scalonym.

NAPRAWA: `gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` --
zamieniono `src.indexOf('if (!this._manualMode) {', activateUnitDefIdx)` na
`manualGateRegex = /if\s*\(\s*!this\._manualMode\b[^)]*\)\s*\{/` szukany od
`activateUnitDefIdx` (`regex.exec(src.slice(activateUnitDefIdx))` +
przeliczenie offsetu). Regex toleruje DOWOLNY dodatkowy warunek w tym samym
`if (...)` po `!this._manualMode` (np. `&& !siegeDefenderNeverDoctrine`),
wiec trafia we wlasciwy blok niezaleznie od tego czy warunek muru jest
obecny. Reszta testu (asercje 1, 3, 4, 5 wzgledem okna 500 znakow od
`manualGateIdx`) niezmieniona -- naprawiono wylacznie lokalizacje bramki.

WERYFIKACJA NA WLASNYM TYMCZASOWYM SCALENIU (jak wymagał dispatch, nie na
starej bazie galezi):
- `git worktree add --detach /tmp/wt-fc-verify2 origin/main` (`f82aa354`,
  zawiera juz `6094c585` obroncy-mur). Potwierdzono `grep` -- linia
  `if (!this._manualMode && !siegeDefenderNeverDoctrine) {` obecna, stara
  buggy bramka lucznikow (`ru.playerOrder.type === 'none'`) tam jeszcze jest
  (fix lucznikow nie zintegrowany).
- Recznie zaaplikowano fix lucznikow z tej galezi (identyczny z
  "TEKST COMBINED BLOKU" w `08-final-control-runda1.md`) + skopiowano NOWY
  test.
- `node tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` -> **6 pass,
  0 fail** (wczesniej: 5 pass, 1 fail).
- MUTACJA (dowod nietautologicznosci): cofnieto WYLACZNIE wewnetrzny reset
  `playerOrder` lucznikow (`if (...) { if (ru.playerOrder.type !== 'none')
  ru.playerOrder = {type:'none'}; ... }` -> stara bramka
  `if (this._isUnitDoctrineAuto(ru) && ru.playerOrder.type === 'none') {`),
  zostawiajac warunek muru NIETKNIETY -> **3 pass, 3 fail**, a
  konkretnie asercje #1 ("stara bramka NIE wystepuje"), #5 ("okno zawiera
  reset") i #6 ("reset nie jest warunkowany przez stary check") czerwienieja
  -- realnie zwiazane z fixem lucznikow, nie przypadkowo inna asercja. Drzewo
  przywrocone z backupu natychmiast po teście.
- `node ./node_modules/typescript/bin/tsc --noEmit` -> 0 bledow.
- 5 bramek referencyjnych na scalonym stanie: `logic-test` 213/213,
  `combat-test` 6/6, `map-field-battle-test` 22/22, `tech-tree-test` 19/19,
  `research-test` 33/33 -- wszystkie zielone.
- `bitwa-obroncy-mur-kolumny-test.cjs` -> 9/9 (BASE + MUT2 dowod
  nietautologicznosci obroncow-muru zachowany, zero regresji drugiego
  tematu).
- Tymczasowy worktree `/tmp/wt-fc-verify2` i symlink `gra/node_modules`
  usuniete po weryfikacji (`git worktree remove --force`).

TESTY NA WLASCIWYM WORKTREE (`/home/user/wt-bitwa-lucznicy-auto`, baza
`origin/main@5f0fa0e8`, BEZ scalenia obroncy-mur -- test dziala poprawnie
takze tutaj, bo regex jest superzbiorem literalnego dopasowania):
- `node tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` -> 6/6 PASS.
- `tsc --noEmit` -> 0 bledow.
- 5 bramek referencyjnych: `logic-test` 213/213, `combat-test` 6/6,
  `map-field-battle-test` 22/22, `tech-tree-test` 19/19, `research-test`
  33/33 -- zielone.
- `git diff --stat` / `git status --porcelain`: WYLACZNIE
  `gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` zmieniony;
  `gra/src/battle/battleScene.ts` nietkniety w tej rundzie (zgodnie z zakazem
  dispatchu).

ZMIANY/COMMIT: `gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs`
(17 wstawien / 4 usuniecia, jedna funkcja lokalizujaca bramke) + ten raport.
Commit `3571b302` na galezi `autobot/P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1`.
Brak zmian w `battleScene.ts`.

BLOKADY: brak nowych. Nadal aktualne z rundy 1 (potwierdzone przez Final
Control jako ODDALONE/zamkniete): integracja z P-BITWA-OBRONCY-PRZED-MUREM-Q1
juz wykonana w `main` (`6094c585`) -- ten temat wciaz czeka na WLASNA
integracje fixu silnika z rundy 1 (`battleScene.ts`, `_activateUnit`) do
`main`; ta runda naprawia wylacznie test, integracja fixu silnika pozostaje
zadaniem orkiestratora po PASS tej rundy.

RUNDY: 2/5
NASTEPNY KROK: Operator -> Evaluator -> (Obrona jesli zarzuty) -> Final
Control. Po PASS: orkiestrator integruje RECZNIE fix silnika z rundy 1
(`_activateUnit`, tekst combined bloku juz potwierdzony w
`08-final-control-runda1.md`) razem z tym nowym testem do `main`.
DEPLOY/PUSH: NIE WYKONANO
