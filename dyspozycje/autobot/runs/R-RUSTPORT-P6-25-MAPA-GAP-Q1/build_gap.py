#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generator dokumentu dyspozycje/rust-port/p6/P6-25-MAPA-GAP.md oraz gap-rows.tsv / backlog.tsv.

Wejscia (wszystkie wyprowadzone skryptowo, patrz inventory_map.py / usage_map.py / imports_map.py):
  web-exports.tsv, usage.tsv, imports.tsv, rust-name-hits.tsv  (w katalogu runu)
  <WEB_ROOT>/gra/src/map/*.ts  (git archive edb8fb56, poza repo)
  <ENG>  = rust-port/engine (katalog worktree)
Uzycie: build_gap.py <WEB_ROOT> <ENG> <OUT_DOC>
Referencje Rust (plik:linia) sa rozwiazywane z TREsci plikow Rust (regex), a nie wpisywane z pamieci;
brak trafienia = blad skryptu. Mapowanie web->Rust jest RECZNE (reguly ponizej), nie heurystyczne.
"""
import csv, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
WEB, ENG, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
MAPDIR = os.path.join(WEB, 'gra', 'src', 'map')

ZW, CZ, BR, ND = 'ISTNIEJE-ZWERYFIKOWANE', 'CZĘŚCIOWO', 'BRAK', 'NIE-DOTYCZY'

# ---------------------------------------------------------------- Rust refs
RUST_FILES = {}


def rust_lines(rel):
    if rel not in RUST_FILES:
        RUST_FILES[rel] = open(os.path.join(ENG, rel), encoding='utf-8').read().split('\n')
    return RUST_FILES[rel]


REF = {}  # klucz -> "rust-port/engine/<rel>:<linia>"


def R(key, rel, rx):
    lines = rust_lines(rel)
    pat = re.compile(rx)
    for i, l in enumerate(lines):
        if pat.search(l):
            REF[key] = f'{rel}:{i + 1}'
            return
    raise SystemExit(f'BLAD: brak trafienia Rust dla {key}: {rel} /{rx}/')


MM = 'src/domain/map_generator.rs'
R('mm_mulberry', MM, r'pub struct Mulberry32')
R('rng_mulberry', 'src/domain/rng.rs', r'pub struct Mulberry32')
R('mm_perm', MM, r'fn build_permutation')
R('mm_coslerp', MM, r'fn cos_lerp')
R('mm_noise', MM, r'fn value_noise_2d')
R('mm_fbm', MM, r'^fn fbm')
R('mm_dirs', MM, r'pub const DIRECTIONS')
R('mm_dist', MM, r'pub const fn distance')
R('hex_dist', 'src/domain/hex.rs', r'pub const fn distance')
R('hex_key', 'src/domain/hex.rs', r'pub fn key')
R('mm_band_enum', MM, r'pub enum ClimateBand')
R('mm_is_polar', MM, r'pub const fn is_polar')
R('mm_climate', MM, r'pub fn climate_band_at')
R('mm_shape', MM, r'impl ShapeParams')
R('mm_center', MM, r'struct ContinentCenter')
R('mm_cont_centers', MM, r'^fn build_continent_centers')
R('mm_pangea_centers', MM, r'^fn build_pangea_centers')
R('mm_island_centers', MM, r'^fn build_island_centers')
R('mm_cont_mask', MM, r'^fn continents_mask')
R('mm_pangea_mask', MM, r'^fn pangea_mask')
R('mm_islands_mask', MM, r'^fn islands_mask')
R('mm_earth_mask', MM, r'^fn earth_mask\(')
R('mm_earth_rows', MM, r'^fn earth_polar_ocean_rows')
R('mm_earth_sample', MM, r'^fn sample_earth_template_land')
R('mm_earth_at', MM, r'^fn earth_template_land_at')
R('mm_earth_rle', MM, r'^const EARTH_MASK_RLE')
R('mm_earth_bbox', MM, r'^const EARTH_MASK_BBOX')
R('mm_bias', MM, r'^fn terrain_cell_bias')
R('mm_classify', MM, r'^fn classify_terrain')
R('mm_border_fade', MM, r'^fn land_mask_border_fade')
R('mm_edge_fade', MM, r'^fn edge_rect_fade')
R('mm_border_dist', MM, r'^fn border_distance')
R('mm_apply_climate', MM, r'^fn apply_climate_bands')
R('mm_coast', MM, r'^fn mark_coast_tiles')
R('mm_rivers', MM, r'^fn add_core_rivers')
R('mm_generate', MM, r'pub fn generate_map')
R('mm_world', MM, r'pub enum WorldType')
R('mm_deflf', MM, r'^fn default_land_fraction')
R('t_mm_mulberry', MM, r'fn mulberry32_matches_typescript_first_values')
R('t_mm_noise', MM, r'fn value_noise_and_fbm_match_typescript_golden_vectors')
R('t_mm_bias', MM, r'fn terrain_bias_and_classification_match_typescript_golden_vectors')
R('t_mm_mask', MM, r'fn canonical_mask_vectors_match_typescript')
R('t_mm_climate', MM, r'fn canonical_climate_band_vectors_match_typescript')
R('t_p61_mulberry', 'tests/p6_1_rng_mulberry.rs', r'fn mulberry32_matches_web_make_rng_vectors_bit_for_bit')
R('t_mapgen_world', 'tests/map_generator.rs', r'fn world_types_and_default_seed_match_typescript_contract')
R('t_hex_dist', 'tests/hex_terrain.rs', r'fn distance_is_symmetric_and_uses_axial_cube_geometry')
R('t_hex_key', 'tests/hex_terrain.rs', r'fn coordinates_round_trip_through_the_canonical_map_key')
SP = 'src/domain/start_position.rs'
R('sp_slot', SP, r'pub struct ClusterSpawnSlot')
R('sp_group', SP, r'pub struct ForeignTypeClusterGroup')
R('sp_plan', SP, r'pub struct ClusterSpawnPlan')
R('sp_mode', SP, r'pub enum HumanDistanceMode')
R('sp_pick2', SP, r'pub fn pick_second_human_start_hex')
R('sp_label', SP, r'pub fn display_label_for_slot')
R('sp_build', SP, r'pub fn build_cluster_start_plan')
R('sp_buildin', SP, r'pub struct BuildClusterStartInput')
R('sp_min_cs', SP, r'pub fn min_city_distance_start_city_state')
R('t_sp_cases', 'tests/p6_1c_start_cluster.rs', r'fn build_cluster_start_plan_matches_web_for_all_cases')
R('t_sp_pick2', 'tests/p6_1c_start_cluster.rs', r'fn pick_second_human_start_hex_matches_web')
R('t_sp_label', 'tests/p6_1c_start_cluster.rs', r'fn display_label_for_slot_matches_web')
TM = 'src/data/terrain_map.rs'
R('tm_deprules', TM, r'pub struct DepositRules')
R('tm_deprule', TM, r'pub struct DepositRule\b')
R('tm_minera', TM, r'pub struct MetalDepositMinEra')
R('tm_gen', TM, r'pub struct Generator')
R('tm_rozmiar', TM, r'pub struct RozmiarDims')
R('tm_params', TM, r'pub struct MapGenParamsFile')
R('t_tm_params', 'tests/data_terrain_map.rs', r'fn map_gen_params_parses_and_spot_checks')
R('tr_node', 'src/domain/trade.rs', r'pub struct TerritoryNode')
R('tr_owner', 'src/domain/trade.rs', r'fn territory_owner_at')
R('dv_road', 'src/data/derived.rs', r'pub const ROAD_MOVEMENT_MULTIPLIERS_JSON')
R('dv_road_div', 'src/data/derived.rs', r'pub fn road_movement_divisor')
R('pf_road', 'src/domain/pathfinding.rs', r'road_divisor: crate::data::derived::road_movement_divisor')
R('pf_cost', 'src/domain/pathfinding.rs', r'fn movement_cost_with_rules')
R('t_road', 'tests/road_movement_multipliers.rs', r'fn road_movement_table_covers_each_constant_once')
R('pl_reveal', 'src/domain/player.rs', r'pub fn is_hex_in_start_reveal')
R('t_pl_reveal', 'tests/p6_1_first_player_city.rs', r'fn hex_in_start_reveal_matches_web_vectors')
IM = 'src/domain/improvements.rs'
R('im_can', IM, r'pub fn can_build_improvement')
R('im_forest', IM, r'^fn forest_gate')
R('im_deposit', IM, r'^fn deposit_gate')
R('im_layers', IM, r'^fn layers_allow')
R('im_deposit_enum', IM, r'pub enum Deposit')
R('pb_lfp', 'src/domain/playable.rs', r'pub land_fraction_percent')

# ---------------------------------------------------------------- web inventory
exports = [l.rstrip('\n').split('\t') for l in open(os.path.join(HERE, 'web-exports.tsv'), encoding='utf-8')][1:]
usage_rows = [l.rstrip('\n').split('\t') for l in open(os.path.join(HERE, 'usage.tsv'), encoding='utf-8')]
UH = usage_rows[0][3:]
USAGE = {(r[0], r[1], r[2]): {UH[i]: int(v) for i, v in enumerate(r[3:]) if int(v)} for r in usage_rows[1:]}
imports = {r[0]: (r[1], r[2]) for r in (l.rstrip('\n').split('\t') for l in open(os.path.join(HERE, 'imports.tsv'), encoding='utf-8')) if r[0] != 'plik'}

DECL = re.compile(r'^(?:export\s+)?(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:abstract\s+)?(?:function\*?|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)')
WEBTXT = {}
for fn in sorted(os.listdir(MAPDIR)):
    if fn.endswith('.ts'):
        WEBTXT[fn] = open(os.path.join(MAPDIR, fn), encoding='utf-8').read().split('\n')
FILES = sorted(WEBTXT)
DECLSTARTS = {}
for fn, lines in WEBTXT.items():
    DECLSTARTS[fn] = [i + 1 for i, l in enumerate(lines) if DECL.match(l) or l.startswith('export {') or l.startswith('export type {') or l.startswith('export *')]


def span_loc(fn, line):
    """LOC niepuste od deklaracji do nastepnej deklaracji top-level (JSDoc nad deklaracja nie jest liczony)."""
    lines = WEBTXT[fn]
    starts = DECLSTARTS[fn]
    nxt = len(lines) + 1
    for s in starts:
        if s > line:
            nxt = s
            break
    body = lines[line - 1: nxt - 1]
    # utnij komentarz JSDoc poprzedzajacy nastepna deklaracje
    while body and (body[-1].strip() == '' or body[-1].strip().startswith(('*', '/**', '*/', '//'))):
        body.pop()
    return sum(1 for l in body if l.strip())


def range_loc(fn, lo, hi):
    lines = WEBTXT[fn]
    return sum(1 for l in lines[lo - 1: hi] if l.strip())


FILE_LOC = {fn: sum(1 for l in lines if l.strip()) for fn, lines in WEBTXT.items()}

# zakresy instrukcji top-level z AST (decl_spans.cjs -> decl-spans.tsv): (start) -> (end, doc_start, rodzaj, nazwy)
SPANS = collections.defaultdict(dict)
for _l in list(open(os.path.join(HERE, 'decl-spans.tsv'), encoding='utf-8'))[1:]:
    _f, _s, _e, _d, _k, _n = _l.rstrip('\n').split('\t')
    SPANS[_f][int(_s)] = (int(_e), int(_d), _k, _n)


def ast_loc(fn, line):
    """LOC niepuste instrukcji top-level zaczynajacej sie w linii `line` (AST); None gdy brak instrukcji w tej linii."""
    sp = SPANS[fn].get(line)
    if not sp:
        return None
    return sum(1 for l in WEBTXT[fn][line - 1: sp[0]] if l.strip())


# ---------------------------------------------------------------- tematy (backlog) -- zakresy web
# (plik, lo, hi) -- zakres linii przypisany do tematu; suma LOC niepustych = rozmiar
GH = 'gen-helpers.ts'
TOPICS = collections.OrderedDict()


def T(tid, title, ranges, allow, deps, par, kol, uwaga, dom='GAME'):
    TOPICS[tid] = dict(tid=tid, title=title, ranges=ranges, allow=allow, deps=deps, par=par, kol=kol, uwaga=uwaga)


MG = 'src/domain/mapgen/'
T('M00', 'MAPGEN-SZKIELET', [],
  ['src/domain/mod.rs', MG + 'mod.rs', MG + 'types.rs', MG + 'prims.rs', MG + 'masks.rs', MG + 'terrain_class.rs',
   MG + 'relief.rs', MG + 'landsea.rs', MG + 'coast.rs', MG + 'rivers_a.rs', MG + 'rivers_b.rs', MG + 'rivers_c.rs',
   MG + 'rivers_d.rs', MG + 'rivers_e1.rs', MG + 'rivers_e2.rs', MG + 'deposits.rs', MG + 'starts.rs', MG + 'params.rs',
   MG + 'cluster_rivals.rs', MG + 'cluster_mass.rs', MG + 'cluster_layout.rs', MG + 'cluster_compute.rs',
   MG + 'villages.rs', MG + 'generate.rs', 'src/domain/territory.rs', 'src/domain/wonder_placement.rs', 'src/domain/roads.rs',
   'src/domain/improvement_build.rs', 'src/domain/map_snapshot.rs', 'tests/p6_m00_*.rs'],
  'P5 zamkniete', 'start (pierwszy)',
  'domain/mod.rs: konflikt addytywny z zamknietymi P6.1/1C/1D (deklaracje `pub mod`: `mapgen` + moduly M14-M17), jak w P6.1C §10 pkt 2; po M00 zaden temat M* nie edytuje mod.rs',
  'Tworzy katalog `domain/mapgen/` z pustymi plikami `//!` (po jednym na temat) oraz puste moduly `territory.rs`, `wonder_placement.rs`, `roads.rs`, `improvement_build.rs`, `map_snapshot.rs` (M14-M17) z deklaracjami `pub mod` w `domain/mod.rs` (jedyna edycja `mod.rs` w calym backlogu M) + model `MapHex` (`types.rs`, z `gra/src/types/hex.ts` -- patrz ZALOZENIE Z2). Dzieki temu kolejne tematy edytuja WYLACZNIE wlasne pliki (rozlaczne allowlisty).')
T('M01', 'RDZEN-WERYFIKACJA', [(GH, 33, 252), ('earth-land-mask.generated.ts', 1, 417)],
  [MM, 'tests/p6_m01_*.rs', 'tests/p6_m01_vectors/**', MG + 'prims.rs'],
  'M00', 'po M00; rownolegle z M02/M09/M14/M15/M17',
  'map_generator.rs: jedyny temat edytujacy ten plik przed M18 (zmiana widocznosci `pub` + dedup `Mulberry32`)',
  'ZAMRAZA istniejacy rdzen testami wektorowymi z weba (Node): noise/fbm/perm, 4 maski, klimat (sweep h=6..130), hex, Mulberry32 (jedna implementacja zamiast dwoch: `rng.rs:118` i `map_generator.rs:207`), maska Ziemi (dane bit-w-bit). Bez nowej logiki.')
T('M02', 'PARAMETRY-NOWEJ-GRY', [('newGameMapDefaults.ts', 1, 743), ('riverGenSwitch.ts', 1, 83), ('deposit-era.ts', 1, 46), ('generator.ts', 775, 845)],
  [MG + 'params.rs', 'data/derived/mapgen-*.json', 'tests/p6_m02_*.rs', 'tests/p6_m02_vectors/**'],
  'M00; dane `map-gen-params.json` (istnieja: `data/terrain_map.rs`)', 'po M00; rownolegle z M01/M09/M14/M15/M17',
  'brak wspolnych sciezek; `data/derived.rs` NIE jest edytowany (parsery w `params.rs`); zalezy od civ-entry-epoch (P6.1, zrobione)',
  'Progi gestosci/rzek/zasobow (`resolveWorldGenNumbers`, `resolveRiverMapParams`...), etykiety rozmiarow, pule typow cywilizacji per epoka (`EPOCH_CIV_TYPE_POOL`), `RiverGenPhase` jako PARAMETR (bez URL/localStorage), `zlozeMinEraFor`/`isDepositVisible` (`deposit-era.ts`).')
T('M03', 'MASKI-CENTRA-UZUPELNIENIE', [(GH, 253, 825), ('earth-land-mask.ts', 1, 170)],
  [MG + 'masks.rs', 'tests/p6_m03_*.rs', 'tests/p6_m03_vectors/**'],
  'M01, M02', 'po M01+M02; rownolegle z M04',
  'brak wspolnych sciezek z P6.x',
  'Reszta maski/centrow nieobecna w Rust: `nearestContinentZoneIndex`, `assignContinentIndices`, `assignIslandGridIndices`, `landMaskAt`, `mapIsotropicFromCenter` itd.; wektory dla wielu wymiarow/ziaren (dzis tylko 36x28 seed 42).')
T('M04', 'TEREN-KLASYFIKACJA-GRANICE', [(GH, 826, 1410)],
  [MG + 'terrain_class.rs', 'tests/p6_m04_*.rs', 'tests/p6_m04_vectors/**'],
  'M01, M02', 'po M01+M02; rownolegle z M03',
  'brak wspolnych sciezek z P6.x',
  '`classifyTerrain` z progami tier-ow gestosci (Rust: tylko progi domyslne), `classifyTerrainFlat`, `reapplyForestOverlay`, `reapplyLandTerrain`, `reliefLandFractions`, brzeg/margines mapy (`isInMapBorder`, `enforceMapBorderOcean`, `applyMarginalLandZoneCaps`), `terrainCellBias` (zrobione).')
T('M05A', 'RELIEF-A-MASY-POKRYCIE', [(GH, 1411, 2370)],
  [MG + 'relief.rs', 'tests/p6_m05a_*.rs', 'tests/p6_m05a_vectors/**'],
  'M03, M04', 'sekwencyjnie M05A -> M05B (wspolny `relief.rs`)',
  'brak wspolnych sciezek z P6.x',
  'Grupowanie mas ladu, centroidy, kwadraty kontynentow, `applyReliefByNoiseRank`, rozmiary komorek pokrycia, pakiety Fe/Cu/relief.')
