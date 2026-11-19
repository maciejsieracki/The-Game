//! R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369, część A): sesja bitwy oblężniczej w domenie silnika, bez mostu.
//!
//! Produkcyjny wołający [`SiegeLoop`] + [`ProdBody`]: odpowiednik gałęzi `onBattlefield` po `launchSiegeStormFromMap`
//! (pin `07d2fbd72`, `main.ts:36799-37010`): rostery szturmu (T6, `siege_battle_adapter*`), `new BattleScene(...)`
//! (`main.ts:36980-37018`; pole T5a/T5b `battle_setup*`, rozstawienie, wieżyczki, kara morale `_applyStartingMoralePowerPenalty`
//! `battleScene.ts:5597-5629`), `bs.play(...)` (`main.ts:37019`, `play` `battleScene.ts:3547`, `_startBattle` `:3558-3600`,
//! `_kickoffBattleTurn` `:3615-3631`) i dwa sterowniki czasu (D-WIR-3):
//! * czas rzeczywisty ([`SiegeBattleSession::step`]): klatki `_startLoop` poza przewijaniem (`:9274-9277`,
//!   `_advanceVClock` + `_drainTimers`), `_ffActive = false`, akcje `Damage` emitowane;
//! * przewijanie ([`SiegeBattleSession::skip`]): `skip()` (`:3680-3707`) po starcie = `_runFastForward` (`:9415-9437`),
//!   `_ffActive = true`; przed startem (`_skipInstantFallback`, `:3698`) = jawny błąd (R7, do #167).
//!
//! Zakres trybu (D-WIR-2): AUTO bez generała atakującego (`deploy = false`, `manualControlAllowed = false`,
//! `_manualMode = !gate || hasCommander` = `false`, `:3567-3570`). Generał atakującego = [`SessionError::ManualModeNotPorted`]
//! (bez cichego przejścia na AUTO). Zastosowanie wyniku do `PlayableState` i zdobycie miasta: część B / #354, nie tu;
//! [`SiegeBattleSession::finish`] zwraca wynik jako DANE.
//!
//! RNG (D-WIR-5): [`SessionRolls`] = `domain/rng.rs` (LCG) z ziarnem pochodnym `PlayableState.params.seed` i numeru bitwy;
//! jeden rzut na wywołanie `Math.random` (`_singleBlow` `:8961`, jedyne wywołanie w ciele portu).
//!
//! Wejście ciosu (dług U5/F4 T4, D-ADP-6 T6): [`SessionBlowComposer`] składa [`FullBlowInput`] W CHWILI CIOSU jak
//! `_singleBlow` (`:8811-8960`) z bieżących pozycji i flag, dla każdej pary (bez szablonów per cel).

use std::collections::{BTreeMap, BTreeSet, HashMap};

use crate::data::units_combat::{
    parse_combat_params, parse_terrain_combat, COUNTERS_JSON, TERRAIN_COMBAT_JSON, UNITS_JSON,
};
use crate::domain::battle_setup::{
    setup_battle_field, BattleField, BattleFieldInput, FieldMoveTerrain, SiegeFieldInput,
};
use crate::domain::battle_setup_terrain::WorldTerrainInput;
use crate::domain::battle_setup_units::{place_units_on_field, Side};
use crate::domain::city_towers::strongest_ranged_unit_for_era;
use crate::domain::city_towers::UnitRow;
use crate::domain::civ_bonuses::{
    civ_combat_stat_multipliers, civ_wall_defense_multiplier, CivBonusEntry, CivBonusUnitShape,
    CivCombatContext, CombatSide,
};
use crate::domain::combat::unit_building_bonuses::{
    merge_building_bonus_into_stat_multipliers, BuildingCombatBonus, StatMultipliersLike,
};
use crate::domain::playable::PlayableState;
use crate::domain::rng::Rng;
use crate::domain::siege_battle_adapter::{
    collect_siege_rosters, stat_rows_from_json, unit_def_index, AdapterError, MachineKind,
    MilitiaParams, RosterUnit, SiegeRosterInput, BATTLE_MAX_PER_SIDE,
};
use crate::domain::siege_battle_adapter_body::clamp_era;
use crate::domain::siege_battle_adapter_body::{
    activate_unit_for, body_unit_inputs, install_body_inputs, scene_inputs, tower_setup_for,
    BodyUnitInputs, TowerParams, TowerSetupInput, UnitPlacement,
};
use crate::domain::siege_battle_adapter_playable::siege_inputs_from_playable;
use crate::domain::siege_battle_adapter_unit::counter_multiplier_pin;
use crate::domain::siege_battle_adapter_unit::{
    apply_starting_morale_power_penalty, counter_matrix, norm_counters, roster_to_battle_units,
    spawn_fields, unit_blow_template, AdapterBattleUnit, CounterRow, OwnerContext, RosterBattleCtx,
    SpawnEnv, SpawnSlot, StartingMoraleParams, UnitBlowTemplate, UnitDefFallback,
};
use crate::domain::siege_no_breach::siege_no_breach_max_rounds_from_data;
use crate::domain::siege_tactics_actions::{BattleAction, TimedAction, BLOW_HIT_T};
use crate::domain::siege_tactics_blow::{DefenderState, HitArc, RollSource};
use crate::domain::siege_tactics_blow_env::{
    blow_env_for, BlowPlacement, BlowSceneCtx, TerrainRow, TileMap,
};
use crate::domain::siege_tactics_blow_full::{attacker_from_cu, AttackerCu};
use crate::domain::siege_tactics_blow_full::{AtkMods, DefMods, FullBlowInput};
use crate::domain::siege_tactics_clock::VirtualClock;
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_fastforward::{FfStop, BATTLE_FRAME_WALL_MS};
use crate::domain::siege_tactics_inputs_terrain::{
    norm_terrain, terrain_defense_multiplier, TerrainEntry,
};
use crate::domain::siege_tactics_inputs_unit::CombatUnitModel;
use crate::domain::siege_tactics_inputs_unit::{StatRow, ToCombatUnitOpts};
use crate::domain::siege_tactics_inputs_wall::{wall_defense_totals, MiastoWallParamValues};
use crate::domain::siege_tactics_loop::{
    tower_shooter_cu, BlowComposer, BlowSite, LoopTimer, LoopWinner, ProdBody, ProdUnit, SiegeEnv,
    SiegeLoop, TowerBlowSite,
};
use crate::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use crate::domain::siege_tactics_unit::CombatUnit;

/// Sufit iteracji przewijania na jedno wywołanie [`SiegeBattleSession::skip`] (zamiast budżetu 40 ms ściennych pinu,
/// `:9422`). Pin wraca do pętli w kolejnej klatce; sesja wykonuje kolejne porcje aż do końca bitwy, więc sufit chroni
/// tylko przed pętlą bez końca w porcie (stan ustalony bez sufitu tur jest w pinie nieosiągalny: `_roundCapVerdict`).
pub const SKIP_STEP_BUDGET: u32 = 2_000_000;

/// Przesunięcie identyfikatorów obrońców w [`TurnSeqState`] (`SeqUnit::id`): atakujący `i`, obrońca `DEF_ID_BASE + i`.
pub const DEF_ID_BASE: u64 = 1 << 32;

