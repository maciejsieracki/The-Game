// R-RUSTPORT-P6-ZLOZA-B: generator wektorow z TEKSTU pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
//
// r2: wykonuje dokladny fragment `function transferBasketItems(` z gra/src/main.ts (transpilacja
//     TypeScript przez `typescript` z Node + new Function). Gałęzie poza zakresem (zloto, zywnosc,
//     miasto) trafiaja do stubow rzucajacych wyjatek, wiec wygenerowanie wektora z taka pozycja
//     konczy sie bledem.
// r3: gałęzie tech, surowiec_boolean, surowiec_ilosc, praca wykonywane NA PRAWDZIWYM KODZIE PINA
//     z REJESTRUJACYM HARNESSEM STANU (bez stubow dla tych gałęzi):
//       - grantTechToOwner, grantSurowiecBooleanAccess, transferSurowiecIlosc: transpilowane z pina
//         gra/src/game/diplomacy-basket-transfer.ts (pelny modul, bez importow; importy katalogu
//         tech sa stubami rzucajacymi, bo wektory nie uzywaja katalogu technologii);
//       - diplomacyPnPraca, diplomacyNormalizeSurowiecIlosc (+ diplomacyHandelSurowiecKrok i
//         HANDEL_SUROWCE_KROK10): wyciete z pina gra/src/game/diplomacy-value-catalog.ts; `_reguly`
//         (pn_praca.skala) podawane per przypadek;
//       - ownerPracaPool / setOwnerPracaPool: pula Pracy trzymana w Map (zapis z max(0), jak na pinie);
//       - grantTechToOwnerWithSideEffects: tylko czesc rejestrujaca (zmiana basketTransferCtx); efekty
//         poza portem (player.zbadane dla gracza 0, reconcilePlayerEraFromResearch) NIE sa wykonywane
//         i sa raportowane po stronie Rust jako unported_side_effects;
//       - cities: tablica miast z polem surowce, zapisywana przez fragment (jak na pinie).
//     Wynik przypadku = stan po wykonaniu: zlozeGrants, researchedByOwner, surowiecBooleanGrants,
//     cities (surowce), pool.
// Uzycie: node p6_zloza_basket_gen.mjs <sciezka-do-gra/src/main.ts> <katalog-wyjsciowy> [sciezka-do-typescript.js]
//   (albo zmienna TYPESCRIPT_JS zamiast trzeciego argumentu). Moduly game/ czytane z katalogu
//   obok main.ts (`<dir>/game/...`), tak jak na pinie.
// STRAZNIKI SHA-256: gra/src/main.ts, game/diplomacy-basket-transfer.ts, game/diplomacy-value-catalog.ts.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [, , mainPath, outDir, tsArg] = process.argv;
const tsPath = tsArg ?? process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
if (!mainPath || !outDir) {
  console.error('uzycie: node p6_zloza_basket_gen.mjs <gra/src/main.ts> <outDir> [typescript.js]');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const ts = require(tsPath);

const PIN_COMMIT = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
// Oczekiwany SHA-256 pliku gra/src/main.ts na pinie (ten sam co w p6_r7k7b_zloze_sync_gen.mjs).
const MAIN_SHA_WANT = 'e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19';
const BT_SHA_WANT = 'c2a9c5f4bc5681bc2d767a386fcecf319a448555789ae6b4b046de34f5dedd1e';
const VC_SHA_WANT = 'e02be22a57284b7cc5aeb59e8116ba3f403d787e15d3e0c3604689ef9245449c';

const sha256 = s => createHash('sha256').update(s).digest('hex');
function guardedText(path, want, label) {
  const text = readFileSync(path).toString('utf8');
  const got = sha256(readFileSync(path));
  if (got !== want) {
    console.error(`STRAZNIK SHA-256: ${label}: ${got} != ${want}`);
    process.exit(3);
  }
  return text;
}

const mainText = guardedText(mainPath, MAIN_SHA_WANT, 'gra/src/main.ts');
const gameDir = join(dirname(mainPath), 'game');
const btText = guardedText(join(gameDir, 'diplomacy-basket-transfer.ts'), BT_SHA_WANT, 'game/diplomacy-basket-transfer.ts');
const vcText = guardedText(join(gameDir, 'diplomacy-value-catalog.ts'), VC_SHA_WANT, 'game/diplomacy-value-catalog.ts');

const lines = mainText.split('\n');

// Fragment: od `    function transferBasketItems(` do pierwszej linii `    }` (koniec funkcji, wciecie 4).
const start = lines.findIndex(l => l.startsWith('    function transferBasketItems('));
if (start < 0) throw new Error('brak transferBasketItems w pinie');
const endRel = lines.slice(start + 1).findIndex(l => l === '    }');
if (endRel < 0) throw new Error('brak konca transferBasketItems');
const fragmentLines = lines.slice(start, start + endRel + 2);
const fragment = fragmentLines.join('\n');
const fragmentSha = sha256(fragment);

function transpile(src) {
  return ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}

// Usuniecie skladni modulu (importy, `export`) — reszta to zwykly kod wykonywany w new Function.
function stripModuleSyntax(src) {
  return src
    .split('\n')
    .filter(l => !/^import\s/.test(l))
    .map(l => l.replace(/^export\s+/, ''))
    .join('\n');
}

const stub = name => () => {
  throw new Error(`STUB wywolany: ${name}`);
};
// Zrodlo JS rzucajacego stuba (do wstrzykniecia do harnessu jako tekst).
const stubSrc = name => `() => { throw new Error("STUB wywolany: ${name}"); }`;

// --- diplomacy-basket-transfer.ts (pin): grantTechToOwner, grantSurowiecBooleanAccess, transferSurowiecIlosc.
const btFactory = new Function(
  'epochGateMet', 'epochTierGateMet', 'findTech', 'prerequisitesOf', 'TRADE_TECH',
  `${transpile(stripModuleSyntax(btText))}\nreturn { grantTechToOwner, grantSurowiecBooleanAccess, transferSurowiecIlosc };`,
);

// --- diplomacy-value-catalog.ts (pin): wyciete bloki HANDEL_SUROWCE_KROK10, diplomacyHandelSurowiecKrok,
// diplomacyPnPraca, diplomacyNormalizeSurowiecIlosc (bez zaleznosci od reszty katalogu).
function blockFrom(src, startPrefix, isEnd) {
  const L = src.split('\n');
  const s = L.findIndex(l => l.startsWith(startPrefix));
  if (s < 0) throw new Error(`brak w katalogu: ${startPrefix}`);
  let e = s;
  while (!isEnd(L[e])) e++;
  return L.slice(s, e + 1).join('\n');
}
const isFnEnd = l => l === '}';
const vcBlocks = [
  blockFrom(vcText, 'const HANDEL_SUROWCE_KROK10', l => l === ']);'),
  blockFrom(vcText, 'export function diplomacyHandelSurowiecKrok(', isFnEnd),
  blockFrom(vcText, 'export function diplomacyPnPraca(', isFnEnd),
  blockFrom(vcText, 'export function diplomacyNormalizeSurowiecIlosc(', isFnEnd),
];
const vcSrc = vcBlocks.join('\n\n');
const vcSha = sha256(vcSrc);
const vcFactory = new Function('_reguly', `${transpile(stripModuleSyntax(vcSrc))}\nreturn { diplomacyPnPraca, diplomacyNormalizeSurowiecIlosc };`);

// --- Harness: fragment pina + rejestrujace stuby (state) dla wejsc spoza fragmentu.
const harnessSrc = `
  let basketTransferCtx = __init.ctx;
  const cities = __init.cities;
  const __pool = __init.pool;
  const zlozeGrants = [];
  const syncBasketResearchFromEngine = () => {};
  const buildDiploTreasury = () => ({});
  const empireFoodStates = new Map();
  const _maxSafeRationCache = { clear() {} };
  const diplomacyPnPraca = __vc.diplomacyPnPraca;
  const diplomacyNormalizeSurowiecIlosc = __vc.diplomacyNormalizeSurowiecIlosc;
  const grantSurowiecBooleanAccess = __bt.grantSurowiecBooleanAccess;
  const transferSurowiecIlosc = __bt.transferSurowiecIlosc;
  const capitalCityIdForOwner = (id) => __init.capitalByOwner[id] ?? null;
  // Pin main.ts:34876: gracz ludzki (owner 0) bez wpisu = wyjatek (get!), AI bez wpisu = 0 (?? 0).
  const ownerPracaPool = (ownerId) => {
    if (ownerId === 0 && !__pool.has(0)) throw new Error('brak wpisu puli Pracy gracza 0 (pin: get!)');
    return __pool.get(ownerId) ?? 0;
  };
  const setOwnerPracaPool = (ownerId, value) => {
    if (ownerId === 0 && !__pool.has(0)) throw new Error('brak wpisu puli Pracy gracza 0 (pin: get!)');
    const v = Math.max(0, value); __pool.set(ownerId, v);
  };
  function grantTechToOwnerWithSideEffects(techId, toOwnerId) {
    const r = __bt.grantTechToOwner(techId, toOwnerId, basketTransferCtx);
    basketTransferCtx = r.context;
    if (!r.granted) return { granted: false, reason: r.reason };
    return { granted: true };
  }
  const applyOneShotGoldTransfer = ${stubSrc('applyOneShotGoldTransfer')};
  const diplomacyPnZloto = ${stubSrc('diplomacyPnZloto')};
  const freshEmpireFoodState = ${stubSrc('freshEmpireFoodState')};
  const empireFoodDefaultPct = ${stubSrc('empireFoodDefaultPct')};
  const transferCityByTreaty = ${stubSrc('transferCityByTreaty')};
  const showHintMessage = ${stubSrc('showHintMessage')};
  ${transpile(fragment)}
  return {
    transferBasketItems,
    state: () => ({ zlozeGrants, ctx: basketTransferCtx, cities, pool: __pool }),
  };
`;
const harnessFactory = new Function('__init', '__bt', '__vc', harnessSrc);

// Wykonanie fragmentu pina dla jednego przypadku; zwraca stan po wykonaniu (JSON-owalny).
function runCase(c) {
  const bt = btFactory(stub('epochGateMet'), stub('epochTierGateMet'), stub('findTech'), stub('prerequisitesOf'), undefined);
  const vc = vcFactory({ pn_praca: { skala: c.pnPracaSkala } });
  const init = {
    ctx: {
      researchedByOwner: new Map(
        Object.entries(c.init.researched).map(([o, arr]) => [Number(o), new Set(arr)]),
      ),
      surowiecBooleanGrants: c.init.grants.map(g => ({ ...g })),
      techCatalog: undefined,
    },
    cities: c.init.cities.map(x => ({ id: x.id, ownerId: x.ownerId, surowce: { ...x.surowce } })),
    pool: new Map(Object.entries(c.init.pool).map(([o, v]) => [Number(o), v])),
    capitalByOwner: c.init.capital,
  };
  const h = harnessFactory(init, bt, vc);
  h.transferBasketItems(c.fromOwnerId, c.toOwnerId, c.items, c.dealId);
  const st = h.state();
  return {
    zlozeGrants: JSON.parse(JSON.stringify(st.zlozeGrants)),
    researchedByOwner: Object.fromEntries(
      [...st.ctx.researchedByOwner.entries()]
        .sort(([a], [b]) => a - b)
        .map(([o, s]) => [String(o), [...s].sort()]),
    ),
    surowiecBooleanGrants: JSON.parse(JSON.stringify(st.ctx.surowiecBooleanGrants)),
    cities: JSON.parse(JSON.stringify(st.cities)),
    pool: Object.fromEntries(
      [...st.pool.entries()].sort(([a], [b]) => a - b).map(([o, v]) => [String(o), v]),
    ),
  };
}

// PRNG (mulberry32), staly seed: wektory sa deterministyczne.
let seed = 0x5b1e7f3;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const cases = [];
function addCase(name, items, from, to, dealId) {
  const c = {
    name,
    fromOwnerId: from,
    toOwnerId: to,
    ...(dealId === undefined ? {} : { dealId }),
    items,
    pnPracaSkala: 1,
    init: { researched: {}, grants: [], cities: [], pool: {}, capital: {} },
  };
  const out = runCase(c);
  cases.push({
    name,
    fromOwnerId: from,
    toOwnerId: to,
    ...(dealId === undefined ? {} : { dealId }),
    items,
    expectedGrants: out.zlozeGrants,
  });
}

// Przypadki reczne (zloze / jednostka).
addCase('pusta lista pozycji', [], 1, 2, undefined);
addCase('zloze z hexKey, bez dealId', [{ typ: 'zloze', id: 'z1', hexKey: 'h1' }], 1, 2, undefined);
addCase('zloze bez hexKey -> klucz = id', [{ typ: 'zloze', id: 'z2' }], 3, 1, 'd9');
addCase('zloze z pustym hexKey zostaje pusty', [{ typ: 'zloze', id: 'z3', hexKey: '' }], 2, 4, 'd1');
addCase('zloze z hexKey=null -> klucz = id (?? na null)', [{ typ: 'zloze', id: 'z4', hexKey: null }], 1, 3, 'd2');
addCase('kolejnosc pozycji zachowana', [
  { typ: 'zloze', id: 'a', hexKey: 'ha' },
  { typ: 'jednostka', id: 'u1' },
  { typ: 'zloze', id: 'b' },
], 1, 2, 'dX');
addCase('tylko jednostka -> brak grantow', [{ typ: 'jednostka', id: 'u2' }], 1, 2, 'dX');

// Przypadki losowe zloze (200) — kolejnosc RNG bez zmian wzgledem r2.
const N_RANDOM = 200;
for (let c = 0; c < N_RANDOM; c++) {
  const n = int(0, 5);
  const items = [];
  for (let i = 0; i < n; i++) {
    if (rnd() < 0.75) {
      const item = { typ: 'zloze', id: 'z' + c + '_' + i };
      if (rnd() < 0.5) item.hexKey = 'h' + int(0, 9);
      items.push(item);
    } else {
      items.push({ typ: 'jednostka', id: 'u' + c + '_' + i });
    }
  }
  const from = int(0, 4);
  const to = int(0, 4);
  const dealId = pick([undefined, 'd1', 'd2', '']);
  addCase('losowy ' + c, items, from, to, dealId);
}

// r3: przypadki stanu dla gałęzi tech, surowiec_boolean, surowiec_ilosc, praca (+ zloze/jednostka
// w mieszance). Generowane po przypadkach r2, wiec nie zmieniaja ich RNG.
const TECHS = ['t_a', 't_b', 't_c', 't_d'];
const TECH_IDS = ['t_a', 't_b', 't_c', 't_d', ' t_e ', 't_a'];
const BOOL_KEYS = ['zelazo', 'Drewno', ' KAMIEN ', 'zboze', 'SOL', 'ruda_zelaza', ''];
const QTY_KEYS = ['drewno', 'zelazo', 'zboze', ' Ruda ', 'SOL', 'kamien', 'pszenica', 'Ruda_Zelaza'];
const CITY_KEYS = ['drewno', 'zelazo', 'zboze', 'ruda_zelaza', 'sol'];
const TYPES = ['tech', 'surowiec_boolean', 'surowiec_ilosc', 'surowiec_ilosc', 'praca', 'praca', 'zloze', 'jednostka'];
const N_STATE = 160;
const stateCases = [];
for (let c = 0; c < N_STATE; c++) {
  const cityN = int(0, 4);
  const cities = [];
  for (let i = 0; i < cityN; i++) {
    const surowce = {};
    for (const k of CITY_KEYS) if (rnd() < 0.6) surowce[k] = int(0, 40);
    cities.push({ id: `c${c}_${i}`, ownerId: int(0, 3), surowce });
  }
  const researched = {};
  for (let o = 0; o <= 3; o++) {
    if (rnd() < 0.5) researched[String(o)] = TECHS.filter(() => rnd() < 0.4);
  }
  const pool = {};
  // r4 (zarzut EVAL r3 3): właściciel 0 (gracz ludzki) ZAWSZE ma wpis puli. Pin (main.ts:34876,
  // pracaPoolByHuman.get(ownerId)!) rzuca dla gracza bez wpisu, więc takiego przypadku nie da się
  // wygenerować z pina; harness nie może cicho dawać 0 w tym miejscu.
  for (let o = 0; o <= 3; o++) if (o === 0 || rnd() < 0.8) pool[String(o)] = int(0, 20);
  const grants = [];
  if (rnd() < 0.4) {
    grants.push({
      id: 'init_' + c,
      granterOwnerId: int(0, 3),
      granteeOwnerId: int(0, 3),
      rawKey: pick(['zelazo', 'drewno']),
      active: rnd() < 0.8,
    });
  }
  const capital = {};
  for (let o = 0; o <= 3; o++) {
    if (cities.length && rnd() < 0.7) capital[String(o)] = pick(cities).id;
  }
  const n = int(0, 6);
  const items = [];
  for (let i = 0; i < n; i++) {
    const typ = pick(TYPES);
    if (typ === 'tech') {
      items.push({ typ, id: pick(TECH_IDS), ilosc: 1 });
    } else if (typ === 'surowiec_boolean') {
      items.push({ typ, id: pick(BOOL_KEYS), ilosc: 1 });
    } else if (typ === 'surowiec_ilosc') {
      const q = rnd() < 0.1 ? -int(0, 5) : Math.round(rnd() * 600) / 10;
      items.push({ typ, id: pick(QTY_KEYS), ilosc: q });
    } else if (typ === 'praca') {
      items.push({ typ, id: 'praca', ilosc: int(-3, 25) });
    } else if (typ === 'zloze') {
      const item = { typ, id: 'zs' + c + '_' + i, ilosc: 1 };
      if (rnd() < 0.5) item.hexKey = 'hs' + int(0, 9);
      items.push(item);
    } else {
      items.push({ typ, id: 'us' + c + '_' + i, ilosc: 1 });
    }
  }
  const sc = {
    name: 'stan ' + c,
    fromOwnerId: int(0, 3),
    toOwnerId: int(0, 3),
    ...(pick([undefined, 'd1']) === undefined ? {} : { dealId: 'd1' }),
    items,
    pnPracaSkala: pick([1, 2, 3]),
    init: { researched, grants, cities, pool, capital },
  };
  const out = runCase(sc);
  stateCases.push({
    name: sc.name,
    fromOwnerId: sc.fromOwnerId,
    toOwnerId: sc.toOwnerId,
    ...(sc.dealId === undefined ? {} : { dealId: sc.dealId }),
    items: sc.items,
    pnPracaSkala: sc.pnPracaSkala,
    init: sc.init,
    expected: out,
  });
}

// r4 (obrona po EVAL r3, zarzuty 1-2): surowiec_ilosc z WIDOCZNYM efektem na miastach.
// Przypadki nazwane (remis dawcow wg id, kapital jako biorca, zbiorka z kilku miast, normalizacja
// klucza) + wymuszony zestaw losowy (remisy zapasow, 2-4 dawcow, 1-3 biorcow). Ilosci wielokrotnosci
// 10 w nazwanych przypadkach, zeby krok handlu (10 albo 1) nie zerowal efektu.
// Identyfikatory miast: tylko male litery, cyfry i '_' o stalej dlugosci przy porownaniu, zeby
// localeCompare (pin) i porownanie bajtowe (Rust) daly ten sam porzadek.
function addStateCase(name, p) {
  const sc = {
    name,
    fromOwnerId: p.from,
    toOwnerId: p.to,
    ...(p.dealId === undefined ? {} : { dealId: p.dealId }),
    items: p.items,
    pnPracaSkala: p.pnPracaSkala ?? 1,
    init: {
      researched: p.researched ?? {},
      grants: p.grants ?? [],
      cities: p.cities,
      pool: p.pool ?? { 0: 0 },
      capital: p.capital ?? {},
    },
  };
  const out = runCase(sc);
  stateCases.push({
    name: sc.name,
    fromOwnerId: sc.fromOwnerId,
    toOwnerId: sc.toOwnerId,
    ...(sc.dealId === undefined ? {} : { dealId: sc.dealId }),
    items: sc.items,
    pnPracaSkala: sc.pnPracaSkala,
    init: sc.init,
    expected: out,
  });
}
const ilosc = (id, q) => ({ typ: 'surowiec_ilosc', id, ilosc: q });
const city = (id, ownerId, surowce) => ({ id, ownerId, surowce });

addStateCase('ilosc: remis dawcow wg id, biorca = pierwszy bez stolicy', {
  from: 1, to: 2, items: [ilosc('zboze', 10)],
  cities: [city('dawca_b', 1, { zboze: 20 }), city('dawca_a', 1, { zboze: 20 }),
    city('odb_b', 2, {}), city('odb_a', 2, {})],
});
addStateCase('ilosc: remis dawcow wg id, biorca = stolica odb_a', {
  from: 1, to: 2, items: [ilosc('zboze', 10)], capital: { 2: 'odb_a' },
  cities: [city('dawca_b', 1, { zboze: 20 }), city('dawca_a', 1, { zboze: 20 }),
    city('odb_b', 2, {}), city('odb_a', 2, {})],
});
addStateCase('ilosc: zbiorka z trzech miast (90,30,50) rozbita na dawcow', {
  from: 1, to: 2, items: [ilosc('zboze', 100)],
  cities: [city('dawca_x', 1, { zboze: 30 }), city('dawca_y', 1, { zboze: 50 }),
    city('dawca_z', 1, { zboze: 90 }), city('odb_b', 2, { zboze: 5 })],
});
addStateCase('ilosc: zbiorka czesciowa z kilku miast (brak wystarczajacego zapasu)', {
  from: 1, to: 3, items: [ilosc('drewno', 250)],
  cities: [city('dawca_p', 1, { drewno: 60 }), city('dawca_q', 1, { drewno: 60 }),
    city('dawca_r', 1, { drewno: 60 }), city('odb_a', 3, {})],
});
addStateCase('ilosc: normalizacja klucza (trim + lowercase) w stanie miast', {
  from: 1, to: 2, items: [ilosc(' Drewno ', 30), ilosc('ZBOZE', 20), ilosc(' Ruda_Zelaza ', 10), ilosc('Sol', 10)],
  cities: [city('dawca_a', 1, { drewno: 100, zboze: 100, ruda_zelaza: 100, sol: 100 }),
    city('odb_a', 2, {})],
});
addStateCase('ilosc: normalizacja klucza, zapas tylko w kluczu znormalizowanym', {
  from: 1, to: 2, items: [ilosc('  ZELAZO  ', 20)],
  cities: [city('dawca_a', 1, { zelazo: 40 }), city('odb_a', 2, { zelazo: 1 })],
});

// Wymuszony zestaw losowy surowiec_ilosc (remisy zapasow, wielu dawcow, wielu biorcow).
const FOCUS_STOCK = [0, 3, 6, 6, 9, 12, 20, 20];
const FOCUS_ITEM_KEYS = ['zboze', ' ZBOZE ', 'Drewno', 'drewno ', 'Ruda_Zelaza', 'ruda_zelaza', 'Sol', 'zelazo'];
const FOCUS_CITY_KEYS = ['drewno', 'zboze', 'ruda_zelaza', 'sol', 'zelazo'];
const LETTERS = ['a', 'b', 'c', 'd'];
const N_FOCUS = 60;
for (let c = 0; c < N_FOCUS; c++) {
  const nDonor = int(2, 4);
  const nRecv = int(1, 3);
  const cities = [];
  for (let i = 0; i < nDonor; i++) {
    const surowce = {};
    for (const k of FOCUS_CITY_KEYS) if (rnd() < 0.5) surowce[k] = pick(FOCUS_STOCK);
    cities.push(city(`dawca_${LETTERS[i]}`, 1, surowce));
  }
  for (let i = 0; i < nRecv; i++) cities.push(city(`odb_${LETTERS[i]}`, 2, {}));
  const capital = rnd() < 0.5 ? { 2: pick(cities.filter(x => x.ownerId === 2)).id } : {};
  const nItems = int(1, 3);
  const items = [];
  for (let i = 0; i < nItems; i++) items.push(ilosc(pick(FOCUS_ITEM_KEYS), pick([2, 4, 6, 8, 10, 15, 20, 25, 30])));
  addStateCase(`ilosc-fokus ${c}`, { from: 1, to: 2, items, cities, capital });
}

const vectors = {
  pin: {
    commit: PIN_COMMIT,
    file: 'gra/src/main.ts',
    file_sha256: MAIN_SHA_WANT,
    function: 'transferBasketItems',
    fragment_lines: [start + 1, start + fragmentLines.length],
    fragment_sha256: fragmentSha,
    basket_transfer_file: 'gra/src/game/diplomacy-basket-transfer.ts',
    basket_transfer_file_sha256: BT_SHA_WANT,
    value_catalog_file: 'gra/src/game/diplomacy-value-catalog.ts',
    value_catalog_file_sha256: VC_SHA_WANT,
    value_catalog_extract_sha256: vcSha,
  },
  cases,
  state_cases: stateCases,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(vectors, null, 1) + '\n');
console.log(`OK: ${cases.length} przypadkow zloze, ${stateCases.length} przypadkow stanu, fragment_sha256=${fragmentSha}`);
