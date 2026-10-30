# P6.8B-P1a, mutacje runda 2 (przenosne: sciezki wzgledne do tego repo; CARGO_TARGET_DIR z env lub ENGINE/target).
# Uruchomienie z katalogu tego runu, zakres indeksow [OD, DO):
#   python3 -I mut-p6-8b-helpers-r2.py OD DO
# Klasyfikacja: KILLED = test padl (asercja/panic) przy zbudowanym kodzie;
#               COMPILE-ERROR = blad kompilacji (NIE liczy sie jako zabicie);
#               SURVIVED = testy przeszly; EQUIV = oczekiwane przezycie (mutant rownowazny, uzasadnienie w polu).
# Po kazdym mutancie zrodlo jest przywracane z pamieci i sprawdzane sha256 z oryginalu.
import hashlib
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, "..", "..", "..", ".."))
ENGINE = os.path.join(REPO, "rust-port", "engine")
SRC = os.path.join(ENGINE, "src", "domain", "production_units.rs")
ENV = dict(os.environ)
ENV.setdefault("CARGO_INCREMENTAL", "0")
ENV.setdefault("CARGO_PROFILE_DEV_DEBUG", "0")
if "CARGO_TARGET_DIR" not in os.environ:
    ENV["CARGO_TARGET_DIR"] = os.path.join(ENGINE, "target")

