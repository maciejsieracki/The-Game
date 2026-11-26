# R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1 — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1
GOAL: publiczne `abort_siege_battle` (przez `AbortSiegeBattle`) i `load_game` w kliencie (odświeżenie `GetRenderMap` + `GetRenderFrame` po udanym `LoadGame`), testy E2E silnik→most→klient, mutanty.
ZMIANY/COMMIT: oceniany kod Operatora `899753337` + raport `79936e7f6` na gałęzi `rust-port-wip/409-client-api-gaps`; baza = `origin/rust-port/parity-v2` = `de4eabfe6e1cf7764b21d5ba9e4e2759ddea8ff2` (sprawdzone: `merge-base` = baza, parity-v2 nie przesunęła się). Ten raport: jedyny plik zmieniony przez Evaluatora (commit na gałęzi worktree Evaluatora nad `79936e7f6`).
TESTY: niżej, wszystkie bramki EXIT 0, odtworzone samodzielnie.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (uwagi U1–U4, żadna nie blokuje), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Allowlista i zakazy

`git diff --stat de4eabfe6 79936e7f6`: `rust-port/client/src/lib.rs` (+173/−3), `rust-port/client/tests/save_load_client.rs` (nowy, 450), `rust-port/client/tests/siege_battle_client.rs` (+263/−5), `01-operator-r1.md`. Wszystkie w allowliście (nowy plik testów klienta jest dozwolony jawnie). Plików spoza allowlisty: brak. Silnik, most, renderer, view-model: 0 zmian (`git diff --stat` pusty) ⇒ D-409-1 i D-409-3 (`CONTRACT_VERSION` nietknięty) spełnione. `renderer/Cargo.lock`: nietknięty, `git status` czysty po wszystkich bramkach i mutantach. Brak `#[ignore]`, brak usuniętych/osłabionych asercji (grep `^+.*#[ignore` i `^-\s*assert` po diffie: 0 trafień). Brak `gra/`.

## 2. Bramki (odtworzone; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)

| bramka | wynik |
|---|---|
| client `cargo fmt --check` | EXIT 0 |
| client `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| client `cargo test --all-targets --no-fail-fast` | EXIT 0: lib 0, `engine_bridge_renderer` 24, `save_load_client` 8, `siege_battle_client` 32 = 64 (było 51, +13) |
| engine `cargo test --all-targets --no-fail-fast` (pełny, w tle, setsid) | EXIT=0; 558 zestawów, 4352 passed / 0 failed / 1 ignored (= stan bazy z #407) |
| renderer | nie dotyczy (renderer nietknięty; klient kompiluje go przez zależność bez `--features gpu`) |

Dysk: 13 GB przed, 14 GB po sprzątnięciu targetów. Brak procesów cargo po rundzie.

## 3. Zgodność z pinem `07d2fbd72` (czytane przez `git show`)

- `battle/battleScene.ts:3359`: `mkTopBtn('Wycofaj się', 'Wycofaj się z bitwy', () => { this.dispose(); if (this.onCancelCb) this.onCancelCb(); })` — potwierdzone. `main.ts:37023` `onCancel: () => setMood('mapa')` — potwierdzone; obok komentarz `#50` „anulowanie deployu (onCancel powyżej) ich [machin] nie traci” — zgodne z asercją testu „machines not consumed”. `clearBattleUiState()` tylko w `afterSummary` (`:37030`) — potwierdzone. Decyzja D-409-OP-1 (wycofanie NIE czyści UI mapy) wynika wprost z pinu; dispatch „wyjście z UI bitwy jak w `Aborted`” Operator zinterpretował jako „stan gry bez zmian, bez `StateChanged`” — akceptuję (zasada „web najpierw”, CLAUDE.md §9/§11).
- `main.ts:46225` `restoreGameFromSave`, koniec `:47327-47331`: `selectedId = null; reachable = new Set(); unitRenderer.clearHighlight(); unitRenderer.clearPathRoute(); hoverKey = null;` — potwierdzone (numeracja Operatora `:47328-47332` przesunięta o 1, bez znaczenia). Przebudowa sceny `:46138-46156` — potwierdzone. `forceVisibleUnitId` nie jest zerowany przez `restoreGameFromSave` (trafienia tylko w `:7374, :9700, :34715, :36303, :44115`) — klient też go nie rusza: zgodne.
- `Ctrl+L` (`main.ts:44019-44023`) → `openLoadGameDialog(true)` bez strażnika bitwy; główny `keydown` (`:43908`) jest rejestrowany przed listenerami sceny bitwy (`battleScene.ts:3502-3518`), więc pin rzeczywiście nie rozstrzyga wczytania w trakcie bitwy ⇒ D-409-2 „jeśli pin nie rozstrzyga” zachodzi.
- `loadGameFromSlot` (`:46005`) zamyka dialogi/menu (`hideSaveLoadDialog`, `hideGamePauseMenu`, `hideMainMenu`, `hideNewGameFlow`), nie zamyka panelu oblężenia — klient nie zmienia `siege_map_panel_open` przy wczytaniu: zgodne z pinem.

