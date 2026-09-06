# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Evaluator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Evaluator — Opus 5, effort high (§1a / C-052)
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
ZMIANY/COMMIT: Evaluator nie zmienia kodu. Sprawdzany zakres: `91877f11..ff484136`
(baza dispatchu `fe57a068` jest przodkiem; `fe57a068..91877f11` to wyłącznie dwa pliki
dispatchu, więc dla `gra/` obie bazy dają ten sam diff). 60 plików, wszystkie w
`gra/tools/*.cjs`; poza allowlistą **zero** plików.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (lista zarzutów niepusta), potem Final Control
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdziłem sam (nie przepisane z raportu)

**Izolacja.** `git status --short` czysty przed i po każdej mojej mutacji; HEAD `ff484136`,
`91877f11` i `fe57a068` potwierdzone jako przodkowie. Uwaga: prompt wymagał HEAD
`91877f11`; to jest baza rundy, nie stan po pracy Operatora — pracę zastałem
zacommitowaną, więc kontynuowałem zamiast `BLOCK`.

**Punkt kontroli: czy osłabiono asercje — NIE.** Cały diff `gra/tools/` usuwa **79 linii**;
wypisałem je co do jednej i **każda** jest deklaracją ścieżki pod `os.tmpdir()`. Zero
usuniętych/zmienionych asercji, progów i logiki pomiarowej. Policzyłem asercje w
59 zmienionych plikach baza-vs-HEAD: **w żadnym pliku liczba nie spadła** (w każdym rośnie
o 1 — to `.test(ent)` z filtra keep w haku sprzątającym, nie asercja bramki).

**Punkt kontroli: własne mutacje (8, inne niż R1/R2/R3 Operatora), każda cofnięta,
`git diff --quiet` czyste po każdej.**

| # | mutacja | wynik | ocena |
|---|---|---|---|
| M1 | NOWY plik `zz-mut-nowa-bramka-test.cjs`, `path.join(os.tmpdir(), 'civ-…-dist')` | `PASS=2 FAIL=1` | łapie |
| M2 | `os.tmpdir() + '/civ-mut-konkatenacja-dist'` w załatanym `weterani-test.cjs` | `PASS=3 FAIL=0` | **NIE łapie** |
| M4b | `path.resolve(os.tmpdir(), 'civ-mut-resolve-dist')` w `combat-test.cjs` | `PASS=2 FAIL=1` | łapie |
| M5 | `const MUT_ROOT = os.tmpdir();` (R2) w `combat-test.cjs` | `PASS=2 FAIL=1` | łapie |
| M6 | `path.join(os.tmpdir(), 'civ-mut-seg', 'dist')` w `combat-test.cjs` | `PASS=3 FAIL=0` | **NIE łapie** |
| M7 | NOWA bramka z `os.tmpdir() + '/civ-zz-mut2-dist'` | `PASS=3 FAIL=0` | **NIE łapie** |
| M8 | NOWA bramka, `path.join(os.tmpdir(), OUT_NAME)` | `PASS=2 FAIL=1` | łapie |

**Mocniejszy dowód nietautologiczności niż mutacja syntetyczna:** wypakowałem `gra/tools`
z `91877f11` do scratcha, wstawiłem tam nową bramkę i uruchomiłem — **`FAIL`, 79 trafień
w dokładnie 59 plikach**, tj. w tych samych, które Operator naprawił, co do pliku.
Na HEAD ta sama bramka: `PASS=3 FAIL=0`. Trzy pliki niezgłoszone (`ai4-mutacje`,
`wiarygodnosc-test`, `miasta-panstwa-wylaczone-test`) sprawdziłem ręcznie — realnie
bezpieczne (`mkdtempSync` / `process.pid`).

**Pula.** `grep -rl "os.tmpdir()" gra/tools/*.cjs` na bazie = **54**, zgodnie z dispatchem;
`git grep` z pathspec (łapiącym kropkowe) = 59. Ślepa plamka rekonesansu potwierdzona.

## TESTY (moje przebiegi)

