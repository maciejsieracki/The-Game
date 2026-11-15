# SERDE-FLOAT-DECYZJA — czy włączyć `serde_json/float_roundtrip` dla testów wektorowych

Temat: #170 / #139 / #151 (dispatch `R-RUSTPORT-P6-SERDE-FLOAT-DECYZJA-Q1`, tylko odczyt).
Baza: `f7baa3848` (worktree detached). Zmiany w `Cargo.toml`, `Cargo.lock` i kodzie: brak.
Wersja: r2 (po obronie Operatora na zarzuty Evaluatora r1). Wersja r1 twierdziła „NIE”; to twierdzenie
zostało odwołane (patrz „Korekta r1” niżej).

## Decyzja

**TAK — rekomendacja: włączyć `serde_json` z feature `float_roundtrip` w `rust-port/engine` jako osobny temat
(nie w tym temacie).** Ten dokument nie zmienia `Cargo.toml`.

Uzasadnienie w skrócie: w repo jest 130 plików JSON z testami wektorowymi (`rust-port/engine/tests/**/*.json`),
w których 45 143 liczby niecałkowite są zapisane jako gołe liczby JSON z co najmniej 10 cyframi po przecinku
(zmierzone `git grep` na `f7baa3848`). Są czytane przez `Value::as_f64()` / `serde_json::from_value::<f64>`
bez `float_roundtrip`. Domyślna ścieżka parsera nie gwarantuje bit-w-bit dla mantys > 2^53 (≥17 cyfr znaczących),
a repo to już zmierzyło: `p6_brake_inputs_vectors.rs:367-372` opisuje, że `1713.1000000000001` czyta się jako
`1713.1`, i to jest maskowane tolerancją `close()` (`p6_brake_inputs_vectors.rs:370-372`, użycia na liniach
452, 466, 471, 475; tolerancja względna 1e-9). Zamiast porównania bit-w-bit testy porównują z tolerancją,
więc część asercji wektorowych jest słabsza niż pin.

Konwencja tekstowa (liczba zapisana jako string) jest stosowana tylko w części generatorów (patrz krok 2),
nie w całym zbiorze wektorów. Nie znaleziono zapisanej reguły projektowej, która zabrania gołych liczb
niecałkowitych; poprzednie sformułowanie „obowiązująca reguła” zostało usunięte jako nieudokumentowane.

Osobny temat (propozycja zakresu, NIE w tym temacie):
1. `rust-port/engine/Cargo.toml:9`: `serde_json = { version = "1.0", features = ["float_roundtrip"] }`
   (zgodnie z `rust-port/view-model/Cargo.toml:22`, który już ma ten feature jako dev-dependency).
2. Usunięcie tolerancji `close()` w `rust-port/engine/tests/p6_brake_inputs_vectors.rs` (linie 370-372 i użycia
   452, 466, 471, 475) i przejście na porównanie bit-w-bit z pinem; ewentualne różnice wynikające z tej zmiany
   są wynikiem do zbadania, nie maskowania.
3. Pełny `cargo test` silnika po zmianie Cargo.toml; `Cargo.lock` może się zmienić (osobna decyzja, nie commitować
   bez przeglądu).
4. Alternatywa do rozważenia w tym osobnym temacie: zachować tekst dla wektorów i dodać test strażniczy
   wykrywający gołe liczby niecałkowite z ≥10 cyframi w `tests/**/*.json`. Ta alternatywa NIE usuwa ryzyka
   dla istniejących 130 plików bez migracji wszystkich generatorów.

Wariant NIE (bez zmian) zostaje odrzucony, bo wymagałby migracji 130 plików JSON albo zaakceptowania tolerancji,
a żadne z tych wyjść nie jest bit-w-bit.

## Korekta r1 (co zmieniono względem pierwszej wersji dokumentu)

- Usunięto twierdzenie „żaden wektor nie przechodzi ścieżką domyślną”. Jest fałszywe: 130 plików, 45 143 liczby.
- Usunięto twierdzenie „jedynym odczytem f64 jest `derived_values.rs:565`”. Jest fałszywe: w `rust-port/engine/tests`
  jest 578 wystąpień `as_f64` w 239 plikach (łącznie z `src`/`tests`, zliczone `git grep` na `f7baa3848`), a w testach
  wektorowych m.in. `p6_8a_vectors.rs:44,256`, `p6_7a_vectors/common.rs:41,90`, `p6_6b_vectors/common.rs:37,86`,
  `p6_4_vectors/common.rs:20`, `economy_city_vectors_r4.rs:36,167,168,192,212`, `p6_1c_start_cluster.rs:256,261,599,604`,
  `p6_8b2_p2_vectors.rs:42,237,313,314,329,330`.
- Usunięto „Ryzyko 0” dla `derived_values.rs:565`. Wpis `0.1` jest bezpieczny (patrz krok 3), ale to jeden wpis z wielu.
- Zastąpiono „Obowiązująca reguła” opisem faktycznej konwencji (patrz wyżej).
- Dodano wpływ tolerancji `close()` (r1 jej nie wymieniał).

## Krok 1 — features serde_json

- `rust-port/engine/Cargo.toml:9`: `serde_json = "1.0"`, bez features (silnik i testy silnika).
- `rust-port/view-model/Cargo.toml:22`: `serde_json = { version = "1.0", features = ["float_roundtrip"] }`
  w `[dev-dependencies]` (komentarz w liniach 19–21).

## Krok 2 — użycia serde_json i f64 z JSON w rust-port

- Dane silnika (`rust-port/engine/src/data/*.rs`, np. `derived.rs:146–464`, `civilizations.rs:1351–1376`):
  `serde_json::from_str` na plikach z `include_str!`. Tabele konfiguracyjne.
