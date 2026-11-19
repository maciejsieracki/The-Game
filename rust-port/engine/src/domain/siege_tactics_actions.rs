//! Akcje przejściowe bitwy taktycznej i teksty logu (temat `R-RUSTPORT-P4-1I3-BATTLE-ACTIONS`, P4-1I3 / #247 /
//! PRIO-3D-8 #276; recon `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §2c i luka L5).
//!
//! Web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`) nie ma strumienia zdarzeń: logika woła metody sceny
//! (`_doMeleeAttack`, `_spawnDamageLabel`, `_startRout`, `_startFade`, `_fireOneTower`, `_pushClash`,
//! `this.log.push`). Silnik zapisuje te wywołania jako [`BattleAction`] z czasem wirtualnym `t0`
//! ([`TimedAction`]), w kolejności wywołań sceny w pinie. Producenci:
//! - [`crate::domain::siege_tactics_loop::ProdBody`]: cios (`_doMeleeAttack` → `_singleBlow` →
//!   `_resolveBlowOutcome`), kontratak (`:9134-9143`), rout (`_startRout`), śmierć (`_startFade`), zwrot
//!   (`_updateFacing`), trafienie wieży (`_singleBlow` w `_fireOneTower`, `:4262-4266`);
//! - [`crate::domain::siege_tactics_loop::SiegeLoop`]: tura (`hint 'Tura N'`), wystrzał wieży (`_fireOneTower`,
//!   `:4247-4261`), koniec (`_checkEnd` `:10153-10239`, `_finishDraw` `:9467-9478`, `_ffRoundCapResult`
//!   `:9485-9497`).
//!
//! Ten moduł zawiera typy akcji, producentów tekstów logu i wpisu `_pushClash` 1:1 z pinu (luka L5) oraz konwersję
//! do [`BattleActionDto`]. Zakres: wyłącznie ścieżki już portowane; ruch, strzelec, taran, katapulta, wyłom i
//! wspinaczka należą do P4-1I5 (#249/#280).

use civ_view_model::battle::{
    validate_actions, BattleActionDto, BattleActionKindDto, BattleActorDto, BattleClashTagDto,
    BattleWinner,
};
use civ_view_model::ids::{IdOutOfRange, UnitId};
use civ_view_model::validate::ViewError;

use crate::domain::diplomacy_aggressor::js_number_to_string;
use crate::domain::siege_no_breach::{round_cap_verdict, RoundCapVerdict, FF_MAX_ROUNDS};
use crate::domain::siege_tactics_blow::{js_round, ClashTag, HitArc};
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_endcheck::ARMY_MORALE_LOSS_THRESHOLD;
use crate::domain::siege_tactics_loop::LoopWinner;
use crate::domain::siege_tactics_turnseq::{TurnSeqState, UnitRef};

/// Web `BLOW_HIT_T = 150` (`battleScene.ts:1021`): chwila w lunge, w której cios trafia.
pub const BLOW_HIT_T: f64 = 150.0;

/// Web `CLASH_LOG_MAX = 10` (`battleScene.ts:1089`): pojemność panelu „Ostatnie starcia”.
pub const CLASH_LOG_MAX: usize = 10;

/// Kto zadał cios: jednostka albo wieża muru (syntetyczny strzelec `'wieza:' + row`, `:4238-4245`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Actor {
    Unit(UnitRef),
    Tower(i64),
}

