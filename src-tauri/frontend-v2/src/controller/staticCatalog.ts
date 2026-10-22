/**
 * controller/staticCatalog.ts — jedyne miejsce, z którego panele czytają `StaticCatalogDto` (P5.2).
 *
 * Zastępuje w portowanych panelach importy `gra/data/*.json`, `src/data/loader` i stałych z `game/**`
 * (D-UI-4, rozstrzygnięcie tymczasowe orkiestratora: dane statyczne tylko jako ten sam plik/atrapa;
 * źródłem docelowo Rust — `get_view { key: staticCatalog }`, P5-0 §6.1, ZAŁOŻENIE Z2).
 *
 * ZAŁOŻENIE P5.2-Z1 (kolejność startu): katalog jest instalowany (`installStaticCatalog`) ZANIM
 * zostanie wyewaluowany moduł UI, który czyta go na poziomie modułu (`leaderPortraits.ts`,
 * `uiParams.ts`). `main.ts` instaluje katalog przed jakimkolwiek panelem. Odczyt przed instalacją
 * rzuca jawny błąd (zamiast cicho zwracać puste dane).
 *
 * Moduł niczego nie liczy (P5.13): `unitCategoryFromCatalog` to odczyt mapy z Rust.
 */
import type { StaticCatalogDto } from '../viewmodel/types';

let current: StaticCatalogDto | null = null;

export function installStaticCatalog(catalog: StaticCatalogDto): void {
  current = catalog;
}

export function hasStaticCatalog(): boolean {
  return current !== null;
}

export function staticCatalog(): StaticCatalogDto {
  if (current === null) {
    throw new Error('frontend-v2: StaticCatalogDto nie zainstalowany (installStaticCatalog przed ewaluacją paneli, ZAŁOŻENIE P5.2-Z1)');
  }
  return current;
}

/**
 * Kategoria jednostki z katalogu (zastępuje `categoryOf`, `units/setup.ts:239`).
 * `withDef = true` — wołający ma wiersz `UnitDef` (web: `categoryOf(Jednostka, rola, isSuper, Typ)`)
 * → `StaticCatalogDto.unitCategory`; `false` — zna tylko nazwę (web: `categoryOf(id, '', false, undefined)`)
 * → `StaticCatalogDto.unitCategoryNameOnly`.
 * ZAŁOŻENIE P5.2-Z2: nazwa spoza katalogu → `'domyslny'` (web klasyfikowałby ją po słowach kluczowych
 * nazwy; w Rust każda jednostka gry jest w katalogu, więc różnica dotyczy tylko nazw spoza `units.json`;
 * dla pustej nazwy web też zwraca `'domyslny'`, `units/setup.ts:303`).
 */
export function unitCategoryFromCatalog(unitName: string, withDef: boolean): string {
  const c = staticCatalog();
  return (withDef ? c.unitCategory : c.unitCategoryNameOnly)[unitName] ?? 'domyslny';
}
