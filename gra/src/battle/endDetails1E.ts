/**
 * endDetails1E.ts — pełnoekranowe „Szczegóły bitwy” (Design 1E / C-12 rodzina).
 */
import {
  applyBtnOutline,
  applyBtnPrimary,
  BATTLE_ENEMY_TEXT,
  BATTLE_FONT,
  BATTLE_FONT_TITLE,
  BATTLE_GOLD,
  BATTLE_PLAYER_TEXT,
  BATTLE_TEXT,
  BATTLE_TEXT_DIM,
} from './battleHudTheme';

export interface EndDetailsUnitRow {
  name: string;
  n: number;
}

/** Pojedyncza jednostka w rosterze szczegółów (HP przed/po). */
export interface EndDetailsUnitHpRow {
  name: string;
  fate: 'destroyed' | 'routed' | 'survived';
  hpBeforePct: number;
  hpAfterPct: number;
  lossPct: number;
  dead: boolean;
}

export interface EndDetailsSideFates {
  destroyed: EndDetailsUnitRow[];
  routed: EndDetailsUnitRow[];
  survived: EndDetailsUnitRow[];
  /** Pełna lista jednostek z utratą HP (opcjonalnie — gdy brak, tylko agregaty). */
  units?: EndDetailsUnitHpRow[];
}

export interface EndDetails1EParams {
  atk: EndDetailsSideFates;
  def: EndDetailsSideFates;
  atkLabel?: string;
  defLabel?: string;
  battleTitle?: string;
}

