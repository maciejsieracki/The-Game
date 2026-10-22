#!/usr/bin/env python3
"""Tabela statusow per eksport dla P6.1E.

Parsuje eksporty z plikow weba (pin edb8fb56): civ-names.ts, civ-roster.ts, civ-matrix.ts,
civ-matrix-semantic.ts, civ-ai-data.ts, braz-access.ts (deklaracje i bloki `export {...}`
oraz `export ... from`) i WYMAGA statusu dla KAZDEGO (brak = blad; status dla nieistniejacego
symbolu = blad). Wynik: TSV (symbols-p61e-r1.tsv) i, opcjonalnie, tabela markdown wstawiona
miedzy znaczniki SYMBOLS:BEGIN/END w dokumencie.

Uzycie: python3 -I gen-p61e-symbol-status.py <WEB_ROOT> <OUT_TSV> <DOC_MD|->
"""
import os
import re
import sys

FILES = ["civ-names", "civ-roster", "civ-matrix", "civ-matrix-semantic", "civ-ai-data", "braz-access"]
P, D, N = "PORTOWANY", "DANE-JUZ-W-RUST", "NIE-DOTYCZY"

CN = "domain::civ_names::"
RO = "domain::civ_names::roster::"
CM = "domain::civ_matrix::"
SE = "domain::civ_matrix::semantic::"
AI = "domain::civ_matrix::ai_data::"
JS = "domain::civ_matrix::js_compat::"
T1 = "tests/p6_1e_civ_matrix.rs"
T2 = "tests/p6_1e_civ_names.rs"
T3 = "tests/p6_1e_js_compat.rs"
T4 = "tests/p6_1e_tables.rs"

