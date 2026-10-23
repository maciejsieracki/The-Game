#!/bin/bash
# Generuje web-source-proof.txt dla runu P6.M03.
cd /home/user/scratch-m03 || exit 2
OUT="$1"
{
  echo "# Dowod zrodel weba (pin edb8fb56) - wyciag: git archive edb8fb56 gra/src gra/data (do katalogu poza repo)"
  echo "# git blob SHA-1 (git rev-parse edb8fb56:<plik>):"
  echo "9d86be02a59da9ec9b2f47e37ec5765ababeb20f gra/src/map/gen-helpers.ts"
  echo "0c236fdc012152ce4ccd3db1fb95c7f2bd618b77 gra/src/map/earth-land-mask.ts"
  echo "ca6f13e1bf53c6c2d1aa83e7795b73dda1034d50 gra/src/map/earth-land-mask.generated.ts"
  echo "a85ed27c848a52e4609ee52d86dd20e9df9d9880 gra/src/map/generator.ts"
  echo "# SHA-256 wyciagnietych plikow + liczba linii:"
  for f in gen-helpers.ts earth-land-mask.ts earth-land-mask.generated.ts generator.ts; do
    echo "$(sha256sum gra/src/map/$f | cut -d' ' -f1)  $(wc -l < gra/src/map/$f) linii  gra/src/map/$f"
  done
  echo "# Zrodlo fdlibm V8: https://raw.githubusercontent.com/v8/v8/12.4.254/src/base/ieee754.cc"
  echo "$(sha256sum ieee754.cc | cut -d' ' -f1)  $(wc -l < ieee754.cc) linii  src/base/ieee754.cc (v8 12.4.254)"
  echo "# Srodowisko wektorow: Node $(node -p 'process.version'), V8 $(node -p 'process.versions.v8'), $(uname -m)"
} > "$OUT"
cat "$OUT"
