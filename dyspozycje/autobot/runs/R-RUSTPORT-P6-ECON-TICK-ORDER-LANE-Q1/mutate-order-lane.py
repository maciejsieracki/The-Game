#!/usr/bin/env python3
"""Mutacje R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1: kazda mutacja = jedna zamiana tekstu w module petli/kultury/religii;
zabita, gdy `cargo test --test p6_order_lane` NIE przechodzi (blad kompilacji liczony osobno jako COMPILE).
Uzycie: mutate-order-lane.py <ENGINE_DIR> <TARGET_DIR> <START> <END> [--check]   (zakres indeksow, lacznie ze START, bez END;
--check: tylko sprawdza kotwice, bez cargo)
"""
import subprocess, sys, os

engine, target, start, end = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
check_only = "--check" in sys.argv
D = os.path.join(engine, "src/domain")
CU = "order_effects_culture.rs"
LA = "order_effects_lane.rs"

MUT = [
    # --- kultura ---
    (CU, "if share < 0.25 {\n        return params.kara_lt_25;", "if share <= 0.25 {\n        return params.kara_lt_25;", "cultureHappiness: <0.25 -> <=0.25"),
    (CU, "if share < 0.5 {\n        return params.kara_lt_50;", "if share <= 0.5 {\n        return params.kara_lt_50;", "cultureHappiness: <0.5 -> <=0.5"),
    (CU, "if share >= 1.0 {\n        return params.zadowolenie_100;", "if share > 1.0 {\n        return params.zadowolenie_100;", "cultureHappiness: >=1 -> >1"),
    (CU, "if share >= 0.75 {\n        return params.zadowolenie_75;", "if share > 0.75 {\n        return params.zadowolenie_75;", "cultureHappiness: >=0.75 -> >0.75"),
    (CU, "rate_pct += params.konwersja_sad;", "rate_pct += params.konwersja_stela;", "convertCulture: sad liczony jako stela"),
    (CU, "rate_pct = clamp(rate_pct, 0.0, params.konwersja_cap_tura);", "rate_pct = clamp(rate_pct, 0.0, 100.0);", "convertCulture: brak capu"),
    (CU, "let gain = js_max(0.0, finite_or(per_turn, 0.0));", "let gain = finite_or(per_turn, 0.0);", "accumulateCulture: ujemny zysk nie obciety"),
    (CU, "} else if c >= params.prog_zasieg_2 {", "} else if c > params.prog_zasieg_2 {", "cityBorderRadius: prog 2 >="),
    (CU, "js_max(0.0, 1.0 + modifier)\n    } else {\n        1.0\n    };\n    base * factor", "1.0 + modifier\n    } else {\n        1.0\n    };\n    base * factor", "cultureAccrualWithModifier: brak max(0)"),
    (CU, "if total <= 0.0 || own_religion.is_none() {\n        return 0.5;", "if total <= 0.0 || own_religion.is_none() {\n        return 0.0;", "religionOwnShare: neutralne 0.5 -> 0"),
    (CU, "2.0 * religion_own_share(state, own_religion) - 1.0", "religion_own_share(state, own_religion) - 0.5", "religionHappiness: zla skala"),
    (CU, "Mulberry32::new(if u == 0 { 1 } else { u })", "Mulberry32::new(u)", "makeRng: ziarno 0 nie daje stanu 1"),
    (CU, "return a.id.cmp(&b.id);", "return b.id.cmp(&a.id);", "spreadReligion: odwrocona kolejnosc id"),
    (CU, "let slots = (slots_f as usize).min(eligible.len());", "let slots = eligible.len();", "spreadReligion: brak limitu slotow"),
    (CU, "added = added.min(js_max(0.0, room));", "added = added.min(added);", "spreadReligion: brak limitu populacji"),
    (CU, "n.distance >= 1.0 && n.distance <= max_dist", "n.distance >= 1.0 && n.distance < max_dist", "spreadReligion: dystans <"),
    (CU, "if to_convert <= 0.0 && applied_rate > 0.0 {\n        to_convert = 1.0;", "if to_convert <= 0.0 && applied_rate > 0.0 {\n        to_convert = 0.0;", "convertViaTemple: brak 'never stall'"),
    (CU, "        a.cmp(b)\n    });\n    for k in donors", "        b.cmp(a)\n    });\n    for k in donors", "convertViaTemple: odwrocony remis dawcow"),
    (CU, "let mut to_convert = (applied_rate * convertible + 0.5).floor();", "let mut to_convert = (applied_rate * convertible).floor();", "convertViaTemple: floor zamiast round"),
    (CU, "if has_kamienne_kregi {\n        rate_pct += params.konwersja_kregi_pct;", "if has_kamienne_kregi {\n        rate_pct += params.konwersja_swiatynia_pct;", "convertViaTemple: kregi = swiatynia"),
    (CU, "share = clamp(share - rate, 0.0, 1.0);", "share = clamp(share + rate, 0.0, 1.0);", "presja: kierunek spadku kultury"),
    (CU, "if rel_s > total_rel_t {", "if rel_s >= total_rel_t {", "presja: religia > -> >="),
    (CU, "        if !culture_mix_active {\n            continue;\n        }\n", "", "presja: brak continue przy nieaktywnym mixie"),
    (CU, "let cur = rel_pct.get(&o_t).copied().unwrap_or(100.0);", "let cur = rel_pct.get(&o_t).copied().unwrap_or(0.0);", "presja: domyslne 100 -> 0"),
    (CU, "difficulty,\n        5.0,\n    )", "difficulty,\n        3.0,\n    )", "presja: fallback tempa 5 -> 3"),
    (CU, "let lk = key.to_lowercase();", "let lk = key.to_owned();", "civReligionForKey: brak lowercase"),
    (CU, "if !is_empty_religion_state(stored) {", "if is_empty_religion_state(stored) {", "resolveCityReligionState: odwrocone"),
    (CU, "let pop = js_max(0.0, population.floor());", "let pop = js_max(0.0, population);", "defaultCityReligionState: brak floor"),
    (CU, "sum += js_max(0.0, finite_or(c.kultura_skumulowana, 0.0));", "sum += c.kultura_skumulowana;", "empireCultureTotal: ujemna kultura"),
    # --- petla ---
    (LA, "trade_mult: apply(effects.trade_mult, modifiers.porzadek_pieniadz_proc),", "trade_mult: apply(effects.trade_mult, modifiers.porzadek_produkcja_proc),", "civMatrix: trade z zlym modyfikatorem"),
    (LA, "growth_mult: apply(effects.growth_mult, modifiers.porzadek_wzrost_proc),", "growth_mult: apply(effects.growth_mult, modifiers.porzadek_nauka_proc),", "civMatrix: growth z zlym modyfikatorem"),
    (LA, "Some(m) if m.is_finite() => js_max(0.0, 1.0 + m),", "Some(m) if m.is_finite() => 1.0 + m,", "civMatrix: brak max(0) w czynniku"),
    (LA, "    let next = n - 1.0;\n    if next <= 0.0 {\n        f.post_capture_law_turns_remaining = None;", "    let next = n - 1.0;\n    if next < 0.0 {\n        f.post_capture_law_turns_remaining = None;", "tickPostCaptureLaw: <= -> <"),
    (LA, "f.rebel_protection_turns_remaining = if next <= 0.0 { None } else { Some(next) };", "f.rebel_protection_turns_remaining = if next < 0.0 { None } else { Some(next) };", "tickRebelProtection: <= -> <"),
    (LA, "f.rebel_protection_turns_remaining = Some(REBEL_PROTECTION_TURNS);", "f.rebel_protection_turns_remaining = Some(REBEL_PROTECTION_TURNS - 1.0);", "markCityRebellionStarted: 19 zamiast 20"),
    (LA, "prawo.lines.insert(0, override_line);", "prawo.lines.push(override_line);", "override: linia na koncu"),
    (LA, "revolt_risk: 0.0,\n            ..effects\n        },", "..effects\n        },", "override: ryzyko buntu nie zerowane"),
    (LA, "u.owner_id == owner_id && u.q == city_q && u.r == city_r && !u.oblega", "u.owner_id == owner_id && u.q == city_q && u.r == city_r", "garnizon: jednostki oblegajace liczone"),
    (LA, "if a == Some(BARBARIAN_OWNER_ID) || b == Some(BARBARIAN_OWNER_ID) {", "if a == Some(BARBARIAN_OWNER_ID) && b == Some(BARBARIAN_OWNER_ID) {", "wojna: barbarzynca ||->&&"),
    (LA, "if parts.len() != 2 {", "if parts.len() != 3 {", "wojna: dlugosc klucza"),
    (LA, "if mix_active || own_share < 1.0 {", "if mix_active {", "lane: brak materializacji mixu <1"),
    (LA, "let mut rng = make_rng(ctx.turn);", "let mut rng = make_rng(ctx.turn + 1.0);", "lane: rng(turn+1)"),
    (LA, "            && order_eff.revolt_risk > 0.0\n", "", "lane: bunt bez warunku risk>0"),
    (LA, "order_eff.revolt_risk * conquest_mult", "order_eff.revolt_risk", "lane: bez mnoznika podboju"),
    (LA, "if cities[idx].population > 1.0 {", "if cities[idx].population >= 1.0 {", "lane: migracja przy pop>=1"),
    (LA, "            if g.should_trigger_rebellion\n                && ctx.human_owner_ids.contains(&cities[idx].owner_id)\n                && !cities[idx].rebel_state", "            if g.should_trigger_rebellion\n                && !cities[idx].rebel_state", "lane: rebelia tez AI"),
    (LA, "if c.owner_id == owner_id0 { s + c.population } else { s }", "s + c.population", "lane: populacja drenazu wszystkich ownerow"),
    (LA, "cities[idx].q * 31.0 + cities[idx].r)", "cities[idx].q * 30.0 + cities[idx].r)", "lane: seed spread q*30"),
    (LA, "if dist <= rp.szerzenie_max_dystans {", "if dist < rp.szerzenie_max_dystans {", "lane: sasiedzi religii dystans <"),
    (LA, "                        && hex_distance_web(oc.q, oc.r, cities[idx].q, cities[idx].r)\n                            <= pressure_range", "                        && hex_distance_web(oc.q, oc.r, cities[idx].q, cities[idx].r)\n                            < pressure_range", "lane: zrodla presji dystans <"),
    (LA, 'civ_matrix_param(ctx.matrix, k, "kultura_naplyw_proc")', 'civ_matrix_param(ctx.matrix, k, "eko_zadowolenie_proc")', "lane: zly parametr macierzy kultury"),
    (LA, "let ha_wealth = econ.map_or(0.0, |e| e.wealth_zadowolenie);", "let ha_wealth = 0.0;", "lane: haWealth=0"),
    (LA, "        tick_rebel_protection_end_of_turn(&mut cities[idx].post);\n", "", "lane: brak ticku ochrony rebelii"),
    (LA, "        if post_active {\n            tick_post_capture_law_end_of_turn", "        if !post_active {\n            tick_post_capture_law_end_of_turn", "lane: tick post-capture odwrocony"),
    (LA, "state.order_value_map.insert(cid.clone(), ord_pct.por_pct);", "state.order_value_map.insert(cid.clone(), ord_pct.sz.sz_pct);", "lane: orderValueMap = szPct"),
    (LA, "            if !v.deductions.is_empty() {\n", "            if false {\n", "lane: brak odjecia drenazu"),
    (LA, 'let has_swiatynia = built_refs.contains(&"swiatynia");', 'let has_swiatynia = built_refs.contains(&"kamienne_kregi");', "lane: swiatynia w spreadzie"),
    (LA, "podzial_procent_luksus: luksus,", "podzial_procent_luksus: None,", "lane: luksus pominiety"),
    (LA, "            designated.as_deref(),\n", "            None,\n", "lane: stolica bez wyznaczonej"),
    (LA, "difficulty == Difficulty::Easy,", "false,", "lane: stolica easy wylaczona"),
    (LA, "const STOLICA_EASY_MAX_TUR: f64 = 10.0;", "const STOLICA_EASY_MAX_TUR: f64 = 11.0;", "lane: maxTur 11"),
    (LA, ") + pop_matrix.happiness_base;", ");", "lane: brak happiness_base macierzy"),
    (LA, "own_culture_share: if mix_active { Some(own_share) } else { None },", "own_culture_share: Some(own_share),", "lane: ownCultureShare zawsze w szczesciu"),
    (LA, 'has_garnizon_budynek: built_refs.contains(&"garnizon"),', 'has_garnizon_budynek: built_refs.contains(&"sad"),', "lane: garnizon budynek = sad"),
    (LA, "palac_tier: city_palac_tier(&built_refs),", "palac_tier: None,", "lane: brak tieru palacu"),
    (LA, "            cities[idx].revolt_grace_remaining = None;\n            RevoltGraceState {", "            RevoltGraceState {", "lane: immunitet nie zeruje laski"),
    (LA, "mark_city_rebellion_started(&mut cities[idx].post, prev_owner);", "let _ = prev_owner;", "lane: brak markCityRebellionStarted"),
    (LA, "let culture_gain = culture_accrual_with_modifier(kultura_tick, culture_modifier);", "let culture_gain = culture_accrual_with_modifier(kultura_tick, 0.0);", "lane: modyfikator kultury pominiety"),
    (LA, "foreign_dom =\n            is_foreign_religion_dominant(&cur_rel, own_rel.as_deref(), rp.prog_dominacji_pct);\n\n        // KULTURA", "\n        // KULTURA", "lane: brak ponownego liczenia obcej religii"),
]

