STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JSROUND-MINUSZERO-Q1 (#231 / #166)
GOAL: behawioralne pokrycie galezi -0 w js_round (combat.rs) bit-w-bit (to_bits) wobec pinu.
ZMIANY/COMMIT: ocena commitu 98dc92b9a (baza f7baa3848). Diff: tylko tests/p6_js_round_minus_zero.rs + 01-operator-r1.md (allowlista OK). Zero zmian w src.
TESTY (odtworzone przez Evaluatora):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -D warnings: EXIT 0
- cargo test --test p6_js_round_minus_zero: 5/5 PASS, 0 ignored
- cargo test --lib: 118 passed, 0 failed, 0 ignored
- Mutacja (combat.rs:1378 -0.0 -> 0.0): 3/5 FAIL (below_half, at_negative_half, negative_zero_input), 2 kontrolne PASS; plik przywrocony (cmp OK).
- Pin: combat.ts:1159 finalDmg = Math.round(rawDmg * ctrAtkVsDef) bez max(1,..); damageTw(1,0,0,..)=1, wiec raw=1 i x=ctr. Wolajacy w Rust: resolve_melee_phase (combat.rs:1466).
BLOKADY: brak. Brak #[ignore], brak oslabionych asercji, brak zaleznosci od W8.
ZARZUTY (uwagi, nie blokujace):
1. Wartosci oczekiwane zahardkodowane (z recznej weryfikacji node), nie z generatora wektorow pinu; niezgodne z literalem "wektory pinu", ale 5 punktow jest jednoznacznych.
2. -0 jest obserwowalny wylacznie przez bit znaku MeleeStep.damage (hp -= -0 bez zmiany); test sprawdza wlasnie to pole - zgodne z dispatchem.
3. Brak przypadku x = -1.5/-0.6 (wynik niezerowy ujemny) i dodatnich bliskich zera (0.4 -> +0); gałąź out==0 && sign_negative dla x w (0,..) pokryta tylko posrednio.
RUNDY: 1/5
NASTEPNY KROK: Obrona, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
