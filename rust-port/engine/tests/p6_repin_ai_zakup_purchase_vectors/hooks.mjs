import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as pres } from 'node:path';
export async function resolve(specifier, context, next) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL && !/\.(ts|mjs|js|json)$/.test(specifier)) {
    const base = pres(dirname(fileURLToPath(context.parentURL)), specifier);
    if (existsSync(base + '.ts')) return next(pathToFileURL(base + '.ts').href, context);
  }
  if (specifier.endsWith('.json') && context.parentURL) {
    return { url: pathToFileURL(pres(dirname(fileURLToPath(context.parentURL)), specifier)).href, shortCircuit: true, format: 'json-as-module' };
  }
  return next(specifier, context);
}
export async function load(url, context, next) {
  if (context.format === 'json-as-module') {
    return { format: 'module', shortCircuit: true, source: 'export default ' + readFileSync(fileURLToPath(url), 'utf8') + ';' };
  }
  return next(url, context);
}
