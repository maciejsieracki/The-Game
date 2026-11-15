"""Manual mutation testing of rust-port/view-model (R-RUSTPORT-P4-1A-VIEW-TYPES-Q1).

Usage: python3 -I mutate.py <crate_copy_dir> <out_tsv> [--dry]
Each mutant: list of (file, old, new); `old` must occur exactly once.
Pristine sources restored after every mutant.
"""
import subprocess, sys, os, re, time

CR = sys.argv[1]
OUT = sys.argv[2]
DRY = "--dry" in sys.argv

def a(attr, field):
    return (f"    {field}", f"    {attr}\n    {field}")

M = []
def mut(mid, desc, *edits):
    M.append((mid, desc, edits))

# ---- ids.rs
mut("I1", "try_new: <= MAX_SAFE_ID -> < (boundary)", ("src/ids.rs", "if value <= MAX_SAFE_ID {", "if value < MAX_SAFE_ID {"))
mut("I2", "MAX_SAFE_ID = 2^53 (off by one)", ("src/ids.rs", "pub const MAX_SAFE_ID: u64 = (1_u64 << 53) - 1;", "pub const MAX_SAFE_ID: u64 = 1_u64 << 53;"))
mut("I3", "id deserialize skips 2^53-1 check", ("src/ids.rs", "Self::try_new(value).map_err(<D::Error as serde::de::Error>::custom)", "Ok(Self(value))"))
mut("I4", "barbarian JSON -1 -> -2", ("src/ids.rs", "pub const BARBARIAN_OWNER_JSON: i64 = -1;", "pub const BARBARIAN_OWNER_JSON: i64 = -2;"))
mut("I5", "rebel JSON -99 -> -98", ("src/ids.rs", "pub const REBEL_OWNER_JSON: i64 = -99;", "pub const REBEL_OWNER_JSON: i64 = -98;"))
mut("I6", "OwnerRef variant order Rebel<->Barbarian (Ord)", ("src/ids.rs", "    /// Rebels (`-99`).\n    Rebel,\n    /// Barbarians (`-1`).\n    Barbarian,", "    /// Barbarians (`-1`).\n    Barbarian,\n    /// Rebels (`-99`).\n    Rebel,"))
mut("I7", "id Display decimal -> hex", ("src/ids.rs", "self.0.fmt(f)", "write!(f, \"{:x}\", self.0)"))
mut("I8", "HexCoord: no deny_unknown_fields", ("src/ids.rs", "#[serde(deny_unknown_fields)]\npub struct HexCoord", "pub struct HexCoord"))
mut("I9", "OwnerRef player JSON = id+1 (asymmetric)", ("src/ids.rs", "Self::Player(id) => id.get() as i64,", "Self::Player(id) => id.get() as i64 + 1,"))
mut("I10", "from_legacy_i64 accepts any negative as barbarian", ("src/ids.rs", "            _ => u64::try_from(value)", "            v if v < 0 => Some(Self::Barbarian),\n            _ => u64::try_from(value)"))

# ---- map.rs
mut("P1", "FogState codes 1<->2 swapped consistently (ser+de)",
    ("src/map.rs", "Explored = 1,", "Explored = 2,"),
    ("src/map.rs", "Visible = 2,", "Visible = 1,"),
    ("src/map.rs", "1 => Some(Self::Explored),", "1 => Some(Self::Visible),"),
    ("src/map.rs", "2 => Some(Self::Visible),", "2 => Some(Self::Explored),"))
