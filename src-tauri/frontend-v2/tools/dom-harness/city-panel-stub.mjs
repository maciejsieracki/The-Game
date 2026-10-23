/**
 * city-panel-stub.mjs — atrapa `gra/src/ui/cityPanel.ts` po stronie PINU w harnessie `run-cityux.mjs` (P5.7 r3).
 *
 * Pin `cityUxFrame.ts:6-11` importuje z `./cityPanel` trzy funkcje; harness podmienia ten import (opcja `alias` w
 * `build.mjs`) na ten plik, a po stronie v2 rejestruje w moście `cityPanelUxBridge.ts` TĘ SAMĄ implementację
 * (`globalThis.__cityPanelStub`). Dzięki temu porównanie mierzy wyłącznie ramkę (`cityUxFrame.ts`), nie panel miasta
 * (port `cityPanel.ts` = P5.7 r4). Argument `map` pinu (`GameMap`) jest odnotowywany osobno (`mapArg`) i nie trafia do
 * zrzutu — v2 nie przekazuje mapy (ZAŁOŻENIE P5.7-Z7).
 */
const h = () => globalThis.__cityPanelStub;

export function paintCityPanelSections(mounts, city, map, refresh, onClose) {
  h().mapArg(map);
  h().paint(mounts, city, refresh, onClose);
}

export function clearCityPanelUxMode() {
  h().clear();
}

export function navigateCityPanel(dir) {
  h().nav(dir);
}
