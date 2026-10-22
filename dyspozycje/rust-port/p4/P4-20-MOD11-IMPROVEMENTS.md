# P4.20 — MOD-11: modele ulepszeń terenu i zasobów w Rust, 1:1 z webem

**Temat:** `R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1` · **Domena:** GAME · **Rola:** Operator r1 + Obrona r1 (§10), runda 1/5 (Opus 5.5 medium, R-PROC-AUTOBOT §5a)
**Pin web (tylko odczyt):** `edb8fb56`. **Baza kodu:** `rust-port/parity-v2` @ `bf59164b`. **Commit kodu:** `acb1915e` (Operator) + commit Obrony (§10) (worktree, bez push).
**Paczka:** MOD-11 z `P4-4-MODEL-CATALOG.md` §2.4 i tabeli paczek §4.2 (wiersz 11: `improvements`, `robloxImprovements`, `ulepszenia-modele-p2/p3a/p3b`, `kopalnia-cyny-opus5`, `kopalnia-zlota-opus5`, `droga-6-ramion`, `pastwisko-modele`, `swinia-trzoda`, `styleResources`, `resources` → „24 + złoża + zwierzęta”).

## 0. Streszczenie

- Nowy moduł `civ_renderer::models::improvements` (`rust-port/renderer/src/models/improvements/{mod,model,kit,registry,roblox,p2,p3a,p3b,kopalnie,droga,zwierzeta,zasoby}.rs`, 6 461 linii), podpięty jedną linią `pub mod improvements;` w `src/models.rs`. `lib.rs` bez zmian (`pub mod models;` już jest).
- Drzewo modelu = **`unit_core::model::UnitModel`** (zgodnie z dispatchem, bez nowego typu drzewa). To, czego `UnitModel` nie niesie, jest w równoległych tabelach w `model.rs` (minimalne typy we własnym module, §1 Z4): cienie, `userData`, rodzaj materiału (Lambert/Standard) i liniowy `emissive`, dwie geometrie spoza `Prim` (dwunastościan, stożek po `rotateY`).
- Koń stadniny i złoża koni = MOD-04 `unit_core::horse::{build_horse, build_zloze_konie}` (reużyte, nie skopiowane).
- **Zgodność z uruchomionym kodem weba: bitowa, 0 rozbieżności** — 432 przypadki (195 pełnych grafów + 237 sygnatur): 173 070 skalarów porównanych `to_bits`, plus liczby węzłów/meshy/wierzchołków/trójkątów, hashe geometrii, parametry geometrii, sloty i parametry materiałów, cienie, `userData`, bbox. Tabele danych: 35 skalarów + `IMPROVEMENTS`/klucze/maski dróg, 0 różnic.
- **Obrona r1 (§10):** dodatkowo przeniesione 15 nieużywanych funkcji `rbx*` + `addCyl` (D-MOD-3 = B) do `roblox_legacy.rs`, 25 nowych przypadków bitowo (razem **457 przypadków, 192 046 skalarów, 0 różnic**); Z6 zmierzone na webie (`protokeys.json`, test odchylenia); podstawa Z1 poprawiona (D-MOD-1 rozstrzygnięte) i kolizja z D-MOD-3 = B nazwana jawnie (`K-MOD11-1`).
- Test mutacyjny: 24/26 zabitych, 2 przeżyły jako mutanty równoważne na danych (opisane w §5, zastąpione silniejszymi M21b/M22b — zabite).
- Ocena wzrokowa: `NIE_ZMIERZONO` (brak GPU), lista §7.

## 1. Zakres i rozstrzygnięcia

| Element paczki | Status w Rust | Dowód (web `edb8fb56`) |
|---|---|---|
| `improvements.ts`: `ImprovementKey`, `IMPROVEMENTS`, `buildImprovement`, `buildImprovementSectored`, `buildImprovementStack`, `SECTOR_R_ELEVATED` | `registry.rs` — port 1:1 gałęzi `roblox` | `improvements.ts:20-47,339-344,392-515,518-602` |
| `improvements.ts` klasyczny `switch` (24 `case`) i jego prywatne buildery (`farma`, `kopalnia`, `fort`, …) | **nieportowane** (Z1) | `:345-380`, `:65-337`; osiągalne tylko przy `style !== 'roblox'` |
| `robloxImprovements.ts`: 24 `BUILDERS`, `buildRobloxImprovement`, `buildRobloxFoodStack` + używane helpery (`rbxFarmHut`, `rbxFarmMiniField`, `rbxFarmSettlement`, `rbxIrygacjaLarge`, `rbxTarasy`, żywność) | `roblox.rs` | `:105-186,258-306,388-484` |
| 15 nieużywanych funkcji `rbx*` (`rbxDroga`, `rbxDrogaBrukowana`, `rbxFarma`, `rbxPastwisko`, `rbxKopalnia`, `rbxKamieniolom`, `rbxObozLowiecki`, `rbxWyrab`, `rbxTartak`, `rbxPoleIrygowane`, `rbxGlinianka`, `rbxLodzie`, `rbxWarzelniaSoli`, `rbxFort`, `rbxPosterunek`) + `addCyl` | `roblox_legacy.rs` — **port 1:1 (Obrona r1, D-MOD-3 = B)**, bitowo (`legacy.json`, 25 przypadków) | `:49-54,82-103,146-154,188-256,290-303,309-386`; `grep -c "\b<nazwa>(" robloxImprovements.ts` = 1 (tylko definicja) dla każdej — nikt ich nie woła (Z2) |
| `setImprovementDetailQuality` | brak odpowiednika (Z3) | `:33-34` — wartość nieczytana przez żaden builder |
| `ulepszenia-modele-p2.ts` (5 builderów + layout) | `p2.rs` | `:116-308,317-345` |
| `ulepszenia-modele-p3a.ts` (6 builderów + layout) | `p3a.rs` | `:133-480,490-510` |
| `ulepszenia-modele-p3b.ts` (4 budowle, `buildZlozeKlaster`, 7 złóż, layout, paleta `P3B`) | `p3b.rs` | `:137-571` |
| `kopalnia-cyny-opus5.ts`, `kopalnia-zlota-opus5.ts` (Standard + emissive, singletony, `strut`, rynna `SL_Q` w `'YXZ'`) | `kopalnie.rs` | cyna `:98-344`, złoto: cały plik |
| `droga-6-ramion.ts` + czyste funkcje `map/road-network.ts` | `droga.rs` | `droga-6-ramion.ts:50-190`, `road-network.ts:32-154` |
| `pastwisko-modele.ts` (krowa, owca, lama, layouty, `toFixed(3)`), `swinia-trzoda.ts` (świnia z `EAR`, trzoda) | `zwierzeta.rs` | całe pliki |
| `styleResources.ts` — gałąź `roblox`: `buildStyledResourceOverlay`, `placeLivestockPair/Figure`, `buildStyledCow/Sheep`, `styledCow/Sheep/Llama/Ore('roblox')`, `LIVESTOCK_FIGURE_SCALE` | `zasoby.rs` | `:444-499` i funkcje `styled*` |
| `styleResources.ts` gałęzie `civ`/`minecraft` (`styledHorse`, `horseLegacy`, `styledClay`, `styledCopperOre`, `styledIronOre`, `styledGoldOre`, `styledTinOre`, `styledCoal`, `styledSalt`, gałęzie `else` w `styled*`) | **nieportowane** (Z1) | `GAME_MAP_RENDER_STYLE` = `'roblox'` (`mapRenderStyle.ts:40`), jedyny wołający `main.ts:2862,2891` |
| `resources.ts` (`buildResourceOverlay*`) | **nieportowany** (Z1) | wołany wyłącznie z `styleResources.ts:445-449` przy `style === 'civ'` |
| `buildStyleTarasyTerrace('roblox', …)` (`mapRenderStyle.ts`, wołane przez `BUILDERS.tarasy`) | `roblox.rs` (z lokalnym `hash2D` stylu) | `mapRenderStyle.ts:345-351,885-1000` |
| Koń (`kon-nowy-model.ts`) | reużyty z MOD-04 | dispatch; `unit_core::horse` |

