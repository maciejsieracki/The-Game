#!/usr/bin/env bash
# Bramki P6.M09: fmt, clippy -D warnings, cargo test --no-fail-fast (surowe logi + EXIT=).
# Uzycie: z rust-port/engine, z ustawionym CARGO_TARGET_DIR / CARGO_INCREMENTAL=0.
# Wariant B (gate-test-patched-*): tymczasowo nakada proponowany patch na p6_m00_skeleton.rs
# (poza allowlista - patch NIE jest commitowany) i przywraca plik.
set -u
R=${1:-r2}
L=../../dyspozycje/autobot/runs/R-RUSTPORT-P6-M09-KLASTRY-RYWALE-MIN-Q1
cargo fmt -- --check > "$L/gate-fmt-$R.log" 2>&1; echo "EXIT=$?" >> "$L/gate-fmt-$R.log"
cargo clippy --all-targets -- -D warnings > "$L/gate-clippy-$R.log" 2>&1; echo "EXIT=$?" >> "$L/gate-clippy-$R.log"
cargo test --no-fail-fast > "$L/gate-test-$R.log" 2>&1; echo "EXIT=$?" >> "$L/gate-test-$R.log"
cp tests/p6_m00_skeleton.rs /tmp/m09-skeleton.orig
patch -p3 -s tests/p6_m00_skeleton.rs < "$L/proposed-p6_m00_skeleton-relax.patch" || echo "PATCH NIE ZADZIALAL"
cargo test --no-fail-fast > "$L/gate-test-patched-$R.log" 2>&1; echo "EXIT=$?" >> "$L/gate-test-patched-$R.log"
cp /tmp/m09-skeleton.orig tests/p6_m00_skeleton.rs
echo "SKELETON PRZYWROCONY: $(cmp -s /tmp/m09-skeleton.orig tests/p6_m00_skeleton.rs && echo ok)" > "$L/gate-restore-$R.log"
