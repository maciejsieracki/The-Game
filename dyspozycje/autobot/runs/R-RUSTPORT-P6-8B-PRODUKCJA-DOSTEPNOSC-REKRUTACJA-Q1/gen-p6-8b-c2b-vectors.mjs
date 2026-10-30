// P6.8B-P1b-c2b (pin 91dc998a): wektory z URUCHOMIONEGO weba dla symbolu:
//   availableReplacementsFor (production.ts ~1136-1252) -- wywolany na PRAWDZIWYM production.ts
//   (graf importow ladowany w calosci przez repin-b-loader-hooks.mjs; zadnych stubow).
// Dane: PRAWDZIWE `gra/data/units.json` i `gra/data/buildings.json` z pinu (bez przepisywania).
// Kontekst (AvailabilityContext): zestaw zdefiniowanych wariantow ctx (ponizej); brak pola = `undefined`.
// Uruchomienie (Node 22, z katalogu tego runu):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8b-c2b-vectors.mjs <WEB_ROOT (katalog z gra/, z git archive 91dc998a gra)> \
//        <KATALOG_WYJSCIA> <KATALOG_ROBOCZY_POZA_REPO>
// Kodowanie: calkowita skonczona = JSON number; niecalkowita = {"$f": String(x)};
// NaN/Infinity/-Infinity/-0 = {"$n": "..."}; undefined = {"absent": true}; null = null.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
const scratch = presolve(process.argv[4] ?? '');
if (!process.argv[4]) throw new Error('podaj 3. argument: katalog roboczy poza repo');
mkdirSync(outDir, { recursive: true });
mkdirSync(scratch, { recursive: true });

const W = await import(pathToFileURL(join(webRoot, 'gra/src/game/production.ts')).href);
const units = JSON.parse(readFileSync(join(webRoot, 'gra/data/units.json'), 'utf8'));
const buildings = JSON.parse(readFileSync(join(webRoot, 'gra/data/buildings.json'), 'utf8'));
if (!Array.isArray(units) || !Array.isArray(buildings)) throw new Error('units/buildings: oczekiwano tablic');
const names = units.map((u) => u.Jednostka);
if (new Set(names).size !== names.length) throw new Error('Jednostka nie jest unikalna (findUnit = pierwszy)');

// Zbior syntetyczny (ten sam format co units.json): dwie jednostki dodane, by pokryc galezie,
// ktore w prawdziwych danych nie wystepuja (Typ Naval bez innego Naval; Nacja '' z niepustym
// 'W zamian za'). Prawdziwe dane NIE sa modyfikowane: kopia + 2 nowe wiersze.
const galera = units.find((u) => u.Jednostka === 'Galera');
if (!galera) throw new Error('brak Galera w units.json');
const unitsSynth = [
  ...units,
  { ...galera, Jednostka: 'Galera testowa', Nacja: '', 'W zamian za': '—', 'Zastąp specjalnie': '—' },
  { ...galera, Jednostka: 'Jednostka bez typu', Typ: '', Nacja: '', Epoka: 'Kamień', Tech: '-', Surowiec: 'Drewno', 'W zamian za': '—', 'Zastąp specjalnie': '—', 'Super-jednostka': '—', 'Pieniądz (koszt)': 5 },
  { ...galera, Jednostka: 'Jednostka bez typu 2', Typ: '', Nacja: '', Epoka: 'Kamień', Tech: '-', Surowiec: 'Drewno', 'W zamian za': '—', 'Zastąp specjalnie': '—', 'Super-jednostka': '—', 'Pieniądz (koszt)': 5 },
  { ...galera, Jednostka: 'Wojownik próbny', Typ: 'Swordsman', Nacja: '', Epoka: 'Kamień', Tech: '-', Surowiec: 'Drewno',
    'W zamian za': 'Wojownik', 'Zastąp specjalnie': '—', 'Super-jednostka': '—', 'Pieniądz (koszt)': 5 },
];
const datasets = { real: units, synth: unitsSynth };

const enc = (x) => {
  if (x === undefined) return { absent: true };
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
};

