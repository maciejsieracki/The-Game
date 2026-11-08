'use strict';
/**
 * ai-kompleksowosc-rozgrzebane-measure.cjs — POMIAR (nie bramka) dla
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, kryterium 1 „KOMPLEKSOWO, NIE ROWNOLEGLE".
 *
 * METRYKA „heks rozgrzebany" (definicja Operatora, runda 1):
 *   heks jest ROZGRZEBANY w turze T, jesli ma juz >=1 ulepszenie postawione przez AI,
 *   ALE realny kwalifikator gry (`buildImprovementQualifier`) nadal dopuszcza na nim
 *   co najmniej jedno KOLEJNE ulepszenie z listy priorytetow AI.
 *   Czyli: AI zaczelo heks i zostawilo go niedokonczonym, przechodzac gdzie indziej.
 *   Heks DOMKNIETY = ma >=1 ulepszenie i nic wiecej sie na nim nie kwalifikuje.
 *
 * Raportuje tez, dla drugiej skargi wlasciciela („zamiast owcy buduje oboz lowiecki"),
 * ILE heksow kwalifikuje sie na oboz_lowiecki, a ile na hodowle (owce/bydlo/lama)
 * — na TYCH SAMYCH polach, w tej samej turze.
 *
 * Harness (mapa, miasta, terytorium, 40 tur) skopiowany 1:1 z
 * tools/oboz-lowiecki-ai-40tur-measure.cjs, zeby liczby byly porownywalne z baza 99/56.
 *
 * Run: node tools/ai-kompleksowosc-rozgrzebane-measure.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.KX_SRC_DIR || path.resolve(__dirname, '..', 'src');
const TAG = process.env.KX_TAG || 'now';
const ENTRY = path.resolve(__dirname, `.kompleks-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.kompleks-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { pickAutoImprovements, AI_IMPROVEMENT_PRIORITY } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'warning',
});
const M = require(BUNDLE);
const { TerenBazowy, Nakladka } = M;

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);
const PASTWISKA = new Set(['owce', 'bydlo', 'lama']);

function territoryFor(map, cx, cy, rad, ownerId, cityId) {
  const out = [];
  for (let dq = -rad; dq <= rad; dq++) {
    for (let dr = -rad; dr <= rad; dr++) {
      if (Math.abs(dq + dr) > rad) continue;
      const h = map.hexes[`${cx + dq},${cy + dr}`];
      if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
      out.push({ q: cx + dq, r: cy + dr, ownerId, cityId });
    }
  }
  return out;
}

function pickCitySpots(map, n) {
  const keys = Object.keys(map.hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number); const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  const scored = [];
  for (const k of keys) {
    const h = map.hexes[k];
    if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -3; dq <= 3; dq++) {
      for (let dr = -3; dr <= 3; dr++) {
        if (Math.abs(dq + dr) > 3) continue;
        const nb = map.hexes[`${q + dq},${r + dr}`];
        if (nb && nb.terenBazowy !== TerenBazowy.Morze) land++;
      }
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

function riverHexKeys(map) {
  const set = new Set();
  for (const p of (map.riverPaths || [])) for (const x of p) set.add(`${x.q},${x.r}`);
  return set;
}

function simulate(seed, turns) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const rivers = riverHexKeys(map);
  const spots = pickCitySpots(map, 3);
  const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: 1, q: s.q, r: s.r, population: 6 }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, 1, c.id)));

  const placed = new Map();
  const counts = {};
  const rozgrzebanePerTura = [];
  let farmyPrzyRzece = 0;
  let kwalOboz0 = 0, kwalPastw0 = 0, kwalObaNaTymSamym0 = 0;

  for (let t = 0; t < turns; t++) {
    const picks = M.pickAutoImprovements({
      cities, ownerId: 1, map, territoryNodes,
      placedImprovements: placed,
      pracaAvailable: 100000,
      unlockedTechs: TECHS,
      pracaSurplusThreshold: 0,
      pracaBudgetPercent: 100,
      maxItemsPerCity: 1,
      skipWyrab: false,
      playerEra: 3,
      priorityOverride: M.AI_IMPROVEMENT_PRIORITY,
    });

    // Kwalifikacja na starcie (tura 0): oboz vs hodowla NA TYCH SAMYCH polach.
    if (t === 0) {
      const q0 = M.buildImprovementQualifier({
        map, cityNodes: cities.map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 })),
        territoryNodes, playerOwnerIdNum: 1, placedImprovements: new Map(),
        researchedTechs: TECHS, playerEra: 3,
      });
      for (const n of territoryNodes) {
        const o = q0('oboz_lowiecki', n.q, n.r);
        const p = ['owce', 'bydlo', 'lama'].some(k => q0(k, n.q, n.r));
        if (o) kwalOboz0++;
        if (p) kwalPastw0++;
        if (o && p) kwalObaNaTymSamym0++;
      }
    }

    if (!picks.length) { rozgrzebanePerTura.push(rozgrzebane(map, cities, territoryNodes, placed)); break; }
    for (const p of picks) {
      const hk = `${p.q},${p.r}`;
      const prev = placed.get(hk) ?? [];
      if (prev.includes(p.key)) continue;
      placed.set(hk, [...prev, p.key]);
      counts[p.key] = (counts[p.key] ?? 0) + 1;
      if (p.key === 'farma' && rivers.has(hk)) farmyPrzyRzece++;
    }
    rozgrzebanePerTura.push(rozgrzebane(map, cities, territoryNodes, placed));
  }

  const oboz = counts['oboz_lowiecki'] ?? 0;
  let pastw = 0; for (const k of PASTWISKA) pastw += counts[k] ?? 0;
  const maxRozgrzebane = Math.max(...rozgrzebanePerTura.map(r => r.rozgrzebane));
  const sredniaRozgrzebane = (rozgrzebanePerTura.reduce((s, r) => s + r.rozgrzebane, 0) / rozgrzebanePerTura.length);
  const last = rozgrzebanePerTura[rozgrzebanePerTura.length - 1];
  return {
    seed, oboz, pastw, counts, farmyPrzyRzece,
    maxRozgrzebane, sredniaRozgrzebane, last,
    tury: rozgrzebanePerTura.length,
    kwalOboz0, kwalPastw0, kwalObaNaTymSamym0,
  };
}

/** Heksy tkniete (>=1 ulepszenie) / rozgrzebane (tkniete + cos jeszcze sie kwalifikuje) / domkniete. */
function rozgrzebane(map, cities, territoryNodes, placed) {
  const qual = M.buildImprovementQualifier({
    map,
    cityNodes: cities.map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 })),
    territoryNodes,
    playerOwnerIdNum: 1,
    placedImprovements: placed,
    researchedTechs: TECHS,
    playerEra: 3,
  });
  let tkniete = 0, otwarte = 0;
  for (const [hk, layers] of placed) {
    if (!layers || !layers.length) continue;
    tkniete++;
    const [q, r] = hk.split(',').map(Number);
    const jeszczeMozna = M.AI_IMPROVEMENT_PRIORITY.some(
      k => k !== 'wyrab' && !layers.includes(k) && qual(k, q, r),
    );
    if (jeszczeMozna) otwarte++;
  }
  return { tkniete, rozgrzebane: otwarte, domkniete: tkniete - otwarte };
}

