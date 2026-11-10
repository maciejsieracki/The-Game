# Notatki czytelnika: ledger TG-PLAN-IMPLEMENTATION-20260920-001 (systemy gameplayu)

- Temat: R-RUSTPORT-P0-ARCHIWUM-OPENCLAW-AUDYT-Q1, runda 1/5, operator-czytelnik (Haiku 5.5, medium).
- Źródło: `/home/user/the-game-transfer-extracted/workspace/ledger/TG-PLAN-IMPLEMENTATION-20260920-001.md` (4075 linii, 274 965 B), przeczytane w całości (6 odcinków, do linii 4075).
- Weryfikacja gitowa: gałęzie z P0 (`edb8fb56` main, `78d494c7` real24-staging, `a317fb7a` handoff, `5dc5fddc` recovery-R2) oraz `worktree-overlays/` z archiwum. Nie uruchamiano `cargo` (liczby testów są z odczytu źródeł, nie z uruchomienia).
- Legenda: **ZMERGOWANE** = kod istnieje w commitowanym drzewie gałęzi; **NIEZMERGOWANE** = istnieje tylko w patchu/untracked w `worktree-overlays/`, albo nigdzie w kodzie; **NIE-DOTYCZY** = audyt web bez zmian w Ruście.

## 1. Stan gałęzi względem ledgera (kluczowe)

- `main` (edb8fb56) ma w `rust-port/engine/src/domain/`: barbarians, building_costs, combat (plik, bez `pub mod`), hex, improvements, map_generator, recruitment, resource_production, terrain, unit_epoch (plik, bez `pub mod`). Brak: city_growth, diplomacy, trade, ai_turn, turn_economy, events, pathfinding, playable, save_load, replay, web_save, assets.
- `78d494c7` (real24) i `a317fb7a` (handoff) mają dodatkowo city_growth (10 testów), diplomacy (31), trade (12), ai_turn (11), turn_economy, events, pathfinding, playable. Nie są przodkami `main` (`git merge-base --is-ancestor`: nie).
- `5dc5fddc` (recovery) deklaruje `pub mod save_load;`; pozostałe trzy gałęzie nie.
- `combat` nie jest zadeklarowany w `domain/mod.rs` w żadnej z 4 gałęzi (grep: 0 trafień). `ai_turn`, `unit_epoch`, `save_load`, `replay` też nie w `real24`/`main`. To potwierdza orphan-finding P1.18 i pokazuje, że problem dotyczy także `main`.
- Gałąź bazowa P2.12 `54fc0af8` istnieje lokalnie, ale nie jest przodkiem `main` ani `78d494c7`.

## 2. Chronologia systemów gameplayu z ledgera

