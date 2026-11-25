'use strict';
/**
 * ai-economy-measure-upkeep-onoff.cjs -- R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1 (r3): JEDNO POLECENIE pomiaru #415
 * (R-WEB-AI-ARMY-UPKEEP-Q2) z flaga bramki utrzymania armii AI ON i OFF.
 *
 * Flaga to `AI_UPKEEP_RUNWAY_GATE.wlaczone` w `gra/data/ai-upkeep-params.json`. Kod bramki NIE jest w main; zyje w
 * `refs/keep/R-WEB-AI-UPKEEP-Q2-r2-fc` (3 pliki: ai-upkeep-params.json, ai-upkeep-runway.ts, fragmenty main.ts;
 * baza = merge-base z main). Od R-WEB-AI-UPKEEP-ONOFF-TOOLS-PORT-Q1 kod bramki jest w HEAD: patch kandydata jest pomijany. Skrypt NIC nie zmienia w repo: tworzy tymczasowy worktree z biezacego HEAD, naklada na
 * niego diff kandydata (git apply), buduje DWA bundle (wlaczone=true / false) POZA repo, uruchamia runner
 * `ai-economy-measure-run.cjs` na obu i drukuje porownanie (srednie po wlascicielach AI, tury 10/50/100).
 *
 * Uzycie (z gra/, po commicie harnessu; potrzebny `npm ci` w gra/):
 *   node tools/ai-economy-measure-upkeep-onoff.cjs --work /tmp/upkeep-onoff --seed 4242 --turns 100
 * Opcje: --candidate <ref> (domyslnie refs/keep/R-WEB-AI-UPKEEP-Q2-r2-fc), --keep 1 (nie usuwaj worktree).
 * Limit Bash 590 s: dwa przebiegi + dwa buildy trwaja dluzej -> uruchom w tle (setsid nohup ... &) i odpytuj log.
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const WORK = path.resolve(arg('work', `${require('os').tmpdir()}/upkeep-onoff-${TMPDIR_RUN_ID}`));
const CAND = arg('candidate', 'refs/keep/R-WEB-AI-UPKEEP-Q2-r2-fc');
const SEED = arg('seed', '4242');
const TURNS = arg('turns', '100');
const sh = (cmd, cwd) => execSync(cmd, { cwd: cwd || REPO, stdio: 'pipe', maxBuffer: 1 << 28 }).toString().trim();

function main() {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  const wt = path.join(WORK, 'wt');
  sh(`git worktree add --detach ${JSON.stringify(wt)} HEAD`);
  try {
    // R-WEB-AI-UPKEEP-ONOFF-TOOLS-PORT-Q1: kod bramki (ai-upkeep-runway.ts, main.ts, ai-upkeep-params.json) jest juz
    // w bazie HEAD (FALA 784+). Gdy plik bramki istnieje w wt, NIE nakladamy patcha kandydata (bylby zdublowany);
    // flaga wlaczone przelaczana jest w gra/data/ai-upkeep-params.json kopii roboczej jak dotad.
    if (fs.existsSync(path.join(wt, 'gra', 'src', 'game', 'ai-upkeep-runway.ts'))) {
      console.log('[onoff] kod bramki w bazie HEAD -> pomijam naklejanie kandydata ' + CAND);
    } else {
      const mb = sh(`git merge-base ${CAND} HEAD`);
      const patch = path.join(WORK, 'candidate.patch');
      fs.writeFileSync(patch, execSync(`git diff ${mb} ${CAND} -- gra/src gra/data`, { cwd: REPO, maxBuffer: 1 << 28 }));
      sh(`git apply ${JSON.stringify(patch)}`, wt);
    }
    fs.symlinkSync(path.join(GRA, 'node_modules'), path.join(wt, 'gra', 'node_modules'), 'dir');
    const flagFile = path.join(wt, 'gra', 'data', 'ai-upkeep-params.json');
    const results = {};
    for (const on of [false, true]) {
      const tag = on ? 'on' : 'off';
      const j = JSON.parse(fs.readFileSync(flagFile, 'utf8'));
      j.AI_UPKEEP_RUNWAY_GATE.wlaczone = on;
      fs.writeFileSync(flagFile, JSON.stringify(j, null, 2));
      const dist = path.join(WORK, 'dist-' + tag);
      console.log(`[onoff] build ${tag} -> ${dist}`);
      sh(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(dist)} --emptyOutDir`, path.join(wt, 'gra'));
      const out = path.join(WORK, 'out-' + tag);
      console.log(`[onoff] przebieg ${tag}: seed=${SEED} turns=${TURNS}`);
      const r = spawnSync('node', [path.join(GRA, 'tools', 'ai-economy-measure-run.cjs'), '--dist', dist, '--profile', path.join(WORK, 'prof-' + tag),
        '--out', out, '--seed', SEED, '--turns', TURNS, '--every', '10'], { stdio: 'inherit' });
      if (r.status !== 0) throw new Error('runner ' + tag + ' zakonczyl sie kodem ' + r.status);
      results[tag] = out;
    }
    const rows = [];
    for (const tag of ['off', 'on']) {
      const lines = fs.readFileSync(path.join(results[tag], `seed${SEED}.jsonl`), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
      for (const t of [...new Set([10, 50, Number(TURNS)])].filter(x => x <= Number(TURNS))) {
        const rec = lines.find(l => l.turn === t);
        if (!rec) { rows.push({ flaga: tag, tura: t, uwaga: 'brak wiersza (przebieg krotszy)' }); continue; }
        const ai = rec.owners.filter(o => o.owner >= 1);
        const avg = k => Math.round(ai.reduce((s, o) => s + (o[k] || 0), 0) / Math.max(1, ai.length) * 100) / 100;
        rows.push({ flaga: tag, tura: t, ownersAI: ai.length, skarbiec: avg('skarbiec'), spichlerz: avg('spichlerz'),
          wojsko: avg('jednostkiWojskowe'), utrzJednPieniadz: avg('utrzymanieJednostekPieniadz'), glodKaraProc: avg('glodKaraStatProc'),
          ownerzyGlodWojska: ai.filter(o => o.glodWojska).length, deficytZlota: ai.filter(o => o.deficytZlota).length });
      }
    }
    console.table(rows);
    fs.writeFileSync(path.join(WORK, 'onoff-summary.json'), JSON.stringify({ seed: SEED, turns: TURNS, candidate: CAND, rows }, null, 2));
    console.log('[onoff] zapisano ' + path.join(WORK, 'onoff-summary.json'));
  } finally {
    if (arg('keep', '0') !== '1') { try { sh(`git worktree remove --force ${JSON.stringify(wt)}`); } catch (_) {} }
  }
}
main();
