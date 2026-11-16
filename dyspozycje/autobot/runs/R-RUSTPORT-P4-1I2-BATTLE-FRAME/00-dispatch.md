# DISPATCH R-RUSTPORT-P4-1I2-BATTLE-FRAME (runda 1) — ramka bitwy po każdym strzale (P4-1I2 / PRIO-3D-7, #275 · #246)

DOMENA: DTO bitwy (view-model) + stan pętli oblężniczej (engine). MODEL: OPUS we wszystkich rolach (seria P4-1; zasada właściciela dla tematów 3D).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `585bb48e0` (zawiera I1 `05e4df502` i I1B `474487792`). Zapisz SHA w raporcie. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §2b (kształt `BattleFrameDto`) oraz §4 (wiersz I2). Czytaj przez `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md`.
Miejsca w pinie (`_fireOneTower`, `_breachWallTile`, wyłom, strzał bez kafla) ustal przez `git grep -n` w `gra/src/**` — NIE zgaduj ścieżek. Linie `:7648` i `:4216` są z recon; zweryfikuj je w pinie `07d2fbd72`.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `BattleFrameDto` (§2b) w `rust-port/view-model/src/battle.rs`, z walidacją kształtu.
2. Producent ramki ze stanu pętli po KAŻDYM `fire` w `SiegeLoop`: nowy moduł `rust-port/engine/src/domain/siege_tactics_frame.rs`.
3. Pozycje i `on_wall_walkway` jako jawne wejście adaptera (L7) — nie czytać ich z renderera.
4. `towers_destroyed` z NOWEJ flagi w silniku (L4), dodanej w `rust-port/engine/src/domain/siege_tactics_loop.rs` (tylko odczyt stanu i flaga wież).
Kolejność jednostek w ramce = kolejność spawnu.

## WEKTORY / TESTY
- kolejność jednostek w ramce = kolejność spawnu;
- amunicja `Infinity` → `None` (nie liczba);
- wieża zburzona przy wyłomie (pin ~`:7648`) → wpis w `towers_destroyed`;
- wieża zburzona przy strzale bez kafla (pin ~`:4216`) → wpis w `towers_destroyed`.
Każdy wektor z `plik:linia` pinu w komentarzu testu. Testy: `rust-port/engine/tests/p4_1i2_frame*.rs` (NOWE) oraz nowe pliki w `rust-port/view-model/tests/**`.
Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) brak ustawienia flagi przy wyłomie; (b) amunicja `Infinity` zapisana jako liczba; (c) kolejność jednostek odwrócona.

## NIE ROBIĆ
- Nie zmieniaj logiki walki ani kolejności kroków `SiegeLoop` — tylko odczyt stanu i flaga wież (ograniczenie allowlisty).
- Nie portuj zdarzeń akcji (`BattleActionDto`, I3 #276) ani konsumenta w rendererze (I4 #277).
- Nie zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/view-model/src/battle.rs`
- `rust-port/engine/src/domain/siege_tactics_loop.rs` (tylko odczyt stanu + flaga wież)
- `rust-port/engine/src/domain/siege_tactics_frame.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_frame;`
- `rust-port/engine/tests/p4_1i2_frame*.rs` (NOWE), `rust-port/view-model/tests/**` (nowe pliki testów)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I2-BATTLE-FRAME/**`

## KRYTERIA KOŃCA
1. Wszystkie punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/view-model` ORAZ `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką engine sprawdź `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB, nie pomijaj bramki.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I2-BATTLE-FRAME/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
