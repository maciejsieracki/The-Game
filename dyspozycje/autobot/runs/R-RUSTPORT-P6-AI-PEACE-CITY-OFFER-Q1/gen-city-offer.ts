// R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1 r2: generator wektorow z URUCHOMIONEGO weba.
// Nie uruchamiac bezposrednio: patrz gen-city-offer.sh (bundle esbuild, WEB_ROOT = katalog z gra/src i gra/data).
import * as AI from '@web/game/ai';
import * as PROF from '@web/game/diplomacy-war-peace-profile';

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261108);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

const out: any = {
  pure: { rwProg: [], waga: [], pickOddania: [], pickZadania: [], profil: [] },
  decide: [],
};

// 0. resolveWarPeaceProfile per cywilizacja (pelny profil) — brak klucza / nieznany / 15 cywilizacji.
const civKeys: (string | null)[] = [
  null, 'gracz-nieznany', 'grecy', 'rzymianie', 'chinczycy', 'inkowie', 'zulusi', 'egipt', 'sumer',
  'celtowie', 'germanie', 'harappa', 'hetyci', 'slowianie', 'babilonia', 'asyria', 'fenicjanie',
];
// Liczby jako napisy (String(x)): serde_json bez feature float_roundtrip potrafi roznic sie o 1 ULP
// od JS; str::parse::<f64>() w tescie jest dokladny.
const asStr = (p: any) => {
  const o: any = {};
  for (const k of Object.keys(p)) o[k] = typeof p[k] === 'number' ? String(p[k]) : p[k];
  return o;
};
for (const k of civKeys) {
  out.pure.profil.push({ civ: k, profile: asStr(PROF.resolveWarPeaceProfile(k as any)) });
}

// 1. aiMiastoPrzekazRwProg
for (const agr of [undefined, 0, 1, 3, 4, 5, 6, 7, 9, 10, 2.5]) {
  out.pure.rwProg.push({ agr: agr ?? null, v: AI.aiMiastoPrzekazRwProg(agr as any) });
}
// 2. aiMiastoWagaOddawanego
for (const eks of [undefined, 0, 1, 2, 3, 4, 5, 6, 8, 10, 2.5]) {
  out.pure.waga.push({ eks: eks ?? null, v: AI.aiMiastoWagaOddawanego(eks as any) });
}
// 3. aiPickMiastoDoOddania: boundary around cena/waga
const mkCity = (id: string, pn: number, zak = false) => ({ cityId: id, cityPn: pn, zakazane: zak });
for (const eks of [undefined, 0, 3, 5, 10]) {
  const waga = AI.aiMiastoWagaOddawanego(eks as any);
  for (const cena of [undefined, 400, 625, 750, 1250]) {
    const cenaEff = cena ?? AI.AI_MIASTO_CENA_POKOJU_PN;
    const t = Math.ceil(cenaEff / waga);
    for (const minMiast of [undefined, 2, 3]) {
      const pns = [t - 2, t - 1, t, t + 1, 1, 900];
      for (const len of [1, 2, 3, 4]) {
        const list = pns.slice(0, len).map((pn, i) => ({ ...mkCity('p' + i, pn, i === 4), zakazane: i === 4 }));
        const opts: any = {};
        if (minMiast !== undefined) opts.minMiast = minMiast;
        if (cena !== undefined) opts.cenaPn = cena;
        const hasOpts = Object.keys(opts).length > 0;
        const r = AI.aiPickMiastoDoOddania(list, eks as any, hasOpts ? opts : undefined);
        out.pure.pickOddania.push({
          eks: eks ?? null, cena: cena ?? null, minMiast: minMiast ?? null,
          miasta: list, out: r ? r.cityId : null,
        });
      }
    }
  }
}
// 4. aiPickMiastoDoZadania
for (const pns of [[499, 500, 501], [500], [499], [1200, 500, 700], [500, 500], [499, 900, 510, 200]]) {
  const list = pns.map((pn, i) => mkCity('q' + i, pn, i === 2));
  const r = AI.aiPickMiastoDoZadania(list as any);
  out.pure.pickZadania.push({ miasta: list, out: r ? r.cityId : null });
}

