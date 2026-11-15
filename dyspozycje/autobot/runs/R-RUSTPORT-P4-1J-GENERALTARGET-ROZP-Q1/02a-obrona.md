STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1J-GENERALTARGET-ROZP-Q1
GOAL: Odpowiedź Operatora na 7 zarzutów Evaluatora/FC do rozpoznania generalTargetId (baza f7baa3848, Operator 2e14026c1).
ZMIANY/COMMIT: poprawiony wyłącznie `dyspozycje/rust-port/p4/P4-1J-GENERALTARGET-ROZPOZNANIE.md` (allowlista). Zero zmian kodu gry. Baza odpowiedzi: 2e14026c1.
TESTY: NIE_DOTYCZY (dokument, bez zmian kodu). Weryfikacja: `git grep -n generalTargetId 07d2fbd72 -- gra/src` (20 linii), `git grep -n -i general` po `playable.rs`, `git grep -n` po `save_load.rs`, `pathfinding.rs`, `tests/p4_1j_*`.
BLOKADY: brak. NIE_ZMIERZONO: `p4_1j_planned_march_pin_vectors.rs:399` (czy przypadek `ulamek` zawiera `generalTargetId`).
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator r2 weryfikuje poprawioną tabelę i listę testów; następnie decyzja orkiestratora o zakresie tematu wdrożeniowego.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — `planned-march.ts:466` oznaczone NIE_ZMIERZONO: PRZYJMUJĘ
Dowód: pin `gra/src/game/planned-march.ts:466` pomija wpis tylko gdy współrzędne równe i brak `generalTargetId`. Rust: `pathfinding.rs:2190-2194` (`has_general`, warunek `... && !has_general` → `continue`) w `planned_marches_from_save` (`pathfinding.rs:2164`). Wołane z `save_load.rs:958` (`restore_playable_planned_marches`, `:903`). Zakres zarzutu poprawiony: wpis generała jest w `has_general` (2190-2194), a przypisanie pola w 2202-2213 (nie 2191-2200 w sensie samej gałęzi). Komentarz `pathfinding.rs:2188` cytuje `planned-march.ts:455` — nieaktualny, właściwie `:466`. Status w tabeli zmieniony na ZGODNE (warstwa pathfinding); utrata następuje dopiero w PlayableState (patrz zarzut 2 i 7).

### Zarzut 2 — brak stanu generałów w PlayableState, sekcja Zależności niekompletna: PRZYJMUJĘ
Dowód: `git grep -n -i general` po `rust-port/engine/src/domain/playable.rs` na `2e14026c1` daje jedną linię (`:554`, komentarz). `PlayableState` nie ma listy generałów. Dodano do §2 dokumentu, do §5 pkt 4 (synchronizacja wymaga stanu generałów, zakres większy niż pkt 1-3) i do §6 jako zamknięte.

### Zarzut 3 — liczba trafień 17 vs 21: PRZYJMUJĘ korektę, obie liczby były błędne
Dowód: `git grep -n generalTargetId 07d2fbd72 -- gra/src` = 20 linii. Raport Operatora (17) i zarzut (21) są błędne. Tabela w dokumencie pokrywa wszystkie 20 (lista dopisana do dokumentu: planned-march 22, 466, 471, 472, 496; save 425; generals 99, 102; generalQuickFollow 32, 69, 79, 110, 112, 152; main 14976, 14986, 25920, 31304, 31307, 31319). Korekta w `01-operator-r1.md` nie jest wykonywana w tym temacie (poza allowlistą tej obrony); poprawna liczba jest w dokumencie.

### Zarzut 4 — asercje utrwalające lukę w testach: PRZYJMUJĘ częściowo
- `p4_1j_planned_march_state.rs:352` — asercja `general_target_dropped == ["1"]` utrwala lukę (test `:319-358`). Komentarz `:354` cytuje `planned-march.ts:465` (pin: `:466`). Zarzut wskazywał `:352` i `:354`; właściwa asercja to `:352`.
- `p4_1j_planned_march_pin_vectors.rs:207-208` — własny oracle testu dopisuje do `general_target_dropped` każdy wpis z `generalTargetId`; `:363` zlicza; `:378` asercja `general_dropped >= 5` (Operator tego nie wymienił, zarzut słusznie); `:399` asercja `is_empty` w przypadku `ulamek`. Czy ten wektor ma `generalTargetId` — NIE_ZMIERZONO (do sprawdzenia przy wdrożeniu).
- `p4_1j_planned_march_bounds.rs:72` — ODRZUCAM jako utrwalenie luki: wejście `saved(...)` ma `general_target_id: None` (`:50`), asercja sprawdza tylko zakresy liczb i `unrepresentable`. Plik nie wymaga zmiany merytorycznej.
Dokument §2 i §5 pkt 6 zaktualizowany o pełną listę.

### Zarzut 5 — wektory pathfinding już istnieją: PRZYJMUJĘ
Dowód (pliki istnieją na `2e14026c1`): `rust-port/engine/tests/p6_repin_wojna_2_r3_planned_march.rs`, `p6_repin_wojna_2_r4_save.rs`, `p6_repin_wojna_3_hook.rs`. §5 pkt 7 przepisany: nowe wektory tylko dla warstwy PlayableState (zapis i odczyt w obie strony z polem) oraz synchronizacji celu; warstwy pathfinding nie duplikować.

### Zarzut 6 — numery linii komentarza `general_quick_follow.rs`: ODRZUCAM
Dowód: `git grep -n` na `2e14026c1` daje dokładnie linie 13, 14, 15 (`//! - Typ PlannedMarchDest ...`, `//!   odwzorowany lokalnie ... pathfinding::PlannedMarchDest NIE zna pola`, `//!   generalTargetId ...`). Zarzut podał 12-14. Dokument zostaje przy 13-15. Stwierdzenie, że komentarz jest nieaktualny (pole istnieje w `pathfinding.rs:1718`), jest poprawne i zostaje.

### Zarzut 7 — potwierdzenie luki: PRZYJMUJĘ (bez zmiany wniosku)
Potwierdzone: `save_load.rs:837` ustawia `general_target_id: None` (`playable_planned_marches_to_save`, `:825`). `save_load.rs:814` (pole raportu `general_target_dropped`) i `:961` (`report.general_target_dropped.push`). Brak wołającego produkcyjnego `sync_general_march_targets`. Brak `preview_path` i `cancel_planned_march` w `rust-port` (poza `pathfinding.rs`) — w dokumencie już było.

## Zmiany w dokumencie (`dyspozycje/rust-port/p4/P4-1J-GENERALTARGET-ROZPOZNANIE.md`)
- §1 tabela: wiersz `planned-march.ts:466` → ZGODNE (pathfinding.rs:2190-2194), NIE_ZMIERZONO usunięte; liczba 20 i pokrycie tabeli; uwagi o komentarzach `general_quick_follow.rs:13-15` (poprawne) i `pathfinding.rs:2188` (`:455` → `:466`).
- §2: stan generałów w PlayableState (brak); lista testów utrwalających z liniami.
- §5 pkt 4, 6, 7: zakres (stan generałów), lista testów, wektory tylko w PlayableState.
- §6: zamknięte NIE_ZMIERZONO (466, stan generałów); pozostaje `pin_vectors:399`, wpływ na renderer.

## Pytanie ABC
NIE ZADAWANO. Zakres wdrożenia (rekrutacja `main.ts:14975-14986`, czyszczenie `main.ts:25920`) pozostaje decyzją orkiestratora (zasada 11: web rozstrzyga zachowanie).
