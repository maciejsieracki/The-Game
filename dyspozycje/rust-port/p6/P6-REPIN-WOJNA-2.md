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

## Weryfikacja niezależna (R-RUSTPORT-REPIN-WOJNA-2-Q1, runda 1, Operator-pomiary)

Commit weryfikowany: `9a16b238` (łańcuch `3d744de8` → `2117c4bf` → `9a16b238`). Pin weba: `dc8a3adc` (`git archive` do katalogu tymczasowego poza repo).

- Bramki (surowe logi, `EXIT=` w pliku): `fmt-verify.log` EXIT=0; `clippy-verify.log` EXIT=0; `verify-test.log` EXIT=0, suma wyników 1446 passed / 0 failed (197 binarek `test result`).
- Delta `91dc998a..dc8a3adc` dla `formationRules.ts`: wszystkie 9 hunków mieści się w `initialBattleSlots` (46-118) i `compactLineAllowsAdvance` (148-160). `classifyInitialBattleRole` (3-42) i `initialBattleFormation` (125-146) nie mają delty — NIE-DOTYCZY potwierdzone `git diff -U0`.
- Z-3 potwierdzone: `gra/src/game/army-leadership.ts` i `gra/src/game/ai-era-unit-promotion.ts` nie są w liście zmienionych plików między pinami.
- Przegląd kodu Rust vs web (`formation_rules.rs` 240-412, `battle_mode.rs`): `lines_for_band`, `lay_band`, `main_band_width`, skrzydła (`min(3, top, bottom).max(1)`), `rowStart`, `mounted` parzystość i `rank` — zgodne z `formationRules.ts:46-118`. `compact_line_allows_advance` zgodne z `:148-160`. `is_automatic_only_battle_mode` zgodne z `battle-mode.ts:2,9-14` (funkcja domyka się klamrą `}` w wierszu 14; cytowanie `:9-14` w kodzie i w tabeli §Tabela zmian jest poprawne — patrz „Odpowiedzi na zarzuty R1").
- Mutanty weryfikatora (każdy: `cargo test`, EXIT=101 = zabity; logi `mut-v-*.log`, przywrócenie pliku po każdym i `cmp` OK):

| ID | Mutacja | Gdzie | Wynik |
|---|---|---|---|
| X1 | limit skrzydeł 3 → 4 | `formation_rules.rs` (`wing_count`) | FAIL `formation_groups_and_slots_match_web` |
| X2 | `ceil` → `floor` w `playable_rows` | `lines_for_band` | FAIL `formation_groups_and_slots_match_web` |
| X3 | `floor` → `ceil` w `rowStart` (`rank_size/2`) | `lay_band` | FAIL `formation_groups_and_slots_match_web` |
| X4 | parzystość skrzydeł odwrócona | `initial_battle_slots` (`i % 2`) | FAIL `formation_groups_and_slots_match_web` |
| X5 | pominięcie `min(previous)` w compact | `compact_line_allows_advance` | FAIL `compact_line_matches_web_on_grid` |
| X6 | `<=` → `<` w compact | `compact_line_allows_advance` | FAIL `compact_line_matches_web_on_grid` |
| B1 | wersja `== Some(1)` → `is_some()` | `battle_mode.rs` | FAIL 2/3 (`legacy_save_*`, `automatic_only_matches_web_on_all_vectors`) |
| B2 | `== Some(false)` → `!= Some(true)` | `battle_mode.rs` | FAIL 2/3 (j.w.) |

Operatorskie M1-M4 pozostają ważne (logi `mut-b1-*`, `mut-b2-M4-battle-mode.log`).

- NaN / nieskończony `rankWidth` (lub `midRow`, `playRow0`, `playRow1`): zmierzone na webie 91dc998a→dc8a3adc, patrz „Odpowiedzi na zarzuty R1", pkt 4 (log `obrona-nan-probe-web.log`). Web daje wiersze `NaN` / `undefined`, czyli wynik poza kontraktem slotu; Rust daje wynik skończony. Rozbieżność jest prawdziwa, ale poza domeną wejść produkcyjnych (stałe `battleScene.ts`).
- Pozostaje NASTĘPNA-PARTIA: U3 `generals.ts`, U4 `generalQuickFollow.ts`, integracja battle-mode z zapisem (`main.ts:29056`, `:40818-40820`).

## Odpowiedzi na zarzuty R1 (obrona Operatora, R-RUSTPORT-REPIN-WOJNA-2-Q1, runda 1)

Stan wejściowy: commit `6a71fcb6` (odtworzony detached, kod Rust jak w `3d744de8`/`2117c4bf`). Kod Rust w tej obronie NIE zmieniony, więc bramki z `6a71fcb6` pozostają ważne (`fmt-verify.log`, `clippy-verify.log`, `verify-test.log`, EXIT=0).

1. **Zakres GOAL U1-U4 tylko częściowo — PRZYJMUJĘ (bez zmiany kodu w tej rundzie).** Temat NIE jest zamknięty. U3 `generals.rs`, U4 `general_quick_follow.rs` i integracja battle-mode z zapisem pozostają NASTĘPNA-PARTIA pod tym samym ID `R-RUSTPORT-REPIN-WOJNA-2-Q1` w rundach 2+ (limit 5). Żadna część GOAL nie jest tu deklarowana jako wykonana poza U1/U2.

2. **Cytowanie `battle-mode.ts :9-14` jest o wiersz za szerokie (`:9-13`) — ODRZUCAM (dowód) co do funkcji; PRZYJMUJĘ co do niespójności w dossier.** Dowód: `gra/src/game/battle-mode.ts` @ `dc8a3adc`, `cat -n`: wiersz 9 = `export function isAutomaticOnlyBattleMode(`, wiersz 13 = `return settingVersion === BATTLE_MODE_SETTING_VERSION && battleAlwaysManual === false;`, wiersz 14 = `}` (domknięcie funkcji). Zakres `:9-14` jest więc poprawny. Zarzut 2 wynikał z tego, że przegląd w dossier (§Weryfikacja, linia 35 przed poprawką) pisał `:9-13`, a tabela `:9-14`. Ujednolicono do `:9-14` (commit obrony, §Weryfikacja linia 35).

3. **Przeżyty mutant: usunięcie `.max(0.0)` przy `top_available` bez dowodu równoważności — PRZYJMUJĘ, dowód dodany.** Miejsce: `rust-port/engine/src/domain/formation_rules.rs:393` (`top_available`), `:395` (`wing_count`); web: `gra/src/battle/formationRules.ts:107-109` (`topWingRowsAvailable`, `wingRowCount`) @ `dc8a3adc`. Rozumowanie dla skończonego `top`:
   - `top >= 0`: `.max(0.0)` jest identycznością, mutant zachowuje się tak samo.
   - `top < 0`: oryginał daje `top' = 0`, więc `min(3, 0, bottom) <= 0`, a po `.max(1.0)` wynik = 1. Mutant daje `min(3, top, bottom) <= top < 0`, po `.max(1.0)` także = 1.
   - Symetrycznie dla `bottom`, które mutant nie rusza. Wynik `wing_count` jest identyczny dla każdego skończonego `top` i `bottom`, więc mutant jest RÓWNOWAŻNY i żaden test nie może go zabić bez zmiany domeny.
   - Jedyna różnica to `top = NaN`: Rust `f64::max`/`min` ignorują NaN, więc oryginał daje 1, a mutant może dać `min(3, bottom)`. NaN nie jest osiągalne: `main_row_start = mid_row - floor(band_width/2)` z `band_width = max(1, main_band_width)` i z całkowitych `mid_row`/liczb pasm (`formation_rules.rs:390-392`), a wejścia produkcyjne są stałymi (pkt 4).

4. **NaN / nieskończony `rankWidth` NIE_ZMIERZONO — PRZYJMUJĘ jako zmierzoną rozbieżność poza domeną; ODRZUCAM konieczność zmiany kodu.** Pomiar na webie (`dc8a3adc`, `node --experimental-strip-types`, skrypt `obrona-nan-probe.mjs`, log `obrona-nan-probe-web.log`):
   - `rankWidth: NaN` → wiersz `NaN` dla slotu 0 i `undefined` dla slotów 1-4 (4 z 5 slotów bez wiersza), rank `NaN`/`Infinity` (log `obrona-nan-probe-web.log`). Web nie daje poprawnego wyniku slotu.
   - `rankWidth: Infinity` i `-3` → wynik identyczny z bazowym (`Math.floor(Inf)=Inf`, `Math.max(1,-3)=1`).
   - `midRow`, `playRow0`, `playRow1` = NaN → także `NaN`/`undefined`. `playRow1`/`playRow0` = ±Infinity → wynik bazowy.
   - Rust: `rank_width.floor().max(1.0)` (`formation_rules.rs:315`) daje 1 dla NaN, więc wynik skończony. Rozbieżność jest realna, ale web w tym przypadku NIE produkuje poprawnego układu, więc nie ma czego wiernie odtwarzać.
   - Domena produkcyjna: `battleScene.ts:693` `RANK_WIDTH = 20`; `:631` `BF_ROWS = 156`; `:635` `PLAYABLE_ROWS = Math.round(BF_ROWS * Math.SQRT1_2)` = 110; `:637/:639/:641` `PLAY_ROW0`, `PLAY_ROW1`, `PLAY_MID_ROW` — wszystkie z tych stałych, skończone. Wywołania: `battleScene.ts:5022-5023` i `:16343-16344`. NaN/Inf nie są osiągalne z gry.
   - Status: NIE-DOTYCZY (wejście poza domeną produkcyjną; web nie ma poprawnego wyniku). ZAŁOŻENIE Z-4: wektory pozostają w domenie skończonej. Jeśli właściciel zażąda parytetu także dla NaN, to osobna decyzja, nie blokuje rundy 1.
