# Niezalezny weryfikator R4 (REPIN-WOJNA-2, runda 4). Semantyka odtworzona od zera z TS pinu dc8a3adc,
# bez importu generatora. Uruchomienie (z korzenia repo): python3 -I <sciezka>/verify-r4-save-meta.py <repo-root> <webpin-root>
import json, math, sys, re

repo, web = sys.argv[1], sys.argv[2]

def js_eq_num1(v):
    # JS `v === 1`: tylko typ number (bez bool), wartosc 1
    return type(v) in (int, float) and v == 1

def restored(meta):
    # main.ts:40818-40821
    v = meta.get("battleModeSettingVersion") if isinstance(meta, dict) else None
    return 1 if js_eq_num1(v) else None

def always_manual(meta):
    # main.ts:29058 `_lastNewGameParams?.advanced?.battleAlwaysManual`
    ng = meta.get("newGameParams") if isinstance(meta, dict) else None
    if not isinstance(ng, dict):
        return None
    adv = ng.get("advanced")
    if not isinstance(adv, dict):
        return None
    return adv.get("battleAlwaysManual", None)

def auto_only(meta, is_me):
    # main.ts:29052-29060 + battle-mode.ts:13: version === 1 && battleAlwaysManual === false
    if not is_me:
        return False
    am = always_manual(meta)
    return restored(meta) == 1 and (type(am) is bool and am is False)

vec = json.load(open(repo + "/rust-port/engine/tests/p6_repin_wojna_2_r4_vectors/save-meta.json"))
assert vec["constVersion"] == 1 and vec["count"] == len(vec["cases"]) == 576, "count"
bad = 0
ver1 = 0
auto = 0
for c in vec["cases"]:
    meta = json.loads(c["metaJson"])
    want_r = c["restoredVersion"]
    got_r = restored(meta)
    if got_r != want_r:
        bad += 1
        print("RESTORE MISMATCH", c)
    if got_r == 1:
        ver1 += 1
    if auto_only(meta, c["isMe"]) != c["automaticOnly"]:
        bad += 1
        print("AUTO MISMATCH", c)
    if c["automaticOnly"]:
        auto += 1
print("meta cases", len(vec["cases"]), "mismatch", bad, "restored=1", ver1, "autoOnly", auto)

# Kodowania wartosci wersji w wektorach (JSON, surowy tekst)
raw = open(repo + "/rust-port/engine/tests/p6_repin_wojna_2_r4_vectors/save-meta.json").read()
enc = sorted(set(re.findall(r'battleModeSettingVersion\\":([^,}]*)', raw)))
print("version encodings", enc)

# Planned marches: niezalezna reimplementacja plannedMarchesFromSave (planned-march.ts:440-471)
def finite(x):
    return type(x) in (int, float) and math.isfinite(x)

def nonempty_str(x):
    return isinstance(x, str) and len(x) > 0

def validate_auto(saved, units, owner):
    # planned-march.ts:426-437
    if not isinstance(saved, dict) or not isinstance(saved.get("leaderId"), str):
        return None
    u = next((x for x in units if x["id"] == saved["leaderId"]), None)
    if u is None or u["ownerId"] != owner:
        return None
    if u["q"] == saved.get("destQ") and u["r"] == saved.get("destR"):
        return None
    if not finite(saved.get("destQ")) or not finite(saved.get("destR")):
        return None
    return saved

def planned_from_save(saved, planned_pairs, units, owner):
    order = []
    d = {}
    # planned-march.ts:447 `if (plannedMarches && typeof === 'object')`: brak -> pusta mapa
    for uid, dest in (planned_pairs or []):
        if not isinstance(dest, dict) or not finite(dest.get("destQ")) or not finite(dest.get("destR")):
            continue
        u = next((x for x in units if x["id"] == uid), None)
        if u is None or u["ownerId"] != owner:
            continue
        if u["q"] == dest["destQ"] and u["r"] == dest["destR"] and not nonempty_str(dest.get("generalTargetId")):
            continue
        e = {"destQ": dest["destQ"], "destR": dest["destR"]}
        if nonempty_str(dest.get("attackUnitId")):
            e["attackUnitId"] = dest["attackUnitId"]
        if nonempty_str(dest.get("generalTargetId")):
            e["generalTargetId"] = dest["generalTargetId"]
        if uid not in d:
            order.append(uid)
        d[uid] = e
    legacy = validate_auto(saved, units, owner)
    if legacy is not None and legacy["leaderId"] not in d:
        order.append(legacy["leaderId"])
        d[legacy["leaderId"]] = {"destQ": legacy["destQ"], "destR": legacy["destR"]}
    return [[k, d[k]] for k in order]

pm = json.load(open(repo + "/rust-port/engine/tests/p6_repin_wojna_2_r3_vectors/planned-march-general.json"))
fs = pm["fromSave"]
pbad = 0
for c in fs:
    got = planned_from_save(c["saved"], c["planned"], c["units"], c["owner"])
    if got != c["out"]:
        pbad += 1
        if pbad <= 3:
            print("PM MISMATCH", json.dumps(c)[:400], got)
print("planned fromSave cases", len(fs), "mismatch", pbad)

# Zrodla: wyrazenia cytowane w komentarzach Rust istnieja w pinie
main = open(web + "/gra/src/main.ts", encoding="utf-8").read().splitlines()
checks = {
    "main.ts:32378": "battleModeSettingVersion: _battleModeSettingVersion",
    "main.ts:40819": "savedBattleModeVersion === BATTLE_MODE_SETTING_VERSION",
    "main.ts:29056": "return isAutomaticOnlyBattleMode(",
    "main.ts:29058": "_lastNewGameParams?.advanced?.battleAlwaysManual",
}
for k, s in checks.items():
    ln = int(k.split(":")[1])
    window = "\n".join(main[ln - 4: ln + 3])
    print(k, "OK" if s in window else "MISSING")
bm = open(web + "/gra/src/game/battle-mode.ts", encoding="utf-8").read()
print("battle-mode.ts:13", "OK" if "settingVersion === BATTLE_MODE_SETTING_VERSION && battleAlwaysManual === false" in bm else "MISSING")
print("TOTAL_MISMATCH", bad + pbad)
