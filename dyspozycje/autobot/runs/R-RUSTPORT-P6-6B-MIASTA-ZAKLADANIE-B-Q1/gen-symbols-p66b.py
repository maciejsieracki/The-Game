#!/usr/bin/env python3
"""Tabela symboli P6.6B: kazdy eksport i symbol prywatny trzech plikow weba ma wiersz ze statusem.

Uzycie: gen-symbols-p66b.py <WEB_ROOT> <ENGINE_DIR> > symbols-p66b-r1.tsv
Sprawdza (blad i exit 2): (a) kazdy `export ...` / prywatna deklaracja pliku TS ma wiersz; (b) wiersz nie wskazuje
symbolu spoza zrodla; (c) nazwa Rust istnieje w `src/domain/state.rs` (modul p6_6b::<modul>) i ma numer linii;
(d) nazwa testu istnieje w `tests/p6_6b_*.rs`. Slownik statusow: PORTOWANY, PORTOWANY-Z-WSTRZYKNIETYMI,
DANE-JUZ-W-RUST, NIE-DOTYCZY, RUNDA-2.
"""
import re
import sys
from pathlib import Path

WEB = Path(sys.argv[1])
ENG = Path(sys.argv[2])
STATE = (ENG / "src/domain/state.rs").read_text(encoding="utf-8").split("\n")
TESTS = {p.name: p.read_text(encoding="utf-8") for p in (ENG / "tests").glob("p6_6b_*.rs")}
STATUSES = {"PORTOWANY", "PORTOWANY-Z-WSTRZYKNIETYMI", "DANE-JUZ-W-RUST", "NIE-DOTYCZY", "RUNDA-2"}

# --- granice modulow w state.rs ---
start = next(i for i, l in enumerate(STATE) if l.startswith("pub mod p6_6b {"))
mods = {}
for name in ("display_names", "cities", "empire_city_defaults"):
    mods[name] = next(i for i in range(start, len(STATE)) if STATE[i].startswith(f"    pub mod {name} {{"))
order = sorted(mods.items(), key=lambda kv: kv[1])
ranges = {}
for idx, (name, s) in enumerate(order):
    e = order[idx + 1][1] if idx + 1 < len(order) else len(STATE)
    ranges[name] = (s, e)


def rust_line(mod, name):
    s, e = ranges[mod]
    pat = re.compile(rf"^\s+pub (?:fn|struct|enum|type|const) {re.escape(name)}\b")
    for i in range(s, e):
        if pat.match(STATE[i]):
            return i + 1
    raise SystemExit(f"BLAD: brak `{name}` w module {mod}")


def has_test(fname, test):
    if fname not in TESTS or not re.search(rf"fn {re.escape(test)}\b", TESTS[fname]):
        raise SystemExit(f"BLAD: brak testu {fname}::{test}")


# --- eksporty i symbole prywatne wykryte w zrodlach TS ---
DECL = re.compile(r"^(export )?(?:(?:const|let|function|interface|type|enum|class) )(\w+)")


def scan(fname):
    out = {}
    for n, line in enumerate((WEB / "gra/src/game" / fname).read_text(encoding="utf-8").split("\n"), 1):
        m = DECL.match(line)
        if m and m.group(2) not in out:
            out[m.group(2)] = n
    return out


R = "PORTOWANY"
RI = "PORTOWANY-Z-WSTRZYKNIETYMI"
DR = "DANE-JUZ-W-RUST"
ND = "NIE-DOTYCZY"

# (plik, symbol): (status, modul, [nazwy Rust], test (plik::nazwa) albo '-', uwaga)
D = "display-names.ts"
E = "empire-city-defaults.ts"
C = "cities.ts"
T = {
    "display": "p6_6b_display.rs",
    "percent": "p6_6b_percent.rs",
    "lists": "p6_6b_lists.rs",
    "empire": "p6_6b_empire.rs",
    "ensure": "p6_6b_cities_ensure.rs",
    "found": "p6_6b_cities_found.rs",
    "tables": "p6_6b_tables.rs",
}
M = {}


def add(file, sym, status, mod, rust, test, note):
    M[(file, sym)] = (status, mod, rust, test, note)


