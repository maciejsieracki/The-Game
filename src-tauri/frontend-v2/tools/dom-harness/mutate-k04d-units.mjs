#!/usr/bin/env node
/**
 * mutate-k04d-units.mjs — kontrola czulosci harnessu `run-k04d-units.mjs` (P5-8 K04D, R-RUSTPORT-P5-8-CITYPANEL-K04D-Q1,
 * runda 1): wstrzykuje pojedyncze mutacje do kart `src/ui/cityPanel/k04d-*.ts`, uruchamia harness i oczekuje EXIT 1
 * (wykryta roznica). Zrodlo jest przywracane po kazdej mutacji (finally).
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k04d-units.mjs
 * EXIT 0 <=> wszystkie mutacje wykryte; 1 <=> >=1 mutacja niewykryta; 2 <=> blad setupu.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(ROOT, 'src/ui/cityPanel');
const F = {
  zycie: join(CITY, 'k04d-zycie.ts'),
  gosp: join(CITY, 'k04d-gospodarka.ts'),
  kult: join(CITY, 'k04d-kultura.ts'),
};

/** [plik, tekst oryginalny (musi wystapic dokladnie raz), tekst zmutowany, jednostka, opis] */
const MUTATIONS = [
  [F.zycie, "gridDetailRow(g1, 'Bilans lokalny', `${signed(foodSplit.total)} 🍞/t`);", "gridDetailRow(g1, 'Bilans lokalny', `${signed(foodSplit.total + 1)} 🍞/t`);", 'Zywnosc', 'bilans lokalny +1'],
  [F.zycie, "gridDetailRow(g3, 'Wojsko', `−${Math.round(tick.wojsko)} 🍞`);", "gridDetailRow(g3, 'Wojsko', `−${Math.round(tick.wojsko) + 1} 🍞`);", 'Zywnosc', 'wojsko magazynu +1'],
  [F.zycie, "    gridDetailRow(g1, 'Wyżywienie aktywne', wyzywienie.wyzwienieSummary);", "    gridDetailRow(g1, 'Wyżywienie aktywne', '');", 'Zywnosc', 'podsumowanie wyzywienia pominiete'],
  [F.zycie, "            : turns != null ? `za ≈ ${turns} ${pluralTur(turns)}`", "            : turns != null ? `za ≈ ${turns + 1} ${pluralTur(turns + 1)}`", 'Ludnosc', 'liczba tur do obywatela +1'],
  [F.zycie, "          : turns === 0 ? 'w tej turze'", "          : turns === 1 ? 'w tej turze'", 'Ludnosc', 'warunek „w tej turze”'],
  [F.zycie, '  if (health) {', '  if (false) {', 'Ludnosc', 'sekcja zdrowia pominieta'],
  [F.zycie, '    const fed = i.fed;', '    const fed = true;', 'Ludnosc', 'stan glodu z DTO ignorowany'],
  [F.gosp, "gridDetailRow(g0, 'Niebieski dopisek', `${signed(praca.doPuli)}", "gridDetailRow(g0, 'Niebieski dopisek', `${signed(praca.doBudynkow)}", 'Praca', 'niebieski dopisek z doBudynkow'],
  [F.gosp, "gridDetailRow(gImp, 'Wpływy brutto', signed(wplywy - handel));", "gridDetailRow(gImp, 'Wpływy brutto', signed(wplywy + handel));", 'Zloto', 'wplywy brutto: znak handlu'],
  [F.gosp, "gridDetailRow(g0, 'Duża liczba 💰', `${skarb} — skarbiec całego państwa`);", "gridDetailRow(g0, 'Duża liczba 💰', `${skarb + 1} — skarbiec całego państwa`);", 'Zloto', 'stan skarbca +1 na pasku'],
  [F.gosp, "gridDetailRow(gCity, 'Pieniądz brutto', signed(moneySnap.pieniadzBrutto));", "gridDetailRow(gCity, 'Pieniądz brutto', signed(moneySnap.doSkarbca));", 'Zloto', 'galaz snapshotu: zla wartosc brutto'],
  [F.gosp, "  const mainVal = Math.round(isBank ? empire.nauka! : (empire.naukaRate ?? view.nauka));", "  const mainVal = Math.round(isBank ? empire.nauka! : (empire.naukaRate ?? view.kultura));", 'Nauka', 'produkcja nauki imperium z zlego pola'],
  [F.gosp, "gridDetailRow(g1, 'Pola i budynki', i.maBiblioteka ? 'Biblioteka + pola z nauką' : 'Głównie pola z nauką + budynki');", "gridDetailRow(g1, 'Pola i budynki', !i.maBiblioteka ? 'Biblioteka + pola z nauką' : 'Głównie pola z nauką + budynki');", 'Nauka', 'warunek biblioteki odwrocony'],
  [F.kult, "gridDetailRow(g1, 'Przyrost', `+${culture.przyrost}`);", "gridDetailRow(g1, 'Przyrost', `+${culture.przyrost + 1}`);", 'Kultura', 'przyrost kultury +1'],
  [F.kult, "gridDetailRow(g1, 'Granice', `+${culture.borderRadius} pierścieni wokół miasta`);", "gridDetailRow(g1, 'Granice', `+${culture.borderRadius + 1} pierścieni wokół miasta`);", 'Kultura', 'granice +1'],
  [F.kult, '  const xRelTop = i.skalaSzEpoki;', '  const xRelTop = i.skalaSzEpoki + 1;', 'Religia', 'skala Szczescia epoki +1'],
  [F.kult, "gridDetailRow(g0, 'Udział wiary', `${share}% ludności`);", "gridDetailRow(g0, 'Udział wiary', `${share + 1}% ludności`);", 'Religia', 'udzial wiary +1'],
];

const results = [];
let setupError = false;
for (const [file, from, to, unit, desc] of MUTATIONS) {
  const original = readFileSync(file, 'utf8');
  const n = original.split(from).length - 1;
  if (n !== 1) {
    console.log(`SETUP ${unit} / ${desc}: tekst oryginalny wystepuje ${n} razy (oczekiwano 1)`);
    setupError = true;
    continue;
  }
  try {
    writeFileSync(file, original.replace(from, to), 'utf8');
    const r = spawnSync(process.execPath, [join(ROOT, 'tools/dom-harness/run-k04d-units.mjs')], { cwd: ROOT, encoding: 'utf8' });
    const detected = r.status === 1;
    results.push({ unit, desc, detected, status: r.status });
    console.log(`${detected ? 'WYKRYTA ' : 'NIEWYKR.'} [${unit}] ${desc} (exit harnessu ${r.status})`);
  } finally {
    writeFileSync(file, original, 'utf8');
  }
}

const detectedCount = results.filter((r) => r.detected).length;
console.log(`mutate-k04d-units: mutacje=${results.length} wykryte=${detectedCount} niewykryte=${results.length - detectedCount}`);
if (setupError) process.exit(2);
process.exit(detectedCount === results.length ? 0 : 1);
