const fs = require('fs');
const path = require('path');
const f = path.join(process.argv[2], 'src', 'main.ts');
let s = fs.readFileSync(f, 'utf8');
const marker = '(window as any).__aiBuildingsTestDebug = {';
if (s.split(marker).length !== 2) throw new Error('marker');
const hook = `(window as any).__armyDump = { dump: () => ({ turn,
      units: units.filter((u: any) => !isMe(u.ownerId)).map((u: any) => ({ id: u.id, o: u.ownerId, q: u.q, r: u.r, cat: u.category,
        civ: isCivilianUnit(u), g: !!u.inGarnizon, emb: !!u.embarked })),
      cities: cities.map((c: any) => ({ o: c.ownerId, q: c.q, r: c.r, name: c.name })),
      wars: [...new Set(units.map((u: any) => u.ownerId))].filter((o: any) => !isMe(o) && !isBarbarian(o) && atWarWithCivFor(o)).map((o: any) => [o, 0]),
      cmdLog: [] }) };
    `;
s = s.replace(marker, () => hook + marker);
fs.writeFileSync(f, s);
