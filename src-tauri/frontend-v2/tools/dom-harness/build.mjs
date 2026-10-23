/**
 * build.mjs — pakowanie modułów (frontend-v2 i pin web) do ESM dla Node + jsdom (harness P5.2).
 *
 * Używa `esbuild` (zależność dev, ta sama wersja 0.21.5 co wewnętrzny esbuild Vite 5.4.21 — bez nowej
 * paczki w drzewie). Emuluje dwie funkcje Vite, których używają moduły UI:
 *   - `import x from './plik?raw'`            → treść pliku jako string;
 *   - `import.meta.glob('wzorzec', {eager, import:'default'[, query:'?raw']})` → obiekt
 *     { ścieżka: string }: dla `?raw` treść pliku, dla obrazów `data:<mime>;base64,…` (odpowiednik
 *     `assetsInlineLimit` builda web — porównujemy BAJTY obrazu, nie nazwę pliku z hashem).
 * Identyczna emulacja dla obu stron → różnice DOM pochodzą wyłącznie z kodu modułów.
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, extname } from 'node:path';

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function globToRegex(pattern) {
  let rx = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*' && pattern[i + 2] === '/') {
      rx += '(?:.*/)?';
      i += 2;
    } else if (c === '*') rx += '[^/]*';
    else if ('.+?^${}()|[]\\'.includes(c)) rx += '\\' + c;
    else rx += c;
  }
  return new RegExp('^' + rx + '$');
}

/** Rozwija `import.meta.glob(...)` w treści pliku `file` do literału obiektu. */
export function expandGlobs(src, file) {
  return src.replace(/import\.meta\.glob\(\s*(['"])([^'"]+)\1\s*,\s*\{([^}]*)\}\s*\)/g, (_m, _q, pattern, opts) => {
    const raw = /\?raw/.test(opts);
    const base = dirname(file);
    const fixed = pattern.split('*')[0];
    const root = resolve(base, fixed.slice(0, fixed.lastIndexOf('/') + 1) || '.');
    const rx = globToRegex(pattern);
    const entries = [];
    for (const abs of walk(root).sort()) {
      let rel = relative(base, abs).split('\\').join('/');
      if (!rel.startsWith('.')) rel = './' + rel;
      if (!rx.test(rel)) continue;
      const buf = readFileSync(abs);
      const val = raw
        ? buf.toString('utf8')
        : `data:${MIME[extname(abs).toLowerCase()] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`;
      entries.push(`${JSON.stringify(rel)}: ${JSON.stringify(val)}`);
    }
    return `({${entries.join(',\n')}})`;
  });
}

const THREE_STUB = new URL('./three-stub.cjs', import.meta.url).pathname;

const vitePlugin = {
  name: 'vite-emul',
  setup(b) {
    // Tylko strona pin: `three` → atrapa (frontend-v2 nie importuje `three`, brama check).
    b.onResolve({ filter: /^three(\/.*)?$/ }, () => ({ path: THREE_STUB }));
    // P5.7 r3 (`bundle(..., { alias })`, harness `run-cityux.mjs`): import względny rozwiązany do `from` (ścieżka
    // bezwzględna bez rozszerzenia) → plik `to` (atrapa modułu po stronie pinu — izolacja ramki od `cityPanel.ts`).
    // Domyślnie (`alias` puste — inne harnessy) brak efektu.
    b.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (aliases.length === 0) return undefined;
      const abs = resolve(args.resolveDir, args.path).replace(/\.ts$/, '');
      const hit = aliases.find((x) => x.from === abs);
      return hit ? { path: hit.to } : undefined;
    });
    b.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw',
    }));
    b.onLoad({ filter: /.*/, namespace: 'raw' }, (args) => ({ contents: readFileSync(args.path, 'utf8'), loader: 'text' }));
    // P5.5 (`mainMenu.ts:20`): `import x from './plik.png?url'` → `data:<mime>;base64,…` (jak obrazy w `import.meta.glob`:
    // porównujemy BAJTY obrazu, nie nazwę pliku z hashem builda).
    b.onResolve({ filter: /\?url$/ }, (args) => ({
      path: resolve(args.resolveDir, args.path.replace(/\?url$/, '')),
      namespace: 'url',
    }));
    // P5.7 r2 (`bundle(..., { urlAsHash: true })`, harness `run-newgame.mjs`): zamiast base64 — `data:<mime>;sha256,<skrót
    // bajtów>`. Te same bajty ⇔ ten sam skrót (porównanie bajtów zachowane), a 2 MB obrazu nie jest parsowane przy
    // każdym renderze kreatora (koszt czasu jsdom). Domyślnie (inne harnessy) bez zmian.
    b.onLoad({ filter: /.*/, namespace: 'url' }, (args) => {
      const mime = MIME[extname(args.path).toLowerCase()] ?? 'application/octet-stream';
      const buf = readFileSync(args.path);
      const url = urlAsHash ? `data:${mime};sha256,${createHash('sha256').update(buf).digest('hex')}` : `data:${mime};base64,${buf.toString('base64')}`;
      return { contents: `export default ${JSON.stringify(url)};`, loader: 'js' };
    });
    b.onLoad({ filter: /\.ts$/ }, (args) => {
      const src = readFileSync(args.path, 'utf8');
      if (!src.includes('import.meta.glob')) return undefined;
      return { contents: expandGlobs(src, args.path), loader: 'ts', resolveDir: dirname(args.path) };
    });
  },
};

/** Pakuje `entries` (ścieżki .ts) do `outdir` jako ESM ze wspólnymi chunkami (jedna instancja stanu modułów). */
let urlAsHash = false;
let aliases = [];
export async function bundle(entries, outdir, { external = [], urlAsHash: hashUrls = false, alias = [] } = {}) {
  urlAsHash = hashUrls;
  aliases = alias;
  await build({
    entryPoints: entries,
    outdir,
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    write: true,
    logLevel: 'error',
    external,
    define: { 'import.meta.env': '{"DEV":false,"PROD":true,"MODE":"production","BASE_URL":"./"}' },
    plugins: [vitePlugin],
    entryNames: '[dir]/[name]',
    outbase: commonBase(entries),
  });
}

function commonBase(paths) {
  const parts = paths.map((p) => resolve(p).split('/'));
  const first = parts[0];
  let n = first.length;
  for (const p of parts) {
    let i = 0;
    while (i < n && i < p.length && p[i] === first[i]) i++;
    n = i;
  }
  return first.slice(0, n).join('/') || '/';
}
