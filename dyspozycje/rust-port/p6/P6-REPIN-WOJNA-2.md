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
| `battle-mode.ts`: `BATTLE_MODE_SETTING_VERSION`, `isAutomaticOnlyBattleMode` | `gra/src/game/battle-mode.ts:2,9-14` | `rust-port/engine/src/domain/battle_mode.rs` | `p6_repin_wojna_2_battle_mode` (3 testy, 64 przypadki) | PORTOWANE (funkcja czysta, bez wpięcia; R3: logika integracji z zapisem `restored_setting_version`, `player_battle_automatic_only`, `main.ts:29052-29060`, `:40819-40821`); pole `meta.battleModeSettingVersion` w `save_load.rs` NASTĘPNA-PARTIA (zmiana formatu SaveSnapshot v2) |
| `generals.ts` (nowy plik, +50): limit generałów, rezerwacja slotu, zakup, `nearestLivingGeneral`, `generalFollowDestination`, `planDeferredGeneralMarchBatch` | `gra/src/game/generals.ts:1-103` | `rust-port/engine/src/domain/generals.rs` (cały plik, 1-103; pliku nie ma w `edb8fb56`, wiec 1-53 tez nowe) | `p6_repin_wojna_2_generals::{limit,slots,can_recruit,stone,purchase,nearest,follow_destination,batch}_matches_web` (`generals.json`: 20+60+120+2+600+260+160+80 przypadkow) | PORTOWANE (runda 2, logika, bez wpięcia) |
| `generalQuickFollow.ts` (nowy plik, +161): etykiety, `planEnabledGeneralFollowMarches`, `planTrackedGeneralFollowMarch`, `syncTrackedGeneralFollowMarches`, `issueGeneralQuickFollow` | `gra/src/game/generalQuickFollow.ts:1-161` | `rust-port/engine/src/domain/general_quick_follow.rs` | `p6_repin_wojna_2_generals::{labels,plan_enabled,issue,tracked_march,sync_tracked}_matches_web` (`general-quick-follow.json`: 5+260+260+220+260 przypadkow; mutanty U4-M01..M20 zabite, M03 równoważny) | PORTOWANE (runda 2, logika, bez wpięcia); `PlannedMarchDest.generalTargetId` i zapis/odczyt save (`planned-march.ts:446-490`) PORTOWANE (R3, `pathfinding.rs`, `p6_repin_wojna_2_r3_planned_march`) |

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
- Stan po rundzie 1 (historyczny, zastąpiony przez §Runda 2): U3 `generals.ts` i U4 `generalQuickFollow.ts` NASTĘPNA-PARTIA. Stan aktualny: patrz §Runda 2 (U3/U4 PORTOWANE w rundzie 2).

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

## Runda 2 (U3 `generals.ts`, U4 `generalQuickFollow.ts`)

Baza: `rust-port/parity-v2` `cb57e479` (U1/U2 zintegrowane). Pin: `dc8a3adc` (`git archive dc8a3adc gra/src gra/data` do katalogu tymczasowego poza repo).

**Status tematu: OTWARTY.** Runda 2/5 zakończona (U3 i U4 PORTOWANE). Temat `R-RUSTPORT-REPIN-WOJNA-2-Q1` NIE jest zamknięty: runda 3 pod tym samym ID wymaga rozszerzenia allowlisty o `pathfinding.rs` i `save_load.rs` (zakres: `PlannedMarchDest.generalTargetId` + save/load; integracja battle-mode z zapisem).

