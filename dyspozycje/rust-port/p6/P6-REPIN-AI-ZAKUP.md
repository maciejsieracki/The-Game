# P6 REPIN — zakup jednostek przez AI: rezerwa utrzymania (R-RUSTPORT-REPIN-AI-ZAKUP-REZERWA-Q1)

Baza Rust: `origin/rust-port/parity-v2` @ `0fd287721`. Baza web (pomiar i wektory): `origin/main` @ `679ab078a`.

## 1. Pomiar (przed zmianą)

| Pytanie | Wynik | Dowód |
|---|---|---|
| Czy web ma regułę zakupu AI z rezerwą? | TAK | `gra/src/game/ai.ts:7207-7242` `shouldAIPurchaseUnit`; `:7244-7262` `AiPurchaseReserveParams`, `loadAiPurchaseReserveParams`; `:208-212` `getAiParam`; wywołanie `gra/src/main.ts` (`wantsPurchase = shouldAIPurchaseUnit({...aiPurchaseReserveInputs})`) |
| Czy Rust ma odpowiednik `shouldAIPurchaseUnit`? | NIE | `git grep -n -i "shouldAIPurchaseUnit\|kupno_jednostki\|zakup" -- rust-port/engine/src` — brak funkcji AI-zakupu; trafienia dotyczą tylko kosztu zakupu budynku/jednostki (`data/derived.rs`, `production_units.rs`), zakupu wodza (`generals.rs`), rekrutacji jednorazowej (`recruitment.rs`) |
| Czy `ai_turn.rs` wywołuje zakup jednostki? | NIE | `rust-port/engine/src/domain/ai_turn.rs` nie zawiera ścieżki zakupu (grep powyżej) |
| Czy Rust wczytuje klucze `kupno_jednostki_*`? | NIE (przed zmianą) | `rust-port/engine/data/ai-params.json` nie zawiera kluczy; `AiParams` ma `deny_unknown_fields` |
| Typ wartości w `ai-params.json` (Rust) | `{"wartosc","sekcja","opis"}`, `wartosc` = `i64` (`AiParamsTrudnoscPoziom1BonusProdukcja`) | `rust-port/engine/src/data/economy_society_part2.rs:229-236` |

Wniosek: odpowiednik AI-zakupu w Rust NIE istnieje. Zgodnie z dispatchem portuję minimalną funkcję czystą
(bez wiązania z turą AI) + parametry + wektory z weba.

## 2. Wartości parametrów (web `gra/data/ai-params.json` @ 679ab078a = Rust po zmianie)

| Klucz | Łatwy (1) | Normalny (2) | Trudny (3) |
|---|---|---|---|
| `kupno_jednostki_rezerwa_tur` | 10 | 3 | 0 |
| `kupno_jednostki_min_dochod_netto` | 0 | 0 | -2 |

`rezerwa` = decyzja właściciela 2026-11-08 (10/3/0). `min_dochod_netto` = PLACEHOLDER po stronie weba (opis w JSON), przeniesiony 1:1 bez zmiany wartości.

## 3. Zmiany w Rust (allowlista)

- `rust-port/engine/data/ai-params.json` — ADDYTYWNIE: 6 nowych kluczy (wartości i `opis` 1:1 z weba).
- `rust-port/engine/src/data/economy_society_part2.rs` — `AiParams`: 6 nowych pól `kupno_jednostki_*` (wymagane przez `deny_unknown_fields`).
- `rust-port/engine/src/domain/ai_zakup_jednostki.rs` (nowy) — `AiPurchaseInput`, `AiPurchaseReserveParams`, `should_ai_purchase_unit` (1:1 z `shouldAIPurchaseUnit`), `load_ai_purchase_reserve_params` (1:1 z `loadAiPurchaseReserveParams`).
- `rust-port/engine/src/domain/mod.rs` — `pub mod ai_zakup_jednostki;`.
- `rust-port/engine/tests/p6_repin_ai_zakup_rezerwa.rs` (nowy) — 5 testów.
- `rust-port/engine/tests/p6_repin_ai_zakup_vectors/` — `zakup-vectors.json` (39 przypadków z weba), `gen-zakup-vectors.mjs` (generator), `ai-purchase-web.ts` (wyciąg werbatim funkcji weba używany przez generator).

## 4. Wektory — jak powstały

- Generator uruchamia KOD WEBA (funkcje z `gra/src/game/ai.ts` @ 679ab078a, kopiowane werbatim linia w linię:
  `:208-212` i `:7207-7262`) w Node 22 z `--experimental-transform-types`, z `gra/data/ai-params.json` @ 679ab078a.
- Pełny import `ai.ts` nie działa w izolowanym Node (ciąg importów: `render/improvements.ts` → pakiet `three`); stąd wyciąg funkcji.
- Przypadki: granice rezerwy N-1/N/N+1 (skarbiec po cenie = R × (utrzymanie 5 + jednostka 2)),
  granice dochodu netto N-1/N/N+1 (netto − jednostka = minDochod ± 1), brak Manpower, skarbiec < cena,
  tryb dawny (brak pól rezerwy), ujemne utrzymanie (clamp), ułamki, zerowa cena — dla poziomów 1/2/3.

## 5. Testy i bramki

- `cargo fmt -- --check` (engine): OK.
- `cargo clippy --all-targets -- -D warnings`: OK.
- `cargo test --test p6_repin_ai_zakup_rezerwa`: 5/5 OK.
- `cargo test --lib`: 22/22 OK.
- Wszystkie binarki `tests/*.rs` (w tym `data_compliance`, `data_economy_society`, `ai_turn`): EXIT 0, 0 failed, 0 nowych `#[ignore]`.

## 6. Założenia / odstępstwa (do akceptacji)

1. Zakup AI nie jest podpięty w Rust do tury AI (brak odpowiednika w `ai_turn.rs`). Port jest funkcją czystą + parametrami; wpięcie w ścieżkę rekrutacji AI to osobny temat.
2. `AiParams` wymaga 6 nowych kluczy (brak fallbacków webu `10/3/0` i `0/0/-2` w Rust; klucze są w pliku danych).
3. `load_ai_purchase_reserve_params` przyjmuje poziom 1..=3; inne wartości → panic (web zwraca fallback).
4. Liczby: JS `number` → `f64`. Wartości NaN nie są wektoryzowane.
5. Dla poziomu 3 (`rezerwa = 0`) granica N-1 rezerwy degeneruje do bramki ceny (skarbiec < cena); granicę pokrywa przypadek N i N+1.
