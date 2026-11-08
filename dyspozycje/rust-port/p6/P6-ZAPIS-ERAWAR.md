# P6-ZAPIS-ERAWAR — tabela symboli (runda 1, dług #8 MULTIWAR-2)

Pin webu: `origin/main` = `679ab078a` (`git archive origin/main gra/src gra/data`, Node 22.22).
Baza Rust: `origin/rust-port/parity-v2` = `0fd287721`.
Run: `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZAPIS-ERAWAR-MIGRACJE-Q1/`.

Zakres: zapis/odczyt licznika wojen epoki (`warRulesEraWarCountByCiv`, web R-WEB-ERA-WAR-COUNTER-Q1).
Dług #8 z `P6-DYPLOMACJA-MULTIWAR.md` (wiersze `recordEraForcedWarParticipation`, `rebuildEraWarCountsFromActivePairs`,
`restoreEraWarCounts`).

## Pomiar (stan przed zmianą)

- Web: licznik `eraWarCountByCivKey` (`main.ts:2285`), zapis `main.ts:35745-35746` (tylko gdy `isWarRulesMultiwarEnabled()`),
  odczyt `main.ts:44946-44959` (`restoreEraWarCounts` z aktywnymi parami trzech map `*ForceWarActiveByPairKey`).
- Rust: brak pola zapisu (`SaveMeta` miał tylko `battleModeSettingVersion`, `newGameParams`); brak funkcji record/rebuild/restore;
  brak rejestru aktywnych par wojen wymuszonych i brak runtime licznika (wypowiedzenie wojny nie jest jeszcze portowane).
- Gdzie żyje stan w Rust: NIGDZIE (tylko czyste funkcje w `diplomacy_multiwar.rs` przyjmują licznik jako argument).

## Web -> Rust

| Symbol (web) | Plik:linia (pin 679ab078a) | Symbol Rust | Plik Rust | Status |
|---|---|---|---|---|
| `eraWarCivKey` / `eraWarCountFor` | `war-rules-multiwar.ts:213/218` | `era_war_civ_key` / `era_war_count_for` | `domain/diplomacy_multiwar.rs` | ZROBIONE wcześniej (r2), wektory `zapis.json` potwierdzają |
| `recordEraForcedWarParticipation` | `war-rules-multiwar.ts:241` | `record_era_forced_war_participation(&mut EraWarCounts, …)` | `domain/diplomacy_multiwar.rs` | ZROBIONE (ten temat) |
| `rebuildEraWarCountsFromActivePairs` | `war-rules-multiwar.ts:258` | `rebuild_era_war_counts_from_active_pairs(&[ActiveWarPair], epoch_of)` | `domain/diplomacy_multiwar.rs` | ZROBIONE (ten temat) |
| `restoreEraWarCounts` | `war-rules-multiwar.ts:276` | `restore_era_war_counts(Option<&Value>, &[ActiveWarPair], epoch_of)` | `domain/diplomacy_multiwar.rs` | ZROBIONE (ten temat) |
| `Map<string, number>` z kolejnością `Map.set` | JS `Map` | `EraWarCounts` (`set`, `get`, `entries`, `to_hash_map`) | `domain/diplomacy_multiwar.rs` | ZROBIONE (ten temat) |
| `meta.warRulesEraWarCountByCiv` (zapis) | `main.ts:35745-35746` | `SaveMeta::with_era_war_counts(&[(String,i64)])`, pole `era_war_count_by_civ: Option<Value>` z `#[serde(rename)]` | `domain/save_load.rs` | ZROBIONE (ten temat) |
| `saved.meta?.warRulesEraWarCountByCiv` (odczyt) | `main.ts:44950-44959` | `SaveMeta::era_war_count_by_civ() -> Option<&Value>` | `domain/save_load.rs` | ZROBIONE (ten temat) |
| `evaluateEraForcedWarGate` użycie licznika | `war-rules-multiwar.ts:299` | `evaluate_era_forced_war_gate` | `domain/diplomacy_multiwar.rs` | ZROBIONE wcześniej (r2) |
| Runtime licznik + wywołania `record…` przy wypowiedzeniu, rejestry aktywnych par | `main.ts:40184-40192`, `:2281-2285` | — | — | NIE_ZMIERZONO / POZA ZAKRESEM (brak modułu wypowiedzeń wojny w Rust; dług ERAIGN „wiązanie z wypowiedzeniem”) |

## Format zapisu (web <-> Rust)

- Pole `meta.warRulesEraWarCountByCiv` = tablica par `[klucz, n]` w kolejności wstawiania (`Array.from(map.entries())`).
- Rust zapisuje tę samą postać: `["1:2",2]`, bez spacji (`serde_json::to_string`); wartość trzymana jako surowy `Value`,
  więc odczyt → zapis zachowuje bit-w-bit kolejność i wartości.
- Brak pola = stary zapis → odbudowa z aktywnych par (wartość 1 na stronę w bieżącej epoce, reszta 0).
- Zły typ pola (string, obiekt, liczba, `null`, `true`) = traktowany jak brak → odbudowa. Zły typ NIE blokuje reszty `meta`
  (np. `battleModeSettingVersion` nadal się czyta).

