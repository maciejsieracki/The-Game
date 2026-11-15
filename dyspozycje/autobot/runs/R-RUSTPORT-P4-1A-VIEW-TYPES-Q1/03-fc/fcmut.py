import re, subprocess, sys, os
crate = sys.argv[1]
path = os.path.join(crate, "src/validate.rs")
orig = open(path).read()
lines = orig.split("\n")
muts = []
call = re.compile(r"^\s*(finite|finite_opt|badge|color|range|len)\($")
call1 = re.compile(r"^\s*(finite|finite_opt|badge|color|range|len)\(.*\)\?;$")
for i, l in enumerate(lines):
    if call1.match(l):
        muts.append((f"L{i+1} drop {l.strip()[:70]}", {i: l.replace(")?;", ").ok();")}))
    elif call.match(l):
        j = i
        while not lines[j].strip().endswith(")?;"):
            j += 1
        muts.append((f"L{i+1} drop multi {l.strip()} {lines[i+1].strip()[:50]}", {j: lines[j].replace(")?;", ").ok();")}))
for i, l in enumerate(lines):
    m = re.match(r"^pub const (\w+): (\w+) = (0x[0-9A-F_]+|\d+);$", l)
    if m:
        v = int(m.group(3).replace("_", ""), 0)
        for d in (1, -1):
            muts.append((f"L{i+1} {m.group(1)} {d:+d}", {i: f"pub const {m.group(1)}: {m.group(2)} = {v+d};"}))
extra = [
    ("hexorder disabled", "if hex.coord != expected {", "if hex.coord != expected && false {"),
    ("ringhex len 7->8", "b.len() == 7", "b.len() == 8"),
    ("ringhex a..=f -> a..=g", "(b'a'..=b'f')", "(b'a'..=b'g')"),
    ("ringhex no #", "&& b[0] == b'#'", ""),
    ("veteranLevel min 1->0", "                1,\n                i64::from(MAX_BADGE_LEVEL),", "                0,\n                i64::from(MAX_BADGE_LEVEL),"),
    ("contract version disabled", "if self.contract_version != CONTRACT_VERSION {", "if false {"),
    ("q/r swap", "HexCoord::new(axis(i % width), axis(i / width))", "HexCoord::new(axis(i / width), axis(i % width))"),
    ("ringhex uppercase allowed", "c.is_ascii_digit() ||", "c.is_ascii_hexdigit() ||"),
    ("ringhex ok on none-check", "if !is_ring_hex(ring) {", "if false {"),
    ("battle tiles min 0->1", "                || format!(\"battle.setup.grid.tiles[{i}]\"),\n                i64::from(tile),\n                0,", "                || format!(\"battle.setup.grid.tiles[{i}]\"),\n                i64::from(tile),\n                1,"),
]
for name, a, b in extra:
    assert orig.count(a) == 1, name
    muts.append((name, a, b))
res = []
for m in muts:
    if isinstance(m[1], dict):
        ls = list(lines)
        for k, v in m[1].items():
            ls[k] = v
        src = "\n".join(ls)
    else:
        src = orig.replace(m[1], m[2])
    open(path, "w").write(src)
    r = subprocess.run(["cargo", "test", "--tests", "-q"], cwd=crate, capture_output=True, text=True)
    if r.returncode == 0:
        status = "SURVIVED"
    elif "error[" in r.stderr and "test result" not in r.stdout:
        status = "compile-error"
    else:
        status = "killed"
    res.append((m[0], status))
    print(status, m[0], flush=True)
open(path, "w").write(orig)
print("TOTAL", len(res), "SURVIVED", sum(1 for _, s in res if s == "SURVIVED"),
      "compile-error", sum(1 for _, s in res if s == "compile-error"))
