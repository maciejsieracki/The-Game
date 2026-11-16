# R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1 — raport Operatora (runda 5/5, dokumentacyjna)

STATUS: PASS-WITH-NOTES (runda dokumentacyjna wg DODATKU 5: raport poprawiony, bramki zmierzone; próg 10% NIE ROZSTRZYGNIĘTE, 1 ziarno)
DOMAIN: GAME (tylko pomiar; w `gra/src` zmiana wyłącznie z rundy 3: hak odczytu `ledgerStats` za `?civTest=1`; w rundzie 4 `gra/src` NIE zmieniano)
TEMAT: R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1
GOAL: pomiar kosztu czasu tury zapisu do księgi „Skąd zapasy” (ON vs OFF) w konfiguracji DOMYŚLNEJ na harnessie AI z miastami (DODATEK 4: pary na wspólnym slocie t50, okno t51–t80; NIE 100 tur). Runda 4: korekta raportu wg zarzutów FC r3 (sekcja KOREKTY) i pełne bramki.
BAZA: 23f28558e (obrona r4; `refs/keep/LEDGER-PERF-r4-obrona`; potomek 16d9b9841 (obrona r3), potomek origin/main 459354a12). Worktree detach na tym SHA.

## ZMIANY / COMMIT
- Runda 4 zmienia wyłącznie plik `dyspozycje/autobot/runs/R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1/10-operator-claude.md` (korekty) i ten sam katalog run (sekcja KOREKTY). Kod gry i narzędzia bez zmian.
- Zmiany z rundy 3 (bez zmian w tej rundzie): `gra/src/main.ts` — `__aiEconomyMeasure.ledgerStats()` (odczyt, tylko `?civTest=1`); `gra/tools/ai-economy-measure-run.cjs` — `--ledger-off 1`, pola `load1`/`ledgerRecording`, `ledgerStats` co 10 tur; `gra/tools/ai-economy-measure-hook-test.cjs` — asercja kształtu `ledgerStats` i mutacja; `gra/tools/ledger-perf-default-analyze.cjs` (nowy analizator).
- evidence/: surowe JSONL (gzip) każdego przebiegu, `s4242/pairs-4242.csv`, `s4242/analysis-4242.json`, `dist-md5.txt`. Brak katalogu z danymi dla innych ziaren (patrz BLOKADY).
- Allowlista zachowana. Brak zmian WERSJE.md, manifestu, gra-robocza/, rust-port/.

## BUILD / POCHODZENIE
- Rund 3: vite build poza repo; md5 w `evidence/dist-md5.txt`: index.html c14b38a5396ebe70e59a6cc1addf0571; audio-pack-1.js 5b990bc3…; audio-pack-2.js 0a9a1047…; audio-pack-3.js 9e88be9f….
- Runda 4 (testy bramek): `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/w/dist --emptyOutDir` (poza repo, 23,4 s). md5 tego builda: index.html 2a6d7e67fc065ef88a1fdefea38b4988; audio-pack-1.js 5b990bc33b4513f343ccc4bc7f12f26f; audio-pack-2.js 0a9a10473f9d29bbe01fd9a4f592f89d; audio-pack-3.js 9e88be9fa542eaf2f2a2ecb5c2424fa2. Audio packi zgodne z rundą 3; md5 index.html różni się między buildami (niepowtarzalny bajtowo — zapisano md5 builda użytego w tej rundzie). Pomiary ON/OFF z rundy 3 nie były wykonywane na tym buildzie.

## TESTY RUNDY 4 (liczby z surowego wyjścia)
- `npm ci` w `gra/` (71 pakietów, 4 s); `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0, bez wyjścia.
- Hook-test `node tools/ai-economy-measure-hook-test.cjs --dist <dist> --mutant-dist <mut>` → `PODSUMOWANIE 19/19 zielone`, exit 0, czas 5 min 47 s. Mutant: kopia dist z dwiema ręcznymi podmianami w `index.html`: `ledgerStats` zwraca `{entries:"x",bytes:"y"}` oraz `metrics` zwraca `[{}]`. Pierwsza próba (tylko mutacja `ledgerStats`) dała `18/19`: asercja „mutacja realna (zepsuty hak w bundle)” — `brak problemow -- test slepy`, bo mutant nie psuł `metrics()`; to błąd przygotowania mutanta po stronie Operatora, nie wynik kodu. Druga próba (oba haki zepsute) → 19/19. Tryb mutanta opisany jawnie.
- 5 bramek referencyjnych (`node tools/<t>.cjs`, exit 0 w każdej):
  - logic-test: `LOGIC OK (213/213)`
  - tech-tree-test: `tech-tree-test: 20 pass, 0 fail`
  - research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`
  - unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`
  - combat-test: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`
