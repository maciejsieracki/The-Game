# R-RUSTPORT-P4-1I3-BATTLE-ACTIONS — runda 1, obrona Operatora (02a)

STATUS: PASS-WITH-NOTES (obrona) / BLOCK tylko dla pełnej bramki `cargo test --all-targets` engine, bo dysk ma 5,4–5,8 GB, a wymagane jest 8 GB (dispatch, kryterium 3)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I3-BATTLE-ACTIONS
GOAL: `Vec<BattleActionDto>` dla ścieżek już portowanych, emitowany przez `SiegeLoop`/`ProdBody` i zgodny z tekstem pinu `07d2fbd72`
ZMIANY/COMMIT: kod `001af723d` (rodzic `0b9aace6e`, raport r1; kod r1 `facb6f3d5`; baza `43709ed0a`); raport w commicie następnym po kodzie. Gałąź `wip/R-RUSTPORT-P4-1I3-BATTLE-ACTIONS-ob-r1`, worktree `.claude/worktrees/wf_53456dc3-0dd-3`, bez push.
Pliki (wszystkie z allowlisty): `engine/src/domain/siege_tactics_loop.rs`, `engine/src/domain/siege_tactics_actions.rs`, `engine/tests/p4_1i3_actions.rs`, `engine/tests/p4_1i3_actions_gen.mjs`, `engine/tests/p4_1i3_actions_vectors/vectors.json`. `siege_tactics_blow.rs`, `mod.rs`, `view-model` i `gra/` bez zmian. `Cargo.lock` nie jest commitowany.
TESTY: niżej (§Bramki)
BLOKADY: pełne `cargo test --all-targets --no-fail-fast` dla engine nie zostało uruchomione, bo wolne miejsce na dysku (5,4–5,8 GB) jest poniżej progu 8 GB z dispatchu. Uruchomione: lib i 14 binarek pętli, wszystkie zielone (§Bramki). Pełny przebieg należy powtórzyć w FC albo przy integracji.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1: Damage w trybie FF. PRZYJMUJĘ

Pin rozstrzyga sprawę. `_spawnDamageLabel` (`battleScene.ts:9940`) kończy się w `:9943`: `if (this._ffActive) return;`. Jedynym sterownikiem czasu w `SiegeLoop` jest `run_fast_forward`, czyli web `_runFastForward`. W webie ta funkcja jest wołana tylko przy `_ffActive` (`:9267`), a flagę ustawia `skip()` (`:3696`).

Poprawka (filtr w producencie):
- Dodałem `LoopBody::set_ff_active(bool)` z domyślną implementacją bez efektu. `SiegeLoop::resume` woła `set_ff_active(true)` przed `run_fast_forward`.
- `ProdBody` dostał pole `ff_active` (domyślnie `false`) i getter `ff_active()`. Jedyny filtr siedzi w `ProdBody::emit`: przy `ff_active` akcja `BattleAction::Damage` nie jest emitowana. Obejmuje to wszystkie trzy wywołania z pinu: cios `:9125`, kontratak `:9142`, wieżę `:4265`. Logika walki pozostała bez zmian.
- Generator wykonuje TEKST linii `:9943` w stubie `_spawnDamageLabel`. Pilnują tego strażniki `expectLine` na `:9940` i `:9943` oraz równość linii. Dodałem wektory z `_ffActive = true`: `expectFf` dla 96 sekwencji ciosu i `actionsFf` dla wszystkich 160 scenariuszy wieży. Generator sprawdza też czystość: ponowne uruchomienie bez FF daje identyczny wynik.
- Dotychczasowe wektory bez FF są bajt w bajt takie jak w r1. Sprawdziłem to porównaniem JSON po usunięciu nowych pól. Dla każdej sekwencji FF = bez FF minus linie `damage` (0 różnic, w obu grupach). Dwa uruchomienia generatora dają ten sam MD5 `a0552196e5b62c260fb38e2bf48beaa8`.
- Testy:
  - nowy `zgodnosc_akcji_ciosu_w_trybie_ff_z_pinem`: 96 sekwencji, w FF 0 akcji `damage`, czułość: bez FF jest ≥ 50 `damage`;
  - `zgodnosc_akcji_strzalu_wiezy_z_pinem` w dwóch trybach: przez pełną pętlę (`resume` → FF) porównanie z `actionsFf` i asercja `ff_active() == true` po `resume`; przez testowe ciało `TowerBody`, które ignoruje `set_ff_active` (sterownik bez przewijania), porównanie z `actions` z ≥ 20 `damage` wieży;
  - `petla_emituje_ture_wieze_i_koniec_jako_dto`: w strumieniu z przewijania nie ma `Damage`.
