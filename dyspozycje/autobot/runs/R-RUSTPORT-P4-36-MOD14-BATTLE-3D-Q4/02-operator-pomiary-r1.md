STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4
GOAL: MOD-14 część 4 (dynamika i efekty) wg §4 P4-36 — port 1:1 do `rust-port/renderer/src/battle/dynamics.rs`, bit w bit z webem (pin `edb8fb56`, three@0.169.0). To wywołanie: Operator „pomiary” (mutacje, pełne bramy, MSRV, niezależny weryfikator) na commicie Operatora-impl.

ZMIANY/COMMIT:
- `dda536f6` (rodzic `773fc8b1` → `d22fb721` → `364a5356` = `origin/rust-port/parity-v2`), worktree `/home/user/The-Game/.claude/worktrees/wf_a609e1dd-a5f-2`:
  - `gen_dynamics.ts` §14 → `dynamics.json` klucz `pomiary` (brama na 9 stylach muru, kierunek `_startRout` obu stron); zdarzenia r1 nietknięte (JSON bez `pomiary` = r1).
  - `battle3d_dynamics.rs`: test `gate_styles_and_rout_facing_match_web`; `dynamics.rs`: tylko 2 testy jednostkowe (logika bez zmian); `mutate_dynamics.py` +2 mutanty (50); README, MANIFEST (20 sum).
  - P4-36: dopisany §38 (58+/0−), w tym Z-36-18 i uzupełnienie dryfu (§37).
  - `dowody/`: `gates-pomiary-r1.txt`, `mutate-dynamics-pomiary-r1.txt`, `verify-gen-pomiary-r1.txt`, `probe-gate-q4.rs.txt`.
- Ten raport: osobny commit. `git diff --name-only 364a5356 HEAD`: 21 plików, wszystkie w allowliście; `gra/**`, `Cargo.*`, moduły spoza `battle/**` bez zmian.

TESTY (surowe logi w `dowody/`):
- Mutacje (1.87.0): przebieg 1 **45/48** — przeżyły `gate band` (realna luka: wektory miały tylko mur `rzym`; mutant zmienia 2 meshe `egipt` i 2 `celtowie`), `gate height rule` (równoważny na wszystkich 9 osiągalnych murach, sonda), `rout west` (kierunek ucieczki nieobserwowany). Po poprawce testów/wektorów: **50/50 zabite**, EXIT=0. Same wektory weba zabijają 4 z 5 mutantów brzegowych; `gate height rule` zabija test sond wyprowadzony ze źródła (Z-36-18).
- `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` i `--features gpu` EXIT=0 na 1.87.0 i 1.97.0; `cargo test --locked --all-targets` **416 passed / 0 failed / 54 binaria** EXIT=0 na 1.87.0 i 1.97.0; `battle3d_*` 5+8+5+3, `--lib battle::` 13 — EXIT=0.
- `sha256sum -c` 20/20 EXIT=0; fixtury 11 829 494 B, największy plik 7 228 812 B; `git diff --cached --check` czysty.
- Weryfikator: trzeci katalog (nowy `npm install`, nowy `git archive`) → generator r1 `4c7bcc21…`/`9d5071a4…` bajt w bajt (3/3); rozszerzony w 2 katalogach → `68ae2085…`/`bdb8c7ad…` identyczne. Próbka 11 stałych/reguł z plik:linia zgodna.
- Dryf: `cc2c6a50`, 13 plików +835/−221; zmienione metody części 4: `_startRout`, `_breachWallTile`, `_startFade` oraz dodatkowo `_endDeployPhase` (`formationRank`, logika) — wszystko logika.

BLOKADY: brak. Uwagi: ocena wzrokowa NIE_ZMIERZONO (§36); wpływ dryfu na wektory NIE_ZMIERZONO; `cargo test --features gpu` nieuruchomione (jak Q2/Q3). Katalog `cargo-target-shared/wf_a609e1dd-a5f-2` i scratch usunięte po pracy.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator → Obrona → Final Control → integracja orkiestratora (commity `d22fb721`, `773fc8b1`, `dda536f6` + ten raport).
DEPLOY/PUSH: NIE WYKONANO
