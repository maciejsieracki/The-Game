#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.M12.

Reimplementuje w Pythonie z KODU TS (specyfikacja: clusters.ts :3373-4250 `computeClusters`,
cluster-spawn.ts :210-445 `buildClusterSpawnPlan`, gen-helpers.ts :5614 `buildSeaDistanceField`,
civ-names.ts / city-names-pool.ts - wybor nazw; pin edb8fb56), BEZ wykonywania TS, BEZ generatora,
BEZ Rust, i porownuje wynik z wektorami z uruchomionego weba (tests/p6_m12_vectors/web-vectors.json).

Dodatkowo:
  - wyciaga regexem z TS (po numerach linii pinu) literaly `computeClusters` / `buildClusterSpawnPlan`
    i porownuje je z tabela `data/derived/mapgen-cluster-compute.json` (oraz sprawdza obecnosc
    stalych algorytmicznych nazwanych `const` w Rust),
  - zaleznosci (funkcje M09/M10/M11) bierze z ICH niezaleznych weryfikatorow uruchamianych BEZ
    ZMIAN (`dep-verify-m11-vectors.py` -> `dep-verify-m10-vectors.py`, `dep-verify-m09-vectors.py`);
    ich wlasne sprawdzenia licza sie do wyniku, a ich funkcje (pick_spawn, land_gate, enforce_*,
    pack, Cache, GMap, Rand ...) sa uzywane jako zaleznosci (niezaleznosc dotyczy KODU, nie zrodla
    wiedzy: arbitrem sa wektory z Node).

Uzycie: verify-m12-vectors.py <WEB_ROOT> <M12_VECTORS> <COMPUTE_TABLE> <M11_VECTORS> <LAYOUT_TABLE>
            <M10_VECTORS> <M10_MASS_TABLE> <M10_START_TABLE> <M09_VECTORS> <M09_MAPS> <M09_TABLE>
