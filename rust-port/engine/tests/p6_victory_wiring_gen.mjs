// R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1 (r3): generator wektorow wiringu zwyciestwa/porazki do stanu tury.
//
// Co WYKONUJE generator (tekst pina 07d2fbd72, bez przepisywania logiki):
//   - `gra/src/game/victory.ts`: checkVictory, checkDefeat, isEliminated (przez stripTypeScriptTypes + stuby).
//   - `gra/src/main.ts`, fragmenty wyciete po tekscie (SHA-256 kazdego fragmentu w wektorach):
//       * blok sprawdzenia zwyciestwa po turze (try/catch, main.ts ~43441-43483 + catch) -> `postTurn`,
//       * bramki konca tury po grze (`if (gameOver)` przy EndTurn) -> `gateCases`,
//       * reset przy nowej grze (`cityRelig.clear(); ...; gameOver = false;`), reset flagi
//         (`playerEverOwnedCityByOwner.clear(); ...add(HUMAN_OWNER_PRIMARY)`), odtworzenie flagi przy wczytaniu
//         (`clear(); for (oid of saved.humanOwnerIds) ... add(oid)`) -> `resetCases`.
//     Fragmenty sa wykonywane w sandboxie `with (proxy)`: zmienne z pinu, ktorych generator nie modeluje,
//     sa stubami (no-op), a DOM/UI jest wyciszone. Stan wyjsciowy (gameOver, zbior flagi, wynik) jest czytany
//     z tego samego obiektu, do ktorego pisze kod pinu. Kotwica (liczba wystapien w main.ts) jest sprawdzana.
//
// Co NIE jest wykonywane: caly `main.ts` (zalezny od DOM); zmienne wejsciowe sa scenariuszem generatora.
//
// Uzycie (WEB_ROOT = katalog z `git archive 07d2fbd72 gra/src gra/data`, poza repo; Node 22.6+; cwd = korzen repo):
//   node rust-port/engine/tests/p6_victory_wiring_gen.mjs <WEB_ROOT> > rust-port/engine/tests/p6_victory_wiring_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT] = process.argv.slice(2);
if (!WEB_ROOT) throw new Error('uzycie: gen.mjs <WEB_ROOT>');
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const EXPECTED_VICTORY_SHA256 = '2f22949ba00bbfb754410f66fc5e1856b67dc0621d31ea310c6df39e6517bb8a';
const VICTORY_REL = path.join('gra', 'src', 'game', 'victory.ts');
const MAIN_REL = path.join('gra', 'src', 'main.ts');
const LOADER_REL = path.join('gra', 'src', 'data', 'e-start-params-loader.ts');
const PIN_DATA_REL = path.join('gra', 'data', 'e-start-params.json');
const sha256 = s => createHash('sha256').update(s).digest('hex');

// Kotwice w main.ts: kazdy fragment musi wystepowac dokladnie tyle razy, ile wskazano.
const MAIN_ANCHORS = [
  ['wywolanie checkVictory po turze', 'const vResult = truceTestSuppressVictory ? null : checkVictory(vInput);', 1],
  ['flaga graczKiedysMialMiasto w VictoryInput', 'graczKiedysMialMiasto: playerEverOwnedCityByOwner.has(HUMAN_OWNER_PRIMARY),', 2],
  ['przegrana po utracie miasta (funkcja)', 'function sprawdzPrzegranaPoUtracieMiasta(): void {', 1],
  ['przegrana po utracie miasta (checkDefeat)', 'const defeat = checkDefeat({', 1],
  ['odrzucenie konca tury po grze', "console.warn('[EndTurn] blocked: gameOver');", 1],
  ['odrzucenie komendy po grze (podpowiedz)', 'Gra zakonczona. Kliknij "Nowa gra" by zagrac ponownie.', 1],
  ['zapis flagi: zalozenie miasta', 'playerEverOwnedCityByOwner.add(ME());', 1],
  ['zapis flagi: przejecie kapitulacja', 'playerEverOwnedCityByOwner.add(newOwner);', 1],
  ['zapis flagi: zdobycie bitwa', 'playerEverOwnedCityByOwner.add(atkOwner);', 1],
  ['odtworzenie flagi ze miast przy wczytaniu', 'if (cities.some(c => c.ownerId === oid)) playerEverOwnedCityByOwner.add(oid);', 1],
];