# ---------------- display-names.ts ----------------
dn = "display_names"
add(D, "CITY_STATE_LABEL", R, dn, ["city_state_label"], "display::labels_match_running_web", "dane: display-names-params.json etykieta_miasto_panstwo")
add(D, "CITY_STATE_SEPARATOR", R, dn, ["city_state_separator"], "display::labels_match_running_web", "dane: display-names-params.json separator")
add(D, "EntityDisplayCtx", R, dn, ["EntityDisplayCtx"], "display::format_entity_display_name_matches_web", "baseName?/isCityState? -> Option")
add(D, "formatEntityDisplayName", R, dn, ["format_entity_display_name"], "display::format_entity_display_name_matches_web", "trim = js_trim (BOM tak, U+0085 nie)")
add(D, "stripCityStateSuffix", R, dn, ["strip_city_state_suffix"], "display::strip_city_state_suffix_matches_web", "-")
add(D, "isClusterCityStateSlot", R, dn, ["is_cluster_city_state_slot", "ClusterSlot"], "display::is_cluster_city_state_slot_matches_web", "slot: 3 pola Option<bool> (27 kombinacji w wektorze)")
add(D, "OwnerCityStateOpts", R, dn, ["OwnerCityStateOpts", "OwnerCityRef"], "display::is_owner_cluster_city_state_matches_web", "Set -> HashSet<i64>, cities -> &[OwnerCityRef]")
add(D, "isOwnerClusterCityState", R, dn, ["is_owner_cluster_city_state"], "display::is_owner_cluster_city_state_matches_web", "ownerId jako i64")
add(D, "clearCityStateFlagOnCapture", R, dn, ["clear_city_state_flag_on_capture"], "display::clear_city_state_flag_on_capture_matches_web", "city.startCityState -> &mut Option<bool>")
add(D, "ForceCultureIconOpts", R, dn, ["ForceCultureIconOpts"], "display::should_force_culture_icon_matches_web", "extends OwnerCityStateOpts -> pole base")
add(D, "shouldForceCultureIconForOwner", R, dn, ["should_force_culture_icon_for_owner"], "display::should_force_culture_icon_matches_web", "-")
add(D, "CityMapLabelOpts", R, dn, ["CityMapLabelOpts", "CityMapLabelCity"], "display::format_city_map_label_matches_web", "city: podzbior pol (name, ownerId, startCityState)")
add(D, "formatCityMapLabel", R, dn, ["format_city_map_label"], "display::format_city_map_label_matches_web", "-")
add(D, "formatOwnerDiploLabel", R, dn, ["format_owner_diplo_label"], "display::format_owner_diplo_label_matches_web", "-")
add(D, "isTechnicalOwnerLabel", R, dn, ["is_technical_owner_label"], "display::is_technical_owner_label_matches_web", "regexy /^X \\d+$/i -> display-names-params.json wzorce_techniczne (ASCII)")
add(D, "ResolveOwnerBaseNameInput", R, dn, ["ResolveOwnerBaseNameInput"], "display::resolve_owner_base_name_matches_web", "-")
add(D, "cleanDisplayPart", R, dn, [], "display::resolve_owner_base_name_matches_web", "prywatna; fn clean_display_part (niepubliczna) w state.rs; Some(\"\") jest falsy, nie nullish")
add(D, "foreignCapitalMapName", R, dn, ["foreign_capital_map_name"], "display::foreign_capital_map_name_matches_web", "-")
add(D, "resolveOwnerBaseName", R, dn, ["resolve_owner_base_name"], "display::resolve_owner_base_name_matches_web", "ownerId w webie nieuzywane")
add(D, "sanitizeOwnerDisplayBase", R, dn, ["sanitize_owner_display_base"], "display::sanitize_owner_display_base_matches_web", "-")

