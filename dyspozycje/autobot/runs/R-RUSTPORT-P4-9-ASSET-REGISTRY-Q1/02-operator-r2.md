STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-9-ASSET-REGISTRY-Q1
GOAL: RR-T6. Rejestr zasobów renderera i test regresyjny „N tur nie zwiększa zasobów”. Tylko CPU i std, bez `unsafe`, bez nowych zależności. Runda 2: naprawa zarzutów 1 i 2 Evaluatora r1.

ZMIANY-COMMIT (worktree `wf_d19f2ede-7f8-3`, odłączony; stan odtworzony z `cd37db5e`, rodzic r1 `0a496f67`; bez push):
- `9b5b69ea` (kod): `rust-port/renderer/tests/assets_registry.rs`. Testy `registry_replace_creates_new_before_freeing_old` i `owned_replace_creates_new_before_freeing_old_and_keeps_shared_old` sprawdzają kolejność na stanie rejestru: `peak_live` bufora rośnie 1 → 2, a `new.index() != old.index()` (bez ponownego użycia slotu). W `src/assets/fake.rs` zmieniono tylko komentarz modułu: dziennik nie dowodzi kolejności. Implementacja rejestru bez zmian.
- Commit dokumentacji (ten raport + `dyspozycje/rust-port/p4/P4-9-ASSET-REGISTRY.md`):
  - poprawione §2.6 i §4.1,
  - w §2.4 opisano odkładane usuwanie w `emit`: to różnica względem DOM i nie ma na nią testu,
  - nowa §6a z pełnymi logami bramek i mutacji E1/E2.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Na mutancie E1 test `registry_replace_…` daje EXIT=101 (`peak_live` left 1, right 2). Na mutancie E2 test `owned_replace_…` daje EXIT=101 (ta sama asercja). Pełne logi są w §6a.2. Pierwszy przebieg E2 we wspólnym targecie z E1 użył nieaktualnej binarki, więc go odrzucono i powtórzono w czystym katalogu. Opisano to w §6a.2.
2. PRZYJMUJĘ. §2.6 i §4.1 już nie przedstawiają dziennika `FakeGpu` jako dowodu kolejności. Raport r1 zawierał błędne twierdzenie, ten raport je prostuje.
Uwagi: emit opisany w §2.4. Pule i miejsce dokumentu zostawiam do decyzji integracji, bez zmian.

TESTY (zacommitowany `9b5b69ea`, po `cargo clean`, pełne wyjście w §6a.1):
- fmt --check → EXIT=0
- clippy --locked --all-targets -D warnings → EXIT=0
- test --locked --all-targets → EXIT=0 (`assets_nturns` 6/6, `assets_registry` 14/14, `cpu_sanity` 1/1)
- grep unsafe → EXIT=1 (brak trafień)
- `git diff --stat 0a496f67 HEAD` dla Cargo.toml/lock, lib.rs, engine, src-tauri, gra i .github jest pusty.
Katalogi targetu usunięte.

BLOKADY: brak. NIE_ZMIERZONO jak w r1 (§5). W r2 nie uruchamiano `clippy --features gpu` ani `+1.87.0`.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) weryfikuje `9b5b69ea` i commit dokumentacji, w tym powtórzenie mutacji E1/E2.
DEPLOY/PUSH: NIE WYKONANO
