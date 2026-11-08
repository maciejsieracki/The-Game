// ============================================================================
// civMusic.ts — CZYSTA logika wyboru muzyki dyplomacji po civId rozmówcy
// (zero DOM/Audio/Vite; testowalna w Node). Dane: data/civ-music.json.
//
//   resolveCivDiplomacyTracks(manifest, civId, available, fallbackUrls)
//     -> { urls, leadCount } albo null (cywilizacja bez wpisu / bez
//        żadnego dostępnego pliku => wołający zostaje przy dotychczasowym
//        dźwięku dyplomacji, ZERO regresji).
//   urls = [przywitanie?, ...negocjacje] (leadCount = 1 gdy jest przywitanie).
//   greeting: string | string[] — lista przywitań używanych ZAMIENNIE: jedno na
//   rozmowę, rotacja po kolei per cywilizacja (nie to samo dwa razy z rzędu;
//   stan w pamięci sesji, bez zapisu). Indeks wstrzykiwalny (pickIndex) => testy
//   deterministyczne. string = jedno przywitanie (zgodność wsteczna).
//   Brak negocjacji (gdy wpis ich nie ma): po przywitaniu gra dotychczasowy utwór
//   dyplomacji (fallbackUrls) w pętli. Brak przywitania (Inkowie): rozmowa
//   zaczyna od negocjacji. Nazwy plików w manifeście, których nie ma w
//   `available` (klucz "<civId>/<plik>"), są po cichu pomijane.
// ============================================================================

export interface CivMusicEntry {
  greeting?: string | readonly string[];
  negotiation?: readonly string[];
}
export type CivMusicManifest = Readonly<Record<string, CivMusicEntry | string>>;

export interface CivDiplomacyTracks {
  urls: readonly string[];
  leadCount: number;
}

/** Wybiera indeks przywitania z `count` dostępnych (0..count-1). */
export type GreetingPicker = (civId: string, count: number) => number;

const lastGreeting = new Map<string, number>();

/** Domyślny wybór: rotacja po kolei per cywilizacja (0,1,0,1…), stan w pamięci sesji. */
export const rotateGreetingIndex: GreetingPicker = (civId, count) => {
  if (count <= 1) return 0;
  const last = lastGreeting.get(civId);
  const next = last === undefined ? 0 : (last + 1) % count;
  lastGreeting.set(civId, next);
  return next;
};

/** Zerowanie stanu rotacji (testy). */
export function resetGreetingRotation(): void {
  lastGreeting.clear();
}

export function resolveCivDiplomacyTracks(
  manifest: CivMusicManifest,
  civId: string | undefined,
  available: Readonly<Record<string, string>>,
  fallbackUrls: readonly string[],
  pickIndex: GreetingPicker = rotateGreetingIndex,
): CivDiplomacyTracks | null {
  if (!civId || civId.startsWith('_') || !Object.prototype.hasOwnProperty.call(manifest, civId)) return null;
  const entry = manifest[civId];
  if (!entry || typeof entry !== 'object') return null;
  const find = (name: unknown): string | null => {
    if (typeof name !== 'string' || name === '') return null;
    return available[`${civId}/${name}`] ?? null;
  };
  const greetings = (Array.isArray(entry.greeting) ? entry.greeting : [entry.greeting])
    .map(find)
    .filter((u): u is string => u !== null);
  let greeting: string | null = null;
  if (greetings.length > 0) {
    const i = Math.trunc(pickIndex(civId, greetings.length));
    greeting = greetings[Number.isFinite(i) && i >= 0 && i < greetings.length ? i : 0] as string;
  }
  const negotiation = (Array.isArray(entry.negotiation) ? entry.negotiation : [])
    .map(find)
    .filter((u): u is string => u !== null);
  if (greeting === null && negotiation.length === 0) return null;
  const tail = negotiation.length > 0 ? negotiation : fallbackUrls;
  const urls = greeting !== null ? [greeting, ...tail] : [...tail];
  return { urls, leadCount: greeting !== null && tail.length > 0 ? 1 : 0 };
}
