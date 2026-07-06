/**
 * saveLoadDialog.ts — wybór slotu zapisu / wczytywania (localStorage).
 * Warstwa UI: lista sejwów, nazwa zapisu, usuwanie. Logika stanu w main.ts + save.ts.
 */

import { listSaves, loadFromLocal, deleteLocal, type SaveGame } from '../game/save';

export interface SaveSlotSummary {
  slotId: string;
  label: string;
  tura: number;
  savedAt: string;
  /** Krótki opis mapy / stanu — żeby odróżnić własną grę od playtestu lub autosave. */
  context: string;
}

const TYP_SWIATA_LABEL: Record<string, string> = {
  kontynenty: 'Kontynenty',
  pangea: 'Pangea',
  wyspy: 'Wyspy',
  ziemia: 'Ziemia',
};

/** Jedna linia kontekstu: rozmiar · typ · cywilizacja · jednostki/miasta · seed. */
export function saveContextLine(g: SaveGame): string {
  const meta = g.meta as Record<string, unknown> | undefined;
  const ngp = meta?.newGameParams as {
    mapSize?: string;
    worldType?: string;
    typSwiata?: string;
    civId?: string;
  } | undefined;
  const mapSize = String(ngp?.mapSize ?? meta?.loadMapSize ?? '—');
  const worldRaw = ngp?.worldType ?? ngp?.typSwiata ?? meta?.loadTypSwiata ?? '';
  const world = typeof worldRaw === 'string'
    ? (TYP_SWIATA_LABEL[worldRaw] ?? (worldRaw || '—'))
    : '—';
  const civ = String(ngp?.civId ?? meta?.loadCivId ?? '—');
  const units = Array.isArray(g.units) ? g.units.length : 0;
  const cities = Array.isArray(g.cities) ? g.cities.length : 0;
  const seed = typeof g.seed === 'number' ? g.seed : 0;
  const origin = meta?.saveOrigin === 'playtest' ? ' · PLAYTEST' : '';
  const seedPart = seed > 0 ? ` · seed ${seed}` : '';
  return `${mapSize} · ${world} · ${civ} · ${units} j. / ${cities} miast${seedPart}${origin}`;
}

const STYLE_ID = 'civ-save-load-css';
let root: HTMLDivElement | null = null;

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-sl{position:fixed;inset:0;z-index:520;display:flex;align-items:center;justify-content:center;
  background:rgba(8,10,18,0.78);font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);color:#e8ebf0;}
.civ-sl-box{min-width:300px;max-width:420px;width:min(94vw,420px);max-height:min(88vh,520px);display:flex;flex-direction:column;
  background:linear-gradient(165deg,rgba(22,26,36,0.98),rgba(12,14,22,0.98));
  border:1px solid rgba(224,178,74,0.45);border-radius:12px;padding:20px 22px 16px;
  box-shadow:0 16px 48px rgba(0,0,0,0.55),inset 0 1px 0 rgba(232,216,138,0.12);}
.civ-sl-box h2{margin:0 0 6px;font-size:18px;font-weight:500;letter-spacing:.06em;color:#e0b24a;
  font-family:var(--civ-font-title,Georgia,serif);}
