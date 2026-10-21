//! RR-T6 regression test "N turns does not grow resources" (P4.3 §7.3
//! point 7, CPU variant), on the fake GPU backend.
//!
//! A deterministic turn simulation (fixed-seed LCG, no game engine)
//! reproduces the three turn-dependent web leak patterns of P4.3 §7.1:
//! - **M1** city model rebuilt on every population/era/walls change;
//! - **M2** badge texture per (name, population, production, growth %, era);
//! - **M3** battle scene registering UI listeners whose closures capture
//!   the scene.
//!
//! `Variant::Fixed` uses the registry mechanisms (shared geometry cache,
//! `Owned::replace`, LRU + end-of-turn trim, `Scope`, `Subscription`).
//! Each `Variant::LeakMx` reproduces exactly one web pattern ("without
//! freeing") and must break the budget — this proves the test detects a
//! leak. Measured numbers are written to stderr (visible without
//! `--nocapture`).

use std::cell::Cell;
use std::collections::HashMap;
use std::io::Write;
use std::rc::Rc;

use civ_renderer::assets::{
    kinds, Assets, Budget, Cache, CachePolicy, FakeGpu, FakeResource, Listeners, Metric, Owned,
    ResourceKind, Scope, Snapshot, Subscription, DEFAULT_BASELINE_TURN, DEFAULT_CHECK_TURNS,
};

type R = FakeResource;

fn report(line: &str) {
    let _ = writeln!(std::io::stderr().lock(), "{line}");
}

/// Deterministic 64-bit LCG (Knuth MMIX constants); no `rand` dependency.
struct Lcg(u64);

impl Lcg {
    fn next_u32(&mut self) -> u32 {
        self.0 = self
            .0
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        (self.0 >> 33) as u32
    }
    fn below(&mut self, n: u32) -> u32 {
        self.next_u32() % n
    }
}

#[derive(Clone, Copy, Debug)]
struct MapSize {
    name: &'static str,
    width: u32,
    height: u32,
    cities: usize,
}

const SMALL: MapSize = MapSize {
    name: "small 40x25",
    width: 40,
    height: 25,
    cities: 6,
};
const LARGE: MapSize = MapSize {
    name: "large 96x60",
    width: 96,
    height: 60,
    cities: 24,
};
const SIZES: [MapSize; 2] = [SMALL, LARGE];
const CHUNK: u32 = 8;
const MAX_LEVEL: u8 = 10;
const SEED: u64 = 0x5EED_0006;
const BATTLE_EVERY: u32 = 5;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Variant {
    Fixed,
    LeakM1,
    LeakM2,
    LeakM3,
}

/// The primitives the web city builders allocate per call (P4.3 §7.1 M1:
/// Box/Cylinder/Cone/Circle in `miasto-braz.ts` / `miasto-kamien.ts`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
enum Prim {
    Box,
    Cylinder,
    Cone,
    Circle,
}
const PRIMS: [Prim; 4] = [Prim::Box, Prim::Cylinder, Prim::Cone, Prim::Circle];

struct City {
    pop: u8,
    era: u8,
    walls: bool,
    production: u16,
    growth_pct: u8,
}

impl City {
    /// Web: `visualKey = style|era|civ|level|wallKind`, `level = population`.
    fn visual_key(&self) -> (u8, u8, bool) {
        (self.pop, self.era, self.walls)
    }
}

/// Web: `cityMapBadgeKey` (name, population, production, growth %, era ...).
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
struct BadgeKey {
    city: usize,
    pop: u8,
    production: u16,
    growth_pct: u8,
    era: u8,
}

struct CityModel {
    key: (u8, u8, bool),
    _geometry: Vec<Owned<kinds::Buffer, R>>,
    /// Fixed-capacity instance buffer (houses up to MAX_LEVEL), written in
    /// place on rebuild (P4.3 §7.3 point 3).
    _instances: Owned<kinds::Buffer, R>,
    material: Owned<kinds::Buffer, R>,
    bind_group: Owned<kinds::BindGroup, R>,
}

enum UiEvent {
    Click,
    Resize,
}

struct BattleState {
    _scope: Scope<R>,
    events: Cell<u32>,
}

