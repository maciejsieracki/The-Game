# R-RUSTPORT-P4-1I6-DLUGI-Q1: Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I6-DLUGI-Q1 (#396, długi klienta bitwy oblężniczej I6)
GOAL: odpowiedź StartSiegeStorm niesie BattleSetupDto z silnika (klient nie składa sceny), błąd bitwy jako typ,
      porzucenie bitwy w silniku po błędzie sceny po stronie klienta (Aborted osiągalne przez most)
ZMIANY/COMMIT: gałąź rust-port-wip/p4-1i6-dlugi-q1 nad origin/rust-port/parity-v2 = 0522ad6df;
               kod: 470eb1d8a, ad6522829, 95be7d54d (ostatni commit kodu = 95be7d54d); raport: commit z tym plikiem
               (SHA w odpowiedzi Operatora). Pliki: engine/src/bridge.rs, engine/src/domain/siege_battle_apply.rs,
               engine/tests/bridge_contract.rs, engine/tests/p4_1i6_dlugi.rs (nowy), client/src/lib.rs,
               client/tests/siege_battle_client.rs — wszystkie w allowliście
TESTY: §6 (engine fmt/clippy/bramki EXIT 0; client fmt/clippy/test EXIT 0; mutanty 25/25 zabite;
       pełny test silnika partiami EXIT 0: 4206 passed / 0 failed / 1 ignored sprzed tematu; renderer: NIE ODTWORZONO,
       dysk < 12 GB)
BLOKADY: brak blokujących; bramka renderera nieodtworzona (dysk 3.7–4.8 GB < 12 GB; renderer 0 zmian)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista

* Dispatch: `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-DLUGI-Q1/00-dispatch.md`.
* BAZA: `origin/rust-port/parity-v2` = `0522ad6df484622ad92c8f5d42956fc1ec061423` (zgodna z dispatchem),
  `git checkout -B rust-port-wip/p4-1i6-dlugi-q1 origin/rust-port/parity-v2`.
* `git diff --stat 0522ad6df HEAD` (kod): `client/src/lib.rs` (+/-349), `client/tests/siege_battle_client.rs` (+/-780),
  `engine/src/bridge.rs` (+/-63), `engine/src/domain/siege_battle_apply.rs` (+519), `engine/tests/bridge_contract.rs`
  (+/-31), `engine/tests/p4_1i6_dlugi.rs` (+694, nowy). `renderer/*`, `view-model/*`, `src-tauri`, `gra/`,
  `playable.rs`, `siege_battle_session.rs`, `siege_tactics_loop.rs`, `city_capture_apply.rs`: 0 zmian.
* `git diff --check`: czysto. `#[ignore]`: 0. Trailery: tylko `Claude-Session:`.

## 2. Web najpierw (pin `07d2fbd72`)

