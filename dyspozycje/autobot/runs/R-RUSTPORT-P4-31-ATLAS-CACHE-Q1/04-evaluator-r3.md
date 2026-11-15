STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-31-ATLAS-CACHE-Q1
GOAL: RR-T8d (P4-25 §6) w `rust-port/renderer`: klucze treści (port `cityMapBadgeKey` i pokrewnych, wektory z uruchomionego weba), cache LRU/refcount M2 z testem N tur, mipmapy CPU T7/T9/T11, skala DPI×LOD z limitem 2048, upload wgpu za cechą `gpu`, rejestr RR-T6 bez duplikacji.
ZMIANY/COMMIT: oceniany kod = `5259741ab` (Operator r2; rodzic `1429ba434` r1; baza `672c20591`). Ten etap dodaje wyłącznie ten plik i `dowody/13..15-evaluator-r3-*` (commit w worktree, bez push).
TESTY: niżej (odtworzone samodzielnie, czysty `CARGO_TARGET_DIR` poza repo, `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_{DEV,TEST}_DEBUG=0`).
BLOKADY: brak blokujących. Zarzuty procesowe i drobne — niżej.
RUNDY: Evaluator r3 (dodatek r3 dispatchu; Operator 2/5).
NASTĘPNY KROK: Obrona (odpowiedź na zarzuty 1–6), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki (odtworzone przez Evaluatora)

Checkout: sparse worktree `--detach 5259741ab` poza repo; rustc/cargo 1.97.0. Pełny log: `dowody/13-evaluator-r3-gates.log`, skrypt `dowody/13-evaluator-r3-gates.sh`.

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT=0 |
| `cargo clippy --locked --all-targets -- -D warnings` | EXIT=0 |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | EXIT=0 |
| `cargo test --locked --all-targets` | EXIT=0, 305 passed / 0 failed / 0 ignored |
| w tym RR-T8d: `atlas_keys` 7, `atlas_mip` 5, `atlas_nturns` 8, `atlas_json` 1, `atlas_gpu` (CPU) 0 | wszystkie ok |
| `cargo test --locked --features gpu --test atlas_gpu --test gpu_probe` | EXIT=0; 2 passed + 1 ignored (`upload_and_read_back_every_level`, powód: brak adaptera GPU, P4-15), `gpu_probe` SKIPPED: no GPU adapter |
| `cargo +1.87.0 …` (MSRV) | NIE_ZMIERZONO przez Evaluatora (toolchain 1.87 nieobecny w kontenerze; log Operatora `11-gates-r2.log` deklaruje EXIT=0) |

## 2. Allowlista, zależności, `ignore`, asercje

- `git diff --name-only 672c20591 5259741ab`: wszystkie ścieżki w allowliście (`src/raster/atlas/**`, `src/raster/mod.rs` = dokładnie `+pub mod atlas;`, `tests/atlas_*.rs`, `tests/fixtures/atlas/**`, `P4-31-ATLAS-CACHE.md`, katalog runu). Zero zmian: `Cargo.toml`, `Cargo.lock`, `src/lib.rs`, `gra/**`, `rust-port/engine/**`, `assets/**`, `core/**`, `geom/**`, `models/**`.
- Fixtury: 3 205 289 B (suma `git ls-tree -l`) (≤ 4 MB).
- `#![forbid(unsafe_code)]` w `src/lib.rs:24` — jest.
- `#[ignore]`: jedyny `tests/atlas_gpu.rs:101`, z powodem (zgodnie z dispatchem pkt 5). Brak `should_panic`. `#[allow]` tylko punktowe lint-y clippy (`cast_*`, `float_cmp` z komentarzem JS `===`), plus `#![allow(dead_code)]` w module pomocniczym `atlas_json.rs`.
- Asercje: porównania kluczy/skali/purge są dokładne (`==` na stringach, `to_bits` na liczbach, zero tolerancji); progi mip = zmierzona zgodność (np. RGBA8 parzyste `exact == texels`, pozostałe `max|Δ| ≤ 1` i ratio tuż pod pomiarem). Brak osłabionych asercji względem r1 (r2 dodał asercje: `a=0`, strażnik ≥120 przypadków `|l1/|l2` wewnątrz klucza, przypadek T7).

## 3. Wektory z pinu — generator + SHA-256 (odtworzone)

