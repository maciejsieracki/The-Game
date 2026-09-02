TEMAT:  P-KARTY-HISTORIA-TEST-CUDA-FIXTURE-REALNE-DANE-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: PROCESS
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Operator `R-KARTY-HISTORIA-W1-Q1` (pierwszy batch treści `historia` dla 10 z
19 cudów) znalazł DOKŁADNIE tę samą klasę błędu, którą już DWUKROTNIE
naprawiano w tej serii dla innych kategorii encji
(`P-KARTY-HISTORIA-TEST-FIXTURE-REALNE-DANE-Q1` dla sekcji [4]/[5] budynków/
technologii/ulepszeń/jednostek, `P-KARTY-HISTORIA-TEST-TARASY-HARDCODE-Q1`
dla „Tarasy uprawne"): `gra/tools/entity-card-wonder-test.cjs`
(`R-KARTY-HISTORIA-INFRA-CUDA-Q1`) ma TRZY twarde asercje zakładające, że
ŻADEN cud nie ma dziś pola `historia` — po integracji dowolnej treści to
fałszywie czerwienieje.

## RECON (wykonany, nie powtarzać)
1. Linia 85-86: `check('fixture: żaden aktywny cud (cuda[]) nie ma dziś
   niepustego "historia"...', wondersRaw.cuda.every((w) => typeof
   w.historia !== 'string' || w.historia.trim() === ''))` — twardy warunek
   „wszystkie puste”.
2. Linie 162-170: pętla po WSZYSTKICH 19 cudach, `check(... sekcja "Rys
   historyczny" NIEOBECNA (pole "historia" dziś puste dla WSZYSTKICH 19
   cudów)', r.historiaExists === false, r)` — per-cud twardy warunek
   „zawsze puste”, zamiast „zgodne z realnym stanem pola w danych”.
3. Linie 179-215 (scenariusz mutacyjny): wstrzykuje `historia` w pamięci do
   wiersza `piramidy`, ale linia 207-208 zakłada `mutation.beforeHasSection
   === false` na podstawie REALNEGO stanu wiersza `piramidy` w
   `wonders.json` — `piramidy` to JEDEN z 10 cudów właśnie wypełnianych w
   `R-KARTY-HISTORIA-W1-Q1`, więc po integracji tego batcha realny wiersz
   `piramidy` będzie miał NIEPUSTE `historia`, i ten „przed” stan przestanie
   być pusty — asercja fałszywie czerwienieje niezależnie od naprawy [1]/[2].

## GOAL
W `gra/tools/entity-card-wonder-test.cjs`:
1. Linia 85-86: zmień na WARUNKOWĄ, analogicznie do naprawy zastosowanej
   wcześniej w tej serii — zamiast zakładać „wszystkie puste”, policz
   faktyczny stan (`const filled = wondersRaw.cuda.filter(w => typeof
   w.historia === 'string' && w.historia.trim() !== '')`) i asercjuj coś
   realnie niezmiennego niezależnie od treści (np. że `activeWonderIds`
   nadal ma dokładnie 19 elementów — TO jest już osobną, poprawną asercją
   w linii 81; usuń WYŁĄCZNIE linię 85-86 albo zamień ją na coś, co
   faktycznie coś sprawdza niezależnie od stanu treści, np. że każdy wpis
   `historia` (jeśli istnieje) jest stringiem — nie zostawiaj martwej,
   zawsze-prawdziwej asercji).
2. Linie 162-170: zmień `r.historiaExists === false` na WARUNKOWE
   porównanie z realnym stanem pola dla TEGO KONKRETNEGO cudu w danych:
   odczytaj `wondersRaw.cuda.find(w => w.id === r.id).historia` (albo
   przekaż tę informację przez `page.evaluate` razem z resztą danych) i
   asercjuj `r.historiaExists === (pole niepuste dla tego id)`. Zaktualizuj
   też treść komunikatu `check(...)` żeby nie kłamała o „WSZYSTKICH 19”.
3. Scenariusz mutacyjny (linie 179-215): NIE polegaj na realnym stanie pola
   `historia` wiersza `piramidy` dla warunku „przed”. Zamiast tego, w
   `page.evaluate`, PRZED wstrzyknięciem fixture'a jawnie wyczyść pole na
   kopii wiersza (`const clearedRow = { ...realRow, historia: '' }`),
   zrenderuj `dataBefore` z `clearedRow` (nie z surowym `realRow`), a
   `dataAfter` nadal z `mutatedRow` (kopia z wstrzykniętym fixture'em) —
   to gwarantuje realny, kontrolowany kontrast „puste → niepuste”
   niezależnie od tego, czy `piramidy` ma już prawdziwą treść w danych.
   Możesz zamiast `piramidy` użyć DOWOLNEGO id z `activeWonderIds` — wybór
   nie ma znaczenia po tej poprawce, bo test już nie polega na realnym
   stanie pola tego wiersza.

Zero zmian w innych plikach. Zero zmian w logice `renderer.ts`/
`wonderAdapter.ts`/`buildModeHud.ts` — to WYŁĄCZNIE naprawa testu.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Test przechodzi w 100% NA DZISIEJSZYM stanie `main` (przed integracją
   `R-KARTY-HISTORIA-W1-Q1`, gdzie WSZYSTKIE 19 cudów mają puste `historia`).
2. Test PRZECHODZI RÓWNIEŻ po scherry-pickowaniu `R-KARTY-HISTORIA-W1-Q1`
   (commit `201573c5`, na branchu `autobot/R-KARTY-HISTORIA-W1-Q1` — jeśli ten
   branch/commit już nie istnieje bo został zintegrowany, cherry-pickuj z
   `origin/main` po jego integracji, albo znajdź SHA w
   `REJESTR-PROSB-I-ZADAN.md`) na wierzch — dowód: wykonaj ten cherry-pick w
   swoim worktree i pokaż 134/134 (albo nową, poprawną liczbę testów jeśli
   zmieniłeś ich strukturę — udokumentuj dokładną liczbę).
3. Pozostałe asercje testu (kryteria [1]/[2]/[3] z nagłówka pliku — obecność
   karty, klik ikonki/wiersza, brak wiersza „Uwagi”) NIEZMIENIONE co do
   treści i zachowania.
4. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/tools/entity-card-wonder-test.cjs` WYŁĄCZNIE. Zakazane bezwzględnie:
`gra/data/**`, `gra/src/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-KARTY-HISTORIA-TEST-CUDA-FIXTURE-REALNE-DANE-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 2 za spełnione bez REALNEGO odtworzenia (cherry-pick
commitu `R-KARTY-HISTORIA-W1-Q1` do swojego worktree) scenariusza „część
cudów ma już treść” — dokładnie ta klasa błędu już DWUKROTNIE naprawdę
wystąpiła w tej sesji dla innych kategorii encji.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only, następnie NATYCHMIAST integruje
`R-KARTY-HISTORIA-W1-Q1` (już PASS-WITH-NOTES merytorycznie, czekał
wyłącznie na tę naprawę), po czym dispatchuje W2 (ostatnie 9 cudów).
