STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2
GOAL: MOD-14 część 2 (pole statyczne bitwy) — port 1:1 do `rust-port/renderer/src/battle/`, bit w bit z webem (`edb8fb56`, three@0.169.0); ocena Evaluatora raportu Operatora r1 (`b162688f`).
ZMIANY/COMMIT: ocena `b162688f` (detached, rodzic `78bd7f1a` = `origin/rust-port/parity-v2`); Evaluator dodaje wyłącznie ten plik.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## ZAŁOŻENIE Z-EV-1 (kryteria z zadania nieadekwatne do dispatchu)
Zadanie Evaluatora wymienia kryteria z innego tematu: lista wywołań `ctx.*` z P4-25, `tiny-skia` w `Cargo.lock`, hash RGBA, metryka zgodności z Chromium, parser kolorów CSS. Dispatch Q2 (pole 3D bez rasteryzacji, „bez nowych zależności, `Cargo.lock` nie ruszać”) niczego z tej listy nie przewiduje. Oceniam więc według dispatchu, a kryteria z zadania mapuję tak:
- „jedyna nowa zależność” → brak nowych zależności (sprawdzone);
- „buduje się na 1.87.0” → zbudowane i przetestowane;
- „determinizm hash” → regeneracja `field.json` bajt w bajt;
- „brak unsafe” → sprawdzone;
- „mutacje” → mutacje własne.

Punkty `ctx.*`, Chromium, CSS i RGBA: NIE DOTYCZY.

## Sprawdzone (niezależnie, czysty target `--target-dir` w scratch, rustc 1.87.0)

### Baza i allowlista
`git diff --name-status 78bd7f1a b162688f` → 18 plików. Wszystkie leżą w allowliście:
- `src/battle/{field.rs,mod.rs}`;
- `tests/battle3d_field.rs`;
- `tests/fixtures/battle3d/**`;
- dokument P4-36;
- `runs/…-Q2/**`.

Nie zmieniono: `lib.rs`, `Cargo.toml`, `Cargo.lock`, `gra/**`, `geom` i pozostałych modułów spoza allowlisty. Dokument P4-36 tylko dopisany (jeden hunk `@@ -324,3 +324,186`, 0 linii usuniętych).

### Bramki (+1.87.0, czysty target)
- `cargo fmt --all -- --check`: EXIT=0.
- `clippy --locked --all-targets -D warnings`: EXIT=0.
- `clippy --features gpu`: EXIT=0.
- `cargo test --locked --all-targets`: EXIT=0, 397 passed, 0 failed, 52 binaries (zgodne z raportem Operatora).
- `battle3d_field`: 5/5.
- `sha256sum -c MANIFEST.sha256`: 12 × OK.
- Katalog fixtur: 10 908 890 B; największy plik 7 228 812 B.

### Bezpieczeństwo kodu
- `#![forbid(unsafe_code)]` w `lib.rs`.
- `grep unsafe` w `battle/` i teście: 0 trafień.
- Brak `include_str` i brak danych z fixtur w `src/`.

### Determinizm i autentyczność referencji
Generator uruchomiony od zera w osobnym katalogu scratch: `npm install three@0.169.0 esbuild@0.24.0`, `git archive edb8fb56`, `build_field.mjs`, `gen_field.mjs`.
- Wynik: `ctor=16 synthetic=9 nodes=281792`.
- `field.json` SHA `39df4eb7…369929` = MANIFEST.
- `gen_field.mjs` SHA `497e5666…d09143` = README.

Plugin bundlera dopisuje tylko linię `export {…}`; shim `three` zastępuje wyłącznie `WebGLRenderer`.

### Pokrycie rekordu węzła
`gen_field.ts::nodeRecord`/`geoHashRaw` obejmuje:
- transformacje, `matrixWorld`, flagi i `renderOrder`;
- tożsamość materiału;
- `position`/`normal`/`uv`/index/groups;
- instancje: macierze, kolory, sferę;
- światła i cienie.

Web nie ustawia atrybutu `color` w części 2 (`battleScene.ts:1232` to jedyne `setAttribute` geometrii), więc jego brak w haszu nie jest luką.

### Mutacje własne (spoza listy Operatora)
`--test battle3d_field`, 6/6 zabitych:
- `sun.intensity` 1.15 → 1.16;
- kolor `fill` `0x8090c0` → `0x8090c1`;
- `mapSize` 2048 → 1024;
- `shadow.far` 220 → 221;
- `toneMappingExposure` 1.05 → 1.0;
- `fov` 48 → 47.

Lista Operatora (48 pozycji) przejrzana: mutanty są zróżnicowane, nie tylko na stałych.

