# R-RUSTPORT-P4-1-G5-NORM-OPUS — Operator, runda 1

STATUS: BLOCK (INFRA: bramka renderera nieuruchomiona — 11 GB wolnego < 12 GB i 3 równoległe procesy cargo/rustc; kod, generator i wektory zacommitowane)
DOMAIN: GAME (renderer Rust, ulepszenia per heks)
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: luka G5 z R4 — normalizacja kluczy ulepszeń (`LEGACY_KEY_ALIASES`, `normalizeImprovementKey`) i fallback do `hex.ulepszenie` w `improvementKeysForHex`, 1:1 z pinem `07d2fbd72`, z wektorami wykonanymi z tekstu pina.
BAZA: `origin/rust-port/parity-v2` = `f85622878a1bed0bee8090253d3214e12407bdea` (detached, potem gałąź robocza `rust-port-wip/p4-1-g5-norm-opus-op-r1`).
ZMIANY/COMMIT: patrz §1; kod `0671e292d0e5d1d0ad281e6d3c5654f9714f9398` (§7).
DEPLOY/PUSH: NIE WYKONANO (bez push, bez integracji).

## 0. Dowody z pina (odczyt `git show 07d2fbd72:…`)

- `gra/src/game/terrain-improvements.ts:32-34` — `LEGACY_KEY_ALIASES = { pastwisko: 'bydlo' }` (jeden wpis).
- `:117-123` — `normalizeImprovementKey`: `!raw || raw === 'brak'` → `undefined`; `key = LEGACY_KEY_ALIASES[raw] ?? raw`; zwraca `key`, gdy `IMPROVEMENTS[key]` prawdziwe, inaczej `raw`, gdy `IMPROVEMENTS[raw]` prawdziwe, inaczej `undefined` (**nieznane klucze są odrzucane**, np. legacy `kopalnia`).
- `:358-380` — `improvementKeysForHex`: **niepuste `ulepszenia` rozstrzyga samo** (normalizacja każdego klucza, `new Set`); fallback do `hex.ulepszenie` **tylko przy braku / pustym `ulepszenia`** (`:365-370`, `:377-379`).
- `gra/src/main.ts:3126-3137` — `mergedImprovementLayers`: `Set(improvementKeysForHex(hex))` + warstwa złoża zwierzęcego + `placedImprovements.get(hexKey)` **dodane surowo (bez normalizacji)**.
- Wołający `normalizeImprovementKey` (zweryfikowane grepem): `braz-access.ts:16,20`, `cyna-access.ts:30,34`, `livestock-unlock.ts:55,75,122,192`, `resource-access.ts` (import :23), `terrain-improvements.ts:94` (era) — ścieżka renderu idzie przez `improvementKeysForHex` → `mergedImprovementLayers`.

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/renderer/src/improvements/sync/build.rs` | `LEGACY_KEY_ALIASES` (1:1 z pina), `IMPROVEMENT_TABLE_KEYS` (24 własne klucze `terrain-improvements.json` w kolejności pliku, z `_meta`, `_miasto_zasieg_ref`), `JS_OBJECT_PROTOTYPE_KEYS` (12, jak `klucze_prototypu_js` silnika), `normalize_improvement_key`, `ulepszenie_web`, `improvement_keys_for_hex`; `merged_improvement_layers` przepisane wg `main.ts:3126-3137`; komentarz „gap G5” usunięty. |
| `rust-port/renderer/src/improvements/sync/input.rs` | tylko doc pola `ulepszenie` (było „not read … gap G5”, teraz czytane jako fallback). Kod bez zmian. |
| `rust-port/renderer/tests/improvements_sync_g5_gen.mjs` (NOWY) | generator: wycina z pina `Nakladka` (hex.ts:30-39), `LEGACY_KEY_ALIASES`, `normalizeImprovementKey`, `foodLayerFromAnimalDeposit`, `improvementKeysForHex`, `mergedImprovementLayers` + dane JSON, transpiluje TypeScriptem (`TYPESCRIPT_JS`), **wykonuje** i zapisuje wyniki; SHA-256 każdego fragmentu i pliku danych w `sources`; `--check` = porównanie bajt-w-bajt. |
| `rust-port/renderer/tests/improvements_sync_g5_vectors/vectors.json` (NOWY) | 44 wektory `normalize`, 33 wektory heksów (`keysForHex` + `merged`), tablice aliasów / kluczy / prototypu. |
| `rust-port/renderer/tests/improvements_sync_g5.rs` (NOWY) | 11 testów, porównania dokładne (`Vec<String>` / `Option<&str>`), każdy z `plik:linia` pina w komentarzu / komunikacie. |

Poza allowlistą NIC nie zmieniono (`view-model/**`, `engine/**`, `gra/`, `Cargo.lock`, `sync/mod.rs` — nietknięte).

## 2. Decyzje techniczne i odstępstwa od dispatchu (z dowodem)

1. **Producent DTO nie normalizuje** → normalizacja w konsumencie (`sync/build.rs`), zgodnie z DECYZJĄ dispatchu. Dowód: `rust-port/engine/src/domain/map_view.rs:367-372` (`build_hex_dyn`) przenosi `ulepszenia: hex.ulepszenia.clone()` i `improvement_key: hex.improvement_key.clone()` bez zmian; `git grep improvement_key -- rust-port/engine/src rust-port/view-model/src` nie pokazuje producenta normalizującego (tylko struktury i funkcje domenowe `improvement_build.rs`). Renderer nie zależy od silnika (`renderer/Cargo.toml`: tylko `civ-view-model`), więc tabela kluczy jest stałą w rendererze, sprawdzaną wektorami z pina.
2. **Fallback: wg pina, nie wg tekstu dispatchu.** Dispatch: „fallback do `hex.ulepszenie` tylko gdy `improvement_key` jest pusty”. Pin (`terrain-improvements.ts:365-379`) robi fallback, gdy **`ulepszenia`** jest puste/brak; `improvementKey` nie jest wejściem `improvementKeysForHex` ani żadnej ścieżki renderu (`main.ts:16281,16286` — tylko zapis). Dispatch sam każe „kolejność jak w pinie” → wdrożono pin; test `improvement_key_is_not_read` to utrwala.
3. **Warstwy postawione (placed) dodawane surowo** (`main.ts:3132-3135`). R4 przyjął `placedImprovements == HexDynDto.ulepszenia` (`syncHexUlepszenieFields`, `main.ts:16275-16289`; zapis `:17104-17119` migruje tylko `kopalnia`). Skutek zgodny z pinem: `['pastwisko']` → `['bydlo', 'pastwisko']`, `['brak']` → `['brak']`, `['', 'farma', 'brak', 'droga']` → `['farma', 'droga', '', 'brak']`. Wektory wykonane z pina to potwierdzają. **Uwaga dla Evaluatora:** dispatch zakładał „pusty klucz i `'brak'` → brak warstwy”; to prawda dla `improvementKeysForHex` (wektory `keysForHex`), ale NIE dla `mergedImprovementLayers`, gdy `''`/`'brak'` stoi w `ulepszenia` (pin dokłada placed surowo). Stary kod R4 (pomijanie `''`/`'brak'` na całej liście) był tu niezgodny z pinem.
4. **Nazwy prototypu JS** (`constructor`, `toString`, `__proto__`, …): `IMPROVEMENTS` to obiekt JS, więc pin je zwraca bez zmian — przeniesione tak samo jak w silniku (`ulepszenia-reguly.json` `klucze_prototypu_js`); lista sprawdzana z `Object.getOwnPropertyNames(Object.prototype)` w Node 22.
5. **Ścieżka migawki bez zmian:** `wants_improvement_mesh` (`sync/mod.rs`, `main.ts:16242-16244`) nadal wymaga placed/złoża — heks z samym `ulepszenie` nie dostaje meshu w `sync_snapshot`, tak jak w pinie (`syncLivestockAndPlacedMeshes`). Fallback działa w `build_improvement_group` / `spawn_improvement_mesh` (test `fallback_layers_feed_the_improvement_group`).

## 3. Wektory (generator wykonany)

```
node rust-port/renderer/tests/improvements_sync_g5_gen.mjs          -> wrote … (33 hexes, 44 keys)   EXIT 0
node rust-port/renderer/tests/improvements_sync_g5_gen.mjs --check  -> OK … (33 hexes, 44 keys)      EXIT 0
```
Node v22.23.4, TypeScript `/opt/node22/lib/node_modules/typescript/lib/typescript.js`.
Pokrycie: każdy wpis aliasu (`alias_list_pastwisko`, `alias_list_dup_pastwisko` + normalize `pastwisko`), fallback dla 8 wartości `Ulepszenie` × (brak / pusta lista), `ulepszenia` nadrzędne nad `ulepszenie`, brak fallbacku przy samych nieznanych / `'brak'` / `''`, duplikaty (pierwsza pozycja), nieznane i legacy `kopalnia`, prototyp, złoża bydła/owiec z aliasem i fallbackiem, `improvementKey` nieczytany.

## 4. Bramki (renderer) — NIEURUCHOMIONE (BLOCK INFRA)

- `df -h /` przed bramką: **11 GB wolnego** (wcześniej 5,0 GB), wymagane ≥ 12 GB; równolegle 3 procesy `cargo`/`rustc` innych workerów. Zgodnie z dispatchem bramki nie uruchomiono na pół.
- `cargo fmt --check` (bez kompilacji): po `cargo fmt` → **EXIT 0** (pierwsze wywołanie EXIT 1 — formatowanie nowego testu, poprawione).
- `cargo clippy --all-targets -- -D warnings`: NIE_ZMIERZONO.
- `cargo test --test improvements_sync_g5`: NIE_ZMIERZONO.
- `cargo test --all-targets --no-fail-fast`: NIE_ZMIERZONO (w tym regresja `improvements_sync_r4`: analitycznie bez zmian — fixture R4 nie ma aliasów, nieznanych kluczy, `''`/`'brak'` w `ulepszenia` ani `ulepszenie` ≠ `brak`; `(1,0)` ma `ulepszenie: brak` i brak `ulepszenia` → nadal `[]`).
- `git diff --check`: czysto.
- Kompilacja kodu NIEZWERYFIKOWANA (żaden `cargo build/check` nie był uruchomiony) — pierwsza bramka następnej rundy.

## 5. Mutacje — NIE_ZMIERZONO (wymagają kompilacji); analiza oczekiwanego wyniku

| Mutacja | Oczekiwany wynik | Testy, które powinny paść |
|---|---|---|
| (a) usunięcie wpisu `("pastwisko","bydlo")` z `LEGACY_KEY_ALIASES` | FAIL | `legacy_key_aliases_match_pin_table`, `normalize_improvement_key_matches_pin` (`pastwisko` → `None` zamiast `bydlo`), `merged_improvement_layers_match_pin` / `improvement_keys_for_hex_matches_pin` (`alias_list_pastwisko`, `fallback_*_pastwisko`, `deposit_*`), `every_alias_has_vectors` |
| (b) pominięcie skipu `''`/`'brak'` w `normalize_improvement_key` (`:118`) | **mutant RÓWNOWAŻNY — nie może dać FAIL** | `''` i `'brak'` nie są kluczami `IMPROVEMENTS` ani nazwami prototypu, więc dalsza część (`:119-122`) i tak zwraca `undefined`/`None`. W pinie to samo: komentarz `terrain-improvements.ts:367` („Równoważne ścieżce poniżej”). Wariant nierównoważny (b′) — skip `''`/`'brak'` na warstwach placed (stare zachowanie R4) — powinien dać FAIL na `ulepszenia_brak_no_fallback`, `ulepszenia_empty_key_no_fallback`, `brak_and_empty_skipped` (merged). Decyzja o równoważności — dla orkiestratora/Evaluatora. |
| (c) odwrócenie kolejności fallbacku (`ulepszenie` przed niepustym `ulepszenia`) | FAIL | `ulepszenia_over_ulepszenie` (`['farma', 'tartak']` zamiast `['tartak']`), `ulepszenia_all_unknown_no_fallback`, `ulepszenia_brak_no_fallback`, `fallback_only_without_ulepszenia` |

## 6. BLOKADY

1. INFRA: bramka renderera wymaga ≥ 12 GB i braku równoległych buildów; zmierzono 11 GB i 3 procesy cargo/rustc. Kod, generator i wektory są w commicie; potrzebna runda z bramką (fmt/clippy/test g5/all-targets) i pomiarem mutacji (a), (b′), (c).
2. Poza allowlistą (do osobnego tematu, nie zmieniane): doc modułu `rust-port/renderer/src/improvements/sync/mod.rs` (punkt „G5 … not done”) jest po tej zmianie nieaktualny.
3. Decyzja: dispatch kazał „'brak' → brak warstwy” i mutację (b) obowiązkowo FAIL; pin pokazuje, że (b) jest równoważne, a `'brak'` w placed zostaje warstwą — wdrożono pin (zasady 9/11: parytet 1:1).

RUNDY: 1/5
NASTĘPNY KROK: runda z bramką renderera po zwolnieniu dysku (≥ 12 GB, bez równoległych buildów): `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test improvements_sync_g5`, `cargo test --all-targets --no-fail-fast`, mutacje (a)/(b′)/(c); potem Evaluator.

## 7. Commit

- Kod + generator + wektory + testy: **`0671e292d0e5d1d0ad281e6d3c5654f9714f9398`** (rodzic `f85622878`), gałąź `rust-port-wip/p4-1-g5-norm-opus-op-r1`.
- Ten raport: osobny commit na tej samej gałęzi, bezpośrednio po `0671e292d`.
- Bez `Cargo.lock`, bez push, bez integracji.
