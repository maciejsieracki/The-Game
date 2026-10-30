# Operator-impl, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1
GOAL: M06B2 - 6 symboli z web `gen-helpers.ts` 4946-5100 (pin `edb8fb56`) do `rust-port/engine/src/domain/mapgen/landsea.rs`: `removeTinyLandIslands`, `minTinyIslandHexesForTyp`, `countOpenOceanLandSpecks`, `purgeOpenOceanLandSpecks`, `finalizeLandMassAfterCoast`, `enforceTargetDryLandFraction`. Baza: `origin/rust-port/parity-v2` = `1aba22f7`.

ZMIANY/COMMIT: kod po partiach, KOD PIERWSZY, commit po kazdej partii (SHA):
- `1294cf84` partia 1: `removeTinyLandIslands`, `minTinyIslandHexesForTyp`; `data/derived/mapgen-landmass.json` (nowy) + parser w `data/derived.rs`; wektory `tests/p6_m06b2_vectors/` (4 pliki `web-*.json` + `common.rs`); testy `p6_m06b2_tiny`.
- `d9c41c8c` partia 2: `countOpenOceanLandSpecks`, `purgeOpenOceanLandSpecks`; testy `p6_m06b2_specks`.
- `c3e861d9` partia 3: `finalizeLandMassAfterCoast` (+ `_default`); testy `p6_m06b2_finalize` (w tym dowod: druga iteracja petli = no-op).
- `eaf57a2e` partia 4: `enforceTargetDryLandFraction` (+ `_default`); testy `p6_m06b2_enforce`; `#[allow(clippy::too_many_arguments)]` (9 argumentow jak w webie).
- `3dd3c8ea` sondy granic (`web-enforce-probe.json`, 3.3 MB), runner mutacji, weryfikator Python, logi.
- COMMIT RAPORTU/DOSSIER: HEAD (dodaje ten plik i `dyspozycje/rust-port/p6/P6-M06B2-WYSPY-FINALIZACJA.md`).
- Poza allowlista nic nie zacommitowano. Nieśledzone lokalnie (NIE commitowane): `rust-port/engine/Cargo.lock`, `rust-port/engine/target/`.

TESTY:
- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r1.log`).
- `cargo clippy --offline --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r1.log`).
- `cargo test --offline --no-fail-fast`: EXIT=0, **1482 passed, 0 failed** (`gate-test-r1.log`; = 1465 z bazy + 17 nowych testow M06B2).
- Testy M06B2 (17 funkcji): `p6_m06b2_tiny` 4/4, `p6_m06b2_specks` 3/3, `p6_m06b2_finalize` 4/4, `p6_m06b2_enforce` 6/6.
- Wektory z URUCHOMIONEGO weba (`git archive edb8fb56`): tiny 544+4, specks 20+20, finalize 384, enforce 720, probe 596. Rozmiary < 6 MB na plik.
- Weryfikator Python `verify-m06b2-python.py`: EXIT=0, **0 rozbieznosci** (4 minTyp, 544 removeTiny, 20 count, 20 purge; `verifier-python-r1.txt`). ZAKRES 4/6 symboli (patrz BLOKADY 1).
- Pin: `git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: brak hunkow w liniach 4946-5100.
- Mutacje (13): **9 zabitych** (M01-M05, M08, M09, M10, M13); **4 przezyte**: M06, M07 (rownowazne dowodem: purge w petli zawsze 0), M11, M12 (obserwacyjnie rownowazne na wektorach, NIE dowiedzione formalnie). `mut-results-m06b2.json`, `_przywrocenie.zgodne = true`.
- Cap petli `pass < 3` (web :5060): kopie weba z capem 1/2/4 daja wektory identyczne bajt-w-bajt z capem 3 (384 przypadki) - cap nieobserwowalny (dowod w dossier §5.2).
- Progi N-1/N/N+1: removeTiny 77 (N-1 vs N) i 89 (N vs N+1) par (mapa, prog); coastPasses 1/2/3 rozrozniane; tolerancja 2/3/4 pp i klamp 0.14/0.15/0.16 rozrozniane przez mapy.

BLOKADY:
1. Weryfikator Python niezalezny obejmuje 4/6 symboli. `finalizeLandMassAfterCoast` i `enforceTargetDryLandFraction` weryfikowane wylacznie testem Rust wzgledem wektorow weba (oracle = prawdziwy TS). Ich niezalezna reimplementacja wymaga helperow (`applyLandFractionByScore`, `finalizeCoastAndInlandWater`), poza zakresem partii.
2. Cap `pass < 3` w `finalizeLandMassAfterCoast`: wymog "mapy rozrozniajace cap" NIE jest spelnialny (nieobserwowalny, dowod + pomiar). Mutanty M06/M07 rownowazne dowodem.
3. M11 (gorny klamp 0.85 vs 0.86) i M12 (2 vs 1 przebiegow wybrzeza w enforce) przezyte: 0 roznic na 91 sondach decyzji (M11) i 0 roznic na 18 mapach x 37 celow (M12), ale bez dowodu formalnego.
4. Tabela `dyspozycje/rust-port/p6/P6-25-MAPA-GAP.md` (wiersze M06B) NIE istnieje w repo tej gałęzi - nie zaktualizowana.

RUNDY: 1/5 (Operator-impl). Bez rund ponowionych.

NASTĘPNY KROK: Evaluator (niezalezny przeglad: wektory vs TS, mutacje M06/M07/M11/M12, dowody §5.2 i §7.1, blokady 1-4), potem Final Control. M06B KOMPLET: TAK (z pozostalosciami dossier §10). Integracja i READY_FOR_DEPLOY nie wykonane przez Operatora.

DEPLOY/PUSH: NIE WYKONANO
