// ============================================================================
// civMusic.ts — CZYSTA logika wyboru muzyki dyplomacji po civId rozmówcy
// (zero DOM/Audio/Vite; testowalna w Node). Dane: data/civ-music.json.
//
//   resolveCivDiplomacyTracks(manifest, civId, available, fallbackUrls)
//     -> { urls, leadCount } albo null (cywilizacja bez wpisu / bez
//        żadnego dostępnego pliku => wołający zostaje przy dotychczasowym
//        dźwięku dyplomacji, ZERO regresji).
//   urls = [przywitanie?, ...negocjacje] (leadCount = 1 gdy jest przywitanie).
//   Brak negocjacji (Sumerowie): po przywitaniu gra dotychczasowy utwór
//   dyplomacji (fallbackUrls) w pętli. Brak przywitania (Inkowie): rozmowa
//   zaczyna od negocjacji. Nazwy plików w manifeście, których nie ma w
//   `available` (klucz "<civId>/<plik>"), są po cichu pomijane.
// ============================================================================

export interface CivMusicEntry {
  greeting?: string;
  negotiation?: readonly string[];
}
export type CivMusicManifest = Readonly<Record<string, CivMusicEntry | string>>;

export interface CivDiplomacyTracks {
  urls: readonly string[];
  leadCount: number;
}

export function resolveCivDiplomacyTracks(
  manifest: CivMusicManifest,
  civId: string | undefined,
  available: Readonly<Record<string, string>>,
  fallbackUrls: readonly string[],
): CivDiplomacyTracks | null {
  if (!civId || civId.startsWith('_') || !Object.prototype.hasOwnProperty.call(manifest, civId)) return null;
  const entry = manifest[civId];
  if (!entry || typeof entry !== 'object') return null;
  const find = (name: unknown): string | null => {
    if (typeof name !== 'string' || name === '') return null;
    return available[`${civId}/${name}`] ?? null;
  };
  const greeting = find(entry.greeting);
  const negotiation = (Array.isArray(entry.negotiation) ? entry.negotiation : [])
    .map(find)
    .filter((u): u is string => u !== null);
  if (greeting === null && negotiation.length === 0) return null;
  const tail = negotiation.length > 0 ? negotiation : fallbackUrls;
  const urls = greeting !== null ? [greeting, ...tail] : [...tail];
  return { urls, leadCount: greeting !== null && tail.length > 0 ? 1 : 0 };
}