/// Błędy sesji (jawne, bez cichych wartości domyślnych).
#[derive(Debug, Clone, PartialEq)]
pub enum SessionError {
    /// Błąd adaptera T6 (brak miasta, brak muru, brak obrońców, dane jednostek, NaN/Inf...).
    Adapter(AdapterError),
    /// D-WIR-2: atakujący z generałem = faza rozstawienia i tryb ręczny (`deploy = true`, `_manualMode = true`), K5EXEC #268.
    ManualModeNotPorted {
        general_id: String,
    },
    /// R7: `skip()` przed `started` = `_skipInstantFallback` (`:3698`) wymaga `resolveCombat` z wejściami #135/#167.
    SkipBeforeStartNotPorted,
    /// Wywołanie po zakończeniu bitwy (`step`/`skip`) albo `finish` przed końcem.
    NotFinished,
    AlreadyFinished,
    /// Jednostka atakująca (kotwica) nie istnieje w stanie.
    AnchorNotFound(u64),
    /// Pętla zatrzymana na ścieżce spoza zakresu sterownika (`SiegeLoop::unsupported`).
    LoopUnsupported(&'static str),
    /// Dane silnika nie dają się wczytać albo naruszają niezmiennik sesji.
    InvalidData(String),
}

impl From<AdapterError> for SessionError {
    fn from(e: AdapterError) -> Self {
        match e {
            AdapterError::AttackerHasGeneral(id) => {
                SessionError::ManualModeNotPorted { general_id: id }
            }
            other => SessionError::Adapter(other),
        }
    }
}

impl std::fmt::Display for SessionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for SessionError {}

/// D-WIR-5: produkcyjne źródło rzutów (`Math.random()` pinu) na LCG `domain/rng.rs`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SessionRolls {
    rng: Rng,
    /// Liczba wykonanych rzutów (diagnostyka i testy kolejności).
    pub drawn: u64,
}

impl SessionRolls {
    /// Ziarno pochodne: `seed` gry (`PlayableState.params.seed`) i numer bitwy w grze (licznik wołającego).
    /// Mieszanie `splitmix`-podobne (stałe Knutha), żeby kolejne bitwy tej samej gry nie dzieliły strumienia.
    #[must_use]
    pub fn derive(seed: u32, battle_index: u32) -> Self {
        let mixed = seed ^ battle_index.wrapping_mul(0x9E37_79B9) ^ 0x5349_4547; // "SIEG"
        Self {
            rng: Rng::from_seed(mixed),
            drawn: 0,
        }
    }

    /// Stan strumienia (zapis/powtórka).
    #[must_use]
    pub fn state(&self) -> u32 {
        self.rng.state()
    }
}

impl RollSource for SessionRolls {
    fn next_unit(&mut self) -> f64 {
        self.drawn += 1;
        self.rng.next_f64()
    }
}

/// Dane statyczne bitwy (pliki danych). [`SessionData::engine`] = dane wbudowane silnika (`rust-port/data`); dryf
/// wobec pinu (D-ADP-4) jest wejściem tego wyboru, nie zgadywaniem.
#[derive(Debug, Clone, PartialEq)]
pub struct SessionData {
    /// `units.json` jako wiersze statystyk (`lookupUnitDef`).
    pub unit_rows: Vec<StatRow>,
    /// `units.json` jako surowe obiekty (`_battleData.units`, wieżyczki `strongestRangedUnitForEra`).
    pub tower_units: Vec<UnitRow>,
    /// `counters.json` po `normCounters`.
    pub counters: Vec<CounterRow>,
    /// `combat-params.json` `counter_multiplier`.
    pub counter_mult: f64,
    /// `terrain-combat.json` (`Teren`, `Bonus Obrona`).
    pub terrain_rows: Vec<TerrainRow>,
    /// `terrain-combat.json` (`Teren`, `Δ Zasięg (dystansowi)`) dla `terrainRangeDelta` (`combat.ts:730-742`), obrona r2
    /// E2-1a (D-WIRA-16).
    pub terrain_range_rows: Vec<TerrainRangeRow>,
    pub river_attack_mult: f64,
    pub brod_kara_obrona: f64,
    pub brod_bonus_brzegu: f64,
    pub fortify_obrona_proc: f64,
    /// `siegeNoBreachMaxRounds` (`combat-params.json` `oblężenie.bez_wylomu_max_tur`).
    pub no_breach_cap: i64,
    pub militia: MilitiaParams,
    pub towers: TowerParams,
    pub starting_morale: StartingMoraleParams,
    /// `miasto-params.json` bonusy muru (`None` = wartość domyślna pinu w `wall_defense_totals`).
    pub wall_params: MiastoWallParamValues,
    /// `toCombatUnit` (`armyHungerStatMult`, `goldDeficitStatMult` sceny; pin domyślnie 0.75).
    pub combat_opts: ToCombatUnitOpts,
    /// D-ADP-1: typ spoza `units.json` = rekord zastępczy pinu.
    pub fallback: UnitDefFallback,
}

impl SessionData {
    /// Dane wbudowane silnika.
    ///
    /// # Errors
    /// Błąd parsowania danych.
    pub fn engine() -> Result<Self, SessionError> {
        let bad = |e: &dyn std::fmt::Display| SessionError::InvalidData(e.to_string());
        let units: serde_json::Value = serde_json::from_str(UNITS_JSON).map_err(|e| bad(&e))?;
        let unit_rows = stat_rows_from_json(&units)?;
        let tower_units: Vec<UnitRow> = units
            .as_array()
            .ok_or_else(|| SessionError::InvalidData("units.json: brak tablicy".into()))?
            .iter()
            .map(|u| serde_json::from_value(u.clone()).map_err(|e| bad(&e)))
            .collect::<Result<_, _>>()?;
        let counters_raw: serde_json::Value =
            serde_json::from_str(COUNTERS_JSON).map_err(|e| bad(&e))?;
        let cp = parse_combat_params().map_err(|e| bad(&e))?;
        let terrain = parse_terrain_combat().map_err(|e| bad(&e))?;
        let _ = TERRAIN_COMBAT_JSON;
        let no_breach_cap = siege_no_breach_max_rounds_from_data().map_err(|e| bad(&e))?;
        Ok(Self {
            unit_rows,
            tower_units,
            counters: norm_counters(&counters_raw),
            counter_mult: cp.counter_multiplier,
            terrain_rows: terrain
                .iter()
                .map(|t| TerrainRow {
                    teren: t.teren.clone(),
                    bonus_obrona: Some(t.bonus_obrona.clone()),
                })
                .collect(),
            terrain_range_rows: terrain
                .iter()
                .map(|t| TerrainRangeRow {
                    teren: t.teren.clone(),
                    delta_zasieg: Some(t.delta_zasieg_dystansowi.clone()),
                })
                .collect(),
            river_attack_mult: cp.river_attack_mult,
            brod_kara_obrona: cp.brod.kara_obrona,
            brod_bonus_brzegu: cp.brod.bonus_obrona_brzegu,
            fortify_obrona_proc: cp.oblezenie.fortify_obrona_proc as f64,
            no_breach_cap,
            militia: MilitiaParams::pin(),
            towers: TowerParams::pin(),
            starting_morale: StartingMoraleParams {
                wspolczynnik_proc: cp.morale_przewaga_mocy.wspolczynnik_proc as f64,
                sufit_proc: cp.morale_przewaga_mocy.sufit_proc as f64,
                epsilon_ponad_flee: cp.morale_przewaga_mocy.epsilon_ponad_flee as f64,
            },
            wall_params: MiastoWallParamValues::default(),
            combat_opts: ToCombatUnitOpts::default(),
            fallback: UnitDefFallback::PinRecord,
        })
    }
}

/// Wiersz `terrain-combat.json` czytany przez `terrainRangeDelta` (`combat.ts:730-742`): `Teren` i surowa kolumna
/// `Δ Zasięg (dystansowi)` (`RANGE_DELTA_KEY` `:714`; `None` = `null`/`undefined`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TerrainRangeRow {
    pub teren: String,
    pub delta_zasieg: Option<String>,
}

