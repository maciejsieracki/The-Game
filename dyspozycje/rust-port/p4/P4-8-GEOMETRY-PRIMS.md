# P4.8 — Biblioteka prymitywów geometrii w Rust (RR-T4)

**Temat:** `R-RUSTPORT-P4-8-GEOMETRY-PRIMS-Q1` · **Domena:** GAME · **Rola:** Operator, runda 1/5 (Opus 5.5 medium, wyjątek graficzny R-PROC-AUTOBOT §5a)
**Baza kodu:** `origin/rust-port/parity-v2` @ `0a496f67` (P4.6, crate `civ-renderer`).
**Pin web (tylko odczyt):** `edb8fb56` — wyłącznie `git grep`/`git show`. Zero zmian w `gra/**`, bez `npm run build/dev`.
**Referencja:** Three.js **0.169.0** (r169) pobrany `npm pack` do scratchpad poza repo (§4).
**GOAL:** RR-T4 — biblioteka prymitywów `rust-port/renderer/src/geom/**` zgodna numerycznie z Three.js r169 dla prymitywów używanych przez web (wierzchołki, normalne, UV, indeksy, grupy) + narzędzia składania (TRS, merge, normalne). Czysty CPU, bez GPU.

**Wynik w skrócie:** 13 rodzin, **90 przypadków referencyjnych** z prawdziwego Three 0.169.0; Rust zgodny w 90/90 (tolerancja 1e-6; **89/90 bit w bit**, 1 przypadek — tuba po krzywej Catmull-Rom — max |Δ| = 1.19e-7, czyli 1 ULP f32). Indeksy i grupy materiałów identyczne we wszystkich. Bramki `fmt`/`clippy -D warnings`/`test` EXIT=0 (także `--features gpu` i MSRV 1.87). Brak nowych zależności (`Cargo.toml`/`Cargo.lock` bez zmian).

---

## 1. Prymitywy używane w webie i status (zadanie 1)

Komenda (skrypt `counts.sh`, uruchamiany z katalogu worktree; czyta wyłącznie pin `edb8fb56`):

```bash
for g in Box Cylinder Cone Sphere Torus Plane Circle Ring Icosahedron Dodecahedron Octahedron Tetrahedron Extrude Shape Tube Lathe Capsule Edges Wireframe Polyhedron; do
  pat="new (THREE\\.)?${g}Geometry\\("
  lines=$(git grep -c -E "$pat" edb8fb56 -- gra/src | awk -F: '{s+=$NF} END {print s+0}')
  files=$(git grep -l -E "$pat" edb8fb56 -- gra/src | wc -l)
  echo "${g}Geometry lines=${lines} files=${files}"
done
for p in 'mergeGeometries\(' 'mergeBufferGeometries\(' '\.computeVertexNormals\(' '\.applyMatrix4\(' '\.rotateX\(' '\.rotateY\(' '\.rotateZ\(' '\.translate\(' 'new (THREE\.)?CatmullRomCurve3\(' 'new (THREE\.)?QuadraticBezierCurve3\(' 'new (THREE\.)?Shape\(' 'new (THREE\.)?Path\(' 'absarc\(|quadraticCurveTo\(|bezierCurveTo\(|splineThru\(|absellipse\('; do
  lines=$(git grep -c -E "$p" edb8fb56 -- gra/src | awk -F: '{s+=$NF} END {print s+0}')
  echo "pattern ${p} lines=${lines}"
done
```

Pełne wyjście:

```text
BoxGeometry lines=1495 files=61
CylinderGeometry lines=396 files=57
ConeGeometry lines=117 files=49
SphereGeometry lines=24 files=13
TorusGeometry lines=17 files=9
PlaneGeometry lines=17 files=5
CircleGeometry lines=14 files=5
RingGeometry lines=9 files=5
IcosahedronGeometry lines=19 files=9
DodecahedronGeometry lines=7 files=2
OctahedronGeometry lines=2 files=1
TetrahedronGeometry lines=0 files=0
ExtrudeGeometry lines=3 files=3
ShapeGeometry lines=2 files=1
TubeGeometry lines=1 files=1
LatheGeometry lines=0 files=0
CapsuleGeometry lines=0 files=0
EdgesGeometry lines=0 files=0
WireframeGeometry lines=0 files=0
PolyhedronGeometry lines=0 files=0
pattern mergeGeometries\( lines=2
pattern mergeBufferGeometries\( lines=0
pattern \.computeVertexNormals\( lines=43
pattern \.applyMatrix4\( lines=9
pattern \.rotateX\( lines=18
pattern \.rotateY\( lines=3
pattern \.rotateZ\( lines=2
pattern \.translate\( lines=5
pattern new (THREE\.)?CatmullRomCurve3\( lines=2
pattern new (THREE\.)?QuadraticBezierCurve3\( lines=1
pattern new (THREE\.)?Shape\( lines=5
pattern new (THREE\.)?Path\( lines=4
pattern absarc\(|quadraticCurveTo\(|bezierCurveTo\(|splineThru\(|absellipse\( lines=5
EXIT=0
```

Liczby obejmują całe `gra/src` i zgadzają się z P4-4 §1.2 (tam rozbite na `render/**` + 8 plików poza `render/`): Box 1450+45 = 1495, Cylinder 379+17 = 396, Cone 107+10 = 117, Sphere 21+3 = 24, Torus 16+1 = 17, Plane 3+14 = 17, Circle 11+3 = 14, Ring 6+3 = 9, Icosahedron 16+3 = 19, Dodecahedron 7, Octahedron 2, Extrude 3, Shape 2, Tube 1, Lathe 0.

### 1.1 Tabela statusu (kolejność wg częstości)

