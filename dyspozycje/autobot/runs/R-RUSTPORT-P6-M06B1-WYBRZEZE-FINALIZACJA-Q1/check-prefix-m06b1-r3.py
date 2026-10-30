#!/usr/bin/env python3
"""Sprawdzenie PREFIKSU wektorow (runda 3, zarzut FC 3: stare kategorie jako prefiks nowych).

Porownuje stary plik `web-vectors.json` (r2, commit c92ba394) z nowym (r3) wygenerowanym przez
`gen-m06b1-vectors.mjs` z tym samym pinem edb8fb56:
  - dla KAZDEJ kategorii: lista starych przypadkow == pierwsze N elementow listy nowej (wartosc JSON, bit-w-bit po
    kanonicznym dumpie),
  - tablica `maps`: stare mapy == pierwsze M map nowej tablicy,
  - `stats` (liczniki trafien granic): identyczne.
Uzycie: python3 -I check-prefix-m06b1-r3.py <STARY.json> <NOWY.json>
Kod wyjscia: 0 = prefiks zachowany, 1 = naruszenie.
"""
import hashlib
import json
import sys


def canon(x):
    return json.dumps(x, sort_keys=True, separators=(',', ':'), ensure_ascii=False)


def main():
    old = json.load(open(sys.argv[1], encoding='utf-8'))
    new = json.load(open(sys.argv[2], encoding='utf-8'))
    bad = []
    report = []
    for kind, old_list in old['cases'].items():
        new_list = new['cases'].get(kind, [])
        n = len(old_list)
        same = all(canon(a) == canon(b) for a, b in zip(old_list, new_list[:n])) and len(new_list) >= n
        report.append(f'{kind}: stare={n} nowe={len(new_list)} prefiks={"OK" if same else "NARUSZONY"}')
        if not same:
            bad.append(kind)
    om, nm = old['maps'], new['maps']
    maps_ok = len(nm) >= len(om) and all(canon(a) == canon(b) for a, b in zip(om, nm[: len(om)]))
    report.append(f'maps: stare={len(om)} nowe={len(nm)} prefiks={"OK" if maps_ok else "NARUSZONY"}')
    if not maps_ok:
        bad.append('maps')
    stats_ok = all(new['stats'].get(k) == v for k, v in old['stats'].items())
    report.append(f'stats (stare liczniki): {"IDENTYCZNE" if stats_ok else "ROZNE"}')
    if not stats_ok:
        bad.append('stats')
    for line in report:
        print(line)
    print(f'sha256 starego pliku: {hashlib.sha256(open(sys.argv[1], "rb").read()).hexdigest()}')
    print(f'sha256 nowego pliku:  {hashlib.sha256(open(sys.argv[2], "rb").read()).hexdigest()}')
    print('WYNIK: PREFIKS ZACHOWANY' if not bad else f'WYNIK: NARUSZENIE {bad}')
    return 0 if not bad else 1


if __name__ == '__main__':
    sys.exit(main())
