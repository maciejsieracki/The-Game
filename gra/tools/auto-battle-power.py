#!/usr/bin/env python3
"""
auto-battle-power.py — symulator auto-walki na mocy armii (kanon 2026-06-30).

M jednostki: intrinsic (A+O). Oblężnicze wykluczone z walki polnej.
Straty: krok 7B (zwycięzca) + 6B-C (przegrany na polu) + 9b (wagi linii) + remis 40%.

Usage (repo root):
  python gra/tools/auto-battle-power.py --scenarios
  python gra/tools/auto-battle-power.py --curve
  python gra/tools/auto-battle-power.py --field-ranking
  python gra/tools/auto-battle-power.py --fight "Hastati,Hastati" "Falanga,Falanga"
  python gra/tools/auto-battle-power.py --demo
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UNITS = ROOT / "gra" / "data" / "units.json"
PARAMS = ROOT / "gra" / "data" / "auto-battle-params.json"
sys.path.insert(0, str(Path(__file__).parent))
from unit_power import field_power, is_siege_unit, siege_power  # noqa: E402

# --- Kanon v2b — baza z auto-battle-params.json (nadpisywalne CLI) ---
CALIBRATION = "v2b-2026-06-30"


def _load_params() -> dict:
    if PARAMS.is_file():
        return json.loads(PARAMS.read_text(encoding="utf-8")).get("straty", {})
    return {}


def _apply_params(data: dict) -> None:
    global L_MAX, P_ATK, P_DEF, L_MIN, TIE_LOSS, COEF_ZWYCIECA, COEF_PRZEGRANY
    L_MAX = float(data.get("L_MAX", L_MAX))
    legacy_p = float(data.get("p", P_ATK))
    P_ATK = float(data.get("p_atk", legacy_p))
    P_DEF = float(data.get("p_def", legacy_p))
    L_MIN = float(data.get("L_MIN", L_MIN))
    TIE_LOSS = float(data.get("remis_pct", TIE_LOSS))
    COEF_ZWYCIECA = float(data.get("coef_zwyciezca", COEF_ZWYCIECA))
    COEF_PRZEGRANY = float(data.get("coef_przegrany", COEF_PRZEGRANY))


# Domyślne (gdy brak JSON)
L_MAX = 0.42
L_MIN = 0.05
P_ATK = 0.58  # panel: stromość krzywej ATK vs R (↑ = szybciej reaguje na przewagę)
P_DEF = 0.58  # panel: stromość krzywej DEF vs R
TIE_LOSS = 0.40
TIE_EPS = 0.01
COEF_ZWYCIECA = 1.0  # panel: ↑ = więcej strat zwycięzcy
COEF_PRZEGRANY = 1.0  # panel: ↑ = więcej strat przegranego
_apply_params(_load_params())

# Wagi strat wg linii (krok 9b)
LINE_WEIGHTS: dict[str, float] = {
    "Wręcz": 1.0,
    "Flanka": 0.5,
    "Dystans": 0.25,
    "Morska": 0.5,
    "Wsparcie": 0.5,  # jak konnica (roboczo)
}
DEFAULT_LINE_WEIGHT = 1.0


def n(v, default=0.0) -> float:
    if v is None or v == "" or v == "—":
        return float(default)
    return float(v)


def line_weight(u: dict) -> float:
    rola = (u.get("Rola (linia)") or "").strip()
    return LINE_WEIGHTS.get(rola, DEFAULT_LINE_WEIGHT)


def unit_m(u: dict) -> tuple[float, float, float]:
    a, o, m, _ = field_power(u)
    return a, o, m


def load_by_name() -> dict[str, dict]:
    data = json.loads(UNITS.read_text(encoding="utf-8"))
    return {u["Jednostka"]: u for u in data}


def army_from_names(names: list[str], by_name: dict[str, dict]) -> tuple[list[dict], float, list[str]]:
    units: list[dict] = []
    skipped: list[str] = []
    total = 0.0
    for nm in names:
        nm = nm.strip()
        if not nm:
            continue
        u = by_name.get(nm)
        if not u:
            raise SystemExit(f"Nieznana jednostka: {nm!r}")
        if is_siege_unit(u):
            skipped.append(nm)
            continue
        _, _, m = unit_m(u)
        units.append(u)
        total += m
    return units, round(total, 1), skipped


def is_tie(m_atk: float, m_def: float) -> bool:
    if m_atk <= 0 and m_def <= 0:
        return True
    denom = max(m_atk, m_def, 1.0)
    return abs(m_atk - m_def) / denom < TIE_EPS


def _core_loss(ratio: float, p_exp: float) -> float:
    """Rdzeń: L_MAX / R^p (dla danej strony ATK/DEF)."""
    if ratio < 1.0:
        ratio = 1.0
    return L_MAX / (ratio ** p_exp)


def _round4(x: float) -> float:
    """Odpowiednik `Math.round(x * 10000) / 10000` z runtime TS.

    Wbudowane `round()` Pythona zaokrągla „do parzystej" (bankierskie), a JS
    zaokrągla połówki w górę — na granicy 0,00005 dawało to inny wynik niż
    `auto-battle-power.ts`. Wartości strat są nieujemne, więc `floor(x+0.5)`
    odtwarza `Math.round` dokładnie.
    """
    return math.floor(x * 10000.0 + 0.5) / 10000.0


def winner_loss_pct(ratio: float, p_exp: float) -> float:
    """Straty zwycięzcy danej strony (ATK lub DEF) — parytet z `winnerLossPct` TS.

    L_MIN jest podłogą na SUMIE strat składu, nie na pojedynczej jednostce
    (R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1): zwrócony procent dotyczy jednostki,
    a skład zwycięzcy liczy ~`ratio` jednostko-równoważników, więc podłoga na
    jednostce dawała łączne straty `L_MIN × ratio`, rosnące z przewagą.

    Kolejność: zaokrąglenie NAJPIERW, podłoga POTEM. Odwrotna kolejność kasuje
    podłogę przy r ≳ 1863, bo procent na jednostkę spada poniżej 0,00005.
    """
    core = _core_loss(ratio, p_exp)
    raw = COEF_ZWYCIECA * core
    cap = min(1.0, COEF_ZWYCIECA * L_MAX)
    floor_pct = L_MIN / max(1.0, ratio)
    rounded = _round4(min(cap, raw))
    return max(floor_pct, rounded)


def loser_loss_pct(ratio: float, p_exp: float) -> float:
    """Straty przegranej strony ATK lub DEF — parytet z `loserLossPct` TS."""
    core = _core_loss(ratio, p_exp)
    return _round4(min(1.0, COEF_PRZEGRANY * (1.0 - core)))


def resolve_fight(m_atk: float, m_def: float) -> dict:
    if m_atk <= 0 and m_def <= 0:
        return {
            "winner": "none",
            "ratio": 1.0,
            "loss_atk_pct": 0.0,
            "loss_def_pct": 0.0,
        }
    if is_tie(m_atk, m_def):
        return {
            "winner": "tie",
            "ratio": 1.0,
            "loss_atk_pct": TIE_LOSS,
            "loss_def_pct": TIE_LOSS,
            "note": f"remis M (|delta|/max < {TIE_EPS:.0%})",
        }
    if m_atk > m_def:
        m_w, m_l = m_atk, m_def
        winner = "attacker"
    else:
        m_w, m_l = m_def, m_atk
        winner = "defender"
    ratio = m_w / max(m_l, 1.0)
    if winner == "attacker":
        loss_atk = winner_loss_pct(ratio, P_ATK)
        loss_def = loser_loss_pct(ratio, P_DEF)
        lw, ll = loss_atk, loss_def
    else:
        loss_def = winner_loss_pct(ratio, P_DEF)
        loss_atk = loser_loss_pct(ratio, P_ATK)
        lw, ll = loss_def, loss_atk
    return {
        "winner": winner,
        "ratio": round(ratio, 3),
        "m_winner": round(m_w, 1),
        "m_loser": round(m_l, 1),
        "loss_winner_pct": lw,
        "loss_loser_pct": ll,
        "loss_atk_pct": loss_atk,
        "loss_def_pct": loss_def,
    }


def distribute_losses(units: list[dict], loss_pct: float) -> list[dict]:
    """Krok 9b: loss_unit = min(1, loss_pct × waga_lini)."""
    out = []
    for u in units:
        hp = int(n(u.get("health"), 10))
        w = line_weight(u)
        unit_loss = min(1.0, loss_pct * w)
        lost = int(math.floor(hp * unit_loss))
        remain = max(0, hp - lost)
        _, _, m = unit_m(u)
        rola = u.get("Rola (linia)", "?")
        out.append({
            "name": u["Jednostka"],
            "rola": rola,
            "waga": w,
            "M": m,
            "loss_pct_eff": round(unit_loss * 100, 1),
            "hp_before": hp,
            "hp_after": remain,
            "dead": remain <= 0,
        })
    return out


def print_side(label: str, rows: list[dict], base_loss_pct: float) -> None:
    print(f"\n {label} (bazowy loss_pct = {base_loss_pct:.1%}):")
    if not rows:
        print("   — brak jednostek")
        return
    for row in rows:
        tag = " USUNIETY" if row["dead"] else ""
        print(
            f"   {row['name']} [{row['rola']}, waga {row['waga']:.2g}x]: "
            f"HP {row['hp_before']} -> {row['hp_after']} "
            f"(eff -{row['loss_pct_eff']:.1f}%){tag}"
        )


def print_fight(atk_names: list[str], def_names: list[str], by_name: dict[str, dict]) -> None:
    atk_u, m_atk, skip_a = army_from_names(atk_names, by_name)
    def_u, m_def, skip_d = army_from_names(def_names, by_name)
    res = resolve_fight(m_atk, m_def)

    print("=== Auto-walka (moc armii, POLE — kanon 2026-06-30) ===")
    print(f" ATK: {', '.join(atk_names) or '—'}")
    if skip_a:
        print(f"      (pominięto oblężenie: {', '.join(skip_a)})")
    print(f"      M_ATK = {m_atk}")
    print(f" DEF: {', '.join(def_names) or '—'}")
    if skip_d:
        print(f"      (pominięto oblężenie: {', '.join(skip_d)})")
    print(f"      M_DEF = {m_def}")
    print()
    w_label = {"attacker": "ATK", "defender": "DEF", "tie": "remis", "none": "—"}.get(
        res["winner"], "?"
    )
    print(f" werdykt: {w_label}")
    for k in ("ratio", "loss_winner_pct", "loss_loser_pct", "loss_atk_pct", "loss_def_pct", "note"):
        if k in res:
            print(f" {k}: {res[k]}")

    print_side("ATK", distribute_losses(atk_u, res["loss_atk_pct"]), res["loss_atk_pct"])
    print_side("DEF", distribute_losses(def_u, res["loss_def_pct"]), res["loss_def_pct"])


def print_curve_table() -> None:
    print("# Krzywe strat — kanon v2b (ATK wygrywa: p_atk zwyciezca, p_def przegrany)\n")
    print(
        f"L_MAX={L_MAX}, p_atk={P_ATK}, p_def={P_DEF}, "
        f"coef_zwyciezca={COEF_ZWYCIECA}, coef_przegrany={COEF_PRZEGRANY}, remis={TIE_LOSS:.0%}\n"
        f"ATK wygrana: win=L_MAX/R^p_atk · DEF lose=1-L_MAX/R^p_def\n"
    )
    print("| R | M_przykład (100 vs ?) | ATK (zwyc.) | DEF (przegr.) |")
    print("|--:|------------------------|------------:|--------------:|")
    for r in [1.0, 1.05, 1.10, 1.15, 1.20, 1.30, 1.50, 2.0, 3.0, 5.0, 10.0]:
        if r == 1.0:
            print(f"| {r:.2f} | remis | {TIE_LOSS:.0%} | {TIE_LOSS:.0%} |")
        else:
            w = int(100 * r)
            print(
                f"| {r:.2f} | {w} vs 100 | {winner_loss_pct(r, P_ATK):.1%} | "
                f"{loser_loss_pct(r, P_DEF):.1%} |"
            )


def print_scenarios() -> None:
    print_curve_table()
    print("\n# Scenariusze M_ATK vs M_DEF (bazowe % przed wagami linii)\n")
    print("| M_ATK | M_DEF | R | Zwycięzca | loss_win | loss_lose |")
    print("|------:|------:|--:|-----------|--------:|----------:|")
    pairs = [
        (100, 100), (105, 100), (110, 100), (115, 100), (120, 100),
        (150, 100), (200, 100), (300, 100), (500, 100), (1000, 100),
        (57, 45), (67, 57),
    ]
    for ma, md in pairs:
        r = resolve_fight(float(ma), float(md))
        if r["winner"] == "tie":
            print(f"| {ma} | {md} | 1.0 | remis | {TIE_LOSS:.0%} | {TIE_LOSS:.0%} |")
            continue
        w = "ATK" if r["winner"] == "attacker" else "DEF"
        print(
            f"| {ma} | {md} | {r['ratio']} | {w} | "
            f"{r['loss_winner_pct']:.1%} | {r['loss_loser_pct']:.1%} |"
        )


def print_demo(by_name: dict[str, dict]) -> None:
    """Playtest #1 + mała przewaga + remis — z rozbiciem na linie."""
    cases = [
        ("10× Hastati vs 10× Falanga (playtest #1)", ["Hastati"] * 10, ["Falanga"] * 10),
        ("Mała przewaga ATK (+~8%)", ["Hastati"] * 11, ["Falanga"] * 10),
        ("Remis (M_ATK = M_DEF)", ["Hastati"] * 10, ["Hastati"] * 10),
        ("Mieszany skład (front + dystans)", ["Hastati", "Hastati", "Łucznik"], ["Falanga", "Falanga", "Łucznik"]),
    ]
    for title, atk, defn in cases:
        print("\n" + "=" * 60)
        print(title)
        print("=" * 60)
        print_fight(atk, defn, by_name)


