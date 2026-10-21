# P3-5E — Dane ekonomii i społeczeństwa: 9 plików JSON → struktury Rust (`R-RUSTPORT-P3-5E-DATA-ECON-SOCIETY-Q1`)

STATUS: wynik Operatora rundy 1/5. Zakres wykonany w całości: 9/9.
BAZA: `origin/rust-port/parity-v2` @ `9e33fc77` (worktree odłączony na tym commicie; `--detach`, bez zmiany gałęzi).
PIN DANYCH: `edb8fb56` (`gra/data/*.json`, odczyt wyłącznie przez `git show`/`git ls-tree`; `gra/**` nietknięte).
PUSH: NIE WYKONANO. DEPLOY: NIE WYKONANO.

## 1. Pokrycie 9/9 (jawnie)

| # | Plik (pin `edb8fb56`) | Kopia w `rust-port/engine/data/` | Blob pin = blob kopii | Struktura Rust (moduł) | Spot-check |
|---|---|---|---|---|---|
| 1 | `econ-params.json` | tak | `edc05299…` = `edc05299…` | `EconParams` (`economy_society.rs`) | 3 |
| 2 | `society-params.json` | tak | `d51e7377…` = `d51e7377…` | `SocietyParams` (`economy_society.rs`) | 3 |
| 3 | `epoka-ludnosc-manpower.json` | tak | `2911354e…` = `2911354e…` | `EpokaLudnoscManpower` (`economy_society.rs`) | 3 |
| 4 | `citizen-resource-upkeep.json` | tak | `c54964d8…` = `c54964d8…` | `CitizenResourceUpkeep` (`economy_society.rs`) | 3 |
| 5 | `miasto-params.json` | tak | `f6fe8e01…` = `f6fe8e01…` | `MiastoParams` (`economy_society.rs`) | 3 |
| 6 | `resources.json` | tak | `7f2f9cd7…` = `7f2f9cd7…` | `Vec<ResourceItem>` (`economy_society.rs`) | 3 (+ długość 15) |
| 7 | `e-start-params.json` | tak | `2186f87f…` = `2186f87f…` | `EStartParams` (`economy_society_part2.rs`) | 3 |
| 8 | `ai-params.json` | tak | `9965e8c3…` = `9965e8c3…` | `AiParams` (`economy_society_part2.rs`) | 3 |
| 9 | `ui-params.json` | tak | `f2b17280…` = `f2b17280…` | `UiParams` (`economy_society_part2.rs`) | 3 |

Wynik: **9/9** plików skopiowanych 1:1 (bajt w bajt, zgodność blob SHA-1 z drzewem `edb8fb56`), **9/9** ma odpowiadającą strukturę `#[derive(Deserialize)]`, **9/9** parsuje się w teście jednostkowym, **9/9** ma co najmniej 1 spot-check liczbowy (resources: długość tablicy 15 jako jedyna wartość liczbowa w pliku; plik nie zawiera pól liczbowych).

Pliki źródłowe Rust: `rust-port/engine/src/data/economy_society.rs` (844 linii, 33 struktury, 6 plików JSON) oraz `rust-port/engine/src/data/economy_society_part2.rs` (591 linii, 22 struktury, 3 pliki JSON) — podział zgodny z dispatchem (zbyt duży jeden plik).

## 2. Metoda — 1:1 bez zgadywania kształtu

Kształt wyprowadzono z FAKTYCZNEJ zawartości plików na pinie (generator Pythona czyta JSON, nie pamięć). Zasady:
- każdy obiekt JSON → `struct` z polami `snake_case`, a oryginalny klucz zachowany przez `#[serde(rename = "…")]` (klucze polskie z diakrytykami, np. `"próg_wzrostu_wspolczynnik"`, `"Źródło / budynek"`, `"Super Huge"` — bez zmiany znaczenia);
- liczby całkowite → `i64`, liczby z ułamkiem (lub mieszane int/float) → `f64`, tekst → `String`, bool → `bool`, tablica → `Vec<…>`;
- identyczne kształty obiektów są współdzielone jedną strukturą (np. trójka `easy/normal/hard` + `jednostka` + `opis`);
- pola opcjonalne (`Option`) — 0 w tym zbiorze; pól `serde_json::Value` (typ nieznany) — 0.

