# R-WEB-ARMY-SPLIT-BESIEGING-ARMY-NO-SIEGE-LOCK-Q2 — raport Obrony Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-SPLIT-BESIEGING-ARMY-NO-SIEGE-LOCK-Q2
GOAL: wydzielone przez „Rozdziel” jednostki armii oblegającej nie są w oblężeniu i mają normalny ruch (także gdy oblegający był ufortyfikowany w polu); reszta nadal oblega.
BAZA: b160459c9dea67e082ec59dc7770d10cc59c08d4 (origin/main). KANDYDAT Operatora: e7412749de6ef5ed7f70bfdf5da69f6d7db69474. Poprawka: patrz SHA końcowy w polu `sha` wyniku.

## ODPOWIEDZI NA ZARZUTY EVALUATORA (c74915bb1)

- **Zarzut 1 (fortyfikacja w polu zostawia ruch 0): PRZYJMUJĘ.** Dowód z kodu: `enterFieldFortify` (armyMerge.ts ~l.282) zapisuje `fortifyRuchSnapshot = ruchLeft` (=0 po commitBesiege) i ustawia `ufortyfikowanyWPolu = true`. Stara wersja `releaseSplitFromSiege` nie zdejmowała fortyfikacji. Późniejsze `exitFieldFortify` (np. `normalizeMergedFortify`, armyMerge.ts ~l.426–433) przywraca `ruchLeft` = 0. Poprawka: `releaseSplitFromSiege` najpierw woła `exitFieldFortify(u)` (zdejmuje fortyfikację i przywraca snapshot), dopiero potem `u.ruchLeft = u.ruch`. Test: sekcja A6 w `gra/tools/army-split-besieging-no-siege-lock-test.cjs`.
- **Zarzut 2 (brak testu zachowania onSplit; część B tekstowa): PRZYJMUJĘ CZĘŚCIOWO.** Dodano test A6 na realnych funkcjach (`enterFieldFortify` → `releaseSplitFromSiege` → `normalizeMergedFortify`). Część B (tekst `main.ts`, `indexOf`, bez regexów) pozostaje jako test strukturalny. Domknięcia `onSplit` w `boot()` nie da się wywołać z testu jednostkowego bez refaktoru; ten refaktor wykracza poza allowlistę i zakres rundy. Zachowanie onSplit w żywej grze: NIE ZMIERZONO (patrz zarzut 4).
- **Zarzut 3 (A1 nie jest prawdziwym „czerwonym przed”; brak ≥2 podziałów): PRZYJMUJĘ CZĘŚCIOWO.** Test ładuje teraz realny `armyMerge.ts` przez namespace-import, więc działa także na bazie (`ARMY_MERGE_SRC=<armyMerge.ts z b160459c9>`; brak `releaseSplitFromSiege` daje asercje czerwone zamiast wyjątku). ZMIERZONO: baza = PASS 9 / FAIL 12; kandydat z poprawką = PASS 21 / FAIL 0; mutant bez linii `exitFieldFortify` = PASS 19 / FAIL 2 (dokładnie A6). Dwa kształty podziału: para jednostek (a,b) i pojedyncza jednostka (c). **ODRZUCAM** wymóg podziału „na inny heks / ten sam heks”: `releaseSplitFromSiege(arrivals)` nie czyta współrzędnych (q,r); zmienia tylko pola jednostek, więc pozycja heksu nie wpływa na wynik. Ta ścieżka nie daje innego zachowania.
- **Zarzut 4 (d, e nie zrealizowane): NIE ZMIERZONO (e) i CZĘŚCIOWO (d).**
  - (d) Commit regresu: bounded `git log -S` nie wykazał commita, który usuwał czyszczenie `oblegaCityId` w onSplit (`-S"oblegaCityId = undefined" -- gra/src/main.ts`: brak trafień). Zawężony zakres (`47d53fae0~1..b160459c9`, `-S"oblegaCityId"`) daje kandydatów: 47d53fae0, 218d7d5cf (grupowanie oblegających po `oblegaCityId`), 6218f2ab1 („build siege engines during sieges”, dotyka znaczników `oblegaCityId`), c459676af. Żaden z nich nie usuwa obsługi w onSplit, bo w bazie onSplit nigdy nie czyścił `oblegaCityId`. Hipoteza „brak czyszczenia od początku, ujawnione przez grupowanie po `oblegaCityId`” NIE jest zweryfikowana bisectem. NIE ZMIERZONO: dokładny commit.
  - (e) Żywy bieg w Chromium (oblężenie → rozdzielenie → ruch): NIE ZMIERZONO w tej rundzie. Powód: wymaga zbudowania vite poza repo i scenariusza UI; rundę ograniczono do poprawki, testu i bramek.
