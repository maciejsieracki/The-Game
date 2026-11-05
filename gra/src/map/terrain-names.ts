/**
 * terrain-names.ts — JEDNO ŹRÓDŁO PRAWDY mapy id ↔ nazwa terenu bazowego.
 *
 * R-WEB-TERRAIN-ID-NAME-MAP-UNIFY-Q1: wcześniej ta sama wiedza żyła w czterech kopiach
 * (hexContextTooltip, minimap, economy, units/setup). Każda kopia trzyma swój format klucza
 * (etykieta z diakrytykami z danych, klucz ASCII z terrain-movement.json, etykieta wyświetlana).
 * Tu jest jedna tabela; wszystkie widoki (mapy/aliasy) są z niej wyprowadzone.
 *
 * Zachowanie gry NIE zmienia się: każdy widok zwraca dokładnie te same klucze i wartości co
 * dotychczasowa kopia, której używał. Test równoważności: gra/tools/terrain-names-equivalence-test.cjs.
 */
import { TerenBazowy } from '../types/hex';

interface TerenRow {
  readonly id: TerenBazowy;
  /** Etykieta wyświetlana w UI (hexContextTooltip). */
  readonly labelPl: string;
  /** Klucz ASCII używany w minimapie (minimap.ts) i jako pierwszy alias w terrain-movement.json. */
  readonly asciiKey: string;
  /** Etykieta `Teren` z data/terrain-yields.json (dokładne dopasowanie, jak w economy.ts). */
  readonly dataLabel: string;
  /** Wszystkie aliasy akceptowane przy czytaniu klucza kosztów ruchu (units/setup.ts). */
  readonly movementAliases: readonly string[];
}

const TEREN_TABLE: readonly TerenRow[] = [
  { id: TerenBazowy.Laka,         labelPl: 'Łąka',          asciiKey: 'Laka',     dataLabel: 'Łąka',     movementAliases: ['Laka', 'Łąka', 'laka'] },
  { id: TerenBazowy.Rownina,      labelPl: 'Równina',       asciiKey: 'Rownina',  dataLabel: 'Równina',  movementAliases: ['Rownina', 'Równina', 'rownina'] },
  { id: TerenBazowy.Wzgorza,      labelPl: 'Wzgórza',       asciiKey: 'Wzgorza',  dataLabel: 'Wzgórza',  movementAliases: ['Wzgorza', 'Wzgórza', 'wzgorza'] },
  { id: TerenBazowy.Gory,         labelPl: 'Góry',          asciiKey: 'Gory',     dataLabel: 'Góry',     movementAliases: ['Gory', 'Góry', 'gory'] },
  { id: TerenBazowy.PlytkieMorze, labelPl: 'Płytkie morze', asciiKey: 'Wybrzeze', dataLabel: 'Wybrzeże', movementAliases: ['Wybrzeze', 'Wybrzeże', 'wybrzeze'] },
  { id: TerenBazowy.Morze,        labelPl: 'Morze',         asciiKey: 'Morze',    dataLabel: 'Morze',    movementAliases: ['Morze', 'morze'] },
  { id: TerenBazowy.Pustynia,     labelPl: 'Pustynia',      asciiKey: 'Pustynia', dataLabel: 'Pustynia', movementAliases: ['Pustynia', 'pustynia'] },
  { id: TerenBazowy.Polarny,      labelPl: 'Polarny',       asciiKey: 'Polarny',  dataLabel: 'Polarny',  movementAliases: ['Polarny', 'polarny'] },
];

/** Etykieta wyświetlana w UI, klucz: TerenBazowy. (dawniej hexContextTooltip.TEREN_LABEL) */
export const TEREN_LABEL_PL: Readonly<Record<TerenBazowy, string>> = Object.freeze(
  Object.fromEntries(TEREN_TABLE.map(r => [r.id, r.labelPl])) as Record<TerenBazowy, string>,
);

/** Klucz ASCII minimapy, klucz: TerenBazowy. (dawniej minimap.TEREN_KEY) */
export const TEREN_MINIMAP_KEY: Readonly<Record<TerenBazowy, string>> = Object.freeze(
  Object.fromEntries(TEREN_TABLE.map(r => [r.id, r.asciiKey])) as Record<TerenBazowy, string>,
);

/** Etykieta `Teren` z terrain-yields.json → TerenBazowy (dokładne dopasowanie). (dawniej economy.TERRAIN_NAME_TO_ENUM) */
export const TEREN_DANE_LABEL_TO_ENUM: Readonly<Record<string, TerenBazowy>> = Object.freeze(
  Object.fromEntries(TEREN_TABLE.map(r => [r.dataLabel, r.id])) as Record<string, TerenBazowy>,
);

/** Alias klucza kosztów ruchu (terrain-movement.json, Excel) → TerenBazowy. (dawniej setup.TERRAIN_MOVEMENT_KEY_ALIASES) */
export const TEREN_MOVEMENT_KEY_ALIASES: Readonly<Record<string, TerenBazowy>> = Object.freeze(
  Object.fromEntries(
    TEREN_TABLE.flatMap(r => r.movementAliases.map(a => [a, r.id] as const)),
  ) as Record<string, TerenBazowy>,
);
