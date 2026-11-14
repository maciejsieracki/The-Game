# R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1 — obrona Operatora (odpowiedź na zarzuty Evaluatora), runda 3/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza generatora; bez zmian gra/src i gra/data)
TEMAT: R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1
GOAL: odpowiedzieć na zarzuty 1–7 Evaluatora (96043e054): przyjąć z dowodem albo odrzucić z dowodem; skorygować raport Operatora (10-operator-claude.md) tam, gdzie tabela lub wniosek nie miały pokrycia w pomiarze.
BAZA/KANDYDAT: 99300191c (kandydat r3), obrona od 99300191c; zmiany tylko w `dyspozycje/.../R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1/**`.

## Podsumowanie odpowiedzi

| Zarzut | Decyzja | Dowód |
|---|---|---|
| 1. Współczynnik ×1,5 skonfundowany | PRZYJMUJĘ — współczynnik ×1,5 WYCOFANY | Czysta para na tym samym hoście (load 1,3–1,8): plain 96,16 s, instr 99,15 s (`evidence/r4/plain22.log`, `instr22.log`). Narzut instrumentacji ≈3%, nie ×1,5. Load-zależność czasu pozostaje obserwacją, nie zmierzonym współczynnikiem. |
| 2. „Seed 11/33 = 3–4 s” jako fakt | PRZYJMUJĘ — wycofane | Node: seed 11 Standardowy 292–295 s, seed 33 216–225 s (`sweep-standardowy-plain-22-11-33.tsv`, `evidence/r4/std11.log`, `std33.log`). Czas 3–4 s z checkpointu overlay NIE jest czasem generacji. Co dokładnie mierzy, NIE_ZMIERZONO. |
| 3. Brak liczników dla 11 i 33 | PRZYJMUJĘ — DOMKNIĘTE pomiarem | Standardowy z licznikami (`--instr`): seed 11 → `growRiverInlandBeforeDrainage=6993`, `estimateLandCentroidFromSeed=6993`, `aStarRiverToTarget=6336`, CHECKSUM b329b72a, DONE t=295,13 s; seed 33 → 7850 / 7850 / 5379, CHECKSUM 36b49da9, DONE t=215,79 s. Oba zakończone, bez zapętlenia (`evidence/r4/std11.err`, `std33.err`). |
| 4. Sweep równoległy, czasy górnym oszacowaniem | PRZYJMUJĘ — jako ograniczenie | Potwierdzone: czasy 1–10 Standardowy i 11/33 z przebiegów równoległych (load 4–10). Porównywalne są wyłącznie liczniki i pomiary sekwencyjne (seed 22 Mały para z pkt 1). |
| 5. Node↔Worker i brak ukończenia w Chromium | PRZYJMUJĘ — zdanie „Node odtwarza ten sam kod Workera” NIE_ZMIERZONO | Nie porównano CHECKSUM z przeglądarką; w Chromium seed 22 nie ukończył się (>640 s, r2). Wniosek „nie zapętla się” opiera się na ukończeniu w Node (478–718 s) i na stałych licznikach, nie na przeglądarce. Wpływ innych ustawień gracza (worldDensity) NIE_ZMIERZONO. |
| 6. Pliki `.ts`/`.sh` poza `*.cjs`; build.cjs | PRZYJMUJĘ jako odchylenie formalne (ZAŁOŻENIE z raportu, oddane pod decyzję orkiestratora) | `wrap.ts` jest importowany przez `build.cjs` (plugin esbuild), `sweep.sh` to pętla przeglądu; zmiana nazwy zepsuje build. Ścieżka esbuild jest argumentem `argv[2]` (`node gra/tools/mapgen-rivers-seed22-diag-build.cjs <esbuild-main.js> <out.js> [--instr]`); brak wbudowanego fallbacku — NIE_ZMIERZONO, czy `npm install` w katalogu tymczasowym jest konieczne po sprzątaniu `/tmp`. `tsc` nie uruchomiony (brak typescript w środowisku). |
| 7. Pominięty czynnik 4 prób w `traceRiverForGridFill` | PRZYJMUJĘ — dopisane do propozycji poprawki | Kod `gra/src/map/gen-helpers.ts` l. 6972–6990: `tries = fastMode ? [acceptLen, …] : [catalogMinLen, max(acceptLen, floor(catalogMinLen*0,6)), acceptLen, 3]`, pętla `for (tryMin of tries)` z `traceRiver(...)` przy każdej próbie (z deduplikacją). Liczniki NIE rozdzielają udziału prób w kosztach; czynnik nie jest zmierzony osobno. Poprawka przez `landCentroid: ctx.massCentroid` usuwa BFS w każdym wywołaniu `traceRiver` niezależnie od liczby prób, ale zmniejszenia liczby prób nie obiecuje. Memoizacja z eksperymentu Evaluatora (seed 22 Mały, CHECKSUM bez zmian) dotyczy jednego ziarna. |

