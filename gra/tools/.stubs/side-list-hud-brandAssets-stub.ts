// Stub prywatny dla side-list-hud-panel-coverage-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY:
// każdy test ma WŁASNY plik stub, nie dzieli go z innymi bramkami — patrz nota w
// army-merge-dismiss-bounce-test.cjs).
// Zwraca marker <svg data-icon="ID" data-size="N"/> zamiast prawdziwej ikony -- test
// asercjonuje na tym markerze, że właściwe ID/rozmiar faktycznie płyną z kodu (nie tylko
// puste zaślepki), bez potrzeby resolvowania prawdziwych plików SVG z brand-booka.
// / EN: private stub — returns an inspectable marker instead of a blank string, so the
// test can assert the real icon id/size actually flows through the rendering code.
export function brandIconSvg(id: string, size?: number): string {
  return `<svg data-icon="${id}" data-size="${size ?? 24}"></svg>`;
}
export function mapResourceIconSvg(key: string, size?: number): string {
  return `<svg data-resicon="${key}" data-size="${size ?? 24}"></svg>`;
}
