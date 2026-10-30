// P6.8B-P1a (production.ts 694-905): wektory z URUCHOMIONEGO weba 91dc998a.
// Uruchomienie (Node 22, z katalogu tego runu, bez builda gra/):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8b-helpers-vectors.mjs <WEB_ROOT (katalog z gra/src, gra/data z git archive 91dc998a)> \
//        <KATALOG_WYJSCIA> <KATALOG_ROBOCZY_POZA_REPO>
// Kodowanie: calkowita skonczona = JSON number; niecalkowita = {"$f": String(x)};
//   NaN/Infinity/-Infinity/-0 = {"$n": "..."}; wejscie nieobecne (undefined) = brak klucza; null = null.
// Funkcje niewyeksportowane z production.ts (694-905) sa wycinane z zrodla weba bez zmian
// (regex) i dodawane `export` -- wynik pochodzi z kodu weba, nie z przepisanej logiki.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
const scratch = presolve(process.argv[4] ?? '');
if (!process.argv[4]) throw new Error('podaj 3. argument: katalog roboczy poza repo');
mkdirSync(outDir, { recursive: true });
mkdirSync(scratch, { recursive: true });
const readData = (name) => JSON.parse(readFileSync(join(webRoot, 'gra/data', name), 'utf8'));
const prodPath = join(webRoot, 'gra/src/game/production.ts');
const prodText = readFileSync(prodPath, 'utf8');

const enc = (x) => {
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(0x8b1a);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const subset = (arr) => arr.filter(() => rand() < 0.3);

// --- 1. kod weba: stripDiacritics + blok 694-905 (jawne eksporty) ----------------
{
  const m = prodText.match(/function stripDiacritics\(s: string\): string \{[\s\S]*?\n\}/);
  if (!m) throw new Error('nie znaleziono stripDiacritics w production.ts');
  const startIdx = prodText.indexOf('/** typCywilizacji / ikonaId');
  const endMarker = '/**\n * Everything `city` is allowed to put in its queue right now.';
  const endIdx = prodText.indexOf(endMarker);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) throw new Error('nie znaleziono zakresu 694-905');
  const block = prodText.slice(startIdx, endIdx)
    .replace(/^function /gm, 'export function ')
    .replace(/^const /gm, 'export const ');
  writeFileSync(join(scratch, 'p1a-web.ts'), `export ${m[0]}\n${block}\n`);
}
const W = await import(pathToFileURL(join(scratch, 'p1a-web.ts')).href);

