# 02-evaluator — R-RUSTPORT-P4-1I3-BATTLE-ACTIONS (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I3-BATTLE-ACTIONS
GOAL: `Vec<BattleActionDto>` + emisja akcji (cios, kontratak, wieża, rout, śmierć, koniec, tura) w `SiegeLoop`/`ProdBody`, teksty logu i `_pushClash` 1:1 z pinu `07d2fbd72`.
ZMIANY/COMMIT: oceniany kod `facb6f3d5`, raport Operatora `0b9aace6e` (gałąź `wip/R-RUSTPORT-P4-1I3-BATTLE-ACTIONS-op-r1`); baza `43709ed0a` jest przodkiem (`merge-base --is-ancestor` = tak). Ten plik: jedyna zmiana Evaluatora.
TESTY: niżej (odtworzone samodzielnie, kody wyjścia).
BLOKADY: brak blokujących; dysk 6,8–7,4 GB (< 8 GB) — pełny `cargo test --all-targets` engine nie odtworzony (pkt 4 uwag).
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora / Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Allowlista
`git diff --stat 43709ed0a 0b9aace6e`: 9 plików, wszystkie w allowliście:
`siege_tactics_loop.rs`, `siege_tactics_actions.rs` (NOWY), `domain/mod.rs` (wyłącznie `+pub mod siege_tactics_actions;`),
`view-model/src/battle.rs`, `engine/tests/p4_1i3_actions.rs`, `p4_1i3_actions_gen.mjs`, `p4_1i3_actions_vectors/vectors.json`,
`view-model/tests/battle_actions.rs`, raport `01-operator-r1.md`. `siege_tactics_blow.rs` bez zmian. `Cargo.lock` niecommitowany.
Brak `#[ignore]` w nowych testach. Zmiany w `siege_tactics_loop.rs` to emisja akcji + przekazanie danych (`emit_facing`,
`outcome`, `blow_dmg`, `tower_in_flight`); logika walki i wynik `resolve` nienaruszone (stare testy pętli zielone, niżej).

## Bramki (CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach)
view-model: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --all-targets --no-fail-fast` EXIT 0.
engine: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
`cargo test --lib --test p4_1i3_actions` EXIT 0 (lib 126 passed, p4_1i3_actions 6/6);
13 binarek używających `SiegeLoop`/`ProdBody` (p4_1i1_battle_outcome, p4_1i2_frame, p4_1i2_frame_fire, p6_k5doc_state,
p6_k5loop_outcome_pin, p6_siege_tactics_loop, _body, _body_pin, _resume, p6_siege_wylom_tower, p6_tower_target_wiring,
p6_wieze_2b1, p6_wieze_2b2) EXIT 0, 0 failed.

## Wektory
Generator `node tests/p4_1i3_actions_gen.mjs` (node 22) EXIT 0; wynik bajt-w-bajt identyczny z commitowanym
`vectors.json` (`cmp`) — deterministyczny. Generator wykonuje tekst pinu (`git show 07d2fbd72:…`, `new Function`,
strażniki SHA-256 fragmentów), nie ręczne wartości. Pokrycie: 320 sekwencji/1743 aktywacje, 160 scenariuszy wieży, 240 końca.
Teksty logu sprawdzone ręcznie z pinem: `:8962` (`toFixed(0)`), `:8993-9000` (`arcTag`), `:9046`, `:9819`, `:4247`, `:4241`,
`:9556-9560` (`_pushClash`) — zgodne.

## Mutacje odtworzone przez Evaluatora
- usunięcie `emit(BattleAction::Rout)` w `start_rout` → `zgodnosc_akcji_ciosu_i_kontrataku_z_pinem` FAIL (165 rozbieżności);
- warunek Damage wieży bez `!tc.dead` → `zgodnosc_akcji_strzalu_wiezy_z_pinem` FAIL (10 rozbieżności).
Pliki przywrócone (`git checkout`), drzewo czyste.

## Zarzuty (nieblokujące)
1. **Damage w FF.** Pin `_spawnDamageLabel` (`battleScene.ts:9940-9945`) wraca od razu przy `_ffActive`; Rust emituje `Damage`
   także w przewijaniu. Operator oznaczył to NIE_ZMIERZONO, ale pin rozstrzyga sprawę: albo filtr w producencie, albo jawny kontrakt
   w `BattleActionDto` („konsument ignoruje Damage w FF”) przed I4. Wektory tego nie pokrywają.
2. **Wieża: cel `neverRout = true` w generatorze.** Gałąź tagu `rout` i skutki morale trafienia wieży (Rout/Facing/log rout przed
   `_pushClash`) są nietestowane; tag w Rust liczony z `st.routed`, którego morale wieży nie aktualizuje (wpis
   `wieza-resolveBlowOutcome-efekty`). Odstępstwo jawne i w zakresie (ścieżka nieportowana), ale musi trafić do I5/K5LOOP.
3. **Logi końca.** Test wektorowy woła czystą `check_end_logs` z `ratio_*_at_cap = ratio_*`; podpięcie `SiegeLoop::end_logs`
   (ponowne `end_check_snapshot` w chwili obsługi `EndCheck`) i gałąź `ratio_at_cap ≠ ratio` pokrywa tylko jeden scenariusz pętli.
4. **Pełny `cargo test --all-targets` engine nieodtworzony przez Evaluatora** (dysk < 8 GB, limit 590 s). Odtworzono lib + 14
   binarek związanych z tematem; deklaracja Operatora 496 × rc=0 niezweryfikowana niezależnie — do potwierdzenia w FC/integracji.
5. **Facing ataku a stan.** `Facing` atakującego emitowane w `start` (t0, jak `:9104-9105`), a stan `facing` zmienia się dopiero w
   `complete` (t0+150): ramka I2 w tym oknie pokaże stary kierunek. Niespójność strumień/ramka (wynik walki bez zmian).
6. **Walidacja `Melee` attacker≠target po `UnitId`** zakłada unikalne id między stronami; produkcyjny przydział id (#113) jeszcze
   niepodpięty — do sprawdzenia przy wpięciu.
