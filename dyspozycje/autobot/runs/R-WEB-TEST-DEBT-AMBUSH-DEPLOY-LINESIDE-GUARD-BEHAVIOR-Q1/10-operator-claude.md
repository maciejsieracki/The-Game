# R-WEB-TEST-DEBT-AMBUSH-DEPLOY-LINESIDE-GUARD-BEHAVIOR-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS (tylko `gra/tools`)
TEMAT: R-WEB-TEST-DEBT-AMBUSH-DEPLOY-LINESIDE-GUARD-BEHAVIOR-Q1
GOAL: test behawioralny na realnej `BattleScene`, ktory wykrywa usuniecie guarda `&& !lineSide` (konnica/rydwany zaskoczonej linii nie trafiaja na skrzydla), zamiast asercji tekstowej.
BAZA: origin/main = 370fe8c7128825dc4d4d95cc9a2082cbcd73587b (worktree wf_fcadb915-ba2-1, checkout --detach).
DISPATCH: 00-dispatch.md odczytany z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (w `origin/main` go nie ma); DODATEK-claude odczytany z tej samej gałęzi.

## ZMIANY/COMMIT

- Nowy plik: `gra/tools/ambush-deploy-lineside-guard-test.cjs` (allowlista: tylko ten plik + raport).
- `gra/src/**` bez zmian: `git diff --stat origin/main -- gra/src` pusty; po kazdej mutacji plik przywrocony z kopii i porownany `cmp` (identyczny).
- Commit: patrz sekcja SHA na koncu raportu.

## Co testuje nowy test

Produkcyjne `BattleScene.prototype._placeUnits` (rozstawienie) i `_placeUnitsOneSide` (Reset), N = 5/12/30/60, teren plains i scattered:

1. Zaskoczona strona (A: AI def, B: gracz atk, C: gracz def), 3 ziarna terenu: wszystkie jednostki rozstawione, wiersze w pasmie linii `_ambushLineRowBand()`, max 3 jednostki w szeregu, konnica/rydwany obecne w linii, brak nakladania pozycji. Dla setupu i Resetu.
2. Konnica zaskoczonej linii w lesie (setup, teren scattered, ziarna 1..20, N=12/30/60): udzial `<= 3 %`. Ten prog jest galezia, ktora guard steruje: bez guarda `mountedWing=true`, konnica dostaje tylko kolumny do przodu i mala premie terenu (+6 zamiast +40 na rowninie), wiec wchodzi w las.
3. Strona NIE zaskoczona (zwykla bitwa, obie strony, N=12/30/60): cala konnica poza pasmem piechoty (skrzydla), guard nie dotyka tej galezi.

Wynik na bazie (surowy): `zmierzone: N=12 ... 0/160 (0.00 %)`, `N=30 ... 0/400 (0.00 %)`, `N=60 ... 13/800 (1.63 %)`, `PASS: zaskoczona linia trzyma konnice/rydwany w linii (setup+Reset, N=5/12/30/60, las 3 %), normalna bitwa ma konnice na skrzydlach (759 checks)`.

## MUTACJE (kopia pliku, przywracanie cp, cmp identyczny)

Zmiana: `const mountedWing = initialBattleRoleOf(bu) === 'mounted' && !lineSide;` -> bez `&& !lineSide`.

| Mutant | Wynik testu | Surowe wyjscie |
|---|---|---|
| Tylko setup (~l.5430) | CZERWONY, exit=1 | `N=30 zaskoczona linia: konnica/rydwany w lesie 14/400 = 3.50 % (prog <= 3 %)` |
| Tylko Reset (~l.18014) | ZIELONY, exit=0 | `PASS: ... (759 checks)` |
| Oba miejsca | CZERWONY, exit=1 | `N=30 zaskoczona linia: konnica/rydwany w lesie 14/400 = 3.50 % (prog <= 3 %)` |

Dla mutanta setup-only dodatkowo zmierzono (ziarna 1..40, scattered, probe poza repo): las wśród konnicy linii `N=12: 0/320`, `N=30: 32/800 (4,0 %)`, `N=60: 204/1600 (12,8 %)`, baza `N=60: 29/1600 (1,8 %)`. Prog 3 % lezy miedzy baza (<= 1,8 %) a mutantem (>= 3,5 %).

