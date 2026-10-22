//! P6.M10 - `js_array_sort_by` (TimSort V8) kontra `Array.prototype.sort` z URUCHOMIONEGO weba
//! (Node v22, pin web `edb8fb56`). Kategorie komparatorow: pelny porzadek (`num`), losowy znak
//! z remisem (`randSign`: `rand() * 2 - 1 || a - b`, jak w `pickCenterInMassSpread`), losowy
//! trojznakowy (`randTern`) i z `NaN` (`numNaN`). Porownujemy KOLEJNOSC wyniku, liczbe wywolan
//! komparatora i liczbe wywolan `rand()` - to dowodzi identycznej sekwencji porownan (merge,
//! galopowanie), nie tylko tej samej kolejnosci.

#[path = "p6_m10_vectors/common.rs"]
mod common;

use civ_engine::domain::mapgen::cluster_mass::js_array_sort_by;
use civ_engine::domain::rng::Mulberry32;
use common::*;

#[derive(Clone, Debug)]
struct Item {
    v: i64,
    id: usize,
}

#[test]
fn js_array_sort_matches_v8_including_comparator_call_counts() {
    let rows = cases("v8sort");
    assert!(rows.len() >= 600);
    let mut big_random = 0;
    for c in rows {
        let kind = s(&c["kind"]);
        let mut items: Vec<Item> = c["input"]
            .as_array()
            .expect("input")
            .iter()
            .enumerate()
            .map(|(id, v)| Item { v: i(v), id })
            .collect();
        let mut rng = Mulberry32::new(i(&c["seed"]) as u32);
        let mut rand_calls = 0usize;
        let mut cmp_calls = 0usize;
        js_array_sort_by(&mut items, |a, b| {
            cmp_calls += 1;
            let mut draw = || {
                rand_calls += 1;
                rng.next_f64()
            };
            match kind {
                "num" => (a.v - b.v) as f64,
                "randSign" => {
                    let r = draw() * 2.0 - 1.0;
                    if r == 0.0 || r.is_nan() {
                        (a.v - b.v) as f64
                    } else {
                        r
                    }
                }
                "randTern" => (draw() * 3.0).floor() - 1.0,
                "numNaN" => {
                    if a.v % 7 == 0 {
                        f64::NAN
                    } else {
                        (a.v - b.v) as f64
                    }
                }
                other => panic!("komparator {other}"),
            }
        });
        let order: Vec<usize> = items.iter().map(|x| x.id).collect();
        let want: Vec<usize> = c["order"]
            .as_array()
            .expect("order")
            .iter()
            .map(u)
            .collect();
        let name = format!("{} n={} {kind}", s(&c["name"]), i(&c["n"]));
        assert_eq!(order, want, "{name}: kolejnosc");
        assert_eq!(
            cmp_calls,
            u(&c["cmpCalls"]),
            "{name}: liczba wywolan komparatora"
        );
        assert_eq!(
            rand_calls,
            u(&c["randCalls"]),
            "{name}: liczba wywolan rand()"
        );
        if kind.starts_with("rand") && i(&c["n"]) >= 128 {
            big_random += 1;
        }
    }
    assert!(
        big_random > 100,
        "za malo duzych losowych sortowan: {big_random}"
    );
}

#[test]
fn js_array_sort_is_stable_for_equal_keys() {
    let mut items: Vec<Item> = (0..300)
        .map(|id| Item {
            v: (id % 5) as i64,
            id,
        })
        .collect();
    js_array_sort_by(&mut items, |a, b| (a.v - b.v) as f64);
    for w in items.windows(2) {
        assert!(w[0].v < w[1].v || (w[0].v == w[1].v && w[0].id < w[1].id));
    }
}
