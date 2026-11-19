# R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE — Operator r1

STATUS: PASS-WITH-NOTES (Operator; noty: zmiany wymuszone w testach r4/T2a/T2b/I5a §5, decyzja D-I5B-13 o obrażeniach nieskończonych §1)
DOMAIN: GAME (port Rust: DTO akcji bitwy, silnik, renderer)
TEMAT: R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE (#370 I5b)
GOAL: warianty `BattleActionKindDto` dla `Leave`, `Shaken`, `ClimbWall`, `Boulder`, `WallDamage`, `Ram`, `GateDamage`,
`WallBreach`, `GateBreach`, `TowerDestroyed`, `LeaveField` z walidacją; `actions_to_dto` bez żadnego błędu „bez DTO”;
konsument w `renderer/src/battle/playback.rs` (wyczerpujący `match`, bez `_ =>`, bez `#[non_exhaustive]`, D-WIR-8); scena po
odtworzeniu akcji = scena z wywołań pinu `07d2fbd72`.
BAZA: `origin/rust-port/parity-v2` = `24c8f3b75518c0b60eeda19ca28bfc656d6e9672` (zgodna z dispatchem).
GAŁĄŹ: `rust-port-wip/i5b-battle-actions-siege` (worktree `wf_54962e71-cdc-1`).
ZMIANY/COMMIT: kod do `0c57ebe7c` (ostatni commit kodu); raport w commicie następnym na tej samej gałęzi. Commity WIP:
`3df1cc9af` (szkic raportu), `23264e947` (view-model), `4091e9af0` (engine + sweepy), `ff97e333f` (renderer),
`2521ee1ac` (test renderera), `d1e2d3eee` (test zejścia bez wolnego pola), `0c57ebe7c` (numery linii pinu).
RUNDY: 1/5.
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje).

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`) i decyzje D-I5B

| Akcja | Pin | Kształt DTO (D-I5B-n) | Konsument (renderer) |
|---|---|---|---|
| `Leave` | `_fleeStep` → `_removeUnitFromScene` `:9845-9925` (usunięcie w `done()` ostatniego kroku `:9884-9890`) | D-I5B-1 `{id}` | `remove_unit_from_scene`; krok w locie dokańczany w `t0` przed usunięciem (pin usuwa po `p >= 1`) |
| `Shaken` | `_shakeAlliesOnLoss` `:9743-9753` (`_updateMoraleBar(a)` `:9749`) | D-I5B-2 `{id, fallen, morale}`; morale skończone `>= 0`, `id != fallen` | `update_morale_bar` |
| `ClimbWall` | `_trySiegeTowerClimb` `:8056-8082` (`ru.q = wallCol` `:8070`, wiersz bez zmian, model `(x, 2.5, z)`) | D-I5B-3 `{id, fromCol, fromRow, toCol, toRow}`; indeksy `>= 0`, wiersz stały, kolumna zmieniona | `climb_onto_wall_walkway`; kontrola `from` = pole jednostki, `to = (wallCol, fromRow)`, start obok podstawy (`:8062`) |
| `Boulder` | `_attackWallTile` `:7540-7552`, `_spawnCatapultBoulder` `:7571-7601`, trafienie `_schedule(700)` `:7555` | D-I5B-4 `{id, row, landAt}`; `landAt >= t0` | `wall_shot_endpoints` + `Boulder::spawn`; kontrola `landAt == t0 + 700` (obie strony) |
| `WallDamage` | callback `:7556-7561`, etykieta `'-' + dmg + ' (mur)'` `#ff8800` | D-I5B-5 `{row, dmg, hpAfter}`; `dmg > 0`, `hpAfter >= 0` | `WallLabel` (`FloatLabel::wall`) + śledzone HP kafla |
| `Ram` | `_attackGate` `:7310-7323`, `_animateRam` `:7337-7360` (`duration = 320` `:7343`) | D-I5B-6 `{id, until}`; `until >= t0` | `RamAnim::start` z pozycji grupy taranu ku `(siegeGateCol, siegeGateRow)`; kontrola `until == t0 + 320` |
| `GateDamage` | `gateHp = Math.max(0, gateHp - dmg)` `:7326-7331` | D-I5B-7 `{dmg, hpAfter}` | śledzone HP bramy (HUD = P5) |
| `WallBreach` | `_breachWallTile` `:7638-7697` (etykieta `'MUR WYBURZONY!'` `#ff4400` `:7649`) | D-I5B-8 `{row}` | `breach_wall_tile` (bez wieży — ta jest osobną akcją przed) |
| `GateBreach` | `_breachGate` `:7757-7801` | D-I5B-9 `{}` (wariant strukturalny bez pól: serde przy wariancie jednostkowym ignoruje obce klucze mimo `deny_unknown_fields`; zmierzone testem `scisle_klucze_i_typy`) | `breach_gate` |
| `TowerDestroyed` | `_destroyTowerAtRow` `:4194-4200` | D-I5B-10 `{row}` | `destroy_tower_at_row`; brak żywej wieży = `NoTower` |
| `LeaveField` | obrońca schodzi z wyburzonego kafla `:7699-7741` (`to == from` gdy brak wolnego pola `:7717`, tylko `onWallWalkway = false` `:7739`) | D-I5B-11 `{id, fromCol, fromRow, toCol, toRow}` | `retreat_from_wall` gdy `to != from`, inaczej tylko flaga (model zostaje na koronie) |

