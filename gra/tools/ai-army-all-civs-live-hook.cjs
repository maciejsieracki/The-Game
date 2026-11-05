'use strict';
/**
 * ai-army-all-civs-live-hook.cjs -- R-WEB-AI-ARMY-ALL-CIVS-GATHER-UNDER-GENERAL-Q1.
 * Patch KOPII gra/ (poza repo): dodaje window.__armyDump.dump() uzywany przez ai-army-all-civs-live-measure.cjs.
 * Uzycie:  node tools/ai-army-all-civs-live-hook.cjs <kopia-gra>   (po `ai-city-live-measure.cjs --prepare <kopia-gra>`)
 * Zwraca: units {id,o,q,r,cat,civ,g,emb,ge,hp}, cities {o,q,r,name}, owners {o,civ,era,queuedGen,camp,war,
 * diagnostyka wodza: gold, koszary w stolicy, oferta bestGeneralUnitForOwner, stolica}.
 */
const fs = require('fs');
const path = require('path');
const f = path.join(process.argv[2], 'src', 'main.ts');
let s = fs.readFileSync(f, 'utf8');
if (s.includes('__armyDump')) { console.log('juz zapatchowany'); process.exit(0); }
const marker = '(window as any).__aiBuildingsTestDebug = {';
if (s.split(marker).length !== 2) throw new Error('marker');
const hook = `(window as any).__armyDump = { dump: () => {
      const owners = [...new Set(cities.map((c: any) => c.ownerId))].filter((o: any) => !isMe(o) && !isBarbarian(o) && !isCityStateOwner(o));
      return { turn,
        units: units.filter((u: any) => !isMe(u.ownerId)).map((u: any) => ({ id: u.id, o: u.ownerId, q: u.q, r: u.r, cat: u.category,
          civ: isCivilianUnit(u), g: !!u.inGarnizon, emb: !!u.embarked, ge: u.isGeneral === true, hp: u.hp })),
        cities: cities.map((c: any) => ({ o: c.ownerId, q: c.q, r: c.r, name: c.name })),
        owners: owners.map((o: any) => {
          const capId = capitalCityIdForOwner(o);
          const built: string[] = capId ? (cityBuilt.get(capId) ?? []) : [];
          let offer: string | null = null; try { offer = bestGeneralUnitForOwner(o)?.id ?? null; } catch (e) { offer = 'ERR'; }
          return { o, civ: civKeyForOwnerId(o), era: empireEpochForOwner(o),
            queuedGen: cities.filter((c: any) => c.ownerId === o).reduce((n: number, c: any) => n + (cityProd.get(c.id)?.rekrutacja ?? []).filter((i: any) => i.isGeneral === true).length, 0),
            camp: aiGeneralWarCampaignByOwner.get(o)?.stage ?? null, war: atWarWithCivFor(o) === true,
            gold: ownerTreasury(o), koszary: built.includes('koszary') || built.some((b: string) => /koszar/i.test(b)), offer, cap: !!capId };
        }) };
    } };
    `;
s = s.replace(marker, () => hook + marker);
fs.writeFileSync(f, s);
console.log('zapatchowano', f);