// 5. decideAIDiplomacy block oracle (N1a/N1b). r2: + myTypCywilizacji, stanWojny, partnerId.
function mkRel(o: any) {
  return {
    partnerId: o.partnerId,
    respektWzgledny: o.rw,
    stanWojny: o.stanWojny,
    relation: { zaufanie: 0, respekt: 0 },
    turnsAtWar: o.turnsAtWar,
    lostCitiesInWar: o.lost,
    zdobyteMiastaPartnera: o.zdobyte,
    turnsSinceCityChange: o.tsc,
    miastaPartnera: o.miastaPartnera,
    isMinorCivPartner: o.minorPartner,
  };
}
const cityOut = (cmds: any[]) => {
  const c = cmds.find(x => x.type === 'oferuj_miasto_za_pokoj' || x.type === 'zada_miasto_za_pokoj');
  if (!c) return null;
  if (c.type === 'oferuj_miasto_za_pokoj') return { kind: 'oferuj', cityId: c.cityId, cityPn: c.cityPn, cityWeight: c.cityWeight, powod: c.powod };
  return { kind: 'zada', cityId: c.cityId, cityPn: c.cityPn, cityWeight: null, powod: c.powod };
};
const rwGrid = [0.0, 0.05, 0.1, 0.15, 0.16, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.6, 0.65, 0.69, 0.7, 0.71, 0.8, 0.95, 1.0];
// r2: gęsto 0..9 — progi min_tur_wojny per cywilizacja (2..8) muszą być przecinane przez wektory bloku.
const turnsGrid = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 19, 20, 21, 40, 100, 199, 200, 201];
const lostGrid = [0, 1, 2, 3, 4];
const zdobyteGrid = [0, 1, 2];
const tscGrid = [undefined, 0, 10, 29, 30, 60, 130];
const agrGrid = [undefined, 0, 4, 5, 6, 9, 10];
const ekspGrid = [undefined, 1, 3, 5, 9];
const cityPnGrid = [100, 300, 400, 480, 499, 500, 501, 520, 800, 1500];
// r2: typy cywilizacji (wiersze macierzy + brak wiersza). undefined = brak pola myTypCywilizacji.
const civGrid: (string | undefined)[] = [
  undefined, 'zulusi', 'chinczycy', 'grecy', 'egipt', 'rzymianie', 'inkowie', 'fenicjanie', 'harappa', 'nieznana-cywilizacja',
];
// r2: partnerId '0' = gracz (warunek N1a/N1b); inne = AI, negatywna bramka.
const partnerGrid = ['0', '0', '0', '0', '0', '0', '0', '0', '1', 'ai2'];
function randCities(n: number, prefix: string) {
  const arr: any[] = [];
  for (let i = 0; i < n; i++) arr.push({ cityId: prefix + i, cityPn: pick(cityPnGrid), zakazane: rnd() < 0.15 });
  return arr;
}
const rwExtra = [0.1499, 0.1501, 0.2, 0.32, 0.37, 0.5, 0.55, 0.62, 0.74, 0.9];
for (let k = 0; k < 2600; k++) {
  const rw = k < rwGrid.length * 3 ? rwGrid[k % rwGrid.length] : pick(rwGrid.concat(rwExtra)) + (rnd() < 0.3 ? 0.01 : 0);
  const o: any = {
    rw,
    civ: pick(civGrid) ?? null,
    stanWojny: rnd() < 0.85,
    partnerId: pick(partnerGrid),
    turnsAtWar: pick(turnsGrid),
    lost: pick(lostGrid),
    zdobyte: pick(zdobyteGrid),
    tsc: pick(tscGrid),
    agr: pick(agrGrid),
    eks: pick(ekspGrid),
    minorSelf: rnd() < 0.08,
    minorPartner: rnd() < 0.08,
    miastaAI: randCities(Math.floor(rnd() * 5), 'a'),
    miastaPartnera: randCities(Math.floor(rnd() * 5), 'g'),
  };
  const inp: any = {
    relacje: [mkRel(o)],
    agresja: 0.5,
    agresywnoscRaw: o.agr,
    ekspansywnosc: o.eks,
    isMinorCivSelf: o.minorSelf,
    myTypCywilizacji: o.civ ?? undefined,
    miastaAI: o.miastaAI,
    currentTurn: 50,
    sklonnoscDoPodboju: 2,
    skarbiecGold: 0,
  };
  let cmds: any[] = [];
  try { cmds = AI.decideAIDiplomacy(inp); } catch (e: any) { cmds = [{ type: 'ERROR', powod: String(e && e.message) }]; }
  out.decide.push({ in: o, out: cityOut(cmds), first: cmds.length ? cmds[0].type : null });
}
process.stdout.write(JSON.stringify(out));
