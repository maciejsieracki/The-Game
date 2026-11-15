STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3
GOAL: MOD-14 cz. 3 (jednostki i nakladki bitwy 3D) - port 1:1 do `rust-port/renderer/src/battle/` (pin `edb8fb56`).
ZMIANY/COMMIT: brak zmian w kodzie. Jedyny plik to ten raport (allowlista `dyspozycje/autobot/runs/R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3/**`).
RUNDY: 1/5 (wywolanie "impl", dispatch z DODATKIEM r2 z 15.11, commit `336af8cd9` na `claude/rust-sivvrn`)
DEPLOY/PUSH: NIE WYKONANO

## Powod BLOCK: zakres tego dispatchu jest juz wykonany i zintegrowany na bazie

Baza: `origin/rust-port/parity-v2` = `95930b446` (`git merge-base --is-ancestor 7817ef0c HEAD` -> EXIT 0).

Dowody (komendy uruchomione w worktree `wf_102d919b-3d8-1`):

1. Kod czesci 3 jest w historii bazy:
   - `git merge-base --is-ancestor e8458ac81 HEAD` -> EXIT 0 (impl r1: `battle::units`, 1230 jednostek, 160 ruchow rozstawienia, 4 mury, paski/pierscienie/strzalki/duchy, 0 roznic; wektory z weba `edb8fb56`)
   - `git merge-base --is-ancestor a0f334be7 HEAD` -> EXIT 0 (pomiary r1: mutacje 43/43, bramy 1.87.0/1.97.0)
   - `git merge-base --is-ancestor bb74ff9db HEAD` -> EXIT 0 (raport Final Control: `STATUS: PASS`, RUNDY 1/5)
2. W bazie sa juz `rust-port/renderer/src/battle/units.rs` (1890 linii), `rust-port/renderer/tests/battle3d_units.rs`, `tests/fixtures/battle3d/{gen_units.ts,build_units.mjs,units.json,mutate_units.py}` oraz raporty `runs/…-Q3/{01-operator-r1.md,02-operator-pomiary-r1.md,03-final-control.md,dowody/}`.
3. Dokument `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md` ma juz sekcje czesci 3 (§19-§28), a takze czesci 4 (§29-§38) i 5 (§39-§50), w tym §48 „Zamkniecie MOD-14”.
4. Po integracji czesci 3 kod `units.rs` i `battle3d_units.rs` zostal dalej zmieniony przez tematy REPIN (`git log -- rust-port/renderer/src/battle/units.rs`):
   `c88f96c2c` REPIN-3D A1 (2026-11-03), `026d5b45d` REPIN-3D A2 (2026-11-04), `8db7a9d04` REPIN-3D A4 (2026-11-04; wektory czesci 3 `units.json` zregenerowane na `origin/main 86d510c66`).
5. Na bazie testy battle3d przechodza (rustc stable, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, target poza repo, usuniety po przebiegu):
   `cargo test --locked --test battle3d_units --test battle3d_field --test battle3d_siege_wall --test battle3d_dynamics --test battle3d_picking`
   -> battle3d_units 9 passed, battle3d_field 5, battle3d_picking 8, battle3d_siege_wall 3, battle3d_dynamics 5; 0 failed; EXIT=0.
   `sha256sum -c tests/fixtures/battle3d/MANIFEST.sha256` -> wszystkie OK, EXIT=0.

## Dlaczego nie wykonano ponownie portu

Ponowny port czesci 3 „od zera” wg pinu `edb8fb56` nadpisalby kod i wektory przepiete przez REPIN-3D A1/A2/A4 na nowszy web (`origin/main 86d510c66`). To byloby cofniecie zintegrowanej pracy, a nie dostarczenie GOAL. Dispatch nie wskazuje zadnej brakujacej rzeczy wzgledem stanu bazy; jego tresc (r1) jest z 2026-10-29, a DODATEK r2 (15.11) zmienia tylko modele i baze.

## Wymagane od orkiestratora (bez pytania ABC z mojej strony)

- Zamknac temat jako juz wykonany (Final Control PASS, `bb74ff9db` w `parity-v2`) i poprawic rejestr, albo
- jesli celem jest cos nowego (np. ponowna weryfikacja czesci 3 po REPIN, parytet z nowym pinem, brakujacy symbol), wydac dispatch z konkretnym, nowym GOAL i kryteriami, ktorych baza jeszcze nie spelnia.

TESTY: jak w pkt 5 powyzej. Pelne bramy (fmt, clippy z/bez `gpu`, `cargo test --all-targets`): NIE_ZMIERZONO w tym wywolaniu, bo nie ma zmian kodu.
BLOKADY: dispatch nieaktualny - zakres zrealizowany i zintegrowany na bazie.
NASTEPNY KROK: decyzja orkiestratora (zamkniecie tematu albo nowy dispatch z nowym GOAL).
