# Evidence — R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — Evaluator

Run: `attempt-20260913`
Evaluator task: `t_5934752f`
Evaluator HEAD: `2b94ca8242b614b599bf3bf6624bafedca6190a2`
Operator source HEAD: `0b95694b73c429d01d8b65942235f2863947f986`
Operator base HEAD: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
Branch/worktree: `hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1` / `/home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs`

1. Niezależny audyt danych

Odczytano bezpośrednio `gra/data/civs.json` i `gra/data/city-names-pools.json`, innym skryptem niż raport Operatora. Zestaw `ikonaId` i kluczy pul jest identyczny: 15/15, brakujące 0, nadmiarowe 0; identyfikatory unikalne 15.

```text
ID          | Cywilizacja | MC n/e/d | MP n/e/d | MC∩MP | nazwyMiast n/e/d | mirror
------------|-------------|----------|----------|-------|------------------|-------
grecy       | Grecy       | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
rzymianie   | Rzymianie   | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
chinczycy   | Chińczycy   | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
inkowie     | Inkowie     | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
zulusi      | Zulusi      | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
egipt       | Egipt       | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
sumer       | Sumerowie   | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
celtowie    | Celtowie    | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
germanie    | Germanie    | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
harappa     | Harappa     | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
hetyci      | Hetyci      | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
slowianie   | Słowianie   | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
babilonia   | Babilonia   | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
asyria      | Asyria      | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
fenicjanie  | Fenicjanie  | 100/0/0  | 10/0/0   | 0     | 100/0/0          | true
```

Agregaty niezależnego skryptu:

```text
regular: slots=1500 unique=1381 repeatedDistinct=94 repeatedOccurrences=119
state:   slots=150  unique=150  repeatedDistinct=0  repeatedOccurrences=0
cross-family names=3: Bit-Amukani, Bit-Dakkuri, Bit-Jakin
cross locations: asyria:miasta_cywilizacji × babilonia:miasta_panstwa
local MC∩MP: 0 for all 15
civilization labels: 15 rows, 15 unique, 0 empty, 0 duplicates
label equal to a city name: only Harappa in harappa:miasta_cywilizacji (eponym), no other match
```

2. Grecja, ścieżki i fallback

Aktualny kod potwierdza rozdzielenie źródeł: loader importuje pule (`gra/src/data/loader.ts:19`) i wystawia `cityNamesPools` (`:421`); `cluster-spawn.ts:227,354,358,410` przekazuje pule odpowiednio do stolicy gracza, obcej stolicy i rywali. `city-names-pool.ts:94-97` i `:159-162` czytają `miasta_cywilizacji[0]` dla obu stolic, a `:105-142` czyta `miasta_panstwa[1..]` dla rywali. W `civ-names.ts:67-73` i `:106-112` bez puli najpierw czytane jest `nazwyMiast[0]`, potem zachowany fallback do `nazwyKlastra[0]`; `:127-129` odczytuje nazwę cywilizacji ze skalarnego `Cywilizacja`.

Readback danych: `grecy` ma `Cywilizacja=Grecy`, `miasta_cywilizacji[0]=Ateny`, `miasta_panstwa[0]=Sykion`, `nazwyMiast[0]=Ateny`. Aktualny bundle zwrócił:

```text
{"modernForeign":"Ateny","legacyPlayer":"Sykion","legacyForeign":"Sykion","modernRival":"Fliunt"}
```

Dla wszystkich 15 cywilizacji `playerStartCityName(civs,id)` i `foreignCapitalCityName(civs,id)` bez puli zwróciły regularne MC[0]; `civ-names-test.cjs` potwierdził 66/0. Izolowany fallback legacy z jedynym `nazwyKlastra=['Sykion']` zwrócił `Sykion` dla obu stolic.

3. Odtworzenie przed poprawką i minimalność diffu

