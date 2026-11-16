# AUDYT PARYTETU: co jest wpięte w produkcję, a co tylko wektory (#302)

**Temat:** R-RUSTPORT-P6-AUDYT-PARYTET-3a8f068f6-Q1 (runda 1), Operator (HAIKU). Tylko odczyt i ten dokument, bez kodu, bez cargo, bez push do `parity`.
**Baza:** `origin/rust-port/parity-v2` = `9a71caf8a` (Integracja FC 1F3 SIEGE-WONDER-VIEW (25fdeb11a) na parity-v2 3a8f068f6). Worktree odłączony (detached) na `9a71caf8a`.
**Pin:** `07d2fbd72` (`gra/src/**`, tylko odczyt). Numery `main.ts` podane poniżej pochodzą z nagłówków modułów Rust i NIE są weryfikowane względem `gra/src` w tym audycie.
**Dispatch:** plik `00-dispatch.md` istnieje na gałęzi `origin/claude/rust-sivvrn` (nie w worktree na `parity`); treść odczytana w całości.

```text
STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-AUDYT-PARYTET-3a8f068f6-Q1
GOAL: stan wpięcia modułów Rust (engine/domain, view-model, renderer) względem wołających produkcyjnych, lista wektorów bez wpięcia, 5 największych luk, kolejność wpięć
ZMIANY/COMMIT: dyspozycje/rust-port/p6/AUDYT-PARYTET-9a71caf8a.md (NOWY); brak zmian kodu
TESTY: NIE_DOTYCZY (cargo zabronione dispatchem); analiza statyczna (skrypt nad drzewem 9a71caf8a) + ręczne git grep dla pozycji kluczowych
BLOKADY: brak; ograniczenia metody w §6
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje kolejność wpięć z §5; pytania ABC (§5, pozycja 6) tylko po jego decyzji
DEPLOY/PUSH: NIE WYKONANO
```

## 0. Werdykt w skrócie

- Z 206 modułów `engine/src/domain/` (bez `mod.rs`): **82** mają wołającego produkcyjnego i są osiągalne z `bridge.rs` (punkt wejścia Tauri, `src-tauri/src/lib.rs` włącza `bridge.rs` przez `#[path]`); **80** ma wołających wyłącznie z nieosiągalnego kodu; **44** nie ma żadnego wołającego produkcyjnego (tylko testy).
- Najważniejsza luka: tura produkcyjna (`PlayableGame::advance_turn`, `playable.rs:1400`) wywołuje **wyłącznie** `run_war_turn` (`playable.rs:1491`). Ekonomia, wzrost miast, eliminacja, zdobycie miasta, pętla oblężnicza, walka dystansu i zwarcia, dyplomacja gracza oraz AI-AI nie są wołane z produkcji.
- Cały klaster oblężenia `siege_tactics_*` (K1–K5, ok. 35 modułów) jest nieosiągalny z `bridge.rs`. Enum `EngineCommand` w `bridge.rs` nie ma komendy ataku ani oblężenia, a `DeclareWar` jest odrzucany (`bridge.rs:309–313`).
- Warstwa DTO widoków P4 (`city_view`, `map_view`, `overlays_view`) nie ma wołającego. Renderer (`rust-port/renderer/Cargo.toml`) zależy tylko od `civ-view-model`, nie od `civ-engine`, więc żaden DTO z silnika nie trafia do renderera.
- Wektory i moduły z lat P3–P4 (`brake_power_*`, `turn_war_*` z W8 r3–r6, `credibility` z CRED-WOJNA, `playable_movement` z MOVE, `auto_improvements`) są wpięte w osiągalną ścieżkę.

## 1. Metoda i definicja „wołającego produkcyjnego”

- Zakres: `rust-port/engine/src/**` (w tym `domain/**`, `data/**`, `bridge.rs`), `rust-port/view-model/src`, `rust-port/renderer/src`, `src-tauri/src`. Pliki `tests/`, `benches/` i bloki `#[cfg(test)]` wykluczone. Uwzględniono zależności między crate'ami (engine→view-model, renderer→view-model, src-tauri→engine); dopasowania przecinające granice crate'ów odrzucono.
- Jednostka = pierwszy segment pod `domain/` (plik lub katalog, np. `mapgen/`). Elementy publiczne: `pub` na poziomie 0 (fn, struct, enum, const, static, type, trait) oraz elementy wewnątrz wbudowanych `pub mod x { … }`, które wymagają obecności członu ścieżki (`x::`).
- Wołający produkcyjny = plik spoza jednostki, który zawiera nazwę elementu w kodzie (nie w `use`/`pub use`/`mod`). Funkcje w małej literze liczą się tylko jako wywołanie (`nazwa(`, `nazwa<`, `::nazwa`), co eliminuje kolizje ze zmiennymi. Nazwy zdefiniowane w wielu jednostkach wymagają członu ścieżki jednostki w pliku wołającym.
- Osiągalność: graf wołających po nazwach, start od `engine::bridge` (jedyny punkt wejścia kompilowany do aplikacji).
- Ręczna weryfikacja (`git grep` na `9a71caf8a`) dla: `eliminate_owner`, `apply_dipl_deltas_to_state`, `apply_transfer_with_effects`, `run_capital_capture_plunder`, `declare_war_by_player`, `run_ai_ai_peace_turn`, `forced_war_step`, `plan_war_march`, `plan_ai_turn`, `run_economy_tick_for_game`, `run_post_central_growth`, `apply_praca_upkeep_post`, `execute_units_immediate`, `resolve_combat`, `resolve`, `city_views`, `build_map_view`, `build_highlight`, `okolica_view`, `path_route_overlay`, `load_save_snapshot`, `ReplayLog`. Wszystkie potwierdzone: brak wołającego produkcyjnego poza modułem własnym lub komentarzem.

