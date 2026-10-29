# REPIN-DELTA-20261029 — delta webu względem pinu portu `edb8fb56` (runda 2)

**Temat:** `R-RUSTPORT-REPIN-DELTA-Q1` · **Runda:** 2/5 (poprawka po zarzutach rundy 1) · **Rola:** Operator · **Status:** dokument, ZERO zmian kodu.

**Pin:** `edb8fb56` · **Cel (web):** `91dc998a5f1b51ad29e0f4785edfd45655445c53` (origin/main w chwili pomiaru). `git rev-list --count edb8fb56..origin/main` = 87; pin jest przodkiem origin/main.

**Zakres:** `git diff --name-only edb8fb56 origin/main -- gra/src gra/data` = **94 pliki** (70 M, 24 A). Pliki poza `gra/src` i `gra/data` (np. `gra/tools`) są poza zakresem klasyfikacji; `gra/tools` użyte są tylko jako wskaźnik (kolumna osobna, heurystyka).

**Port, który trzeba odświeżyć:** silnik Rust `rust-port/engine/` (`src/` 75 plików `.rs`, `tests/` 174 pliki `.rs` i 81 wektorów `.json`, `data/` z kopiami bajtowymi webu), frontend-v2 `src-tauri/frontend-v2/src/` (UI), `src-tauri/frontend-v2/tools/pin-manifest.json`, `rust-port/assets/MANIFEST.tsv`, `rust-port/engine/data/derived/*.json`. Wszystko na `origin/rust-port/parity-v2`. Gałęzie robocze inne niż `parity-v2` nie były sprawdzane.

## 1. Metodyka i komendy kontrolne

Każda liczba poniżej ma komendę (uruchamiane w worktree, `origin/rust-port/parity-v2` i `origin/main` czytane przez `git show`/`git ls-tree`, bez checkoutu):

- Zakres: `git diff --name-status edb8fb56 origin/main -- gra/src gra/data` → 70 M, 24 A; `... | wc -l` → 94.
- Silnik Rust, pliki źródłowe: `git ls-tree -r --name-only origin/rust-port/parity-v2 -- rust-port/engine/src | grep -c '\.rs$'` → **75**.
- Testy Rust: `git ls-tree -r --name-only origin/rust-port/parity-v2 -- rust-port/engine/tests` → **174** plików `.rs`, **81** plików `.json` (wektory, `*_vectors/`), 1 `SHA256SUMS.txt`.
- Cytowania weba w kodzie Rust: `git grep -nE 'gra/(src|data)/[A-Za-z0-9_./-]+\.(ts|json)' origin/rust-port/parity-v2 -- rust-port/engine/src` (np. `domain/combat.rs:218`: `web gra/src/game/combat.ts:638`; `domain/recruitment.rs:209`: `gra/data/units.json`).
- Kopie bajtowe danych: `git show <rev>:<ścieżka> | sha256sum` dla `rust-port/engine/data/{civs,units,econ-params,ui-params}.json` (port) oraz `edb8fb56:gra/data/...` i `origin/main:gra/data/...` (web). Wyniki w §2a.
- Derived: `git grep -l 'edb8fb56' origin/rust-port/parity-v2 -- rust-port/engine/data/derived` → 59 plików (w tym `README.md`); 58 plików `.json` wymienia pin w metadanych; 39 ma pole `pin_web`. Kolumna „Derived pin” w §3 liczy te `.json`, które wymieniają pełną ścieżkę pliku webu (np. `gra/src/game/population-growth-v85.ts` w `racje.json`).
- Manifest assetów: `git show origin/rust-port/parity-v2:rust-port/assets/MANIFEST.tsv` → 428 wierszy danych; żaden `source_web_path` nie wskazuje na jeden z 94 zmienionych plików (sprawdzone skryptem) → kopie assetów NIE wymagają odświeżenia.
- Kopie frontend-v2: `git show origin/rust-port/parity-v2:src-tauri/frontend-v2/src/<ścieżka względna>` porównane sha256 z pinem. `gra/src/main.ts` ma w porcie własny plik `src/main.ts` (ROZNY, osobna implementacja).
- pin-manifest: `src-tauri/frontend-v2/tools/pin-manifest.json` (pole `pin` = `edb8fb56:<ścieżka>`); jedyny zmieniony wpis to `gra/src/ui/armyMergePanel.ts` (sha = pin → po zmianie web kopia jest STARA).
- Typ 3D: plik realnie importuje `three` (`git grep -l "from 'three'" origin/main -- gra/src`, 90 plików w całym `gra/src`, G6 = 13 plików z zakresu; zgodne z listą G6).
- Plan P1/P6 i wskaźnik `gra/tools`: kolumny odziedziczone z rundy 1 (heurystyka tokenowa po nazwie pliku w `dyspozycje/rust-port/**` i `gra/tools/**`); NIE są dowodem portu.

**Słownik kolumn §3:**

- „Zaportowany (Rust)”: `TAK_sciezka` = kod Rust cytuje pełną ścieżkę pliku webu (mocny ślad); `NAZWA` = kod Rust wspomina samą nazwę pliku (słaby ślad, np. komentarz, może być niepowiązany); `NIE_CYTOWANY` = brak śladu. `NIE_CYTOWANY` NIE znaczy „niezaportowany”, tylko „nie znaleziono cytowania”. Zakres i kompletność portu NIE_ZMIERZONO.
- „Pewność typu”: `O` = treść pliku odczytana w tej rundzie; `H` = typ z nazwy i ścieżki (heurystyka, nie czytane wiersz po wierszu).
- „Testy Rust (.rs / .json)”: liczba plików testowych i wektorów portu, w których występuje pełna ścieżka lub nazwa pliku (heurystyka tokenowa). Wektory `*_vectors/*.json` są danymi porównawczymi z webu; przy zmianie pliku źródłowego trzeba je przeliczyć na nowym pinie, nie osłabiać testu.