| Data (UTC, nagłówek ledgera) | ID / temat | System | Status wg ledgera | Status w gitcie | Ledger (linie) |
|---|---|---|---|---|---|
| 2026-09-22 | TG-B-P1-3…7 | Start, epoka, cywilizacje (15), ustawienia, liczba cywilizacji | PASS (UI) | NIE-DOTYCZY | 1372–1406 |
| 2026-09-22 | TG-B-P1-6 | Liczba cywilizacji zależna od rozmiaru mapy; bug steppera Super Huge | PASS, bug UI | NIE-DOTYCZY | 1433–1447 |
| 2026-09-22 | TG-B-P1-8 | Generowanie świata; zawieszenie przy mapie Standardowej | PASS z flagą | NIE-DOTYCZY | 1449–1513 |
| 2026-09-22 | P1.11–P1.14 | Katalogi assetów, danych, komend, mechanik | PASS | NIE-DOTYCZY | 1289–1332 |
| 2026-09-22 | P1.17 | Dane jednostek: Inca + 4 super-jednostki w `gra/data/units.json` | PARTIAL, reuse | ZMERGOWANE (web main; grep w `edb8fb56:gra/data/units.json`: 10 trafień) | 1602–1612 |
| 2026-09-22 | P1.18 | Macierz 45 wierszy; 5 modułów orphan; 6× HexCoord | PARTIAL | NIE-DOTYCZY | 1623–1657 |
| 2026-09-22 19:53 | TG-RUST-PORT-P2-BRIDGE-SAVELOAD-20260922-001 | Save/Load bridge + web save v3 DTO | Operator→Evaluator→FC PASS | **NIEZMERGOWANE**: `bridge.rs` w 78d494c7 ma 6 komend, brak SaveGame/LoadGame; `web_save.rs` nieobecny w 4 gałęziach; patch: `worktree-overlays/…/untracked/rust-port/engine/src/domain/web_save.rs` | 1102–1257 |
| 2026-09-23 02:39–02:54 | P2 bridge replay | GetReplayLog, ReplayRecorder | PASS ×3 | **NIEZMERGOWANE**: `GetReplayLog` tylko w `worktree-overlays/TG-RUST-PORT-P2-BRIDGE-SAVELOAD-20260922-001.patch` (13 trafień) | 1690–1833 |
| 2026-09-23 03:07 | P2.10 | Fixture wire-format replay | PASS (review) | NIEZMERGOWANE (overlay, `tests/bridge_contract.rs`) | 1924–1957 |
| 2026-09-23 03:27 | P2.9 | Mapowanie asset/data ID (`domain/assets.rs`) | PASS (review) | NIEZMERGOWANE (`assets.rs` nieobecny w 4 gałęziach) | 2006–2043 |
| 2026-09-23 08:20 | orphan cleanup | `pub mod` dla `ai_turn`, `combat`, `unit_epoch` | PASS (review) | NIEZMERGOWANE (patch) | 2192–2291 |
| 2026-09-23 09:29 | HexCoord/TerrainType | 4/7 HexCoord, 1/10 TerrainType scalone | FC PASS | NIEZMERGOWANE (patch) | 2293–2473 |
| 2026-09-23 09:54 | Terrain ground-truth bugfix | Desert w `ai_turn` 1→2; Tundra/Polarny nieprzechodni w `trade`/`barbarians` | FC PASS | NIEZMERGOWANE: `78d494c7:…/ai_turn.rs:101` nadal `Self::Grassland \| Self::Plains \| Self::Desert => Some(1)`; `trade.rs`/`barbarians.rs` w 78d494c7: 0 trafień `Mountains \| Self::Tundra` | 2549–2682 |
| 2026-09-23 11:01–11:19 | TG-RUST-PORT-WORLDGEN-PERF-20260923-001 | Wydajność generacji Standardowy (`gra/src/map/gen-helpers.ts`) | Operator READY; Evaluator INCONCLUSIVE/INFRA; FC INCONCLUSIVE/INFRA/DECISION_REQUIRED (F-001 NAPRAW, F-002 decyzja właściciela) | NIEZMERGOWANE (patch dotyka `gra/`); Ziemia 168×120: 131 778 ms, kończy się | 2686–2775 |
| 2026-09-23 12:01 | TG-RUST-PORT-BROWSER-BACK-20260923-001 | Browser Back (`newGameFlow.ts`, `newGameHistory.ts`) | FC PASS funkcjonalnie; agregat INCONCLUSIVE/INFRA | NIEZMERGOWANE (patch + untracked w `gra/src/ui/`) | 2777–2800 |
| 2026-09-25 19:36 | Decyzja właściciela 1A/2A, P2.12 wariant A | Kontrakt populacji: `PopulationMatrixResolved`, cap −1/0/+1/+2 z klamrą 4..14, dług głodu, mnożnik zdrowia, `happinessBase` | Kontrakt zaakceptowany; implementacja nierozpoczęta | NIEZMERGOWANE | 3444–3476 |
| 2026-09-27 | P2.12 (`3cb9e132…` Flow failed) | Implementacja populacji: `HungerDebt`, `apply_hunger_penalty` w `city_growth.rs`; `tests/population_matrix.rs` (8 `#[test]`) | Rust 117/117 wg odczytu A (nie odtworzone); NOT_PROMOTABLE | NIEZMERGOWANE: untracked w `worktree-overlays/TG-P2-12-…/untracked/` | 3986–4024 |
| brak wpisu | TG-A-P118-HOTSEAT-TURN-BOUNDARY-20260929-001 | Granica tury hot-seat (`tests/hotseat_turn_boundary.rs`, zmiany `playable.rs`, `main.js`) | **Brak wpisu w ledgerze** (grep "P118"/"HOTSEAT": 0) | NIEZMERGOWANE (tylko overlay) | — |

## 3. Systemy wymienione w zadaniu, których ledger nie domyka