**Pokrycie kluczy (sprawdzone maszynowo):** 514 obiektów JSON, 2475 wystąpień kluczy w 9 plikach, 531 unikalnych `serde(rename)` w kodzie, **brakujących kluczy: 0**. (Konieczne, bo serde domyślnie ignoruje nieznane pola — sam sukces parsowania nie dowodzi pokrycia.)

Oświadczenie o zakresie: testy weryfikują parsowanie, pokrycie kluczy i wybrane wartości. Nie porównują całej zawartości wartość po wartości z plikiem — kopia pliku jest bajtowo identyczna (sekcja 1), a struktura pokrywa każdy klucz.

## 3. Spot-checki (wartości z pinu → asercje w `tests/data_economy_society.rs`)

| Plik | Ścieżka | Wartość z JSON |
|---|---|---|
| econ-params | `ekonomia_miasta.próg_wzrostu_wspolczynnik.easy` | 12 |
| econ-params | `teren_mapa.teren_rzeka_zywnosc.normal` | 3 |
| econ-params | `handel_surowce.pakiet_wielkosc.hard` | 10 |
| society-params | `zdrowie.zdrowie_rzeka.easy` | 3 |
| society-params | `kultura.kultura_konwersja_stela.normal` | 0.5 |
| society-params | `prawo.prawo_bonus_stolica_easy.hard` | 0 |
| epoka-ludnosc-manpower | `epoki[0].epoka` | 1 |
| epoka-ludnosc-manpower | `epoki[0].manpowerNaLudka` | 1000 |
| epoka-ludnosc-manpower | `epoki[0].manpowerNaJednostke` | 1000 |
| citizen-resource-upkeep | `_kara.szczescieZaDostepny` | 2 |
| citizen-resource-upkeep | `_kara.rozwojPctZaBrakujacy` | -1 |
| citizen-resource-upkeep | `epoki[0].epoka` | 1 |
| miasto-params | `min_dystans_miast.wartosc` | 4 |
| miasto-params | `zasieg_okolicy_miasta.wartosc` | 10 |
| miasto-params | `udzial_output_rozwoj.wartosc` | 0.1 |
| resources | długość tablicy | 15 |
| resources | `[0].Surowiec` | "Żywność" |
| resources | `[0].Źródło / budynek` | "pola (wg terenu)" |
| e-start-params | `defaulty.city_limit_base_default` | 10 |
| e-start-params | `skala_mapy.Ogromny.miasta_panstwa` | 8 |
| e-start-params | `kreator_zaawansowane.manual_seed_default` | 424242 |
| ai-params | `trudnosc_poziom1_bonus_produkcja.wartosc` | 0 |
| ai-params | `ai_sojusz_obowiazek_min_ratio.wartosc` | 0.55 |
| ai-params | `ludy_morza_rajd_okres_trudny.wartosc` | 1 |
| ui-params | `panel_miasta.rush_cost_mnoznik` | 0.8 |
| ui-params | `panel_miasta.font_scale_domyslna_px` | 16 |
| ui-params | `nowa_gra.ustawienia[0].domyslny` | 1 |

(Uwaga: tabela podaje ścieżki w notacji JSON, dokładnie jak klucze występują w pliku, z diakrytyką i podkreśleniem tam, gdzie są w pliku: `próg_wzrostu_wspolczynnik`, `_kara`, `szczescieZaDostepny`. W kodzie są odpowiedniki `snake_case` przez `#[serde(rename = "…")]`, np. `prog_wzrostu_wspolczynnik` (rename `próg_wzrostu_wspolczynnik`), `kara` (rename `_kara`), `szczescie_za_dostepny` (rename `szczescieZaDostepny`), `rozwoj_pct_za_brakujacy`. Każda ścieżka z tabeli została sprawdzona po ścieżce JSON na pinie `edb8fb56`: 27/27 zgodnych, zob. sekcja 9.)

## 4. Surowe logi `cargo test`

Toolchain (ten sam co P3-1-2): `rustc 1.97.0 (2d8144b78 2026-07-07)`, `cargo 1.97.0 (c980f4866 2026-06-30)`.
Crate: `rust-port/engine` (`civ-engine`). Zmiany w `Cargo.toml`: **brak**.

