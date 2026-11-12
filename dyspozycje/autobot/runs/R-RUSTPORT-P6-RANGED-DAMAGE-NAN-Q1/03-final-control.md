STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-RANGED-DAMAGE-NAN-Q1
GOAL: ranged_shot_damage zgodne z pinem (Math.max(1, Math.round(raw))) dla NaN/Inf; wartosci skonczone bez zmian.
ZMIANY/COMMIT: baza 82bb87fb1 (ancestor OK); kod+obrona 89d836f18. Allowlista zgodna; brak gra/, data/, Cargo.*, WERSJE.md.
TESTY (samodzielnie): fmt EXIT 0; clippy -D warnings EXIT 0; lib 94 ok; p6_ranged_damage_nan 7; formulas 8; petla 3; fieldpower 1; maxnan 2; siege_tactics_blow_full 3. Pin: combat.ts:495 (max/round), :1042 (hpDef -= dmg).
Zarzuty 1-6: wszystkie ODDAL (1: NIE_ZMIERZONO, harness node petli = opcjonalny osobny temat; 2: doc NIE UZYWAC, brak wolajacych w src; 3: damage_exact niesie wartosc; 4: zgodne z pinem; 5: SHA wyliczony niezaleznie przez obrone; 6: pelny cargo test w rundzie integracyjnej).
NAPRAW: brak. DO DECYZJI CZLOWIEKA: brak.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora + pelny cargo test
DEPLOY/PUSH: NIE WYKONANO
