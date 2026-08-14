/**
 * empirePanelSectionMap.ts — mapowanie żetonów HUD → blok panelu imperium (R-PANEL-SPLIT).
 * Osobny plik bez importów UI/DOM — testowalny przez esbuild bez loaderów SVG.
 */

export type EmpirePanelBlock =
  | 'all'
  | 'parametry'
  | 'moc'
  | 'ekonomia'
  | 'kultura'
  | 'surowce'
  | 'spichlerz'
  | 'armia'
  | 'handel'
  | 'skarbiec'
  | 'praca'
  | 'nauka'
  | 'religia';

/** Sekcja panelu → który TOP-LEVEL blok pokazać. 'all' = pełny panel (brak section). */
export function empirePanelBlockForSection(section: string | null): EmpirePanelBlock {
  if (!section) return 'all';
  if (section === 'ekonomia') return 'ekonomia';
  if (section === 'armia') return 'armia';
  if (section === 'spichlerz' || section === 'spichlerz-centralny') return 'spichlerz';
  if (section === 'surowce' || section.startsWith('econ-surowiec-')) return 'surowce';
  if (section === 'handel') return 'handel';
  if (section === 'kultura') return 'kultura';
  if (section === 'moc') return 'moc';
  if (section === 'parametry') return 'parametry';
  // R-DESIGN-11-ZAKLADEK faza 1 (Maciej 2026-08-13): Skarbiec dostaje własny, odizolowany blok
  // (hero-nagłówek „Netto ±N / turę" nie mieści się w schemacie filtrowanego wiersza wspólnej
  // sekcji „ekonomia") — wyjątek MUSI być sprawdzony PRZED ogólnym `startsWith('econ-')` niżej.
  // EN: Treasury gets its own isolated block (a hero header "Net ±N / turn" doesn't fit the
  // filtered-row scheme of the shared "ekonomia" section) — this exception MUST be checked
  // BEFORE the generic `startsWith('econ-')` below.
  if (section === 'econ-skarbiec') return 'skarbiec';
  // R-DESIGN-11-ZAKLADEK faza 2 (Maciej 2026-08-1x): Praca/Nauka/Religia dostają ten sam
  // traktament co Skarbiec w fazie 1 — każda ma własny hero (Praca: suma Pracy/turę imperium;
  // Nauka: bank badań + cel badań; Religia: karta religii państwowej) niepasujący do schematu
  // filtrowanego wiersza „ekonomia". Miasta zostają na dawnym torze `ekonomia` (kolejna faza,
  // rozbicie na `miasto`/`obywatele`, poza zakresem tej fazy).
  // EN: Labor/Science/Religion get the same treatment Treasury got in phase 1 — each has its own
  // hero that doesn't fit the filtered-row "ekonomia" scheme. Cities stay on the old `ekonomia`
  // track (next phase, splitting into `miasto`/`obywatele`, out of this phase's scope).
  if (section === 'econ-praca') return 'praca';
  if (section === 'econ-nauka') return 'nauka';
  if (section === 'econ-religia') return 'religia';
  if (section.startsWith('econ-')) return 'ekonomia';
  return 'ekonomia';
}

export interface EconSliderVisibility {
  /** Suwak "Domyślny podział podatek" (Skarb/Nauka/Zamożność, renderDefaultHandelSplitSection). */
  showTaxSplit: boolean;
  /** Suwak "Domyślny podział pracy" (Budynki/Do puli imperium, renderDefaultPodzialPracySection). */
  showLaborSplit: boolean;
}

/**
 * P-EMPIRE-PANEL-SUWAKI-DUPLIKOWANE-NA-WSZYSTKICH-ZAKLADKACH (Maciej 2026-08-12): każda zakładka
 * bloku „ekonomia" (`onlyEconId` — id wiersza po filtrze chipu HUD, `null` = pełny przegląd bez
 * filtra) pokazuje WYŁĄCZNIE tematycznie powiązany suwak, nie oba naraz na każdej — Skarbiec i
 * Nauka -> podatek (Nauka finansowana % podatku "Nauka" z TEGO SAMEGO suwaka co Skarb/Zamożność,
 * NIE przez podział Pracy); Praca -> podział pracy; pozostałe zakładki (Miasta, Rekruci, Religia)
 * -> żaden. Pełny przegląd (`onlyEconId === null`) pokazuje oba — jedyne miejsce gdzie to ma sens
 * tematyczny (przegląd całej ekonomii, nie pojedynczy zasób).
 * EN: each tab of the "ekonomia" block (`onlyEconId` — the row id after the HUD chip filter,
 * `null` = full overview with no filter) shows ONLY its thematically-linked slider, not both on
 * every tab — Treasury and Science -> tax split (Science is financed by the SAME "Science"
 * tax-split % as Treasury/Wealth, NOT by the labor split); Labor -> labor split; other tabs
 * (Cities, Recruits, Religion) -> neither. The full overview (`onlyEconId === null`) shows both —
 * the only place that makes thematic sense (whole-economy overview, not a single resource).
 */
export function econSliderVisibilityForOnlyEconId(onlyEconId: string | null): EconSliderVisibility {
  return {
    showTaxSplit: onlyEconId === null || onlyEconId === 'skarbiec' || onlyEconId === 'nauka',
    showLaborSplit: onlyEconId === null || onlyEconId === 'praca',
  };
}

/** Mapowanie data-act z chipów HUD → sekcja panelu. */
export function empireSectionFromHudAct(act: string): string | undefined {
  switch (act) {
    case 'skarbiec': return 'econ-skarbiec';
    case 'praca': return 'econ-praca';
    case 'kultura': return 'kultura';
    case 'miasta':
    case 'ludnosc': return 'econ-miasta';
    case 'rekruci': return 'econ-rekruci';
    case 'power':
    case 'moc': return 'moc';
    case 'nauka': return 'econ-nauka';
    case 'zywnosc':
    case 'spichlerz': return 'spichlerz';
    case 'armia': return 'armia';
    case 'religia': return 'econ-religia';
    case 'empire': return 'ekonomia';
    case 'surowce': return 'surowce';
    case 'handel': return 'handel';
    default: return undefined;
  }
}
