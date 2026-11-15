STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1J-GENERALTARGET-ROZP-Q1
GOAL: Rozpoznanie (tylko odczyt) miejsc użycia `generalTargetId` w pinie 07d2fbd72 i odpowiedników w Rust na bazie f7baa3848; propozycja tematu wdrożeniowego.
ZMIANY/COMMIT: allowlista zachowana. Nowy plik `dyspozycje/rust-port/p4/P4-1J-GENERALTARGET-ROZPOZNANIE.md`; raport `dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-GENERALTARGET-ROZP-Q1/01-operator-r1.md`. Zero zmian kodu gry. SHA: ten commit (ostatni na worktree, detached od bazy f7baa3848).
TESTY: NIE_DOTYCZY (rozpoznanie, bez zmian kodu). Weryfikacja: `git grep -n generalTargetId 07d2fbd72 -- gra/src` (17 trafień, komplet), `git grep` po `rust-port` (general_target / generalTarget / PlannedMarch / planned_march / preview_path / cancel_planned_march).
BLOKADY: brak. NIE_ZMIERZONO: dokładna gałąź `restore_playable_planned_marches` dla `planned-march.ts:466`; stan generałów w `PlayableState`; wpływ na renderer.
RUNDY: 1/5
NASTEPNY KROK: Orkiestrator decyduje o zakresie wdrożenia (propozycja w §5 raportu, temat `P4-1J-GENERALTARGET-WDROZENIE`, po P4-1H).
DEPLOY/PUSH: NIE WYKONANO

Kluczowe ustalenia:
1. `PlayablePlannedMarch` (`rust-port/engine/src/domain/playable.rs:558-566`) nie ma pola `generalTargetId`; komentarz `:554-555` wyłącza je z zakresu P4-1J.
2. Produkcyjny zapis `playable_planned_marches_to_save` (`save_load.rs:837`) zawsze wpisuje `general_target_id: None`, więc zapis z Rust gubi cel marszu za generałem.
3. Wczytanie zapisu webowego raportuje `general_target_dropped` (`save_load.rs:814, 961`); test `tests/p4_1j_planned_march_state.rs:354` utrwala tę lukę.
4. Warstwa pathfinding/planner (`pathfinding.rs:1714-1733, 2191-2283`, `general_quick_follow.rs:274-377`, `generals.rs:118-154`) ma logikę `generalTargetId`, ale żaden kod produkcyjny w `rust-port/engine/src` nie wywołuje `sync_general_march_targets`, `plan_enabled_general_follow_marches` ani `issue_general_quick_follow` (tylko testy `p6_repin_wojna_2_generals.rs`, `p6_repin_wojna_3_hook.rs`).
5. Web wywołuje rekrutację do generała (`main.ts:14975-14986`), czyszczenie przy przełączeniu (`main.ts:25920`) i synchronizację celu (`main.ts:31349`, wołania `31547, 31563, 31664, 31676, 31693, 44120`); w Rust brak odpowiedników w produkcji.
6. Komentarz `general_quick_follow.rs:13-15` jest nieaktualny (twierdzi, że `pathfinding::PlannedMarchDest` nie ma pola).
7. Brak w `rust-port` funkcji `preview_path` i `cancel_planned_march` (P4-1H, #217, w kolejce).

Pytanie ABC: NIE ZADAWANO. Zachowanie rozstrzyga web (zasada 11). Zakres wdrożenia (czy rekrutacja i czyszczenie `main.ts:14975-14986, 25920` wchodzą w P4-1J) jest decyzją techniczną orkiestratora.
