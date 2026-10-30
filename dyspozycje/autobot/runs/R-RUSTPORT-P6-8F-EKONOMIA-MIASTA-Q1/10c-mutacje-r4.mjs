// Mutation driver (R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1, runda 4). For each mutation: exactly one
// textual occurrence is replaced in the engine source, `cargo test --test <target>` runs, the file is
// restored byte-for-byte and verified. Outcome: KILLED (test failed), SURVIVED (exit 0), COMPILE-ERR.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ENG = '/home/user/The-Game/.claude/worktrees/wf_162a00f9-a67-4/rust-port/engine';
const R4 = 'economy_city_vectors_r4';
const R2 = 'economy_city_vectors';
const MUTS = [
  // #7 buildingGivesHappiness
  { id: 'M7a', file: 'src/domain/economy_city_fns.rs', test: R4,
    from: 'matches!(daje_szczescie, Some(serde_json::Value::Bool(true)))',
    to: 'matches!(daje_szczescie, Some(serde_json::Value::Bool(_)))' },
  // #8 buildingHappinessAtLevel
  { id: 'M8a', file: 'src/domain/economy_yield.rs', test: R4,
    from: '    if !daje_szczescie {\n        return 0.0;\n    }\n',
    to: '' },
  { id: 'M8b', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'Some(z) if z != 0.0 => building_value(z, przyrost_zadowolenie, level),',
    to: 'Some(z) => building_value(z, przyrost_zadowolenie, level),' },
  // #11 cityBuildingEntriesFromBuiltIds
  { id: 'M11a', file: 'src/domain/economy_city_fns.rs', test: R4,
    from: '.position(|b| b.id == *bid)', to: '.rposition(|b| b.id == *bid)' },
  { id: 'M11b', file: 'src/domain/production_units.rs', test: R4,
    from: '&& !unlocked.contains(tech)', to: '&& unlocked.contains(tech)' },
  // #3 buildTerrainYields (pierwszy vs ostatni wpis)
  { id: 'M3a', file: 'src/domain/economy_city_terrain.rs', test: R4,
    from: 'out.insert(key, terrain_row_to_tile_yield(row));',
    to: 'out.entry(key).or_insert_with(|| terrain_row_to_tile_yield(row));' },
  // #15 civBonusyForCivKey
  { id: 'M15a', file: 'src/domain/economy_city_fns.rs', test: R4,
    from: 'for row in rows {', to: 'for row in rows.iter().rev() {' },
  { id: 'M15b', file: 'src/domain/economy_city_fns.rs', test: R4,
    from: '.any(|s| s.to_lowercase() == key);', to: '.any(|s| s == key);' },
  // #17 cityYieldPerTurn (galezie sterujace)
  { id: 'Y01-mlyn', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'let mut praca_brutto_terenu = if input.ma_mlyn {', to: 'let mut praca_brutto_terenu = if !input.ma_mlyn {' },
  { id: 'Y02-cegielnia', file: 'src/domain/economy_yield.rs', test: R4,
    from: '    if input.ma_cegielnia {', to: '    if !input.ma_cegielnia {' },
  { id: 'Y03-port', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'if port_raw != 0.0 {', to: 'if false {' },
  { id: 'Y04-civHandelMult', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'let civ_handel_mult = if civ.is_some() {', to: 'let civ_handel_mult = if civ.is_none() {' },
  { id: 'Y05-premia', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'if premia > 0.0 {', to: 'if premia > 1.0 {' },
  { id: 'Y06-additionalTax', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'handel_brutto += js_math_max_zero(input.additional_tax.unwrap_or(0.0));',
    to: 'handel_brutto += input.additional_tax.unwrap_or(0.0);' },
  { id: 'Y07-korupcjaCap', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'let strata = js_min(strata_raw, params.korupcja_cap);', to: 'let strata = strata_raw;' },
  { id: 'Y08-walutaAND', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'let waluta_aktywna = input.waluta_odkryta && input.ma_mennica;',
    to: 'let waluta_aktywna = input.ma_mennica;' },
  { id: 'Y09-akademia', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'let nauka_bonus_factor = 1.0 + biblioteka + akademia;', to: 'let nauka_bonus_factor = 1.0 + biblioteka;' },
  { id: 'Y10-garncarnia', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'let liczba_garncarni = input.liczba_garncarni.unwrap_or(0.0);',
    to: 'let liczba_garncarni = input.liczba_garncarni.unwrap_or(1.0);' },
  { id: 'Y11-poborca', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'pieniadz_total += 2.0;', to: 'pieniadz_total += 3.0;' },
  { id: 'Y12-biblioteka', file: 'src/domain/economy_yield.rs', test: R4,
    from: 'let biblioteka = if input.ma_biblioteka {', to: 'let biblioteka = if !input.ma_biblioteka {' },
  // #1 loadEconParams: galezie odczytu wiersza trudnosci (read)
  { id: 'L1-difficulty', file: 'src/domain/economy_city_params.rs', test: 'economy_city_vectors_r3',
    from: '.and_then(|row| row.get(difficulty))', to: '.and_then(|row| row.get("normal"))' },
  { id: 'L2-fallback', file: 'src/domain/economy_city_params.rs', test: 'economy_city_vectors_r3',
    from: '.filter(|v| v.is_finite())\n        .unwrap_or(fallback)', to: '.filter(|v| v.is_finite())\n        .unwrap_or(0.0)' },
  // #22 corruptionRate (M6 i M2) - fixture r4 i fixture r2
  { id: 'M6-r4', file: 'src/domain/economy_city_fns.rs', test: R4,
    from: 'js_min(cap_pct, strata_pct) / 100.0', to: 'cap_pct.min(strata_pct) / 100.0' },
  { id: 'M6-r2', file: 'src/domain/economy_city_fns.rs', test: R2,
    from: 'js_min(cap_pct, strata_pct) / 100.0', to: 'cap_pct.min(strata_pct) / 100.0' },
  { id: 'M2-r4', file: 'src/domain/economy_city_fns.rs', test: R4,
    from: 'let cap_pct = params.cap * 100.0;', to: 'let cap_pct = params.cap * 10.0;' },
];

