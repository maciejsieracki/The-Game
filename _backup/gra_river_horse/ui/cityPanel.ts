/**
 * cityPanel.ts
 * Lazily-created side panel showing city details.
 * ASCII-only source; Polish user-facing strings use \uXXXX escapes.
 */

import type { City } from '../game/cities';
import type { GameMap } from '../types/map';
import { TerenBazowy, Nakladka } from '../types/hex';

// ---------------------------------------------------------------------------
// Module-level panel element (created on first use)
// ---------------------------------------------------------------------------

let panelEl: HTMLDivElement | null = null;

function getOrCreatePanel(): HTMLDivElement {
  if (panelEl !== null) {
    return panelEl;
  }

  const div = document.createElement('div');

  div.style.cssText = [
    'position:fixed',
    'top:60px',
    'right:12px',
    'width:250px',
    'background:rgba(10,12,20,0.92)',
    'color:#e8d88a',
    'border:1px solid rgba(232,216,138,0.3)',
    'border-radius:8px',
    'padding:12px 14px',
    'font:13px monospace',
    'z-index:300',
    'box-shadow:0 4px 24px rgba(0,0,0,0.7)',
    'display:none',
  ].join(';');

  document.body.appendChild(div);
  panelEl = div;
  return div;
}

// ---------------------------------------------------------------------------
// Hex-distance (cube coordinates, axial input)
// d = (|dq| + |dq+dr| + |dr|) / 2
// ---------------------------------------------------------------------------

function hexDist(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q2 - q1;
  const dr = r2 - r1;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

// ---------------------------------------------------------------------------
// Terrain display names (Polish, \uXXXX for diacritics)
// ---------------------------------------------------------------------------

const TEREN_NAMES: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]:    'Morze',
  [TerenBazowy.Wybrzeze]: 'Wybrze\u017ce',
  [TerenBazowy.Laka]:     '\u0141\u0105ka',
  [TerenBazowy.Rownina]:  'R\u00f3wnina',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Wzgorza]:  'Wzg\u00f3rza',
  [TerenBazowy.Gory]:     'G\u00f3ry',
};

// ---------------------------------------------------------------------------
// Build panel content
// ---------------------------------------------------------------------------

function buildContent(
  panel: HTMLDivElement,
  city: City,
  map: GameMap,
  onClose: () => void,
): void {
  // --- close button ---
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'X';
  closeBtn.style.cssText = [
    'position:absolute',
    'top:8px',
    'right:10px',
    'background:none',
    'border:none',
    'color:#e8d88a',
    'font:14px monospace',
    'cursor:pointer',
    'line-height:1',
    'padding:0',
  ].join(';');
  closeBtn.addEventListener('click', () => {
    onClose();
    hideCityPanel();
  });

  // --- city name header ---
  const nameEl = document.createElement('div');
  nameEl.textContent = city.name;
  nameEl.style.cssText = 'font-weight:bold;font-size:15px;margin-bottom:8px;padding-right:20px';

  // --- owner line ---
  // W\u0142a\u015bciciel: Gracz / AI
  const ownerEl = document.createElement('div');
  const ownerLabel = 'W\u0142a\u015bciciel: ';
  const ownerValue = city.ownerId === 0 ? 'Gracz' : 'AI';
  ownerEl.textContent = ownerLabel + ownerValue;
  ownerEl.style.marginBottom = '4px';

  // --- population line ---
  // Ludno\u015b\u0107: N
  const popEl = document.createElement('div');
  popEl.textContent = 'Ludno\u015b\u0107: ' + city.population;
  popEl.style.marginBottom = '8px';

  // --- terrain tally ---
  // Gather hexes within hex-distance <= 2 of city centre
  const tallies = new Map<TerenBazowy, number>();
  let lasCount = 0;

  for (let dq = -2; dq <= 2; dq++) {
    for (let dr = -2; dr <= 2; dr++) {
      if (hexDist(city.q, city.r, city.q + dq, city.r + dr) > 2) {
        continue;
      }
      const key = `${city.q + dq},${city.r + dr}`;
      const hex = map.hexes[key];
      if (hex === undefined) {
        continue;
      }
      const prev = tallies.get(hex.terenBazowy) ?? 0;
      tallies.set(hex.terenBazowy, prev + 1);
      if (hex.nakladka === Nakladka.Las) {
        lasCount += 1;
      }
    }
  }

  // Okolica (promie\u0144 2):
  const vicinityHeader = document.createElement('div');
  vicinityHeader.textContent = 'Okolica (promie\u0144 2):';
  vicinityHeader.style.cssText = 'margin-bottom:4px;border-top:1px solid rgba(232,216,138,0.2);padding-top:6px';

  const vicinityList = document.createElement('div');
  vicinityList.style.cssText = 'margin-bottom:8px;padding-left:8px';

  for (const [teren, count] of tallies) {
    if (count === 0) continue;
    const displayName = TEREN_NAMES[teren] ?? String(teren);
    const line = document.createElement('div');
    line.textContent = displayName + ': ' + count;
    vicinityList.appendChild(line);
  }
  if (lasCount > 0) {
    const lasLine = document.createElement('div');
    lasLine.textContent = 'Las: ' + lasCount;
    vicinityList.appendChild(lasLine);
  }

  // --- placeholder production lines (dimmer) ---
  const placeholderEl = document.createElement('div');
  placeholderEl.style.cssText = 'color:rgba(232,216,138,0.45);border-top:1px solid rgba(232,216,138,0.2);padding-top:6px';
  // Produkcja, Wzrost, Nauka (\u2014 = em dash)
  const placeholders: string[] = [
    'Produkcja: \u2014',
    'Wzrost: \u2014',
    'Nauka: \u2014',
  ];
  for (const text of placeholders) {
    const line = document.createElement('div');
    line.textContent = text;
    placeholderEl.appendChild(line);
  }

  // --- assemble ---
  panel.innerHTML = '';
  panel.appendChild(closeBtn);
  panel.appendChild(nameEl);
  panel.appendChild(ownerEl);
  panel.appendChild(popEl);
  panel.appendChild(vicinityHeader);
  panel.appendChild(vicinityList);
  panel.appendChild(placeholderEl);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Show the city panel for the given city.
 * Creates the panel lazily on first call; rebuilds content on every call.
 * Appends to document.body if not already attached.
 */
export function showCityPanel(city: City, map: GameMap, onClose: () => void): void {
  const panel = getOrCreatePanel();
  buildContent(panel, city, map, onClose);
  panel.style.display = 'block';
}

/** Hide (display:none) the city panel. */
export function hideCityPanel(): void {
  if (panelEl !== null) {
    panelEl.style.display = 'none';
  }
}

/** Returns true when the city panel is currently visible. */
export function isCityPanelOpen(): boolean {
  return panelEl !== null && panelEl.style.display !== 'none';
}