mut("P2", "FogState from_code 0 -> Explored (asymmetric)", ("src/map.rs", "0 => Some(Self::Unexplored),", "0 => Some(Self::Explored),"))
mut("P3", "Terrain snake_case -> lowercase (plytkie_morze)", ("src/map.rs", "#[serde(rename_all = \"snake_case\")]\npub enum Terrain", "#[serde(rename_all = \"lowercase\")]\npub enum Terrain"))
mut("P4", "Nakladka snake_case -> lowercase (zloze_gliny)", ("src/map.rs", "#[serde(rename_all = \"snake_case\")]\npub enum Nakladka", "#[serde(rename_all = \"lowercase\")]\npub enum Nakladka"))
mut("P5", "Ulepszenie DrogaBrukowana renamed", ("src/map.rs", "    DrogaBrukowana,", "    #[serde(rename = \"droga_brukowana2\")]\n    DrogaBrukowana,"))
mut("P6", "RiverKind lowercase -> UPPERCASE", ("src/map.rs", "#[serde(rename_all = \"lowercase\")]\npub enum RiverKind", "#[serde(rename_all = \"UPPERCASE\")]\npub enum RiverKind"))
mut("P7", "HexDynDto.zloze: None omitted (skip_serializing_if)", ("src/map.rs",) + a("#[serde(default, skip_serializing_if = \"Option::is_none\")]", "pub zloze: Option<String>,"))
mut("P8", "HexDynDto: no deny_unknown_fields", ("src/map.rs", "#[serde(rename_all = \"camelCase\", deny_unknown_fields)]\npub struct HexDynDto", "#[serde(rename_all = \"camelCase\")]\npub struct HexDynDto"))
mut("P9", "HexDynDto.roadMask optional on input (serde default)", ("src/map.rs",) + a("#[serde(default)]", "pub road_mask: u8,"))
mut("P10", "MapViewDto.riverRenderPaths renamed riverPaths", ("src/map.rs",) + a("#[serde(rename = \"riverPaths\")]", "pub river_render_paths: Vec<Vec<HexCoord>>,"))
mut("P11", "HexStaticDto.terenBazowy renamed teren", ("src/map.rs",) + a("#[serde(rename = \"teren\")]", "pub teren_bazowy: Terrain,"))

# ---- owners.rs
mut("O1", "RelationToViewer pokoj -> pokój", ("src/owners.rs", "#[serde(rename = \"pokoj\")]", "#[serde(rename = \"pokój\")]"))
mut("O2", "WallKind Stone -> 'mur'", ("src/owners.rs", "    Stone,", "    #[serde(rename = \"mur\")]\n    Stone,"))
mut("O3", "OwnerViewDto.ringHex: None omitted", ("src/owners.rs",) + a("#[serde(default, skip_serializing_if = \"Option::is_none\")]", "pub ring_hex: Option<String>,"))
mut("O4", "CityBadgeDto.prodPaused renamed prodPause", ("src/owners.rs",) + a("#[serde(rename = \"prodPause\")]", "pub prod_paused: bool,"))
mut("O5", "MapOutlineKind ally -> sojusz", ("src/owners.rs", "    Ally,", "    #[serde(rename = \"sojusz\")]\n    Ally,"))
mut("O6", "ProductionKind jednostka -> unit", ("src/owners.rs", "    Jednostka,", "    #[serde(rename = \"unit\")]\n    Jednostka,"))
mut("O7", "OwnerViewDto: no deny_unknown_fields", ("src/owners.rs", "#[serde(rename_all = \"camelCase\", deny_unknown_fields)]\npub struct OwnerViewDto", "#[serde(rename_all = \"camelCase\")]\npub struct OwnerViewDto"))
mut("O8", "CityViewDto.unitCountOnHex optional on input", ("src/owners.rs",) + a("#[serde(default)]", "pub unit_count_on_hex: u32,"))

# ---- units.rs
mut("U1", "StackVitalsDto.hasCommander renamed commander", ("src/units.rs",) + a("#[serde(rename = \"commander\")]", "pub has_commander: bool,"))
mut("U2", "UnitViewDto.inGarnizon renamed inGarrison", ("src/units.rs",) + a("#[serde(rename = \"inGarrison\")]", "pub in_garnizon: bool,"))
mut("U3", "UnitViewDto.hpMax: None omitted", ("src/units.rs",) + a("#[serde(default, skip_serializing_if = \"Option::is_none\")]", "pub hp_max: Option<f64>,"))
mut("U4", "StackViewDto.goldDeficitRepIds optional on input", ("src/units.rs",) + a("#[serde(default)]", "pub gold_deficit_rep_ids: Vec<UnitId>,"))

