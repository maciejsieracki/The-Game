#!/usr/bin/env node
/**
 * mutate-repin-ui3e.mjs — mutacje partii REPIN UI-3-E (R-RUSTPORT-REPIN-WEB-UI-3-E-Q1): każda mutacja zmienia JEDEN
 * przepięty hunk webu 9b019a7d8 w porcie (`src/ui/cityPanel/*.ts`), uruchamia bramki i wymaga wykrycia.
 *
 * Klasyfikacja (ścisła, jak UI-2-E r2): WYKRYTA ⇔ ≥1 bramka EXIT 1 (różnica); EXIT 2 / inny kod / brak EXIT 1 = BŁĄD albo PRZEŻYŁA.
 * Przed serią: przypadek KONTROLNY bez mutacji — wszystkie użyte bramki EXIT 0 (inaczej EXIT 2, 0 mutacji).
 * Każda mutacja: podmiana tekstu musi trafić DOKŁADNIE raz; plik wraca bajtowo do oryginału (sprawdzane sha256).
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-repin-ui3e.mjs --web-dir <WEB 9b019a7d8> [--only M1,M2] [--tmp-dir <dir>]
 * EXIT 0 ⇔ wszystkie wykryte; 1 ⇔ ≥1 przeżyła; 2 ⇔ błąd/kontrola niezaliczona.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const WEB = argOf('--web-dir');
if (!WEB) { console.error('Użycie: --web-dir <WEB 9b019a7d8> [--only M1,…]'); process.exit(2); }
const ONLY = (argOf('--only') ?? '').split(',').filter(Boolean);
const TMPD = argOf('--tmp-dir'); // opcjonalny katalog tymczasowy dla run-repin-ui3e (domyślnie os.tmpdir())
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(ROOT, 'src/ui/cityPanel');
const H = (s) => join(ROOT, 'tools/dom-harness', s);
const GATES = {
  ui3e: ['node', [H('run-repin-ui3e.mjs'), '--web-dir', WEB, ...(TMPD ? ['--tmp-dir', TMPD] : [])]],
  k05a: ['node', [H('run-k05a-units.mjs'), '--pin-dir', WEB]],
  k06bv: ['node', [H('verify-k06b-copies.mjs'), '--pin-dir', WEB]],
  k07a: ['node', [H('run-k07a-units.mjs'), '--pin-dir', WEB]],
  k07b: ['node', [H('run-k07b-units.mjs'), '--pin-dir', WEB]],
  k09a: ['node', [H('run-k09a-pin.mjs'), '--pin-dir', WEB]],
  k08e: ['node', [H('run-k08e-pin.mjs'), '--pin-dir', WEB]],
  k03: ['node', [H('run-k03-units.mjs'), '--pin-dir', WEB]],
  k03m: ['node', [H('run-k03.mjs'), '--pin-dir', WEB]],
  ke: ['node', [join(ROOT, 'tools/verify-repin-ui3-copies.mjs')]],
};
const MUT = [
  ['M1', 'k01b-r.ts', '  const mult = citizenConsumptionEraMultiplier(ownerEra);', '  const mult = 1;', ['ui3e']],
  ['M2', 'k01b-r.ts', "  const multTxt = mult === 1 ? '' :", "  const multTxt = mult === 0 ? '' :", ['ui3e']],
  ['M3', 'k05b-chipy.ts', '      met: ctx.cityHasRiver === true,', '      met: ctx.cityHasRiver !== false,', ['ui3e']],
  ['M4', 'k05b-chipy.ts', "      label: 'Wymaga rzeki przy mieście',", "      label: 'Wymaga rzeki',", ['ui3e']],
  ['M5', 'k-ui3e-web.ts', '  return formatCompactNumber(n);', '  return String(n);', ['ui3e', 'ke']],
  ['M6', 'k-ui3e-host.ts', 'oblegane: c.oblegane });', 'oblegane: false });', ['ui3e', 'k05a']],
  ['M7', 'k05a-fundament.ts', '  if (isCityUnderSiege([city], city)) return false;', '  if (false) return false;', ['k05a']],
  ['M8', 'k06b-jednostki.ts', '    canPurchase: !siegeBlocked && (', '    canPurchase: (', ['k06bv']],
  ['M9', 'k07b-p1.ts', '      const autoBuildOn = cfg.isAutoBuildEnabled ? cfg.isAutoBuildEnabled() : true;', '      const autoBuildOn = true;', ['k07b']],
  ['M10', 'k07b-p1.ts', "      if (bState.tryb === 'lista' && autoBuildOn) {", "      if (bState.tryb === 'lista') {", ['k07b']],
  ['M11', 'k09a-rerender.ts', '      (manager as HTMLButtonElement).disabled = true;', '      (manager as HTMLButtonElement).disabled = false;', ['k09a']],
  ['M12', 'k09a-rerender.ts', '      if (getK09aHooks().isAutoBuildEnabled?.() === false) return;\n', '', ['k09a']],
  ['M13', 'k07a-fundament.ts', "${formatGrossNet(pracaCivBrutto, chip.praca.small, 'pkt Pracy/turę')}", "${formatGrossNet(chip.praca.small, chip.praca.small, 'pkt Pracy/turę')}", ['k07a']],
  ['M14', 'k08e-karty-a.ts', "  gridDetailRow(g, 'Bieżąca pula', formatManpowerCompact(mp.manpowerBiezacy));", "  gridDetailRow(g, 'Bieżąca pula', formatManpower(mp.manpowerBiezacy));", ['k08e']],
  ['M15', 'k03-cards.ts', "  gridDetailRow(g, 'Maksimum', formatManpowerCompact(mp.manpowerMax));", "  gridDetailRow(g, 'Maksimum', formatManpowerK(mp.manpowerMax));", ['k03']],
  ['M16', 'k03-model.ts', '    ownerEra: dto.ownerEra ?? 1,', '    ownerEra: 1,', ['k03', 'k03m']],
  ['M17', 'k06b-jednostki.ts', '    initialQuantity: recruitQuantityDrafts.get(recruitDraftKey(city.id, item.id)),', '    initialQuantity: undefined,', ['k06bv']],
];
const sha = (s) => createHash('sha256').update(s).digest('hex');
const run = (g) => { const [cmd, a] = GATES[g]; const r = spawnSync(cmd, a, { cwd: ROOT, encoding: 'utf8', timeout: 300000, maxBuffer: 256 * 1024 * 1024 }); return r.status ?? (r.signal ? 'TIMEOUT' : 'ERR'); };
const sel = MUT.filter((m) => !ONLY.length || ONLY.includes(m[0]));
const used = [...new Set(sel.flatMap((m) => m[4]))];
for (const g of used) {
  const s = run(g);
  if (s !== 0) { console.log(`KONTROLA NIEZALICZONA: ${g} EXIT ${s}`); process.exit(2); }
}
console.log(`KONTROLA: bramki ${used.join(',')} EXIT 0`);
let killed = 0, survived = 0, errors = 0;
for (const [id, file, from, to, gates] of sel) {
  const p = join(CITY, file);
  const orig = readFileSync(p, 'utf8');
  const h0 = sha(orig);
  const hits = orig.split(from).length - 1;
  if (hits !== 1) { console.log(`${id} BŁĄD: podmiana trafia ${hits}× w ${file}`); errors++; continue; }
  writeFileSync(p, orig.replace(from, to));
  const res = [];
  try { for (const g of gates) res.push([g, run(g)]); } finally { writeFileSync(p, orig); }
  if (sha(readFileSync(p, 'utf8')) !== h0) { console.log(`${id} BŁĄD: plik nie wrócił do oryginału`); process.exit(2); }
  const det = res.some(([, s]) => s === 1);
  const bad = res.some(([, s]) => s !== 0 && s !== 1);
  const st = det ? 'WYKRYTA' : bad ? 'BŁĄD' : 'PRZEŻYŁA';
  if (det) killed++; else if (bad) errors++; else survived++;
  console.log(`${id} ${st.padEnd(8)} ${file} :: ${res.map(([g, s]) => `${g}=${s}`).join(' ')}`);
}
console.log(`mutate-repin-ui3e: mutacji=${sel.length} wykryte=${killed} przeżyły=${survived} błędy=${errors}`);
process.exit(errors ? 2 : survived ? 1 : 0);
