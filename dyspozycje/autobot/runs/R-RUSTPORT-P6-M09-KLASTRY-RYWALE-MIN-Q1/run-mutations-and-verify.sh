#!/usr/bin/env bash
# Test negatywny (mutacje) + niezalezny weryfikator Python na ostatecznym kodzie.
# Uzycie: z rust-port/engine, CARGO_TARGET_DIR/CARGO_INCREMENTAL ustawione.
# Argument 1: sufiks logu (np. r2); argument 2: WEB_ROOT (git archive edb8fb56 poza repo).
set -u
R=${1:-r2}
WEB=${2:?WEB_ROOT}
L=../../dyspozycje/autobot/runs/R-RUSTPORT-P6-M09-KLASTRY-RYWALE-MIN-Q1
bash "$L/mutations.sh" > "$L/mutations-$R.log" 2>&1; echo "EXIT=$?" >> "$L/mutations-$R.log"
python3 -I "$L/verify-m09-vectors.py" "$WEB" tests/p6_m09_vectors/web-vectors.json tests/p6_1c_vectors/maps.json data/derived/mapgen-cluster-rivals.json > "$L/verify-m09-$R.log" 2>&1
echo "EXIT=$?" >> "$L/verify-m09-$R.log"
