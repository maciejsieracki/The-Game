STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-UNIT-REPLACE-Q1
GOAL: port web „Zastąp” (unit-replace-cost/context/execute, ai-unit-replace-plan) do Rust domain/unit_replace.rs z wektorami z uruchomionego weba (origin/main cffe39cb9), pełny koszt rekrutacji (Pieniądz + surowiec z puli państwa), gracz i AI.
ZMIANY/COMMIT: f1d3a5f71 (baza a006068f1, gałąź wf/R-RUSTPORT-REPIN-UNIT-REPLACE-Q1). Pliki: rust-port/engine/src/domain/unit_replace.rs (nowy), domain/mod.rs (+1 linia), tests/p6_repin_unit_replace_pure.rs, tests/p6_repin_unit_replace_execute.rs, tests/p6_repin_unit_replace_vectors/ (generator, wektory JSON, shimy), dyspozycje/rust-port/p6/P6-REPIN-UNIT-REPLACE.md. Commit NIE wypchnięty.
TESTY (ZMIERZONO):
- rustfmt --check (3 nowe pliki): exit 0
- cargo clippy --all-targets -- -D warnings: exit 0
- cargo test --lib: 28 passed, 0 failed
- cargo test --test p6_repin_unit_replace_pure: 7 passed, 0 failed
- cargo test --test p6_repin_unit_replace_execute: 1 passed, 0 failed
- Wektory: cost=80, afford=84, execute=21, plan=5, reserve=27, cap=10, armyKeep=144, merge=4, maxFraction=9. Generator: esbuild 0.24.2 bundle realnych modułów web (unit-replace-cost/execute/context + ai-unit-replace-plan z przepiętymi importami na shimy armyClassOfTyp i shouldAIPurchaseUnit; shim shouldAIPurchaseUnit zgodny logicznie z ai.ts:7332 — ZMIERZONO).
- NIE_ZMIERZONO: pełny cargo test wszystkich binarek (brak zmian danych i pinów istniejących testów).
BLOKADY: brak blokad realizacji. Luki zmierzone i opisane w P6-REPIN-UNIT-REPLACE.md §3: L-1 tabela awansów INFANTRY w rust-port/engine/data/units.json (21 z 23 wpisów brak; plik poza allowlistą, temat danych), L-2 klucz ai_zamiana_jednostek_limit_udzial brak w rust ai-params.json (domyślne 0,1 zgodne), L-3 brak wpięcia w turę/komendy (dług do serii W), L-4 etykiety UI nie portowane.
ODPOWIEDZI NA ZARZUTY RUNDY 1:
1. Zakres niezrealizowany — PRZYJMUJĘ. Dodano domain/unit_replace.rs, wektory z weba i testy p6_repin_unit_replace_* (commit f1d3a5f71). Kryteria końca: koszt, brak zasobów, execute, plan AI, rezerwa AI, limit i klasa armii pokryte wektorami.
2. Bramki nie uruchomione — PRZYJMUJĘ. Uruchomione i zielone (sekcja TESTY).
3. BLOCK bez realnej blokady — PRZYJMUJĘ. Status w rundzie 2 to PASS-WITH-NOTES; luki rozstrzygnięte założeniem i opisane (nie BLOCK).
4. Pomiar niepełny (brak tabeli, INFANTRY „niezweryfikowana”) — PRZYJMUJĘ. Tabela odpowiedników jest w P6-REPIN-UNIT-REPLACE.md §1. Tabela awansów sprawdzona porównaniem wartości obu units.json: 21 różnic, wszystkie to brak celu w Rust (web niepusty, Rust „—”). Rust nie ma stałej tabeli awansów w ai_era_unit_promotion.rs (moduł ma tylko trait AiEraPromotionDeps). Zgodność build_replace_availability_ctx z webem: ODPOWIEDNIK ISTNIEJE (recruitment.rs:1393) i jest tożsamościowy z `{...params}` (ZMIERZONO).
5. Raport bez SHA — PRZYJMUJĘ. SHA commitu: f1d3a5f71. Worktree wf_5a05f11b-117-1 i commit 0179fbdcd z rundy 1 nie są używane w tej rundzie.
RUNDY: 2/5 (runda 1: BLOCK z pomiarem; runda 2: implementacja)
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja wektorów (ponowne wygenerowanie z origin/main), bramki, wiersze tabeli w P6-REPIN-UNIT-REPLACE.md. Osobne tematy: R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1 (L-1, L-2: units.json, ai-params.json, pin EXPECTED_TABLE), wiring do tury/komend (seria W).
DEPLOY/PUSH: NIE WYKONANO
