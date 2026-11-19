# R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1: Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1 (#371, klient: wołający komend bitwy oblężniczej)
GOAL: klient (rust-port/client) jest produkcyjnym wołającym StartSiegeStorm / StepSiegeBattle / SkipSiegeBattle /
      FinishSiegeBattle i karmi nimi odtwarzanie bitwy w rendererze (headless, gpu OFF); E2E przez most
BAZA: origin/rust-port/parity-v2 = a5fdb91b8712074bf790b423888d46d39114eb23 (faktyczny SHA w chwili startu)
GAŁĄŹ: rust-port-wip/p4-1i6-siege-battle-client (worktree wf_9518d88d-22d-1)
ZMIANY/COMMIT: §7 (SHA końcowy w ostatnim wierszu §7)
TESTY: §5 (fmt, clippy -D warnings, cargo test --all-targets klienta; renderer fmt/clippy/battle_playback_*;
       engine bridge_contract + p6_k5loop_wiring_b*; mutanty §6)
BLOKADY: brak blokujących dla zakresu; dług D-1I6-SETUP (scena w produkcji wymaga producenta BattleSetupDto w
         silniku, poza allowlistą) i D-1I6-ERR (most niesie błąd bitwy tylko jako tekst) — §8
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Web najpierw (pin `07d2fbd72`)

Przeczytane (`git show 07d2fbd72:gra/src/main.ts`): `launchSiegeStormFromMap` (`:36799-37044`), w tym
`hideSiegeMapPanel()` (`:36885`), `rosterToBattleUnits(atkRosterRef, 0xffd54a)` / `(defRosterRef, 0xc84040)`
(`:36981-36982`), `deployPlayerSide: 'atk'`, `deploy` tylko z generałem, `bs.play(res => { consumeReadyMachines(city);
finishSiegeStormBattle(..., { afterSummary: () => { setMood('mapa'); clearBattleUiState(); bs.dispose(); } }) })`
(`:37019-37033`); `finishSiegeStormBattle` (`:36596-36725`) z `afterSiegeUi` (`:36628-36672`); `clearBattleUiState`
(`:36904-36908`: `clearPlayerUnitSelection()`, `refreshFog()`, `updateHud()`); `clearPlayerUnitSelection` /
`clearPlayerUnitSelectionStateOnly` (`:7090-7106`); `refreshMapAfterCityCapture` (`:36270-36307`, w tym czyszczenie
`forceVisibleUnitId` w następnej klatce `:36303`); `battle/battleScene.ts` `skip()` (`:3680`) i `_showEndScreen`
(`:3747`, `:9478`, `:9496`).

Wnioski użyte w kliencie:
* w trakcie sceny mapa jest zasłonięta i nie zmienia się (zgodne z D-WIRB-2: Start/Step/Skip bez `StateChanged`);
* przycisk „Pomiń” działa tylko w trakcie gry sceny; po `finished` jest ekran końca, potem wynik;
* po wyniku: gałąź `afterSiegeUi` (zdobycie / mur stoi / odparty / remis / brak komunikatu), potem
  `clearBattleUiState` = brak zaznaczenia, brak hovera, wyczyszczone podświetlenie;
* panel oblężenia jest zamykany przed sceną (`:36885`).

## 2. Co zrobiono

