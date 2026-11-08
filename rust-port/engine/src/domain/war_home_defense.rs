//! P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 551 AIDRA), partia 4A: typy, stale, pamiec histerezy i klastry
//! planera obrony domu `planHomeWar`.
//!
//! Port z `gra/src/game/ai-war-home-defense.ts` (pin `origin/main` 14f2af1b0):
//! - stale `HOME_WAR_*` (:40-62),
//! - `memoryFor` / `resetHomeWarMemory` (:158-173) -> `HomeWarMemoryStore` (jawny magazyn zamiast globalnej mapy),
//! - `buildClusters` (:191-231), `decideMode` (:234-248).
//!
//! ZALOZENIA (do akceptacji, patrz raport):
//! - Pamiec histerezy jest jawnym obiektem `HomeWarMemoryStore` przekazywanym przez wolajacego (web: modul-owa mapa).
//!   Stateless (web `currentTurn === undefined`) = przekazanie `None` tury; magazyn wtedy nie jest ruszany.
//! - Sila jednostki (`strengthOf`) i flaga `isFieldUnit` sa liczone przez wolajacego i przekazane w `HomeWarUnit`
//!   (web: callbacki). Odleglosc = `hex_distance` (osiowa, jak w reszcie portu).
//! - Brak przelacznika `setHomeWarDefenseOverride` (tylko pomiary/testy weba); stala `HOME_WAR_DEFENSE_ENABLED = true`.

use std::collections::{BTreeMap, HashMap};

use crate::domain::pathfinding::ruch_jednostek::hex_distance;

use super::war_city_founder::{city_founder_id, is_city_lost_of};

// ---------------------------------------------------------------------------
// Stale (dokumentowane progi; web :40-63)
// ---------------------------------------------------------------------------

/// Wejscie w atak: sila wlasna / sila najezdzcow >= 0.8 (jak atak ostatniej woli, 10:8).
pub const HOME_WAR_ATTACK_RATIO_ENTER: f64 = 0.8;
/// Zejscie z ataku do obrony dopiero ponizej 0.6 (histereza).
pub const HOME_WAR_ATTACK_RATIO_LEAVE: f64 = 0.6;
/// Minimalna liczba tur trzymania wybranego trybu/celu (anty ping-pong).
pub const HOME_WAR_MIN_COMMIT_TURNS: i64 = 3;
/// Maksymalna liczba tur obrony w miescie przeciw jednemu wrogowi, potem zwolnienie.
pub const HOME_WAR_MAX_HOLD_TURNS: i64 = 12;
/// Zagrozenie MALE: sila najezdzcow <= 25% sily calej armii polowej.
pub const HOME_WAR_SMALL_THREAT_SHARE: f64 = 0.25;
/// Odrywany oddzial: sila >= 125% sily najezdzcow.
pub const HOME_WAR_DETACH_MARGIN: f64 = 1.25;
/// Promien "w poblizu" do oceny sily obecnej przy zagrozeniu.
pub const HOME_WAR_PRESENT_RADIUS: i64 = 8;
/// Najezdzcy w odleglosci <= tyle od siebie tworza jedno skupisko.
pub const HOME_WAR_CLUSTER_LINK: i64 = 3;
/// Odbijane miasto: po tylu turach od pierwszego zauwazenia utraty przestaje byc "swieze".
pub const HOME_WAR_RECAPTURE_MAX_AGE: i64 = 60;
/// Odbicie: sila / obrona miasta >= 1.0 (mury faworyzuja obronce), zejscie ponizej 0.8.
pub const HOME_WAR_RECAPTURE_RATIO_ENTER: f64 = 1.0;
pub const HOME_WAR_RECAPTURE_RATIO_LEAVE: f64 = 0.8;

/// Web `HOME_WAR_DEFENSE_ENABLED` (stala ON; przelacznik override tylko w testach weba).
pub const HOME_WAR_DEFENSE_ENABLED: bool = true;

// ---------------------------------------------------------------------------
// Typy wejscia / wyjscia
// ---------------------------------------------------------------------------

/// Jednostka dla planera obrony (web `RuntimeUnit` + wyniki `strengthOf`/`isFieldUnit`).
#[derive(Debug, Clone, PartialEq)]
pub struct HomeWarUnit {
    pub id: String,
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
    /// Web `isFieldUnit(u)`: jednostka bojowa (nie cywil, nie zwiadowca).
    pub is_field: bool,
    /// Web `u.embarked === true`.
    pub embarked: bool,
    /// Web `u.ruchLeft`.
    pub ruch_left: f64,
    /// Web `u.oblegaCityId` (miasto, ktore jednostka oblega).
    pub oblega_city_id: Option<String>,
    /// Web `strengthOf(u)` (policzona przez wolajacego).
    pub strength: f64,
}

