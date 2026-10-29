/**
 * controller/k09aWiring.ts — wiring K09A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 1).
 *
 * Podłącza:
 *   1. `setK09aDeps` — efekty DOM ramki i HUD: `showCityUxFrame`, `hideCityUxFrame`, `refreshCityUxFrame` z
 *      `ui/cityUxFrame`, `setMapHudChromeSuppressed` z `ui/hud`, `setHoverDetailDocks` z `ui/hoverDetailDock`;
 *      `hideCityPanel` = jednostka `k09a-paint` (cięcie cyklu rerender↔paint, K09A-Z2).
 *   2. `setK09aHooks` — haki `cfg` pinu spoza `K05bCfg` (K09A-Z3), podawane przez wywołującego.
 *   3. `setK08aDeps` — `rerender` = jednostka K09A `rerender` (zastępuje wartość z `installK08cWiring`, P5.8-Z1),
 *      `clearGarrisonPanel`, `disposeHoverDetailDock`, `isCityUxFrameOpen` = realne funkcje portu (jak w K08C).
 *
 * Kolejność: wywołać PO `installK08cWiring` (ten ustawia `setK08aDeps` z atrapą `rerender` z hosta).
 * Reguła (P5.13): wiring NIE liczy reguł gry i nie tworzy atrap. Haki przychodzą od wywołującego.
 *
 * Granice (NIE_ZROBIONE, K09B): produkcyjne podpięcie wiringu w kontrolerze, rejestracja w `cityPanelUxBridge.ts`
 * (P5.8-Z7), mapowanie id number→string (K08D-Z10). Ten moduł NIE zmienia `cityPanelUxBridge.ts`.
 */
import { setK08aDeps } from '../ui/cityPanel/k08a-fundament';
import { clearGarrisonPanel } from '../ui/cityPanel/k06b-garnizon';
import { setK09aDeps, setK09aHooks, type K09aHooks } from '../ui/cityPanel/k09a-deps';
import { rerender } from '../ui/cityPanel/k09a-rerender';
import { hideCityPanel } from '../ui/cityPanel/k09a-paint';
import { setHoverDetailDocks, disposeHoverDetailDock } from '../ui/hoverDetailDock';
import { hideCityUxFrame, isCityUxFrameOpen, refreshCityUxFrame, showCityUxFrame } from '../ui/cityUxFrame';
import { setMapHudChromeSuppressed } from '../ui/hud';

/** Wywołujący podaje wyłącznie haki `cfg` pinu, których nie ma w `K05bCfg` (K09A-Z3). */
export type K09aWiringHost = K09aHooks;

/** Podłącza delegaty i haki K09A. Wywoływać raz przy starcie UI panelu miasta, po `installK08cWiring`. */
export function installK09aWiring(host: K09aWiringHost = {}): void {
  setK09aDeps({
    hideCityPanel: () => hideCityPanel(),
    setHoverDetailDocks: (mounts) => setHoverDetailDocks(mounts),
    setMapHudChromeSuppressed: (suppressed) => setMapHudChromeSuppressed(suppressed),
    showCityUxFrame: (city, paint, onClose) => showCityUxFrame(city, paint, onClose),
    hideCityUxFrame: () => hideCityUxFrame(),
    refreshCityUxFrame: (city, paint) => refreshCityUxFrame(city, paint),
  });
  setK09aHooks(host);
  setK08aDeps({
    rerender: () => rerender(),
    clearGarrisonPanel: () => clearGarrisonPanel(),
    disposeHoverDetailDock: () => disposeHoverDetailDock(),
    isCityUxFrameOpen: () => isCityUxFrameOpen(),
  });
}