**Ograniczenia metody** (szczegóły §6): wywołania metod przez odbiorcę (`x.metoda()`) bez nazwy typu nie są wykrywane; „osiągalny” oznacza, że jednostka zawiera element wołany z osiągalnego kodu, a nie że cała jednostka jest wpięta.

## 2. Wynik per moduł (Q1)

Legenda: „wołający produkcyjny” = liczba i przykłady plików wołających poza testami; „osiągalny z bridge” = graf statyczny od `engine::bridge`; „pliki testowe” = przybliżona liczba plików testowych, które zawierają nazwę elementu (pole informacyjne).

Podsumowanie: osiągalne 82 · wołane tylko z nieosiągalnego kodu 80 · bez wołającego produkcyjnego 44 (razem 206).

Poza `domain/`: `view-model` (9 jednostek): 3 osiągalne z bridge (`ids`, `map`, `overlays`), 5 wołanych wyłącznie z nieosiągalnego kodu (`battle`, `owners`, `root`, `units`, `validate`), 1 bez wołającego (`lib`, sam eksport). `renderer` (21 jednostek): 15 wołanych w obrębie renderera, 2 tylko testy, 4 bez wołającego (w tym scaffold `lib`); renderer nie ma wołającego spoza crate'u, bo nie zależy od `civ-engine`. `engine/src` poza domeną: `bridge` i `data` osiągalne; `steam_adapter` (krok parytetu Steam, bez wołającego produkcyjnego), `version` (`SCHEMA_VERSION`) i `logging` bez wołającego (`logging` i `lib` to korzenie/eksport).

## 3. Wektory i zadania bez wpięcia (Q2)

Zestawienie zadań ukończonych z pozycji #96–#300, których kod leży w module bez wołającego produkcyjnego albo w klastrze nieosiągalnym. Zadania bez kodu w `domain/` (procesowe, renderer, dokumentacyjne) pominięto; oznaczono `NIE_ZMIERZONO` tam, gdzie mapowanie nazwy zadania na moduł jest niepewne.

| Zadanie (ukończone) | Moduł / funkcja (pin Rust, `9a71caf8a`) | Wołający produkcyjny | Stan |
|---|---|---|---|
| #28, #29, #33, #37, #40, #43 (SIEGE-TRANSFER Q2–Q8) | `siege_transfer`, `siege_transfer_effects`, `siege_transfer_q5`, `siege_capital_plunder::run_capital_capture_plunder` (`:504`), `siege_wonder_watch`, `siege_wonder_wrappers` | brak; wołane tylko z nieosiągalnego `siege_transfer`/`siege_surrender` | NIEPODPIĘTE |
| #141 (ELIMINACJA-GRACZA-DEALS-WOJNY-Q2) | `eliminacja::eliminate_owner` (`:48`) | brak (testy) | NIEPODPIĘTE; #114 in_progress |
| #175 (ZDOBYCIE-MIASTA-ROZPOZNANIE) | `siege_transfer::apply_transfer_with_effects` (`:340`) | brak poza `siege_transfer` (nieosiągalny) | NIEPODPIĘTE; #115 pending |
| #171 (CRED-HAK-WYPOWIEDZENIE-IMPL) | `diplomacy_player_war::declare_war_by_player` (`:311`) | brak; `bridge.rs:309–313` odrzuca `DeclareWar` | NIEPODPIĘTE; #120 pending |
| #89, #90 (R7K7-B/C) | `turn_war_dipl_steps::apply_dipl_deltas_to_state` (`:1034`) | brak; `advance_turn` tego nie woła | moduł wpięty, funkcja NIEPODPIĘTA; #106 pending |
| #4 (W7 SIEGE-AIAI-TURN), #26 (migracja AiPeace V1→V2 w `war_turn_ai_ai.rs`) | `war_turn_ai_ai::run_ai_ai_peace_turn` (`:84`), `diplomacy_ai_forced_peace` (komentarz: wołanie przeniesione do `war_turn_ai_ai`) | brak; moduł `war_turn_ai_ai` bez wołającego | ROZBIEŻNOŚĆ do wyjaśnienia: opis zadania mówi o usunięciu obejścia w `war_turn_ai_ai.rs`, a produkcja nie wywołuje tego modułu |
| #13 (ReplayLog: `load_json_with_migration_reports` jako jedyna ścieżka produkcyjna) | `replay` (`ReplayLog`), `zapis_loader::load_save_snapshot` (`:43`) | brak (testy) | ROZBIEŻNOŚĆ: opis mówi o ścieżce produkcyjnej, kod jej nie ma; `bridge.rs` nie ma komendy wczytania |
| #96, #98, #99, #150 (K5-LOOP-WIEZE/WYLOM/RESUME) | `siege_tactics_tower`, `siege_tactics_breach`, `siege_tactics_fastforward` | tylko klaster nieosiągalny | NIEPODPIĘTE; #113 pending |
| #102 (K5I2B2-DLUG) | `siege_tactics_blow_env`, `siege_tactics_blow_full`, `siege_tactics_inputs_terrain` | tylko klaster nieosiągalny | NIEPODPIĘTE |
| #108, #112 (K5LOOP-KONTRATAK, DOCTRINA-STRZELEC) | `siege_tactics_loop::ProdBody` (`:1092`), `siege_tactics_doctrine_target` | tylko klaster nieosiągalny | NIEPODPIĘTE; #107/#109 pending |
| #44, #47, #48, #51, #52, #55, #65–#75, #79–#84, #92 (K1–K5 łańcuch oblężenia) | `siege_tactics_actions`, `_activate`, `_approach`, `_classify`, `_clock`, `_endcheck`, `_turnseq`, `_unit`, `_walk`, `siege_tactics_loop::SiegeLoop` (`:490`) | brak osiągalnego wołającego (cały klaster) | NIEPODPIĘTE; #113 pending |
| #136 (COMBAT-RESOLVE-PETLA), #101 (RANGED-DAMAGE-CLEANUP) | `combat::resolve` (`:381`), `combat::resolve_combat` (`:321`) | brak; `playable.rs:771` sam to stwierdza | NIEPODPIĘTE (helpery `combat` są używane: `counter_multiplier`, `effective_strength`) |
| #244, #245, #246, #247 (BATTLE-OUTCOME/INSTANT/FRAME/ACTIONS) | `siege_tactics_outcome`, `siege_tactics_instant`, `siege_tactics_frame`, `siege_tactics_actions` | brak; `bridge.rs` nie zwraca zdarzeń bitwy | NIEPODPIĘTE |
| #211 (MAP-VIEW-PRODUCER) | `map_view::build_map_view` (`:286`) | brak | NIEPODPIĘTE |
| #214 (CITY-VIEW) | `city_view::city_views` (`:578`) | brak | NIEPODPIĘTE |
| #238, #241, #242, #243 (OVERLAY-TYPES, TRADE-WORKERS-OKOLICA, REACH-PATH-VIEW, BUILD-SELECTION-VIEW) | `overlays_view::build_highlight` (`:223`), `path_route_overlay` (`:449`), `okolica_view` (`:631`) | brak | NIEPODPIĘTE; renderer bez zależności od silnika |
| #213 (UNIT-VIEW, `compute_stack_display`) | brak osobnego modułu `unit_view` w `domain/` | NIE_ZMIERZONO, gdzie leży implementacja | NIE_ZMIERZONO |
| #255, #256, #262 (K5DOC-T0/T2/T3) | `siege_tactics_doctrine_target`, `siege_tactics_doctrine_geometry` | brak / tylko klaster | NIEPODPIĘTE; #263/#264 pending |
| #266 (K5EXEC-T1), #267 (K5EXEC-T2) | `player_order_queue::execute_units_immediate` (`:81`), `player_order_move_gate` | brak (testy) | NIEPODPIĘTE; #268 pending |
| #30–#36, #42, #85, #86 (POWER-*, DLUG-POWER-ULEPSZENIA) | `brake_power`, `brake_power_army`, `brake_power_improvements`, `brake_power_producers`, `brake_power_rest` | wpięte przez `turn_war_inputs` → `turn_war_pipeline` → `playable` | OK (wpięte) |
| #22–#25, #38, #45, #50, #53 (W8 r3–r6) | `turn_war_pipeline`, `turn_war_inputs`, `turn_war_epoch`, `turn_war_dipl_steps` (poza `apply_dipl_deltas`) | `playable.rs:22, 1491` | OK (wpięte) |
| #103 (CRED-WOJNA: `note_war_entered`) | `credibility`, `turn_war_dipl_steps.rs:892` | wpięte | OK |
| #250–#252 (MAP-COMMANDS, MOVE) | `playable_movement` | `bridge.rs` `MoveUnit` → `playable` | OK (wpięte) |
| #95 (STAN-ULEPSZENIA) | `auto_improvements` | wpięte | OK |
| #110, #142 (JS-MAX-SIGN) | `siege_tactics_blow::js_max`, `js_round` | używane przez `okolica` i `unit_power` (helpery) | CZĘŚCIOWO: wpięte tylko helpery, silnik bloku nie |
| #131–#134, #144, #166, #231 (COMBAT-HARNESS) | `combat` (testy wektorów) | tylko testy dla fazy zwarcia | WEKTORY BEZ WPIĘCIA (zgodnie z przeznaczeniem) |

