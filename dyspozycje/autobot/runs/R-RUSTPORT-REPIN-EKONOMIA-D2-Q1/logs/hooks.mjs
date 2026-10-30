// Loader hook (poza repo): pozwala node --experimental-strip-types zaladowac import JSON bez atrybutow.
// Opcjonalnie MATRIX_JSON=<plik> podmienia tresc civ-matrix.json (uzywane tylko do wektora "zero").
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function load(url, context, nextLoad) {
  if (url.endsWith('civ-matrix.json') && process.env.MATRIX_JSON) {
    const text = readFileSync(process.env.MATRIX_JSON, 'utf8');
    return { format: 'module', source: `export default ${text};`, shortCircuit: true };
  }
  if (url.endsWith('.json')) {
    const text = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: `export default ${text};`, shortCircuit: true };
  }
  return nextLoad(url, context);
}