| # | Prymityw / narzędzie (web) | Linie (pliki) | Status | Rust | Fixtures |
|---:|---|---:|---|---|---|
| 1 | `BoxGeometry` | 1495 (61) | **zaimplementowany** | `geom::box_geometry` | `box.json` (6) |
| 2 | `CylinderGeometry` | 396 (57) | **zaimplementowany** | `geom::cylinder_geometry` | `cylinder.json` (10) |
| 3 | `ConeGeometry` | 117 (49) | **zaimplementowany** (cylinder z `radiusTop = 0`, jak w Three) | `geom::cone_geometry` | `cone.json` (5) |
| 4 | `SphereGeometry` | 24 (13) | **zaimplementowany** | `geom::sphere_geometry` | `sphere.json` (9) |
| 5 | `IcosahedronGeometry` | 19 (9) | **zaimplementowany** | `geom::icosahedron_geometry` | `polyhedron.json` |
| 6 | `TorusGeometry` | 17 (9) | **zaimplementowany** | `geom::torus_geometry` | `torus.json` (5) |
| 7 | `PlaneGeometry` | 17 (5) | **zaimplementowany** | `geom::plane_geometry` | `plane.json` (3) |
| 8 | `CircleGeometry` | 14 (5) | **zaimplementowany** | `geom::circle_geometry` | `circle.json` (5) |
| 9 | `RingGeometry` | 9 (5) | **zaimplementowany** | `geom::ring_geometry` | `ring.json` (5) |
| 10 | `DodecahedronGeometry` | 7 (2) | **zaimplementowany** | `geom::dodecahedron_geometry` | `polyhedron.json` |
| 11 | `ExtrudeGeometry` | 3 (3) | **zaimplementowany** (bez `extrudePath`; bevel tak) | `geom::extrude_geometry` | `extrude.json` (6) |
| 12 | `OctahedronGeometry` | 2 (1) | **zaimplementowany** | `geom::octahedron_geometry` | `polyhedron.json` |
| 13 | `ShapeGeometry` | 2 (1) | **zaimplementowany** (pojedynczy kształt i tablica z grupami) | `geom::shape_geometry`, `shape_geometry_multi` | `shape.json` (9) |
| 14 | `TubeGeometry` + `CatmullRomCurve3` | 1 (1) + 2 | **zaimplementowany** (centripetal/chordal/catmullrom, open/closed) | `geom::tube_geometry`, `geom::CatmullRomCurve3` | `tube.json` (6) |
| 15 | `TetrahedronGeometry` | 0 | zaimplementowany „za darmo” (ten sam `PolyhedronGeometry`); nieużywany | `geom::tetrahedron_geometry` | `polyhedron.json` |
| 16 | `LatheGeometry`, `CapsuleGeometry`, `EdgesGeometry`, `WireframeGeometry`, bezpośredni `PolyhedronGeometry` | 0 | **nie** — 0 użyć w webie | — | — |
| 17 | krzywe w `Shape`/`Path` (`absarc`, `quadraticCurveTo`, `bezierCurveTo`, `splineThru`, `absellipse`) | 5 | **nie** — wszystkie 5 trafień to `ctx.quadraticCurveTo` Canvas 2D w `cityMapStatChip.ts:416–442` (rysowanie tekstury), a nie `THREE.Shape`. Wszystkie 5 `new Shape` / 4 `new Path` budują wielokąty `moveTo/lineTo/closePath` (`bronzeCityRoblox.ts:76`, `stoneCityRoblox.ts:118`, `unitVeteranBadges.ts:155`, `units.ts:489,501`) | `Path2` tylko odcinki | — |
| 18 | `ExtrudeGeometry({ extrudePath })` | 0 | **nie** — 0 użyć | — | — |
| 19 | `QuadraticBezierCurve3` | 1 | **nie** — `tradeRoutesOverlay.ts:56` daje punkty linii `THREE.Line` (nie siatkę trójkątów); poza zakresem prymitywów, do tematu nakładek | — | — |
| 20 | `new BufferGeometry` (ręczne) | 51 | **poza zakresem** — algorytmy wierzchołków terenu/rzek/dekoracji to tematy modeli (P4-4 §1.2: „przepisanie 1:1”) | — | — |
| 21 | `mergeGeometries` | 2 | **zaimplementowany** (`useGroups` true/false) | `geom::merge_geometries` | `ops.json` |
| 22 | `computeVertexNormals` | 43 | **zaimplementowany** (indeksowane i nieindeksowane) | `Mesh::compute_vertex_normals` | `ops.json` |
| 23 | `applyMatrix4` / `rotateX/Y/Z` / `translate` / `scale` | 9 / 18 / 3 / 2 / 5 / — | **zaimplementowane** + TRS z `Object3D.updateMatrix()` (pozycja, Euler 6 kolejności, skala) | `Mesh::apply_matrix4` …, `Mat4::from_trs` | `ops.json` |

Uzasadnienie zakresu Extrude/Shape: wszystkie użycia webu to wielokąty z odcinków (ring heksów z otworem, gwiazda weterana), więc zaimplementowano `Path`/`Shape` dla odcinków + pełny port `Earcut` 2.2.4 z Three (także ścieżka z haszowaniem z-order dla > 80 wierzchołków — przypadek `shape.json:many_points_hashed`) oraz `ExtrudeGeometry` łącznie z bevelem (domyślnie włączonym w Three). Dla odcinków `curveSegments` nie ma wpływu (Three próbkuje `LineCurve` zawsze w 2 punktach), dlatego nie jest parametrem Rust; przypadek `extrude.json:veteran_star` ma `curveSegments: 1` jak web i zgadza się.

## 2. API (zadanie 3)

Moduł `src/geom.rs` zamieniono na katalog `src/geom/` (dozwolone przez allowlistę, `lib.rs` bez zmian — `pub mod geom;` rozwiązuje się do `geom/mod.rs`):

| Plik | Zawartość |
|---|---|
| `geom/mod.rs` | `Mesh { positions: Vec<f32>, normals: Vec<f32>, uvs: Vec<f32>, indices: Option<Vec<u32>>, groups: Vec<Group> }`, `Group { start, count, material_index }`, `vertex_count`, `triangle_count`, `index_buffer()` (dla nieindeksowanych `0..n`), reeksporty |
| `geom/math.rs` | ręcznie pisane `Vec3`, `Mat4` (column-major jak `Matrix4.elements`: `translation`, `scaling`, `rotation_x/y/z`, `rotation_axis`, `compose`, `from_trs`, `mul`), `Mat3::normal_matrix`, `Quat::from_euler`, `Euler`/`EulerOrder` (6 kolejności) — bez bibliotek matematycznych |
| `geom/prims.rs` | Box, Plane, Cylinder, Cone, Sphere, Torus, Circle, Ring |
| `geom/polyhedron.rs` | Polyhedron (subdivide, applyRadius, UV + korekty szwu), Icosahedron, Dodecahedron, Octahedron, Tetrahedron |
| `geom/earcut.rs` | port `Earcut.js` (arena zamiast list wskaźnikowych; usunięte węzły zachowują sąsiadów jak w JS) |
| `geom/shape.rs` | `Path2` (`move_to`, `line_to`, `close_path`, `from_points`), `Shape { outline, holes }`, `ShapeUtils` (`area`, `is_clockwise`, `triangulate_shape`), `shape_geometry(_multi)`, `extrude_geometry` + `ExtrudeOptions` (domyślne = Three; `ExtrudeOptions::flat(depth)` = forma z webu) |
| `geom/curve.rs` | `CatmullRomCurve3` (`get_point`, `get_lengths` 200 podziałów z cache, `get_u_to_t_mapping`, `get_point_at`, `get_tangent(_at)`, `compute_frenet_frames`), `tube_geometry` |
| `geom/ops.rs` | `Mesh::apply_matrix4`, `rotate_x/y/z`, `translate`, `scale`, `normalize_normals`, `compute_vertex_normals`; `merge_geometries(&[&Mesh], use_groups) -> Result<Mesh, MergeError>` |

