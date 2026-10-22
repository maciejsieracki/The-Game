STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1
GOAL: RR-T2a — kamera (`camera.ts` → maszyna stanów, `pick::camera`) i siatki terenu roblox CPU w `rust-port/renderer`, bitowo zgodne z uruchomionym kodem weba.
ROLA: Operator (obrona r1) wobec Evaluatora PASS-WITH-NOTES. Stan odtworzony z `7de81e7c` (kod `eb30eefc`).
ZMIANY/COMMIT: commit obrony na `7de81e7c` (SHA w raporcie zwrotnym); pliki: `rust-port/renderer/tests/fixtures/camera/{gen.ts,camera.json,README.md}`, `dyspozycje/rust-port/p4/P4-11-CAMERA-TERRAIN-CPU.md` (§0, §5, §8, §10.1, nowy §11), ten plik. `src/**` i `tests/*.rs` bez zmian.
ZARZUTY:
- Z1 (mutant `mx<zone`→`mx<=zone` „równoważny”): PRZYJMUJĘ lukę wektorów / ODRZUCAM równoważność — przy `edgePanZonePx: 0` (`camera.ts:56,117`) mutant daje 0/0 = NaN. Dodany scenariusz `edge-zone-zero` z uruchomionego weba; 4 mutacje granic: stary fixture 0/4 wykrytych (EXIT=0), nowy 4/4 (EXIT=101). Razem 23/23.
- Z2 (6/7 vs 19/19): ODRZUCAM jako sprzeczność — różne zbiory; ocalały mutant Evaluatora teraz wykryty.
- Z3 (Q2, FPS ≠ 60): ODRZUCAM jako zarzut wobec Operatora — rozstrzygnięcie dispatchu, opisane w §1/§7.
- Z4: tekst zarzutów ucięty w logu Evaluatora — dalsze uwagi, jeśli były, nie dotarły (NIE_ZMIERZONO).
TESTY: czysty target `/home/user/cargo-target-shared/wf_5eb5677d-3de-3`: fmt EXIT=0; clippy `--features gpu -D warnings` EXIT=0; clippy `-D warnings` EXIT=0; `cargo test --locked --all-targets` EXIT=0; kamera `scenarios=34 steps=6524 scalars=47892 mismatches=0`. Pełne logi: P4-11 §11.1. Generator odtworzył r1 bitowo (`0f43ae5c…b1bd`) przed zmianą; nowy `camera.json` `4df88095…a1cf`. `git diff --check` czysty; §10.1 = `gen.ts` (diff pusty).
BLOKADY: brak; Z4 jak wyżej.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO
