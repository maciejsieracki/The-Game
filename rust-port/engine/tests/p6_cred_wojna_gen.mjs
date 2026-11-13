// P6-CRED-WOJNA-Q1 (runda 2): generator wektorow z WEBA (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75) dla:
//   (A) haka P4 `chargeWarDeclarationCredibility` (main.ts:12176-12225), skutek P4: licznik "bez wojny" OBU stron,
//   (B) kolejnosci D4 (`tickWiarygodnoscBezWojnyMilestone` + `updateWiarygodnoscStreamsThisTurn`) wzgledem haka D8:
//       kolejnosc pinu (D4 przed D8) i odwrotna (D8 przed D4), obie porownywane z pinem,
//   (C) S3 (strumien handlu) dla `umowa_handlowa` przez 3 tury, bez aliasu: wejscie w `StreamDealKind` jest podawane
//       wprost w tescie Rust (`LegacyTradeAgreement`), a tu wartosci pochodza z pinu.
// Uzycie: node p6_cred_wojna_gen.mjs <esbuild> <pinDir> <workDir> <outDir>
//   np. git archive 07d2fbd72... gra/src gra/data -o pin.tar && tar -x -f pin.tar -C <pinDir>
//
// WYKONANIE TEKSTU PINU (esbuild + wykonanie w fabryce, stan domkniecia wstrzykniety):
//   - moduly `game/*.ts` i `types/diplomacy.ts` sa bundlowane i wykonywane (wlacznie z `isBarbarian`, `hasTreaty`,
//     `isTruceWindowBreach`, `clearTruceEndOfferCore`, `diploPairKey`, `freshDiploPairMeta`);
//   - funkcje domkniete z `main.ts` sa WYCINANE jako TEKST (po sygnaturze `    function name(` do `    }`), transpilowane
//     i wykonywane w fabryce `make(S)`: chargeWarDeclarationCredibility, isCredibilityRetaliation,
//     credibilityEventOpensOdwet, getDiploPairMeta, setDiploPairMeta, isAllianceDealKind, dealInvolvesOwners,
//     pairOwnerIds, appendWiarygodnoscEvent, tickWiarygodnoscBezWojnyMilestone, updateWiarygodnoscStreamsThisTurn (+ zaleznosci);
//   - `clearTruceEndOffer` to jednolinijkowy wrapper pinu na `clearTruceEndOfferCore` z portami getMeta/setMeta
//     na zywo; `removeOffer` jest atrapa skrzynki (zapisuje id, nie ma skrzynki w tym tescie).
// STRAZNIK: SHA-256 plikow pinu oraz SHA-256 kazdego wycietego fragmentu (FRAG_SHA) musza sie zgadzac, inaczej koniec z bledem.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , esbuild, pinDir, workDir, outDir] = process.argv;
if (!esbuild || !pinDir || !workDir || !outDir) {
  console.error('uzycie: node p6_cred_wojna_gen.mjs <esbuild> <pinDir> <workDir> <outDir>');
  process.exit(2);
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

const SHA = {
  'gra/src/main.ts': 'e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19',
  'gra/src/game/diplomacy-credibility.ts': 'd9c15d7c69f368c9619755f31e7b9df01d0d9c36b493000c794234dcef36061c',
  'gra/src/game/diplomacy-treaties.ts': '9b8e3bd81b65de1bb009a86058d1afa59a48c096b6ed6e91be71606af6cde6cb',
  'gra/src/types/diplomacy.ts': '1a963e56488b547261da9ffca0712c71875a54dd2024388ce6580e6c63290b6b',
  'gra/src/game/difficulty-cost.ts': '6f159d865c4a977d0df0883dfa9aa6240ed2718ffd11d90e2dc4041f93a7560e',
  'gra/src/game/diplomacy.ts': 'cdf34ef8e5b67b0454874eebb08edec7a6c2c2510fa97c92d1388b7ea0f88216',
  'gra/src/game/diplomacy-peace-lock.ts': 'ab8e6b08b0baab9ed1ee073cd66929c53494ec61214f797238b76d13ffef4771',
  'gra/src/game/diplomacy-pn-engine.ts': 'ee1b1aabffd4fdf906ce260084f80ad5da055c64912b6eda86306ba261d89257',
  'gra/src/game/barbarians.ts': 'b5a38a1c13e9ce0541974de0444e4bbff33b16d6c0a0bad2277fe6ed337efe8a',
  'gra/data/diplomacy.json': '836098deb6aedd5c0230c47cd6c5da5691f5b7e6891bb6ceda02b94f2b21eb6e',
};
for (const [rel, want] of Object.entries(SHA)) {
  const got = sha256(readFileSync(join(pinDir, rel)));
  if (got !== want) {
    console.error(`STRAZNIK SHA-256: ${rel}: ${got} != ${want}`);
    process.exit(3);
  }
}

// SHA-256 wycietych fragmentow main.ts (strazeze przed dryfem wycinania). Wartosci = tekst pinu 07d2fbd72.
const FRAG_SHA = {
  getDiploPairMeta: '04eb33e712c284d50f077a013021d12179c94ca3ffe2c49e6bd0879df3877620',
  setDiploPairMeta: 'c7dbc60ca1817dda226d94e0e0c9f010d8ee49dc00a046c24039a7cfb64b988b',
  pairOwnerIds: 'f9d1a3622928ef9702870575203adf1f4fcb8447296c661742518f8bfc6532cb',
  dealInvolvesOwners: 'db5e5b24e885930bb4a6102e53eec3329db855109fe71925c2d56abbb98d22b6',
  isAllianceDealKind: 'bec0ffcc8744d2a3f57cdaccbd706090b56f22a872c05827fdc714121939f1d7',
  credibilityEventOpensOdwet: '8d0d36275e647c316f003ad3416eb4b9c31b8d358173894adab50b2f6785e30d',
  isCredibilityRetaliation: '8a805f8455271ab210cdf70e03487aa61d2c54072e5031ecc6e87a8c60e69032',
  chargeWarDeclarationCredibility: '5a29e9f689bf01f53d729c4f6eb3766f38f64b8a18ea4b204df6729dd4623595',
  getWiarygodnoscEvents: '5e0904729485ac8a46773c4ca21d98cf9c90dcc72e353e5bbf2b22382b329c35',
  appendWiarygodnoscEvent: 'f65bd67d88573556c097a6e2e13aac186c1f5564c0ebac77afd543598ba18793',
  getWiarygodnoscStreamEntries: 'fab79024fcea8f95489942be606c42a7630a67055bb0da752c8744e76ed44d47',
  getWiarygodnosc: 'a1ff7366fdae66e81be3d3a3a3efd5ddaff781a4d7b54a7626dc10e180039126',
  wiarygodnoscStreamKey: 'ea961b2405770faf7bb4602f7fb7adfbe2603408a38367321031735eac5efe97',
  tickWiarygodnoscStreamFor: '3da113c67935fc5d6d2f41e4d86a2dc579ede40585a5a88bb88021034e3a0acd',
  tickWiarygodnoscBezWojnyMilestone: 'ba4f1d1b02f98c374e91baafa5655cf1cb8ea7d57d2136d87f21f5ee91392b26',
  updateWiarygodnoscStreamsThisTurn: '02093b074c32e03e33ac8fa50ea114f628bd9b29db05defa3940bc48a1b9a57d',
};

mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

// ---- bundle modulow pinu ----
const g = (f) => join(pinDir, 'gra/src/game', f).replaceAll('\\', '/');
const entry = join(workDir, 'entry.ts');
writeFileSync(
  entry,
  `export * from '${g('diplomacy-credibility.ts')}';\n` +
    `export { expireTreaties, normalizeTreatyKind, hasTreaty } from '${g('diplomacy-treaties.ts')}';\n` +
    `export { RodzajTraktatu } from '${join(pinDir, 'gra/src/types/diplomacy.ts').replaceAll('\\', '/')}';\n` +
    `export { getBaseDiplomacyParams, getEffectiveDiplomacyParams } from '${g('diplomacy.ts')}';\n` +
    `export { isTruceWindowBreach, clearTruceEndOfferCore } from '${g('diplomacy-peace-lock.ts')}';\n` +
    `export { diploPairKey, freshDiploPairMeta } from '${g('diplomacy-pn-engine.ts')}';\n` +
    `export { isBarbarian } from '${g('barbarians.ts')}';\n`,
);
const bundled = join(workDir, 'entry.mjs');
execFileSync(esbuild, [entry, '--bundle', '--format=esm', `--outfile=${bundled}`], { stdio: 'inherit' });
const W = await import(pathToFileURL(bundled).href);

// ---- wyciecie tekstu funkcji z main.ts ----
const mainLines = readFileSync(join(pinDir, 'gra/src/main.ts'), 'utf8').split('\n');
function extractFn(name) {
  const start = mainLines.findIndex((l) => l.startsWith(`    function ${name}(`));
  if (start < 0) throw new Error(`brak funkcji ${name} w main.ts`);
  let end = start;
  while (mainLines[end] !== '    }') end += 1;
  return mainLines.slice(start, end + 1).join('\n');
}
const FN_NAMES = [
  'getDiploPairMeta',
  'setDiploPairMeta',
  'pairOwnerIds',
  'dealInvolvesOwners',
  'isAllianceDealKind',
  'credibilityEventOpensOdwet',
  'isCredibilityRetaliation',
  'chargeWarDeclarationCredibility',
  'getWiarygodnoscEvents',
  'appendWiarygodnoscEvent',
  'getWiarygodnoscStreamEntries',
  'getWiarygodnosc',
  'wiarygodnoscStreamKey',
  'tickWiarygodnoscStreamFor',
  'tickWiarygodnoscBezWojnyMilestone',
  'updateWiarygodnoscStreamsThisTurn',
];
const FRAGMENTS = Object.fromEntries(FN_NAMES.map((n) => [n, extractFn(n)]));
const FRAG_OUT = {};
for (const n of FN_NAMES) {
  const got = sha256(FRAGMENTS[n]);
  FRAG_OUT[n] = got;
  if (FRAG_SHA[n] === undefined) {
    console.error(`FRAG ${n} ${got}`);
    continue;
  }
  if (FRAG_SHA[n] !== got) {
    console.error(`STRAZNIK SHA-256 fragmentu ${n}: ${got} != ${FRAG_SHA[n]}`);
    process.exit(4);
  }
}
if (Object.keys(FRAG_SHA).length !== FN_NAMES.length) {
  console.error('uzupelnij FRAG_SHA (wartosci wypisane wyzej) i uruchom ponownie');
  process.exit(4);
}

const factorySrc = `
export function make(S) {
  const { wiarygodnoscZdarzeniaByOwner, wiarygodnoscStrumienByOwner, wiarygodnoscOstatniaWojnaTuraByOwner,
    wiarygodnoscP4MilestonesByOwner, wiarygodnoscCyclicDeliveryOkThisTurn, normalizeTreatyKind, RodzajTraktatu,
    appendCredibilityEvent, freshCredibilityStreamEntry, tickCredibilityStreamEntry, sumaWiarygodnosciCalkowita,
    wiarygodnoscStartowa, _diplomacyParams, _menuDifficulty, isBarbarian, hasTreaty, isTruceWindowBreach,
    clearTruceEndOfferCore, diploPairKey, freshDiploPairMeta } = S;
  let turn = S.turn;
  let activeDeals = S.activeDeals;
  const diplomacyPairMeta = new Map();
  const removedOffers = [];
  const truceEndPorts = () => ({
    getMeta: (a, b) => getDiploPairMeta(a, b),
    setMeta: (a, b, m) => setDiploPairMeta(a, b, m),
    getStatus: () => 'wojna',
    getArmyM: () => 0,
    isHuman: () => false,
    declareWarAfterTruce: () => { throw new Error('poza zakresem: declareWarAfterTruce'); },
    enqueueOffer: () => { throw new Error('poza zakresem: enqueueOffer'); },
    removeOffer: (id) => { removedOffers.push(id); },
    finalizePeace: () => { throw new Error('poza zakresem: finalizePeace'); },
  });
  // main.ts: function clearTruceEndOffer(a, b) { clearTruceEndOfferCore(truceEndPorts(), a, b); }
  function clearTruceEndOffer(a, b) { clearTruceEndOfferCore(truceEndPorts(), a, b); }
${FN_NAMES.map((n) => FRAGMENTS[n]).join('\n')}
  return {
    setTurn: (t) => { turn = t; },
    setDeals: (d) => { activeDeals = d; },
    hook: (a, b, opts) => chargeWarDeclarationCredibility(a, b, opts),
    seedPair: (a, b, m) => setDiploPairMeta(a, b, m),
    pairMeta: (a, b) => getDiploPairMeta(a, b),
    removedOffers: () => removedOffers.slice(),
    tickBezWojny: (o) => tickWiarygodnoscBezWojnyMilestone(o),
    updateStreams: () => updateWiarygodnoscStreamsThisTurn(),
    getWiarygodnosc,
    events: (o) => getWiarygodnoscEvents(o),
  };
}
`;
const tsFile = join(workDir, 'factory.ts');
writeFileSync(tsFile, factorySrc);
const factoryJs = execFileSync(esbuild, [tsFile, '--format=esm', '--loader:.ts=ts'], { encoding: 'utf8' });
const factoryPath = join(workDir, 'factory.mjs');
writeFileSync(factoryPath, factoryJs);
const F = await import(pathToFileURL(factoryPath).href);

// ---- PRNG (mulberry32) ----
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
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const DIFFS = ['easy', 'normal', 'hard'];
const OWNERS = [0, 1, 2, 3];
const DEAL_KINDS = ['sojusz_pelny', 'pakt_nieagresji', 'umowa_szlakow', 'otwarte_granice'];
const pairOf = (x, y) => (x < y ? [x, y] : [y, x]);

// Model pinu dla jednej symulacji: fabryka + wlasne mapy stanu (S), zeby odczytac skutki bez zgadywania.
function mkModel(diff, { deals = [], cycMap = new Map(), startTurn = 0 } = {}) {
  const S = {
    wiarygodnoscZdarzeniaByOwner: new Map(),
    wiarygodnoscStrumienByOwner: new Map(),
    wiarygodnoscOstatniaWojnaTuraByOwner: new Map(),
    wiarygodnoscP4MilestonesByOwner: new Map(),
    wiarygodnoscCyclicDeliveryOkThisTurn: cycMap,
    normalizeTreatyKind: W.normalizeTreatyKind,
    RodzajTraktatu: W.RodzajTraktatu,
    appendCredibilityEvent: W.appendCredibilityEvent,
    freshCredibilityStreamEntry: W.freshCredibilityStreamEntry,
    tickCredibilityStreamEntry: W.tickCredibilityStreamEntry,
    sumaWiarygodnosciCalkowita: W.sumaWiarygodnosciCalkowita,
    wiarygodnoscStartowa: W.wiarygodnoscStartowa,
    _diplomacyParams: () => W.getEffectiveDiplomacyParams(diff),
    _menuDifficulty: diff,
    isBarbarian: W.isBarbarian,
    hasTreaty: W.hasTreaty,
    isTruceWindowBreach: W.isTruceWindowBreach,
    clearTruceEndOfferCore: W.clearTruceEndOfferCore,
    diploPairKey: W.diploPairKey,
    freshDiploPairMeta: W.freshDiploPairMeta,
    turn: startTurn,
    activeDeals: deals,
  };
  return { S, M: F.make(S) };
}

const lastWarOf = (S, o) => S.wiarygodnoscOstatniaWojnaTuraByOwner.get(o) ?? null;
const snapshot = (S, owners) => ({
  lastWar: owners.map((o) => [o, lastWarOf(S, o)]),
  p4: owners.map((o) => [o, S.wiarygodnoscP4MilestonesByOwner.get(o) ?? 0]),
  wielo: owners.map((o) => [
    o,
    (S.wiarygodnoscZdarzeniaByOwner.get(o) ?? []).filter((e) => e.typ === 'wieloletni_pokoj').length,
  ]),
});

// ---- (A) hak P4: 160 przypadkow wywolania chargeWarDeclarationCredibility ----
const hookCases = [];
for (let i = 0; i < 160; i += 1) {
  const r = rng(5000 + i);
  const diff = DIFFS[i % 3];
  const turn = Math.floor(r() * 60);
  const a0 = pick(r, OWNERS);
  let b0 = pick(r, OWNERS);
  if (b0 === a0) b0 = OWNERS.find((o) => o !== a0);
  const barbarian = r() < 0.08;
  const a = barbarian ? -1 : a0;
  const b = b0;
  const lastWarPrior = OWNERS.filter(() => r() < 0.6).map((o) => [o, Math.floor(r() * (turn + 1))]);
  const deals = [];
  if (r() < 0.5) {
    const [p, q] = pairOf(a0, b0);
    deals.push({ id: `h${i}`, rodzaj: pick(r, DEAL_KINDS), strony: [p, q], wygasaTura: null, zawartaTura: 0 });
  }
  const pairMetaPrior = {};
  if (r() < 0.3) pairMetaPrior.truceUntilTurn = turn + Math.floor(r() * 6) - 2;
  if (r() < 0.15) pairMetaPrior.truceEndOffer = { inboxId: `inb-${i}`, turn: Math.max(0, turn - 1) };
  if (r() < 0.2) {
    pairMetaPrior.ostatniePrzewinienieWobecNas = {
      turn: Math.max(0, turn - 1),
      typ: 'wypowiedzenie_wojny_bez_ostrzezenia',
      byOwnerId: b,
      againstOwnerId: a0,
    };
  }
  const { S, M } = mkModel(diff, { deals, startTurn: turn });
  for (const [o, v] of lastWarPrior) S.wiarygodnoscOstatniaWojnaTuraByOwner.set(o, v);
  M.seedPair(a, b, { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0, ...pairMetaPrior });
  M.setTurn(turn);
  M.hook(a, b);
  hookCases.push({
    id: i,
    difficulty: diff,
    turn,
    pair: [a, b],
    barbarian,
    deals,
    lastWarPrior,
    lastWarAfter: OWNERS.map((o) => [o, lastWarOf(S, o)]),
  });
}

// ---- (B) kolejnosc D4 vs hak D8: 60 sekwencji, kolejnosc pinu i odwrotna ----
const orderCases = [];
for (let sc = 0; sc < 60; sc += 1) {
  const r = rng(7000 + sc);
  const owners = OWNERS.slice(0, 2 + (sc % 3));
  const nTurns = 30 + Math.floor(r() * 16);
  // Pary wojen: pierwsza para wojuje w turach 0, 30, 60 (granica okna P4 = 30 tur), wtedy kolejnosc D4 wzgledem
  // haka ROZSTRZYGA liczbe kamieni milowych w turze wojny; reszta: rzadkie losowe wojny.
  const [pa, pb0] = pairOf(owners[0], owners[1]);
  const plan = [];
  for (let ti = 0; ti < nTurns; ti += 1) {
    const wars = [];
    if (ti % 30 === 0) wars.push([pa, pb0]);
    if (r() < 0.03) {
      const a = pick(r, owners);
      let b = pick(r, owners);
      if (b === a) b = owners.find((o) => o !== a);
      wars.push([a, b]);
    }
    plan.push({ turn: ti, wars });
  }
  const run = (order) => {
    const { S, M } = mkModel('normal', { startTurn: 0 });
    return plan.map((st) => {
      M.setTurn(st.turn);
      const d4 = () => {
        M.updateStreams();
        for (const o of owners) M.tickBezWojny(o);
      };
      const d8 = () => {
        for (const [a, b] of st.wars) M.hook(a, b);
      };
      if (order === 'pin') {
        d4();
        d8();
      } else {
        d8();
        d4();
      }
      return snapshot(S, owners);
    });
  };
  const pinSnaps = run('pin');
  const revSnaps = run('reverse');
  orderCases.push({
    id: sc,
    difficulty: 'normal',
    owners,
    steps: plan.map((st, k) => ({ turn: st.turn, wars: st.wars, pin: pinSnaps[k], reverse: revSnaps[k] })),
  });
}

// ---- (C) S3 dla umowa_handlowa przez 3 tury (wartosci z pinu, bez aliasu po stronie Rust) ----
const s3Cases = [];
for (let i = 0; i < 20; i += 1) {
  const r = rng(9000 + i);
  const diff = DIFFS[i % 3];
  const nItems = Math.floor(r() * 3);
  const deal = {
    id: `s3-${i}`,
    rodzaj: 'umowa_handlowa',
    strony: [0, 1],
    wygasaTura: null,
    zawartaTura: 0,
    handelSurowiecCykliczny: Array.from({ length: nItems }, () => ({})),
  };
  const cycMap = new Map();
  const { S, M } = mkModel(diff, { deals: [deal], cycMap, startTurn: 0 });
  const turns = [];
  for (let t = 0; t < 3; t += 1) {
    M.setTurn(t);
    cycMap.clear();
    const deliveries = deal.handelSurowiecCykliczny.map((_, idx) => {
      const v = r();
      if (v < 0.2) {
        cycMap.set(`${deal.id}#${idx}`, false);
        return [idx, false];
      }
      if (v < 0.7) {
        cycMap.set(`${deal.id}#${idx}`, true);
        return [idx, true];
      }
      return [idx, null];
    });
    M.updateStreams();
    turns.push({
      turn: t,
      deliveries,
      streams: [0, 1].map((o) => [
        o,
        Array.from((S.wiarygodnoscStrumienByOwner.get(o) ?? new Map()).entries(), ([k, e]) => [
          k,
          e.typ,
          e.wartoscNaTure,
          e.sumaAktywna,
        ]),
      ]),
    });
  }
  s3Cases.push({ id: i, difficulty: diff, nItems, turns });
}

// ---- liczniki niepustosci (straznik: zero = generator nic nie sprawdza) ----
const counts = {
  hookCases: hookCases.length,
  hookWarsRecorded: hookCases.filter(
    (c) => !c.barbarian && c.pair[0] >= 0 && c.pair[1] >= 0
      && c.lastWarAfter.find(([o]) => o === c.pair[0])[1] === c.turn
      && c.lastWarAfter.find(([o]) => o === c.pair[1])[1] === c.turn,
  ).length,
  hookBarbarian: hookCases.filter((c) => c.barbarian).length,
  orderSequences: orderCases.length,
  orderMilestonePositive: orderCases.reduce(
    (n, s) => n + s.steps.filter((st) => st.pin.p4.some(([, v]) => v > 0)).length,
    0,
  ),
  orderOrderDiffers: orderCases.reduce(
    (n, s) => n + s.steps.filter((st) => JSON.stringify(st.pin) !== JSON.stringify(st.reverse)).length,
    0,
  ),
  s3Cases: s3Cases.length,
  s3TradeEntryPresent: s3Cases.reduce(
    (n, c) => n + c.turns.reduce((m, t) => m + t.streams[0][1].filter(([, typ]) => typ === 'strumien_handel').length, 0),
    0,
  ),
  s3TradeEntryAbsent: s3Cases.reduce(
    (n, c) => n + c.turns.filter((t) => !t.streams[0][1].some(([, typ]) => typ === 'strumien_handel')).length,
    0,
  ),
};
const need = { hookCases: 150, hookWarsRecorded: 1, hookBarbarian: 1, orderMilestonePositive: 1,
  orderOrderDiffers: 1, s3TradeEntryPresent: 1, s3TradeEntryAbsent: 1 };
for (const [k, min] of Object.entries(need)) {
  if (counts[k] < min) {
    console.error(`LICZNIK ${k} = ${counts[k]} < ${min}`);
    process.exit(5);
  }
}

// ---- zapis: liczby niecalkowite jako `f64:<hex bitow IEEE-754>` (serde_json bez float_roundtrip) ----
function encodeFloats(x) {
  if (typeof x === 'number') {
    if (Number.isInteger(x)) return x;
    const dv = new DataView(new ArrayBuffer(8));
    dv.setFloat64(0, x);
    return 'f64:' + dv.getBigUint64(0).toString(16).padStart(16, '0');
  }
  if (Array.isArray(x)) return x.map(encodeFloats);
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, encodeFloats(v)]));
  return x;
}
writeFileSync(
  join(outDir, 'vectors.json'),
  JSON.stringify(
    encodeFloats({
      pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75',
      sha256: SHA,
      fragSha256: FRAG_OUT,
      counts,
      hook: hookCases,
      ordering: orderCases,
      s3: s3Cases,
    }),
    null,
    0,
  ) + '\n',
);
console.log('OK', JSON.stringify(counts));
