# P4.14 — MOD-12: modele cudów w Rust (`wonderModels` + `wonderRenderer` CPU), 1:1 z webem

**Temat:** `R-RUSTPORT-P4-14-MOD12-WONDERS-Q1` · **Domena:** GAME · **Rola:** Operator, runda 1/5 (Opus 5.5 medium, R-PROC-AUTOBOT §5a)
**Pin web (tylko odczyt):** `edb8fb56`. **Baza kodu:** `rust-port/parity-v2` @ `69f432ba`. **Commit kodu:** `95318e1f` (worktree, bez push).
**Paczka:** MOD-12 z `P4-4-MODEL-CATALOG.md` §2.3 i tabeli paczek (wiersz 12: `wonderModels`, `wonderRenderer` → `<renderer>/wonders/**`, „19 + default”).

## 0. Streszczenie

- Nowy moduł `civ_renderer::models::wonders` (`rust-port/renderer/src/models/wonders/{mod,model,builders,renderer,js_trig}.rs`), podpięty jedną linią `pub mod wonders;` w `src/models.rs`.
- `build_wonder_model(id, opts)` = `buildWonderModel` (`wonderModels.ts:427-486`): 19 sylwetek + `default` (walec + stożek), wariant ruiny (`grey`, `:17-26`), baner właściciela (`ownerBanner`, `:420-424`). Model = drzewo `Node` (Group/Mesh) z `Primitive` (geometria CPU przez `crate::geom`) i indeksem materiału; materiały Lambert jako dane (`color`, `flat_shading`).
- `WonderRenderer` = `WonderRenderer` (`wonderRenderer.ts`), część CPU: wybór modelu, ułożenie na heksie (`top_y` terenu roblox + `WONDER_LIFT`), skala `WONDER_SCALE`, ponowne użycie modelu po `visualKey`, mgła, `dispose`.
- **Zgodność z uruchomionym kodem weba: bitowa, 0 rozbieżności** — 157 modeli / 2 850 meshy / 103 073 skalary; scenariusz renderera 9 kroków / 140 stanów cudów / 3 080 skalarów; 4 477 kątów `Math.sin`/`Math.cos`. Test mutacyjny 15/15 zabitych.
- Odkrycie numeryczne: glibc `sin`/`cos` ≠ V8 (fdlibm) w ostatnim bicie dla części kątów cudów (przed poprawką 912 rozbieżności ≤ 1e-12, w tym `wyrocznia`, `roquepertuse`, `osada_aschaffenburg`, `koloseum`) → port `Math.sin`/`Math.cos` V8 we własnym module (`js_trig.rs`), §3.
- Cuda „parkowane” epoki 4+ (5 id) → `WonderShape::Default`, tak jak `switch` weba (D-MOD-5). Rejestr przygotowany na dopisanie (§2.3). Ocena wzrokowa: `NIE_ZMIERZONO` (brak GPU), lista §7.

## 1. Zakres i rozstrzygnięcia

| Punkt | Rozstrzygnięcie | Dowód |
|---|---|---|
| Styl mapy | tylko `roblox` (D-RR-8 = A; `GAME_MAP_RENDER_STYLE` to stała) | `mapRenderStyle.ts:40` |
| Wysokość heksu | `terrainTopY` = `spec.height + spec.yOffset` z `terrainVisualForStyle(t, 'roblox', civ)` — w Rust istniejące `pick::terrain::Terrain::top_y()` (P4.10/P4.11), `CIV_TERRAIN_HEIGHT` jest w roblox ignorowane | `wonderRenderer.ts:34-49`, `mapRenderStyle.ts:226-243` |
| Cuda parkowane | bez modelu → `default` (jak web) | `wonderModels.ts:473-477`, `wonders.json → parkowane_epoka4plus` (nalanda, angkor_wat, wielki_dzwon, mauzoleum_teodoryka, kopiec_grobowy) |
| GPU / materiały | brak: materiał = `LambertMaterial { color, flat_shading }`; `dispose()` materiałów nie ma odpowiednika CPU | dispatch §„Brak materiałów/shaderów/GPU” |
| Scena | `THREE.Scene` zastąpiona uporządkowaną listą `RenderedWonder` (kolejność = `scene.children` = kolejność wstawień `Map`) | `wonderRenderer.ts:103-110,128-142` |
| `lib.rs` | **bez zmian** — `pub mod models;` już istnieje; dopisano `pub mod wonders;` w `src/models.rs` (odpowiednik `models/mod.rs`, który jako plik nie istnieje) | `git show 69f432ba:rust-port/renderer/src/lib.rs` |

