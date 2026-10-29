# P6-REPIN-LOGIKA-CIV — port zmian logiki cywilizacji z weba 91dc998a do Rust

**Temat:** `R-RUSTPORT-REPIN-LOGIKA-CIV-Q1` · **Runda:** 1/5 (Operator-impl) · **Baza:** `origin/rust-port/repin-wip` (`829a8c0f`)
**Cel web:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Pin w repo:** nadal `edb8fb56` (przesunięcie pinu NIE w tym temacie)
**Źródło zmian:** `git diff edb8fb56 91dc998a -- gra/src/game/civ-bonuses.ts gra/src/game/civ-ai-data.ts gra/src/game/civ-matrix-semantic.ts`
(229+ / 175−; 3 pliki).

## 1. Mapowanie zmian web → Rust

| Zmiana web (91dc998a) | Miejsce w Rust | Uwagi |
|---|---|---|
| `unitCombatCategory`: `rola === 'galera'` → `morska` | `domain/civ_bonuses.rs` `unit_combat_category`, `tok::ROLA_GALERA` | |
| `bonusApplies`: bramka `isKnownMatrixCombatEntry` (id, realizuje, typ i cel zgodne ze specyfikacją, wartość skończona) | `is_known_matrix_combat_entry`, `matrix_combat_entry_spec` (`OnceLock`) | tabela specyfikacji = `civ-bonus-matrix-specs.json` |
| `bonusApplies`: usunięte gałęzie oparte na tekście `opis` (las/szarża/pierwsze uderzenie) | `bonus_applies` (usunięte `opis_*`, tokeny `OPIS_*`) | |
| `applyWalkBonus` → `applyMatrixCombatBonus`: routing wyłącznie po `matrixParamId` | `apply_matrix_combat_bonus` (bez `side`, bez fallbacku po opisie) | |
| `civMatrixBonusyForCivKey`: wykluczony tylko `walka_atak_lukownicy`; zerowe markery gdy cywilizacja ma wiersz macierzy | `civ_matrix_bonusy_for_civ_key`; `wykluczone_g1`, `zerowe_markery` | |
| `civMatrixBonusyForCivKey`: Egipt pomija `walka_ruch_bitwa_proc` (decyzja 1B) | `parametry_dodatkowe[].pomin_civ` | |
| `civMatrixBonusyForCivKey`: rekrutacja Zulusów cel `Impi` (decyzja 2A) | `koszt_rekrutacji.wyjatki_civ` | |
| `matchingMatrixSum`: ta sama bramka `isKnown` | `matching_matrix_sum` | |
| `isCombatModifierBonus` = `isKnown && wartosc !== 0` | `is_combat_modifier_bonus` | |
| `civEmbarkationMovementMultiplier` (decyzja 4B) | `civ_embarkation_movement_multiplier(bonusy, unit, civ_key)` | ZAŁOŻENIE: `civ_key` zamiast pola `matrixCivKey` (pole nie dodane do `CivBonusEntry`, bo testy konstruują go literałem) |
| `civAiAggressionNorm`, `civAiProfilMapy`, `civAiProfileFor`: brak fallbacku do `civ-ai.json` | `domain/civ_matrix.rs` `civ_ai_*` | |
| `resolveArchetypeAggression`: baza `dip_agresja_archetyp` + `(agresja[trudność] − agresja[normal]) / 10`, bez wiersza → 0.5 | `resolve_archetype_aggression`; `dyplomacja.parametr_agresja_archetyp` | |
| `resolveArchetypeTrade` / `nastawienieBazoweZaufanieDelta`: bez wiersza → 0.5 / 0 | `resolve_archetype_trade`, `nastawienie_bazowe_zaufanie_delta` | |
| `civ-matrix-semantic`: zbiory REAL_GAMEPLAY (69), DECISION_REQUIRED (∅), BLOCKED (∅), HARMFUL (4), PROVEN_CONSUMERS (74) | `data/derived/civ-matrix-semantic.json` | |
| `classifyCivMatrixCell`: Egipt + `walka_ruch_bitwa_proc` → BLOCKED (invariant komórki) + tekst powodu | `classify_civ_matrix_cell`, `status_reason(..., civilization_id)`, `powody.BLOCKED.egipt_ruch_bitwa` | |