const seeds = (process.env.KX_SEEDS || '42,1337,2026,5150,31337').split(',').map(Number);
const TURNS = Number(process.env.KX_TURNS || 40);
console.log(`\n=== ${TAG} · ${TURNS} tur · src=${SRC} ===`);
let tO = 0, tP = 0, tF = 0, tR = 0, tT = 0;
for (const s of seeds) {
  const r = simulate(s, TURNS);
  tO += r.oboz; tP += r.pastw; tF += r.farmyPrzyRzece;
  tR += r.last.rozgrzebane; tT += r.last.tkniete;
  console.log(
    `seed ${r.seed}: oboz=${r.oboz} pastwiska=${r.pastw} farmy_przy_rzece=${r.farmyPrzyRzece}\n` +
    `          ROZGRZEBANE koniec=${r.last.rozgrzebane}/${r.last.tkniete} tknietych ` +
    `(domkniete=${r.last.domkniete}) · max w przebiegu=${r.maxRozgrzebane} · srednia=${r.sredniaRozgrzebane.toFixed(1)}\n` +
    `          KWALIFIKACJA tura0: oboz=${r.kwalOboz0} pol · hodowla=${r.kwalPastw0} pol · oba na tym samym polu=${r.kwalObaNaTymSamym0}`,
  );
}
console.log(`\nRAZEM(${TAG}): oboz=${tO} pastwiska=${tP} farmy_przy_rzece=${tF} rozgrzebane_na_koniec=${tR}/${tT}`);

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}
