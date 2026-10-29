STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1
GOAL: Niezależny pomiar batch 3 K04 (8 jednostek, pin edb8fb56): harnessy, mutacje, gate'y, regresja K04.
ZMIANY/COMMIT: allowlista zachowana; zmiana tylko w `dyspozycje/rust-port/p5/P5-8-K04B.md` (sekcja pomiarów) i ten raport. Baza: commit 57efd4b3 (detached). SHA: patrz sekcja końcowa odpowiedzi. Brak zmian w kodzie i w `gra/**`.
TESTY:
- `npm ci`: EXIT 0 (log: scratchpad/k04b/npmci.log).
- `npm run typecheck`: EXIT 0.
- `npm run check`: EXIT 0. self-test 33 poz. / 15 neg., błędów 0; no-logic-imports 165 plików, trafień 0; verify-pin-copies pin=edb8fb56, 435 plików, niezgodnych 0.
- `run-k04b-units.mjs --pin-dir <pin>/gra`: EXIT 0, PRZYPADKI=98 OK=98 ROZNICA=0. Operator r1 podawał 97; rozbieżność liczby przypadków NIE_ZMIERZONO (wynik bez różnic).
- `mutate-k04b-units.mjs --pin-dir <pin>/gra`: EXIT 0, MUTACJI=36 WYKRYTYCH=36 PRZEZYTYCH=0.
- `run-k04-units.mjs`: EXIT 0, przypadków 22, OK 21, ROZNICA 0, ROZNICA_ZALOZONA 1 (K04-Z2).
- `run-k04-units-b2.mjs`: EXIT 0, 17/17.
- Pin: `git archive edb8fb56 gra/src gra/data` do scratchpada poza repo.
BLOKADY: brak. Uwaga procesowa: pierwsze wywołanie harnessa bez `--pin-dir` lub z katalogiem `gra/` wskazującym zły poziom kończyło się błędem ścieżki (użycie: katalog zawierający `gra/src` i `gra/data`; podano `<pin>/gra`, poprawne jest `<pin>`). Po poprawce wszystko zielone.
NIE_ZMIERZONO: zgodność wartości DTO z silnikiem Rust (K04B-Z1, Z2, Z5); rozbieżność 97 vs 98 przypadków (przyczyna nieznana).
RUNDY: 1/5 (pomiary Operatora-pomiary, ta sama runda implementacyjna).
NASTĘPNY KROK: Evaluator r1 na ten sam ID, następnie Final Control. Batch 4 poza zakresem.
DEPLOY/PUSH: NIE WYKONANO
