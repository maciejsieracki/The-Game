'use strict';
/**
 * ev4-kryteria-check.cjs — NIEZALEZNA KONTROLA KRYTERIOW 2/4/5/6, runda 4 tematu
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (Evaluator). To NIE jest bramka.
 *
 * Buduje DWA drzewa (PRZED = baza rundy 3, PO = galaz rundy 4) w jednym procesie
 * i porownuje `pickAutoImprovements` PICK PO PICKU — nie agregaty, tylko odcisk
 * (cityId,q,r,key) w kolejnosci zwrotu.
 *
 * Kryterium 5: trzy profile automatu GRACZA („zywnosc", „surowce", „infrastruktura")
 * sprawdzane w DWOCH konfiguracjach — onlyWorked=false ORAZ onlyWorked=true — zeby
 * zlapac takze zmiane wynikajaca z WYJATKU ZLOZOWEGO (nie tylko z Zasady 1).
 *
 * Env: EV4K_SEEDS, EV4K_TURNS, EV4K_PRZED (katalog src drzewa PRZED)
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const PRZED_SRC = process.env.EV4K_PRZED || '/tmp/ev4-przed-r3/gra/src';
const PO_SRC = path.resolve(GRA_ROOT, 'src');

function bundle(src, tag) {
  const entry = path.resolve(__dirname, `.ev4k-${tag}-entry.ts`);
  const out = path.resolve(__dirname, `.ev4k-${tag}-bundle.cjs`);
  fs.writeFileSync(entry, `
export { generateMap } from ${JSON.stringify(src + '/map/generator')};
export * as AUTO from ${JSON.stringify(src + '/game/auto-improvements')};
export { workedHexCoordsForCity } from ${JSON.stringify(src + '/game/turn-economy')};
export { isImprovementAllowedForCiv } from ${JSON.stringify(src + '/game/terrain-improvements')};
export { getImprovementMeta } from ${JSON.stringify(src + '/game/improvement-tech')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(src + '/types/hex')};
export * as CITIES from ${JSON.stringify(src + '/game/cities')};
`, 'utf8');
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: out, loader: { '.ts': 'ts', '.json': 'json' },
    absWorkingDir: GRA_ROOT, logLevel: 'error',
    nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
  });
  return require(out);
}
const PRZED = bundle(PRZED_SRC, 'przed');
const PO = bundle(PO_SRC, 'po');
const { TerenBazowy, Nakladka } = PO;

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);
const SEEDS = (process.env.EV4K_SEEDS || '1,2,3,11,77').split(',').map(Number);
const TURNS = Number(process.env.EV4K_TURNS || 30);

function spots(M, map, n) {
  const keys = Object.keys(map.hexes).sort();
  const scored = [];
  for (const k of keys) {
    const h = map.hexes[k];
    if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
      if (Math.abs(dq + dr) > 3) continue;
      const nb = map.hexes[`${q + dq},${r + dr}`];
      if (nb && nb.terenBazowy !== TerenBazowy.Morze) land++;
    }
    scored.push({ q, r, land });
  }
  scored.sort((a, b) => (b.land - a.land) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of scored) {
    if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 8)) out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

/** Jeden przebieg pickera przez TURNS tur; zwraca ODCISK: lista "t|cityId|q,r|key". */
function odcisk(M, seed, cfg) {
  const map = M.generateMap(40, 30, seed, 'kontynenty');
  const sp = spots(M, map, 3);
  const OWNER = 0;
  const cities = sp.map((s, i) => ({
    id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: 7,
    ulepszeniaFocus: cfg.focus,
  }));
  const nodes = cities
    .filter(c => map.hexes[`${c.q},${c.r}`])
    .map(c => ({ q: c.q, r: c.r, ownerId: OWNER, cityId: c.id, pop: c.population, level: 1 }));
  const placed = new Map();
  const slad = [];
  let pool = 300;
  for (let t = 0; t < TURNS; t++) {
    pool += 80;
    const args = {
      cities, ownerId: OWNER, map, territoryNodes: nodes,
      placedImprovements: new Map(placed),
      pracaAvailable: pool,
      unlockedTechs: TECHS,
      pracaSurplusThreshold: M.AUTO.AUTO_ULEPSZENIA_PRACA_RESERVE,
      skipWyrab: cfg.skipWyrab !== false,
      civArchetype: 'grecy',
      isImprovementAllowedForCiv: (k, c) => M.isImprovementAllowedForCiv(k, c),
      getFocus: c => c.ulepszeniaFocus,
      getOnlyWorked: () => cfg.onlyWorked === true,
      getWorkedHexKeys: c => new Set(
        M.workedHexCoordsForCity(c, map, nodes).map(({ q, r }) => `${q},${r}`),
      ),
      pracaBudgetPercent: 33,
      getPracaBudgetPercent: () => 33,
      playerEra: 3,
    };
    if (cfg.demandDriven && 'freshSurplusReport' in M.AUTO) {
      args.demandDriven = true;
      args.resourceDeficitKeys = cfg.deficit ? cfg.deficit(t) : [];
    }
    if (cfg.getSkipWyrab && 'freshSurplusReport' in M.AUTO) args.getSkipWyrab = cfg.getSkipWyrab;
    const rep = cfg.wantReport && typeof M.AUTO.freshSurplusReport === 'function'
      ? M.AUTO.freshSurplusReport() : null;
    if (rep) args.surplusReport = rep;
    const picks = M.AUTO.pickAutoImprovements(args);
    for (const p of picks) {
      slad.push(`t${t}|${p.cityId}|${p.q},${p.r}|${p.key}`);
      const hk = `${p.q},${p.r}`;
      if (M.getImprovementMeta(p.key)?.typ === 'wycinka') {
        if (map.hexes[hk]) map.hexes[hk].nakladka = Nakladka.Brak;
      } else {
        placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
      }
      pool -= p.kosztPraca;
    }
    if (rep) slad.push(`t${t}|REPORT|demand=${rep.demandActive},def=${rep.deficitActive},cand=${rep.anyCandidate},surplus=${rep.surplus},picks=${picks.length}`);
  }
  return slad;
}

