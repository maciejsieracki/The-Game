#!/usr/bin/env python3
"""Tabela symboli P6.5A: KAZDY eksport trzech plikow TS (wyciagniety regexem ze zrodel pinu) ma status
PORTOWANY / DANE-JUZ-W-RUST / NIE-DOTYCZY / RUNDA-2, odpowiednik Rust (plik:linia) i test.

Uzycie: gen-symbols-p65a.py <WEB_ROOT> <ENGINE_DIR> > symbols-p65a-r1.tsv
Blad (exit 1), gdy eksport TS nie ma wiersza w mapowaniu albo mapowanie wskazuje symbol, ktorego nie ma
w zrodle / w Rust.
"""
import re
import sys
from pathlib import Path

WEB = Path(sys.argv[1])
ENGINE = Path(sys.argv[2])
GAME = WEB / "gra" / "src" / "game"
RS = (ENGINE / "src" / "domain" / "recruitment.rs").read_text(encoding="utf-8").splitlines()
DER = (ENGINE / "src" / "data" / "derived.rs").read_text(encoding="utf-8").splitlines()
P4 = (ENGINE / "src" / "domain" / "pathfinding.rs").read_text(encoding="utf-8").splitlines()

FILES = ["armyMerge.ts", "unit-cost-tempo.ts", "unit-replace-context.ts"]
EXPORT_RE = re.compile(r"^export (?:default )?(?:async )?(function|const|let|interface|type|class|enum)\s+([A-Za-z0-9_]+)", re.M)
PRIVATE_RE = re.compile(r"^(?:function|const|let)\s+([A-Za-z0-9_]+)", re.M)

P = "PORTOWANY"
D = "DANE-JUZ-W-RUST"
N = "NIE-DOTYCZY"
R2 = "RUNDA-2"