**Model numeryczny i determinizm.** Każdy builder liczy w f64 w tej samej kolejności działań co źródło JS (np. `normalize()` = mnożenie przez `1/len`, `len || 1`; `lerp` = `a + (b − a)·t`), a zapisuje f32 dopiero na końcu (jak `Float32BufferAttribute`). Operacje na gotowej siatce (`applyMatrix4`, `computeVertexNormals`) czytają f32 → f64 → zapisują f32, jak Three na `Float32Array`. Brak FMA, brak `HashMap`, brak losowości → te same wejścia dają te same bity (sprawdzane w każdym przypadku testu: drugi build porównywany `to_bits()`).

**Odtworzone osobliwości Three (celowo):** wspólny wektor `tmp` w `CatmullRomCurve3.getPoint` (przy 2 punktach p0 == p3 — przypadek `tube.json:two_points`); `ExtrudeGeometry` odwraca otwory tylko gdy odwracał obrys, a `ShapeGeometry` zawsze; `removeDupEndPts` modyfikuje kontur w miejscu; `uOffset` biegunów sfery; korekty szwu UV wielościanów; `computeVertexNormals` czyta trzy akumulatory przed zapisem; `merge` gubi grupy źródłowe.

**Świadome różnice wobec JS (tylko wejścia nieprawidłowe/nieużywane w webie):** liczby segmentów są `u32` (Three robi `Math.floor` na liczbach — web podaje całkowite); pusty otwór w Earcut jest pomijany (JS rzuca `TypeError`); `close_path` na pustej ścieżce = no-op (JS `TypeError`); `get_u_to_t_mapping` poza `[0,1]` daje NaN zamiast wyjścia poza tablicę.

## 3. Wyniki zgodności (zadanie 2)

Test `tests/geom_three_parity.rs`: dla każdego przypadku buduje siatkę w Rust z `args` fixture'a, porównuje `position`/`normal`/`uv` z tolerancją bezwzględną **1e-6** (NaN ↔ `null` dokładnie), `index` i `groups` **dokładnie**, długości buforów dokładnie, oraz determinizm bitowy. Własny mini-parser JSON w teście (brak `serde` — zakaz nowych zależności).

Maksymalne odchylenia per przypadek (`cargo test --locked --test geom_three_parity -- --nocapture --test-threads=1`, pełne wyjście):

```text
    Finished `test` profile [unoptimized] target(s) in 0.09s
     Running tests/geom_three_parity.rs (/home/user/cargo-target-shared/wf_cff53e71-9f8-1/debug/deps/geom_three_parity-ab6f7952892f0505)

running 16 tests
test index_buffer_covers_non_indexed_meshes ... ok
test merge_rejects_mixed_indexing ... ok
test parity_box ... box.json:unit: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:typical_small: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:segmented: verts=94 tris=104 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:zero_height: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:negative_depth: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:large_segments: verts=726 tris=1200 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_circle ... circle.json:default: verts=34 tris=32 max|d| pos=0e0 nor=0e0 uv=0e0
circle.json:hex: verts=8 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
circle.json:below_min_clamped: verts=5 tris=3 max|d| pos=0e0 nor=0e0 uv=0e0
circle.json:partial: verts=10 tris=8 max|d| pos=0e0 nor=0e0 uv=0e0
circle.json:zero_radius: verts=8 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_cone ... cone.json:default: verts=131 tris=64 max|d| pos=0e0 nor=0e0 uv=0e0
cone.json:typical: verts=27 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
cone.json:min_segments: verts=15 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
cone.json:open_hseg: verts=36 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
cone.json:pyramid: verts=19 tris=8 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_cylinder ... cylinder.json:default: verts=196 tris=128 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:typical: verts=52 tris=32 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:min_segments: verts=22 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:frustum_hseg: verts=54 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:open_ended: verts=21 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:partial_theta: verts=34 tris=20 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:zero_top: verts=27 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:zero_bottom: verts=27 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:hexagonal_prism: verts=40 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:large: verts=583 tris=640 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_extrude ... extrude.json:hex_wall_ring: verts=144 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:veteran_star: verts=108 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:square_steps3: verts=84 tris=28 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:square_default_bevel: verts=180 tris=60 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:hex_ring_bevel_custom: verts=504 tris=168 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:two_shapes: verts=60 tris=20 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_ops ... ops.json:box_rotateX_translate: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:cylinder_rotYZ_scale: verts=40 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:extrude_hex_rotateX: verts=144 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:sphere_trs_xyz: verts=63 tris=80 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:box_trs_yxz_negscale: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:cone_trs_zyx: verts=23 tris=10 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:sphere_recompute_normals: verts=63 tris=80 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:cylinder_recompute_normals: verts=47 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:merge_indexed_groups: verts=99 tris=72 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:merge_indexed_nogroups: verts=33 tris=20 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:merge_nonindexed_groups: verts=204 tris=68 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_plane ... plane.json:unit: verts=4 tris=2 max|d| pos=0e0 nor=0e0 uv=0e0
plane.json:segmented: verts=20 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
plane.json:zero_size: verts=4 tris=2 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_polyhedron ... polyhedron.json:icosahedron_d0: verts=60 tris=20 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:icosahedron_d1: verts=240 tris=80 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:icosahedron_d2: verts=540 tris=180 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:dodecahedron_d0: verts=108 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:dodecahedron_d1: verts=432 tris=144 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:octahedron_d0: verts=24 tris=8 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:octahedron_d1: verts=96 tris=32 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:octahedron_d3: verts=384 tris=128 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:tetrahedron_d0: verts=12 tris=4 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:tetrahedron_d2: verts=108 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_ring ... ring.json:default: verts=66 tris=64 max|d| pos=0e0 nor=0e0 uv=0e0
ring.json:typical: verts=50 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
ring.json:below_min_clamped: verts=8 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
ring.json:phi_segments: verts=28 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
ring.json:partial: verts=27 tris=32 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_shape ... shape.json:triangle_default: verts=3 tris=1 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:selection_hex_ring: verts=12 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:owner_hex_ring: verts=12 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:ccw_hole_not_reversed: verts=12 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:star: verts=10 tris=8 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:concave_two_holes: verts=12 tris=14 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:open_outline_not_closed: verts=4 tris=2 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:many_points_hashed: verts=102 tris=102 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:multi_two_shapes: verts=15 tris=13 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_sphere ... sphere.json:default: verts=561 tris=960 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:typical: verts=63 tris=80 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:min_segments: verts=12 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:below_min_clamped: verts=12 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:hemisphere: verts=91 tris=132 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:lower_cap: verts=91 tris=132 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:partial_phi: verts=66 tris=100 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:zero_radius: verts=35 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:large: verts=1225 tris=2208 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_torus ... torus.json:default: verts=637 tris=1152 max|d| pos=0e0 nor=0e0 uv=0e0
torus.json:typical: verts=119 tris=192 max|d| pos=0e0 nor=0e0 uv=0e0
torus.json:min: verts=12 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
torus.json:half_arc: verts=117 tris=192 max|d| pos=0e0 nor=0e0 uv=0e0
torus.json:zero_tube: verts=35 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test parity_tube ... tube.json:trade_route: verts=585 tris=1024 max|d| pos=1.1920928955078125e-7 nor=2.9802322387695313e-8 uv=0e0
tube.json:two_points: verts=20 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:chordal: verts=78 tris=120 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:catmullrom_tension: verts=78 tris=120 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:closed_loop: verts=119 tris=192 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:straight_axis: verts=20 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
ok
test trs_matches_manual_composition ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

EXIT=0
```

