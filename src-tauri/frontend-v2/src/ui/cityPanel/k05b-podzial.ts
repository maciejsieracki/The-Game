/**
 * K05B batch 1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 1): jednostki K05 z DOM, grupa "podział / ekonomia / złoto".
 * Każdy blok poprzedzony markerem `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` jest kopią linii A..B pinu (z komentarzami),
 * jedyna zmiana bajtowa: `export ` przy deklaracji najwyższego poziomu. Bramka: tools/dom-harness/verify-k05b-copies.mjs.
 * Wejścia warstwy logiki (cfg, readPodzialHandlu, isMeCity, rerender, adjustHandelSplit, ...) idą przez k05b-host.ts (K05B-Z1).
 */
import { el, appendDetailSection, gridDetailRow, appendDetailAlgo } from './k01b-dom';
import { appendDetailGrid, appendDetailFormula } from './k03-detail';
import { estimateHandelChips, plonyChipRowHtml } from './k01b-f';
import type { CityView } from './k01b-t';
import {
  statChipBrand,
  signed,
  HANDEL_ZAMOZNOSC_LABEL,
  HANDEL_KORUPCJA_PCT_PLACEHOLDER,
} from './k01a-fundament';
import type { EmpireHudSnap, PodzialHandluSplit } from './k01a-fundament';
import { resourceTextClass } from '../resourceColors';
import type { GameData } from './k05a-fundament';
import {
  type City,

  cfg,
  rerender,
  readPodzialHandlu,
  isMeCity,
  adjustHandelSplit,
  freshWealthState,
  daninaLabelForCity,
  daninaLabelGenitive,
  formatResourceUpkeepSummary,
  appendIndywidualneToggle,
  HANDEL_PCT_STEP,
  MAX_PROCENT_NAUKA,
} from './k05b-host';