# (nazwa, oczekiwanie, stary tekst, nowy tekst). Oczekiwanie: KILL | EQUIV (uzasadnienie w komentarzu).
MUT = [
    # --- mutanty z runy r1 (ta sama tresc) ---
    ("M1-blank-em-dash", "KILL", r'|| zamiast == "\u{2014}"', ""),
    ("M2-unit-allowed-empty", "KILL", "    if n.is_empty() {\n        return true;\n    }", "    if n.is_empty() {\n        return false;\n    }"),
    ("M3-gold-no-min", "KILL", "        rounded.max(1.0)\n", "        rounded\n"),
    ("M4-mury-palisada", "KILL", '    if completed_building_id == "mury" {', "    if false {"),
    ("M5-match-tn-starts", "EQUIV", "            || tn.starts_with(&un)\n", ""),  # tn.starts_with(un) => tn.contains(un)
    ("M6-primary-token", "KILL", "                    tokens.push(primary.to_string());\n", ""),
    ("M7-lowercase-key", "KILL", "    let lower = key.to_lowercase();", "    let lower = key.to_string();"),
    ("M8-committed-queue", "KILL", "            .any(|it| it.kind == ProductionKind::Budynek && it.id == building_id)\n}", "            .any(|it| false)\n}"),
    ("M9-superseded-built", "KILL", "        b.upgrade_from.as_deref() == Some(building_id) && built_ids.contains(&b.id.as_str())", "        b.upgrade_from.as_deref() == Some(building_id)"),
    ("M10-civ-has-rep-trim", "KILL", '            && js_trim(unit.w_zamian_za.as_deref().unwrap_or("")) == base_unit_name', '            && unit.w_zamian_za.as_deref().unwrap_or("") == base_unit_name'),
    # --- r2: nacja jednostek, dopasowanie nacji ---
    ("E11-civkey-no-trim", "KILL", "    let key = js_trim(civ_key?);", "    let key = civ_key?;"),
    ("E12-civkey-empty-check", "EQUIV", "    if key.is_empty() {\n        return None;\n    }\n", ""),  # brak klucza '' w tablicy, '' nie jest prototypowe
    ("E13-allowed-unit-trim", "KILL", "    let n = js_trim(unit_nacja);", "    let n = unit_nacja;"),
    ("E14-allowed-civ-trim", "KILL", '    let c = js_trim(civ_unit_nacja.unwrap_or(""));', '    let c = civ_unit_nacja.unwrap_or("");'),
    ("E15-allowed-civ-empty", "KILL", "    if c.is_empty() {\n        return false;\n    }\n", ""),
    ("E16-allowed-raw-compare", "KILL", "    strip_diacritics(n) == strip_diacritics(c)\n", "    n == c\n"),
    ("E17-avail-none-branch", "KILL", "        None => civ_unit_nacja.map(str::to_string),\n", "        None => None,\n"),
    ("E18-avail-some-branch", "KILL", "        Some(key) => unit_nacja_for_civ_key(key).map(str::to_string),\n", "        Some(_) => None,\n"),
    # --- r2: zamienniki ---
    ("E19-blank-empty", "KILL", 'zamiast.is_empty() || zamiast == "-"', 'zamiast == "-"'),
    ("E20-blank-dash", "KILL", 'zamiast == "-" || zamiast == "\\u{2014}"', 'zamiast == "\\u{2014}"'),
    ("E21-special-civ-filter", "KILL", "let Some(civ) = civ_nation.filter(|c| !c.is_empty()) else {", "let Some(civ) = civ_nation else {"),
    ("E22-special-trim-replacement", "KILL", '    let replacement = js_trim(unit.w_zamian_za.as_deref().unwrap_or(""));', '    let replacement = unit.w_zamian_za.as_deref().unwrap_or("");'),
    ("E23-special-trim-nation", "KILL", '    let unit_nation = js_trim(unit.nacja.as_deref().unwrap_or(""));', '    let unit_nation = unit.nacja.as_deref().unwrap_or("");'),
    ("E24-special-nonempty-nation", "KILL", "        && !unit_nation.is_empty()\n", ""),
    ("E25-special-raw-compare", "KILL", "        && strip_diacritics(unit_nation) == strip_diacritics(civ)", "        && unit_nation == civ"),
    ("E26-special-blank-check", "KILL", "    !is_blank_replacement(replacement)\n", "    true\n"),
    ("E27-hasrep-empty-civ", "EQUIV", "    if civ_nation.is_none_or(str::is_empty) {", "    if false {"),  # is_civ_special_replacement i tak odrzuca pusta cywilizacje
    ("E29-hasrep-is-special", "KILL", "        is_civ_special_replacement(unit, civ_nation)\n            && js_trim", "        true\n            && js_trim"),
    ("E30-gold-nan-check", "KILL", "    if rounded.is_nan() {", "    if false {"),
    ("E55-gold-mult", "KILL", "js_math_round(praca_koszt * BUILDING_GOLD_PURCHASE_MULT)", "js_math_round(praca_koszt * 3.0)"),
    # --- r2: kolejka i budynki ---
    ("E31-committed-kind", "KILL", "        || queue\n            .iter()\n            .any(|it| it.kind == ProductionKind::Budynek && it.id == building_id)", "        || queue\n            .iter()\n            .any(|it| it.id == building_id)"),
    ("E32-queued-kind", "KILL", "pub fn building_type_queued(building_id: &str, queue: &[ProductionItem]) -> bool {\n    queue\n        .iter()\n        .any(|it| it.kind == ProductionKind::Budynek && it.id == building_id)", "pub fn building_type_queued(building_id: &str, queue: &[ProductionItem]) -> bool {\n    queue\n        .iter()\n        .any(|it| it.id == building_id)"),
    ("E58-committed-built", "KILL", "    built_ids.contains(&building_id)\n        || queue", "    false\n        || queue"),
    ("E59-superseded-upgrade-from", "KILL", "        b.upgrade_from.as_deref() == Some(building_id) && built_ids.contains(&b.id.as_str())", "        built_ids.contains(&b.id.as_str())"),
    ("E33-apply-trim-upgrade", "KILL", "        .and_then(|d| d.upgrade_from.as_deref())\n        .map(js_trim)\n", "        .and_then(|d| d.upgrade_from.as_deref())\n"),
    ("E34-apply-filter-empty", "KILL", "        .map(js_trim)\n        .filter(|s| !s.is_empty())\n    {", "        .map(js_trim)\n    {"),  # r2: wektor z '' w built_ids (web: guard length>0)
    ("E35-apply-push-always", "KILL", "    if !next.iter().any(|id| id == completed_building_id) {\n        next.push(completed_building_id.to_string());\n    }", "    next.push(completed_building_id.to_string());"),
    ("E36-apply-no-remove-pred", "KILL", "            next.remove(idx);\n", "            let _ = idx;\n"),
    ("E61-apply-no-remove-palisada", "KILL", "            next.remove(pi);\n", "            let _ = pi;\n"),
    ("E37-unlock-trim", "KILL", "        .and_then(|b| b.odblokowuje.as_deref())\n        .map(js_trim)\n", "        .and_then(|b| b.odblokowuje.as_deref())\n"),
    ("E38-unlock-filter-empty", "KILL", "        .filter(|s| !s.is_empty())\n        .map(str::to_string)", "        .map(str::to_string)"),
    # --- r2: tokeny jednostek specjalnych ---
    ("E39-tokens-kind-check", "KILL", '        if b.typ != "jednostka_specjalna" {\n            continue;\n        }\n', ""),
    ("E40-tokens-raw-empty", "EQUIV", "            if raw.is_empty() {\n                continue;\n            }\n", ""),  # raw '' -> split -> '' -> pominiete
    ("E41-tokens-trimmed-empty", "KILL", "                if trimmed.is_empty() {\n                    continue;\n                }\n", ""),
    ("E42-tokens-primary-trim", "KILL", "                let primary = js_trim(trimmed.split('(').next().unwrap_or(\"\"));", "                let primary = trimmed.split('(').next().unwrap_or(\"\");"),
    ("E43-tokens-primary-nonempty", "KILL", "                if !primary.is_empty() && primary != trimmed {", "                if primary != trimmed {"),
    ("E44-tokens-primary-neq", "KILL", "                if !primary.is_empty() && primary != trimmed {", "                if !primary.is_empty() {"),
    ("E45-tokens-list-null", "EQUIV", "                .map(|v| v.clone().unwrap_or_default())", "                .filter_map(|v| v.clone())"),  # null -> '' -> pominiete
    # --- r2: dopasowanie nazwy ---
    ("E46-match-empty-token", "KILL", "        if tn.is_empty() {\n            return false;\n        }\n", ""),
    ("E47-match-eq-branch", "EQUIV", "        un == tn\n", "        false\n"),  # un == tn => un.starts_with(tn)
    ("E48-match-un-starts", "EQUIV", "            || un.starts_with(&tn)\n", ""),  # un.starts_with(tn) => un.contains(tn)
    ("E50-match-un-contains", "KILL", "            || un.contains(&tn)\n", ""),
    ("E51-match-tn-contains", "KILL", "            || tn.contains(&un)\n", ""),
    ("E52-match-strip-token", "KILL", "        let tn = strip_diacritics(token);", "        let tn = token.to_lowercase();"),
    ("E53-match-strip-name", "KILL", "    let un = strip_diacritics(unit_name);", "    let un = unit_name.to_lowercase();"),
    ("E54-match-empty-tokens", "EQUIV", "    if tokens.is_empty() {\n        return false;\n    }\n    let un", "    let un"),  # pusta lista -> any() = false
]