Log: `dowody/15-evaluator-r3-fixtures-regen.log` (porównanie: `dowody/15-evaluator-r3-cmpj.py`).
- `sha256sum -c SHA256SUMS` na `5259741ab`: 5/5 OK.
- `gen.sh` uruchomiony przez Evaluatora (scratch poza repo; `git archive edb8fb56 gra/src gra/data`, three@0.169.0, esbuild@0.24.0, node v22.23.4): GEN_EXIT=0; **wszystkie sekcje danych identyczne** z commitowanym `atlas_keys.json`; jedyna różnica to pole metadanych `node` (`v22.22.0` → `v22.23.4`), stąd inny SHA pliku.
- `gen_gl.mjs` uruchomiony przez Evaluatora (Playwright, ANGLE → Vulkan → SwiftShader): GL_EXIT=0, 57 przypadków; **wszystkie dane (`cases`, `up`) identyczne**; różnią się tylko `browser`/`userAgent` (dostępny dziś Chromium 153.0.8010.12 zamiast 141.0.7390.37). Wynik mocniejszy niż deklaracja: filtr SwiftShadera jest stabilny między dwiema wersjami Chromium.
- Generator linkuje niezmienione funkcje weba (`cityMapBadgeKey`, `formatCityGrowthPercentLabel`, `disposeCityMapBadgeTexturesForOtherLod`, `ownerEmblemKey`, `cityBadgeLodLevelForDist/TextureScale`); prywatne helpery tylko DOPISANYM `export {…}` — sprawdzone w `gen.sh`. Wektory nie są pisane ręcznie.

## 4. Przegląd kodu względem weba (pin `edb8fb56`)

Sprawdzone ręcznie z `git show edb8fb56:gra/src/render/cityMapStatChip.ts` (`:149-152`, `:183-185`, `:607-610`, `:744-750`, `:962-1047`) i `cities.ts:561-597`, `5d9534e0:cities.ts:593-619`:
- `city_map_badge_key`: kolejność segmentów, `??` vs `||` (`prodKind ?? 'b'` zachowuje pusty string — Rust `unwrap_or("b")` zgodnie), `growthStarving === true`, `l…` ostatni — zgodne.
- `purge_other_lod` = `endsWith(keep)`; `prune_unused` = `pruneUnusedStatChipTextures`; `finish_sync` łączy purge (po zmianie LOD, jak `syncStatChips`) i prune (jak koniec `sync()`).
- `badge_canvas_scale` = `min(dpr·lodScale, 4)`; strażnik 2048 nieaktywny dla osiągalnych plakietek (asercja w teście dla W ≤ 463).
- `Producer::options`: T1–T6, T15 — domyślne Three (`LinearMipmapLinear`, `NoColorSpace`); T7/T9/T11 sRGB z mipmapami; T8/T10/T12/T13/T14 sRGB bez mipmap — spójne z §5.1 dokumentu.

## 5. Mutacje Evaluatora (własny zestaw, niezależny od A1–A31 Operatora)

`dowody/14-evaluator-r3-mutations.{py,log}` — 14 mutantów, 11 zabitych, 3 przeżyły:
E1 `ends_with`→`contains` (zabity, `lod_purge_matches_web`); E2 usunięcie U+FEFF z `js_trim` (zabity); E3 znak `−` dla `-0` (zabity); E4 brak prune (zabity); E5 alfa sRGB half-even (zabity); E6 unpremultiply half-up (zabity); E7 `BADGE_MAX_TOTAL_SCALE` 5 (zabity); E8 brak purge LOD (zabity); E9 przesunięcie tapów −0,49 (zabity); E10 `READBACK` bez `COPY_SRC` (zabity, `--features gpu`); E13 `str::trim` zamiast `js_trim` dla `civIconId` (zabity).
Przeżyłe: E11 (usunięcie `f == 0.0` w `js_floor_at_least_one`) — **równoważny** (`max(1, ±0) = 1`); E14 (usunięcie `clamp` w `linear_to_srgb_unit`) — praktycznie równoważny (wejście to średnia ważona wartości z [0,1], nadmiar ≤ ulp, `clamp_u8` i tak tnie do 255); E12 — patrz zarzut 4.

## 6. Zarzuty (ponumerowane)

