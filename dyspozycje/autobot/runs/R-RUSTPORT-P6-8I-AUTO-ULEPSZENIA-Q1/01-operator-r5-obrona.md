STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1
GOAL: Port `auto-improvements.ts` (P1, P2 z E-FORT) oraz relief (P3) z pinu `4bbef081d`.

OBRONA po Evaluatorze r4 (PASS-WITH-NOTES, 3 zarzuty).

Zarzut 1 (mutanty F40, P24, P38 bez dowodu) - PRZYJMUJE. Dopisane wektory z pinu, wszystkie 3 mutanty KILLED:
- F40: `r5-f40-33`, `r5-f40-66`, `r5-f40-152`.
- P24: `r5-nodemand-onlyfort`, `r5-nodemand-false-onlyfort` (+ kontrola `r5-demand-onlyfort-control`).
- P38: `r5-p38-6`, `r5-p38-8`, `r5-p38-9`.
- Wynik zbiorczy: 366 mutantow = 309 KILLED + 56 EKWIWALENT + 1 NIE_ZABITY. Pozostaje P36 (nie zarzucony przez Evaluatora).
- Przy okazji: argument kosztowy dla P36 w dokumencie byl niepelny (kopalnia_zelaza 88 > posterunek 60). Poprawione w dokumencie jako NIE ZABITY,
  z pomiarem diagnostycznym (fbp=true => warunek nieosiagany dla zelaza) i jawnym brakiem pelnego dowodu rownowaznosci.
Zarzut 2 (tolerancja dryfu <= 60) - PRZYJMUJE CZESCIOWO: limit zaostrzony do <= 40 (zmierzone), dokument opisuje pomiar Evaluatora (lata -> 0 dryfu).
Pelne zamkniecie wymaga repinu `territory.rs` (poza allowlista, R-DELTA3-TERRITORY).
Zarzut 3 (liczby w komunikatach commitow) - PRZYJMUJE: nie przepisuje historii; dokument podaje stan faktyczny 2227 scenariuszy, test `>= 2227`.

ZMIANY: `gen-p6-8i-pick-vectors.mjs` (rodziny r5 + tryb SEARCH), `tests/p6_8i_vectors/pick.json` (2227 scen.), `tests/p6_8i_pick.rs` (progi, `P6_8I_LIST`),
`mutacje/{mutate-8i-pick.py,merge-wyniki.py,pick-wynik-r5.txt,pick-wynik-final.txt}`, `gate-r5.sh`, logi `gate-r5-*`, dokument tematu.
Kod produkcyjny portu bez zmian. Nie ruszano `gra/**`, `Cargo.toml`, `WERSJE.md`, `relief_preserving.rs`.

TESTY (`logs/gate-r5-*.txt`, jedna linia `EXIT=` na plik, target na /dev/shm):
- cargo fmt --check EXIT=0; cargo clippy --all-targets -D warnings EXIT=0; git diff --check EXIT=0.
- p6_8i_pick 5/5 + p6_8i_relief 8/8 (DRYF fortNodes = 40, limit 40); wektory 2227 scenariuszy (1285 niepustych), pick.json 3,6 MB.
- cargo test pelny: 1987 passed, 0 failed (260 binariow uruchomionych kolejno, bo jedno wywolanie przekraczalo 590 s przy obciazonej maszynie).
- Mutacje: F40, P24, P38 KILLED (`mutacje/pick-wynik-r5.txt`); P36 nadal NIE_ZABITY (jawnie w dokumencie).
BLOKADY: brak technicznych. Uwagi: P36 bez pelnego dowodu rownowaznosci; dryf territory.rs (40 scen.) do repinu.
RUNDY: 5/5 (r4 Operator + obrona)
NASTEPNY KROK: Final Control (ocena P36 i dryfu).
DEPLOY/PUSH: NIE WYKONANO
