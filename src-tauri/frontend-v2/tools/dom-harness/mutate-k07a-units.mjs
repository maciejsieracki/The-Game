#!/usr/bin/env node
/**
 * mutate-k07a-units.mjs — mutacje portu K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1, runda 2).
 * Każda mutacja = jedna podmiana tekstu w `src/ui/cityPanel/k07a-fundament.ts` (plik tymczasowy obok portu, bo importy
 * są względne), potem `run-k07a-units.mjs --v2 <mutant>`.
 * Zabita = harness EXIT 1; przeżyta = EXIT 0; EXIT 2 / wzorzec niejednoznaczny = NIE_ZMIERZONO.
 * Przeżyta mutacja wymaga uzasadnienia (równoważność) w `P5-8-K07A.md` albo wektora w harnessie.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k07a-units.mjs --pin-dir <PIN_DIR> [--part K/N] [--out <plik.json>]
 * `--part K/N` uruchamia tylko mutanty o indeksie i ≡ K (mod N) — podział na wywołania poniżej limitu czasu.
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
  console.error('Użycie: node tools/dom-harness/mutate-k07a-units.mjs --pin-dir <PIN_DIR> [--part K/N] [--out <plik>]');
  process.exit(2);
}
const PART = argOf('--part');
const [PK, PN] = PART ? PART.split('/').map(Number) : [0, 1];
const OUT = argOf('--out');
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PORT = join(V2_ROOT, 'src/ui/cityPanel/k07a-fundament.ts');
const MUT = join(V2_ROOT, 'src/ui/cityPanel/k07a-mutant-tmp.ts');
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-k07a-units.mjs');
const src = readFileSync(PORT, 'utf8');

/** Mutacje: [id, grupa, opis, tekst do zastąpienia (dokładnie raz), zamiennik]. */
const MUTANTS = [
  // Pola DTO / tekst kafelka W3 (w3CityChip).
  ['w3-stat-zloto', 'pole', 'klucz zloto → skarbiec zamieniony na zloto', "  zloto: 'skarbiec',", "  zloto: 'zloto',"],
  ['w3-stat-praca', 'pole', 'klucz praca → zywnosc', "  praca: 'praca',", "  praca: 'zywnosc',"],
  ['w3-title-quote', 'tekst', 'escape cudzysłowu w title pominięty', 'title="${hint.replace(/"/g, \'&quot;\')}"', 'title="${hint}"'],
  ['w3-aria-quote', 'tekst', 'escape cudzysłowu w aria-label pominięty', 'aria-label="${hint.replace(/"/g, \'&quot;\')}"', 'aria-label="${hint}"'],
  ['w3-aria-label', 'tekst', 'aria-label = etykieta zamiast podpowiedzi', 'aria-label="${hint.replace(/"/g, \'&quot;\')}"', 'aria-label="${label}"'],
  ['w3-res-scope', 'pole', 'klasa zakresu surowca pominięta', "const resScope = resKey ? ` ${resourceScopeClass(resKey)}` : '';", "const resScope = '';"],
  ['w3-res-key-default', 'pole', 'nieznany statId dostaje klucz praca', 'const resKey = W3_STAT_RES_KEY_K07[statId];', "const resKey = W3_STAT_RES_KEY_K07[statId] ?? 'praca';"],
  ['w3-interactive', 'pole', 'klasa civ-v-res-interactive pominięta', 'civ-v-res-interactive" data-res-stat', 'data-res-stat'],
  ['w3-data-stat', 'pole', 'data-res-stat = etykieta', 'data-res-stat="${statId}"', 'data-res-stat="${label}"'],
  ['w3-val-cls', 'tekst', 'klasa wartości pominięta', '<span class="civ-v-w3-chip-val ${cls}">', '<span class="civ-v-w3-chip-val">'],
  ['w3-delta-omit', 'pole', 'fragment tempo/zapas pominięty', "(deps ? deps.chipDeltaStockHtml(civRate, civStock) : '') +", "'' +"],
  ['w3-delta-swap', 'pole', 'argumenty tempo/zapas zamienione', "(deps ? deps.chipDeltaStockHtml(civRate, civStock) : '') +", "(deps ? deps.chipDeltaStockHtml(civStock, civRate) : '') +"],
  ['w3-delta-undef', 'brzeg', 'brak tempa (undefined) zamieniony na 0', "(deps ? deps.chipDeltaStockHtml(civRate, civStock) : '') +", "(deps ? deps.chipDeltaStockHtml(civRate ?? 0, civStock) : '') +"],
  ['w3-delta-nonfinite', 'brzeg', 'Infinity/NaN tempa zamienione na undefined', "(deps ? deps.chipDeltaStockHtml(civRate, civStock) : '') +", "(deps ? deps.chipDeltaStockHtml(Number.isFinite(civRate as number) ? civRate : undefined, civStock) : '') +"],
  ['w3-stock-nonfinite', 'brzeg', 'NaN/Infinity zapasu zamienione na undefined', "(deps ? deps.chipDeltaStockHtml(civRate, civStock) : '') +", "(deps ? deps.chipDeltaStockHtml(civRate, Number.isNaN(civStock as number) ? undefined : civStock) : '') +"],
  // resolveActiveCity (odświeżenie z listy miast).
  ['res-id-owner', 'pole', 'odświeżenie po ownerId zamiast id', 'const fresh = deps?.getCities().find(c => c.id === activeCity!.id);', 'const fresh = deps?.getCities().find(c => c.ownerId === activeCity!.ownerId);'],
  ['res-no-assign', 'pole', 'odświeżony obiekt nie zapisywany', 'if (fresh) activeCity = fresh;', 'if (fresh) void fresh;'],
  ['res-always-replace', 'brzeg', 'brak miasta w liście czyści stan', 'if (fresh) activeCity = fresh;', 'activeCity = fresh ?? null;'],
  ['res-null-branch', 'pole', 'gałąź null zwraca pusty obiekt', 'if (activeCity === null) return null;', 'if (activeCity === null) return {} as never;'],
  // capitalBadgeOrButtonHtml (stolica, oblężenie, uprawnienia).
  ['cap-equal', 'pole', 'warunek stolicy odwrócony', 'if (capitalId != null && capitalId === city.id) {', 'if (capitalId != null && capitalId !== city.id) {'],
  ['cap-besieged', 'pole', 'oblężenie ignorowane', 'const besieged = !!capitalCity?.oblegane;', 'const besieged = false;'],
  ['cap-besieged-name', 'tekst', 'nazwa w tytule: nazwa zamiast id stolicy', "(${capitalCity?.name ?? '?'})", '(${capitalId ?? \'?\'})'],
  ['cap-perm-isme', 'pole', 'brak sprawdzenia isMe', 'if (!deps || !deps.isMe(city.ownerId) || !deps.canSetCapital) return \'\';', "if (!deps || !deps.canSetCapital) return '';"],
  ['cap-perm-canset', 'pole', 'brak sprawdzenia canSetCapital', 'if (!deps || !deps.isMe(city.ownerId) || !deps.canSetCapital) return \'\';', "if (!deps || !deps.isMe(city.ownerId)) return '';"],
  ['cap-perm-invert', 'pole', 'isMe odwrócone', 'if (!deps || !deps.isMe(city.ownerId) || !deps.canSetCapital) return \'\';', "if (!deps || deps.isMe(city.ownerId) || !deps.canSetCapital) return '';"],
  ['cap-find-id', 'pole', 'wyszukiwanie stolicy po id miasta', 'allCitiesForCapital.find(c => c.id === capitalId)', 'allCitiesForCapital.find(c => c.id === city.id)'],
  ['cap-btn-id', 'tekst', 'id przycisku zmienione', 'id="civ-v-set-capital"', 'id="civ-v-set-capitol"'],
  ['cap-btn-title', 'tekst', 'tytuł przycisku zmieniony', '(za darmo)', '(odplatnie)'],
  ['cap-owner-cities', 'pole', 'lista miast zawsze pusta (brak stanu oblężenia)', 'const allCitiesForCapital = deps?.getCities() ?? [];', 'const allCitiesForCapital = [] as readonly CityK07[];'],
  // Stan modułu (akcesory K07A-Z3).
  ['ux-setter', 'pole', 'rejestracja odświeżania ignorowana', 'uxSectionRefresh = refresh;', 'void refresh;'],
  ['ux-getter', 'pole', 'odczyt rejestracji zawsze null', 'return uxSectionRefresh;', 'return null;'],
  ['deps-setter', 'pole', 'zależności nie zapisywane', '  deps = next;', '  void next;'],
  ['active-setter', 'pole', 'activeCity nie zapisywane', '  activeCity = city;', '  void city;'],
  // Równoważne (oczekiwane przeżycie — dowód równoważności w P5-8-K07A.md).
  ['eq-null-return', 'równoważna', 'null zwrócony przez activeCity zamiast literału null (ta sama wartość)', 'if (activeCity === null) return null;', 'if (activeCity === null) return activeCity;'],
];