## Testy

- `tests/p6_zapis_erawar_counts.rs` (11 testów): wektory `tests/p6_zapis_erawar_data/zapis.json` (28 przypadków z prawdziwych
  funkcji weba: rebuild 5, restore 10, record 5 kroków kumulowanych, countFor 4, civKey 4) + zapis→odczyt, stary zapis,
  zapis z licznikami (bit-w-bit), pusta lista (= pusty licznik, nie odbudowa), zły typ → rebuild, niepoprawne wpisy pomijane,
  powtórzony klucz, ułamek pomijany (odstępstwo), napastnik == cel (+2).
- `tests/p6_zapis_erawar_save.rs` (5 testów): round-trip przez pełny serde `SaveSnapshot`, stary zapis bez pola (brak klucza
  w JSON), zły typ pola nie psuje `meta`, pusta tablica, pusta tablica zapisywana jako pole.
- Generator wektorów: Node 22.22 `--experimental-strip-types`, prawdziwe funkcje z `war-rules-multiwar.ts` (import JSON
  zamieniony na `readFileSync`; jedyny patch). Skrypt poza repo (katalog scratchpad sesji), w runie dołączony opis.

## ZAŁOŻENIA i ODSTĘPSTWA (do akceptacji)

1. ODSTĘPSTWO: liczniki są `i64` (sygnatury `era_war_count_for` / `can_civ_join_era_forced_war` z r2 używają `i64` i nie
   mogły zmienić się w tym temacie). Odczyt w Rust pomija wartości, których web by nie pominął:
   (a) ułamki (web zachowałby np. `1.5`) - test `ulamek_jest_pomijany_swiadome_odstepstwo`, bez wektora w fixture;
   (b) liczby całkowite o module > 2^53-1 (web zachowałby np. `1e20` albo `2^53`) - test
   `liczby_poza_2_53_sa_pomijane_swiadome_odstepstwo`, bez wektora w fixture (weryfikacja Node 22.22: web zwraca `1e20`, Rust pomija).
   Wartości, których Rust nie mieści w `i64`, mieszczą się w (b) (zakres bezpieczny ±(2^53-1) jest węższy niż `i64`).
   Zapis web nigdy nie produkuje ułamków ani takich wartości (inkrement o 1), więc różnica nie dotyczy zapisów webowych.
   Pozostałe przypadki z przeglądu r1 (wartość ujemna `-3`, `0`, `true` i zagnieżdżona tablica w `n`) są w fixture
   jako wektory weba: ujemna i zero zachowane tak samo, `true` i tablica pomijane tak samo.
2. ZAŁOŻENIE: bramka zapisu `isWarRulesMultiwarEnabled()` (web zapisuje pole tylko przy fladze ON) należy do wołającego budującego
   zapis; `SaveMeta` jej nie sprawdza. Odczyt NIE sprawdza flagi (zgodnie z webem: `restoreEraWarCounts` nie czyta flagi).
3. ZAŁOŻENIE: `epochOf` zawsze zwraca liczbę. Web dla nieznanego ownera dałby klucz `"id:undefined"`; w grze `empireEpochForOwner`
   zawsze zwraca epokę, więc ten przypadek nie jest modelowany.
4. ZAŁOŻENIE: aktywne pary (`ActiveWarPair`) przekazuje wołający z rejestrów wojen wymuszonych (w Rust rejestrów jeszcze nie ma).
5. ŚCIEŻKA: dispatch wskazał `rust-port/engine/src/save_load.rs`; faktyczny plik to `rust-port/engine/src/domain/save_load.rs`
   (zmieniony tylko ten plik, poza polami liczników wojen epoki nic nie ruszono).
6. Zmiana w `domain/diplomacy_multiwar.rs`: dodany `use serde_json::Value;` i nowe funkcje na końcu pliku. Istniejące
   funkcje i sygnatury bez zmian (testy `p6_dyplo_multiwar_gates` nietknięte).
7. `domain/mod.rs`, `lib.rs`, `data/`, `gra/`, `WERSJE.md`, `Cargo.toml`, renderer i `src-tauri` nietknięte.

## Bramki (partia jedna)

- `cargo fmt -- --check`: OK (po `rustfmt` na zmienionych plikach).
- `cargo clippy --all-targets -- -D warnings`: OK.
- `cargo test --no-fail-fast`: 303 binarki (lib + 302 `tests/*.rs`), 0 failed, 0 ignored nowych (wynik sumaryczny w runie).
- `cargo test --doc`: 0 passed, 0 failed.
- Baseline porównawczy (parity-v2 `0fd287721` przed zmianą): NIE_ZMIERZONO osobno; zmiany są addytywne (nowe funkcje, nowe pole
  `Option` pomijane przy braku wartości), a wszystkie 303 binarki przechodzą na drzewie po zmianie.
- Mutacje: NIE_ZMIERZONO.