**ZAŁOŻENIA (luki dispatchu, przyjęte wartości domyślne):**
- **Z1. Tylko styl `roblox` — podstawa: decyzja ROZSTRZYGNIĘTA, nie otwarta** (poprawione w Obronie r1; wersja r1 błędnie podawała D-MOD-1 jako otwarte). D-RR-8 = A „portujemy tylko styl `roblox`” (`dyspozycje/rust-port/LEDGER.md:123`, gałąź dokumentacji), a D-MOD-1 jest rozstrzygnięte przez D-RR-8 = A (`LEDGER.md:127` — wpis P4.4; `LEDGER.md:128` — „Już rozstrzygnięte wcześniej: D-MOD-1 (styl tylko `roblox`, D-RR-8=A)”). Dlatego `resources.ts` (wołany wyłącznie przy `style === 'civ'`, `styleResources.ts:445-449`), gałęzie `civ`/`minecraft` w `styleResources.ts` i klasyczny `switch` w `improvements.ts` (`:345-380`, `:65-337`) **nie są portowane**, choć dispatch wymienia `resources` w paczce.
  - **Kolizja `K-MOD11-1` (jawnie, jak `D-NM-17` w `P4-7-NEW-MODELS-SPEC.md:524`): D-MOD-1 ↔ D-MOD-3 = B.** D-MOD-3 = B (`LEDGER.md:128`) każe „portować WSZYSTKIE istniejące modele, także nieużywane”; D-MOD-1 wyłącza style inne niż `roblox`. Przyjmuję pierwszeństwo **D-MOD-1 jako decyzji szczegółowej** (dotyczy właśnie stylu) — tak samo, jak przyjęto w `D-NM-17` dla `buildBronzeCity`/`buildStoneAgeCity` (styl `civ`). Skutek: poza portem zostają `resources.ts` (`buildResourceOverlay*`), funkcje `styled*`/`horseLegacy` gałęzi `civ`/`minecraft` i klasyczne buildery `improvements.ts`. **Do potwierdzenia przez orkiestratora/właściciela razem z `D-NM-17`**; przy decyzji odwrotnej: osobny temat, ten sam generator (dopisać `style` do wywołań), bez zmian w tym, co już przeniesione.
- **Z2. Nieużywane funkcje `rbx*` i `addCyl` — PRZENIESIONE (Obrona r1).** Wersja r1 ich nie przenosiła z uzasadnieniem „nic ich nie wywołuje”, co jest sprzeczne z D-MOD-3 = B (`LEDGER.md:128`); to modele stylu `roblox`, więc D-MOD-1 ich nie wyklucza (brak kolizji — inaczej niż w Z1). Port: `src/models/improvements/roblox_legacy.rs` (`RbxLegacy` — 15 wariantów w kolejności pliku, `build_rbx_legacy[_into](kind, owner)`, `add_cyl`); używane nadal helpery (`addBox`, `rbxFarmHut`, `rbxFarmMiniField`, `rbxFarmSettlement`, `rbxIrygacjaLarge`) są współdzielone z `roblox.rs` (`pub(super)`), nie skopiowane. **Metoda weryfikacji:** funkcje nie są eksportowane, więc w **kopii scratch** `robloxImprovements.ts` dopisywana jest jedna linia `tests/fixtures/improvements/legacy-export.txt` (`export { addCyl, rbxDroga, … };` — sama lista eksportów, żadna instrukcja modułu się nie zmienia; `gra/**` nietknięte). Dowód nieszkodliwości: `models.json`, `sigs.json`, `data.json`, `protokeys.json` z tej kopii są bajtowo identyczne z przebiegiem bez tej linii i z fixturami r1 (`cmp`, §10). Przypadki: 13 funkcji bez właściciela + `rbxFort`/`rbxPosterunek` × 5 właścicieli (`0xffd54a`, `0x8e24aa`, `0x1234abcd`, `0`, `-1`) + `addCyl` z domyślnym i jawnym `seg` = 25 pełnych grafów, 0 różnic. Uwaga do okoliczności łagodzącej z zarzutu: komentarze „wycofany” w webie (`robloxImprovements.ts:9,416`) dotyczą `buildPastwiskoZwierzeta`, nie funkcji `rbx*`.
- **Z3.** `setImprovementDetailQuality` zapisuje zmienną modułu, której żaden builder nie czyta (`grep _improvementDetailQuality robloxImprovements.ts` → tylko `:33-34`); bez odpowiednika.
- **Z4. Typ drzewa.** `UnitModel` z `unit_core` + tablice równoległe (`NodeExt`, `MatExt`) w `improvements::model`. Materiał Lambert jest zapisany w `unit_core::model::Material` z `metalness = 0`, `roughness = 1` (Lambert ich nie ma; `MatExt::kind` mówi, które pola mają znaczenie). Geometrie spoza `Prim` (`DodecahedronGeometry`, `ConeGeometry` + `rotateY`) jako `ExtraGeo` z węzłem-zaślepką `Prim` w drzewie; `ImprovementModel::geometry()` zawsze bierze `ExtraGeo`, gdy jest. `unit_core/**` i `geom/**` bez zmian.
- **Z5. Kolor właściciela** jako `u32`: web robi `ownerCol & 0xffffff` (ToInt32 & maska) — dla całkowitych argumentów to dokładnie 24 młodsze bity `u32` (przetestowane: `0x8e24aa`, `0x1234abcd`, `0`, `-1`, `0x7fabcdef`).
- **Z6. Klucze** jako `&str` (web rzuca `k as ImprovementKey` na dowolne napisy). Nieznany klucz → pusta grupa (zmierzone: `nieznane`, `brak`, `""`, `toString`). **Klucze o nazwach składowych `Object.prototype` — ZMIERZONE (Obrona r1; w r1 było NIE_ZMIERZONO):** `gen.ts` sekcja 7 → `tests/fixtures/improvements/protokeys.json`, `buildImprovement(key)` na webie `edb8fb56`:

  | Klucz | Web | Rust |
  |---|---|---|
  | `__proto__` | wyjątek `fn is not a function` | pusta grupa |
  | `hasOwnProperty`, `valueOf`, `__defineGetter__`, `isPrototypeOf`, `propertyIsEnumerable`, `__lookupGetter__`, `__defineSetter__`, `__lookupSetter__` | wyjątek `Cannot convert undefined or null to object` | pusta grupa |
  | `toLocaleString` | wyjątek `Object.prototype.toLocaleString called on null or undefined` | pusta grupa |
  | `constructor`, `toString` | pusta grupa (graf bitowo = Rust) | pusta grupa |

  Wynik zgodny z pomiarem Evaluatora (`02-evaluator-r1.md`, zarzut 3). **Odchylenie jawne i przypięte testem** `prototype_keys_documented_deviation`: z fixtury 10 wyjątków / 2 puste grupy (asercja liczb), Rust zawsze pusta grupa (1 węzeł), dla 2 pustych grup pełne porównanie bitowe. Uzasadnienie: wyjątek w webie wynika z dziedziczenia `BUILDERS` po `Object.prototype` (artefakt JS); żaden z tych napisów nie jest kluczem ulepszenia w danych gry (`IMPROVEMENTS`, `data.json`). Jeśli orkiestrator wymaga 1:1 także tu — zmiana jednej gałęzi `_ =>` w `roblox_builder` na błąd.
