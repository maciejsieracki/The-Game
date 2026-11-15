STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-22-MOD13-MISC-Q1
GOAL: Paczka MOD-13 (wioska-oboz, siegeCampModels, siegeMarker, siegeCampSync CPU, rangeOverlay + map/territory-border, tradeRoutesOverlay, robloxCity tylko addRobloxSkyDecor) w Rust 1:1 z webem `edb8fb56`. Nakładki mają być buforami CPU.
ZMIANY/COMMIT: Evaluator dodaje tylko ten plik. Oceniany kod: `6c5f83224` (Operator r1) + `fa94290a4` (Obrona r1), rodzic `2a45e3409`.
TESTY: zob. §2 i §3. Wszystkie bramki dały EXIT=0, zarówno na kodzie tematu, jak i na bieżącym `origin/rust-port/parity-v2` `525a2ef7b`.
BLOKADY: brak.
RUNDY: 3/5 (Evaluator, domknięcie wg DODATKU r3)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 0. Co jest oceniane (ancestry)

- Raportu `03-operator-r2.md`, na który wskazuje zadanie, **nie ma**. Sprawdziłem `origin/claude/rust-sivvrn`, `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` oraz `git log --all -- dyspozycje/autobot/runs/R-RUSTPORT-P4-22-MOD13-MISC-Q1/*`. Ostatnią rundą Operatora jest Obrona r1, czyli `03-operator-obrona-r1.md`, commit `fa94290a4`. Ten commit oceniam.
- Wynik `git merge-base --is-ancestor fa94290a4 origin/rust-port/parity-v2`: zwrócił 0. Kod tematu jest już w parity. Później zmieniały go P4.24 (`bfa2cd0dd`), P4.27 (`563b0c7e4`, `b36e3532d`) oraz REPIN-3D-B1/B4 (`cb00afecd`, `8f5aa88d7`).
- Commity `03c8e0ee` (Operator) i `9b574147` (Evaluator r1), cytowane w raportach r1, **nie istnieją** w repo (`git cat-file -t` daje fatal). Zob. uwagę N2.

## 1. Allowlista i higiena

