#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow first-player-city (P6.1 r4, zarzut 2 z oceny Evaluatora).

NIE uzywa TypeScript, Node ani generatora gen-p61-first-city-vectors.mjs. Semantyke
czterech eksportow (first-player-city.ts) implementuje od nowa w Pythonie na podstawie
tekstu zrodla weba (git archive edb8fb56 gra/src). hexDistance: tekst linii 354-359
units/setup.ts jest sprawdzany wzorcem, a formula odtwarzana w Pythonie.
Porownuje wszystkie sekcje z rust-port/engine/tests/p6_1_vectors/first-player-city.json.

Uzycie:
  python3 -I verify-p61-first-city.py <WEB_ROOT> <VECTORS_JSON>
Wyjscie: 0 = 0 rozbieznosci, 1 = co najmniej jedna rozbieznosc, 2 = blad wejscia.
"""
import json
import re
import sys
from pathlib import Path

if len(sys.argv) != 3:
    print("usage: <WEB_ROOT> <VECTORS_JSON>")
    sys.exit(2)
web = Path(sys.argv[1])
vec = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
src = (web / "gra/src/game/first-player-city.ts").read_text(encoding="utf-8")
setup = (web / "gra/src/units/setup.ts").read_text(encoding="utf-8").split("\n")

checks = 0
diffs = 0


def expect(label, got, want):
    global checks, diffs
    checks += 1
    if got != want:
        diffs += 1
        print(f"ROZBIEZNOSC {label}: web/py={got!r} json={want!r}")


# --- zrodlo: stala i sygnatury (kotwice tekstowe) ---
m = re.search(r"export const FIRST_CITY_START_REVEAL_DENIED = '([^']*)';", src)
if not m:
    print("BLAD: brak stalej w zrodle")
    sys.exit(2)
DENIED = m.group(1)
expect("constant.DENIED", DENIED, vec["constants"]["FIRST_CITY_START_REVEAL_DENIED"])
for sig in [
    "export function isAwaitingFirstPlayerCity(",
    "export function isHexInStartReveal(",
    "export function validateFirstPlayerCityPlacement(",
]:
    expect(f"sygnatura {sig}", sig in src, True)
expect("playerOwnerId default 0", "playerOwnerId = 0," in src, True)
expect("baseReason default ''", "baseReason = ''," in src, True)

# --- hexDistance: tekst linii 354-359 z setup.ts (werbatim) ---
hex_lines = setup[353:359]
expect("hexDistance linie", hex_lines, [
    "export function hexDistance(aq: number, ar: number, bq: number, br: number): number {",
    "  const dq = Math.abs(aq - bq);",
    "  const dr = Math.abs(ar - br);",
    "  const ds = Math.abs((-aq - ar) - (-bq - br));",
    "  return Math.max(dq, dr, ds);",
    "}",
])


def hex_distance(aq, ar, bq, br):
    dq = abs(aq - bq)
    dr = abs(ar - br)
    ds = abs((-aq - ar) - (-bq - br))
    return max(dq, dr, ds)


# --- semantyka z first-player-city.ts ---
def is_awaiting(ever, cities, owner=0):
    # return !playerEverOwnedCity && !cities.some(c => c.ownerId === playerOwnerId);
    return (not ever) and not any(c == owner for c in cities)


def in_reveal(q, r, awaiting, start, radius):
    # if (!awaitingFirstCity || playerStartHex === null) return true;
    # return hexDistance(q, r, start.q, start.r) <= startRevealRadius;
    if not awaiting or start is None:
        return True
    return hex_distance(q, r, start["q"], start["r"]) <= radius


def validate(base_ok, awaiting, in_rev, base_reason):
    # if (!baseOk) return { ok: false, reason: baseReason };
    # if (awaiting && !inStartReveal) return { ok: false, reason: DENIED };
    # return { ok: true, reason: '' };
    if not base_ok:
        return {"ok": False, "reason": base_reason}
    if awaiting and not in_rev:
        return {"ok": False, "reason": DENIED}
    return {"ok": True, "reason": ""}


for row in vec["awaiting"]:
    expect(f"awaiting {row}", is_awaiting(row["everOwned"], row["owners"]), row["awaiting"])
for row in vec["awaitingWithOwnerOne"]:
    expect(f"awaitingOwner1 {row}", is_awaiting(row["everOwned"], row["owners"], row["playerOwnerId"]), row["awaiting"])
for row in vec["reveal"]:
    expect(f"reveal {row}", in_reveal(row["q"], row["r"], row["awaiting"], row["start"], row["radius"]), row["inReveal"])
for row in vec["validate"]:
    expect(f"validate {row}", validate(row["baseOk"], row["awaiting"], row["inStartReveal"], row["baseReason"]), row["result"])

print(f"RAZEM: {checks} sprawdzen, rozbieznosci: {diffs}")
sys.exit(1 if diffs else 0)
