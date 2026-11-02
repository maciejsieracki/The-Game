"""Mutacje modulu turn_economy_tick.rs (python3 -I mutate-q5.py check | <od> <do> | ids i,j,k).
Kazda mutacja: dokladnie 1 wystapienie `old` -> `new`, `cargo test --test p6_adv_q5_tick`,
KILLED gdy test pada, COMPILE gdy sie nie kompiluje (nie liczone), SURVIVED gdy zielono.
Plik zawsze przywracany. Flaga 'EKW' = oczekiwany mutant rownowazny (dowod plik:linia w P6-ADVANCE-CITY-ECONOMY-Q5.md sek. 6).
"""
import os
import subprocess
import sys

REPO = '/home/user/The-Game/.claude/worktrees/wf_dbd18ae1-07c-1'
F = REPO + '/rust-port/engine/src/domain/turn_economy_tick.rs'
RUN = REPO + '/dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q5-Q1'

M = [
    ('T01-utrzymanie-wrong-field', 'utrzymanie: Some(b.utrzymanie as f64),', 'utrzymanie: Some(b.przyrost_utrzymania as f64),', ''),
    ('T02-przyrost-zero', 'przyrost_utrzymania: Some(b.przyrost_utrzymania as f64),', 'przyrost_utrzymania: Some(0.0),', ''),
    ('T03-epoka-wejscia-one', 'epoka_wejscia: Some(b.epoka_wejscia as f64),', 'epoka_wejscia: Some(1.0),', ''),
    ('T04-koszt-drewno-none', 'm.insert("drewno".into(), k.drewno.map(|x| x as f64));', 'm.insert("drewno".into(), None);', ''),
    ('T05-koszt-kamien-none', 'm.insert("kamien".into(), k.kamien.map(|x| x as f64));', 'm.insert("kamien".into(), None);', ''),
    ('T06-koszt-cegla-none', 'm.insert("cegla".into(), k.cegla.map(|x| x as f64));', 'm.insert("cegla".into(), None);', ''),
    ('T07-epoka-num-other', 'Some(UnitCell::Num(x)) => EpochInput::Number(*x),', 'Some(UnitCell::Num(_)) => EpochInput::Other,', 'EKW'),
    ('T08-epoka-text-other', 'Some(UnitCell::Text(t)) => EpochInput::Text(t.clone()),', 'Some(UnitCell::Text(_)) => EpochInput::Other,', ''),
    ('T09-rodzaj-num-none', 'Some(UnitCell::Num(x)) => Some(js_number_to_string(*x)),', 'Some(UnitCell::Num(_)) => None,', 'EKW'),
    ('T10-ilosc-none', 'Some(UnitCell::Num(x)) => Some(*x),', 'Some(UnitCell::Num(_)) => None,', ''),
    ('T11-owners-no-units', '.chain(econ_units.iter().map(|u| u.owner_id))', '.chain(std::iter::empty::<i64>())', ''),
    ('T12-empty-built-not-skipped', '        if built.is_empty() {\n            continue;\n        }\n', '', 'EKW'),
    ('T13-owner-era-one', 'let owner_era = owner_era_for(input, c.owner_id);', 'let owner_era = 1.0;', ''),
    ('T14-tech-default-empty', 'None => input.player_zbadane.clone(),', 'None => BTreeSet::new(),', 'EKW'),
    ('T15-unlocked-none', 'Some(&unlocked),', 'None,', 'EKW'),
    ('T16-gate-none', 'gate.as_deref(),', 'None,', 'EKW'),
    ('T17-maks-poziom-one', 'b.maks_poziom as f64,', '1.0,', ''),
    ('T18-find-last', 'buildings.iter().find(|b| &b.id == bid)', 'buildings.iter().rfind(|b| &b.id == bid)', 'EKW'),
    ('T19-income-default-one', 'income_by_owner.get(&oid).copied().unwrap_or(0.0)', 'income_by_owner.get(&oid).copied().unwrap_or(1.0)', ''),
    ('T20-category-domyslny', 'category: String::new(),', 'category: "domyslny".into(),', ''),
    ('T21-units-gold-empty', '            &like,\n', '            &[],\n', ''),
    ('T22-res-buildings-empty', 'let buildings_res = total_building_resource_upkeep(blds);', 'let buildings_res: BTreeMap<String, f64> = BTreeMap::new();', ''),
    ('T23-res-units-empty', 'total_unit_resource_upkeep(&refs, |t| unit_upkeep_source(unit_rows, t));', 'total_unit_resource_upkeep(&[], |t| unit_upkeep_source(unit_rows, t));', ''),
    ('T24-res-no-merge-units', 'add_resource_costs(&mut res, &units_res);', 'let _ = &units_res;', ''),
    ('T25-res-no-buildings', 'let mut res = buildings_res.clone();', 'let mut res: BTreeMap<String, f64> = BTreeMap::new();', ''),
    ('T26-units-map-empty', 'out.resource_upkeep_units_by_owner.insert(oid, units_res);', 'out.resource_upkeep_units_by_owner.insert(oid, BTreeMap::new());', ''),
    ('T27-buildings-map-empty', '.insert(oid, buildings_res);', '.insert(oid, BTreeMap::new());', ''),
    ('T28-unit-def-neq', 'Some(UnitCell::Text(t)) if t == type_id)', 'Some(UnitCell::Text(t)) if t != type_id)', ''),
    ('T29-growth-one', 'growth: 0.0,', 'growth: 1.0,', ''),
    ('T30-starved-one', 'starved: 0.0,', 'starved: 1.0,', ''),
    ('T31-praca-upkeep-empty', 'praca_upkeep_by_owner: city_loop.upkeep_health.praca_upkeep_by_owner.clone(),', 'praca_upkeep_by_owner: BTreeMap::new(),', ''),
    ('T32-total-zywnosc-wrong', 'total_zywnosc: city_loop.total_zywnosc,', 'total_zywnosc: city_loop.total_praca,', ''),
    ('T33-cities-wrong', 'cities: city_loop.cities,', 'cities: city_loop.total_praca_pula,', ''),
    ('T34-total-pieniadz-wrong', 'total_pieniadz: city_loop.total_pieniadz,', 'total_pieniadz: city_loop.total_nauka,', ''),
    ('T35-diff-easy-normal', '"easy" => ManpowerDifficulty::Easy,', '"easy" => ManpowerDifficulty::Normal,', ''),
    ('T36-diff-hard-normal', '"hard" => ManpowerDifficulty::Hard,', '"hard" => ManpowerDifficulty::Normal,', ''),
    ('T37-oblegane-none', 'oblegane: if e.oblegane { Some(true) } else { None },', 'oblegane: None,', ''),
    ('T38-manpower-none', 'manpower: e.manpower,', 'manpower: None,', ''),
    ('T39-q-zero', 'q: c.q as i32,', 'q: 0,', ''),
    ('T40-r-zero', 'r: c.r as i32,', 'r: 0,', ''),
    ('T41-no-writeback', 'extras.entry(p.id).or_default().manpower = p.manpower;', 'let _ = p;', ''),
    ('T42-heal-owner-era-none', 'owner_era: input.resolvers.owner_era,', 'owner_era: None,', ''),
    ('T43-heal-player-era-one', 'player_era: input.player_era,', 'player_era: 1.0,', ''),
    ('T44-heal-hp-callback-none', 'on_unit_hp_changed: h.on_unit_hp_changed,', 'on_unit_hp_changed: None,', ''),
    ('T45-income-empty', '&city_loop.income_by_owner,', '&BTreeMap::new(),', ''),
    ('T46-unit-owner-filter', '.filter(|u| u.owner_id == oid)', '.filter(|u| u.owner_id != oid)', ''),
    ('T47-unit-type-empty-ref', 'type_id: u.type_id.clone(),\n            })\n            .collect();\n        let units_res', 'type_id: String::new(),\n            })\n            .collect();\n        let units_res', ''),
    ('T48-building-owner-zero', 'buildings_by_owner.entry(c.owner_id).or_default();', 'buildings_by_owner.entry(0).or_default();', ''),
    ('T49-level-one', '                level,\n            });', '                level: 1.0,\n            });', ''),
    ('T50-heal-skipped', 'let heal_result = heal.map(|h| {', 'let heal_result = heal.filter(|_| false).map(|h| {', ''),
]


def run(cmd):
    env = dict(os.environ)
    env.update({'CARGO_TARGET_DIR': '/dev/shm/q5-tgt', 'CARGO_INCREMENTAL': '0', 'CARGO_PROFILE_DEV_DEBUG': '0', 'CARGO_PROFILE_TEST_DEBUG': '0'})
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
            code, text = run(['cargo', 'test', '-j', '2', '--test', 'p6_adv_q5_tick'])
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