STATUS = {
    # ---- civ-names.ts
    ("civ-names", "MIASTA_CYWILIZACJI_LEN"): (P, f"{CN}miasta_cywilizacji_len(); wartosc z civ-matrix-params.json; wektor names.constants.miastaLen ({T2}::constants_match_web)"),
    ("civ-names", "CityNamesPoolEntry"): (D, "data::civilizations::CityPool; city-names-pools.json byte-identyczny z pinem (FNV w wektorze dataFnv.cityNamesPools; P6.1D)"),
    ("civ-names", "CityNamesPools"): (D, f"alias {CN}CityNamesPoolsData = data::civilizations::CityNamesPoolsFile; wektor dataFnv.cityNamesPools"),
    ("civ-names", "findCivByIkonaId"): (P, f"{CN}find_civ_by_ikona_id; wektor names.find (3 zestawy x 24 id) {T2}::find_klastra_display_validate_match_web"),
    ("civ-names", "getNazwyKlastra"): (P, f"{CN}get_nazwy_klastra; wektor names.klastra (galezie nazwyMiast / nazwyKlastra / brak)"),
    ("civ-names", "playerStartCityName"): (P, f"{CN}player_start_city_name; wektor names.start (3 zestawy civs x 4 pule x 4 warianty used x 24 id) {T2}::start_foreign_rival_state_names_match_web"),
    ("civ-names", "clusterRivalCityName"): (P, f"{CN}cluster_rival_city_name; wektor names.rival + rivalNoUsed (10 numerow rywala)"),
    ("civ-names", "foreignCapitalCityName"): (P, f"{CN}foreign_capital_city_name; wektor names.foreign"),
    ("civ-names", "stateCityName"): (P, f"{CN}state_city_name; wektor names.state (8 indeksow)"),
    ("civ-names", "civDisplayName"): (P, f"{CN}civ_display_name; wektor names.display"),
    ("civ-names", "validateNazwyKlastra"): (P, f"{CN}validate_nazwy_klastra; wektor names.validateNazwy (+ przypadek inline z duplikatem i brakiem ikonaId)"),
    ("civ-names", "getMiastaCywilizacji"): (P, f"{CN}get_miasta_cywilizacji; wektor names.miasta.cywilizacji"),
    ("civ-names", "getMiastaPanstwa"): (P, f"{CN}get_miasta_panstwa; wektor names.miasta.panstwa"),
    ("civ-names", "pickAiFoundedCityName"): (P, f"{CN}pick_ai_founded_city_name; wektor names.aiFounded"),
    ("civ-names", "validateCityNamesPools"): (P, f"{CN}validate_city_names_pools (nakladka na city_names::validate_city_names_pools); wektor names.validatePools (9 kombinacji)"),
    ("civ-names", "NAZWY_KLASTRA_LEN"): (P, f"re-eksport: {CN}nazwy_klastra_len = city_names::nazwy_klastra_len (P6.1D); wektor names.constants.klastraLen"),
    ("civ-names", "CITY_NAMES_POOL_COMMON_LEN"): (P, f"re-eksport: {CN}city_names_pool_common_len (P6.1D); wektor names.constants.commonLen"),
    ("civ-names", "CITY_NAMES_POOL_REGULAR_LEN"): (P, f"re-eksport: {CN}city_names_pool_regular_len (P6.1D); wektor names.constants.regularLen"),
    ("civ-names", "nazwaKlastraAt"): (P, f"re-eksport: {CN}nazwa_klastra_at (P6.1D, wektor 24 przypadki) + wektor names.reexports.klastraAt"),
    ("civ-names", "pickNextCityName"): (P, f"re-eksport: {CN}pick_next_city_name (P6.1D, 160 przypadkow) + wektor names.reexports.next"),
    ("civ-names", "pickNextCityNameFromNames"): (P, f"re-eksport: {CN}pick_next_city_name_from_names (P6.1D, 50 kolejek) + wektor names.reexports.fromNames"),
    ("civ-names", "pickNextRegularCityName"): (P, f"re-eksport: {CN}pick_next_regular_city_name (P6.1D) + wektor names.reexports.next"),
    ("civ-names", "suggestPlayerFoundCityName"): (P, f"re-eksport: {CN}suggest_player_found_city_name (P6.1D) + wektor names.reexports.suggest"),
    ("civ-names", "pickAiFoundCityName"): (P, f"re-eksport: {CN}pick_ai_found_city_name (P6.1D) + wektor names.reexports.ai"),
    ("civ-names", "collectUsedCityNamesFromCities"): (P, f"re-eksport: {CN}collect_used_city_names_from_cities (P6.1D) + wektor names.reexports.used"),
    ("civ-names", "cityNameWithSuffix"): (P, f"re-eksport: {CN}city_name_with_suffix (P6.1D, 48 przypadkow) + wektor names.reexports.suffix"),
    # ---- civ-roster.ts
    ("civ-roster", "makeRng"): (P, f"{RO}make_rng(seed: i64) -> domain::rng::Mulberry32 (bit-w-bit, P6.1) + ToUint32 ({RO}to_uint32); wektor roster.makeRng (18 ziaren x 6 krokow, takze ujemne i > 2^32) {T2}::make_rng_streams_match_web_for_every_seed"),
    ("civ-roster", "civIdsFromRoster"): (P, f"{RO}civ_ids_from_roster; wektor roster.civIdsFromRoster (syntetyczny + dane civs.json) {T2}::civ_ids_from_roster_matches_web"),
    ("civ-roster", "AssignAiCivInput"): (P, f"{RO}AssignAiCivInput (struct wejsciowy) uzywany w {T2}::assign_ai_civ_types_matches_web; `seed` = i64 (liczba calkowita, ToUint32 jak `>>> 0`)"),
    ("civ-roster", "pickActiveCivPool"): (P, f"{RO}pick_active_civ_pool; wektor roster.pool (1200 przypadkow: 6 list ID x gracze x limity x ziarna x preferowane) {T2}::pick_active_civ_pool_matches_web"),
    ("civ-roster", "rotatePreferredForRepairSeed"): (P, f"{RO}rotate_preferred_for_repair_seed; wektor roster.rotate (108 przypadkow) {T2}::rotate_preferred_matches_web"),
    ("civ-roster", "assignAiCivTypes"): (P, f"{RO}assign_ai_civ_types; wektor roster.assign (720 przypadkow, w tym duplikaty ownerow, ujemne ID, puste listy) {T2}::assign_ai_civ_types_matches_web"),
    ("civ-roster", "civIdsAvailableAtGameEpoch"): (P, "re-eksport z civ-entry-epoch: domain::unit_epoch::civ_ids_available_at_game_epoch (P6.1, tests/p6_1_civ_entry_epoch.rs); `pub use` w civ_names::roster"),
    # ---- civ-matrix.ts
    ("civ-matrix", "CivMatrixFormula"): (N, f"typ (union literalow) = enum {CM}CivMatrixFormula z parse(); nieznana formula => mul_proc (wektor scenariusza `partial`: weird_formula)"),
    ("civ-matrix", "CivMatrixDifficulty"): (N, f"typ (union literalow) = enum {CM}CivMatrixDifficulty (Default = Normal, jak argument domyslny weba)"),
    ("civ-matrix", "CivMatrixParamDef"): (D, "data::civilizations::ParamDefsValue; civ-matrix.json byte-identyczny z pinem (FNV dataFnv.civMatrix == include_str!), wektor paramDef"),
    ("civ-matrix", "CivMatrixRow"): (D, "data::civilizations::CywilizacjeItem2; wektor rows + every_matrix_cell_parses_exactly_like_js (kazda komorka bit-w-bit)"),
    ("civ-matrix", "CivMatrixData"): (D, f"data::civilizations::CivMatrixFile (+ {CM}CivMatrixData z kolejnoscia paramDefs); {T1}::data_files_are_byte_identical_to_web_pin, param_order_and_rows_match_web_for_every_scenario"),
    ("civ-matrix", "loadCivMatrix"): (P, f"{CM}load_civ_matrix() -> &'static CivMatrixData; {T1}::param_order_and_rows_match_web_for_every_scenario (wbudowana macierz == scenariusz base)"),
    ("civ-matrix", "civMatrixParam"): (P, f"{CM}civ_matrix_param; wektor param (3 scenariusze x 51 kluczy x 95-96 parametrow, porownanie bit-w-bit) {T1}::civ_matrix_param_matches_web; zastepuje prywatny matrix_param z P6.1D (delegacja w civ_bonuses.rs)"),
    ("civ-matrix", "civMatrixParamAtDifficulty"): (P, f"{CM}civ_matrix_param_at_difficulty; krok trudnosci i ograniczenie z civ-matrix-params.json; wektor atDifficulty (3 trudnosci x 3 scenariusze) {T1}::civ_matrix_param_at_difficulty_matches_web"),
    ("civ-matrix", "civMatrixParamsAtDifficulty"): (P, f"{CM}civ_matrix_params_at_difficulty (Vec<(id, wartosc)> w kolejnosci paramDefs); wektor paramsAtDifficulty (klucze + wartosci)"),
    ("civ-matrix", "civMatrixParamDef"): (P, f"{CM}civ_matrix_param_def; wektor paramDef {T1}::civ_matrix_param_def_matches_web"),
    ("civ-matrix", "applyCivMatrixParam"): (P, f"{CM}apply_civ_matrix_param; 5 formul + domyslna z tabeli; wektor apply (7 baz x 5 kluczy x 95-96 parametrow x 3 scenariusze, w tym nieznana formula)"),
    ("civ-matrix", "civMatrixProcSum"): (P, f"{CM}civ_matrix_proc_sum; wektor procSum (7 grup, w tym puste, duplikaty, nieznany parametr)"),
    ("civ-matrix", "civMatrixApplyProc"): (P, f"{CM}civ_matrix_apply_proc; wektor applyProc"),
    # ---- civ-matrix-semantic.ts
    ("civ-matrix-semantic", "CIV_MATRIX_SEMANTIC_VERSION"): (P, "civ-matrix-semantic.json: `wersja`; wektor semantic.snapshotHeader.version"),
    ("civ-matrix-semantic", "CIV_MATRIX_SEMANTIC_DIFFICULTY"): (P, "civ-matrix-semantic.json: `trudnosc`; wektor semantic.snapshotHeader.difficulty"),
    ("civ-matrix-semantic", "CivMatrixSemanticPolarity"): (N, f"typ = enum {SE}Polarity; napisy z tabeli `polaryzacja` (wektory polarity per parametr)"),
    ("civ-matrix-semantic", "CivMatrixConsumerStatus"): (N, f"typ = enum {SE}ConsumerStatus (name/parse); wektor allStatuses (8 statusow x 94 parametry)"),
    ("civ-matrix-semantic", "CivMatrixSemanticLabel"): (N, f"typ = enum {SE}DirectionLabel; napisy z tabeli `etykiety_kierunku`"),
    ("civ-matrix-semantic", "CivMatrixNeutralBand"): (N, f"typ danych = struct {SE}NeutralBand (bez logiki)"),
    ("civ-matrix-semantic", "CivMatrixSemanticCell"): (N, f"typ danych = struct {SE}SemanticCell; wszystkie pola porownywane z wektorami komorek"),
    ("civ-matrix-semantic", "CivMatrixSemanticProfile"): (N, f"typ danych = struct {SE}SemanticProfile"),
    ("civ-matrix-semantic", "CivMatrixSemanticSnapshot"): (N, f"typ danych = struct {SE}SemanticSnapshot"),
    ("civ-matrix-semantic", "civMatrixSemanticParameterIds"): (P, f"{SE}civ_matrix_semantic_parameter_ids (kolejnosc pliku); {T1}::consumer_status_polarity_band_baseline_match_web_per_parameter"),
    ("civ-matrix-semantic", "civMatrixSemanticCivilizations"): (P, f"{SE}civ_matrix_semantic_civilizations; ta sama funkcja testowa (lista civs)"),
    ("civ-matrix-semantic", "civMatrixConsumerStatus"): (P, f"{SE}civ_matrix_consumer_status; zbiory z civ-matrix-semantic.json (porownane regexem z TS w verify-p61e); wektor semantic.status (93 x 3 scenariusze)"),
    ("civ-matrix-semantic", "civMatrixConsumerEvidence"): (P, f"{SE}civ_matrix_consumer_evidence; 38 dowodow w tabeli == PROVEN_CONSUMERS (regex w verify-p61e); wektor semantic.evidence"),
    ("civ-matrix-semantic", "civMatrixSemanticPolarity"): (P, f"{SE}civ_matrix_semantic_polarity; wektor semantic.polarity"),
    ("civ-matrix-semantic", "civMatrixNeutralBand"): (P, f"{SE}civ_matrix_neutral_band; reguly z tabeli (kolejnosc + warunki sprawdzone regexem z TS); wektor semantic.band"),
    ("civ-matrix-semantic", "median"): (P, f"{SE}median; wektor semantic.median (9 przypadkow, w tym pusta lista => NaN)"),
    ("civ-matrix-semantic", "CivMatrixSemanticCellInput"): (N, f"typ wejsciowy = struct {SE}SemanticCellInput (None = brak pola / null)"),
    ("civ-matrix-semantic", "classifyCivMatrixCell"): (P, f"{SE}classify_civ_matrix_cell; wektor semantic.grid (1666 + 595 przypadkow wejsc syntetycznych: null/NaN/Infinity/zero rozstepu/remis z mediana/polarnosc) + allStatuses {T1}::synthetic_cell_grid_matches_web"),
    ("civ-matrix-semantic", "civMatrixSemanticBaseline"): (P, f"{SE}civ_matrix_semantic_baseline (+ SemanticContext::new = buildBaselines); wektor semantic.baseline i baselineExtra"),
    ("civ-matrix-semantic", "buildCivMatrixSemanticProfile"): (P, f"{SE}build_civ_matrix_semantic_profile; wektor semantic.profiles i profileByKey (klucze: wielkosc liter, biale znaki JS, nieznana cywilizacja)"),
    ("civ-matrix-semantic", "buildCivMatrixSemanticSnapshot"): (P, f"{SE}build_civ_matrix_semantic_snapshot; wektor semantic.snapshotHeader + kolejnosc komorek civ-major {T1}::snapshot_and_profiles_match_web"),
    ("civ-matrix-semantic", "statusAllowsDefaultVisibility"): (P, f"{SE}status_allows_default_visibility; wektor js.visibility (8 statusow) {T1}::status_visibility_is_true_only_for_real_gameplay"),
    ("civ-matrix-semantic", "civMatrixParameterLabelPl"): (P, f"{SE}civ_matrix_parameter_label_pl; slownik 99 wpisow w tabeli == literal z TS; wektor js.paramLabel ({T3}::parameter_label_matches_web)"),
    ("civ-matrix-semantic", "civMatrixFormattedValue"): (P, f"{SE}civ_matrix_formatted_value (+ {JS}js_to_fixed/js_number_to_string); wektor js.formatted (7 jednostek x 305 wartosci) ({T3}::formatted_value_matches_web)"),
    ("civ-matrix-semantic", "civMatrixIntensityLabel"): (P, f"{SE}civ_matrix_intensity_label; wektor js.intensity ({T3}::intensity_label_matches_web)"),
    # ---- civ-ai-data.ts
    ("civ-ai-data", "CivAiProfile"): (N, f"typ danych = struct {AI}CivAiProfile (+ From<&CywilizacjeItem4> dla wiersza civ-ai.json zwracanego wprost)"),
    ("civ-ai-data", "CivParamsProfile"): (D, "data::civilizations::CywilizacjeItem3 (civ-params.json byte-identyczny z pinem: FNV dataFnv.civParams)"),
    ("civ-ai-data", "civAiAggressionNorm"): (P, f"{AI}civ_ai_aggression_norm; wektor ai.aggressionNorm (3 scenariusze x 3 warianty data x 3 trudnosci x 30-33 nazwy) {T1}::ai_profiles_and_norms_match_web"),
    ("civ-ai-data", "civAiProfilMapy"): (P, f"{AI}civ_ai_profil_mapy (galaz macierzy i galaz legacy z `trim` JS); wektor ai.profilMapy; {T1}::ai_fallback_branches_are_actually_exercised"),
    ("civ-ai-data", "civAiProfileFor"): (P, f"{AI}civ_ai_profile_for; wektor ai.profileFor (wszystkie pola profilu, w tym `uwagi`)"),
    ("civ-ai-data", "civAiProfileForTyp"): (P, f"{AI}civ_ai_profile_for_typ; wektor ai.profileForTyp (18 typow TypCywilizacji + nieznane) {T1}::ai_by_typ_resolvers_match_web"),
    ("civ-ai-data", "civParamsFor"): (P, f"{AI}civ_params_for; wektor ai.civParamsFor i civParamsForNoData {T1}::ai_params_and_diplomacy_rows_match_web"),
    ("civ-ai-data", "isKopiaTypuObronna"): (P, f"{AI}is_kopia_typu_obronna; wektor ai.isKopia"),
    ("civ-ai-data", "DiplomacyPerNacjaRow"): (D, "data::civilizations::PerNacjaItem (diplomacy.json byte-identyczny z pinem: FNV dataFnv.diplomacy); pola wymagane w danych, web trzyma je jako opcjonalne (galezie `== null` nieosiagalne dla typu Rust)"),
    ("civ-ai-data", "civExcelNameFromTyp"): (P, f"{AI}civ_excel_name_from_typ; wektor ai.excelName (18 typow + nieznane); typ drobnej cywilizacji z civ-matrix-params.json"),
    ("civ-ai-data", "diplomacyPerNacjaRow"): (P, f"{AI}diplomacy_per_nacja_row; wektor ai.diploRow"),
    ("civ-ai-data", "diplomacyPerNacjaForTyp"): (P, f"{AI}diplomacy_per_nacja_for_typ; wektor ai.diploRowForTyp"),
    ("civ-ai-data", "resolveArchetypeAggression"): (P, f"{AI}resolve_archetype_aggression (data: Option -> civAiRaw); wektor ai.resolveAggression (3 fallbacki x 4 warianty data x 3 trudnosci x 19 typow x 3 scenariusze)"),
    ("civ-ai-data", "resolveArchetypeTrade"): (P, f"{AI}resolve_archetype_trade; wektor ai.resolveTrade + resolveTradeDefaultDiff"),
    ("civ-ai-data", "nastawienieBazoweZaufanieDelta"): (P, f"{AI}nastawienie_bazowe_zaufanie_delta (baza None = domyslna z tabeli); wektor ai.nastawienie (4 bazy x 3 trudnosci x 19 typow)"),
    # ---- braz-access.ts (zportowane w P6.1C: domain::start_position)
    ("braz-access", "PIEC_HUTNICZY_BUILDING_ID"): (D, "data/derived/start-braz-access.json: budynek_odlewnia_brazu (P6.1C); dowod: tests/p6_1c_braz_access.rs::bootstrap_table_values_equal_web_constants"),
    ("braz-access", "KOPALNIA_MIEDZI_KEY"): (D, "data/derived/start-braz-access.json: ulepszenie_zrodlo_miedzi (P6.1C); ten sam test bootstrap_table_values_equal_web_constants"),
    ("braz-access", "empireHasKopalniaMiedzi"): (P, "domain::start_position::empire_has_kopalnia_miedzi (P6.1C); tests/p6_1c_braz_access.rs::empire_has_kopalnia_miedzi_matches_web (wektor tests/p6_1c_vectors/braz.json)"),
    ("braz-access", "cityHasPiecHutniczy"): (P, "domain::start_position::city_has_piec_hutniczy (P6.1C); tests/p6_1c_braz_access.rs::city_has_piec_hutniczy_matches_web"),
    ("braz-access", "hasBrazAccess"): (P, "domain::start_position::has_braz_access (P6.1C); tests/p6_1c_braz_access.rs::has_braz_access_matches_web"),
}


