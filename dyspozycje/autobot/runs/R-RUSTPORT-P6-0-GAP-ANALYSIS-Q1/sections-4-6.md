
## 4. Walidacja pomiaru po stronie Rust (pin e810d0d3)

Uruchomione w worktree, `CARGO_INCREMENTAL=0`, osobny `CARGO_TARGET_DIR` (usunięty po zakończeniu). Surowe wyjścia w katalogu runu:

| Bramka | Komenda | Wynik | Plik surowego wyjścia |
|---|---|---|---|
| fmt | `cargo fmt -- --check` (w `rust-port/engine`) | EXIT=0 | `rust-fmt-check.log` |
| clippy | `cargo clippy --all-targets -- -D warnings` | EXIT=0 | `rust-clippy.log` |
| test | `cargo test` | EXIT=0; wszystkie `test result: ok` (łącznie 373 testów wg listy) | `rust-test.log` |
| lista testów | `cargo test -- --list` | 373 testów | `rust-test-list.txt` |

Stan Rust: 28 plików `domain/**`, 9 plików `data/**` (w tym `mod.rs`), `bridge.rs`, `steam_adapter.rs`, `lib.rs`, `logging.rs`, `version.rs`; razem 22 509 linii (łącznie z pustymi/komentarzami; `rust-inventory.tsv` podaje LOC niepuste per plik).

## 5. Lista nowych, nieportowanych systemów oraz rzeczy, których web nie ma a Rust ma

### 5a. Nowe / nieportowane systemy (web ma, Rust nie ma lub ma tylko slot)

| System | Pliki web (LOC niepuste) | Dowód braku w Rust | Uwagi |
|---|---|---|---|
| Wymuszone wojny i fale (forced-war-*) | `forced-war-common.ts` 389, `forced-war-bronze.ts` 258, `forced-war-iron.ts` 271, `forced-war-stone.ts` 151, `forced-war-waves.ts` 275 — razem **1344** | `grep -rli forced rust-port/engine/src` — brak trafień | Plan wskazuje jako nowy, nieportowany system (P6.12). Przed implementacją wymaga decyzji o źródle prawdy (web) i wektorów z weba (NIE_ZMIERZONO). |
| Religia i kultura (culture-religion) | `culture-religion.ts` 1365 | Rust ma jedynie pole `culture` w `domain/turn_economy.rs:32` oraz parametry zaufania zależne od religii w dyplomacji (`domain/diplomacy.rs:247-248, 551`, `wspolna_religia`); brak modułu religii i logiki kultury | P6.16. Rozmiar L. |
| Warunki zwycięstwa | `victory.ts` 210 (`checkVictory`, `victory.ts:204`) | Rust ma jedynie slot `TurnPhase::Victory` (`domain/events.rs:60`) bez logiki | P6.19. Rozmiar S–M. Najmniejszy zysk przy największym ryzyku semantycznym (tryby zwycięstwa). |
| Absorpcja city-states i wsp. | `ai-cs-absorption.ts` 263, `ai-major-absorb.ts` 73 | brak trafień po nazwie w `domain/barbarians.rs` ani `domain/ai_turn.rs` (heur.) | P6.18 / P6.11 |

### 5b. Rzeczy, których web (w `gra/src/game/**`) nie ma, a Rust ma

| Element Rust | Dowód | Komentarz |
|---|---|---|
| `domain/replay.rs` (456 LOC, 47 pub fn) | `grep -rli replay gra/src/game` — brak; trafienia tylko w `map/`, `battle/`, `main.ts` (UI/mapa) | Reprodukowalny replay to wymóg P6.22 — po stronie web brak odpowiednika w `game/`, więc parytet 1:1 nie jest możliwy; wymaga decyzji o specyfikacji (ZAŁOŻENIE do dokumentu: replay jest nową funkcją Rust, testowaną wewnętrznie). |
| `domain/ids.rs` (typowane identyfikatory) | web używa `number` (id) | Konstrukt techniczny Rust, NIE-DOTYCZY parytetu funkcjonalnego. |
| `domain/rng.rs` (generator RNG) | web: mulberry32 w `gra/src/map/gen-helpers.ts` i `map/generator.ts` (nie w `game/`) | Rust ma własny RNG w domenie; parytet sekwencji RNG wymaga wektorów (NIE_ZMIERZONO). |
| `steam_adapter.rs`, `version.rs`, `logging.rs` | brak odpowiednika w `game/` | Platforma/adapter — NIE-DOTYCZY dla gameplay parity. |
| `bridge.rs` | adapter Tauri (`bridge.rs:*`) | NIE-DOTYCZY; wchodzi w P7. |

## 6. Propozycja backlogu P6 (wersja robocza do zatwierdzenia przez orkiestratora)

ZAŁOŻENIA (rozstrzygnięcia luk, zapisane zgodnie z dispatchem): (1) gameplay wzorcem jest web pin `edb8fb56`; (2) forced-war i religia są portowane (nie pomijane); (3) replay (Rust-only) zostaje, ale jego parytet nie jest wymagany; (4) każdy temat implementacyjny ma wektory z weba zebrane w osobnym temacie P6.0-V (NIE_ZMIERZONO do czasu tego tematu).

