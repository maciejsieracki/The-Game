#!/usr/bin/env python3
"""Lata kopii generatora Q1 (poza repo) pod web origin/main: turn-economy.ts liczy przepustowosci przez
`converterThroughputsForEra` (klucze '<id>#outMult'), a nie petla po `converterThroughputForEra`.
Uzycie: patch-gen-q1.py <plik.mjs>"""
import sys

p = sys.argv[1]
s = open(p, encoding='utf-8').read()
old = "for (const r of W.DEFAULT_CONVERTER_RECIPES) out[r.id] = enc(W.converterThroughputForEra(r.id, W.loadThroughput(raw, r.throughputParamKey, diff, r.throughputFallback), era));"
new = ("{ const m = W.converterThroughputsForEra((r) => W.loadThroughput(raw, r.throughputParamKey, diff, r.throughputFallback), era); "
       "for (const k of Object.keys(m)) out[k] = enc(m[k]); }")
if s.count(old) != 1:
    raise SystemExit('oczekiwano 1 wystapienia, jest %d' % s.count(old))
open(p, 'w', encoding='utf-8').write(s.replace(old, new))
print('patched', p)