- **Zakres U3 (`generals.ts:1-103`)**: plik jest NOWY względem `edb8fb56` (`git diff --stat` 103 wstawień, 0 usunięć), więc cały plik, a nie tylko blok 54-103, jest portowany. Dowód: `git show edb8fb56:gra/src/game/generals.ts` → brak pliku. Port: `domain/generals.rs`. Liczby JS (`Math.max/floor`, NaN) przez `recruitment::army_merge::js_max` i `recruitment::manpower::locale_compare` (istniejące, zmierzone helpery).
- **Zakres U4 (`generalQuickFollow.ts:1-161`)**: port `domain/general_quick_follow.rs`. Efekty i planner są traitami; `MarchMap` naśladuje `Map` JS (kolejność wstawiania, `set` zachowuje pozycję). Teksty komunikatów skopiowane 1:1 (`notify` sprawdzany w wektorach).
- **Typ celu marszu**: `TrackedMarchDest` (z `generalTargetId`) jest lokalny w `general_quick_follow.rs`. `pathfinding::PlannedMarchDest` nie ma pola `generalTargetId`, a `pathfinding.rs` nie jest w allowliście tematu. **NASTĘPNA-PARTIA**: `planned-march.ts` `+19/-4` (`generalTargetId` w `PlannedMarchDest`, `plannedMarchesFromSave`/`plannedMarchesToSave` `planned-march.ts:446-485`) → rozszerzenie `pathfinding.rs` i `save_load.rs` w osobnym temacie.
- **Integracja battle-mode z zapisem** (`main.ts:29056`, `:40818-40820`): NASTĘPNA-PARTIA. Wymaga `save_load.rs` (poza allowlistą); logika `isAutomaticOnlyBattleMode` już portowana (U2).
- **Wektory**: `tests/p6_repin_wojna_2_vectors/generals.json` (449 kB) i `general-quick-follow.json` (757 kB; pomiar R2 Operator-pomiary: 448996 B i 756812 B), generator `gen-repin-wojna-2-generals-vectors.mjs` (uruchomiony na `dc8a3adc`; kopia z dopisanymi rozszerzeniami `.ts` w katalogu roboczym poza repo). Pokrycie: `purchase` 600 (60 wywołań kontynuacji, `purchaseCalled`=60), `nearest` 260, `followDest` 160, `batch` 80, `issue` 260 (`issued` 34, `unreachable` 21, `unavailable` 160, `ineligible` 45), `tracked` 220, `sync` 260.
- **ZAŁOŻENIA**: (a) `undefined` i `false` dla `isGeneral`/`dead`/... są równoważne; (b) `oblegaCityId` prawdziwe = niepusty napis; (c) NaN współrzędnych dotyczy tylko jednostki (wszystkie odległości NaN → sortowanie po id, spójne); NaN współrzędnej KANDYDATA przy ≥2 kandydatach daje komparator niespójny (zachowanie zależne od algorytmu sortu JS) — NIE_ZMIERZONO, poza wektorami; (d) `nearest_living_general` wybiera minimum liniowo zamiast `sort()[0]` (identyczne dla spójnego komparatora; ids unikalne); (e) `locale_compare` (Rust) dla napisów spoza ASCII porównuje kolejnością UTF-16, web `localeCompare` używa kolacji ICU — ZMIERZONO (patrz §Odpowiedzi na zarzuty R2, pkt 3); poza domeną, bo identyfikatory produkcyjne są ASCII.
- **Mutanty** (`mut-r2-*.log`, `EXIT=` w logu): U3 M1-M18 zabite wszystkie (po poprawce generatora M8/M10/M12). U4 M01-M02, M04-M20 zabite; **U4-M03 (planEnabled bez `!isGeneral`) przeżywa — RÓWNOWAŻNY**: `nearestLivingGeneral` zwraca `undefined` dla `unit.isGeneral` (`generals.ts:72`), więc `generalFollowDestination` daje `null` i jednostka jest pomijana (`generalQuickFollow.ts:31`).
- **Weryfikator niezależny** (`verify-r2-generals.py`, `python3 -I`): ponowna implementacja z TS, 0 rozbieżności na wszystkich wektorach.
- **Bramki**: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` 1459 passed / 0 failed (baseline 1446 + 13 nowych); `git diff --check` czysty (sprawdzone przed commitem).

## Odpowiedzi na zarzuty R2 (obrona Operatora, R-RUSTPORT-REPIN-WOJNA-2-Q1, runda 2)

Stan wejściowy: commit `6ddade6a` (odtworzony detached; kod Rust `882a8020`, dokumenty `8a4c332c`, pomiary `6ddade6a`). Dyspozycja: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/00-dispatch.md`.

