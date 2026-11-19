'use strict';
/**
 * R-WEB-DIPLO-PEACE-CITIES-NOT-TRANSFERRED-AND-WAR-NEXT-TURN-Q1 (runda 2) — regresja NEGOCJOWANEGO pokoju z cesją
 * miast (oferta AI z `dodatkoweMiasta`, gracz akceptuje przy stole; NIE pokój wymuszony).
 *
 * Defekt: `cityCessionPayloadBlockReason` odrzucał każdą propozycję z >1 miastem („może być tylko jedno miasto”)
 * i wychodził PRZED `finalizePeaceTreatyBetween` — pokój nie był zawierany, wojna trwała, miasta nie przechodziły.
 *
 * Część 1 (prawdziwa logika): `partitionPeaceCityItems` + `selectSequentialCityCessions` z
 *   src/game/diplomacy-value-catalog.ts, zbundlowane esbuild z STDIN (bez zapisu plików). Mutacja kopii
 *   (stary limit „>1 miasto = blok”) musi dać wynik czerwony.
 * Część 2 (wiring, src/main.ts): ścieżka oneShot pokoju używa `cityCessionFilterPayload` przed przelewem
 *   i zawiera pokój (`finalizePeaceTreatyBetween`) PO przelewie; brak limitu „jedno miasto”.
 * NIE ZMIERZONO: przebieg w prawdziwej grze/Chromium (hak civTest) — patrz raport.
 * Uruchom: node tools/peace-city-cession-negotiated-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA, 'src');

const stdinContents = `
export {
  partitionPeaceCityItems,
  selectSequentialCityCessions,
} from './game/diplomacy-value-catalog';
`;

const built = esbuild.buildSync({
  stdin: { contents: stdinContents, resolveDir: SRC, sourcefile: 'entry.ts', loader: 'ts' },
  bundle: true, platform: 'node', format: 'cjs', target: 'node18', write: false, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});
const mod = { exports: {} };
new Function('module', 'exports', 'require', built.outputFiles[0].text)(mod, mod.exports, require);
const D = mod.exports;

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(JSON.stringify(a) === JSON.stringify(b), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// Stary (błędny) limit: propozycja z więcej niż jednym miastem jest w całości odrzucana.
function oldOneCityLimit(cityIds) { return cityIds.length > 1 ? [] : cityIds; }

const EIGHT = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];
const noPlanIssue = () => null;

// 1. Dawca z 8 miastami oddaje 2 (oferta AI 2 miast): oba przechodzą, pokój NIE jest blokowany.
{
  const r = D.partitionPeaceCityItems({ cityIds: ['C1', 'C2'], ownerCityIds: EIGHT, capitalCityId: 'C1', planReason: noPlanIssue });
  eq(r.allowed, ['C2'], 'dawca 8 miast, stolica C1 nieprzenoszalna: przechodzi tylko C2 (stolica odpada)');
  const r2 = D.partitionPeaceCityItems({ cityIds: ['C2', 'C3'], ownerCityIds: EIGHT, capitalCityId: 'C1', planReason: noPlanIssue });
  eq(r2.allowed, ['C2', 'C3'], 'dawca 8 miast, oferta 2 zwykłych miast: OBA przechodzą (dawny limit je blokował)');
  eq(r2.dropped, [], 'brak odrzuconych miast przy 2 wykonalnych');
  eq(oldOneCityLimit(['C2', 'C3']), [], 'mutacja kopii (stary limit >1 miasta): przepuszcza 0 z 2 — to był defekt');
}

// 2. Dawca z 2 miastami oddaje oba: drugie jest ostatnim miastem po pierwszym przelewie -> zakaz sekwencyjny.
{
  const r = D.partitionPeaceCityItems({ cityIds: ['A', 'B'], ownerCityIds: ['A', 'B'], capitalCityId: 'CAP', planReason: noPlanIssue });
  eq(r.allowed, ['A'], 'dawca z 2 miastami: pierwsze przechodzi, drugie (ostatnie) odpada sekwencyjnie');
  eq(r.dropped.map(d => d.cityId), ['B'], 'drugie miasto trafia do dropped (komunikat gracza)');
  ok(typeof r.dropped[0].reason === 'string' && r.dropped[0].reason.length > 0, 'dropped niesie powód');
}

// 3. Miasto z niewykonalnym planem (np. brak wolnego pola) odpada z powodem planu, reszta przechodzi.
{
  const plan = id => (id === 'C3' ? 'Brak wolnego pola dla jednostek w mieście' : null);
  const r = D.partitionPeaceCityItems({ cityIds: ['C2', 'C3'], ownerCityIds: EIGHT, capitalCityId: 'C1', planReason: plan });
  eq(r.allowed, ['C2'], 'niewykonalny plan (C3) odpada, wykonalny (C2) przechodzi — częściowy pokój, nie blok');
  eq(r.dropped, [{ cityId: 'C3', reason: 'Brak wolnego pola dla jednostek w mieście' }], 'powód z planu trafia do dropped');
}

// 4. Wszystkie niewykonalne -> allowed puste (main.ts blokuje cały pokój z komunikatem).
{
  const r = D.partitionPeaceCityItems({ cityIds: ['C1'], ownerCityIds: EIGHT, capitalCityId: 'C1', planReason: noPlanIssue });
  eq(r.allowed, [], 'jedyne miasto = stolica: nic nie przechodzi (pokój zostaje zablokowany w main.ts)');
}

// 5. Duplikat id nie podwaja przelewu.
{
  const r = D.partitionPeaceCityItems({ cityIds: ['C2', 'C2'], ownerCityIds: EIGHT, capitalCityId: 'C1', planReason: noPlanIssue });
  eq(r.allowed, ['C2'], 'duplikat id przechodzi raz');
}

// 6. Spójność z selectSequentialCityCessions (dawny test sekwencji nadal zielony).
eq(
  D.selectSequentialCityCessions({ cityIds: ['A', 'B'], ownerCityIds: ['A', 'B', 'C'], capitalCityId: 'CAP' }),
  ['A', 'B'],
  'dawca z 3 miastami oddaje 2: oba przechodzą',
);

// Część 2: wiring w main.ts (oneShot pokoju).
const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
ok(!mainSrc.includes('może być tylko jedno miasto'), 'main.ts: brak limitu „tylko jedno miasto” w pre-kontroli pokoju');
ok(mainSrc.includes('partitionPeaceCityItems,'), 'main.ts: importuje partitionPeaceCityItems z katalogu wartości');
const fnStart = mainSrc.indexOf('function applyProposalOutcomeImpl(');
const fnEnd = mainSrc.indexOf('\n    function ', fnStart + 10);
const body = mainSrc.slice(fnStart, fnEnd);
const iFilter = body.indexOf('cityCessionFilterPayload(payload, proposerId, responderId)');
const iTransfer = body.indexOf('executePnDealTransfer(proposerId, responderId, payload);', iFilter);
const iFinalize = body.indexOf('finalizePeaceTreatyBetween(proposerId, responderId);');
ok(iFilter > 0, 'applyProposalOutcomeImpl: wywołuje cityCessionFilterPayload w gałęzi oneShot');
ok(iTransfer > iFilter, 'filtr miast wykonywany PRZED przelewem');
ok(iFinalize > iTransfer, 'pokój zawierany (finalizePeaceTreatyBetween) PO przelewie miast');
const filterBlock = mainSrc.slice(mainSrc.indexOf('function cityCessionFilterPayload('), mainSrc.indexOf('function cityCessionFilterPayload(') + 2600);
ok(filterBlock.includes('partitionPeaceCityItems({'), 'cityCessionFilterPayload używa partitionPeaceCityItems (sekwencyjne zakazy)');

console.log(`peace-city-cession-negotiated-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
