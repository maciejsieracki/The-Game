# Mutacje partii 2 (walk.rs): kazda mutacja zmienia jedna galąz sterującą, uruchamia test
# p6_m07a_walk i przywraca oryginalny plik. Uzycie: python3 mutate_m07a_walk.py <REPO_ROOT>
import shutil, subprocess, sys, os

root = sys.argv[1]
src = os.path.join(root, "rust-port/engine/src/domain/mapgen/rivers_a/walk.rs")
bak = src + ".bak-mut"
MUTS = [
    ("M1 drain: nd>=MIN -> nd>MIN (faza ladowa)",
     "if !post_inland_phase {\n        return nd >= RIVER_MIN_INLAND_FROM_SEA;",
     "if !post_inland_phase {\n        return nd > RIVER_MIN_INLAND_FROM_SEA;"),
    ("M2 drain: korytarz ujscia <= -> <",
     "od <= RIVER_MOUTH_TAIL_LEN as i64", "od < RIVER_MOUTH_TAIL_LEN as i64"),
    ("M3 goal: pominiety warunek sasiada oceanu",
     "if !ocean_connected.contains(&nk) {\n            continue;\n        }\n        if can_river_flow_through",
     "if can_river_flow_through"),
    ("M4 dirDelta: brak +6 (modulo ujemne)",
     "((new_dir - last_dir) % 6 + 6) % 6", "(new_dir - last_dir) % 6"),
    ("M5 centroid: zblizenie 22 -> 21",
     "    if next_d < cur_d {\n        return 22;", "    if next_d < cur_d {\n        return 21;"),
    ("M6 square: trafienie w kwadrat 40 -> 39",
     "if sq.has(&hex_key(nq, nr)) {\n        return 40;", "if sq.has(&hex_key(nq, nr)) {\n        return 39;"),
    ("M7 seed: cap < -> <=",
     "while !queue.is_empty() && seen.len() < visit_cap {", "while !queue.is_empty() && seen.len() <= visit_cap {"),
    ("M8 seed: flaga relief ignorowana",
     "                allow_relief_traversal,\n            ) {",
     "                false,\n            ) {"),
    ("M9 reconstruct: brak odwrocenia",
     "    path.reverse();\n    path\n}\n\n/// Web `hexAxialDistance`", "    path\n}\n\n/// Web `hexAxialDistance`"),
    ("M10 audit: brak liczenia skladowych",
     "components += 1;", "components += 0;"),
]
orig = open(src, encoding="utf-8").read()
shutil.copy(src, bak)
env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
killed_n = 0
try:
    for name, old, new in MUTS:
        n = orig.count(old)
        if n != 1:
            print(name, "WZORZEC NIEJEDNOZNACZNY", n, flush=True)
            continue
        open(src, "w", encoding="utf-8").write(orig.replace(old, new))
        p = subprocess.run(["cargo", "test", "--test", "p6_m07a_walk"],
                           cwd=os.path.join(root, "rust-port/engine"), env=env,
                           capture_output=True, text=True)
        killed = p.returncode != 0
        killed_n += killed
        print(name, "ZABITA" if killed else "PRZEZYLA", flush=True)
finally:
    shutil.copy(bak, src)
    os.remove(bak)
print("ZABITE", killed_n, "/", len(MUTS))
