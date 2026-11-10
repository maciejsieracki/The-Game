STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-17-RUST-CLASSIFICATION-Q1
GOAL: P1.17 — klasyfikacja REUSE/ADAPT/REPLACE/UNKNOWN modułów `gra/src/game` (web pin `edb8fb56`, 183 pliki) względem `rust-port/engine` (pin `rust-port/parity-v2` = `9e33fc77`).
ZMIANY/COMMIT: allowlista. Zapisano: `dyspozycje/rust-port/p1/P1-17-RUST-CLASSIFICATION.md` (183 wiersze), `dyspozycje/autobot/runs/R-RUSTPORT-P1-17-RUST-CLASSIFICATION-Q1/01-operator.md`. Brak zmian w `gra/**` i `rust-port/engine/**`. Brak commitów, brak `git add`.
TESTY: nie uruchamiano `cargo test` ani `tsc` (poza zakresem klasyfikacji). Odczyt wyłącznie przez `git show` / `git grep` na commitach `edb8fb56` i `9e33fc77`. Liczba plików: `git ls-tree -r --name-only edb8fb56 -- gra/src/game` = 183.
WYNIK: REUSE 0 | ADAPT 8 | REPLACE 6 | UNKNOWN 169 | suma 183.
  ADAPT: ai.ts, barbarians.ts, auto-battle-power.ts, city-defense.ts, diplomacy.ts, trade-routes.ts, building-stock-cost.ts, improvement-tech.ts.
  REPLACE: combat.ts, turn-economy.ts, population-growth-v85.ts, save.ts, terrain-improvements.ts, playerState.ts.
BLOKADY: brak. Ograniczenia: klasyfikacja oparta na nagłówkach modułów, stałych i sygnaturach (nie na pełnej analizie semantyki); 169 UNKNOWN obejmuje brak odpowiednika oraz pliki bez dość głębokiej weryfikacji.
NOTATKI DLA EVALUATORA: (1) poprawka terenu Desert/Tundra jest już na `parity-v2` (`ai_turn.rs:102`, `barbarians.rs:73-75`); (2) `rng.rs` to LCG, web komentarze mówią Mulberry32 — poza klasyfikacją plików game, zgłoszone do P2.4; (3) REUSE=0: żaden plik nie został zweryfikowany jako semantycznie 1:1 bez adaptacji.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) — adwersarycznie zweryfikować wybrane wiersze ADAPT/REPLACE (dowody path+linia) oraz sumę 183.
DEPLOY/PUSH: NIE WYKONANO