# nazwa TS -> (status, symbol Rust do znalezienia w pliku, plik 'rs'|'der'|'p4', test, uwaga)
M = {
    "StackDisplayInfo": (P, "pub struct StackDisplayInfo", "rs", "p6_5a_display::compute_stack_display_matches_web_order_and_vitals", "pola starving/goldDeficit ustawia wolajacy (main.ts); compute_stack_display zostawia None (klucze sprawdzone w wektorze)"),
    "stackGroupIdOf": (P, "pub fn stack_group_id_of", "rs", "p6_5a_stack::stack_group_id_and_render_key_match_web + stack_group_id_agrees_with_p64_port_on_the_same_unit", "drugi port na modelu StosJednostka; pierwszy w P6.4 (pathfinding.rs, DANE-JUZ-W-RUST dla RuchJednostka) - test zgodnosci obu"),
    "sameStackGroup": (P, "pub fn same_stack_group", "rs", "p6_5a_stack::same_stack_group_and_stack_key_match_web", ""),
    "freshStackGroupId": (P, "pub fn fresh_stack_group_id", "rs", "p6_5a_stack::fresh_and_shared_stack_group_ids_match_web_sequence", "Date.now() = wejscie now_ms; licznik modulu = StackGroupSeq"),
    "assignSharedStackGroupId": (P, "pub fn assign_shared_stack_group_id", "rs", "p6_5a_stack::fresh_and_shared_stack_group_ids_match_web_sequence", ""),
    "visibleStackOnHex": (P, "pub fn visible_stack_on_hex", "rs", "p6_5a_stack::visible_colocated_and_garrison_queries_match_web", ""),
    "coLocatedForMergePrompt": (P, "pub fn co_located_for_merge_prompt", "rs", "p6_5a_stack::visible_colocated_and_garrison_queries_match_web", ""),
    "adjacentVisibleArmyHexes": (P, "pub fn adjacent_visible_army_hexes", "rs", "p6_5a_stack::adjacent_army_hexes_and_active_stack_match_web", ""),
    "activeUnitStack": (P, "pub fn active_unit_stack", "rs", "p6_5a_stack::adjacent_army_hexes_and_active_stack_match_web", ""),
    "enterGarnizon": (P, "pub fn enter_garnizon", "rs", "p6_5a_stack::garrison_and_field_fortify_transitions_match_web", ""),
    "exitGarnizon": (P, "pub fn exit_garnizon", "rs", "p6_5a_stack::garrison_and_field_fortify_transitions_match_web", ""),
    "enterFieldFortify": (P, "pub fn enter_field_fortify", "rs", "p6_5a_stack::garrison_and_field_fortify_transitions_match_web + transition_chains_*", "obie fortyfikacje naraz osiagalne (lancuchy)"),
    "exitFieldFortify": (P, "pub fn exit_field_fortify", "rs", "p6_5a_stack::garrison_and_field_fortify_transitions_match_web", ""),
    "allDefendersFortifiedInGarnizon": (P, "pub fn all_defenders_fortified_in_garnizon", "rs", "p6_5a_stack::all_defenders_and_wake_stack_match_web", ""),
    "pickStackRepresentative": (P, "pub fn pick_stack_representative", "rs", "p6_5a_display::representative_matches_web_including_utf16_id_order_and_nan_attack", "pusty stos: web rzuca TypeError, Rust zwraca None (zmierzone w wektorze: threw=true)"),
    "garrisonUnitsOnHex": (P, "pub fn garrison_units_on_hex", "rs", "p6_5a_stack::visible_colocated_and_garrison_queries_match_web", ""),
    "stackRenderKey": (P, "pub fn stack_render_key", "rs", "p6_5a_stack::stack_group_id_and_render_key_match_web", ""),
    "computeStackDisplay": (P, "pub fn compute_stack_display", "rs", "p6_5a_display::compute_stack_display_matches_web_order_and_vitals", "kolejnosc Set/Map zachowana; zaleznosci vitals wstrzykiwane"),
    "unitAtRepresentative": (P, "pub fn unit_at_representative", "rs", "p6_5a_display::unit_at_representative_matches_web", ""),
    "findAdjacentEmptyHexes": (P, "pub fn find_adjacent_empty_hexes", "rs", "p6_5a_ruch::adjacent_empty_and_split_destinations_match_web", ""),
    "SplitDestHex": (P, "pub struct SplitDestHex", "rs", "p6_5a_ruch::adjacent_empty_and_split_destinations_match_web", ""),
    "findSplitDestHexes": (P, "pub fn find_split_dest_hexes", "rs", "p6_5a_ruch::adjacent_empty_and_split_destinations_match_web", "etykieta z army-merge-params.json"),
    "assignBounceHexesForUnits": (P, "pub fn assign_bounce_hexes_for_units", "rs", "p6_5a_ruch::bounce_hex_assignment_matches_web_including_duplicates_and_blocking", ""),
    "findBounceHexFromOrigin": (P, "pub fn find_bounce_hex_from_origin", "rs", "p6_5a_ruch::bounce_from_origin_and_separate_return_hex_match_web", "wraz z prywatnym findRejectHex (fn find_reject_hex)"),
    "stackKey": (P, "pub fn stack_key", "rs", "p6_5a_stack::same_stack_group_and_stack_key_match_web", "= keyOf (P6.4: ruch_jednostek::key_of)"),
    "computeSeparateReturn": (P, "pub fn compute_separate_return", "rs", "p6_5a_ruch::separate_return_matches_web_bitwise", ""),
    "resolveSeparateReturnHex": (P, "pub fn resolve_separate_return_hex", "rs", "p6_5a_ruch::bounce_from_origin_and_separate_return_hex_match_web", ""),
    "stackHudMergeSplitActions": (P, "pub fn stack_hud_merge_split_actions", "rs", "p6_5a_ruch::hud_actions_match_web", "identyfikatory i etykiety z army-merge-params.json"),
    "stackRuchLeft": (P, "pub fn stack_ruch_left", "rs", "p6_5a_ruch::ruch_pools_match_web_bitwise", ""),
    "planningStackRuchLeft": (P, "pub fn planning_stack_ruch_left", "rs", "p6_5a_ruch::ruch_pools_match_web_bitwise", ""),
    "planningUnitRuchLeft": (P, "pub fn planning_unit_ruch_left", "rs", "p6_5a_ruch::ruch_pools_match_web_bitwise", ""),
    "wakeStackForMoveOrder": (P, "pub fn wake_stack_for_move_order", "rs", "p6_5a_stack::all_defenders_and_wake_stack_match_web", ""),
    "stackRuchMax": (P, "pub fn stack_ruch_max", "rs", "p6_5a_ruch::ruch_pools_match_web_bitwise", ""),
    "stackHpPool": (P, "pub fn stack_hp_pool", "rs", "p6_5a_display::hp_pool_matches_web_including_nonfinite_and_overfull_hp", ""),
    "stackFieldPowerM": (P, "pub fn stack_field_power_m", "rs", "p6_5a_display::field_power_passes_roster_in_web_order_and_returns_sum", "sumRosterFieldM (auto-battle-power.ts) wstrzykiwane; roster (typ+definicja, kolejnosc) asertowany wzgledem weba"),
    "stackArmorBadgeLevel": (P, "pub fn stack_armor_badge_level", "rs", "p6_5a_display::badge_and_veteran_maxima_match_web", "armorPathBadgeLevel (unit-building-bonuses.ts, czesc B) wstrzykiwane"),
    "stackSoftBadgeLevel": (P, "pub fn stack_soft_badge_level", "rs", "p6_5a_display::badge_and_veteran_maxima_match_web", "softPathBadgeLevel (czesc B) wstrzykiwane"),
    "stackVeteranLevel": (P, "pub fn stack_veteran_level", "rs", "p6_5a_display::badge_and_veteran_maxima_match_web", "veteranLevel (veteran.ts) wstrzykiwane"),
    "stackVeteranStarCount": (P, "pub fn stack_veteran_star_count", "rs", "p6_5a_display::badge_and_veteran_maxima_match_web", "veteranStarCount (veteran.ts) wstrzykiwane"),
    "StackVitals": (P, "pub struct StackVitals", "rs", "p6_5a_display::stack_vitals_matches_web", ""),
    "StackVitalsDeps": (P, "pub struct StackVitalsDeps", "rs", "p6_5a_display::stack_vitals_matches_web", "rozszerzone o zaleznosci importowane przez web z innych plikow (zob. uwagi wyzej)"),
    "stackVitals": (P, "pub fn stack_vitals", "rs", "p6_5a_display::stack_vitals_matches_web", ""),
    "syncStackRuchLeft": (P, "pub fn sync_stack_ruch_left", "rs", "p6_5a_ruch::sync_and_deduct_match_web", ""),
    "deductStackRuchLeft": (P, "pub fn deduct_stack_ruch_left", "rs", "p6_5a_ruch::sync_and_deduct_match_web", ""),
    "unitWithStackRuch": (P, "pub fn unit_with_stack_ruch", "rs", "p6_5a_ruch::unit_with_pooled_ruch_matches_web", "tozsamosc referencji (===) nie dotyczy Rust: zwracana kopia; wartosc sprawdzona"),
    "unitWithPlanningStackRuch": (P, "pub fn unit_with_planning_stack_ruch", "rs", "p6_5a_ruch::unit_with_pooled_ruch_matches_web", "jw."),
    "countLawGarrisonOnCityHex": (P, "pub fn count_law_garrison_on_city_hex", "rs", "p6_5a_stack::law_garrison_counts_match_web", ""),
    "unitsOnCityHexForLaw": (P, "pub fn units_on_city_hex_for_law", "rs", "p6_5a_stack::law_garrison_counts_match_web", ""),
    "KOSZT_JEDNOSTEK_PACE": (P, "pub fn unit_cost_tempo", "der", "p6_5a_cost::table_constants_equal_the_running_web_object + p6_5a_tables", "tabela data/derived/unit-cost-tempo.json (edytowalna), wartosci = obiekt z uruchomionego weba"),
    "KosztJednostekPace": (N, "pub enum UnitCostPace", "rs", "p6_5a_cost::unit_cost_pace_matches_web_bitwise", "typ TS (klucz tempa); Rust: UnitCostPace::Key(&str) | Multiplier(f64) (obejmuje tez `| number`)"),
    "applyUnitCostPace": (P, "pub fn apply_unit_cost_pace", "rs", "p6_5a_cost::unit_cost_pace_matches_web_bitwise", "Math.round/Math.max semantyka JS (js_round/js_max)"),
    "ReplaceAvailabilityCtxParams": (P, "pub struct ReplaceAvailabilityCtxParams", "rs", "p6_5a_cost::replace_context_keeps_every_field_and_the_required_stock", "generyczne po polach reszta AvailabilityContext (production.ts, poza zakresem: RUNDA-2 konkretny typ); empireResourceStock obowiazkowy (typ nie-Option)"),
    "buildReplaceAvailabilityCtx": (P, "pub fn build_replace_availability_ctx", "rs", "p6_5a_cost::replace_context_keeps_every_field_and_the_required_stock", "`{...params}`; tozsamosc referencji obiektow nie dotyczy Rust"),
}
# elementy prywatne / modulowe
PRIV = {
    "NEIGH": (D, "sasiedzi", "ruch-jednostek-params.json", "p6_5a_ruch::adjacent_empty_and_split_destinations_match_web", "kolejnosc sasiadow z tabeli P6.4 (teren.sasiedzi); zgodnosc z TS sprawdza verify-p65a-vectors.py (tabela_vs_TS.sasiedzi)"),
    "stackGroupSeq": (P, "pub struct StackGroupSeq", "rs", "p6_5a_stack::fresh_and_shared_stack_group_ids_match_web_sequence", "licznik modulu"),
    "findRejectHex": (P, "fn find_reject_hex", "rs", "p6_5a_ruch::bounce_from_origin_and_separate_return_hex_match_web", "prywatna; wywolywana przez findBounceHexFromOrigin"),
}


