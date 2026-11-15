//! Size measurement of the snapshot (criterion 4, contract §4.1, D-DTO-3).
//!
//! `cargo run --release --example snapshot_size` prints, for the synthetic
//! 3000- and 8000-hex maps of `tests/common/mod.rs` (web "lite" thresholds,
//! `render/mapRenderStyle.ts:50`, `:52` @ `07d2fbd72`): the compact JSON size
//! of the full snapshot, of the static map, of the dynamic layers and of the
//! per-hex part of the layers (`hexState` + `fog`), plus serialize /
//! deserialize times (median of N runs; machine-dependent).
//!
//! The byte counts are deterministic (seeded generator); unit and city counts
//! are assumptions printed with the result (the web count is NIE_ZMIERZONO).

#[path = "../tests/common/mod.rs"]
mod common;

use civ_view_model::{RenderLayersDto, RenderViewDto};
use common::{synthetic_view, SCENARIOS};
use std::time::{Duration, Instant};

const RUNS: usize = 15;

fn median(mut v: Vec<Duration>) -> Duration {
    v.sort();
    v[v.len() / 2]
}

fn ms(d: Duration) -> f64 {
    d.as_secs_f64() * 1000.0
}

fn main() {
    println!(
        "| scenariusz | heksy | miasta | jednostki | pelny JSON [B] | mapa statyczna [B] | warstwy [B] | hexState+fog [B] | B/heks (pelny) | B/heks (hexState+fog) | ser. pelny [ms] | deser. pelny [ms] | ser. warstwy [ms] |"
    );
    println!("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
    for s in &SCENARIOS {
        let view = synthetic_view(s);
        view.validate().expect("valid synthetic snapshot");
        let full = serde_json::to_string(&view).unwrap();
        let (map, layers) = view.clone().split();
        let map_json = serde_json::to_string(&map).unwrap();
        let layers_json = serde_json::to_string(&layers).unwrap();
        let hex_part = serde_json::to_string(&layers.hex_state).unwrap().len()
            + serde_json::to_string(&layers.fog).unwrap().len();

        let mut ser = Vec::with_capacity(RUNS);
        let mut de = Vec::with_capacity(RUNS);
        let mut ser_layers = Vec::with_capacity(RUNS);
        for _ in 0..RUNS {
            let t = Instant::now();
            let text = serde_json::to_string(&view).unwrap();
            ser.push(t.elapsed());
            let t = Instant::now();
            let back: RenderViewDto = serde_json::from_str(&text).unwrap();
            de.push(t.elapsed());
            assert_eq!(back, view);
            let t = Instant::now();
            let lt = serde_json::to_string(&layers).unwrap();
            ser_layers.push(t.elapsed());
            let _: RenderLayersDto = serde_json::from_str(&lt).unwrap();
        }

        let n = s.hexes() as usize;
        println!(
            "| {} | {} | {} | {} | {} | {} | {} | {} | {:.1} | {:.1} | {:.2} | {:.2} | {:.2} |",
            s.name,
            n,
            view.cities.len(),
            view.units.len(),
            full.len(),
            map_json.len(),
            layers_json.len(),
            hex_part,
            full.len() as f64 / n as f64,
            hex_part as f64 / n as f64,
            ms(median(ser)),
            ms(median(de)),
            ms(median(ser_layers)),
        );
    }
}
