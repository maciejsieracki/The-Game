/**
 * city-defense.ts
 *
 * Bonus procentowy Obrony miasta z budowli obronnych (Palisada, Mury, Cytadela, Baszta)
 * -- WYLACZNIE procentowy, data-driven z miasto-params.json (Maciej 2026-07-25,
 * decyzja 41B -- Baszta jako trzeci, niezalezny budynek obronny; Maciej 2026-07-28
 * -- Palisada drewniana jako wczesna obrona przed Mury).
 *
 * Warstwy ADDYTYWNE (nie mnozone), z wyjatkiem Palisada vs Mury (Mury superseduja):
 *   Palisada +bonus_obrona_palisada_proc%  -- tylko gdy brak Murów/Cytadeli w miescie
 *   Mury     +bonus_obrona_mur_proc%       -- baza kamienna; zastepuje bonus Palisady
 *   Cytadela +bonus_obrona_cytadela_proc%  -- dodatkowo, gdy budynek 'fort' obecny
 *   Baszta   +bonus_obrona_baszta_proc%    -- dodatkowo, gdy budynek 'baszta' obecny
 *
 * Miasto z Murami+Cytadela+Baszta = 200+100+100 = 400%. DECYZJA 54a (Maciej
 * 2026-07-25): Baszta wymaga wybudowanych Murow W TYM SAMYM MIESCIE, zanim da
 * sie ja postawic -- prerekwyzyt KOLEJNOSCI BUDOWY, egzekwowany w
 * CITY_BUILDING_PREREQ (building-resource-gate.ts) / production.ts, NIE w tej
 * funkcji. Ta funkcja liczy WYLACZNIE bonus procentowy z budynkow juz stojacych
 * w miescie -- skoro Baszta nie moglaby dzis stac bez Murow, kombinacja "sama
 * Baszta bez Murow" jest juz nieosiagalna przez budowanie, ale funkcja zostaje
 * odporna na stare zapisy (patrz `builtBuildingIds` nizej): gdyby w danych
 * zapisu Baszta byla obecna bez Murow, dostaje WYLACZNIE swoj wlasny
 * bonus_obrona_baszta_proc (baza "mur" NIE aktywuje sie bez realnych Murow lub
 * Cytadeli -- inaczej Baszta bylaby "tanszym Murem", co nie bylo intencja).
 *
 * Jedna czysta funkcja (bez zaleznosci od City/mapy/silnika) uzywana przez
 * main.ts (structureDefenseBonusFor -- instant/auto-battle na mapie swiata)
 * ORAZ battle/battleScene.ts (onWallWalkway -- interaktywna bitwa/oblezenie),
 * zeby oba tryby liczyly identyczna liczbe (PARYTET, ownerId-agnostyczne).
 * Przed Baszta ta sama arytmetyka byla PRZEPISANA osobno w obu miejscach --
 * trzecia warstwa byla dobrym momentem na scalenie w jeden, testowalny modul.
 */

import { normTerrain, terrainDefenseMultiplier } from './combat';
import type { TerrainEntry } from './combat';

export interface CityDefenseBonusParams {
  /** bonus_obrona_mur_proc (miasto-params.json) -- baza kamienna, zwykle 200. */
  mur: number;
  /** bonus_obrona_cytadela_proc (miasto-params.json) -- dodatkowo z Cytadela, zwykle 100. */
  cytadela: number;
  /** bonus_obrona_baszta_proc (miasto-params.json) -- dodatkowo z Baszta, zwykle 100. */
  baszta: number;
  /** bonus_obrona_palisada_proc (miasto-params.json) -- wczesna palisada, zwykle 100. */
  palisada?: number;
  /** bonus_obrona_mur_kamienny_proc (miasto-params.json), usually 150. */
  murKamienny?: number;
}

/**
 * `builtBuildingIds` to lista budynkow FIZYCZNIE obecnych w miescie
 * (City.cityBuilt, PO podmianach upgrade'owych) -- id, nie nazwy. Zwraca %
 * (np. 400 = +400%), nie ulamek. Puste/brakujace dane => 0 (bez wyjatku --
 * bezpieczne dla starych zapisow gry sprzed Baszty/Cytadeli/Palisady).
 */
export function cityWallDefenseBonusPercent(
  builtBuildingIds: readonly string[] | null | undefined,
  params: CityDefenseBonusParams,
): number {
  const built = builtBuildingIds ?? [];
  const hasMury = built.includes('mury');
  const hasKamienneMury = built.includes('mury_kamienne');
  const hasFort = built.includes('fort');
  const hasBaszta = built.includes('baszta');
  const hasPalisada = built.includes('palisada');
  const palisadaProc = params.palisada ?? 100;

  let total = 0;
  if (hasMury) {
    total += params.mur;
    if (hasFort) total += params.cytadela;
  } else if (hasKamienneMury) {
    total += params.murKamienny ?? 150;
    if (hasFort) total += params.cytadela;
  } else if (hasFort) {
    // Legacy/save compatibility: older standalone fort records represented the wall tier.
    total += params.mur + params.cytadela;
  } else if (hasPalisada) {
    total += palisadaProc;
  }
  if (hasBaszta) total += params.baszta;
  return total;
}

