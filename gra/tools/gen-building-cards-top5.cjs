'use strict';
/**
 * gen-building-cards-top5.cjs — R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1 (część B).
 *
 * Generuje `gra/data/building-cards-top5.json` (treść kart budynków: TOP 5 korzyści,
 * „Co możesz teraz zrobić” w schemacie CZYNNOŚĆ → KORZYŚĆ, flaga `ukryty` dla budynków
 * niedostępnych, opcjonalny `opisKarty`) z dwóch źródeł:
 *   1. `budynki-top5.csv` (FC c828a978f tematu R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1,
 *      docs 1c5009f71) — komórki Top1..Top5 w formacie „Tytuł — jedno zdanie”, dowody
 *      plik:linia, kolumna Co_mozesz_zrobic_PROPOZYCJA, Status_TOP5;
 *   2. `gen-building-cards-top5.korekty.json` (obok) — świadome korekty treści, każda
 *      z powodem: decyzja właściciela (5) (FALA 560: Pałac II/III i Trybunał −30% korupcji),
 *      decyzja (4) (odwołania do efektów martwych ukryte), założenie Q6-A (dopisek „podbite
 *      miasta” przy asymilacji), jawny podział komórek z kilkoma myślnikami.
 *
 * Kontrakt wpisu (klucz = `id` budynku z buildings.json):
 *   { top5: [{ tytul, liczba?, zdanie, rodzaj: 'efekt'|'warunek'|'rozbudowa', dowod? }],
 *     cmz: [{ czynnosc, korzysc }], ukryty?: true, opisKarty?: string }
 * Reguły (decyzje właściciela 2026-11-08): tylko realne pozycje (bez dopełniania do 5),
 * Top1 zawsze `rodzaj: 'efekt'` (warunek/rozbudowa tylko Top2–Top5), budynek niedostępny
 * (`suppressed` albo `epokaWejscia` > 3 — production.ts:966) = `ukryty: true` bez treści.
 *
 * Odtwarzalność: wynik deterministyczny (kolejność kluczy = kolejność buildings.json, bez
 * znaczników czasu). `--check` porównuje z plikiem na dysku i kończy kodem 1 przy różnicy.
 *
 * Usage (z gra/):
 *   node tools/gen-building-cards-top5.cjs [ścieżka-do-csv] [--check]
 * Domyślne CSV (pierwsze istniejące):
 *   ../dyspozycje/analizy/karty-budynkow/budynki-top5.csv
 *   ../dyspozycje/autobot/runs/R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/budynki-top5.csv
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseCsv, liczbaOf } = require('./gen-tech-cards-top5.cjs');

const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const OUT = path.join(GRA, 'data', 'building-cards-top5.json');
const KOREKTY = path.join(__dirname, 'gen-building-cards-top5.korekty.json');
const MAX_GRYWALNA_EPOKA = 3; // Kamień=1, Brąz=2, Żelazo=3 — production.ts:966
const SLOTS = ['Top1_GLOWNA', 'Top2', 'Top3', 'Top4', 'Top5'];
const SEP = ' — ';

function slotNr(slot) { return slot === 'Top1_GLOWNA' ? 'Top1' : slot; }

/** `Dowod_plik_linia` = "Top1: a; b || Top2: c" → { Top1: 'a; b', Top2: 'c' }. */
function dowodyOf(raw) {
  const out = {};
  for (const part of String(raw || '').split('||')) {
    const m = part.trim().match(/^Top(\d):\s*(.*)$/);
    if (m) out['Top' + m[1]] = m[2].trim();
  }
  return out;
}

/** Rodzaj pozycji (decyzja (3): warunek/rozbudowa nigdy na Top1). */
function rodzajOf(tytul) {
  if (/^Rozbudowa\b/.test(tytul)) return 'rozbudowa';
  if (/^(Warunek|Otwiera)\b/.test(tytul)) return 'warunek';
  return 'efekt';
}

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

function isDeadBuilding(b) {
  return b.suppressed === true || (Number(b.epokaWejscia) || 1) > MAX_GRYWALNA_EPOKA;
}

