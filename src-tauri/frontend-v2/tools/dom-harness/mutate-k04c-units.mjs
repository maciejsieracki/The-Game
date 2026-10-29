#!/usr/bin/env node
/**
 * mutate-k04c-units.mjs — kontrola czulosci harnessu `run-k04c-units.mjs` (P5-8 K04C batch 4a, R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1,
 * runda 2 / Operator-pomiary): wstrzykuje pojedyncze mutacje do kart `src/ui/cityPanel/k04c-*.ts` i `k04c-model.ts`
 * (8 jednostek batch 4a), uruchamia harness i oczekuje EXIT 1 (wykryta roznica). Zrodlo jest przywracane po kazdej mutacji (finally).
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k04c-units.mjs
 * EXIT 0 <=> wszystkie mutacje wykryte; 1 <=> >=1 mutacja niewykryta; 2 <=> blad setupu (tekst mutacji nieunikalny / blad harnessu).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(ROOT, 'src/ui/cityPanel');
const F = {
  porz: join(CITY, 'k04c-porzadek.ts'),
  kult: join(CITY, 'k04c-kultura.ts'),
  zam: join(CITY, 'k04c-zamoznosc.ts'),
  wyz: join(CITY, 'k04c-wyzywienie.ts'),
  model: join(CITY, 'k04c-model.ts'),
};

/** [plik, tekst oryginalny (musi wystapic dokladnie raz), tekst zmutowany, jednostka, opis] */
const MUTATIONS = [
  // 1. buildPorzadekDetailCard (pin :3427-3549)
  [F.porz, 'const sz = p.szPct;', 'const sz = p.prawPct;', 'Porzadek', 'SzPct czytany z PrawPct'],
  [F.porz, '      ? `${Math.round(sz)}% (${Math.round(i.szczescie)}/', '      ? `${Math.round(sz)}% (${Math.round(i.szczescie) + 1}/', 'Porzadek', 'Szczescie pkt +1'],
  [F.porz, '    p.prawMax != null\n      ? `${Math.round(praw)}%', '    p.prawMax == null\n      ? `${Math.round(praw)}%', 'Porzadek', 'warunek wiersza Prawo (prawMax)'],
  [F.porz, '  if (i.rebelActive) {', '  if (false) {', 'Porzadek', 'wiersz Rebelia pominiety'],
  [F.porz, '  if (p.prawLines.length > 0) {', '  if (p.prawLines.length > 1) {', 'Porzadek', 'sekcja Skladniki Prawa: prog dlugosci'],
  [F.porz, "      gridDetailRow(gp, l.label, `${l.value >= 0 ? '+' : ''}", "      gridDetailRow(gp, l.label, `${l.value > 0 ? '+' : ''}", 'Porzadek', 'znak wartosci skladnika Prawa (0)'],
  [F.porz, '  gridDetailRow(g0, \'Porządek łącznie\', `${Math.round(por)}% — ${bandName}`);', '  gridDetailRow(g0, \'Porządek łącznie\', `${Math.round(por) + 1}% — ${bandName}`);', 'Porzadek', 'PorPct wiersz +1'],
  [F.porz, 'szLinesDoWyswietlenia([...i.szLines])', 'szLinesDoWyswietlenia([])', 'Porzadek', 'skladniki Szczescia pominiete'],
  [F.porz, "bandNote.textContent = BAND_EXPLAIN[p.bandKey] ?? 'Patrz tabela progów poniżej.';", "bandNote.textContent = BAND_EXPLAIN[i.bandLabel as never] ?? 'Patrz tabela progów poniżej.';", 'Porzadek', 'opis pasma z etykiety zamiast bandKey'],
  // 2. buildKulturaDetailCard (pin :3836-3990)
  [F.kult, "gridDetailRow(gc, 'Przyrost', `+${cultState.przyrost}`);", "gridDetailRow(gc, 'Przyrost', `+${cultState.przyrost + 1}`);", 'Kultura', 'przyrost kultury +1'],
  [F.kult, 'gridDetailRow(gc, \'Suma kultury\', String(cultState.kulturaSuma));', 'gridDetailRow(gc, \'Suma kultury\', String(cultState.kulturaSuma + 1));', 'Kultura', 'suma kultury +1'],
  [F.kult, 'const next = cultState.thresholds.find(t => t > cultState.kulturaSuma);', 'const next = cultState.thresholds.find(t => t >= cultState.kulturaSuma);', 'Kultura', 'prog kultury: > zamiast >='],
  [F.kult, "gridDetailRow(gr, 'Skala Sz tej epoki', `±${xRel} pkt", "gridDetailRow(gr, 'Skala Sz tej epoki', `±${xRel + 1} pkt", 'Kultura', 'skala Sz epoki +1'],
  [F.kult, "gridDetailRow(gs, 'Wpływ na Szczęście', `${relSzPkt >= 0 ? '+' : ''}${relSzPkt} pkt`);", "gridDetailRow(gs, 'Wpływ na Szczęście', `${relSzPkt > 0 ? '+' : ''}${relSzPkt} pkt`);", 'Kultura', 'znak wplywu religii (0)'],
  [F.kult, "gridDetailRow(gs, 'Dominująca', relState.dominujaca);", "gridDetailRow(gs, 'Dominująca', relState.stateReligion);", 'Kultura', 'dominujaca z religii panstwa'],
  [F.kult, "gridDetailRow(gs, 'Udział wyznawców', `${relState.udzialPct}%`);", "gridDetailRow(gs, 'Udział wyznawców', `${relState.udzialPct + 1}%`);", 'Kultura', 'udzial wyznawcow +1'],
  [F.kult, "gridDetailRow(gr, 'Konwersja po podboju', `${relParams.konwersjaBazaPct}%", "gridDetailRow(gr, 'Konwersja po podboju', `${relParams.konwersjaBazaPct + 1}%", 'Kultura', 'parametr religii konwersjaBazaPct +1'],
  // 3. buildWealthDetailCard (pin :4824-4944)
  [F.zam, 'const spolEst = miastoMoney !== null ? Math.round(miastoMoney * pctSpol / 100) : null;', 'const spolEst = miastoMoney !== null ? Math.round(miastoMoney * pctSpol / 200) : null;', 'Zamoznosc', 'szacunek spolEst (dzielnik)'],
  [F.zam, 'const utrzymEst = miastoMoney !== null ? Math.round(rown * miastoMoney) : null;', 'const utrzymEst = miastoMoney !== null ? Math.round(rown * miastoMoney * 2) : null;', 'Zamoznosc', 'szacunek utrzymEst (x2)'],
  [F.zam, "gridDetailRow(g1, 'Mnożnik skarbca', `×${mnoz.toFixed(2).replace('.', ',')}`);", "gridDetailRow(g1, 'Mnożnik skarbca', `×${mnoz.toFixed(1).replace('.', ',')}`);", 'Zamoznosc', 'mnoznik skarbca: 1 miejsce po przecinku'],
  [F.zam, "gridDetailRow(g1, 'Wpływ na szczęście', `${signed(szcz)} zadowolonych`);", "gridDetailRow(g1, 'Wpływ na szczęście', `${signed(szcz + 1)} zadowolonych`);", 'Zamoznosc', 'wplyw na szczescie +1'],
  [F.zam, "gridDetailRow(g2, 'Saldo puli', `${signed(net)} (${net >= 0 ? 'rośnie' : 'maleje'})`);", "gridDetailRow(g2, 'Saldo puli', `${signed(net)} (${net > 0 ? 'rośnie' : 'maleje'})`);", 'Zamoznosc', 'saldo puli: kierunek dla 0'],
  [F.zam, "gridDetailRow(g1, 'Pula zamożności', `${Math.round(pula)} / ${Math.round(prog)} do", "gridDetailRow(g1, 'Pula zamożności', `${Math.round(pula)} / ${Math.round(prog) + 1} do", 'Zamoznosc', 'prog puli +1'],
  [F.zam, "gridDetailRow(g2, '→ koszt utrzymania W', `~${signed(utrzymEst)}`);", "gridDetailRow(g2, '→ koszt utrzymania W', `~${signed(-utrzymEst)}`);", 'Zamoznosc', 'znak kosztu utrzymania'],
  // 4. buildRacjeWzrostDetailCard (pin :5474-5579)
  [F.wyz, "gridDetailRow(g0, 'Obywatele (sloty)', String(i.population));", "gridDetailRow(g0, 'Obywatele (sloty)', String(i.population + 1));", 'Wyzywienie', 'liczba obywateli +1'],
  [F.wyz, 'const fed = i.fed;', 'const fed = true;', 'Wyzywienie', 'stan glodu z DTO ignorowany'],
  [F.wyz, "gridDetailRow(g2, 'Łącznie', fed ? `${signed(bd.total)}%` : '— (głód)');", "gridDetailRow(g2, 'Łącznie', fed ? `${signed(bd.total)}%` : '— (brak)');", 'Wyzywienie', 'etykieta glodu'],
  [F.wyz, "gridDetailRow(g2, 'Wyżywienie', `${signed(bd.racje)}%`);", "gridDetailRow(g2, 'Wyżywienie', `${signed(bd.racje + 1)}%`);", 'Wyzywienie', 'wiersz racji WZROST +1'],
  [F.wyz, "gridDetailRow(g2, 'Postęp do +1 obywatela', `${fmtDecPl(view.wzrostUlamkowy)} / 1`);", "gridDetailRow(g2, 'Postęp do +1 obywatela', `${fmtDecPl(view.wzrostUlamkowy)} / 2`);", 'Wyzywienie', 'mianownik postepu wzrostu'],
  [F.wyz, "gridDetailRow(g1, 'Wyżywienie', w.wyzwienieSummary);", "gridDetailRow(g1, 'Wyżywienie', '');", 'Wyzywienie', 'podsumowanie wyzywienia z silnika pominiete'],
  [F.wyz, "gridDetailRow(g3, 'Wojsko', `−${Math.round(tick.wojsko)} 🍞`);", "gridDetailRow(g3, 'Wojsko', `−${Math.round(tick.wojsko) + 1} 🍞`);", 'Wyzywienie', 'tick: wojsko +1'],
  // 5. model: religiaSzPunkty, resolveEmpireSnap, resolveCityHealth, hook testowy, formatter
  [F.model, 'return szPktDisplay(wplywSzczescieSzPkt);', 'return wplywSzczescieSzPkt;', 'religiaSzPunkty', 'zaokraglenie prezentacyjne pominiete'],
  [F.model, 'return engineSnap ?? { zloto };', 'return { zloto };', 'resolveEmpireSnap', 'snapshot silnika ignorowany (tylko skarbiec)'],
  [F.model, 'return { total: health.total, lines: health.lines, fromEngine: true };', 'return { total: health.total + 1, lines: health.lines, fromEngine: true };', 'resolveCityHealth', 'zdrowie total +1'],
  [F.model, 'return { total: health.total, lines: health.lines, fromEngine: true };', 'return { total: health.total, lines: [], fromEngine: true };', 'resolveCityHealth', 'linie zdrowia pominiete'],
  [F.model, 'const clamped = Math.min(skala.max, Math.max(skala.min, level));', 'const clamped = Math.max(skala.min, level);', 'formatWyzwienieLabel', 'zacisk gornej granicy skali'],
  [F.model, "return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');", "return Number.isInteger(v) ? String(v) : v.toFixed(1);", 'formatWyzwienieLabel', 'separator dziesietny (przecinek)'],
];

