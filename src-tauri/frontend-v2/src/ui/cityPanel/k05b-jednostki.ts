/**
 * K05B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 2): karty jednostek i rekrutacji z DOM — partia 3 (3 jednostki z 19).
 * Każdy blok poprzedzony markerem `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` jest kopią linii A..B pinu, łącznie
 * z komentarzami (bramka `tools/dom-harness/verify-k05b-copies.mjs`). Jedyna zmiana bajtowa: `export ` przy deklaracji.
 * Reguły gry (pula rekrutów, koszt Manpower, łańcuch ulepszeń, mnożniki) przez `k05b-host.ts` (K05B-Z8); UI ich nie liczy.
 */
import { appendDetailSection, el, gridDetailRow } from './k01b-dom';
import { appendDetailGrid } from './k03-detail';
import { YIELD_BRAND } from './k01b-t';
import { formatBuildingYieldDetailValue, formatBuildingYieldScaleRow } from './k01b-r';
import { cityPanelChipIconWrap, isEmptyDataVal } from './k01a-fundament';
import { unitExtraField } from './k03-model';
import { unitInfographicMedallionHtml } from '../unitInfographic';
import { appendTechDetailBlock } from './k05b-karty';
import {
  cfg,
  civManpowerMaxMult,
  cumulativeMnoznikForBuildingId,
  buildingUiDisplayLevel,
  formatManpower,
  getProd,
  mnoznikRoleForBuildingId,
  unitManpowerCost,
  unitResourceUpkeep,
  upgradeChainSteps,
  upgradeCompositionLines,
  formatResourceUpkeepSummary,
} from './k05b-host';
import type { BuildingDef, City, GameData, UnitDef } from './k05b-host';
// pin edb8fb56 gra/src/ui/cityPanel.ts:8979-9030
export function buildUpgradeBonusDetailCard(
  def: BuildingDef,
  data: GameData,
  city?: City,
): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', `<span>Skład bonusów — ${def.nazwa}</span>`));
  const chain = upgradeChainSteps(def.id, data.buildings);
  if (chain.length > 1) {
    appendDetailSection(card, 'Łańcuch upgrade');
    const g0 = appendDetailGrid(card);
    gridDetailRow(g0, 'Poziomy', chain.map(c => c.nazwa).join(' → '));
    for (const line of upgradeCompositionLines(def.id, data.buildings)) {
      const note = el('div', 'dc-note');
      note.style.fontStyle = 'normal';
      note.textContent = line;
      card.appendChild(note);
    }
  }
  const displayLevel = buildingUiDisplayLevel(def, city);
  appendDetailSection(card, 'Statystyki (silnik)');
  const g1 = appendDetailGrid(card);
  let anyStat = false;
  for (const y of YIELD_BRAND) {
    const baza = def.baza[y.key] ?? 0;
    const przyrost = def.przyrost[y.key] ?? 0;
    if (baza === 0 && przyrost === 0) continue;
    anyStat = true;
    gridDetailRow(
      g1,
      y.label,
      formatBuildingYieldDetailValue(baza, przyrost, displayLevel),
    );
    const scale = formatBuildingYieldScaleRow(def, baza, przyrost);
    if (scale) gridDetailRow(g1, `${y.label} — skala`, scale);
  }
  const role = mnoznikRoleForBuildingId(def.id);
  if (role) {
    const cumulative = cumulativeMnoznikForBuildingId(def.id, data.buildings);
    if (cumulative !== 0) {
      anyStat = true;
      const label = role === 'pancerz' ? 'Pancerz (jednostki)' : 'Parametry poza Pancerzem (jednostki)';
      gridDetailRow(g1, label, `+${cumulative}%`);
    }
  }
  if (!anyStat) {
    const note = el('div', 'dc-note');
    note.textContent = 'Brak statów bazowych w definicji.';
    card.appendChild(note);
  }
  return card;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7895-7974
/** Stara implementacja (DOM-builder własny) — zachowana pod prywatną nazwą jako fallback
 * (wzorem `_legacyBuildBuildingDetailCard`/`_legacyBuildUnitInfoCard`). ZERO zmian treści. */
