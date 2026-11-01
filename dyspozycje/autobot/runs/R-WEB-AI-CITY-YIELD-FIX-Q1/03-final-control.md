STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-YIELD-FIX-Q1
GOAL: Naprawic dopasowanie terenu w `hexCityScore`, zmierzyc wplyw na ekspansje AI, ograniczyc skalowaniem wagi plonu; decyzja o wdrozeniu nalezy do orkiestratora/wlasciciela.

ZMIANY/COMMIT: SHA do integracji: `8ce134b812c092be1b38a6bce5ca2abd848e95f1` (obejmuje `496865102` Operatora, baza `c99ac58cd`). Ten raport FC jest osobnym commitem na wierzchu (SHA w odpowiedzi koncowej).
Allowlista zweryfikowana (`git diff --name-status c99ac58cd 8ce134b81`): gra/src/game/ai.ts (M), gra/data/ai-params.json (M, nowy klucz `ekspansja_waga_plonu_heksu`=0.3), gra/tools/ai-city-yield-test.cjs i ai-city-count-sim.cjs (A), reszta w runs/R-WEB-AI-CITY-YIELD-FIX-Q1/. Poza allowlista: 0 plikow. `git diff --check`: czysto.

TESTY (samodzielnie na 8ce134b81): `npm ci --ignore-scripts` ok; `node gra/tools/ai-city-yield-test.cjs` = 42 PASS, 0 FAIL; `tsc --noEmit` EXIT=0; `gate-tsc.txt` = jedna linia `EXIT=0`. Tabela `evidence-sim-table-sensitivity.txt` spojna z deklaracja (PRE 130; w0.2 130; w0.25 i w0.3 135 = +3.8%; w1 638 = +390.8%). Nie powtarzano: pelnej symulacji 15 map ani 54 testow ai-* (wg Operatora/Evaluatora; Evaluator odtworzyl Pangea/ziarno 4: 5->10).

ROZSTRZYGNIECIE ZARZUTOW:
1. Brak pomiaru pelnej gry (NIE_ZMIERZONO): DO DECYZJI CZLOWIEKA. Niewykonalne w ramach Bash <=590 s bez tla (ok. 1 h/bieg); realna decyzja produktowa: przyjac pomiar zastepczy czy zlecic 1 bieg (1 mapa x 100 tur).
2. Zdegenerowana baza symulacji: ODDAL. Ograniczenie metody, jawnie opisane; symulacja daje kierunek, nie tempo absolutne.
3. Waskie plateau wagi: ODDAL. Obrona zmierzyla: 0.20 = brak efektu, 0.25 = 0.30, skok od 0.35. Plateau 0.25-0.30; 0.30 zostaje (kod sprawdzony). Opcja 0.25 (wiekszy margines) = jedna wartosc JSON + jedna asercja, do wyboru orkiestratora. Zaleznosc od powerRank/clusterCenter w realnej grze: NIE_ZMIERZONO (wchodzi w pkt 1).
4. Czwarta kopia mapy id<->nazwa: ODDAL. `economy.ts` poza allowlista, `TERRAIN_NAME_TO_ENUM` nieeksportowane; proponowany osobny temat `R-WEB-TERRAIN-ID-NAME-MAP-UNIFY-Q1`.
5. Mylace dowody: ODDAL (naprawione w obronie; stara tabela = `...w0.4-SUPERSEDED.txt`).
6. Niepelne odtworzenie przez Evaluatora: ODDAL (nie zarzut do kodu; obrona odtworzyla 15 map dla w0.2/w0.25, zgodne z danymi Operatora).
Liczba NAPRAW: 0 -> werdykt nie-FAIL.

BLOKADY: brak blokad technicznych. Otwarte: NIE_ZMIERZONO pelnej gry (decyzja wlasciciela przez orkiestratora).
RUNDY: 1/5 (Operator, Evaluator, obrona, FC)
NASTEPNY KROK: integracja orkiestratora. Kolejnosc wzgledem `origin/rust-port/parity-v2`: niezalezne. Zmiana dotyczy tylko web (`gra/`); roznica `origin/main...origin/rust-port/parity-v2` nie dotyka `gra/`. Baza `c99ac58cd` jest 10 commitow za `origin/main` (f8d7b55ea), ale zadne z nich nie dotyka ai.ts, ai-params.json ani ai-city-*; `git merge-tree origin/main 8ce134b81` czysty. Zalecenie: zintegrowac do `main` w dowolnym momencie, niezaleznie od parity-v2; wdrozenie wagi 0.3 do ROBOCZEJ dopiero po decyzji w pkt 1 (rekomendacja: jedno potwierdzenie w przegladarce).
DEPLOY/PUSH: NIE WYKONANO
