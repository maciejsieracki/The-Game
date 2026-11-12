STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-POWER-MAXNAN-Q1
GOAL: Obrona Operatora (runda 1) na cztery zarzuty Evaluatora/FC wobec kodu ca23053a; odpowiedź na każdy zarzut: PRZYJMUJĘ albo ODRZUCAM z dowodem.
ZMIANY/COMMIT: brak zmian w kodzie w tej rundzie. Kod operatora: ca23053a32e287062deacb0428ddef61e664bb18. Raport r1: 51aaeba5eeaf2492c7214f52837c86f0945c0ce6. Niniejszy plik: commit obrony na gałęzi detached w worktree (SHA w raporcie wyjściowym orkiestratora). Brak push.
TESTY: nie uruchamiano ponownie (runda obrony dotyczy argumentacji i odczytu kodu/pinu, nie zmiany kodu). Odczyt: `git show 07d2fbd72:gra/src/game/combat.ts` linie 440–517, 1035–1059, 1149–1181; `ca23053a:rust-port/engine/src/domain/unit_power.rs` linie 58–100; `ca23053a:rust-port/engine/src/domain/combat.rs` linie 1163–1203; `ca23053a:rust-port/engine/src/domain/siege_tactics_blow.rs` linie 180–193 (js_max/js_min).
BLOKADY: brak nowych. Zarzut 1 jest uznany jako rozbieżność poza allowlistą (patrz niżej), nie jako blokada tego tematu.
RUNDY: 1/5 (obrona w rundzie 1)
NASTĘPNY KROK: Evaluator/FC ponownie oceniają po tej obronie. Zalecany osobny temat dla ranged_shot_damage (zwrot i64 → f64 wraz z callerami w combat.rs) i ewentualnie wektor -0 w generatorze.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. ranged_shot_damage: NaN i Inf (unit_power.rs ok. l. 82) — PRZYJMUJĘ (rozbieżność potwierdzona, naprawa poza allowlistą)

Dowód z kodu:
- Pin, `rangedShotDamage` (combat.ts:495): `return Math.max(1, Math.round(raw));`
- Rust, `ranged_shot_damage` (unit_power.rs): `js_round(raw).max(1.0) as i64`.
- Dla raw = NaN: `js_round(NaN)` = NaN, a `f64::max` ignoruje NaN, więc Rust zwraca 1, a pin zwraca NaN.
- Dla raw = +Inf: Rust `as i64` nasyca do i64::MAX, a pin zwraca Infinity.

Zarzut jest trafny. Samo `ranged_shot_damage` nie zostało zmienione w ca23053a (poprawnie, bo zmiana wymaga zwrotu f64). Callery w combat.rs:1173 i :1203 deklarują `let mut damage = 0;` i odejmują `damage as f64` od HP, więc zmiana typu zwracanego wymaga zmiany combat.rs, czyli poza allowlistą tego tematu. Zgadzam się z oceną, że nie blokuje to tematu GOAL (który dotyczy `ranged_shot_accuracy` i funkcji z wektorami w tej rundzie), i że właściwa droga to osobny temat. Nie zmieniam kodu w tej rundzie, żeby nie przekroczyć allowlisty.

Zakres rozbieżności: dotyczy tylko wejść NaN/Inf, których nie ma w danych gry przy skończonych statystykach. Dla skończonych wartości wyniki są zgodne (istniejące wektory przechodzą).

### 2. hit_chance_tw(NaN) zmienia zachowanie w combat.rs:1170 — PRZYJMUJĘ jako uwagę (zgodne z pinem; brak testu na poziomie combat.rs)

Dowód zgodności:
- Pin, `hitChanceTw` (combat.ts:446): `return Math.max(TW.hit_min, Math.min(TW.hit_max, raw));` dla NaN zwraca NaN.
- Pin, użycie (combat.ts:1040, 1058, 1149, 1171): `if (roll < hitPct)` dla NaN daje false (pudło).
- Rust, `hit_chance_tw` (unit_power.rs): `js_max(min, js_min(max, raw))` dla NaN zwraca NaN.
- Rust, combat.rs:1170 i :1200: `let hit = roll < hit_pct;` dla NaN daje false (pudło).

