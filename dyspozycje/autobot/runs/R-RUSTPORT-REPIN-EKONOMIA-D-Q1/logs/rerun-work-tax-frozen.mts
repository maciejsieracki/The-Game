// R4 (zarzut Evaluatora 4): generator glownego zestawu work-tax zaginal poza repo.
// Ten skrypt NIE generuje zestawu od nowa. Odtwarza WYJSCIA: bierze zamrozone wejscia
// z web-vectors.json, uruchamia na nich URUCHOMIONY kod weba (gra/src/game/work-tax.ts
// z pinu 91dc998a) i porownuje z zapisanymi wyjsciami (Object.is, znak zera sprawdzany).
// Dowodzi, ze zamrozony zestaw jest wyjsciem weba 91dc998a, a nie wlasnym kodem portu.
//
// Uruchomienie (node 22, poza repo, WEB_WORKTAX = sciezka do work-tax.ts z pinu):
//   WEB_WORKTAX=/home/user/webpin-91dc998a/gra/src/game/work-tax.ts \
//   node --experimental-strip-types logs/rerun-work-tax-frozen.mts <web-vectors.json>
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const webPath = process.env.WEB_WORKTAX;
if (!webPath) throw new Error('WEB_WORKTAX not set');
const w: any = await import(pathToFileURL(webPath).href);
const vecPath = process.argv[2];
if (!vecPath) throw new Error('usage: rerun-work-tax-frozen.mts <web-vectors.json>');
const vec: any = JSON.parse(readFileSync(vecPath, 'utf8'));

// Object.is dla liczb (znak zera), rekurencyjnie dla tablic i obiektow.
const same = (a: any, b: any): boolean => {
  if (typeof a === 'number' && typeof b === 'number') return Object.is(a, b);
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => same(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => same(a[k], b[k]));
  }
  return a === b;
};

const counts: Record<string, { n: number; bad: number }> = {};
const tally = (name: string, ok: boolean, detail: string) => {
  counts[name] ??= { n: 0, bad: 0 };
  counts[name].n++;
  if (!ok) { counts[name].bad++; if (counts[name].bad <= 5) console.log('MISMATCH', name, detail); }
};

for (const c of vec.tax) tally('tax', same(w.taxForWorkAmount(c.w, c.r), c.out), JSON.stringify(c));

for (const c of vec.convert) {
  const o = w.convertWorkPoolToTax(c.pool, c.req, c.rate, c.enabled);
  tally('convert', same(o, c.out), JSON.stringify(c));
}

for (const c of vec.canConvert) {
  const built = new Map<string, readonly string[]>(c.built.map((e: any) => [e[0], e[1]]));
  const got = w.ownerCanConvertWorkToTax(c.owner, c.human, c.cities, built);
  tally('canConvert', same(got, c.out), JSON.stringify(c));
}

for (const c of vec.serialize) {
  const got = w.serializePendingWorkTax(new Map(c.input));
  tally('serialize', same(got, c.out), JSON.stringify(c));
}

for (const c of vec.restore) {
  const got = [...w.restorePendingWorkTax(c.input).entries()];
  tally('restore', same(got, c.out), JSON.stringify(c));
}

for (const c of vec.exec) {
  const pool = new Map<number, number>([[7, c.pool]]);
  const calls: any[] = [];
  const o = w.executeManualWorkTaxConversion(7, c.req, c.rate, c.en, {
    getWorkPool: (id: number) => pool.get(id) as number,
    setWorkPool: (id: number, v: number) => { pool.set(id, v); calls.push(['set', id, v]); },
    queueTax: (id: number, t: number) => { calls.push(['tax', id, t]); },
  });
  const ok = same(o, c.out) && same(pool.get(7), c.finalPool) && same(calls, c.calls);
  tally('exec', ok, JSON.stringify(c));
}

let total = 0, bad = 0;
for (const [k, v] of Object.entries(counts)) { console.log(`${k}: ${v.n - v.bad}/${v.n}`); total += v.n; bad += v.bad; }
console.log(`TOTAL ${total - bad}/${total} rozbieznosci=${bad}`);
process.exit(bad === 0 ? 0 : 1);