// Fragmenty wykonywane z tekstu pina (kazdy musi wystapic dokladnie raz; wyjatki opisane przy kluczu).
const FRAGMENTS = {
  postTurn: {
    start: '        try {\n          if (!gameOver && !rebelProtectionTestSkipVictoryCheck) {',
    end: "        } catch (eVic) {\n          console.error('[Victory] Blad sprawdzania warunkow zwyciestwa:', eVic);\n        }",
    kind: 'range',
  },
  gateEndTurn: {
    text: "      if (gameOver) {\n        console.warn('[EndTurn] blocked: gameOver');\n        return false;\n      }",
    kind: 'gate',
  },
  gateHint: {
    text: "      if (gameOver) {\n        showHintMessage('Gra zakonczona. Kliknij \"Nowa gra\" by zagrac ponownie.', 3000);\n        return;\n      }",
    kind: 'gate',
  },
  resetNewGame: {
    text: '      cityRelig.clear();\n      autoManageCities.clear();\n      gameOver = false;',
    kind: 'stmts',
  },
  resetLoadGameOver: { text: '      gameOver = false;', kind: 'stmts', expectCount: 5 },
  flagPreset: {
    text: '      playerEverOwnedCityByOwner.clear();\n      playerEverOwnedCityByOwner.add(HUMAN_OWNER_PRIMARY);',
    kind: 'stmts',
    expectCount: 2,
  },
  flagLoadRebuild: {
    text: '      playerEverOwnedCityByOwner.clear();\n      for (const oid of saved.humanOwnerIds) {\n        if (cities.some(c => c.ownerId === oid)) playerEverOwnedCityByOwner.add(oid);\n      }',
    kind: 'stmts',
  },
};

const victoryText = readFileSync(path.join(WEB_ROOT, VICTORY_REL), 'utf8');
const victorySha = sha256(victoryText);
if (victorySha !== EXPECTED_VICTORY_SHA256) {
  throw new Error(`strazik SHA-256 victory.ts: ${victorySha} != ${EXPECTED_VICTORY_SHA256} (pin ${PIN})`);
}

const mainText = readFileSync(path.join(WEB_ROOT, MAIN_REL), 'utf8');
const countOf = (text, needle) => text.split(needle).length - 1;
for (const [label, fragment, expected] of MAIN_ANCHORS) {
  const count = countOf(mainText, fragment);
  if (count !== expected) {
    throw new Error(`kotwica main.ts (${label}): ${count} trafien, oczekiwano ${expected}`);
  }
}

// Wycina fragment z main.ts: zwraca tekst, SHA, numery linii (1-based) i liczbe wystapien.
function cutFragment(label, spec) {
  let text;
  let count;
  let index;
  if (spec.kind === 'range') {
    index = mainText.indexOf(spec.start);
    if (index < 0 || mainText.indexOf(spec.start, index + 1) >= 0) throw new Error(`fragment ${label}: poczatek niejednoznaczny`);
    const endIdx = mainText.indexOf(spec.end, index);
    if (endIdx < 0) throw new Error(`fragment ${label}: brak konca`);
    text = mainText.slice(index, endIdx + spec.end.length);
    count = 1;
  } else {
    count = countOf(mainText, spec.text);
    if (count !== (spec.expectCount ?? 1)) {
      throw new Error(`fragment ${label}: ${count} trafien, oczekiwano ${spec.expectCount ?? 1}`);
    }
    index = mainText.indexOf(spec.text);
    text = spec.text;
  }
  const lineStart = mainText.slice(0, index).split('\n').length;
  const lineEnd = lineStart + text.split('\n').length - 1;
  return { text, count, lineStart, lineEnd, sha256: sha256(text) };
}
const CUT = Object.fromEntries(Object.entries(FRAGMENTS).map(([k, v]) => [k, cutFragment(k, v)]));

const pinEStart = JSON.parse(readFileSync(path.join(WEB_ROOT, PIN_DATA_REL), 'utf8'));
const Z = pinEStart.zwyciestwo;
if (!Z) throw new Error('brak bloku zwyciestwo w danych pinu');
const loaderText = readFileSync(path.join(WEB_ROOT, LOADER_REL), 'utf8');
for (const frag of ['? v : 3;', 'v < 1 ? v : 0.5;', '!== false']) {
  if (!loaderText.includes(frag)) throw new Error(`fragment fallbacku loadera nie znaleziony: ${frag}`);
}
const CONSTS = {
  ostatnia: Z.ostatnia_epoka_v1,
  prog: Z.prog_dominacji_power,
  dominacjaWymaga: Z.dominacja_wymaga_ostatniej_epoki,
  naukaWymaga: Z.nauka_wymaga_rakiety,
};