def run(args):
    return subprocess.run(args, cwd=engine, capture_output=True, text=True,
                          env={**os.environ, "CARGO_TARGET_DIR": target, "CARGO_INCREMENTAL": "0",
                               "CARGO_PROFILE_DEV_DEBUG": "0", "CARGO_PROFILE_TEST_DEBUG": "0"})

for i in range(start, min(end, len(MUT))):
    f, a, b, desc = MUT[i]
    path = os.path.join(D, f)
    src = open(path, encoding="utf-8").read()
    if src.count(a) != 1:
        print(f"[{i:02d}] BLAD-KOTWICY ({src.count(a)}x) {desc}", flush=True)
        continue
    if check_only:
        print(f"[{i:02d}] OK-KOTWICA {desc}", flush=True)
        continue
    open(path, "w", encoding="utf-8").write(src.replace(a, b))
    try:
        r = run(["cargo", "test", "-j", "2", "--test", "p6_order_lane"])
        out = r.stdout + r.stderr
        if r.returncode == 0:
            verdict = "PRZEZYLA"
        elif "error[E" in out or "error: could not compile" in out:
            verdict = "COMPILE"
        else:
            verdict = "ZABITA"
    finally:
        open(path, "w", encoding="utf-8").write(src)
    print(f"[{i:02d}] {verdict:9s} {f} :: {desc}", flush=True)
print(f"MUT_TOTAL={len(MUT)}")
