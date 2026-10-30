//! P6.8B2-P2 (obrona r1): testy domykajace luki mutacyjne zgloszone w weryfikacji r1.
//! Oczekiwane wartosci: web `gra/src/game/production.ts` @ pin `91dc998a` (wskazane w komentarzach),
//! a dla `slice`/zaokraglen potwierdzone uruchomionym Node (`[1,2,3].slice(0,1.5).length === 1`).

use civ_engine::domain::production_units::{
    advance_recruitment, advance_recruitment_gated, dequeue_recruitment, era_building_catalog,
    polish_locale_compare, praca_imperial_pool_gain, preview_praca_pool_brutto, rush_production,
    split_output, BuildingAvailRow, BuildingCatalogStatus, BuildingCostRow, CityProduction,
    EraBuildingRow, EraCatalogCtx, OutputShares, PracaSplitTick, ProductionItem, ProductionKind,
};
use civ_engine::domain::types::Difficulty;
use std::cmp::Ordering;

fn unit(id: &str, koszt: f64) -> ProductionItem {
    ProductionItem {
        kind: ProductionKind::Jednostka,
        id: id.into(),
        nazwa: id.into(),
        koszt,
        postep: None,
        is_general: None,
    }
}

fn bld(id: &str, koszt: f64, postep: Option<f64>) -> ProductionItem {
    ProductionItem {
        kind: ProductionKind::Budynek,
        id: id.into(),
        nazwa: id.into(),
        koszt,
        postep,
        is_general: None,
    }
}

fn recruit_prod(items: Vec<ProductionItem>) -> CityProduction {
    CityProduction {
        kolejka: vec![],
        postep: 0.0,
        wstrzymana: None,
        rekrutacja: Some(items),
    }
}

#[test]
fn advance_recruitment_fractional_limit_truncates_like_js_slice() {
    // web advanceRecruitment: n = Math.min(maxPerTurn, len); rq.slice(0, n) -> ToIntegerOrInfinity (trunc).
    // Node: [1,2,3].slice(0,1.5).length === 1; [1,2,3].slice(0,2.9).length === 2.
    let p = recruit_prod(vec![
        unit("Wojownik", 10.0),
        unit("Wojownik", 10.0),
        unit("Wojownik", 10.0),
    ]);
    assert_eq!(advance_recruitment(&p, 1.5).completed.len(), 1);
    assert_eq!(advance_recruitment(&p, 2.9).completed.len(), 2);
    assert_eq!(advance_recruitment(&p, 0.99).completed.len(), 0);
    let rest = advance_recruitment(&p, 1.5).prod.rekrutacja;
    assert_eq!(
        rest.as_ref().map(Vec::len),
        Some(2),
        "reszta po trunc(1.5)=1"
    );
}

#[test]
fn polish_compare_case_level_and_bytewise_tiebreak() {
    // Poziom wielkosci liter: male przed wielkimi (Node/ICU: 'mur'.localeCompare('Mur','pl') = -1).
    assert_eq!(polish_locale_compare("mur", "Mur"), Ordering::Less);
    assert_eq!(polish_locale_compare("Mur", "mur"), Ordering::Greater);
    assert_eq!(polish_locale_compare("Ząb", "Ząb"), Ordering::Equal);
    // Ostatni poziom = tiebreak bajtowy `a.cmp(b)` (ZALOZENIE Rust, nie zachowanie ICU).
    // 'ǅ' (U+01C5) i 'ǆ' (U+01C6) maja ten sam klucz pierwotny i wielkosc liter. Node/ICU daje
    // 'ǅ'.localeCompare('ǆ','pl') = 1 (odwrotnie). ROZBIEZNOSC ZAPISANA W BLOKADACH: poza zakresem
    // nazw budynkow pina; test pinuje deterministyczny tiebreak, nie zgodnosc z ICU.
    assert_eq!(
        polish_locale_compare("\u{01C5}", "\u{01C6}"),
        Ordering::Less
    );
    assert_eq!(
        polish_locale_compare("\u{01C6}", "\u{01C5}"),
        Ordering::Greater
    );
}

#[test]
fn rush_production_front_drop_and_postep_handover() {
    // web dropFrontItem(kolejka, 0): postep nowego frontu = (nextFront.postep ?? 0) + 0,
    // a pole postep nowego frontu jest usuwane (production.ts:1508-1520).
    let p = CityProduction {
        kolejka: vec![bld("A", 30.0, None), bld("B", 20.0, Some(5.0))],
        postep: 12.0,
        wstrzymana: None,
        rekrutacja: None,
    };
    let r = rush_production(&p);
    assert_eq!(r.completed.as_ref().map(|i| i.id.as_str()), Some("A"));
    assert_eq!(r.prod.kolejka.len(), 1);
    assert_eq!(r.prod.kolejka[0].id, "B");
    assert_eq!(r.prod.postep, 5.0, "zbankowany postep B oddany");
    assert_eq!(r.prod.kolejka[0].postep, None, "pole postep B wyczyszczone");

    // Nowy front bez postepu -> postep 0 (nie 1: unwrap_or(0)).
    let p2 = CityProduction {
        kolejka: vec![bld("A", 30.0, None), bld("B", 20.0, None)],
        postep: 12.0,
        wstrzymana: None,
        rekrutacja: None,
    };
    assert_eq!(rush_production(&p2).prod.postep, 0.0);

    // Pusta kolejka: postep 0 (web `postep: 0`, nie prod.postep), completed None.
    let p3 = CityProduction {
        kolejka: vec![],
        postep: 7.0,
        wstrzymana: None,
        rekrutacja: None,
    };
    let r3 = rush_production(&p3);
    assert_eq!(r3.prod.postep, 0.0);
    assert!(r3.completed.is_none());
}

