//! RR-T6 API tests of the asset registry (CPU only): stale handles,
//! reference counting, RAII scopes, "new before old" replacement, cache
//! eviction, listener tokens and budget arithmetic.

use std::cell::Cell;
use std::rc::Rc;

use civ_renderer::assets::{
    kinds, AssetError, Assets, Budget, Cache, CachePolicy, FakeEvent, FakeGpu, FakeResource,
    Growth, Listeners, Metric, Registry, RegistryStats, Release, ResourceKind, Scope, Snapshot,
};

type R = FakeResource;

fn buf(gpu: &FakeGpu, bytes: u64) -> R {
    gpu.alloc(ResourceKind::Buffer, bytes)
}

fn assert_mirrors(stats: &RegistryStats, gpu: &FakeGpu) {
    for kind in ResourceKind::ALL {
        assert_eq!(stats.kind(kind).live, gpu.live(kind), "live {kind:?}");
    }
    assert_eq!(stats.total_live_bytes(), gpu.live_bytes());
}

#[test]
fn stale_handle_is_an_error_not_a_panic() {
    let gpu = FakeGpu::new();
    let mut reg: Registry<R> = Registry::new();
    let h = reg.insert::<kinds::Buffer>("a", 64, buf(&gpu, 64));
    assert!(reg.contains(h));
    assert_eq!(reg.release(h), Ok(Release::Freed { bytes: 64 }));
    assert_eq!(
        gpu.live_total(),
        0,
        "release must reach the resource's Drop"
    );

    let stale = Err(AssetError::Stale { handle: h.raw() });
    assert!(!reg.contains(h));
    assert_eq!(reg.get(h).map(|_| ()), stale);
    assert_eq!(reg.get_mut(h).map(|_| ()), stale);
    assert_eq!(reg.ref_count(h).map(|_| ()), stale);
    assert_eq!(reg.retain(h).map(|_| ()), stale);
    assert_eq!(reg.release(h).map(|_| ()), stale, "no double free");
    assert_eq!(reg.label(h).map(|_| ()), stale);

    // The slot is reused with a new generation; the old handle stays stale.
    let h2 = reg.insert::<kinds::Buffer>("b", 32, buf(&gpu, 32));
    assert_eq!(h2.raw().index(), h.raw().index());
    assert_ne!(h2.raw().generation(), h.raw().generation());
    assert!(reg.get(h).is_err());
    assert_eq!(reg.get(h2).map(FakeResource::bytes), Ok(32));
    assert_eq!(reg.slot_capacity(), 1);
    let s = reg.stats();
    assert_eq!(s.kind(ResourceKind::Buffer).created, 2);
    assert_eq!(s.kind(ResourceKind::Buffer).destroyed, 1);
    assert_mirrors(&s, &gpu);
    let msg = reg.release(h).unwrap_err().to_string();
    assert!(msg.contains("stale buffer handle"), "{msg}");
}

#[test]
fn handle_from_another_registry_is_rejected() {
    let gpu = FakeGpu::new();
    let mut a: Registry<R> = Registry::new();
    let mut b: Registry<R> = Registry::new();
    let ha = a.insert::<kinds::Texture>("a", 1, gpu.alloc(ResourceKind::Texture, 1));
    let _hb = b.insert::<kinds::Texture>("b", 1, gpu.alloc(ResourceKind::Texture, 1));
    assert_eq!(
        b.release(ha),
        Err(AssetError::ForeignRegistry {
            handle: ha.raw(),
            registry: b.id()
        })
    );
    assert_eq!(gpu.live_total(), 2);
}

