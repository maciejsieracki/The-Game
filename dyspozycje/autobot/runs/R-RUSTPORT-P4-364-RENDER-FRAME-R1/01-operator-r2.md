# R-RUSTPORT-P4-364-RENDER-FRAME-R1 — Operator, runda 2 (DODATEK r2: RENDER_FRAME_GAPS)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-RENDER-FRAME-R1
GOAL: domknięcie luk ramki renderera (`RENDER_FRAME_GAPS` z r1) wg kodu webu (pin `07d2fbd72`): 1) `overlays.buildHighlight.hexes`, 2) `stacks.vitalsByRepId`, 3) `units[].hp`/`hpMax` z `hpMaxEffective`, 4) `stacks.starvingRepIds`/`goldDeficitRepIds`, 5) `overlays.workerFields` — produkcja tam, gdzie `PlayableState` niesie dane; jawna luka z numerem długu tam, gdzie nie.
ZMIANY/COMMIT: baza r2 `ff037335d3f193f7ff01d76aca8f31c9458200c1` (zgodnie z linią „BAZA r2”; `origin/rust-port/parity-v2` przesunęło się w międzyczasie na `0941c8225`, nie użyte — dispatch r2 wskazuje `ff037335d`). Gałąź `rust-port-wip/364-render-frame-r2`. Pliki: `rust-port/engine/src/domain/render_frame.rs`, `rust-port/engine/tests/p4_364_render_frame.rs`, katalog runs (ten raport, `mutate-r2.py`, logi). SHA commitu: w sekcji „Commit” na końcu (uzupełniane po commicie w komunikacie zwrotnym).
TESTY: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --test p4_364_render_frame` 27 passed (26 tematu + 1 z `bridge.rs`), EXIT 0; mutacje r2 13/13 FAIL (`mutate-r2.log`); mutacje r1 na kodzie r2 11/11 FAIL (`mutate-r1-na-r2.log`); pełna bramka engine: patrz sekcja „Pełna bramka”.
BLOKADY: brak blokad technicznych. Luki 4 i 5 pozostają jawne (zależność #310 EKONOMIA-STAN, decyzja techniczna orkiestratora z dyspozycji r2).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2.
DEPLOY/PUSH: NIE WYKONANO

## Co zrobiono (wg luk dyspozycji r2)

| # | Luka | Wynik r2 | Źródło web (pin `07d2fbd72`) | Rust |
|---|---|---|---|---|
| 1 | `overlays.buildHighlight.hexes` | WYPRODUKOWANE (3 tryby) | `refreshBuildHighlight` `main.ts:16351-16396`; `canFoundPlayerCityAt` `:12923-12943` + `foundingTerritoryOpts` `:12906-12920` + `canFoundCity` `cities.ts:1163`; `qualifyingWonderHexesForPlayer` `:5210-5214` + `wonderPlacementContext` `:5189-5207` + `wonder-placement.ts:53-119`; `buildApi.getQualifyingHexes` `:16293-16337` (`createImprovementBuildApi`, owinięcie `isImprovementAllowedForCiv`) | `FoundCityCtx` (`state::p6_6b::cities::can_found_city`, `terrain::founding_nodes_for_owner`, `territory::is_in_territory`, `fort_territory::is_hex_in_foreign_fort_territory`, `StartRevealContext::can_found_player_city_at`); `qualifying_wonder_hexes` (`wonder_placement::list_qualifying_wonder_hexes_for_owner`); `improvement_build_state` + `improvement_qualifying_hexes` (`improvement_build::create_improvement_build_api`) |
| 2 | `stacks.vitalsByRepId` | WYPRODUKOWANE | `syncUnitsRender` `main.ts:14476-14508` (`computeStackDisplay(src, unitAttackScore, { maxHpOf, defOf })`); `combatPowerFullDisplayDefFor` `:33936-33962`; `combatPowerScaledDefFor` `:9543-9546`; `veteranScaledDefFor` `:33063-33070`; `difficultyCombatMultForOwner` `:9506-9511`; `aiDiffLevelForOwner` `:9517-9520`; `applyVeteranFracToCombatUnit` `veteran.ts:362-385`; `applyDifficultyCombatToUnitDef` / `qualifiesForMajorAiDifficultyBonus` `ai-difficulty-bonus.ts:18-60`; `sumRosterFieldM` / `isFieldBattleUnit` `auto-battle-power.ts:37-59`; `veteranLevel` `veteran.ts:106-115` | `stack_view` + `StackVitalsDeps` (`recruitment::army_merge::compute_stack_display` / `stack_vitals` bez zmian), `full_display_def`, `difficulty_combat_mult`, `sum_roster_field_m` (`brake_power_army::army_field_power`), `veteran_level`, `vitals_dto` |
| 3 | `units[].hp` / `hpMax` | WYPRODUKOWANE | `effectiveRuntimeUnitMaxHp` / `syncRuntimeUnitHpState` `main.ts:33099-33118` (= `unitCardCombatFor(u, def).hpMaxEffective`, `unit-card-stats.ts:79-95,114`) | `hp_max_effective` (`unit_health::effective_max_hp`, `unit_health`, `veteran_combat_bonus_frac`; `unit_parametry_bonus_frac`), `synced_hp` |
| 4 | `stacks.starvingRepIds` / `goldDeficitRepIds` | JAWNA LUKA (`RENDER_FRAME_GAPS`) | `isArmyHungry` `empire-food.ts:353-356` (`_lastTicks.glodWojska`), `isGoldDeficit` `gold-deficit.ts:149-151` (`_lastTicks.deficytZlota`) | brak producenta: `PlayableState` nie uruchamia tiku ekonomii i nie niesie jego wyniku per właściciel (`economy.treasury` to skarbiec, nie flaga tiku). Zależność: **#310 EKONOMIA-STAN**, #304 EKONOMIA-TURA |
| 5 | `overlays.workerFields` | JAWNA LUKA (`RENDER_FRAME_GAPS`) | `refreshWorkerFieldOverlay` `main.ts:15432-15448` (`collectWorkedHexOwnerMapByOwnerYield` nad `City` ekonomii) | producent `overlays_view::worker_fields_view` istnieje, ale wymaga `City` ekonomii (okolicaFocus/Tryb/ręczne heksy, populacja na żywo) i plonów z złóż/rzek; `PlayableCity` ich nie niesie. Zależność: **#310 EKONOMIA-STAN** |

## Decyzje techniczne operatora (r2)

- **D-OP-5 (fotel w buildHighlight)**: założenie miasta i cud liczone dla fotela zapytania (web `ME()` / `isMe`), budowa ulepszeń dla fotela głównego — pin buduje `createImprovementBuildApi` z literałem `0` (`playerCityNodes()` `:16214-16218` = `ownerId === 0`, `playerOwnerIdNum: 0`, `citySurowceSumForOwner(0)`, `ownUnitHexKeysForOwner(0)`; `player.civType/era/zbadane`). Web `0` = `HUMAN_OWNER_PRIMARY` = Rust `turn_war_inputs::HUMAN_OWNER_ID` (1). Odwzorowane 1:1, łącznie z tą asymetrią webu w hotseacie.
- **D-OP-6 (hp/hpMax)**: DTO `hp: f64` nie ma `undefined`; `hp` undefined (= pełne, `units/setup.ts:60`) wystawiane jako `hpMaxEffective` (to samo, co `stackHpPool` przyjmuje dla braku `hp`). `hpMax` zawsze `Some(hpMaxEffective)` — `syncRuntimeUnitHpState` nadpisuje cache `u.hpMax` przy każdym `syncUnitsRender`. Zmienia to dwa asercje r1: start `hpMax` `None` → `Some(22)`, test ekonomii `hpMax` 20 (stary cache) → 22.
- **D-OP-7 (bonus trudności AI)**: `qualifiesForMajorAiDifficultyBonus(ownerId > 0 && !barbarzyńca && !miasto-państwo)`: web `ownerId > 0` = właściciel różny od fotela głównego (Rust `HUMAN_OWNER_ID`). Właściciele stanu nie są barbarzyńcami (u64), stan nie ma miast-państw (`typCityCopyOwners` puste → `_menuDifficulty` = `params.difficulty`, etykiety jak `main.ts:44372-44374`; nieznana etykieta = jawny błąd `UnknownDifficulty`).
- **D-OP-8 (`softBadgeLevel`)**: r1 wystawiał `soft_path_badge_level(None)` z adnotacją „stan nie ma unitBuildingProgress”, a `PlayableReplaceUnit.parametry_bonus_proc` istnieje (DLUG-UNIT-REPLACE-PROGRESS). r2 czyta to pole (to samo źródło co `hpMaxEffective`); `armorBadgeLevel` zostaje wartością domyślną (`pancerzBonusProc` nie ma w stanie) — pozycja `RENDER_FRAME_STATE_DEFAULTS` zawężona do `units[].armorBadgeLevel`.
- **D-OP-9 (leniwość źródeł buildHighlight)**: pin liczy źródła tylko w gałęzi aktywnego trybu; r2 liczy kontekst (`FoundCityCtx`, stan budowy) tylko dla aktywnego trybu, z jawnym `?` na błędach (epoka, id) zamiast cichego `false`.

## Tabela pól ramki — zmiany r2 (pole | źródło | web | uwagi)

| Pole | Źródło (Rust) | Web | Uwagi |
|---|---|---|---|
| `overlays.buildHighlight.hexes` (foundCity) | `FoundCityCtx::check` + `overlays_view::build_highlight` | `main.ts:16352-16361`, `:12923-12943`, `cities.ts:1163` | min. dystans 4 (`miasto-params.json`, `cities.ts:1117`), terytorium własne (miasta + forty), limit `cityLimitBase` z `params.advanced`, krąg startu przy pierwszym mieście |
| `overlays.buildHighlight.hexes` (wonder) | `qualifying_wonder_hexes` | `main.ts:5189-5214`, `wonder-placement.ts:53-119` | `wonderBuildSites` = `[]` (stan bez budów cudów — `RENDER_FRAME_STATE_DEFAULTS`) |
| `overlays.buildHighlight.hexes` (improvement/mine) | `improvement_build_state` + `improvement_qualifying_hexes`, filtr `filter_build_highlight_hexes` (bez zmian) | `main.ts:16293-16337`, `:16369-16395` | technologia bramkuje tylko `createBuildRequest`, nie podświetlenie (zgodnie z `improvement-build.ts`); bez złóż/rzek/wycinki/grantów (`RENDER_FRAME_STATE_DEFAULTS`) |
| `stacks.vitalsByRepId` | `stack_view` → `compute_stack_display(.., Some(deps))` | `main.ts:14476-14508`, `armyMerge.ts:1137-1155` | fortyfikacja/garnizon/mur = brak w stanie (`RENDER_FRAME_STATE_DEFAULTS`) |
| `units[].hp` | `synced_hp` | `main.ts:33109-33118` | przycięcie `[0, hpMax]`, nieskończone = `hpMax` |
| `units[].hpMax` | `hp_max_effective` | `main.ts:33099-33106`, `unit-card-stats.ts:79-95` | weteran + `parametryBonusProc` |
| `units[].softBadgeLevel` | `soft_path_badge_level(Some(progress))` | `unit-building-bonuses.ts:334` | D-OP-8 |
| `stacks.starvingRepIds` / `goldDeficitRepIds` | `[]` | `main.ts:14513-14546` | **luka** (#310) |
| `overlays.workerFields` | `[]` | `main.ts:15432-15448` | **luka** (#310) |

Pozostałe pola ramki — bez zmian względem tabeli `01-operator-r1.md` / `02a-obrona.md`.

## Testy (nowe w r2; `tests/p4_364_render_frame.rs`)

- `r2_build_highlight_found_city_wg_can_found_city` — wektor wg `canFoundCity` (ląd, `hexDistance >= 4`, w terytorium stolicy), kolejność r-major, woda i heks za blisko odrzucone; Q6-2 (D-R3-3) zachowany (selekcja i zasięg puste).
- `r2_build_highlight_found_city_pierwsze_miasto` — oczekiwanie na pierwsze miasto: bez `withinTerritory`, krąg startu (`first-player-city.ts:23-33`).
- `r2_build_highlight_cud_wg_wonder_placement` — dokładny wektor `0 < dist <= promień`, ląd, bez heksów miast i postawionych cudów, sortowanie `dist, q, r`; fotel bez miast → `[]`.
- `r2_build_highlight_ulepszenie_wg_build_api` — `farma` na równinie terytorium, bez wody, w pierścieniu kandydatów; `tarasy` dla rzymian `[]`, dla chińczyków niepuste i tylko na wzgórzach.
- `r2_hp_max_effective_z_bonusami` — 1 bitwa: `hpMax` 24.2 (`round(22·1.1, 1)`); + `parametryBonusProc` 20: 28.6, `hp` 99 → 28.6; `hp` −∞ → 22; `softBadgeLevel` z `parametryBonusProc`.
- `r2_vitals_stosu_gracza` — 2× Wojownik: hp 44/44, `fieldPowerM` 54 (cache `fieldPower` 27), count 2, poziom 1; weteran w stosie: cache usunięty, `fieldPowerM` = `round((27 + fieldPower(def·1.1))·10)/10`, hp 22 + 10 / max 22 + 24.2, poziom 2, 1 gwiazdka.
- `r2_vitals_bonus_trudnosci_ai` — AI `Normalny`: 27 (mult 1, cache), `Trudny`: `fieldPower(def z atak/obrona/pocisk · (1 + bonusWalka_3))`; stos gracza głównego bez bonusu (54).
- Zmienione asercje r1: `h_pola_ramki_scenariusza_startowego` (`hpMax` `Some(22)`), `h_hp_jednostki_z_ekonomii` (`hpMax` 22), `h_jawne_luki_ramki` (luki: tylko 2 pozycje z `#310`; wartości domyślne: + `stacks.vitalsByRepId fortyfikacja / garnizon / miasta-panstwa`, + `overlays.buildHighlight zrodla spoza stanu`, `units[].armorBadgeLevel` zamiast pary).