struct Sim {
    variant: Variant,
    gpu: FakeGpu,
    assets: Assets<R>,
    rng: Lcg,
    turn: u32,
    _session: Scope<R>,
    geometry: Cache<(Prim, u8), kinds::Buffer, R>,
    badges: Cache<BadgeKey, kinds::Texture, R>,
    leaky_badges: HashMap<BadgeKey, Owned<kinds::Texture, R>>,
    cities: Vec<City>,
    models: Vec<CityModel>,
    city_badges: Vec<Option<Owned<kinds::Texture, R>>>,
    ui: Listeners<UiEvent>,
    _map_hover: Subscription,
    battles: u32,
}

impl Sim {
    fn new(size: MapSize, variant: Variant, seed: u64) -> Self {
        Self::new_on(&Assets::new(), &FakeGpu::new(), size, variant, seed)
    }

    fn new_on(
        assets: &Assets<R>,
        gpu: &FakeGpu,
        size: MapSize,
        variant: Variant,
        seed: u64,
    ) -> Self {
        let mut session = Scope::new(assets, "game session");
        // Static terrain: one vertex buffer per chunk, an atlas, 3 shading
        // paths (Lambert / Standard / Basic, P4.4 §1.2) with bind groups.
        let chunks = size.width.div_ceil(CHUNK) * size.height.div_ceil(CHUNK);
        for c in 0..chunks {
            let bytes = u64::from(CHUNK * CHUNK) * 6 * 32;
            session
                .insert::<kinds::Buffer>(
                    format!("terrain chunk {c}"),
                    bytes,
                    gpu.alloc(ResourceKind::Buffer, bytes),
                )
                .unwrap();
        }
        session
            .insert::<kinds::Texture>(
                "terrain atlas",
                1 << 22,
                gpu.alloc(ResourceKind::Texture, 1 << 22),
            )
            .unwrap();
        for name in ["lambert", "standard", "basic"] {
            session
                .insert::<kinds::Pipeline>(name, 0, gpu.alloc(ResourceKind::Pipeline, 0))
                .unwrap();
            session
                .insert::<kinds::BindGroup>(
                    format!("{name} globals"),
                    0,
                    gpu.alloc(ResourceKind::BindGroup, 0),
                )
                .unwrap();
        }
        let ui: Listeners<UiEvent> = Listeners::new();
        // One permanent map listener (lives as long as the session).
        let map_hover = ui.subscribe(|_| {}).unwrap();
        let mut sim = Self {
            variant,
            gpu: gpu.clone(),
            assets: assets.clone(),
            rng: Lcg(seed),
            turn: 0,
            _session: session,
            geometry: Cache::new(assets, CachePolicy::UNBOUNDED),
            badges: Cache::new(assets, CachePolicy::max_entries(size.cities * 2)),
            leaky_badges: HashMap::new(),
            cities: Vec::new(),
            models: Vec::new(),
            city_badges: Vec::new(),
            ui,
            _map_hover: map_hover,
            battles: 0,
        };
        for _ in 0..size.cities {
            let city = City {
                pop: 1 + sim.rng.below(3) as u8,
                era: 0,
                walls: false,
                production: sim.rng.below(40) as u16,
                growth_pct: sim.rng.below(100) as u8,
            };
            sim.cities.push(city);
        }
        for i in 0..size.cities {
            let model = sim.build_model(i);
            sim.models.push(model);
            sim.city_badges.push(None);
            sim.update_badge(i);
        }
        sim.end_of_turn();
        sim
    }

    fn shared_geometry(&mut self, prim: Prim) -> Owned<kinds::Buffer, R> {
        let gpu = &self.gpu;
        self.geometry
            .get_or_insert_with((prim, 0), || {
                (
                    format!("{prim:?} unit mesh"),
                    4096,
                    gpu.alloc(ResourceKind::Buffer, 4096),
                )
            })
            .unwrap()
    }