// --- 2. dane: realne units.json / buildings.json + syntetyczne przypadki ----------
const realUnits = readData('units.json').map((u) => ({
  Jednostka: u.Jednostka,
  Nacja: u.Nacja,
  'W zamian za': u['W zamian za'],
  Typ: u.Typ,
  Epoka: u.Epoka,
  Tech: u.Tech,
  Surowiec: u.Surowiec,
  'Zastąp specjalnie': u['Zastąp specjalnie'],
}));
const synUnits = [
  { Jednostka: 'syn_nacja_spacje', Nacja: '  Grecja ' },
  { Jednostka: 'syn_nacja_slowianie', Nacja: 'Slowianie' },
  { Jednostka: 'syn_nacja_puste', Nacja: '   ' },
  { Jednostka: 'syn_nacja_null', Nacja: null },
  { Jednostka: 'syn_zamiast_dash', Nacja: 'Rzym', 'W zamian za': '-' },
  { Jednostka: 'syn_zamiast_puste', Nacja: 'Rzym', 'W zamian za': '' },
  { Jednostka: 'syn_zamiast_null', Nacja: 'Rzym', 'W zamian za': null },
  { Jednostka: 'syn_zamiast_spacje', Nacja: 'Rzym', 'W zamian za': '   ' },
  { Jednostka: 'syn_zamiast_rzym', Nacja: 'Rzym', 'W zamian za': 'Wojownik' },
  { Jednostka: 'syn_zamiast_rzym_sp', Nacja: '  Rzym  ', 'W zamian za': '  Wojownik  ' },
  { Jednostka: 'syn_zamiast_pusta_nacja', Nacja: '', 'W zamian za': 'Wojownik' },
  { Jednostka: 'syn_zamiast_grecja', Nacja: 'Grecja', 'W zamian za': 'Falanga' },
  { Jednostka: 'syn_zamiast_nacja_diakr', Nacja: 'Słowianie', 'W zamian za': 'Konnica' },
  // jedyny zamiennik dla bazy 'Hetyta_x' ma spacje wokol nazwy (kill: brak js_trim w civHasReplacementFor)
  { Jednostka: 'syn_zamiast_pad_only', Nacja: 'Sumer', 'W zamian za': '  Hetyta_x  ' },
  // (r2) nacja z bialymi znakami po obu stronach przy niepustym zamienniku (kill: brak js_trim na nacji jednostki)
  { Jednostka: 'syn_nacja_biale_zamiast', Nacja: '  Grecja ', 'W zamian za': 'Falanga' },
  // (r2) nacja z diakrytykami i bialymi znakami; zamiennik z bialymi znakami (kill: brak js_trim na zamienniku)
  { Jednostka: 'syn_nacja_diakr_ws', Nacja: ' Słowianie ', 'W zamian za': ' Konnica ' },
  // (r2) para roznica tylko diakrytyki, zamiennik niepusty (kill: porownanie surowe zamiast strip_diacritics)
  { Jednostka: 'syn_zamiast_slowianie_ascii', Nacja: 'Slowianie', 'W zamian za': 'Wojownik' },
  // (r2) para roznica tylko znakiem zlozonym (e+akcent, NFD -> stripDiacritics => rowne): kill E4 (porownanie surowe)
  { Jednostka: 'syn_nacja_akcent', Nacja: 'Sumér', 'W zamian za': 'Wojownik' },
  // (r2) nacja/civ zlozona wylacznie ze znakow diakrytycznych (po stripDiacritics = ''): kill brakow sprawdzen pustosci
  { Jednostka: 'syn_nacja_tylko_diakr', Nacja: '́', 'W zamian za': 'Wojownik' },
];
const units = [...realUnits, ...synUnits];
const realBuildings = readData('buildings.json').map((b) => ({
  id: b.id,
  upgradeFrom: b.upgradeFrom,
  odblokowuje: b.odblokowuje,
}));
const synBuildings = [
  { id: 'syn_up_ws', upgradeFrom: '  pretorium  ' },
  { id: 'syn_up_puste', upgradeFrom: '   ' },
  { id: 'syn_up_pusty', upgradeFrom: '' },
  { id: 'syn_odbl_ws', odblokowuje: '  maSyn  ' },
  { id: 'syn_odbl_puste', odblokowuje: '   ' },
  { id: 'syn_odbl_pusty', odblokowuje: '' },
  { id: 'palisada_syn', upgradeFrom: 'mury' },
];
const buildings = [...realBuildings, ...synBuildings];
const buildingIds = buildings.map((b) => b.id);
const unitNames = [...units.map((u) => u.Jednostka), 'Nieznana', 'Wojownik', 'Hoplita', 'Zwiadowca'];

// --- 3. unitNacjaForCivKey ---------------------------------------------------------
// (r2) wynik weba nie-napisowy (klucz prototypowy: lookup w obiekt JS zwraca funkcje/obiekt) zapisany jako {"$js": typeof}.
const encOut = (r) => (r === undefined || r === null ? null : typeof r === 'string' ? r : { $js: typeof r });
const civKeyInputs = [
  undefined, null, '', '   ', 'grecy', 'Grecy', ' Grecy ', 'RZYMIANIE', 'sumer', 'sumerowie', 'babilon',
  'slowianie', 'Słowianie', 'słowianie', 'nieznany', 'babilonia', 'fenicjanie', '\tegipt\n', 'chinczycy',
  'zulusi', 'inkowie', 'celtowie', 'germanie', 'harappa', 'hetyci', 'asyria', 'egipt2',
  // (r2) klucze prototypowe: web zwraca wartosc dziedziczona (nie-napis), Rust -> None (udokumentowane odstepstwo)
  'constructor', '__proto__', 'toString', 'hasOwnProperty',
];
const civKeyCases = civKeyInputs.map((k) => ({
  key: k === undefined ? { absent: true } : k,
  out: encOut(W.unitNacjaForCivKey(k)),
}));

