//! RR-T8d "N turns do not grow the texture count" (P4-3 §7.3 points 4 and
//! 7, class M2) on the CPU fake backend (`assets::FakeGpu` counts every
//! allocation and free).
//!
//! The simulation drives the T14 city badges the way `CityRenderer` does
//! (`cities.ts:850-878`, `syncStatChips` `:562-577`): every turn every city
//! gets a key from the PORTED `cityMapBadgeKey` (bit-exact with the web,
//! `tests/atlas_keys.rs`), growth/production/population/hover/capital/LOD
//! change on a fixed seed, cities are founded and razed. Expected: the live
//! texture count equals the number of distinct keys on screen after every
//! sync, and never exceeds the number of cities — at turn 10, 50 and 200
//! alike. The same run WITHOUT the prune (the pin's `statTexCache`) grows
//! without bound, which shows the test discriminates.

mod atlas_json;

use std::collections::{BTreeMap, BTreeSet};

use atlas_json::fnv1a64;
use civ_renderer::assets::{
    Assets, CachePolicy, FakeGpu, FakeResource, ResourceKind, DEFAULT_BASELINE_TURN,
};
use civ_renderer::core::zoom_lod::city_badge_lod_level_for_dist;
use civ_renderer::raster::atlas::cache::{BadgeTextures, TextureCache};
use civ_renderer::raster::atlas::keys::{city_map_badge_key, CityMapBadgeInput};
use civ_renderer::raster::atlas::scale::badge_canvas_px;

const TURNS: u32 = 200;
const MAX_CITIES: usize = 40;

struct Rng(u32);
impl Rng {
    fn next(&mut self) -> u32 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.0 = x;
        x
    }
    fn below(&mut self, n: u32) -> u32 {
        self.next() % n
    }
    fn chance(&mut self, num: u32, den: u32) -> bool {
        self.below(den) < num
    }
}

#[derive(Clone)]
struct City {
    input: CityMapBadgeInput,
}

struct World {
    rng: Rng,
    cities: BTreeMap<String, City>,
    next_id: u32,
    dist: f64,
}

impl World {
    fn new(seed: u32) -> Self {
        let mut w = World {
            rng: Rng(seed),
            cities: BTreeMap::new(),
            next_id: 0,
            dist: 20.0,
        };
        for _ in 0..12 {
            w.found();
        }
        w
    }

    fn found(&mut self) {
        let id = format!("c{}", self.next_id);
        self.next_id += 1;
        let civ =
            ["grecy", "rzymianie", "zulusi", "egipcjanie", "persowie"][self.rng.below(5) as usize];
        let input = CityMapBadgeInput {
            city_name: format!("Miasto {}", self.next_id),
            population: 1.0,
            defense_tier: 0,
            civ_icon_id: civ.to_owned(),
            growth_percent: Some(f64::from(self.rng.below(200)) / 10.0),
            era: Some(1.0),
            ..CityMapBadgeInput::default()
        };
        self.cities.insert(id, City { input });
    }

    /// One AI turn: every city's numbers move, some cities are founded or
    /// razed, the camera moves.
    fn step(&mut self, turn: u32) {
        if self.cities.len() < MAX_CITIES && self.rng.chance(1, 3) {
            self.found();
        }
        if self.cities.len() > 6 && self.rng.chance(1, 10) {
            let n = self
                .rng
                .below(u32::try_from(self.cities.len()).expect("count"))
                as usize;
            let id = self.cities.keys().nth(n).cloned().expect("city");
            self.cities.remove(&id);
        }
        let rng = &mut self.rng;
        for c in self.cities.values_mut() {
            let a = &mut c.input;
            a.growth_percent = Some(f64::from(rng.below(4001)) / 20.0 - 100.0);
            a.growth_starving = rng.chance(1, 12);
            if rng.chance(1, 6) {
                a.population = (a.population + 1.0).min(30.0);
            }
            if rng.chance(1, 4) {
                a.prod_active = rng.chance(3, 4);
                a.prod_kind = Some(
                    if rng.chance(1, 2) {
                        "budynek"
                    } else {
                        "jednostka"
                    }
                    .to_owned(),
                );
                a.prod_id = Some(format!("item{}", rng.below(25)));
            }
            a.defense_tier = u8::try_from(rng.below(3)).expect("tier");
            a.resource_warning = rng.chance(1, 5);
            a.hover_expanded = rng.chance(1, 40);
            a.is_capital = rng.chance(1, 15);
            a.era = Some(f64::from(1 + turn / 70));
        }
        // Camera: zoom in and out across the LOD thresholds (5.5 / 11).
        self.dist = [20.0, 9.0, 4.0, 15.0, 7.5, 3.0][((turn / 17) % 6) as usize];
    }

