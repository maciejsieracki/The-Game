// R-RUSTPORT-P6-SIEGE-SURRENDER-Q1 (W8 3/3): generator wektorow dla siege_surrender.rs.
//
// Zrodlo: gra/src/main.ts z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75. Funkcje webowe sa closure'ami wewnatrz
// jednego ogromnego pliku main.ts, wiec NIE sa bundlowane przez esbuild. Ponizej sa TRANSKRYPCJAMI blokow,
// z podaniem linii w pinie:
//   * handleSiegeCapitulationPhase  - main.ts:17646-17659 (warunki pending / getCityFood <= 0);
//   * galezie resolveSiegeSurrender - main.ts:17662-17672 (city nie znaleziony), 17702-17707 (newOwner !== owner,
//     areEnemyOwners, return), 17869-17877 (else: hint bez przejecia), 17787-17790 (splice obroncow starego wlasciciela);
//   * endMapSiege                   - main.ts:17880-17893 (trzy pola czytane przez siegeStarvationState);
//   * population                    - main.ts `city.population = Math.max(1, city.population)` w galezi przejecia.
// Wektory sa wiec wynikiem transkrypcji zweryfikowanej z pinem liniami, nie uruchomieniem weba.
//
// Uzycie (bez zaleznosci zewnetrznych):
//   node tests/p6_siege_surrender_gen.mjs > tests/p6_siege_surrender_vectors/vectors.json

function makeRnd(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BARBARIAN = 9;
const OWNERS = [0, 1, 2, 3];

// Transkrypcja handleSiegeCapitulationPhase (main.ts:17646-17659): zwraca akcje.
function webHandlePhase(pending, food) {
  if (pending) return 'resolve';
  if (food <= 0) return 'setPending';
  return 'hold';
}

// Transkrypcja warunkow resolveSiegeSurrender (main.ts:17662-17672, 17702-17707, 17869-17877).
function webSurrenderPath(cityFound, cityOwner, besieger, enemyFn) {
  if (!cityFound) return 'noCity';
  if (besieger !== null && besieger !== cityOwner) {
    if (!enemyFn(besieger, cityOwner)) return 'notEnemy';
    return 'transfer';
  }
  return 'noCaptor';
}

// Transkrypcja splice (main.ts ok. :17787-17790): kolejnosc wsteczna, zwracamy usuniete id w kolejnosci wejscia.
function webRemovalIds(units, city, oldOwner) {
  const removed = [];
  for (let i = units.length - 1; i >= 0; i--) {
    const u = units[i];
    if (u.q === city.q && u.r === city.r && u.ownerId === oldOwner) removed.unshift(u.id);
  }
  return removed;
}

// Transkrypcja endMapSiege (main.ts:17880-17893) - pola miasta.
function webEndSiege() {
  return {
    oblegane: false,
    siegeCapitulationPending: false,
    siegeStarveStartMaxHp: null,
  };
}

// city.population = Math.max(1, pop) (JS: NaN propaguje).
function webPopFloor(pop) {
  return Math.max(1, pop);
}

const FOODS = [-2, -0.5, 0, 0.5, 3, NaN];
const POPS = [0, 0.4, 1, 2.7, 12, NaN];

function genPhase(rnd) {
  const out = [];
  for (let i = 0; i < 120; i++) {
    const pending = rnd() < 0.4;
    const food = FOODS[Math.floor(rnd() * FOODS.length)];
    out.push({ pending, food: Number.isNaN(food) ? 'NaN' : food, expect: webHandlePhase(pending, food) });
  }
  return out;
}

function genPath(rnd) {
  const out = [];
  for (let i = 0; i < 200; i++) {
    // Tablica wrogosci per przypadek (symetria nie jest zakladana; web areEnemyOwners(a,b) ma argumenty w kolejnosci).
    const table = {};
    for (const a of OWNERS) for (const b of OWNERS) table[`${a}-${b}`] = rnd() < 0.5;
    const enemyFn = (a, b) => {
      if (a === b) return false;
      if (a === BARBARIAN || b === BARBARIAN) return true;
      return table[`${a}-${b}`];
    };
    const cityFound = rnd() < 0.9;
    const cityOwner = OWNERS[Math.floor(rnd() * OWNERS.length)];
    const pick = rnd();
    let besieger;
    if (pick < 0.15) besieger = null;
    else if (pick < 0.3) besieger = cityOwner;
    else if (pick < 0.4) besieger = BARBARIAN;
    else besieger = OWNERS[Math.floor(rnd() * OWNERS.length)];
    const enemyPairs = [];
    for (const a of OWNERS) for (const b of OWNERS) enemyPairs.push([a, b, table[`${a}-${b}`]]);
    out.push({
      cityFound,
      cityOwner,
      besieger,
      enemyPairs,
      expect: webSurrenderPath(cityFound, cityOwner, besieger, enemyFn),
    });
  }
  return out;
}

function genRemoval(rnd) {
  const out = [];
  for (let i = 0; i < 80; i++) {
    const n = 1 + Math.floor(rnd() * 6);
    const units = [];
    for (let k = 0; k < n; k++) {
      units.push({
        id: `u${i}_${k}`,
        ownerId: OWNERS[Math.floor(rnd() * OWNERS.length)],
        q: Math.floor(rnd() * 3),
        r: Math.floor(rnd() * 3),
      });
    }
    const city = { q: Math.floor(rnd() * 3), r: Math.floor(rnd() * 3) };
    const oldOwner = OWNERS[Math.floor(rnd() * OWNERS.length)];
    out.push({
      city,
      oldOwner,
      units: units.map(u => ({ id: u.id, ownerId: u.ownerId, q: u.q, r: u.r })),
      expect: webRemovalIds(units, city, oldOwner),
    });
  }
  return out;
}

function genEndPop(rnd) {
  const ends = [];
  for (let i = 0; i < 20; i++) {
    ends.push({
      before: { oblegane: true, siegeCapitulationPending: rnd() < 0.5, siegeStarveStartMaxHp: 5 + Math.floor(rnd() * 20) },
      expect: webEndSiege(),
    });
  }
  const pops = POPS.map(p => ({
    pop: Number.isNaN(p) ? 'NaN' : p,
    expect: Number.isNaN(webPopFloor(p)) ? 'NaN' : webPopFloor(p),
  }));
  return { ends, pops };
}

const rndPhase = makeRnd(0x51e6e001);
const rndPath = makeRnd(0x51e6e002);
const rndRem = makeRnd(0x51e6e003);
const rndEnd = makeRnd(0x51e6e004);

const vectors = {
  source: 'gra/src/main.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (transkrypcja, patrz naglowek generatora)',
  phase: genPhase(rndPhase),
  path: genPath(rndPath),
  removal: genRemoval(rndRem),
  end_and_pop: genEndPop(rndEnd),
};

process.stdout.write(JSON.stringify(vectors, null, 1) + '\n');