#[test]
fn gated_completes_at_most_max_per_turn_with_two_in_queue() {
    // web advanceRecruitmentGated: while (n < maxPerTurn && rq.length) -- N=1 przy dwoch w kolejce.
    let p = recruit_prod(vec![unit("Wojownik", 10.0), unit("Wojownik", 10.0)]);
    let r = advance_recruitment_gated(&p, (1000.0, Some(1000.0)), 1.0, 1.0, false, 1.0, 1.0);
    assert_eq!(r.completed.len(), 1, "max 1 na ture");
    assert_eq!(r.prod.rekrutacja.as_ref().map(Vec::len), Some(1));
}

#[test]
fn dequeue_out_of_range_index_is_identity() {
    // web dequeueRecruitment: indeks poza zakresem (w tym ujemny) = bez zmian.
    let p = recruit_prod(vec![unit("Wojownik", 10.0), unit("Wojownik", 10.0)]);
    for idx in [-1i64, 2, 5] {
        assert_eq!(
            dequeue_recruitment(&p, idx)
                .rekrutacja
                .as_ref()
                .map(Vec::len),
            Some(2),
            "indeks {idx}"
        );
    }
    assert_eq!(
        dequeue_recruitment(&p, 0).rekrutacja.as_ref().map(Vec::len),
        Some(1)
    );
}

#[test]
fn praca_pool_gain_queue_empty_branch() {
    // web pracaImperialPoolGain: pusta kolejka = doPuli + doBudynkow, inaczej doPuli.
    let t = PracaSplitTick {
        do_budynkow: 2.0,
        do_puli: 1.0,
    };
    assert_eq!(praca_imperial_pool_gain(&t, true), 3.0);
    assert_eq!(praca_imperial_pool_gain(&t, false), 1.0);
}

#[test]
fn preview_praca_paused_and_default_queue_empty() {
    // web previewPracaPoolBrutto: paused?.[i] pomija; queueEmpty[i] ?? true.
    let ticks = [
        PracaSplitTick {
            do_budynkow: 2.0,
            do_puli: 1.0,
        },
        PracaSplitTick {
            do_budynkow: 4.0,
            do_puli: 3.0,
        },
        PracaSplitTick {
            do_budynkow: 6.0,
            do_puli: 5.0,
        },
    ];
    // Brak paused: 1 + (3+4) + 5 = 13.
    assert_eq!(
        preview_praca_pool_brutto(&ticks, &[false, true, false], None),
        13.0
    );
    // paused[1] = true: pomija tick 1 -> 1 + 5 = 6.
    assert_eq!(
        preview_praca_pool_brutto(&ticks, &[false, true, false], Some(&[false, true, false])),
        6.0
    );
    // queueEmpty krotsze: brak = true -> tick0 1, tick1 3+4=7, tick2 5+6=11 -> 19.
    assert_eq!(preview_praca_pool_brutto(&ticks, &[false], None), 19.0);
    // paused krotsze: brak = false -> tick0 pominiety, tick1 7, tick2 5 -> 12.
    assert_eq!(
        preview_praca_pool_brutto(&ticks, &[false, true, false], Some(&[true])),
        12.0
    );
}

#[test]
fn era_catalog_wielokrotny_allows_rebuild_of_built_building() {
    // web eraBuildingCatalog: status 'built' tylko gdy !wielokrotny && built zawiera id.
    let row = |wielokrotny: Option<bool>| EraBuildingRow {
        avail: BuildingAvailRow {
            cost: BuildingCostRow {
                id: "koszary".into(),
                nazwa: "Koszary".into(),
                koszt_budowy: 30.0,
                przyrost_kosztu: 0.0,
                epoka_wejscia: Some(1.0),
                lokalizacja: None,
            },
            upgrade_from: None,
            suppressed: None,
            tech_unlock: None,
            wymagany_surowiec: None,
            odblokowuje: None,
        },
        kategoria: "wojsko".into(),
        wielokrotny,
        wymagania: None,
        koszt_surowce: None,
    };
    let built = ["koszary"];
    let ctx = EraCatalogCtx {
        epoch: 1.0,
        building_level: 1.0,
        built_building_ids: &built,
        production_queue: &[],
        is_capital: None,
        empire_resource_stock: None,
        empire_built_ids: None,
        owner_id: 0,
        difficulty: Difficulty::Normal,
    };
    let status_of = |w: Option<bool>| era_building_catalog(&[row(w)], &[], &ctx)[0].status;
    assert_eq!(status_of(None), BuildingCatalogStatus::Built);
    assert_eq!(status_of(Some(false)), BuildingCatalogStatus::Built);
    assert_eq!(status_of(Some(true)), BuildingCatalogStatus::Ready);
}

#[test]
fn output_split_negative_and_infinite_shares_clamp_to_zero() {
    // web splitOutput: udzial `Number.isFinite(s) && s >= 0 ? s : 0` (production.ts:2506-2509).
    let ujemny = OutputShares {
        produkcja: -1.0,
        pieniadz: 1.0,
        nauka: 1.0,
        rozwoj: 1.0,
    };
    let s = split_output(9.0, Some(&ujemny));
    assert_eq!(
        (s.produkcja, s.pieniadz, s.nauka, s.rozwoj),
        (0.0, 3.0, 3.0, 3.0)
    );
    let nieskonczony = OutputShares {
        produkcja: f64::INFINITY,
        pieniadz: 1.0,
        nauka: 1.0,
        rozwoj: 1.0,
    };
    let s2 = split_output(9.0, Some(&nieskonczony));
    assert_eq!(
        (s2.produkcja, s2.pieniadz, s2.nauka, s2.rozwoj),
        (0.0, 3.0, 3.0, 3.0)
    );
}
