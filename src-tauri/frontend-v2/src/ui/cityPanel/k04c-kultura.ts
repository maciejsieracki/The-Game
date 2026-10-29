/**
 * K04C (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1, runda 1, batch 4a): karta „Kultura i Religia — szczegóły”.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56) `buildKulturaDetailCard` :3836-3990. 1:1 DOM i tekst.
 * Parametry religii, skala epoki, stan kultury i religii przychodza z `CityPanelK04CDto.kultura` (K04C-Z3);
 * punkty wplywu religii przez `religiaSzPunktyK` (k04c-model). Modul nie liczy reguł gry.
 */
import type { CityPanelK04CDto } from '../../viewmodel/types';
import { el, appendDetailSection, appendDetailAlgo, gridDetailRow } from './k01b-dom';
import { appendDetailGrid } from './k03-detail';
import { appendCompositionBlockK } from './k03-cards';
import { signed } from './k01a-fundament';
import { religiaSzPunktyK } from './k04c-model';

/** Wejscia karty Kultura i Religia (pin argumenty `city`, `view`, `cultState`, `relState`, `data`). */
export type KulturaCardInputK = CityPanelK04CDto['kultura'];

/** Pin :3836-3990 `buildKulturaDetailCard`. */
export function buildKulturaDetailCardK(i: KulturaCardInputK): HTMLDivElement {
  const relParams = i.relParams;
  const cultState = i.culture;
  const relState = i.religion;
  const xRel = i.skalaSzEpoki;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Kultura i Religia — szczegóły</span>'));

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Kultura poszerza granice terytorium miasta i odblokowuje polityki (w przyszłych wersjach). ' +
    'Religia to soft power: wpływa na szczęście, szerzy się na sąsiednie miasta i nadaje tożsamość cywilizacji.';
  card.appendChild(intro);

  appendDetailSection(card, 'Kultura — po co');
  appendDetailAlgo(card, 'Cel kultury', [
    'Kultura to „miękkie” rozszerzanie wpływów — bez wojska zyskujesz więcej pól do pracy (👤 na mapie okolicy).',
    'Im więcej kultury zgromadzisz, tym dalej sięgają granice miasta (+pierścienie wokół centrum).',
    'Kultura dominująca (własna vs obca) wpływa też na szczęście — podbój obcej kultury może obniżyć porządek.',
    'Źródła: budynki (Teatr, Muzeum…), cuda, specjalne bonusy cywilizacji, plony z pól.',
  ]);

  if (cultState) {
    appendDetailSection(card, 'Kultura — stan miasta');
    const gc = appendDetailGrid(card);
    if (cultState.ownerCultureLabel) {
      gridDetailRow(gc, 'Okręg kulturowy właściciela', cultState.ownerCultureLabel);
    }
    if (cultState.kulturaMix && cultState.kulturaMix.length > 0) {
      appendCompositionBlockK(
        card,
        'Skład kultury w mieście',
        cultState.kulturaMix.map(m => ({
          label: m.label,
          pct: m.pct,
          note: !m.isOwner ? 'konwersja w toku' : undefined,
        })),
        cultState.cultureConverting
          ? 'Miasto ma mieszankę kultur — udział kultury właściciela rośnie co turę (budynki kulturalne przyspieszają).'
          : undefined,
      );
    } else if (cultState.ownCultureSharePct != null) {
      gridDetailRow(gc, 'Udział kultury właściciela', `${cultState.ownCultureSharePct}%`);
    }
    gridDetailRow(gc, 'Suma kultury', String(cultState.kulturaSuma));
    gridDetailRow(gc, 'Przyrost', `+${cultState.przyrost}`);
    gridDetailRow(gc, 'Zasięg granic', `+${cultState.borderRadius} pierścieni`);
    const next = cultState.thresholds.find(t => t > cultState.kulturaSuma);
    gridDetailRow(gc, 'Następny próg', next !== undefined ? `${next} pkt kultury` : 'Maksymalny zasięg');
    if (cultState.zrodla && cultState.zrodla.length > 0) {
      appendDetailSection(card, 'Źródła kultury');
      const gz = appendDetailGrid(card);
      for (const z of cultState.zrodla) {
        gridDetailRow(gz, z.nazwa, `+${z.wartosc}`);
      }
    }
  } else if (i.kulturaZPlonow !== null) {
    appendDetailSection(card, 'Kultura — stan (szacunek)');
    const gc = appendDetailGrid(card);
    gridDetailRow(gc, 'Przyrost z plonów', `${signed(i.kulturaZPlonow)}`);
  }

  appendDetailSection(card, 'Religia — po co w grze');
  const relWhy = el('div', 'dc-note');
  relWhy.style.fontStyle = 'normal';
  relWhy.innerHTML =
    'Religia nie jest „dekoracją” — to <b>trzeci filar stabilności</b> obok podatków (zamożność) i wojska (prawo). ' +
    'Daje powód, by db o jedność imperium, inwestować w świątynie i myśleć o podbojach jako o <b>konwersji</b>, nie tylko o zdobyciu heksu.';
  card.appendChild(relWhy);

  appendDetailAlgo(card, 'Sens mechaniki religii', [
    'Każda cywilizacja ma religię państwową (np. Politeizm, Animizm) — to tożsamość, nie wybór gracza co turę.',
    'Miasta mają skład wyznawców; gdy jedna wiara >50% ludności → religia dominująca.',
    'Szczęście z religii jest <b>proporcjonalne do udziału twojej wiary</b>: 100% własnej = +x, 100% obcej = −x, 50/50 = dokładnie 0.',
    'x rośnie z epoką (10 / 16 / 23) — im dalej w las, tym więcej waży jedność wyznaniowa.',
    'Brak wyznawców w mieście → 0 (ani bonusu, ani kary — nie ma tam ani własnej, ani obcej wiary).',
    'Religia <b>szerzy się</b> na sąsiednie miasta co turę — jak presja kulturowa; Świątynia przyspiesza.',
    'Po podboju miasto <b>konwertuje</b> stopniowo (%) ku religii właściciela — Świątynia przyspiesza.',
    'Strategia: misjonerskie imperium vs tolerancyjne (akceptuj obce miasta, ale płać karą Sz).',
    'Religia łączy się z Porządkiem: wpływ idzie do SzPct → PorPct → kary/bonusy ekonomii.',
  ]);

  appendDetailSection(card, 'Religia — parametry (normal)');
  const gr = appendDetailGrid(card);
  gridDetailRow(gr, 'Próg dominacji', `>${relParams.progDominacjiPct}% wyznawców (opis składu; Szczęście liczy się z udziału)`);
  gridDetailRow(gr, 'Skala Sz tej epoki', `±${xRel} pkt — 100% własnej +${xRel}, 100% obcej −${xRel}`);
  gridDetailRow(gr, '100% własnej wiary', `+${xRel} Sz`);
  gridDetailRow(gr, '50/50', 'dokładnie 0 Sz');
  gridDetailRow(gr, '100% obcej wiary', `−${xRel} Sz`);
  gridDetailRow(gr, 'Szerzenie bazowe', `${relParams.szybkoscSzerzeniaBazowa} sąsiednie miasto`);
  gridDetailRow(gr, 'Bonus Świątyni (szerzenie)', `+${relParams.swiatyniaBonusSzerzenia}`);
  gridDetailRow(gr, 'Zasięg szerzenia', `${relParams.szerzenieMaxDystans} heksy`);
  gridDetailRow(gr, 'Konwersja po podboju', `${relParams.konwersjaBazaPct}% (+${relParams.konwersjaSwiatyniaPct}% ze Świątynią)`);

  if (relState) {
    appendDetailSection(card, 'Religia — stan miasta');
    const gs = appendDetailGrid(card);
    if (relState.stateReligion) {
      gridDetailRow(gs, 'Religia państwa', relState.stateReligion);
    }
    if (relState.sklad && relState.sklad.length > 0) {
      const stateRel = relState.stateReligion;
      appendCompositionBlockK(
        card,
        'Skład wyznawców',
        relState.sklad.map(s => ({
          label: s.name,
          pct: s.pct,
          note: stateRel && s.name !== stateRel ? 'obca wiara' : undefined,
        })),
        relState.sklad.some(s => stateRel && s.name !== stateRel)
          ? 'Po podboju obca wiara stopniowo ustępuje religii państwa (Świątynia przyspiesza konwersję).'
          : undefined,
      );
    }
    gridDetailRow(gs, 'Dominująca', relState.dominujaca);
    gridDetailRow(gs, 'Udział wyznawców', `${relState.udzialPct}%`);
    const relSzPkt = religiaSzPunktyK(relState.wplywSzczescieSzPkt);
    gridDetailRow(gs, 'Wpływ na Szczęście', `${relSzPkt >= 0 ? '+' : ''}${relSzPkt} pkt`);
    if (relState.przyrostWiernych != null) {
      gridDetailRow(gs, 'Szerzenie', `${relState.przyrostWiernych >= 0 ? '+' : ''}${relState.przyrostWiernych} wiernych`);
    }
    if (relState.zrodla && relState.zrodla.length > 0) {
      appendDetailSection(card, 'Składniki religii');
      const gz = appendDetailGrid(card);
      for (const z of relState.zrodla) {
        gridDetailRow(gz, z.nazwa, `${z.wartosc >= 0 ? '+' : ''}${z.wartosc}`);
      }
    }
  } else {
    appendDetailSection(card, 'Religia — stan');
    card.appendChild(el('div', 'dc-note', 'Brak danych silnika (hak getReligionState) — wartości z parametów powyżej.'));
  }

  appendDetailSection(card, 'Polityki (plan)');
  const pol = el('div', 'dc-note');
  pol.style.fontStyle = 'normal';
  pol.textContent =
    'Odblokowanie polityk społecznych za progi kultury — funkcja planowana; dziś kultura głównie poszerza granice i wpływa na szczęście.';
  card.appendChild(pol);

  return card;
}