1. **Sprzeczność dokumentu (P6 linia „Pozostaje NASTĘPNA-PARTIA: U3/U4") — PRZYJMUJĘ.** Zdanie oznaczone jako stan historyczny po rundzie 1 i odsyła do §Runda 2, gdzie U3/U4 są PORTOWANE. Tabela §Tabela zmian (wiersze `generals.ts`, `generalQuickFollow.ts`) od początku mówi PORTOWANE (runda 2). Raport obrony R2: run `05-operator-obrona-r2.md`.
2. **Zakres rundy 2 zamknięty tylko częściowo — PRZYJMUJĘ.** Temat jest OTWARTY (nagłówek §Runda 2): runda 3 pod tym samym ID. Odroczenie `planned-march` `generalTargetId`/save (`planned-march.ts:446-485`) i integracji battle-mode z zapisem (`main.ts:29056`, `:40818-40820`) jest uzasadnione allowlistą dispatchu (`pathfinding.rs` i `save_load.rs` poza allowlistą R2, dispatch §ALLOWLISTA); nie jest zamknięciem zakresu.
3. **`locale_compare` poza ASCII nie jest pokryty — PRZYJMUJĘ (zmierzone, dopisane do ZAŁOŻEŃ).** Pomiar: web (Node v22.22.0, `obrona-locale-probe.mjs`, log `obrona-locale-probe-web.log`) vs Rust (sonda tymczasowa, usunięta po pomiarze, log `obrona-locale-probe-rust.log`):
   - `"ą"` vs `"b"`: web -1, Rust +1 (rozbieżność); `"é"` vs `"f"`: web -1, Rust +1; `"ł"` vs `"m"`: web -1, Rust +1.
   - `"ż"` vs `"z"`: web +1, Rust +1 (zgodne); `"prod_1_Łódź"` vs `"prod_1_Lodz"`: web +1, Rust +1 (zgodne).
   - Rozbieżność realna w `locale_compare` (`recruitment.rs:1545-1572`, gałąź `else` = kolejność UTF-16). Wpływ na `generals`: tylko remis odległości (`compare_nearest`, `generals.rs` ~186-196) przy identyfikatorach z ≠ ASCII. Poza domeną: identyfikatory produkcyjne są ASCII (`prod_<turn>_<cityId>_<base36>`, `main.ts:4043`; `diffbonus_...`, `main.ts:9897`; brak `"id"` z non-ASCII w `gra/data` @ dc8a3adc: `git grep -P` → 0 trafień). Kod nie zmieniony (poprawka kolacji ICU byłaby osobnym tematem); ZAŁOŻENIE (e) w `generals.rs` i w §ZAŁOŻENIA.
4. **Pełny `cargo test --no-fail-fast` nie odtworzony — PRZYJMUJĘ, odtworzone w tej obronie.** Poprzedni brak miejsca na dysku (0 MB) już nie występuje (2.3 GB wolne po buildzie). Wyniki (surowe logi w katalogu runu, `EXIT=` w pliku): `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0 (`clippy-obrona-r2.log`); `cargo test --no-fail-fast --no-run` EXIT=0 (`test-obrona-r2-build.log`); `cargo test --no-fail-fast` EXIT=0, 1459 passed / 0 failed, 198 wierszy `test result` (`test-obrona-r2.log`).

Pliki zmienione w obronie R2: wyłącznie `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-2.md`, `rust-port/engine/src/domain/generals.rs` (komentarz modułu, bez zmiany kodu), katalog runu. Sonda Rust `tests/obrona_tmp_locale_probe.rs` była tymczasowa i została usunięta przed commitem.

## Runda 3 (planned-march `generalTargetId`, battle-mode z zapisem, domkniecie NaN z R2)

Baza: `rust-port/parity-v2` `9e56f6e3c` (U1-U4 zintegrowane). Pin: `dc8a3adc`. Rozszerzona allowlista (decyzja orkiestratora): `pathfinding.rs`, `save_load.rs`, `tests/{pathfinding,save_load}.rs`, `tests/p6_repin_wojna_2_r3_*`.

**Status tematu: OTWARTY w zakresie `meta.battleModeSettingVersion` (save_load).** Reszta zakresu R3 zrobiona (patrz tabela).

| Zmiana (web) | Plik:linia weba (dc8a3adc) | Plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|
| `PlannedMarchDest.generalTargetId` (typ) | `gra/src/game/planned-march.ts:14-21` | `pathfinding.rs` `PlannedMarchDest::general_target_id`, `PlannedMarchSaved::general_target_id` | `p6_repin_wojna_2_r3_planned_march` (kompilacja + wektory) | PORTOWANE (logika, bez wpięcia) |
| `plannedMarchesFromSave`: wyjatek od odrzucenia zgodnej pozycji przy niepustym `generalTargetId` | `planned-march.ts:452-455` | `pathfinding.rs::planned_marches_from_save` (`has_general`) | `planned_marches_from_save_with_general_target_matches_web` (900 przypadkow, 354 wpisy z generalTargetId, 179 z zgodna pozycja); mutant PM1 zabity | PORTOWANE (logika, bez wpięcia) |
| `plannedMarchesFromSave`: `generalTargetId` tylko niepusty napis | `planned-march.ts:460-462` | `pathfinding.rs` (filtr `!is_empty`) | j.w.; `general_target_edge_cases_are_explicit` | PORTOWANE (logika, bez wpięcia) |
| `plannedMarchesToSave`: `...(generalTargetId ? {...} : {})` | `planned-march.ts:481-486` | `pathfinding.rs::planned_marches_to_save` | `planned_marches_to_save_with_general_target_matches_web` (300 przypadkow, 155 z generalTarget); mutant PM2 zabity | PORTOWANE (logika, bez wpięcia) |
| `restoreGameFromSave`: normalizacja wersji (`=== 1 ? 1 : undefined`) | `gra/src/main.ts:40819-40821` | `battle_mode.rs::restored_setting_version` | `p6_repin_wojna_2_r3_battle_mode::restored_setting_version_matches_web` | PORTOWANE (logika, bez wpięcia) |
| `playerBattleAutomaticOnly` (`isMe` + `isAutomaticOnlyBattleMode`) | `gra/src/main.ts:29052-29060` | `battle_mode.rs::player_battle_automatic_only` | `player_battle_automatic_only_matches_web_on_all_combinations` (126 kombinacji); mutant BM1 (bez `isMe`) zabity | PORTOWANE (logika, bez wpięcia) |
| zapis `meta.battleModeSettingVersion` i odczyt z `saved.meta` | `gra/src/main.ts:32378`, `:40818` | brak pola w `save_load.rs` (SaveSnapshot v2: `version`, `state`, `event_queue`, `rng`) | NIE-DOTYCZY w tej rundzie | NASTĘPNA-PARTIA (zmiana formatu zapisu; wymaga decyzji o wersji SaveSnapshot); do tego czasu rozstrzygnięte ZAŁOŻENIEM Z-R3-4 (obrona R3, pkt 1) |
| `nearestLivingGeneral` przy NaN wspolrzednej kandydata (domkniecie R2) | `gra/src/game/generals.ts:76-82` (`.sort(cmp)[0]`) | `generals.rs::nearest_living_general` + `v8_sort_small` (TimSort V8 dla n<64) | `p6_repin_wojna_2_r3_nearest_nan` (400 przypadkow, 328 z NaN; przed poprawka 1 rozbieznosc, np. przypadek 25: web `c`, Rust `b`); mutant NM1 (bez odwrocenia runu) zabity | PORTOWANE (logika, bez wpięcia; n <= 3 z kodu weba, Z-R3-1 rozstrzygnięte w obronie R3, pkt 3) |

### Wektory i generatory (R3)

- `tests/p6_repin_wojna_2_r3_vectors/planned-march-general.json` (349 kB): generator `gen-repin-wojna-2-r3-planned-march.mjs` wycina dosłownie `planned-march.ts:13-31` i `:425-490` z pinu i uruchamia w node v22.22.0 (`--experimental-strip-types`).
- `tests/p6_repin_wojna_2_r3_vectors/battle-mode-restore.json` (10 kB): generator `gen-repin-wojna-2-r3-battle-mode.mjs` importuje `battle-mode.ts` bez zmian; pełny iloczyn 9 x 7 x 2.
- `tests/p6_repin_wojna_2_r3_vectors/nearest-nan.json` (103 kB): probe `gen-repin-wojna-2-r3-nan-nearest-probe.mjs` importuje `generals.ts` bez zmian.

### Weryfikacja niezalezna (R3)

- `verify-r3.py` (`python3 -I`, reimplementacja od zera z TS pinu, bez kodu Rust): `planned-march` from/to-save, `battle-mode` (126 wierszy), `nearest` z symulacja V8 TimSort: 0 rozbieznosci. Log: `verify-r3.log`.

### ZALOZENIA (R3)

- **Z-R3-1**: sortowanie V8 (TimSort) dla n < 64 jest odtworzone (jeden przebieg `CountAndMakeRun` + `BinaryInsertionSort`, bez scalania, bo dla n < 64 `minrun = n`). Precondycja n < 64 ROZSTRZYGNIĘTA KODEM WEBA (obrona R3, pkt 3): liczba zywych generalow wlasciciela <= `generalLimitForEra(era)` <= 3 (`generals.ts:1-4`; epoki 1-3: `production.ts:188-195`, `:2320-2324`), a wszystkie sciezki tworzenia generala przechodza bramke limitu (`main.ts:4095-4112`, `:7005`; UI `cityPanel.ts:8301` z `disabledReason` z `main.ts:6870`). Rust: `debug_assert!(n < 64)` w `generals.rs::v8_sort_small`. Dla n >= 64 sortowanie nie jest odtworzone i jest NIEOSIĄGALNE w domenie weba.
- **Z-R3-2**: `isMe(ownerId)` modelowane jako wejscie `bool` (`player_battle_automatic_only(is_me, ...)`); sposob wyznaczenia `isMe` po stronie gry poza zakresem tego modulu.
- **Z-R3-3**: `battleAlwaysManual` jako `Option<bool>` (jak w U2): tylko boolowskie `false` aktywuje tryb.
- **Z-R3-4** (obrona R3, pkt 1): zapis `meta.battleModeSettingVersion` (`main.ts:32378`) i jego odczyt (`main.ts:40818`) NIE są wpięte w `save_load.rs` (SaveSnapshot v2). ZAŁOŻENIE: w tej fazie silnik Rust nie wczytuje zapisów webowych, więc brak pola nie zmienia zachowania silnika; `restored_setting_version(None)` = brak markera = legacy (`automatic-only` nieaktywne). Konsekwencja: zapis webowy z markerem `1`, wczytany w Rust, dałby `automatic-only` nieaktywne, czyli rozbieżność. Jeśli Rust ma wczytywać zapisy webowe, temat jest OTWARTY do dodania `meta.battleModeSettingVersion` (addytywne pole `Option`, domyślnie `None`, wzór: `restored_setting_version`). Nie jest to zamknięcie luki, tylko jawne założenie z konsekwencją.
- **Z-P-1 ROZSTRZYGNIĘTE** (obrona R3, pkt 4): patrz „Odpowiedzi na zarzuty R3", pkt 4. Dotyczy wyłącznie kluczy będących indeksami tablicowymi JS; identyfikatory produkcyjne ich nie są.

### Bramki (R3)

- `cargo fmt --all -- --check`: EXIT=0 (`fmt-r3b.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`clippy-r3b.log`).
- `cargo test --no-fail-fast`: 1591 passed / 0 failed, 220 binarek `test result`, EXIT=0 (`test-r3.log`). Uwaga: baseline z dispatchu (1313) jest nieaktualny; pomiar przed R3 na tym pinie NIE_ZMIERZONO (zakres R3 dodaje 7 testow + istniejace).
- Mutanty R3: PM1 (zachowanie zgodnej pozycji bez `generalTargetId` usuniete), PM2 (niepusty filtr `generalTargetId` przy zapisie usuniety), BM1 (bez `isMe`), NM1 (bez odwrocenia runu w sortowaniu) - wszystkie zabite (logi `mut-pm1.log`, `mut-pm2.log`, `mut-bm1.log`, `mut-nm1b.log` w katalogu runu; pliki w `/home/user/cargo-target-shared` poza repo).

