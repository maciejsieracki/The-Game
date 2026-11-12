STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-PROGRESS-Q1
GOAL: Obrona Operatora r1 (Haiku) na 5 zarzutów Evaluatora/FC: przyjęcie albo odrzucenie każdego z dowodem. Kod nie zmieniany w tej rundzie (commit operatora b0a236dea jest bazą obrony).
ZMIANY/COMMIT: brak zmian kodu w obronie. Obrona = wyłącznie ten plik. Kod operatora: b0a236deae20fce2a6d41fb9a741822c9f7dba52 (baza 513e1a56c, ancestor sprawdzony). Gałąź lokalna: wip/R-RUSTPORT-P6-UNIT-REPLACE-PROGRESS-Q1 (bez push).
TESTY: nie uruchamiano ponownie (obrona bez zmian w kodzie). Wyniki z raportu operatora (01-operator-r1.md): cargo fmt --check OK; clippy -D warnings OK; cargo test --lib 64 passed; p6_unit_replace_defs 7, p6_unit_replace_l3 8, p6_unit_replace_l3_state 13, p6_unit_replace_cost 4, playable_slice 7, p6_unit_replace_progress 5 passed. Weryfikacja dowodów w tej obronie: git grep (PlayableUnit literals), odczyt pina 07d2fbd72 (gra/src/main.ts:7404-7405, gra/src/game/veteran.ts:95-98), odczyt unit_health.rs:163-168 i unit_replace_cost.rs:66-75 w b0a236dea.
BLOKADY: (1) Odchylenie od dispatchu (zarzut 1) wymaga decyzji FC/orkiestratora, patrz niżej. (2) Dług DLUG-UNIT-REPLACE-PROGRESS w części bitewnej pozostaje otwarty (zarzut 3, zgodnie z dispatchem).
RUNDY: 1/5 (obrona w rundzie 1; kolejna runda tylko po decyzji o zarzucie 1 albo po zmianie kodu).
NASTĘPNY KROK: FC albo orkiestrator decyduje o zarzucie 1 (akceptacja pól w PlayableReplaceUnit). Pozostałe zarzuty zamknięte w obronie.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1. Odchylenie: pola w PlayableReplaceUnit, nie w PlayableUnit. Status: PRZYJMUJĘ (fakt odchylenia), decyzja po stronie FC.

Dowód faktu odchylenia: dispatch (kryterium 1 i GOAL pkt 1) wymaga pól w `PlayableUnit`. Operator dodał je do `PlayableReplaceUnit` (`rust-port/engine/src/domain/playable.rs`, ok. :364-372), czyli do stanu ekonomii `economy.units`, gdzie już żyje stan zamiany jednostki.

Dowód, dlaczego nie `PlayableUnit`: literały `PlayableUnit { ... }` poza allowlistą (`git grep 'PlayableUnit {' b0a236dea`):
- `rust-port/engine/tests/p6_wire_war_march_adapter.rs:57, :174, :261`
- `rust-port/engine/tests/p6_wire_war_view.rs:54`

Dodanie pól do `PlayableUnit` wymagałoby edycji tych plików, a są poza allowlistą dispatchu, więc byłoby to BLOCK. Literały w `playable.rs` (:622, :1264) są w allowlistcie, ale to nie wystarcza dla pozostałych czterech miejsc.

Zgodność wsteczna zapisu zachowana: pola z `#[serde(skip_serializing_if = "is_zero_opt_f64")]` i `#[serde(default)]` (test `pola_postepu_pomijane_gdy_domyslne_i_laduja_sie_z_zapisu_sprzed_zmiany` w `p6_unit_replace_progress.rs`).

Rekomendacja: zaakceptować odchylenie jako uzasadnione i opisane. Jeśli orkiestrator uzna, że dispatch musi być spełniony dosłownie, potrzebny jest osobny temat, który dotknie czterech plików testów poza allowlistą.

### Zarzut 2. Test e2e liczy HP ręcznie w Rust. Status: ODRZUCAM.

