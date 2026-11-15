#!/bin/bash
# Obrona r3, zarzut 1: co z kodu atlasu jest na parity-v2 i czym rozni sie od ocenianego 5259741ab.
# Uruchamiac z katalogu glownego repo (git fetch origin rust-port/parity-v2 wczesniej).
P='rust-port/renderer/src/raster rust-port/renderer/tests/atlas_gpu.rs rust-port/renderer/tests/atlas_json.rs rust-port/renderer/tests/atlas_keys.rs rust-port/renderer/tests/atlas_mip.rs rust-port/renderer/tests/atlas_nturns.rs rust-port/renderer/tests/fixtures/atlas rust-port/renderer/Cargo.toml rust-port/renderer/Cargo.lock'
echo "== origin/rust-port/parity-v2 = $(git rev-parse origin/rust-port/parity-v2)"
echo "== first-parent parity zawiera commity P4.31 (nr linii = odleglosc od czubka):"
git log --first-parent --format='%h %s' origin/rust-port/parity-v2 | grep -n -E '^(1429ba434|5259741ab)' | cut -c1-120
echo "== commity po 5259741ab w sciezkach atlasu (parity):"
git log --format='%h %s' 5259741ab..origin/rust-port/parity-v2 -- $P | cut -c1-120
echo "== diff --stat 5259741ab..parity (sciezki atlasu):"
git diff --stat 5259741ab origin/rust-port/parity-v2 -- $P
echo "== diff --stat parity..d850b6b86 (obrona r3):"
git diff --stat origin/rust-port/parity-v2 d850b6b86
echo "== rodzic d850b6b86:"
git log --format='%h %s' -1 d850b6b86^ | cut -c1-120
echo "== Final Control tematu REPIN-3D-B2 (zrodlo a827fac07):"
git log --all --format='%h %s' -- dyspozycje/autobot/runs/R-RUSTPORT-REPIN-3D-B2-Q1 | grep -i 'final control'
echo "== liczba commitow z 02-evaluator-r1.md P4-31 na wszystkich refs:"
git log --all --oneline -- dyspozycje/autobot/runs/R-RUSTPORT-P4-31-ATLAS-CACHE-Q1/02-evaluator-r1.md | wc -l
echo "DONE"
