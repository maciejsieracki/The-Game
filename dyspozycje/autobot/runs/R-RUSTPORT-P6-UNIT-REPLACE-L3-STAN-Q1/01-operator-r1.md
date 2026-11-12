STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L3-STAN-Q1
GOAL: (a) rozszerzenie PlayableState o stan ekonomii zamiany (skarbiec gracza, pula surowcow miasta, typ/HP/flaga uzycia jednostki) z domyslnym zachowaniem; (b) komenda gracza replace_unit przez adapter replace_unit_wired; (c) testy behawioralne i zgodnosc wsteczna zapisu.
BAZA: ab116e492 (FC L3 etap 1, galaz rust-port-wip/UNIT-REPLACE-L3-fc). UWAGA: zlecenie wskazywalo tez origin/rust-port/parity-v2 (f207ea6b1); ab116e492 NIE jest przodkiem parity-v2 (merge-base ec4e11741), a adapter unit_replace_wiring.rs i p6_unit_replace_l3 istnieja tylko w ab116e492. Zastosowano baze z dispatchu. parity-v2 nie zostal dotkniety.
ZMIANY/COMMIT: allowlista: rust-port/engine/src/domain/playable.rs; rust-port/engine/tests/p6_unit_replace_l3_state.rs (nowy); rust-port/engine/tests/p6_unit_replace_l3_state_vectors/pre-etap2-state.json (nowy, zapis sprzed zmiany); dyspozycje/autobot/runs/R-RUSTPORT-P6-UNIT-REPLACE-L3-STAN-Q1/01-operator-r1.md. Nie zmieniono: mod.rs (rejestracja unit_replace_wiring juz byla), Cargo.toml, Cargo.lock (nieskomitowany), gra/**, WERSJE.md.
COMMIT: SHA w odpowiedzi operatora (gałąź rust-port-wip/UNIT-REPLACE-L3-STAN-Q1, bez push).
PROJEKT STANU (kluczowe decyzje):
- PlayableReplaceEconomy trzymane jako pole PlayableState.economy (#[serde(default)], skip_serializing_if gdy domyslne), a NIE jako pola PlayablePlayer/PlayableCity/PlayableUnit: te struktury sa konstruowane literalami w p6_wire_war_*.rs (poza allowlista), wiec nowe pola zlamalyby kompilacje tych testow. Stan jednostki (type_id, category, hp, hp_max, replace_used_this_turn) jest kluczowany id jednostki w economy.units; skarbiec w economy.treasury (gracz ludzki); pule w economy.city_stock (klucz id miasta).
- PlayableState zachowuje derive Eq (bridge.rs derywuje Eq nad EngineState). Stad: manualny impl Eq dla PlayableReplaceEconomy (znacznik) i odrzucanie NaN/Inf w set_human_treasury / set_capital_stock (PlayableError::NonFiniteEconomy). Zwrotnosc == zachowana, bo ekonomia nie przyjmuje NaN (JSON go nie niesie, adapter odejmuje tylko skonczone kwoty).
- replace_unit(unit_id, new_type_id, defs, gate): waliduje wlasciciela i istnienie jednostki oraz miasto gracza (stolica; jedyne miasto gracza w tym wycinku), wola replace_unit_wired, przy sukcesie zapisuje skarbiec/pule/stan jednostki i zeruje ruch; przy odrzuceniu zwraca PlayableError::UnitReplaceRejected{reason, detail} bez zmiany stanu.
- Tabela defs jest wstrzykiwana przez wywolujacego (tak jak w adapterze L3). NIE_ZROBIONO: produkcyjne zrodlo defs z units.json. Rust nie ma portu web categoryOf (kategoria modelu jednostki, wymagana przez ReplaceUnitDef.category); bez niego nie da sie zbudowac tabeli produkcyjnej z danych bez zgadywania. Do domkniecia w osobnym temacie.
- advance_turn zeruje replace_used_this_turn we wszystkich wpisach economy.units (bez zmiany kolejnosci faz).
- Wiring AI (ai_replace_*, faza TurnPhase::Ai) pozostaje zgodnie z dispatchem na pozniej (marker w advance_turn zostal).
- Start gry: skarbiec 0, pule puste (domyslne = zachowanie sprzed zmiany). Komenda bez srodkow odrzuca Money.
TESTY:
- cargo fmt --check: OK (exit 0)
- cargo clippy --all-targets -- -D warnings: OK (bez ostrzezen)
- cargo test --lib: 53 passed, 0 failed
- cargo test --test p6_unit_replace_l3 --test p6_repin_unit_replace_pure --test p6_repin_unit_replace_execute --test p6_wire_war_pipeline --test playable_slice --test p6_unit_replace_l3_state: wszystkie OK (8, 7, 1, 7, 7, 10 passed)
- cargo test --no-fail-fast (pelny): EXIT=0, sumarycznie passed=2789 failed=0 (log poza repo)
- Nowe testy p6_unit_replace_l3_state (10): stan domyslny nie pojawia sie w DTO; zapis sprzed etapu 2 laduje sie i ponownie zapisuje bajt-zgodnie (JSON Value) z fixture; sukces (Pieniadz -4, surowce wg unit_stock_cost, typ Procarz, HP 20); brak srodkow (Money, stan bez zmian); brak magazynu (Stock, stan bez zmian); blokada pinu (Gate z powodem); nieznany typ (Gate + UNKNOWN_NEW_TYPE_DETAIL); uzycie w turze (Used; po advance_turn dozwolone); zamiana nie zmienia pozostalych pol; NaN/Inf odrzucane.
- Istniejace asercje: bez zmian (zadnego istniejacego testu nie edytowano).
BLOKADY: (1) baza: rozbieznosc zlecenia (parity-v2 vs ab116e492), patrz GOAL; (2) brak produkcyjnego zrodla tabeli defs (kategoria web categoryOf nie w Rust), patrz PROJEKT STANU; (3) Eq/NaN: wymagany manualny impl Eq zamiast czystego derive, patrz PROJEKT STANU; (4) komenda wymaga stolicy jako miasta zamiany (uproszczenie wycinka).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) na gałęzi rust-port-wip/UNIT-REPLACE-L3-STAN-Q1; decyzja orkiestratora w sprawie zrodla defs (categoryOf) i bazy.
DEPLOY/PUSH: NIE WYKONANO
