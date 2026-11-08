//! P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 551 AIDRA), partia 4B: planer `planHomeWar` (obrona domu P1/P2, histereza).
//!
//! Port 1:1 z `gra/src/game/ai-war-home-defense.ts` (pin `origin/main` 14f2af1b0):
//! - `planHomeWar` (:254): kolejnosc S1 (obrona zalozonego miasta) -> P1 odbicie (S2) -> S3 (utrzymanie) -> atak,
//! - gałęzie P2 (`runP2`, :295-373) i P1 (:382-450) oraz zapis pamieci (:454-456).
//!
//! Stale, typy i pamiec: `war_home_defense.rs` (partia 4A).
//!
//! ZALOZENIA: patrz `war_home_defense.rs` (pamiec jawna, sila precomputed, odleglosc = `hex_distance`).

use std::collections::{BTreeMap, BTreeSet, HashSet};

use crate::domain::pathfinding::ruch_jednostek::hex_distance;

use super::war_home_defense::{
    build_clusters, city_lost_of, decide_mode, is_founder_home, nearest_home, Cluster, HomeWarCity,
    HomeWarClusterInfo, HomeWarMemory, HomeWarMemoryStore, HomeWarMode, HomeWarOrder, HomeWarPlan,
    HomeWarRecapture, HomeWarTask, HomeWarUnit, ModeMemory, P1Memory, RecaptureMode,
    HOME_WAR_ATTACK_RATIO_ENTER, HOME_WAR_ATTACK_RATIO_LEAVE, HOME_WAR_DETACH_MARGIN,
    HOME_WAR_MAX_HOLD_TURNS, HOME_WAR_PRESENT_RADIUS, HOME_WAR_RECAPTURE_MAX_AGE,
    HOME_WAR_RECAPTURE_RATIO_ENTER, HOME_WAR_RECAPTURE_RATIO_LEAVE, HOME_WAR_SMALL_THREAT_SHARE,
};

/// Wejscie planera (web `HomeWarInput`). Callbacki webu: `canEngageOwner`, `hasContactWith`,
/// `isOwnTerritory`, `isRelevantSiege`; sila i `isFieldUnit` sa w `HomeWarUnit`.
pub struct HomeWarInput<'a> {
    pub owner_id: i64,
    /// Web `currentTurn`: `None` = stateless (bez pamieci histerezy).
    pub current_turn: Option<i64>,
    /// Wszystkie jednostki gry (obrona odbijanego miasta).
    pub all_units: &'a [HomeWarUnit],
    /// Jednostki wlasne (cala lista; filtr pola bitwy po `is_field`/`embarked`).
    pub my_units: &'a [HomeWarUnit],
    pub my_cities: &'a [HomeWarCity],
    /// Wszystkie miasta gry (kandydaci na utracone).
    pub all_cities: &'a [HomeWarCity],
    /// Jednostki cywilizacji w wojnie z wolajacym (wrog, nie barbarzynca).
    pub enemy_units: &'a [HomeWarUnit],
    pub can_engage_owner: &'a dyn Fn(i64) -> bool,
    /// Web `hasContactWith` (`None` = kontakt zakladany).
    pub has_contact_with: Option<&'a dyn Fn(i64) -> bool>,
    /// Jednostki, ktore w tej turze juz atakuja / wchodza na wrogie miasto.
    pub locked_unit_ids: &'a HashSet<String>,
    pub is_own_territory: &'a dyn Fn(i32, i32) -> bool,
    /// Web `isRelevantSiege` (`None` = kazde oblezenie zostaje).
    pub is_relevant_siege: Option<&'a dyn Fn(&str) -> bool>,
}

/// Stan jednego wywolania planera (web zmienne lokalne `planHomeWar`).
struct Planner<'x, 'a, 'm> {
    inp: &'x HomeWarInput<'a>,
    mem: Option<&'m mut HomeWarMemory>,
    turn: Option<i64>,
    /// Web `field`: jednostki bojowe poza transportem (kolejnosc jak w `myUnits`).
    field: Vec<HomeWarUnit>,
    field_total: f64,
    /// Web `initialPoolIds`.
    initial_pool: BTreeSet<String>,
    /// Web `pool` (kolejnosc = id rosnaco, jak wstawianie posortowane).
    pool: BTreeMap<String, HomeWarUnit>,
    clusters: Vec<Cluster>,
    seen_keys: BTreeSet<String>,
    plan: HomeWarPlan,
}

