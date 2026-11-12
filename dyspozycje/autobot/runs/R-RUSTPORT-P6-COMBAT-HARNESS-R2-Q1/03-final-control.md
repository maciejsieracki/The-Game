STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-HARNESS-R2-Q1
GOAL: wektory graniczne roll==hitPct (i +/-1 ULP), zdarzenia z zerem w targetHp, recount w Rust zamiast czytania counts z vectors.json
ZMIANY/COMMIT: kod do oceny be4682480 (ancestor bazy 3efeecfa6: TAK, merge-base --is-ancestor). Diff vs baza: tests/p6_combat_harness.rs, p6_combat_harness_gen.mjs, p6_combat_harness_vectors/vectors.json (638 KB <= 1 MB), runs/<ID>/01,02,02a. combat.rs bez zmian, gra/ i data/** nietkniete, Cargo.lock niecommitowany, brak #[ignore]. Allowlista zachowana. SHA koncowy (commit FC): w raporcie orkiestratora.
TESTY (EXIT 0, odtworzone samodzielnie): fmt --check; clippy --all-targets -D warnings; --lib 94 passed; p6_combat_harness 2; combat OK; p6_ranged_damage_nan 7; p6_repin_dystans_petla 3; p6_repin_dystans_formulas 8. Mutacja combat.rs:1217 roll<hit_pct -> roll<=hit_pct: p6_combat_harness FAIL (panic l.130); combat.rs przywrocony, drzewo czyste.
WERDYKTY ZARZUTOW:
1. -0 w zdarzeniach strzalow (brak pokrycia): ODDAL. Nieosiagalne w petli pinu (hitPct w [15,75] lub NaN, damage>=1 lub NaN, hp>0 => hp-dmg nie daje -0); asercja ==0 pilnuje zalozenia; +0 w targetHp pokryte (>=10). Pokrycie -0 = NIE_ZMIERZONO_ALE_NIEOSIAGALNE.
2. Liczniki 1e-9 zamiast ULP: ODDAL (naprawione w obronie: is_ulp_below/above przez to_bits, 31/34 >= 20, generator zsynchronizowany).
NAPRAW: brak.
DO DECYZJI CZLOWIEKA: brak.
BLOKADY: brak
RUNDY: 1/5 (Operator r1 + obrona + Evaluator r1 + FC)
NASTEPNY KROK: integracja orkiestratora (sprawdz merge-base kodu operatora), READY_FOR_DEPLOY wystawia orkiestrator
DEPLOY/PUSH: NIE WYKONANO
