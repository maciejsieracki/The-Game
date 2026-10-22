/**
 * controller/unitThumbnails.ts — miniatury jednostek renderowane przez Rust (P5.2, D-UI-3, P4-5C).
 *
 * Panel nie renderuje 3D (zakaz `three`/`render/**`, P5.13). Dostawca zwraca URL obrazu
 * (np. `data:`/`asset:` z renderera Rust) albo `null`. Domyślnie (atrapa MOCK) — `null`, więc
 * `unitMiniPreview.ts` pokazuje pusty placeholder o rozmiarze miniatury. Komenda/zdarzenie
 * dostarczające obraz w Rust: NIE_ZMIERZONO (P4-5C).
 */
export type UnitThumbnailProvider = (unitName: string, ownerColor: number) => string | null;

let provider: UnitThumbnailProvider = () => null;

export function installUnitThumbnailProvider(p: UnitThumbnailProvider): void {
  provider = p;
}

export function unitThumbnailUrl(unitName: string, ownerColor: number): string | null {
  return provider(unitName, ownerColor);
}
