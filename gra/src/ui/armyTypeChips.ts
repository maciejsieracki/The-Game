/**
 * armyTypeChips.ts — skróty „zaznacz wszystkich <typ>” nad listami jednostek armii
 * (R-WEB-UI-ARMY-PICK-SELECT-ALL-BY-TYPE-Q1).
 *
 * Czyste funkcje (bez DOM poza budowaniem HTML) — jedno źródło prawdy dla paneli
 * podziału armii, scalania i paska zaznaczenia w stosie na mapie.
 *
 * Zasady:
 * - typ liczony po `typeId` (nie po nazwie wyświetlanej),
 * - klik w chip: jeśli nie wszystkie jednostki tego typu są zaznaczone → zaznacza WSZYSTKIE
 *   jednostki tego typu; jeśli wszystkie są zaznaczone → odznacza je. Inne typy bez zmian,
 * - stan chipa: none (brak), part (część), all (wszystkie).
 */

export interface ArmyTypeChipUnit {
  id: string;
  typeId: string;
  /** Nazwa typu do etykiety chipa. */
  name: string;
  /** Generał/wódz (rola dowódcy na karcie). */
  isGeneral?: boolean;
}

export interface ArmyTypeGroup {
  typeId: string;
  label: string;
  ids: string[];
}

export type ArmyTypeChipState = 'none' | 'part' | 'all';

export interface ArmyTypeChipInfo {
  state: ArmyTypeChipState;
  selectedCount: number;
  total: number;
  text: string;
  ariaLabel: string;
  pressed: boolean;
}

/**
 * Grupy jednostek po `typeId`, w kolejności pierwszego wystąpienia.
 * `includeGenerals: false` pomija generałów/wodzów (jak „Zaznacz wszystko” w stosie).
 */
export function groupUnitsByType(
  units: readonly ArmyTypeChipUnit[],
  opts: { includeGenerals: boolean },
): ArmyTypeGroup[] {
  const byType = new Map<string, ArmyTypeGroup>();
  for (const u of units) {
    if (!opts.includeGenerals && u.isGeneral === true) continue;
    let group = byType.get(u.typeId);
    if (!group) {
      group = { typeId: u.typeId, label: u.name, ids: [] };
      byType.set(u.typeId, group);
    }
    group.ids.push(u.id);
  }
  return [...byType.values()];
}

/** Stan chipa względem zbioru zaznaczonych id. */
export function armyTypeChipInfo(group: ArmyTypeGroup, selected: ReadonlySet<string>): ArmyTypeChipInfo {
  const total = group.ids.length;
  const selectedCount = group.ids.reduce((n, id) => n + (selected.has(id) ? 1 : 0), 0);
  const state: ArmyTypeChipState = selectedCount === 0 ? 'none' : selectedCount === total ? 'all' : 'part';
  const text = state === 'part'
    ? `${group.label} ${selectedCount}/${total}`
    : `${group.label} ×${total}`;
  const ariaLabel = state === 'all'
    ? `${group.label}: zaznaczone wszystkie (${total}), kliknij, aby odznaczyć`
    : state === 'part'
      ? `${group.label}: zaznaczono ${selectedCount} z ${total}, kliknij, aby zaznaczyć wszystkie`
      : `${group.label}: brak zaznaczonych (${total}), kliknij, aby zaznaczyć wszystkie`;
  return { state, selectedCount, total, text, ariaLabel, pressed: state === 'all' };
}

/**
 * Klik w chip (mutuje zbiór): nie wszystkie zaznaczone → dodaje wszystkie id typu;
 * wszystkie zaznaczone → usuwa wszystkie id typu. Pozostałe id bez zmian.
 */
export function toggleArmyTypeChip(selected: Set<string>, group: ArmyTypeGroup): void {
  const allSelected = group.ids.every(id => selected.has(id));
  for (const id of group.ids) {
    if (allSelected) selected.delete(id);
    else selected.add(id);
  }
}

/** Przycisk chipa (HTML). `attrs` to gotowe atrybuty (np. data-chip-type="…"), już zescapowane. */
export function armyTypeChipButtonHtml(
  group: ArmyTypeGroup,
  selected: ReadonlySet<string>,
  opts: { className: string; attrs: string; esc: (raw: string) => string },
): string {
  const info = armyTypeChipInfo(group, selected);
  return '<button type="button" class="' + opts.className + ' ' + info.state + '"'
    + ' data-state="' + info.state + '"'
    + ' aria-pressed="' + (info.pressed ? 'true' : 'false') + '"'
    + ' aria-label="' + opts.esc(info.ariaLabel) + '"'
    + ' title="' + opts.esc(info.ariaLabel) + '"'
    + ' ' + opts.attrs + '>' + opts.esc(info.text) + '</button>';
}

/** Aktualizuje istniejący przycisk chipa (bez przebudowy listy). */
export function applyArmyTypeChipInfo(btn: HTMLElement, info: ArmyTypeChipInfo): void {
  btn.textContent = info.text;
  btn.setAttribute('aria-label', info.ariaLabel);
  btn.setAttribute('title', info.ariaLabel);
  btn.setAttribute('aria-pressed', info.pressed ? 'true' : 'false');
  btn.setAttribute('data-state', info.state);
  btn.classList.remove('none', 'part', 'all');
  btn.classList.add(info.state);
}

/** Rząd chipów z etykietą grupy (role=group). */
export function armyTypeChipRowHtml(innerHtml: string, label: string, className: string, esc: (raw: string) => string): string {
  return '<div class="' + className + '" role="group" aria-label="' + esc(label) + '">' + innerHtml + '</div>';
}

/** CSS rzędu chipów dla paneli z klasą bazową `civ-atc` (wstrzykiwany przez panel). */
export const ARMY_TYPE_CHIP_CSS = `
.civ-atc-row{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px;}
.civ-atc{font:inherit;font-size:11px;font-weight:600;cursor:pointer;padding:5px 9px;border-radius:7px;
  border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.05);color:#b8b09a;white-space:nowrap;}
.civ-atc:hover{border-color:rgba(232,216,138,0.45);}
.civ-atc.part{border-style:dashed;border-color:rgba(232,216,138,0.6);color:#e8d88a;}
.civ-atc.all{border-color:#e8d88a;background:rgba(232,216,138,0.16);color:#e8d88a;}
.civ-atc:focus-visible{outline:2px solid #e8d88a;outline-offset:2px;}
`;