/// Miasto dla planera obrony (web `HomeWarCity`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HomeWarCity {
    pub id: String,
    pub q: i32,
    pub r: i32,
    pub owner_id: i64,
    pub captured_from_owner_id: Option<i64>,
    pub founded_by: Option<i64>,
    pub founded_by_owner: Option<bool>,
}

/// Zadanie rozkazu: P1 = odbicie utraconego miasta (S2), P2 = obrona terenu (S1/S3).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HomeWarTask {
    P1,
    P2,
}

/// Tryb klastra / odbicia (web `mode`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HomeWarMode {
    Attack,
    Hold,
    Released,
}

/// Tryb odbicia miasta (web `p1.mode` 'go' | 'wait').
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RecaptureMode {
    Go,
    Wait,
}

/// Rozkaz dla jednostki (web `HomeWarOrder`).
#[derive(Debug, Clone, PartialEq)]
pub enum HomeWarOrder {
    Attack {
        unit_id: String,
        target_unit_id: String,
        task: HomeWarTask,
    },
    Approach {
        unit_id: String,
        to_q: i32,
        to_r: i32,
        task: HomeWarTask,
        target_city_id: Option<String>,
    },
    Hold {
        unit_id: String,
        to_q: i32,
        to_r: i32,
        city_id: String,
        task: HomeWarTask,
    },
}

/// Diagnostyka klastra (web `HomeWarClusterInfo`). `ratio` = `f64::INFINITY` gdy sila najezdzcow 0.
#[derive(Debug, Clone, PartialEq)]
pub struct HomeWarClusterInfo {
    pub anchor_id: String,
    pub enemy_owner_id: i64,
    pub size: usize,
    pub strength: f64,
    pub present_strength: f64,
    pub ratio: f64,
    pub small: bool,
    pub mode: HomeWarMode,
    pub assigned: usize,
}

/// Diagnostyka odbicia (web `plan.recapture`).
#[derive(Debug, Clone, PartialEq)]
pub struct HomeWarRecapture {
    pub city_id: String,
    pub mode: RecaptureMode,
    pub ratio: f64,
    pub assigned: usize,
}

/// Wynik planera (web `HomeWarPlan`).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct HomeWarPlan {
    pub orders: Vec<HomeWarOrder>,
    pub clusters: Vec<HomeWarClusterInfo>,
    pub recapture: Option<HomeWarRecapture>,
}

// ---------------------------------------------------------------------------
// Pamiec histerezy (web :147-173)
// ---------------------------------------------------------------------------

/// Tryb z czasem zatrzasniecia (web `ModeMemory`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ModeMemory {
    pub mode: HomeWarMode,
    pub since: i64,
}

/// Wybrany cel odbicia + tryb (web `p1`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct P1Memory {
    pub city_id: String,
    pub mode: RecaptureMode,
    pub since: i64,
}

/// Pamiec jednego wlasciciela (web `HomeWarMemory`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct HomeWarMemory {
    pub last_turn: i64,
    /// Tryb obrony per klucz `${ownerId wroga}|S1` / `|S3`.
    pub p2: BTreeMap<String, ModeMemory>,
    pub p1: Option<P1Memory>,
    /// Pierwsze zauwazenie utraty miasta (do starzenia).
    pub lost_seen: BTreeMap<String, i64>,
}

/// Magazyn pamieci per wlasciciel (web `memoryByOwner`).
#[derive(Debug, Clone, Default)]
pub struct HomeWarMemoryStore {
    by_owner: HashMap<i64, HomeWarMemory>,
}

impl HomeWarMemoryStore {
    pub fn new() -> Self {
        Self::default()
    }

    /// Web `resetHomeWarMemory` (:161).
    pub fn reset(&mut self) {
        self.by_owner.clear();
    }

    /// Web `memoryFor` (:165): nowa pamiec, gdy brak lub tura cofnieta; inaczej aktualizuje `lastTurn`.
    pub fn memory_for(&mut self, owner_id: i64, turn: i64) -> &mut HomeWarMemory {
        let m = self
            .by_owner
            .entry(owner_id)
            .or_insert_with(|| HomeWarMemory {
                last_turn: turn,
                ..HomeWarMemory::default()
            });
        if turn < m.last_turn {
            *m = HomeWarMemory {
                last_turn: turn,
                ..HomeWarMemory::default()
            };
        }
        m.last_turn = turn;
        m
    }
}

// ---------------------------------------------------------------------------
// Pomocnicze (web :175-248)
// ---------------------------------------------------------------------------

