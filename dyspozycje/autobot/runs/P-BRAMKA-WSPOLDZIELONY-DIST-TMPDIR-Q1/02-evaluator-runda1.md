# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Evaluator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Evaluator — Opus 5, effort high (§1a / C-052)
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
ZMIANY/COMMIT: Evaluator nie zmienia kodu. Zakres sprawdzany: `91877f11..ff484136`
(baza dispatchu `fe57a068` jest przodkiem; `fe57a068..91877f11` to tylko pliki dispatchu,
więc dla `gra/` obie bazy dają ten sam diff). 60 plików, wszystkie w `gra/tools/*.cjs`
plus katalog runu; **poza allowlistą zero plików**. Raport: commity `0da022df`, `422788cd`.
TESTY: tabela niżej — wszystkie uruchomione przeze mnie.
BLOKADY: kryt. 3 część PRZED świadomie nieodtworzona (zarzut 5); ~22 bramek Chromium
nieuruchomionych (zarzut 4, `load average` 8–10 z równoległych fal).
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (lista zarzutów niepusta), potem Final Control
DEPLOY/PUSH: NIE WYKONANO

## Punkt kontroli 1 — czy osłabiono asercje: NIE

Diff `gra/tools/` usuwa **79 linii**; wypisałem je co do jednej — **każda** jest deklaracją
ścieżki pod `os.tmpdir()`. Zero usuniętych i zero zmienionych asercji, progów, logiki
pomiarowej. Policzyłem asercje w 59 zmienionych plikach baza-vs-HEAD: **w żadnym liczba
nie spadła** (w każdym rośnie o 1 — to `.test(ent)` z filtra keep w haku sprzątającym).

## Punkt kontroli 2 — 8 własnych mutacji, inne niż R1/R2/R3 Operatora

Każda cofnięta, `git diff --quiet` czyste po każdej; drzewo czyste też po całości.

| # | mutacja | wynik bramki | ocena |
|---|---|---|---|
| M1 | NOWY plik, `path.join(os.tmpdir(), 'civ-…-dist')` | `PASS=2 FAIL=1` | łapie |
| M2 | `os.tmpdir() + '/civ-mut-konkatenacja-dist'` w załatanym `weterani-test.cjs` | `PASS=3 FAIL=0` | **NIE łapie** |
| M4b | `path.resolve(os.tmpdir(), 'civ-mut-resolve-dist')` w `combat-test.cjs` | `PASS=2 FAIL=1` | łapie |
| M5 | `const MUT_ROOT = os.tmpdir();` w `combat-test.cjs` | `PASS=2 FAIL=1` | łapie |
| M6 | `path.join(os.tmpdir(), 'civ-mut-seg', 'dist')` w `combat-test.cjs` | `PASS=3 FAIL=0` | **NIE łapie** |
| M7 | NOWA bramka z `os.tmpdir() + '/civ-zz-mut2-dist'` | `PASS=3 FAIL=0` | **NIE łapie** |
| M8 | NOWA bramka, `path.join(os.tmpdir(), OUT_NAME)` | `PASS=2 FAIL=1` | łapie |

Mocniejszy dowód nietautologiczności niż mutacja syntetyczna: wypakowałem `gra/tools`
z `91877f11` do scratcha, wstawiłem tam nową bramkę i uruchomiłem — **`FAIL`, 79 trafień
w dokładnie 59 plikach**, tych samych, które Operator naprawił, co do pliku. Na HEAD:
`PASS=3 FAIL=0`. Trzy pliki niezgłoszone (`ai4-mutacje`, `wiarygodnosc-test`,
`miasta-panstwa-wylaczone-test`) sprawdziłem ręcznie — realnie bezpieczne.
Pula z komendy dispatchu na bazie = **54**, zgodnie z dispatchem; ślepa plamka
rekonesansu (kropkowe `.smoke-*`, `require('os')`) potwierdzona.

## TESTY — moje przebiegi

