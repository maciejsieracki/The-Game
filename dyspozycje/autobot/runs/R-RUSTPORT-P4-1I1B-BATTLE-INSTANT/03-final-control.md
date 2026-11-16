# 03 — Final Control r1: R-RUSTPORT-P4-1I1B-BATTLE-INSTANT

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I1B-BATTLE-INSTANT
GOAL: ścieżka „Pomiń” (E4): port `computeInstantResult` (`battleScene.ts:20389-20593`), reguła `wallBreached` przy
machinie (`:3720-3722`), `result.log` i wejście E4 do `BattleOutcomeDto`.
ZMIANY/COMMIT: oceniany HEAD obrony `6e70d41e85af6a540ca27167919d8ad3f309d08d` (gałąź
`wip/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT-obrona-r1`); ten raport = jeden commit FC na lokalnej gałęzi `fc/1I1B-r1`
(SHA w raporcie końcowym Workflow). Kod FC: brak zmian.
TESTY: §2 (odtworzone samodzielnie).
BLOKADY: brak blokad tematu. Zależności zapisane (§3, zarzut 3): brak produkcyjnego resolvera pary do portu
`resolveCombat`; brak wołającego w produkcji (#113/#246/#248).
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` + wpis D1 do `REJESTR-RUST.md` i temat kolejki (§3).
DEPLOY/PUSH: NIE WYKONANO

## 1. Baza, ancestry, allowlista

- Baza dispatchu: `origin/rust-port/parity-v2` = `05e4df502`. `git merge-base --is-ancestor 05e4df502 6e70d41e8` = TAK;
  `c773dec50` (Operator r1) jest przodkiem `6e70d41e8` = TAK. Łańcuch: `991556084` (kod) → `c773dec50` (raport) →
  `6e70d41e8` (obrona) → commit FC (tylko ten plik).
- Uwaga dla integracji: `origin/rust-port/parity-v2` przesunął się od bazy na `b6aa05024`; `05e4df502` jest jego
  przodkiem, więc integracja wymaga merge (nie FF) i pełnego `cargo test` po merge.
- `git diff --stat 05e4df502 6e70d41e8`: 13 plików, wszystkie w allowliście (`siege_tactics_instant.rs` nowy, `mod.rs`
  +1 linia modułu, `siege_tactics_outcome.rs` tylko E4 — `InstantSkipData::from_skip`, `OutcomeError::InstantWallMismatch`,
  `build_battle_outcome_instant`, dokumentacja; E1–E3 bez zmian semantyki; `view-model/src/battle.rs` tylko komentarz
  doc pola `log`; nowe `tests/p4_1i1b_battle_instant.rs`, `view-model/tests/battle_outcome_e4.rs`; `runs/…/**`).
- `gra/`, `Cargo.lock`: brak w diffie. `git diff --check` czysty. Brak nowego `#[ignore]`.

## 2. Bramki odtworzone przez FC

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w `/tmp` poza repo
(usunięty po bramkach).

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --check` | EXIT 0 |
| engine `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine `cargo test --all-targets --no-fail-fast` | EXIT 0 — 486 binarek, 3568 passed, 0 failed, 1 ignored (istniejący `tests/p6_order_lane.rs:1530`, spoza diffu) |
| view-model `cargo fmt --check` / `clippy --all-targets -D warnings` / `test --all-targets --no-fail-fast` | EXIT 0 / EXIT 0 / EXIT 0 (100 passed, 0 failed) |
| Generator `gen-p4-1i1b-vectors.mjs` na tekście pinu z `git show 07d2fbd72` | `OK 10 wektorów`; `p4-1i1b-vectors.json` i `p4-1i1b-inputs.json` identyczne bajt w bajt (`cmp`) |
| `PIN_VECTORS` w teście vs wyjście generatora | równość JSON 10/10 (porównanie Python `==`) |
| Mutacje `mut-p4-1i1b.sh` M1–M9 | wszystkie FAIL (rc=101); po przywróceniu 11/11 ok |

Przegląd kodu względem pinu (`:20389-20593`, `:3715-3748`): kolejność fal i par (`lA[i % lA.length]`,
`lD[i % lD.length]` na indeksach stanu — równoważne referencjom JS), pominięcie `hp <= 0`, `cu.health = hp`,
`defOnWall`/`defTerrain`, `hasMur`, `cityElevationTerrain`, `structBonusPctForPair`, fortyfikacja przed brodem,
bród/brzeg, opcje resolvera, ocalali `hp > 0`, werdykt `hpA >= hpD`, linia końca `:20591`, reguła machiny
`:3720-3722` i filtr `!dead` — zgodne 1:1.

## 3. Orzeczenia zarzutów Evaluatora

| # | Zarzut | Orzeczenie | Uzasadnienie / dowód |
|---|---|---|---|
| 1 | Brak wektora obrońcy w brodzie; mutacja E1 przeżywa | **ODDAL** (naprawione przez Obronę) | Wektor pinu `obronca_w_brodzie_kara` (dDef 9 i 12.375, teren `Rzeka`); test pełnego porównania wektorów + `wektor_obronca_w_brodzie`; M7 (= E1) daje FAIL w przebiegu FC. |
| 2 | Brak wektora miasta bez muru; mutacja E2 przeżywa | **ODDAL** (naprawione) | Wektor `miasto_bez_muru_wzgorze` (`isCityDefense`, `wallProc = 0`, wzgórze): `structureDefBonusPct = 0`, override 1; M8 (= E2) FAIL w przebiegu FC. |
| 3 | D1: `InstantPairResolver` zamiast `combat::resolve`; zależność do rejestru/kolejki | **ODDAL** (D1 przyjęte przez FC technicznie) | `combat::resolve` (`combat.rs:381`) to model zbiorczy bez opcji pary i bez `res.log`; podpięcie dałoby wynik niezgodny z pinem (zasada 9/11 parytetu). Wstrzyknięcie z rejestracją KAŻDEGO argumentu pary jest właściwym kształtem do czasu portu `resolveCombat`. Wpis rejestru i temat kolejki są poza allowlistą Operatora/FC — gotowy tekst w `02a-obrona.md` §2 **do naniesienia przez orkiestratora przy integracji** (D1 do `REJESTR-RUST.md`; temat `R-RUSTPORT-COMBAT-RESOLVE-PAIR`, zależny od #135/#167, odblokowuje #113/#246/#248). |
| 4 | `result.log` bajt w bajt tylko dla linii końca | **ODDAL** (zapis NIE_ZMIERZONO, bez zmian kodu) | Port przenosi `res.log` w kolejności pinu (sprawdzone wektorami) i linię `:20591` bajt w bajt; treść linii par zależy od nieportowanego `resolveCombat` — NIE_ZMIERZONO, jawnie zapisane w kodzie, DTO i raportach. Nie jest wadą tego tematu. |
| 5 | Stub `toCombatUnit` w generatorze bez weterana | **ODDAL** (zabezpieczone) | Generator odrzuca pola spoza odwzorowania stubu, więc wektor nie może po cichu przestać być porównaniem z pinem; regeneracja przez FC = identyczne pliki. Po stronie Rust działa prawdziwy `to_combat_unit`. |
| 6 | Dwa źródła `siege_wall_col` / nieużyte `wall_ever_breached` | **ODDAL** (naprawione) | `InstantSkipOutcome.siege_wall_col` + `OutcomeError::InstantWallMismatch` w `build_battle_outcome_instant` (oblężenie i `wallBreached` vs `skip.wall_ever_breached`); test `e4_rozbiezne_zrodla_muru_to_blad`; M9 FAIL. |
| — | Weryfikacja Evaluatora | (informacja) | Potwierdzona niezależnie (§2). |

Brak orzeczeń NAPRAW i DO DECYZJI CZŁOWIEKA. Werdykt: **PASS-WITH-NOTES** (noty = zależności z zarzutów 3–4 do
naniesienia w rejestrze/kolejce przez orkiestratora oraz merge zamiast FF na przesunięty `parity-v2`).
