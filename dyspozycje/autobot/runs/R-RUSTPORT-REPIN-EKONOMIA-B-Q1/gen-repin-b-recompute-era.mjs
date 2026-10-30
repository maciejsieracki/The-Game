// REPIN-EKONOMIA-B (runda 3, obrona M4): wektor recomputeCityFoodBalancesInEcon z ownerEra z URUCHOMIONEGO weba 91dc998a.
// Kodowanie liczb jak w gen-p67a-vectors.mjs (replacer): NaN/Infinity/-0 jako napisy, niecalkowite jako '~<liczba>'.
// Uruchomienie (Node 22, z katalogu tego runu):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-repin-b-recompute-era.mjs <WEB_ROOT = katalog z gra/src i gra/data (git archive 91dc998a)> <PLIK_WYJSCIA.json>
import { writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outFile = presolve(process.argv[3]);
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

function replacer(_k, v) {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    if (Object.is(v, -0)) return '-0';
    if (!Number.isInteger(v) || Math.abs(v) > 2 ** 53) return '~' + String(v);
    return v;
  }
  return v;
}
const norm = (x) => JSON.parse(JSON.stringify(x, replacer));

await import(src('game/cities.ts'));
const PG = await import(src('game/population-growth-v85.ts'));
const TE = await import(src('game/turn-economy.ts'));
const RATION_PARAMS = PG.buildRationParams({}, 'normal');

const POPS = [0, 5.5, 100, 12345.678];
const ERAS = [undefined, 0.5, 1, 1.0000001, 2, 3, 4, 5];
const SPICH = [
  null,
  { ceramikaActive: true, solActive: false, maSpichlerzPop: false, maSpichlerzIIPop: false },
  { ceramikaActive: true, solActive: true, maSpichlerzPop: true, maSpichlerzIIPop: true },
];
const cases = [];
let n = 0;
for (const pop of POPS) for (const level of PG.WYZYWIENIE_LEVELS) for (const era of ERAS) for (const st of SPICH) {
  const id = `c${n}`;
  const city = { id, ownerId: 1, q: 0, r: 0, name: id, population: pop, poziomRacji: level, autoWyzywienie: false, rationMigratedV114: true };
  const tick = {
    cityId: id, ownerId: 1, oblegany: false,
    zywnoscNetto: 3, kosztRacji: 1.25, zdrowie: 0.5,
    ...(n % 2 === 0 ? { zywnoscBrutto: 40.5 } : {}),
    ...(st ? { spichlerzCeramika: st.ceramikaActive, spichlerzSol: st.solActive, maSpichlerz: st.maSpichlerzPop, maSpichlerzII: st.maSpichlerzIIPop } : {}),
    ...(era === undefined ? {} : { ownerEra: era }),
  };
  const ticks = [tick];
  const spichMap = st ? new Map([[id, st]]) : undefined;
  const cityIn = norm(city);
  const ticksIn = norm(ticks);
  TE.recomputeCityFoodBalancesInEcon(ticks, [city], RATION_PARAMS, spichMap);
  cases.push({ cities: [cityIn], ticks: ticksIn, spichlerz: st ? [[id, st]] : null, out: norm(ticks) });
  n++;
}
writeFileSync(outFile, JSON.stringify({ pin: '91dc998a5f1b51ad29e0f4785edfd45655445c53', recompute: cases }, null, 1) + '\n');
console.log(`cases=${cases.length}`);