# ---------------- empire-city-defaults.ts ----------------
em = "empire_city_defaults"
add(E, "podzialPracyEqual", R, em, ["podzial_pracy_equal"], "empire::podzial_pracy_functions_match_web", "-")
add(E, "normalizePodzialPracy", R, em, [], "empire::podzial_pracy_functions_match_web", "prywatna; fn normalize_podzial_pracy (niepubliczna)")
add(E, "resolveCityPodzialPracy", R, em, ["resolve_city_podzial_pracy"], "empire::podzial_pracy_functions_match_web", "Pick<City,...> -> &City")
add(E, "PodzialPracyLocalChange", R, em, ["PodzialPracyLocalChange"], "empire::podzial_pracy_functions_match_web", "undefined -> None")
add(E, "applyPodzialPracyLocalChange", R, em, ["apply_podzial_pracy_local_change"], "empire::podzial_pracy_functions_match_web", "-")
add(E, "migratePodzialPracyOnLoad", R, em, ["migrate_podzial_pracy_on_load"], "empire::podzial_pracy_migration_matches_web", "Map<number,V> -> OwnerMap (kolejnosc wstawiania); delete city.podzialPracy -> None")
add(E, "freshOwnerDefaultPodzialPracy", R, em, ["fresh_owner_default_podzial_pracy"], "empire::podzial_pracy_functions_match_web", "-")
add(E, "resolveCityOkolicaFocus", R, em, ["resolve_city_okolica_focus"], "empire::okolica_focus_functions_match_web", "-")
add(E, "broadcastOkolicaFocusToOwnerCities", R, em, ["broadcast_okolica_focus_to_owner_cities"], "empire::okolica_focus_functions_match_web", "pin (override) pomijany")
add(E, "migrateOkolicaFocusOnLoad", R, em, ["migrate_okolica_focus_on_load"], "empire::okolica_focus_functions_match_web", "-")
add(E, "freshOwnerDefaultOkolicaFocus", R, em, ["fresh_owner_default_okolica_focus"], "empire::okolica_focus_functions_match_web", "-")
add(E, "CityBudowaProfil", R, em, ["CityBudowaProfil"], "empire::budowa_profil_functions_match_web", "-")
add(E, "budowaProfilEqual", R, em, ["budowa_profil_equal"], "empire::budowa_profil_functions_match_web", "-")
add(E, "resolveCityBudowaProfil", R, em, ["resolve_city_budowa_profil"], "empire::budowa_profil_functions_match_web", "-")
add(E, "broadcastBudowaProfilToOwnerCities", R, em, ["broadcast_budowa_profil_to_owner_cities"], "empire::budowa_profil_functions_match_web", "pin (override) pomijany")
add(E, "migrateBudowaProfilOnLoad", R, em, ["migrate_budowa_profil_on_load"], "empire::budowa_profil_functions_match_web", "-")
add(E, "freshOwnerDefaultBudowaProfil", R, em, ["fresh_owner_default_budowa_profil"], "empire::budowa_profil_functions_match_web", "-")
add(E, "AI_DEFAULT_BUDOWA_TRYB", R, em, ["ai_default_budowa_tryb"], "empire::budowa_profil_functions_match_web", "dane: cities-params.json budowa.domyslny_tryb_ai")
add(E, "freshOwnerDefaultBudowaProfilForOwner", R, em, ["fresh_owner_default_budowa_profil_for_owner"], "empire::budowa_profil_functions_match_web", "isBarbarianOwner jest PARAMETREM weba (domkniecie podawane przez wolajacego)")
add(E, "upgradeBudowaProfilAutoDefaultsOnLoad", R, em, ["upgrade_budowa_profil_auto_defaults_on_load"], "empire::upgrade_budowa_profil_auto_defaults_matches_web", "isBarbarianOwner = parametr weba; gracz (owner 0) pomijany; zwraca liste w kolejnosci wstawiania")
add(E, "resolveCityPoziomRacji", R, em, ["resolve_city_poziom_racji"], "empire::poziom_racji_functions_match_web", "PoziomRacji = number -> f64")
add(E, "broadcastPoziomRacjiToOwnerCities", R, em, ["broadcast_poziom_racji_to_owner_cities"], "empire::poziom_racji_functions_match_web", "-")
add(E, "broadcastAutoWyzywienieToOwnerCities", R, em, ["broadcast_auto_wyzywienie_to_owner_cities"], "empire::poziom_racji_functions_match_web", "-")
add(E, "migratePoziomRacjiOnLoad", R, em, ["migrate_poziom_racji_on_load"], "empire::poziom_racji_functions_match_web", "-")
add(E, "freshOwnerDefaultPoziomRacji", R, em, ["fresh_owner_default_poziom_racji"], "empire::poziom_racji_functions_match_web", "-")

