#!/usr/bin/env python3
"""Tabela symboli P6.6A: KAZDY eksport (i symbol prywatny) czterech plikow TS (wyciagniety regexem ze
zrodel pinu) ma status z zamknietego slownika, odpowiednik Rust (plik:linia, symbol) i test.

Uzycie: gen-symbols-p66a.py <WEB_ROOT> <ENGINE_DIR> > symbols-p66a-r1.tsv
Blad (exit 1), gdy: eksport TS nie ma wiersza w mapowaniu; mapowanie wskazuje symbol, ktorego nie ma
w zrodle / w Rust / w testach; status spoza slownika; wiersz bez uzasadnienia w polu `uwaga`.
"""
import re
import sys
from pathlib import Path

WEB = Path(sys.argv[1])
ENGINE = Path(sys.argv[2])
GAME = WEB / "gra" / "src" / "game"
FILES = {
    "ST": ENGINE / "src" / "domain" / "state.rs",
    "TE": ENGINE / "src" / "domain" / "terrain.rs",
    "DE": ENGINE / "src" / "data" / "derived.rs",
    "TR": ENGINE / "src" / "domain" / "territory.rs",
}
REL = {
    "ST": "rust-port/engine/src/domain/state.rs",
    "TE": "rust-port/engine/src/domain/terrain.rs",
    "DE": "rust-port/engine/src/data/derived.rs",
    "TR": "rust-port/engine/src/domain/territory.rs",
}
LINES = {k: p.read_text(encoding="utf-8").splitlines() for k, p in FILES.items()}
TESTS = "".join(p.read_text(encoding="utf-8") for p in sorted((ENGINE / "tests").glob("p6_6a_*.rs")))

P = "PORTOWANY"
PW = "PORTOWANY-Z-WSTRZYKNIETYMI"
D = "DANE-JUZ-W-RUST"
ND = "NIE-DOTYCZY"
R2 = "RUNDA-2"
VOCAB = {P, PW, D, ND, R2}

EXPORT_RE = re.compile(r"^export (?:default )?(?:async )?(function|const|let|interface|type|class|enum)\s+([A-Za-z0-9_]+)", re.M)
REEXPORT_RE = re.compile(r"^export \{\s*([A-Za-z0-9_, ]+)\s*\} from", re.M)
PRIVATE_RE = re.compile(r"^(?:function|const|let|interface|type)\s+([A-Za-z0-9_]+)", re.M)

TF = "p6_6a_founding::"
TH = "p6_6a_hexclear::"
TC = "p6_6a_conquest::"
TV = "p6_6a_visibility::"
TT = "p6_6a_tables::"