def exports_of(text):
    out = []
    for m in re.finditer(r"^export\s+(?:declare\s+)?(const|let|var|function|interface|type|class|enum)\s+(\w+)", text, re.M):
        out.append((m.group(2), m.group(1)))
    for m in re.finditer(r"^export\s+(?:type\s+)?\{([^}]*)\}", text, re.M | re.S):
        for part in m.group(1).split(","):
            name = part.strip()
            if not name:
                continue
            name = re.split(r"\s+as\s+", name)[-1].strip()
            if re.fullmatch(r"\w+", name):
                out.append((name, "re-export"))
    seen, uniq = set(), []
    for sym, kind in out:
        if sym not in seen:
            seen.add(sym)
            uniq.append((sym, kind))
    return uniq


def main():
    web_root, out_tsv, doc_md = sys.argv[1], sys.argv[2], sys.argv[3]
    rows = []
    for f in FILES:
        text = open(os.path.join(web_root, "gra/src/game", f + ".ts"), encoding="utf8").read()
        for sym, kind in exports_of(text):
            key = (f, sym)
            if key not in STATUS:
                raise SystemExit(f"BRAK STATUSU: {f}.ts {sym} ({kind})")
            st, why = STATUS[key]
            rows.append((f + ".ts", sym, kind, st, why))
    present = {(r[0][:-3], r[1]) for r in rows}
    unused = set(STATUS) - present
    if unused:
        raise SystemExit(f"STATUS DLA NIEISTNIEJACEGO SYMBOLU: {sorted(unused)}")
    with open(out_tsv, "w", encoding="utf8") as out:
        out.write("plik\tsymbol\trodzaj\tstatus\tdowod\n")
        for r in rows:
            out.write("\t".join(r) + "\n")
    counts = {}
    for r in rows:
        counts[r[3]] = counts.get(r[3], 0) + 1
    per_file = {}
    for r in rows:
        per_file[r[0]] = per_file.get(r[0], 0) + 1
    print("RAZEM:", len(rows), counts, per_file)
    if doc_md != "-":
        lines = ["| plik web | symbol | rodzaj | status | dowód / powód |", "|---|---|---|---|---|"]
        for f, sym, kind, st, why in rows:
            lines.append(f"| `{f}` | `{sym}` | {kind} | {st} | {why} |")
        table = "\n".join(lines)
        doc = open(doc_md, encoding="utf8").read()
        pat = re.compile(r"<!-- SYMBOLS:BEGIN -->.*?<!-- SYMBOLS:END -->", re.S)
        if not pat.search(doc):
            raise SystemExit("brak znacznikow SYMBOLS:BEGIN/END w dokumencie")
        new = "<!-- SYMBOLS:BEGIN -->\n" + table + "\n<!-- SYMBOLS:END -->"
        open(doc_md, "w", encoding="utf8").write(pat.sub(lambda _m: new, doc))
        print("dokument zaktualizowany: " + doc_md)


if __name__ == "__main__":
    main()