| Pin | Co mówi | Rust |
|---|---|---|
| `main.ts:36980-37018` `new BattleScene({ attacker: rosterToBattleUnits(atkRosterRef, 0xffd54a), defender: rosterToBattleUnits(defRosterRef, 0xc84040), deploy: atkRosterRef.some(isGeneral), deployPlayerSide: 'atk', siege: { defCiv: ikonaIdToBronzeCiv(defCivId), builtBuildingIds } , onCancel })` | scena = jednostki obu stron z kolorem strony, `deploy` tylko z generałem, strona gracza `atk`, mur z `defCiv` | `battle_setup` (siege_battle_apply.rs): `deploy = atk_roster.any(is_general).then_some(Atk)`, `player_side = Atk`, kolory `SIEGE_ATTACKER_COLOR`/`SIEGE_DEFENDER_COLOR` (przeniesione z klienta do silnika) |
| `main.ts:34136-34143` `rosterToBattleUnits` | `runtimeToBattleUnit` + `armyLeaderMoraleBonusFrac` | `scene_battle_units` = te same wywołania co `SiegeBattleSession::prepare` (`collect_siege_rosters` → cap `BATTLE_MAX_PER_SIDE` → `roster_to_battle_units`) |
| `battleScene.ts:3480` `(opts.siege.defCiv ?? opts.siege.civ) ?? 'rzym'` | ścieżka szturmu podaje tylko `defCiv` | `siege_civ = input.def_civ ?? "rzym"` |
| `game/city-towers.ts:23-27` `towerMaterialFor`, `battleScene.ts:4158-4170` `_placeSiegeTowers` | palisada → drewno, mur → kamień, wieże tylko z materiałem | `fort_dto` + `field().siege.tower_rows` (T5a) |
| `battleScene.ts:4133-4147`, `:4209-4211` `_fireOneTower` / `towerShooterRow` | pocisk wieży = `projectileKind({kategoria: Typ ?? 'Distance', nazwa: 'Wieza (' + Jednostka ?? 'Strzelec' + ')'})`; brak wiersza = brak strzałów | `SiegeTowerShooterDto { typ, jednostka }` z `strongest_ranged_unit_for_era(units, clampEra(defenderEra), defCiv)`; klient: `tower_projectile_of` → `tower_projectile_kind` renderera |
| `BattleUnitSpawnDto` (`view-model/battle.rs`): `String(bu.stats?.Jednostka ?? bu.nazwa)`, `bu.kategoria`, `bu.maxHp`, `ammoMax = ammoCount(bu)` | | `setup_unit().jednostka ?? nazwa`, `kategoria`, `max_hp`, `ammo_count()` (∞ → `None`) |
| `main.ts:37017-37023` `onCancel: () => setMood('mapa')`; komentarz #50: „anulowanie deployu (onCancel) machin nie traci” | jedyne wyjście ze sceny bez wyniku: stan bez zmian, machiny nie zużyte | `AbortSiegeBattle` = zamknięcie bez wyniku, stan i machiny bez zmian (D-1I6D-3); dozwolone tylko zaraz po starcie (D-1I6D-4) |

Gameplay spoza webu: brak. Porzucenie jest technicznym wyjściem z błędu sceny klienta (odpowiednik `onCancel`), nie
ścieżką gracza; ucieczka z trwającej/zakończonej bitwy jest odrzucana (D-1I6D-4).

## 3. Decyzje techniczne (do wpisu w REJESTR-RUST.md)

* **D-1I6D-1 (setup addytywnie w `siegeBattle`).** `SiegeBattlePayload.setup: Option<BattleSetupDto>` (klucz `setup`
  tylko w odpowiedzi `StartSiegeStorm`, `skip_serializing_if`), producent `siege_battle_apply::battle_setup` czyta sesję
  po `SiegeBattleSession::prepare` i przed `play()` (`start_payload` = `prepare` → setup → `play`, identycznie jak
  `start`). `CONTRACT_VERSION` bez zmian (1): stare odpowiedzi bez klucza, stare komendy bez zmian. Sesja nie
  przechowuje `BattleUnit` (plik sesji poza zakresem), więc `kategoria`/`maxHp`/`Jednostka`/`ammoCount` liczone są
  ponownie tymi samymi wywołaniami adaptera co `prepare` (deterministycznie, klucz `(strona, id rosteru)`);
  pozycja/kierunek/korona/HP/morale/amunicja z ramki sesji przed `play` (`session_frame`), `moraleMax` z ciała.
* **D-1I6D-2 (strzelec wieży).** `SiegeBattlePayload.tower_shooter: Option<SiegeTowerShooterDto>` (tylko start):
  `BattleSetupDto` (view-model, `deny_unknown_fields`) nie ma pola na pocisk wieży, a `PlaybackOpts::tower_projectile`
  go potrzebuje; view-model nietknięty.
