# P5-REPIN-WEB-RENDER-3 — REPIN renderu, faza 3D-3 (web `86d510c66` → `9b019a7d8`, FALA 509–532)

**TEMAT:** R-RUSTPORT-REPIN-WEB-RENDER-3-Q1 · **DOMAIN:** GAME · **RUNDA:** 1/5 · **ROLA:** Operator
**Baza:** `rust-port/parity-v2` @ `b520768b0` · **Web:** `86d510c66` → `origin/main` @ `9b019a7d89090c7491a4c2ad75278a7a60d42a90`
**Wzorzec:** `dyspozycje/rust-port/p4/P4-REPIN-3D.md` (§2.3 klasyfikacja `render/*`, §11.5 „K, bez zmian w Rust”).
**Weryfikator zakresu:** `src-tauri/frontend-v2/tools/verify-repin-render3-scope.mjs` + `repin-render3-scope.json`.

## 0. Streszczenie

1. **Cel wskazany w dispatchu nie istnieje.** `src-tauri/frontend-v2/src/render/**` nie ma na bazie; frontend-v2
   nie importuje `three` i nie ma go w `package.json` (C1 weryfikatora). Render mapy 3D w porcie Rust to crate
   `rust-port/renderer` (wgpu, `core::*`, `models::*`, `units::*`) — **poza allowlistą** tego tematu.
   Wzorzec REPIN-3D (P4) też portował `render/*` do `rust-port/renderer`, nie do frontendu.
2. **Klasyfikacja 9 plików** (§2): 6 = **K** (pamięć/zarządzanie zasobami, obraz bez zmian z założenia webu)
   → NIE-DOTYCZY obrazu w Rust; 2 **luki parytetu obrazu/bufora** do zamknięcia w `rust-port/renderer`
   (L1 `pixel_ratio_max` medium, L2 indeksowany `merge_decor`); 1 **SC zależne od kompozytora** (LOD drobnych
   części, L3) — w Rust brak runtime'u `UnitRenderer`, odroczone jak B3-rest w P4 §11.5.
3. **Przeniesienie kodu: 0 plików** (brak celu w allowliście). Dostarczone: plan, manifest zakresu
   (blob SHA 9 plików baza/cel), weryfikator z kotwicami luk w Rust (zamknięcie luki zgłosi się samo),
   self-test 12/12.
4. **Pomiary Chromium (pamięć, draw calls, piksele, picking, deferred dim, mgła, LOD): NIE_ZMIERZONO** —
   frontend-v2 nie renderuje sceny 3D (nie ma czego mierzyć); renderer Rust: brak `/dev/dri` (jak P4) i poza
   allowlistą. Nie podaję liczb, których nie zmierzyłem.

**ZAŁOŻENIE Z-R3-1 (cel):** zamiast przenosić kod do nieistniejącego katalogu albo łamać zakaz `rust-port/**`,
wykonuję zadanie (1) w całości i zadanie (2) w zakresie możliwym w allowliście (dokument + narzędzie
zakresu). Port L1–L3 wymaga osobnego tematu z allowlistą `rust-port/renderer/**` (§4).

**ZAŁOŻENIE Z-R3-2 (klasa K):** zmiany webu opisane i zmierzone w webie jako „obraz bez zmian” (pule,
sortowanie z id sprzed puli, zwalnianie kopii CPU, scalenie statyczne ≤ ~6 px/1,6 mln) to optymalizacje
specyficzne dla three.js/WebGL (liczba obiektów JS, draw calls, kopie `Float32Array`). Renderer Rust ma własny
model własności buforów (wgpu) — jak `transientObjectResources.ts`/`memDebug.ts` w P4 §2.3: NIE-DOTYCZY.

## 1. Pomiar zakresu

