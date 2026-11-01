STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-YIELD-LIVE-Q1
GOAL: Jeden realny pomiar w pełnej grze (Chromium, realne doStartGame i endTurn): PRE (`c99ac58cd`) vs POST (`8ce134b81`, waga 0,3). Mapa Standardowy 168×120, ziarno 4242, 100 tur, Kontynenty (30%) oraz Pangea (60%). Wniosek względem progu T100 −10% … +25%.

ZMIANY/COMMIT: tylko allowlista: `gra/tools/ai-city-live-measure.cjs`, `gra/tools/ai-city-live-summarize.cjs`, ten raport, `evidence/` (JSON stanu, logi, `summary.txt`, ok. 50 KB), `gate-node-check.txt`. Zero zmian w `gra/src`, `gra/data`, `rust-port`, `WERSJE.md`. SHA: `be87dc75f` (runda 1). Korekty po zarzutach: `02-operator-obrona-r1.md`.

METODA: kopie `git archive` PRE i POST w `mktemp -d` (/tmp), `npm ci` poza repo, patch KOPII main.ts (hook `__aiCityCountDebug.dump`, `startNewGame` z mapSize/typSwiata; ta sama logika co `--prepare` z `ai-city-count-sim.cjs`), `vite build --outDir` poza repo. Cztery odczepione procesy równolegle (PRE/POST × Kontynenty/Pangea), ziarnowany Math.random (`0x9e3779b9 ^ seed`), 5 cywilizacji AI, gracz kończy turę bez akcji, wyłączony check zwycięstwa. Migawki T1/25/50/75/100.

WYNIKI (miasta AI major, suma; min/mediana/max na cywilizację):
| mapa | T25 PRE/POST | T50 PRE/POST | T75 PRE/POST | T100 PRE/POST | delta T100 |
|---|---|---|---|---|---|
| Kontynenty | 31 / 31 | 72 / 71 | 78 / 79 | 93 / 93 | 0,0% |
| Pangea | 24 / 24 | 63 / 64 | 76 / 76 | 92 / 90 | −2,2% |

T100 min/med/max na cywilizację: Kontynenty PRE 14/20/20, POST 13/20/20; Pangea PRE 15/19/20, POST 15/18/20.
Miasta-państwa (MP) PRE/POST: Kontynenty T25 12/12, T50 6/6, T100 6/6; Pangea T25 17/17, T50 6/6, T100 6/6. Miasta gracza: 1 (bez akcji).
Miasta założone po starcie, wysoki plon (Łąka/Równina) vs niski, T100: Kontynenty PRE 51/7, POST 58/0; Pangea PRE 48/9, POST 50/5. T50: Kontynenty PRE 35/2, POST 36/0; Pangea PRE 22/6, POST 26/3.
Miasta AI na heksie polarnym lub z sąsiadem polarnym (r<=1): 0 we wszystkich biegach i migawkach.
Czas tury (ms, 4 biegi równolegle, load average 20-30 na 4 rdzeniach, więc wartości zawyżone i nie nadają się do porównania z pojedynczym biegiem): Kontynenty PRE mediana 47982 / p95 79697; POST 46835 / 82857. Pangea PRE 44677 / 59481; POST 45916 / 57309. Różnica PRE/POST mieści się w szumie.
Generacja świata: Pangea ok. 94-101 s; Kontynenty 1302-1322 s (przeciążenie CPU przy 4 równoległych biegach).

WNIOSEK: ekspansja AI T100 PRE→POST: 0,0% (Kontynenty) i −2,2% (Pangea), oba w progu −10% … +25%. Waga 0,3 mieści się w progu, więc biegów dla 0,25/0,2 nie wykonano (opcjonalne, niepotrzebne). Efekt jakościowy zgodny z intencją: po poprawce AI zakłada niemal wyłącznie miasta na terenie o wysokim plonie (niski plon 7→0 i 9→5).

OGRANICZENIA (NIE_ZMIERZONO / ostrożność): jedno ziarno na typ mapy (4242), brak wariancji między ziarnami. Pułap miast na cywilizację = 20 widoczny w T100 (wiele cywilizacji na 20), co ściska pomiar w górę; granicę +25% ten pomiar sprawdza słabo. Dolny próg (−10%) jest sprawdzany w pełni (nie ma spadku przekraczającego −2,2%), a w turach przed pułapem (T50/T75) różnice wynoszą −1,4%…+1,6%. Wyspy nie mierzone (poza zakresem dispatchu).

TESTY: `gate-node-check.txt` EXIT=0 (node --check obu narzędzi). Pomiar: 4 biegi DONE (flaga `.DONE`, `done:true`, `errors` puste w JSON stanu), `evidence/summary.txt`. Brak testów jednostkowych (temat pomiarowy bez zmian kodu gry).
BLOKADY: brak (ograniczenia powyżej to nie blokady).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator: weryfikacja `evidence/*.json` i `summary.txt` względem raportu; opcjonalnie dodatkowe ziarna lub porównanie T75 (przed pułapem miast).
DEPLOY/PUSH: NIE WYKONANO
Komenda odtworzenia: `node gra/tools/ai-city-live-measure.cjs --prepare <kopia-gra> [--weight 0.25]`; vite build --outDir poza repo; `node gra/tools/ai-city-live-measure.cjs --run --pw <gra z node_modules> --dist <dist> --out <evidence> --label pre|post --typ kontynenty|pangea --seed 4242 --turns 100`; `node gra/tools/ai-city-live-summarize.cjs <evidence>`.
