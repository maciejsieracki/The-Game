/**
 * gamePauseMenu.ts — menu pomocnicze w trakcie gry (zapis / wczytaj / nowa / menu główne).
 * Nie zastępuje mainMenu.ts — to warstwa pauzy nad sceną (z-index 480).
 */

export interface GamePauseMenuConfig {
  hasSave?: () => boolean;
  onResume: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNewGame: () => void;
  onMainMenu: () => void;
}

const STYLE_ID = 'civ-game-pause-css';
let cfg: GamePauseMenuConfig | null = null;
let root: HTMLDivElement | null = null;

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-pause{position:fixed;inset:0;z-index:480;display:flex;align-items:center;justify-content:center;
  background:rgba(8,10,18,0.72);font-family:var(--civ-font-ui, 'Segoe UI',Tahoma,sans-serif);color:#e8ebf0;}
.civ-pause-box{min-width:280px;max-width:360px;width:min(92vw,360px);
  background:linear-gradient(165deg,rgba(22,26,36,0.98),rgba(12,14,22,0.98));
  border:1px solid rgba(224,178,74,0.45);border-radius:12px;padding:22px 24px 18px;
  box-shadow:0 16px 48px rgba(0,0,0,0.55),inset 0 1px 0 rgba(232,216,138,0.12);}
.civ-pause-box h2{margin:0 0 4px;font-size:18px;font-weight:500;letter-spacing:.08em;color:#e0b24a;
  font-family:var(--civ-font-title, Georgia, serif);}
.civ-pause-sub{margin:0 0 18px;font-size:12px;color:#9aa4b8;line-height:1.4;}
.civ-pause-btns{display:flex;flex-direction:column;gap:8px;}
.civ-pause-btns button{width:100%;padding:10px 14px;border-radius:8px;cursor:pointer;
  font-size:13px;font-weight:600;border:1px solid rgba(224,178,74,0.28);background:rgba(30,34,46,0.9);color:#e8ebf0;
  transition:background .15s,border-color .15s;}
.civ-pause-btns button:hover:not(:disabled){background:rgba(224,178,74,0.14);border-color:rgba(224,178,74,0.5);}
.civ-pause-btns button:disabled{opacity:.45;cursor:not-allowed;}
.civ-pause-btns .civ-pause-primary{background:rgba(224,178,74,0.18);color:#f5e6b8;border-color:rgba(224,178,74,0.55);}
.civ-pause-btns .civ-pause-danger{margin-top:6px;border-color:rgba(180,90,70,0.45);color:#ffd0c8;}
.civ-pause-btns .civ-pause-danger:hover:not(:disabled){background:rgba(120,45,35,0.25);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

export function configureGamePauseMenu(config: GamePauseMenuConfig): void {
  cfg = config;
}

export function isGamePauseMenuOpen(): boolean {
  return root !== null;
}

export function showGamePauseMenu(): void {
  if (!cfg || root !== null) return;
  ensureStyles();
  root = document.createElement('div');
  root.className = 'civ-pause';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Menu gry');

  const hasSave = cfg.hasSave?.() ?? false;

  const box = document.createElement('div');
  box.className = 'civ-pause-box';
  box.innerHTML =
    '<h2>Menu gry</h2>' +
    '<p class="civ-pause-sub">Gra jest wstrzymana. Wybierz akcję lub wróć do rozgrywki.</p>' +
    '<div class="civ-pause-btns">' +
    '<button type="button" class="civ-pause-primary" data-act="resume">Wróć do gry</button>' +
    '<button type="button" data-act="save">💾 Zapisz grę</button>' +
    '<button type="button" data-act="load"' + (hasSave ? '' : ' disabled title="Brak zapisu"') + '>📂 Wczytaj grę</button>' +
    '<button type="button" data-act="new">🔄 Rozpocznij nową grę</button>' +
    '<button type="button" class="civ-pause-danger" data-act="main">☰ Przejdź do menu głównego</button>' +
    '</div>';

  root.appendChild(box);
  document.body.appendChild(root);

  root.addEventListener('click', (ev) => {
    if (ev.target === root) {
      hideGamePauseMenu();
      cfg?.onResume();
    }
  });

  box.querySelector('[data-act="resume"]')?.addEventListener('click', () => {
    hideGamePauseMenu();
    cfg?.onResume();
  });
  box.querySelector('[data-act="save"]')?.addEventListener('click', () => {
    cfg?.onSave();
  });
  box.querySelector('[data-act="load"]')?.addEventListener('click', () => {
    if (!hasSave) return;
    hideGamePauseMenu();
    cfg?.onLoad();
  });
  box.querySelector('[data-act="new"]')?.addEventListener('click', () => {
    hideGamePauseMenu();
    cfg?.onNewGame();
  });
  box.querySelector('[data-act="main"]')?.addEventListener('click', () => {
    hideGamePauseMenu();
    cfg?.onMainMenu();
  });
}

export function hideGamePauseMenu(): void {
  if (root !== null) {
    root.remove();
    root = null;
  }
}

export function toggleGamePauseMenu(): void {
  if (isGamePauseMenuOpen()) {
    hideGamePauseMenu();
    cfg?.onResume();
  } else {
    showGamePauseMenu();
  }
}