- **Zarzut 5 (ruchLeft = ruch daje pełną pulę w turze oblężenia): ODRZUCAM jako błąd.** Dispatch wprost wymaga „mają normalny ruch (`ruchLeft` = pula ruchu jednostki; nie zerowa blokada)”. Zmiana reguły „ruch po częściowym ruchu w tej turze” jest decyzją produktową, nie poprawką. Zostawiam jako uwagę dla Final Control.
- **Zarzut 6 (warunek zniesienia oblężenia w onSplit bez innych właścicieli; brak testu gałęzi endMapSiege): ODRZUCAM jako defekt.** Warunek `!units.some(x => x.oblegaCityId === splitFromSiegeCityId)` jest zgodny z regułą „brak wojsk przy murze” z dispatchu. Gałąź `endMapSiege` pozostaje bez testu wykonującego kod (jak w zarzucie 2).
- **Uwaga do zarzutu „panel-scroll 2 FAIL”: ZMIERZONO.** Kandydat: 16 PASS / 2 FAIL (te same dwa RED-PRE co w zarzutach). Diff kandydata względem bazy nie dotyka `gra/src/ui` (0 plików), więc te dwa FAIL nie wynikają z tej zmiany. Ten sam wynik odnotował Evaluator na bazie.

## ZMIANY-COMMIT

- `gra/src/game/armyMerge.ts`: `releaseSplitFromSiege` wywołuje `exitFieldFortify(u)` przed `u.ruchLeft = u.ruch` (4 linie: komentarz + wywołanie).
- `gra/tools/army-split-besieging-no-siege-lock-test.cjs`: namespace-import (działa na bazie), helper `rel()` (brak funkcji = asercje czerwone), nowa sekcja A6 (fortyfikacja w polu), A1–A5 bez zmian merytorycznych.
- `dyspozycje/autobot/runs/R-WEB-ARMY-SPLIT-BESIEGING-ARMY-NO-SIEGE-LOCK-Q2/30-obrona-claude.md` (ten raport).
- Allowlista zachowana. Nie dotknięto `gra/src/main.ts`, `gra/src/ui/`, WERSJE.md, manifestu, gra-robocza/, rust-port/. Brak `git add -A`.

## TESTY (liczby z surowego wyjścia, uruchomione w worktree na poprawionym kodzie)

- `npm ci` w `gra/` (bez build/dev): zainstalowano 71 pakietów.
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/army-split-besieging-no-siege-lock-test.cjs`: **PASS 21 / FAIL 0**, exit 0.
- Ten sam test na bazie (`ARMY_MERGE_SRC` = armyMerge.ts z b160459c9): **PASS 9 / FAIL 12** (czerwono przed poprawką).
- Mutant (linia `exitFieldFortify(u);` usunięta z kopii armyMerge.ts): **PASS 19 / FAIL 2** (dwie asercje A6 czerwone). Kopie testowe usunięte po teście.
- Bramki referencyjne (exit 0 każda): logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0`, `ALL GREEN`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`.
- Inne (exit 0): load-game-regression-test `34 PASS / 0 FAIL`; siege-nearby-lock-join-test `23 OK, 0 FAIL`; battle-siege-nearby-units-join-test `PASS=14 FAIL=0`; army-split-movement-test `4 pass, 0 fail`; army-split-enemy-city-block-test `14 PASS, 0 FAIL`; army-split-ruch-icons-test `7 pass, 0 fail`; army-merge-bounce-test `4/0`; army-merge-colocated-test `4/0`; army-merge-separate-return-test `16/0`; army-merge-dismiss-bounce-test `16/0`.
- army-split-panel-scroll-grid-test: exit 1, `16 PASS / 2 FAIL` (dług bazowy, patrz wyżej).
- `git diff --check`: OK (exit 0).
- NIE ZMIERZONO: testy przeglądarkowe (Chromium/dist: siege-map-panel-bottom-clip, siege-panel-machines-block-fit, graphical-hex-picker, hex-honeycomb, army-merge-panel-*), pełny zestaw `siege-*` poza wymienionymi.

## BLOKADY

- (e) żywy bieg w Chromium: NIE ZMIERZONO (patrz zarzut 4).
- (d) dokładny commit regresu: NIE ZMIERZONO (hipoteza, nie pomiar).
- Domknięcie onSplit w `boot()` nie jest testowane wykonaniem kodu (część B tekstowa).

## RUNDY

Runda 1 (Obrona, Haiku 5.5). Brak FAIL związanych z tym tematem poza zarzutami Evaluatora, które odpowiedziano powyżej.

## UWAGI-DLA-ORKIESTRATORA

- Regres do potwierdzenia przez Final Control: poprawka dotyczy fortyfikacji oblegających; bez niej dokładnie to zgłoszenie właściciela („ruch wraca do 0”) nadal występuje dla ufortyfikowanego oblegającego.
- Test regresyjny do stałej listy deployu: `gra/tools/army-split-besieging-no-siege-lock-test.cjs` (PASS 21/0).
- Zarzut 5 (pełna pula ruchu w turze oblężenia) i ewentualne uzupełnienie (e) w Chromium to decyzje FC / kolejnej rundy.
- Przy sprzątaniu: usunąć `gra/node_modules` tego worktree po FC (zainstalowane na potrzeby testów).

NASTĘPNY KROK: Evaluator (runda 2) ocenia kandydat z poprawką względem tego raportu; FC po PASS.
DEPLOY/PUSH: NIE WYKONANO
