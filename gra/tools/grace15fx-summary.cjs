'use strict';
/**
 * grace15fx-summary.cjs -- R-WEB-GRACE15-EFFECTS-Q1 (GRACE15FX): zestawienie JSONL z grace15fx-run.cjs.
 * POMIAR, tylko odczyt plikow runu (zero zmian gry).
 * Uzycie: node tools/grace15fx-summary.cjs <etykieta=katalog> ...
 * Czyta seed*.jsonl oraz seed*.jsonl.gz z katalogu.
 *
 * Sekcja AI (tury 30 i 60; ostatni rekord tury wygrywa):
 *   aiCivs    -- cywilizacje AI (owner != 0 i != -1) z miasta > 0 lub jednostkiWojskowe > 0
 *   aiCities  -- suma miast AI
 *   aiUnits   -- suma jednostkiWojskowe AI
 *   aiEmpty   -- puste miasta AI (owners[].miastaWojsko[].wojsko === 0), jak aiempty-analyze.cjs
 *   aiGold    -- suma skarbca AI
 * Sekcja GRACZ (tury 1..30): pasywny gracz (owner 0), bez zakupow klikiem.
 *   skarbiec  -- skarbiec po turze (z rekordu; po dosypce bramki, jesli bypass.applied)
 *   dosypka   -- zloto dosypane harnessem przy blokadzie bramki (bypass.gold, tylko gdy applied)
 *   prognoza  -- hud.skarbiecRate (netto skarbca na ture wg gry)
 *   blokada   -- gateBlockedBeforeEnd (bramka skarbca zablokowala „Zakończ turę” przed dosypka)
 *   miasta / jedn -- miasta i jednostki wojskowe gracza (spadek miast = utrata miasta)
 * Brak pola w rekordzie -> wartosc null (nie zero).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function readText(file) {
  const buf = fs.readFileSync(file);
  return (file.endsWith('.gz') ? zlib.gunzipSync(buf) : buf).toString('utf8');
}

function loadRecs(dir) {
  const f = fs.readdirSync(dir).find(n => /^seed\d+\.jsonl(\.gz)?$/.test(n));
  if (!f) throw new Error('brak seed*.jsonl w ' + dir);
  const byTurn = new Map();
  for (const line of readText(path.join(dir, f)).trim().split('\n')) {
    if (!line) continue;
    const r = JSON.parse(line);
    byTurn.set(r.turn, r); // ostatni rekord tury wygrywa
  }
  return byTurn;
}

function aiStats(r) {
  const ai = (r.owners || []).filter(o => o.owner !== 0 && o.owner !== -1);
  let civs = 0; let cities = 0; let units = 0; let empty = 0; let gold = 0;
  for (const o of ai) {
    const mw = o.miastaWojsko || [];
    const e = mw.filter(c => c.wojsko === 0).length;
    if ((o.miasta || 0) > 0 || (o.jednostkiWojskowe || 0) > 0) civs += 1;
    cities += mw.length;
    units += o.jednostkiWojskowe || 0;
    empty += e;
    gold += o.skarbiec || 0;
  }
  return { civs, cities, units, empty, gold };
}

function playerRow(r) {
  const p = (r.owners || []).find(o => o.owner === 0) || {};
  const byp = r.bypass || {};
  const dosypka = byp.applied ? (byp.gold || 0) : 0;
  return {
    turn: r.turn,
    skarbiec: p.skarbiec ?? null,
    dosypka,
    prognoza: p.hud ? p.hud.skarbiecRate ?? null : null,
    blokada: r.gateBlockedBeforeEnd ?? null,
    miasta: p.miasta ?? null,
    jedn: p.jednostkiWojskowe ?? null,
  };
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) { console.error('uzycie: node tools/grace15fx-summary.cjs <etykieta=katalog> ...'); process.exit(2); }
  for (const a of args) {
    const i = a.indexOf('=');
    const label = a.slice(0, i); const dir = a.slice(i + 1);
    const recs = loadRecs(dir);
    console.log('== ' + label + ' (' + dir + ') tury: ' + recs.size);
    for (const t of [30, 60]) {
      const r = recs.get(t);
      if (!r) { console.log('  t' + t + ': brak rekordu'); continue; }
      const s = aiStats(r);
      console.log('  AI t' + t + ': civs=' + s.civs + ' miasta=' + s.cities + ' jednostki=' + s.units +
        ' puste=' + s.empty + ' (' + (s.cities ? (100 * s.empty / s.cities).toFixed(1) : '0.0') + '%) skarbiecSuma=' + s.gold);
    }
    console.log('  GRACZ (pasywny) tura: skarbiec | dosypka | prognoza | blokada | miasta | jedn');
    const rows = [];
    for (let t = 1; t <= 30; t += 1) {
      const r = recs.get(t);
      if (!r) continue;
      const p = playerRow(r);
      rows.push('  t' + t + ': ' + p.skarbiec + ' | ' + p.dosypka + ' | ' + p.prognoza + ' | ' + p.blokada + ' | ' + p.miasta + ' | ' + p.jedn);
    }
    console.log(rows.join('\n'));
  }
}

if (require.main === module) main();
module.exports = { aiStats, playerRow, loadRecs };