    fn build_model(&mut self, i: usize) -> CityModel {
        let key = self.cities[i].visual_key();
        let geometry: Vec<_> = if self.variant == Variant::LeakM1 {
            // Web M1: fresh Box/Cylinder/Cone/Circle geometry per call.
            PRIMS
                .iter()
                .map(|p| {
                    self.assets
                        .insert::<kinds::Buffer>(
                            format!("city {i} {p:?}"),
                            4096,
                            self.gpu.alloc(ResourceKind::Buffer, 4096),
                        )
                        .unwrap()
                })
                .collect()
        } else {
            PRIMS.iter().map(|&p| self.shared_geometry(p)).collect()
        };
        let inst_bytes = u64::from(MAX_LEVEL) * 64;
        let a = &self.assets;
        let g = &self.gpu;
        CityModel {
            key,
            _geometry: geometry,
            _instances: a
                .insert(
                    format!("city {i} instances"),
                    inst_bytes,
                    g.alloc(ResourceKind::Buffer, inst_bytes),
                )
                .unwrap(),
            material: a
                .insert(
                    format!("city {i} material {key:?}"),
                    256,
                    g.alloc(ResourceKind::Buffer, 256),
                )
                .unwrap(),
            bind_group: a
                .insert(
                    format!("city {i} bind group {key:?}"),
                    0,
                    g.alloc(ResourceKind::BindGroup, 0),
                )
                .unwrap(),
        }
    }

    fn rebuild_if_needed(&mut self, i: usize) {
        let key = self.cities[i].visual_key();
        if self.models[i].key == key {
            return;
        }
        if self.variant == Variant::LeakM1 {
            // Web: scene.remove(grp) + _disposeModel that frees nothing the
            // builders created -> the old model is never released.
            let new = self.build_model(i);
            let old = std::mem::replace(&mut self.models[i], new);
            std::mem::forget(old);
        } else {
            // Fix: shared geometry stays, instances are rewritten in place,
            // per-city material is swapped new-before-old.
            let g = &self.gpu;
            let m = &mut self.models[i];
            m.material
                .replace(
                    format!("city {i} material {key:?}"),
                    256,
                    g.alloc(ResourceKind::Buffer, 256),
                )
                .unwrap();
            m.bind_group
                .replace(
                    format!("city {i} bind group {key:?}"),
                    0,
                    g.alloc(ResourceKind::BindGroup, 0),
                )
                .unwrap();
            m.key = key;
        }
    }

    fn update_badge(&mut self, i: usize) {
        let c = &self.cities[i];
        let key = BadgeKey {
            city: i,
            pop: c.pop,
            production: c.production,
            growth_pct: c.growth_pct,
            era: c.era,
        };
        let bytes = 128 * 32 * 4;
        let gpu = &self.gpu;
        let label = format!("badge {key:?}");
        let make = move || (label, bytes, gpu.alloc(ResourceKind::Texture, bytes));
        let tex = if self.variant == Variant::LeakM2 {
            // Web M2: Map cache, entries removed only on LOD change.
            if let Some(t) = self.leaky_badges.get(&key) {
                t.clone()
            } else {
                let (label, bytes, res) = make();
                let t = self
                    .assets
                    .insert::<kinds::Texture>(label, bytes, res)
                    .unwrap();
                self.leaky_badges.insert(key, t.clone());
                t
            }
        } else {
            self.badges.get_or_insert_with(key, make).unwrap()
        };
        self.city_badges[i] = Some(tex);
    }

    fn run_battle(&mut self) {
        self.battles += 1;
        let mut scope = Scope::new(&self.assets, format!("battle {}", self.battles));
        for u in 0..16 {
            scope
                .insert::<kinds::Buffer>(
                    format!("unit {u}"),
                    2048,
                    self.gpu.alloc(ResourceKind::Buffer, 2048),
                )
                .unwrap();
        }
        scope
            .insert::<kinds::Texture>(
                "battlefield",
                1 << 20,
                self.gpu.alloc(ResourceKind::Texture, 1 << 20),
            )
            .unwrap();
        scope
            .insert::<kinds::BindGroup>(
                "battle globals",
                0,
                self.gpu.alloc(ResourceKind::BindGroup, 0),
            )
            .unwrap();
        let shared = self.shared_geometry(Prim::Box);
        scope.share(&shared).unwrap();
        drop(shared);
        let state = Rc::new(BattleState {
            _scope: scope,
            events: Cell::new(0),
        });
        // Web: document click + window resize listeners capturing `this`.
        let s1 = Rc::clone(&state);
        let s2 = Rc::clone(&state);
        let subs = vec![
            self.ui
                .subscribe(move |e| {
                    if matches!(e, UiEvent::Click) {
                        s1.events.set(s1.events.get() + 1);
                    }
                })
                .unwrap(),
            self.ui
                .subscribe(move |e| {
                    if matches!(e, UiEvent::Resize) {
                        s2.events.set(s2.events.get() + 1);
                    }
                })
                .unwrap(),
        ];
        self.ui.emit(&UiEvent::Click).unwrap();
        self.ui.emit(&UiEvent::Resize).unwrap();
        assert!(state.events.get() >= 2);
        if self.variant == Variant::LeakM3 {
            // Web M3: removeEventListener never called.
            for s in subs {
                std::mem::forget(s);
            }
        } else {
            drop(subs);
        }
        drop(state); // leaving the battle
    }

