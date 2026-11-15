# 01 — Operator (implementacja) · R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1 · runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1
GOAL: pola planow marszu w PlayableState (plannedMarches z attackUnitId, marchAttackTargets,
      marchStopNotified, marchStopDetail) wg P4-1-RENDER-DTO-CONTRACT.md §1.2/§8; zapis i odczyt
      przez istniejacy SavedPlannedMarch; zgodnosc golden zapisu bez zmiany plikow fixtur.
ZMIANY/COMMIT: 78f5db10f (kod + testy + generator) i commit tego raportu (SHA w odpowiedzi Operatora);
      baza a01363d5f (origin/rust-port/parity-v2); galaz R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1-wip/operator-r1
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --all-targets EXIT 0
      (469 zestawow, 3393 passed, 0 failed, 1 ignored = istniejacy e2e::dump_tick1_econ_for_web_generator);
      git diff --cached --check czysto; generator --check OK; 6/6 mutantow zabitych
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Operator (pomiary) -> Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

## 0. Baza i rozbieznosc w poleceniu

- Dispatch (`origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1/00-dispatch.md`,
  blob `d7154f308`): BAZA `origin/rust-port/parity-v2 = a01363d5f`. Zweryfikowano: `git ls-remote origin` ->
  `refs/heads/rust-port/parity-v2 = a01363d5fad9…`.
- Tekst zadania z workflow wspomina „DODATEK r2” i „parity-v2 zawiera 7817ef0c”. **Dispatch NIE ma dodatku r2**
  (jedyny plik w katalogu runu na `origin/claude/rust-sivvrn` @ `3b025a272` to `00-dispatch.md`, runda 1), a
  `7817ef0cb` (P4.36 Q2 Evaluator r1) **nie jest potomkiem** `a01363d5f` i nie jest w `parity-v2`
  (`git merge-base --is-ancestor a01363d5f 7817ef0c` -> nie). Pracowalem wg dispatchu: baza `a01363d5f`,
  `git merge-base --is-ancestor a01363d5f HEAD` = tak. Do wyjasnienia przez orkiestratora.