## Weryfikacja niezalezna R3 (Operator-pomiary, R-RUSTPORT-REPIN-WOJNA-2-Q1, runda 3)

Commit weryfikowany: `6ee3141a7` (detached). Pin weba: `dc8a3adc` (`git archive` do `/home/user/webpin-r3pomiary`, poza repo).

**Status tematu: OTWARTY.** Zakres R3 zweryfikowany; brakuje `meta.battleModeSettingVersion` (zapis i odczyt w `save_load.rs`) oraz wpiecia funkcji w wywolania silnika.

### Bramki (surowe logi, `EXIT=` w pliku)

- `cargo fmt --all -- --check`: EXIT=0 (`fmt-pomiary-r3.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`clippy-pomiary-r3.log`).
- `cargo test --no-fail-fast`: EXIT=0, 220 wierszy `test result`, suma 1591 passed / 0 failed (`test-pomiary-r3.log`).
- `git diff --check`: sprawdzone przed commitem.

### Regeneracja wektorow z weba dc8a3adc (niezalezna od commitu Operatora)

Generatory z katalogu runu uruchomione ponownie na pinie `dc8a3adc` i porownane bajt po bajcie z plikami w `tests/p6_repin_wojna_2_r3_vectors/`:
- `planned-march-general.json` (348879 B): identyczny (`cmp` OK), log `vectors-regen-pomiary-r3.log`.
- `battle-mode-restore.json` (10012 B): identyczny.
- `nearest-nan.json` (103285 B): identyczny.

### Weryfikator niezalezny

- `verify-r3.py` uruchomiony ponownie (`python3 -I`): `verify-r3 nearest: cases=400 withNaN=328 mismatches=0`; `fromSave=900 toSave=300 battleMode=126 fails=0`; EXIT=0 (`verify-r3-pomiary.log`).
- Przeglad zgodnosci reimplementacji z TS pinu: `planned-march.ts:426-490` (warunki `has_gen` przed pominieciem zgodnej pozycji, filtr niepustego napisu, legacy `autoMarch`, kolejnosc wpisow), `battle-mode.ts:9-14`, `main.ts:29052-29060`, `main.ts:40819-40821`, `generals.ts:76-82` (`NaN || localeCompare` = fallback na id), symulacja CountAndMakeRun + BinaryInsertionSort V8 dla n < 64. Zgodne.
- Przeglad Rust vs web: `generals.rs::compare_nearest` (NaN roznicy → gałąź `localeCompare`, jak `NaN || ...` w TS), `v8_sort_small` (kolejnosc wywolan komparatora zgodna z CountAndMakeRun/BinaryInsertionSort V8), `pathfinding.rs::planned_marches_from_save/to_save` (`has_general`, filtry niepustych napisow), `battle_mode.rs` (`restored_setting_version`, `player_battle_automatic_only`). Zgodne z pinem.

### Mutanty na galeziach R3 (kazdy: patch, `cargo test` na 8 binarkach, przywrocenie pliku i asercja rownosci)

| ID | Mutacja | Plik | Wynik | Log |
|---|---|---|---|---|
| PM3 | `generalTargetId` bez filtra niepustego napisu w `has_general` | `pathfinding.rs` | FAIL 2 (`general_target_edge_cases_are_explicit`, `planned_marches_from_save_with_general_target_matches_web`) | `mut-pomiary-r3-PM3.log` |
| PM4 | `generalTargetId` bez filtra niepustego napisu przy zapisie | `pathfinding.rs` | FAIL 2 (`general_target_edge_cases_are_explicit`, `planned_marches_to_save_with_general_target_matches_web`) | `mut-pomiary-r3-PM4.log` |
| NM2 | `diff >= 0` zamiast `> 0` w komparatorze | `generals.rs` | FAIL 3 | `mut-pomiary-r3-NM2.log` |
| NM3 | `NaN` roznicy traktowany jak `> 0` | `generals.rs` | FAIL 3 (w tym `nearest_living_general_with_nan_candidate_matches_web`) | `mut-pomiary-r3-NM3.log` |
| NM4 | odwrocona detekcja malejacego runu (`cmp(items[0], items[1])`) | `generals.rs` | FAIL 4 | `mut-pomiary-r3-NM4.log` |
| NM5 | `hp >= 0` zamiast `hp > 0` | `generals.rs` | FAIL 1 (`nearest_living_general_matches_web`) | `mut-pomiary-r3-NM5.log` |
| BM2 | `restored_setting_version` akceptuje dowolna wartosc (`is_some`) | `battle_mode.rs` | FAIL 3 (`legacy_save_without_marker_never_activates_auto_only`, `restored_setting_version_matches_web`, `player_battle_automatic_only_matches_web_on_all_combinations`) | `mut-pomiary-r3-BM2.log` |

Mutanty PM1, PM2, BM1, NM1, NM1b (Operator-impl) pozostaja zabite (logi w katalogu runu). Wszystkie 7 nowych mutantow zabite; zaden nie przezyl, wiec brak dowodow rownowaznosci do dopisania.

### Ustalenia niezaleznego przegladu (nowe)

1. **Brak wywolan produkcyjnych.** `planned_marches_from_save`, `planned_marches_to_save` (poza wewnetrznym `validate_auto_march_from_save`), `restored_setting_version`, `player_battle_automatic_only` nie maja wywolan poza testami (`grep` po `src/` i `tests/`). `save_load.rs` nie zawiera pola planned marches ani `meta`. Status „PORTOWANE" w tabeli R3 oznacza funkcje czyste, nie zachowanie zapisu w grze. Doprecyzowanie: NASTĘPNA-PARTIA (wpiecie do zapisu i wczytania).
2. **Kolejnosc kluczy obiektu JS (ZALOZENIE Z-P-1).** `plannedMarchesToSave` buduje obiekt `plannedMarches[unitId]`. Silnik JS ustawia klucze calkowitoliczbowe przed innymi, wiec kolejnosc wpisow po wczytaniu moze sie roznic od `Map`. Rust zachowuje kolejnosc wstawiania. Dotyczy tylko identyfikatorow calkowitoliczbowych; identyfikatory produkcyjne nie zostaly zmierzone (NIE_ZMIERZONO). Wplyw: kolejnosc planowania marszy.
3. **Rostery >= 64 (ZALOZENIE Z-R3-1)** pozostaja NIE_ZMIERZONO; sortowanie V8 dla n >= 64 nie jest odtworzone.

### Pozostaje do zamkniecia tematu

- `meta.battleModeSettingVersion` w zapisie (`main.ts:32378` zapis, `main.ts:40818-40821` odczyt) — zmiana formatu SaveSnapshot v2 w `save_load.rs`.
- Wpiecie `player_battle_automatic_only` w wywolania silnika (`main.ts:29052-29060`).
- Wpiecie `planned_marches_*` w zapis/odczyt gry (poza funkcjami czystymi).

## Odpowiedzi na zarzuty R3 (obrona Operatora, R-RUSTPORT-REPIN-WOJNA-2-Q1, runda 3)

Stan wejściowy: commit `10159d696` (odtworzony detached; kod Rust z `6ee3141a7`). Zmiany w obronie: `rust-port/engine/src/domain/generals.rs` (`debug_assert!(n < 64)` w `v8_sort_small`, komentarz modułu) — commit `4e6c899c1`; dossier i logi — commit podany w raporcie. Bramki po zmianie: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` EXIT=0, 220 wierszy `test result`, 1591 passed / 0 failed (`*-obrona-r3.log`).

1. **Brak `meta.battleModeSettingVersion` w `save_load.rs` — PRZYJMUJĘ; luka rozstrzygnięta ZAŁOŻENIEM Z-R3-4 (nie odłożona). Temat pozostaje OTWARTY.** Założenie: silnik Rust w tej fazie nie wczytuje zapisów webowych, więc brak pola nie zmienia zachowania silnika; `restored_setting_version(None)` traktuje brak markera jako legacy. Konsekwencja (jawna): zapis webowy z markerem `1` wczytany w Rust daje `automatic-only` nieaktywne. Dowody: web zapis `main.ts:32378`, odczyt `main.ts:40818-40821`, reguła `battle-mode.ts:9-14`; Rust: brak pola w `save_load.rs` (SaveSnapshot v2), `battle_mode.rs:33`.

2. **Status „PORTOWANE" bez wpięcia — PRZYJMUJĘ.** Zmieniono status na „PORTOWANE (logika, bez wpięcia)" w wierszach 14-16 i 114-121 tabeli. Dowód braku wywołań: `grep -rn` po `rust-port/engine/src` — `planned_marches_from_save`/`planned_marches_to_save` (`pathfinding.rs:2155`, `:2235`), `restored_setting_version` i `player_battle_automatic_only` (`battle_mode.rs:33`, `:43`) mają zero wywołań poza testami; `nearest_living_general` (`generals.rs:161`) jest wywoływany wyłącznie przez port `general_quick_follow.rs:69,111`, który też nie ma wpięcia do gry.

3. **Sortowanie V8 dla n >= 64 i identyfikatory spoza ASCII — PRZYJMUJĘ; precondycja n < 64 ROZSTRZYGNIĘTA KODEM WEBA (Z-R3-1).** Dowód: (a) `generals.ts:1-4` — `generalLimitForEra(era) = max(1, floor(era))`; (b) epoki w grze to 1-3 (`production.ts:188-195` `EPOCH_BY_NAME`, `:2320-2324` `EPOCH_NUMBER_TO_NAME`), więc limit ≤ 3; (c) wszystkie ścieżki tworzenia generała przechodzą bramkę limitu: `main.ts:4095-4112` (`attemptGeneralPurchase` → `canRecruitGeneral`), `main.ts:7005` (AI, `canRecruitGeneral`), UI `cityPanel.ts:8301` (`!offer.disabledReason`), gdzie `disabledReason` pochodzi z `canRecruitGeneral` (`main.ts:6870`); (d) `nearestLivingGeneral` filtruje po `ownerId` i `isGeneral` przed sortowaniem (`generals.ts:73-80`), więc n = liczba żywych generałów właściciela ≤ 3. Rust: `debug_assert!(n < 64)` w `v8_sort_small`. Testy R3 używają rosterów do 5 elementów (powyżej granicy), co pokrywa obie strony. Identyfikatory: `grep -rnP '"id"\s*:\s*"[^"]*[^\x00-\x7F]' gra/data` @ `dc8a3adc` = 0 trafień; identyfikatory produkcyjne są prefiksowane ASCII (`main.ts:4043`, `:5243` `dip_`, `:9897`, `:27629`, `:34859`, `:37827`). ZAŁOŻENIE (ograniczenie): identyfikatory spoza ASCII, których nie ma w `gra/data` i w tych konstrukcjach, NIE_ZMIERZONO.

4. **Kolejność kluczy JS dla id całkowitoliczbowych (Z-P-1) — PRZYJMUJĘ; ZMIERZONE, NIE-DOTYCZY w produkcji.** Pomiar (node v22.22.0, `EXIT=0`): `Object.keys({b:1, "7":2, a:3, "prod_1_x_ab":4})` = `["7","b","a","prod_1_x_ab"]`, czyli klucze będące indeksami tablicowymi idą przed pozostałymi. Wszystkie znalezione konstrukcje id jednostek (`main.ts:4043`, `:5243`, `:9897`, `:27629`, `:34859`, `:37827`) zaczynają się od prefiksu niebędącego cyfrą, więc klucz `plannedMarches[unitId]` nigdy nie jest indeksem tablicowym i kolejność wstawiania jest zachowana (jak w `Map` i w Rust). ZAŁOŻENIE (ograniczenie): pełna enumeracja wszystkich ścieżek tworzenia jednostek nie została wykonana (NIE_ZMIERZONE poza znalezionymi konstrukcjami).

### Pozostaje do zamknięcia tematu (runda 4)

- Z-R3-4: wpięcie `meta.battleModeSettingVersion` (zapis `main.ts:32378`, odczyt `main.ts:40818-40821`) w `save_load.rs`, jeśli Rust ma wczytywać zapisy webowe.
- Wpięcie `player_battle_automatic_only` (`main.ts:29052-29060`) i `planned_marches_*` w zapis/odczyt gry (poza funkcjami czystymi).