/// `terrainRangeDelta(terrain, terrainData)` (`combat.ts:730-742`): wpis po `normTerrain` (`findTerrainEntry`
/// `:706-710`, pusty teren albo pusta tablica = brak), surowa wartość z `−` zamienionym na `-`, pierwsze dopasowanie
/// `/([+-]?\d+)/` i `parseInt(.., 10)`; brak wpisu, wartości albo dopasowania = `0`.
#[must_use]
pub fn terrain_range_delta(terrain: &str, rows: &[TerrainRangeRow]) -> f64 {
    if terrain.is_empty() || rows.is_empty() {
        return 0.0;
    }
    let want = norm_terrain(terrain);
    let Some(entry) = rows.iter().find(|t| norm_terrain(&t.teren) == want) else {
        return 0.0;
    };
    let Some(raw) = entry.delta_zasieg.as_deref() else {
        return 0.0;
    };
    let s = raw.replace('\u{2212}', "-");
    let b = s.as_bytes();
    let digit = |i: usize| b.get(i).is_some_and(u8::is_ascii_digit);
    // Najbardziej lewe dopasowanie `[+-]?\d+`: znak liczy się tylko, gdy po nim stoi cyfra.
    let Some(start) =
        (0..b.len()).find(|&i| digit(i) || (matches!(b[i], b'+' | b'-') && digit(i + 1)))
    else {
        return 0.0;
    };
    let mut end = if digit(start) { start } else { start + 1 };
    while digit(end) {
        end += 1;
    }
    s[start..end].parse::<f64>().unwrap_or(0.0)
}

/// Wejście startu sesji (pola `launchSiegeStormFromMap` / `new BattleScene` spoza `PlayableState`).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeSessionInput {
    /// Miasto szturmowane.
    pub city_id: u64,
    /// Jednostka gracza, z której wydano szturm (kotwica rosteru, `anchor`).
    pub anchor_unit_id: u64,
    /// Numer bitwy w grze (D-WIR-5; licznik prowadzi wołający, część B).
    pub battle_index: u32,
    /// Kontekst właścicieli (`civBonusyForOwnerId`, głód, deficyt, trudność, budynki imperium) — producent: część B.
    pub owners: BTreeMap<i64, OwnerContext>,
    /// Epoka właściciela miasta (milicja `militiaEraIndex`).
    pub owner_era: Option<f64>,
    /// `opts.defenderEra` (wieżyczki `clampEra`).
    pub defender_era: Option<f64>,
    /// `opts.siege.defCiv` (`ikonaIdToBronzeCiv(defCivId)`).
    pub def_civ: Option<String>,
    /// `dTeren` (`map.hexes[key].terenBazowy ?? 'Rownina'`).
    pub teren: String,
    /// `worldTerrainFromHex(dHex)`.
    pub world_terrain: Option<WorldTerrainInput>,
}

/// Wejście `new BattleScene(opts)` po rosterach (`main.ts:36980-37018`): `BattleUnit` obu stron w kolejności rosteru
/// (po `BATTLE_MAX_PER_SIDE`) i pola `BattleOpts` czytane przez logikę bitwy.
#[derive(Debug, Clone, PartialEq)]
pub struct SceneInput {
    /// `opts.attacker` (`rosterToBattleUnits(atkRosterRef)`).
    pub atk: Vec<AdapterBattleUnit>,
    /// `opts.defender`.
    pub def: Vec<AdapterBattleUnit>,
    /// `opts.siege.builtBuildingIds`.
    pub built_building_ids: Vec<String>,
    /// `opts.teren` (`dTeren`).
    pub teren: String,
    /// `opts.worldTerrain`.
    pub world_terrain: Option<WorldTerrainInput>,
    /// `opts.defenderEra` (przed `clampEra`).
    pub defender_era: Option<f64>,
    /// `opts.siege.defCiv`.
    pub def_civ: Option<String>,
    /// `(opts.defenderCivBonusy, opts.defenderDifficultyCombatMult)` dla syntetycznego strzelca wieży (`_fireOneTower`
    /// `:4236-4244`); `None` = brak kontekstu = jawny tag `wieza-bez-kompozytora`.
    pub defender_side: Option<(Vec<CivBonusEntry>, f64)>,
    /// D-WIR-5: ziarno gry i numer bitwy (`SessionRolls::derive`).
    pub seed: u32,
    pub battle_index: u32,
    /// Gotowe machiny miasta (zużywane po bitwie, DANE).
    pub ready_machines: Vec<MachineKind>,
}

/// Faza sesji (pin: `started`, `finished`, `_ffActive`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SessionPhase {
    /// Scena zbudowana, `play()` jeszcze nie wywołane (`started = false`).
    Prepared,
    /// Czas rzeczywisty (`started`, `!_ffActive`).
    Running,
    /// Przewijanie po `skip()` (`_ffActive`).
    Skipping,
    /// `finished`.
    Finished,
}

/// Raport jednego [`SiegeBattleSession::step`].
#[derive(Debug, Clone, PartialEq)]
pub struct StepReport {
    /// Liczba klatek `_startLoop` wykonanych w tym kroku.
    pub frames: u32,
    /// Liczba odpalonych klocków zegara.
    pub fired: u32,
    /// Akcje sceny wytworzone w tym kroku (kolejność pinu).
    pub actions: Vec<TimedAction>,
    pub finished: bool,
}

/// Jednostka w wyniku bitwy (DANE; zastosowanie do stanu = część B).
#[derive(Debug, Clone, PartialEq)]
pub struct OutcomeUnit {
    /// Identyfikator rosteru (`RuntimeUnit.id`, milicja: id syntetyczne adaptera).
    pub roster_id: String,
    pub side: Side,
    pub hp: f64,
    pub max_hp: f64,
    pub dead: bool,
    pub routed: bool,
    /// `removed` (uciekł z pola).
    pub removed: bool,
}

