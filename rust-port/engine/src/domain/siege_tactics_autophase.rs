//! P6 SIEGE-TAKTYKA K5g0 (dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5G0-Q1, runda 1, Operator):
//! czysty port `resolveAutoBatchPhase` z `gra/src/battle/autoBatchPhase.ts` (pin `07d2fbd72`).
//!
//! Funkcja [`resolve_auto_batch_phase`] rozstrzyga jedną fazę AUTO jednej strony:
//! * migawka zajętości z początku fazy (`reserved`) -- zajęte kafelki są twardą barierą nawet dla
//!   jednostki, która sama ma zamiar ruszyć się; kafelek zajęty raz przez zaakceptowaną ścieżkę
//!   pozostaje zarezerwowany do końca fazy;
//! * cele ataku są identyfikatorami z tej samej migawki (`live`), nigdy wyszukiwaniem po mutacji;
//! * kolejność rozstrzygania = kolejność rostera (`units`); ostatni zamiar dla danego `unitId` wygrywa
//!   (odpowiednik `Map.set` w webie).
//!
//! Wejścia są jawne: web `undefined` dla `hp` i `occupies` to `None`; `occupies !== false` oznacza
//! `occupies != Some(false)`. Liczby (`q`, `r`, `col`, `row`) są `f64`, bo web nie wymusza całkowitości
//! (NaN/Infinity przechodzą przez te same porównania co w JS).
//!
//! Nie portowano: klonowanie roster (`_cloneForAutoBatchPlanning`), animację i `_launchAutoBatchResolution`
//! (efekty sceny), `_finishAutoBatchPhase`, token `_autoBatchToken` i wpięcie do pętli tur (K5g/K5).

use std::collections::HashMap;

/// Strona fazy AUTO (`AutoBatchPhase` = `'atk' | 'def'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AutoBatchPhase {
    Atk,
    Def,
}

/// Rodzaj zamiaru (`AutoBatchIntentKind` = `'hold' | 'move' | 'attack'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AutoBatchIntentKind {
    Hold,
    Move,
    Attack,
}

/// Jeden krok ścieżki (`AutoBatchStep`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AutoBatchStep {
    pub col: f64,
    pub row: f64,
}

/// Migawka jednostki na początku fazy (`AutoBatchUnitSnapshot`).
///
/// `hp: None` = web `undefined` (brak sprawdzenia HP). `occupies: None` = web `undefined`
/// (traktowane jak `true`, tylko `Some(false)` zwalnia kafelek).
#[derive(Debug, Clone, PartialEq)]
pub struct AutoBatchUnitSnapshot {
    pub id: String,
    pub side: AutoBatchPhase,
    pub q: f64,
    pub r: f64,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
    pub removed: bool,
    pub acted: bool,
    pub hp: Option<f64>,
    pub occupies: Option<bool>,
}

/// Zamiar jednostki (`AutoBatchIntent`).
#[derive(Debug, Clone, PartialEq)]
pub struct AutoBatchIntent {
    pub unit_id: String,
    pub side: AutoBatchPhase,
    pub kind: AutoBatchIntentKind,
    pub steps: Vec<AutoBatchStep>,
    pub target_id: Option<String>,
}

/// Rozstrzygnięcie (`AutoBatchResolution` = zamiar + `blocked`). `target_id: None` odpowiada web `targetId: undefined`.
#[derive(Debug, Clone, PartialEq)]
pub struct AutoBatchResolution {
    pub unit_id: String,
    pub side: AutoBatchPhase,
    pub kind: AutoBatchIntentKind,
    pub steps: Vec<AutoBatchStep>,
    pub target_id: Option<String>,
    pub blocked: bool,
}

/// Klucz kafelka. Web używa `col + ',' + row`; dwie różne liczby zmiennoprzecinkowe mają różne napisy
/// (`String(n)` jest najkrótszym jednoznacznym zapisem), więc równość bitów po normalizacji `-0 -> 0`
/// i kanonizacji NaN daje tę samą relację równoważności.
type CellKey = (u64, u64);

fn js_bits(x: f64) -> u64 {
    if x == 0.0 {
        0
    } else if x.is_nan() {
        f64::NAN.to_bits()
    } else {
        x.to_bits()
    }
}

fn cell_key(col: f64, row: f64) -> CellKey {
    (js_bits(col), js_bits(row))
}

/// Web: `unit.hp !== undefined && (!Number.isFinite(unit.hp) || unit.hp <= 0)` oraz flagi martwości.
fn outside_live_roster(unit: &AutoBatchUnitSnapshot) -> bool {
    unit.dead
        || unit.fading_out
        || unit.removed
        || unit.routed
        || unit.hp.is_some_and(|hp| !hp.is_finite() || hp <= 0.0)
}

