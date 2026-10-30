// P6.8A: wektory progu struktury obrony (buildingStructuralDefenseBonusPercent / Line) z URUCHOMIONEGO weba
// 91dc998a dla wariantow wartosci w miasto-params.json (realny, zero, ujemna, ulamek, napis, null, brak klucza).
// Kazdy wariant = osobny proces Node (loader nadpisuje miasto-params.json przez P6_8A_JSON_OVERRIDE).
// NaN nie da sie zapisac w JSON; ten przypadek (typeof !== 'number') jest pokryty wariantem napisu i null.
// Uruchomienie:
//   node ./gen-p6-8a-structural-variants.mjs <WEB_ROOT> <KATALOG_WYJSCIA>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
const here = new URL('.', import.meta.url).pathname;
const base = JSON.parse(readFileSync(join(webRoot, 'gra/data/miasto-params.json'), 'utf8'));
const KEY = 'bonus_obrona_mur_proc';

// name -> funkcja budujaca caly obiekt miasto-params.json dla wariantu
const variants = {
  realny: (m) => m,
  zero: (m) => ({ ...m, [KEY]: { ...m[KEY], wartosc: 0 } }),
  ujemna: (m) => ({ ...m, [KEY]: { ...m[KEY], wartosc: -5 } }),
  ulamek: (m) => ({ ...m, [KEY]: { ...m[KEY], wartosc: 12.5 } }),
  napis: (m) => ({ ...m, [KEY]: { ...m[KEY], wartosc: '12' } }),
  null: (m) => ({ ...m, [KEY]: { ...m[KEY], wartosc: null } }),
  brak: (m) => {
    const o = { ...m };
    delete o[KEY];
    return o;
  },
};

for (const [name, build] of Object.entries(variants)) {
  const env = {
    ...process.env,
    P6_8A_VARIANT: name,
    P6_8A_JSON_OVERRIDE: JSON.stringify({ 'miasto-params.json': build(base) }),
  };
  execFileSync(
    process.execPath,
    [
      '--experimental-transform-types',
      '--no-warnings',
      '--import',
      join(here, 'repin-b-loader-register.mjs'),
      join(here, 'gen-p6-8a-upgrades-pending-vectors.mjs'),
      webRoot,
      outDir,
    ],
    { env, stdio: 'inherit' },
  );
}
console.log('structural variants done');