# ---------------- cities.ts ----------------
ci = "cities"
add(C, "CityPodzialHandlu", R, ci, ["CityPodzialHandlu", "HandelKey"], "percent::adjust_handel_split_matches_web", "keyof -> enum HandelKey")
add(C, "CityPodzialPracy", R, ci, ["CityPodzialPracy"], "percent::constants_match_running_web", "-")
add(C, "OkolicaFocus", R, ci, ["OkolicaFocus"], "empire::okolica_focus_functions_match_web", "unia napisow -> enum + web_value/from_web")
add(C, "OkolicaTryb", R, ci, ["OkolicaTryb"], "percent::constants_match_running_web", "-")
add(C, "DEFAULT_OKOLICA_FOCUS", R, ci, ["default_okolica_focus"], "percent::constants_match_running_web", "dane: cities-params.json okolica")
add(C, "DEFAULT_OKOLICA_TRYB", R, ci, ["default_okolica_tryb"], "percent::constants_match_running_web", "dane: cities-params.json okolica")
add(C, "BudowaFocus", R, ci, ["BudowaFocus"], "percent::budowa_priority_helpers_match_web", "-")
add(C, "BudowaTryb", R, ci, ["BudowaTryb"], "cities_ensure::ensure_city_save_defaults_matches_web", "dodatkowy wariant Auto = surowa wartosc legacy ('auto') czytana przez ensureCitySaveDefaults")
add(C, "BudowaListaSzablon", R, ci, ["BudowaListaSzablon"], "lists::id_generator_and_loader_match_web_sequence", "budynki: Vec<serde_json::Value> (zawartosc z zapisu nie jest sprawdzana elementarnie)")
add(C, "BudowaListaBiblioteka", R, ci, [], "lists::id_generator_and_loader_match_web_sequence", "alias tablicy -> Vec<BudowaListaSzablon>")
add(C, "EMPTY_BUDOWA_LISTA_BIBLIOTEKA", R, ci, ["empty_budowa_lista_biblioteka"], "percent::constants_match_running_web", "-")
add(C, "BudowaListaSlot", R, ci, [], "lists::id_generator_and_loader_match_web_sequence", "unia 'A'|'B'|'C' -> dane cities-params.json budowa.lista_slot_legacy")
add(C, "BudowaListaSzablonyLegacy", ND, ci, [], "lists::id_generator_and_loader_match_web_sequence", "typ Record<slot,string[]>; legacy format czytany z serde_json::Value w load_budowa_lista_biblioteka")
add(C, "_budowaListaSzablonSeq", R, ci, ["BudowaListaIdGen"], "lists::id_generator_and_loader_match_web_sequence", "zmienna modulu -> jawny stan BudowaListaIdGen.seq")
add(C, "newBudowaListaSzablonId", RI, ci, ["BudowaListaIdGen"], "lists::id_generator_and_loader_match_web_sequence", "WSTRZYKNIETE: Date.now() jako parametr now_ms (metoda new_id)")
add(C, "defaultBudowaListaNazwa", R, ci, ["default_budowa_lista_nazwa"], "lists::default_nazwa_matches_web", "trim/toLowerCase: js_trim + to_lowercase")
add(C, "isLegacyBudowaListaSzablony", R, ci, [], "lists::id_generator_and_loader_match_web_sequence", "prywatna; zaszyta w load_budowa_lista_biblioteka")
add(C, "isBudowaListaSzablonArray", R, ci, [], "lists::id_generator_and_loader_match_web_sequence", "prywatna; fn is_budowa_lista_szablon_array (niepubliczna)")
add(C, "loadBudowaListaBiblioteka", RI, ci, ["load_budowa_lista_biblioteka"], "lists::id_generator_and_loader_match_web_sequence", "WSTRZYKNIETE: Date.now() (domkniecie now), licznik id (BudowaListaIdGen)")
add(C, "dedupeBudowaLista", R, ci, ["dedupe_budowa_lista"], "lists::dedupe_matches_web", "-")
add(C, "isAutoBudowaTryb", R, ci, ["is_auto_budowa_tryb"], "percent::budowa_priority_helpers_match_web", "-")
add(C, "DEFAULT_BUDOWA_FOCUS", R, ci, ["default_budowa_focus"], "percent::constants_match_running_web", "-")
add(C, "DEFAULT_BUDOWA_TRYB", R, ci, ["default_budowa_tryb"], "percent::constants_match_running_web", "-")
add(C, "UlepszeniaFocus", R, ci, ["UlepszeniaFocus"], "percent::resolve_effective_ulepszenia_matches_web", "-")
add(C, "UlepszeniaTryb", R, ci, ["UlepszeniaTryb"], "percent::resolve_effective_ulepszenia_matches_web", "-")
add(C, "UlepszeniaPracaPercent", ND, ci, [], "-", "alias number -> f64")
add(C, "DEFAULT_ULEPSZENIA_FOCUS", R, ci, ["default_ulepszenia_focus"], "percent::constants_match_running_web", "-")
add(C, "DEFAULT_ULEPSZENIA_TRYB", R, ci, ["default_ulepszenia_tryb"], "percent::constants_match_running_web", "-")
add(C, "DEFAULT_ULEPSZENIA_ONLY_WORKED", R, ci, ["default_ulepszenia_only_worked"], "percent::constants_match_running_web", "-")
add(C, "DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS", R, ci, ["default_ulepszenia_wolno_wycinac_las"], "percent::constants_match_running_web", "-")
add(C, "DEFAULT_ULEPSZENIA_PRACA_PERCENT", R, ci, ["default_ulepszenia_praca_percent"], "percent::constants_match_running_web", "-")
add(C, "AI_MAJOR_ULEPSZENIA_PRACA_PERCENT", R, ci, ["ai_major_ulepszenia_praca_percent"], "percent::constants_match_running_web", "-")
add(C, "MAX_ULEPSZENIA_PRACA_AUTO_PERCENT", R, ci, ["max_ulepszenia_praca_auto_percent"], "percent::constants_match_running_web", "-")
add(C, "clampUlepszeniaPracaPercent", R, ci, ["clamp_ulepszenia_praca_percent"], "percent::clamp_functions_match_web", "number|undefined|null -> Option<f64> (None = nie-liczba)")
add(C, "migrateUlepszeniaPerTurnToPercent", R, ci, ["migrate_ulepszenia_per_turn_to_percent"], "percent::snap_and_migrate_match_web", "tabela migracja_per_turn; wartosc spoza tabeli -> ostatni wiersz (galaz `return 100`)")
add(C, "resolveUlepszeniaPracaPercentFromRaw", R, ci, ["resolve_ulepszenia_praca_percent_from_raw"], "percent::resolve_praca_percent_from_raw_matches_web", "unknown -> Option<f64> (tylko typeof number ma znaczenie)")
add(C, "UlepszeniaEmpirePolicy", R, ci, ["UlepszeniaEmpirePolicy"], "percent::ulepszenia_policy_and_caps_match_web", "wolnoWycinacLas: Option<bool> (kod czyta `??`)")
add(C, "freshUlepszeniaEmpirePolicy", R, ci, ["fresh_ulepszenia_empire_policy"], "percent::ulepszenia_policy_and_caps_match_web", "-")
add(C, "freshUlepszeniaEmpirePolicyForOwner", R, ci, ["fresh_ulepszenia_empire_policy_for_owner"], "percent::ulepszenia_policy_and_caps_match_web", "isAiImprovementOwner jest PARAMETREM weba")
add(C, "computeAiImprovementBudgetCap", R, ci, ["compute_ai_improvement_budget_cap"], "percent::ulepszenia_policy_and_caps_match_web", "-")
add(C, "computeAiImprovementBudgetCapForOwner", R, ci, ["compute_ai_improvement_budget_cap_for_owner"], "percent::ulepszenia_policy_and_caps_match_web", "-")
add(C, "EffectiveUlepszeniaSettings", R, ci, ["EffectiveUlepszeniaSettings"], "percent::resolve_effective_ulepszenia_matches_web", "pole override -> is_override (slowo zarezerwowane)")
add(C, "resolveEffectiveUlepszenia", R, ci, ["resolve_effective_ulepszenia"], "percent::resolve_effective_ulepszenia_matches_web", "-")
add(C, "DEFAULT_BUDOWA_PRIORYTET_TYPOW", R, ci, ["default_budowa_priorytet_typow"], "percent::constants_match_running_web", "-")
add(C, "BUDOWA_TYP_FOCUS", R, ci, ["budowa_typ_focus"], "percent::constants_match_running_web", "-")
add(C, "isBudowaTypFocus", R, ci, ["is_budowa_typ_focus"], "percent::budowa_priority_helpers_match_web", "-")
add(C, "sanitizeBudowaPriorytetTypow", R, ci, ["sanitize_budowa_priorytet_typow"], "percent::budowa_priority_helpers_match_web", "-")
add(C, "DEFAULT_PODZIAL_HANDLU", R, ci, ["default_podzial_handlu"], "percent::constants_match_running_web", "-")
add(C, "DEFAULT_PODZIAL_PRACY", R, ci, ["default_podzial_pracy"], "percent::constants_match_running_web", "-")
add(C, "MIN_PODZIAL_PRACY_BUDYNKI_PERCENT", R, ci, ["min_podzial_pracy_budynki_percent"], "percent::constants_match_running_web", "-")
add(C, "MAX_PODZIAL_PRACY_BUDYNKI_PERCENT", R, ci, ["max_podzial_pracy_budynki_percent"], "percent::constants_match_running_web", "-")
add(C, "AI_FIXED_PROCENT_BUDYNKI", R, ci, ["ai_fixed_procent_budynki"], "percent::constants_match_running_web", "-")
add(C, "MAX_PROCENT_PULI_IMPERIUM", R, ci, ["max_procent_puli_imperium"], "percent::constants_match_running_web", "wyliczane: calosc - min budynkow")
add(C, "MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA", R, ci, ["min_procent_puli_imperium_zasada3_nadwyzka"], "percent::constants_match_running_web", "-")
add(C, "PODZIAL_PRACY_PULA_LBL", R, ci, ["podzial_pracy_pula_lbl"], "percent::constants_match_running_web", "dane: cities-params.json etykiety_podzialu_pracy")
add(C, "PODZIAL_PRACY_PULA_LBL_PELNA", R, ci, ["podzial_pracy_pula_lbl_pelna"], "percent::constants_match_running_web", "-")
add(C, "PODZIAL_PRACY_PULA_TIP", R, ci, ["podzial_pracy_pula_tip"], "percent::constants_match_running_web", "-")
add(C, "MIN_PROCENT_PULI_IMPERIUM", R, ci, ["min_procent_puli_imperium"], "percent::constants_match_running_web", "wyliczane: calosc - max budynkow")
add(C, "clampPodzialPracyBudynkiPercent", R, ci, ["clamp_podzial_pracy_budynki_percent"], "percent::clamp_functions_match_web", "-")
add(C, "procentPuliImperiumZBudynkow", R, ci, ["procent_puli_imperium_z_budynkow"], "percent::clamp_functions_match_web", "-")
add(C, "podzialPracyZProcentuPuli", R, ci, ["podzial_pracy_z_procentu_puli"], "percent::podzial_pracy_z_procentu_puli_matches_web", "-")
add(C, "DEFAULT_PROCENT_ROZWOJ", R, ci, ["default_procent_rozwoj"], "percent::constants_match_running_web", "-")
add(C, "DEFAULT_PROCENT_ROZWOJ_WYZYWIENIE", R, ci, ["default_procent_rozwoj_wyzywienie", "default_poziom_racji", "wyzywienie_max"], "percent::constants_match_running_web", "Math.round(DEFAULT_POZIOM_RACJI / WYZYWIENIE_MAX * 100); oba skladniki z population-growth-v85.ts jako WEJSCIE z danych (cities-params.json wejscia_z_innych_modulow_weba)")
add(C, "HANDEL_PCT_STEP", R, ci, ["handel_pct_step"], "percent::constants_match_running_web", "-")
add(C, "MAX_PROCENT_NAUKA", R, ci, ["max_procent_nauki"], "percent::constants_match_running_web", "-")
add(C, "AI_FIXED_PROCENT_NAUKA", R, ci, ["ai_fixed_procent_nauki"], "percent::constants_match_running_web", "-")
add(C, "snapHandelPct", R, ci, ["snap_handel_pct"], "percent::snap_and_migrate_match_web", "-")
add(C, "normalizePodzialHandlu", R, ci, ["normalize_podzial_handlu"], "percent::normalize_podzial_handlu_matches_web", "-")
add(C, "adjustHandelSplit", R, ci, ["adjust_handel_split"], "percent::adjust_handel_split_matches_web", "-")
add(C, "freshCityPodzial", R, ci, [], "found::found_city_at_matches_web", "prywatna; fn fresh_city_podzial_pracy (niepubliczna)")
add(C, "ensureCityPodzialDefaults", R, ci, ["ensure_city_podzial_defaults"], "ensure::ensure_city_podzial_defaults_matches_web", "-")
add(C, "ensureCitySaveDefaults", RI, ci, ["ensure_city_save_defaults", "SaveDefaultsDeps"], "ensure::ensure_city_save_defaults_matches_web", "WSTRZYKNIETE: readCityFoodBuffer (economy-upkeep.ts), ensureCityRationDefaults (population-growth-v85.ts); freshWealthState (wealth.ts) = wejscie z danych; testy sprawdzaja liczbe/kolejnosc/argumenty wywolan")
add(C, "City", R, ci, ["City", "FoodBuffer", "WealthState"], "ensure::ensure_city_save_defaults_matches_web", "podzbior 38 z 61 pol interfejsu (wszystkie pola czytane lub zapisywane przez logike trzech plikow) + surowe pole legacy ulepszeniaPerTurn; pozostale 23 pola = dane bez logiki w tych plikach (grep: 0 uzyc, dokument §4)")
add(C, "MIN_CITY_DISTANCE", DR, ci, ["min_city_distance"], "tables::min_city_distance_comes_from_miasto_params", "data/miasto-params.json min_dystans_miast; zapasowe `?? 5` nieosiagalne (typ danych wymusza pole)")
add(C, "MIN_CITY_DISTANCE_START_CITY_STATE", R, ci, ["min_city_distance_start_city_state"], "percent::constants_match_running_web", "-")
add(C, "countsTowardCityFoundingLimit", R, ci, ["counts_toward_city_founding_limit"], "found::city_name_and_predicates_match_web", "Pick<City,'foundedByOwner'> -> Option<bool>")
add(C, "wasIndependentCityStateBeforeCapture", R, ci, ["was_independent_city_state_before_capture"], "found::city_name_and_predicates_match_web", "Pick<City,'startCityState'> -> Option<bool>")
add(C, "canFoundCity", R, ci, ["can_found_city", "CanFoundCityOpts", "GameConfig", "CanFoundCityResult"], "found::can_found_city_matches_web", "hexDistance lokalnie f64; isWaterTerrain = P6.4 (pathfinding::ruch_jednostek); klucz heksu `q,r` tylko dla calkowitych (ZALOZENIE)")
add(C, "foundCity", R, ci, ["found_city", "Settler"], "found::found_city_matches_web", "RuntimeUnit -> Settler{ownerId,q,r}; freshWealthState = wejscie z danych")
add(C, "foundCityAt", R, ci, ["found_city_at"], "found::found_city_at_matches_web", "-")
add(C, "CITY_NAMES", R, ci, [], "found::city_name_and_predicates_match_web", "prywatna; dane: cities-params.json nazwy_miast.lista")
add(C, "cityName", R, ci, ["city_name"], "found::city_name_and_predicates_match_web", "@deprecated; undefined (indeks niecalkowity w zakresie) -> None")
add(C, "FoundFromVillageOpts", R, ci, [], "found::found_city_from_village_matches_web", "jedyne pole withinTerritory = parametr within_territory")
add(C, "FoundFromVillageResult", R, ci, ["FoundFromVillageResult"], "found::found_city_from_village_matches_web", "{ok:true}&City | {ok:false,reason} -> enum")
add(C, "foundCityFromVillage", R, ci, ["found_city_from_village"], "found::found_city_from_village_matches_web", "-")


