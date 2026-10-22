/**
 * Miniatura 3D jednostki (buildUnitModel) — statyczny render z shared WebGL.
 *
 * P5.2 (D-UI-3, rozstrzygnięcie tymczasowe orkiestratora: miniatura = obraz z Rust): web renderował
 * miniaturę w UI (`three` + `render/units.buildUnitModel` + `units/setup.categoryOf`, pin `edb8fb56`
 * `gra/src/ui/unitMiniPreview.ts:4-113`). W frontend-v2 obraz dostarcza Rust
 * (`controller/unitThumbnails.ts`); dopóki dostawca zwraca `null` (atrapa MOCK), kontener dostaje
 * pusty placeholder o rozmiarze miniatury web (80×80, `VIEW_W`/`VIEW_H`). Zachowane: API
 * (`mountUnitMiniPreview`, `defaultOwnerColor`), klasy `unit-mini-preview` / `unit-mini-loading` /
 * `unit-mini-canvas` / `unit-mini-fallback`, kolejka z `requestAnimationFrame`.
 */
import type { UnitDefDto as UnitDef } from '../viewmodel/types';
import { unitThumbnailUrl } from '../controller/unitThumbnails';

const VIEW_W = 80;
const VIEW_H = 80;
const OWNER_DEFAULT = 0x3b7dd8;

/** Element miniatury: obraz z Rust albo pusty placeholder o rozmiarze VIEW_W×VIEW_H. */
function unitThumbElement(u: UnitDef, ownerColor: number): HTMLElement | null {
  const name = u.Jednostka ?? '';
  if (!name) return null;
  const url = unitThumbnailUrl(name, ownerColor);
  if (url) {
    const img = document.createElement('img');
    img.width = VIEW_W;
    img.height = VIEW_H;
    img.alt = '';
    img.src = url;
    return img;
  }
  const ph = document.createElement('span');
  ph.setAttribute('data-thumb', 'placeholder');
  ph.style.display = 'inline-block';
  ph.style.width = `${VIEW_W}px`;
  ph.style.height = `${VIEW_H}px`;
  return ph;
}

const queue: { u: UnitDef; color: number; container: HTMLElement; fallbackText?: string }[] = [];
let draining = false;

function drainQueue(): void {
  if (draining || queue.length === 0) return;
  draining = true;
  const job = queue.shift()!;
  requestAnimationFrame(() => {
    try {
      const thumb = unitThumbElement(job.u, job.color);
      job.container.innerHTML = '';
      if (thumb) {
        thumb.className = 'unit-mini-canvas';
        job.container.appendChild(thumb);
      } else {
        job.container.textContent = job.fallbackText ?? '⚔';
        job.container.classList.add('unit-mini-fallback');
      }
    } finally {
      draining = false;
      drainQueue();
    }
  });
}

/** Wstaw miniaturę (lazy) do kontenera. */
export function mountUnitMiniPreview(
  container: HTMLElement,
  u: UnitDef,
  ownerColor: number = OWNER_DEFAULT,
  fallbackText?: string,
): void {
  container.classList.add('unit-mini-preview');
  container.innerHTML = '<span class="unit-mini-loading">…</span>';
  queue.push({ u, color: ownerColor, container, fallbackText });
  drainQueue();
}

export function defaultOwnerColor(): number {
  return OWNER_DEFAULT;
}