.civ-sl-sub{margin:0 0 14px;font-size:12px;color:#9aa4b8;line-height:1.45;}
.civ-sl-field{margin-bottom:12px;}
.civ-sl-field label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8a9bb0;margin-bottom:6px;}
.civ-sl-field input{width:100%;box-sizing:border-box;padding:9px 11px;border-radius:8px;border:1px solid rgba(224,178,74,0.35);
  background:rgba(10,12,18,0.85);color:#f0f2f6;font-size:14px;}
.civ-sl-field input:focus{outline:none;border-color:rgba(224,178,74,0.65);}
.civ-sl-list{flex:1;min-height:0;overflow-y:auto;margin:0 0 12px;border:1px solid rgba(224,178,74,0.2);border-radius:8px;
  background:rgba(8,10,16,0.5);}
.civ-sl-row{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;}
.civ-sl-row:last-child{border-bottom:none;}
.civ-sl-row:hover,.civ-sl-row.sel{background:rgba(224,178,74,0.1);}
.civ-sl-row-main{flex:1;min-width:0;}
.civ-sl-row-title{font-size:13px;font-weight:600;color:#f0f2f6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-sl-row-meta{font-size:11px;color:#8a9bb0;margin-top:2px;}
.civ-sl-del{flex-shrink:0;padding:4px 8px;font-size:11px;border-radius:6px;border:1px solid rgba(180,90,70,0.45);
  background:transparent;color:#ffb8a8;cursor:pointer;}
.civ-sl-del:hover{background:rgba(120,45,35,0.25);}
.civ-sl-empty{padding:18px 14px;font-size:12px;color:#8a9bb0;text-align:center;}
.civ-sl-btns{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;}
.civ-sl-btns button{padding:9px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;
  border:1px solid rgba(224,178,74,0.28);background:rgba(30,34,46,0.9);color:#e8ebf0;}
.civ-sl-btns button:hover{background:rgba(224,178,74,0.14);border-color:rgba(224,178,74,0.5);}
.civ-sl-btns .civ-sl-primary{background:rgba(224,178,74,0.18);color:#f5e6b8;border-color:rgba(224,178,74,0.55);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function closeDialog(): void {
  if (root) {
    root.remove();
    root = null;
  }
}

export function isSaveLoadDialogOpen(): boolean {
  return root !== null;
}

export function hideSaveLoadDialog(): void {
  closeDialog();
}

/** Id slotu localStorage (bezpieczny klucz) z etykiety gracza. */
export function slotIdFromLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return `zapis-${Date.now()}`;
  const base = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || `zapis-${Date.now()}`;
}

function formatSavedAt(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace('T', ' ');
    return d.toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso.slice(0, 16);
  }
}

/** Podsumowania wszystkich slotów (najnowsze pierwsze). */
export function summarizeSaveSlots(): SaveSlotSummary[] {
  const out: SaveSlotSummary[] = [];
  for (const slotId of listSaves()) {
    const g = loadFromLocal(slotId);
    if (!g) continue;
    const meta = g.meta as Record<string, unknown> | undefined;
    out.push({
      slotId,
      label: typeof meta?.label === 'string' && meta.label.trim() ? meta.label.trim() : slotId,
      tura: g.tura,
      savedAt: typeof meta?.savedAt === 'string' ? meta.savedAt : '',
      context: saveContextLine(g),
    });
  }
  out.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return out;
}

/** Najnowszy slot (do „Kontynuuj") lub null. */
export function mostRecentSaveSlotId(): string | null {
  const slots = summarizeSaveSlots();
  return slots[0]?.slotId ?? null;
}

export interface SaveDialogOptions {
  defaultLabel: string;
  turn: number;
  onSave: (slotId: string, label: string) => void;
  onCancel?: () => void;
}

export function showSaveGameDialog(opts: SaveDialogOptions): void {
  closeDialog();
  ensureStyles();
  const existing = summarizeSaveSlots();

  root = document.createElement('div');
  root.className = 'civ-sl';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Zapisz grę');

  const box = document.createElement('div');
  box.className = 'civ-sl-box';
  box.innerHTML =
    '<h2>Zapisz grę</h2>' +
    '<p class="civ-sl-sub">Podaj nazwę sejwu. Ta sama nazwa nadpisze istniejący zapis.</p>';

  const field = document.createElement('div');
  field.className = 'civ-sl-field';
  field.innerHTML = '<label for="civ-sl-name">Nazwa zapisu</label>';
  const input = document.createElement('input');
  input.id = 'civ-sl-name';
  input.type = 'text';
  input.maxLength = 48;
  input.value = opts.defaultLabel;
  input.autocomplete = 'off';
  field.appendChild(input);
  box.appendChild(field);

  if (existing.length > 0) {
    const hint = document.createElement('p');
    hint.className = 'civ-sl-sub';
    hint.style.marginTop = '0';
    hint.textContent = `Istniejące sejwy (${existing.length}): ${existing.slice(0, 3).map(s => s.label).join(', ')}${existing.length > 3 ? '…' : ''}`;
    box.appendChild(hint);
  }

  const btns = document.createElement('div');
  btns.className = 'civ-sl-btns';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Anuluj';
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'civ-sl-primary';
  saveBtn.textContent = 'Zapisz';

  const commit = () => {
    const label = input.value.trim() || `Zapis · tura ${opts.turn}`;
    const slotId = slotIdFromLabel(label);
    closeDialog();
    opts.onSave(slotId, label);
  };

  cancelBtn.addEventListener('click', () => {
    closeDialog();
    opts.onCancel?.();
  });
  saveBtn.addEventListener('click', commit);
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
    if (ev.key === 'Escape') { ev.preventDefault(); cancelBtn.click(); }
  });

  btns.append(cancelBtn, saveBtn);
  box.appendChild(btns);
  root.appendChild(box);
  document.body.appendChild(root);

  root.addEventListener('click', (ev) => {
    if (ev.target === root) cancelBtn.click();
  });
  input.focus();
  input.select();
}

export interface LoadDialogOptions {
  onLoad: (slotId: string) => void;
  onCancel?: () => void;
}

export function showLoadGameDialog(opts: LoadDialogOptions): void {
  closeDialog();
  ensureStyles();

  let slots = summarizeSaveSlots();
  let selectedId: string | null = slots[0]?.slotId ?? null;

  root = document.createElement('div');
  root.className = 'civ-sl';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Wczytaj grę');

  const box = document.createElement('div');
  box.className = 'civ-sl-box';
  box.innerHTML =
    '<h2>Wczytaj grę</h2>' +
    '<p class="civ-sl-sub">Wybierz sejw z listy. Usuń niepotrzebne przyciskiem ✕.</p>';

  const list = document.createElement('div');
  list.className = 'civ-sl-list';

  const renderList = () => {
    list.innerHTML = '';
    slots = summarizeSaveSlots();
    if (slots.length === 0) {
      selectedId = null;
      list.innerHTML = '<div class="civ-sl-empty">Brak zapisów na tym urządzeniu.<br>Zapisz grę w menu pauzy (Ctrl+S = szybki zapis).</div>';
      return;
    }
    if (!selectedId || !slots.some(s => s.slotId === selectedId)) {
      selectedId = slots[0]!.slotId;
    }
    for (const s of slots) {
      const row = document.createElement('div');
      row.className = 'civ-sl-row' + (s.slotId === selectedId ? ' sel' : '');
      row.dataset.slot = s.slotId;
      const main = document.createElement('div');
      main.className = 'civ-sl-row-main';
      main.innerHTML =
        `<div class="civ-sl-row-title">${escapeHtml(s.label)}</div>` +
        `<div class="civ-sl-row-meta">Tura ${s.tura} · ${formatSavedAt(s.savedAt)}</div>` +
        `<div class="civ-sl-row-meta">${escapeHtml(s.context)}</div>`;
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'civ-sl-del';
      del.title = 'Usuń zapis';
      del.textContent = '✕';
      del.addEventListener('click', (ev) => {
        ev.stopPropagation();
        deleteLocal(s.slotId);
        if (selectedId === s.slotId) selectedId = null;
        renderList();
      });
      row.append(main, del);
      row.addEventListener('click', () => {
        selectedId = s.slotId;
        renderList();
      });
      row.addEventListener('dblclick', () => {
        selectedId = s.slotId;
        closeDialog();
        opts.onLoad(s.slotId);
      });
      list.appendChild(row);
    }
  };

  renderList();
  box.appendChild(list);

  const btns = document.createElement('div');
  btns.className = 'civ-sl-btns';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Anuluj';
  const loadBtn = document.createElement('button');
  loadBtn.type = 'button';
  loadBtn.className = 'civ-sl-primary';
  loadBtn.textContent = 'Wczytaj';

  cancelBtn.addEventListener('click', () => {
    closeDialog();
    opts.onCancel?.();
  });
  loadBtn.addEventListener('click', () => {
    if (!selectedId) return;
    const id = selectedId;
    closeDialog();
    opts.onLoad(id);
  });

  btns.append(cancelBtn, loadBtn);
  box.appendChild(btns);
  root.appendChild(box);
  document.body.appendChild(root);

  root.addEventListener('click', (ev) => {
    if (ev.target === root) cancelBtn.click();
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