Pozostałe decyzje techniczne:
- **D-I5B-12**: dokładne równości czasów z pinu (`+700`, `+320`) i granice siatki (`BF_COLS × BF_ROWS` dla pól jednostek) sprawdza
  konsument renderera (jak `arriveAt`/`landAt` w I5a); view-model sprawdza skończoność, `>= t0` i indeksy `>= 0`. Wiersze muru nie
  mają kontroli granic w rendererze, bo pin ich nie ma (`_breachWallTile` przyjmuje np. wiersz 158 spoza siatki — wektor fikstury).
- **D-I5B-13**: obrażenia nieskończone (`wallAttack: Infinity` w wektorach T2b → `Math.max(1, Math.round(Infinity))`, `:7545`,
  `:7508`) nie mają zapisu w JSON; `actions_to_dto` kończy się wtedy jawnym `ActionError::Invalid(NonFinite{actions[k].action.dmg})`
  (bez cichego pominięcia). Zmierzone: 66 przypadków w wektorach T2b; prefiks przed taką akcją przechodzi 1:1. Dane gry (units.json)
  nie mogą zawierać `Infinity`.
- **D-I5B-14**: `End` ustawia flagę `finished` playbacku (pin `this.finished = true` `:10210`, `:9468`, `:9489`); kamień w locie znika,
  a taran wraca do pozycji startowej przy następnej klatce (`:7347`, `:7585`). `SceneCall::Ui` dla `End` zastąpione `SceneCall::Finished`.
- **D-I5B-15**: `Kill` katapulty obrońcy stojącej na wyburzonym kaflu (`_breachWallTile` → `_startFade(u)`, `:7702-7704`) nie jest
  ciosem — pin nie rusza paska HP. Playback zaznacza przy `WallBreach` obrońców na tym polu (z tym samym `t0`) i dla ich `Kill`
  pomija pasek HP; znacznik wygasa przy akcji z innym `t0` i przy `LeaveField` tej jednostki. Test fikstury (wiersz 73: `def40`,
  `def47`) i `breach_mark_is_limited_to_the_tile_and_its_t0` (granice znacznika).

`gra/` nie zmieniano.

## 2. Zmiany

