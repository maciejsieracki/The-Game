# 02a OBRONA OPERATORA — R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1 (runda 1, po ocenie Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1
GOAL: port C9 `_moveTargetForUnit` 1:1 z pinu `07d2fbd72` + wektory i weryfikacja sum; odpowiedź na zarzuty Evaluatora.
BAZA: `585bb48e0` (origin/rust-port/parity-v2); operator r1 = `a9c373159`; obrona = commit po nim (SHA niżej). Worktree detached. Bez push.
RUNDY: 1/5 (obrona)

## Odpowiedzi na zarzuty

| # | Zarzut | Decyzja | Dowód / zmiana |
|---|---|---|---|
| 1 | (niski) Generator to ręczna replika `_moveTargetForUnit`, nie wykonanie pinu | PRZYJMUJĘ (poprawka) | `p6_k5doc_geometry_gen.mjs` przepisany: pobiera `git show 07d2fbd72:gra/src/battle/battleScene.ts`, wyciąga ciało metody `_moveTargetForUnit` (od nagłówka `:11442` do `  }`) i wykonuje je przez `new Function`, bez przepisywania. `BF_COLS`/`BF_ROWS` parsowane z pina (`:661-662`, generator przerywa, gdy wartości inne niż 68/156). Wszystkie 7 oryginalnych wyników bez zmian (diff JSON: tylko nowy przypadek i pole `source`), więc replika operatora była zgodna z pinem. |
| 2 | (niski) SHA256SUMS niewymuszone przez test | PRZYJMUJĘ (poprawka) | Nowy test `vector_files_match_sha256sums` w `p6_k5doc_geometry.rs` uruchamia `sha256sum -c SHA256SUMS` (fallback `shasum -a 256 -c`) w katalogu wektorów. Test zielony. Mutacja: dopisanie spacji do `move_target.json` → test FAIL (`move_target.json: FAILED`, exit 101). Plik przywrócony (cmp OK). |
| 3 | (niski) Brak wektora C9: ujemne dr z clampem wiersza do 0 przy niezerowym dr | PRZYJMUJĘ (poprawka) | Dodany przypadek `clamp-zero-dr-ujemny-niezerowy`: `formation_offset=[0,-3]`, `col=10`, `row=1` → `expect_col=10`, `expect_row=0` (wynik z wykonanego pinu). Razem 8 przypadków (minimum 4). |
| 4 | (inf.) Mutacja (c) NIE_DOTYCZY dla C9, dispatch zakładał C7/C8 | PRZYJMUJĘ (stwierdzenie) | Ponowny odczyt pina `:11442-11448`: funkcja czyta wyłącznie `u.formationOffset`, `col`, `row`; nie ma parametru strony ani odwołania do strony. Mutacji (c) nie da się wstawić w portowany kod bez dodania parametru, którego pin nie ma. **Decyzja dla orkiestratora/FC**: uznać (c) za NIE_DOTYCZY dla tego zakresu (mutacje (a) i (b) dają FAIL). Operator nie zmienił kodu pod (c). |
| 5 | (inf.) C7/C8 martwe — potwierdzić | PRZYJMUJĘ (potwierdzone) | Własny `git grep`/odczyt pina `07d2fbd72`: `_doctrineMoveDest` wołany tylko z `:18063` (`_executeGroupDoctrineStep`) i `:18103` (`_executeSkirmishDoctrineStep`, wyłącznie skirmish). W `_executeGroupDoctrineStep`: `steady` zwraca `true` w `:18022-18025` (`_advanceStep`), a gałąź `aggressive` (`:18027-18053`) kończy się `return true` na każdej ścieżce przed `:18063`. Gałęzie `:17939` (steady → C7) i `:17948` (aggressive → C8) są więc nieosiągalne. C7 `_attackFormationRallyPoint` i C8 `_chargeMoveDest` = NIE_PORTOWANE (martwe) — zgodnie z dispatchem. |
| 6 | (inf.) Bramki odtworzone przez Evaluatora | PRZYJMUJĘ (potwierdzone) | Patrz sekcja BRAMKI niżej. |

## Zmiany w tej rundzie (allowlista)

- `rust-port/engine/tests/p6_k5doc_geometry_gen.mjs` — generator wykonuje ciało pinu (zarzut 1).
- `rust-port/engine/tests/p6_k5doc_geometry.rs` — test sum SHA-256 (zarzut 2), aktualizacja nagłówka.
- `rust-port/engine/tests/p6_k5doc_geometry_vectors/move_target.json` — przypadek 8 (zarzut 3), `source` oznaczone „(wykonane)".
- `rust-port/engine/tests/p6_k5doc_geometry_vectors/SHA256SUMS` — nowa suma `4da6bad72303f17c21baf18b027224beca2ad24f10842e73158fd4fc87b3f9a7  move_target.json`.
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1/02a-obrona.md` — ten raport.
- Brak zmian w `siege_tactics_doctrine_geometry.rs`, `mod.rs`, `gra/`, `siege_tactics_loop.rs`. `Cargo.lock` nie tknięty, nie commitowany.

## BRAMKI (po poprawkach, w `rust-port/engine`)

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p6_k5doc_geometry`: 4/4 OK (3 testy wektorowe/granic + `vector_files_match_sha256sums`)
- `cargo test --all-targets --no-fail-fast`: 0 FAILED, 0 błędów kompilacji (wszystkie `test result` bez `FAILED`; sumy: 3653 passed, 0 failed)
- Brak `#[ignore]`, asercje nieosłabione. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR=/tmp/claude-0/k5doc-geo-target-r2` (poza repo, do usunięcia po bramkach).

## MUTACJE

- (a) i (b) z r1: nie powtarzane w tej rundzie — funkcja `move_target_for_unit` i jej kod nie zmienione (diff pusty w `siege_tactics_doctrine_geometry.rs`); wyniki r1: FAIL (2 testy każda).
- (c): NIE_DOTYCZY (zarzut 4).
- Mutacja dodatkowa (nowa): zmiana `move_target.json` → FAIL testu sum (patrz zarzut 2).

## BLOKADY

1. Mutacja (c) — decyzja orkiestratora: NIE_DOTYCZY (brak strony w pinie `:11442-11448`).
2. C7 `_attackFormationRallyPoint` (`:17707`) i C8 `_chargeMoveDest` (`:17778`) — NIE_PORTOWANE, martwe (`_doctrineMoveDest` nieosiągalne dla steady/aggressive, `:18022-18035` → return przed `:18063`).
3. Cargo.lock untracked — nie commitowany.
4. Push nie wykonany (wymaga autoryzacji orkiestratora).

## NASTĘPNY KROK

Evaluator r2 (weryfikacja poprawek: generator wykonuje ciało pinu, test sum, przypadek 8) → Final Control. Orkiestrator: rozstrzygnąć mutację (c) jako NIE_DOTYCZY.

DEPLOY/PUSH: NIE WYKONANO
