// Generator wektorow D2.2c: PELNA funkcja `cityYieldPerTurn` z weba @91dc998a uruchomiona w node.
// Oracle = wynik `cityYieldPerTurn` (bez zadnych wycinkow). Wejscia agregatow Step 1 i Step 3
// (suma tileYield / buildingValue po kafelkach i budynkach) licza te same eksportowane funkcje weba
// petla 1:1 jak L837-847 i L873-882 (pinned), zeby podac Rust agregaty bez portowania tileYield.
import { writeFileSync } from 'node:fs';
import { cityYieldPerTurn, tileYield, buildingValue, buildingHappinessAtLevel } from './economy.ts';
import { TerenBazowy, Nakladka } from '../types/hex.ts';

const out = process.argv[2];
const f = (x: number): { f: string } => ({ f: Object.is(x, -0) ? '-0' : String(x) });
const enc = (v: any): any => {
  if (v === undefined) return { u: true };
  if (v === null) return null;
  if (typeof v === 'number') return f(v);
  return v;
};
const encObj = (o: any) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));

let seed = 0x7c3d2c17;
const rnd = (): number => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
const SPECIAL = [0, -0, 1, 2.5, 7, 13.7, 100, 1e6, NaN, Infinity, -Infinity, 0.5, 0.999, 250.99999, -3];
const num = (lo: number, hi: number): number =>
  rnd() < 0.1 ? pick(SPECIAL) : Math.round((lo + rnd() * (hi - lo)) * 100) / 100;

const TERRAINS = Object.values(TerenBazowy) as TerenBazowy[];
const NAKLADKI = Object.values(Nakladka) as Nakladka[];

const PARAMS_POOL = [
  { korupcjaCap: 0.5, mennicaMnoznikPoWalucie: 1.5, budynekBibliotekaBonusNauki: 0.15, budynekAkademiaBonusNauki: 0.1, budynekGarncarniaBonusZywnosci: 0.1, zywnoscZuzytkaPopulacja: 0.5, budynekMlynMnoznikPracy: 2, budynekMlynBonusPracy: 2, budynekCegielniBonusPracy: 0.25 },
  { korupcjaCap: 0.2, mennicaMnoznikPoWalucie: 1.62, budynekBibliotekaBonusNauki: 0, budynekAkademiaBonusNauki: 0, budynekGarncarniaBonusZywnosci: 0, zywnoscZuzytkaPopulacja: 0.3, budynekMlynMnoznikPracy: 1.5, budynekMlynBonusPracy: 0, budynekCegielniBonusPracy: 0 },
  { korupcjaCap: 1, mennicaMnoznikPoWalucie: 1, budynekBibliotekaBonusNauki: 0.25, budynekAkademiaBonusNauki: 0.5, budynekGarncarniaBonusZywnosci: 0.2, zywnoscZuzytkaPopulacja: 0, budynekMlynMnoznikPracy: 0, budynekMlynBonusPracy: -0, budynekCegielniBonusPracy: -0 },
  { korupcjaCap: NaN, mennicaMnoznikPoWalucie: 0, budynekBibliotekaBonusNauki: -0, budynekAkademiaBonusNauki: 1, budynekGarncarniaBonusZywnosci: 0.1, zywnoscZuzytkaPopulacja: 0.5, budynekMlynMnoznikPracy: NaN, budynekMlynBonusPracy: 3, budynekCegielniBonusPracy: 0.1 },
];

const BUILDING_IDS = ['port', 'port', 'mlyn', 'cegielnia', 'sad', 'biblioteka', 'mury'];
const makeBuilding = (id: string) => {
  const baza: Record<string, number> = {};
  const przyrost: Record<string, number> = {};
  for (const k of ['praca', 'pieniadz', 'zywnosc', 'nauka', 'kultura']) {
    baza[k] = rnd() < 0.4 ? 0 : num(0, 12);
    przyrost[k] = rnd() < 0.5 ? 0 : num(0, 4);
  }
  if (rnd() < 0.5) { baza.zadowolenie = num(0, 3); przyrost.zadowolenie = 0; }
  return { id, baza, przyrost, dajeSzczescie: rnd() < 0.5 };
};

