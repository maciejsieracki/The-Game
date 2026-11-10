#!/usr/bin/env python3
"""Porownanie danych maski Ziemi: web gra/src/map/earth-land-mask.generated.ts (EARTH_MASK_ROWS/W/H/BBOX)
z rust-port/engine/src/domain/map_generator.rs (EARTH_MASK_RLE/WIDTH/HEIGHT/BBOX).
Uzycie: earth_mask_compare.py <web earth-land-mask.generated.ts> <rust map_generator.rs>"""
import re, sys

web = open(sys.argv[1], encoding='utf-8').read()
rs = open(sys.argv[2], encoding='utf-8').read()

w = int(re.search(r'EARTH_MASK_W\s*=\s*(\d+)', web).group(1))
h = int(re.search(r'EARTH_MASK_H\s*=\s*(\d+)', web).group(1))
bbox_w = tuple(float(re.search(k + r':\s*([0-9.]+)', web).group(1)) for k in ('minX', 'minY', 'maxX', 'maxY'))
rows = re.findall(r"^\s*'([01]+)',?\s*$", web, re.M)
web_bits = ''.join(rows)

m = re.search(r'const EARTH_MASK_RLE: &str = concat!\((.*?)\n\);', rs, re.S)
pieces = re.findall(r'"([^"]*)"', m.group(1))
rle = ''.join(pieces)
rs_bits = []
for run in rle.split(';'):
    rs_bits.append(run[0] * int(run[1:]))
rs_bits = ''.join(rs_bits)
rw = int(re.search(r'const EARTH_MASK_WIDTH: usize = (\d+)', rs).group(1))
rh = int(re.search(r'const EARTH_MASK_HEIGHT: usize = (\d+)', rs).group(1))
mb = re.search(r'const EARTH_MASK_BBOX: \(f64, f64, f64, f64\) = \(([^)]*)\)', rs).group(1)
bbox_r = tuple(float(x) for x in mb.split(','))

print(f'web: W={w} H={h} rows={len(rows)} bits={len(web_bits)} bbox={bbox_w}')
print(f'rust: W={rw} H={rh} bits={len(rs_bits)} bbox={bbox_r}')
print('dims_equal =', (w, h) == (rw, rh), '| bbox_equal =', bbox_w == bbox_r, '| bits_equal =', web_bits == rs_bits)
if web_bits != rs_bits:
    diff = sum(1 for a, b in zip(web_bits, rs_bits) if a != b)
    print('rozne bity:', diff)