1. **[PROCES, poważny, nie blokuje kodu]** Kod tematu jest JUŻ w `origin/rust-port/parity-v2` (first-parent: `1429ba434`, `5259741ab`; dokumentacja integracji `02784eae7` „P4.31 … zintegrowane”) — zintegrowany bez Evaluatora i Final Control, wbrew obiegowi Operator → Evaluator → FC → integracja. Co więcej, po integracji `a827fac07` (REPIN-3D B2) zmienił `src/raster/atlas/keys.rs`, `tests/atlas_keys.rs` i fixtury `atlas_keys.json`/`README.md`/`SHA256SUMS`, więc obecny kod na parity ≠ ocenianego `5259741ab`. Ta ocena obejmuje WYŁĄCZNIE `5259741ab`; stan na bieżącym parity-v2 — NIE_ZMIERZONO przez Evaluatora. Orkiestrator: zapisać w rejestrze, że integracja poprzedziła FC; FC powinien ocenić także różnicę `5259741ab..parity` w ścieżkach atlasu albo jawnie ją wyłączyć.
2. **[ŚLAD AUDYTOWY]** W katalogu runu brak `02-evaluator-r1.md`, choć `03-operator-r2.md` i `P4-31-ATLAS-CACHE.md` §12 odpowiadają na „zarzuty Evaluatora r1 (`02-evaluator-r1.md`)” (nie ma go na żadnej gałęzi — `git log --all -- …/02-evaluator-r1.md` pusty dla P4-31). Zarzuty r1 są odtwarzalne tylko z odpowiedzi Operatora.
3. **[DOWODY, drobny]** `dowody/06-fixtures-repro.log` dotyczy fixtur rundy 1 (SHA `64bba615…`, `6ff44618…`), a nie commitowanych w r2 (`8d64d5c0…`, `3ebda643…`); w r2 brak logu ponownej generacji. Uzupełnione przez Evaluatora (§3: dane identyczne). README twierdzi „byte-identical” — prawdziwe tylko przy tych samych wersjach node/Chromium; pola metadanych (`node`, `browser`, `userAgent`) zmieniają SHA. Zalecenie: dopisać to zastrzeżenie w README.
4. **[TEST, drobny]** Mutant E12 przeżywa: `TextureCache::end_of_turn` bez `keys.retain(...)` nie łamie żadnego testu. Skutek jest ograniczony (publiczne `keys()` filtruje po `inner`, a `prune/purge` liczą tylko faktycznie usunięte), ale indeks `keys: BTreeSet<String>` przy wołaniu wyłącznie `end_of_turn` (bez prune/purge) rośnie bez ograniczenia — to dokładnie klasa M2 (wzrost w nieskończoność), tylko dla stringów. Brak testu wielkości indeksu po `end_of_turn`.
5. **[OBSERWACJA, poza allowlistą tematu]** LRU z RR-T6 (`assets/cache.rs:166-176`, `enforce_limits`) wyrzuca najstarszy wpis bez względu na `ref_count` — także teksturę widoczną na ekranie. Gdy drugi obiekt poprosi o ten sam klucz, cache zrobi drugą teksturę o identycznej treści (duplikat VRAM). Test `lru_bound_keeps_shown_textures_alive` przechodzi, bo w symulacji klucze są unikalne per miasto. Doc `cache.rs` przedstawia LRU jako trzeci „bound” — warto dopisać, że przy przypiętych teksturach nie ogranicza pamięci i może duplikować. Nie wymaga zmian w tym temacie.
6. **[NIE_ZMIERZONO]** MSRV 1.87 nieodtworzony przez Evaluatora (brak toolchaina); upload/odczyt wgpu na prawdziwym GPU (test `#[ignore]` z powodem — zgodnie z dispatchem); filtr `generateMipmap` i niepremultiplikacja na ANGLE → D3D11 właściciela (dokument §10 to uczciwie deklaruje).

## 7. Werdykt

Kod `5259741ab` spełnia GOAL i kryteria dispatchu: bramki zielone (odtworzone), allowlista czysta, brak nowych zależności, `forbid(unsafe_code)` jest, jeden uzasadniony `#[ignore]`, wektory z pinu odtworzone przez Evaluatora z generatorów (dane identyczne), mutacje niezależne 11/14 zabitych, 3 przeżyłe opisane (2 równoważne, 1 drobna luka testu). **PASS-WITH-NOTES**; zarzuty 1–2 procesowe dla orkiestratora/FC, 3–4 do poprawy niewielkim kosztem, 5–6 informacyjne.
