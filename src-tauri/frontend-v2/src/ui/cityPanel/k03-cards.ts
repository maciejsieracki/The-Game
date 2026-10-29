/**
 * K03 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K03-Q1, runda 3): karty szczegolow i bloki miasta (pin edb8fb56
 * `gra/src/ui/cityPanel.ts`) przeniesione 1:1 DOM/tekst. Wszystkie wartosci regul przychodza jako argumenty
 * (z `CityPanelDto.panelInputs` przez adaptery `k03-model.ts`) — modul NIE liczy regul gry (P5.13).
 * Numer linii pinu przy kazdej funkcji. Porownanie z pinem: tools/dom-harness/run-k03-units.mjs.
 */
import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailGrid, appendDetailFormula } from './k03-detail';
import { cpInlineIcons, cityPanelChipIconWrap, tury, fmtDecPl, resourceBrandIconHtml, HANDEL_ZAMOZNOSC_LABEL, HANDEL_KORUPCJA_PCT_PLACEHOLDER, type PodzialHandluSplit } from './k01a-fundament';
import { estimateHandelChips } from './k01b-f';
import { reorderRecruitQueueItem, type CityView } from './k01b-t';
import { getProd, setProd } from './k03-model';

/** Pin :10845 — wejscia karty handlu (wszystkie bramki/liczby z silnika, K03-Z10). */
export interface HandelDetailInputK {
  daninaLbl: string;
  daninaLblGen: string;
  daninaLblAcc: string;
  split: PodzialHandluSplit;
  korupcja: { wspolczynnikDystansu: number; wspolczynnikMiast: number; cap: number } | null;
  maTargowisko: boolean;
  maBiblioteka: boolean;
  maMennicaBudynek: boolean;
  mennicaAktywna: boolean;
  mennicaSpiZBrakuZlota: boolean;
  mennicaMnoznikTxt: string;
  aktywneTrasyCount: number;
  premiaTrasHandlowych: number;
}

/** Pin :7320 `techPrereqChain` — lancuch wymagan (poprzednicy przed technologia, bez duplikatow). `getTechDef`/`parsePrerequisites` pina -> `prereqs` (K03-Z10). */
export function techPrereqChainK(techName: string, prereqs: Readonly<Record<string, readonly string[]>>): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  function visit(name: string): void {
    const trimmed = name.trim();
    if (!trimmed || trimmed === '—' || trimmed === '-' || seen.has(trimmed)) return;
    seen.add(trimmed);
    for (const p of prereqs[trimmed] ?? []) visit(p);
    chain.push(trimmed);
  }
  visit(techName);
  return chain;
}

/** Pin `game/manpower.ts:837` `formatPopulationAbs` (przez `formatManpower` :849) — klasa F, kopia 1:1. */
export function formatManpowerK(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return (m >= 10 ? Math.round(m) : Math.round(m * 10) / 10) + ' mln';
  }
  if (n >= 1_000) {
    const t = n / 1_000;
    return (t >= 100 ? Math.round(t) : Math.round(t * 10) / 10) + ' tys.';
  }
  return String(n);
}

/** Pin :1598-1635 `buildGrowthProgressTooltipCard`. `osob`/`gainSlots` z silnika (K03-Z10 `growthTooltip`). */
export function buildGrowthProgressTooltipCardK(
  view: Pick<CityView, 'wzrostUlamkowy'>,
  input: { osobNaObywatela: number; gainSlots: number; fed: boolean },
): HTMLDivElement {
  const frac = view.wzrostUlamkowy;
  const osobNaObywatela = input.osobNaObywatela;
  const gainSlots = input.gainSlots;
  const fed = input.fed;
  const fracPeople = Math.round(frac * osobNaObywatela);
  const gainPeople = Math.round(gainSlots * osobNaObywatela);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Wzrost ludności — szczegóły</span>'));
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Postęp (sloty)', `${fmtDecPl(frac)} / 1 obywatela`);
  gridDetailRow(
    g,
    'Skala absolutna',
    `≈ ${formatManpowerK(fracPeople)} / ${formatManpowerK(osobNaObywatela)} os.`,
  );
  if (gainSlots > 0) {
    gridDetailRow(
      g,
      'Tempo',
      `+${fmtDecPl(gainSlots)} obywatela/t (≈ +${formatManpowerK(gainPeople)}/t)`,
    );
  }
  const note = el('div', 'dc-note');
  note.textContent = fed
    ? 'Ułamek poniżej 1 zostaje w buforze (wzrostUlamkowy) i sumuje się co turę — tylko gdy miasto jest nakarmione.'
    : 'Brak wzrostu przy głodzie — bufor nie rośnie, dopóki bilans nie zostanie pokryty z magazynu centralnego.';
  card.appendChild(note);
  return card;
}

