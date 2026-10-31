STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1
GOAL: P6.8I - port `auto-improvements.ts` (pickAutoImprovements, 1049 LOC) i `relief-preserving-improvements.ts` (C5) do Rust.
ZMIANY/COMMIT: commit kodu z tą partią (SHA w `git log -1` gałęzi worktree po commicie raportu; SHA kodu = commit z komunikatem "P6.8I partia 8I-P1 relief"). Allowlista: `domain/auto_improvements.rs` + `domain/auto_improvements/relief_preserving.rs` (NOWE), `domain/mod.rs` (+1 linia), `tests/p6_8i_relief.rs` (NOWY), `tests/p6_8i_vectors/relief.json` (NOWY), `dyspozycje/rust-port/p6/P6-8I-AUTO-ULEPSZENIA.md` (NOWY), run dir. Brak zmian w `gra/`, `src-tauri/`, `renderer/`, `WERSJE.md`, `Cargo.toml`. Push: NIE WYKONANO.
TESTY:
- `cargo test --test p6_8i_relief` (CARGO_TARGET_DIR=/dev/shm/p6-8i-relief): 8 passed, 0 failed, EXIT=0 (`logs/gate-p6-8i-relief-test.txt`).
- Wektory: pin 91dc998a, transpilacja TS->JS w pamięci (`gen-p6-8i-relief-vectors.mjs`): 34 klucze, 16 list warstw.
- Mutacje (`mutacje/mutate-relief.sh`, wynik `mutacje/relief-wynik.txt`): 8/8 KILLED (M1 legacy kopalnia, M2 prefiks contains, M3 all->any, M4 pusta lista, M5 tartak, M6 return explicit, M7 legacy usunięte, M8 negacja).
- `git diff --check` czysty (staged).
- NIE wykonano: pełny zestaw `cargo test` i pomiary długie (poza zakresem partii).
BLOKADY:
1. ZAKRES: TYLKO 8I-P1 relief (C5). NIE spisane: `pickAutoImprovements` (8I-P2, 633 LOC), stałe `AI_IMPROVEMENT_PRIORITY`/`ULEPSZENIA_*`/`ZERO_YIELD_IMPROVEMENTS`/`JEDEN_NA_ILU_OBYWATELI`/`WYRAB_MIN_FOREST_IN_RADIUS`/`AUTO_ULEPSZENIA_PRACA_RESERVE`, `hasNonFoodResourceDeficit`, `freshSurplusReport`, `prioritiesForUlepszeniaFocus` (8I-P1 reszta), 8I-P3. Temat NIE jest zamknięty.
2. ROZBIEZNOŚĆ PINU (ZAŁOŻENIE, do decyzji Evaluatora): pin 91dc998a ma `tartak` w jawnych kluczach relief (commit b3cc4c5d4); gałąź bazowa (HEAD, gra/ z 85932371c) nie ma. Pin nie jest przodkiem HEAD. Port i wektory idą za pinem zgodnie z dispatchem; wersja z HEAD różni się jednym kluczem.
3. Z dispatchu nie wykonano: `git fetch origin rust-port/parity-v2` potwierdzone (HEAD zawiera parity-v2), ale pełna weryfikacja silnika 1940/0 nie była w zakresie tej partii.
4. Polecenie w głównym wątku (scalenie do main, push) NIE wykonane przeze mnie: rola Operator nie integruje i nie pushuje (CLAUDE.md, bariery). Należy do orkiestratora po Final Control.
RUNDY: 1/5 (po limicie: n/d)
NASTĘPNY KROK: Evaluator weryfikuje relief (mutacje, wektory z pinu, decyzja ws. `tartak`); następnie NASTĘPNA-PARTIA 8I-P1 (stałe i proste helpery) i 8I-P2 (`pickAutoImprovements` z zależnościami `buildImprovementQualifier`, `cityTerritoryRadius`, `hexKeysWithinRadius`).
DEPLOY/PUSH: NIE WYKONANO
