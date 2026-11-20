import json, glob, statistics, sys, os
BASE = sys.argv[1]
runs = {}
for seed in (4242, 7):
    for flag in (0, 1):
        f = os.path.join(BASE, f"s{seed}-a{flag}", f"seed{seed}-all{flag}.jsonl")
        runs[(seed, flag)] = [json.loads(l) for l in open(f)]
def stat(rows, t):
    r = [x for x in rows if x['turn'] == t][0]
    d = r['diplo']; pairs = d['pairs']; g = d['gracz']; L = r['liczniki']
    wars = [p for p in pairs if p['status'] == 'wojna']
    war_ai = [p for p in wars if p['aiAi']]
    war_pl = [p for p in wars if not p['aiAi']]
    per = {}
    for p in wars:
        per[p['a']] = per.get(p['a'], 0) + 1; per[p['b']] = per.get(p['b'], 0) + 1
    multi = sum(1 for o, n in per.items() if n >= 2 and o != g)
    tr = [p['zaufanie'] for p in pairs if p['sasiad'] and p['zaufanie'] is not None]
    epoch = [p for p in wars if p['typWojny'] == 'epoki']
    epoch_pl = [p for p in epoch if p['a'] == g or p['b'] == g]
    owners0 = [x for x in rows if x['turn'] == 5][0]['diplo']['owners']
    return dict(turn=t, wojny=len(wars), wojny_ai=len(war_ai), wojny_gracz=len(war_pl),
        wojny_max_cyw=L['wojnyRownolegleMax'], cyw_ge2=multi,
        sojusze_ai=L['sojuszeAiAi'], nap_ai=L['napAiAi'], sojusz_gracz=L['paryGraczSojusz'],
        pokoje=sum(1 for p in pairs if p['status'] == 'pokoj'),
        zerwania_zero_zaufania=L.get('zerwaniaZeroZaufania'),
        zaufanie_sasiad_mediana=(round(statistics.median(tr), 2) if tr else None),
        wojny_epoki=len(epoch), epoki_z_graczem=len(epoch_pl),
        wyeliminowane=len(owners0) - len(d['owners']), wlasciciele=len(d['owners']),
        miasta_ai='NIE_ZMIERZONO', wymuszone_pokoje=r['forcedPeaceAccepted'], flagi=r['flagi'])
out = {}
for seed in (4242, 7):
    for flag in (0, 1):
        rows = runs[(seed, flag)]
        out[f"seed{seed}-all{flag}"] = [stat(rows, t) for t in (30, 60, 90)]
        peak = max(rows, key=lambda x: x['liczniki']['sojuszeAiAi'])
        out[f"seed{seed}-all{flag}"+"-szczyt"] = dict(turn=peak['turn'], sojusze=peak['liczniki']['sojuszeAiAi'], wojny_max=max(x['diplo']['pairs'].__len__() and sum(1 for p in x['diplo']['pairs'] if p['status']=='wojna') for x in rows))
print(json.dumps(out, ensure_ascii=False, indent=1))
