/**
 * buildStampToggle.ts — ukrywa pieczęć builda (inject-build-stamp.ps1) domyślnie;
 * mały przycisk ℹ w lewym dolnym rogu pokazuje/ukrywa na żądanie.
 */

const STORAGE_KEY = 'civ-build-stamp-visible';
const TOGGLE_ID = 'civ-build-stamp-toggle';
const STAMP_ID = 'civ-build-stamp';

let initialized = false;

function fixStampEncoding(stamp: HTMLElement): void {
  const text = stamp.textContent;
  if (!text) return;
  const fixed = text.replace(/\u00c2\u00b7/g, '\u00b7').replace(/Â·/g, '\u00b7');
  if (fixed !== text) stamp.textContent = fixed;
}

function readVisiblePreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeVisiblePreference(visible: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, visible ? '1' : '0');
  } catch {
    /* private mode / blocked storage */
  }
}

export function initBuildStampToggle(): void {
  if (initialized) return;

  const stamp = document.getElementById(STAMP_ID);
  if (!stamp) return;
  initialized = true;

  fixStampEncoding(stamp);

  let toggle = document.getElementById(TOGGLE_ID) as HTMLButtonElement | null;
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.id = TOGGLE_ID;
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Informacja o wersji builda');
    toggle.textContent = '\u2139';
    Object.assign(toggle.style, {
      position: 'fixed',
      bottom: '6px',
      left: '6px',
      zIndex: '2147483646',
      width: '22px',
      height: '22px',
      font: '13px/1 ui-sans-serif, system-ui, sans-serif',
      background: 'rgba(0,0,0,.45)',
      color: 'rgba(212,175,55,.8)',
      border: '1px solid rgba(212,175,55,.28)',
      borderRadius: '4px',
      cursor: 'pointer',
      padding: '0',
      opacity: '0.5',
      pointerEvents: 'auto',
    });
    toggle.addEventListener('mouseenter', () => {
      toggle!.style.opacity = '0.95';
    });
    toggle.addEventListener('mouseleave', () => {
      toggle!.style.opacity = '0.5';
    });
    document.body.appendChild(toggle);
  }

  const applyVisible = (visible: boolean): void => {
    stamp.style.display = visible ? 'block' : 'none';
    stamp.style.bottom = visible ? '32px' : '6px';
    stamp.style.pointerEvents = visible ? 'auto' : 'none';
    toggle!.setAttribute('aria-pressed', visible ? 'true' : 'false');
    toggle!.title = visible ? 'Ukryj informację o wersji' : 'Pokaż informację o wersji';
  };

  applyVisible(readVisiblePreference());

  toggle.addEventListener('click', () => {
    const next = stamp.style.display === 'none';
    applyVisible(next);
    writeVisiblePreference(next);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBuildStampToggle, { once: true });
  } else {
    initBuildStampToggle();
  }
}
