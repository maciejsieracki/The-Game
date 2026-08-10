/**
 * mapSnapshot.ts
 * Serializacja pełnej siatki heksów (GameMap) do/z zapisu gry —
 * P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA (Maciej, ECHO A). Zapis niesie gotową
 * mapę, żeby wczytanie NIE musiało wołać generatora (generujSwiatAsync)
 * ponownie. Funkcje czysto strukturalne — przepisują TYLKO znane pola
 * GameMap; `hexes` jest przekazywane BEZ rekonstrukcji per-heks, bo
 * pojedynczy Hex nosi też pola dynamiczne spoza typu bazowego (np.
 * `zloze`/`zlozeMinEra` z deposit-era.ts, `ulepszenia`/`improvementKey` z
 * main.ts::syncHexUlepszenieFields) — rekonstrukcja pole-po-polu po cichu
 * zgubiłaby te rozszerzenia.
 * / EN: full hex-grid (GameMap) serialize/restore for the save file. The save
 * now carries a ready map so loading does NOT need to call the generator
 * again. Purely structural — only the known GameMap-level fields are copied;
 * `hexes` is passed through WITHOUT per-hex reconstruction, because a single
 * Hex also carries dynamic fields outside the base type (e.g. `zloze`/
 * `zlozeMinEra` from deposit-era.ts, `ulepszenia`/`improvementKey` from
 * main.ts::syncHexUlepszenieFields) — field-by-field reconstruction would
 * silently drop those.
 */
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';

/** Plain-JSON zrzut GameMap potrzebny do gry bez ponownej generacji. */
export interface SerializedMapData {
  szerokoscQ: number;
  wysokoscR: number;
  hexes: Record<string, Hex>;
  seed: number;
  riverPaths: { q: number; r: number }[][];
  riverPathKinds?: GameMap['riverPathKinds'];
}

/**
 * Buduje snapshot z żywej mapy do zapisu. Zwraca referencje na te same
 * plain-JSON dane (bez klonowania) — bezpieczne, bo SaveGame jest
 * natychmiast serializowany przez JSON.stringify (save.ts::serializeGame)
 * zanim cokolwiek zdąży zmutować `map` — ten sam wzorzec co units/cities
 * w main.ts::buildSaveGameSnapshot (`.slice()` płytkie, nie deep-clone).
 */
export function serializeMapForSave(map: GameMap): SerializedMapData {
  return {
    szerokoscQ: map.szerokoscQ,
    wysokoscR: map.wysokoscR,
    hexes: map.hexes,
    seed: map.seed,
    riverPaths: map.riverPaths,
    riverPathKinds: map.riverPathKinds,
  };
}

/** Odtwarza GameMap ze snapshotu zapisu — BEZ wołania generatora. */
export function buildGameMapFromSnapshot(snap: SerializedMapData): GameMap {
  return {
    szerokoscQ: snap.szerokoscQ,
    wysokoscR: snap.wysokoscR,
    hexes: snap.hexes,
    seed: snap.seed,
    riverPaths: snap.riverPaths,
    riverPathKinds: snap.riverPathKinds,
  };
}

/**
 * Walidacja minimalna przed użyciem snapshotu — musi mieć dodatnie wymiary,
 * ziarno i niepusty obiekt heksów. Celowo płytka bramka (nie sprawdza KAŻDEGO
 * heksa — kosztowne na dużych mapach): JSON uszkodzony na tyle, by to nie
 * wyłapać, i tak wywali się dalej w pipeline z czytelnym błędem zamiast
 * cichej złej mapy.
 */
export function isValidMapSnapshot(snap: unknown): snap is SerializedMapData {
  if (!snap || typeof snap !== 'object') return false;
  const s = snap as Partial<SerializedMapData>;
  return (
    typeof s.szerokoscQ === 'number' && s.szerokoscQ > 0 &&
    typeof s.wysokoscR === 'number' && s.wysokoscR > 0 &&
    typeof s.seed === 'number' &&
    !!s.hexes && typeof s.hexes === 'object' && !Array.isArray(s.hexes) &&
    Object.keys(s.hexes).length > 0 &&
    Array.isArray(s.riverPaths)
  );
}
