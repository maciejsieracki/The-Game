// D2.2e generator (r1 operator): PELNA funkcja weba `tileYield` (galaz impKeys: ulepszenia + zloza)
// i `buildingHappinessAtLevel` z pinu 91dc998a. Oracle = wynik funkcji weba, bez wycinkow.
import { writeFileSync } from 'node:fs';
import { tileYield, buildingHappinessAtLevel } from './economy.ts';
import { TerenBazowy, Nakladka } from '../types/hex.ts';
import improvementsRaw from '../../data/terrain-improvements.json';
import realBuildingsJson from '../../data/buildings.json';

const out = process.argv[2];
const N_TILE = 2000;
const N_CITY = 400;
const N_HAP = 1500;
const N_HAP_REAL = 400;

const f = (x: number): { f: string } => ({ f: Object.is(x, -0) ? '-0' : String(x) });
const enc = (v: any): any => {
  if (v === undefined) return { u: true };
  if (v === null) return null;
  if (typeof v === 'number') return f(v);
  return v;
};

let seed = 0x51ed2701;
const rnd = (): number => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];

const IMP_KEYS_ALL = Object.keys(improvementsRaw as any).filter((k) => !k.startsWith('_'));
const IMP_POOL: string[] = [...IMP_KEYS_ALL, ...IMP_KEYS_ALL, 'pastwisko', 'kopalnia', 'brak', 'nieznane_ulepszenie', ''];
const ZLOZA: (string | null | undefined)[] = ['zelazo', 'miedz', 'wegiel', 'ruda', 'Zelazo', ' miedz ', '', null, undefined];
const TERRAINS: string[] = [...(Object.values(TerenBazowy) as string[]), 'nieznany_teren'];
const NAKLADKI: string[] = [...(Object.values(Nakladka) as string[]), 'brak_nakladki'];

const makeTile = () => {
  const r = rnd();
  let ulepszeniaKeys: any;
  if (r < 0.3) ulepszeniaKeys = undefined;
  else if (r < 0.4) ulepszeniaKeys = [];
  else {
    const n = 1 + Math.floor(rnd() * 3);
    ulepszeniaKeys = Array.from({ length: n }, () => pick(IMP_POOL));
  }
  const ulepszenieKey = rnd() < 0.6 ? undefined : (rnd() < 0.1 ? null : pick(IMP_POOL));
  return {
    terenBazowy: pick(TERRAINS),
    nakladka: pick(NAKLADKI),
    maRzeke: rnd() < 0.3,
    ulepszeniaKeys,
    ulepszenieKey,
    zloze: pick(ZLOZA),
  };
};

const tileCase = (t: any) => {
  const y: any = tileYield(t as any);
  return {
    in: {
      teren: t.terenBazowy,
      nakladka: t.nakladka,
      maRzeke: t.maRzeke,
      ulepszeniaKeys: t.ulepszeniaKeys === undefined ? { u: true } : (t.ulepszeniaKeys === null ? null : t.ulepszeniaKeys),
      ulepszenieKey: enc(t.ulepszenieKey),
      zloze: enc(t.zloze),
    },
    out: {
      zywnosc: enc(y.zywnosc), praca: enc(y.praca), handel: enc(y.handel),
      drewno: enc(y.drewno), kamien: enc(y.kamien), glina: enc(y.glina),
      ruda: enc(y.ruda), ruda_zelaza: enc(y.ruda_zelaza),
    },
  };
};

const tiles: any[] = [];
for (let i = 0; i < N_TILE; i++) tiles.push(makeTile());

// Przypadki miast: 0-4 kafelki, sumy Step 1 (zywnosc, praca, handel) petla 1:1 jak L837-847.
const cities: any[] = [];
for (let i = 0; i < N_CITY; i++) {
  const n = Math.floor(rnd() * 5);
  const ts = Array.from({ length: n }, makeTile);
  let zywnoscTerenu = 0, pracaTerenu = 0, handelTerenu = 0;
  for (const t of ts) {
    const y: any = tileYield(t as any);
    zywnoscTerenu += y.zywnosc;
    pracaTerenu += y.praca;
    handelTerenu += y.handel;
  }
  cities.push({
    tiles: ts.map(tileCase),
    agg: { zywnoscTerenu: f(zywnoscTerenu), pracaTerenu: f(pracaTerenu), handelTerenu: f(handelTerenu) },
  });
}

