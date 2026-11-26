# R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1 — Operator r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1
GOAL: luki API klienta: publiczne wycofanie z bitwy oblężniczej (`AbortSiegeBattle`) oraz odświeżenie mapy i ramki po wczytaniu gry (`LoadGame`), z testami E2E silnik→most→klient i mutantami.
ZMIANY/COMMIT: gałąź `rust-port-wip/409-client-api-gaps`, baza `origin/rust-port/parity-v2` = `de4eabfe6e1cf7764b21d5ba9e4e2759ddea8ff2`; kod WIP `899753337`, commit raportu = HEAD tej gałęzi (SHA w odpowiedzi Operatora). Pliki: `rust-port/client/src/lib.rs`, `rust-port/client/tests/siege_battle_client.rs`, nowy `rust-port/client/tests/save_load_client.rs`, ten raport. Silnik, most, renderer bez zmian (D-409-1, D-409-3; `CONTRACT_VERSION` nietknięty). `renderer/Cargo.lock` nietknięty (git status czysty).
TESTY: zob. niżej; wszystkie bramki klienta EXIT 0.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO

## Web najpierw (pin `07d2fbd72`)

- Wycofanie: `gra/src/battle/battleScene.ts:3359` — `mkTopBtn('Wycofaj się', 'Wycofaj się z bitwy', () => { this.dispose(); if (this.onCancelCb) this.onCancelCb(); })`; `onCancel: () => setMood('mapa')` (`main.ts:37023`). Web NIE woła `clearBattleUiState()` (to robi tylko `afterSummary`, `:37030`) i nie otwiera ponownie panelu oblężenia (`hideSiegeMapPanel()` przy starcie, `:36885`).
- Wczytanie: `loadGameFromSlot` (`main.ts:46005`) → `restoreGameFromSave` (`:46225`, koniec `:47328-47332`: `selectedId = null; reachable = new Set(); unitRenderer.clearHighlight(); unitRenderer.clearPathRoute(); hoverKey = null`) → pełna przebudowa sceny (`:46138-46156`). Tryb budowy i bramki nakładek nie są resetowane.
- Wczytanie w trakcie bitwy: `Ctrl+L` → `openLoadGameDialog(true)` (`main.ts:44019-44023`) bez strażnika bitwy; `restoreGameFromSave` nie zamyka sceny. Pin nie rozstrzyga → decyzja D-409-OP-4.

## API (klient, `rust-port/client/src/lib.rs`)

- `RenderClient::abort_siege_battle() -> Result<&SiegeBattleEnd, SiegeClientError<E>>` (impl dla `S: SiegeBattleSource`): `AbortSiegeBattle`; dopiero po akceptacji silnika: `siege_battle() == None`, `last_siege_battle_view() == None` (scena „disposed”), koniec `SiegeBattleEnd::Aborted { city_id, reason: SIEGE_WITHDRAW_REASON }`. Brak `StateChanged` ⇒ brak `GetRenderFrame`/`GetRenderMap` (gdyby odpowiedź niosła `StateChanged`, ramka jest pobierana — D-371-4). Błędy: `NoBattle` bez wołania silnika (także po `Finish`); `Engine(AbortNotAllowed)` na ekranie końca (bitwa zostaje, zostaje `Finish`); `Engine(NoActiveBattle)` gdy silnik nie ma bitwy (bitwa klienta zostaje). Zamknięty dług D-1I6D-5 (komentarz modułu zaktualizowany).
- Nowa stała `SIEGE_WITHDRAW_REASON = "Wycofaj się z bitwy"`.
- Nowy trait `SaveLoadSource: RenderSource` (`save_game`, `load_game`) — styl jak `RenderSource`/`SiegeBattleSource` (most dołączany przez `#[path]`, D-371-1).
- `RenderClient::save_game()` (przekazanie; brak zmian w kliencie) i `RenderClient::load_game(save) -> Result<(), LoadGameError<E>>`: `LoadGame` → (po akceptacji) UI końca `restoreGameFromSave` (zaznaczenie `None`, `unit_selected_after_build_open = false`, hover `None`, pisarz podświetlenia `Cleared`; tryb budowy i bramki zachowane) → `on_session_created` (JEDNO `GetRenderMap`, czyści cache ramki, scenę i bitwę) → `on_state_changed` (JEDNO `GetRenderFrame`). `LoadGameError::Rejected(E)` = nic się nie zmieniło; `LoadGameError::Refresh(ClientError)` = zapis wczytany, odświeżenie nieudane.