// --- victory.ts: wykonanie tekstu pina ---
let src = victoryText.replace(/^import[\s\S]*?from '[^']+';$/gm, '');
src = src.replace(/^export /gm, '');
const stubs = `
const eStartOstatniaEpokaV1 = () => ${CONSTS.ostatnia};
const eStartProgDominacjiPower = () => ${CONSTS.prog};
const eStartDominacjaWymagaOstatniejEpoki = () => ${CONSTS.dominacjaWymaga};
const eStartNaukaWymagaRakiety = () => ${CONSTS.naukaWymaga};
`;
const js = stripTypeScriptTypes(stubs + src, { mode: 'strip' });
const V = new Function(`${js}
return { OSTATNIA_EPOKA_GRY_V1, checkVictory, checkDefeat, isEliminated, powerShare };`)();

// --- sandbox dla fragmentow main.ts ---
// Nieznany identyfikator = stub (no-op). Identyfikatory z globalThis (Set, Map, Math...) zostaja globalne.
const STUB = () => undefined;
// Fragmenty pinu sa TypeScriptem (typy, generyki): najpierw strip typow, potem wykonanie jako JS.
function runPin(code, target) {
  const js = stripTypeScriptTypes(code, { mode: 'strip' });
  const proxy = new Proxy(target, {
    has: (t, k) => typeof k === 'string' && (k in t || !(k in globalThis)),
    get: (t, k) => (k === Symbol.unscopables ? undefined : k in t ? t[k] : STUB),
    set: (t, k, v) => {
      t[k] = v;
      return true;
    },
  });
  new Function('__s', `with (__s) {\n${js}\n}`)(proxy);
  return target;
}
const silentConsole = { log() {}, warn() {}, error() {}, info() {} };

// Blok post-turn: scenariusz -> stan po bloku (gameOver, wynik checkVictory, lista mocy przekazana do pinu).
function runPostTurn(scn) {
  const set = new Set(scn.setInit);
  const rec = { vResult: null, vInput: null };
  const target = {
    console: silentConsole,
    gameOver: false,
    rebelProtectionTestSkipVictoryCheck: false,
    truceTestSuppressVictory: false,
    _menuAdvanced: undefined,
    units: [],
    cities: scn.cityOwners.map(o => ({ ownerId: o })),
    player: { civType: 'grecy', era: scn.graczEra, zbadane: new Set(), rakietaWystrzelona: false },
    aiOwnerCivMap: new Map(),
    playerEverOwnedCityByOwner: set,
    HUMAN_OWNER_PRIMARY: 0,
    OSTATNIA_EPOKA_GRY_V1: V.OSTATNIA_EPOKA_GRY_V1,
    refreshObjectivePowerCache: STUB,
    objectivePowerForOwner: oid => scn.powers[oid],
    techIdsInGameScope: () => [],
    allTechInScopeResearched: () => false,
    checkVictory: input => {
      rec.vInput = { potegiWszystkich: input.potegiWszystkich, ostatniaEpoka: input.ostatniaEpoka };
      rec.vResult = V.checkVictory({
        cities: input.cities,
        gracz: input.gracz,
        liczbaOsadnikow: input.liczbaOsadnikow,
        graczKiedysMialMiasto: input.graczKiedysMialMiasto,
        potegaGracza: input.potegaGracza,
        potegiWszystkich: input.potegiWszystkich,
        graczEra: input.graczEra,
        ostatniaEpoka: input.ostatniaEpoka,
        wszystkieTechZbadane: input.wszystkieTechZbadane,
        rakietaWystrzelona: input.rakietaWystrzelona,
        victoryMode: input.victoryMode,
      });
      return rec.vResult;
    },
  };
  // Pin buduje vInput.players/cities: generator podaje miasta jako `cities` (zgodnie z victory.ts).
  runPin(CUT.postTurn.text, target);
  const r = rec.vResult;
  return {
    gameOver: target.gameOver,
    vResult: r === null || r === undefined ? null : { winner: r.winner, rodzaj: r.rodzaj },
    potegiWszystkich: rec.vInput ? rec.vInput.potegiWszystkich : null,
    flagaPinuPo: set.has(0),
  };
}

// Bramki EndTurn: zwraca 'PASS' (brak blokady) albo wynik bramki (false / undefined) i ewentualna podpowiedz.
function runGate(code, gameOver) {
  const hints = [];
  const target = {
    console: silentConsole,
    gameOver,
    showHintMessage: (msg) => { hints.push(msg); },
    __result: undefined,
  };
  runPin(`function __gate() {\n${code}\nreturn 'PASS';\n}\n__result = __gate();`, target);
  return { returned: target.__result, hint: hints.length ? hints[0] : null };
}

