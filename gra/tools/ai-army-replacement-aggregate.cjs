'use strict';
/**
 * ai-army-replacement-aggregate.cjs -- agregacja wynikow ai-army-replacement-sim.cjs PER ZIARNO
 * (R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1 r2). Czyta <dir>/<world>-{pre,post}-<seed>.json
 * (pre = ARS_MUTATE=gate-off na TYM SAMYM kodzie, post = z bramka), liczy dla kazdej metryki
 * srednia po ziarnach, odchylenie, roznice sparowane (post-pre) z 95% przedzialem (t-Student) i
 * liczbe ziaren, w ktorych metryka sie pogorszyla. Metryka "gorsza" = wyzsza (wszystkie ponizsze
 * sa typu "mniej = lepiej"), poza join.neverShare (tez mniej=lepiej).
 *
 * Uzycie: node tools/ai-army-replacement-aggregate.cjs <dir> [world,world] [--out plik.txt]
 */
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const worlds = (process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'flat,pangea').split(',');
const outIdx = process.argv.indexOf('--out');

const T975 = [0, 12.71, 4.30, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23, 2.20, 2.18, 2.16, 2.14, 2.13];
const METRICS = [
  ['waves', 'fala1', 'avgClusters'], ['waves', 'fala1', 'avgStragglerShare'], ['waves', 'fala1', 'avgMeanRadius'],
  ['waves', 'fala1', 'shareArmiesOverWars'], ['waves', 'fala1', 'shareArmiesOver1'],
  ['join', 'fala1', 'medianTurns'], ['join', 'fala1', 'neverJoinedShare'],
  ['waves', 'fala2+', 'avgClusters'], ['waves', 'fala2+', 'avgStragglerShare'], ['waves', 'fala2+', 'avgMeanRadius'],
  ['waves', 'fala2+', 'shareArmiesOverWars'], ['join', 'fala2+', 'medianTurns'], ['join', 'fala2+', 'meanTurns'],
  ['join', 'fala2+', 'neverJoinedShare'],
];
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => (a.length < 2 ? 0 : Math.sqrt(a.reduce((x, y) => x + (y - mean(a)) ** 2, 0) / (a.length - 1)));
const fmt = (v) => (v === null || v === undefined || Number.isNaN(v) ? 'n/a' : v.toFixed(3));

const lines = [];
for (const w of worlds) {
  const seeds = fs.readdirSync(dir).filter(f => f.startsWith(`${w}-post-`)).map(f => Number(f.replace(/\D+/g, ''))).sort((a, b) => a - b);
  const get = (m, s) => JSON.parse(fs.readFileSync(path.join(dir, `${w}-${m}-${s}.json`), 'utf8')).summary;
  lines.push(`### ${w} (ziarna: ${seeds.join(',')}; 150 tur; atrapy rekrutacji/walki)`);
  lines.push('metryka | PRE sr | POST sr | roznica sparowana [95% CI] | ziarna gorsze/lepsze/n');
  const rows = [];
  for (const [grp, wave, key] of METRICS) {
    const pairs = [];
    for (const s of seeds) {
      const a = get('pre', s)[grp][wave][key]; const b = get('post', s)[grp][wave][key];
      if (typeof a === 'number' && typeof b === 'number') pairs.push([a, b]);
    }
    if (pairs.length === 0) { lines.push(`${wave}.${key} | n/a`); continue; }
    const d = pairs.map(([a, b]) => b - a);
    const n = d.length;
    const half = n > 1 ? (T975[Math.min(n - 1, 15)] || 1.96) * sd(d) / Math.sqrt(n) : NaN;
    const worse = d.filter(x => x > 1e-9).length; const better = d.filter(x => x < -1e-9).length;
    lines.push(`${wave}.${key} | ${fmt(mean(pairs.map(p => p[0])))} | ${fmt(mean(pairs.map(p => p[1])))} | ${fmt(mean(d))} [${fmt(mean(d) - half)}, ${fmt(mean(d) + half)}] | ${worse}/${better}/${n}`);
    rows.push({ wave, key, md: mean(d), lo: mean(d) - half, hi: mean(d) + half });
  }
  // zbiorcze: marsz ze skupiska < progu
  const share = (m) => seeds.map(s => get(m, s).marchBelowThreshold.share);
  const ms = (m) => seeds.map(s => get(m, s).aiMsPerCall);
  const dsh = share('post').map((x, i) => x - share('pre')[i]);
  lines.push(`marchBelowThreshold.share | ${fmt(mean(share('pre')))} | ${fmt(mean(share('post')))} | ${fmt(mean(dsh))} [${fmt(mean(dsh) - (T975[Math.min(dsh.length - 1, 15)] || 1.96) * sd(dsh) / Math.sqrt(dsh.length))}, ${fmt(mean(dsh) + (T975[Math.min(dsh.length - 1, 15)] || 1.96) * sd(dsh) / Math.sqrt(dsh.length))}] | ${dsh.filter(x => x > 0).length}/${dsh.filter(x => x < 0).length}/${dsh.length}`);
  lines.push(`aiMsPerCall | ${fmt(mean(ms('pre')))} | ${fmt(mean(ms('post')))}`);
  // histogram przyczyn (suma po ziarnach)
  for (const m of ['pre', 'post']) {
    const h = {};
    for (const s of seeds) for (const [k, v] of Object.entries(get(m, s).causeHistogram || {})) h[k] = (h[k] || 0) + v;
    lines.push(`cause ${m.toUpperCase()} ${JSON.stringify(h)}`);
  }
  // per cywilizacja (indeks wlasciciela 1..4; w symulacji wszystkie maja civType 'grecy' => archetypy NIE_ZMIERZONO)
  const pc = (m, s) => JSON.parse(fs.readFileSync(path.join(dir, `${w}-${m}-${s}.json`), 'utf8')).perCiv;
  lines.push('per cywilizacja (srednia po ziarnach): owner | stragglerShare PRE->POST | meanRadius PRE->POST | avgClusters PRE->POST | n wierszy');
  for (const owner of [1, 2, 3, 4]) {
    const col = (m, k) => { const v = []; for (const s of seeds) for (const r of pc(m, s)) if (r.owner === owner && typeof r[k] === 'number') v.push(r[k]); return v; };
    const f = (k) => `${fmt(mean(col('pre', k)))}->${fmt(mean(col('post', k)))}`;
    lines.push(`civ${owner} | ${f('stragglerShare')} | ${f('meanRadius')} | ${f('avgClusters')} | ${col('post', 'meanRadius').length}`);
  }
  lines.push('');
}
const text = lines.join('\n');
console.log(text);
if (outIdx >= 0) fs.writeFileSync(process.argv[outIdx + 1], text + '\n');