```text
git diff --numstat 86d510c66 9b019a7d8 -- gra/src/render
30/8 cities.ts · 184/0 geometryContentPool.ts (nowy) · 5/1 mapRenderStyle.ts · 212/0 materialContentPool.ts (nowy)
105/2 mergeDecor.ts · 4/0 scene.ts · 137/0 smallPartLod.ts (nowy) · 322/0 unitStaticMerge.ts (nowy) · 96/15 units.ts
```
Commity: `eb32c5496` (pixelRatioMax), `da7e9a63a` (mergeDecor indeksy + zwolnienie CPU), `3f6f6ec77`/`ef9a7af76`
(LOD, próg 3 px), `ed30cfeb1`/`5e3c0a8da`/`53d399b06` (pula geometrii per renderer), `5e62c5158` (pula materiałów +
`setOpaqueSort`), `1f3d84c59`/`ca9701022` (scalenie statyczne, okno odroczenia).

## 2. Klasyfikacja (kopia bajtowa / port / adapter / NIE-DOTYCZY)

| plik web | zmiana | klasa | cel Rust | decyzja |
|---|---|---|---|---|
| `mapRenderStyle.ts` | medium `pixelRatioMax` 1,5 → **2,0** | SC (ostrość na DPR>1,5) | `core/map_style.rs:269-276` (`pixel_ratio_max: 1.5`) + fixtura `tests/core_web_parity.rs:1340` | **PORT — luka L1** (1 stała + regeneracja wektora presetów) |
| `mergeDecor.ts` | `indexIdenticalVertices` (dedup bit w bit pos+kolor → bufor indeksów); `releaseMergedDecorCpuArraysAfterUpload` | K-bufor (obraz identyczny, reprezentacja inna) / K-GPU | `core/merge_decor.rs` („ONE non-indexed mesh”, bufory bit w bit vs web) | **PORT — luka L2** (indeksy: parytet bufora + pamięć GPU); zwolnienie CPU: NIE-DOTYCZY (Rust nie trzyma kopii po uploadzie z definicji wgpu — do potwierdzenia przy porcie) |
| `smallPartLod.ts` | LOD: chowa mesze o rzucie < 3 px, kubełki 1,12, scalone → prefiks części | SC (obraz z daleka) | brak kompozytora `units::*`/runtime `CityRenderer` | **ADAPTER odroczony — L3** (przy porcie kompozytora; algorytm czysty, portowalny 1:1) |
| `cities.ts` | pule geo/mat, `applySmallPartLod`, `lodModelsVersion` | K + hak L3 | `models/cities/renderer.rs` (`register_owned_mesh_resources`) | pule: NIE-DOTYCZY; LOD → L3 |
| `units.ts` | pule, `staticMerge`, `unmergedParts`, `unshare` przy przyciemnieniu, LOD | K + hak L3 | brak `UnitRenderer` w Rust (P4 §11.5) | NIE-DOTYCZY do portu kompozytora; wtedy L3 + kontrakt „przyciemniony = niescalony” |
| `unitStaticMerge.ts` | scalenie statycznych części żetonu (≤ ~6 px) | K/perf | — | NIE-DOTYCZY (wgpu: batching własny) |
| `geometryContentPool.ts` | pula geometrii per renderer | K | — | NIE-DOTYCZY |
| `materialContentPool.ts` | pula materiałów + `pooledMaterialOpaqueSort` | K | — | NIE-DOTYCZY (kolejność rysowania z założenia niezmieniona) |
| `scene.ts` | `renderer.setOpaqueSort(...)` | K | — | NIE-DOTYCZY |

Kopie bajtowe: **0** (żaden plik nie jest UI/DOM — wszystkie zależą od `three`).

## 3. Testy w tym temacie

- `node tools/verify-repin-render3-scope.mjs` → OK (9 plików, 2 kotwice); `--self-test` → 12/12 mutacji zabitych.
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0; `git diff b520768b0 -- src-tauri/frontend-v2/src` = pusto
  (regresja harnessów z konstrukcji 0; wyniki zmierzone — raport `01-operator-r1.md`).

## 4. Rekomendacja dla orkiestratora (temat następczy)

