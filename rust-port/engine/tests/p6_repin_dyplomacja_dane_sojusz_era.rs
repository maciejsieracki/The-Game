// R-RUSTPORT-REPIN-DYPLOMACJA-DANE-SOJUSZ-ERA-Q1: zgodnosc wartosci dryfujacych z webem.
// Wartosci web (ZMIERZONO przez `git show origin/main:gra/data/*.json`):
//   gra/data/diplomacy-acceptance-points.json  sojusz_pelny/sojusz_defensywny.prog_relacja = 130
//   gra/data/diplomacy.json                    progSojuszRelacja = 130, progSojuszZaufanie = 90,
//                                              progUmowaMinRelacja = 130
//   gra/data/war-rules-params.json             eraForcedWarStartTurnsFromEra = {stone:40,bronze:40,iron:40}

#[path = "../src/data/civilizations.rs"]
#[allow(dead_code)]
mod civilizations;

use civ_engine::domain::diplomacy::DiplomacyParams;
use civ_engine::domain::diplomacy_multiwar_gate::{
    ERA_FORCED_WAR_START_TURNS_BRONZE, ERA_FORCED_WAR_START_TURNS_IRON,
};
use civilizations::{parse_diplomacy, parse_diplomacy_acceptance_points};

#[test]
fn acceptance_points_sojusz_prog_relacja_zgodny_z_web() {
    let f = parse_diplomacy_acceptance_points().expect("diplomacy-acceptance-points.json parse");
    assert_eq!(f.traktaty.sojusz_pelny.prog_relacja, 130);
    assert_eq!(f.traktaty.sojusz_defensywny.prog_relacja, 130);
}

#[test]
fn diplomacy_json_sojusz_progi_zgodne_z_web() {
    let f = parse_diplomacy().expect("diplomacy.json parse");
    assert_eq!(f.params.prog_sojusz_relacja, 130);
    assert_eq!(f.params.prog_umowa_min_relacja, 130);
    assert_eq!(f.params.prog_sojusz_zaufanie, 90);
}

#[test]
fn diplomacy_params_default_sojusz_zgodne_z_web() {
    let p = DiplomacyParams::default();
    assert_eq!(p.alliance_relation, 130.0);
    assert_eq!(p.treaty_min_relation, 130.0);
    assert_eq!(p.alliance_trust_threshold, 90.0);
}

#[test]
fn era_forced_war_start_turns_zgodne_z_web() {
    assert_eq!(ERA_FORCED_WAR_START_TURNS_BRONZE, 40.0);
    assert_eq!(ERA_FORCED_WAR_START_TURNS_IRON, 40.0);
    assert_eq!(
        civ_engine::domain::war_forced_stone::WOJNA_KAMIEN_WYMUSZONA_START_TURY,
        40.0
    );
}