## Korekty raportu Operatora (10-operator-claude.md) — obowiązują zamiast tam zapisanych treści

1. Hipoteza (c): usunąć „×1,5 przy load 7–8”. Stan poprawny: czas zależy od obciążenia hosta (Mały seed 22: 96–101 s przy load 1,3–1,8; 107 s przy load 5,5 i ~250 s przy load 7,6, obie wartości z instr; Standardowy 478 s przy load 2,3 vs 707/718 s przy load 7–8). Ten rozrzut NIE jest rozdzielony od instrumentacji i od wielkości przebiegów równoległych — NIE_ZMIERZONO jako współczynnik. Liczniki są identyczne we wszystkich przebiegach (stałe).
2. Tabela „seed 11/33 = 3–4 s”: usunąć. Zastąpić: seed 11 Standardowy 292–295 s (plain / instr), seed 33 216–225 s.
3. Wiersz 11 i 33 w tabeli ziaren: wywołania centroid/grow = 6993 (11) i 7850 (33) zamiast NIE_ZMIERZONO.
4. Zdanie „Node odtwarza ten sam kod Workera” i „w Chromium >640 s = zgodne z tym zakresem”: NIE_ZMIERZONO (brak porównania Node↔przeglądarka).
5. Wniosek „seed 22 najwięcej wywołań”: po domknięciu pomiarem prawdziwe dla zbioru zmierzonego (ziarna 1–11, 22, 33 Standardowy): seed 22 = 18 590; pozostałe 5 974–12 136 (ziarna 1–10), 6 993 (11), 7 850 (33). Seed 22 ma ~1,5–3× więcej wywołań niż najbliższe; ocena „najgorszy” jest uzasadniona licznikami, nie czasem.
6. Ścieżka narzędzi: `gra/tools/mapgen-rivers-seed22-diag-{build.cjs,prof.cjs,callers.cjs,sweep.sh,wrap.ts}` (+ `run.cjs` z r1) — dopisać, że `.ts`/`.sh` są poza literalnym wzorcem allowlisty (`*.cjs`).

## Metoda tej rundy (nowe pomiary)
- Build: `node gra/tools/mapgen-rivers-seed22-diag-build.cjs /tmp/claude-0/nm/node_modules/esbuild <out>.js [--instr]` (esbuild 0.28.2). Bundle w scratchpadzie, nie w repo.
- Para czasowa seed 22 Mały, sekwencyjnie na tym samym hoście: plain `DONE t=96,16 s`, CHECKSUM 9f0c2884; instr `DONE t=99,15 s`, CHECKSUM 9f0c2884, COUNTERS 4745/4745/4745/7317. `uptime` przed: load 1,33 (09:04:48), po: 1,75 (09:08:03).
- Standardowy seed 11 i 33 z `--instr`, równolegle w tle (`nohup timeout 900`), odpytywane co ~7 min. Load ~4–6.

