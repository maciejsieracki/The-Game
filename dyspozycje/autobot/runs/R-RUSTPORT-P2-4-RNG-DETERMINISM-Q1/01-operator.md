STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-4-RNG-DETERMINISM-Q1
GOAL: Weryfikacja faktów zgodności RNG web (edb8fb56) vs rust-port/engine (parity-v2 9e33fc77). Wynik: NIEZGODNE dla pełnej sekwencji generatora; prymitywy mulberry32/permutacja/offsety ZGODNE liczbowo.
ZMIANY/COMMIT: NOWY plik dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md; ten plik run. Brak zmian w gra/** i w kodzie Rust. Brak commita (poza zakresem roli Operatora).
TESTY: Skrypty w scratchpadzie (poza repo): web_rng.js (kopia mulberry32/hashInt3/buildPermTable z gen-helpers.ts) vs rust_rng.rs (kopia z map_generator.rs, rustc -O). Siedem seedów (42, 43, 1, 999999, 4000000, 4100000, 4294967295): mulberry32 20000 wartości IDENTYCZNE, permutacja IDENTYCZNA, hashInt3 IDENTYCZNY dla seedów 4000000/4000001/4010000/4100000 (0 różnic), RÓŻNY dla 4100001, 4200001, 4294967295 (216/216) — zakres NIEMONOTONICZNY, nie „≤4100000". Dryf web mulberry32 od dokładnej arytmetyki u32: 1-based 4917758–4917760 zależnie od seeda (seed 42: 4917759). hashq.js: 3980/4000 (R1) i 3981/4000 (Evaluator) losowych seedów z [4.0e6, 2^32) daje inny hashInt3. Korekty po zarzutach Evaluatora: patrz dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md.
BLOKADY: brak. Niezweryfikowane: liczba i kolejność wywołań RNG dla typów pangea/wyspy (oznaczone w raporcie); pełna liczba wywołań mapy przed dryfem 4.9M nie zmierzona.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Haiku 5.5 medium) adwersaryjna kontrola P2-4-RNG-DETERMINISM.md; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
