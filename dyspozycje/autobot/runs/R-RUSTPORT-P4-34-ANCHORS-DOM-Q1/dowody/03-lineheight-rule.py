#!/usr/bin/env python3
"""R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 — checks the line-height rule of labels::layout
(`LayoutUnit(round64(font-size) * k)` in f32, truncated to 1/64) against every
`font:<size>px/<k> x | A` row of 03-probes.log (Chromium 141 box heights)."""
import math
import os
import re
import struct

f32 = lambda x: struct.unpack('f', struct.pack('f', x))[0]
ok = bad = 0
for line in open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '03-probes.log'), encoding='utf-8'):
    m = re.match(r'font:([\d.]+)px/([\d.]+) x \| A \| [\d.]+ \| ([\d.]+) \|', line)
    if not m:
        continue
    fs, k, h = float(m.group(1)), float(m.group(2)), float(m.group(3))
    r = round(f32(fs) * 64) / 64
    lh = math.trunc(f32(f32(f32(r) * f32(k)) * 64))
    if lh == round(h * 64):
        ok += 1
    else:
        bad += 1
        print('BAD', fs, k, lh / 64, h)
print(f'line-height rule: {ok} agree, {bad} differ')