## Zarzuty

1. **Luka w teście — mutant przeżywa (blokujące).** Wynik publiczny `BattleField::siege` (`SiegeLayout`) nie jest weryfikowany w ścieżce konstruktora.
   - Przyczyna: `tests/battle3d_field.rs::compare_siege` zaczyna się od `let Some(s) = s else { return };`. Jeśli web ma oblężenie, a Rust zwraca `None`, porównanie jest po cichu pomijane. Zostaje tylko gałąź odwrotna, „web bez oblężenia → `wallCol == -1`”.
   - Dowód: mutant `build_battle_scene`, w którym `siege,` → `siege: None,` (kafle wycięte, zabudowa zbudowana, układ wyrzucony z wyniku). Wynik `cargo +1.87.0 test --locked --test battle3d_field`: **PRZEŻYŁ** (0/1).
   - Skutek: `wall_tile_hp`, `gate_hp`, `gate_open`, `gate_col`/`gate_row` przekazywane części 3 mogą zniknąć albo się zepsuć w konstruktorze bez wykrycia. Synteza `carve` sprawdza tylko samo `carve_wall_tiles`.
   - Naprawa: gdy `siegeState.wallCol != -1`, wymagać `Some` (i odwrotnie: `None` ⇔ `wallCol == -1`). Dodać ten mutant do `mutate_field.py`.

2. **Zakres względem inwentarza nieuzgodniony (blokujące, dokumentacja i śledzalność).** Dispatch każe portować „symbole sceny 3D z inwentarza `inwentarz-battleScene.md` przypisane do części 2”.
   - Inwentarz (`runs/…-Q1/inwentarz-battleScene.md`) ma 117 wierszy `RUNDA-2`. Wśród nich są symbole 3D, których §12 dokumentu nie wymienia ani jako zportowane, ani jako „poza zakresem”:
     - `_placeSiegeDefenders` (4139–4445);
     - `_attackWallTile` (7204–7234);
     - `_spawnCatapultBoulder` (7235–7271);
     - `_breachWallTile` (7302–7420);
     - `_spawnWallLabel` (7477–7495);
     - `_removeAllUnitsFromField` (9600–9631);
     - `_makeGroupNumberTexture` (18647–18667, część 3D);
     - `sideColor`, `UNIT_Y`, `HPBAR_Y`, `dirYaw`, `lerp`, `easeOut`, `easeIn`.
   - §12 jawnie przenosi tylko `_placeSiegeWall`, `_placeUnits*`, `_setDeployZoneVisible`, `_tick*`/`_clampCamTarget` oraz `_carveBattleBox`/`_fencePlayableZone`.
   - Tabela §4 przypisuje część z tych symboli do części 3–4, ale rozbieżność inwentarz ↔ §4 nie jest odnotowana. Ryzyko: symbole zgubione między rundami.
   - Naprawa: w §12 tabela uzgodnienia. Każdy wiersz `RUNDA-2` inwentarza będący symbolem sceny ma dostać jeden status: zportowany (z symbolem Rust), przeniesiony do części N (z odwołaniem do §4) albo WSPÓLNA/domena (kopia z testem lub brak użycia w części 2). Do tego licznik kontrolny.

3. **Drobne (niewymagające osobnej rundy, ale do poprawy przy okazji 1):** `compare_camera`, gałąź `nan_agnostic`, używa `zip` bez porównania długości. Różna liczba elementów przeszłaby niezauważona; dotyczy tylko przypadku NaN.

## Uwaga procesowa (nie zarzut wobec Operatora)
Katalog scratchpad jest współdzielony przez wielu agentów tej sesji. Mój pierwszy przebieg testów zapisał log do `scratchpad/test.log`, który nadpisał inny agent; tamten wynik odrzuciłem. Powtórzyłem przebieg w unikalnym katalogu `scratchpad/evq2x9/`, a liczby wyżej pochodzą z tego przebiegu. Przy rozpakowaniu usunąłem i nadpisałem też `scratchpad/ev` (`rm -rf`); jeśli należał do innego agenta, jego zawartość przepadła. Zalecenie dla orkiestratora: unikalne podkatalogi scratch per agent.

TESTY: zgodnie z sekcją „Sprawdzone” (bramki EXIT=0, 397/0/52, regeneracja bajt w bajt, mutacje własne 6/6 plus mutant zarzutu 1 PRZEŻYŁ).
BLOKADY: zarzuty 1 i 2.
NASTĘPNY KROK: powrót do Operatora (r2, ten sam ID) z zarzutami 1–3, potem ponownie Evaluator.
