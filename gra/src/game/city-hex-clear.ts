/**
 * F-CITY-HEX — heks centrum miasta wg MACIERZY B (Maciej 2026-07-09).
 * Snapshot plonów przed czyszczeniem → City.centerWorkedTile.
 *
 * MACIERZ B — co ZOSTAJE / ZNIKA na heksie po założeniu miasta:
 *  ZOSTAJE: farma · krowy/trzoda · owce · lama · koń+stadnina · złoża naturalne
 *           (miedź/żelazo/węgiel/sól/glina) · kopalnia/kamieniołom/glinianka/warzelnia soli · drogi.
 *  ZNIKA:   las · wyrąb · obóz łowiecki · tartak · irygacja · pole irygowane · tarasy · fort/posterunek.
 *  WYJĄTEK GÓRY: miasto na heksie górskim kasuje WSZYSTKIE ulepszenia (zostaje miasto + bonusy terenu).
 *
 * Ten moduł czyści NAKŁADKI/ZŁOŻA heksa (las vs złoża). Warstwy ulepszeń (plony + render) filtruje
 * wołający (main.ts finalizeCityFounding) przez placedImprovements + syncHexUlepszenieFields,
 * używając CITY_KEEP_IMPROVEMENT_KEYS poniżej.
 */
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { Nakladka, Ulepszenie, TerenBazowy } from '../types/hex';
import type { City } from './cities';
import { hexToWorkedTile } from './turn-economy';

type HexExt = Hex & { zloze?: string; improvementKey?: string };

/** Ulepszenia klasy ZOSTAJE (macierz B) — przenoszą się na obrzeże heksa miasta. Reszta ZNIKA. */
export const CITY_KEEP_IMPROVEMENT_KEYS: ReadonlySet<string> = new Set<string>([
  'farma', 'bydlo', 'owce', 'lama', 'stadnina', 'pastwisko',
  'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_zlota', 'kamieniolom', 'glinianka', 'warzelnia_soli',
  'droga', 'droga_brukowana',
]);

/** Czy ulepszenie ZOSTAJE na heksie po założeniu miasta (poza wyjątkiem GÓRY). */
export function cityKeepsImprovement(key: string): boolean {
  return CITY_KEEP_IMPROVEMENT_KEYS.has(key);
}

/** Nakładki-złoża ZOSTAJĄCE (naturalne + zwierzęce). Las i nietypowe nakładki ZNIKAJĄ. */
function isKeptDeposit(n: Nakladka): boolean {
  return n === Nakladka.ZlozeGliny || n === Nakladka.ZlozeRudy || n === Nakladka.ZlozeKonia
    || n === Nakladka.ZlozeOwiec || n === Nakladka.ZlozeBydla || n === Nakladka.ZlozeLamy;
}

/**
 * Czyści nakładki/złoża heksa centrum wg macierzy B.
 * @param mountainClearsAll heks Góry → kasuje WSZYSTKO (zostaje miasto + bonusy terenu).
 */
export function clearHexForCityCenter(hex: HexExt, mountainClearsAll = true): void {
  if (mountainClearsAll) {
    hex.nakladka = Nakladka.Brak;
    hex.ulepszenie = Ulepszenie.Brak;
    delete hex.zloze;
    delete hex.improvementKey;
    return;
  }
  // Macierz B (nie-Góry): las ZNIKA, złoża naturalne/zwierzęce (nakładka) + hex.zloze ZOSTAJĄ.
  if (hex.nakladka === Nakladka.Las) {
    hex.nakladka = Nakladka.Brak;
  } else if (hex.nakladka !== Nakladka.Brak && !isKeptDeposit(hex.nakladka)) {
    hex.nakladka = Nakladka.Brak;
  }
  // Warstwy ulepszeń (hex.ulepszenie/ulepszenia/improvementKey) ustawia wołający przez
  // syncHexUlepszenieFields z ocalałych warstw — tu ich nie ruszamy.
}

/** Snapshot plonów + wyczyszczenie nakładek heksu miasta wg macierzy B (wyjątek GÓRY). */
export function applyCityFoundingToHex(
  city: City,
  map: GameMap,
  q: number,
  r: number,
): void {
  const hex = map.hexes[`${q},${r}`] as HexExt | undefined;
  if (!hex) return;
  city.centerWorkedTile = hexToWorkedTile(hex);
  clearHexForCityCenter(hex, hex.terenBazowy === TerenBazowy.Gory);
}
