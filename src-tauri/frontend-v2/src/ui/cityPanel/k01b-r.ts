/**
 * K01B partia R (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1, runda 1): 15 jednostek pinu
 * gra/src/ui/cityPanel.ts (edb8fb56), ktore w pinie wolaly reguly gry. W porcie reguly ida
 * przez `reguly()` (port wstrzykiwany przez kontroler, k01b-reguly.ts) — UI nie liczy regul.
 * Tresc funkcji zachowana 1:1 z pinem; zmiana: wywolanie `reguly().X` zamiast importu z game/.
 */
import { fmtDecPl, pluralTur, yieldBrandIconHtml, formatConverterAmount } from './k01a-fundament';
import { reguly } from './k01b-reguly';
import type {
  BuildingDefK,
  CityProductionK,
  GameDataK,
  GrowthPercentBreakdownK,
  OrderBandK,
  ProductionItemK,
  RationParamsK,
} from './k01b-dto';
import { YIELD_BRAND as YIELD_BRAND_R, frontItemK } from './k01b-t';
import type { CityView } from './k01b-t';

// pin edb8fb56 gra/src/ui/cityPanel.ts:913-915 (import logiki etaTurns -> port)
export function queueItemOwnEta(koszt: number, pracaPerTurn: number): number | null {
  return reguly().etaTurns(koszt, 0, pracaPerTurn);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:889-911
export function queueItemCumulativeEta(
  prod: CityProductionK,
  queueIndex: number,
  pracaPerTurn: number,
): number | null {
  if (!(pracaPerTurn > 0) || queueIndex < 1) return null;
  if (prod.wstrzymana === true) return null;
  const front = frontItemK(prod);
  let sum = 0;
  if (front) {
    const rem = reguly().etaTurns(front.koszt, prod.postep, pracaPerTurn);
    if (rem === null) return null;
    sum += rem;
  }
  for (let i = 1; i < queueIndex; i++) {
    const it = prod.kolejka[i] as ProductionItemK;
    sum += Math.max(1, Math.ceil(it.koszt / pracaPerTurn));
  }
  const cur = prod.kolejka[queueIndex] as ProductionItemK;
  sum += Math.max(1, Math.ceil(cur.koszt / pracaPerTurn));
  return sum;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:1434-1442
export function clampedGrowthBreakdown(view: CityView, maxSafe?: number): GrowthPercentBreakdownK {
  const bd = view.growthBreakdown;
  if (maxSafe === undefined) return bd;
  const effectiveLevel = Math.min(view.poziomRacji, maxSafe);
  if (effectiveLevel >= view.poziomRacji) return bd;
  const racje = reguly().rationGrowthPercent(effectiveLevel);
  const total = bd.total - bd.racje + racje;
  return { ...bd, racje, total };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:1444-1449
export function wyzwienieSummaryLabel(level: number, params: RationParamsK): string {
  const cost = reguly().rationFoodCostPerPop(level, params);
  const grow = reguly().rationGrowthPercent(level, params);
  const growTxt = grow > 0 ? `+${grow}` : String(grow);
  return `${cost} 🍞/miesz. · ${growTxt}%`;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:1563-1595
export function buildGrowthProgressUi(
  population: number,
  view: CityView,
  epoch: number,
  fed: boolean,
  atPopCap: boolean,
  growthPctOverride?: number,
): { progressHtml: string; etaHtml: string } {
  void epoch;
  const frac = view.wzrostUlamkowy;
  const growthPct = growthPctOverride ?? view.wzrostProcent;
  const gainSlots = reguly().growthGainPerTurnSlots(population, growthPct, fed, atPopCap);

  const progressHtml =
    `<div class="growth-progress-main">Wzrost ludności: <strong>${fmtDecPl(frac)}</strong> / 1 obywatela</div>`;

  let etaHtml = '';
  if (atPopCap) {
    etaHtml = '<div class="growth-eta warn">Limit ludności — brak kolejnego obywatela.</div>';
  } else if (!fed) {
    etaHtml = '<div class="growth-eta warn">Brak wzrostu — miasto nie jest w pełni nakarmione ze Spichlerza.</div>';
  } else if (growthPct <= 0) {
    etaHtml = '<div class="growth-eta muted">WZROST% = 0 — brak kolejnego obywatela.</div>';
  } else {
    const turns = reguly().turnsUntilNextCitizen(frac, gainSlots);
    if (turns === 0) {
      etaHtml = '<div class="growth-eta ok">Kolejny obywatel w tej turze (bufor ≥ 1).</div>';
    } else if (turns != null) {
      etaHtml = `<div class="growth-eta ok">Kolejny obywatel za <strong>≈ ${turns}</strong> ${pluralTur(turns)}.</div>`;
    }
  }

  return { progressHtml, etaHtml };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:4357-4367 (band = wartość DTO, bez porPctBand)
export function orderBandEffectShort(band: OrderBandK | string): string {
  switch (band) {
    case 'lad': return 'Bonus ×1,10';
    case 'spokoj': return 'Brak kar';
    case 'napiecie': return 'Praca ×0,95';
    case 'niepokoj': return 'Kary plony/wzrost';
    case 'bunt': return 'Migracja, bunt';
    case 'bunt_skrajny': return 'Grace → rebelia';
    default: return '';
  }
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6484-6495
export function formatBuildingYieldDetailValue(baza: number, przyrost: number, level: number): string {
  const effect = reguly().buildingEffectAtLevel(baza, przyrost, level);
  if (effect === 0 && baza === 0 && przyrost === 0) return '—';
  const sign = effect >= 0 ? '+' : '';
  const main = `${sign}${effect} pkt/turę`;
  if (przyrost !== 0 && level > 1) {
    return `${main} (poziom ${level}: baza ${baza} + przyrost ${przyrost} × ${level - 1})`;
  }
  return main;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6496-6502
export function formatBuildingYieldChipText(baza: number, przyrost: number, label: string, level: number): string {
  const effect = reguly().buildingEffectAtLevel(baza, przyrost, level);
  const sign = effect >= 0 ? '+' : '';
  const base = `${sign}${effect} ${label}/turę`;
  if (level > 1) return `${base} (L${level})`;
  return base;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6505-6513
export function formatBuildingYieldScaleRow(def: BuildingDefK, baza: number, przyrost: number): string | null {
  if (przyrost === 0 || def.maksPoziom <= 1) return null;
  const parts: string[] = [];
  for (let l = 1; l <= def.maksPoziom; l++) {
    const v = reguly().buildingEffectAtLevel(baza, przyrost, l);
    parts.push(`L${l}: ${v >= 0 ? '+' : ''}${v}`);
  }
  return parts.join(' · ');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6516-6554
/** Chipy bonusów (max 3) — mockup Poziom B budynków 1E. */
export function buildingBonusChipsHtml(
  def: BuildingDefK,
  buildings: readonly BuildingDefK[],
  max = 3,
  level = 1,
): string {
  const rules = reguly();
  const chips: string[] = [];
  for (const y of YIELD_BRAND_R) {
    if (chips.length >= max) break;
    const base = def.baza[y.key] ?? 0;
    const inc = def.przyrost[y.key] ?? 0;
    if (base === 0 && inc === 0) continue;
    const val = formatBuildingYieldChipText(base, inc, y.label, level);
    chips.push(
      `<span class="bld-infocard-chip">${yieldBrandIconHtml(y.brandId, 13)}${val}</span>`,
    );
  }
  // Sciezki ulepszen jednostek (2026-07-25, druga tura -- suma lancucha
  // upgradeFrom): mnoznik nie idzie juz do Pracy -- pokaz PRAWDZIWY,
  // SKUMULOWANY efekt (Pancerz / Parametry, wlasny % + cala sciezka
  // poprzednikow) tylko dla 6 rozpoznanych budynkow.
  const role = rules.mnoznikRoleForBuildingId(def.id);
  if (role) {
    const cumulative = rules.cumulativeMnoznikForBuildingId(def.id, buildings);
    if (cumulative !== 0 && chips.length < max) {
      const label = role === 'pancerz' ? 'Pancerz' : 'Parametry';
      chips.push(`<span class="bld-infocard-chip">+${cumulative}% ${label}</span>`);
    }
  }
  const defenseProc = rules.buildingStructuralDefenseBonusPercent(def.id);
  if (defenseProc != null && chips.length < max) {
    chips.push(
      `<span class="bld-infocard-chip">${yieldBrandIconHtml('chip-garrison', 13)}+${defenseProc}% Obrona</span>`,
    );
  }
  return chips.join('');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6579-6607
export function buildingOwnedBonusCompactHtml(
  def: BuildingDefK,
  level: number,
  buildings: readonly BuildingDefK[],
  opts?: { max?: number; iconSize?: 8 | 10 | 13 | number; compact?: boolean },
): string {
  const rules = reguly();
  const max = opts?.max ?? (opts?.compact ? 3 : 5);
  const iconSize = opts?.iconSize ?? (opts?.compact ? 8 : 10);
  const chips: string[] = [];
  for (const y of YIELD_BRAND_R) {
    if (chips.length >= max) break;
    const val = rules.buildingEffectAtLevel(def.baza[y.key] ?? 0, def.przyrost[y.key] ?? 0, level);
    if (val === 0) continue;
    chips.push(
      `<span class="bld-owned-chip">${val > 0 ? '+' : ''}${val}${yieldBrandIconHtml(y.brandId, iconSize)}</span>`,
    );
  }
  const role = rules.mnoznikRoleForBuildingId(def.id);
  if (role && chips.length < max) {
    const cumulative = rules.cumulativeMnoznikForBuildingId(def.id, buildings);
    if (cumulative !== 0) {
      chips.push(`<span class="bld-owned-chip">+${cumulative}%</span>`);
    }
  }
  if (chips.length === 0) return '';
  return opts?.compact
    ? chips.join('<span class="bld-owned-sep">·</span>')
    : chips.join('');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6637-6648
export function formatResourceUpkeepText(
  resources: Record<string, number>,
  compact: boolean,
): string {
  const keys = Object.keys(resources);
  if (keys.length === 0) return '';
  const label = (k: string): string => reguly().stockResourceLabel(k);
  return keys
    .map(k => (compact
      ? `−${resources[k]} ${label(k)}`
      : `−${resources[k]} ${label(k)}/t`))
    .join(' · ');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6650-6658
export function buildingUpkeepDisplay(
  def: BuildingDefK,
  level: number,
): { gold: number; resources: Record<string, number> } {
  const rules = reguly();
  return {
    gold: rules.buildingUpkeep(def, level),
    resources: rules.buildingResourceUpkeep(def),
  };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6660-6671
export function sumOwnedBuildingsResourceUpkeep(
  built: readonly string[],
  data: GameDataK,
): Record<string, number> {
  const rules = reguly();
  const out: Record<string, number> = {};
  for (const id of built) {
    const def = data.buildings.find(b => b.id === id);
    if (!def) continue;
    rules.addResourceCosts(out, rules.buildingResourceUpkeep(def));
  }
  return out;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6789-6810
export function formatConverterProductionRowHtml(
  display: { consumed: Record<string, number>; produced: Record<string, number> },
  compact: boolean,
): string {
  const label = (k: string): string => reguly().stockResourceLabel(k);
  const parts: string[] = [];
  for (const [k, v] of Object.entries(display.consumed)) {
    const r1 = Math.round(v * 10) / 10;
    if (r1 <= 0) continue;
    const amtTxt = formatConverterAmount(v);
    const txt = compact ? `−${amtTxt} ${label(k)}` : `−${amtTxt} ${label(k)}/t`;
    parts.push(`<span class="bld-owned-conv-in">${txt}</span>`);
  }
  for (const [k, v] of Object.entries(display.produced)) {
    const r1 = Math.round(v * 10) / 10;
    if (r1 <= 0) continue;
    const amtTxt = formatConverterAmount(v);
    const txt = compact ? `+${amtTxt} ${label(k)}` : `+${amtTxt} ${label(k)}/t`;
    parts.push(`<span class="bld-owned-conv-out">${txt}</span>`);
  }
  if (parts.length === 0) return '';
  return `<span class="bld-owned-conv-label">Prod.:</span>` + parts.join(compact ? ' ' : ' · ');
}
