import subprocess, sys, os
WT = "/home/user/The-Game/.claude/worktrees/wf_b6866730-fc5-1"
ENG = WT + "/rust-port/engine"
SP = "/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad"
LOG = SP + "/mut-results.txt"
M = "src/domain/diplomacy_multiwar.rs"
G = "src/domain/diplomacy_multiwar_gate.rs"
P = "src/domain/diplomacy_multiwar_peace.rs"
N = "src/domain/diplomacy_nap_trust.rs"
MUT = [
("MW01", M, "if a.is_nan() || b.is_nan() {\n        return f64::NAN;\n    }\n    if a == b {\n        return if a.is_sign_negative() { b } else { a };", "if a.is_nan() {\n        return f64::NAN;\n    }\n    if a == b {\n        return if a.is_sign_negative() { b } else { a };"),
("MW02", M, "        return if a.is_sign_negative() { b } else { a };", "        return b;"),
("MW03", M, "        return if a.is_sign_negative() { a } else { b };", "        return a;"),
("MW04", M, "    js_min(hi, js_max(lo, v))", "    js_min(hi, v)"),
("MW05", M, "    after.starts_with(\"-WYMUSZONA-WOJNA:\").then_some(tag)", "    after.starts_with(\"-WYMUSZONA\").then_some(tag)"),
("MW06", M, "(\"ZELAZO\", ForcedEraTag::Iron)", "(\"ZELAZO\", ForcedEraTag::Bronze)"),
("MW07", M, "let rest = powod.strip_prefix(\"R-EPOKA-\")?;", "let rest = powod.strip_prefix(\"R-EPOKA\")?;"),
("MW08", M, "    enabled.contains(&tag)\n", "    !enabled.contains(&tag)\n"),
("MW09", M, "        Some(max) => declared < max,", "        Some(max) => declared <= max,"),
("MW10", M, "    match max_per_era {\n        None => true,", "    match max_per_era {\n        None => false,"),
("MW11", M, "format!(\"{owner_id}:{epoch}\")", "format!(\"{epoch}:{owner_id}\")"),
("MW12", M, "        .unwrap_or(0)\n}", "        .unwrap_or(1)\n}"),
("MW13", M, "        Some(max) => era_war_count_for(counts, owner_id, epoch) < max,", "        Some(max) => era_war_count_for(counts, owner_id, epoch) <= max,"),
("MW14", M, "    match max_per_civ {\n        None => true,", "    match max_per_civ {\n        None => false,"),
("MW15", M, "    if !is_forced_era_war_enabled(tag, p.enabled_forced_war_eras) {\n        return EraWarGateVerdict::EraDisabled;", "    if !is_forced_era_war_enabled(tag, p.enabled_forced_war_eras) {\n        return EraWarGateVerdict::Ok;"),
("MW16", M, "    if !inp.multiwar_enabled {", "    if false {"),
("MW17", M, "    if !can_declare_era_forced_war(inp.declared_for_tag, p.max_era_forced_wars_per_era) {", "    if can_declare_era_forced_war(inp.declared_for_tag, p.max_era_forced_wars_per_era) {"),
("MW18", M, "        return EraWarGateVerdict::CivCapAttacker;", "        return EraWarGateVerdict::CivCapTarget;"),
("MW19", M, "        return EraWarGateVerdict::CivCapTarget;\n    }\n    EraWarGateVerdict::Ok", "        return EraWarGateVerdict::Ok;\n    }\n    EraWarGateVerdict::Ok"),
("MW20", M, "    let Some(tag) = inp.tag else {\n        return EraWarGateVerdict::Ok;", "    let Some(tag) = inp.tag else {\n        return EraWarGateVerdict::EraDisabled;"),
("MW21", M, "pub fn player_epoch_war_enabled(saved: Option<bool>) -> bool {\n    saved.unwrap_or(true)", "pub fn player_epoch_war_enabled(saved: Option<bool>) -> bool {\n    saved.unwrap_or(false)"),
("MW22", M, "    let turns = js_max(0.0, turns_at_war);", "    let turns = turns_at_war;"),
("MW23", M, "    let since = turns_since_city_change.unwrap_or(turns);", "    let since = turns_since_city_change.unwrap_or(0.0);"),
("MW24", M, "p.waga_strat_miasta * js_max(0.0, lost_cities_total)", "p.waga_strat_miasta * lost_cities_total"),
("MW25", M, "pelne_tur: 200.0,", "pelne_tur: 199.0,"),
("MW26", M, "stagnacja_skala_tur: 100.0,", "stagnacja_skala_tur: 99.0,"),
("MW27", M, "prog_chetnosci: 0.5,", "prog_chetnosci: 0.51,"),
("MW28", M, "    level >= p.prog_chetnosci", "    level > p.prog_chetnosci"),
("MW29", M, "    1.0 - p.rabat_ceny_pokoju_max * x", "    1.0 - p.rabat_ceny_pokoju_max * (1.0 - x)"),
("MW30", M, "rabat_ceny_pokoju_max: 0.6,", "rabat_ceny_pokoju_max: 0.61,"),
("MW31", M, "    if share > p.udzial_wyraznie {", "    if share >= p.udzial_wyraznie {"),
("MW32", M, "(p.udzial_wyraznie - share) / p.udzial_wyraznie", "(p.udzial_wyraznie + share) / p.udzial_wyraznie"),
("MW33", M, "p.waga_strat * loss,", "p.waga_zmeczenia * loss,"),
("MW34", M, "    if stage <= 1 {\n        return 0;", "    if stage < 1 {\n        return 0;"),
("MW35", M, "        return 1i64.min(p.max_miast_na_pokoj);", "        return 2i64.min(p.max_miast_na_pokoj);"),
("MW36", M, "max_miast_na_pokoj: 2,", "max_miast_na_pokoj: 3,"),
("MW37", M, "    p.progi_stopni.iter().filter(|&&t| despair >= t).count() as i64", "    p.progi_stopni.iter().filter(|&&t| despair > t).count() as i64"),
("MW38", M, "let idx = stage.max(0).min(arr.len() as i64 - 1) as usize;", "let idx = (stage.max(0) + 1).min(arr.len() as i64 - 1) as usize;"),
("MW39", M, "    base * (1.0 + p.mnoznik_na_odrzucenie * js_max(0.0, rejected_offers))", "    base * (1.0 + p.mnoznik_na_odrzucenie * rejected_offers)"),
("MW40", M, "    Some(max) => declared < max,", "    Some(max) => declared < max + 1,"),
("MW41", M, "max_era_forced_wars_per_civ_per_era: Some(1),", "max_era_forced_wars_per_civ_per_era: Some(2),"),
("MW42", M, "    max_era_forced_wars_per_era: None,", "    max_era_forced_wars_per_era: Some(1),"),
("MW43", M, "    ForcedEraTag::Stone,\n    ForcedEraTag::Bronze,\n    ForcedEraTag::Iron,", "    ForcedEraTag::Stone,\n    ForcedEraTag::Stone,\n    ForcedEraTag::Iron,"),
("GT01", G, "    turn >= DELAY_INTER_CIV_WARS_UNTIL_TURN", "    turn > DELAY_INTER_CIV_WARS_UNTIL_TURN"),
("GT02", G, "pub const DELAY_INTER_CIV_WARS_UNTIL_TURN: f64 = 40.0;", "pub const DELAY_INTER_CIV_WARS_UNTIL_TURN: f64 = 41.0;"),
("GT03", G, "    if era == 1.0 {", "    if era >= 1.0 {"),
("GT04", G, "pub const MAX_CONCURRENT_WARS_STONE: Option<i64> = Some(1);", "pub const MAX_CONCURRENT_WARS_STONE: Option<i64> = Some(2);"),
("GT05", G, "pub const MAX_CONCURRENT_WARS_FROM_BRONZE: Option<i64> = None;", "pub const MAX_CONCURRENT_WARS_FROM_BRONZE: Option<i64> = Some(1);"),
("GT06", G, "        if inp.attacker_war_count >= limit {", "        if inp.attacker_war_count > limit {"),
("GT07", G, "    if !inp.target_is_player {", "    if true {"),
("GT08", G, "            if inp.target_war_count >= limit {", "            if inp.target_war_count > limit {"),
("GT09", G, "            return WarGateReason::StoneLimitAttackerR2;", "            return WarGateReason::Ok;"),
("GT10", G, "        return WarGateReason::DelayR1;", "        return WarGateReason::Ok;"),
("GT11", G, "            WarGateReason::StoneLimitTargetR2 => \"stone_limit_target_r2\",", "            WarGateReason::StoneLimitTargetR2 => \"stone_limit_attacker_r2\","),
("GT12", G, "            .find(|c| id_of(c) == cap && owner_of(c) == player_owner_id)", "            .find(|c| id_of(c) == cap)"),
("GT13", G, "    by_capital.or_else(|| cities.iter().find(|c| owner_of(c) == player_owner_id))", "    by_capital.or_else(|| cities.iter().rev().find(|c| owner_of(c) == player_owner_id))"),
("NT01", N, "pub const NAP_ZAUFANIE_FALLBACK: f64 = 30.0;", "pub const NAP_ZAUFANIE_FALLBACK: f64 = 29.0;"),
("NT02", N, "pub const NAP_GRANICA_RELACJA_NARZUT: f64 = 20.0;", "pub const NAP_GRANICA_RELACJA_NARZUT: f64 = 19.0;"),
("NT03", N, "pub const NAP_DELTA_AGRESOR: f64 = 15.0;", "pub const NAP_DELTA_AGRESOR: f64 = 14.0;"),
("NT04", N, "    let narzut = if kara_wspolna_granica {\n        NAP_GRANICA_RELACJA_NARZUT\n", "    let narzut = if kara_wspolna_granica {\n        0.0\n"),
("NT05", N, "    let delta = if proponent_agresor {\n        NAP_DELTA_AGRESOR\n", "    let delta = if proponent_agresor {\n        0.0\n"),
("NT06", N, "    js_max(0.0, prog_nap_relacja + narzut - nap_ease + delta)", "    js_max(0.0, prog_nap_relacja + narzut + nap_ease + delta)"),
("NT07", N, "    js_max(0.0, prog_nap_relacja + narzut - nap_ease + delta)", "    prog_nap_relacja + narzut - nap_ease + delta"),
("NT08", N, "    if rel_ok && zauf_ok {", "    if rel_ok || zauf_ok {"),
("NT09", N, "    let rel_ok = rel_total >= min_rel;", "    let rel_ok = rel_total > min_rel;"),
("NT10", N, "    let zauf_ok = zaufanie >= min_zauf;", "    let zauf_ok = zaufanie > min_zauf;"),
("NT11", N, "    if !zauf_ok && !rel_ok {", "    if !zauf_ok || !rel_ok {"),
("NT12", N, "    if ctx.has_nap {", "    if false {"),
("NT13", N, "    if ctx.at_war {", "    if false {"),
("NT14", N, "    let min_zauf = ctx.prog_nap_zaufanie.unwrap_or(NAP_ZAUFANIE_FALLBACK);", "    let min_zauf = ctx.prog_nap_zaufanie.unwrap_or(0.0);"),
("NT15", N, "        ctx.prog_nap_relacja,\n        ctx.kara_wspolna_granica,\n        ctx.nap_agresor_aktywny,", "        ctx.prog_nap_relacja,\n        false,\n        ctx.nap_agresor_aktywny,"),
("NT16", N, "        ctx.prog_nap_relacja,\n        ctx.kara_wspolna_granica,\n        ctx.nap_agresor_aktywny,", "        ctx.prog_nap_relacja,\n        ctx.kara_wspolna_granica,\n        false,"),
("NT17", N, "    if n.is_finite() && n.fract() == 0.0 {", "    if n.is_finite() && n.fract() != 0.0 {"),
("NT18", N, "        format!(\"{:.1}\", a)\n    };", "        format!(\"{}\", a)\n    };"),
("NT23", N, "format!(\"{:.1}\", ((a * 10.0).floor() + 1.0) / 10.0)", "format!(\"{:.1}\", ((a * 10.0).floor()) / 10.0)"),
("NT24", N, "    if neg {\n        format!(\"-{body}\")", "    if false {\n        format!(\"-{body}\")"),
("NT25", N, "frac.len() >= 2 && frac.as_bytes()[1] == b'5'", "frac.len() >= 2 && frac.as_bytes()[1] == b'4'"),
("NT26", N, "    if n.is_nan() {\n        return \"NaN\".to_string();", "    if n.is_nan() {\n        return \"nan\".to_string();"),
("NT19", N, "    if ctx.nap_agresor_aktywny {\n        powody.push", "    if false {\n        powody.push"),
("NT20", N, "    let powod = powody.join(\", \");", "    let powod = powody.join(\"; \");"),
("NT22", N, "        let rel_extra = if powod_rel.is_empty() {", "        let rel_extra = if false {"),
("PC01", P, "    let d = b.pn - a.pn;\n    if d.is_nan() || d == 0.0 {", "    let d = b.pn - a.pn;\n    if d.is_nan() {"),
("PC02", P, "    let d = a.pn - b.pn;\n    if d.is_nan() || d == 0.0 {", "    let d = a.pn - b.pn;\n    if d.is_nan() {"),
("PC03", P, "fn by_id(a: &PeaceAsset, b: &PeaceAsset) -> Ordering {\n    a.id.cmp(&b.id)", "fn by_id(a: &PeaceAsset, b: &PeaceAsset) -> Ordering {\n    b.id.cmp(&a.id)"),
("PC04", P, "        .find(|a| a.kind == PeaceAssetKind::Zloto && a.amount > 0.0 && a.pn > 0.0);", "        .find(|a| a.kind == PeaceAssetKind::Zloto && a.amount > 0.0);"),
("PC05", P, "(take_pn / gold.pn) * gold.amount).ceil()", "(take_pn / gold.pn) * gold.amount).floor()"),
("PC06", P, "    if let Some(gold) = gold {\n        if need0 > 0.0 {", "    if let Some(gold) = gold {\n        if true {"),
("PC07", P, "if res_total >= rem {", "if res_total > rem {"),
("PC08", P, "                covered += r.pn;\n                rem -= r.pn;", "                rem -= r.pn;"),
("PC09", P, "                if rem <= 0.0 {\n                    break;\n                }\n", ""),
("PC10", P, "        .filter(|a| a.kind == PeaceAssetKind::Miasto && !a.forbidden && a.pn > 0.0)\n        .collect();\n    cities.sort_by", "        .filter(|a| a.kind == PeaceAssetKind::Miasto && a.pn > 0.0)\n        .collect();\n    cities.sort_by"),
("PC11", P, "        .filter(|a| a.kind == PeaceAssetKind::Miasto && !a.forbidden && a.pn > 0.0)\n        .collect();\n    pool.sort_by", "        .filter(|a| a.kind == PeaceAssetKind::Miasto && a.pn > 0.0)\n        .collect();\n    pool.sort_by"),
("PC12", P, "            if rem > 0.0 {\n                if let Some(cover)", "            if rem >= 0.0 {\n                if let Some(cover)"),
("PC13", P, "        .find(|c| c.pn >= rem)\n", "        .find(|c| c.pn > rem)\n"),
("PC14", P, "        .or_else(|| cities.last().copied())", "        .or_else(|| cities.first().copied())"),
("PC15", P, "        full: covered >= need0,\n        histogram,\n    }\n}\n\n/// Web `cities.find", "        full: covered > need0,\n        histogram,\n    }\n}\n\n/// Web `cities.find"),
("PC16", P, "        shortfall_pn: js_max(0.0, need0 - covered),\n        full: covered >= need0,\n        histogram,\n    }\n}\n\n/// Web `cities.find", "        shortfall_pn: need0 - covered,\n        full: covered >= need0,\n        histogram,\n    }\n}\n\n/// Web `cities.find"),
("PC17", P, "    if base.full || max_cities <= 0.0 {", "    if base.full {"),
("PC18", P, "    while n < max_cities && rem > 0.0 && !pool.is_empty() {", "    while n <= max_cities && rem > 0.0 && !pool.is_empty() {"),
("PC19", P, "            .position(|c| c.pn >= rem)", "            .position(|c| c.pn > rem)"),
("PC20", P, "            .unwrap_or(pool.len() - 1);", "            .unwrap_or(0);"),
("PC21", P, "    if st.war_start != war_start {", "    if false {"),
("PC22", P, "    st.peak = js_max(st.peak, level);", "    st.peak = level;"),
("PC23", P, "        last_offer_turn: -1.0,", "        last_offer_turn: 0.0,"),
("PC24", P, "        stage: 0,\n        rejected_offers: 0,", "        stage: 1,\n        rejected_offers: 0,"),
]

