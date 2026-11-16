# R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1 — raport Operatora (runda 3/5)

STATUS: PASS-WITH-NOTES (pomiar wykonany; wynik progu 10%: NIE ROZSTRZYGNIETE — patrz WYNIK)
DOMAIN: GAME (tylko pomiar; w gra/src jedna zmiana: hak odczytu `ledgerStats` w bloku `?civTest=1`)
TEMAT: R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1
GOAL: pomiar kosztu czasu tury zapisu do ksiegi „Skad zapasy” (ON vs OFF) w konfiguracji DOMYSLNEJ na harnessie AI z miastami, wg projektu DODATKU 4 (pary na wspolnym slocie t50, okno t51-80; NIE 100 tur).

## ZMIANY / COMMIT
- Baza: origin/main 459354a12e00eb04cc8365c5ac03a03c2ffec999 (checkout --detach).
- gra/src/main.ts: `__aiEconomyMeasure.ledgerStats()` (odczyt, tylko `?civTest=1`; +5 linii; zero zmian logiki gry).
- gra/tools/ai-economy-measure-run.cjs: `--ledger-off 1` (setRecording(false) po otwarciu gry), pola `load1`/`ledgerRecording` w kazdym wierszu, `ledgerStats` co 10 tur + w pierwszej turze po wczytaniu slotu.
- gra/tools/ai-economy-measure-hook-test.cjs: asercja ksztaltu `ledgerStats` + mutacja (przejete z `refs/keep/R-WEB-LEDGER-PERF-r2-obrona-wip`, domkniete; zamyka Z3).
- gra/tools/ledger-perf-default-analyze.cjs (NOWE): analiza par na wspolnym slocie (per tura, mediana/srednia Δ%, rozstep same-variant, okna 51-60/61-70/71-80, kolejnosc, `--maxload`, CSV).
- evidence/: surowe JSONL (gzip) kazdego przebiegu, pairs-4242.csv, analysis-4242.json, uptime.log (load przed/po kazdym segmencie), dist-md5.txt.
- Allowlista zachowana (gra/tools/*, gra/src/main.ts hak civTest wg DODATKU 2, runs/**). Brak zmian WERSJE.md, manifestu, gra-robocza/, rust-port/.

## BUILD / POCHODZENIE
- vite build POZA repo (`node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/w/dist`), 45 s. Jeden dist dla ON i OFF (przelacznik runtime `--ledger-off`).
- md5 (evidence/dist-md5.txt): index.html c14b38a5396ebe70e59a6cc1addf0571; audio-pack-1.js 5b990bc3…; audio-pack-2.js 0a9a1047…; audio-pack-3.js 9e88be9f…. (md5 index.html nie jest bajtowo powtarzalny miedzy buildami — podano md5 builda uzytego w tej rundzie.)

## TESTY (liczby z surowego wyjscia)
- hak-test `ai-economy-measure-hook-test.cjs --dist <dist> --mutant-dist <mutant>`: `PODSUMOWANIE 19/19 zielone`, w tym `ksztalt ledgerStats ... {"entries":0,"bytes":2}` oraz `mutacja realna ledgerStats (zepsuty hak w bundle) jest CZERWONA :: entries nie jest liczba >=0; bytes nie jest liczba >=2` (zamyka Z3).
- `node --check` runnera i analizatora: OK.
- NIE ZMIERZONO w tej rundzie: tsc i 5 bramek referencyjnych (logic/tech-tree/research/unit-replace/combat) — zmiana w gra/src to 5 linii odczytu za `?civTest=1`; uruchomic w integracji (r2 podal tsc 0 i 5 bramek zielonych na tym samym haku).

## WYNIK POMIARU — SEED 4242 (okno t51-t80; rozgrzewka t51/t61/t71 odrzucona; 27 tur na przebieg)
Projekt: slot t50 (ON, domyslny) -> 4 przebiegi t51->t80 w kolejnosci ON1, OFF1, OFF2, ON2 (kazdy z kopii tego samego profilu/slotu; segmenty <590 s, wznowienie ze slotu t60/t70 dla ON1 i t70 dla pozostalych).

| przebieg | srednia s/ture | mediana s/ture | sredni load1 | ksiega (bajty JSON) t60 / t70 / t80 |
|---|---|---|---|---|
| ON1 | 20,86 | 16,7 | 1,20 | 1 558 684 / 2 035 873 / 2 248 878 |
| OFF1 | 21,49 | 20,2 | 1,26 | 3 661 / 3 661 / 3 201 |
| OFF2 | 23,47 | 19,1 | 3,02 | 3 661 / 3 661 / 3 201 |
| ON2 | 25,28 | 21,6 | 2,87 | 1 558 684 / 2 039 767 / 2 259 491 |

Pary ON vs OFF (Δ% calkowitego czasu tych samych 27 tur): ON1/OFF1 -2,9%; ON1/OFF2 -11,1%; ON2/OFF1 +17,6%; ON2/OFF2 +7,7%. Mediana z par +2,4% (srednia +2,8%).
Rozstep szumu same-variant: ON1 vs ON2 -17,5%; OFF1 vs OFF2 -8,4%.
Wg okien (mediana par): 51-60 +3,8%; 61-70 -3,6%; 71-80 +5,7%.
Wg kolejnosci: ON-pierwszy -7,0% (n=2), OFF-pierwszy +12,7% (n=2) — roznice maja kierunek zgodny z kolejnoscia/czasem uruchomienia, nie z wariantem.
Wariant z odrzuceniem tur o load1 > 3,0: 0 tur spelnia warunek dla wszystkich 4 przebiegow jednoczesnie (ON2 mial load 2,9-7 w czesci tur) — nie da sie policzyc (--maxload w analizatorze).

WERDYKT PROGU 10%: **NIE ROZSTRZYGNIETE** — rozstep same-variant 17,5% >= 10% (DODATEK 4). Nie wolno wnioskowac ani „optymalizacja niepotrzebna”, ani „kandydat R-WEB-*”. Najwyrazniejszy sygnal to dryf czasowy maszyny (przebiegi pozniejsze wolniejsze niezaleznie od wariantu), nie wariant.
Okno to t51-t80 (30 tur, 27 po odrzuceniu rozgrzewek), NIE 100 tur.

## ROZMIAR KSIEGI N=10 (zmierzone, `ledgerStats.bytes`)
ON: ok. 0,97 MB (t50) -> 1,56 MB (t60) -> 2,04 MB (t70) -> 2,25 MB (t80), rosnie z liczba miast/wlascicieli (42 wlascicieli). OFF: 3-4 KB. Uwaga: `entries` w OFF nie jest zerem (puste wpisy tury), wiec dowodem trybu sa bajty.

## OBSERWACJE
1. Po wczytaniu slotu ksiega ON zaczyna od ~1 wpisu: t51 118 419 B (slot t50 mial 972 632 B), t61 188 491 B, t71 213 202 B — historia 10 tur NIE wraca po `loadSlot` w tym runnerze/buildzie (wbrew oczekiwaniu z FALI 760). Skutek dla pomiaru: w ON1 (wznowienie na t60 i t70) i ON2 (t70) ksiega w pierwszych turach segmentu byla mniejsza niz w grze ciaglej, wiec ON jest w tych turach zanizony (kierunek: na korzysc ON). Do rozstrzygniecia osobno (zgloszenie dla orkiestratora).
2. Dwa przebiegi ON2 zostaly odrzucone i powtorzone: pierwszy wykonany przy load1 8-11 (inny workflow na maszynie), drugi przy load wzrastajacym z 2,9 do 7; trzeci (uzyty) przy 2,0-3,3. Surowe dane odrzuconych w evidence/s4242/*DISCARDED*. Pierwszy przebieg ON2 ruszyl przy load 7,9 — blad operatora (warunek DODATKU 3: load <= 3,0 przed kazda para), wykryty i odrzucony.
3. Srodowisko tej sesji zwracalo wielokrotnie „classifier no verdict” dla polecen z runnerem; kazda proba ponawiana ponownie (bez obchodzenia); brak wplywu na dane.

## BLOKADY
- Rozstep same-variant >= 10% (maszyna wspoldzielona z kilkoma workflowami Chromium; load 1,0-10,8). Seed 777 i 31337: patrz nizej.

## RUNDY
Runda 3/5 (Operator, SONNET wg DODATKU 4).

## NASTEPNY KROK
Powtorzenie w ciszy maszyny (load < 1,5 stabilnie) albo dluzsze okno; analizator gotowy (`ledger-perf-default-analyze.cjs`).

DEPLOY/PUSH: NIE WYKONANO