Zbudowano w katalogu tymczasowym moduł z blobu `git show ff9ce26a663c53c9f711e50536eb10f59dc4b70b:gra/src/game/civ-names.ts`, z aktualnym modułem puli, bez modyfikowania repo. Wynik starego kodu dla Greków bez puli: exit 0, `{"player":"Sykion","foreign":"Sykion"}`. To odtwarza zgłoszoną pomyłkę MC/MP. Aktualny diff ma wyłącznie: `civs.json` — 3/3 linii przy dwóch synchronizacjach; `civ-names.ts` — 14/2; `civ-names-test.cjs` — 19/8. Nie zmieniono `city-names-pools.json`, `city-names-pool.ts`, `display-names.ts` ani `cluster-spawn.ts`.

4. Rzeczywiste bramki

Wszystkie komendy uruchomiono niezależnie z `gra/` z `NODE_PATH` wskazującym istniejącą lokalną instalację zależności w innym worktree; niczego nie instalowano:

```text
node tools/nazwy-miast-rozlaczne-pule-test.cjs  -> 9 passed, 0 failed, exit 0
node tools/city-names-pool-test.cjs              -> 12 passed, 0 failed, exit 0
node tools/city-names-pools-test.cjs             -> 6 passed, 0 failed, exit 0
node tools/civ-names-test.cjs                    -> 66 passed, 0 failed, exit 0
node tools/display-names-test.cjs                -> 27 passed, 0 failed, exit 0
node tools/mapa-etykieta-stolicy-test.cjs       -> 47 passed, 0 failed, exit 0
node ./node_modules/typescript/bin/tsc --noEmit -> Version 5.9.3, exit 0
```

Symlink `gra/node_modules` użyty wyłącznie na czas typechecku został usunięty; po testach `gra/node_modules` jest nieobecne. `git diff --check` jest PASS. Nie uruchamiano `npm run build` ani `npm run dev`, zgodnie z C-001; temat nie jest wizualnym tematem wymagającym zrzutu z przeglądarki.

5. Zakres i provenance

`git diff --name-only` zawiera tylko trzy allowlistowane pliki produktu; odczytane pliki audytowe bez zmian. HEAD `2b94ca82` różni się od Operatorowego `0b95694b` wyłącznie dodanym, oczekiwanym `02-dispatch.md`; nie jest to zmiana produktu. Nie znaleziono sekretów, nieuzasadnionych usunięć ani zmian poza zakresem. Nie wykonano poprawek, `git add`, pushu, PR, merge ani deployu.

Niezależnie przeliczone hashe istniejących artefaktów Operatora:

```text
01-operator.md             declared/placeholder SHA = b287d881a8bfea08b56b8cb20a3d7418a3a79d8bf9b969581504bcd2194d0d24
01-operator-evidence.md    SHA = c05c9d2bdc8829e06bc2b447a57bdf74e42bd38a6dc60a7ef158ad51055d21db
progress.json              SHA = ffc8d26674f74edab64b55e38791b1efa27678ba0d0a5f989477832ca1fad930
journal.md                 SHA = 8fdb869f49c729001e2b3c54e502ab23ef23818b66832488358d9abf27eb0036
transition-receipt.json    readback SHA = da7bfde11ff2a48f1ed4bd5ddc2dfd6f9fb4709f4ba6a36223086251f7a9bb69
```

Dla raportu Operatora SHA obliczone z literalnym `<REPORT_SHA256>` wynosi dokładnie wartość zadeklarowaną w raporcie i receipt; trzy pozostałe wartości zgadzają się bitowo z receipt. Receipt ma poprawny JSON, `source_head=0b95694b`, `source_task_id=t_ba1a3b03`, `phase=operator`, `status=PASS`, a `push_merge_deploy`/`product_approval` nie udają wykonanej integracji.

Wynik: lista zarzutów Evaluatora jest pusta; Final Control może wykonać własną kontrolę. This evidence is read-only verification; no product correction was made.