#[test]
fn reference_counting_frees_on_last_release() {
    let gpu = FakeGpu::new();
    let mut reg: Registry<R> = Registry::new();
    let h = reg.insert::<kinds::Pipeline>("lambert", 0, gpu.alloc(ResourceKind::Pipeline, 0));
    reg.retain(h).unwrap();
    reg.retain(h).unwrap();
    assert_eq!(reg.ref_count(h), Ok(3));
    assert_eq!(reg.release(h), Ok(Release::StillReferenced { refs: 2 }));
    assert_eq!(reg.release(h), Ok(Release::StillReferenced { refs: 1 }));
    assert_eq!(gpu.live(ResourceKind::Pipeline), 1);
    assert_eq!(reg.release(h), Ok(Release::Freed { bytes: 0 }));
    assert_eq!(gpu.live(ResourceKind::Pipeline), 0);
    assert_eq!(reg.stats().kind(ResourceKind::Pipeline).peak_live, 1);
}

#[test]
fn registry_replace_creates_new_before_freeing_old() {
    let gpu = FakeGpu::with_event_log();
    let mut reg: Registry<R> = Registry::new();
    let old = reg.insert::<kinds::Buffer>("city v1", 100, buf(&gpu, 100));
    let old_id = reg.get(old).unwrap().id();
    let _ = gpu.take_events();

    let new = reg.replace(old, "city v2", 200, buf(&gpu, 200)).unwrap();
    let new_id = reg.get(new).unwrap().id();
    assert_eq!(
        gpu.take_events(),
        vec![
            FakeEvent::Alloc {
                id: new_id,
                kind: ResourceKind::Buffer
            },
            FakeEvent::Free {
                id: old_id,
                kind: ResourceKind::Buffer
            },
        ],
        "new must exist before old is freed"
    );
    assert!(reg.get(old).is_err());
    assert_eq!(reg.stats().kind(ResourceKind::Buffer).live, 1);
    assert_eq!(reg.stats().kind(ResourceKind::Buffer).live_bytes, 200);

    // Replacing through a stale handle: error, nothing inserted, the new
    // resource is dropped (no leak).
    let before = reg.stats();
    assert_eq!(
        reg.replace(old, "bad", 1, buf(&gpu, 1)),
        Err(AssetError::Stale { handle: old.raw() })
    );
    assert_eq!(reg.stats(), before);
    assert_mirrors(&reg.stats(), &gpu);
}

#[test]
fn owned_replace_creates_new_before_freeing_old_and_keeps_shared_old() {
    let gpu = FakeGpu::with_event_log();
    let assets: Assets<R> = Assets::new();
    let mut model = assets
        .insert::<kinds::Buffer>("m1", 10, buf(&gpu, 10))
        .unwrap();
    let old_id = model.with_resource(FakeResource::id).unwrap();
    let _ = gpu.take_events();
    model.replace("m2", 20, buf(&gpu, 20)).unwrap();
    let new_id = model.with_resource(FakeResource::id).unwrap();
    assert_eq!(
        gpu.take_events(),
        vec![
            FakeEvent::Alloc {
                id: new_id,
                kind: ResourceKind::Buffer
            },
            FakeEvent::Free {
                id: old_id,
                kind: ResourceKind::Buffer
            },
        ]
    );

    // If someone else still references the old resource, replace only
    // drops this guard's reference.
    let other = model.clone();
    model.replace("m3", 30, buf(&gpu, 30)).unwrap();
    assert_eq!(gpu.live(ResourceKind::Buffer), 2);
    assert_eq!(other.ref_count(), Ok(1));
    drop(other);
    assert_eq!(gpu.live(ResourceKind::Buffer), 1);
    assert_mirrors(&assets.stats().unwrap(), &gpu);
}

#[test]
fn owned_guards_count_references() {
    let gpu = FakeGpu::new();
    let assets: Assets<R> = Assets::new();
    let a = assets
        .insert::<kinds::Texture>("badge", 4096, gpu.alloc(ResourceKind::Texture, 4096))
        .unwrap();
    let b = a.clone();
    let c = b.clone();
    assert_eq!(a.ref_count(), Ok(3));
    drop(a);
    drop(b);
    assert_eq!(gpu.live_total(), 1);
    let h = c.handle();
    drop(c);
    assert_eq!(gpu.live_total(), 0);
    assert_eq!(
        assets.with(|reg| reg.get(h).map(|_| ())).unwrap(),
        Err(AssetError::Stale { handle: h.raw() })
    );
}