// Pola UnitDef czytane przez availableReplacementsFor / itemCost (surowe wartosci z units.json).
const UNIT_FIELDS = ['Jednostka', 'Epoka', 'Tech', 'Typ', 'Nacja', 'Surowiec', 'W zamian za',
  'Zastąp specjalnie', 'Super-jednostka', 'Pieniądz (koszt)', 'Rola (linia)'];
const pickRaw = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k] === undefined ? { absent: true } : o[k]]));
const unitsProj = units.map((u) => pickRaw(u, UNIT_FIELDS));
const buildingsProj = buildings.map((b) => pickRaw(b, ['id', 'upgradeFrom', 'odblokowuje']));

// Zbior technologii z units.json (wartosci Tech, bez pustych/myslnikow).
const allTechs = [...new Set(units.map((u) => (u.Tech ?? '').toString().trim()))]
  .filter((t) => t && t !== '-' && t !== '—');
const halfTechs = allTechs.filter((_, i) => i % 2 === 0);

// Wartosci Tech i Typ z units.json podane jako JS (nie zmieniamy danych).
// Warianty kontekstu. `undefined` = pole nieobecne w obiekcie ctx.
const CTX = [
  { name: 'domyslny', spec: {} },
  { name: 'epoka2-koszary-grecja', spec: { epoch: 2, builtBuildingIds: ['koszary'], civUnitNacja: 'Grecja', ownerTech: [], empireResourceStock: { braz: 1 } } },
  { name: 'epoka3-wszystkie-techy', spec: { epoch: 3, builtBuildingIds: ['koszary'], techs: allTechs, civUnitNacja: 'Grecja', cityHasCoastOrRiver: true, empireResourceStock: { zelazo: 2, drewno: 0 } } },
  { name: 'epoka4-akademia', spec: { epoch: 4, builtBuildingIds: ['akademia_wojskowa'], techs: allTechs, civUnitNacja: '', cityHasCoastOrRiver: true, showStockGatedUnits: true, empireResourceStock: {} } },
  { name: 'epoka2-rzym-zapas-zerowy', spec: { epoch: 2, techs: allTechs, civUnitNacja: 'Rzym', empireResourceStock: { braz: 0, zelazo: 0, drewno: 1 } } },
  { name: 'epoka3-celtowie-zywe', spec: { epoch: 3, builtBuildingIds: ['koszary', 'mury'], aliveUnitTypeNames: ['Wojownik', 'Procarz'], civUnitNacja: 'Celtowie', cityHasCoastOrRiver: true, empireResourceStock: { braz: 1, zelazo: 1, drewno: 1 } } },
  { name: 'epoka-NaN-bez-zapasu', spec: { epoch: NaN, builtBuildingIds: ['koszary'], civUnitNacja: 'Grecja' } },
  { name: 'civKey-null', spec: { epoch: 2, civKey: null, civUnitNacja: 'Grecja', techs: allTechs } },
  { name: 'civKey-grecy', spec: { epoch: 2, civKey: 'grecy', civUnitNacja: 'Rzym', techs: allTechs, builtBuildingIds: ['koszary'], empireResourceStock: { braz: 1, zelazo: 1, drewno: 1 } } },
  { name: 'civKey-nieznany-slowianie', spec: { epoch: 3, civKey: 'Slowianie', civUnitNacja: 'Słowianie', techs: allTechs, builtBuildingIds: ['koszary'], empireResourceStock: { zelazo: 1 } } },
  { name: 'epoka4-pokaz-zapas', spec: { epoch: 4, techs: halfTechs, civUnitNacja: 'Grecja', showStockGatedUnits: true, builtBuildingIds: ['koszary', 'akademia_wojskowa', 'mury'] } },
  { name: 'epoka3-polowe-techy', spec: { epoch: 3, techs: halfTechs, civUnitNacja: 'Słowianie', builtBuildingIds: ['koszary'], empireResourceStock: { braz: 1, drewno: 1 } } },
  { name: 'epoka-NaN-wszystko', spec: { epoch: NaN, techs: allTechs, builtBuildingIds: ['koszary'], civUnitNacja: 'Grecja', cityHasCoastOrRiver: true, empireResourceStock: { braz: 1, zelazo: 1, drewno: 1 } } },
  { name: 'epoka4-zywe-super', spec: { epoch: 4, builtBuildingIds: ['koszary'], techs: allTechs, civUnitNacja: 'Grecja', aliveUnitTypeNames: ['Triari', 'Evocati', 'Hieros Lochos (Święty Zastęp)', 'Medżaj (Gwardia Faraona)'], empireResourceStock: { braz: 1, zelazo: 1, drewno: 1 } } },
  { name: 'epoka1-bez-koszar', spec: { epoch: 1, techs: allTechs, civUnitNacja: 'Grecja', empireResourceStock: { braz: 1, zelazo: 1, drewno: 1 } } },
  { name: 'epoka2-morze', spec: { epoch: 2, techs: allTechs, civUnitNacja: 'Ludy Morza', builtBuildingIds: ['koszary'], cityHasCoastOrRiver: false, empireResourceStock: { braz: 1, zelazo: 1, drewno: 1 } } },
];