/// Web `planHomeWar` (ai-war-home-defense.ts:254).
pub fn plan_home_war(inp: &HomeWarInput<'_>, store: &mut HomeWarMemoryStore) -> HomeWarPlan {
    let turn = inp.current_turn;
    let mem = turn.map(|t| store.memory_for(inp.owner_id, t));

    let field: Vec<HomeWarUnit> = inp
        .my_units
        .iter()
        .filter(|u| u.is_field && !u.embarked)
        .cloned()
        .collect();
    let field_total = field.iter().fold(0.0_f64, |s, u| s + u.strength);

    let mut by_id: Vec<&HomeWarUnit> = field.iter().collect();
    by_id.sort_by(|a, b| a.id.cmp(&b.id));
    let mut pool: BTreeMap<String, HomeWarUnit> = BTreeMap::new();
    for u in by_id {
        let holds_relevant_siege = match &u.oblega_city_id {
            Some(cid) => inp.is_relevant_siege.is_none_or(|f| f(cid.as_str())),
            None => false,
        };
        if u.ruch_left > 0.0 && !inp.locked_unit_ids.contains(&u.id) && !holds_relevant_siege {
            pool.insert(u.id.clone(), u.clone());
        }
    }
    let initial_pool: BTreeSet<String> = pool.keys().cloned().collect();

    // P2: wrog NA WLASNYM TERENIE (web :285-289).
    let invaders: Vec<HomeWarUnit> = inp
        .enemy_units
        .iter()
        .filter(|u| u.is_field && !u.embarked && (inp.is_own_territory)(u.q, u.r))
        .cloned()
        .collect();
    let clusters = if !invaders.is_empty() && !inp.my_cities.is_empty() {
        build_clusters(&invaders, inp.my_cities)
    } else {
        Vec::new()
    };

    let mut pl = Planner {
        inp,
        mem,
        turn,
        field,
        field_total,
        initial_pool,
        pool,
        clusters,
        seen_keys: BTreeSet::new(),
        plan: HomeWarPlan::default(),
    };

    // KOLEJNOSC (dodatek 2 wlasciciela): S1 obrona -> S2 odzyskanie -> S3 utrzymanie -> atak.
    pl.run_p2(true);
    pl.run_p1();
    pl.run_p2(false);

    let seen = &pl.seen_keys;
    if let Some(m) = pl.mem.as_deref_mut() {
        m.p2.retain(|k, _| seen.contains(k));
    }
    pl.plan
}

