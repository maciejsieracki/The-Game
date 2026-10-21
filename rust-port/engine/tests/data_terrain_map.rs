//! Test R-RUSTPORT-P3-5D-DATA-TERRAIN-MAP-Q1: cztery pliki JSON terenu/mapy
//! parsuja sie do struktur `#[derive(Deserialize)]` z `src/data/terrain_map.rs`.
//! Modul ladowany przez `#[path]` (lib.rs swiadomie nietkniety w tym temacie).

#[path = "../src/data/terrain_map.rs"]
mod terrain_map;

use terrain_map::*;

#[test]
fn terrain_improvements_parses_and_spot_checks() {
    let f = parse_terrain_improvements().expect("terrain-improvements.json must parse");
    assert_eq!(f._meta.epoka, "1=Kamien, 2=Braz, 3=Zelazo");
    assert_eq!(f.farma.koszt_praca, 20.0);
    assert_eq!(f.wyrab.wycinka.as_ref().map(|w| w.praca_per_tura), Some(50));
    assert_eq!(f.fort.bonus_obrona_proc, Some(100));
    assert_eq!(f.droga_brukowana.upgrade_from.as_deref(), Some("droga"));

    // Rozstrzygniecie pytania z P1-16D: wartosc FAKTYCZNIE zapisana w pliku.
    let tartak_rate = f.tartak.surowiec_ilosc_tura;
    let kamieniolom_rate = f.kamieniolom.surowiec_ilosc_tura;
    println!(
        "SPOT tartak.surowiec_ilosc_tura={:?} kamieniolom.surowiec_ilosc_tura={:?} tartak.bonus.praca={:?} kamieniolom.bonus.praca={:?}",
        tartak_rate,
        kamieniolom_rate,
        f.tartak.bonus.praca,
        f.kamieniolom.bonus.praca
    );
    assert_eq!(tartak_rate, Some(200));
    assert_eq!(kamieniolom_rate, Some(200));
    assert_eq!(f.tartak.bonus.praca, Some(3));
}

#[test]
fn terrain_movement_parses_and_spot_checks() {
    let f = parse_terrain_movement().expect("terrain-movement.json must parse");
    println!(
        "SPOT movement.costs.pustynia={} movement.costs.gory={} forestExtra={}",
        f.costs.pustynia, f.costs.gory, f.forest_extra
    );
    assert_eq!(f.costs.pustynia, 2);
    assert_eq!(f.costs.gory, 99);
    assert_eq!(f.costs.laka, 1);
    assert_eq!(f.forest_extra, 1);
}

#[test]
fn terrain_yields_parses_and_spot_checks() {
    let f = parse_terrain_yields().expect("terrain-yields.json must parse");
    assert_eq!(f.terrain_types.len(), 8);
    assert_eq!(f.terrain_modifiers.len(), 2);
    let laka = &f.terrain_types[0];
    let rzeka = &f.terrain_modifiers[0];
    println!(
        "SPOT yields.terrain_types[0]={} suma={} | modifiers[0]={} glina={} suma={}",
        laka.teren, laka.suma, rzeka.modyfikator, rzeka.glina, rzeka.suma
    );
    assert_eq!(laka.teren, "Łąka");
    assert_eq!(laka.suma, 8);
    assert_eq!(rzeka.modyfikator, "Rzeka");
    assert_eq!(rzeka.glina, 5);
    assert_eq!(rzeka.suma, 13);
}

#[test]
fn map_gen_params_parses_and_spot_checks() {
    let f = parse_map_gen_params().expect("map-gen-params.json must parse");
    println!(
        "SPOT map-gen.gestosc.surowce_mult.medium={} generator.rozmiar_dims.standardowy={:?} deposit_rules.cyna.rarity={} metal_deposit_min_era.cyna={}",
        f.gestosc.surowce_mult.medium,
        f.generator.rozmiar_dims.standardowy,
        f.deposit_rules.cyna.rarity,
        f.metal_deposit_min_era.cyna
    );
    assert_eq!(f.gestosc.surowce_mult.medium, 1.0);
    assert_eq!(f.generator.rozmiar_dims.standardowy, [168, 120]);
    assert_eq!(f.deposit_rules.cyna.rarity, 0.06);
    assert_eq!(f.metal_deposit_min_era.cyna, 2);
}