/** Pin :3582-3616 `buildZdrowieDetailCard`. */
export function buildZdrowieDetailCardK(
  total: number,
  lines: readonly { label: string; value: number }[],
  posSum: number,
  negSum: number,
): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Zdrowie — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Suma bonusów i kar zdrowotnych — budynki, okolica, choroby. Wpływa na wzrost populacji i szczęście.';
  card.appendChild(intro);
  appendDetailSection(card, 'Podsumowanie');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Plusy', `${posSum >= 0 ? '+' + posSum : posSum}`);
  gridDetailRow(g, 'Minusy', String(negSum));
  gridDetailRow(g, 'Razem', `${total >= 0 ? '+' + total : total}`);
  if (lines.length > 0) {
    appendDetailSection(card, 'Składniki');
    const g2 = appendDetailGrid(card);
    for (const l of lines) {
      gridDetailRow(g2, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  } else {
    appendDetailSection(card, 'Składniki');
    card.appendChild(el('div', 'dc-note', 'Brak modyfikatorów zdrowotnych w tym mieście.'));
  }
  appendDetailAlgo(card, 'Wpływ na rozgrywkę', [
    'Zdrowie dodaje do WZROST%: floor(Zdrowie ÷ 10) × 1 p.p.',
    'Wyższe zdrowie = szybszy wzrost ludności; ujemne = wolniejszy.',
    'Część składników pochodzi z budynków, terenu okolicy i stanu wojny/chorób.',
  ]);
  return card;
}

/** Pin :3718-3754 `buildSurowceDetailCard`. */
export function buildSurowceDetailCardK(potential: readonly string[], active: readonly string[], legacy: boolean): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Surowce — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent = legacy
    ? 'Surowce w zasięgu TEGO miasta — podgląd mapy lokalnej (nie warunek budowy w innym mieście). Koszt surowcowy budynku = magazyn całej cywilizacji.'
    : 'Potencjał (szare) = złoże widoczne w zasięgu tego miasta — jeszcze nieużywalne. Surowce magazynowe (Drewno, Glina, Ruda…) wymagają zapasu w magazynie państwa — koszt budowy (`koszt_surowce`) też stamtąd.';
  card.appendChild(intro);
  if (active.length > 0) {
    appendDetailSection(card, legacy ? 'Lista' : 'Dostęp aktywny');
    const g = appendDetailGrid(card);
    for (const n of active) {
      gridDetailRow(g, resourceBrandIconHtml(n), n);
    }
  }
  if (!legacy && potential.length > 0) {
    appendDetailSection(card, 'Potencjał (złoże)');
    const g2 = appendDetailGrid(card);
    for (const n of potential) gridDetailRow(g2, resourceBrandIconHtml(n), n);
  }
  appendDetailAlgo(card, 'Mechanika', legacy
    ? [
      'Lista pokazuje surowce widoczne z tego miasta — informacja mapowa.',
      'Budowa wymagająca surowców liczonych: wystarczy zapas w magazynie państwa (dowolne miasto).',
    ]
    : [
      'Złoże w zasięgu tego miasta — podgląd mapy; nie warunek budowy w innym mieście.',
      'Koszt surowcowy budynku (`koszt_surowce`): tylko magazyn państwa (suma po wszystkich miastach).',
      'Wyjątki lokalne: Port (wybrzeże/rzeka przy tym mieście), prerekwizyty budynków w tym mieście.',
    ]);
  return card;
}

