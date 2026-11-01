import sys
sys.setrecursionlimit(10000)
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
MAXD = int(sys.argv[1])
found = {}
nodes = [0]


def sgn(d):
    d %= 6
    return d if d <= 3 else d - 6


def window_ok(dirs):
    if len(dirs) < 2:
        return True
    deltas = [sgn(b - a) for a, b in zip(dirs, dirs[1:])]
    if abs(deltas[-1]) > 1:
        return False
    return abs(sum(deltas[-6:])) <= 1


def dfs(path, dirs):
    nodes[0] += 1
    if len(path) - 1 >= MAXD:
        return
    q, r = path[-1]
    for di, (dq, dr) in enumerate(DIRS):
        if dirs and abs(sgn(di - dirs[-1])) > 1:
            continue
        nd = dirs + [di]
        n = (q + dq, r + dr)
        if n in path[:-1]:
            if window_ok(nd):
                found[len(path)] = found.get(len(path), 0) + 1
            continue
        if n in path:
            continue
        if not window_ok(nd):
            continue
        dfs(path + [n], nd)


dfs([(0, 0)], [])
print("maxd", MAXD, "nodes", nodes[0], "loop-candidates-window-ok by path len", found)
