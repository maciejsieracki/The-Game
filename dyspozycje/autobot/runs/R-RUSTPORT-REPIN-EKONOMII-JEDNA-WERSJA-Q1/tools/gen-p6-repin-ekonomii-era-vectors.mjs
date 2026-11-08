// Generator wektorow R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1 (r5, czesc C): `tileYield(WorkedTile)` z epoka
// wlasciciela (`wlascicielEra`) z URUCHOMIONEGO weba (hybrid2 = 331ef699b + terrain-improvements.ts z origin/main 247f1ef2a,
// patrz mk-hybrid2-r5.sh). Siatka: teren x nakladka x rzeka x zestaw ulepszen x epoka (undefined,0,1,1.5,2,2.5,3,4;
// N-1/N/N+1 wokol epok 2 i 3 oraz wartosci spoza zbioru {2,3}).
// Uzycie: node gen-p6-repin-ekonomii-era-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_JSON> <WEB_REF>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outJson, webRef] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outJson || !webRef) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_JSON> <WEB_REF>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', webRef], { encoding: 'utf8' }).trim();
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);
const game = join(workDir, 'gra/src/game');
const esbuild = await import(pathToFileURL(esbuildMain).href);
const built = await esbuild.build({
  stdin: { contents: "export { tileYield } from './economy';", resolveDir: game, loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
});
const bundle = join(workDir, 'bundle.mjs');
writeFileSync(bundle, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundle).href);

const enc = (x) => ({ f: Object.is(x, -0) ? '-0' : String(x) });
const TEREN = ['laka', 'rownina', 'wzgorza', 'gory', 'polarny'];
const NAK = ['brak', 'las'];
const IMPS = [[], ['farma'], ['farma', 'irygacja'], ['farma', 'bydlo'], ['tartak'], ['kopalnia_miedzi'], ['kopalnia_zelaza'], ['glinianka'], ['droga'], ['kopalnia_zlota'], ['stadnina']];
const ERAS = [undefined, 0, 1, 1.5, 2, 2.5, 3, 4];
const cases = [];
for (const teren of TEREN) for (const nakladka of NAK) for (const maRzeke of [false, true]) for (const keys of IMPS) for (const era of ERAS) {
  const tile = { terenBazowy: teren, nakladka, maRzeke };
  if (keys.length) { tile.ulepszenieKey = keys[0]; tile.ulepszeniaKeys = keys.slice(); }
  if (era !== undefined) tile.wlascicielEra = era;
  const y = W.tileYield(tile);
  cases.push({
    in: { teren, nakladka, maRzeke, keys: keys.length ? keys : null, era: era === undefined ? { u: true } : enc(era) },
    out: { zywnosc: enc(y.zywnosc), praca: enc(y.praca), handel: enc(y.handel), drewno: enc(y.drewno), kamien: enc(y.kamien), glina: enc(y.glina), ruda: enc(y.ruda ?? 0), ruda_zelaza: enc(y.ruda_zelaza ?? 0) },
  });
}
writeFileSync(outJson, JSON.stringify({ pin: PIN, cases }));
console.log('cases', cases.length, 'pin', PIN);