- **Z7. Singletony materiałów kopalń** (`MATS` w obu modułach) są w webie globalne dla procesu; w Rust `MineMats` dzieli materiał po (moduł, kolor) w obrębie jednego modelu wynikowego. Współdzielenie widoczne w grafie (te same sloty materiałów dla powtarzanych kolorów) jest identyczne — sprawdzone w obu kopalniach osobno i razem w jednym układzie sektorowym (`sect:all`, `sect:hexR1.3`); mutacja M12 (wyłączenie cache) daje 452 różnice strukturalne. Między osobnymi modelami współdzielenie obiektu nie jest obserwowalne bez GPU. Singletony geometrii (`GEOS`) nie mają znaczenia dla danych (opis `Prim` jest wartością).
- **Z8.** `build_zloze_into(…, ZlozeTyp::Inne)` traktuje „inne” jak glinę; web nie ma takiej funkcji (`buildZlozeKlaster` z nieznanym typem → gałąź `else` = glina — to jest przetestowane).
- **Z9. `src/models.rs`** to plik-moduł (odpowiednik „`models/mod.rs`” z allowlisty); dopisana wyłącznie jedna linia `pub mod improvements;`, komentarz pliku nietknięty.

## 2. Wyprowadzenie (plik:linia, web `edb8fb56`)

### 2.1 Rejestr i układy (`improvements.ts`)

| Element web | Rust | Uwagi |
|---|---|---|
| `ImprovementKey` `:20-24` | `ImprovementKey` (24, `as_str`/`from_web`) | test: identyczne z kluczami `BUILDERS` |
| `IMPROVEMENTS` `:26-47` | `IMPROVEMENTS` (22) | klucz/etykieta/epoka porównane z `data.json` |
| `buildImprovement` `:339-344` | `build_improvement(key, owner)` → `roblox::roblox_builder` | `style` stały `'roblox'` (Z1) |
| `SECTOR_R`, `SECTOR_SCALE`, `SECTOR_R_ELEVATED` `:392-402` | stałe | |
| `najnizszaPowierzchniaPod` `:417-425` | `najnizsza_powierzchnia_pod` | `Math.min` z propagacją NaN (`js_min_nan`), `Number.isFinite` → `Math.max(0, y)` |
| `CAT_ANGLE_DEG`, zbiory kluczy, `improvementSectorAngle` `:426-452` | `improvement_sector_angle` | ta sama kolejność warunków |
| `buildImprovementSectored` `:458-515` | `build_improvement_sectored(keys, owner, hexR, &SectorRelief, roadMask)` | droga najpierw (bruk > grunt); `Map` w kolejności wstawień; `Box3.setFromObject` **nieprecyzyjny** (bbox geometrii × `matrixWorld`, 8 narożników w kolejności Three) → `ImprovementModel::box_from_object`; `position.x -= c.x` jako odejmowanie (nie negacja — różnica `±0`); `scale.multiplyScalar(0.5)` dla fortów |
| `buildImprovementStack` `:518-602` | `build_improvement_stack` | w `roblox` każdy niepusty `foodKeys` daje niepusty `buildRobloxFoodStack`, więc gałęzie `:537-597` są nieosiągalne (Z1) |

### 2.2 Pozostałe pliki

| Element web | Rust | Uwagi |
|---|---|---|
| `BUILDERS` `robloxImprovements.ts:388-427` | `roblox_builder` (`match`) | `kopalnia_zelaza` i `kopalnia_miedzi` → ten sam `buildKopalnia` + `rotY -0.95`; `pastwisko` = farma (`rotY -1.15`) + trzoda + dodatki zagrody, w tej kolejności (`g.add(f, …)`); `lama` z `position (0.63, 0, 0.04)` |
| `buildRobloxFoodStack` `:439-484` | `build_roblox_food_stack[_into]` | 9 gałęzi w tej samej kolejności; `None` = `null` |
| `box`/`addBox`/`addCyl` `:36-54` | `roblox::add_box`, `roblox_legacy::add_cyl` | `addBox`: nowy materiał na każdy klocek, cień rzucany i przyjmowany; `addCyl`: `y + h/2`, tylko cień rzucany, `seg` domyślnie 6 |
| 15 nieużywanych `rbx*` `:82-103,146-154,188-256,290-303,309-386` | `roblox_legacy::build_rbx_legacy(RbxLegacy, owner)` | dachy/namiot `ConeGeometry(r, h, 4)` + `rotation.y = π/4`; kłody `rotation.x`/`rotation.z = π/2`; `rbxFort` — wewnętrzna grupa `scale.setScalar(1/3)`; `rbxPosterunek` — `(i/n)·π·2`, pominięcie `|a − π/2| < 0.35`, `jsmath::js_cos/js_sin`; `i % 2` w `rbxDroga` dla ujemnych `i` (JS −1 → prawda) |
| `B`/`CYL`/`CONE`/`azXZ`/`tangRotY` (p2/p3a/p3b, pastwisko, świnia) | `kit::{b, cyl, cone, az_xz, tang_rot_y}` | `rotation.set` tylko gdy któryś kąt ≠ 0 (`if (rx || ry || rz)`); CONE p2/p3a (`rotation.y = ry`) = `set(0, ry, 0)` p3b |
| `buildFarma` p2 `:116-177` | `build_farma_into` | wariant ≠ `solo` zwraca samą stodołę; `solo` — stodoła jako podgrupa |
| kopalnie: `mat` (Standard, `emissive = Color(c).multiplyScalar(k)` w przestrzeni liniowej), `B` (cień rzucany + przyjmowany), `C`, `strut` (`setFromUnitVectors`, skala `(r, len, r)`), `SL_Q` (`Euler(0.40, 0.55, 0, 'YXZ')`), `sluice` (`applyQuaternion`), `BSL` (`quaternion.copy`) | `kopalnie.rs` | `applyQuaternion` przepisany operacja po operacji (three r169 `Vector3.js:252-271`); `emissive` = `SRGBToLinear(c/255) · k` |
| `buildDrogaGwiazda` + `roadPortRotationY` (`atan2`), `roadArmLength` (`√3/2·R`) | `droga.rs` | `Math.min` przy dosunięciu płyty; mikro-schodek `i · 0.0006`; węzeł przy ≥3 ramionach, placyk przy 0 |
| `az()` z `toFixed(3)` (pastwisko, trzoda) | `zwierzeta::az_fixed` | `core::jsnum::js_to_fixed3` (P4.12) + `parse::<f64>()` = `+(…)` |
| `EAR` (świnia) | `zwierzeta::ear` | `ConeGeometry(r, h, 3).rotateY(twist)` → `ExtraGeo::TwistedCone` (`geom::Mesh::rotate_y`); `setFromUnitVectors`; `scale.z = flat` |
| `styledOre('roblox')` | `zasoby::styled_ore_into` | `DodecahedronGeometry` → `ExtraGeo::Dodecahedron`; `rotation.set(px·2, pz·3, sc)` zawsze (także dla zer) |
| `buildStyledResourceOverlay(n, 'roblox', z)` `:444-499` | `build_styled_resource_overlay(n, Option<&str>)` | `userData.depositDisplayScale = 2` na koniach; `zloze = ''` → `null` |
| `buildStyleTarasyTerrace` → `addSteppedTerraceHill(…, 'cultivated')` | `build_style_tarasy_terrace[_into]` | `hash2D` z `mapRenderStyle.ts:345-351` (krótsze mieszanie niż `terrain::hash2d` ze `scene.ts` — osobna funkcja `hash2d_style`) |

