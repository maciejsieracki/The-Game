STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1
Final Control zwrócił DECISION_REQUIRED wyłącznie z powodu luki: round-trip 1:1 (typed -> Value == raw) działa
tylko dla 7 plików cywilizacji, bo tylko `civilizations.rs` ma `Serialize`; pozostałe 22 z 29 plików wymagają zmiany
`src/data/**` (poza allowlistą tematu). Orkiestrator sprawdził, czy to decyzja produktowa: NIE — plan (P3.5–P3.7)
już wymaga przeniesienia 1:1 wszystkich plików, więc kierunek jest rozstrzygnięty; brakuje tylko osobnego tematu
w innym zakresie plików. Rozstrzygnięcie administracyjne: (1) zintegrować `f3cbbf04` (9 testów: ID/liczności/hash 29/29,
brak NAPRAW), (2) luka jako osobny temat P3.15 (Serialize + round-trip dla 22 plików, `deny_unknown_fields` tam,
gdzie bezpieczne), uruchamiany PO zamknięciu P3.14, bo oba dotykają `src/data/*`.
INTEGRACJA: rebase na 667f1743, `cargo test --offline` EXIT=0, 278 passed, 0 failed (269 + 9). Wypchnięte na `rust-port/parity-v2`.
Uwaga: na pinie są 29 plików JSON (nie 27 jak w dyspozycji; zgodne z P1-12).
RUNDY: 2/5. DEPLOY/PUSH: push na gałąź kodu wykonany; deploy NIE.
