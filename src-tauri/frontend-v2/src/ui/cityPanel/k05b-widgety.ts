/**
 * K05B batch 1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 1): jednostki K05 z DOM, grupa "widżety i wiersze".
 * Każdy blok poprzedzony markerem `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` jest kopią linii A..B pinu (z komentarzami),
 * jedyna zmiana bajtowa: `export ` przy deklaracji najwyższego poziomu. Bramka: tools/dom-harness/verify-k05b-copies.mjs.
 * `openEntityCard` idzie wprost z warstwy UI (ui/entityCards/renderer); `cfg` przez k05b-host.ts (K05B-Z1).
 */
import { el } from './k01b-dom';
import { cityPanelChipIconWrap } from './k01a-fundament';
import type { GarrisonUnit } from './k01a-fundament';
import { openEntityCard } from '../entityCards/renderer';
import { cfg } from './k05b-host';

// pin edb8fb56 gra/src/ui/cityPanel.ts:9257-9272
export function renderSplitPane(
  mount: HTMLElement,
  topRender: (row: HTMLElement) => void,
  bottomRender: (row: HTMLElement) => void,
): void {
  mount.innerHTML = '';
  const split = el('div', 'civ-v-split-pane');
  const rowTop = el('div', 'civ-v-split-col');
  const rowBot = el('div', 'civ-v-split-col');
  topRender(rowTop);
  bottomRender(rowBot);
  split.appendChild(rowTop);
  split.appendChild(rowBot);
  mount.appendChild(split);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:9359-9391
export function appendGarrisonUnitChip(parent: HTMLElement, u: GarrisonUnit): void {
  const hp = u.health ?? 100;
  const max = u.maxHealth ?? 100;
  const pct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, max)) * 100)));
  const low = pct < 40;
  const isHidden = u.inGarnizon === true;
  const chip = el('div', 'civ-v-garrison-chip' + (isHidden ? ' in-garnizon' : ''));
  chip.innerHTML =
    `<span class="gi">${cityPanelChipIconWrap('tb-army', 14)}</span><span class="gn">${u.nazwa}</span>` +
    `<span class="hpb"><span class="hpf ${low ? 'hpl' : ''}" style="width:${pct}%"></span></span>`;
  chip.title = `${u.nazwa} · ${hp}/${max} HP`
    + (isHidden ? ' · w koszarach (ufortyfikowana)' : '');
  if (cfg.onLeaveGarrison) {
    const leaveBtn = document.createElement('button');
    leaveBtn.type = 'button';
    leaveBtn.className = 'civ-v-garrison-leave-btn';
    leaveBtn.textContent = '−';
    leaveBtn.disabled = !isHidden;
    leaveBtn.title = isHidden
      ? `Odfortyfikuj — ${u.nazwa} zostaje na heksie miasta`
      : `${u.nazwa} — już na heksie miasta (sterowanie z mapy)`;
    leaveBtn.setAttribute('aria-label', isHidden ? `Odfortyfikuj — ${u.nazwa}` : u.nazwa);
    if (isHidden) {
      leaveBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        cfg.onLeaveGarrison?.(u.id);
      });
    }
    chip.appendChild(leaveBtn);
  }
  parent.appendChild(chip);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:9604-9616
export function improvementRangeRow(grid: HTMLElement, key: string, nazwa: string, count: number): void {
  const lEl = el('span', 'dc-l');
  lEl.textContent = nazwa;
  grid.appendChild(lEl);
  const vBtn = el('button', 'dc-v dc-v-btn');
  vBtn.type = 'button';
  vBtn.textContent = `${count}× — szczegóły →`;
  vBtn.setAttribute('data-entity-kind', 'improvement');
  vBtn.setAttribute('data-entity-id', key);
  vBtn.addEventListener('click', () => openEntityCard('improvement', key, { mode: 'dialog' }));
  grid.appendChild(vBtn);
}
