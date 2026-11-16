# DISPATCH R-RUSTPORT-P4-1I4-BATTLE-CONSUMER (runda 1) — konsument akcji i ramek bitwy w rendererze (P4-1I4 / PRIO-3D-9, #277 · #248)

DOMENA: renderer bitwy 3D (odtwarzanie akcji i pasków). MODEL: OPUS we wszystkich rolach (seria P4-1; zasada właściciela dla tematów 3D).
BAZA (jedyna obowiązująca): FC P4-1I3 `0deb9a075` (zawiera I2 `43709ed0a`: `BattleFrameDto` i `BattleActionDto`). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt). Zapisz SHA w raporcie.
Źródło: `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §4 (wiersz I4) — `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md`.
Odpowiedniki w pinie ustal przez `git grep -n "MoveAnim\|MeleeLunge\|launch_projectile\|Boulder\|RamAnim\|breach_\|FloatLabel\|kill_unit" 07d2fbd72 -- gra/src/battle`.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. Nowy moduł `rust-port/renderer/src/battle/playback.rs`: konsument `BattleActionDto` → wywołania sceny: `MoveAnim`, `MeleeLunge`, `launch_projectile`, `Boulder`, `RamAnim`, `breach_*`, `FloatLabel`, `kill_unit`. Kolejność wywołań = kolejność akcji.
2. `BattleFrameDto` → paski (HP, morale) w rendererze, bez zmiany kształtu DTO z I2/I3.
3. Nie zmieniaj producentów akcji ani ramki (engine, I2/I3).

## WEKTORY / TESTY
- Ten sam scenariusz: scena po odtworzeniu akcji = scena po wywołaniach z pinu. Porównanie drzewa `Scene` z istniejącymi fiksturami `rust-port/renderer/tests/fixtures/battle3d/`.
- Każdy wektor z `plik:linia` pinu w komentarzu testu. Testy: `rust-port/renderer/tests/battle_playback*.rs` (NOWE).
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) pominięcie `FloatLabel`; (b) odwrócenie kolejności `MeleeLunge`/`kill_unit`; (c) pasek HP z ramki zamiast z akcji (rozjazd po zakończeniu fazy).

## NIE ROBIĆ
- Nie zmieniaj logiki walki ani producentów w engine (I2/I3/I5).
- Nie portuj akcji oblężniczych (ruch, taran, wyłom) — to I5 (#249/#280), zablokowane pętlą K5LOOP.
- Nie zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/renderer/src/battle/playback.rs` (NOWY) i `rust-port/renderer/src/battle/mod.rs` — TYLKO wpis `pub mod playback;`
- `rust-port/renderer/tests/battle_playback*.rs` (NOWE), `rust-port/renderer/tests/fixtures/battle3d/**` (tylko dopisanie fiksturów, nie modyfikacja istniejących)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I4-BATTLE-CONSUMER/**`

## KRYTERIA KOŃCA
1. Wszystkie punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/renderer` (renderer kompiluje się przeciw view-model): `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką sprawdź `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I4-BATTLE-CONSUMER/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
