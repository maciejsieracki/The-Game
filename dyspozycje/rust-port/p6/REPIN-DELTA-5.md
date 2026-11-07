# REPIN-DELTA-5 — pomiar dryfu logiki weba względem pinów portu Rust

**Temat:** `R-RUSTPORT-REPIN-DELTA-5-Q1` · **Runda:** 1/5 · **Rola:** Operator · **Domena:** PROCESS (dokumentacja, zero zmian w kodzie)

## 1. Baza pomiaru i metoda

| Element | Wartość |
|---|---|
| Pin „logiki" (początek dryfu) | `4bbef081d` (potwierdzony przodek `origin/main`); `dc8a3adc` jest przodkiem `4bbef081d`; `23dd158e9` NIE jest jego przodkiem (inna gałąź — patrz §9) |
| Koniec pomiaru | `origin/main` = `59868d84f` (FALA 544, AIN10/AIRESERVE). Dispatch wymagał `>= bd5386c8b` (FALA 543): `59868d84f` jest potomkiem — spełnione |
| Różnica `bd5386c8b` → `59868d84f` w zakresie 91 plików | 3 pliki: `gra/data/ai-params.json`, `gra/data/econ-params.json`, `gra/src/game/ai.ts` (FALA 544 — rezerwa utrzymania przy zakupie jednostek, usunięcie `ai_rush_*`) |
| `rust-port/parity-v2` | `783c6b766` (stan zweryfikowany `git fetch`; lista modułów domeny: `rust-port/engine/src/domain/*.rs`, 92 pliki) |
| Komenda zakresu | `git diff --name-only 4bbef081d origin/main -- gra/src/game gra/data` → **91 plików** (77 `gra/src/game`, 14 `gra/data`) |
| Jednostka „hunk" | blok `@@` z `git diff -U0 4bbef081d origin/main -- gra/src/game gra/data` (bez linii kontekstu) |

### Zgodność z `git diff --numstat` (kryterium końca)

