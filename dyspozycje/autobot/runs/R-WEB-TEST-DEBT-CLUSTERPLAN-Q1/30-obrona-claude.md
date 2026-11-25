# R-WEB-TEST-DEBT-CLUSTERPLAN-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-CLUSTERPLAN-Q1
GOAL: odpowiedź na zarzuty Evaluatora z rundy 1 (kandydat deef6014f, raport f43757ab0): luka R2 w bramce tmpdir, brak samotestu dla tych form, uwaga o mutancie rivalIndex+2.
ZMIANY/COMMIT: allowlista = gra/tools/bramki-tmpdir-unikalnosc-test.cjs (jedyny zmieniony plik). Commit: patrz sekcja "SHA" poniżej.
TESTY: poniżej.
BLOKADY: brak. Zarzut 3 (mutant rivalIndex+2) przyjęty jako uwaga nieblokująca, bez poprawki w tej rundzie (patrz niżej).
RUNDY: 2/5 (runda 1: Operator; runda 2: ta obrona).
NASTĘPNY KROK: Evaluator ponownie na nowym SHA (zarzuty 1 i 2 do weryfikacji mutacjami M2, M4, M5 i samotestem).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — luka R2 (konkatenacja, alias, wieloliniowe path.join): PRZYJMUJĘ, naprawione

Przyczyna: `isReadOnlyRoot` sprawdzała każde użycie zmiennej korzenia tylko w jego własnej linii. Dlatego:
- M2 `const p = T + '/civ-fixed'; fs.writeFileSync(p)` — linia z `T +` nie zawiera API zapisu ani `path.join(T,`, więc zmienna była „tylko do odczytu”.
- M4 `const U = T; fs.writeFileSync(U + '/a')` — alias nie był w ogóle śledzony.
- M5 `path.join(\n T,\n 'civ-fixed')` — literał `'civ-fixed'` leżał w innej linii niż `path.join(T`.

Naprawa (w `isReadOnlyRoot`): każde użycie jest oceniane w kontekście całej instrukcji (od poprzedniego `;`, `{`, `}` do następnego `;`):
- API zapisu w tej instrukcji → FAIL (wielolinijkowo);
- konkatenacja `+` przed lub po użyciu → FAIL;
- alias `= T;` → FAIL;
- `path.join|resolve(T, <literał>)` także gdy argumenty są w różnych liniach → FAIL.
Odczyt (readdir, exists, stat) i `path.join(T, <zmienna>)` z dynamiczną nazwą nadal przechodzą, bo samotest `fixtureRead` jest zielony.

Dowód po naprawie (sondy tymczasowe w `gra/tools/`, usunięte po teście, bez śladu w repo):
- M2 → `[R2] zz-probe-m2.cjs:2 (korzen os.tmpdir())`, bramka FAIL;
- M4 → `[R2] zz-probe-m4.cjs:2 (korzen os.tmpdir())`, bramka FAIL;
- M5 → `[R2] zz-probe-m5.cjs:2 (korzen os.tmpdir())`, bramka FAIL;
- przed naprawą te same trzy pliki dawały PASS=7 FAIL=0 i exit 0 (zmierzone w tej rundzie).

### Zarzut 2 — samotest bez form konkatenacji, aliasu i wieloliniowości: PRZYJMUJĘ, naprawione

W samotest (blok `SAMOTEST BRAMKI`) dodano trzy fixture'y z asercją `>= 1`:
- `samotest R2: konkatenacja zmiennej korzenia + stała = FAIL`
- `samotest R2: alias korzenia (const U = T) użyty do zapisu = FAIL`
- `samotest R2: wieloliniowe path.join(korzeń, stała) = FAIL`

Każdy z nich wymusza FAIL w nowej logice. Starej logiki nie sprawdzano na tych fixture'ach, bo zarzut dotyczył wyłącznie stanu przed naprawą; po naprawie samotest jest zielony.

### Zarzut 3 — mutant rivalIndex+1 → +2 w cluster-spawn.ts przechodzi cluster-plan-name-test: PRZYJMUJĘ jako uwagę, NIE NAPRAWIONE w tej rundzie

Stan: `src/map/cluster-spawn.ts` (linie 420–422) liczy `rivalIndex` jako `(… ?? 0) + 1`, a `clusterRivalCityName` z `src/game/civ-names.ts` (linia 87) przyjmuje go jako `rivalIndex1Based`. Test `tools/cluster-plan-name-test.cjs` sprawdza tylko, czy nazwy zaakceptowanych slotów są prefiksem puli. Dlaczego mutant przechodzi: nie zmierzyłem tego sam. Nie wiem, czy ścieżka puli (`clusterRivalFromPool`) w ogóle zależy od wartości indeksu, czy tylko od `usedNames`. Bez tego dowodu nie mogę napisać asercji, która go złapie, więc nie dopisuję jej na ślepo. Zarzut jest zaznaczony w raporcie Evaluatora jako „sama nie blokuje”.

Zalecenie dla orkiestratora: osobny temat z pełnym dowodem (sprawdzić, czy `clusterRivalFromPool` używa indeksu) i z asercją na kolejność indeksów rywali. Nie wprowadzam tego w tym temacie.

## Testy (wyniki z surowego wyjścia tej rundy)

- `cd gra && node tools/bramki-tmpdir-unikalnosc-test.cjs` → `PASS=10 FAIL=0`, exit 0, `przeskanowano 436 plikow z tmpdir (z 1956 .cjs)` (przed zmianą: PASS=7, po zmianie samotestu i przed probami tej samej liczby plików).
- Sondy M2/M4/M5 po naprawie → `PASS=9 FAIL=1`, exit 1, trzy trafienia R2 (patrz wyżej).
- `git diff --check` → bez uwag.
- `git diff --stat` → `gra/tools/bramki-tmpdir-unikalnosc-test.cjs | 21 insertions(+), 3 deletions(-)`.

Nie uruchamiałem `cluster-plan-name-test.cjs` na nowo, bo nie zmieniałem kodu gry ani tego testu.

## UWAGI-DLA-ORKIESTRATORA

- Zarzut 3 wymaga osobnego tematu (patrz wyżej). Nie zakładam, że mutant jest równoważny.
- Repo przechodzi nową bramkę bez fałszywych trafień na 436 plikach z tmpdir, więc zaostrzenie R2 nie wymaga zmian w innych testach.
- Pliki sond `gra/tools/zz-probe-*.cjs` zostały usunięte po pomiarze. Nie są w commicie.
