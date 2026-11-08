//! REPIN-AUTOIMPROVE (R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1, hunki 4, 20, 27, 71): port
//! `gra/src/game/road-network-plan.ts` (`planRoadNetwork`, web `origin/main` 180c08305).
//!
//! Plan sieci drogowej MIEDZY MIASTAMI jednej cywilizacji (R-WEB-AI-ROADS-CITY-LINKS-ONLY-Q1): MST (Kruskal) po
//! realnej dlugosci sciezki (Dijkstra po heksach ladu), istniejace drogi sa tanie, kolejne krawedzie chetnie
//! wchodza w juz zaplanowany pien, wygladzenie trojkatow. Czysta, deterministyczna funkcja; calkowite koszty
//! (setne kroku), wiec remisy bez bledow zmiennoprzecinkowych.
//!
//! ZALOZENIA: (1) klucze heksow jako `(q, r)` zamiast napisow `"q,r"` - porzadek wynikowy `byQR` to porownanie
//! numeryczne `(q, r)`, identyczne z webowym sortowaniem po sparsowanych liczbach; (2) `isTraversable` to
//! `Option<&dyn Fn(i32, i32) -> bool>`; (3) wspolrzedne sa calkowite (web: liczby calkowite z `"q,r"`).

use std::cmp::{Ordering, Reverse};
use std::collections::{BTreeMap, BTreeSet, BinaryHeap, HashMap, HashSet};

use crate::domain::improvement_build::{hex_has_road, BuildMap};
use crate::domain::improvements::TerrainType;

/// Web `RoadPlanCity`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RoadPlanCity {
    pub id: String,
    pub q: i32,
    pub r: i32,
}

/// Web `RoadNetworkPlanOpts`.
#[derive(Clone, Copy, Default)]
pub struct RoadNetworkPlanOpts<'a> {
    /// Czy heks wolno uzyc w sciezce; `None` = kazdy heks ladu. Miasta sa zawsze dozwolone.
    pub is_traversable: Option<&'a dyn Fn(i32, i32) -> bool>,
    /// Heksy z juz postawiona droga spoza mapy (np. warstwy zaplanowane w tym wywolaniu).
    pub extra_road_keys: Option<&'a BTreeSet<(i32, i32)>>,
}

/// Web `RoadNetworkPlan`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct RoadNetworkPlan {
    /// Heksy do pokrycia droga (bez heksow miast), posortowane (q, r).
    pub hexes: Vec<(i32, i32)>,
    /// Wybrane krawedzie MST: id miast i koszt sciezki.
    pub edges: Vec<RoadEdge>,
    /// Pary miast bez sciezki w zasiegu (komponenty rozlaczne).
    pub disconnected: usize,
}

/// Krawedz MST (`{ a, b, cost }`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RoadEdge {
    pub a: String,
    pub b: String,
    pub cost: i64,
}

const DIRS: [(i32, i32); 6] = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)];
const COST_BASE: i64 = 100;
const COST_HILLS: i64 = 150;
const COST_MOUNTAIN: i64 = 600;
const COST_ROAD: i64 = 10;
const COST_CITY: i64 = 1;
const COST_PLANNED: i64 = 5;
/// Liczba geometrycznie najblizszych sasiadow, z ktorymi liczone sa kandydackie krawedzie MST.
const NEAREST_K: usize = 5;

type Key = (i32, i32);

fn axial_dist(a: Key, b: Key) -> i64 {
    let dq = i64::from(a.0) - i64::from(b.0);
    let dr = i64::from(a.1) - i64::from(b.1);
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2
}

fn is_land(t: TerrainType) -> bool {
    matches!(
        t,
        TerrainType::Laka
            | TerrainType::Rownina
            | TerrainType::Wzgorza
            | TerrainType::Gory
            | TerrainType::Pustynia
    )
}

struct Dijkstra {
    dist: HashMap<Key, i64>,
    parent: HashMap<Key, Key>,
}

struct Ctx<'a> {
    map: &'a BuildMap,
    opts: RoadNetworkPlanOpts<'a>,
    city_at: HashSet<Key>,
    base_memo: std::cell::RefCell<HashMap<Key, i64>>,
}

