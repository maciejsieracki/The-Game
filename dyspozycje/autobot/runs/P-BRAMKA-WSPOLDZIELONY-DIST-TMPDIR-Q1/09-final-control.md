# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Final Control, runda 1

STATUS: FAIL
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Final Control — Opus 5, effort high
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
ZMIANY/COMMIT: Final Control nie zmienia kodu. Oceniany zakres `91877f11..da803a06`
(baza dispatchu `fe57a068` jest przodkiem — `git merge-base --is-ancestor` przechodzi;
`fe57a068..91877f11` nie rusza `gra/`, więc obie bazy dają dla `gra/` ten sam diff).
70 plików w `gra/tools/` + katalog runu, **zero plików poza allowlistą**. Drzewo czyste
przed i po każdej mojej mutacji. Jedyny artefakt tego raportu:
`dyspozycje/autobot/runs/P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1/09-final-control.md`.
RUNDY: 1/5 (obrona to druga faza tej samej rundy, nie osobna runda — licznik nie zresetowany)
NASTĘPNY KROK: Operator, runda 2 — jedna poprawka w `bramki-tmpdir-unikalnosc-test.cjs` (FC-1)
DEPLOY/PUSH: NIE WYKONANO

## Dlaczego FAIL mimo dobrej pracy

Naprawa działa — zreprodukowałem to sam, w obie strony. Czerwienieje jednak
**zabezpieczenie przed nawrotem**, czyli trzecia z trzech rzeczy wymaganych przez GOAL.
Nowa bramka nie widzi ORYGINALNEGO defektu, gdy wstawić go z powrotem do któregokolwiek
z 57 naprawionych plików. Poprawka to jedno słowo i zmierzyłem, że nie generuje ani
jednego fałszywego alarmu.

## Odpowiedzi na pytania tematu (każda z mojego uruchomienia)

| Pytanie | Odpowiedź | Mój dowód |
|---|---|---|
| Czy audyt objął WSZYSTKIE pliki z `os.tmpdir()`? | **TAK, z nadmiarem** | Na bazie `91877f11`: `grep -rl "os.tmpdir()" gra/tools/*.cjs \| wc -l` = **54**. Pełna pula `tmpdir()` (z kropkowymi `.smoke-*` i notacją `require('os')`) = **62**. Tabela raportu ma **62 wiersze**; `diff` listy plików z pulą — **zero różnic**. Ślepa plamka rekonesansu potwierdzona: 8 plików ponad komendę z dispatchu |
| Czy zrobiono DWA RÓWNOLEGŁE przebiegi PRZED i PO? | **TAK — odtworzyłem oba sam** | PRZED (kod bazowy, prywatna stała nazwa `civ-fc-przed-prywatny`, §2b nietknięte): **`A=1 B=0`** — ten sam kod, ta sama chwila, DWA RÓŻNE WERDYKTY. A padł na `vite build (mut-a)`: `Could not resolve "./barbarians" from src/game/post-battle-map.ts` w `/tmp/civ-fc-przed-prywatny/root-mut-a` — drugi bieg skasował mu lustro w locie. PO (HEAD, 2× równolegle, `load ≈ 21`): **`A=0 B=0`, `PASS=42 FAIL=0` w obu**, katalogi `…-26313-09ej7n` i `…-26302-ln8ue4`, oba usunięte po przebiegu, **zero błędów katalogowych**, 42/42 asercji identyczne co do znaku |
| Czy nowa bramka czerwienieje po wstawieniu stałej ścieżki? | **CZĘŚCIOWO — patrz FC-1** | 6 z 8 moich mutacji czerwieni ją poprawnie; **2 przechodzą na zielono**, w tym przywrócenie oryginalnego defektu do `weterani-test.cjs` |

