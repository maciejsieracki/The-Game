#!/usr/bin/env node
/**
 * mutate-repin-ui2f.mjs — test mutacyjny harnessu `run-repin-ui2f.mjs` (R-RUSTPORT-REPIN-UI-2-F-Q1).
 *
 * Każda mutacja = jedna gałąź/hunk weba `edb8fb56 → 86d510c66` przeniesiony do `src/ui/newGameFlow.ts` portu
 * (P5-REPIN-UI-2 §1 #23). Mutacja podmienia DOKŁADNIE JEDNO wystąpienie wzorca (inaczej błąd harnessu) w kopii `src`
 * (mktemp), po czym uruchamia `run-repin-ui2f.mjs --src <kopia>`; mutacja WYKRYTA ⇔ EXIT 1. EXIT 2 (błąd budowy/harnessu)
 * liczony osobno jako NIE wykryta przez porównanie (raportowany jawnie).
 * Dodatkowo mutacja M0 = cały plik portu sprzed repinu (`--old-port <plik>`, opcjonalnie): harness musi go odrzucić.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui2f.mjs --web-dir <WEB_DIR> [--from N] [--to M] [--png] [--old-port <plik.ts>]
 *        [--tmp-dir <dir>]
 * `--png` = także zrzuty PNG (wolniej); bez niego mutacje CSS wykrywa porównanie treści `<style>` i geometrii przewijania.
 * EXIT 0 ⇔ wszystkie mutacje z zakresu wykryte.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
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
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui2f.mjs --web-dir <WEB_DIR> [--from N] [--to M] [--png] [--old-port <plik>]');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-repin-ui2f.mjs');
const FILE = 'ui/newGameFlow.ts';

/** [id, opis, wzorzec, zamiana] — wzorzec musi wystąpić w porcie dokładnie raz. */
const MUT = [
  ['M01', 'DEFAULT_ADVANCED.battleAlwaysManual true→false', "battleAlwaysManual: true,\n  victoryMode", "battleAlwaysManual: false,\n  victoryMode"],
  ['M02', 'DEFAULT_ADVANCED.buildingCostPace normalny→niski', "  buildingCostPace: 'normalny',\n  kosztJednostekPace", "  buildingCostPace: 'niski',\n  kosztJednostekPace"],
  ['M03', 'DEFAULT_ADVANCED.cityStateDifficultyOverride normal→null', "cityStateDifficultyOverride: 'normal',", 'cityStateDifficultyOverride: null,'],
  ['M04', 'SETTING_SVG_KEYS bez world_type (glif zamiast SVG)', "'difficulty', 'map_size', 'world_type', 'game_speed',", "'difficulty', 'map_size', 'game_speed',"],
  ['M05', 'CSS .civ-newgame overflow hidden→auto', '.civ-newgame{position:fixed;inset:0;z-index:500;overflow:hidden;', '.civ-newgame{position:fixed;inset:0;z-index:500;overflow:auto;'],
  ['M06', 'CSS @media max-width 900px→300px', '@media (max-width: 900px){', '@media (max-width: 300px){'],
  // M07: mutacja wartości początkowej `let civProfileCollapsed = true` jest RÓWNOWAŻNA (r1: NIE wykryta — `showNewGameFlow`
  // zawsze ją nadpisuje przed pierwszym renderem; to samo na webie) → zastąpiona klasą układu przełącznika gracza.
  ['M07', 'przełącznik profilu gracza nie zwija układu', "      : 'Ukryj parametry cywilizacji') + '</span><span class=\"chevron\" aria-hidden=\"true\">&#8964;</span>';\n    layout.classList.toggle('civ-profile-collapsed', civProfileCollapsed);", "      : 'Ukryj parametry cywilizacji') + '</span><span class=\"chevron\" aria-hidden=\"true\">&#8964;</span>';\n    layout.classList.toggle('civ-profile-collapsed', false);"],
  ['M08', 'showNewGameFlow bez resetu civProfileCollapsed', 'selCiv = DEFAULT_PLAYER_CIV_ID;\n  civProfileCollapsed = true;', 'selCiv = DEFAULT_PLAYER_CIV_ID;'],
  ['M09', 'komórka macierzy <details>→<article>', "const row = document.createElement('details');", "const row = document.createElement('article') as unknown as HTMLDetailsElement;"],
  ['M10', 'komórka macierzy bez szewronu', "  head.appendChild(chevron);\n  row.appendChild(summary);", '  row.appendChild(summary);'],
  ['M11', 'liczba wskaźników stała 113', '`${profile.parameterCount} wskaźników ·', '`113 wskaźników ·'],
  ['M12', 'Ziemia nie ukrywa udziału lądu', "=== 'ziemia') continue;", "=== 'ziemia-x') continue;"],
  ['M13', 'zmiana typu świata bez przerysowania', "s.key === 'map_size' || s.key === 'world_type' || s.key === 'city_states_count'", "s.key === 'map_size' || s.key === 'city_states_count'"],
  ['M14', 'dealsEndTurnGate odwrócone', "dealsEndTurnGate: settingValue('deals_end_turn_gate') !== 'Wyłączona',", "dealsEndTurnGate: settingValue('deals_end_turn_gate') === 'Wyłączona',"],
  ['M15', 'playerEpochWarEnabled pominięte', "    playerEpochWarEnabled: settingValue('player_epoch_war') !== 'Wyłączona',\n", ''],
  ['M16', 'podsumowanie Ziemia: tekst szablonu', "? 'szablon kontynentów (bez suwaka)'", "? 'szablon'"],
  ['M17', 'podsumowanie: etykieta bitwy (stara)', "p.advanced.battleAlwaysManual ? 'Bitwa ręczna i automatyczna' : 'Bitwa automatyczna'", "p.advanced.battleAlwaysManual ? 'Ręczna' : 'Automatyczne'"],
  ['M18', 'przycisk startu fotela 2 zawsze aktywny', 'action.disabled = !seatReady;', 'action.disabled = false;'],
  ['M19', 'brak data-seat-ready', 'action.dataset.seatReady = String(seatReady);', ''],
  ['M20', 'okno zaawansowane: Zamknij zamiast Zastosuj', "el('button', 'adv-close', 'Zastosuj');", "el('button', 'adv-close', 'Zamknij');"],
  ['M21', 'kolejność siatki kroku 4 (pierwsza para)', "'map_size', 'civ_types_count',\n", "'civ_types_count', 'map_size',\n"],
  ['M22', 'fotel 2 bez profilu macierzy', '    appendCivMatrixProfile(detail, c2.id);\n', ''],
  ['M23', 'fotel 2 bez jednostki specjalnej', "if (c2.superJednostka) {", 'if (false && c2.superJednostka) {'],
  ['M24', 'profil gracza: „Styl:” bez dwukropka', "styl.textContent = 'Styl: ' + c.styl;", "styl.textContent = 'Styl ' + c.styl;"],
  ['M25', 'etykieta akcji kroku 4 (hot-seat) zamieniona', "showSeat2Screen || !hotSeatEnabled ? 'Rozpocznij grę' : 'Dalej &#8594;'", "showSeat2Screen || !hotSeatEnabled ? 'Dalej &#8594;' : 'Rozpocznij grę'"],
  ['M26', 'przełącznik profilu: aria-label odwrócony (gracz)', "? 'Pokaż parametry cywilizacji'\n      : 'Ukryj parametry cywilizacji');", "? 'Ukryj parametry cywilizacji'\n      : 'Pokaż parametry cywilizacji');"],
  ['M27', 'przełącznik profilu fotela 2 nie zmienia stanu', 'detailToggle.addEventListener(\'click\', () => { civProfileCollapsed = !civProfileCollapsed; updateDetailToggle(); });', "detailToggle.addEventListener('click', () => { updateDetailToggle(); });"],
  ['M28', 'Trudność miast-państw: podpowiedź stara', 'Domyślnie: Normalny. Wyłączone', 'Domyślnie = główna trudność. Wyłączone'],
  // M29 r1 (zmiana `key: 'ruchSwiataPace'`) była RÓWNOWAŻNA (klucz wiersza okna nie trafia do DOM) → kolejność wierszy.
  ['M29', 'okno zaawansowane: stara kolejność (Jakość mapy na początku)', "function advancedSettingRows(): AdvSettingRow[] {\n  return [\n", "function advancedSettingRows(): AdvSettingRow[] {\n  return [\n    advRowFromSett('map_quality', 'Jakość renderu mapy 3D — niska / średnia / wysoka (GPU).'),\n"],
  ['M30', 'etykieta opcji bitew (stara)', "opts: ['Bitwa automatyczna', 'Bitwa ręczna i automatyczna'],", "opts: ['Automatyczne', 'Ręczna'],"],
  ['M31', 'CSS .nav bez tła paska', 'background:rgba(18,18,26,.94);backdrop-filter:blur(8px);max-width:1000px', 'background:transparent;max-width:1000px'],
  ['M32', 'CSS @media max-height 760px usunięte', '@media (max-height: 760px){', '@media (max-height: 1px){'],
  ['M33', 'pusty profil gracza: stary tekst „bonusy”', 'aby zobaczyć jej parametry i jednostkę specjalną.', 'aby zobaczyć bonusy i jednostkę specjalną.'],
  ['M34', 'nagłówek profilu macierzy (stary)', "'Parametry cywilizacji — Normal'", "'Profil macierzy — Normal'"],
];