Przypadki obejmują wartości typowe z webu (np. `cylinder.json:typical` 0.05/0.07/0.4/8, `dodecahedron_d0` 0.035, `octahedron_d0` 0.03, ring heksów zaznaczenia/właściciela z `units.ts`, ring murów `bronzeCityRoblox.ts`, gwiazda weterana, tuba szlaku 64×8 z `units.ts:6530`) i brzegowe: segmenty minimalne oraz poniżej minimum (clamp 3/2/1), zerowe rozmiary (`box zero_height`, `plane zero_size`, `sphere zero_radius`, `circle zero_radius`, `torus zero_tube` — w tym NaN w UV/normalnych, gdzie Three je produkuje), ujemna głębokość boxa, łuki częściowe, `openEnded`, `radiusTop/Bottom = 0`, duże teselacje (box 10³, sfera 48×24, cylinder 64×4, ikosaedr detail 2, oktaedr detail 3), Earcut z haszowaniem (> 80 wierzchołków), kształt nieodwrócony z otworem CCW, dwa otwory w wielokącie wklęsłym, kontur bez `closePath`, bevel domyślny i własny, `steps` > 1, dwa kształty w jednym Extrude, krzywe zamknięte, prosta wzdłuż osi Z, transformacje (`rotateX/Y/Z`, `translate`, `scale`, TRS z Eulerem XYZ/YXZ/ZYX, ujemna skala), `computeVertexNormals` na siatkach indeksowanych oraz `mergeGeometries` indeksowane/nieindeksowane z grupami i bez.

### 3.1 Czułość testu (kontrola mutacyjna)

Celowo zepsute fixtures (kopia zapasowa → modyfikacja → test → przywrócenie): `box.json:unit position[0] += 1e-5` oraz zamiana `index[0]↔index[1]` w `shape.json:selection_hex_ring`. Wynik — wyciąg `grep -E "panicked|test result" -A1` z tego uruchomienia (to jedyne miejsce dokumentu z wyciągiem; bramki w §5 są pełne):

```text
thread 'parity_box' (14655) panicked at tests/geom_three_parity.rs:366:9:
box.json:unit: position[0] got 0.5 want 0.50001 (|d| = 9.99999999995449e-6)
--
thread 'parity_shape' (14664) panicked at tests/geom_three_parity.rs:389:17:
assertion `left == right` failed: shape.json:selection_hex_ring: index
--
test result: FAILED. 13 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
```

Po przywróceniu pliki mają sumy SHA-256 identyczne z wygenerowanymi (§4.2), a pełny przebieg testów jest zielony (§5).

## 4. Dane referencyjne — pochodzenie

### 4.1 Pobranie Three.js (poza repo)

```bash
mkdir -p <scratchpad>/three-pkg && cd <scratchpad>/three-pkg
npm pack three@0.169.0          # -> three-0.169.0.tgz
tar xzf three-0.169.0.tgz       # -> package/ (package.json: "version": "0.169.0")
sha256sum three-0.169.0.tgz
# c86d0937570fb425d981e156ddf919c43dbc45d4e91fd7c8dd0de56723b3ec71  three-0.169.0.tgz
# npm notice shasum: 4a62114988ad9728d73526d1f1de6760c56b4adc
node --version                  # v22.22.0
```

Bezpieczeństwo: żadnych `npm install`/skryptów pakietu; generator uruchamiany z katalogu innego niż pobrany pakiet (`cd <scratchpad>/p48`), importuje wyłącznie `build/three.module.js` i `examples/jsm/utils/BufferGeometryUtils.js` (ten drugi importuje `three` przez self-reference `exports` pakietu, czyli ten sam `three.module.js`). Skrypt weryfikuje `package.json` (`three@0.169.0`) i `THREE.REVISION === '169'`.

### 4.2 Generacja i powtarzalność

```bash
cd <scratchpad>/p48
node <worktree>/rust-port/renderer/tests/fixtures/geom/gen_fixtures.mjs <scratchpad>/three-pkg/package <worktree>/rust-port/renderer/tests/fixtures/geom
```

Ponowne wygenerowanie do osobnego katalogu i porównanie bajtowe (`cmp`) z plikami w repo:

```text
$ node gen_fixtures.mjs <three> <scratchpad>/p48/regen
box.json: 6 cases
plane.json: 3 cases
cylinder.json: 10 cases
cone.json: 5 cases
sphere.json: 9 cases
torus.json: 5 cases
circle.json: 5 cases
ring.json: 5 cases
polyhedron.json: 10 cases
shape.json: 9 cases
extrude.json: 6 cases
tube.json: 6 cases
ops.json: 11 cases
total cases: 90
EXIT=0
$ for f in regen/*.json; do cmp "$f" "<worktree>/rust-port/renderer/tests/fixtures/geom/$(basename "$f")" && echo "identical $(basename "$f")"; done
identical box.json
identical circle.json
identical cone.json
identical cylinder.json
identical extrude.json
identical ops.json
identical plane.json
identical polyhedron.json
identical ring.json
identical shape.json
identical sphere.json
identical torus.json
identical tube.json
EXIT=0
```

