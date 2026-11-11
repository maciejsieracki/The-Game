//! P6-ZAPIS-MIGRACJE-FALA509 (runda 2): migracja nadmiaru wodzow ponad limit epoki.
//!
//! web: `gra/src/game/generals.ts` `planGeneralLimitDemotions` (origin/main), wywolanie
//! `gra/src/main.ts` (wczytanie zapisu, sekcja `R-WEB-GENERALS-OVER-LIMIT-Q1`).
//!
//! Regula (web): dla kazdego wlasciciela ZOSTAJA najstarsi wodzowie (kolejnosc w rosterze = kolejnosc
//! narodzin) do `generalLimitForEra(epoka wlasciciela)`; kazdy mlodszy wodz ponad limit traci flage
//! wodza i zostaje zwykla jednostka tego samego typu. Nikt nie jest usuwany.
//!
//! ZALOZENIA (ZALOZENIE):
//! - `isGeneral` jest prawdziwe TYLKO dla JSON `true` (web `unit.isGeneral !== true` -> pominiete).
//!   Zamiana na `bool` odbywa sie w [`general_flag_from_raw`], nie w planie.
//! - Epoka wlasciciela jest dostarczana przez wywolujacego (web `empireEpochForOwner`); plan nie
//!   zgaduje brakujacych epok.
//! - Klucz wlasciciela porownywany jak JS `Map` (SameValueZero): `-0` = `0`, `NaN` = `NaN`.
//!
//! Brak podpiecia do stanu gry: `GameStateDto`/`UnitDto` nie niesie flagi wodza ani kolejnosci
//! narodzin (patrz `P6-ZAPIS-MIGRACJE-FALA509.md`, wiersz "wodzowie"). Ta funkcja jest gotowa do
//! wpiecia, gdy model jednostki dostanie pole generala.

use std::collections::{BTreeMap, BTreeSet, HashMap};

use serde_json::Value;

use super::generals::general_limit_for_era;

/// Jeden wpis rosteru w kolejnosci narodzin (web: `units` zapisu, pola `id`, `ownerId`, `isGeneral`).
#[derive(Debug, Clone, PartialEq)]
pub struct GeneralRosterEntry {
    pub id: String,
    pub owner_id: f64,
    pub is_general: bool,
}

/// Web `unit.isGeneral === true`: tylko JSON `true` oznacza wodza; `undefined`, `null`, `"true"`, `1` = nie.
pub fn general_flag_from_raw(raw: Option<&Value>) -> bool {
    matches!(raw, Some(Value::Bool(true)))
}

/// Klucz mapy wlasciciela z semantyka JS `Map` (SameValueZero).
fn owner_key(owner_id: f64) -> u64 {
    if owner_id.is_nan() {
        f64::NAN.to_bits()
    } else if owner_id == 0.0 {
        0.0_f64.to_bits()
    } else {
        owner_id.to_bits()
    }
}

/// Web `planGeneralLimitDemotions(roster, eraForOwner)` (`generals.ts`): zwraca identyfikatory
/// wodzow, ktore traca flage (w kolejnosci rosteru). `era_for_owner` wywolywane raz na wodza
/// (jak w webie, bez cache'u po stronie wywolujacego).
pub fn plan_general_limit_demotions(
    roster: &[GeneralRosterEntry],
    era_for_owner: impl Fn(f64) -> f64,
) -> Vec<String> {
    let mut kept_by_owner: HashMap<u64, u64> = HashMap::new();
    let mut demote = Vec::new();
    for unit in roster {
        if !unit.is_general {
            continue;
        }
        let key = owner_key(unit.owner_id);
        let kept = kept_by_owner.get(&key).copied().unwrap_or(0);
        let limit = general_limit_for_era(era_for_owner(unit.owner_id));
        if (kept as f64) < limit {
            kept_by_owner.insert(key, kept + 1);
        } else {
            demote.push(unit.id.clone());
        }
    }
    demote
}