| bramka / kryterium | wynik |
|---|---|
| `tsc --noEmit` (kryt. 5) | **0 błędów**, 24 s |
| `logic-test` / `tech-tree` / `research` / `unit-replace` / `combat` (kryt. 6) | **213/213 · 19/19 · 33/33 · 13/13 · 6/6** |
| `bramki-tmpdir-unikalnosc-test` (kryt. 4) | **3/3**, 63 plików z tmpdir z 824 `.cjs` |
| 15 naprawionych bramek pojedynczo (kryt. 7, próbka) | wszystkie `exit=0`; `hud-obywatele-chip` 20/20, `weterani` 79/79, `fortify-pole` 41/41, `walka-morale` 123/123 |
| `mgla-sciezka-inwariant-test` (bramka odniesienia, nietknięta) | 42/42 |
| „tryb trzeci" — sprzątanie | `comm -13` na listingu `/tmp` przed/po 15 bramkach → **zero nowych pozostałości** |
| 6 bramek czerwonych — czy pre-istniejące | podmieniłem każdą na wersję z `91877f11` i uruchomiłem: **identyczna przyczyna i `exit=1` w obu wersjach**, wszystkie sześć |
| kryt. 3, część PO (2× równolegle na HEAD) | POMIAR W TOKU — uzupełniony osobnym commitem |

**Czego nie odtworzyłem i dlaczego:** części PRZED kryterium 3 nie powtarzam. Kod bazowy
pisze do współdzielonego `/tmp/civ-ai-buduje-budynki`, a `wt-garnizon` używa tego katalogu
teraz (potwierdziłem: katalog istnieje na dysku). Powtórzenie eksperymentu zepsułoby cudzy
przebieg — §2b. Mechanizm potwierdzam odczytem: `TMP_ROOT` → `root-<wariant>`
(`rmSync` lustra) i `dist-<wariant>` (`--emptyOutDir`), `ai-buduje-budynki-test.cjs:203,218`.

## ZARZUTY

