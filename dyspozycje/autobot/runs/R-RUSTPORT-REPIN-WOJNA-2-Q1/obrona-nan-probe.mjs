import { pathToFileURL } from 'node:url';
const webRoot = process.argv[2];
const { initialBattleSlots, initialBattleFormation } = await import(pathToFileURL(webRoot + '/gra/src/battle/formationRules.ts').href);
const units = [{id:0,role:'melee'},{id:1,role:'mounted'},{id:2,role:'mounted'},{id:3,role:'mounted'},{id:4,role:'mounted'}];
const f = initialBattleFormation(units, (u)=>u.role);
const probe = (label, b) => {
  try {
    const s = initialBattleSlots(f, b);
    console.log(label, JSON.stringify(s.map(x=>[x.unit.id, String(x.row), String(x.rank)])));
  } catch (e) { console.log(label, 'THROW', e.message); }
};
const base = {rankWidth:5, midRow:10, playRow0:0, playRow1:20};
probe('base', base);
probe('rankWidth NaN', {...base, rankWidth: NaN});
probe('rankWidth Inf', {...base, rankWidth: Infinity});
probe('rankWidth -3', {...base, rankWidth: -3});
probe('midRow NaN', {...base, midRow: NaN});
probe('playRow0 NaN', {...base, playRow0: NaN});
probe('playRow1 NaN', {...base, playRow1: NaN});
probe('playRow1 Inf', {...base, playRow1: Infinity});
probe('playRow0 -Inf', {...base, playRow0: -Infinity});
