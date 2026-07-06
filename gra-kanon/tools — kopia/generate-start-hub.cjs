/**
 * Generuje gra-robocza/START.html (hub) + uzupełnia ROBOCZA-MANIFEST.json.
 * node tools/generate-start-hub.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const roboczaRoot = path.resolve(__dirname, '..');

const entries = [
  { file: 'Gra-podglad.html', query: '?skipMenuRedirect=1', label: 'Pe\u0142na gra ROBOCZA', note: 'Mapa, miasto, ekonomia, walka w grze \u2014 menu startowe pomini\u0119te', group: 'main' },
  { file: 'Gra-podglad.html', query: '', label: 'Pe\u0142na gra (z menu)', note: 'Ten sam bundel \u2014 normalne menu g\u0142\u00f3wne', group: 'main' },
  { file: 'Gra-podglad-PLAYTEST-MAPA.html', query: '', label: 'Playtest: mapa \u015bwiat', note: 'Auto-start sandboxu mapy', group: 'playtest' },
  { file: 'Gra-podglad-PLAYTEST-MIASTO.html', query: '', label: 'Playtest: miasto / ekonomia', note: 'Auto-start panelu miasta i bilansu', group: 'playtest' },
  { file: 'Gra-podglad-PLAYTEST-WALKA.html', query: '', label: 'Playtest: walka na mapie', note: 'Scenariusz preBattle + auto-walka', group: 'playtest' },
  { file: 'Gra-podglad-PLAYTEST-ODSKOK.html', query: '', label: 'Playtest: odskok 3v3', note: 'Auto-walka \u2192 odskok obro\u0144c\u00f3w', group: 'playtest' },
  { file: 'Gra-podglad-PLAYTEST-ODSKOK-OBLEZENIE.html', query: '', label: 'Playtest: odskok + obl\u0119\u017cenie', note: '3v3 z garnizonem w mie\u015bcie', group: 'playtest' },
  { file: 'Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html', query: '', label: 'Playtest: obl\u0119\u017cenie 3v3', note: 'Scenariusz szturmu miasta', group: 'playtest' },
  { file: 'Gra-podglad-POLE-BITWY.html', query: '', label: 'Pole bitwy / free battle', note: 'Osobny bundel (oblezenie/) \u2014 deploy, roster, HUD C-04', group: 'battle' },
];

function bundleMeta(file) {
  const full = path.join(roboczaRoot, file);
  if (!fs.existsSync(full)) return { missing: true, md5: null, sizeMb: null };
  const buf = fs.readFileSync(full);
  return {
    missing: false,
    md5: crypto.createHash('md5').update(buf).digest('hex'),
    sizeMb: (buf.length / (1024 * 1024)).toFixed(2),
  };
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const rows = entries.map((e) => {
  const meta = bundleMeta(e.file);
  const href = e.file + e.query;
  return { ...e, href, meta };
});

const mainRow = rows.find((r) => r.group === 'main' && r.query === '?skipMenuRedirect=1');
const mainMd5 = mainRow && !mainRow.meta.missing ? mainRow.meta.md5 : null;
const generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
const mainShort = mainMd5 ? mainMd5.slice(0, 8) : '????????';

const groups = [
  { id: 'main', title: 'Gra pe\u0142na' },
  { id: 'playtest', title: 'Playtesty (auto-start)' },
  { id: 'battle', title: 'Pole bitwy' },
];

let cards = '';
for (const g of groups) {
  cards += `\n  <section>\n    <h2>${esc(g.title)}</h2>\n`;
  for (const r of rows.filter((x) => x.group === g.id)) {
    const cls = r.meta.missing ? 'card missing' : 'card';
    const md5 = r.meta.missing ? 'BRAK PLIKU' : r.meta.md5.slice(0, 12);
    const size = r.meta.missing ? '\u2014' : `${r.meta.sizeMb} MB`;
    cards += `    <a class="${cls}" href="${esc(r.href)}">
      <div class="card-title">${esc(r.label)}</div>
      <div class="card-note">${esc(r.note)}</div>
      <div class="card-meta">${esc(r.href)} \u00b7 ${size} \u00b7 md5 ${md5}</div>
    </a>\n`;
  }
  cards += '  </section>\n';
}

const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Game \u2014 START (ROBOCZA)</title>
<style>
  :root { --bg:#0f1419; --panel:#1a2332; --gold:#d4af37; --text:#e8e4dc; --muted:#8a9bb0; --border:rgba(212,175,55,.25); }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; font:15px/1.5 Georgia, 'Times New Roman', serif; color:var(--text); background:linear-gradient(160deg,#0a0e14,#1a2433 55%,#0f1419); padding:2rem 1rem 3rem; }
  .wrap { max-width:720px; margin:0 auto; }
  h1 { font-size:1.45rem; color:var(--gold); margin:0 0 .25rem; letter-spacing:.04em; }
  .sub { color:var(--muted); font-size:.88rem; margin-bottom:1.5rem; }
  .warn { background:rgba(200,120,40,.12); border:1px solid rgba(200,120,40,.35); border-radius:6px; padding:.65rem .85rem; font-size:.85rem; margin-bottom:1.25rem; }
  section { margin-bottom:1.5rem; }
  h2 { font-size:.78rem; text-transform:uppercase; letter-spacing:.12em; color:var(--muted); margin:0 0 .55rem; }
  .card { display:block; background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:.85rem 1rem; margin-bottom:.55rem; text-decoration:none; color:inherit; transition:border-color .15s, background .15s; }
  .card:hover { border-color:rgba(212,175,55,.55); background:#222d3f; }
  .card.missing { opacity:.45; pointer-events:none; }
  .card-title { font-weight:700; color:var(--gold); font-size:1.02rem; }
  .card-note { font-size:.84rem; color:var(--muted); margin-top:.2rem; }
  .card-meta { font:11px/1.4 ui-monospace, Consolas, monospace; color:#6b8aad; margin-top:.45rem; }
  footer { margin-top:2rem; font-size:.75rem; color:var(--muted); }
</style>
</head>
<body>
<div class="wrap">
  <h1>The Game \u2014 ROBOCZA</h1>
  <p class="sub">Jedyny punkt wej\u015bcia do playtestu \u00b7 wygenerowano ${esc(generatedAt)} \u00b7 g\u0142\u00f3wny bundel <code>${mainShort}</code></p>
  <div class="warn"><strong>Ctrl+F5</strong> po ka\u017cdym publishu. Nie testuj root <code>Gra-podglad.html</code> (stary kanon).</div>
${cards}  <footer>Manifest: ROBOCZA-MANIFEST.json \u00b7 publish: tools/publish-robocza-bundle.ps1</footer>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(roboczaRoot, 'START.html'), html, 'utf8');

const manifestPath = path.join(roboczaRoot, 'ROBOCZA-MANIFEST.json');
let existing = {};
try {
  existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (_) {}

const manifestBundles = rows
  .filter((r) => !r.meta.missing)
  .map((r) => ({
    file: r.file,
    href: r.href,
    label: r.label,
    md5: r.meta.md5,
    sizeBytes: fs.statSync(path.join(roboczaRoot, r.file)).size,
  }));

const manifest = {
  ...existing,
  hubGeneratedAt: new Date().toISOString().slice(0, 19),
  md5: mainMd5 || existing.md5,
  bundles: manifestBundles,
  startHub: 'START.html',
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('OK START hub + manifest', manifestBundles.length, 'bundles');
