'use strict';
/**
 * ai-war-weariness-live-audit-hook.cjs -- R-WEB-AI-WAR-WEARINESS-LIVE-AUDIT-Q1.
 * Patch KOPII gra/ (poza repo): dodaje window.__wwDump.dump() uzywany przez ai-war-weariness-live-audit-measure.cjs.
 * Uzycie:  node tools/ai-war-weariness-live-audit-hook.cjs <kopia-gra>   (po `ai-city-live-measure.cjs --prepare <kopia-gra>`)
 * Zwraca: turn, owners[{o,civ,cities,elim}], cities[[id,owner]], wars[{a,b,tw,lostA,lostB,since,share(a),wear,forced}], rel (nie-wojna, nie-pokoj).
 * Uwaga: dump woła refreshObjectivePowerCache() (ta sama funkcja co tick zmeczenia) -- poza tym tylko odczyt.
 */
const fs = require('fs');
const path = require('path');
const f = path.join(process.argv[2], 'src', 'main.ts');
let s = fs.readFileSync(f, 'utf8');
if (s.includes('__wwDump')) { console.log('juz zapatchowany'); process.exit(0); }
const marker = '(window as any).__aiBuildingsTestDebug = {';
if (s.split(marker).length !== 2) throw new Error('marker');
const hook = `(window as any).__wwDump = { dump: () => {
      refreshObjectivePowerCache();
      const majors: number[] = [0, ...Array.from(aiOwnerCivMap.keys()).filter((o: any) => !isBarbarian(o) && !isCityStateOwner(o) && o !== 0)].sort((x: number, y: number) => x - y);
      const owners = majors.map((o: number) => ({ o, civ: civKeyForOwnerId(o), me: o === 0, cities: cities.filter((c: any) => c.ownerId === o).length, elim: eliminatedOwners.has(o) }));
      const wars: any[] = [];
      const rel: any[] = [];
      for (let i = 0; i < majors.length; i++) for (let j = i + 1; j < majors.length; j++) {
        const a = majors[i]!; const b = majors[j]!;
        const st = getDiploRelation(a, b).status;
        if (st !== 'wojna') { if (st !== 'pokoj' && st !== 'neutralny') rel.push([a, b, st]); continue; }
        const wa = diploWarStateFor(a, b); const wb = diploWarStateFor(b, a);
        const key = diploPairKey(a, b); const ws: any = warWearinessByPairKey.get(key);
        const pa = objectivePowerForOwner(a); const pb = objectivePowerForOwner(b);
        wars.push({ a, b, tw: wa.turnsAtWar, lostA: wa.lostCities, lostB: wb.lostCities, since: wa.turnsSinceCityChange,
          share: (pa + pb) > 0 ? pa / (pa + pb) : 0.5, pa: Math.round(pa), pb: Math.round(pb),
          wear: ws ? { peak: ws.peak, stage: ws.stage, rej: ws.rejectedOffers, last: ws.lastOfferTurn, ws: ws.warStart } : null,
          forced: bronzeForceWarActiveByPairKey.has(key) ? 'bronze' : stoneForceWarActiveByPairKey.has(key) ? 'stone' : ironForceWarActiveByPairKey.has(key) ? 'iron' : null });
      }
      return { turn, owners, cities: cities.filter((c: any) => majors.includes(c.ownerId)).map((c: any) => [c.id, c.ownerId]), wars, rel };
    } };
    `;
s = s.replace(marker, () => hook + marker);
fs.writeFileSync(f, s);
console.log('zapatchowano', f);
