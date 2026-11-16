//! Producent nakladek mapy (`OverlaysViewDto`, kontrakt P4-1 §3.7).
//!
//! R-RUSTPORT-P4-1F6: `buildHighlight` (4 galezie `refreshBuildHighlight`, `main.ts:16351-16395`
//! @ `07d2fbd72`) i `selection` (`setSelectionHex(u.q, u.r, u.ownerId)`, `main.ts:7119`).
//!
//! Decyzja techniczna (kontrakt §3.7: „silnik (legalnosc budowy + odjecie heksow z cofaniem w tej
//! turze)”): filtr cofania w turze `filterBuildHighlightHexes` (`render/buildHighlight.ts:22-28`)
//! jest liczony **w producencie**; renderer dostaje heksy juz przefiltrowane
//! (`BuildHighlightDto.hexes`). Funkcja rendererowa
//! (`renderer/src/models/misc/build_highlight.rs:60`) zostaje bez zmian (poza allowlista).

use std::collections::HashSet;

use civ_view_model as vm;
use civ_view_model::overlays::{BuildHighlightDto, BuildHighlightKind, SelectionDto};

use crate::domain::improvement_build::is_mine_improvement_key;
use crate::domain::playable::PlayableUnit;

/// Tryb podswietlenia budowy ze stanu UI (`foundCityMode`, `activeWonderId`, `buildModeOpen`,
/// `activeImprovementKey`, `buildApi`; `main.ts:16352`, `:16363`, `:16369`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BuildHighlightUi<'a> {
    /// `foundCityMode`.
    pub found_city_mode: bool,
    /// `!!activeWonderId`.
    pub wonder_active: bool,
    /// `buildModeOpen && !!buildApi`.
    pub build_mode_open: bool,
    /// `activeImprovementKey` (`None` = `null`/pusty).
    pub active_improvement_key: Option<&'a str>,
}

/// Zrodla silnika dla `refreshBuildHighlight` (wywolywane leniwie, tylko w aktywnej galezi, jak w pinie).
pub struct BuildHighlightSources<'a> {
    /// `Object.values(map.hexes)` -> `hex.coords` w kolejnosci mapy (`main.ts:16355-16356`).
    pub map_hexes: &'a [(i32, i32)],
    /// `isInStartReveal(q, r)` (`main.ts:16357`; `start_reveal::StartRevealContext::is_in_start_reveal`).
    pub is_in_start_reveal: &'a dyn Fn(i32, i32) -> bool,
    /// `canFoundPlayerCityAt(q, r).ok` (`main.ts:16358`;
    /// `start_reveal::StartRevealContext::can_found_player_city_at`).
    pub can_found_player_city_at: &'a dyn Fn(i32, i32) -> bool,
    /// `qualifyingWonderHexesForPlayer()` (`main.ts:16365`;
    /// `wonder_placement::list_qualifying_wonder_hexes_for_owner`).
    pub qualifying_wonder_hexes: &'a dyn Fn() -> Vec<(i32, i32)>,
    /// `buildApi.getQualifyingHexes(key)` (`main.ts:16376`;
    /// `improvement_build::…::get_qualifying_hexes`).
    pub qualifying_hexes: &'a dyn Fn(&str) -> Vec<(i32, i32)>,
    /// `pendingImprovementsTurn.getUndoKeySet()` (`main.ts:16377`; klucze `"q,r:key"`,
    /// `game/pending-improvements.ts:43`).
    pub pending_undo_keys: &'a HashSet<String>,
}

/// `filterBuildHighlightHexes(improvementKey, hexes, pendingUndoKeys)` (`render/buildHighlight.ts:22-28`):
/// odrzuca heks, gdy `"${q},${r}:${improvementKey}"` jest w `pendingUndoKeys`; kolejnosc reszty bez zmian.
#[must_use]
pub fn filter_build_highlight_hexes(
    improvement_key: &str,
    hexes: &[(i32, i32)],
    pending_undo_keys: &HashSet<String>,
) -> Vec<(i32, i32)> {
    hexes
        .iter()
        .filter(|(q, r)| !pending_undo_keys.contains(&format!("{q},{r}:{improvement_key}")))
        .copied()
        .collect()
}

