'use strict';
/**
 * gen-tech-cards-top5.cjs — R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1 (część B).
 *
 * Generuje `gra/data/tech-cards-top5.json` (treść kart odkryć: TOP 5 korzyści,
 * „Co możesz teraz zrobić” w schemacie CZYNNOŚĆ → KORZYŚĆ, lista efektów ukrytych)
 * z dwóch źródeł:
 *   1. `odkrycia-top5.csv` (FC 58339997b tematu R-WEB-TECH-CARDS-TOP3-BENEFITS-ANALYSIS-Q1)
 *      — tytuły Top1..Top5, dowody plik:linia, kolumna Co_mozesz_zrobic_PROPOZYCJA;
 *   2. `gen-tech-cards-top5.zdania.json` (obok) — jedno zdanie wyjaśnienia na pozycję
 *      (decyzja właściciela Q1: tytuł z liczbą + jedno zdanie), kolejność pozycji,
 *      świadome nadpisania tytułu (z powodem) i pozycje pominięte (z powodem).
 * Reguła „ukryte” (Q3/Q4 właściciela — efekty martwe ukryte do czasu naprawy): budynek
 * odkrycia z `suppressed: true` albo `epokaWejscia` > MAX_GRYWALNA_EPOKA (production.ts:966
 * blokuje budynki z wyższej epoki) + `ukryteDodatkowe` z pliku zdań.
 *
 * Odtwarzalność: wynik jest deterministyczny (stała kolejność kluczy = kolejność tech.json,
 * bez znaczników czasu). `--check` porównuje wynik z plikiem na dysku i kończy kodem 1
 * przy różnicy (bramka „dane zgodne z generatorem”).
 *
 * Usage (z gra/):
 *   node tools/gen-tech-cards-top5.cjs [ścieżka-do-csv] [--check]
 * Domyślne CSV (pierwsze istniejące):
 *   ../dyspozycje/analizy/karty-odkryc/odkrycia-top5.csv
 *   ../dyspozycje/autobot/runs/R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/odkrycia-top5.csv
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1: wspólne reguły „podatek vs handel” + korekta językowa tekstów z CSV.
const { normalizeCsvText } = require('./terminology-trade-vs-tax.cjs');

const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const OUT = path.join(GRA, 'data', 'tech-cards-top5.json');
const ZDANIA = path.join(__dirname, 'gen-tech-cards-top5.zdania.json');
const MAX_GRYWALNA_EPOKA = 3; // Kamień=1, Brąz=2, Żelazo=3 (improvement-tech.ts EPOKA_LABEL)

const SLOTS = ['Top1_GLOWNA', 'Top2', 'Top3', 'Top4', 'Top5'];

function parseCsv(txt) {
  txt = txt.replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) {
      if (c === '"') {
        if (txt[i + 1] === '"') { f += '"'; i++; } else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === ';') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((k, i) => [k, r[i] ?? ''])));
}

/** Pierwsza KLUCZOWA liczba/współczynnik w tytule (×1,50 · +50 · +100% · −30% · 5 → 8 ·
 * 3× · z 1 do 2 · 400 HP · 33 pkt · 6 pól). Gołe liczby bez jednostki/znaku (np. „2 glina”)
 * NIE są liczbą pozycji — pole jest wtedy pominięte (opcjonalne w kontrakcie). */
function liczbaOf(tytul) {
  const re = /×\s?\d+(?:[,.]\d+)?|[+−]\d+(?:[,.]\d+)?%?|\d+(?:[,.]\d+)?%|\d+\s?→\s?\d+|\d+×|z \d+ do \d+|do \d+|\d+ (?:HP|pkt|pól|pola)/;
  const m = tytul.match(re);
  return m ? m[0].trim() : undefined;
}

/** `Dowod_plik_linia` = "Top1: a; b || Top2: c" → { Top1: 'a; b', Top2: 'c' }. */
function dowodyOf(raw) {
  const out = {};
  for (const part of String(raw || '').split('||')) {
    const m = part.trim().match(/^Top(\d):\s*(.*)$/);
    if (m) out['Top' + m[1]] = m[2].trim();
  }
  return out;
}

function slotNr(slot) { return slot === 'Top1_GLOWNA' ? 'Top1' : slot; }

function cmzOf(raw) {
  const s = String(raw || '').trim();
  if (s === '' || s.startsWith('NIE_USTALONO')) return [];
  return s.split(' | ').map((zd) => {
    const t = zd.trim().replace(/\.$/, '');
    const idx = t.indexOf(', aby ');
    if (idx < 0) throw new Error('CMZ bez „, aby ”: ' + zd);
    return { czynnosc: t.slice(0, idx).trim(), korzysc: t.slice(idx + ', aby '.length).trim() };
  });
}

function findCsv(argPath) {
  const cands = argPath ? [path.resolve(argPath)] : [
    path.join(REPO, 'dyspozycje/analizy/karty-odkryc/odkrycia-top5.csv'),
    path.join(REPO, 'dyspozycje/autobot/runs/R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/odkrycia-top5.csv'),
  ];
  for (const c of cands) if (fs.existsSync(c)) return c;
  throw new Error('Nie znaleziono odkrycia-top5.csv; sprawdzone: ' + cands.join(', '));
}

