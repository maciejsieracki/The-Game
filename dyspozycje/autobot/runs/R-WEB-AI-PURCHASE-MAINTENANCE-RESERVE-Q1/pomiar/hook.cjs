const fs = require('fs'); const path = require('path');
const f = path.join(process.argv[2], 'src', 'main.ts');
let s = fs.readFileSync(f, 'utf8');
const marker = '(window as any).__aiBuildingsTestDebug = {';
if (s.split(marker).length !== 2) throw new Error('marker');
const hook = `(window as any).__resDump = { dump: () => ({ turn,
      units: units.filter((u: any) => !isMe(u.ownerId)).map((u: any) => ({ o: u.ownerId, civ: isCivilianUnit(u) })),
      cities: cities.map((c: any) => ({ o: c.ownerId })),
      treas: Object.fromEntries([...aiSkarbiecByOwner.entries()]),
      upkeep: Object.fromEntries([...new Set(cities.map((c: any) => c.ownerId))].filter((o: any) => !isMe(o)).map((o: any) => [o, previewOwnerUpkeep(o, cities, data, effectiveGameDifficultyForOwner(o), cityBuilt, units.filter((u: any) => u.ownerId === o).map((u: any) => ({ ownerId: u.ownerId, typeId: u.typeId, camping: false, onOwnTerritory: true })), empireEpochForOwner(o), aiResearchDone.get(o) ?? new Set<string>(), empireEpochForOwner, unlockedTechSetForOwner).utrzymanieRazem])),
      wars: [...new Set(units.map((u: any) => u.ownerId))].filter((o: any) => !isMe(o) && !isBarbarian(o) && atWarWithCivFor(o)) }) };
    `;
s = s.replace(marker, () => hook + marker);
fs.writeFileSync(f, s);
