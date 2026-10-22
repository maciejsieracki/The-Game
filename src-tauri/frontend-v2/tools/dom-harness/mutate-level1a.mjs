#!/usr/bin/env node
/**
 * mutate-level1a.mjs — kontrola czułości harnessu P5.3 (`run-level1a.mjs`): wstrzykuje po jednej
 * mutacji do modułu v2, uruchamia harness i oczekuje EXIT=1; przywraca plik bajtowo (asercja).
 *
 * Użycie: node tools/dom-harness/mutate-level1a.mjs --pin-dir <PIN_DIR>   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const pinDir = args[args.indexOf('--pin-dir') + 1];
if (!pinDir || args.indexOf('--pin-dir') < 0) {
  console.error('Użycie: node tools/dom-harness/mutate-level1a.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));

const MUTS = [
  ['L1 kropki koszar czytają poziom kuźni', 'src/ui/unitCardStatus.ts', `const softLvl = input.badges.softPath;`, `const softLvl = input.badges.armorPath;`],
  ['L2 próg chipów ścieżki', 'src/ui/unitCardStatus.ts', `if (input.badges.softPath > 0) return true;`, `if (input.badges.softPath > 1) return true;`],
  ['L3 surowiec: id zamiast etykiety z DTO', 'src/ui/diplomacyDealDisplay.ts', `const label = item.label;\n      const ic = resourceIconHtml(label, 16);`, `const label = item.id;\n      const ic = resourceIconHtml(label, 16);`],
  ['L4 „showContext=false” ignorowane', 'src/ui/diplomacyDealDisplay.ts', `if (opts.showContext === false) {`, `if (opts.showContext === undefined) {`],
  ['L5 poziom porządku stały', 'src/ui/orderPanel.ts', `return s.tierUi;`, `return 0;`],
  ['L6 rekrutacja ignoruje affordable', 'src/ui/unitRecruitCard.ts', `const canBuy = opts.canPurchase && opts.affordable;`, `const canBuy = opts.canPurchase;`],
  ['L7 formater rekrutów (tys.)', 'src/ui/unitRecruitCard.ts', `+ ' tys.';`, `+ ' tys';`],
  ['L8 klawisz 2 szturmuje bez uprawnienia', 'src/ui/siegeMapPanel.ts', `e.key === '2' && activePanel?.playerCanStorm === true`, `e.key === '2'`],
  ['L9 milicja z DTO ignorowana', 'src/ui/siegeMapPanel.ts', `const { food, garnizon, zuzycie, atrycjaNext, milicjaEst, playerCanStorm } = activePanel;`, `const { food, garnizon, zuzycie, atrycjaNext, playerCanStorm } = activePanel;\n  const milicjaEst = garnizon;`],
  ['L10 tekst panelu ataku na miasto', 'src/ui/cityAttackChoice.ts', `Wybierz sposób działania`, `Wybierz sposob dzialania`],
  ['L11 suma strat po bitwie', 'src/ui/postBattleSummary.ts', `const losses = data.atakujacy.totalDead + data.obronca.totalDead;`, `const losses = data.atakujacy.totalDead;`],
  ['L12 kolor plakietki „uśpiona”', 'src/ui/armyListHud.ts', `sentry: { text: 'uśpiona', variant: 'neutral' },`, `sentry: { text: 'uśpiona', variant: 'gold' },`],
  ['L13 plakietka stanu wyłączona', 'src/ui/armyListHud.ts', `const statusBadge = a.status ? ARMY_STATUS_BADGE[a.status] : null;`, `const statusBadge = null;`],
  ['L14 kopia bajtowa: bottomBarHud', 'src/ui/bottomBarHud.ts', `<span>Zakończ turę</span>`, `<span>Zakończ ture</span>`],
  ['L15 kopia bajtowa: battleHudTheme (kolor wroga)', 'src/ui/battleHudTheme.ts', `export const BATTLE_ENEMY_TEXT = '#e08a8a';`, `export const BATTLE_ENEMY_TEXT = '#e08a8b';`],
  ['L16 kopia bajtowa: diploUiSkin (ton proporczyka)', 'src/ui/diploUiSkin.ts', `if (t >= 4) return 'gold';`, `if (t >= 3) return 'gold';`],
  // Obrona r1 (zarzuty Evaluatora r1, noty 1–2):
  ['L17 rekrutacja: id zamiast etykiety z DTO', 'src/ui/unitRecruitCard.ts', `name.textContent = item.label;`, `name.textContent = item.id;`],
  ['L18 cityAttackChoice: legenda klawiszy (stan otwarty)', 'src/ui/cityAttackChoice.ts', `<b>2</b> = Szturm`, `<b>2</b> = Szturmm`],
  ['L19 kopia bajtowa: cityListHud — kolor plakietki stolicy', 'src/ui/cityListHud.ts', `text: 'stolica', variant: 'gold'`, `text: 'stolica', variant: 'neutral'`],
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
    const r = spawnSync('node', ['tools/dom-harness/run-level1a.mjs', '--pin-dir', pinDir], { cwd: ROOT, encoding: 'utf8' });
    const summary = r.stdout.split('\n').find((l) => l.startsWith('dom-harness-level1a:')) ?? r.stderr.slice(-300);
    const mods = r.stdout.split('\n').filter((l) => /różnice=[1-9]|asercje_v2=(\d+)\/(?!\1\b)\d+/.test(l)).map((l) => l.trim().split(/\s+/)[0]);
    const detected = r.status === 1;
    if (!detected) missed++;
    console.log(`${name}: EXIT=${r.status} ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} [${mods.join(', ')}] ${summary}`);
  } finally {
    writeFileSync(p, orig);
  }
  if (readFileSync(p, 'utf8') !== orig) throw new Error(`nie przywrócono ${rel}`);
}
console.log(`mutate-level1a: mutacji=${MUTS.length} niewykrytych=${missed} (pliki przywrócone bajtowo)`);
process.exit(missed === 0 ? 0 : 1);
