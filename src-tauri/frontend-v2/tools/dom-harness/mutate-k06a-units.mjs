#!/usr/bin/env node
/**
 * mutate-k06a-units.mjs — mutacje portu K06A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1, runda 1).
 * Każda mutacja = jedna podmiana tekstu w `src/ui/cityPanel/k06a-fundament.ts` (zapis do pliku tymczasowego
 * obok portu, bo importy są względne), uruchomienie `run-k06a-units.mjs --v2 <mutant>`.
 * Zabita = harness EXIT 1 (różnica); przeżyta = EXIT 0; EXIT 2 = błąd harnessu (liczy się jako NIE_ZMIERZONO).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k06a-units.mjs --pin-dir <PIN_DIR>
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k06a-units.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PORT = join(V2_ROOT, 'src/ui/cityPanel/k06a-fundament.ts');
const MUT = join(V2_ROOT, 'src/ui/cityPanel/k06a-mutant-tmp.ts');
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-k06a-units.mjs');
const src = readFileSync(PORT, 'utf8');

/** Mutacje: [id, opis, tekst do zastąpienia (dokładnie raz), zamiennik]. */
const MUTANTS = [
  ['okolica-worker-dist', 'próg dystansu pracownika <= 1 → < 1', '(distFromCity ?? 1) <= 1', '(distFromCity ?? 1) < 1'],
  ['okolica-worker-default', 'domyślny dystans 1 → 2', '(distFromCity ?? 1) <= 1', '(distFromCity ?? 2) <= 1'],
  ['okolica-reczne-gt', 'warunek ręczny > 0 → >= 0', "return (reczne?.[key] ?? 0) > 0;", "return (reczne?.[key] ?? 0) >= 0;"],
  ['okolica-hex-angle', 'kąt startowy -30 → -60', 'const ang = (60 * i - 30) * Math.PI / 180;', 'const ang = (60 * i - 60) * Math.PI / 180;'],
  ['okolica-hex-fixed', 'zaokrąglenie 1 → 2 miejsca', "pts.push((cx + size * Math.cos(ang)).toFixed(1)", "pts.push((cx + size * Math.cos(ang)).toFixed(2)"],
  ['fire-toggle-delta', 'delta klik 0 → 1', 'cfg.onOkolicaTileAdjust(city.id, q, r, 0);', 'cfg.onOkolicaTileAdjust(city.id, q, r, 1);'],
  ['fire-toggle-id', 'id miasta → "x"', 'cfg.onOkolicaTileAdjust(city.id, q, r, 0);', "cfg.onOkolicaTileAdjust('x', q, r, 0);"],
  ['yield-short-plus', 'znak + usunięty dla dodatniej żywności', "${y.zywnosc > 0 ? '+' : ''}${y.zywnosc} ${cityPanelChipIconWrap('chip-grain', 12)}", "${y.zywnosc}  ${cityPanelChipIconWrap('chip-grain', 12)}"],
  ['yield-short-zero', 'pusty wynik "0" → ""', "return parts.length ? parts.join(' ') : '0';", "return parts.length ? parts.join(' ') : '';"],
  ['yield-short-handel', 'pominięty składnik handlu', "if (y.handel !== 0) parts.push(", "if (false) parts.push("],
  ['label-nakladka', 'domyślna nakładka brak → las', 'nakladka: hex.nakladka ?? NAKLADKA_BRAK,', "nakladka: hex.nakladka ?? 'las',"],
  ['label-rzeka', 'rzeka: obecna ignorowana', 'maRzeke: !!(hex.rzeka && hex.rzeka.obecna),', 'maRzeke: !!hex.rzeka,'],
  ['label-first-key', 'klucz ulepszenia: pierwszy → ostatni', 'ulepszenieKey: ulepszeniaKeys[0],', 'ulepszenieKey: ulepszeniaKeys[ulepszeniaKeys.length - 1],'],
  ['label-keys-undef', 'pusta lista kluczy → [] zamiast undefined', 'ulepszeniaKeys: ulepszeniaKeys.length ? ulepszeniaKeys : undefined,', 'ulepszeniaKeys: ulepszeniaKeys,'],
  ['impr-skip-underscore', 'pominięcie kluczy "_" wyłączone', "if (key.startsWith('_')) continue;", ''],
  ['impr-empty-name', 'puste nazwy akceptowane', "if (typeof row?.nazwa === 'string' && row.nazwa) map[key] = row.nazwa;", "if (typeof row?.nazwa === 'string') map[key] = row.nazwa;"],
  ['badge-null-check', 'warunek braku szPct: == null → === undefined', 'if (!st || st.szPct == null) {', 'if (!st || st.szPct === undefined) {'],
  ['badge-thr-60', 'próg zielony 60 → 50', "const cls = por >= 60 ? 'green'", "const cls = por >= 50 ? 'green'"],
  ['badge-warn', 'ostrzeżenie rewolty usunięte', 'const warn = st.revoltWarning ? ', 'const warn = false ? '],
  ['tabs-on-class', 'klasa aktywnej zakładki pominięta', "class=\"civ-cs-tab${on ? ' on' : ''}\"", 'class="civ-cs-tab"'],
  ['tabs-aria', 'aria-selected zawsze false', 'aria-selected="${on}"', 'aria-selected="false"'],
  ['owner-filter', 'filtr właściciela negowany', 'const list = all.filter(c => c.ownerId === city.ownerId);', 'const list = all.filter(c => c.ownerId !== city.ownerId);'],
  ['owner-fallback', 'brak listy → [] zamiast [city]', 'if (!all) return [city];', 'if (!all) return [];'],
  ['nav-tie-name', 'remis nazwy: sortowanie odwrotne', "return a.name.localeCompare(b.name, 'pl');", "return b.name.localeCompare(a.name, 'pl');"],
  ['nav-z-axis', 'oś Z pominięta w sortowaniu', 'if (Math.abs(aw.z - bw.z) > 0.01) return aw.z - bw.z;', ''],
  ['nav-hexr', 'HEX_R 1.0 → 2.0', 'const HEX_R = 1.0;', 'const HEX_R = 2.0;'],
  ['title-format', 'tytuł bez formatowania', 'return formatCityMapLabel(city);', 'return city.name;'],
  ['nav-dir', 'kierunek nawigacji odwrócony', 'navigateCityPanel(dir: -1 | 1): void {\n  switchCity(dir);', 'navigateCityPanel(dir: -1 | 1): void {\n  switchCity(dir === 1 ? -1 : 1);'],
  ['state-pinned', 'setter przypięcia ignorowany', 'pinnedGarrisonCityId = id;', 'void id;'],
];

const results = [];
try {
  for (const [id, desc, from, to] of MUTANTS) {
    const count = src.split(from).length - 1;
    if (count !== 1) {
      results.push({ id, desc, status: 'NIE_ZMIERZONO', reason: `wzorzec wystąpił ${count} razy` });
      continue;
    }
    writeFileSync(MUT, src.replace(from, to));
    let status;
    try {
      execFileSync(process.execPath, [HARNESS, '--pin-dir', PIN_DIR, '--v2', MUT], { stdio: 'pipe', timeout: 500000 });
      status = 'PRZEZYLA';
    } catch (err) {
      status = err.status === 1 ? 'ZABITA' : 'NIE_ZMIERZONO';
    }
    results.push({ id, desc, status });
  }
} finally {
  rmSync(MUT, { force: true });
}
const count = (s) => results.filter((r) => r.status === s).length;
console.log(JSON.stringify({ mutantow: results.length, zabite: count('ZABITA'), przezyte: count('PRZEZYLA'), nieZmierzone: count('NIE_ZMIERZONO'), results }, null, 1));
process.exit(count('PRZEZYLA') === 0 && count('NIE_ZMIERZONO') === 0 ? 0 : 1);