// Nazwy bieżących jednostek: wszystkie z units.json + przypadki brzegowe.

const cases = [];
for (const [dsName, dsUnits] of Object.entries(datasets)) {
for (const c of CTX) {
  const ctx = {};
  const s = c.spec;
  for (const [k, v] of Object.entries(s)) {
    if (k === 'ownerTech') continue;
    if (k === 'techs') continue; // techs podawane jako unlockedTechs (argument osobny)
    if (k === 'aliveUnitTypeNames') { ctx.aliveUnitTypeNames = new Set(v); continue; }
    if (k === 'empireResourceStock') { ctx.empireResourceStock = { ...v }; continue; }
    ctx[k] = v;
  }
  const unlocked = s.techs ?? [];
  const dsNames = dsUnits.map((u) => u.Jednostka);
  for (const name of [...dsNames, 'nieistnieje', '', 'Wojownik ', 'Zwiadowca']) {
    const out = W.availableReplacementsFor(name, { buildings, units: dsUnits }, unlocked, ctx);
    cases.push({
      ds: dsName,
      ctx: c.name,
      current: name,
      out: out.map((it) => [it.id, enc(it.koszt), it.nazwa === it.id ? true : it.nazwa]),
      outKinds: [...new Set(out.map((it) => it.kind))],
    });
  }
}
}

// Kontekst w JSON (dla czytelnosci testu Rust): definicje wariantow.
const ctxDoc = CTX.map((c) => ({
  name: c.name,
  epoch: 'epoch' in c.spec ? enc(c.spec.epoch) : { absent: true },
  builtBuildingIds: c.spec.builtBuildingIds ?? { absent: true },
  civKey: 'civKey' in c.spec ? (c.spec.civKey === null ? null : c.spec.civKey) : { absent: true },
  civUnitNacja: c.spec.civUnitNacja ?? { absent: true },
  cityHasCoastOrRiver: c.spec.cityHasCoastOrRiver ?? { absent: true },
  showStockGatedUnits: c.spec.showStockGatedUnits ?? { absent: true },
  aliveUnitTypeNames: c.spec.aliveUnitTypeNames ?? { absent: true },
  empireResourceStock: c.spec.empireResourceStock ? Object.fromEntries(Object.entries(c.spec.empireResourceStock).map(([k, v]) => [k, enc(v)])) : { absent: true },
  techs: c.spec.techs ? { list: c.spec.techs.length === allTechs.length ? 'ALL' : 'HALF' } : { absent: true },
}));

const doc = {
  zrodlo: 'production.ts availableReplacementsFor (@91dc998a) z units.json/buildings.json @91dc998a; uruchomione z pinu (repin-b-loader-hooks)',
  allTechs,
  halfTechs,
  unitsProj,
  unitsProjSynth: unitsSynth.map((u) => pickRaw(u, UNIT_FIELDS)),
  buildingsProj,
  ctxDoc,
  cases,
};
writeFileSync(join(outDir, 'p1b-c2b.json'), JSON.stringify(doc) + '\n');
const nonEmpty = cases.filter((c) => c.out.length > 0).length;
console.log('cases', cases.length, 'nonEmpty', nonEmpty, 'units', units.length, 'allTechs', allTechs.length);
