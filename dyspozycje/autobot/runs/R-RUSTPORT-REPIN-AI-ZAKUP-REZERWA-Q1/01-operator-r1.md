# R-RUSTPORT-REPIN-AI-ZAKUP-REZERWA-Q1 — Operator, runda 1/5

STATUS: PASS (Operator; czeka na Evaluator i Final Control)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-AI-ZAKUP-REZERWA-Q1
GOAL: Port reguły zakupu jednostek przez AI (`shouldAIPurchaseUnit`) z rezerwą utrzymania 10/3/0 i progami netto, 1:1 z webem.

POMIAR: Web ma regułę (`gra/src/game/ai.ts:7207-7262`, `getAiParam` `:208-212`). Rust NIE ma odpowiednika zakupu AI ani kluczy `kupno_jednostki_*` w `ai-params.json` (`git grep` w `rust-port/engine/src` i `data`). Tabela: `dyspozycje/rust-port/p6/P6-REPIN-AI-ZAKUP.md` §1. Zgodnie z dispatchem: port funkcji czystej + parametry addytywnie.

ZMIANY-COMMIT: `c75a39b2f` (baza `origin/rust-port/parity-v2` @ `0fd287721`, bez push)
- `rust-port/engine/data/ai-params.json`: +6 kluczy (10/3/0 oraz netto 0/0/-2), addytywnie, wartości i opisy z weba @679ab078a
- `rust-port/engine/src/data/economy_society_part2.rs`: +6 pól w `AiParams` (wymagane przez `deny_unknown_fields`)
- `rust-port/engine/src/domain/ai_zakup_jednostki.rs` (nowy): `should_ai_purchase_unit`, `load_ai_purchase_reserve_params`
- `rust-port/engine/src/domain/mod.rs`: `pub mod ai_zakup_jednostki;`
- `rust-port/engine/tests/p6_repin_ai_zakup_rezerwa.rs` (nowy, 5 testów) + `tests/p6_repin_ai_zakup_vectors/` (39 wektorów z weba, generator, wyciąg funkcji weba)
- `dyspozycje/rust-port/p6/P6-REPIN-AI-ZAKUP.md` (nowy)
- Brak zmian w `gra/**`, `WERSJE.md`, `Cargo.toml`, renderer, `src-tauri`.

TESTY (na `c75a39b2f`):
- `cargo fmt -- --check`: OK
- `cargo clippy --all-targets -- -D warnings`: OK
- `p6_repin_ai_zakup_rezerwa`: 5/5 OK (wektory weba, granice N-1/N/N+1 rezerwy i netto dla poziomów 1/2/3, tryb dawny)
- `--lib`: 22/22 OK
- Wszystkie binarki `tests/*.rs` (w tym `data_compliance` 40/40, `data_economy_society` 9/9, `ai_turn` 13/13, `p6_dyplomacja_profil_wojny_pokoju` 10/10), w przebiegach: pierwszy pełny przebieg 115 binarek = 1015 passed (przerwany limitem czasu); reszta w czterech przebiegach: B = 378 passed (66 binarek), C = 474 passed (56 binarek), D = 112 passed (17 binarek), A = EXIT 0 bez zapisanego logu (NIE_ZMIERZONO liczba). Wszystkie przebiegi: EXIT 0, 0 failed.
- Nowe `#[ignore]`: 0
- BASELINE przed zmianą: NIE_ZMIERZONO (po zmianie 0 failed)

BLOKADY:
- Zakup AI nie jest podpięty do tury AI w Rust (brak odpowiednika w `ai_turn.rs`). Reguła istnieje jako funkcja czysta; w grze Rust nie zmienia zachowania AI.
- Odstępstwo: wektory wygenerowane z WYCIĄGU funkcji weba (`ai.ts:208-212` i `:7207-7262`, werbatim) uruchomionych w Node 22; pełny import `ai.ts` nie działa w izolowanym Node (pakiet `three`).
- Dysk: po zakończeniu około 3,8 GB wolnego (próg przerwania 1,5 GB nie naruszony).

ZAŁOŻENIA DO AKCEPTACJI:
1. Klucze `kupno_jednostki_*` są obowiązkowe w `AiParams` (brak fallbacków webu w Rust).
2. `load_ai_purchase_reserve_params` dla poziomu spoza 1..=3 robi panic (web zwraca fallback).
3. Liczby JS → `f64`; NaN nie jest wektoryzowane.
4. Dla poziomu 3 (rezerwa 0) granica N-1 rezerwy degeneruje do bramki ceny; pokryte przypadkami N i N+1.
5. `min_dochod_netto` 0/0/-2 przeniesione z weba jako PLACEHOLDER (decyzja do właściciela po pomiarze, nie zmieniana tutaj).

RUNDY: 1/5 (ostatni werdykt: brak; Evaluator i Final Control nie uruchomione)
NASTĘPNY KROK: Evaluator (Sonnet 5.5) na `c75a39b2f`, potem Final Control; ewentualne wpięcie zakupu AI do tury Rust jako osobny temat.
DEPLOY/PUSH: NIE WYKONANO