/// Jednostka do liczenia stosow (web `StackUnitLike`: `id`, `ownerId`, `q`, `r`).
/// ZALOZENIE: wspolrzedne i wlasciciele to liczby calkowite (web `Map` klucz `owner|q,r`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StackUnit {
    pub id: String,
    pub owner_id: i64,
    pub q: i64,
    pub r: i64,
}

/// Przeniesienie nadwyzki stosu (web `StackSplitMove`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StackSplitMove {
    pub unit_id: String,
    pub from_q: i64,
    pub from_r: i64,
    pub to_q: i64,
    pub to_r: i64,
}

/// Wynik planu podzialu (web `StackSplitPlan`).
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct StackSplitPlan {
    pub moves: Vec<StackSplitMove>,
    /// Jednostki bez miejsca (stos nadal ponad limit).
    pub unplaced: Vec<String>,
}

/// Szesc kierunkow osiowych w kolejnosci cyklicznej (web `RING_DIRS`).
const RING_DIRS: [(i64, i64); 6] = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];

/// Web `ringHexes` (`army-stack-limit.ts`): heksy w odleglosci dokladnie `radius`, stala kolejnosc.
fn ring_hexes(q: i64, r: i64, radius: i64) -> Vec<(i64, i64)> {
    if radius == 0 {
        return vec![(q, r)];
    }
    let mut out = Vec::new();
    let mut cq = q + RING_DIRS[4].0 * radius;
    let mut cr = r + RING_DIRS[4].1 * radius;
    for dir in RING_DIRS {
        for _ in 0..radius {
            out.push((cq, cr));
            cq += dir.0;
            cr += dir.1;
        }
    }
    out
}

/// Licznik wirtualny heksu: wpis z `virtual_count` albo stan bazowy z grup (jak web `countAt`).
fn count_at(
    virtual_count: &HashMap<(i64, i64, i64), i64>,
    groups: &BTreeMap<(i64, i64, i64), Vec<&StackUnit>>,
    key: (i64, i64, i64),
) -> i64 {
    match virtual_count.get(&key) {
        Some(v) => *v,
        None => groups.get(&key).map_or(0, |g| g.len() as i64),
    }
}

/// Web `planOversizedStackSplits(units, limit, {canPlaceAt, maxRadius})` (`army-stack-limit.ts`).
///
/// Dla kazdego (wlasciciel, heks) ze stosem wiekszym niz `limit` nadwyzka (jednostki po pierwszych
/// `limit`, kolejnosc wejsciowa) idzie na najblizsze wolne heksy; kazdy heks przyjmie do `limit`
/// jednostek wlacznie z juz stojacymi. Czysta funkcja, nie zmienia `units`.
/// ZALOZENIE: `limit >= 0` (web `slice(limit)` dla ujemnego limitu ma inna semantyke; limit jest stala).
pub fn plan_oversized_stack_splits(
    units: &[StackUnit],
    limit: i64,
    max_radius: i64,
    can_place_at: impl Fn(i64, i64, i64) -> bool,
) -> StackSplitPlan {
    // Grupy po (owner, q, r) w rosnacym porzadku = web sort `over` (ownerId, q, r).
    let mut groups: BTreeMap<(i64, i64, i64), Vec<&StackUnit>> = BTreeMap::new();
    for u in units {
        groups.entry((u.owner_id, u.q, u.r)).or_default().push(u);
    }
    // Obce jednostki: zbiory wlascicieli stojacych na danym heksie (q, r).
    let mut owners_at: HashMap<(i64, i64), BTreeSet<i64>> = HashMap::new();
    for u in units {
        owners_at.entry((u.q, u.r)).or_default().insert(u.owner_id);
    }
    let over: Vec<_> = groups
        .iter()
        .filter(|(_, g)| g.len() as i64 > limit)
        .map(|(k, g)| (*k, g.clone()))
        .collect();

    let mut virtual_count: HashMap<(i64, i64, i64), i64> = HashMap::new();
    let mut plan = StackSplitPlan::default();
    for ((owner, q0, r0), group) in over {
        let origin = (owner, q0, r0);
        let excess: Vec<&StackUnit> = group[limit as usize..].to_vec();
        let mut idx = 0usize;
        for radius in 1..=max_radius {
            if idx >= excess.len() {
                break;
            }
            for (hq, hr) in ring_hexes(q0, r0, radius) {
                if idx >= excess.len() {
                    break;
                }
                if owners_at
                    .get(&(hq, hr))
                    .is_some_and(|set| set.iter().any(|o| *o != owner))
                {
                    continue;
                }
                if !can_place_at(owner, hq, hr) {
                    continue;
                }
                let dest = (owner, hq, hr);
                let mut room = limit - count_at(&virtual_count, &groups, dest);
                while room > 0 && idx < excess.len() {
                    let u = excess[idx];
                    idx += 1;
                    plan.moves.push(StackSplitMove {
                        unit_id: u.id.clone(),
                        from_q: q0,
                        from_r: r0,
                        to_q: hq,
                        to_r: hr,
                    });
                    // Web `bump(dest, +1)` i `bump(origin, -1)`.
                    let dest_count = count_at(&virtual_count, &groups, dest);
                    virtual_count.insert(dest, dest_count + 1);
                    let origin_count = count_at(&virtual_count, &groups, origin);
                    virtual_count.insert(origin, origin_count - 1);
                    room -= 1;
                }
            }
        }
        plan.unplaced
            .extend(excess[idx..].iter().map(|u| u.id.clone()));
    }
    plan
}