| Plik | Zmiana |
|---|---|
| `rust-port/view-model/src/battle.rs` | 11 nowych wariantów `BattleActionKindDto` (camelCase, `deny_unknown_fields`), walidacja w `validate_at` (`action_index`), opisy pinu. |
| `rust-port/view-model/tests/battle_actions_siege.rs` (nowy) | klucze JSON, round-trip (także czas niecałkowity), ścisłe klucze/typy, walidacja czasów (t0−1, t0, t0+1), obrażeń/HP, morale, indeksów, wejścia na mur, kolejności listy. 6 testów. |
| `rust-port/engine/src/domain/siege_tactics_actions.rs` | `actions_to_dto` 1:1 dla wszystkich wariantów; usunięte wszystkie `ActionError::*WithoutDto` (11 wariantów; `git grep WithoutDto rust-port`: 0 użyć w kodzie, 3 wzmianki w komentarzach zastąpionych testów); `Row`/`Cell` także dla nowych pól; komentarze. |
| `rust-port/engine/tests/p4_1i5b_support.rs` (nowy) | niezależna specyfikacja DTO (`expected_kind`, wyczerpujący `match` bez `_ =>`), `check_dto_1to1` (pole po polu + JSON + czasy końca z pinu), licznik wariantów, samosprawdzenie. Włączany przez `#[path]`. |
| `rust-port/engine/tests/p4_1i5b_siege_actions.rs` (nowy) | konwersja 1:1 wszystkich wariantów I5b z wartościami jawnie, `Row`/`Cell` poza `i32` (każde pole), jednostka spoza rosteru (w tym `fallen`), przeniesienie błędów walidacji (obie strony `>= t0`). |
| `rust-port/engine/tests/p6_k5loop_close_r4.rs` | **ZMIANA WYMUSZONA (§5)**: `leave_i_shaken_bez_dto_to_jawny_blad` → `leave_i_shaken_dto_1do1_w_wektorach_r4` (sweep po wszystkich wektorach r4). |
| `rust-port/engine/tests/p6_k5loop_siege_atk_a.rs` | **ZMIANA WYMUSZONA (§5)**: `wejscie_na_mur_bez_dto_jawny_blad` → `wejscie_na_mur_dto_1do1_w_wektorach` (vectors + vectors_edge). |
| `rust-port/engine/tests/p6_k5loop_siege_atk_b.rs` | **ZMIANA WYMUSZONA (§5)**: `akcje_muru_i_bramy_bez_dto_jawny_blad` → `akcje_muru_i_bramy_dto_1do1_w_wektorach` (vectors, edge, retreat; kolejność wywołań pinu). |
| `rust-port/engine/tests/p4_1i5a_move_shot.rs` | `warianty_i5b_nadal_bledem_po_ruchu` → `warianty_i5b_po_ruchu_maja_dto` (plik w allowliście). |
| `rust-port/renderer/src/battle/playback.rs` | konsument 11 wariantów; `End` → `finished`; stan: taran/kamienie w locie, etykiety muru (`WallLabel`, stałe kolorów/tekstu), HP kafli/bramy, `gate_open`, znaczniki D-I5B-15; nowe `SceneCall` i `PlaybackError` (`BoulderLandAt`, `RamUntil`, `NoSiege`, `CellOutOfGrid`, `Climb`, `NotOnWall`); klatka animacji krokuje taran i kamienie. `match` wyczerpujący, bez `_ =>`. `dynamics.rs` bez zmian. |
| `rust-port/renderer/tests/battle_playback_siege.rs` (nowy) | 10 testów: scena P (wywołania pinu) == scena Q (odtworzenie DTO) na fiksturze `tests/fixtures/battle3d/dynamics.json`. |

Nie ruszano: `siege_tactics_loop.rs`, `siege_battle_session.rs`, `siege_battle_adapter*`, `bridge.rs`, `client/`, `src-tauri/`, `gra/**`,
`Cargo.toml`, `renderer/Cargo.lock` (DŁUG-T1-LOCK: lokalne dopisy cofane przed każdym commitem), `REJESTR-RUST.md`, `dynamics.rs`,
fikstury (wystarczyły istniejące wektory webu).

## 3. Zgodność z wektorami i sceną pinu

Silnik (sweepy po WSZYSTKICH przypadkach, wyniki zmierzone):
- r4 (`vectors_r4.json`): 1:1 z `Leave` 230, `Shaken` 263 (oraz Facing 1731, Move 1467, Shot 339, Rout 355, Log 694); każdy `Shaken` po
  `Leave`/`Kill` poległego z tym samym `t0`, sojusznik z tej samej strony.