// buildingHappinessAtLevel: syntetyczne rekordy (zadowolenie obecne/brak/0/NaN, dajeSzczescie true/false/brak)
// oraz PRAWDZIWE rekordy z buildings.json.
const REAL: any[] = Array.isArray(realBuildingsJson) ? (realBuildingsJson as any[]) : ((realBuildingsJson as any).buildings as any[]);
const LEVELS: number[] = [1, 2, 3, 4, 5, 0, -1, 1.5, 2.9, NaN, Infinity];
const ZAD_BASE: any[] = [undefined, null, 0, -0, 1, 2, 3.5, NaN, 'x'];
const ZAD_PRZ: any[] = [undefined, 0, -0, 1, 2, 0.5, NaN];
const DAJE: any[] = [true, false, undefined, 'tak', 1];

const hapCases: any[] = [];
const pushHap = (rec: any, level: number) => {
  const h = buildingHappinessAtLevel(rec as any, level);
  const bazaKeys = rec.baza ? Object.fromEntries(Object.entries(rec.baza).map(([k, v]) => [k, enc(v)])) : undefined;
  const przKeys = rec.przyrost ? Object.fromEntries(Object.entries(rec.przyrost).map(([k, v]) => [k, enc(v)])) : undefined;
  hapCases.push({
    in: {
      id: rec.id ?? 'syn',
      dajeSzczescie: enc(rec.dajeSzczescie),
      baza: bazaKeys === undefined ? { u: true } : bazaKeys,
      przyrost: przKeys === undefined ? { u: true } : przKeys,
      level: enc(level),
    },
    out: enc(h),
  });
};
for (let i = 0; i < N_HAP; i++) {
  const zb = pick(ZAD_BASE);
  const baza: any = {};
  if (zb !== undefined) baza.zadowolenie = zb;
  const przyrost: any = {};
  const zp = pick(ZAD_PRZ);
  if (zp !== undefined) przyrost.zadowolenie = zp;
  const rec = { id: 'syn', dajeSzczescie: pick(DAJE), baza, przyrost };
  pushHap(rec, pick(LEVELS));
}
for (let i = 0; i < N_HAP_REAL; i++) {
  const rec: any = pick(REAL);
  pushHap(rec, 1 + Math.floor(rnd() * Math.min(5, rec.maksPoziom ?? 5)));
}

// PELNA cityYieldPerTurn z kafelkami z ulepszeniami (web liczy tileYield wewnatrz).
import { cityYieldPerTurn } from './economy.ts';
const SPECIAL: any[] = [0, -0, 1, 2.5, 7, 13.7, 100, 1e6, NaN, Infinity, -Infinity, 0.5, 0.999, 250.99999, -3];
const num = (lo: number, hi: number): number =>
  rnd() < 0.1 ? pick(SPECIAL) : Math.round((lo + rnd() * (hi - lo)) * 100) / 100;