- Pokrycie z generatora: `meleeFfSequences=96`, `meleeFfDamage=0`, `meleeFfMelee=156`, `towerDamage=41`, `towerFfDamage=0`.
- Mutacje dają FAIL:
  - (M1) filtr w `emit` wyłączony (`if false && ...`): FAIL `zgodnosc_akcji_ciosu_w_trybie_ff_z_pinem` (77 rozbieżności) i `zgodnosc_akcji_strzalu_wiezy_z_pinem` (ff=true: 41 rozbieżności);
  - (M2) `resume` ustawia `set_ff_active(false)`: FAIL `zgodnosc_akcji_strzalu_wiezy_z_pinem` („resume włącza przewijanie”).
  - Mutacja Evaluatora „Damage wieży bez `!dead`” jest nadal wykrywalna w trybie bez FF (wektory `actions`, 41 `damage`).

Kontrakt dla I4: strumień akcji z `SiegeLoop` (przewijanie) nie zawiera `Damage`, tak jak w pinie. Etykiety obrażeń pojawią się dopiero przy sterowniku bez przewijania (AUTO w czasie rzeczywistym, I5 i K5LOOP), który nie woła `set_ff_active(true)`.

### Zarzut 2: wieża i `neverRout`. ODRZUCAM jako wadę I3, PRZYJMUJĘ przekazanie

Dowód: dispatch I3 obejmuje wyłącznie „ścieżki już portowane”. Skutki `_resolveBlowOutcome` trafienia wieży poza zabiciem (morale, `Rout`, `Facing`, log przed `_pushClash`) są w Rust nieportowane. Zapis jest jawny: `ProdBody::tower_blow`, wpis `unported` `wieza-resolveBlowOutcome-efekty`; nagłówek generatora, sekcja „WIEZA”; raport r1. Tag `rout` w `_pushClash` wieży czyta `st.routed`, więc jest poprawny wobec stanu, który port faktycznie zmienia. Pełne pokrycie wymaga najpierw portu tych skutków, czyli zmiany logiki walki, a tej I3 nie wolno zmieniać.

