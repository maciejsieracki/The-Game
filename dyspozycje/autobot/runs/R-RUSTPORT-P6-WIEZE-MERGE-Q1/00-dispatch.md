# DISPATCH R-RUSTPORT-P6-WIEZE-MERGE-Q1 (runda 1)

TEMAT: WIEZE-MERGE — scalony temat wież oblężniczych: #116 TOWER-TARGET + #96 K5-LOOP-WIEZE + #146 K5-LOOP-WIEZE-R2. Decyzja właściciela (14.11): „Scalić z #96”.
DOMENA: GAME. Baza: a381dd13f (czubek origin/rust-port/parity-v2, sprawdzone 14.11). Worktree na `wip/R-RUSTPORT-P6-WIEZE-MERGE-Q1`. PRZED pracą: potwierdź `git merge-base --is-ancestor a381dd13f HEAD`; inaczej BLOCK.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/battle/battleScene.ts` — `_fireSiegeTowers` (ok. :4208-4219), `_fireOneTower` (ok. :4223, woła `pickTowerTarget` ok. :4230), strzał przez `_schedule(RANGED_FLY_MS)` (ok. :4262), wywołanie w `_beginTurn` (ok. :5643). Pin `gra/src/main.ts` NIE zawiera tej funkcji.

GOAL: w produkcyjnej pętli oblężenia (`rust-port/engine/src/domain/siege_tactics_loop.rs`, `siege_tactics_turnseq.rs`) wołaj `pick_tower_target` (`siege_tactics_tower.rs:486`) i wystrzały wież z modelem odroczenia zgodnym z pinem (stagger ~180 ms wirtualnie, `_fireOneTower` odroczony przez `_schedule`), ze strzałem jak w pinie (`_singleBlow` ranged), a NIE placeholderem `dead = true` (loop.rs:159-168).

KONTEKST Z ROZPOZNANIA (operator r1 BLOCK, potwierdzony na a381dd13f):
- `SiegeEnv` (siege_tactics_loop.rs:79-91) ma tylko `tower: Option<UnitRef>`; brak wierszy wież, `towerRange`, `wallTileHp`.
- Literalne `SiegeEnv{}` w `tests/p6_siege_tactics_loop.rs:163` i `tests/p6_siege_tactics_loop_resume.rs:164` — ich zmiana jest w zakresie tego tematu.

ALLOWLISTA (tylko te pliki):
- rust-port/engine/src/domain/siege_tactics_loop.rs (SiegeEnv, wołanie wież)
- rust-port/engine/src/domain/siege_tactics_turnseq.rs (odroczenie wież)
- rust-port/engine/src/domain/siege_tactics_tower.rs (tylko jeśli zmiana sygnatury)
- rust-port/engine/tests/p6_siege_tactics_loop.rs, p6_siege_tactics_loop_resume.rs (tylko literały SiegeEnv)
- rust-port/engine/tests/p6_tower_target_wiring*.rs (nowy test)
- rust-port/engine/tests/p6_tower_target_wiring_gen.mjs (generator wektorów z pina)
- rust-port/engine/tests/p6_tower_target_wiring_vectors/ (wygenerowane wektory)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-MERGE-Q1/ (raporty)

KRYTERIA KOŃCA:
1. Produkcyjny wołający `pick_tower_target` oraz `fire_siege_towers` z odroczeniem (numer linii Rust + pin battleScene.ts).
2. Test z wektorami z generatora `.mjs` (wykonuje tekst pina w node), strażnik SHA-256 wyciętych fragmentów, liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera, brak `dead = true` z placeholdera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test; `cargo test --test 'p6_siege*'`.
5. Jeśli model odroczenia wymaga zmiany poza allowlistą — STATUS BLOCK z dowodem i propozycją allowlisty, bez kodu.

DYSK: przed startem `df -h /`. Poniżej 4 GB — STATUS BLOCK z przyczyną DISK.
NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).

---

## DODATEK r2 (14.11, po FAIL FC r1; baza `a381dd13f`)

Powód: r1 zakończyła się BLOCK bez kodu (Operator: zakres za duży dla jednej rundy). FC r1 (`fc/R-RUSTPORT-P6-WIEZE-MERGE-Q1`) wystawił FAIL, bo BLOCK bez kodu nie jest dozwolony; zalecił podział na etapy. Ten dodatek zawęża r2 do ETAPU 1.

BAZA: `a381dd13f`. Nowa gałąź roboczą: `wip/R-RUSTPORT-P6-WIEZE-MERGE-Q1-r2` z tego SHA (NIE na istniejącej `wip/R-RUSTPORT-P6-WIEZE-MERGE-Q1`). Sprawdź `git merge-base --is-ancestor a381dd13f HEAD` przed pracą.
Raport: `01-operator-r2.md` (nie r1).

### GOAL ETAPU 1
Produkcyjna pętla oblężenia wybiera cel wieży przez `pick_tower_target` (`siege_tactics_tower.rs:486`), a `SiegeEnv` niesie dane wież potrzebne tej funkcji, zgodnie z pinem `battleScene.ts` (`pickTowerTarget` ok. :4230; `_fireOneTower` ok. :4223; `_fireSiegeTowers` ok. :4208–4219; źródło towerRange i wallTileHp z pinu, nie z tabeli jednostek).

### ZAKRES ETAPU 1 (tylko to)
1. `SiegeEnv` (`siege_tactics_loop.rs:79-91`): dodaj pola wymagane przez `pick_tower_target` (wiersze wież, `towerRange`, `wallTileHp` — tylko te, których użyje wołanie w tym etapie). Nie dodawaj pól bez użycia.
2. `fire_siege_towers` (`siege_tactics_loop.rs:159-168`, `siege_tactics_turnseq.rs:238-241`): wywołuje `pick_tower_target` i przekazuje wybrany cel. Placeholder strzału (`dead = true`) MOŻE ZOSTAĆ w tym etapie. Jeśli zostaje, raport musi napisać wprost: „strzał wieży i odroczenie 180 ms — NIE zrobione, etap 2”.
3. Literały `SiegeEnv{}` w `tests/p6_siege_tactics_loop.rs:163` i `tests/p6_siege_tactics_loop_resume.rs:164` — tylko dopisanie nowych pól.
4. Nowy test `rust-port/engine/tests/p6_tower_target_wiring.rs` + generator `p6_tower_target_wiring_gen.mjs` (wykonuje tekst `pickTowerTarget` z `git show 07d2fbd72:gra/src/battle/battleScene.ts` w node; strażnik SHA-256 wyciętego fragmentu) + wektory `p6_tower_target_wiring_vectors/vectors.json`. Test porównuje `pick_tower_target` z wektorami; liczniki niepustości > 0.

### POZA ZAKRESEM ETAPU 1 (etap 2, NIE w tym dispatchu)
- odroczenie wystrzału (`SeqEvent::Schedule`, stagger 180 ms, `_schedule(RANGED_FLY_MS)`);
- strzał wieży przez `single_blow_full` i syntetyczny strzelec (statystyki z wiersza `towerShooterRow` — źródło rozstrzygnięte w pinie, zasada 9, bez pytania właściciela);
- usunięcie placeholdera `dead = true`.

### ALLOWLISTA r2 (tylko te pliki)
- `rust-port/engine/src/domain/siege_tactics_loop.rs`
- `rust-port/engine/src/domain/siege_tactics_turnseq.rs`
- `rust-port/engine/src/domain/siege_tactics_tower.rs` (tylko jeśli zmiana sygnatury)
- `rust-port/engine/tests/p6_siege_tactics_loop.rs`, `rust-port/engine/tests/p6_siege_tactics_loop_resume.rs` (tylko literały SiegeEnv)
- `rust-port/engine/tests/p6_tower_target_wiring.rs` (NOWY), `p6_tower_target_wiring_gen.mjs` (NOWY), `p6_tower_target_wiring_vectors/` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-MERGE-Q1/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock` (nie commitować), push do `parity-v2`, `git add -A`.

### KRYTERIA KOŃCA ETAPU 1
1. Produkcyjny wołający `pick_tower_target` w `src/` (nie tylko w testach) — `git grep` z numerem linii.
2. Test z wektorami z generatora (wykonuje pin), strażnik SHA-256, liczniki > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0 w `rust-port/engine` (z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_tower_target_wiring`; `cargo test --test 'p6_siege*'`.
5. W raporcie jawna lista: co zrobione (SHA) i co NIE zrobione (etap 2).

### COMMIT
Bez nazwy modelu w treści commita; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
