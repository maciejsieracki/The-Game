STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1
GOAL: rozpoznanie przed producentem MapViewDto (roadMask, trim rzek, river_render_paths), tylko odczyt
ZMIANY/COMMIT: dyspozycje/rust-port/p4/P4-1B-ROADMASK-ROZPOZNANIE.md (poprawki Z1-Z6), ten plik; commit na 1007289cf (SHA w raporcie workflow)
TESTY: bez cargo (zmiana tylko w dokumentach); pomiary git show/git grep na pinach 07d2fbd72 i edb8fb56 oraz odczyt plików Rust na bazie f7baa3848; git diff --check czysty
BLOKADY: brak nowych; decyzja o właścicielu modelu mapy przed Q3 (bez zmian, §4 pkt 5)
RUNDY: obrona r1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

# Odpowiedzi na zarzuty Evaluatora (02-evaluator.md)

## Z1 (średni): porównanie ROAD_DIRS z rendererem w teście silnika — PRZYJMUJĘ
Dowód: `rust-port/engine/Cargo.toml` — `[dependencies]` = serde, serde_json, tracing, civ-view-model; `[dev-dependencies]` puste. Silnik nie widzi `civ-renderer`, a `Cargo.toml` nie jest w allowliście Q1.
Poprawka: §3 Q1 „Wektory” — test zgodności `ROAD_DIRS` tylko z `mapgen::prims::HEX_DIRECTIONS`; zgodność z `renderer/src/models/improvements/droga.rs:21-29` przeniesiona do testu renderera w P4-1G.

## Z2 (niski): isReliefTerrain da się zmierzyć — PRZYJMUJĘ
Pomiar (ta sama metoda awk od `function isReliefTerrain(` do `}` w kolumnie 0, md5sum): `edb8fb56` → `d072c38abbdcbf615efa3fca3e665ccd`, `07d2fbd72` → `d072c38abbdcbf615efa3fca3e665ccd`; na `07d2fbd72` funkcja jest w `gen-helpers.ts:5997`, ciało `return t === TerenBazowy.Gory || t === TerenBazowy.Wzgorza;`.
Poprawka: §1.2 „Zgodność pinów” podaje wynik; §4 pkt 3 oznaczony jako ZAMKNIĘTE.

## Z3 (niski): zawężenie §4 pkt 2 — PRZYJMUJĘ
Dowód: `game/terrain-improvements.ts:349-353` na `07d2fbd72` — `foodLayerFromAnimalDeposit` zwraca `'bydlo'` (ZlozeBydla), `'owce'` (ZlozeOwiec) albo `null`. `main.ts:3125-3137` — `mergedImprovementLayers` = `improvementKeysForHex` + warstwa ze złoża + `placedImprovements` (`:3132-3135`).
Poprawka: §1.3 wiersz `terraces` i §4 pkt 2 — niepewność dotyczy wyłącznie `placedImprovements`.

## Z4 (niski): drugi konsument riverPaths/riverPathKinds — PRZYJMUJĘ
Dowód: `render/mapRenderStyle.ts:1361` `export function computeRiverDeltaHexKeys`, `:1363-1364` paths/kinds z domyślnym `'main'`, `:1368` pomija trasy nie-`main`, `:1369` `pathReachesOpenSea(map, path)` na surowej ścieżce (def. `:1339`), `findRiverMouthWybrzeze` (`:1287`). Wołający `render/scene.ts:2094` (styl `roblox`).
Poprawka: §1.2 — akapit „Drugi konsument” jako informacja dla P4-1G, z wnioskiem, że `rivers[i]` musi nieść surowe `hexes` i `kind`. Dodatkowe odczyty `mapRenderStyle.ts:76` i `:1722` wpisane jako NIE_ZMIERZONO (P4-1G).

## Z5 (niski): kolejność SnapshotMap.hexes — PRZYJMUJĘ
Dowód: `rust-port/engine/src/domain/map_snapshot.rs:171` (doc: „`hexes` = `Object.keys(map.hexes)` w kolejności kluczy”), `:565-574` (kolejność pierwszego wstawienia klucza).
Poprawka: §3 Q3 — jawny krok porządkowania `(r, q)`, test negatywny (przetasowane `hexes` → identyczny DTO) i mutacja „bez sortowania” → FAIL.

## Z6 (kosmetyczny): sprzeczne zdanie o szkieletach rzek — PRZYJMUJĘ
Dowód: `rivers_c.rs`, `rivers_d.rs`, `rivers_e1.rs`, `rivers_e2.rs`, `generate.rs` mają po 3 linie komentarza „Szkielet P6.M00 (pusty)”; `rivers_b.rs` (26 linii) ma podmoduł `rivers_b/` z 11 plikami.
Poprawka: §2 wiersz `riverPaths` — wymienione wprost: `rivers_a`, `rivers_b` (podmoduł, bez orkiestracji), szkielety M00: `rivers_c`, `rivers_d`, `rivers_e1`, `rivers_e2`, `generate`.

## INFO bramki
Przyjęte do wiadomości. Kod Rust nie zmieniony w obronie (tylko dwa pliki z allowlisty), więc bramki cargo z 02-evaluator.md pozostają aktualne.
