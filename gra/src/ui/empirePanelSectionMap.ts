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
  | 'handel';

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
  if (section.startsWith('econ-')) return 'ekonomia';
  return 'ekonomia';
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
