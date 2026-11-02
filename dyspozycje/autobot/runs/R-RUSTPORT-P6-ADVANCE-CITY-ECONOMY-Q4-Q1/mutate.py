"""Mutacje modulu turn_economy_loop.rs (python3 -I mutate.py check | <od> <do> | ids i,j,k).
Kazda mutacja: dokladnie 1 wystapienie `old` -> `new`, `cargo test --test p6_adv_q4_pipeline`,
KILLED gdy test pada, COMPILE gdy sie nie kompiluje (nie liczone), SURVIVED gdy zielono.
Plik zawsze przywracany. Flaga 'EKW' = oczekiwany mutant rownowazny (dowod plik:linia w P6-ADVANCE-CITY-ECONOMY-Q4.md sek. 6).
"""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_34613405-855-1'
F = REPO + '/rust-port/engine/src/domain/turn_economy_loop.rs'
RUN = REPO + '/dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1'
I8 = ' ' * 8
I12 = ' ' * 12
I16 = ' ' * 16

M = [
    ('L01-order-prod-eq', 'if m.production_mult != 1.0 {', 'if m.production_mult == 1.0 {', ''),
    ('L02-order-prod-assign', 'yld.praca *= m.production_mult;', 'yld.praca = m.production_mult;', ''),
    ('L03-order-pien-wrong-field', 'yld.pieniadz *= m.pieniadz_mult;', 'yld.pieniadz *= m.nauka_mult;', ''),
    ('L04-order-nauka-wrong-field', 'yld.nauka *= m.nauka_mult;', 'yld.nauka *= m.kultura_mult;', ''),
    ('L05-order-kultura-wrong-field', 'yld.kultura *= m.kultura_mult;', 'yld.kultura *= m.pieniadz_mult;', ''),
    ('L06-truthy-nan', 'x != 0.0 && !x.is_nan()', 'x != 0.0', ''),
    ('L07-wonder-pieniadz-sign', 'yld.pieniadz += b.pieniadz;', 'yld.pieniadz -= b.pieniadz;', ''),
    ('L08-wonder-zywnosc-sign', 'yld.zywnosc += b.zywnosc;', 'yld.zywnosc -= b.zywnosc;', ''),
    ('L09-wonder-nauka-sign', 'yld.nauka += b.nauka;', 'yld.nauka -= b.nauka;', ''),
    ('L10-wonder-kultura-sign', 'yld.kultura += b.kultura;', 'yld.kultura -= b.kultura;', ''),
    ('L11-wonder-praca-sign', 'yld.praca += b.praca;', 'yld.praca -= b.praca;', ''),
    ('L12-capital-last-wins', 'capital.entry(c.owner_id).or_insert((c.q, c.r));', 'capital.insert(c.owner_id, (c.q, c.r));', ''),
    ('L13-count-plus2', '*count.entry(c.owner_id).or_insert(0.0) += 1.0;', '*count.entry(c.owner_id).or_insert(0.0) += 2.0;', ''),
    ('L14-hex-ds-zero', 'let ds = ((-aq - ar) - (-bq - br)).abs();', 'let ds = 0.0;', ''),
    ('L15-hex-no-ds-max', 'dq.max(dr).max(ds)', 'dq.max(dr)', ''),
    ('L16-hex-dr-zero', 'let dr = (ar - br).abs();', 'let dr = 0.0;', ''),
    ('L17-capital-inverted', 'let is_capital = !capital_seen.contains(&owner_id);', 'let is_capital = capital_seen.contains(&owner_id);', ''),
    ('L18-dist-args-swapped', 'hex_distance(cities[i].q, cities[i].r, cq, cr)', 'hex_distance(cities[i].q, cities[i].r, cr, cq)', ''),
    ('L19-count-fallback', '.get(&owner_id).copied().unwrap_or(1.0);', '.get(&owner_id).copied().unwrap_or(0.0);', 'EKW'),
    ('L20-strata-no-reduction', 'let strata_fraction = strata_bazowa * (1.0 - redukcja);', 'let strata_fraction = strata_bazowa;', ''),
    ('L21-reduction-runtime-ids', 'let built_refs: Vec<&str> = built_ids.iter().map(String::as_str).collect();', 'let built_refs: Vec<&str> = runtime.iter().map(String::as_str).collect();', 'EKW'),
    ('L22-corr-coeff-swapped', 'wspolczynnik_dystansu: params.korupcja_wspolczynnik_dystansu,', 'wspolczynnik_dystansu: params.korupcja_wspolczynnik_miast,', ''),
    ('L23-corr-cap-one', 'cap: params.korupcja_cap,', 'cap: 1.0,', ''),
    ('L24-handel-override-false', 'if city.podzial_handlu_override == Some(true) {', 'if city.podzial_handlu_override == Some(false) {', ''),
    ('L25-handel-owner-default-skipped', 'if let Some(d) = owner_default {', 'if let Some(d) = owner_default.filter(|_| false) {', ''),
    ('L26-handel-city-branch-skipped', '    if let Some(p) = city.podzial_handlu.as_ref() {\n        return normalize_podzial_handlu(p);\n    }\n    normalize_podzial_handlu(params_fallback)', '    normalize_podzial_handlu(params_fallback)', ''),
    ('L27-handel-fallback-field', 'procent_nauka: params.suwak_handel_nauka_default,', 'procent_nauka: params.suwak_handel_pieniadz,', ''),
    ('L28-pracy-fallback-teren', 'procent_budynki: params.suwak_praca_budynki,', 'procent_budynki: params.suwak_praca_teren,', ''),
    ('L29-pracy-owner-default-none', 'maps.owner_default_podzial_pracy_by_owner.get(&owner_id),', 'None,', ''),
    ('L30-handel-owner-default-none', 'maps.owner_default_podzial_handlu_by_owner.get(&owner_id),', 'None,', ''),
    ('L31-waluta-only-upper', 'owner_tech.contains("Waluta") || owner_tech.contains("waluta")', 'owner_tech.contains("Waluta")', ''),
    ('L32-waluta-and', 'owner_tech.contains("Waluta") || owner_tech.contains("waluta")', 'owner_tech.contains("Waluta") && owner_tech.contains("waluta")', ''),
    ('L33-mennica-no-zloto-gate', 'let ma_mennica = ma_mennica_built && zloto(owner_id);', 'let ma_mennica = ma_mennica_built;', ''),
    ('L34-tech-default-empty', 'None => input.player_zbadane.clone(),', 'None => BTreeSet::new(),', ''),
    ('L35-mlyn-false', 'ma_mlyn: has("mlyn"),', 'ma_mlyn: false,', ''),
    ('L36-cegielnia-false', 'ma_cegielnia: has("cegielnia"),', 'ma_cegielnia: false,', ''),
    ('L37-biblioteka-false', 'ma_biblioteka: has("biblioteka"),', 'ma_biblioteka: false,', ''),
    ('L38-akademia-false', 'ma_akademia: has("akademia"),', 'ma_akademia: false,', ''),
    ('L39-handel-mult-2', 'civ_handel_mult: Some(1.0),', 'civ_handel_mult: Some(2.0),', ''),
    ('L40-nauka-mult-2', 'civ_nauka_mult: Some(1.0),', 'civ_nauka_mult: Some(2.0),', ''),
    ('L41-premia-wrong-map', 'maps.trade_route_building_bonus_by_city\n', 'maps.trade_income_by_city\n', ''),
    ('L42-addtax-wrong-map', 'maps.manual_work_tax_by_city\n', 'maps.maritime_trade_income_by_city\n', ''),
    ('L43-garncarnie-zero', 'liczba_garncarni: Some(runtime.iter().filter(|x| *x == "garncarnia").count() as f64),', 'liczba_garncarni: Some(0.0),', ''),
    ('L44-wojsko-one', 'wojsko_zuzycie_zywnosci: 0.0,', 'wojsko_zuzycie_zywnosci: 1.0,', ''),
    ('L45-poborca-one', 'poborca_count: 0,', 'poborca_count: 1,', ''),
    ('L46-civ-key-none', 'civ_key: owner_civ_key,\n            ludnosc:', 'civ_key: None,\n            ludnosc:', ''),
    ('L47-ludnosc-plus1', 'ludnosc: cities[i].population,', 'ludnosc: cities[i].population + 1.0,', ''),
    ('L48-podzial-nauka-field', 'procent_nauka: podzial_handlu.procent_nauka,', 'procent_nauka: podzial_handlu.procent_pieniadz,', ''),
    ('L49-yield-ids-built', 'built_ids_for_spichlerz_yields(&runtime, &spichlerz_state)', 'built_ids_for_spichlerz_yields(built_ids, &spichlerz_state)', 'EKW'),
    ('L50-unlocked-none', 'Some(&unlocked)', 'None', 'EKW'),
    ('L51-epoka-wejscia-plus1', 'epoka_wejscia: b.epoka_wejscia as f64,', 'epoka_wejscia: b.epoka_wejscia as f64 + 1.0,', ''),
    ('L52-maks-poziom-one', 'maks_poziom: b.maks_poziom as f64,', 'maks_poziom: 1.0,', ''),
    ('L53-zadowolenie-zero', 'baza_zadowolenie: Some(b.baza.zadowolenie as f64),', 'baza_zadowolenie: Some(0.0),', 'EKW'),
    ('L54-baza-praca-wrong', 'praca: b.baza.praca as f64,', 'praca: b.baza.nauka as f64,', ''),
    ('L55-przyrost-pieniadz-wrong', 'pieniadz: b.przyrost.pieniadz as f64,', 'pieniadz: b.przyrost.praca as f64,', ''),
    ('L56-baza-nauka-wrong', 'nauka: b.baza.nauka as f64,', 'nauka: b.baza.kultura as f64,', ''),
    ('L57-praca-integer-removed', 'yld.praca = city_praca_integer(yld.praca);', 'yld.praca = yld.praca;', ''),
    ('L58-brutto-from-netto', 'let zywnosc_brutto = cy.zywnosc_brutto;', 'let zywnosc_brutto = cy.zywnosc;', ''),
    ('L59-food-spichlerz-none', 'Some(&growth_spichlerz),\n            owner_era,\n        );', 'None,\n            owner_era,\n        );', ''),
    ('L60-food-era-one', 'Some(&growth_spichlerz),\n            owner_era,\n        );', 'Some(&growth_spichlerz),\n            1.0,\n        );', ''),
    ('L61-wonder-wrong-owner', 'maps.wonder_city_yields_by_owner.get(&owner_id)', 'maps.wonder_city_yields_by_owner.get(&0)', ''),
    ('L62-order-lookup-none', 'if let Some(m) = maps.order_mult_by_city.get(&city_id) {', 'if let Some(m) = maps.order_mult_by_city.get(&city_id).filter(|_| false) {', ''),
    ('L63-wealth-civ-none', 'let wealth_civ_key = owner_civ_key;', 'let wealth_civ_key: Option<&str> = None;', ''),
    ('L64-wealth-cap-field', 'cap_na_epoke: wealth_base.cap_na_epoke,\n                    mnoznik_na_poziom', 'cap_na_epoke: wealth_base.prog_na_poziom,\n                    mnoznik_na_poziom', ''),
    ('L65-wealth-mn-unmodified', 'mnoznik_na_poziom: m.mnoznik_na_poziom,\n                ..wealth_base', 'mnoznik_na_poziom: wealth_base.mnoznik_na_poziom,\n                ..wealth_base', ''),
    ('L66-wealth-cap-unmodified', 'cap_na_epoke: m.cap_na_epoke,\n                mnoznik', 'cap_na_epoke: wealth_base.cap_na_epoke,\n                mnoznik', ''),
    ('L67-fresh-poziom-zero', 'poziom: f.poziom,\n                    pula: f.pula,', 'poziom: 0.0,\n                    pula: f.pula,', ''),
    ('L68-immunity-ge', '.wealth_immunity_remaining.unwrap_or(0.0) > 0.0;', '.wealth_immunity_remaining.unwrap_or(0.0) >= 0.0;', ''),
    ('L69-immunity-minpoziom2', 'if wealth_immunity { Some(1.0) } else { None },', 'if wealth_immunity { Some(2.0) } else { None },', ''),
    ('L70-immunity-no-clamp', 'Some(js_max(0.0, r - 1.0))', 'Some(r - 1.0)', 'EKW'),
    ('L71-immunity-not-decremented', '        if wealth_immunity {\n            if let Some(r)', '        if !wealth_immunity {\n            if let Some(r)', ''),
    ('L72-wealth-pula-not-saved', 'poziom: wt.poziom,\n            pula: wt.pula,\n        });', 'poziom: wt.poziom,\n            pula: 0.0,\n        });', ''),
    ('L73-po-wealth-ceil', 'let pieniadz_po_wealth = (yld.pieniadz * wt.mnoznik).floor();', 'let pieniadz_po_wealth = (yld.pieniadz * wt.mnoznik).ceil();', ''),
    ('L74-wealth-args-swapped', 'yld.luksus,\n            yld.pieniadz,\n            owner_era,', 'yld.pieniadz,\n            yld.luksus,\n            owner_era,', ''),
    ('L75-route-income-wrong-map', 'maps.trade_income_by_city\n', 'maps.maritime_trade_income_by_city\n', ''),
    ('L76-route-civ-none', 'owner_civ_key,\n        );\n        let split', 'None,\n        );\n        let split', ''),
    ('L77-split-udzial-inverted', 'split_praca(yld.praca, podzial_pracy.procent_budynki / 100.0)', 'split_praca(yld.praca, 1.0 - podzial_pracy.procent_budynki / 100.0)', ''),
    ('L78-procent-rozwoj-div5', '(poziom_racji / 6.0) * 100.0', '(poziom_racji / 5.0) * 100.0', ''),
    ('L79-siege-garn-neg', 'Some(g) if g > 0.0 => g,', 'Some(g) => g,', ''),
    ('L80-siege-no-garn', 'let zuzycie = cities[i].population + garnizon;', 'let zuzycie = cities[i].population;', ''),
    ('L81-siege-no-clamp', 'let po_turze = js_max(0.0, przed - zuzycie);', 'let po_turze = przed - zuzycie;', ''),
    ('L82-siege-glod-lt', 'let glod = po_turze <= 0.0;', 'let glod = po_turze < 0.0;', ''),
    ('L83-siege-food-not-saved', 'cities[i].magazyn_zywnosci = Some(FoodBuffer::Number(po_turze));', 'let _ = po_turze;', ''),
    ('L84-siege-food-none', 'read_city_food_buffer(econ_food_buffer(cities[i].magazyn_zywnosci))', 'read_city_food_buffer(econ_food_buffer(None))', ''),
    ('L85-food-legacy-other', 'Some(FoodBuffer::Legacy { aktualny }) => EconFoodBuffer::Obj { aktualny },', 'Some(FoodBuffer::Legacy { .. }) => EconFoodBuffer::Other,', ''),
    ('L86-food-number-other', 'Some(FoodBuffer::Number(v)) => EconFoodBuffer::Num(v),', 'Some(FoodBuffer::Number(_)) => EconFoodBuffer::Other,', ''),
    ('L87-siege-income-brutto', '*out.income_by_owner.entry(owner_id).or_insert(0.0) += tick.pieniadz;', '*out.income_by_owner.entry(owner_id).or_insert(0.0) += tick.pieniadz_brutto;', ''),
    ('L88-siege-pula-sum', '            out.total_praca_pula += split.do_puli;', '            out.total_praca_pula += split.do_budynkow;', ''),
    ('L89-siege-branch-inverted', 'if extra.oblegane {', 'if !extra.oblegane {', ''),
    ('L90-siege-glod-false', 'oblegany_glod: glod,', 'oblegany_glod: false,', ''),
    ('L91-siege-zywnosc-total', 'out.total_zywnosc += 0.0;', 'out.total_zywnosc += 1.0;', ''),
    ('L92-growth-szczescie-poziom', '                wt.zadowolenie,\n                garncarnia_zadowolenie > 0.0,', '                wt.poziom,\n                garncarnia_zadowolenie > 0.0,', ''),
    ('L93-growth-poziom-racji', 'poziom_racji: poziom_racji_bal,', 'poziom_racji: 0.0,', ''),
    ('L94-growth-zdrowie-zero', 'poziom_racji: poziom_racji_bal,\n            zdrowie,', 'poziom_racji: poziom_racji_bal,\n            zdrowie: 0.0,', ''),
    ('L95-growth-civ-none', 'civ_key: owner_civ_key.map(str::to_owned),', 'civ_key: None,', ''),
    ('L96-growth-difficulty-normal', 'difficulty: Some(growth_difficulty),', 'difficulty: Some(GameDifficulty::Normal),', ''),
    ('L97-growth-wealth-poziom', 'wealth_poziom: wt.poziom,', 'wealth_poziom: 0.0,', 'EKW'),
    ('L98-mp-civ-nonempty-filter', 'owner_civ_key.filter(|k| !k.is_empty());', 'owner_civ_key;', 'EKW'),
    ('L99-mp-input-none', 'manpower: extra.manpower,', 'manpower: None,', ''),
    ('L100-mp-init-inverted', 'if mp_city.manpower.is_none() {', 'if mp_city.manpower.is_some() {', ''),
    ('L101-mp-max-mult-one', 'owner_era,\n                mp_mults.max_mult,\n            ));', 'owner_era,\n                1.0,\n            ));', ''),
    ('L102-mp-regen-mult-one', '            mp_mults.regen_mult,\n            mp_mults.max_mult,\n        );', '            1.0,\n            mp_mults.max_mult,\n        );', ''),
    ('L103-mp-besieged-true', 'oblegane: Some(extra.oblegane),', 'oblegane: Some(true),', ''),
    ('L104-mp-not-saved', 'extras.entry(city_id.clone()).or_default().manpower = Some(new_mp);', 'let _ = new_mp;', ''),
    ('L105-magazyn-zero', 'let magazyn_po_turze = cities[i].wzrost_ulamkowy.unwrap_or(0.0);', 'let magazyn_po_turze = 0.0;', ''),
    ('L106-income-no-trasy', '*income = *income + pieniadz_po_wealth + pieniadz_z_tras;', '*income = *income + pieniadz_po_wealth;', ''),
    ('L107-total-zywnosc-brutto', 'out.total_zywnosc += bilans_lokalny;', 'out.total_zywnosc += zywnosc_brutto;', ''),
    ('L108-normal-pula-sum', '        out.total_praca_pula += split.do_puli;\n        out.per_city.push(tick);\n    }', '        out.total_praca_pula += split.do_budynkow;\n        out.per_city.push(tick);\n    }', ''),
    ('L109-normal-cities-plus2', '\n        out.cities += 1.0;', '\n        out.cities += 2.0;', ''),
    ('L110-wzrost-procent-field', 'wzrost_procent: Some(growth_preview.total),', 'wzrost_procent: Some(growth_preview.racje),', ''),
    ('L111-zywnosc-netto-brutto', 'zywnosc_netto: bilans_lokalny,', 'zywnosc_netto: zywnosc_brutto,', ''),
    ('L112-owner-era-one', 'let owner_era = owner_era_for(input, owner_id);', 'let owner_era = 1.0;', ''),
    ('L113-zdrowie-zero', 'let zdrowie = upkeep_health.zdrowie_by_city[i].1;', 'let zdrowie = 0.0;', ''),
    ('L114-spichlerz-ii-false', 'ma_spichlerz_ii_pop: view.ma_spichlerz_ii,', 'ma_spichlerz_ii_pop: false,', ''),
    ('L115-garncarnia-zero', 'let garncarnia_zadowolenie = view.garncarnia_surplus_zadowolenie;', 'let garncarnia_zadowolenie = 0.0;', ''),
    ('L116-wealth-difficulty-normal', 'wealth_difficulty(input.difficulty),', 'wealth_difficulty("normal"),', ''),
    ('L117-wealth-easy-hard', '"easy" => D::Easy,', '"easy" => D::Hard,', ''),
    ('L118-raw-wealth-easy', 'easy: cell("easy"),', 'easy: cell("normal"),', ''),
    ('L119-lost-sibling-none', 'terrain_inputs.lost_to_sibling_by_city.get(&city_id),', 'None,', ''),
    ('L120-nodes-empty', '            &territory_nodes,\n            terrain_inputs', '            &[],\n            terrain_inputs', ''),
    ('L121-center-hex-removed', '    if let Some(h) = map.hex(&key_of(city.q, city.r)) {\n        out.push(h);\n    }', '', ''),
    ('L122-pop-zero-not-early', 'if pop <= 0.0 {\n        return out;', 'if pop < 0.0 {\n        return out;', ''),
    ('L123-river-false', 'ma_rzeke: h.river_present,', 'ma_rzeke: false,', ''),
    ('L124-overlay-brak', 'nakladka: h.overlay.web_value(),', 'nakladka: "brak",', ''),
    ('L125-hills-key', 'TerrainType::Hills => "wzgorza",', 'TerrainType::Hills => "gory",', ''),
    ('L126-zloze-none', 'zloze: h.zloze.as_deref(),', 'zloze: None,', 'EKW'),
    ('L127-cegielnia-param', 'budynek_cegielni_bonus_pracy: p.budynek_cegielnia_bonus_pracy,', 'budynek_cegielni_bonus_pracy: p.budynek_mlyn_bonus_pracy,', ''),
    ('L128-biblioteka-param', 'biblioteka_bonus_nauki: p.budynek_biblioteka_bonus_nauki,', 'biblioteka_bonus_nauki: p.budynek_akademia_bonus_nauki,', ''),
    ('L129-garncarnia-param', 'garncarnia_bonus_zywnosci: p.budynek_garncarnia_bonus_zywnosci,', 'garncarnia_bonus_zywnosci: p.budynek_mennica_mnoznik,', ''),
    ('L130-zuzytka-one', 'zywnosc_zuzytka_populacja: p.zywnosc_zuzytka_populacja,', 'zywnosc_zuzytka_populacja: 1.0,', ''),
    ('L131-mennica-po-walucie-one', 'mennica_mnoznik_po_walucie: p.mennica_mnoznik_po_walucie,', 'mennica_mnoznik_po_walucie: 1.0,', ''),
    ('L132-tail-cap-one', 'korupcja_cap: p.korupcja_cap,', 'korupcja_cap: 1.0,', ''),
    ('L133-mlyn-mnoznik-one', 'budynek_mlyn_mnoznik_pracy: p.budynek_mlyn_mnoznik_pracy,', 'budynek_mlyn_mnoznik_pracy: 1.0,', ''),
    ('L134-mlyn-bonus-zero', 'budynek_mlyn_bonus_pracy: p.budynek_mlyn_bonus_pracy,', 'budynek_mlyn_bonus_pracy: 0.0,', ''),
    ('L135-wealth-order-after-yield', 'let wealth_immunity = cities[i].wealth_immunity_remaining', 'let wealth_immunity = cities[i].wealth_immunity_remaining.filter(|_| true)', 'EKW'),
]