const PARAMS_POOL: any[] = [
  { korupcjaCap: 0.5, mennicaMnoznikPoWalucie: 1.5, budynekBibliotekaBonusNauki: 0.15, budynekAkademiaBonusNauki: 0.1, budynekGarncarniaBonusZywnosci: 0.1, zywnoscZuzytkaPopulacja: 0.5, budynekMlynMnoznikPracy: 2, budynekMlynBonusPracy: 2, budynekCegielniBonusPracy: 0.25 },
  { korupcjaCap: 0.2, mennicaMnoznikPoWalucie: 1.62, budynekBibliotekaBonusNauki: 0, budynekAkademiaBonusNauki: 0, budynekGarncarniaBonusZywnosci: 0, zywnoscZuzytkaPopulacja: 0.3, budynekMlynMnoznikPracy: 1.5, budynekMlynBonusPracy: 0, budynekCegielniBonusPracy: 0 },
  { korupcjaCap: 1, mennicaMnoznikPoWalucie: 1, budynekBibliotekaBonusNauki: 0.25, budynekAkademiaBonusNauki: 0.5, budynekGarncarniaBonusZywnosci: 0.2, zywnoscZuzytkaPopulacja: 0, budynekMlynMnoznikPracy: 0, budynekMlynBonusPracy: -0, budynekCegielniBonusPracy: -0 },
];
const YIELD_KEYS = ['praca', 'pieniadz', 'zywnosc', 'nauka', 'kultura'];
const makeBuilding = (id: string) => {
  const baza: Record<string, number> = {};
  const przyrost: Record<string, number> = {};
  for (const k of YIELD_KEYS) {
    baza[k] = rnd() < 0.4 ? 0 : num(0, 12);
    przyrost[k] = rnd() < 0.5 ? 0 : num(0, 4);
  }
  return { id, baza, przyrost, dajeSzczescie: rnd() < 0.5 };
};
const yEnc = (o: any) => Object.fromEntries(YIELD_KEYS.map((k) => [k, f(Number(o[k] ?? NaN))]));
const N_FULL = 800;
const full: any[] = [];
for (let i = 0; i < N_FULL; i++) {
  const nT = Math.floor(rnd() * 5);
  const ts = Array.from({ length: nT }, makeTile);
  const nB = Math.floor(rnd() * 5);
  const bs: { record: any; level: number }[] = [];
  for (let b = 0; b < nB; b++) {
    const rec: any = rnd() < 0.5 && REAL.length ? pick(REAL) : makeBuilding(pick(['port', 'port', 'mlyn', 'cegielnia', 'sad', 'biblioteka', 'mury']));
    bs.push({ record: rec, level: 1 + Math.floor(rnd() * 3) });
  }
  const civKey = pick([null, undefined, '', 'nieznana_cywilizacja', 'Fenicjanie', 'GRECY', 'Grecy'] as (string | null | undefined)[]);
  const specjalisci = Array.from({ length: Math.floor(rnd() * 3) }, () => pick(['poborca', 'poborca', 'inny', 'poborca']));
  const city: any = {
    civKey,
    ludnosc: rnd() < 0.2 ? pick(SPECIAL) : num(0, 40),
    podziałHandlu: { procentNauka: num(0, 100), procentPieniadz: num(0, 100), procentLuksus: num(0, 100) },
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
  const bArg = bs.map(({ record, level }) => ({ record, level }));
  const got: any = cityYieldPerTurn(city as any, ts as any, bArg as any, params, ctx);
  full.push({
    in: {
      tiles: ts.map(tileCase),
      buildings: bs.map(({ record, level }) => ({
        id: record.id,
        level: f(level),
        baza: yEnc(record.baza),
        przyrost: yEnc(record.przyrost),
      })),
      city: { civKey: enc(civKey), ludnosc: enc(city.ludnosc), podzial: { procentNauka: enc(city.podziałHandlu.procentNauka), procentPieniadz: enc(city.podziałHandlu.procentPieniadz), procentLuksus: enc(city.podziałHandlu.procentLuksus) }, poborca: specjalisci.filter((s) => s === 'poborca').length },
      flags: { maMlyn: ctx.maMlyn, maCegielnia: ctx.maCegielnia, walutaOdkryta: ctx.walutaOdkryta, maMennica: ctx.maMennica, maBiblioteka: ctx.maBiblioteka, maAkademia: ctx.maAkademia },
      ctx: {
        strataFraction: enc(ctx.strataFraction), civHandelMult: enc(ctx.civHandelMult), premiaHandluTrasHandlowych: enc(ctx.premiaHandluTrasHandlowych),
        additionalTax: enc(ctx.additionalTax), civNaukaMult: enc(ctx.civNaukaMult), liczbaGarncarni: enc(ctx.liczbaGarncarni), wojskoZuzycieZywnosci: enc(ctx.wojskoZuzycieZywnosci),
      },
      params: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, enc(v)])),
    },
    out: {
      praca: enc(got.praca), pieniadz: enc(got.pieniadz), zywnosc: enc(got.zywnosc), nauka: enc(got.nauka), luksus: enc(got.luksus), kultura: enc(got.kultura),
      zywnoscBrutto: enc(got.zywnoscBrutto), handelBrutto: enc(got.handelBrutto), pracaTerenu: enc(got.pracaTerenu), pracaBudynkow: enc(got.pracaBudynkow),
      pieniadzBudynkow: enc(got.pieniadzBudynkow), pieniadzZPracy: enc(got.pieniadzZPracy),
    },
  });
}

writeFileSync(out, JSON.stringify({ pin: '91dc998a', nTile: tiles.length, tiles: tiles.map(tileCase), nCity: cities.length, cities, nHap: hapCases.length, hap: hapCases, nFull: full.length, full }));
console.log('wrote tiles', tiles.length, 'cities', cities.length, 'hap', hapCases.length);