function findCsv(argPath) {
  const cands = argPath ? [path.resolve(argPath)] : [
    path.join(REPO, 'dyspozycje/analizy/karty-budynkow/budynki-top5.csv'),
    path.join(REPO, 'dyspozycje/autobot/runs/R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/budynki-top5.csv'),
  ];
  for (const c of cands) if (fs.existsSync(c)) return c;
  throw new Error('Nie znaleziono budynki-top5.csv; sprawdzone: ' + cands.join(', '));
}

function generate(csvPath) {
  const csvTxt = fs.readFileSync(csvPath, 'utf8');
  const csv = parseCsv(csvTxt);
  const korekty = JSON.parse(fs.readFileSync(KOREKTY, 'utf8'));
  const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
  const byName = new Map(csv.map((r) => [r.Budynek, r]));
  const kb = korekty.budynki || {};
  const podzialOk = korekty._podzialPierwszyOk || {};

  const errors = [];
  const out = {
    _meta: {
      temat: 'R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1',
      generator: 'gra/tools/gen-building-cards-top5.cjs (+ gen-building-cards-top5.korekty.json)',
      zrodloCsv: 'budynki-top5.csv (FC c828a978f, docs 1c5009f71)',
      csvSha256: crypto.createHash('sha256').update(csvTxt).digest('hex'),
      pola: "top5:[{tytul, liczba?, zdanie, rodzaj:'efekt'|'warunek'|'rozbudowa', dowod?}] · cmz:[{czynnosc, korzysc}] · ukryty?:true · opisKarty?",
    },
  };

  for (const b of buildings) {
    const name = b.nazwa;
    const row = byName.get(name);
    if (!row) { errors.push(`${b.id} („${name}”): brak wiersza w CSV`); continue; }
    const k = kb[name] || {};
    const dead = isDeadBuilding(b);
    const status = String(row.Status_TOP5 || '');
    if (dead !== status.startsWith('NIE_USTALONO')) {
      errors.push(`${name}: niespójność — budynek ${dead ? 'niedostępny' : 'dostępny'}, a Status_TOP5 = „${status.slice(0, 40)}”`);
    }
    if (dead) {
      out[b.id] = { top5: [], cmz: [], ukryty: true };
      continue;
    }
    if (!status.startsWith('FINALNE')) errors.push(`${name}: Status_TOP5 ≠ FINALNE („${status.slice(0, 40)}”)`);

    const dowody = dowodyOf(row.Dowod_plik_linia);
    const zmiany = new Map((k.zmiany || []).map((z) => [z.z, z]));
    for (const z of k.zmiany || []) {
      if (!z.powod) errors.push(`${name}: zmiana ${z.z} bez powodu`);
      if (!SLOTS.includes(z.z)) errors.push(`${name}: zmiana w nieznanej kolumnie ${z.z}`);
    }
    if (k.podzial && !k.powodPodzialu) errors.push(`${name}: jawny podział bez powodu`);

    const items = [];
    for (const s of SLOTS) {
      const cell = String(row[s] || '').trim();
      if (cell === '') continue;
      if (cell.startsWith('NIE_USTALONO')) { errors.push(`${name}: ${s} = NIE_USTALONO przy statusie FINALNE`); continue; }
      let tytul;
      let zdanie;
      if (k.podzial && k.podzial[s]) {
        [tytul, zdanie] = k.podzial[s];
        if (`${tytul}${SEP}${zdanie}` !== cell) errors.push(`${name}: jawny podział ${s} nie odtwarza komórki CSV`);
      } else {
        const n = cell.split(SEP).length - 1;
        if (n === 0) { errors.push(`${name}: ${s} bez separatora „ — ” (tytuł — zdanie)`); continue; }
        if (n > 1 && !(podzialOk[name] || []).includes(s)) {
          errors.push(`${name}: ${s} ma ${n} separatory „ — ” — dodaj jawny podział albo wpis w _podzialPierwszyOk`);
        }
        const i = cell.indexOf(SEP);
        tytul = cell.slice(0, i).trim();
        zdanie = cell.slice(i + SEP.length).trim();
      }
      const z = zmiany.get(s);
      if (z) {
        if (z.tytul) tytul = z.tytul;
        if (z.zdanie) zdanie = z.zdanie;
        zmiany.delete(s);
      }
      const item = { tytul };
      const liczba = liczbaOf(tytul);
      if (liczba) item.liczba = liczba;
      item.zdanie = zdanie;
      item.rodzaj = rodzajOf(tytul);
      const dowod = dowody[slotNr(s)];
      if (dowod) item.dowod = dowod;
      items.push({ slot: s, item });
    }
    for (const left of zmiany.keys()) errors.push(`${name}: zmiana ${left} nie trafiła w żadną pozycję CSV`);

    for (const w of k.wstaw || []) {
      if (!w.powod) errors.push(`${name}: wstawienie „${w.tytul}” bez powodu`);
      const item = { tytul: w.tytul };
      const liczba = liczbaOf(w.tytul);
      if (liczba) item.liczba = liczba;
      item.zdanie = w.zdanie;
      item.rodzaj = rodzajOf(w.tytul);
      if (w.dowod) item.dowod = w.dowod;
      const at = w.przed ? items.findIndex((x) => x.slot === w.przed) : -1;
      if (w.przed && at < 0) errors.push(`${name}: wstawienie przed ${w.przed} — brak takiej pozycji`);
      if (at < 0) items.push({ slot: 'wstaw', item });
      else items.splice(at, 0, { slot: 'wstaw', item });
    }

    const top5 = items.map((x) => x.item);
    if (top5.length < 1 || top5.length > 5) errors.push(`${name}: ${top5.length} pozycji (wymagane 1–5)`);
    if (top5[0] && top5[0].rodzaj !== 'efekt') errors.push(`${name}: Top1 rodzaj „${top5[0].rodzaj}” — Top1 musi być efektem (decyzja (3))`);
    for (const it of top5) {
      if (!it.tytul || !it.zdanie) errors.push(`${name}: pozycja bez tytułu albo zdania`);
    }

    let cmz;
    if (k.cmz) {
      if (!k.powodCmz) errors.push(`${name}: nadpisanie CMZ bez powodu`);
      cmz = k.cmz.map((c) => ({ czynnosc: c.czynnosc, korzysc: c.korzysc }));
    } else {
      cmz = cmzOf(row.Co_mozesz_zrobic_PROPOZYCJA);
    }
    if (cmz.length < 1 || cmz.length > 3) errors.push(`${name}: CMZ ma ${cmz.length} zdań (wymagane 1–3)`);

    const entry = { top5, cmz };
    if (k.opisKarty) {
      if (!k.powodOpisu) errors.push(`${name}: opisKarty bez powodu`);
      entry.opisKarty = k.opisKarty;
    }
    out[b.id] = entry;
  }
  for (const n of byName.keys()) if (!buildings.some((b) => b.nazwa === n)) errors.push(`CSV: osierocony wiersz „${n}” (brak w buildings.json)`);
  for (const n of Object.keys(kb)) if (!buildings.some((b) => b.nazwa === n)) errors.push(`korekty: osierocony wpis „${n}”`);
  return { out, errors };
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const csvArg = args.find((a) => !a.startsWith('--'));
  const csvPath = findCsv(csvArg);
  const { out, errors } = generate(csvPath);
  if (errors.length) {
    console.error('[gen-building-cards-top5] BŁĘDY:\n  ' + errors.join('\n  '));
    process.exit(1);
  }
  const text = JSON.stringify(out, null, 2) + '\n';
  if (check) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== text) { console.error('[gen-building-cards-top5] --check: building-cards-top5.json NIEZGODNY z generatorem'); process.exit(1); }
    console.log('[gen-building-cards-top5] --check OK (' + path.relative(REPO, csvPath) + ')');
    return;
  }
  fs.writeFileSync(OUT, text, 'utf8');
  const n = Object.keys(out).filter((key) => !key.startsWith('_')).length;
  console.log(`[gen-building-cards-top5] zapisano ${path.relative(REPO, OUT)}: ${n} budynków (CSV: ${path.relative(REPO, csvPath)})`);
}

if (require.main === module) main();
module.exports = { generate, rodzajOf, isDeadBuilding };