# plik TS -> lista (symbol, status, klucz_rust, symbol_rust, test, uwaga)
M = {
    "city-founding.ts": [
        ("FoundCitySourceCity", P, "ST", "pub struct FoundCitySourceCity", TF + "pick_source_city_matches_web_including_rand_protocol", "interfejs -> struct; population f64, ownerId i64"),
        ("foundCityWorkCost", P, "ST", "pub fn found_city_work_cost", TF + "cost_constants_match_running_web", "wartosc z DANE-JUZ-W-RUST (data/miasto-params.json zaloz_miasto_koszt_praca), zapasowa w city-founding-params.json"),
        ("foundCityPopulationCost", P, "ST", "pub fn found_city_population_cost", TF + "cost_constants_match_running_web", "j.w. zaloz_miasto_koszt_ludnosci"),
        ("FoundCityAffordance", P, "ST", "pub struct FoundCityAffordance", TF + "evaluate_found_city_affordance_matches_web", "reason/sourceCityId -> Option"),
        ("isSubsequentFoundCity", P, "ST", "pub fn is_subsequent_found_city", TF + "is_subsequent_found_city_matches_web", "sygnatura: lista ownerId zamiast {ownerId}[] (web czyta tylko ownerId)"),
        ("AI_FOUNDING_SOURCE_MIN_POP", P, "ST", "pub fn ai_founding_source_min_pop", TF + "cost_constants_match_running_web", "dane: data/derived/city-founding-params.json ai_source_min_pop"),
        ("pickSourceCityForFounding", PW, "ST", "pub fn pick_source_city_for_founding", TF + "pick_source_city_matches_web_including_rand_protocol", "WSTRZYKNIETE: rand (Math.random) jako &mut dyn FnMut; protokol wywolan (0 lub 1) sprawdzany; undefined -> None"),
        ("EvaluateFoundCityAffordanceOpts", PW, "ST", "pub fn evaluate_found_city_affordance", TF + "evaluate_found_city_affordance_matches_web", "obiekt opts {rand?} zastapiony parametrem rand (domyslne Math.random nie istnieje w deterministycznym silniku)"),
        ("evaluateFoundCityAffordance", PW, "ST", "pub fn evaluate_found_city_affordance", TF + "evaluate_found_city_affordance_matches_web", "WSTRZYKNIETE: rand; teksty komunikatow w city-founding-params.json"),
        ("canAffordFoundCity", P, "ST", "pub fn can_afford_found_city", TF + "can_afford_found_city_matches_web", "@deprecated w webie, nadal eksportowana; opts.firstCityFree -> bool"),
        ("foundCityCostLabel", P, "ST", "pub fn found_city_cost_label", TF + "cost_labels_match_web", "szablony w city-founding-params.json"),
        ("ParamRow", ND, None, None, None, "prywatny typ wiersza JSON; zastapiony Option<f64> w read_param"),
        ("readParam", P, "ST", "pub fn read_param", TF + "read_param_accepts_only_finite_numbers", "typeof number && isFinite -> Some(v) skonczone"),
    ],
    "city-hex-clear.ts": [
        ("CITY_KEEP_IMPROVEMENT_KEYS", P, "TE", "pub fn city_keep_improvement_keys", TH + "keep_set_and_predicate_match_web", "dane: data/derived/city-hex-clear-rules.json zostaje_ulepszenia (kolejnosc wstawiania zachowana)"),
        ("cityKeepsImprovement", P, "TE", "pub fn city_keeps_improvement", TH + "keep_set_and_predicate_match_web", ""),
        ("clearHexForCityCenter", P, "TE", "pub fn clear_hex_for_city_center", TH + "clear_hex_for_city_center_matches_web", "mountainClearsAll=true domyslnie: Option<bool>::None"),
        ("applyCityFoundingToHex", PW, "TE", "pub fn apply_city_founding_to_hex", TH + "apply_city_founding_to_hex_matches_web", "WSTRZYKNIETE: hexToWorkedTile (turn-economy.ts) jako domkniecie; test sprawdza snapshot PRZED czyszczeniem; city.centerWorkedTile -> &mut Option<T>"),
        ("HexExt", P, "TE", "pub struct CityCenterHex", TH + "clear_hex_for_city_center_matches_web", "podzbior pol Hex czytanych/zmienianych przez modul + pola dla wstrzyknietego hexToWorkedTile"),
        ("isKeptDeposit", P, "TE", "fn is_kept_deposit", TH + "clear_hex_for_city_center_matches_web", "dane: zostaja_zloza_nakladki"),
    ],
    "conquest-stability.ts": [
        ("isForeignCultureDominant", P, "ST", "pub fn is_foreign_culture_dominant", TC + "thresholds_match_web", "prog w conquest-stability-params.json"),
        ("isConquestUnstable", P, "ST", "pub fn is_conquest_unstable", TC + "thresholds_match_web", ""),
        ("CityCaptureCultureOpts", P, "ST", "pub struct CityCaptureCultureOpts", TC + "on_city_captured_culture_matches_web_with_injected_circle", "civKeyForOwner -> Option<&dyn Fn(i64)->String>"),
        ("onCityCapturedCulture", PW, "ST", "pub fn on_city_captured_culture", TC + "on_city_captured_culture_matches_web_with_injected_circle", "WSTRZYKNIETE: sameCultureCircle (diplomacy-display.ts, P6.14); clearCityCultureMix (society-inputs.ts) - port lokalny 3 linii"),
        ("cultureBuildingsFromIds", P, "ST", "pub fn culture_buildings_from_ids", TC + "building_flags_match_web", "mapowanie id->flaga: conquest-stability-params.json budynki_kulturalne"),
        ("religionBuildingsFromIds", P, "ST", "pub fn religion_buildings_from_ids", TC + "building_flags_match_web", "mapowanie: budynki_religijne"),
        ("CultureReligionTickResult", P, "ST", "pub struct CultureReligionTickResult", TC + "tick_city_culture_religion_matches_web_with_injected_conversions", "generyczny po typie stanu religii"),
        ("tickCityCultureReligion", PW, "ST", "pub fn tick_city_culture_religion", TC + "tick_city_culture_religion_matches_web_with_injected_conversions", "WSTRZYKNIETE: convertCulture i convertViaTemple (culture-religion.ts, P6.16) jako domkniecia; testy sprawdzaja argumenty wywolan"),
        ("conquestUnstableHappinessPenalty", P, "ST", "pub fn conquest_unstable_happiness_penalty", TC + "revolt_multiplier_and_deprecated_penalties_match_web", "@deprecated, ZAWSZE 0 (decyzja G5); society/difficulty nie wplywaja na wynik i pominiete"),
        ("conquestNoGarrisonLawPenalty", P, "ST", "pub fn conquest_no_garrison_law_penalty", TC + "revolt_multiplier_and_deprecated_penalties_match_web", "@deprecated, ZAWSZE 0 (D5)"),
        ("conquestRevoltRiskMultiplier", P, "ST", "pub fn conquest_revolt_risk_multiplier", TC + "revolt_multiplier_and_deprecated_penalties_match_web", "mnoznik 1.5 w conquest-stability-params.json"),
    ],
    "visibility.ts": [
        ("DEFAULT_SIGHT", P, "ST", "pub fn default_sight", TV + "constants_match_running_web", "wartosc: DANE-JUZ-W-RUST (map-gen-params.json mgla.default_sight_jednostki); FALLBACK_SIGHT w visibility-params.json"),
        ("FOG_EXPLORED_BRIGHTNESS", P, "ST", "pub fn fog_explored_brightness", TV + "constants_match_running_web", "dane: visibility-params.json"),
        ("UnitSightResolver", P, "ST", "pub type UnitSightResolver", TV + "unit_sight_resolver_and_compute_visible_match_web", ""),
        ("buildUnitSightResolver", P, "ST", "pub fn build_unit_sight_resolver", TV + "unit_sight_resolver_and_compute_visible_match_web", "UnitDef -> UnitSightDef (liczby tylko gdy typeof number); pozniejsza definicja nadpisuje"),
        ("computeVisibleAt", P, "ST", "pub fn compute_visible_at", TV + "compute_visible_at_matches_web", "petla f64 jak w JS; sight niecalkowite -> brak kluczy; +Infinity: web sie nie konczy, Rust zwraca puste (ZALOZENIE)"),
        ("computeVisibleAlongPath", P, "ST", "pub fn compute_visible_along_path", TV + "compute_visible_along_path_matches_web", ""),
        ("computeVisible", P, "ST", "pub fn compute_visible", TV + "compute_visible_fixed_sight_matches_web", "przeciazenia number/resolver -> enum UnitSight"),
        ("addExplored", P, "ST", "pub fn add_explored", TV + "add_explored_and_render_sets_match_web", ""),
        ("allHexKeys", P, "ST", "pub fn all_hex_keys", TV + "key_listings_and_terrain_predicates_match_web", "kolejnosc: rosnaco po (q,r) (BTreeMap); web: kolejnosc wstawiania - patrz R2-2"),
        ("isRevealLandTeren", P, "ST", "pub fn is_reveal_land_teren", TV + "key_listings_and_terrain_predicates_match_web", ""),
        ("allRevealLandKeys", P, "ST", "pub fn all_reveal_land_keys", TV + "key_listings_and_terrain_predicates_match_web", "kolejnosc j.w. (R2-2)"),
        ("isDryLandTeren", P, "ST", "pub fn is_dry_land_teren", TV + "key_listings_and_terrain_predicates_match_web", "uzywa pathfinding::ruch_jednostek::is_water_terrain (P6.4)"),
        ("allDryLandKeys", P, "ST", "pub fn all_dry_land_keys", TV + "key_listings_and_terrain_predicates_match_web", "kolejnosc j.w. (R2-2)"),
        ("exploredSetForRender", P, "ST", "pub fn explored_set_for_render", TV + "add_explored_and_render_sets_match_web", "web zwraca ten sam obiekt gdy !reveal; Rust zwraca kopie (rownosc wartosci)"),
        ("PlayerVisibilityCity", P, "ST", "pub struct PlayerVisibilityCity", TV + "compute_player_visibility_matches_web", "kultura? -> Option<f64>"),
        ("ComputePlayerVisibilityOptions", P, "ST", "pub struct ComputePlayerVisibilityOptions", TV + "compute_player_visibility_matches_web", "startHex/startRevealRadius -> Option"),
        ("computePlayerVisibility", PW, "ST", "pub fn compute_player_visibility", TV + "compute_player_visibility_matches_web", "WSTRZYKNIETE: cityBorderRadius (culture-religion.ts, P6.16) jako domkniecie przekazane do territory::city_sight_radius"),
        ("citySightRadius", D, "TR", "pub fn city_sight_radius", TV + "city_sight_radius_reexport_matches_web", "re-eksport okolica.citySightRadius = territory::city_sight_radius (M14); w visibility.rs re-eksport `pub use`"),
        ("unitsVisibleOnMap", P, "ST", "pub fn units_visible_on_map", TV + "units_visible_on_map_matches_web", "playerOwnerId=0 domyslnie: Option<i64>"),
    ],
}