let fail = 0, ok = 0;
function porownaj(nazwa, cfg) {
  let rozne = 0, wsz = 0;
  const przyklady = [];
  for (const seed of SEEDS) {
    const a = odcisk(PRZED, seed, cfg);
    const b = odcisk(PO, seed, cfg);
    wsz += Math.max(a.length, b.length);
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (a[i] !== b[i]) {
        rozne++;
        if (przyklady.length < 3) przyklady.push(`seed=${seed} #${i}: PRZED='${a[i] ?? '-'}' PO='${b[i] ?? '-'}'`);
      }
    }
  }
  if (rozne === 0) { ok++; console.log(`  [ZGODNE]  ${nazwa} — ${wsz} pozycji odcisku identycznych`); }
  else { fail++; console.log(`  [ROZNE]   ${nazwa} — ${rozne}/${wsz} pozycji rozne`); przyklady.forEach(p => console.log(`              ${p}`)); }
}

console.log('# EV4 — NIEZALEZNA KONTROLA KRYTERIOW (Evaluator, runda 4)');
console.log(`# PRZED=${PRZED_SRC}  PO=${PO_SRC}  ziarna=${SEEDS.join(',')}  tur=${TURNS}`);

console.log('\n## KRYTERIUM 5a — trzy profile automatu GRACZA, onlyWorked=FALSE (test Operatora)');
for (const f of ['zywnosc', 'surowce', 'infrastruktura']) {
  porownaj(`profil "${f}" onlyWorked=false skipWyrab=true`, { focus: f, onlyWorked: false, skipWyrab: true });
}
console.log('\n## KRYTERIUM 5b — TE SAME trzy profile, ale onlyWorked=TRUE');
console.log('   (gracz, ktory mial ten przelacznik WLACZONY juz przed runda 4 — wyjatek zlozowy)');
for (const f of ['zywnosc', 'surowce', 'infrastruktura']) {
  porownaj(`profil "${f}" onlyWorked=TRUE skipWyrab=true`, { focus: f, onlyWorked: true, skipWyrab: true });
}
console.log('\n## KONTROLA: profil "zrownowazone" BEZ demandDriven (wolajacy nieswiadomy Zasady 1)');
porownaj('profil "zrownowazone" onlyWorked=false demandDriven=NIE', { focus: 'zrownowazone', onlyWorked: false, skipWyrab: true });

