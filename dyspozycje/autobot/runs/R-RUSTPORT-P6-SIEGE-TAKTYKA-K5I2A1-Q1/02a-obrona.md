STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A1-Q1
GOAL: odpowiedź Operatora na zarzuty Evaluatora wobec kodu e5fd83368 (klocek K5i-2a1: teren, pięć funkcji)
ZMIANY/COMMIT: kod bez zmian (kod e5fd83368). Zmiany w tym commicie: rename raportu 01-operator-r4.md -> 01-operator-r1.md, korekta pól SHA i RUNDY w tym raporcie, ten plik. SHA commitu obrony: patrz pole sha w odpowiedzi orkiestratorowi.
TESTY: nie uruchamiano ponownie (brak zmian kodu Rust w tym commicie). Bramki z raportu 01-operator-r1.md (e5fd83368) nie były re-run w tej rundzie: NIE_ZMIERZONO w tej rundzie.
BLOKADY: brak
RUNDY: 1/5 (obrona na 01-operator-r1.md)
NASTĘPNY KROK: Evaluator (ponowna ocena po obronie)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Z1. Brak produkcyjnych wołających w Rust (tylko test wektorowy) — ODRZUCAM
Dowody:
- Dispatch (kryterium 1) wymaga: "Każda funkcja ma wołającego w teście wektorowym". Każda z pięciu funkcji ma test wektorowy: `norm_terrain_wektory`, `parse_defense_bonus_pct_wektory`, `terrain_defense_multiplier_wektory`, `terrain_river_attack_multiplier_wektory`, `city_gated_terrain_multiplier_wektory` (rust-port/engine/tests/p6_siege_tactics_inputs_terrain.rs).
- Dispatch jawnie wiąże wywołania z K5I2a2–a4/W8 (zakres następnych klocków).
- Funkcje są `pub fn` w `pub mod` (rust-port/engine/src/domain/mod.rs:102). Brak `allow(dead_code)` w module. Dla rustc/clippy API publiczne nie jest martwym kodem, więc bramka `clippy -D warnings` nie wymaga wołających.
- Uwaga dla integracji: kryterium (2) "brak martwego kodu" rozumiem jako brak nieużywanych prywatnych elementów, nie jako brak konsumenta publicznego API. Jeśli Evaluator czyta je ściślej, to jest rozbieżność z dispatchem, a nie wada kodu. Decyzja należy do właściciela.

### Z2. Kolizja nazwy `terrain_river_attack_multiplier` z helperem w `siege_tactics_blow_inputs.rs` — ODRZUCAM (ryzyko integracyjne, nie błąd)
Dowody:
- Różne moduły: `domain::siege_tactics_inputs_terrain::terrain_river_attack_multiplier(terr, data, river_mult)` oraz `domain::siege_tactics_blow_inputs::terrain_river_attack_multiplier(...)` (siege_tactics_blow_inputs.rs:48).
- Brak importów glob (`::*`) dla żadnego z tych modułów w `src/` i `tests/` (grep: brak trafień).
- Rust nie zgłasza konfliktu nazw między modułami; kompilacja i testy K5I przechodzą (raport 01-operator-r1.md).
- siege_tactics_blow_inputs.rs i combat.rs nie zostały zmienione (zgodnie z dispatchem).
- Zalecenie dla a2–a4: importować ścieżką kwalifikowaną (np. `siege_tactics_inputs_terrain::terrain_river_attack_multiplier`), a wybór wersji zostawić wołającemu. Nie zmieniam nazwy, bo dispatch wymaga 1:1 z pinem.

### Z3. NFD: brak przestawiania kanonicznego (ccc) wielu znaków spoza U+0300..U+036F — PRZYJMUJĘ (ograniczenie udokumentowane, poprawka poza tym klockiem)
Potwierdzenie faktu:
- Node 22: `"ཱི".normalize("NFD")` = `[0F71, 0F72]` (przestawienie wg ccc). Tabela `NFD_STRIPPED` działa per punkt kodowy, więc nie odtwarza tego przestawienia. Rust zwróci dla tej sekwencji kolejność wejściową (wniosek z konstrukcji tabeli; NIE_ZMIERZONO uruchomieniem Rust dla tego wejścia).
- Wektory pokrywają wszystkie pojedyncze punkty kodowe i 631 napisów, nie wszystkie sekwencje. Zarzut jest zasadny co do zakresu testów.
Zakres wpływu: normTerrain jest stosowane do nazw terenów z danych (terrain-combat.json) i tych nazw nie zawierają sekwencji wielu znaków z ccc różnym od zera poza U+0300..U+036F. Pełna poprawka wymaga tabeli ccc dla wszystkich punktów kodowych w wyjściu NFD i stabilnego sortowania runów; wykracza poza klocek i jest zbyt duża na tę rundę.
Proponowany dalszy krok: osobny temat (dług NFD-CCC), patrz suggested task w odpowiedzi orkiestratorowi.

### Z4. Test `liczniki_pokrycia_zgodne_z_generatorem` sprawdza tylko JSON — ODRZUCAM (zarzut o teście meta, nie o pokryciu)
Dowody:
- Test `liczniki_pokrycia_zgodne_z_generatorem` (test file, ~l. 203-208) sprawdza jedynie, że JSON ma 13 liczników > 0. Rzeczywiście jest to test meta.
- Pokrycie gałęzi jest asertowane w testach funkcji: `terrain_river_attack_multiplier_wektory` (l. 157-178) wymaga > 0 dla `river_early`, `river_not`, `river_hit`, `river_no_row`; analogicznie pozostałe funkcje wymagają swoich etykiet gałęzi.
- Zastrzeżenie (NIE_ZMIERZONO): etykiety gałęzi (`br`) nadaje generator na podstawie gałęzi pinu, a nie instrumentacja kodu pinu. Pokrycie jest więc pokryciem etykiet generatora.

### Z5. Formalia: nazwa raportu r4 zamiast r1, SHA tylko w odpowiedzi — PRZYJMUJĘ (naprawione w tym commicie)
- Plik przemianowany: `01-operator-r4.md` -> `01-operator-r1.md` (git mv).
- Pole SHA w raporcie: `e5fd83368e596600b1093641fd747adfded6fd84`.
- Pole RUNDY: poprawiono z "4/5" na "1/5" (dispatch: runda 1/5).

## Stan po obronie
- Kod K5I2a1 (e5fd83368) nie zmieniony.
- Odrzucone: Z1, Z2, Z4. Przyjęte: Z3 (jako udokumentowane ograniczenie), Z5 (naprawione).
- NIE_ZMIERZONO w tej rundzie: ponowne bramki Rust, pokrycie instrumentalne gałęzi.