* **D-1I6D-3 (porzucenie bez pliku gry).** `PlayableGame` trzyma bitwę prywatnie i daje tylko `&ActiveSiegeBattle`
  (`playable.rs` poza allowlistą, równolegle dotykany przez ZDOBYCIE-MIASTA-B). `AbortSiegeBattle` ustawia więc flagę
  `ActiveSiegeBattle::request_abort` (`AtomicBool`, `Send`+`Sync`, klon zachowuje flagę, `PartialEq` ją porównuje) i woła
  istniejące wyjście D-WIRB-8: `finish_siege_battle` → `finish` zwraca `AbortRequested` → gra zamyka bitwę bez zmiany
  stanu i zwraca `Aborted`; most zamienia ten oczekiwany `Aborted` na sukces `siegeBattle.phase = aborted` (bez
  `StateChanged`). Licznik bitew (ziarno RNG D-WIR-5) zostaje zwiększony jak przy każdym `Aborted`.
* **D-1I6D-4 (bez ucieczki przed wynikiem).** `request_abort` po pierwszym `Step`/`Skip` (`ops` niepuste) =
  `AbortNotAllowed { city_id }`, flaga nieustawiona, bitwa trwa. Web nie ma wyjścia z trwającej bitwy bez wyniku.
* **D-1I6D-5 (błąd jako typ).** `SiegeBattleErrorDto` (`#[serde(tag = "code")]`, `snake_case`, pola `camelCase`): kod +
  dane każdego wariantu `SiegeBattleError`; `Session`/`Adapter`/`Producer` niosą `detail` (typy wewnętrzne poza
  kontraktem), `NotFinished` ma własny kod. `BridgeError.siegeBattle: Option<…>` addytywnie (tylko odrzucone komendy
  bitwy; `code = engine_rejected`, `message` = ten sam `Display` co wcześniej — testy tekstowe bez zmian). `Display` DTO =
  tekst błędu biblioteki dla każdego wariantu (test). Klient: `SiegeSourceError::Battle` i `SiegeClientError::Engine`
  niosą DTO; `is_not_finished(&dto)`.
* **D-1I6D-6 (klient bez kompozycji).** Usunięte z klienta: `compose_siege_battle_setup`, `SiegeSceneStatic`,
  `SiegeUnitLook`; `start_siege_storm(city, unit, with_scene: bool)` buduje scenę z `p.setup` przez adapter renderera.
  Cofnięcie ramki startu (dawne D-1I6-3b) zostało w teście klienta wyłącznie jako niezależna kontrola zgodności setupu
  silnika (`setup_silnika_rowny_cofnieciu_ramki_startu`, seedy 11/12/13: równość pełna, w tym kierunku).
* **D-1I6D-7 (porzucenie po błędzie sceny).** `Setup` (brak setupu) / `Adapter` (renderer odrzuca setup) po starcie w
  silniku → klient wysyła `AbortSiegeBattle`; sukces: koniec `SiegeBattleEnd::Aborted { reason: "siege battle setup:
  …" }`, brak bitwy, `last_siege_battle_view = None`, UI bez zmian, błąd źródłowy zwrócony; porażka abort: nowy
  `SiegeClientError::AbortFailed { cause, abort }`. Klient nie wystawia publicznego „porzuć bitwę” (gameplay).

## 4. Tabela długów D-1I6-*

