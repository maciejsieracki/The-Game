# 01-audyt — R-RUSTPORT-P6-AUDIT-ZINTEGROWANE (runda 1, Operator, HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-AUDIT-ZINTEGROWANE (#356 / #309 w dispatchu)
GOAL: dla modułów oznaczonych w rejestrze jako ZINTEGROWANE sprawdzić, czy istnieje wołający w produkcji (poza `#[cfg(test)]` i `tests/`), i zaproponować korektę statusu. Bez zmian w rejestrze, kodzie i bez cargo.
ZMIANY/COMMIT: wyłącznie ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-AUDIT-ZINTEGROWANE/01-audyt.md`).
TESTY: brak (dokumentacja, bez cargo). Weryfikacja = `git grep` na bazie `f85622878` (patrz §1), wyniki z plik:linia.
BLOKADY: patrz §0 (rozbieżności źródeł).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator aktualizuje `REJESTR-RUST.md` wg kolumny „Propozycja korekty” (#356); rozstrzygnięcie dla `apply_dipl_deltas`, `run_ai_ai_peace_turn` i `load_save_snapshot` wymaga decyzji właściciela tematu (zob. §3).
DEPLOY/PUSH: NIE_WYKONANO (dispatch: bez push).

---

## 0. Źródła i rozbieżności (ważne)

1. **Baza:** `origin/rust-port/parity-v2` = `f85622878` (zweryfikowane `git fetch`). Dispatch zlecał użycie tego SHA; użyto go do wszystkich `git grep`.
2. **Rejestr nie leży w bazie.** Polecenie z dispatchu `git show f85622878:dyspozycje/rust-port/REJESTR-RUST.md` zwraca błąd (`path does not exist`). Plik istnieje tylko na `origin/claude/rust-sivvrn` (tip `905ab7977`) jako `dyspozycje/rust-port/REJESTR-RUST.md`. Z niego pobrano statusy. Zbiór „ZINTEGROWANE” wzięto z: wiersza 22 (DYSTANS-PETLA, „ZINTEGROWANE: `parity-v2` = `a4087f332`”) oraz tabeli `KOREKTA 2026-11-16` (linie ok. 2602–2625), która jawnie wymienia moduły o statusie „wpięte/zintegrowane” i ich faktyczny stan wg audytu `9a71caf8a` (`AUDYT-PARYTET-9a71caf8a.md`). Pełnego zestawu wpisów „zintegrowane” (lowercase, w sekcjach „Przebieg”) nie przeliczano — to poza zakresem tej tabeli.
3. **Brak `rust-port/src-tauri` w bazie.** Mostem jest `rust-port/engine/src/bridge.rs` (istnieje w `f85622878`). Komendy `EngineCommand::DeclareWar` odrzucane w `bridge.rs:309` i `bridge.rs:428`.
4. **Metoda.** `git grep -n -E "<nazwa>"` po `rust-port/engine/src`, `rust-port/renderer`, `rust-port/view-model/src`, `rust-port/engine/bridge`; odfiltrowane komentarze (`//`, `///`, `//!`). Oddzielnie `git grep -l` po `rust-port/engine/tests` dla dowodu wołających testowych. Wywołania przez `use`/ścieżkę modułu liczone (nazwy funkcji są unikalne). Wywołania metodami bez nazwy typu nie są wykrywane przez grep po nazwie — to ograniczenie identyczne jak w audycie 9a71caf8a (§6 tam).
5. **Legenda kolumny „wołający produkcyjny”:** `BRAK` = zero wystąpień poza definicją i komentarzami w kodzie produkcyjnym; `tylko z klastra X` = jedyny wołający leży w module, którego nie osiąga `bridge.rs` (wg audytu 9a71caf8a, §3 L2/L5).

---

## 1. Tabela audytu