T('M05B', 'RELIEF-B-POKRYCIE-PASMA', [(GH, 2371, 3185)],
  [MG + 'relief.rs', 'tests/p6_m05b_*.rs', 'tests/p6_m05b_vectors/**'],
  'M05A', 'po M05A (ten sam plik)',
  'brak wspolnych sciezek z P6.x',
  '`ensureReliefGridCoverage`, `capReliefClusterSizeSafetyNet`, `growMountainRanges` (najwieksze funkcje reliefu).')
T('M06A', 'LAD-MORZE-WYBRZEZE-A', [(GH, 3186, 4374)],
  [MG + 'landsea.rs', 'tests/p6_m06a_*.rs', 'tests/p6_m06a_vectors/**'],
  'M05B', 'sekwencyjnie M06A -> M06B',
  'brak wspolnych sciezek z P6.x',
  'Bilans ladu/morza (`applyLandFractionByScore`, `rebalance*`), klimat na heksach, pierscienie wybrzeza (`applyCoastRing`, `applyDoubleCoastRing`), wody srodladowe.')
T('M06B', 'LAD-MORZE-WYBRZEZE-B', [(GH, 4375, 5120)],
  [MG + 'coast.rs', 'tests/p6_m06b_*.rs', 'tests/p6_m06b_vectors/**'],
  'M06A', 'po M06A',
  'brak wspolnych sciezek z P6.x',
  'Pangea: jeden kontynent i korytarze, `finalizeCoastAndInlandWater`, wyspy-drobnica, `enforceTargetDryLandFraction`.')
T('M07A', 'RZEKI-A-SCIEZKI-POLA', [(GH, 5121, 6069)],
  [MG + 'rivers_a.rs', 'tests/p6_m07a_*.rs', 'tests/p6_m07a_vectors/**'],
  'M06B', 'lancuch M07A -> M07B -> M07C -> M07D -> M07E1 -> M07E2 (zaleznosci funkcji)',
  'brak wspolnych sciezek z P6.x',
  'Stale rzek, `riversQuotaForLandMass`, sanityzacja sciezek, pola odleglosci (`buildSeaDistanceField`), cache pol rzek. Dev-profiler rzek = NIE-DOTYCZY.')
T('M07B', 'RZEKI-B-TRACE', [(GH, 6070, 7253)],
  [MG + 'rivers_b.rs', 'tests/p6_m07b_*.rs', 'tests/p6_m07b_vectors/**'],
  'M07A', 'po M07A', 'brak wspolnych sciezek z P6.x',
  '`traceRiver` (najwieksza funkcja pliku), okna skretu, separacja.')
T('M07C', 'RZEKI-C-DOPLYWY-SREDNIE', [(GH, 7254, 8341)],
  [MG + 'rivers_c.rs', 'tests/p6_m07c_*.rs', 'tests/p6_m07c_vectors/**'],
  'M07B', 'po M07B', 'brak wspolnych sciezek z P6.x',
  '`syncRiverEdgeBonusHexes`, przyciecia zawiniec, `growMediumTributaryFromMain`, `clearRiverMarks`.')
T('M07D', 'RZEKI-D-WALIDACJA-PRZYCINANIE', [(GH, 8342, 9562)],
  [MG + 'rivers_d.rs', 'tests/p6_m07d_*.rs', 'tests/p6_m07d_vectors/**'],
  'M07C', 'po M07C', 'brak wspolnych sciezek z P6.x',
  'Spojnosc sieci, `pruneOrphanRiverPaths`, `ensureRiverOutlets`, indeks przestrzenny rzek (`RiverHexSpatialIndex`).')
T('M07E1', 'RZEKI-E1-UZUPELNIENIA', [(GH, 9563, 10531)],
  [MG + 'rivers_e1.rs', 'tests/p6_m07e1_*.rs', 'tests/p6_m07e1_vectors/**'],
  'M07D', 'po M07D', 'brak wspolnych sciezek z P6.x',
  'Luki ujsc glownych rzek, pokrycie siatka, odleglosc do rzeki.')
T('M07E2', 'RZEKI-E2-GENERATE-RIVERS', [(GH, 10532, 11934)],
  [MG + 'rivers_e2.rs', 'tests/p6_m07e2_*.rs', 'tests/p6_m07e2_vectors/**'],
  'M07E1', 'po M07E1', 'brak wspolnych sciezek z P6.x',
  '`generateRivers` (:11525) i `topUpRiverGridCoverage` (:11777); porownanie `riverPaths`/`rzeka` z `maps.json` (5 map).')
T('M08', 'ZLOZA-LAS-FAIRPLAY', [(GH, 11935, 12475)],
  [MG + 'deposits.rs', 'tests/p6_m08_*.rs', 'tests/p6_m08_vectors/**'],
  'M02, M06B', 'po M02+M06B; rownolegle z M07*',
  'P6.8 (`resource_production.rs`) konsumuje widocznosc zloz: rozlaczne sciezki, kolejnosc M08 przed P6.8-wiring',
  '`placeDeposits`, `ensureDepositGridCoverage`, `ensureForestGridCoverage`, `stripDepositsFromWater`. Widocznosc zloz per epoka (`deposit-era.ts`) przechodzi z M02 -- UWAGA: `deposit-era.ts` liczony w M02 (dane+funkcje), M08 tylko je wola.')
T('M09', 'KLASTRY-RYWALE-MIN', [],
  [MG + 'cluster_rivals.rs', 'tests/p6_m09_*.rs', 'tests/p6_m09_vectors/**'],
  'M00 (+ P6.1D `city_names.rs` zrobione)', 'po M00; rownolegle z M01/M02/M14/M15/M17; ODBLOKOWUJE CZESC RUNDY-2 P6.1C (`buildSameTypeRival*`); pelne zasilenie `build_cluster_start_plan` wynikiem Rust dopiero po M12',
  'start_position.rs: tylko `use` typow (P6.1C zamkniete) -- zero edycji; `data/derived.rs` nie edytowany',
  'Wycinek P6.1C: `buildSameTypeRivalSlots`, `buildSameTypeRivalCandidateHexes`, `groupForeignTypeClusters` + PELNE domkniecie AST (callgraph-rivals.txt): '
  '{RIV_CL_N} deklaracji `clusters.ts` ({RIV_CL_LOC} LOC; w tym stale `CLUSTER_CITY_STATE_MIN_HEX` :42, `CLUSTER_CITY_STATE_MAX_HEX` :47, `MIN_DIST_START_CITY_STATE` :49, `CLUSTER_GROWTH_RESERVE` :58) '
  '+ {RIV_CSX_N} deklaracji `cluster-spawn.ts` ({RIV_CSX_LOC} LOC; 2 typy P6.1C juz w Rust pominiete); +{RIV_GH_N} z `gen-helpers.ts` (mulberry32, HEX_DIRECTIONS, hexDistanceAxial: istnieja w Rust, poza zakresem). '
  'UWAGA: `MIN_DIST_START_CITY_STATE=5` (clusters.ts:49) != `MIN_CITY_DISTANCE_START_CITY_STATE=3` (cities.ts:1122, w Rust `start-cluster-params.json`); stala :49 jest uzywana w wycinku przez `cluster-spawn.ts:106,148`, poza nim w `clusters.ts:56,1835-1836,3399`.')
T('M10', 'KLASTRY-MASY-BRAMKI', [('clusters.ts', 59, 1346), ('startScoring.ts', 1, 142)],
  [MG + 'cluster_mass.rs', 'tests/p6_m10_*.rs', 'tests/p6_m10_vectors/**'],
  'M00, M01, M09 (stale/typy)', 'po M09; sekwencyjnie M10 -> M11',
  'brak wspolnych sciezek z P6.x',
  'Bramki mas ladu (`groupHabitableMasses`, `passesPlayerStartMassGate`, `developmentSpaceScore` -- domkniecie AST `startScoring.ts`: {STS_CL_N} deklaracji `clusters.ts`/{STS_CL_LOC} LOC + {STS_SS_N} z `startScoring.ts`/{STS_SS_LOC} LOC, callgraph-startscoring.txt), `allocateTypyToMasses`, `placeClusterCentersAcrossLandmasses`, roster typow, `scoreCityStartHex`/`findBestPlayerStartHex`.')
T('M11', 'KLASTRY-UKLAD-STOLIC', [('clusters.ts', 1347, 3372)],
  [MG + 'cluster_layout.rs', 'tests/p6_m11_*.rs', 'tests/p6_m11_vectors/**'],
  'M10', 'po M10', 'brak wspolnych sciezek z P6.x',
  'Promienie klastra, pasma odleglosci od morza, separacje stolic, `pickSpawnHexWithCapitalGates`, `packCityStates*`, `buildClusterLayoutWithEdgeCapital` (~2000 linii).')
T('M12', 'KLASTRY-COMPUTE-SPAWN-PLAN', [('clusters.ts', 3373, 4250), ('cluster-spawn.ts', 166, 188), ('cluster-spawn.ts', 210, 445)],
  [MG + 'cluster_compute.rs', 'tests/p6_m12_*.rs', 'tests/p6_m12_vectors/**'],
  'M11, M07E2 (mapa ze sztywnymi hexami z weba -- `maps.json`), P6.1D', 'po M11',
  'start_position.rs: `build_cluster_start_plan` ma byc zasilany wynikiem M12 -- wiring w M18 (nie tu); zero edycji pliku',
  '`computeClusters` i `buildClusterSpawnPlan`; wynik porownywany z `buildClusterSpawnPlan` weba na `maps.json` (k42/k7/p123/k3small/w5).')
T('M13', 'STARTY-WIOSKI', [(GH, 12476, 12561), ('villages.ts', 1, 214)],
  [MG + 'starts.rs', MG + 'villages.rs', 'tests/p6_m13_*.rs', 'tests/p6_m13_vectors/**'],
  'M06B (teren), M10', 'po M10; rownolegle z M11/M14',
  '`difficulty-cost.ts` (P6.11) tylko typ `GameDifficulty` -- parametr tekstowy, bez zaleznosci kodowej',
  '`computeStartPositions`, `placeVillages` (LCG, nie mulberry), `targetVillageHutCount`.')
T('M14', 'TERYTORIUM-ZASIEG-CUDA', [('territory.ts', 1, 145), ('territory-work.ts', 1, 166), ('range-hexes.ts', 1, 115), ('wonder-placement.ts', 1, 119)],
  ['src/domain/territory.rs', 'src/domain/wonder_placement.rs', 'tests/p6_m14_*.rs', 'tests/p6_m14_vectors/**'],
  'P6.8 (`cityRangeForPopulation`/`citySightRadius` z `okolica.ts`) -- ZALOZENIE Z5: do czasu P6.8 promien dostarcza wywolujacy',
  'rownolegle z M01/M02/M09/M15/M17 (nowe pliki)',
  'P6.15 (`trade.rs:265,549`) ma wlasna kopie `TerritoryNode`/`territory_owner_at` -- sciezki rozlaczne; P6.15 po M14 powinien przejsc na wspolna implementacje',
  '`territoryOwnerAt`, `cityTerritoryRadius`, `isInTerritory`, `buildTerritoryNodesFromCities`, `reconcileWorkedTilesForOwner`, `collectTerritoryHexKeysByOwner`, rozmieszczenie cudow. Deklaracje `pub mod` w `domain/mod.rs` robi M00 (puste szkielety), M14 edytuje tylko wlasne pliki.')
T('M15', 'DROGI-RUCH-REGULY', [('road-movement.ts', 1, 84), ('improvement-build.ts', 1560, 1569)],
  ['src/domain/roads.rs', 'tests/p6_m15_*.rs', 'tests/p6_m15_vectors/**'],
  'M00', 'rownolegle z M01/M02/M09/M14/M17',
  'P6.4 (`pathfinding.rs`) wola `roads.rs` -- wiring po P6.4; M15 NIE edytuje pathfinding.rs',
  '`isRoadImprovementKey`, `hexHasRoad`, `applyRoadMovementModifier` jako samodzielne funkcje + testy wektorowe (stale i dzielniki istnieja: `data/derived.rs:696`, `pathfinding.rs:250`).')
T('M16', 'ULEPSZENIA-BUDOWA-REGULY', [('improvement-build.ts', 50, 1559)],
  ['src/domain/improvement_build.rs', 'tests/p6_m16_*.rs', 'tests/p6_m16_vectors/**'],
  'P6.3 (terrain-improvements), M00', 'po P6.3; rownolegle z M10/M14',
  'P6.3/P6.8/P6.17 edytuja `improvements.rs` -- M16 jest w NOWYM pliku (rozlaczne sciezki); semantyczne zachodzenie na bramki `improvements.rs:238-330`',
  'Reguly budowy (las/farma/stadnina, warstwy zywnosci, zloza, `computeImprovementBuildImpact`); czesc UI (galeria, panel, callbacki) -> NIE-DOTYCZY.')
T('M17', 'SNAPSHOT-MAPY', [('mapSnapshot.ts', 1, 404)],
  ['src/domain/map_snapshot.rs', 'tests/p6_m17_*.rs', 'tests/p6_m17_vectors/**'],
  'M00 (model `MapHex`)', 'rownolegle z M01/M02/M09/M14/M15; PRZED P6.20',
  'P6.20 (`save_load.rs`) wola `map_snapshot.rs` -- rozlaczne sciezki; kolejnosc: M17 przed P6.20',
  '`serializeMapForSave`/`buildGameMapFromSnapshot`/`isValidMapSnapshot` (kolumny rzadkie, widocznosc); format spojny z `SaveSnapshot` (`save_load.rs:79`).')
T('M18', 'GENERATE-MAP-ORKIESTRACJA', [('generator.ts', 100, 774), ('generator.ts', 846, 848)],
  [MG + 'generate.rs', MM, 'tests/p6_m18_*.rs', 'tests/p6_m18_vectors/**'],
  'M01..M08, M12, M13 (cala potoki)', 'OSTATNI z M*; po wszystkich',
  'map_generator.rs: edytowany tez przez M01 (sekwencyjnie po M01); tests/p6_1c_vectors/maps.json uzywane read-only',
  '`generateMap`: kolejnosc przebiegow (generator.ts:148-775), `generujSwiat`, rozmiary; przepiecie `generate_map` na nowy potok; DOWOD: rowny teren/rzeki/zloza na 5 mapach `maps.json` (dzis ~40% rownych hexow terenu, `cmp_generate_map_vs_web.out.txt`).')


# ---------------------------------------------------------------- reguly wierszy
def S(temat, klasa=None, status=BR, rust=(), test=(), uwaga=''):
    return dict(temat=temat, klasa=klasa, status=status, rust=list(rust), test=list(test), uwaga=uwaga)


OV = {}   # (plik, symbol) -> dict
RNG = collections.defaultdict(list)  # plik -> [(lo, hi, dict)]


def ov(fn, sym, **kw):
    OV[(fn, sym)] = S(**kw)


def rng(fn, lo, hi, **kw):
    RNG[fn].append((lo, hi, S(**kw)))


# ---- cluster-spawn.ts
f = 'cluster-spawn.ts'
ov(f, 'ClusterSpawnSlot', temat='-', klasa='SYSTEM', status=ZW, rust=['sp_slot'], test=['t_sp_cases'],
   uwaga='typ danych P6.1C; uzyty jako wejscie wektorow z weba (maps.json + cluster-start.json)')
ov(f, 'ForeignTypeClusterGroup', temat='-', klasa='SYSTEM', status=ZW, rust=['sp_group'], test=['t_sp_cases'],
   uwaga='typ danych P6.1C; wektory z weba')
ov(f, 'ClusterSpawnPlan', temat='M12', klasa='SYSTEM', status=CZ, rust=['sp_plan'], test=['t_sp_cases'],
   uwaga='Rust BEZ pola `placement` (P6-1C §11); dane planu pochodza z zapisanego wyniku weba, nie z Rust')
ov(f, 'buildSameTypeRivalSlots', temat='M09', klasa='SYSTEM', status=BR,
   uwaga='P6.1C RUNDA-2 (pkt 1 §10: slot rywali); zalezy od packRivalCitiesAroundCore (clusters.ts:2144); domkniecie AST: {RIV_CL_N} deklaracji `clusters.ts`/{RIV_CL_LOC} LOC + {RIV_CSX_N} z `cluster-spawn.ts`/{RIV_CSX_LOC} LOC (callgraph-rivals.txt)')
ov(f, 'buildSameTypeRivalCandidateHexes', temat='M09', klasa='SYSTEM', status=BR,
   uwaga='P6.1C RUNDA-2 (pkt 1 §10: kandydaci rywali); zalezy od packCityStatesAroundCapital (clusters.ts:2036) i computeSameTypeRivalHalfPlaneAxis (:1879)')
ov(f, 'BuildClusterSpawnInput', temat='M12', klasa='SYSTEM', status=BR, rust=['sp_buildin'],
   uwaga='Rust `BuildClusterStartInput` (inna struktura -- wejscie cluster-start.ts, nie cluster-spawn.ts)')
ov(f, 'groupForeignTypeClusters', temat='M09', klasa='SYSTEM', status=BR,
   uwaga='czysta funkcja grupujaca (S); w Rust tylko struktura wyniku (`sp_group`), brak funkcji')
ov(f, 'buildClusterSpawnPlan', temat='M12', klasa='SYSTEM', status=BR, rust=['sp_build'],
   uwaga='Rust `build_cluster_start_plan` PRZYJMUJE gotowy plan jako wejscie (start_position.rs, komentarz P6.1C); generator planu nie istnieje')
ov(f, 'HumanDistanceMode', temat='-', klasa='SYSTEM', status=ZW, rust=['sp_mode'], test=['t_sp_cases'], uwaga='enum; tryb w wektorach')
ov(f, 'pickSecondHumanStartHex', temat='-', klasa='SYSTEM', status=ZW, rust=['sp_pick2'], test=['t_sp_pick2'], uwaga='test z wektorami weba (P6.1C)')
ov(f, 'displayLabelForSlot', temat='-', klasa='SYSTEM', status=ZW, rust=['sp_label'], test=['t_sp_label'], uwaga='test z wektorami weba (P6.1C)')

# ---- clusters.ts: reguly po liniach; wynik uzupelniany o domkniecia (patrz nizej)
f = 'clusters.ts'
rng(f, 42, 58, temat='M09', klasa='DATA', status=BR, uwaga='stala klastra; M09 = te uzywane przez wycinek rywali; reszta M10')
ov(f, 'MIN_DIST_START_CITY_STATE', temat='M09', klasa='DATA', status=BR, rust=['sp_min_cs'],
   uwaga='UWAGA: =5 (clusters.ts:49); Rust `min_city_distance_start_city_state` to INNA stala (cities.ts:1122 =3). NIE mylic')
