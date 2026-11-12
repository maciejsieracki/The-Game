// P6-WIRE-WAR-CRED-Q1: generator wektorow z WEBA (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75) dla rejestru
// wiarygodnosci (appendCredibilityEvent, strumienie S1-S4, P4, finisz P1-P3 / D2, suma calkowita).
// Uzycie: node p6_credibility_gen.mjs <esbuild> <katalog-z-rozpakowanym-pinem(gra/src, gra/data)> <katalog-roboczy-POZA-REPO> <katalog-wyjsciowy>
//   np. git archive 07d2fbd72... gra/src gra/data -o pin.tar && tar -x -f pin.tar -C <pin>
//
// WYKONANIE TEKSTU PINU:
//   - `game/diplomacy-credibility.ts`, `game/diplomacy-treaties.ts` (expireTreaties, normalizeTreatyKind),
//     `types/diplomacy.ts` (RodzajTraktatu), `game/diplomacy.ts` (parametry) sa bundlowane esbuildem i WYKONYWANE;
//   - funkcje domkniete w `main.ts` (appendWiarygodnoscEvent, getWiarygodnoscEvents, getWiarygodnoscStreamEntries,
//     getWiarygodnosc, wiarygodnoscStreamKey, tickWiarygodnoscStreamFor, tickWiarygodnoscBezWojnyMilestone,
//     updateWiarygodnoscStreamsThisTurn) oraz fragment D2 `runDiplomacyTurnTick` (od `dealsBeforeExpire` do
//     `tickCyclicResourceTradeDeals()`) sa WYCINANE jako TEKST z pliku pinu (po markerach), transpilowane esbuildem
//     (--loader=ts) i wykonywane w fabryce, ktorej stan domkniecia (mapy, tura, trudnosc, deals) jest wstrzykniety.
// STRAZNIK: SHA-256 zrodel pinu musi sie zgadzac, inaczej generator konczy sie bledem.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , esbuild, pinDir, workDir, outDir] = process.argv;
if (!esbuild || !pinDir || !workDir || !outDir) {
  console.error('uzycie: node gen.mjs <esbuild> <pinDir> <workDir> <outDir>');
  process.exit(2);
}
const SHA = {
  'gra/src/main.ts': 'e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19',
  'gra/src/game/diplomacy-credibility.ts': 'd9c15d7c69f368c9619755f31e7b9df01d0d9c36b493000c794234dcef36061c',
  'gra/src/game/diplomacy-treaties.ts': '9b8e3bd81b65de1bb009a86058d1afa59a48c096b6ed6e91be71606af6cde6cb',
  'gra/src/types/diplomacy.ts': '1a963e56488b547261da9ffca0712c71875a54dd2024388ce6580e6c63290b6b',
  'gra/src/game/difficulty-cost.ts': '6f159d865c4a977d0df0883dfa9aa6240ed2718ffd11d90e2dc4041f93a7560e',
  'gra/data/diplomacy.json': '836098deb6aedd5c0230c47cd6c5da5691f5b7e6891bb6ceda02b94f2b21eb6e',
};
for (const [rel, want] of Object.entries(SHA)) {
  const got = createHash('sha256').update(readFileSync(join(pinDir, rel))).digest('hex');
  if (got !== want) {
    console.error(`STRAZNIK SHA-256: ${rel}: ${got} != ${want}`);
    process.exit(3);
  }
}
mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