function generate(csvPath) {
  const csvTxt = fs.readFileSync(csvPath, 'utf8');
  const csv = parseCsv(csvTxt);
  const zdania = JSON.parse(fs.readFileSync(ZDANIA, 'utf8'));
  const techs = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8')).technologie;
  const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
  const byName = new Map(csv.map((r) => [r.Odkrycie, r]));

  const errors = [];
  const out = {
    _meta: {
      temat: 'R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1',
      generator: 'gra/tools/gen-tech-cards-top5.cjs (+ gen-tech-cards-top5.zdania.json)',
      zrodloCsv: 'odkrycia-top5.csv (FC 58339997b, docs bdf44fd9d)',
      csvSha256: crypto.createHash('sha256').update(csvTxt).digest('hex'),
      pola: 'top5:[{tytul, liczba?, zdanie, dowod?}] · cmz:[{czynnosc, korzysc}] · ukryte:[nazwy efektów martwych ukrytych z karty]',
    },
  };

  for (const t of techs) {
    const name = t.Technologia;
    const row = byName.get(name);
    const z = zdania[name];
    if (!row) { errors.push(`${name}: brak wiersza w CSV`); continue; }
    if (!z) { errors.push(`${name}: brak wpisu w pliku zdań`); continue; }
    const dowody = dowodyOf(row.Dowod_plik_linia);
    const used = new Set();
    const top5 = (z.top5 || []).map((e) => {
      if (!SLOTS.includes(e.z)) errors.push(`${name}: nieznana kolumna ${e.z}`);
      const csvTitle = String(row[e.z] || '').trim();
      if (csvTitle === '' || csvTitle.startsWith('NIE_USTALONO')) errors.push(`${name}: ${e.z} = NIE_USTALONO nie może trafić na kartę`);
      if (e.tytul && !e.powodTytulu) errors.push(`${name}: nadpisanie tytułu ${e.z} bez powodu`);
      if (!e.zdanie || !String(e.zdanie).trim()) errors.push(`${name}: ${e.z} bez zdania`);
      used.add(e.z);
      // Tytuł z CSV przechodzi przez normalizację terminologii (A: „+N handlu” → „+N podatku”,
      // korekta „— klucza” → „— klucz”); jawne nadpisanie `e.tytul` jest już redagowane ręcznie.
      const tytul = (e.tytul || normalizeCsvText(csvTitle)).trim();
      const item = { tytul };
      const liczba = liczbaOf(tytul);
      if (liczba) item.liczba = liczba;
      item.zdanie = String(e.zdanie).trim();
      const dowod = dowody[slotNr(e.z)];
      if (dowod) item.dowod = dowod;
      return item;
    });
    for (const p of z.pominiete || []) {
      if (!p.powod) errors.push(`${name}: pominięcie ${p.z} bez powodu`);
      used.add(p.z);
    }
    for (const s of SLOTS) {
      const v = String(row[s] || '').trim();
      if (v && !v.startsWith('NIE_USTALONO') && !used.has(s)) errors.push(`${name}: pozycja CSV ${s} („${v}”) ani użyta, ani pominięta`);
    }
    if (top5.length > 5) errors.push(`${name}: więcej niż 5 pozycji`);

    const ukryte = buildings
      .filter((b) => b.techUnlock === name && (b.suppressed === true || (b.epokaWejscia ?? 1) > MAX_GRYWALNA_EPOKA))
      .map((b) => b.nazwa || b.id)
      .concat(z.ukryteDodatkowe || []);

    let cmz = cmzOf(normalizeCsvText(row.Co_mozesz_zrobic_PROPOZYCJA));
    for (const zm of z.cmzZamiany || []) {
      if (!zm.powod) errors.push(`${name}: zamiana CMZ „${zm.z}” bez powodu`);
      let hit = false;
      cmz = cmz.map((c) => {
        const czynnosc = c.czynnosc.split(zm.z).join(zm.na);
        const korzysc = c.korzysc.split(zm.z).join(zm.na);
        if (czynnosc !== c.czynnosc || korzysc !== c.korzysc) hit = true;
        return { czynnosc, korzysc };
      });
      if (!hit) errors.push(`${name}: zamiana CMZ „${zm.z}” nie trafiła w żaden tekst`);
    }
    out[name] = { top5, cmz, ukryte };
  }
  for (const n of byName.keys()) if (!techs.some((t) => t.Technologia === n)) errors.push(`CSV: osierocony wiersz „${n}” (brak w tech.json)`);
  for (const n of Object.keys(zdania)) if (!n.startsWith('_') && !techs.some((t) => t.Technologia === n)) errors.push(`zdania: osierocony wpis „${n}”`);
  return { out, errors };
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const csvArg = args.find((a) => !a.startsWith('--'));
  const csvPath = findCsv(csvArg);
  const { out, errors } = generate(csvPath);
  if (errors.length) {
    console.error('[gen-tech-cards-top5] BŁĘDY:\n  ' + errors.join('\n  '));
    process.exit(1);
  }
  const text = JSON.stringify(out, null, 2) + '\n';
  if (check) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== text) { console.error('[gen-tech-cards-top5] --check: tech-cards-top5.json NIEZGODNY z generatorem'); process.exit(1); }
    console.log('[gen-tech-cards-top5] --check OK (' + path.relative(REPO, csvPath) + ')');
    return;
  }
  fs.writeFileSync(OUT, text, 'utf8');
  const n = Object.keys(out).filter((k) => !k.startsWith('_')).length;
  console.log(`[gen-tech-cards-top5] zapisano ${path.relative(REPO, OUT)}: ${n} odkryć (CSV: ${path.relative(REPO, csvPath)})`);
}

if (require.main === module) main();
module.exports = { generate, parseCsv, liczbaOf };