**ZAŁOŻENIA (luki dispatchu, przyjęte wartości domyślne):**
- Z1. `src/models.rs` to plik-moduł (nie `models/mod.rs`); traktuję go jako „`models/mod.rs`” z allowlisty i dopisuję wyłącznie jedną linię `pub mod wonders;`. Komentarz „Empty until the first batch lands” zostawiłem nietknięty (poza allowlistą treści).
- Z2. Klucze `map.hexes` weba to `` `${q},${r}` `` (tak jak buduje je gra i lookup `wonderRenderer.ts:78`); w Rust kluczem jest `HexCoord`.
- Z3. `ownerId`, `q`, `r` to liczby całkowite (`i32`); `ownerColor` to `u32`. Zachowano semantykę JS `%`: ujemny `ownerId` z niezerową resztą → `OWNER_COLORS[-k]` = `undefined` → brak banera; `-8 % 8 = -0` → indeks 0 (`default_owner_color`, testowane w scenariuszu przez `kolos` z `ownerId = -1`).
- Z4. `js_sin`/`js_cos` żyją w module cudów (allowlista zabrania zmian w `terrain/**` i `geom/**`, gdzie leży analogiczne `js_pow`). Rekomendacja na później: przenieść do wspólnego `jsmath` w osobnym temacie.

## 2. Wyprowadzenie (plik:linia, web `edb8fb56`)

### 2.1 `wonderModels.ts`

| Element web | Rust | Uwagi |
|---|---|---|
| `R = HEX_R` `:15` | `const R = HEX_R` | `HEX_R = 1.0` (`hexutil.ts:24`) |
| `grey(c, ruin)` `:17-26` | `builders::grey` | `Math.round` → `pick::hex::js_round`; kolejność `r*0.45 + m*0.55` |
| `m(c, ruin)` `:28-30` | `builders::mat` → `LambertMaterial { color: grey(..), flat_shading: true }` | |
| `box` `:32-41` | `bx` | `position = (x, y + h/2, z)`, `castShadow = receiveShadow = true` |
| `cyl` `:43-51`, `cone` `:53-61` | `cyl`, `cone` | tylko `castShadow = true`; domyślne `seg` 6/4 przekazywane jawnie przy każdym wywołaniu tak jak w web |
| 19 builderów `:63-418` | `egyptian_pyramid` … `gallic_oppidum` | operandy w tej samej kolejności (`Math.cos(a) * 0.20 * R` = `(cos(a)·0.20)·R`), `Math.SQRT2` = `SQRT_2`, `Math.PI` = `PI` |
| `colosseum` `:265-328` | `colosseum` | arena: `scale (1.55,1,1.05)`, `position.y = 0.014R`, tylko `receiveShadow`; łuki i attyk jako `Group` z `rotation.y = -a + π/2` |
| `ownerBanner` `:420-424` | `owner_banner` | nowy materiał (poza `userData.mats`) → indeks 20 |
| `mats` `:430-451` | `MaterialSlot` (20) + `WONDER_MATERIAL_COLORS` | kolejność kluczy obiektu = `Object.values(mats)` |
| `switch` `:453-477` | `WonderShape::from_id` + `match` | `kolos` dostaje `gold` jako „flame” (`:462`) — zachowane |
| `if (opts.ownerColor !== undefined)` `:480` | `if let Some(owner)` | `0` też daje baner |
| `WONDER_MODEL_IDS` `:488-493` | `WONDER_MODEL_IDS` | test: identyczne z webem i ze zbiorem `wonders.json → cuda` |

### 2.2 `wonderRenderer.ts`