## Decyzje techniczne Operatora (do wpisu w REJESTR-RUST.md przez orkiestratora)

- D-409-OP-1: wycofanie zachowuje UI mapy (zaznaczenie, hover, pisarz podświetlenia, bramki) i nie przekomponowuje ramki — web `onCancel` = tylko `setMood('mapa')`. Uwaga dla Evaluatora: dispatch mówi „wyjście z UI bitwy jak w `Aborted`”; interpretuję to jako „stan gry bez zmian, bez `StateChanged`” (to, co dispatch wymienia po dwukropku). Ścieżka `Aborted` z `Finish` (D-WIRB-8) czyści UI jak `clearBattleUiState`, ale pin dla przycisku wycofania tego nie robi; wybrałem pin (zasada „web najpierw”). Mutant M15 (abort czyści UI jak `clearBattleUiState`) jest zabity testem.
- D-409-OP-2: po zaakceptowanym `LoadGame` odświeżenie jak po `CreateSession`: mapa, potem ramka, po jednym; działa też bez wcześniejszej sesji (wczytanie z menu głównego).
- D-409-OP-3: odrzucony zapis — klient nie zmienia niczego (mapa, ramka, scena, UI, bitwa) i nie odpytuje silnika.
- D-409-OP-4 (D-409-2): wczytanie w trakcie bitwy — silnik podmienia cały `PlayableGame` (bitwę też), więc klient zamyka bitwę LOKALNIE po zaakceptowanym wczytaniu, bez `AbortSiegeBattle` (abort przed wczytaniem zmieniłby sesję silnika nawet przy odrzuconym zapisie); odrzucone wczytanie zostawia bitwę i bitwa trwa dalej. „Ostatnia bitwa” (`last_siege_battle_end/view`) wyczyszczona jak przy nowej sesji. Zapis w trakcie bitwy odrzuca silnik (DL-SLB-1), test to potwierdza.
- Silnik/most: brak luki ujawnionej testami → bez zmian.

## Testy E2E (nowe)

`client/tests/save_load_client.rs` (most rzeczywisty, licznik i log kolejności wywołań `Load/Map/Frame/Save`):
- `zapis_odczyt_mapa_i_ramka_stanu_wczytanego` — log `[Load, Map, Frame]`, `GetRenderMap`=+1, `GetRenderFrame`=+1; tura = tura zapisu, ramka ≠ ramka sprzed wczytania, ramka (JSON) = ramka niezależnego mostu po `LoadGame` tego zapisu, `MapStatic` = mapa zapisu, `GetState` = stan zapisany; UI wg `:47328-47332`; renderer karmiony ramką (żetony = jednostki DTO, heksy, nakładki, tura).
- `odczyt_innej_mapy_buduje_nowa_scene` — zapis gry seed 11 wczytany w sesji seed 4242: mapa i odpowiedź `GetRenderMap` = zapisu.
- `odrzucony_zapis_nie_zmienia_sesji` — 4 błędne zapisy: tylko `Load` w logu, UI/mapa/ramka/wejścia renderera/stan silnika bez zmian; sesja działa dalej.
- `odczyt_bez_poprzedniej_sesji`, `odczyt_zachowuje_tryb_budowy_i_bramki`, `blad_odswiezenia_po_odczycie_jest_typowany` (`Refresh(Source)`), `kazdy_odczyt_jedna_mapa_jedna_ramka`.

