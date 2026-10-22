#!/usr/bin/env bash
# Mutation of the new geo.type comparison (defence round 1): the Circle mapping
# is flipped to "BufferGeometry"; the parity test must fail, then the file is restored.
set -u
RUN="$(cd "$(dirname "$0")" && pwd)"
L="$RUN/logi/obrona-r1/mutate-geo-type.txt"
cd "$RUN/../../../../rust-port/renderer" || exit 2
F=tests/units_kamien_web_parity.rs
cp "$F" "$F.orig"
sed -i 's/KamienGeo::Circle { .. } => "CircleGeometry"/KamienGeo::Circle { .. } => "BufferGeometry"/' "$F"
grep -c '"CircleGeometry"' "$F" > "$L"
cargo test --locked --test units_kamien_web_parity every_web_case 2>&1 | grep -E "mismatches|geo.type|test result" | head -8 >> "$L"
echo "MUTANT_TEST_EXIT=${PIPESTATUS[0]}" >> "$L"
mv "$F.orig" "$F"
cat "$L"
