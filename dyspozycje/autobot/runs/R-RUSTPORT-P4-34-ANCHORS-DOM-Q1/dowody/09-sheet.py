#!/usr/bin/env python3
"""Chromium | Rust | |diff|x4 sheet (premultiplied over dark green), x3. args: out.png W H chrome.rgba rust.rgba"""
import sys, zlib, struct
out, W, H, fa, fb = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
A = open(fa, 'rb').read(); B = open(fb, 'rb').read()
S = 3
bg = (60, 90, 60)
def comp(im, i):
    r, g, b, a = im[i:i + 4]
    return tuple(int(c * a / 255 + bc * (255 - a) / 255) for c, bc in zip((r, g, b), bg))
def pm(im, i):
    r, g, b, a = im[i:i + 4]
    return (r * a // 255, g * a // 255, b * a // 255, a)
rows = []
for y in range(H * S):
    row = bytearray()
    for panel in range(3):
        for x in range(W * S):
            i = ((y // S) * W + (x // S)) * 4
            if panel == 0: row += bytes(comp(A, i))
            elif panel == 1: row += bytes(comp(B, i))
            else:
                d = max(abs(p - q) for p, q in zip(pm(A, i), pm(B, i)))
                v = min(255, d * 4)
                row += bytes([v, v, v])
        row += bytes([255, 255, 255] * 3)
    rows.append(b'\x00' + bytes(row))
TW = (W * S + 3) * 3
def chunk(t, d):
    return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', TW, H * S, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b''.join(rows))) + chunk(b'IEND', b'')
open(out, 'wb').write(png)
