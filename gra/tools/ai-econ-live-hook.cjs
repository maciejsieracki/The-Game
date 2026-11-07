'use strict';
/**
 * ai-econ-live-hook.cjs -- R-WEB-AI-VS-PLAYER-ECONOMY-AUDIT-Q1 (r3).
 * Patch KOPII gra/ (poza repo!): dodaje window.__econDump.dump() -- stan ekonomii i wojska KAZDEGO wlasciciela
 * (gracz 0 oraz AI): skarbiec, pule Pracy/Nauki, ostatni tick ekonomii (dochod, utrzymanie z silnika), liczba
 * jednostek bojowych, miast, budynkow, suwaki, rozklad rozmiaru stosow (plakietka x N = stack.length) per heks/miasto.
 * Uzycie: node tools/ai-econ-live-hook.cjs <kopia-gra>   (po ai-city-live-measure.cjs --prepare i ai-army-all-civs-live-hook.cjs)
 */
const fs = require('fs');
const path = require('path');
const f = path.join(process.argv[2], 'src', 'main.ts');
let s = fs.readFileSync(f, 'utf8');
if (s.includes('__econDump')) { console.log('juz zapatchowany'); process.exit(0); }
const capMarker = 'pendingManualWorkTaxByOwner.clear();\n          powerSnapshotsForTurn = buildPowerSnapshotsForTurn(econ);';
if (s.split(capMarker).length !== 2) throw new Error('capMarker: ' + (s.split(capMarker).length - 1));
s = s.replace(capMarker, () => 'pendingManualWorkTaxByOwner.clear();\n          (window as any).__lastEcon = econ;\n          powerSnapshotsForTurn = buildPowerSnapshotsForTurn(econ);');
const marker = '(window as any).__armyDump = {';
if (s.split(marker).length !== 2) throw new Error('marker __armyDump (uruchom najpierw ai-army-all-civs-live-hook.cjs)');
const hook = `(window as any).__econDump = { dump: () => {
      const econ: any = (window as any).__lastEcon ?? null;
      const owners = [...new Set(cities.map((c: any) => c.ownerId))].filter((o: any) => !isBarbarian(o));
      const cityHex = new Map<string, any>(); for (const c of cities) cityHex.set(c.q + ',' + c.r, c);
      return { turn, owners: owners.map((o: any) => {
        const myUnits = units.filter((u: any) => u.ownerId === o);
        const combat = myUnits.filter((u: any) => !isCivilianUnit(u) && u.isGeneral !== true);
        const stacks = new Map<string, number>();
        for (const u of myUnits) { const k = u.q + ',' + u.r; stacks.set(k, (stacks.get(k) ?? 0) + 1); }
        const stackSizes = [...stacks.entries()].map(([k, n]) => ({ k, n, city: cityHex.has(k) ? cityHex.get(k).name : null })).sort((a, b) => b.n - a.n).slice(0, 6);
        const myCities = cities.filter((c: any) => c.ownerId === o);
        const bCount = myCities.reduce((n: number, c: any) => n + (cityBuilt.get(c.id) ?? []).length, 0);
        const sum = econ ? sumEconomyForOwner(econ, o) : null;
        const up = econ ? econ.upkeepByOwner.get(o) : null;
        const typeCount: Record<string, number> = {};
        for (const u of combat) typeCount[u.typeId] = (typeCount[u.typeId] ?? 0) + 1;
        return { o, human: isHuman(o), cs: isCityStateOwner(o), civ: civKeyForOwnerId(o), era: empireEpochForOwner(o),
          treasury: Math.round(ownerTreasury(o)), mp: empireManpowerCurrent(cities, o, empireEpochForOwner(o), civManpowerMultsForOwner(o).maxMult), mpMax: myCities.reduce((n: number, c: any) => n + cityManpowerMax(c.population, empireEpochForOwner(o), civManpowerMultsForOwner(o).maxMult), 0), pracaPool: Math.round(ownerPracaPool(o)),
          cities: myCities.length, pop: myCities.reduce((n: number, c: any) => n + c.population, 0), buildings: bCount,
          units: myUnits.length, combat: combat.length, typeCount, stackSizes,
          income: sum ? { pieniadz: +sum.pieniadz.toFixed(2), nauka: +sum.nauka.toFixed(2), doPuli: +sum.doPuli.toFixed(2), praca: +sum.praca.toFixed(2), kultura: +sum.kultura.toFixed(2), pieniadzZTras: +sum.pieniadzZTras.toFixed(2) } : null,
          upkeep: up ? { jednostki: up.utrzymanieJednostki, budynki: up.utrzymanieBudynki, razem: up.utrzymanieRazem, deficyt: !!up.deficyt } : null,
          sliders: ownerDefaultPodzialHandlu.get(o) ?? null, pracaSplit: ownerDefaultPodzialPracy.get(o) ?? null };
      }) };
    } };
    `;
s = s.replace(marker, () => hook + marker);
fs.writeFileSync(f, s);
console.log('zapatchowano', f);