/// `acceptSteps` z webu: zwraca zaakceptowany prefiks ścieżki i flagę `blocked`.
/// Każdy zaakceptowany cel rezerwuje kafelek do końca fazy; kafelek z zajętością innej jednostki blokuje.
fn accept_steps(
    unit: &AutoBatchUnitSnapshot,
    steps: &[AutoBatchStep],
    reserved: &mut HashMap<CellKey, String>,
) -> (Vec<AutoBatchStep>, bool) {
    let mut col = unit.q;
    let mut row = unit.r;
    let mut accepted: Vec<AutoBatchStep> = Vec::new();

    for step in steps {
        // Tylko ortogonalne kroki; zły krok to blokada, a nie teleportacja przez barierę.
        if (step.col - col).abs() + (step.row - row).abs() != 1.0 {
            return (accepted, true);
        }
        let key = cell_key(step.col, step.row);
        if let Some(occupant) = reserved.get(&key) {
            if occupant != &unit.id {
                return (accepted, true);
            }
        }
        reserved.insert(key, unit.id.clone());
        col = step.col;
        row = step.row;
        accepted.push(AutoBatchStep { col, row });
    }
    (accepted, false)
}

/// Port `resolveAutoBatchPhase(phase, units, intents)` z `autoBatchPhase.ts:64-190`.
///
/// Zwraca rozstrzygnięcia w kolejności rostera (`units`), tylko dla jednostek strony `phase`,
/// które nie są `acted` i przeszły filtr żywych.
pub fn resolve_auto_batch_phase(
    phase: AutoBatchPhase,
    units: &[AutoBatchUnitSnapshot],
    intents: &[AutoBatchIntent],
) -> Vec<AutoBatchResolution> {
    let mut live: HashMap<&str, &AutoBatchUnitSnapshot> = HashMap::new();
    let mut reserved: HashMap<CellKey, String> = HashMap::new();

    for unit in units {
        if outside_live_roster(unit) {
            continue;
        }
        live.insert(unit.id.as_str(), unit);
        if unit.occupies != Some(false) {
            reserved.insert(cell_key(unit.q, unit.r), unit.id.clone());
        }
    }

    let mut intent_by_id: HashMap<&str, &AutoBatchIntent> = HashMap::new();
    for intent in intents {
        if intent.side == phase {
            intent_by_id.insert(intent.unit_id.as_str(), intent);
        }
    }

    let mut resolutions: Vec<AutoBatchResolution> = Vec::new();
    for unit in units {
        if unit.side != phase
            || unit.acted
            || outside_live_roster(unit)
            || !live.contains_key(unit.id.as_str())
        {
            continue;
        }

        let fallback = AutoBatchIntent {
            unit_id: unit.id.clone(),
            side: phase,
            kind: AutoBatchIntentKind::Hold,
            steps: Vec::new(),
            target_id: None,
        };
        let intent: &AutoBatchIntent = intent_by_id
            .get(unit.id.as_str())
            .copied()
            .unwrap_or(&fallback);

        if intent.kind == AutoBatchIntentKind::Attack {
            // Pusty identyfikator (`targetId: ''`) jest falsy w webie -> brak celu.
            let target = intent
                .target_id
                .as_deref()
                .filter(|id| !id.is_empty())
                .and_then(|id| live.get(id).copied());
            let target_available = target.is_some_and(|t| t.side != phase && !t.routed);
            if !target_available {
                resolutions.push(AutoBatchResolution {
                    unit_id: intent.unit_id.clone(),
                    side: intent.side,
                    kind: AutoBatchIntentKind::Hold,
                    steps: Vec::new(),
                    target_id: None,
                    blocked: true,
                });
                continue;
            }

            let (path, blocked) = accept_steps(unit, &intent.steps, &mut reserved);
            if blocked {
                let kind = if path.is_empty() {
                    AutoBatchIntentKind::Hold
                } else {
                    AutoBatchIntentKind::Move
                };
                resolutions.push(AutoBatchResolution {
                    unit_id: intent.unit_id.clone(),
                    side: intent.side,
                    kind,
                    steps: path,
                    target_id: None,
                    blocked: true,
                });
                continue;
            }
            resolutions.push(AutoBatchResolution {
                unit_id: intent.unit_id.clone(),
                side: intent.side,
                kind: AutoBatchIntentKind::Attack,
                steps: path,
                target_id: intent.target_id.clone(),
                blocked: false,
            });
            continue;
        }

        if intent.kind != AutoBatchIntentKind::Move || intent.steps.is_empty() {
            resolutions.push(AutoBatchResolution {
                unit_id: intent.unit_id.clone(),
                side: intent.side,
                kind: intent.kind,
                steps: intent.steps.clone(),
                target_id: intent.target_id.clone(),
                blocked: false,
            });
            continue;
        }

        let (path, blocked) = accept_steps(unit, &intent.steps, &mut reserved);
        resolutions.push(AutoBatchResolution {
            unit_id: intent.unit_id.clone(),
            side: intent.side,
            kind: intent.kind,
            steps: path,
            target_id: intent.target_id.clone(),
            blocked,
        });
    }

    resolutions
}
