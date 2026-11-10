# Notatki czytelnika: evidence/ — nazwane funkcje (Evaluator/FinalControl/Review/B-RUST-PORT)

Temat: R-RUSTPORT-P0-ARCHIWUM-OPENCLAW-AUDYT-Q1, runda 1/5. Zwrócone inline przez subagenta (zasada
subagenta zabraniała mu zapisu własnego pliku raportu) — zapisane przez orkiestratora z treści
odpowiedzi.

WYNIK ZBIORCZY: żadna z 11 nazwanych funkcji (HexCoord/Terrain dedup, P2 bridge replay, P2 bridge
save/load, Terrain ground-truth bugfix, Worldgen perf, Browser-back, Orphan-module cleanup, P2.9
asset-ID, P2.10 replay fixture, reconcile-dokumenty, blokada P2.12) NIE jest zmergowana do żywej
gałęzi, poza `pub mod save_load;` i `CURRENT_SNAPSHOT_VERSION` obecnymi tylko w
`hermes/R-RUSTREAL-20-SAVE-LOAD-Q1-RECOVERY-R2-20260915`. Kod istnieje jako patch/pliki untracked w
`worktree-overlays/`. Baza patcha SAVELOAD to `78d494c7` = `autobot/real24-staging`.

## Znaleziska

1. **HexCoord/TerrainType dedup** — pełny cykl PASS (`evidence/TG-FINAL-CONTROL-HEXCOORD-TERRAIN-DEDUP-20260923-001.md`).
   NIEZMERGOWANE: real24 ma 6 definicji `struct HexCoord` (ai_turn.rs:28, barbarians.rs:17, hex.rs:9,
   map_generator.rs:102, pathfinding.rs:17, trade.rs:65); 0 trafień `pub use super::hex::HexCoord`.
2. **P2 bridge replay** — pełny cykl PASS (`TG-FINAL-CONTROL-P2-BRIDGE-REPLAY-20260923-001.md`).
   NIEZMERGOWANE: brak `GetReplayLog` i `pub mod replay` we wszystkich 4 gałęziach.
3. **P2 bridge save/load (SaveGame v3 DTO)** — pełny cykl PASS, ale Operator sam raportował
   "PARTIAL/NOT_ACCEPTED" (sprzeczność z FC "consistent, no gaps"). NIEZMERGOWANE: `web_save` brak
   w 4 gałęziach; real24 `bridge.rs:24-40` ma tylko 6 komend.
4. **Terrain ground-truth bugfix** (Desert 1→2, Tundra nieprzejezdna) — pełny cykl PASS. NIEZMERGOWANE
   — błąd nadal żyje w real24/handoff (`ai_turn.rs:101`, `trade.rs:143`, `barbarians.rs:74`). **Istotne
   dla wyboru bazy P0.4/P0.5.**
5. **Worldgen perf** — cykl NIE-PASS (Evaluator INCONCLUSIVE/INFRA, FC INCONCLUSIVE/INFRA/DECISION_REQUIRED).
   Dotyczy `gra/src/map/gen-helpers.ts` (web, poza zakresem Rust).
6. **Browser-back** — cykl NIE-PASS (Evaluator INCONCLUSIVE/INFRA, FC "PASS" ale agregat chain
   INCONCLUSIVE/INFRA). Dotyczy `gra/src/ui/newGameFlow.ts`/`newGameHistory.ts` (web).
7. **Orphan-module cleanup** — odstępstwo od 3-fazowego cyklu (łączony Evaluator+Final-Control,
   `TG-REVIEW-ORPHAN-MODULE-CLEANUP-20260923-001.md`). NIEZMERGOWANE: 0 `pub mod combat|ai_turn|unit_epoch`
   w `domain/mod.rs` żadnej gałęzi.
8. **P2.9 asset-ID** — łączony przegląd PASS. NIEZMERGOWANE: brak `trait AssetKey` w 4 gałęziach.
9. **P2.10 replay fixture** — łączony przegląd PASS. NIEZMERGOWANE.
10. **Dokumenty reconcile** (CURRENT-MAIN-P2-RECONCILE, CONTRACT-RECONCILE, PLAN-READBACK) — NIE-DOTYCZY,
    bez kodu. Uwaga: `54fc0af8` i `78d494c7` NIE są przodkami lokalnego main `edb8fb56` — inna linia historii.
11. **Blokada P2.12** — Evaluator/FC SAVELOAD twierdzili "brak P1.18"; istnieją jednak
    `TG-B-P1-18-BEHAVIOR-RUST-MATRIX-20260922-001.md` (PARTIAL) i `...P2-REQUALIFICATION-...` (PARTIAL_REQUALIFIED).
    Blokada zmieniła się z "brak" na "częściowa" w czasie — do oceny syntezy.

## Do oceny syntezy
- Łączone przeglądy zamiast pełnego łańcucha Operator→Evaluator→Final Control w 3 tematach.
- 2 tematy utknęły w INFRA bez terminalnego PASS (worldgen-perf, browser-back).
- Rozbieżności liczbowe między wpisami (np. czasy worldgen 82s/120s-timeout/131s).
- `worktree-overlays/...P2-12...` (baza `54fc0af8`, inna gałąź niż 4 zweryfikowane w P0) nie był
  w zakresie tego czytelnika — pokrywa go czytelnik worktree-overlays.

## Pokrycie
Przeczytane w całości: 6× TG-EVALUATOR-*, 6× TG-FINAL-CONTROL-*, 3× istniejące TG-REVIEW-*, 13×
TG-B-RUST-PORT-*. Pominięte: 230 plików TG-WATCHDOG-TICK-* (tylko policzone). Poza zakresem tej rundy:
TG-A-*/TG-B-P1-* (poza nagłówkami P1-18), TG-P0-*, TG-B-CONTROLLER-*, ledger, reports/, dispatch/,
orchestration/, process/, memory/. Weryfikacja git na poziomie markerów, nie pełnych diffów.

DEPLOY/PUSH: NIE WYKONANO
