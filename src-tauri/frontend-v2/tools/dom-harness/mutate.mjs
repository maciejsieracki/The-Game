#!/usr/bin/env node
/**
 * mutate.mjs — kontrola czułości harnessu P5.2: wstrzykuje po jednej mutacji do modułu v2,
 * uruchamia `run.mjs` i oczekuje EXIT=1 (wykryta różnica); przywraca plik bajtowo (asercja).
 *
 * Użycie: node tools/dom-harness/mutate.mjs --pin-dir <PIN_DIR>   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const pinDir = args[args.indexOf('--pin-dir') + 1];
if (!pinDir || args.indexOf('--pin-dir') < 0) {
  console.error('Użycie: node tools/dom-harness/mutate.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));

const MUTS = [
  ['M1 tekst nagłówka panelu PW', 'src/ui/diplomacyAcceptanceBalance.ts', `'>Punkty wymiany</span>'`, `'>Punkty Wymiany</span>'`],
  ['M2 kolejność epok portretów', 'src/ui/leaderPortraits.ts', `['kamien', 'braz', 'zelazo', 'antyk']`, `['braz', 'kamien', 'zelazo', 'antyk']`],
  ['M3 ikona bez wiersza UnitDef czyta mapę „z wierszem”', 'src/ui/icons/brandAssets.ts', `u !== undefined);`, `true);`],
  ['M4 klasa przycisku victoryScreen', 'src/ui/victoryScreen.ts', `class="vsc-btn-primary"`, `class="vsc-btn-primary x"`],
  ['M5 domyślna liczba faz overlay', 'src/ui/mapLoadingOverlay.ts', `phaseTotal ?? staticCatalog().constants.mapGenPhaseTotal`, `phaseTotal ?? 9`],
  ['M6 stempel builda w raporcie', 'src/ui/perfReport.ts', '`Stempel builda: ${perfDiagnostics().buildStamp}`', '`Stempel builda: ${perfDiagnostics().buildStamp}!`'],
  ['M7 wiersz lokalny traktowany jak zapis z dysku', 'src/ui/saveLoadDialog.ts', `const isFsa = s.slotId.startsWith(FSA_SLOT_PREFIX);`, `const isFsa = true;`],
  ['M8 jasność mgły explored na minimapie', 'src/ui/minimapHud.ts', `ctx.globalAlpha = staticCatalog().constants.fogExploredBrightness;`, `ctx.globalAlpha = 0.3;`],
  ['M9 akceptacja traktatu odwrócona', 'src/ui/diplomacyAcceptanceBalance.ts', `const accepted = preview.accepted;\n  const balancePn = preview.balancePn;\n  const balCls`, `const accepted = !preview.accepted;\n  const balancePn = preview.balancePn;\n  const balCls`],
  ['M10 próg fair min koszyka', 'src/ui/diplomacyAcceptanceBalance.ts', `const previewFairMin = preview.fairMinPn;`, `const previewFairMin = preview.fairMinPn + 1;`],
  ['M11 etykieta Mocy', 'src/ui/power-labels.ts', `return staticCatalog().labels.powerHudLabelPl || MOC_LABEL_PL;`, `return MOC_LABEL_PL;`],
  ['M12 nazwa nowego ulepszenia', 'src/ui/improvementBuildConfirm.ts', `const newLabel = impact.newLabel;`, `const newLabel = _newKey;`],
  ['M13 próg dominacji', 'src/ui/victoryScreen.ts', `Math.round(staticCatalog().constants.progDominacjiPower * 100)`, `Math.round(0.6 * 100)`],
  ['M14 lista jednostek technologii', 'src/ui/techUnlockParse.ts', `.filter(u => u.Tech === techName)`, `.filter(u => u.Tech !== techName)`],
];

let missed = 0;
for (const [name, rel, a, b] of MUTS) {
  const p = resolve(ROOT, rel);
  const orig = readFileSync(p, 'utf8');
  const count = orig.split(a).length - 1;
  if (count !== 1) {
    console.log(`${name}: BŁĄD wzorzec występuje ${count}×`);
    missed++;
    continue;
  }
  try {
    writeFileSync(p, orig.replace(a, b));
    const r = spawnSync('node', ['tools/dom-harness/run.mjs', '--pin-dir', pinDir], { cwd: ROOT, encoding: 'utf8' });
    const summary = r.stdout.split('\n').find((l) => l.startsWith('dom-harness:')) ?? r.stderr.slice(-300);
    const mods = r.stdout.split('\n').filter((l) => /różnice=[1-9]/.test(l)).map((l) => l.trim().split(/\s+/)[0]);
    const detected = r.status === 1;
    if (!detected) missed++;
    console.log(`${name}: EXIT=${r.status} ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} [${mods.join(', ')}] ${summary}`);
  } finally {
    writeFileSync(p, orig);
  }
  if (readFileSync(p, 'utf8') !== orig) throw new Error(`nie przywrócono ${rel}`);
}
console.log(`mutate: mutacji=${MUTS.length} niewykrytych=${missed} (pliki przywrócone bajtowo)`);
process.exit(missed === 0 ? 0 : 1);
