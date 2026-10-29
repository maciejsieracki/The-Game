import os, subprocess, sys, re

# Sciezki wzgledem lokalizacji skryptu (katalog runu w worktree), nie na sztywno.
RUN = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(RUN, '..', '..', '..', '..'))
ENG = os.path.join(ROOT, 'rust-port', 'engine')
ENV = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_TARGET_DIR='/home/user/cargo-target-shared/' + os.path.basename(ROOT), CARGO_PROFILE_DEV_DEBUG='0')

AG = f'{ENG}/src/domain/ai_general_war_campaign.rs'
AC = f'{ENG}/src/domain/army_consolidation.rs'

MUTS = {
 'G01-reconcile-fresh-inverted': (AG, 'Some(blocked) if must_be_fresh => !blocked.contains(&g.id),', 'Some(blocked) if must_be_fresh => blocked.contains(&g.id),'),
 'G02-reconcile-notfresh-no-idcmp': (AG, '!truthy_id(&campaign.general_unit_id)\n                        || campaign.general_unit_id.as_deref() != Some(g.id.as_str())', '!truthy_id(&campaign.general_unit_id)'),
 'G03-restart-drops-gid': (AG, 'general_unit_id: campaign.general_unit_id.clone(),\n            blocked_general_ids: Some(alive),', 'general_unit_id: None,\n            blocked_general_ids: Some(alive),'),
 'G04-restart-alive-empty': (AG, 'None => general.map(|g| vec![g.id.clone()]).unwrap_or_default(),', 'None => Vec::new(),'),
 'G05-final-recruit-always': (AG, '&& general.is_none()\n        && campaign.stage', '&& true\n        && campaign.stage'),
 'G06-gather-threshold-off-by-one': (AG, 'if gather_turns_completed >= AI_GENERAL_WAR_GATHER_TURNS {', 'if gather_turns_completed > AI_GENERAL_WAR_GATHER_TURNS {'),
 'G07-gather-no-turn-guard': (AG, '        || campaign.last_gather_turn == Some(turn)\n', ''),
 'G08-choose-undefined-unreachable': (AG, '.filter(|c| c.reachable != Some(false))', '.filter(|c| c.reachable == Some(true))'),
 'G09-choose-tie-owner-desc': (AG, '.then_with(|| a.owner_id.cmp(&b.owner_id))', '.then_with(|| b.owner_id.cmp(&a.owner_id))'),
 'G10-reach-start-unchecked': (AG, '    if !walkable(probe) {', '    if false {'),
 'G11-neighbor-all': (AG, 'hex_neighbor_coords(target.0, target.1).any(|n| reachability.hex_keys.contains(&n))', 'hex_neighbor_coords(target.0, target.1).all(|n| reachability.hex_keys.contains(&n))'),
 'G12-restore-owner-zero-ok': (AG, '.filter(|o| *o > 0) else {', '.filter(|o| *o >= 0) else {'),
 'G13-restore-target-neg-ok': (AG, 'safe_integer(raw.get("targetOwnerId")?).filter(|t| *t >= 0)?;', 'safe_integer(raw.get("targetOwnerId")?)?;'),
 'G14-restore-dup-push': (AG, 'Some(slot) => slot.1 = campaign,', 'Some(_) => restored.push((owner_id, campaign)),'),
 'G15-save-keeps-empty-gid': (AG, 'if !truthy_id(&saved.general_unit_id) {\n                saved.general_unit_id = None;\n            }', ''),
 'G16-restore-blocked-not-checked': (AG, 'Some(_) => return None,\n    };\n    let last_gather_turn', 'Some(_) => None,\n    };\n    let last_gather_turn'),
 'G17-reconcile-same-target-always': (AG, 'let same_target = current.is_some_and(|c| c.target_owner_id == target);', 'let same_target = current.is_some();'),
 'G18-reach-bfs-no-blocked': (AG, 'if hex_keys.contains(&neighbor) || !walkable(neighbor) {', 'if hex_keys.contains(&neighbor) || hex_costs.get(&neighbor).is_none() {'),
 'A01-assign-le-cap': (AC, '.find(|cand| counts.get(&(cand.q, cand.r)).copied().unwrap_or(0) < max_per_hex)', '.find(|cand| counts.get(&(cand.q, cand.r)).copied().unwrap_or(0) <= max_per_hex)'),
 'A02-assign-fallback-last': (AC, '.unwrap_or(anchor);', '.unwrap_or(*candidates.last().unwrap());'),
 'A03-split-tie-le': (AC, 'if group.1 < groups[best].1 {', 'if group.1 <= groups[best].1 {'),
 'A04-split-strength-asc': (AC, 'strength_of(b)\n            .partial_cmp(&strength_of(a))', 'strength_of(a)\n            .partial_cmp(&strength_of(b))'),
 'A05-pick-no-capital': (AC, 'if let Some(id) = capital_city_id.filter(|id| !id.is_empty()) {', 'if let Some(id) = capital_city_id.filter(|_| false) {'),
 'A06-candidates-radius-strict': (AC, '.filter(|(d, _)| *d <= search_radius)', '.filter(|(d, _)| *d < search_radius)'),
 'A07-war-count-no-min': (AC, 'unique.len().max(1)', 'unique.len()'),
 'A08-atrally-q-only': (AC, 'at_rally: u.q == target.q && u.r == target.r,', 'at_rally: u.q == target.q,'),
 'A09-hexdist-no-ds': (AC, 'dq.max(dr).max(ds)', 'dq.max(dr)'),
 'A10-flag-default-inverted': (AC, 'flag_override.unwrap_or(ARMY_CONSOLIDATION_ENABLED)', 'flag_override.unwrap_or(!ARMY_CONSOLIDATION_ENABLED)'),
 # Runda weryfikatora: galezie sterujace bez mutacji w rundzie operatora.
 'E01-choose-sticky-off': (AG, '    if let Some(cur) = current {', '    if let Some(cur) = current.filter(|_| false) {'),
 'E02-choose-empty-unguarded': (AG, '    if reachable.is_empty() {\n        return None;\n    }', '    if false {\n        return None;\n    }'),
 'E03-reconcile-samedtarget-ignored': (AG, 'let Some(current) = current.filter(|_| same_target) else {', 'let Some(current) = current else {'),
 'E04-gather-stage-guard-off': (AG, '    if campaign.stage != AiGeneralCampaignStage::Gathering\n', '    if false\n'),
 'E05-restore-stage-default': (AG, '"attacking" => AiGeneralCampaignStage::Attacking,\n        _ => return None,', '"attacking" => AiGeneralCampaignStage::Attacking,\n        _ => AiGeneralCampaignStage::Recruiting,'),
 'E06-restore-lastgather-dropped': (AG, 'let last_gather_turn = raw.get("lastGatherTurn").and_then(safe_integer);', 'let last_gather_turn: Option<i64> = None;'),
 'E07-reconcile-recruit-ignores-isgeneral': (AG, '        if let Some(g) = general.filter(|g| g.is_general) {\n            let fresh', '        if let Some(g) = general {\n            let fresh'),
 'A11-candidates-drop-nonrally-filter': (AC, '.filter(|c| c.id != rally.id)', '.filter(|_| true)'),
 'A12-assign-id-tiebreak-off': (AC, 'da.cmp(&db).then_with(|| cmp_js_str(&a.id, &b.id))', 'da.cmp(&db)'),
 # A13 = mutant rownowazny (klamp min(len) nie zmienia niepustych armii; puste sa filtrowane).
 'A13-split-clamp-off': (AC, 'let k = army_count.max(1).min(units.len() as i64) as usize;', 'let k = army_count.max(1) as usize;'),
 'A14-split-keep-empty-groups': (AC, '.filter(|g| !g.is_empty())', '.filter(|_| true)'),
}