/// Akcja sceny (wariant §2c recon). Jednostki jako [`UnitRef`]; konwersja na id: [`actions_to_dto`].
#[derive(Debug, Clone, PartialEq)]
pub enum BattleAction {
    /// `hint.textContent = 'Tura ' + roundNo` (`_beginTurn`).
    Turn { round_no: i64 },
    /// `ru.group.rotation.y = dirYaw(ru.facing)` (`:8340`, `:9105`, `:9138`, `:9818`).
    Facing { unit: UnitRef, dir: f64 },
    /// Lunge `_doMeleeAttack` (`:9096-9175`); cios w `hit_at`.
    Melee {
        attacker: UnitRef,
        target: UnitRef,
        hit_at: f64,
    },
    /// Pocisk wieży `_fireOneTower` (`:4250-4261`); trafienie w `land_at`.
    TowerShot {
        row: i64,
        target: UnitRef,
        land_at: f64,
    },
    /// `_spawnDamageLabel(ru, dmg)` (`:9940-9971`).
    Damage { target: UnitRef, dmg: f64 },
    /// `_pushClash(attacker, defender, dmg, tag)` (`:9550-9566`); `text` = wpis panelu.
    Clash {
        attacker: Actor,
        target: UnitRef,
        dmg: f64,
        tag: ClashTag,
        text: String,
    },
    /// `_startRout` (`_sfxRout`, `:9801`).
    Rout { unit: UnitRef },
    /// `_startFade` (`_sfxDeath` + `_removeUnitFromScene`, `:9933-9937`).
    Kill { unit: UnitRef },
    /// `this.log.push(text)`.
    Log { text: String },
    /// `_showEndScreen(winner)`.
    End { winner: LoopWinner },
    /// K5LOOP-CLOSE r2 (D-K5C-r2-2): krok `_doMove` (`battleScene.ts:8714-8775`, bez planowania AUTO-batch): jednostka
    /// przechodzi z pola `from` na `to`; animacja startuje w `t0` (`const t0 = this._now()`, `:8746`, po `_updateFacing`)
    /// i kończy się, gdy `p >= 1`, czyli w `arrive_at = t0 + MOVE_STEP_MS` (`:1010`, nominalnie; kwantyzacja klatek rAF
    /// to wejście sterownika). Pozycja logiczna (`ru.q/ru.r`, `occByKey`) zmienia się w `t0`. Pola jak w wariantach
    /// `Melee`/`TowerShot` (jednostka + chwila końca), żeby I5 mógł dodać wariant DTO 1:1; [`BattleActionKindDto`] go
    /// jeszcze nie ma, więc [`actions_to_dto`] zwraca [`ActionError::MoveWithoutDto`] (jawnie, bez cichego pominięcia).
    Move {
        unit: UnitRef,
        from: (i64, i64),
        to: (i64, i64),
        arrive_at: f64,
    },
    /// K5LOOP-CLOSE r3: strzał jednostki `_doRangedAttack` (`battleScene.ts:9179-9235`): zwrot strzelca ku celowi
    /// (osobna akcja `Facing`), pocisk z pola strzelca na pole celu wystrzelony w `t0` i trafiający w
    /// `land_at = t0 + RANGED_FLY_MS` (`:1012`, `_schedule(RANGED_FLY_MS, ...)` `:9223`); trafienie (`_singleBlow`
    /// ranged) i etykieta obrażeń w `land_at`. Pola jak w `TowerShot` (cel + chwila trafienia), żeby I5 mógł dodać
    /// wariant DTO 1:1; [`BattleActionKindDto`] go jeszcze nie ma, więc [`actions_to_dto`] zwraca
    /// [`ActionError::ShotWithoutDto`] (jawnie, bez cichego pominięcia).
    Shot {
        attacker: UnitRef,
        target: UnitRef,
        land_at: f64,
    },
    /// K5LOOP-CLOSE r4: uciekająca jednostka opuszcza pole (`_fleeStep` -> `_removeUnitFromScene`,
    /// `battleScene.ts:9853-9857`, `:9876-9878`, `:9887-9892`; ciało `:9910-9925`): odpięcie modelu i paska ze sceny,
    /// `removed`/`dead`, zwolnienie pola `occByKey`. Bez dźwięku i bez etykiety (inaczej niż `Kill` = `_startFade`).
    /// [`BattleActionKindDto`] nie ma jeszcze wariantu (I5 #280/#336): [`actions_to_dto`] zwraca
    /// [`ActionError::LeaveWithoutDto`] (jawnie, bez cichego pominięcia).
    Leave { unit: UnitRef },
    /// K5LOOP-CLOSE r4: ripple `_shakeAlliesOnLoss(fallen)` (`battleScene.ts:9743-9753`): sojusznik `unit` w promieniu
    /// `MORALE_DEATH_RADIUS` traci `MORALE_ALLY_DEATH_LOSS`; `morale` = wartość po stracie (`_updateMoraleBar(a)`,
    /// `:9749`), przed `_checkRout(a)`. [`BattleActionKindDto`] nie ma jeszcze wariantu (I5 #280/#336):
    /// [`actions_to_dto`] zwraca [`ActionError::ShakenWithoutDto`].
    Shaken {
        unit: UnitRef,
        fallen: UnitRef,
        morale: f64,
    },
    /// K5LOOP-SIEGE-ATK-A (T2a): wejście atakującego na koronę muru od wieży oblężniczej `_trySiegeTowerClimb`
    /// (`battleScene.ts:8067-8082`): `occByKey` zwalnia `from`, `ru.q = wallCol`, `onWallWalkway = true`, zajęcie `to`,
    /// model ustawiony od razu na wysokości korony (`group.position.set(x, 2.5, z)`, `:8077-8079`, bez animacji
    /// `_raf`), `moveLeft = 0`, `done()` synchronicznie. Ewentualny wpis dziennika wyłomu (`this.log.push`, `:8074`)
    /// jest osobną akcją [`BattleAction::Log`] PRZED tą (kolejność wywołań w pinie). [`BattleActionKindDto`] nie ma
    /// jeszcze wariantu (I5b #370): [`actions_to_dto`] zwraca [`ActionError::ClimbWallWithoutDto`].
    ClimbWall {
        unit: UnitRef,
        from: (i64, i64),
        to: (i64, i64),
    },
    /// K5LOOP-SIEGE-ATK-B (T2b): kamień katapulty `_attackWallTile` (`battleScene.ts:7547-7552`,
    /// `_spawnCatapultBoulder`): lot z pola katapulty w kafel muru `(wallCol, row)` wystrzelony w `t0`, trafienie po
    /// `_schedule(700)` w `land_at` (`:7555`). Obrażenia kafla to osobna akcja [`BattleAction::WallDamage`] w `land_at`.
    /// [`BattleActionKindDto`] nie ma jeszcze wariantu (I5b #370): [`ActionError::BoulderWithoutDto`].
    Boulder {
        unit: UnitRef,
        row: i64,
        land_at: f64,
    },
    /// K5LOOP-SIEGE-ATK-B (T2b): trafienie kamienia w kafel muru (callback `_schedule(700)`, `:7556-7564`):
    /// `wallTileHp.set(row, hp_after)`, etykieta `'-' + dmg + ' (mur)'` (`_spawnWallLabel`, `:7561`). I5b #370:
    /// [`ActionError::WallDamageWithoutDto`].
    WallDamage { row: i64, dmg: f64, hp_after: f64 },
    /// K5LOOP-SIEGE-ATK-B (T2b): animacja taranu `_animateRam` (`:7316-7323`, `:7337-7360`): uderzenie w bramę z pola
    /// taranu, start w `t0`, powrót w `until = t0 + 320` (`duration = 320`). I5b #370: [`ActionError::RamWithoutDto`].
    Ram { unit: UnitRef, until: f64 },
    /// K5LOOP-SIEGE-ATK-B (T2b): obrażenia bramy `_attackGate` (`:7326-7331`): `gateHp = max(0, gateHp - dmg)` (HUD
    /// `_updateSiegeHud`). I5b #370: [`ActionError::GateDamageWithoutDto`].
    GateDamage { dmg: f64, hp_after: f64 },
    /// K5LOOP-SIEGE-ATK-B (T2b): wyburzenie kafla muru `_breachWallTile(row)` (`:7638-7697`): kafel `Plains`, wyłom,
    /// etykieta `'MUR WYBURZONY!'`, ukrycie segmentu i gruz. Wcześniejsze skutki w tej samej chwili: wieża w wyłomie
    /// ([`BattleAction::TowerDestroyed`] + [`BattleAction::Log`]); późniejsze: odwrót obrońców z muru
    /// ([`BattleAction::LeaveField`], [`BattleAction::Kill`]) i morale. I5b #370: [`ActionError::WallBreachWithoutDto`].
    WallBreach { row: i64 },
    /// K5LOOP-SIEGE-ATK-B (T2b): otwarcie bramy `_breachGate()` (`:7757-7811`): `gateOpen`, wyłom, kafle bramy `Plains`,
    /// ukrycie bramy; potem morale obrońców. I5b #370: [`ActionError::GateBreachWithoutDto`].
    GateBreach,
    /// K5LOOP-SIEGE-ATK-B (T2b): `_destroyTowerAtRow(row)` (`:4194-4200`): wieża strzelnicza w wyłomie zburzona (mesh
    /// ukryty); wpis dziennika to następna akcja [`BattleAction::Log`]. I5b #370: [`ActionError::TowerDestroyedWithoutDto`].
    TowerDestroyed { row: i64 },
    /// K5LOOP-SIEGE-ATK-B (T2b): obrońca schodzi z wyburzonego kafla muru (`_breachWallTile`, `:7700-7741`): zwolnienie
    /// `from`, nowa pozycja `to` (model postawiony od razu na terenie, bez animacji), `onWallWalkway = false`. Gdy żadne
    /// pole nie jest wolne (`:7717`), jednostka zostaje (`to == from`), ale schodzi z korony. I5b #370:
    /// [`ActionError::LeaveFieldWithoutDto`].
    LeaveField {
        unit: UnitRef,
        from: (i64, i64),
        to: (i64, i64),
    },
}

