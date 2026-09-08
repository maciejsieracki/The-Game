STATUS: FAIL
DOMAIN: GAME
TEMAT: P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1
GOAL: Napraw jednostki (w tym łuczników) stojące bezczynnie w trybie AUTO mimo dyspozycji
ataku, bez naruszania zamierzonego "brak amunicji → cofnięcie" ani równoległej naprawy
obrońców-muru (P-BITWA-OBRONCY-PRZED-MUREM-Q1), w stanie faktycznie scalonym z aktualnym
`origin/main` (fa161a79).

WERDYKTY:
1 → ODDAL. Weryfikacja własna na scalonym stanie potwierdza: obie zmiany zajmują różne,
zagnieżdżone warunki tej samej funkcji, mechaniczne złożenie daje spójny kod, a
`bitwa-obroncy-mur-kolumny-test.cjs` pozostaje 9/9 zielony na scalonym bloku. Ryzyko
integracyjne zgłoszone przez obronę jest teraz zamknięte przez samo zadanie Final Control
(weryfikacja stanu scalonego).
2 → NAPRAW. `bitwa-auto-doktryna-playerorder-zrodlo-test.cjs`, jak dostarczony, nie pozostaje
zielony na scalonym stanie: 5 pass, 1 fail (w tymczasowym worktree Final Control, plik po
połączeniu obu fixów). Przyczyna: test lokalizuje blok przez
`src.indexOf('if (!this._manualMode) {', activateUnitDefIdx)` — literalny string. Fix
obrońców-muru zmienia ten warunek na `if (!this._manualMode && !siegeDefenderNeverDoctrine) {`,
więc literalny string już tam nie występuje; `indexOf` przeskakuje do INNEGO, niepowiązanego
wystąpienia tego samego stringu w pliku (linia ~16015, inna funkcja), a test sprawdza złe okno
500 znaków → fałszywy `[FAIL] okno po bramce AUTO zawiera '_isUnitDoctrineAuto(ru)'`.
Zmutowano TYLKO wewnętrzny fix łuczników (zostawiając warunek muru) i potwierdzono: to samo
`[FAIL]` występuje identycznie w obu wariantach (z fixem i bez) — asercja #4 jest ślepa w
stanie scalonym, nie odróżnia PRZED/PO. To defekt anchoringu testu, nie kodu silnika.
3 → ODDAL. Niezależnie uruchomiono wszystkich 12 wskazanych testów + `army-concentration-
test.cjs` na tym samym scalonym stanie — identyczne liczby jak zadeklarowane, zero regresji.
4 → ODDAL. Mechanizm bramki (`_isUnitDoctrineAuto`/`playerOrder.type`) nie zawiera żadnego
rozgałęzienia po typie jednostki (`isRanged`/`canShoot`) — potwierdzone bezpośrednim
czytaniem kodu scalonego. Korekta redakcyjna w raporcie Obrony jest transparentna i
wystarczająca; brak żywej próbki łucznika nie podważa dowodu przyczynowego przy dowiedzionej
klaso-agnostyczności.

DOWÓD WŁASNEJ WERYFIKACJI (własny tymczasowy worktree `/tmp/wt-fc-verify` z
`origin/main@fa161a79`, ręcznie połączony blok `_activateUnit`, usunięty po zakończeniu):
- `node ./node_modules/typescript/bin/tsc --noEmit` → 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6.
- `army-concentration-test.cjs` → 55/55, brak nakładania z battleScene.ts.
- `bitwa-obroncy-mur-kolumny-test.cjs` → 9/9 (BASE: 0/28 obrońców poniżej muru po 1 turze
  AUTO; MUT/MUT2 odtwarzają defekt gdy warunek muru cofnięty — dowód nietautologiczności
  zachowany na stanie scalonym).
- `bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` → 5 pass, 1 fail (patrz Zarzut 2).
  Mutacja (cofnięcie WYŁĄCZNIE wewnętrznego resetu playerOrder, warunek muru bez zmian) →
  4 pass, 2 fail — asercja #1 (stara bramka) poprawnie czerwienieje, potwierdzając że
  mechanizm naprawy jest wykrywalny; asercja #4 pozostaje FAIL identycznie w obu stanach
  (ślepa, nie defekt kodu).
- 12 dodatkowych testów: auto-battle-power-test 14/14, auto-battle-przewaga-monotonicznosc-
  test 43/43, auto-battle-py-vs-ts-parytet-test 150/150, battle-hp-display-test 7/7,
  battle-roster-test 7/7, battle-summary-test OK, army-hunger-combat-test 13/13,
  post-battle-map-test 32/32, pre-battle-defender-retreat-test OK,
  pre-battle-retreat-exhausted-test 33/33, barbarzyncy-podwojny-atak-prebattle-test 18/18,
  heal-stale-blockers-pending-battle-test 23/23 — wszystkie zielone.

TEKST COMBINED BLOKU DO ZASTOSOWANIA (potwierdzony identyczny ze szkicem w dispatchu, bez
niespodzianek w otoczeniu):
```
    const siegeDefenderNeverDoctrine = ru.side === 'def' && this.siegeWallCol >= 0;
    if (!this._manualMode && !siegeDefenderNeverDoctrine) {
      if (this._isUnitDoctrineAuto(ru)) {
        if (ru.playerOrder.type !== 'none') ru.playerOrder = { type: 'none' };
        const meta = this._effectiveMetaForUnit(ru);
        if (meta.doctrine !== 'manual') {
          if (this._executeGroupDoctrineStep(ru, meta, done)) return;
        }
      }
    }
```

ZMIANY/COMMIT: Brak zmian trwałych — wyłącznie tymczasowy worktree `/tmp/wt-fc-verify`
(usunięty). Nie zmieniono `/home/user/wt-bitwa-lucznicy-auto` ani `/home/user/The-Game`.
TESTY: patrz DOWÓD wyżej.
BLOKADY: Zarzut 2 (NAPRAW) — anchoring testu źródłowego nie przetrwał scalenia z równoległym
fixem tej samej funkcji; wymaga poprawki regexu w rundzie 2, sam fix runtime w
`battleScene.ts` pozostaje niezmieniony i potwierdzony poprawny.
RUNDY: 1/5
NASTĘPNY KROK: Operator, runda 2, TYLKO `gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-
test.cjs` — zamienić `indexOf('if (!this._manualMode) {', …)` na dopasowanie tolerujące
dodatkowe warunki w tym samym `if`, tak by test poprawnie lokalizował blok także po scaleniu
z P-BITWA-OBRONCY-PRZED-MUREM-Q1. Po poprawce: ponowna weryfikacja 6/6 na stanie scalonym →
Evaluator → Final Control.
DEPLOY/PUSH: NIE WYKONANO