/// Wynik bitwy (`finish`).
#[derive(Debug, Clone, PartialEq)]
pub struct SessionOutcome {
    pub winner: LoopWinner,
    pub round_no: i64,
    pub units: Vec<OutcomeUnit>,
    /// Gotowe machiny miasta zużyte po bitwie (`consumeReadyMachines(city)`, `main.ts:37023`): wszystkie gotowe.
    pub consumed_machines: Vec<MachineKind>,
    /// `wallEverBreached`.
    pub wall_ever_breached: bool,
    /// Ścieżki nieportowane ciała (kryterium startu #369: pusta lista).
    pub unported: Vec<(String, &'static str)>,
    /// Liczba rzutów RNG zużytych w bitwie.
    pub rolls_drawn: u64,
}

/// Dane walki jednej jednostki dla [`SessionBlowComposer`] (statyczne części `_singleBlow`).
#[derive(Debug, Clone, PartialEq)]
struct ComposeUnit {
    tmpl: UnitBlowTemplate,
    side_def: bool,
    diff_mult: f64,
    civ_bonusy: Vec<CivBonusEntry>,
    building: BuildingCombatBonus,
    fortified_in_field: bool,
    max_hp: f64,
}

/// K5LOOP-WIRING-A r2 (Z2): syntetyczny strzelec wieży (`_fireOneTower` `:4236-4244`) dla [`BlowComposer::compose_tower`].
#[derive(Debug, Clone, PartialEq)]
struct TowerShooterCompose {
    /// `cuA = toCombatUnit(shooter.bu)` (`stats: towerShooterRow`).
    cu: CombatUnitModel,
    attacker: AttackerCu,
    /// `battleUnitCivBonusy(shooter.bu, this.defenderCivBonusy)` = `defenderCivBonusy` (syntetyczny `bu` bez
    /// `civBonusy`; `main.ts:36995` `civBonusyForOwnerId(defRosterRef[0]?.ownerId ?? 0)`).
    civ_bonusy: Vec<CivBonusEntry>,
    /// `battleUnitDifficultyCombatMult(shooter.bu, this.defenderDifficultyCombatMult)` = trudność strony obrońcy.
    diff_mult: f64,
    /// `counterMultiplier(cuA.counterTyp, cuD.counterTyp)` dla każdego celu ze strony atakującego.
    counters: Vec<f64>,
}

/// Kompozytor wejścia ciosu sesji: `_singleBlow` (`battleScene.ts:8811-8960`) dla dowolnej pary w chwili ciosu.
#[derive(Debug, Clone, PartialEq)]
pub struct SessionBlowComposer {
    units: [Vec<ComposeUnit>; 2],
    /// `counterMultiplier(cuA.counterTyp, cuD.counterTyp)`: `[0][a][d]` atakujący→obrońca, `[1][d][a]` obrońca→atakujący.
    counters: [Vec<Vec<f64>>; 2],
    ctx: BlowSceneCtx,
    /// Strzelec wieży (`None` = brak wiersza strzelca = brak wystrzałów, `:4209`).
    tower: Option<TowerShooterCompose>,
}

fn shape_of_cu(cu: &CombatUnitModel) -> CivBonusUnitShape {
    CivBonusUnitShape {
        typ_nazwa: cu.typ_nazwa.js_to_string(),
        rola: cu.rola.clone(),
        missile_attack: Some(cu.missile_attack),
        counter_typ: Some(cu.counter_typ.clone()),
    }
}

fn shape_of(t: &UnitBlowTemplate) -> CivBonusUnitShape {
    shape_of_cu(&t.cu)
}

fn mods_for(
    u: &ComposeUnit,
    side: CombatSide,
    terrain: &str,
    is_charge: bool,
    on_wall: bool,
) -> StatMultipliersLike {
    mods_for_parts(
        &u.civ_bonusy,
        &shape_of(&u.tmpl),
        &u.building,
        side,
        terrain,
        is_charge,
        on_wall,
    )
}

fn mods_for_parts(
    civ_bonusy: &[CivBonusEntry],
    shape: &CivBonusUnitShape,
    building: &BuildingCombatBonus,
    side: CombatSide,
    terrain: &str,
    is_charge: bool,
    on_wall: bool,
) -> StatMultipliersLike {
    let ctx = CivCombatContext {
        side,
        terrain: terrain.to_owned(),
        is_charge_round: is_charge,
        // `attackerOwnTerritory` / `defenderOwnTerritory` nie są podawane przez szturm (`main.ts:36980-37018`): `false`.
        own_territory: false,
        on_wall_walkway: on_wall,
        shallow_sea: false,
    };
    let m = civ_combat_stat_multipliers(civ_bonusy, shape, &ctx);
    let mut like = StatMultipliersLike {
        atk: m.atk,
        obrona: m.obrona,
        pancerz: m.pancerz,
        uderzenie: m.uderzenie,
        ranged_atk: m.ranged_atk,
        health: m.health,
    };
    merge_building_bonus_into_stat_multipliers(&mut like, Some(building));
    like
}

fn side_ix(s: BattleSide) -> usize {
    match s {
        BattleSide::Attacker => 0,
        BattleSide::Defender => 1,
    }
}

impl BlowComposer for SessionBlowComposer {
    fn compose(&self, site: &BlowSite) -> FullBlowInput {
        let a = &self.units[side_ix(site.attacker.side)][site.attacker.idx];
        let d = &self.units[side_ix(site.target.side)][site.target.idx];
        let p = BlowPlacement {
            attacker: (site.attacker_cell.0 as i32, site.attacker_cell.1 as i32),
            defender: (site.target_cell.0 as i32, site.target_cell.1 as i32),
            defender_facing: 0,
            defender_on_wall: site.target_on_wall,
            defender_side_def: d.side_def,
            atk_rola: a.tmpl.cu.rola.clone(),
        };
        let env = blow_env_for(&self.ctx, &p);
        // `defTerrain` (`:8831-8833`) dla `civCombatStatMultipliers` (`terrain: defTerrain`).
        let def_terrain = if site.target_on_wall {
            "Plaskie (rownina/laka)".to_owned()
        } else {
            self.ctx
                .map
                .name(site.target_cell.0 as i32, site.target_cell.1 as i32)
                .to_owned()
        };
        // `isCharge = firstBlow && !bracesAgainstCharge(defender.bu)` tylko wręcz (`:8892-8898`).
        let is_charge = !site.ranged && site.first_blow && !d.tmpl.braces_against_charge;
        // `atkBonusy` strony atakującego ciosu: `battleUnitCivBonusy(bu, side)` = `bu.civBonusy` (adapter podaje zawsze).
        let am = mods_for(a, CombatSide::Attacker, &def_terrain, is_charge, false);
        let dm = mods_for(
            d,
            CombatSide::Defender,
            &def_terrain,
            is_charge,
            site.target_on_wall,
        );
        let counter_mult = match site.attacker.side {
            BattleSide::Attacker => self.counters[0][site.attacker.idx][site.target.idx],
            BattleSide::Defender => self.counters[1][site.attacker.idx][site.target.idx],
        };
        let wall_civ = if site.target_on_wall {
            civ_wall_defense_multiplier(&d.civ_bonusy, &shape_of(&d.tmpl))
        } else {
            1.0
        };
        FullBlowInput {
            ranged: site.ranged,
            hit_arc: HitArc::Front,
            attacker: a.tmpl.attacker.clone(),
            atk_mods: AtkMods {
                atk: am.atk,
                ranged_atk: am.ranged_atk,
                uderzenie: am.uderzenie,
            },
            atk_diff_mult: a.diff_mult,
            atk_mounted: a.tmpl.mounted,
            defender: d.tmpl.defender.clone(),
            def_mods: DefMods {
                obrona: dm.obrona,
                pancerz: dm.pancerz,
            },
            def_diff_mult: d.diff_mult,
            def_on_wall: site.target_on_wall,
            def_fortified_in_field: d.fortified_in_field,
            def_wall_civ_mult: wall_civ,
            def_braces_against_charge: d.tmpl.braces_against_charge,
            first_blow_of_pair: site.first_blow,
            counter_mult,
            env,
            defender_state: DefenderState {
                hp: 0.0,
                max_hp: d.max_hp,
                morale: 0.0,
                flee_morale: 0.0,
                dead: false,
                fading_out: false,
                routed: false,
                never_rout: false,
                removed: false,
            },
            routed_after_morale: false,
        }
    }

    /// `_checkRout` (`:9790-9792`): mnożnik terenu z bieżącego kafla jednostki.
    fn terrain_defence_mult(&self, unit: UnitRef, cell: (i64, i64)) -> Option<f64> {
        let u = self.units[side_ix(unit.side)].get(unit.idx)?;
        let tname = self.ctx.map.name(cell.0 as i32, cell.1 as i32);
        Some(terrain_defense_multiplier(
            tname,
            &u.tmpl.cu.rola,
            &entries(&self.ctx.terrain_data),
        ))
    }

