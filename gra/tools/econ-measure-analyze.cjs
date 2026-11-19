'use strict';
/**
 * econ-measure-analyze.cjs -- R-WEB-ECONOMY-MEASURE-EXTEND-INCOME-STOCKS-Q1: analizator pomiaru ekonomii.
 * Czyta <in>/seed*.jsonl (wiersze z `owners[].hud`, zapisane przez ai-economy-measure-run.cjs) i drukuje:
 *   (1) tabele per tura kontrolna (10, 25, 50, 75, 100, 125, 150; najblizszy rekord o turze <= kontrolnej)
 *       per wlasciciel: miasta, populacja, epoka, skarbiec, praca, surowce brutto/netto (suma jak HUD),
 *       spichlerz, liczba budynkow; tempo wzrostu (x) surowcow brutto miedzy punktami kontrolnymi;
 *   (2) "wyjasnienie HUD": suma Surowce brutto wg HUD (wszystkie wiersze z cap) vs suma 3 surowcow modelu
 *       (etykiety /cegl|elaz|ceram/i) na TYCH SAMYCH rekordach, stosunek.
 * (R-WEB-ECONOMY-MEASURE-PLAYER-AUTOPILOT-Q1: sekcja "Gracz (autopilot)" dla wl 0, co 10 tur, tylko gdy >=1 miasto.)
 * Tylko odczyt plikow; liczby z surowego jsonl, bez wlasnych wzorow. Brak pola -> '-'.
 *
 * Uzycie: node tools/econ-measure-analyze.cjs --in <abs-katalog> [--json <abs-plik-wyjscia>]
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const IN = path.resolve(arg('in', '.'));
const CHECK = [10, 25, 50, 75, 100, 125, 150];
const MODEL_RE = /ceg|elaz|ceram/i;

function loadRecords(dir) {
  const out = [];
  const files = fs.readdirSync(dir).filter(n => /^seed\d+\.jsonl$/.test(n)).sort();
  for (const f of files) {
    const seed = f.match(/\d+/)[0];
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean);
    for (const ln of lines) {
      let rec;
      try { rec = JSON.parse(ln); } catch (_) { continue; }
      if (typeof rec.turn === 'number' && Array.isArray(rec.owners)) out.push({ seed, turn: rec.turn, owners: rec.owners });
    }
  }
  return out;
}

/** Najblizszy rekord o turze <= t dla danego ziarna. */
function pickAt(records, seed, t) {
  let best = null;
  for (const r of records) {
    if (r.seed !== seed || r.turn > t) continue;
    if (!best || r.turn > best.turn) best = r;
  }
  return best;
}

function fmt(v) {
  if (v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))) return '-';
  if (typeof v === 'number') return String(Math.round(v * 100) / 100);
  return String(v);
}

