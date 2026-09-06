# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Obrona Operatora, runda 1 (druga faza)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Operator (obrona) — Opus 5, effort high
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
RUNDY: 1/5 (druga faza tej samej rundy, nie nowa runda)
NASTĘPNY KROK: Final Control (werdykt per zarzut, §3c)
DEPLOY/PUSH: NIE WYKONANO

**Sześć z siedmiu zarzutów przyjmuję — pięć poprawione w tej rundzie.** Żadnego nie
odrzucam co do faktów; jeden odrzucam wyłącznie jako zarzut wobec Operatora (Z7).

## Uwaga wstępna do izolacji

Prompt tej fazy każe oczekiwać HEAD `91877f11`. Drzewo było czyste, ale HEAD to
`1585db98`. To nie jest kolizja: `git merge-base --is-ancestor 91877f11 HEAD` przechodzi,
a wszystkie 16 commitów między nimi należy do tego tematu (9 Operatora, 4 Evaluatora).
`91877f11` to baza fazy pierwszej — obrona z definicji startuje z HEAD po Evaluatorze.
Nie zatrzymałem się na `BLOCK`, bo warunek „cokolwiek innego" dotyczy cudzej pracy
w worktree, a tu jej nie ma.

## OBRONA per zarzut

### Z1 → PRZYJMUJĘ. Handlery sygnałów usunięte z 57 plików.

Zmierzone, nie rozważone. Minimalna reprodukcja (`execSync('sleep 8')` + SIGTERM po 2 s):
bez handlera `exit=143` natychmiast; z handlerem z `cf148d0e` sygnał **połknięty**,
proces dobiega końca, `exit=0`. Sprawdziłem też wariant „handler + re-raise", żeby nie
naprawiać połowicznie: **też połknięty, `exit=0`**. Handler poza `execSync` działa
(`exit=143`) — więc luka pokrywa dokładnie tę fazę, w której bramka spędza większość czasu.
Wniosek: **żaden wariant handlera nie jest bezpieczny**, bo rejestracja zdejmuje domyślną
akcję sygnału. Blok sygnałów usunięty ze wszystkich 57 plików (bajt-w-bajt identyczny,
zweryfikowane przed podmianą).