/**
 * R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1 (decyzja wlasciciela 2026-11-03) --
 * JEDNA regula "obronca wewnatrz obwarowania", uzywana przez bitwe taktyczna
 * (battleScene.ts _singleBlow) ORAZ rozstrzygniecie "Pomin" (computeInstantResult).
 *
 * Bonus obrony z obwarowania (mur +200%, palisada +100%, Cytadela +100%, Baszta
 * +100% -- cityWallDefenseBonusPercent) naleza sie KAZDEMU obroncy (side === 'def')
 * stojacemu:
 *   (a) NA KORONIE muru/palisady (`onWallWalkway`), albo
 *   (b) WEWNATRZ linii muru: kolumna sceny `q` STRICTE ZA kolumna muru
 *       (`q > siegeWallCol`) -- dziedziniec / glab miasta (jazda, machiny, a po
 *       wylomie piechota, ktora zeszla z korony).
 * NIE naleza sie: atakujacym (takze tym, ktorzy wspieli sie na korone wieza
 * obleznicza), obroncom POZA murem (`q < siegeWallCol`) ani stojacym w kaflu
 * samego muru, ktory nie jest juz korona (`q === siegeWallCol` bez
 * `onWallWalkway` -- wyburzony kafel / brama: korona znikla, wiec bonus tez).
 * `siegeWallCol < 0` (brak sceny oblezenia) => tylko flaga korony.
 */
export interface FortificationPositionCtx {
  side: 'atk' | 'def';
  onWallWalkway?: boolean;
  /** Kolumna sceny bitwy jednostki. */
  q: number;
  /** Kolumna muru w scenie (BattleScene.siegeWallCol); < 0 = brak muru. */
  siegeWallCol: number;
}

export function defenderInsideFortification(ctx: FortificationPositionCtx): boolean {
  if (ctx.side !== 'def') return false;
  if (ctx.onWallWalkway === true) return true;
  return ctx.siegeWallCol >= 0 && ctx.q > ctx.siegeWallCol;
}

/**
 * Bonus obrony (w %) z obwarowania dla konkretnej jednostki: `wallTotalProc`
 * (cityWallDefenseBonusPercent) gdy obronca jest wewnatrz obwarowania, inaczej 0.
 * Czysta funkcja, ownerId-agnostyczna (parytet gracz/AI).
 */
export function fortificationDefenseBonusForUnit(
  ctx: FortificationPositionCtx,
  wallTotalProc: number,
): number {
  return defenderInsideFortification(ctx) ? Math.max(0, wallTotalProc) : 0;
}

/** Mnoznik zasiegu strzelca stojacego NA koronie muru/palisady (decyzja 2026-11-03). */
export const WALL_CROWN_RANGE_MULT = 2;

/**
 * Zasieg strzelca NA koronie: efektywny zasieg (baza + delta terenu) x2, w gore.
 * Wolajacy decyduje, kogo to dotyczy (obronca-strzelec na koronie, nie machina,
 * nie wiezyczka -- te maja osobny zasieg).
 */
export function wallCrownShooterRange(effectiveRange: number): number {
  if (!(effectiveRange > 0)) return Math.max(0, effectiveRange || 0);
  return Math.ceil(effectiveRange * WALL_CROWN_RANGE_MULT);
}

