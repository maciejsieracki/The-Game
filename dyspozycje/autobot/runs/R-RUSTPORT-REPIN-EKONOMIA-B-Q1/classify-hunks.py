#!/usr/bin/env python3
"""Klasyfikacja hunkow webu production.ts + turn-economy.ts (edb8fb56 -> 91dc998a) do tabeli tematu.

Wejscie: patch z `git diff edb8fb56 91dc998a -- gra/src/game/production.ts gra/src/game/turn-economy.ts`.
Wyjscie: markdown tabela na stdout (wklejana do dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-B.md).
"""
import re
import sys

PATCH = sys.argv[1]
text = open(PATCH, encoding='utf-8').read().splitlines()

hunks = []
cur_file = None
cur = None
for line in text:
    if line.startswith('diff --git'):
        cur_file = line.split(' b/')[-1]
        continue
    m = re.match(r'^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$', line)
    if m:
        cur = {'file': cur_file, 'old': int(m.group(1)), 'new': int(m.group(2)), 'ctx': m.group(3).strip(), 'body': []}
        hunks.append(cur)
        continue
    if cur is not None and line[:1] in ('+', '-'):
        cur['body'].append(line)

IMPORT_RE = re.compile(r'^[+-]\s*(import\b|\}\s*from\b|[A-Za-z_][A-Za-z0-9_]*,?\s*$|[A-Za-z_][A-Za-z0-9_]*\s*\}?\s*from\b)')
COMMENT_RE = re.compile(r'^[+-]\s*(//|/\*|\*|\*/)')
TE_OWNER_ERA = {1643, 1650, 1683}          # computeCityFoodBalanceV85 / recomputeCityFoodBalancesInEcon (ownerEra)


def classify(h):
    body = h['body']
    changed = [b for b in body if b[1:].strip()]
    if not changed:
        return 'NIE-DOTYCZY', 'pusta zmiana'
    if h['file'].endswith('turn-economy.ts') and h['old'] in TE_OWNER_ERA:
        return 'PORTOWANE', 'batch 1: ownerEra w computeCityFoodBalanceV85 -> city_growth.rs compute_city_food_balance_v85 + recompute'
    if h['old'] < 200 and all(IMPORT_RE.match(b) for b in changed):
        return 'NIE-DOTYCZY', 'tylko import (niebehawioralne)'
    if all(COMMENT_RE.match(b) for b in changed):
        return 'NIE-DOTYCZY', 'tylko komentarz (niebehawioralne)'
    return 'NASTEPNA-PARTIA', 'poza batchem 1 (patrz sekcja 4 dossier)'


print('| # | plik weba | hunk (old/new) | kontekst | klasa | status | uwaga |')
print('|---|---|---|---|---|---|---|')
for i, h in enumerate(hunks, 1):
    status, note = classify(h)
    klass = 'niebehawioralna' if status == 'NIE-DOTYCZY' else ('behawioralna' if status != 'NIE-DOTYCZY' else 'pusta')
    ctx = (h['ctx'] or '').replace('|', '/')[:70]
    fname = h['file'].split('/')[-1]
    print(f"| {i} | {fname} | -{h['old']}/+{h['new']} | {ctx} | {klass} | {status} | {note} |")

counts = {}
for h in hunks:
    s, _ = classify(h)
    counts[s] = counts.get(s, 0) + 1
print()
print('SUMA hunkow:', len(hunks), counts)