// pin edb8fb56 gra/src/ui/cityPanel.ts:4638-4653
export function renderEkonomiaStrip(mount: HTMLElement, city: City, view: CityView | null, data: GameData | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', `<span>Plony i ${daninaLabelForCity(city).toLowerCase()}</span>`));
  if (!view) {
    mount.appendChild(el('div', 'muted', 'Brak danych gry'));
    return;
  }

  const foodCls = view.zywnoscNetto > 0 ? 'green' : view.zywnoscNetto < 0 ? 'red' : 'gold';
  const plony = el('div', 'chip-row');
  plony.innerHTML = plonyChipRowHtml(view);
  mount.appendChild(plony);

  appendPodzialHandlu(mount, city, view, data);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:4654-4734
export function appendPodzialHandlu(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  data: GameData | null,
  opts?: { skipSubhd?: boolean },
): void {
  if (!opts?.skipSubhd) {
    const sub = el('div', 'subhd');
    sub.textContent = `Podział ${daninaLabelGenitive(daninaLabelForCity(city))}`;
    mount.appendChild(sub);
  }

  const split = readPodzialHandlu(city, data);
  const player = isMeCity(city.ownerId);
  const editable = player && !!cfg.onPodzialHandluChange;
  const est = estimateHandelChips(view, split);

  const grid = el('div', 'handel-chip-grid');
  grid.innerHTML =
    statChipBrand('res-treasury', 'Skarb', `+${est.skarb} · ${split.procentPieniadz}%`, resourceTextClass('skarbiec'))
      .replace('<span class="chip">', '<span class="chip handel-card-skarb">') +
    statChipBrand('res-science', 'Nauka', `+${est.nauka} · ${split.procentNauka}%`, resourceTextClass('nauka'))
      .replace('<span class="chip">', '<span class="chip handel-card-nauka">') +
    statChipBrand('chip-happiness', HANDEL_ZAMOZNOSC_LABEL, `+${est.zam} · ${split.procentLuksus}%`, 'happy')
      .replace('<span class="chip">', '<span class="chip handel-card-zam">') +
    statChipBrand('chip-warning', 'Korupcja', `−${est.korupcja} · ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}%`, 'red')
      .replace('<span class="chip">', '<span class="chip handel-korupcja-chip" title="Korupcja — uproszczony model, pełniejszy planowany w przyszłej aktualizacji">');
  mount.appendChild(grid);

  const sliders = el('div', 'handel-w4-sliders');
  const makeSlider = (key: keyof PodzialHandluSplit, label: string, cls: string, rowCls = '', maxVal = 100) => {
    const row = el('div', `slider-row ${rowCls}`.trim());
    const lab = el('label');
    lab.innerHTML = `<span class="${cls}">${label}</span><span class="val ${cls}">${split[key]}%</span>`;
    row.appendChild(lab);
    const inp = document.createElement('input');
    inp.type = 'range';
    inp.min = '0';
    inp.max = String(maxVal);
    inp.step = String(HANDEL_PCT_STEP);
    inp.value = String(split[key]);
    inp.disabled = !editable;
    if (editable) {
      inp.addEventListener('input', () => {
        const updated = adjustHandelSplit(split, key, Number(inp.value));
        cfg.onPodzialHandluChange?.(city.id, { ...updated });
        rerender();
      });
    }
    row.appendChild(inp);
    sliders.appendChild(row);
  };
  makeSlider('procentPieniadz', 'Skarb', resourceTextClass('skarbiec'));
  makeSlider('procentNauka', 'Nauka', resourceTextClass('nauka'), 'slider-nauka', MAX_PROCENT_NAUKA);
  makeSlider('procentLuksus', HANDEL_ZAMOZNOSC_LABEL, 'happy');
  // R-USTAWIENIA-GLOBALNE-LOKALNE (Maciej 2026-08-10): "Skarbiec i Nauka to JEDNA
  // grupa" -- JEDEN przycisk Indywidualne dla całego suwaka (Skarb+Nauka+Zamożność
  // dzielą to samo pole podzialHandlu/podzialHandluOverride), nie osobny per pasek.
  if (editable && cfg.onPodzialHandluOverrideToggle) {
    appendIndywidualneToggle(
      sliders,
      cfg.getPodzialHandluOverride?.(city.id) === true,
      () => cfg.onPodzialHandluOverrideToggle?.(city.id),
      'indywidualne-row-handlu',
    );
  }
  mount.appendChild(sliders);

  const sum = split.procentPieniadz + split.procentNauka + split.procentLuksus;
  if (sum !== 100) {
    const sumRow = el('div', 'muted');
    sumRow.style.cssText = 'font-size:0.68em;margin-top:0.12em;';
    sumRow.textContent = `Suma ${sum}% (korygowane)`;
    mount.appendChild(sumRow);
  }

  appendCitySkarbiecBalance(mount, city);
}

/** Bilans pieniędzy tego miasta — przychody i koszty lokalne. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:4735-4768
export function appendCitySkarbiecBalance(mount: HTMLElement, city: City): void {
  const snap = cfg.getCityMoneySnap?.(city.id);
  if (!snap) return;

  const sub = el('div', 'subhd');
  sub.textContent = 'Bilans pieniędzy miasta';
  sub.style.marginTop = '0.65em';
  mount.appendChild(sub);

  const rows: Array<{ label: string; value: string; cls?: string }> = [
    { label: 'Pieniądz brutto (pola + budynki)', value: signed(snap.pieniadzBrutto) },
    { label: 'Mnożnik zamożności W', value: `×${snap.wealthMnoznik.toFixed(2)}` },
    { label: 'Handel ze szlaków', value: signed(snap.handelZeSzlakow) },
    { label: '→ Wpływ do skarbca imperium', value: signed(snap.doSkarbca), cls: snap.doSkarbca > 0 ? 'green' : snap.doSkarbca < 0 ? 'red' : 'muted' },
    { label: 'Utrzymanie budynków (to miasto)', value: snap.utrzymanieBudynkow > 0 ? `−${snap.utrzymanieBudynkow}` : '—', cls: snap.utrzymanieBudynkow > 0 ? 'red' : undefined },
    { label: 'Utrzymanie surowców budynków', value: formatResourceUpkeepSummary(snap.utrzymanieSurowcowBudynkow ?? {}), cls: Object.keys(snap.utrzymanieSurowcowBudynkow ?? {}).length > 0 ? 'red' : undefined },
    { label: 'Utrzymanie garnizonu (hex miasta)', value: snap.utrzymanieGarnizonu > 0 ? `−${snap.utrzymanieGarnizonu}` : '—', cls: snap.utrzymanieGarnizonu > 0 ? 'red' : undefined },
  ];

  const grid = el('div', 'city-money-grid');
  for (const r of rows) {
    const row = el('div', 'city-money-row');
    const lbl = el('span', 'city-money-lbl');
    lbl.textContent = r.label;
    const val = el('span', `city-money-val${r.cls ? ' ' + r.cls : ''}`);
    val.textContent = r.value;
    row.appendChild(lbl);
    row.appendChild(val);
    grid.appendChild(row);
  }
  mount.appendChild(grid);
}

/** @deprecated używane przez testy / kompat — prefer renderEkonomiaStrip */

// pin edb8fb56 gra/src/ui/cityPanel.ts:4769-4774
export function renderPodzialHandlu(mount: HTMLElement, city: City, view: CityView | null, data: GameData | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', '<span>Podział Handlu</span>'));
  appendPodzialHandlu(mount, city, view, data);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:5824-5903
export function buildTopBarZlotoDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  data: GameData | null,
): HTMLDivElement {
  const skarb = Math.round(empire.zloto ?? cfg.getTreasury?.(city.ownerId) ?? 0);
  const cityMoney = Math.round(view.pieniadz);
  const split = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, split);
  const ws = city.wealthState ?? freshWealthState();
  const daninaLbl = daninaLabelForCity(city);
  const daninaLblGen = daninaLabelGenitive(daninaLbl);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>💰 Pieniądz — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Skarbiec imperium to gotówka na wykupy, rekrutację za złoto i utrzymanie. Poniżej: bilans całego państwa oraz wpływ tego miasta.';
  card.appendChild(intro);

  const moneySnap = cfg.getCityMoneySnap?.(city.id);

  appendDetailSection(card, 'Skarbiec imperium (bilans / turę)');
  const gImp = appendDetailGrid(card);
  const wplywy = empire.bogactwoWplywyBrutto ?? 0;
  const handel = empire.bogactwoHandel ?? 0;
  const utrzB = empire.bogactwoUtrzymanieBudynkow ?? 0;
  const utrzRes = empire.bogactwoUtrzymanieSurowcowBudynkow ?? {};
  const utrzJ = empire.bogactwoUtrzymanieJednostek ?? 0;
  const netto = empire.bogactwoRate ?? empire.zlotoRate ?? 0;
  gridDetailRow(gImp, 'Stan skarbca', `${skarb}`);
  gridDetailRow(gImp, 'Wpływy brutto', signed(wplywy - handel));
  gridDetailRow(gImp, 'Handel ze szlaków', signed(handel));
  gridDetailRow(gImp, 'Utrzymanie budynków', utrzB > 0 ? `−${utrzB}` : '—');
  gridDetailRow(gImp, 'Utrzymanie surowców budynków', formatResourceUpkeepSummary(utrzRes));
  gridDetailRow(gImp, 'Utrzymanie jednostek', utrzJ > 0 ? `−${utrzJ}` : '—');
  gridDetailRow(gImp, 'Netto / turę', signed(netto));

  appendDetailSection(card, 'Ten gród — przychody i koszty lokalne');
  const gCity = appendDetailGrid(card);
  if (moneySnap) {
    gridDetailRow(gCity, 'Pieniądz brutto', signed(moneySnap.pieniadzBrutto));
    gridDetailRow(gCity, 'Mnożnik zamożności W', `×${moneySnap.wealthMnoznik.toFixed(2)}`);
    gridDetailRow(gCity, 'Handel ze szlaków', signed(moneySnap.handelZeSzlakow));
    gridDetailRow(gCity, '→ Do skarbca imperium', signed(moneySnap.doSkarbca));
    gridDetailRow(gCity, 'Utrzymanie budynków', moneySnap.utrzymanieBudynkow > 0 ? `−${moneySnap.utrzymanieBudynkow}` : '—');
    gridDetailRow(gCity, 'Utrzymanie surowców budynków', formatResourceUpkeepSummary(moneySnap.utrzymanieSurowcowBudynkow ?? {}));
    gridDetailRow(gCity, 'Utrzymanie garnizonu', moneySnap.utrzymanieGarnizonu > 0 ? `−${moneySnap.utrzymanieGarnizonu}` : '—');
    gridDetailRow(gCity, 'Nauka (osobny bank)', signed(moneySnap.nauka));
  } else {
    gridDetailRow(gCity, 'Wpływ do skarbca', signed(cityMoney));
  }

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 💰', `${skarb} — skarbiec całego państwa`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityMoney)} — netto z tego grodu do skarbca`);

  appendDetailSection(card, 'Skąd bierze się pieniądz (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Plony + budynki', 'Targowisko, Mennica, podatki z pól — patrz okolica.');
  gridDetailRow(g1, `Podział ${daninaLblGen}`, `${split.procentPieniadz}% Skarb · ${split.procentNauka}% Nauka · ${split.procentLuksus}% Zamożność`);
  if (est.netto) {
    gridDetailRow(g1, `${daninaLbl} netto (szac.)`, `~${est.netto} → split suwaków`);
    gridDetailRow(g1, '→ do Skarbu', est.skarb ? `~+${est.skarb}` : '—');
  }
  gridDetailRow(g1, 'Zamożność W', `W${ws.poziom} — część ${daninaLblGen} karmi pulę W (mnożnik podatków)`);

  appendDetailFormula(card, 'pieniadzNetto = podatki + handel_netto + budynki − utrzymanie');
  appendDetailFormula(card, 'Skarbiec += Σ pieniadzNetto_miast − wydatki');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    `Prawa kolumna → „Podział ${daninaLblGen}”: Skarb vs Nauka vs Zamożność.`,
    'Prawa kolumna → „Zamożność”: pasek puli W.',
    'Lewa kolumna → Wykup / Rekrutuj za złoto ze skarbca.',
  ]);
  return card;
}