#[test]
fn scope_releases_everything_it_created_on_drop() {
    let gpu = FakeGpu::new();
    let assets: Assets<R> = Assets::new();
    let shared_geometry = assets
        .insert::<kinds::Buffer>("box", 1000, buf(&gpu, 1000))
        .unwrap();
    {
        let mut scope = Scope::new(&assets, "battle");
        for i in 0..16 {
            scope
                .insert::<kinds::Buffer>(format!("unit {i}"), 64, buf(&gpu, 64))
                .unwrap();
        }
        let tex = scope
            .insert::<kinds::Texture>(
                "battlefield",
                1 << 20,
                gpu.alloc(ResourceKind::Texture, 1 << 20),
            )
            .unwrap();
        scope.share(&shared_geometry).unwrap();
        assert_eq!(scope.len(), 18);
        assert_eq!(scope.label(), "battle");
        assert_eq!(shared_geometry.ref_count(), Ok(2));
        assert!(assets.with(|reg| reg.contains(tex)).unwrap());
        assert_eq!(gpu.live_total(), 18);
    }
    assert_eq!(gpu.live_total(), 1, "only the shared geometry survives");
    assert_eq!(shared_geometry.ref_count(), Ok(1));
    assert_mirrors(&assets.stats().unwrap(), &gpu);

    // A guard from a foreign registry is refused and released normally.
    let other: Assets<R> = Assets::new();
    let foreign = other.insert::<kinds::Buffer>("x", 1, buf(&gpu, 1)).unwrap();
    let mut scope = Scope::new(&assets, "s");
    assert!(matches!(
        scope.adopt(foreign),
        Err(AssetError::ForeignRegistry { .. })
    ));
    assert!(scope.is_empty());
    assert_eq!(gpu.live_total(), 1);
}

#[test]
fn drop_and_clone_inside_with_are_deferred_not_panicking() {
    let gpu = FakeGpu::new();
    let assets: Assets<R> = Assets::new();
    let a = assets
        .insert::<kinds::Buffer>("a", 8, buf(&gpu, 8))
        .unwrap();
    let b = assets
        .insert::<kinds::Buffer>("b", 8, buf(&gpu, 8))
        .unwrap();
    let mut kept = None;
    assets
        .with(|reg| {
            assert_eq!(reg.stats().kind(ResourceKind::Buffer).live, 2);
            kept = Some(b.clone()); // deferred retain
            drop(a); // deferred release
                     // Re-entrant access is an error, not a panic.
            assert_eq!(assets.flush(), Err(AssetError::Busy));
        })
        .unwrap();
    assert_eq!(gpu.live_total(), 1, "deferred release applied after with()");
    drop(b);
    assert_eq!(gpu.live_total(), 1, "deferred retain keeps b alive");
    drop(kept);
    assert_eq!(gpu.live_total(), 0);
    assert_mirrors(&assets.stats().unwrap(), &gpu);
}