# ---- overlays.rs
mut("V1", "BuildHighlightKind camelCase -> lowercase (foundcity)", ("src/overlays.rs", "#[serde(rename_all = \"camelCase\")]\npub enum BuildHighlightKind", "#[serde(rename_all = \"lowercase\")]\npub enum BuildHighlightKind"))
mut("V2", "TradeMedium lad -> ląd", ("src/overlays.rs", "    Lad,", "    #[serde(rename = \"ląd\")]\n    Lad,"))
mut("V3", "PlacedWonderDto.ruin optional on input", ("src/overlays.rs",) + a("#[serde(default)]", "pub ruin: bool,"))
mut("V4", "SiegeMachineKind wieza -> wieża", ("src/overlays.rs", "    Wieza,", "    #[serde(rename = \"wieża\")]\n    Wieza,"))
mut("V5", "OkolicaViewDto.showYields: None omitted", ("src/overlays.rs",) + a("#[serde(default, skip_serializing_if = \"Option::is_none\")]", "pub show_yields: Option<bool>,"))
mut("V6", "OverlaysViewDto.pathRoute renamed path", ("src/overlays.rs",) + a("#[serde(rename = \"path\")]", "pub path_route: Option<Vec<HexCoord>>,"))

# ---- battle.rs
mut("B1", "BattleSide atk -> attack", ("src/battle.rs", "    Atk,", "    #[serde(rename = \"attack\")]\n    Atk,"))
mut("B2", "FortKind mur -> stone", ("src/battle.rs", "    Mur,", "    #[serde(rename = \"stone\")]\n    Mur,"))
mut("B3", "TowerMaterial kamien -> kamień", ("src/battle.rs", "    Kamien,", "    #[serde(rename = \"kamień\")]\n    Kamien,"))
mut("B4", "BattleUnitSpawnDto.ammoLeft: None omitted", ("src/battle.rs",) + a("#[serde(default, skip_serializing_if = \"Option::is_none\")]", "pub ammo_left: Option<f64>,"))
mut("B5", "BattleSetupDto.deploy renamed deployPlayerSide", ("src/battle.rs",) + a("#[serde(rename = \"deployPlayerSide\")]", "pub deploy: Option<BattleSide>,"))

