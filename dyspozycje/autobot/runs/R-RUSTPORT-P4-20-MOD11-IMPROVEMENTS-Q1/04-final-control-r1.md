STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1
GOAL: Paczka MOD-11 (improvements, robloxImprovements 24 BUILDERS + stosy, p2/p3a/p3b, kopalnie, droga, pastwisko, swinia, styleResources) w Rust 1:1 z webem `edb8fb56`; kon z `unit_core`, drzewo `unit_core::model::UnitModel`, zgodnosc bitowa z uruchomionym webem.
ROLA: Final Control (Opus 5.5 medium), runda 1/5.

## Ocena stanu

Oceniany commit Obrony: `a35ea1cc` (istnieje; rodzic `4a2bdea6` <- `4e96a7e8` <- `acb1915e` <- baza `bf59164b`).
Allowlista: `git diff --name-only bf59164b a35ea1cc` = 27 plikow, wszystkie w allowliscie
(`src/models/improvements/**`, jedna linia w `src/models.rs`, `tests/improvements_web_parity.rs`,
`tests/fixtures/improvements/**`, `P4-20-MOD11-IMPROVEMENTS.md`, `runs/<ID>/**`). `lib.rs`, `Cargo.toml`,
`Cargo.lock`, `gra/**` bez zmian. `git diff --check bf59164b a35ea1cc` pusty.

## Weryfikacja wlasna (nie z deklaracji)

1. Wektory odtworzone wg `tests/fixtures/improvements/README.md` poza repo (three 0.169.0, esbuild 0.24.0, node v22.22.0,
   `git archive edb8fb56 gra/src gra/data`):
   - z linia `legacy-export.txt`: `improvements full=195 sigs=237 legacy=25`; `cmp` z commitem: data/legacy/models/protokeys/sigs = identyczne;
   - bez tej linii (osobna kopia websrc2): `legacy=0`; data/models/protokeys/sigs = identyczne bajtowo z commitem
     (dowod, ze dopisany `export {...}` nie zmienia pozostalych wynikow).
   - sha256: data `d908702a…`, legacy `d84e1c84…`, models `4f27e823…`, protokeys `38d666bd…`, sigs `f45443e9…`.
   - `protokeys.json` potwierdza pomiar Evaluatora: `__proto__` -> `fn is not a function`, 9 kluczy -> TypeError, `constructor`/`toString` -> pusta grupa.
2. Bramki na `a35ea1cc`, czysty `CARGO_TARGET_DIR` (scratch):
   `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0;
   `--features gpu` EXIT=0; `cargo test --locked --all-targets` EXIT=0 (18 binarek, 0 porazek).
   `models: cases=457: scalars=192046 bit_diff=0 within_1e-12=0 struct_diff=0`;
   `proto keys: threw=10 empty=2: scalars=52 bit_diff=0 struct_diff=0`; `data: scalars=35 bit_diff=0`.
3. Sonda scalenia z aktualnym `origin/rust-port/parity-v2` = `6d77d02e` (nowszy niz `b338830e` z sondy Evaluatora;
   zawiera P4.17, P4.18, P4.19, P3.22 r3-5): `git merge` bez konfliktow (auto-merge `src/models.rs`), merge-sonda `403c2f4c`
   (lokalna, porzucona). Na scaleniu: fmt/clippy/clippy gpu/test EXIT=0, 20 binarek, 0 porazek; improvements 457/0/0;
   `jsmath_wiring` 6/6 ok - po P4.18 skaner obejmuje rekurencyjnie cale `src/`, wiec nowy katalog `improvements/`
   jest juz skanowany i przechodzi (uwaga Operatora/Evaluatora o luce skanera zamknieta po integracji).
4. Mutacje wlasne w `roblox_legacy.rs` (przywrocone, drzewo czyste):
   FC1 kolor `SALT` 0xffffff->0xfffffe: bit_diff=5 struct_diff=6, ZABITA;
   FC2 `add_box` y 0.08->0.081 (l.159): bit_diff=2 struct_diff=1, ZABITA;
   FC3 `add_cyl` seg+1: bit_diff=61 struct_diff=189, ZABITA.

## Orzeczenia zarzutow Evaluatora r1

| # | Zarzut | Orzeczenie | Podstawa |
|---|---|---|---|
| 1 | Z2: 15 `rbx*` + `addCyl` nieprzeniesione wbrew D-MOD-3 = B | **ODDAL** (naprawione przez Obrone) | `roblox_legacy.rs`, 25 grafow `legacy.json` odtworzone bajtowo z kodu weba; 0 roznic; mutacje FC1-FC3 zabite |
| 2 | Z1: D-MOD-1 podane jako otwarte; brak jawnej kolizji z D-MOD-3 | **ODDAL** (naprawione) | §1 poprawione (`LEDGER.md:123,127,128`), kolizja nazwana `K-MOD11-1`; rozstrzygniecie (pierwszenstwo D-MOD-1 jako decyzji szczegolowej) zgodne z precedensem `D-NM-17` (P4-7 §4.1b, rekomendacja D-MOD-1 ma pierwszenstwo) - nie jest nowa decyzja produktowa, lecz zastosowaniem juz przyjetej linii; do zbiorczego potwierdzenia razem z D-NM-17 |
| 3 | Z6: klucze `Object.prototype` NIE_ZMIERZONO | **ODDAL** (naprawione) | `protokeys.json` zmierzone (odtworzone bajtowo), test `prototype_keys_documented_deviation` pinuje (10, 2); odchylenie (Rust: pusta grupa zamiast wyjatku JS) dotyczy kluczy spoza `ImprovementKey`, nieosiagalnych z gry - jawnie opisane odchylenie dopuszczone przez dispatch, nie wymaga decyzji czlowieka |

Agregat: 0 x NAPRAW, 3 x ODDAL -> **PASS**.

## Kolejnosc integracji

`a35ea1cc` (zawiera `acb1915e`, `4e96a7e8`, `4a2bdea6`) scalic na `origin/rust-port/parity-v2` (`6d77d02e`) - bez konfliktow,
jedyny wspolny plik `src/models.rs` scala sie automatycznie (linie `improvements` + `units_kamien`). Ten raport (commit FC na
`a35ea1cc`) wchodzi razem z nim. Po scaleniu: wpis LEDGER na galezi dokumentacji + `K-MOD11-1` do zbiorczej listy z `D-NM-17`.

BLOKADY: brak. Ocena wzrokowa NIE_ZMIERZONO (brak GPU; lista w §7 dokumentu, po RR-T5).
DEPLOY/PUSH: NIE WYKONANO