// ---- bundle modulow pinu ----
const g = (f) => join(pinDir, 'gra/src/game', f).replaceAll('\\', '/');
const entry = join(workDir, 'entry.ts');
writeFileSync(
  entry,
  `export * from '${g('diplomacy-credibility.ts')}';\n` +
    `export { expireTreaties, normalizeTreatyKind } from '${g('diplomacy-treaties.ts')}';\n` +
    `export { RodzajTraktatu } from '${join(pinDir, 'gra/src/types/diplomacy.ts').replaceAll('\\', '/')}';\n` +
    `export { getBaseDiplomacyParams, getEffectiveDiplomacyParams } from '${g('diplomacy.ts')}';\n`,
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
function extractD2() {
  const start = mainLines.findIndex((l) => l.trim() === 'const dealsBeforeExpire = activeDeals;');
  if (start < 0) throw new Error('brak dealsBeforeExpire');
  let end = start;
  while (mainLines[end].trim() !== 'tickCyclicResourceTradeDeals();') end += 1;
  return mainLines.slice(start, end).join('\n');
}
const FN_NAMES = [
  'getWiarygodnoscEvents',
  'appendWiarygodnoscEvent',
  'getWiarygodnoscStreamEntries',
  'getWiarygodnosc',
  'wiarygodnoscStreamKey',
  'tickWiarygodnoscStreamFor',
  'tickWiarygodnoscBezWojnyMilestone',
  'updateWiarygodnoscStreamsThisTurn',
];
const factorySrc = `
export function make(S) {
  const { wiarygodnoscZdarzeniaByOwner, wiarygodnoscStrumienByOwner, wiarygodnoscOstatniaWojnaTuraByOwner,
    wiarygodnoscP4MilestonesByOwner, wiarygodnoscCyclicDeliveryOkThisTurn, normalizeTreatyKind, RodzajTraktatu,
    appendCredibilityEvent, freshCredibilityStreamEntry, tickCredibilityStreamEntry, sumaWiarygodnosciCalkowita,
    wiarygodnoscStartowa, expireTreaties, _menuDifficulty, _diplomacyParams } = S;
  let turn = S.turn;
  let activeDeals = S.activeDeals;
  let zlozeGrants = [];
  let barbarianCooperationGrace = [];
  const BARBARIAN_COOPERATION_TURNS = 3;
  const deactivateZlozeGrantsForDeal = (g) => g;
  const recordBarbarianCooperationGrace = (list, a, b, until) => [...list, [a, b, until]];
${FN_NAMES.map(extractFn).join('\n')}
  function runD2() {
${extractD2()}
  }
  return {
    getWiarygodnosc, appendWiarygodnoscEvent, updateWiarygodnoscStreamsThisTurn, tickWiarygodnoscBezWojnyMilestone,
    runD2, setTurn: (t) => { turn = t; }, getDeals: () => activeDeals, setDeals: (d) => { activeDeals = d; },
    graceList: () => barbarianCooperationGrace,
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
const EVENT_TYPES = [
  'wypowiedzenie_wojny_bez_ostrzezenia', 'zlamanie_paktu_nap', 'zlamanie_paktu_sojusz', 'atak_w_oknie_karencji',
  'odmowa_obowiazku_sojuszu', 'zerwanie_dobrowolne_traktat', 'zerwanie_dobrowolne_handel',
  'niedotrzymanie_handlu_cyklicznego', 'nieautoryzowany_przemarsz', 'dotrwanie_sojuszu', 'dotrwanie_nap',
  'dotrwanie_handlu', 'splata_handlu_cyklicznego', 'wieloletni_pokoj', 'pomoc_sojusznikowi_realna',
];
const STREAM_TYPES = ['strumien_sojusz', 'strumien_nap', 'strumien_handel', 'strumien_przemarsz'];

// ---- A) funkcje czyste rdzenia (bezposrednio z pinu) ----
const rngA = rng(20261112);
const params = W.getBaseDiplomacyParams();
const paramKeys = Object.keys(params).filter((k) => k.startsWith('wiarygodnosc')).sort();
const paramsOut = Object.fromEntries(paramKeys.map((k) => [k, params[k]]));

const pure = [];
// stream weights
for (const d of DIFFS) {
  for (const t of STREAM_TYPES) {
    pure.push({ fn: 'streamWeight', difficulty: d, typ: t, out: W.credibilityStreamWeight(t, d) });
  }
  pure.push({ fn: 'start', difficulty: d, out: W.wiarygodnoscStartowa(d) });
}
for (const w of [-100, -61, -40, -39, -1, 0, 0.5, 1, 39, 39.9, 40, 41, 100, 250, -250]) {
  pure.push({ fn: 'band', w, out: W.wiarygodnoscBand(w) });
}
// appendCredibilityEvent / wartoscBiezaca / sumaWiarygodnosciCalkowita na losowych rejestrach
for (let i = 0; i < 220; i += 1) {
  const diff = pick(rngA, DIFFS);
  const n = Math.floor(rngA() * 9);
  let events = [];
  const appended = [];
  for (let k = 0; k < n; k += 1) {
    const typ = pick(rngA, EVENT_TYPES);
    const value = pick(rngA, [0, 0, -30, -20, -10, -5, -2.5, 1, 2, 5, 10, 15, 25, 0.1, -0.3]);
    const tura = Math.floor(rngA() * 200);
    const next = W.appendCredibilityEvent(events, typ, value, tura);
    appended.push({ typ, value, tura, appended: next !== events });
    events = next;
  }
  const nStreams = Math.floor(rngA() * 5);
  const streams = [];
  for (let k = 0; k < nStreams; k += 1) {
    let e = W.freshCredibilityStreamEntry(pick(rngA, STREAM_TYPES), diff);
    const ticks = Math.floor(rngA() * 60);
    for (let q = 0; q < ticks; q += 1) e = W.tickCredibilityStreamEntry(e);
    streams.push({ entry: e, ticks });
  }
  const tura = Math.floor(rngA() * 320);
  const start = W.wiarygodnoscStartowa(diff);
  pure.push({
    fn: 'total', difficulty: diff, appended, streams: streams.map((s) => ({ typ: s.entry.typ, ticks: s.ticks })),
    turn: tura, events,
    streamEntries: streams.map((s) => s.entry),
    outTotal: W.sumaWiarygodnosciCalkowita(events, streams.map((s) => s.entry), start, tura, diff),
    outSimple: W.sumaWiarygodnosci(events, start, tura, diff),
    outEventValues: events.map((e) => W.wartoscBiezaca(e, tura, diff)),
    outStreamSum: W.sumaStrumienia(streams.map((s) => s.entry)),
  });
}

// ---- B) sekwencje tur: D2 + D4 + P4 przez TEKST main.ts ----
const KINDS_D2 = [
  'pakt_nieagresji', 'sojusz_defensywny', 'sojusz_pelny', 'sojusz_wojskowy', 'umowa_szlakow', 'umowa_wymiany',
  'umowa_handlowa', 'otwarte_granice', 'prawo_wojskowe_przemarszu', 'wspolna_walka_barbarzyncy', 'wasalizacja',
];
// D4 vectors: bez legacy `umowa_handlowa` (Rust scala ja z umowa_szlakow aliasem serde; patrz raport, BRAK).
const KINDS_D4 = KINDS_D2.filter((k) => k !== 'umowa_handlowa');
const sequences = [];
for (let sc = 0; sc < 48; sc += 1) {
  const r = rng(1000 + sc);
  const diff = DIFFS[sc % 3];
  const owners = [0, 1, 2, 3].slice(0, 2 + Math.floor(r() * 3));
  const startTurn = Math.floor(r() * 40);
  const nTurns = 8 + Math.floor(r() * 10);
  const kinds = sc % 4 === 3 ? KINDS_D2 : KINDS_D4;
  const registry = {
    ev: new Map(), st: new Map(), lastWar: new Map(), p4: new Map(), cyc: new Map(),
  };
  let deals = [];
  let dealSeq = 0;
  const newDeal = (turn) => {
    const a = pick(r, owners);
    let b = pick(r, owners);
    if (b === a) b = owners.find((o) => o !== a);
    const nCyc = r() < 0.4 ? 1 + Math.floor(r() * 2) : 0;
    const life = r() < 0.3 ? null : 1 + Math.floor(r() * 6);
    dealSeq += 1;
    return {
      id: `d${sc}-${dealSeq}`, rodzaj: pick(r, kinds), strony: a < b ? [a, b] : [b, a],
      wygasaTura: life === null ? null : turn + life, zawartaTura: turn,
      handelSurowiecCykliczny: Array.from({ length: nCyc }, () => ({})),
      handelCyklicznyKiedykolwiekNiedostarczono: r() < 0.3,
      ...(r() < 0.1 ? { wspolnaWalkaBarbarzyncy: true } : {}),
    };
  };
  const steps = [];
  const initial = [];
  const nInit = 1 + Math.floor(r() * 4);
  for (let i = 0; i < nInit; i += 1) {
    const d = newDeal(startTurn);
    // gwarantuje wygasniecie w oknie symulacji (`wygasaTura == null` zostaje na zawsze)
    initial.push(d);
  }
  deals = initial.map((d) => structuredClone(d));
  const dealsAtStart = structuredClone(deals);
  const _menuDifficulty = diff;
  const cycMap = new Map();
  const S = {
    wiarygodnoscZdarzeniaByOwner: registry.ev, wiarygodnoscStrumienByOwner: registry.st,
    wiarygodnoscOstatniaWojnaTuraByOwner: registry.lastWar, wiarygodnoscP4MilestonesByOwner: registry.p4,
    wiarygodnoscCyclicDeliveryOkThisTurn: cycMap,
    normalizeTreatyKind: W.normalizeTreatyKind, RodzajTraktatu: W.RodzajTraktatu,
    appendCredibilityEvent: W.appendCredibilityEvent, freshCredibilityStreamEntry: W.freshCredibilityStreamEntry,
    tickCredibilityStreamEntry: W.tickCredibilityStreamEntry,
    sumaWiarygodnosciCalkowita: W.sumaWiarygodnosciCalkowita, wiarygodnoscStartowa: W.wiarygodnoscStartowa,
    expireTreaties: W.expireTreaties, _menuDifficulty,
    _diplomacyParams: () => W.getEffectiveDiplomacyParams(_menuDifficulty),
    turn: startTurn, activeDeals: deals,
  };
  const M = F.make(S);
  for (let ti = 0; ti < nTurns; ti += 1) {
    const turn = startTurn + ti;
    M.setTurn(turn);
    const addDeals = [];
    if (ti > 0 && r() < 0.35) {
      const d = newDeal(turn);
      addDeals.push(d);
      M.setDeals([...M.getDeals(), structuredClone(d)]);
    }
    const dealsBefore = structuredClone(M.getDeals());
    M.runD2();
    const graceAfterD2 = structuredClone(M.graceList());
    // wektor D3: wyniki dostaw (klucz `${id}#${idx}`), wypelniane po D2 (web: tickCyclicResourceTradeDeals).
    cycMap.clear();
    const cyc = {};
    for (const d of M.getDeals()) {
      (d.handelSurowiecCykliczny ?? []).forEach((_, idx) => {
        const v = r();
        if (v < 0.25) { cycMap.set(`${d.id}#${idx}`, false); cyc[`${d.id}#${idx}`] = false; }
        else if (v < 0.6) { cycMap.set(`${d.id}#${idx}`, true); cyc[`${d.id}#${idx}`] = true; }
      });
    }
    // N6 / inne zdarzenia dopisane po D2 (jak applyCyclicDeliveryOutcome w D3)
    const extra = [];
    const nExtra = r() < 0.5 ? Math.floor(r() * 3) : 0;
    for (let k = 0; k < nExtra; k += 1) {
      const e = { owner: pick(r, owners), typ: pick(r, EVENT_TYPES), value: pick(r, [0, -10, -2, 3, 5, 0.25]) };
      M.appendWiarygodnoscEvent(e.owner, e.typ, e.value);
      extra.push(e);
    }
    // P4: wejscie w wojne zeruje licznik (hak chargeWarDeclarationCredibility, main.ts:12223)
    const wars = [];
    if (r() < 0.2) {
      const a = pick(r, owners);
      let b = pick(r, owners);
      if (b === a) b = owners.find((o) => o !== a);
      registry.lastWar.set(a, turn);
      registry.lastWar.set(b, turn);
      wars.push([a, b]);
    }
    M.updateWiarygodnoscStreamsThisTurn();
    for (const o of owners) M.tickWiarygodnoscBezWojnyMilestone(o);
    steps.push({
      turn, addDeals, dealsBefore: dealsBefore.map((d) => ({ ...d })), cyc, extra, wars,
      graceAfterD2,
      after: {
        events: Array.from(registry.ev.entries()),
        streams: Array.from(registry.st.entries(), ([o, m]) => [o, Array.from(m.entries())]),
        lastWar: Array.from(registry.lastWar.entries()),
        p4: Array.from(registry.p4.entries()),
        totals: Object.fromEntries(owners.map((o) => [o, M.getWiarygodnosc(o)])),
      },
    });
  }
  sequences.push({ name: `seq-${sc}`, difficulty: diff, owners, startTurn, initial: dealsAtStart, steps });
}

// serde_json bez `float_roundtrip` parsuje niecalkowite f64 z bledem do 1 ulp, wiec niecalkowite liczby sa zapisane
// jako tekst `f64:<16 cyfr hex bitow IEEE-754>`; test Rust dekoduje je dokladnie (`f64::from_bits`).
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
  JSON.stringify(encodeFloats({ pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75', sha256: SHA, params: paramsOut, pure, sequences }), null, 0) + '\n',
);
console.log('OK pure', pure.length, 'sequences', sequences.length, 'steps', sequences.reduce((a, s) => a + s.steps.length, 0));
