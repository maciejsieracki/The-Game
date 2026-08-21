/**
 * entityCards/types.ts — wspólny kontrakt karty encji (T1 KONTRAKT-KARTA-ENCJI).
 *
 * Patrz `dyspozycje/autobot/runs/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1/05-architektura-plan.md`
 * §1 dla pełnego uzasadnienia kształtu. TYLKO nowe pliki w tym module — zero edycji
 * `unitInfoCard.ts`/`cityPanel.ts`/`techDiscoveryNotice.ts`/`scienceHubHud.ts`/
 * `techTreeView.ts`/`sciencePicker.ts`/`research.ts` w tym kroku (T1).
 */

/** Cztery rodzaje encji obsługiwane przez wspólną kartę. */
export type EntityKind = 'unit' | 'building' | 'technology' | 'improvement';

/** Jeden wiersz w sekcji karty (np. "Atak: 6"). */
export interface EntityCardRow {
  label: string;
  value: string;
  emphasize?: boolean;
  /** Jeśli podane — wiersz jest klikalny i otwiera kartę innej encji (T10). */
  linkTo?: { kind: EntityKind; id: string };
}

/** Jedna sekcja karty (np. "Walka", "Ekonomia", "Wymagania"). */
export interface EntityCardSection {
  /** Klucz stabilny sekcji, np. 'combat' | 'economy' | 'requirements' | 'unlocks'. */
  key: string;
  title: string;
  rows: EntityCardRow[];
  badges?: string[];
  /** Akordeon — potrzebne dla kart technologii z wieloma odblokowaniami. */
  collapsible?: boolean;
  openDefault?: boolean;
}

/** Medalion nagłówka karty: statyczna ikona SVG albo montowany 3D-podgląd jednostki. */
export type EntityCardMedallion =
  | { kind: 'icon'; svg: string }
  | { kind: 'unit3d'; mount: (slot: HTMLElement) => void };

/** Link do wpisu CivPedii (ECHO Q2=A — osobny kanał, karta go NIE scala z treścią). */
export interface EntityCardCivpediaLink {
  folder: string;
  slug: string;
}

/** Akcja na dole karty (np. "Rozpocznij badanie", "Zbuduj"). */
export interface EntityCardAction {
  id: string;
  label: string;
  kind: 'primary' | 'secondary';
  onClick: () => void;
}

/** Dane karty encji — wynik adaptera, wejście renderera. Rozdział "zbierz dane"
 * od "zbuduj DOM" jest sednem refaktoru (ECHO Q1=B), nie kosmetyką. */
export interface EntityCardData {
  kind: EntityKind;
  /** Kanoniczny EntityId per kind — patrz plan architektury §2. */
  id: string;
  title: string;
  subtitle?: string;
  medallion: EntityCardMedallion;
  sections: EntityCardSection[];
  /** ECHO Q2=A: kanał 2 obok karty, nie scalanie treści. `null`/brak = brak linku. */
  civpediaLink?: EntityCardCivpediaLink | null;
  statusBadges?: string[];
  actions?: EntityCardAction[];
}

/** Tryb otwarcia karty. `dialog` w T1 jest jedynym w pełni obsługiwanym przez renderer
 * (patrz `06-dispatch-T1-kontrakt.md`); `inline`/`hover` dochodzą w T5. Sygnatura musi
 * istnieć już teraz, żeby kolejne tematy nie zmieniały kontraktu opts. */
export type EntityCardMode = 'dialog' | 'inline' | 'hover';

/** Kontekst przekazywany do adapterów: GameData (jak dziś) plus opcjonalny stan
 * zależny od gracza — to, co dziś `buildBuildingBuildTabDetailCard`/`buildUnitDetailCard`
 * dostają jako osobne argumenty, tu schodzi do jednego pola. Typ pozostaje celowo
 * luźny (`unknown`/opcjonalne pola) w T1 — dokładny kształt `GameData` żyje w
 * `data/loader.ts` i nie jest importowany tu, żeby T1 zostało zero-zależne od
 * reszty gry (patrz allowlista T1: wyłącznie nowe pliki w `entityCards/**`).
 */
export interface EntityCardCtx {
  /** GameData z `data/loader.ts` — typ nie importowany celowo w T1, patrz wyżej. */
  gameData?: unknown;
  unlockedTechs?: ReadonlySet<string>;
  city?: unknown;
  ownerId?: number;
}

/** Opcje otwarcia karty (`openEntityCard`). Przekazywane 1:1 do adaptera tech dla
 * kompatybilności wstecznej (`onOpenTree`, `onStartResearch` — patrz `techDiscoveryNotice.ts`
 * dzisiejsze wywołania w `scienceHubHud.ts`/`techTreeView.ts`, migrowane dopiero w T3). */
export interface OpenEntityCardOptions {
  mode?: EntityCardMode;
  /** Wymagane dla `mode: 'inline'`. */
  container?: HTMLElement;
  ctx?: EntityCardCtx;
  onOpenTree?: () => void;
  onStartResearch?: () => void;
}

/** Funkcja dismiss() zwracana przez `openEntityCard`. */
export type EntityCardDismiss = () => void;

/** Adapter: surowy wiersz źródłowy (kind-specyficzny) → dane karty. Zwraca `null`
 * gdy resolver nie znalazł encji o podanym id (patrz `registry.ts`). */
export type EntityCardAdapter<Row> = (row: Row, ctx: EntityCardCtx) => EntityCardData;

/** Resolver: id → surowy wiersz (albo null jeśli nie znaleziono). Per-kind, cienki —
 * patrz plan §2 (`registry.ts` implementuje to dla 4 kinds). */
export type EntityCardResolver<Row> = (id: string) => Row | null;
