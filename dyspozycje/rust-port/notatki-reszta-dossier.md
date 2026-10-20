# Notatki czytelnika: archiwum OpenClaw — dispatch / orchestration / process / memory + PLAN §9 + dossier (grep)

- TEMAT: R-RUSTPORT-P0-ARCHIWUM-OPENCLAW-AUDYT-Q1, RUNDA 1/5, rola: Operator (czytelnik)
- Wszystkie porownania galezi: `git ls-tree` / `git show` / `git cat-file -s` na `/home/user/The-Game`. Stan galezi nie byl zmieniany.
- Galezie: `main`=edb8fb56 (18 plikow w `rust-port/engine/src/domain`, 12 w `tests`); `origin/autobot/real24-staging`=78d494c7 (28 / 24; 13 commitow przed main, NIE ancestor main); `origin/hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`=a317fb7a (28 / 24, NIE ancestor main); `origin/hermes/R-RUSTREAL-20-SAVE-LOAD-Q1-RECOVERY-R2-20260915`=5dc5fddc (20 / 14).

## 1. Przeglad zrodel (co jest / status)

### workspace/dispatch/ (8 plikow)
- TG-A2B-P212-LAUNCH-LINK-RECONCILE-20260927-004.md — routing A->B, infrastruktura (pominiete w tresci).
- TG-CTRL-F3-READBACK-RETRY-20260926-001-CANDIDATE.md — kandydat retry callable-boundary Controllera, infrastruktura (pominiete).
- TG-P0-CALIBRATE / -EVALUATE / -FINAL-CONTROL-20260920-001.md — P0 Operator/Evaluator/Final Control, proces; calibrate = INCONCLUSIVE-INFRA.
- TG-P1-01-...-20260920-001.md — P1.1 katalog; status `TERMINAL_PARTIAL / TOOLCHAIN_MISSING` (przeczytany; katalog nie zrobiony).
- TG-P1-PARALLEL-QUALIFIED-20260921-001.md — kwalifikacja P1.2–P1.16 po P0.12 (proces, przeczytany w calosci).
- TG-P2-12-IMPLEMENT-POPULATION-MATRIX-CONTRACT-A-20260925-001-CANDIDATE.md — GAMEPLAY, przeczytany w calosci (patrz sekcja 2, pozycja A).

### workspace/orchestration/ (3 pliki)
- TG-IMPLEMENTATION-GRAPH-20260920-001.md — graf P0–P11 (przeczytany; ~154 wezly, zgodny z PLAN §4).
- TG-CONTROLLER-GRAPH-20260920-001.json (14 346 linii, 641 KB) — graf kontrolera, 156 unikalnych topicId; infrastruktura. Gameplay tylko jako opisy P1/P2/P6 (combat, save/load, population matrix); bez nowych znalezisk.
- TG-A-WATCH-TMP-20260929.js — watchdog, infrastruktura (pominiete).

### workspace/process/ (1 plik)
- AUTOBOT-LOOP-REPAIR-20260921.md — naprawa petli OpenClaw, infrastruktura (pominiete; bez znalezisk gameplay).

### workspace/memory/ (9 plikow .md + dreaming/ + .dreams/)
- 2026-09-20 .. 2026-10-03 (w tym pusty 10-03) + USER-superseded-20260927.md — dziennik routingu/Gatewaya/Controllera. Gameplay: 2026-09-24 (P1.18 requalified `PARTIAL_REQUALIFIED`, P2.12 `INCONCLUSIVE/NOT_ACCEPTED`), 2026-10-02 (delta matrix `PASS_WITH_REFINEMENTS`, ANALYSIS_ONLY, NOT_FORMAL_PASS; R1–R10; 85/85 wierszy).
- dreaming/rem|deep|light (~50 plikow) + .dreams/session-corpus (~15 plikow) — NIE czytane w calosci; grep po slowach gameplay: tylko infra/routing; brak nowych danych gameplay.

## 2. Znaleziska (bardziej dokonczone niz sugeruje audyt? — kazde z dowodem)

A. Population matrix / P2.12 (hunger, cap, health, happinessBase)
- Dowod: dispatch/TG-P2-12-...-CANDIDATE.md: "CANDIDATE_ONLY / NOT_READY / NOT_ENQUEUED", "tests: NOT_RUN", "mutationApplied: false".
- Overlay: worktree-overlays/TG-P2-12-...-20260925-001/untracked/rust-port/engine/tests/population_matrix.rs (10 337 B, 8 testow: s1_owner_mapping..s6_versioning, matrix_to_city_bridge_end_to_end, bridge_fails_closed_for_unresolved_owner) oraz .../untracked/rust-port/engine/src/domain/web_save.rs (3 481 B). Patch .../TG-P2-12-...-20260925-001.patch dotyka TYLKO rust-port/engine/src/domain/mod.rs i lib.rs (+4070 B).
- Brak w: main, real24, hermes/handoff, hermes/RECOVERY (grep `population_matrix|web_save`: 0 trafien we wszystkich 4 galeziach).
- Real24 city_growth.rs ma tylko `apply_hunger_penalty` (V85: "one unfed turn costs one citizen, down to one", bez ulamkowego debtu): lokalizacja rust-port/engine/src/domain/city_growth.rs w real24.
- Status: TYLKO-W-ARCHIWUM-NIEZMERGOWANE (overlay + dirty worktree). Niejasna proweniencja: pliki z 2026-09-27, po kandydacie z 2026-09-25 oznaczonym NOT_RUN. Kompilacja i testy NIE zweryfikowane. Do oceny syntezy.

