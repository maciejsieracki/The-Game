# 02a-obrona: R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1 (runda 2, Operator obrona, Haiku)

STATUS: PASS-WITH-NOTES (kod poprawiony w 4 punktach; 6 zarzutów przyjętych bez poprawki i przekazanych do decyzji FC; 2 odrzucone z dowodem)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1
GOAL: odpowiedź na 10 zarzutów Evaluatora r1 (02-evaluator.md, commit 71567984d)
BAZA: eb60780e2 (kod Operatora r1), detached; poprawka: 52385c502
ZMIANY/COMMIT: 52385c502 (rust-port/engine/src/domain/playable.rs, rust-port/engine/tests/p6_victory_wiring.rs). Cargo.lock nie commitowany.
TESTY: cargo fmt --check: kod 0. cargo clippy --all-targets -- -D warnings: kod 0. cargo test --lib: 111 passed, 0 failed (przed poprawką 110). cargo test --test p6_victory_wiring: 6 passed, 0 failed. Pełny cargo test: patrz PEŁNY TEST.
RUNDY: 2/5

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ, NIEZREALIZOWANE. Brak tests/p6_victory_wiring_gen.mjs i tests/p6_victory_wiring_vectors/**. Wektory nie są generowane z tekstu pina i nie ma SHA fragmentu. Nie zrobiłem tego w r2: generator wymaga ekstraktora tekstu pina (main.ts:43441-43483, 37997, 43827, 34018-34025, 46368-46370), to osobny zakres. Stan: BLOCK na kryterium 1. Decyzja FC: osobny temat generatora czy kolejna runda Operatora.

2. PRZYJMUJĘ, NAPRAWIONE. Dodany test w module playable.rs: przegrana_po_utracie_wszystkich_miast_konczy_gre (kamien: tura z miastem ustawia flagę Some(true), usunięcie miast gracza 1 i kolejna tura daje koniec_gry = Przegrana). Zielony w cargo test --lib. Test nie jest wektorem z pina (ustawia stan bezpośrednio).

3. PRZYJMUJĘ, NAPRAWIONE CZĘŚCIOWO.
   - Test tautologiczny zastąpiony testem wczytania: wczytanie_zapisu_po_zakonczonej_grze_resetuje_koniec_gry (zapis serde, wczytanie serde, asercja koniec_gry == None i brak klucza koniecGry w JSON).
   - Pole koniec_gry ma #[serde(skip)]. Pin nie zapisuje gameOver i resetuje go przy wczytaniu (main.ts:47333: gameOver = false), więc to jest wpięcie resetu na jedynej ścieżce wczytania w Rust (serde).
   - Reset przy nowej grze to PlayableGame::new (nowy stan), nie ma osobnej operacji do wywołania.
   - Brak produkcyjnej funkcji load poza serde. Pozostałe pola resetu z pina 47333 (selectedId, zaznaczenia UI) są poza zakresem. NIE_ZMIERZONO dla reszty.

4. PRZYJMUJĘ, NIENAPRAWIONE. Odstępstwo od pina istnieje: flaga nie jest zapisywana, po wczytaniu = Some(false), wraca dopiero przy kolejnym sprawdzeniu, jeśli gracz ma miasto. Naprawa (zapis flagi) zmienia JSON i łamie golden p6_unit_replace_l3_state, który jest poza allowlistą. Wymaga decyzji FC (rozszerzenie allowlisty o golden, albo uznanie odstępstwa za FAIL do zmiany zakresu).

5. PRZYJMUJĘ, NIENAPRAWIONE. Flaga jest ustawiana tylko w fazie Victory. Pin ustawia ją przy zakładaniu i przejęciu miasta (main.ts:16508, 17816, 36218, 45646, 45877-45878). Miasto założone i utracone w jednej turze nie ustawi flagi. Wpięcie wymaga hooków w miejscach tworzenia miast w playable.rs, czego nie zrobiłem w r2.

6. PRZYJMUJĘ, NIENAPRAWIONE. Druga ścieżka przegranej (main.ts:34018-34025, sprawdzPrzegranaPoUtracieMiasta) nie jest wpięta. Wymaga hooka przy utracie miasta w ścieżkach walki i przejęcia.

7. PRZYJMUJĘ jako NIE_ZMIERZONO. Pin buduje potegiWszystkich z właścicieli jednostek i miast (main.ts:43448-43452, pętle po units i cities, potem objectivePowerForOwner dla każdego oid). Rust bierze klucze z inputs.power_raw plus człowieka (victory_power_inputs). Czy zbiory się różnią, nie sprawdziłem: brak wektora. Nie odrzucam i nie potwierdzam.

8. ODRZUCAM w obu częściach.
   - victoryMode: pin main.ts:43479 ma `_menuAdvanced?.victoryMode ?? 'moc_i_dominacja'`. Bez menu wynik to dokładnie MocIDominacja, zgodnie z pinem. Wybór z menu jest poza zakresem wg dispatchu (UI poza zakresem).
   - wszystkieTechZbadane=false: bez wpływu na wynik. Nauka wymaga rakiety przy NAUKA_WYMAGA_RAKIETY=true (victory.rs: is_nauka_victory). Pin nigdzie nie przypisuje rakietaWystrzelona=true (grep `rakietaWystrzelona\s*=` i `rakietaWystrzelona:\s*true` w gra/src/main.ts @07d2fbd72 nie daje trafień; jest init false w ok. 34963 i odczyt w 43478). Nauka nie może zajść ani w pinie, ani w Rust, więc flaga nie zmienia wyniku.

9. PRZYJMUJĘ, NAPRAWIONE w kodzie (bez testu wymuszającego błąd). advance_turn snapshotuje koniec_gry i gracz_kiedys_mial_miasto przed pętlą faz i przywraca je przy TurnPhaseQueueIncomplete (jedyny błąd po fazie Victory). Test wymuszający ten błąd nie został zbudowany: NIE_ZMIERZONO testem.

10. PRZYJMUJĘ, NIENAPRAWIONE. Test dominacji w epoce żelaza (dominacja_w_epoce_zelaza_konczy_gre_po_turze) potwierdza ścieżkę, nie zgodność z pinem. Mapowanie gracz 0 pina = PlayerId 1 w Rust jest niezweryfikowane wektorem. Część zarzutu do kryterium 1.

## PEŁNY TEST
Pełny cargo test --no-fail-fast na 52385c502 (kod, bez dokumentu): FULL_RC=0, 460 binariów, passed 3308, failed 0, ignored 1 (ignorowany test istnieje wcześniej, bez zmian w tym commicie; diff nie dodaje #[ignore]). Log: scratchpad/fulltest2.log. Pierwszy przebieg przerwany timeoutem 590 s (rc=124) po 1856 passed / 0 failed, bez FAILED.

## NASTĘPNY KROK
FC: decyzja w sprawie zarzutów 1, 4, 5, 6, 7, 10 (kryterium 1 i odstępstwa od pina). Zarzuty 2, 3, 8, 9 zamknięte kodem lub dowodem.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny w worktree, bez push).