/** Pin :3814-3834 `appendCompositionBlock`. */
export function appendCompositionBlockK(
  parent: HTMLElement,
  title: string,
  lines: readonly { label: string; pct: number; note?: string }[],
  footnote?: string,
): void {
  if (!lines.length) return;
  appendDetailSection(parent, title);
  const g = appendDetailGrid(parent);
  for (const row of lines) {
    const val = row.note ? `${row.pct}% · ${row.note}` : `${row.pct}%`;
    gridDetailRow(g, row.label, val);
  }
  if (footnote) {
    const note = el('div', 'dc-note');
    note.style.fontStyle = 'normal';
    note.textContent = footnote;
    parent.appendChild(note);
  }
}

/** Opcje zamoznosci (pin :4247 / :4307). */
export interface WealthCompactOptsK {
  poziom: number;
  atCap: boolean;
  cap: number;
  epoch: number;
  mnoz: number;
  szBonus: number;
  pula: number;
  prog: number;
  etaW: number | null;
  zamIn: number;
  daninaLblGen: string;
}

/** Pin :4307-4350 `buildWealthCompactTooltipCard`. */
export function buildWealthCompactTooltipCardK(opts: WealthCompactOptsK): HTMLDivElement {
  const nextW = opts.poziom + 1;
  const mnozTxt = opts.mnoz.toFixed(2).replace('.', ',');

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Zamożność — szczegóły</span>'));
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Poziom W', opts.atCap
    ? `W${opts.poziom} — maksimum w epoce ${opts.epoch} (limit W${opts.cap})`
    : `W${opts.poziom} (limit W${opts.cap} w epoce ${opts.epoch})`);
  gridDetailRow(g, 'Pula', opts.atCap
    ? 'Pełna — brak kolejnego poziomu w tej epoce'
    : `${Math.round(opts.pula)} / ${Math.round(opts.prog)} 💰 do W${nextW}`);
  gridDetailRow(g, 'Mnożnik skarbca', `×${mnozTxt}${opts.poziom <= 1 ? ' (W1 = bez bonusu)' : ''}`);
  gridDetailRow(g, 'Szczęście', `${opts.szBonus >= 0 ? '+' : ''}${Math.round(opts.szBonus)} (co 10 poziomów W +1)`);

  const note = el('div', 'dc-note');
  if (opts.atCap) {
    note.textContent = `Osiągnięto najwyższą zamożność W${opts.poziom} w epoce ${opts.epoch}.`;
  } else if (opts.zamIn <= 0) {
    note.textContent =
      `Brak wpływu do puli — przesuń suwak „Zamożność” w podziale ${opts.daninaLblGen}, żeby rosnąć do W${nextW}.`;
  } else if (opts.etaW != null) {
    note.textContent =
      `Postęp do W${nextW}: ≈ +${opts.zamIn} 💰/turę trafia do puli z udziału „Zamożność” w ${opts.daninaLblGen}. ` +
      'Nadwyżka puli zostaje po awansie.';
  } else {
    note.textContent = `Cel: W${nextW} — potrzeba ${Math.round(opts.prog)} 💰 w puli.`;
  }
  card.appendChild(note);
  return card;
}

/**
 * Pin :4247-4304 `appendWealthCompactStrip`. `attachHover` = wstrzyknięte `attachHoverDetail` (pin :hoverDetailDock),
 * zeby harness mogl porownac wywolanie bez zaleznosci od docka.
 */