| Element web | Rust |
|---|---|
| `OWNER_COLORS` `:21-24`, `ownerColor` `:51-53` | `OWNER_COLORS`, `default_owner_color` (Z3) |
| `WONDER_LIFT = 0.004 * HEX_R` `:26`, `WONDER_SCALE = 1.15` `:27` | stałe o tych samych nazwach |
| `terrainTopY` `:45-49` (+ brak heksu → 0, `:79`) | `top_y` → `Terrain::top_y()` / `0.0` |
| `sync` `:72-112`: klucz `` `${wonderId}@${q},${r}` ``, `visualKey` `:82`; istniejący klucz → `visible`, a przy tym samym `visualKey` tylko pozycja; inny `visualKey` → `_remove` + nowy model **na końcu**; na końcu usunięcie nieobecnych | `WonderRenderer::sync` (ta sama kolejność operacji; `remove(i)` + `push`; `retain`) |
| `ownerColorFn ?? ownerColor` `:96` | `owner_color_fn` / `default_owner_color` |
| `group.position.set(x, yBase, z)`, `scale.setScalar` `:98-101` | `RenderedWonder.position/scale`; `world_matrix()` = `scene.matrixWorld (I) × compose(...)` |
| `applyFogVisibility` `:114-123` (`key.split('@')[1] ?? ''`) | `apply_fog_visibility(&HashSet<String>, bool)` — dosłownie na kluczu tekstowym |
| `dispose` `:125-127` | `dispose` |

Użycie w grze: `main.ts:3818` `wonderRenderer.sync(placedWonderSnapshot(), { ownerColorFn: civColorFn })` (bez `isVisible`), mgła `main.ts:10932,10941`. Konsekwencja zachowana 1:1 i przetestowana (krok s5): `visualKey` nie zawiera koloru, więc zmiana `ownerColorFn` **nie** przebudowuje istniejących modeli.

### 2.3 Rejestr — jak dopisać cud (np. parkowany po D-NM)

1. wariant w `WonderShape`, 2. ramię w `WonderShape::from_id`, 3. builder + ramię `match` w `build_wonder_model`, 4. (opcjonalnie) id w `WONDER_MODEL_IDS` — tylko jeśli web je doda; 5. regeneracja `tests/fixtures/wonders` z nowym pinem. Dziś test `registry_matches_web_ids` wymusza, by 5 parkowanych dawało `Default`.

## 3. Numeryka: `Math.sin`/`Math.cos` V8

- `node --v8-options | grep -i libm` → brak flagi `use-libm-trig-functions`; `node --no-use-libm-trig-functions` → `bad option` ⇒ node v22.22.0 liczy `Math.sin/cos` przez fdlibm (`base::ieee754`).
- Przykład: `node -e "const a=(4/6)*Math.PI*2; console.log(Math.cos(a))"` → `-0.5000000000000004`; Rust `f64::cos` (glibc 2.39) różni się w ostatnim bicie (pierwszy przebieg testu: `wyrocznia node6.p` itd.).
- Pierwszy przebieg `models_are_bit_identical_to_web` z platformowym `sin/cos`: `models: scalars=103073 bit_diff=912 within_1e-12=912`. Rozkład potwierdzony mutacjami M5 (pozycje: 72) + M6 (kwaternion obrotu łuków/attyku Koloseum: 840) = 912.
- Port: `js_trig.rs` — `__kernel_sin`, `__kernel_cos`, gałęzie małe/średnie `__ieee754_rem_pio2` (|x| ≤ 2^19·π/2), operacja po operacji. Większe argumenty → platforma (cuda używają kątów z `[-π, 2π]`; ścieżka `__kernel_rem_pio2` nieprzeniesiona — jawne odchylenie). Kwaternion `setFromEuler` (XYZ) liczony lokalnie z `js_sin/js_cos` (`model.rs::quat_from_euler_js`), bo `geom::Quat::from_euler` używa platformy, a `geom/**` jest poza allowlistą.
- Weryfikacja: `trig.json` 4 477 kątów → `bit_diff=0`; platformowe `sin/cos` różnią się od V8 przy **272** z nich.
- **Ryzyko szczątkowe (poza zakresem):** `geom::cylinder_geometry` i `geom::Quat::from_euler` używają platformowego `sin/cos`. Dla wszystkich 2 850 meshy cudów hashe geometrii są identyczne (walce/stożki o 4/6/8/10/12/24 segmentach), ale nie jest to dowód dla dowolnych segmentów. Proponowany osobny temat: przełączyć `geom` na `js_sin/js_cos` po przeniesieniu ich do wspólnego modułu.

## 4. Odtworzone / pominięte