Liczba zadań z pozycji #96–#300 oznaczonych jako ukończone, mapujących się na moduły bez wołającego osiągalnego: ok. 45 pozycji (liczenie orientacyjne po grupowaniu w tabeli; NIE_ZMIERZONO dokładnie).

## 4. Pięć największych luk (Q3) i co trzeba wpiąć

Kolejność wg wpływu na rozgrywkę. Numery linii dotyczą `9a71caf8a` (plik Rust); cytowane numery `main.ts` pochodzą z nagłówków modułów.

**L1. Ekonomia tury nie jest wołana z produkcji.** `playable.rs:1400` (`advance_turn`) wykonuje tylko fazę wojny `run_war_turn` (`playable.rs:1491`). Bez wołającego: `turn_economy_wire.rs:234` (`run_economy_tick_for_game`, nagłówek: `main.ts:34417–34578`), `turn_economy_post.rs:245` (`run_post_central_growth`), `turn_economy_post.rs:394` (`apply_praca_upkeep_post`, `main.ts:36093–36118` wg komentarza), `turn_economy_preview.rs`, `city_growth.rs` (nieosiągalny). Wpiąć: tick ekonomii w `advance_turn` w kolejności faz z pinu (kolejność do potwierdzenia w `gra/src`, NIE_ZMIERZONO w tym audycie).

