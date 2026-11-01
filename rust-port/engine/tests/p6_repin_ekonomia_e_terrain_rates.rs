//! REPIN-EKONOMIA-E obrona r1 (zarzut 1): stawki `surowiec_ilosc_tura` w `data/terrain-improvements.json`
//! zgodne z pinem weba 4bbef081d (tartak i kamieniolom 200 -> 50). Pola terytorium (fort/posterunek)
//! SWIADOMIE poza zakresem (osobny temat terytorium/8I).

use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ekonomia_e_vectors/terrain_rates.json");
const DATA: &str = include_str!("../data/terrain-improvements.json");

#[test]
fn surowiec_ilosc_tura_zgodne_z_pinem() {
    let v: Value = serde_json::from_str(VECTORS).expect("terrain_rates.json");
    let data: Value = serde_json::from_str(DATA).expect("terrain-improvements.json");
    let rates = v["rates"].as_object().expect("rates");
    assert_eq!(rates.len(), 9);
    for (k, want) in rates {
        let got = data[k.as_str()]["surowiec_ilosc_tura"].as_i64();
        assert_eq!(got, want.as_i64(), "stawka {k}");
    }
}

#[test]
fn brak_dodatkowych_stawek_poza_pinem() {
    let v: Value = serde_json::from_str(VECTORS).expect("terrain_rates.json");
    let data: Value = serde_json::from_str(DATA).expect("terrain-improvements.json");
    let rates = v["rates"].as_object().expect("rates");
    let with_rate = data
        .as_object()
        .expect("obiekt")
        .iter()
        .filter(|(k, row)| *k != "_meta" && row.get("surowiec_ilosc_tura").is_some())
        .count();
    assert_eq!(with_rate, rates.len());
}
