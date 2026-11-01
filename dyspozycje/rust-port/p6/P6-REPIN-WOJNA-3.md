# P6-REPIN-WOJNA-3 — delta weba dc8a3adc → 4bbef081d (generałowie, tryb bitwy, zapis) + hook marszu generała

Temat: `R-RUSTPORT-REPIN-WOJNA-3-Q1` (runda 1/5). Baza Rust: `rust-port/parity-v2` `5f618f748` (U1–U4 i R4 z `R-RUSTPORT-REPIN-WOJNA-2-Q1` już zintegrowane — NIE powtarzane). Pin weba: `4bbef081d` (`git archive` do katalogu poza repo; zero buildu w `gra/`).

## 1. Delta `git diff dc8a3adc 4bbef081d -- generals.ts generalQuickFollow.ts formation-rules.ts battle army-leadership.ts planned-march.ts`

`git diff --stat`: 1 plik, `gra/src/battle/battleScene.ts`, +7/−1. Pozostałe pliki z listy (`generals.ts`, `generalQuickFollow.ts`, `formation-rules.ts` [w repo: `gra/src/battle/formationRules.ts`], `army-leadership.ts`, `planned-march.ts`) — brak delty. Dodatkowo `battle-mode.ts`: brak delty. `main.ts` (1852 linii delty): bloki zapisu/odczytu trybu bitwy i marszów są **bajt-w-bajt identyczne** po przesunięciu numeracji (porównanie zakresów: `playerBattleAutomaticOnly` dc8a3adc `main.ts:29050-29062` = 4bbef081d `:30149-30161`; `plannedMarchesToSave` `:32300-32312` = `:33392-33404`; `meta` `:32370-32382` = `:33462-33474`; `_battleModeSettingVersion = BATTLE_MODE_SETTING_VERSION` `:39525-39533` = `:40709-40717`; odczyt `:40814-40824` = `:42002-42012`; `plannedMarchesFromSave` `:40860-40868` = `:42048-42056`; deklaracja `:1819-1823` = `:1849-1853`). W diffie `main.ts` brak hunków dotykających `generalTarget`, `plannedMarches`, `battleModeSettingVersion`, `battleAlwaysManual`, `autoMarch`, `syncTracked…` (grep po `-U0`).

| Hunk behawioralny (plik:linia weba @ 4bbef081d) | Co zmienia | Plik:linia Rust | Test | Status |
|---|---|---|---|---|
| `gra/src/battle/battleScene.ts:3471` (`this._battleAwaitingOrders = true;` zamiast `= this._manualMode`, wokół `:3462-3470`) | Maszyna stanów sceny bitwy: w AUTO bez dowódcy `_kickoffBattleTurn` (`:3450-3453`) wracał od razu przy `!_battleAwaitingOrders`, więc tura 1 nigdy nie startowała | brak odpowiednika w silniku: `rust-port/engine` nie ma pętli tur bitwy ani `_kickoffBattleTurn`; w rendererze `battle_queue_only(ctrl, shift, awaiting_orders, round_no)` (`rust-port/renderer/src/battle/picking.rs:1142`) dostaje `awaiting_orders` jako PARAMETR | n/d | **NIE-DOTYCZY (silnik)**. Uzasadnienie: stan sceny / UI, `renderer/**` poza allowlistą. ZAŁOŻENIE: jeśli renderer przejmie automat stanów sceny, kontrakt do odtworzenia = `awaiting = true` bezwarunkowo przy starcie bitwy, kasowane wyłącznie przez kickoff (`:3452`); NASTĘPNA-PARTIA po stronie renderera |

## 2. Cel (1): integracja trybu bitwy z zapisem

Stan wejściowy (parity-v2): `SaveSnapshot.meta` (`battleModeSettingVersion`, `newGameParams.advanced.battleAlwaysManual`), `plannedMarches`, `autoMarch` — zrobione w `R-RUSTPORT-REPIN-WOJNA-2-Q1` R4 (`save_load.rs`). Ten temat dodaje:

