# DISPATCH R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW (runda 1) — stan oblężenia, maszyn i cudów dla nakładek (P4-1F3 / PRIO-3D-3, #271 · #240)

DOMENA: DTO nakładek + stan gry (engine, view-model). MODEL: OPUS we wszystkich rolach (seria P4-1; zasada właściciela dla tematów 3D).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `585bb48e0` (zawiera P4-1F1 `1ed1a7bd8`). Zapisz SHA w raporcie. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md` §4 (wiersz 1F3) oraz §5 pkt 1 (właściciel obozu). Czytaj przez `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md`.
Lokalizację funkcji w pinie ustal przez `git grep -n "enemy_units_adjacent_to_city\|placedWorldWonders\|siegeMachines\|oblegane" 07d2fbd72 -- gra/src` — NIE zgaduj ścieżek.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `PlayableState` (`rust-port/engine/src/domain/playable.rs`): pola `oblegane` (obozy oblężnicze), `siegeMachines.ready` oraz `placedWorldWonders`. Nowe pola z `#[serde(default, skip_serializing_if = ...)]` jak w P4-1J (planowane marsze).
2. `rust-port/engine/src/domain/save_load.rs`: zapis i odczyt nowych pól. Golden zapisu bez nowych pól = bez zmian.
3. Producent `sieges[]` w `rust-port/engine/src/domain/overlays_view.rs` (jeśli plik nie istnieje na bazie — utwórz jako NOWY i zapisz to w raporcie): reguła obozu przez `enemy_units_adjacent_to_city`, powtórzenia zachowane, właściciel obozu z PEŁNEJ listy jednostek.
4. Producent `wonders[]` w tym samym module: `ruin = era > absolut`.
Kształt `SiegeViewDto` i właściciela per wpis `campHexes` już istnieje po P4-1F1 (`8ecf01c2c`) — używaj go, NIE zmieniaj kształtu DTO.

## WEKTORY / TESTY
- stos 2 jednostek na jednym heksie obozu → 2 wpisy;
- 3 maszyny na 2 obozy → przydział round-robin;
- jednostka nie-wroga obok miasta → pominięta;
- pierwsza jednostka na heksie obozu ≠ właściciel miasta → właściciel obozu wg pełnej listy jednostek;
- cud: `era == absolut` → NIE ruina; `era > absolut` → ruina; nieznany `wonderId` → NIE ruina; `era = NaN` → NIE ruina;
- golden zapisu bez nowych pól = bez zmian.
Każdy wektor z `plik:linia` pinu w komentarzu testu. Testy w `rust-port/engine/tests/view_overlays_siege_wonder*.rs` (NOWE).
Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) `ruin = era >= absolut`; (b) deduplikacja powtórzeń w `sieges[]`; (c) właściciel obozu z pierwszej jednostki na heksie zamiast pełnej listy.

## NIE ROBIĆ
- Nie zmieniaj kształtu DTO w `view-model` poza wymuszonym kompilacją (każdą zmianę uzasadnij w raporcie).
- Nie ruszaj `rust-port/renderer/` (adapter nakładek to osobny temat P4-1G Q5, #236).
- Nie wdrażaj mgły (P4-1C, #253 — zablokowane decyzją właściciela).
- Nie zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/engine/src/domain/playable.rs`
- `rust-port/engine/src/domain/save_load.rs`
- `rust-port/engine/src/domain/overlays_view.rs` (istniejący lub NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod overlays_view;`, jeśli brakuje
- `rust-port/engine/tests/view_overlays_siege_wonder*.rs` (NOWE)
- `rust-port/view-model/src/overlays.rs` i `rust-port/view-model/tests/**` — TYLKO jeśli wymagane testami kluczy JSON (uzasadnij w raporcie)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW/**`

## KRYTERIA KOŃCA
1. Wszystkie punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Pełny test wymaga wolnego dysku: sprawdź `df -h /` przed bramką; przy < 8 GB zgłoś BLOCK z liczbą GB, nie pomijaj bramki.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.

## DODATEK — Final Control na Obronie (runda FC)
- Kod Obrony: `92dce8414a44ee442412ea2e29dd8efd29053d55`; Evaluator: `48ef28025`; Operator PASS `999083029`.
- Baza kodu tematu: `585bb48e0` (ocena względem niej, NIE względem parity, które ma już F6).
- Bez ponownego Operatora. Każdy zarzut Evaluatora i Obrony: NAPRAW / ODDAL / DO DECYZJI CZŁOWIEKA; jeden NAPRAW = FAIL.
- Wynik: `03-final-control.md` w katalogu runu.

## DODATEK r2 — integracja FC 1F3 na parity (BAZA: origin/rust-port/parity-v2 = 3a8f068f6)
- FC 1F3 = `25fdeb11a` (bramki fmt/clippy/test PASS na tym SHA; zero NAPRAW). Chroniony `refs/keep/cleanup-25fdeb11a`.
- Parity zawiera już nakładki 1F5 + 1F4 (`3a8f068f6`). Merge-tree 1F3 -> parity: KONFLIKT add/add w `rust-port/engine/src/domain/overlays_view.rs` (plik tworzony przez F6, 1F5, 1F4 i 1F3). `mod.rs` scala się automatycznie.
- Zadanie: `git merge --no-ff 25fdeb11a` na świeżym worktree z 3a8f068f6. Konflikt rozwiąż przez ZACHOWANIE WSZYSTKICH funkcji, typów, importów i testów obu stron (1F3 dodaje: oblegane, siegeMachines.ready, placedWorldWonders). Nie zmieniaj semantyki żadnej funkcji. `#![forbid(unsafe_code)]` i `OwnerRef`: zostają jak w parity (vm::OwnerRef dla 1F4).
- Obserwacja z FC 1F3 (do zapisania, NIE naprawiać w tym temacie): `SelectionUi` czyta zaznaczenie z UI, a 1F5 czyta `state.selected_unit_id` — ujednolicenie przy agregatorze (P4-1G Q6).
- Bramki (rust-port/engine): `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie; `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; PEŁNY `cargo test --all-targets --no-fail-fast` w tle (setsid nohup). df >= 8 GB przed bramką.
- Model: OPUS (temat 3D). NIE pushuj do parity; nie commituj Cargo.lock; nie używaj git add -A. Zwróć SHA merge, wyniki bramek, listę decyzji przy konflikcie.
