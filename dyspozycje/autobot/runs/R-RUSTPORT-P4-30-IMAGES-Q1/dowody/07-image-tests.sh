#!/bin/bash
# R-RUSTPORT-P4-30-IMAGES-Q1 — the RR-T8c tests with full tables (--nocapture).
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
cargo test --locked --lib raster::image -- --nocapture 2>&1; echo "EXIT=$?"
cargo test --locked --test image_scenes --test image_metrics --test image_assets -- --nocapture --test-threads=1 2>&1; echo "EXIT=$?"
