// Loader hooks dla uruchomienia kodu weba (pin 91dc998a) w Node 22.
// (1) rozwiazuje importy bez rozszerzenia (`../units/setup` -> `setup.ts` / `index.ts`);
// (2) transpiluje .ts przez typescript.transpileModule (enum-y nie sa obslugiwane w strip-only);
// (3) dopisuje atrybut `with { type: 'json' }` do importow JSON (bez zmiany logiki modulu).
import { existsSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/opt/node22/lib/node_modules/typescript/package.json');
const ts = require('/opt/node22/lib/node_modules/typescript/lib/typescript.js');

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' && context.parentURL && specifier.startsWith('.')) {
      const p = fileURLToPath(new URL(specifier, context.parentURL));
      for (const cand of [p + '.ts', p + '/index.ts']) {
        if (existsSync(cand) && statSync(cand).isFile()) {
          return { url: pathToFileURL(cand).href, shortCircuit: true };
        }
      }
    }
    throw err;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.ts')) {
    const path = fileURLToPath(url);
    let src = readFileSync(path, 'utf8');
    src = src.replace(/(from\s+['"][^'"]+\.json['"])(?!\s*with)/g, "$1 with { type: 'json' }");
    const out = ts.transpileModule(src, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: false,
        isolatedModules: true,
        useDefineForClassFields: true,
      },
      fileName: path,
    });
    return { format: 'module', source: out.outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