| bramka / kryterium | wynik |
|---|---|
| `tsc --noEmit` (kryt. 5) | **0 błędów**, 24 s |
| `logic` / `tech-tree` / `research` / `unit-replace` / `combat` (kryt. 6) | **213/213 · 19/19 · 33/33 · 13/13 · 6/6** |
| `bramki-tmpdir-unikalnosc-test` (kryt. 4) | **3/3**; 63 plików z tmpdir z 824 `.cjs` |
| kryt. 3, część PO: 2× równolegle na HEAD | **`A=0 B=0`, `PASS=42 FAIL=0` w obu**; katalogi `…-9801-84b7zj` i `…-9803-fa6pdy`, oba sprzątnięte; zero błędów katalogowych; **wszystkie 261 linii logu identyczne** po znormalizowaniu run-id |
| 15 naprawionych bramek pojedynczo (kryt. 7, próbka) | wszystkie `exit=0`; m.in. `weterani` 79/79, `fortify-pole` 41/41, `hud-obywatele-chip` 20/20 |
| `mgla-sciezka-inwariant-test` (odniesienie, nietknięty) | 42/42 |
| „tryb trzeci" — sprzątanie | `comm -13` na listingu `/tmp` przed/po 15 bramkach → **zero nowych pozostałości** |
| 6 bramek czerwonych — czy pre-istniejące | podmieniłem każdą na wersję z `91877f11`: **identyczna przyczyna i `exit=1` w obu wersjach**, wszystkie sześć |

Kryterium 3 PO wypada u mnie **lepiej niż w raporcie**: Operator zgłaszał 81 różniących się
linii w zrzucie MUT-B (`p=277` vs `p=278`) — u mnie logi są identyczne, ta niedeterminacja
się nie odtworzyła.

## ZARZUTY

