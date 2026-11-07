#!/usr/bin/env node
// R-RUSTPORT-REPIN-WEB-RENDER-3-Q1: weryfikator zakresu REPIN renderu 3D-3 (tylko odczyt).
//
// Sprawdza (repo = katalog nadrzędny git):
//   C1  frontend-v2 nie ma warstwy render 3D: brak src/render/**, brak importu 'three' w src/**,
//       brak zależności three w package.json — więc zmiany gra/src/render/** NIE mają celu w
//       allowliście frontend-v2 (cel = rust-port/renderer, P5-REPIN-WEB-RENDER-3.md §1).
//   C2  blob SHA plików webu w bazie i celu = tools/repin-render3-scope.json (zakres nie dryfuje);
//       oraz git diff --name-only base..target -- gra/src/render = dokładnie lista manifestu.
//       Gdy ref webu niedostępny lokalnie -> SKIP (jawnie), nie PASS.
//   C3  kotwice luk w rust-port/renderer (L1 pixel_ratio_max medium 1.5, L2 non-indexed merge)
//       nadal obecne — jeżeli luka zostanie zamknięta w Rust, weryfikator to zgłosi (aktualizacja planu).
//
// Użycie: node tools/verify-repin-render3-scope.mjs [--self-test]
// --self-test: mutacje manifestu/kotwic w pamięci; każda MUSI dać FAIL (wynik: zabite/razem).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fe = resolve(here, '..');
const repo = resolve(fe, '..', '..');
const manifest = JSON.parse(readFileSync(join(here, 'repin-render3-scope.json'), 'utf8'));

function git(args) {
  try {
    return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(n)) out.push(p);
  }
  return out;
}

/** Zwraca listę błędów (pusta = OK) i listę pominięć. */
export function verify(m, env) {
  const errs = [];
  const skips = [];
  // C1
  if (env.hasRenderDir) errs.push('C1: src-tauri/frontend-v2/src/render istnieje');
  if (env.threeImports.length) errs.push(`C1: import three w ${env.threeImports.join(', ')}`);
  if (env.threeDep) errs.push('C1: zależność three w package.json');
  // C2
  const baseOk = env.blob(m.webBase, 'gra/src/render/units.ts') !== undefined;
  const targetOk = env.blob(m.webTarget, 'gra/src/render/units.ts') !== undefined;
  if (!baseOk || !targetOk) {
    skips.push('C2: ref webu niedostępny (git fetch origin main)');
  } else {
    for (const f of m.files) {
      const b = env.blob(m.webBase, f.path) ?? null;
      const t = env.blob(m.webTarget, f.path) ?? null;
      if (b !== f.base) errs.push(`C2: ${f.path} base ${b} != ${f.base}`);
      if (t !== f.target) errs.push(`C2: ${f.path} target ${t} != ${f.target}`);
    }
    const changed = env.changed(m.webBase, m.webTarget).slice().sort();
    const listed = m.files.map((f) => f.path).sort();
    if (JSON.stringify(changed) !== JSON.stringify(listed)) {
      errs.push(`C2: diff --name-only != manifest (${changed.length} vs ${listed.length})`);
    }
  }
  // C3
  for (const a of m.rustAnchors) {
    const src = env.read(a.path);
    if (src == null) { errs.push(`C3: brak ${a.path}`); continue; }
    const i = src.indexOf(a.contains);
    if (i < 0) { errs.push(`C3: ${a.path}: brak kotwicy "${a.contains}"`); continue; }
    if (a.then) {
      const tail = src.slice(i, i + 400);
      if (!tail.includes(a.then)) errs.push(`C3: ${a.path}: po kotwicy brak "${a.then}" (luka zamknięta? zaktualizuj plan)`);
    }
  }
  return { errs, skips };
}