def print_siege_ranking(by_name: dict[str, dict]) -> None:
    rows = []
    for u in by_name.values():
        if not is_siege_unit(u):
            continue
        a, o, m, parts = siege_power(u)
        rows.append((u["Jednostka"], parts.get("wallAttack", 0), a, o, m))
    rows.sort(key=lambda x: (-x[4], x[0]))
    print("# Moc oblężnicza (M_siege) — §2b AUTO-WALKA-MOC-ALGORYTM\n")
    print("| Jednostka | wallAttack | A | O | **M_siege** |")
    print("|-----------|----------:|--:|--:|------------:|")
    for name, wall, a, o, m in rows:
        print(f"| {name} | {int(wall)} | {a} | {o} | **{m}** |")


def print_field_ranking(by_name: dict[str, dict]) -> None:
    rows = []
    for u in by_name.values():
        if is_siege_unit(u):
            continue
        a, o, m, _ = field_power(u)
        rows.append((u["Jednostka"], u.get("Rola (linia)", ""), a, o, m))
    rows.sort(key=lambda x: (-x[4], x[0]))
    print("# Ranking M — tylko walka polna (bez Oblężnicza)\n")
    print("| # | Jednostka | Rola | A | O | M |")
    print("|--:|-----------|------|--:|--:|--:|")
    for i, (name, role, a, o, m) in enumerate(rows, 1):
        print(f"| {i} | {name} | {role} | {a} | {o} | **{m}** |")
    print(f"\n**Jednostek:** {len(rows)}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Symulator auto-walki na mocy M (kanon 2026-06-30)")
    ap.add_argument("--scenarios", action="store_true", help="Tabela R + scenariusze M")
    ap.add_argument("--curve", action="store_true", help="Tylko krzywe win/lose vs R")
    ap.add_argument("--demo", action="store_true", help="Playtest #1 + mała przewaga + remis")
    ap.add_argument("--field-ranking", action="store_true")
    ap.add_argument("--siege-ranking", action="store_true")
    ap.add_argument(
        "--fight",
        nargs=2,
        metavar=("ATK", "DEF"),
        help='np. "Hastati,Hastati" "Falanga"',
    )
    ap.add_argument(
        "--resolve-json",
        action="store_true",
        help=(
            "Tryb maszynowy dla bramek: czyta z stdin JSON [[m_atk, m_def], ...] "
            "i wypisuje na stdout JSON z wynikami resolve_fight (bez ładowania units.json)."
        ),
    )
    ap.add_argument(
        "--coef-zwyciezca",
        type=float,
        default=None,
        help="Mnożnik strat zwycięzcy (domyślnie z auto-battle-params.json)",
    )
    ap.add_argument(
        "--coef-przegrany",
        type=float,
        default=None,
        help="Mnożnik strat przegranego (domyślnie z auto-battle-params.json)",
    )
    args = ap.parse_args()
    overrides = {}
    if args.coef_zwyciezca is not None:
        overrides["coef_zwyciezca"] = args.coef_zwyciezca
    if args.coef_przegrany is not None:
        overrides["coef_przegrany"] = args.coef_przegrany
    if overrides:
        merged = {**_load_params(), **overrides}
        _apply_params(merged)

    if args.resolve_json:
        pairs = json.loads(sys.stdin.read())
        out = [
            {
                "m_atk": float(ma),
                "m_def": float(md),
                **resolve_fight(float(ma), float(md)),
            }
            for ma, md in pairs
        ]
        json.dump(
            {
                "params": {
                    "L_MAX": L_MAX,
                    "p_atk": P_ATK,
                    "p_def": P_DEF,
                    "L_MIN": L_MIN,
                    "remis_pct": TIE_LOSS,
                    "coef_zwyciezca": COEF_ZWYCIECA,
                    "coef_przegrany": COEF_PRZEGRANY,
                },
                "results": out,
            },
            sys.stdout,
        )
        sys.stdout.write("\n")
        return

    by_name = load_by_name()

    if args.scenarios:
        print_scenarios()
        return
    if args.curve:
        print_curve_table()
        return
    if args.demo:
        print_demo(by_name)
        return
    if args.field_ranking:
        print_field_ranking(by_name)
        return
    if args.siege_ranking:
        print_siege_ranking(by_name)
        return
    if args.fight:
        atk = [x.strip() for x in args.fight[0].split(",") if x.strip()]
        defn = [x.strip() for x in args.fight[1].split(",") if x.strip()]
        print_fight(atk, defn, by_name)
        return
    ap.print_help()


if __name__ == "__main__":
    main()