#[cfg(test)]
mod tests {
    use super::*;

    fn g(id: &str, owner: f64) -> GeneralRosterEntry {
        GeneralRosterEntry {
            id: id.to_string(),
            owner_id: owner,
            is_general: true,
        }
    }

    #[test]
    fn keeps_oldest_up_to_era_limit() {
        let roster = [g("g1", 0.0), g("g2", 0.0), g("g3", 0.0)];
        assert_eq!(
            plan_general_limit_demotions(&roster, |_| 1.0),
            vec!["g2", "g3"]
        );
        assert_eq!(
            plan_general_limit_demotions(&roster, |_| 3.0),
            Vec::<String>::new()
        );
    }

    #[test]
    fn non_generals_do_not_take_slots() {
        let roster = [
            g("g1", 0.0),
            GeneralRosterEntry {
                id: "u".into(),
                owner_id: 0.0,
                is_general: false,
            },
            g("g2", 0.0),
        ];
        assert_eq!(plan_general_limit_demotions(&roster, |_| 1.0), vec!["g2"]);
    }

    #[test]
    fn owners_are_counted_separately() {
        let roster = [g("a", 0.0), g("b", 1.0), g("c", 0.0), g("d", 1.0)];
        let eras = |o: f64| if o == 0.0 { 1.0 } else { 2.0 };
        assert_eq!(plan_general_limit_demotions(&roster, eras), vec!["c"]);
    }

    #[test]
    fn negative_zero_owner_is_same_key() {
        let roster = [g("a", 0.0), g("b", -0.0)];
        assert_eq!(plan_general_limit_demotions(&roster, |_| 1.0), vec!["b"]);
    }

    #[test]
    fn non_finite_or_small_era_uses_web_limit() {
        let roster = [g("a", 5.0), g("b", 5.0)];
        // web generalLimitForEra: NaN/Infinity -> 1, floor(0.5)=0 -> max(1,0)=1.
        assert_eq!(
            plan_general_limit_demotions(&roster, |_| f64::NAN),
            vec!["b"]
        );
        assert_eq!(
            plan_general_limit_demotions(&roster, |_| f64::INFINITY),
            vec!["b"]
        );
        assert_eq!(plan_general_limit_demotions(&roster, |_| 0.5), vec!["b"]);
    }

    #[test]
    fn flag_reads_only_json_true() {
        assert!(general_flag_from_raw(Some(&Value::Bool(true))));
        assert!(!general_flag_from_raw(Some(&Value::Bool(false))));
        assert!(!general_flag_from_raw(Some(&Value::Null)));
        assert!(!general_flag_from_raw(Some(&Value::String("true".into()))));
        assert!(!general_flag_from_raw(Some(&serde_json::json!(1))));
        assert!(!general_flag_from_raw(None));
    }
}