function realEnv() {
  const srcDir = join(fe, 'src');
  const threeImports = walk(srcDir)
    .filter((p) => /from\s+['"]three['"]|import\(\s*['"]three['"]\s*\)|require\(\s*['"]three['"]\s*\)/.test(readFileSync(p, 'utf8')))
    .map((p) => p.slice(repo.length + 1));
  const pkg = JSON.parse(readFileSync(join(fe, 'package.json'), 'utf8'));
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  return {
    hasRenderDir: existsSync(join(srcDir, 'render')),
    threeImports,
    threeDep: Object.keys(deps).some((d) => d === 'three' || d.startsWith('@types/three')),
    blob: (ref, path) => {
      const r = git(['rev-parse', '-q', '--verify', `${ref}:${path}`]);
      if (r) return r;
      // rozróżnienie: brak ref (undefined) vs brak pliku w ref (null)
      return git(['rev-parse', '-q', '--verify', `${ref}^{commit}`]) ? null : undefined;
    },
    changed: (a, b) => (git(['diff', '--name-only', a, b, '--', 'gra/src/render']) ?? '').split('\n').filter(Boolean),
    read: (p) => { const f = join(repo, p); return existsSync(f) ? readFileSync(f, 'utf8') : null; },
  };
}

function selfTest(env) {
  const clone = () => JSON.parse(JSON.stringify(manifest));
  const muts = [
    ['base SHA zmieniony', (m) => { m.files[0].base = '0'.repeat(40); return [m, env]; }],
    ['target SHA zmieniony', (m) => { m.files[8].target = '0'.repeat(40); return [m, env]; }],
    ['nowy plik oznaczony jako istniejący w bazie', (m) => { m.files[1].base = m.files[1].target; return [m, env]; }],
    ['plik usunięty z manifestu', (m) => { m.files.pop(); return [m, env]; }],
    ['plik obcy dodany do manifestu', (m) => { m.files.push({ path: 'gra/src/render/fogDim.ts', base: null, target: null }); return [m, env]; }],
    ['kotwica L1 inna wartość', (m) => { m.rustAnchors[0].then = 'pixel_ratio_max: 2.0,'; return [m, env]; }],
    ['kotwica L2 nieistniejąca', (m) => { m.rustAnchors[1].contains = 'ONE indexed mesh'; return [m, env]; }],
    ['plik kotwicy nieistniejący', (m) => { m.rustAnchors[0].path = 'rust-port/renderer/src/core/brak.rs'; return [m, env]; }],
    ['render dir w frontend-v2', (m) => [m, { ...env, hasRenderDir: true }]],
    ['import three w src', (m) => [m, { ...env, threeImports: ['x.ts'] }]],
    ['zależność three', (m) => [m, { ...env, threeDep: true }]],
    ['zmieniony diff webu', (m) => [m, { ...env, changed: (a, b) => env.changed(a, b).slice(1) }]],
  ];
  let killed = 0;
  for (const [name, f] of muts) {
    const [m, e] = f(clone());
    const { errs } = verify(m, e);
    const ok = errs.length > 0;
    if (ok) killed++;
    console.log(`${ok ? 'ZABITY ' : 'PRZEŻYŁ'}  ${name}${ok ? '' : ''}`);
  }
  console.log(`self-test: ${killed}/${muts.length}`);
  return killed === muts.length;
}

const env = realEnv();
if (process.argv.includes('--self-test')) {
  const base = verify(manifest, env);
  if (base.errs.length || base.skips.length) {
    console.error('self-test wymaga czystego przebiegu bazowego (C2 bez SKIP):', [...base.errs, ...base.skips].join('; '));
    process.exit(2);
  }
  process.exit(selfTest(env) ? 0 : 1);
}
const { errs, skips } = verify(manifest, env);
for (const s of skips) console.log(`SKIP ${s}`);
for (const e of errs) console.log(`FAIL ${e}`);
console.log(errs.length ? `verify-repin-render3-scope: FAIL (${errs.length})` : `verify-repin-render3-scope: OK (${manifest.files.length} plików webu, ${manifest.rustAnchors.length} kotwic Rust${skips.length ? ', C2 SKIP' : ''})`);
process.exit(errs.length ? 1 : 0);