Rozmiary: S < 300 LOC web, M 300–1000, L 1000–2000, XL > 2000 (wg sumy LOC niepuste z `web-inventory.tsv`). Allowlisty są **propozycją** (ścieżki Rust); każdy temat dostaje własną allowlistę w dispatchu.

| ID tematu | Zakres (punkt P6) | Allowlista Rust (propozycja) | Zależności | Rozmiar | Równoległość |
|---|---|---|---|---|---|
| R-RUSTPORT-P6-1-STAN-STARTOWY | P6.1 seed, hot-seat, właściciele, pierwsze miasto | `domain/playable.rs`, `domain/player.rs`, `domain/unit_epoch.rs`, `domain/state.rs`, `tests/` | P5 zamknięte | M | start |
| R-RUSTPORT-P6-2-KOMENDY | P6.2 walidacja komend (`order.ts`), transakcyjność | `domain/types.rs`, `domain/session.rs`, `tests/` | P6.1 | S | po P6.1 (wspólny `types.rs`) |
| R-RUSTPORT-P6-3-TEREN | P6.3 przechodniość, koszty ruchu, ulepszenia terenu | `domain/terrain.rs`, `domain/improvements.rs`, `domain/pathfinding.rs` | P6.1 | M | po P6.2 |
| R-RUSTPORT-P6-4-JEDNOSTKI-RUCH | P6.4 ruch, zbiórka, zwiad, wsiadanie (`pathfinding.rs`) | `domain/pathfinding.rs`, `domain/recruitment.rs`, `tests/` | P6.3 | L | sekwencyjnie z P6.3 (`pathfinding.rs`) |
| R-RUSTPORT-P6-5-JEDNOSTKI-ZYCIE | P6.5 manpower, HP, upgrade, łączenie armii | `domain/recruitment.rs`, `domain/combat.rs` (tylko bonusy budynków) | P6.4 | M | sekwencyjnie z P6.4 (`recruitment.rs`) |
| R-RUSTPORT-P6-6-MIASTA-ZAKLADANIE | P6.6 zakładanie, granice, domyślne miasta, widoczność | `domain/state.rs`, `domain/terrain.rs` | P6.5 | M | po P6.5 |
| R-RUSTPORT-P6-7-MIASTA-WZROST | P6.7 wzrost populacji, jedzenie, bramki budowy | `domain/city_growth.rs`, `domain/building_costs.rs` | P6.6 | L | sekwencyjnie z P6.6 (`state.rs`) |
| R-RUSTPORT-P6-8-MIASTA-EKONOMIA | P6.8 produkcja, zasoby, utrzymanie, okolica, budynki | `domain/resource_production.rs`, `domain/turn_economy.rs`, `domain/improvements.rs` | P6.7 | XL (wieloetapowy: 8a produkcja, 8b utrzymanie, 8c okolica) | sekwencyjnie z P6.7 |
| R-RUSTPORT-P6-9-TURA | P6.9–P6.10 początek/koniec tury, `eot-event-defer`, tempo | `domain/turn_economy.rs`, `domain/events.rs` | P6.8 | M | po P6.8 (wspólny `turn_economy.rs`) |
| R-RUSTPORT-P6-11-AI | P6.11 priorytety, ekspansja, moc, ranking (`domain/ai_turn.rs` 1298 LOC niepuste; web `ai.ts` 5656 LOC) | `domain/ai_turn.rs`, `domain/power*` (nowy), `data/derived.rs` | P6.9 | XL (11a priorytety, 11b moc/ranking, 11c mgła) | 11a–11c sekwencyjnie (`ai_turn.rs`) |
| R-RUSTPORT-P6-12-AI-WOJNY (NOWY SYSTEM) | P6.12 forced-war (5 plików, 1344 LOC web), cykl armii, głód | `domain/forced_war.rs` (nowy), `domain/ai_turn.rs` (tylko wywołanie) | P6.11 | L | równolegle z P6.13 po P6.11 (różne pliki), sekwencyjnie względem 11 |
| R-RUSTPORT-P6-13-WALKA | P6.13 walka, auto-walka, oblężenie, straty, łup | `domain/combat.rs`, `data/units_combat.rs` | P6.4, P6.9 | L | równolegle z P6.12 |
| R-RUSTPORT-P6-14-DYPLOMACJA | P6.14 relacje, traktaty, audiencje, aneksja, PN | `domain/diplomacy.rs` (3849 LOC Rust — rozbić na 14a propozycje/traktaty, 14b bilans AI, 14c katalog wartości) | P6.9 | XL | 14a–14c sekwencyjnie (`diplomacy.rs`) |
| R-RUSTPORT-P6-15-HANDEL | P6.15 szlaki, handel zasobami/technologią/walutą | `domain/trade.rs` | P6.14 (wspólne typy dyplomacji) | L | po P6.14 (dotyka zachowań dyplomacji) |
| R-RUSTPORT-P6-16-KULTURA-RELIGIA (NOWY ZAKRES) | P6.16 kultura, religia (`culture-religion.ts` 1365) | `domain/culture.rs` (nowy), `domain/turn_economy.rs` (pole culture) | P6.9 | L | równolegle z P6.13/P6.14 (nowy plik) |
| R-RUSTPORT-P6-17-TECHNOLOGIE-CUDA | P6.17 drzewko technologii, cuda (`wonders-data.ts` 279, `tech-tree.ts` 142) | `data/buildings_tech.rs`, `domain/improvements.rs` | P6.8 | M | równolegle z P6.13 (różne pliki) |
| R-RUSTPORT-P6-18-BARBARZYNCY-PANSTWA | P6.18 barbarzyńcy, city-states, nagrody wiosek | `domain/barbarians.rs` | P6.13 (wspólne wywołania walki) | M | po P6.13 |
| R-RUSTPORT-P6-19-ZWYCIESTWO | P6.19 warunki zwycięstwa/porażki (`victory.ts`, slot `events.rs:60`) | `domain/events.rs`, `domain/victory.rs` (nowy) | P6.9, P6.14, P6.17 | S–M | po P6.17 |
| R-RUSTPORT-P6-20-SAVE | P6.20 zapis | `domain/save_load.rs` | P6.1–P6.19 (stan kompletny) | M | po domknięciu stanu |
| R-RUSTPORT-P6-21-LOAD | P6.21 wczytanie, wersjonowanie, błędne pliki | `domain/save_load.rs` | P6.20 | M | sekwencyjnie z P6.20 |
| R-RUSTPORT-P6-22-REPLAY | P6.22 replay (Rust-only, `domain/replay.rs`) | `domain/replay.rs` | P6.20 | M | po P6.20 |
| R-RUSTPORT-P6-23-TESTY | P6.23 testy funkcjonalne i regresyjne per moduł | `rust-port/engine/tests/**` | każdy moduł | L | ciągły, wewnątrz każdego tematu |
| R-RUSTPORT-P6-24-EVALUATOR | P6.24 niezależny Evaluator całości gameplay | brak zmian kodu | P6.1–P6.23 | M | na końcu |