### 4.1 Nowy test — `cargo test --test data_economy_society` (exit 0)

```text
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running tests/data_economy_society.rs (/dev/shm/p3-5e/target/debug/deps/data_economy_society-216bcd63aabb4628)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

### 4.2 Regresja całego crate — `cargo test` (exit 0)

Przed zmianą (baza `9e33fc77`): **224 passed, 0 failed**, 27 binarek z `test result: ok`. Zweryfikowane ponownie przez operatora rundy 1: `cargo test` na checkoutcie `9e33fc77` (rustc/cargo 1.97.0), log poza repo. Zgodne z P3-1-2 (`00a00501`: 224 passed).
Po zmianie (checkout `cb246109`): **233 passed, 0 failed** (224 + 9 nowych), 28 binarek z `test result: ok` (27 bazowych + `data_economy_society`), `grep -ci warning` na logu = 0. Sumy wzięte z surowego logu (`grep '^test result'`); log poza repo (scratchpad operatora).

Kompilacja przy zmianach: `Compiling civ-engine v0.1.0 … Finished \`test\` profile` — bez warningów.

## 5. Dlaczego bez zmian w `lib.rs`, `domain/` i `Cargo.toml`

- Nowe moduły NIE są zadeklarowane w `lib.rs` (zgodnie z dispatchem: rewiring to osobny temat). Test włącza je przez `#[path = "../src/data/…rs"] mod …;` w `tests/data_economy_society.rs`.
- `serde_json` jest dev-dependency (`Cargo.toml`: `[dev-dependencies] serde_json`). Funkcje `parse_*` używają `serde_json::from_str`, ale są kompilowane wyłącznie w crate testowym (przez `#[path]`), gdzie dev-dependency jest dostępne. Dzięki temu nie trzeba zmieniać `Cargo.toml`. Gdy rewiring przeniesie moduły do `lib`, `serde_json` trzeba będzie przenieść do `[dependencies]` — to świadoma decyzja dla tematu konsolidacyjnego, nie tego.
- Zero zmian w istniejących plikach `.rs`.

## 6. Pliki zmienione / dodane (allowlista z dispatchu)

Dodane (9 kopii JSON): `rust-port/engine/data/{econ-params,society-params,epoka-ludnosc-manpower,citizen-resource-upkeep,miasto-params,resources,e-start-params,ai-params,ui-params}.json`
Dodane (kod): `rust-port/engine/src/data/economy_society.rs`, `rust-port/engine/src/data/economy_society_part2.rs`
Dodane (test): `rust-port/engine/tests/data_economy_society.rs`
Dodane (dokument): `dyspozycje/rust-port/p3/P3-5E-DATA-ECON-SOCIETY.md` (ten plik)
Niezmienione: `Cargo.toml`, `Cargo.lock` (nie istnieje w repo; wygenerowany lokalnie przez `cargo`, NIE dodany do commita), `lib.rs`, `domain/**`, `gra/**`.

## 7. Blokady i uwagi

