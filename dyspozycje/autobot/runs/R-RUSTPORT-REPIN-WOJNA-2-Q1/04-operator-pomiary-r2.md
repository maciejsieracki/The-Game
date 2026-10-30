STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
GOAL: Niezalezna weryfikacja rundy 2 (U3 `generals.ts` -> `domain/generals.rs`, U4 `generalQuickFollow.ts` -> `domain/general_quick_follow.rs`) na pinie weba `dc8a3adc`. Baza weryfikowana: `8a4c332c` (kod `882a8020`, raport Operatora-impl `01-operator-r2.md`). Integracja battle-mode z zapisem i `planned-march` `generalTargetId`/save pozostaja NASTEPNA-PARTIA (poza allowlista).
ZMIANY/COMMIT: tylko dowody i korekta dokumentu: SHA-DOCS (w odpowiedzi Operatora-pomiary). Pliki: `04-operator-pomiary-r2.md` (ten raport), `fmt-pomiary-r2.log`, `clippy-pomiary-r2.log`, `test-pomiary-r2.log`, `mut-pomiary-r2-U4-M21-sync-hp-eq0.log`, `mut-pomiary-r2-U3-M22-nearest-le-tie-taken.log`, korekta liczb w `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-2.md` (§Runda 2 / Wektory). Kod Rust, wektory, testy: NIE zmieniane. `Cargo.lock` (artefakt builda, nietrackowany) NIE commitowany.
TESTY:
- Zakres zmian `cb57e479..8a4c332c`: 7 plikow kodu/testow/wektorow + dokumenty runu; zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. `git diff --check` EXIT=0.
- `cargo fmt --all -- --check`: EXIT=0 (`fmt-pomiary-r2.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`clippy-pomiary-r2.log`).
- `cargo test --no-fail-fast`: EXIT=0, 1459 passed / 0 failed, 0 FAILED linii (`test-pomiary-r2.log`).
- Weryfikator Python `verify-r2-generals.py` (`python3 -I`, od zera z TS pinu): failures=0; counts zgodne z raportem.
- Regeneracja wektorow z weba `dc8a3adc` (`node --experimental-strip-types gen-repin-wojna-2-generals-vectors.mjs`, katalogi tymczasowe poza repo): `generals.json` i `general-quick-follow.json` BAJT-W-BAJT zgodne z plikami w repo (cmp OK). Rozmiary: 448996 B i 756812 B (< 10 MB).
- Mutanty niezalezne: U4-M21 (`hp <= 0.0` -> `hp == 0.0`, `general_quick_follow.rs:299`) ZABITY (`sync_tracked_matches_web` FAILED, 12 passed / 1 failed). U3-M22 (`compare_nearest == Less` -> `!= Greater`, `generals.rs:175`) PRZEZYL = RÓWNOWAZNY przy unikalnych id rostera: `Equal` wystepuje tylko dla tego samego id (`generals.rs:194`), a wtedy podmiana na ten sam element nie zmienia wyniku.
- Potwierdzona równowaznosc U4-M03 (z raportu Operatora): `generalQuickFollow.ts:31` pomija `isGeneral` przez `nearestLivingGeneral` (`generals.ts:72` zwraca `undefined` dla `isGeneral === true`), wiec mutant bez `!isGeneral` nie zmienia wyniku.
- Zgodnosc `nearest`: web `.filter().sort(...)[0]` (`generals.ts:83-84`, komparator `d || localeCompare`) vs Rust liniowe minimum (`generals.rs:160-194`): identyczne dla spojnego komparatora i unikalnych id; `hp` NaN wykluczany po obu stronach (`NaN > 0` = false).
BLOKADY: brak.
ZALOZENIA (NIE_ZMIERZONO / przyjete):
- Z-A: id w rosterze sa unikalne (warunek rownowaznosci M22; produkcyjne id generowane unikalnie).
- Z-B: NaN wspolrzednej KANDYDATA przy >=2 kandydatach (komparator niespojny, zalezny od algorytmu sortu JS) nie jest pokryty wektorami (zgodne z raportem Operatora).
- Korekty dokumentacyjne (nie wplywaja na kod): P6 doc podawal `generals.json` 334 KB i `purchase` 83 wywolan kontynuacji; pomiar: 449 kB i 60 (`purchaseCalled`=60 w meta generatora). Poprawiono.
RUNDY: 2/5 (ta weryfikacja nie zmienia numeru rundy)
NASTEPNY KROK: runda 3 (ten sam ID): `planned-march.ts` `generalTargetId` + save/load (wymaga `pathfinding.rs` i `save_load.rs` w allowliscie) oraz integracja battle-mode z zapisem (`main.ts:29056`, `:40818-40820`). Decyzja o dopuszczeniu allowlisty: Final Control / orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