    fn end_of_turn(&mut self) {
        self.badges.end_of_turn().unwrap();
        self.geometry.end_of_turn().unwrap();
    }

    fn step(&mut self) {
        self.turn += 1;
        for i in 0..self.cities.len() {
            let roll = self.rng.below(6);
            let c = &mut self.cities[i];
            match roll {
                0 if c.pop < MAX_LEVEL => c.pop += 1,
                1 if c.pop > 1 => c.pop -= 1,
                _ => {}
            }
            c.production = self.rng.below(40) as u16;
            c.growth_pct = self.rng.below(100) as u8;
            let c = &mut self.cities[i];
            if self.turn % 60 == (i as u32 % 60) && c.era < 4 {
                c.era += 1;
            }
            if self.turn % 37 == (i as u32 % 37) {
                c.walls = !c.walls;
            }
            self.rebuild_if_needed(i);
            self.update_badge(i);
        }
        if self.turn % BATTLE_EVERY == 2 {
            self.run_battle();
        }
        self.end_of_turn();
    }

    fn snapshot(&self) -> Snapshot {
        let stats = self.assets.stats().unwrap();
        // Registry bookkeeping must equal what the backend really holds.
        for kind in ResourceKind::ALL {
            assert_eq!(
                stats.kind(kind).live,
                self.gpu.live(kind),
                "turn {} {kind:?}",
                self.turn
            );
        }
        assert_eq!(stats.total_live_bytes(), self.gpu.live_bytes());
        Snapshot::new(self.turn, stats, self.ui.active())
    }
}

fn checkpoints() -> Vec<u32> {
    let mut c = vec![DEFAULT_BASELINE_TURN];
    c.extend(DEFAULT_CHECK_TURNS);
    c
}

fn run(size: MapSize, variant: Variant) -> Vec<Snapshot> {
    let mut sim = Sim::new(size, variant, SEED);
    let points = checkpoints();
    let last = *points.last().unwrap();
    let mut out = Vec::new();
    while sim.turn < last {
        sim.step();
        if points.contains(&sim.turn) {
            let s = sim.snapshot();
            report(&format!("[{:?} {}] {s}", variant, size.name));
            out.push(s);
        }
    }
    out
}

#[test]
fn fixed_registry_stays_within_budget_after_10_50_200_turns() {
    let budget = Budget::default();
    for size in SIZES {
        let snaps = run(size, Variant::Fixed);
        let base = &snaps[0];
        assert_eq!(base.turn, DEFAULT_BASELINE_TURN);
        for s in &snaps[1..] {
            if let Err(v) = budget.check(base, s) {
                panic!("{} turn {}: {v:?}", size.name, s.turn);
            }
            // Stronger than the budget: the steady state is exact.
            for kind in ResourceKind::ALL {
                assert_eq!(s.live(kind), base.live(kind), "{} {kind:?}", size.name);
            }
            assert!(
                s.resources.total_created() > base.resources.total_created(),
                "resources churn"
            );
        }
        report(&format!(
            "[Fixed {}] budget OK at turns {:?}",
            size.name, DEFAULT_CHECK_TURNS
        ));
    }
}