SHA-256 commitowanych fixtures:

```text
9f5369eee944d14400326c9dd706bc4816d79f873e8c038e40b0a743820ab7df  box.json
e22372b3564778cfdc520415000772e0dd60a6cd0f16a0529be2cf68ff95a1f1  circle.json
8fb1dc70be97ce2babc9d27c6f143e451a0cdf23af3ccba512f6eb3ad92793bf  cone.json
c1c3befd6f4b991fb9cbaf8959376aa3ca30b31ea5a9eedeaf94e6f7f49191a2  cylinder.json
36977cac0710c6fa37b0b5ecaeb6c2233a62488c0c076016e10eb26340e73d01  extrude.json
a500395618251574983b5844ba872366285777a3cdedfac3a76c9acb8cb550eb  ops.json
95e3435d98e0dd1ca2599ff43161311ce6f367fad88443a6859dbedb100c2c03  plane.json
8be9498ea93a4e715211d2589e81b233fd4e32a4297919398b52d81c5efe6320  polyhedron.json
9524d0c22df129692e4351c52458dc6c38d9772f375a5dac49b8abdcd8091cd0  ring.json
2ed61ce433a03b37432746b51b6d06e726b60c88d25fd7ebc952eb588713e6c5  shape.json
b8618881f2580e2fd032a1bc68ecee86ae11de7c70c3c07beca42f67616b83cd  sphere.json
e406010ad0c443629271758a0ce01bad5848a2a3254b2b64917abfa340adb57b  torus.json
8cc542a45645f3fd8b00e53884fa3c24cacabfe053d3d03283c7802a45c628f8  tube.json
```

### 4.3 Skrypt generujący (pełny, `rust-port/renderer/tests/fixtures/geom/gen_fixtures.mjs`)

