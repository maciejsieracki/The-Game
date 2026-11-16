# DISPATCH R-RUSTPORT-P6-K5DOC-T5A-KITE-ROZPOZNANIE (runda 1) — rozpoznanie STRZELEC-KITE (#257, K5DOC-T5a) przed kodem

DOMENA: engine Rust, ROZPOZNANIE tylko do odczytu. MODEL: HAIKU (Operator rozpoznania; zwykły temat, bez 3D).
BAZA: `origin/rust-port/parity-v2` = `2edc808d7`. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Nie pisz kodu i nie zmieniaj `rust-port/**`. Nie commituj nic poza raportem.

## CEL
Ustalić, co trzeba dopisać w Rust, żeby zrobić K5DOC-T5a (kite strzelca):
1. W pinie: `_rangedAction` (`gra/src/battle/battleScene.ts`, ok. l.6656), `_bestKiteShotStep` (wołanie ok. l.6698), `canShoot` (ok. l.6241), `meleeThreat` i warunki KITE. Lokalizacje: `git grep -n "_rangedAction\|_bestKiteShotStep\|meleeThreat\|canShoot" 07d2fbd72 -- gra/src/battle` — nie zgaduj.
2. W Rust: co już istnieje dla strzelca (`rust-port/engine/src/domain/siege_tactics_*.rs`, `ProdUnit`, `canShoot`/`siege_tactics_classify`, `_forwardCol`, helpery T4a `first_step_along_path_to_attack`/`step_toward`). Użyj `git grep` na `2edc808d7`.
3. Lista brakujących wejść (kształt funkcji, pola stanu), zależności od T4b (#313, w toku) i T5b (#260, wspólny `_firstStepTowardMelee`).
4. Proponowana allowlista i lista wektorów (każdy z `plik:linia` pinu) dla T5a.

## WYJŚCIE
Zapisz `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5A-KITE-ROZPOZNANIE/01-rozpoznanie.md` z sekcjami: pin (mapa funkcji z liniami), Rust (co jest / czego brakuje), zależności, proponowana allowlista, wektory, NIE_ZMIERZONO (co nie da się ustalić z odczytu). Na końcu: STATUS (PASS | BLOCK), jedna linia rekomendacji.

## NIE ROBIĆ
Nie edytuj kodu, nie uruchamiaj cargo, nie pushuj do parity.