## 2. Podsumowanie (poprawione)

### 2a. Kopie bajtowe danych (poprawka zarzutu 2)

| Plik | sha256 pin = port (`rust-port/engine/data`) | sha256 origin/main | Zmiana w delcie |
|---|---|---|---|
| `civs.json` | `72a5027ee645…` | `eea384b7d623…` | M (+180/-489) |
| `units.json` | `d2f9916011c2…` | `0e031b60af2b…` | M (+4/-4) |
| `econ-params.json` | `843517551c05…` | `7806a53b191d…` | M (+12/-12) |
| `ui-params.json` | `19d1e1a59736…` | `e2dfbd2a08de…` | M (+26/-0) |

Port ma te cztery pliki jako **kopie bajtowe pinu**. Są osadzane przez `include_str!` (`rust-port/engine/src/data/civilizations.rs:1305` → `civs.json`; `data/economy_society.rs:853` → `econ-params.json`; `data/economy_society_part2.rs:612` → `ui-params.json`; `data/units_combat.rs:15` → `units.json`). Dlatego kopie są do odświeżenia **cztery**, nie jedna. Pin-manifest (frontend-v2) ma jedną kopię (`armyMergePanel.ts`). Razem: **5 kopii bajtowych do odświeżenia** (4 w `engine/data`, 1 w `frontend-v2`). Manifest assetów: 0.

Nowe pliki (A) w `gra/data`: `army-consolidation-params.json`, `diplomacy-tick-params.json`, `war-allin-params.json`, `war-rules-params.json` nie mają kopii w porcie (`brak kopii`).

### 2b. Zaportowanie i zakres

- Kod Rust cytuje pełną ścieżkę pliku webu dla **13** z 94 zmienionych plików (`TAK_sciezka`): `data/units.json`, `src/game/ai.ts`, `src/game/armyMerge.ts`, `src/game/civ-ai-data.ts`, `src/game/civ-bonuses.ts`, `src/game/civ-matrix-semantic.ts`, `src/game/cluster-start.ts`, `src/game/combat.ts`, `src/game/manpower.ts`, `src/game/order.ts`, `src/game/terrain-improvements.ts`, `src/main.ts`, `src/map/gen-helpers.ts`.
- Samą nazwę pliku wspomina kod Rust dla **18** dalszych (`NAZWA`): np. `barbarians.ts` w `domain/city_growth.rs`, `economy.ts` w `domain/city_growth.rs`, `population-growth-v85.ts` w `domain/city_growth.rs`.
- Bez śladu w kodzie Rust (`NIE_CYTOWANY`): **63** plików, w tym wszystkie **24** nowe pliki A (zero trafień nazwy lub ścieżki w `engine/src`).
- Frontend-v2: **12** plików `gra/src/ui/**` ma odpowiednik o tej samej ścieżce (11 ROZNY, 1 KOPIA_PINU `armyMergePanel.ts`); pozostałe 3 (`cityPanel.ts`, `aiOwnerProgressFrame.ts`, `recruitHudLabel.ts`) nie mają odpowiednika. Katalog `game/` nie istnieje we frontend-v2, więc logika gry w porcie to wyłącznie `rust-port/engine`.

Wniosek: zmiany webu nie są „portowaniem od zera” dla większości zmienionych modułów, tylko **odświeżeniem istniejącego portu** (tam, gdzie jest ślad) oraz **decyzją o zakresie** dla nowych plików. Stopień zgodności każdego z 31 plików z zaportowanym kodem nie został zmierzony (§8).

### 2c. Grupy (liczby z tabeli §3)

