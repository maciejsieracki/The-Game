#!/usr/bin/env python3
"""Mutation test of the MOD-05 Stone port (R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1).

Each mutation replaces ONE exact snippet (must occur exactly once), runs the
parity tests and restores the file byte for byte. DETECTED = cargo test exits
non-zero with at least one FAILED test; BUILD-ERROR (non-zero without a failed
test, e.g. a linker ENOSPC) is NOT counted as detected. Exit code 0 only if
every mutation is detected.

Usage (from rust-port/renderer): python3 <this> ; echo "EXIT=$?"
"""
import pathlib
import subprocess
import sys

K = "src/models/units_kamien/"
MUTATIONS = [
    ("M01 Euler round trip: rotation.y += PI/4 dropped", K + "kit.rs", "    eu.y += dy;", "    eu.y += 0.0 * dy;"),
    ("M02 rotateOnAxis: multiply order swapped", K + "kit.rs",
     "n.quaternion = quat_mul(n.quaternion, quat_from_axis_angle(axis, angle));",
     "n.quaternion = quat_mul(quat_from_axis_angle(axis, angle), n.quaternion);"),
    ("M03 celt taper profile w 0.66 -> 0.67", K + "geo.rs", "[0.34, 0.66, 1.00],", "[0.34, 0.67, 1.00],"),
    ("M04 Nguni exponent 1.32 -> 1.30", K + "geo.rs", "const KZ_SH_P: f64 = 1.32;", "const KZ_SH_P: f64 = 1.30;"),
    ("M05 Nguni patch circle 7 -> 8 segments", K + "zulu_taran.rs", "        segments: 7,", "        segments: 8,"),
    ("M06 IK reach clamp 0.999 -> 0.5", K + "kit.rs", "(l1 + l2) * 0.999)", "(l1 + l2) * 0.5)"),
    ("M07 self-bow bend 0.120 -> 0.121", K + "bazowe.rs", "let bend = 0.120 * HEX_R;", "let bend = 0.121 * HEX_R;"),
    ("M08 mace spikes: libm cos/sin instead of V8", K + "inka.rs",
     "let dir = v3(js_cos(az), 0.0, js_sin(az));", "let dir = v3(az.cos(), 0.0, az.sin());"),
    ("M09 KL_GRIP x 0.088 -> 0.0881", K + "lucznicy.rs",
     "const KL_GRIP: Vec3 = Vec3::new(0.088 * HEX_R,", "const KL_GRIP: Vec3 = Vec3::new(0.0881 * HEX_R,"),
    ("M10 Nguni shield group scale 0.72 -> 0.73", K + "zulu_taran.rs",
     "m.node(sh).set_scale_scalar(0.72);", "m.node(sh).set_scale_scalar(0.73);"),
    ("M11 ram wedge: rotation.z = PI/4 dropped", K + "zulu_taran.rs",
     "        .rot_x(-PI / 2.0)\n        .rot_z(PI / 4.0)\n        .set_pos(0.0, log_y, 0.282 * HEX_R);",
     "        .rot_x(-PI / 2.0)\n        .set_pos(0.0, log_y, 0.282 * HEX_R);"),
    ("M12 registry: MOD-05 stays NotYetPorted", "src/models/unit_core/registry.rs",
     "return crate::models::units_kamien::build(base, owner).ok_or(NotYetPorted::of(base));",
     "return Err(NotYetPorted::of(base));"),
    ("M13 taper geometry: base cap quad dropped", K + "geo.rs",
     "    quad(\n        [-b[1], b[0], -b[2]],\n        [b[1], b[0], -b[2]],\n        [b[1], b[0], b[2]],\n        [-b[1], b[0], b[2]],\n    );\n",
     "    let _ = b;\n"),
    ("M14 Wojownik owner material roughness 0.72 -> 0.70", K + "bazowe.rs",
     "    let m_owner = m.mat(owner, 0.08, 0.72);\n\n    let hip_y = KB_HIP_Y - 0.012 * HEX_R;\n\n    kb_build_torso(&mut m, g, m_fur);",
     "    let m_owner = m.mat(owner, 0.08, 0.70);\n\n    let hip_y = KB_HIP_Y - 0.012 * HEX_R;\n\n    kb_build_torso(&mut m, g, m_fur);"),
    ("M15 asin: pio2_lo dropped in |x|>0.975 branch", K + "kit.rs",
     "t = PIO2_HI - (2.0 * (s + s * w) - PIO2_LO);", "t = PIO2_HI - (2.0 * (s + s * w));"),
    ("M16 klStretch ignores depth d", K + "lucznicy.rs", "set_scale(w, len, d.unwrap_or(w));", "set_scale(w, len, w);"),
    ("M17 category domyslny -> wrong builder", "src/models/unit_core/category.rs",
     "| UnitCategory::Domyslny => crate::models::units_kamien::build(cat.base(), owner)",
     "| UnitCategory::Domyslny => crate::models::units_kamien::build(Base::LucznikOpus5, owner)"),
    ("M18 Prim::Kamien hook builds an empty geometry", "src/models/unit_core/model.rs",
     "Self::Kamien(g) => g.build(),", "Self::Kamien(_) => geom::box_geometry(1.0, 1.0, 1.0, 1, 1, 1),"),
]

CMD = ["cargo", "test", "--locked", "--no-fail-fast", "--test", "units_kamien_web_parity", "--test", "unit_core_web_parity",
       "--test", "unit_core_model_rule"]


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
            print(f"{name}: DETECTED by {', '.join(l.split()[1] for l in failed)}")
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
