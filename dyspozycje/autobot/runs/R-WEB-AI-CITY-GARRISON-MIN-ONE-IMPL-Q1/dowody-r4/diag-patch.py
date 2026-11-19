# Tymczasowa instrumentacja DIAGNOSTYCZNA (nie commitowana do gry): python3 diag-patch.py <gra-dir>
import sys, os
g = sys.argv[1]
# 1) tagowanie komend move (src: 'plik:linia')
for f in ['ai.ts','ai-war-home-defense.ts','ai-siege-relief.ts','army-concentration.ts','armyMerge.ts']:
    p = os.path.join(g,'src/game',f)
    if not os.path.exists(p): continue
    out=[]
    for i,l in enumerate(open(p,encoding='utf8').read().split('\n'),1):
        out.append(l.replace("type: 'move',", "type: 'move', src: '%s:%d'," % (f.replace('.ts',''), i)) if "type: 'move'," in l else l)
    open(p,'w',encoding='utf8').write('\n'.join(out))
p = os.path.join(g,'src/main.ts'); s = open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1, (old, s.count(old))
    s = s.replace(old,new)
GD = "((globalThis as any).__garrisonDiag ??= { recruit: {}, leave: {}, leaveOwner: {} })"
rep("""                if (cmd.type === 'move') {
                  const u = units.find(x => x.id === cmd.unitId);
                  if (!u || u.ownerId !== ownerId) continue;
""","""                if (cmd.type === 'move') {
                  const u = units.find(x => x.id === cmd.unitId);
                  if (!u || u.ownerId !== ownerId) continue;
                  {
                    const __gd = %s;
                    const homeC = cities.find(c => c.ownerId === ownerId && c.q === u.q && c.r === u.r);
                    if (homeC && !(cmd.toQ === u.q && cmd.toR === u.r) && isGarrisonEligibleUnit(u)) {
                      const eligHere = units.filter(x => x.ownerId === ownerId && x.q === u.q && x.r === u.r && isGarrisonEligibleUnit(x)).length;
                      if (eligHere === 1) {
                        const destOwnCity = cities.some(c => c.ownerId === ownerId && c.q === cmd.toQ && c.r === cmd.toR);
                        const k = String((cmd as any).src ?? 'untagged') + (destOwnCity ? '>ownCity' : '');
                        __gd.leave[k] = (__gd.leave[k] ?? 0) + 1;
                        const ko = ownerId + '|' + String((cmd as any).src ?? 'untagged').split(':')[0];
                        __gd.leaveOwner[ko] = (__gd.leaveOwner[ko] ?? 0) + 1;
                      }
                    }
                  }
""" % GD)
rep("""                  const pick = pickExecutableCandidate(candidateIds, checks);
""","""                  const pick = pickExecutableCandidate(candidateIds, checks);
                  {
                    const __gd = %s;
                    if (cmd.garrison === true && cityNeedsGarrison(city, units, ownerId)) {
                      const why = pick === null ? 'pickNull' : pick.alreadyQueued ? 'alreadyQueued' : pick.id !== cmd.buildingId ? 'pickOther' : 'garrisonPicked';
                      const k = ownerId + '|' + why;
                      __gd.recruit[k] = (__gd.recruit[k] ?? 0) + 1;
                      if (why === 'pickNull') {
                        const k2 = ownerId + '|pickNull:fallbacks=' + (cmd.fallbackIds ?? []).length
                          + ':gAllowed=' + (checks.isBuildAllowed(cmd.buildingId))
                          + ':gQueued=' + (checks.isAlreadyQueued(cmd.buildingId))
                          + ':gAfford=' + (() => { const it = checks.resolveItem(cmd.buildingId); return it ? checks.canAfford(it) : 'noItem'; })();
                        __gd.recruit[k2] = (__gd.recruit[k2] ?? 0) + 1;
                      }
                    }
                  }
""" % GD)
rep("""                    if (wantsPurchase && purchaseRecruitmentUnit(cmd.cityId, candId, item.koszt, ownerId)) {
""","""                    if (isGarrisonPriority) {
                      const __gd = %s;
                      let why = 'ok';
                      if (aiNnsHoldOwners.has(ownerId)) why = 'nnsHold';
                      else if (ownerTreasury(ownerId) < item.koszt) why = 'treasury<' + item.koszt;
                      else if (isCityUnderSiege(cities, city)) why = 'siege';
                      else if (!canAffordUnitManpowerEmpire(cities, ownerId, city, empireEpochForOwner(ownerId), UNIT_POPULATION_COST, civManpowerMultsForOwner(ownerId).maxMult, candId, civManpowerMultsForOwner(ownerId).costMult)) why = 'manpower';
                      else if (!wantsPurchase) why = 'shouldAIPurchaseUnit=false';
                      const k = ownerId + '|buy:' + why;
                      __gd.recruit[k] = (__gd.recruit[k] ?? 0) + 1;
                    }
                    if (wantsPurchase && purchaseRecruitmentUnit(cmd.cityId, candId, item.koszt, ownerId)) {
""" % GD)

rep("""            const aiVisNow = fogOn ? currentVisible() : null;
""","""            const aiVisNow = fogOn ? currentVisible() : null;
            const __snap = new Map<string, { q: number; r: number }>();
            const __last = new Map<string, string>();
            {
              for (const c of cities) {
                if (c.ownerId !== ownerId) continue;
                const el = units.filter(x => x.ownerId === ownerId && x.q === c.q && x.r === c.r && isGarrisonEligibleUnit(x));
                if (el.length === 1) __snap.set(el[0]!.id, { q: c.q, r: c.r });
              }
            }
""")
rep("""              const cmd = commands[ci]!;
              try {""","""              const cmd = commands[ci]!;
              if ((cmd as any).unitId !== undefined) __last.set((cmd as any).unitId, cmd.type + ':' + String((cmd as any).src ?? ''));
              try {""")
rep("""            maybeRelocateThreatenedAiCapital(ownerId);
          }
""","""            {
              const __gd2 = %s;
              __gd2.leave2 ??= {};
              for (const [uid, pos] of __snap) {
                const u2 = units.find(x => x.id === uid);
                if (u2 && (u2.q !== pos.q || u2.r !== pos.r)) {
                  const k = __last.get(uid) ?? 'noCmd';
                  __gd2.leave2[k] = (__gd2.leave2[k] ?? 0) + 1;
                }
              }
            }
            maybeRelocateThreatenedAiCapital(ownerId);
          }
""" % GD)
rep("""            diag: {
              pendingForeignSpawnCities: pendingForeignSpawnCities.length,""","""            diag: {
              garrisonDiag: (globalThis as any).__garrisonDiag ? JSON.parse(JSON.stringify((globalThis as any).__garrisonDiag)) : null,
              pendingForeignSpawnCities: pendingForeignSpawnCities.length,""")
rep("import { cityNeedsGarrison, garrisonGoldReserve, isGarrisonPriorityPurchase, GARRISON_RESERVE_MAX_CITIES } from './game/ai-city-garrison';","import { cityNeedsGarrison, garrisonGoldReserve, isGarrisonPriorityPurchase, GARRISON_RESERVE_MAX_CITIES, isGarrisonEligibleUnit } from './game/ai-city-garrison';")
open(p,'w',encoding='utf8').write(s)
print('patched')
