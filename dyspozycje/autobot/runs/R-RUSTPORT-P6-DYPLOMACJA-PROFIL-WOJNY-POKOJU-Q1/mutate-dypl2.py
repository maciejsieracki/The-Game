#!/usr/bin/env python3
"""Mutacje R-RUSTPORT-P6-DYPLOMACJA-PROFIL-WOJNY-POKOJU-Q1: kazda mutacja = jedna zamiana tekstu w
`diplomacy_war_peace_profile.rs`; ZABITA, gdy `cargo test --test p6_dyplomacja_profil_wojny_pokoju`
NIE przechodzi (blad kompilacji liczony osobno jako COMPILE i NIE zaliczany do zabitych).
Uzycie: mutate-dypl2.py <ENGINE_DIR> <TARGET_DIR> <START> <END>   (zakres indeksow, START wlacznie, END wylacznie)
"""
import subprocess, sys, os

engine, target, start, end = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
F = os.path.join(engine, "src/domain/diplomacy_war_peace_profile.rs")

MUT = [
    # --- zdrowie ai / dane ---
    ("Some(v) if v.is_finite() => v,", "Some(v) => v,", "zdrowie: brak filtra is_finite"),
    ("_ => params.prog_zdrowia.baza,\n    }\n}", "_ => 0.4,\n    }\n}", "zdrowie: fallback stala 0.4 zamiast baza z params"),
    # --- find_matrix_row / klucz ---
    ("let key = civ_key.to_lowercase();", "let key = civ_key.to_string();", "find: bez lowercase klucza"),
    ("c.ikona_id.to_lowercase() == key", "c.ikona_id == key", "find: ikona bez lowercase"),
    ("|| c.cywilizacja.to_lowercase() == key", "|| false", "find: brak dopasowania po Cywilizacja"),
    ("c.typ_cywilizacji.to_lowercase() == key", "false", "find: brak dopasowania po typie"),
    ("Some(k) if !k.is_empty() => find_matrix_row(rows, k),", "Some(k) => find_matrix_row(rows, k),", "resolve: pusty klucz szuka wiersza"),
    ("js_min(hi, js_max(lo, v))", "js_max(lo, js_min(hi, v))", "clamp: odwrocona kolejnosc min/max"),
    # --- profil bez danych ---
    ("has_data: false,", "has_data: true,", "brak danych: has_data=true"),
    ("agresywnosc: 5.0,\n                ekspansywnosc", "agresywnosc: 4.0,\n                ekspansywnosc", "brak danych: agresywnosc 4"),
    ("ekspansywnosc: 3.0,\n                sklonnosc_podboju: 2.0,\n                tolerancja_ryzyka", "ekspansywnosc: 2.0,\n                sklonnosc_podboju: 2.0,\n                tolerancja_ryzyka", "brak danych: ekspansywnosc 2"),
    ("sklonnosc_podboju: 2.0,\n                tolerancja_ryzyka", "sklonnosc_podboju: 3.0,\n                tolerancja_ryzyka", "brak danych: podboj 3"),
    ("tolerancja_ryzyka: 5.0,\n                prog_wojny_macierz", "tolerancja_ryzyka: 4.0,\n                prog_wojny_macierz", "brak danych: tolerancja 4"),
    ("prog_wojny_macierz: 5.0,\n                profil_obronny", "prog_wojny_macierz: 4.0,\n                profil_obronny", "brak danych: dipProg 4"),
    ("params.prog_wojny_relacji.baza_brak_danych", "params.prog_wojny_relacji.baza", "brak danych: prog wojny = baza"),
    ("params.prog_pokoj_slabosc.baza_brak_danych", "params.prog_pokoj_slabosc.baza", "brak danych: prog pokoju = baza"),
    ("params.prog_krytyczny.baza_brak_danych", "params.prog_krytyczny.baza", "brak danych: krytyczny = baza"),
    ("params.min_tur_wojny.baza_brak_danych", "params.min_tur_wojny.baza", "brak danych: minTur = baza"),
    ("params.zmeczenie.baza_tur_brak_danych", "params.zmeczenie.maks_tur", "brak danych: zmeczenie T = maksTur"),
    ("params.hamulec_relacji.waga_prog_wojny * 5.0", "params.hamulec_relacji.waga_prog_wojny * 4.0", "brak danych: hamulec dip=4"),
    ("                prog_zdrowia: zdrowie_baza,", "                prog_zdrowia: params.prog_zdrowia.baza_brak_danych,", "brak danych: zdrowie bez ai-params"),
    # --- domyslne parametry wiersza ---
    ('get("dip_prog_wojny", 5.0)', 'get("dip_prog_wojny", 4.0)', "domyslna dip_prog_wojny 4"),
    ('get("ai_agresywnosc", 5.0)', 'get("ai_agresywnosc", 4.0)', "domyslna agresywnosc 4"),
    ('get("ai_ekspansywnosc", 3.0)', 'get("ai_ekspansywnosc", 4.0)', "domyslna ekspansywnosc 4"),
    ('get("ai_sklonnosc_podboju", 2.0)', 'get("ai_sklonnosc_podboju", 3.0)', "domyslny podboj 3"),
    ('get("ai_tolerancja_ryzyka", 5.0)', 'get("ai_tolerancja_ryzyka", 4.0)', "domyslna tolerancja 4"),
    ('get("ai_profil_obronna", 0.0) == 1.0', 'get("ai_profil_obronna", 0.0) >= 1.0', "obronny: >= 1"),
    ('get("ai_profil_obronna", 0.0) == 1.0', 'get("ai_profil_obronna", 0.0) != 0.0', "obronny: != 0"),
    ('get("ai_profil_obronna", 0.0) == 1.0', 'get("ai_profil_obronna", 1.0) == 1.0', "obronny: domyslnie 1"),
    # --- progWojnyRelacji ---
    ("+ w.waga_prog_wojny * dip_prog", "+ w.waga_prog_wojny * agr", "prog wojny: dip -> agr"),
    ("+ w.waga_ekspansja * (eks - w.ekspansja_srodek)", "+ w.waga_ekspansja * (eks + w.ekspansja_srodek)", "prog wojny: eks srodek +"),
    ("+ w.waga_podboj * (pod - w.podboj_srodek),", "- w.waga_podboj * (pod - w.podboj_srodek),", "prog wojny: podboj znak"),
    # --- progPokojSlabosc ---
    ("s.baza - s.waga_agresja * (agr - s.agresja_srodek)", "s.baza + s.waga_agresja * (agr - s.agresja_srodek)", "prog pokoju: znak agresji"),
    ("s.premia_profil_obronny\n            } else {\n                0.0\n            }),\n        s.min,", "-s.premia_profil_obronny\n            } else {\n                0.0\n            }),\n        s.min,", "prog pokoju: znak premii obronnej"),
    ("+ (if obronny {\n                s.premia_profil_obronny", "+ (if !obronny {\n                s.premia_profil_obronny", "prog pokoju: premia dla nieobronnych"),
    # --- progKrytyczny / zdrowia ---
    ("k.baza - k.waga_agresja * (agr - k.agresja_srodek)", "k.baza - k.waga_agresja * (agr + k.agresja_srodek)", "krytyczny: srodek +"),
    ("zdrowie_baza - z.waga_tolerancja * (risk - z.tolerancja_srodek)", "zdrowie_baza - z.waga_tolerancja * (agr - z.tolerancja_srodek)", "zdrowie: risk -> agr"),
    # --- minTurWojny ---
    ("if agr >= m.agresja_wysoka", "if agr > m.agresja_wysoka", "minTur: >= -> >"),
    ("if agr <= m.agresja_niska", "if agr < m.agresja_niska", "minTur: <= -> <"),
    ("(if obronny { m.kara_profil_obronny } else { 0.0 })", "0.0", "minTur: brak kary obronnej"),
    ("let min_tur_wojny = js_math_round(clamp_num(", "let min_tur_wojny = (clamp_num(", "minTur: brak Math.round"),
    # --- zmeczenie T / hamulec ---
    ("js_min(t.maks_tur, t.baza_tur + t.waga_agresja * agr)", "t.baza_tur + t.waga_agresja * agr", "zmeczenieT: brak min z maksTur"),
    ("js_math_round(h.baza_n - h.waga_prog_wojny * dip_prog)", "(h.baza_n - h.waga_prog_wojny * dip_prog).round()", "hamulecN: round() Rust zamiast Math.round"),
    ("js_math_round(h.baza_n - h.waga_prog_wojny * dip_prog)", "(h.baza_n - h.waga_prog_wojny * dip_prog)", "hamulecN: brak zaokraglenia"),
    # --- zmeczenie ---
    ("if turns_at_war.is_finite() {", "if true {", "frakcja: brak filtra is_finite"),
    ("|| turns <= 0.0 {", "|| turns < 0.0 {", "frakcja: turns<=0 -> <0"),
    ("if !(zmeczenie_t > 0.0)", "if !(zmeczenie_t >= 0.0)", "frakcja: T>0 -> T>=0"),
    ("js_min(1.0, turns / zmeczenie_t)", "turns / zmeczenie_t", "frakcja: brak min(1)"),
    ("max_share * war_weariness_fraction(turns_at_war, zmeczenie_t)", "war_weariness_fraction(turns_at_war, zmeczenie_t)", "share: brak maksUdzial"),
    # --- rejestr ---
    ("Some(p) if p.od == od => p.utraty.clone(),", "Some(p) => p.utraty.clone(),", "loss: rekord z innej wojny nie jest resetowany"),
    ("utraty.insert(old_owner_key.to_string(), cur + 1.0);", "utraty.insert(old_owner_key.to_string(), cur + 2.0);", "loss: +2"),
    ("ostatnia_tura: Some(turn),", "ostatnia_tura: None,", "loss: brak ostatniaTura"),
    ("Some(r) if r.od == od => Some(r),", "Some(r) => Some(r),", "state: rekord z innej wojny ignorowany"),
    ("turns_at_war: js_max(0.0, turn - od),", "turns_at_war: turn - od,", "state: brak max(0, .) dla tur wojny"),
    ("turn - valid.and_then(|v| v.ostatnia_tura).unwrap_or(od),", "turn - od,", "state: since bez ostatniaTura"),
    ("params.hamulec_relacji.prog_kryzysu_minus_punkty\n}", "params.hamulec_relacji.prog_kryzysu_minus_punkty + 1.0\n}", "brake: prog +1"),
    # --- sygnaly ---
    ("if input.rw <= profile.prog_pokoj_slabosc {", "if input.rw < profile.prog_pokoj_slabosc {", "sygnal a: <= -> <"),
    ("input.lost_cities_in_war >= 1.0 && input.rw <= s.prog_rw_miasta", "input.lost_cities_in_war > 1.0 && input.rw <= s.prog_rw_miasta", "sygnal b: >=1 -> >1"),
    ("input.lost_cities_in_war >= 1.0 && input.rw <= s.prog_rw_miasta", "input.lost_cities_in_war >= 1.0 && input.rw < s.prog_rw_miasta", "sygnal b: rw <= -> <"),
    ("input.turns_at_war >= s.pat_tur_wojny && since_change >= s.pat_brak_zmiany_tur", "input.turns_at_war > s.pat_tur_wojny && since_change >= s.pat_brak_zmiany_tur", "sygnal d: turns >= -> >"),
    ("input.turns_at_war >= s.pat_tur_wojny && since_change >= s.pat_brak_zmiany_tur", "input.turns_at_war >= s.pat_tur_wojny && since_change > s.pat_brak_zmiany_tur", "sygnal d: since >= -> >"),
    ("input.turns_since_city_change.unwrap_or(input.turns_at_war)", "input.turns_since_city_change.unwrap_or(0.0)", "sygnal d: fallback since = 0"),
    ("        >= params.zmeczenie.prog_sygnalu_pokoju", "        > params.zmeczenie.prog_sygnalu_pokoju", "sygnal e: >= -> >"),
    ("if h < profile.prog_zdrowia {", "if h <= profile.prog_zdrowia {", "sygnal c: < -> <="),
    ("reasons.push(\"c\");", "reasons.push(\"e\");", "sygnal c: zly powod"),
    # --- ceny ---
    ("if rw >= c.prog_sily_wysoki {", "if rw > c.prog_sily_wysoki {", "sila: >= -> >"),
    ("return js_min(c.max_mnoznik_sily, 1.0 + c.waga_sily * (rw - 0.5));", "return js_min(c.max_mnoznik_sily, 1.0 + c.waga_sily * (rw - 0.55));", "sila: srodek 0.55"),
    ("if rw <= c.prog_sily_niski {", "if rw < c.prog_sily_niski {", "sila: <= -> <"),
    ("+ c.waga_podboj * (profile.sklonnosc_podboju - c.podboj_srodek);", "+ c.waga_podboj * (profile.sklonnosc_podboju + c.podboj_srodek);", "cyw: podboj srodek +"),
    ("c.waga_agresja * (profile.agresywnosc - c.agresja_srodek)", "c.waga_agresja * (profile.agresywnosc + c.agresja_srodek)", "cyw: agresja srodek +"),
    # --- bramka ---
    ("input.rw >= c.odrzucenie_rw_prog", "input.rw > c.odrzucenie_rw_prog", "silniejsze: rw >= -> >"),
    ("&& input.lost_cities_in_war == 0.0", "&& input.lost_cities_in_war <= 0.0", "silniejsze: lost==0 -> <=0"),
    ("&& js_max(0.0, input.turns_at_war) < c.odrzucenie_max_tur_wojny", "&& js_max(0.0, input.turns_at_war) <= c.odrzucenie_max_tur_wojny", "silniejsze: < -> <="),
    ("if turns < min_tur {", "if turns <= min_tur {", "bramka: turns < min -> <="),
    ("if turns >= c.tury_bez_ograniczen_ai {", "if turns > c.tury_bez_ograniczen_ai {", "bramka: >= 20 -> > 20"),
    ("price_multiplier: js_min(1.0, peace_civ_price_multiplier(profile, params)),", "price_multiplier: peace_civ_price_multiplier(profile, params),", "bramka: brak min(1) po 20 turach"),
    ("* peace_civ_price_multiplier(profile, params),\n    }", "+ peace_civ_price_multiplier(profile, params),\n    }", "bramka: mnoznik + zamiast *"),
    ("AI wymaga co najmniej {} tur wojny", "AI wymaga co najmniej {} tur wojny.", "bramka: komunikat too_early"),
    ("js_number_to_string(turns)", "turns.to_string()", "bramka: Display Rust zamiast Number->String"),
    # --- rdzenie main.ts ---
    ("if u.owner_id != owner_id || u.civilian {", "if u.owner_id != owner_id {", "army: cywilni liczeni"),
    ("if u.owner_id != owner_id || u.civilian {", "if u.civilian {", "army: bez filtra wlasciciela"),
    ("hp += js_max(0.0, js_min(m, u.hp.unwrap_or(m)));", "hp += js_min(m, u.hp.unwrap_or(m));", "army: brak max(0,hp)"),
    ("hp += js_max(0.0, js_min(m, u.hp.unwrap_or(m)));", "hp += js_max(0.0, u.hp.unwrap_or(m));", "army: brak min(m,hp)"),
    ("if !(m > 0.0) {", "if !(m >= 0.0) {", "army: m>0 -> m>=0"),
    ("    if max > 0.0 {\n        Some(hp / max)", "    if max >= 0.0 {\n        Some(hp / max)", "army: max>0 -> >=0"),
    ("    let od = war_start_stamp.unwrap_or(turn);", "    let od = turn;", "wsf: stempel ignorowany"),
    ("            None,\n        );\n    }\n    let od", "            Some(0.0),\n        );\n    }\n    let od", "wsf: poza wojna zostaje stempel"),
    ("    let army_health_share = if s.turns_at_war > 0.0 {", "    let army_health_share = if s.turns_at_war >= 0.0 {", "rel: > 0 -> >= 0"),
    ("    if !at_war {\n        return None;", "    if at_war {\n        return None;", "pws: odwrocony at_war"),
    ("let higher = if pa.prog_wojny_relacji >= pb.prog_wojny_relacji {", "let higher = if pa.prog_wojny_relacji > pb.prog_wojny_relacji {", "brake params: >= -> >"),
    ("        higher.hamulec_n,\n    )", "        pa.hamulec_n,\n    )", "brake params: N zawsze od strony a"),
]


