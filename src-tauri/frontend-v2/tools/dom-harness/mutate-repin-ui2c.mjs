#!/usr/bin/env node
/**
 * mutate-repin-ui2c.mjs — kontrola czułości `run-repin-ui2c.mjs` (R-RUSTPORT-REPIN-UI-2-C-Q1): wstrzykuje po jednej
 * mutacji do portu (`src/ui/*`), uruchamia harness i oczekuje EXIT=1 (mutacje `tsc`: `tsc --noEmit` EXIT≠0); po każdej
 * mutacji przywraca plik i sprawdza, że bajty są identyczne z oryginałem. Mutacje obejmują każdą gałąź nowych hunków.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui2c.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>] [--from N] [--to M]
 *   → EXIT 0 ⇔ każda mutacja z zakresu wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const webDir = argOf('--web-dir');
if (!webDir) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui2c.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>] [--from N] [--to M]');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const H = 'src/ui/hud.ts';
const E = 'src/ui/empireDetailPanel.ts';
const T = 'src/ui/empireDetailTypes.ts';
const A = 'src/ui/armyStackHud.ts';
const U = 'src/ui/unitRecruitCard.ts';
/** [nazwa, plik, przed, po, tryb?] — „przed" musi wystąpić w pliku dokładnie raz; tryb 'tsc' = oczekiwany błąd typów. */
const MUTS = [
  // hud.ts
  ['H1 cn(): bez noty exact', H, 'exact: exactCompactNote(value, rate),', "exact: '',"],
  ['H2 cn(): rate pełny signedPl', H, 'rate: formatCompactSigned(rate)', 'rate: signedPl(rate)'],
  ['H3 cn(): value pełny', H, 'value: formatCompactNumber(value),', 'value: String(value),'],
  ['H4 foodHudValue: nienumeryczny → 0', H, 'return Number.isFinite(n) ? n : undefined;', 'return Number.isFinite(n) ? n : 0;'],
  ['H5 Handel: value pełny signedPl', H, 'value: formatCompactSigned(s.handelIncome ?? 0),', 'value: signedPl(s.handelIncome ?? 0),'],
  ['H6 Handel: bez exact', H, 'exact: exactCompactNote(s.handelIncome ?? 0),', ''],
  ['H7 rekruci: bez isSafeInteger', H, 'Number.isSafeInteger(s.rekrutEkw) && (s.rekrutEkw ?? 0) > 0', '(s.rekrutEkw ?? 0) > 0'],
  ['H8 rekruci: koszt != null → truthy', H, 'const recruitCostTitle = s.kosztJednostki != null', 'const recruitCostTitle = s.kosztJednostki'],
  ['H9 rekruci: etykieta bez recruitHudLabel', H, '${recruitHudLabel(rekrLabel, s.rekrutEkw)}', '${rekrLabel}'],
  ['H10 Armia: rate z ludnoscRate', H, '...cn(s.armyUnitsOnMap ?? 0, s.rekrutEkw ?? 0),', '...cn(s.armyUnitsOnMap ?? 0, s.ludnoscRate ?? 0),'],
  ['H11 Skarbiec: rate netto', H, '...cn(s.bogactwo, s.bogactwoWplywyBrutto ?? s.bogactwoRate ?? 0),', '...cn(s.bogactwo, s.bogactwoRate ?? 0),'],
  ['H12 tytuł rekrutów bez escHtml', H, 'title="${escHtml(recruitTitle)}"', 'title="${recruitTitle}"'],
  // empireDetailPanel.ts
  ['E1 formatRawCount: próg >=1000 → >1000', E, 'if (Math.abs(r) >= 1000) return formatCompactNumber(r);', 'if (Math.abs(r) > 1000) return formatCompactNumber(r);'],
  ['E2 taxForWorkAmount: +1', E, 'return Math.floor(safeWork * safeRate);', 'return Math.floor(safeWork * safeRate) + 1;'],
  ['E3 podgląd: efekt także przy tax<1', E, 'if (!withEffect || tax < 1) return base;', 'if (!withEffect) return base;'],
  ['E4 podgląd: round → floor skarb', E, '+${Math.max(0, Math.round(eff.skarb))} do Skarbca', '+${Math.max(0, Math.floor(eff.skarb))} do Skarbca'],
  ['E5 bramka canConvert pominięta', E, 'if (empireGlobalDefaultsUi.canConvertOwnerWorkToTax?.(ownerId)) {', 'if (true) {'],
  ['E6 przycisk bez disabled przy puli<1', E, "data-work-tax-submit${max < 1 ? ' disabled' : ''}", 'data-work-tax-submit'],
  ['E7 confirm także przy 0', E, 'if (amount >= 1 && tax >= 1 && !window.confirm(', 'if (!window.confirm('],
  ['E8 stawka domyślna 1 → 2', E, 'const taxRate = empireGlobalDefaultsUi.getOwnerWorkTaxRate?.(ownerId) ?? 1;', 'const taxRate = empireGlobalDefaultsUi.getOwnerWorkTaxRate?.(ownerId) ?? 2;'],
  ['E9 brak komunikatu dowódcy', E, "generalTarget.textContent = 'Brak stolicy do rekrutacji dowódcy.';", "generalTarget.textContent = '';"],
  ['E10 brak komunikatu miasta', E, 'if (!cityId || !mountCityRecruitment?.(cityId, target)) {', 'if (!cityId) {'],
  ['E11 „Idź do wodza” domyślnie: !== false → === true', E, "getRecruitFollowGeneralDefault?.() !== false ? 'checked' : ''", "getRecruitFollowGeneralDefault?.() === true ? 'checked' : ''"],
  ['E12 checkbox bez hooka zmiany', E, 'massRecruitmentUi.onRecruitFollowGeneralDefaultChange?.(rallyToggle.checked);', ''],
  ['E13 stawka obywateli = stała', E, ')?.citizenRatePerCitizen ?? CITIZEN_UPKEEP_RATE_PER_CITIZEN;\n  const zuzyciePerTyp',
    ') ? CITIZEN_UPKEEP_RATE_PER_CITIZEN : CITIZEN_UPKEEP_RATE_PER_CITIZEN;\n  const zuzyciePerTyp'],
  ['E14 „Bonus startowy” przywrócony', E, '+ `</div>${uchwalyHtml}</div>`;', '+ `<div class="civ-emp-chip wide"><div class="k">Bonus startowy</div><div class="v">${esc(g.bonusStartowy)}</div></div></div>${uchwalyHtml}</div>`;'],
  ['E15 nagłówek sekcji rekrutacji = stary', E, '<span class="civ-emp-mass-title">Rekrutacja</span>', '<span class="civ-emp-mass-title">Masowa rekrutacja</span>'],
  ['E16 podgląd input: bez clamp do max', E, "input?.addEventListener('input', () => {\n        const work = Math.max(0, Math.min(max, Math.floor(Number(input.value) || 0)));", "input?.addEventListener('input', () => {\n        const work = Math.max(0, Math.floor(Number(input.value) || 0));"],
  // empireDetailTypes.ts (tylko typy → bramka tsc)
  ['T1 pole citizenRatePerCitizen przemianowane', T, 'citizenRatePerCitizen?: number;', 'citizenRatePerCitizenX?: number;', 'tsc'],
  // armyStackHud.ts
  ['A1 identity: isGeneral === true → truthy', A, 'unit.isGeneral === true && leaderTitle', 'unit.isGeneral && leaderTitle'],
  ['A2 render: tylko Wódz jako dowódca', A, "const isCommander = c.commanderTitle === 'Wódz' || c.commanderTitle === 'Generał';", "const isCommander = c.commanderTitle === 'Wódz';"],
  ['A3 ikona split = pin', A, `+ '<path d="M12 20V12L4 4"/><path d="M10 4H4v6"/>'`, `+ '<path d="M12 12H4"/><path d="M8 8 4 12l4 4"/>'`],
  ['A4 bez ★ dowódcy', A, `'<span class="ash-card-commander-mark" aria-hidden="true">★</span>'`, "''"],
  ['A5 etykieta aria: kolejność', A, "const cardLabel = isCommander ? c.commanderTitle + ' — ' + c.name : c.name;", "const cardLabel = isCommander ? c.name + ' — ' + c.commanderTitle : c.name;"],
  ['A6 typ dowódcy bez esc', A, `<div class="ash-card-commander-type">' + esc(c.name) + '</div>'`, `<div class="ash-card-commander-type">' + c.name + '</div>'`],
  // unitRecruitCard.ts
  ['U1 nazwa bez unitLabel', U, 'name.textContent = unitLabel || item.label;', 'name.textContent = item.label;'],
  ['U2 blokady bez disabledReason', U, 'const blockedReasons = [disabledReason, manpowerMissingLabel, stockMissingLabel]', 'const blockedReasons = [manpowerMissingLabel, stockMissingLabel]'],
  ['U3 tytuł puli bez „brakuje”', U, 'return missing > 0 ? `${base} — brakuje ${formatManpower(missing)}` : base;', 'return base;'],
  ['U4 potrzebne pełną liczbą', U, 'summary.textContent = formatCompactNumber(required);', 'summary.textContent = String(required);'],
  ['U5 „brak N” pełną liczbą', U, 'shortfall.textContent = `brak ${formatCompactNumber(missing)}`;', 'shortfall.textContent = `brak ${missing}`;'],
  ['U6 koszt rekrutów także dla „0”', U, "} else if (mpCostLabel != null && mpCostLabel !== '0') {", '} else if (mpCostLabel != null) {'],
  ['U7 kolejność sub: meta przed kosztem', U, '  sub.appendChild(cost);\n  sub.appendChild(meta);', '  sub.appendChild(meta);\n  sub.appendChild(cost);'],
  ['U8 container query 300 → 320 px', U, '@container urc (max-width: 300px){', '@container urc (max-width: 320px){'],
  ['U9 przycisk bez etykiety span', U, 'btn.innerHTML = `${SUBMIT_ICON_SVG}<span class="unit-recruit-submit-label">Rekrutuj</span>`;', "btn.textContent = 'Rekrutuj';"],
  ['U10 wskaźnik rekrutów w koszcie (stary układ)', U, '  if (manpowerStatus) {\n    head.appendChild(manpowerStatus);', '  if (manpowerStatus) {\n    cost.appendChild(manpowerStatus);'],
];
const from = Number(argOf('--from') ?? 1);
const to = Number(argOf('--to') ?? MUTS.length);
let missed = 0;
let ran = 0;
for (const [idx, [name, rel, before, after, mode]] of MUTS.entries()) {
  if (idx + 1 < from || idx + 1 > to) continue;
  ran++;
  const file = join(ROOT, rel);
  const orig = readFileSync(file);
  const txt = orig.toString('utf8');
  const count = txt.split(before).length - 1;
  if (count !== 1) {
    console.error(`MUTACJA ${name}: wzorzec występuje ${count}× w ${rel} (wymagane 1)`);
    process.exit(2);
  }
  writeFileSync(file, txt.replace(before, after));
  let r;
  try {
    if (mode === 'tsc') {
      r = spawnSync(join(ROOT, 'node_modules/.bin/tsc'), ['--noEmit'], { cwd: ROOT, encoding: 'utf8', timeout: 240000 });
      r = { ...r, status: r.status !== 0 ? 1 : 0 };
    } else {
      const hArgs = ['tools/dom-harness/run-repin-ui2c.mjs', '--web-dir', webDir];
      if (argOf('--tmp-dir')) hArgs.push('--tmp-dir', argOf('--tmp-dir'));
      r = spawnSync(process.execPath, hArgs, { cwd: ROOT, encoding: 'utf8', timeout: 280000 });
    }
  } finally {
    writeFileSync(file, orig);
  }
  if (Buffer.compare(readFileSync(file), orig) !== 0) {
    console.error(`PRZYWRÓCENIE ${rel} nieudane`);
    process.exit(2);
  }
  const out = r.stdout ?? '';
  // Wykryta = EXIT 1 Z PEŁNYM PRZEBIEGIEM harnessu (linia podsumowania); błąd składni/bundla też daje 1 — to NIE jest wykrycie.
  const ok = r.status === 1 && (mode === 'tsc' || out.includes('run-repin-ui2c: '));
  if (!ok) missed++;
  const line = out.split('\n').find((l) => l.startsWith('run-repin-ui2c:')) ?? (mode === 'tsc' ? 'tsc --noEmit: błąd typów' : '');
  const where = out.split('\n').filter((l) => / różnice=[1-9]| RÓŻNY/.test(l)).map((l) => l.trim().split(/\s+/)[0] + (l.includes('PIX') ? ':' + l.trim().split(/\s+/)[1] : '')).join(',');
  console.log(`${ok ? 'WYKRYTA ' : 'PRZEŻYŁA'} #${idx + 1} ${name} (EXIT=${r.status}) ${line.replace(/ webVectorsSha256=.*/, '')}${where ? ' [' + where + ']' : ''}`);
}
console.log(`mutate-repin-ui2c: zakres=${from}-${to} mutacji=${ran} wykrytych=${ran - missed} przeżyło=${missed} (łącznie zdefiniowanych ${MUTS.length})`);
process.exitCode = missed === 0 ? 0 : 1;
