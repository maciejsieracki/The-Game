# Mutacje P6.8B-P1b-c2a (manpower_cost_of, set_paused). Uruchomienie z korzenia worktree:
#   python3 <ten plik> [M1 M2 ...]
# Zrodlo czytane z dysku na starcie i przywracane bajt w bajt w `finally`.
# Klasa COMPILE-ERROR nie jest liczona jako zabicie.
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "../../../.."))
ENG = os.path.join(ROOT, "rust-port/engine")
SRC = os.path.join(ENG, "src/domain/production_units.rs")
orig = open(SRC, encoding="utf8").read()

allm = {
    "M1": ("let cm = cost_mult.unwrap_or(max_mult);", "let cm = cost_mult.unwrap_or(1.0);"),
    "M2": ("        ProductionKind::Budynek => 0.0,\n    }\n}\n\n/// web `setPaused", "        ProductionKind::Budynek => 1.0,\n    }\n}\n\n/// web `setPaused"),
    "M3": ("        wstrzymana: Some(paused),", "        wstrzymana: prod.wstrzymana,"),
    "M4": ("        rekrutacja: prod.rekrutacja.clone(),\n    }\n}", "        rekrutacja: Some(prod.rekrutacja.clone().unwrap_or_default()),\n    }\n}"),
    "M5": ("                cm,\n            )\n        }\n        ProductionKind::Budynek", "                max_mult,\n            )\n        }\n        ProductionKind::Budynek"),
}
sel = sys.argv[1:] or list(allm)
env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
try:
    for k in sel:
        a, b = allm[k]
        n = orig.count(a)
        if n != 1:
            print(k, "pattern count", n, flush=True)
            continue
        open(SRC, "w", encoding="utf8").write(orig.replace(a, b))
        p = subprocess.run(["cargo", "test", "--test", "p6_8b_c2a_vectors"], cwd=ENG, env=env,
                           capture_output=True, text=True, timeout=500)
        out = p.stdout + p.stderr
        if "could not compile" in out or "error[" in out:
            status = "COMPILE-ERROR"
        else:
            status = "KILLED" if p.returncode != 0 else "SURVIVED"
        fails = [l.strip() for l in out.splitlines() if l.strip().startswith("test ") and "FAILED" in l]
        print(k, status, fails[:4], "rc=", p.returncode, flush=True)
finally:
    open(SRC, "w", encoding="utf8").write(orig)
    print("restored_bytes_identical", open(SRC, encoding="utf8").read() == orig, flush=True)
