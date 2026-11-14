import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, next) {
  if (specifier.endsWith('.json') && context.parentURL) {
    const u = new URL(specifier, context.parentURL);
    return { url: u.href, shortCircuit: true, format: 'json', importAttributes: { type: 'json' } };
  }
  try {
    return await next(specifier, context);
  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND' && context.parentURL) {
      for (const ext of ['.ts', '/index.ts']) {
        const u = new URL(new URL(specifier, context.parentURL).href + ext);
        if (existsSync(fileURLToPath(u))) return { url: u.href, shortCircuit: true, format: 'module-typescript' };
      }
    }
    throw e;
  }
}