export function _legacyBuildUnitDetailCard(u: UnitDef, data: GameData): HTMLDivElement {
  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  const thumb = el('span');
  thumb.innerHTML = unitInfographicMedallionHtml(u, u.Jednostka, 28);
  head.appendChild(thumb);
  const ht = el('span');
  const role = u['Rola (linia)'] ?? '';
  ht.textContent = `${u.Jednostka}${role ? ' · ' + role : ''}`;
  head.appendChild(ht);
  card.appendChild(head);

  appendDetailSection(card, 'Charakterystyka');
  const gChar = appendDetailGrid(card);
  if (role) gridDetailRow(gChar, 'Linia', role);
  if (u.Epoka) gridDetailRow(gChar, 'Epoka', u.Epoka);
  if (u.Kultura && !isEmptyDataVal(u.Kultura)) gridDetailRow(gChar, 'Wymaga kultura', String(u.Kultura));
  const typ = unitExtraField(u, 'Typ');
  if (typ) gridDetailRow(gChar, 'Typ', String(typ));
  const klasa = unitExtraField(u, 'Klasa');
  if (klasa) gridDetailRow(gChar, 'Klasa', String(klasa));
  if (u['Super-jednostka'] === 'TAK') gridDetailRow(gChar, 'Super-jednostka', 'Tak');
  const wZa = u['W zamian za'];
  if (wZa && !isEmptyDataVal(wZa)) gridDetailRow(gChar, 'W zamian za', String(wZa));

  appendDetailSection(card, 'Walka');
  const gFight = appendDetailGrid(card);
  const fight = (label: string, val: string | number | null | undefined, fmt?: (n: number) => string) => {
    if (val == null || isEmptyDataVal(val)) return;
    gridDetailRow(gFight, label, fmt && typeof val === 'number' ? fmt(val) : String(val));
  };
  fight('Atak w zwarciu', u.Atak);
  fight('Obrona', u.Obrona);
  fight('Obrażenia broni', u.Uderzenie);
  fight('Pancerz', u.Pancerz);
  fight('Przebicie', u.Przebicie);
  fight('Bonus szarży', unitExtraField(u, 'Bonus szarży'));
  fight('Atak dystansowy', u['Atak dystansowy']);
  fight('HP', u.Health);
  fight('Ruch (mapa)', u.Ruch, n => `${n} hex`);
  fight('Ruch (bitwa)', u['Ruch w bitwie (heksy)'], n => `${n} hex`);
  fight('Zasięg', u['Zasięg ataku (hex)']);
  fight('Pociski', u['Ilość pocisków']);
  fight('Widok pola', u['Widok pola'], n => `${n} hex`);
  fight('Kara flanki', u['Kara obrony z flanki (%)'], n => `${n}%`);
  fight('Kara od tyłu', u['Kara obrony z tyłu (%)'], n => `${n}%`);
  fight('Próg dezercji', u['Próg dezercji (% health)'], n => `${Math.round(n * 100)}% HP`);
  fight('Morale bazowe', unitExtraField(u, 'Morale bazowe'));
  fight('Morale ucieczki', unitExtraField(u, 'Morale ucieczki'));

  appendDetailSection(card, 'Ekonomia');
  const gEco = appendDetailGrid(card);
  gridDetailRow(gEco, 'Koszt rekrutacji', u['Pieniądz (koszt)'] != null ? `${u['Pieniądz (koszt)']} 💰` : null);
  gridDetailRow(gEco, 'Utrzymanie', u['Utrzymanie (Pieniądz/turę)'] != null
    ? `${u['Utrzymanie (Pieniądz/turę)']} ${cityPanelChipIconWrap('res-treasury', 14)}`
    : null);
  const resUpkeep = unitResourceUpkeep(u);
  const resUpkeepKeys = Object.keys(resUpkeep);
  if (resUpkeepKeys.length > 0) {
    gridDetailRow(
      gEco,
      'Utrzymanie surowców',
      formatResourceUpkeepSummary(resUpkeep) + '/t',
    );
  }
  gridDetailRow(gEco, 'Żywność', u['żywność/turę'] != null ? `${u['żywność/turę']}` : null);
  gridDetailRow(gEco, 'Ludność', u.Ludność != null ? String(u.Ludność) : null);
  const surow = u.Surowiec;
  const surowIl = u['Surowiec (ilość)'];
  if (surow && !isEmptyDataVal(surow)) {
    gridDetailRow(gEco, 'Surowiec', surowIl != null ? `${surow} × ${surowIl}` : String(surow));
  }

  appendDetailSection(card, 'Technologie');
  appendTechDetailBlock(card, data, u.Tech);

  return card;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8861-8889
export function buildRecruitTabDetailCard(city: City, unitCount: number, skarb: number | undefined): HTMLDivElement {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const mpSnap = cfg.getManpowerSnapshot?.(city.id);
  const maxMult = civManpowerMaxMult(cfg.getCivBonusy?.(city.ownerId));
  const mpCostStd = unitManpowerCost(epoch, maxMult);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Rekrutacja — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Jednostki kupujesz za pieniądz ze skarbca imperium oraz rekrutów (Manpower) z puli całej cywilizacji. ' +
    'Werb zużywa tylko rekrutów imperium — ludność miasta nie spada. Zwiadowca — 0 kosztu Manpower. ' +
    'Opłacone pozycje trafiają do kolejki — max 1 gotowa na turę (v0.1).';
  card.appendChild(intro);
  appendDetailSection(card, 'Stan');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Dostępne jednostki', String(unitCount));
  gridDetailRow(g, 'Skarb imperium', skarb != null ? `${skarb} 💰` : '—');
  if (mpSnap) {
    gridDetailRow(g, 'Rekruci (pula miasta)', `${formatManpower(mpSnap.manpowerBiezacy)} / ${formatManpower(mpSnap.manpowerMax)}`);
    gridDetailRow(g, 'Koszt Manpower (typowy)', `${formatManpower(mpSnap.kosztJednostki)} · epoka ${mpSnap.epoka}`);
  } else {
    gridDetailRow(g, 'Koszt Manpower (typowy)', `${formatManpower(mpCostStd)} · epoka ${epoch}`);
  }
  const rq = getProd(city.id).rekrutacja?.length ?? 0;
  gridDetailRow(g, 'W kolejce', String(rq));
  return card;
}
