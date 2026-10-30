// Loader hook (poza repo): JSON jako modul, importy bez rozszerzenia (.ts / index.ts),
// transpilacja .ts/.mts przez typescript (enumy, parametry-properties).
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import tsModule from '/opt/node22/lib/node_modules/typescript/lib/typescript.js';

const ts = tsModule.default ?? tsModule;

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (context.parentURL && (specifier.startsWith('.') || specifier.startsWith('/'))) {
      const base = new URL(specifier, context.parentURL);
      const p = fileURLToPath(base);
      const cands = [p + '.ts', p + '/index.ts', p + '.mts'];
      for (const c of cands) {
        if (existsSync(c) && statSync(c).isFile()) {
          return { url: pathToFileURL(c).href, shortCircuit: true };
        }
      }
    }
    throw err;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const text = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: `export default ${text};`, shortCircuit: true };
  }
  if (url.endsWith('.ts') || url.endsWith('.mts')) {
    const text = readFileSync(fileURLToPath(url), 'utf8');
    const out = ts.transpileModule(text, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: false, experimentalDecorators: false },
      fileName: fileURLToPath(url),
    });
    return { format: 'module', source: out.outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
