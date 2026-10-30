# Niezalezny weryfikator (stdlib): stale i rangi wysokosci z TS pinu edb8fb56 vs rivers_a.rs.
import re

TS = "/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/web-gen-helpers.ts"
RS = "/home/user/The-Game/.claude/worktrees/wf_5a5d9767-2c0-2/rust-port/engine/src/domain/mapgen/rivers_a.rs"
src = open(TS, encoding="utf-8").read()
rs = open(RS, encoding="utf-8").read()
fails = []


def ts_num(name):
    m = re.search(r"export const %s = (-?\d+);" % name, src)
    if not m:
        raise SystemExit("brak w TS: " + name)
    return int(m.group(1))


def rs_num(name):
    m = re.search(r"pub const %s: \w+ = (-?\d+);" % name, rs)
    if not m:
        raise SystemExit("brak w RS: " + name)
    return int(m.group(1))


NAMES = [
    "RIVER_MIN_INLAND_FROM_SEA",
    "RIVER_MIN_MAIN_LEN",
    "RIVER_HARD_MEANDER_LEN",
    "RIVER_MOUTH_TAIL_LEN",
    "MAIN_RIVER_MIN_PATH_SEP",
    "MEDIUM_TRIBUTARY_SPACING_HEX",
    "MEDIUM_TRIBUTARY_MIN_NET_LEN",
    "MAIN_RIVER_COAST_MOUTH_MAX_GAP",
]
for n in NAMES:
    a, b = ts_num(n), rs_num(n)
    print("const %s: web=%d rust=%d %s" % (n, a, b, "OK" if a == b else "DIFF"))
    if a != b:
        fails.append(n)

# mediumTributaryMinNetLen: progi minDim
m = re.search(r"function mediumTributaryMinNetLen\(.*?\{(.*?)\n\}", src, re.S)
th = [(int(a), int(b)) for a, b in re.findall(r"minDim < (\d+)\) return (\d+);", m.group(1))]
m2 = re.search(r"pub fn medium_tributary_min_net_len.*?\{(.*?)\n\}", rs, re.S)
rth = [(int(a), int(b)) for a, b in re.findall(r"min_dim < (\d+) \{\s*return (\d+);", m2.group(1), re.S)]
print("minNetLen progi web=%s rust=%s %s" % (th, rth, "OK" if th == rth else "DIFF"))
if th != rth:
    fails.append("minNetLen")

# ELEVATION_RANK: web wpisy [TerenBazowy.X]: N vs rust match arms Terrain::Y => N
wm = re.search(r"export const ELEVATION_RANK[^=]*= \{(.*?)\};", src, re.S)
wmap = {k: int(v) for k, v in re.findall(r"\[TerenBazowy\.(\w+)\]:\s*(\d+)", wm.group(1))}
rm = re.search(r"pub const fn elevation_rank\(t: Terrain\) -> u8 \{\s*match t \{(.*?)\}\s*\}", rs, re.S)
rmap = {k: int(v) for k, v in re.findall(r"Terrain::(\w+) => (\d+)", rm.group(1))}
tsmap = {
    "Morze": "Sea",
    "PlytkieMorze": "ShallowSea",
    "Laka": "Grassland",
    "Pustynia": "Desert",
    "Rownina": "Plains",
    "Wzgorza": "Hills",
    "Gory": "Mountains",
    "Polarny": "Polar",
}
for k, v in wmap.items():
    rk = tsmap.get(k, k)
    rv = rmap.get(rk)
    print("ELEVATION_RANK %s: web=%d rust(%s)=%s %s" % (k, v, rk, rv, "OK" if rv == v else "DIFF"))
    if rv != v:
        fails.append("rank:" + k)

print("RESULT:", "PASS" if not fails else "FAIL " + ",".join(fails))
