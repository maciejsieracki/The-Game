/**
 * index.ts
 * Barrel — re-eksportuje wszystkie typy z katalogu src/types/.
 * Importuj z '@/types' lub '../types' zamiast z poszczegolnych plikow.
 */

// Heksy i mapa
export * from './hex';
export * from './map';

// Gracze i ich zasoby
export * from './player';
export * from './resources';
export * from './tech';

// Miasta
export * from './city';

// Jednostki i armie
export * from './unit';
export * from './army';

// Dyplomacja
export * from './diplomacy';

// Tura
export * from './turn';

// Korzen stanu gry
export * from './game-state';