**1. Blok sygnałów połyka `SIGTERM` i odbiera bramkom zabijalność; raport twierdzi
odwrotnie.** `gra/tools/ai-buduje-budynki-test.cjs:107-109` — ten sam blok w **57 plikach**,
z czego **24 używają `execSync`/`spawnSync`**. Zmierzone dwa razy. (a) Minimalna
reprodukcja wzorca: `kill -TERM` na PID node'a w trakcie `execSync` **przed** zmianą →
natychmiastowa śmierć, `exit=143`; **po** zmianie → sygnał zjedzony, proces dobiega końca,
**`exit=0`**. (b) Na prawdziwej bramce: `SIGTERM` na PID node'a `ai-buduje-budynki-test.cjs`
w fazie `vite build (fix)` — po 12 s ŻYJE, po 30 s ŻYJE i przeszedł do `vite build (mut-a)`.
Raport (sekcja „czwarty defekt") podaje dla tego przypadku `exit=143`. Znaczenie dla GOAL:
udokumentowanym wyjściem z incydentu z dispatchu było „po ubiciu obu i przebiegu
pojedynczym" — ta zmiana odbiera to wyjście dla fazy buildu, a przerwany przebieg raportuje
`0` zamiast `143`, czyli **fałszywy zielony**: klasa błędu, którą temat likwiduje.
Poprawka: nie rejestrować handlera na `SIGTERM`, albo w handlerze
`process.removeAllListeners(sig); process.kill(process.pid, sig);` — sprzątanie zostaje,
domyślny kod wyjścia wraca.

**2. Nowa bramka nie łapie konkatenacji ani wielosegmentowego `path.join`.**
`gra/tools/bramki-tmpdir-unikalnosc-test.cjs:110` (dopasowanie wyłącznie do
`path.join|resolve(<tmpdir>`) i `:125` (`isLiteral` wymaga, by CAŁY argument był jednym
literałem). M7: **nowa** bramka z `os.tmpdir() + '/civ-zz-mut2-dist'` przechodzi na zielono.
M6: `path.join(os.tmpdir(), 'civ-mut-seg', 'dist')` — zielono. GOAL pkt 3 mówi wprost
o „55. bramce napisanej za miesiąc"; autor piszący `+ '/nazwa'` nie zostanie zatrzymany.
Poprawka: reguła R4 na `<tmpdir>\s*\+\s*['"` + backtick + `]`, oraz zamiana warunku „cały ARG
jest literałem" na „ARG nie zawiera znacznika unikalności".

**3. Klasa bramek z dosłownym `/tmp/…` poza audytem, poza naprawą i poza nową bramką.**
`gra/tools/miasta-panstwa-wylaczone-ui-render-test.cjs:19` —
`const OUT_DIR = '/tmp/civ-dist-miasta-panstwa-wylaczone';`, a `:33` buduje do niego
z `--emptyOutDir`. To co do znaku ta sama klasa, którą tabela Operatora oznacza
„WYSOKIE (--emptyOutDir czyści cudzy katalog)"; katalog istnieje teraz na dysku. Tak samo
`ev-zelazo-pomiar.cjs:26,47`, `wojny-kamien-audyt.cjs:26,45`, `wojny-zelazo-audyt.cjs:30,50`
— **13 plików** w `gra/tools/` ma stałe `/tmp/…` i w ogóle nie używa `os.tmpdir()`.
Osobno: `perf-long-session-live-test.cjs:253` to plik, który Operator **naprawił**,
a mimo to nadal pisze do stałego `/tmp/perf-long-session-stuck-${i}.png`. Żaden z nich
nie ma wiersza w tabeli 62 pozycji. GOAL mówi „żadna bramka", nie „żadna bramka
używająca `os.tmpdir()`".

**4. Kryterium 7 niespełnione: ~22 bramki Chromium nigdy nie uruchomione pojedynczo**
(`zelazo-*`, `*-real-render-*`, `*-live-*`). Dispatch: „Każda naprawiona bramka uruchomiona
POJEDYNCZO i zielona. Podaj wynik per plik." Operator zgłasza to jawnie i nie udaje —
ale kryterium jest binarne. To właśnie te pliki dostały największą zmianę (build `dist`
+ zrzuty), więc `node --check` nie zastępuje przebiegu.

**5. Eksperyment PRZED z kryterium 3 sam naruszał §2b.** Raport, sekcja „Kryterium 3":
dwa równoległe przebiegi kodu `91877f11` do współdzielonego `/tmp/civ-ai-buduje-budynki`
— w czasie, w którym Operator sam zapisał, że `wt-garnizon` używa tego katalogu. Dowód
był potrzebny, ale dało się go zdobyć bezpiecznie (kopia bazy z prywatną nazwą stałej).
Z tego samego powodu ja tej części nie odtwarzam; mechanizm potwierdzam odczytem —
`ai-buduje-budynki-test.cjs:203` (`rmSync` lustra) i `:218` (`--emptyOutDir`), oba pod
wspólnym `TMP_ROOT`.

**6. Narracja raportu ~874 słów przy limicie ~400 (§11)** — 2,2×, policzone po odjęciu
tabel i bloków kodu. §11 kwalifikuje to jako `PASS-WITH-NOTES`, nie `FAIL`, ale „wraca
do skrócenia". (Ten raport liczy ~700 słów narracji — też nad limitem; zapisuję to
o sobie, nie tylko o Operatorze.)

**7. Nowa bramka nie jest nigdzie zarejestrowana — nikt jej nie uruchomi.** Jedyny rejestr
bramek to `docs/decyzje/R-PROC-AUTOBOT.md` §6 (tam siedzi analogiczna
`mgla-sciezka-inwariant-test.cjs`); `docs/decyzje/**` jest **zakazane** w allowliście tego
tematu, a `gra/package.json` nie ma runnera bramek. To **nie jest przewinienie Operatora**
— §9 pkt 4 zabrania mu tego wprost. Zgłaszam jako przekazanie dla orkiestratora: bez wpisu
do §6 zabezpieczenie przed nawrotem nie działa, a wpis wymaga osobnego tematu `PROCESS`.
