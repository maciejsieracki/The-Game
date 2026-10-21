//! Test parsowania `buildings.json`, `wonders.json`, `tech.json` do struktur
//! z `buildings_tech.rs`. Spot-checki liczbowe są wyliczone niezależnie
//! z plików JSON (skrypt Python, `json.load`), nie z kodu Rust.

#[path = "../src/data/buildings_tech.rs"]
mod buildings_tech;

use buildings_tech::{parse_buildings, parse_tech, parse_wonders};

#[test]
fn buildings_json_parses() {
    let buildings = parse_buildings().expect("buildings.json musi się sparsować");
    // Niezależnie policzone: 42 rekordy, 41 z `koszt_surowce`.
    assert_eq!(buildings.len(), 42);
    assert_eq!(
        buildings
            .iter()
            .filter(|b| b.koszt_surowce.is_some())
            .count(),
        41
    );
    // Suma `kosztBudowy` po wszystkich rekordach = 1736; suma `epokaWejscia` = 89.
    let suma_koszt: i64 = buildings.iter().map(|b| b.koszt_budowy).sum();
    assert_eq!(suma_koszt, 1736);
    let suma_epoka: i64 = buildings.iter().map(|b| b.epoka_wejscia).sum();
    assert_eq!(suma_epoka, 89);
    // Spot-check: pierwszy rekord `stolarnia`.
    let st = &buildings[0];
    assert_eq!(st.id, "stolarnia");
    assert_eq!(st.koszt_budowy, 20);
    assert_eq!(st.przyrost_kosztu, 10);
    assert_eq!(st.baza.praca, 5);
    assert_eq!(st.przyrost.praca, 3);
}

#[test]
fn wonders_json_parses() {
    let w = parse_wonders().expect("wonders.json musi się sparsować");
    // Niezależnie policzone: 19 cudów, 15 państw, 5 cudów parkowanych.
    assert_eq!(w.cuda.len(), 19);
    assert_eq!(w.panstwa.len(), 15);
    assert_eq!(w.parkowane_epoka4plus.len(), 5);
    // Suma `kosztBudowy` cudów = 4425; liczba wpisów `bonusy.specjalne` = 57.
    let suma_koszt: i64 = w.cuda.iter().map(|c| c.koszt_budowy).sum();
    assert_eq!(suma_koszt, 4425);
    let specjalne: usize = w.cuda.iter().map(|c| c.bonusy.specjalne.len()).sum();
    assert_eq!(specjalne, 57);
    // Spot-check: pierwszy cud `piramidy`.
    assert_eq!(w.cuda[0].id, "piramidy");
    assert_eq!(w.cuda[0].koszt_budowy, 160);
}

#[test]
fn tech_json_parses() {
    let t = parse_tech().expect("tech.json musi się sparsować");
    // Niezależnie policzone: 32 technologie; suma `Koszt nauki` = 9224.
    assert_eq!(t.technologie.len(), 32);
    let suma: i64 = t.technologie.iter().map(|x| x.koszt_nauki).sum();
    assert_eq!(suma, 9224);
    // Spot-check: pierwsza technologia i tempo gry.
    assert_eq!(t.technologie[0].technologia, "Obróbka drewna");
    assert_eq!(t.technologie[0].koszt_nauki, 5);
    assert_eq!(t.tempo_gry.szybka, 1);
    assert_eq!(t.tempo_gry.standardowa, 2);
    assert_eq!(t.tempo_gry.dluga, 4);
}
