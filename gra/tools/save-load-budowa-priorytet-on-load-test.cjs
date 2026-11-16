'use strict';
/**
 * R-WEB-SAVE-LOAD-NO-DEFAULT-BUILD-PRIORITY-ON-LOAD-Q1 -- test regresji (bundle esbuild w node, bez przegladarki).
 *
 * Problem: ensureCitySaveDefaults (gra/src/game/cities.ts) przy budowaTryb === 'zrownowazone' dopisywal
 * DEFAULT_BUDOWA_PRIORYTET_TYPOW do miasta bez listy budowaPriorytetTypow. Zywa gra tej listy takim miastom nie nadaje
 * (undefined; konsumenci maja fallback). Po wczytaniu stan roznil sie wiec od zywej gry.
 *
 * Sprawdza:
 *  (1) miasto 'zrownowazone' bez listy -> po wczytaniu budowaPriorytetTypow === undefined (brak dopisania);
 *  (2) miasto 'zrownowazone' z zapisana lista -> lista zachowana (ta sama tresc po sanitize, nic nie skasowane);
 *  (3) stary zapis bez pola budowaTryb / z legacy budowaTryb 'auto' -> bez wyjatku, migracja bez zmian;
 *  (4) legacy 'priorytet' z lista tylko 'zrownowazone' -> nadal migruje do DEFAULT (pre-existing, bez zmiany zachowania);
 *  (5) MUTACJA na KOPII cities.ts (przywrocone dopisywanie listy) -> asercja (1) MUSI sie nie powiesc.
 *
 * Uruchom z gra/ (wymaga gra/node_modules: npm ci):  node tools/save-load-budowa-priorytet-on-load-test.cjs
 */

const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const CITIES_SRC = path.join(GRA, 'src', 'game', 'cities.ts');
const MUT_SRC = path.join(GRA, 'src', 'game', '.budowa-priorytet-mutant-tmp.ts');
const ORIG_BLOCK = [
  '    if (city.budowaPriorytetTypow?.length) {',
  '      city.budowaPriorytetTypow = sanitizeBudowaPriorytetTypow(city.budowaPriorytetTypow);',
  '    }',
].join('\n');
const MUT_BLOCK = [
  '    if (!city.budowaPriorytetTypow?.length) {',
  '      city.budowaPriorytetTypow = [...DEFAULT_BUDOWA_PRIORYTET_TYPOW];',
  '    } else {',
  '      city.budowaPriorytetTypow = sanitizeBudowaPriorytetTypow(city.budowaPriorytetTypow);',
  '    }',
].join('\n');

let pass = 0;
let fail = 0;
async function check(name, fn) {
  try { await fn(); pass++; console.log('PASS: ' + name); }
  catch (e) { fail++; console.log('FAIL: ' + name + ' -- ' + String(e.message || e).split('\n')[0]); }
}

/** Bundluje modul cities.ts (z podanej sciezki zrodlowej) do CJS i zwraca eksporty. */
async function bundleCities(srcPath, tag) {
  const entry = path.join(__dirname, `.budowa-priorytet-${tag}-entry.ts`);
  const outfile = path.join(__dirname, `.budowa-priorytet-${tag}-bundle.cjs`);
  const importPath = path.relative(__dirname, srcPath).replace(/\\/g, '/').replace(/\.ts$/, '');
  fs.writeFileSync(entry, `export { ensureCitySaveDefaults, DEFAULT_BUDOWA_PRIORYTET_TYPOW } from '${importPath.startsWith('.') ? importPath : './' + importPath}';\n`, 'utf8');
  try {
    await esbuild.build({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile,
      absWorkingDir: GRA, logLevel: 'silent',
    });
    return require(outfile);
  } finally {
    fs.rmSync(entry, { force: true });
    fs.rmSync(outfile, { force: true });
  }
}