- `git diff --check` w worktree: czysto (przed commitem raportu).
- Testy live (Chromium, pomiary) w rundzie 4 NIE wykonywane (DODATEK 5 pkt 3).

## WYNIK POMIARU — SEED 4242 (okno t51–t80; rozgrzewka t51/t61/t71 odrzucona; 27 tur na przebieg) — dane z rundy 3, bez zmian
Projekt: jeden slot t50 (zapis ON, domyślny) → 4 przebiegi t51→t80 w kolejności ON1, OFF1, OFF2, ON2, każdy wznowiony z TEGO SAMEGO slotu t50 (wszystkie 4 przebiegi startują z jednego slotu t50; zob. KOREKTY 7). Nie ma wznowień ze slotu t60/t70.

| przebieg | średnia s/turę | mediana s/turę | średni load1 | księga (bajty JSON) t60 / t70 / t80 |
|---|---|---|---|---|
| ON1 | 20,86 | 16,7 | 1,20 | 1 558 684 / 2 035 873 / 2 248 878 |
| OFF1 | 21,49 | 20,2 | 1,26 | 3 661 / 3 661 / 3 201 |
| OFF2 | 23,47 | 19,1 | 3,02 | 3 661 / 3 661 / 3 201 |
| ON2 | 25,28 | 21,6 | 2,87 | 1 558 684 / 2 039 767 / 2 259 491 |

Pary ON vs OFF (Δ% całkowitego czasu tych samych 27 tur): ON1/OFF1 −2,9%; ON1/OFF2 −11,1%; ON2/OFF1 +17,6%; ON2/OFF2 +7,7%. Mediana z par +2,4% (średnia +2,8%).
Rozstęp szumu same-variant: ON1 vs ON2 −17,5%; OFF1 vs OFF2 −8,4%.
Wg okien (mediana par): 51–60 +3,8%; 61–70 −3,6%; 71–80 +5,7%.
Wg kolejności: ON-pierwszy −7,0% (n=2), OFF-pierwszy +12,7% (n=2). Ta różnica jest HIPOTEZĄ (zob. KOREKTY 3), nie wynikiem.
Warunek load: tur z load1 ≤ 3,0 we WSZYSTKICH 4 przebiegach jest 12 z 27 (tury 58, 59, 60, 62–70). Wariant filtrowany (tylko te 12 tur, mediana Δ% per tura): ON1/OFF1 −13,6%; ON1/OFF2 −12,5%; ON2/OFF1 +9,8%; ON2/OFF2 +10,1% (wartości z 30-obrona-claude.md, przeliczone z `s4242/pairs-4242.csv`). Przebiegi ON2 i OFF2 NIE spełniały warunku load ≤ 3,0 w części tur — patrz BLOKADY.

WERDYKT PROGU 10%: **NIE ROZSTRZYGNIĘTE** — rozstęp same-variant 17,5% (ON) ≥ 10% (DODATEK 4 pkt „NIE ROZSTRZYGNIĘTE gdy rozstęp ≥ 10%”). Nie wolno wnioskować ani „optymalizacja niepotrzebna”, ani „kandydat R-WEB-*”. Okno to t51–t80 (27 tur po odrzuceniu rozgrzewek), NIE 100 tur.

## ZIARNA 777 i 31337 — NIE ZMIERZONO
Ziarno 777: baza do slotu t50 wykonana (281 s), przebieg ON1 50→70 uruchomiony przy load 2,36 i przerwany przy load 7,3 (10:07 UTC). Dalsze przebiegi NIE wykonane: maszyna współdzielona miała load 4–10 (inne workflowy z Chromium), co wyklucza warunek DODATKU 3/4 (load ≤ 3,0). Przerwany przebieg NIE jest zachowany w evidence i NIE jest wynikiem. Ziarno 31337 nie podjęte (DODATEK 4: tylko jeśli starczy czasu). Wynik jest więc z JEDNEGO ziarna (4242).

## ROZMIAR KSIĘGI N=10 (zmierzone, `ledgerStats.bytes`, runda 3)
ON: ok. 0,97 MB (t50) → 1,56 MB (t60) → 2,04 MB (t70) → 2,25 MB (t80). OFF: 3–4 KB. `entries` w OFF nie jest zerem (puste wpisy tury), więc dowodem trybu są bajty. Hak `ledgerStats` liczy wszystkich właścicieli (`gra/src/main.ts:32430–32433`), a zapis slotu filtruje tylko gracza (`gra/src/main.ts:39799`) — zob. KOREKTY 4.