**L2. Oblężenie nie jest osiągalne z bridge.** `siege_tactics_loop.rs:490` (`SiegeLoop`) i `:1092` (`ProdBody`) nie mają wołającego osiągalnego; enum `EngineCommand` w `bridge.rs` nie ma komendy ataku ani oblężenia. Łańcuch `siege_tactics_*` jest nieosiągalny; w sumie 80 modułów domeny ma wołających wyłącznie z nieosiągalnego kodu (większość to klaster oblężenia i ekonomii). Wpiąć: komenda walki w `bridge.rs` → `playable` → `SiegeLoop` (#113), potem wyjścia `BATTLE-ACTIONS` (#247).

**L3. Walka dystansu i zwarcia nie ma wołającego.** `combat.rs:321` (`resolve_combat`) i `:381` (`resolve`). `playable.rs:771` sam stwierdza: „petla walki Rust (`combat::resolve_combat`) nie ma produkcyjnego wywolania”. `bridge.rs` przy `MoveUnit` z `attack_unit_id` deklaruje, że bitwa jest poza komendą. Wpiąć: rozstrzygnięcie ataku po marszu (`MoveUnit` z celem wroga) przez `combat::resolve`, z wejściami z pinu (#135/#167).

**L4. Dyplomacja gracza i wojna wymuszona nie są wpięte.** `diplomacy_player_war.rs:311` (`declare_war_by_player`), bez wołającego; `bridge.rs:309–313` zwraca błąd dla `DeclareWar`. `turn_war_dipl_steps.rs:1034` (`apply_dipl_deltas_to_state`), bez wołającego w `advance_turn` (#106). Dodatkowo: `is_currency_proposal_forbidden_during_war` występuje dwa razy: `diplomacy.rs:2848` (używana, `diplomacy.rs:3344`) i `diplomacy_war_gates.rs:81` (bez wołającego). Ryzyko rozjazdu kopii; do scalenia przy wpięciu. Wariant wypowiedzenia (A/B) wg web (#286).

**L5. Eliminacja i zdobycie miasta.** `eliminacja.rs:48` (`eliminate_owner`) bez wołającego (#114 in_progress). `siege_transfer.rs:340` (`apply_transfer_with_effects`) i `siege_capital_plunder.rs:504` (`run_capital_capture_plunder`) wołane tylko z nieosiągalnego `siege_transfer` (#115 pending). Dodatkowo AI: `ai_turn.rs:1045` (`plan_ai_turn`), `ai_war_march_plan.rs:259` (`plan_war_march`), `war_turn_forced.rs:231` (`forced_war_step`), `war_turn_ai_ai.rs:84` (`run_ai_ai_peace_turn`) bez wołającego produkcyjnego.

**L6 (dodatkowo). Widoki P4 i zapis/odczyt bez wołającego.** `city_view.rs:578`, `map_view.rs:286`, `overlays_view.rs:223/449/631` nie mają wołającego, a renderer nie zależy od `civ-engine` (`rust-port/renderer/Cargo.toml`); `src-tauri/src/lib.rs` (komentarz nagłówkowy) potwierdza, że crate Tauri nie wywołuje silnika bezpośrednio poza `bridge.rs`. `zapis_loader.rs:43` (`load_save_snapshot`) i `replay` bez wołającego; bridge nie ma komendy zapisu ani wczytania. Decyzja architektoniczna (jak DTO mają trafić do renderera: przez bridge czy inaczej) nie jest w zakresie tego audytu.

Uwaga do §3: pozycja „AI-AI” (#4, #26) i „ReplayLog” (#13) są sprzeczne z kodem; wymagają wyjaśnienia przez właściciela tematu, nie są rozstrzygane tutaj.

## 5. Rekomendowana kolejność wpięć

1. **Eliminacja gracza (#114, `eliminate_owner`)**: mała, bez zależności od walki, wymagana przez zdobycie miasta. Wpiąć w ścieżce, która już zmienia właściciela (wojna/tura).
2. **Wektor wojny R7K7C (#106/#298): `apply_dipl_deltas_to_state` w `advance_turn`**: jedna linia po `run_war_turn` plus wektory ≥150. Wynik zależy od kolejności faz z pinu.
3. **Ekonomia tury (L1)**: największy zysk wierności; wymaga potwierdzenia kolejności faz wg `gra/src` (zasada web-first, bez pytania właściciela).
4. **Dyplomacja gracza (L4): `DeclareWar` w bridge + `declare_war_by_player`**: wariant A/B rozstrzygany przez web (#286), nie przez ABC.
5. **Walka dystansu (L3) → pętla oblężnicza (L2) → zdobycie miasta (L5, #115)**: kolejność zależna; zdobycie wymaga klastra oblężenia.
6. **Widoki P4 i zapis/odczyt (L6)**: najpierw decyzja architektoniczna o drodze DTO do renderera. Jest to pytanie do właściciela (ABC) i NIE zostało tutaj zadane; orkiestrator decyduje, czy je zgłosić.

Rekomendacja kolejności nie uwzględnia wagi zadań z planu; orkiestrator łączy ją z kolejką tematów.

## 6. Ograniczenia, rozbieżności i NIE_ZMIERZONO

- Metoda statyczna po nazwach. Wywołania metod przez odbiorcę bez nazwy typu (`x.metoda()`) nie są wykrywane; dla pozycji kluczowych (§3, §4) sprawdzono ręcznie `git grep`. Możliwe fałszywe „NIE” dla metod, które nie są przeniesione do nazwy typu.
- Dwa dopasowania fałszywie dodatnie usunięto przez regułę wywołania: `cell_key` (`mapgen/rivers_a.rs:298` jako parametr zmiennej vs `siege_tactics_autobatch.rs:63` jako funkcja) oraz wspólne nazwy metod (`new`, `label`, `actions`) z bloków `impl`.
- „Osiągalny z bridge” oznacza, że jednostka zawiera element wołany z osiągalnego kodu. Przykłady częściowe: `combat` (tylko helpery), `siege_tactics_blow` (tylko `js_max`/`js_round`), `brake_power_*` (wpięte, ale część składników bez wejść z pinu: NIE_ZMIERZONO).
- Liczby testów (`pliki testowe`) to przybliżenie po nazwach; nie służą do wnioskowania o pokryciu.
- Nazwy zadań mapowane na moduły z opisów w liście zadań; nie zweryfikowano każdego commita tematu. Rozbieżności oznaczono w §3.
- `unit_view` (#213): brak modułu o tej nazwie w `domain/`; NIE_ZMIERZONO.
- `main.ts` w §4 wzięte z nagłówków Rust; nie porównano z `gra/src` przy `07d2fbd72`.
- Brak osobnego pliku raportu w katalogu runu: wynik (STATUS/…) jest w bloku kontraktu na początku tego dokumentu.
- Worktree: odłączony na `9a71caf8a` (wcześniej `8265bbec0`, gałąź `worktree-wf_84cdb3a2-d6f-1` nietknięta). Brak zmian kodu. Brak push.

## 7. Załącznik A: moduły domeny (automatycznie wygenerowane, Q1)

Tabela poniżej jest wynikiem skryptu nad drzewem `9a71caf8a`, bez ręcznych poprawek. Kolumna „wołający produkcyjny” wymienia liczbę wołających i trzy przykłady.

| Moduł (`domain/`) | Publiczne elementy (top-level) | Wołający produkcyjny (liczba; przykłady) | Osiągalny z `bridge.rs` (graf statyczny) | Pliki testowe (przybliżenie) |
|---|---:|---|:---:|---:|
| `ai_diplomacy_turn` | 10 | tak (4; brake_inputs, turn_war_inputs, turn_war_pipeline) | tak | 15 |
| `ai_era_unit_promotion` | 4 | NIE | nie | 1 |
| `ai_general_war_campaign` | 13 | tak (1; ai_war_march_plan) | nie | 2 |
| `ai_move_range` | 5 | NIE | nie | 4 |
| `ai_peace_city_offer` | 23 | NIE | nie | 13 |
| `ai_resource_needs` | 10 | tak (1; ai_zakup_jednostki) | tak | 1 |
| `ai_turn` | 39 | NIE | nie | 166 |
| `ai_war_march_plan` | 8 | NIE | nie | 3 |
| `ai_zakup_jednostki` | 11 | tak (2; unit_replace, war_turn_declare) | tak | 5 |
| `alliance_war_obligation` | 9 | tak (2; diplomacy, diplomacy_truce) | tak | 1 |
| `army_consolidation` | 14 | NIE | nie | 1 |
| `army_follow_auto_merge` | 6 | tak (2; overlays_view, playable_movement) | tak | 2 |
| `army_leadership` | 9 | tak (1; siege_tactics_loop) | nie | 1 |
| `auto_improvements` | 82 | tak (4; army_consolidation, improvement_build, save_load) | tak | 17 |
| `barbarians` | 33 | NIE | nie | 111 |
| `battle_mode` | 5 | NIE | nie | 3 |
| `brake_inputs` | 14 | tak (3; city_view, turn_war_inputs, turn_war_pipeline) | tak | 7 |
| `brake_power` | 13 | tak (4; brake_power_producers, playable, turn_war_inputs) | tak | 16 |
| `brake_power_army` | 10 | tak (3; brake_power_improvements, brake_power_producers, turn_war_inputs) | tak | 20 |
| `brake_power_improvements` | 4 | tak (3; brake_power_producers, brake_power_rest, turn_war_inputs) | tak | 3 |
| `brake_power_producers` | 11 | tak (1; turn_war_inputs) | tak | 5 |
| `brake_power_rest` | 12 | tak (3; brake_power_producers, turn_war_inputs, war_turn_state) | tak | 3 |
| `building_costs` | 103 | tak (1; unit_replace_wiring) | tak | 38 |
| `city_growth` | 51 | tak (1; turn_economy_empirefood) | nie | 23 |
| `city_names` | 23 | tak (3; civ_names, mapgen, start_position) | tak | 3 |
| `city_towers` | 13 | tak (1; siege_tactics_loop) | nie | 27 |
| `city_view` | 19 | NIE | nie | 20 |
| `civ_bonuses` | 21 | tak (4; combat, pathfinding, siege_tactics_blow_full) | tak | 6 |
| `civ_matrix` | 63 | tak (11; building_costs, city_growth, civ_bonuses) | tak | 34 |
| `civ_names` | 22 | tak (2; city_names, mapgen) | tak | 9 |
| `combat` | 67 | tak (8; data, brake_power, building_costs) | tak | 114 |
| `credibility` | 31 | tak (2; diplomacy_player_war, turn_war_dipl_steps) | tak | 6 |
| `diplomacy` | 142 | tak (13; ai_diplomacy_turn, alliance_war_obligation, city_view) | tak | 26 |
| `diplomacy_aggressor` | 21 | tak (1; diplomacy_player_war) | nie | 9 |
| `diplomacy_ai_forced_peace` | 40 | tak (2; war_turn_ai_ai, war_turn_state) | tak | 41 |
| `diplomacy_basket` | 3 | NIE | nie | 1 |
| `diplomacy_locks` | 3 | NIE | nie | 2 |
| `diplomacy_multiwar` | 29 | tak (5; ai_peace_city_offer, diplomacy_multiwar_gate, diplomacy_war_weariness_tick) | tak | 14 |
| `diplomacy_multiwar_gate` | 14 | tak (4; brake_inputs, war_era_pool, war_forced_bronze) | tak | 6 |
| `diplomacy_multiwar_peace` | 9 | tak (4; diplomacy_ai_forced_peace, diplomacy_war_weariness_tick, war_turn_ai_ai) | tak | 8 |
| `diplomacy_nap_trust` | 11 | tak (1; diplomacy_locks) | nie | 4 |
| `diplomacy_player_war` | 14 | NIE | nie | 1 |
| `diplomacy_rejection_cooldown` | 10 | NIE | nie | 2 |
| `diplomacy_siege_war_gate` | 14 | tak (2; overlays_view, war_world_view) | nie | 12 |
| `diplomacy_tick_war_brake` | 23 | tak (3; ai_diplomacy_turn, brake_inputs, turn_war_pipeline) | tak | 4 |
| `diplomacy_truce` | 18 | tak (8; brake_inputs, diplomacy, diplomacy_player_war) | tak | 8 |
| `diplomacy_truce_end` | 20 | tak (3; diplomacy_player_war, diplomacy_truce_flow, turn_war_dipl_steps) | tak | 3 |
| `diplomacy_truce_flow` | 4 | tak (3; diplomacy, diplomacy_player_war, turn_war_dipl_steps) | tak | 3 |
| `diplomacy_war_gates` | 7 | NIE | nie | 1 |
| `diplomacy_war_peace_profile` | 50 | tak (3; ai_peace_city_offer, siege_transfer, turn_war_inputs) | tak | 3 |
| `diplomacy_war_weariness_tick` | 16 | tak (1; war_turn_ai_ai) | nie | 7 |
| `economy_city_fns` | 14 | tak (2; order_effects_lane, turn_economy_loop) | nie | 2 |
| `economy_city_params` | 2 | tak (4; turn_economy_empirefood, turn_economy_loop, turn_economy_post) | nie | 6 |
| `economy_city_terrain` | 6 | NIE | nie | 3 |
| `economy_yield` | 40 | tak (4; economy_city_fns, production_units, turn_economy_loop) | tak | 9 |
| `eliminacja` | 2 | NIE | nie | 1 |
| `error` | 1 | tak (2; player, session) | tak | 0 |
| `events` | 15 | tak (3; playable, player_order_queue, save_load) | tak | 18 |
| `formation_rules` | 10 | tak (1; player_order_move_gate) | nie | 2 |
| `fort_territory` | 10 | tak (1; state) | tak | 2 |
| `freshwater` | 4 | tak (2; auto_improvements, turn_economy_health) | tak | 1 |
| `general_quick_follow` | 16 | NIE | nie | 2 |
| `generals` | 14 | tak (2; general_quick_follow, save_migrations) | tak | 14 |
| `hex` | 9 | tak (19; city_view, civ_matrix, map_view) | tak | 63 |
| `ids` | 3 | tak (2; city_growth, siege_transfer_effects) | nie | 14 |
| `improvement_build` | 62 | tak (13; auto_improvements, brake_power_improvements, freshwater) | tak | 43 |
| `improvements` | 59 | tak (21; data, auto_improvements, brake_power_improvements) | tak | 65 |
| `js_math` | 11 | tak (13; diplomacy_truce, economy_yield, siege_capital_plunder) | tak | 16 |
| `map_generator` | 11 | tak (2; data, mapgen) | tak | 104 |
| `map_snapshot` | 17 | tak (1; map_view) | nie | 5 |
| `map_view` | 10 | NIE | nie | 6 |
| `mapgen` | 656 | tak (7; ai_turn, map_generator, map_view) | tak | 172 |
| `okolica` | 30 | tak (7; city_growth, overlays_view, state) | tak | 14 |
| `order_effects_culture` | 33 | tak (5; brake_power_producers, order_effects_lane, resource_access) | tak | 7 |
| `order_effects_lane` | 24 | tak (3; siege_transfer_effects, turn_economy_inputs_native, turn_economy_post) | nie | 5 |
| `overlays_view` | 23 | NIE | nie | 11 |
| `pathfinding` | 120 | tak (7; ai_general_war_campaign, ai_turn, playable) | tak | 194 |
| `playable` | 29 | tak (12; ai_war_march_plan, city_view, eliminacja) | tak | 36 |
| `playable_movement` | 27 | tak (2; overlays_view, playable) | tak | 6 |
| `player` | 23 | tak (5; city_view, ids, mapgen) | tak | 20 |
| `player_order_move_gate` | 9 | NIE | nie | 2 |
| `player_order_queue` | 9 | NIE | nie | 1 |
| `production_queue` | 18 | tak (6; events, general_quick_follow, generals) | tak | 22 |
| `production_units` | 116 | tak (9; city_view, economy_city_fns, order_effects_lane) | tak | 33 |
| `recruitment` | 139 | tak (7; ai_zakup_jednostki, brake_power_producers, city_growth) | tak | 78 |
| `replay` | 10 | NIE | nie | 2 |
| `resource_access` | 59 | tak (7; brake_power_rest, order_effects_culture, order_effects_lane) | tak | 8 |
| `resource_production` | 11 | tak (3; city_growth, order_effects_lane, turn_economy_resources) | nie | 3 |
| `rng` | 3 | tak (7; civ_names, map_generator, mapgen) | tak | 26 |
| `road_network` | 2 | tak (1; map_view) | nie | 2 |
| `roads` | 8 | NIE | nie | 3 |
| `save_load` | 18 | tak (2; replay, zapis_loader) | nie | 20 |
| `save_migrations` | 13 | tak (6; overlays_view, playable_movement, replay) | tak | 6 |
| `session` | 2 | tak (3; siege_tactics_actions, siege_tactics_loop, types) | tak | 3 |
| `siege_capital_plunder` | 22 | tak (1; siege_transfer) | nie | 22 |
| `siege_capture_events` | 12 | tak (1; siege_transfer) | nie | 1 |
| `siege_city_fortification` | 5 | tak (2; city_view, siege_tactics_doctrine_target) | nie | 3 |
| `siege_engine_build` | 11 | NIE | nie | 3 |
| `siege_enter_city` | 5 | tak (4; siege_surrender, siege_transfer, siege_transfer_q5) | nie | 7 |
| `siege_nearby_lock` | 4 | NIE | nie | 4 |
| `siege_no_breach` | 5 | tak (6; siege_tactics_actions, siege_tactics_endcheck, siege_tactics_fastforward) | nie | 7 |
| `siege_sortie` | 11 | NIE | nie | 1 |
| `siege_starvation` | 11 | tak (2; siege_surrender, siege_turn) | nie | 4 |
| `siege_surrender` | 12 | tak (1; siege_transfer) | nie | 1 |
| `siege_tactics_actions` | 25 | tak (1; siege_tactics_loop) | nie | 25 |
| `siege_tactics_activate` | 12 | tak (3; siege_tactics_class_adapters, siege_tactics_loop, siege_tactics_turnseq) | nie | 13 |
| `siege_tactics_approach` | 13 | tak (4; siege_tactics_breach, siege_tactics_class_adapters, siege_tactics_tower) | nie | 16 |
| `siege_tactics_autobatch` | 25 | tak (1; siege_tactics_autophase) | nie | 14 |
| `siege_tactics_autophase` | 7 | tak (1; siege_tactics_autobatch) | nie | 3 |
| `siege_tactics_blow` | 21 | tak (8; combat, siege_tactics_actions, siege_tactics_blow_env) | tak | 29 |
| `siege_tactics_blow_env` | 10 | tak (1; siege_tactics_instant) | nie | 3 |
| `siege_tactics_blow_full` | 13 | tak (2; siege_tactics_blow_env, siege_tactics_loop) | nie | 10 |
| `siege_tactics_blow_inputs` | 1 | NIE | nie | 2 |
| `siege_tactics_breach` | 8 | tak (1; siege_tactics_frame) | nie | 8 |
| `siege_tactics_class_adapters` | 6 | NIE | nie | 3 |
| `siege_tactics_classify` | 8 | tak (2; siege_tactics_class_adapters, siege_tactics_instant) | nie | 16 |
| `siege_tactics_clock` | 5 | tak (4; player_order_queue, siege_tactics_autobatch, siege_tactics_fastforward) | nie | 11 |
| `siege_tactics_doctrine_geometry` | 2 | NIE | nie | 1 |
| `siege_tactics_doctrine_state` | 4 | tak (2; siege_tactics_doctrine_target, siege_tactics_loop) | nie | 3 |
| `siege_tactics_doctrine_target` | 20 | tak (2; siege_tactics_activate, siege_tactics_loop) | nie | 15 |
| `siege_tactics_end` | 3 | tak (1; siege_tactics_endcheck) | nie | 30 |
| `siege_tactics_endcheck` | 9 | tak (4; siege_tactics_actions, siege_tactics_loop, siege_tactics_outcome) | nie | 5 |
| `siege_tactics_fastforward` | 8 | tak (1; siege_tactics_loop) | nie | 4 |
| `siege_tactics_frame` | 7 | NIE | nie | 2 |
| `siege_tactics_inputs_pos` | 13 | tak (6; siege_tactics_blow_env, siege_tactics_blow_full, siege_tactics_doctrine_target) | nie | 10 |
| `siege_tactics_inputs_terrain` | 6 | tak (2; siege_tactics_blow_env, siege_tactics_instant) | nie | 2 |
| `siege_tactics_inputs_unit` | 15 | tak (3; siege_tactics_blow_full, siege_tactics_instant, siege_tactics_loop) | nie | 5 |
| `siege_tactics_inputs_wall` | 12 | tak (3; siege_tactics_blow_env, siege_tactics_blow_full, siege_tactics_instant) | nie | 2 |
| `siege_tactics_instant` | 15 | tak (1; siege_tactics_outcome) | nie | 3 |
| `siege_tactics_loop` | 22 | tak (2; siege_tactics_actions, siege_tactics_frame) | nie | 16 |
| `siege_tactics_outcome` | 11 | NIE | nie | 2 |
| `siege_tactics_roundcap` | 5 | tak (2; siege_tactics_fastforward, siege_tactics_loop) | nie | 7 |
| `siege_tactics_tower` | 12 | tak (3; siege_tactics_activate, siege_tactics_class_adapters, siege_tactics_loop) | nie | 8 |
| `siege_tactics_turnseq` | 13 | tak (4; siege_tactics_actions, siege_tactics_autobatch, siege_tactics_loop) | nie | 18 |
| `siege_tactics_unit` | 10 | tak (4; siege_tactics_activate, siege_tactics_autobatch, siege_tactics_loop) | nie | 22 |
| `siege_tactics_walk` | 13 | tak (2; siege_tactics_class_adapters, siege_tactics_tower) | nie | 5 |
| `siege_transfer` | 8 | NIE | nie | 4 |
| `siege_transfer_effects` | 13 | tak (1; siege_transfer) | nie | 3 |
| `siege_transfer_q5` | 11 | tak (2; city_growth, siege_transfer) | nie | 2 |
| `siege_turn` | 4 | tak (1; siege_surrender) | nie | 2 |
| `siege_wonder_watch` | 7 | tak (1; siege_wonder_wrappers) | nie | 2 |
| `siege_wonder_wrappers` | 7 | tak (1; siege_transfer) | nie | 1 |
| `society_breakdown` | 55 | tak (5; mapgen, order_effects_culture, order_effects_lane) | tak | 13 |
| `start_position` | 26 | tak (9; auto_improvements, improvement_build, improvements) | tak | 37 |
| `start_reveal` | 7 | NIE | nie | 13 |
| `state` | 63 | tak (5; order_effects_culture, order_effects_lane, pathfinding) | tak | 28 |
| `terrain` | 27 | tak (30; data, ai_turn, auto_improvements) | tak | 114 |
| `territory` | 26 | tak (18; auto_improvements, brake_power_producers, brake_power_rest) | tak | 27 |
| `trade` | 78 | tak (13; data, ai_turn, alliance_war_obligation) | tak | 164 |
| `trade_flow_apply` | 1 | NIE | nie | 1 |
| `turn_economy` | 124 | tak (2; turn_economy_empirefood, turn_economy_loop) | nie | 51 |
| `turn_economy_advance` | 19 | tak (6; turn_economy_empirefood, turn_economy_loop, turn_economy_preview) | nie | 9 |
| `turn_economy_attrition` | 9 | tak (3; turn_economy_empirefood, turn_economy_post, turn_economy_wire) | nie | 4 |
| `turn_economy_empirefood` | 8 | tak (2; turn_economy_post, turn_economy_wire) | nie | 1 |
| `turn_economy_health` | 9 | tak (1; turn_economy_advance) | nie | 2 |
| `turn_economy_inputs_civ` | 3 | NIE | nie | 3 |
| `turn_economy_inputs_native` | 11 | NIE | nie | 3 |
| `turn_economy_inputs_podzial` | 4 | tak (1; siege_transfer) | nie | 2 |
| `turn_economy_inputs_state` | 9 | tak (1; turn_economy_wire) | nie | 8 |
| `turn_economy_inputs_trade` | 4 | tak (1; turn_economy_wire) | nie | 2 |
| `turn_economy_inputs_wonders` | 7 | tak (1; turn_economy_wire) | nie | 3 |
| `turn_economy_loop` | 16 | tak (6; turn_economy_empirefood, turn_economy_inputs_native, turn_economy_inputs_wonders) | nie | 7 |
| `turn_economy_post` | 11 | NIE | nie | 2 |
| `turn_economy_preview` | 2 | NIE | nie | 1 |
| `turn_economy_resources` | 30 | tak (4; turn_economy_advance, turn_economy_loop, turn_economy_preview) | nie | 4 |
| `turn_economy_territory` | 10 | tak (6; overlays_view, turn_economy_advance, turn_economy_loop) | nie | 10 |
| `turn_economy_tick` | 8 | tak (1; turn_economy_wire) | nie | 8 |
| `turn_economy_upkeep` | 6 | tak (3; turn_economy_advance, turn_economy_empirefood, turn_economy_tick) | nie | 7 |
| `turn_economy_wire` | 10 | NIE | nie | 4 |
| `turn_war_dipl_steps` | 19 | tak (3; turn_war_inputs, turn_war_pipeline, war_turn_declare) | tak | 8 |
| `turn_war_epoch` | 9 | tak (3; city_view, overlays_view, turn_war_inputs) | tak | 1 |
| `turn_war_inputs` | 19 | tak (1; playable) | tak | 11 |
| `turn_war_pipeline` | 8 | tak (4; playable, turn_war_dipl_steps, turn_war_inputs) | tak | 11 |
| `types` | 29 | tak (8; order_effects_lane, overlays_view, playable) | tak | 72 |
| `unit_epoch` | 13 | tak (3; city_view, mapgen, overlays_view) | tak | 5 |
| `unit_health` | 15 | tak (4; recruitment, siege_tactics_inputs_pos, siege_tactics_inputs_unit) | tak | 7 |
| `unit_power` | 9 | tak (3; brake_power_army, combat, siege_tactics_blow_full) | tak | 8 |
| `unit_replace` | 22 | tak (2; playable, unit_replace_wiring) | tak | 5 |
| `unit_replace_cost` | 4 | tak (3; playable, unit_replace_defs, unit_replace_wiring) | tak | 2 |
| `unit_replace_defs` | 5 | tak (2; playable, playable_movement) | tak | 2 |
| `unit_replace_wiring` | 5 | tak (2; playable, unit_replace_defs) | tak | 5 |
| `victory` | 21 | tak (1; playable) | tak | 9 |
| `war_all_in_capital` | 17 | tak (4; ai_war_march_plan, war_all_in_capital_nav, war_all_in_capital_plan) | nie | 6 |
| `war_all_in_capital_nav` | 13 | tak (4; ai_war_march_plan, siege_tactics_tower, war_all_in_capital) | nie | 9 |
| `war_all_in_capital_plan` | 2 | tak (1; ai_war_march_plan) | nie | 4 |
| `war_city_founder` | 2 | tak (1; war_home_defense) | nie | 1 |
| `war_era_pool` | 6 | tak (1; war_turn_forced) | nie | 1 |
| `war_forced_bronze` | 11 | tak (3; war_forced_trigger, war_turn_declare, war_turn_forced) | tak | 2 |
| `war_forced_common` | 9 | tak (8; brake_inputs, war_forced_bronze, war_forced_iron) | tak | 2 |
| `war_forced_iron` | 13 | tak (3; war_forced_trigger, war_turn_declare, war_turn_forced) | tak | 2 |
| `war_forced_pairing` | 14 | tak (5; war_forced_bronze, war_forced_iron, war_turn_declare) | tak | 6 |
| `war_forced_stone` | 7 | tak (3; war_forced_trigger, war_turn_declare, war_turn_forced) | tak | 4 |
| `war_forced_trigger` | 9 | tak (2; war_turn_declare, war_turn_forced) | tak | 4 |
| `war_forced_waves` | 18 | tak (2; ai_war_march_plan, war_world_view) | nie | 14 |
| `war_home_defense` | 31 | tak (4; ai_war_march_plan, war_all_in_capital_plan, war_home_defense_plan) | nie | 4 |
| `war_home_defense_plan` | 2 | tak (1; ai_war_march_plan) | nie | 1 |
| `war_rules_multiwar` | 5 | tak (2; war_all_in_capital, war_all_in_capital_plan) | nie | 2 |
| `war_target_select` | 8 | tak (3; ai_war_march_plan, war_turn_forced, war_world_view) | nie | 5 |
| `war_turn_ai_ai` | 7 | NIE | nie | 3 |
| `war_turn_declare` | 23 | tak (3; diplomacy_truce_flow, siege_transfer, turn_war_inputs) | tak | 13 |
| `war_turn_forced` | 4 | NIE | nie | 1 |
| `war_turn_state` | 11 | tak (12; ai_war_march_plan, brake_power_producers, brake_power_rest) | tak | 23 |
| `war_world_view` | 3 | tak (2; ai_war_march_plan, war_turn_forced) | nie | 3 |
| `wonder_placement` | 7 | NIE | nie | 1 |
| `work_tax` | 9 | NIE | nie | 2 |
| `zapis_loader` | 2 | NIE | nie | 5 |
