// R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1 (r2): generator wektorow wpiecia zwyciestwa/porazki do stanu tury.
//
// Co WYKONUJE generator (tekst pina 07d2fbd72):
//   - `gra/src/game/victory.ts`: checkVictory, checkDefeat (przez stripTypeScriptTypes + stuby loadera),
//     te same funkcje co w p6_victory_gen.mjs, ale na scenariuszach WPIECIA (flaga + miasta + era + moc).
// Co generator tylko KOTWICZY w `gra/src/main.ts` (sprawdzane przez unikalny fragment tekstu, nie wykonywane,
// bo main.ts jest zalezny od DOM): wywolanie checkVictory po turze (main.ts:43481), odrzucenie konca tury
// po grze (`[EndTurn] blocked: gameOver`), komunikat `Gra zakonczona` (odrzucenie komendy), sprawdzenie
// przegranej po utracie miasta (`sprawdzPrzegranaPoUtracieMiasta`), zapisy flagi `playerEverOwnedCityByOwner`
// (16508, 17816, 36218, 45646/45878 preset, 46370 odtworzenie). Brak kotwicy = FAIL generatora.
//
// Model flagi: pin trzyma per-owner Set `playerEverOwnedCityByOwner`; wejscie do wektora `flagaPinu` =
// `zapamietana || gracz 0 ma miasto` (Set jest dopisywany przy zalozeniu/przejeciu miasta, a Set nie jest
// czyszczony w trakcie gry). Wektor zawiera oba wejscia, zeby Rust sprawdzal to samo odwzorowanie.
//
// Uzycie (WEB_ROOT = katalog z `git archive 07d2fbd72 gra/src gra/data`, poza repo; Node 22+; cwd = korzen repo):
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

const victoryText = readFileSync(path.join(WEB_ROOT, VICTORY_REL), 'utf8');
const victorySha = createHash('sha256').update(victoryText).digest('hex');
if (victorySha !== EXPECTED_VICTORY_SHA256) {
  throw new Error(`strazik SHA-256 victory.ts: ${victorySha} != ${EXPECTED_VICTORY_SHA256} (pin ${PIN})`);
}

const mainText = readFileSync(path.join(WEB_ROOT, MAIN_REL), 'utf8');
for (const [label, fragment, expected] of MAIN_ANCHORS) {
  const count = mainText.split(fragment).length - 1;
  if (count !== expected) {
    throw new Error(`kotwica main.ts (${label}): ${count} trafien, oczekiwano ${expected}`);
  }
}

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

// Scenariusze wpiecia: wlasciciele miast (0 = gracz), flaga zapamietana, era, moc gracza i AI.
const OWNERS = [[], [0], [0, 1], [1], [1, 1]];
const FLAGS = [false, true];
const ERAS = [1, 2, 3];
const POWERS = [[0.9, 0.2], [0.2, 0.9], [0.5, 0.5]];
const out = [];
for (const cityOwners of OWNERS) {
  for (const zapamietana of FLAGS) {
    for (const graczEra of ERAS) {
      for (const [potegaGracza, potegaAi] of POWERS) {
        const owns = cityOwners.includes(0);
        // Model Set-a pinu: zapamietana albo obecne miasto gracza 0.
        const flagaPinu = zapamietana || owns;
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
        const res = r => (r === null ? null : { winner: r.winner, rodzaj: r.rodzaj });
        out.push({
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
        });
      }
    }
  }
}

process.stdout.write(`${JSON.stringify({ pin: PIN, victorySha256: victorySha, anchors: MAIN_ANCHORS.length, cases: out }, null, 1)}\n`);
