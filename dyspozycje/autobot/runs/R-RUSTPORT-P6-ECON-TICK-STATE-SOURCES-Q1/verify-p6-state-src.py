#!/usr/bin/env python3
"""Niezalezny weryfikator (python3 -I) wektorow R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1.
Przelicza z samych danych wejsciowych scenariusza (bez Rust i bez kodu weba) niezmienniki wyniku weba:
 braz/cegla/zloto natywne z warstw w terytorium, zelazo == false (hasZelazoAccess(boolean) => brak zapasu),
 grant z trasy z natywnego dostepu stron, zloto NT = natywne OR grant, etykiety Cegla/Ceramika, civ-map, podzial.
Uzycie: verify-p6-state-src.py <state_src.json>
"""
import json, sys

d = json.load(open(sys.argv[1], encoding="utf-8"))
n_ok = 0
bad = []

def chk(cond, msg):
    global n_ok
    if cond:
        n_ok += 1
    else:
        bad.append(msg)

PIEC = {"odlewnia_brazu", "odlewnia_zelaza", "wielka_odlewnia"}
for sc in d["scenarios"]:
    i, o = sc["in"], sc["out"]
    cities = i["cities"]
    for ow in o["native"]:
        own_layers = [l for _, ls in o["placedForOwner"][ow] for l in ls]
        mine = [c for c in cities if str(c["ownerId"]) == ow]
        built = lambda c: i["builtByCity"][c["id"]]
        want_braz = "kopalnia_miedzi" in own_layers and any(PIEC & set(built(c)) for c in mine)
        want_cegla = "glinianka" in own_layers and any("cegielnia" in built(c) for c in mine)
        want_zloto = "kopalnia_zlota" in own_layers
        nat = o["native"][ow]
        chk(nat["braz"] == want_braz, f"{i['name']} braz {ow}")
        chk(nat["cegla"] == want_cegla, f"{i['name']} cegla {ow}")
        chk(nat["zloto"] == want_zloto, f"{i['name']} zloto {ow}")
        chk(nat["zelazo"] is False, f"{i['name']} zelazo {ow} (web: zawsze false)")
        grant_zloto = any(g["ownerId"] == int(ow) and g["resourceKey"] == "zloto" for g in o["grants"])
        chk(o["zlotoNT"][ow] == (want_zloto or grant_zloto), f"{i['name']} zlotoNT {ow}")
        empire_built = set(b for c in mine for b in built(c))
        lab = o["labels"][ow]
        chk(("Cegła" in lab) == ("cegielnia" in empire_built or "Cegła" in lab), f"{i['name']} Cegla {ow}")
        if "cegielnia" in empire_built:
            chk("Cegła" in lab, f"{i['name']} Cegla obecna {ow}")
        if "garncarnia" in empire_built:
            chk("Ceramika" in lab, f"{i['name']} Ceramika obecna {ow}")
        chk(len(lab) == len(set(lab)), f"{i['name']} etykiety unikalne {ow}")
    # grant z trasy: z natywnego dostepu stron
    want = []
    for r in i["routes"]:
        if r["status"] != "polaczony":
            continue
        for k in ["braz", "zelazo", "kon", "cegla", "zloto"]:
            a = o["native"].get(str(r["ownerId"]), {}).get(k)
            b = o["native"].get(str(r["toOwnerId"]), {}).get(k)
            if a is None or b is None:
                continue  # owner spoza zapytanych: weryfikator pomija
            if a and not b:
                want.append((r["toOwnerId"], k, r["ownerId"], r["toCityId"], r["id"]))
            if b and not a:
                want.append((r["ownerId"], k, r["toOwnerId"], r["fromCityId"], r["id"]))
    got = [(g["ownerId"], g["resourceKey"], g["viaOwnerId"], g["viaCityId"], g["routeId"]) for g in o["grants"]]
    chk(got == want, f"{i['name']} grants")

for c in d["civCases"]:
    m = dict(map(tuple, c["menu"]))
    if 0 not in m:
        m[0] = c["playerCiv"] or "grecy"
    for k, v in c["ai"]:
        m[k] = v
    chk(sorted(m.items()) == sorted(map(tuple, c["out"])), "civ")

for c in d["podzialCases"]:
    for tag in ("init", "seeded"):
        for oid, p in c[tag if tag == "seeded" else "init"]["pracy"]:
            chk(p["procentBudynki"] in (50, 70), f"pracy wartosc {tag}")
        for oid, h in c[tag if tag == "seeded" else "init"]["handlu"]:
            chk(h["procentPieniadz"] == 60 and h["procentLuksus"] == 20 and h["procentNauka"] in (20, 60), f"handlu wartosc {tag}")
    init_p = {oid for oid, _ in c["init"]["pracy"]}
    for oid, p in c["seeded"]["pracy"]:
        if oid in init_p:
            continue  # wpis z init zostaje (seed go nie nadpisuje)
        chk((p["procentBudynki"] == 70) == (oid in c["humanSet"]), f"pracy seed {oid}")
    init_h = {oid for oid, _ in c["init"]["handlu"]}
    for oid, h in c["seeded"]["handlu"]:
        if oid in init_h:
            continue
        chk((h["procentNauka"] == 20) == (oid in c["humanSet"]), f"handlu seed {oid}")

print(f"sprawdzen OK={n_ok} rozbieznosci={len(bad)}")
for b in bad[:20]:
    print("ROZBIEZNOSC:", b)
sys.exit(1 if bad else 0)
