# P6-REPIN-WOJNA-2 — delta weba 91dc998a → dc8a3adc (formacje, generałowie, tryb bitwy)

Temat: `R-RUSTPORT-REPIN-WOJNA-2-Q1` (runda 1/5). Pin docelowy: `dc8a3adc989bc82aab2cde6bb747c883f949fc1a` (GOAL dispatchu; BAZA dispatchu wskazywała `91dc998a`, będący przodkiem `dc8a3adc` — założenie: pin `dc8a3adc`, delta liczona od `91dc998a`). Źródła weba: `git archive dc8a3adc gra/src gra/data` do katalogu tymczasowego poza repo.

## Tabela zmian

| Zmiana (web) | Plik:linia weba (dc8a3adc) | Plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|
| `initialBattleSlots`: `linesForBand`, `layBand` z rzędami per pasmo, `meleeLines`/`archerLines` | `gra/src/battle/formationRules.ts:46-82` | `rust-port/engine/src/domain/formation_rules.rs` (`Layout::lines_for_band`, `lay_band`, `initial_battle_slots`) | `p6_repin_wojna_a_formation::formation_groups_and_slots_match_web` (711 przypadków) | PORTOWANE |
| `mainBandWidth` i skrzydła jazdy (≤3 rzędy po obu stronach) | `formationRules.ts:93-111` | `formation_rules.rs` (`initial_battle_slots`, blok skrzydeł) | j.w. (przypadki z jazdą i meleeLines/archerLines) | PORTOWANE |
| `compactLineAllowsAdvance`: zmiana nazw argumentów (`lineReferenceProgress`) | `formationRules.ts:148-160` | `formation_rules.rs::compact_line_allows_advance` | `compact_line_matches_web_on_grid` (1872) | PORTOWANE (zmiana niebehawioralna, klucze wektora zaktualizowane) |
| `classifyInitialBattleRole` | `formationRules.ts:3-30` (bez zmian między 91dc998a a dc8a3adc) | `formation_rules.rs::classify_initial_battle_role` | `classify_matches_web_on_all_vectors` (2031) | NIE-DOTYCZY (brak delty; wektory odświeżone) |
| `initialBattleFormation` | `formationRules.ts:123-146` (bez zmian) | `formation_rules.rs::initial_battle_formation` | j.w. | NIE-DOTYCZY (brak delty) |
| `battle-mode.ts`: `BATTLE_MODE_SETTING_VERSION`, `isAutomaticOnlyBattleMode` | `gra/src/game/battle-mode.ts:2,9-14` | `rust-port/engine/src/domain/battle_mode.rs` | `p6_repin_wojna_2_battle_mode` (3 testy, 64 przypadki) | PORTOWANE (funkcja czysta); integracja z zapisem (`main.ts:29056`, `main.ts:40818-40820`) NASTĘPNA-PARTIA |
| `generals.ts` (nowy plik, +50): limit generałów, rezerwacja slotu, zakup, `nearestLivingGeneral`, `generalFollowDestination`, `planDeferredGeneralMarchBatch` | `gra/src/game/generals.ts:1-103` | — | — | NASTĘPNA-PARTIA (U3: `domain/generals.rs`) |
| `generalQuickFollow.ts` (nowy plik, +161): etykiety, `planEnabledGeneralFollowMarches`, `planTrackedGeneralFollowMarch`, `syncTrackedGeneralFollowMarches`, `issueGeneralQuickFollow` | `gra/src/game/generalQuickFollow.ts:1-161` | — | — | NASTĘPNA-PARTIA (U4: `domain/general_quick_follow.rs`; zależy od U3 i `planned-march`) |

Poza zakresem tego tematu (osobne ID, wg dispatchu): `gra/src/game/warAllInCapital.ts` (WOJNA-NOWE-D), `war-rules-multiwar.ts`, `ai.ts`.

## Pomiary

- Wektory `formation-rules.json` regenerowane z uruchomionego weba dc8a3adc: `classify` 2031, `slots` 711, `compact` 1872; rozmiar 2.26 MB (limit 10 MB). Generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-formation-vectors.mjs`.
- Wektory `battle-mode.json`: generator `gen-repin-wojna-2-battle-mode-vectors.mjs` (64 przypadki, 1 `true`).
- Mutanty (wszystkie zabite): M1 `rank_size = per` (FAIL), M2 ignorowanie `meleeLines/archerLines` (FAIL), M3 limit skrzydeł 3→2 (FAIL), M4 `battle_always_manual.is_some()` zamiast `== Some(false)` (FAIL, 2 testy). Logi: `mut-b1-*.log`, `mut-b2-M4-battle-mode.log`.
- Dowód równoważności dla nie-mutowanych gałęzi: pokryte wektorami (brzegi szerokości 0/0.5/0.7/2.99, linie 1/2/3/brak, pasma puste, jazda 1 i 5 jednostek).
- Założenie: wartości `NaN` / nieskończone `rankWidth` nie są pokryte wektorami (NIE_ZMIERZONO).
