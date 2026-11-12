STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-HARNESS-R2-Q1
GOAL: (1) przypadki graniczne roll*100 == hitPct oraz tuz ponizej/powyzej w wektorach pinu, mutacja `roll <= hit_pct` ma dawac FAIL; (2) zdarzenia strzalow z zerem/-0 w hitPct, damage, targetHp; (3) liczniki pokrycia przeliczane w tescie Rust; straznik SHA-256 bez zmiany tekstu pinu; vectors.json <= 1 MB.
BAZA: 3efeecfa6 (detached, FC COMBAT-HARNESS r1). Pin 07d2fbd72 tylko do odczytu (git show).
ZMIANY/COMMIT: allowlista: rust-port/engine/tests/p6_combat_harness.rs, rust-port/engine/tests/p6_combat_harness_gen.mjs, rust-port/engine/tests/p6_combat_harness_vectors/vectors.json, dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-HARNESS-R2-Q1/01-operator-r1.md. combat.rs NIE zmieniony (brak rozbieznosci). Cargo.lock nie commitowany. SHA: w raporcie orkiestratora (commit na gałęzi roboczej).
  - gen: dodane zero-HP przypadki (applyZeroHp: hpDef = dmg pierwszego strzalu ATK, trafienie wymuszone rzutem 0 -> targetHp = +0); liczniki shotsRollJustBelow / shotsRollJustAbove / shotsTargetHpZero / shotsNegZeroAnyField; tekst pinu i straznik SHA nietkniete (fragment 700d1623..., params 5cc90d60...).
  - rust: recount() liczy roll_eq, roll_just_below, roll_just_above, target_hp_zero, neg_zero_any_field; plikowe `counts` NIE sa czytane (usunieta asercja rownosci z plikiem); progi na przeliczeniu (eq>=20, below>=20, above>=20, targetHp zero>=10); asercja neg_zero == 0 z komentarzem o zalozeniach.
TESTY:
  - node p6_combat_harness_gen.mjs: straznik OK; 700 przypadkow, 1113 strzalow; shotsRollEq 41, JustBelow 46, JustAbove 38, TargetHpZero 26, NegZeroAnyField 0; plik 638 KB.
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --lib: 94 passed
  - p6_combat_harness: 2 passed
  - combat: 7 passed
  - p6_ranged_damage_nan: 7 passed
  - p6_repin_dystans_petla: 3 passed
  - p6_repin_dystans_formulas: 8 passed
  - mutacja (przejsciowa, przywrocona git checkout): combat.rs:1184 `roll < hit_pct` -> `roll <= hit_pct` => p6_combat_harness FAIL przy przypadku 3 (HP atakujacego 180.5 != pin 190.5). Granica roll == hitPct pokryta; combat.rs po przywroceniu czysty.
BLOKADY: -0 w zdarzeniach strzalow jest nieosiagalne w petli pinu (dowod, NIE_ZMIERZONO na poziomie danych): hitPct = clamp(raw, hit_min=15, hit_max=75) albo NaN, wiec nigdy 0; damage = max(1, round(...)) albo NaN, wiec nigdy 0; targetHp = hp - dmg z hp > 0 i dmg >= 1 (lub NaN/Inf), a w IEEE x - y = -0 wymaga x = -0, czego petla nie dopuszcza. Wejscia -0 (hpDef, atkPanc0 itd.) nie trafiaja do zdarzen. Zero dodatnie (+0) w targetHp jest pokryte (26 zdarzen). Zero w hitPct nie wystepuje; zero w damage wystepuje tylko przy chybieniu (damage_exact = 0.0), pokryte bit-w-bit.
RUNDY: 1/5
NASTEPNY KROK: Evaluator R2 (weryfikacja mutacji i recount w tescie); Final Control; integracja przez orkiestratora (nie Operator).
DEPLOY/PUSH: NIE WYKONANO (brak pusha, brak integracji; rust-port/parity-v2 i origin/main nietkniete)
