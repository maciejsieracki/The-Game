STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-RANGED-DAMAGE-NAN-Q1
GOAL: Obrona Operatora r1 wobec 6 zarzutów Evaluatora (02-evaluator.md, commit 9414c713d). Każdy zarzut: PRZYJMUJĘ (poprawka/dowód/commit) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: jedna zmiana kodu (komentarze dokumentacyjne, bez zmiany zachowania) w rust-port/engine/src/domain/unit_power.rs. SHA commitu: patrz sekcja „SHA” niżej. Zakaz zmian asercji i zakres allowlisty zachowane. Cargo.lock nieskommitowany.
TESTY: cargo fmt --check (rust-port/engine) EXIT 0; git diff --check bez uwag. Zmiana jest wyłącznie komentarzem `///`, więc testy z r1 (lib 94, p6_ranged_damage_nan 7, formulas 8, petla 3, fieldpower 1, unit_power_maxnan 2, combat 7, siege_tactics_blow_full 3) nie były ponownie uruchamiane (NIE_ZMIERZONO ponownie; wynik r1 bez zmian).
BLOKADY: brak blokad technicznych. Jedna luka świadomie zostaje otwarta (zarzut 1, NIE_ZMIERZONO).
RUNDY: 1/5 (obrona w obrębie r1)
NASTĘPNY KROK: Evaluator r2 weryfikuje zarzuty 1-6 wg tej tabeli. Decyzja dla orkiestratora: zarzut 1 (wykonanie pętli dystansu z pinu w node) — wykonać w rundzie integracyjnej albo jako osobny temat, nie blokuje PASS tej paczki.
DEPLOY/PUSH: NIE WYKONANO (lokalny commit, bez push; zgodnie z dispatchem)

## Odpowiedzi na zarzuty

### Zarzut 1: testy combat.rs wyprowadzone z czytania kodu pinu, nie z wykonania resolveCombat w node; wektory pinu obejmują tylko rangedShotDamage
Werdykt: PRZYJMUJĘ (luka realna, bez poprawki w tej rundzie).
Dowód: generator (`p6_ranged_damage_nan_gen.mjs`) wykonuje z tekstu pinu tylko `rangeDamageTw`, `rangedShotDamage`, `rangedDamageMultFor`. Pętla dystansu w pinie (`combat.ts` ok. linii 1041-1060: `hpDef -= dmg`, `hpAtk -= dmg`) nie jest wykonywana w node. Testy `p6_ranged_damage_nan_roll_mniejsze_od_nan_to_pudlo`, `..._obrazenia_nan_zeruja_hp_jak_na_pinie`, `..._kontra_nan_zeruje_hp_jak_na_pinie`, `..._infinity_rozbija_jednostke` (`rust-port/engine/tests/p6_ranged_damage_nan.rs`) asertują zachowanie wyprowadzone z odczytu kodu pinu.
Zakres: NIE_ZMIERZONO dla zachowania `resolveCombat` na pinie w node. Rekomendacja: dodać harness node wykonujący pętlę dystansu z pinu (ten sam mechanizm stripTypeScriptTypes), jako osobny krok po r1.

### Zarzut 2: publiczna `unit_power::ranged_shot_damage` (i64) nadal zwraca 1 dla NaN; tylko testy; oznaczyć lub usunąć
Werdykt: PRZYJMUJĘ (oznaczenie w dokumentacji, zrobione w tym commicie).
Dowód wywołań (grep): definicja w `unit_power.rs`; w produkcji `src/` brak wołających. Wołają ją tylko testy: `p6_ranged_damage_nan.rs` (linie 97, 126, 128), `p6_repin_dystans_formulas.rs` (linie 54-140), `p6_repin_dystans_petla.rs` (linie 9, 199).
Zmiana: doc-komentarz `ranged_shot_damage` dopisuje „NIE UŻYWAĆ w produkcji” i wskazuje `ranged_shot_damage_f64` jako ścieżkę produkcyjną. Usunięcie/`#[deprecated]` odrzucone: `#[deprecated]` dałoby ostrzeżenia w testach p6_repin_* przy `-D warnings`, a usunięcie zmieniłoby asercje testów spoza allowlisty (zakaz).