def ts_symbols(name):
    text = (GAME / name).read_text(encoding="utf-8")
    exports = [m.group(2) for m in EXPORT_RE.finditer(text)]
    for m in REEXPORT_RE.finditer(text):
        exports += [s.strip() for s in m.group(1).split(",") if s.strip()]
    private = [m.group(1) for m in PRIVATE_RE.finditer(text)]
    return text, exports, private


def find_line(key, needle):
    for i, line in enumerate(LINES[key]):
        if needle in line:
            return i + 1
    return None


errors = []
print("plik_ts\tlinia_ts\tsymbol\tstatus\todpowiednik_rust\ttest\tuwaga")
total = 0
counts = {}
for name, rows in M.items():
    text, exports, private = ts_symbols(name)
    known = {r[0] for r in rows}
    for e in exports:
        if e not in known:
            errors.append(f"{name}: eksport {e} bez wiersza w mapowaniu")
    for p in private:
        if p not in known and p not in exports:
            errors.append(f"{name}: symbol prywatny {p} bez wiersza w mapowaniu")
    for sym, status, key, rust_sym, test, note in rows:
        total += 1
        counts[status] = counts.get(status, 0) + 1
        if status not in VOCAB:
            errors.append(f"{name}:{sym}: status {status} spoza slownika")
        m = re.search(r"^(?:export )?(?:function|const|let|interface|type)\s+" + re.escape(sym) + r"\b", text, re.M) or re.search(r"^export \{[^}]*\b" + re.escape(sym) + r"\b", text, re.M)
        if not m:
            errors.append(f"{name}:{sym}: brak w zrodle")
            ts_line = "?"
        else:
            ts_line = text[: m.start()].count("\n") + 1
        loc = "-"
        if status != ND:
            if key is None:
                errors.append(f"{name}:{sym}: brak odpowiednika Rust")
            else:
                ln = find_line(key, rust_sym)
                if ln is None:
                    errors.append(f"{name}:{sym}: w {REL[key]} brak `{rust_sym}`")
                else:
                    loc = f"{REL[key]}:{ln} ({rust_sym})"
            if test:
                t = test.split("::")[1]
                if f"fn {t}(" not in TESTS:
                    errors.append(f"{name}:{sym}: brak testu {test}")
            else:
                errors.append(f"{name}:{sym}: brak testu")
        if not note and status in (PW, ND, R2, D):
            errors.append(f"{name}:{sym}: status {status} wymaga uwagi")
        print(f"{name}\t{ts_line}\t{sym}\t{status}\t{loc}\t{test or '-'}\t{note or '-'}")
print(f"# symboli={total} statusy={counts}", file=sys.stderr)
if errors:
    for e in errors:
        print("BLAD:", e, file=sys.stderr)
    sys.exit(1)
print(f"# OK symboli={total}", file=sys.stderr)