def find_line(lines, needle):
    for i, line in enumerate(lines, 1):
        if needle in line:
            return i
    return None


def rust_ref(kind, symbol):
    if kind == "rs":
        n = find_line(RS, symbol)
        return f"rust-port/engine/src/domain/recruitment.rs:{n}" if n else None
    if kind == "der":
        n = find_line(DER, symbol)
        return f"rust-port/engine/src/data/derived.rs:{n}" if n else None
    if kind == "p4":
        n = find_line(P4, symbol)
        return f"rust-port/engine/src/domain/pathfinding.rs:{n}" if n else None
    return symbol  # plik danych


rows = []
errors = []
seen = set()
for fname in FILES:
    text = (GAME / fname).read_text(encoding="utf-8")
    for kind, name in EXPORT_RE.findall(text):
        seen.add(name)
        if name not in M:
            errors.append(f"brak mapowania dla eksportu {fname}:{name}")
            continue
        status, sym, rk, test, note = M[name]
        ref = rust_ref(rk, sym)
        if ref is None:
            errors.append(f"brak symbolu Rust {sym} dla {name}")
            continue
        line = next(i for i, l in enumerate(text.splitlines(), 1) if re.match(rf"^export (?:default )?(?:async )?{kind}\s+{name}\b", l))
        rows.append((f"gra/src/game/{fname}:{line}", name, kind, status, ref, test, note))
    for name in PRIVATE_RE.findall(text):
        if name in PRIV:
            status, sym, rk, test, note = PRIV[name]
            ref = rust_ref(rk, sym)
            if ref is None:
                errors.append(f"brak symbolu Rust {sym} dla {name}")
                continue
            line = next(i for i, l in enumerate(text.splitlines(), 1) if re.match(rf"^(?:function|const|let)\s+{name}\b", l))
            rows.append((f"gra/src/game/{fname}:{line}", name, "prywatny", status, ref, test, note))
            seen.add(name)
for name in list(M) + list(PRIV):
    if name not in seen:
        errors.append(f"mapowanie dla symbolu spoza zrodla: {name}")

print("zrodlo_web\tsymbol\trodzaj\tstatus\todpowiednik_rust\ttest\tuwaga")
for r in rows:
    print("\t".join(c if c else "-" for c in r))
if errors:
    for e in errors:
        print("BLAD:", e, file=sys.stderr)
    sys.exit(1)
counts = {}
for r in rows:
    counts[r[3]] = counts.get(r[3], 0) + 1
print("# podsumowanie:", ", ".join(f"{k}={v}" for k, v in sorted(counts.items())), f"razem={len(rows)}", file=sys.stderr)