def run(cmd):
    env = dict(os.environ)
    env.update({'CARGO_TARGET_DIR': '/dev/shm/q4r1', 'CARGO_INCREMENTAL': '0', 'CARGO_PROFILE_DEV_DEBUG': '0', 'CARGO_PROFILE_TEST_DEBUG': '0'})
    p = subprocess.run(cmd, cwd=REPO + '/rust-port/engine', env=env, capture_output=True, text=True, timeout=420)
    return p.returncode, p.stdout + p.stderr


def main():
    src = open(F).read()
    if sys.argv[1] == 'check':
        bad = [(m[0], src.count(m[1])) for m in M if src.count(m[1]) != 1]
        print('mutantow', len(M), 'zle:', bad)
        return
    if sys.argv[1] == 'ids':
        want = set(int(x) for x in sys.argv[2].split(','))
    else:
        want = set(range(int(sys.argv[1]), int(sys.argv[2])))
    out = open(RUN + '/mutacje-wynik.txt', 'a')
    for idx, (mid, old, new, flag) in enumerate(M):
        if idx not in want:
            continue
        cur = open(F).read()
        assert cur == src, 'plik zmieniony'
        assert cur.count(old) == 1, (mid, cur.count(old))
        try:
            open(F, 'w').write(cur.replace(old, new))
            code, text = run(['cargo', 'test', '-j', '2', '--test', 'p6_adv_q4_pipeline'])
        except subprocess.TimeoutExpired:
            code, text = -1, 'TIMEOUT'
        finally:
            open(F, 'w').write(src)
        if 'error[' in text or 'could not compile' in text:
            res = 'COMPILE'
        elif code == 0 and 'test result: ok' in text:
            res = 'SURVIVED'
        elif code == -1:
            res = 'TIMEOUT'
        else:
            res = 'KILLED'
        line = '%s: %s%s' % (mid, res, (' ' + flag) if flag and res == 'SURVIVED' else '')
        print(line, flush=True)
        out.write(line + '\n')
        out.flush()


main()
