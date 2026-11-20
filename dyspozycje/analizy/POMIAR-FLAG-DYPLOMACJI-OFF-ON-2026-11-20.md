# Pomiar flag dyplomacji OFF vs ON (seed 4242 i 7, 90 tur) — 2026-11-20

**ID:** R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1 (runda 1/5, Operator HAIKU 5.5)
**Baza kodu:** origin/main `d42ec85605bc26a8cba70adfc1696504acab6f48` (FALE 875–889; sześć flag dyplomacji domyślnie ON).
**Bundle:** zbudowany z tej bazy poza repo (`vite build --outDir <poza repo>`). Kod gry (`gra/src`, `gra/data`) NIE zmieniany.
**Dane surowe:** `dyspozycje/autobot/runs/R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1/*.jsonl.gz` (jedna linia na próbkę co 5 tur).

## Metoda

- Runner: `gra/tools/diplomacy-harder-measure-run.cjs --all-flags 0|1 --player-ai 1 --every 5 --turns 90`, ziarna 4242 i 7.
- Flagi pakietu (harder, sojusz-tor, koalicja, zero zaufania, siła sojuszu w wojnie, limit wojen) ustawiane hakiem PO starcie gry i po każdym wczytaniu slotu, PRZED endTurn. Tor NAP AI↔AI nie jest w pakiecie (zostaje na wartości z danych).
- Wznowienie: `--stop-at 30 / 60 / 90` z tym samym `--out` i `--profile`; zapis slotu `dipl-measure-<TAG>` co 5 tur, liczniki w `<TAG>.state.json`. Wiersze jsonl ponad turę slotu są obcinane przy wznowieniu.
- Kontrola wznowienia: `gra/tools/diplomacy-measure-resume-test.cjs` (6 tur, 2 odcinki vs ciągły) — 12/12 zielonych, wiersze identyczne poza polem `sec`.
- Każdy przebieg: 18 wierszy (tury 5..90), brak duplikatów tur (zweryfikowane).

## Wyniki (tury 30 / 60 / 90; próbka = wiersz tury)

| Ziarno | Flagi | Tura | Wojny ogółem (AI↔AI / z graczem) | Maks. wojen jednej cywilizacji | Cywilizacje z ≥2 wojnami | Sojusze AI↔AI (w turze) | Sojusz z graczem | Pary w pokoju | Zerwania przy zerowym zaufaniu (licznik sesji) | Mediana zaufania sąsiadów | Wojny epoki (z graczem) | Wyeliminowane (proxy) | Wymuszone pokoje |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4242 | OFF | 30 | 0 (0 / 0) | 0 | 0 | 0 | 0 | 0 | 0 | 43,9 | 0 (0) | 0 | 0 |
| 4242 | OFF | 60 | 5 (4 / 1) | 2 | 2 | 0 | 0 | 1 | 0 | 0,0 | 0 (0) | 0 | 0 |
| 4242 | OFF | 90 | 1 (0 / 1) | 1 | 0 | 0 | 0 | 12 | 0 | 34,9 | 1 (1) | 0 | 1 |
| 4242 | ON | 30 | 0 (0 / 0) | 0 | 0 | 0 | 0 | 0 | 0 | 37,9 | 0 (0) | 0 | 0 |
| 4242 | ON | 60 | 4 (3 / 1) | 1 | 0 | 1 | 0 | 2 | 6 | 0,0 | 0 (0) | 0 | 0 |
| 4242 | ON | 90 | 5 (3 / 2) | 3 | 1 | 12 | 0 | 12 | 22 | 30,6 | 2 (2) | 0 | 1 |
| 7 | OFF | 30 | 0 (0 / 0) | 0 | 0 | 0 | 0 | 0 | 0 | 24,1 | 0 (0) | 0 | 0 |
| 7 | OFF | 60 | 3 (2 / 1) | 1 | 0 | 0 | 0 | 2 | 0 | 22,9 | 0 (0) | 0 | 0 |
| 7 | OFF | 90 | 2 (1 / 1) | 2 | 1 | 0 | 0 | 6 | 0 | 33,3 | 1 (1) | 0 | 1 |
| 7 | ON | 30 | 0 (0 / 0) | 0 | 0 | 0 | 0 | 0 | 0 | 24,1 | 0 (0) | 0 | 0 |
| 7 | ON | 60 | 2 (1 / 1) | 1 | 0 | 2 | 0 | 2 | 0 | 0,0 | 0 (0) | 0 | 0 |
| 7 | ON | 90 | 3 (2 / 1) | 2 | 1 | 8 | 0 | 5 | 0 | 19,3 | 1 (1) | 0 | 1 |

Maksima z całej próbkowanej trajektorii (tury co 5; kolumny „maks.”):

