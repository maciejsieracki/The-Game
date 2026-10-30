//! REPIN-WOJNA-NOWE-D (partia 1): planner `planWarAllInCapital` z `gra/src/game/warAllInCapital.ts`
//! (pin `dc8a3adc`, :593-859). Wydzielony z `war_all_in_capital.rs` (limit 600 LOC na partie).
//!
//! web: :364-372 (`Cluster`), :593 (`planWarAllInCapital`), :601 (`targetGoal`), :618
//! (`clusterGoal`), :772 (`emit`), :786 (`tryGoal`), :784 (`resolve`), :823 (`runPass`).
//! ZALOZENIA: patrz `war_all_in_capital.rs` (W1/W2 poza zakresem partii 1).

use std::cmp::Ordering;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::rc::Rc;

use crate::domain::pathfinding::ruch_jednostek::{hex_distance, Klucz};

use super::war_all_in_capital::{
    cmp_target, nearest_target, war_allin_params, WarAllInMode, WarAllInOrder, WarAllInPlan,
    WarAllInPlanOpts, WarAllInUnit, WarCapitalTarget,
};
use super::war_all_in_capital_nav::{
    choose_step, distance_field, extend_walk, Field, Goal, StepResult, StepState, WarAllInNav,
};

// Planner (`planWarAllInCapital`, web :593)
// ---------------------------------------------------------------------------

/// Grupa jednostek (web `Cluster`, `warAllInCapital.ts:371`). Bez pola `engage` (W1 poza zakresem).
#[derive(Debug, Clone)]
struct Cluster {
    members: Vec<WarAllInUnit>,
    anchor: WarAllInUnit,
    target: WarCapitalTarget,
    dist_to_target: i64,
    min_id: String,
    /// Indeks wiekszej/wczesniejszej grupy tego samego celu, do ktorej ta dolacza.
    rendezvous: Option<usize>,
}

/// Wynik pojedynczej proby celu (web `tryGoal`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Try {
    Step,
    /// 'stop' (zatrzymanie: marsz na stolice).
    Stop,
    /// 'next' z ewentualnym `hold` (web `sawHold`).
    Next {
        hold: bool,
    },
}

struct Planner<'a> {
    nav: &'a WarAllInNav<'a>,
    opts: WarAllInPlanOpts,
    targets: &'a [WarCapitalTarget],
    clusters: &'a [Cluster],
    all_start: HashSet<Klucz>,
    field_cache: HashMap<Klucz, Rc<Field>>,
    st: StepState,
    plan: WarAllInPlan,
}

impl<'a> Planner<'a> {
    /// Web `targetGoal` (`warAllInCapital.ts:601`): pole memoizowane per heks celu.
    fn target_goal(&mut self, t: &WarCapitalTarget) -> Goal {
        let dk = (t.q, t.r);
        let field = match self.field_cache.get(&dk) {
            Some(f) => Rc::clone(f),
            None => {
                let f = Rc::new(distance_field(self.nav, dk, &self.all_start));
                self.field_cache.insert(dk, Rc::clone(&f));
                f
            }
        };
        Goal {
            field,
            dest: dk,
            mode: WarAllInMode::Capital,
            target: t.clone(),
        }
    }

    /// Web `clusterGoal` (`warAllInCapital.ts:618`): dolaczanie `from` do kotwicy `to`.
    fn cluster_goal(&self, from: usize, to: usize) -> Goal {
        let from_c = &self.clusters[from];
        let to_c = &self.clusters[to];
        let from_set: HashSet<Klucz> = from_c.members.iter().map(|m| (m.q, m.r)).collect();
        let dest = (to_c.anchor.q, to_c.anchor.r);
        Goal {
            field: Rc::new(distance_field(self.nav, dest, &from_set)),
            dest,
            mode: WarAllInMode::Rendezvous,
            target: from_c.target.clone(),
        }
    }

