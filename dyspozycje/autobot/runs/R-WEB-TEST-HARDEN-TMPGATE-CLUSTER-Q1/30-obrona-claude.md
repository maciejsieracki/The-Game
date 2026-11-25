# R-WEB-TEST-HARDEN-TMPGATE-CLUSTER-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA (testy)
TEMAT: R-WEB-TEST-HARDEN-TMPGATE-CLUSTER-Q1
GOAL: odpowiedzieć na zarzuty Evaluatora (de2ee6918) do bramki tmpdir na kandydacie 677616b9e; zamknąć luki, które są realne.
ZMIANY-COMMIT:
- 7dc7ce515 — gra/tools/bramki-tmpdir-unikalnosc-test.cjs (jedyny zmieniony plik): R7 obejmuje separator `${path.sep}`; asercje R7 w samoteście wymagają trafienia reguły R7 (helper `rulesFixture`); nowy fixture `${T}${path.sep}civ-stala`.
- Ten raport — osobny commit (tylko ta ścieżka).
- Zero zmian w gra/src, gra/data, cluster-plan-name-test.cjs (bez zmian od 677616b9e).
- Baza kodu: 677616b9e (gałąź odtworzona w worktree przez `git checkout --detach`).

## Odpowiedzi na zarzuty

### Zarzut 1 (nota, niski priorytet): szablon `${T}${path.sep}civ-x` — PRZYJMUJĘ, naprawione
- Dowód Evaluatora potwierdzony: fixture `const p = \`${T}${path.sep}civ-x\`; fs.writeFileSync(p,'x');` na kandydacie daje 0 trafień (gate: `PASS=16 FAIL=1`, jedyny FAIL to zarzut 2).
- Poprawka: wzorzec `tpl` w R7 akceptuje `(?=/|\$\{\s*path\.sep\s*\})`, a walidacja segmentu akceptuje `${path.sep}` przed stałą nazwą.
- Po poprawce ten sam fixture daje: `[R7] fx-sep.cjs:3  ${path.sep}civ-x`.
- Nowa asercja samotestu: `samotest R7: szablon \`${T}${path.sep}stała\` w osobnej instrukcji = FAIL (reguła R7)`.

### Zarzut 2 (nota): trafienie R2 na `path.join(T,'civ-x-'+process.pid)` + `mkdirSync` — ODRZUCAM z dowodem (pre-existing, poza zakresem tego tematu)
- Dowód: ten sam fixture (`const T = require('os').tmpdir(); fs.mkdirSync(path.join(T, 'civ-x-' + process.pid), { recursive: true });`) uruchomiony na bazie a80b9bbfa (gate z `git show a80b9bbfa:gra/tools/bramki-tmpdir-unikalnosc-test.cjs`) daje `[R2] fx-pid.cjs:2 (korzen os.tmpdir())`, `PASS=9 FAIL=1`.
- Na kandydacie i po mojej poprawce wynik jest identyczny: `[R2] fx-pid.cjs:2`, `PASS=17 FAIL=1` (fixture jest w katalogu scratch, nie w repo).
- Zgłoszenie jest realnym fałszywym alarmem R2: nagłówek bramki wymienia `process.pid` jako wzorzec BEZPIECZNY, a R2 (`isReadOnlyRoot`) nie zwalnia zapisu, gdy znacznik unikalności stoi w argumencie ścieżki. Nie jest to regresja kandydata i nie wpływa na drzewo repo (realne drzewo: PASS). Zmiana R2 to osobny temat (zmniejszenie fałszywych alarmów), więc nie wprowadzam jej tutaj. Do rozstrzygnięcia przez orkiestratora — patrz UWAGI-DLA-ORKIESTRATORA.