export interface EndDetails1ECallbacks {
  onClose: () => void;
  onReplay?: () => void;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function total(items: EndDetailsUnitRow[]): number {
  return items.reduce((s, it) => s + it.n, 0);
}

function fateBlock(
  title: string,
  accent: string,
  items: EndDetailsUnitRow[],
): string {
  const cnt = total(items);
  const rows = items.length
    ? items.map(it =>
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;' +
      'padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);">' +
      '<span style="font-size:13px;color:' + BATTLE_TEXT + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
      esc(it.name) + '</span>' +
      '<span style="font-family:' + BATTLE_FONT_TITLE + ';font-size:16px;color:' + accent + ';flex:none;">×' + it.n + '</span>' +
      '</div>',
    ).join('')
    : '<div style="font-size:12px;color:' + BATTLE_TEXT_DIM + ';padding:10px 0;font-style:italic;text-align:center;">Brak</div>';

  return (
    '<div style="margin-bottom:16px;">' +
    '<div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:' + accent + ';margin-bottom:6px;">' +
    title + '</div>' +
    '<div style="font-family:' + BATTLE_FONT_TITLE + ';font-size:34px;line-height:1;color:' + accent + ';margin-bottom:8px;">' +
    cnt + '</div>' +
    '<div style="background:rgba(0,0,0,0.28);border-radius:10px;padding:4px 12px;border:1px solid rgba(255,255,255,0.06);">' +
    rows +
    '</div></div>'
  );
}

function unitHpRowHtml(
  row: EndDetailsUnitHpRow,
  barGrad: string,
): string {
  const fateLabel =
    row.fate === 'destroyed' ? 'zniszczona'
      : row.fate === 'routed' ? 'zrootowana'
        : 'ocalała';
  const fateColor =
    row.fate === 'destroyed' ? '#ff7b7b'
      : row.fate === 'routed' ? '#ffd54a'
        : '#7ad0a0';
  const hpTxt = row.dead
    ? 'HP ' + row.hpBeforePct + '% \u2192 0%'
    : 'HP ' + row.hpBeforePct + '% \u2192 ' + row.hpAfterPct + '%';
  const lossTxt = row.dead ? '\u2212100%' : '\u2212' + row.lossPct + '%';
  const lossColor =
    row.dead || row.lossPct >= 50 ? '#ff7070'
      : row.lossPct === 0 ? '#7ad0a0'
        : BATTLE_TEXT_DIM;
  const afterW = row.dead ? 0 : row.hpAfterPct;

  return (
    '<div style="margin-bottom:10px;padding:10px 11px;border-radius:8px;' +
    'border:1px solid ' + (row.dead ? 'rgba(200,64,64,.45)' : 'rgba(255,255,255,.1)') + ';' +
    'background:rgba(0,0,0,0.22);">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">' +
    '<span style="font-size:13px;color:' + BATTLE_TEXT + ';line-height:1.25;">' + esc(row.name) + '</span>' +
    '<span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:' + fateColor + ';flex:none;">' +
    fateLabel + '</span></div>' +
    '<div style="height:6px;border-radius:4px;overflow:hidden;position:relative;background:rgba(255,255,255,.08);margin-bottom:5px;">' +
    '<div style="position:absolute;inset:0;width:' + row.hpBeforePct + '%;background:rgba(255,255,255,.12);border-radius:4px;"></div>' +
    '<div style="position:absolute;left:0;top:0;bottom:0;width:' + afterW + '%;background:' + barGrad + ';border-radius:4px;"></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:10px;color:' + BATTLE_TEXT_DIM + ';">' +
    '<span>' + hpTxt + '</span>' +
    '<span style="font-weight:700;color:' + lossColor + ';">' + lossTxt + '</span>' +
    '</div></div>'
  );
}

function unitRosterBlock(
  units: EndDetailsUnitHpRow[] | undefined,
  accent: string,
  barGrad: string,
): string {
  if (!units?.length) return '';
  const rows = units.map(u => unitHpRowHtml(u, barGrad)).join('');
  return (
    '<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">' +
    '<div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:' + accent + ';margin-bottom:10px;">' +
    'Stan jednostek \u00B7 ' + units.length + '</div>' +
    '<div style="max-height:min(42vh,360px);overflow-y:auto;padding-right:4px;">' +
    rows +
    '</div></div>'
  );
}

function sideColumn(
  label: string,
  accent: string,
  border: string,
  bg: string,
  barGrad: string,
  f: EndDetailsSideFates,
): string {
  return (
    '<div style="flex:1;min-width:min(360px,44vw);max-width:460px;' +
    'border:2px solid ' + border + ';border-radius:12px;background:' + bg + ';padding:22px 20px;">' +
    '<div style="font-family:' + BATTLE_FONT_TITLE + ';font-size:22px;letter-spacing:0.14em;' +
    'text-transform:uppercase;color:' + accent + ';text-align:center;margin-bottom:18px;' +
    'padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.08);">' +
    esc(label) + '</div>' +
    fateBlock('Zniszczone', '#ff7b7b', f.destroyed) +
    fateBlock('Zrootowane', '#ffd54a', f.routed) +
    fateBlock('Ocalałe', '#7ad0a0', f.survived) +
    unitRosterBlock(f.units, accent, barGrad) +
    '</div>'
  );
}

/** Ponad ekranem końca walki (endScreen1E = 100500). */
const END_DETAILS_Z = '100530';

/** Pełny breakdown bitwy — overlay C-12, otwierany z ekranu końca walki. */
export function showEndDetails1E(
  _overlay: HTMLElement,
  p: EndDetails1EParams,
  cb: EndDetails1ECallbacks,
): HTMLDivElement {
  const back = document.createElement('div');
  back.id = 'battle-end-details';
  back.dataset.battleEndDetails = 'backdrop';
  Object.assign(back.style, {
    position: 'fixed',
    inset: '0',
    zIndex: END_DETAILS_Z,
    background: 'radial-gradient(1100px 800px at 50% 30%, rgba(232,216,138,0.08), transparent 60%), rgba(4,8,18,0.88)',
    boxShadow: 'inset 0 0 300px 90px rgba(0,0,0,0.75)',
    fontFamily: BATTLE_FONT,
    color: BATTLE_TEXT,
    overflowY: 'auto',
    textAlign: 'center',
  });

  const titleLine = p.battleTitle ?? 'Pełny stan oddziałów po zakończeniu starcia';

  const head = document.createElement('div');
  head.style.cssText = 'position:relative;padding:72px 24px 0;';
  head.innerHTML =
    '<div style="font-size:14px;letter-spacing:0.5em;text-transform:uppercase;color:#a08030;margin-bottom:10px;">' +
    esc(titleLine) + '</div>' +
    '<h2 style="font-family:' + BATTLE_FONT_TITLE + ';font-weight:400;font-size:56px;letter-spacing:0.12em;' +
    'margin:0;color:' + BATTLE_GOLD + ';text-shadow:0 2px 20px rgba(0,0,0,0.7),0 0 40px rgba(232,216,138,0.15);">' +
    'Szczeg\u00F3\u0142y bitwy</h2>' +
    '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:18px;">' +
    '<span style="height:1px;width:min(150px,18vw);background:linear-gradient(90deg,transparent,#a08030);"></span>' +
    '<span style="color:#a08030;">◆</span>' +
    '<span style="height:1px;width:min(150px,18vw);background:linear-gradient(90deg,#a08030,transparent);"></span>' +
    '</div>';
  back.appendChild(head);

  const cols = document.createElement('div');
  cols.innerHTML =
    sideColumn(
      p.atkLabel ?? 'Atakuj\u0105cy',
      BATTLE_PLAYER_TEXT,
      'rgba(90,155,212,0.4)',
      'linear-gradient(180deg,rgba(18,26,40,0.96),rgba(8,12,20,0.96))',
      'linear-gradient(90deg,#3a6ad0,#5a9bd4)',
      p.atk,
    ) +
    sideColumn(
      p.defLabel ?? 'Obro\u0144ca',
      BATTLE_ENEMY_TEXT,
      'rgba(200,64,64,0.4)',
      'linear-gradient(180deg,rgba(26,14,14,0.96),rgba(14,8,8,0.96))',
      'linear-gradient(90deg,#c05050,#8a3a3a)',
      p.def,
    );
  Object.assign(cols.style, {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '18px',
    alignItems: 'stretch',
    padding: '36px 24px 120px',
    maxWidth: '980px',
    margin: '0 auto',
    boxSizing: 'border-box',
  });
  back.appendChild(cols);

  const btnRow = document.createElement('div');
  Object.assign(btnRow.style, {
    position: 'sticky',
    bottom: '0',
    left: '0',
    right: '0',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '14px',
    padding: '20px 24px 32px',
    background: 'linear-gradient(180deg, transparent, rgba(4,8,18,0.95) 35%)',
  });

  const btnClose = document.createElement('button');
  btnClose.type = 'button';
  btnClose.textContent = '\u2190 Wr\u00F3\u0107 do podsumowania';
  applyBtnOutline(btnClose);
  Object.assign(btnClose.style, { padding: '14px 28px', fontSize: '12px', minWidth: '220px' });
  btnClose.onclick = () => cb.onClose();
  btnRow.appendChild(btnClose);

  if (cb.onReplay) {
    const btnReplay = document.createElement('button');
    btnReplay.type = 'button';
    btnReplay.textContent = 'Rozegraj ponownie';
    applyBtnPrimary(btnReplay);
    btnReplay.onclick = () => cb.onReplay!();
    btnRow.appendChild(btnReplay);
  }

  back.appendChild(btnRow);
  document.body.appendChild(back);
  return back;
}