    /// Web `emit` (`warAllInCapital.ts:772`).
    fn emit(&mut self, u: &WarAllInUnit, g: &Goal, walk: &[Klucz]) {
        for h in walk {
            self.st.claimed.insert(*h);
        }
        self.st.vacated.insert((u.q, u.r));
        let end = *walk
            .last()
            .expect("trasa zawiera co najmniej pierwszy heks");
        self.plan.orders.push(WarAllInOrder {
            unit_id: u.id.clone(),
            step: end,
            target_city_id: g.target.city_id.clone(),
            target_owner_id: g.target.owner_id,
            mode: g.mode,
        });
    }

    /// Web `tryGoal` (`warAllInCapital.ts:786`).
    fn try_goal(&mut self, u: &WarAllInUnit, g: &Goal) -> Try {
        let res = choose_step(self.nav, g, (u.q, u.r), &self.st);
        match res {
            StepResult::Step(first) => {
                let budget = u.ruch_left.unwrap_or(1.0);
                let walk = extend_walk(self.nav, g, &self.st, first, budget);
                self.emit(u, g, &walk);
                Try::Step
            }
            StepResult::Hold => {
                // 'capital' (i 'engage') zatrzymuje sie; 'rendezvous' idzie do nastepnego celu.
                if g.mode == WarAllInMode::Capital {
                    Try::Stop
                } else {
                    Try::Next { hold: true }
                }
            }
            StepResult::NoPath => Try::Next { hold: false },
        }
    }

    /// Web `resolve` (`warAllInCapital.ts:784`). Zwraca tryb uzytego celu (gdy wykonano krok).
    fn resolve(&mut self, u: &WarAllInUnit, c: usize, first: Option<Goal>) -> Option<WarAllInMode> {
        let mut saw_hold = false;
        if let Some(f) = first {
            match self.try_goal(u, &f) {
                Try::Step => return Some(f.mode),
                Try::Stop => {
                    self.plan.held.push(u.id.clone());
                    return None;
                }
                Try::Next { hold } => saw_hold |= hold,
            }
        }
        let cap_target = self.clusters[c].target.clone();
        let cap_goal = self.target_goal(&cap_target);
        match self.try_goal(u, &cap_goal) {
            Try::Step => return Some(cap_goal.mode),
            Try::Stop => {
                self.plan.held.push(u.id.clone());
                return None;
            }
            Try::Next { hold } => saw_hold |= hold,
        }
        let mut others: Vec<WarCapitalTarget> = self
            .targets
            .iter()
            .filter(|t| t.city_id != cap_target.city_id)
            .cloned()
            .collect();
        others.sort_by(|a, b| {
            hex_distance(u.q, u.r, a.q, a.r)
                .cmp(&hex_distance(u.q, u.r, b.q, b.r))
                .then_with(|| cmp_target(a, b))
        });
        for t in &others {
            let g = self.target_goal(t);
            match self.try_goal(u, &g) {
                Try::Step => return Some(g.mode),
                Try::Stop => {
                    self.plan.held.push(u.id.clone());
                    return None;
                }
                Try::Next { hold } => saw_hold |= hold,
            }
        }
        if saw_hold {
            self.plan.held.push(u.id.clone());
        } else {
            self.plan.no_path.push(u.id.clone());
        }
        None
    }