- Testy silnika: około 700 wywołań `serde_json::from_str` / `from_value` (r1, nie przeliczono).
- Gołe liczby niecałkowite z ≥10 cyframi po przecinku w `rust-port/engine/tests/**/*.json`: **130 plików,
  45 143 wystąpienia** (zmierzone 2026-11-15, `git grep -noE` na `f7baa3848`, wzorzec: liczba po `:`, `[`, `,`
  i przed `]`, `,`, `}`; liczby w cudzysłowie nie są liczone). Przykłady:
  `rust-port/engine/tests/p6_brake_inputs_vectors/vectors.json` (np. `8.666666666666666`, `7961.666666666666`),
  `rust-port/engine/tests/p6_1c_vectors/llama.json` (np. `"h":0.6326704167295247`),
  `rust-port/engine/tests/fixtures/economy_city_vectors_91dc998a.json` (np. `-1.0000000000000001e-11`).
- Odczyty f64 przez `as_f64` / `from_value` na tych wektorach: patrz korekta r1 (wiele plików, nie jeden).
- Liczby wektorów zapisywane jako tekst: `economy_city_vectors.rs:27–34` (`parse_num`, `str::parse::<f64>`) oraz
  generatory w `dyspozycje/autobot/runs/*/gen-*.mjs` (np. `gen-p61-web-vectors.mjs:100`,
  `gen-p64-vectors.mjs:800–803` `floatSafe`, `gen-p65b-vectors.mjs:6`). Ta konwencja NIE obejmuje wszystkich
  generatorów, o czym świadczy liczba plików z punktu wyżej.
- `derived_values.rs:565` (`znizka_rekrutacji`, oś `[0, 0.1]`, `rust-port/engine/data/derived/unit-gold-states.json:23–26`):
  wpis `0.1` jako gołe JSON number. Bezpieczny, bo `significand = 1`, `exponent = -1` daje pojedyncze dzielenie
  `1.0 / 10.0` (krok 3).

## Krok 3 — czy domyślne parsowanie serde_json jest bit-w-bit (dokumentacja, bez uruchamiania)

Źródło: `/root/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/serde_json-1.0.154/src/de.rs`
(lokalny rejestr; bez pobierania sieciowego; ponownie odczytane w r2).

- Gałąź z `float_roundtrip` (`de.rs:623–636`): `lexical::parse_concise_float::<f64>(significand, exponent)`,
  dokładne zaokrąglenie.
- Gałąź domyślna (`de.rs:638–670`): `f = significand as f64`, potem jedno mnożenie lub dzielenie przez
  `POW10[|exponent|]` (`de.rs:645–660`); dla wykładnika spoza tabeli kolejne dzielenia przez `1e308` (`de.rs:661–666`).
- Wniosek precyzyjny: gdy `significand ≤ 2^53` i `|exponent| ≤ 22`, obie operacje są dokładne i jedno dzielenie
  daje wynik poprawnie zaokrąglony (klasyczna ścieżka szybka). Gdy `significand > 2^53` (≥17 cyfr znaczących,
  np. `1713.1000000000001` = `17131000000000001 · 10^-13`), konwersja `significand as f64` już zaokrągla, więc
  wynik może różnić się o 1 ulp. Dla wektorów z pinu, które mają 16–17 cyfr znaczących, ryzyko jest realne.
- Dowód z repo (zapisany, nie ponownie zmierzony w tym temacie): `p6_brake_inputs_vectors.rs:367-372` (komentarz
  o `1713.1000000000001` → `1713.1`), `dyspozycje/rust-port/p6/P6-1-STAN-STARTOWY.md:23` (r2: 1-ulp błąd w teście
  RNG bez `float_roundtrip`).
- NIE_ZMIERZONO: nie uruchamiano parsera na wektorach (dispatch: tylko odczyt, bez cargo). Liczba wektorów
  faktycznie rozjeżdżających się bitowo nie jest znana; jest znane tylko to, że ścieżka może się rozjechać.

## Krok 4 — wpis decyzji

| Pytanie | Odpowiedź | Dowód |
|---|---|---|
| Czy włączyć `float_roundtrip` (w osobnym temacie)? | TAK (rekomendacja) | 130 plików, 45 143 gołe liczby ≥10 cyfr; `p6_brake_inputs_vectors.rs:367-372`, `:452-475` |
| Czy domyślne parsowanie jest bit-w-bit dla wektorów? | NIE (brak gwarancji dla significand > 2^53) | `serde_json-1.0.154/src/de.rs:638–670` vs `:623–636` |
| Czy testy maskują różnice? | TAK: tolerancja względna 1e-9 w `close()` | `p6_brake_inputs_vectors.rs:370-372` |
| Zmiana Cargo.toml w tym temacie? | Brak | — |
| Czy `derived_values.rs:565` (0.1) jest bezpieczny? | TAK (pojedyncze dzielenie) | `de.rs:645–660`, `unit-gold-states.json:23–26` |

Ponowne otwarcie: po zamknięciu osobnego tematu (feature + usunięcie `close()`), albo gdy nowy test czyta
niecałkowity f64 z gołej liczby JSON bez `float_roundtrip`.

## Kontrole

- `git diff --check`: patrz raport `02a-obrona.md` (po commicie).
- Allowlista: `dyspozycje/rust-port/p6/SERDE-FLOAT-DECYZJA.md` oraz `dyspozycje/autobot/runs/R-RUSTPORT-P6-SERDE-FLOAT-DECYZJA-Q1/**`.
- Nie uruchamiano `cargo`.