| Dług | Stan | Dowód |
|---|---|---|
| D-1I6-SETUP | **ZAMKNIĘTY** | `start_niesie_setup_sceny_wg_pinu`, `setup_to_rozstawienie_przed_play`, `setup_tylko_w_odpowiedzi_startu_i_deterministyczny`, `strzelec_wiezy_i_mur_kamienny` (engine); `setup_silnika_rowny_cofnieciu_ramki_startu`, `scena_z_setupu_silnika`, E2E z `with_scene = true` (client) |
| D-1I6-ERR | **ZAMKNIĘTY** | `blad_bitwy_jako_typ_obok_tekstu`, `kazdy_wariant_bledu_ma_kod_i_ten_sam_tekst` (20 wariantów), `bridge_contract` (`siegeBattle` w JSON błędu, brak klucza dla innych błędów); client `bledy_silnika_typowane_w_kliencie`, `create_session_i_bledy_startu` (typowane `CityNotFound` zamiast tekstu) |
| D-1I6-ORPHAN | **ZAMKNIĘTY** | client `blad_setupu_porzuca_bitwe_w_silniku_e2e` (brak setupu i zepsuta siatka: `start` → `abort`, w silniku `Step` = `noActiveBattle`, stan i machiny bez zmian, brak `StateChanged`, nowy szturm do wyniku), `nieudane_porzucenie_to_abort_failed` |
| D-1I6-ABORT-E2E | **ZAMKNIĘTY** | `AbortSiegeBattle` przez most (`abort_po_starcie_zamyka_bitwe_bez_zmiany_stanu`, `abort_przez_mock_adapter`, `zadanie_porzucenia_w_grze`) + E2E klienta jw.; `Aborted` z `Finish` przez most: `zadanie_porzucenia_w_grze` (biblioteka) i istniejący `aborted_sprzata_bitwe` (skrypt) |
| D-1I6-DOC | **ZAMKNIĘTY** | doc-komentarz `last_siege_battle_view` rozróżnia: `Aborted` z błędu `Finish` / porzucony start → `None`; odpowiedź `Finish` bez wyniku → ekran zachowany (`finish_bez_wyniku_to_aborted`) |
| D-1I6-FIXTURE | **ZAMKNIĘTY** | `category`/`max_hp`/`ammo_max` z silnika (`units.json` przez adapter), fikstura usunięta z testu klienta; typ strzelca wieży z wiersza (wcześniej `None`) |
| D-1I6-SPAWN-FACING | **ZAMKNIĘTY** | kierunek spawnu = pozy sesji przed `play` (`setup_to_rozstawienie_przed_play`); równy kierunkowi ramki startu w scenariuszu (seedy 11–13) |
| D-1I6-RENDERER-GATE (nowy dla tej rundy) | **ZOSTAJE** | bramka renderera nieodtworzona (dysk); renderer 0 zmian, kompiluje się jako zależność klienta (clippy/test klienta EXIT 0) |
| D-1I6D-NOWALL (nowy, informacyjny) | **ZOSTAJE (bez zmiany zachowania)** | miasto bez obwarowań: szturm = `Adapter(CityWithoutWall)` przed otwarciem bitwy (stan sprzed tematu; `bez_obwarowan_blad_adaptera_bez_bitwy`); gałąź `FortKind::None` producenta nieosiągalna przez most |

## 5. Testy nowe / zmienione

* `engine/tests/p4_1i6_dlugi.rs` (13): setup wg pinu (palisada, mur), setup = rozstawienie przed `play`, setup tylko w
  starcie + determinizm + JSON, strzelec wieży, brak muru = typowany błąd bez bitwy, typy błędów (bez bitwy, brak
  miasta z JSON `{"code":"city_not_found","cityId":4242}`, `not_finished`, `battle_in_progress`, błąd mapy bez
  `siegeBattle`), 20 wariantów DTO (kod, dane, tekst, round-trip), abort po starcie (stan, machiny, brak zdarzenia,
  ponowny start), abort po kroku/końcu odrzucony i wynik identyczny jak bez próby, abort na mock adapterze, flaga w
  grze/klonie, abort bez `StateChanged`.
* `engine/tests/bridge_contract.rs`: komenda `abort_siege_battle` w wyczerpującym `command_index` i w kształcie drutu;
  `siegeBattle` w JSON błędu bitwy; błąd nie-bitwy ma klucze `["code", "message"]`.
* `client/tests/siege_battle_client.rs` (21, było 18): usunięte `setup_sceny_z_odpowiedzi_startu` i
  `setup_spawn_komorka_i_mur_przed_akcjami_startu` (testowały usuniętą kompozycję klienta; ich treść żyje jako
  kontrola `rewound_setup`); nowe: `setup_silnika_rowny_cofnieciu_ramki_startu`, `scena_z_setupu_silnika`,
  `blad_setupu_porzuca_bitwe_w_silniku_e2e`, `nieudane_porzucenie_to_abort_failed`, `bledy_silnika_typowane_w_kliencie`;
  źródło mostu mapuje `BridgeError.siegeBattle` (koniec parsowania tekstu).

