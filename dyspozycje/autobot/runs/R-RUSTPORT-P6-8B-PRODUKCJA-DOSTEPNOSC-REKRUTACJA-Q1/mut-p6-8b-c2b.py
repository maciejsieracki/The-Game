# Mutacje P6.8B-P1b-c2b (available_replacements_for, replace_passes_gates, replacement_name_compare).
# Uruchomienie z korzenia worktree:  python3 <ten plik> [M1 M2 ...]
# Zrodlo czytane z dysku na starcie i przywracane bajt w bajt w `finally`.
# Klasa COMPILE-ERROR nie jest liczona jako zabicie. Testy: p6_8b_c2b_vectors (cala binarka).
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "../../../.."))
ENG = os.path.join(ROOT, "rust-port/engine")
SRC = os.path.join(ENG, "src/domain/production_units.rs")
orig = open(SRC, encoding="utf8").read()

allm = {
    # gate epoki: '>' -> '>=' (pozwala epoke wyzsza o 0 -> zmiana granicy)
    "M1": ("    if unit_epoch > epoch {\n        return false;", "    if unit_epoch >= epoch {\n        return false;"),
    # gate techu wylaczony
    "M2": ("&& tech != \"\\u{2014}\" && !ctx.unlocked_techs.contains(&tech)\n    {", "&& tech != \"\\u{2014}\" && false\n    {"),
    # koszary od epoki 3 zamiast 2
    "M3": ("    if unit_epoch >= 2.0\n        && !ctx.built_building_ids.contains(&\"koszary\")", "    if unit_epoch >= 3.0\n        && !ctx.built_building_ids.contains(&\"koszary\")"),
    # bramka wody (Naval) wylaczona
    # (r4 obrona) wzorce z pocz. nowej linii: w pliku jest tez kopia galezi w available_production (wciecie 8)
    "M4": ("\n    if typ == \"Naval\" && !ctx.city_has_coast_or_river {", "\n    if typ == \"Navalx\" && !ctx.city_has_coast_or_river {"),
    # bramka zapasu brazu wylaczona
    "M5": ("\n        if (surowiec == \"braz\" && !empire_stock_has(stock, \"braz\"))", "\n        if (false && !empire_stock_has(stock, \"braz\"))"),
    # bramka super-jednostki: TAK -> NIE
    "M6": ("\n    if u.cost.super_jednostka.as_deref() == Some(\"TAK\")", "\n    if u.cost.super_jednostka.as_deref() == Some(\"NIE\")"),
    # galaz A: sprawdzenie zamiennika specjalnego pominiete
    "M7": ("        if !is_blank_replacement(zamiast)\n            && !is_civ_special_replacement(&u.as_replacement_row(), civ)", "        if false\n            && !is_blank_replacement(zamiast)\n            && !is_civ_special_replacement(&u.as_replacement_row(), civ)"),
    # galaz B: brak deduplikacji wzgledem A
    "M8": ("            if name.is_empty() || name == current_unit_name || seen.contains(name) {", "            if name.is_empty() || name == current_unit_name {"),
    # sortowanie: brak tie-break po nazwie
    # (r4 obrona) pozniej przeniesione do cost_then_name_order: tie-break po nazwie usuniety
    "M9": ("    replacement_name_compare(&a.nazwa, &b.nazwa)\n}", "    std::cmp::Ordering::Equal\n}"),
    # unitAllowedForCivNation pominiete
    "M10": ("    if !unit_allowed_for_civ_nation(nacja, civ_nation) {", "    if false && !unit_allowed_for_civ_nation(nacja, civ_nation) {"),
    # epoka nie-skonczona: brak normalizacji do 1
    "M11": ("    let current_typ = js_trim(current.typ.as_deref().unwrap_or(\"\"));\n    let epoch = if ctx.epoch.is_finite() {\n        ctx.epoch\n    } else {\n        1.0\n    };", "    let current_typ = js_trim(current.typ.as_deref().unwrap_or(\"\"));\n    let epoch = ctx.epoch;"),
    # filtr Typ w galezi A: pusty Typ przepuszczany
    "M12": ("        if utyp.is_empty() || utyp != current_typ {", "        if utyp != current_typ {"),
    # koszt bez skali epoki
    "M13": ("    let base = scale_cost_by_epoch(\n        unit_cost_from_def(&u.cost),\n        &epoch_input(u.cost.epoka.as_deref()),\n    );", "    let base = unit_cost_from_def(&u.cost);"),
    # (r4 obrona) poziom 3 (locale_compare na oryginalach) usuniety: pary o tej samej bazie -> rowne
    "M14": ("        .cmp(&0)\n        .then_with(|| locale_compare(a, b).cmp(&0))\n}", "        .cmp(&0)\n}"),
    # (r4 obrona) STARE zachowanie (przed poprawka): poziom 2 = liczba diakrytykow -> musi byc ZABITE
    "M16": ("        .cmp(&0)\n        .then_with(|| locale_compare(a, b).cmp(&0))\n}", "        .cmp(&0)\n        .then_with(|| {\n            let dc = |t: &str| t.chars().filter(|&c| c == '\\u{142}' || c == '\\u{141}' || { let l = c.to_lowercase().collect::<String>(); strip_diacritics(&c.to_string()) != l }).count();\n            dc(a).cmp(&dc(b))\n        })\n        .then_with(|| locale_compare(a, b).cmp(&0))\n}"),
    # ł nie mapowane na l w poziomie 1
    "M15": ("let base = |s: &str| strip_diacritics(s).replace('\\u{142}', \"l\");", "let base = |s: &str| strip_diacritics(s);"),
}
sel = sys.argv[1:] or list(allm)
env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
try:
    for k in sel:
        a, b = allm[k]
        n = orig.count(a)
        if n != 1:
            print(k, "pattern count", n, flush=True)
            continue
        open(SRC, "w", encoding="utf8").write(orig.replace(a, b))
        p = subprocess.run(["cargo", "test", "--test", "p6_8b_c2b_vectors"], cwd=ENG, env=env,
                           capture_output=True, text=True, timeout=500)
        out = p.stdout + p.stderr
        if "could not compile" in out or "error[" in out:
            status = "COMPILE-ERROR"
        else:
            status = "KILLED" if p.returncode != 0 else "SURVIVED"
        fails = [l.strip() for l in out.splitlines() if l.strip().startswith("test ") and "FAILED" in l]
        print(k, status, fails[:3], "rc=", p.returncode, flush=True)
finally:
    open(SRC, "w", encoding="utf8").write(orig)
    print("restored_bytes_identical", open(SRC, encoding="utf8").read() == orig, flush=True)
