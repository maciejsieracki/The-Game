#!/usr/bin/env python3
"""Pin-literal fixture generator for rust-port/view-model (R-RUSTPORT-P4-1A-VIEW-TYPES-Q1, Obrona r1, Z2).

Reads the web sources straight from the pin with `git show <pin>:gra/src/<file>`
(no checkout, no hand copy), extracts the string unions / enums, the numeric
enums and the interface key lists the DTO mirrors, and writes
`rust-port/view-model/tests/fixtures/pin_literals.json` with the SHA-256 of
every pin source file. `tests/pin_vectors.rs` reads that fixture and checks the
fixture's own SHA-256 (constant `PIN_LITERALS_SHA256`).

Usage (from anywhere inside the repository, Python isolated mode):

    python3 -I gen_pin_literals.py            # (re)write the fixture, print its SHA-256
    python3 -I gen_pin_literals.py --check    # regenerate in memory; EXIT 1 on any drift:
                                              # fixture bytes, source SHA-256, or the
                                              # constant in tests/pin_vectors.rs
    python3 -I gen_pin_literals.py --pin <sha> [--check]   # another pin (pin move)

Every anchor must match exactly once in its file, and every extracted span
must parse completely; otherwise the generator stops with EXIT 2 (a pin move
that changes the shape of a declaration is reported, not silently skipped).
"""

import hashlib
import json
import re
import subprocess
import sys

DEFAULT_PIN = "07d2fbd72"
FIXTURE = "rust-port/view-model/tests/fixtures/pin_literals.json"
PIN_TEST = "rust-port/view-model/tests/pin_vectors.rs"
GENERATOR = "dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona/gen_pin_literals.py"

# (name, file under gra/src, anchor regex (must match exactly one line), kind)
# kind: "enum" = TS enum / const enum (string or numeric members, declaration
# order kept); "union" = literal union on the anchor line (up to `;` or `,`);
# "interface" = top-level member names of an interface.
SPECS = [
    ("TerenBazowy", "types/hex.ts", r"^export enum TerenBazowy \{", "enum"),
    ("Nakladka", "types/hex.ts", r"^export enum Nakladka \{", "enum"),
    ("Ulepszenie", "types/hex.ts", r"^export enum Ulepszenie \{", "enum"),
    ("Widocznosc", "types/hex.ts", r"^export enum Widocznosc \{", "enum"),
    ("riverPathKinds", "types/map.ts", r"^\s*riverPathKinds\?:", "union"),
    ("CityMapOutlineKind", "render/cityMapOutline.ts", r"^export type CityMapOutlineKind =", "union"),
    ("RelationBorderStatus", "game/civ-visual.ts", r"^export type RelationBorderStatus =", "union"),
    ("CityWallKind", "render/cities.ts", r"^export type CityWallKind =", "union"),
    ("CityMapWallKind", "render/cityMapStatChip.ts", r"^export type CityMapWallKind =", "union"),
    ("CityMapDefenseTier", "render/cityMapStatChip.ts", r"^export type CityMapDefenseTier =", "union"),
    ("ProductionKind", "game/production.ts", r"^export type ProductionKind =", "union"),
    ("SiegeMachineKind", "game/siegeMachines.ts", r"^export type SiegeMachineKind =", "union"),
    ("TradeRouteMedium", "render/tradeRoutesOverlay.ts", r"^\s*medium:", "union"),
    ("DeployPlayerSide", "battle/battleScene.ts", r"^\s*deployPlayerSide\?:", "union"),
    ("CityFortificationKind", "game/city-fortification.ts", r"^export type CityFortificationKind =", "union"),
    ("WallTowerMaterial", "battle/siegeWall.ts", r"^\s*material:", "union"),
    ("Dir", "battle/battleScene.ts", r"^export const enum Dir \{", "enum"),
    ("BTerrain", "battle/battle-terrain.ts", r"^export const enum BTerrain \{", "enum"),
    ("HexCoords", "types/hex.ts", r"^export interface HexCoords \{", "interface"),
    ("StackDisplayInfo", "game/armyMerge.ts", r"^export interface StackDisplayInfo \{", "interface"),
    ("StackVitals", "game/armyMerge.ts", r"^export interface StackVitals \{", "interface"),
    ("CityMapBadgeInput", "render/cityMapStatChip.ts", r"^export interface CityMapBadgeInput \{", "interface"),
    ("TileYield", "game/okolica.ts", r"^export interface TileYield \{", "interface"),
    ("RuntimeUnit", "units/setup.ts", r"^export interface RuntimeUnit \{", "interface"),
]