B. Hot-seat (P1.18) — dwa fotele
- Dowod: dossier linia 28: "Earlier read-only parity review covered P1.18 hot-seat ... `PARTIAL / NOT_VERIFIED` ... evidence/TG-RESUME-P1-18-HOTSEAT-PARITY-READBACK-20260930-1755.md".
- Overlay: worktree-overlays/TG-A-P118-HOTSEAT-TURN-BOUNDARY-20260929-001.patch (22 158 B; playable.rs, playable_slice.rs, src-tauri/frontend/main.js, tests/frontend_contract.cjs; w patchu m.in. `pub human_seat_count: u8`, `pub active_human_seat_id: Option<u64>`) oraz untracked tests/hotseat_turn_boundary.rs (2 testy: one_human_seat..., visible_advance_turn_bridge_command_switches_seats...).
- W real24 playable.rs: `git show remotes/origin/autobot/real24-staging:rust-port/engine/src/domain/playable.rs | grep -i seat` = 0 trafien.
- Status: TYLKO-W-ARCHIWUM-NIEZMERGOWANE. Web: gra/ zawiera civ-hotseat (dossier inwentarz, `.openclaw/tmp/civ-hotseat-drugi-fotel-tura-*`). Do oceny syntezy.

C. P2 bridge/save-load (dirty worktree 78d494c7)
- Overlay: worktree-overlays/TG-RUST-PORT-P2-BRIDGE-SAVELOAD-20260922-001.patch (62 437 B). Dotyka rust-port/engine/src/bridge.rs (+161/-2), domain/ai_turn.rs (+26/-76), improvements.rs (+11/-28), map_generator.rs (+10/-38), pathfinding.rs (+14/-41), trade.rs, barbarians.rs, mod.rs, lib.rs, tests/bridge_contract.rs (+422). Untracked: domain/web_save.rs (7 411 B), domain/assets.rs (4 896 B), tests/assets.rs (6 325 B).
- UWAGA BOUNDARY: patch dotyka `gra/src/map/gen-helpers.ts` (+8/-1) i `gra/src/ui/newGameFlow.ts` (+16). To jest zmiana web w worktree (zakaz `gra/**` wg GOAL). Nie zmergowane do zadnej galezi.
- Ujemne delty (-76 w ai_turn.rs, -41 w pathfinding.rs, -38 w map_generator.rs) — nieweryfikowane co do intencji; do oceny syntezy.
- Status: TYLKO-W-ARCHIWUM-NIEZMERGOWANE (real24 ma save_load.rs 7 499 B, blob 4c129126 — ten sam rozmiar co w worktree, ale web_save.rs/assets.rs NIE).