impl Ctx<'_> {
    /// Web `baseCost`: -1 = nieprzejezdny.
    fn base_cost(&self, k: Key) -> i64 {
        if let Some(v) = self.base_memo.borrow().get(&k) {
            return *v;
        }
        let v = if self.city_at.contains(&k) {
            COST_CITY
        } else {
            match self.map.hex(&format!("{},{}", k.0, k.1)) {
                None => -1,
                Some(hex) if !is_land(hex.terrain) => -1,
                Some(_) if self.opts.is_traversable.is_some_and(|f| !f(k.0, k.1)) => -1,
                Some(hex) => {
                    if self.opts.extra_road_keys.is_some_and(|e| e.contains(&k))
                        || hex_has_road(hex)
                    {
                        COST_ROAD
                    } else if hex.terrain == TerrainType::Gory {
                        COST_MOUNTAIN
                    } else if hex.terrain == TerrainType::Wzgorza {
                        COST_HILLS
                    } else {
                        COST_BASE
                    }
                }
            }
        };
        self.base_memo.borrow_mut().insert(k, v);
        v
    }

    /// Dijkstra z miasta `from`; konczy, gdy wszystkie `targets` sa rozliczone; `cap` ucina za drogie sciezki.
    fn dijkstra(
        &self,
        src: Key,
        targets: &HashSet<Key>,
        planned: Option<&HashSet<Key>>,
        cap: i64,
    ) -> Dijkstra {
        let mut dist: HashMap<Key, i64> = HashMap::new();
        let mut parent: HashMap<Key, Key> = HashMap::new();
        let mut done: HashSet<Key> = HashSet::new();
        let mut heap: BinaryHeap<Reverse<(i64, i32, i32)>> = BinaryHeap::new();
        dist.insert(src, 0);
        heap.push(Reverse((0, src.0, src.1)));
        let mut left = targets.len() as i64;
        while let Some(Reverse((c, q, r))) = heap.pop() {
            let ck = (q, r);
            if done.contains(&ck) {
                continue;
            }
            done.insert(ck);
            if targets.contains(&ck) {
                left -= 1;
                if left <= 0 {
                    break;
                }
            }
            for d in DIRS {
                let nk = (q + d.0, r + d.1);
                if done.contains(&nk) {
                    continue;
                }
                let mut w = self.base_cost(nk);
                if w < 0 {
                    continue;
                }
                if planned.is_some_and(|p| p.contains(&nk)) && w > COST_PLANNED {
                    w = COST_PLANNED;
                }
                let nd = c + w;
                if nd > cap {
                    continue;
                }
                let better = match dist.get(&nk) {
                    None => true,
                    Some(old) => nd < *old,
                };
                if better {
                    dist.insert(nk, nd);
                    parent.insert(nk, ck);
                    heap.push(Reverse((nd, nk.0, nk.1)));
                }
            }
        }
        Dijkstra { dist, parent }
    }
}

fn find(uf: &mut [usize], mut x: usize) -> usize {
    while uf[x] != x {
        uf[x] = uf[uf[x]];
        x = uf[x];
    }
    x
}

fn by_qr(a: &Key, b: &Key) -> Ordering {
    a.0.cmp(&b.0).then(a.1.cmp(&b.1))
}