#[test]
fn each_leak_pattern_breaks_the_budget() {
    let budget = Budget::default();
    let cases = [
        (Variant::LeakM1, Metric::LiveCount(ResourceKind::Buffer)),
        (Variant::LeakM2, Metric::LiveCount(ResourceKind::Texture)),
        (Variant::LeakM3, Metric::Subscriptions),
    ];
    for size in SIZES {
        for (variant, metric) in cases {
            let snaps = run(size, variant);
            let base = &snaps[0];
            for s in &snaps[1..] {
                let violations = budget
                    .check(base, s)
                    .expect_err("the leaking variant must exceed the budget");
                assert!(
                    violations.iter().any(|v| v.metric == metric),
                    "{variant:?} {} turn {}: expected {metric:?} in {violations:?}",
                    size.name,
                    s.turn
                );
                let text: Vec<String> = violations.iter().map(ToString::to_string).collect();
                report(&format!(
                    "[{variant:?} {}] turn {} violations: {}",
                    size.name,
                    s.turn,
                    text.join("; ")
                ));
            }
            // Growth continues: 200 turns leak more than 50.
            let m = |s: &Snapshot| match metric {
                Metric::LiveCount(k) => s.live(k),
                _ => s.subscriptions,
            };
            assert!(m(&snaps[2]) > m(&snaps[1]) && m(&snaps[1]) > m(base));
        }
    }
}

#[test]
fn leak_m3_also_retains_battle_scene_resources() {
    // The leaked listener closures keep the battle scene (and its scope)
    // alive, like `this` captured in the web listeners.
    let fixed = run(SMALL, Variant::Fixed);
    let leak = run(SMALL, Variant::LeakM3);
    let tex = ResourceKind::Texture;
    assert!(leak[2].live(tex) > fixed[2].live(tex));
    let battles = (200 - 2) / BATTLE_EVERY + 1;
    assert_eq!(leak[2].subscriptions, 1 + 2 * u64::from(battles));
    assert_eq!(fixed[2].subscriptions, 1);
}

#[test]
fn simulation_is_deterministic() {
    for variant in [Variant::Fixed, Variant::LeakM1] {
        assert_eq!(run(SMALL, variant), run(SMALL, variant));
    }
}

#[test]
fn rebuild_in_place_1000_cycles_returns_to_initial_state() {
    // P4.3 §7.3: "1 000 cycles of population 1→10→1, production change,
    // battle enter/exit → resource counter returns exactly to the start".
    let mut sim = Sim::new(SMALL, Variant::Fixed, SEED);
    let start = sim.snapshot();
    for cycle in 0..1000u32 {
        for pop in (1..=MAX_LEVEL).chain((1..MAX_LEVEL).rev()) {
            sim.cities[0].pop = pop;
            sim.rebuild_if_needed(0);
        }
        sim.cities[0].production = (cycle % 40) as u16;
        sim.update_badge(0);
        sim.run_battle();
        sim.end_of_turn();
    }
    let end = sim.snapshot();
    report(&format!("[rebuild 1000 cycles] start: {start}"));
    report(&format!("[rebuild 1000 cycles] end:   {end}"));
    for kind in ResourceKind::ALL {
        assert_eq!(end.live(kind), start.live(kind), "{kind:?}");
    }
    assert_eq!(
        end.resources.total_live_bytes(),
        start.resources.total_live_bytes()
    );
    assert_eq!(end.subscriptions, start.subscriptions);
    assert!(end.resources.total_created() > start.resources.total_created() + 1000 * 18);
}

#[test]
fn new_game_frees_everything_and_restarts_identically() {
    // M6: no free-standing dispose functions; dropping the session frees all.
    let assets: Assets<R> = Assets::new();
    let gpu = FakeGpu::new();
    let mut first = Sim::new_on(&assets, &gpu, LARGE, Variant::Fixed, SEED);
    for _ in 0..10 {
        first.step();
    }
    let first10 = first.snapshot();
    for _ in 10..50 {
        first.step();
    }
    drop(first);
    let after = assets.stats().unwrap();
    report(&format!(
        "[new game] after dropping game 1: live={} live_bytes={} fake_gpu_live={}",
        after.total_live(),
        after.total_live_bytes(),
        gpu.live_total()
    ));
    assert_eq!(after.total_live(), 0);
    assert_eq!(gpu.live_total(), 0);
    assert_eq!(gpu.live_bytes(), 0);

    let mut second = Sim::new_on(&assets, &gpu, LARGE, Variant::Fixed, SEED);
    for _ in 0..10 {
        second.step();
    }
    let second10 = second.snapshot();
    for kind in ResourceKind::ALL {
        assert_eq!(second10.live(kind), first10.live(kind));
    }
    assert_eq!(
        second10.resources.total_live_bytes(),
        first10.resources.total_live_bytes()
    );
}
