STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-HARNESS-Q1
GOAL: Obrona Operatora r1 na zarzuty Evaluatora r1 (02-evaluator.md, b9d38b521). Każdy zarzut: PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: baza d71939b6e (Operator r1). Commit obrony: patrz SHA w raporcie orkiestratora. Allowlista: rust-port/engine/tests/p6_combat_harness.rs, p6_combat_harness_gen.mjs, p6_combat_harness_vectors/vectors.json, dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-HARNESS-Q1/**. combat.rs NIEZMIENIONY (mutacje przywrócone przez git checkout). Cargo.lock nieskomitowany (usunięty).
TESTY (CARGO_TARGET_DIR w scratchpad, usunięty po bramkach):
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --lib: EXIT 0, 94 passed
  - cargo test --test p6_combat_harness: EXIT 0, 2 passed
  - cargo test --test combat / p6_ranged_damage_nan / p6_repin_dystans_petla / p6_repin_dystans_formulas: EXIT 0, wszystkie passed
  - Generator: `node p6_combat_harness_gen.mjs` dwa razy, vectors.json bajt-w-bajt identyczny (cmp). Straznik SHA fragmentów pinu bez zmian: 700d16235700836e4c5eb9e49d697556e9e1bbe21331c98dd1d535a314bd7837.
  - Nowe liczniki (przeliczone w Rust i zgodne z plikiem): cases 700, shots 1164 (było 1156, bo dochodzą przypadki graniczne), shotsRollEq 41, shotsHitNaNPct 187, shotsNaNDamage 25, shotsInfDamage 21, casesNaNHp 64, casesMinusInfHp 54, casesRouted 142.

---

## Zarzut 1: luka czułości na roll == hitPct
DECYZJA: PRZYJMUJĘ.
POPRAWKA: generator (`p6_combat_harness_gen.mjs`) dla co 7. przypadku (i % 7 === 3) wykonuje przebieg probe (rng = 0), który podaje hitPct kolejnych strzałów (hitPct zależy tylko od wejść, nie od losowań). Dla pierwszych strzałów losowanie dobierane jest po ULP tak, że `(d*100) === hitPct` (tryb eq), `<` (lt) lub `>` (gt), cyklicznie. Pin liczy `roll = rng()*100` i `roll < hitPct`, więc eq musi dać pudło, lt trafienie, gt pudło.
DOWÓD: shotsRollEq = 41 (test wymaga >= 20). Mutacja `let hit = roll < hit_pct;` -> `roll <= hit_pct;` (obie linie, ATK i DEF) w combat.rs: `p6_combat_harness_wektory_pinu_zgodne` FAIL. Mutacja przywrócona (git checkout). Poprzednio ta sama mutacja dawała PASS (zarzut potwierdzony w r1).

## Zarzut 2: GOAL w całości niespełniony (combat::resolve nie jest porównywany)
DECYZJA: ODRZUCAM zmianę kodu w tej rundzie. Fakt zarzutu PRZYJMUJĘ: GOAL dispatchu w brzmieniu „combat::resolve” nie jest spełniony dosłownie.
DOWÓD:
  - `combat.rs:319` `resolve_combat` to rozwiązanie siłowe jednostek (`effective_strength`, `loss_fractions`, `apply_loss`); nie ma w nim losowań RNG ani pętli dystansu.
  - `combat.rs:379` `pub fn resolve(input) -> CombatResult { resolve_combat(input) }` — jest owijką na tę samą funkcję.
  - Pętla „Phase 0: Ranged” z pinu jest portowana wyłącznie jako `combat.rs:1059` `ranged_phase::resolve_ranged_phase`; komentarz w kodzie wprost mówi „Faza zwarcia nie jest portowana”.
  - Dopisanie pętli dystansu do `resolve` byłoby NOWĄ funkcjonalnością gry (zmiana wyniku bitew), a nie „poprawką rozbieżności” wymaganą przez dispatch („Rozbieżność Rust↔pin = popraw combat.rs”). Dispatch ma też osobny temat decyzji gameplay (temat „DECYZJA GAMEPLAY: faza zwarcia DYSTANS (resolve_combat)”).
  - Dlatego porównanie jest z jedynym istniejącym portem tej pętli. Zapisuję to jako NIE_ZMIERZONO (raport r1 już to deklarował). Jeśli orkiestrator chce test na `resolve`, wymaga to osobnego tematu po decyzji gameplay.

## Zarzut 3: liczniki pokrycia czytane z pliku, nie przeliczane
DECYZJA: PRZYJMUJĘ.
POPRAWKA: w `p6_combat_harness.rs` funkcja `recount(cases)` przelicza wszystkie liczniki z przypadków (cases, shots, shotsHitNaNPct, shotsNaNDamage, shotsInfDamage, shotsRollEq, casesNaNHp, casesMinusInfHp, casesRouted). Test wymaga, by plikowe `counts` były równe przeliczeniu (`assert_eq!`), a progi (>= 20/5/50) sprawdza na wartościach przeliczonych. Zmanipulowany counts wywołuje FAIL; zmanipulowane przypadki zmieniają przeliczenie.
DOWÓD: test zielony z przeliczeniem; osobnej mutacji pliku counts NIE_ZMIERZONO (nie wykonano).

## Zarzut 4: znak zera w zdarzeniach strzałów gubiony przez String(-0)
DECYZJA: PRZYJMUJĘ częściowo (naprawa mechanizmu + zmierzona luka pokrycia).
POPRAWKA: w generatorze 10 szablonów `${hitPct}`, `${dmg}`, `${hpDef}`, `${hpAtk}` w logu pinu przechodzi przez `__z(x)` (String(x), a dla -0 zwraca "-0"). Zmiana dotyczy wyłącznie formatowania logu; straznik SHA sprawdza tekst pinu PRZED tą zmianą (700d1623..., bez zmian). Parser odczytuje "-0" jako -0. Porównanie w Rust jest bit-w-bit (`same`), więc różnica znaku w zdarzeniach jest już wykrywana.
DOWÓD (zmierzony):
  - grep po vectors.json: 0 wystąpień "-0" w hitPct, damage i targetHp zdarzeń strzałów.
  - Mutacja w combat.rs: `hit_pct` raportowane jako -0.0 dla hit_pct == 0.0 -> test nadal PASS. Czyli w wektorach NIE MA zerowego hitPct, więc ścieżka znaku zera w zdarzeniach nie jest pokryta.
  - NIE_ZMIERZONO: nie zbadano, czy pin może wyprodukować -0 lub 0 w hitPct/damage/targetHp w osiągalnych wejściach (np. przez clamp w hitChanceTw/rangedShotDamage). Bez tego dowodu nie rozszerzam wektorów o te przypadki.
  - Zakres naprawy: wartości końcowe HP były i są porównywane bit-w-bit; po tej zmianie także zdarzenia.

## Zarzut 5: wejścia przed pętlą wstrzykiwane, ammo/maxRounds tylko całkowite
DECYZJA: ODRZUCAM.
DOWÓD:
  - Zakres zadeklarowany jako NIE_ZMIERZONO punkt (2) w raporcie Operatora r1 i w nagłówku testu („modyfikatory civ/budynków/teren przed pętlą (wejścia są wstrzykiwane)”). Dispatch celuje w pętlę dystansu; modyfikatory przed pętlą (civ, budynki, teren, resolveAmmo, rout) to osobne porty, nie rozbieżność pętli.
  - Typy Rust: `RangedSide.ammo: i64` (test: `as_i64()`), `RangedPhaseInput.max_rounds: u32` (test: `as u32`). NaN/Infinity nie mieszczą się w tych typach, więc nie da się ich porównać bez zmiany typów API; to ograniczenie typu, nie defekt harnessu. Zakres zadeklarowany jako NIE_ZMIERZONO.

---

## Podsumowanie dla orkiestratora
  - Zarzut 1: PRZYJĘTY, naprawiony, udowodniony mutacją (FAIL).
  - Zarzut 2: ODRZUCONY w zakresie zmiany kodu (combat::resolve nie zawiera pętli dystansu; port jest w ranged_phase); fakt NIE_ZMIERZONO.
  - Zarzut 3: PRZYJĘTY, naprawiony (przeliczanie w Rust).
  - Zarzut 4: PRZYJĘTY częściowo: mechanizm naprawiony, ale wektory nie zawierają zerowych zdarzeń (0 przypadków "-0"); luka zmierzona i nazwana NIE_ZMIERZONO.
  - Zarzut 5: ODRZUCONY (zakres i typy zadeklarowane).
NASTĘPNY KROK: Final Control (Sonnet) na commit obrony; decyzja o nowym temacie dla combat::resolve (zarzut 2) i pokryciu zerowych zdarzeń (zarzut 4) po stronie orkiestratora.
DEPLOY/PUSH: NIE WYKONANO (push i integracja zakazane dispatchem).