- **Miejsce na dysku:** w trakcie prac `/` i `/tmp` były zapełnione (0 MB wolnego na fs narzędzia). Build przeniesiono na `/dev/shm/p3-5e/` (`CARGO_TARGET_DIR`, `TMPDIR`). Usunięto wyłącznie pliki wyjścia wywołań narzędzi tej sesji (`…/tasks/*.output`). Pozostałe pliki w `scratchpad` innych przebiegów nie były ruszane.
- **Dokumenty źródłowe:** `P2-9-ASSET-DATA-MAPPING.md`, `P1-16D-OPISY-EKONOMIA5X.md` i `P3-1-2-TOOLCHAIN.md` NIE występują w bazie `9e33fc77`, ale SĄ w historii git innych gałęzi/commitów. Odczytano je z historii (`git show <sha>:<ścieżka>`, nie z checkoutu): P2-9 `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` @ `6e60ca3a`; P1-16D `dyspozycje/rust-port/p1/P1-16D-OPISY-EKONOMIA5X.md` @ `afcb8ede`; P3-1-2 `dyspozycje/rust-port/p3/P3-1-2-TOOLCHAIN.md` @ `00a00501`. Wnioski: P2-9 potwierdza brak pełnej struktury dla tych plików (stan „BRAK”/„CZĘŚCIOWO”), co jest dokładnie luką tego tematu. P1-16D dotyczy rozjazdu ×5 w `buildings.json`/`units.json`/`terrain-improvements.json` oraz wiki — nie dotyczy bezpośrednio 9 plików tego tematu. Wartości skopiowano bez korekt; nie wykonano porównania wartościowego z wiki.
- **`git diff --check`:** jedyny zgłoszony problem to końce linii CRLF (`\r`) w `rust-port/engine/data/epoka-ludnosc-manpower.json`. Plik jest bajtowo identyczny z pinem (blob `2911354e…`; SHA-1 kopii = SHA-1 `git show edb8fb56:gra/data/epoka-ludnosc-manpower.json`; pin ma 20 linii CRLF, kopia 20), więc CR zostaje celowo, zgodnie z zakazem zmian w kopii 1:1. To uwaga procesowa, nie błąd danych. Pozostałe 8 plików JSON, kod Rust, test i dokument przechodzą `--check` bez uwag.
- **Brak zmian wartości:** nie przeliczono ani nie skorygowano żadnej liczby. Kopie są identyczne z pinem.

## 8. Podsumowanie binarne

- 9/9 plików skopiowanych 1:1 (blob SHA identyczny z pinem).
- 9/9 w strukturach `serde`, 9/9 parsuje się w teście (`cargo test … data_economy_society`, exit 0).
- 9/9 ma spot-check liczbowy (resources: długość 15).
- Pełny crate: 233 passed, 0 failed (baseline 224).
- Pokrycie kluczy: 2475/2475 wystąpień (531 unikalnych renames), 0 brakujących.

## 9. Korekty po zarzutach Evaluatora (runda 1/5, Operator)

- **Zarzut 1 (notacja ścieżek w sekcji 3) — PRZYJĘTY, poprawiony.** Klucz `ekonomia_miasta.próg_wzrostu_wspolczynnik` (z diakrytyką), `_kara` zamiast `kara`. Wszystkie 27 ścieżek z tabeli sprawdzono skryptem po ścieżkach JSON na pinie `edb8fb56`: 27/27 zgodne (w tym `resources`: długość 15, `[0].Surowiec` = "Żywność"). Rust-mapowanie potwierdzone w `economy_society*.rs`: `#[serde(rename = "_kara")] kara`, `#[serde(rename = "próg_wzrostu_wspolczynnik")] prog_wzrostu_wspolczynnik`, `#[serde(rename = "rozwojPctZaBrakujacy")] rozwoj_pct_za_brakujacy`.
- **Zarzut 2 (baseline 224 niezweryfikowany) — PRZYJĘTY, zweryfikowany.** `cargo test` na `9e33fc77`: 224 passed, 0 failed, 27 binarek. `cargo test` na `cb246109`: 233 passed, 0 failed, 28 binarek, 0 warningów. Liczba „27 binarek” po zmianie w poprzedniej wersji była błędna (poprawne: 28), skorygowano w 4.2.
- **Zarzut 3 (dokumenty wymagane przez dispatch) — PRZYJĘTY, odczytane z historii git.** Treść P2-9, P1-16D-EKONOMIA5X i P3-1-2 odczytana przez `git show <sha>:<ścieżka>` (sekcja 7). Wnioski niezmienione: P2-9 wskazuje econ/society/citizen/e-start/ai/ui jako BRAK lub CZĘŚCIOWO, co jest zakresem tego tematu; P1-16D nie dotyczy tych 9 plików; P3-1-2 potwierdza 224 jako baseline.
- **Zarzut 4 (CRLF w `epoka-ludnosc-manpower.json`) — ODRZUCONY z dowodem.** Pin `edb8fb56:gra/data/epoka-ludnosc-manpower.json` ma 20 linii CRLF; kopia w `cb246109` ma 20 linii CRLF; SHA-1 obu plików identyczny. Usunięcie CR złamałoby zasadę kopii 1:1.

DEPLOY/PUSH: NIE WYKONANO.