/// Akcja z czasem wirtualnym wywołania sceny (`vNow`, ms).
#[derive(Debug, Clone, PartialEq)]
pub struct TimedAction {
    pub t0: f64,
    pub action: BattleAction,
}

// ------------------------------------------------------------------------------------------------------------------
// Liczby jak w JS.
// ------------------------------------------------------------------------------------------------------------------

/// `String(x)` dla liczby (konkatenacja `'…' + x` w pinie).
pub fn js_num(x: f64) -> String {
    js_number_to_string(x)
}

/// `x.toFixed(0)` (ECMAScript `Number.prototype.toFixed`, `fractionDigits = 0`): dla `|x| >= 1e21` = `String(x)`;
/// inaczej `n` = liczba całkowita najbliższa `|x|`, przy dwóch równie bliskich WIĘKSZA (połówki w górę, liczone na
/// dokładnej wartości double); znak `-`, gdy `x < 0` (także `(-0.4).toFixed(0) === "-0"`; `-0` daje `"0"`).
pub fn js_to_fixed0(x: f64) -> String {
    if !x.is_finite() {
        return js_number_to_string(x);
    }
    if x.abs() >= 1e21 {
        return js_number_to_string(x);
    }
    let neg = x < 0.0;
    let a = x.abs();
    let fl = a.floor();
    // `a - fl` jest dokładne dla `a < 2^52`; powyżej `a` jest całkowite.
    let n = if a - fl >= 0.5 { fl + 1.0 } else { fl };
    let digits = format!("{n:.0}");
    if neg {
        format!("-{digits}")
    } else {
        digits
    }
}