impl Planner<'_, '_, '_> {
    /// Web `runP2(wantS1)` (:295-373).
    fn run_p2(&mut self, want_s1: bool) {
        let inp = self.inp;
        let owner = inp.owner_id;
        for idx in 0..self.clusters.len() {
            let cl = self.clusters[idx].clone();
            let is_s1 = nearest_home(inp.my_cities, cl.anchor.q, cl.anchor.r)
                .is_some_and(|h| is_founder_home(h, owner));
            if is_s1 != want_s1 {
                continue;
            }
            let key = format!(
                "{}|{}",
                cl.enemy_owner_id,
                if want_s1 { "S1" } else { "S3" }
            );
            self.seen_keys.insert(key.clone());

            // Obecni w poblizu (kolejnosc pola) i sila nieprzydzielalna (nie z puli).
            let mut present_strength = 0.0_f64;
            let mut fixed_strength = 0.0_f64;
            for u in &self.field {
                let near = cl
                    .members
                    .iter()
                    .any(|m| hex_distance(u.q, u.r, m.q, m.r) <= HOME_WAR_PRESENT_RADIUS);
                if near {
                    present_strength += u.strength;
                    if !self.initial_pool.contains(&u.id) {
                        fixed_strength += u.strength;
                    }
                }
            }
            let small = cl.strength <= HOME_WAR_SMALL_THREAT_SHARE * self.field_total;

            let (ax, ay) = (cl.anchor.q, cl.anchor.r);
            let mut cands: Vec<HomeWarUnit> = self.pool.values().cloned().collect();
            cands.sort_by(|a, b| {
                hex_distance(a.q, a.r, ax, ay)
                    .cmp(&hex_distance(b.q, b.r, ax, ay))
                    .then(a.id.cmp(&b.id))
            });
            let mut chosen: Vec<HomeWarUnit> = Vec::new();
            let mut chosen_strength = 0.0_f64;
            if small {
                let mut cum = fixed_strength;
                for u in cands {
                    if cum >= HOME_WAR_DETACH_MARGIN * cl.strength {
                        break;
                    }
                    let st = u.strength;
                    chosen.push(u);
                    cum += st;
                    chosen_strength += st;
                }
            } else {
                for u in cands {
                    chosen_strength += u.strength;
                    chosen.push(u);
                }
            }
            let ratio = if cl.strength > 0.0 {
                (chosen_strength + fixed_strength) / cl.strength
            } else {
                f64::INFINITY
            };

            let prev: Option<ModeMemory> =
                self.mem.as_deref().and_then(|m| m.p2.get(&key).copied());
            let turn = self.turn;
            let mode = match prev {
                Some(p) if p.mode == HomeWarMode::Released => HomeWarMode::Released,
                Some(p)
                    if p.mode == HomeWarMode::Hold
                        && turn.is_some_and(|t| t - p.since >= HOME_WAR_MAX_HOLD_TURNS) =>
                {
                    if let Some(m) = self.mem.as_deref_mut() {
                        m.p2.insert(
                            key.clone(),
                            ModeMemory {
                                mode: HomeWarMode::Released,
                                since: turn.unwrap_or(0),
                            },
                        );
                    }
                    HomeWarMode::Released
                }
                _ => {
                    let md = decide_mode(
                        prev,
                        ratio,
                        turn,
                        HOME_WAR_ATTACK_RATIO_ENTER,
                        HOME_WAR_ATTACK_RATIO_LEAVE,
                    );
                    if let (Some(m), Some(t)) = (self.mem.as_deref_mut(), turn) {
                        if prev.map(|p| p.mode) != Some(md) {
                            m.p2.insert(key.clone(), ModeMemory { mode: md, since: t });
                        }
                    }
                    md
                }
            };

            self.plan.clusters.push(HomeWarClusterInfo {
                anchor_id: cl.anchor.id.clone(),
                enemy_owner_id: cl.enemy_owner_id,
                size: cl.members.len(),
                strength: cl.strength,
                present_strength,
                ratio,
                small,
                mode,
                assigned: 0,
            });
            let info_idx = self.plan.clusters.len() - 1;
            if mode == HomeWarMode::Released || chosen.is_empty() {
                continue;
            }
            self.plan.clusters[info_idx].assigned = chosen.len();

            if mode == HomeWarMode::Attack {
                for u in chosen {
                    self.pool.remove(&u.id);
                    let adj = cl
                        .members
                        .iter()
                        .filter(|m| hex_distance(u.q, u.r, m.q, m.r) == 1)
                        .min_by(|a, b| a.id.cmp(&b.id));
                    if let Some(adj) = adj {
                        self.plan.orders.push(HomeWarOrder::Attack {
                            unit_id: u.id.clone(),
                            target_unit_id: adj.id.clone(),
                            task: HomeWarTask::P2,
                        });
                        continue;
                    }
                    let mut tgt = &cl.members[0];
                    let mut td = i64::MAX;
                    for m in &cl.members {
                        let d = hex_distance(u.q, u.r, m.q, m.r);
                        if d < td {
                            td = d;
                            tgt = m;
                        }
                    }
                    self.plan.orders.push(HomeWarOrder::Approach {
                        unit_id: u.id.clone(),
                        to_q: tgt.q,
                        to_r: tgt.r,
                        task: HomeWarTask::P2,
                        target_city_id: None,
                    });
                }
            } else {
                // Obrona w miescie najblizszym najezdzcy (zbiorka) -- bez samobojczego wypadu.
                let Some(city) = nearest_home(inp.my_cities, cl.anchor.q, cl.anchor.r).cloned()
                else {
                    continue;
                };
                for u in chosen {
                    self.pool.remove(&u.id);
                    self.plan.orders.push(HomeWarOrder::Hold {
                        unit_id: u.id.clone(),
                        to_q: city.q,
                        to_r: city.r,
                        city_id: city.id.clone(),
                        task: HomeWarTask::P2,
                    });
                }
            }
        }
    }

    /// Web P1 (S2): odbicie wlasnych utraconych miast (:378-450).
    fn run_p1(&mut self) {
        let inp = self.inp;
        let owner = inp.owner_id;
        let turn = self.turn;

        // KONTAKT: tylko wlasciciel, z ktorym AI ma wojne (canEngageOwner) i kontakt (hasContactWith).
        let lost_all: Vec<&HomeWarCity> = inp
            .all_cities
            .iter()
            .filter(|c| {
                city_lost_of(c, owner)
                    && (inp.can_engage_owner)(c.owner_id)
                    && inp.has_contact_with.is_none_or(|f| f(c.owner_id))
            })
            .collect();
        let lost_ids: HashSet<&str> = lost_all.iter().map(|c| c.id.as_str()).collect();
        if let (Some(m), Some(t)) = (self.mem.as_deref_mut(), turn) {
            for c in &lost_all {
                m.lost_seen.entry(c.id.clone()).or_insert(t);
            }
            m.lost_seen.retain(|k, _| lost_ids.contains(k.as_str()));
        }
        // Bez limitu odleglosci; tylko starzenie (HOME_WAR_RECAPTURE_MAX_AGE).
        let lost: Vec<HomeWarCity> = lost_all
            .iter()
            .copied()
            .filter(|c| match (self.mem.as_deref(), turn) {
                (Some(m), Some(t)) => {
                    let seen = m.lost_seen.get(&c.id).copied().unwrap_or(t);
                    t - seen <= HOME_WAR_RECAPTURE_MAX_AGE
                }
                _ => true,
            })
            .cloned()
            .collect();

        if !lost.is_empty() && !self.pool.is_empty() {
            let near_own = |c: &HomeWarCity| -> i64 {
                inp.my_cities
                    .iter()
                    .map(|m| hex_distance(c.q, c.r, m.q, m.r))
                    .min()
                    .unwrap_or(0)
            };
            let mut sorted = lost;
            sorted.sort_by(|a, b| near_own(a).cmp(&near_own(b)).then(a.id.cmp(&b.id)));
            let p1_city_id: Option<String> = self
                .mem
                .as_deref()
                .and_then(|m| m.p1.as_ref().map(|p| p.city_id.clone()));
            let target: HomeWarCity = p1_city_id
                .as_ref()
                .and_then(|id| sorted.iter().find(|c| &c.id == id))
                .unwrap_or(&sorted[0])
                .clone();

            let def_strength: f64 = inp
                .all_units
                .iter()
                .filter(|u| {
                    u.owner_id == target.owner_id
                        && u.is_field
                        && hex_distance(u.q, u.r, target.q, target.r) <= 1
                })
                .fold(0.0_f64, |s, u| s + u.strength);
            let near_strength = self.field.iter().fold(0.0_f64, |s, u| s + u.strength);
            let ratio = if def_strength > 0.0 {
                near_strength / def_strength
            } else {
                f64::INFINITY
            };

            let prev: Option<ModeMemory> = self
                .mem
                .as_deref()
                .and_then(|m| m.p1.as_ref())
                .filter(|p| p.city_id == target.id)
                .map(|p| ModeMemory {
                    mode: if p.mode == RecaptureMode::Go {
                        HomeWarMode::Attack
                    } else {
                        HomeWarMode::Hold
                    },
                    since: p.since,
                });
            let md = decide_mode(
                prev,
                ratio,
                turn,
                HOME_WAR_RECAPTURE_RATIO_ENTER,
                HOME_WAR_RECAPTURE_RATIO_LEAVE,
            );
            let go = md == HomeWarMode::Attack;
            let mode_rc = if go {
                RecaptureMode::Go
            } else {
                RecaptureMode::Wait
            };
            if let Some(m) = self.mem.as_deref_mut() {
                let needs = match &m.p1 {
                    None => true,
                    Some(p) => p.city_id != target.id || (p.mode == RecaptureMode::Go) != go,
                };
                if needs {
                    m.p1 = Some(P1Memory {
                        city_id: target.id.clone(),
                        mode: mode_rc,
                        since: turn.unwrap_or(0),
                    });
                }
            }

            let mut rec = HomeWarRecapture {
                city_id: target.id.clone(),
                mode: mode_rc,
                ratio,
                assigned: 0,
            };
            if go {
                let mut cands: Vec<HomeWarUnit> = self.pool.values().cloned().collect();
                cands.sort_by(|a, b| {
                    hex_distance(a.q, a.r, target.q, target.r)
                        .cmp(&hex_distance(b.q, b.r, target.q, target.r))
                        .then(a.id.cmp(&b.id))
                });
                for u in cands {
                    self.pool.remove(&u.id);
                    self.plan.orders.push(HomeWarOrder::Approach {
                        unit_id: u.id.clone(),
                        to_q: target.q,
                        to_r: target.r,
                        task: HomeWarTask::P1,
                        target_city_id: Some(target.id.clone()),
                    });
                    rec.assigned += 1;
                }
            } else if !inp.my_cities.is_empty() {
                // Za slabi na odbicie: zbiorka w wlasnym miescie najblizszym utraconemu.
                let mut city = &inp.my_cities[0];
                let mut cd = i64::MAX;
                for c in inp.my_cities {
                    let d = hex_distance(target.q, target.r, c.q, c.r);
                    if d < cd || (d == cd && c.id < city.id) {
                        cd = d;
                        city = c;
                    }
                }
                let drained = std::mem::take(&mut self.pool);
                for u in drained.into_values() {
                    self.plan.orders.push(HomeWarOrder::Hold {
                        unit_id: u.id.clone(),
                        to_q: city.q,
                        to_r: city.r,
                        city_id: city.id.clone(),
                        task: HomeWarTask::P1,
                    });
                    rec.assigned += 1;
                }
            }
            self.plan.recapture = Some(rec);
        } else if lost.is_empty() {
            if let Some(m) = self.mem.as_deref_mut() {
                m.p1 = None;
            }
        }
    }
}