`client/tests/siege_battle_client.rs` (scenariusz oblężenia z taranem):
- `wycofanie_z_bitwy_w_trakcie_e2e` (ze sceną i bez) — po 3 krokach `Running`: komendy `[start, step×3, abort]`, koniec `Aborted{CITY, SIEGE_WITHDRAW_REASON}`, brak bitwy i ekranu, liczniki map/frame bez zmian, UI i ramka bez zmian, stan gry = sprzed startu (machiny nie zużyte), silnik `noActiveBattle`, `NoBattle` bez wołania silnika, nowy szturm do wyniku.
- `wycofanie_zaraz_po_starcie`; `wycofanie_po_koncu_walki_odrzucone` (`Engine(AbortNotAllowed{CITY})`, ekran końca zostaje, `Finish` → `Applied`; po `Finish` `NoBattle` bez wołania, silnik `noActiveBattle`); `wycofanie_bez_bitwy` (`NoBattle` bez wołania; `Engine(NoActiveBattle)` gdy silnik zamknął bitwę, bitwa klienta zostaje); `odczyt_w_trakcie_bitwy` (zapis w bitwie odrzucony; odrzucony odczyt zostawia bitwę; zaakceptowany: brak `abort`, map/frame +1/+1, bitwa zamknięta lokalnie, silnik bez bitwy, stan = zapis, ramka = ramka mostu, nowy szturm do wyniku).

## Bramki (klient, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`)

- `cargo fmt --check` — EXIT 0
- `cargo clippy --all-targets -- -D warnings` — EXIT 0
- `cargo test --all-targets --no-fail-fast` — EXIT 0: lib 0, `engine_bridge_renderer` 24, `save_load_client` 8 (7 nowych + 1 wewnętrzny test mostu z `#[path]`), `siege_battle_client` 32 (27 + 5 nowych). Razem 64 (było 51; +13). Brak `#[ignore]`, brak osłabionych asercji.
- Silnik/renderer: niedotknięte, ich bramek nie uruchamiano (dispatch: tylko gdy dotknięte). Klient kompiluje oba crate'y przez zależności — kompilacja OK.

## Mutanty (skrypt `mut409.py` w scratchpadzie; podmiana tekstu w `lib.rs`, testy `save_load_client` + `siege_battle_client -- wycofanie odczyt`, przywrócenie; `git status` czysty po przebiegu)

| # | mutant | wynik |
|---|---|---|
| M1 | brak `GetRenderMap` po wczytaniu | ZABITY (5 testów) |
| M2 | brak `GetRenderFrame` po wczytaniu | ZABITY (6) |
| M3 | ramka przed mapą | ZABITY (6) |
| M4 | odrzucony zapis czyści sesję klienta | ZABITY |
| M5 | odrzucony zapis resetuje UI | ZABITY |
| M6 | odrzucony zapis zamyka bitwę | ZABITY |
| M7 | wczytanie bez czyszczenia zaznaczenia | NIEZASTOSOWANY (wzorzec wystąpił 2× — ten sam blok w `exit_battle_ui`); pokrycie pośrednie: asercja `selected_unit_id == None` w `zapis_odczyt_*` i `odczyt_zachowuje_tryb_budowy_i_bramki` |
| M8 | wczytanie bez czyszczenia hover | ZABITY |
| M9 | wczytanie zostawia pisarza podświetlenia | ZABITY |
| M10 | wczytanie zostawia bitwę w kliencie | ZABITY |
| M11 | abort bez zamknięcia UI bitwy | ZABITY |
| M12 | abort po końcu bitwy akceptowany | ZABITY |
| M13 | abort zamyka bitwę przy błędzie silnika | ZABITY |
| M14 | abort zawsze odświeża ramkę | ZABITY |
| M15 | abort czyści UI mapy jak `clearBattleUiState` | ZABITY |
| M16 | abort bez wpisu końca bitwy | ZABITY |
| M17 | abort tylko lokalnie (bez silnika) | ZABITY |

16/16 zastosowanych zabitych. Równoważny (nieuruchomiony): usunięcie `self.battle_closed = None` w `abort_siege_battle` — w trakcie bitwy `battle_closed` jest zawsze `None` (czyści je `start_siege_storm`), więc linia jest defensywna.

## Uwagi

- Dysk przed/po: 14 GB wolne; brak procesów cargo w tle po rundzie.
- Dispatch istnieje tylko na `origin/claude/rust-sivvrn`; na gałęzi roboczej (z parity-v2) katalog runu zawiera wyłącznie ten raport.
