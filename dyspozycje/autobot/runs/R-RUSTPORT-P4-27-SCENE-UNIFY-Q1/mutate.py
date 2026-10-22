#!/usr/bin/env python3
"""Mutation test of the unified scene type (R-RUSTPORT-P4-27-SCENE-UNIFY-Q1).

Each mutation replaces ONE exact snippet (must occur exactly once) in the
scene core or in a migration point of a model module, runs the whole test
suite (`cargo test --locked --all-targets --no-fail-fast`) and restores the
file byte for byte. DETECTED = cargo test exits non-zero with at least one
FAILED test; the failing test binaries are listed so the report can show that
a web-parity test (`tests/*_web_parity.rs`, unchanged fixtures) caught it.
BUILD-ERROR (non-zero without a failed test) is NOT counted as detected.
Exit code 0 only if every mutation is detected.

Usage (from rust-port/renderer): python3 <this> ; echo "EXIT=$?"
"""
import pathlib
import re
import subprocess
import sys

MUTATIONS = [
    # ---- scene core (src/scene/**)
    ("M01 Node::local_matrix ignores the quaternion", "src/scene/node.rs",
     "Mat4::compose(self.position, self.quaternion, self.scale)",
     "Mat4::compose(self.position, Quat::default(), self.scale)"),
    ("M02 rot_y does not re-sync the quaternion", "src/scene/node.rs",
     "        self.rotation.y = v;\n        self.quaternion = Quat::from_euler(self.rotation);",
     "        self.rotation.y = v;"),
    ("M03 world matrix: local * parent instead of parent * local", "src/scene/graph.rs",
     "Some(p) if id != ROOT => world[p].mul(&local),",
     "Some(p) if id != ROOT => local.mul(&world[p]),"),
    ("M04 bounding box min.x uses Math.max", "src/scene/graph.rs",
     "b[0] = js_min(b[0], p.x);", "b[0] = js_max(b[0], p.x);"),
    ("M05 retint compares with != (re-tints the wrong materials)", "src/scene/graph.rs",
     "if self.materials[m].hex() == from {", "if self.materials[m].hex() != from {"),
    ("M06 graft: mesh material slots not shifted", "src/scene/graph.rs",
     "            for s in &mut m.materials {\n                *s += base;",
     "            for s in &mut m.materials {\n                *s += 0;"),
    ("M07 Material::standard drops roughness", "src/scene/material.rs",
     "m.roughness = roughness;", "m.roughness = metalness;"),
    ("M08 Prim::Circle builds one segment more", "src/scene/geometry.rs",
     "Self::Circle { r, segments } => geom::circle_geometry(r, segments, 0.0, PI * 2.0),",
     "Self::Circle { r, segments } => geom::circle_geometry(r, segments + 1, 0.0, PI * 2.0),"),
    ("M09 Prim::Ring with 2 phi segments", "src/scene/geometry.rs",
     "geom::ring_geometry(inner, outer, segments, 1, 0.0, PI * 2.0)",
     "geom::ring_geometry(inner, outer, segments, 2, 0.0, PI * 2.0)"),
    ("M10 unit signature skips roughness", "src/scene/hash.rs",
     "        f.f64(mt.roughness);\n", ""),
    # ---- migration points of the modules
    ("M11 decor leaf: quaternion not derived from rotation", "src/decor/object.rs",
     "    node.quaternion = Quat::from_euler(node.rotation);\n", ""),
    ("M12 decor leaf: renderOrder dropped", "src/decor/object.rs",
     "    node.render_order = render_order;\n", ""),
    ("M13 mergeDecor: group not flagged after collapse", "src/core/merge_decor.rs",
     "    set_merged_flag(group, ROOT);\n    true", "    true"),
    ("M14 fogDim: every class dimmed (Physical/Toon too)", "src/core/fog_dim.rs",
     "if !is_fog_dimmed_material(m.kind) {", "if false && !is_fog_dimmed_material(m.kind) {"),
    ("M15 unit HexRing body: outer/inner swapped", "src/models/unit_core/model.rs",
     "hex_ring_geometry(self.outer, self.inner)", "hex_ring_geometry(self.inner, self.outer)"),
    ("M16 improvements TwistedCone: twist sign", "src/models/improvements/model.rs",
     "m.rotate_y(self.twist);", "m.rotate_y(-self.twist);"),
    ("M17 improvements userData perTokenGeos length +1", "src/models/improvements/model.rs",
     'ud.set("perTokenGeos", UserValue::Len(n));', 'ud.set("perTokenGeos", UserValue::Len(n + 1));'),
    ("M18 cities HexWallRing: no rotateX(-PI/2)", "src/models/cities/model.rs",
     "        m.rotate_x(-PI / 2.0);\n        m\n", "        m\n"),
    ("M19 cities LineBasic: depthWrite inverted when stored", "src/models/cities/model.rs",
     "mt.depth_write = depth_write;", "mt.depth_write = !depth_write;"),
    ("M20 cities userData rozmiar key misspelt", "src/models/cities/model.rs",
     'ud.set("rozmiar", UserValue::Str(v.web_id().to_owned()));',
     'ud.set("rozmiar_", UserValue::Str(v.web_id().to_owned()));'),
    ("M21 misc signature skips opacity", "src/models/misc/model.rs",
     "        f.f64(mt.opacity);\n", ""),
    ("M22 wonders banner material not greyed for ruins", "src/models/wonders/builders.rs",
     "let banner = g.s.add_material(mat(owner, ruin));",
     "let banner = g.s.add_material(mat(owner, false));"),
]

FAILED_BIN = re.compile(r"error: test failed, to rerun pass `([^`]*)`")
RUNNING = re.compile(r"Running (\S+) ")


def main() -> int:
    root = pathlib.Path.cwd()
    detected = 0
    for name, rel, old, new in MUTATIONS:
        path = root / rel
        orig = path.read_bytes()
        text = orig.decode()
        n = text.count(old)
        if n != 1:
            print(f"{name}: SNIPPET-COUNT {n} (expected 1) -> NOT RUN")
            continue
        path.write_text(text.replace(old, new, 1))
        try:
            r = subprocess.run(
                ["cargo", "test", "--locked", "--all-targets", "--no-fail-fast"],
                capture_output=True, text=True)
        finally:
            path.write_bytes(orig)
        out = r.stdout + r.stderr
        failed_tests = [l.strip() for l in out.splitlines()
                        if l.strip().startswith("test ") and l.strip().endswith("FAILED")]
        bins = sorted(set(FAILED_BIN.findall(out)))
        if r.returncode != 0 and failed_tests:
            detected += 1
            parity = [b for b in bins if "web_parity" in b or "model_rule" in b]
            print(f"{name}: DETECTED ({len(failed_tests)} failed tests; binaries: "
                  f"{', '.join(bins)}; parity: {'YES' if parity else 'no'})")
        elif r.returncode != 0:
            print(f"{name}: BUILD-ERROR (not counted)")
            print("\n".join(out.splitlines()[-15:]))
        else:
            print(f"{name}: SURVIVED")
    print(f"detected {detected}/{len(MUTATIONS)}")
    return 0 if detected == len(MUTATIONS) else 1


if __name__ == "__main__":
    sys.exit(main())