// Reset: zwraca stan po fragmencie pinu.
function runReset(kind, scn) {
  const set = new Set(scn.setInit);
  const target = {
    console: silentConsole,
    gameOver: scn.gameOverBefore,
    cityRelig: new Map([['x', 1]]),
    autoManageCities: new Map([['x', 1]]),
    playerEverOwnedCityByOwner: set,
    HUMAN_OWNER_PRIMARY: 0,
    cities: scn.cityOwners.map(o => ({ ownerId: o })),
    saved: { humanOwnerIds: scn.humanOwnerIds },
  };
  runPin(CUT[kind].text, target);
  return { gameOver: target.gameOver, flagaPinuPo: set.has(0) };
}

// --- scenariusze ---
const OWNERS = [[], [0], [0, 1], [1], [1, 1]];
const FLAGS = [false, true];
const ERAS = [1, 2, 3];
const POWERS = [[0.9, 0.2], [0.2, 0.9], [0.5, 0.5]];
const res = r => (r === null || r === undefined ? null : { winner: r.winner, rodzaj: r.rodzaj });
const cases = [];
for (const cityOwners of OWNERS) {
  for (const zapamietana of FLAGS) {
    for (const graczEra of ERAS) {
      for (const [potegaGracza, potegaAi] of POWERS) {
        const owns = cityOwners.includes(0);
        // Model Set-a pinu (historia): gracz 0 dodany do zbioru przy zalozeniu miasta lub wczesniej (zapamietana).
        const flagaPinu = zapamietana || owns;
        const setInit = flagaPinu ? [0] : [];
        const powers = { 0: potegaGracza, 1: potegaAi };
        const input = {
          cities: cityOwners.map(o => ({ ownerId: o })),
          gracz: 0,
          liczbaOsadnikow: 0,
          graczKiedysMialMiasto: flagaPinu,
          potegaGracza,
          potegiWszystkich: [potegaGracza, potegaAi],
          graczEra,
          ostatniaEpoka: V.OSTATNIA_EPOKA_GRY_V1,
          wszystkieTechZbadane: false,
          rakietaWystrzelona: false,
          victoryMode: 'moc_i_dominacja',
        };
        const post = runPostTurn({ cityOwners, setInit, graczEra, powers });
        cases.push({
          input: {
            cityOwners,
            zapamietana,
            flagaPinu,
            gracz: 0,
            potegaGracza,
            potegiWszystkich: input.potegiWszystkich,
            graczEra,
            ostatniaEpoka: input.ostatniaEpoka,
          },
          victory: res(V.checkVictory(input)),
          defeat: res(V.checkDefeat({ cities: input.cities, gracz: 0, graczKiedysMialMiasto: flagaPinu })),
          eliminated: V.isEliminated(0, input.cities),
          postTurn: post,
        });
      }
    }
  }
}

const gateCases = [];
for (const gameOver of [false, true]) {
  gateCases.push({ gate: 'endTurn', gameOver, ...runGate(CUT.gateEndTurn.text, gameOver) });
  gateCases.push({ gate: 'hint', gameOver, ...runGate(CUT.gateHint.text, gameOver) });
}

const resetCases = [
  { reset: 'resetNewGame', gameOverBefore: true, ...runReset('resetNewGame', { gameOverBefore: true, setInit: [], cityOwners: [0] }) },
  { reset: 'flagPreset', setInit: [], cityOwners: [], ...runReset('flagPreset', { gameOverBefore: false, setInit: [], cityOwners: [] }) },
  { reset: 'resetLoadGameOver', gameOverBefore: true, ...runReset('resetLoadGameOver', { gameOverBefore: true, setInit: [], cityOwners: [] }) },
  { reset: 'flagLoadRebuild', humanOwnerIds: [0], cityOwners: [1], setInit: [0], ...runReset('flagLoadRebuild', { gameOverBefore: false, setInit: [0], cityOwners: [1], humanOwnerIds: [0] }) },
  { reset: 'flagLoadRebuild', humanOwnerIds: [0], cityOwners: [0], setInit: [], ...runReset('flagLoadRebuild', { gameOverBefore: false, setInit: [], cityOwners: [0], humanOwnerIds: [0] }) },
];

const fragments = Object.fromEntries(
  Object.entries(CUT).map(([k, v]) => [k, { sha256: v.sha256, lineStart: v.lineStart, lineEnd: v.lineEnd, count: v.count }]),
);

process.stdout.write(`${JSON.stringify({
  pin: PIN,
  victorySha256: victorySha,
  anchors: MAIN_ANCHORS.length,
  fragments,
  cases,
  gateCases,
  resetCases,
}, null, 1)}\n`);