    /// `_singleBlow(shooter, target, true)` z `_fireOneTower` (`:4236-4264`): strzelec `side: 'def'` na `(wallCol, row)`,
    /// `onWallWalkway: false`, `mounted: false`, bez `pancerzBonusFrac`/`parametryBonusFrac` (`{0, 0}`); `ranged` = brak
    /// szarży (`isCharge = false`, `:8892`). `hit_arc` i stan celu nadpisuje [`ProdBody`].
    fn compose_tower(&self, site: &TowerBlowSite) -> Option<FullBlowInput> {
        let sh = self.tower.as_ref()?;
        let d = &self.units[side_ix(site.target.side)][site.target.idx];
        let p = BlowPlacement {
            attacker: (site.shooter_cell.0 as i32, site.shooter_cell.1 as i32),
            defender: (site.target_cell.0 as i32, site.target_cell.1 as i32),
            defender_facing: 0,
            defender_on_wall: site.target_on_wall,
            defender_side_def: d.side_def,
            atk_rola: sh.cu.rola.clone(),
        };
        let env = blow_env_for(&self.ctx, &p);
        let def_terrain = if site.target_on_wall {
            "Plaskie (rownina/laka)".to_owned()
        } else {
            self.ctx
                .map
                .name(site.target_cell.0 as i32, site.target_cell.1 as i32)
                .to_owned()
        };
        let no_building = BuildingCombatBonus {
            pancerz: 0.0,
            other: 0.0,
        };
        let am = mods_for_parts(
            &sh.civ_bonusy,
            &shape_of_cu(&sh.cu),
            &no_building,
            CombatSide::Attacker,
            &def_terrain,
            false,
            false,
        );
        let dm = mods_for(
            d,
            CombatSide::Defender,
            &def_terrain,
            false,
            site.target_on_wall,
        );
        let wall_civ = if site.target_on_wall {
            civ_wall_defense_multiplier(&d.civ_bonusy, &shape_of(&d.tmpl))
        } else {
            1.0
        };
        Some(FullBlowInput {
            ranged: true,
            hit_arc: HitArc::Front,
            attacker: sh.attacker.clone(),
            atk_mods: AtkMods {
                atk: am.atk,
                ranged_atk: am.ranged_atk,
                uderzenie: am.uderzenie,
            },
            atk_diff_mult: sh.diff_mult,
            atk_mounted: false,
            defender: d.tmpl.defender.clone(),
            def_mods: DefMods {
                obrona: dm.obrona,
                pancerz: dm.pancerz,
            },
            def_diff_mult: d.diff_mult,
            def_on_wall: site.target_on_wall,
            def_fortified_in_field: d.fortified_in_field,
            def_wall_civ_mult: wall_civ,
            def_braces_against_charge: d.tmpl.braces_against_charge,
            first_blow_of_pair: true,
            counter_mult: *sh.counters.get(site.target.idx)?,
            env,
            defender_state: DefenderState {
                hp: 0.0,
                max_hp: d.max_hp,
                morale: 0.0,
                flee_morale: 0.0,
                dead: false,
                fading_out: false,
                routed: false,
                never_rout: false,
                removed: false,
            },
            routed_after_morale: false,
        })
    }
}

/// Sesja bitwy oblężniczej (scena + pętla + zegar).
pub struct SiegeBattleSession {
    lp: SiegeLoop<ProdBody<SessionRolls>>,
    clock: VirtualClock<LoopTimer>,
    phase: SessionPhase,
    /// Reszta czasu ściennego poniżej jednej klatki (kwantyzacja D-WIRA-3).
    wall_acc: f64,
    /// Znacznik czasu ściennego ostatniej klatki (`t` z `requestAnimationFrame`).
    wall_now: f64,
    roster_ids: [Vec<String>; 2],
    max_hp: [Vec<f64>; 2],
    ready_machines: Vec<MachineKind>,
    field: BattleField,
}

fn entries(rows: &[TerrainRow]) -> Vec<TerrainEntry<'_>> {
    rows.iter()
        .map(|r| TerrainEntry {
            teren: r.teren.as_str(),
            bonus_obrona: r.bonus_obrona.as_deref(),
        })
        .collect()
}

impl SiegeBattleSession {
    /// `launchSiegeStormFromMap` → `onBattlefield` → `new BattleScene(...)` → `bs.play(...)`: sesja w fazie
    /// [`SessionPhase::Running`] (pierwsza tura rozpoczęta, `_kickoffBattleTurn` → `_beginTurn`).
    ///
    /// # Errors
    /// [`SessionError`] (adapter, tryb ręczny, dane).
    pub fn start(
        state: &PlayableState,
        input: &SiegeSessionInput,
        data: &SessionData,
    ) -> Result<Self, SessionError> {
        let mut s = Self::prepare(state, input, data)?;
        s.play();
        Ok(s)
    }

    /// Sama budowa sceny (`new BattleScene`), bez `play()` (`started = false`).
    ///
    /// # Errors
    /// [`SessionError`].
    #[allow(clippy::too_many_lines)]
    pub fn prepare(
        state: &PlayableState,
        input: &SiegeSessionInput,
        data: &SessionData,
    ) -> Result<Self, SessionError> {
        let inp = siege_inputs_from_playable(state, input.city_id, input.owner_era)?;
        let anchor = input.anchor_unit_id.to_string();
        if !inp.units.iter().any(|u| u.id == anchor) {
            return Err(SessionError::AnchorNotFound(input.anchor_unit_id));
        }
        let rosters = collect_siege_rosters(&SiegeRosterInput {
            city: &inp.city,
            anchor_id: &anchor,
            units: &inp.units,
            relations: &inp.relations,
            def_opts: inp.def_opts.clone(),
            ready_machines: &inp.ready_machines,
            turn: inp.turn,
            unit_rows: &data.unit_rows,
            militia: &data.militia,
        })?;
        let index = unit_def_index(&data.unit_rows);
        let ctx = RosterBattleCtx {
            rows: &data.unit_rows,
            index: &index,
            militia_defs: &rosters.militia_defs,
            owners: &input.owners,
            fallback: data.fallback,
        };
        let cap = |r: &[RosterUnit]| r[..r.len().min(BATTLE_MAX_PER_SIDE)].to_vec();
        let atk_roster = cap(&rosters.atk);
        let def_roster = cap(&rosters.def);
        let atk_bu = roster_to_battle_units(&atk_roster, Side::Atk, &ctx)?;
        let def_bu = roster_to_battle_units(&def_roster, Side::Def, &ctx)?;
        // `opts.siege.builtBuildingIds = cityBuilt.get(city.id) ?? []` (`main.ts:36990`).
        let built: Vec<String> = state
            .stores
            .buildings_by_city
            .get(&input.city_id)
            .cloned()
            .unwrap_or_default();
        // `defenderCivBonusy` / `defenderDifficultyCombatMult` sceny = właściciel `defRosterRef[0]` (`main.ts:36995`, `:37011`).
        let def_owner = rosters.def.first().map_or(0, |u| u.owner_id);
        let scene_in = SceneInput {
            atk: atk_bu,
            def: def_bu,
            built_building_ids: built,
            teren: input.teren.clone(),
            world_terrain: input.world_terrain.clone(),
            defender_era: input.defender_era,
            def_civ: input.def_civ.clone(),
            defender_side: input
                .owners
                .get(&def_owner)
                .map(|o| (o.civ_bonusy.clone(), o.difficulty_combat_mult)),
            seed: state.params.seed,
            battle_index: input.battle_index,
            ready_machines: inp.ready_machines,
        };
        Self::prepare_scene(&scene_in, data)
    }

