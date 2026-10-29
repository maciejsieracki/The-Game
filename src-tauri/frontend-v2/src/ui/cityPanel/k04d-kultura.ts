/**
 * K04D (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04D-Q1, runda 1): karty paska gornego — Kultura i Religia.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `buildTopBarKulturaDetailCard` :5949-5990,
 * `buildTopBarReligiaDetailCard` :5992-6046. 1:1 DOM i tekst.
 *
 * ZALOZENIA K04D (rozstrzygniete w P5-8-K04D.md):
 * - Dane stanu miasta (`cfg.getCultureState`, `cfg.getReligionState`) z K04C-Z2 (`k04c.kultura.culture/religion`).
 * - Skala Szczescia epoki (`kultReligScaleForEra`) z K04C-Z3 (`k04c.kultura.skalaSzEpoki`).
 * - `relParams` (pin :6003, `loadReligionParams`) NIEczytany w karcie pina — nie portowany.
 */
import type { CityView } from './k01b-t';
import type { EmpireHudSnap } from './k01a-fundament';
import type { CultureDetailDto, ReligionDetailDto } from '../../viewmodel/types';
import { el, appendDetailSection, appendDetailAlgo, gridDetailRow } from './k01b-dom';
import { appendDetailGrid } from './k03-detail';
import { signed } from './k01a-fundament';

/** Wejscia karty Kultura (pin :5949). */
export interface KulturaCardInputK {
  view: CityView;
  empire: EmpireHudSnap;
  /** `CityPanelK04CDto.kultura.culture` (K04C-Z2); `null` = brak stanu kultury (pin: `cultState` falsy). */
  culture: CultureDetailDto | null;
}

/** Pin :5949-5990 `buildTopBarKulturaDetailCard`. */
export function buildTopBarKulturaDetailCardK(i: KulturaCardInputK): HTMLDivElement {
  const { view, empire, culture } = i;
  const empRate = Math.round(empire.kulturaRate ?? view.kultura);
  const cityKult = Math.round(view.kultura);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>🎭 Kultura — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Kultura poszerza granice miasta (więcej pól 👤) i wpływa na szczęście. Duża liczba to suma imperium; dopisek to ten gród.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 🎭', `${empRate} — suma kultury imperium`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityKult)} — ten gród`);

  if (culture) {
    appendDetailSection(card, 'Stan miasta (silnik)');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Suma kultury', String(culture.kulturaSuma));
    gridDetailRow(g1, 'Przyrost', `+${culture.przyrost}`);
    gridDetailRow(g1, 'Granice', `+${culture.borderRadius} pierścieni wokół miasta`);
  } else {
    appendDetailSection(card, 'Skąd bierze się kultura');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Plony + budynki', 'Teatr, Świątynia, cuda — patrz karta miasta.');
    gridDetailRow(g1, 'Efekt', 'Więcej kultury → dalsze granice terytorium na mapie okolicy.');
  }

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → „Kultura i Religia”: pasek postępu granic.',
    'Mapa okolicy — fioletowe pierścienie = zasięg kultury.',
    'Budynki kulturalne w lewej kolumnie produkcji.',
  ]);
  return card;
}

/** Wejscia karty Religia (pin :5992). */
export interface ReligiaCardInputK {
  empire: EmpireHudSnap;
  /** `CityPanelK04CDto.kultura.religion` (K04C-Z3); `null` = brak stanu religii. */
  religion: ReligionDetailDto | null;
  /** `CityPanelK04CDto.kultura.skalaSzEpoki` (pin `kultReligScaleForEra(epoka, skala)`). */
  skalaSzEpoki: number;
}

/** Pin :5992-6046 `buildTopBarReligiaDetailCard` (bez `view` i `relParams` — nieczytane w pinie). */
export function buildTopBarReligiaDetailCardK(i: ReligiaCardInputK): HTMLDivElement {
  const { empire, religion: relSt } = i;
  const relName = empire.stateReligion ?? relSt?.dominujaca ?? '—';
  const relStock = Math.round(empire.religionStock ?? 0);
  const cityRel = Math.round(relSt?.przyrostWiernych ?? 0);
  const relRateEmp = Math.round(empire.religionRate ?? 0);
  const share = empire.religionSharePct ?? relSt?.udzialPct ?? 0;
  const xRelTop = i.skalaSzEpoki;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>🛕 Religia — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Religia państwowa to tożsamość cywilizacji. Duża liczba to wierni w imperium; dopisek to ile ten gród szerzy wiarę co turę.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 🛕', `${relStock} — wierni „${relName}” w państwie`);
  gridDetailRow(g0, 'Udział wiary', `${share}% ludności`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityRel)} — ten gród szerzy religię`);
  gridDetailRow(g0, 'Imperium łącznie', `${signed(relRateEmp)}`);

  appendDetailSection(card, 'Po co religia w grze');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Szczęście z wiary', `proporcjonalnie do udziału: 100% własnej +${xRelTop}, 50/50 = 0, 100% obcej −${xRelTop}`);
  gridDetailRow(g1, 'Szerzenie', 'Sąsiednie miasta + Świątynia przyspieszają konwersję');

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → ikona Religia.',
    'Buduj Świątynię — więcej presji religijnej.',
    'Podbój = stopniowa konwersja ku wierze właściciela.',
  ]);
  return card;
}