def main():
    problems = []
    seen = set()
    rows = []
    for fname in (C, E, D):
        decl = scan(fname)
        for sym, line in decl.items():
            key = (fname, sym)
            if key not in M:
                problems.append(f"brak wiersza dla {fname}:{line} {sym}")
                continue
            seen.add(key)
            status, mod, rust, test, note = M[key]
            if status not in STATUSES:
                problems.append(f"zly status {key}")
            rl = []
            for r in rust:
                rl.append(f"rust-port/engine/src/domain/state.rs:{rust_line(mod, r)} ({r})")
            if test != "-":
                alias, name = test.split("::")
                tf = T[alias.replace("cities_", "")] if alias.startswith("cities_") else T[alias]
                has_test(tf, name)
            rows.append((fname, line, sym, status, "; ".join(rl) if rl else "-", test if test != "-" else "-", note))
    for key in M:
        if key not in seen:
            problems.append(f"wiersz wskazuje symbol spoza zrodla: {key}")
    if problems:
        print("\n".join(problems), file=sys.stderr)
        sys.exit(2)
    print("plik_ts\tlinia_ts\tsymbol\tstatus\todpowiednik_rust\ttest\tuwaga")
    for r in rows:
        print("\t".join(str(x) for x in r))
    counts = {}
    for r in rows:
        counts[r[3]] = counts.get(r[3], 0) + 1
    print(f"# wierszy={len(rows)} " + " ".join(f"{k}={v}" for k, v in sorted(counts.items())), file=sys.stderr)


main()
