// R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1 (Obrona r2): przeliczenie tabel z surowego JSONL (gzip) wylacznie z pol zapisanych przez runner.
// Uzycie: node analyze-pace.cjs <plik.jsonl.gz> [tury=30,60,90] [--pair <drugi.jsonl.gz>]
// Liczby "per epoka" = jednostkiWojskowe wlasciciela pogrupowane wg owner.hud.epoka (epoka wlasciciela w tej turze).
// "Wspolni" = wlasciciele AI z rekordem w obu przebiegach (--pair).
const fs = require('fs');
const zlib = require('zlib');
const args = process.argv.slice(2);
const file = args[0];
const turns = (args[1] && !args[1].startsWith('--') ? args[1] : '30,60,90').split(',').map(Number);
const pairIdx = args.indexOf('--pair');
const pairFile = pairIdx >= 0 ? args[pairIdx + 1] : null;

function load(f) {
  const rows = new Map();
  const text = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8');
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    rows.set(r.turn, r);
  }
  return rows;
}
const median = a => {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const ai = row => row.owners.filter(o => o.owner !== 0);

function stats(row, ownerSet) {
  const os = ai(row).filter(o => !ownerSet || ownerSet.has(o.owner));
  const withUnits = os.filter(o => o.jednostkiWojskowe > 0);
  const perEpoka = {};
  for (const o of os) {
    const e = (o.hud && o.hud.epoka) != null ? o.hud.epoka : '?';
    perEpoka[e] = (perEpoka[e] || 0) + (o.jednostkiWojskowe || 0);
  }
  const sum = k => os.reduce((s, o) => s + (o[k] || 0), 0);
  const gold = os.map(o => o.skarbiec || 0);
  return {
    owneryZRekordem: os.length,
    owneryZJednostka: withUnits.length,
    jednostkiSuma: sum('jednostkiWojskowe'),
    jednostkiPerEpoka: perEpoka,
    utrzymaniePieniadzTura: sum('utrzymanieJednostekPieniadz'),
    zywnoscArmiiTura: sum('zywnoscArmiiTura'),
    zlotoSuma: gold.reduce((s, x) => s + x, 0),
    zlotoMediana: median(gold),
    deficytZlota: os.filter(o => o.deficytZlota).length,
    glodWojska: os.filter(o => o.glodWojska).length,
  };
}

const A = load(file);
const B = pairFile ? load(pairFile) : null;
const out = { plik: file, tury: {} };
for (const t of turns) {
  const rowA = A.get(t);
  if (!rowA) { out.tury[t] = 'brak wiersza'; continue; }
  const entry = { wszyscy: stats(rowA, null) };
  if (B && B.get(t)) {
    const idsB = new Set(ai(B.get(t)).map(o => o.owner));
    const common = new Set(ai(rowA).map(o => o.owner).filter(id => idsB.has(id)));
    entry.wspolniWzgledemDrugiego = { liczbaWspolnych: common.size, ...stats(rowA, common) };
  }
  out.tury[t] = entry;
}
console.log(JSON.stringify(out, null, 2));
