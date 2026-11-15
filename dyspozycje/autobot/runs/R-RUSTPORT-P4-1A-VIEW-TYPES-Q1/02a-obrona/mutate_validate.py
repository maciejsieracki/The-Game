#!/usr/bin/env python3
"""Mutation waves for R-RUSTPORT-P4-1A-VIEW-TYPES-Q1, Obrona r1 (Z1, Z2, Z4).

Runs on a COPY of rust-port/view-model (never on the worktree):

    cp -r rust-port/view-model <copy>
    CARGO_TARGET_DIR=<target> python3 -I mutate_validate.py <copy> <out.tsv>

Waves:
  V  - every per-field / per-collection check statement in src/validate.rs
       (`finite(`, `finite_opt(`, `badge(`, `color(`, `range(`, `len(` calls,
       one- or multi-line, up to `)?;`) removed one at a time; the Evaluator's
       wave V, extended to the checks added in this round;
  G  - guards that are not such calls: hex order, contract version, ringHex;
  B  - every MAX_* bound constant +1 and -1, and the veteranLevel minimum;
  F  - pin fixture: one literal / key / number of each fixture item changed AND
       the PIN_LITERALS_SHA256 constant updated to the new hash (so only the
       content check can catch it), plus one byte change with the old hash.

A mutant is KILLED when `cargo test --offline --all-targets -q` exits non-zero
(waves V, G, B) or `cargo test --offline --test pin_vectors -q` does (wave F).
Output: TSV `id<TAB>wave<TAB>result<TAB>description`; summary on stdout.
"""

import hashlib
import json
import os
import re
import subprocess
import sys

CALLS = ("finite(", "finite_opt(", "badge(", "color(", "range(", "len(")


def run(copy, args):
    r = subprocess.run(["cargo", "test", "--offline", *args, "-q"], cwd=copy,
                       capture_output=True, env=dict(os.environ))
    return r.returncode


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def wave_v(src):
    lines = src.split("\n")
    out = []
    # Check call sites only (the helper bodies above `validate_map` are not
    # check statements).
    k = next(i for i, line in enumerate(lines) if line.startswith("pub fn validate_map"))
    while k < len(lines):
        s = lines[k].strip()
        if s.startswith(CALLS) and not s.startswith("fn "):
            end = k
            while not lines[end].rstrip().endswith(")?;"):
                end += 1
                if end - k > 12:
                    raise SystemExit(f"statement at line {k + 1} not closed")
            label = " ".join(x.strip() for x in lines[k:end + 1])
            mutated = "\n".join(lines[:k] + lines[end + 1:])
            out.append((f"line {k + 1}: remove {label[:110]}", mutated))
            k = end + 1
        else:
            k += 1
    return out


def wave_g(src):
    subs = [
        ("hex order guard off", "if hex.coord != expected {", "if false {"),
        ("contract version guard off", "if self.contract_version != CONTRACT_VERSION {", "if false {"),
        ("ringHex guard off", "if !is_ring_hex(ring) {", "if false {"),
        ("hex order: q/r swapped", "HexCoord::new(axis(i % width), axis(i / width))",
         "HexCoord::new(axis(i / width), axis(i % width))"),
        ("hex order: width ignored (width = 1)", ".unwrap_or(usize::MAX).max(1);", ".unwrap_or(usize::MAX).min(1);"),
    ]
    out = []
    for label, a, b in subs:
        if src.count(a) != 1:
            raise SystemExit(f"G pattern not unique: {a!r}")
        out.append((label, src.replace(a, b)))
    return out


def wave_b(src):
    out = []
    for m in re.finditer(r"pub const (MAX_[A-Z_]+): (u8|u32|i32) = (0x[0-9A-Fa-f_]+|\d+);", src):
        name, _ty, lit = m.groups()
        val = int(lit.replace("_", ""), 0)
        for d in (1, -1):
            new = f"pub const {name}: {_ty} = {val + d};"
            out.append((f"{name} {val} -> {val + d}", src.replace(m.group(0), new)))
    a = "i64::from(v.veteran_level),\n                1,"
    if src.count(a) != 1:
        raise SystemExit("veteranLevel minimum pattern not found")
    out.append(("veteranLevel min 1 -> 0", src.replace(a, a.replace("1,", "0,"))))
    out.append(("veteranLevel min 1 -> 2", src.replace(a, a.replace("1,", "2,"))))
    return out


def wave_f(fixture_text, test_src):
    data = json.loads(fixture_text)
    out = []
    for name in sorted(data["items"]):
        d = json.loads(fixture_text)
        it = d["items"][name]
        field = "keys" if "keys" in it else "values"
        first = it[field][0]
        it[field][0] = first + 1 if isinstance(first, int) else first + "x"
        text = json.dumps(d, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
        out.append((f"{name}.{field}[0] {first!r} -> {it[field][0]!r} (sha updated)", text, True))
    # Byte change, old hash kept.
    out.append(("fixture byte changed, sha NOT updated", fixture_text.replace('"pin": "07d2fbd72"', '"pin": "07d2fbd73"'), False))
    return out


def main(copy, tsv):
    vsrc_path = f"{copy}/src/validate.rs"
    fx_path = f"{copy}/tests/fixtures/pin_literals.json"
    pt_path = f"{copy}/tests/pin_vectors.rs"
    vsrc, fx, pt = read(vsrc_path), read(fx_path), read(pt_path)
    if run(copy, ["--all-targets"]) != 0:
        raise SystemExit("baseline is red")
    rows = []
    n = 0
    for wave, muts in (("V", wave_v(vsrc)), ("G", wave_g(vsrc)), ("B", wave_b(vsrc))):
        for label, mutated in muts:
            n += 1
            write(vsrc_path, mutated)
            rc = run(copy, ["--all-targets"])
            rows.append((f"{wave}{n}", wave, "KILLED" if rc else "SURVIVED", label))
            print(rows[-1], flush=True)
        write(vsrc_path, vsrc)
    for label, text, update in wave_f(fx, pt):
        n += 1
        write(fx_path, text)
        if update:
            digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
            write(pt_path, re.sub(r'"[0-9a-f]{64}"', f'"{digest}"', pt, count=1))
        rc = run(copy, ["--test", "pin_vectors"])
        rows.append((f"F{n}", "F", "KILLED" if rc else "SURVIVED", label))
        print(rows[-1], flush=True)
        write(fx_path, fx)
        write(pt_path, pt)
    if run(copy, ["--all-targets"]) != 0:
        raise SystemExit("copy not restored")
    with open(tsv, "w", encoding="utf-8") as f:
        f.write("id\twave\tresult\tdescription\n")
        for r in rows:
            f.write("\t".join(r) + "\n")
    for wave in "VGBF":
        w = [r for r in rows if r[1] == wave]
        k = sum(r[2] == "KILLED" for r in w)
        print(f"wave {wave}: {len(w)} mutants, killed {k}, survived {len(w) - k}")
    surv = [r for r in rows if r[2] == "SURVIVED"]
    print(f"TOTAL {len(rows)} mutants, survived {len(surv)}")
    return 1 if surv else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
