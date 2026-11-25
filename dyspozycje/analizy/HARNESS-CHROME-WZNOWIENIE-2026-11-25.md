# Harness: Chromium pada (SIGSEGV) przy wznowieniu ze slotu — R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1

Data: 2026-11-25. Baza: origin/main `79bdf0dfda5eec4f1d4e16370239cbe09c5a210a`. Wynik: łagodzenie w runnerze, przyczyna NIE ZMIERZONO.

## Odtworzenie

- Bundle zbudowany poza repo: `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist --emptyOutDir` (exit 0, 32 s).
- Runner: `gra/tools/diplomacy-harder-measure-run.cjs --seed 4242 --every 1`, odcinek 1: `--stop-at 2` (fresh, slot `dipl-measure-seed4242-harder0`, exit 0, 121 s). Odcinek 2 (wznowienie ze slotu, tura 2 → 4) pada w 4 z 5 prób przed pierwszą turą.
- Miejsce padnięcia: `openGame` (stack Playwright wskazuje `diplomacy-harder-measure-run.cjs:173`, czyli wait na gotowość gry `awaitingFirstCity`, przed `loadSlot`/pierwszą turą). Komunikat: `page.waitForFunction: Target page, context or browser has been closed`. Chromium stderr: `Received signal 11 SEGV_MAPERR 000000000571` (i `…0001`, `…0000`), GPF w `chrome+0x…`, bez symboli.
- Zapis slotu (IndexedDB): wpisy blob ~240–265 KB (`IndexedDB/file__0.indexeddb.blob`), rozmiar nie jest przyczyną (izolowany test zapisu/odczytu 260 KB przez restart przeglądarki: OK).

## Próby (wszystkie na tym samym profilu i slocie, ten sam bundle)

| Próba | Odcinek | Flagi Chromium (oprócz domyślnych) | Wynik |
|---|---|---|---|
| 1 | 2→4 | brak | SIGSEGV, przed turą 3 |
| 2 | 2→4 | `--disable-gpu --mute-audio` (MEASURE_CHROME_ARGS) | SIGSEGV (SEGV_MAPERR 0x…1) |
| 3 | 2→4 | brak, z próbkowaniem RSS (preload `-r`) | OK (tura 3, 4; exit 0) |
| 4 | 4→6 | brak | SIGSEGV |
| 5 | 4→6 | `--js-flags=--max-old-space-size=4096 --disable-gpu` | SIGSEGV |
| 6 | 4→6 | brak, runner z retry (kod końcowy) | OK, pierwsza próba |
| 7 | 6→8 | brak, runner z retry | OK, pierwsza próba |
| 8 | 8→10 | brak, runner z retry | OK, pierwsza próba |

Przed poprawką: 4 z 5 prób pada. Po poprawce: 3 z 3 prób przechodzą za pierwszym razem (trzy kolejne próby, kryterium „3 kolejne”). Próba statystycznie słaba (n=3); różnica nie wynika z mechanizmu, bo poprawka nie zmienia kroku przed pierwszą próbą.

## Hipotezy sprawdzone

- **OOM kontenera**: odrzucona. Maszyna: 16 GB RAM, brak swapu; podczas prób `MemAvailable` 13,6–15,1 GB (próbkowanie z pliku `mem-seg2.log`). `dmesg` nie sprawdzono (brak dostępu/NIE ZMIERZONO).
- **/dev/shm**: odrzucona jako przyczyna. `/dev/shm` = tmpfs 16 GB, wolne 16 GB; runner i tak ma `--disable-dev-shm-usage`.
- **GPU**: nie usuwa błędu (próba 2). **Limit sterty V8** (`--max-old-space-size=4096`, próba 5): nie usuwa błędu.
- **Generyczny błąd IndexedDB po restarcie przeglądarki**: odrzucona. Zapis i odczyt 260 KB wartości przez restart kontekstu w osobnym profilu: OK.
- **Bezczynność menu gry po wejściu na stronę z profilem zapisu** (150 s, kopia profilu): bez padnięcia; `awaitingFirstCity` true po ~5 s.
- **Ten sam ciąg kroków co openGame + loadSlot** w osobnym skrypcie (`load.cjs`, kopia profilu): OK, `loadSlot` zwraca tura=4, 90 s bez padnięcia. Padnięcie NIE odtworzyło się w izolacji, więc przyczyna leży w kontekście runnera (kolejność, stan procesu/profilu) lub jest niedeterministyczna.
- **Deterministyczny bug gry**: nie stwierdzono. Padnięcie jest w Chromium (SEGV na poziomie procesu), a wznowienie daje ten sam stan co bieg ciągły (poniżej).

NIE ZMIERZONO: dokładny mechanizm (brak symboli Chromium; brak dmesg; brak powtarzalnego odtworzenia poza runnerem).

## Łagodzenie w runnerze (commit tej rundy)

`gra/tools/diplomacy-harder-measure-run.cjs`: nowa funkcja `openGameRetry(chromium, fresh)`. Przy wznowieniu (`fresh=false`) i padnięciu przed pierwszą turą (komunikat `has been closed`/`crash`) zamyka kontekst i ponawia CAŁY start (nowy kontekst + openGame ze slotu), max 3 próby. Przy świeżym przebiegu: jedna próba, bez zmian. Brak zapisu w tym czasie (jsonl obcinany raz, liczniki nietknięte), więc powtórka jest bezpieczna. Retry nie został wywołany w próbach 6–8 (pierwsza próba wystarczyła), ścieżka retry nie jest przetestowana na żywo.

## Równoważność: bieg w dwóch odcinkach vs ciągły

- Ciągły: `--turns 6 --every 1` (bez `--stop-at`), katalog `contB`.
- Odcinkowy: 1→2 (`--stop-at 2`), 2→4 (`--stop-at 4`, z crashami), 4→6 (`--stop-at 6`), ten sam slot.
- Porównanie wierszy jsonl tur 2–6 (pole `sec` usunięte, kanonicznie `sort_keys`): **identyczne**, sha256(skrócony) `05b993d3c88c1c64` dla obu.
- Tury 7–10 zrobiono tylko odcinkowo (brak ciągłego biegu do 10); nie porównywano.

## Bramki (liczby z surowego wyjścia)

- `npx tsc --noEmit` → exit 0.
- `node tools/logic-test.cjs` → 213 PASS, 0 FAIL.
- `node tools/ai-test.cjs` → `ai-test: 297 passed, 0 failed`.
- `node tools/diplomacy-measure-resume-test.cjs` (pin) → 8 zielonych, 0 czerwonych; C1–C4 NIE ZMIERZONO (brak `--a/--b`, brak `--run 1`).

## Dalsze kroki (dla orkiestratora)

- Rozważyć zgłoszenie do właściciela jako problem środowiska Chromium 153 (for Testing) w tym kontenerze; mechanizm nieustalony.
- Pomiary z wznowieniem (#72, pomiar pod #96) mogą iść odcinkowo z retry; przed dużym biegiem zalecane sprawdzenie stdout pod kątem `proba … przerwana`.
- Retry obejmuje tylko `has been closed`/`crash`; inne błędy startu nadal przerywają bieg.