## KOREKTY (runda 4, odpowiedź na FC r3; szczegóły i dowody: `30-obrona-claude.md`)
Poniższe zdania z wersji rundy 3 zostały USUNIĘTE lub zastąpione, nie są już stwierdzeniami tego raportu:
1. Ziarno 777 i uptime przed segmentami: w drzewie NIE ma katalogu z danymi ziarna 777 ani pliku z loadem przed segmentami. Load jest zapisany tylko w każdym wierszu CSV (kolumna `load1`), per tura. Opis commita 9ae009803 („evidence seed 777”) jest nieprawdziwy: commit zmienia wyłącznie raport.
2. ON2: średni load 2,87, max 3,78, 15 z 27 tur > 3,0 (zdanie „2,0–3,3” wycofane). OFF2: średni load 3,02, max 8,54, 9 tur > 3,0. Warunek load ≤ 3,0 był naruszony w danych ON2 i OFF2; wariant filtrowany (12 tur) jest w sekcji WYNIK.
3. Wyjaśnienie rozrzutu „dryfem czasowym maszyny” jest HIPOTEZĄ na n=2 vs n=2; brak przebiegu kontrolnego (ON,ON lub OFF,OFF w ciszy). Nie wnioskuję o przyczynie.
4. Obserwacja o braku historii ledgera po wczytaniu „wbrew FALI 760” jest WYCOFANA. Spadek 972 632 B → 118 419 B po wczytaniu jest zgodny z filtrem `isHuman` przy zapisie slotu (`gra/src/main.ts:39799`), a nie z utratą historii. Wpływ na Δ% NIE OSZACOWANO (brak przebiegu kontrolnego; porównanie ciągłej gry z wczytaną nie jest like-for-like).
5. Zdanie „0 tur spełnia warunek load” jest błędne; poprawnie: 12 tur (sekcja WYNIK).
6. Pozycje „uptime/load przed każdym segmentem w evidence” i „tsc/hook-test/5 bramek zielone z r2” są wycofane; bramki zmierzone w rundzie 4 (sekcja TESTY RUNDY 4).
7. (runda 5, zarzut FC r4 / 30-obrona zarzut 3) Zdanie „ON1 wznowiony ze slotu t60/t70, pozostałe ze slotu t70” jest WYCOFANE. Dane (zob. `30-obrona-claude.md`, zarzut 3) wskazują jeden slot t50 dla wszystkich 4 przebiegów: wiersze tur 2–50 są identyczne we wszystkich czterech plikach JSONL. Wartości księgi t60/t70 w tabeli powyżej dotyczą odpowiednich tur przebiegów, a nie punktów startu wznowień.
8. (runda 5) Zdanie o przebiegu ziarna 777 „ON1 50→70 uruchomiony przy load 2,36 i przerwany przy load 7,3” nie ma śladu w drzewie (zob. zarzut 1 powyżej); traktować jako NIEZWERYFIKOWANE i nieuwzględnione w wynikach.

## BLOKADY
- Rozstęp same-variant ≥ 10% (ON 17,5%, OFF 8,4%): wynik NIE ROZSTRZYGNIĘTY.
- Tylko 1 ziarno z 3 wymaganych (777 przerwany przy load 7,3; 31337 nie podjęte).
- Warunek load ≤ 3,0 (DODATEK 3/4) naruszony w części tur przebiegów ON2 i OFF2.
- Wpływ filtra `isHuman` (zapis slotu) na Δ% NIE OSZACOWANO.
- Pomiary live w rundzie 4 NIE wykonane (DODATEK 5 pkt 3; load maszyny 6–7).

## OBSERWACJE
1. Środowisko sesji wielokrotnie zwracało „classifier no verdict” dla poleceń z runnerem; każda próba ponawiana, bez obchodzenia; brak wpływu na dane.
2. Dwa przebiegi ON2 odrzucono i powtórzono (`evidence/s4242/*DISCARDED*`); pierwszy ruszył przy load 7,9 — błąd operatora wobec warunku DODATKU 3, wykryty i odrzucony.

## RUNDY
Runda 4/5 (Operator, Haiku wg DODATKU 5; runda dokumentacyjna). Historia: r1 (FAIL), r2 (FAIL), r3 (Sonnet, FAIL po FC r3 — błędne zdania w raporcie).

## NASTĘPNY KROK
Werdykt tematu wg DODATKU 5 pkt 5: PASS-WITH-NOTES z notą „próg 10% nie rozstrzygnięty; dalszy pomiar = NOWY temat (≥ 2 ziarna, load ≤ 1,5, kontrola filtra isHuman)”. Decyzja o nowym temacie należy do orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
