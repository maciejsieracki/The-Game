# Zatrzymanie końca tury w VLIVE3 (t12) — odtworzenie i diagnoza

Temat: R-WEB-ENDTURN-STALL-REPRO-Q1 (tag ENDSTALL). Baza: origin/main `659e2d01c` (kandydat `659e2d01cb2d180e35f715d85e84cdffc61bc19f`).
Zmiany gry: ZERO (`gra/src`, `gra/data` nietknięte). Dodany tylko runner diagnostyczny `gra/tools/endstall-fortring-live.cjs`.
Dane surowe: `dyspozycje/autobot/runs/R-WEB-ENDTURN-STALL-REPRO-Q1/dane/` (36 logów `*.txt` + `tally-przebiegi.txt`).

## Pytanie

W VLIVE3 jeden przebieg FORTRING ON na maksimum (seed 4242, Trudny / trudna / Wysoki ×4 / kultura trudny) zatrzymał się w turze 12 z wpisami `[EndTurn] blocked: endTurnInProgress`. Pytanie: błąd gry (koniec tury nigdy się nie zamyka), czy harness?

## Wynik w jednym zdaniu

Zatrzymanie NIE jest zawieszeniem końca tury: każde zatrzymanie to **przegrana gracza** (utrata jedynego miasta, `[Victory] PRZEGRANA ... rodzaj=przegrana`), po której gra blokuje zakończenie tury powodem `gameOver`. W chwili zatrzymania `endTurnInProgress = false`. Wpisy `endTurnInProgress` poprzedzają koniec gry i nie są przyczyną. Błąd gry w sensie „koniec tury się nie domyka" NIE został potwierdzony.

## Metoda

- Runner: kopia `gra/tools/vlive3-fortring-live.cjs` jako `gra/tools/endstall-fortring-live.cjs`. Logika bez zmian; dodany (a) odczyt ziarna z `ENDSTALL_SEED` (domyślnie 4242), (b) w rekordzie `stop` pola `inProg` (`isEndTurnInProgress`), `gameOver` (`__defeatTestDebug.isGameOver`) i `snap` (`__nnsMeasureDebug.snapshot`), (c) przechwytywanie konsoli (`[Victory]`, `[Ekonomia]`, `[Autosave]`, błędy) do logu. Parametry gry (MAX_PARAMS) identyczne z VLIVE3.
- Bundle: `tools/test-hook-setcitylimit-live-bundle.cjs` (esbuild, poza repo). Nie uruchamiano `vite build` (runner używa tego bundla; `npm run build/dev` nie uruchamiano).
- Chromium: `/opt/pw-browsers/chromium` przez `_chrome-path.cjs`, `--no-sandbox`, headless. Przebiegi sekwencyjne, każdy w osobnym katalogu w scratchpadzie (poza repo), `timeout` 120–150 s na przebieg. Load maszyny 4,9–5,9.
- `npm ci --ignore-scripts` w `gra/` (katalog `node_modules` ignorowany przez git).
- Zero `pageerror`, zero SIGSEGV we wszystkich 36 przebiegach (rc=0 we wszystkich). Round-trip zapisu (`saveRoundTrip`) równy w 36/36.

## Dane: 36 przebiegów

Źródło: `dane/tally-przebiegi.txt` (wygenerowane z surowych logów).

| Scenariusz | Przebiegi | Zatrzymane (przegrana gracza) | Dokończone 20 tur | Tury przegranej |
|---|---|---|---|---|
| FORTRING ON, seed 4242, maksimum | 24 | 15 | 9 | t8, t9, t9, t9, t9, t10, t9, t12, t16 (zakres t8–t16) |
| FORTRING ON, seed 7, maksimum | 4 | 2 | 2 | t10, t13 |
| FORTRING ON, seed 778899, maksimum | 4 | 2 | 2 | t12, t13 |
| FORTRING OFF (pierścień wyłączony), seed 4242, maksimum | 4 | 3 | 1 | t12, t13, t13 |

Rozbicie 24 przebiegów seed 4242 ON: 1 przebieg wczesnego runnera VLIVE3 (`run1`, 20/20), 8 przebiegów `s4242-r1..r8` (5 zatrzymań), 8 przebiegów `d2-4242-r1..r8` (5 zatrzymań), 3 przebiegi `d3-4242-r1..r3` (2 zatrzymania), 4 przebiegi `diag4242-r1..r4` (3 zatrzymania). Wersje runnera różnią się wyłącznie diagnostyką (patrz Metoda), parametry gry są te same.

Wniosek z liczb: zatrzymanie przy tym ustawieniu jest powtarzalne (≈ 60% przebiegów przy seed 4242), ale wynik jest losowy między przebiegami i nie zależy od pierścienia (OFF też przegrywa 3/4) ani od ziarna (7 i 778899 też).

Uwaga dotycząca zakresu: dispatch prosił także o „niższy poziom kosztów" jako porównanie. NIE ZMIERZONO, bo właściciel (2026-11-26) wymaga pomiarów wyłącznie na poziomie maksymalnym; poziomy niższe nie były potrzebne do tej diagnozy.

