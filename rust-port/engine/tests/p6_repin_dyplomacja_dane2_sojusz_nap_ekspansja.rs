// R-RUSTPORT-REPIN-DYPLOMACJA-DANE-2-Q1: zgodnosc dryfujacych danych dyplomacji z webem.
// Wartosci web (ZMIERZONO przez `git show origin/main:gra/data/diplomacy.json`):
//   progSojuszWillingnessMin         = 0.54  (decyzja ALLIANCE-WILLINGNESS-THRESHOLD-054)
//   progNapZaufanie                  = 30
//   progNapBezterminowyRelacja       = 151   (ai.ts:7064 napIndefinite)
//   ekspansjaGranicaBraz_zaufanie_perTura   = -3
//   ekspansjaGranicaZelazo_zaufanie_perTura = -4
//   ekspansjaGranica_zaufanie_perTura       = -2 (bez zmian)

#[path = "../src/data/civilizations.rs"]
#[allow(dead_code)]
mod civilizations;

use civ_engine::domain::diplomacy::DiplomacyParams;
use civilizations::parse_diplomacy;

#[test]
fn diplomacy_json_willingness_i_nap_zgodne_z_web() {
    let f = parse_diplomacy().expect("diplomacy.json parse");
    assert_eq!(f.params.prog_sojusz_willingness_min, 0.54);
    assert_eq!(f.params.prog_nap_zaufanie, 30);
    assert_eq!(f.params.prog_nap_bezterminowy_relacja, 151);
    assert_eq!(f.params.prog_nap_relacja, 110);
}

#[test]
fn diplomacy_json_ekspansja_granica_zgodna_z_web() {
    let f = parse_diplomacy().expect("diplomacy.json parse");
    assert_eq!(f.params.ekspansja_granica_zaufanie_per_tura, -2);
    assert_eq!(f.params.ekspansja_granica_braz_zaufanie_per_tura, -3);
    assert_eq!(f.params.ekspansja_granica_zelazo_zaufanie_per_tura, -4);
}

#[test]
fn diplomacy_params_default_willingness_i_nap_zgodne_z_web() {
    let p = DiplomacyParams::default();
    assert_eq!(p.alliance_willingness_min, 0.54);
    assert_eq!(p.nap_indefinite_relation, 151.0);
    assert_eq!(p.nap_relation, 110.0);
    assert_eq!(p.minimum_relation, 30.0);
}
