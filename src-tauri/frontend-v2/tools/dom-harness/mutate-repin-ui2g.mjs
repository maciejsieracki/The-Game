#!/usr/bin/env node
/**
 * mutate-repin-ui2g.mjs — mutacje nowych hunków webu przeniesionych do portu w partii REPIN UI-2-G r1
 * (R-RUSTPORT-REPIN-UI-2-G-Q1). Każda mutacja zmienia JEDNĄ gałąź/wartość nowego hunku w kopii `src/` (katalog tymczasowy),
 * po czym `run-repin-ui2g.mjs --src <kopia>` musi dać EXIT 1 (wykryta). Linia bazowa (bez mutacji) musi dać EXIT 0.
 * Mutacja RÓWNOWAŻNA (nieodróżnialna przez wynik funkcji, z uzasadnieniem) nie wlicza się do mianownika.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui2g.mjs --web-dir <WEB 86d510c66> [--only M1,M2]
 * EXIT 0 ⇔ linia zielona i wszystkie nierównoważne mutacje wykryte; 1 ⇔ przeżyła ≥1; 2 ⇔ błąd.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const WEB_DIR = argOf('--web-dir');
if (!WEB_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui2g.mjs --web-dir <WEB 86d510c66> [--only M1,M2]');
  process.exit(2);
}
const ONLY = argOf('--only')?.split(',');
const V2_SRC = resolve(fileURLToPath(new URL('../../src/', import.meta.url)));
const HARNESS = fileURLToPath(new URL('./run-repin-ui2g.mjs', import.meta.url));
const CP = 'ui/cityPanel/';

// [id, plik (względem src/), tekst (dokładnie raz), zamiennik, opis, równoważna?]
const MUTANTS = [
  ['M1', CP + 'k01b-r.ts', "    const frontPraca = front.kind === 'budynek' ? buildingPracaPerTurn : pracaPerTurn;", '    const frontPraca = pracaPerTurn;', 'K01B front: Praca budynków ignorowana'],
  ['M2', CP + 'k01b-r.ts', '    if (!(frontPraca > 0)) return null;\n', '', 'K01B front: brak bramki ≤0 → null',
    'RÓWNOWAŻNA: następna linia woła `etaTurns(…, frontPraca)` reguł (web game/production.ts:1268-1270: `!(praca > 0)` → null), a `rem === null` → null — ten sam wynik dla każdego wejścia'],
  ['M3', CP + 'k01b-r.ts', "    const itemPraca = it.kind === 'budynek' ? buildingPracaPerTurn : pracaPerTurn;", "    const itemPraca = it.kind === 'jednostka' ? buildingPracaPerTurn : pracaPerTurn;", 'K01B pozycje pośrednie: odwrócony warunek rodzaju'],
  ['M4', CP + 'k01b-r.ts', '    if (!(itemPraca > 0)) return null;\n', '', 'K01B pozycje pośrednie: brak bramki ≤0 → null'],
  ['M5', CP + 'k01b-r.ts', "  const curPraca = cur.kind === 'budynek' ? buildingPracaPerTurn : pracaPerTurn;", '  const curPraca = buildingPracaPerTurn;', 'K01B bieżąca pozycja: zawsze Praca budynków'],
  ['M6', CP + 'k01b-r.ts', '  if (!(curPraca > 0)) return null;\n', '', 'K01B bieżąca pozycja: brak bramki ≤0 → null'],
  ['M7', CP + 'k01b-r.ts', '  buildingPracaPerTurn = pracaPerTurn,', '  buildingPracaPerTurn = 1,', 'K01B wartość domyślna parametru'],
  ['M8', CP + 'k05a-fundament.ts', '  return unitManpowerCostForType(typeId, ep, maxMult, multipliers?.costMult ?? maxMult);', '  return unitManpowerCostForType(typeId, ep, maxMult, maxMult);', 'K05A costMult z multipliers pominięty'],
  ['M9', CP + 'k05a-fundament.ts', '  const maxMult = multipliers?.maxMult ?? civManpowerMaxMult(cfg.getCivBonusy?.(city.ownerId));\n  return unitManpowerCostForType',
    '  const maxMult = civManpowerMaxMult(cfg.getCivBonusy?.(city.ownerId));\n  return unitManpowerCostForType', 'K05A maxMult z multipliers pominięty',
    'RÓWNOWAŻNA: web `unitManpowerCostForType` (game/manpower.ts:544-552) liczy koszt wyłącznie z `costMult`; `maxMult` jest tylko domyślną wartością `costMult`, a przy obecnym `multipliers` `costMult` pochodzi z `multipliers` — wynik funkcji nie zależy od tej gałęzi'],
  ['M10', CP + 'k05a-fundament.ts', '  return regul().unitManpowerCostForType(typeId, epoch, maxMult, costMult);', '  return regul().unitManpowerCostForType(typeId, epoch, maxMult);', 'K05A delegator gubi 4. argument'],
  ['M11', CP + 'k05a-fundament.ts', '${need} ${stockResourceLabel(k)} (brak)`', '${need} ${stockResourceLabel(k)} (brakuje)`', 'K05A tekst „(brak)”'],
  ['M12', CP + 'k05a-fundament.ts', '    const text = missing ?', '    const text = !missing ?', 'K05A odwrócony warunek „(brak)”'],
  ['M13', CP + 'k05a-fundament.ts', "parts.push(`Brakuje: ${brakZasobow.join(' · ')}`);", "parts.push(`Brakuje: ${brakZasobow.join(', ')}`);", 'K05A separator „Brakuje”'],
  ['M14', CP + 'k05a-fundament.ts', "  if (brakZasobow.length > 0) parts.push(`Brakuje: ${brakZasobow.join(' · ')}`);\n", '', 'K05A brak wiersza „Brakuje”'],
  ['M15', CP + 'k05a-fundament.ts', "  if (brakZasobow.length > 0) parts.push(", "  if (brakZasobow.length > 1) parts.push(", 'K05A próg długości listy braków'],
  ['M16', CP + 'k06a-fundament.ts', '    wlascicielEra: ownerEra,', '    wlascicielEra: undefined,', 'K06A epoka właściciela nie przekazana'],
  ['M17', CP + 'k06a-fundament.ts', '    wlascicielEra: ownerEra,', '    wlascicielEra: (ownerEra ?? 0) + 1,', 'K06A epoka przesunięta'],
  ['M18', CP + 'k01a-fundament.ts', "  if (turns === null) return 'brak Pracy';", "  if (turns === null) return 'brak';", 'K01A formatBuildEtaLabel (kontrola przepięcia)'],
];

function run(src) {
  const r = spawnSync(process.execPath, [HARNESS, '--web-dir', WEB_DIR, '--src', src], { encoding: 'utf8', timeout: 560000, maxBuffer: 1 << 26 });
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  const sum = out.split('\n').find((l) => l.startsWith('run-repin-ui2g:')) ?? out.split('\n').filter(Boolean).slice(-1)[0] ?? '';
  return { code: r.status, sum };
}

const tmp = mkdtempSync(join(tmpdir(), 'repin-ui2g-mut-'));
let survived = 0, killed = 0, equivalent = 0, notApplied = 0;
try {
  const base = join(tmp, 'src');
  cpSync(V2_SRC, base, { recursive: true });
  const b = run(base);
  console.log(`linia (bez mutacji): EXIT=${b.code} ${b.sum}`);
  if (b.code !== 0) { console.log('WYNIK: linia bazowa CZERWONA'); process.exitCode = 1; }
  else {
    for (const [id, rel, from, to, desc, eq] of MUTANTS) {
      if (ONLY && !ONLY.includes(id)) continue;
      const path = join(base, rel);
      const orig = readFileSync(path, 'utf8');
      const n = orig.split(from).length - 1;
      if (n !== 1) { notApplied++; console.log(`${id} NIE_ZASTOSOWANO (wystąpień ${n}) ${desc}`); continue; }
      writeFileSync(path, orig.replace(from, () => to));
      const r = run(base);
      writeFileSync(path, orig);
      const detected = r.code === 1;
      if (eq) { equivalent++; console.log(`${id} ${detected ? 'WYKRYTA(równoważna?)' : 'RÓWNOWAŻNA'} ${desc} — ${eq}`); continue; }
      if (detected) killed++; else survived++;
      console.log(`${id} ${detected ? 'WYKRYTA' : 'PRZEŻYŁA'} EXIT=${r.code} ${desc} :: ${r.sum.slice(0, 120)}`);
    }
    const ok = survived === 0 && notApplied === 0;
    console.log(`mutate-repin-ui2g: mutacji=${killed + survived} wykrytych=${killed} przeżyłych=${survived} równoważnych=${equivalent} niezastosowanych=${notApplied}`);
    process.exitCode = ok ? 0 : 1;
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
