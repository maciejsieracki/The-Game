#!/usr/bin/env python3
"""Pelny `cargo test -j 2` w shardach (jak w poprzednich tematach): cele = --lib + wszystkie tests/*.rs + --doc, N shardow.
Uzycie: shard-test.py <ENGINE_DIR> <TARGET_DIR> <SHARD_IDX> <SHARDS>   (druk: SHARD i/N targets=.. exit=.. passed=.. failed=..)"""
import subprocess, sys, os, glob, re

engine, target, idx, n = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
names = sorted(os.path.basename(p)[:-3] for p in glob.glob(os.path.join(engine, "tests", "*.rs")))
targets = [("--lib",)] + [("--test", x) for x in names] + [("--doc",)]
mine = [t for i, t in enumerate(targets) if i % n == idx]
env = {**os.environ, "CARGO_TARGET_DIR": target, "CARGO_INCREMENTAL": "0",
       "CARGO_PROFILE_DEV_DEBUG": "0", "CARGO_PROFILE_TEST_DEBUG": "0"}
runs = []
main_t = [t for t in mine if t != ("--doc",)]
if main_t:
    runs.append(["cargo", "test", "-j", "2", "--no-fail-fast"] + [x for t in main_t for x in t])
if ("--doc",) in mine:
    runs.append(["cargo", "test", "-j", "2", "--no-fail-fast", "--doc"])  # --doc nie miesza sie z innymi celami
out = ""
rc = 0
for a_ in runs:
    r = subprocess.run(a_, cwd=engine, capture_output=True, text=True, env=env)
    out += r.stdout + r.stderr
    rc = rc or r.returncode
p = sum(int(x) for x in re.findall(r"test result: \w+\. (\d+) passed", out))
f = sum(int(x) for x in re.findall(r"; (\d+) failed", out))
print(f"SHARD {idx}/{n} targets={len(mine)} exit={rc} passed={p} failed={f}", flush=True)
if rc != 0:
    print("\n".join(l for l in out.splitlines() if "FAILED" in l or "panicked" in l or "error" in l.lower())[:3000])
