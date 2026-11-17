# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — Final Control r1

STATUS: FAIL (BLOCK INFRA: pełna bramka cargo niewykonana, dysk < 8 GB; kod bez zarzutów merytorycznych)
DOMAIN: GAME=nie (producent widoku/DTO mgły)
TEMAT: R-RUSTPORT-P4-1C-FOG-VIEW-R1
GOAL: producent `FogViewDto` z `PlayableState` dla aktywnego fotela `ME()` (widoczność z unią sojuszników, eksploracja per fotel, `fogOn`/`revealAllLand`) zgodny z pinem `07d2fbd72`.
ZMIANY/COMMIT: kod `a17f28d42`; łańcuch raportów `ae209859c` → `1e30517ba` → `f56b2b796` → ten raport (commit FC na `f56b2b796`).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja samodzielna FC

- Baza (DODATEK r2): `2760b4f0c`. `git log --oneline 2760b4f0c..f56b2b796` = 4 liniowe commity (a17f28d42, ae209859c, 1e30517ba, f56b2b796) — ancestry liniowa, baza jest przodkiem.
- Allowlista (`git diff --stat 2760b4f0c f56b2b796`): `engine/src/domain/state.rs` (+335), `engine/tests/p4_1c_fog_view.rs` (+375), `engine/tests/p4_1c_fog_vectors/gen.mjs` (+403), `.../vectors.json` (+32464), 3 raporty runs. Brak `Cargo.lock`, `gra/`, view-model, renderer. W zakresie.
- `rustfmt --edition 2021 --check src/domain/state.rs tests/p4_1c_fog_view.rs` (checkout `f56b2b796`): EXIT 0.
- `node tests/p4_1c_fog_vectors/gen.mjs --check`: `OK: 7 przypadkow zgodnych`, EXIT 0 (wektory odtwarzalne z pinu, strażniki SHA zielone).
- `#[ignore]` w `p4_1c_fog_view.rs`: brak.
- DYSK: `df -h /` na starcie FC = 6,4 GB, po checkoucie = 5,3 GB. Próg dispatchu 8 GB. Zgodnie z dispatchem bramek cargo (clippy, `--test p4_1c_fog_view`, `--all-targets --no-fail-fast` w engine i renderer, mutacje) NIE uruchomiono.

## Orzeczenia zarzutów

1. [BLOKUJĄCY, INFRA] Brak pełnej bramki cargo (EXIT 0) — **NAPRAW**. Kryterium końca „BRAMKI (EXIT 0)” nie jest spełnione przez żaden etap (Operator, Evaluator, Obrona, FC); FC potwierdza dysk 5,3–6,4 GB < 8 GB. Nie jest to wada kodu, ale bez bramki nie wolno wystawić PASS. Wymagane w r2 (bez zmian kodu, baza `a17f28d42`/`f56b2b796`): po zwolnieniu dysku do ≥ 8 GB — `cargo fmt --check` i `cargo clippy --all-targets -- -D warnings` w engine i renderer, `cargo test --test p4_1c_fog_view`, `cargo test --all-targets --no-fail-fast` w obu crate'ach, odtworzenie mutacji (a), (b), (c).
2. [NOTA] Brak wołającego produkcyjnego — **ODDAL** (jako zarzut wobec tematu). Zakres dispatchu to sam producent; wpięcie (droga DTO do renderera L6/#308, `ViewerDto.fog_active`, PRIO-3D-10/11) to osobny temat. Orkiestrator zakłada R-RUSTPORT-P4-1C-FOG-WIRE i wpis w REJESTR-RUST (decyzja techniczna orkiestratora, nie właściciela).
3. [NOTA] Z-FOG-2 bez wektora z pinu (pin ma jeden fotel) — **ODDAL**. Zachowanie dla jednego fotela zgodne z pinem (7 wektorów); per-fotel wynika z `exploredByHuman.get(ME())` w pinie. Orkiestrator wpisuje Z-FOG-1..4 do REJESTR-RUST jako decyzje techniczne, nie zmierzony parytet.

Jeden NAPRAW → werdykt FAIL.

## Uwagi do integracji
- Trailer commitów `f56b2b796` (i ewentualnie wcześniejszych) zawiera nazwę modelu, wbrew #289 — do skorygowania przy integracji (squash/reword) przez orkiestratora.
- Decyzje człowieka: brak (wszystkie kwestie są techniczne lub INFRA).

TESTY: rustfmt EXIT 0; gen.mjs --check EXIT 0; cargo — NIE WYKONANO (dysk 5,3 GB < 8 GB).
BLOKADY: INFRA dysk.
NASTĘPNY KROK: r2 tego samego ID po zwolnieniu dysku ≥ 8 GB — wyłącznie bramki na `a17f28d42`, bez zmian kodu; potem Evaluator/FC.
