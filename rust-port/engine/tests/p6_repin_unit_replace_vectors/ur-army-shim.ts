// shim: armyClassOfUnit kopiowany 1:1 z ai-army-composition.ts:18 i :42-61 (ten modul importuje production.ts -- za ciezki do bundla).
export type ArmyClass = 'wrecz' | 'dystans' | 'konnica';
export function armyClassOfTyp(typ: string | null | undefined): ArmyClass | null {
  switch ((typ ?? '').trim()) {
    case 'Swordsman':
    case 'Spearman':
    case 'Falangite':
    case 'Offensive':
      return 'wrecz';
    case 'Distance':
    case 'Slinger':
      return 'dystans';
    case 'Mount': // konnica i rydwany liczone razem
      return 'konnica';
    default:
      return null;
  }
}

export function armyClassOfUnit(def: { Typ?: string | null } | null | undefined): ArmyClass | null {
  return def ? armyClassOfTyp(def.Typ) : null;
}
