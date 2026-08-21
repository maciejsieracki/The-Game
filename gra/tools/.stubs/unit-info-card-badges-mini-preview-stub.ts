// Stub prywatny dla unit-info-card-badges-real-render-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY).
// Ten test sprawdza WYŁĄCZNIE CSS sekcji "Statusy" (odznaki), nie 3D — patrz
// unit-info-card-migration-unitMiniPreview-stub.ts (ten sam wzorzec, osobny plik).
export function mountUnitMiniPreview(
  container: HTMLElement,
  _u: unknown,
  _ownerColor?: number,
  _fallbackText?: string,
): void {
  container.textContent = 'STUB-3D-PREVIEW';
}

export function defaultOwnerColor(): number {
  return 0x3b7dd8;
}
