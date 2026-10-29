/**
 * K01B partia F (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1, runda 1): 6 jednostek pinu
 * gra/src/ui/cityPanel.ts (edb8fb56), odroczonych w K01A z powodu zaleznosci od odroczonych
 * jednostek (CityView, PULA_LBL_PELNA, formatResourceUpkeepText). Te zaleznosci sa teraz
 * w partiach T (k01b-t.ts) i R (k01b-r.ts); tresc funkcji = pin po normalizacji (tools/dom-harness/verify-k01b-copies.mjs).
 */
import {
  cityPanelChipIcon,
  cityPanelChipIconWrap,
  fmtResDelta,
  resInteractiveAttrs,
  signed,
  statChipBrand,
  BUILDING_UPKEEP_ZERO_LABEL,
  HANDEL_KORUPCJA_PCT_PLACEHOLDER,
  type HandelChipEstimates,
  type PodzialHandluSplit,
} from './k01a-fundament';
import { resourceTextClass } from '../resourceColors';
import { PULA_LBL_PELNA, type CityView } from './k01b-t';
import { formatResourceUpkeepText } from './k01b-r';

// pin edb8fb56 gra/src/ui/cityPanel.ts:968-993
export function estimateHandelChips(view: CityView | null, split: PodzialHandluSplit): HandelChipEstimates {
  const zero = { brutto: 0, korupcja: 0, netto: 0, skarb: 0, nauka: 0, zam: 0 };
  if (!view) return zero;

  let nettoEst = 0;
  if (split.procentNauka > 0) {
    nettoEst = Math.round(view.nauka * (100 / split.procentNauka));
  } else if (split.procentPieniadz > 0) {
    nettoEst = Math.round(view.pieniadz * (100 / split.procentPieniadz));
  }

  const k = HANDEL_KORUPCJA_PCT_PLACEHOLDER / 100;
  const brutto = k < 1 ? Math.round(nettoEst / (1 - k)) : nettoEst;
  const korupcja = Math.max(0, brutto - nettoEst);
  const netto = Math.max(0, brutto - korupcja);

  return {
    brutto,
    korupcja,
    netto,
    skarb: Math.floor(netto * split.procentPieniadz / 100),
    nauka: Math.floor(netto * split.procentNauka / 100),
    zam: Math.floor(netto * split.procentLuksus / 100),
  };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:1723-1742
export function resPracaSplitBar(
  mainVal: string,
  doBudynkow: number,
  doPuli: number,
  hint: string,
  statId?: string,
  rail = false,
): string {
  const b = fmtResDelta(doBudynkow);
  const u = fmtResDelta(doPuli);
  const ia = statId ? resInteractiveAttrs(statId, hint, rail) : { cls: rail ? 'civ-v-res-item civ-v-res-rail-item' : 'civ-v-res-item', attrs: '' };
  const deltaWrap = rail ? 'civ-v-res-rail-deltas' : 'civ-v-res-inline-deltas';
  return `<span class="${ia.cls}"${ia.attrs} title="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-res-icon">${cityPanelChipIcon('res-work', 20)}</span>` +
    `<span class="civ-v-res-val gold">${mainVal}</span>` +
    `<span class="${deltaWrap}">` +
    `<span class="civ-v-res-delta ${b.cls}" title="Budynki">${b.html}</span>` +
    `<span class="civ-v-res-delta blue" title="${PULA_LBL_PELNA}">${u.html}</span>` +
    `</span></span>`;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:1863-1877
export function plonyChipRowHtml(view: CityView): string {
  // P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1: tożsamość surowca z palety; klasa stanu tylko
  // dla Żywności (deficyt). „Pieniądz" miał tu 'blue' — Skarbiec pokazywał się jako
  // niebieski w panelu miasta i jako złoty na HUD mapy, przy tej samej wielkości.
  const foodCls = view.zywnoscNetto > 0 ? 'green'
    : view.zywnoscNetto < 0 ? 'red'
    : resourceTextClass('zywnosc');
  return (
    statChipBrand('res-food', 'Żyw.', signed(view.zywnoscNetto), foodCls) +
    statChipBrand('res-work', 'Praca', signed(view.praca), resourceTextClass('praca')) +
    statChipBrand('res-treasury', 'Pieniądz', signed(view.pieniadz), resourceTextClass('skarbiec')) +
    statChipBrand('res-science', 'Nauka', signed(view.nauka), resourceTextClass('nauka')) +
    statChipBrand('res-culture', 'Kult.', signed(view.kultura), resourceTextClass('kultura'))
  );
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6673-6684
export function formatBuildingUpkeepGridValue(display: { gold: number; resources: Record<string, number> }): string {
  if (display.gold === 0 && Object.keys(display.resources).length === 0) {
    return BUILDING_UPKEEP_ZERO_LABEL;
  }
  const parts: string[] = [];
  if (display.gold > 0) {
    parts.push(`${display.gold} ${cityPanelChipIconWrap('res-treasury', 14)}`);
  }
  const res = formatResourceUpkeepText(display.resources, false);
  if (res) parts.push(res);
  return parts.join(' + ');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6686-6702
export function formatBuildingUpkeepRowHtml(
  display: { gold: number; resources: Record<string, number> },
  compact: boolean,
): string {
  if (display.gold === 0 && Object.keys(display.resources).length === 0) {
    return BUILDING_UPKEEP_ZERO_LABEL;
  }
  const parts: string[] = [];
  if (display.gold > 0) {
    parts.push(compact
      ? `−${display.gold}${cityPanelChipIconWrap('res-treasury', 8)}`
      : `−${display.gold}${cityPanelChipIconWrap('res-treasury', 10)}/t`);
  }
  const res = formatResourceUpkeepText(display.resources, compact);
  if (res) parts.push(res);
  return parts.join(compact ? ' ' : ' · ');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6704-6718
export function formatBuildingUpkeepTotalHtml(
  totalGold: number,
  totalResources: Record<string, number>,
): string {
  if (totalGold === 0 && Object.keys(totalResources).length === 0) {
    return `Utrzymanie łącznie: <b>${BUILDING_UPKEEP_ZERO_LABEL}</b>`;
  }
  const parts: string[] = [];
  if (totalGold > 0) {
    parts.push(`−${totalGold}${cityPanelChipIconWrap('res-treasury', 12)}`);
  }
  const res = formatResourceUpkeepText(totalResources, false).replace(/\/t/g, '');
  if (res) parts.push(res);
  return `Utrzymanie łącznie: <b>${parts.join(' · ')}</b>/turę`;
}
