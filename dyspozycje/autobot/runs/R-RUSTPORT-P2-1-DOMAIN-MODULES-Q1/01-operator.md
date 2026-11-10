STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-1-DOMAIN-MODULES-Q1
GOAL: Katalog 15 modułów domeny (P2.1) z (a) plikami web na edb8fb56 i liczbą linii, (b) odpowiednikiem w rust-port/engine, (c) klasyfikacją startową z P1-17C.
ZMIANY/COMMIT: dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md (nowy, tura 2: poprawki po zarzutach 1–8); dyspozycje/autobot/runs/R-RUSTPORT-P2-1-DOMAIN-MODULES-Q1/01-operator.md (nowy, tura 2: obrona). Brak zmian w gra/**, brak kodu Rust, brak commita.
TESTY: brak testów kodu (temat katalogowy). Weryfikacja tury 2: `git rev-parse` main = edb8fb56; `git ls-tree main rust-port/engine/src/domain/` = 18 plików; `git ls-tree rust-port/parity-v2 …/domain/` = 28 plików; 16/18 wspólnych blobów (różnią się barbarians.rs, mod.rs); M9 = 33 pliki, suma 13 117 linii; `playable.rs:167` NOT_IMPLEMENTED potwierdzone; `trade.rs:563,720,1335`, `map_generator.rs:140-147,1250-1268`, `pathfinding.rs:284-287`, `diplomacy.rs:3265,3801` potwierdzone grep/sed na parity-v2.
BLOKADY: Brak. (Usunięta wcześniejsza błędna blokada „rust-port/engine tylko na parity-v2": katalog istnieje też na main, w wersji 18 plików.)
RUNDY: 1/5 (tura 2 tej rundy)
NASTEPNY KROK: Evaluator (Haiku 5.5 medium) weryfikuje poprawki 1–8, potem Final Control (Sonnet 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO

## OBRONA

1 -> PRZYJMUJE. M1(b) w tabeli zmieniono z „BRAK" na CZĘŚCIOWO. Dowód: `parity-v2:rust-port/engine/src/domain/map_generator.rs:140-147` (`HexTile.river`, komentarz: „source/flow marker", pełna topologia w późniejszej fazie), `:1250-1268` (`add_core_rivers`), `pathfinding.rs:284-287` (`river_cost`). Granice geometryczne pozostają BRAK.

2 -> PRZYJMUJE. M10(b) przepisano. Dowód trafień: `diplomacy.rs:240-241, 345-346` (parametry zaufania za religię), `:552-553, :644` (zdarzenie CommonReligion), `:703-704, :750-757` (flagi kontekstu i delta), `:1800` (etykieta „Religia"), `turn_economy.rs:11, 32, 44, 81, 108, 127, 140, 338-343` (stok `culture: u64` skarbca gracza). Wniosek zmieniono na: brak modelu kultury i religii jako domeny; stok `culture` to pole zasobu, nie odpowiednik `culture-religion.ts` (1479 linii). Stok `culture` został też odnotowany w wierszu M6.

3 -> PRZYJMUJE. M13(b) przepisano na CZĘŚCIOWO z jawnym znacznikiem. Dowód: `playable.rs:65` (`city_state_difficulty_override`), `:111` (`city_states_count: u16`), `:144` (domyślnie 6), `:167` (`"cityStatesCount:NOT_IMPLEMENTED"`), `diplomacy.rs:2904-2905, 2934-2935` (flagi), `:3265` i `:3801` (użycie). Znacznik NOT_IMPLEMENTED jest w wierszu.

4 -> PRZYJMUJE. Dodano do M1(b) i M11(b): `trade.rs:563` (`owners_have_shared_land_border`), `:720` (użycie w trasie lądowej), `:1335` („brak wspólnej granicy lądowej"), oraz `diplomacy.rs:265` (`borders_relation`, oznaczone jako parametr relacji, nie geometria). Status granic terytorialnych: BRAK; granic relacyjnych/handlowych: CZĘŚCIOWO.

5 -> PRZYJMUJE. Błędne twierdzenie usunięte. Fakty: katalog `rust-port/engine/src/domain/` istnieje na `main` (edb8fb56) w wersji 18 plików; `rust-port/parity-v2` (9e33fc77) ma 28. Wszystkie 18 nazw z `main` występuje w `parity-v2`; 16 z nich ma identyczny blob, różnią się `barbarians.rs` i `mod.rs`. Pin `parity-v2` uzasadniono jako nadzbiór cytowany read-only. Plan §0.1 mówi o `rust-port/engine` scalonym w `main`, co zgadza się z obecnością katalogu na `main`.

6 -> PRZYJMUJE. M9 zawiera teraz pełną listę 33 nazw plików z liczbami linii (`diplomacy.ts` 1766 + 29 `diplomacy-*` + `wiarygodnosc-types` 58, `empire-diplo-resource-flow` 37, `danina-nazwa` 64). Suma zweryfikowana: 33 pliki, 13 117 linii, zgodnie z `git show edb8fb56:<plik> | wc -l`.

7 -> PRZYJMUJE. Przypisanie rozstrzygnięte: `villageRewards.ts` (220 linii) → M14 (byty neutralne, właściciel neutralny jak barbarzyńcy). Uzasadnienie i odrzucona alternatywa (M4) są w wierszu M14. Status klasyfikacji: UNKNOWN. Rust: BRAK nagród z wiosek; jest tylko flaga `ai_turn.rs:131` `village: bool`.

8 -> PRZYJMUJE. §2 przepisano z samego „do przypisania w P2.2" na jawne statusy z powodem. `victory.ts` → ODROCZONE do P6.19 (plan §4 „Warunki zwycięstwa/porażki", osobny punkt planu). `inca-llama-seed.ts` i `r-stawki-strojenie.ts` → ODROCZONE do decyzji P2.2 z powodem: to dane seedu i strojenia stawek, nie logika domeny. Pozostałe 4 pliki playtest, `diag-log.ts`, `display-names.ts`, 2 pliki side-panel → POZA DOMENĄ z powodem.