D. Juz zmergowane poza main (nie w main!)
- Dowod (git cat-file -s, real24 == hermes/handoff, identyczne blob-y):
  - domain/diplomacy.rs 142 417 B, pub items 160, tests/diplomacy.rs 31 #[test]
  - domain/trade.rs 59 413 B, pub items 76, tests/trade.rs 12 #[test]
  - domain/ai_turn.rs 41 143 B, tests/ai_turn.rs 11 #[test]
  - domain/city_growth.rs 18 226 B, tests/city_growth.rs 10 #[test]
  - domain/playable.rs 23 228 B, tests/playable_slice.rs 7 #[test]
  - domain/save_load.rs 7 499 B (real24), tests/save_load.rs 6 #[test]
  - domain/replay.rs, events.rs, turn_economy.rs, pathfinding.rs, tests/parity_suite.rs (11 #[test])
- W main ich NIE MA (git show main:... = missing). Main ma 18 plikow domain, real24 28.
- Status: ZMERGOWANE do real24/hermes; NIEZMERGOWANE do main (main edb8fb56). `git merge-base --is-ancestor real24 main` = NIE.
- Zero TODO/todo!/unimplemented! w tych plikach (grep: 0 w kazdym).
- Porownanie z PLAN §5 pkt 5 ("~24 moduly Rust") — realnie 28 w real24, 18 w main.

E. Systemy bez implementacji w zadnej z 4 galezi (potwierdzenie braku, nie zakladanie)
- forced-war: 0 trafien (`forced.war|forced_war|ForcedWar`) w rust-port/engine/src na wszystkich galeziach. Web: gra/src/game/forced-war-{bronze,common,iron,stone}.ts (inwentarz dossier) — NIE-PORTOWANE.
- culture/religion: real24 tylko odniesienia w diplomacy.rs (`same_religion_trust_per_turn`, `CommonReligion` linie 240–754) — brak systemu kultury; NIE-PORTOWANE jako system.
- wonder/cuda: real24 tylko `wonder_trade_bonus_for_owner` w trade.rs:1450 — brak systemu cudów. NIE-PORTOWANE.
- tech: 4 pliki / 103 linie w real24 (glownie referencje). Do oceny syntezy.
- city-state: real24 14 linii w 5 plikach (czesciowo). Web ma city-state-difficulty.ts, triumph-city-state.ts (inwentarz).
- combat.rs: ten sam blob 5d2b0e15 we wszystkich 4 galeziach (14 190 B) — combat NIE jest bardziej dokonczony na zadnej galezi niz w main. NIE-DOTYCZY do roznic.
- barbarians.rs: ten sam blob 5df47967 w main/real24/RECOVERY (30 156 B). Identycznie.

F. Dossier (grep, 109 234 linii; linie 1–77 = narracja, 78–109 151 = inwentarz)
- Narracja (1–77): 0 trafien dla combat/diplomacy/trade/culture/religion/wonder/technolog/barbarian/city-state/forced-war. Trafienia tylko dla hot-seat (linie 28, 52, 56 — patrz B/C) i save/load (dossier linia 28 "P2 save/load", linia 56 worktree P2-BRIDGE-SAVELOAD).
- Inwentarz (78+): liczby trafien surowych = path-matches, NIE dowod stanu: combat 832, diplomacy 2 267, trade 1 083, culture 173, religion 173, wonder 354, technolog 774, barbarian 894, city-state 179, hotseat 9 079 (8 940 bez `target/`), forced-war 265, save 7 032, load 7 526.
- Wartosciowe sciezki (sample): `worktree/TG-A-P118-HOTSEAT-TURN-BOUNDARY-20260929-001/rust-port/engine/tests/hotseat_turn_boundary.rs` (3 833 B); `worktree/TG-P2-12-...-20260925-001/rust-port/engine/tests/population_matrix.rs` (10 337 B); `worktree/TG-RUST-PORT-P2-BRIDGE-SAVELOAD-20260922-001/rust-port/engine/src/domain/assets.rs` (4 896 B).
- Najbardziej pouczajace (poza main): wszystkie 4 pliki z sekcji D sa w inwentarzu tylko jako `.openclaw/tmp/tg-a-p118-qa-20260929-001/...` (kopie QA) — potwierdzaja, ze diplomacy/trade/barbarians/combat istnieja w kopiach QA.
- TG-WATCHDOG-TICK w inwentarzu dossier: 230 wpisow (liczone w dossier, nie w evidence/ — evidence poza zakresem tej rundy).

## 3. Zalecenia dla syntezy (nie decyzje)
1. Ustalic, czy real24-staging (28 modulow, 215 testow) i hermes/handoff (identyczne bloby) jako baza do P1 — obecne fakty: ma diplomacy/trade/ai_turn/city_growth/playable; nie ma hot-seat, P2.12, forced-war, culture, wonders.
2. Przed P1: rozstrzygnac proweniencje untracked web_save.rs / population_matrix.rs (dispatch NOT_ENQUEUED vs pliki z 2026-09-27).
3. Patch P2 bridge-saveload dotyka gra/ — flaga boundary, nie wolno wchodzic bez wyjatku.
4. Audyt TG-REALIZATION-AUDIT-20260930 NIE byl w zakresie tej rundy (reports/ = inny czytelnik); porownanie wykonane wzgledem main/real24 + PLAN §5, nie wzgledem tekstu audytu.

## 4. Pokrycie
- Przeczytane w calosci: dispatch/TG-P2-12-...-CANDIDATE.md, dispatch/TG-P1-PARALLEL-QUALIFIED-20260921-001.md, orchestration/TG-IMPLEMENTATION-GRAPH-20260920-001.md, PLAN §9 (linie 880–941), dispatch-status P0/P1-01 (naglowki).
- Przejrzane naglowki/grep: pozostale 5 dispatch, process/AUTOBOT-LOOP-REPAIR, orchestration/*.js i *.json, memory/*.md (wszystkie 9 + superseded).
- Pominiete: dreaming/ i .dreams/ (grep only, infra), TG-WATCHDOG-TICK (liczone w dossier, nie czytane w evidence).
- Dossier: linie 1–77 przeczytane w calosci; 78–109 151 tylko grep (bez czytania calosci).
- Nie czytano: worktree-overlays jako calosc (tylko patche naglowki diff --git + untracked wybrane), evidence/, reports/ (poza zakresem tego czytelnika).
- Nic nie kompilowano, nie uruchamiano cargo test, nie zapisano nic poza allowlista.
