// Stub prywatny dla unit-info-card-entitycard-migration-test.cjs
// (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY: każdy test ma WŁASNY plik stub — patrz nota
// w army-merge-dismiss-bounce-test.cjs / entity-card-contract-brandAssets-stub.ts).
//
// Powód: nie testujemy tu prawdziwego renderu WebGL (brak realnego kontekstu w
// jsdom/node bez `gl`/`canvas`), tylko KOLEJNOŚĆ wywołania `mount()` względem
// osadzenia medalionu w drzewku karty (patrz `19-dispatch-T4-migracja-jednostka-mapa.md`
// „KRYTYCZNE — mechanizm 3D"). Rejestrujemy każde wywołanie z `container.parentElement`
// zbadanym W MOMENCIE wywołania — jeśli `renderer.ts`/`unitInfoCard.ts` wywołałyby
// `mount()` PRZED `appendChild` medalionu do nagłówka, `hadParent` byłoby `false`.
export interface MountCall {
  hadParent: boolean;
  tagName: string;
  unitName: string;
}
export const mountCalls: MountCall[] = [];

export function mountUnitMiniPreview(
  container: HTMLElement,
  u: { Jednostka?: string | null },
  _ownerColor?: number,
  _fallbackText?: string,
): void {
  mountCalls.push({
    hadParent: container.parentElement !== null,
    tagName: container.tagName,
    unitName: String(u?.Jednostka ?? ''),
  });
  container.textContent = 'STUB-3D-PREVIEW';
  container.classList.add('stub-mounted');
}

export function defaultOwnerColor(): number {
  return 0x3b7dd8;
}