console.log('\n## KRYTERIUM 6 — przelacznik „wolno wycinac las" (automat GRACZA, profil zrownowazone)');
for (const wolno of [false, true]) {
  const slady = SEEDS.map(s => odcisk(PO, s, {
    focus: 'zrownowazone', onlyWorked: true, demandDriven: true,
    skipWyrab: true, getSkipWyrab: () => !wolno,
  }));
  let wyrab = 0, farmy = 0, razem = 0;
  for (const sl of slady) for (const l of sl) {
    if (l.includes('|REPORT|')) continue;
    razem++;
    if (l.endsWith('|wyrab')) wyrab++;
    if (l.endsWith('|farma')) farmy++;
  }
  console.log(`  wolnoWycinacLas=${String(wolno).padEnd(5)} -> pickow ${razem}, wyrab ${wyrab}, farma ${farmy}`);
}
console.log('  KONTROLA ZAKRESU MIASTA: getSkipWyrab rozny dla dwoch miast w jednym wywolaniu');
{
  const sl = odcisk(PO, SEEDS[0], {
    focus: 'zrownowazone', onlyWorked: true, demandDriven: true,
    skipWyrab: true, getSkipWyrab: c => c.id !== 'c0',   // tylko c0 wolno wycinac
  });
  const perCity = {};
  for (const l of sl) {
    if (l.includes('|REPORT|')) continue;
    const [, cid, , key] = l.split('|');
    if (key === 'wyrab') perCity[cid] = (perCity[cid] || 0) + 1;
  }
  console.log(`  wyrab per miasto (wolno TYLKO c0): ${JSON.stringify(perCity)}`);
}

console.log('\n## KRYTERIUM 2 — okno niedoboru: pojawia sie i znika w TEJ SAMEJ turze');
{
  const OKNO = t => (t >= 10 && t < 20 ? ['kamien'] : []);
  const perT = new Map();
  const IMP = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data/terrain-improvements.json'), 'utf8'));
  const zyw = k => !!(IMP[k]?.bonus?.zywnosc > 0);
  for (const seed of SEEDS) {
    const sl = odcisk(PO, seed, { focus: 'zrownowazone', onlyWorked: true, demandDriven: true, skipWyrab: true, deficit: OKNO });
    for (const l of sl) {
      if (l.includes('|REPORT|')) continue;
      const [tt, , , key] = l.split('|');
      const t = Number(tt.slice(1));
      const cur = perT.get(t) || { z: 0, n: 0 };
      if (zyw(key) || key === 'wyrab') cur.z++; else cur.n++;
      perT.set(t, cur);
    }
  }
  const linie = [];
  for (let t = 0; t < TURNS; t++) {
    const c = perT.get(t) || { z: 0, n: 0 };
    linie.push(`t${t}${t >= 10 && t < 20 ? '*' : ' '}:${c.z}/${c.n}`);
  }
  console.log('  (tura: zywnosc+wyrab / NIE-zywnosciowe; * = niedobor kamienia aktywny)');
  for (let i = 0; i < linie.length; i += 10) console.log('    ' + linie.slice(i, i + 10).join('  '));
}

console.log('\n## KRYTERIUM 4 / ZASADA 3 — spojnosc raportu nadwyzki (automat GRACZA)');
{
  let turSurplus = 0, turSurplusZPickami = 0, turRazem = 0;
  for (const seed of SEEDS) {
    const sl = odcisk(PO, seed, {
      focus: 'zrownowazone', onlyWorked: true, demandDriven: true, skipWyrab: false,
      getSkipWyrab: () => false, wantReport: true,
    });
    for (const l of sl) {
      if (!l.includes('|REPORT|')) continue;
      turRazem++;
      const m = /surplus=(\w+),picks=(\d+)/.exec(l);
      if (m && m[1] === 'true') { turSurplus++; if (Number(m[2]) > 0) turSurplusZPickami++; }
    }
  }
  console.log(`  tur razem ${turRazem} · surplus=true ${turSurplus}`);
  console.log(`  SPRZECZNE (surplus=true ORAZ picks>0 w tej samej turze): ${turSurplusZPickami}`);
}

console.log('\n## DEFAULTY (kryterium 6 + Zasada 2)');
console.log(`  PO:    DEFAULT_ULEPSZENIA_ONLY_WORKED = ${PO.CITIES.DEFAULT_ULEPSZENIA_ONLY_WORKED}`);
console.log(`  PO:    DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = ${PO.CITIES.DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS}`);
console.log(`  PO:    freshUlepszeniaEmpirePolicy() = ${JSON.stringify(PO.CITIES.freshUlepszeniaEmpirePolicy())}`);
console.log(`  PRZED: freshUlepszeniaEmpirePolicy() = ${JSON.stringify(PRZED.CITIES.freshUlepszeniaEmpirePolicy())}`);

console.log(`\n# WYNIK POROWNAN ODCISKOW: zgodnych ${ok}, roznych ${fail}`);