    /// `new BattleScene(opts)` z gotowymi `BattleUnit` obu stron (`opts.attacker`/`opts.defender` po
    /// `rosterToBattleUnits`, `main.ts:36980-37018`): pole T5a, rozstawienie T5b, wieżyczki, kara morale, ciało pętli.
    /// Wejście wektorów pinu pełnej bitwy (`tests/p6_k5loop_wiring_a_gen.mjs`) i [`Self::prepare`].
    ///
    /// # Errors
    /// [`SessionError`] (dane, brak muru, NaN/Inf).
    #[allow(clippy::too_many_lines)]
    pub fn prepare_scene(sc: &SceneInput, data: &SessionData) -> Result<Self, SessionError> {
        let atk_bu = &sc.atk;
        let def_bu = &sc.def;
        let built: Vec<String> = sc.built_building_ids.clone();
        // Pole bitwy (T5a): `new BattleScene` `:2776-2817`.
        let field = setup_battle_field(&BattleFieldInput {
            teren: sc.teren.clone(),
            world_terrain: sc.world_terrain.clone(),
            attacker_count: atk_bu.len() as f64,
            defender_count: def_bu.len() as f64,
            siege: Some(SiegeFieldInput {
                built_building_ids: built.clone(),
                tower_spacing: Some(data.towers.spacing),
            }),
        });
        let siege = field
            .siege
            .as_ref()
            .ok_or_else(|| SessionError::InvalidData("pole bez muru przy szturmie".into()))?;
        let layout = siege.layout.clone();
        // Rozstawienie (T5b): `_placeUnits(attackers, defenders, siegeMode = true)`, `deploy = false`, strona gracza `atk`.
        let placement = place_units_on_field(
            &field,
            false,
            Side::Atk,
            &atk_bu
                .iter()
                .map(AdapterBattleUnit::setup_unit)
                .collect::<Vec<_>>(),
            &def_bu
                .iter()
                .map(AdapterBattleUnit::setup_unit)
                .collect::<Vec<_>>(),
        );
        // `this.atk` / `this.def` w kolejności rozstawienia.
        let ordered = |placed: &[crate::domain::battle_setup_units::PlacedUnit],
                       bus: &[AdapterBattleUnit]| {
            placed
                .iter()
                .map(|p| (*p, bus[p.index].clone(), bus[p.index].id.clone()))
                .collect::<Vec<_>>()
        };
        let atk = ordered(&placement.atk, atk_bu);
        let def = ordered(&placement.def, def_bu);
        let env = SpawnEnv {
            terrain: sc.teren.clone(),
            shallow_sea: false,
            // Korona = kafel muru/bramy: `combatTerrainName` = teren płaski, `terrainRangeDelta` = 0 (D-WIRA-6).
            crown_range_delta: 0.0,
        };
        let spawn = |list: &[(
            crate::domain::battle_setup_units::PlacedUnit,
            AdapterBattleUnit,
            String,
        )],
                     atk_side: bool| {
            list.iter()
                .map(|(p, bu, _)| {
                    let slot = if atk_side {
                        SpawnSlot::Attacker
                    } else if p.on_wall_walkway {
                        SpawnSlot::DefenderCrown
                    } else {
                        SpawnSlot::DefenderInner
                    };
                    spawn_fields(bu, slot, &env)
                })
                .collect::<Result<Vec<_>, _>>()
        };
        let mut atk_sf = spawn(&atk, true)?;
        let mut def_sf = spawn(&def, false)?;
        let atk_units: Vec<AdapterBattleUnit> = atk.iter().map(|x| x.1.clone()).collect();
        let def_units: Vec<AdapterBattleUnit> = def.iter().map(|x| x.1.clone()).collect();
        // `_applyStartingMoralePowerPenalty` (`_startBattle` `:3565`): liczone przed pierwszą turą na polach spawnu.
        let _penalty = apply_starting_morale_power_penalty(
            &atk_units,
            &def_units,
            &mut atk_sf,
            &mut def_sf,
            &data.combat_opts,
            &data.starting_morale,
        );
        let ins = |units: &[AdapterBattleUnit],
                   sf: &[crate::domain::siege_battle_adapter_unit::SpawnFields]| {
            units
                .iter()
                .zip(sf)
                .map(|(bu, f)| body_unit_inputs(bu, f, &sc.teren, false))
                .collect::<Result<Vec<BodyUnitInputs>, _>>()
        };
        let atk_in = ins(&atk_units, &atk_sf)?;
        let def_in = ins(&def_units, &def_sf)?;
        let terr_entries = entries(&data.terrain_rows);
        let mk_units = |list: &[(
            crate::domain::battle_setup_units::PlacedUnit,
            AdapterBattleUnit,
            String,
        )],
                        bins: &[BodyUnitInputs]|
         -> Result<Vec<ProdUnit>, SessionError> {
            list.iter()
                .zip(bins)
                .map(|((p, bu, _), u)| {
                    let rola = bu.combat_unit(&data.combat_opts).rola;
                    let tname = field.map.combat_terrain_name_f(p.col as f64, p.row as f64);
                    let tdm = terrain_defense_multiplier(tname, &rola, &terr_entries);
                    // D-T8-N1: na starcie `unitDoctrine = null`, `groupId = null`, `_groupMeta` pusta -> auto = `true`.
                    let activate = activate_unit_for(
                        u,
                        &UnitPlacement {
                            q: p.col,
                            r: p.row,
                            terrain_defence_mult: tdm,
                        },
                        true,
                        false,
                    )?;
                    Ok(ProdUnit {
                        activate,
                        melee_target: None,
                        blow: None,
                        counter_blows: Vec::new(),
                        body_ms: BLOW_HIT_T,
                        facing: f64::from(p.facing as u8),
                    })
                })
                .collect()
        };
        let atk_pu = mk_units(&atk, &atk_in)?;
        let def_pu = mk_units(&def, &def_in)?;
        let built_slice: &[String] = &built;
        let towers = tower_setup_for(
            &layout,
            &TowerSetupInput {
                built_building_ids: built_slice,
                defender_era: sc.defender_era,
                def_civ: sc.def_civ.as_deref(),
                units: &data.tower_units,
                params: data.towers,
            },
        );
        let scene = scene_inputs(&layout, towers)?;
        let rolls = SessionRolls::derive(sc.seed, sc.battle_index);
        let move_terrain = FieldMoveTerrain::from_engine_data(field.map.clone())
            .map_err(SessionError::InvalidData)?;
        let mut body = ProdBody::new(
            [atk_pu, def_pu],
            scene.activate_scene(false, f64::NAN),
            rolls,
        )
        .with_terrain(Box::new(move_terrain));
        install_body_inputs(&mut body, &scene, [&atk_in, &def_in])?;
        for (s, list) in [&atk, &def].iter().enumerate() {
            for (i, (p, bu, _)) in list.iter().enumerate() {
                body.formation_rank[s][i] = p.formation_rank.map(|r| r as f64);
                body.army_leader_bonus_frac[s][i] = bu.army_leader_morale_bonus_frac;
                let mut plain = bu.clone();
                plain.army_leader_morale_bonus_frac = 0.0;
                body.morale_base_plain[s][i] = Some(plain.morale_base_for());
            }
        }
        // Kompozytor ciosu (`_singleBlow` w chwili ciosu, D-WIRA-2).
        let tmpl = |units: &[AdapterBattleUnit]| {
            units
                .iter()
                .map(|bu| unit_blow_template(bu, &data.combat_opts))
                .collect::<Vec<_>>()
        };
        let atk_t = tmpl(&atk_units);
        let def_t = tmpl(&def_units);
        let counters = [
            counter_matrix(&atk_t, &def_t, &data.counters, data.counter_mult),
            counter_matrix(&def_t, &atk_t, &data.counters, data.counter_mult),
        ];
        // K5LOOP-WIRING-A r2 (Z2): strzelec wieży jak `_fireOneTower` (`:4236-4244`) z wierszem `towerShooterRow`
        // (`strongestRangedUnitForEra(units, _defenderEra, _siegeDefCiv)`, `:4167`), bonusami i trudnością strony
        // obrońcy sceny (`defenderCivBonusy` / `defenderDifficultyCombatMult` z `defRosterRef[0].ownerId`,
        // `main.ts:36995`, `:37011`). Brak kontekstu właściciela = `None` = jawny tag `wieza-bez-kompozytora`.
        let tower = strongest_ranged_unit_for_era(
            &data.tower_units,
            clamp_era(sc.defender_era),
            sc.def_civ.as_deref(),
        )
        .zip(sc.defender_side.as_ref())
        .map(|(row, owner)| {
            let cu = tower_shooter_cu(row);
            let counters = atk_t
                .iter()
                .map(|t| {
                    counter_multiplier_pin(
                        &cu.counter_typ,
                        &t.cu.counter_typ,
                        &data.counters,
                        data.counter_mult,
                    )
                })
                .collect();
            TowerShooterCompose {
                attacker: attacker_from_cu(&cu),
                cu,
                civ_bonusy: owner.0.clone(),
                diff_mult: owner.1,
                counters,
            }
        });
        let compose_units =
            |units: &[AdapterBattleUnit], t: Vec<UnitBlowTemplate>, side_def: bool| {
                units
                    .iter()
                    .zip(t)
                    .map(|(bu, tmpl)| ComposeUnit {
                        tmpl,
                        side_def,
                        diff_mult: bu.difficulty_combat_mult,
                        civ_bonusy: bu.civ_bonusy.clone(),
                        building: BuildingCombatBonus {
                            pancerz: bu.pancerz_bonus_frac,
                            other: bu.parametry_bonus_frac,
                        },
                        fortified_in_field: bu.fortified_in_field,
                        max_hp: bu.max_hp,
                    })
                    .collect::<Vec<_>>()
            };
        let wall_totals = wall_defense_totals(Some(built_slice), &data.wall_params);
        let tiles = TileMap::new(
            field.map.cols(),
            field.map.rows(),
            field.map.tiles().to_vec(),
            field.map.is_mountain(),
        )
        .map_err(SessionError::InvalidData)?;
        body.tower_outcome_effects = true;
        // Obrona r2 (E2-1b, D-WIRA-17): czas ciosu i strzału jak w pinie (skutek w chwili trafienia, `done()` po ogonie).
        body.pin_blow_timing = true;
        // Obrona r2 (E2-1a, D-WIRA-16): `_applyTerrainRange` w ciele (`:6064`, `:7740`, `:7929`) z siatką
        // `terrainRangeDelta(combatTerrainName(c, r))` (`:7495-7496`).
        let mut range_grid = HashMap::new();
        for c in 0..i64::from(field.map.cols()) {
            for r in 0..i64::from(field.map.rows()) {
                let name = field.map.combat_terrain_name_f(c as f64, r as f64);
                range_grid.insert((c, r), terrain_range_delta(name, &data.terrain_range_rows));
            }
        }
        body.terrain_range_delta = Some(range_grid);
        body.blow_composer = Some(Box::new(SessionBlowComposer {
            units: [
                compose_units(&atk_units, atk_t, false),
                compose_units(&def_units, def_t, true),
            ],
            counters,
            tower,
            ctx: BlowSceneCtx {
                map: tiles,
                terrain_data: data.terrain_rows.clone(),
                is_city_defense_battle: true,
                wall_defense_total_proc: wall_totals.total_proc,
                siege_wall_col: layout.wall_col as f64,
                city_terrain: sc.teren.clone(),
                river_attack_mult: data.river_attack_mult,
                brod_kara_obrona: data.brod_kara_obrona,
                brod_bonus_brzegu: data.brod_bonus_brzegu,
                fortify_obrona_proc: data.fortify_obrona_proc,
            },
        }));
        let seq = |ins: &[BodyUnitInputs], units: &[AdapterBattleUnit], base: u64| {
            ins.iter()
                .zip(units)
                .enumerate()
                .map(|(i, (u, bu))| SeqUnit {
                    id: base + i as u64,
                    c: CombatUnit {
                        hp: bu.hp,
                        morale: u.morale,
                        flee_morale: u.flee_morale,
                        move_left: u.move_left,
                        never_rout: u.never_rout,
                        dead: false,
                        fading_out: false,
                        routed: false,
                        removed: false,
                        acted: false,
                    },
                })
                .collect::<Vec<_>>()
        };
        let st = TurnSeqState {
            atk: seq(&atk_in, &atk_units, 0),
            def: seq(&def_in, &def_units, DEF_ID_BASE),
            turn_order: Vec::new(),
            turn_idx: 0,
            round_no: 0,
            siege_wall_col: layout.wall_col,
            manual_mode: false,
            player_side: BattleSide::Attacker,
            finished: false,
            awaiting_orders: false,
            auto_battle_suspended: false,
            busy: false,
            auto_batch_planning: false,
            queued_order_ids: BTreeSet::new(),
        };
        let senv = SiegeEnv {
            tower_rows: scene.towers.rows.clone(),
            pending_tower_shots: Vec::new(),
            tower_range: scene.towers.tower_range,
            tower_shot: scene.towers.tower_shot.clone(),
            wall_tile_rows: scene.wall_tile_rows(),
            wall_ever_breached: false,
            no_breach_cap: data.no_breach_cap,
            move_points: [
                atk_in.iter().map(|u| u.move_points).collect(),
                def_in.iter().map(|u| u.move_points).collect(),
            ],
            morale_max: [
                atk_in.iter().map(|u| u.morale_max).collect(),
                def_in.iter().map(|u| u.morale_max).collect(),
            ],
            body,
        };
        Ok(Self {
            lp: SiegeLoop::new(st, senv),
            clock: VirtualClock::new(),
            phase: SessionPhase::Prepared,
            wall_acc: 0.0,
            wall_now: 0.0,
            roster_ids: [
                atk.iter().map(|x| x.2.clone()).collect(),
                def.iter().map(|x| x.2.clone()).collect(),
            ],
            max_hp: [
                atk_units.iter().map(|b| b.max_hp).collect(),
                def_units.iter().map(|b| b.max_hp).collect(),
            ],
            ready_machines: sc.ready_machines.clone(),
            field,
        })
    }