Zmienne srodowiskowe: M12_MAX_HEXES (domyslnie bez limitu) - pomija mapy wieksze niz limit i RAPORTUJE
liczbe pominietych przypadkow (pominiete NIE sa zweryfikowane w Pythonie).
Kod wyjscia: 0 = 0 rozbieznosci (razem z zaleznosciami).
"""
import contextlib
import io
import json
import math
import os
import re
import sys
import time

(web_root, vec_path, tbl_path, m11_vec, layout_tbl, m10_vec, m10_mass_tbl, m10_start_tbl, m09_vec, m09_maps, m09_tbl) = sys.argv[1:12]
HERE = os.path.dirname(os.path.abspath(__file__))
MAX_HEXES = int(os.environ.get("M12_MAX_HEXES", "0"))
# R2: M12_ONLY_TAGGED=1 - tylko przypadki dopisane w rundzie 2 (maja pole `tag`); do szybkiej kontroli. Pelny przebieg: bez zmiennej.
ONLY_TAGGED = os.environ.get("M12_ONLY_TAGGED") == "1"

# ----------------------------------------------------------------------------------------------
# 0. Zaleznosci: uruchom niezalezny weryfikator M11 (a przez niego M10 i M09) bez zmian
# ----------------------------------------------------------------------------------------------
dep_checks = 0
dep_bad = 0


def run_dep(path, argv):
    global dep_checks, dep_bad
    ns = {"__name__": "dep", "__file__": path}
    old_argv = sys.argv
    sys.argv = [path] + argv
    out = io.StringIO()
    code = None
    try:
        with contextlib.redirect_stdout(out):
            exec(compile(open(path, encoding="utf-8").read(), path, "exec"), ns)
    except SystemExit as e:
        code = e.code
    finally:
        sys.argv = old_argv
    # M11 liczy swoje zaleznosci osobno (dep_checks/dep_bad) - sumujemy wszystko
    dep_checks += ns["checks"] + ns.get("dep_checks", 0)
    dep_bad += ns["bad"] + ns.get("dep_bad", 0)
    print(f"[zaleznosc] {os.path.basename(path)}: sprawdzen {ns['checks']} (+ {ns.get('dep_checks', 0)} z jego zaleznosci), rozbieznosci {ns['bad']} (+ {ns.get('dep_bad', 0)}), exit {code}")
    if ns["bad"] or ns.get("dep_bad", 0):
        print(out.getvalue()[-2000:])
    return ns


N11 = run_dep(os.path.join(HERE, "dep-verify-m11-vectors.py"), [web_root, m11_vec, layout_tbl, m10_vec, m10_mass_tbl, m10_start_tbl, m09_vec, m09_maps, m09_tbl])

V = json.load(open(vec_path, encoding="utf-8"))
TB = json.load(open(tbl_path, encoding="utf-8"))
CL = open(f"{web_root}/gra/src/map/clusters.ts", encoding="utf-8").read().split("\n")
CS = open(f"{web_root}/gra/src/map/cluster-spawn.ts", encoding="utf-8").read().split("\n")
CIVS = json.load(open(f"{web_root}/gra/data/civs.json", encoding="utf-8"))
POOLS = json.load(open(f"{web_root}/gra/data/city-names-pools.json", encoding="utf-8"))
CASES = V["cases"]

checks = 0
bad = 0


def check(cond, msg):
    global checks, bad
    checks += 1
    if not cond:
        bad += 1
        if bad <= 40:
            print("ROZBIEZNOSC:", msg)


# ----------------------------------------------------------------------------------------------
# Funkcje i stale z zaleznosci
# ----------------------------------------------------------------------------------------------
GMap = N11["GMap"]
Cache = N11["Cache"]
Rand = N11["Rand"]
group_masses = N11["N10"]["group_masses"]
roster_for_epoch = N11["N10"]["roster_for_epoch"]
roster_ts = N11["N10"]["roster_ts"]
AKTYWNE = N11["N10"]["AKTYWNE"]
map_size_label = N11["N10"]["map_size_label"]
place = N11["N10"]["place"]
pick_player = N11["pick_player"]
reorder = N11["N10"]["reorder"]
fnv = N11["fnv"]
digest = N11["digest"]
habitable = N11["N10"]["habitable"]
hd = N11["hd"]
H = N11["H"]
pick_spawn = N11["pick_spawn"]
land_gate = N11["land_gate"]
assign_types = N11["assign_types"]
voronoi = N11["voronoi"]
enforce_local = N11["enforce_local"]
enforce_hard = N11["enforce_hard"]
enforce_body = N11["enforce_body"]
enforce_quarter = N11["enforce_quarter"]
repack_one = N11["repack_one"]
pack = N11["pack"]
rival_cities = N11["rival_cities"]
cap_hex = N11["cap_hex"]
cap_pos = N11["cap_pos"]
foreign_bufs = N11["foreign_bufs"]
cities_list = N11["cities_list"]
anchor_dict = N11["anchor_dict"]
sep_gate = N11["sep_gate"]
ladder = N11["ladder"]
for_map = N11["for_map"]
cap_min_sea = N11["cap_min_sea"]
body_buffer = N11["body_buffer"]
sea_at_map = N11["sea_at_map"]
passes_player = N11["passes_player"]
shuffle_with = N11["shuffle_with"]
mix = N11["mix"]
k_out = N11["k_out"]
SEP = N11["SEP"]
PLACE_ADD = N11["PLACE_ADD"]
FOREIGN_IN = N11["FOREIGN_IN"]
RESERVE = N11["RESERVE"]
MIN_START = N11["MIN_START"]
MAX_HEX = N11["MAX_HEX"]
LABELS = N11["LABELS"]

# ----------------------------------------------------------------------------------------------
# 1. Literaly z TS (numery linii pinu) vs tabela silnika
# ----------------------------------------------------------------------------------------------
NUM = r"(-?\d+(?:\.\d+)?)"


def line(n):
    return CL[n - 1]


def sline(n):
    return CS[n - 1]


def num(rx, text):
    m = re.search(rx, text)
    check(m is not None, f"regex {rx} nie pasuje do: {text}")
    return float(m.group(1)) if m else None


RYW_DEFAULT = int(num(r"opts\?\.rywaleNaKlaster \?\? " + NUM, line(3398)))
DEFAULT_SEED = int(num(r"opts\?\.seed \?\? " + NUM, line(3396)))
DK_MIN = int(num(r"Math\.max\(" + NUM + r", Math\.floor\(shortSide / ", line(3433)))
DK_DIV = int(num(r"Math\.floor\(shortSide / " + NUM + r"\)", line(3433)))
MB_MIN = int(num(r"Math\.max\(" + NUM + r", Math\.floor\(minDystKlastrow / ", line(3463)))
MB_DIV = int(num(r"Math\.floor\(minDystKlastrow / " + NUM + r"\)", line(3463)))
TU_MIN = []
TU_DIV = []
for ln in (4054, 4069):
    TU_MIN.append(int(num(r"Math\.max\(" + NUM + r", Math\.floor\(minDystKlastrow / ", line(ln))))
    TU_DIV.append(int(num(r"Math\.floor\(minDystKlastrow / " + NUM + r"\)", line(ln))))
MIN_OBCY_FIXED = int(num(r"MIN_DIST_FOREIGN_FROM_PLAYER = " + NUM + r";", line(54)))
check(RYW_DEFAULT == TB["domyslne"]["rywale_na_klaster"]["wartosc"], "tabela rywale domyslni")
check(DK_MIN == TB["dystans_klastrow"]["min_zapas_krotszy_bok"]["wartosc"], "tabela dystans zapas")
check(DK_DIV == TB["dystans_klastrow"]["dzielnik_krotszego_boku"]["wartosc"], "tabela dystans dzielnik")
check(MB_MIN == TB["margines_brzegu"]["minimum"]["wartosc"], "tabela margines minimum")
check(MB_DIV == TB["margines_brzegu"]["dzielnik_dystansu_klastrow"]["wartosc"], "tabela margines dzielnik")
check(len(set(TU_MIN)) == 1 and TU_MIN[0] == TB["region_dopelnienia"]["minimum_promienia"]["wartosc"], "tabela top-up minimum (:4054 i :4069)")
check(len(set(TU_DIV)) == 1 and TU_DIV[0] == TB["region_dopelnienia"]["dzielnik_dystansu_klastrow"]["wartosc"], "tabela top-up dzielnik (:4054 i :4069)")
# stale algorytmiczne (nazwane const w Rust): obecnosc w TS
check("0xca041a01" in sline(283), "maska ziarna gracza :283")
check("0xca041a02" in sline(304), "maska ziarna gracza (retry) :304")
check("0x9e3779b1" in line(3972), "mnoznik ziarna per klaster :3972")
XOR1 = 0xCA041A01
XOR2 = 0xCA041A02
KI_MUL = 0x9E3779B1
M32 = 0xFFFFFFFF

# ROSTER z tekstu TS (clusters.ts:69-85)
rm = re.search(r"const ROSTER_KLUCZE: string\[\] = \[([\s\S]*?)\];", "\n".join(CL))
ROSTER = re.findall(r"'([^']+)'", rm.group(1))
check(ROSTER == roster_ts, "ROSTER_KLUCZE == roster z weryfikatora M10")


# ----------------------------------------------------------------------------------------------
# 2. Pole morza (gen-helpers.ts:5614) i mapy
# ----------------------------------------------------------------------------------------------
C2T = {"m": "morze", "p": "plytkie_morze", "l": "laka", "r": "rownina", "w": "wzgorza", "g": "gory", "u": "pustynia", "o": "polarny"}
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]


def sea_field(rep):
    """buildSeaDistanceField: BFS od Morza / Plytkiego Morza po 6 sasiadach, tylko hexy mapy."""
    w, h = rep["w"], rep["h"]
    keys = {}
    order = []
    for i, ch in enumerate(rep["terrain"]):
        q, r = i % w, i // w
        keys[(q, r)] = C2T[ch]
        order.append((q, r))
    dist = {}
    queue = []
    for k in order:
        if keys[k] in ("morze", "plytkie_morze"):
            dist[k] = 0
            queue.append(k)
    qi = 0
    while qi < len(queue):
        k = queue[qi]
        qi += 1
        d = dist[k]
        for dq, dr in DIRS:
            nk = (k[0] + dq, k[1] + dr)
            if nk in dist:
                continue
            if nk not in keys:
                continue
            dist[nk] = d + 1
            queue.append(nk)
    return order, dist


def sea_sig(order, dist):
    parts = [f"{q},{r}={dist[(q, r)]}" if (q, r) in dist else f"{q},{r}=-" for (q, r) in order]
    return {"n": len(dist), "fnv": fnv(";".join(parts))}


MAPS12 = {}
CACHES12 = {}
for mid, rep in V["maps"].items():
    order, dist = sea_field(rep)
    arr = [dist.get(k, -1) for k in order]
    gm = GMap(dict(rep, sea=arr))
    MAPS12[mid] = gm
    lad = [h for h in gm.order if habitable(gm.t[h])]
    CACHES12[mid] = Cache(group_masses(lad)) if lad else Cache([])

for c in CASES["seaField"]:
    rep = V["maps"][c["map"]]
    order, dist = sea_field(rep)
    check(sea_sig(order, dist) == c["sea"], f"seaField {c['map']}")


# ----------------------------------------------------------------------------------------------
# 3. computeClusters (clusters.ts:3373-4250) z kodu TS
# ----------------------------------------------------------------------------------------------
def jsfloor(x):
    return x if (isinstance(x, float) and math.isinf(x)) else math.floor(x)


def clusters_out(klastry):
    return [k_out(k) for k in klastry]


def compute_clusters(gm, o):
    seed = o["seed"] if "seed" in o else DEFAULT_SEED
    player_typ = o["playerTyp"] if "playerTyp" in o else ROSTER[0]
    state_count = o["rywale"] if "rywale" in o else RYW_DEFAULT
    min_mp = o["minDystans"] if "minDystans" in o else MIN_START
    rand = Rand(seed)

    qs = [h[0] for h in gm.order]
    rs = [h[1] for h in gm.order]
    min_q, max_q, min_r, max_r = (min(qs), max(qs), min(rs), max(rs)) if gm.order else (math.inf, -math.inf, math.inf, -math.inf)
    W = max_q - min_q + 1
    Hh = max_r - min_r + 1
    label = map_size_label(W, Hh)
    requested = o["aktywneTypy"] if "aktywneTypy" in o else AKTYWNE[label]
    rows = CIVS["cywilizacje"] if o.get("roster") else None
    epoch_roster = roster_for_epoch(rows, o.get("epoch"))
    roster_cap = len(epoch_roster) if len(epoch_roster) > 0 else len(ROSTER)
    n_typy = min(requested, roster_cap)
    min_cap_sep_early = for_map(lambda l: SEP[l], label, W, Hh)
    center_sep = for_map(lambda l: SEP[l] + PLACE_ADD, label, W, Hh)
    short_side = min(W, Hh)
    if "minDystKl" in o:
        mdk = o["minDystKl"]
    else:
        mdk = center_sep if center_sep > 0 else (min_cap_sep_early if min_cap_sep_early > 0 else max(DK_MIN, jsfloor(short_side / DK_DIV)))
    min_obcy = max(MIN_OBCY_FIXED, mdk)

    ladowe = [h for h in gm.order if habitable(gm.t[h])]
    if not ladowe:
        return {"rozmiar": label, "aktywne": 0, "requested": n_typy, "minDyst": min_mp, "maxDyst": MAX_HEX, "minObcy": min_obcy, "playerTypIndex": 0, "klastry": [], "cache": None, "_diag": None}

    shuffled = list(ladowe)
    shuffle_with(shuffled, rand)

    map_center = ((min_q + max_q) / 2, (min_r + max_r) / 2)
    margin = max(MB_MIN, math.floor(mdk / MB_DIV))
    min_sea = for_map(cap_min_sea, label, W, Hh)
    min_sep = for_map(lambda l: SEP[l], label, W, Hh)
    s_cluster = for_map(lambda l: SEP[l], label, W, Hh)
    buf = body_buffer(s_cluster)
    cache = Cache(group_masses(ladowe))
    xs = [h[0] for h in ladowe]
    ys = [h[1] for h in ladowe]
    bbox = {"minQ": min(xs), "maxQ": max(xs), "minR": min(ys), "maxR": max(ys)}

    def pk(prior, msep, req_local, req_player=False, preferred=None, progressive=False):
        oo = {
            "useSea": True,
            "minSea": min_sea,
            "maxSea": None,
            "prior": [list(p) for p in prior],
            "minSep": msep,
            "bbox": bbox,
            "spreadN": n_typy,
            "preferred": list(preferred) if preferred else None,
            "progressive": progressive,
            "reqPlayer": req_player,
            "reqLocal": req_local,
        }
        return pick_spawn(gm, cache, ladowe, map_center, rand, oo)

    gate = {"bbox": bbox, "spreadN": n_typy}

    centrumy = list(place(gm, ladowe, cache, n_typy, mdk, map_center, rand, margin, (min_q, max_q, min_r, max_r), True, min_sea))
    while len(centrumy) < n_typy:
        cap = pk(centrumy, mdk, True, len(centrumy) == 0, None, False)
        if not cap:
            break
        centrumy.append(cap)

    roster_source = epoch_roster if len(epoch_roster) > 0 else ROSTER
    player_klucz = player_typ if player_typ in roster_source else roster_source[0]

    active = list(centrumy)
    regiony = voronoi(ladowe, active)
    if regiony is None:
        return None  # web: TypeError
    placeholder = [player_klucz if i == 0 else f"typ{i}" for i in range(len(active))]
    dom = enforce_local(gm, cache, active, regiony, placeholder, ladowe, rand, mdk, map_center, True, min_sea)
    if dom is None:
        return None
    active = dom["centrumy"]
    regiony = dom["regiony"]

    roster_bez = reorder([k for k in roster_source if k != player_klucz], o.get("preferred"))
    foreign_slice = roster_bez[: max(0, n_typy - 1)]
    klucze = assign_types(active, cache.masses, player_klucz, foreign_slice, rand)
    while len(klucze) < len(active):
        klucze.append(f"typ{len(klucze)}")

    while len(active) < n_typy:
        cap = pk(active, mdk, len(active) < n_typy - 1, False, None, True)
        if not cap:
            last = pk(active, mdk, False, False, None, True)
            if not last:
                break
            active.append(last)
        else:
            active.append(cap)
    if len(active) > len(regiony) or len(active) > len(klucze):
        regiony = voronoi(ladowe, active)
        if regiony is None:
            return None
        klucze = assign_types(active, cache.masses, player_klucz, foreign_slice, rand)
        while len(klucze) < len(active):
            klucze.append(f"typ{len(klucze)}")

    klastry = []
    cregions = []
    placed = []

    pcentrum = active[0]
    pregion = regiony[0]
    plr = land_gate(gm, cache, pregion, pcentrum, state_count, min_mp, rand, None, seed, [], mdk, True, min_sea, [], min_sep)
    pcf = pcentrum
    if plr:
        player = {"cities": plr["cities"], "growth": plr["growth"]}
        pcf = plr["centrum"]
    else:
        forced = pick_player(gm, cache, ladowe, map_center, rand, True, min_sea)
        if forced:
            pcf = forced
            player = {"cities": [[forced[0], forced[1], True]], "growth": None}
        else:
            player = {"cities": [], "growth": None}
    pcap = cap_pos(player["cities"], pcf)

    def resolve():
        nonlocal pcf, pcap, player
        r = pk(placed, min_sep, True, True, pcap, False)
        if not r:
            return
        pcf = r
        pcap = r
        player = {"cities": [[r[0], r[1], True]], "growth": None}

    if not passes_player(gm, cache, pcap[0], pcap[1]):
        resolve()

    if min_sea > 0 and not (sea_at_map(gm, pcap[0], pcap[1]) >= min_sea):
        fixed = pk(placed, min_sep, True, True, None, False)
        if fixed:
            rl = land_gate(gm, cache, pregion, fixed, state_count, min_mp, rand, None, seed, [], mdk, True, min_sea, list(placed), min_sep)
            if rl:
                capm = next((m for m in rl["cities"] if m[2]), None)
                cq = (capm[0], capm[1]) if capm else fixed
                good = sea_at_map(gm, cq[0], cq[1]) >= min_sea and sep_gate(cap_pos(rl["cities"], fixed), placed, min_sep)
            else:
                good = False
            if rl and good:
                player = {"cities": rl["cities"], "growth": rl["growth"]}
                pcf = rl["centrum"]
                cm = next((m for m in rl["cities"] if m[2]), None) or (rl["cities"][0] if rl["cities"] else None)
                pcap = (cm[0], cm[1]) if cm else fixed
            elif sea_at_map(gm, fixed[0], fixed[1]) >= min_sea and sep_gate(fixed, placed, min_sep):
                pcf = fixed
                pcap = fixed
                player = {"cities": [[fixed[0], fixed[1], True]], "growth": None}

    if min_sep > 0 and not sep_gate(pcap, placed, min_sep):
        resolve()

    placed.append(pcap)

    pslots = rival_cities(ladowe, pcap, state_count, min_mp, seed, map_center)
    ax = N11["axis_for"](pcap, map_center, seed)
    st, gs = pack(ladowe, pregion, pcap, state_count, min_mp, seed, pcap, None, RESERVE, ax, [])
    if len(st) > 0:
        player = {"cities": cities_list(pcap, st), "growth": gs}

    klastry.append({
        "typIndex": 0,
        "typ": klucze[0] if (len(klucze) > 0 and klucze[0] is not None) else player_klucz,
        "centrum": pcf,
        "miasta": player["cities"],
        "pending": pslots,
        "growth": player["growth"] if player["growth"] is not None else "null",
    })
    cregions.append(pregion)

    for ci in range(1, len(active)):
        centrum = active[ci]
        region = regiony[ci]
        fl = land_gate(gm, cache, region, centrum, state_count, FOREIGN_IN, rand, [pcap[0], pcap[1], min_obcy], seed, list(active[:ci]), mdk, True, min_sea, list(placed), min_sep)
        if fl is None or len(fl["cities"]) == 0:
            rc = pk(placed, min_sep, True, False, centrum, True)
            if rc:
                fl = {"cities": [[rc[0], rc[1], True]], "pending": [], "growth": None, "centrum": rc}
                active[ci] = rc
        if fl is None or len(fl["cities"]) == 0:
            lc = pk(placed, min_sep, False, False, centrum, True)
            if lc:
                fl = {"cities": [[lc[0], lc[1], True]], "pending": [], "growth": None, "centrum": lc}
                active[ci] = lc
        if fl is None or len(fl["cities"]) == 0:
            continue
        fc = next((m for m in fl["cities"] if m[2]), fl["cities"][0])
        fcap = (fc[0], fc[1])
        lad = ladder(min_sea)
        soft = lad[-1] if lad else 0
        if soft > 0 and not (sea_at_map(gm, fcap[0], fcap[1]) >= soft):
            continue
        if not sep_gate(fcap, placed, min_sep):
            continue
        anchor = {"q": pcap[0], "r": pcap[1], "minDist": min_obcy}
        bufs = foreign_bufs(klastry, len(klastry), buf)
        st, gs = pack(ladowe, region, fcap, state_count, FOREIGN_IN, mix(seed, ci, KI_MUL), fcap, anchor, None, None, bufs)
        growth = gs if gs is not None else fl["growth"]
        klastry.append({
            "typIndex": len(klastry),
            "typ": klucze[ci] if (ci < len(klucze) and klucze[ci] is not None) else f"typ{ci}",
            "centrum": fl["centrum"],
            "miasta": cities_list(fcap, st),
            "pending": None,
            "growth": growth if growth is not None else "null",
        })
        cregions.append(region)
        placed.append(fcap)

    # FALA 193: top-up po `continue`
    used = {k["typ"] for k in klastry}
    unused = []
    for k in [x for x in roster_source if x != player_klucz and x not in used] + [x for x in klucze if x != player_klucz and x not in used]:
        if k not in unused:
            unused.append(k)
    top_r = max(TU_MIN[0], math.floor(mdk / TU_DIV[0]))
    key_idx = 0
    while len(klastry) < n_typy:
        cap = pk(placed, min_sep, False, False, None, True)
        if not cap:
            break
        if hd(cap, pcap) < min_obcy:
            alt = pk(list(placed) + [pcap], max(min_sep, min_obcy), False, False, None, True)
            if not alt:
                break
            typ = unused[key_idx] if key_idx < len(unused) else f"typ{len(klastry)}"
            key_idx += 1
            klastry.append({"typIndex": len(klastry), "typ": typ, "centrum": alt, "miasta": [[alt[0], alt[1], True]], "pending": [], "growth": "null"})
            cregions.append([h for h in ladowe if hd(h, alt) <= top_r])
            placed.append(alt)
            continue
        typ = unused[key_idx] if key_idx < len(unused) else f"typ{len(klastry)}"
        key_idx += 1
        klastry.append({"typIndex": len(klastry), "typ": typ, "centrum": cap, "miasta": [[cap[0], cap[1], True]], "pending": [], "growth": "null"})
        cregions.append([h for h in ladowe if hd(h, cap) <= top_r])
        placed.append(cap)

    # FALA 185: repack MP gracza z buforami obcych
    if len(klastry) > 0 and len(klastry[0]["miasta"]) > 0:
        pc = cap_hex(klastry[0]) or pcap
        bufs = foreign_bufs(klastry, 0, buf)
        reg0 = cregions[0] if len(cregions) > 0 else pregion
        ax2 = N11["axis_for"](pc, map_center, seed)
        st, gs = pack(ladowe, reg0, pc, state_count, min_mp, seed, pc, None, RESERVE, ax2, bufs)
        if len(st) > 0 or gs is not None:
            klastry[0]["miasta"] = cities_list(pc, st)
            klastry[0]["pending"] = st
            klastry[0]["growth"] = gs if gs is not None else "null"

    enforce_hard(gm, cache, klastry, cregions, rand, True, min_sea, min_sep, min_obcy, ladowe, seed, state_count, map_center, min_mp, gate)
    enforce_body(gm, cache, klastry, cregions, rand, True, min_sea, s_cluster, min_sep, min_obcy, ladowe, seed, state_count, map_center, min_mp, buf, gate)

    if len(klastry) < n_typy:
        caps_now = [cap_hex(k) for k in klastry if cap_hex(k)]
        used = {k["typ"] for k in klastry}
        unused = [k for k in roster_source if k not in used]
        key_idx = 0
        while len(klastry) < n_typy:
            cap = pk(caps_now, min_sep, False, False, None, True)
            if not cap:
                break
            typ = unused[key_idx] if key_idx < len(unused) else f"typ{len(klastry)}"
            key_idx += 1
            klastry.append({"typIndex": len(klastry), "typ": typ, "centrum": cap, "miasta": [[cap[0], cap[1], True]], "pending": [], "growth": "null"})
            cregions.append([])
            caps_now.append(cap)

    enforce_quarter(gm, cache, klastry, cregions, ladowe, bbox, n_typy, rand, True, min_sea, min_sep, min_obcy, seed, state_count, map_center, min_mp, buf)

    for ki in range(len(klastry)):
        repack_one(klastry, ki, state_count, min_obcy, ladowe, seed, buf, map_center, min_mp)

    # dziennik diagnostyczny (clusters.ts:4225-4235): `regiony[ci]!.length` rzuca, gdy brak regionu
    diag = None
    for ki, k in enumerate(klastry):
        if len(k["miasta"]) < state_count + 1 and ki >= len(regiony):
            diag = ki
            break
    placed_typy = len([k for k in klastry if len(k["miasta"]) > 0])
    seaorder = gm.order
    seasig = sea_sig(seaorder, gm.sea)
    cache_out = {
        "ladoweN": len(ladowe),
        "ladoweFnv": digest(ladowe),
        "massesN": len(cache.masses),
        "massSizes": [len(m) for m in cache.masses],
        "massesFnv": fnv("|".join(digest(m) for m in cache.masses)),
        "sea": seasig,
    }
    return {
        "rozmiar": label,
        "aktywne": placed_typy,
        "requested": n_typy,
        "minDyst": min_mp,
        "maxDyst": MAX_HEX,
        "minObcy": min_obcy,
        "playerTypIndex": 0,
        "klastry": clusters_out(klastry),
        "cache": cache_out,
        "_diag": diag,
    }


def result_matches(got, want):
    if got is None:
        return False
    g = dict(got)
    g.pop("_diag", None)
    w = dict(want)
    gc = g.pop("cache")
    wc = w.pop("cache")
    if g != w:
        return False
    if gc is None or wc is None:
        return gc is None and wc is None
    wc2 = {k: v for k, v in wc.items() if k != "seaEqualsField"}
    return gc == wc2


STATS = {"compute_checked": 0, "compute_skipped": 0, "threw": 0}


def too_big(mid):
    return MAX_HEXES and V["maps"][mid]["w"] * V["maps"][mid]["h"] > MAX_HEXES


t0 = time.time()
for c in CASES["compute"]:
    if ONLY_TAGGED and "tag" not in c:
        continue
    if too_big(c["map"]):
        STATS["compute_skipped"] += 1
        continue
    gm = MAPS12[c["map"]]
    got = compute_clusters(gm, c["spec"])
    if c["threw"]:
        check(got is not None and got.get("_diag") is not None, f"compute {c['map']} {c['spec']}: web rzuca (dziennik), weryfikator nie")
        if "noDiagResult" in c:
            check(result_matches(got, c["noDiagResult"]), f"compute {c['map']} {c['spec']}: wynik sprzed rzucenia (kopia bez dziennika)")
        STATS["threw"] += 1
    else:
        check(got is not None and got.get("_diag") is None and result_matches(got, c["result"]), f"compute {c['map']} {c['spec']}")
    STATS["compute_checked"] += 1
print(f"compute: {STATS} czas {time.time() - t0:.0f}s")


# ----------------------------------------------------------------------------------------------
# 4. buildClusterSpawnPlan (cluster-spawn.ts:210-445) + nazwy (civ-names.ts, city-names-pool.ts)
# ----------------------------------------------------------------------------------------------
def with_suffix(base, ordinal):
    if ordinal <= 1:
        return base
    roman = ["", "", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
    suffix = roman[ordinal] if ordinal <= 10 else str(ordinal)
    return f"{base} {suffix}"


def pick_next_from_names(names, used, fallback="Miasto"):
    for n in names:
        if n and n not in used:
            return n
    base = next((n for n in names if n), fallback)
    if not any(names) and base not in used:
        return base
    ordinal = 2
    while with_suffix(base, ordinal) in used or with_suffix(base, ordinal) in names:
        ordinal += 1
    return with_suffix(base, ordinal)


# R2: `spec.namesLimit` skraca listy nazw (civs `nazwyMiast` i pule) do n wpisow (jak w generatorze/Rust).
NAMES_LIMIT = None


def common_names(pools, ikona):
    e = pools.get(ikona)
    if not e:
        return []
    names = e["miasta_cywilizacji"][:110]
    return names[:NAMES_LIMIT] if NAMES_LIMIT is not None else names


def civ_names(ikona):
    for c in CIVS["cywilizacje"]:
        if c.get("ikonaId") == ikona:
            nm = c.get("nazwyMiast")
            return nm[:NAMES_LIMIT] if (nm is not None and NAMES_LIMIT is not None) else nm
    return None


def klastra_names(ikona):
    nm = civ_names(ikona)
    # JS: `def?.nazwyMiast ? ... : ...` - pusta tablica jest PRAWDZIWA (w odroznieniu od Pythona)
    if nm is not None:
        return nm[100:110]
    for c in CIVS["cywilizacje"]:
        if c.get("ikonaId") == ikona:
            return c.get("nazwyKlastra", [])
    return []


def klastra_at(names, index, fallback):
    if 0 <= index < len(names) and names[index]:
        return names[index]
    return fallback


def player_name(pools, typ):
    if pools and typ in pools:
        return pick_next_from_names(common_names(pools, typ), set(), "Stolica")
    cn = civ_names(typ) or []
    if len(cn) > 0:
        return pick_next_from_names(cn, set(), "Stolica")
    return klastra_at(klastra_names(typ), 0, "Stolica")


def foreign_cap_name(pools, typ, used):
    if pools and typ in pools:
        return pick_next_from_names(common_names(pools, typ), used, typ)
    cn = civ_names(typ) or []
    if len(cn) > 0:
        return pick_next_from_names(cn, used, typ)
    return klastra_at(klastra_names(typ), 0, typ)


def rival_name(pools, typ, idx, used):
    if pools and typ in pools:
        fallback = f"Rywal {idx}"
        if idx < 1:
            return fallback
        return pick_next_from_names(common_names(pools, typ), used, fallback)
    cn = civ_names(typ) or []
    if len(cn) > 0 and idx >= 1:
        return pick_next_from_names(cn, used, f"Rywal {idx}")
    names = klastra_names(typ)
    if not len(names):
        return f"Rywal {idx}"
    i2 = idx - 1 if idx >= 1 else idx
    return klastra_at(names, i2, f"Rywal {idx}")


def build_spawn_plan(mid, gm, spec):
    """Zwraca None gdy web rzuca (computeClusters)."""
    global NAMES_LIMIT
    NAMES_LIMIT = spec.get("namesLimit")
    o = {"seed": spec["seed"], "playerTyp": spec["playerTyp"], "rywale": spec["rywale"], "roster": True}
    if "aktywneTypy" in spec:
        o["aktywneTypy"] = spec["aktywneTypy"]
    if "epoch" in spec:
        o["epoch"] = spec["epoch"]
    if "preferred" in spec:
        o["preferred"] = spec["preferred"]
    place_out = compute_clusters(gm, o)
    if place_out is None or place_out.get("_diag") is not None:
        return None  # web rzuca (dziennik diagnostyczny computeClusters)
    pools = POOLS if spec.get("pools") else None
    seed = spec["seed"]
    player_typ = spec["playerTyp"]
    pl = place_out["klastry"][place_out["playerTypIndex"]] if place_out["playerTypIndex"] < len(place_out["klastry"]) else None
    if pl is None or len(pl["miasta"]) == 0:
        return {
            "playerStartHex": [0, 0],
            "playerStartCityName": player_name(pools, player_typ),
            "slots": [],
            "foreign": [],
            "pendingRivals": spec["rywale"],
            "pendingHexes": [],
            "clusterCapIds": [],
            "pendingOwnerIds": [],
            "placement": place_out,
        }
    cap = next((m for m in pl["miasta"] if m[2]), pl["miasta"][0])
    cap_pos_raw = (cap[0], cap[1])
    cache = CACHES12[mid]
    # landPool = spawnCache.ladowe; seaDist = spawnCache.seaDist
    ladowe = [h for h in gm.order if habitable(gm.t[h])]
    W, Hh = gm.w, gm.h
    label = place_out["rozmiar"]
    min_sea = for_map(cap_min_sea, label, W, Hh)
    min_sep = for_map(lambda l: SEP[l], label, W, Hh)
    planned = []
    for k in place_out["klastry"]:
        if k["typIndex"] == place_out["playerTypIndex"]:
            continue
        fc = next((m for m in k["miasta"] if m[2]), k["miasta"][0] if k["miasta"] else None)
        if fc:
            planned.append((fc[0], fc[1]))
    cpos = cap_pos_raw
    mc = ((gm.w - 1) / 2, (gm.h - 1) / 2)

    def pick_player_cap(xor, preferred):
        rr = Rand((seed ^ xor) & M32)
        oo = {"useSea": True, "minSea": min_sea, "maxSea": None, "prior": [list(p) for p in planned], "minSep": min_sep, "bbox": None, "spreadN": None, "preferred": list(preferred) if preferred else None, "progressive": False, "reqPlayer": True, "reqLocal": True}
        return pick_spawn(gm, cache, ladowe, mc, rr, oo)

    r1 = pick_player_cap(XOR1, cpos)
    if r1:
        cpos = r1
    else:
        r2 = pick_player_cap(XOR2, None)
        if r2:
            cpos = r2
    N10h = N11["N10"]
    slots = []
    next_owner = 1
    placed_caps = [cpos]
    pending_hexes = [tuple(h) for h in (pl["pending"] or [])]
    for k in place_out["klastry"]:
        if k["typIndex"] == place_out["playerTypIndex"]:
            continue
        fc = next((m for m in k["miasta"] if m[2]), k["miasta"][0] if k["miasta"] else None)
        if not fc:
            continue
        if not N10h["passes_local"](gm, fc[0], fc[1]):
            continue
        if not sep_gate((fc[0], fc[1]), placed_caps, min_sep):
            continue
        for m in k["miasta"]:
            slots.append({"ownerId": next_owner, "q": m[0], "r": m[1], "nazwa": "", "typ": k["typ"], "sameRival": False, "playerCap": False, "clusterCap": bool(m[2])})
            next_owner += 1
        placed_caps.append((fc[0], fc[1]))
    pending_ids = []
    for _ in range(max(0, spec["rywale"])):
        pending_ids.append(next_owner)
        next_owner += 1
    hard_placed = [cpos]
    accepted = []
    dropped = set()
    for s_ in slots:
        if s_["clusterCap"]:
            if not sep_gate((s_["q"], s_["r"]), hard_placed, min_sep):
                dropped.add(s_["typ"])
                continue
            hard_placed.append((s_["q"], s_["r"]))
        if s_["typ"] in dropped:
            continue
        accepted.append(s_)
    cap_ids = [s_["ownerId"] for s_ in accepted if s_["clusterCap"]]
    used_by = {}
    rival_idx = {}
    named = []
    for s_ in accepted:
        used_set = used_by.setdefault(s_["typ"], set())
        if s_["clusterCap"]:
            nm = foreign_cap_name(pools, s_["typ"], used_set)
        else:
            rival_idx[s_["typ"]] = rival_idx.get(s_["typ"], 0) + 1
            nm = rival_name(pools, s_["typ"], rival_idx[s_["typ"]], used_set)
        used_set.add(nm)
        named.append(dict(s_, nazwa=nm))
    groups = []
    for s_ in named:
        if s_["sameRival"]:
            continue
        g = next((x for x in groups if x["typ"] == s_["typ"]), None)
        if g is None:
            g = {"typ": s_["typ"], "ownerIds": [], "positions": []}
            groups.append(g)
        g["ownerIds"].append(s_["ownerId"])
        g["positions"].append([s_["q"], s_["r"]])
    return {
        "playerStartHex": [cpos[0], cpos[1]],
        "playerStartCityName": player_name(pools, player_typ),
        "slots": named,
        "foreign": groups,
        "pendingRivals": spec["rywale"],
        "pendingHexes": [list(h) for h in pending_hexes],
        "clusterCapIds": cap_ids,
        "pendingOwnerIds": pending_ids,
        "placement": place_out,
    }


def plan_matches(got, want):
    if got is None:
        return False
    g = dict(got)
    w = dict(want)
    gp = g.pop("placement")
    wp = w.pop("placement")
    if g != w:
        return False
    return result_matches(gp, wp)


SP = {"checked": 0, "skipped": 0, "threw": 0}
t0 = time.time()
for c in CASES["spawn"]:
    if ONLY_TAGGED and "tag" not in c:
        continue
    if too_big(c["map"]):
        SP["skipped"] += 1
        continue
    gm = MAPS12[c["map"]]
    got = build_spawn_plan(c["map"], gm, c["spec"])
    if c["threw"]:
        check(got is None, f"spawn {c['map']} {c['spec']}: web rzuca, weryfikator nie")
        SP["threw"] += 1
    else:
        check(plan_matches(got, c["result"]), f"spawn {c['map']} {c['spec']}")
    SP["checked"] += 1
print(f"spawn: {SP} czas {time.time() - t0:.0f}s")

total = checks + dep_checks
total_bad = bad + dep_bad
print(f"sprawdzen M12: {checks}, rozbieznosci M12: {bad}")
print(f"RAZEM (M12 + zaleznosci M11/M10/M09): {total} sprawdzen, rozbieznosci: {total_bad}")
if MAX_HEXES:
    print(f"UWAGA: limit M12_MAX_HEXES={MAX_HEXES}: pominieto compute={STATS['compute_skipped']} spawn={SP['skipped']} przypadkow (NIE zweryfikowane w Pythonie)")
sys.exit(1 if total_bad else 0)
