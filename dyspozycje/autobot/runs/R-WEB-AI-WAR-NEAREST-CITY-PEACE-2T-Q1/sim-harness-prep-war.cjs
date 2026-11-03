'use strict';
// prep-war.cjs <kopia-gra> — dopisuje do KOPII (nie repo) main.ts pomiarowy hak __warSimDebug + log zdarzen.
const fs = require('fs');
const path = require('path');
const file = path.join(path.resolve(process.argv[2]), 'src', 'main.ts');
let s = fs.readFileSync(file, 'utf8');
if (s.includes('__warSimDebug')) { console.log('juz'); process.exit(0); }
function rep(from, to) {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`patch: oczekiwano 1, jest ${n}: ${from.slice(0, 70)}`);
  s = s.replace(from, () => to);
}
// 1) zdobycie miasta
rep('function maybeResolveRegularWarOnCityCapture(oldOwner: number, newOwner: number): void {\n',
  'function maybeResolveRegularWarOnCityCapture(oldOwner: number, newOwner: number): void {\n'
  + "      ((window as any).__warSimLog ??= []).push({ t: 'cap', turn, old: oldOwner, nw: newOwner });\n");
// 2) pokoj
rep('truceTurns?: number,\n    ): void {\n      const pairKey = diploPairKey(proposerId, responderId);\n      const forcedWar',
  'truceTurns?: number,\n    ): void {\n'
  + "      ((window as any).__warSimLog ??= []).push({ t: 'peace', turn, a: proposerId, b: responderId, lock: lockTurnsOverride ?? null, truce: truceTurns ?? null });\n"
  + '      const pairKey = diploPairKey(proposerId, responderId);\n      const forcedWar');
// 3) komendy dyplomacji AI->AI (prosba o pokoj)
rep('for (const cmd of dipCmds) {\n                  try {\n                    const targetId = parseInt(cmd.targetId, 10);\n                    if (Number.isNaN(targetId)) continue;\n',
  'for (const cmd of dipCmds) {\n                  try {\n                    const targetId = parseInt(cmd.targetId, 10);\n                    if (Number.isNaN(targetId)) continue;\n'
  + "                    if (targetId !== 0 && (cmd.type === 'zaproponuj_pokoj' || cmd.type === 'oferuj_trybut_za_pokoj' || cmd.type === 'wypowiedz_wojne')) ((window as any).__warSimLog ??= []).push({ t: 'cmd:' + cmd.type, turn, from: ownerId, to: targetId });\n");
// 4) hak snapshot
const hookStart = '(window as any).__aiBuildingsTestDebug = {';
rep(hookStart,
  "(window as any).__warSimDebug = {\n"
  + "      snapshot: () => {\n"
  + "        const majors = [...new Set(cities.map((c: any) => c.ownerId))].filter((o: any) => !isMe(o) && !isBarbarian(o) && !isCityStateOwner(o) && !eliminatedOwners.has(o));\n"
  + "        const rel: any[] = [];\n"
  + "        for (let i = 0; i < majors.length; i++) for (let j = i + 1; j < majors.length; j++) {\n"
  + "          const a = majors[i] as number, b = majors[j] as number;\n"
  + "          rel.push([a, b, (getDiploRelation(a, b) as any).status]);\n"
  + "        }\n"
  + "        const relMe: any[] = majors.map((o: any) => [o, (getDiploRelation(0, o) as any).status]);\n"
  + "        const mil = (o: number) => units.filter((u: any) => u.ownerId === o && !isCivilianUnit(u) && !isScoutUnit(u)).length;\n"
  + "        return { turn, majors, rel, relMe, cities: cities.map((c: any) => ({ id: c.id, o: c.ownerId, q: c.q, r: c.r, w: !!c.maMur })), mil: Object.fromEntries(majors.map((o: any) => [o, mil(o)])), log: (window as any).__warSimLog ?? [] };\n"
  + "      },\n"
  + "    };\n    " + hookStart);
fs.writeFileSync(file, s);
console.log('zapatchowano war-hook', file);