// --- 4. unitAllowedForCivNation ----------------------------------------------------
const nacjaVals = ['', '   ', 'Grecja', ' Grecja ', 'Słowianie', 'Slowianie', 'Rzym', 'Sumer', 'Ludy Morza', 'Sumér', '́'];
// (r2) ' Grecja ' / ' Słowianie ' = biale znaki po obu stronach po stronie cywilizacji (kill: brak js_trim na civUnitNacja)
const civVals = [undefined, null, '', '   ', 'Grecja', ' Grecja ', 'Słowianie', ' Słowianie ', 'Slowianie', 'Rzym', 'Sumer', 'Sumér', '́'];
const allowedCases = [];
for (const n of nacjaVals) {
  for (const c of civVals) {
    allowedCases.push({
      unit: n,
      civ: c === undefined ? { absent: true } : c,
      out: W.unitAllowedForCivNation(n, c),
    });
  }
}

// --- 5. availabilityCivNation (ctx.civKey / ctx.civUnitNacja) ----------------------
const ctxVariants = [
  {},
  { civKey: undefined },
  { civKey: null },
  { civKey: '' },
  { civKey: 'grecy' },
  { civKey: 'nieznany' },
  { civKey: 'nieznany', civUnitNacja: 'Rzym' },
  { civUnitNacja: 'Rzym' },
  { civUnitNacja: undefined },
  { civUnitNacja: null },
  { civUnitNacja: '' },
  { civKey: null, civUnitNacja: 'Rzym' },
  { civKey: 'slowianie', civUnitNacja: 'Rzym' },
  { civUnitNacja: 'Grecja' },
  // (r2) klucz prototypowy w ctx.civKey (odstepstwo jak w unitNacjaForCivKey)
  { civKey: 'constructor', civUnitNacja: 'Rzym' },
  { civKey: '__proto__' },
  { civKey: ' Grecy ', civUnitNacja: 'Rzym' },
];
const availCases = ctxVariants.map((ctx) => ({
  ctx: Object.fromEntries(Object.entries(ctx).map(([k, v]) => [k, v === undefined ? { absent: true } : v])),
  out: encOut(W.availabilityCivNation(ctx)),
}));

// --- 6. isBlankReplacement / isCivSpecialReplacement / civHasReplacementFor --------
const blankInputs = ['', '-', '—', ' ', '—', '--', 'Wojownik', ' - '];
const blankCases = blankInputs.map((z) => ({ z, out: W.isBlankReplacement(z) }));

const civNations = [undefined, null, '', 'Rzym', 'Grecja', 'Słowianie', 'Slowianie', 'Sumer', 'Ludy Morza', '  Rzym ', '́'];
const specialCases = [];
for (const u of units) {
  for (const c of civNations) {
    specialCases.push({
      unit: u.Jednostka,
      civ: c === undefined ? { absent: true } : c,
      out: W.isCivSpecialReplacement(u, c),
    });
  }
}
const baseNames = [...new Set([...units.map((u) => u.Jednostka), 'Wojownik', 'Falanga', 'Konnica', 'nieznana', 'Hetyta_x'])];
const hasRepCases = [];
for (const base of baseNames) {
  for (const c of ['Rzym', 'Grecja', 'Słowianie', 'Slowianie', '', undefined, 'Sumer']) {
    hasRepCases.push({
      base,
      civ: c === undefined ? { absent: true } : c,
      out: W.civHasReplacementFor({ units }, base, c),
    });
  }
}

// --- 7. buildingGoldPurchaseCost ---------------------------------------------------
// (r2) progi: 0.25/0.5/0.75/1.25/2.5 (x2 -> .5 i Math.max(1,.)); -0; NaN; +-Infinity; denormal
const goldInputs = [0, 0.25, 0.49, 0.5, 0.25, 1, 1.5, 2.5, 3, 10.4, 12.345678, -3, -0.5, -0.25, NaN, Infinity, -Infinity, 1e300, 1e-7, 4.5, 0.4999999999999999,
  -0, 0.2499999999, 0.75, 0.7499999999, 1.25, 1.2499999999, 2.5000000001, -1e300, 5e-324, 1.5000000000000002];