class GenError(Exception):
    pass


def git(*args):
    return subprocess.run(["git", *args], check=True, capture_output=True).stdout


def strip_comments(text):
    """Blank out // and /* */ comments (quotes respected); keeps newlines and offsets."""
    out = []
    i, n = 0, len(text)
    quote = None
    while i < n:
        c = text[i]
        if quote:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if c == quote:
                quote = None
            i += 1
        elif c in "'\"`":
            quote = c
            out.append(c)
            i += 1
        elif text.startswith("//", i):
            j = text.find("\n", i)
            j = n if j < 0 else j
            out.append(" " * (j - i))
            i = j
        elif text.startswith("/*", i):
            j = text.find("*/", i + 2)
            if j < 0:
                raise GenError("unterminated block comment")
            j += 2
            out.append("".join(ch if ch == "\n" else " " for ch in text[i:j]))
            i = j
        else:
            out.append(c)
            i += 1
    return "".join(out)


def anchor_line(lines, name, rx):
    hits = [k for k, line in enumerate(lines) if re.search(rx, line)]
    if len(hits) != 1:
        raise GenError(f"{name}: anchor {rx!r} matched {len(hits)} lines (need exactly 1)")
    return hits[0]


def block(code, start_offset, name):
    """Text between the first '{' at/after start_offset and its matching '}'."""
    open_at = code.find("{", start_offset)
    if open_at < 0:
        raise GenError(f"{name}: no '{{'")
    depth = 0
    quote = None
    for k in range(open_at, len(code)):
        c = code[k]
        if quote:
            if c == quote:
                quote = None
            continue
        if c in "'\"`":
            quote = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return open_at + 1, k
    raise GenError(f"{name}: unbalanced braces")


def line_of(code, offset):
    return code.count("\n", 0, offset) + 1


def extract_enum(code, lines, name, rx):
    k = anchor_line(lines, name, rx)
    start = sum(len(line) + 1 for line in lines[:k])
    lo, hi = block(code, start, name)
    body = code[lo:hi]
    segments = [s.strip() for s in body.split(",") if s.strip()]
    names, values = [], []
    for seg in segments:
        m = re.fullmatch(r"([A-Za-z_]\w*)\s*=\s*(?:'([^']*)'|(-?\d+))", seg)
        if not m:
            raise GenError(f"{name}: cannot parse enum member {seg!r}")
        names.append(m.group(1))
        values.append(m.group(2) if m.group(2) is not None else int(m.group(3)))
    if not names:
        raise GenError(f"{name}: empty enum")
    kinds = {type(v) for v in values}
    if len(kinds) != 1:
        raise GenError(f"{name}: mixed string/numeric members")
    return {"kind": "enum", "lines": [k + 1, line_of(code, hi)], "names": names, "values": values}


def extract_union(code, lines, name, rx):
    k = anchor_line(lines, name, rx)
    line = lines[k]
    m = re.search(rx, line)
    rest = line[m.end():]
    cut = re.search(r"[;,]", rest)
    expr = (rest[: cut.start()] if cut else rest).strip()
    if re.fullmatch(r"\(?\s*'[^']*'(\s*\|\s*'[^']*')*\s*\)?(\[\])?", expr):
        values = re.findall(r"'([^']*)'", expr)
    elif re.fullmatch(r"\d+(\s*\|\s*\d+)*", expr):
        values = [int(v) for v in re.findall(r"\d+", expr)]
    else:
        raise GenError(f"{name}: not a literal union: {expr!r}")
    return {"kind": "union", "lines": [k + 1, k + 1], "values": values}


