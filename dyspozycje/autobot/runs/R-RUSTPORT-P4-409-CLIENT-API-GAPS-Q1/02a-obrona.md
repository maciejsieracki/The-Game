# R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1: Obrona Operatora r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1
GOAL: publiczne `abort_siege_battle` i `load_game` w kliencie z testami E2E (#409, część B #403); odpowiedź na zarzuty Evaluatora (02-evaluator.md, commit b3eeb472d)
ZMIANY/COMMIT: tylko testy, w allowliście: `rust-port/client/tests/save_load_client.rs`, `rust-port/client/tests/siege_battle_client.rs` oraz ten raport. `client/src/lib.rs`, silnik, most, renderer, view-model i `Cargo.lock` są bez zmian. Baza: b3eeb472d (raport Evaluatora nad kodem Operatora 79936e7f6). SHA commitu Obrony podaje wynik końcowy Workflow (commit nad b3eeb472d, gałąź lokalna `obrona/409`, bez push).
TESTY: zob. §2
BLOKADY: brak (wpis w REJESTR-RUST.md należy do orkiestratora, zob. U4)
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## 1. Odpowiedzi na zarzuty

### U1 (mutant E8: `siege_map_panel_open` po `load_game` niesprawdzany): PRZYJMUJĘ
Poprawka w `save_load_client.rs::odczyt_zachowuje_tryb_budowy_i_bramki`. Przed wczytaniem test otwiera panel oblężenia (`set_siege_map_panel_open(true)`) i ustawia hover. Sprawdza też, że twórca podświetlenia nie ma wartości `Cleared`. Po wczytaniu porównuje **cały** `ClientUiState` z UI sprzed wczytania, w którym wyzerowano dokładnie 4 pola z `restoreGameFromSave`: `selected_unit_id`, `unit_selected_after_build_open`, `hover` oraz `highlight_last_writer = Cleared`. Jawnie sprawdza też `siege_map_panel_open == true`.
Dowód (mutanty uruchomione na lib.rs, potem przywrócone):
- E8 (`siege_map_panel_open = !siege_map_panel_open` po zaakceptowanym load): ZABITY przez `odczyt_zachowuje_tryb_budowy_i_bramki`.
- E8b (`siege_map_panel_open = false`): ZABITY przez ten sam test.

### U2 (mutant E13: gałąź `if answer.state_changed` w `abort_siege_battle` martwa przy realnym moście): PRZYJMUJĘ
Gałąź zostaje (D-371-4: każda odpowiedź z `StateChanged` odświeża ramkę). Pokrywa ją nowy test na skryptowanym źródle. `Scripted` ma nowe pole `abort_state_changed` (domyślnie `false`, czyli zachowanie realnego mostu, `bridge.rs:438-455`). Nowy test to `siege_battle_client.rs::wycofanie_ze_state_changed_odswieza_ramke`. Dla `state_changed ∈ {false, true}` sprawdza: koniec `Aborted { CITY, SIEGE_WITHDRAW_REASON }`, 1 wywołanie `AbortSiegeBattle`, zamknięty ekran, usuniętą scenę, `last_siege_battle_end` oraz `GetRenderFrame = +0` albo `+1`.
Dowód: E13 (gałąź zastąpiona przez `let _ = answer.state_changed;`) ZABITY przez `wycofanie_ze_state_changed_odswieza_ramke`.

### U3 (mutanty E17 i E18: odrzucone wczytanie zeruje hover albo `battle_end`): PRZYJMUJĘ
Dodałem nowy test `siege_battle_client.rs::odrzucony_odczyt_po_bitwie_nie_zmienia_sesji`. Ma realny most i bitwę rozegraną do końca: start → skip → `Finish` (koniec `Applied`, zachowany `last_siege_battle_view`). Potem ustawia hover, zaznaczenie i otwarty panel oblężenia, a następnie wykonuje 3 odrzucone `load_game` (`""`, `"{"`, `"[]"`). Każde zwraca `LoadGameError::Rejected`. Test sprawdza, że bez zmian zostają:
- cały `ui()`, łącznie z hover;
- `last_siege_battle_end`;
- `last_siege_battle_view` (liczba odpowiedzi);
- brak aktywnej bitwy, ramka i mapa;
- liczniki `GetRenderMap` i `GetRenderFrame`;
- lista komend oblężenia;
- stan silnika (`GetState`).

Test `odrzucony_zapis_nie_zmienia_sesji` w `save_load_client.rs` został bez zmian.
Dowód:
- E17 (`self.ui.frame_ui.hover = None;` na początku `load_game`): ZABITY.
- E18 (`self.battle_end = None;` na początku `load_game`): ZABITY.
- E18b (dodatkowy, `self.battle_closed = None;` na początku `load_game`): ZABITY.

Wszystkie trzy zabija `odrzucony_odczyt_po_bitwie_nie_zmienia_sesji`.

### U4 (proces: decyzje D-409-OP-1..4 w REJESTR-RUST.md): PRZYJMUJĘ treść. Wpis w rejestrze należy do orkiestratora
Plik `dyspozycje/rust-port/REJESTR-RUST.md` nie istnieje w bazie tematu (b3eeb472d). Jest tylko na gałęzi orkiestratora `origin/claude/rust-sivvrn`. Nie ma go też w allowliście, a push jest zabroniony. Wpis robi więc orkiestrator przy integracji. Poniżej gotowa treść do wklejenia:

- **D-409-OP-1** (wycofanie, pin `battleScene.ts:3359`, `main.ts:37023`): `abort_siege_battle` = `AbortSiegeBattle`. Zamyka ekran bitwy i scenę, koniec `Aborted { city_id, SIEGE_WITHDRAW_REASON }`. Stan gry bez zmian, bez `StateChanged` (most go nie emituje). UI mapy (zaznaczenie, hover, twórca podświetlenia, bramki) zostaje bez zmian, bo web `onCancel` = `setMood('mapa')` bez `clearBattleUiState()`. Błędy są jawne: `NoBattle` bez wołania silnika (także po `Finish`), `Engine(AbortNotAllowed)` na ekranie końca, `Engine(NoActiveBattle)`. Odpowiedź z `StateChanged` odświeża ramkę (D-371-4, gałąź defensywna z testem U2).
- **D-409-OP-2** (odświeżenie po wczytaniu, pin `main.ts:46225`, `:46138-46156`): po zaakceptowanym `LoadGame` dokładnie JEDNO `GetRenderMap`, potem JEDNO `GetRenderFrame` (jak po `CreateSession`, D-371-4). Poprzednia ramka i scena są porzucane.
- **D-409-OP-3** (odrzucenie): odrzucony zapis nie zmienia NICZEGO w kliencie (mapa, ramka, scena, UI, bitwa, ostatnia bitwa) i nie wysyła żadnego zapytania do silnika poza `LoadGame`.
- **D-409-OP-4** (wczytanie w trakcie bitwy). To świadome doprecyzowanie D-409-2: pin tego nie rozstrzyga, bo `Ctrl+L` → `openLoadGameDialog`, `main.ts:44019-44023`, nie ma blokady bitwy. Klient zamyka bitwę lokalnie PO zaakceptowanym `LoadGame`, a nie „najpierw”, i nie wysyła `AbortSiegeBattle`. Powód: `AbortSiegeBattle` wysłany przed wczytaniem zmieniłby sesję silnika także wtedy, gdy zapis zostanie potem odrzucony, a to łamie D-409-OP-3. Silnik i tak zastępuje całą `PlayableGame` (z bitwą) przy zaakceptowanym wczytaniu.

### Drobne (numer linii `restoreGameFromSave`: Evaluator podaje `:47327-47331`): ODRZUCAM
Dowód z pinu (`git show 07d2fbd72:gra/src/main.ts | sed -n '47327,47332p'`, numeracja `grep -n`):
```
47327: refreshObjectivePowerCache();
47328: selectedId = null;
47329: reachable = new Set<string>();
47330: unitRenderer.clearHighlight();
47331: unitRenderer.clearPathRoute();
47332: hoverKey = null;
```
Ciąg opisany w komentarzu (`selectedId = null` … `hoverKey = null`) zajmuje dokładnie `:47328-47332`. Zakres Evaluatora `:47327-47331` zaczyna się od `refreshObjectivePowerCache()` i gubi `hoverKey = null`. Komentarze w `lib.rs` i raport Operatora są poprawne i zostają bez zmian.

### Dowody Evaluatora (bramki, allowlista, pin): przyjęte bez uwag

## 2. Bramki (crate `client`, po zmianach Obrony)
Env: `CARGO_TARGET_DIR` w scratchpadzie (poza repo, usunięty po bramkach), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --all-targets --no-fail-fast`: EXIT 0. Wynik: 66 passed / 0 failed / 0 ignored. Rozbicie: lib 0, `engine_bridge_renderer` 24, `save_load_client` 8, `siege_battle_client` 34; wcześniej 32, doszły 2 nowe testy.
- Silnik, renderer i most są nietknięte. Pełnego testu engine nie powtarzałem, bo Evaluator ma EXIT=0, 4352/0/1 na tym samym kodzie produkcyjnym.
- Brak `#[ignore]`, brak osłabionych asercji (asercje tylko dodane), `Cargo.lock` nietknięty.

## 3. Mutanty Obrony (6/6 zabite)
| ID | Mutacja (`client/src/lib.rs`, cofnięta po pomiarze) | Wynik |
|---|---|---|
| E8 | load: `siege_map_panel_open = !…` | ZABITY (`odczyt_zachowuje_tryb_budowy_i_bramki`) |
| E8b | load: `siege_map_panel_open = false` | ZABITY (j.w.) |
| E13 | abort: gałąź `state_changed` usunięta | ZABITY (`wycofanie_ze_state_changed_odswieza_ramke`) |
| E17 | load: hover zerowany przed `LoadGame` | ZABITY (`odrzucony_odczyt_po_bitwie_nie_zmienia_sesji`) |
| E18 | load: `battle_end = None` przed `LoadGame` | ZABITY (j.w.) |
| E18b | load: `battle_closed = None` przed `LoadGame` | ZABITY (j.w.) |

Bilans po Obronie (mutanty Evaluatora): 16 zabitych (13 + E8, E13, E17, E18), 1 równoważny (E12), 0 przeżyło.
