STATUS: BLOCK
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-K5DOC-T6-JAZDA (runda r6, weryfikacja integracji, bez zmian kodu)
GOAL: potwierdzić ancestry, zakres diffu i bramki EXIT 0 na 1af81a8c3 przed FF parity-v2.
BAZA: 1af81a8c3 (detached). Parity origin/rust-port/parity-v2 = 625624d97 (bez zmian).

ANCESTRY:
- git merge-base --is-ancestor 87829df94 HEAD: EXIT 0
- git merge-base --is-ancestor 625624d97 HEAD: EXIT 0

ZAKRES (git diff --stat 625624d97 HEAD):
- rust-port/engine/src/domain/mod.rs (+1)
- rust-port/engine/src/domain/siege_tactics_cavalry.rs (+466, NOWY)
- rust-port/engine/tests/p6_k5doc_cavalry.rs (+276, NOWY)
- rust-port/engine/tests/p6_k5doc_cavalry_gen.mjs (+411, NOWY)
- rust-port/engine/tests/p6_k5doc_cavalry_vectors/vectors.json (+400876, NOWY)
- katalog run: 01-operator-r1.md, 02a-obrona.md, 03-integracja-r5.md
- Uwaga: dispatch mowi o "7 plikach T6"; faktycznie kod i testy to 5 plikow (vectors.json liczony jako 1), plus 3 pliki raportow. Poza allowlista nic nie zmieniono.

BRAMKI (rust-port/engine; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0):
- df -h / przed bramkami: 9.3 GB na starcie (powyzej progu 8 GB)
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --test p6_k5doc_cavalry: EXIT 0, 10 passed, 0 failed, 0 ignored
- cargo test --all-targets --no-fail-fast: NIE ZAKONCZONO (BLOCK dysku)
  Przebieg: start przy 9.3 GB wolnego; podczas kompilacji testow civ-engine wolne miejsce spadalo: 8.2, 8.0, 7.7, 7.4 GB (ok. 01:46 UTC).
  Orkiestrator przerwal proces (kill, exit 144) przed wyczerpaniem dysku i usunal wlasny katalog targetu w scratchpadzie. Po sprzataniu: 9.4 GB wolnego.
  Wynik pelnego testu: NIE_ZMIERZONO (brak passed/failed/ignored dla --all-targets).

TESTY: fmt EXIT 0, clippy EXIT 0, p6_k5doc_cavalry 10/10 EXIT 0; pelny test: brak wyniku.
MUTACJE: nie dotyczy (runda r6 nie obejmuje mutacji).
BLOKADY: pelna bramka nie mogla sie zakonczyc przy dysku spadajacym ponizej 8 GB w trakcie kompilacji. Wymagany ponowny przebieg przy wolnym dysku >= 8 GB przez caly czas (bez ruszania dzialajacych procesow innych worktree).
RUNDY: r6 (dodatek integracyjny); werdykt do decyzji orkiestratora.
NASTEPNY KROK: ponowic pelny cargo test --all-targets --no-fail-fast na 1af81a8c3 przy df >= 8 GB; po wyniku Ewaluator i FC.
DEPLOY/PUSH: NIE WYKONANO (brak pushu do parity, brak FF, kod nie zmieniany).