## Stan gry w chwili zatrzymania (dowód z haków, nowszy runner: 4 przebiegi z polem `inProg`/`gameOver`/`snap`)

Przykład `d2-4242-r1` (zatrzymanie po turze 9):

- `[Ekonomia] Tura 9: gracz(1 os.) ...` — gracz ma jeszcze 1 miasto na początku tury 8→9.
- `[Autosave] ... tura=9`, potem `[Victory] PRZEGRANA (tura 9) gracz=0 rodzaj=przegrana`, potem `[EndTurn] triggerPlayerEndTurn: DONE tura 9`.
- Stan po zatrzymaniu: `inProg=false`, `gameOver=true`, `canEnd=false`, `gate.blokada=false`, `snap` = `{"turn":9,"owners":[]}` (brak miast), `battle` — wszystkie flagi zamknięte (`preBattleOpen`, `pendingAuto`, `sceneOpen`, `summaryOpen`, `resolving` = false). Brak otwartego modala i brak oczekującej bitwy.
- Ostatnia blokada w logu każdego zatrzymania to `[EndTurn] blocked: gameOver` (wszystkie 15 zatrzymań w tabeli).

Gate: `canEnd=false` wynika wyłącznie z `gameOver` (kolejność sprawdzeń w `canPlayerInitiateEndTurn`: `awaitingFirstPlayerCity`, `playtestWalkaActive`, `gameOver`, potem `endTurnInProgress`; src/main.ts ok. 43540–43600). Wpisy `endTurnInProgress` pojawiają się w trakcie tury przegranej, zanim `gameOver` jest ustawione, i nie przetrwają zakończenia tury.

## Źródło przegranej w kodzie

`src/main.ts` (ok. 39041–39048): `sprawdzPrzegranaPoUtracieMiasta` ustawia `gameOver = true`, gdy `checkDefeat` (src/game/victory.ts:214) wykryje brak miast gracza po wcześniejszym posiadaniu miasta. Gra pokazuje ekran porażki (`pokazEkranPorazki`).

## Przyczyna utraty miasta — NIE ZMIERZONO

Log konsoli nie zawiera zdarzeń bitew ani zdobycia miasta (tylko `[Ekonomia]`, `[Autosave]`, `[Victory]`). Najprostsza hipoteza zgodna z danymi: runner gra pasywnie (`clearBattles` zamyka bitwy w trybie auto, brak obrony budowanej przez gracza), więc jedyne miasto gracza (z wymuszonym fortem) zostaje zdobyte przez AI lub barbarzyńców w turze 8→9. Nie zweryfikowano tego logiem bitwy ani stanem jednostek — to wymaga osobnego pomiaru (log bitew / stan jednostek wroga w turze przegranej).

## Ocena

- **Błąd gry (zawieszenie końca tury): NIE POTWIERDZONY.** Brak przypadku, w którym `endTurnInProgress` pozostaje `true` po zakończeniu tury. We wszystkich zatrzymaniach `inProg=false` i `gameOver=true`.
- **Harness: DEFEKT KLASYFIKACJI** (nie zawieszenia). Runner traktuje `gameOver` jako `cannot-end` i zatrzymuje przebieg. Dla testów 20-turowych na maksimum przy pasywnym graczu oznacza to przedwczesny koniec przebiegu. Poprawka runnera (rozpoznać `gameOver` jako koniec gry i zapisać go jako wynik) jest po stronie testów — nie wymaga zmian gry.
- **Do sprawdzenia przez orkiestratora (poza zakresem tego tematu):** pomiar po `saveRoundTrip` w przegranej grze pokazuje `[Diag:load] OK tura=9 miasta=1` (`d3-4242-r1`), czyli wczytanie zapisu po przegranej odtwarza stan z jednym miastem, mimo że przed zapisem `owners` jest puste. Nie zbadano, czy to kwestia snapshotu w hakach testowych, czy realny błąd zapisu/odczytu po porażce. Zapisane w UWAGI-DLA-ORKIESTRATORA raportu.

## Kandydat na temat naprawczy

Nie ma kandydata na naprawę końca tury. Są dwa kandydaty na tematy pomiarowe:
1. Runner: rozpoznawać `gameOver` jako koniec przebiegu (wynik „przegrana w turze N") zamiast `cannot-end`. Bez zmian gry.
2. Dlaczego pasywny gracz traci jedyne miasto przy maksimum (log bitew + stan jednostek wroga w turze 8→9). Pytanie o balans trudności i obrony wchodzi w zakres ABC, nie w naprawę.

## Bramki

- `npx tsc --noEmit` (gra/): rc=0.
- Bramki logic (213) i ai-test (297/0): NIE URUCHOMIONO. Brak zmian w kodzie gry; w `gra/package.json` nie ma skryptów o tych nazwach (jedyny skrypt testowy to `typecheck`).
