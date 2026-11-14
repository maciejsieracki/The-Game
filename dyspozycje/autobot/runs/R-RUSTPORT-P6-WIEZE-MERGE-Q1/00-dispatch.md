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