    /// Web `runPass` (`warAllInCapital.ts:823`): jeden przebieg po grupach; zwraca grupy, ktore
    /// w tym przebiegu faktycznie dolaczaja (rendezvous).
    fn run_pass(&mut self, pass: &[usize]) -> HashSet<usize> {
        let clusters = self.clusters;
        // (klucz odleglosci, jednostka, indeks grupy, cel kroku)
        let mut entries: Vec<(f64, WarAllInUnit, usize, Option<Goal>)> = Vec::new();
        for &ci in pass {
            let c = &clusters[ci];
            let first = c.rendezvous.map(|p| self.cluster_goal(ci, p));
            let primary_field = match &first {
                Some(g) => Rc::clone(&g.field),
                None => {
                    let t = c.target.clone();
                    self.target_goal(&t).field
                }
            };
            for u in &c.members {
                let key = primary_field
                    .get(&(u.q, u.r))
                    .copied()
                    .unwrap_or(f64::INFINITY);
                entries.push((key, u.clone(), ci, first.clone()));
            }
        }
        // Web: `a.key - b.key || id` -- przy rownych kluczach (takze Infinity) decyduje id.
        entries.sort_by(|a, b| {
            let by_key = if a.0 < b.0 {
                Ordering::Less
            } else if a.0 > b.0 {
                Ordering::Greater
            } else {
                Ordering::Equal
            };
            by_key.then_with(|| a.1.id.cmp(&b.1.id))
        });
        let mut joining = HashSet::new();
        for (_, u, ci, first) in entries {
            if self.resolve(&u, ci, first) == Some(WarAllInMode::Rendezvous) {
                joining.insert(ci);
            }
        }
        joining
    }
}