# ---- validate.rs
V = "src/validate.rs"
mut("X1", "MAX_ROAD_MASK 0x3F -> 0x7F", (V, "pub const MAX_ROAD_MASK: u8 = 0x3F;", "pub const MAX_ROAD_MASK: u8 = 0x7F;"))
mut("X2", "MAX_EDGE_INDEX 5 -> 6", (V, "pub const MAX_EDGE_INDEX: u8 = 5;", "pub const MAX_EDGE_INDEX: u8 = 6;"))
mut("X3", "MAX_BADGE_LEVEL 3 -> 4", (V, "pub const MAX_BADGE_LEVEL: u8 = 3;", "pub const MAX_BADGE_LEVEL: u8 = 4;"))
mut("X4", "MAX_DEFENSE_TIER 2 -> 3", (V, "pub const MAX_DEFENSE_TIER: u8 = 2;", "pub const MAX_DEFENSE_TIER: u8 = 3;"))
mut("X5", "MAX_COLOR 0xFFFFFF -> 0x1FFFFFF", (V, "pub const MAX_COLOR: u32 = 0x00FF_FFFF;", "pub const MAX_COLOR: u32 = 0x01FF_FFFF;"))
mut("X6", "no fog.state length check", (V, "        len(\"fog.state\", hex_count, self.fog.state.len())?;\n", ""))
mut("X7", "no hexState length check", (V, "        len(\"hexState\", hex_count, self.hex_state.len())?;\n", ""))
mut("X8", "ringHex accepts uppercase hex digits", (V, "c.is_ascii_digit() || (b'a'..=b'f').contains(c)", "c.is_ascii_hexdigit()"))
mut("X9", "ringHex length == 7 -> >= 7", (V, "b.len() == 7", "b.len() >= 7"))
mut("X10", "no finite check units[i].hp", (V, "            finite(|| format!(\"units[{i}].hp\"), u.hp)?;\n", ""))
mut("X11", "no battle grid tiles length check", (V, "        len(\"battle.setup.grid.tiles\", cells, g.tiles.len())?;\n", ""))
mut("X12", "contractVersion != -> > (accepts older)", (V, "if self.contract_version != CONTRACT_VERSION {", "if self.contract_version > CONTRACT_VERSION {"))
mut("X13", "finite_opt is a no-op", (V, "    value.map_or(Ok(()), |v| finite(field, v))", "    let _ = (field, value);\n    Ok(())"))
mut("X14", "RenderLayersDto::validate skips validate_map", (V, "        validate_map(map)?;\n", ""))
mut("X15", "veteranLevel min 1 -> 0", (V, "                1,\n                i64::from(MAX_BADGE_LEVEL),", "                0,\n                i64::from(MAX_BADGE_LEVEL),"))
mut("X16", "range inclusive -> exclusive upper", (V, "if (min..=max).contains(&value)", "if (min..max).contains(&value)"))
mut("X17", "finite = !is_nan (infinity accepted)", (V, "if value.is_finite()", "if !value.is_nan()"))
mut("X18", "no finite check owners[i].era", (V, "            finite(|| format!(\"owners[{i}].era\"), o.era)?;\n", ""))
mut("X19", "no colour check battle ownerColor", (V, "            color(|| p(\"ownerColor\"), u.owner_color)?;\n", ""))
mut("X20", "no finite check okolica.range", (V, "            finite(|| \"overlays.okolica.range\".into(), ok.range)?;\n", ""))
mut("X21", "ringHex check disabled", (V, "if !is_ring_hex(ring) {", "if false && !is_ring_hex(ring) {"))
mut("X22", "no finite check map.seed", (V, "    finite(|| \"map.seed\".into(), map.seed)?;\n", ""))
mut("X23", "no roadMask range check", (V, "                i64::from(MAX_ROAD_MASK),", "                i64::from(u8::MAX),"))

# ---- root.rs
R = "src/root.rs"
mut("R1", "CONTRACT_VERSION 1 -> 2", (R, "pub const CONTRACT_VERSION: u16 = 1;", "pub const CONTRACT_VERSION: u16 = 2;"))
mut("R2", "join(): turn + 1", (R, "        Self {\n            contract_version,\n            viewer,\n            turn,", "        Self {\n            contract_version,\n            viewer,\n            turn: turn.wrapping_add(1),"))
mut("R3", "RenderLayersDto: no deny_unknown_fields", (R, "#[serde(rename_all = \"camelCase\", deny_unknown_fields)]\npub struct RenderLayersDto", "#[serde(rename_all = \"camelCase\")]\npub struct RenderLayersDto"))
mut("R4", "RenderViewDto.battle: None omitted", (R, "    pub battle: Option<BattleViewDto>,\n}\n\n/// Dynamic part", "    #[serde(default, skip_serializing_if = \"Option::is_none\")]\n    pub battle: Option<BattleViewDto>,\n}\n\n/// Dynamic part"))
mut("R5", "RenderViewDto.stacks renamed stack", (R, "    /// Stack display (§3.5).\n    pub stacks: StackViewDto,", "    /// Stack display (§3.5).\n    #[serde(rename = \"stack\")]\n    pub stacks: StackViewDto,"))


