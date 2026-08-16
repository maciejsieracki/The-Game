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
  | 'religia'
  | 'miasto'
  | 'obywatele';

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
  // P-ZASOBY-IMPERIUM-REKRUCI-STARY-WIDOK (Maciej 2026-08-14): chip HUD „Rekruci" mapuje na
  // `econ-rekruci`, ale Armia ma już własny top-level blok (patrz `armia` w empireDetailPanel.ts,
  // sekcja ARMIA) — bez tego wyjątku wpadał w ogólny `startsWith('econ-')` i pokazywał stary,
  // wspólny widok „ZASOBY IMPERIUM (STAN + PRZYROST)" zamiast już istniejącego bloku Armii.
  // Wyjątek MUSI być sprawdzony PRZED ogólnym `startsWith('econ-')` niżej, tak jak pozostałe.
  // EN: HUD chip "Recruits" maps to `econ-rekruci`, but Army already has its own top-level block
  // (see `armia` in empireDetailPanel.ts) — without this exception it fell into the generic
  // `startsWith('econ-')` and showed the old, shared "EMPIRE RESOURCES" view instead of the
  // already-existing Army block. This exception MUST be checked BEFORE the generic
  // `startsWith('econ-')` below, same as the others.
  if (section === 'econ-rekruci') return 'armia';
  // R-DESIGN-11-ZAKLADEK faza 3 (decyzja designera §3 pkt 2, Maciej 2026-08-13/14): wspólna
  // zakładka `econ-miasta` ROZCHODZI SIĘ na dwa niezależne bloki top-level — `miasto` (kąt
  // produkcyjny, §8.10) i `obywatele` (kąt społeczny, §8.11). Dotąd OBA chipy HUD („miasta"
  // i „ludnosc") prowadziły do tej samej funkcji `cityMiastaMiniDetail()`, mieszając dane
  // produkcyjne (Praca/Pieniądz/Surowce) ze społecznymi (Ludność/Wzrost) w jednej tabeli — to
  // właśnie ta mieszanka miała się rozdzielić. Wyjątki MUSZĄ być sprawdzone PRZED ogólnym
  // `startsWith('econ-')` niżej, tak samo jak Skarbiec/Praca/Nauka/Religia/Rekruci wyżej.
  // Identyfikatory sekcji zachowują przedrostek `econ-` dla spójności nazewnictwa z resztą
  // rodziny `econ-*` (Skarbiec/Praca/Nauka/Rekruci). Weryfikacja Evaluatora (2026-08-16): to NIE
  // jest funkcjonalnie konieczne — `econSliderVisibilityForOnlyEconId()` ma jednego konsumenta
  // (`empireDetailPanel.ts`, string `zasoby`), a `zasoby` trafia do treści panelu WYŁĄCZNIE gdy
  // blok to `'ekonomia'`/`'all'`; dla bloków `miasto`/`obywatele` jest liczony i odrzucany, więc
  // ewentualne suwaki i tak by się nie wyrenderowały niezależnie od przedrostka. Zachowany mimo
  // to jako nazewnicza konwencja i dlatego że `onlyEconId` musi pozostać zdefiniowanym stringiem
  // dla ewentualnych innych konsumentów tego pola w przyszłości, nie tylko dzisiejszego suwaka.
  // EN: the shared `econ-miasta` tab SPLITS into two independent top-level blocks — `miasto`
  // (production angle) and `obywatele` (social angle). Both HUD chips used to lead to the same
  // `cityMiastaMiniDetail()`, mixing production data with social data in one table — exactly the
  // mix that was meant to separate. These exceptions MUST be checked BEFORE the generic
  // `startsWith('econ-')` below. Section ids keep the `econ-` prefix for naming consistency with
  // the rest of the `econ-*` family. Evaluator-verified (2026-08-16): this is NOT functionally
  // required today — the slider-visibility rule's only consumer only renders sliders when the
  // block is `'ekonomia'`/`'all'`, so `miasto`/`obywatele` never reach that code path regardless
  // of the prefix. Kept as a naming convention and to keep `onlyEconId` a defined string for any
  // future consumer of that field, not just today's slider check.
  if (section === 'econ-miasto') return 'miasto';
  if (section === 'econ-obywatele') return 'obywatele';
  // `econ-miasta` (STARE, wspólne id) celowo ZOSTAJE na torze `ekonomia` — to nadal kotwica
  // scrollowania w bloku Mocy (`data-section="econ-miasta"`) i wiersz `econRows` id `miasta`
  // w pełnym przeglądzie „ZASOBY IMPERIUM". Rozejście dotyczy chipów HUD, nie pełnego przeglądu.
  // EN: the OLD shared id deliberately STAYS on the `ekonomia` track — it is still a scroll
  // anchor in the Power block and an `econRows` row in the full "EMPIRE RESOURCES" overview.
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
 * NIE przez podział Pracy); Praca -> podział pracy; pozostałe zakładki (Miasto, Obywatele,
 * Rekruci, Religia) -> żaden. Pełny przegląd (`onlyEconId === null`) pokazuje oba — jedyne miejsce gdzie to ma sens
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
    // R-DESIGN-11-ZAKLADEK faza 3 (§3 pkt 2): dwa chipy → dwie RÓŻNE zakładki, koniec wspólnego
    // `econ-miasta`. / EN: two chips → two DIFFERENT tabs, the shared `econ-miasta` ends here.
    case 'miasta': return 'econ-miasto';
    case 'ludnosc': return 'econ-obywatele';
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