| Moduł / funkcja (plik:linia definicji, baza `f85622878`) | Status w rejestrze | Wołający produkcyjni (plik:linia) | Propozycja korekty |
|---|---|---|---|
| `apply_dipl_deltas_to_state` (`rust-port/engine/src/domain/turn_war_dipl_steps.rs:1034`) | #89/#90 R7K7-B/C; „moduł wpięty” | BRAK (0 wystąpień w `src`; `advance_turn` jej nie woła, `playable.rs:1491` woła tylko `run_war_turn`) | WOŁANE TYLKO W TESTACH (test: `tests/p6_r7k7c_owner_pools.rs`). Wpięcie: #106/#298 |
| `eliminate_owner` (`rust-port/engine/src/domain/eliminacja.rs:48`) | #141 (completed); INTEG-B21 `cf281d785` | BRAK (0 wystąpień w `src`) | WOLANE TYLKO W TESTACH (test: `tests/p6_eliminacja.rs`). Wpięcie: #114 (w toku) |
| `run_economy_tick_for_game` (`rust-port/engine/src/domain/turn_economy_wire.rs:234`) | „ekonomia zintegrowana” | BRAK (0 wystąpień w `src`; `run_economy_tick_for_game_with_food` `:246` też bez wołającego) | WOŁANE TYLKO W TESTACH (testy ekonomii: `tests/p6_econ_post_e2e.rs`, `tests/p6_empirefood_e2e.rs`, wg grep -l). Wpięcie: #304/#352 |
| `run_post_central_growth` (`rust-port/engine/src/domain/turn_economy_post.rs:245`) | jw. (ekonomia) | BRAK (0 wystąpień w `src`) | WOŁANE TYLKO W TESTACH (`tests/p6_econ_post_unit.rs`). Wpięcie: #304 |
| `apply_praca_upkeep_post` (`rust-port/engine/src/domain/turn_economy_post.rs:394`) | jw. (ekonomia) | BRAK (0 wystąpień w `src`) | WOLANE TYLKO W TESTACH (`tests/p6_econ_post_unit.rs`). Wpięcie: #304 |
| `declare_war_by_player` (`rust-port/engine/src/domain/diplomacy_player_war.rs:311`) | #171 CRED-HAK-WYPOWIEDZENIE-IMPL (completed) | BRAK. `bridge.rs:309` i `bridge.rs:428` odrzucają `EngineCommand::DeclareWar`; komentarz `diplomacy_player_war.rs:32` mówi o produkcji, której nie ma | WOLANE TYLKO W TESTACH (`tests/p6_cred_hak_kolejnosc.rs`). Status „zintegrowane” nieuzasadniony: NIEPODPIĘTA. Wpięcie: #305/#350 |
| `SiegeLoop` (`rust-port/engine/src/domain/siege_tactics_loop.rs:490`) i `ProdBody` (linia wg audytu: `:1092`, nie zweryfikowano ręcznie) | #96, #98, #116, #146 (completed) | BRAK. Zero konstrukcji `SiegeLoop::`/`SiegeLoop {`/`ProdBody::`/`ProdBody {` poza komentarzami w domenie i `bridge.rs`; użycia typu tylko w modułach klastra oblężenia (`siege_tactics_frame.rs:36,115,196,204`, `siege_tactics_actions.rs:31`) | BRAK (klaster nieosiągalny z `bridge.rs`, audyt L2). Wpięcie: #113/#306/#353 |
| `pick_tower_target` (`rust-port/engine/src/domain/siege_tactics_tower.rs:486`) | #96, #146 (completed) | tylko z klastra: `rust-port/engine/src/domain/siege_tactics_loop.rs:443` (wewnątrz `SiegeLoop`, który nie jest konstruowany w produkcji) | BRAK w produkcji (tylko z nieosiągalnego klastra). Testy: `tests/p6_tower_target*.rs`, `tests/p6_wieze_2b2.rs` |
| `combat::resolve` (`rust-port/engine/src/domain/combat.rs:381`) i `resolve_combat` (`:321`) | #136 COMBAT-RESOLVE-PETLA (completed); #10/DYSTANS-PETLA w rejestrze „ZINTEGROWANE” (`a4087f332`, wiersz 22) | BRAK. `resolve_combat` wołane tylko przez `resolve` (`combat.rs:382`), `resolve` bez wołającego w `src`. `playable.rs:771` stwierdza to samo (komentarz). `siege_tactics_instant.rs:22` potwierdza brak portu `resolveCombat` | BRAK (wpis DYSTANS-PETLA w rejestrze wymaga korekty: „zintegrowany kod, bez wołającego”). Wpięcie: #306/#135 |
| `apply_transfer_with_effects` (`rust-port/engine/src/domain/siege_transfer.rs:340`) | SIEGE-TRANSFER Q2–Q8 (#28–#43), #175 (completed) | BRAK. Jedyny wołający to `apply_transfer` (`siege_transfer.rs:323`); `apply_transfer` nie ma wołającego w `src`. Komentarz `siege_transfer.rs:195` i `:195–196`: „NIE PODPINAC wołającego (W8 r3)” | WOLANE TYLKO W TESTACH (`tests/p6_siege_transfer*.rs`). Wpięcie: #307/#354 (#115) |
| `run_capital_capture_plunder` (`rust-port/engine/src/domain/siege_capital_plunder.rs:504`) | SIEGE-TRANSFER Q6 (#40), #175 (completed) | BRAK (tylko komentarze w `siege_transfer.rs:180,188`, `siege_surrender.rs:39`) | WOLANE TYLKO W TESTACH (`tests/p6_siege_capital_plunder.rs`). Wpięcie: #307/#354 |
| `forced_war_step` (`rust-port/engine/src/domain/war_turn_forced.rs:231`) | W3 FORCED-STEP `0ccd2da2a` (zintegrowane) | BRAK (0 wystąpień w `src` poza definicją i dokumentacją `war_turn_forced.rs:1`) | WOLANE TYLKO W TESTACH (`tests/p6_wire_war_forced_step.rs`). Do wyjaśnienia: audyt L5 „do weryfikacji” — potwierdzone tu grepem |
| `plan_war_march` (`rust-port/engine/src/domain/ai_war_march_plan.rs:259`) | W5 MARCH-PLAN `72209573c` (zintegrowane) | BRAK (0 wystąpień w `src` poza definicją i dokumentacją `ai_war_march_plan.rs:11–14`) | WOLANE TYLKO W TESTACH (`tests/p6_wire_war_march_adapter.rs`, `tests/p6_wire_war_march_core.rs`). Do wyjaśnienia (audyt L5) |
| `plan_ai_turn` (`rust-port/engine/src/domain/ai_turn.rs:1045`) | (nie ma osobnego wpisu „zintegrowane” w rejestrze; audyt L5 „do weryfikacji”) | BRAK. Wołający `ai_turn.rs:1089` (`decide_ai_turn`) i `ai_turn.rs:1093` (`plan_turn`) — obie funkcje bez wołającego poza `ai_turn.rs` | BRAK (łańcuch martwy w `src`). Do wyjaśnienia przez właściciela tematu AI |
| `run_ai_ai_peace_turn` (`rust-port/engine/src/domain/war_turn_ai_ai.rs:84`) | #4 W7 SIEGE-AIAI-TURN (completed), #26 | BRAK (0 wystąpień w `src` poza definicją i dokumentacją `war_turn_ai_ai.rs:10`, `diplomacy_ai_forced_peace.rs:277,726`) | WOLANE TYLKO W TESTACH (`tests/p6_wire_war_siege_aiai*.rs`). ROZBIEŻNOŚĆ z opisem zadania (audyt §3) — do wyjaśnienia przez właściciela tematu |
| `zapis_loader::load_save_snapshot` (`rust-port/engine/src/domain/zapis_loader.rs:43`) | #13 (completed); ReplayLog | BRAK. `bridge.rs` nie ma komendy wczytania; `replay.rs:198` i `save_load.rs:16,130,1213` to komentarze | WOLANE TYLKO W TESTACH (`tests/p6_zapis_loader_migrate.rs`, `tests/p6_zapis_era_zapisu.rs`, `tests/p6_zapis_replay_migrate.rs`). ROZBIEŻNOŚĆ: opis mówi o ścieżce produkcyjnej, kodu produkcyjnego brak |
| `city_view::city_views` (`rust-port/engine/src/domain/city_view.rs:578`) | P4-1E CITY-VIEW (#214, #222) zintegrowane | BRAK (0 wystąpień w `src` poza definicją i nagłówkiem modułu `city_view.rs:5`) | WOLANE TYLKO W TESTACH (`tests/view_city_pin_vectors.rs`). Droga DTO → renderer nieustalona: #308 |
| `map_view::build_map_view` (`rust-port/engine/src/domain/map_view.rs:286`) | P4-1B MAP-VIEW-PRODUCER (#211) zintegrowane | BRAK w `src` (wystąpienia w `map_view.rs:433,461` leżą w bloku `#[cfg(test)]` od linii 382) | WOLANE TYLKO W TESTACH (`map_view.rs` cfg(test); `tests/p4_1b_map_view.rs`). Wpięcie: #308 |
| `overlays_view::build_highlight` (`rust-port/engine/src/domain/overlays_view.rs:223`) | P4-1F6 BUILD-SELECTION-VIEW (#243, #274) zintegrowane | BRAK. Renderer używa własnej funkcji `filter_build_highlight_hexes` (`rust-port/renderer/src/models/misc/build_highlight.rs:60`), wołanej tylko z testów (`rust-port/renderer/tests/repin3d_b1.rs`) i z `hex_build_highlight` (`renderer/src/view/convert.rs:57`, inna funkcja) | WOLANE TYLKO W TESTACH (`tests/view_overlays_build.rs`). Wpięcie: #270/#328 (PRIO-3D-2) |
| `overlays_view::okolica_view` (`rust-port/engine/src/domain/overlays_view.rs:631`) | P4-1F4 TRADE-WORKERS-OKOLICA-VIEW (#241, #272) zintegrowane | BRAK (0 wystąpień w `src`) | WOLANE TYLKO W TESTACH (`tests/view_overlays_trade_workers.rs`). Wpięcie: #270/#328 |
| `overlays_view::path_route_overlay` (`rust-port/engine/src/domain/overlays_view.rs:449`) | P4-1F5 REACH-PATH-VIEW (#242, #273) zintegrowane | BRAK (0 wystąpień w `src`; `overlays_view.rs:42` mówi, że wpięcie należy do #237/#270) | WOLANE TYLKO W TESTACH (`tests/view_overlays_reach_path.rs`). Wpięcie: #270/#328 |
| `js_max` / `js_round` (`siege_tactics_blow.rs`; helpery) | #110, #142 (completed) | CZĘŚCIOWO: helpery wołane w produkcji mapgen (`rust-port/engine/src/domain/mapgen/relief.rs:143,323`, `mapgen/params.rs:704,769`) i w `ai_era_unit_promotion.rs:106`. Silnik bloku oblężniczego: NIE_ZMIERZONO (nie sprawdzono wołających bloku z `siege_tactics_blow.rs`) | CZĘŚCIOWO (zgodnie z audytem §3). Sam blok oblężniczy = BRAK z powodu klastra |

**Legenda propozycji:** „WOŁANE TYLKO W TESTACH” = ma wołających w `tests/` (lub w `#[cfg(test)]`), zero w produkcji. „BRAK” = zero wołających nawet w testach albo wołający tylko z nieosiągalnego klastra. Dla każdej pozycji „WOŁANE TYLKO W TESTACH” status „ZINTEGROWANE” w rejestrze jest nieprawdziwy co do wołania; sam kod jest w `parity-v2`.

Uwaga do kolumny testów: nazwy plików testowych podano wg `git grep -l` po `rust-port/engine/tests` (wspólne zapytanie dla wszystkich nazw). Przypisanie konkretnego pliku do konkretnej funkcji jest dokładne tylko tam, gdzie wynika z nazwy pliku lub z rejestru; pozostałe — „wg grep -l”.

---

## 2. Liczby

- Wierszy w tabeli: 22 (17 + 4 + 1 CZĘŚCIOWO).
- Propozycja „WOŁANE TYLKO W TESTACH”: **17 wierszy** (zero wołających w produkcji, są wołający w testach).
- Propozycja „BRAK” (zero wołających w produkcji i brak wołających w testach, lub wołający tylko z nieosiągalnego klastra): **4 wiersze** — `SiegeLoop`/`ProdBody`, `pick_tower_target`, `combat::resolve`/`resolve_combat`, `plan_ai_turn` (łańcuch `decide_ai_turn`/`plan_turn`). Przy `resolve_combat` i `plan_ai_turn` nie wykazano wołającego testowego (zgodnie z grep po `tests/`, NIE_ZMIERZONO dla pełnej listy testów).
- CZĘŚCIOWO: **1 wiersz** (`js_max`/`js_round`).
- Łącznie: **wszystkie 21 wierszy bez wołającego produkcyjnego** (17 + 4); 1 wiersz CZĘŚCIOWO ma wołających produkcyjnych w mapgen.

## 3. Pięć najważniejszych (BRAK w produkcji, wpływ na grę)

1. **`declare_war_by_player`** (`diplomacy_player_war.rs:311`) — gracz nie może wypowiedzieć wojny: `bridge.rs:309`/`:428` odrzucają `DeclareWar`. Wpięcie #305.
2. **Ekonomia tury** — `run_economy_tick_for_game` (`turn_economy_wire.rs:234`), `run_post_central_growth` (`turn_economy_post.rs:245`), `apply_praca_upkeep_post` (`:394`): `advance_turn` (`playable.rs:1433–1491`) nie woła ekonomii; woła tylko `run_war_turn` i fazę zwycięstwa. Wpięcie #304.
3. **`eliminate_owner`** (`eliminacja.rs:48`) — brak produkcyjnej eliminacji właściciela; #114 pozostaje w toku.
4. **Pętla oblężnicza i walka dystansu** — `SiegeLoop`/`ProdBody` nie są konstruowane w produkcji, `combat::resolve` nie ma wołającego (`combat.rs:381–382`). Wpięcie #306/#113.
5. **Wojna tury i dyplomacja AI** — `apply_dipl_deltas_to_state` (`turn_war_dipl_steps.rs:1034`, wpięcie #106/#298), `forced_war_step` (`war_turn_forced.rs:231`), `plan_war_march` (`ai_war_march_plan.rs:259`), `run_ai_ai_peace_turn` (`war_turn_ai_ai.rs:84`). Statusy „zintegrowane” w rejestrze nie oznaczają wołania; trzy z nich audyt wskazywał jako „do weryfikacji” — grep potwierdza brak wołającego w `src`.

Dodatkowo (poza top 5): zdobycie miasta — `apply_transfer_with_effects` (`siege_transfer.rs:340`) i `run_capital_capture_plunder` (`siege_capital_plunder.rs:504`) — #115/#307/#354.

## 4. Propozycje dla REJESTR-RUST.md (wykonuje orkiestrator; ten Operator nie edytuje rejestru)

- Wiersz 22 (DYSTANS-PETLA, `a4087f332`): dopisać „kod zintegrowany, `combat::resolve` bez wołającego w produkcji (`combat.rs:381`)”.
- KOREKTA 2026-11-16: potwierdzona zgodnie z grepem na `f85622878`; dodać wpis, że `forced_war_step`, `plan_war_march` i `plan_ai_turn` są BRAK w `src` (dotąd „do weryfikacji”, NIE_ZMIERZONO → ZMIERZONO grepem).
- `plan_ai_turn`: łańcuch martwy (`decide_ai_turn`, `plan_turn` bez wołających) — do decyzji właściciela tematu AI, czy usunąć jako dług czy wpiąć.

## 5. Rozstrzygnięcia nieuwzględnione przez audyt 9a71caf8a

- Dla `run_ai_ai_peace_turn`, `load_save_snapshot` i `apply_dipl_deltas_to_state` rejestr opisuje ścieżkę produkcyjną, której kod nie istnieje (rozbieżność potwierdzona grepem). Decyzja, czy to dług do wpięcia, czy błędny opis — po stronie właściciela tematu, nie Operatora.
- Cały grep wykonano na `f85622878`; wyniki na tipie `origin/claude/rust-sivvrn` mogą się różnić (rejestr jest tam nowszy), NIE_ZMIERZONO.

## 6. Kryteria końca (dispatch)

- Tabela kompletna dla modułów ZINTEGROWANE z rejestru (wiersz 22 + sekcja KOREKTA): TAK, z zastrzeżeniem §0.2 (pełny zbiór lowercase „zintegrowane” nie przeliczony → NIE_ZMIERZONO).
- Każdy wpis z dowodem grep (plik:linia) lub oznaczony NIE_ZMIERZONO: TAK, poza `ProdBody` (linia wg audytu) i `js_*` (silnik bloku).
- Commit tylko pliku `01-audyt.md`: patrz §7.

## 7. Commit

Wyłącznie `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUDIT-ZINTEGROWANE/01-audyt.md` (jawny `git add`). Cargo.lock nie dotknięty. Brak push, brak zmian w `gra/`, `origin/main`, `rust-port/parity-v2`.

---

## 8. Korekta po obronie Operatora (runda 1, obrona r1; supersedes §0.3, §1 dla wierszy poniżej, §2, §6)

Źródło dowodów: `git grep` na bazie `f85622878` (ta sama baza co §1). Przy każdym wierszu podano zweryfikowany plik:linia.

### 8.1 Wiersze przeklasyfikowane

| Moduł / funkcja | Poprzednio (§1) | Po korekcie | Dowód (f85622878) |
|---|---|---|---|
| `resolve_combat` (`combat.rs:321`) | BRAK | WOŁANE TYLKO W TESTACH (klaster: tylko z `resolve`) | `tests/combat.rs` (`git grep -l resolve_combat -- rust-port/engine/tests`) |
| `combat::resolve` (`combat.rs:381`) | BRAK | BRAK (zero wołających w `src` i `tests`; ścisły grep `combat::resolve\b` i `combat::{…resolve…}` = 0 trafień poza komentarzem `siege_tactics_instant.rs:22`) | `git grep -n -E "combat::resolve\b"` — brak trafień kodu |
| `plan_ai_turn` (`ai_turn.rs:1045`) | BRAK | WOŁANE TYLKO W TESTACH (pośrednio: `plan_ai_turn` ← `decide_ai_turn` `ai_turn.rs:1089`, a `decide_ai_turn` ma wołających w `tests/ai_turn.rs:48,80,81,116,117,152,184,211,246,270,302`). Uwaga: sam `plan_ai_turn` nie jest wołany bezpośrednio w `tests/` (grep 0 trafień) | `git grep -n -E "plan_ai_turn|decide_ai_turn" f85622878 -- rust-port/engine` |
| `SiegeLoop` (`siege_tactics_loop.rs:490`) i `ProdBody` | BRAK | WOLANE TYLKO W TESTACH; produkcyjnie: wołających brak poza klastrem nieosiągalnym z `bridge.rs` | `tests/p4_1i1_battle_outcome.rs`, `p4_1i2_frame.rs`, `p4_1i2_frame_fire.rs`, `p4_1i3_actions.rs`, `p6_siege_tactics_loop.rs`, `p6_siege_tactics_loop_resume.rs`, `p6_siege_wylom_tower.rs`, `p6_wieze_2b1.rs`, `p6_wieze_2b2.rs` (SiegeLoop); `p4_1i3_actions.rs`, `p6_k5doc_state.rs`, `p6_k5loop_outcome_pin.rs`, `p6_siege_tactics_loop_body*.rs` (ProdBody) |
| `pick_tower_target` (`siege_tactics_tower.rs:486`) | BRAK (w produkcji) | WOLANE TYLKO W TESTACH; produkcyjnie tylko z klastra (`siege_tactics_loop.rs:443`) | `tests/p6_tower_target.rs`, `p6_tower_target_wiring.rs`, `p6_wieze_2b2.rs` |
| `js_max` (`domain/js_math.rs:20`) | CZĘŚCIOWO | ZINTEGROWANE (wołający produkcyjni) | `mapgen/relief.rs:56` (import `js_math::js_max`), wywołania `relief.rs:143,323,325,437,463,469,508,514,790,1324,1347,1593,2280` |
| `siege_tactics_blow::js_round` (`siege_tactics_blow.rs:191`) | CZĘŚCIOWO / NIE_ZMIERZONO | ZINTEGROWANE (wołający produkcyjni) | `domain/unit_power.rs:16` (`use … js_round as js_round_js`), wywołanie `unit_power.rs:89`; plik `unit_power.rs` nie ma `#[cfg(test)]` (`git grep cfg\(test\)` = 0) |

Lokalne, prywatne kopie `js_round` (np. `mapgen/relief.rs:62`, `siege_tactics_inputs_unit.rs:200`, `combat.rs:1371` w teście) nie są tą funkcją i nie liczą się do wiersza. Poprzednie zdanie „relief.rs:143,323 jako js_round” było błędne: te linie wołają `js_max` (import z `js_math`), a `js_round` w `relief.rs` to lokalna kopia (`relief.rs:62`, wołana w `:593,:638,:947,:2280,:2505`).

### 8.2 Liczby po korekcie (22 wiersze §1)

- WOLANE TYLKO W TESTACH: **20 wierszy** (17 z §1 + `SiegeLoop`/`ProdBody`, `pick_tower_target`, `plan_ai_turn`).
- BRAK (zero wołających nawet w testach): **1 wiersz** — `combat::resolve` (`resolve_combat` w tym samym wierszu ma wołających testowych, patrz 8.1).
- ZINTEGROWANE (wołający produkcyjni): **1 wiersz** — `js_max` / `siege_tactics_blow::js_round`.

Pierwotna liczba „4 BRAK” w §2 była zawyżona o 3 (przyjęty zarzut 1 obrony). Dla wierszy „WOŁANE TYLKO W TESTACH” pełny status pozostaje: produkcyjnie brak wołającego (poza klastrem oblężniczym/`combat`), więc status „ZINTEGROWANE” w rejestrze nadal nie jest uzasadniony.

### 8.3 Korekta §0.3 (powłoka Tauri)

Poprzednie zdanie „Brak rust-port/src-tauri w bazie” było błędne co do ścieżki: powłoka istnieje w korzeniu repo jako `src-tauri/src/lib.rs` (`git grep` na `f85622878`: `src-tauri/src/lib.rs:13,17,21` — `EngineBridge`, `CivEngineAdapter`). Grep po `SiegeLoop|ProdBody|resolve_combat|pick_tower_target|siege_tactics|combat::` w `src-tauri` daje wyłącznie linie `EngineBridge`/`CivEngineAdapter`, czyli zero wołających audytowanych funkcji. Wniosek z §1 pozostaje trafny, dowód jest teraz pełny.

### 8.4 Kompletność rejestru (§0.2, kryterium dispatchu „tabela kompletna”)

NIE_ZMIERZONO. Pełnego przeliczenia wpisów „zintegrowane” nie wykonano w tej rundzie. Rejestr istnieje tylko na `origin/claude/rust-sivvrn` (`dyspozycje/rust-port/REJESTR-RUST.md`); `grep -c -i zintegrowan` daje 141 linii (to liczba linii z tym słowem, nie liczba wierszy ze statusem ZINTEGROWANE). Kryterium „tabela kompletna dla wszystkich ZINTEGROWANE z rejestru” NIE jest spełnione; do zamknięcia w osobnej rundzie (rekomendacja: lista wierszy ze statusem ZINTEGROWANE z numerem linii rejestru + wołający dla każdego).

### 8.5 Przeklasyfikowana propozycja dla rejestru (wykonuje orkiestrator)

- Wiersz DYSTANS-PETLA (`a4087f332`): „kod zintegrowany; `resolve_combat` wołany tylko w testach; `combat::resolve` bez wołającego (`combat.rs:381`)”.
- `plan_ai_turn` / `decide_ai_turn`: „wołany tylko w testach (`tests/ai_turn.rs`); produkcyjnie łańcuch bez wołającego”.
- `SiegeLoop`, `ProdBody`, `pick_tower_target`: „wołane tylko w testach; produkcyjnie nieosiągalne z `bridge.rs`”.
- `js_max`, `siege_tactics_blow::js_round`: ZINTEGROWANE (produkcja: `relief.rs`, `unit_power.rs:89`).