export function appendWealthCompactStripK(
  mount: HTMLElement,
  opts: WealthCompactOptsK & { pct: number; etaW: number | null },
  attachHover: (wrap: HTMLElement, build: () => HTMLElement, delay: number, side: 'left' | 'right') => void,
): void {
  const wrap = el('div', 'wealth-compact-wrap');
  const badges = el('div', 'wealth-compact-badges');
  const mkStat = (html: string, cls: string) => {
    const s = el('span', `wealth-compact-stat ${cls}`.trim());
    s.innerHTML = html;
    return s;
  };
  const nextW = opts.poziom + 1;
  const mnozTxt = opts.mnoz.toFixed(2).replace('.', ',');

  badges.appendChild(mkStat(`<b>W${opts.poziom}</b>`, 'wealth-w'));
  badges.appendChild(mkStat(
    `${cityPanelChipIconWrap('res-treasury', 14)}<b>×${mnozTxt}</b>`,
    'wealth-mnoz',
  ));
  const szStat = mkStat(cityPanelChipIconWrap('chip-happiness', 14), 'wealth-happy');
  szStat.setAttribute('aria-label', `Szczęście z zamożności ${opts.szBonus >= 0 ? '+' : ''}${Math.round(opts.szBonus)}`);
  badges.appendChild(szStat);
  wrap.appendChild(badges);

  const track = el('div', 'food-grow-track wealth-compact-bar');
  const barLabel = opts.atCap ? `W${opts.poziom} — MAX` : `${Math.round(opts.pula)} / ${Math.round(opts.prog)}`;
  track.innerHTML =
    `<div class="food-grow-fill" style="width:${opts.pct}%"></div>` +
    `<span class="fbtxt">${barLabel}</span>`;
  wrap.appendChild(track);

  if (!opts.atCap && opts.etaW != null) {
    const eta = el('div', 'wealth-compact-eta ok');
    eta.textContent = `Kolejny W${nextW} za ok. ${opts.etaW} ${tury(opts.etaW)}.`;
    wrap.appendChild(eta);
  }

  mount.appendChild(wrap);
  attachHover(wrap, () => buildWealthCompactTooltipCardK(opts), 220, 'left');
}

/** Pin :5652-5682 `buildTopBarRekruciDetailCard` (parametr `city` pina nieuzywany — usuniety, K03 API). */
export function buildTopBarRekruciDetailCardK(mp: {
  manpowerBiezacy: number; manpowerMax: number; regenPerTurn: number; kosztJednostki: number;
  werbMaxPrzyPelnejPuli: number; ludnoscAbsolutna: number; ludki: number; epoka: number;
}): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>⚔ Rekruci (pobór wojskowy)</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Pula rekrutów tego miasta (składnik sumy imperium). Werb jednostki zużywa rekrutów ' +
    'z puli całej cywilizacji — ludność miasta nie spada. ' +
    'Zwiadowca — 0 kosztu Manpower. Co turę pula rośnie (regen), chyba że miasto jest oblężone.';
  card.appendChild(intro);

  appendDetailSection(card, 'Stan puli');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Bieżąca pula', formatManpowerK(mp.manpowerBiezacy));
  gridDetailRow(g, 'Maksimum', formatManpowerK(mp.manpowerMax));
  gridDetailRow(g, 'Odnowa', `+${formatManpowerK(mp.regenPerTurn)}`);
  gridDetailRow(g, 'Koszt 1 jednostki', formatManpowerK(mp.kosztJednostki));
  gridDetailRow(g, 'Werb przy pełnej puli', String(mp.werbMaxPrzyPelnejPuli));
  gridDetailRow(g, 'Ludność abs.', formatManpowerK(mp.ludnoscAbsolutna));
  gridDetailRow(g, 'Obywatele', `${mp.ludki} · epoka ${mp.epoka}`);

  appendDetailAlgo(card, 'Skąd bierze się pula', [
    'Max ≈ 10% ludności absolutnej miasta (tabela epok).',
    'Regen = % max (parametr balansu, patrz "Odnowa" wyżej) × bonus cywilizacji (np. Rzym ×2).',
    'Oblężenie blokuje odnowę do czasu zdjęcia oblężenia.',
  ]);
  return card;
}