### 2.3 Jak dopisać ulepszenie

1. ramię w `roblox::roblox_builder` (i ewentualnie wariant `ImprovementKey`), 2. builder `*_into(m, g, …)` w pliku odpowiadającym plikowi weba, 3. kąt sektora w `improvement_sector_angle`, 4. przypadek w `gen.ts` i w tabeli `cases()` testu, regeneracja fixtur (README).

## 3. Numeryka

- Wszystkie `Math.sin/cos/atan2` przez wspólny `crate::jsmath` (P4.16), kwaterniony Eulera przez `unit_core::model::quat_from_euler` (V8 `sin/cos`, wszystkie porządki — potrzebny `'YXZ'` rynny złota). Mutacja M3 (platformowe `sin/cos` w `azXZ`) daje **51 różnic bitowych ≤ 1e-12** — port V8 jest konieczny także tutaj. Skaner `tests/jsmath_wiring.rs` **nie obejmuje** nowego katalogu (lista katalogów `:25-28`; plik poza allowlistą). Sprawdzone ręcznie: `grep -rnE '\.(sin|cos|tan|atan2|atan|acos|asin|exp|ln|powf|powi|hypot)\(' src/models/improvements` → 1 trafienie, wyłącznie w komentarzu dokumentacyjnym (`droga.rs:75`); `sqrt`/`floor` są w IEEE dokładne. Rekomendacja na osobny temat: dopisać `src/models/improvements` do listy skanera.
- `Box3.setFromObject` nieprecyzyjny (sektory) vs precyzyjny (bbox w fixturach) — oba odtworzone; nieprecyzyjny ma znaczenie dla centrowania (M21b: 603 różnice).
- `toFixed(3)` slotów zwierząt: M15 (bez zaokrąglenia) → 2 281 różnic.

## 4. Odtworzone / pominięte

| Element | Status |
|---|---|
| 24 klucze `buildImprovement` (+ właściciele, klucze nieznane) | bitowo |
| wszystkie eksportowane buildery p2/p3a/p3b, obie kopalnie, zwierzęta (wszystkie pozy/warianty), układy pastwiska/trzody, tarasy, figury roblox, nakładki zasobów (8 `Nakladka` × 13 `zloze`) | bitowo |
| gwiazda drogi: 2 typy × 64 maski (hexR 1) + 5 masek przy hexR 0,8 | bitowo (sygnatury) |
| układ sektorowy (44 przypadki: pojedyncze klucze, mieszanki, maski dróg, hexR, `sectorR`, `surfaceY` dodatnie/ujemne/NaN), stosy (32 + 6), stosy żywności (18) | bitowo (sygnatury) |
| 15 nieużywanych `rbx*` + `addCyl` (D-MOD-3 = B) | bitowo (`legacy.json`, 25 przypadków; Obrona r1) |
| klucze `Object.prototype` (12) | zachowanie weba zmierzone, odchylenie przypięte testem (Z6) |
| styl `civ`/`minecraft`, `resources.ts`, `setImprovementDetailQuality` | pominięte (Z1 + kolizja `K-MOD11-1`, Z3) |
| `dispose*Geometrie`, `material.dispose` | brak zasobów GPU — bez odpowiednika |
| Lambert/Standard cieniowanie, cienie, mgła, rysowanie, `collapseToMergedMesh` | poza zakresem (RR-T5) — `NIE_ZMIERZONO` |

API dla tematu GPU: `ImprovementModel::subtree(ROOT)` → `(NodeId, matrixWorld)`, `geometry(id)` → `geom::Mesh`, `tree.materials[i]` + `mat_ext[i]` (rodzaj, emissive), `node_ext[id]` (cienie, `userData`).

## 5. Test mutacyjny (skrypt §8.3; każda mutacja na kopii pliku, potem przywrócenie; wykonane na drzewie `acb1915e`)

```
M1-kit-shadow-recv KILLED models: cases=432: scalars=173070 bit_diff=0 within_1e-12=0 struct_diff=3681
M2-az-sign KILLED models: cases=432: scalars=173070 bit_diff=1461 within_1e-12=189 struct_diff=53
M3-trig-platform KILLED models: cases=432: scalars=173070 bit_diff=51 within_1e-12=51 struct_diff=8
M4-sector-scale KILLED models: cases=432: scalars=173070 bit_diff=2189 within_1e-12=7 struct_diff=41
M5-center-negate KILLED models: cases=432: scalars=173070 bit_diff=2 within_1e-12=2 struct_diff=16
M6-surface-max KILLED models: cases=432: scalars=173070 bit_diff=2 within_1e-12=0 struct_diff=1
M7-road-step KILLED models: cases=432: scalars=173070 bit_diff=329 within_1e-12=0 struct_diff=135
M8-road-min KILLED models: cases=432: scalars=173070 bit_diff=227 within_1e-12=0 struct_diff=73
M9-tarasy-hash KILLED models: cases=432: scalars=171238 bit_diff=37 within_1e-12=1 struct_diff=19
M10-food-swap KILLED models: cases=432: scalars=173070 bit_diff=40 within_1e-12=0 struct_diff=50
M11-emissive KILLED models: cases=432: scalars=173070 bit_diff=24 within_1e-12=0 struct_diff=7
M12-cache-off KILLED models: cases=432: scalars=172060 bit_diff=0 within_1e-12=0 struct_diff=452
M13-sluice-quat KILLED models: cases=432: scalars=173070 bit_diff=678 within_1e-12=0 struct_diff=6
M14-ear-twist KILLED models: cases=432: scalars=173070 bit_diff=148 within_1e-12=0 struct_diff=66
M15-tofixed KILLED models: cases=432: scalars=173070 bit_diff=2281 within_1e-12=0 struct_diff=31
M16-ore-dodeca-detail KILLED models: cases=432: scalars=173070 bit_diff=16 within_1e-12=0 struct_diff=18
M17-konie-dds KILLED models: cases=432: scalars=173070 bit_diff=4 within_1e-12=0 struct_diff=4
M18-fort-mask KILLED models: cases=432: scalars=173070 bit_diff=0 within_1e-12=0 struct_diff=2
M19-stack-nonfood KILLED models: cases=432: scalars=169574 bit_diff=157 within_1e-12=0 struct_diff=161
M20-lambert-flat KILLED models: cases=432: scalars=173070 bit_diff=0 within_1e-12=0 struct_diff=1936
M21-box3-corner SURVIVED
M22-graft-mat SURVIVED
M23-stadnina-scale KILLED models: cases=432: scalars=173070 bit_diff=2844 within_1e-12=9 struct_diff=9
M24-sector-angle KILLED models: cases=432: scalars=173070 bit_diff=7 within_1e-12=0 struct_diff=5
M21b-box3-no-transform KILLED models: cases=432: scalars=173070 bit_diff=603 within_1e-12=0 struct_diff=36
M22b-graft-skip-root-child KILLED models: cases=432: scalars=169386 bit_diff=0 within_1e-12=0 struct_diff=4
```
24 z 26 zabitych. Przeżyły dwa mutanty **równoważne na danych testowych** (nie luki testu):
- M21 (narożnik `001` zastąpiony `000` w `Box3::apply_matrix4`): przy macierzach z obrotem tylko wokół Y i skalą dodatnią minimum/maksimum osi wyznaczają pozostałe narożniki; zastąpiony M21b (brak transformacji narożników) — zabity (603 różnice).
- M22 (`material += 0` przy przeszczepie konia): przeszczep następuje do modelu bez wcześniejszych materiałów, więc offset wynosi 0; zastąpiony M22b (pominięcie podpięcia dzieci korzenia) — zabity.