#[test]
fn cache_lru_by_entries_and_bytes() {
    let gpu = FakeGpu::new();
    let assets: Assets<R> = Assets::new();
    let mut cache: Cache<&str, kinds::Texture, R> =
        Cache::new(&assets, CachePolicy::max_entries(2));
    let tex =
        |gpu: &FakeGpu, name: &str| (name.to_owned(), 100, gpu.alloc(ResourceKind::Texture, 100));
    let a = cache.get_or_insert_with("a", || tex(&gpu, "a")).unwrap();
    drop(cache.get_or_insert_with("b", || tex(&gpu, "b")).unwrap());
    assert!(cache.get(&"a").is_some()); // a is now most recently used
    drop(cache.get_or_insert_with("c", || tex(&gpu, "c")).unwrap());
    assert!(cache.contains_key(&"a"));
    assert!(!cache.contains_key(&"b"), "b was least recently used");
    assert!(cache.contains_key(&"c"));
    assert_eq!(cache.stats().evicted_lru, 1);
    assert_eq!(cache.stats().misses, 3);
    assert_eq!(cache.stats().hits, 1);
    assert_eq!(gpu.live_total(), 2);

    // Evicting an entry that is still referenced keeps the resource alive.
    drop(cache.get_or_insert_with("d", || tex(&gpu, "d")).unwrap());
    drop(cache.get_or_insert_with("e", || tex(&gpu, "e")).unwrap());
    assert!(!cache.contains_key(&"a"));
    assert_eq!(gpu.live_total(), 3, "a (held outside) + d + e");
    drop(a);
    assert_eq!(gpu.live_total(), 2);

    let mut by_bytes: Cache<u32, kinds::Buffer, R> = Cache::new(
        &assets,
        CachePolicy {
            max_entries: None,
            max_bytes: Some(250),
        },
    );
    for k in 0..5 {
        drop(
            by_bytes
                .get_or_insert_with(k, || (format!("g{k}"), 100, buf(&gpu, 100)))
                .unwrap(),
        );
    }
    assert_eq!(by_bytes.len(), 2);
    assert_eq!(by_bytes.bytes(), 200);
    assert_eq!(by_bytes.policy().max_bytes, Some(250));
    by_bytes.clear();
    cache.clear();
    assert!(by_bytes.is_empty() && cache.is_empty());
    assert_eq!(gpu.live_total(), 0);
    assert_mirrors(&assets.stats().unwrap(), &gpu);
}

#[test]
fn cache_end_of_turn_trims_only_unreferenced_entries() {
    let gpu = FakeGpu::new();
    let assets: Assets<R> = Assets::new();
    let mut cache: Cache<u32, kinds::Texture, R> = Cache::new(&assets, CachePolicy::UNBOUNDED);
    let held = cache
        .get_or_insert_with(1, || {
            ("held".into(), 10, gpu.alloc(ResourceKind::Texture, 10))
        })
        .unwrap();
    for k in 2..10 {
        drop(
            cache
                .get_or_insert_with(k, || {
                    (format!("t{k}"), 10, gpu.alloc(ResourceKind::Texture, 10))
                })
                .unwrap(),
        );
    }
    assert_eq!(cache.len(), 9);
    assert_eq!(cache.end_of_turn(), Ok(8));
    assert_eq!(cache.len(), 1);
    assert!(cache.contains_key(&1));
    assert_eq!(cache.stats().trimmed_unreferenced, 8);
    assert_eq!(gpu.live_total(), 1);
    drop(held);
    assert_eq!(cache.end_of_turn(), Ok(1));
    assert!(!cache.remove(&1));
    assert_eq!(gpu.live_total(), 0);
}

#[derive(Debug)]
enum Ui {
    Click,
    Resize,
}

#[test]
fn subscriptions_unregister_on_drop() {
    let ui: Listeners<Ui> = Listeners::new();
    let clicks = Rc::new(Cell::new(0));
    let resizes = Rc::new(Cell::new(0));
    let c = Rc::clone(&clicks);
    let s1 = ui
        .subscribe(move |e| {
            if matches!(e, Ui::Click) {
                c.set(c.get() + 1);
            }
        })
        .unwrap();
    let r = Rc::clone(&resizes);
    let s2 = ui
        .subscribe(move |e| {
            if matches!(e, Ui::Resize) {
                r.set(r.get() + 1);
            }
        })
        .unwrap();
    assert_eq!(ui.active(), 2);
    assert_eq!(ui.emit(&Ui::Click), Ok(2));
    assert_eq!(clicks.get(), 1);
    assert!(s1.is_active());
    drop(s1);
    assert_eq!(ui.active(), 1);
    assert_eq!(
        Rc::strong_count(&clicks),
        1,
        "closure dropped with its token"
    );
    assert_eq!(ui.emit(&Ui::Resize), Ok(1));
    assert_eq!(resizes.get(), 1);
    drop(s2);
    let stats = ui.stats();
    assert_eq!(
        (stats.subscribed, stats.unsubscribed, stats.active),
        (2, 2, 0)
    );
}