/** Pin :732-792 `bindRecruitQueueDragReorder`. Kolejka przez `getProd`/`setProd` (lokalny cache K03-Z7). */
export function bindRecruitQueueDragReorderK(sc: HTMLElement, cityId: string, rerender: () => void): void {
  let dragFromIndex: number | null = null;

  const clearDropMarks = (): void => {
    sc.querySelectorAll('.qitem.is-drop-target').forEach(node => node.classList.remove('is-drop-target'));
    sc.querySelectorAll('.qitem.is-dragging').forEach(node => node.classList.remove('is-dragging'));
  };

  sc.querySelectorAll<HTMLElement>('.qitem[data-recruit-idx]').forEach(row => {
    row.setAttribute('draggable', 'true');

    row.addEventListener('dragstart', (e) => {
      if ((e.target as HTMLElement).closest('button')) {
        e.preventDefault();
        return;
      }
      const idx = Number(row.dataset.recruitIdx);
      if (!Number.isFinite(idx)) return;
      dragFromIndex = idx;
      row.classList.add('is-dragging');
      e.dataTransfer?.setData('text/plain', String(idx));
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.dropEffect = 'move';
      }
    });

    row.addEventListener('dragend', () => {
      dragFromIndex = null;
      clearDropMarks();
    });
  });

  sc.addEventListener('dragover', (e) => {
    if (dragFromIndex === null) return;
    e.preventDefault();
    const row = (e.target as HTMLElement).closest<HTMLElement>('.qitem[data-recruit-idx]');
    clearDropMarks();
    if (row) row.classList.add('is-drop-target');
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  });

  sc.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dragFromIndex === null) return;
    const row = (e.target as HTMLElement).closest<HTMLElement>('.qitem[data-recruit-idx]');
    if (!row) {
      clearDropMarks();
      return;
    }
    const toIndex = Number(row.dataset.recruitIdx);
    if (!Number.isFinite(toIndex) || toIndex === dragFromIndex) {
      clearDropMarks();
      return;
    }
    setProd(cityId, reorderRecruitQueueItem(getProd(cityId), dragFromIndex, toIndex));
    dragFromIndex = null;
    clearDropMarks();
    rerender();
  });
}