## 4. Zgodność z decyzjami dispatchu

- D-409-1/3/4: spełnione (tylko klient; kontrakt nietknięty; brak sterownika zegara, Tauri, TS, U5).
- D-409-2: dispatch mówi „klient najpierw zamyka bitwę lokalnie”. Operator zamyka ją PO zaakceptowanym `LoadGame` (D-409-OP-4), bo zamknięcie przed wczytaniem złamałoby drugi wymóg dispatchu („odrzucone wczytanie nie zmienia bieżącej sesji klienta”), a `AbortSiegeBattle` przed wczytaniem zmieniłby sesję silnika przy odrzuconym zapisie. Zweryfikowałem: most przyjmuje `LoadGame` w trakcie bitwy i podmienia grę razem z bitwą (test `odczyt_w_trakcie_bitwy`: po wczytaniu silnik `noActiveBattle`, stan = zapis). Rozstrzygnięcie sprzeczności jest poprawne technicznie; patrz U4 (wpis do rejestru).
- Kryterium 2 (liczniki `GetRenderMap`/`GetRenderFrame`/`AbortSiegeBattle`/`LoadGame`): spełnione — log kolejności `[Load, Map, Frame]`, liczniki +1/+1, licznik komend bitwy (`seen.siege`) i `seen.loads`.
- „po `Finish` ⇒ `abortNotAllowed`”: silnik odrzuca abort na ekranie końca (faza `finished`, przed komendą `Finish`) — `Engine(AbortNotAllowed{CITY})` testowane; po samej komendzie `Finish` klient nie ma bitwy ⇒ `NoBattle` bez wołania silnika, a silnik zwraca `noActiveBattle` (też testowane). Obie interpretacje pokryte.

## 5. Mutanty Evaluatora (własny skrypt w scratchpadzie, podmiana tekstu w `lib.rs`, testy `save_load_client` + `siege_battle_client` z filtrem `wycofanie|odczy|zapis|blad`, przywrócenie; `git status` czysty po każdym przebiegu)

| # | mutant | wynik |
|---|---|---|
| E1 | load: brak `selected_unit_id = None` (M7 Operatora „NIEZASTOSOWANY”) | ZABITY (2 testy) |
| E2 | load: `unit_selected_after_build_open` nie zerowane | ZABITY |
| E3 | load: zamyka tryb budowy | ZABITY |
| E4 | load: przełącza bramkę renderera | ZABITY |
| E5 | load: czyszczenie UI PO odświeżeniu (ramka z zaznaczeniem) | ZABITY (2) |
| E6 | load: dwie ramki | ZABITY (3) |
| E7 | load: błąd `GetRenderMap` połknięty | ZABITY (`blad_odswiezenia_*`: `Refresh(NoSession)` ≠ `Refresh(Source)`) |
| E8 | load: otwiera panel oblężenia | **PRZEŻYŁ** (U1) |
| E9 | abort: inny `reason` | ZABITY |
| E10 | abort: inne `city_id` | ZABITY |
| E11 | abort: otwiera panel oblężenia | ZABITY |
| E12 | abort: `recompose()` z cache (bez silnika) | PRZEŻYŁ — równoważny (ponowne złożenie tej samej ramki z cache jest idempotentne; brak wywołań silnika, liczniki bez zmian) |
| E13 | abort: gałąź `if answer.state_changed` wyłączona | PRZEŻYŁ — równoważny przy obecnym moście (`abort_siege_battle`, `bridge.rs:438-455`, nie emituje `StateChanged`); gałąź defensywna D-371-4 niepokryta (U2) |
| E14 | abort: zachowuje widok jako `last_siege_battle_view` | ZABITY |
| E15 | abort: tylko w fazie `Running` (blokada klienta) | ZABITY (oczekiwany `Engine(AbortNotAllowed)`, a nie `BattleFinished`) |
| E16 | abort: przełącza bramkę renderera | ZABITY |
| E17 | load odrzucony: zeruje `hover` | **PRZEŻYŁ** (U3) |
| E18 | load odrzucony: zeruje `battle_end` | **PRZEŻYŁ** (U3) |