## NOTA: mutacja tylko w Resecie jest zachowaniowo rownowazna (kryterium (b) nie do spelnienia)

Dispatch wymaga, by mutacja tylko w jednym miejscu (setup LUB reset) zaczerwieniala test. Dla Resetu jest to niemozliwe bez zmiany zachowania:
- Reset (`_placeUnitsOneSide`, ~l.18023/18026): `rowLo = lineSide ? lineBand[0] : mountedWing ? ...` - `lineSide` ma pierwszenstwo, wiec `mountedWing` nie ma wplywu na wiersze zaskoczonej strony.
- Reset nie ma petli kolumn z `mountedWing` (ta jest tylko w setupie, ~l.5477); petla fallbacku kolumn w Resecie jest taka sama dla wszystkich jednostek.
- Dowod empiryczny: zrzut pozycji (setup i Reset, N=5/12/30/60, plains+scattered, ziarna 1..20, 320 linii) z mutantem Resetu jest bajt-w-bajt identyczny z baza (`cmp` = identyczne).
- Wniosek: guard w Resecie jest martwy dla zaskoczonej strony. Test go pokrywa (Reset-check w sekcji 1), ale mutacja Resetu nie daje czerwieni, bo nie zmienia zachowania. Do decyzji orkiestratora: albo uznac kryterium (b) za spelnione tylko dla setupu, albo usunac martwy `&& !lineSide` z Resetu w osobnym temacie (wymaga zmiany `src`, poza zakresem tej rundy).

## TESTY (bramki, surowe wyjscia)

- `npx tsc --noEmit` (gra/): exit=0, bez bledow.
- `node tools/ambush-deploy-geometry-test.cjs`: `WYNIK: 20 OK / 0 FAIL`.
- `node tools/ambush-deploy-scene-test.cjs`: `WYNIK: 26 OK / 0 FAIL`.
- `node tools/ambush-deploy-line-width-test.cjs`: `PASS: zaskoczeni w dlugiej linii (max 3 w szeregu, konnica w linii) dla N=5/12/30/60 (240 checks)`.
- `node tools/battle-formation-rules-test.cjs`: `PASS: front ranks, mounted wings, Attack line pacing, and same-activation ranged fire`.
- `node tools/ambush-deploy-lineside-guard-test.cjs` (nowy, baza): PASS, 759 checks.
- Nie uruchamiano: `npm run build/dev` (zakaz), 5 bramek referencyjnych z R-PROC-AUTOBOT poza powyzszymi (nie zidentyfikowano ich listy w dispatchu; uruchomiono powyzsze zestawy ambush/formation).

## BLOKADY

- Brak blokad technicznych.
- Kryterium (b) dla Resetu: rownowazny mutant (patrz wyzej). Wymaga decyzji orkiestratora.
- `gra/node_modules` zainstalowane lokalnie w worktree (`npm ci --ignore-scripts`), nie w repo (gitignore); do sprzatania przez orkiestratora.

## RUNDY

1/5 (runda 1). Ostatni werdykt: brak (Operator).

## NASTEPNY KROK

Evaluator (SONNET) + Final Control: sprawdzic nowy test (plik `gra/tools/ambush-deploy-lineside-guard-test.cjs`), mutacje setup/oba (czerwone), decyzje o mutancie Resetu (rownowazny).

## ZMIERZONO / NIE ZMIERZONO

- ZMIERZONO: tsc, cztery harnessy referencyjne, nowy test na bazie, trzy mutanty (setup, reset, oba) z surowymi wyjsciami, pomiar udzialu lasu dla setupu, zrzuty pozycji setup/reset z mutantem Resetu (identyczne).
- NIE ZMIERZONO: gra w przegladarce (test harness, brak zmian w UI); pelne 5 bramek z R-PROC-AUTOBOT (nie podano listy).

DEPLOY/PUSH: NIE WYKONANO