Przekazanie: do I5 (#249/#280) i K5LOOP-OUTCOME (#109/#147) trzeba dopisać wektory wieży z `neverRout = false`: rout, facing, log, kolejność przed `_pushClash`, tag `rout` po morale wieży.

### Zarzut 3: logi końca w pętli. PRZYJMUJĘ częściowo, ODRZUCAM część o `ratio_at_cap != ratio`

Dodałem test `petla_logi_konca_morale_obu_stron_z_wektorow_pinu`. Pełna pętla `SiegeLoop` (`start` + `resume`) prowadzi do załamania morale armii najpierw atakującego, potem obrońcy (ratio 0,1). Sprawdza on ścieżkę `EndCheck` → `end_logs` (ponowny `end_check_snapshot`) → `finish`. Teksty oczekiwane są wzięte z wektorów pinu (`ends`, generator wykonuje `_checkEnd` `:10186-10195`, `:10229`), a nie z kodu Rust. Test sprawdza kolejność linii (morale, potem koniec), zwycięzcę i to, że `End` jest ostatnią akcją. Razem ze scenariuszem zabicia przez wieżę (`petla_emituje_ture_wieze_i_koniec_jako_dto`) pętla ma teraz 3 scenariusze końca.

Część `ratio_at_cap != ratio` ODRZUCAM w zakresie pętli. `SiegeEnv::end_check_snapshot` (`siege_tactics_loop.rs`, `ratio_a_at_cap: ratio_a`) ustawia z konstrukcji obie wartości jako równe. Rozjazd w pinie powstaje wyłącznie przez rozbicie dowódców (`commandersToWithdrawAfterArmyBreak`, `:10168-10169`), a to jest nieportowane (efekty dowódcy, `isArmyCommander = false`). Ta gałąź jest więc w pętli nieosiągalna i nie da się jej przetestować bez portu dowódców. Do przekazania razem z portem efektów dowódcy (K5LOOP i I5).

### Zarzut 4: pełne `cargo test --all-targets` dla engine. Informacja, odpowiadam pomiarem

Dysk w tej rundzie miał przed bramkami 6,1 GB, a w trakcie 5,4–5,8 GB wolnego (`df -h /`), czyli poniżej 8 GB. Zgodnie z dispatchem (kryterium 3) zgłaszam BLOCK pełnego przebiegu i podaję liczby GB. Bramki nie pominąłem po cichu: uruchomiłem `cargo test --lib` i 14 binarek, które używają `SiegeLoop`, `ProdBody`, `LoopBody` lub `siege_tactics_actions` (wynik w §Bramki). Pełny przebieg (Operator r1: 496 binarek, rc=0) czeka na FC albo integrację przy ≥ 8 GB wolnego.

### Zarzut 5: Facing w `start`, stan w `complete`. ODRZUCAM jako wadę I3

Dowód: w pinie `attacker.facing = facingFromTo(...)` i `group.rotation.y = dirYaw(...)` wykonują się w `t0` (`:9104-9105`), przed pierwszym `_raf`. Strumień akcji (Facing w `t0`) jest więc zgodny z pinem, a opóźnienie dotyczy modelu stanu `ProdBody` (`strike` w `complete`). Przeniesienie zmiany stanu `facing` do `start` zmieniłoby logikę walki: `facing` wchodzi do `relative_hit` ciosów przychodzących. Dispatch zabrania tego („Nie zmieniaj logiki walki”), podobnie jak zmiany producenta ramki I2. Dziś nie zmienia to wyniku walki, bo wieża używa stałego łuku z szablonu, a aktywacje w oblężeniu są sekwencyjne (`busy`).

Kontrakt dla I4: w oknie `[t0, hitAt)` kierunek jednostki bierze się z akcji `Facing`, a nie z `BattleFrameDto`. Do przekazania: K5LOOP-FACING (#107) ma przenieść moment zmiany stanu `facing` na `t0` jak w pinie.

### Zarzut 6: unikalność `UnitId` między stronami. PRZYJMUJĘ

`actions_to_dto` sprawdza teraz, czy id obu rosterów są unikalne, zanim cokolwiek skonwertuje. Przy duplikacie zwraca nowy wariant `ActionError::DuplicateId(u64)`. To ten sam kontrakt co `BattleFrameDto::validate` (`units (unique id)`). Założenie z walidacji `Melee` (`attacker != target` po id) jest więc wymuszone u producenta, niezależnie od przyszłego przydziału id w #113.

Test `akcje_dto_wymagaja_unikalnych_id_w_bitwie`: przy unikalnych id konwersja przechodzi, a po nadaniu obrońcy id atakującego zwraca `DuplicateId`. Mutacja (`&& false` w sprawdzeniu) daje FAIL tego testu.

## Bramki (ta runda)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo (scratchpad, `tgt_ob`, usunięty po bramkach).

- engine: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0.
- engine: `cargo test --lib` z 14 binarkami (`p4_1i1_battle_outcome`, `p4_1i2_frame`, `p4_1i2_frame_fire`, `p4_1i3_actions`, `p6_k5doc_state`, `p6_k5loop_outcome_pin`, `p6_siege_tactics_loop`, `p6_siege_tactics_loop_body`, `p6_siege_tactics_loop_body_pin`, `p6_siege_tactics_loop_resume`, `p6_siege_wylom_tower`, `p6_tower_target_wiring`, `p6_wieze_2b1`, `p6_wieze_2b2`), `--no-fail-fast`: EXIT 0. Wyniki: lib 126 passed; `p4_1i3_actions` 9/9 (było 6); pozostałe 19+7+2+9+8+4+8+2+3+6+6+7+12 passed; 0 failed.
- engine: pełne `cargo test --all-targets --no-fail-fast`: NIE URUCHOMIONO, BLOCK z powodu dysku (5,4–5,8 GB < 8 GB).
- view-model (bez zmian w tej rundzie): `cargo fmt --check` EXIT 0, `cargo clippy --all-targets -- -D warnings` EXIT 0, `cargo test --all-targets --no-fail-fast` EXIT 0 (13 binarek, 109 passed, 0 failed).
- `git diff --check` czysty. Brak `#[ignore]`, brak osłabionych asercji. Istniejące wektory bez FF są niezmienione.
