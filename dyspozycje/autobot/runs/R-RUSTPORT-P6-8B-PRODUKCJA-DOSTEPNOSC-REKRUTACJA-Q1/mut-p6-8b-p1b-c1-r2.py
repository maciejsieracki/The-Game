# Mutacje P6.8B-P1b-c1, runda 2 (weryfikator). Uruchomienie z korzenia repo worktree:
#   python3 <ten plik> [M1 M2 ...]
# Zrodlo jest czytane z dysku na starcie i przywracane bajt w bajt w `finally`.
# Klasa COMPILE-ERROR nie jest liczona jako zabicie.
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENG = os.path.normpath(os.path.join(HERE, "../../../../rust-port/engine"))
SRC = os.path.join(ENG, "src/domain/production_units.rs")
orig = open(SRC, encoding="utf8").read()

allm = {
    "M1": ('Some(format!("Brak w magazynie państwa: {label}"))', "None"),
    "M2": ("ProductionKind::Jednostka => UNIT_POPULATION_COST,", "ProductionKind::Jednostka => 0.0,"),
    "M3": ("unwrap_or(0.0) > 0.0", "unwrap_or(0.0) >= 0.0"),
    "M4": ("ProductionKind::Budynek => 0.0,", "ProductionKind::Budynek => UNIT_POPULATION_COST,"),
    "M5": ('js_trim(surowiec.unwrap_or(""))', 'surowiec.unwrap_or("")'),
    "M6": ("pub const UNIT_POPULATION_COST: f64 = 0.0;", "pub const UNIT_POPULATION_COST: f64 = 1.0;"),
    "M7": ("    .to_lowercase()\n}", "    .to_string()\n}"),
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
        p = subprocess.run(["cargo", "test", "--test", "p6_8b_p1b_vectors"], cwd=ENG, env=env,
                           capture_output=True, text=True, timeout=250)
        out = p.stdout + p.stderr
        if "could not compile" in out or "error[" in out:
            status = "COMPILE-ERROR"
        else:
            status = "KILLED" if p.returncode != 0 else "SURVIVED"
        fails = [l.strip() for l in out.splitlines() if l.strip().startswith("test ") and "FAILED" in l]
        print(k, status, fails[:3], "rc=", p.returncode, flush=True)
finally:
    open(SRC, "w", encoding="utf8").write(orig)
    print("restored_bytes_identical", open(SRC, encoding="utf8").read() == orig, flush=True)