- T2a (`vectors.json` + `vectors_edge.json`): `ClimbWall` 112 = wejście z pinu (wiersz stały, kolumna = `siegeWallCol`, start obok
  podstawy); Move 1721, Facing 1106, Log 99.
- T2b (`vectors.json` + `vectors_edge.json` + `vectors_retreat.json`, 1900 przypadków): Boulder 365, WallDamage 319, Ram 167,
  GateDamage 147, GateBreach 91, WallBreach 218, TowerDestroyed 27, LeaveField 95 (+ Kill 4, Move 1300, Shot 151, Melee 91…);
  kolejność pinu: `WallDamage` w `landAt` swojego `Boulder`, `GateDamage` tuż po `Ram` (ten sam `t0`), `GateBreach` po
  `GateDamage hpAfter=0`, `WallBreach` po `WallDamage hpAfter=0` w tym wierszu, `TowerDestroyed` → `Log` (tekst
  `tower_destroyed_log`) → `WallBreach`, `LeaveField` po `WallBreach` z polem startowym w kolumnie muru. 66 przypadków D-I5B-13.
- r3: bez akcji I5b (sweep I5a bez zmian, zielony).

Renderer (`battle_playback_siege.rs`, cały `BattleScene3` P == Q w każdej próbce):
- taran (2 uderzenia fikstury): pozycja bit w bit z webem w 12 próbkach, koniec animacji w tej samej próbce; drugie uderzenie z
  `finished` (akcja `End`) — natychmiastowy powrót jak w pinie;
- kamień (wiersz 5): tor lotu bit w bit z webem, usunięcie w tej samej próbce, trafienie `_schedule(700)` z etykietą i wyłomem;
  następnie 4 wyłomy muru (67, 73 z dwiema katapultami `_startFade`, 158 poza siatką, 67 ponownie) i wyłom bramy z pętlą morale
  (ramka): kafle (RLE) = web po każdym kroku, pola i `onWall` obrońców = web, liczba gruzu = web (bez usuniętych jednostek),
  etykiety muru (tekst, kolor, dane 3D) = wywołania pinu;
- ucieczka (`flee`): zwrot rout, 2 kroki, usunięcie po ostatnim kroku, ripple `Shaken`: pozycje bit w bit z 4 klatkami webu,
  widoczność = web; drugie `Leave` = no-op;
- wejście na mur, wieża (`build_battle_scene_with_units_fort`, wieże w wierszach 66 i 70), zejście bez wolnego pola, krok w locie
  przy `Leave`, kamień przy `finished`, granice znacznika D-I5B-15, błędy (obie strony każdej równości).

## 4. Testy i bramki

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie `i5b/t-vm`,
`i5b/t-eng`, `i5b/t-ren` (usunięte po bramkach).