#[test]
fn subscription_dropped_inside_callback_is_removed_after_emit() {
    let ui: Listeners<Ui> = Listeners::new();
    let slot: Rc<Cell<Option<civ_renderer::assets::Subscription>>> = Rc::new(Cell::new(None));
    let slot2 = Rc::clone(&slot);
    let ui2 = ui.clone();
    let sub = ui
        .subscribe(move |_| {
            drop(slot2.take()); // self-unsubscribe during emit
            assert_eq!(ui2.emit(&Ui::Click), Err(AssetError::Busy));
            assert!(ui2.subscribe(|_| {}).is_err());
        })
        .unwrap();
    slot.set(Some(sub));
    assert_eq!(ui.active(), 1);
    assert_eq!(ui.emit(&Ui::Resize), Ok(1));
    assert_eq!(ui.active(), 0);
    assert_eq!(ui.emit(&Ui::Resize), Ok(0));

    // Token outliving its list: dropping it is a no-op.
    let late = {
        let tmp: Listeners<Ui> = Listeners::new();
        tmp.subscribe(|_| {}).unwrap()
    };
    assert!(!late.is_active());
    drop(late);
}

fn snap(turn: u32, buffers: u64, bytes: u64, subs: u64) -> Snapshot {
    let mut s = RegistryStats::default();
    s.per_kind[ResourceKind::Buffer.index()].live = buffers;
    s.per_kind[ResourceKind::Buffer.index()].live_bytes = bytes;
    Snapshot::new(turn, s, subs)
}

#[test]
fn budget_thresholds_are_configurable() {
    let base = snap(10, 100, 1000, 2);
    let same = snap(200, 100, 1000, 2);
    let less = snap(200, 90, 900, 0);
    let more = snap(200, 101, 1000, 3);
    let budget = Budget::default();
    assert_eq!(budget, Budget::no_growth());
    assert!(budget.check(&base, &same).is_ok());
    assert!(budget.check(&base, &less).is_ok());
    let v = budget.check(&base, &more).unwrap_err();
    assert_eq!(v.len(), 2);
    assert_eq!(v[0].metric, Metric::LiveCount(ResourceKind::Buffer));
    assert_eq!((v[0].baseline, v[0].current, v[0].allowed), (100, 101, 100));
    assert_eq!(v[1].metric, Metric::Subscriptions);
    assert_eq!(
        v[0].to_string(),
        "live buffer: baseline=100 current=101 allowed=100"
    );

    let mut loose = Budget::no_growth();
    loose.live_count[ResourceKind::Buffer.index()] = Growth {
        absolute: 0,
        percent: 10,
    };
    loose.subscriptions = Growth {
        absolute: 1,
        percent: 0,
    };
    assert!(loose.check(&base, &more).is_ok());
    assert_eq!(
        Growth {
            absolute: 5,
            percent: 10
        }
        .allowed(100),
        115
    );

    loose.hard_cap_live[ResourceKind::Buffer.index()] = Some(100);
    let v = loose.check(&base, &more).unwrap_err();
    assert_eq!(v[0].metric, Metric::HardCap(ResourceKind::Buffer));
    assert!(snap(7, 1, 2, 3)
        .to_string()
        .starts_with("turn=  7 buffer=1 texture=0"));
}

#[test]
fn live_report_lists_labels() {
    let gpu = FakeGpu::new();
    let mut reg: Registry<R> = Registry::new();
    let a = reg.insert::<kinds::Buffer>("terrain chunk 0", 64, buf(&gpu, 64));
    let _b =
        reg.insert::<kinds::BindGroup>("city 3 material", 0, gpu.alloc(ResourceKind::BindGroup, 0));
    reg.release(a).unwrap();
    let live: Vec<(String, u64, u32)> = reg
        .live()
        .map(|e| (e.label.to_owned(), e.bytes, e.refs))
        .collect();
    assert_eq!(live, vec![("city 3 material".to_owned(), 0, 1)]);
}
