STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1
GOAL: wektory z pinu dla fazy zwarcia resolveCombat (generator, vectors.json, straznik SHA, liczniki > 0); bez portu (#136).
ZMIANY/COMMIT: kod+wektory 9687a72b8 (nad b9b180873); raport obrony 263d627c5; baza cfa1edd31 jest przodkiem 263d627c5 (is-ancestor OK). Diff cfa1edd31..263d627c5 = 5 plikow: p6_combat_melee_gen.mjs, p6_combat_melee_vectors/vectors.json, p6_combat_melee.rs, 01-operator-r1.md, 02a-obrona.md (allowlista + raporty runu). Bez src/, gra/, Cargo.*.
TESTY (zweryfikowane samodzielnie na 263d627c5):
- generator node: vectors.json identyczny (cmp), fragmentSha256 cab87df7... bez zmian; liczniki cases=500 steps=1716 stepsMelee=1272 stepsCharge=444 casesRouted=150 casesLimitReached=208.
- vectors.json input.*: 0 null, 0 surowych liczb niecalkowitych (skan 500 przypadkow); NaN/Infinity/-Infinity/-0 jako napisy (344/258/258/201).
- stepsNaNHitPct 90/1716 (5,2%), poprzednio 600/1880.
- cargo fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --lib 100 passed; p6_combat_melee 4 passed, 0 ignored; pelny cargo test --no-fail-fast: 3265 passed, 0 failed, 1 ignored (istniejacy).
ROZSTRZYGNIECIE ZARZUTOW:
1 (null/NaN/-0 w input): ODDAL - naprawione encRec, zmierzone 0 null.
2 (surowe floaty): ODDAL - naprawione, 0 surowych niecalkowitych.
3 (test nie sprawdza wejsc): ODDAL - dodany melee_vectors_inputs_have_no_null_and_no_raw_floats; straznik SHA po stronie Rust to stala wpisana na sztywno (ograniczenie, nie blad: Rust nie ma combat.ts).
4 (32% NaN): ODDAL - 5,2%, liczniki niepustosci > 0.
5 (wejscia wstrzykiwane): ODDAL - zakres dispatchu, #135 otwarte.
NIE_ZMIERZONO Evaluatora (pelny cargo test): zmierzone teraz, patrz wyzej.
BLOKADY: brak. Poza zakresem: port i porownanie (#136), wejscia przed petla (#135), float_roundtrip (#139).
RUNDY: 2/5 (obrona po r1)
NASTEPNY KROK: integracja orkiestratora (wip/ przesunac na commit raportu FC), potem #135/#136.
DEPLOY/PUSH: NIE WYKONANO
