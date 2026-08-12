/**
 * saveLoadDialog.ts — wybór slotu zapisu / wczytywania (localStorage).
 * Warstwa UI: lista sejwów, nazwa zapisu, usuwanie. Logika stanu w main.ts + save.ts.
 */

import {
  listSaves, loadFromLocal, deleteLocal,
  getLastPlayedSlotId,
  uniqueSlotIdFromLabel, slotSlugFromLabel,
  FSA_SLOT_PREFIX,
  loadSaveSlotMeta, extractSaveContextFields,
  type SaveGame, type SaveSlotMeta,
} from '../game/save';
import { listFsaAutosaveFiles, loadFsaAutosaveFile } from '../game/fsa-autosave';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

export interface SaveSlotSummary {
  slotId: string;
  label: string;
  tura: number;
  savedAt: string;
  /** Krótki opis mapy / stanu — żeby odróżnić własną grę od playtestu lub autosave. */
  context: string;
  /** Ostatnio grany / wczytany slot (Kontynuuj). */
  isLastPlayed?: boolean;
}

const TYP_SWIATA_LABEL: Record<string, string> = {
  kontynenty: 'Kontynenty',
  pangea: 'Pangea',
  wyspy: 'Wyspy',
  ziemia: 'Ziemia',
};

/**
 * Formatuje linię kontekstu z pola już wyciągniętych (współdzielone przez
 * saveContextLine — pełny SaveGame -- i podsumowania z osobnego klucza meta
 * -- Defekt C, runda 2, patrz save.ts::SaveSlotMeta).
 */
function formatSaveContext(f: {
  mapSize: string; worldType: string; civId: string;
  unitsCount: number; citiesCount: number; seed: number; saveOrigin: string;
}): string {
  const world = TYP_SWIATA_LABEL[f.worldType] ?? (f.worldType || '—');
  const origin = f.saveOrigin === 'playtest' ? ' · PLAYTEST' : '';
  const seedPart = f.seed > 0 ? ` · seed ${f.seed}` : '';
  return `${f.mapSize} · ${world} · ${f.civId} · ${f.unitsCount} j. / ${f.citiesCount} miast${seedPart}${origin}`;
}

/** Jedna linia kontekstu: rozmiar · typ · cywilizacja · jednostki/miasta · seed. */
export function saveContextLine(g: SaveGame): string {
  return formatSaveContext(extractSaveContextFields(g));
}

const STYLE_ID = 'civ-save-load-css';
let root: HTMLDivElement | null = null;
let activeOnCancel: (() => void) | undefined;

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
  popOverlay('save-load-dialog');
  if (root) {
    root.remove();
    root = null;
  }
  activeOnCancel = undefined;
}

function dismissSaveLoadViaEscape(): void {
  const cb = activeOnCancel;
  closeDialog();
  cb?.();
}

export function isSaveLoadDialogOpen(): boolean {
  return root !== null;
}

export function hideSaveLoadDialog(): void {
  closeDialog();
}

