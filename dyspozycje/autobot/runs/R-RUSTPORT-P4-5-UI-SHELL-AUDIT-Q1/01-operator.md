STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-5-UI-SHELL-AUDIT-Q1
GOAL: Audyt powłoki UI webview Tauri przy rendererze 3D w Rust: stan `src-tauri/**`, podział i zależności `gra/src/ui/**`, granica UI↔renderer, opcje szkieletu UI, decyzje `D-UI-n`.
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-5-UI-SHELL-AUDIT.md` (NOWY), ten plik. Commit w worktree Operatora (SHA w odpowiedzi Workflow). Baza `dc4cfdb4`.
TESTY: temat dokumentacyjny — brak buildu/testów kodu (zakaz). `git diff --check` czysty; zmiany wyłącznie w allowliście.
BLOKADY: brak. Pytania o możliwości osadzenia wgpu w Tauri oznaczone NIE_ZMIERZONO i przekazane do P4.3.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO

## Wyniki kluczowe
- P1-17B:12 „siatka DOM” — PRAWDA (`src-tauri/frontend/index.html:150,244`, `main.js:665-693`); siatka prostokątna, heks tylko jako `clip-path`. Zamyka P4-0 §3.4 i §7 pkt 6 (grep był w `rust-port/`, frontend leży w `src-tauri/frontend/`).
- Konfiguracja Tauri z dispatchu potwierdzona (`tauri.conf.json:6-25`); brak `wgpu`/`raw-window-handle` w `*.toml`.
- `gra/src/ui`: 117 `.ts`, 58 177 LOC, 13 kategorii; 49 plików importuje logikę/dane (142 linie z `game/**`, 67 modułów); 11 punktów zależności od renderera (R1–R11), tooltip heksu nie jest kotwiczony w świecie (panel dokowany).
- Opcje: K1/K2/K3 (kotwice heksów), W1/W2 (wejście), S1/S2/S3 (szkielet). Rekomendacje: K3, S1 — nie rozstrzygnięte.
- `D-UI-1..8` i 5 kandydatów-tematów.