/// Web `nearestHome` (:274): najblizsze moje miasto; remis -> nizsze id.
pub(crate) fn nearest_home(cities: &[HomeWarCity], q: i32, r: i32) -> Option<&HomeWarCity> {
    let mut best: Option<&HomeWarCity> = None;
    let mut bd = i64::MAX;
    for c in cities {
        let d = hex_distance(q, r, c.q, c.r);
        if d < bd || (d == bd && best.is_some_and(|b| c.id < b.id)) {
            bd = d;
            best = Some(c);
        }
    }
    best
}

/// Web `isFounderHome` (:283): tworca miasta = wolajacy wlasciciel.
pub(crate) fn is_founder_home(city: &HomeWarCity, owner_id: i64) -> bool {
    city_founder_id(city.owner_id, city.founded_by, city.founded_by_owner) == Some(owner_id)
}

/// Web `isCityLostOf` (cities.ts:1132) dla pola `HomeWarCity`.
pub(crate) fn city_lost_of(city: &HomeWarCity, owner_id: i64) -> bool {
    is_city_lost_of(
        city.owner_id,
        city.founded_by,
        city.captured_from_owner_id,
        owner_id,
    )
}

/// Klaster najezdcow (web `Cluster`, :183).
#[derive(Debug, Clone)]
pub(crate) struct Cluster {
    pub members: Vec<HomeWarUnit>,
    pub anchor: HomeWarUnit,
    pub strength: f64,
    pub enemy_owner_id: i64,
}

/// Web `buildClusters` (:191): laczenie najezdcow tego samego wlasciciela w odleglosci <= LINK
/// (union-find), kotwica = czlonek najblizej mojego miasta, sortowanie (odleglosc kotwicy, id kotwicy).
pub(crate) fn build_clusters(inv: &[HomeWarUnit], my_cities: &[HomeWarCity]) -> Vec<Cluster> {
    let mut sorted: Vec<&HomeWarUnit> = inv.iter().collect();
    sorted.sort_by(|a, b| a.id.cmp(&b.id));
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
            let (a, b) = (sorted[i], sorted[j]);
            if a.owner_id != b.owner_id {
                continue;
            }
            if hex_distance(a.q, a.r, b.q, b.r) <= HOME_WAR_CLUSTER_LINK {
                let ra = find(&mut parent, i);
                let rb = find(&mut parent, j);
                if ra != rb {
                    parent[ra.max(rb)] = ra.min(rb);
                }
            }
        }
    }
    // Grupy w kolejnosci pierwszego wystapienia (jak Map w webie).
    let mut group_index: HashMap<usize, usize> = HashMap::new();
    let mut groups: Vec<Vec<HomeWarUnit>> = Vec::new();
    for (i, u) in sorted.iter().enumerate() {
        let k = find(&mut parent, i);
        let gi = *group_index.entry(k).or_insert_with(|| {
            groups.push(Vec::new());
            groups.len() - 1
        });
        groups[gi].push((*u).clone());
    }
    let mut out: Vec<(i64, Cluster)> = Vec::with_capacity(groups.len());
    for members in groups {
        let mut anchor = members[0].clone();
        let mut best = i64::MAX;
        for m in &members {
            let d = my_cities
                .iter()
                .map(|c| hex_distance(m.q, m.r, c.q, c.r))
                .min()
                .unwrap_or(i64::MAX);
            if d < best {
                best = d;
                anchor = m.clone();
            }
        }
        let strength = members.iter().fold(0.0_f64, |s, m| s + m.strength);
        let enemy_owner_id = anchor.owner_id;
        out.push((
            best,
            Cluster {
                members,
                anchor,
                strength,
                enemy_owner_id,
            },
        ));
    }
    out.sort_by(|(da, a), (db, b)| da.cmp(db).then(a.anchor.id.cmp(&b.anchor.id)));
    out.into_iter().map(|(_, c)| c).collect()
}

/// Web `decideMode` (:234): pasmo enter/leave + minimum `HOME_WAR_MIN_COMMIT_TURNS` tur trzymania.
pub(crate) fn decide_mode(
    prev: Option<ModeMemory>,
    ratio: f64,
    turn: Option<i64>,
    enter: f64,
    leave: f64,
) -> HomeWarMode {
    if let (Some(p), Some(t)) = (prev, turn) {
        if p.mode != HomeWarMode::Released {
            let held = t - p.since;
            if held < HOME_WAR_MIN_COMMIT_TURNS {
                return p.mode;
            }
            return if p.mode == HomeWarMode::Attack {
                if ratio >= leave {
                    HomeWarMode::Attack
                } else {
                    HomeWarMode::Hold
                }
            } else if ratio >= enter {
                HomeWarMode::Attack
            } else {
                HomeWarMode::Hold
            };
        }
    }
    if ratio >= enter {
        HomeWarMode::Attack
    } else {
        HomeWarMode::Hold
    }
}
