'use strict';
/**
 * ai-ai-alliance-measure-run.cjs -- R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1: cienki wrapper na
 * `ai-economy-measure-run.cjs` (ten sam runner, te same blokady modalne, ten sam hak metryk) z przełącznikiem
 * sojuszy AI↔AI na czas biegu pomiarowego.
 *
 *   --alliances 0  -- tor sojuszy wyłączony (zachowanie domyślne gry, flaga z danych = false).
 *   --alliances 1  -- tor sojuszy WYMUSZONY na czas biegu (tylko pomiar; flaga w danych i w kodzie NIE jest zmieniana).
 *
 * Mechanizm wymuszenia (bez zmiany runnera): wrapper uruchamia runner w procesie potomnym z `NODE_OPTIONS=--require <ten plik>`.
 * W procesie potomnym (AI_ALLIANCE_MEASURE_CHILD=1) łata `chromium.launchPersistentContext`, tak by kontekst dostawał
 * init-script `window.__civAiAllianceMeasureForce = true`. Hak gry (main.ts, tickAiAiAllianceRequests) honoruje tę flagę
 * WYŁĄCZNIE pod ?civTest=1 — w produkcji bez zmian.
 *
 * Każdy wiersz jsonl runnera zawiera `diag.sojusze` (z `__aiEconomyMeasure.metrics()`): flaga, wymuszenie, lista sojuszy,
 * liczba sojuszy per cywilizacja, próby/odmowy toru (skumulowane), wojny AI↔AI. Wojny są też w `wars.aiAi` (runner).
 *
 * Uzycie (z gra/, bundle budowany POZA repo, jak runner):
 *   node tools/ai-ai-alliance-measure-run.cjs --alliances 1 --dist <abs-dist> --profile <abs-profil> --out <abs-katalog> --seed 4242 --turns 30
 * Analiza: node tools/ai-ai-alliance-measure-analyze.cjs --off <abs-katalog-OFF> --on <abs-katalog-ON>
 */
const path = require('path');
const { spawnSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const RUNNER = path.resolve(__dirname, 'ai-economy-measure-run.cjs');
const SELF = __filename;

if (process.env.AI_ALLIANCE_MEASURE_CHILD === '1') {
  // Proces potomny: łatamy Playwright przed uruchomieniem runnera (ta sama ścieżka modułu -> ta sama instancja).
  const pw = require(path.join(GRA_DIR, 'node_modules', 'playwright'));
  const orig = pw.chromium.launchPersistentContext.bind(pw.chromium);
  pw.chromium.launchPersistentContext = async (...args) => {
    const ctx = await orig(...args);
    if (process.env.AI_ALLIANCE_MEASURE_FORCE === '1') {
      await ctx.addInitScript(() => { window.__civAiAllianceMeasureForce = true; });
    }
    return ctx;
  };
} else {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--alliances');
  const val = i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : '0';
  if (val !== '0' && val !== '1') {
    console.error('[alliances] --alliances musi byc 0 albo 1 (podano: ' + val + ')');
    process.exit(2);
  }
  // Argument --alliances (wraz z wartoscia) jest zjadany tutaj; runner dostaje reszte bez zmian.
  const rest = i >= 0 ? argv.filter((_, k) => k !== i && k !== i + 1) : argv;
  const env = Object.assign({}, process.env, { AI_ALLIANCE_MEASURE_CHILD: '1', AI_ALLIANCE_MEASURE_FORCE: val });
  env.NODE_OPTIONS = ((process.env.NODE_OPTIONS || '') + ' --require ' + JSON.stringify(SELF)).trim();
  const r = spawnSync(process.execPath, [RUNNER, ...rest], { stdio: 'inherit', env });
  process.exit(r.status === null ? 1 : r.status);
}