### Zarzut 3: `RangedShot::damage` (i64) traci NaN/Inf; prawdziwa wartość w `damage_exact`; konsument logu/UI musi czytać `damage_exact`
Werdykt: PRZYJMUJĘ jako ostrzeżenie; ODRZUCAM jako defekt bieżącego kodu.
Dowód: w `rust-port/engine/src` nie ma konsumenta pola `RangedShot::damage` (grep: jedyny zapis to `combat.rs` przy `shots.push`; odczyty tylko w testach `p6_ranged_damage_nan.rs` i `p6_repin_dystans_petla.rs`). Pole ma komentarz w kodzie (NaN -> 0, Infinity -> i64::MAX, dokładna wartość w `damage_exact`). Zmiana typu pola na f64 wymagałaby edycji `p6_repin_dystans_petla.rs` (poza allowlistą).
Odnotowane do dokumentacji integracyjnej: każdy przyszły konsument logu/UI ma czytać `damage_exact`.

### Zarzut 4: dla skończonego raw > i64::MAX target_hp odejmuje dokładną wartość (zmiana); routing bez zmian
Werdykt: PRZYJMUJĘ jako zmianę zamierzoną, zgodną z pinem; bez zmiany kodu.
Dowód: pin `combat.ts` linie 1042 i 1060: `hpDef -= dmg` / `hpAtk -= dmg` — dmg niesaturowane. Rust r1: `defender.hp -= damage_exact` (f64 niesaturowane); poprzednio odejmowano `damage as f64` (saturowane do i64::MAX). Routing: rozbicie zależy od `hp <= 0`; dla HP mieszczącego się w zakresie gry (<< 9,2e18) oba warianty dają HP <= 0 dla raw > i64::MAX, więc decyzja o rozbiciu nie zmienia się. Ta różnica nie jest pokryta osobnym testem (NIE_ZMIERZONO dla przypadku HP >= 9,2e18, który w grze nie występuje).

### Zarzut 5: strażnik SHA-256 fragmentu pinu zapisano po pierwszym uruchomieniu generatora, nie wyliczono niezależnie; wykrywa dryf, nie dowodzi poprawności
Werdykt: ODRZUCAM część „nie wyliczono niezależnie”; PRZYJMUJĘ część „nie dowodzi poprawności”.
Dowód niezależnego wyliczenia: pliki pinu `07d2fbd72` pobrane przez `git show` do katalogu roboczego; funkcje `rangeDamageTw`, `rangedShotDamage` (`combat.ts`) i `rangedDamageMultFor` (`unit-power.ts`) wycięte przez awk (nie kodem generatora), `export ` zdjęte z pierwszej linii, skład jak w generatorze (`[f1, f2].join('\n') + '\n' + m`), hash node:crypto:
- fragment: `3a9325c769ab07605a52d4992cf15dfaa3441f15f5bc8b5d36b1fc832b187178` = EXPECT_FRAGMENT_SHA256 z generatora
- combat-params.json: `5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e` = EXPECT_PARAMS_SHA256
Oba skróty zgodne z niezależnym wyliczeniem.
Poprawność portu dowodzą wektory (`ranged.json`) wygenerowane przez wykonanie tekstu pinu (stripTypeScriptTypes), a nie hash. Hash to strażnik dryfu tekstu, nie dowód zgodności semantycznej.

### Zarzut 6: pełny `cargo test` nie uruchomiony; zostaje na rundę integracyjną
Werdykt: ODRZUCAM (zgodnie z dispatchem).
Dowód: dispatch, linia „Bramki”: „testy dotkniętych modułów + nowe (pełny cargo test wykona runda integracyjna)”. Operator uruchomił: fmt, clippy `--all-targets -D warnings`, `cargo test --lib` (94), wszystkie testy `p6_*` dotknięte zmianą i nowe `p6_ranged_damage_nan*`. Pełny cargo test pozostaje NIE_ZMIERZONO w tej rundzie.

## SHA
Commit obrony (komentarz w unit_power.rs + ten raport): patrz wynik `git rev-parse HEAD` w odpowiedzi orkiestratorowi (zapisany niżej po commicie).