| Zmiana (web 4bbef081d) | Plik:linia weba | Plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|
| Bloki zapisu/odczytu meta (bez zmian względem dc8a3adc) | `main.ts:33470` (`meta.battleModeSettingVersion`), `:42006-42010` (odczyt), `:30151-30160` (`playerBattleAutomaticOnly`) | `save_load.rs` `SaveMeta`, `battle_mode.rs` | `p6_repin_wojna_2_r4_save` (576 przypadków); generator R4 uruchomiony ponownie na pinie 4bbef081d daje plik **identyczny bajtowo** (`cmp`) | PORTOWANE (potwierdzone na nowym pinie) |
| `plannedMarches` w formie webowej: obiekt kluczowany id jednostki, `Object.entries` = kolejność wstawiania (klucze-indeksy tablicy najpierw, rosnąco) | `planned-march.ts:438-462` (`Object.entries`), `:466-490`; `main.ts:33399`, `:42052` | `save_load.rs::lenient_planned_marches` (`PlannedMarchesVisitor::visit_map`), `array_index_key` | `p6_repin_wojna_3_hook::{save_and_load_through_web_wire_json_match_web (700, w tym 229 z kluczami nie-alfabetycznymi), object_key_order_matches_js_object_keys, duplicate_object_key_keeps_first_position_and_last_value, non_container_planned_marches_read_as_empty}` | **ZMIENIONE (znaleziona rozbieżność)** |
| Round-trip zapisu Rust → odczyt | j.w. | `SaveSnapshot` serde (lista `[{unitId,…}]`) | `rust_save_then_load_round_trip_matches_web_vector` (700) | PORTOWANE |

**Znaleziona rozbieżność (naprawiona):** R4 czytał obiekt `plannedMarches` przez `serde_json::Value`, którego mapa jest posortowana alfabetycznie (`Cargo.toml` bez `preserve_order`). Web `JSON.parse` + `Object.entries` zachowuje kolejność wstawiania, a kolejność wpisów to kolejność planowania marszy (`marchExecQueue`). Dowód przed poprawką: `p6_repin_wojna_3_hook::save_and_load_through_web_wire_json_match_web` padał (przypadek 3: Rust `[a1, g0]`, web `[g0, a1]`). Poprawka w `save_load.rs` (visitor mapy, bez `Cargo.toml`). Poprzedni test R4 `planned_marches_wiring_…` podawał wpisy jako listę, więc rozbieżności nie widział.

ZAŁOŻENIA: (a) format zapisu Rust to lista `[{unitId,…}]`, nie obiekt weba — web NIE wczytuje zapisu z Rust (adapter Tauri nie istnieje; poza zakresem); (b) klucze-indeksy: zmierzone node v22 (`["2","7","4294967294","b","a","4294967295","007","-1","1.5"]`), id produkcyjne nie są indeksami (Z-P-1).

## 3. Cel (2): hook marszu generała (`generalQuickFollow` ↔ `planned-march`)

| Zmiana | Plik:linia weba | Plik:linia Rust | Test | Status |
|---|---|---|---|---|
| Jeden typ celu marszu: `generalQuickFollow.ts:2` importuje `PlannedMarchDest` z `planned-march` | `generalQuickFollow.ts:2`, `planned-march.ts:14-21` | `general_quick_follow.rs`: `TrackedMarchDest` = alias `pathfinding::ruch_jednostek::PlannedMarchDest` (dawny osobny struct usunięty) | kompilacja + `p6_repin_wojna_2_generals` (zielone, bez zmian) | PORTOWANE |
| `syncGeneralMarchTargets`: sync → planEnabled → kolejka wykonania (ruch > 0 i brak w kolejce) | `main.ts:28237-28250` | `general_quick_follow.rs::sync_general_march_targets`, `plan_enabled_general_follow_marches_with` (wspólna pętla; stara funkcja deleguje) | `sync_plan_and_queue_match_web` (700; planEnabled 404 jednostek, kolejka) | PORTOWANE |
| Wyłączenie „Idź do wodza”: kasuje marsz tylko przy prawdziwym `generalTargetId` | `main.ts:23497` | `pathfinding.rs::march_has_general_target`, `MarchMap::follow_off_clears` | j.w. (473 trafienia, wpisy z `''`) | PORTOWANE |
| `afterPlayerUnitSpawned`: `generalTargetId != null` | `main.ts:13393` | `pathfinding.rs::march_follows_general`, `MarchMap::is_general_follow` | j.w. (586 trafień; `''` ≠ null) | PORTOWANE |
| Zapis i odczyt marszy mapy | `main.ts:33399`, `:42052`, `planned-march.ts:438-490` | `MarchMap::to_save`/`from_entries` → `planned_marches_to_save`/`_from_save` | `save_and_load_through_web_wire_json_match_web`, `march_map_from_entries_behaves_like_js_map_set` | PORTOWANE |
| `planGeneralFollowMarch` (`buildMarchFogContext`, `marchPathPlan`, `occupiedForMove`) | `main.ts:28211-28236` | — (zależy od mgły/ścieżek/UI stosu gracza) | — | NASTĘPNA-PARTIA (planner jest traitem `TrackedFollowPlanner`; wpięcie do prawdziwego `marchPathPlan` poza zakresem) |

