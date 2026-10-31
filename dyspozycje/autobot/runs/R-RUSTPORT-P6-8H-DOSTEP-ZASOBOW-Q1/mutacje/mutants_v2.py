import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mutants import M as BASE

M = []
for mid, old, new, klass in BASE:
    if mid == "M21":
        old = "    out.insert(\"zloto\".to_owned(), current - MENNICA_ZLOTO_DRAIN_PER_TURN);"
        new = "    out.insert(\"zloto\".to_owned(), current);"
    M.append((mid, old, new, klass))

M += [
("M39", "pub fn empire_has_kopalnia_na_zlozu_cyny(\n    placed: Option<&PlacedMap<'_>>,\n    hexes: Option<&HexZlozeMap>,\n) -> bool {\n    let (Some(placed), Some(hexes)) = (placed, hexes) else {\n        return false;",
        "pub fn empire_has_kopalnia_na_zlozu_cyny(\n    placed: Option<&PlacedMap<'_>>,\n    hexes: Option<&HexZlozeMap>,\n) -> bool {\n    let (Some(placed), Some(hexes)) = (placed, hexes) else {\n        return true;", "zabic"),
("M40", "pub fn empire_has_kopalnia_na_zlozu_zelaza(\n    placed: Option<&PlacedMap<'_>>,\n    hexes: Option<&HexZlozeMap>,\n) -> bool {\n    let (Some(placed), Some(hexes)) = (placed, hexes) else {\n        return false;",
        "pub fn empire_has_kopalnia_na_zlozu_zelaza(\n    placed: Option<&PlacedMap<'_>>,\n    hexes: Option<&HexZlozeMap>,\n) -> bool {\n    let (Some(placed), Some(hexes)) = (placed, hexes) else {\n        return true;", "zabic"),
("M41", "            return true;\n        }\n        match imp {", "            return false;\n        }\n        match imp {", "zabic"),
("M42", "    placed.map_or(0, |placed|", "    placed.map_or(1, |placed|", "zabic"),
("M43", "empire_stock.get(\"zloto\").copied().unwrap_or(0.0)", "empire_stock.get(\"zloto\").copied().unwrap_or(1.0)", "zabic"),
("M44", ".and_then(|stock| stock.get(\"ruda_cyny\").copied())\n        .unwrap_or(0.0)", ".and_then(|stock| stock.get(\"ruda_cyny\").copied())\n        .unwrap_or(1.0)", "zabic"),
("M45", ".and_then(|stock| stock.get(\"zelazo\").copied())\n        .unwrap_or(0.0)", ".and_then(|stock| stock.get(\"zelazo\").copied())\n        .unwrap_or(1.0)", "zabic"),
("M46", "    let own_pct = (js_clamp_unit(own_culture_share) * 100.0).round();", "    let own_pct = (js_clamp_unit(own_culture_share) * 100.0).floor();", "zabic"),
("M47", "            pct: 100.0,\n            is_owner: true,", "            pct: 99.0,\n            is_owner: true,", "zabic"),
("M48", "        _ => 1.0,", "        _ => 0.0,", "zabic"),
]