def run_one(mid):
    path, old, new = MUTS[mid]
    orig = open(path, encoding='utf-8').read()
    n = orig.count(old)
    if n != 1:
        return f'{mid}: SKIP (wzorzec wystepuje {n} razy)'
    mutated = orig.replace(old, new, 1)
    if mutated == orig:
        return f'{mid}: SKIP (brak zmiany)'
    res = 'NIEZNANY'
    log = []
    try:
        open(path, 'w', encoding='utf-8').write(mutated)
        p = subprocess.run(['cargo', 'test', '--test', 'p6_repin_wojna_b_ai_general', '--test', 'p6_repin_wojna_b_army_consolidation', '--no-fail-fast'],
                           cwd=ENG, env=ENV, capture_output=True, text=True, timeout=500)
        out = p.stdout + p.stderr
        log = out.splitlines()[-40:]
        failed = len(re.findall(r'\.\.\. FAILED', out))
        compile_err = 'error[' in out or 'error: could not compile' in out
        res = 'COMPILE_ERROR' if compile_err else ('KILLED' if failed > 0 else 'SURVIVED')
        res += f' failed_tests={failed}'
    finally:
        open(path, 'w', encoding='utf-8').write(orig)
    with open(f'{RUN}/mut-b-{mid}.log', 'w', encoding='utf-8') as f:
        f.write(f'MUTATION {mid}\nOLD: {old!r}\nNEW: {new!r}\nRESULT: {res}\n\n' + '\n'.join(log) + '\n')
    return f'{mid}: {res}'

if __name__ == '__main__':
    ids = sys.argv[1:] or list(MUTS)
    for mid in ids:
        print(run_one(mid), flush=True)
