// Loader do generatora wektorow M07A (gen-m07a-vectors.mjs). Nie zmienia logiki weba:
// (1) rozwiazuje importy bez rozszerzenia do plikow .ts; (2) importy .json jako moduly;
// (3) dopisuje na koncu gen-helpers.ts linie eksportu symboli nieeksportowanych w pinie
//     edb8fb56 (canRiverFlowThrough - partia 1; reszta - partia 2, ta sama funkcja, ten sam kod).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (e) {
    if (specifier.startsWith('.') && context.parentURL) {
      const base = new URL(specifier, context.parentURL);
      for (const cand of [`${base.href}.ts`, `${base.href}/index.ts`]) {
        if (existsSync(fileURLToPath(cand))) return { url: cand, shortCircuit: true, format: 'module-typescript' };
      }
    }
    throw e;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const source = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: `export default ${source};`, shortCircuit: true };
  }
  if (url.endsWith('/map/gen-helpers.ts')) {
    const source = readFileSync(fileURLToPath(url), 'utf8');
    return {
      format: 'module-typescript',
      source: `${source}\nexport { canRiverFlowThrough, canRiverDrainStep, isRiverDrainageGoal, inferMapDimsFromHexes, isReliefRiverSource, riverStepDir, sameRiverDir, riverHexDirDelta, reconstructRiverPath, estimateLandCentroidFromSeed, estimateLandCentroidFromMouth, scoreRiverStepTowardCentroid, scoreRiverStepTowardCenterSquare, scoreRiverStepTowardLandCenter, growRiverInlandBeforeDrainage, collectInlandDrainGrowCandidates, neighborDirIndex, signedRiverDirDelta, pathSegmentDirs, pathSignedTurnDeltas, isRiverWindowTurnAllowed, rpEnsure };\n`,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