def extract_interface(code, lines, name, rx):
    k = anchor_line(lines, name, rx)
    start = sum(len(line) + 1 for line in lines[:k])
    lo, hi = block(code, start, name)
    body = code[lo:hi]
    # Split at top level on ';' / ',' / newline.
    segments, depth, cur = [], 0, []
    for j, c in enumerate(body):
        if c in "{[(<":
            depth += 1
        elif c in "}])" or (c == ">" and (j == 0 or body[j - 1] != "=")):
            depth -= 1
        if depth < 0:
            raise GenError(f"{name}: unbalanced brackets in interface body")
        if depth == 0 and c in ";,\n":
            segments.append("".join(cur))
            cur = []
        else:
            cur.append(c)
    segments.append("".join(cur))
    keys = []
    for seg in segments:
        seg = seg.strip()
        m = re.match(r"(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:", seg)
        if m:
            keys.append(m.group(1))
        elif seg and not seg.startswith("|") and not seg.startswith("&"):
            # Continuation of a multi-line member type is allowed only as a
            # `|` / `&` line; anything else is an unparsed member.
            raise GenError(f"{name}: cannot parse interface member {seg!r}")
    if len(set(keys)) != len(keys):
        raise GenError(f"{name}: duplicate key")
    return {"kind": "interface", "lines": [k + 1, line_of(code, hi)], "keys": keys}


EXTRACT = {"enum": extract_enum, "union": extract_union, "interface": extract_interface}


def generate(pin):
    try:
        commit = git("rev-parse", "--verify", f"{pin}^{{commit}}").decode().strip()
    except subprocess.CalledProcessError:
        raise GenError(f"unknown pin {pin}")
    sources, items = {}, {}
    cache = {}
    for name, rel, rx, kind in SPECS:
        path = f"gra/src/{rel}"
        if path not in cache:
            try:
                raw = git("show", f"{commit}:{path}")
            except subprocess.CalledProcessError as e:
                raise GenError(f"{name}: git show {pin}:{path} failed: {e.stderr.decode().strip()}")
            cache[path] = raw
            sources[path] = hashlib.sha256(raw).hexdigest()
        text = cache[path].decode("utf-8")
        code = strip_comments(text)
        lines = code.split("\n")
        item = EXTRACT[kind](code, lines, name, rx)
        item["file"] = path
        items[name] = item
    doc = {
        "generator": GENERATOR,
        "pin": pin,
        "pinCommit": commit,
        "sources": sources,
        "items": items,
    }
    return (json.dumps(doc, indent=2, sort_keys=True, ensure_ascii=False) + "\n").encode("utf-8")


def main(argv):
    pin = DEFAULT_PIN
    check = False
    args = list(argv)
    while args:
        a = args.pop(0)
        if a == "--check":
            check = True
        elif a == "--pin":
            pin = args.pop(0)
        else:
            print(f"unknown argument {a}", file=sys.stderr)
            return 2
    root = git("rev-parse", "--show-toplevel").decode().strip()
    try:
        data = generate(pin)
    except GenError as e:
        print(f"GENERATOR ERROR: {e}", file=sys.stderr)
        return 2
    digest = hashlib.sha256(data).hexdigest()
    fixture = f"{root}/{FIXTURE}"
    if not check:
        with open(fixture, "wb") as f:
            f.write(data)
        print(f"wrote {FIXTURE} ({len(data)} B) sha256={digest}")
        return 0
    problems = []
    try:
        with open(fixture, "rb") as f:
            on_disk = f.read()
    except FileNotFoundError:
        on_disk = b""
    if on_disk != data:
        problems.append(f"{FIXTURE} differs from a fresh generation at pin {pin}")
    with open(f"{root}/{PIN_TEST}", encoding="utf-8") as f:
        test_src = f.read()
    m = re.search(r'const PIN_LITERALS_SHA256: &str =\s*"([0-9a-f]{64})";', test_src)
    if not m:
        problems.append(f"{PIN_TEST}: no PIN_LITERALS_SHA256 constant")
    elif m.group(1) != digest:
        problems.append(f"{PIN_TEST}: PIN_LITERALS_SHA256 {m.group(1)} != {digest}")
    for p in problems:
        print(f"DRIFT: {p}", file=sys.stderr)
    if problems:
        return 1
    print(f"OK {FIXTURE} sha256={digest} (pin {pin})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
