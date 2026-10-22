//! P6.M16 - kompletnosc dokumentu: kazdy eksport (32 runtime + 9 typow) i kazdy nieeksportowany symbol
//! zakresu `improvement-build.ts`:50-1558 ma wiersz w `dyspozycje/rust-port/p6/P6-M16-ULEPSZENIA-BUDOWA-REGULY.md`
//! z jawnym statusem (PORTOWANY / DANE / NIE-DOTYCZY / RUNDA-2). Lista nazw to dane testu (zrodlo: inwentarz
//! `grep -nE '^(export )?(function|const|interface|type) '` na `improvement-build.ts` @ edb8fb56).

use std::fs;
use std::path::PathBuf;

const SYMBOLS: &[&str] = &[
    // eksporty runtime
    "stripImprovementsWhenForestRemoved",
    "isLegacyFarmOnForestLayer",
    "stripLegacyFarmOnForest",
    "planLegacyFarmOnForestRemoval",
    "removeLegacyFarmsOnForest",
    "isFarmBaseTerrain",
    "isStadninaBlockedOnForest",
    "isImprovementBlockedOnForest",
    "getImprovementForestBlockHint",
    "isOwceBaseTerrain",
    "FOOD_LAYER_KEYS",
    "improvementsReplacedByBuild",
    "computeImprovementBuildImpact",
    "formatImprovementBuildImpactList",
    "MINE_IMPROVEMENT_KEYS",
    "isMineImprovementKey",
    "isImprovementVisibleInBuildPanel",
    "isTarasyCiv",
    "hasBlockingDepositForFarm",
    "hexHasClayDeposit",
    "hexHasDepositReserve",
    "depositAllowsPlayerImprovement",
    "canAddFoodLayer",
    "hasAnimalDeposit",
    "buildImprovementQualifier",
    "galleryTerrainEligible",
    "galleryComboEligible",
    "galleryComboShowModel",
    "getForestBuildBlockReason",
    "createImprovementBuildApi",
    "collectRoadKeys",
    "isRoadImprovementKey",
    // typy
    "HexWithZloze",
    "ImprovementBuildState",
    "ImprovementTypeInfo",
    "ImprovementBuildRequest",
    "ImprovementBuildCallbacks",
    "ImprovementBuildModeOptions",
    "LegacyFarmHexView",
    "LegacyFarmOnForestChange",
    "LegacyFarmOnForestReport",
    "ImprovementBuildImpact",
    "TerenSet",
    "JsonImprovement",
    "ForestBuildKey",
    "ForestPlacementScan",
    // nieeksportowane stale / helpery
    "TERENY_LADU",
    "TARTAK_TERENY",
    "FOREST_DEPENDENT_IMPROVEMENT_KEYS",
    "FLAT_FARM",
    "FLAT_IRR",
    "FOREST_COEXIST_IMPROVEMENT_KEYS",
    "FOREST_BLOCKED_IMPROVEMENT_KEYS",
    "SOLO_FOOD_KEYS",
    "SEKTOR_OF",
    "EXCLUSIVE_SEKTORY",
    "existingAfterSimulatedRemoval",
    "TERRAIN_ALLOW",
    "hexHasRudaDeposit",
    "keysOnPlacedHex",
    "getHexLayers",
    "isFoodKey",
    "buildPlacedImprovementsMap",
    "hexNeighbors",
    "buildRiverHexSet",
    "readWorkCost",
    "NAKLADKI_ZWIERZECZE",
    "hexZloze",
    "createQualifier",
    "scanForestPlacement",
    "candidateHexKeys",
    "listTypes",
    "createBuildRequest",
    "handleHexClick",
];

#[test]
fn document_has_a_status_row_for_every_web_symbol() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../dyspozycje/rust-port/p6/P6-M16-ULEPSZENIA-BUDOWA-REGULY.md");
    let doc = fs::read_to_string(&path).unwrap_or_else(|e| panic!("brak {}: {e}", path.display()));
    let statuses = ["PORTOWANY", "DANE", "NIE-DOTYCZY", "RUNDA-2"];
    for symbol in SYMBOLS {
        let needle = format!("`{symbol}`");
        let row = doc
            .lines()
            .find(|line| line.starts_with('|') && line.contains(&needle))
            .unwrap_or_else(|| panic!("brak wiersza tabeli dla {symbol}"));
        assert!(
            statuses.iter().any(|status| row.contains(status)),
            "wiersz {symbol} bez statusu: {row}"
        );
    }
}