### Zarzut 3 (nota): asercje R7 zielone bez R7 — PRZYJMUJĘ, naprawione
- Dowód Evaluatora potwierdzony w dyspozycji: pod wyłączonym R7 asercje `tpl` / `concat` / `array join var` / `array join inline` były czerwone, ale `posix join var` zostawała zielona, bo łapała ją R2.
- Poprawka: helper `rulesFixture` zwraca listę reguł trafionych przez fixture; asercje R7 (wszystkie pięć + nowa `${path.sep}`) wymagają `includes('R7')`. Nie osłabiam żadnej asercji — tylko wzmacniam.
- Mutacja na kopii poza repo (`gra/tools/bramki-tmpdir-unikalnosc-test.cjs` skopiowany do scratchpad, zgłaszanie `rule:'R7'` zastąpione `void 0`): wynik `PASS=11 FAIL=7`. Czerwone: wszystkie sześć asercji R7 (`${T}${path.sep}stała`, `${T}/stała`, `T.concat`, `[T,'stała'].join`, `path.posix.join(T,'stała')`, `tablica z korzeniem wprost + join`) oraz zbiorcze „zadna bramka ... 1 trafien" (to fixture `fx-pid` z zarzutu 2, nie drzewo repo).

## Dowody z surowego wyjścia

Realne drzewo (commit 7dc7ce515), `node gra/tools/bramki-tmpdir-unikalnosc-test.cjs`:
- `przeskanowano 436 plikow z tmpdir (z 1956 .cjs)`
- `PASS=18 FAIL=0`, exit 0

Bramka po zmianie na fixture'ach scratch (`ev-repro/tools/`):
- `[R7] fx-sep.cjs:3 ${path.sep}civ-x`
- `[R2] fx-pid.cjs:2` (pre-existing, zob. zarzut 2)
- `PASS=17 FAIL=1`

Bramka bazowa a80b9bbfa na tych samych fixture'ach: `[R2] fx-pid.cjs:2`, `PASS=9 FAIL=1`.

## TESTY
- bramki-tmpdir-unikalnosc-test.cjs (drzewo): PASS=18 FAIL=0, exit 0.
- Mutacja R7 wyłączona (kopia poza repo): PASS=11 FAIL=7 — samotest wykrywa wyłączenie R7.
- cluster-plan-name-test.cjs: NIE_ZMIERZONO w tej rundzie. Powód: `Error: Cannot find module 'esbuild'` — w worktree brak `gra/node_modules` (instalacja zależności nie była częścią zadania tej rundy). Plik nie był zmieniany od 677616b9e (`git diff --stat` pokazuje tylko bramkę tmpdir), więc wynik z poprzedniej rundy (6/0 według dispatchu) nie jest dowodem na tym kandydacie.
- tsc / logic 213 / ai-test 297/0: NIE_ZMIERZONO w tej rundzie (zmiana dotyczy wyłącznie narzędzia testowego w gra/tools; gra/src nietknięte; brak `npm` w gra/ zgodnie z zakazami).
- `git diff --check`: bez zastrzeżeń (dla zatwierdzonego pliku; sprawdzone przed commitem poprzez brak wyjścia).

## BLOKADY
- Brak technicznej blokady dla zmian bramki.
- Brak node_modules w worktree blokuje uruchomienie cluster-plan-name-test.cjs (esbuild) — NIE_ZMIERZONO, zob. TESTY.

## RUNDY
2/5 (obrona). Runda 1 — Operator, 10-operator-claude.md (677616b9e).

## UWAGI-DLA-ORKIESTRATORA
1. Pre-existing fałszywy alarm R2 dla bezpiecznego wzorca `fs.mkdirSync(path.join(T, 'civ-x-' + process.pid))` (zarzut 2). Dowód: identyczny wynik na a80b9bbfa. Propozycja: osobny temat zawężający R2 o znacznik unikalności w argumencie ścieżki (nie w tej rundzie).
2. cluster-plan-name-test.cjs wymaga `esbuild` z gra/node_modules — w czystym worktree gate nie startuje. Jeśli orkiestrator chce dowodu 6/0 na kandydacie, potrzebna jest instalacja zależności w worktree (decyzja orkiestratora).

## NASTĘPNY KROK
Evaluator: zweryfikować commit 7dc7ce515 (zarzuty 1 i 3 na mutacji R7 off oraz fx-sep), potwierdzić zarzut 2 jako pre-existing. Po Final Control: integracja przez orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