- `git diff --stat 2a45e3409 fa94290a4` pokazuje 22 pliki. Wszystkie leżą w allowliście: `src/models/misc/**` (8 plików), `src/models.rs` (+1 linia `pub mod misc;`), `tests/misc_web_parity.rs`, `tests/fixtures/misc/**` (3×json, gen.ts, build.mjs, relief_shim.ts, README.md), `P4-22-MOD13-MISC.md` i `runs/<ID>/**`.
- Bez zmian zostały `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `src/{geom,pick,assets,camera,terrain}/**`, `lib.rs` i `Cargo.*`.
- `git diff --check 2a45e3409 fa94290a4` jest czysty. MD5 `Cargo.lock` przed bramkami i po nich jest takie samo: `c8ae14f6…`.
- W `tests/misc_web_parity.rs` i `src/models/misc/` nie ma `#[ignore]`, `should_panic`, `unsafe`, `todo!` ani `unimplemented!`. Porównania idą przez `Cmp::f` (`to_bits`, `misc_web_parity.rs:291-300`). Nie ma tolerancji. `Cmp::finish` asercjuje 0 różnic i niezerową liczbę porównań. Asercjowane są liczby przypadków: `model cases == 34` (`:628`) i `range cases == 252` (`:1036`).
- Pozycje geometrii są porównywane przez FNV-1a po bajtach LE oraz bbox `to_bits`. Pełne pozycje wchodzą, gdy hash się nie zgadza (`:938-944`), więc asercje nie są osłabione.
- jsmath: brak systemowych `sin/cos/tan/atan2/hypot/powf/exp/ln/mul_add`. `.sqrt()` (`range.rs:548`) jest poprawnie zaokrąglony IEEE. `.round()` (`overlay.rs:203`) działa tylko w gałęzi dokładnego remisu dziesiętnego `toFixed`, gdzie `a·10^d = m·5^d/2` jest dokładne, więc half-away-from-zero = reguła ECMA „większe n”. Sprawdziłem to wyprowadzeniem.

## 2. Bramki na kodzie tematu (`git archive fa94290a4 rust-port` → scratch, świeży `CARGO_TARGET_DIR` poza repo, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`)

```
cargo fmt --all -- --check                                        FMT EXIT=0 (log pusty)
cargo clippy --locked --all-targets -- -D warnings                CLIPPY EXIT=0
cargo clippy --locked --all-targets --features gpu -- -D warnings CLIPPYGPU EXIT=0
cargo test --locked --all-targets                                 TEST EXIT=0
  lib: 9 passed; misc_web_parity: 9 passed; 0 failed, 0 ignored we wszystkich 21 binarkach
  grep -cE 'FAILED|panicked' test.log = 0
```

## 3. Bramki po integracji (`origin/rust-port/parity-v2` = `525a2ef7b`)

```
FMT EXIT=0   CLIPPY EXIT=0   TEST EXIT=0
62× "test result: ok", razem 472 passed, 0 ignored, 0 FAILED/panicked
misc_web_parity: 11 passed (+ relief_sampler_matches_web, range_overlay_real_relief_matches_web z P4.24)
```

## 4. Wektory z uruchomionego weba (generator + SHA-256, nie ręcznie)

Środowisko: `git archive edb8fb56 gra/src gra/data` do scratch, `npm install --ignore-scripts three@0.169.0 esbuild@0.24.0` (integrity three `sha512-Ed906MA3…qUv0w==`, zgodne z README), node v22.23.4 (V8 12.4.254.21-node.57). Kroki: `node build.mjs` (EXIT=0), potem dwa razy `node gen.mjs`. Oba przebiegi wypisały `misc models=34 sync=8 markerSteps=4 range=252 loops=18 territory=7 trade=3`.

| plik | SHA-256 przebieg 1 = przebieg 2 = repo `fa94290a4` |
|---|---|
| models.json | `cf17ac9d66604ffd62c21835f990db9b1432315e1ea94947b66372e3c24de8e0` |
| overlays.json | `d590e026deac901f3a1f9ffc8ffbca5fa0f8075b1624e499a7520b7fb0d075a9` |
| siege.json | `06383e4d19e6abeb34b70be136e63b6260f8009796a35ad7c29c7f9de7e6be81` |
| gen.ts / build.mjs / relief_shim.ts | `a58562c0…` / `42d3c58c…` / `dca1001f…` (= README) |

`gen.ts` importuje pliki weba bez zmian z `../websrc/gra/src/...` (`gen.ts:24-38`). Pokrycie eksportów weba sprawdziłem przez `grep '^export '` na 7 plikach. Każdy builder i każda stała ma wektor. Pominięte są tylko `dispose*Group`, które zwalniają zasoby GPU i nie mają odpowiednika CPU.

Na HEAD parity `overlays.json` = `dc62fa14…`. Plik został przepięty na `origin/main` `86d510c66` przez REPIN-3D-B1 (`MINE_ELIGIBLE_TINT_OPACITY` 0,30 → 0,36). README fixtur opisuje to w liniach 4-10 i 54. To osobny temat, poza P4.22.

## 5. Mutacje (realnie uruchomione na `fa94290a4`)

- `mut.py` Operatora (16 mutacji): **13 wykrytych**, 3 przeżyły. Przeżyły te same mutacje co w r1: cache reliefu, `cross <`→`>` i nawiasy `/2.0`. Ich równoważność w dziedzinie potwierdził r1.
- 10 nowych mutacji Evaluatora r3 (inne niż w r1): **8 wykrytych**. Wykryte: `SKORA_LATA`, `EPS 1e-4→2e-4`, `STEPS 24→23`, `ARC_HEIGHT_MAX`, `LINE_OPACITY`, `TERRITORY_RELATION_Y_BUMP`, `HUG_RELIEF_RADIUS_FRAC`, `RING_LIFT`. Przeżyły 2:
  - `territory.rs:209` `hypot(...) < 1e-4` → `< 1e-3` (web `territory-border.ts:218`);
  - `range.rs:388` `len > 1e-9` → `> 1e-3` (web `rangeOverlay.ts:313`).

  Obie to strażniki przypadków zdegenerowanych. Na siatce heksów odległość domknięcia pętli wynosi 0 albo jest ≥ długości krawędzi. Normalne trójkątów drapowania (heks 0,97·R, podział 4) są rzędu 1e-2. Mutanty są więc równoważne w dziedzinie wejść. Progi są przepisane 1:1 z weba.
- Razem 21/26 wykrytych. 5 przeżyłych ma uzasadnioną równoważność.

## 6. Zarzuty blokujące

Brak. Ocena opiera się na realnym sprawdzeniu punktów §0-§5.

## 7. Uwagi (nieblokujące)

- N1. Dispatch/zadanie wskazuje `03-operator-r2.md`, którego nie ma. Ostatnia runda Operatora to `03-operator-obrona-r1.md` / `fa94290a4`. Orkiestrator powinien poprawić odnośnik w rejestrze.
- N2. SHA w raportach r1 (`03c8e0ee`, `9b574147`) nie istnieją w repo, bo commity przepisano przy integracji. Ślad audytowy jest przez to przerwany. Kod oceniono niezależnie na `6c5f83224`/`fa94290a4`, więc nie blokuje to wyniku. Na przyszłość: przy rebase zapisywać mapowanie SHA starego na nowe.
- N3. Strażniki zdegenerowane (§5, 2 nowe + 3 z r1) nie mają wektorów, które by je rozróżniały. Jest to zgodne z webem, a ryzyko jest tylko teoretyczne.
- N4. Node w r3 to v22.23.4, w r1 v22.22.0. SHA-256 są identyczne, więc wynik nie zależy od tej wersji node.
- N5. NIE_ZMIERZONO zgodnie z dispatchem: ocena wzrokowa/GPU (P4-22 §5, lista „co ocenić wzrokiem po RR-T5”) oraz rasteryzacja sprite'a ⚔ (D-MOD-6).
- N6. Scratch Evaluatora (target, websrc, node_modules, kopie kodu) został usunięty po bramkach.
