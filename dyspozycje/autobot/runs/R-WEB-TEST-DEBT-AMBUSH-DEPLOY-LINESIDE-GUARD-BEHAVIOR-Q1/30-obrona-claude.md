# R-WEB-TEST-DEBT-AMBUSH-DEPLOY-LINESIDE-GUARD-BEHAVIOR-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS (tylko `gra/tools`)
TEMAT: R-WEB-TEST-DEBT-AMBUSH-DEPLOY-LINESIDE-GUARD-BEHAVIOR-Q1
GOAL: test behawioralny na realnej `BattleScene`, ktory wykrywa usuniecie guarda `&& !lineSide` (konnica/rydwany zaskoczonej linii nie trafiaja na skrzydla) w rozstawieniu startowym, zamiast asercji tekstowej. Mutacja Resetu jest zachowaniowo rownowazna (patrz zarzut 1).
BAZA: d02ef14a6394c71b8090b283310f8dbeb97acd2b (kandydat Operatora, baza 370fe8c71 = origin/main).
DISPATCH: `00-dispatch.md` istnieje w gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie w `origin/main`); kryteria (a)–(d) odczytane stamtad (linia 5 dispatchu).

## ZMIANY/COMMIT

- `gra/tools/ambush-deploy-lineside-guard-test.cjs` — zmieniony (zarzuty 2 i 4).
- `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-AMBUSH-DEPLOY-LINESIDE-GUARD-BEHAVIOR-Q1/30-obrona-claude.md` — ten raport.
- `gra/src/**` bez zmian: po kazdej mutacji `battleScene.ts` przywrocony z kopii, `cmp` identyczny (oba razy: RESTORED_IDENTICAL).
- SHA: patrz pole `sha` w StructuredOutput (commit po tym raporcie).

## ODPOWIEDZI NA ZARZUTY

**Zarzut 1 (mutacja Resetu daje ZIELONY) — ODRZUCAM zadanie, by test byl czerwony na mutancie Resetu; PRZYJMUJE fakt.**
Dowod: mutacja tylko Resetu (`18014`: `&& !lineSide` usuniete) daje `exit=0`, `PASS ... (757 checks)`. Zgodnie z raportem rundy 1 zrzuty pozycji setup/Reset z mutantem Resetu sa bajt-w-bajt identyczne z baza (`cmp`). Powod: `rowLo = lineSide ? lineBand[0] : mountedWing ? ...` (Reset), wiec `lineSide` ma pierwszenstwo, a petla kolumn Resetu nie czyta `mountedWing`. Zadna asercja oparta na zachowaniu nie zaczerwieni mutanta, ktory nie zmienia zachowania. Kryterium (b) dispatchu ("kazde osobno") jest wiec **NIESPELNIONE dla Resetu** — to jawny wynik, nie ukryty. Decyzja dla orkiestratora: (A) uznac (b) za spelnione tylko dla setupu, albo (B) osobny temat usuwajacy martwy `&& !lineSide` z `_placeUnitsOneSide` (zmiana `src`, poza zakresem tej rundy). Rekomendacja Operatora: B, jako osobny temat.

**Zarzut 2 (cienki margines 3,50 % vs 3 %) — PRZYJMUJE, poprawione.**
Test progowal N=30 (baza 0/400, mutant 14/400 = 3,50 %). Zmiana: prog lasu liczony tylko dla N=60 (ziarna 1..20, scattered, setup). Zmierzone surowo:
- baza (commit d02ef14a6): `zmierzone: N=60 konnica/rydwany zaskoczonej linii w lesie 13/800 (1.63 %)`
- mutant setup-only (`5430`): `zmierzone: N=60 ... 102/800 (12.75 %)`
Prog 3 % lezy miedzy 1,63 % a 12,75 %. N=12 i N=30 nie sa juz progowane (N=12: 0 na bazie; N=30: mutant 3,50 % to za maly margines). Liczba checks spadla z 759 do 757 (usuniete 2 asercje lasu N=12/30) — to swiadoma zmiana, nie ukryta.