// ------------------------------------------------------------------------------------------------------------------
// Teksty logu (`this.log.push`) i wpis `_pushClash` 1:1 z pinu (luka L5).
// ------------------------------------------------------------------------------------------------------------------

/// `sideTag(side)` (`:1091-1093`).
pub fn side_tag(side: BattleSide) -> &'static str {
    match side {
        BattleSide::Attacker => "atak",
        BattleSide::Defender => "obr",
    }
}

/// `arcTag` (`:8993-8996`): flanka/tył z karą obrony `Math.round(defPenaltyFrac * 100)`, front = `''`.
pub fn arc_tag(arc: HitArc, def_penalty_frac: f64) -> String {
    let pct = || js_num(js_round(def_penalty_frac * 100.0));
    match arc {
        HitArc::Flank => format!(" [FLANKA -{}% obrony]", pct()),
        HitArc::Rear => format!(" [TYL -{}% obrony]", pct()),
        HitArc::Front => String::new(),
    }
}

/// Pudło (`:8962`): `A + ' chybia w ' + D + ' (' + roll.toFixed(0) + '>=' + hitPct + '%).'`.
pub fn miss_log(attacker: &str, defender: &str, roll: f64, hit_pct: f64) -> String {
    format!(
        "{attacker} chybia w {defender} ({}>={}%).",
        js_to_fixed0(roll),
        js_num(hit_pct)
    )
}

/// Trafienie (`:8997-9000`): `A + ' trafia ' + D + arcTag + ' za ' + dmg + ' (HP ' + hp + '/' + maxHp + ').'`.
pub fn hit_log(
    attacker: &str,
    defender: &str,
    arc: &str,
    dmg: f64,
    hp: f64,
    max_hp: f64,
) -> String {
    format!(
        "{attacker} trafia {defender}{arc} za {} (HP {}/{}).",
        js_num(dmg),
        js_num(hp),
        js_num(max_hp)
    )
}

/// Zabicie (`:9046`): `'  -> ' + nazwa + ' wyeliminowany'`.
pub fn eliminated_log(name: &str) -> String {
    format!("  -> {name} wyeliminowany")
}

/// Rout (`:9819`): `'  -> ' + nazwa + ' ZALAMUJE MORALE i ucieka z pola!'`.
pub fn rout_log(name: &str) -> String {
    format!("  -> {name} ZALAMUJE MORALE i ucieka z pola!")
}

/// Wystrzał wieży (`:4247`): `'Wieza strzelnicza (rzad ' + t.row + ') strzela do ' + target.bu.nazwa + '.'`.
pub fn tower_shot_log(row: i64, target: &str) -> String {
    format!("Wieza strzelnicza (rzad {row}) strzela do {target}.")
}

/// Nazwa syntetycznego strzelca wieży (`:4241`): `'Wieza (' + nazwa + ')'`, `nazwa` =
/// `String(shooterRow['Jednostka'] ?? 'Strzelec')` (`:4211`).
pub fn tower_shooter_name(nazwa: &str) -> String {
    format!("Wieza ({nazwa})")
}