Dowód: końcowy krok HP w teście to reguła z pina, nie wartość wymyślona przez operatora. Pin `gra/src/main.ts` (commit 07d2fbd72), linie 7404-7405: `HP = zachowany % (newHp = round(newMaxHp * oldHp/oldMaxHp), min 1)`. Test (`e2e_zamiana_zranionej_jednostki_z_awansem_daje_hp_z_pinu`) bierze wejścia `newMaxHp` i `oldMaxHp` z wektorów pinu (`pin_max_hp`, parametry 20, bitwy 3), stosuje tę samą kolejność działań co pin (`newMaxHp * (oldHp / oldMaxHp)`, `js_round`, `max(1)`) i porównuje z wynikiem produkcyjnej zamiany (`set_replace_unit_state` + `replace_unit_with_defs`). Sprawdzono też, że scenariusz rozróżnia postęp (`assert_ne!` z wynikiem bez postępu).

Ryzyko: test nie wykonuje tekstu pina dla końcowego HP, tylko jego opisaną regułę. Jest to słabsze niż wektor wykonany w node. Akceptuję to jako notę na przyszłość, bez zmiany w tej rundzie.

### Zarzut 3. Nowe pola nie są ustawiane przez bitwę, dług zapisu z bitwy otwarty. Status: ODRZUCAM (zakres tematu).

Dowód: dispatch wprost zakazuje: „NIE ustawiaj tych pól w żadnym kodzie bitwy (to osobny temat) — tylko model i odczyt”. Operator nie dotknął kodu bitwy (commit zmienia tylko `playable.rs`, dwa testy, generator i fixture). Dług jest jawnie opisany w BLOKADY raportu operatora i w komentarzu do `PlayableReplaceUnit`, nie został ukryty.

Potwierdzenie stanu: w realnej grze HP po zamianie zranionej lub doświadczonej jednostki nadal nie uwzględnia awansu, dopóki nie powstanie temat zapisu postępu z bitwy. To jest prawdziwe ograniczenie, ale poza zakresem tego tematu. Zalecenie zarzutu (dodać wektory końcowego HP z pinu) należy do tematu zapisu z bitwy.

### Zarzut 4. Publiczne `set_replace_unit_state` nie odrzuca ujemnych wartości. Status: ODRZUCAM (dowód dla bitew), NIE_ZMIERZONO (dla parametrów).

Dowód dla `battles_survived`: w Rust `veteran_battles_won` (`rust-port/engine/src/domain/unit_health.rs:163-168`) zwraca `v.floor()` tylko dla skończonych wartości `> 0`, inaczej `0`. To jest odpowiednik web `veteranBattlesWon` (`gra/src/game/veteran.ts:95-98`: `Number.isFinite(v) && v > 0 ? Math.floor(v) : 0`). Ujemne wejście daje więc ten sam wynik HP co w web. Zapisanie ujemnej wartości nie zmienia zachowania gry.

Dla `parametry_bonus_proc`: NIE_ZMIERZONO. Nie sprawdzono, jak `unit_parametry_bonus_proc` i web traktują wartości ujemne, i nie ma testu na ujemne wartości. Odnotowane jako otwarty punkt o niskim priorytecie. Setter jest helperem scenariuszowym, nie ścieżką wejścia gracza. Dodanie walidacji wymagałoby ustalenia, czy web clampuje ujemne parametry, a to wykracza poza tę obronę.

### Zarzut 5. `skip_serializing_if` pomija `Some(0.0)`, round-trip nie jest bitowy. Status: PRZYJMUJĘ (nota, bez zmiany kodu).

Dowód: pominięcie `Some(0.0)` nie zmienia semantyki. Web czyta brak pola i `0` tak samo (`veteranBattlesWon`: `> 0` albo `0`), a Rust `veteran_battles_won` i `replace_max_hp` dają 0 bonusu dla `None` i `Some(0.0)`. Różnica dotyczy wyłącznie zapisu bajt-w-bajt, co dispatch dopuszcza (zgodność wsteczna = istniejące zapisy i fixture się nie zmieniają). Zachowanie jest opisane w komentarzu pola („Pomijane, gdy brak lub 0”).