- **Combat**: plik `combat.rs` jest w 4 gałęziach, ale nie jest kompilowany do `civ_engine` (brak `pub mod`). Testy działają tylko przez `tests/combat.rs`. Orphan-fix wyłącznie w overlay. NIEZMERGOWANE.
- **AI**: `ai_turn.rs` w `real24`/`handoff` (11 testów), bez `pub mod`. Fix Desert tylko w patchu. NIEZMERGOWANE.
- **Diplomacy**: `diplomacy.rs` w `real24`/`handoff` (31 testów), zadeklarowany. Ledger nie podaje ukończenia. ZMERGOWANE tylko do real24/handoff, NIE do main.
- **Trade**: `trade.rs` w `real24`/`handoff` (12 testów). Fix Tundra tylko w patchu. NIEZMERGOWANE dla poprawki.
- **Barbarians**: `barbarians.rs` w `main` i `real24`/`handoff`. Fix Tundra tylko w patchu.
- **City growth**: `city_growth.rs` w `real24`/`handoff` (10 testów). Mechanika populacji P2.12 tylko w overlay.
- **Economy**: `turn_economy.rs` w `real24`. Ledger wspomina ekonomię tylko w P1.18 (C) i P2.1.
- **Save/load**: w `real24` `save_load.rs` nie zadeklarowany; w `recovery` zadeklarowany. Wersja z bridge i web save v3 tylko w overlay.
- **Replay**: `replay.rs` w `real24`/`handoff`, nie zadeklarowany. Komendy tylko w overlay.
- **Tech, culture, religion, wonder, forced-war, city-state (jako moduł), hot-seat (jako moduł)**: ledger nie ma wpisów o ukończeniu (`forced-war`: 0 trafień, `religion`/`culture`: 0). W kodzie żadnej gałęzi ani overlay nie ma plików o tych nazwach. Wzmianki o `wonder` (2) i `city-state` (2) dotyczą danych webowych lub roll-upu P2.1 ("brak modułu cudów"). Tech w `main` to tylko dokumenty i xlsx.

## 4. Pozycje do oceny syntezy (nie pominięte cicho)

1. **Granica gra/**: patche worktree dotykają `gra/src/map/gen-helpers.ts`, `gra/src/ui/newGameFlow.ts` i untracked `gra/src/ui/newGameHistory.ts`. GOAL zakazuje zmian w `gra/**` w tym projekcie. Ledger opisuje je jako zmiany w worktree, nie w produkcji.
2. **Hot-seat**: overlay `TG-A-P118-HOTSEAT-TURN-BOUNDARY-20260929-001` nie ma wpisu w ledgerze.
3. **Rozjazd main vs real24**: GOAL/P0 pinuje `main` = `edb8fb56` (95 testów), a ledger i P0 wskazują real24 (215). Gameplay (city_growth, diplomacy, trade, ai_turn) jest tylko w real24/handoff.
4. **Niespójność dat w ledgerze**: nagłówki wpisów Operatora często mają czas estymowany (np. linia 2686 vs plik), a w sekcji replay wpis Operatora ma nagłówek późniejszy niż Evaluator (linie 1690/1736). Ledger sam to odnotowuje (linie 1808–1820, 2455–2460).
5. **Rozbieżność trade.rs**: komentarz `trade.rs` mówi o kolejności sąsiadów jako "kontrakcie deterministycznym", ale nie zgadza się z `pathfinding.rs` (linie 2312–2317). Otwarte.
6. **Konflikty gameplayu zamknięte w ledgerze, ale niezmergowane**: Desert (ai_turn 1 vs 2) i Tundra (trade/barbarians przechodni vs nieprzechodni). Dowody web: `terrain-movement.json` (`"Pustynia": 2`, `"Polarny": 99`) wg linii 2493–2525 i 2646–2649. Ledger nie podaje ścieżki do pliku w tym repo; nie weryfikowałem tego osobno.
7. **Liczby testów**: 117/117 (P2.12), 224/224 (po terrain fix) są raportowane przez ledger, nie uruchomione przeze mnie.

## 5. Pokrycie i ograniczenia

- Przeczytane: cały ledger (linie 1–4075). Nieprzeczytane: pliki `evidence/`, `reports/`, `dispatch/`, `orchestration/`, `process/`, `memory/`, `TRANSFER-HANDOFF` (poza zakresem tej rundy, wg dispatchu do innych czytelników).
- Weryfikacja gitowa: `git ls-tree`, `git show`, `git grep` na 4 gałęziach; istnienie plików w `worktree-overlays/` (STATUS.tsv, patch, untracked).
- Nie uruchomiono cargo ani żadnych testów. Nie zmieniono kodu, nie zrobiono commitów.
