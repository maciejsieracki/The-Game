# DISPATCH R-RUSTPORT-P4-1F1-OVERLAY-TYPES (runda 1) — poprawki kształtu DTO nakładek wg pinu (P4-1F / #238)

DOMENA: DTO nakładek (view-model). MODEL: OPUS we wszystkich rolach (seria P4-1).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `b90894920` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md` §„P4-1F1” (wiersz F1: pozycje a–d) i §7/§3.7 kontraktu `P4-1-RENDER-DTO-CONTRACT.md`.
Dla każdej zmiany: plik:linia pinu w komentarzu testu.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES (wszystkie cztery punkty F1)
(a) `pathRoute` + `turnStops: Vec<{hex, turn: u32}>` (walidacja `turn` w `validate.rs`).
(b) `BuildHighlightKind` rozdziela cud od ulepszenia (`Wonder` + `Improvement` zamiast `Generic`, albo pole krycia). Wybierz wariant zgodny z pinem `refreshBuildHighlight`; decyzję techniczną zapisz w raporcie.
(c) `cultureRange` / `religionRange` jako jeden zbiór heksów (pin: tylko właściciel `0`).
(d) `SiegeViewDto` + właściciel obozu per wpis `campHexes` (§5 pkt 1 rozpoznania).
Bump `CONTRACT_VERSION` w `rust-port/view-model/src/root.rs`.

## WEKTORY / TESTY
- Testy kluczy JSON (`tests/json_keys.rs`), round-trip, walidacja `validate.rs` dla `turn`.
- Wektory z pinu: `collectTerritoryHexKeysByOwner` z filtrem mgły (kolejność wstawiania, np. `"10,0"` przed `"2,0"`), `collectCultureRangeHexKeys` / `collectReligionRangeHexKeys`; pusty wynik → brak warstwy.
- Mutacje (MUSZĄ dać FAIL): usunięcie `turn`; `BuildHighlightKind` z cudem jako `Generic`; `campHexes` bez właściciela.
- Golden zapisu bez nowych pól = bez zmian (jeśli dotyczy).

## KRYTERIA KOŃCA
1. Wszystkie cztery punkty zrealizowane; testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/view-model` ORAZ `rust-port/renderer` (renderer kompiluje się przeciw nowemu DTO): `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/view-model/src/overlays.rs`
- `rust-port/view-model/src/root.rs` (TYLKO `CONTRACT_VERSION`)
- `rust-port/view-model/src/validate.rs` (TYLKO walidacja `turn`)
- `rust-port/view-model/tests/**` (w tym nowe pliki testów)
- `rust-port/renderer/src/**` TYLKO tam, gdzie kompilacja wymaga zmian po zmianie DTO (uzasadnij każdą zmianę w raporcie)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F1-OVERLAY-TYPES/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo; usuń po bramkach.
