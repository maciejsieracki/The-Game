#!/usr/bin/env bash
# Bramki rundy 2 (R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1). Kazdy log: komenda, pelne wyjscie, EXIT=.
set -u
WT=/home/user/The-Game/.claude/worktrees/wf_d050c8fc-9a3-3
CR=$WT/rust-port/spike-gpu-embed
L=$WT/dyspozycje/autobot/runs/R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1/logi-r2
SP=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad
export CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=$SP/target-spike
mkdir -p "$L"

run() { # run <log> <dir> <cmd...>
  local log=$1 dir=$2; shift 2
  {
    echo "# cwd: $dir"
    echo "# env: CARGO_INCREMENTAL=$CARGO_INCREMENTAL CARGO_TARGET_DIR=$CARGO_TARGET_DIR"
    echo "# rustc: $(rustc --version) / $(cargo --version)"
    echo "\$ $*"
    (cd "$dir" && "$@") 2>&1
    echo "EXIT=$?"
  } > "$L/$log"
  tail -1 "$L/$log" | sed "s|^|$log: |"
}

# --- 01: odtworzenie locka (zasianie kopia src-tauri/Cargo.lock + cargo update -p gpu-allocator)
REP=$SP/lock-repro
rm -rf "$REP"; mkdir -p "$REP"
cp -r "$CR/Cargo.toml" "$CR/build.rs" "$CR/src" "$CR/.cargo" "$CR/tauri.conf.json" "$CR/capabilities" "$CR/ui" "$REP/"
cp "$SP/src-tauri-Cargo.lock" "$REP/Cargo.lock"
{
  echo "# Odtworzenie locka spike'a w kopii crate'a: $REP"
  echo "# zasiew: git show 69f432ba:src-tauri/Cargo.lock > Cargo.lock"
  echo "\$ sha256sum Cargo.lock (zasiew)"; (cd "$REP" && sha256sum Cargo.lock)
  echo "\$ cargo metadata --format-version 1 --offline > /dev/null   # rozwiazanie z zasianym lockiem (dopisuje wgpu itd.)"
  (cd "$REP" && cargo metadata --format-version 1 --offline > /dev/null) 2>&1; echo "EXIT=$?"
  echo "\$ cargo tree --offline -p gpu-allocator --target x86_64-pc-windows-msvc --depth 1 (PRZED korekta)"
  (cd "$REP" && cargo tree --offline -p gpu-allocator --target x86_64-pc-windows-msvc --depth 1) 2>&1; echo "EXIT=$?"
  cp "$REP/Cargo.lock" "$SP/lock-przed-korekta.lock"
  echo "\$ cargo update --offline -p gpu-allocator"
  (cd "$REP" && cargo update --offline -p gpu-allocator) 2>&1; echo "EXIT=$?"
  echo "\$ cargo tree --offline -p gpu-allocator --target x86_64-pc-windows-msvc --depth 1 (PO korekcie)"
  (cd "$REP" && cargo tree --offline -p gpu-allocator --target x86_64-pc-windows-msvc --depth 1) 2>&1; echo "EXIT=$?"
  echo "\$ diff lock-przed-korekta.lock Cargo.lock (zmiana wprowadzona przez cargo update -p gpu-allocator)"
  diff "$SP/lock-przed-korekta.lock" "$REP/Cargo.lock"; echo "EXIT=$? (1 = sa roznice)"
  echo "\$ diff <odtworzony Cargo.lock> rust-port/spike-gpu-embed/Cargo.lock (commitowany)"
  diff "$REP/Cargo.lock" "$CR/Cargo.lock"; D=$?
  echo "EXIT=$D (0 = odtworzony lock identyczny z commitowanym)"
} > "$L/01-lock-odtworzenie.txt" 2>&1
tail -1 "$L/01-lock-odtworzenie.txt" | sed "s|^|01: |"

run 02-node-check.txt "$CR" node --check ui/spike.js
run 03-check-linux-app.txt "$CR" cargo check --locked
run 04-test-cpu.txt "$CR" cargo test --locked --no-default-features
run 05-test-gpu.txt "$CR" cargo test --locked --no-default-features --features gpu -- --nocapture
run 06-clippy-gpu-linux.txt "$CR" cargo clippy --locked --all-targets --no-default-features --features gpu -- -D warnings
run 07-clippy-cpu-linux.txt "$CR" cargo clippy --locked --all-targets --no-default-features -- -D warnings
run 08-clippy-windows-app.txt "$CR" cargo clippy --locked --all-targets --target x86_64-pc-windows-msvc -- -D warnings
run 09-clippy-windows-cpu.txt "$CR" cargo clippy --locked --all-targets --no-default-features --target x86_64-pc-windows-msvc -- -D warnings
run 10-fmt-check.txt "$CR" cargo fmt --all -- --check
run 11-grep-powershell-createnowindow.txt "$CR" grep -n "powershell\|CREATE_NO_WINDOW\|GetProcessMemoryInfo\|windows_subsystem" -r src