/** Pin :10845-11005 `buildHandelDetailCard` — wszystkie bramki i liczby z `HandelDetailInputK` (silnik). */
export function buildHandelDetailCardK(view: CityView | null, input: HandelDetailInputK): HTMLDivElement {
  const { daninaLbl, daninaLblGen, daninaLblAcc, split } = input;
  const { maTargowisko, maBiblioteka, maMennicaBudynek, mennicaAktywna, mennicaSpiZBrakuZlota, mennicaMnoznikTxt, aktywneTrasyCount, premiaTrasHandlowych } = input;
  const params = input.korupcja;
  const est = estimateHandelChips(view, split);

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = `<span>Podział ${daninaLblGen} — szczegóły</span>`;
  card.appendChild(head);

  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    `${daninaLbl} z pól okolicy to osobny strumień 💰. Najpierw odejmujemy stratę (korupcję), potem suwaki dzielą resztę między skarbiec, naukę i ${HANDEL_ZAMOZNOSC_LABEL.toLowerCase()}. Suma suwaków = 100%, kroki 10%.`,
  );
  card.appendChild(intro);

  const todo = el('div', 'dc-note');
  todo.style.cssText = 'font-style:normal;border-left:2px solid var(--gold);padding-left:0.45em;margin-top:0.35em;';
  todo.innerHTML =
    `<b class="gold">Korupcja:</b> dziś to stały procent <b>${HANDEL_KORUPCJA_PCT_PLACEHOLDER}%</b> ${daninaLblGen} brutto. ` +
    'W przyszłej aktualizacji ma zależeć też od odległości miasta od stolicy i liczby miast w imperium.';
  card.appendChild(todo);

  if (mennicaSpiZBrakuZlota) {
    const mennicaWarn = el('div', 'dc-note');
    mennicaWarn.style.cssText = 'font-style:normal;border-left:2px solid #e08a8a;padding-left:0.45em;margin-top:0.35em;color:#f0c8c8;';
    mennicaWarn.textContent =
      'Mennica nieaktywna: brak Złota w magazynie państwa (Kopalnia złota, szlak handlowy lub zapas). ' +
      'Uzupełnij magazyn Złotem, żeby mnożnik znów zadziałał — budynek nie jest burzony, tylko czeka.';
    card.appendChild(mennicaWarn);
  }

  appendDetailSection(card, 'Korupcja');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, `${daninaLbl} brutto (szac.)`, est.brutto ? `~${est.brutto}` : '—');
  gridDetailRow(g0, 'Strata korupcji', `−${est.korupcja} (${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto)`);
  gridDetailRow(g0, `${daninaLbl} netto`, est.netto ? `~${est.netto} → split suwaków` : '—');
  if (params) {
    gridDetailRow(g0, 'Planowane zmiany', `dystans×${params.wspolczynnikDystansu} + miasta×${params.wspolczynnikMiast}, cap ${Math.round(params.cap * 100)}%`);
  }
  gridDetailRow(
    g0,
    'Premia za trasy handlowe',
    aktywneTrasyCount > 0
      ? `+${Math.round(premiaTrasHandlowych)} Handlu (${aktywneTrasyCount} z budynkiem) — już w brutto powyżej`
      : 'brak tras z budynkiem handlowym',
  );

  appendDetailSection(card, 'Aktualny podział');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Skarb', `${split.procentPieniadz}%${est.skarb ? ` · ~+${est.skarb} z ${daninaLblGen}` : ''}`);
  gridDetailRow(g1, 'Nauka', `${split.procentNauka}%${est.nauka ? ` · ~+${est.nauka} z ${daninaLblGen}` : ''}`);
  gridDetailRow(g1, HANDEL_ZAMOZNOSC_LABEL, `${split.procentLuksus}%${est.zam ? ` · ~+${est.zam} → pula` : ' → pula'}`);
  if (view) {
    gridDetailRow(g1, 'Uwaga', `* Pieniądz i Nauka zawierają też budynki (chipy = tylko udział z ${daninaLblGen} netto)`);
  }

  appendDetailFormula(card, `handelBrutto = Σ ${daninaLblGen} pól`
    + (maTargowisko ? ' × (1 + bonus Targowiska)' : '')
    + (aktywneTrasyCount > 0 ? ' + premia tras handlowych (z budynkiem)' : ''));
  appendDetailFormula(card, `strataKorupcji = handelBrutto × ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% (dziś: stały %)`);
  appendDetailFormula(card, 'handelNetto = handelBrutto − strataKorupcji' + (
    mennicaAktywna
      ? ` × Waluta+Mennica (${mennicaMnoznikTxt})`
      : mennicaSpiZBrakuZlota
        ? ' × ×1 (Mennica śpi — brak Złota w magazynie)'
        : ' × ×1 (brak Waluty lub Mennicy)'
  ));
  appendDetailFormula(card, 'nauka = floor(handelNetto × %Nauka) + budynki  ← już zawiera mnożnik Waluty+Mennicy powyżej');
  appendDetailFormula(card, 'skarb_z_handlu = floor(handelNetto × %Skarb)  ← już zawiera mnożnik Waluty+Mennicy powyżej');
  appendDetailFormula(card, `${HANDEL_ZAMOZNOSC_LABEL} = floor(handelNetto × %${HANDEL_ZAMOZNOSC_LABEL}) → pula zamożności  ← też już zawiera mnożnik`);

  appendDetailAlgo(card, `Algorytm podziału ${daninaLblGen} (cityYieldPerTurn)`, [
    `Zbierz ${daninaLblAcc} ze wszystkich obrabianych pól + centrum miasta.`,
    maTargowisko ? 'Targowisko zwiększa handelBrutto o bonus procentowy.' : 'Bez Targowiska — tylko plony z terenu.',
    aktywneTrasyCount > 0
      ? `Trasy handlowe z budynkiem: +${Math.round(premiaTrasHandlowych)} do handelBrutto (${aktywneTrasyCount} aktywnych — szczegóły szlaków i partnerów w panelu Handel, żeton paska zasobów).`
      : 'Bez aktywnych tras handlowych z budynkiem — brak premii do handelBrutto.',
    `Odejmij korupcję (dziś: stały ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto; docelowo: dystans, miasta, cap) → handelNetto.`,
    'Waluta + Mennica RAZEM (decyzja 2026-07-25) mnożą całe handelNetto — Skarb, Naukę i ' + HANDEL_ZAMOZNOSC_LABEL + ' równocześnie. Sam tech Waluty już NIE wystarcza.',
    `Podziel handelNetto suwakami: Skarb / Nauka / ${HANDEL_ZAMOZNOSC_LABEL} (suma 100%).`,
    mennicaAktywna
      ? `Mennica + Waluta razem mnożą całe ${daninaLbl} netto ${mennicaMnoznikTxt} (Skarb, Nauka i ${HANDEL_ZAMOZNOSC_LABEL} rosną razem).`
      : mennicaSpiZBrakuZlota
        ? `Mennica zbudowana i Waluta odkryta, ale mnożnik ŚPI: brak Złota w magazynie państwa — wraca sam po uzupełnieniu zapasu.`
        : maMennicaBudynek
          ? 'Mennica zbudowana, ale bez Waluty jeszcze nic nie mnoży (bramka: budynek + technologia, obie wymagane).'
          : `Bez Mennicy — ${daninaLbl} netto bez mnożnika, niezależnie od tego czy Waluta jest odkryta.`,
    maBiblioteka ? `Biblioteka dodaje % bonusu do Nauki (łącznie z Nauką z ${daninaLblGen}).` : `Nauka = wyłącznie udział z ${daninaLblGen} + budynki.`,
    `${HANDEL_ZAMOZNOSC_LABEL} nie trafia do skarbca — idzie do puli zamożności miasta.`,
    'Na końcu: mnożnik W mnoży cały pieniądz miasta (Skarb + budynki + Targowisko).',
  ]);

  appendDetailAlgo(card, 'Suwak UI (adjustHandelSplit)', [
    'Zmieniasz jeden suwak — pozostałe dwa dostosowują się proporcjonalnie.',
    'Kroki co 10% (HANDEL_PCT_STEP). Suma zawsze 100%.',
    `Przesunięcie na ${HANDEL_ZAMOZNOSC_LABEL} = mniej 💰 teraz, wyższe W później (×Skarb rośnie z W).`,
    `Przesunięcie na Skarb = więcej 💰 teraz, wolniejszy W lub spadek W przy zbyt niskim udziale ${HANDEL_ZAMOZNOSC_LABEL}.`,
  ]);

  appendDetailSection(card, 'Kontekst kolumny');
  const note = el('div', 'dc-note');
  note.style.fontStyle = 'normal';
  note.textContent =
    `${daninaLbl}, zamożność, racje/wzrost i porządek — ustawienia w tej kolumnie wpływają na każdą turę. ` +
    `Podział ${daninaLblGen} jest per miasto; racje żywności — per miasto (batony 1/2/3).`;
  card.appendChild(note);
  return card;
}

/**
 * Jednostki pinu swiadomie USUNIETE z architektury v2 (ZALOZENIE K03-Z4, nie portowane):
 * - `configureCityPanel` (pin :612) — hook `cfg` znika; wejscia przychodza jako argument `CityPanelDto`.
 * - `gameData` (pin :626) — ladowanie danych gry po stronie panelu znika; dane (katalogi) z `staticCatalog`/DTO.
 */
export const K03_RETIRED: readonly { pin: string; line: number; powod: string }[] = [
  { pin: 'configureCityPanel', line: 612, powod: 'K03-Z4: hook cfg znika, wejscia z CityPanelDto' },
  { pin: 'gameData', line: 626, powod: 'K03-Z4: brak lokalnego ladowania danych gry w panelu' },
];