## 6. Wektory testowe i pochodzenie

Generator `rust-port/renderer/tests/fixtures/improvements/gen.ts` uruchomiony **poza repo** (scratch sesji, usunięty po pracy): `three@0.169.0` (integrity `sha512-Ed906MA3dR4TS5riErd4QBsRGPcx+HBDX2O5yYE5GqJeFQTPU+M56Va/f/Oph9X7uZo3W3o4l2ZhBZ6f6qUv0w==`, identyczna z `gra/package-lock.json` na `edb8fb56` — `git show edb8fb56:gra/package-lock.json`), `esbuild@0.24.0`, `git archive edb8fb56 gra/src gra/data`, node v22.22.0. Moduły weba importowane **bez zmian**. Stdout: `improvements full=195 sigs=237`. Drugi przebieg: `data.json`, `models.json`, `sigs.json` identyczne bajtowo (`cmp`).

SHA-256 plików weba (z `git archive edb8fb56`):

| Plik | SHA-256 |
|---|---|
| `render/improvements.ts` | `c9d80c6a742a5f0fd14d0fc117465653aba5526695b5fffaf5f8917dff90b100` |
| `render/robloxImprovements.ts` | `283c1cc3f347d210ebf207709caa5af064beaed7abc7c3bb76258b4fdbe4c735` |
| `render/ulepszenia-modele-p2.ts` | `ff472623b143b4f01410b37dbf853f3821bb4c911b6b36b2f23af5bfd090236c` |
| `render/ulepszenia-modele-p3a.ts` | `2c6376c5ee863d18bc37fd8f8a973f395c1d6e383c7010cc258666b1f0d7e4d6` |
| `render/ulepszenia-modele-p3b.ts` | `1f30d14179b1cba0a12b54b588dce0e65f7198f509a9d94a0afb655c8bfaf752` |
| `render/kopalnia-cyny-opus5.ts` | `7eace072c1a35f73b62fd53acc785dee45ddd974407e1c081cc257b6e77b0c75` |
| `render/kopalnia-zlota-opus5.ts` | `9e3e44f2b5172184a56f9960547ee487dda4ac6455e9cac17f30b73e6a811fab` |
| `render/droga-6-ramion.ts` | `4d60963b505f038c2e5f4331c5b08b2291d2eabdb5b312007caff34f3467c398` |
| `render/pastwisko-modele.ts` | `f52dd29328d3ec7d1a6be078182dbd610d5deaeeda6345bb88771967af43aef9` |
| `render/swinia-trzoda.ts` | `1dc7c42213b817258a8e7cbceefe81bbde9e417e53af2dbf9febe8d23e8cb1fa` |
| `render/styleResources.ts` | `8f7a7fab2365e562c775b7c77d8329eb54d87ed8510741d73f0a809c56b48ec4` |
| `render/mapRenderStyle.ts` | `748daa579e980f05f34f5029293cb775c60aa6d1b36a80a4f444b99174786d91` |
| `render/kon-nowy-model.ts` | `e08eebc882d4ac8ce12ad5b475faa66b12d3161b019ec792e5b4165db520a9c5` |
| `map/road-network.ts` | `d3283ded62ef5dfaeb699b6b78de0ff8ce8c9102674dece9c80e40ad89a7f997` |
| `types/hex.ts` | `07eb0ee905c2aac56c1f99127f36fd2a058a9d2822bbc4c92d753d9056867df1` |

Fixtury (`rust-port/renderer/tests/fixtures/improvements/`):

| Plik | Rozmiar | SHA-256 |
|---|---:|---|
| `gen.ts` | 19 398 | `ae32fe381f0aa58ede7c627576ef28cbabd5191c7488c7a3eebebab12b6d087a` |
| `models.json` | 2 308 163 | `4f27e823efee9ce847b12c079d0c5f98f8540cabc614d94682a90a3becc37453` |
| `sigs.json` | 56 409 | `f45443e9e7a19ec1409155bda6a30446823a3257919ab683eba50ca6764e8494` |
| `data.json` | 5 061 | `d908702a607eb3c9bac9b9e691ccd0e37fac82ebbed402cca4c0c23a7a73b049` |

Łącznie ok. 2,4 MB (< 8 MB); niczego nie pominięto (przypadki kombinatoryczne zapisane jako sygnatury FNV-1a nad tymi samymi skalarami co pełny zrzut — rozbieżność jest wykrywana, lokalizacja wymaga zrzutu pełnego, który daje ten sam generator). `models.json`: 195 modeli / 5 590 węzłów / 4 918 meshy; `sigs.json`: 237 modeli / 10 486 węzłów / 9 120 meshy; 8 przypadków `null` (zasoby bez nakładki i złoża, stos żywności bez klucza żywności).

Liczby kontrolne 24 ulepszeń (meshe / trójkąty, z `models.json`): droga 32/408, droga_brukowana 44/552, farma 35/416, bydlo 38/444, owce 32/384, lama 17/204, stadnina 64/796, kopalnia_zelaza 23/300, kamieniolom 21/264, oboz_lowiecki 33/398, wyrab 25/372, tartak 25/384, irygacja 37/468, pole_irygowane 40/480, glinianka 29/396, tarasy 16/312, lodzie_rybackie 32/384, warzelnia_soli 27/332, fort 35/416, posterunek 35/428, pastwisko 65/764, kopalnia_miedzi 23/300, kopalnia_zlota 57/992, kopalnia_cyny 56/944.