/** @deprecated użyj slotSlugFromLabel / uniqueSlotIdFromLabel z save.ts */
export function slotIdFromLabel(label: string): string {
  return slotSlugFromLabel(label);
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

/**
 * Porównanie dwóch slotów do sortowania malejąco (najnowsze pierwsze).
 * Klucz główny: `savedAt` (ISO, malejąco) -- bez zmian względem
 * dotychczasowego zachowania dla zapisów, które mają tę datę wypełnioną.
 * Klucz drugorzędny (WYŁĄCZNIE gdy `savedAt` puste u OBU porównywanych
 * slotów -- stare zapisy sprzed wprowadzenia `meta.savedAt`): numer tury
 * (`tura`, malejąco). Wybrany zamiast parsowania znacznika czasu z ID slotu,
 * bo format ID nie jest jednolity -- bywa stałą ('autosave'), rotacją bez
 * czasu ('autosave-N') albo 'slug-znacznikCzasuBase36' -- podczas gdy `tura`
 * jest zawsze liczbą (deserializeGame w save.ts domyślnie ustawia 1, patrz
 * `gra/src/game/save.ts:295`), więc jest bezpiecznym substytutem chronologii.
 * / EN: Comparator for descending sort (newest first). Primary key:
 * `savedAt` (ISO, descending) -- unchanged from prior behavior for saves
 * that have this date filled in. Secondary key (ONLY when `savedAt` is
 * empty on BOTH compared slots -- old saves predating `meta.savedAt`): turn
 * number (`tura`, descending). Chosen over parsing a timestamp out of the
 * slot ID, because the ID format isn't uniform -- it can be a constant
 * ('autosave'), a timestamp-less rotation ('autosave-N'), or
 * 'slug-base36Timestamp' -- whereas `tura` is always a number
 * (deserializeGame in save.ts defaults it to 1, see
 * `gra/src/game/save.ts:295`), making it a safe chronology substitute.
 */
export function compareSaveSlotsDesc(a: SaveSlotSummary, b: SaveSlotSummary): number {
  if (!a.savedAt && !b.savedAt) return b.tura - a.tura;
  return b.savedAt.localeCompare(a.savedAt);
}

/** Podsumowanie jednego slotu z SaveSlotMeta (klucz osobny, Defekt C) — bez pełnego parsowania zapisu. */
function summaryFromMeta(slotId: string, meta: SaveSlotMeta, lastPlayed: string | null): SaveSlotSummary {
  return {
    slotId,
    label: meta.label || slotId,
    tura: meta.tura,
    savedAt: meta.savedAt,
    context: formatSaveContext(meta),
    isLastPlayed: slotId === lastPlayed,
  };
}

/**
 * Podsumowania wszystkich slotów (najnowsze pierwsze).
 *
 * Defekt C (runda 2, Evaluator): wcześniej KAŻDE otwarcie tego dialogu robiło
 * pełny `loadFromLocal` (JSON.parse całego zapisu, mapSnapshot włącznie) dla
 * WSZYSTKICH slotów tylko po to, żeby pokazać label/turę/datę — kosztowne
 * przy wielu zapisach. Teraz: najpierw MAŁY klucz meta
 * (save.ts::loadSaveSlotMeta, patrz SaveSlotMeta) — gdy obecny, ZERO pełnego
 * parsowania. Fallback na pełne `loadFromLocal` WYŁĄCZNIE dla zapisów sprzed
 * tej naprawy (brak osobnego klucza meta) — wsteczna kompatybilność, stare
 * zapisy nie znikają z listy.
 *
 * MIGRACJA IDB: async -- listSaves/loadSaveSlotMeta/loadFromLocal/
 * getLastPlayedSlotId są teraz Promise-based (IndexedDB).
 */
export async function summarizeSaveSlots(): Promise<SaveSlotSummary[]> {
  const lastPlayed = await getLastPlayedSlotId();
  const out: SaveSlotSummary[] = [];
  for (const slotId of await listSaves()) {
    if (slotId.startsWith('_')) continue;
    const meta = await loadSaveSlotMeta(slotId);
    if (meta) {
      out.push(summaryFromMeta(slotId, meta, lastPlayed));
      continue;
    }
    // Fallback: stary zapis bez osobnego klucza meta -- pełne parsowanie (wolniejsze, ale kompatybilne wstecz).
    const g = await loadFromLocal(slotId);
    if (!g) continue;
    const gmeta = g.meta as Record<string, unknown> | undefined;
    out.push({
      slotId,
      label: typeof gmeta?.label === 'string' && gmeta.label.trim() ? gmeta.label.trim() : slotId,
      tura: g.tura,
      savedAt: typeof gmeta?.savedAt === 'string' ? gmeta.savedAt : '',
      context: saveContextLine(g),
      isLastPlayed: slotId === lastPlayed,
    });
  }
  out.sort(compareSaveSlotsDesc);
  return out;
}

/**
 * BLOKER B1 (Evaluator runda 1): podsumowania zapisów z katalogu FSA (dysk).
 * Bez tego autozapis na dysk był write-only -- gra zapisywała pliki, ale
 * gracz nigdy nie mógł ich wybrać do wczytania. Odczyt plików z katalogu FSA
 * jest z natury asynchroniczny -- showLoadGameDialog() doładowuje wpisy z
 * dysku do listy chwilę PO wstępnym renderze, gdy ten Promise się rozwiąże
 * (MIGRACJA IDB: summarizeSaveSlots() jest dziś RÓWNIEŻ async, ale to osobny
 * powód -- IndexedDB, nie katalog FSA -- ten komentarz opisuje wyłącznie
 * powód asynchroniczności TEJ funkcji).
 * Zwraca [] gdy FSA niedostępne/niegotowe -- wtedy dialog wygląda dokładnie
 * jak przed tą zmianą.
 */
export async function summarizeFsaSaveSlots(): Promise<SaveSlotSummary[]> {
  const lastPlayed = await getLastPlayedSlotId();
  const files = await listFsaAutosaveFiles();
  const out: SaveSlotSummary[] = [];
  for (const { fileName } of files) {
    const g = await loadFsaAutosaveFile(fileName);
    if (!g) continue;
    const meta = g.meta as Record<string, unknown> | undefined;
    const slotId = FSA_SLOT_PREFIX + fileName;
    const baseLabel = typeof meta?.label === 'string' && meta.label.trim() ? meta.label.trim() : fileName;
    out.push({
      slotId,
      label: `${baseLabel} (dysk)`,
      tura: g.tura,
      savedAt: typeof meta?.savedAt === 'string' ? meta.savedAt : '',
      context: saveContextLine(g),
      isLastPlayed: slotId === lastPlayed,
    });
  }
  out.sort(compareSaveSlotsDesc);
  return out;
}

/** Łączy sejwy z przeglądarki i z dysku w jedną listę, najnowsze pierwsze. */
function mergeSaveSlotLists(local: SaveSlotSummary[], fsa: SaveSlotSummary[]): SaveSlotSummary[] {
  if (fsa.length === 0) return local;
  return [...local, ...fsa].sort(compareSaveSlotsDesc);
}

/** Najnowszy slot (data zapisu) — fallback gdy brak lastPlayed.
 * Uwaga: skanuje WYŁĄCZNIE zapisy lokalne (IndexedDB + legacy localStorage,
 * zgodnie z zachowaniem sprzed R-AUTOZAPIS-QUOTA-STORAGE-Q1) -- "Kontynuuj"
 * bez wskaźnika lastPlayed nie przeszukuje dysku FSA, tylko sejwy
 * przeglądarki. Świadome uproszczenie tej rundy, patrz raport.
 * MIGRACJA IDB: async (summarizeSaveSlots teraz Promise-based). */
export async function mostRecentSaveSlotId(): Promise<string | null> {
  const slots = await summarizeSaveSlots();
  return slots[0]?.slotId ?? null;
}

/** Slot do „Kontynuuj": ostatnio grany, inaczej najnowszy zapis.
 * MIGRACJA IDB: async (getLastPlayedSlotId/mostRecentSaveSlotId Promise-based). */
export async function continueSaveSlotId(): Promise<string | null> {
  return (await getLastPlayedSlotId()) ?? (await mostRecentSaveSlotId());
}

export interface SaveDialogOptions {
  defaultLabel: string;
  turn: number;
  /** MIGRACJA IDB: może zwrócić Promise -- caller (main.ts) czeka na nią przed zamknięciem dialogu. */
  onSave: (slotId: string, label: string) => void | Promise<void>;
  onCancel?: () => void;
}

/** MIGRACJA IDB: async -- summarizeSaveSlots() jest teraz Promise-based (IndexedDB). */
export async function showSaveGameDialog(opts: SaveDialogOptions): Promise<void> {
  closeDialog();
  ensureStyles();
  activeOnCancel = opts.onCancel;
  const existing = await summarizeSaveSlots();

  root = document.createElement('div');
  root.className = 'civ-sl';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Zapisz grę');

  const box = document.createElement('div');
  box.className = 'civ-sl-box';
  box.innerHTML =
    '<h2>Zapisz grę</h2>' +
    '<p class="civ-sl-sub">Podaj nazwę sejwu. Każda nowa nazwa tworzy <b>osobny</b> zapis — inne gry się nie nadpisują. ' +
    'Ta sama nazwa co istniejący sejw = nadpisanie wyłącznie tego slotu (potwierdzenie).</p>';

  const field = document.createElement('div');
  field.className = 'civ-sl-field';
  field.innerHTML = '<label for="civ-sl-name">Nazwa zapisu</label>';
  const input = document.createElement('input');
  input.id = 'civ-sl-name';
  input.type = 'text';
  input.maxLength = 72;
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

  const commit = async () => {
    const label = input.value.trim() || opts.defaultLabel;
    const existing = await existingAtCommit();
    let slotId: string;
    if (existing) {
      const ok = window.confirm(
        `Nadpisać istniejący zapis «${existing.label}»?\n${existing.context}\n\nInne sejwy pozostaną bez zmian.`,
      );
      if (!ok) return;
      slotId = existing.slotId;
    } else {
      slotId = uniqueSlotIdFromLabel(label);
    }
    // P-ZAPIS-CICHY-BLAD-QUOTA-MYLACY-KOMUNIKAT + MIGRACJA IDB: onSave()
    // zapisuje teraz do IndexedDB (persistSaveToSlot -> saveToLocal ->
    // idbSetItem, Promise-based) i sam pokazuje hint z wynikiem -- CZEKAMY na
    // nią przed zamknięciem dialogu, żeby ewentualny błędny hint nie
    // renderował się pod jeszcze otwartym dialogiem (kolejność zachowana,
    // tylko teraz przez await zamiast "ten sam tick JS" sprzed migracji).
    // / EN: onSave() now writes to IndexedDB (persistSaveToSlot -> saveToLocal
    // -> idbSetItem, Promise-based) and shows its own result hint -- we AWAIT
    // it before closing the dialog, so a failure hint never paints underneath
    // a still-open dialog (same ordering as before, now via await instead of
    // "same JS tick").
    await opts.onSave(slotId, label);
    closeDialog();
  };

  async function existingAtCommit(): Promise<SaveSlotSummary | undefined> {
    const label = input.value.trim();
    if (!label) return undefined;
    return (await summarizeSaveSlots()).find(s => s.label.trim() === label);
  }

  cancelBtn.addEventListener('click', () => {
    dismissSaveLoadViaEscape();
  });
  saveBtn.addEventListener('click', () => { void commit(); });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); void commit(); }
  });

  btns.append(cancelBtn, saveBtn);
  box.appendChild(btns);
  root.appendChild(box);
  document.body.appendChild(root);
  pushOverlay('save-load-dialog', dismissSaveLoadViaEscape);

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

