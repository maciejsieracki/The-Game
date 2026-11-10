#!/usr/bin/env python3
"""Sprawdza bez kompilacji, czy tekst `old` kazdego mutanta wystepuje w pliku (occ-te wystapienie).
Uzycie: python3 mut-precheck.py <mutate-repin.py> <katalog rust-port/engine/src/domain>
Wypisuje ID, liczbe wystapien `old` i status OK/NOOP. Nie modyfikuje plikow.
"""
import importlib.util
import os
import sys

spec = importlib.util.spec_from_file_location('mr', sys.argv[1])
mr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mr)
domain = sys.argv[2]
for mid, rel, old, new, tests, occ in mr.M:
    text = open(os.path.join(domain, rel), encoding='utf-8').read()
    n = text.count(old)
    status = 'OK' if n >= occ else 'NOOP'
    print(f'{mid} occ={occ} count={n} {status}')