const want = process.argv.slice(2);
const selected = want.length ? MUTS.filter((m) => want.includes(m.id)) : MUTS;
const env = { ...process.env, CARGO_INCREMENTAL: '0', CARGO_PROFILE_DEV_DEBUG: '0', CARGO_PROFILE_TEST_DEBUG: '0' };
for (const m of selected) {
  const path = ENG + '/' + m.file;
  const orig = readFileSync(path, 'utf8');
  const count = orig.split(m.from).length - 1;
  if (count !== 1) { console.log(`${m.id} NOCOUNT occurrences=${count}`); continue; }
  let verdict;
  let exit;
  try {
    writeFileSync(path, orig.replace(m.from, m.to));
    const r = spawnSync('cargo', ['test', '--test', m.test], { cwd: ENG, env, encoding: 'utf8', timeout: 300000 });
    exit = r.status;
    const out = (r.stdout || '') + (r.stderr || '');
    if (/error(\[E\d+\])?:/.test(out) && !/test result/.test(out)) verdict = 'COMPILE-ERR';
    else if (exit === 0) verdict = 'SURVIVED';
    else verdict = 'KILLED';
    const failed = out.split('\n').filter((l) => /panicked at|test result/.test(l)).slice(0, 2).join(' | ');
    console.log(`${m.id} target=${m.test} EXIT=${exit} ${verdict} :: ${failed}`);
  } finally {
    writeFileSync(path, orig);
  }
  const restored = readFileSync(path, 'utf8') === orig;
  console.log(`${m.id} RESTORED=${restored}`);
  if (!restored) throw new Error('restore failed for ' + m.id);
}
console.log('DRIVER_DONE');