/// Web `planWarAllInCapital` (`warAllInCapital.ts:593`). Wolajacy MUSI wykonac `orders` w
/// zwroconej kolejnosci. `nav.occupied` = heksy zajete (takze spoza `units`).
pub fn plan_war_all_in_capital(
    units: &[WarAllInUnit],
    targets: &[WarCapitalTarget],
    nav: &WarAllInNav<'_>,
    opts: WarAllInPlanOpts,
) -> WarAllInPlan {
    let mut plan = WarAllInPlan::default();
    if units.is_empty() || targets.is_empty() {
        return plan;
    }
    let params = war_allin_params();

    let mut sorted: Vec<WarAllInUnit> = units.to_vec();
    sorted.sort_by(|a, b| a.id.cmp(&b.id));

    // 1) Grupy: skladowe spojnosci (lancuch odleglosci <= link_radius).
    let n = sorted.len();
    let mut parent: Vec<usize> = (0..n).collect();
    fn find(parent: &mut [usize], mut i: usize) -> usize {
        while parent[i] != i {
            parent[i] = parent[parent[i]];
            i = parent[i];
        }
        i
    }
    for i in 0..n {
        for j in (i + 1)..n {
            let (a, b) = (&sorted[i], &sorted[j]);
            if hex_distance(a.q, a.r, b.q, b.r) <= params.link_radius {
                let ra = find(&mut parent, i);
                let rb = find(&mut parent, j);
                if ra != rb {
                    parent[ra.max(rb)] = ra.min(rb);
                }
            }
        }
    }
    // Kolejnosc grup = kolejnosc pierwszego wystapienia korzenia (jak `Map` w JS).
    let mut root_order: Vec<usize> = Vec::new();
    let mut by_root: HashMap<usize, Vec<WarAllInUnit>> = HashMap::new();
    for (i, u) in sorted.iter().enumerate() {
        let root = find(&mut parent, i);
        by_root
            .entry(root)
            .or_insert_with(|| {
                root_order.push(root);
                Vec::new()
            })
            .push(u.clone());
    }

    // 2) Kotwica (najblizej sredniej) i cel (najblizsza stolica od kotwicy).
    let mut clusters: Vec<Cluster> = Vec::new();
    for root in &root_order {
        let members = by_root.remove(root).expect("korzen z root_order istnieje");
        let len = members.len() as f64;
        let sq: f64 = members.iter().map(|m| f64::from(m.q)).sum();
        let sr: f64 = members.iter().map(|m| f64::from(m.r)).sum();
        let (mq, mr) = (sq / len, sr / len);
        let mut anchor = members[0].clone();
        let mut best_d = f64::INFINITY;
        for m in &members {
            let d = (f64::from(m.q) - mq).abs() + (f64::from(m.r) - mr).abs();
            if d < best_d {
                best_d = d;
                anchor = m.clone();
            }
        }
        let target = nearest_target(anchor.q, anchor.r, targets)
            .expect("targets niepuste")
            .clone();
        let dist_to_target = hex_distance(anchor.q, anchor.r, target.q, target.r);
        let min_id = members[0].id.clone();
        clusters.push(Cluster {
            members,
            anchor,
            target,
            dist_to_target,
            min_id,
            rendezvous: None,
        });
    }

    // 3) Per cel: porzadek grup (rozmiar malejaco, blizej celu, id); kazda grupa poza pierwsza
    //    dolacza do najblizszej grupy stojacej WCZESNIEJ w porzadku (glowa maszeruje).
    let mut clusters_by_target: BTreeMap<String, Vec<usize>> = BTreeMap::new();
    for (ci, c) in clusters.iter().enumerate() {
        clusters_by_target
            .entry(c.target.city_id.clone())
            .or_default()
            .push(ci);
    }
    for list in clusters_by_target.values_mut() {
        list.sort_by(|&a, &b| {
            let (ca, cb) = (&clusters[a], &clusters[b]);
            cb.members
                .len()
                .cmp(&ca.members.len())
                .then(ca.dist_to_target.cmp(&cb.dist_to_target))
                .then(ca.min_id.cmp(&cb.min_id))
        });
    }
    for (tk, list) in &clusters_by_target {
        plan.groups_by_target.insert(
            tk.clone(),
            list.iter().map(|&ci| clusters[ci].members.len()).collect(),
        );
        for ci in 1..list.len() {
            let c_idx = list[ci];
            if clusters[c_idx].dist_to_target <= params.no_merge_near_capital {
                continue;
            }
            let mut best_d = i64::MAX;
            let mut best_p: Option<usize> = None;
            for &p_idx in &list[..ci] {
                let d = hex_distance(
                    clusters[c_idx].anchor.q,
                    clusters[c_idx].anchor.r,
                    clusters[p_idx].anchor.q,
                    clusters[p_idx].anchor.r,
                );
                if d <= params.merge_radius && d < best_d {
                    best_d = d;
                    best_p = Some(p_idx);
                }
            }
            clusters[c_idx].rendezvous = best_p;
        }
    }

    // 4) Rozstrzyganie krokow (front kolumny pierwszy).
    let mut occupied: HashSet<Klucz> = nav.occupied.cloned().unwrap_or_default();
    for u in units {
        occupied.insert((u.q, u.r));
    }
    let st = StepState {
        occupied,
        claimed: HashSet::new(),
        vacated: HashSet::new(),
    };
    let all_start: HashSet<Klucz> = units.iter().map(|u| (u.q, u.r)).collect();
    let mut planner = Planner {
        nav,
        opts,
        targets,
        clusters: &clusters,
        all_start,
        field_cache: HashMap::new(),
        st,
        plan,
    };

    let followers: Vec<usize> = (0..clusters.len())
        .filter(|&i| clusters[i].rendezvous.is_some())
        .collect();
    let joining_followers = planner.run_pass(&followers);
    // Glowa czeka na miejscu, gdy doganiajaca ja grupa FAKTYCZNIE sie zbliza w tej turze.
    let mut waiting: HashSet<usize> = HashSet::new();
    if !planner.opts.march_main_group_while_rendezvous {
        for &f in &joining_followers {
            let Some(p) = clusters[f].rendezvous else {
                continue;
            };
            if clusters[p].rendezvous.is_none()
                && clusters[p].dist_to_target > params.no_merge_near_capital
            {
                waiting.insert(p);
            }
        }
    }
    let mut marching: Vec<usize> = Vec::new();
    for h in (0..clusters.len()).filter(|&i| clusters[i].rendezvous.is_none()) {
        if waiting.contains(&h) {
            for m in &clusters[h].members {
                planner.plan.held.push(m.id.clone());
            }
        } else {
            marching.push(h);
        }
    }
    planner.run_pass(&marching);
    planner.plan
}