## Mutacje

`mutate-r2.py` → `mutate-r2.log`: **13/13 FAIL** (L1a założenie miasta zawsze false, L1b cud pusty, L1c ulepszenie puste, L1d bez owinięcia civ, L1e założenie bez terytorium, L2a vitals puste, L2b bez bonusu trudności, L2c bez weterana w def, L3a hpMax bez bonusów, L3b hpMax bez parametrów, L3c hp bez przycięcia, E6r2, Z3r2 — mutanty r1 przeniesione na kod r2, bo ich wzorce z `mutate-obrona-r1.py` już nie występują).
Mutacje r1 (`mutate-obrona-r1.py`, wszystkie pasujące wzorce: a1, a2, b, c, E3-odwr., d, e, E2, E4, E5, E5b) na kodzie r2 → `mutate-r1-na-r2.log`: **11/11 FAIL**.
Luki 4 i 5 nie są produkowane, więc nie mają mutantów (dyspozycja: „4/5 jeśli wyprodukowane”).

## Pliki spoza allowlisty

Brak. `overlays_view.rs`, `recruitment.rs`, `city_view.rs`, `map_view.rs`, `playable.rs`, `bridge.rs`, view-model, renderer: bez zmian (adaptery w całości w `render_frame.rs`; żadne nowe `pub` w producentach nie było potrzebne). `Cargo.lock` niecommitowany.

## Pełna bramka

`cargo test --all-targets --no-fail-fast` (engine), w tle (`setsid nohup`), EXIT w logu `gate-full-test-r2.log`; dysk przed startem 10220 MiB (≥ 8 GB). Wynik: **EXIT=0**, 527 bloków `test result: ok`, 3955 passed / 0 failed / 1 ignored (ignored sprzed tematu). Po starcie bramki zmieniono wyłącznie komentarz modułu (`//!` D-OP-5..7); fmt i clippy powtórzone po tej zmianie: EXIT 0. `CARGO_TARGET_DIR` (scratchpad) usunięty po bramkach.

## Uwagi dla Evaluatora

- Wektory foundCity/cud/vitals są liczone z reguł pinu (linie podane przy testach); `field_power` (`unit_power.rs`, port `unit-power.ts:122` z własnymi wektorami) użyty w teście jako zależność do wyliczenia oczekiwanej wartości dla def przeskalowanej.
- `getQualifyingHexes` nie jest bramkowany technologią w pinie (tylko `createBuildRequest`) — test to odzwierciedla.
- Hotseat: budowa ulepszeń dla fotela 2 pokazuje heksy fotela głównego — to litera pinu (literał `0`), nie błąd portu (D-OP-5).
