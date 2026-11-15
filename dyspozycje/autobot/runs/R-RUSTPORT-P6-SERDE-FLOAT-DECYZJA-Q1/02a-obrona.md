# 02a-obrona — R-RUSTPORT-P6-SERDE-FLOAT-DECYZJA-Q1 (runda 1, obrona Operatora)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-SERDE-FLOAT-DECYZJA-Q1 (#232 / #170 / #139 / #151)
GOAL: Decyzja TAK/NIE/NIE_ZMIERZONO dotycząca `serde_json/float_roundtrip` dla testów wektorowych; dokument bez zmian w Cargo.toml.
SHA: baza operatora `85110d3f6` (gałąź `claude/serde-float-decyzja-q1-wip`); commit obrony: patrz sekcja „Commit” niżej.

## Odpowiedzi na zarzuty

1. KRYTYCZNY — fałszywa przesłanka „żaden wektor nie przechodzi ścieżki domyślnej”: **PRZYJMUJĘ.**
   Zmierzone `git grep -noE` na `f7baa3848`: 130 plików `rust-port/engine/tests/**/*.json`, 45 143 gołych liczb
   niecałkowitych z ≥10 cyframi po przecinku (np. `p6_brake_inputs_vectors/vectors.json`: `8.666666666666666`,
   `7961.666666666666`). Dokument poprawiony: `dyspozycje/rust-port/p6/SERDE-FLOAT-DECYZJA.md`, sekcja „Decyzja” i „Korekta r1”.
   Wniosek zmieniony z NIE na TAK (rekomendacja, osobny temat).

2. KRYTYCZNY — pominięty dowód przeciwny i maskowanie `close()`: **PRZYJMUJĘ.**
   Dodano do dokumentu: `p6_brake_inputs_vectors.rs:367-372` (komentarz o `1713.1000000000001` → `1713.1`),
   `close()` z tolerancją względną 1e-9 (`:370-372`), użycia na liniach 452, 466, 471, 475 (zweryfikowane).
   Zakres osobnego tematu: usunięcie `close()` i porównanie bit-w-bit z pinem.

3. WYSOKI — niepełny krok 2 (inne `as_f64`): **PRZYJMUJĘ.**
   Zweryfikowane: `git grep as_f64` na `f7baa3848` w `rust-port/engine`: 578 wystąpień w 239 plikach. Wymienione
   pliki z zarzutu istnieją z podanymi liniami (`p6_8a_vectors.rs:44,256`, `p6_7a_vectors/common.rs:41,90`,
   `p6_6b_vectors/common.rs:37,86`, `p6_4_vectors/common.rs:20`, `economy_city_vectors_r4.rs:36,167-212`,
   `p6_1c_start_cluster.rs:256-604`, `p6_8b2_p2_vectors.rs:42-330`). Krok 2 i korekta r1 w dokumencie rozszerzone.

4. ŚREDNI — niezweryfikowana reguła „niecałkowite tylko jako tekst”: **PRZYJMUJĘ.**
   Nie znaleziono zapisanej reguły projektowej. Sformułowanie „Obowiązująca reguła” usunięto. Dokument opisuje
   konwencję tekstową jako stosowaną tylko w części generatorów (`economy_city_vectors.rs:27-34` `parse_num`,
   `gen-p64-vectors.mjs:800-803`, `gen-p65b-vectors.mjs:6`), co potwierdza liczba plików z zarzutu 1.

5. ŚREDNI — brak pomiaru taniej metodą odczytową: **PRZYJMUJĘ w zakresie odczytu, ODRZUCAM w zakresie uruchomienia.**
   Pomiar odczytowy (grep po JSON-ach, punkt 1) został wykonany i wpisany do dokumentu (liczby, wzorzec, pliki).
   Pomiaru bit-w-bit (uruchomienie parsera) nie wykonano: dispatch zabrania `cargo` (tylko odczyt). Pozostaje
   **NIE_ZMIERZONO** i jest to jawnie opisane w dokumencie (krok 3).

6. NISKI — analiza `de.rs` i ocena `0.1` (`derived_values.rs:565`): **PRZYJMUJĘ jako poprawną, bez zmiany wniosku.**
   Ocena `0.1` zostaje (pojedyncze dzielenie `1.0 / 10.0`). Dodano precyzyjniejszy warunek: ścieżka domyślna jest
   dokładna dla `significand ≤ 2^53` i `|exponent| ≤ 22`; ryzyko dotyczy `significand > 2^53` (≥17 cyfr).
   Ponownie odczytano `serde_json-1.0.154/src/de.rs:623-670` z lokalnego rejestru (zgodne z r1).

7. UWAGA — błędne NIE nie może zablokować #170/#151: **PRZYJMUJĘ.**
   Dokument przedstawia TAK jako rekomendację z listą dotkniętych plików, zmianą `engine/Cargo.toml` (osobny temat)
   i usunięciem tolerancji `close()`. Wariant NIE jest jawnie odrzucony z uzasadnieniem.

## Pozytywne uwagi evaluatora

Allowlista (3 pliki) i `git diff --check` — potwierdzone; w tej rundzie ponownie: `git diff --check` czysty
przed commitem obrony. Brak zmian w `Cargo.toml`, `Cargo.lock`, kodzie; brak `#[ignore]`.

## Testy

- Brak `cargo` (dispatch: tylko odczyt). Kontrole: `git diff --check` OK; `git grep` (zarzuty 1, 3); odczyt `de.rs`.
- Pomiary (zob. dokument): 130 plików, 45 143 liczb ≥10 cyfr; 578 `as_f64` w 239 plikach (engine, `git grep`).

## BLOKADY

- NIE_ZMIERZONO: faktyczna liczba wektorów rozjeżdżających się bitowo przy domyślnej ścieżce serde_json (wymaga
  uruchomienia parsera, poza zakresem dispatchu).
- NIE_ZMIERZONO: 1-ulp błąd domyślnej ścieżki potwierdzony tylko historycznie (`P6-1-STAN-STARTOWY.md:23`) i w komentarzu
  `p6_brake_inputs_vectors.rs:367-372`.

## Zmiany

- `dyspozycje/rust-port/p6/SERDE-FLOAT-DECYZJA.md` — przepisany (r2): decyzja TAK (rekomendacja, osobny temat), korekta r1.
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-SERDE-FLOAT-DECYZJA-Q1/02a-obrona.md` — ten plik (nowy).

## Commit

Commit jawnym `git add` (dwa pliki wyżej), bez push, bez integracji. SHA: patrz wpis na końcu raportu odpowiedzi.

RUNDY: 1/5 (obrona Operatora, runda 1 po werdykcie Evaluatora)
NASTĘPNY KROK: Evaluator r2 (Sonnet) weryfikuje zmieniony dokument względem zarzutów 1–7; Final Control po PASS.
DEPLOY/PUSH: NIE WYKONANO (dispatch: bez push do parity; push tylko gałęzi wip po decyzji orkiestratora).
