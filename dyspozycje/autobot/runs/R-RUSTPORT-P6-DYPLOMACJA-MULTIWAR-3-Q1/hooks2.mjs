import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ts = require('/opt/node22/lib/node_modules/typescript/lib/typescript.js');
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (e) {
    if (context.parentURL && (specifier.startsWith('.') || specifier.startsWith('/'))) {
      try { return await next(specifier + '.ts', context); } catch { /* fall through */ }
    }
    throw e;
  }
}
export async function load(url, context, next) {
  if (url.endsWith('.json')) {
    const src = fs.readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: `export default ${src};`, shortCircuit: true };
  }
  if (url.endsWith('.ts')) {
    const src = fs.readFileSync(fileURLToPath(url), 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: false, isolatedModules: true } });
    return { format: 'module', source: out.outputText, shortCircuit: true };
  }
  return next(url, context);
}
