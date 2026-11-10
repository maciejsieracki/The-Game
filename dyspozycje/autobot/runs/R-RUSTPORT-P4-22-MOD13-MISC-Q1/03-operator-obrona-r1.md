STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-22-MOD13-MISC-Q1
GOAL: Paczka MOD-13 portu do Rusta, 1:1 z webem `edb8fb56` (wioska-oboz, siegeCampModels, siegeMarker, siegeCampSync CPU, rangeOverlay + map/territory-border, tradeRoutesOverlay, robloxCity tylko `addRobloxSkyDecor`). Nakładki są buforami CPU.
ZMIANY/COMMIT: baza = commit Operatora `03c8e0ee` (stan odtworzony przez `git checkout --detach 03c8e0ee`). Zmienione pliki: `dyspozycje/rust-port/p4/P4-22-MOD13-MISC.md` (§6 R1 poprawione, dodane R5 i R6), `rust-port/renderer/src/models/misc/overlay.rs` (+1 test), ten raport. Wszystko w allowliście. Raport Evaluatora (`9b574147`) nie jest częścią tego commita, bo jest na równoległej gałęzi worktree.
TESTY: zob. niżej.
BLOKADY: brak.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na uwagi Evaluatora r1 (wszystkie nieblokujące)

1. **Płachta kopalni / właściciel samplera reliefu: PRZYJMUJĘ.** Dowód: `P4-4-MODEL-CATALOG.md` §4.2 wiersz 3 przypisuje `teren-gory-wzgorza` do MOD-03 (`<renderer>/decor/**`, P4.17). `P4-12-MOD01-CORE.md` Z2 mówi to samo. Poprawka: P4-22 §6 R1 nie proponuje już nowego tematu. Zapisuje zależność integracyjną od P4.17: podpiąć sampler jako `range::ReliefSource` i dodać wektor `relief=real` na mapie z `Wzgorza`/`Gory`.
2. **Duplikacja `toFixed`: PRZYJMUJĘ jako dług. ODRZUCAM przeniesienie w tym temacie.** Dowód: `src/core/**` nie należy do allowlisty tego tematu (dispatch, ALLOWLISTA), bo jest własnością P4.12. Poprawka: dodałem test `overlay::tests::to_fixed_d3_equals_core_to_fixed3`. Porównuje on `js_to_fixed(x,3)` z `js_to_fixed3(x)` na siatce 1/256 w przedziale [−7, 7], czyli na wszystkich remisach dziesiętnych (odd/16), oraz na przypadkach brzegowych (±0, −4.44e-16, 1.0005). Dzięki temu późniejsza konsolidacja jest mechaniczna. Opis w P4-22 §6 R5.
3. **Współdzielony scratch: PRZYJMUJĘ.** Incydent opisałem w P4-22 §6 R6. Zgodność treści z pinem tamtego agenta oznaczam jako NIE_ZMIERZONO, bo katalogu już nie ma. Orkiestrator ma potwierdzić pin i SHA-256 wektorów tamtego tematu. Wektory MOD-13 od tego katalogu nie zależą: Evaluator zregenerował je z czystego `git archive` i dostał identyczne SHA-256.
4. **Założenie Z1: bez zmian.** Evaluator je potwierdził.
5. **NIE_ZMIERZONO (GPU, sprite ⚔ D-MOD-6): PRZYJMUJĘ bez zmian.** Te punkty są już w P4-22 §5 i w R3.

## TESTY (crate `rust-port/renderer`, świeży `CARGO_TARGET_DIR` w scratchpadzie)

```
cargo fmt --all -- --check                                   FMT EXIT=0
cargo clippy --locked --all-targets -- -D warnings           CLIPPY EXIT=0
cargo clippy --locked --all-targets --features gpu -- -D warnings  CLIPPYGPU EXIT=0
cargo test --locked --all-targets                            TEST EXIT=0
  lib: test result: ok. 9 passed (wcześniej 8; nowy to_fixed_d3_equals_core_to_fixed3 ... ok)
  misc_web_parity: test result: ok. 9 passed
  FAILED/panicked w logu: 0
```
