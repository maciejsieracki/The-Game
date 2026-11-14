# DISPATCH R-RUSTPORT-P6-PRACA-FLOOR-LEDGER-Q1 (runda 1)

TEMAT: PRACA-FLOOR (#106, część parytetu wpięcia R7K7C): podłoga puli Pracy `max(0)` ma być stosowana PER OPERACJĘ jak w pinie, nie raz na sumie delt. Rozbieżność potwierdzona w rozpoznaniu `R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1` (FC PASS-WITH-NOTES `0515603ee`, obrona `5351fe1de`).
DOMENA: GAME (Rust port, bez zmian w `gra/`).
Baza: `533d46dd3` (czubek `origin/rust-port/parity-v2`). PRZED pracą: `git merge-base --is-ancestor 533d46dd3 HEAD` musi być prawdą; inaczej przestaw. Gałąź robocza: `wip/R-RUSTPORT-P6-PRACA-FLOOR-LEDGER-Q1` z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` — `setOwnerPracaPool` (ok. 34865–34885: zapis puli z `max(0)`), `applyCyclicDeliveryOutcome` (ok. 23988–24025: Praca `:24021-24023`; drugie miejsce `:24154`).

## REPRODUKCJA ROZBIEŻNOŚCI (zrób to pierwsze, przed zmianą)
Scenariusz: pula Pracy właściciela = 5; w jednym kroku D3 umowa 1 zabiera 10 (delta −10), umowa 2 daje 10 (delta +10), w tej kolejności.
- Pin: podłoga po każdej operacji. 5 − 10 = −5 → max(0) = 0; potem 0 + 10 = 10. Wynik pinu: 10.
- Rust (dziś): delty sumowane (−10 + 10 = 0), podłoga raz na sumie: 5 + 0 = 5. Wynik Rust: 5.
Najpierw napisz test reprodukujący (ma być CZERWONY na obecnym kodzie, wynik 5 zamiast 10), zapisz plik:linia.

## GOAL
W `Ledger` (`rust-port/engine/src/domain/turn_war_dipl_steps.rs` ok. 409–415) i przy `apply` (ok. 1090–1093) podłoga Pracy jest stosowana po każdej operacji (wpis do puli) zgodnie z pinem `setOwnerPracaPool`. Wynik końcowy dla sekwencji operacji na jednej puli jest identyczny z pinem.

## ZAŁOŻENIA (zasada 9: parytet 1:1, bez pytania)
- Podłoga per operacja. Nie zmieniaj pinu, nie zmieniaj skarbca złota (`tick_diplomacy_payments` to tylko złoto).
- Mapowanie właściciela człowieka: pin `get(id)!`, AI `?? 0`. Nie zmieniaj tego w tym temacie; odnotuj w raporcie, czy Rust zachowuje to samo (NIE_ZMIERZONO jeśli nie sprawdzisz).

## ALLOWLISTA (tylko te pliki)
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs` (tylko Ledger/apply dla Pracy)
- `rust-port/engine/tests/p6_praca_floor.rs` (NOWY): test reprodukcji + sekwencje wielu operacji na jednej puli
- `rust-port/engine/tests/p6_praca_floor_gen.mjs` i `p6_praca_floor_vectors/vectors.json` (NOWE, jeśli da się wykonać pin: wyciągnij tekst `setOwnerPracaPool` i pętli z `applyCyclicDeliveryOutcome`, uruchom w node z mockiem; jeśli niewykonalne — zapisz w BLOKADY dlaczego i użyj wartości wyliczonych z pinu z cytatem linii, oznaczając to jako NIE w pełni wykonane z pinu)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-PRACA-FLOOR-LEDGER-Q1/**`
ZAKAZ: `diplomacy.rs`, `playable.rs`, `gra/**`, `Cargo.toml`, `Cargo.lock` (nie commitować), `git add -A`, push do `parity-v2`.

## KRYTERIA KOŃCA
1. Test reprodukcji przed zmianą był czerwony (kod wyjścia i asercja), po zmianie zielony.
2. Sekwencja ≥3 operacji na jednej puli (w tym podłoga w środku) daje wynik zgodny z wyliczeniem pinu (cytat linii).
3. Brak `#[ignore]`, brak osłabionych asercji; brak zmian w innych funkcjach niż Ledger/apply Pracy.
4. Bramki EXIT 0 w `rust-port/engine` (z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_praca_floor`; `cargo test --test p6_wire_war_dipl_steps`; `cargo test --test p6_zloze_wire_expire_tribute`.
5. `git diff --stat` tylko na allowliście; `git diff --check` czysty.

## RAPORT I COMMIT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia, wynik czerwony przed zmianą)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO. Commit na `wip/…`, BEZ push. Treść commita bez nazwy modelu; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
