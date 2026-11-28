'use strict';
/**
 * save-state-audit-ablation.cjs — R-WEB-SAVE-STATE-AUDIT-Q1 (tag SAVEAUDIT), ablacja B≠A
 * dla aiWonderStuckTurnsByOwner (kandydat #10 z audytu).
 *
 * Co mierzy (ZAKRES): wpływ wartości licznika na PRÓG opłacalności cudu, czyli na
 * wejście `relaxedWonderCostThreshold` z gra/src/game/ai.ts (ta sama funkcja, która
 * jest wołana w main.ts przy `progKosztX`). Porównuje:
 *   A — licznik zachowany w sesji (wartość z tury przed zapisem),
 *   B — licznik po wczytaniu (restoreGameFromSave zeruje mapę, main.ts:53108).
 * NIE mierzy całej gry: czy różnica progu zmienia decyzję cudu w konkretnej turze,
 * wymaga biegu na żywo (harness) — NIE ZMIERZONO w tej rundzie.
 *
 * Tylko odczyt kodu + czysta funkcja: bundluje ai.ts do katalogu tymczasowego (poza repo),
 * nie modyfikuje repo, nie uruchamia gry.
 *
 * Użycie (z katalogu gra/): node tools/save-state-audit-ablation.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require('esbuild');

const srcEntry = path.resolve(__dirname, '..', 'src', 'game', 'ai.ts');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'save-audit-ablation-'));
const outFile = path.join(tmpDir, 'ai.cjs');
try {
  esbuild.buildSync({
    entryPoints: [srcEntry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outFile,
    logLevel: 'error',
  });
  const ai = require(outFile);
  const relax = ai.relaxedWonderCostThreshold;
  if (typeof relax !== 'function') throw new Error('relaxedWonderCostThreshold nie jest eksportowane');

  // Maksimum (reguła właściciela 2026-11-26): stuckRelaxTurMax = 30 (domyślna z kodu,
  // config ai-params może ją nadpisać; w tej rundzie nie odczytano nadpisania).
  const MAX = 30;
  const base = 1.0; // progKosztX bazowy; wartość względna — pokazuje kształt różnicy
  const kept = 12;  // A: licznik zachowany po 12 turach utykania
  const reset = 0;  // B: licznik po wczytaniu (zerowany)

  const thrA = relax(base, kept, MAX);
  const thrB = relax(base, reset, MAX);
  console.log(`stuckRelaxTurMax=${MAX} base=${base}`);
  console.log(`A (licznik=${kept}): efektywny próg = ${thrA}`);
  console.log(`B (licznik=${reset}, po wczytaniu): efektywny próg = ${thrB}`);
  console.log(`B!=A dla progu: ${thrA !== thrB ? 'TAK' : 'NIE'}`);
  for (const t of [0, 6, 12, 18, 24, 30]) {
    console.log(`  licznik=${String(t).padStart(2)} -> próg=${relax(base, t, MAX)}`);
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