| Element | Status |
|---|---|
| 19 modeli + `default` + 5 parkowanych + nieznane id + `""` | odtworzone bitowo (drzewo, transformy, `matrixWorld`, cienie, geometrie, materiały, bbox) |
| Ruina (`grey`) — także baner | odtworzone bitowo (kolor wejściowy i liniowy `r,g,b`) |
| Baner właściciela (brak / `0xffd54a` / `0x8e24aa`, `ownerColorFn`) | odtworzone bitowo |
| `WonderRenderer.sync/applyFogVisibility/dispose` | odtworzone bitowo (kolejność, klucze, `visible`, pozycja, skala, `matrixWorld`) |
| `userData.mats` / `dispose()` materiałów | tylko licznik (`user_data_material_count() = 20`); brak zasobów GPU do zwolnienia |
| Wyciek materiału banera w web (nie trafia do `userData.mats`, więc `_remove` go nie zwalnia) | zachowane strukturalnie (baner poza 20 materiałami); w CPU bez skutków |
| Shader Lambert, cienie, mgła kolorem, rysowanie | poza zakresem (RR-T5 / GPU) — `NIE_ZMIERZONO` |
| `wonderpreview/main.ts` (strona podglądu) | poza zakresem (MOD-15 / D-MOD-7) |

API dla tematu GPU: `WonderModel::world_meshes(root_parent)` → lista `WorldMesh { primitive, material, world, cast_shadow, receive_shadow }`; `Primitive::geometry()` → `geom::Mesh`; `RenderedWonder::world_matrix()` jako rodzic.

## 5. Test mutacyjny (skrypt §8.3; każda mutacja na kopii pliku, potem przywrócenie)

```
M1-arch-lintel KILLED  models: scalars=103073 bit_diff=552;
M2-grey-weight KILLED  renderer: scalars=3080 bit_diff=60;models: scalars=103073 bit_diff=7150;
M3-arena-shadow KILLED  models: scalars=103073 bit_diff=6;
M4-box-center KILLED  models: scalars=103073 bit_diff=5996;
M5-trig-platform KILLED  models: scalars=103073 bit_diff=72;
M6-quat-platform KILLED  models: scalars=103073 bit_diff=840;
M7-cyl-noshadow KILLED  models: scalars=103073 bit_diff=150;
M8-lift KILLED  renderer: scalars=3080 bit_diff=280;
M9-owner-rem KILLED  renderer: scalars=3080 bit_diff=14;
M10-fog-split KILLED  renderer: scalars=3080 bit_diff=4;
M11-insert-front KILLED  renderer: scalars=3080 bit_diff=1284;
M12-retain-all KILLED  renderer: scalars=3080 bit_diff=981;
M13-visible-default KILLED  renderer: scalars=3080 bit_diff=41;
M14-banner-unconditional KILLED  renderer: scalars=3080 bit_diff=14;models: scalars=103073 bit_diff=258;
M15-scale KILLED  renderer: scalars=3080 bit_diff=840;
```
15/15 zabitych. (Mutacje wykonano tuż przed commitem, na drzewie zatwierdzonym potem jako `95318e1f`; każdy plik przywracany z kopii, a bramki §9 na `95318e1f` są zielone. Do powtórzenia przez Evaluatora skryptem §8.3.)

## 6. Wektory testowe i pochodzenie

Generator `rust-port/renderer/tests/fixtures/wonders/gen.ts` uruchomiony **poza repo** (scratch sesji, usunięty po pracy): `three@0.169.0` (integrity `sha512-Ed906MA3…qUv0w==`, identyczna z `gra/package-lock.json` na `edb8fb56`), `esbuild@0.24.0`, `git archive edb8fb56 gra/src gra/data`, node v22.22.0. Moduły weba importowane **bez zmian** (`wonderModels.ts` sha256 `c481b4e3…5ee2e3ba8`, `wonderRenderer.ts` sha256 `56bd73a4…6988bbb66e` — `git show edb8fb56:<plik> | sha256sum`). Instrukcja: `tests/fixtures/wonders/README.md`. Stdout: `wonders models=157 steps=9 hexes=47 trig=4477`. Drugi przebieg (po dodaniu `trig.json`) dał `models.json` i `renderer.json` identyczne bajtowo (`cmp`) — generator jest deterministyczny.