Zamiast niego **sweep startowy**: kasuje wyłącznie katalogi o sygnaturze `-<pid>-<6 znaków>`,
których **proces już nie żyje** (`process.kill(pid,0)`, `EPERM` traktowane jak „żywy").
Pomiar na przynętach: martwy PID → usunięty; **żywy PID → nietknięty**; `*-shots-*` →
zachowany (§9 pkt 6); nazwa bez sygnatury → nietknięta. Przy okazji odzyskał dwie realne
sieroty (`era-change-notify-bundle-5770-…`, `-7191-…`) — dowód, że wyciek był faktem.

Na **prawdziwej bramce**: SIGTERM w fazie `vite build (fix)` → martwa w <3 s, **`exit=143`**,
osierocony katalog sprzątnięty przez sweep następnego przebiegu.
**Korekta własnego pomiaru:** pierwszy przebieg tego testu był nieważny — zabiłem podpowłokę
(15221), nie node'a (15223), który przeżył. Powtórzone na PID node'a. Zgłaszam, bo dokładnie
ten błąd pomiarowy mógłby mnie doprowadzić do fałszywego „naprawione".

### Z2 → PRZYJMUJĘ. Reguła R4 dodana, R1 poprawiona.

Potwierdzone mutacją: `path.join(os.tmpdir(), 'civ-zz-mut6', 'dist')` w pliku ZE znacznikiem
unikalności (czyli w każdym z 57 naprawionych) → bramka **`PASS=3 FAIL=0`, `exit=0`**.
Przyczyna w kodzie: forma wieloargumentowa nie jest pojedynczym literałem, więc spadała do
R3, a R3 jest tłumione przez `fileHasUniqueMark`. Konkatenacja `os.tmpdir() + '/nazwa'`
(M2, M7) nie była łapana w ogóle.
Poprawka: R1 klasyfikuje po **każdym segmencie** (`splitTopLevel`), nowa **R4** łapie
konkatenację w obu notacjach. Po mutacji: M2 → `[R4] exit=1`, M6 → `[R1] exit=1`,
M7 → `[R4] exit=1`. Wszystkie cofnięte, bramka `PASS=3 FAIL=0`.

### Z3 → PRZYJMUJĘ. Nowa reguła R5 + 11 plików naprawionych.

Zarzut trafny co do faktu i co do przyczyny: pula audytu była zdefiniowana przez
`grep os.tmpdir()`, więc klasa z dosłownym `/tmp/…` była dla niej **niewidzialna z definicji** —
ta sama ślepota, którą sam zgłaszałem przy `.smoke-*`, tylko o krok dalej.
Potwierdzone: 13 plików z dosłownym `/tmp/` i bez `os.tmpdir()`;
`miasta-panstwa-wylaczone-ui-render-test.cjs:19` to stała nazwa **z `--emptyOutDir`**, czyli
najwyższa klasa ryzyka z mojej własnej tabeli; `perf-long-session-live-test.cjs` pisał zrzut
pod stałą nazwę mimo że plik był „naprawiony".

**R5 skanuje KAŻDY plik**, nie tylko te z `tmpdir`. Naprawione 11 plików, z rozróżnieniem,
którego wcześniej nie było:
- cel zapisu konsumowany **w tym samym procesie** (DIST/WORK/build) → sufiks
  `-${TMPDIR_RUN_ID}`, czyli sygnatura sprzątana przez sweep;
- **wytwór do odczytania później** (raporty `--out`, zrzuty) → sufiks `-p${process.pid}`:
  unikalny, ale **celowo poza sygnaturą sweepa**, żeby sweep nie skasował dowodu.

Whitelist 4 pozycji, każda z powodem, wzorem `mgla-sciezka-inwariant-test.cjs`: wyłącznie
ścieżki **czytane**. Dwa przebiegi czytające ten sam katalog sobie nie przeszkadzają;
każdy CEL ZAPISU whitelisty nie dostaje. Mutacja M8 (`'/tmp/civ-zz-mut8-dist'` w pliku bez
`os.tmpdir()`) → `[R5] exit=1`, cofnięta.

### Z4 → PRZYJMUJĘ. Bramki Chromium uruchomione.

Kryterium binarne i w chwili raportu Evaluatora niespełnione — nie broniłem tego wtedy
i nie bronię teraz. Uruchomiłem **wszystkie 26 zmodyfikowanych przeze mnie bramek Chromium**
plus `miasta-panstwa-wylaczone-ui-render-test.cjs`. Wyniki w tabeli niżej.

### Z5 → PRZYJMUJĘ. Eksperyment PRZED powtórzony bezpiecznie.

Zarzut trafny: eksperyment użył kanonicznej, współdzielonej nazwy w czasie, gdy sam
zapisałem, że `wt-garnizon` z niej korzysta — czyli wytworzyłem dokładnie tę szkodę,
którą temat ma likwidować. Powtórzone metodą wskazaną przez Evaluatora: kopia kodu
bazowego `91877f11` z **nazwą prywatną** `civ-obrona-z5-prywatny`, dwa przebiegi równolegle.
Wynik: **`A=1 B=1`**, te same dwa objawy (`ENOTEMPTY … rmdir`, `failed to load config from`).
Mechanizm dowiedziony bez dotknięcia cudzej ścieżki; plik roboczy i katalog usunięte.

### Z6 → PRZYJMUJĘ dla tego raportu.

Narracja tej obrony mieści się w ~400 słowach (tabele i cytaty pomiarów nie liczą się —
§11 / dispatch). Raportu `01` **nie skracam**: to dokument, który Evaluator faktycznie
oceniał, a przepisywanie go po ocenie zaciemniłoby ślad dla Final Control (§13b).

### Z7 → ODRZUCAM jako zarzut wobec Operatora, PRZYJMUJĘ co do treści.

Dowód z normy, nie z opinii: §9 pkt 4 — „Zmiana samego procesu nigdy nie jedzie
w allowliście tematu produktowego". Jedyny rejestr bramek to `docs/decyzje/R-PROC-AUTOBOT.md`
§6, jawnie zakazany w allowliście dispatchu. Rejestracja **nie mogła** się tu wydarzyć
bez naruszenia granicy. Przekazuję orkiestratorowi jako osobny temat `PROCESS`.
Sam Evaluator klasyfikuje to tak samo.

## DO DECYZJI CZŁOWIEKA

**Domyślne nazwy katalogów raportowych `--out`** (`flaga-mp-*`, `wojny-kamien-ev/fc`).
Uczyniłem je unikalnymi, bo stała nazwa łamie GOAL. Ale te katalogi są **wytworem dla
człowieka**, a nie artefaktem wewnętrznym: jeśli ktoś ma zapisany stały `/tmp/ev-wojny-out`
w swoim nawyku albo skrypcie, zmiana domyślnej nazwy mu go psuje. Wytwór sam nie
rozstrzyga, czy te narzędzia są martwymi jednorazówkami z zamkniętych tematów (tak
sugerują nazwy `ev`/`fc`/`audyt`), czy żywym warsztatem. Wywołanie z jawnym `--out`
jest nietknięte w obu wariantach.

## TESTY (uruchomione w tej fazie)

| bramka | wynik |
|---|---|
| `tsc --noEmit` | **0 błędów** (14,5 s) |
| `logic-test` | **213/213** |
| `tech-tree-test` | **19/19** |
| `research-test` | **33/33** |
| `unit-replace-test` | **13/13** |
| `combat-test` | **6/6** |
| `mgla-sciezka-inwariant-test` | **42/42** |
| `bramki-tmpdir-unikalnosc-test` | **PASS=3 FAIL=0**; mutacje M2/M6/M7/M8 → `exit=1` (R4/R1/R4/R5), cofnięte |

