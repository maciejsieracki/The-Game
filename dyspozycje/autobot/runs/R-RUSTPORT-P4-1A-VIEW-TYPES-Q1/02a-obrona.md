# R-RUSTPORT-P4-1A-VIEW-TYPES-Q1 — Obrona r1 (Operator)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1A-VIEW-TYPES-Q1
GOAL: typy DTO z P4-1 §3 w crate rust-port/view-model (serde camelCase, JSON-safe), testy JSON (round-trip, nazwy kluczy, niezmiennik ID), pomiar rozmiaru snapshotu 3000/8000 heksów
ZMIANY/COMMIT: jeden commit na gałęzi obrona/P4-1A-r1, rodzic b54dffb9a (Evaluator r1) <- 011de8664 (Operator pomiary) <- 86032cd28 (Operator impl) <- 525a2ef7b; SHA w raporcie końcowym Workflow (plik nie może zawierać własnego SHA); pliki wyłącznie z allowlisty (§6)
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --all-targets EXIT 0 (68 testów, 0 ignored); git diff --check pusty; gen_pin_literals.py --check EXIT 0; mutacje: §5
BLOKADY: Z3 (kryterium 4) wymaga decyzji orkiestratora — gotowa łatka w 02a-obrona/P4-1-par-4.1-pomiar.patch; wpis Z6 do REJESTR-RUST.md poza allowlistą (tekst w §3 Z6)
RUNDY: 1/5 (obrona po Evaluator r1 = FAIL)
NASTĘPNY KROK: Evaluator r2 (to samo ID) na commicie Obrony
DEPLOY/PUSH: NIE WYKONANO
```

## 0. Baza i izolacja

- Dispatch przeczytany z `origin/claude/rust-sivvrn` (`bfb0b0be6`). DODATKU r2 w pliku nadal **nie ma** (to samo stwierdzili Operator i Evaluator).
- Praca na gałęzi `obrona/P4-1A-r1` utworzonej z `b54dffb9a` (raport Evaluatora r1; jego rodzic `011de8664` to kod Operatora). `git merge-base --is-ancestor 7817ef0c b54dffb9a` → 0 oraz `525a2ef7b` → 0. Czubek `origin/rust-port/parity-v2` (`fffc5e7c6`) zmienia od `525a2ef7b` tylko `rust-port/renderer/**` i dokumenty; `rust-port/view-model/**` i `rust-port/Cargo.toml` nie są dotknięte, więc integracja nie ma tu konfliktu. Nie scalałem parity (integracja należy do orkiestratora).
- `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `--offline`. `Cargo.lock` niecommitowany (`rust-port/view-model/.gitignore`).

## 1. Odpowiedzi na zarzuty (skrót)

| Zarzut | Odpowiedź | Dowód |
|---|---|---|
| Z1 testy walidatora | **PRZYJMUJĘ** | test tabelaryczny 26 pól float × {NaN, +Inf, −Inf} + test kompletności względem JSON; test granic 15 pól całkowitych (min/max przyjęte, max+1 i min−1 odrzucone); fala V: §5 |
| Z2 wektory pinu | **PRZYJMUJĘ** | generator `02a-obrona/gen_pin_literals.py`, fikstura `tests/fixtures/pin_literals.json` z SHA-256 16 plików pinu, `pin_vectors.rs` czyta fiksturę i sprawdza jej SHA-256; fala F: §5 |
| Z3 kryterium 4 | **PRZYJMUJĘ diagnozę; wykonanie poza moją allowlistą** | gotowa łatka `02a-obrona/P4-1-par-4.1-pomiar.patch` (sprawdzona `patch -p1 --dry-run` na blobie `2f9aadd4e`) |
| Z4 kształt i kolejność mapy, facing, kafle | **PRZYJMUJĘ** (zrobione teraz, bez odraczania do P4-1B) | `validate_map`: długość `width*height` + `hexes[i].coord == (i % width, i / width)`; `facing` 0..=3, `grid.tiles[]` 0..=7; testy i mutanty G/B |
| Z5 `civIconId` barbarzyńców | **PRZYJMUJĘ** | doc-komentarz `OwnerViewDto::civ_icon_id` (`src/owners.rs`) |
| Z6 brak klucza `Option` = `None` | **PRZYJMUJĘ** (zapis decyzji; zachowanie bez zmian) | doc crate'u `src/lib.rs`; tekst wpisu do `REJESTR-RUST.md` w §3 Z6 |
| Z7 komentarz `tests/common/mod.rs` | **PRZYJMUJĘ** | komentarz przepisany zgodnie ze stanem próbek |

## 2. Zarzuty obowiązkowe

### Z1 — PRZYJMUJĘ

Zmiany (`rust-port/view-model/tests/validate.rs`):

- `every_float_field_rejects_non_finite` (zastępuje `floats_everywhere`): tabela `float_cases()` z **26** wierszami. Każdy wiersz jest sprawdzany osobno: wartość skończona `0.5` jest przyjęta, a `NaN`, `+Inf` i `−Inf` dają dokładnie `NonFinite { field }` z tą ścieżką JSON. Sprawdzane są obie drogi: `RenderViewDto::validate` i `split()` + `RenderLayersDto::validate(&map)`.
- `float_table_covers_every_f64_field`: przechodzi po `serde_json::to_value(sample_view())`, zbiera ścieżki wszystkich liści `f64` (indeksy znormalizowane do `[]`) i wymaga **równości** ze zbiorem ścieżek tabeli. Nowe pole `f64` bez wiersza łamie test.
  - Liczba pól to 26, nie 23 jak podał Evaluator. Lista: `map.seed`, `owners[].era`, `cities[].population`, `cities[].level`, `cities[].badge.{population, growthPercent, era}`, `units[].{ruchMax, ruchLeft, hp, hpMax}`, `stacks.vitalsByRepId[][].{ruchLeft, ruchMax, hp, hpMax, fieldPowerM}`, `overlays.okolica.range`, `overlays.okolica.yields[][].{zywnosc, praca, handel}`, `battle.setup.units[].{hp, maxHp, morale, moraleMax, ammoLeft, ammoMax}`.
- `every_ranged_integer_rejects_out_of_range` (zastępuje `small_integer_ranges` i `every_colour_is_bounded`): tabela `int_cases()` z **15** polami. Dla każdego: `min` i `max` przyjęte, `max + 1` odrzucone z dokładnym `OutOfRange { field, value, min, max }`, a `min − 1` odrzucone tam, gdzie typ na to pozwala (`veteranLevel` 0, `facing` −1).
  - Pola: `rzekaKrawedzie[]` 0..=5, `roadMask` 0..=0x3F, `owners[].color`, `badge.ownerColor`, `battle…ownerColor` 0..=0xFFFFFF, `badge.defenseTier` 0..=2, `units[].{veteranStars, armorBadgeLevel, softBadgeLevel}` 0..=3, `stacks…{armorBadgeLevel, softBadgeLevel, veteranStars}` 0..=3, `stacks…veteranLevel` 1..=3, `battle.setup.grid.tiles[]` 0..=7, `battle.setup.units[].facing` 0..=3.
  - Granice są w tabeli wpisane jako **wartości kontraktu, nie stałe `MAX_*` crate'u**. Dzięki temu zmiana stałej też łamie test (fala B w §5).
- `battle_grid_length`: dodane `rows = −1` obok `cols = −1`, z dokładnym błędem.
- `parallel_lengths`: przypadek „warstwy wobec innej mapy” używa teraz poprawnej mapy 2×1. Bez tego nowa kontrola kształtu mapy przechwyciłaby błąd wcześniej i ścieżka `hexState` nie byłaby testowana.

Wynik fali V (ta sama metoda co u Evaluatora: usunięcie każdego wywołania `finite` / `finite_opt` / `badge` / `color` / `range` / `len` w `src/validate.rs`, także wielowierszowego, oraz nowych kontroli z Z4): **§5**.

### Z2 — PRZYJMUJĘ

- **Generator** `dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona/gen_pin_literals.py`, uruchamiany przez `python3 -I`.
  - Czyta każde źródło przez `git show 07d2fbd72:gra/src/<plik>`: bez checkoutu i bez ręcznej kopii.
  - Usuwa komentarze z zachowaniem cudzysłowów i parsuje 24 deklaracje od kotwic. Każda kotwica musi trafić **dokładnie raz**.
  - Każdy element bloku musi się sparsować. W przeciwnym razie generator kończy się z EXIT 2: zmiana kształtu deklaracji przy przesunięciu pinu jest zgłaszana, a nie pomijana.
  - Zakres: 16 unii i enumów tekstowych (wszystkie wskazane przez Evaluatora, w tym `riverPathKinds`, `medium`, `'atk'|'def'`, `'drewno'|'kamien'`), 3 enumy liczbowe (`Dir`, `BTerrain`, `CityMapDefenseTier`; z nich wynikają nowe zakresy walidatora z Z4) oraz klucze 6 interfejsów: `StackVitals` (11), `StackDisplayInfo` (5), `CityMapBadgeInput` (19), `TileYield` (3), `HexCoords` (2), `RuntimeUnit` (28).
- **Fikstura** `rust-port/view-model/tests/fixtures/pin_literals.json` (9 621 B). Zawiera:
  - `pin`, `pinCommit` (pełny SHA);
  - SHA-256 każdego z 16 plików źródłowych pinu;
  - dla każdej pozycji `file` i `lines` (zakres linii na pinie, np. `types/hex.ts` 12–24, `armyMerge.ts` 1103–1126, `cityMapStatChip.ts` 17–78), zgodne z cytatami w kodzie.

  SHA-256 fikstury to `5baee2880c3f915ef57d67f5b7f33bf8bee0859f335932c84c4fe348c042dc15`, zapisany w `tests/fixtures/README.md` i jako stała `PIN_LITERALS_SHA256` w teście.
- **`tests/pin_vectors.rs`** czyta fiksturę (`include_bytes!`) i nie ma już ręcznych tablic literałów webu.
  - SHA-256 fikstury liczy własna implementacja FIPS 180-4, bez nowej zależności. Implementacja jest sprawdzona na trzech wektorach NIST.
  - Test kontroluje pin, generator, 16 skrótów źródeł i dokładny zbiór 24 pozycji.
  - Po stronie Rust zostaje tylko lista wariantów, pilnowana wyczerpującym `match`.
  - Literały pochodzą wyłącznie z fikstury. Dodatkowe sprawdzenia: `CityWallKind` = `CityMapWallKind`; `MAX_FACING`, `MAX_BATTLE_TILE`, `MAX_DEFENSE_TIER` = maksima `Dir`, `BTerrain`, `CityMapDefenseTier` z pinu, przy ciągłym zakresie `0..=max`.
  - Klucze `StackVitals` (11), `StackDisplayInfo`, `CityMapBadgeInput` (19 minus `hoverExpanded` i `lodLevel`), `TileYield`, `HexCoords` i `RuntimeUnit` też pochodzą z fikstury.
- **Wyjątki ręczne, jawnie opisane w teście:**
  - `BuildHighlightKind` (`generic` / `mine` / `foundCity`): web nie ma tu literału, wartości ustala kontrakt §3.7;
  - wartość kontraktu `self` w `RelationToViewer`;
  - znaczenie wariantów `FogState`: kolejność kodów bierze się z fikstury (`Widocznosc`), a `match` opisuje tylko semantykę wariantów Rust;
  - nazwy dwóch kluczy UI odrzucanych z `CityMapBadgeInput`;
  - lista kluczy pochodnych jednostki (§3.5).
- **Wykrycie przesunięcia pinu:**
  - `gen_pin_literals.py --check` regeneruje fiksturę w pamięci i kończy się EXIT 1, gdy różnią się bajty fikstury, skrót źródła albo stała w teście. Dziś: `OK … sha256=5baee288… (pin 07d2fbd72)`, EXIT 0.
  - `--pin <sha>` generuje fiksturę dla nowego pinu. Każdy zmieniony literał pojawia się wtedy jako czerwony test enumu.
  - Brakujący plik na innym pinie daje czytelny `GENERATOR ERROR` z EXIT 2. Sprawdzone na `4bbef081d`: brak `game/city-fortification.ts`.

## 3. Pozostałe zarzuty

### Z3 — PRZYJMUJĘ diagnozę; zmiana dokumentu poza allowlistą

Nie mam prawa zapisu do `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (gałąź `claude/rust-sivvrn`, poza allowlistą). Żeby orkiestrator nie musiał przepisywać tekstu, przygotowałem gotową łatkę: `02a-obrona/P4-1-par-4.1-pomiar.patch` (unified diff, `patch -p1`).

- Baza łatki: blob `2f9aadd4e` z `origin/claude/rust-sivvrn` (`bfb0b0be6`). `patch -p1 --dry-run` przechodzi czysto.
- Łatka dodaje do §4.1 akapit **POMIAR** z tabelą 4 scenariuszy. Bajty: 754 285 / 910 987 / 2 011 660 / 2 427 740 B, mapa statyczna 222 170 / 593 927 B, `hexState`+`fog` 177,2 B/heks.
- Pomiar odtworzyłem w tej rundzie bajt w bajt (`cargo run --release --example snapshot_size`). Nowe kontrole walidatora nie zmieniły typów ani rozmiaru.
- Łatka zawiera też oznaczenie „ARYTMETYKA zaniżona 3–4×” oraz dopisek do kosztu wariantu A.

Kryterium 4 pozostaje **formalnie niespełnione**, dopóki orkiestrator nie zastosuje łatki albo nie rozszerzy allowlisty.

### Z4 — PRZYJMUJĘ (wykonane, bez odroczenia)

`src/validate.rs`:

- `validate_map`:
  - `map.hexes.len() == width * height`, liczone w `u64`, bez przepełnienia;
  - dla każdego `i`: `hexes[i].coord == (i % width, i / width)`. To jedna kontrola, która wymusza naraz kolejność `r`-major / `q`-minor, unikalność i brak dziur (kontrakt §3.2 i §1.4; web `map/generator.ts:216-219` @ `07d2fbd72`);
  - nowy wariant błędu `ViewError::HexOrder { field, expected, actual }`.
- `battle.setup.units[].facing` w `0..=MAX_FACING` (3): web `const enum Dir`, `battle/battleScene.ts:315-320`; renderer `units.rs:524`.
- `battle.setup.grid.tiles[]` w `0..=MAX_BATTLE_TILE` (7): web `const enum BTerrain`, `battle/battle-terrain.ts:37-46`; renderer `field.rs:167` `GATE`. Obie stałe są przywiązane do fikstury pinu (Z2).
- Testy (`tests/validate.rs`):
  - `map_shape_and_order`: za mało heksów; zamiana kolejności; duplikat; przesunięty początek; mapa 3×2 `r`-major poprawna, a `q`-major odrzucona; mapa pusta; tekst błędu;
  - `synthetic_snapshots_are_valid`: 4 syntetyki pomiaru spełniają nowe niezmienniki;
  - wiersze `facing` i `tiles[5]` w tabeli granic.
- Nadal po stronie P4-1B (kontrakt §8, bez zmian) zostaje **test producenta w silniku**: czy silnik faktycznie emituje tę kolejność (`PositionDto ≡ (q,r)`). Walidator jedynie odrzuci błędnego producenta.

### Z5 — PRZYJMUJĘ

`OwnerViewDto::civ_icon_id` (`src/owners.rs`) ma teraz w doc-komentarzu:

- typ `String` jest zgodny z §3.4;
- web wysyła `civId: isBarbarian ? null : civTypeForOwner(…)` (`main.ts:10377` @ `07d2fbd72`), a renderer ma `OwnerEmblemContext.civ_id: Option<String>` (`emblem.rs:29`);
- adapter P4-1G **musi** ustawić `civ_id = None`, gdy `is_barbarian`;
- wartość, którą producent wpisuje barbarzyńcom, to NIE_ZMIERZONO, czyli luka kontraktu §3.4 do domknięcia w P4-1.

### Z6 — PRZYJMUJĘ (zapis decyzji; bez zmiany zachowania)

Zachowanie zostaje bez zmian: na wyjściu klucz zawsze jest obecny, a na wejściu brak klucza `Option` daje `None`. Utrwala to `tests/json_strict.rs`, a decyzję opisuje doc crate'u (`src/lib.rs`).

`REJESTR-RUST.md` leży poza allowlistą, więc proponowany wpis dla orkiestratora brzmi:

> **D-VM-OPT-IN (P4-1A, techniczna):** DTO `civ-view-model` zapisuje każde `Option::None` jako jawne `null`, więc klucz jest zawsze obecny (test `json_strict::none_is_explicit_null_everywhere`). Na wejściu brak klucza pola `Option` daje `None` (domyślne zachowanie serde). Mimo `deny_unknown_fields` wejście jest więc mniej ścisłe niż wyjście dla 29 pól `Option`.
>
> Uzasadnienie: producentem jest Rust, który zawsze zapisuje klucz, a JS dziś nie odsyła snapshotu.
>
> Rewizja: gdy webview zacznie odsyłać DTO, dodać `deserialize_with` (wymagana obecność klucza) na każdym polu `Option`.

### Z7 — PRZYJMUJĘ

Komentarz `tests/common/mod.rs` opisuje teraz stan faktyczny.

- `sample_view`: każde pole `Option` jest choć raz `Some`, a niektóre są też `None`.
- `sample_view_minimal` **nie** jest „wszystko `None`”. Opróżnia kolekcje i warstwy opcjonalne, ale dziedziczy mapę i `hexState`, więc `rivers[0].kind`, `hexState[0|3].ulepszenia`, `improvementKey` i `zloze` zostają `Some`.
- Warianty „wszystko `None`” pojedynczych struktur dają buildery `*_none`.

## 4. Bramki (kod końcowy tej rundy, czysty `CARGO_TARGET_DIR` w scratchpadzie, cargo 1.97.0, `--offline`)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (`rust-port/view-model`) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets` | EXIT 0. id_invariant 10, json_keys 11, json_roundtrip 13, json_strict 3, pin_vectors 18, validate 13: razem **68**, 0 failed, 0 ignored |
| `git diff --check b54dffb9a HEAD` | pusty |
| `python3 -I 02a-obrona/gen_pin_literals.py --check` | EXIT 0 |
| `cargo run --release --example snapshot_size` | bajty identyczne z 01b §3.1 |
| `#[ignore]` / `should_panic` / `assert!(true)` w `src/` i `tests/` | 0 |
| `#![forbid(unsafe_code)]` | jest (`src/lib.rs`) |

## 5. Mutacje (fala V Evaluatora powtórzona i rozszerzona)

Skrypt `02a-obrona/mutate_validate.py`, uruchomiony na kopii crate'u w scratchpadzie (nie na worktree), z czystym `CARGO_TARGET_DIR`. Wynik po mutantach: `02a-obrona/mutacje-obrona.tsv`. Mutant jest zabity, gdy `cargo test --offline --all-targets` (fale V/G/B) albo `cargo test --test pin_vectors` (fala F) kończy się kodem ≠ 0. Przed falą i po niej linia bazowa jest zielona, co skrypt sprawdza sam.

| Fala | Co mutuje | Mutanty | Zabite | Przeżywa |
|---|---|---|---|---|
| V | usunięcie każdego wywołania `finite` / `finite_opt` / `badge` / `color` / `range` / `len` w `src/validate.rs`, jedno- i wielowierszowego. To fala V Evaluatora (35) plus nowe kontrole Z4 i kontrole długości | 47 | 47 | **0** |
| G | strażnicy niebędący wywołaniami: kolejność heksów wyłączona, `q`/`r` zamienione, szerokość zignorowana; wersja kontraktu; `ringHex` | 5 | 5 | **0** |
| B | każda stała `MAX_*` ±1 (7 × 2) oraz minimum `veteranLevel` 1→0 i 1→2 | 16 | 16 | **0** |
| F | fikstura pinu: pierwszy literał, klucz lub liczba każdej z 24 pozycji zmienione **razem z przeliczonym `PIN_LITERALS_SHA256`**, czyli zostaje tylko kontrola treści; do tego zmiana bajtu bez nowego SHA | 25 | 25 | **0** |
| **Razem** | | **93** | **93** | **0** |

Mutanty przeżywające u Evaluatora (linie `224`–`318` w starej numeracji) to w nowym pliku V10, V11, V15–V17, V22–V26, V28, V29, V31, V33, V35, V42–V45 i V47 (to także E1 Evaluatora, `ammoMax`): razem 21, wszystkie zabite.

## 6. Zmienione pliki (wszystkie z allowlisty)

- `rust-port/view-model/src/validate.rs`: Z4 (kształt i kolejność mapy, `facing`, kafle, `HexOrder`, stałe `MAX_FACING` i `MAX_BATTLE_TILE`);
- `rust-port/view-model/src/owners.rs`: Z5 (doc);
- `rust-port/view-model/src/map.rs`: doc `hexes` (niezmiennik Z4);
- `rust-port/view-model/src/lib.rs`: Z6 (doc), odnośnik do fikstury;
- `rust-port/view-model/tests/validate.rs`: Z1, Z4;
- `rust-port/view-model/tests/pin_vectors.rs`: Z2;
- `rust-port/view-model/tests/common/mod.rs`: Z7;
- `rust-port/view-model/tests/fixtures/pin_literals.json`, `rust-port/view-model/tests/fixtures/README.md`: Z2 (nowe);
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona.md` (ten raport);
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona/gen_pin_literals.py`, `mutate_validate.py`, `mutacje-obrona.tsv`, `P4-1-par-4.1-pomiar.patch` (nowe).

Bez zmian: `gra/**`, `rust-port/engine/**`, `rust-port/renderer/**`, `src-tauri/**`, `rust-port/Cargo.toml` (nie istnieje), `Cargo.lock`.

## 7. Metoda (komendy)

- `git fetch origin claude/rust-sivvrn rust-port/parity-v2`; `git show origin/claude/rust-sivvrn:…/00-dispatch.md`; `git checkout -b obrona/P4-1A-r1 b54dffb9a`; `git merge-base --is-ancestor 7817ef0c b54dffb9a`.
- Pin do weryfikacji: `git archive 07d2fbd72 gra/src/<pliki> | tar -x -C <scratchpad>/pin` (tylko do odczytu, kopie usunięte).
- Generator: `python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona/gen_pin_literals.py` (zapis) oraz `--check`.
- Bramki: `CARGO_TARGET_DIR=<scratchpad>/target CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo {fmt --check | clippy --offline --all-targets -- -D warnings | test --offline --all-targets}`.
- Mutacje: `cp -r rust-port/view-model <scratchpad>/mutcopy`; `CARGO_TARGET_DIR=<scratchpad>/muttarget python3 -I 02a-obrona/mutate_validate.py <scratchpad>/mutcopy 02a-obrona/mutacje-obrona.tsv`.
- Łatka Z3: `diff -U2 --suppress-blank-empty` (bez białych znaków na końcu linii, przechodzi `git diff --check`) na kopii blobu `2f9aadd4e`; kontrola `patch -p1 --dry-run`.
- Sprzątanie: `target`, `muttarget`, `mutcopy` i kopie pinu w scratchpadzie usunięte po bramkach. Nic nie wypchnięte, nic nie zintegrowane.