/// Wpis `_pushClash` (`:9556-9560`): `A + ' (' + sideTag(a) + ') -> ' + D + ' (' + sideTag(d) + '): -' + dmg + ' HP'`
/// + `' (padl)'` / `' (rout)'`.
pub fn clash_line(
    attacker: &str,
    attacker_side: BattleSide,
    defender: &str,
    defender_side: BattleSide,
    dmg: f64,
    tag: ClashTag,
) -> String {
    let mut line = format!(
        "{attacker} ({}) -> {defender} ({}): -{} HP",
        side_tag(attacker_side),
        side_tag(defender_side),
        js_num(dmg)
    );
    match tag {
        ClashTag::Padl => line.push_str(" (padl)"),
        ClashTag::Rout => line.push_str(" (rout)"),
        ClashTag::Plain => {}
    }
    line
}

/// Bufor panelu `clashLogEntries` (`:9561-9564`): najnowszy wpis na początku, najwyżej [`CLASH_LOG_MAX`].
pub fn push_clash_entry(entries: &mut Vec<String>, line: String) {
    entries.insert(0, line);
    entries.truncate(CLASH_LOG_MAX);
}

// ------------------------------------------------------------------------------------------------------------------
// Logi końca bitwy.
// ------------------------------------------------------------------------------------------------------------------

/// Powód werdyktu sufitu tur (`_roundCapVerdict`, `:9449-9464`) i sufit (`cap`).
pub fn round_cap_reason(verdict: RoundCapVerdict, no_breach_cap: i64) -> (&'static str, i64) {
    match verdict {
        RoundCapVerdict::Draw => (
            "SZTURM ODPARTY (remis): brak wylomu w murze/palisadzie, atakujacy sie wycofuja, miasto zostaje przy obroncy",
            no_breach_cap.min(FF_MAX_ROUNDS),
        ),
        RoundCapVerdict::Attacker | RoundCapVerdict::Defender => {
            ("rozstrzygniecie po morale armii", FF_MAX_ROUNDS)
        }
    }
}

/// `_finishDraw(reason, cap)` (`:9471-9472`): dwie linie.
pub fn finish_draw_logs(reason: &str, cap: i64) -> Vec<String> {
    vec![
        format!("=== PAT: {cap} tur bez rozstrzygniecia -- {reason} ==="),
        "=== Koniec bitwy: REMIS ===".to_string(),
    ]
}

/// Wejścia logów `_checkEnd` (te same wartości co [`crate::domain::siege_tactics_endcheck::EndCheckInput`]).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct EndLogInput {
    pub stalled: bool,
    pub alive_a: bool,
    pub alive_d: bool,
    pub is_siege: bool,
    pub wall_ever_breached: bool,
    pub total_dead: usize,
    pub ratio_a: f64,
    pub ratio_d: f64,
    pub ratio_a_at_cap: f64,
    pub ratio_d_at_cap: f64,
    pub round_no: i64,
    pub no_breach_cap: i64,
}