```js
// Generator of Three.js r169 reference geometry for civ-renderer `geom`
// (topic R-RUSTPORT-P4-8-GEOMETRY-PRIMS-Q1).
//
// Usage (run from any directory OUTSIDE the downloaded package):
//   node gen_fixtures.mjs <three-package-root> <output-dir>
// where <three-package-root> is the unpacked `npm pack three@0.169.0`
// (the directory containing package.json with version 0.169.0).
//
// Writes one JSON file per family into <output-dir>. Each file:
//   { "three": "0.169.0", "cases": [ { name, kind, args, position, normal,
//     uv, index, groups } ] }
// Buffers are the exact Float32Array contents (as JSON numbers; NaN -> null),
// `index` is null for non-indexed geometry, groups are [start, count, mat].
// `args` is everything the Rust test needs to rebuild the same geometry;
// computed inputs (shape outlines, curve points) are stored as the exact f64
// values JavaScript produced.

import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , threeRoot, outDir] = process.argv;
if (!threeRoot || !outDir) {
  console.error('usage: node gen_fixtures.mjs <three-package-root> <output-dir>');
  process.exit(2);
}
const pkg = JSON.parse(readFileSync(join(threeRoot, 'package.json'), 'utf8'));
if (pkg.name !== 'three' || pkg.version !== '0.169.0') {
  console.error(`expected three@0.169.0, got ${pkg.name}@${pkg.version}`);
  process.exit(2);
}
const THREE = await import(pathToFileURL(join(threeRoot, 'build/three.module.js')).href);
const BGU = await import(
  pathToFileURL(join(threeRoot, 'examples/jsm/utils/BufferGeometryUtils.js')).href
);
if (THREE.REVISION !== '169') throw new Error(`REVISION ${THREE.REVISION}`);

const PI = Math.PI;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- builders

function hexPts(radius, reverse) {
  // tracePointyTopHex / appendPointyTopHex (bronzeCityRoblox.ts:57, units.ts:475)
  const order = reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  const pts = [];
  for (let j = 0; j < 6; j++) {
    const i = order[j];
    const angle = Math.PI / 2 + (i * Math.PI) / 3;
    pts.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  return pts;
}

function starPts(R, frac) {
  // unitVeteranBadges.ts:155
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? R : R * frac;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
}

function makePath(P, pts, close) {
  const p = new P();
  pts.forEach(([x, y], j) => (j === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  if (close) p.closePath();
  return p;
}

function makeShape(s) {
  const shape = makePath(THREE.Shape, s.outline, s.close !== false);
  for (const h of s.holes || []) shape.holes.push(makePath(THREE.Path, h, s.close !== false));
  return shape;
}

function build(kind, a) {
  switch (kind) {
    case 'box': return new THREE.BoxGeometry(...a);
    case 'plane': return new THREE.PlaneGeometry(...a);
    case 'cylinder': return new THREE.CylinderGeometry(...a);
    case 'cone': return new THREE.ConeGeometry(...a);
    case 'sphere': return new THREE.SphereGeometry(...a);
    case 'torus': return new THREE.TorusGeometry(...a);
    case 'circle': return new THREE.CircleGeometry(...a);
    case 'ring': return new THREE.RingGeometry(...a);
    case 'icosahedron': return new THREE.IcosahedronGeometry(...a);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(...a);
    case 'octahedron': return new THREE.OctahedronGeometry(...a);
    case 'tetrahedron': return new THREE.TetrahedronGeometry(...a);
    case 'shape': return new THREE.ShapeGeometry(makeShape(a));
    case 'shape_multi': return new THREE.ShapeGeometry(a.shapes.map(makeShape));
    case 'extrude': return new THREE.ExtrudeGeometry(a.shapes.map(makeShape), a.options);
    case 'tube': {
      const pts = a.points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
      const curve = new THREE.CatmullRomCurve3(pts, a.curveClosed, a.curveType, a.tension);
      return new THREE.TubeGeometry(curve, a.tubularSegments, a.radius, a.radialSegments, a.closed);
    }
    case 'transform': {
      const g = build(a.base.kind, a.base.args);
      for (const op of a.ops) applyOp(g, op);
      return g;
    }
    case 'merge': {
      const parts = a.parts.map((p) => build(p.kind, p.args));
      return BGU.mergeGeometries(parts, a.useGroups);
    }
    default: throw new Error(kind);
  }
}

function applyOp(g, op) {
  const [name, ...v] = op;
  switch (name) {
    case 'rotateX': g.rotateX(v[0]); break;
    case 'rotateY': g.rotateY(v[0]); break;
    case 'rotateZ': g.rotateZ(v[0]); break;
    case 'translate': g.translate(v[0], v[1], v[2]); break;
    case 'scale': g.scale(v[0], v[1], v[2]); break;
    case 'trs': {
      // Object3D.updateMatrix(): compose(position, quaternion(euler), scale)
      const o = new THREE.Object3D();
      o.position.set(v[0], v[1], v[2]);
      o.rotation.set(v[3], v[4], v[5], v[6]);
      o.scale.set(v[7], v[8], v[9]);
      o.updateMatrix();
      g.applyMatrix4(o.matrix);
      break;
    }
    case 'computeVertexNormals': g.computeVertexNormals(); break;
    default: throw new Error(name);
  }
}

const num = (x) => (Number.isNaN(x) ? null : x);
function dump(name, kind, args) {
  const g = build(kind, args);
  const at = (n) => (g.attributes[n] ? Array.from(g.attributes[n].array, num) : []);
  return {
    name,
    kind,
    args,
    position: at('position'),
    normal: at('normal'),
    uv: at('uv'),
    index: g.index ? Array.from(g.index.array) : null,
    groups: g.groups.map((x) => [x.start, x.count, x.materialIndex]),
  };
}

// ------------------------------------------------------------------- cases
// Typical values come from the web call sites (P4-4 §1.2); edge values cover
// minimum segment counts, zero sizes, partial arcs and larger tessellation.

const families = {
  box: [
    ['unit', [1, 1, 1, 1, 1, 1]],
    ['typical_small', [0.12, 0.3, 0.08, 1, 1, 1]],
    ['segmented', [2, 3, 4, 2, 3, 4]],
    ['zero_height', [1, 0, 1, 1, 1, 1]],
    ['negative_depth', [1, 1, -1, 1, 1, 1]],
    ['large_segments', [1, 1, 1, 10, 10, 10]],
  ],
  plane: [
    ['unit', [1, 1, 1, 1]],
    ['segmented', [2, 1.5, 4, 3]],
    ['zero_size', [0, 0, 1, 1]],
  ],
  cylinder: [
    ['default', [1, 1, 1, 32, 1, false, 0, TAU]],
    ['typical', [0.05, 0.07, 0.4, 8, 1, false, 0, TAU]],
    ['min_segments', [1, 1, 1, 3, 1, false, 0, TAU]],
    ['frustum_hseg', [0.5, 1, 2, 6, 3, false, 0, TAU]],
    ['open_ended', [1, 0.5, 1, 6, 2, true, 0, TAU]],
    ['partial_theta', [1, 1, 1, 5, 1, false, 0.3, PI]],
    ['zero_top', [0, 1, 1, 6, 1, false, 0, TAU]],
    ['zero_bottom', [1, 0, 1, 6, 1, false, 0, TAU]],
    ['hexagonal_prism', [1, 1, 0.2, 6, 1, false, PI / 6, TAU]],
    ['large', [1, 1, 1, 64, 4, false, 0, TAU]],
  ],
  cone: [
    ['default', [1, 1, 32, 1, false, 0, TAU]],
    ['typical', [0.1, 0.25, 6, 1, false, 0, TAU]],
    ['min_segments', [1, 1, 3, 1, false, 0, TAU]],
    ['open_hseg', [1, 2, 8, 3, true, 0, TAU]],
    ['pyramid', [0.5, 0.5, 4, 1, false, PI / 4, TAU]],
  ],
  sphere: [
    ['default', [1, 32, 16, 0, TAU, 0, PI]],
    ['typical', [0.08, 8, 6, 0, TAU, 0, PI]],
    ['min_segments', [1, 3, 2, 0, TAU, 0, PI]],
    ['below_min_clamped', [1, 1, 1, 0, TAU, 0, PI]],
    ['hemisphere', [1, 12, 6, 0, TAU, 0, PI / 2]],
    ['lower_cap', [1, 12, 6, 0, TAU, PI / 2, PI / 2]],
    ['partial_phi', [2, 10, 5, 0.5, PI, 0.2, 2]],
    ['zero_radius', [0, 6, 4, 0, TAU, 0, PI]],
    ['large', [1, 48, 24, 0, TAU, 0, PI]],
  ],
  torus: [
    ['default', [1, 0.4, 12, 48, TAU]],
    ['typical', [0.1, 0.015, 6, 16, TAU]],
    ['min', [1, 0.2, 2, 3, TAU]],
    ['half_arc', [1, 0.3, 8, 12, PI]],
    ['zero_tube', [1, 0, 4, 6, TAU]],
  ],
  circle: [
    ['default', [1, 32, 0, TAU]],
    ['hex', [0.9, 6, 0, TAU]],
    ['below_min_clamped', [1, 1, 0, TAU]],
    ['partial', [2, 8, 0.25, PI]],
    ['zero_radius', [0, 6, 0, TAU]],
  ],
  ring: [
    ['default', [0.5, 1, 32, 1, 0, TAU]],
    ['typical', [0.8, 0.9, 24, 1, 0, TAU]],
    ['below_min_clamped', [0.5, 1, 1, 0, 0, TAU]],
    ['phi_segments', [0.2, 1, 6, 3, 0, TAU]],
    ['partial', [0.5, 1, 8, 2, 1, PI / 2]],
  ],
  polyhedron: [
    ['icosahedron_d0', 'icosahedron', [1, 0]],
    ['icosahedron_d1', 'icosahedron', [0.5, 1]],
    ['icosahedron_d2', 'icosahedron', [2, 2]],
    ['dodecahedron_d0', 'dodecahedron', [0.035, 0]],
    ['dodecahedron_d1', 'dodecahedron', [1, 1]],
    ['octahedron_d0', 'octahedron', [0.03, 0]],
    ['octahedron_d1', 'octahedron', [1, 1]],
    ['octahedron_d3', 'octahedron', [1, 3]],
    ['tetrahedron_d0', 'tetrahedron', [1, 0]],
    ['tetrahedron_d2', 'tetrahedron', [1, 2]],
  ],
  shape: [
    ['triangle_default', 'shape', { outline: [[0, 0.5], [-0.5, -0.5], [0.5, -0.5]], holes: [], close: true }],
    ['selection_hex_ring', 'shape', { outline: hexPts(0.94, false), holes: [hexPts(0.94 - 0.11, true)] }],
    ['owner_hex_ring', 'shape', { outline: hexPts(0.9, false), holes: [hexPts(0.9 - 0.045, true)] }],
    ['ccw_hole_not_reversed', 'shape', { outline: hexPts(1, true), holes: [hexPts(0.5, false)] }],
    ['star', 'shape', { outline: starPts(0.072, 0.42), holes: [] }],
    ['concave_two_holes', 'shape', {
      outline: [[0, 0], [4, 0], [4, 3], [2, 1.5], [0, 3]],
      holes: [[[0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1]], [[2.6, 0.4], [3.4, 0.4], [3.4, 1.2]]],
    }],
    ['open_outline_not_closed', 'shape', { outline: [[0, 0], [1, 0], [1, 1], [0, 1]], holes: [], close: false }],
    ['many_points_hashed', 'shape', {
      // > 80 vertices -> Earcut z-order hashing path
      outline: Array.from({ length: 96 }, (_, i) => {
        const a = (i / 96) * TAU;
        const r = 1 + 0.25 * Math.sin(5 * a);
        return [r * Math.cos(a), r * Math.sin(a)];
      }),
      holes: [hexPts(0.3, true)],
    }],
    ['multi_two_shapes', 'shape_multi', {
      shapes: [
        { outline: hexPts(1, false), holes: [hexPts(0.8, true)] },
        { outline: [[2, 0], [3, 0], [3, 1]], holes: [] },
      ],
    }],
  ],
  extrude: [
    ['hex_wall_ring', 'extrude', {
      shapes: [{ outline: hexPts(1.0, false), holes: [hexPts(0.85, true)] }],
      options: { depth: 0.18, bevelEnabled: false },
    }],
    ['veteran_star', 'extrude', {
      shapes: [{ outline: starPts(0.072, 0.42), holes: [] }],
      options: { depth: 0.02, bevelEnabled: false, curveSegments: 1 },
    }],
    ['square_steps3', 'extrude', {
      shapes: [{ outline: [[0, 0], [1, 0], [1, 1], [0, 1]], holes: [] }],
      options: { depth: 2, steps: 3, bevelEnabled: false },
    }],
    ['square_default_bevel', 'extrude', {
      shapes: [{ outline: [[0, 0], [1, 0], [1, 1], [0, 1]], holes: [] }],
      options: {},
    }],
    ['hex_ring_bevel_custom', 'extrude', {
      shapes: [{ outline: hexPts(1, false), holes: [hexPts(0.6, true)] }],
      options: { depth: 0.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelOffset: 0.01, bevelSegments: 2, steps: 2 },
    }],
    ['two_shapes', 'extrude', {
      shapes: [
        { outline: [[0, 0], [1, 0], [0, 1]], holes: [] },
        { outline: [[2, 0], [3, 0], [3, 1], [2, 1]], holes: [] },
      ],
      options: { depth: 1, bevelEnabled: false },
    }],
  ],
  tube: (() => {
    // units.ts:6529 — CatmullRomCurve3(points) default centripetal, then
    // TubeGeometry(curve, 64, 0.05, 8, false)
    const route = [[0, 0.1, 0], [1.5, 0.12, 0.866], [3, 0.2, 0], [4.5, 0.15, 0.866], [6, 0.1, 1.732]];
    return [
      ['trade_route', 'tube', { points: route, curveClosed: false, curveType: 'centripetal', tension: 0.5, tubularSegments: 64, radius: 0.05, radialSegments: 8, closed: false }],
      ['two_points', 'tube', { points: [[0, 0, 0], [1, 1, 0]], curveClosed: false, curveType: 'centripetal', tension: 0.5, tubularSegments: 4, radius: 0.1, radialSegments: 3, closed: false }],
      ['chordal', 'tube', { points: route, curveClosed: false, curveType: 'chordal', tension: 0.5, tubularSegments: 12, radius: 0.2, radialSegments: 5, closed: false }],
      ['catmullrom_tension', 'tube', { points: route, curveClosed: false, curveType: 'catmullrom', tension: 0.3, tubularSegments: 12, radius: 0.2, radialSegments: 5, closed: false }],
      ['closed_loop', 'tube', { points: [[1, 0, 0], [0, 0.3, 1], [-1, 0, 0], [0, -0.3, -1]], curveClosed: true, curveType: 'centripetal', tension: 0.5, tubularSegments: 16, radius: 0.1, radialSegments: 6, closed: true }],
      ['straight_axis', 'tube', { points: [[0, 0, 0], [0, 0, 1], [0, 0, 2]], curveClosed: false, curveType: 'centripetal', tension: 0.5, tubularSegments: 3, radius: 1, radialSegments: 4, closed: false }],
    ];
  })(),
  ops: [
    ['box_rotateX_translate', 'transform', { base: { kind: 'box', args: [1, 2, 3, 1, 1, 1] }, ops: [['rotateX', -PI / 2], ['translate', 0.5, -1, 2]] }],
    ['cylinder_rotYZ_scale', 'transform', { base: { kind: 'cylinder', args: [0.5, 1, 2, 6, 1, false, 0, TAU] }, ops: [['rotateY', 0.7], ['rotateZ', PI / 2], ['scale', 1, 2, 0.5]] }],
    ['extrude_hex_rotateX', 'transform', { base: { kind: 'extrude', args: { shapes: [{ outline: hexPts(1, false), holes: [hexPts(0.85, true)] }], options: { depth: 0.18, bevelEnabled: false } } }, ops: [['rotateX', -PI / 2]] }],
    ['sphere_trs_xyz', 'transform', { base: { kind: 'sphere', args: [1, 8, 6, 0, TAU, 0, PI] }, ops: [['trs', 1, 2, 3, 0.3, -0.5, 1.1, 'XYZ', 2, 1, 0.5]] }],
    ['box_trs_yxz_negscale', 'transform', { base: { kind: 'box', args: [1, 1, 1, 1, 1, 1] }, ops: [['trs', -1, 0, 0.5, 0.2, 0.4, 0.6, 'YXZ', -1, 1, 1]] }],
    ['cone_trs_zyx', 'transform', { base: { kind: 'cone', args: [1, 2, 5, 1, false, 0, TAU] }, ops: [['trs', 0, 0, 0, 1, 0.5, -0.25, 'ZYX', 1, 1, 1]] }],
    ['sphere_recompute_normals', 'transform', { base: { kind: 'sphere', args: [1, 8, 6, 0, TAU, 0, PI] }, ops: [['computeVertexNormals']] }],
    ['cylinder_recompute_normals', 'transform', { base: { kind: 'cylinder', args: [1, 0.5, 1, 6, 2, false, 0, TAU] }, ops: [['scale', 1, 3, 1], ['computeVertexNormals']] }],
    ['merge_indexed_groups', 'merge', { parts: [{ kind: 'box', args: [1, 1, 1, 1, 1, 1] }, { kind: 'cylinder', args: [0.5, 0.5, 1, 6, 1, false, 0, TAU] }, { kind: 'sphere', args: [0.3, 6, 4, 0, TAU, 0, PI] }], useGroups: true }],
    ['merge_indexed_nogroups', 'merge', { parts: [{ kind: 'plane', args: [1, 1, 2, 2] }, { kind: 'transform', args: { base: { kind: 'box', args: [1, 1, 1, 1, 1, 1] }, ops: [['translate', 2, 0, 0]] } }], useGroups: false }],
    ['merge_nonindexed_groups', 'merge', { parts: [{ kind: 'dodecahedron', args: [1, 0] }, { kind: 'octahedron', args: [0.5, 1] }], useGroups: true }],
  ],
};

let total = 0;
for (const [family, cases] of Object.entries(families)) {
  const out = cases.map((c) => (c.length === 2 ? dump(c[0], family, c[1]) : dump(c[0], c[1], c[2])));
  total += out.length;
  writeFileSync(join(outDir, `${family}.json`), JSON.stringify({ three: pkg.version, cases: out }) + '\n');
  console.log(`${family}.json: ${out.length} cases`);
}
console.log(`total cases: ${total}`);
```