| # | Pytanie wspólne | Odpowiedź |
|---|---|---|
| A | Osłabiona/usunięta asercja? | **NIE.** Diff usuwa **92 linie** — wypisałem je co do jednej, **każda** jest deklaracją ścieżki tymczasowej; zero asercji, progów i logiki pomiarowej. Policzyłem znaczniki asercji w każdym z 58 wspólnych plików baza-vs-HEAD: **w żadnym liczba nie spadła**, w każdym rośnie dokładnie o 2 (dwa `.test(ent)` z wstrzykniętego bloku). `git diff --check` czysty, zero sekretów w diffie |
| B | Wyciek zakresu? | **NIE.** `91877f11..HEAD`: 70 plików `gra/tools/**/*.cjs` + katalog runu, **zero poza allowlistą**. Jedyny plik spoza allowlisty w `fe57a068..HEAD` to `runs/P-ROSTER-ZWIADOWCA-…/00-dispatch.md` z commita `91877f11` — to commit dispatchowy orkiestratora, nie praca Operatora. Zero `gra/src`, `gra/data`, `docs/decyzje`, `WERSJE.md`. §2b dotrzymane co do znaku: rodzina `szczescie-*`/`wealth-*`/`logic-test` to **dokładnie te 10 plików, które w tym czasie zmienił `origin/main`** — przecięcie z tym tematem **puste** |
| C | `tsc --noEmit` i pięć bramek referencyjnych? | **WSZYSTKIE ZIELONE, moje przebiegi.** `tsc --noEmit` **exit=0, 0 błędów**; `logic` **213/213**, `tech-tree` **19/19**, `research` **33/33**, `unit-replace` **13/13**, `combat` **6/6** |
| D | Czerwona bramka bez pomiaru na czystej bazie? | **NIE ZNALAZŁEM TAKIEJ.** Sześć czerwonych z rundy 1 sprawdziłem sam, kopiując wersję bazową i uruchamiając: **identyczny `exit=1` i identyczna przyczyna** po obu stronach (patrz tabela niżej). `origin/main` przesunął się o 22 pliki w `gra/`, ale żaden nie dotyka tego tematu, więc `91877f11` jest poprawnym punktem odniesienia (`gra/` w `fe57a068` i `91877f11` identyczne, `fe57a068` jest przodkiem `origin/main`) |

## Moje mutacje — osiem, każda cofnięta, `git diff --quiet` czyste po każdej

| # | Mutacja (inna niż z raportów) | Wynik bramki | Ocena |
|---|---|---|---|
| FC-M1 | nowy plik w **PODKATALOGU** `tools/zzfc/sub-gate.cjs`, stała nazwa | `[R1] PASS=2 FAIL=1` | łapie (rekurencja `listCjs` działa) |
| FC-M2 | **backtick bez interpolacji** w pliku ZE znacznikiem: `` path.join(os.tmpdir(), `combat-bundle-fcm2.cjs`) `` | `[R1] PASS=2 FAIL=1` | łapie |
| FC-M3 | `path.join(require("os").tmpdir(), '…')` — **podwójne cudzysłowy** | `[R1] PASS=2 FAIL=1` | łapie |
| FC-M4 | `path.join(os.tmpdir(), 'civ-fc-m4', FCM4)` — **segment ze zmiennej**, plik ZE znacznikiem | `PASS=3 FAIL=0` | **NIE łapie** |
| FC-M5 | `` `--outDir ${os.tmpdir()}/civ-fc-m5-dist` `` — **interpolacja w szablonie** | `PASS=3 FAIL=0` | **NIE łapie** |
| FC-M6 | `fs.writeFileSync("/tmp/civ-fc-m6-wynik.txt", …)` — dosłowna ścieżka w podwójnych cudzysłowach | `[R5] PASS=2 FAIL=1` | łapie |
| FC-M7 | **przywrócenie ORYGINALNEGO defektu**: `path.join(os.tmpdir(), outName)` w naprawionym `weterani-test.cjs:75` | `PASS=3 FAIL=0` | **NIE łapie — patrz FC-1** |
| FC-M8 | podmiana `combat-test.cjs` na wersję bazową `91877f11` (kopia, nie `git checkout`) | `[R1] PASS=2 FAIL=1` | łapie |