/// Linie `this.log.push` wywołania `_checkEnd` (`:10153-10239`) zakończonego zwycięzcą `winner` (wynik
/// [`crate::domain::siege_tactics_endcheck::end_check_order`]; `None` = bitwa trwa → brak linii). Kolejność kroków jak w
/// pinie: PAT bez postępu (`:10179`), szturm odparty (`:10185`), morale armii (`:10190`, `:10194`), sufit tur
/// (`:10200-10203`, remis → `_finishDraw` `:9471-9472`), linia końca (`:10229`). Rozbicie dowódców
/// (`commandersToWithdrawAfterArmyBreak`, `:10168-10169`) jest poza zakresem (efekty dowódcy nieportowane).
pub fn check_end_logs(input: &EndLogInput, winner: Option<LoopWinner>) -> Vec<String> {
    let Some(winner) = winner else {
        return Vec::new();
    };
    let mut logs = Vec::new();
    let mut alive_a = input.alive_a;
    let mut alive_d = input.alive_d;
    let broken_a = input.ratio_a < ARMY_MORALE_LOSS_THRESHOLD;
    let broken_d = input.ratio_d < ARMY_MORALE_LOSS_THRESHOLD;
    if input.stalled && alive_a && alive_d {
        if !input.is_siege && input.total_dead > 0 {
            logs.push(
                "=== PAT: brak postepu w walce -- rozstrzygniecie po morale armii ===".to_string(),
            );
            if input.ratio_a <= input.ratio_d {
                alive_a = false;
            } else {
                alive_d = false;
            }
        }
        if input.is_siege && !input.wall_ever_breached {
            logs.push(
                "=== SZTURM ODPARTY: brak wylomu w murze/palisadzie -- atakujacy nie moga dosiegnac obroncow ==="
                    .to_string(),
            );
            alive_a = false;
        }
    }
    if broken_a && alive_a {
        logs.push(format!(
            "=== Morale armii ATAKUJACEGO zalamane ({}% < 25%) -- armia w rozsypce! ===",
            js_num(js_round(input.ratio_a * 100.0))
        ));
        alive_a = false;
    }
    if broken_d && alive_d {
        logs.push(format!(
            "=== Morale armii OBRONCY zalamane ({}% < 25%) -- armia w rozsypce! ===",
            js_num(js_round(input.ratio_d * 100.0))
        ));
        alive_d = false;
    }
    if alive_a && alive_d {
        if let Some(v) = round_cap_verdict(
            input.round_no,
            input.is_siege,
            input.wall_ever_breached,
            input.no_breach_cap,
            input.ratio_a_at_cap,
            input.ratio_d_at_cap,
        ) {
            let (reason, cap) = round_cap_reason(v, input.no_breach_cap);
            if v == RoundCapVerdict::Draw {
                logs.extend(finish_draw_logs(reason, cap));
                return logs;
            }
            logs.push(format!(
                "=== PAT: {cap} tur bez rozstrzygniecia -- {reason} ==="
            ));
        }
    }
    let win_msg = match winner {
        LoopWinner::Attacker => "ATAKUJACEGO",
        LoopWinner::Defender => "OBRONCY",
        // `_checkEnd` kończy remisem tylko przez `_finishDraw` (wyżej); tu remis = brak linii końca.
        LoopWinner::Draw => return logs,
    };
    logs.push(format!("=== Koniec bitwy: zwyciestwo {win_msg} ==="));
    logs
}

/// Linie `_ffRoundCapResult` (`:9485-9497`) dla werdyktu sufitu przewijania: remis → `_finishDraw`, inaczej
/// `'=== PAT (przewijanie): ' + cap + ' tur bez rozstrzygniecia -- ' + reason + ' ==='` (bez linii końca).
pub fn ff_round_cap_logs(verdict: RoundCapVerdict, no_breach_cap: i64) -> Vec<String> {
    let (reason, cap) = round_cap_reason(verdict, no_breach_cap);
    if verdict == RoundCapVerdict::Draw {
        return finish_draw_logs(reason, cap);
    }
    vec![format!(
        "=== PAT (przewijanie): {cap} tur bez rozstrzygniecia -- {reason} ==="
    )]
}

// ------------------------------------------------------------------------------------------------------------------
// Konwersja na DTO.
// ------------------------------------------------------------------------------------------------------------------

/// Błąd konwersji akcji na DTO.
#[derive(Debug, Clone, PartialEq)]
pub enum ActionError {
    /// Jednostka spoza rosteru pętli.
    UnitOutOfRange(UnitRef),
    /// Id jednostki poza zakresem JSON.
    Id(IdOutOfRange),
    /// Wiersz wieży poza `i32`.
    Row(i64),
    /// `facing` nie jest liczbą całkowitą `0..=3`.
    Facing(f64),
    /// Lista nie spełnia [`validate_actions`].
    Invalid(ViewError),
    /// P4-1I3 (obrona r1, zarzut 6): to samo id w rosterze pętli dwa razy (obie strony razem). Akcje adresują
    /// jednostki samym [`UnitId`] (bez strony), więc id muszą być unikalne w bitwie, jak w ramce
    /// (`BattleFrameDto::validate`, `units (unique id)`).
    DuplicateId(u64),
    /// K5LOOP-CLOSE r2: [`BattleAction::Move`] nie ma jeszcze wariantu w [`BattleActionKindDto`] (view-model, temat I5
    /// #280/#336). Konwersja listy z krokiem ruchu jest jawnym błędem, nie cichym pominięciem animacji.
    MoveWithoutDto(UnitRef),
    /// K5LOOP-CLOSE r3: [`BattleAction::Shot`] nie ma jeszcze wariantu w [`BattleActionKindDto`] (I5 #280/#336).
    ShotWithoutDto(UnitRef),
    /// K5LOOP-CLOSE r4: [`BattleAction::Leave`] nie ma jeszcze wariantu w [`BattleActionKindDto`] (I5 #280/#336).
    LeaveWithoutDto(UnitRef),
    /// K5LOOP-CLOSE r4: [`BattleAction::Shaken`] nie ma jeszcze wariantu w [`BattleActionKindDto`] (I5 #280/#336).
    ShakenWithoutDto(UnitRef),
    /// K5LOOP-SIEGE-ATK-A (T2a): [`BattleAction::ClimbWall`] nie ma jeszcze wariantu w [`BattleActionKindDto`] (I5b
    /// #370).
    ClimbWallWithoutDto(UnitRef),
    /// K5LOOP-SIEGE-ATK-B (T2b): [`BattleAction::Boulder`] bez wariantu DTO (I5b #370).
    BoulderWithoutDto(UnitRef),
    /// K5LOOP-SIEGE-ATK-B (T2b): [`BattleAction::WallDamage`] bez wariantu DTO (I5b #370); wiersz kafla.
    WallDamageWithoutDto(i64),
    /// K5LOOP-SIEGE-ATK-B (T2b): [`BattleAction::Ram`] bez wariantu DTO (I5b #370).
    RamWithoutDto(UnitRef),
    /// K5LOOP-SIEGE-ATK-B (T2b): [`BattleAction::GateDamage`] bez wariantu DTO (I5b #370).
    GateDamageWithoutDto,
    /// K5LOOP-SIEGE-ATK-B (T2b): [`BattleAction::WallBreach`] bez wariantu DTO (I5b #370); wiersz kafla.
    WallBreachWithoutDto(i64),
    /// K5LOOP-SIEGE-ATK-B (T2b): [`BattleAction::GateBreach`] bez wariantu DTO (I5b #370).
    GateBreachWithoutDto,
    /// K5LOOP-SIEGE-ATK-B (T2b): [`BattleAction::TowerDestroyed`] bez wariantu DTO (I5b #370); wiersz wieży.
    TowerDestroyedWithoutDto(i64),
    /// K5LOOP-SIEGE-ATK-B (T2b): [`BattleAction::LeaveField`] bez wariantu DTO (I5b #370).
    LeaveFieldWithoutDto(UnitRef),
}