/** Minimalne miasto z zapisu (pola wymagane przez ensureCitySaveDefaults; reszta nieistotna). */
function cityFromSave(overrides) {
  return { id: 1, name: 'Testowe', ...overrides };
}

async function main() {
  const src = fs.readFileSync(CITIES_SRC, 'utf8');
  const api = await bundleCities(CITIES_SRC, 'main');

  await check('(1) zrownowazone bez listy -> po wczytaniu budowaPriorytetTypow pozostaje undefined', async () => {
    const c = cityFromSave({ budowaTryb: 'zrownowazone' });
    api.ensureCitySaveDefaults(c);
    assert.equal(c.budowaTryb, 'zrownowazone');
    assert.equal(c.budowaPriorytetTypow, undefined, 'lista dopisana przy wczytaniu: ' + JSON.stringify(c.budowaPriorytetTypow));
  });

  await check('(2) zrownowazone z zapisana lista -> lista zachowana (po sanitize)', async () => {
    const c = cityFromSave({ budowaTryb: 'zrownowazone', budowaPriorytetTypow: ['wojsko'] });
    api.ensureCitySaveDefaults(c);
    assert.deepEqual(c.budowaPriorytetTypow, ['wojsko']);
  });

  await check('(3) stary zapis bez budowaTryb i z legacy auto -> bez wyjatku, migracja jak dotad', async () => {
    const bez = cityFromSave({});
    api.ensureCitySaveDefaults(bez);
    assert.ok(bez.budowaTryb, 'tryb ustawiony domyslnie');
    assert.equal(bez.budowaPriorytetTypow, undefined);
    const auto = cityFromSave({ budowaTryb: 'auto' });
    api.ensureCitySaveDefaults(auto);
    assert.notEqual(auto.budowaTryb, 'auto', 'legacy auto zmigrowany');
    assert.ok(auto.budowaTryb === 'zrownowazone' || (Array.isArray(auto.budowaPriorytetTypow) && auto.budowaPriorytetTypow.length >= 1), 'migracja auto: brak listy w trybie priorytet');
  });

  await check('(4) legacy priorytet z lista tylko zrownowazone -> DEFAULT (zachowanie sprzed zmiany)', async () => {
    const c = cityFromSave({ budowaTryb: 'priorytet', budowaPriorytetTypow: ['zrownowazone'] });
    api.ensureCitySaveDefaults(c);
    assert.equal(c.budowaTryb, 'zrownowazone');
    assert.deepEqual(c.budowaPriorytetTypow, [...api.DEFAULT_BUDOWA_PRIORYTET_TYPOW]);
  });

  await check('(5a) MUTACJA: kopia cities.ts z przywroconym dopisywaniem listy istnieje i rozni sie od zrodla', async () => {
    assert.ok(src.includes(ORIG_BLOCK), 'brak oczekiwanego bloku w cities.ts: zmiana kodu wymaga aktualizacji testu');
  });

  await check('(5b) MUTACJA: przywrocone dopisywanie listy -> asercja (1) MUSI sie nie powiesc', async () => {
    const mutSrc = src.replace(ORIG_BLOCK, MUT_BLOCK);
    assert.notEqual(mutSrc, src);
    fs.writeFileSync(MUT_SRC, mutSrc, 'utf8');
    return bundleCities(MUT_SRC, 'mut').then((mut) => {
      fs.rmSync(MUT_SRC, { force: true });
      const c = cityFromSave({ budowaTryb: 'zrownowazone' });
      mut.ensureCitySaveDefaults(c);
      assert.notEqual(c.budowaPriorytetTypow, undefined, 'mutant nie dopisal listy -- test nie wykrywa regresji');
    }, (e) => { fs.rmSync(MUT_SRC, { force: true }); throw e; });
  });

  fs.rmSync(MUT_SRC, { force: true });
  console.log(`save-load-budowa-priorytet-on-load-test: ${pass} PASS / ${fail} FAIL`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