const goldCases = goldInputs.map((p) => ({ praca: enc(p), out: enc(W.buildingGoldPurchaseCost(p)) }));

// --- 8. kolejka i budynki: buildingTypeCommitted / buildingTypeQueued / upgrade ---
const queueItem = (kind, id) => ({ kind, id, nazwa: id, koszt: 1 });
const commitCases = [];
const queueCases = [];
const supersededCases = [];
const applyCases = [];
const unlockCases = [];
for (let i = 0; i < 400; i++) {
  const bid = pick(buildingIds);
  const built = subset(buildingIds).slice(0, 12);
  const queue = [];
  const qn = Math.floor(rand() * 4);
  for (let k = 0; k < qn; k++) {
    // (r2) trzy warianty: budynek; jednostka z id BUDYNKU (kill: brak sprawdzenia kind); jednostka z nazwa jednostki
  const r = rand();
  queue.push(r < 0.5 ? queueItem('budynek', pick(buildingIds))
    : r < 0.75 ? queueItem('jednostka', pick(buildingIds))
    : queueItem('jednostka', pick(unitNames)));
  }
  commitCases.push({ id: bid, built, queue, out: W.buildingTypeCommitted(bid, built, queue) });
  queueCases.push({ id: bid, queue, out: W.buildingTypeQueued(bid, queue) });
}
// (r2) jawne przypadki: jednostka o id budynku w kolejce, bez budynku w kolejce i bez zbudowanego
for (const bid of ['pretorium', 'mury', 'palisada', 'syn_up_ws']) {
  const q = [queueItem('jednostka', bid)];
  commitCases.push({ id: bid, built: [], queue: q, out: W.buildingTypeCommitted(bid, [], q) });
  queueCases.push({ id: bid, queue: q, out: W.buildingTypeQueued(bid, q) });
  const q2 = [queueItem('budynek', bid)];
  commitCases.push({ id: bid, built: [], queue: q2, out: W.buildingTypeCommitted(bid, [], q2) });
  queueCases.push({ id: bid, queue: q2, out: W.buildingTypeQueued(bid, q2) });
}
for (let i = 0; i < 400; i++) {
  const bid = pick(buildingIds);
  const built = subset(buildingIds).slice(0, 14);
  supersededCases.push({ id: bid, built, out: W.isBuildingSupersededByUpgrade(bid, built, buildings) });
}
const completedPool = [...buildingIds, 'nieistnieje'];
for (let i = 0; i < 400; i++) {
  const completed = pick(completedPool);
  const built = subset(buildingIds).slice(0, 14);
  const out = W.applyCompletedBuildingIds(built, completed, buildings);
  applyCases.push({ built, completed, out });
}
for (const completed of completedPool) {
  for (const b of [[], ['palisada', 'mury'], ['pretorium', 'dwor_zarzadcy'], ['palisada']]) {
    applyCases.push({ built: b, completed, out: W.applyCompletedBuildingIds(b, completed, buildings) });
  }
}
for (const completed of completedPool) {
  unlockCases.push({ completed, out: W.buildingUnlockFlagFor(completed, buildings) ?? null });
}
// (r2) pusty predecesor po trim: web (guard length>0) nie usuwa '' z built; zbudowany '' jest w liscie
for (const completed of ['syn_up_pusty', 'syn_up_puste', 'syn_up_ws']) {
  const b = ['', 'pretorium', 'mury'];
  applyCases.push({ built: b, completed, out: W.applyCompletedBuildingIds(b, completed, buildings) });
}

