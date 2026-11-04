#!/usr/bin/env node
/**
 * mutate-repin-ui2d.mjs — kontrola czułości `run-repin-ui2d.mjs` (R-RUSTPORT-REPIN-UI-2-D-Q1): kopiuje `src/` portu do
 * katalogu tymczasowego, wstrzykuje po jednej mutacji (każda gałąź/tekst nowych hunków partii UI-2-D), uruchamia harness
 * z `--src <kopia>` i oczekuje EXIT=1; plik kopii jest przywracany po każdej mutacji (asercja bajtów). Drzewo robocze
 * portu nie jest modyfikowane.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui2d.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>] [--range <od>:<do>] [--list]
 *   `--range 0:10` — mutacje o indeksach [0, 10) (podział długiego przebiegu na kilka wywołań; ~50 s na mutację).
 * EXIT 0 ⇔ każda mutacja z zakresu wykryta (EXIT harnessu = 1).
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const H = 'ui/hexContextTooltip.ts';
const P = 'ui/preBattle.ts';
const B = 'ui/buildModeHud.ts';
const BA = 'ui/entityCards/buildingAdapter.ts';
const IA = 'ui/entityCards/improvementAdapter.ts';
/** [nazwa, plik (względem src/), przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  ['H1 klasa cp-prod-line', H, '<span class="cp-magazyn-line cp-prod-line">${mag}</span>', '<span class="cp-magazyn-line">${mag}</span>'],
  ['H2 kolejność: plony przed produkcją', H, "s += `<br><span class=\"cp-magazyn-line cp-prod-line\">${mag}</span><br>→ plony miasta: ${bonus}`;", "s += ` → plony miasta: ${bonus}<br><span class=\"cp-magazyn-line cp-prod-line\">${mag}</span>`;"],
  ['H3 gałąź bez produkcji (else) pominięta', H, "  } else {\n    s += ` → plony miasta: ${bonus}`;\n  }", '  }'],
  ['H4 możliwe ulepszenia bez produkcji', H, "→ ${mag ? `${mag} · ` : ''}plony miasta:", '→ plony miasta:'],
  ['H5 nagłówek bloku terenu = stary', H, "'<div class=\"cp-yield-head\">Surowce z terenu (przy 👤)</div>'", "'<div class=\"cp-yield-head\">Do magazynu państwa</div>'"],
  ['H6 blok terenu także gdy pusty', H, 'if (terrainMagazyn.length > 0) {', 'if (terrainMagazyn.length >= 0) {'],
  ['H7 stopka = stara', H, 'Surowce z ulepszeń (Tartak, Kamieniołom…) — w wierszu produkcji przy ulepszeniu; drewno/kamień/glina z terenu — przy 👤 lub centrum.', 'Magazyn → ulepszenia (Tartak, Kamieniołom… — auto) + drewno/kamień/glina z terenu (przy 👤 lub centrum).'],
  ['H8 Generał nie jest dowódcą', H, "const isCommander = c.commanderTitle === 'Wódz' || c.commanderTitle === 'Generał';", "const isCommander = c.commanderTitle === 'Wódz';"],
  ['H9 dowódca = dowolny niepusty tytuł', H, "const isCommander = c.commanderTitle === 'Wódz' || c.commanderTitle === 'Generał';", 'const isCommander = !!c.commanderTitle;'],
  ['H10 brak aria-label/title dowódcy', H, ' data-commander="true" aria-label="${esc(cardLabel)}" title="${esc(cardLabel)}"', ' data-commander="true"'],
  ['H11 rola bez gwiazdki', H, '<div class="sp-unit-stack-commander-role">★ ${esc(c.commanderTitle!)}</div>', '<div class="sp-unit-stack-commander-role">${esc(c.commanderTitle!)}</div>'],
  ['H12 etykieta wybranej bez tytułu', H, '<b>${esc(activeName)}</b>', '<b>${esc(active.name)}</b>'],
  ['H13 CSS .commander usunięty', H, '.sp-unit-stack-card.commander{border-color:rgba(232,216,138,.78);', '.sp-unit-stack-card.commanderX{border-color:rgba(232,216,138,.78);'],
  ['H14 klasa commander na karcie', H, "${isCommander ? ' commander' : ''}", ''],
  ['P1 automaticOnly ignorowane', P, 'if (opts?.automaticOnly === true) {\n    cb.onAuto();\n    return;\n  }', ''],
  ['P2 automaticOnly bez onAuto', P, 'if (opts?.automaticOnly === true) {\n    cb.onAuto();\n    return;\n  }', 'if (opts?.automaticOnly === true) {\n    return;\n  }'],
  ['P3 automaticOnly przed kolejką odroczonych', P, '    deferredAutoRequests.push({ info, cb, opts, enqueuedAt: Date.now() });\n    return;\n  }', '    if (opts?.automaticOnly === true) { cb.onAuto(); return; }\n    deferredAutoRequests.push({ info, cb, opts, enqueuedAt: Date.now() });\n    return;\n  }'],
  ['P4 manualControlAllowed domyślnie false', P, 'const manualControlAllowed = opts?.manualControlAllowed !== false;', 'const manualControlAllowed = opts?.manualControlAllowed === true;'],
  ['P5 notka pominięta w panelu', P, '    commanderNote +\n', ''],
  ['P6 tekst notki', P, 'ale walka rozegra się automatycznie bez indywidualnego sterowania.', 'ale walka rozegra się automatycznie.'],
  ['P7 deploy bez zamknięcia', P, '    cb.onBattlefield();\n    dismiss();\n  });', '    cb.onBattlefield();\n  });'],
  ['B1 wskaźnik także w trybie ręcznym', B, 'const unspent = trybAuto ? (config.getUnspentBudgetWarning?.() ?? null) : null;', 'const unspent = config.getUnspentBudgetWarning?.() ?? null;'],
  ['B2 próg waitingHexes > 0', B, 'if (unspent && unspent.waitingHexes > 0) {', 'if (unspent && unspent.waitingHexes >= 0) {'],
  ['B3 brak liczby pól', B, '(${unspent.waitingHexes} pól czeka)', '(pola czekają)'],
  ['B4 klik bez callbacku', B, "    config.onUnspentBudgetDisableFilter?.();\n      render();\n    });", '      render();\n    });'],
  ['B5 klik bez ponownego renderu', B, "    config.onUnspentBudgetDisableFilter?.();\n      render();\n    });", '    config.onUnspentBudgetDisableFilter?.();\n    });'],
  ['B6 etykieta Zrównoważone = stara', B, "zrownowazone: 'Zrównoważone — żywność; przy niedoborze tylko brakujący surowiec; drogi na końcu',", "zrownowazone: 'Zrównoważone — żywność, surowce, infra',"],
  ['B7 CSS .civ-build-unspent usunięty', B, '.civ-build-unspent{margin:6px 0 2px;', '.civ-build-unspentX{margin:6px 0 2px;'],
  ['A1 civBonusy gubione przed Rust', BA, 'buildingCardRules(building.id, cityState)', 'buildingCardRules(building.id, { ...cityState, civBonusy: undefined })'],
  ['I1 koszt surowy zamiast skalowanego', IA, '  return scaled ?? raw;', '  return raw;'],
  ['I2 brak klucza po nazwie (kopia wiersza)', IA, '  return NAME_TO_KEY[nazwa];\n}', '  return undefined;\n}'],
  ['I3 koszt bez bramki hasValue', IA, '      value: hasValue(improvement.koszt_praca)\n        ?', '      value: true\n        ?'],
];
if (args.includes('--list')) {
  let bad = 0;
  MUTS.forEach(([name, rel, before], i) => {
    const c = readFileSync(join(ROOT, 'src', rel), 'utf8').split(before).length - 1;
    if (c !== 1) bad++;
    console.log(`${i} ${name}${c === 1 ? '' : ` — WZORZEC ${c}×`}`);
  });
  process.exit(bad === 0 ? 0 : 2);
}
const webDir = argOf('--web-dir');
if (!webDir) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui2d.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>] [--range od:do] [--list]');
  process.exit(2);
}
const [from, to] = (argOf('--range') ?? `0:${MUTS.length}`).split(':').map(Number);
const work = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'mut-ui2d-'));
const SRC = join(work, 'src');
cpSync(join(ROOT, 'src'), SRC, { recursive: true });
let missed = 0;
let n = 0;
try {
  for (let i = from; i < Math.min(to, MUTS.length); i++) {
    const [name, rel, before, after] = MUTS[i];
    const file = join(SRC, rel);
    const orig = readFileSync(file);
    const txt = orig.toString('utf8');
    const count = txt.split(before).length - 1;
    if (count !== 1) {
      console.error(`MUTACJA ${name}: wzorzec występuje ${count}× w ${rel} (wymagane 1)`);
      process.exitCode = 2;
      break;
    }
    writeFileSync(file, txt.replace(before, after));
    let r;
    try {
      const hArgs = ['tools/dom-harness/run-repin-ui2d.mjs', '--web-dir', webDir, '--src', SRC];
      if (argOf('--tmp-dir')) hArgs.push('--tmp-dir', argOf('--tmp-dir'));
      r = spawnSync(process.execPath, hArgs, { cwd: ROOT, encoding: 'utf8', timeout: 240000 });
    } finally {
      writeFileSync(file, orig);
    }
    if (Buffer.compare(readFileSync(file), orig) !== 0) {
      console.error(`PRZYWRÓCENIE ${rel} nieudane`);
      process.exitCode = 2;
      break;
    }
    n++;
    const ok = r.status === 1;
    if (!ok) missed++;
    const line = (r.stdout ?? '').split('\n').find((l) => l.startsWith('run-repin-ui2d:')) ?? (r.stderr ?? '').split('\n')[0];
    console.log(`${ok ? 'WYKRYTA ' : 'PRZEŻYŁA'} #${i} ${name} (EXIT=${r.status}) ${line.replace(/ webVectorsSha256=.*/, '')}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
console.log(`mutate-repin-ui2d: zakres=${from}:${Math.min(to, MUTS.length)} z ${MUTS.length} mutacji=${n} wykrytych=${n - missed} przeżyło=${missed}`);
if (process.exitCode !== 2) process.exitCode = missed === 0 ? 0 : 1;
