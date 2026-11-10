#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow P6.1 (r2).

NIE uzywa kodu TypeScript ani generatora. Implementuje semantyke weba od nowa w Pythonie
(na podstawie zrodla gra/src/game/*.ts z git archive edb8fb56) i porownuje z web-vectors.json.
Dodatkowo sprawdza, ze stuby (stubs/*.ts) sa dokladnie wycietymi liniami zrodla weba.

Uzycie:
  python3 -I verify-p61-web-vectors.py <WEB_ROOT> <WEB_VECTORS_JSON> <STUBS_DIR>
Wyjscie: 0 = zgodnosc 100%, 1 = co najmniej jedna rozbieznosc.
"""
import json
import math
import os
import sys

M32 = 0xFFFFFFFF
GAME_EPOCH_ORDER = ["kamien", "braz", "zelazo"]
EPOCH_NAME = {"kamien": "Kamień", "braz": "Brąz", "zelazo": "Żelazo"}
HUD_NAME = {"kamien": "Epoka kamienia", "braz": "Epoka brązu", "zelazo": "Epoka żelaza"}
ERRORS = []
CHECKS = {"civEntry": 0, "hudLabels": 0, "rosterAvail": 0, "rosterIds": 0, "rng": 0,
          "majorAi": 0, "seats": 0, "constants": 0, "stubs": 0, "outOfDomain": 0}


def check(group, cond, msg):
    CHECKS[group] += 1
    if not cond:
        ERRORS.append(f"[{group}] {msg}")


def game_epoch_index(eid):
    return GAME_EPOCH_ORDER.index(eid) if eid in GAME_EPOCH_ORDER else len(GAME_EPOCH_ORDER)


def civ_entry(row):
    direct = row.get("epokaWejscia")
    if direct and direct in GAME_EPOCH_ORDER:
        return direct
    legacy = row.get("epokiStartowe")
    if legacy:
        idx = [game_epoch_index(e) for e in legacy]
        idx = [i for i in idx if i < len(GAME_EPOCH_ORDER)]
        if idx:
            return GAME_EPOCH_ORDER[min(idx)]
    return "kamien"


def is_available(row, game_epoch):
    return game_epoch_index(civ_entry(row)) <= game_epoch_index(game_epoch)


def hud_label(x):
    if math.isnan(x):
        return HUD_NAME["kamien"]
    r = float("inf") if x == float("inf") else (float("-inf") if x == float("-inf") else math.floor(x + 0.5))
    if math.isinf(r):
        clamped = 3 if r > 0 else 1
    else:
        clamped = max(1, min(3, int(r)))
    return HUD_NAME[GAME_EPOCH_ORDER[clamped - 1]]


def entry_label(row):
    entry = civ_entry(row)
    idx = game_epoch_index(entry)
    avail = [EPOCH_NAME[e] for i, e in enumerate(GAME_EPOCH_ORDER) if i >= idx]
    return f"Wejście: {EPOCH_NAME[entry]} · dostępne: {', '.join(avail)}"


def imul(a, b):
    return (a * b) & M32


def mulberry32(seed):
    s = seed & M32
    while True:
        s = (s + 0x6D2B79F5) & M32
        t = s
        t = imul(t ^ (t >> 15), t | 1)
        t = t ^ ((t + imul(t ^ (t >> 7), t | 61)) & M32)
        yield ((t ^ (t >> 14)) & M32) / 4294967296.0


def is_major_ai(owner, city_states):
    return owner > 0 and owner != -1 and owner not in city_states


def is_ai(seats, owner):
    if owner in seats["humanOwnerIds"]:
        return False
    if owner == -1 or owner == -99:
        return False
    return True


def next_seat(seats):
    ids = seats["humanOwnerIds"]
    if len(ids) <= 1:
        return None
    if seats["activeHumanOwnerId"] not in ids:
        return None
    return ids[(ids.index(seats["activeHumanOwnerId"]) + 1) % len(ids)]


def check_stubs(web_root, stubs_dir):
    src_b = open(os.path.join(web_root, "gra/src/game/barbarians.ts"), encoding="utf8").read().split("\n")
    src_s = open(os.path.join(web_root, "gra/src/game/society-breakdown.ts"), encoding="utf8").read().split("\n")
    expect_b = "\n".join(src_b[48:54]) + "\n"
    expect_s = "\n".join(src_s[204:206]) + "\n"
    got_b = open(os.path.join(stubs_dir, "barbarians.ts"), encoding="utf8").read()
    got_s = open(os.path.join(stubs_dir, "society-breakdown.ts"), encoding="utf8").read()
    check("stubs", got_b == expect_b, "stubs/barbarians.ts != linie 49-54 weba")
    check("stubs", got_s == expect_s, "stubs/society-breakdown.ts != linie 205-206 weba")
    check("stubs", src_b[48] == "export const BARBARIAN_OWNER_ID = -1;", "kotwica barbarians:49")
    check("stubs", src_s[205] == "export const REBEL_FACTION_OWNER_ID = -99;", "kotwica society-breakdown:206")


def main():
    web_root, vec_path, stubs_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    v = json.load(open(vec_path, encoding="utf8"))
    check_stubs(web_root, stubs_dir)

    # constants
    check("constants", v["constants"]["GAME_EPOCH_ORDER"] == GAME_EPOCH_ORDER, "GAME_EPOCH_ORDER")
    check("constants", v["constants"]["HUMAN_OWNER_PRIMARY"] == 0, "HUMAN_OWNER_PRIMARY")
    for g, idx in v["constants"]["gameEpochIndex"].items():
        check("constants", idx == game_epoch_index(g), f"gameEpochIndex({g!r})")

    # civEntry
    game_epochs = list(v["constants"]["gameEpochIndex"].keys())
    for row in v["civEntry"]:
        inp = row["input"]
        check("civEntry", row["entry"] == civ_entry(inp), f"entry {inp}")
        for g in game_epochs:
            check("civEntry", row["available"][g] == is_available(inp, g), f"available {inp} @ {g!r}")
        check("civEntry", row["label"] == entry_label(inp), f"label {inp}")

    # hudLabels
    for row in v["hudLabels"]:
        x = float(row["input"])
        check("hudLabels", row["label"] == hud_label(x), f"hud({row['input']})")

    # roster
    roster = [
        {"ikonaId": "A", "epokaWejscia": "kamien"},
        {"ikonaId": "B", "epokaWejscia": "braz"},
        {"ikonaId": "C", "epokaWejscia": "zelazo"},
        {"ikonaId": "D", "epokiStartowe": ["braz", "zelazo"]},
        {"epokaWejscia": "kamien"},
        {"ikonaId": "E", "epokiStartowe": ["xyz"]},
        {"ikonaId": "", "epokaWejscia": "kamien"},
    ]
    ids_expected = [r["ikonaId"] for r in roster if r.get("ikonaId")]
    check("rosterIds", v["rosterIds"] == ids_expected, f"rosterIds {v['rosterIds']} != {ids_expected}")
    for g in game_epochs:
        exp = [r["ikonaId"] for r in roster if r.get("ikonaId") and is_available(r, g)]
        check("rosterAvail", v["rosterAvail"][g] == exp, f"rosterAvail @ {g!r}")

    # rng (mulberry32)
    for row in v["rng"]:
        gen = mulberry32(row["seed"])
        got = [next(gen) for _ in range(len(row["values"]))]
        check("rng", got == row["values"], f"mulberry32 seed={row['seed']} (python {got[:2]} vs web {row['values'][:2]})")

    # majorAi
    city_states = {2, 3}
    for row in v["majorAi"]:
        check("majorAi", row["major"] == is_major_ai(row["owner"], city_states), f"major {row['owner']}")

    # seats
    for row in v["seats"]:
        s = row["seats"]
        hot = len(s["humanOwnerIds"]) > 1
        check("seats", row["isHotSeat"] == hot, f"isHotSeat {s}")
        check("seats", row["nextHumanSeat"] == next_seat(s), f"nextHumanSeat {s}")
        for o in row["owners"]:
            ow = o["owner"]
            check("seats", o["isHuman"] == (ow in s["humanOwnerIds"]), f"isHuman {s} {ow}")
            check("seats", o["isActive"] == (ow == s["activeHumanOwnerId"]), f"isActive {s} {ow}")
            check("seats", o["isAi"] == is_ai(s, ow), f"isAi {s} {ow}")

    # poza domena: -5 (zapisane tylko jako fakt weba; NIE jest porownywane z Rust)
    od = v["outOfDomain"]
    check("outOfDomain", od["isMajorAiOwner"] == is_major_ai(-5, set()), "major(-5)")
    check("outOfDomain", od["isAiOwner_default_seats"] == is_ai({"humanOwnerIds": [0], "activeHumanOwnerId": 0}, -5), "isAi(-5)")

    total = sum(CHECKS.values())
    for k, n in CHECKS.items():
        print(f"{k}: {n} sprawdzen")
    print(f"RAZEM: {total} sprawdzen, rozbieznosci: {len(ERRORS)}")
    for e in ERRORS[:50]:
        print("ROZBIEZNOSC " + e)
    return 0 if not ERRORS else 1


if __name__ == "__main__":
    sys.exit(main())