impl From<IdOutOfRange> for ActionError {
    fn from(e: IdOutOfRange) -> Self {
        ActionError::Id(e)
    }
}

fn unit_id(st: &TurnSeqState, u: UnitRef) -> Result<UnitId, ActionError> {
    let roster = match u.side {
        BattleSide::Attacker => &st.atk,
        BattleSide::Defender => &st.def,
    };
    let su = roster.get(u.idx).ok_or(ActionError::UnitOutOfRange(u))?;
    Ok(UnitId::try_new(su.id)?)
}

fn row_i32(row: i64) -> Result<i32, ActionError> {
    i32::try_from(row).map_err(|_| ActionError::Row(row))
}

fn clash_tag_dto(tag: ClashTag) -> BattleClashTagDto {
    match tag {
        ClashTag::Plain => BattleClashTagDto::Plain,
        ClashTag::Padl => BattleClashTagDto::Padl,
        ClashTag::Rout => BattleClashTagDto::Rout,
    }
}

/// `LoopWinner` → `BattleResult.winner`.
pub fn winner_dto(w: LoopWinner) -> BattleWinner {
    match w {
        LoopWinner::Attacker => BattleWinner::Atakujacy,
        LoopWinner::Defender => BattleWinner::Obronca,
        LoopWinner::Draw => BattleWinner::Remis,
    }
}

