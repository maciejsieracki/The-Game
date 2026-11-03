/**
 * city-fortification.ts
 *
 * R-WEB-PALISADE-BATTLE-WALL-RULES-Q1 (2026-11-03): JEDNO wspolne pojecie
 * „obwarowanie miasta" (palisada ALBO mur) dla WSZYSTKICH regul obrony/bitwy.
 * Palisada drewniana jest forma muru: te same reguly oblezenia, inne tylko
 * WARTOSCI (bonus obrony z miasto-params.json: palisada +100%, mur +200%).
 *
 * Wyzszy etap ma pierwszenstwo, bez podwojnego liczenia: mury/cytadela ('mury',
 * 'fort') > palisada. Czyste funkcje, bez zaleznosci od City/mapy/silnika --
 * ta sama arytmetyka dla gracza i AI (parytet).
 *
 * Reguly (decyzja wlasciciela 2026-11-03):
 *  R1 miasto z obwarowaniem NIE moze byc zdobyte, dopoki nie zniszczono bramy
 *     albo muru/palisady (wylom) -- potrzebne MACHINY OBLEZNICZE;
 *  R2 obronca NA MURZE / ZA PALISADA (nienaruszona) jest nieosiagalny dla
 *     jednostek wrecz; atakuja go tylko dystansowe i machiny;
 *  R3 bonus obrony na murze/palisadzie -- city-defense.ts cityWallDefenseBonusPercent.
 */

export type CityFortificationKind = 'none' | 'palisada' | 'mur';

/** 'mur' (mury lub cytadela) > 'palisada' > 'none'. Puste/brak danych => 'none'. */
export function cityFortificationKind(
  builtBuildingIds: readonly string[] | null | undefined,
): CityFortificationKind {
  const built = builtBuildingIds ?? [];
  if (built.includes('mury') || built.includes('fort')) return 'mur';
  if (built.includes('palisada')) return 'palisada';
  return 'none';
}

/** Palisada ALBO mur (w tym cytadela) stoi w miescie. */
export function cityHasFortification(
  builtBuildingIds: readonly string[] | null | undefined,
): boolean {
  return cityFortificationKind(builtBuildingIds) !== 'none';
}

/** Flaga City.maMur (z danych) LUB lista budynkow -- wspolny warunek „miasto obwarowane". */
export function cityIsFortified(
  maMur: boolean | undefined,
  builtBuildingIds: readonly string[] | null | undefined,
): boolean {
  return maMur === true || cityHasFortification(builtBuildingIds);
}

/**
 * R1: czy atakujacy moze ZDOBYC miasto po wygranej bitwie. Miasto bez
 * obwarowania -- zawsze; z obwarowaniem -- tylko po wylomie (brama/mur/palisada).
 */
export function canCaptureCity(fortified: boolean, wallBreached: boolean): boolean {
  return !fortified || wallBreached;
}

export interface MeleeWallContext {
  /** Atakujacy walczy wrecz (nie strzela, nie jest machina oblezenicza). */
  attackerIsMelee: boolean;
  /** Atakujacy sam stoi na koronie muru (wspial sie wieza) -- walka mur-na-murze. */
  attackerOnWall: boolean;
  /** Cel stoi na murze / za nienaruszona palisada. */
  defenderOnWall: boolean;
  /** Brama albo mur/palisada zniszczone (wylom) -- po wylomie melee moze walczyc z kazdym obronca. */
  wallBreached?: boolean;
}

/**
 * R2: true gdy jednostka wrecz NIE moze zaatakowac tego obroncy (stoi na
 * murze/za palisada). Dystansowi i machiny oblezenicze nie sa blokowani.
 */
export function meleeBlockedByWall(ctx: MeleeWallContext): boolean {
  if (ctx.wallBreached === true) return false;
  return ctx.attackerIsMelee && !ctx.attackerOnWall && ctx.defenderOnWall;
}

/**
 * Wylom dla szturmu rozstrzyganego automatycznie (bez sceny taktycznej):
 * zakladamy, ze machina oblezenicza w skladzie doprowadza do wylomu.
 * Bitwa taktyczna podaje FAKTYCZNY wylom (BattleResult.wallBreached).
 */
export function autoStormBreach(hasSiegeMachine: boolean): boolean {
  return hasSiegeMachine;
}