| Plik | Rozmiar | SHA-256 |
|---|---:|---|
| `gen.ts` | 11 693 | `a9c3d4b0bd758f941f91a7806674933a0e8a21628e9ebcc4854166d4a335bf81` |
| `models.json` | 1 332 011 | `cbd2e335f33b8dc6e722d0409c529163cd3ac4f18f0a1770d63fa0b0bf4bd707` |
| `renderer.json` | 40 061 | `cd9b7132d5e423db5371cd57617793d352e5cc206ae58ebf6a6638d1f227b531` |
| `trig.json` | 258 288 | `73c1e85d6ed5d96d03e35887c7d068cf4c80b6f4aad405c2b0f78539ab376d41` |

Łącznie ok. 1,6 MB (< 8 MB); niczego nie pominięto.

Testy (`tests/wonders_web_parity.rs`): `registry_matches_web_ids`, `models_are_bit_identical_to_web`, `renderer_scenario_is_bit_identical_to_web`, `js_trig_is_bit_identical_to_v8` + 3 testy jednostkowe w module (`grey`, rejestr, `default_owner_color`).

## 7. `NIE_ZMIERZONO` — do oceny wzrokiem po RR-T5 (GPU)

1. Każdy z 19 cudów + `default` z kamery gry (izometria) na heksie każdego typu terenu — sylwetka, proporcje, skala 1,15 względem heksu i miast.
2. Ruina: czy przyciemnienie (`grey`) czyta się tak jak w web; baner ruiny.
3. Baner właściciela przy 8 kolorach `OWNER_COLORS` i kolorach cywilizacji (`civColorFn`).
4. Flat shading Lambert (krawędzie ścian), cienie: rzucane przez wszystkie bryły, przyjmowane tylko przez boxy i arenę Koloseum.
5. Koloseum (216 meshy) — elipsa łuków, attyk, portyk; Osada Aschaffenburg / Roquepertuse — luka w palisadzie od strony +Z (brama).
6. Mgła: chowanie cudów poza `vis` i powrót po wyłączeniu mgły.
7. Wydajność rysowania wielu cudów (instancjonowanie) — poza CPU.
Dodatkowo: libm Windows/macOS (port `js_sin/js_cos` czyni pozycje niezależnymi od platformy, ale geometrie walców nadal korzystają z platformowego `sin/cos`, §3).

## 8. Bramki i skrypty

### 8.1 Polecenia
`cd rust-port/renderer` na commicie `95318e1f`; skrypt §8.4. Wynik zbiorczy: fmt EXIT=0, clippy EXIT=0, clippy `--features gpu` EXIT=0, `cargo test --locked --all-targets` EXIT=0 (10 binarek testowych, w tym `wonders_web_parity` 4/4; lib 3/3).

### 8.2 Surowe logi bramek

Pełny, nieobcięty zapis w §9 (na końcu dokumentu).

### 8.3 Skrypt mutacyjny (scratch, wykonany z `rust-port/renderer`)

```bash
#!/bin/bash
B=src/models/wonders/builders.rs; RR=src/models/wonders/renderer.rs; M=src/models/wonders/model.rs
run() { cp "$2" $BAK; sed -i "$3" "$2"; cmp -s "$2" $BAK && { echo "$1 NOT-APPLIED"; return; }
  out=$(cargo test --locked --test wonders_web_parity 2>&1); cp $BAK "$2"
  echo "$out" | grep -q "FAILED\|error" && echo "$1 KILLED" || echo "$1 SURVIVED"; }
run M1-arch-lintel  $B 's/tier_h \* 0\.89,/tier_h * 0.88,/'
run M2-grey-weight  $B 's/v \* 0\.45 + m \* 0\.55/v * 0.46 + m * 0.55/'
run M3-arena-shadow $B 's/arena\.receive_shadow = true;/arena.receive_shadow = false;/'
run M4-box-center   $B 's/mesh\.position = Vec3::new(x, y + h \/ 2\.0, z);/mesh.position = Vec3::new(x, y + h, z);/'
run M5-trig-platform $B 's/js_cos(a)/a.cos()/g; s/js_sin(a)/a.sin()/g'
run M6-quat-platform $M 's/Mat4::compose(self\.position, quat_from_euler_js(self\.rotation), self\.scale)/Mat4::compose(self.position, Quat::from_euler(self.rotation), self.scale)/'
run M7-cyl-noshadow $B '/^fn cyl/,/^}/s/mesh\.cast_shadow = true;/mesh.cast_shadow = false;/'
run M8-lift         $RR 's/0\.004 \* HEX_R/0.005 * HEX_R/'
run M9-owner-rem    $RR 's/let i = owner_id % 8;/let i = owner_id.rem_euclid(8);/'
run M10-fog-split   $RR "s/split('@')\.nth(1)/split('@').nth(0)/"
run M11-insert-front $RR 's/self\.models\.push(RenderedWonder {/self.models.insert(0, RenderedWonder {/'
run M12-retain-all  $RR 's/self\.models\.retain(|m| present\.contains(&m\.key));/self.models.retain(|_| true);/'
run M13-visible-default $RR 's/is_none_or(|f| f(w))/is_some_and(|f| f(w))/'
run M14-banner-unconditional $B 's/if let Some(owner) = opts\.owner_color {/if let Some(owner) = opts.owner_color.or(Some(0)) {/'
run M15-scale       $RR 's/pub const WONDER_SCALE: f64 = 1\.15;/pub const WONDER_SCALE: f64 = 1.16;/'
```
(Wersja uruchomiona dodatkowo wypisywała liczby `bit_diff` z wyjścia testu — §5.)

