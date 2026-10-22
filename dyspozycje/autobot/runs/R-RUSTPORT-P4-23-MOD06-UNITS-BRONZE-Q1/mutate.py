#!/usr/bin/env python3
"""Mutation test of the MOD-06 Bronze port (R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1).

Each mutation replaces ONE exact snippet (must occur exactly once), runs the
parity tests and restores the file byte for byte. DETECTED = cargo test exits
non-zero with at least one FAILED test; BUILD-ERROR (non-zero without a failed
test) is NOT counted as detected. Exit code 0 only if every mutation is
detected.

Usage (from rust-port/renderer): python3 <this> ; echo "EXIT=$?"
"""
import pathlib
import subprocess
import sys

B = "src/models/units_braz/"
MUTATIONS = [
    ("M01 js_asin: pio2_lo dropped in |x|>0.975 branch", "src/jsmath/inverse.rs",
     "t = PIO2_HI - (2.0 * (s + s * w) - PIO2_LO);", "t = PIO2_HI - (2.0 * (s + s * w));"),
    ("M02 oval ring: +PI/2 start angle dropped", B + "geo.rs",
     "* PI * 2.0 + PI / 2.0;", "* PI * 2.0;"),
    ("M03 oval ring: dish sign flipped", B + "geo.rs",
     "[x, y, -c * (x / a) * (x / a)]", "[x, y, c * (x / a) * (x / a)]"),
    ("M04 leaf-head blade profile 0.34 -> 0.35", B + "geo.rs",
     "[0.00, 0.34, 0.60],", "[0.00, 0.35, 0.60],"),
    ("M05 octahedron detail +1", B + "geo.rs",
     "Self::Octahedron { r, detail } => geom::octahedron_geometry(r, detail),",
     "Self::Octahedron { r, detail } => geom::octahedron_geometry(r, detail + 1),"),
    ("M06 setFromUnitVectors: Euler not re-synced", B + "kit.rs",
     "    n.quaternion = q;\n    n.rotation = euler_from_quat(q);", "    n.quaternion = q;"),
    # v1 of M07 ("applyQuaternion: summation order of the x row changed", kit.rs)
    # SURVIVED: the only caller rotates about Y_UP (qx = qz = 0), so that
    # reordering is an equivalent mutant on every web input
    # (logi/mutate-v1-M07-survived.txt). Replaced by the observable sign flip.
    ("M07 rydwan konny bit point: applyAxisAngle(-yaw)", B + "rydwan_konny.rs",
     "apply_axis_angle(bit_local, Y_UP, yaw)", "apply_axis_angle(bit_local, Y_UP, -yaw)"),
    ("M08 miecznik figure scale 1.166 -> 1.167", B + "miecznik.rs",
     "const BM_FIGURE_SCALE: f64 = 1.166;", "const BM_FIGURE_SCALE: f64 = 1.167;"),
    ("M09 konnica root yaw 1.02 -> 1.03", B + "konnica.rs",
     "const KN_YAW: f64 = 1.02;", "const KN_YAW: f64 = 1.03;"),
    ("M10 taran pole bar z 0.318 -> 0.3181", B + "taran.rs",
     "0.078 * HEX_R, 0.318 * HEX_R);", "0.078 * HEX_R, 0.3181 * HEX_R);"),
    ("M11 p4 shield group scale x1.01", B + "p4_melee.rs",
     "m.node(sh).set_scale_scalar(scale);", "m.node(sh).set_scale_scalar(scale * 1.01);"),
    ("M12 p8b Induska spear: rotation.x = PI - th instead of th", B + "p8b.rs",
     "        .rot_x(spear_th)\n        .set_pos_v(add_scaled(grip, spear_axis, 0.096 * HEX_R));",
     "        .rot_x(PI - spear_th)\n        .set_pos_v(add_scaled(grip, spear_axis, 0.096 * HEX_R));"),
    ("M13 p8b Champi tokapu colours swapped", B + "p8b.rs",
     "let mt = if ci % 2 == 0 { m_red } else { m_teal };", "let mt = if ci % 2 == 0 { m_teal } else { m_red };"),
    ("M14 units.ts Inka sun rays: sin -> cos", B + "units_ts.rs",
     "js_sin(ang) * 0.056 * HEX_R,", "js_cos(ang) * 0.056 * HEX_R,"),
    ("M15 units.ts Sumerian chariot: root rotation.y = PI dropped", B + "units_ts.rs",
     "    m.node(g).rot_y(PI);\n    m\n}\n\n/// `buildEgyptianChariot",
     "    m\n}\n\n/// `buildEgyptianChariot"),
    ("M16 units.ts Medjay hand roughness 0.80 -> 0.81", B + "units_ts.rs",
     "    add_boots(&mut m, m_leath);\n    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);",
     "    add_boots(&mut m, m_leath);\n    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.81);"),
    ("M17 registry: MOD-06 stays NotYetPorted", "src/models/unit_core/registry.rs",
     "return crate::models::units_braz::build(base, owner).ok_or(NotYetPorted::of(base));",
     "return Err(NotYetPorted::of(base));"),
    ("M18 Prim::Braz hook builds a unit box", "src/models/unit_core/model.rs",
     "Self::Braz(g) => g.build(),", "Self::Braz(_) => geom::box_geometry(1.0, 1.0, 1.0, 1, 1, 1),"),
    ("M19 routing: Legion Rzymski arm removed", B + "mod.rs",
     "        Base::LegionRzymski => p8b::build_legion_rzymski(owner),\n", ""),
    ("M20 units_kamien kit: js_asin re-route returns libm asin", "src/models/units_kamien/kit.rs",
     "pub use crate::jsmath::js_asin;",
     "#[must_use]\npub fn js_asin(x: f64) -> f64 {\n    crate::jsmath::js_asin(x) * (1.0 + f64::EPSILON)\n}"),
]

CMD = ["cargo", "test", "--locked", "--no-fail-fast",
       "--test", "units_braz_web_parity", "--test", "unit_core_web_parity",
       "--test", "unit_core_model_rule", "--test", "jsmath_v8_parity",
       "--test", "units_kamien_web_parity"]


def main() -> int:
    detected = 0
    build_errors = 0
    for name, path, old, new in MUTATIONS:
        p = pathlib.Path(path)
        orig = p.read_bytes()
        text = orig.decode()
        n = text.count(old)
        if n != 1:
            print(f"{name}: SNIPPET-COUNT {n} (aborting)")
            return 2
        p.write_text(text.replace(old, new))
        try:
            r = subprocess.run(CMD, capture_output=True, text=True)
        finally:
            p.write_bytes(orig)
        assert p.read_bytes() == orig, f"{path} not restored"
        out = r.stdout + r.stderr
        failed = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        if r.returncode != 0 and failed:
            detected += 1
            print(f"{name}: DETECTED by {', '.join(sorted(set(l.split()[1] for l in failed)))}")
        elif r.returncode != 0:
            build_errors += 1
            tail = [l for l in out.splitlines() if l.startswith("error")][:2]
            print(f"{name}: BUILD-ERROR (not counted) {tail}")
        else:
            print(f"{name}: SURVIVED")
    print(f"detected {detected}/{len(MUTATIONS)}, build errors {build_errors}")
    return 0 if detected == len(MUTATIONS) else 1


if __name__ == "__main__":
    sys.exit(main())
