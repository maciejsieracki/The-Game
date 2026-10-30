import subprocess, sys, time, os

ENG = "/home/user/The-Game/.claude/worktrees/wf_a3719c85-155-4/rust-port/engine"
DOM = "src/domain/"
LOG = "/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/mut-results.log"
ENV = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0", CARGO_TARGET_DIR="/dev/shm/p6-8j-target")

M = [
    # id, file, old, new
    ("I-delta", "society_breakdown/order.rs", "    if delta != 0.0 {", "    if true {"),
    ("M10-raw0", "society_breakdown/order.rs", "    if !raw.is_finite() || raw == 0.0 {", "    if !raw.is_finite() {"),
    ("J-maxge0", "society_breakdown/order.rs", "    let max = if order.sz.sz_max > 0.0 {", "    let max = if order.sz.sz_max >= 0.0 {"),
    ("GRACE-ge", "society_breakdown/order.rs", "        Some(grace) if grace > 0.0 => {", "        Some(grace) if grace >= 0.0 => {"),
    ("CRIT-gt", "society_breakdown/order.rs", "    if por_pct >= revolt.critical_por_pct {", "    if por_pct > revolt.critical_por_pct {"),
    ("MSG-1.5", "society_breakdown/order.rs", "        Some(1.0) => format!(", "        Some(1.5) => format!("),
    ("MSG-le0", "society_breakdown/order.rs", "        Some(left) if left <= 0.0 => last_chance_message(city_name),", "        Some(left) if left < 0.0 => last_chance_message(city_name),"),
    ("BAND-lad-gt", "society_breakdown/order.rs", "    if p >= POR_LAD_MIN {", "    if p > POR_LAD_MIN {"),
    ("BAND-spok-gt", "society_breakdown/order.rs", "    } else if p >= POR_SPOKOJ_MIN {", "    } else if p > POR_SPOKOJ_MIN {"),
    ("BAND-nap-gt", "society_breakdown/order.rs", "    } else if p >= POR_NAPIECIE_MIN {", "    } else if p > POR_NAPIECIE_MIN {"),
    ("BAND-niep-gt", "society_breakdown/order.rs", "    } else if p >= POR_NIEPOKOJ_MIN {", "    } else if p > POR_NIEPOKOJ_MIN {"),
    ("BAND-crit-gt", "society_breakdown/order.rs", "    } else if p >= crit {", "    } else if p > crit {"),
    ("BAND-crit-finite", "society_breakdown/order.rs", "    let crit = if critical_por_pct.is_finite() {", "    let crit = if true {"),
    ("TIER-ord-gt", "society_breakdown/order.rs", "    if p >= TIER_ORDER_MIN {", "    if p > TIER_ORDER_MIN {"),
    ("TIER-neu-gt", "society_breakdown/order.rs", "    } else if p >= TIER_NEUTRAL_MIN {", "    } else if p > TIER_NEUTRAL_MIN {"),
    ("EFF-lad-neutral", "society_breakdown/order.rs", "        PorPctBand::Lad => order_effects(OrderTier::Order, params),", "        PorPctBand::Lad => order_effects(OrderTier::Neutral, params),"),
    ("EFF-spok-order", "society_breakdown/order.rs", "        PorPctBand::Spokoj => order_effects(OrderTier::Neutral, params),", "        PorPctBand::Spokoj => order_effects(OrderTier::Order, params),"),
    ("EFF-niep-neutral", "society_breakdown/order.rs", "        PorPctBand::Niepokoj => order_effects(OrderTier::Unrest, params),", "        PorPctBand::Niepokoj => order_effects(OrderTier::Neutral, params),"),
    ("FIN-finite", "society_breakdown/order.rs", "    if x.is_finite() {\n        x\n    } else {\n        0.0\n    }", "    if true {\n        x\n    } else {\n        0.0\n    }"),
    ("PORPCT-unwrap", "society_breakdown/order.rs", "        .unwrap_or(SZ_PCT_CAP);", "        .unwrap_or(0.0);"),
    ("CONTR-total-ge", "society_breakdown/order.rs", "    let sz_wklad_pct = if total > 0.0 {", "    let sz_wklad_pct = if total >= 0.0 {"),
    ("CONTR-wsum-ge", "society_breakdown/order.rs", "        if w_sum > 0.0 {", "        if w_sum >= 0.0 {"),
    ("BD-building-true", "society_breakdown/breakdown.rs", "    if input.building_zadowolenie != 0.0 {", "    if true {"),
    ("BD-kult-none", "society_breakdown/breakdown.rs", "        None => 1.0,", "        None => 0.0,"),
    ("BD-kult-js-false", "society_breakdown/breakdown.rs", "    if js_truthy(kult_v) {", "    if false {"),
    ("BD-luks-ge", "society_breakdown/breakdown.rs", "    if luks_bonus > 0.0 {", "    if luks_bonus >= 0.0 {"),
    ("BD-luks-le", "society_breakdown/breakdown.rs", "    } else if luks_bonus < 0.0 {", "    } else if luks_bonus <= 0.0 {"),
    ("BD-atwar-neg", "society_breakdown/breakdown.rs", "    if input.at_war {", "    if !input.at_war {"),
    ("BD-stolica-neg", "society_breakdown/breakdown.rs", "    if input.stolica_easy_bonus {", "    if !input.stolica_easy_bonus {"),
    ("BD-palac-range", "society_breakdown/breakdown.rs", "        Some(t @ 1..=3) => t,", "        Some(t @ 1..=2) => t,"),
    ("BD-palac-has2", "society_breakdown/breakdown.rs", "        _ if input.has_palac => 1,", "        _ if input.has_palac => 2,"),
    ("BD-effective-ge", "society_breakdown/breakdown.rs", "    if effective > 0.0 {", "    if effective >= 0.0 {"),
    ("BD-palac-contains", "society_breakdown/breakdown.rs", "    if (1..=3).contains(&palac_tier) {", "    if (1..=2).contains(&palac_tier) {"),
    ("BD-palac-fallback", "society_breakdown/breakdown.rs", "            1 => (\"prawo_palac\", 35.0, \"Pałac\"),", "            1 => (\"prawo_palac\", 36.0, \"Pałac\"),"),
    ("BD-garn-false", "society_breakdown/breakdown.rs", "    if input.has_garnizon_budynek {", "    if false {"),
    ("BD-osada-ge", "society_breakdown/breakdown.rs", "    let legacy_osada = if pop > 0.0 && pop <= osada_prog {", "    let legacy_osada = if pop >= 0.0 && pop <= osada_prog {"),
    ("BD-osiedle-false", "society_breakdown/breakdown.rs", "    if js_truthy(osiedle_v) {\n        ", "    if false {\n        "),
    ("BD-male-lt", "society_breakdown/breakdown.rs", "    let legacy_male = if pop <= prog_zagesz {", "    let legacy_male = if pop < prog_zagesz {"),
    ("SB-round-ge", "society_breakdown.rs", "    let rounded = if x - floor >= 0.5 { floor + 1.0 } else { floor };", "    let rounded = if x - floor > 0.5 { floor + 1.0 } else { floor };"),
    ("SB-round-sign", "society_breakdown.rs", "    if rounded == 0.0 && (x < 0.0 || (x == 0.0 && x.is_sign_negative())) {", "    if rounded == 0.0 && (x < 0.0) {"),
    ("SB-finite-false", "society_breakdown.rs", "    if !x.is_finite() {", "    if false {"),
    ("SB-jsmax-sign", "society_breakdown.rs", "        return if a.is_sign_positive() { a } else { b };", "        return a;"),
    ("SB-jsmin-sign", "society_breakdown.rs", "        return if a.is_sign_negative() { a } else { b };", "        return b;"),
    ("SB-truthy", "society_breakdown.rs", "    x != 0.0 && !x.is_nan()", "    x != 0.0"),
    ("SB-jsnum-inf", "society_breakdown.rs", "    } else if x == f64::INFINITY {", "    } else if x == f64::NEG_INFINITY {"),
    ("SB-table-empty", "society_breakdown.rs", "        if !arr.is_empty() {", "        if true {"),
    ("SB-pop-nan", "society_breakdown.rs", "    if pop.is_nan() {", "    if false {"),
    ("SB-osiedle-range", "society_breakdown.rs", "    if !(1.0..=4.0).contains(&p) {", "    if !(1.0..=5.0).contains(&p) {"),
    ("SB-p-lt1", "society_breakdown.rs", "    if p.is_nan() || p < 1.0 {", "    if p < 1.0 {"),
    ("SB-era-empty", "society_breakdown.rs", "    if table.is_empty() {\n        return 0.0;", "    if false {\n        return 0.0;"),
    ("SB-era-finite", "society_breakdown.rs", "    if v.is_finite() {", "    if true {"),
    ("SB-wsp-gt", "society_breakdown.rs", "    let w = if wsp.is_finite() && wsp > 0.0 {", "    let w = if wsp.is_finite() && wsp >= 0.0 {"),
    ("SB-scale-finite", "society_breakdown.rs", "    let scale = if x.is_finite() { x } else { 0.0 };", "    let scale = x;"),
    ("SB-pctnetto-gt", "society_breakdown.rs", "    let m = if max > 0.0 { max } else { 1.0 };", "    let m = if max >= 0.0 { max } else { 1.0 };"),
    ("SB-clamp-finite", "society_breakdown.rs", "    if !x.is_finite() {", "    if false {"),
    ("SB-prog-le0", "society_breakdown.rs", "    if prog.is_nan() || prog <= 0.0 {", "    if prog.is_nan() || prog < 0.0 {"),
    ("SB-luks-finite", "society_breakdown.rs", "    let luks = if procent_luksus.is_finite() {", "    let luks = if true {"),
    ("BD-stolica-neg-happy", "society_breakdown/breakdown.rs", "    if input.stolica_easy_bonus {\n        let v = pick_society(sz_block", "    if !input.stolica_easy_bonus {\n        let v = pick_society(sz_block"),
    ("BD-stolica-neg-law", "society_breakdown/breakdown.rs", "    if input.stolica_easy_bonus {\n        let v = pick_society(pr_block", "    if !input.stolica_easy_bonus {\n        let v = pick_society(pr_block"),
    ("BD-osiedle-false-happy", "society_breakdown/breakdown.rs", "    if js_truthy(osiedle_v) {\n        lines.push(SocietyLine {\n            id: \"osiedle\".into(),", "    if false {\n        lines.push(SocietyLine {\n            id: \"osiedle\".into(),"),
    ("SB-round-finite-false", "society_breakdown.rs", "    if !x.is_finite() {\n        return x;", "    if false {\n        return x;"),
    ("SB-clamp-finite-false", "society_breakdown.rs", "    if !x.is_finite() {\n        return 0.0;", "    if false {\n        return 0.0;"),
    ("SB-truthy-nan-kept", "society_breakdown.rs", "    x != 0.0 && !x.is_nan()", "    x != 0.0 || x.is_nan()"),

    ("SB-era-empty-ctx", "society_breakdown.rs", "    if table.is_empty() {\n        return MAX_TABLE_EMPTY_FALLBACK;", "    if false {\n        return MAX_TABLE_EMPTY_FALLBACK;"),
    ("SB-era-finite-max", "society_breakdown.rs", "    if v.is_finite() {\n        v\n    } else {\n        MAX_TABLE_EMPTY_FALLBACK", "    if true {\n        v\n    } else {\n        MAX_TABLE_EMPTY_FALLBACK"),
    ("SB-era-finite-kult", "society_breakdown.rs", "    if v.is_finite() {\n        v\n    } else {\n        KULT_RELIG_BY_ERA_DEFAULT[0]", "    if true {\n        v\n    } else {\n        KULT_RELIG_BY_ERA_DEFAULT[0]"),
    ("SB-clamp-finite-ctx", "society_breakdown.rs", "    if !x.is_finite() {\n        return 0.0;\n    }\n    js_min(cap", "    if false {\n        return 0.0;\n    }\n    js_min(cap"),
    ("SB-jsmax-ret-a", "society_breakdown.rs", "        return if a.is_sign_positive() { a } else { b };", "        return a;"),

    ("BD-osiedle-false-sz", "society_breakdown/breakdown.rs", "        legacy_male,\n    );\n    if js_truthy(osiedle_v) {", "        legacy_male,\n    );\n    if false {"),
    ("BD-osiedle-false-pr", "society_breakdown/breakdown.rs", "        pick_osiedle_pop_bonus(pr_block, \"prawo_bonus_osiedle_pop\", pop, diff, legacy_osada);\n    if js_truthy(osiedle_v) {", "        pick_osiedle_pop_bonus(pr_block, \"prawo_bonus_osiedle_pop\", pop, diff, legacy_osada);\n    if false {"),

]