### 8.4 Skrypt bramek (scratch)

```bash
#!/bin/bash
echo '$ git rev-parse HEAD'; git rev-parse HEAD
echo '$ cargo fmt --all -- --check'; cargo fmt --all -- --check 2>&1; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets -- -D warnings'; cargo clippy --locked --all-targets -- -D warnings 2>&1; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'; cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1; echo "EXIT=$?"
echo '$ cargo test --locked --all-targets'; cargo test --locked --all-targets 2>&1; echo "EXIT=$?"
echo '$ cargo test --locked --test wonders_web_parity -- --nocapture'; cargo test --locked --test wonders_web_parity -- --nocapture 2>&1; echo "EXIT=$?"
```

## 9. Surowe logi bramek (commit `95318e1f`)

Jedyna obróbka: usunięto spacje na końcu 3 linii (`println!` w `Cmp::finish` kończy się spacją), żeby przeszło `git diff --check`.

```text
$ git rev-parse HEAD
95318e1fc6fa891aab1cafbc353d96fad784b110
$ cargo fmt --all -- --check
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_dd392c86-f69-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.08s
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_dd392c86-f69-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.22s
EXIT=0
$ cargo test --locked --all-targets
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_dd392c86-f69-1/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 1.04s
     Running unittests src/lib.rs (target/debug/deps/civ_renderer-3390857ab33a1fe3)

running 3 tests
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (target/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/assets_registry.rs (target/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test budget_thresholds_are_configurable ... ok
test cache_lru_by_entries_and_bytes ... ok
test live_report_lists_labels ... ok
test owned_guards_count_references ... ok
test handle_from_another_registry_is_rejected ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test scope_releases_everything_it_created_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (target/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test drag_and_wheel_do_not_depend_on_dt ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test fixture_covers_every_branch ... ok
test camera_controller_matches_web_100_percent ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/cpu_sanity.rs (target/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (target/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test merge_rejects_mixed_indexing ... ok
test parity_circle ... ok
test parity_cone ... ok
test parity_curve ... ok
test parity_box ... ok
test parity_plane ... ok
test parity_ops ... ok
test parity_cylinder ... ok
test parity_ring ... ok
test parity_shape ... ok
test parity_extrude ... ok
test parity_polyhedron ... ok
test trs_matches_manual_composition ... ok
test parity_torus ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/gpu_probe.rs (target/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pick_golden.rs (target/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test client_rect_to_ndc_matches_web ... ok
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test world_to_axial_both_variants_match_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.51s

     Running tests/terrain_web_parity.rs (target/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_fog_matches_web ... ok
test terrain_build_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/wonders_web_parity.rs (target/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s

EXIT=0
$ cargo test --locked --test wonders_web_parity -- --nocapture
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.03s
     Running tests/wonders_web_parity.rs (target/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
renderer: steps=9 wonder-states=140
renderer: scalars=3080 bit_diff=0 within_1e-12=0
trig: angles=4477 platform sin/cos differ from V8 at 272 angles
trig: scalars=8954 bit_diff=0 within_1e-12=0
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
models=157 meshes=2850
models: scalars=103073 bit_diff=0 within_1e-12=0
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s

EXIT=0
```