`R-RUSTPORT-REPIN-WEB-RENDER-3-RUST-Q1`, allowlista `rust-port/renderer/**`:
L1 (stała + wektor presetów z uruchomionego webu `9b019a7d8`), L2 (`index_identical_vertices` + wektory
`merge_decor` na nowym webie, mutacje: tolerancja ≠ bit w bit, kolejność trójkątów, próg Uint16/Uint32),
L3 do kolejki portu kompozytora jednostek. Po zamknięciu L1/L2 weryfikator C3 zgłosi FAIL → aktualizacja manifestu.

## 5. Wyniki tematu następczego R-RUSTPORT-REPIN-WEB-RENDER-3-RUST-Q1 (Operator r1)

- **L1 ZAMKNIĘTA:** `core/map_style.rs` medium `pixel_ratio_max` 1,5 → **2,0**. Wektor presetów
  (`tests/fixtures/core/mapstyle.json`) zregenerowany z uruchomionego webu `9b019a7d8` (three@0.169.0,
  generator `gen.ts`), test `map_style_matches_web` (`tests/core_web_parity.rs:~1340`) bez zmian kodu.
- **L2 ZAMKNIĘTA:** `core/merge_decor.rs` — `index_identical_vertices` (1:1 z `mergeDecor.ts:52-92`: klucz =
  6×`f32::to_bits`, hash `Math.imul`, sondowanie liniowe, kolejność pierwszego wystąpienia), `index_width`
  (Uint16 ≤ 65535 < Uint32), `build_merged_mesh` zwraca mesh indeksowany. Wektory: `mergedecor.json`
  (12 scen: `index` + `indexType`; 9 wektorów bezpośrednich `ivx`; 4 formułowe `big` z progiem 65535/65536).
  Pomiar bufora wierzchołków (6 scen scalonych): 1,45× – 5,0× mniej wierzchołków (np. `house` 312 → 66).
  Niezależny weryfikator `runs/R-RUSTPORT-REPIN-WEB-RENDER-3-RUST-Q1/verify_l2_geometry.py`: rozwinięcie
  indeksu = stara zupa `edb8fb56` bit w bit (geometria identyczna). Zwolnienie kopii CPU: NIE-DOTYCZY (potwierdzone
  — crate nie trzyma drugiej kopii CPU per upload).
- **L3** bez zmian (odroczona do portu kompozytora jednostek). L1/L2 nie dotykają `units::*`,
  `models/cities/**` ani pul — brak kolizji z planem L3 (LOD działa na meshach części, niezależnie od indeksu
  scalonego dekoru).
- Weryfikator zakresu C3 (`verify-repin-render3-scope.mjs`) daje teraz oczekiwany FAIL (2 kotwice luk zamknięte) —
  aktualizacja manifestu `repin-render3-scope.json` poza allowlistą tego tematu (decyzja orkiestratora).

## 6. Aktualizacja manifestu C3 (`R-RUSTPORT-REPIN-WEB-UI-3-INTEGRACJA-Q1`, Operator r1)

- `src-tauri/frontend-v2/tools/repin-render3-scope.json`: kotwice mają `id` + `status`. **L1 ZAMKNIETA**
  (`map_style.rs`: po `QualityTier::Medium => ResolvedRenderPreset {` musi być `pixel_ratio_max: 2.0,`, nie może `1.5,`),
  **L2 ZAMKNIETA** (`merge_decor.rs`: `let ix = index_identical_vertices(positions, colors);` → `indices: ix.index,`;
  plik nie może zawierać `ONE non-indexed mesh`), **L3 ODLOZONA** (w `rust-port/renderer/src/**/*.rs` brak
  `small_part_lod`/`smallPartLod`/`apply_small_part_lod`; pojawienie się = FAIL → aktualizacja planu przy porcie kompozytora).
- `verify-repin-render3-scope.mjs`: C3 obsługuje statusy (brak statusu = OTWARTA, dawna semantyka); `--self-test` 12 → 20
  mutacji (regres L1 w Rust, regres L2 ×2, podjęcie L3, L1 cofnięta do OTWARTA, ZAMKNIETA bez warunku, L3 bez wzorców,
  nieznany status) — 20/20 zabitych; przebieg bazowy OK (9 plików webu, 3 kotwice).