/// Web `planRoadNetwork`: plan sieci drogowej (MST po dlugosci sciezki) dla miast JEDNEGO wlasciciela.
pub fn plan_road_network(
    cities: &[RoadPlanCity],
    map: &BuildMap,
    opts: RoadNetworkPlanOpts,
) -> RoadNetworkPlan {
    let mut sorted: Vec<&RoadPlanCity> = cities.iter().collect();
    sorted.sort_by(|a, b| super::cmp_js_str(&a.id, &b.id));
    let n = sorted.len();
    if n < 2 {
        return RoadNetworkPlan::default();
    }
    let key_of_city: Vec<Key> = sorted.iter().map(|c| (c.q, c.r)).collect();
    let ctx = Ctx {
        map,
        opts,
        city_at: key_of_city.iter().copied().collect(),
        base_memo: std::cell::RefCell::new(HashMap::new()),
    };
    let mut planned: HashSet<Key> = HashSet::new();

    // 1) kandydackie krawedzie: kazde miasto z NEAREST_K geometrycznie najblizszymi.
    let mut edge_seen: HashSet<usize> = HashSet::new();
    let mut edges: Vec<(usize, usize, i64)> = Vec::new();
    let mut push_edge = |i: usize, j: usize, cost: i64| {
        let (a, b) = (i.min(j), i.max(j));
        if edge_seen.insert(a * n + b) {
            edges.push((a, b, cost));
        }
    };
    for i in 0..n {
        let mut near: Vec<(usize, i64)> = (0..n)
            .filter(|&j| j != i)
            .map(|j| (j, axial_dist(key_of_city[i], key_of_city[j])))
            .collect();
        near.sort_by(|x, y| x.1.cmp(&y.1).then(x.0.cmp(&y.0)));
        near.truncate(NEAREST_K);
        let targets: HashSet<Key> = near.iter().map(|t| key_of_city[t.0]).collect();
        let last_d = near.last().map_or(1, |t| t.1);
        let cap = COST_BASE * 3 * last_d + COST_MOUNTAIN;
        let res = ctx.dijkstra(key_of_city[i], &targets, None, cap);
        for t in &near {
            if let Some(d) = res.dist.get(&key_of_city[t.0]) {
                push_edge(i, t.0, *d);
            }
        }
    }
    edges.sort_by(|x, y| x.2.cmp(&y.2).then(x.0.cmp(&y.0)).then(x.1.cmp(&y.1)));

    // 2) Kruskal.
    let mut uf: Vec<usize> = (0..n).collect();
    let mut chosen: Vec<(usize, usize, i64)> = Vec::new();
    for e in &edges {
        let a = find(&mut uf, e.0);
        let b = find(&mut uf, e.1);
        if a == b {
            continue;
        }
        uf[a] = b;
        chosen.push(*e);
    }

    // 2b) uzupelnienie: rozlaczne skladowe lacz najblizsza para miast.
    let mut tried: HashSet<(usize, usize)> = HashSet::new();
    loop {
        let mut comps: BTreeMap<usize, Vec<usize>> = BTreeMap::new();
        for i in 0..n {
            let r = find(&mut uf, i);
            comps.entry(r).or_default().push(i);
        }
        if comps.len() <= 1 {
            break;
        }
        let mut best: Option<(usize, usize, i64, (usize, usize))> = None;
        let roots: Vec<usize> = comps.keys().copied().collect(); // BTreeMap = rosnaco (web: sort a-b)
        for x in 0..roots.len() {
            for y in (x + 1)..roots.len() {
                let pk = (roots[x], roots[y]);
                if tried.contains(&pk) {
                    continue;
                }
                for &i in &comps[&roots[x]] {
                    for &j in &comps[&roots[y]] {
                        let d = axial_dist(key_of_city[i], key_of_city[j]);
                        let take = match &best {
                            None => true,
                            Some(b) => d < b.2 || (d == b.2 && (i < b.0 || (i == b.0 && j < b.1))),
                        };
                        if take {
                            best = Some((i, j, d, pk));
                        }
                    }
                }
            }
        }
        let Some(best) = best else { break };
        tried.insert(best.3);
        let targets: HashSet<Key> = std::iter::once(key_of_city[best.1]).collect();
        let res = ctx.dijkstra(key_of_city[best.0], &targets, None, i64::MAX);
        let Some(d) = res.dist.get(&key_of_city[best.1]).copied() else {
            continue;
        };
        let a = find(&mut uf, best.0);
        let b = find(&mut uf, best.1);
        if a != b {
            uf[a] = b;
            chosen.push((best.0.min(best.1), best.0.max(best.1), d));
        }
    }
    let roots_after: BTreeSet<usize> = (0..n).map(|i| find(&mut uf, i)).collect();
    let disconnected = roots_after.len() - 1;

    // 3) sciezki wybranych krawedzi: kolejne wchodza chetnie w juz zaplanowany pien.
    for e in &chosen {
        let targets: HashSet<Key> = std::iter::once(key_of_city[e.1]).collect();
        let res = ctx.dijkstra(key_of_city[e.0], &targets, Some(&planned), i64::MAX);
        let mut k = key_of_city[e.1];
        let start_key = key_of_city[e.0];
        while k != start_key {
            if !ctx.city_at.contains(&k) {
                planned.insert(k);
            }
            match res.parent.get(&k) {
                None => break,
                Some(p) => k = *p,
            }
        }
    }

    // 4) wygladzenie: heks w trojkacie jest zbedny, gdy jego sasiedzi pozostaja polaczeni bez niego.
    let mut net: HashSet<Key> = planned.iter().copied().collect();
    net.extend(key_of_city.iter().copied());
    let nbs_in_net = |net: &HashSet<Key>, k: Key| -> Vec<Key> {
        DIRS.iter()
            .map(|d| (k.0 + d.0, k.1 + d.1))
            .filter(|x| net.contains(x))
            .collect()
    };
    let mut snapshot: Vec<Key> = planned.iter().copied().collect();
    snapshot.sort_by(by_qr);
    for h in snapshot {
        let nb = nbs_in_net(&net, h);
        let mut in_triangle = false;
        'outer: for i in 0..nb.len() {
            for j in (i + 1)..nb.len() {
                if axial_dist(nb[i], nb[j]) == 1 {
                    in_triangle = true;
                    break 'outer;
                }
            }
        }
        if !in_triangle {
            continue;
        }
        net.remove(&h);
        let mut seen: HashSet<Key> = HashSet::new();
        seen.insert(nb[0]);
        let mut st = vec![nb[0]];
        while let Some(x) = st.pop() {
            for y in nbs_in_net(&net, x) {
                if seen.insert(y) {
                    st.push(y);
                }
            }
        }
        if nb.iter().all(|x| seen.contains(x)) {
            planned.remove(&h);
        } else {
            net.insert(h);
        }
    }

    let mut hexes: Vec<Key> = planned.into_iter().collect();
    hexes.sort_by(by_qr);
    RoadNetworkPlan {
        hexes,
        edges: chosen
            .iter()
            .map(|e| RoadEdge {
                a: sorted[e.0].id.clone(),
                b: sorted[e.1].id.clone(),
                cost: e.2,
            })
            .collect(),
        disconnected,
    }
}