### 6a. Kolejność i krytyczna ścieżka

Krytyczna ścieżka (sekwencyjna): **P6.1 → P6.2 → P6.3 → P6.4 → P6.5 → P6.6 → P6.7 → P6.8 → P6.9 → P6.11 → P6.13 → P6.14 → P6.15 → P6.20 → P6.21 → P6.24**.

Równoległe gałęzie poza ścieżką krytyczną (po zakończeniu P6.9 lub P6.11): P6.12 (forced-war) ‖ P6.13 (walka) ‖ P6.16 (kultura/religia) ‖ P6.17 (technologie/cuda); P6.18 po P6.13; P6.19 po P6.17; P6.22 po P6.20. Tematy dotykające tych samych plików muszą być sekwencyjne: `pathfinding.rs` (P6.4 z P6.3), `recruitment.rs` (P6.5 z P6.4), `state.rs` (P6.6 z P6.5), `turn_economy.rs` (P6.9 z P6.8 i P6.16), `ai_turn.rs` (P6.11 i P6.12 w części wywołań), `diplomacy.rs` (P6.14, 14a–c), `trade.rs` (P6.15, w tym mapowanie `diplomacy-*-trade`).

Równoległość w praktyce: maksymalnie 3–4 tematy jednocześnie w fazach P6.12/P6.13/P6.16/P6.17 (pliki rozłączne); w reszcie sekwencyjnie.

## 7. Zero zmian poza allowlistą — samokontrola

Zmienione/dodane w tym temacie: wyłącznie `dyspozycje/rust-port/p6/P6-0-GAP-ANALYSIS.md` (nowy) oraz `dyspozycje/autobot/runs/R-RUSTPORT-P6-0-GAP-ANALYSIS-Q1/**`. Brak zmian w `gra/**`, `rust-port/**`, `src-tauri/**`. Build Rust był wyłącznie odczytowy (`fmt --check`, `clippy`, `test`, `test --list`) i nie zmienia plików w repo (Cargo.lock nie jest śledzony i nie został dodany do commita).

## 8. NIE_ZMIERZONO (jawna lista)

- Wektory referencyjne z uruchomionego weba dla żadnego modułu (zakaz uruchamiania weba w tym temacie).
- Równoważność funkcji 1:1 (status PORTOWANE-1:1 = 0 wierszy).
- LOC per funkcja po stronie Rust oraz per eksport web → Rust (w tabeli §3 LOC Rust to LOC całego modułu docelowego, nie funkcji).
- Pełna lista krawędzi grafu zależności (wyprowadzalna z `web-inventory.tsv`, nie policzona ręcznie w dokumencie).
- Rozbieżność liczby plików: dispatch i plan mówią ~179, pomiar `git ls-tree -r --name-only edb8fb56 gra/src/game` daje **183**; w dokumencie obowiązuje 183.
