// P6.5B r2 (zarzut 5): pomiar String.prototype.localeCompare dla napisow ASCII 0x20-0x7E w WIELU
// lokalizacjach (web wola a.localeCompare(b) BEZ argumentu locale, wiec uzywa lokalizacji przegladarki
// gracza). Porownuje tablice par 95x95 (a, b, a+b dla znakow) kazdej lokalizacji z en-US.
//
// Uzycie: node measure-localecompare-locales.mjs > dowody/localecompare-locales-r2.txt
// Wynik to POMIAR w uruchomionym Node (ICU z process.versions.icu); inne wersje ICU / silniki
// przegladarek: NIE_ZMIERZONO.

const LOCALES = [
  'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'pl', 'pl-PL', 'de', 'de-AT', 'de-CH', 'fr', 'fr-CA',
  'es', 'es-MX', 'it', 'pt', 'pt-BR', 'nl', 'sv', 'da', 'nb', 'nn', 'fi', 'is', 'cs', 'sk', 'sl', 'hr',
  'sr', 'bs', 'hu', 'ro', 'bg', 'ru', 'uk', 'be', 'el', 'tr', 'az', 'lt', 'lv', 'et', 'ca', 'eu', 'gl',
  'mt', 'sq', 'vi', 'id', 'ms', 'fil', 'ja', 'ko', 'zh', 'zh-TW', 'th', 'he', 'ar', 'fa', 'hi', 'bn',
  'haw', 'cy', 'ga', 'kk', 'ka', 'hy', 'mk', 'sw', 'af', 'lb',
];

const chars = [];
for (let c = 0x20; c <= 0x7e; c++) chars.push(String.fromCharCode(c));

// pary: wszystkie pary pojedynczych znakow i napisow typu id gry + deterministyczna probka par
// dwuznakowych (LCG, ziarno stale)
const ids = ['city0', 'city1', 'city2', 'city10', 'city11', 'city100', 'unit1', 'unit10', 'unit9',
  'Unit1', 'unit_1', 'unit-1', 'prod_a', 'prod_B', 'Prod_a', 'a', 'A', 'b', 'B', 'z', 'Z'];
const base = [...chars, ...ids];
const pairs = [];
for (const a of base) for (const b of base) pairs.push([a, b]);
let seed = 12345;
const rnd = () => {
  seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
  return seed;
};
const two = () => chars[rnd() % chars.length] + chars[rnd() % chars.length];
for (let i = 0; i < 20000; i++) pairs.push([two(), two()]);

function sign(x) {
  return x < 0 ? -1 : x > 0 ? 1 : 0;
}

function table(loc) {
  const out = [];
  for (const [a, b] of pairs) out.push(sign(a.localeCompare(b, loc)));
  return out;
}

// id-ksztalty prawdziwej gry (pin edb8fb56): 'city'+n (cities.ts:1249), 'prod_'+tura+'_'+miasto+'_'+base36
// (main.ts:3932), 'barb_...' (main.ts:35454), 'barbcity_...' (main.ts:35529), 'synth_'+n+'_'+nazwa (main.ts:30326)
const gameIds = [];
for (let n = 0; n < 130; n++) gameIds.push('city' + n);
const b36 = () => (rnd() >>> 0).toString(36) + (rnd() >>> 0).toString(36).slice(0, 4);
for (let i = 0; i < 150; i++) gameIds.push(`prod_${rnd() % 400}_city${rnd() % 40}_${b36()}`);
for (let i = 0; i < 60; i++) gameIds.push(`barb_${rnd() % 400}_${rnd() % 30}_${b36()}`);
for (let i = 0; i < 40; i++) gameIds.push(`barbcity_${rnd() % 400}_${rnd() % 30}_${b36()}`);
for (let i = 0; i < 20; i++) gameIds.push(`synth_${i}_${['Wojownik', 'Lucznik', 'Katapulta', 'Zwiadowca'][i % 4]}`);
const idPairs = [];
for (const a of gameIds) for (const b of gameIds) idPairs.push([a, b]);

function idTable(loc) {
  const out = [];
  for (const [a, b] of idPairs) out.push(sign(a.localeCompare(b, loc)));
  return out;
}

const ref = table('en-US');
const idRef = idTable('en-US');
const total = ref.length;
console.log(`# node ${process.version}, ICU ${process.versions.icu}, domyslna lokalizacja procesu: ${new Intl.Collator().resolvedOptions().locale}`);
console.log(`# pary na lokalizacje: ${total} (${base.length}x${base.length} pelnych + 20000 losowych dwuznakowych)`);
console.log(`# pary id-ksztaltow gry na lokalizacje: ${idPairs.length} (${gameIds.length} id)`);
console.log('# lokalizacja\tobsluzona_przez_ICU\troznice_ASCII_vs_en-US\troznice_id_gry_vs_en-US\tprzyklady_ASCII');
const idDiffering = [];
let supported = 0;
const differing = [];
for (const loc of LOCALES) {
  const resolved = Intl.Collator.supportedLocalesOf([loc]).length > 0;
  const t = table(loc);
  let diff = 0;
  const samples = [];
  for (let i = 0; i < total; i++) {
    if (t[i] !== ref[i]) {
      diff++;
      if (samples.length < 3) {
        const [a, b] = pairs[i];
        samples.push(`${JSON.stringify(a)} vs ${JSON.stringify(b)}: en-US=${ref[i]} ${loc}=${t[i]}`);
      }
    }
  }
  const it = idTable(loc);
  let idDiff = 0;
  for (let i = 0; i < idRef.length; i++) if (it[i] !== idRef[i]) idDiff++;
  if (resolved) supported++;
  if (diff > 0) differing.push(loc);
  if (idDiff > 0) idDiffering.push(`${loc}(${idDiff})`);
  console.log(`${loc}\t${resolved ? 'tak' : 'nie'}\t${diff}\t${idDiff}\t${samples.join(' | ')}`);
}
console.log(`# lokalizacji obsluzonych: ${supported}/${LOCALES.length}; ASCII rozne od en-US: ${differing.length} [${differing.join(', ')}]`);
console.log(`# id-ksztalty gry rozne od en-US: ${idDiffering.length} [${idDiffering.join(', ')}]`);