## ZMIANY/COMMIT
- Dodane (allowlista runs/**): `dyspozycje/autobot/runs/R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1/30-obrona-claude.md`, `evidence/r4/{plain22,instr22,std11,std33}.{log,err}`.
- Kod gry (`gra/src`, `gra/data`): nietknięte. `git diff c17b33eaa..<SHA> -- gra/src gra/data` powinno być puste (sprawdzone w obronie: brak zmian w gra/src).
- Commit: zobacz pole sha w wyniku (tylko ścieżki allowlisty, `git add <ścieżka>`).

## TESTY (surowe wyjście)
- `DONE seed=22 maly t=96.16s hexes=7992` / `CHECKSUM 9f0c2884` (plain).
- `DONE seed=22 maly t=99.15s hexes=7992` / `CHECKSUM 9f0c2884` / `COUNTERS {"growRiverInlandBeforeDrainage":4745,"estimateLandCentroidFromSeed":4745,"aStarRiverToSea":4745,"aStarRiverToTarget":7317}` (instr).
- `DONE seed=11 standardowy t=295.13s hexes=20160` / `CHECKSUM b329b72a` / `COUNTERS {"growRiverInlandBeforeDrainage":6993,"estimateLandCentroidFromSeed":6993,"aStarRiverToSea":6993,"aStarRiverToTarget":6336}`.
- `DONE seed=33 standardowy t=215.79s hexes=20160` / `CHECKSUM 36b49da9` / `COUNTERS {"growRiverInlandBeforeDrainage":7850,"estimateLandCentroidFromSeed":7850,"aStarRiverToSea":7850,"aStarRiverToTarget":5379}`.
- `git diff --check`: wynik w sekcji poleceń obrony.
- Bramek gry (logic/tech-tree/research/unit-replace/combat) nie uruchamiano ponownie: kod gry nie zmieniony w tej rundzie (zielone w Evaluatorze na tym samym src).

## BLOKADY
- NIE_ZMIERZONO: współczynnik wpływu obciążenia na czas (poza parą 96/99 s); wpływ load na Standardowy; zgodność CHECKSUM Node vs przeglądarka; zachowanie w Chromium przy ukończeniu; udział 4 prób `traceRiverForGridFill` w koszcie; wpływ worldDensity; `tsc --noEmit`.
- Brak zmian w kodzie — poprawka i test regresji pozostają w osobnym temacie po FC (zgodnie z dispatchem).

## RUNDY
3/5 (obrona rundy 3; Operator Sonnet uzasadniony po 2 BLOCK Haiku, zgodnie z dispatchem).

## NASTĘPNY KROK
Final Control (Sonnet) na 99300191c + commit obrony: sprawdzić, że korekty 1–6 są zgodne z evidence/r4 i z kodem; po FC temat naprawczy R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1 (decyzja ABC o sumach kontrolnych przed zmianą).

DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA
1. Główny wniosek nie zmienił się: seed 22 kończy się (478–718 s, zależnie od hosta), liczniki `estimateLandCentroidFromSeed` są stałe i większe niż dla 11/33 (1,5–3×), przyczyną jest BFS bez cache w `growRiverInlandBeforeDrainage` przy braku `landCentroid`. Defekt to wydajność/UX, nie nieskończona pętla.
2. Decyzja ABC przed tematem naprawczym: zmiana centroidu zmienia wynik generacji (CHECKSUM b329b72a dla 11, 9f0c2884 dla Mały 22, 36b49da9 dla 33 mogą się zmienić).
3. Allowlista: pliki `.ts`/`.sh` wymagają świadomej akceptacji orkiestratora (zarzut 6).

## RUNDA 5 — odpowiedź na zarzuty Evaluatora (kandydat 0b6e687f7, baza cacc8b1d4)

Każdy zarzut: PRZYJMUJĘ (poprawka + dowód) albo ODRZUCAM (dowód). Poprawki w `10-operator-claude.md` (ERRATA 7–9 i zmienione wiersze/werdykt).

**Zarzut 1 ((c) PRZYCZYNA zamiast NIE_ZMIERZONO) — PRZYJMUJĘ.** Wiersz (c) zmieniony na NIE_ZMIERZONO (obserwacja korelacyjna). Czysta para na tym samym hoście: `evidence/r4/plain22.log.txt` `DONE seed=22 maly t=96.16s`, `evidence/r4/instr22.log.txt` `DONE seed=22 maly t=99.15s` — narzut instrumentacji ≈3%, nie obciążenie.

**Zarzut 2 (rozrzut „zależnie od obciążenia hosta”) — PRZYJMUJĘ.** Werdykt i UWAGA 1 przepisane na zmierzony zakres (Standardowy seed 22: 478–718 s); przyczyna rozrzutu NIE_ZMIERZONO. Dodatkowo sprawdzone: przebieg „503 s” nie ma pliku w repo (wartość tylko z notatki Operatora); `evidence/r3/logs/s22-*.out` nie zawierają odczytu load; jedyny zapisany load to `evidence/r3/sweep-standardowy-plain-22-11-33.tsv` (478,0 s, load=2.33). Oznaczone NIE_ZMIERZONO (ERRATA 7).

**Zarzut 3 (Node ↔ Worker/Chromium) — PRZYJMUJĘ.** Dodany jawny blok ZAŁOŻENIE (NIE_ZMIERZONO) pod werdyktem (ERRATA 8). Potwierdzone: w `evidence/` nie ma sumy CHECKSUM z Chromium dla seed 22 (`grep -il checksum evidence/*.json` — brak trafień).

**Zarzut 4 (powtarzalność; CHECKSUM w 2 z 3) — PRZYJMUJĘ z korektą.** Liczba była błędna: Standardowy seed 22 ma **2** zmierzone przebiegi z licznikami — `evidence/r3/logs/s22-1.out` (706,72 s) i `s22-2.out` (718,14 s), oba `CHECKSUM 3248f5b4`, `COUNTERS` 18590/18590/18590/37735. Przebieg `instr22` (`evidence/r4/instr22.log.txt`, 99,15 s) to seed 22 **Mały**, nie Standardowy. Mały seed 22 ×3 (`evidence/r3/logs/m22-1..3.out`, 253,63/248,44/250,93 s): każdy `CHECKSUM 9f0c2884`, `COUNTERS` 4745/4745/4745/7317 — to jest prawdziwe „×3”. Przebieg Standardowy 478 s (sweep) nie ma liczników ani sumy. Wiersz „Powtarzalność” przepisany (ERRATA 9).

**Weryfikacja liczb (z surowych logów przez grep `DONE|CHECKSUM|COUNTERS`):** s22-1 706,72 s / 3248f5b4; s22-2 718,14 s / 3248f5b4; m22-1..3 253,63 / 248,44 / 250,93 s / 9f0c2884; r4 instr22 99,15 s / 9f0c2884; r4 plain22 96,16 s / 9f0c2884; r4 std11 295,13 s / b329b72a; r4 std33 215,79 s / 36b49da9.

**Wynik rundy:** zarzuty 1–4 PRZYJĘTE i poprawione; żaden nie ODRZUCONY. Zakres diffu względem cacc8b1d4: wyłącznie `dyspozycje/autobot/runs/R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1/` (`git diff --stat cacc8b1d4 HEAD -- gra/` puste). Bramek kodowych (tsc, testy referencyjne) nie uruchamiano: zmiana to dokumentacja i evidence bez kodu.

**Zarzut 6 (allowlista .ts/.sh)** — bez zmian, decyzja orkiestratora (ERRATA 6).

STATUS: PASS-WITH-NOTES (oczekiwany wynik FC)
RUNDY: 5 (obrona rundy 5 tego tematu; wniosek po FC → osobny temat naprawczy po decyzji ABC o sumach kontrolnych)
DEPLOY/PUSH: NIE WYKONANO