| Ziarno | Flagi | Maks. wojen łącznie (tura) | Maks. wojen jednej cywilizacji (tura) | Maks. sojuszy AI↔AI |
|---|---|---|---|---|
| 4242 | OFF | 7 (t70) | 3 (t80) | 0 |
| 4242 | ON | 8 (t70) | 3 (t70) | 12 (t90, nadal rośnie) |
| 7 | OFF | 4 (t50) | 2 (t50) | 0 |
| 7 | ON | 4 (t75) | 2 (t70) | 8 (t90, nadal rośnie) |

## Czego NIE zmierzono

- **Miasta AI** — wiersz nie zawiera liczby miast; NIE_ZMIERZONO.
- **Eliminacje** — kolumna „wyeliminowane” to proxy: zmiana liczby właścicieli z wiersza `owners` (cywilizacje z miastem lub jednostką, bez państw-miast). Wartość 0 we wszystkich przebiegach; to nie dowód braku eliminacji poza tą definicją.
- **Zerwania traktatów** — zmierzone są tylko zerwania przy zerowym zaufaniu (licznik sesji, wznawiany przez offset). Inne zerwania NIE ZMIERZONO.
- **Szczyt sojuszy** — próbkowanie co 5 tur; szczyt między próbkami nie jest widoczny.
- **NAP AI↔AI** — 0 we wszystkich przebiegach (tor NAP poza pakietem, wartość z danych).
- **Mediana zaufania sąsiadów** — liczona z par oznaczonych `sasiad` w danej turze; małe n (kilka–kilkanaście par), pole bardzo zmienne między turami.
- **Zmienność między ziarnami** — 2 ziarna × 1 bieg; brak przedziałów ufności.

## Wniosek (liczby, bez progów decyzyjnych)

1. **Sojusze AI↔AI:** przy ON pojawiają się (t90: 12 w ziarnie 4242, 8 w ziarnie 7); przy OFF 0 w obu ziarnach. Liczba nadal rośnie na końcu horyzontu.
2. **Zerwania przy zerowym zaufaniu:** przy ON 22 (4242) i 0 (7, do t90); przy OFF 0 w obu.
3. **Mniej współbieżnych wojen — NIE potwierdzone.** W t90 ON ma więcej wojen niż OFF (4242: 5 vs 1; 7: 3 vs 2) i więcej wojen jednej cywilizacji (3 vs 1; 2 vs 2). W t60 wynik jest odwrotny (4242: 4 vs 5; 7: 2 vs 3). Dwa ziarna i jeden bieg nie dają kierunku.
4. **Przejęcie świata przez jedną AI:** nie zaobserwowano w żadnym przebiegu (liczba właścicieli 14 w każdej próbce; wyeliminowane 0 — w rozumieniu proxy).
5. **Wojny epoki:** w t90 każda wojna epoki była wojną z graczem (OFF: 1 w obu ziarnach; ON: 2 w 4242, 1 w 7). Gracz był celem wojen epoki w 100% zaobserwowanych przypadków.
6. **Wymuszone pokoje przyjęte:** 1 w t90 w każdym przebiegu (OFF i ON); 0 w t30 i t60.

Podsumowanie: ON zmienia dynamikę w kierunku „więcej sojuszy AI↔AI” oraz zerwań przy zerowym zaufaniu; kierunek „mniej współbieżnych wojen” w tych danych nie występuje.

## Stabilność środowiska (dla powtórzeń)

Chromium w tym środowisku kończy się SIGSEGV przy starcie/wczytaniu (`Received signal 11`) — w 22 z 41 logów biegów i odcinków. Wznowienie po SIGSEGV dawało poprawny wynik po ponownym uruchomieniu (stan jest zapisywany co 5 tur; po awarii runner startuje od ostatniego slotu). Jednoczesny proces `ai-economy-measure-run.cjs` na tej samej maszynie zwiększał obciążenie CPU (tura ~20 s zamiast ~2 s). Nie zbadano przyczyny SIGSEGV.

## Komendy powtórzenia

```
# bundle (poza repo)
cd gra && node ./node_modules/vite/bin/vite.js build --outDir <DIST> --emptyOutDir
# odcinki: dla każdego (seed, all) kolejno --stop-at 30, 60, 90; ten sam --out i --profile; przy SIGSEGV ponowić
CHROME_PATH=/usr/bin/google-chrome MEASURE_CHROME_ARGS="--disable-gpu --mute-audio" \
  node tools/diplomacy-harder-measure-run.cjs --dist <DIST> --out <OUT>/s<SEED>-a<F> --profile <PROF>/s<SEED>-a<F> \
  --seed <SEED> --turns 90 --every 5 --player-ai 1 --all-flags <F> --stop-at <30|60|90>
# test wznowienia
node tools/diplomacy-measure-resume-test.cjs --a <dir A> --b <dir B> --base <dir>
# analiza (po gunzip katalogów s<SEED>-a<F>/seed<SEED>-all<F>.jsonl)
python3 -I dyspozycje/autobot/runs/R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1/analiza-pomiar.py <OUT>
```