Testy: `tests/improvements_web_parity.rs` — `models_are_bit_identical_to_web` (432 przypadki r1 + 25 z `legacy.json` = **457**; asercja, że każdy przypadek Rust ma wpis w fixturach i odwrotnie), `data_tables_match_web`, `prototype_keys_documented_deviation` (Obrona r1).

**Fixtury dodane/zmienione w Obronie r1** (`models.json`/`sigs.json`/`data.json` bez zmian, sumy jak wyżej; `gen.ts` zastąpiony nową wersją z sekcjami 6–7):

| Plik | Rozmiar | SHA-256 |
|---|---:|---|
| `gen.ts` | 22 103 | `73dacdeaf2d5337eb11f5beaea46fd0c7af142394992d3bda27bd74dcc4620b5` |
| `legacy.json` | 215 058 | `d84e1c84e237cb6ed5b156887e7772e952669203fde643af5bdd66b891a5b00c` |
| `protokeys.json` | 1 427 | `38d666bd853aefa66ab3ccb3ffee7117aaa60cabc5c75c22a1cb89944d150a40` |
| `legacy-export.txt` | 224 | `36d43fae96e735b68de07f1c25b4ea6a1813a46a1ff8b01f9a27d212c1266402` |

`legacy.json`: 25 modeli / 548 węzłów / 516 meshy. Liczby kontrolne (meshe/trójkąty): rbxDroga 27/324, rbxDrogaBrukowana 33/396, rbxFarma 18/208, rbxPastwisko 47/584, rbxKopalnia 9/160, rbxKamieniolom 6/92, rbxObozLowiecki 7/96, rbxWyrab 6/136, rbxTartak 5/80, rbxPoleIrygowane 84/1000, rbxGlinianka 7/164, rbxLodzie 7/92, rbxWarzelniaSoli 13/152, rbxFort 16/184, rbxPosterunek 33/448, addCyl 1/24 (seg 6) i 1/36 (seg 9).

## 7. `NIE_ZMIERZONO` — do oceny wzrokiem po RR-T5 (GPU)

1. Każde z 24 ulepszeń z kamery gry (52°, azymut 0) na heksie odpowiedniego terenu — sylwetka, czytelność, kolory Lambert flat vs web.
2. Układ sektorowy (`SECTOR_SCALE` 0,30, `SECTOR_R` 0,72 / 0,86 na wzgórzach i górach) z prawdziwym `surfaceY` terenu — czy nic nie wisi/tonie.
3. Gwiazda drogi: szwy na portach między heksami, mikro-schodki 0,6 mm (z-fighting), bruk vs grunt na styku.
4. Kopalnie złota/cyny: Standard (metalness/roughness) i emissive żaru/złota przy oświetleniu gry; cienie rzucane/przyjmowane.
5. Zwierzęta (krowa/owca/świnia/lama/koń) w skali mapy, pozy pasąca/skubiąca/ryjąca; uszy świni (stożek 3-boczny po `rotateY`).
6. Nakładki zasobów (złoża) obok miast/ulepszeń; `depositDisplayScale = 2` koni (konsumpcja w `main.ts` — poza MOD-11).
7. Łodzie rybackie na heksie wody (y = 0,015) — czy kadłuby nie znikają w tafli.
8. (Obrona r1) 15 modeli `rbx*` z `roblox_legacy.rs` — w grze nieużywane; ocenić tylko, jeśli zostaną gdzieś podpięte.
Dodatkowo: libm Windows/macOS nie wpływa na pozycje (wszystko przez `jsmath`), ale `geom` dla walców/stożków o innej liczbie segmentów niż w fixturach nie jest tu dowiedziony (ryzyko jak w P4.14 §3).

## 8. Bramki i skrypty

### 8.1 Polecenia
`cd rust-port/renderer` na commicie `acb1915e`; skrypt §8.4. Wynik zbiorczy: fmt EXIT=0, clippy EXIT=0, clippy `--features gpu` EXIT=0 (oba po `touch src/lib.rs`, więc z rzeczywistym `Checking`), `cargo test --locked --all-targets` EXIT=0 (18 binarek testowych: lib + 17 plików `tests/*.rs`, w tym `improvements_web_parity` 2/2), test MOD-11 z `--nocapture` EXIT=0.

### 8.2 Surowe logi bramek
Pełny, nieobcięty zapis w §9.

### 8.3 Skrypt mutacyjny (scratch, wykonany z `rust-port/renderer`)

```bash
#!/bin/bash
# Mutation check for R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1; run from rust-port/renderer.
D=src/models/improvements
BAK=$(mktemp)
run() {
  cp "$2" "$BAK"; sed -i "$3" "$2"
  if cmp -s "$2" "$BAK"; then echo "$1 NOT-APPLIED"; return; fi
  out=$(cargo test --locked --test improvements_web_parity -- --nocapture 2>&1); cp "$BAK" "$2"
  if echo "$out" | grep -q "test result: ok. 2 passed"; then echo "$1 SURVIVED"
  else echo "$1 KILLED $(echo "$out" | grep -o 'models: cases=[0-9]*: scalars=[0-9]* bit_diff=[0-9]* within_1e-12=[0-9]* struct_diff=[0-9]*' | head -1)"; fi
}
run M1-kit-shadow-recv $D/kit.rs '0,/m.shadows(id, true, false);/s//m.shadows(id, true, true);/'
run M2-az-sign $D/kit.rs 's/(r \* js_sin(a), -r \* js_cos(a))/(r * js_sin(a), r * js_cos(a))/'
run M3-trig-platform $D/kit.rs 's/(r \* js_sin(a), -r \* js_cos(a))/(r * a.sin(), -r * a.cos())/'
run M4-sector-scale $D/registry.rs 's/pub const SECTOR_SCALE: f64 = 0.30;/pub const SECTOR_SCALE: f64 = 0.31;/'
run M5-center-negate $D/registry.rs 's/n.position.x -= c.x;/n.position.x = -c.x;/'
run M6-surface-max $D/registry.rs 's/js_max_nan(0.0, y)/y/'
run M7-road-step $D/droga.rs 's/\* 0.0006;/* 0.0007;/'
run M8-road-min $D/droga.rs 's/len - plyta_len \/ 2.0,/len,/'
run M9-tarasy-hash $D/roblox.rs 's/h = h.wrapping_mul(0x2c1b_3c6d);/h = h.wrapping_mul(0x2c1b_3c6e);/'
run M10-food-swap $D/roblox.rs '/} else if f \&\& i {/{n;s/rbx_irygacja_large(m, g);/rbx_farm_settlement(m, g, true);/}'
run M11-emissive $D/kopalnie.rs 's/scaled(hex_to_linear(color), 0.35)/scaled(hex_to_linear(color), 0.36)/'
run M12-cache-off $D/kopalnie.rs 's/cache.0.get(&(mine, color))/cache.0.get(\&(mine, color)).filter(|_| false)/'
run M13-sluice-quat $D/kopalnie.rs 's/order: EulerOrder::Yxz,/order: EulerOrder::Xyz,/'
run M14-ear-twist $D/zwierzeta.rs 's/const EAR_TWIST: f64 = PI \/ 3.0;/const EAR_TWIST: f64 = PI \/ 3.01;/'
run M15-tofixed $D/zwierzeta.rs 's/js_to_fixed3(v).parse::<f64>().unwrap_or(f64::NAN)/v/'
run M16-ore-dodeca-detail $D/zasoby.rs '0,/                detail: 0,/s//                detail: 1,/'
run M17-konie-dds $D/zasoby.rs 's/deposit_display_scale: Some(2.0),/deposit_display_scale: Some(1.0),/'
run M18-fort-mask $D/p3b.rs '0,/owner_col \& 0x00ff_ffff/s//owner_col/'
run M19-stack-nonfood $D/registry.rs 's/for \&k in norm.iter().filter(|k| !food.contains(k)) {/for \&k in norm.iter() {/'
run M20-lambert-flat $D/model.rs 's/self.lambert_mat(color, true)/self.lambert_mat(color, false)/'
run M21-box3-corner $D/model.rs 's/Vec3::new(a.x, a.y, b.z),/Vec3::new(a.x, a.y, a.z),/'
run M22-graft-mat $D/model.rs 's/md.material += mat_base;/md.material += 0;/'
run M23-stadnina-scale $D/p3a.rs 's/set_scale_scalar(0.56)/set_scale_scalar(0.57)/'
run M24-sector-angle $D/registry.rs 's/"oboz_lowiecki" => 30.0,/"oboz_lowiecki" => 240.0,/'
rm -f "$BAK"
```
(M21b i M22b — tym samym `run()` z drugiego pliku:)
```bash
run M21b-box3-no-transform $D/model.rs 's/out.expand_by_point(p.apply_mat4(m));/out.expand_by_point(p);/'
run M22b-graft-skip-root-child $D/model.rs 's/self.tree.nodes\[parent\].children.push(map(k));/let _ = map(k);/'
```