rng(f, 59, 216, temat='M10', klasa='SYSTEM', status=BR, uwaga='typy/roster/pomocnicze klastra')
rng(f, 217, 1346, temat='M10', klasa='SYSTEM', status=BR, uwaga='bramki mas ladu / rozmieszczenie srodkow klastrow')
rng(f, 1347, 3372, temat='M11', klasa='SYSTEM', status=BR, uwaga='uklad stolic/miast-panstw wokol rdzenia')
rng(f, 3373, 4250, temat='M12', klasa='SYSTEM', status=BR, uwaga='glowny mapgen klastrow')
ov(f, 'ClusterPlacement', temat='M12', klasa='SYSTEM', status=BR, rust=['sp_plan'],
   uwaga='Rust `ClusterSpawnPlan` pomija to pole (start_position.rs, komentarz) -- typ nieobecny')
ov(f, 'computeClusters', temat='M12', klasa='SYSTEM', status=BR,
   uwaga='jedyny trafiony ciag `computeClusters` w Rust to komentarz w tests/p6_1c_start_cluster.rs; domkniecie AST = {CC_CL_N} deklaracji `clusters.ts`/{CC_CL_LOC} LOC + {CC_GH_N} z `gen-helpers.ts`/{CC_GH_LOC} LOC (callgraph-computeclusters.txt)')

# ---- deposit-era.ts
f = 'deposit-era.ts'
ov(f, 'DepositEraHex', temat='M02', klasa='DATA', status=BR, uwaga='typ pomocniczy')
ov(f, 'METAL_DEPOSIT_MIN_ERA', temat='M02', klasa='DATA', status=CZ, rust=['tm_minera'], test=['t_tm_params'],
   uwaga='dane identyczne z `metal_deposit_min_era` (web_data_check.out.txt: {miedz:2,zelazo:3,wegiel:8,cyna:2}); test w repo przypina tylko `cyna` (data_terrain_map.rs:76-78); FUNKCJE lookup nieobecne')
rng(f, 11, 46, temat='M02', klasa='SYSTEM', status=BR, uwaga='widocznosc zloz per epoka (uzywane w game/resource-access.ts)')

# ---- earth-land-mask*
f = 'earth-land-mask.generated.ts'
ov(f, 'EARTH_MASK_W', temat='M01', klasa='DATA', status=CZ, rust=['mm_earth_rle'], test=['t_mm_mask'], uwaga='720; earth_mask_compare.out.txt: wymiary rowne')
ov(f, 'EARTH_MASK_H', temat='M01', klasa='DATA', status=CZ, rust=['mm_earth_rle'], test=['t_mm_mask'], uwaga='400; wymiary rowne')
ov(f, 'EARTH_MASK_BBOX', temat='M01', klasa='DATA', status=CZ, rust=['mm_earth_bbox'], test=['t_mm_mask'], uwaga='bbox rowny (earth_mask_compare.out.txt)')
ov(f, 'EARTH_MASK_ROWS', temat='M01', klasa='DATA', status=CZ, rust=['mm_earth_rle'], test=['t_mm_mask'],
   uwaga='288000 bitow identycznych (earth_mask_compare.out.txt, dekodowanie RLE); test w repo sprawdza 7 punktow -- dodac test pelnej rownosci w M01')
f = 'earth-land-mask.ts'
ov(f, 'EARTH_POLAR_OCEAN_REF_ROWS', temat='M01', klasa='DATA', status=CZ, rust=['mm_earth_rows'], test=['t_mm_climate'], uwaga='stala 30 wbudowana w `earth_polar_ocean_rows`; sweep klimatu Ziemi h=6..130: 8500/8500 rownych')
ov(f, 'EARTH_POLAR_OCEAN_REF_INNER_H', temat='M01', klasa='DATA', status=CZ, rust=['mm_earth_rows'], test=['t_mm_climate'], uwaga='stala 115 wbudowana; sweep jw.')
ov(f, 'earthNorthOceanRows', temat='M01', klasa='SYSTEM', status=CZ, rust=['mm_earth_rows'], test=['t_mm_climate'], uwaga='alias earthPolarOceanRows (web :29); sweep jw.')
ov(f, 'earthSouthOceanRows', temat='M01', klasa='SYSTEM', status=CZ, rust=['mm_earth_rows'], test=['t_mm_climate'], uwaga='alias earthPolarOceanRows (web :34); sweep jw.')
ov(f, 'earthPolarOceanRows', temat='M01', klasa='SYSTEM', status=CZ, rust=['mm_earth_rows'], test=['t_mm_climate'],
   uwaga='sweep: climateBandAt(isEarth) h=6..130 -> 8500/8500 rownych (sweep.out.txt); test w repo tylko 2 punkty (r=0,27 h=28)')
