//! Inputs of the R4 integrator: the per-hex values read from the DTO
//! ([`HexObjectsInput`], [`MapObjectsInput::from_dto`]) and the values the
//! pin reads that the DTO does not carry ([`ExternalInputs`]).

use std::collections::HashSet;

use civ_view_model as vm;

use crate::models::improvements::Nakladka;
use crate::models::misc::HexKey;
use crate::pick::hex::HexCoord;
use crate::pick::terrain::Terrain;
use crate::view::{pick_hex, seed_i32, terrain, ViewAdapterError};

/// The DTO values of one hex that R4 reads (`MapViewDto.hexes[i]` +
/// `HexDynDto[i]`, contract §3.2).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HexObjectsInput {
    /// `hex.coords`.
    pub coord: HexCoord,
    /// `hex.terenBazowy` (`HexStaticDto.teren_bazowy`).
    pub terrain: Terrain,
    /// `hex.nakladka` (`HexDynDto.nakladka`).
    pub nakladka: Nakladka,
    /// `HexExt.ulepszenia` (`HexDynDto.ulepszenia`; `None` = absent). The
    /// pin keeps it equal to `placedImprovements.get(hexKey)`
    /// (`syncHexUlepszenieFields`, `main.ts:16275-16289`).
    pub ulepszenia: Option<Vec<String>>,
    /// `hex.ulepszenie` (`HexDynDto.ulepszenie`). Read only as the fallback
    /// of `improvementKeysForHex` when `ulepszenia` is absent or empty
    /// (`game/terrain-improvements.ts:365-370`, `:377-379`;
    /// [`super::build::improvement_keys_for_hex`]).
    pub ulepszenie: vm::Ulepszenie,
    /// `HexExt.improvementKey` (`HexDynDto.improvement_key`). Carried, read
    /// by no pin render path (`git grep improvementKey` in `gra/src/render`
    /// and `main.ts` gives only the writer `main.ts:16281`, `:16286`).
    pub improvement_key: Option<String>,
    /// `HexExt.zloze` (`HexDynDto.zloze`), as the producer sends it.
    pub zloze: Option<String>,
    /// `hex.wioska?.istnieje` and no city on the hex (`HexDynDto.village_present`,
    /// producer rule of `main.ts:3366-3368`).
    pub village_present: bool,
    /// `computeRoadMask(q, r, hexHasRoadAt)` (`HexDynDto.road_mask`, D-DTO-4 = A).
    pub road_mask: u8,
}

impl HexObjectsInput {
    /// `keyOf(q, r)` as a [`HexKey`].
    #[must_use]
    pub const fn key(&self) -> HexKey {
        (self.coord.q, self.coord.r)
    }
}

/// The whole map as R4 inputs, in `map.hexes` order (contract §1.4).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MapObjectsInput {
    /// `map.seed | 0` ([`seed_i32`]).
    pub seed: i32,
    /// One entry per hex, DTO order.
    pub hexes: Vec<HexObjectsInput>,
}

impl MapObjectsInput {
    /// Pairs `map.hexes[i]` with `hex_state[i]`.
    ///
    /// # Errors
    ///
    /// [`ViewAdapterError::LengthMismatch`] when `hex_state` is not parallel
    /// to `map.hexes`.
    pub fn from_dto(
        map: &vm::MapViewDto,
        hex_state: &[vm::HexDynDto],
    ) -> Result<Self, ViewAdapterError> {
        if hex_state.len() != map.hexes.len() {
            return Err(ViewAdapterError::LengthMismatch {
                field: "hexState",
                expected: map.hexes.len(),
                actual: hex_state.len(),
            });
        }
        let hexes = map
            .hexes
            .iter()
            .zip(hex_state)
            .map(|(s, d)| HexObjectsInput {
                coord: pick_hex(s.coord),
                terrain: terrain(s.teren_bazowy),
                nakladka: nakladka(d.nakladka),
                ulepszenia: d.ulepszenia.clone(),
                ulepszenie: d.ulepszenie,
                improvement_key: d.improvement_key.clone(),
                zloze: d.zloze.clone(),
                village_present: d.village_present,
                road_mask: d.road_mask,
            })
            .collect();
        Ok(Self {
            seed: seed_i32(map.seed),
            hexes,
        })
    }

    /// The entry of a hex key (`map.hexes[keyOf(q, r)]`).
    #[must_use]
    pub fn hex(&self, key: HexKey) -> Option<&HexObjectsInput> {
        self.hexes.iter().find(|h| h.key() == key)
    }
}

/// `Nakladka` of the DTO (`view-model/src/map.rs`) → the renderer enum
/// (`models/improvements/zasoby.rs`, same 8 web values). Exhaustive, no
/// wildcard.
#[must_use]
pub const fn nakladka(n: vm::Nakladka) -> Nakladka {
    match n {
        vm::Nakladka::Brak => Nakladka::Brak,
        vm::Nakladka::Las => Nakladka::Las,
        vm::Nakladka::ZlozeGliny => Nakladka::ZlozeGliny,
        vm::Nakladka::ZlozeRudy => Nakladka::ZlozeRudy,
        vm::Nakladka::ZlozeKonia => Nakladka::ZlozeKonia,
        vm::Nakladka::ZlozeOwiec => Nakladka::ZlozeOwiec,
        vm::Nakladka::ZlozeBydla => Nakladka::ZlozeBydla,
        vm::Nakladka::ZlozeLamy => Nakladka::ZlozeLamy,
    }
}

/// Values the pin reads on the R4 paths that the DTO does not carry
/// (gaps G1–G4 of [`super`]). They are game rules or UI state, so this
/// module takes them as they are and never derives them; until the
/// producer carries them the caller supplies them.
///
/// Deliberately has no `Default`: every field changes what is drawn, and
/// no constant value matches the pin in every game.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExternalInputs {
    /// `showResourceDepositOverlay` (UI toggle, `main.ts:15423`,
    /// `:15472`), read first by `syncResourceOverlayAtHex` (`:3206`) and
    /// `rebuildResourceOverlays` (`:3235`). Gap G4.
    pub show_resource_deposit_overlay: bool,
    /// `isLamaDepositVisibleForCiv(player.civType || _menuCivId)`
    /// (`main.ts:3105-3107`, `game/livestock-unlock.ts:39-41`). Gap G3.
    pub lama_deposit_visible: bool,
    /// Hexes whose `zloze` is set but `visibleZloze(hex, overlayDepositEra)`
    /// is `undefined` (`main.ts:3213`, `:3241`; `map/deposit-era.ts:18-28`:
    /// era below `zlozeMinEra`, or `wegiel`). Gap G1.
    pub zloze_hidden: HashSet<HexKey>,
    /// Hexes where `hexSuppressesResourceOverlay(hexKey)` is `true`
    /// (`main.ts:3113-3121`; `game/terrain-improvements.ts:405-455`: an
    /// improvement dedicated to the deposit stands on the hex). Gap G2.
    pub deposit_overlay_suppressed: HashSet<HexKey>,
    /// Hexes where `preservesHillRelief(layers)` is `true` for the merged
    /// layers of the hex (`game/relief-preserving-improvements.ts:44-46`),
    /// the game predicate inside `keepsReliefUnderImprovement`
    /// (`main.ts:16839-16849`). Gap G6.
    pub preserves_hill_relief: HashSet<HexKey>,
}