**Zarzut 3 (brak `00-dispatch.md` w origin/main) — ODRZUCAM jako defekt testu; plik istnieje w gałęzi.**
`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-TEST-DEBT-AMBUSH-DEPLOY-LINESIDE-GUARD-BEHAVIOR-Q1/00-dispatch.md` zwraca dispatch (naglowek "R-WEB-TEST-DEBT-AMBUSH-DEPLOY-LINESIDE-GUARD-BEHAVIOR-Q1 — test BEHAWIORALNY guarda..."); linia 5: "KRYTERIA BINARNE: (a) test zielony na bazie; (b) MUTACJA ... (c) tsc ... 5 bramek ... (d) `gra/src` ... bez zmian". Kryteria zostaly sprawdzone binarnie (ponizej). Lista 5 bramek: wykonana (ponizej).

**Zarzut 4 (hard-coded numery linii w komentarzach) — PRZYJMUJE, poprawione.**
Usunieto `~l.5430` i `~l.18014` z naglowka i komentarzy; zastapiono nazwami funkcji (`_placeUnits`, `_placeUnitsOneSide`).

## MUTACJE (kopia `battleScene.orig.ts`, przywracanie `cp`, `cmp` identyczny)

Nowy test (po zmianie):

| Mutant | exit | Surowe wyjscie |
|---|---|---|
| Tylko setup (`5430`) | 1 | `N=60 zaskoczona linia: konnica/rydwany w lesie 102/800 = 12.75 % (prog <= 3 %)` |
| Tylko Reset (`18014`) | 0 | `PASS: ... (757 checks)` |
| Oba miejsca | 1 | `N=60 zaskoczona linia: konnica/rydwany w lesie 102/800 = 12.75 % (prog <= 3 %)` |

Po przywroceniu: `cmp` identyczny z baza, `RESTORED_IDENTICAL`.

## TESTY (surowe wyjscia, worktree na d02ef14a6 + zmiana testu)

- `npx tsc --noEmit` (gra/): exit=0.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit=0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit=0.
- `node tools/research-test.cjs`: `ALL GREEN`, exit=0.
- `node tools/unit-replace-test.cjs`: `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`, exit=0.
- `node tools/combat-test.cjs`: `All sanity checks passed.`, exit=0.
- `node tools/ambush-deploy-geometry-test.cjs`: `WYNIK: 20 OK / 0 FAIL`, exit=0.
- `node tools/ambush-deploy-scene-test.cjs`: `WYNIK: 26 OK / 0 FAIL`, exit=0.
- `node tools/ambush-deploy-line-width-test.cjs`: `PASS: ... (240 checks)`, exit=0.
- `node tools/battle-formation-rules-test.cjs`: `PASS: front ranks, mounted wings, Attack line pacing, and same-activation ranged fire`, exit=0.
- `node tools/ambush-deploy-lineside-guard-test.cjs` (nowy, zmieniony, baza z poprawka): `PASS: ... (757 checks)`, exit=0.
- Nie uruchamiano: `npm run build/dev` (zakaz); weryfikacja w przegladarce (zmiana tylko w tescie, bez UI).

## BLOKADY

- Brak blokad technicznych.
- Kryterium (b) dla Resetu: niespelnione z przyczyn zachowaniowych (zarzut 1). Wymaga decyzji orkiestratora.

## SRODOWISKO / SPRZATANIE (dla orkiestratora)

- `gra/node_modules` zainstalowane w worktree (`npm ci --ignore-scripts`), gitignored, nie w commicie — do sprzatania.
- Worktree przepiety na commit d02ef14a6 w trybie detached (`git checkout --detach`).
- Pliki pomocnicze poza repo: `/tmp/x` (kopia battleScene, utworzona omylkowo; dispatch zakazuje `rm`, sprzatanie przez orkiestratora), kopie w scratchpad (`battleScene.orig.ts`, `probe.cjs`, logi `g-*.log`, `mut-*.log`).

## RUNDY

2/5 (runda obrony po pierwszej ocenie Evaluatora). Ostatni werdykt Evaluatora: PASS-WITH-NOTES.

## NASTEPNY KROK

Evaluator/Final Control: sprawdzic poprawiony test (mutacje: setup i oba czerwone, Reset zielony — jawnie nieskuteczny, zarzut 1). Decyzja orkiestratora: (A) albo (B) dla kryterium (b) Resetu.

## ZMIERZONO / NIE ZMIERZONO

- ZMIERZONO: tsc, 5 bramek referencyjnych, 4 harnessy pokrewne, nowy test po poprawce, 3 mutanty z surowymi wyjsciami, pomiar N=60 bazy i mutanta setup.
- NIE ZMIERZONO: gra w przegladarce; wynik lasu dla N=60 na ziarnach poza 1..20.

DEPLOY/PUSH: NIE WYKONANO
