## 4. Walidacja pomiaru po stronie Rust (pin e810d0d3, runda 2)

Uruchomione w worktree `wf_7d66f2d3-e42-3` na drzewie `rust-port/engine` (zero różnic względem e810d0d3: `git diff e810d0d3 HEAD -- rust-port` puste), `CARGO_INCREMENTAL=0`, osobny `CARGO_TARGET_DIR` w katalogu scratch (usunięty po zakończeniu). Pełne, nieskracane wyjścia z liniami `EXIT=` są w katalogu runu:

| Bramka | Komenda | Wynik | Surowe wyjście (pełne) |
|---|---|---|---|
| fmt | `cargo fmt --manifest-path rust-port/engine/Cargo.toml -- --check` | EXIT=0 | `rust-fmt-check.log` |
| clippy | `cargo clippy --manifest-path rust-port/engine/Cargo.toml --all-targets -- -D warnings` | EXIT=0 (`Finished`, 0 ostrzeżeń) | `rust-clippy.log` |
| test | `cargo test --manifest-path rust-port/engine/Cargo.toml` | EXIT=0; 40 suit `test result: ok`; **373 passed, 0 failed** | `rust-test.log` |
| lista | `cargo test --manifest-path rust-port/engine/Cargo.toml -- --list` | EXIT=0; 373 testów (`: test`) | `rust-test-list.txt` |

Stan Rust: `domain/**` (28 plików), `data/**` (9 plików razem z `mod.rs`), `bridge.rs`, `steam_adapter.rs`, `lib.rs`, `logging.rs`, `version.rs`; `rust-inventory.tsv` podaje LOC niepuste i liczbę pub fn/items/testów per plik (skrypt `inventory_rust.py`).

Wcześniejsze logi z rundy 1 zostały zastąpione pełnymi wyjściami z tej rundy (poprzednie `rust-fmt-check.log` miało tylko 7 bajtów bez komendy i bez linii komendy).

## 5. Lista nowych, nieportowanych systemów oraz rzeczy, których web nie ma a Rust ma

Każdy dowód braku poniżej to komenda wykonana w tej rundzie. „Brak trafień” oznacza 0 linii wyjścia.

### 5a. Nowe / nieportowane systemy (web ma, Rust nie ma lub ma tylko slot/pole danych)

| System | Pliki web (LOC niepuste, `web-inventory.tsv`) | Dowód w Rust | Status tabeli §3 | Uwagi |
|---|---|---|---|---|
| Wymuszone wojny i fale (`forced-war-*`) | `forced-war-common.ts`, `forced-war-bronze.ts`, `forced-war-iron.ts`, `forced-war-stone.ts`, `forced-war-waves.ts` — razem 5 plików, **1344 LOC niepuste**; `forced-war-waves` importowany przez `ai.ts` (import w pliku `ai.ts`) | `grep -rni forced rust-port/engine/src` — **0 trafień** | BRAK (heur.), P6.12 | Plan wskazuje jako nowy, nieportowany system. Źródło prawdy: web (pin edb8fb56). Wektory z weba: NIE_ZMIERZONO. |
| Religia i kultura | `culture-religion.ts` (1365 LOC, 58 eksportów) | Rust: pole `culture` w `domain/turn_economy.rs:32` (magazyn, bez logiki) oraz pola zaufania zależne od religii w `domain/diplomacy.rs:247-248` (`same_religion_trust_per_turn`, `different_religion_trust_per_turn`) i wariant `wspolna_religia` w `domain/diplomacy.rs:551`. Brak modułu religii i brak logiki kultury (`grep -rni religi rust-port/engine/src/domain` — brak funkcji religii). | BRAK (heur.), P6.16 | Parametry dyplomacji nie są logiką religii web. Rozmiar L. |
| Warunki zwycięstwa | `victory.ts` (`checkVictory`, `victory.ts:204`; progi `victory.ts:32-39`) | Rust: tylko slot fazy `TurnPhase::Victory` (`domain/events.rs:60`), bez warunków | BRAK (heur.), P6.19 | Najmniejszy zysk przy największym ryzyku semantycznym (tryby zwycięstwa). |
| Absorpcja city-states i wsp. | `ai-cs-absorption.ts` (263 LOC), `ai-major-absorb.ts` (73 LOC) | brak trafień po nazwie w `domain/barbarians.rs` ani `domain/ai_turn.rs` | BRAK (heur.), P6.18 / P6.11 | — |
| Przejęcie miasta przez AI | `ai-city-capture-executor.ts` (`executeAiCityMove`, `:75`) | jedyny trafień: komentarz `domain/ai_turn.rs:1193` („engine resolves capture”) — nie logika | BRAK (heur.), P6.11 | Korekta rundy 2 (zarzut 6). |
| Obowiązek wojny sojuszu | `alliance-war-obligation.ts` (`shouldHonorAllianceWarObligation`, `:39`) | `grep -rni obligat rust-port/engine/src` — 0 trafień | ISTNIEJE-NIEZWERYFIKOWANE, P6.14 | Korekta rundy 2 (zarzut 9). |
| Start relacji dyplomatycznej | `diplomacy-layers.ts` (`startRelationForPair`, `:42`), używane w `cluster-start.ts:230` | `grep -rni start_relation\|startowa rust-port/engine/src` — tylko pola danych `data/economy_society_part2.rs:362` | BRAK (heur.), P6.14 | Korekta rundy 2 (zarzut 3). |
| Blokada końca tury przez zdarzenia paneli | `side-panel-event-priority.ts` (`isBlockingSidePanelEvent`, `:7`), używane w `main.ts:14264` | `grep -rni blocking rust-port/engine/src` — 0 trafień | BRAK (heur.), P6.10 | Korekta rundy 2 (zarzut 15). |

### 5b. Rzeczy, których web (w `gra/src/game/**`) nie ma, a Rust ma

| Element Rust | Dowód | Komentarz |
|---|---|---|
| `domain/replay.rs` | `grep -rli replay gra/src/game` — **0 trafień** (trafienia w web tylko w `map/`, `battle/`, `main.ts`) | Replay jest Rust-only. Zakładamy (ZAŁOŻENIE), że jest nową funkcją Rust testowaną wewnętrznie; parytet z web nie jest wymagany (P6.22). |
| `domain/ids.rs` (typowane identyfikatory) | konstrukt Rust (`Owner` enum); web używa liczb | NIE-DOTYCZY parytetu funkcjonalnego, ale `LEGACY_REBEL_OWNER_ID = -99` (`domain/ids.rs:45`) to odpowiednik stałej web `REBEL_FACTION_OWNER_ID` (`society-breakdown.ts:206`). |
| `domain/rng.rs` | web: mulberry32 w `gra/src/map/gen-helpers.ts` i `gra/src/map/generator.ts` (`grep -rln mulberry32 gra/src`), nie w `game/` | Sekwencja RNG wymaga wektorów z weba (NIE_ZMIERZONO). |
| `steam_adapter.rs`, `version.rs`, `logging.rs` | brak odpowiednika w `game/` | Platforma/adapter — NIE-DOTYCZY dla gameplay parity. |
| `bridge.rs` | adapter Tauri | NIE-DOTYCZY; wchodzi w P7. |