Czyli po zmianie zachowanie NaN jest zgodne z pinem (pudło). Wcześniej, przy `f64::min/max`, NaN dawało `hit_max`, czyli rozbieżność z pinem, którą ten temat usuwa. Ta zmiana jest celowa, a nie regresja. Test na poziomie combat.rs nie został dodany, bo combat.rs jest poza allowlistą; to jest świadoma luka, nie błąd. Wartości skończone bez zmian (istniejące wektory przechodzą).

### 3. js_max/js_min nie rozróżniają -0 od +0 — PRZYJMUJĘ jako uwagę (bez wpływu na wyniki; kod bez zmian)

Uzasadnienie braku wpływu:
- Pin `Math.max(-0, +0)` = +0; Rust `(-0.0).max(0.0)` może zwrócić któregokolwiek. Różnica dotyczy tylko znaku zera.
- Trzy wywołania: (a) `hit_chance_tw` zwraca `js_max(min, ...)`, gdzie `min` z `tw_hit_params()` jest dodatni (hit_min > 0), więc wynik ±0 nie wystąpi; (b) `range_damage_tw` zwraca `js_max(1.0, ...)`, więc wynik zawsze >= 1 lub NaN; (c) `ranged_shot_damage` kończy się `.max(1.0)`, więc wynik zawsze >= 1 lub NaN.
- W porównaniu `roll < hit_pct` (combat.rs) ±0 są równe, więc znak zera nie zmienia decyzji trafienia.
- Jedyne miejsce, gdzie -0 może przejść dalej, to `ranged_shot_accuracy(melee, missile)` przy obu argumentach zerowych o różnych znakach; wynik trafia wtedy do `hit_chance_tw` jako dodawanie do dodatniej bazy, co też nie zmienia wyniku.

Nie dodaję wektora -0 w tej rundzie. Generator (`p6_unit_power_maxnan_gen.mjs`) nie generuje -0 w SPECIAL, co jest świadomą lukę testową; nie wpływa na wynik. Ewentualna poprawka helpera należy do `siege_tactics_blow.rs` (poza allowlistą tego tematu).

### 4. Pełny `cargo test --test 'p6_*'` nie wykonany; combat.rs max/min/clamp NIE_ZMIERZONO — ODRZUCAM jako zarzut blokujący; PRZYJMUJĘ jako znany NIE_ZMIERZONO

Dowód:
- Dispatch (`00-dispatch.md`, sekcja Bramki) wprost stanowi: „pełny cargo test wykona runda integracyjna”. Pełny `p6_*` nie jest bramką tej rundy operatora. Rundy integracyjne robią to zgodnie z dispatchem.
- Operator uruchomił bramki wymagane dispatchem: `cargo fmt --check` EXIT 0, `cargo clippy --all-targets -- -D warnings` EXIT 0, `cargo test --lib` 88 passed, testy dotknięte (p6_repin_dystans_* i p6_siege_tactics_blow_full) oraz nowy `p6_unit_power_maxnan` 2 passed (raport 01-operator-r1.md).
- combat.rs (linie 258, 299, 456, 461, 474) jest poza allowlistą (dispatch: allowlista = unit_power.rs, siege_tactics_blow_full.rs, p6_*unit_power*, p6_unit_power_maxnan*). Zakres to osobny temat, zgodnie z GOAL („NIE zmieniaj funkcji bez odpowiednika w pinie”, zakres ograniczony do unit_power).
- Zarzut sam przyznaje, że bramka pełnego testu należy do rundy integracyjnej. Przyjmuję to jako NIE_ZMIERZONO w tej rundzie.

## Podsumowanie dla Evaluatora/FC

- Zarzut 1: przyjęty jako rozbieżność poza allowlistą; zalecany osobny temat (zwrot f64 + callery w combat.rs).
- Zarzut 2: przyjęty jako uwaga; zachowanie NaN jest zgodne z pinem (pudło przez `roll < NaN`).
- Zarzut 3: przyjęty jako uwaga; bez wpływu na wyniki; kod bez zmian.
- Zarzut 4: pełny `p6_*` odłożony do integracji zgodnie z dispatchem (NIE_ZMIERZONO w tej rundzie); combat.rs poza zakresem.
- Brak zmian kodu w tej rundzie. Kod ca23053a pozostaje kodem do integracji.
