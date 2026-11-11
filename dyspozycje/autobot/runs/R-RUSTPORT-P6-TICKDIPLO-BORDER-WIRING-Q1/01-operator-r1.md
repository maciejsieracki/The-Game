STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-TICKDIPLO-BORDER-WIRING-Q1
GOAL: w produkcyjnym wołającym (ai_diplomacy_turn.rs / miejsce budowy kontekstu tury) wyliczać common_border_delta = shared_border_penalty_for_epochs(epoka obu stron) i przekazywać do TickContext; test behawioralny: para w epoce 1 -> -2, epoka 2 -> -3, epoka 3 -> -4, zgodnie z wektorami z pinu.
ZMIANY/COMMIT: brak zmian w kodzie. Baza: origin/rust-port/parity-v2 = ca33abdd6 (f207ea6b1 jest jego przodkiem). Commit zawiera wyłącznie ten raport. Allowlista nieużyta poza dyspozycje/autobot/runs/R-RUSTPORT-P6-TICKDIPLO-BORDER-WIRING-Q1/**. gra/, origin/main, WERSJE.md, Cargo.toml, Cargo.lock nietknięte.
TESTY: NIE_ZMIERZONO. Bramki cargo (fmt, clippy, test --lib, p6_tickdiplo, p6_tickdiplo_wiring, diplomacy) nie były uruchamiane: brak zmian w kodzie do sprawdzenia, a wolne miejsce na dysku w chwili startu wynosiło 7.1 GB (poniżej progu 8 GB dla nowego tematu Rust, zasada 5 i 7 CLAUDE.md).
BLOKADY:
  1. Założenie dispatchu nie zgadza się z kodem. W rust-port/engine/src/domain/ai_diplomacy_turn.rs nie ma budowy TickContext ani wywołania TickContext::default(). Jedyne odniesienia do TickContext w tym pliku to import (linia 23) i parametr `contexts` funkcji `tick_pairs_relation_scores` (linie 102-114), która przyjmuje kontekst od wołającego.
  2. Nie istnieje produkcyjny wołający `tick_pairs_relation_scores`. Grep po rust-port/engine/src i tests wskazuje wyłącznie definicję oraz test tests/p6_wire_war_diplo.rs (linie 466-486). Ten sam wynik dla `run_brake_phase` poza testami.
  3. `shared_border_penalty_for_epochs` (diplomacy.rs:724) nie ma wołającego w src. Wołają go tylko testy (tests/p6_tickdiplo.rs, funkcja tick_ctx_of i asercje mapowania epok na stawkę).
  4. Nie ma w src produkcyjnego miejsca, które ustawia `common_border_delta` lub `common_border` dla pary. Wiring wymaga więc nowego produkcyjnego driwera tury (źródło epok obu właścicieli, budowa mapy kontekstów, wywołanie tick_pairs_relation_scores). To wykracza poza allowlistę i wymaga decyzji architektonicznej, nie tylko zmiany w jednym pliku.
  Uwaga pomocnicza: epoka gracza jest dostępna w player.rs:408 (`epoch_number(&Technologia)`), więc źródło epok istnieje, brakuje samego wołającego.
  Mapowanie stawek (-2/-3/-4) jest już pokryte przez tests/p6_tickdiplo.rs (wektory z pinu, asercja `shared_border_penalty_for_epochs == karaWspolnaGranicaDelta`). Nowy test wyłącznie na tej funkcji nie domknąłby GOAL, bo nie dowodzi wiringu.
RUNDY: 1/5 (Operator). Decyzja wymagana po stronie orkiestratora/właściciela, nie kolejny Operator na tym samym dispatchu.
NASTĘPNY KROK: DECISION_REQUIRED dla orkiestratora. Do wyboru: (a) wydzielić osobny temat budowy produkcyjnego driwera tury (z listą plików i zatwierdzeniem poszerzonej allowlisty); (b) zamknąć ten temat jako niewykonalny w obecnym zakresie, jeśli driver ma powstać osobno; albo (c) zaktualizować dispatch do rzeczywistego stanu kodu (ai_diplomacy_turn.rs nie buduje kontekstu) i ponownie wystawić temat. Bramki nie są do uruchomienia, dopóki nie ma zmian kodu.
DEPLOY/PUSH: NIE WYKONANO (operator nie pushuje; brak zmian kodu do integracji).
