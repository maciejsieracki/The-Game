import random, sys
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
random.seed(int(sys.argv[1]))
TRIALS = int(sys.argv[2])
MAXLEN = int(sys.argv[3])


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


hits = 0
maxlen_reached = 0
for t in range(TRIALS):
    path = [(0, 0)]
    dirs = []
    while len(path) - 1 < MAXLEN:
        q, r = path[-1]
        opts = []
        loop = []
        for di, (dq, dr) in enumerate(DIRS):
            if dirs and abs(sgn(di - dirs[-1])) > 1:
                continue
            nd = dirs + [di]
            if not window_ok(nd):
                continue
            n = (q + dq, r + dr)
            if n in path[:-1]:
                loop.append(n)
            elif n not in path:
                opts.append((di, n))
        if loop:
            hits += 1
            break
        if not opts:
            break
        di, n = random.choice(opts)
        dirs = dirs + [di]
        path = path + [n]
    maxlen_reached = max(maxlen_reached, len(path) - 1)
print("trials", TRIALS, "maxlen", MAXLEN, "loop-hits", hits, "max path len reached", maxlen_reached)
