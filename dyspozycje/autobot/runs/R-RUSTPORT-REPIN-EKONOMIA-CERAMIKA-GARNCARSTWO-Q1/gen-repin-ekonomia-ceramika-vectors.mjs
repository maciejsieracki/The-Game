// R-RUSTPORT-REPIN-EKONOMIA-CERAMIKA-GARNCARSTWO-Q1 (runda 4): wektory z URUCHOMIONEGO kodu weba 638e90bea.
// Uruchamia PRAWDZIWE funkcje weba (a nie asercje na JSON):
//   economy-upkeep.ts `buildingResourceUpkeep(rec, level, ratio)`  (utrzymanie_surowce + model proporcjonalny),
//   playerState.ts `techCost`, `parsePrereqs`, `availableTechs`, `cheapestAvailable` (Garncarstwo: 5. po czterech podstawach, 40 PN),
//   wonders-data.ts `sumWonderCityYieldsForOwner`, `getWonderById` (Kamien Ha'amonga bez martwych bonusow terenowych).
// Dane i kod: `git archive 638e90bea gra/src gra/data` rozpakowane POZA repo (KORZEN). Zero zmian w gra/**.
// Uzycie (z katalogu runu; Node 22):
//   node --experimental-transform-types --no-warnings --import ./gen-loader-register.mjs ./gen-repin-ekonomia-ceramika-vectors.mjs <KORZEN> <WYJSCIE.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outFile = process.argv[3];
if (!root || !outFile) {
  console.error('uzycie: gen-repin-ekonomia-ceramika-vectors.mjs <KORZEN> <WYJSCIE.json>');
  process.exit(2);
}
const url = (p) => pathToFileURL(`${root}/${p}`).href;
const U = await import(url('gra/src/game/economy-upkeep.ts'));
const P = await import(url('gra/src/game/playerState.ts'));
const WD = await import(url('gra/src/game/wonders-data.ts'));

const buildings = JSON.parse(readFileSync(`${root}/gra/data/buildings.json`, 'utf8'));
const techFile = JSON.parse(readFileSync(`${root}/gra/data/tech.json`, 'utf8'));
const techs = techFile.technologie ?? techFile;
const wondersFile = JSON.parse(readFileSync(`${root}/gra/data/wonders.json`, 'utf8'));

// ---- A: utrzymanie surowcowe budynkow (kazdy budynek x poziomy x wspolczynniki) ----
const RATIOS = [0, 0.5, 1, 2, 2.5];
const LEVELS = [1, 2, 3, 5];
const upkeep = [];
for (const b of buildings) {
  for (const level of LEVELS) {
    for (const ratio of RATIOS) {
      upkeep.push({ id: b.id, level, ratio, out: U.buildingResourceUpkeep(b, level, ratio) });
    }
  }
}
// domyslny wspolczynnik (parametr pominiety) = DEFAULT_BUILDING_RESOURCE_UPKEEP_RATIO
const defaultRatio = U.DEFAULT_BUILDING_RESOURCE_UPKEEP_RATIO;
const upkeepDefault = buildings.map((b) => ({ id: b.id, out: U.buildingResourceUpkeep(b) }));

// ---- B: technologie (koszty, prereq, dostepnosc Garncarstwa) ----
const costs = techs.map((t) => ({ id: t.Technologia, cost: P.techCost(t), prereq: P.parsePrereqs(t) }));
const BASICS = ['Rolnictwo', 'Łowiectwo', 'Obróbka drewna', 'Oswojenie zwierząt'];
const availability = [];
for (let mask = 0; mask < 1 << BASICS.length; mask++) {
  const done = new Set(BASICS.filter((_, i) => mask & (1 << i)));
  const avail = P.availableTechs(techs, done).map((t) => t.Technologia);
  availability.push({
    done: [...done],
    available: avail,
    cheapest: P.cheapestAvailable(techs, done) ?? null,
  });
}
// stan z samymi czterema podstawami + wszystkie techy poziomu 1 tej samej epoki poza Garncarstwem
const garn = techs.find((t) => t.Technologia === 'Garncarstwo');
const sameEra = techs.filter((t) => t.Epoka === garn.Epoka && t.Poziom === garn.Poziom && t.Technologia !== 'Garncarstwo');
const doneFull = new Set([...BASICS, ...sameEra.map((t) => t.Technologia)]);
availability.push({
  done: [...doneFull],
  available: P.availableTechs(techs, doneFull).map((t) => t.Technologia),
  cheapest: P.cheapestAvailable(techs, doneFull) ?? null,
});

// ---- C: cuda (bonusy miasta per era; obecnosc bonusow terenowych) ----
const ERAS = [0, 1, 2, 3, 4, 5, 6, 10];
const wonders = [];
for (const w of wondersFile.cuda) {
  const def = WD.getWonderById(w.id);
  wonders.push({
    id: w.id,
    hasTeren: Array.isArray(def?.bonusy?.teren) && def.bonusy.teren.length > 0,
    terenTypes: (def?.bonusy?.teren ?? []).map((t) => t.typTerenu),
    cityByEra: ERAS.map((e) => ({ era: e, sum: WD.sumWonderCityYieldsForOwner([w.id], e) })),
  });
}

const out = {
  pin: '638e90bea',
  defaultRatio,
  ratios: RATIOS,
  levels: LEVELS,
  eras: ERAS,
  basics: BASICS,
  upkeep,
  upkeepDefault,
  costs,
  availability,
  wonders,
};
writeFileSync(outFile, JSON.stringify(out));
console.log(JSON.stringify({ upkeep: upkeep.length, techs: costs.length, availability: availability.length, wonders: wonders.length }));
