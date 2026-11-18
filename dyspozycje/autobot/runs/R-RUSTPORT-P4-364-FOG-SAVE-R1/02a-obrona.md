# R-RUSTPORT-P4-364-FOG-SAVE-R1 — obrona Operatora (r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-FOG-SAVE-R1
GOAL: runda zapis -> odczyt zachowuje odkrytą mgłę (`exploredByHuman`) jak web.
BAZA: kod Operatora `8f0a005fa` (rodzic = baza dispatchu `5a1ddc10b`); obrona = jeden commit nad nim
(gałąź `rust-port-wip/p4-364-fog-save-r1-obrona`, SHA w raporcie końcowym Workflow).

## Zarzut 0 (podsumowanie Evaluatora: bramki, allowlista, D-FS-1..4, mutanty E1-E6)

Nie jest zarzutem, tylko potwierdzeniem PASS. Bez zmian.

## U1: brak produkcyjnego wołającego zapisu i wczytania w `src/`

**ODRZUCAM (w tym temacie).** Dispatch D-FS-4 wymaga „parametru/metody” na zapis i odczyt, a zakres
§1 to: klucz zapisu, serializacja, wczytanie przez loader, restore do sesji. Wszystko jest jako API
(`SaveSnapshot::with_playable_explored_by_human`, `load_save_snapshot`, `SaveSnapshot::restore_explored_by_human`).
Most nie ma dziś komendy Save/Load dla `PlayableGame` w ogóle: `citySiege`, `placedWorldWonders` i
`plannedMarches` też są wołane tylko z testów (`git grep -n "restore_playable_siege_wonders\|restore_playable_planned_marches" -- rust-port/engine/src`
daje tylko definicje, wrappery metod `SaveSnapshot` w `save_load.rs` i komentarze w `playable_movement.rs`). Allowlista pozwala na `bridge.rs` „tylko
mechanicznie”, więc dodanie komendy mostu byłoby wyjściem poza zakres. Zgadzam się z wnioskiem
Evaluatora: osobny temat wpięcia Save/Load w most (dla wszystkich kluczy addytywnych naraz).

## U2: web zapisuje puste zbiory (`[[0, []]]`), Rust je pomija

**ODRZUCAM.** To wprost wymóg D-FS-1 („zapis sprzed zmiany bajt w bajt”, `skip_serializing_if`) i test
(c) `c_zapis_bez_eksploracji_bajt_w_bajt_jak_dotad`. Gdyby zapisywać pusty wpis fotela głównego, każdy
zapis gry bez eksploracji zmieniłby się o `"exploredByHuman":[[1,[]]]`. Brak straty: restore zawsze
tworzy wpis fotela głównego (`PlayableFogSession::restore_explored_by_human`,
`entry(HUMAN_PLAYER_ID).or_default()`, jak web `if (!exploredByHuman.has(HUMAN_OWNER_PRIMARY))`),
a pozostałe fotele bez wpisu dostają pusty zbiór przy pierwszym zapytaniu warstw (`or_default`).
Pusty zbiór i brak wpisu dają tę samą mgłę (test (b) i (e)). Sam Evaluator ocenił to jako uzasadnione.

## U3: `ownerId` w zapisie = `PlayerId` Rust (fotel główny = 1), web = 0

**ODRZUCAM (spójne z resztą zapisu Rust, poza zakresem).** Zapis Rust jest w przestrzeni `PlayerId`
sesji: tak samo `meta.placedWorldWonders[].ownerId` (`saved_placed_wonder` -> `PlayerId::new(owner_id)`
bez przemapowania) i właściciele jednostek/miast w `GameStateDto`. `exploredByHuman` musi wskazywać ten
sam fotel co `players` zapisu, więc mapowanie 0 -> 1 tylko w tym jednym kluczu zepsułoby spójność z
resztą stanu (fotel 0 nie istnieje w `PlayableState`). Wczytywanie surowych zapisów webowych do Rust
wymagałoby mapowania id całego stanu i nie jest celem tego tematu ani dispatchu (D-FS-1 mówi o kształcie
klucza jak web, nie o przestrzeni id). Kandydat do tematu importu zapisów webowych, jeśli powstanie.

## U4: `ownerId` z częścią `.0` (np. `1.0`) daje `BadEntry`

**PRZYJMUJĘ.** Poprawka: odczyt `ownerId` przez istniejący `js_owner_id` (ten sam, którego używa
`placedWorldWonders.ownerId`): liczba JS całkowita `>= 0`, mieszcząca się dokładnie w `f64`, także `2.0`.
`-1`, `1.5`, napis nadal dają `BadEntry` (asercje w teście (d) bez zmian).

- `rust-port/engine/src/domain/save_load.rs` (`explored_by_human_from_save`):
  `owner.as_u64()` -> `owner.as_f64().and_then(js_owner_id)`.
- `rust-port/engine/tests/p4_364_fog_save.rs` (test `d_...`): dopisana asercja: `[[2.0, ["1,1"]]]`
  wczytuje się jako `owner_id: 2`.
- Dowód czułości: przed poprawką `serde_json` trzyma `2.0` jako liczbę zmiennoprzecinkową i `as_u64()`
  zwraca `None`, więc nowa asercja (`expect("ownerId 2.0")`) panikuje; po poprawce przechodzi.

## U5: restore nie odtwarza `active_seat`

**ODRZUCAM (poza zakresem dispatchu).** Dispatch obejmuje tylko `exploredByHuman`; `activeHumanOwnerId`
to inny klucz zapisu, a `active_seat` w Rust jest parametrem zapytania warstw (`GetRenderLayers { seat }`),
nie stanem sesji mgły odtwarzanym z zapisu. Zgadzam się z Evaluatorem: kandydat do tematu z U1 (wpięcie
Save/Load w most razem z aktywnym fotelem).

## ZMIANY/COMMIT
Allowlista zachowana: `save_load.rs` (1 linia logiki + komentarz), `tests/p4_364_fog_save.rs` (dopisana
asercja), ten raport. Bez zmian istniejących testów poza dopisaniem; `gra/**`, `Cargo.*` nietknięte.

## TESTY (na drzewie obrony, `CARGO_TARGET_DIR` w scratchpadzie)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p4_364_fog_save`: 6 passed, 0 failed
- pełny `cargo test --all-targets --no-fail-fast` (engine, w tle `setsid nohup`): EXIT 0; 530 binarek `ok`,
  3982 passed, 0 failed, 1 ignored (liczba testów bez zmian: dopisana asercja, nie nowy test)
- mutant U4 (powrót do `owner.as_u64()`): `p4_364_fog_save` 5 passed / 1 failed
  (`d_niepoprawny_klucz_jawny_blad_z_pozycja` panikuje na `expect("ownerId 2.0")`) — zabity; kod przywrócony

BLOKADY: brak
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