### 8.4 Skrypt bramek (scratch)

```bash
#!/bin/bash
# Gate script for R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1; run from rust-port/renderer.
echo '$ git rev-parse HEAD'; git rev-parse HEAD
echo '$ cargo fmt --all -- --check'; cargo fmt --all -- --check 2>&1; echo "EXIT=$?"
touch src/lib.rs; echo '$ cargo clippy --locked --all-targets -- -D warnings'; cargo clippy --locked --all-targets -- -D warnings 2>&1; echo "EXIT=$?"
touch src/lib.rs; echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'; cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1; echo "EXIT=$?"
echo '$ cargo test --locked --all-targets'; cargo test --locked --all-targets 2>&1; echo "EXIT=$?"
echo '$ cargo test --locked --test improvements_web_parity -- --nocapture'; cargo test --locked --test improvements_web_parity -- --nocapture 2>&1; echo "EXIT=$?"
```

## 9. Surowe logi bramek (commit `acb1915e`)

```text
$ git rev-parse HEAD
acb1915ee35f8b642a1ed7120ed4ee5d9de638bb
$ cargo fmt --all -- --check
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_abfb7ff0-c37-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.81s
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_abfb7ff0-c37-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.00s
EXIT=0
$ cargo test --locked --all-targets
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_abfb7ff0-c37-1/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 2.45s
     Running unittests src/lib.rs (target/debug/deps/civ_renderer-3390857ab33a1fe3)

running 7 tests
test core::jsnum::tests::to_fixed3_matches_node ... ok
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok
test jsmath::words::tests::words_round_trip ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (target/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test new_game_frees_everything_and_restarts_identically ... [LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959ok

[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
test leak_m3_also_retains_battle_scene_resources ... ok
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
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
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
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

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/assets_registry.rs (target/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test budget_thresholds_are_configurable ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test cache_lru_by_entries_and_bytes ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test owned_guards_count_references ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test handle_from_another_registry_is_rejected ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test live_report_lists_labels ... ok
test reference_counting_frees_on_last_release ... ok
test scope_releases_everything_it_created_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (target/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test drag_and_wheel_do_not_depend_on_dt ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test camera_controller_matches_web_100_percent ... ok
test fixture_covers_every_branch ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/core_web_parity.rs (target/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
test hex_shape_matches_web ... ok
test fog_dim_matches_web ... ok
test map_style_matches_web ... ok
test hexutil_matches_web ... ok
test vitals_match_web ... ok
test bronze_city_types_match_web ... ok
test merge_decor_matches_web ... ok
test zoom_lod_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

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
test parity_cylinder ... ok
test parity_extrude ... ok
test parity_plane ... ok
test parity_ops ... ok
test parity_ring ... ok
test parity_shape ... ok
test parity_torus ... ok
test trs_matches_manual_composition ... ok
test parity_polyhedron ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/gpu_probe.rs (target/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements_web_parity.rs (target/debug/deps/improvements_web_parity-7642b2e4c63525aa)

running 2 tests
test data_tables_match_web ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.91s

     Running tests/jsmath_v8_parity.rs (target/debug/deps/jsmath_v8_parity-fee50190cb35806f)

running 13 tests
test compatibility_paths_are_the_same_functions ... ok
test atan_matches_v8 ... ok
test acos_matches_v8 ... ok
test atan2_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test cos_matches_v8 ... ok
test exp_matches_v8 ... ok
test hypot_matches_v8 ... ok
test log_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test pow_matches_v8 ... ok
test sin_matches_v8 ... ok
test tan_matches_v8 ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/jsmath_wiring.rs (target/debug/deps/jsmath_wiring-b0f96cca402d817c)

running 4 tests
test scanner_catches_known_bypass_forms ... ok
test terrain_rotation_uses_v8_trig ... ok
test geom_rotation_and_euler_use_v8_trig ... ok
test no_platform_transcendentals_in_js_mirroring_modules ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/pick_golden.rs (target/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test client_rect_to_ndc_matches_web ... ok
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.40s

     Running tests/terrain_web_parity.rs (target/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.22s

     Running tests/unit_core_json.rs (target/debug/deps/unit_core_json-b55ab56d4e2236c3)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (target/debug/deps/unit_core_model_rule-2f5305891471a8dc)

running 7 tests
test pending_registry_is_explicit ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test norm_name_and_culture_match_the_web ... ok
test web_signature_classes_equal_rust_model_id_classes ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s

     Running tests/unit_core_trig.rs (target/debug/deps/unit_core_trig-30b01be29ad89d90)

running 2 tests
test quat_from_euler_honours_every_order ... ok
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_core_web_parity.rs (target/debug/deps/unit_core_web_parity-eb9ca6d0cfd9b82c)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.22s

     Running tests/wonders_web_parity.rs (target/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s

EXIT=0
$ cargo test --locked --test improvements_web_parity -- --nocapture
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.04s
     Running tests/improvements_web_parity.rs (target/debug/deps/improvements_web_parity-7642b2e4c63525aa)

running 2 tests
data: scalars=35 bit_diff=0 within_1e-12=0 struct_diff=0
test data_tables_match_web ... ok
models: cases=432: scalars=173070 bit_diff=0 within_1e-12=0 struct_diff=0
test models_are_bit_identical_to_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.95s

EXIT=0
```

## 10. Obrona r1 (odpowiedź na `02-evaluator-r1.md`, FAIL, 3 zarzuty)