## 4. Pomiary

- Wektory `hook.json` (665 kB; limit 6 MB): generator `gen-repin-wojna-3-hook-vectors.mjs` (node v22.22.0, `--experimental-strip-types`) uruchamia kod weba z pinu BEZ ZMIAN: `generals.ts`, `generalQuickFollow.ts` (jedyna zmiana: rozszerzenie `.ts` w imporcie), `planned-march.ts:13-31,425-490` (wycięte dosłownie). Glue `main.ts:28241-28246` (kolejka) odtworzone 1:1 w generatorze; obecność wyrażeń `main.ts` sprawdzana (`mainChecks`).
- Odtworzenie wektorów z czystego pinu (bez ręcznych kroków): `git archive 4bbef081d gra/src/game gra/src/main.ts | tar -x -C <PIN_ROOT>`, potem `node --experimental-strip-types dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-3-Q1/gen-repin-wojna-3-hook-vectors.mjs <PIN_ROOT> <WORK_DIR> <OUT>`; `cmp <OUT> rust-port/engine/tests/p6_repin_wojna_3_vectors/hook.json` = identyczne. Podmianę importu `'./generals'` -> `'./generals.ts'` generator robi sam na kopii w `<WORK_DIR>` (asercja: dokładnie 1 wystąpienie); pin w `<PIN_ROOT>` nie jest modyfikowany.
- Niezależny weryfikator `verify-w3-hook.py` (`python3 -I`, reimplementacja od zera z TS, bez Rust i bez generatora): 700 przypadków, 0 rozbieżności (`verify-w3-hook.log`).
- Wektory dc8a3adc ponownie wygenerowane na pinie 4bbef081d: `save-meta.json` i `planned-march-general.json` identyczne bajtowo (`cmp`).
- Mutanty (jedno na raz, `git checkout --` po każdym, logi `mut-W3-*.log` z jedną linią `EXIT=`): M1–M16 wszystkie ZABITE (nieprzechodzące testy w logu): brak sync; `ruch >= 0`; brak deduplikacji kolejki; `has_march` zawsze false; follow-off bez filtra pustego; `!= null` jako prawdziwość; brak sortowania/odwrócone/niekanoniczny indeks/`u32::MAX` jako indeks; duplikat klucza (push; stara wartość); `from_entries` bez `set`; porzucenie listy w `visit_seq`; `to_save` puste; planEnabled bez flagi `followGeneral`. Brak mutantów równoważnych.
- NaN/brzegi: `''` w `generalTargetId`/`attackUnitId` (wektor), brak wpisu, `null`/liczba/napis/`{}`/`[]` zamiast `plannedMarches`, klucze-indeksy (5 brzegów), duplikat klucza, pusty zapis (`{}`). NaN współrzędnych: poza zakresem (wektory skończone; NaN generałów — R3 `p6_repin_wojna_2_r3_nearest_nan`).

## 5. Bramki

`gate-fmt.txt` EXIT=0; `gate-clippy.txt` (`--all-targets -D warnings`) EXIT=0; `gate-test.txt` (`cargo test --no-fail-fast -j 2`, pełny, bez timeoutu) EXIT=0, 260 binarek, 1981 passed / 0 failed; `git diff --check` czysty. Środowisko: `CARGO_TARGET_DIR=/home/user/cargo-target-w3` (dysk, nie `/dev/shm`: tmpfs zajęte przez inne worktree ~10 GB, rustc `lib` był zabijany przez OOM — SIGKILL — przy `-j 1` i `-j 2` także z `/dev/shm`).