## 1. Co zrobiono (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/playable.rs` | 4 pola w `PlayableState` z `#[serde(default, skip_serializing_if = …)]`; typy `PlayablePlannedMarch`, `PlayableMarchStopReason`; inicjalizacja w `PlayableState::empty()` i `PlayableGame::new` (+53) |
| `rust-port/engine/src/domain/save_load.rs` | importy (para `cfg(not(test))`/`cfg(test)` jak reszta pliku); `playable_planned_marches_to_save`, `restore_playable_planned_marches`, `PlannedMarchRestoreReport`, `SaveSnapshot::with_playable_planned_marches`, `SaveSnapshot::restore_planned_marches`; pomocnicze `integral_number`, `js_i32`, `canonical_unit_id` (+233) |
| `rust-port/engine/tests/p4_1j_planned_march_state.rs` | 8 testow: serde, golden, nazwy pol, zgodnosc wstecz, semantyka `Map`, wlasciciel, raport |
| `rust-port/engine/tests/p4_1j_planned_march_pin_vectors.rs` | 4 testy na 145 wektorach z uruchomionego pinu (blok `BEGIN/END PIN VECTORS`) |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1/gen-p4-1j-planned-march-vectors.mjs` | generator wektorow (wykonuje kod pinu; tryb `--check`) |

Zero zmian w `gra/**`, `rust-port/renderer/**`, `rust-port/view-model/**`, `src-tauri/**`. `Cargo.lock` nie commitowany
(nieśledzony, pozostaje poza indeksem). Brak `#[ignore]`, brak `unsafe`. Uwaga do kryterium 4: w crate
`civ-engine` nie ma dzis atrybutu `forbid(unsafe_code)` (`grep -rn unsafe_code rust-port/engine` = 0 trafien
w `*.rs`/`*.toml`); nic go nie usunelo, a nowy kod nie uzywa `unsafe`.

### 1.1 Pola `PlayableState` (kontrakt §8 P4-1J)

| Pole Rust (`serde`) | Typ | Web (pin `07d2fbd72`) |
|---|---|---|
| `planned_marches` (`plannedMarches`) | `Vec<PlayablePlannedMarch>` (kolejnosc = kolejnosc `Map`) | `const plannedMarches = new Map<string, PlannedMarchDest>()` `main.ts:31004`; iterowana `main.ts:31063`, `:31324` |
| `march_attack_targets` (`marchAttackTargets`) | `BTreeMap<UnitId, UnitId>` | `main.ts:31016`; tylko `get/has/set/delete/clear` (`:25782`, `:25795`, `:29573`, `:31126`), wiec kolejnosc bez znaczenia |
| `march_stop_notified` (`marchStopNotified`) | `BTreeMap<UnitId, PlayableMarchStopReason>` | `main.ts:31007`, typ `MarchStopReason` `planned-march.ts:35` |
| `march_stop_detail` (`marchStopDetail`) | `BTreeMap<UnitId, String>` | `main.ts:31009`; czytany `main.ts:25737` |

`PlayablePlannedMarch { unit_id: UnitId, dest_q: i32, dest_r: i32, attack_unit_id: Option<UnitId> }` = web
`PlannedMarchDest` (`planned-march.ts:16-23`) bez `generalTargetId`. Konwencja wspolrzednych jak `PlayableFort`
(`q` = `position.x`, `r` = `position.y`). `PlayableMarchStopReason` serializuje sie do napisow weba
(`obstacle`, `no_path`, `no_movement`, `blocked_city`, `fog`).

Wszystkie cztery pola sa w DTO (`PlayableState` = stan emitowany do frontu, kontrakt §1.1), z
`skip_serializing_if` gdy puste — zgodnie z wzorcem `playable.rs:507-518` z dispatchu.

### 1.2 Zapis i odczyt (`save_load.rs`)

- **Zapis** — web `buildSaveGameSnapshot`: `const marchSave = plannedMarchesToSave(plannedMarches)`
  (`main.ts:37184`), pola `autoMarch` / `plannedMarches` (`main.ts:37243-37244`); funkcja
  `plannedMarchesToSave` `planned-march.ts:485-501`. Rust: `playable_planned_marches_to_save` deleguje semantyke
  `Map` i `autoMarch` (= pierwszy wpis mapy) do istniejacego portu `ruch_jednostek::planned_marches_to_save`
  (`pathfinding.rs:2244`), potem ustawia kolejnosc listy = kolejnosc kluczy obiektu JS (klucze-indeksy rosnaco,
  reszta wg wstawienia; ta sama funkcja `array_index_key`, ktorej uzywa odczyt). Liczby jako calkowite JSON
  (`3`, nie `3.0`). Pusty stan -> `(vec![], None)` -> brak kluczy w zapisie (web `{}`).
  `SaveSnapshot::with_playable_planned_marches(&state)` wpisuje to przez `with_planned_marches` + `with_auto_march`.
- **Odczyt** — web `main.ts:46272-46287`: `plannedMarches.clear()`, `marchStopNotified.clear()`,
  `marchStopDetail.clear()`, `marchAttackTargets.clear()`, `plannedMarchesFromSave(saved.autoMarch,
  saved.plannedMarches, units, 0)`, petla `plannedMarches.set` + `syncMarchAttackTarget` (`main.ts:31124-31130`).
  Rust: `restore_playable_planned_marches` robi to samo; filtr = istniejacy port
  `ruch_jednostek::planned_marches_from_save` (`pathfinding.rs:2164`, web `planned-march.ts:451-482`).
  Web nie zapisuje `marchAttackTargets`, `marchStopNotified`, `marchStopDetail` — po odczycie sa puste albo
  odbudowane z `attackUnitId`, dokladnie jak w webie.

## 2. Decyzje techniczne (zasada 9; do wpisu w `REJESTR-RUST.md` przez orkiestratora — plik poza allowlista)

1. **Typy id i wspolrzednych.** `unit_id`/`attack_unit_id` jako `UnitId`, cel jako `i32` (jak `PlayableFort`).
   Web trzyma napisy i liczby JS. Wpis z zapisu, ktory web przyjmuje, a ktorego tak nie da sie wyrazic (cel
   nie jest calkowity w zakresie `i32`, np. `2.5`; `attackUnitId` nie jest kanonicznym zapisem `UnitId`, np.
   `"e9"`, `"07"`), jest **pomijany w calosci i raportowany** w `PlannedMarchRestoreReport::unrepresentable`
   (nie cicho). Odchylenie od weba (web trzyma taki wpis: nieistniejacy heks -> `no_path`; martwy cel ataku
   chroni plan przed `clearPlannedMarch(force=false)`). Zapis tworzony przez Rust zawsze jest wyrazalny
   (wektory stanu: raport pusty we wszystkich 67 przypadkach). Dowod web: wektor „ulamek i attackUnitId spoza
   UnitId” — web trzyma 4 wpisy i 2 cele, Rust 1 wpis + `unrepresentable = ["2","3","7"]`.
2. **Wlasciciel gracza jako parametr.** Web woła `plannedMarchesFromSave(..., units, 0)` (`main.ts:46283`);
   w `PlayableState` czlowiek ma `PlayerId(1)` (`playable.rs:31`). Funkcja przyjmuje `player_owner_id: PlayerId`
   (jak parametr `playerOwnerId` weba), porownanie dokladne w przestrzeni `PlayerId`.
3. **Powtorzony `unitId` w liscie** (forma listowa Rust; obiekt weba po `JSON.parse` nie ma powtorzen):
   semantyka `Map.set` — pierwsza pozycja, ostatnia wartosc; cel ataku wg ostatniej wartosci.
4. **Brak produkcyjnego wolajacego.** `PlayableState` nie ma dzis produkcyjnej sciezki zapisu/odczytu przez
   `SaveSnapshot` (por. komentarz `playable.rs` przy `odtworz_flage_zwyciestwa_ze_miast`). Funkcje sa gotowe
   do wpiecia; wolaja je testy. P4-1H (komenda `cancel_planned_march`) moze juz operowac na polach.

## 3. NIE_ZMIERZONO / poza zakresem

- **`generalTargetId`** (web `PlannedMarchDest.generalTargetId`, `planned-march.ts:22`; zapis `:497`, odczyt
  `:465-467`, `:472-474`) — pole weba, ktorego §8 P4-1J nie wymienia. Zgodnie z dispatchem **nie dodane**.
  Skutek: odczyt zachowuje wpis generala (filtr „na celu” respektuje `generalTargetId` z zapisu, bo filtr robi
  port weba), ale sam identyfikator generala jest gubiony i raportowany w
  `PlannedMarchRestoreReport::general_target_dropped`; zapis z `PlayableState` nie ma `generalTargetId`.
  Zachowanie marszu za generalem (`main.ts:13393`, `:23497`, `syncTrackedGeneralFollowMarches` `:31350`) po
  wczytaniu: NIE_ZMIERZONO. Kandydat na osobny temat (rozszerzenie §8).
- **Forma tablicowa `plannedMarches` w zapisie weba** (`Object.entries([...])` daje klucze `"0","1"`): Rust traktuje
  tablice jako wlasna forme listowa (`save_load.rs` `visit_seq`, stan sprzed P4-1J). Web nigdy nie pisze tablicy
  (`plannedMarchesToSave` buduje obiekt). Poza zakresem, nie zmieniane.
- Liczby poza zakresem `f64` w JSON (`1e400`): `serde_json` odrzuca caly zapis, web daje `Infinity` i odfiltrowuje
  wpis. Stan sprzed P4-1J, poza zakresem.
- Ustawianie `marchStopNotified`/`marchStopDetail` w turze (`noteMarchStop` `main.ts:31437-31440`,
  `clearMarchStop` `:31461-31462`) i `clearPlannedMarch` (`main.ts:31050-31074`) — zakres P4-1H / dalszych
  tematow; tu tylko stan, zapis i odczyt.

## 4. Testy i dowody

### 4.1 Wektory pinu (wykonany kod weba, nie transkrypcja)

Generator `gen-p4-1j-planned-march-vectors.mjs` (Node 22, `stripTypeScriptTypes`), straznik SHA-256:
`game/planned-march.ts` `12fa88cd…`, `main.ts` `e80f9cb4…` (pin `07d2fbd72f758705f8e1d59cc4968027ffbafe75`).
Wycina i WYKONUJE: `validateAutoMarchFromSave` (`planned-march.ts:437-448`), `plannedMarchesFromSave` (`:451-482`),
`plannedMarchesToSave` (`:485-501`), `syncMarchAttackTarget` (`main.ts:31124-31130`), linie zapisu
`main.ts:37184`, `:37243`, `:37244`, blok odczytu `main.ts:46272-46287` (wyciety wzgledem kotwicy, wykonany doslownie).

- `state_cases` = 67 (7 recznych + 60 LCG): stan -> `JSON.stringify` -> `JSON.parse` -> odczyt.
- `raw_cases` = 78 (18 recznych + 60 LCG): surowy tekst zapisu (powtorzone klucze, `null`, zle typy, `-0`,
  ulamki, legacy `autoMarch`, id > 2^32-2) -> odczyt.

Asercje Rust: zapis Rust == zapis weba odczytany tym samym loaderem (lista i `autoMarch`); pusty plan ->
snapshot bajtowo identyczny ze snapshotem bez planow; caly `PlayableState` po odczycie == oczekiwany z wyniku weba
(reszta stanu nietknieta); raport pominiec == wyliczony z wyniku weba. Pokrycie (zmierzone, `--nocapture`):
state: niepuste zapisy 66, odfiltrowane przy odczycie 62, cele ataku 35, zmiana kolejnosci kluczy 22;
raw: przypadki z wczytanym planem 33, wpisy niewyrazalne 8, pominiete `generalTargetId` 9, cele ataku 6.
Progi w testach: 60/50/25/15 oraz 30/5/5/5.

Odtworzenie: `git archive 07d2fbd72 gra/src/main.ts gra/src/game/planned-march.ts | tar -x -C <WEB>` i
`node dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1/gen-p4-1j-planned-march-vectors.mjs <WEB> --check rust-port/engine/tests/p4_1j_planned_march_pin_vectors.rs`
-> `OK: wektory zgodne (state=67, raw=78, bajtow=157266)`.

### 4.2 Zgodnosc golden i wstecz

- `golden_state_files_reserialize_byte_identical`: `save_pre_stores.json` (pretty z `Value`) i
  `pre-etap2-state.json` (pretty w kolejnosci pol) — ponowna serializacja **bajtowo rowna plikowi**;
  `old_state_pre_pop.json` — juz na bazie nie odtwarza bajtow (plik sprzed `population`/`culture` miast), test
  pokazuje, ze jedyna roznica to te dwa pola. Nowe klucze nieobecne we wszystkich trzech.
- **Pomiar baza vs galaz** (tymczasowy test `zz_p4_1j_measure.rs`, NIE commitowany, uruchomiony na
  `git archive a01363d5f rust-port/engine` i na galezi): serializacje 3 fixtur (compact, pretty, pretty z `Value`),
  `PlayableState::empty()`, `PlayableGame::new(default)` i stanu po `advance_turn()` — 77 122 bajty,
  SHA-256 `ab9fd4649bd50b1833d35cacca6327e8fc783f02183ccb858e85095265ab63a0` na OBU, `cmp` = identyczne.
- `snapshot_without_plans_is_byte_identical`: `SaveSnapshot` z pustym planem == bez wywolania, brak
  `plannedMarches`/`autoMarch`.
- `empty_fields_are_omitted_and_legacy_state_loads_with_defaults`, `full_state_roundtrips_with_web_field_names_and_values`,
  `stop_reasons_serialize_as_web_literals`.

### 4.3 Mutanty (test czulosci, `save_load.rs`, przywrocony po kazdym)

| Mutant | Wynik | Zabijajace testy |
|---|---|---|
| M1 brak sortowania kluczy przy zapisie | ZABITY | `state_cases_save_and_load_like_web` |
| M2 brak `march_stop_detail.clear()` | ZABITY | `state_cases…`, `raw_cases…` |
| M3 `Map.set` zachowuje pierwsza wartosc | ZABITY | `restore_keeps_one_entry_per_unit_and_uses_owner_parameter` |
| M4 odwrocony warunek wlasciciela | ZABITY | 3 testy wektorowe |
| M5 brak wpisu `march_attack_targets` | ZABITY | `state_cases…`, `raw_cases…` |
| M6 ulamek przyjety (obciecie do `i32`) | ZABITY | `raw_cases…`, `raw_deviation_case_is_reported_by_name` |

### 4.4 Bramki (czysty `CARGO_TARGET_DIR` poza repo, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (`rust-port/engine`) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets` (pelny) | EXIT 0; 469 zestawow; 3393 passed; 0 failed; 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, istniejacy) |
| `git diff --cached --check` | czysto |

## 5. Dla Evaluatora — co sprawdzic

1. Rozbieznosc z §0 (brak DODATKU r2, `7817ef0c` nie w `parity-v2`).
2. Decyzja 1 (typy `UnitId`/`i32` + raport zamiast cichej straty) vs alternatywa: trzymanie napisow i liczb
   JSON 1:1 z webem w `PlayableState`.
3. `generalTargetId` poza §8 — swiadomie nie dodany (dispatch), skutki w §3.