## 6. Bramki (CARGO_INCREMENTAL=0, DEBUG=0, `CARGO_TARGET_DIR` w scratchpadzie)

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --all -- --check` | EXIT 0 |
| engine `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine `bridge_contract` / `p4_1i6_dlugi` / `p6_k5loop_wiring_b` / `p6_k5loop_wiring_b_pin` / `p6_zdobycie_miasta_a` / `p6_zdobycie_miasta_a_bridge` | 10 / 13 / 15 / 2 / 6 / 7 passed, EXIT 0 |
| client `cargo fmt --all -- --check` | EXIT 0 |
| client `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| client `cargo test --all-targets` | lib 0, `engine_bridge_renderer` 18, `siege_battle_client` 21 passed, EXIT 0 |
| renderer (gpu OFF) | kompilacja jako zależność klienta: EXIT 0; własne fmt/clippy/test: NIE ODTWORZONO (dysk 3.7–4.8 GB < 12 GB; renderer 0 zmian) |
| engine pełny `cargo test --no-fail-fast` (lib/bins/benches/examples + 550 testów integracyjnych partiami po 30, binaria partii usuwane — dysk < 4 GB) | §6.2 |

### 6.1 Mutanty (`01-operator-mutanty.py`, plik przywracany z pamięci, `git status` czysty po przebiegu)

25/25 ZABITE: M01 deploy z `!isGeneral`, M02 `player_side` Def, M03 stały `siege_civ`, M04 palisada = kamień, M05
puste `tower_rows`, M06 kolor atakującego = obrońcy, M07 `ammo_max` zawsze `None`, M08 setup nie dołączony, M09
strzelec wieży zawsze `None`, M10 `typ`↔`jednostka`, M11 `finish` ignoruje flagę, M12 abort po kroku dozwolony, M13
klon gubi flagę, M14 `NotFinished` jako `Session`, M15 inny tekst `NotFinished`, M16 most bez typu błędu, M17 Abort
emituje `StateChanged`, M18 abort zwraca city 0, M19 abort bez `request_abort`, M20 klient bez abort po błędzie sceny,
M21 abort bez końca `Aborted` (pierwsze uruchomienie: kotwica niejednoznaczna, poprawiona i uruchomiona osobno →
ZABITY), M22 pocisk wieży zawsze `None`, M23 `AbortFailed` zgubiony, M24 setup ignorowany, M25 `Aborted` z `Finish`
nierozpoznany. Równoważne: brak (rozważony i niezgłoszony jako mutant: `swap(false)` → `load` w `finish` — flaga
zostaje w bitwie, która i tak jest usuwana z gry; równoważny, poza listą).

### 6.2 Pełny test silnika

`cargo test --no-fail-fast` silnika na kodzie `95be7d54d` (skrypt partii: `--lib --bins --benches --examples`, potem
550 plików `tests/*.rs` w 19 partiach po ≤ 30 `--test`, binaria partii usuwane po przebiegu; checkout zawiera
`dyspozycje/`): **EXIT 0**, 552 przebiegi `test result`, **4206 passed, 0 failed, 1 ignored** (ignorowany test sprzed
tematu: `p6_order_lane::e2e::dump_tick1_econ_for_web_generator`, generator wektorów), 0 linii `FAILED`/`error`.

## 7. Długi i ryzyka (sekcja „Długi”)

* D-1I6-RENDERER-GATE: odtworzyć bramkę renderera przy integracji (≥ 12 GB).
* D-1I6D-NOWALL: informacyjnie (zachowanie sprzed tematu).
* Koszt startu: `StartSiegeStorm` liczy rostery dwa razy (setup + sesja) — O(roster), NIE_ZMIERZONO w release.
* Integracja: `siege_battle_apply.rs` może się zderzyć z ZDOBYCIE-MIASTA-B (diff tematu: importy, wariant błędu,
  pola `SiegeBattlePayload`, `request_abort`, producent setupu, sprawdzenie flagi na początku `finish`).

## 8. Sprzątanie

`CARGO_TARGET_DIR` (`scratchpad/tgt-1i6d`) usunięty po bramkach. Brak push, brak integracji, brak deployu.