    fn lod(&self) -> f64 {
        f64::from(city_badge_lod_level_for_dist(self.dist).as_u8())
    }
}

fn paint(fake: &FakeGpu, key: &str, input: &CityMapBadgeInput) -> (String, u64, FakeResource) {
    // Declared size: the T14 canvas (W estimated from the name, H 48/70 CSS
    // px) at DPI 2 × LOD, RGBA8, no mipmaps (`LinearFilter`).
    let w = 120.0 + 12.0 * input.city_name.chars().count() as f64;
    let h = if input.hover_expanded { 70.0 } else { 48.0 };
    let px = badge_canvas_px(w, h, Some(2.0), input.lod_level);
    let bytes = u64::from(px.width) * u64::from(px.height) * 4;
    (
        key.to_owned(),
        bytes,
        fake.alloc(ResourceKind::Texture, bytes),
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TurnStat {
    turn: u32,
    cities: usize,
    live_keys: usize,
    live_textures: u64,
    cached: usize,
    created: u64,
}

fn run(seed: u32, policy: CachePolicy) -> (Vec<TurnStat>, u64) {
    let fake = FakeGpu::new();
    let assets: Assets<FakeResource> = Assets::new();
    let mut badges = BadgeTextures::new(&assets, policy);
    let mut world = World::new(seed);
    let mut stats = Vec::new();
    let mut shown: BTreeSet<String> = BTreeSet::new();
    for turn in 1..=TURNS {
        world.step(turn);
        let lod = world.lod();
        badges.set_lod_level(Some(lod));
        let present: BTreeSet<String> = world.cities.keys().cloned().collect();
        for id in shown.difference(&present) {
            assert!(badges.remove(id), "razed city had a badge");
        }
        shown = present;
        for (id, c) in &world.cities {
            let mut input = c.input.clone();
            input.lod_level = Some(lod);
            let key = city_map_badge_key(&input);
            badges
                .sync(id, &key, || paint(&fake, &key, &input))
                .expect("sync");
        }
        badges.finish_sync();
        badges.cache_mut().end_of_turn().expect("end of turn");
        let reg = assets.stats().expect("stats");
        let s = TurnStat {
            turn,
            cities: world.cities.len(),
            live_keys: badges.live_key_count(),
            live_textures: fake.live(ResourceKind::Texture),
            cached: badges.cache().len(),
            created: fake.allocations(),
        };
        assert_eq!(
            reg.kind(ResourceKind::Texture).live,
            s.live_textures,
            "registry == fake"
        );
        stats.push(s);
    }
    drop(badges);
    assets.flush().expect("flush");
    assert_eq!(
        fake.live_total(),
        0,
        "everything freed when the renderer goes"
    );
    let trace: Vec<u8> = stats
        .iter()
        .flat_map(|s| {
            [
                s.turn as u64,
                s.cities as u64,
                s.live_keys as u64,
                s.live_textures,
                s.cached as u64,
                s.created,
            ]
            .into_iter()
            .flat_map(u64::to_le_bytes)
        })
        .collect();
    (stats, fnv1a64(&trace))
}

#[test]
fn n200_turns_texture_count_is_bounded_by_live_badges() {
    let (stats, _) = run(0x5eed_0031, CachePolicy::UNBOUNDED);
    for s in &stats {
        assert_eq!(
            s.live_textures, s.live_keys as u64,
            "turn {}: textures == distinct live keys",
            s.turn
        );
        assert_eq!(
            s.cached, s.live_keys,
            "turn {}: cache holds only live keys",
            s.turn
        );
        assert!(
            s.live_keys <= s.cities,
            "turn {}: ≤ one texture per city",
            s.turn
        );
    }
    let at = |t: u32| stats[(t - 1) as usize];
    let (t10, t50, t200) = (at(DEFAULT_BASELINE_TURN), at(50), at(200));
    eprintln!("turn 10: {t10:?}\nturn 50: {t50:?}\nturn 200: {t200:?}");
    // Normalised on the number of cities: no growth (P4-3 §7.3 point 7).
    for s in [t10, t50, t200] {
        assert!(s.live_textures <= s.cities as u64);
    }
    // Plenty of churn really happened (the test is not vacuous).
    assert!(
        t200.created > 20 * MAX_CITIES as u64,
        "created {}",
        t200.created
    );
    // Growth of the texture count from turn 10 to 200 ≤ growth in cities.
    let city_growth = (t200.cities as u64).saturating_sub(t10.cities as u64);
    let tex_growth = t200.live_textures.saturating_sub(t10.live_textures);
    assert!(
        tex_growth <= city_growth,
        "texture growth {tex_growth} > city growth {city_growth}"
    );
}

#[test]
fn without_prune_the_pin_cache_grows() {
    // The pin's `statTexCache`: a Map that only drops textures on a LOD
    // change. Same world, same keys, a `TextureCache` with no prune and no
    // end-of-turn trim — only the LOD purge.
    let fake = FakeGpu::new();
    let assets: Assets<FakeResource> = Assets::new();
    let mut cache = TextureCache::new(&assets, CachePolicy::UNBOUNDED);
    let mut world = World::new(0x5eed_0031);
    let mut lod_prev = None;
    let mut sprites: BTreeMap<String, civ_renderer::raster::atlas::TextureRef<FakeResource>> =
        BTreeMap::new();
    let mut max_cached = 0;
    for turn in 1..=TURNS {
        world.step(turn);
        let lod = world.lod();
        sprites.retain(|id, _| world.cities.contains_key(id));
        for (id, c) in &world.cities {
            let mut input = c.input.clone();
            input.lod_level = Some(lod);
            let key = city_map_badge_key(&input);
            let t = cache
                .acquire(&key, || paint(&fake, &key, &input))
                .expect("acquire");
            sprites.insert(id.clone(), t);
        }
        if lod_prev != Some(lod.to_bits()) {
            cache.purge_other_lod(Some(lod));
            lod_prev = Some(lod.to_bits());
        }
        max_cached = max_cached.max(cache.len());
    }
    eprintln!(
        "pin model: max cached {max_cached}, live fake textures {}",
        fake.live(ResourceKind::Texture)
    );
    assert!(
        max_cached > 10 * MAX_CITIES,
        "the M2 growth is reproduced ({max_cached})"
    );
}

#[test]
fn lru_bound_keeps_shown_textures_alive() {
    // A tight LRU (8 entries) evicts keys still on screen: the cache stops
    // finding them, but the sprites keep their reference (no use-after-free,
    // no premature free): live textures == live keys, cache ≤ 8.
    let (stats, _) = run(0x5eed_0031, CachePolicy::max_entries(8));
    for s in &stats {
        assert!(s.cached <= 8, "turn {}: cache {}", s.turn, s.cached);
        assert_eq!(s.live_textures, s.live_keys as u64, "turn {}", s.turn);
    }
}

#[test]
fn nturns_is_deterministic() {
    let (_, a) = run(0x5eed_0031, CachePolicy::UNBOUNDED);
    let (_, b) = run(0x5eed_0031, CachePolicy::UNBOUNDED);
    let (_, c) = run(0x0bad_cafe, CachePolicy::UNBOUNDED);
    assert_eq!(a, b, "same seed, same trace");
    assert_ne!(a, c, "the trace depends on the run");
}

#[test]
fn shared_key_is_one_texture_with_refcount() {
    let fake = FakeGpu::new();
    let assets: Assets<FakeResource> = Assets::new();
    let mut badges = BadgeTextures::new(&assets, CachePolicy::UNBOUNDED);
    let input = CityMapBadgeInput {
        city_name: "Ateny".into(),
        population: 3.0,
        civ_icon_id: "grecy".into(),
        ..CityMapBadgeInput::default()
    };
    let key = city_map_badge_key(&input);
    assert!(badges
        .sync("a", &key, || paint(&fake, &key, &input))
        .expect("a"));
    assert!(badges
        .sync("b", &key, || panic!("cached: no repaint"))
        .expect("b"));
    assert!(!badges
        .sync("a", &key, || panic!("same key: no work"))
        .expect("a again"));
    assert_eq!(fake.live(ResourceKind::Texture), 1);
    assert_eq!(badges.texture("a").expect("a").ref_count().expect("rc"), 3); // cache + 2 slots
    badges.remove("a");
    assert_eq!(badges.texture("b").expect("b").ref_count().expect("rc"), 2);
    badges.remove("b");
    assert_eq!(badges.finish_sync(), (0, 1));
    assets.flush().expect("flush");
    assert_eq!(fake.live(ResourceKind::Texture), 0);
}

#[test]
fn rebuild_in_place_1000_cycles_returns_to_start() {
    // P4-3 §7.3 point 7, "przebudowa w miejscu": population 1 → 10 → 1 and a
    // production switch, 1000 times; the counters return exactly.
    let fake = FakeGpu::new();
    let assets: Assets<FakeResource> = Assets::new();
    let mut badges = BadgeTextures::new(&assets, CachePolicy::UNBOUNDED);
    let mut input = CityMapBadgeInput {
        city_name: "Teby".into(),
        population: 1.0,
        civ_icon_id: "grecy".into(),
        ..CityMapBadgeInput::default()
    };
    let sync = |badges: &mut BadgeTextures<FakeResource>, input: &CityMapBadgeInput| {
        let key = city_map_badge_key(input);
        badges
            .sync("t", &key, || paint(&fake, &key, input))
            .expect("sync");
        badges.finish_sync();
        badges.cache_mut().end_of_turn().expect("eot");
    };
    sync(&mut badges, &input);
    let start = (fake.live(ResourceKind::Texture), fake.live_bytes());
    for i in 0..1000 {
        input.population = 10.0;
        input.prod_active = i % 2 == 0;
        input.prod_kind = Some("budynek".into());
        input.prod_id = Some("koszary".into());
        sync(&mut badges, &input);
        input.population = 1.0;
        input.prod_active = false;
        sync(&mut badges, &input);
    }
    assets.flush().expect("flush");
    assert_eq!((fake.live(ResourceKind::Texture), fake.live_bytes()), start);
    assert_eq!(
        fake.frees() + 1,
        fake.allocations(),
        "every replaced texture was freed"
    );
}

#[test]
fn lod_change_purges_the_old_level_before_the_prune() {
    // `setBadgeZoomLod` → `syncStatChips` → `disposeCityMapBadgeTexturesForOtherLod`
    // (`cities.ts:562-577`, `:582-588`): after a level change the old-level
    // textures go in the LOD purge, so the prune finds nothing left.
    let fake = FakeGpu::new();
    let assets: Assets<FakeResource> = Assets::new();
    let mut badges = BadgeTextures::new(&assets, CachePolicy::UNBOUNDED);
    let sync_all = |badges: &mut BadgeTextures<FakeResource>, lod: f64| {
        for n in ["Ateny", "Sparta", "Teby"] {
            let input = CityMapBadgeInput {
                city_name: n.into(),
                population: 2.0,
                civ_icon_id: "grecy".into(),
                lod_level: Some(lod),
                ..CityMapBadgeInput::default()
            };
            let key = city_map_badge_key(&input);
            badges
                .sync(n, &key, || paint(&fake, &key, &input))
                .expect("sync");
        }
        badges.finish_sync()
    };
    assert!(badges.set_lod_level(Some(0.0)));
    assert_eq!(sync_all(&mut badges, 0.0), (0, 0));
    assert!(!badges.set_lod_level(Some(0.0)), "same level: no work");
    assert_eq!(sync_all(&mut badges, 0.0), (0, 0));
    assert!(badges.set_lod_level(Some(2.0)));
    assert_eq!(
        sync_all(&mut badges, 2.0),
        (3, 0),
        "3 old-level textures purged"
    );
    assert!(badges.cache().keys().all(|k| k.ends_with("|l2")));
    assets.flush().expect("flush");
    assert_eq!(fake.live(ResourceKind::Texture), 3);
}