- Pliki: **91** (zgodnie z listą). Hunki (`-U0`): **626**. Linie: **+8425 / −893** — identyczne z `git diff --shortstat` (`91 files changed, 8425 insertions(+), 893 deletions(-)`).
- Weryfikacja per plik: suma linii `+`/`−` w hunkach każdego z 91 plików równa się `git diff --numstat` (asercja w skrypcie pomiarowym; tabela §3 ma kolumnę „numstat" z tymi wartościami).
- **Uwaga o skali:** dispatch podaje „+16 tys. linii" — to wartość dla **167 plików** `gra/src`+`gra/data` (`+16 592 / −2 312` na `59868d84f`; plan §0a: `+16 468 / −2 296` na `bd5386c8b`). Dla 91 plików zakresu tematu jest to **+8 425 / −893**. Pozostałe **76 plików** (w tym `main.ts` +2 815/−448, `battle/*`, `map/*`, `units/setup.ts`, `ui/*`, `render/*`, `audio/*`) są POZA zakresem tego tematu → **NIE_ZMIERZONO** (§8).

### Klasy i założenia klasyfikacji

- **LOGIKA** — zmienia wynik reguł gameplay (do przeniesienia do Rust). **DANE** — zmiana wartości/kształtu `gra/data/*.json` (wpływa na loader P3 i kopie w `rust-port/engine/data`). **UI** — warstwa prezentacji / komenda kontrolera (nie silnik; trafia do P7/REPIN-UI-4). **PERF-bez-wpływu** — cache/memo/refaktor/komentarz/import/log diagnostyczny bez zmiany wyniku.
- ZAŁOŻENIE-1: hunk zawierający wyłącznie komentarze lub importy jest klasyfikowany automatycznie jako PERF-bez-wpływu (czwarta klasa z dispatchu nie ma osobnej etykiety „komentarz").
- ZAŁOŻENIE-2: klasyfikację wykonano z czytania treści hunków i komentarzy z ID tematów webowych (`R-WEB-…`) w kodzie; nie uruchamiano webu ani testów (zakaz budowania). Twierdzenia o zachowaniu = wyłącznie z diffu (plik:linia), nie z wykonania.
- ZAŁOŻENIE-3: „linia webu" = numer linii w **nowej** wersji pliku na `origin/main` (`git show origin/main:<plik>`); dla hunków czysto usuwających — linia poprzedzająca.
- ZAŁOŻENIE-4: przypisanie do tematów #2–#8 wg alokacji plików z `PLAN-PORT-RUST-TAURI-20261020.md` §0c (kolumna „Allowlista"); gdy ani temat #2–#8 nie obejmuje reguły, wskazano „NOWY-n" (propozycje w §7).

## 2. Podsumowanie

| Klasa | Hunki | Udział |
|---|---:|---:|
| LOGIKA | 414 | 66.1% |
| UI | 12 | 1.9% |
| DANE | 30 | 4.8% |
| PERF-bez-wpływu | 170 | 27.2% |
| **Razem** | **626** | 100% |

Hunki behawioralne (LOGIKA+DANE+UI) wg tematu docelowego (hunk z dwoma tematami liczony w obu):

| Temat | LOGIKA | DANE | UI | PERF | Hunki razem |
|---|---:|---:|---:|---:|---:|
| #2 EKONOMIA-F | 55 | 18 | 1 | 14 | 88 |
| #3 AUTOIMPROVE | 97 | 0 | 0 | 0 | 97 |
| #4 DYPLOMACJA-MULTIWAR | 26 | 4 | 1 | 2 | 33 |
| #5 WOJNY-WYMUSZONE | 0 | 0 | 0 | 0 | 0 |
| #6 AI-ARMIA | 56 | 0 | 0 | 0 | 56 |
| #7 OBLEZENIE-ZDOBYCZE | 52 | 4 | 1 | 0 | 57 |
| #8 ZAPIS-MIGRACJE | 0 | 0 | 0 | 0 | 0 |
| NOWY-1 MARSZ-PRZEJSCIE | 32 | 0 | 0 | 0 | 32 |
| NOWY-2 ULEPSZENIA-EPOKA | 49 | 0 | 0 | 0 | 49 |
| NOWY-3 HANDEL-EMPORION | 26 | 1 | 0 | 0 | 27 |
| NOWY-4 AI-EKSPANSJA-ZAKUP | 14 | 3 | 0 | 0 | 17 |
| NOWY-5 ZDARZENIA-TURA | 2 | 0 | 0 | 4 | 6 |
| NOWY-6 NAZWY-STOLICE | 5 | 1 | 0 | 1 | 7 |
| NOWY-7 UI-KONTROLER-V2 | 0 | 0 | 9 | 0 | 9 |
| — | 0 | 0 | 0 | 150 | 150 |

Uwaga r2: kolumny LOGIKA/DANE/UI tabeli tematów przeliczono skryptem z wierszy §4 (zgodne z r1 poza zmianami z §4c). Kolumna PERF tej tabeli NIE jest odtwarzalna z §4/§4b (wiersze §4b nie mają kolumny tematu) — pozostaje z r1 i nie jest używana w kryteriach.

Wnioski w jednej linii: **(a)** 626 hunków → REPIN logiki/danych wymaga 444 (70.9%), UI 12, bez wpływu 170; **(b)** największy blok pracy to AI/armia/wojna (#6) i oblężenie (#7), oba w większości bez modułów Rust; **(c)** #5 (`forced-war-*`) nie ma w tym diffie żadnego hunku — pliki `forced-war-*.ts` NIE zmieniły się od `4bbef081d`, a ich brak w Rust jest luką istniejącą (plan §0a.2), nie dryfem; **(d)** do kolejki brakuje 7 tematów (§7), z czego NOWY-2 (skalowanie plonów ulepszeń epoką) wpływa na każdy wektor ekonomii.

## 3. Tabela plików (wiersz dla każdego z 91)

Kolumny: hunki (`-U0`) · `+/−` (= `numstat`) · rozkład klas L/D/U/P · temat docelowy · moduł Rust docelowy (`parity-v2`; „NOWY" = brak odpowiednika w `rust-port/engine/src/domain/`).

| # | Plik (web) | Hunki | +/− (numstat ✓) | L/D/U/P | Temat | Moduł Rust docelowy |
|---:|---|---:|---|---|---|---|
| 1 | `data/ai-params.json` | 2 | +45/−0 ✓ | 0/2/0/0 | N4, T4 | engine/data/ai-params (loader P3) |
| 2 | `data/buildings.json` | 10 | +69/−10 ✓ | 0/9/0/1 | T2, N3 | engine/data/buildings (loader P3) |
| 3 | `data/citizen-resource-upkeep.json` | 2 | +4/−4 ✓ | 0/1/0/1 | T2 | engine/data/citizen-resource-upkeep |
| 4 | `data/civ-music.json` | 1 | +10/−0 ✓ | 0/0/1/0 | N7 | — (asset/UI, poza silnikiem) |
| 5 | `data/combat-params.json` | 2 | +11/−1 ✓ | 0/2/0/0 | T7 | engine/data/combat-params (+ nowy modul milicji) |
| 6 | `data/diplomacy.json` | 2 | +2/−1 ✓ | 0/1/0/1 | T4 | engine/data/diplomacy + diplomacy.rs (progi NAP) |
| 7 | `data/econ-params.json` | 17 | +36/−43 ✓ | 0/8/0/9 | T2, N4 | engine/data/econ-params + city_growth.rs/economy_city_params.rs |
| 8 | `data/map-gen-params.json` | 1 | +4/−0 ✓ | 0/1/0/0 | N6 | engine/data/map-gen-params + map_generator.rs (min. dystans stolic) |
| 9 | `data/miasto-params.json` | 2 | +15/−0 ✓ | 0/2/0/0 | T7 | engine/data/miasto-params (+ siege/city_towers, cities) |
| 10 | `data/resources.json` | 1 | +1/−1 ✓ | 0/0/0/1 | T2 | engine/data/resources |
| 11 | `data/tech.json` | 2 | +2/−2 ✓ | 0/2/0/0 | T2 | engine/data/tech |
| 12 | `data/ui-params.json` | 1 | +13/−0 ✓ | 0/0/1/0 | N7 | engine/data/ui-params; ustawienie auto_build_enabled -> meta.autoBuildEnabled (T8) |
| 13 | `data/war-rules-params.json` | 2 | +2/−2 ✓ | 0/1/0/1 | T4 | engine/data/war-rules-params + war_rules_multiwar.rs |
| 14 | `data/war-weariness-params.json` | 1 | +45/−0 ✓ | 0/1/0/0 | T4 | NOWY plik danych + NOWY modul war_weariness.rs |
| 15 | `ai-city-capture-executor.ts` | 5 | +10/−4 ✓ | 4/0/0/1 | N1 | ai_turn.rs (executor zajmowania miast) |
| 16 | `ai-difficulty-bonus.ts` | 3 | +11/−2 ✓ | 3/0/0/0 | N4 | start_position.rs / ai_turn.rs (wybor miasta AI) |
| 17 | `ai-general-war-campaign.ts` | 4 | +39/−0 ✓ | 4/0/0/0 | T6 | ai_general_war_campaign.rs |
| 18 | `ai-march-guard.ts` | 1 | +198/−0 ✓ | 1/0/0/0 | T6 | NOWY ai_march_guard.rs |
| 19 | `ai-war-home-defense.ts` | 1 | +405/−0 ✓ | 1/0/0/0 | T6 | NOWY ai_war_home_defense.rs |
| 20 | `ai-war-target-select.ts` | 1 | +68/−0 ✓ | 1/0/0/0 | T6 | NOWY ai_war_target_select.rs (+ war_all_in_capital_plan.rs) |
| 21 | `ai.ts` | 84 | +966/−90 ✓ | 69/0/0/15 | T3, T6, N3, N1, N4, T2, T7, T4 | ai_turn.rs (+ NOWE ai_army*.rs, war_all_in_capital*.rs) |
| 22 | `army-concentration.ts` | 2 | +428/−0 ✓ | 1/0/0/1 | T6 | army_consolidation.rs (+ NOWY ai_army_concentration.rs) |
| 23 | `army-stack-limit.ts` | 1 | +228/−0 ✓ | 1/0/0/0 | T7 | NOWY army_stack_limit.rs (+ formation_rules.rs, army_consolidation.rs) |
| 24 | `armyMerge.ts` | 5 | +128/−8 ✓ | 3/0/0/2 | T6 | army_consolidation.rs / formation_rules.rs |
| 25 | `auto-build-gate.ts` | 1 | +48/−0 ✓ | 1/0/0/0 | T3 | auto_improvements.rs / ai_turn.rs (bramka gracza) |
| 26 | `auto-improvements.ts` | 109 | +603/−186 ✓ | 76/0/0/33 | T3 | auto_improvements.rs / auto_improvements/*.rs |
| 27 | `barbarians.ts` | 9 | +31/−10 ✓ | 7/0/0/2 | T7, N1 | barbarians.rs |
| 28 | `building-resource-gate.ts` | 2 | +4/−1 ✓ | 2/0/0/0 | T2, N3 | production_queue.rs / building_costs.rs (bramki budowy) |
| 29 | `capital-capture.ts` | 11 | +168/−30 ✓ | 10/0/0/1 | T7 | NOWY capital_capture.rs (zdobycze) ; wonder_placement.rs |
| 30 | `cities.ts` | 17 | +71/−50 ✓ | 17/0/0/0 | T3, T7 | state.rs/types.rs (pola miasta) + save_load.rs (T8) |
| 31 | `citizen-consumption-era.ts` | 1 | +40/−0 ✓ | 1/0/0/0 | T2 | turn_economy_upkeep.rs / city_growth.rs (nowa stala m(e)) |
| 32 | `citizen-resource-upkeep.ts` | 8 | +15/−21 ✓ | 2/0/0/6 | T2 | turn_economy_upkeep.rs |
| 33 | `city-defense.ts` | 1 | +58/−0 ✓ | 1/0/0/0 | T7 | combat.rs / NOWY city_defense.rs |
| 34 | `city-fortification.ts` | 1 | +98/−0 ✓ | 1/0/0/0 | T7 | NOWY city_fortification.rs |
| 35 | `city-hex-movement.ts` | 2 | +7/−3 ✓ | 1/0/0/1 | N1 | city_hex_movement (move/pathfinding.rs) |
| 36 | `city-names-pool.ts` | 3 | +33/−2 ✓ | 3/0/0/0 | N6 | city_names.rs |
| 37 | `city-siege-state.ts` | 1 | +80/−0 ✓ | 1/0/0/0 | T7 | NOWY city_siege_state.rs |
| 38 | `city-towers.ts` | 1 | +163/−0 ✓ | 1/0/0/0 | T7 | NOWY city_towers.rs |
| 39 | `civ-names.ts` | 1 | +1/−0 ✓ | 0/0/0/1 | N6 | civ_names.rs |
| 40 | `civ-test-hooks.ts` | 1 | +175/−0 ✓ | 0/0/0/1 | — | — (hooki testowe window.__civTest; brak w Rust) |
| 41 | `cluster-start.ts` | 2 | +3/−3 ✓ | 2/0/0/0 | N6 | start_position.rs |
| 42 | `converters.ts` | 21 | +99/−23 ✓ | 14/0/0/7 | T2 | resource_production.rs / economy_city_params.rs (konwertery) |
| 43 | `diplomacy-ai-forced-peace.ts` | 1 | +331/−0 ✓ | 1/0/0/0 | T4 | NOWY diplomacy_ai_forced_peace.rs (+ diplomacy_war_peace_profile.rs) |
| 44 | `diplomacy-factors.ts` | 1 | +1/−0 ✓ | 0/0/1/0 | T4 | diplomacy.rs (etykieta) |
| 45 | `diplomacy-locks.ts` | 11 | +50/−9 ✓ | 10/0/0/1 | T4 | diplomacy.rs (blokady: dualGate) |
| 46 | `diplomacy-penalty-preview.ts` | 5 | +80/−2 ✓ | 5/0/0/0 | N3 | diplomacy.rs (kara za zerwanie) |
| 47 | `diplomacy-proposals.ts` | 8 | +51/−5 ✓ | 6/0/0/2 | T4, T6 | diplomacy.rs (evaluateProposal) ; ai_turn.rs |
| 48 | `diplomacy-siege-war-gate.ts` | 1 | +111/−0 ✓ | 1/0/0/0 | T4 | NOWY diplomacy_siege_war_gate.rs (+ diplomacy_war_gates.rs) |
| 49 | `diplomacy.ts` | 4 | +16/−1 ✓ | 3/0/0/1 | T4, N3 | diplomacy.rs |
| 50 | `economy-upkeep.ts` | 12 | +40/−37 ✓ | 7/0/0/5 | T2 | economy_city_params.rs / turn_economy_upkeep.rs (owner storage) |
| 51 | `economy.ts` | 17 | +49/−25 ✓ | 10/0/0/7 | T2, N2 | city_growth.rs / economy_city_params.rs / economy_yield.rs |
| 52 | `empire-food.ts` | 4 | +12/−3 ✓ | 1/0/0/3 | T2 | turn_economy_empirefood.rs |
| 53 | `empire-recruit-plan.ts` | 1 | +196/−0 ✓ | 0/0/1/0 | N7 | NOWY empire_recruit_plan.rs (komenda P7; kontroler v2) |
| 54 | `eot-event-defer.ts` | 4 | +9/−5 ✓ | 0/0/0/4 | N5 | events.rs |
| 55 | `event-defer-queue.ts` | 1 | +102/−0 ✓ | 1/0/0/0 | N5 | events.rs (NOWE: kolejka odroczenia) |
| 56 | `event-lifetime.ts` | 1 | +53/−0 ✓ | 1/0/0/0 | N5 | events.rs (NOWE: zycie zdarzenia = 1 tura) |
| 57 | `fort-territory.ts` | 3 | +55/−4 ✓ | 2/0/0/1 | T7 | fort_territory.rs |
| 58 | `frame-memo.ts` | 1 | +85/−0 ✓ | 0/0/0/1 | — | — (pamiec podreczna HUD; brak potrzeby w Rust) |
| 59 | `generals.ts` | 1 | +50/−0 ✓ | 1/0/0/0 | T6 | generals.rs / general_quick_follow.rs |
| 60 | `livestock-unlock.ts` | 4 | +5/−7 ✓ | 3/0/0/1 | N2 | improvement_build.rs / improvements.rs |
| 61 | `manpower.ts` | 2 | +10/−0 ✓ | 0/0/1/1 | N7 | — (UI: formatowanie liczby) |
| 62 | `next-active-unit.ts` | 1 | +72/−0 ✓ | 0/0/1/0 | N7 | NOWY next_active_unit.rs (komenda kontrolera v2) |
| 63 | `okolica.ts` | 38 | +188/−31 ✓ | 16/0/0/22 | N2 | okolica.rs / economy_yield.rs |
| 64 | `planned-march.ts` | 5 | +16/−5 ✓ | 4/0/0/1 | N1 | order_effects_lane.rs / planned_march (P6.9-10) |
| 65 | `population-growth-tempo.ts` | 1 | +1/−1 ✓ | 0/0/0/1 | T2 | city_growth.rs |
| 66 | `population-growth-v85.ts` | 12 | +20/−11 ✓ | 8/0/0/4 | T2 | city_growth.rs |
| 67 | `post-battle-map.ts` | 6 | +38/−3 ✓ | 4/0/1/1 | N7, T7 | combat.rs / battle_mode.rs (po bitwie) |
| 68 | `production.ts` | 5 | +27/−1 ✓ | 3/0/0/2 | T2 | production_queue.rs / building_costs.rs |
| 69 | `recruit-list-order.ts` | 1 | +69/−0 ✓ | 0/0/1/0 | N7 | recruitment.rs / kontroler v2 (kolejnosc listy) |
| 70 | `relief-preserving-improvements.ts` | 2 | +6/−3 ✓ | 1/0/0/1 | T3 | improvements.rs / auto_improvements.rs |
| 71 | `resource-access.ts` | 2 | +6/−3 ✓ | 2/0/0/0 | T2 | resource_access.rs |
| 72 | `road-network-plan.ts` | 1 | +284/−0 ✓ | 1/0/0/0 | T3 | NOWY road_network_plan.rs (+ roads.rs, auto_improvements.rs) |
| 73 | `scout-auto-explore.ts` | 8 | +16/−8 ✓ | 8/0/0/0 | N1 | order_effects_lane.rs (auto-eksploracja zwiadowcy) |
| 74 | `siege-enter-city.ts` | 1 | +106/−0 ✓ | 1/0/0/0 | T7 | NOWY siege_enter_city.rs |
| 75 | `siege-last-stand.ts` | 1 | +202/−0 ✓ | 1/0/0/0 | T7 | NOWY siege_last_stand.rs |
| 76 | `siege-starvation.ts` | 1 | +133/−0 ✓ | 1/0/0/0 | T7 | NOWY siege_starvation.rs |
| 77 | `siege-surrender-forecast.ts` | 1 | +164/−0 ✓ | 0/0/1/0 | T7 | NOWY siege_surrender_forecast.rs (DTO plakietki) |
| 78 | `siege.ts` | 6 | +27/−10 ✓ | 3/0/0/3 | T7 | NOWY siege.rs / militia |
| 79 | `siegeDefenders.ts` | 15 | +282/−33 ✓ | 11/0/0/4 | T7 | NOWY siege_defenders.rs (milicja per mieszkaniec) |
| 80 | `society-breakdown.ts` | 1 | +1/−1 ✓ | 0/0/0/1 | T2 | society_breakdown.rs |
| 81 | `stack-leader.ts` | 1 | +65/−0 ✓ | 1/0/0/0 | T6 | army_leadership.rs / generals.rs (zwiadowca nie lider) |
| 82 | `terrain-improvements.ts` | 15 | +81/−21 ✓ | 13/0/0/2 | N2 | improvement_build.rs / improvements.rs / economy_yield.rs |
| 83 | `trade-routes.ts` | 23 | +203/−103 ✓ | 17/0/0/6 | N3 | trade.rs / trade_flow_apply.rs |
| 84 | `turn-economy.ts` | 31 | +98/−60 ✓ | 20/0/1/10 | T2, N2 | turn_economy*.rs / city_growth.rs |
| 85 | `villageRewards.ts` | 2 | +8/−0 ✓ | 2/0/0/0 | T7 | recruitment.rs / villages (nagrody wiosek) |
| 86 | `visibility.ts` | 3 | +8/−0 ✓ | 3/0/0/0 | N1 | fog/visibility (mapa; NIE_ZMIERZONO modul) |
| 87 | `war-weariness.ts` | 1 | +302/−0 ✓ | 1/0/0/0 | T4 | NOWY war_weariness.rs (+ diplomacy_war_peace_profile.rs) |
| 88 | `warAllInCapital.ts` | 11 | +82/−4 ✓ | 11/0/0/0 | T6, N1 | war_all_in_capital*.rs |
| 89 | `wonder-transfer.ts` | 1 | +93/−0 ✓ | 1/0/0/0 | T7 | wonder_placement.rs (+ nowy wonder_transfer.rs) |
| 90 | `work-tax.ts` | 2 | +62/−0 ✓ | 0/0/2/0 | N7 | work_tax.rs (komenda P7) |
| 91 | `zelazo-access.ts` | 1 | +22/−0 ✓ | 1/0/0/0 | T2 | resource_access.rs |

Legenda tematów: **T2** = #2 EKONOMIA-F; **T3** = #3 AUTOIMPROVE; **T4** = #4 DYPLOMACJA-MULTIWAR; **T5** = #5 WOJNY-WYMUSZONE; **T6** = #6 AI-ARMIA; **T7** = #7 OBLEZENIE-ZDOBYCZE; **T8** = #8 ZAPIS-MIGRACJE; **N1** = NOWY-1 MARSZ-PRZEJSCIE; **N2** = NOWY-2 ULEPSZENIA-EPOKA; **N3** = NOWY-3 HANDEL-EMPORION; **N4** = NOWY-4 AI-EKSPANSJA-ZAKUP; **N5** = NOWY-5 ZDARZENIA-TURA; **N6** = NOWY-6 NAZWY-STOLICE; **N7** = NOWY-7 UI-KONTROLER-V2.

## 4. Tabela hunków behawioralnych (LOGIKA / DANE / UI) — zgrupowana

Każdy wiersz = ciąg kolejnych hunków tego samego pliku o tej samej klasie i znaczeniu. „Linie" = numery linii w `origin/main`. Hunki PERF-bez-wpływu są zliczone w §3 i wypisane w §4b.

| Plik:linie (web) | Hunki | +/− | Opis | Klasa | Moduł Rust | Temat |
|---|---:|---|---|---|---|---|
| `data/ai-params.json:412–421` | 1 | +10/−0 | nowe parametry AI: waga plonu heksu, kara polarna, rezerwa utrzymania zakupu (poziom1/2/3), tury do pokoju po prosbie | DANE | engine/data/ai-params (loader P3) | NOWY-4 AI-EKSPANSJA-ZAKUP |
| `data/ai-params.json:691–725` | 1 | +35/−0 | tury_do_pokoju_po_prosbie=2 (T4/N4) + kupno_jednostki_rezerwa_tur_poziom1..3 (3/10/2) + min_dochod_netto_poziom1..3 (0/0/-2) (FALA 544, N4) | DANE | engine/data/ai-params (loader P3) | NOWY-4 AI-EKSPANSJA-ZAKUP + #4 DYPLOMACJA-MULTIWAR |
| `data/buildings.json:491–547` | 7 | +8/−8 | Spichlerz II -> Spichlerz Krolewski (nazwa, techUnlock=Pismo, wymagania Ceramika+Sol), opisy — `"uwagi": "B-SPIC: bramka Ceramika (garncarnia imperium); tier I cap 100. LANCUCH W GORE (decyzja Maciej 202… [+6 w wierszu]` | DANE | engine/data/buildings (loader P3) | #2 EKONOMIA-F |
| `data/buildings.json:1094–1152` | 1 | +59/−0 | NOWY budynek Emporion (id emporion, +8 Pieniadz, techUnlock Handel, koszt drewno 80/kamien 60, wymaga Targowiska) + slot trasy handlowej | DANE | engine/data/buildings | NOWY-3 HANDEL-EMPORION |
| `data/buildings.json:1189` | 1 | +1/−1 | Spichlerz II -> Spichlerz Krolewski (nazwa, techUnlock=Pismo, wymagania Ceramika+Sol), opisy — `"opis": "Magazyn gromadzi zapasy i usprawnia gospodarkę miasta, dając dodatkową produkcję i dochód. Każdy M…` | DANE | engine/data/buildings (loader P3) | #2 EKONOMIA-F |
| `data/citizen-resource-upkeep.json:10–12` | 1 | +3/−3 | usuniete pole stawkaNaObywatela per epoka (stawka = 1,0 x m(e)); zmiana ksztaltu danych | DANE | engine/data/citizen-resource-upkeep | #2 EKONOMIA-F |
| `data/civ-music.json:1–10` | 1 | +10/−0 | NOWY plik: muzyka cywilizacji w dyplomacji (greeting/negotiation per civId) | UI | — (asset/UI, poza silnikiem) | NOWY-7 UI-KONTROLER-V2 |
| `data/combat-params.json:51–62` | 2 | +11/−1 | Milicja: militia_pop_fraction 0,2->1,0 (1 jednostka/mieszkanca), militia_regen_turns=5, militia_morale_fraction, militia_roster per epoka | DANE | engine/data/combat-params (+ nowy modul milicji) | #7 OBLEZENIE-ZDOBYCZE |
| `data/diplomacy.json:47` | 1 | +1/−0 | progNapZaufanie=30 (NAP wymaga Zaufania >=30); opis NAP | DANE | engine/data/diplomacy + diplomacy.rs (progi NAP) | #4 DYPLOMACJA-MULTIWAR |
| `data/econ-params.json:38` | 1 | +1/−1 | NOWY klucz spichlerz_ii_prog_ludnosci (zmiana nazwy klucza akwedukt_max_ludnosci -> dodany stopien) | DANE | engine/data/econ-params | #2 EKONOMIA-F |
| `data/econ-params.json:43–50` | 1 | +8/−1 | akwedukt_max_ludnosci 12->20 (easy/normal/hard), spichlerz_ii_prog=12 | DANE | engine/data/econ-params | #2 EKONOMIA-F |
| `data/econ-params.json:363–365` | 1 | +3/−3 | przepustowosc odlewni brazu 25->50 | DANE | engine/data/econ-params | #2 EKONOMIA-F |
| `data/econ-params.json:370–372` | 1 | +3/−3 | przepustowosc odlewni zelaza 25->50 | DANE | engine/data/econ-params | #2 EKONOMIA-F |
| `data/econ-params.json:377–379` | 1 | +3/−3 | przepustowosc wielkiej odlewni (stal) 25->50 | DANE | engine/data/econ-params | #2 EKONOMIA-F |
| `data/econ-params.json:613–618` | 1 | +6/−6 | magazyn_bonus_surowce_na_budynek(500) -> magazyn_bonus_surowce_proc_na_budynek(0,2): zmiana nazwy i semantyki klucza | DANE | engine/data/econ-params | #2 EKONOMIA-F |
| `data/econ-params.json:628–630` | 1 | +3/−3 | bonus zywnosci per Magazyn 100->0 | DANE | engine/data/econ-params | #2 EKONOMIA-F |
| `data/econ-params.json:647` | 1 | +0/−14 | USUNIETE ai_rush_jednostka_rezerwa_zlota / ai_rush_jednostka_max_na_ture (zastapione kupno_jednostki_rezerwa_* w ai-params) | DANE | engine/data/econ-params | NOWY-4 AI-EKSPANSJA-ZAKUP |
| `data/map-gen-params.json:97–100` | 1 | +4/−0 | capital_sep_short_side_coef=0,21 (min. dystans stolic = max(tabela, round(0,21*krotszy bok))) | DANE | engine/data/map-gen-params + map_generator.rs (min. dystans stolic) | NOWY-6 NAZWY-STOLICE |
| `data/miasto-params.json:99–147` | 2 | +15/−0 | wieze_strzeleckie_odstep_kafli=4, wieze_strzeleckie_zasieg_min=2, capture_pop_loss=1 | DANE | engine/data/miasto-params (+ siege/city_towers, cities) | #7 OBLEZENIE-ZDOBYCZE |
| `data/tech.json:203–273` | 2 | +2/−2 | odblokowania: Pismo -> + Spichlerz Krolewski, Handel -> + Emporion (N3) | DANE | engine/data/tech | #2 EKONOMIA-F |
| `data/ui-params.json:302–314` | 1 | +13/−0 | nowe ustawienie auto_build_enabled (domyslnie 1 = Wylaczona) | UI | engine/data/ui-params; ustawienie auto_build_enabled -> meta.autoBuildEnabled (T8) | NOWY-7 UI-KONTROLER-V2 |
| `data/war-rules-params.json:8` | 1 | +1/−1 | enabledForcedWarEras ["stone"] -> ["stone","bronze","iron"] | DANE | engine/data/war-rules-params + war_rules_multiwar.rs | #4 DYPLOMACJA-MULTIWAR |
| `data/war-weariness-params.json:1–45` | 1 | +45/−0 | NOWY plik parametrow zmeczenia wojna (zmeczenie/przegrywajacy/czlowiek) | DANE | NOWY plik danych + NOWY modul war_weariness.rs | #4 DYPLOMACJA-MULTIWAR |
| `ai-city-capture-executor.ts:113–136` | 4 | +9/−3 | MOVE-PASS-THROUGH-OWN-UNITS: kopia zajetosci zachowuje passThrough, endBlockedKeys przy ucinaniu trasy (zaleznosc units/setup poza game/ - NIE_ZMIERZONO) | LOGIKA | ai_turn.rs (executor zajmowania miast) | NOWY-1 MARSZ-PRZEJSCIE |
| `ai-difficulty-bonus.ts:204–217` | 3 | +11/−2 | AI unika Polarnych przy zakladaniu miasta (polarFallback) - FOLLOWUPS-LAND-AI 3a | LOGIKA | start_position.rs / ai_turn.rs (wybor miasta AI) | NOWY-4 AI-EKSPANSJA-ZAKUP |
| `ai-general-war-campaign.ts:15–199` | 4 | +39/−0 | wodz rezerwowy (Braz #2): reserveGeneralId/reserveGatherTurns, recordAiReserveGatherTurn + (de)serializacja kampanii (zapis T8) | LOGIKA | ai_general_war_campaign.rs | #6 AI-ARMIA |
| `ai-march-guard.ts:1–198` | 1 | +198/−0 | straz marszu AI: teren trzeciej cywilizacji bez umowy przemarszu = przeszkoda, prosba o przemarsz, cooldown | LOGIKA | NOWY ai_march_guard.rs | #6 AI-ARMIA |
| `ai-war-home-defense.ts:1–405` | 1 | +405/−0 | AI wojna: obrona wlasnego terenu i odbijanie miast przed ofensywa (progi 0,8/0,6, histereza, klastry) | LOGIKA | NOWY ai_war_home_defense.rs | #6 AI-ARMIA |
| `ai-war-target-select.ts:1–68` | 1 | +68/−0 | wybor celu marszu AI: najblizsze miasto, remis, obroncy (NEAREST-CITY) | LOGIKA | NOWY ai_war_target_select.rs (+ war_all_in_capital_plan.rs) | #6 AI-ARMIA |
| `ai.ts:412–417` | 1 | +6/−0 | AI-CITIZEN-HEX-SIBLING-EXCLUSION: heksy przegrane na rzecz blizszego miasta | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `ai.ts:471–476` | 1 | +6/−0 | straz marszu (opcja) | LOGIKA | ai_march_guard.rs | #6 AI-ARMIA |
| `ai.ts:754` | 1 | +1/−0 | AI buduje Emporion (unlocks.includes emporion) | LOGIKA | ai_turn.rs | NOWY-3 HANDEL-EMPORION |
| `ai.ts:895–941` | 3 | +24/−7 | MOVE-PASS-THROUGH-OWN-UNITS: buildMoveOccupancy, marchPathFor | LOGIKA | ai_turn.rs / pathfinding.rs | NOWY-1 MARSZ-PRZEJSCIE |
| `ai.ts:944–1067` | 1 | +124/−4 | ARMY-TO-NEAREST-LEADER + straz marszu AI (124 linie) | LOGIKA | ai_army_nearest_leader.rs | #6 AI-ARMIA |
| `ai.ts:1369–1434` | 4 | +39/−6 | AI-CITY-YIELD-FIX: terrainYieldRowForId, hexCityScore waga plonu 0,3 | LOGIKA | start_position.rs / ai_turn.rs | NOWY-4 AI-EKSPANSJA-ZAKUP |
| `ai.ts:1771–1772` | 1 | +2/−0 | AI_POP_CAP_WITH_GRANARY_II=12, sufit Akweduktu 20 w decyzji zakupu Spichlerza — `Sufit populacji ze Spichlerzem II, BEZ Akweduktu -- economy.ts cityPopulationCap, econ-params.json spichler…` | LOGIKA | ai_turn.rs (decyzja Spichlerz/Akwedukt) | #2 EKONOMIA-F |
| `ai.ts:1787–1793` | 1 | +7/−4 | AI_POP_CAP_WITH_GRANARY_II=12, sufit Akweduktu 20 w decyzji zakupu Spichlerza — `const hasGranaryII = built.includes('spichlerz_ii');` | LOGIKA | ai_turn.rs (decyzja Spichlerz/Akwedukt) | #2 EKONOMIA-F |
| `ai.ts:2744–2760` | 1 | +17/−0 | aiWorkedHexKeysForCity: pola obywateli bez heksow przegranych na rzecz siostry — `R-WEB-AI-CITIZEN-HEX-SIBLING-EXCLUSION-Q1: klucze q,r heksow z obywatelami miasta AI — to samo` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `ai.ts:2831` | 1 | +1/−3 | aiWorkedHexKeysForCity: pola obywateli bez heksow przegranych na rzecz siostry — `const set = aiWorkedHexKeysForCity(city, map, territoryNodes, opts.improvementExcludeHexKeysByCity, opts.ci…` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `ai.ts:2886–2899` | 2 | +7/−5 | AI auto-ulepszenia: SIMPLE-FOOD-RULE / RIVER-FOREST-CLEAR-NO-CITIZEN (limit 1 AI, podloga pracy 60) | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `ai.ts:2972–3052` | 4 | +38/−8 | FORT-OUTPOST-PLACEMENT-RULES: ekspansja AI poza zasieg (EXPANSION_KEY) | LOGIKA | fort_territory.rs / ai_turn.rs | #7 OBLEZENIE-ZDOBYCZE |
| `ai.ts:3236–3248` | 1 | +13/−0 | homeDefenderPool (filtr cywilny obroncow domu) | LOGIKA | ai_war_home_defense.rs | #6 AI-ARMIA |
| `ai.ts:3385–3531` | 1 | +147/−0 | DEFEND-HOME-BEFORE-OFFENSE: planHomeWar + aiUnitCombatStrength (147 linii) | LOGIKA | ai_war_home_defense.rs | #6 AI-ARMIA |
| `ai.ts:3662–3752` | 3 | +8/−2 | WAR-ALLIN-KEEP-BARB-DEFENSE / NO-MARCH-WITHOUT-WAR / homeDefenderPool wywolanie | LOGIKA | ai_turn.rs | #6 AI-ARMIA |
| `ai.ts:3967–3997` | 3 | +26/−3 | ALL-CIVS-GATHER-UNDER-GENERAL: w pokoju zbiorka u najblizszego wodza (rallyCandidates) | LOGIKA | ai_turn.rs | #6 AI-ARMIA |
| `ai.ts:4151–5071` | 24 | +338/−20 | zbiorka zastepcza, SCATTERED-NOT-MERGED, straz marszu (requestWarMarchPassage), partitionWarArmies, sciezka kampanii wodza, rezerwowy wodz | LOGIKA | ai_turn.rs / war_all_in_capital*.rs / ai_army*.rs | #6 AI-ARMIA |
| `ai.ts:5484–5614` | 5 | +53/−4 | AI-AVOID-POLAR-CITIES + POLAR-FALLBACK: kara polarna i fallback | LOGIKA | start_position.rs / ai_turn.rs | NOWY-4 AI-EKSPANSJA-ZAKUP |
| `ai.ts:6229–6238` | 4 | +5/−2 | WEARY: opcje oddania miasta (minMiast, cenaPn) - eskalacja oferty | LOGIKA | ai_turn.rs / diplomacy_war_peace_profile.rs | #4 DYPLOMACJA-MULTIWAR |
| `ai.ts:6288–6289` | 1 | +2/−0 | prosba AI o umowe przemarszu (typ opcji) | LOGIKA | ai_turn.rs | #6 AI-ARMIA |
| `ai.ts:6695–6723` | 3 | +22/−2 | WEARY: prog rw rosnie o wearyCityBonus, wearyMinMiast | LOGIKA | ai_turn.rs / war_weariness.rs | #4 DYPLOMACJA-MULTIWAR |
| `ai.ts:6916–6917` | 1 | +2/−0 | NAP-TRUST-30: AI proponuje pakt przy Zaufaniu >= progNapZaufanie | LOGIKA | ai_turn.rs / diplomacy.rs | #4 DYPLOMACJA-MULTIWAR |
| `ai.ts:7182–7231` | 2 | +49/−1 | AI-PURCHASE-MAINTENANCE-RESERVE: rezerwa utrzymania, AiPurchaseReserveParams (FALA 544) | LOGIKA | ai_turn.rs (zakup jednostek) | NOWY-4 AI-EKSPANSJA-ZAKUP |
| `army-concentration.ts:334–760` | 1 | +427/−0 | ARMIA ZASTEPCZA: punkt zbiorki, planWarReplacementRally, SCATTERED-NOT-MERGED (skupisko na roznych heksach != armia) | LOGIKA | army_consolidation.rs (+ NOWY ai_army_concentration.rs) | #6 AI-ARMIA |
| `army-stack-limit.ts:1–228` | 1 | +228/−0 | limit armii 500 na heksie; policz/ogranicz stos (STACKLIM FALA 540) | LOGIKA | NOWY army_stack_limit.rs (+ formation_rules.rs, army_consolidation.rs) | #7 OBLEZENIE-ZDOBYCZE |
| `armyMerge.ts:221–369` | 2 | +122/−1 | idempotentne zamrozenie fortyfikacji (FROZEN-FORTIFIED), healUnitsInCities, pickStackLeader (scout nie lider) — `R-WEB-UNIT-FROZEN-FORTIFIED-UNSELECTABLE-Q1 (runda 2): idempotentne. Ponowne [+1 w wierszu]` | LOGIKA | army_consolidation.rs / formation_rules.rs | #6 AI-ARMIA |
| `armyMerge.ts:453` | 1 | +1/−6 | idempotentne zamrozenie fortyfikacji (FROZEN-FORTIFIED), healUnitsInCities, pickStackLeader (scout nie lider) — `return pickStackLeader(stack, attackOf);` | LOGIKA | army_consolidation.rs / formation_rules.rs | #6 AI-ARMIA |
| `auto-build-gate.ts:1–48` | 1 | +48/−0 | bramka automatyzacji budowy: domyslnie OFF, tylko wlasciciel-gracz (AUTOBUILD FALA 515) | LOGIKA | auto_improvements.rs / ai_turn.rs (bramka gracza) | #3 AUTOIMPROVE |
| `auto-improvements.ts:200–219` | 1 | +20/−0 | RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY=2 / POOL_FLOOR, pulap defenseCap | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:261–293` | 2 | +29/−1 | RIVER-BALANCED-DEFENSECAP-WARNING: UnspentBudgetWarning + klucze heksow | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:339–342` | 1 | +4/−2 | usuniecie maxItemsPerCity / getOnlyWorked / getSkipWyrab z opcji pickera (zasada stalych regul); komentarze — `Reguła jest ZAWSZE aktywna (R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1); dawny getOnlyWorked (przycis…` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:430–431` | 2 | +0/−16 | usuniecie maxItemsPerCity / getOnlyWorked / getSkipWyrab z opcji pickera (zasada stalych regul); komentarze — `usunięto: * Throttle LICZBY ulepszeń/miasto/turę, NIEZALEŻNY od %-budżetu Pracy (oba limity działają [+1 w wierszu]` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:437` | 1 | +1/−1 | usuniecie maxItemsPerCity / getOnlyWorked / getSkipWyrab z opcji pickera (zasada stalych regul); komentarze — `skipWyrab?: boolean;` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:474–498` | 2 | +15/−0 | ROADS-CITY-LINKS-ONLY: pamiec planu drog; riverClearNoCitizenPass (ostatni przebieg) | LOGIKA | road_network_plan.rs / auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:504` | 1 | +0/−10 | usuniecie maxItemsPerCity / getOnlyWorked / getSkipWyrab z opcji pickera (zasada stalych regul); komentarze — `usunięto: * K2/K3: filtr onlyWorked dla przebiegu „brakujący surowiec” (AI: surowce wszędzie — ECHO 2026-09…` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:540` | 1 | +0/−12 | usuniecie maxItemsPerCity / getOnlyWorked / getSkipWyrab z opcji pickera (zasada stalych regul); komentarze — `usunięto: * R-WEB-AUTOIMPROVE-PRIORITY-Q1 (R5, D4 właściciela 2026-10-31): limit jednego etapu na turę — in…` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:603–671` | 2 | +14/−1 | SIMPLE-FOOD-RULE: zywnosc tylko na polach obywateli; usuniete maxItemsPerCity | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:780–813` | 2 | +19/−4 | pickFortClaims: koszt vs pracaLeft, fortKeyRadius | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:842–896` | 1 | +55/−0 | allowedRoadHexes: heksy drog wg planu MST (55 linii) | LOGIKA | road_network_plan.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:902–972` | 3 | +22/−8 | usuniete maxItemsStage / getOnlyWorked z przebiegow | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:978–1012` | 4 | +2/−4 | KROK 0: wycinka lasu przy rzece pierwszym krokiem tury (RIVER-FOREST-FIRST-PRIORITY), riverClearSpent w budzetach | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1032–1100` | 5 | +1/−6 | usuniete maxItemsPerCity/getOnlyWorked z przebiegow | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1148–1204` | 2 | +54/−3 | KROK 7: wycinka lasu przy rzece bez obywatela (limit gracz 2 / AI 1, podloga Pracy 60); zdarzenie diagnostyczne | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1215–1235` | 4 | +1/−3 | opcje wycinki: riverClearNoCitizenPass; usuniete getOnlyWorked/maxItemsPerCity/getSkipWyrab | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1373–1421` | 4 | +35/−2 | IRRIGATION-RIVER-DEFINITION-UNIFY + AUTOCLEAR-PRIORITY-LIVE: isOnRiver, definicja rzeki wspolna | LOGIKA | auto_improvements.rs / improvement_build.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1425–1447` | 1 | +23/−0 | U-3 (R-WEB-AUTO-FORT-DIAG-Q1), helper `getOwnFortCircles`: okręgi własnych fortów/posterunków (węzły terytorium + warstwy bez węzła). Zależność reguły z `1724–1757` (kandydat w całości w kole własnego fortu odpada); hunk NIE jest logowaniem | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1457–1483` | 2 | +13/−19 | SIMPLE-FOOD-RULE/FOOD-ONLY-WORKED-HEXES: wycinka zawsze, zywnosc tylko obywatele, STADNINA-FORT-TERRITORY-SCAN, wyjatek rzeczny — `R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1 (właściciel 2026-11-04): automat ZAWSZE może wycinać las, ale [+1 w wierszu]` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1539–1593` | 3 | +53/−8 | SIMPLE-FOOD-RULE/FOOD-ONLY-WORKED-HEXES: wycinka zawsze, zywnosc tylko obywatele, STADNINA-FORT-TERRITORY-SCAN, wyjatek rzeczny — `R-WEB-AI-STADNINA-FORT-TERRITORY-SCAN-Q1: ta sama reguła terytorium co budowa gracza (improvement-build.ts): [+2 w wierszu]` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1605–1613` | 3 | +4/−8 | filtr kandydatow, sortowanie, usuniete placedThisCity/limit sztuk; pula defenseCap (RIVER-BALANCED) — `for (const k of fortHorseExtra) { [+2 w wierszu]` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1642–1651` | 2 | +9/−3 | filtr kandydatow, sortowanie, usuniete placedThisCity/limit sztuk; pula defenseCap (RIVER-BALANCED) — `.filter(h => !riverHexesOnly // onRiverHex(${h.q},${h.r})) [+1 w wierszu]` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1700` | 1 | +1/−1 | filtr kandydatow, sortowanie, usuniete placedThisCity/limit sztuk; pula defenseCap (RIVER-BALANCED) — `const zeroStart = picks.length;` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1704–1757` | 8 | +27/−10 | U-3: kolo kandydata w calosci wewnatrz wlasnego fortu pomijane; porzadek wyboru posterunku | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1813–1829` | 3 | +9/−3 | wycinka tylko pod ulepszenia zywnosciowe; HILLS-CLEAR-REVERT; onRiverHex | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1855–1936` | 3 | +3/−3 | onRiverHex / foodReservedHex (IRRIGATION) | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:1949–1974` | 2 | +16/−2 | droga automatu wg planu MST (ROADS); FRESHWATER-ACCESS-LAKE (rezerwa heksu slodkiej wody) | LOGIKA | road_network_plan.rs / freshwater.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:2036–2155` | 7 | +5/−6 | usuniete placedThisCity / maxItemsPerCity; licznik riverNoCitizenClears — `if (globalSpent >= effectiveCityCap // pracaLeft <= reserve) { [+6 w wierszu]` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:2172–2174` | 2 | +1/−1 | usuniete placedThisCity / maxItemsPerCity; licznik riverNoCitizenClears — `if (isRiverNoCitizenClearHex(q, r)) riverNoCitizenClears++; [+1 w wierszu]` | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `auto-improvements.ts:2210–2228` | 1 | +19/−0 | Q3 wskaznik niewydanego budzetu: kandydaci odrzuceni wylacznie przez filtr obywateli | LOGIKA | auto_improvements.rs | #3 AUTOIMPROVE |
| `barbarians.ts:399–416` | 3 | +15/−1 | barbarzyncy: mur/palisada blokuje zdobycie bez bitwy, opcje obroncow (milicja), przejscie przez wlasne jednostki (N1) | LOGIKA | barbarians.rs | #7 OBLEZENIE-ZDOBYCZE |
| `barbarians.ts:751–1860` | 4 | +14/−7 | MOVE-PASS-THROUGH-OWN-UNITS: buildMoveOccupancy/endBlockedKeys (units/setup - NIE_ZMIERZONO) | LOGIKA | barbarians.rs | NOWY-1 MARSZ-PRZEJSCIE |
| `building-resource-gate.ts:69–70` | 1 | +2/−1 | bramka Spichlerz Krolewski (Ceramika+Sol); Emporion wymaga Targowiska (N3) | LOGIKA | production_queue.rs / building_costs.rs (bramki budowy) | #2 EKONOMIA-F |
| `building-resource-gate.ts:120–121` | 1 | +2/−0 | Emporion wymaga Targowiska w tym samym miescie | LOGIKA | production_queue.rs | NOWY-3 HANDEL-EMPORION |
| `capital-capture.ts:145–350` | 7 | +149/−30 | ELIMINATION-FULL-SPOILS + ANNEX-CITYSTATE-SPOILS: transferWholeEstateToWinner, zywnosc Spichlerza, surowce magazynu, techy; barbarzyncy nie dziedzicza — `R-WEB-ELIMINATION-FULL-SPOILS-Q1: zapas zywnosci SPICHLERZA imperium [+6 w wierszu]` | LOGIKA | NOWY capital_capture.rs (zdobycze) ; wonder_placement.rs | #7 OBLEZENIE-ZDOBYCZE |
| `capital-capture.ts:362–431` | 3 | +18/−0 | ELIMINATION-FULL-SPOILS + ANNEX-CITYSTATE-SPOILS: transferWholeEstateToWinner, zywnosc Spichlerza, surowce magazynu, techy; barbarzyncy nie dziedzicza — `R-WEB-ELIMINATION-FULL-SPOILS-Q1: barbarzyncy nie dziedzicza zywnosci (ofiara traci). [+2 w wierszu]` | LOGIKA | NOWY capital_capture.rs (zdobycze) ; wonder_placement.rs | #7 OBLEZENIE-ZDOBYCZE |
| `cities.ts:206–766` | 13 | +7/−41 | SIMPLE-FOOD-RULE: usuniete ulepszeniaOnlyWorked/WolnoWycinacLas (migracja zapisu T8); STARVATION: pola glodu; MILITIA-REGEN: pole cooldownu; CAPTURE-POP-LOSS -1 obywatel (T7) | LOGIKA | state.rs/types.rs (pola miasta) + save_load.rs (T8) | #3 AUTOIMPROVE |
| `cities.ts:867–978` | 3 | +21/−9 | nowe pola miasta: siege-starvation maxHP, militiaRegen tura, owner przed zdobyciem (zapis T8) | LOGIKA | state.rs + save_load.rs (T8) | #7 OBLEZENIE-ZDOBYCZE |
| `cities.ts:1141–1183` | 1 | +43/−0 | applyCapturePopulationLoss: zdobycie obcego miasta = -1 obywatel (min 1), CAPTURE_POP_LOSS | LOGIKA | NOWY capital_capture.rs / cities | #7 OBLEZENIE-ZDOBYCZE |
| `citizen-consumption-era.ts:1–40` | 1 | +40/−0 | m(e)=1+0,5*(e-1) mnoznik zuzycia obywateli per epoka (CITIZEN-CONSUMPTION-ERA-MULT FALA 500) | LOGIKA | turn_economy_upkeep.rs / city_growth.rs (nowa stala m(e)) | #2 EKONOMIA-F |
| `citizen-resource-upkeep.ts:107` | 1 | +0/−6 | stawka per epoka = CITIZEN_UPKEEP_RATE * m(e) (nie z JSON): Brąz 1,5 / Zelazo 2,0 (bylo 2,0/3,0) — `usunięto: * Stawka zużycia tej epoki: sztuk KAŻDEGO wymaganego surowca na 1 obywatela na turę` | LOGIKA | turn_economy_upkeep.rs | #2 EKONOMIA-F |
| `citizen-resource-upkeep.ts:190` | 1 | +1/−2 | stawka per epoka = CITIZEN_UPKEEP_RATE * m(e) (nie z JSON): Brąz 1,5 / Zelazo 2,0 (bylo 2,0/3,0) — `return CITIZEN_UPKEEP_RATE_PER_CITIZEN * citizenConsumptionEraMultiplier(era);` | LOGIKA | turn_economy_upkeep.rs | #2 EKONOMIA-F |
| `city-defense.ts:77–134` | 1 | +58/−0 | obrona miasta: obrona wewnatrz fortyfikacji, bonus murow (WALL-DEFENDERS-BONUS-RANGE) | LOGIKA | combat.rs / NOWY city_defense.rs | #7 OBLEZENIE-ZDOBYCZE |
| `city-fortification.ts:1–98` | 1 | +98/−0 | rodzaj fortyfikacji miasta (mur/palisada), wieza oblezn. = wylom (SIEGE-TOWER-BREACH, PALISADE-BATTLE-WALL-RULES) | LOGIKA | NOWY city_fortification.rs | #7 OBLEZENIE-ZDOBYCZE |
| `city-hex-movement.ts:82–87` | 1 | +6/−2 | zachowanie passThrough przy ruchu miedzy heksami miasta (MOVE-PASS-THROUGH-OWN-UNITS) | LOGIKA | city_hex_movement (move/pathfinding.rs) | NOWY-1 MARSZ-PRZEJSCIE |
| `city-names-pool.ts:150–270` | 3 | +33/−2 | CITY-NAME-UNIQUE-FOREVER: globalny zbior zuzytych nazw (collectAllUsedCityNames), w tym miasta utracone/cudze | LOGIKA | city_names.rs | NOWY-6 NAZWY-STOLICE |
| `city-siege-state.ts:1–80` | 1 | +80/−0 | wspolny predykat "miasto pod oblezeniem" (blokada rekrutacji/posilkow/wejscia) | LOGIKA | NOWY city_siege_state.rs | #7 OBLEZENIE-ZDOBYCZE |
| `city-towers.ts:1–163` | 1 | +163/−0 | wiezyczki strzeleckie wzdluz muru/palisady (rozstaw 4, zasieg min 2) | LOGIKA | NOWY city_towers.rs | #7 OBLEZENIE-ZDOBYCZE |
| `cluster-start.ts:195–223` | 2 | +3/−3 | jeden globalny zbior nazw w cluster-start (CITY-NAME-UNIQUE-FOREVER) | LOGIKA | start_position.rs | NOWY-6 NAZWY-STOLICE |
| `converters.ts:84–102` | 3 | +8/−8 | cegielnia output x2, Cegielnia +50% bazy/epoke (wyjscie x m(e)), odlewnie 25->50 cykli x m(e), outputMultiplier w runConverter — `{ id: 'cegielnia', inputs: { glina: 2, drewno: 1 }, output: 'cegla', outputAmount: 2, throughputParamKey: '… [+2 w wierszu]` | LOGIKA | resource_production.rs / economy_city_params.rs (konwertery) | #2 EKONOMIA-F |
| `converters.ts:133` | 1 | +1/−1 | cegielnia output x2, Cegielnia +50% bazy/epoke (wyjscie x m(e)), odlewnie 25->50 cykli x m(e), outputMultiplier w runConverter — `export const CONVERTER_ERA_SCALING_RECIPE_IDS: ReadonlySet<string> = new Set(['garncarnia']);` | LOGIKA | resource_production.rs / economy_city_params.rs (konwertery) | #2 EKONOMIA-F |
| `converters.ts:138–185` | 1 | +48/−0 | cegielnia output x2, Cegielnia +50% bazy/epoke (wyjscie x m(e)), odlewnie 25->50 cykli x m(e), outputMultiplier w runConverter — `R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1 (decyzja właściciela 2026-11-05): „zwiększ naturalną` | LOGIKA | resource_production.rs / economy_city_params.rs (konwertery) | #2 EKONOMIA-F |
| `converters.ts:199–430` | 9 | +29/−5 | cegielnia output x2, Cegielnia +50% bazy/epoke (wyjscie x m(e)), odlewnie 25->50 cykli x m(e), outputMultiplier w runConverter — `if (CONVERTER_FOUNDRY_ERA_RECIPE_IDS.has(recipeId)) { [+8 w wierszu]` | LOGIKA | resource_production.rs / economy_city_params.rs (konwertery) | #2 EKONOMIA-F |
| `diplomacy-ai-forced-peace.ts:1–331` | 1 | +331/−0 | AI<->AI wymuszony pokoj po N turach od prosby + cena pokoju (NEAREST-CITY-PEACE-2T B) | LOGIKA | NOWY diplomacy_ai_forced_peace.rs (+ diplomacy_war_peace_profile.rs) | #4 DYPLOMACJA-MULTIWAR |
| `diplomacy-factors.ts:79` | 1 | +1/−0 | etykieta czynnika zerwanie_handlu_bez_kary (tekst) | UI | diplomacy.rs (etykieta) | #4 DYPLOMACJA-MULTIWAR |
| `diplomacy-locks.ts:42–179` | 5 | +29/−4 | NAP wymaga Relacji ORAZ Zaufania (dualGate), narzut granicy; formatLockedNote z powodem (tekst blokady) — `R-WEB-DIPLO-NAP-UI-BORDER-THRESHOLD-Q1: JEDEN próg Paktu dla UI i silnika (helper + narzut). [+4 w wierszu]` | LOGIKA | diplomacy.rs (blokady: dualGate) | #4 DYPLOMACJA-MULTIWAR |
| `diplomacy-locks.ts:188–240` | 5 | +18/−4 | NAP wymaga Relacji ORAZ Zaufania (dualGate), narzut granicy; formatLockedNote z powodem (tekst blokady) — `R-WEB-DIPLO-NAP-TRUST-30-Q1: pakt wymaga Relacji ORAZ Zaufania (dualGate, jak sojusz/granice). [+4 w wierszu]` | LOGIKA | diplomacy.rs (blokady: dualGate) | #4 DYPLOMACJA-MULTIWAR |
| `diplomacy-penalty-preview.ts:147–248` | 5 | +80/−2 | TRADE-FREE-BREAK-AFTER-10: umowa handlowa zerwana po >=10 turach bez kary (tradeTreatyBreakPenaltyFree, podglad kary) | LOGIKA | diplomacy.rs (kara za zerwanie) | NOWY-3 HANDEL-EMPORION |
| `diplomacy-proposals.ts:535–1127` | 2 | +28/−0 | NAP: napRelacjaProgEfektywny + prog Zaufania; rabat ceny pokoju od zmeczenia wojna; akcja zaproponuj_przemarsz (tekst/dane) — `R-WEB-DIPLO-NAP-UI-BORDER-THRESHOLD-Q1: JEDEN efektywny próg Relacji dla Paktu o nieagresji. [+1 w wierszu]` | LOGIKA | diplomacy.rs (evaluateProposal) ; ai_turn.rs | #4 DYPLOMACJA-MULTIWAR |
| `diplomacy-proposals.ts:1146–1321` | 2 | +12/−5 | NAP: napRelacjaProgEfektywny + prog Zaufania; rabat ceny pokoju od zmeczenia wojna; akcja zaproponuj_przemarsz (tekst/dane) — `R-WEB-AI-WAR-WEARINESS-PEACE-Q1: zmęczenie wojną obniża cenę pokoju zadaną od gracza (do rabatCenyPokojuMax). [+1 w wierszu]` | LOGIKA | diplomacy.rs (evaluateProposal) ; ai_turn.rs | #4 DYPLOMACJA-MULTIWAR |
| `diplomacy-proposals.ts:1924–1998` | 2 | +9/−0 | zaproponuj_przemarsz: komunikat + payload (umowa przemarszu AI, N/T6) | LOGIKA | diplomacy.rs | #6 AI-ARMIA |
| `diplomacy-siege-war-gate.ts:1–111` | 1 | +111/−0 | oblezenie dozwolone tylko miedzy stronami w wojnie (NO-SIEGE-WITHOUT-WAR) | LOGIKA | NOWY diplomacy_siege_war_gate.rs (+ diplomacy_war_gates.rs) | #4 DYPLOMACJA-MULTIWAR |
| `diplomacy.ts:209–214` | 1 | +6/−0 | progNapZaufanie w parametrach dyplomacji | LOGIKA | diplomacy.rs | #4 DYPLOMACJA-MULTIWAR |
| `diplomacy.ts:851–1042` | 2 | +9/−0 | prog NAP Zaufania (T4) i dobrowolne zerwanie umowy handlowej po >=10 turach (N3) | LOGIKA | diplomacy.rs | NOWY-3 HANDEL-EMPORION |
| `economy-upkeep.ts:348–349` | 1 | +2/−2 | Magazyn: +20% BAZY pojemnosci surowcow panstwa (bonusProcNaBudynek), usuniete bonusSurowceNaBudynek=500, OwnerStorageBreakdown — `bazaSurowcePanstwo: number;` | LOGIKA | economy_city_params.rs / turn_economy_upkeep.rs (owner storage) | #2 EKONOMIA-F |
| `economy-upkeep.ts:356–360` | 1 | +5/−0 | Magazyn: +20% BAZY pojemnosci surowcow panstwa (bonusProcNaBudynek), usuniete bonusSurowceNaBudynek=500, OwnerStorageBreakdown — `export interface OwnerStorageBreakdown {` | LOGIKA | economy_city_params.rs / turn_economy_upkeep.rs (owner storage) | #2 EKONOMIA-F |
| `economy-upkeep.ts:374–375` | 1 | +2/−2 | Magazyn: +20% BAZY pojemnosci surowcow panstwa (bonusProcNaBudynek), usuniete bonusSurowceNaBudynek=500, OwnerStorageBreakdown — `bazaSurowcePanstwo: 50000,` | LOGIKA | economy_city_params.rs / turn_economy_upkeep.rs (owner storage) | #2 EKONOMIA-F |
| `economy-upkeep.ts:430–474` | 4 | +8/−5 | Magazyn: +20% BAZY pojemnosci surowcow panstwa (bonusProcNaBudynek), usuniete bonusSurowceNaBudynek=500, OwnerStorageBreakdown — `R-WEB-WAREHOUSE-STATE-CAP-20PCT-Q1: baza × (1 + proc × N) × mnożnik epoki. [+3 w wierszu]` | LOGIKA | economy_city_params.rs / turn_economy_upkeep.rs (owner storage) | #2 EKONOMIA-F |
| `economy.ts:116–230` | 2 | +9/−2 | popcap: Spichlerz II=12, Akwedukt=20 (cityPopulationCap + maSpichlerzII); terrain-names unify; plony ulepszen wg epoki wlasciciela (N2) — `R-WEB-POPCAP-SPICHLERZ2-12-AKWEDUKT-20-Q1 (decyzja właściciela 2026-11-04), domyślnie 12. [+1 w wierszu]` | LOGIKA | city_growth.rs / economy_city_params.rs / economy_yield.rs | #2 EKONOMIA-F |
| `economy.ts:283–288` | 1 | +6/−0 | IMPROVEMENT-ERA-SCALING: wlascicielEra w TileYield | LOGIKA | economy_yield.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `economy.ts:468` | 1 | +1/−1 | applyImprovementBonuses(out, impKeys, tile.wlascicielEra) | LOGIKA | economy_yield.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `economy.ts:1065–1084` | 5 | +13/−5 | popcap: Spichlerz II=12, Akwedukt=20 (cityPopulationCap + maSpichlerzII); terrain-names unify; plony ulepszen wg epoki wlasciciela (N2) — `params: Pick<EconParams, 'akweduktProgLudnosci' / 'spichlerzProgLudnosci' / 'akweduktMaxLudnosci'> [+4 w wierszu]` | LOGIKA | city_growth.rs / economy_city_params.rs / economy_yield.rs | #2 EKONOMIA-F |
| `economy.ts:1125` | 1 | +1/−0 | popcap: Spichlerz II=12, Akwedukt=20 (cityPopulationCap + maSpichlerzII); terrain-names unify; plony ulepszen wg epoki wlasciciela (N2) — `!!maSpichlerzII,` | LOGIKA | city_growth.rs / economy_city_params.rs / economy_yield.rs | #2 EKONOMIA-F |
| `empire-food.ts:131` | 1 | +1/−1 | Magazyn nie zwieksza cap zywnosci (default 0 zamiast 100) - MAGNOFOOD FALA 513 | LOGIKA | turn_economy_empirefood.rs | #2 EKONOMIA-F |
| `empire-recruit-plan.ts:1–196` | 1 | +196/−0 | zbiorcze zamowienie rekrutacji cywilizacji: rozklad rowny po miastach (UI-EMPIRE-RECRUIT-PANEL FALA 509) | UI | NOWY empire_recruit_plan.rs (komenda P7; kontroler v2) | NOWY-7 UI-KONTROLER-V2 |
| `event-defer-queue.ts:1–102` | 1 | +102/−0 | wspolna kolejka odroczenia powiadomien-modali (EVENTS-DEFER-TO-TURN-START) | LOGIKA | events.rs (NOWE: kolejka odroczenia) | NOWY-5 ZDARZENIA-TURA |
| `event-lifetime.ts:1–53` | 1 | +53/−0 | czas zycia zdarzen informacyjnych = jedna tura (EVENTS-ONE-TURN-LIFETIME) | LOGIKA | events.rs (NOWE: zycie zdarzenia = 1 tura) | NOWY-5 ZDARZENIA-TURA |
| `fort-territory.ts:70–400` | 2 | +49/−0 | isOutpostPlacementAllowed (FORT-OUTPOST-PLACEMENT-RULES) + fortSightSources (FORT-VISION-FOG: fort/posterunek zrodlem wzroku) | LOGIKA | fort_territory.rs | #7 OBLEZENIE-ZDOBYCZE |
| `generals.ts:20–69` | 1 | +50/−0 | canSpawnQueuedGeneral: bramka NARODZIN wodza (GENERALS-OVER-LIMIT FALA 533) + migracja nadmiaru (T8) | LOGIKA | generals.rs / general_quick_follow.rs | #6 AI-ARMIA |
| `livestock-unlock.ts:69–162` | 3 | +2/−6 | hexHasHorseDeposit przeniesione do terrain-improvements + zloze konia ze starych zapisow (STADNINA-KONIE-STARE-ZAPISY) | LOGIKA | improvement_build.rs / improvements.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `manpower.ts:907–915` | 1 | +9/−0 | formatManpowerCompact: skrot tys./mln w panelach (MANPOWER-ABBREV-PANELS) | UI | — (UI: formatowanie liczby) | NOWY-7 UI-KONTROLER-V2 |
| `next-active-unit.ts:1–72` | 1 | +72/−0 | nastepna aktywna jednostka (ROSTER-SPACE) | UI | NOWY next_active_unit.rs (komenda kontrolera v2) | NOWY-7 UI-KONTROLER-V2 |
| `okolica.ts:362–407` | 2 | +2/−2 | ranking pol okolicy wg plonow skalowanych epoka wlasciciela (IMPROVEMENT-ERA-SCALING) | LOGIKA | okolica.rs / economy_yield.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `okolica.ts:459–826` | 14 | +24/−9 | yieldOfMapHex(map,q,r,ownerEra) + eraForOwner w assignWorked/resolve | LOGIKA | okolica.rs / economy_yield.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `planned-march.ts:271–399` | 4 | +13/−4 | MOVE-PASS-THROUGH-OWN-UNITS: odcinek marszu nie konczy sie na heksie z wlasna jednostka (trimSegmentEndOffPassThrough), budzet starcza tylko na heksy tranzytu | LOGIKA | order_effects_lane.rs / planned_march (P6.9-10) | NOWY-1 MARSZ-PRZEJSCIE |
| `population-growth-v85.ts:46` | 1 | +0/−6 | USUNIETO rationEraFoodCostMultiplier (zastapione m(e)) | LOGIKA | city_growth.rs | #2 EKONOMIA-F |
| `population-growth-v85.ts:311–595` | 7 | +9/−3 | racja zywnosci x m(e) (zamiast rationEraFoodCostMultiplier); maSpichlerzII do cap; ranking pol rebalansu wg owner era (MANUAL-REBALANCE-OWNER-ERA) | LOGIKA | city_growth.rs | #2 EKONOMIA-F |
| `post-battle-map.ts:55–78` | 1 | +24/−0 | battleReserveNotice: komunikat o rezerwie przed bitwa (FALA 535) | UI | battle_mode.rs (DTO komunikatu) | NOWY-7 UI-KONTROLER-V2 |
| `post-battle-map.ts:415–508` | 4 | +13/−2 | jednostki spoza limitu pola nie gina (BATTLE-UNDEPLOYED-UNITS-LOST), atak wygrany bez holdPosition nie zajmuje, zdobycie = -1 obywatel; komunikat o rezerwie (UI) | LOGIKA | combat.rs / battle_mode.rs (po bitwie) | #7 OBLEZENIE-ZDOBYCZE |
| `production.ts:165–531` | 2 | +14/−0 | MILL-RIVER-ONLY-GATE: Mlyn tylko przy rzece (RIVER_ONLY_BUILDING_IDS, bramka) — `R-WEB-MILL-RIVER-ONLY-GATE-Q1 (decyzja właściciela 2026-11-04, ABC: „Porty: morze LUB rzeka; młyn TYLKO rze… [+1 w wierszu]` | LOGIKA | production_queue.rs / building_costs.rs | #2 EKONOMIA-F |
| `production.ts:1005–1008` | 1 | +4/−0 | MILL-RIVER-ONLY-GATE: Mlyn tylko przy rzece (RIVER_ONLY_BUILDING_IDS, bramka) — `R-WEB-MILL-RIVER-ONLY-GATE-Q1: młyn wymaga RZEKI w zasięgu miasta (morze/jezioro nie wystarcza).` | LOGIKA | production_queue.rs / building_costs.rs | #2 EKONOMIA-F |
| `recruit-list-order.ts:1–69` | 1 | +69/−0 | kolejnosc listy rekrutacji wg epoki (RECRUIT-LIST-ORDER-BY-ERA) | UI | recruitment.rs / kontroler v2 (kolejnosc listy) | NOWY-7 UI-KONTROLER-V2 |
| `relief-preserving-improvements.ts:27` | 1 | +1/−1 | obóz łowiecki zachowuje relief wzgorza (HUNTING-CAMP-HILL-NO-FLATTEN) | LOGIKA | improvements.rs / auto_improvements.rs | #3 AUTOIMPROVE |
| `resource-access.ts:61–364` | 2 | +6/−3 | etykieta zasobu "Kon"; getCityResourceAccess przerobiony (natywny dostep do zelaza - ownerHasNativeZelazoAccess) | LOGIKA | resource_access.rs | #2 EKONOMIA-F |
| `road-network-plan.ts:1–284` | 1 | +284/−0 | plan sieci drog MST miedzy miastami cywilizacji (AI-ROADS-CITY-LINKS-ONLY FALA 521) | LOGIKA | NOWY road_network_plan.rs (+ roads.rs, auto_improvements.rs) | #3 AUTOIMPROVE |
| `scout-auto-explore.ts:13–240` | 8 | +16/−8 | MOVE-PASS-THROUGH-OWN-UNITS: tranzyt przez wlasne jednostki bez zakonczenia ruchu na nich | LOGIKA | order_effects_lane.rs (auto-eksploracja zwiadowcy) | NOWY-1 MARSZ-PRZEJSCIE |
| `siege-enter-city.ts:1–106` | 1 | +106/−0 | po kapitulacji jednostka oblegajaca wchodzi do miasta (SIEGE-SURRENDER-ENTER-CITY) | LOGIKA | NOWY siege_enter_city.rs | #7 OBLEZENIE-ZDOBYCZE |
| `siege-last-stand.ts:1–202` | 1 | +202/−0 | wypad obleganej armii (sila >=80%), w dowolnej turze (SORTIE-ANY-TURN FALA 505) | LOGIKA | NOWY siege_last_stand.rs | #7 OBLEZENIE-ZDOBYCZE |
| `siege-starvation.ts:1–133` | 1 | +133/−0 | etap zapasow, potem glod garnizonu 6/8/10% maxHP/ture, poddanie gdy sumaHP<50% (FALA 511) | LOGIKA | NOWY siege_starvation.rs | #7 OBLEZENIE-ZDOBYCZE |
| `siege-surrender-forecast.ts:1–164` | 1 | +164/−0 | prognoza "tur do poddania" (SIEGE-BADGE-TURNS-TO-SURRENDER); czysta funkcja wyliczajaca - logika dla DTO | UI | NOWY siege_surrender_forecast.rs (DTO plakietki) | #7 OBLEZENIE-ZDOBYCZE |
| `siege.ts:153–165` | 1 | +13/−0 | Milicja: MILITIA_REGEN_TURNS/MORALE, efektywny garnizon = zywi + milicja (nie zamiast); komentarze SS9c — `Okres odnowy Milicji (tury globalne) po jej calkowitym zniszczeniu (combat-params.json oblezenie.militia_re…` | LOGIKA | NOWY siege.rs / militia | #7 OBLEZENIE-ZDOBYCZE |
| `siege.ts:580–584` | 2 | +4/−3 | Milicja: MILITIA_REGEN_TURNS/MORALE, efektywny garnizon = zywi + milicja (nie zamiast); komentarze SS9c — `Spec 2026-11-03 (M2): with a completed Garnizon the militia ALWAYS joins the [+1 w wierszu]` | LOGIKA | NOWY siege.rs / militia | #7 OBLEZENIE-ZDOBYCZE |
| `siegeDefenders.ts:32–116` | 3 | +45/−1 | Milicja = 1 jednostka/mieszkanca (CITY-MILITIA-NO-DEFENDERS), roster per epoka, cooldown odnowy 5 tur (MILITIA-REGEN-COOLDOWN), buildMilitiaDef/countMilitia, brak utraty ludnosci — `R-WEB-CITY-MILITIA-REGEN-COOLDOWN-Q1: ile tur zostalo do odnowy Milicji (0 = dostepna). [+2 w wierszu]` | LOGIKA | NOWY siege_defenders.rs (milicja per mieszkaniec) | #7 OBLEZENIE-ZDOBYCZE |
| `siegeDefenders.ts:162–166` | 2 | +3/−0 | Milicja = 1 jednostka/mieszkanca (CITY-MILITIA-NO-DEFENDERS), roster per epoka, cooldown odnowy 5 tur (MILITIA-REGEN-COOLDOWN), buildMilitiaDef/countMilitia, brak utraty ludnosci — `militiaKind: MilitiaKind; [+1 w wierszu]` | LOGIKA | NOWY siege_defenders.rs (milicja per mieszkaniec) | #7 OBLEZENIE-ZDOBYCZE |
| `siegeDefenders.ts:173–409` | 6 | +220/−29 | Milicja = 1 jednostka/mieszkanca (CITY-MILITIA-NO-DEFENDERS), roster per epoka, cooldown odnowy 5 tur (MILITIA-REGEN-COOLDOWN), buildMilitiaDef/countMilitia, brak utraty ludnosci — `R-WEB-CITY-MILITIA-NO-POPULATION-LOSS-Q1: Milicja to syntetyczne, tymczasowe jednostki bitewne [+5 w wierszu]` | LOGIKA | NOWY siege_defenders.rs (milicja per mieszkaniec) | #7 OBLEZENIE-ZDOBYCZE |
| `stack-leader.ts:1–65` | 1 | +65/−0 | tozsamosc stosu: zwiadowca nie jest liderem armii (SCOUT-NOT-LEADER FALA 510) | LOGIKA | army_leadership.rs / generals.rs (zwiadowca nie lider) | #6 AI-ARMIA |
| `terrain-improvements.ts:125–157` | 2 | +31/−2 | IMPROVEMENT-ERA-SCALING: bonus ulepszen skalowany epoka wlasciciela (x1,5/epoke), amount() w produkcji surowcow; hexHasHorseDeposit (jedyny predykat zloza konia) — `R-WEB-IMPROVEMENT-ERA-SCALING-Q1 (decyzja właściciela 2026-11-03) -- JEDNO ŹRÓDŁO PRAWDY. [+1 w wierszu]` | LOGIKA | improvement_build.rs / improvements.rs / economy_yield.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `terrain-improvements.ts:164–343` | 9 | +32/−17 | IMPROVEMENT-ERA-SCALING: bonus ulepszen skalowany epoka wlasciciela (x1,5/epoke), amount() w produkcji surowcow; hexHasHorseDeposit (jedyny predykat zloza konia) — `Produkcja KAŻDEGO ulepszenia surowcowego rośnie ×1,5 za epokę (R-WEB-IMPROVEMENT-ERA-SCALING-Q1, [+8 w wierszu]` | LOGIKA | improvement_build.rs / improvements.rs / economy_yield.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `terrain-improvements.ts:394–425` | 2 | +11/−1 | IMPROVEMENT-ERA-SCALING: bonus ulepszen skalowany epoka wlasciciela (x1,5/epoke), amount() w produkcji surowcow; hexHasHorseDeposit (jedyny predykat zloza konia) — `R-WEB-STADNINA-KONIE-STARE-ZAPISY-Q1: JEDYNY predykat złoża konia (budowa, tooltip, koszt, ukrywanie [+1 w wierszu]` | LOGIKA | improvement_build.rs / improvements.rs / economy_yield.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `trade-routes.ts:909` | 1 | +1/−1 | TRADE-ROUTE-CONTACT-ONLY: trasa zewnetrzna wystarczy znajomosc (contactTradeConnection/externalTradeContactOk), morska premia wymaga Portu (SEA-BONUS-REQUIRES-PORT), Emporion w budynkach handlu — `'targowisko', 'port', 'port_wielki', 'emporion',` | LOGIKA | trade.rs / trade_flow_apply.rs | NOWY-3 HANDEL-EMPORION |
| `trade-routes.ts:1011–1045` | 5 | +30/−15 | TRADE-ROUTE-CONTACT-ONLY: trasa zewnetrzna wystarczy znajomosc (contactTradeConnection/externalTradeContactOk), morska premia wymaga Portu (SEA-BONUS-REQUIRES-PORT), Emporion w budynkach handlu — `R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1 — medium i dystans trasy ZEWNĘTRZNEJ bez wymogu [+4 w wierszu]` | LOGIKA | trade.rs / trade_flow_apply.rs | NOWY-3 HANDEL-EMPORION |
| `trade-routes.ts:1061–1082` | 5 | +4/−27 | TRADE-ROUTE-CONTACT-ONLY: trasa zewnetrzna wystarczy znajomosc (contactTradeConnection/externalTradeContactOk), morska premia wymaga Portu (SEA-BONUS-REQUIRES-PORT), Emporion w budynkach handlu — `hasContact: boolean, [+4 w wierszu]` | LOGIKA | trade.rs / trade_flow_apply.rs | NOWY-3 HANDEL-EMPORION |
| `trade-routes.ts:1285–1768` | 6 | +29/−11 | TRADE-ROUTE-CONTACT-ONLY: trasa zewnetrzna wystarczy znajomosc (contactTradeConnection/externalTradeContactOk), morska premia wymaga Portu (SEA-BONUS-REQUIRES-PORT), Emporion w budynkach handlu — `R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1: trasa zewnętrzna utrzymuje się, dopóki cywilizacje [+5 w wierszu]` | LOGIKA | trade.rs / trade_flow_apply.rs | NOWY-3 HANDEL-EMPORION |
| `turn-economy.ts:297–298` | 1 | +2/−1 | spichlerz_ii_prog_ludnosci w parametrach | LOGIKA | turn_economy_inputs_*.rs / economy_city_params.rs | #2 EKONOMIA-F |
| `turn-economy.ts:426` | 1 | +1/−24 | FRESHWATER-ACCESS-LAKE: `cityHasWaterAccess` deleguje do `hasFreshwaterAccess` (słodka woda = rzeka LUB jezioro; morze NIE); zależność: `gra/src/map/freshwater.ts` (NOWY po pinie, poza zakresem 91 plików, §8 pkt 8) | LOGIKA | freshwater.rs (dostęp do wody) | #2 EKONOMIA-F |
| `turn-economy.ts:532–534` | 1 | +3/−1 | etykieta wiersza "Jezioro" | UI | — (etykieta Rzeka/Jezioro) | #2 EKONOMIA-F |
| `turn-economy.ts:572–585` | 2 | +6/−1 | hexToWorkedTile(..., ownerEra) / ranking pol wg epoki — `R-WEB-IMPROVEMENT-ERA-SCALING-Q1: aktualna epoka właściciela (skaluje plony ulepszeń). */ [+1 w wierszu]` | LOGIKA | economy_yield.rs / turn_economy_territory.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `turn-economy.ts:645–719` | 8 | +10/−6 | hexToWorkedTile(..., ownerEra) / ranking pol wg epoki — `R-WEB-IMPROVEMENT-ERA-SCALING-Q1: aktualna epoka właściciela miasta (brak = Kamień). */ [+7 w wierszu]` | LOGIKA | economy_yield.rs / turn_economy_territory.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `turn-economy.ts:864–872` | 2 | +5/−1 | cityWorkedTilesForEconomy(..., eraForOwner) - epoka wlasciciela w bilansie — `R-WEB-IMPROVEMENT-ERA-SCALING-Q1: epoka właściciela (plony pól skalowane epoką). */ [+1 w wierszu]` | LOGIKA | turn_economy*.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `turn-economy.ts:1462–1480` | 2 | +5/−7 | konwertery per-receptura x m(e) | LOGIKA | resource_production.rs | #2 EKONOMIA-F |
| `turn-economy.ts:1968–1971` | 1 | +4/−1 | cityWorkedTilesForEconomy(..., eraForOwner) - epoka wlasciciela w bilansie — `const worked = cityWorkedTilesForEconomy(` | LOGIKA | turn_economy*.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `turn-economy.ts:2385–2388` | 1 | +4/−6 | przepustowosci konwerterow per receptura | LOGIKA | resource_production.rs | #2 EKONOMIA-F |
| `turn-economy.ts:2508–2544` | 2 | +8/−2 | cityWorkedTilesForEconomy(..., eraForOwner) - epoka wlasciciela w bilansie — `const workedMagazynByCity = computeWorkedMagazynYieldsByCity( [+1 w wierszu]` | LOGIKA | turn_economy*.rs | NOWY-2 ULEPSZENIA-EPOKA |
| `villageRewards.ts:169–208` | 2 | +8/−0 | limit stosu (stackLimit) przy wyborze heksu nagrody (ARMY-STACK-LIMIT) | LOGIKA | recruitment.rs / villages (nagrody wiosek) | #7 OBLEZENIE-ZDOBYCZE |
| `visibility.ts:271–307` | 3 | +8/−0 | extraSightSources: forty/posterunki zrodlem wzroku (FORT-VISION-FOG, uzywa fortSightSources) | LOGIKA | fog/visibility (mapa; NIE_ZMIERZONO modul) | NOWY-1 MARSZ-PRZEJSCIE |
| `war-weariness.ts:1–302` | 1 | +302/−0 | zmeczenie wojna per para + eskalacja oferty pokoju przegrywajacego; karencja po pokoju (WEARY FALA 520) | LOGIKA | NOWY war_weariness.rs (+ diplomacy_war_peace_profile.rs) | #4 DYPLOMACJA-MULTIWAR |
| `warAllInCapital.ts:56–60` | 1 | +5/−0 | MOVE-FULL-RANGE (rezerwacja tylko heksu koncowego, heks tranzytu), NEAREST-CITY remis (tieBeforeTarget), przejscie przez wlasne jednostki (N1) — `R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1 (A): liczba jednostek bojowych broniacych miasta (remis odleglosci:` | LOGIKA | war_all_in_capital*.rs | #6 AI-ARMIA |
| `warAllInCapital.ts:226–231` | 1 | +6/−0 | podzbior occupied z wlasnymi jednostkami (passThrough) | LOGIKA | war_all_in_capital_nav.rs | NOWY-1 MARSZ-PRZEJSCIE |
| `warAllInCapital.ts:408–429` | 2 | +13/−1 | MOVE-FULL-RANGE (rezerwacja tylko heksu koncowego, heks tranzytu), NEAREST-CITY remis (tieBeforeTarget), przejscie przez wlasne jednostki (N1) — `Remis odleglosci przy wyborze najblizszego celu (R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1, A): [+1 w wierszu]` | LOGIKA | war_all_in_capital*.rs | #6 AI-ARMIA |
| `warAllInCapital.ts:460–504` | 3 | +10/−1 | isTransitFor: heks tranzytu | LOGIKA | war_all_in_capital_nav.rs | NOWY-1 MARSZ-PRZEJSCIE |
| `warAllInCapital.ts:510–552` | 2 | +42/−1 | MOVE-FULL-RANGE (rezerwacja tylko heksu koncowego, heks tranzytu), NEAREST-CITY remis (tieBeforeTarget), przejscie przez wlasne jednostki (N1) — `R-WEB-AI-MOVE-FULL-RANGE-Q1: jedyny heks "scisle blizej" w linii marszu zajety/zarezerwowany [+1 w wierszu]` | LOGIKA | war_all_in_capital*.rs | #6 AI-ARMIA |
| `warAllInCapital.ts:557–559` | 1 | +3/−0 | trasa nie konczy sie na zajetym heksie | LOGIKA | war_all_in_capital_nav.rs | NOWY-1 MARSZ-PRZEJSCIE |
| `warAllInCapital.ts:849–851` | 1 | +3/−1 | MOVE-FULL-RANGE (rezerwacja tylko heksu koncowego, heks tranzytu), NEAREST-CITY remis (tieBeforeTarget), przejscie przez wlasne jednostki (N1) — `R-WEB-AI-MOVE-FULL-RANGE-Q1: rezerwacja TYLKO heksu koncowego (zero dwoch jednostek na jednym` | LOGIKA | war_all_in_capital*.rs | #6 AI-ARMIA |
| `wonder-transfer.ts:1–93` | 1 | +93/−0 | cud swiata przechodzi na zdobywce/kontrolujacego hex, nie na rebeliantow/barbarzyncow (WONDER FALA 541/543) | LOGIKA | wonder_placement.rs (+ nowy wonder_transfer.rs) | #7 OBLEZENIE-ZDOBYCZE |
| `work-tax.ts:60–139` | 2 | +62/−0 | workTaxResultMessage / runManualWorkTaxAction: reczna akcja podatku od pracy + komunikat (UI-wrapper nad istniejaca logika) | UI | work_tax.rs (komenda P7) | NOWY-7 UI-KONTROLER-V2 |
| `zelazo-access.ts:90–111` | 1 | +22/−0 | ownerHasNativeZelazoAccess: jedna sciezka natywnego dostepu do zelaza (IRON-NATIVE-ACCESS-FIX, blad 1:1 w Rust) | LOGIKA | resource_access.rs | #2 EKONOMIA-F |

### 4b. Hunki PERF-bez-wpływu (komentarze, importy, cache, logi diagnostyczne)

| Plik:linie | Hunki | +/− | Opis |
|---|---:|---|---|
| `data/buildings.json:634` | 1 | +1/−1 | tekst uwag cegielni (opis) |
| `data/citizen-resource-upkeep.json:2` | 1 | +1/−1 | _opis (tekst) — `"_opis": "R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1 (Maciej 2026-11-05): stawka na obywatela = 1,0 (CITIZEN_UPK…` |
| `data/diplomacy.json:232` | 1 | +1/−1 | opis (tekst) NAP |
| `data/econ-params.json:36` | 1 | +1/−1 | opis spichlerz_prog (tekst) |
| `data/econ-params.json:57` | 1 | +1/−1 | opis zuzycia zywnosci (martwy wzor, tekst) |
| `data/econ-params.json:360` | 1 | +1/−1 | opis cegielni (tekst) |
| `data/econ-params.json:367` | 1 | +1/−1 | opis odlewni (tekst) — `"opis": "Maks konwersja (Ruda+Drewno)→Brąz w Odlewni brązu (i tier wyższy łańcucha odlewni) na turę. Cykle …` |
| `data/econ-params.json:374` | 1 | +1/−1 | opis odlewni (tekst) — `"opis": "Maks konwersja (Ruda żelaza+Drewno)→Żelazo w Odlewni żelaza / Wielka odlewnia na turę. Cykle × m(e…` |
| `data/econ-params.json:381` | 1 | +1/−1 | opis (tekst) — `"opis": "Maks konwersja (Żelazo+Drewno)→Stal w Wielka odlewnia na turę (Maciej 2026-07-27: przeniesione z W…` |
| `data/econ-params.json:402–409` | 2 | +2/−2 | opis (nazwa Spichlerz Krolewski) |
| `data/econ-params.json:632` | 1 | +1/−1 | opis (tekst) — `"opis": "R-WEB-MAGAZYN-NO-FOOD-CAP-BONUS-Q1 (decyzja właściciela 2026-11-05: „Usuń żywność, dodatkową pojem…` |
| `data/resources.json:54` | 1 | +1/−1 | tekst Uwagi (nazwa Spichlerz Krolewski) |
| `data/war-rules-params.json:2` | 1 | +1/−1 | _opis (tekst) — `"_opis": "R-WEB-WAR-RULES-MULTIWAR-Q1 r3 (regula TYMCZASOWA, flaga WAR_RULES_MULTIWAR_ENABLED w src/game/wa…` |
| `ai-city-capture-executor.ts:8` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `import { keyOf, cloneMoveOccupancy, endBlockedKeys, type MoveOccupancy } from '../units/setup';` |
| `ai.ts:23–98` | 7 | +11/−3 | importy (ujawniaja nowe moduly) |
| `ai.ts:1724–1734` | 2 | +4/−3 | komentarz/import (bez zmiany zachowania) — `I bez Akweduktu -- spichlerz_prog_ludnosci, PŁASKIE 8 na wszystkich [+1 w wierszu]` |
| `ai.ts:1777` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `uzasadnienia. Zwraca 0 gdy Akwedukt już stoi (sufit 20, Spichlerz przestał` |
| `ai.ts:2823–2826` | 1 | +4/−4 | komentarz/import (bez zmiany zachowania) — `R-WEB-AI-CITIZEN-HEX-SIBLING-EXCLUSION-Q1: zbior pol obywateli wyklucza heksy przegrane na rzecz` |
| `ai.ts:2867–2868` | 1 | +2/−4 | komentarz/import (bez zmiany zachowania) — `Brak limitu LICZBY ulepszen na miasto/ture (R-WEB-AUTOIMPROVE-STAGES-Q1 R3 ABC-D=B, STAGES3 S3-2=C; paramet…` |
| `ai.ts:3617` | 1 | +1/−1 | komentarz (brak limitu ulepszen/miasto) |
| `ai.ts:5885–5887` | 1 | +3/−0 | import — `import {` |
| `ai.ts:6010–6012` | 1 | +3/−3 | komentarz/import (bez zmiany zachowania) — `E6 → R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1: czy strony mogą handlować — od 2026-11-04` |
| `army-concentration.ts:12` | 1 | +1/−0 | import — `import { WAR_ALLIN_MERGE_RADIUS } from './warAllInCapital';` |
| `armyMerge.ts:7` | 1 | +1/−0 | import — `import { pickStackLeader } from './stack-leader';` |
| `armyMerge.ts:445–448` | 1 | +4/−1 | komentarz/import (bez zmiany zachowania) — `Najmocniejsza jednostka stosu (Atak → id). R-WEB-ARMY-SCOUT-NOT-LEADER-Q1:` |
| `auto-improvements.ts:6–48` | 7 | +17/−3 | naglowek/importy/typ pola (ulepszeniaOnlyWorked usuniete z typu) |
| `auto-improvements.ts:188–189` | 1 | +2/−3 | komentarz/import (bez zmiany zachowania) — `• ZLIKWIDOWANE (właściciel 2026-11-03): pułap ulepszeń ZEROPLONOWYCH (posterunek/fort) defenseCap =` |
| `auto-improvements.ts:325–330` | 1 | +6/−0 | LIVE-HOOKS: opcjonalny log decyzji wycinki (onDecision) |
| `auto-improvements.ts:354–375` | 4 | +7/−7 | komentarz/import (bez zmiany zachowania) — `nieświadome tego mechanizmu (np. AI) nie zostały [+3 w wierszu]` |
| `auto-improvements.ts:433–435` | 1 | +3/−4 | komentarz/import (bez zmiany zachowania) — `R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1 (właściciel 2026-11-04) automat ZAWSZE może wycinać las po…` |
| `auto-improvements.ts:519–521` | 1 | +3/−3 | komentarz/import (bez zmiany zachowania) — `kolejności (patrz test 12 w auto-improvements-test.cjs). Limitu LICZBY sztuk na miasto nie ma` |
| `auto-improvements.ts:557–558` | 1 | +2/−2 | komentarz/import (bez zmiany zachowania) — `E3 hodowla (bydło/owce/lama) — wyłącznie przy rzece (picker: onRiverHex = hasRiverAccess: na rzece albo sąs…` |
| `auto-improvements.ts:724–768` | 6 | +13/−4 | AUTO-FORT-DIAG: liczniki odrzucen (tylko log) |
| `auto-improvements.ts:1106–1142` | 2 | +21/−1 | AUTO-FORT-DIAG: log powodu wejscia/pominiecia E-FORT |
| `auto-improvements.ts:1239–1241` | 1 | +3/−0 | dbg sink (log) |
| `auto-improvements.ts:1365–1367` | 1 | +3/−2 | komentarz/import (bez zmiany zachowania) — `(hasRiverAccess = rzeka-only, priorytety E1–E3); od 2026-11-02 (FRESHWATER-LAKE-Q1) rezerwację tartaku/oboz…` |
| `auto-improvements.ts:1534–1537` | 1 | +4/−10 | komentarz/import (bez zmiany zachowania) — `ZASADA 2 — [ZMIENIONA w R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1, właściciel 2026-11-04]: filtr „ty…` |
| `auto-improvements.ts:1626–1629` | 1 | +4/−4 | komentarz/import (bez zmiany zachowania) — `w ai.ts). [HISTORIA — NIEAKTUALNE: limit` |
| `auto-improvements.ts:1681–1691` | 2 | +6/−4 | komentarz/import (bez zmiany zachowania) — `[R-WEB-AUTO-IMPROVE-Q3-RIVER-BALANCED-DEFENSECAP-WARNING-Q1, decyzja właściciela 2026-11-03: pułap [+1 w wierszu]` |
| `auto-improvements.ts:1764` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `tylko gdy FAZA 1 nic nie postawiła — a przy dawnym limicie 1 sztuki/miasto (zdjęty, decyzja #10) FAZA 1 sta…` |
| `auto-improvements.ts:1982–2033` | 1 | +52/−0 | LIVE-HOOKS: log diagnostyczny wycinki (tylko gdy dbg) |
| `auto-improvements.ts:2167` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `nie miala; przy dawnym limicie 1 sztuki/miasto (zdjety, decyzja #10) prawie nigdy nie ruszala, wiec luka` |
| `barbarians.ts:35–38` | 2 | +2/−2 | import — `import { canCaptureCityWithoutBattle, type CityDefRosterOptions } from './siegeDefenders'; [+1 w wierszu]` |
| `capital-capture.ts:352` | 1 | +1/−0 | komentarz/import (bez zmiany zachowania) — `--- Zdarzenie 2 — dodatkowo techy ---` |
| `citizen-resource-upkeep.ts:81–83` | 2 | +2/−2 | komentarz/import (bez zmiany zachowania) — `REAL drain (current rate: per era via citizenUpkeepRateForEra — Kamień 1.0 / Brąz 1.5 / Żelazo 2.0 units of… [+1 w wierszu]` |
| `citizen-resource-upkeep.ts:103` | 1 | +1/−0 | import — `import { citizenConsumptionEraMultiplier } from './citizen-consumption-era';` |
| `citizen-resource-upkeep.ts:151–187` | 2 | +10/−10 | komentarz/import (bez zmiany zachowania) — `R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1 (Maciej 2026-11-05): powyższa stała to STAWKA BAZOWA [+1 w wierszu]` |
| `citizen-resource-upkeep.ts:279` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `**citizenUpkeepRateForEra(era) (per epoka: Kamień 1,0 / Brąz 1,5 / Żelazo 2,0 sztuki surowca na 1 obywatela…` |
| `city-hex-movement.ts:7` | 1 | +1/−1 | import — `import { hexDistance, keyOf, cloneMoveOccupancy } from '../units/setup';` |
| `civ-names.ts:45` | 1 | +1/−0 | re-export collectAllUsedCityNames (1 linia) |
| `civ-test-hooks.ts:1–175` | 1 | +175/−0 | hooki testowe zywej gry (TEST-HOOK-DETERMINISM, LIVE-HOOKS) - bez wplywu na reguly |
| `converters.ts:4–28` | 4 | +7/−5 | naglowki/komentarze/import (opisy receptur) |
| `converters.ts:112–113` | 1 | +2/−1 | komentarz/import (bez zmiany zachowania) — `odlewnia_zelaza*/wielka_odlewnia*) NIE dostają tego mechanizmu (od R-WEB-FOUNDRY-` |
| `converters.ts:135` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `Przyrost przepustowości na epokę (10% BAZY), addytywnie -- domyślny (Garncarnia), patrz komentarz wyżej. */` |
| `converters.ts:189–191` | 1 | +3/−2 | komentarz/import (bez zmiany zachowania) — `bez gałęzi po ownerId). Garncarnia +10% bazy/epokę (addytywnie); Odlewnie` |
| `diplomacy-locks.ts:184–186` | 1 | +3/−1 | komentarz/import (bez zmiany zachowania) — `powodRel (R-WEB-DIPLO-NAP-UI-BORDER-THRESHOLD-Q1): przyczyna podwyższenia progu Relacji` |
| `diplomacy-proposals.ts:30` | 1 | +1/−0 | import — `import { warWearinessLevel, wearinessPeacePriceFactor } from './war-weariness';` |
| `diplomacy-proposals.ts:1144` | 1 | +1/−0 | komentarz/import (bez zmiany zachowania) — `R-WEB-DIPLO-NAP-UI-BORDER-THRESHOLD-Q1: próg liczy WSPÓLNY helper (ten sam co blokada UI).` |
| `diplomacy.ts:207` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `Relacja >= wartość wymagana do NAP (Maciej 2026-09-03: 110 @ normal; od 2026-11-05 OBOK Zaufania — progNapZ…` |
| `economy-upkeep.ts:320–345` | 2 | +8/−6 | komentarz/import (bez zmiany zachowania) — `(R-WEB-WAREHOUSE-STATE-CAP-20PCT-Q1: kazdy Magazyn +20% BAZY, addytywnie [+1 w wierszu]` |
| `economy-upkeep.ts:353–354` | 1 | +2/−13 | komentarz/import (bez zmiany zachowania) — `Rozbicie capu PANSTWA na jednej epoce, w jednostkach szt/typ (dla UI, patrz` |
| `economy-upkeep.ts:362–371` | 1 | +10/−7 | komentarz/import (bez zmiany zachowania) — `Historia bazy (P-MAGAZYN-SKALOWANIE-EPOKA-Q1, R-EKONOMIA-SUROWCE-SKALA-5X-Q1):` |
| `economy-upkeep.ts:398–400` | 1 | +3/−2 | komentarz/import (bez zmiany zachowania) — `(dziś, epoka 1, po R-WEB-WAREHOUSE-STATE-CAP-20PCT-Q1 2026-11-05: 50000 × (1 + 0,2×Magazyn) per typ;` |
| `economy.ts:41` | 1 | +1/−0 | import — `import { TEREN_DANE_LABEL_TO_ENUM } from '../map/terrain-names';` |
| `economy.ts:112` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `Twardy cap ludności ze Spichlerzem I (bez Spichlerza II i bez Akweduktu) — środkowy stopień` |
| `economy.ts:389–390` | 1 | +2/−10 | TERRAIN-ID-NAME-MAP-UNIFY (refaktor mapy etykiet; zachowanie bez zmian) |
| `economy.ts:1013–1015` | 1 | +3/−0 | komentarz o martwym wzorze |
| `economy.ts:1049–1060` | 2 | +9/−4 | komentarz/import (bez zmiany zachowania) — `Aktualny twardy cap ludności miasta — drabinka 4 stopni (R-SPICHLERZ-CAP-LUDNOSCI-ETAP, [+1 w wierszu]` |
| `economy.ts:1102–1104` | 1 | +3/−2 | komentarz/import (bez zmiany zachowania) — `- Cap ze Spichlerzem I, bez Akweduktu: spichlerzProgLudnosci (normal=8).` |
| `empire-food.ts:39–43` | 1 | +5/−1 | komentarz/import (bez zmiany zachowania) — `Dodatek capu za każdy budynek Magazyn w imperium. DZIŚ 0 (R-WEB-MAGAZYN-NO-FOOD-CAP-BONUS-Q1,` |
| `empire-food.ts:168–174` | 2 | +6/−1 | komentarz/import (bez zmiany zachowania) — `R-WEB-MAGAZYN-NO-FOOD-CAP-BONUS-Q1 (decyzja właściciela 2026-11-05): cap żywności = [+1 w wierszu]` |
| `eot-event-defer.ts:116–171` | 4 | +9/−5 | komentarze (zakladki Dyplomacja/Wazne/Inne; zmiana tekstu) - bez zmiany regul; origin other-civs nadal |
| `fort-territory.ts:3–8` | 1 | +6/−4 | komentarz/import (bez zmiany zachowania) — `AKTUALNIE (decyzja wlasciciela 2026-10-31, rejestr #15-#17, R-WEB-OUTPOST-FORT-TERRITORY-Q1):` |
| `frame-memo.ts:1–85` | 1 | +85/−0 | memo klatki/zakresu odczytu HUD (PERF-LATE-GAME-LAG-HUD-Q2) |
| `livestock-unlock.ts:8–10` | 1 | +3/−1 | import/re-export |
| `manpower.ts:30` | 1 | +1/−0 | komentarz/import (bez zmiany zachowania) — `import { formatCompactNumber } from '../ui/formatCompactNumber';` |
| `okolica.ts:66–359` | 21 | +97/−20 | PERF-LATE-GAME-LAG: cache geometrii/okregu, collator, HexFilter(key) - bez zmiany wyniku |
| `okolica.ts:862–926` | 1 | +65/−0 | PERF-ENDTURN-AI-PHASE: memo wyniku rozdzialu pol (czysta funkcja) |
| `planned-march.ts:8–10` | 1 | +3/−1 | import — `import {` |
| `population-growth-tempo.ts:9` | 1 | +1/−1 | komentarz (cap Akweduktu 20) |
| `population-growth-v85.ts:22` | 1 | +1/−0 | import — `import { citizenConsumptionEraMultiplier } from './citizen-consumption-era';` |
| `population-growth-v85.ts:206–304` | 3 | +10/−2 | komentarz/import (bez zmiany zachowania) — `(R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1: m(e) = 1 + 0,5 × (e − 1), citizen-consumption-era.ts), [+2 w wierszu]` |
| `post-battle-map.ts:9` | 1 | +1/−1 | import — `import { wasIndependentCityStateBeforeCapture, applyCapturePopulationLoss } from './cities';` |
| `production.ts:681–690` | 2 | +9/−1 | PERF: memo stripDiacritics |
| `relief-preserving-improvements.ts:9–13` | 1 | +5/−2 | komentarz — `kamieniołom (R-KAMIEN-RELIEF), tartak (R-TARTAK-WZGÓRZE-LAS: tartak na zalesionym` |
| `siege.ts:18–20` | 1 | +3/−2 | komentarz — `wystawia 100% mieszkancow (1 mieszkaniec = 1 jednostka; spec wlasciciela` |
| `siege.ts:526–572` | 2 | +7/−5 | komentarze docstring milicji |
| `siegeDefenders.ts:9–19` | 1 | +11/−1 | import — `import {` |
| `siegeDefenders.ts:134–160` | 2 | +2/−1 | komentarz/import (bez zmiany zachowania) — `Rekord statów syntetycznej (zbiorczej) Milicji (SS9c) — dla matematyki abstrakcyjnego oblężenia. */ [+1 w wierszu]` |
| `siegeDefenders.ts:169` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `id → def for every virtual militiaman supplied by completed Garnizon. */` |
| `society-breakdown.ts:598` | 1 | +1/−1 | komentarz (cap 12->20) |
| `terrain-improvements.ts:161` | 1 | +1/−1 | komentarz/import (bez zmiany zachowania) — `Dodaje bonus ulepszenia do plonów heksa (epoka właściciela skaluje Żyw/Pra/Han/Pieniądz).` |
| `terrain-improvements.ts:365–370` | 1 | +6/−0 | PERF: szybkie wyjscie dla heksu bez ulepszen |
| `trade-routes.ts:999–1009` | 2 | +10/−10 | komentarz/import (bez zmiany zachowania) — `R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1 (decyzja właściciela 2026-11-04) — JEDNA funkcja [+1 w wierszu]` |
| `trade-routes.ts:1049–1056` | 2 | +7/−38 | komentarz/import (bez zmiany zachowania) — `R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1 (2026-11-04): fizyczna łączność (BFS lądowy/ [+1 w wierszu]` |
| `trade-routes.ts:1226–1237` | 1 | +12/−1 | komentarz/import (bez zmiany zachowania) — `@param hasContact R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1 (decyzja właściciela 2026-11-04):` |
| `trade-routes.ts:1916–2025` | 1 | +110/−0 | LONGRUN-100: memoizeOwnerResourceAccess (cache dostepu do surowcow na czas przeliczenia) - bez zmiany wyniku |
| `turn-economy.ts:48` | 1 | +1/−0 | komentarz/import (bez zmiany zachowania) — `import { hasFreshwaterAccess, hasRiverWaterAccess } from '../map/freshwater';` |
| `turn-economy.ts:105` | 1 | +1/−1 | import: `converterThroughputForEra` → `converterThroughputsForEra` (zmiana nazwy importu; zmiana zachowania konwerterów = `turn-economy.ts:1462–1480`, nie ten hunk) |
| `turn-economy.ts:161–162` | 1 | +2/−1 | komentarz/import (bez zmiany zachowania) — `import { territoryOwnerAt, territoryNodesContentId, type TerritoryNode } from '../map/territory';` |
| `turn-economy.ts:420–423` | 1 | +4/−1 | komentarz/import (bez zmiany zachowania) — `LUB jezioro na heksie miasta/sąsiedzie. Morze/ocean NIE (R-WEB-FRESHWATER-ACCESS-LAKE-Q1, decyzja` |
| `turn-economy.ts:424` | 1 | +0/−1 | PERF: usunięcie deklaracji `__riverHexSetCache` (cache zbioru rzek; zbędny po delegacji do `hasFreshwaterAccess`, patrz §4 `turn-economy.ts:426`) |
| `turn-economy.ts:614–634` | 1 | +21/−0 | PERF-HUD: memo odczytu |
| `turn-economy.ts:733–789` | 2 | +18/−3 | PERF-HUD: lista heksow w kolejnosci Object.keys |
| `turn-economy.ts:1733` | 1 | +1/−1 | komentarz — `Garncarnia skaluje cykle +10% bazy/epokę, Cegielnia WYJŚCIE ×(1+0,5·(e−1)) (epoka WŁAŚCICIELA konwertera (o…` |
| `turn-economy.ts:2374–2375` | 1 | +2/−2 | komentarz/import (bez zmiany zachowania) — `P-KONWERTERY-PRZEPUSTOWOSC-Q1 (Maciej 2026-08-12): Garncarnia +10% przepustowości` |

Kontrola sumy: hunki behawioralne 456 (414 L + 30 D + 12 U) + PERF 170 = 626.

### 4c. Kontrola Obrony r1: dowody dla hunków PERF z tezą „bez zmiany wyniku” i poprawki klasyfikacji

Zarzuty Evaluatora r1 sprawdzone w r2 (komendy: `grep` po `gra/src` na drzewie `origin/main` = `59868d84f`; odczyt wszystkich wołających):

- **`okolica.ts:66–359`** (21 hunków: `keysCache`/`tilesCache`/`centersCache`, `HexFilter(key)`, `OKOLICA_KEY_COLLATOR`) — **ODRZUCAM zmianę klasy (zostaje PERF)**, z dowodem: (a) `hexKeysWithinRadius` zwraca zamrożoną tablicę (`Object.freeze`); wszyscy wołający tylko iterują, czytają `.length` lub robią `.map` przed `.sort` (`game/auto-improvements.ts:1526–1530`), nikt nie mutuje wyniku; wołający: `main.ts:2561,5892,26784,26799,27990`, `render/cityOkolicaOverlay.ts:241`, `game/auto-improvements.ts:740,761,878,1549`, `game/resource-access.ts:261`, `game/fort-territory.ts:309`, `game/ai.ts:3192`, `game/turn-economy.ts:366`, `map/improvement-build.ts:1456,1463`, `game/inca-llama-seed.ts:47`. (b) `okolicaTiles` zwraca `slice()` albo `filter()` (świeża tablica); obiekty pól są czytane (`q/r/key/dist`), nie zapisywane. (c) Równoważność wymaga niezmienności kluczy `map.hexes`: jedyne zapisy `hexes[…] =` w `gra/src` to `map/generator.ts:267` i `map/mapSnapshot.ts:320`; brak `delete hexes[…]` i brak `Object.assign` na `hexes`. (d) `Intl.Collator().compare` ≡ `String.prototype.localeCompare` bez argumentów (ECMA-402 §19.1.1). Zależność od ZAŁOŻENIA-7 (poniżej).
- **`turn-economy.ts:733–789`** (`hexListOf`, lista heksów w kolejności `Object.keys`) — **ODRZUCAM zmianę klasy (zostaje PERF)**: lista powstaje z `Object.keys(map.hexes)` raz na obiekt `hexes`; zmienia się tylko pola heksów (czytane przez referencję), a klucze/obiekty są stałe wg punktu (c) powyżej. Ta sama zależność od ZAŁOŻENIA-7.
- **`auto-improvements.ts:1425–1447`** — **PRZYJMUJĘ**: hunk to helper `getOwnFortCircles` wywoływany przez filtr U-3 (`1724–1757`); nie jest logowaniem. Przeniesiony do §4 jako LOGIKA (+23/−0), §4b: −1 wiersz P.
- **`turn-economy.ts:424–426`** — **PRZYJMUJĘ**: dwa hunki. `@@ -419 +424,0` (usunięcie cache) = PERF (§4b, `424`, +0/−1). `@@ -421,24 +426` (`cityHasWaterAccess` → `hasFreshwaterAccess`, zmiana reguły: jezioro daje słodką wodę) = LOGIKA (§4, `426`, +1/−24), zależność `map/freshwater.ts` (§8 pkt 8, §6a G14).
- **`turn-economy.ts:105`** — **PRZYJMUJĘ**: hunk to rename importu `converterThroughputForEra` → `converterThroughputsForEra` = PERF (§4b, +1/−1). Pięć reguł przypisanych do niego w r1 było błędem atrybucji; przypisane do właściwych hunków: popcap `297–298`, Jezioro/woda `426`, plony wg epoki `572`, `645`, `864`, `1968`, `2508`, konwertery `1462–1480`.
- **Opisy grupowe w §4/§4b (zarzut 2) — PRZYJMUJĘ CZĘŚCIOWO**: wiersze o powtarzającym się opisie (133 wiersze w 29 grupach) dostały w kolumnie opisu fragment konkretnego hunku (pierwszy wiersz z tikietem `R-WEB-…`, w przeciwnym razie pierwsza zmieniona linia kodu; przy wielu hunkach w wierszu: `[+k w wierszu]`). Pełna kontrola każdego hunku słowo po słowie NIE_ZMIERZONO; mapowanie wiersz→hunki sprawdzone: 299/299 wierszy zgadza się z liczbą hunków `-U0` w zakresie linii.
- **ZAŁOŻENIE-7**: zapisy `hexes[…]` w generatorze i wczytywaniu mapy kończą się przed pierwszym wywołaniem cache (`okolica.ts`, `turn-economy.ts`); dowód z komentarzy w kodzie i z grep, bez testu w grze (NIE_ZMIERZONO).

## 5. Wektory i `meta.pin` do regeneracji

Źródło: `git grep` po `rust-port/engine/tests/**/*.json` na `origin/rust-port/parity-v2` (`783c6b766`): pola `pin` i `source`/cytaty `gra/src/game/*.ts`. Stopnie pewności: **PEWNE** = wektor sam cytuje zmieniony plik webu; **PRAWDOPODOBNE** = wnioskowane z nazwy katalogu i modułu (zawartość nie czytana); **NIE_ZMIERZONO** = zależność poza 91 plikami.

**Obserwacja o pinach:** w `meta.pin` występuje 6 różnych etykiet (`edb8fb56` ×40, `91dc998a` ×~50, `23dd158e9` ×~28, `4bbef081d` ×~15, `dc8a3adc` ×4, plus warianty skrócone). Trzy piny z dispatchu nie opisują całości: `edb8fb56` i `91dc998a` są **starsze niż `dc8a3adc`** (potwierdzone `git merge-base --is-ancestor`), więc dla wektorów z tymi pinami (p. §5a: `fixtures`, `p6_8a/8b/8i`, `p6_1c/1d/1e`, `p6_repin_wojna_b`) rzeczywisty dryf jest WIĘKSZY niż zmierzony od `4bbef081d` — patrz §8 poz. 7 i ZAŁOŻENIE-5 w §9.

### 5a. Wektory — regeneracja PEWNA (cytują zmieniony plik)

| Katalog wektorów | Obecny `meta.pin` | Cytowany plik webu (zmieniony) | Powód regeneracji | Temat |
|---|---|---|---|---|
| `fixtures/` (economy) | `91dc998a` ×3 | `economy.ts` | popcap Spichlerz II=12/Akwedukt=20, plony ulepszeń wg epoki | #2 + NOWY-2 |
| `p6_8a_vectors`, `p6_8b_vectors` | `91dc998a` | `production.ts` | Młyn tylko przy rzece (bramka), memo diakrytyków | #2 |
| `p6_8i_vectors` | `23dd158e9`/`91dc998a` | `auto-improvements.ts`, `relief-preserving-improvements.ts` | 5 zmian reguł po pinie (żywność tylko obywatele, las przy rzece, droga MST, HILLS-REVERT, usunięty limit sztuk) | #3 |
| `p6_1c_vectors` | `edb8fb56` | `cities.ts`, `cluster-start.ts`, `terrain-improvements.ts` | usunięte pola ulepszeń miasta, nazwy globalne, skalowanie epoką | #3 / NOWY-2 / NOWY-6 |
| `p6_1d_vectors`, `p6_1e_vectors` | `edb8fb56` | `city-names-pool.ts`, `civ-names.ts`, `production.ts` | nazwa miasta zużyta na zawsze | NOWY-6 |
| `p6_23_vectors` | brak `pin` w meta | `city-hex-movement.ts`, `fort-territory.ts`, `terrain-improvements.ts` | przejście przez własne jednostki, reguły placówek | NOWY-1 / #7 |
| `p6_repin_wojna_2_vectors` | `dc8a3adc` | `generals.ts` | `canSpawnQueuedGeneral` | #6 |
| `p6_repin_wojna_2_r3_vectors` | brak/`dc8a3adc` | `planned-march.ts` (+ `main.ts:29052…`) | marsz tylko na koniec tury + tranzyt | NOWY-1 |
| `p6_repin_wojna_b_vectors` | `91dc998a` | `ai-general-war-campaign.ts` | nowe pola `reserveGeneralId`/`reserveGatherTurns` | #6 / #8 |
| `p6_repin_wojna_d_vectors` | brak | `warAllInCapital.ts` | MOVE-FULL-RANGE, tranzyt | #6 / NOWY-1 |

### 5b. Wektory — regeneracja PRAWDOPODOBNA (nazwa/moduł; zawartość nie czytana)

| Katalogi | `meta.pin` | Moduł webu, który je dotyka | Temat |
|---|---|---|---|
| `p6_empirefood_vectors`, `p6_econ_post_vectors`, `p6_turn_econ_res_vectors`, `p6_adv_city_econ_vectors`, `p6_adv_q2a…q6_vectors`, `p6_repin_ekonomia_e_vectors`, `p6_repin_d_economy_vectors`, `p6_8c/8g/8h/8j_vectors` | `4bbef081d` / `23dd158e9` / `91dc998a` | `empire-food.ts` (cap żywności Magazynu 100→0), `economy-upkeep.ts` (Magazyn +20%), `converters.ts`, `citizen-resource-upkeep.ts` (m(e)), `population-growth-v85.ts`, `turn-economy.ts` | #2 + NOWY-2 |
| `p6_repin_d2_*_vectors` (head/tail/full/imp), `p6_repin_b/b2/b3_vectors`, `p6_repin_teren_vectors` | `91dc998a`/`4bbef081d` | `okolica.ts`, `terrain-improvements.ts`, `auto-improvements.ts` | #3 / NOWY-2 |
| `p6_trade_pin_vectors` | `23dd158e9` | `trade-routes.ts` | NOWY-3 |
| `p6_heal_maxhp_vectors`, `p6_state_src_vectors`, `p6_order_lane_vectors`, `p6_repin4_vectors` | `23dd158e9` | `armyMerge.ts` (heal), `cities.ts`, `planned-march.ts` | #7 / NOWY-1 |
| `p6_dyplomacja_profil_wojny_pokoju_vectors`, `p6_dyplomacja_truce_aggressor_vectors` | `23dd158e9`/`4bbef081d` | `diplomacy.ts`, `diplomacy-locks.ts`, `diplomacy-proposals.ts` (NAP/Zaufanie ≥ 30) | #4 |
| `p6_repin_wojna_a/c/3_vectors` | `91dc998a`/`dc8a3adc`/`4bbef081d` | `ai.ts`, `warAllInCapital.ts`, `barbarians.ts` | #6 / #7 |

### 5c. Bez regeneracji lub NIE_ZMIERZONO

- `p6_4_vectors`, `p6_5a_vectors`, `p6_5b_vectors` (`edb8fb56`/`91dc998a`): jednostki/ruch/życie — web zmienił tylko tranzyt przez własne jednostki (NOWY-1); regeneracja tylko jeśli wektory ruchu zawierają heksy z własnymi jednostkami → NIE_ZMIERZONO.
- `p6_m*_vectors` (mapgen, `edb8fb56`/`4bbef081d`): źródła w `gra/src/map/*` (13 plików, +952/−105) — **poza zakresem 91 plików** → NIE_ZMIERZONO. W 91 plikach tylko `map-gen-params.json` (`capital_sep_short_side_coef`) wpływa na mapgen (NOWY-6).
- `derived/*.json` w `rust-port/engine/data`: pochodne stałych TS (np. `building-cost-params`, `city-hex-clear-rules`, `manpower-params`) — które wymagają odświeżenia po zmianach `converters.ts`/`economy-upkeep.ts`/`manpower.ts` → NIE_ZMIERZONO (wymaga odczytu generatora, poza zakresem pomiaru).

### 5d. Kopie danych `rust-port/engine/data` (14 plików `gra/data`)

Zmiany **łamiące kształt** (loader P3/walidator muszą się dostosować, nie tylko wartości):
- `econ-params.json`: klucz `magazyn_bonus_surowce_na_budynek` zastąpiony `magazyn_bonus_surowce_proc_na_budynek` (0,2); nowy `spichlerz_ii_prog_ludnosci`; **usunięte** `ai_rush_jednostka_rezerwa_zlota` i `ai_rush_jednostka_max_na_ture` (zastąpione `kupno_jednostki_*` w `ai-params.json`).
- `citizen-resource-upkeep.json`: usunięte `stawkaNaObywatela` w wierszach epok (stawka = 1,0 × m(e) w kodzie).
- Nowy plik `war-weariness-params.json` (potrzebny nowy loader) i nowy `civ-music.json` (tylko UI/asset).
- Zmiany tylko wartości: `buildings.json` (Emporion + Spichlerz Królewski), `tech.json`, `combat-params.json` (Milicja), `diplomacy.json` (`progNapZaufanie`), `miasto-params.json`, `map-gen-params.json`, `war-rules-params.json` (`enabledForcedWarEras`), `ui-params.json`, `ai-params.json`, `resources.json` (tekst).

## 6. FALA 509–544 a §0b planu — pokrycie

Źródło numerów FALA: `git log 4bbef081d..origin/main` (tematy w komunikatach). Kolumna „§0b" to osąd Operatora na podstawie tekstu `PLAN-PORT-RUST-TAURI-20261020.md` §0b (TAK = reguła wymieniona z nazwy/numeru; CZĘŚĆ = wymieniona ogólnie; NIE = brak odpowiednika).

| FALA | Zmiana (komunikat) | §0b | Uwagi |
|---|---|---|---|
| 509 | panel rekrutacji + Spichlerz Królewski (Pismo) | TAK | rekrutacja = UI (NOWY-7), Spichlerz = #2 |
| 510 | zwiadowca nie lider armii | TAK | `stack-leader.ts` → #6 |
| 511 | oblężenie: zapasy + głód garnizonu | TAK | #7 |
| 512 | cegła ×2, Cegielnia +50%/epokę | TAK | #2 |
| 513 | Magazyn nie zwiększa pojemności żywności | TAK | `empire-food.ts` default 100→0 |
| 514 | NAP wymaga Zaufania 30 | TAK | #4 |
| 515 | automatyzacja budowy OFF + próg NAP w UI | TAK | `auto-build-gate.ts`, `ui-params.json`; pole zapisu → #8 |
| 516 | Emporion + przyspieszenie późnej gry | CZĘŚĆ | w §0b jako „Emporion (516)" bez budynku/danych/slotu trasy → NOWY-3 |
| 517 | odlewnie ×2 cykle + m(e) | TAK | #2 |
| 518 | powiadomienia: zakładki | TAK (UI) | poza P6 |
| 519 | baner: większe liczby | TAK (UI) | poza P6 |
| 520 | zmęczenie wojną + karencja po pokoju | TAK | #4, nowy plik `war-weariness-params.json` |
| 521 | drogi AI tylko między miastami | TAK | `road-network-plan.ts` → #3 |
| 522–532 | perf/pamięć/minimapa/MEMSTATIC | TAK (bez wpływu) | w 91 plikach: `okolica.ts`, `turn-economy.ts`, `frame-memo.ts`, `trade-routes.ts:1916`, `production.ts:681` = PERF |
| 533 | wodzowie: limit epoki, kolejka przy zdobyciu + migracja | TAK | `generals.ts`; migracja → #8 (w tym diffie 0 hunków zapisu — logika migracji w `save*.ts`/`main.ts` poza zakresem) |
| 534, 537 | układ banera HUD A / panele pod banerem | TAK (UI) | poza P6 |
| 535 | bitwa: jednostki spoza limitu 120 nie giną | TAK | `post-battle-map.ts` → #7 |
| 536 | wojny epoki Brąz/Żelazo | TAK | `war-rules-params.json`; **wymaga #4, a nie #5** (flaga danych, bez `forced-war-*`) |
| 538 | limit bitwy 120→500 | TAK | w 91 plikach tylko pośrednio; `battle/*` poza zakresem → NIE_ZMIERZONO |
| 539 | muzyka cywilizacji | TAK (UI) | `civ-music.json` |
| 540 | limit armii 500 | TAK | `army-stack-limit.ts`, `villageRewards.ts` → #7 |
| 541, 543 | cud przechodzi na zdobywcę / nie na rebeliantów | TAK | `wonder-transfer.ts` → #7; `civ-test-hooks`, `capital-capture.ts` |
| 542 | wojny epoki: stare zapisy (`playerEpochWarEnabled` brak = true) | TAK | w 91 plikach brak hunku — migracja poza zakresem → #8, NIE_ZMIERZONO |
| 544 | AI: rezerwa utrzymania przy zakupie (Normal 10 tur) | CZĘŚĆ | w §0b tylko „AI-RESERVE/AIN10 (w toku)"; wdrożone: nowe `kupno_jednostki_*`, usunięte `ai_rush_*` → NOWY-4 |

**Weryfikacja kolumny „§0b” (zarzut R1 pkt 4, r2):** porównano z `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` §0b (linie 79–93: tabela P6.8–P6.22 i akapit „zmiany bez wpływu na logikę Rust”). Zgodne z planem: 509, 511, 512, 513, 514, 515, 517, 518, 519, 520, 521, 533, 534, 535, 536, 537, 538, 539, 540, 541/543, 542; CZĘŚĆ potwierdzone: 516 (Emporion wymieniony bez danych), 544 („AI-RESERVE/AIN10 w toku w webie”). **Niespójność planu:** linia 93 wymienia FALA 510 jako „bez wpływu na logikę Rust”, a P6.11 (linia 84) — „zwiadowca nie lider (510)”. §6 przyjmuje TAK (zwiadowca = logika); rozstrzyga orkiestrator.

### 6a. Zmiany webu w 91 plikach BEZ odpowiednika w §0b (luki planu)

| ID luki | Reguła webu (plik:linie) | Dlaczego luka | Propozycja |
|---|---|---|---|
| G1 | `IMPROVEMENT-ERA-SCALING` — plony ulepszeń ×1,5 za epokę właściciela: `terrain-improvements.ts:125-170`, `okolica.ts:459-826`, `economy.ts:283,468`, `turn-economy.ts:572-2541` (49 hunków) | w §0b nieobecne; wpływa na każdy bilans miasta i ranking pól | NOWY-2 (przed #2 lub razem z nim) |
| G2 | Milicja 1 jednostka/mieszkańca, odnowa 5 tur, utrata ludności przy zdobyciu: `siegeDefenders.ts:49-402`, `siege.ts:153`, `cities.ts:867-1141`, `combat-params.json:51`, `miasto-params.json:143` | §0b nie wymienia Milicji | włączyć do #7 (rozszerzyć allowlistę o `siege_defenders`/`cities`) |
| G3 | Palisada/mur/wieże strzeleckie/wyłom: `city-fortification.ts`, `city-towers.ts`, `city-defense.ts`, `barbarians.ts:399-416`, `miasto-params.json:99` | §0b: tylko „wieża oblężnicza = wyłom" | #7 |
| G4 | Lokalizacja miast AI: unikanie Polarnych, fallback, waga plonu heksu: `ai.ts:1369-1427,5484-5603`, `ai-difficulty-bonus.ts:204-217`, `ai-params.json:412` | brak w §0b | NOWY-4 |
| G5 | Rezerwa utrzymania zakupu AI i usunięcie `ai_rush_*`: `ai.ts:7182-7195`, `ai-params.json:691`, `econ-params.json:647` | tylko „w toku" | NOWY-4 |
| G6 | `capital_sep_short_side_coef` (min. dystans stolic): `map-gen-params.json:97` | §0b: „wpływ map-gen-params.json" bez treści | NOWY-6 (mapgen) |
| G7 | `ELIMINATION-FULL-SPOILS` (żywność Spichlerza, surowce magazynu, techy): `capital-capture.ts:145-428` | §0b: tylko ANNEX | #7 |
| G8 | Reguły placówek/fortów (`isOutpostPlacementAllowed`) i widoczność fortów: `fort-territory.ts:70,382` (hunk 70; definicja `isOutpostPlacementAllowed` w linii 79), `ai.ts:2972-3034`, `visibility.ts:271-303` | §0b: tylko widoczność | #7 + NOWY-1 |
| G9 | Przejście przez własne jednostki (`MOVE-PASS-THROUGH-OWN-UNITS`): 11 plików (`planned-march.ts`, `ai.ts`, `warAllInCapital.ts`, `scout-auto-explore.ts`, `barbarians.ts`, `city-hex-movement.ts`, `ai-city-capture-executor.ts` …), rdzeń w `gra/src/units/setup.ts` (POZA zakresem) | §0b nie wymienia | NOWY-1 |
| G10 | Złoże konia w starych zapisach (`hexHasHorseDeposit`, `zloze`): `terrain-improvements.ts:394–425` (definicja `hexHasHorseDeposit` w linii 399), `livestock-unlock.ts` | brak | #3 / NOWY-2 |
| G11 | Stawki zużycia obywateli per epoka teraz w kodzie (m(e)), usunięte z JSON: `citizen-resource-upkeep.ts:181-190` | §0b ma m(e), ale nie zmianę kształtu danych | #2 (dane) |
| G12 | Zdarzenia: `event-lifetime.ts`, `event-defer-queue.ts` | §0b ma, ale bez tematu w kolejce | NOWY-5 |
| G13 | `meta` zapisu: nowe pola miasta/kampanii (`cities.ts:867-972`, `ai-general-war-campaign.ts:164-194`) | #8 wymienia inne pola | #8 uzupełnić |
| G14 | `gra/src/map/freshwater.ts` (NOWY po pinie, +172, POZA zakresem 91 plików): `hasFreshwaterAccess`, `hasRiverWaterAccess`, `isFreshwaterReservedHex` (jezioro = słodka woda, morze NIE). Zależności: `turn-economy.ts:48,426,532`, `auto-improvements.ts:39,1404–1412,1949–1974` | §0b P6.8 wymienia „dostęp do wody = słodka woda lądowa”, bez pliku i bez treści | #2 (dostęp do wody) i #3 (rezerwa tartaku/obozu); dodać `gra/src/map/freshwater.ts` do allowlisty REPIN #2/#3 i do pomiaru REPIN-DELTA-5B |

## 7. Tematy z kolejki §0c i propozycje nowych

Rozkład hunków (L+D+UI) na temat: patrz §2. Rekomendacje:

| Temat | Stan po pomiarze | Rekomendacja |
|---|---|---|
| #2 EKONOMIA-F | 88 hunków (55L/18D). Pliki z allowlisty planu pokrywają dane i `converters`, `economy-upkeep`, `citizen-*`, `population-growth-*`, `empire-food` | bez zmian; dodać `economy.ts`, `turn-economy.ts` (popcap, konwertery) i kopie `rust-port/engine/data/` z §5d; wcześniej/razem NOWY-2 |
| #3 AUTOIMPROVE | 97 hunków L (w tym `ai.ts` 2744-2895, `road-network-plan.ts`, `auto-build-gate.ts`, `relief-preserving-improvements.ts`) | bez zmian; uwzględnić usunięcie `maxItemsPerCity`/`onlyWorked` (zmiana kontraktu API pickera) i migrację pól miasta (#8) |
| #4 DYPLOMACJA-MULTIWAR | 33 hunki; `war-rules-params.json` (era), NAP Zaufanie, `war-weariness.ts` (302 linie), `diplomacy-ai-forced-peace.ts` (331), `diplomacy-siege-war-gate.ts` | bez zmian; **#4 powinno objąć też forced peace AI↔AI** (dziś w planie tylko „wymuszony pokój AI" jako hasło) |
| #5 WOJNY-WYMUSZONE | **0 hunków** w tym diffie (`forced-war-*.ts` bez zmian od pinu) | zakres bez dryfu; dryf jest tylko przez flagę `enabledForcedWarEras` (→ #4) |
| #6 AI-ARMIA | 56 hunków L, ≈2 060 nowych linii (`ai-war-home-defense.ts` 405, `army-concentration.ts` +427, `ai-march-guard.ts` 198, `ai-war-target-select.ts` 68, `ai.ts` +966) | **najwyższe ryzyko**; zalecany podział A (zbiórka + wódz rezerwowy) / B (defend-home + straż marszu) |
| #7 OBLĘŻENIE-ZDOBYCZE | 57 hunków; siedem plików `siege*` (≈900 nowych linii), Milicja (G2), fortyfikacje (G3), spoils (G7) | **allowlista za wąska** — dodać `cities`, `capital-capture`, `barbarians`, `wonder`, milicję; rozważyć podział na #7A oblężenie / #7B zdobycze+cud |
| #8 ZAPIS-MIGRACJE | 0 hunków w `save*.ts` (nie zmieniono w 91 plikach); pola zapisu wynikają z `cities.ts`, `ai-general-war-campaign.ts` | zakres z planu uzupełnić o G13; część migracji (`playerEpochWarEnabled`, nadmiar wodzów) leży w `main.ts` → NIE_ZMIERZONO |
| NOWY-1 `R-RUSTPORT-REPIN-MARSZ-PRZEJSCIE-Q1` | 32 hunki w 11 plikach + `units/setup.ts` | nowy; zależność od `gra/src/units/setup.ts` (NIE_ZMIERZONO) wymaga rozszerzenia pomiaru |
| NOWY-2 `R-RUSTPORT-REPIN-ULEPSZENIA-EPOKA-Q1` | 49 hunków | nowy, przed #2/#3 |
| NOWY-3 `R-RUSTPORT-REPIN-HANDEL-EMPORION-Q1` | 27 hunków (`trade-routes.ts` +203/−103, `diplomacy-penalty-preview.ts`, Emporion w danych) | nowy (plan P6.15 bez tematu w kolejce) |
| NOWY-4 `R-RUSTPORT-REPIN-AI-EKSPANSJA-ZAKUP-Q1` | 17 hunków | nowy, mały |
| NOWY-5 `R-RUSTPORT-REPIN-ZDARZENIA-TURA-Q1` | 6 hunków (dwa nowe moduły 155 linii) | można dołączyć do pierwszego tematu pętli tury (P6.9-10) |
| NOWY-6 `R-RUSTPORT-REPIN-NAZWY-STOLICE-Q1` | 7 hunków | mały, łączyć z mapgen REPIN |
| NOWY-7 `UI-KONTROLER-V2-HOOKI` | 9 hunków UI | do REPIN-UI-4 / P7, nie P6 |

## 8. NIE_ZMIERZONO (luki pomiaru z powodem)

1. **76 plików poza zakresem** (`main.ts` +2 815/−448 — orkiestracja tury i migracje; `battle/*` 4 pliki +898/−96; `map/*` 13 plików +952/−105; `units/setup.ts` +168/−25; `ui/*` 27 plików; `render/*` 12; `audio/*` 15; `types/*`, `data/*`). Powód: dispatch ogranicza zakres do `gra/src/game` + `gra/data`. Wpływ: część reguł (limit bitwy 500, migracje zapisów, tranzyt przez własne jednostki, kolejność marszów na koniec tury) jest zaimplementowana w tych plikach; zalecany **REPIN-DELTA-5B** (pomiar `main.ts`, `battle/*`, `map/*`, `units/setup.ts`).
2. **Moduły Rust odpowiadające** podane są wg nazw w `rust-port/engine/src/domain/*.rs` (`parity-v2` `783c6b766`); nie uruchamiano `cargo` (zakaz) i nie czytano ciał funkcji w Rust, więc „istnieje moduł" ≠ „moduł zgodny z `4bbef081d`".
3. **Zawartość wektorów** z §5b — wniosek z nazw katalogów, nie z odczytu JSON.
4. **Test zachowania** — brak uruchomienia webu/testów; klasyfikacja LOGIKA/UI/PERF wynika z diffu i komentarzy ticketów `R-WEB-…`. Hunki ze zmiennymi sygnaturami (np. `okolica.ts` `HexFilter`, `turn-economy.ts` `ownerEra`) zaklasyfikowano jako LOGIKA tylko tam, gdzie parametr zmienia wynik rankingu/bilansu (NOWY-2); reszta = PERF.
5. **Numery FALA ↔ pliki** — przypisanie reguły do FALA wynika z tagów `R-WEB-…` w komentarzach i z `git log`, nie z `WERSJE.md` (zakaz modyfikacji; nie czytano w całości).
6. **Pin `23dd158e9`** — nie jest przodkiem `4bbef081d`; różnica `23dd158e9..4bbef081d` w zakresie to 9 plików (`ai-params.json`, `map-gen-params.json`, `ai-difficulty-bonus.ts`, `ai.ts`, `auto-improvements.ts`, `civ-test-hooks.ts`, `fort-territory.ts`, `turn-economy.ts`, `visibility.ts`). Dla modułów Rust przypiętych do `23dd158e9` (`slodka woda`, `dyplomacja-profil`, według planu §0) dryf rzeczywisty = dryf z tego raportu **plus** powyższe 9 plików; część tych zmian leży już w pomiarze (te same pliki), ale rozbicie hunków na „przed/po `4bbef081d`" NIE_ZMIERZONO.

7. **Piny starsze niż `4bbef081d`**: `edb8fb56` i `91dc998a` są przodkami `dc8a3adc` (a ten `4bbef081d`). Moduły/wektory z tymi pinami (m.in. `p6_8a/8b/8c/8g/8h/8j`, `p6_1c/1d/1e`, `fixtures`, `p6_repin_b/b2/b3/d2*`, `p6_repin_wojna_a/b/c`) mają dryf = raport + `pin..4bbef081d` — NIE_ZMIERZONO (poza komendą z dispatchu). Zalecany dodatkowy pomiar `git diff 91dc998a 4bbef081d -- gra/src/game gra/data --numstat` jako REPIN-DELTA-5C.

8. **`gra/src/map/freshwater.ts`** (+172/−0, nowy po pinie `4bbef081d`, poza zakresem 91 plików `gra/src/game` + `gra/data`): zależność hunków `turn-economy.ts:426` (LOGIKA, FRESHWATER-ACCESS-LAKE) i `auto-improvements.ts` (rezerwa tartaku/obozu). W r2 odczytano wyłącznie listę eksportów (`grep '^export function'`: `getRiverPathHexSet`, `getLakeHexSet`, `isLakeHex`, `isLakeAdjacent`, `hasRiverWaterAccess`, `hasFreshwaterAccess`, `isFreshwaterReservedHex`, `invalidateFreshwaterCache`); pełna treść, wektory i zgodność z Rust = NIE_ZMIERZONO. Dryf logiki wody jest więc większy niż 626 hunków pokazuje.

## 9. Założenia i odtwarzalność

- ZAŁOŻENIE-5: pin `dc8a3adc` jest przodkiem `4bbef081d`, więc dla modułów pinowanych do `dc8a3adc` dryf = dryf z raportu + różnica `dc8a3adc..4bbef081d` (NIE_ZMIERZONO; nie wchodziło w zakres „od `4bbef081d`").
- ZAŁOŻENIE-6: nazwy NOWY-1…7 i granice podziału #6/#7 są **propozycjami Operatora** do decyzji orkiestratora; nie zmieniają kolejki §0c.
- Komendy odtwarzające: `git fetch origin main rust-port/parity-v2`; `git diff --name-only 4bbef081d origin/main -- gra/src/game gra/data | wc -l` (=91); `git diff --numstat 4bbef081d origin/main -- gra/src/game gra/data`; `git diff -U0 4bbef081d origin/main -- gra/src/game gra/data | grep -c '^@@'` (=626).
- Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`, `WERSJE.md`; bez `cargo`, `npm`, budowania; brak pushu/deployu.
