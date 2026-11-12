STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L3-KOSZT-Q1
GOAL: parytet kosztu Pieniadza i max_hp po zamianie jednostki (UNIT-REPLACE L-3 etap 4) z pinem 07d2fbd72
ZMIANY/COMMIT: oceniany kod 719ee123d (obrona 057b93612); baza 05aaf3922 jest przodkiem (merge-base --is-ancestor OK). Zmienione pliki w allowliscie (domain unit_replace_cost/defs/wiring/playable/mod, tests p6_unit_replace_*, cost_vectors, runs/**). Brak gra/, data/, Cargo.toml/lock, WERSJE.md. git diff --check czysto.
TESTY (zmierzone samodzielnie): fmt --check 0; clippy --all-targets -D warnings 0; cargo test --lib 62 passed; b2_production 17, repin_execute 1, repin_pure 7, cost 4, defs 7, l3 8, l3_state 13 - zielone; 0 ignored, brak oslabionych asercji. Pelny cargo test NIE_ZMIERZONO.
BLOKADY: brak

ROZSTRZYGNIECIE ZARZUTOW
1. Regresja etykiet trudnosci: ODDAL (naprawione w 057b93612). Mapowanie Latwy/Trudny/Normalny + klucze angielskie zgodne z pinem main.ts:44372-44374 (sprawdzone git show); testy jednostkowe 6 etykiet + e2e dla kazdej.
2. Brak wektorow produkcyjnych: ODDAL. Sekcja productionMoney (9504 wpisow, 15 civ, tempa, trudnosci) porownywana przez production_replace_defs_for_civ; test per civ zielony.
3. Tautologia e2e: ODDAL. Test uzywa literalow (zulusi/normalny/Procarz: 14/14/28, HP 16, kategoria procarz) dla 6 etykiet + test negatywny.
4. PLAYABLE_UNIT_PROGRESS=0: ODDAL jako ograniczenie, nie parytet. USTALENIE: HP w sciezce gracza zgodne z pinem tylko dla jednostek bez awansu/weterana (stan nie ma battlesSurvived/parametryBonusProc).
5. Odstepstwo od allowlisty (wariant PlayableError, mapowanie trudnosci): ODDAL - trudnosc jest wejsciem unitMoneyCost, zakres playable.rs ograniczony do zrodla kosztu/HP; jawnie opisane.

DO DECYZJI CZLOWIEKA: (a) rozbieznosci danych units.json Rust vs pin: Konnica 22 vs 44, Jezdziec chinski 28 vs 56 (zadanie 27, nierozstrzygniete; test tylko wypisuje); (b) zalozenie zrodel stanu: civ=params.civ_id, tempo=advanced.unit_cost_pace, trudnosc=params.difficulty.
UWAGA: teza "tylko zulusi maja rabat kosztu jednostek w pinie" pochodzi z obrony, nie byla weryfikowana niezaleznie poza zielonymi wektorami.

RUNDY: 2/5 (r1 Operator + obrona, FC)
NASTEPNY KROK: integracja orkiestratora (fast-forward galezi wip), potem READY_FOR_DEPLOY wg procesu
DEPLOY/PUSH: NIE WYKONANO
