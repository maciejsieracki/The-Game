#!/usr/bin/env python3
"""Kontrola mutacyjna R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1.
Kazdy mutant: zamiana N-tego wystapienia `old` na `new` w pliku zrodlowym, `cargo test --test
p6_dyplomacja_truce_aggressor`; zabity = test pada (kod != 0 i brak bledu kompilacji). Plik zawsze przywracany.
Uzycie: mutate-dypl1.py <engine_dir> <od> <do>   (zakres indeksow mutantow, [od, do))
Wynik (linia na mutanta): `<idx> <KILLED|SURVIVED|COMPILE_ERR> <plik> :: <opis>`.
"""
import subprocess, sys, os

ENGINE = sys.argv[1]
LO, HI = int(sys.argv[2]), int(sys.argv[3])
S = "src/domain/"
T, G, A, W = S + "diplomacy_truce.rs", S + "diplomacy_war_gates.rs", S + "diplomacy_aggressor.rs", S + "alliance_war_obligation.rs"

# (plik, old, new, nth(0-based), opis)
M = [
    (T, "Some(u) if u.is_finite() => current_turn < u,", "Some(u) if u.is_finite() => current_turn <= u,", 0, "locked: < -> <="),
    (T, "Some(u) if u.is_finite() => current_turn < u,", "Some(u) if u.is_finite() => current_turn <= u,", 1, "truce_active: < -> <="),
    (T, "Some(u) if u.is_finite() => current_turn < u,", "Some(u) if u => current_turn < u,".replace("if u =>", "if !u.is_finite() =>"), 0, "locked: guard finite odwrocony"),
    (T, "pub const PEACE_TREATY_LOCK_TURNS: f64 = 10.0;", "pub const PEACE_TREATY_LOCK_TURNS: f64 = 11.0;", 0, "stala blokady 10 -> 11"),
    (T, "[f64; 3] = [5.0, 10.0, 15.0];", "[f64; 3] = [5.0, 10.0, 20.0];", 0, "opcje rozejmu 15 -> 20"),
    (T, "pub const TRUCE_DEFAULT_TURNS: f64 = 10.0;", "pub const TRUCE_DEFAULT_TURNS: f64 = 5.0;", 0, "domyslny rozejm 10 -> 5"),
    (T, "f.max(1.0)", "f.max(0.0)", 0, "js_max_1_floor: max(1) -> max(0)"),
    (T, "let f = x.floor();", "let f = x.ceil();", 0, "floor -> ceil"),
    (T, "f64::NAN\n    } else {\n        f.max(1.0)", "1.0\n    } else {\n        f.max(1.0)", 0, "NaN lockTurns -> 1"),
    (T, "charged: Some(false),", "charged: Some(true),", 0, "n3 charged false -> true"),
    (T, "typ: N3WindowKind::Pokoj,\n        by_owner_id: None,", "typ: N3WindowKind::Bezterminowe,\n        by_owner_id: None,", 0, "n3 typ pokoj -> bezterminowe"),
    (T, "turn: current_turn,\n        typ: N3WindowKind::Pokoj", "turn: 0.0,\n        typ: N3WindowKind::Pokoj", 0, "n3 turn = 0"),
    (T, "Some(current_turn + turns)", "Some(current_turn - turns)", 0, "peaceUntil = turn - turns"),
    (T, "lock_turns.unwrap_or(PEACE_TREATY_LOCK_TURNS)", "lock_turns.unwrap_or(1.0)", 0, "domyslne lockTurns 10 -> 1"),
    (T, ".filter(|ally| !is_peace_locked(*ally, ob.must_declare_war_on))", ".filter(|ally| is_peace_locked(*ally, ob.must_declare_war_on))", 0, "filter: brak negacji"),
    (T, ".filter(|ally| !is_peace_locked(*ally, ob.must_declare_war_on))", ".filter(|ally| !is_peace_locked(ob.must_declare_war_on, *ally))", 0, "filter: zamiana argumentow"),
    (T, "if obligated_allies.is_empty() {", "if false {", 0, "filter: puste obowiazki zostaja"),
    (T, "    if !t.is_finite() {\n        return None;\n    }\n    if TRUCE_DURATION_OPTIONS", "    if TRUCE_DURATION_OPTIONS", 0, "normalize: usuniete is_finite (rownowazny?)"),
    (T, "if TRUCE_DURATION_OPTIONS.contains(&t) {", "if t > 0.0 {", 0, "normalize: dowolna dodatnia"),
    (T, "if !start_turn.is_finite() {\n        return None;", "if false {\n        return None;", 0, "untilTurn: brak guardu start"),
    (T, "Some(start_turn + d)", "Some(start_turn - d)", 0, "untilTurn: start - d"),
    (T, "Some(u) if u.is_finite() && current_turn >= u => TruceExpiryAction::RevertToWar,", "Some(u) if u.is_finite() && current_turn > u => TruceExpiryAction::RevertToWar,", 0, "expiry: >= -> >"),
    (T, "Some(u) if u.is_finite() && current_turn >= u => TruceExpiryAction::RevertToWar,", "Some(u) if current_turn >= u => TruceExpiryAction::RevertToWar,", 0, "expiry: brak guardu finite"),
    (T, "is_truce_active(until, current_turn)\n}", "!is_truce_active(until, current_turn)\n}", 0, "breach: negacja"),
    (T, "let key = pair.first()?.as_str()?.to_string();", "let key = String::new();", 0, "odczyt: pusty klucz"),
    (T, "#[serde(default, skip_serializing_if = \"Option::is_none\")]\n    pub truce_until_turn: Option<f64>,", "#[serde(default, skip)]\n    pub truce_until_turn: Option<f64>,", 0, "serde: truceUntilTurn pomijany"),
    (G, "[&str; 3] = [\"pokoj\", \"rozejm\", \"trybut_oferta\"];", "[&str; 3] = [\"pokoj\", \"rozejmx\", \"trybut_oferta\"];", 0, "gate: brak rozejm"),
    (G, "if p.gold_once.unwrap_or(0.0) > 0.0 {", "if p.gold_once.unwrap_or(0.0) >= 0.0 {", 0, "gate: goldOnce >= 0"),
    (G, "if p.gold_per_turn.unwrap_or(0.0) > 0.0 {", "if p.gold_per_turn.unwrap_or(0.0) >= 0.0 {", 0, "gate: goldPerTurn >= 0"),
    (G, "i.typ == \"zloto\" || i.typ == \"praca\"", "i.typ == \"zloto\" && i.typ == \"praca\"", 0, "gate: zloto && praca"),
    (G, "i.typ == \"zloto\" || i.typ == \"praca\"", "i.typ == \"zloto\"", 0, "gate: bez praca"),
    (G, "Some(v) if v.is_empty() => false,", "Some(v) if v.is_empty() => true,", 0, "gate: pusty koszyk = platnosc"),
    (G, "if !at_war.unwrap_or(true) {", "if !at_war.unwrap_or(false) {", 0, "gate: domyslne atWar false"),
    (G, "    !is_peace_currency_action(action_id)\n}", "    is_peace_currency_action(action_id)\n}", 0, "gate: brak negacji pokoju"),
    (G, "pub fn is_nap_blocking_war_declaration(has_active_nap_treaty: bool) -> bool {\n    has_active_nap_treaty", "pub fn is_nap_blocking_war_declaration(has_active_nap_treaty: bool) -> bool {\n    !has_active_nap_treaty", 0, "nap: negacja"),
    (W, "DEFAULT_MIN_RATIO_HONOR: f64 = 0.55;", "DEFAULT_MIN_RATIO_HONOR: f64 = 0.5;", 0, "honor: 0.55 -> 0.5"),
    (W, "DEFAULT_MIN_RATIO_HONOR_PEACEFUL: f64 = 0.75;", "DEFAULT_MIN_RATIO_HONOR_PEACEFUL: f64 = 0.7;", 0, "honor: 0.75 -> 0.7"),
    (W, "DEFAULT_MAX_WARS_BEFORE_REFUSE: f64 = 1.0;", "DEFAULT_MAX_WARS_BEFORE_REFUSE: f64 = 2.0;", 0, "honor: max wojen 1 -> 2"),
    (W, "DEFAULT_MIN_TRUST_HONOR: f64 = 20.0;", "DEFAULT_MIN_TRUST_HONOR: f64 = 19.0;", 0, "honor: zaufanie 20 -> 19"),
    (W, "if inp.ally_id == 0.0 {", "if inp.ally_id != 0.0 {", 0, "honor: gracz"),
    (W, "if inp.active_war_count >= max_wars {", "if inp.active_war_count > max_wars {", 0, "honor: >= -> >"),
    (W, "if inp.peaceful_archetype && inp.military_ratio < min_peaceful {", "if inp.peaceful_archetype || inp.military_ratio < min_peaceful {", 0, "honor: && -> ||"),
    (W, "if inp.peaceful_archetype && inp.military_ratio < min_peaceful {", "if inp.peaceful_archetype && inp.military_ratio <= min_peaceful {", 0, "honor: peaceful < -> <="),
    (W, "if inp.military_ratio < min_ratio {", "if inp.military_ratio <= min_ratio {", 0, "honor: ratio < -> <="),
    (W, "if trust < min_trust {", "if trust <= min_trust {", 0, "honor: trust < -> <="),
    (W, "if let Some(trust) = inp.trust_to_requesting_ally {", "if let Some(trust) = inp.trust_to_requesting_ally.or(Some(f64::MAX)) {", 0, "honor: brak trust = pominiecie nie dziala"),
    (W, "if deal.kind != TreatyKind::FullAlliance {\n                    continue;", "if deal.kind == TreatyKind::FullAlliance {\n                    continue;", 0, "oblig: declared_war tylko pelny - odwrocone"),
    (W, "if deal.kind != TreatyKind::FullAlliance {\n                    continue;", "if false {\n                    continue;", 0, "oblig: declared_war takze defensywny"),
    (W, "if deal.kind != TreatyKind::DefensiveAlliance\n                    && deal.kind != TreatyKind::FullAlliance\n                {\n                    continue;\n                }", "", 0, "oblig: martwy kontrolny kind (rownowazny)"),
    (W, "if !deal.kind.is_alliance() {", "if deal.kind.is_alliance() {", 0, "oblig: tylko nie-sojusze"),
    (W, "victim_owner_id: target_owner_id,\n            aggressor_owner_id: declarer_owner_id,", "victim_owner_id: declarer_owner_id,\n            aggressor_owner_id: target_owner_id,", 0, "forDecl: zamiana ofiary i agresora"),
    (W, "    if !joined.contains(ally) {", "    if joined.contains(ally) {", 0, "refusal: bez negacji"),
    (W, "if seen.insert(tid.as_str()) {", "if true {", 0, "refusal: bez deduplikacji"),
    (W, "            | TreatyKind::Exchange\n    )", "    )", 0, "break: bez Exchange"),
    (W, "            | TreatyKind::Exchange\n    )", "            | TreatyKind::Exchange\n            | TreatyKind::Vassalization\n    )", 0, "break: z Vassalization"),
    (W, "            | TreatyKind::BarbarianCooperation\n", "", 0, "break: bez BarbarianCooperation"),
    (W, "must_declare_war_on == attacker_id", "must_declare_war_on != attacker_id", 0, "defensive: ==  -> !="),
    (W, "state.iter().filter(|d| d.parties == pair).collect()", "state.iter().filter(|d| d.parties != pair).collect()", 0, "dealsForPair: != "),
    (A, "cause == WarCause::BezPowodu", "cause != WarCause::BezPowodu", 0, "daje: =="),
    (A, "    if input.hamulec {\n        return WarCause::Hamulec;\n    }\n    if input.wymuszona_epoka {\n        return WarCause::WymuszonaEpoka;\n    }", "    if input.wymuszona_epoka {\n        return WarCause::WymuszonaEpoka;\n    }\n    if input.hamulec {\n        return WarCause::Hamulec;\n    }", 0, "przyczyna: hamulec/epoka zamienione"),
    (A, "    if input.zlamanie_rozejmu {\n        return WarCause::BezPowodu;\n    }\n", "", 0, "przyczyna: bez zlamania rozejmu"),
    (A, "    if input.wymuszona_inna {\n        return WarCause::WymuszonaInna;\n    }\n    if input.zlamanie_rozejmu", "    if input.zlamanie_rozejmu {\n        return WarCause::BezPowodu;\n    }\n    if input.wymuszona_inna {\n        return WarCause::WymuszonaInna;\n    }\n    if input.zlamanie_rozejmu", 0, "przyczyna: zlamanie przed wymuszona_inna"),
    (A, "    if input.casus_belli_aktywny {\n        return WarCause::CasusBelli;\n    }", "    if !input.casus_belli_aktywny {\n        return WarCause::CasusBelli;\n    }", 0, "przyczyna: casus negacja"),
    (A, "if !czy_daje_flage_agresora(cause) {", "if czy_daje_flage_agresora(cause) {", 0, "ustawFlage: negacja przyczyny"),
    (A, "if !turn.is_finite() || !owner_id.is_finite() {", "if !turn.is_finite() && !owner_id.is_finite() {", 0, "ustawFlage: || -> &&"),
    (A, "let do_tury = turn + params.flaga_agresora.trwa_tur;", "let do_tury = turn - params.flaga_agresora.trwa_tur;", 0, "ustawFlage: turn - trwa"),
    (A, "        if *prev >= do_tury {\n            return state.clone();\n        }\n    }\n    let mut next = state.clone();\n    next.insert(key, do_tury);\n    next\n}\n\n/// Web: `czyAgresor`", "        if *prev > do_tury {\n            return state.clone();\n        }\n    }\n    let mut next = state.clone();\n    next.insert(key, do_tury);\n    next\n}\n\n/// Web: `czyAgresor`", 0, "ustawFlage: prev >= -> >"),
    (A, "    turn < *do_tury\n}\n\n/// Web: `mnoznikWillingnessAlly`", "    turn <= *do_tury\n}\n\n/// Web: `mnoznikWillingnessAlly`", 0, "czyAgresor: < -> <="),
    (A, "if !do_tury.is_finite() || !turn.is_finite() {\n        return false;\n    }\n    turn < *do_tury\n}\n\n/// Web: `mnoznikWillingnessAlly`", "if !turn.is_finite() {\n        return false;\n    }\n    turn < *do_tury\n}\n\n/// Web: `mnoznikWillingnessAlly`", 0, "czyAgresor: brak guardu doTury"),
    (A, "        params.wplyw_na_ai.willingness_ally_mnoznik\n    } else {\n        1.0", "        params.wplyw_na_ai.willingness_ally_mnoznik\n    } else {\n        0.0", 0, "mnoznik: else 0"),
    (A, "        params.wplyw_na_ai.relacja_delta_sojusz\n    } else {\n        0.0", "        params.wplyw_na_ai.relacja_delta_sojusz\n    } else {\n        1.0", 0, "delta: else 1"),
    (A, "\"{}>{}\",", "\"{}-{}\",", 0, "klucz casus: separator"),
    (A, "if requester == target {", "if requester != target {", 0, "casus: requester == target"),
    (A, "if !requester.is_finite() || !target.is_finite() || !turn.is_finite() {", "if !requester.is_finite() && !target.is_finite() && !turn.is_finite() {", 0, "casus: guard || -> &&"),
    (A, "let do_tury = turn + params.casus_belli.trwa_tur;", "let do_tury = turn + params.flaga_agresora.trwa_tur;", 0, "casus: trwa z flagi"),
    (A, "    turn < *do_tury\n}\n\n/// Web: `serializujMape`", "    turn <= *do_tury\n}\n\n/// Web: `serializujMape`", 0, "maCasus: < -> <="),
    (A, ".filter(|(_, v)| v.is_finite())", ".filter(|(_, _v)| true)", 0, "serializuj: bez filtra"),
    (A, "n.as_f64().filter(|f| f.is_finite())", "n.as_f64().filter(|f| *f > 0.0)", 0, "wczytaj: tylko dodatnie"),
    (A, "let Some(obj) = raw.as_object() else {\n        return TurnMap::new();\n    };", "let Some(obj) = raw.as_object().or(raw.as_array().map(|_| unreachable!())) else {\n        return TurnMap::new();\n    };", 0, "wczytaj: tablica nie odrzucana (panic)"),
    (A, "        if !self.czy_agresor_aktywny(owner_id, turn) {\n            return None;", "        if self.czy_agresor_aktywny(owner_id, turn) {\n            return None;", 0, "doTury: negacja"),
    (A, "        self.casus_belli_until_by_pair.clear();\n    }", "    }", 0, "reset: bez czyszczenia casus"),
    (A, "        self.aggressor_flag_until_by_owner.clear();\n", "", 0, "reset: bez czyszczenia flag"),
    (A, "\"casusBelliUntilByPair\".to_string(),", "\"casusBelliUntilByPairX\".to_string(),", 0, "zapis: nazwa pola casus"),
    (A, "\"aggressorFlagUntilByOwner\".to_string(),", "\"aggressorFlagUntilByOwnerX\".to_string(),", 0, "zapis: nazwa pola flagi"),
    (A, "x == 0.0 {\n        return \"0\".to_string();", "x == 1.0 {\n        return \"0\".to_string();", 0, "js_num: zero"),
    (A, "(1e-6..1e21).contains(&a)", "(1e-6..1e20).contains(&a)", 0, "js_num: zakres 1e21"),
    (A, "Some((m, e)) if !e.starts_with('-') => format!(\"{m}e+{e}\"),", "Some((m, e)) if e.starts_with('-') => format!(\"{m}e+{e}\"),", 0, "js_num: plus wykladnika"),
    ("data/derived/diplomacy-aggressor-params.json", "\"trwaTur\": 20", "\"trwaTur\": 21", 0, "dane: flaga 20 -> 21"),
    ("data/derived/diplomacy-aggressor-params.json", "\"trwaTur\": 15", "\"trwaTur\": 16", 0, "dane: casus 15 -> 16"),
    ("data/derived/diplomacy-aggressor-params.json", "\"willingnessAllyMnoznik\": 0.7", "\"willingnessAllyMnoznik\": 0.8", 0, "dane: mnoznik 0.7 -> 0.8"),
]