    /// `play()` → `_startBattle()` → `_kickoffBattleTurn()` (AUTO): `_beginTurn()` tury 0 (`:3615-3631`).
    pub fn play(&mut self) {
        if self.phase != SessionPhase::Prepared {
            return;
        }
        self.lp.start(&mut self.clock);
        self.phase = if self.lp.st.finished {
            SessionPhase::Finished
        } else {
            SessionPhase::Running
        };
    }

    /// Faza sesji.
    #[must_use]
    pub fn phase(&self) -> SessionPhase {
        self.phase
    }

    /// Czas rzeczywisty (D-WIR-3, D-WIRA-3): `wall_delta_ms` czasu ściennego klienta dzielone na klatki
    /// [`BATTLE_FRAME_WALL_MS`] (16 ms, pin `:2552`; ta sama kwantyzacja co `FF_STEP_MS` przewijania, `:9416-9419`);
    /// reszta poniżej klatki przechodzi do kolejnego wywołania, więc wynik zależy tylko od sumy czasu, nie od podziału.
    /// Każda klatka = `_advanceVClock(t)` + `_drainTimers()` (`:9274-9277`); pierwsza klatka tylko ustawia `vLastWall`.
    ///
    /// # Errors
    /// [`SessionError::AlreadyFinished`], [`SessionError::LoopUnsupported`].
    pub fn step(&mut self, wall_delta_ms: f64) -> Result<StepReport, SessionError> {
        if self.phase == SessionPhase::Finished {
            return Err(SessionError::AlreadyFinished);
        }
        // K5LOOP-WIRING-A r2 (Z4c Evaluatora): walidacja PRZED zmianą stanu (start bitwy w `Prepared`).
        if !(wall_delta_ms.is_finite() && wall_delta_ms >= 0.0) {
            return Err(SessionError::InvalidData(format!(
                "wall_delta_ms {wall_delta_ms}"
            )));
        }
        match self.phase {
            SessionPhase::Prepared => self.play(),
            SessionPhase::Skipping => return self.skip(),
            SessionPhase::Running | SessionPhase::Finished => {}
        }
        self.wall_acc += wall_delta_ms;
        let mut frames = 0;
        let mut fired = 0;
        while self.wall_acc >= BATTLE_FRAME_WALL_MS && !self.lp.st.finished {
            self.wall_acc -= BATTLE_FRAME_WALL_MS;
            self.wall_now += BATTLE_FRAME_WALL_MS;
            fired += self.lp.step_realtime(&mut self.clock, self.wall_now);
            frames += 1;
        }
        self.after_drive()?;
        Ok(StepReport {
            frames,
            fired,
            actions: self.lp.take_actions(),
            finished: self.phase == SessionPhase::Finished,
        })
    }