/// Akcje silnika → [`BattleActionDto`] (id jednostek z `st`), z walidacją [`validate_actions`].
///
/// # Errors
/// [`ActionError`]: jednostka spoza rosteru, id/wiersz poza zakresem, `facing` spoza `Dir`, lista łamiąca walidację.
pub fn actions_to_dto(
    actions: &[TimedAction],
    st: &TurnSeqState,
) -> Result<Vec<BattleActionDto>, ActionError> {
    // P4-1I3 (obrona r1, zarzut 6): walidacja `Melee` attacker != target i adresowanie akcji po [`UnitId`] zakładają
    // id unikalne w bitwie (oba rostery razem).
    let mut seen = std::collections::BTreeSet::new();
    for su in st.atk.iter().chain(st.def.iter()) {
        if !seen.insert(su.id) {
            return Err(ActionError::DuplicateId(su.id));
        }
    }
    let mut out = Vec::with_capacity(actions.len());
    for a in actions {
        let action = match &a.action {
            BattleAction::Turn { round_no } => BattleActionKindDto::Turn {
                round_no: *round_no,
            },
            BattleAction::Facing { unit, dir } => {
                if !(dir.fract() == 0.0 && (0.0..=3.0).contains(dir)) {
                    return Err(ActionError::Facing(*dir));
                }
                #[allow(clippy::cast_possible_truncation)]
                let dir = *dir as i32;
                BattleActionKindDto::Facing {
                    id: unit_id(st, *unit)?,
                    dir,
                }
            }
            BattleAction::Melee {
                attacker,
                target,
                hit_at,
            } => BattleActionKindDto::Melee {
                attacker: unit_id(st, *attacker)?,
                target: unit_id(st, *target)?,
                hit_at: *hit_at,
            },
            BattleAction::TowerShot {
                row,
                target,
                land_at,
            } => BattleActionKindDto::TowerShot {
                row: row_i32(*row)?,
                target: unit_id(st, *target)?,
                land_at: *land_at,
            },
            BattleAction::Damage { target, dmg } => BattleActionKindDto::Damage {
                target: unit_id(st, *target)?,
                dmg: *dmg,
            },
            BattleAction::Clash {
                attacker,
                target,
                dmg,
                tag,
                text,
            } => BattleActionKindDto::Clash {
                attacker: match attacker {
                    Actor::Unit(u) => BattleActorDto::Unit {
                        id: unit_id(st, *u)?,
                    },
                    Actor::Tower(row) => BattleActorDto::Tower {
                        row: row_i32(*row)?,
                    },
                },
                target: unit_id(st, *target)?,
                dmg: *dmg,
                tag: clash_tag_dto(*tag),
                text: text.clone(),
            },
            BattleAction::Rout { unit } => BattleActionKindDto::Rout {
                id: unit_id(st, *unit)?,
            },
            BattleAction::Kill { unit } => BattleActionKindDto::Kill {
                id: unit_id(st, *unit)?,
            },
            BattleAction::Log { text } => BattleActionKindDto::Log { text: text.clone() },
            BattleAction::End { winner } => BattleActionKindDto::End {
                winner: winner_dto(*winner),
            },
            BattleAction::Move { unit, .. } => return Err(ActionError::MoveWithoutDto(*unit)),
            BattleAction::Shot { attacker, .. } => {
                return Err(ActionError::ShotWithoutDto(*attacker))
            }
            BattleAction::Leave { unit } => return Err(ActionError::LeaveWithoutDto(*unit)),
            BattleAction::Shaken { unit, .. } => return Err(ActionError::ShakenWithoutDto(*unit)),
            BattleAction::ClimbWall { unit, .. } => {
                return Err(ActionError::ClimbWallWithoutDto(*unit))
            }
            BattleAction::Boulder { unit, .. } => {
                return Err(ActionError::BoulderWithoutDto(*unit))
            }
            BattleAction::WallDamage { row, .. } => {
                return Err(ActionError::WallDamageWithoutDto(*row))
            }
            BattleAction::Ram { unit, .. } => return Err(ActionError::RamWithoutDto(*unit)),
            BattleAction::GateDamage { .. } => return Err(ActionError::GateDamageWithoutDto),
            BattleAction::WallBreach { row } => {
                return Err(ActionError::WallBreachWithoutDto(*row))
            }
            BattleAction::GateBreach => return Err(ActionError::GateBreachWithoutDto),
            BattleAction::TowerDestroyed { row } => {
                return Err(ActionError::TowerDestroyedWithoutDto(*row))
            }
            BattleAction::LeaveField { unit, .. } => {
                return Err(ActionError::LeaveFieldWithoutDto(*unit))
            }
        };
        out.push(BattleActionDto { t0: a.t0, action });
    }
    validate_actions(&out).map_err(ActionError::Invalid)?;
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// `toFixed(0)`: połówki w górę na dokładnej wartości, `-0` → `"0"`, mały ujemny → `"-0"` (node).
    #[test]
    fn to_fixed0_jak_js() {
        assert_eq!(js_to_fixed0(0.0), "0");
        assert_eq!(js_to_fixed0(-0.0), "0");
        assert_eq!(js_to_fixed0(0.5), "1");
        assert_eq!(js_to_fixed0(2.5), "3");
        assert_eq!(js_to_fixed0(2.4999999999999996), "2");
        assert_eq!(js_to_fixed0(99.99999999), "100");
        assert_eq!(js_to_fixed0(-0.4), "-0");
        assert_eq!(js_to_fixed0(-2.5), "-3");
        assert_eq!(js_to_fixed0(1e21), "1e+21");
        assert_eq!(js_to_fixed0(f64::NAN), "NaN");
    }

    #[test]
    fn bufor_starc_najnowszy_na_poczatku_max_10() {
        let mut e = Vec::new();
        for i in 0..12 {
            push_clash_entry(&mut e, format!("w{i}"));
        }
        assert_eq!(e.len(), CLASH_LOG_MAX);
        assert_eq!(e[0], "w11");
        assert_eq!(e[9], "w2");
    }
}