## 5. Bramki — pełne surowe logi

Środowisko: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_cff53e71-9f8-1 CARGO_PROFILE_DEV_DEBUG=0`, katalog `rust-port/renderer`, `cargo 1.97.0`, brak GPU. Logi poniżej to kompletne wyjście każdej komendy (stdout+stderr) z `echo "EXIT=$?"`.

### 5.1 `cargo fmt --all -- --check`

```text
$ cargo fmt --all -- --check
EXIT=0
```

### 5.2 `cargo clippy --locked --all-targets -- -D warnings`

```text
$ touch src/lib.rs src/geom/mod.rs tests/geom_three_parity.rs  # wymusza ponowny check (bez cache)
$ cargo clippy --locked --all-targets -- -D warnings
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_cff53e71-9f8-1/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 1.33s
EXIT=0
```

### 5.3 `cargo test --locked --all-targets`

```text
$ cargo test --locked --all-targets
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_cff53e71-9f8-1/rust-port/renderer)
    Finished `test` profile [unoptimized] target(s) in 1.76s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_cff53e71-9f8-1/debug/deps/civ_renderer-d95024f3ec20cfd9)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_cff53e71-9f8-1/debug/deps/cpu_sanity-7ee07d9f2002230a)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (/home/user/cargo-target-shared/wf_cff53e71-9f8-1/debug/deps/geom_three_parity-ab6f7952892f0505)