function main() {
  const records = loadRecords(IN);
  if (records.length === 0) {
    console.error('Brak wierszy seed*.jsonl w ' + IN);
    process.exit(2);
  }
  const seeds = [...new Set(records.map(r => r.seed))];
  const report = { in: IN, seeds: {} };
  for (const seed of seeds) {
    const rows = [];
    const expl = [];
    for (const t of CHECK) {
      const rec = pickAt(records, seed, t);
      if (!rec) continue;
      for (const o of rec.owners) {
        const h = o.hud || {};
        rows.push({
          turaKontrolna: t, turaRekordu: rec.turn, owner: o.owner, miasta: o.miasta, populacja: h.populacja,
          epoka: h.epoka, skarbiecStan: h.skarbiecStan, skarbiecRate: h.skarbiecRate, praca: h.praca,
          pracaRate: h.pracaRate, pracaUpkeep: h.pracaUpkeep, surowceBrutto: h.surowceBrutto,
          surowceNetto: h.surowceNetto, spichlerzStan: h.spichlerzStan, spichlerzRate: h.spichlerzRate,
          budynki: h.budynkiPerTyp ? Object.values(h.budynkiPerTyp).reduce((a, b) => a + b, 0) : null,
        });
      }
      const hudSum = rec.owners.reduce((a, o) => a + ((o.hud && o.hud.surowceBrutto) || 0), 0);
      const modelSum = rec.owners.reduce((a, o) => a + ((o.hud && o.hud.surowceTyp) || [])
        .filter(r => MODEL_RE.test(String(r.typ)))
        .reduce((x, r) => x + (r.brutto || 0), 0), 0);
      expl.push({
        turaKontrolna: t, turaRekordu: rec.turn,
        hudBruttoWszyscy: Math.round(hudSum * 100) / 100,
        modelBruttoTrzy: Math.round(modelSum * 100) / 100,
        stosunek: modelSum > 0 ? Math.round((hudSum / modelSum) * 100) / 100 : null,
      });
    }
    const growth = [];
    for (let i = 1; i < CHECK.length; i++) {
      const a = rows.filter(r => r.turaKontrolna === CHECK[i - 1]);
      const b = rows.filter(r => r.turaKontrolna === CHECK[i]);
      for (const rb of b) {
        const ra = a.find(x => x.owner === rb.owner);
        if (!ra || !ra.surowceBrutto) continue;
        growth.push({
          owner: rb.owner, odTury: CHECK[i - 1], doTury: CHECK[i],
          xBruttoSurowce: Math.round((rb.surowceBrutto / ra.surowceBrutto) * 100) / 100,
        });
      }
    }
    report.seeds[seed] = { wiersze: rows, wyjasnienieHud: expl, tempoWzrostu: growth };
    console.log('\n=== ziarno ' + seed + ' ===');
    console.log('Tura | wl | miasta | pop | epoka | skarb.stan | skarb.+ | praca | praca+ | utrz.praca | surowce brutto | netto | spichl.stan | budynki');
    for (const r of rows) {
      // R-WEB-ECONOMY-MEASURE-PLAYER-AUTOPILOT-Q1: wiersz gracza (wl 0) oznaczony w glownej tabeli.
      const etykieta = r.owner === 0 ? ' (gracz)' : '';
      console.log([r.turaKontrolna, r.owner + etykieta, r.miasta, r.populacja, r.epoka, r.skarbiecStan, r.skarbiecRate, r.praca,
        r.pracaRate, r.pracaUpkeep, r.surowceBrutto, r.surowceNetto, r.spichlerzStan, r.budynki].map(fmt).join(' | '));
    }
    console.log('\nWyjasnienie HUD (suma Surowce brutto wg HUD vs 3 surowce modelu, te same rekordy):');
    for (const e of expl) {
      console.log('t' + e.turaKontrolna + ' (rekord t' + e.turaRekordu + '): HUD=' + fmt(e.hudBruttoWszyscy) +
        ' model3=' + fmt(e.modelBruttoTrzy) + ' stosunek=' + fmt(e.stosunek));
    }
    console.log('\nTempo wzrostu surowcow brutto (x miedzy punktami kontrolnymi):');
    for (const g of growth) console.log('wl ' + g.owner + ': t' + g.odTury + '->t' + g.doTury + ' x' + fmt(g.xBruttoSurowce));
    // R-WEB-ECONOMY-MEASURE-PLAYER-AUTOPILOT-Q1: sekcja gracza (wl 0) tylko gdy gracz ma >=1 miasto w którymś rekordzie.
    // Co 10 tur (rekordy o turze podzielnej przez 10). Odczyt z tego samego jsonl (HUD), bez własnych wzorów.
    const playerRecs = records.filter(r => r.seed === seed && r.turn % 10 === 0
      && r.owners.some(o => o.owner === 0 && (o.miasta || 0) >= 1))
      .sort((a, b) => a.turn - b.turn);
    if (playerRecs.length > 0) {
      console.log('\nGracz (autopilot), wl 0, co 10 tur (HUD; tylko tury z >=1 miastem):');
      console.log('Tura | miasta | Surowce brutto (+X) | Surowce netto (+Y) | Praca | Praca+ | Spichlerz | Skarbiec | budynki');
      for (const rec of playerRecs) {
        const o = rec.owners.find(x => x.owner === 0);
        const h = o.hud || {};
        console.log([rec.turn, o.miasta, h.surowceBrutto, h.surowceNetto, h.praca, h.pracaRate, h.spichlerzStan,
          h.skarbiecStan, h.budynkiPerTyp ? Object.values(h.budynkiPerTyp).reduce((a, b) => a + b, 0) : null].map(fmt).join(' | '));
      }
      report.seeds[seed].graczAutopilot = playerRecs.map(rec => {
        const o = rec.owners.find(x => x.owner === 0);
        return { tura: rec.turn, miasta: o.miasta, hud: o.hud || null };
      });
    }
  }
  const jsonOut = arg('json', '');
  if (jsonOut) fs.writeFileSync(path.resolve(jsonOut), JSON.stringify(report, null, 2));
}

main();
