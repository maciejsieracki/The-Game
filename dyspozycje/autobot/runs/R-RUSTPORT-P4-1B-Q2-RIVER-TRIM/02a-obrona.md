STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-Q2-RIVER-TRIM
GOAL: port 1:1 `trimMediumTailAlongMain` (gen-helpers.ts:7623-7634) i `trimMediumRenderPathAtMain` (:8194-8203) z pinu 07d2fbd72 do `rivers_a/render_trim.rs` z wektorami pinu.
ZMIANY/COMMIT: tylko ten plik raportu (allowlista `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-Q2-RIVER-TRIM/**`); kod bez zmian (operator 32c282015, evaluator ea61d34bf).
TESTY: patrz niżej (cargo test --test p4_1b_river_trim EXIT 0; mutacje produkcyjne powtórzone przez obronę = FAIL).
BLOKADY: brak. Wołający produkcyjny: NIE_ZMIERZONO (P4-1B-Q3).
RUNDY: 1/5 (obrona po Evaluatorze r1, werdykt PASS-WITH-NOTES)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

# Obrona Operatora — odpowiedzi na zarzuty Evaluatora (r1)

Baza obrony: `ea61d34bf` (rodzic `32c282015`, przodek `1b8b67173` = origin/rust-port/parity-v2).

## Zarzut 1 — brak wołającego produkcyjnego
**ODRZUCAM (jako wadę; uwaga zgodna z dispatchem).** Dispatch, kryterium końca 4: „Brak wołającego
produkcyjnego: zapisz jako NIE_ZMIERZONO (wołający w Q3)”. Zapisano tak w 01-operator-r1.md.
`trim_medium_tail_along_main` jest `pub(crate)` właśnie po to, by M07C (`finalizeMediumPath`,
gen-helpers.ts:8148, `rivers_c.rs`) mógł go użyć; `rivers_c.rs` jest poza allowlistą tego tematu.

## Zarzut 2 — `node:module.stripTypeScriptTypes` (eksperymentalne, Node 22+)
**ODRZUCAM (jako wadę).** Dowód: bramki Rust czytają wyłącznie zacommitowany `vectors.json`;
`gen.mjs` służy tylko do regeneracji/audytu i działa na obecnym Node `v22.23.4` (Evaluator odtworzył
`vectors.json` bajt w bajt). Alternatywy (tsc/esbuild) wymagałyby zależności npm spoza allowlisty.
Ryzyko przyszłej wersji Node jest jawnie opisane w nagłówku `gen.mjs` (linia 4) i dotyczy tylko
regeneracji, nie parytetu.

## Zarzut 3 — mutanty w teście są lokalnymi kopiami
**ODRZUCAM (jako wadę; test jest uzupełnieniem, nie jedynym dowodem).** Test
`czulosc_mutanty_rozjezdzaja_sie_z_wektorami` dowodzi, że ZBIÓR WEKTORÓW rozróżnia mutanty
(≥10 różnic dla `||`, ≥5 dla progu 2) — czyli że wektory nie są „trywialnie zielone”. Czułość na
kodzie produkcyjnym potwierdzono osobno trzykrotnie: Operator r1, Evaluator r1 oraz teraz obrona:

| Mutacja `render_trim.rs` (obrona, ea61d34bf) | Wynik `cargo test --test p4_1b_river_trim` |
|---|---|
| bez zmian | `ok. 4 passed; 0 failed` (EXIT 0) |
| l.30 `&&` → `||` | `FAILED. 3 passed; 1 failed` |
| l.27 `while out.len() >= 3` → `>= 2` | `FAILED. 3 passed; 1 failed` |

Plik przywrócony z kopii; `git status` czysty poza nieśledzonym `rust-port/engine/Cargo.lock`
(niecommitowany). `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po teście.

## Punkt 4 — weryfikacja Evaluatora
Przyjęte do wiadomości, bez zastrzeżeń; zgodne z dowodami powyżej.
