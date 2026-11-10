#!/bin/bash
# R-RUSTPORT-P4-29-TEXT-FONTS-Q1 — text tests with full output (tables).
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
cargo test --locked --lib raster::text -- --nocapture 2>&1; echo "EXIT=$?"
cargo test --locked --test text_api_closed --test text_fonts --test text_metrics --test text_scenes --test text_upper -- --nocapture --test-threads=1 2>&1; echo "EXIT=$?"