/// `new Set(hexes.map(h => keyOf(h.q, h.r)))`: kolejnosc pierwszego wystapienia, bez powtorzen.
fn dedup_set_order(hexes: impl IntoIterator<Item = (i32, i32)>) -> Vec<vm::HexCoord> {
    let mut seen: HashSet<(i32, i32)> = HashSet::new();
    hexes
        .into_iter()
        .filter(|h| seen.insert(*h))
        .map(|(q, r)| vm::HexCoord::new(q, r))
        .collect()
}

/// Brak warstwy (`clearHighlight` + `clearMineEligibleOverlay`, `main.ts:16369-16373`): puste
/// `hexes` (kontrakt: „Empty `hexes` = no layer”); `kind` bez znaczenia, ustalony na `Improvement`.
fn no_layer() -> BuildHighlightDto {
    BuildHighlightDto {
        kind: BuildHighlightKind::Improvement,
        hexes: Vec::new(),
    }
}

/// `refreshBuildHighlight()` (`main.ts:16351-16395` @ `07d2fbd72`) jako DTO.
///
/// Kolejnosc galezi jak w pinie: zalozenie miasta (`:16352-16361`), cud (`:16363-16367`), brak
/// trybu budowy (`:16369-16373`), kopalnia zloza (`:16386-16390`), pozostale ulepszenia
/// (`:16391-16395`).
#[must_use]
pub fn build_highlight(
    ui: &BuildHighlightUi<'_>,
    src: &BuildHighlightSources<'_>,
) -> BuildHighlightDto {
    if ui.found_city_mode {
        let qual = src
            .map_hexes
            .iter()
            .copied()
            .filter(|&(q, r)| (src.is_in_start_reveal)(q, r))
            .filter(|&(q, r)| (src.can_found_player_city_at)(q, r));
        return BuildHighlightDto {
            kind: BuildHighlightKind::FoundCity,
            hexes: dedup_set_order(qual),
        };
    }
    if ui.wonder_active {
        return BuildHighlightDto {
            kind: BuildHighlightKind::Wonder,
            hexes: dedup_set_order((src.qualifying_wonder_hexes)()),
        };
    }
    let Some(key) = ui.active_improvement_key.filter(|k| !k.is_empty()) else {
        return no_layer();
    };
    if !ui.build_mode_open {
        return no_layer();
    }
    let hexes =
        filter_build_highlight_hexes(key, &(src.qualifying_hexes)(key), src.pending_undo_keys);
    let kind = if is_mine_improvement_key(Some(key)) {
        BuildHighlightKind::Mine
    } else {
        BuildHighlightKind::Improvement
    };
    BuildHighlightDto {
        kind,
        hexes: dedup_set_order(hexes),
    }
}

/// Stan UI zaznaczenia (`UiState.selectedUnitId`, kontrakt §3.7, D-CMD-12): przekazywany do
/// producenta przez wolajacego; `PlayableState.selected_unit_id` nie jest czytany.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct SelectionUi {
    /// `selectedId`.
    pub selected_unit_id: Option<u64>,
}

/// `selection` (`setSelectionHex(u.q, u.r, u.ownerId)`, `main.ts:7119`, `:7262`, `:14854`): heks i
/// wlasciciel zaznaczonej jednostki z `units[]`; brak zaznaczenia albo jednostki o tym id -> `None`.
/// Wspolrzedne: `PositionDto(x, y)` = `HexCoord(q = x, r = y)` (kontrakt §1.4).
#[must_use]
pub fn selection(ui: &SelectionUi, units: &[PlayableUnit]) -> Option<SelectionDto> {
    let id = ui.selected_unit_id?;
    let unit = units.iter().find(|u| u.id.get() == id)?;
    let owner = vm::PlayerId::try_new(unit.owner_id.get()).ok()?;
    Some(SelectionDto {
        hex: vm::HexCoord::new(i32::from(unit.position.x()), i32::from(unit.position.y())),
        owner_id: vm::OwnerRef::Player(owner),
    })
}