| Crate | Bramka | Wynik |
|---|---|---|
| view-model | `cargo fmt --check` | EXIT 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| view-model | `cargo test --all-targets` | EXIT 0 (wszystkie binarki ok; `battle_actions_siege` 6/6) |
| engine | `cargo fmt --check` | EXIT 0 |
| engine | `cargo clippy --all-targets -- -D warnings` | EXIT 0 (kompiluje wszystkie crate'y testowe) |
| engine | `cargo test --test p4_1i5b_siege_actions --test p4_1i5b_support --test p4_1i3_actions --test p4_1i5a_move_shot --test bridge_contract --test p6_k5loop_close_r2 --test p6_k5loop_close_r3 --test p6_k5loop_close_r4 --test p6_k5loop_siege_atk_a --test p6_k5loop_siege_atk_b --test p6_k5loop_siege_def --test p6_k5loop_tags_rest` | EXIT 0: 5, 1, 9, 6, 9, 6, 6, 11, 8, 10, 10, 5 passed |
| renderer (bez `gpu`) | `cargo fmt --check` | EXIT 0 |
| renderer | `cargo clippy --all-targets -- -D warnings` | EXIT 0 (start przy 12 GB wolnego, bez innego builda renderera) |
| renderer | `cargo test --all-targets` | EXIT 0: 83 binarki `ok`, 736 passed, 0 failed, 0 ignored (log `i5b/renderer_test.log`; `battle_playback_siege` 10/10, `battle_playback` 9/9, `battle_playback_move_shot` 6/6) |

Pełny `cargo test` engine nie był wymagany dispatchem (bramka = testy dotknięte + lista); NIE_ZMIERZONO w tym przebiegu.

## 5. Zmiany wymuszone poza listą „nowe pliki” (jawnie)

Dispatch dopuszcza zmianę `p6_k5loop_close_r4`, `p6_k5loop_siege_*` tylko gdy asercje oczekują starych `*WithoutDto`. Dokładnie
tak było: usunięte linie to wyłącznie trzy testy asertujące `Err(*WithoutDto)` (r4 `leave_i_shaken_bez_dto_to_jawny_blad`, atk_a
`wejscie_na_mur_bez_dto_jawny_blad`, atk_b `akcje_muru_i_bramy_bez_dto_jawny_blad`) plus nieużywane po nich importy
(`actions_to_dto`/`ActionError` w atk_a). Każdy zastąpiony silniejszym sweepem po wszystkich wektorach (§3). W atk_b `tower_destroyed_log`
jest teraz użyty do sprawdzenia tekstu `Log` po `TowerDestroyed`. Żadnej innej asercji nie osłabiono. `p6_k5loop_siege_def` bez zmian
(nie miał asercji „bez DTO”).

## 6. Mutanty (43, każdy zabity; 0 równoważnych)

Skrypt `i5b/mutants.py` (mutant → `cargo test` dotkniętych binarek → przywrócenie pliku), log `i5b/mutants.log`.

| ID | Mutant | Wynik | Zabijające testy (pierwsza czerwona binarka) |
|---|---|---|---|
| VM1 | brak `landAt >= t0` kamienia | ZABITY | `walidacja_czasow_obu_stron` |
| VM2 | brak `until >= t0` taranu | ZABITY | `walidacja_czasow_obu_stron` |
| VM3 | brak `hpAfter >= 0` (mur) | ZABITY | `walidacja_obrazen_i_hp` |
| VM4 | brak kontroli `dmg` bramy | ZABITY | `walidacja_obrazen_i_hp` |
| VM5 | brak `id != fallen` | ZABITY | `walidacja_obrazen_i_hp` |
| VM6 | brak `morale >= 0` | ZABITY | `walidacja_obrazen_i_hp` |
| VM7 | brak „wiersz bez zmiany” przy wejściu | ZABITY | `walidacja_indeksow_i_wejscia_na_mur` |
| VM8 | indeks `>= -1` zamiast `>= 0` | ZABITY | `walidacja_indeksow_i_wejscia_na_mur` |
| VM9 | brak „kolumna zmieniona” przy wejściu | ZABITY | `walidacja_indeksow_i_wejscia_na_mur` |
| EM1 | `from`/`to` zamienione w `LeaveField` | ZABITY | 3 testy |
| EM2 | `id`/`fallen` zamienione w `Shaken` | ZABITY | 2 testy |
| EM3 | kolumna/wiersz startu zamienione w `ClimbWall` | ZABITY | 3 testy |
| EM4 | wiersz kamienia przez `cell_i32` (zły błąd) | ZABITY | `wiersz_i_pole_poza_i32_to_blad` |
| EM5 | pominięty zapis HP kafla (`hpAfter = dmg`) | ZABITY | 3 testy |
| EM6 | `dmg`/`hpAfter` bramy zamienione | ZABITY | 3 testy |
| EM7 | `until + 1` | ZABITY | 3 testy |
| EM8 | `landAt − 1` | ZABITY | 2 testy |
| EM9 | `TowerDestroyed` → `WallBreach` (zły rodzaj) | ZABITY | 2 testy |
| EM10 | `Leave` → `Kill` (zły rodzaj) | ZABITY | 2 testy |
| EM11 | `morale + 1` | ZABITY | 3 testy |
| EM12 | błędny wiersz wyłomu (`row + 1`) | ZABITY | 4 testy |
| RM1 | brak kontroli `landAt == t0 + 700` | ZABITY | `siege_errors_are_reported` |
| RM2 | `until` sprawdzany tylko z jednej strony (`<`) | ZABITY | `siege_errors_are_reported` |
| RM3 | zamienione kolumna/wiersz katapulty (zły tor) | ZABITY | `boulder_and_breaches…` |
| RM4 | zły kolor etykiety trafienia | ZABITY | 2 testy |
| RM5 | zły kolor etykiety wyłomu | ZABITY | `boulder_and_breaches…` |
| RM6 | `Kill` katapulty z wyłomu ustawia pasek HP | ZABITY | 2 testy |
| RM7 | znacznik wyłomu nie wygasa po zmianie `t0` | ZABITY | `breach_mark_is_limited…` |
| RM8 | zejście bez wolnego pola przesuwa model | ZABITY | `retreat_without_free_cell_keeps_the_model` |
| RM9 | `Leave` nie dokańcza kroku w locie (niedokończona animacja) | ZABITY | 2 testy |
| RM10 | brak kontroli „obok podstawy muru” | ZABITY | `siege_errors_are_reported` |
| RM11 | błędny wiersz bramy (`gateRow + 1`) | ZABITY | 2 testy |
| RM12 | `End` nie ustawia `finished` | ZABITY | 2 testy |
| RM13 | wyłom nie usuwa HP kafla | ZABITY | `boulder_and_breaches…` |
| RM14 | `Shaken` rysuje `moraleMax` zamiast morale | ZABITY | `flee_leave_and_shaken…` |
| RM15 | brak błędu przy braku żywej wieży | ZABITY | `tower_destroyed_equals_pin_call` |
| RM16 | brak kontroli `onWallWalkway` przy zejściu | ZABITY | `siege_errors_are_reported` |
| RM17 | brak kontroli wiersza w granicach siatki | ZABITY | `siege_errors_are_reported` |
| RM18 | znacznik wyłomu bez warunku wiersza | ZABITY | `breach_mark_is_limited…` |
| RM19 | zły zegar etykiety muru | ZABITY | 2 testy |
| RM20 | zły tekst etykiety (`dmg + 1`) | ZABITY | 2 testy |
| RM21 | wejście na mur w złym wierszu | ZABITY | `climb_equals_pin_call` |
| RM22 | kamień ignoruje `finished` | ZABITY | `wall_hit_hp_and_finished_stone` |

Historia: RM7 w pierwszym przebiegu miał nieaktualną kotwicę (po `cargo fmt`), poprawiony i uruchomiony osobno — ZABITY. Mutanty
silnika wskazują pierwszą czerwoną binarkę (`cargo test` przerywa po niej), więc sweepy wektorów nie są wymienione, choć też by padły.

## 7. Długi

- **FC-U3-MISS** (wektor strzału chybionego bez `Damage`): NIE zamknięty. Wymaga nowego wektora z generatora r3
  (`p6_k5loop_close_r3_gen.mjs` + `vectors_r3.json`), a generator i jego wektory nie są w allowliście; silnik pętli bez zmian.
- **D-I5B-13**: obrażenia nieskończone bez zapisu w JSON — jawny błąd konwersji; jeśli kiedyś dane dopuszczą `Infinity`, DTO
  potrzebuje osobnej reprezentacji (jak `ammoLeft: None`).
- Wpis decyzji D-I5B-1..15 do `REJESTR-RUST.md` — orkiestrator (plik poza allowlistą).
- Morale obrońców po wyłomie bramy/muru nie ma akcji (silnik nie emituje; pasek z ramki `apply_frame`), zgodnie z podziałem I4.
- Produkcyjny wołający playbacku (pętla czasu rzeczywistego) — poza I5b.

## 8. Następny krok

Evaluator r1 (Opus): weryfikacja kodu względem pinu, decyzji D-I5B-12..15, zmian wymuszonych (§5) i mutantów.
