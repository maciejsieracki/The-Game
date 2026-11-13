# DISPATCH R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1 (runda 1)

TEMAT: EKONOMIA-BRAZ-ERA (#15 / T-A): przepustowość brązu per epoka — implementacja
DOMENA: GAME (implementacja). BAZA: `5e8b116e8` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1`. Przed startem: `git checkout --detach 5e8b116e8` w worktree (ten SHA ma pierwszeństwo nad wszelkimi innymi).
Pin (tylko odczyt): `git show 07d2fbd72:<ścieżka>`.

## GOAL
Wdrożyć przepustowość brązu per epoka 1:1 z pinu: klucze `throughputEraParamKeys` (converters.ts:99,100,102; konsument :178-183, :226) oraz zbiór receptur `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` (converters.ts:148-152, 3 wpisy). Zastąpić stan Rust (turn_economy_resources.rs:151-158 ma 6 wpisów; :186 mnoży m(e) także brąz). Parytet z wersją webową: gameplay wdrażamy 1:1 wg pina `07d2fbd72` (`gra/src`). Nie zmieniać zachowania poza pinem. Źródło rozpoznania: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (sekcja korekty brązu).

## ALLOWLISTA
- `rust-port/engine/src/domain/turn_economy_resources.rs (zmiany tylko w zakresie brązu per epoka)`
- `rust-port/engine/src/data/** tylko jeśli klucze przepustowości są tam czytane (uzasadnić w raporcie)`
- `rust-port/engine/tests/p6_ekonomia_braz_era*.rs (NOWE)`
- `rust-port/engine/tests/p6_ekonomia_braz_era_gen.mjs (NOWY, generator wykonujący tekst pina)`
- `rust-port/engine/tests/p6_ekonomia_braz_era_vectors/** (NOWE, wygenerowane generatorem)`
- `dyspozycje/autobot/runs/<ID>/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock`, push do rust-port/parity-v2, osłabianie istniejących asercji, `#[ignore]`.

## KRYTERIA KOŃCA
1) Wektory z pinu (generator .mjs wykonuje pin, nie ręczne liczby), SHA fragmentu pina w teście. 2) `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, nowe testy — zielone z kodami wyjścia. 3) Pełny `cargo test --no-fail-fast` przed FC (0 failed). 4) Każda zmiana oczekiwań istniejących testów opisana w raporcie z uzasadnieniem.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Operator: Haiku. Pełna bramka przed commitem. Commit bez linii Co-Authored-By z nazwą modelu, z `Claude-Session`. RUNDY: 1/5.

---

## DODATEK r2 (decyzje orkiestratora po FC FAIL r1, 13.11)

**BAZA r2: `0ca58770e`** (aktualizacja: parity-v2 po ZLOZA-B; wcześniej `d30e3ea24`) (czubek origin/rust-port/parity-v2, zawiera JS-MAX `d30e3ea24`). Wcześniejsza baza `5e8b116e8` jest nieaktualna. PIERWSZY krok: `git checkout --detach 0ca58770e` w worktree.
Operator r1 nie zacommitował kodu (praca utracona). Runda 2 zaczyna od zera: commit na `wip/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1` + `refs/keep` przed raportem.

### Decyzje (parytet z webem, bez pytania do właściciela)
1. **Allowlista rozszerzona** o `rust-port/engine/tests/p6_turn_econ_res_pipeline.rs` oraz `rust-port/engine/tests/p6_7b_vectors/**` — WYŁĄCZNIE oczekiwania dotyczące brązu zgodne z pinem `07d2fbd72` (odlewnie brązu nie są mnożone przez m(e); wiersze per epoka). Zakaz: osłabianie asercji, `#[ignore]`, usuwanie testów. Każda zmieniona wartość z podaniem linii pina.
2. **Dane:** `rust-port/engine/data/econ-params.json` (poza allowlistą) — dodać wiersze `budynek_huta_braz_epoka2_przepustowosc` i `budynek_huta_braz_epoka3_przepustowosc` (wartości 50 / 75 wg pina, linie pina 369 i 376 w `gra/data/econ-params.json`). Uzasadnienie: parytet, odczyt generyczny.
3. **Dwie ścieżki pina** (`turn-economy.ts` ok. :1503 i ok. :2484, różne fallbacki): test na wektorach pina MUSI obejmować obie ścieżki i wykazać zgodność w produkcji; rozbieżność bez wiersza epoki → jawnie w raporcie.

### Wymagania FC (poprawki do r1)
- Commit kodu i `01-operator-r1.md` (r2: `02-operator-r2.md`) obowiązkowo, z SHA w raporcie.
- Bramki z kodami wyjścia: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, `p6_ekonomia_braz_era`, `p6_turn_econ_res_pipeline`, `p6_repin_ekon_f_converters`, PEŁNY `cargo test --no-fail-fast` (0 failed).
- Dysk: start dopiero przy ≥ 8 GB wolnego (w r1 było 4,5–7,5 GB).
- Wektory generowane generatorem wykonującym pin, SHA fragmentu pina w teście.

---

## DODATEK r3 (po FC FAIL r2, 13.11)

**BAZA r3: `b611211fc`** (commit kodu r2 + obrona r2, potomek `0ca58770e`). Pierwszy krok: `git checkout --detach b611211fc`.
Świeże uruchomienie (bez cache rund poprzednich).

### Przyczyna FAIL r2
Siedem testów „running web” (`p6_adv_city_econ_pipeline`, `p6_adv_q4_preview`, `p6_adv_q5_tick` x2, `p6_adv_q6_wire`, `p6_empirefood_e2e`) ma wektory brązu z pina **4bbef081d** (huta × m(e)). Pin docelowy parytetu to **07d2fbd72** (brąz 50/75 per epoka). To rozbieżność wersji pina w starych wektorach, nie błąd w kodzie brązu.

### Decyzja orkiestratora (parytet, bez pytania do właściciela)
Rozszerzyć allowlistę o pliki, których wektory zależą od brązu, i **zregenerować je z pina 07d2fbd72**:
- `rust-port/engine/tests/p6_adv_city_econ_pipeline.rs`, `p6_adv_q4_*.rs`, `p6_adv_q5_*.rs`, `p6_adv_q6_*.rs`, `p6_empirefood_*.rs` (testy)
- ich wektory `**/vectors`, `advance.json`, `q4/q5/q6` JSON, `p6_empirefood_vectors/**`
- ich generatory `gen-*.mjs` / `*_gen.mjs` — **zmienić pin źródłowy z 4bbef081d na 07d2fbd72** (`git show 07d2fbd72:...`)

### Zakazy
- NIE osłabiać asercji, NIE `#[ignore]`, NIE usuwać testów. Zmiany wartości tylko tam, gdzie pin 07d2fbd72 różni się od 4bbef081d w brązie, z podaniem linii pina w raporcie.
- Ten sam zakres nie dotyka innych wartości niż brąz (jeśli regeneracja zmienia coś poza brązem — zgłosić w BLOKADACH, nie akceptować po cichu).

### Kryteria r3
1. Wszystkie generatory wykonują pin **07d2fbd72** (SHA fragmentu w testach zaktualizowane i zweryfikowane).
2. **Pełny `cargo test --no-fail-fast`: 0 failed** (kod wyjścia w raporcie). Jeśli timeout narzędzia — uruchomić w tle i odczytać log.
3. `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`: kody wyjścia.
4. Raport `01-operator-r3.md` z SHA i listą zmienionych wektorów (plik, liczba zmienionych wartości, linie pina).

### Gate dyskowy
Start dopiero przy ≥ 8 GB wolnego. Przed pełnym testem sprawdzić `df -h /`.