def run(args):
    return subprocess.run(args, cwd=engine, capture_output=True, text=True,
                          env={**os.environ, "CARGO_TARGET_DIR": target, "CARGO_INCREMENTAL": "0",
                               "CARGO_PROFILE_DEV_DEBUG": "0", "CARGO_PROFILE_TEST_DEBUG": "0"})


if end > len(MUT):
    end = len(MUT)
print(f"# mutacji w liscie: {len(MUT)}", flush=True)
for i in range(start, end):
    a, b, desc = MUT[i]
    src = open(F, encoding="utf-8").read()
    c = src.count(a)
    if c != 1:
        print(f"[{i:02d}] BLAD-KOTWICY ({c}x) {desc}", flush=True)
        continue
    open(F, "w", encoding="utf-8").write(src.replace(a, b))
    try:
        r = run(["cargo", "test", "-j", "2", "--test", "p6_dyplomacja_profil_wojny_pokoju"])
        out = r.stdout + r.stderr
        if r.returncode == 0:
            verdict = "PRZEZYLA"
        elif "error[E" in out or "error: could not compile" in out:
            verdict = "COMPILE"
        else:
            verdict = "ZABITA"
    finally:
        open(F, "w", encoding="utf-8").write(src)
    print(f"[{i:02d}] {verdict:9s} {desc}", flush=True)
