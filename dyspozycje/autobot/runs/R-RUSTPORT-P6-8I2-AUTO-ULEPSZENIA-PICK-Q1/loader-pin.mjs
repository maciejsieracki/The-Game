// P6.8I2: lekki loader modulow TS z PINA 91dc998a (transpilacja TS->CJS w pamieci, bez buildu gra/).
// Rozwiazuje importy wzglednie wzgledem drzewa pina (git show), JSON czyta z pina,
// pakiety zewnetrzne (three, DOM itp.) sa stubami - tylko do wektorow, nie do logiki pickera.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { posix } from 'node:path';

export const PIN = '91dc998a';
const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: new URL('.', import.meta.url).pathname, encoding: 'utf8',
}).trim();
const ts = createRequire(import.meta.url)('typescript');

function gitShow(path) {
  try {
    return execFileSync('git', ['show', `${PIN}:${path}`], {
      cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}
const stub = new Proxy(function () {}, {
  get: (_t, p) => (p === Symbol.toPrimitive ? () => '' : p === 'then' ? undefined : stub),
  apply: () => stub,
  construct: () => stub,
});

export function loadPin(entry) {
  const moduleCache = new Map();
  function load(realPath) {
    if (moduleCache.has(realPath)) return moduleCache.get(realPath).exports;
    if (realPath.endsWith('.json')) {
      const text = gitShow(realPath);
      if (text === null) throw new Error(`brak JSON w pinie: ${realPath}`);
      return JSON.parse(text);
    }
    const src = gitShow(realPath);
    if (src === null) throw new Error(`brak modulu w pinie: ${realPath}`);
    const js = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const mod = { exports: {} };
    moduleCache.set(realPath, mod);
    const req = (spec) => {
      if (!spec.startsWith('.')) return stub;
      const target = posix.normalize(posix.join(posix.dirname(realPath), spec));
      if (target.endsWith('.json')) return load(target);
      if (gitShow(`${target}.ts`) === null) return stub;
      return load(`${target}.ts`);
    };
    new Function('exports', 'require', 'module', js)(mod.exports, req, mod);
    return mod.exports;
  }
  return load(entry);
}
