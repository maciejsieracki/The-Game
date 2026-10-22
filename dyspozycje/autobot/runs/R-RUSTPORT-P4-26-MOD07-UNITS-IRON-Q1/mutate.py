#!/usr/bin/env python3
"""Mutation test of the MOD-07 Iron port (R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1).

Each mutation replaces ONE exact snippet (must occur exactly once), runs the
parity tests plus the `jsmath_wiring` source scanner and restores the file
byte for byte. DETECTED = cargo test exits non-zero with at least one FAILED
test; BUILD-ERROR (non-zero without a failed test) is NOT counted as
detected. Exit code 0 only if every mutation is detected.

Usage (from rust-port/renderer): python3 <this> ; echo "EXIT=$?"
"""
import pathlib
import subprocess
import sys

Z = "src/models/units_zelazo/"
MUTATIONS = [
    # ---- geometries of `geo.rs`
    ("M01 RingGeometry: full circle -> half (thetaLength PI)", Z + "geo.rs",
     "geom::ring_geometry(inner, outer, theta_seg, phi_seg, 0.0, PI * 2.0)",
     "geom::ring_geometry(inner, outer, theta_seg, phi_seg, 0.0, PI)"),
    ("M02 oval rim: outer ring not scaled by k", Z + "geo.rs",
     "let outer = oval_ring(a * k, b * k, c * k, n);", "let outer = oval_ring(a, b, c * k, n);"),
    ("M03 javelin head profile 0.78 -> 0.79", Z + "geo.rs",
     "[0.16, 0.78, 1.00],", "[0.16, 0.79, 1.00],"),
    ("M04 rim arc bottom: last segment n/2+1 -> n/2+2", Z + "geo.rs",
     "n / 2 - 1, n / 2, n / 2 + 1]", "n / 2 - 1, n / 2, n / 2 + 2]"),
    # ---- builders, one per web file
    ("M05 falangita dory tilt 0.20 -> 0.21", Z + "hastati_falangita.rs",
     "let spear_th = PI * 0.5 + 0.20;", "let spear_th = PI * 0.5 + 0.21;"),
    ("M06 hastati opus5 pilum: sin(-TH_Z) -> sin(TH_Z)", Z + "hastati_opus5.rs",
     "let kx = js_sin(-PIL_TH_Z);", "let kx = js_sin(PIL_TH_Z);"),
    ("M07 p6 Hieros Lochos club: sin -> cos", Z + "p6_super.rs",
     "-d * js_sin(S6_CLUB_TILT) * HEX_R,", "-d * js_cos(S6_CLUB_TILT) * HEX_R,"),
    ("M08 z1 beard row step 0.026 -> 0.027", Z + "z1.rs",
     "Z1_HEAD_CTR - (0.052 + fi * 0.026) * HEX_R,", "Z1_HEAD_CTR - (0.052 + fi * 0.027) * HEX_R,"),
    ("M09 z1 tag prefix het- -> hett-", Z + "z1.rs",
     'let p = "het-";', 'let p = "hett-";'),
    ("M10 z2 khopesh roll -1.15 -> -1.16", Z + "z2.rs",
     "let kh_roll = -1.15;", "let kh_roll = -1.16;"),
    ("M11 z2 Triari knee cos(0.30) -> cos(0.31)", Z + "z2.rs",
     "hip_y - Z2_THIGH_L * js_cos(0.30),", "hip_y - Z2_THIGH_L * js_cos(0.31),"),
    # v1 M12 (`trBuildLeg` thighCtr 0.5 -> 0.51) SURVIVED: equivalent mutant,
    # only `thigh_ctr.x` is read and `dir_down(..).x == 0` (logi/mutate-v1-M12-survived.txt)
    ("M12 z3 Galijski braccae thigh band 0.74 -> 0.75", Z + "z3.rs",
     "d_u,\n                TR_THIGH_L * 0.74,", "d_u,\n                TR_THIGH_L * 0.75,"),
    ("M13 z3 Berserker axe head x offset 0.030 -> 0.031", Z + "z3.rs",
     "m.node(bit).position.x -= 0.030 * HEX_R;", "m.node(bit).position.x -= 0.031 * HEX_R;"),
    # ---- cavalry kinematics (`kit.rs`, used by both zelazo-* files)
    ("M14 sjAlong/acAlong: D not normalised", Z + "kit.rs",
     "quat_units_synced(m, id, Y_UP, d.normalize());", "quat_units_synced(m, id, Y_UP, d);"),
    ("M15 sjAlong/acAlong: Euler not re-synced after setFromUnitVectors", Z + "kit.rs",
     "quat_units_synced(m, id, Y_UP, d.normalize());",
     "m.node(id).quat_from_unit_vectors(Y_UP, d.normalize());"),
    ("M16 strap: scale w <-> t swapped", Z + "kit.rs",
     "m.node(id).set_scale(w, js_max(len, 1e-5), t);", "m.node(id).set_scale(t, js_max(len, 1e-5), w);"),
    ("M17 arm IK: reach clamp 0.999 -> 0.998", Z + "kit.rs",
     "let dist = js_min(dv.length(), (l1 + l2) * 0.999);",
     "let dist = js_min(dv.length(), (l1 + l2) * 0.998);"),
    ("M18 konnica lancowa: rim rotateX(+PI/2) -> -PI/2", Z + "konnica_asyr.rs",
     "rotate_on_axis(&mut m, rim, v3(1.0, 0.0, 0.0), PI / 2.0);",
     "rotate_on_axis(&mut m, rim, v3(1.0, 0.0, 0.0), -PI / 2.0);"),
    ("M19 konnica lucznicza: bottom bow tip mirrored", Z + "konnica_asyr.rs",
     "let tip_bot = v3(0.0, -tip_local, tip_local_z).apply_mat4(&bow_matrix);",
     "let tip_bot = v3(0.0, tip_local, tip_local_z).apply_mat4(&bow_matrix);"),
    ("M20 konnica lucznicza: atan2 arguments swapped", Z + "konnica_asyr.rs",
     "let yaw = js_atan2(dir_a.x, dir_a.z);", "let yaw = js_atan2(dir_a.z, dir_a.x);"),
    # ---- units.ts builders
    ("M21 catapult arm angle 24 -> 25 deg", Z + "units_ts.rs",
     "let arm_deg = 24.0;", "let arm_deg = 25.0;"),
    ("M22 Gaesatae armlet torus tubular 12 -> 13", Z + "units_ts.rs",
     "torus(0.037 * HEX_R, 0.009 * HEX_R, 6, 12)", "torus(0.037 * HEX_R, 0.009 * HEX_R, 6, 13)"),
    ("M23 Soldurii dome thetaLength PI*0.5 -> PI*0.6", Z + "units_ts.rs",
     "sph(AV_HEAD_S * 0.58, 10, 6, 0.0, PI * 2.0, 0.0, PI * 0.5),",
     "sph(AV_HEAD_S * 0.58, 10, 6, 0.0, PI * 2.0, 0.0, PI * 0.6),"),
    # ---- stub removal / hooks
    ("M24 registry: MOD-07 stays NotYetPorted", "src/models/unit_core/registry.rs",
     "return crate::models::units_zelazo::build(base, owner).ok_or(NotYetPorted::of(base));",
     "return Err(NotYetPorted::of(base));"),
    ("M25 category: `falanga` stays a stub", "src/models/unit_core/category.rs",
     "UnitCategory::Falanga => crate::models::units_zelazo::build(cat.base(), owner)",
     "UnitCategory::Falanga => None"),
    ("M26 Prim::Zelazo hook builds a unit box", "src/models/unit_core/model.rs",
     "Self::Zelazo(g) => g.build(),", "Self::Zelazo(_) => geom::box_geometry(1.0, 1.0, 1.0, 1, 1, 1),"),
    ("M27 routing: buildHastati arm removed", Z + "mod.rs",
     "        Base::HastatiOld => hastati_falangita::build_hastati(owner),\n", ""),
    # ---- platform transcendentals: same bits as V8 on these inputs (glibc),
    # so only the source scanner `jsmath_wiring` can see them (P4.23 E10-E12)
    ("M28 oval rim ring: js_cos -> platform f64::cos", Z + "geo.rs",
     "let x = js_cos(ang) * a;", "let x = ang.cos() * a;"),
    ("M29 up_dir: js_sin -> platform f64::sin", Z + "kit.rs",
     "Vec3::new(0.0, js_cos(phi), js_sin(phi))", "Vec3::new(0.0, js_cos(phi), phi.sin())"),
    ("M30 konnica lucznicza: js_atan2 -> platform f64::atan2", Z + "konnica_asyr.rs",
     "let yaw = js_atan2(dir_a.x, dir_a.z);", "let yaw = dir_a.x.atan2(dir_a.z);"),
    ("M31 catapult span: js_hypot_n -> platform f64::hypot", Z + "units_ts.rs",
     "let len = js_hypot_n(&[dx, dy, dz]);", "let len = dx.hypot(dy).hypot(dz);"),
]

CMD = ["cargo", "test", "--locked", "--no-fail-fast",
       "--test", "units_zelazo_web_parity", "--test", "unit_core_web_parity",
       "--test", "unit_core_model_rule", "--test", "units_kamien_web_parity",
       "--test", "units_braz_web_parity", "--test", "jsmath_wiring"]


def main() -> int:
    check_only = "--check" in sys.argv
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
        if check_only:
            continue
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
    if check_only:
        print(f"snippets ok: {len(MUTATIONS)}")
        return 0
    print(f"detected {detected}/{len(MUTATIONS)}, build errors {build_errors}")
    return 0 if detected == len(MUTATIONS) else 1


if __name__ == "__main__":
    sys.exit(main())
