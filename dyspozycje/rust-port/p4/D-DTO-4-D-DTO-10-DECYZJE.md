# D-DTO-4 i D-DTO-10 — decyzje kontraktu DTO renderera według webu

**Temat:** `R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1` · **Domena:** GAME (renderer DTO, dokument) · **Rola:** Operator r1
**Baza:** `f7baa3848` (= `origin/rust-port/parity-v2`). Zero zmian kodu.
**Źródła (tylko odczyt):**
- definicje decyzji: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` na `origin/claude/rust-sivvrn` (`0c3f7a0a1`), §3.2 (`:231`, `:215`), §3.3 (`:239-241`), §7 (`:437`, `:443`);
- web: pin `07d2fbd72`, `git show 07d2fbd72:gra/src/...` (ścieżki niżej bez prefiksu `gra/src/`);
- Rust: drzewo bazy `f7baa3848` (`rust-port/...`).

**Zasada 11 (web najpierw):** obie decyzje dotyczą formy danych na granicy silnik → renderer. Web ustala **zachowanie** (jakie dane, z jakich wejść, jaką regułą). Gdzie web to rozstrzyga, decyzja idzie za webem. Kodowanie bajtów na granicy jest wyborem technicznym (zasada 9), więc nie wymaga pytania ABC, jeśli zachowuje semantykę webu.

**Legenda:** `plik:linia` = odczyt z pinu; **BRAK** = sprawdzono `grep`, w Rust nie ma; **NIE_ZMIERZONO** = nie sprawdzono, bez wniosku.

---

## 1. D-DTO-4 — kto liczy pola pochodne (reguła czy geometria)

### 1.1 Pytanie (kontrakt §7, `:437`)

Pięć pól pochodnych: `roadMask`, trasy rzek do renderu (`land`/`medium`/`trim…RenderPath`), `terraces`, `coveringImprovement`, obozy oblężnicze.
- A: wszystkie liczy silnik (producent widoku).
- B: silnik liczy reguły, renderer liczy geometrię tras rzek.
- C: wszystko w rendererze.

Rekomendacja kontraktu: A.

### 1.2 Odczyt webu (pin `07d2fbd72`)

| Pole | Gdzie web ma funkcję (moduł) | Kto ją woła w webie | Wejścia |
|---|---|---|---|
| `roadMask` | `computeRoadMask` — `map/road-network.ts:75-86`; kierunki `ROAD_DIRS` `:32-34` (`[+1,0],[+1,-1],[0,-1],[-1,0],[-1,+1],[0,+1]`, bit i = kierunek i) | integrator `main.ts:15836` (duch budowy) i `main.ts:17083` (siatka ulepszenia); renderer dostaje gotową liczbę jako argument `buildImprovementVisual(…, mask)` | `hexHasRoadAt` (`main.ts:3144-3147`) → `hexHasRoad` (`map/road-movement.ts:64`), czyli prawdziwy stan heksów (`hex.ulepszenia`/`ulepszenie`), **bez** filtra mgły |
| `terraces` | `improvementKeysForHex` — `game/terrain-improvements.ts:358-379` (moduł reguł gry) | renderer `render/scene.ts:2469` (wzgórze bez garbu przy `tarasy`) i integrator `main.ts:17076` (`layers.includes('tarasy')`) | pola heksa `ulepszenia`/`ulepszenie` |
| `coveringImprovement` | `hexHasCoveringTerrainImprovement` — `game/terrain-improvements.ts:388-392` (= `improvementKeysForHex(hex)` zawiera klucz spoza `ROAD_IMPROVEMENT_KEYS`, `:382`) | renderer `render/cityOkolicaOverlay.ts:292` | jw. |
| trasy rzek do renderu | `landRiverRenderPath` `map/gen-helpers.ts:5411-5426`, `mediumRiverRenderPath` `:5445-5459`, `trimMediumRenderPathAtMain` `:8194-8203` (moduł generatora mapy) | renderer `render/scene.ts:1306-1318` przy budowie sceny: `trim…` dla `kind === 'medium'` z listy ścieżek `main` (`:1306`), potem `medium…` albo `land…` | wyłącznie `map.hexes[].terenBazowy`, `riverPaths`, `riverPathKinds` |
| obozy oblężnicze (`campHexes`) | brak osobnej funkcji: pętla w integratorze `main.ts:17492-17511` (`refreshSiegeMarkers`) | integrator | reguła: miasto `oblegane`, jednostka `u` z `siegeAllowedBetween(u.ownerId, c.ownerId, areEnemyOwners)` (`game/diplomacy-siege-war-gate.ts:72`) i `hexDistance(u, c) === 1` (`main.ts:17504-17505`); klucz heksa dopisywany **per jednostka** (`camps.push`, `:17506`) |

Wniosek z webu: żadna z pięciu reguł nie jest zdefiniowana w `render/`. Trzy funkcje leżą w modułach gry i mapy (`game/terrain-improvements.ts`, `map/road-network.ts`, `map/gen-helpers.ts`), a `roadMask` i obozy liczy integrator `main.ts` ze stanu gry i podaje rendererowi gotowe wartości. Renderer webu woła funkcje reguł bezpośrednio tylko dlatego, że w TS ma dostęp do całego stanu. W porcie renderer nie zależy od silnika (D-DTO-1 = A, `rust-port/view-model`), więc odpowiednikiem „funkcja z `game/`/`map/`” jest silnik.

### 1.3 Decyzja

**D-DTO-4 = A** dla wszystkich pięciu pól: liczy je silnik (producent widoku), renderer dostaje gotowe wartości.

Uzasadnienie (web): podział modułów webu (reguły w `game/` i `map/`, a nie w `render/`), wejścia wyłącznie ze stanu gry i mapy (§1.2). Rust ma już po stronie silnika większość reguł:
- `improvement_keys_for_hex` — `engine/src/domain/improvements.rs:1021`;
- `hex_has_covering_terrain_improvement` — `improvements.rs:1049`;
- `hex_has_road` — `engine/src/domain/roads.rs:46` (oraz `improvement_build.rs:1001` na `BuildHex`), `is_road_improvement_key` — `roads.rs:40`;
- `land_river_render_path` / `medium_river_render_path` — `engine/src/domain/mapgen/rivers_a.rs:397`, `:436`; pomocnicze `sanitize_river_path` `:260`, `repair_river_path_adjacency` `:317`;
- `siege_allowed_between` — `engine/src/domain/diplomacy_siege_war_gate.rs:67`.

B i C odrzucone: C przeniosłoby reguły gry do renderera (wbrew podziałowi webu i D-DTO-1). B rozdzieliłby trasy rzek od generatora, choć w webie są w `map/gen-helpers.ts` i zależą od terenu heksów, a nie od geometrii sceny.

Rodzaj decyzji: techniczna, zgodna z webem (zasada 9). Nie wymaga pytania ABC.

### 1.4 Czego brakuje w Rust (do tematu producenta, nie do tego dokumentu)

| Brak | Dowód | Temat |
|---|---|---|
| `computeRoadMask` w silniku | `grep -rn "fn compute_road_mask" engine/src` → 0 (BRAK). `ROAD_DIRS` istnieje tylko w rendererze (`renderer/src/models/improvements/droga.rs:21-22`) | P4-1B |
| `trimMediumRenderPathAtMain` i `trimMediumTailAlongMain` | `grep -rn "trim_medium" rust-port` → 0 (BRAK w obu crate'ach) | P4-1B |
| obozy z regułą wojny | kontrakt §2.1 #13 (`:158`) opisuje regułę jako „obca jednostka w odległości 1”. Web jest węższy: tylko jednostki, dla których `siegeAllowedBetween` jest prawdą (`main.ts:17503-17504`, komentarz R-WEB-AI-SIEGE-WITHOUT-WAR-Q1) | P4-1F |

### 1.5 Wpływ na typy DTO (`rust-port/view-model`, tylko odczyt)

| Pole DTO | Miejsce | Wpływ decyzji A |
|---|---|---|
| `HexDynDto.road_mask: u8` | `view-model/src/map.rs:155-156`; walidacja zakresu `validate.rs:247` | bez zmiany typu. Producent musi: (a) liczyć maskę dla **każdego** heksa, nie tylko z drogą — duch budowy w webie bierze maskę heksa, który drogi jeszcze nie ma (`main.ts:15833-15837`); (b) brać prawdziwy stan dróg sąsiadów bez filtra mgły (`main.ts:3144-3147`); (c) używać kolejności bitów `ROAD_DIRS` z `road-network.ts:32-34`, tej samej co renderer (`droga.rs:21-22`) |
| `HexDynDto.terraces: bool` | `map.rs:152` | bez zmiany; producent = `improvement_keys_for_hex(hex)` zawiera `"tarasy"` |
| `HexDynDto.covering_improvement: bool` | `map.rs:153-154` | bez zmiany; producent = `hex_has_covering_terrain_improvement` |
| `MapViewDto.river_render_paths: Vec<Vec<HexCoord>>` | `map.rs:129-131` | typ zostaje, ale brakuje niezmiennika. Renderer webu potrzebuje dla każdej trasy jej `kind` (szerokość wstęgi `scene.ts:1322-1329`) i surowej ścieżki (filtr `path.length > 512`, `:1311`; `pathReachesOpenSeaRender(map, path)`, `:1333`). Wymaganie dla producenta i walidacji: `river_render_paths.len() == rivers.len()`, indeks `i` ↔ `rivers[i]`, pusta trasa dozwolona (renderer pomija `< 2`, `:1319`). Dziś `validate.rs` nie sprawdza tej długości (`grep -n "river" view-model/src/validate.rs` → 0) — do dopisania w P4-1B albo P4-1G. Filtry `> 512`, `< 2`, `> 480` i `widthMul` to rysowanie, zostają w rendererze |
| `SiegeViewDto.camp_hexes: Vec<HexCoord>` | `view-model/src/overlays.rs:22-28` | typ bez zmiany. Producent: reguła `siege_allowed_between` + odległość 1, kolejność jednostek jak w webie (D-DTO-5). Web dopisuje klucz per jednostka, więc dwie jednostki na jednym heksie dają **duplikat** heksa. `machinesByCampHex` (`render/siegeCampSync.ts:14-27`) rozdziela maszyny regułą `campHexes[i % campHexes.length]` (`:22`), a `main.ts:17510-17512` podaje mu tablicę `camps` bez deduplikacji. Duplikaty zmieniają więc rozdział: 2 gotowe maszyny przy `[A,A,B]` → A:2, B:0; przy `[A,B]` → A:1, B:1. **Wymaganie (dowód z pinu):** producent zachowuje duplikaty i kolejność jak web; P4-1F przenosi `machinesByCampHex` 1:1 |

`MapViewDto` jest statyczny (D-DTO-3 = B), a trasy rzek zależą od `terenBazowy`. Kontrakt §3.2 (`:217`) zostawia jako **NIE_ZMIERZONO**, czy `terenBazowy` zmienia się w trakcie gry. Jeśli tak, `river_render_paths` trzeba przeliczać i wysyłać ponownie. Ta decyzja tego nie rozstrzyga.

---

## 2. D-DTO-10 — kodowanie mgły w DTO

### 2.1 Pytanie (kontrakt §7, `:443`; §3.3 `:239-241`)

- A: `Vec<u8>` równoległy do `map.hexes`, `0` nieodkryty, `1` odkryty, `2` widoczny.
- B: dwie listy `HexCoord` (`visible`, `explored`) jak wejście webu.
- C: `Vec<enum>` serializowany tekstem jak web.

Rekomendacja kontraktu: A.

### 2.2 Odczyt webu (pin `07d2fbd72`)

| Fakt | Dowód |
|---|---|
| Model gry: enum tekstowy w kolejności `Nieodkryty = 'nieodkryty'`, `Odkryty = 'odkryty'`, `Widoczny = 'widoczny'` | `types/hex.ts:60-64` |
| Wejście renderera: dwa zbiory kluczy `"q,r"` plus opcje `setFog(visible, explored, opts?: { landReveal?, riverRevealKeys? })` | `render/scene.ts:356` (interfejs), `:3526` (implementacja) |
| `explored ⊇ visible`: `explored` rośnie o aktualnie widoczne heksy tuż przed `setFog` i nigdy nie maleje | `scene.ts:3557-3559`; `main.ts:13483` (`addExplored(…, vis)`) |
| Klasyfikacja heksa ma trzy stany, z pierwszeństwem: widoczny > odkryty > ukryty | `scene.ts:3580` (`visible.has ? 0 : explored.has ? 1 : 2`); `isHidden = !visible && !explored` `scene.ts:3534` |
| Renderer webu sam trzyma wewnętrzną pamięć podręczną liczbową z odwrotną kolejnością (`0` = widoczny, `2` = ukryty) | `scene.ts:3230-3231`, `:3580`. To szczegół implementacji renderera, a nie kontrakt danych |
| Mgła wyłączona (`fogOn = false`, przełącznik dev F): `setFog(ALL_KEYS, ALL_KEYS)`, czyli wszystkie heksy widoczne | `main.ts:13505-13506`; `toggleDevFogFull` `main.ts:13577-13589` |
| `landReveal` (przełącznik dev/test M, `revealAllLand`) i `riverRevealKeys` (krąg startu przed pierwszym miastem, onboarding) idą do `setFog` jako opcje, poza dwoma zbiorami | `main.ts:13490-13494`, `:12802-12803`, `:13074-13080`; `scene.ts:3528-3531` |

Wniosek z webu: web rozstrzyga **semantykę** (trzy stany na heks, kolejność stanów w enumie, pierwszeństwo widoczny > odkryty > nieodkryty, mgła wyłączona = wszystko widoczne). Web nie ma formatu przesyłu: renderer dostaje obiekty JS w tym samym procesie. Bajtowe kodowanie na granicy to więc wybór techniczny portu (zasada 9).

### 2.3 Decyzja

**D-DTO-10 = A**: `FogViewDto.state: Vec<FogState>` równoległy do `map.hexes`, kod liczbowy `0` = `'nieodkryty'`, `1` = `'odkryty'`, `2` = `'widoczny'`.

Uzasadnienie:
- liczby to pozycje stanów w enumie webu `Widocznosc` (`types/hex.ts:60-64`), więc kodowanie wynika z webu, a nie jest wymyślone;
- adapter odtwarza wejście webu deterministycznie: `visible = {k: state == 2}`, `explored = {k: state >= 1}`. Zachowuje to `explored ⊇ visible` i pierwszeństwo z `scene.ts:3580`. Mgła wyłączona = wszystkie `2`, czyli `setFog(ALL_KEYS, ALL_KEYS)`;
- odwrotna kolejność pamięci podręcznej w `scene.ts:3230` nie wiąże kontraktu: to stan wewnętrzny renderera webu, bez wyjścia poza `buildScene`.

B odrzucone: rozmiar zależy od odkrycia mapy i trzeba ustalić kolejność list, a semantyka jest ta sama. C odrzucone: ta sama semantyka przy większym JSON (kontrakt §7: ok. 8–10 B/heks). Rodzaj decyzji: techniczna, zgodna z webem. Nie wymaga pytania ABC.

Stan wdrożenia: typ już istnieje i ma to kodowanie — `view-model/src/map.rs:159-205` (`FogState`, `code`/`from_code`, serde jako `u8`, odrzucenie kodu spoza `0..=2`), `FogViewDto` `:207-212`. Walidacja długości `fog.state == hexes.len()` jest w `view-model/src/validate.rs:243`, a test pozycji w enumie w `view-model/tests/pin_vectors.rs:434`. Decyzja potwierdza stan kodu i nie wymaga zmiany: kodowanie wdrożono już w P4-1A (komentarz `map.rs:159-161` „Encoding fixed by the contract (D-DTO-10 = A)”). Wpis orkiestratora w `REJESTR-RUST.md` ma mieć charakter **potwierdzenia** istniejącego stanu, nie zmiany.

### 2.4 Wpływ na typy DTO — luka poza samym kodowaniem

| Pole | Stan w view-model | Wpływ |
|---|---|---|
| `FogViewDto.state` | `map.rs:210-212` | bez zmiany (decyzja A = stan kodu) |
| `landReveal: bool` (web `revealAllLand`) | **BRAK** w `FogViewDto` (jedno pole `state`, `map.rs:210-212`) | `scene.ts:3528-3531` używa go do pokazania oceanu (`showOceanBackdropNow = !anyHidden \|\| landReveal`, `:3548`). To przełącznik dev/test (`main.ts:12802`, klawisz M). Część „cały ląd odkryty” jest już zakodowana w `state` (zbiór `explored` po `exploredSetForRender`, `main.ts:12864-12866`), ale flaga tła oceanu nie |
| `riverRevealKeys` (krąg startu, onboarding) | **BRAK** | `startRevealKeysForRiverFog` (`main.ts:13074-13080`) zwraca zbiór tylko przed pierwszym miastem gracza; rzeka na tych heksach ignoruje mgłę (`scene.ts:3227-3228`) |

Zakres opcji w webie: obie idą do `setFog` wyłącznie w gałęzi `useFogRender = fogOn || revealAllLand` (`main.ts:13484`, `:13490-13494`). Przy `fogOn = false` i bez `revealAllLand` web woła `setFog(ALL_KEYS, ALL_KEYS)` **bez opcji** (`main.ts:13505-13506`), więc `landReveal`/`riverRevealKeys` nie działają. Dla P4-1C: przy mgle wyłączonej adapter podaje wszystkie `2` i pomija obie opcje.

Te dwie opcje to brak w kontrakcie §3.3, a nie część pytania D-DTO-10 (kodowanie stanu heksa). Web je ma, więc parytet je obejmuje. Proponowane miejsce: `FogViewDto` w temacie **P4-1C FOG-VIEW** (np. `landReveal: bool`, `riverRevealKeys: Vec<HexCoord>`). Rozstrzyga to orkiestrator jako decyzję techniczną. Czy przełączniki dev (F, M) mają w ogóle trafić do wydania Rust, jest kwestią zakresu, a nie DTO. Web to rozstrzyga (`VITE_CIV_HIDE_FOG_UI`, `main.ts:12806`) — **NIE_ZMIERZONO** w porcie.

---

## 3. Podsumowanie

| Decyzja | Werdykt | Podstawa | Zmiana typów DTO |
|---|---|---|---|
| D-DTO-4 | **A** (silnik liczy wszystkie pięć pól) | web: reguły w `game/`, `map/`, `main.ts`, nie w `render/` (§1.2) | brak zmiany typów; nowe niezmienniki producenta: `roadMask` dla każdego heksa, `river_render_paths` równoległe do `rivers`, `camp_hexes` z `siege_allowed_between` i z duplikatami jak web (wymagane: rozdział round-robin `siegeCampSync.ts:22`). Brakujący port: `computeRoadMask`, `trimMediumRenderPathAtMain`/`trimMediumTailAlongMain` |
| D-DTO-10 | **A** (`0`/`1`/`2` = pozycje w `Widocznosc`) | web: semantyka trzech stanów i pierwszeństwa (§2.2); kodowanie techniczne | brak (już w `map.rs:159-212`); luka kontraktu: `landReveal`, `riverRevealKeys` → P4-1C |

Pytania ABC do właściciela: **brak**. Obie decyzje są techniczne i zgodne z webem (zasady 9 i 11). Wpis do `dyspozycje/rust-port/REJESTR-RUST.md` należy do orkiestratora (poza allowlistą tego tematu).