| Plik | Zmiana |
|---|---|
| `rust-port/client/src/lib.rs` | sekcja „siege battle (P4-1I6)”: `SiegeBattleSource` (komendy bitwy przez most), `SiegeBattleCommand`, `SiegeBattleAnswer`, `SiegeSourceError`, `StreamOrder` (strażnik kontraktu `check_order`), `SiegeSceneStatic` / `SiegeUnitLook` (część ustawienia sceny, której most nie niesie), `compose_siege_battle_setup` (BattleSetupDto z odpowiedzi startu), `SiegeBattleView` (ekran bitwy: faza, Pomiń, ekran końca, liczniki, scena + `BattlePlayback`), `SiegeAfterUi` (gałęzie `afterSiegeUi`), `SiegeBattleEnd` (Applied / Aborted), `SiegeClientError`; metody `RenderClient::start_siege_storm` / `step_siege_battle` / `skip_siege_battle` / `finish_siege_battle` / `siege_battle` / `last_siege_battle_end` / `last_siege_battle_view`; pola `battle`, `battle_end`, `battle_closed` (czyszczone w `on_session_created`). Istniejące API bez zmian. |
| `rust-port/client/tests/siege_battle_client.rs` (nowy) | E2E przez prawdziwy most + źródło skryptowe (15 testów, §5) |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1/01-operator-mutanty.py` | skrypt mutantów (§6) |

Bez zmian: `engine/*`, `renderer/*` (w tym `playback.rs`, `battle/mod.rs` — adapter jest w kliencie), `view-model/*`,
`src-tauri`, `gra/`, `client/tests/engine_bridge_renderer.rs` (adaptacja niepotrzebna: kompiluje się i przechodzi bez
zmian), `Cargo.*`.

## 3. Decyzje techniczne (do wpisania przez orkiestratora w `REJESTR-RUST.md`)

* **D-1I6-1 (szew).** Most jest włączany przez `#[path]` w każdym konsumencie (D-371-1), więc klient rozmawia z nim
  przez cechę `SiegeBattleSource: RenderSource` nad typami biblioteki (`SiegeBattlePayload`, `SiegeBattleError` z
  `civ_engine::domain::siege_battle_apply`). Wołający (Tauri, test) mapuje `BridgeError` na `SiegeBattleError`
  (most niesie tylko `Display` błędu — dług D-1I6-ERR).
* **D-1I6-2 (kolejność).** Każda odpowiedź przechodzi strażnika `StreamOrder` (reguła `BattlePlayback::check_order`,
  `playback.rs:584-625`: akcje wszystko-albo-nic, potem ramka, czas nigdy nie maleje przez całą bitwę; `NaN` odrzucany),
  ze sceną i bez, więc naruszenie jest zgłaszane (`SiegeClientError::Order`) zanim zmieni się stan renderera, liczniki
  i strażnik.
* **D-1I6-3 (scena).** Odpowiedź mostu nie ma `BattleSetupDto` (siatka, mur, modele; producent = praca silnika, dług
  D-1I6-SETUP). Klient składa ustawienie z odpowiedzi startu (`units`: strona; ramka startu: kolumna/wiersz, kierunek,
  korona muru, HP, morale, amunicja; kolory właścicieli pinu `0xffd54a` / `0xc84040`; `deployPlayerSide: 'atk'`;
  `siege = true`; `deploy = None`, bo `deploy` = generał = tryb ręczny poza zakresem) plus część statyczna
  `SiegeSceneStatic` od wołającego. Bez niej klient prowadzi bitwę bez sceny (strażnik, liczniki, wynik, odświeżenie
  mapy).
* **D-1I6-3b (cofnięcie startu).** Ramka startu jest stanem PO akcjach startu (`t0 <= vNow`; pomiar: pierwsze
  uruchomienie z komórkami ramki dało `MoveFrom { id: 0, expected: (10, 75), actual: (10, 71) }`). Komórka spawnu =
  `from` pierwszej akcji zmieniającej komórkę (`Move`, `ClimbWall`, `LeaveField`; kroki się łączą, kontrakt `MoveFrom`),
  inaczej komórka ramki. Akcja startu zmieniająca HP / morale / obecność (`Damage`, `Kill`, `Leave`, `Shaken`, `Rout`)
  nie daje się cofnąć z ramki — taki start jest odrzucany (`Setup`), bez zgadywania.
* **D-1I6-4 (Pomiń).** Po `SkipSiegeBattle` klient odtwarza kolejkę do ramki i woła `apply_snapshot` z tą ramką
  (przewijanie nie emituje `Damage`; kontrakt dokumentacji `BattlePlayback`). Test: HP śledzone przez odtwarzanie =
  HP ramki silnika dla każdej jednostki na polu.
* **D-1I6-5 (koniec bitwy, D-WIRB-8).** `finish_siege_battle`: wynik zastosowany → akcje wstrzymane zagrane, bitwa
  zamknięta (scena zostaje do odczytu jak przed `bs.dispose()`), UI `clearBattleUiState`, JEDNO `GetRenderFrame`
  (reguła `StateChanged` D-371-4); `NotFinished` → bitwa zostaje, Pomiń dostępne (`SiegeClientError::Engine`,
  `is_not_finished`); `Aborted` → bitwa i scena porzucone, stan gry bez zmian (brak `StateChanged`), to samo wyjście
  UI (ramka tylko wtedy, gdy zmieniło się `RenderUiParams`). `Step` / `Skip` po końcu bitwy i drugi `Start` są
  odrzucane bez wołania silnika; `on_session_created` porzuca bitwę (`CreateSession` = nowa gra).

## 4. Zastosowano / poza zakresem względem `finishSiegeStormBattle` / `afterSiegeUi`

| Element pinu | Linie | Status w kliencie |
|---|---|---|
| `hideSiegeMapPanel()` przed sceną | `:36885` | ZASTOSOWANO (`siege_map_panel_open = false`) |
| `new BattleScene` kolory stron, `deployPlayerSide: 'atk'`, `siege` | `:36980-37018` | ZASTOSOWANO (`compose_siege_battle_setup`); siatka/mur/modele z `SiegeSceneStatic` (dług D-1I6-SETUP) |
| `bs.play` czas rzeczywisty (rAF) | `battleScene.ts` | ZASTOSOWANO (`step_siege_battle(wall_ms)`) |
| przycisk Pomiń (`skip()`) | `battleScene.ts:3680` | ZASTOSOWANO (`skip_siege_battle`, `skip_available`) |
| ekran końca (`finished`, `_showEndScreen`) | `:3747`, `:9478`, `:9496` | ZASTOSOWANO (`end_screen`, odmowa `Step`/`Skip`) |
| `consumeReadyMachines(city)` + `finishSiegeStormBattle` | `:37022-37024` | w silniku (`FinishSiegeBattle`); klient przyjmuje `result` |
| `afterSiegeUi`: zdobycie (`refreshMapAfterCityCapture`) | `:36629-36646` | ZASTOSOWANO jako `SiegeAfterUi::Captured` + odświeżenie mapy (`GetRenderFrame`); tekst komunikatu = P5 |
| `afterSiegeUi`: mur stoi / odparty / remis | `:36647-36671` | ZASTOSOWANO (`CaptureBlocked` / `Repelled` / `Draw`; brak gałęzi = `Silent`) |
| `refreshFog` / `syncUnitsRender` / `cityRenderer.sync` / `refreshSiegeMarkers` | `:36650-36671` | ZASTOSOWANO jako jedno `GetRenderFrame` po `StateChanged` (warstwy klatki) |
| `clearBattleUiState` → `clearPlayerUnitSelection` | `:36904-36908`, `:7090-7106` | ZASTOSOWANO (zaznaczenie, hover, `unit_selected_after_build_open`, pisarz podświetlenia `Cleared`) |
| `forceVisibleUnitId = lead.id`, czyszczony w następnej klatce | `:36277`, `:36303` | ZASTOSOWANO jako stan końcowy (`force_visible_unit_id = None`) |
| `setMood('bitwa'/'mapa')`, `showHintMessage`, panel podsumowania, `updateHud`, `refreshD1bHud`, `bs.dispose()` | `:36962`, `:37027-37030`, `:36628-36672` | POZA ZAKRESEM (audio / DOM = P5, Tauri) |
| `battleReserveNotice` (komunikat rezerwy) | `:36965-36968` | POZA ZAKRESEM (DOM, P5) |
| tryb ręczny (generał), `onCancel` rozstawienia | `:36975-36977` | POZA ZAKRESEM (dispatch; silnik zwraca `ManualModeNotPorted`) |
| auto-szturm (`doSiegeAutoResolve`), kapitulacja, przejęcie bez bitwy, `spectacle` | — | POZA ZAKRESEM (dispatch) |

## 5. Testy i bramki

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, osobne `CARGO_TARGET_DIR` w
scratchpadzie z nazwą tematu (`tgt-1i6-siege-client`, `tgt-1i6-renderer`, `tgt-1i6-engine`), kolejno, bez
równoległych buildów renderera; targety usunięte po bramkach. Dysk przed bramką renderera: 12 GB wolne.

| Bramka | Wynik |
|---|---|
| `client`: `cargo fmt --all -- --check` | EXIT 0 |
| `client`: `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `client`: `cargo test --all-targets --no-fail-fast` | EXIT 0 — lib 0, `engine_bridge_renderer` 18 passed, `siege_battle_client` 15 passed, 0 failed (przebieg końcowy po mutantach) |
| `renderer` (gpu OFF): `cargo fmt --all -- --check` | EXIT 0 |
| `renderer`: `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `renderer`: `battle_playback` / `battle_playback_move_shot` / `battle_playback_siege` / `view_adapter_battle` | 9 / 6 / 16 / 13 passed, EXIT 0 (renderer bez zmian) |
| `engine`: `bridge_contract`, `p6_k5loop_wiring_b`, `p6_k5loop_wiring_b_pin` | 10 / 15 / 2 passed, EXIT 0 (engine bez zmian) |

Testy `siege_battle_client.rs` (scenariusz `p6_zdobycie_miasta_a_bridge.rs`: gracz oblega obwarowaną palisadą stolicę
z taranem, seed 11):

| Test | Co sprawdza |
|---|---|
| `e2e_16ms_do_konca_zdobycie_miasta_i_mapa_zgodna_z_mostem` | Start → kroki 16 ms do końca → Finish ze sceną: brak `OutOfOrder`/błędów playbacku; liczba akcji źródła = klienta = sesji wołanej bezpośrednio; kolejka playbacku pusta po Finish; 0 `GetRenderFrame` w trakcie bitwy, dokładnie 1 po wyniku; miasto zdobyte w stanie mostu i w klatce klienta; usunięte jednostki nie występują w klatce ani stanie; `SiegeAfterUi::Captured` |
| `e2e_kroki_nieregularne_rowne_16ms` | kroki [7.5, 40.25, 1000, 3, 250] = 16 ms: wynik, multizbiór akcji, HP playbacku, etykiety, stan, klatka |
| `e2e_pomin_i_determinizm` | Start → 16 ms → Skip → Finish: akcje = sesja bezpośrednia; dwa przebiegi identyczne (strumień, HP, ślad sceny); Pomiń = czas rzeczywisty (wynik, stan); HP po snapshot = HP ramki silnika |
| `e2e_bez_sceny_ten_sam_wynik` | tryb bez sceny = ten sam strumień, wynik i stan |
| `stan_ui_po_bitwie` | panel oblężenia zamknięty na starcie, UI mapy nietknięte w trakcie, po bitwie: brak zaznaczenia/hovera, `Cleared`, brak wymuszonej jednostki; klatka klienta = klatka mostu z tym UI |
| `faza_bitwy_not_finished_i_odmowy_bez_wolania_silnika` | Finish przed końcem = `NotFinished`, bitwa zostaje; drugi Start, Step/Skip po końcu, komendy bez bitwy — bez wołania silnika |
| `create_session_i_bledy_startu` | `CreateSession` (scenariusz startowy bez miasta wroga): Start = jawny błąd silnika, brak bitwy, UI bez zmian; bez sesji mapy = `NoSession` bez wołania |
| `aborted_sprzata_bitwe` | `Aborted` (źródło skryptowe z nagranymi odpowiedziami mostu): bitwa i scena porzucone, wyjście UI, brak odświeżenia stanu (1 klatka za zmianę UI), nowy szturm startuje czysto |
| `naruszenie_kolejnosci_odrzucone_przed_scena` | odpowiedź z akcją wcześniejszą niż ramka startu: `Order(OutOfOrder)`, strażnik, liczniki i ślad sceny bez zmian |
| `straznik_kolejnosci` | równe czasy przechodzą; malejące w odpowiedzi, ramka wcześniejsza niż akcje i `NaN` odrzucane; wszystko-albo-nic |
| `setup_sceny_z_odpowiedzi_startu` | D-1I6-3/3b: komórka spawnu = `from` pierwszego kroku albo ramka; `ClimbWall` na starcie = spawn z `from` poza koroną muru; HP/morale/amunicja/strona/kolory; błędy: brak wyglądu, brak strony, zła strona, brak ramki, start z `Kill` |
| `finish_odtwarza_wstrzymane_akcje` | `Finish` (bez ramki) z akcją wstrzymaną za ostatnią ramką (D-WIRB-6 v2): zagrana przed zamknięciem bitwy, kolejka playbacku pusta, ostatnie wywołanie sceny = ta akcja |
| `after_siege_ui_galezie` | kolejność gałęzi `afterSiegeUi` |
| `nowa_sesja_porzuca_bitwe` | `on_session_created` porzuca bitwę |

`CreateSession` vs scenariusz: scenariusz startowy `CreateSession` nie ma miasta wroga ani oblężenia, a most nie ma
`Load` (#375), więc stan oblężenia trafia do mostu przez `CivEngineAdapter::from_game` (jak w testach silnika);
`CreateSession` sprawdzany osobno.

`SiegeSceneStatic` w teście: z biblioteki silnika dla tego samego stanu (`prepare_storm` + `rebuild`: siatka pola po
wycięciu, paleta, rodzaj obwarowania i rzędy wież, `siege_wall_civ(None, defCiv)`, `morale_max` i nazwy z ciała pętli,
`tower_projectile_kind` strzelca wieży). `category = "INFANTRY"` jest wartością testową (tylko routing modelu);
`max_hp` / `ammo_max` = wartości startowe sceny (w scenariuszu każda jednostka startuje z pełnym HP i amunicją;
asercja HP > 0).

## 6. Mutanty

Skrypt `01-operator-mutanty.py` (werdykt = `cargo test --test siege_battle_client`).

Wynik końcowy (przebieg na commicie `da87d95e1`): **22/22 ZABITE, 0 równoważnych, 0 przeżyło.** Pierwszy przebieg: M07 i M21 przeżyły (scenariusz nie miał akcji w `Finish` ani `ClimbWall` na starcie); dodane testy `finish_odtwarza_wstrzymane_akcje` i `ClimbWall` w `setup_sceny_z_odpowiedzi_startu`, potem oba ZABITE. Kolumna werdyktu skrócona do 220 znaków.

| ID | Mutacja | Werdykt |
|---|---|---|
| M01 | straznik: rowny czas odrzucony | ZABITY after_siege_ui_galezie,e2e_bez_sceny_ten_sam_wynik,e2e_kroki_nieregularne_rowne_16ms,faza_bitwy_not_finished_i_odmowy_bez_wolania_silnika,e2e_16ms_do_konca_zdobycie_miasta_
| M02 | straznik: NaN przechodzi | ZABITY straznik_kolejnosci |
| M03 | straznik: nie wszystko-albo-nic (czas przesuwany w petli) | ZABITY straznik_kolejnosci |
| M04 | straznik: ramka pominieta | ZABITY straznik_kolejnosci |
| M05 | Pomin bez apply_snapshot (D-1I6-4) | ZABITY e2e_pomin_i_determinizm |
| M06 | akcje nie liczone | ZABITY e2e_16ms_do_konca_zdobycie_miasta_i_mapa_zgodna_z_mostem,e2e_pomin_i_determinizm |
| M07 | akcje Finish (bez ramki) nie odtworzone | ZABITY finish_odtwarza_wstrzymane_akcje |
| M08 | kolory wlascicieli zamienione | ZABITY setup_sceny_z_odpowiedzi_startu |
| M09 | brak cofniecia startu (pole spawnu = ramka startu, D-1I6-3b) | ZABITY e2e_16ms_do_konca_zdobycie_miasta_i_mapa_zgodna_z_mostem,e2e_kroki_nieregularne_rowne_16ms,aborted_sprzata_bitwe,e2e_bez_sceny_ten_sam_wynik,e
| M10 | start z obrazeniami nie odrzucony | ZABITY setup_sceny_z_odpowiedzi_startu |
| M11 | po bitwie zaznaczenie zostaje | ZABITY aborted_sprzata_bitwe,stan_ui_po_bitwie |
| M12 | wynik bez GetRenderFrame (StateChanged zignorowane) | ZABITY after_siege_ui_galezie,e2e_bez_sceny_ten_sam_wynik,e2e_kroki_nieregularne_rowne_16ms,e2e_16ms_do_konca_zdobycie_miasta_i_mapa_zgodna_z_mostem,e2e_pomin
| M13 | Aborted nie zamyka bitwy | ZABITY aborted_sprzata_bitwe |
| M14 | krok po koncu bitwy wolany w silniku | ZABITY faza_bitwy_not_finished_i_odmowy_bez_wolania_silnika |
| M15 | drugi start w trakcie bitwy | ZABITY faza_bitwy_not_finished_i_odmowy_bez_wolania_silnika |
| M16 | panel oblezenia nie zamykany na starcie | ZABITY stan_ui_po_bitwie |
| M17 | afterSiegeUi: kolejnosc galezi (mur przed zdobyciem) | ZABITY after_siege_ui_galezie |
| M18 | afterSiegeUi: brak galezi cichej | ZABITY after_siege_ui_galezie |
| M19 | zamknieta scena nie zachowana | ZABITY after_siege_ui_galezie,e2e_bez_sceny_ten_sam_wynik,e2e_kroki_nieregularne_rowne_16ms,e2e_16ms_do_konca_zdobycie_miasta_i_mapa_zgodna_z_mostem,e2e_pomin_i_determinizm,finish_
| M20 | nowa sesja nie porzuca bitwy | ZABITY nowa_sesja_porzuca_bitwe |
| M21 | pole na murze z ramki zamiast sprzed wspinaczki | ZABITY setup_sceny_z_odpowiedzi_startu |
| M22 | Pomin bez odtworzenia do ramki | ZABITY e2e_pomin_i_determinizm |

## 7. Commity

Gałąź `rust-port-wip/p4-1i6-siege-battle-client` nad `a5fdb91b8` (bez trailerów `Co-Authored-By`, z `Claude-Session`;
`git diff --check` czysty):

| SHA | Opis |
|---|---|
| `ace976672` | klient wołający komend bitwy oblężniczej + E2E (WIP) |
| `2855fc698` | clippy (`Box` wyniku), kolejka pusta po Finish, skrypt mutantów |
| `da87d95e1` | testy `Finish` z wstrzymanymi akcjami i `ClimbWall` na starcie (zabijają M07, M21) |
| (ten commit) | raport `01-operator-r1.md` |

Pliki (`git diff --name-only a5fdb91b8..HEAD`): `rust-port/client/src/lib.rs`,
`rust-port/client/tests/siege_battle_client.rs`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1/*`
— wyłącznie allowlista. Brak `#[ignore]`.

## 8. Długi

| ID | Opis |
|---|---|
| D-1I6-SETUP | Most nie niesie `BattleSetupDto` dla bitwy oblężniczej (siatka, mur/wieże, `siegeCiv`, kategoria/model/maksima jednostek). W produkcji (Tauri) scena wymaga producenta w silniku (np. pole `setup` w odpowiedzi `StartSiegeStorm` z `SiegeBattleSession::field()` + rosterów) — temat silnika poza allowlistą. Do tego czasu klient działa bez sceny albo z `SiegeSceneStatic` od wołającego. |
| D-1I6-ERR | `BridgeError` niesie `SiegeBattleError` tylko jako tekst (`EngineRejected`); `NotFinished`/`Aborted` są mapowane z tekstu `Display` u wołającego. Typowany kod błędu bitwy w moście = temat silnika (`CONTRACT_VERSION`). |
| D-1I6-ABORT-E2E | `Aborted` nie jest dziś osiągalny przez most ze szturmu gracza na `PlayableState` (źródła: `outcome.unported`, `LoopUnsupported`, błąd zastosowania); test używa źródła skryptowego z nagranymi odpowiedziami mostu. |
| D-1I6-FIXTURE | `category` i `max_hp`/`ammo_max` w `SiegeSceneStatic` testu to wartości testowe/startowe (patrz §5), do zastąpienia przez producenta D-1I6-SETUP. |
| D-1I6-SPAWN-FACING | Kierunek spawnu = kierunek ramki startu (akcja `Facing` startu z `t0 <= 0` i tak go ustawia przed pierwszą klatką; różnica tylko w zerowym czasie). Dokładna wartość spawnu przyjdzie z D-1I6-SETUP. |
| (bez zmian) | długi K5LOOP-WIRING-B / ZDOBYCIE-MIASTA-A (D-WIRB-1-PERF, SERDE-U64-KEYS, RNG-LICZNIK, ZMA-DL-*) |