const cases: any[] = [];
const N = 1200;
for (let i = 0; i < N; i++) {
  const civKeyPool: (string | null | undefined)[] = [null, undefined, '', 'nieznana_cywilizacja', 'Fenicjanie', 'GRECY', 'Grecy'];
  const civKey = pick(civKeyPool);
  const nTiles = Math.floor(rnd() * 5);
  const tiles: any[] = [];
  for (let t = 0; t < nTiles; t++) {
    tiles.push({
      terenBazowy: pick(TERRAINS),
      nakladka: pick(NAKLADKI),
      maRzeke: rnd() < 0.3,
    });
  }
  const nB = Math.floor(rnd() * 5);
  const buildings: { record: any; level: number }[] = [];
  for (let b = 0; b < nB; b++) {
    buildings.push({ record: makeBuilding(pick(BUILDING_IDS)), level: 1 + Math.floor(rnd() * 3) });
  }
  // Agregaty Step 1 (L837-847) i Step 3 (L873-882) -- dokladnie petle weba, przez eksportowane funkcje.
  let zywnoscTerenu = 0, pracaTerenu = 0, handelTerenu = 0;
  for (const tile of tiles) {
    const y = tileYield(tile);
    zywnoscTerenu += y.zywnosc;
    pracaTerenu += y.praca;
    handelTerenu += y.handel;
  }
  let pracaBudynkow = 0, pieniadzBudynkow = 0, pieniadzPortu = 0, zywnoscBudynkow = 0, naukaBudynkow = 0, kulturaBudynkow = 0;
  for (const { record, level } of buildings) {
    pracaBudynkow += buildingValue(record, level, 'praca');
    const bm = buildingValue(record, level, 'pieniadz');
    pieniadzBudynkow += bm;
    if (record.id === 'port') pieniadzPortu += bm;
    zywnoscBudynkow += buildingValue(record, level, 'zywnosc');
    naukaBudynkow += buildingValue(record, level, 'nauka');
    kulturaBudynkow += buildingValue(record, level, 'kultura');
    buildingHappinessAtLevel(record, level);
  }

  const specPool = ['poborca', 'poborca', 'inny', 'poborca'];
  const specjalisci = Array.from({ length: Math.floor(rnd() * 3) }, () => pick(specPool));
  const city = {
    civKey,
    ludnosc: rnd() < 0.2 ? pick(SPECIAL) : num(0, 40),
    podziałHandlu: {
      procentNauka: rnd() < 0.1 ? pick(SPECIAL) : num(0, 100),
      procentPieniadz: rnd() < 0.1 ? pick(SPECIAL) : num(0, 100),
      procentLuksus: rnd() < 0.1 ? pick(SPECIAL) : num(0, 100),
    },
    podziałPracy: { procentBudynki: num(0, 100) },
    specjalisci,
  };
  const ctx: any = {
    strataFraction: rnd() < 0.1 ? pick(SPECIAL) : num(0, 0.9),
    walutaOdkryta: pick([true, false]),
    maMennica: pick([true, false]),
    maMlyn: pick([true, false]),
    maCegielnia: pick([true, false]),
    maBiblioteka: pick([true, false]),
    maAkademia: pick([true, false]),
    civHandelMult: rnd() < 0.4 ? undefined : pick([1, 1.15, 0.8, 0, -0, NaN]),
    premiaHandluTrasHandlowych: rnd() < 0.4 ? undefined : pick([0, -0, 3.25, 17, NaN, -2]),
    additionalTax: rnd() < 0.4 ? undefined : pick([0, -0, 4.5, 33.3, -1, NaN]),
    civNaukaMult: rnd() < 0.4 ? undefined : pick([1, 1.3, 0.5, 0, NaN]),
    liczbaGarncarni: rnd() < 0.4 ? undefined : pick([0, 1, 2, 3]),
    wojskoZuzycieZywnosci: rnd() < 0.7 ? 0 : num(0, 20),
  };
  const params: any = pick(PARAMS_POOL);

  const got: any = cityYieldPerTurn(city as any, tiles as any, buildings as any, params, ctx);

  const aggregates = {
    zywnoscTerenu, pracaTerenu, handelTerenu,
    pracaBudynkow, pieniadzBudynkow, pieniadzPortu, zywnoscBudynkow, naukaBudynkow, kulturaBudynkow,
  };
  cases.push({
    in: {
      agg: encObj(aggregates),
      city: { civKey: enc(civKey), ludnosc: enc(city.ludnosc), podzial: encObj(city.podziałHandlu), poborca: specjalisci.filter((s) => s === 'poborca').length },
      flags: { maMlyn: ctx.maMlyn, maCegielnia: ctx.maCegielnia, walutaOdkryta: ctx.walutaOdkryta, maMennica: ctx.maMennica, maBiblioteka: ctx.maBiblioteka, maAkademia: ctx.maAkademia },
      ctx: encObj({
        strataFraction: ctx.strataFraction,
        civHandelMult: enc(ctx.civHandelMult),
        premiaHandluTrasHandlowych: enc(ctx.premiaHandluTrasHandlowych),
        additionalTax: enc(ctx.additionalTax),
        civNaukaMult: enc(ctx.civNaukaMult),
        liczbaGarncarni: enc(ctx.liczbaGarncarni),
        wojskoZuzycieZywnosci: ctx.wojskoZuzycieZywnosci,
      }),
      params: encObj(params),
    },
    out: {
      praca: enc(got.praca),
      pieniadz: enc(got.pieniadz),
      zywnosc: enc(got.zywnosc),
      nauka: enc(got.nauka),
      luksus: enc(got.luksus),
      kultura: enc(got.kultura),
      zywnoscBrutto: enc(got.zywnoscBrutto),
      handelBrutto: enc(got.handelBrutto),
      pracaTerenu: enc(got.pracaTerenu),
      pracaBudynkow: enc(got.pracaBudynkow),
      pieniadzBudynkow: enc(got.pieniadzBudynkow),
      pieniadzZPracy: enc(got.pieniadzZPracy),
    },
  });
}
writeFileSync(out, JSON.stringify({ pin: '91dc998a', n: cases.length, cases }));
console.log('wrote', cases.length, 'cases');