const results = [];
try {
  const selected = MUTANTS.filter((_m, i) => i % PN === PK);
  for (const [id, grupa, desc, from, to] of selected) {
    const count = src.split(from).length - 1;
    if (count !== 1) {
      results.push({ id, grupa, desc, status: 'NIE_ZMIERZONO', reason: `wzorzec wystąpił ${count} razy` });
      continue;
    }
    writeFileSync(MUT, src.replace(from, to));
    let status;
    try {
      execFileSync(process.execPath, [HARNESS, '--pin-dir', PIN_DIR, '--v2', MUT], { stdio: 'pipe', timeout: 200000 });
      status = 'PRZEZYLA';
    } catch (err) {
      status = err.status === 1 ? 'ZABITA' : 'NIE_ZMIERZONO';
    }
    results.push({ id, grupa, desc, status });
  }
} finally {
  rmSync(MUT, { force: true });
}
const count = (s) => results.filter((r) => r.status === s).length;
const summary = {
  part: PART ?? 'all',
  mutantow: results.length,
  zabite: count('ZABITA'),
  przezyte: count('PRZEZYLA'),
  nieZmierzone: count('NIE_ZMIERZONO'),
  results,
};
if (OUT) writeFileSync(resolve(OUT), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
process.exit(count('NIE_ZMIERZONO') === 0 ? 0 : 1);