def classify(rc, out):
    if "error[E" in out or "could not compile" in out or "error: could not" in out:
        return "COMPILE-ERROR"
    if rc == 0:
        return "SURVIVED" if "running 18 tests" in out and "test result: ok" in out else "NO-RUN"
    if "test result: FAILED" in out or "panicked at" in out:
        return "KILLED"
    return "OTHER"


def main():
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    with open(SRC, "rb") as fh:
        raw = fh.read()
    orig_sha = hashlib.sha256(raw).hexdigest()
    orig = raw.decode("utf-8")
    print("SRC", os.path.relpath(SRC, REPO), "sha256", orig_sha, flush=True)
    try:
        for idx, (name, expect, old, new) in enumerate(MUT):
            if not (lo <= idx < hi):
                continue
            n = orig.count(old)
            if n != 1:
                print(f"{name}\tPATTERN-COUNT={n}\texpect={expect}", flush=True)
                continue
            with open(SRC, "wb") as fh:
                fh.write(orig.replace(old, new, 1).encode("utf-8"))
            p = subprocess.run(
                ["cargo", "test", "--test", "p6_8b_helpers_vectors"],
                cwd=ENGINE, env=ENV, capture_output=True, text=True, timeout=580,
            )
            cls = classify(p.returncode, p.stdout + p.stderr)
            flag = "OK" if (cls == "KILLED") == (expect == "KILL") else "MISMATCH"
            print(f"{name}\t{cls}\texpect={expect}\t{flag}", flush=True)
    finally:
        with open(SRC, "wb") as fh:
            fh.write(raw)
        with open(SRC, "rb") as fh:
            back = hashlib.sha256(fh.read()).hexdigest()
        print("RESTORED", "OK" if back == orig_sha else "MISMATCH", back, flush=True)


if __name__ == "__main__":
    main()