Stan wyjściowy: commit Evaluatora `4a2bdea6` (na `4e96a7e8` → `acb1915e` → `bf59164b`). Allowlista dotrzymana: zmiany wyłącznie w `rust-port/renderer/src/models/improvements/**` (nowy `roblox_legacy.rs`, `mod.rs` +1 moduł + opis, `roblox.rs` — 5 funkcji `pub(super)`), `tests/improvements_web_parity.rs`, `tests/fixtures/improvements/**`, ten dokument i `dyspozycje/autobot/runs/R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1/**`. `src/models.rs`, `lib.rs`, `Cargo.toml`, `Cargo.lock`, `unit_core/**`, `geom/**`, `gra/**` bez zmian.

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | Z2: 15 `rbx*` + `addCyl` nieprzeniesione wbrew D-MOD-3 = B | **PRZYJMUJĘ** — przeniesione | `roblox_legacy.rs` (449 linii); `legacy.json` 25 pełnych grafów z kodu weba (metoda: jedna linia `export {…}` w kopii scratch, §1 Z2); `models: cases=457 … bit_diff=0 struct_diff=0`; mutacje niżej |
| 2 | Z1: D-MOD-1 podane jako otwarte; brak jawnej kolizji z D-MOD-3 = B | **PRZYJMUJĘ** — podstawa poprawiona, kolizja nazwana `K-MOD11-1` (wzór `D-NM-17`) | §1 Z1 (`LEDGER.md:123,127,128`); zakres nieportowany bez zmian (`resources.ts`, `civ`/`minecraft`, klasyczny `switch`) — do potwierdzenia przez orkiestratora razem z `D-NM-17` |
| 3 | Z6 mierzalne, zostało NIE_ZMIERZONO | **PRZYJMUJĘ** — zmierzone i przypięte testem | `gen.ts` sekcja 7 → `protokeys.json` (12 kluczy: 10 wyjątków, 2 puste grupy; wyniki = pomiar Evaluatora); test `prototype_keys_documented_deviation`: `proto keys: threw=10 empty=2: scalars=52 bit_diff=0 struct_diff=0` |

Uwagi Evaluatora bez zarzutu (do wiedzy orkiestratora, bez zmian): `tests/jsmath_wiring.rs` nie skanuje `src/models/improvements` (poza allowlistą; nowy plik `roblox_legacy.rs` używa wyłącznie `jsmath::js_cos/js_sin`; `grep -nE '\.(sin|cos|tan|atan2)\(' src/models/improvements/roblox_legacy.rs` → 0 trafień); ocena wzrokowa NIE_ZMIERZONO (brak GPU) — do listy §7 dochodzi pkt 8: 15 modeli `rbx*` (nieużywane w grze; ocena tylko, jeśli zostaną gdzieś podpięte).

### 10.1 Generator (scratch poza repo, usunięty po pracy)

Skrypt: `git archive edb8fb56 gra/src gra/data` → kopia; przebieg A bez zmian, przebieg B z dopisaną linią `legacy-export.txt` (dwukrotnie). Surowy wynik:

```
283c1cc3f347d210ebf207709caa5af064beaed7abc7c3bb76258b4fdbe4c735  …/websrc/gra/src/render/robloxImprovements.ts
== plain
improvements full=195 sigs=237 legacy=0
EXIT=0
plain/models.json == fixture
plain/sigs.json == fixture
plain/data.json == fixture
== legacy export
484a485
> export { addCyl, rbxDroga, rbxDrogaBrukowana, rbxFarma, rbxPastwisko, rbxKopalnia, rbxKamieniolom, rbxObozLowiecki, rbxWyrab, rbxTartak, rbxPoleIrygowane, rbxGlinianka, rbxLodzie, rbxWarzelniaSoli, rbxFort, rbxPosterunek };
improvements full=195 sigs=237 legacy=25
EXIT=0
improvements full=195 sigs=237 legacy=25
EXIT=0
legacy/models.json == fixture
legacy/sigs.json == fixture
legacy/data.json == fixture
legacy.json deterministic
models plain==legacy
sigs plain==legacy
data plain==legacy
protokeys plain==legacy
```

(`sha256` pliku weba = §6, czyli kopia przed dopisaniem linii jest identyczna z pinem.)

### 10.2 Mutacje `roblox_legacy.rs` (każda na kopii pliku, potem przywrócenie; `cmp` z kopią zapasową = identyczny)

```
L2: KILLED models: cases=457: scalars=192046 bit_diff=0 within_1e-12=0 struct_diff=63     (addCyl receiveShadow=true)
L3b: KILLED models: cases=457: scalars=192046 bit_diff=540 within_1e-12=0 struct_diff=5   (fort scale 1/3 -> 0.333)
L4: KILLED models: cases=457: scalars=192046 bit_diff=12 within_1e-12=0 struct_diff=5     (i % 2 != 0 -> == 1, ujemne i)
L5: KILLED models: cases=457: scalars=192046 bit_diff=0 within_1e-12=0 struct_diff=2      (posterunek bez & 0xffffff)
L6: KILLED models: cases=457: scalars=192046 bit_diff=19 within_1e-12=0 struct_diff=1     (tartak rot_z -> rot_x)
L7b: KILLED models: cases=457: scalars=186086 bit_diff=0 within_1e-12=0 struct_diff=5     (próg 0.35 -> 0.20)
L8: KILLED models: cases=457: scalars=192046 bit_diff=12 within_1e-12=0 struct_diff=3     (pastwisko hut scale 0.88 -> 0.89)
L1: SURVIVED  (js_cos -> f64::cos w rbxPosterunek)
L3: SURVIVED  (1.0 / 3.0 -> 0.333_333_333_333_333_3)
L7: SURVIVED  (próg 0.35 -> 0.30)
```

Przeżyłe = mutanty równoważne, nie luki testu: L3 — literał `0.333_333_333_333_333_3` to dokładnie ten sam `f64` co `1.0 / 3.0` (najkrótszy zapis round-trip); L7 — kąty `i/14·2π` najbliższe `π/2` mają `|a − π/2| ≈ 0.224` (i = 3, 4) lub ≥ 0.673, więc każdy próg w (0.224, 0.673) daje ten sam wynik (L7b z 0.20 zabity); L1 — dla 14 kątów tego modelu platformowy `cos/sin` daje te same bity co V8 (jak M3 dla innych miejsc: różnice pojawiają się dopiero przy innych argumentach; `jsmath` zostaje dla zasady P4.16).

### 10.3 Bramki (worktree Obrony, przed commitem; `touch src/lib.rs` przed każdym clippy)

```
== cargo fmt --all -- --check
EXIT=0
== cargo clippy --locked --all-targets -- -D warnings
    Checking civ-renderer v0.1.0 (…/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.07s
EXIT=0
== cargo clippy --locked --all-targets --features gpu -- -D warnings
    Checking civ-renderer v0.1.0 (…/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 29.61s
EXIT=0
== cargo test --locked --all-targets
EXIT=0
18          (binarek z "test result: ok")
0           (binarek z "test result: FAILED")
data: scalars=35 bit_diff=0 within_1e-12=0 struct_diff=0
proto keys: threw=10 empty=2: scalars=52 bit_diff=0 within_1e-12=0 struct_diff=0
models: cases=457: scalars=192046 bit_diff=0 within_1e-12=0 struct_diff=0
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```
