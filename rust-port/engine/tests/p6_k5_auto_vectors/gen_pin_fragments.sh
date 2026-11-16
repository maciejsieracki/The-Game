#!/usr/bin/env bash
# Generator i straznik fragmentow pinu 07d2fbd72 dla P6 K5 AUTO-WEKTORY
# (dispatch R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1). Pin jest tylko do odczytu (git show).
#   bash gen_pin_fragments.sh          -> zapis pin_fragments.txt + pin_fragments.sha256
#   bash gen_pin_fragments.sh --check  -> porownanie z pinem (cmp) + sha256sum -c
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
pin=07d2fbd72
src=gra/src/battle/battleScene.ts
gen() {
  for r in 1021-1024 3600-3614 3685-3715 5958-5975 17330-17346; do
    echo "=== $src:$r (pin $pin) ==="
    git show "$pin:$src" | sed -n "${r/-/,}p"
  done
}
if [ "${1:-}" = "--check" ]; then
  gen | cmp -s - "$here/pin_fragments.txt" || { echo "DRIFT: fragmenty nie zgadzaja sie z pinem"; exit 1; }
  (cd "$here" && sha256sum -c pin_fragments.sha256)
else
  gen > "$here/pin_fragments.txt"
  (cd "$here" && sha256sum pin_fragments.txt > pin_fragments.sha256)
fi