def run(ids_sel):
    for mid, f, old, new in MUT:
        if ids_sel and mid not in ids_sel:
            continue
        path = ENG + "/" + f
        src = open(path, encoding="utf-8").read()
        cnt = src.count(old)
        if cnt != 1:
            line = f"{mid} SKIP_PATTERN_COUNT={cnt}"
        else:
            open(path, "w", encoding="utf-8").write(src.replace(old, new, 1))
            try:
                env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0",
                           CARGO_TARGET_DIR=ENG + "/target")
                b = subprocess.run(["cargo", "test", "-q", "--test", "p6_dyplo_multiwar_gates", "--test", "p6_dyplo_multiwar_interciv", "--test", "p6_dyplo_multiwar_peace"],
                                   cwd=ENG, env=env, capture_output=True, text=True)
                out = b.stdout + b.stderr
                if "error[" in out or "could not compile" in out:
                    line = f"{mid} UNVIABLE(compile)"
                elif b.returncode != 0:
                    line = f"{mid} KILLED"
                else:
                    line = f"{mid} SURVIVED"
            finally:
                open(path, "w", encoding="utf-8").write(src)
        with open(LOG, "a") as lf:
            lf.write(line + "\n")
        print(line, flush=True)

if __name__ == "__main__":
    run(set(sys.argv[1:]))
