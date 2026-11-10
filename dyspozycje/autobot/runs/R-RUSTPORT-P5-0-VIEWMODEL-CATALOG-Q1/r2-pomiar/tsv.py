import json, sys, collections
# argv: use.json cls.json out.tsv
u = json.load(open(sys.argv[1]))
c = json.load(open(sys.argv[2]))
out = open(sys.argv[3], 'w', encoding='utf-8')
out.write('plik\tlinia_importu\tmodul\tsymbol\tklasa\tuzycia\tpierwsze_linie_uzycia\n')
tot = collections.Counter()
n = 0
for f, rows in u.items():
    pool = collections.defaultdict(list)
    for k, names in c[f].items():
        for nm in names:
            pool[nm.rstrip('°')].append(k)
    for r in rows:
        k = pool[r['sym']].pop(0)
        tot[k] += 1
        n += 1
        out.write(f"ui/{f[3:] if f.startswith('ui/') else f}\t{r['imp']}\t{r['mod']}\t{r['sym']}\t{k}\t{r['uses']}\t{','.join(map(str, r['at'])) or '-'}\n")
print('rows', n, dict(tot))
