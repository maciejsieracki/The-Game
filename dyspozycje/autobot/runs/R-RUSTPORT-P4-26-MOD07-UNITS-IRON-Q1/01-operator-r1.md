# 01 — Operator, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1
GOAL: Port modeli jednostek MOD-07 Żelazo do Rust 1:1 z kodem web edb8fb56 (8 plików web + buildGaesatae/buildSoldurii/buildCatapult z units.ts, 24+1 rekordów units.json), usunięcie wszystkich stubów NotYetPorted w unit_core (w tym `falanga`) bez zmiany sygnatur publicznych; parzystość bitowa PL/EN × 2 kolory właściciela; trygonometria wyłącznie przez jsmath.
ZMIANY/COMMIT: allowlista — src/models/units_zelazo/** (12 plików, 8 821 linii), src/models.rs (+1), unit_core/{registry,category,model}.rs (miejsca stubów + wariant Prim::Zelazo), tests/units_zelazo_web_parity.rs, tests/fixtures/units_zelazo/** (2,20 MB, sha256 cc657f0f…c28c76), tests/unit_core_{model_rule,web_parity}.rs (liczniki), tests/units_{kamien,braz}_web_parity.rs (wymuszony match; O4 poza dosłowną allowlistą — patrz dokument §3.4), dokument dyspozycje/rust-port/p4/P4-26-MOD07-UNITS-IRON.md, ten katalog runu. SHA: commit w worktree (patrz git log gałęzi worktree).
TESTY: fmt EXIT=0; clippy EXIT=0; clippy --features gpu EXIT=0; cargo test --locked --all-targets EXIT=0 (25 celów, 154 passed, 0 failed); units_zelazo parity 121 przypadków, 272 333 wartości bitowo, 0 rozjazdów; mutacje 31/31 EXIT=0 (v1 30/31: M12 mutant równoważny, zastąpiony, log zachowany). Logi: logi/.
BLOKADY: brak. Uwagi: O4 (odwrócona asercja stubu falanga w units_kamien_web_parity.rs, wymuszona celem), Z1–Z11 w dokumencie; NIE_ZMIERZONO: wygląd na GPU.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ocena O4 i założeń Z1–Z11, powtórzenie bramek).
DEPLOY/PUSH: NIE WYKONANO
```