**1. Blok sygnałów połyka `SIGTERM` i odbiera bramkom zabijalność — a raport twierdzi
coś przeciwnego.** `gra/tools/ai-buduje-budynki-test.cjs:107-109` i **57 plików** z tym
samym blokiem, z czego **24 używają `execSync`/`spawnSync`**. Zmierzyłem na minimalnej
reprodukcji tego samego wzorca: `kill -TERM` na PID node'a w trakcie `execSync` **przed**
zmianą → natychmiastowa śmierć, `exit=143`; **po** zmianie → sygnał zjedzony w całości,
proces dobiega do końca i kończy się **`exit=0`**. Raport (sekcja „czwarty defekt")
podaje dla tego przypadku `exit=143` — to jest nieprawda mierzalna w 20 sekund.
Znaczenie dla GOAL: udokumentowanym wyjściem z incydentu z dispatchu było „po ubiciu obu
i przebiegu pojedynczym"; ta zmiana odbiera to wyjście dla fazy buildu. Dodatkowo
przerwany przebieg raportuje teraz `0` zamiast `143`, czyli **fałszywy zielony** —
dokładnie klasa błędu, którą temat likwiduje. Poprawka: nie rejestrować handlera na
`SIGTERM` albo w handlerze wołać `process.kill(process.pid, sig)` po odpięciu się
(`process.removeAllListeners(sig)`), żeby zachować domyślny kod wyjścia.

**2. Nowa bramka nie łapie konkatenacji ani wielosegmentowego `path.join` — czyli
przepuszcza scenariusz, dla którego powstała.** `gra/tools/bramki-tmpdir-unikalnosc-test.cjs:110`
(dopasowanie tylko do `path.join|resolve(<tmpdir>`) i `:125` (`isLiteral` wymaga, by CAŁY
argument był jednym literałem). Moje M7: **nowa** bramka pisząca do
`os.tmpdir() + '/civ-zz-mut2-dist'` przechodzi na zielono. Moje M6:
`path.join(os.tmpdir(), 'civ-mut-seg', 'dist')` — zielono. GOAL pkt 3 mówi wprost
„55. bramka napisana za miesiąc"; autor, który napisze `+ '/nazwa'` zamiast drugiego
argumentu `path.join`, nie zostanie zatrzymany. Poprawka: reguła R4 na
`<tmpdir>\s*\+\s*['"\`]` oraz zdjęcie warunku „cały ARG jest literałem" na rzecz
„ARG nie zawiera znacznika unikalności".

**3. Cała klasa bramek z dosłownym `/tmp/…` została poza audytem, poza naprawą i poza
nową bramką.** `gra/tools/miasta-panstwa-wylaczone-ui-render-test.cjs:19` —
`const OUT_DIR = '/tmp/civ-dist-miasta-panstwa-wylaczone';`, a `:33` buduje do niego
z `--emptyOutDir`. To jest co do znaku ta sama klasa, którą tabela Operatora oznacza
„WYSOKIE (--emptyOutDir czyści cudzy katalog)". Katalog **istnieje teraz na dysku**.
Ta sama sytuacja: `ev-zelazo-pomiar.cjs:26,47`, `wojny-kamien-audyt.cjs:26,45`,
`wojny-zelazo-audyt.cjs:30,50` — 13 plików w `gra/tools/` ma stałe `/tmp/…` i w ogóle
nie używa `os.tmpdir()`. Osobno: `perf-long-session-live-test.cjs:253` to plik, który
Operator **naprawił**, a mimo to nadal pisze do stałego
`/tmp/perf-long-session-stuck-${i}.png`. Żaden z tych plików nie ma wiersza w tabeli
62 pozycji. GOAL mówi „żadna bramka", nie „żadna bramka używająca `os.tmpdir()`".

**4. Kryterium 7 niespełnione: ~22 bramki Chromium nigdy nie uruchomiono pojedynczo.**
Rodziny `zelazo-*`, `*-real-render-*`, `*-live-*` — dispatch żąda „Każda naprawiona
bramka uruchomiona POJEDYNCZO i zielona. Podaj wynik per plik." Operator zgłasza to
jawnie w BLOKADACH i nie udaje, że zrobił — to jest uczciwe, ale kryterium binarne
pozostaje niespełnione. Waga realna: to właśnie te pliki dostały największą zmianę
(build do `dist` + zrzuty), więc `node --check` nie wystarcza.

**5. Eksperyment PRZED z kryterium 3 sam naruszał §2b.** Raport, sekcja „Kryterium 3":
dwa równoległe przebiegi na kodzie `91877f11` do współdzielonego
`/tmp/civ-ai-buduje-budynki` — w tym samym czasie, w którym Operator sam zaobserwował
i zapisał, że `wt-garnizon` używa tego katalogu. Dowód był potrzebny, ale dało się go
zdobyć bezpiecznie (kopia bazy z podmienioną nazwą stałej na prywatną). Odnotowuję,
bo temat jest dokładnie o tym, że dwa przebiegi w jednej przestrzeni nazw psują sobie wynik.

**6. Narracja raportu ~874 słów przy limicie ~400 (§11).** Policzone po odjęciu wierszy
tabel i bloków kodu — 2,2×. §11 kwalifikuje to jako `PASS-WITH-NOTES`, nie `FAIL`,
ale „wraca do skrócenia".

**7. Nowa bramka nie jest nigdzie zarejestrowana — nikt jej nie uruchomi.** Jedyny
rejestr bramek to `docs/decyzje/R-PROC-AUTOBOT.md` §6 (tam siedzi analogiczna
`mgla-sciezka-inwariant-test.cjs`), a `docs/decyzje/**` jest **zakazane** w allowliście
tego tematu; w `gra/package.json` nie ma runnera bramek. To **nie jest przewinienie
Operatora** — §9 pkt 4 zabrania mu tego wprost. Zgłaszam jako przekazanie dla
orkiestratora: bez wpisu do §6 zabezpieczenie przed nawrotem nie działa, a wpis wymaga
osobnego tematu w domenie `PROCESS`.

## BLOKADY

- Kryterium 3 część PRZED — świadomie nieodtworzone (zarzut 5, §2b). Część PO zmierzona.
- Kryterium 7 — nie uruchomiłem ~22 bramek Chromium z tego samego powodu co Operator
  (koszt: `vite build` + realny Chromium na plik, `load average` 8–10 z równoległych fal).