| Grupa | Zakres | Plikow | z cytowaniem w Rust | nowe (A) | bez cytowania w Rust | frontend-v2 (KOPIA/ROZNY) | kopie bajtowe (engine/data lub pin-manifest) |
|---|---|---|---|---|---|---|---|
| G1 | dane (params JSON, civs/units/econ/ui, loader.ts, wikiBundle) | 11 | 1 | 5 | 7 | 0 | 4 |
| G2 | reguly wojny i armii (w tym nowe moduly wojny/armii) | 16 | 1 | 10 | 14 | 0 | 0 |
| G3 | dyplomacja (logika) | 7 | 1 | 1 | 4 | 0 | 0 |
| G4 | AI, ekonomia, miasta, zapis, audio, mapa | 30 | 9 | 2 | 10 | 0 | 0 |
| G5 | UI-2D (gra/src/ui/**, dirtyRenderSync, retained-side-panel-events) | 17 | 0 | 4 | 17 | 12 | 1 |
| G6 | ODLOZONE 3D: render/**, battleScene.ts, main.ts | 13 | 1 | 2 | 11 | 1 | 0 |
| suma | | 94 | 13 | 24 | 63 | 13 | 5 |

Kolumna „z cytowaniem w Rust” = `TAK_sciezka`. „bez cytowania” = `NIE_CYTOWANY` (w tym pliki z potencjalnym ryzykiem portu, których ślad nie został znaleziony; patrz §8).

## 3. Tabela klasyfikacji (94 wiersze = 94 pliki z `git diff --name-only`)

Legenda kolumn w §1. „Derived pin” = liczba plików `derived/*.json`, które wymieniają pełną ścieżkę pliku webu.

| # | Plik | St | +/- | Typ | Pewnosc typu | Grupa | Zaportowany (Rust, cytowanie w engine/src) | frontend-v2 | Kopia bajtowa | pin-manifest | Derived pin (`engine/data/derived`) | Testy Rust (.rs / .json) | Wskaznik gra/tools (heurystyka) | Plan P1/P6 | 3D odlozone |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `gra/data/army-consolidation-params.json` | A | +17/-0 | dane | H | G1 | NIE_CYTOWANY | brak | brak kopii | nie | 0 | 0 / 0 | 0 | 0 — NOWY, brak w planie P1/P6 | nie |
| 2 | `gra/data/civs.json` | M | +180/-489 | dane | H | G1 | NAZWA_ w Rust: `engine/src/data/civilizations.rs`, `engine/src/data/loader.rs` (+5) | brak | KOPIA_PINU (engine/data) | nie | 0 | 8 / 3 | 86 | 35 (dyspozycje/rust-port) | nie |
| 3 | `gra/data/diplomacy-tick-params.json` | A | +22/-0 | dane | H | G1 | NIE_CYTOWANY | brak | brak kopii | nie | 0 | 0 / 0 | 2 | 0 — NOWY, brak w planie P1/P6 | nie |
| 4 | `gra/data/econ-params.json` | M | +12/-12 | dane | H | G1 | NAZWA_ w Rust: `engine/src/data/economy_society.rs`, `engine/src/data/loader.rs` (+1) | brak | KOPIA_PINU (engine/data) | nie | 1 | 3 / 0 | 46 | 17 (dyspozycje/rust-port) | nie |
| 5 | `gra/data/ui-params.json` | M | +26/-0 | dane | H | G1 | NAZWA_ w Rust: `engine/src/data/economy_society_part2.rs`, `engine/src/data/loader.rs` | brak | KOPIA_PINU (engine/data) | nie | 0 | 2 / 0 | 46 | 15 (dyspozycje/rust-port) | nie |
| 6 | `gra/data/units.json` | M | +4/-4 | dane | H | G1 | TAK_sciezka: `engine/src/domain/recruitment.rs` | brak | KOPIA_PINU (engine/data) | nie | 4 | 10 / 1 | 394 | 82 (dyspozycje/rust-port) | nie |
| 7 | `gra/data/war-allin-params.json` | A | +17/-0 | dane | H | G1 | NIE_CYTOWANY | brak | brak kopii | nie | 0 | 0 / 0 | 1 | 1 (dyspozycje/rust-port) | nie |
| 8 | `gra/data/war-rules-params.json` | A | +9/-0 | dane | H | G1 | NIE_CYTOWANY | brak | brak kopii | nie | 0 | 0 / 0 | 0 | 0 — NOWY, brak w planie P1/P6 | nie |
| 9 | `gra/src/audio/filePlayer.ts` | M | +4/-3 | audio (nie 3D) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 6 | 5 (dyspozycje/rust-port) | nie |
| 10 | `gra/src/audio/muzyka-antyczna.ts` | M | +2/-2 | audio (nie 3D) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 35 | 7 (dyspozycje/rust-port) | nie |
| 11 | `gra/src/battle/battleScene.ts` | M | +184/-151 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 1 | 0 / 1 | 33 | 29 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 12 | `gra/src/battle/formationRules.ts` | A | +127/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 13 | `gra/src/data/loader.ts` | M | +4/-2 | dane | H | G1 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 383 | 42 (dyspozycje/rust-port) | nie |
| 14 | `gra/src/data/wikiBundle.json` | M | +1/-1 | dane | H | G1 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 16 | 17 (dyspozycje/rust-port) | nie |
| 15 | `gra/src/game/ai-city-capture-executor.ts` | M | +31/-1 | logika (AI/ekonomia/miasta/save) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 5 | 7 (dyspozycje/rust-port) | nie |
| 16 | `gra/src/game/ai-era-unit-promotion.ts` | A | +63/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 17 | `gra/src/game/ai-general-war-campaign.ts` | A | +164/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 18 | `gra/src/game/ai-move-range.ts` | A | +112/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 4 | 1 (dyspozycje/rust-port) | nie |
| 19 | `gra/src/game/ai.ts` | M | +416/-130 | logika (AI/ekonomia/miasta/save) | H | G4 | TAK_sciezka: `engine/src/domain/ai_turn.rs` | brak | nie | nie | 1 | 1 / 2 | 126 | 29 (dyspozycje/rust-port) | nie |
| 20 | `gra/src/game/army-consolidation.ts` | A | +177/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 5 | 0 — NOWY, brak w planie P1/P6 | nie |
| 21 | `gra/src/game/army-leadership.ts` | A | +63/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 22 | `gra/src/game/armyMerge.ts` | M | +3/-0 | logika (wojna/armia) | H | G2 | TAK_sciezka: `engine/src/domain/recruitment.rs` | brak | nie | nie | 2 | 5 / 0 | 21 | 19 (dyspozycje/rust-port) | nie |
| 23 | `gra/src/game/auto-improvements.ts` | M | +3/-1 | logika (AI/ekonomia/miasta/save) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 27 | 8 (dyspozycje/rust-port) | nie |
| 24 | `gra/src/game/barbarians.ts` | M | +49/-3 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/domain/city_growth.rs`, `engine/src/domain/ids.rs` | brak | nie | nie | 0 | 1 / 1 | 26 | 48 (dyspozycje/rust-port) | nie |
| 25 | `gra/src/game/civ-ai-data.ts` | M | +32/-34 | logika (AI/ekonomia/miasta/save) | H | G4 | TAK_sciezka: `engine/src/domain/civ_matrix.rs` | brak | nie | nie | 1 | 1 / 1 | 11 | 9 (dyspozycje/rust-port) | nie |
| 26 | `gra/src/game/civ-bonuses.ts` | M | +106/-98 | logika (AI/ekonomia/miasta/save) | H | G4 | TAK_sciezka: `engine/src/domain/civ_bonuses.rs` | brak | nie | nie | 3 | 1 / 2 | 18 | 14 (dyspozycje/rust-port) | nie |
| 27 | `gra/src/game/civ-matrix-semantic.ts` | M | +91/-43 | logika (dyplomacja) | H | G3 | TAK_sciezka: `engine/src/domain/civ_matrix.rs` | brak | nie | nie | 1 | 2 / 1 | 6 | 14 (dyspozycje/rust-port) | nie |
| 28 | `gra/src/game/cluster-start.ts` | M | +35/-1 | logika (AI/ekonomia/miasta/save) | H | G4 | TAK_sciezka: `engine/src/domain/start_position.rs` | brak | nie | nie | 1 | 1 / 2 | 24 | 14 (dyspozycje/rust-port) | nie |
| 29 | `gra/src/game/combat.ts` | M | +4/-2 | logika (AI/ekonomia/miasta/save) | H | G4 | TAK_sciezka: `engine/src/domain/combat.rs` | brak | nie | nie | 2 | 0 / 1 | 44 | 55 (dyspozycje/rust-port) | nie |
| 30 | `gra/src/game/culture-religion.ts` | M | +43/-21 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/domain/state.rs`, `engine/src/domain/territory.rs` | brak | nie | nie | 1 | 0 / 1 | 14 | 21 (dyspozycje/rust-port) | nie |
| 31 | `gra/src/game/diplomacy-ai-offer-balance.ts` | M | +24/-1 | logika (dyplomacja) | H | G3 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 8 | 7 (dyspozycje/rust-port) | nie |
| 32 | `gra/src/game/diplomacy-layers.ts` | M | +32/-0 | logika (dyplomacja) | H | G3 | NAZWA_ w Rust: `engine/src/domain/start_position.rs` | brak | nie | nie | 1 | 0 / 1 | 16 | 9 (dyspozycje/rust-port) | nie |
| 33 | `gra/src/game/diplomacy-peace-lock.ts` | M | +1/-1 | logika (dyplomacja) | H | G3 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 7 (dyspozycje/rust-port) | nie |
| 34 | `gra/src/game/diplomacy-proposals.ts` | M | +5/-2 | logika (dyplomacja) | H | G3 | NAZWA_ w Rust: `engine/src/domain/diplomacy.rs` | brak | nie | nie | 1 | 2 / 0 | 30 | 15 (dyspozycje/rust-port) | nie |
| 35 | `gra/src/game/diplomacy-resource-trade-pick.ts` | M | +10/-2 | logika (dyplomacja) | H | G3 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 1 | 2 | 7 (dyspozycje/rust-port) | nie |
| 36 | `gra/src/game/diplomacy-sensible-deals.config.json` | A | +6/-0 | dane | H | G1 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 0 | 0 — NOWY, brak w planie P1/P6 | nie |
| 37 | `gra/src/game/diplomacy-sensible-deals.ts` | A | +170/-0 | logika (dyplomacja) | H | G3 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 2 | 0 — NOWY, brak w planie P1/P6 | nie |
| 38 | `gra/src/game/diplomacy-tick-war-brake.ts` | A | +216/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 3 | 0 — NOWY, brak w planie P1/P6 | nie |
| 39 | `gra/src/game/dirtyRenderSync.ts` | A | +31/-0 | UI-2D (koordynacja synchronizacji renderu; bez importu three) | O | G5 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 40 | `gra/src/game/economy.ts` | M | +116/-213 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/data/derived.rs`, `engine/src/domain/city_growth.rs` (+1) | brak | nie | nie | 2 | 1 / 2 | 80 | 31 (dyspozycje/rust-port) | nie |
| 41 | `gra/src/game/embarkation.ts` | M | +2/-2 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/domain/pathfinding.rs` | brak | nie | nie | 2 | 1 / 0 | 7 | 13 (dyspozycje/rust-port) | nie |
| 42 | `gra/src/game/forced-war-bronze.ts` | M | +1/-1 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 6 | 7 (dyspozycje/rust-port) | nie |
| 43 | `gra/src/game/forced-war-common.ts` | M | +99/-15 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 15 | 7 (dyspozycje/rust-port) | nie |
| 44 | `gra/src/game/forced-war-iron.ts` | M | +15/-2 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 4 | 7 (dyspozycje/rust-port) | nie |
| 45 | `gra/src/game/forced-war-stone.ts` | M | +1/-1 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 7 | 7 (dyspozycje/rust-port) | nie |
| 46 | `gra/src/game/fsa-autosave.ts` | M | +55/-1 | logika (AI/ekonomia/miasta/save) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 3 | 12 (dyspozycje/rust-port) | nie |
| 47 | `gra/src/game/generals.ts` | A | +53/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 5 | 0 — NOWY, brak w planie P1/P6 | nie |
| 48 | `gra/src/game/manpower.ts` | M | +80/-48 | logika (AI/ekonomia/miasta/save) | H | G4 | TAK_sciezka: `engine/src/domain/recruitment.rs` | brak | nie | nie | 1 | 2 / 1 | 27 | 29 (dyspozycje/rust-port) | nie |
| 49 | `gra/src/game/order.ts` | M | +23/-2 | logika (AI/ekonomia/miasta/save) | H | G4 | TAK_sciezka: `engine/src/domain/types.rs` | brak | nie | nie | 1 | 2 / 2 | 41 | 19 (dyspozycje/rust-port) | nie |
| 50 | `gra/src/game/planned-march.ts` | M | +15/-4 | logika (wojna/armia) | H | G2 | NAZWA_ w Rust: `engine/src/domain/pathfinding.rs` | brak | nie | nie | 1 | 1 / 0 | 4 | 10 (dyspozycje/rust-port) | nie |
| 51 | `gra/src/game/playerState.ts` | M | +1/-7 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/data/derived.rs`, `engine/src/domain/player.rs` | brak | nie | nie | 1 | 1 / 1 | 6 | 20 (dyspozycje/rust-port) | nie |
| 52 | `gra/src/game/population-growth-v85.ts` | M | +37/-6 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/data/derived.rs`, `engine/src/domain/city_growth.rs` (+1) | brak | nie | nie | 3 | 3 / 1 | 25 | 22 (dyspozycje/rust-port) | nie |
| 53 | `gra/src/game/production.ts` | M | +216/-55 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/data/derived.rs`, `engine/src/domain/building_costs.rs` (+1) | brak | nie | nie | 0 | 0 / 1 | 137 | 26 (dyspozycje/rust-port) | nie |
| 54 | `gra/src/game/relief-preserving-improvements.ts` | M | +5/-6 | logika (AI/ekonomia/miasta/save) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 2 | 7 (dyspozycje/rust-port) | nie |
| 55 | `gra/src/game/retained-side-panel-events.ts` | A | +26/-0 | UI-2D (log zdarzen panelu bocznego; bez importu three) | O | G5 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 56 | `gra/src/game/save-presence.ts` | A | +118/-0 | logika (AI/ekonomia/miasta/save) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 57 | `gra/src/game/save.ts` | M | +6/-1 | logika (AI/ekonomia/miasta/save) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 95 | 36 (dyspozycje/rust-port) | nie |
| 58 | `gra/src/game/society-breakdown.ts` | M | +33/-0 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/domain/ids.rs` | brak | nie | nie | 0 | 1 / 1 | 27 | 20 (dyspozycje/rust-port) | nie |
| 59 | `gra/src/game/terrain-improvements.ts` | M | +15/-7 | logika (AI/ekonomia/miasta/save) | H | G4 | TAK_sciezka: `engine/src/domain/improvements.rs` | brak | nie | nie | 1 | 2 / 2 | 99 | 44 (dyspozycje/rust-port) | nie |
| 60 | `gra/src/game/trade-routes.ts` | M | +42/-13 | logika (AI/ekonomia/miasta/save) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 1 | 0 / 1 | 22 | 20 (dyspozycje/rust-port) | nie |
| 61 | `gra/src/game/turn-economy.ts` | M | +95/-164 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/domain/city_growth.rs`, `engine/src/domain/terrain.rs` | brak | nie | nie | 0 | 1 / 2 | 77 | 22 (dyspozycje/rust-port) | nie |
| 62 | `gra/src/game/war-rules-multiwar.ts` | A | +249/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 5 | 0 — NOWY, brak w planie P1/P6 | nie |
| 63 | `gra/src/game/warAllInCapital.ts` | A | +667/-0 | logika (wojna/armia) | H | G2 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 5 | 0 — NOWY, brak w planie P1/P6 | nie |
| 64 | `gra/src/game/wealth.ts` | M | +20/-0 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/domain/state.rs` | brak | nie | nie | 1 | 0 / 1 | 15 | 17 (dyspozycje/rust-port) | nie |
| 65 | `gra/src/game/work-tax.ts` | A | +77/-0 | logika (AI/ekonomia/miasta/save) | H | G4 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 2 | 0 — NOWY, brak w planie P1/P6 | nie |
| 66 | `gra/src/main.ts` | M | +2824/-447 | spoiwo logika+UI, import three | H | G6 | TAK_sciezka: `engine/src/domain/combat.rs` | ROZNY | nie | nie | 1 | 2 / 2 | 638 | 102 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 67 | `gra/src/map/gen-helpers.ts` | M | +24/-16 | logika (AI/ekonomia/miasta/save) | H | G4 | TAK_sciezka: `engine/src/domain/mapgen/relief.rs`, `engine/src/domain/mapgen/terrain_class.rs` | brak | nie | nie | 5 | 6 / 5 | 127 | 30 (dyspozycje/rust-port) | nie |
| 68 | `gra/src/render/braz-rydwan-woly-opus5.ts` | M | +2/-2 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 0 | 5 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 69 | `gra/src/render/bronzeCityRoblox.ts` | M | +2/-1 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 0 | 10 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 70 | `gra/src/render/cities.ts` | M | +70/-4 | 3D-render | H | G6 | NAZWA_ w Rust: `engine/src/data/derived.rs`, `engine/src/domain/mapgen/cluster_rivals.rs` (+3) | brak | nie | nie | 0 | 5 / 3 | 317 | 50 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 71 | `gra/src/render/kopalnia-cyny-opus5.ts` | M | +4/-3 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 6 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 72 | `gra/src/render/kopalnia-zlota-opus5.ts` | M | +4/-3 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 0 | 6 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 73 | `gra/src/render/memDebug.ts` | A | +59/-0 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 1 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 74 | `gra/src/render/stoneCityRoblox.ts` | M | +2/-1 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 0 | 9 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 75 | `gra/src/render/transientObjectResources.ts` | A | +68/-0 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 2 | 0 — NOWY, brak w planie P1/P6 | ODLOZONE (3D) |
| 76 | `gra/src/render/unitStatPlate.ts` | M | +5/-5 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 3 | 13 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 77 | `gra/src/render/unitVeteranBadges.ts` | M | +36/-0 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 6 | 9 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 78 | `gra/src/render/units.ts` | M | +66/-43 | 3D-render | H | G6 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 394 | 82 (dyspozycje/rust-port) | ODLOZONE (3D) |
| 79 | `gra/src/ui/aiOwnerProgressFrame.ts` | A | +16/-0 | UI-2D | H | G5 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 80 | `gra/src/ui/armyMergePanel.ts` | M | +28/-19 | UI-2D | H | G5 | NIE_CYTOWANY | KOPIA_PINU | nie | TAK (sha=pin) | 0 | 0 / 0 | 3 | 10 (dyspozycje/rust-port) | nie |
| 81 | `gra/src/ui/armyStackHud.ts` | M | +6/-6 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 3 | 8 (dyspozycje/rust-port) | nie |
| 82 | `gra/src/ui/cityPanel.ts` | M | +259/-73 | UI-2D | H | G5 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 1 | 97 | 30 (dyspozycje/rust-port) | nie |
| 83 | `gra/src/ui/diploListHud.ts` | M | +44/-0 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 2 | 9 (dyspozycje/rust-port) | nie |
| 84 | `gra/src/ui/diplomacyAudience.ts` | M | +4/-17 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 20 | 14 (dyspozycje/rust-port) | nie |
| 85 | `gra/src/ui/empireDetailPanel.ts` | M | +85/-165 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 35 | 17 (dyspozycje/rust-port) | nie |
| 86 | `gra/src/ui/entityCards/buildingAdapter.ts` | M | +3/-3 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 7 | 8 (dyspozycje/rust-port) | nie |
| 87 | `gra/src/ui/entityCards/improvementAdapter.ts` | M | +7/-1 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 9 | 7 (dyspozycje/rust-port) | nie |
| 88 | `gra/src/ui/hud.ts` | M | +8/-2 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 47 | 19 (dyspozycje/rust-port) | nie |
| 89 | `gra/src/ui/newGameFlow.ts` | M | +179/-39 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 1 / 0 | 23 | 35 (dyspozycje/rust-port) | nie |
| 90 | `gra/src/ui/preBattle.ts` | M | +33/-10 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 30 | 18 (dyspozycje/rust-port) | nie |
| 91 | `gra/src/ui/recruitHudLabel.ts` | A | +5/-0 | UI-2D | H | G5 | NIE_CYTOWANY | brak | nie | nie | 0 | 0 / 0 | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 92 | `gra/src/ui/unitRecruitCard.ts` | M | +124/-38 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 7 | 12 (dyspozycje/rust-port) | nie |
| 93 | `gra/src/ui/unitReplacePicker.ts` | M | +18/-2 | UI-2D | H | G5 | NIE_CYTOWANY | ROZNY | nie | nie | 0 | 0 / 0 | 1 | 8 (dyspozycje/rust-port) | nie |
| 94 | `gra/src/units/setup.ts` | M | +2/-0 | logika (AI/ekonomia/miasta/save) | H | G4 | NAZWA_ w Rust: `engine/src/data/derived.rs`, `engine/src/domain/pathfinding.rs` (+3) | brak | nie | nie | 1 | 1 / 1 | 279 | 29 (dyspozycje/rust-port) | nie |

## 4. Nowe pliki web (24 × A) — status portu

Wszystkie 24 pliki A mają **0** odwołań w kodzie Rust (ani pełnej ścieżki, ani nazwy: `git grep` po `rust-port/engine/src`). Zero „NAZWA”, zero „TAK_sciezka”. Nie są zaportowane i nie ma dla nich wpisu w planie P1/P6 (poza wzmianką w `war-allin-params.json` (LEDGER), `ai-move-range.ts` i `render/memDebug.ts`, które mają trafienia w `dyspozycje/rust-port`; NIE_ZMIERZONO czy plan je obejmuje). Trzy wskazane w dispatchu (`war-rules-multiwar.ts`, `army-consolidation.ts`, `diplomacy-sensible-deals.ts`) należą do tej grupy.

Decyzja o zakresie portu tych plików należy do właściciela (krok 0 w §5). Do czasu decyzji są „poza planem” i nie należy ich traktować jako zaportowane.

## 5. Rekomendowana kolejność i podział na tematy

Każdy wiersz to jeden temat (≤ 1 temat na zlecenie). Wszystkie tematy poza G6 są bez grafiki 3D. Każdy temat to **odświeżenie istniejącego kodu portu**, plus wektorów i kopii bajtowych, chyba że wiersz mówi „nowe”.

| Krok | Temat (propozycja ID) | Pliki (grupa) | Uwagi |
|---|---|---|---|
| 0 | `R-RUSTPORT-REPIN-DECYZJA-Q1` | brak zmian kodu | Decyzja właściciela: (a) zakres portu 24 nowych plików (§4); (b) moment zmiany pinu (§6). |
| 1 | `R-RUSTPORT-REPIN-DANE-Q1` | G1 (11) | Odświeżyć 4 kopie bajtowe w `rust-port/engine/data` (`civs`, `units`, `econ-params`, `ui-params`) z `origin/main`; przeliczyć tabele `derived/*.json` wskazane w kolumnie „Derived pin”; przeliczyć wektory `tests/*_vectors/*.json` powiązane z tymi plikami. Nowe pliki params/config (A) tylko po decyzji z kroku 0. `loader.ts` i `wikiBundle.json` są bez cytowania Rust (NIE_ZMIERZONO, czy wymagają zmian w `data/loader.rs`). Uwaga: `units.json` to dane, nie grafika (Z-3). |
| 2a | `R-RUSTPORT-REPIN-WOJNA-NOWE-Q1` | G2 nowe (A) | Wymaga decyzji z kroku 0. Nowe moduły bez śladu w porcie = portowanie od zera. |
| 2b | `R-RUSTPORT-REPIN-WOJNA-ZMIANY-Q1` | G2 zmienione (`forced-war-*`, `armyMerge.ts` (cytowany w `domain/recruitment.rs`), `ai-move-range.ts`, `planned-march.ts`) | Zależy od 1 i 2a. |
| 3 | `R-RUSTPORT-REPIN-DYPLO-Q1` | G3 (7) | Zależy od 1 i 2a (`diplomacy-sensible-deals`). `civ-matrix-semantic.ts` cytowany w `domain/civ_matrix.rs`. |
| 4a | `R-RUSTPORT-REPIN-AI-Q1` | `ai.ts` (cytowany w `domain/ai_turn.rs`), `combat.ts` (`domain/combat.rs`), `civ-bonuses.ts` (`domain/civ_bonuses.rs`), `civ-ai-data.ts` (`domain/civ_matrix.rs`), `cluster-start.ts` (`domain/start_position.rs`), `order.ts` (`domain/types.rs`), `barbarians.ts`, `embarkation.ts`, `auto-improvements.ts`, `ai-city-capture-executor.ts` | `ai.ts` (+416/-130) jest największym ryzykiem; osobny temat. |
| 4b | `R-RUSTPORT-REPIN-EKONOMIA-Q1` | `economy`, `production`, `manpower` (cytowany w `domain/recruitment.rs`), `turn-economy`, `wealth`, `work-tax`, `society-breakdown`, `culture-religion`, `trade-routes`, `terrain-improvements` (cytowany w `domain/improvements.rs`), `population-growth-v85`, `relief-preserving-improvements`, `playerState`, `units/setup.ts` | Po kroku 1. |
| 4c | `R-RUSTPORT-REPIN-ZAPIS-AUDIO-Q1` | `save.ts`, `save-presence`, `fsa-autosave`, `audio/*` | Po kroku 1 (format zapisu). Brak cytowania `save.ts` w Rust (nazwa: `save_load.rs` jest modułem o zbieżnej nazwie, NIE_ZMIERZONO). |
| 4d | `R-RUSTPORT-REPIN-MAPA-Q1` | `map/gen-helpers.ts` (cytowany w `domain/mapgen/relief.rs` i `terrain_class.rs`) | Przeniesiony z 4b (poprzednio w ekonomii): to moduł mapgen, nie ekonomia. Bez grafiki 3D. |
| 5 | `R-RUSTPORT-REPIN-UI-Q1` | G5 (17) | Zależy od 1–4 (DTO). 12 plików ma odpowiednik frontend-v2 (11 ROZNY do odświeżenia, `armyMergePanel.ts` = KOPIA_PINU). Nowe UI: `aiOwnerProgressFrame.ts`, `recruitHudLabel.ts` (dwa, status A). `cityPanel.ts` jest ZMIENIONY (M, +259/-73) i nie ma odpowiednika w porcie. `dirtyRenderSync.ts` i `retained-side-panel-events.ts` (poprzednio G2) są przeniesione do G5: odczytane w tej rundzie, bez importu `three`, importowane tylko przez `main.ts`. |
| 6 | `R-RUSTPORT-REPIN-3D-ODLOZONE-Q1` | G6 (13): `battleScene.ts`, `render/**`, `main.ts` | **ODLOZONE (3D)**: na sam koniec, gdy zostanie wolne miejsce przed końcem limitu. `main.ts` (+2824/-447) ma część niegraficzną (cytowany w `combat.rs` jako logika walki), rozdzielić przed startem tematu. |

## 6. Propozycja nowego pinu

- **Kandydat:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` (origin/main w chwili pomiaru; `rev-list --count edb8fb56..origin/main` = 87).
- **Kiedy:** nie w tym temacie. Pin przesuwać jednym ruchem dopiero po krokach 1–5 (G1–G5 i mapa 4d zamknięte). Do tego czasu `edb8fb56` pozostaje pinem. Krok 6 (G6) pójdzie po przesunięciu pinu i jest oznaczony ODLOZONE.
- **Co trzeba zrobić z pinem (pełna lista, nie tylko manifesty):**
  - `rust-port/engine/data/{civs,units,econ-params,ui-params}.json`: 4 kopie bajtowe do odświeżenia z nowego pinu.
  - `rust-port/engine/data/derived/*.json`: 58 plików z pinem w metadanych; 39 z polem `pin_web`. Przeliczać tylko te, których źródło (`zrodlo`, `zrodlo_web`) jest w zmienionych plikach (kolumna „Derived pin” w §3). Tabela jest źródłem prawdy balansu; nie edytować wzorem.
  - `rust-port/engine/tests/*_vectors/*.json` (81 plików): wektory wygenerowane z webu przy pinie `edb8fb56`; przeliczyć na nowym pinie tam, gdzie wskazane w kolumnie „Testy Rust”. **Nie osłabiać i nie usuwać testów** (zasada bramki).
  - `src-tauri/frontend-v2/tools/pin-manifest.json`: 1 wpis zmieniony (`armyMergePanel.ts`, sha = pin), regeneracja z `git archive` + `sha256`.
  - `dyspozycje/rust-port/manifest-gra-edb8fb56.sha256.tsv` (2116 wierszy): regeneracja jako manifest nowego pinu: 94 zmienione pliki z nowym sha, 24 nowe pliki.
  - `rust-port/assets/MANIFEST.tsv`: bez zmian (0 zmienionych źródeł assetów).
- **Kontrola:** `git diff --name-only edb8fb56 91dc998a5f1b51ad29e0f4785edfd45655445c53 -- gra/src gra/data | wc -l` = 94.

## 7. Kontrola kryteriów tematu

- Wiersze tabeli §3 = liczba plików z `git diff --name-only`: `grep -cE '^\| [0-9]+ \| `gra/' dyspozycje/rust-port/REPIN-DELTA-20261029.md` → **94**.
- Każdy plik ma: typ, pewność typu, grupę, status Rust (TAK_sciezka / NAZWA / NIE_CYTOWANY), frontend-v2, kopię bajtową, derived, testy, 3D.
- Sekcja NIE_ZMIERZONO: §8.

## 8. NIE_ZMIERZONO

- **Semantyka zmian w grze:** treść diffów przeczytano wyłącznie dla dwóch plików (`dirtyRenderSync.ts`, `retained-side-panel-events.ts`); pozostałe klasyfikacje typu są heurystyką z nazwy/ścieżki (kolumna „Pewność typu” = H). Co dokładnie zmieniły reguły wojny, dyplomacji, AI — NIE_ZMIERZONO.
- **Zaportowanie:** `TAK_sciezka` oznacza tylko, że kod Rust cytuje plik webu. Nie mierzy zakresu, pełności ani zgodności wartości. `NAZWA` jest słabym śladem (nazwa może występować w komentarzu lub dotyczyć innego modułu). `NIE_CYTOWANY` nie dowodzi braku portu. Dla żadnego z 94 plików zgodność kodu Rust z nową wersją webu nie została zmierzona.
- **Testy:** nie uruchamiano `cargo test` w `rust-port/engine`, testów webu ani `gra/tools` (dokument, zero zmian kodu). Stan zielony/czerwony nie jest znany.
- **Wektory:** kolumna „Testy Rust” liczy pliki z tokenem nazwy lub ścieżki; może zawyżać przy wspólnych nazwach (`ai.ts`, `order.ts`) i przeoczać odwołania przez ścieżki względne lub dynamiczne importy. Nie jest listą wektorów powiązanych z konkretnym modułem.
- **Derived:** dopasowanie po pełnej ścieżce pliku webu w treści JSON; wpis cytujący tylko nazwę pliku nie jest policzony.
- **frontend-v2:** porównano wyłącznie bajty z pinem i obecność ścieżki; zgodność funkcjonalna NIE_ZMIERZONO.
- **Plan P1/P6 i `gra/tools`:** kolumny odziedziczone z rundy 1 (heurystyka tokenowa), nie zweryfikowane w tej rundzie.
- **Inne gałęzie:** `rust-port/*` poza `origin/rust-port/parity-v2` nie były sprawdzane; `P6-25-MAPA-GAP.md` nie analizowano względem nowych plików.

## 9. Założenia rozstrzygające luki (zamiast pytań)

- Z-1: „zaportowany” = kod Rust cytuje pełną ścieżkę pliku webu (`TAK_sciezka`) LUB ścieżka istnieje w `src-tauri/frontend-v2/src` (UI). Słaby ślad (`NAZWA`) jest informacją, nie dowodem. Bez oceny pełności.
- Z-2: „3D” = realny import `three` w pliku (regex na `origin/main`); wzmianki `THREE.` w komentarzach nie liczą się.
- Z-3: `units.json` i `units/setup.ts` traktowane jako dane/logika, nie grafika.
- Z-4: kolejność G1→G5, G6 na końcu, zgodnie z poleceniem, że ciężkie prace 3D są odkładane.
- Z-5: pin przesuwany jednym ruchem po G1–G5 i kroku 4d (§6).
- Z-6: grupa `dirtyRenderSync.ts` i `retained-side-panel-events.ts` = G5 (odczyt treści, rund 2).
- Z-7: kopie bajtowe liczone po sha256 względem pinu; `derived/*.json` i wektory nie są kopiami bajtowymi, tylko zależnościami do przeliczenia.
