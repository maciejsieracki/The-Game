# DISPATCH R-RUSTPORT-P4-1I3-BATTLE-ACTIONS (runda 1) — akcje bitwy (`Vec<BattleActionDto>`) dla ścieżek już portowanych (P4-1I3 / PRIO-3D-8, #276 · #247)

DOMENA: DTO bitwy + zdarzenia pętli oblężniczej (engine, view-model). MODEL: OPUS we wszystkich rolach (seria P4-1; zasada właściciela dla tematów 3D).
BAZA (jedyna obowiązująca): FC P4-1I2 `43709ed0a` (`R-RUSTPORT-P4-1I2-BATTLE-FRAME`, PASS-WITH-NOTES). Ten FC zawiera `BattleFrameDto` i producenta ramki po każdym `fire`, których I3 nie może zmieniać. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt). Zapisz SHA w raporcie.
Źródło: `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §4 (wiersz I3) i §2c (kształt `BattleActionDto`) — `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md`.
Miejsca w pinie ustal przez `git grep -n "_doMeleeAttack\|_singleBlow\|_resolveBlowOutcome\|_fireOneTower\|_pushClash" 07d2fbd72 -- gra/src/battle` — NIE zgaduj ścieżek.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `Vec<BattleActionDto>` (§2c) w `rust-port/view-model/src/battle.rs`, z walidacją kształtu.
2. Emisja akcji przez `SiegeLoop`/`ProdBody` WYŁĄCZNIE dla ścieżek już portowanych: cios, kontratak, strzał wieży, rout, śmierć, koniec, tura.
3. Nowy moduł `rust-port/engine/src/domain/siege_tactics_actions.rs`: producent tekstów logu i `_pushClash` (L5) 1:1 z pinu.
4. `siege_tactics_blow.rs`: tylko `SceneEffect` (efekty sceny wyprowadzone z ciosu), bez zmiany wyniku walki.
Kolejność akcji = kolejność wywołań sceny w pinie.

## WEKTORY / TESTY
- Generator TS (`tests/p4_1i3_actions_gen.mjs`, NOWY) wykonuje tekst pinu (`_doMeleeAttack`, `_singleBlow`, `_resolveBlowOutcome`, `_fireOneTower`) z przechwyceniem wywołań sceny → oczekiwana sekwencja akcji z `t0`.
- Teksty logu bajt-w-bajt (`toFixed(0)`, `arcTag`) z pinu.
- Każdy wektor z `plik:linia` pinu w komentarzu testu. Testy: `rust-port/engine/tests/p4_1i3_actions*.rs` (NOWE).
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) pominięcie jednego rodzaju akcji (np. kontratak); (b) zamiana kolejności cios/kontratak; (c) `toFixed(1)` zamiast `toFixed(0)` w tekście logu.

## NIE ROBIĆ
- Nie portuj ruchu ani oblężenia ręcznego (to I5, #249/#280, zablokowane pętlą K5LOOP).
- Nie portuj konsumenta w rendererze (I4, #277).
- Nie zmieniaj `BattleFrameDto` ani producenta ramki z I2.
- Nie zmieniaj logiki walki ani wyniku `resolve`.
- Nie zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_loop.rs` (tylko emisja akcji po zdarzeniach już portowanych)
- `rust-port/engine/src/domain/siege_tactics_blow.rs` (tylko `SceneEffect`)
- `rust-port/engine/src/domain/siege_tactics_actions.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_actions;`
- `rust-port/view-model/src/battle.rs`
- `rust-port/engine/tests/p4_1i3_actions*.rs` (NOWE), `rust-port/engine/tests/p4_1i3_actions_gen.mjs` (NOWY), `rust-port/engine/tests/p4_1i3_actions_vectors/**` (NOWE)
- `rust-port/view-model/tests/**` (nowe pliki testów)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I3-BATTLE-ACTIONS/**`

## KRYTERIA KOŃCA
1. Wszystkie punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/view-model` ORAZ `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie.
3. Przed bramką engine sprawdź `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB, nie pomijaj bramki.
4. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
5. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I3-BATTLE-ACTIONS/`.
6. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