running 16 tests
test index_buffer_covers_non_indexed_meshes ... ok
test merge_rejects_mixed_indexing ... ok
test parity_circle ... ok
test parity_extrude ... ok
test parity_box ... ok
test parity_cone ... ok
test parity_ops ... ok
test parity_cylinder ... ok
test parity_plane ... ok
test parity_shape ... ok
test parity_ring ... ok
test parity_polyhedron ... ok
test trs_matches_manual_composition ... ok
test parity_torus ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_cff53e71-9f8-1/debug/deps/gpu_probe-08e2d2a6c2a7bdae)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### 5.4 Dodatkowo (jak w CI `rust-renderer.yml`): clippy z `--features gpu` i testy na MSRV 1.87 z `--features gpu`

```text
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_cff53e71-9f8-1/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 1.54s
EXIT=0
```

```text
$ cargo +1.87.0 test --locked --all-targets --features gpu
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_cff53e71-9f8-1/rust-port/renderer)
    Finished `test` profile [unoptimized] target(s) in 4.52s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_cff53e71-9f8-1/debug/deps/civ_renderer-6b861a72fe609883)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_cff53e71-9f8-1/debug/deps/cpu_sanity-3f94db894eb8213d)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (/home/user/cargo-target-shared/wf_cff53e71-9f8-1/debug/deps/geom_three_parity-328147948e29b0b0)

running 16 tests
test merge_rejects_mixed_indexing ... ok
test parity_circle ... ok
test index_buffer_covers_non_indexed_meshes ... ok
test parity_box ... ok
test parity_cone ... ok
test parity_plane ... ok
test parity_ops ... ok
test parity_cylinder ... ok
test parity_ring ... ok
test parity_polyhedron ... ok
test parity_shape ... ok
test parity_torus ... ok
test trs_matches_manual_composition ... ok
test parity_sphere ... ok
test parity_extrude ... ok
test parity_tube ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_cff53e71-9f8-1/debug/deps/gpu_probe-669e972a69f08839)

running 1 test
SKIPPED: no GPU adapter (request_adapter error: No suitable graphics adapter found; noop support not compiled in, vulkan drivers/libraries could not be loaded, metal support not compiled in, dx12 support not compiled in, gl drivers/libraries could not be loaded, webgpu support not compiled in)
test gpu_probe_adapter_or_explicit_skip ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

## 6. Zmiany i granice

- Zmienione/dodane pliki (allowlista): `rust-port/renderer/src/geom.rs` → `rust-port/renderer/src/geom/{mod,math,prims,polyhedron,earcut,shape,curve,ops}.rs`; `rust-port/renderer/tests/geom_three_parity.rs`; `rust-port/renderer/tests/fixtures/geom/{13×.json, gen_fixtures.mjs, PROVENANCE.md}`; ten dokument; `dyspozycje/autobot/runs/R-RUSTPORT-P4-8-GEOMETRY-PRIMS-Q1/01-operator.md`.
- Bez zmian: `Cargo.toml`, `Cargo.lock`, `src/lib.rs`, moduły `pick`/`assets`/inne, `rust-port/engine/**`, `src-tauri/**`, `gra/**`, `.github/**`.
- Nie zaimplementowano materiałów, GPU ani modeli (zakaz z dispatchu, pkt 4).
- `NIE_ZMIERZONO`: wydajność builderów (nie było wymagane); zgodność na innych platformach niż Linux x86_64 (różnice `sin/cos/atan2/pow` libm mogą dać ±1 ULP — tolerancja 1e-6 to pokrywa, ale nie zmierzono na Windows/macOS).