const from = Number(argOf('--from') ?? 1);
const to = Number(argOf('--to') ?? MUT.length);
const OLD = argOf('--old-port');
const src0 = readFileSync(join(V2_ROOT, 'src', FILE), 'utf8');
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'mutate-ui2f-'));
const runOne = (label, text) => {
  const srcDir = join(TMP, 'src');
  rmSync(srcDir, { recursive: true, force: true });
  cpSync(join(V2_ROOT, 'src'), srcDir, { recursive: true });
  writeFileSync(join(srcDir, FILE), text);
  const r = spawnSync(process.execPath, [HARNESS, '--web-dir', WEB_DIR, '--src', srcDir, '--tmp-dir', TMP, ...(args.includes('--png') ? [] : ['--no-png'])], { encoding: 'utf8', cwd: V2_ROOT, maxBuffer: 64 * 1024 * 1024 });
  const last = (r.stdout ?? '').trim().split('\n').filter((l) => l.startsWith('run-repin-ui2f:')).pop() ?? '';
  const firstDiff = (r.stdout ?? '').split('\n').find((l) => / RÓŻNICE=/.test(l))?.trim().split(/\s+/)[0] ?? '';
  return { code: r.status, last, firstDiff, err: (r.stderr ?? '').split('\n').slice(0, 2).join(' ') };
};
let detected = 0;
let total = 0;
let harnessErr = 0;
try {
  if (OLD) {
    total++;
    const r = runOne('M00', readFileSync(OLD, 'utf8'));
    const ok = r.code === 1;
    detected += ok ? 1 : 0;
    console.log(`M00 port sprzed repinu (${OLD}) → EXIT ${r.code} ${ok ? 'WYKRYTA' : 'NIE WYKRYTA'} ${r.last.replace(/webVectorsSha256=\S+/, '')}`);
  }
  for (const [id, desc, pat, rep] of MUT.slice(from - 1, to)) {
    total++;
    const n = src0.split(pat).length - 1;
    if (n !== 1) {
      harnessErr++;
      console.log(`${id} ${desc}: wzorzec występuje ${n}× (wymagane 1) — BŁĄD mutacji`);
      continue;
    }
    const r = runOne(id, src0.replace(pat, rep));
    const ok = r.code === 1;
    if (r.code === 2) harnessErr++;
    detected += ok ? 1 : 0;
    console.log(`${id} ${desc} → EXIT ${r.code} ${ok ? 'WYKRYTA' : 'NIE WYKRYTA'}${r.firstDiff ? ' (pierwszy scenariusz: ' + r.firstDiff + ')' : ''}${r.code === 2 ? ' ' + r.err : ''}`);
  }
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
console.log(`mutate-repin-ui2f: zakres=${from}-${to} mutacji=${total} wykrytych=${detected} błędów_harnessu=${harnessErr}`);
process.exitCode = detected === total && harnessErr === 0 ? 0 : 1;