/**
 * MIGRACJA IDB: async -- summarizeSaveSlots() jest teraz Promise-based
 * (IndexedDB), więc pierwszy render dialogu czeka na JEDEN odczyt IDB
 * (rzędu pojedynczych ms, w praktyce niezauważalne) zamiast rysować się w
 * pełni synchronicznie jak pod localStorage.
 */
export async function showLoadGameDialog(opts: LoadDialogOptions): Promise<void> {
  closeDialog();
  ensureStyles();
  activeOnCancel = opts.onCancel;

  let slots: SaveSlotSummary[] = [];
  // BLOKER B1 (Evaluator runda 1): sejwy z dysku FSA -- doładowane
  // asynchronicznie (patrz summarizeFsaSaveSlots) i scalone z listą PO
  // pierwszym renderze (poniżej), gdy ten drugi, wolniejszy Promise (odczyt
  // katalogu na dysku) się rozwiąże.
  let fsaSlotsCache: SaveSlotSummary[] = [];
  // MIGRACJA IDB: ustawiany w pierwszym renderList() (poniżej) -- jeden
  // odczyt IndexedDB zamiast dwóch (przed migracją: raz tu dla wartości
  // startowej, raz wewnątrz renderList()).
  let selectedId: string | null = null;

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

  const renderList = async (): Promise<void> => {
    list.innerHTML = '';
    slots = mergeSaveSlotLists(await summarizeSaveSlots(), fsaSlotsCache);
    if (slots.length === 0) {
      selectedId = null;
      list.innerHTML = '<div class="civ-sl-empty">Brak zapisów na tym urządzeniu.<br>Zapisz grę w menu pauzy (Ctrl+S = szybki zapis).</div>';
      return;
    }
    if (!selectedId || !slots.some(s => s.slotId === selectedId)) {
      selectedId = slots.find(s => s.isLastPlayed)?.slotId ?? slots[0]!.slotId;
    }
    for (const s of slots) {
      const isFsa = s.slotId.startsWith(FSA_SLOT_PREFIX);
      const row = document.createElement('div');
      row.className = 'civ-sl-row' + (s.slotId === selectedId ? ' sel' : '');
      row.dataset.slot = s.slotId;
      const main = document.createElement('div');
      main.className = 'civ-sl-row-main';
      const lastTag = s.isLastPlayed ? ' · <span style="color:#e0b24a">ostatnio grane</span>' : '';
      main.innerHTML =
        `<div class="civ-sl-row-title">${escapeHtml(s.label)}</div>` +
        `<div class="civ-sl-row-meta">Tura ${s.tura} · ${formatSavedAt(s.savedAt)}${lastTag}</div>` +
        `<div class="civ-sl-row-meta">${escapeHtml(s.context)}</div>`;
      if (isFsa) {
        // Sejwy z dysku (rotacja FSA) nie mają tu przycisku usuwania --
        // deleteLocal() zna wyłącznie zapisy lokalne (IndexedDB + legacy
        // localStorage), więc dla "fsa:" slotId byłby cichym no-opem
        // (przycisk "usuwa", plik zostaje). Realne usuwanie pliku z dysku
        // nie jest zrobione w tej rundzie (poza zakresem blokerów B1/B2),
        // świadomie odłożone.
        row.append(main);
      } else {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'civ-sl-del';
        del.title = 'Usuń zapis';
        del.textContent = '✕';
        del.addEventListener('click', (ev) => {
          ev.stopPropagation();
          void (async () => {
            await deleteLocal(s.slotId);
            if (selectedId === s.slotId) selectedId = null;
            await renderList();
          })();
        });
        row.append(main, del);
      }
      row.addEventListener('click', () => {
        selectedId = s.slotId;
        void renderList();
      });
      row.addEventListener('dblclick', () => {
        selectedId = s.slotId;
        closeDialog();
        opts.onLoad(s.slotId);
      });
      list.appendChild(row);
    }
  };

  await renderList();
  box.appendChild(list);

  void summarizeFsaSaveSlots().then(async (fsaSlots) => {
    if (root === null) return; // dialog zdążył się zamknąć zanim odczyt z dysku dokończył
    if (fsaSlots.length === 0) return;
    fsaSlotsCache = fsaSlots;
    await renderList();
  }).catch((err) => {
    console.warn('[SaveLoad] blad listowania zapisow z dysku (FSA):', err);
  });

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
    dismissSaveLoadViaEscape();
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
  pushOverlay('save-load-dialog', dismissSaveLoadViaEscape);

  root.addEventListener('click', (ev) => {
    if (ev.target === root) cancelBtn.click();
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