env = dict(os.environ)
env.update(CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
env.setdefault("CARGO_TARGET_DIR", "/dev/shm/p6dypl1-mut")


def apply(src, old, new, nth):
    idx = -1
    for _ in range(nth + 1):
        idx = src.find(old, idx + 1)
        if idx < 0:
            return None
    return src[:idx] + new + src[idx + len(old):]


for i in range(LO, min(HI, len(M))):
    f, old, new, nth, desc = M[i]
    path = os.path.join(ENGINE, f)
    orig = open(path, encoding="utf-8").read()
    mutated = apply(orig, old, new, nth)
    if mutated is None:
        print(f"{i} NOT_APPLIED {f} :: {desc}", flush=True)
        continue
    try:
        open(path, "w", encoding="utf-8").write(mutated)
        r = subprocess.run(["cargo", "test", "-j", "2", "--test", "p6_dyplomacja_truce_aggressor"], cwd=ENGINE, env=env,
                           capture_output=True, text=True, timeout=900)
        txt = r.stdout + r.stderr
        if r.returncode == 0:
            res = "SURVIVED"
        elif "could not compile" in txt or "error[E" in txt or "error: " in txt and "test result" not in txt:
            res = "COMPILE_ERR"
        else:
            res = "KILLED"
    finally:
        open(path, "w", encoding="utf-8").write(orig)
    print(f"{i} {res} {f} :: {desc}", flush=True)