def run_cargo():
    p = subprocess.run(
        ["cargo", "test", "--test", "p6_8j_society", "--test", "p6_8j_order", "--test", "p6_8j_guards"],
        cwd=ENG, env=ENV, capture_output=True, text=True, timeout=300)
    out = p.stdout + p.stderr
    if "test result: FAILED" in out or "test failed" in out:
        return "KILLED", out
    if p.returncode != 0:
        return "BUILD-ERR", out
    return "SURVIVED", out

def main():
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    for mid, rel, old, new in M[lo:hi]:
        path = os.path.join(ENG, DOM, rel)
        subprocess.run(["git", "checkout", "--", DOM + rel], cwd=ENG, check=True)
        src = open(path, encoding="utf-8").read()
        n = src.count(old)
        if n != 1:
            res, detail = f"NOMATCH(count={n})", ""
        else:
            open(path, "w", encoding="utf-8").write(src.replace(old, new, 1))
            t0 = time.time()
            try:
                res, out = run_cargo()
            finally:
                subprocess.run(["git", "checkout", "--", DOM + rel], cwd=ENG, check=True)
            detail = ""
            if res == "KILLED":
                fails = [l for l in out.splitlines() if l.strip().startswith("test ") and "FAILED" in l]
                detail = ";".join(f.split()[1] for f in fails[:3])
            res = f"{res} {int(time.time()-t0)}s"
        line = f"{mid}\t{res}\t{detail}"
        print(line, flush=True)
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    subprocess.run(["git", "checkout", "--", DOM], cwd=ENG, check=True)

if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "list":
        for i, m in enumerate(M):
            print(i, m[0])
    else:
        main()