Wynik: 13 zabitych, 2 równoważne (E12, E13), 3 przeżyły (E8, E17, E18). Mutanty Operatora M1–M6, M8–M17 (16/16) nie były powtarzane w całości; ich klasy pokrywają się z E1–E16, a E1 zamyka lukę M7. Równoważność „`battle_closed = None` w abort” (Operator) — potwierdzam: E14 pokazuje, że zapis `battle_closed` jest obserwowalny, ale w trakcie bitwy pole jest zawsze `None` (`start_siege_storm` zeruje je, `lib.rs:1284-1285`), więc samo usunięcie linii nie zmienia stanu.

## 6. Uwagi (nieblokujące)

- U1 (E8, luka testu): po wczytaniu żaden test nie sprawdza `siege_map_panel_open`. Pin go nie rusza; klient też nie, ale regresja „wczytanie otwiera/zamyka panel” przeszłaby. Propozycja: w `odczyt_zachowuje_tryb_budowy_i_bramki` asercja całego `ClientUiState` poza czterema zerowanymi polami (np. porównanie z oczekiwanym `ClientUiState` zbudowanym z UI sprzed wczytania).
- U2 (E13): gałąź `answer.state_changed` w `abort_siege_battle` jest martwa przy obecnym moście. Albo test z fałszywym źródłem zwracającym `state_changed: true` (wzorzec już istnieje w `siege_battle_client.rs:776`), albo jawne oznaczenie jako defensywnej w raporcie Obrony.
- U3 (E17, E18, luka testu kryterium „wczytanie przy błędzie zmienia sesję”): `odrzucony_zapis_nie_zmienia_sesji` porównuje `c.ui()`, ale stan wyjściowy ma `hover = None`, a `last_siege_battle_end` nie jest ustawiony przed odrzuconym wczytaniem — mutanty zerujące te pola w ścieżce błędu przeżywają. Propozycja: ustawić hover i (w `siege_battle_client`) zakończyć jedną bitwę przed odrzuconym `load_game`, potem porównać `ui()` i `last_siege_battle_end/view`.
- U4 (proces): decyzje D-409-OP-1..4 trzeba wpisać do `REJESTR-RUST.md` (orkiestrator), w szczególności D-409-OP-4 jako świadome doprecyzowanie D-409-2 („najpierw zamyka” → „zamyka po zaakceptowanym wczytaniu”, bo odrzucone wczytanie nie może zmieniać sesji).
- Drobne: numer linii `:47328-47332` → faktycznie `:47327-47331` w pinie (komentarz w `lib.rs` i raporcie); bez wpływu na zachowanie.

## 7. Werdykt

Kod spełnia GOAL i kryteria 1, 2 i 4; kryterium 3 spełnione (≥ 6 mutantów zabitych u Operatora i u mnie), ale trzy moje mutanty przeżyły z powodu luk w asercjach testów odrzuconego wczytania i panelu oblężenia (U1, U3). Zachowanie kodu jest poprawne, więc nie ma FAIL. PASS-WITH-NOTES; Obrona powinna domknąć U1 i U3 testami (bez zmian w kodzie produkcyjnym) i odnieść się do U2.