Sprawdziłem też sam trzy formy z zarzutu 2: M2 → `[R4] exit=1`, M6 → `[R1] exit=1`,
M7 → `[R4] exit=1`. Te są zamknięte.

## Werdykty per zarzut

| # | Zarzut | Werdykt | Uzasadnienie z wytworu (moje sprawdzenie) |
|---|---|---|---|
| 1 | Handler sygnałów połyka `SIGTERM`, bramka traci zabijalność, przerwany przebieg raportuje `exit=0` | **ODDAL** | Zarzut był trafny i **zreprodukowałem go niezależnie**: minimalny przypadek `execSync('sleep 8')` + `kill -TERM` po 2 s — **bez** handlera `exit=143`, **z** handlerem `SYNC DONE` i **`exit=0`**. Defekt w wytworze już NIE ISTNIEJE: `grep` po `tools/` daje **zero** `process.on('SIG…')`; sweep startowy jest w 57 plikach. Nie ma czego naprawiać |
| 2 | Bramka nie łapie konkatenacji ani wielosegmentowego `path.join` | **ODDAL** | Trzy nazwane formy sprawdziłem sam — wszystkie `exit=1` (R4/R1/R4). Reguła R4 i rozbicie segmentów są w `bramki-tmpdir-unikalnosc-test.cjs:188,205`. Resztkowa luka tej samej rodziny idzie jako moje własne znalezisko FC-1, nie jako ten zarzut |
| 3 | Klasa dosłownych `/tmp/…` poza audytem i poza bramką | **ODDAL** | Policzyłem na bazie sam: **13 plików** z dosłownym `/tmp/` i bez `os.tmpdir()`. Na HEAD **10 z nich zmienione**, 3 pozostałe są na jawnej whiteliście R5 — sprawdziłem każdy: `ev4-kryteria-check.cjs:21`, `wojny-kamien-ev-analiza.cjs:13`, `wojny-zelazo-analiza.cjs:12` to **wyłącznie WEJŚCIA do odczytu** (`process.env`/`argOf`/`argv[2]`), nie cele zapisu. R5 skanuje KAŻDY plik (`:145`) |
| 4 | Kryterium 7 niespełnione — ~22 bramki Chromium nieuruchomione | **ODDAL** | W wytworze kryterium jest zamknięte (27 bramek, tabela w obronie). Sprawdziłem punktowo: `ai-buduje-budynki` **42/42 dwa razy równolegle**, `miasta-panstwa-wylaczone-ui-render` **13/0 na HEAD = 13/0 na bazie**. Uwaga do raportu — nie do wytworu — w FC-3 |
| 5 | Eksperyment PRZED naruszał §2b (pisał do `/tmp/civ-ai-buduje-budynki` używanego przez `wt-garnizon`) | **ODDAL** | Zarzut trafny; obrona powtórzyła pomiar prywatną nazwą. Ja zrobiłem to samo (`civ-fc-przed-prywatny`) i **potwierdzam, że katalog `/tmp/civ-ai-buduje-budynki` NADAL istnieje i należy do cudzego, niezałatanego przebiegu** — dotknięcie go byłoby realną szkodą. Metoda z obrony jest jedyną poprawną |
| 6 | Narracja raportów ponad limit ~400 słów (§11) | **DO DECYZJI CZŁOWIEKA** | Policzyłem sam, bez tabel i bloków kodu: `01` **~912**, `02` **~873**, `03` **~1058** słów — zarzut prawdziwy i **nadal aktualny, także wobec raportu, który go postawił**. §11 sam ogranicza konsekwencję do `PASS-WITH-NOTES`, więc to nie jest `NAPRAW`. Rozstrzygnięcia wymaga jednak konflikt, którego wytwór nie zamyka: przepisanie `01` PO ocenie zaciera ślad, na którym pracował Final Control (§13b), a niezapisanie go łamie §11. To wybór priorytetu, nie faktu |
| 7 | Nowa bramka nigdzie niezarejestrowana — nikt jej nie uruchomi | **ODDAL** (jako zarzut wobec Operatora) | Sprawdziłem: bramka **nie występuje nigdzie** poza własnym plikiem; §6 `R-PROC-AUTOBOT.md` ma tylko 8 pozycji, bez niej. Ale `docs/decyzje/**` jest jawnie zakazane w allowliście, a §9 pkt 4 zabrania zmiany procesu w temacie produktowym — rejestracja **nie mogła** się tu wydarzyć. Zarzut obalony normą. **Przekazanie wiążące dla orkiestratora niżej** |