## 2. Zmiany w schemacie tabel (`src/data/derived.rs`) — POZA ALLOWLISTĄ, ZAŁOŻENIE

Nowe pola `zerowe_markery`, `pomin_civ`, `wyjatki_civ` (rekrutacja), `parametr_agresja_archetyp`, `powody.BLOCKED.egipt_ruch_bitwa`.
Bez nich tabele JSON nie parsują się (`deny_unknown_fields`). Pola opcjonalne mają `serde(default)`.
Plik nie był na allowliście tematu: **ZAŁOŻENIE** — zmiana schematu jest zależnością koniecznej zmiany danych; do potwierdzenia przez Final Control.

## 3. Wyniki testów (pełny zestaw `cargo test --no-fail-fast --all-targets`)

- Zielone z 12 czerwonych r2: **11 z 12** (p6_1d: 4/5, p6_1e: 7/7).
- Pozostaje czerwony (1): `p6_1d_civ_bonuses::bonus_applies_and_stat_multipliers_match_web` — asercja `nonzero_records > 300` (`tests/p6_1d_civ_bonuses.rs:339`), wynik `niezerowych: 106`. Wszystkie porównania per rekord (`mult`, `bits`) przechodzą; liczba zapisów o niezerowym mnożniku w wektorach 91dc998a to 106.
- Nowy czerwony (regresja względem r2, wymuszona przez web 91dc998a): `p6_1e_civ_matrix::ai_fallback_branches_are_actually_exercised` (`tests/p6_1e_civ_matrix.rs:1296`) — test oczekuje profilu z `civ-ai.json` dla Zulusów bez wiersza macierzy; web 91dc998a (`civ-ai-data.ts` `civAiProfileFor`) zwraca `undefined`.
- Nowe czerwone wymuszone przez zmianę w bramce `isKnown` (synthetic fixtures z edb8fb56, bez regeneracji): `p6_4_core` ×2, `p6_4_march` ×3, `p6_4_vectors` ×2 (`move_cost_fn_for`, `execute_march_step`). Wpisy testowe mają `cel: "wszystko"` dla `walka_ruch_piechota_teren_plytkie_morze`, a specyfikacja web wymaga `piechota`.
- Strukturalne testy tabel: `p6_1e_tables.rs:113` (zbiór `decision_required` musi być niepusty) i `:178` (klucz `dip_nastawienie_bazowe` w `powody.decision_required.wyjatki` wymaga wpisu w zbiorze) — web 91dc998a ma te zbiory puste.

Wszystkie powyższe to asercje kodyfikujące stan edb8fb56 lub sanity-progi. Ich zmiana wymaga edycji testów (poza zasadą „tylko dopiski") albo regeneracji wektorów p6_4 z 91dc998a — decyzja poza tym tematem.

## 4. Bramki

- `cargo fmt --all -- --check`: EXIT=0 (po `cargo fmt --all`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `cargo test --no-fail-fast --all-targets`: EXIT=101; 1208 passed / 10 failed (suma 1218; r2 raportował 1195/12, różnica w liczeniu celów — NIE_ZMIERZONO).
- Lock: `Cargo.lock` nie jest w repo; budowano bez `--locked` (plik nieśledzony, NIE commitowany).

## 5. Poza zakresem tej rundy (NIE_WYKONANO)

- Mutacje ≥20 na nowych gałęziach logiki (krok 4 dispatchu) — pomiary w kolejnej rundzie Operator-pomiary.
- `civCombatUnitShapeFromCategory`, `civCombatBonusProjection`, `effectiveCombatBonusChipTexts` (adaptery UI/PreBattle) — NIE PORTOWANE, brak konsumenta testowego w Rust.
- Regeneracja wektorów p6_4 i derived zależnych od `civ-bonuses`/`civ-matrix-semantic` — NIE WYKONANO.
- Przesunięcie pinu w `manifest`/`pin-manifest` — poza tematem (zgodnie z DELTA §6).
