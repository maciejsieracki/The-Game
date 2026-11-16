# 03 — Final Control, R-RUSTPORT-P4-1I3-BATTLE-ACTIONS (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I3-BATTLE-ACTIONS
GOAL: `Vec<BattleActionDto>` + emisja akcji (cios, kontratak, wieża, rout, śmierć, koniec, tura) w `SiegeLoop`/`ProdBody`, teksty logu i `_pushClash` 1:1 z pinu `07d2fbd72`, bez zmiany logiki walki.
ZMIANY/COMMIT: oceniany stan `eec876bb5` (kod `001af723d`, obrona r1); ten raport na gałęzi `wip/R-RUSTPORT-P4-1I3-BATTLE-ACTIONS-fc-r1` (od `eec876bb5`). Ancestry: `git merge-base --is-ancestor 43709ed0a eec876bb5` → TAK (łańcuch 43709ed0a → facb6f3d5 → 0b9aace6e → 001af723d → eec876bb5).
TESTY: niżej (samodzielnie odtworzone w FC).
BLOKADY: pełne `cargo test --all-targets --no-fail-fast` engine — BLOCK (dysk 4,3–4,9 GB wolnego, < 8 GB z dispatchu). Do wykonania przy integracji.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge na gałąź docelową wg dispatchu) + pełny `cargo test --all-targets` engine przy ≥ 8 GB.
DEPLOY/PUSH: NIE WYKONANO

## Allowlista (samodzielnie, `git diff --stat 43709ed0a eec876bb5`)

10 plików, wszystkie z allowlisty: `siege_tactics_loop.rs`, `siege_tactics_actions.rs` (NOWY), `mod.rs` (wyłącznie `+pub mod siege_tactics_actions;`), `view-model/src/battle.rs`, `view-model/tests/battle_actions.rs` (NOWY), `engine/tests/p4_1i3_actions.rs`, `p4_1i3_actions_gen.mjs`, `p4_1i3_actions_vectors/vectors.json`, raporty 01/02a. `siege_tactics_blow.rs` bez zmian (dopuszczalne: `SceneEffect::PushClash` już istniał). `Cargo.lock` niecommitowany. `git diff --check` czysty. Brak dodanych `#[ignore]`. `BattleFrameDto` i producent ramki I2 nietknięte (diff `battle.rs` usuwa tylko komentarz „no type for it here”).

Przegląd diffu `siege_tactics_loop.rs`: wyłącznie emisja (`emit`, `drain_body`, `set_now`, `set_tower_row`, `set_ff_active`), refaktor `finish` o listę logów i wyliczenie `facing` do zmiennej przed przypisaniem; kolejność mutacji stanu i rzutów RNG bez zmian. `tower_in_flight` to tylko odwzorowanie wiersza wieży dla tekstu `_pushClash`.

## Bramki (FC, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach)

| Crate | Polecenie | Wynik |
|---|---|---|
| view-model | `cargo fmt --check` | EXIT 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| view-model | `cargo test --all-targets --no-fail-fast` | EXIT 0, 109 passed, 0 failed |
| engine | `cargo fmt --check` | EXIT 0 |
| engine | `cargo clippy --all-targets -- -D warnings` | EXIT 0 (kompiluje wszystkie cele testowe) |
| engine | `cargo test --lib --test p4_1i3_actions` | EXIT 0: lib 126 passed, p4_1i3_actions 9 passed |
| engine | 13 binarek z `SiegeLoop`/`ProdBody`/`LoopBody` (p6_wieze_2b1/2b2, p6_tower_target_wiring, p6_siege_wylom_tower, p6_siege_tactics_loop{,_resume,_body,_body_pin}, p6_k5doc_state, p6_k5loop_outcome_pin, p4_1i1_battle_outcome, p4_1i2_frame{,_fire}) | EXIT 0, 93 passed, 0 failed |
| engine | `cargo test --all-targets --no-fail-fast` (pełne) | BLOCK — dysk 4,3 GB wolnego (< 8 GB) |

Generator: `node rust-port/engine/tests/p4_1i3_actions_gen.mjs` (Node 22.23.4) → `vectors.json` MD5 `a0552196e5b62c260fb38e2bf48beaa8`, identyczny z commitem (deterministyczny, brak zmian w drzewie).

Mutacja FC: wyłączenie filtra FF w `ProdBody::emit` (`if false && self.ff_active …`) → `p4_1i3_actions` FAIL (2 testy: `zgodnosc_akcji_ciosu_w_trybie_ff_z_pinem`, `zgodnosc_akcji_strzalu_wiezy_z_pinem`). Przywrócone.

Pin sprawdzony (`git show 07d2fbd72:gra/src/battle/battleScene.ts`): `:9943` `if (this._ffActive) return;`, `:9125` `dmg > 0 && !defender.dead`, `:9142` `back > 0 && !attacker.dead && !attacker.fadingOut`, `:4265` `dmg > 0 && !target.dead && !target.fadingOut`, `:9104-9105` zwrot atakującego w t0 — zgodne z kodem.

## Orzeczenia zarzutów Evaluatora

1. **Damage w FF** — ODDAL (naprawione w `001af723d`). Filtr w jednym miejscu `ProdBody::emit` zgodny z `:9943`; `SiegeLoop::resume` ustawia `ff_active`; wektory pinu `expectFf`/`actionsFf`; mutacja FC daje FAIL.
2. **Wieża, `neverRout=true`, tag `rout`** — ODDAL dla I3. Skutki `_resolveBlowOutcome` trafienia wieży są jawnie nieportowane (`wieza-resolveBlowOutcome-efekty`), ich port zmieniłby logikę walki, czego dispatch zabrania. Przeniesienie: wektory `neverRout=false` do I5 (#249/#280) i K5LOOP-OUTCOME (#109/#147).
3. **Logi końca w pętli** — ODDAL. Dodany test pełnej pętli `EndCheck → end_logs → finish` z oczekiwaniami z wektorów pinu. Gałąź `ratio_at_cap != ratio` nieosiągalna bez rozbicia dowódców (`:10168-10169`, nieportowane); pokryta testem czystej funkcji.
4. **Pełny test engine** — ODDAL jako zarzut do kodu; bramka formalnie BLOCK (dysk). Uzasadnienie ryzyka: `clippy --all-targets` EXIT 0 kompiluje wszystkie cele (zmiany API: tylko domyślne metody traitu i pola prywatne/nowe pub, brak złamań kompilacji); wszystkie 14 binarek używających zmienionych typów + lib zielone w FC; Operator zgłosił 496 × rc=0 na `facb6f3d5`. Warunek: orkiestrator uruchamia pełne `cargo test --all-targets` engine przy integracji (≥ 8 GB).
5. **Facing w `start` vs stan w `complete`** — ODDAL dla I3. Strumień akcji zgodny z pinem (`:9104-9105`, t0); przesunięcie mutacji stanu zmieniłoby `relative_hit` (logika walki). Kontrakt dla I4: w oknie `[t0, hitAt)` kierunek z akcji `Facing`. Poprawka stanu → K5LOOP-FACING (#107).
6. **Unikalność `UnitId`** — ODDAL (naprawione). `actions_to_dto` zwraca `ActionError::DuplicateId`; test `akcje_dto_wymagaja_unikalnych_id_w_bitwie`. Ponowna kontrola przy wpięciu przydziału id (#113).

Żadnego NAPRAW, żadnego DO DECYZJI CZŁOWIEKA → PASS-WITH-NOTES (nota: BLOCK pełnej bramki engine z powodu dysku).