// --- 9. civSpecialUnitNameTokens / unitMatchesSpecialName --------------------------
const bonusCases = [
  { bonusy: { absent: true } },
  { bonusy: null },
  { bonusy: [] },
  { bonusy: [{ typ: 'walka', wartosc: 'Wojownik' }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: 'Hoplita' }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: 'Hoplita/Falanga' }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: ' Evocati (Legion) / Triari ' }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: ['Hieros Lochos (Święty Zastęp)', 'Wojownik'] }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: ['  ', '', 'Konnica (lekka)'] }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: [null, 'Falanga (ciezka)/X'] }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: null }] },
  { bonusy: [{ typ: 'jednostka_specjalna' }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: '(Tylko nawias)' }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: '/ / ' }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: 'Łucznik (a)(b)' }, { typ: 'x', wartosc: 'Y' }] },
  { bonusy: [{ typ: 'jednostka_specjalna', wartosc: 'Wojownik' }, { typ: 'jednostka_specjalna', wartosc: ['Konnica', 'Galera'] }] },
];
const tokenCases = bonusCases.map((c) => {
  const b = c.bonusy;
  let input;
  if (b && typeof b === 'object' && 'absent' in b) input = undefined;
  else input = b;
  return { bonusy: c.bonusy, out: W.civSpecialUnitNameTokens(input) };
});
const matchCases = [];
const tokenPool = [...new Set(tokenCases.flatMap((c) => c.out)), 'Ciezka', 'Hoplita', 'Wojowni', 'zz'];
for (let i = 0; i < 500; i++) {
  const name = pick(unitNames);
  const toks = subset(tokenPool).slice(0, 5);
  matchCases.push({ name, tokens: toks, out: W.unitMatchesSpecialName(name, toks) });
}
for (const name of unitNames) {
  matchCases.push({ name, tokens: [], out: W.unitMatchesSpecialName(name, []) });
}
// (r2) jawne przypadki kontrolne: kazda galez dopasowania osobno (kill E25/E26/E29/E53/E54 i pokrewne)
const explicitMatch = [
  ['Wojownik', ['Elitarny Wojownik']],        // tn zawiera un, nie prefiks (tn.includes(un))
  ['Elitarny Wojownik', ['Wojownik']],        // un zawiera tn, nie prefiks (un.includes(tn))
  ['Wojownik', ['ojow']],                     // infiks tokenu w srodku nazwy
  ['Wojownik', ['']],                         // token pusty
  ['Wojownik', ['̀']],                   // token pusty po stripDiacritics
  ['Wojownik', ['', 'Zz']],                   // pusty token przed niepasujacym
  ['Wojownik', ['Zz', '́']],             // pusty po strip po niepasujacym
  ['Slowianie', ['Słowianie']],               // roznica tylko diakrytyki (token)
  ['Słowianie', ['slowianie']],               // roznica tylko diakrytyki i wielkosc liter
  ['', ['Wojownik']],                         // pusta nazwa
  ['Wojownik', ['Wojownik (Elitarny)']],      // token z nawiasem, nazwa jako prefiks tokenu
  ['Hoplita', ['Hoplita/Falanga']],           // surowy token z ukosnikiem
  ['Sumer', ['Sumér']],                       // token z akcentem: stripDiacritics na tokenie (kill E52)
  ['Sumér', ['Sumer']],                       // nazwa z akcentem: stripDiacritics na nazwie (kill E53)
];
for (const [name, tokens] of explicitMatch) {
  matchCases.push({ name, tokens, out: W.unitMatchesSpecialName(name, tokens) });
}

// --- 10. stale do Rust --------------------------------------------------------------
const doc = {
  pin: '91dc998a5f1b51ad29e0f4785edfd45655445c53',
  zrodlo: 'gra/src/game/production.ts 694-905 (wyciete z weba, export) + stripDiacritics',
  dane: { units, buildings },
  civKey: civKeyCases,
  allowed: allowedCases,
  availability: availCases,
  blank: blankCases,
  specialReplacement: specialCases,
  hasReplacement: hasRepCases,
  goldCost: goldCases,
  committed: commitCases,
  queued: queueCases,
  superseded: supersededCases,
  applyCompleted: applyCases,
  unlockFlag: unlockCases,
  tokens: tokenCases,
  matchName: matchCases,
};
const outFile = join(outDir, 'helpers.json');
writeFileSync(outFile, JSON.stringify(doc, (k, v) => (typeof v === 'number' ? enc(v) : v)));
console.log('zapisano', outFile, 'liczniki:', {
  civKey: civKeyCases.length, allowed: allowedCases.length, availability: availCases.length,
  blank: blankCases.length, special: specialCases.length, hasRep: hasRepCases.length,
  gold: goldCases.length, committed: commitCases.length, superseded: supersededCases.length,
  apply: applyCases.length, unlock: unlockCases.length, tokens: tokenCases.length, match: matchCases.length,
});