const results = [];
let setupError = false;
for (const [file, from, to, jednostka, opis] of MUTATIONS) {
  const original = readFileSync(file, 'utf8');
  const n = original.split(from).length - 1;
  if (n !== 1) {
    console.error(`mutate-k04c-units: tekst nieunikalny (${n}) dla: ${jednostka} / ${opis}`);
    setupError = true;
    continue;
  }
  try {
    writeFileSync(file, original.replace(from, to));
    const r = spawnSync(process.execPath, [join(ROOT, 'tools/dom-harness/run-k04c-units.mjs')], { cwd: ROOT, encoding: 'utf8' });
    const detected = r.status === 1;
    const blad = r.status !== 0 && r.status !== 1;
    results.push({ jednostka, opis, detected, status: r.status });
    console.log(`${detected ? 'WYKRYTA ' : blad ? 'BLAD-HARN' : 'NIEWYKR. '} exit=${r.status} [${jednostka}] ${opis}`);
  } finally {
    writeFileSync(file, original);
  }
}

const wykryte = results.filter((r) => r.detected).length;
console.log(`mutate-k04c-units: mutacje=${results.length} wykryte=${wykryte} niewykryte=${results.length - wykryte}`);
if (setupError) process.exit(2);
process.exit(wykryte === results.length ? 0 : 1);