    /// `skip()` (`:3680-3707`): po starcie przewijanie do końca bitwy (`_ffActive = true`, `run_fast_forward`); przed
    /// startem jawny błąd (R7).
    ///
    /// # Errors
    /// [`SessionError::SkipBeforeStartNotPorted`], [`SessionError::AlreadyFinished`], [`SessionError::LoopUnsupported`].
    pub fn skip(&mut self) -> Result<StepReport, SessionError> {
        match self.phase {
            SessionPhase::Prepared => return Err(SessionError::SkipBeforeStartNotPorted),
            SessionPhase::Finished => return Err(SessionError::AlreadyFinished),
            SessionPhase::Running | SessionPhase::Skipping => {}
        }
        self.phase = SessionPhase::Skipping;
        let stop = self.lp.resume(&mut self.clock, SKIP_STEP_BUDGET);
        self.after_drive()?;
        if stop == FfStop::StepLimit && self.phase != SessionPhase::Finished {
            return Err(SessionError::LoopUnsupported(
                "przewijanie bez konca w budzecie krokow",
            ));
        }
        Ok(StepReport {
            frames: 0,
            fired: 0,
            actions: self.lp.take_actions(),
            finished: self.phase == SessionPhase::Finished,
        })
    }

    fn after_drive(&mut self) -> Result<(), SessionError> {
        if let Some(r) = self.lp.unsupported {
            self.phase = SessionPhase::Finished;
            return Err(SessionError::LoopUnsupported(r));
        }
        if self.lp.st.finished {
            self.phase = SessionPhase::Finished;
        }
        Ok(())
    }

    /// Wynik bitwy jako DANE (część B stosuje go do stanu).
    ///
    /// # Errors
    /// [`SessionError::NotFinished`], [`SessionError::LoopUnsupported`].
    pub fn finish(&self) -> Result<SessionOutcome, SessionError> {
        if let Some(r) = self.lp.unsupported {
            return Err(SessionError::LoopUnsupported(r));
        }
        let Some(winner) = self.lp.winner else {
            return Err(SessionError::NotFinished);
        };
        let mut units = Vec::new();
        for (s, list) in [&self.lp.st.atk, &self.lp.st.def].iter().enumerate() {
            for (i, u) in list.iter().enumerate() {
                units.push(OutcomeUnit {
                    roster_id: self.roster_ids[s][i].clone(),
                    side: if s == 0 { Side::Atk } else { Side::Def },
                    hp: u.c.hp,
                    max_hp: self.max_hp[s][i],
                    dead: u.c.dead,
                    routed: u.c.routed,
                    removed: u.c.removed,
                });
            }
        }
        let body = &self.lp.env.body;
        Ok(SessionOutcome {
            winner,
            round_no: self.lp.st.round_no,
            units,
            consumed_machines: self.ready_machines.clone(),
            wall_ever_breached: self.lp.env.wall_ever_breached,
            unported: body
                .unported
                .iter()
                .map(|(u, t)| (self.unit_label(*u), *t))
                .collect(),
            rolls_drawn: body.rolls.drawn,
        })
    }

    fn unit_label(&self, u: UnitRef) -> String {
        let s = side_ix(u.side);
        self.roster_ids[s]
            .get(u.idx)
            .cloned()
            .unwrap_or_else(|| format!("{s}:{}", u.idx))
    }

    /// Pętla (tylko odczyt: ramki, akcje, ślad).
    #[must_use]
    pub fn battle_loop(&self) -> &SiegeLoop<ProdBody<SessionRolls>> {
        &self.lp
    }

    /// Zegar wirtualny (tylko odczyt).
    #[must_use]
    pub fn clock(&self) -> &VirtualClock<LoopTimer> {
        &self.clock
    }

    /// PIN3-DIVERGENCE-Q1 (WYŁĄCZNIE diagnostyka/testy, bliźniak `WIRING_A_FF_STEP` generatora): mnożnik `speedMul`
    /// zegara (pin `:2555`, `_scaledWallDelta` `:9512-9515`), od którego zależy krok przewijania
    /// `FF_STEP_MS = _scaledWallDelta(16)` (`:9419`). Pin dopuszcza tylko `SPEED_STEPS` (`:2551`, >= 1); wartość
    /// ułamkowa (np. `1/16` = krok 1 ms) służy do porównania z pinem w granicy klatki, NIE jest modelem produkcyjnym.
    ///
    /// # Errors
    /// [`SessionError::InvalidData`] dla wartości nieskończonej albo <= 0.
    #[doc(hidden)]
    pub fn diag_set_speed_mul(&mut self, speed_mul: f64) -> Result<(), SessionError> {
        if !(speed_mul.is_finite() && speed_mul > 0.0) {
            return Err(SessionError::InvalidData(format!(
                "speed_mul {speed_mul}"
            )));
        }
        self.clock.speed_mul = speed_mul;
        Ok(())
    }

    /// Pole bitwy (tylko odczyt: producent `BattleSetupDto`, #371).
    #[must_use]
    pub fn field(&self) -> &BattleField {
        &self.field
    }

    /// Wejście ciosu, jakie kompozytor sesji złożyłby dla `site` (diagnostyka i testy; `None` = ciało bez kompozytora).
    #[must_use]
    pub fn compose_blow(&self, site: &BlowSite) -> Option<FullBlowInput> {
        self.lp
            .env
            .body
            .blow_composer
            .as_ref()
            .map(|c| c.compose(site))
    }

    /// K5LOOP-WIRING-A r2 (Z2): wejście trafienia wieży, jakie kompozytor sesji złożyłby dla `site` (diagnostyka i testy).
    #[must_use]
    pub fn compose_tower_blow(&self, site: &TowerBlowSite) -> Option<FullBlowInput> {
        self.lp
            .env
            .body
            .blow_composer
            .as_ref()
            .and_then(|c| c.compose_tower(site))
    }

    /// K5LOOP-WIRING-A r2 (Z3): mnożnik terenu `_checkRout` kompozytora dla jednostki na kaflu (diagnostyka i testy).
    #[must_use]
    pub fn terrain_defence_mult_at(&self, unit: UnitRef, cell: (i64, i64)) -> Option<f64> {
        self.lp
            .env
            .body
            .blow_composer
            .as_ref()
            .and_then(|c| c.terrain_defence_mult(unit, cell))
    }

    /// K5LOOP-WIRING-A r2 (Z3): pętla do zmiany stanu w testach gałęzi ciała (np. trafienie wieży w zadany cel).
    pub fn battle_loop_mut(&mut self) -> &mut SiegeLoop<ProdBody<SessionRolls>> {
        &mut self.lp
    }

    /// Identyfikatory rosteru w kolejności `this.atk` / `this.def`.
    #[must_use]
    pub fn roster_ids(&self) -> &[Vec<String>; 2] {
        &self.roster_ids
    }
}

/// Czy w akcjach jest choć jedna etykieta obrażeń (`BattleAction::Damage`).
#[must_use]
pub fn has_damage(actions: &[TimedAction]) -> bool {
    actions
        .iter()
        .any(|a| matches!(a.action, BattleAction::Damage { .. }))
}