/**
 * cityGatedTerrainMultiplier (C-COMBAT-Q2, Maciej 2026-07-26 -- decyzja
 * "bonus terenu przy obronie MIASTA dolicza sie WYLACZNIE gdy miasto ma mur"):
 *
 * Zwraca mnoznik terenu dla obrony MIASTA, gated na dwa warunki jednoczesnie:
 *   1. Miasto MUSI miec budynek obronny (Palisada / Mury / Cytadela / Baszta) --
 *      `hasMur` (dowolny z nich, patrz cityWallDefenseBonusPercent powyzej > 0).
 *      Miasto BEZ zadnego z nich -> zawsze 1.0 (brak bonusu), niezaleznie od
 *      terenu -- uzasadnienie wlasciciela: jednostki miasta bez murow wychodza
 *      w pole i biją sie na plaskim gruncie, wiec wzgorze pod miastem nie ma
 *      czego chronic.
 *   2. Z terenow liczy sie WYLACZNIE wzniesienie (Wzgorza; teoretycznie Gory,
 *      choc miasta nie da sie na nich zalozyc) -- Las, Rzeka i pozostale
 *      tereny NIE dodaja nic do obrony miasta, nawet z murem. Wartosc dla
 *      wzniesienia to DOKLADNIE terrainDefenseMultiplier() (1.5 Wzgorza /
 *      1.75 Gory) -- ta sama liczba co bitwa w polu, tylko GATED (patrz #1)
 *      i zawezona do elewacji (patrz #2).
 *
 * WAZNE -- kombinacja z bonusem strukturalnym (mur/Cytadela/Baszta) jest
 * ADDYTYWNA w punktach procentowych (Razem = Bonus_strukturalny% +
 * Bonus_terenu%), NIE mnozona -- patrz tabela w zadaniu (Mury+wzgorze:
 * 200%+50%=250%, NIE 200%*150%=350%). Wywolujacy MUSI wiec kombinowac wynik
 * tej funkcji jako `(cityGatedTerrainMultiplier(...) - 1) * 100` procentowych
 * punktow DODANYCH do structBonusPct -- NIE jako dodatkowy mnoznik obok
 * structMult (tak jak dzieje sie to dzis dla bitwy w polu, ktora zostaje BEZ
 * ZMIAN -- tam teren i struktura (fort/posterunek) nadal MNOZA sie, patrz
 * main.ts effectiveDefenderM galaz "bitwa w polu").
 *
 * Bitwy w polu (poza miastem) NIE wolaja tej funkcji w ogole -- zachowuja
 * pelny, niegated terrainDefenseMultiplier() (las/wzgorze/brod dzialaja jak
 * dzis). Ta funkcja jest wolana WYLACZNIE ze sciezek obrony MIASTA (Auto --
 * main.ts effectiveDefenderM + mapFieldBattle.ts duplikat; taktyczna --
 * battleScene.ts _singleBlow; "Pomin" -- battleScene.ts computeInstantResult).
 *
 * PARYTET AI: czysta funkcja bez ownerId -- identyczna dla gracza i AI.
 */
export function cityGatedTerrainMultiplier(
  hasMur: boolean,
  terrain: string,
  terrainData: readonly TerrainEntry[],
): number {
  if (!hasMur) return 1.0;
  const terrNorm = normTerrain(terrain);
  const isElevation = terrNorm.includes('wzg') || terrNorm.includes('gor');
  if (!isElevation) return 1.0;
  return terrainDefenseMultiplier(terrain, '', terrainData as TerrainEntry[]);
}

/**
 * shouldApplyGarrisonFortifyBonus (Maciej 2026-07-31): garnizon „Ufortyfikuj"
 * dostaje +50% Obrony (jak pole) WYŁĄCZNIE gdy miasto nie ma żadnego budynku
 * obronnego (Palisada / Mury / Cytadela / Baszta → cityWallDefenseBonusPercent
 * === 0). Baszta sama lub palisada = obrona budynku > 0 → bez +50% od garnizonu.
 */
export function shouldApplyGarrisonFortifyBonus(
  builtBuildingIds: readonly string[] | null | undefined,
  params: CityDefenseBonusParams,
): boolean {
  return cityWallDefenseBonusPercent(builtBuildingIds, params) === 0;
}

export interface UnitFortifyDefenseContext {
  ufortyfikowanyWPolu?: boolean;
  inGarnizon?: boolean;
  builtBuildingIds?: readonly string[] | null;
  cityDefenseParams?: CityDefenseBonusParams;
}

/**
 * unitGetsFortifyDefenseBonus — czy jednostka dostaje procentowy bonus
 * fortify_obrona_proc (+50% Obrony): pole (ufortyfikowanyWPolu) LUB garnizon
 * w mieście bez palisady/murów/fort/cytadeli/baszty.
 */
export function unitGetsFortifyDefenseBonus(ctx: UnitFortifyDefenseContext): boolean {
  if (ctx.ufortyfikowanyWPolu === true) return true;
  if (ctx.inGarnizon !== true) return false;
  if (!ctx.cityDefenseParams) return false;
  return shouldApplyGarrisonFortifyBonus(ctx.builtBuildingIds, ctx.cityDefenseParams);
}

/**
 * fieldFortifyDefenseBonus (Maciej 2026-07-26, FORTIFY-POLE-Q1=A 2026-07-31):
 * mnożnik procentowy Obrony (combat-params.json "oblężenie".fortify_obrona_proc,
 * dziś 50 = +50%) dla jednostki z unitGetsFortifyDefenseBonus === true
 * (ufortyfikowanyWPolu lub garnizon w mieście bez budynku obronnego).
 *
 * Zwraca Obronę PO bonusie, PRZED mnożnikiem terenu/muru — wołający MUSI pomnożyć
 * wynik przez własny mnożnik terenu osobno (jak cityGatedTerrainMultiplier).
 * Działa WYŁĄCZNIE na Obronie (nigdy Atak).
 *
 * Wołane z: main.ts effectiveDefenderM, battleScene.ts _singleBlow,
 * battleScene.ts computeInstantResult ("Pomiń").
 */
export function fieldFortifyDefenseBonus(
  baseObrona: number,
  isFortifiedInField: boolean,
  fortifyObronaProc: number,
): number {
  return isFortifiedInField
    ? baseObrona * (1 + fortifyObronaProc / 100)
    : baseObrona;
}