# ---- extra mutants (second wave), for fields the first wave did not touch
mut("E1", "no colour check badge.ownerColor", (V, "            color(|| format!(\"cities[{i}].badge.ownerColor\"), b.owner_color)?;\n", ""))
mut("E2", "HexCoord.q optional on input", ("src/ids.rs", "    pub q: i32,", "    #[serde(default)]\n    pub q: i32,"))
mut("E3", "BattleSetupDto.deploy: None omitted", ("src/battle.rs",) + a("#[serde(default, skip_serializing_if = \"Option::is_none\")]", "pub deploy: Option<BattleSide>,"))
mut("E4", "CityBadgeDto.growthPercent: None omitted", ("src/owners.rs",) + a("#[serde(default, skip_serializing_if = \"Option::is_none\")]", "pub growth_percent: Option<f64>,"))
mut("E5", "BattleFortDto.towerMaterial: None omitted", ("src/battle.rs",) + a("#[serde(default, skip_serializing_if = \"Option::is_none\")]", "pub tower_material: Option<TowerMaterial>,"))
mut("E6", "ViewerDto.fogActive optional on input", ("src/owners.rs",) + a("#[serde(default)]", "pub fog_active: bool,"))
mut("E7", "BattleGridDto: no deny_unknown_fields", ("src/battle.rs", "#[serde(rename_all = \"camelCase\", deny_unknown_fields)]\npub struct BattleGridDto", "#[serde(rename_all = \"camelCase\")]\npub struct BattleGridDto"))
mut("E8", "TileYieldDto.zywnosc: None omitted", ("src/overlays.rs",) + a("#[serde(default, skip_serializing_if = \"Option::is_none\")]", "pub zywnosc: Option<f64>,"))
mut("E9", "SiegeViewDto.readyMachines optional on input", ("src/overlays.rs",) + a("#[serde(default)]", "pub ready_machines: Vec<SiegeMachineKind>,"))
mut("E10", "BattleUnitSpawnDto: no deny_unknown_fields", ("src/battle.rs", "#[serde(rename_all = \"camelCase\", deny_unknown_fields)]\npub struct BattleUnitSpawnDto", "#[serde(rename_all = \"camelCase\")]\npub struct BattleUnitSpawnDto"))

ONLY = [x[len("--only="):] for x in sys.argv if x.startswith("--only=")]
if ONLY:
    M[:] = [m for m in M if m[0].startswith(tuple(ONLY))]

def read(p):
    with open(os.path.join(CR, p), encoding="utf-8") as f:
        return f.read()

def write(p, s):
    with open(os.path.join(CR, p), "w", encoding="utf-8") as f:
        f.write(s)

pristine = {}
for _, _, edits in M:
    for e in edits:
        pristine.setdefault(e[0], read(e[0]))

env = dict(os.environ)
rows = []
for mid, desc, edits in M:
    texts = dict(pristine)
    bad = None
    for f, old, new in edits:
        c = texts[f].count(old)
        if c != 1:
            bad = f"PATTERN_COUNT={c} in {f}: {old[:50]!r}"
            break
        texts[f] = texts[f].replace(old, new)
    if bad:
        rows.append((mid, desc, "INVALID", bad))
        print(mid, "INVALID", bad, flush=True)
        continue
    if DRY:
        rows.append((mid, desc, "OK-PATTERN", ""))
        continue
    for f in pristine:
        write(f, texts[f])
    t = time.time()
    r = subprocess.run(["cargo", "test", "--offline", "--all-targets", "--no-fail-fast"],
                       cwd=CR, env=env, capture_output=True, text=True)
    out = r.stdout + r.stderr
    for f in pristine:
        write(f, pristine[f])
    if r.returncode == 0:
        verdict, detail = "SURVIVED", ""
    elif "could not compile" in out or re.search(r"^error(\[E\d+\])?:", out, re.M) and "test result" not in out:
        verdict = "KILLED-COMPILE"
        detail = ";".join(sorted(set(re.findall(r"^error(?:\[E\d+\])?: [^\n]{0,80}", out, re.M))))[:300]
    else:
        verdict = "KILLED"
        failed = re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)
        bins = re.findall(r"Running (?:unittests )?(\S+)", out)
        detail = f"{len(failed)} failed: " + ",".join(failed)
    rows.append((mid, desc, verdict, detail))
    print(mid, verdict, f"{time.time()-t:.0f}s", detail[:200], flush=True)

with open(OUT, "w", encoding="utf-8") as f:
    f.write("id\tdesc\tverdict\tdetail\n")
    for row in rows:
        f.write("\t".join(x or "-" for x in row) + "\n")
# final sanity: pristine restored
for p, s in pristine.items():
    assert read(p) == s, p
print("DONE", sum(1 for r in rows if r[2].startswith("KILLED")), "killed /", len(rows))