## Moje własne znaleziska

| # | Znalezisko | Werdykt |
|---|---|---|
| **FC-1** | **`gra/tools/bramki-tmpdir-unikalnosc-test.cjs:191` — `} else if (!fileHasUniqueMark) {` tłumi R3 na poziomie CAŁEGO PLIKU.** Po naprawie każdy z 57 plików ma znacznik unikalności, więc R3 jest w nich martwa. Wstawiłem z powrotem **dosłownie tę linię, którą tabela audytu klasyfikuje jako DEFEKT** (wiersz 41: `weterani-test.cjs`, `path.join(os.tmpdir(), outName)`, `outName` wołane wyłącznie stałymi literałami) — **bramka `PASS=3 FAIL=0`, `exit=0`**. Zabezpieczenie przed nawrotem nie widzi nawrotu w miejscu, z którego wzięło się zgłoszenie. **Poprawka i jej koszt zmierzone:** zamiana na `} else {` daje na tej mutacji `[R3] weterani-test.cjs:75 → exit=1`, a na czystym HEAD **`PASS=3 FAIL=0` — zero fałszywych alarmów**; tak samo zero na drzewie symulowanej integracji (`origin/main` + allowlista tematu, 819 `.cjs`) | **NAPRAW** |
| **FC-2** | Ta sama rodzina, druga forma: `` `${os.tmpdir()}/nazwa` `` (interpolacja w szablonie) jest niewidzialna dla R1–R5 (FC-M5 zielone). Dziś nie występuje w repo, ale to najzwyklejszy współczesny zapis tej ścieżki — dokładnie scenariusz „55. bramka za miesiąc". Do dołożenia w tej samej rundzie co FC-1, jedną regułą | **NAPRAW** |
| FC-3 | Wiersz parytetu w obronie dla `miasta-panstwa-wylaczone-ui-render` („obie wersje 11 pass / 1 fail") **nie odtwarza się**. Mój pomiar: przy `load ≈ 9` HEAD 11/1, baza 13/0; **w powtórce przy niskim obciążeniu, z odwróconą kolejnością — obie wersje `exit=0`, 13 pass / 0 fail**. Czerwień była artefaktem obciążenia, a nie stanem pre-istniejącym. Parytet zachowany (HEAD = baza), więc wytwór jest w porządku; nieścisły jest opis w raporcie. Ostrzeżenie dla orkiestratora: część werdyktów „pre-istniejąco czerwona" w tym temacie zapadła pod `load` 9–25 | obserwacja, bez naprawy |
| FC-4 | Domyślne nazwy katalogów raportowych dostały sufiks `-p<pid>` (`flaga-mp-*`, `wojny-kamien-ev/fc`). Sprawdziłem: **żaden plik w repo ich nie konsumuje** — pary producent/konsument mają i tak różne domyślne nazwy (`/tmp/ev-wojny-out` vs `/tmp/ev-out`), a wywołanie z jawnym `--out` jest nietknięte. Zostaje wyłącznie ryzyko cudzego nawyku poza repo, czego wytwór nie rozstrzyga | **DO DECYZJI CZŁOWIEKA** |
| FC-5 | Sweep startowy: zmierzyłem zasięg bez kasowania na żywym `/tmp` (9764 wpisy) — sygnaturze `-<pid>-<6 znaków>` odpowiada **6 wpisów, do skasowania kwalifikuje się 0** (wszystkie z żywym PID-em). Wzorzec jest wąski, `alive()` z `EPERM`→„żyje" myli się w stronę zachowawczą. Bez zastrzeżeń | obserwacja |
| FC-6 | Reszta niedeterminacji `ai-buduje-budynki-test` **nie znika i nie jest z tego tematu**: liczba długo trzymanych miast wariantu MUT-A to 2/9 (baza i mój przebieg PO-A) albo 1/8 (PO-B). **Znak żadnej z 42 asercji się nie zmienia.** Zmiana logiki pomiarowej jest jawnie zakazana w allowliście — kandydat na osobny temat | obserwacja |

## Bramki czerwone — mój własny pomiar parytetu

Podmieniałem plik na wersję z `91877f11` **kopią, nie `git checkout`**; drzewo czyste po każdej.

| bramka | HEAD | baza `91877f11` | przyczyna |
|---|---|---|---|
| `unit-power-test` | `exit=1` | `exit=1` | `FAIL: Hastati M_pole=50 (got 57.5)` — identycznie, pre-istniejące wprost w §6 |
| `audit-atak-obrona` | `exit=1` | `exit=1` | `TypeError: hitChanceMatrix is not a function` — identycznie |
| `legion-vs-falanga-compare` | `exit=1` | `exit=1` | `TypeError: … reading 'toLowerCase'` — identycznie |
| `tw-vs-stary-legion-falanga` | `exit=1` | `exit=1` | jw. — identycznie |
| `wpiecie-dispatch-check` | `exit=1` | `exit=1` | `Could not resolve …-entry.ts` — identycznie |
| `smoke` | `exit=1` | `exit=1` | `Bundle not found` — identycznie |
| `miasta-panstwa-wylaczone-ui-render` | `exit=0`, **13/0** | `exit=0`, **13/0** | zielona po obu stronach przy niskim obciążeniu (FC-3) |

## Przekazanie wiążące dla orkiestratora (nie dla Operatora)

1. **Rejestracja nowej bramki w §6** `R-PROC-AUTOBOT.md` — osobny temat `PROCESS`.
   Bez tego zabezpieczenie przed nawrotem istnieje, ale nikt go nie uruchomi (zarzut 7).
2. **Kolejność integracji.** `/tmp/civ-ai-buduje-budynki` (stała nazwa) **nadal istnieje
   i jest zapisywany przez niezałatane kopie w innych worktree**. GOAL jest w pełni
   osiągnięty dopiero, gdy ta gałąź wejdzie do `main`, a pozostałe worktree się przebazują.
3. Kandydaci na osobne tematy zgłoszone w obronie i przeze mnie potwierdzone:
   `mgla-odkrycie-wzdluz-sciezki-live-render-test.cjs` pisze zrzuty do **śledzonego w gicie**
   katalogu cudzego tematu; niedeterminacja MUT-A (FC-6).

## BLOKADY

Brak blokad technicznych. `FAIL` wynika wyłącznie z FC-1 + FC-2 — jedna poprawka w jednym
pliku, bez ruszania czegokolwiek innego.

## Agregat (§3c pkt 3, §16b pkt 8)

Dwa `NAPRAW` (FC-1, FC-2) → **`FAIL`**. Dwie pozycje `DO DECYZJI CZŁOWIEKA` (zarzut 6, FC-4)
zostają otwarte niezależnie od rundy 2. Zarzuty 1–5 i 7: `ODDAL`.

Nie integruję, nie deployuję, nie pushuję, nie wystawiam `READY_FOR_DEPLOY`.