ov(f, 'sampleEarthTemplateLand', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_earth_sample'], test=['t_mm_mask'], uwaga='WASKO: pokryte posrednio 7 punktami masek Ziemi (36x28 seed 42)')
ov(f, 'earthHexToTemplateNorm', temat='M01', klasa='SYSTEM', status=CZ, rust=['mm_earth_at'], test=['t_mm_mask'], uwaga='w Rust wbudowane w `earth_template_land_at` (brak osobnej funkcji); logika zgodna wg odczytu; osobnego testu brak')
ov(f, 'earthTemplateLandAt', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_earth_at'], test=['t_mm_mask'], uwaga='WASKO: tylko tryb subsamplingu steps=7 (mapa 36x28); steps 1/3/5 NIE_ZMIERZONO')

# ---- genWorker / mapGenAsync / mapGenProgress / riverGenSwitch / minimap / map-attack-city
f = 'genWorker.ts'
ov(f, 'GenWorkerRequest', temat='-', klasa='NIE-DOTYCZY', status=ND, uwaga='protokol Web Workera (self.postMessage); silnik Rust jest synchroniczny -- ZALOZENIE Z4')
ov(f, 'GenWorkerResponse', temat='-', klasa='NIE-DOTYCZY', status=ND, uwaga='protokol Web Workera; jw.')
f = 'mapGenAsync.ts'
ov(f, 'generujSwiatAsync', temat='-', klasa='NIE-DOTYCZY', status=ND, rust=['mm_generate'],
   uwaga='opakowanie workera (`?worker&inline`); w Rust odpowiada mu synchroniczne `generate_map`, asynchronicznosc = warstwa powloki (Tauri/bridge, P7) -- ZALOZENIE Z4')
f = 'mapGenProgress.ts'
rng(f, 1, 101, temat='-', klasa='UI', status=ND, uwaga='postep generacji / timery wydajnosci (UI+perf); ew. callback postepu w M18 jako opcja')
f = 'riverGenSwitch.ts'
ov(f, 'RIVER_GEN_STORAGE_KEY', temat='-', klasa='NIE-DOTYCZY', status=ND, uwaga='klucz localStorage przegladarki')
ov(f, 'RIVER_GEN_PHASE_STORAGE_KEY', temat='-', klasa='NIE-DOTYCZY', status=ND, uwaga='klucz localStorage przegladarki')
ov(f, 'RiverGenPhase', temat='M02', klasa='SYSTEM', status=BR, uwaga="enum 'main'|'main+medium'|'all' -> parametr generatora; domyslnie 'main+medium' (riverGenSwitch.ts:73)")
ov(f, 'setRiverGenEnabledOverride', temat='-', klasa='NIE-DOTYCZY', status=ND, uwaga='override dla workera/UI (stan modulowy)')
ov(f, 'setRiverGenPhaseOverride', temat='-', klasa='NIE-DOTYCZY', status=ND, uwaga='override dla workera/UI (stan modulowy)')
ov(f, 'getRiverGenEnabled', temat='M02', klasa='SYSTEM', status=BR, uwaga='odczyt URL/localStorage = NIE-DOTYCZY; domyslna wartosc `true` (riverGenSwitch.ts:53) -> parametr `rivers_enabled` generatora')
ov(f, 'getRiverGenPhase', temat='M02', klasa='SYSTEM', status=BR, uwaga="odczyt URL/localStorage = NIE-DOTYCZY; domyslna 'main+medium' -> parametr")
ov(f, 'isRiverGenMainOnly', temat='M02', klasa='SYSTEM', status=BR, uwaga='predykat na parametrze fazy')
ov(f, 'isRiverGenFull', temat='M02', klasa='SYSTEM', status=BR, uwaga='predykat na parametrze fazy')
f = 'minimap.ts'
rng(f, 1, 271, temat='-', klasa='UI', status=ND, uwaga='dane minimapy (render/DOM; importuje render/hexutil)')
f = 'map-attack-city.ts'
rng(f, 1, 155, temat='-', klasa='UI', status=ND,
    uwaga='routing klikniecia na wrogie miasto (hinty UI); decyzje oblezenia siedza w game/mapSiegeDetect.ts -- poza katalogiem map/, do P6.13')

# ---- mapSnapshot
f = 'mapSnapshot.ts'
rng(f, 1, 404, temat='M17', klasa='SYSTEM', status=BR, uwaga='serializacja mapy do zapisu (kolumny rzadkie) -- uzywane w game/save.ts, game/load-map-source.ts; Rust: `save_load.rs` (inny format, bez mapy hexow)')

# ---- newGameMapDefaults (DATA/SYSTEM parametry)
f = 'newGameMapDefaults.ts'
rng(f, 1, 743, temat='M02', klasa='SYSTEM', status=BR, uwaga='parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE')
ov(f, 'MAX_MIAST_PANSTWA', temat='M02', klasa='DATA', status=BR, uwaga='=9 (web_data_check.out.txt)')
ov(f, 'MAX_TYPY_CYWILIZACJI_MENU', temat='M02', klasa='DATA', status=BR, uwaga='=15')
ov(f, 'menuLabelToDims', temat='M02', klasa='SYSTEM', status=BR, uwaga='re-eksport z generator.ts')
ov(f, 'rozmiarFromMenuLabel', temat='M02', klasa='SYSTEM', status=BR, uwaga='re-eksport z generator.ts')
ov(f, 'LandFractionPercent', temat='M02', klasa='DATA', status=CZ, rust=['pb_lfp'],
   uwaga='Rust ma pole `land_fraction_percent: u8` w parametrach rozgrywki (playable.rs), bez zbioru dozwolonych wartosci i funkcji `resolveLandFraction`')
for sym in ('TYP_SWIATA_MENU_LABELS', 'QUALITY_MENU_LABELS', 'DENSITY_MENU_LABELS', 'LAND_FRACTION_PERCENT_OPTS',
            'DEFAULT_PLAYER_CIV_ID', 'DEFAULT_START_EPOCH_ID', 'DEFAULT_RENDER_QUALITY', 'DEFAULT_MAP_DETAIL_QUALITY'):
    ov(f, sym, temat='M02', klasa='UI' if 'LABELS' in sym or 'QUALITY' in sym else 'DATA', status=BR if 'LABELS' not in sym and 'QUALITY' not in sym else ND,
       uwaga='etykiety menu / jakosc renderu = UI' if ('LABELS' in sym or 'QUALITY' in sym) else 'stala domyslna nowej gry')
for sym in ('qualityTierFromLabel', 'qualityTierToLabel', 'bundledMapQualityPreset', 'bundledMapQualityFromLabel', 'QualityTier',
            'BundledMapQualityPreset', 'isLargeMapMenuLabel'):
    ov(f, sym, temat='-', klasa='UI', status=ND, uwaga='jakosc renderu/menu (nie wplywa na stan gry)')

# ---- gen-helpers: reguly zakresowe (domyslnie BRAK) -- potem override'y
f = GH
rng(f, 33, 252, temat='M01', klasa='SYSTEM', status=BR, uwaga='prymitywy: PRNG/szum/hex/klimat')
rng(f, 253, 825, temat='M03', klasa='SYSTEM', status=BR, uwaga='maski ladu i centra kontynentow')
rng(f, 826, 1176, temat='M04', klasa='SYSTEM', status=BR, uwaga='klasyfikacja terenu')
rng(f, 1177, 1410, temat='M04', klasa='SYSTEM', status=BR, uwaga='brzeg/margines mapy')
rng(f, 1411, 2370, temat='M05A', klasa='SYSTEM', status=BR, uwaga='masy ladu, relief wg szumu, pokrycie')
rng(f, 2371, 3185, temat='M05B', klasa='SYSTEM', status=BR, uwaga='pokrycie reliefu, pasma gorskie')
rng(f, 3186, 4374, temat='M06A', klasa='SYSTEM', status=BR, uwaga='bilans lad/morze, wybrzeze, wody srodladowe')
rng(f, 4375, 5120, temat='M06B', klasa='SYSTEM', status=BR, uwaga='pangea/korytarze, finalizacja wybrzeza, wyspy')
rng(f, 5121, 6069, temat='M07A', klasa='SYSTEM', status=BR, uwaga='rzeki A: sciezki/pola')
rng(f, 6070, 7253, temat='M07B', klasa='SYSTEM', status=BR, uwaga='rzeki B: trace')
rng(f, 7254, 8341, temat='M07C', klasa='SYSTEM', status=BR, uwaga='rzeki C: dolywy srednie')
rng(f, 8342, 9562, temat='M07D', klasa='SYSTEM', status=BR, uwaga='rzeki D: walidacja/przycinanie')
rng(f, 9563, 10531, temat='M07E1', klasa='SYSTEM', status=BR, uwaga='rzeki E1: uzupelnienia/pokrycie')
rng(f, 10532, 11934, temat='M07E2', klasa='SYSTEM', status=BR, uwaga='rzeki E2: generateRivers')
rng(f, 11935, 12475, temat='M08', klasa='SYSTEM', status=BR, uwaga='zloza/las/fair-play')
rng(f, 12476, 13000, temat='M13', klasa='SYSTEM', status=BR, uwaga='pozycje startowe')
ov(f, 'RiverMapParams', temat='M01', klasa='SYSTEM', status=BR, uwaga='re-eksport typu z newGameMapDefaults.ts (definicja = temat M02); instrukcja re-eksportu lezy w zakresie M01 (gen-helpers.ts:33)')
ov(f, 'TypSwiata', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_world'], test=['t_mapgen_world'],
   uwaga='literaly kontynenty|pangea|wyspy|ziemia = serde Rust (test porownuje z literalami weba)')
ov(f, 'mulberry32', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_mulberry', 'rng_mulberry'], test=['t_mm_mulberry', 't_p61_mulberry'],
   uwaga='web_pure_check.out.txt: seed 42 = test :1348; sweep 300 ziaren x 64 wartosci rowne w OBU implementacjach Rust (19200/19200); DWIE kopie w Rust -- dedup w M01')
ov(f, 'buildPermTable', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_perm'], test=['t_mm_noise'], uwaga='perm[0..16] seed 42 rowne z webem (web_pure_check.out.txt); funkcja prywatna w Rust')
ov(f, 'cosLerp', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_coslerp'], test=['t_mm_noise'], uwaga='posrednio przez wektory valueNoise2D/fbm (prywatna)')
ov(f, 'valueNoise2D', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_noise'], test=['t_mm_noise'], uwaga='2 wektory rowne z webem (web_pure_check.out.txt); prywatna')
ov(f, 'fbm', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_fbm'], test=['t_mm_noise'], uwaga='2 wektory rowne z webem; prywatna')
ov(f, 'HEX_DIRECTIONS', temat='M01', klasa='DATA', status=CZ, rust=['mm_dirs'], test=['t_hex_dist'], uwaga='ta sama kolejnosc 6 kierunkow wg odczytu; test geometrii, nie wektor weba')
ov(f, 'hexDistanceAxial', temat='M01', klasa='SYSTEM', status=CZ, rust=['hex_dist', 'mm_dist'], test=['t_hex_dist'],
   uwaga='sweep 1681 par: rowne w hex.rs i map_generator.rs (sweep.out.txt); testy w repo = geometria, bez wektora weba -> dodac w M01')
ov(f, 'hexKey', temat='M01', klasa='SYSTEM', status=CZ, rust=['hex_key'], test=['t_hex_key'], uwaga='format "q,r"; test round-trip, nie wektor weba')
ov(f, 'ClimateZone', temat='-', klasa='UI', status=ND, uwaga='@deprecated; tylko render las-dzungla')
ov(f, 'climateZoneAt', temat='-', klasa='UI', status=ND, uwaga='tylko render (render/mapRenderStyle.ts)')
ov(f, 'ClimateBand', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_band_enum'], test=['t_mm_climate'], uwaga='7 pasow, nazwy serde = literaly weba')
for sym, why in (('CLIMATE_POLAR_FRAC', '0.05'), ('CLIMATE_DESERT_HALF_ROWS', '3.5'), ('CLIMATE_PLAINS_HALF_FRAC', '0.075'),
                 ('CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC', '0.05')):
    ov(f, sym, temat='M01', klasa='DATA', status=CZ, rust=['mm_climate'], test=['t_mm_climate'],
       uwaga=f'literal {why} wbudowany w `climate_band_at` (stala nie jest osobno przypieta; posrednio przez 8 wierszy h=28); sweep h=6..130 8500/8500 rownych')
ov(f, 'CLIMATE_DESERT_HALF_FRAC', temat='-', klasa='DATA', status=ND, uwaga='martwy eksport: uzyty tylko w definicji (grep -rn: 1 trafienie, gen-helpers.ts:182)')
ov(f, 'climateBandAt', temat='M01', klasa='SYSTEM', status=ZW, rust=['mm_climate'], test=['t_mm_climate'],
   uwaga='sweep 125 wysokosci x wiersze (isEarth false/true): 17000/17000 rownych (sweep.out.txt)')
ov(f, 'isPolarClimateBand', temat='M01', klasa='SYSTEM', status=CZ, rust=['mm_is_polar'], uwaga='trywialny predykat; test wektorowy brak')
ov(f, 'latitudinalOceanBufferRows', temat='M01', klasa='SYSTEM', status=CZ, rust=['mm_climate', 'mm_earth_rows'],
   uwaga='w Rust wbudowane w `climate_band_at` (tryb nie-Ziemia: max(2, round(5%*h))); osobnej funkcji brak; sweep posrednio zgodny')
ov(f, 'isInLatitudinalOceanBuffer', temat='M04', klasa='SYSTEM', status=BR,
   uwaga='web generator zeruje landMask w buforze (generator.ts:236); w Rust `generate_map` (map_generator.rs:329-430) brak odpowiednika -- jedna z roznic potoku')
ov(f, 'ShapeParams', temat='M03', klasa='SYSTEM', status=CZ, rust=['mm_shape'], test=['t_mm_mask'],
   uwaga='Rust `ShapeParams::from_rng` prywatne; noise_scale zgodny (maski), offsety NIE_ZMIERZONO; Rust `size_norm.max(1.0)` vs web `sizeNorm` bez klamry (generator.ts:174) -> rozne dla map <36')
ov(f, 'defaultShapeParams', temat='M03', klasa='SYSTEM', status=CZ, rust=['mm_shape'], test=['t_mm_mask'], uwaga='kolejnosc rand(): 6 offsetow po permutacji; zgodna wg odczytu, wektor offsetow NIE_ZMIERZONO')
ov(f, 'landMaskAt', temat='M03', klasa='SYSTEM', status=BR, uwaga='eksport bez konsumentow poza re-eksportem generator.ts:847 (grep) -- maska eliptyczna "oryginalna", nieuzywana przez generator; kandydat na NIE-DOTYCZY (martwy)')
ov(f, 'ContinentCenter', temat='M03', klasa='SYSTEM', status=ZW, rust=['mm_center'], test=['t_mm_mask'], uwaga='struktura {nq,nr,radius}; uzyta w wektorach masek (prywatna)')
ov(f, 'buildFiveZoneContinentCenters', temat='M03', klasa='SYSTEM', status=ZW, rust=['mm_cont_centers'], test=['t_mm_mask'],
   uwaga='WASKO: centra wchodza do wektora maski kontynentow (3 pkt, 36x28 seed 42, landFraction 0.30; web_runtime_check.out.txt: 5 centrow, maska rowna); inne wymiary NIE_ZMIERZONO')
ov(f, 'buildPangeaBlobCenters', temat='M03', klasa='SYSTEM', status=ZW, rust=['mm_pangea_centers'], test=['t_mm_mask'], uwaga='WASKO: jw. (6 centrow, landFraction 0.60)')
ov(f, 'buildSixteenGridIslandCenters', temat='M03', klasa='SYSTEM', status=ZW, rust=['mm_island_centers'], test=['t_mm_mask'], uwaga='WASKO: jw. (16 centrow)')
ov(f, 'landMaskKontynenty', temat='M03', klasa='SYSTEM', status=ZW, rust=['mm_cont_mask'], test=['t_mm_mask'],
   uwaga='WASKO: 3 punkty; web_runtime_check.out.txt rowne co do 1e-15')
ov(f, 'landMaskPangea', temat='M03', klasa='SYSTEM', status=ZW, rust=['mm_pangea_mask'], test=['t_mm_mask'], uwaga='WASKO: 3 punkty; ostatnia cyfra roznica 1e-16 (web_runtime_check.out.txt)')
ov(f, 'landMaskWyspy', temat='M03', klasa='SYSTEM', status=ZW, rust=['mm_islands_mask'], test=['t_mm_mask'], uwaga='WASKO: 3 punkty; rowne')
ov(f, 'landMaskZiemia', temat='M03', klasa='SYSTEM', status=ZW, rust=['mm_earth_mask'], test=['t_mm_mask'], uwaga='WASKO: 7 punktow; rowne (web_runtime_check.out.txt)')
ov(f, 'ZIEMIA_LAND_CENTERS', temat='-', klasa='NIE-DOTYCZY', status=ND, uwaga='martwy eksport: jedyne trafienie to definicja (grep -rn gra/src: 1); Rust rowniez nie ma, `landMaskZiemia` uzywa szablonu')
for sym in ('KONTYNENTY_ZONE_COUNT', 'ISLAND_GRID_DIVISIONS'):
    ov(f, sym, temat='M03', klasa='DATA', status=CZ, rust=['mm_cont_centers'], uwaga='stala wbudowana w logike centrow Rust (prywatna); brak osobnego testu wartosci')
ov(f, 'terenCoverageCellSize', temat='M04', klasa='SYSTEM', status=CZ, rust=['mm_bias'], test=['t_mm_bias'], uwaga='=4 (gen-helpers.ts:889); w Rust osobnej funkcji brak, jest tylko literal 4 w `terrain_cell_bias` (`q / 4`); test `map_generator.rs` pinuje WYNIK `terrain_cell_bias`, nie te funkcje -> CZESCIOWO; web ma dodatkowo parametr `cellSize` w `terrainCellBias`')
ov(f, 'terrainCellBias', temat='M04', klasa='SYSTEM', status=ZW, rust=['mm_bias'], test=['t_mm_bias'], uwaga='4 wektory rowne z webem (web_pure_check.out.txt); prywatna')
ov(f, 'classifyTerrain', temat='M04', klasa='SYSTEM', status=CZ, rust=['mm_classify'], test=['t_mm_bias'],
   uwaga='6 przypadkow rowne (web_runtime_check.out.txt) ale TYLKO progi domyslne (thresholds=undefined) -- web przyjmuje progi tier-ow gestosci (generator.ts:162)')
ov(f, 'landMaskBorderFade', temat='M04', klasa='SYSTEM', status=CZ, rust=['mm_border_fade'], test=['t_mm_mask'], uwaga='uzyte posrednio w maskach (wektory 3 pkt); brak osobnego testu')
ov(f, 'mapEdgeRectFade', temat='M04', klasa='SYSTEM', status=CZ, rust=['mm_edge_fade'], test=['t_mm_mask'], uwaga='uzyte posrednio w maskach; brak osobnego testu')
ov(f, 'hexBorderDistance', temat='M04', klasa='SYSTEM', status=CZ, rust=['mm_border_dist'], uwaga='odpowiednik `border_distance` (prywatna); brak testu')
ov(f, 'applyClimateBandsToHexes', temat='M06A', klasa='SYSTEM', status=CZ, rust=['mm_apply_climate'],
   uwaga='Rust `apply_climate_bands` na uproszczonym modelu HexTile (bez nakladek/zloz); brak testu wektorowego; kolejnosc w potoku inna')
ov(f, 'applyCoastRing', temat='M06A', klasa='SYSTEM', status=CZ, rust=['mm_coast'],
   uwaga='Rust `mark_coast_tiles` = jeden pierscien Morze->PlytkieMorze przy ladzie (nie czyta isDryLandTerrain/nakladek); web ma tez applyDoubleCoastRing; brak testu wektorowego')
ov(f, 'DepositRule', temat='M08', klasa='DATA', status=CZ, rust=['tm_deprule'], test=['t_tm_params'], uwaga='typ danych parsowany w Rust (spot-check), bez logiki losowania')
ov(f, 'DEPOSIT_RULES', temat='M08', klasa='DATA', status=CZ, rust=['tm_deprules'], test=['t_tm_params'], uwaga='tabela regul zloz = dane `map-gen-params.json`; test spot-check; funkcje placeDeposits nieobecne')
for sym in ('pangeaBagelAuditSnaps', 'startPangeaBagelAudit', 'takePangeaBagelAuditSnaps', 'snapPangeaBagelAudit', 'PangeaBagelAuditSnap',
            'measurePangeaAnnularCorridorHexes', 'RiverProfileStats', 'resetRiverProfileStats', 'getRiverProfileStats',
            'formatRiverProfileReport', 'auditMapTerrainData', 'assertReliefGridCoverage', 'assertRiverPathAdjacent', 'assertRiverGridCoverage'):
    ov(f, sym, temat='-', klasa='NIE-DOTYCZY', status=ND, uwaga='diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test')
ov(f, 'StartPosition', temat='M13', klasa='SYSTEM', status=BR, uwaga='web {q,r,...} pozycja startowa generatora; w Rust brak tego typu (`start_position.rs` operuje slotami klastra)')

# ---- generator.ts
f = 'generator.ts'
rng(f, 100, 900, temat='M18', klasa='SYSTEM', status=BR, uwaga='orkiestracja generateMap / rozmiary swiata')
ov(f, 'WorldGenOptions', temat='M18', klasa='SYSTEM', status=BR, uwaga='re-eksport typu z newGameMapDefaults.ts:442 (definicja = temat M02); instrukcja re-eksportu nalezy do fasady generatora = M18')
ov(f, 'MapGenProgressCallback', temat='-', klasa='UI', status=ND, uwaga='re-eksport typu callbacku postepu')
ov(f, 'MapGenPhaseTimings', temat='-', klasa='UI', status=ND, uwaga='re-eksport typu timerow')
ov(f, 'DEFAULT_WIDTH', temat='M18', klasa='DATA', status=CZ, rust=['tm_gen'], test=['t_tm_params'], uwaga='=36; dane `generator.default_width` identyczne (web_data_check.out.txt); test w repo NIE przypina tej wartosci')
ov(f, 'DEFAULT_HEIGHT', temat='M18', klasa='DATA', status=CZ, rust=['tm_gen'], test=['t_tm_params'], uwaga='=28; jw.')
ov(f, 'GameMapWithStarts', temat='M18', klasa='SYSTEM', status=BR, uwaga='typ wyniku (GameMap + startPositions); Rust `GeneratedMap` (map_generator.rs:152) to inny, uproszczony model')
ov(f, 'generateMap', temat='M18', klasa='SYSTEM', status=CZ, rust=['mm_generate'], test=[],
   uwaga='Rust `generate_map` = UPROSZCZONY potok (maska->klasyfikacja->klimat->pierscien wybrzeza->rzeki BFS). POMIAR vs 5 map z weba: rowny teren 22-43% hexow (cmp_generate_map_vs_web.out.txt) -> NIE jest portem')
ov(f, 'RozmiarSwiata', temat='M02', klasa='DATA', status=BR, uwaga='typ etykiety rozmiaru')
ov(f, 'ROZMIAR_DIMS', temat='M02', klasa='DATA', status=CZ, rust=['tm_rozmiar'], test=['t_tm_params'], uwaga='wymiary rowne z `rozmiar_dims` (web_data_check.out.txt); test w repo przypina tylko `standardowy` (data_terrain_map.rs:76)')
ov(f, 'ROZMIAR_MENU_LABELS', temat='-', klasa='UI', status=ND, uwaga='etykiety menu')
ov(f, 'rozmiarFromMenuLabel', temat='M02', klasa='SYSTEM', status=BR, uwaga='mapowanie etykiety menu -> rozmiar')
ov(f, 'rozmiarToDims', temat='M02', klasa='SYSTEM', status=CZ, rust=['tm_rozmiar'], uwaga='dane wymiarow sa w Rust, funkcja wyboru nie')
ov(f, 'menuLabelToDims', temat='M02', klasa='SYSTEM', status=CZ, rust=['tm_rozmiar'], uwaga='dane wymiarow sa w Rust, funkcja nie')
ov(f, 'generujSwiat', temat='M18', klasa='SYSTEM', status=BR, rust=['mm_generate'], uwaga='wrapper generateMap(rozmiar, typ, seed)')
ov(f, 'TypSwiata', temat='M18', klasa='SYSTEM', status=ZW, rust=['mm_world'], test=['t_mapgen_world'], uwaga='re-eksport typu (generator.ts:846); definicja w gen-helpers.ts (temat M01); instrukcja re-eksportu = fasada M18')
ov(f, 'RozmiarSwiataType', temat='M18', klasa='DATA', status=BR, uwaga='re-eksport aliasu typu (definicja = temat M02); instrukcja re-eksportu = fasada M18')
ov(f, 'StartPosition', temat='M18', klasa='SYSTEM', status=BR, uwaga='re-eksport typu z gen-helpers.ts:12476 (definicja = temat M13); instrukcja re-eksportu = fasada M18')
ov(f, 'landMaskAt', temat='M18', klasa='SYSTEM', status=BR, uwaga='re-eksport (generator.ts:847); definicja gen-helpers.ts (temat M03); brak konsumentow')
ov(f, 'findBestPlayerStartHex', temat='M18', klasa='SYSTEM', status=BR, uwaga='re-eksport z startScoring.ts (definicja = temat M10); instrukcja re-eksportu = fasada M18')
ov(f, 'scoreCityStartHex', temat='M18', klasa='SYSTEM', status=BR, uwaga='re-eksport z startScoring.ts (definicja = temat M10); instrukcja re-eksportu = fasada M18')
ov(f, 'START_REVEAL_RADIUS', temat='M18', klasa='DATA', status=CZ, rust=['pl_reveal'], test=['t_pl_reveal'], uwaga='re-eksport (definicja startScoring.ts = temat M10); Rust przyjmuje promien jako PARAMETR (`is_hex_in_start_reveal`), stala =5 nieobecna')

# ---- improvement-build.ts
f = 'improvement-build.ts'
rng(f, 1, 1600, temat='M16', klasa='SYSTEM', status=BR, uwaga='reguly budowy ulepszen na mapie')
for sym in ('ImprovementBuildState', 'ImprovementTypeInfo', 'ImprovementBuildRequest', 'ImprovementBuildCallbacks',
            'ImprovementBuildModeOptions', 'createImprovementBuildApi', 'isImprovementVisibleInBuildPanel', 'getImprovementForestBlockHint',
            'formatImprovementBuildImpactList', 'galleryTerrainEligible', 'galleryComboEligible', 'galleryComboShowModel',
            'getForestBuildBlockReason', 'LegacyFarmHexView'):
    ov(f, sym, temat='-', klasa='UI', status=ND, uwaga='API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI)')
ov(f, 'isImprovementBlockedOnForest', temat='M16', klasa='SYSTEM', status=CZ, rust=['im_forest'], uwaga='Rust `forest_gate` (prywatna) blokuje Farm/Irrigation/Cattle/Terraces na lesie; stadnina/owce/inne reguly web NIE_ZMIERZONO; brak testu wektorowego weba')
ov(f, 'isStadninaBlockedOnForest', temat='M16', klasa='SYSTEM', status=BR, uwaga='regula stadniny na lesie; w Rust tylko ogolny `forest_gate`')
ov(f, 'canAddFoodLayer', temat='M16', klasa='SYSTEM', status=CZ, rust=['im_layers'], uwaga='Rust `layers_allow` (prywatna) - warstwy zywnosci; zgodnosc z kanonem web NIE_ZMIERZONO (brak wektora weba)')
ov(f, 'depositAllowsPlayerImprovement', temat='M16', klasa='SYSTEM', status=CZ, rust=['im_deposit'], uwaga='Rust `deposit_gate` (prywatna) - inna reprezentacja zloz (`Deposit` enum vs nakladka/zloze weba); brak testu wektorowego weba')
ov(f, 'hasBlockingDepositForFarm', temat='M16', klasa='SYSTEM', status=CZ, rust=['im_deposit'], uwaga='web: zawsze false (wolne wspolistnienie, improvement-build.ts:743-747); Rust: `Farm => tile.deposit.is_none()` (deposit_gate) -- ROZBIEZNOSC do zbadania w M16')
ov(f, 'collectRoadKeys', temat='M15', klasa='SYSTEM', status=BR, uwaga='zbior kluczy drog; powiazane z road-movement.ts')
ov(f, 'isRoadImprovementKey', temat='M15', klasa='SYSTEM', status=BR, uwaga='re-eksport z road-movement.ts:59')

# ---- range-hexes / territory / territory-work / territory-border
f = 'range-hexes.ts'
rng(f, 1, 115, temat='M14', klasa='SYSTEM', status=BR, uwaga='zbiory hexow zasiegu (kultura/religia) -- zalezne od game/culture-religion.ts (P6.16) i okolica.ts (P6.8)')
f = 'territory.ts'
rng(f, 1, 145, temat='M14', klasa='SYSTEM', status=BR, uwaga='terytorium wezlow')
ov(f, 'CityNode', temat='M14', klasa='SYSTEM', status=BR, uwaga='Rust `TerritoryNode` ma pole `radius` z gory (nie pop/isFort/isOutpost)')
ov(f, 'TerritoryNode', temat='M14', klasa='SYSTEM', status=CZ, rust=['tr_node'], uwaga='Rust `TerritoryNode{owner_id,q,r,radius}` (trade.rs) -- inny ksztalt (radius zamiast pop/fort/outpost)')
ov(f, 'axialDistance', temat='M14', klasa='SYSTEM', status=CZ, rust=['hex_dist'], test=['t_hex_dist'], uwaga='ta sama formula (cube/2) co `HexCoord::distance`; test geometrii, nie wektor weba')
for sym in ('cityRangeForPopulation', 'citySightRadius', 'CITY_RANGE_CAP', 'CITY_RANGE_MIN'):
    ov(f, sym, temat='M14', klasa='SYSTEM', status=BR, uwaga='re-eksport z game/okolica.ts (P6.8); w Rust brak (`grep city_range`=0)')
ov(f, 'cityTerritoryRadius', temat='M14', klasa='SYSTEM', status=BR, uwaga='fort=10, posterunek=5, miasto=cityRangeForPopulation; Rust przyjmuje radius od wywolujacego (komentarz trade.rs:262)')
ov(f, 'isInTerritory', temat='M14', klasa='SYSTEM', status=BR, uwaga='brak odpowiednika')
ov(f, 'territoryOwnerAt', temat='M14', klasa='SYSTEM', status=CZ, rust=['tr_owner'], uwaga='ta sama regula (najblizszy w promieniu, remis -> pierwszy) wg odczytu; funkcja PRYWATNA w trade.rs, brak testu wektorowego weba')
ov(f, 'isPlayerTerritoryHex', temat='M14', klasa='SYSTEM', status=BR, uwaga='brak odpowiednika')
f = 'territory-work.ts'
rng(f, 1, 166, temat='M14', klasa='SYSTEM', status=BR, uwaga='praca na heksach terytorium (reczne/auto), zalezne od game/cities.ts (P6.6)')
ov(f, 'TerritoryNode', temat='M14', klasa='SYSTEM', status=CZ, rust=['tr_node'], uwaga='re-eksport typu z territory.ts')
f = 'territory-border.ts'
rng(f, 1, 238, temat='-', klasa='UI', status=ND, uwaga='geometria obrysu granic do renderu (render/rangeOverlay.ts); zero konsumentow logiki')

# ---- road
f = 'road-movement.ts'
for sym, key in (('ROAD_MOVE_SPEED_MULT', 'ROAD_MOVE_SPEED_MULT'), ('ROAD_BRUK_MOVE_SPEED_MULT', 'ROAD_BRUK_MOVE_SPEED_MULT'),
                 ('ROAD_MIN_MOVE_COST', 'ROAD_MIN_MOVE_COST'), ('ROAD_BRUK_MIN_MOVE_COST', 'ROAD_BRUK_MIN_MOVE_COST')):
    ov(f, sym, temat='M15', klasa='DATA', status=CZ, rust=['dv_road'], test=['t_road'],
       uwaga='wartosc w `road-movement-multipliers.json` zapisana z odczytu TS (P3-23); test w repo BEZ pinow wartosci (road_movement_multipliers.rs:1-3), wartosci sprawdza poza repo verify-road-web.py -- dodac pin w M15')
ov(f, 'isRoadImprovementKey', temat='M15', klasa='SYSTEM', status=BR, uwaga="Rust ma enum `ImprovementKey::Road/PavedRoad`; predykat po kluczu tekstowym ('droga'|'droga_brukowana') nieobecny")
ov(f, 'hexHasRoad', temat='M15', klasa='SYSTEM', status=BR, uwaga='brak odpowiednika')
ov(f, 'applyRoadMovementModifier', temat='M15', klasa='SYSTEM', status=CZ, rust=['pf_cost', 'pf_road'], uwaga='Rust `movement_cost_with_rules` dzieli koszt przez dzielnik drogi; wywolanie z petli gry BRAK (P3-23 ZALOZENIE 1); brak testu wektorowego weba')
f = 'road-network.ts'
rng(f, 1, 182, temat='-', klasa='UI', status=ND, uwaga='maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts)')

# ---- startScoring / villages / wonder
f = 'startScoring.ts'
ov(f, 'START_REVEAL_RADIUS', temat='M10', klasa='DATA', status=CZ, rust=['pl_reveal'], test=['t_pl_reveal'], uwaga='Rust przyjmuje promien jako parametr; stala 5 nieobecna')
ov(f, 'startRevealRadiusForDifficulty', temat='M10', klasa='SYSTEM', status=BR, uwaga="easy=10 / normal=8 / hard=5; Rust `is_hex_in_start_reveal` ma parametr, ale mapa trudnosc->promien nieobecna")
ov(f, 'scoreCityStartHex', temat='M10', klasa='SYSTEM', status=BR, uwaga='punktacja startu (rzeka +14, sasiad rzeki +8, ...)')
ov(f, 'findBestPlayerStartHex', temat='M10', klasa='SYSTEM', status=BR, uwaga='zalezy od clusters.ts: groupHabitableMasses, passesPlayerStartMassGate, developmentSpaceScore (domkniecie AST: {STS_CL_N} deklaracji `clusters.ts`/{STS_CL_LOC} LOC, callgraph-startscoring.txt)')
f = 'villages.ts'
rng(f, 1, 214, temat='M13', klasa='SYSTEM', status=BR, uwaga='wioski/chaty (LCG Numerical Recipes, nie mulberry)')
ov(f, 'VILLAGE_HUTS_PER_CITY', temat='M13', klasa='DATA', status=BR, uwaga='{hard:1, normal:2, easy:3}')
ov(f, 'VILLAGE_LAND_HEX_PER_VILLAGE', temat='M13', klasa='DATA', status=BR, uwaga='@deprecated (legacy fallback)')
ov(f, 'VILLAGE_MIN_DIST_FROM_CITY', temat='M13', klasa='DATA', status=BR, uwaga='=3')
ov(f, 'VILLAGE_MIN_SPACING', temat='M13', klasa='DATA', status=BR, uwaga='=3')
f = 'wonder-placement.ts'
rng(f, 1, 119, temat='M14', klasa='SYSTEM', status=BR, uwaga='kwalifikacja hexow pod cuda; zalezne od territory.ts i units/setup (hexDistance)')

# ---------------------------------------------------------------- wyznaczanie wierszy
KIND_CLASS_DEFAULT = {'reexport-type': 'SYSTEM', 'const': 'DATA', 'interface': 'SYSTEM', 'type': 'SYSTEM', 'function': 'SYSTEM', 'class': 'SYSTEM', 'let': 'SYSTEM',
                      'enum': 'SYSTEM', 'reexport': 'SYSTEM', 'star': 'SYSTEM', 'none': 'SYSTEM'}


def lookup(fn, line, sym, kind):
    d = None
    if (fn, sym) in OV:
        d = OV[(fn, sym)]
    else:
        for lo, hi, a in RNG.get(fn, []):
            if lo <= line <= hi:
                d = a
                break
    if d is None:
        raise SystemExit(f'BLAD: brak reguly dla {fn}:{line} {sym}')
    d = dict(d)
    if not d['klasa']:
        d['klasa'] = KIND_CLASS_DEFAULT.get(kind, 'SYSTEM')
    return d


# domkniecia z callgraphow (AST, callgraph_ast.cjs): mapowanie do M09 / M10
def parse_closure(path):
    """-> (meta, {plik: [(start, end, nazwa, loc)]}); meta = (liczba_decl, loc) z linii `== tytul: N deklaracji, M LOC`."""
    out = collections.defaultdict(list)
    meta = None
    cur = None
    for l in open(path, encoding='utf-8'):
        if l.startswith('== '):
            m = re.match(r'== .*?: (\d+) deklaracji, (\d+) LOC', l)
            meta = (int(m.group(1)), int(m.group(2)))
        elif l.startswith('-- '):
            cur = l[3:].split(':')[0]
        elif l.startswith('  ') and l.strip():
            loc_, name, n = l.rstrip('\n').split('\t')
            a, b = loc_.strip().split(':')[1].split('-')
            out[cur].append((int(a), int(b), name, int(n)))
    return meta, out


def closure_names(path):
    return {fn: {x[2] for x in items} for fn, items in parse_closure(path)[1].items()}


RIV_META, RIV_ITEMS = parse_closure(os.path.join(HERE, 'callgraph-rivals.txt'))
STS_META, STS_ITEMS = parse_closure(os.path.join(HERE, 'callgraph-startscoring.txt'))
CC_META, CC_ITEMS = parse_closure(os.path.join(HERE, 'callgraph-computeclusters.txt'))
SP_META, SP_ITEMS = parse_closure(os.path.join(HERE, 'callgraph-spawnplan.txt'))
RIV = {fn: {x[2] for x in items} for fn, items in RIV_ITEMS.items()}
STS = {fn: {x[2] for x in items} for fn, items in STS_ITEMS.items()}


def csum(items, fn):
    return len(items.get(fn, [])), sum(x[3] for x in items.get(fn, []))


RIV_CL = csum(RIV_ITEMS, 'clusters.ts')      # (17, 334)
RIV_CS = csum(RIV_ITEMS, 'cluster-spawn.ts')
RIV_GH = csum(RIV_ITEMS, 'gen-helpers.ts')
STS_CL = csum(STS_ITEMS, 'clusters.ts')
STS_SS = csum(STS_ITEMS, 'startScoring.ts')
STS_GH = csum(STS_ITEMS, 'gen-helpers.ts')
CC_CL = csum(CC_ITEMS, 'clusters.ts')
CC_GH = csum(CC_ITEMS, 'gen-helpers.ts')
SP_CS = csum(SP_ITEMS, 'cluster-spawn.ts')
# deklaracje juz przeniesione do Rust (P6.1C: typy; gen-helpers: istnieja w map_generator.rs/rng.rs/hex.rs) -- poza zakresem M09
M09_SKIP = {('cluster-spawn.ts', 'ClusterSpawnSlot'), ('cluster-spawn.ts', 'ForeignTypeClusterGroup')}
M09_DECLS = [(fn, a, b, n, loc) for fn, items in RIV_ITEMS.items() if fn != 'gen-helpers.ts'
             for (a, b, n, loc) in items if (fn, n) not in M09_SKIP]
RIV_CSX = (sum(1 for d in M09_DECLS if d[0] == 'cluster-spawn.ts'), sum(d[4] for d in M09_DECLS if d[0] == 'cluster-spawn.ts'))
SUBST = {
    '{RIV_CL_N}': str(RIV_CL[0]), '{RIV_CL_LOC}': str(RIV_CL[1]), '{RIV_CSX_N}': str(RIV_CSX[0]), '{RIV_CSX_LOC}': str(RIV_CSX[1]),
    '{RIV_GH_N}': str(RIV_GH[0]), '{STS_CL_N}': str(STS_CL[0]), '{STS_CL_LOC}': str(STS_CL[1]), '{STS_SS_N}': str(STS_SS[0]),
    '{STS_SS_LOC}': str(STS_SS[1]), '{CC_CL_N}': str(CC_CL[0]), '{CC_CL_LOC}': str(CC_CL[1]), '{CC_GH_N}': str(CC_GH[0]), '{CC_GH_LOC}': str(CC_GH[1]),
}


def subst(txt):
    for k, v in SUBST.items():
        txt = txt.replace(k, v)
    return txt


for _t in TOPICS.values():
    for _k in ('uwaga', 'kol', 'par', 'deps'):
        _t[_k] = subst(_t[_k])

rows = []
LOC_FALLBACK = []
for e in exports:
    fn, loc, locall, line, kind, sym, frm = e[0], e[1], e[2], int(e[3]), e[4], e[5], e[6]
    d = lookup(fn, line, sym, kind)
    d['uwaga'] = subst(d['uwaga'])
    if fn == 'clusters.ts' and sym in RIV.get('clusters.ts', set()) and (fn, sym) not in OV:
        d['temat'] = 'M09'
        d['uwaga'] = 'w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); ' + d['uwaga']
    elif fn == 'clusters.ts' and sym in STS.get('clusters.ts', set()) and (fn, sym) not in OV:
        d['uwaga'] = 'w domknieciu startScoring (callgraph-startscoring.txt); ' + d['uwaga']
    own_occ = sum(len(re.findall(r'(?<![\w$])' + re.escape(sym) + r'(?![\w$])', l)) for l in WEBTXT[fn]) if sym not in ('*', '(brak eksportow)') else 0
    other_map = sum(1 for g, ls in WEBTXT.items() if g != fn and any(re.search(r'(?<![\w$])' + re.escape(sym) + r'(?![\w$])', l) for l in ls)) if sym not in ('*', '(brak eksportow)') else 0
    use = USAGE.get((fn, str(line), sym), {})
    tag = {'(root)': 'main.ts', 'game': 'game', 'units': 'units', 'ui': 'ui', 'render': 'render', 'data': 'data', 'perf': 'perf', 'audio': 'audio', 'battle': 'battle'}
    ustr = ','.join(f'{tag.get(k, k)}:{v}' for k, v in sorted(use.items())) or '-'
    rowloc = 1 if kind in ('reexport', 'reexport-type', 'star') else ast_loc(fn, line)
    if rowloc is None:
        LOC_FALLBACK.append((fn, line, sym))
        rowloc = span_loc(fn, line)
    rows.append(dict(fn=fn, line=line, kind=kind, sym=sym, klasa=d['klasa'], loc=rowloc, use=ustr, own=own_occ - 1 if own_occ else 0,
                     othermap=other_map, rust=[REF[k] for k in d['rust']], test=[REF[k] for k in d['test']], status=d['status'],
                     temat=d['temat'], uwaga=d['uwaga']))

# sanity: kazdy plik ma wiersz
assert {r['fn'] for r in rows} == set(FILES), 'brak wierszy dla czesci plikow'

# ---------------------------------------------------------------- tematy: LOC, przeciecia, kontrola
SIZE = lambda n: 'S' if n < 300 else 'M' if n < 1000 else 'L' if n < 2000 else 'XL'

# ---- wlasnosc linii plikow web przez tematy (JEDEN wlasciciel na linie => zakresy rozlaczne, LOC = suma linii niepustych)
OWN = {fn: {} for fn in FILES}
BASE_OVERLAP = []
for t in TOPICS.values():
    for fn, lo, hi in t['ranges']:
        for ln in range(lo, hi + 1):
            if ln in OWN[fn] and OWN[fn][ln] != t['tid']:
                BASE_OVERLAP.append((fn, ln, OWN[fn][ln], t['tid']))
            OWN[fn][ln] = t['tid']
assert not BASE_OVERLAP, f'zakresy bazowe tematow nachodza: {BASE_OVERLAP[:5]}'
CLAIMED = {}      # (plik, linia) -> temat przypisany deklaracja (nadpisanie zakresu bazowego)
MOVES = collections.Counter()   # (z, do) -> liczba linii niepustych przeniesionych


def claim(fn, lo, hi, tid, why):
    for ln in range(lo, hi + 1):
        prev = OWN[fn].get(ln)
        if (fn, ln) in CLAIMED and CLAIMED[(fn, ln)] != tid:
            raise SystemExit(f'BLAD: linia {fn}:{ln} przypisana deklaracjami do {CLAIMED[(fn, ln)]} i {tid} ({why})')
        CLAIMED[(fn, ln)] = tid
        if prev != tid:
            if WEBTXT[fn][ln - 1].strip():
                MOVES[(prev or 'poza tematami', tid)] += 1
            OWN[fn][ln] = tid


# (a) wycinek M09: kazda deklaracja z domkniecia rywali (AST), razem z komentarzem nad nia
for fn, a, b, n, loc in M09_DECLS:
    claim(fn, SPANS[fn][a][1], b, 'M09', f'domkniecie rywali: {n}')
ROW_CLAIMS = []
# (b) deklaracje przypisane wierszami §4 do tematu, ktorego zakres bazowy ich nie obejmuje
for r in rows:
    if r['temat'] == '-':
        continue
    sp = SPANS[r['fn']].get(r['line'])
    if sp is None:
        sp = (r['line'], r['line'], '', '')
    if all(OWN[r['fn']].get(ln) == r['temat'] for ln in range(sp[1], sp[0] + 1)):
        continue
    ROW_CLAIMS.append(r)
    claim(r['fn'], sp[1], sp[0], r['temat'], f"wiersz §4 {r['sym']}")


def owned_intervals(fn, tid):
    """Przedzialy linii nalezace do tematu; luka zlozona wylacznie z pustych linii bez innego wlasciciela scala przedzialy."""
    lines = sorted(ln for ln, o in OWN[fn].items() if o == tid)
    out = []
    for ln in lines:
        if out:
            gap = range(out[-1][1] + 1, ln)
            if ln == out[-1][1] + 1 or all(not WEBTXT[fn][g - 1].strip() and OWN[fn].get(g) in (None, tid) for g in gap):
                out[-1][1] = ln
                continue
        out.append([ln, ln])
    return [(a, b) for a, b in out]


for t in TOPICS.values():
    base = t['ranges']
    t['ranges_base'] = list(base)
    t['ranges'] = [(fn, a, b) for fn in FILES for (a, b) in owned_intervals(fn, t['tid'])]
    t['loc'] = sum(range_loc(fn, lo, hi) for fn, lo, hi in t['ranges'])
    t['files'] = sorted({fn for fn, _, _ in t['ranges']})
    t['size'] = SIZE(t['loc']) if t['ranges'] else 'S'

# ---- alokacje Rust P6.x: ZRODLO = wyciag verbatim z P6-0-GAP-ANALYSIS.md §6b (propozycja, nie plany) + pliki z planow w repo
P6 = {}
P6SRC = {}
for _l in open(os.path.join(HERE, 'p6-0-6b-excerpt.md'), encoding='utf-8'):
    if not _l.startswith('| R-RUSTPORT-P6-'):
        continue
    _c = [c.strip() for c in _l.strip().strip('|').split('|')]
    _key = '/'.join(x.strip() for x in _c[1].split(','))
    _paths = re.findall(r'((?:domain|data)/[A-Za-z0-9_]+\.rs)', _c[5])
    if _paths:
        P6[_key] = list(dict.fromkeys(_paths))
        P6SRC[_key] = 'PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo'
# plany ISTNIEJACE w repo (dyspozycje/rust-port/p6/): sciezki z ich sekcji "allowlista"/"zmiany" (linie w kolumnie zrodlo)
PLANS = {
    'P6.1': (['domain/rng.rs', 'domain/mod.rs', 'domain/unit_epoch.rs', 'domain/player.rs'], 'plan w repo: P6-1-STAN-STARTOWY.md §5 (allowlista r2)'),
    'P6.1B': (['data/derived.rs', 'domain/player.rs'], 'plan w repo: P6-1B.md §3 (allowlista), linie 54-55'),
    'P6.1C': (['domain/start_position.rs', 'data/derived.rs', 'domain/mod.rs'], 'plan w repo: P6-1C.md §7 (allowlista), linie 153-154'),
    'P6.1D': (['domain/city_names.rs', 'domain/civ_bonuses.rs', 'data/derived.rs', 'domain/mod.rs'], 'plan w repo: P6-1D.md §7 (allowlista), linie 125-126'),
}
for _k, (_paths, _src) in PLANS.items():
    P6[_k] = list(dict.fromkeys(P6.get(_k, []) + _paths))
    P6SRC[_k] = _src + ' (+ proponowane sciezki P6.0 §6b, jesli dotyczy)' if _k == 'P6.1' else _src


def norm(p):
    p = p.replace('src/', '', 1) if p.startswith('src/') else p
    return p


def globs_overlap(a, b):
    if a == b:
        return True
    for x, y in ((a, b), (b, a)):
        if x.endswith('/**') and y.startswith(x[:-2]):
            return True
        if '*' in x and not x.endswith('/**'):
            pre = x.split('*')[0]
            if y.startswith(pre) and pre != '':
                return True
    return False


def paths_wo_tests(allow):
    return [norm(p) for p in allow if not p.startswith('tests/')]


pairs = []
ids = list(TOPICS)
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        pa, pb = paths_wo_tests(TOPICS[a]['allow']), paths_wo_tests(TOPICS[b]['allow'])
        common = sorted({x for x in pa for y in pb if globs_overlap(x, y)})
        if common:
            pairs.append((a, b, common))
# tests: rozlaczne po konstrukcji (prefiks tests/p6_<id>_*); sprawdz
tpref = {}
for t in TOPICS.values():
    for p in t['allow']:
        if p.startswith('tests/'):
            tpref.setdefault(t['tid'], []).append(p)
tcoll = []
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        for x in tpref.get(a, []):
            for y in tpref.get(b, []):
                if globs_overlap(x, y):
                    tcoll.append((a, b, x, y))

P6coll = collections.defaultdict(list)
for tid, t in TOPICS.items():
    pa = paths_wo_tests(t['allow'])
    for pk, plist in P6.items():
        common = sorted({x for x in pa for y in plist if globs_overlap(x, y) or x == y})
        if common:
            P6coll[tid].append((pk, common))

# rownoleglosc: pary oznaczone 'rownolegle' w polu par nie moga miec wspolnych sciezek
parallel_groups = [['M01', 'M02', 'M09', 'M14', 'M15', 'M17'], ['M03', 'M04'], ['M07A', 'M08'], ['M11', 'M13', 'M14', 'M16']]
violations = []
for grp in parallel_groups:
    for i, a in enumerate(grp):
        for b in grp[i + 1:]:
            pa, pb = paths_wo_tests(TOPICS[a]['allow']), paths_wo_tests(TOPICS[b]['allow'])
            common = sorted({x for x in pa for y in pb if globs_overlap(x, y)})
            if common:
                violations.append((a, b, common))

# ---------------------------------------------------------------- statystyki
cnt = collections.Counter(r['status'] for r in rows)
byfile = collections.defaultdict(collections.Counter)
for r in rows:
    byfile[r['fn']][r['status']] += 1
cls = collections.Counter(r['klasa'] for r in rows)
bytopic = collections.defaultdict(list)
for r in rows:
    bytopic[r['temat']].append(r)

with open(os.path.join(HERE, 'gap-rows.tsv'), 'w', encoding='utf-8') as fh:
    fh.write('plik\tlinia\trodzaj\tsymbol\tklasa\tloc\tuzywane_poza_map\tstatus\ttemat\trust\ttest_rust\tuwaga\n')
    for r in rows:
        fh.write('\t'.join([r['fn'], str(r['line']), r['kind'], r['sym'], r['klasa'], str(r['loc']), r['use'], r['status'], r['temat'],
                            ' ; '.join(r['rust']), ' ; '.join(r['test']), r['uwaga']]) + '\n')
with open(os.path.join(HERE, 'backlog.tsv'), 'w', encoding='utf-8') as fh:
    fh.write('id\ttytul\tloc_web\trozmiar\tpliki_web\tallowlista\tzaleznosci\trownoleglosc\tkolizje_P6\n')
    for t in TOPICS.values():
        fh.write('\t'.join([f"R-RUSTPORT-P6-{t['tid']}-{t['title']}", t['title'], str(t['loc']), t['size'], ','.join(t['files']),
                            ' | '.join(t['allow']), t['deps'], t['par'], t['kol']]) + '\n')

# ---------------------------------------------------------------- dokument
def esc(s):
    return s.replace('|', '\\|')


L = []
A = L.append
A('# P6.25 - Analiza luk: gameplay-mapa web (`gra/src/map/**`) vs Rust (`rust-port/engine`)')
A('')
A('Temat: `R-RUSTPORT-P6-25-MAPA-GAP-Q1` · DOMAIN: GAME · RUNDA 2/5 (Obrona Operatora po FAIL Evaluatora; zarzuty 1-9 w §12). Status dokumentu: **WYNIK ANALIZY (zero zmian kodu)**.')
A('Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do katalogu POZA repo). Pin Rust: `origin/rust-port/parity-v2` @ `2b2f25a0`.')
A('Wzorzec: `dyspozycje/rust-port/p6/P6-0-GAP-ANALYSIS.md` (P6.0 = `gra/src/game/`; ten dokument = `gra/src/map/`, ktorego P6.0 NIE objelo).')
A('Skrypty, dane surowe i logi: `dyspozycje/autobot/runs/R-RUSTPORT-P6-25-MAPA-GAP-Q1/` (patrz §10 - indeks artefaktow).')
A('')
A('## 0. Metoda, legenda, ograniczenia (ANTY-HALUCYNACJA)')
A('')
A('- **Inwentarz web - skryptowy** (`inventory_map.py` na `git archive`): eksporty = linie `export ...` na poczatku wiersza, rozwijane (`export { a, b }`); '
  'wynik `web-exports.tsv`. Kontrola krzyzowa **w uruchomionym webie** (`web_runtime_check.out.txt`, `RUNTIME_EXPORTS`): liczby eksportow runtime '
  '(po wymazaniu typow) zgadzaja sie z liczba symboli niebedacych `interface`/`type` w kazdym module, ktory daje sie zaladowac (§1a).')
A('- **Web URUCHOMIONY**, nie tylko czytany: moduly `gra/src/map` laduja sie pod Node 22.22.0 (`--experimental-transform-types` + `loader-hooks.mjs`; ten sam wzorzec co P6.1C). '
  'Zero zmian w `gra/**` (kod wypakowany do `mktemp -d` poza repo). Przez to wektory porownawcze sa z PRAWDZIWEGO weba: `web_pure_check.mjs`, `web_runtime_check.mjs`, `sweep_web.mjs`, `web_data_check.mjs`.')
A('- **Rust uruchomiony** (crate scratch POZA repo, zaleznosc sciezkowa `civ-engine`; kod: `cmp_generate_map_vs_web.rs.txt`, `sweep_rust.rs.txt`): porownanie `generate_map` z 5 mapami `tests/p6_1c_vectors/maps.json` oraz sweep klimatu/Mulberry32/odleglosci.')
A('- **Mapowanie web -> Rust jest RECZNE** (`build_gap.py`, reguly po symbolach/zakresach linii). Referencje `plik:linia` w Rust skrypt **wyszukuje w tresci plikow** i konczy sie bledem, gdy wzorca brak; '
  'kontrola kandydatow po nazwie: `rust_name_hits.py` -> `rust-name-hits.tsv` (' + str(sum(1 for _ in open(os.path.join(HERE, 'rust-name-hits.tsv'), encoding='utf-8')) - 1) + ' trafien, wszystkie rozpatrzone). Zero numerow linii wpisanych z pamieci.')
A('- **Klasy**: `SYSTEM` (logika wplywajaca na wynik gry, w tym potok generatora), `DATA` (stale/tabele/loadery), `UI` (render/DOM/etykiety/postep), `NIE-DOTYCZY` (worker, localStorage, profiler/asercje deweloperskie, martwy kod).')
A('- **Statusy**: `ISTNIEJE-ZWERYFIKOWANE` = jest odpowiednik w Rust **i** test w repo porownuje go z danymi weba (wektory potwierdzone przeze mnie na uruchomionym webie; zakres wektora w kolumnie uwag, '
  'oznaczenie `WASKO` = tylko punktowe wektory, inne wymiary/ziarna NIE_ZMIERZONO; dla stalych/danych test musi PRZYPINAC wartosc, a nie tylko ja parsowac). `CZĘŚCIOWO` = jest odpowiednik/dane/pole, ale brak testu z danymi weba albo zakres niepelny. '
  '`BRAK` = brak odpowiednika logiki (dane lub pole struktury NIE sa logika - regula z P6.0). `NIE-DOTYCZY` = UI/worker/dev.')
A('- **Dowod z analizy vs test w repo**: sweepy (`sweep.out.txt`) i porownania danych (`earth_mask_compare.out.txt`, `web_data_check.out.txt`) to dowody ANALIZY; nie sa testami w repo. '
  'Status `ISTNIEJE-ZWERYFIKOWANE` wymaga testu w repo; gdzie sweep jest mocniejszy niz test w repo, zapisano to w uwagach i zaproponowano test w M01.')
A('- **`PORTOWANE-1:1` nie przyznano** zadnemu wierszowi (brak dowodu wektor-po-wektorze dla calych funkcji potoku).')
BR_CTX = [r for r in rows if r['status'] == BR and r['rust']]
A(f'- **Odnosniki Rust przy statusie BRAK** ({len(BR_CTX)} wierszy §4: ' + ', '.join(f'`{r["sym"]}`' for r in BR_CTX) + ') sa oznaczone `kontekst:` i NIE sa odpowiednikami: wskazuja miejsce, '
  'w ktorym Rust przyjmuje wynik z zewnatrz, albo INNA stala/struktura, ktora latwo pomylic z odpowiednikiem. Odpowiednik = odnosnik bez prefiksu `kontekst:` w wierszach CZESCIOWO / ISTNIEJE-ZWERYFIKOWANE.')
A('- **LOC (kolumna §4 i rozmiary tematow)**: LOC deklaracji = linie niepuste instrukcji top-level wg AST TypeScript (`decl_spans.cjs` -> `decl-spans.tsv`; bez JSDoc). '
  'Zakres tematu (§6) = zbior linii pliku web nalezacych do tematu; kazda linia ma JEDNEGO wlasciciela, wiec zakresy tematow sa rozlaczne, a LOC tematu = liczba niepustych linii jego zakresow (kontrola: `verify_gap.py`). '
  'Zakresy bazowe (projekt podzialu) sa korygowane deklaracjami: symbol z §4 przypisany do tematu zawsze lezy w zakresie tego tematu (komentarz nad deklaracja tez).')
A('')
A('## 1. Wskazniki (liczone skryptem `build_gap.py` z `gap-rows.tsv`)')
A('')
A('| Wskaznik | Wartosc |')
A('|---|---|')
nfiles = len(FILES)
A(f'| Plikow w `gra/src/map/` w pinie (`git ls-tree -r --name-only edb8fb56 gra/src/map \\| wc -l`) | **{nfiles}** (dispatch mowil 27 - **ROZBIEZNOSC**, patrz §2 pkt 1) |')
A(f'| Wierszy per plik (§3) | {nfiles} |')
A(f'| Wierszy per symbol (§4) = liczba eksportow | **{len(rows)}** (plik `web-exports.tsv`: {len(exports)} wierszy; kontrola rownosci w `build_gap.py`) |')
A(f'| LOC niepuste `gra/src/map` | {sum(FILE_LOC.values())} |')
for s in (ZW, CZ, BR, ND):
    A(f'| Symboli o statusie {s} | {cnt[s]} ({100 * cnt[s] / len(rows):.1f}%) |')
sys_data = [r for r in rows if r['klasa'] in ('SYSTEM', 'DATA')]
sd = collections.Counter(r['status'] for r in sys_data)
A(f'| Klasy: SYSTEM / DATA / UI / NIE-DOTYCZY | {cls["SYSTEM"]} / {cls["DATA"]} / {cls["UI"]} / {cls["NIE-DOTYCZY"]} |')
A(f'| SYSTEM+DATA razem | {len(sys_data)} symboli: ZW {sd[ZW]}, CZ {sd[CZ]}, BRAK {sd[BR]}, ND {sd[ND]} |')
A(f'| Pokrycie SYSTEM+DATA `ISTNIEJE-ZWERYFIKOWANE` | {sd[ZW]} / {len(sys_data)} = {100 * sd[ZW] / len(sys_data):.1f}% |')
A(f'| Pokrycie SYSTEM+DATA ZW+CZ (gorna granica) | {sd[ZW] + sd[CZ]} / {len(sys_data)} = {100 * (sd[ZW] + sd[CZ]) / len(sys_data):.1f}% |')
A(f'| LOC web w tematach backlogu (suma) | {sum(t["loc"] for t in TOPICS.values())} (pokrycie zakresow: kontrola w §6) |')
A('')
A('### 1a. Kontrola krzyzowa liczby eksportow (statyczna vs runtime)')
A('')
A('Runtime = `Object.keys(import(plik))` w uruchomionym webie (typy `interface`/`type` znikaja przy transformacji). Statyczne = `web-exports.tsv` bez rodzajow `interface`, `type` i `reexport-type` (`export type { ... }`).')
A('')
A('| plik | eksporty statyczne | w tym typy | statyczne bez typow | runtime | zgodne |')
A('|---|---|---|---|---|---|')
runtime_line = [l for l in open(os.path.join(HERE, 'web_runtime_check.out.txt'), encoding='utf-8') if l.startswith('RUNTIME_EXPORTS')][0]
import json
RT = json.loads(runtime_line[len('RUNTIME_EXPORTS '):])
for fn in FILES:
    tot = sum(1 for r in rows if r['fn'] == fn)
    ty = sum(1 for r in rows if r['fn'] == fn and r['kind'] in ('interface', 'type', 'reexport-type'))
    rt = RT.get(fn)
    ok = (isinstance(rt, int) and rt == tot - ty)
    A(f'| `{fn}` | {tot} | {ty} | {tot - ty} | {rt if isinstance(rt, int) else "n/d (import nieudany: " + str(rt)[:60] + ")"} | {"TAK" if ok else ("n/d" if not isinstance(rt, int) else "NIE")} |')
A('')
A('Uwaga: `generator.ts` eksportuje 13 runtime; 21 statycznych - 8 typow/re-eksportow typow = 13 (zgodne). `improvement-build.ts`, `genWorker.ts`, `mapGenAsync.ts` nie daja sie zaladowac w Node '
  '(`three`, `self`, `?worker&inline`) - dla nich obowiazuje wylacznie liczba statyczna.')
A('')
A('## 2. Kluczowe ustalenia')
A('')
A('1. **Liczba plikow: 25, nie 27.** `git ls-tree -r --name-only edb8fb56 gra/src/map | wc -l` = 25 (sprawdzone `find` w wypakowanym archiwum: tez 25; brak podkatalogow). '
  'Dispatch podawal 27; w tym dokumencie obowiazuje 25 i kazdy z 25 plikow ma wiersz. Nie ma plikow testowych w katalogu (`*.test.ts`/`*.spec.ts` = 0).')
A('2. **`generate_map` w Rust NIE jest portem `generateMap`.** Pomiar na 5 mapach z weba (`tests/p6_1c_vectors/maps.json`, wygenerowanych prawdziwym `generateMap`): '
  'rownosc terenu na poziomie pojedynczych hexow 22-43% (k3small 27%, k42 40%, k7 31%, p123 43%, w5 22%), rownosc ladu/wody 70-86% (`cmp_generate_map_vs_web.out.txt`). Rust to uproszczony potok '
  '(maska -> klasyfikacja -> klimat -> jeden pierscien wybrzeza -> rzeki BFS; `map_generator.rs:329-430`), web ma ~15 przebiegow (`generator.ts:148-775`) i ~12 tys. linii pomocnikow. '
  'Dla przepiecia na pelny potok konieczne sa tematy M03-M08 i M18.')
A('3. **Rdzen deterministyczny jest ZGODNY z webem** (to jest dobra wiadomosc): Mulberry32 (19200/19200 wartosci, 300 ziaren), perm/noise/fbm (wektory), `climateBandAt` (17000/17000 wierszy; h=6..130; Ziemia i nie-Ziemia), '
  'maski ladu 4 typow swiata (wektory 36x28 seed 42, rowne do 1e-15), dane maski Ziemi (288000 bitow identycznych), `terrainCellBias`, `classifyTerrain` (progi domyslne). Zakres wektorow jest WASKI - '
  'tylko jeden rozmiar/ziarno dla masek; M01 ma go poszerzyc.')
A('4. **Znalezione roznice potoku (kandydaci do M18, kazda z dowodem `plik:linia`)**: '
  '(a) `ShapeParams::from_rng(.., size_norm.max(1.0))` (`map_generator.rs`, wywolanie w `generate_map`) vs web `sizeNorm` bez klamry (`generator.ts:174-179`) - rozne dla map mniejszych niz 36 (np. 24x18 `k3small`: 27% rownych hexow); '
  '(b) web zeruje maske w buforze N/S `max(2, round(5%*h))` wierszy dla typow innych niz Ziemia (`generator.ts:236-238`); w Rust `generate_map` (map_generator.rs:329-430) nie znaleziono odpowiednika (brzeg d<2 jest zerowany wewnatrz masek przez `land_mask_border_fade`, zgodnie z `landMaskBorderFade`); roznica ujawnia sie dla h>=60 (bufor > 2) '
  '(c) las: Rust ustawia `forest` progiem szumu `forest_noise > 0.62` w petli terenu, web ma osobne przebiegi `reapplyForestOverlay` (`generator.ts:623`) i `ensureForestGridCoverage` (:624, :726); (d) rzeki: BFS `add_core_rivers` vs `generateRivers` (gen-helpers.ts:11525); (e) wybrzeze: Rust jeden przebieg `mark_coast_tiles` po klasyfikacji, web wola `applyCoastRing` wielokrotnie po zmianach siatki (`generator.ts:440`, `:468`) i ma `applyDoubleCoastRing`/`finalizeCoastAndInlandWater`; '
  '(f) brak zloz, wiosek, pozycji startowych, relief-coverage, bilansu lad/morze, `ensurePangeaSingleContinent`.')
A('5. **P6.1C RUNDA-2 - minimalny wycinek (M09) i jego granice**: `buildSameTypeRivalSlots` + `buildSameTypeRivalCandidateHexes` + `groupForeignTypeClusters` wymagaja (domkniecie AST, `callgraph-rivals.txt`) '
  f'{RIV_CL[0]} deklaracji `clusters.ts` ({RIV_CL[1]} LOC niepustych; w tym stale `CLUSTER_CITY_STATE_MIN_HEX` :42, `CLUSTER_CITY_STATE_MAX_HEX` :47, `MIN_DIST_START_CITY_STATE` :49, `CLUSTER_GROWTH_RESERVE` :58) '
  f'+ {RIV_CSX[0]} deklaracji `cluster-spawn.ts` ({RIV_CSX[1]} LOC; dwa typy P6.1C juz w Rust) + {RIV_GH[0]} z `gen-helpers.ts` (`mulberry32`, `HEX_DIRECTIONS`, `hexDistanceAxial` - JUZ w Rust). '
  f'Nie trzeba portowac {FILE_LOC["clusters.ts"]} LOC `clusters.ts`. **M09 NIE zamyka calego pkt 1 z `P6-1C.md` §10**: pkt 1 wymienia tez `buildClusterSpawnPlan` i `computeClusters`; '
  f'M09 odblokowuje wylacznie slot rywali i kandydatow (wejscia `buildClusterStartPlan` budowane dzis z zapisanego planu), a zasilenie `build_cluster_start_plan` wynikiem Rust wymaga lancucha M09 -> M10 -> M11 -> M12 '
  f'(`computeClusters`: {CC_CL[0]} deklaracji `clusters.ts` / {CC_CL[1]} LOC + {CC_GH[0]} z `gen-helpers.ts` / {CC_GH[1]} LOC; `buildClusterSpawnPlan`: {SP_CS[0]} deklaracji `cluster-spawn.ts` + to samo domkniecie, `callgraph-spawnplan.txt`).')
A('6. **Pulapka nazw stalych**: `MIN_DIST_START_CITY_STATE = 5` (`clusters.ts:49`, = `CLUSTER_CITY_STATE_MIN_HEX`) vs `MIN_CITY_DISTANCE_START_CITY_STATE = 3` (`cities.ts:1122`; w Rust `start-cluster-params.json` / `min_city_distance_start_city_state`, `start_position.rs`). '
  'To dwie ROZNE stale; port klastra rywali musi uzyc 5.')
A('7. **Dwie kopie Mulberry32 w Rust** (`rng.rs:115-129` i `map_generator.rs:207`), obie zgodne z webem; dedup w M01.')
A('8. **Przepisywanie tablic zasiegu terytorium**: Rust ma wlasna kopie `TerritoryNode`/`territory_owner_at` w `trade.rs` (P6.15), z promieniem dostarczanym z zewnatrz; formula promienia (`cityTerritoryRadius`, fort 10 / posterunek 5 / miasto wg okolicy) nie istnieje w Rust.')
A('9. **Rozbieznosc regul do zbadania (M16)**: `hasBlockingDepositForFarm` zwraca w webie zawsze `false` (wolne wspolistnienie zloz z farma, `improvement-build.ts:743-747`), a `deposit_gate` Rust blokuje `Farm` gdy `tile.deposit.is_some()` (`improvements.rs`). '
  'Nie rozstrzygam, ktora strona jest wlasciwa - wymaga wektora z weba w M16.')
A('')
A('## 3. Tabela per plik (25 wierszy)')
A('')
A('| # | plik | LOC niepuste | eksporty | ZW | CZ | BRAK | ND | klasa dominujaca | import wewn. (map/) | import zewn. | tematy |')
A('|---|---|---|---|---|---|---|---|---|---|---|---|')
for i, fn in enumerate(FILES, 1):
    c = byfile[fn]
    tot = sum(c.values())
    kl = collections.Counter(r['klasa'] for r in rows if r['fn'] == fn).most_common(1)[0][0]
    tm = sorted({r['temat'] for r in rows if r['fn'] == fn})
    iw, iz = imports.get(fn, ('', ''))
    A(f'| {i} | `{fn}` | {FILE_LOC[fn]} | {tot} | {c[ZW]} | {c[CZ]} | {c[BR]} | {c[ND]} | {kl} | {esc(iw or "-")} | {esc((iz or "-")[:150])} | {", ".join(tm)} |')
A('')
A('## 4. Tabela per symbol (kazdy eksport; ' + str(len(rows)) + ' wierszy)')
A('')
A('Kolumny: *LOC* = linie niepuste deklaracji (od eksportu do nastepnej deklaracji top-level, bez JSDoc nastepnej); *uzywane poza map/* = liczba plikow w `gra/src` poza `map/` zawierajacych symbol jako slowo '
  '(tekstowo - NADMIAR, nie dowod semantyczny; `main.ts` = `gra/src/main.ts`). *Rust* = `plik:linia` (rozwiazane skryptem), *test* = test w repo.')
A('')
A('| # | plik:linia | symbol | rodzaj | klasa | LOC | uzywane poza map/ | odpowiednik Rust (plik:linia) | status | test Rust | temat | uwagi |')
A('|---|---|---|---|---|---|---|---|---|---|---|---|')
for i, r in enumerate(rows, 1):
    rs = '<br>'.join(('kontekst: ' if r['status'] == BR else '') + f'`{x}`' for x in r['rust']) or '-'
    ts = '<br>'.join(f'`{x}`' for x in r['test']) or '-'
    A(f'| {i} | `{r["fn"]}:{r["line"]}` | `{esc(r["sym"])}` | {r["kind"]} | {r["klasa"]} | {r["loc"]} | {r["use"]} | {rs} | {r["status"]} | {ts} | {r["temat"]} | {esc(r["uwaga"])} |')
A('')
A('## 5. Graf zaleznosci tematow')
A('')
A('Importy plikowe: `imports.tsv` (skryptowo). Najwazniejsze krawedzie wewnatrz `map/`: `generator.ts -> gen-helpers, startScoring, villages, newGameMapDefaults, riverGenSwitch`; '
  '`gen-helpers.ts -> newGameMapDefaults, riverGenSwitch, earth-land-mask`; `newGameMapDefaults.ts -> gen-helpers, generator` (cykl typu); `startScoring.ts -> clusters`; `cluster-spawn.ts -> clusters, gen-helpers`; '
  '`clusters.ts -> gen-helpers`; `territory-work.ts, range-hexes.ts, wonder-placement.ts, improvement-build.ts -> territory`. Zaleznosci ZEWNETRZNE istotne dla kolejnosci: '
  '`game/okolica` (P6.8), `game/cities` (P6.6), `game/culture-religion` (P6.16), `game/terrain-improvements` (P6.3), `game/civ-entry-epoch` (P6.1, zrobione), `game/civ-names`/`city-names-pool` (P6.1D, zrobione), '
  '`units/setup` (`hexDistance`, `isWaterTerrain`, `keyOf` - katalog `units/` NIE objety ani P6.0, ani P6.25), `types/hex`/`types/map` (NIE objete), `data/*-loader` (loadery JSON; dane sa w Rust).')
A('')
A('Konsumenci logiki spoza `map/` (zrodlo: `grep -rnE "from .*map/"` na `gra/src`): `game/ai.ts, ai-difficulty-bonus.ts, auto-improvements.ts, auto-manage.ts, border-march-scan.ts, fort-territory.ts, population-growth-v85.ts, trade-routes.ts, turn-economy.ts` -> `map/territory`; '
  '`game/cluster-start.ts` -> `map/cluster-spawn`; `game/okolica.ts, turn-economy.ts` -> `map/territory-work`; `game/resource-access.ts` -> `map/deposit-era`, `map/improvement-build`; '
  '`game/save.ts, load-map-source.ts` -> `map/mapSnapshot`; `units/setup.ts` -> `map/road-movement`, `map/startScoring`. Pozostale importy (`ui/`, `render/`) to UI.')
A('')
A('## 6. Backlog `P6.M-*`')
A('')
A('Rozmiar = suma LOC niepustych zakresow plikow web przypisanych do tematu (progi: S < 300, M 300-999, L 1000-1999, XL >= 2000). Temat bez zakresow web (M00) = S. '
  'Allowlisty to sciezki Rust wzgledem `rust-port/engine/` (poza testami `tests/p6_m<NN>_*`, ktore sa nowe i per temat). **Wszystkie nowe pliki generatora leza w `src/domain/mapgen/` i sa tworzone jako PUSTE przez M00**, '
  'dzieki czemu pozostale tematy edytuja tylko wlasne pliki (rozlaczne allowlisty) - ZALOZENIE Z1.')
A('')
A('| ID tematu (gotowe do dispatchu) | LOC web | rozmiar | zakres web | allowlista Rust | zaleznosci | rownoleglosc |')
A('|---|---|---|---|---|---|---|')
for t in TOPICS.values():
    rr = ', '.join(f'`{fn}`:{lo}-{hi}' for fn, lo, hi in t['ranges']) or '-'
    A(f'| `R-RUSTPORT-P6-{t["tid"]}-{t["title"]}-Q1` | {t["loc"]} | {t["size"]} | {rr} | {"<br>".join("`" + p + "`" for p in t["allow"])} | {esc(t["deps"])} | {esc(t["par"])} |')
A('')
A('### 6a. Tytuly / opisy (do dispatchu)')
A('')
for t in TOPICS.values():
    A(f'- **`R-RUSTPORT-P6-{t["tid"]}-{t["title"]}-Q1`** ({t["size"]}, {t["loc"]} LOC web): {t["uwaga"]}')
A('')
A('### 6b. Kolizje z P6.1-P6.24 (sciezki Rust; skryptowo) - ZASIEG KONTROLI OGRANICZONY')
A('')
A('**Co zmierzono, a czego NIE.** W repo (i na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`) istnieja plany tylko: `P6-0` (analiza luk), `P6-1`, `P6-1B`, `P6-1C`, `P6-1D` (`dyspozycje/rust-port/p6/`). '
  '**Plany P6.2-P6.24 NIE istnieja**, wiec ich faktyczne allowlisty sa **NIE_ZMIERZONO**. Porownanie ponizej uzywa: (a) allowlist z planow ISTNIEJACYCH (P6.1, P6.1B, P6.1C, P6.1D - zamknietych), '
  '(b) dla P6.2-P6.22 PROPOZYCJI z `P6-0-GAP-ANALYSIS.md` §6b (wyciag verbatim w `p6-0-6b-excerpt.md`, parsowany przez `build_gap.py`; nie wpisany recznie). '
  'Brak kolizji z propozycja NIE dowodzi braku kolizji z przyszlymi planami: kazdy temat P6.2-P6.22 musi powtorzyc te kontrole na swojej faktycznej allowliscie przed dispatchem (ZALOZENIE Z7).')
A('')
A('| temat P6 | zrodlo allowlisty | status zrodla |')
A('|---|---|---|')
for pk in P6:
    A(f'| {pk} | `{", ".join(P6[pk])}` | {P6SRC[pk]} |')
A('')
A('Wynik porownania (allowlisty M* bez `tests/` vs powyzsze):')
A('')
A('| temat M | kolidujacy temat P6 | wspolne sciezki | status zrodla P6 | komentarz |')
A('|---|---|---|---|---|')
any_coll = False
for tid, t in TOPICS.items():
    for pk, common in P6coll.get(tid, []):
        any_coll = True
        A(f'| {tid} | {pk} | {", ".join("`" + c + "`" for c in common)} | {P6SRC[pk].split(":")[0] if P6SRC[pk].startswith("plan w repo") else "PROPOZYCJA (NIE_ZMIERZONO wzgledem planu)"} | {esc(t["kol"])} |')
if not any_coll:
    A('| (brak) | - | - | - | brak wspolnych sciezek z uzytymi allowlistami |')
A('')
A('Pliki wspoldzielone: `src/domain/mod.rs` (tylko M00 - deklaracje `pub mod ...;`, konflikt addytywny jak w P6.1C §10 pkt 2; P6.1/P6.1C/P6.1D juz zmienily ten plik i sa zamkniete). '
  'Zaleznosci semantyczne (nie sciezkowe) per temat sa w kolumnie *zaleznosci* i w §6c.')
A('')
A('### 6c. Kolizje semantyczne i kolejnosc wzgledem P6.x')
A('')
for t in TOPICS.values():
    A(f'- **{t["tid"]}**: {t["kol"]}.')
A('')
A('### 6d. Kontrola rozlacznosci (skryptowa)')
A('')
A(f'- Pary tematow M* z NIEPUSTYM przecieciem sciezek (bez `tests/`): **{len(pairs)}**.')
for a, b, common in pairs:
    A(f'  - {a} x {b}: {", ".join("`" + c + "`" for c in common)} (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)')
A(f'- Pary w grupach oznaczonych *rownolegle* ({"; ".join(" | ".join(g) for g in parallel_groups)}) z niepustym przecieciem: **{len(violations)}**' + ('' if not violations else ' - BLAD: ' + str(violations)) + '.')
A(f'- Pary M* z przecieciem wzorcow `tests/p6_m*`: **{len(tcoll)}**.')
A('- Przeciecia przy M00 wynikaja z tego, ze M00 jest wlascicielem szkieletu (puste pliki `mapgen/*.rs`); po M00 pliki te przechodza na wlasciciela-temat (M00 NIE jest rownolegly z zadnym innym). To jest dopuszczone i oznaczone `start (pierwszy)`.')
A('')
A('### 6e. Pokrycie zakresow web (skryptowa kontrola, ze kazdy symbol ma temat)')
A('')
bt = collections.Counter(r['temat'] for r in rows)
A('| temat | symboli (wiersze §4) |')
A('|---|---|')
for k in sorted(bt):
    A(f'| {k} | {bt[k]} |')
A('')
A('`-` = brak tematu (NIE-DOTYCZY albo juz ZWERYFIKOWANE w P6.1C: `cluster-spawn.ts` typy/`pickSecondHumanStartHex`/`displayLabelForSlot`). Kazdy symbol klasy SYSTEM/DATA o statusie BRAK/CZĘŚCIOWO ma temat M*.')
orphan = [r for r in rows if r['temat'] == '-' and r['status'] in (BR, CZ) and r['klasa'] in ('SYSTEM', 'DATA')]
A(f'Symbole SYSTEM/DATA o statusie BRAK/CZĘŚCIOWO bez tematu: **{len(orphan)}**' + ('' if not orphan else ': ' + ', '.join(f'`{r["fn"]}:{r["sym"]}`' for r in orphan)) + '.')
A('')
A('Pokrycie LOC plikow web zakresami tematow (suma zakresow wszystkich tematow; zakresy moga sie nakladac tylko tam, gdzie pojedyncze deklaracje przypisano innemu tematowi - liczone jako suma NIEPUSTYCH linii w sumie mnogosciowej):')
A('')
A('| plik | LOC niepuste | LOC w zakresach tematow | LOC poza tematami | przyczyna (dla LOC poza tematami) |')
A('|---|---|---|---|---|')
cov_total = 0
for fn in FILES:
    covered = set()
    for t in TOPICS.values():
        for g, lo, hi in t['ranges']:
            if g == fn:
                covered.update(range(lo, hi + 1))
    nb = sum(1 for i, l in enumerate(WEBTXT[fn], 1) if l.strip() and i in covered)
    cov_total += nb
    rest = FILE_LOC[fn] - nb
    why = ''
    if rest:
        kl = collections.Counter(r['klasa'] for r in rows if r['fn'] == fn and r['temat'] == '-')
        why = 'symbole bez tematu: ' + ', '.join(f'{k} {v}' for k, v in kl.most_common()) if kl else 'naglowki/importy/komentarze/JSDoc poza zakresem'
    A(f'| `{fn}` | {FILE_LOC[fn]} | {nb} | {rest} | {why} |')
A(f'| **razem** | {sum(FILE_LOC.values())} | {cov_total} | {sum(FILE_LOC.values()) - cov_total} | |')
A('')
A('### 6f. Kolejnosc i fale')
A('')
A('1. **Fala 0**: M00 (szkielet + model `MapHex`). Rownolegle z nia mozna NIE zaczynac niczego (zalezy od rejestracji modulow), ale M00 jest S.')
A('2. **Fala 1 (rownolegle, rozlaczne pliki)**: M01 (weryfikacja rdzenia), M02 (parametry), M09 (**klastry-rywale-min: odblokowuje slot rywali i kandydatow z P6.1C RUNDA-2; NIE cale zasilenie planu - to M12**), M14 (terytorium), M15 (drogi), M17 (snapshot).')
A('3. **Fala 2**: M03 || M04 (po M01+M02); M10 (po M09).')
A('4. **Fala 3**: M05A -> M05B; M11 (po M10); M13 (po M10); M16 (po P6.3).')
A('5. **Fala 4**: M06A -> M06B; M07A -> ... -> M07E2 (lancuch), M08 (po M02+M06B).')
A('6. **Fala 5**: M12 (po M11 i M07E2), potem **M18** (orkiestracja i przepiecie `generate_map`; DOWOD: rownosc z `maps.json`).')
A('7. Krytyczna sciezka calego backlogu M: M00 -> M01/M02 -> M03/M04 -> M05A -> M05B -> M06A -> M06B -> M07A -> M07B -> M07C -> M07D -> M07E1 -> M07E2 -> M12 -> M18. '
  'Droga do odblokowania CZESCI P6.1C RUNDA-2 (`buildSameTypeRival*`) jest krotka: M00 -> M09. Zasilenie `build_cluster_start_plan` wynikiem Rust (`buildClusterSpawnPlan`/`computeClusters`) = M00 -> M09 -> M10 -> M11 -> M12 (po M07E2 dla mapy).')
A('')
A('### 6g. Rekomendacja priorytetu')
A('')
A(f'- **Natychmiast**: M00 -> M09 (zamyka CZESC RUNDY-2 P6.1C: `buildSameTypeRival*` i `groupForeignTypeClusters`; wycinek {RIV_CL[0]} deklaracji `clusters.ts` / {RIV_CL[1]} LOC + {RIV_CSX[0]} `cluster-spawn.ts` / {RIV_CSX[1]} LOC; bez zaleznosci od reszty mapgenu). '
  'Pelne zasilenie planu startowego wynikiem Rust (pkt 1 `P6-1C.md` §10: `buildClusterSpawnPlan`, `computeClusters`) wymaga M10-M12.')
A('- **Wysoki**: M01 (zamrozenie dobrego rdzenia testami; tanie, redukuje ryzyko regresji przy dalszym porcie); M14 (terytorium jest uzywane przez 9 plikow `game/`).')
A('- **Do decyzji organizacyjnej** (nie blokuje): czy M07 (rzeki, ~6800 linii web) ma byc portowane 1:1, czy zastapione okreslonym wejsciem (zapisane rzeki z weba jako dane startowe do czasu P8). Nie rozstrzygam - ZALOZENIE Z3: port 1:1, bo parytet seedowanych map jest celem M18.')
A('')
A('## 7. Wycinek P6.1C (M09): domkniecie')
A('')
A('Skryptowo (`callgraph_ast.cjs`, domkniecie identyfikatorow po AST TypeScript - zastepuje regexowy `callgraph_clusters.py` z rundy 1, ktory pomijal stale uzywane tylko w tresci `const`/`type`; GORNA granica: nazwa lokalna zaslaniajaca nazwe top-level moze dolaczyc deklaracje nadmiarowa). '
  'Korzenie: `buildSameTypeRivalSlots`, `buildSameTypeRivalCandidateHexes`, `groupForeignTypeClusters`, `packRivalCitiesAroundCore`, `packCityStatesAroundCapital`, `computeSameTypeRivalHalfPlaneAxis`:')
A('')
A('```text')
A(open(os.path.join(HERE, 'callgraph-rivals.txt'), encoding='utf-8').read().rstrip())
A('```')
A('')
A(f'Zakres M09 (§6) = te deklaracje z `clusters.ts` ({RIV_CL[0]} decl, {RIV_CL[1]} LOC) i `cluster-spawn.ts` ({RIV_CSX[0]} decl, {RIV_CSX[1]} LOC) wraz z komentarzem nad nimi; '
  f'dwa typy P6.1C (`ClusterSpawnSlot`, `ForeignTypeClusterGroup`) i 3 deklaracje `gen-helpers.ts` sa juz w Rust i poza zakresem M09. '
  'Stala `MIN_DIST_START_CITY_STATE` (:49 = `CLUSTER_CITY_STATE_MIN_HEX` :42) jest uzywana w wycinku bezposrednio przez `cluster-spawn.ts:106,148` (`buildSameTypeRivalSlots`, `buildSameTypeRivalCandidateHexes`); poza wycinkiem w `clusters.ts:56,1835-1836,3399` (M10-M12). Nalezy do M09 jako pierwszego tematu, ktory jej potrzebuje.')
A('')
A('Imiona miast: `playerStartCityName`/`clusterRivalCityName` (`game/civ-names`) - w Rust odpowiada P6.1D (`city_names.rs`: `player_capital_from_pool`, `cluster_rival_from_pool` :130).')
A('')
A(f'Wycinek startScoring (M10), `callgraph-startscoring.txt` (AST): {STS_CL[0]} deklaracji `clusters.ts` / {STS_CL[1]} LOC + {STS_SS[0]} z `startScoring.ts` / {STS_SS[1]} LOC + {STS_GH[0]} z `gen-helpers.ts` (`HEX_DIRECTIONS`, juz w Rust).')
A(f'Pelne `computeClusters` (M12, wymaga M10+M11): {CC_CL[0]} deklaracji `clusters.ts` / {CC_CL[1]} LOC + {CC_GH[0]} z `gen-helpers.ts` / {CC_GH[1]} LOC (`callgraph-computeclusters.txt`); '
  f'`buildClusterSpawnPlan` dodaje {SP_CS[0]} deklaracji `cluster-spawn.ts` / {SP_CS[1]} LOC (`callgraph-spawnplan.txt`).')
A('')
A('## 8. NIE_ZMIERZONO (jawna lista)')
A('')
A('- Rownosc calych funkcji potoku (relief, bilans lad/morze, rzeki, zloza, start, klastry) - brak odpowiednikow w Rust, wiec brak czego mierzyc.')
A('- Maski ladu: tylko wektory 36x28 seed 42 (3 punkty na typ, 7 dla Ziemi). Inne wymiary/ziarna/`landFraction` - NIE_ZMIERZONO (Rust `land_mask` jest prywatne; M01 ma je udostepnic).')
A('- `ShapeParams` offsety (6 wartosci `rand()*500`): zgodnosc wg odczytu kodu, wektor NIE_ZMIERZONO.')
A('- `earthTemplateLandAt` dla `steps` = 1/3/5 (mapy >= 110 wewnetrznego rozmiaru): NIE_ZMIERZONO; zmierzone tylko `steps=7`.')
A('- `classifyTerrain` z progami tier-ow gestosci (`TerrainClassifyThresholds`): NIE_ZMIERZONO.')
A('- Mapa `maps.json` ma 5 map; roznice `generate_map` wzgledem weba zmierzone na nich i na parametrach domyslnych (`genOpts` bez zmian).')
A('- `improvement-build.ts`, `genWorker.ts`, `mapGenAsync.ts`: nie daja sie zaladowac w Node bez `three`/workera - liczba eksportow tylko statyczna.')
A('- Zakres UI w `improvement-build.ts` (galeria, panel) - klasyfikacja po odczycie nazw/komentarzy, nie po kazdej funkcji.')
A('- LOC per deklaracja: niepuste linie instrukcji wg AST (bez JSDoc); LOC tematu = niepuste linie jego zakresow (zakresy rozlaczne, §0). Domkniecia (§7) sa GORNA granica (nazwa lokalna zaslaniajaca nazwe top-level dolacza nadmiar).')
A('- **Faktyczne allowlisty P6.2-P6.24 (kolizje §6b)**: plany tych tematow nie istnieja w repo; kolizje policzono wzgledem PROPOZYCJI z P6.0 §6b. NIE_ZMIERZONO, czy zrealizowane plany zachowaja te sciezki.')
A('- Czy `terenCoverageCellSize` (wartosc 4) jest wymuszona wektorami testu `terrain_bias_and_classification_match_typescript_golden_vectors`: wektory (0,0),(4,0),(0,4),(9,7) przekraczaja granice komorek, ale test pinuje wynik `terrain_cell_bias`, nie osobna funkcje - status CZESCIOWO.')
A('- Katalogi `gra/src/types`, `gra/src/units`, `gra/src/data` (loadery), `gra/src/util` NIE sa analizowane (poza zakresem; patrz ZALOZENIE Z2) - zaleznosci od nich zaznaczono, ale ich pokrycia nie mierzono.')
A('')
A('## 9. ZALOZENIA (zamiast pytan)')
A('')
A('- **Z1** Kod generatora trafia do nowego `src/domain/mapgen/` (pliki-szkielety z M00); `map_generator.rs` zostaje nietkniety do M01 (widocznosc) i M18 (przepiecie). Powod: rozlaczne allowlisty i brak 12-tysiecznego pliku.')
A('- **Z7** Kolizje §6b dla P6.2-P6.24 sa liczone wzgledem propozycji P6.0 §6b; kazdy z tych tematow powtarza kontrole rozlacznosci na swojej faktycznej allowliscie przed dispatchem (plany nie istnieja w repo).')
A('- **Z2** Model `MapHex` (hex weba: `terenBazowy`, `nakladka`, `zloze`, `rzeka`, `wioska`, `wlasciciel`...) pochodzi z `gra/src/types/hex.ts`, ktorego ani P6.0 ani P6.25 nie obejmuja. M00 musi go przeczytac; zalecany osobny temat analizy luk `gra/src/{types,units,data,util}` (P6.26).')
A('- **Z3** M07 (rzeki) jest portowane 1:1 (parytet map z ziarna), nie zastapione danymi.')
A('- **Z4** Silnik Rust jest synchroniczny; worker/async generacji (`genWorker.ts`, `mapGenAsync.ts`) i postep (`mapGenProgress.ts`) nie sa portowane (warstwa powloki). Opcjonalny callback postepu moze dodac M18.')
A('- **Z5** M14 przyjmuje promien terytorium od wywolujacego do czasu P6.8 (`okolica.ts`); wtedy `cityTerritoryRadius` laczy sie z `city_range_for_population`.')
A('- **Z6** Rownosc na poziomie hexa/pola w `maps.json` (5 map) jest kryterium odbioru M18; pojedyncze funkcje - wektory z Node per temat (wzorzec P6.1C).')
A('')
A('## 10. Indeks artefaktow runu (`dyspozycje/autobot/runs/R-RUSTPORT-P6-25-MAPA-GAP-Q1/`)')
A('')
for name, desc in (
    ('inventory_map.py / web-exports.tsv', 'inwentarz eksportow (skrypt + wynik)'),
    ('usage_map.py / usage.tsv', 'konsumenci symboli poza map/'),
    ('imports_map.py / imports.tsv', 'importy wewnetrzne i zewnetrzne plikow map/'),
    ('rust_name_hits.py / rust-name-hits.tsv', 'kandydaci odpowiednikow po nazwie w Rust'),
    ('callgraph_ast.cjs / callgraph-*.txt', 'domkniecia identyfikatorow po AST: rywale P6.1C, startScoring, computeClusters, buildClusterSpawnPlan'),
    ('decl_spans.cjs / decl-spans.tsv', 'zakresy instrukcji top-level (AST) - LOC deklaracji i wlasnosc linii przez tematy'),
    ('p6-0-6b-excerpt.md', 'wyciag verbatim P6-0-GAP-ANALYSIS.md §6b (allowlisty P6.x uzyte w §6b)'),
    ('web_pure_check.mjs / .out.txt', 'czyste funkcje weba vs stale testow Rust'),
    ('web_runtime_check.mjs / .out.txt', 'uruchomienie modulow weba: eksporty runtime, maski, classifyTerrain'),
    ('web_data_check.mjs / .out.txt', 'dane weba vs JSON Rust (rozmiary, wymiary, epoki zloz)'),
    ('sweep_web.mjs, sweep_rust.rs.txt, sweep.out.txt', 'sweep klimatu/Mulberry32/odleglosci web vs Rust'),
    ('cmp_generate_map_vs_web.rs.txt / .out.txt', 'porownanie generate_map z 5 mapami weba'),
    ('earth_mask_compare.py / .out.txt', 'dane maski Ziemi web vs Rust'),
    ('loader-hooks.mjs, loader-register.mjs', 'loader Node dla .ts/.json'),
    ('build_gap.py / gap-rows.tsv / backlog.tsv', 'generator tego dokumentu + wiersze + backlog'),
    ('verify_gap.py / verify_gap.out.txt', 'kontrola dokumentu: pliki, eksporty, zakresy tematow, symbole w zakresach, allowlisty'),
    ('01-operator-report.md, gate-fmt.log, gate-clippy.log, gate-test.log', 'raport Operatora (runda 1); PELNE surowe wyjscia fmt/clippy -D warnings/test z `EXIT=` odswiezone w rundzie 2')):
    A(f'- `{name}` - {desc}')
A('')
A('## 11. Zero zmian poza allowlista - samokontrola')
A('')
A('Zmienione/dodane: `dyspozycje/rust-port/p6/P6-25-MAPA-GAP.md` (nowy) i `dyspozycje/autobot/runs/R-RUSTPORT-P6-25-MAPA-GAP-Q1/**`. Brak zmian w `gra/**`, `rust-port/**`, `src-tauri/**`. '
  'Crate scratch z `cmp`/`sweep` lezy POZA repo (scratchpad), `Cargo.lock` nie jest w worktree. Runda 2 zmienia tylko dokument i artefakty runu (bez kodu Rust). Deploy/push: NIE WYKONANO.')

A('')
A('## 12. Runda 2 - odpowiedzi na zarzuty Evaluatora (ten sam ID)')
A('')
A('Ocena Evaluatora: commit `1c2b9ee9`, STATUS FAIL, 9 zarzutow. Wszystkie dotycza dokumentu i artefaktow (bez kodu Rust); kazda poprawka jest regenerowana skryptem `build_gap.py` i sprawdzana `verify_gap.py` (§10).')
A('')
A('1. **PRZYJMUJE.** Allowlista M18 zawierala wzorce testow nieistniejacego tematu M19; poprawione na `tests/p6_m18_*.rs` i `tests/p6_m18_vectors/**` (§6, `backlog.tsv`). `verify_gap.py` sprawdza teraz, ze kazdy temat ma dokladnie wzorce `tests/p6_m<id>_*.rs` i `tests/p6_m<id>_vectors/**` swojego ID i zaden wzorzec testow innego tematu; `build_gap.py` nie zawiera juz wzorca nieistniejacego tematu.')
A(f'2. **PRZYJMUJE.** Domkniecie M09 bylo liczone regexem (`callgraph_clusters.py`), ktory gubil stale uzywane w tresci deklaracji. Zastapione AST (`callgraph_ast.cjs`): {RIV_CL[0]} deklaracji `clusters.ts` ({RIV_CL[1]} LOC), w tym `CLUSTER_CITY_STATE_MIN_HEX` (:42) i `MIN_DIST_START_CITY_STATE` (:49), '
  f'+ {RIV_CSX[0]} deklaracji `cluster-spawn.ts` ({RIV_CSX[1]} LOC) + {RIV_GH[0]} z `gen-helpers.ts` (juz w Rust). Wynik zgodny z niezalezna miara Evaluatora ({RIV_META[0]} deklaracji, {RIV_META[1]} LOC lacznie z dwoma typami P6.1C). Stare "15 deklaracji, 384 LOC" usuniete z dokumentu. '
  'Stala :49 jest uzywana przez `cluster-spawn.ts:106,148` (wewnatrz wycinka) oraz `clusters.ts:56,1835-1836,3399` (poza nim) - opisane w §2 pkt 5, §7 i uwagach M09.')
A(f'3. **PRZYJMUJE.** Zakres M09 nie jest juz recznym zakresem 42-58/71-165/189-209, tylko zbiorem deklaracji domkniecia z AST razem z komentarzem nad nimi ({len(TOPICS["M09"]["ranges"])} przedzialow, {TOPICS["M09"]["loc"]} niepustych linii, tabela §6). '
  'Jedenascie deklaracji `clusters.ts:1347-2165` (`clusterPackRadius`, `ForeignClusterBuffer`, `passesForeignClusterBufferGate`, `landPoolNearCore`, `hexesAtDistance`, `SameTypeRivalHalfPlaneAxis`, `computeSameTypeRivalHalfPlaneAxis`, `isInSameTypeRivalHalfPlane`, `packCityStatesHubChain`, `packNearestLegalLand`, `packCityStatesAroundCapital`, `packRivalCitiesAroundCore`) '
  'leza teraz w zakresie M09 i sa odjete z M10/M11. `verify_gap.py` sprawdza, ze kazda deklaracja domkniecia lezy w zakresie M09 (wynik: brak wyjatkow).')
A(f'4. **PRZYJMUJE.** Zakresy tematow nie sa juz projektem niezalezym od przypisan §4: kazda linia pliku web ma jednego wlasciciela, a {len(ROW_CLAIMS)} deklaracji z §4 przypisanych do tematu, ktorego zakres bazowy ich nie obejmowal, '
  'zostalo wlaczonych do jego zakresu (m.in. `generujSwiat` -> M18; symbole `earth-land-mask.ts` -> M01 z odjeciem od M03; `ClusterSpawnPlan` -> M12). '
  'Re-eksporty w `generator.ts` (:117, :846-848), ktore dotad nalezaly do czterech roznych tematow w jednej instrukcji, przypisano M18 (fasada generatora; definicje zostaja w tematach-wlascicielach, co wpisano w uwagi). '
  'Wynik kontroli (skrypt Evaluatora `check_backlog.py` i `verify_gap.py`): symbole poza zakresem swojego tematu = 0.')
A('5. **PRZYJMUJE.** LOC tematu nie jest juz korygowany odejmowaniem (`RIV_IN_M10` itd.), tylko liczony jako niepuste linie zakresow z tabeli §6: np. M10 = ' + str(TOPICS['M10']['loc']) + ', M11 = ' + str(TOPICS['M11']['loc']) + ', M09 = ' + str(TOPICS['M09']['loc']) + ' '
  '(wczesniej M10 1287, M11 1527). `verify_gap.py` przelicza LOC kazdego z 26 tematow z samych zakresow dokumentu - zgodnosc co do linii.')
A(f'6. **PRZYJMUJE.** Odnosniki Rust przy statusie BRAK sa teraz oznaczone `kontekst:` i opisane w legendzie §0 ({len(BR_CTX)} wierszy: ' + ', '.join(f'`{r["sym"]}`' for r in BR_CTX) + '). '
  'Wiersz `ClusterPlacement` (`clusters.ts:128`): `start_position.rs` `ClusterSpawnPlan` to struktura, ktora POMIJA pole `placement` - odnosnik jest kontekstem, nie odpowiednikiem. '
  'Wiersz `MIN_DIST_START_CITY_STATE`: odnosnik `start_position.rs` do `min_city_distance_start_city_state` jest kontekstem - ta funkcja zwraca INNA stala (wartosc 3 z `cities.ts:1122`), a wartosc web to 5; uwaga w wierszu to mowi wprost.')
A('7. **PRZYJMUJE.** `terenCoverageCellSize` (`gen-helpers.ts:889`) zmieniono z ISTNIEJE-ZWERYFIKOWANE na CZESCIOWO: w Rust nie ma tej funkcji, jest literal `q / 4` w `terrain_cell_bias`, a test pinuje wynik `terrain_cell_bias`. '
  f'Wskazniki §1: ZW {cnt[ZW]} (bylo 26), CZ {cnt[CZ]} (bylo 55). Pozostale wiersze ZW przejrzane pod katem tego samego wzorca: w kazdym Rust ma odrebny symbol (funkcje/typ) o odpowiadajacej semantyce, a test pinuje jego wynik albo wynik lancucha, ktory go wola; przypadki posrednie (`cosLerp`, `sampleEarthTemplateLand`, `ContinentCenter`, centra masek) maja to w uwagach (`posrednio`/`WASKO`). Brak literalu bez osobnego symbolu w Rust poza `terenCoverageCellSize`.')
A('8. **PRZYJMUJE.** §6b ujawnia zasieg kontroli: plany P6.2-P6.24 nie istnieja w repo, wiec ich faktyczne allowlisty sa NIE_ZMIERZONO; kontrola uzywa PROPOZYCJI z `P6-0-GAP-ANALYSIS.md` §6b (wyciag verbatim `p6-0-6b-excerpt.md`, parsowany, nie wpisany recznie) '
  'oraz allowlist z istniejacych planow P6.1/1B/1C/1D. Tabela z recznie wpisanymi sciezkami usunieta z `build_gap.py`. Dodano ZALOZENIE Z7 i wiersz w §8. Przy okazji wyszlo, ze P6.1/1C/1D zmieniaja `domain/mod.rs`: '
  'M00 przejmuje wszystkie deklaracje `pub mod` (takze dla M14-M17), wiec po M00 zaden temat M* nie edytuje `mod.rs` (wczesniej M14-M17 po cichu go potrzebowaly).')
A('9. **PRZYJMUJE.** `P6-1C.md` §10 pkt 1 wymienia `buildSameTypeRival*` ORAZ `buildClusterSpawnPlan`/`computeClusters`. Dokument rozdziela: M09 odblokowuje wylacznie czesc o slotach i kandydatach rywali, '
  'a zasilenie `build_cluster_start_plan` wynikiem Rust wymaga M09 -> M10 -> M11 -> M12. Zmienione miejsca: §2 pkt 5, pole *rownoleglosc* M09, §6f pkt 2 i 7, §6g, §7 (z liczbami domkniec `computeClusters` i `buildClusterSpawnPlan`).')
A('')
open(OUT, 'w', encoding='utf-8').write('\n'.join(L).rstrip('\n') + '\n')
print('OK rows', len(rows), 'files', len(FILES), 'pairs', len(pairs), 'viol', len(violations), 'tcoll', len(tcoll), 'orphans', len(orphan))
print(dict(cnt))
print(dict(cls))
