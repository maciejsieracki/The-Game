'use strict';
/**
 * notif-live-summarize.cjs — tabela typow komunikatow panelu z logow JSONL `notif-live-measure.cjs`.
 * R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1. Klasyfikacja zakladki = eventTabOf z biezacych zrodel
 * (dla logu PRZED to "gdzie by wpadl po zmianie"). Wypisuje markdown na stdout.
 *
 * Usage (z gra/): node tools/notif-live-summarize.cjs <log1.jsonl> [log2.jsonl ...]
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.notif-sum-entry.ts');
const BUNDLE = path.join(__dirname, '.notif-sum-bundle.cjs');
fs.writeFileSync(ENTRY, "export { eventTabOf } from '../src/ui/sidePanelEventTabs';\n");
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
const { eventTabOf } = require(BUNDLE);
process.on('exit', () => { for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch (e) { /* ignore */ } } });

const typeKey = (e) => ((e.title || '') + ' | ' + (e.subtitle || ''))
  .replace(/\d+(?:[.,]\d+)?/g, '#')
  .replace(/^([^|:]{1,30}): /, 'X: ')
  .replace(/\| ([^|:]{1,30}): /, '| X: ')
  .replace(/[A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźż-]+ ↔ [A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźż-]+/g, 'A ↔ B')
  .slice(0, 110);

const files = process.argv.slice(2);
const types = new Map();
let turns = 0;
let infoTotal = 0;
let infoVisibleOld = 0;
const perTurnInfo = [];
for (const f of files) {
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const o = JSON.parse(line);
    if (o.kind !== 'turn' || !Array.isArray(o.events)) continue;
    turns++;
    let nInfo = 0;
    const seen = new Set();
    for (const e of o.events) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      if (e.blocking) continue;
      nInfo++;
      infoTotal++;
      if (e.origin !== 'other-civs') infoVisibleOld++;
      const k = typeKey(e);
      const t = types.get(k) || { n: 0, turns: new Set(), tab: eventTabOf(e), kind: e.kind, sample: (e.title ? e.title + ' / ' : '') + e.subtitle };
      t.n++; t.turns.add(f + ':' + o.turnBefore);
      types.set(k, t);
    }
    perTurnInfo.push(nInfo);
  }
}
const rows = [...types.entries()].sort((a, b) => b[1].n - a[1].n);
console.log('Logi: ' + files.join(', '));
console.log('Tury: ' + turns + ' | wpisy informacyjne razem: ' + infoTotal + ' (widoczne wg dawnego chipa OFF: ' + infoVisibleOld + ') | srednio/ture: ' + (infoTotal / Math.max(1, turns)).toFixed(2) + ' | max/ture: ' + Math.max(0, ...perTurnInfo));
console.log('\n| # | typ (znormalizowany) | wystapien | tur z wpisem | zakladka (eventTabOf) |');
console.log('|---|---|---|---|---|');
rows.forEach(([k, t], i) => console.log('| ' + (i + 1) + ' | ' + k.replace(/\|/g, '/') + ' | ' + t.n + ' | ' + t.turns.size + ' | ' + t.tab + ' |'));
const byTab = { dyplomacja: 0, wazne: 0, inne: 0 };
for (const [, t] of rows) byTab[t.tab] += t.n;
console.log('\nPodzial na zakladki (wystapienia): ' + JSON.stringify(byTab));
