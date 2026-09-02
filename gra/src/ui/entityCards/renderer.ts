/**
 * entityCards/renderer.ts — jeden DOM-builder dla wszystkich 4 kinds (plan §1).
 *
 * T1: obsługuje w pełni tryb `dialog` (backdrop + `escapeOverlayStack`, wzorem
 * `unitInfoCard.ts:showUnitInfoCardDialog`). `opts.mode` istnieje już w typach
 * (`inline`/`hover` dochodzą w T5) — patrz `06-dispatch-T1-kontrakt.md`.
 *
 * Zero edycji istniejących kart — ten renderer nie jest jeszcze wołany przez
 * `unitInfoCard.ts`/`cityPanel.ts`/`techDiscoveryNotice.ts` (migracja to T3+).
 */
import { pushOverlay, popOverlay } from '../escapeOverlayStack';
import { attachHoverDetail } from '../hoverDetailDock';
import { resolveBuildingRow, resolveImprovementRow, resolveTechnologyRow, resolveUnitRow, resolveWonderRow } from './registry';
import { unitAdapter } from './unitAdapter';
import { buildingAdapter } from './buildingAdapter';
import { technologyAdapter } from './technologyAdapter';
import { improvementAdapter } from './improvementAdapter';
import { wonderAdapter } from './wonderAdapter';
import { defaultOwnerColor, mountUnitMiniPreview } from '../unitMiniPreview';
import type {
  EntityCardData,
  EntityCardCtx,
  EntityKind,
  EntityCardDismiss,
  OpenEntityCardOptions,
} from './types';

let overlaySeq = 0;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/** Buduje `EntityCardData` per kind, delegując do resolver+adapter. `null` gdy id
 * nie istnieje w danych (adapter nie jest wołany — brak surowego wiersza). */
export function buildEntityCardData(kind: EntityKind, id: string, ctx: EntityCardCtx = {}): EntityCardData | null {
  const data = ((): EntityCardData | null => {
    switch (kind) {
      case 'unit': {
        const row = resolveUnitRow(id);
        if (row == null) return null;
        const built = unitAdapter(row, ctx);
        // Podgląd 3D w medalionie nagłówka — wzorem `unitInfoCard.ts::buildUnitInfoCardViaEntityCard`
        // (ten sam mechanizm `mountUnitMiniPreview`/`defaultOwnerColor`, jedyny call-site z realnym
        // ownerColor to `unitInfoCard.ts`; `EntityCardCtx` nie niesie koloru właściciela na tym
        // poziomie, więc fallback `defaultOwnerColor()`, R-KARTA-JEDNOSTKI-3D-PODGLAD-BRAKUJACY-Q1).
        // Dotyczy WYŁĄCZNIE `kind: 'unit'` — pozostałe 4 kinds bez zmian.
        return {
          ...built,
          medallion: {
            kind: 'unit3d',
            mount: (slot: HTMLElement) =>
              mountUnitMiniPreview(slot, row, defaultOwnerColor(), 'Render 3D niedostępny w tym środowisku'),
          },
        };
      }
      case 'building': {
        const row = resolveBuildingRow(id);
        return row == null ? null : buildingAdapter(row, ctx);
      }
      case 'technology': {
        const row = resolveTechnologyRow(id);
        return row == null ? null : technologyAdapter(row, ctx);
      }
      case 'improvement': {
        const row = resolveImprovementRow(id);
        return row == null ? null : improvementAdapter(row, ctx);
      }
      case 'wonder': {
        const row = resolveWonderRow(id);
        return row == null ? null : wonderAdapter(row, ctx);
      }
    }
  })();
  if (data == null) return null;
  // Gwarancja kontraktu: `data.id` jest ZAWSZE dokładnie tym `id`, po którym encja
  // została odnaleziona (resolver) — niezależnie od tego, czy adapter potrafi je
  // wyliczyć samodzielnie z surowego wiersza (np. `improvement` — wiersz w
  // `terrain-improvements.json` nie niesie własnego klucza obiektu, patrz
  // `improvementAdapter.ts`). Zapobiega cichemu rozjazdowi `id` używanego do
  // zapytania od `id` w zwróconych danych.
  return { ...data, id };
}

/** Buduje jeden wiersz 'grid' — label/value zwykłe, plus opcjonalne icon/trailing/badge
 * (T1b). Gdy `row.badge` jest podany, wiersz renderuje się jak `actionItemRow()`
 * (`techDiscoveryNotice.ts:189-191`): badge kolorowy + `row.value` jako tekst obok,
 * `row.label` staje się etykietą badge'a — zamiast siatki label/value. `row.linkTo`
 * (T10) jest honorowany JEDNOLICIE również w tej gałęzi — tekst obok badge'a staje
 * się `<button data-entity-kind data-entity-id>` zamiast `<span>`, złapane przez ten
 * sam delegowany listener w `renderEntityCard` co zwykłe wiersze niżej. */
function buildGridRowEl(row: EntityCardData['sections'][number]['rows'][number]): HTMLElement {
  if (row.badge) {
    const rowEl = el('div', 'entity-card-row entity-card-row-action');
    const badgeEl = el('span', `entity-card-row-badge entity-card-row-badge--${row.badge.kind}`);
    badgeEl.textContent = row.badge.label;
    const text = el(row.linkTo ? 'button' : 'span', 'entity-card-row-action-text');
    text.textContent = row.value;
    if (row.linkTo) {
      text.setAttribute('data-entity-kind', row.linkTo.kind);
      text.setAttribute('data-entity-id', row.linkTo.id);
    }
    rowEl.append(badgeEl, text);
    return rowEl;
  }
  const rowEl = el('div', row.emphasize ? 'entity-card-row entity-card-row-emphasis' : 'entity-card-row');
  if (row.icon) {
    const iconEl = el('span', 'entity-card-row-icon');
    iconEl.setAttribute('aria-hidden', 'true');
    // SVG wstawiany jako markup (nie .textContent) — wzorem `iconTile()` w
    // `techDiscoveryNotice.ts:148-152` i medalionu karty (`buildMedallionEl` niżej).
    iconEl.innerHTML = row.icon.svg;
    rowEl.appendChild(iconEl);
  }
  const key = el('span', 'entity-card-row-key');
  key.textContent = row.label;
  const val = el(row.linkTo ? 'button' : 'span', 'entity-card-row-value');
  val.textContent = row.value;
  if (row.linkTo) {
    val.setAttribute('data-entity-kind', row.linkTo.kind);
    val.setAttribute('data-entity-id', row.linkTo.id);
    // RUNDA 2 (R-TECHNOLOGIA-KARTA-USUN-OPIS-BUDYNKI-JEDNOSTKI-Q1, ECHO): gdy `row.value`
    // jest puste (Budynki/Jednostki karty technologii od rundy 1 — usunięty opis po
    // prawej), przycisk-link kurczy się do 0px szerokości i tylko klik w USTAWIONY
    // wąski obszar przycisku otwierał kartę — etykieta po lewej (`key`, osobny `<span>`)
    // nie reagowała. Naprawa: CAŁY wiersz (`rowEl`) dostaje te same atrybuty pod inną
    // nazwą (`data-row-entity-*`, celowo różną od `data-entity-*` na `card` — patrz
    // listener niżej) jako fallback hit-area, plus klasę do kursora.
    //
    // RUNDA 2, POPRAWKA PO ZARZUCIE EVALUATORA: warunek `row.value === ''` PONIŻEJ jest
    // konieczny, nie kosmetyczny — bez niego `rowEl.setAttribute` uruchamiał się dla
    // KAŻDEGO wiersza z `linkTo`, więc fallback w listenerze (patrz niżej) łapał też
    // klik w etykietę `key` w sekcjach z NIEPUSTYM `value` (Ulepszenia terenu, Kolejne
    // technologie, Zmiany ekonomiczne, karta jednostki) — czyli poszerzał obszar
    // klikalności tam, gdzie ECHO wymagało zera zmiany zachowania. Z tym warunkiem
    // fallback istnieje WYŁĄCZNIE tam, gdzie przycisk `val` faktycznie ma zerową
    // szerokość (Budynki/Jednostki po rundzie 1) — w pozostałych sekcjach `val` ma
    // widoczny tekst i klik zawsze trafia w przycisk, więc atrybut fallbacku tam się
    // w ogóle nie pojawia.
    if (row.value === '') {
      rowEl.classList.add('entity-card-row--linked');
      rowEl.setAttribute('data-row-entity-kind', row.linkTo.kind);
      rowEl.setAttribute('data-row-entity-id', row.linkTo.id);
    }
  }
  rowEl.append(key, val);
  if (row.trailing) {
    const trailingEl = el('span', 'entity-card-row-trailing');
    trailingEl.textContent = row.trailing;
    rowEl.appendChild(trailingEl);
  }
  return rowEl;
}

/** Buduje jedną pigułkę w trybie `layout: 'pills'` — wzorem `tdn-req-pill` w
 * `techDiscoveryNotice.ts:435-438` (checkmark trailing, `row.label` jako tekst).
 * `row.linkTo` (T10) honorowany jednolicie z `buildGridRowEl` — tekst pigułki staje
 * się `<button data-entity-kind data-entity-id>`, złapany przez ten sam delegowany
 * listener w `renderEntityCard`. */
function buildPillRowEl(row: EntityCardData['sections'][number]['rows'][number]): HTMLElement {
  const pill = el('span', 'entity-card-pill');
  const text = el(row.linkTo ? 'button' : 'span', 'entity-card-pill-text');
  text.textContent = row.label;
  if (row.linkTo) {
    text.setAttribute('data-entity-kind', row.linkTo.kind);
    text.setAttribute('data-entity-id', row.linkTo.id);
  }
  const check = el('b', 'entity-card-pill-check');
  check.textContent = '✓';
  pill.append(text, check);
  return pill;
}

/** Buduje jedną sekcję karty — akordeon (jeśli `collapsible`), layout grid/pills,
 * paginacja `previewLimit`, badge listy płaskiej na dole (bez zmian z T1). `cardEl`
 * jest potrzebny wyłącznie do sprzężenia „Pokaż pozostałe N" z
 * `EntityCardData.compactHeaderOnExpand` (patrz `types.ts`). */
function buildSectionEl(
  section: EntityCardData['sections'][number],
  cardEl: HTMLElement,
  compactHeaderOnExpand: boolean,
): HTMLElement {
  const sectionEl = el('section', 'entity-card-section');
  sectionEl.setAttribute('data-section-key', section.key);
  if (section.highlighted) sectionEl.classList.add('entity-card-section--hi');

  const heading = el('h3', 'entity-card-section-heading');
  const headingLabel = el('span', 'entity-card-section-heading-label');
  headingLabel.textContent = section.title;
  heading.appendChild(headingLabel);

  const layout = section.layout ?? 'grid';
  const grid = el('div', layout === 'pills' ? 'entity-card-section-pills' : 'entity-card-section-grid');
  const previewLimit = section.previewLimit;
  const showAll = previewLimit == null || previewLimit >= section.rows.length;
  const visibleRows = showAll ? section.rows : section.rows.slice(0, Math.max(0, previewLimit));
  const hiddenRows = showAll ? [] : section.rows.slice(Math.max(0, previewLimit));
  for (const row of visibleRows) {
    grid.appendChild(layout === 'pills' ? buildPillRowEl(row) : buildGridRowEl(row));
  }
  let restEl: HTMLElement | null = null;
  let moreBtn: HTMLButtonElement | null = null;
  if (hiddenRows.length > 0) {
    restEl = el('div', layout === 'pills' ? 'entity-card-section-pills' : 'entity-card-section-grid');
    restEl.hidden = true;
    for (const row of hiddenRows) {
      restEl.appendChild(layout === 'pills' ? buildPillRowEl(row) : buildGridRowEl(row));
    }
    moreBtn = el('button', 'entity-card-more');
    moreBtn.type = 'button';
    moreBtn.textContent = `Pokaż pozostałe ${hiddenRows.length}`;
    moreBtn.setAttribute('data-more-section', section.key);
  }

  if (section.collapsible) {
    const open = section.openDefault !== false;
    sectionEl.setAttribute('data-open', open ? '1' : '0');
    const headBtn = el('button', 'entity-card-section-head');
    headBtn.type = 'button';
    headBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    headBtn.appendChild(headingLabel);
    const chevron = el('span', 'entity-card-section-chevron');
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = open ? '▾' : '▸';
    headBtn.appendChild(chevron);
    sectionEl.appendChild(headBtn);
    const bodyEl = el('div', 'entity-card-section-body');
    bodyEl.hidden = !open;
    bodyEl.appendChild(grid);
    if (restEl) bodyEl.appendChild(restEl);
    if (moreBtn) bodyEl.appendChild(moreBtn);
    sectionEl.appendChild(bodyEl);
    headBtn.addEventListener('click', () => {
      const nowOpen = sectionEl.getAttribute('data-open') !== '1';
      sectionEl.setAttribute('data-open', nowOpen ? '1' : '0');
      headBtn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      chevron.textContent = nowOpen ? '▾' : '▸';
      bodyEl.hidden = !nowOpen;
    });
  } else {
    sectionEl.appendChild(heading);
    sectionEl.appendChild(grid);
    if (restEl) sectionEl.appendChild(restEl);
    if (moreBtn) sectionEl.appendChild(moreBtn);
  }

  if (moreBtn && restEl) {
    const btn = moreBtn;
    const rest = restEl;
    btn.addEventListener('click', () => {
      rest.hidden = false;
      btn.hidden = true;
      if (compactHeaderOnExpand) cardEl.classList.add('entity-card--compact');
    });
  }

  if (section.badges && section.badges.length > 0) {
    const badgeRow = el('div', 'entity-card-row entity-card-row-badges');
    const badges = el('div', 'entity-card-badges');
    for (const b of section.badges) {
      const badge = el('span', 'entity-card-badge');
      badge.textContent = b;
      badges.appendChild(badge);
    }
    badgeRow.appendChild(badges);
    sectionEl.appendChild(badgeRow);
  }
  return sectionEl;
}

function buildMedallionEl(data: EntityCardData): HTMLElement {
  const slot = el('div', 'entity-card-medallion');
  if (data.medallion.kind === 'icon') {
    slot.innerHTML = data.medallion.svg;
  }
  return slot;
}

/** Jeden DOM-builder dla wszystkich 4 kinds — buduje kartę z `EntityCardData` już
 * gotowego (adapter zebrał dane, renderer wyłącznie buduje DOM, zgodnie z ECHO Q1=B). */
export function renderEntityCard(data: EntityCardData): HTMLElement {
  const card = el('div', `entity-card entity-card-${data.kind}`);
  card.setAttribute('data-entity-kind', data.kind);
  card.setAttribute('data-entity-id', data.id);

  // R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1 (Wariant A, ECHO właściciela): nagłówek karty
  // to teraz pełnoszerokościowa DIORAMA (~190px) — ciemna scena z winietą, powiększony,
  // wyśrodkowany podgląd (ten SAM medalion co dotąd: zamontowany snapshot 3D dla jednostek,
  // płaski SVG dla pozostałych 4 rodzajów), elipsa „gruntu" pod nim i overlay tytułu w
  // lewym dolnym rogu. Klasa `entity-card-header` MUSI zostać na tym elemencie — poza
  // allowlistą tego tematu żyją dwa konsumenty, które dopinają do niej przycisk zamknięcia
  // (`unitInfoCard.ts:98`, `techDiscoveryNotice.ts:610` przez `card.querySelector`).
  // Medalion pozostaje POTOMKIEM `card` i jest dołączony do drzewa PRZED `mount()` niżej,
  // więc kontrakt `unit-card-3d-preview-coverage-test`/`...-migration-test` (selektory
  // `.entity-card-medallion canvas.unit-mini-canvas` liczone od korzenia karty) jest
  // zachowany bez zmian w tamtych plikach.
  const header = el('div', 'entity-card-header entity-card-diorama');
  const stage = el('div', 'entity-card-diorama-stage');
  const ground = el('div', 'entity-card-diorama-ground');
  ground.setAttribute('aria-hidden', 'true');
  stage.appendChild(ground);
  const medallionEl = buildMedallionEl(data);
  stage.appendChild(medallionEl);
  header.appendChild(stage);

  const titleWrap = el('div', 'entity-card-title-wrap');
  const titleRow = el('div', 'entity-card-title-row');
  const h2 = el('h2');
  h2.textContent = data.title;
  titleRow.appendChild(h2);
  if (data.statusBadges && data.statusBadges.length > 0) {
    for (const status of data.statusBadges) {
      const badge = el('span', 'entity-card-status-badge');
      badge.textContent = status;
      titleRow.appendChild(badge);
    }
  }
  titleWrap.appendChild(titleRow);
  if (data.subtitle) {
    const sub = el('div', 'entity-card-subtitle');
    sub.textContent = data.subtitle;
    titleWrap.appendChild(sub);
  }
  header.appendChild(titleWrap);
  card.appendChild(header);

  // Rys historyczny (T-KARTY-HISTORIA-INFRA-Q1, kolejność odwrócona przez
  // P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1) — renderowany WYŁĄCZNIE gdy
  // `data.historicalNote` jest niepuste (adapter przycina biały tekst i zwraca
  // `undefined` dla braku danych, patrz `types.ts`), więc karty bez jeszcze
  // dopisanej historii (100% dziś) NIE dostają pustej/białej sekcji w DOM — zero
  // węzła `.entity-card-historia` zamiast pustego kontenera. Umieszczony PO
  // headerze/tytule/medalionie, PRZED sekcjami mechanicznymi (`body`) — opis
  // fabularny ma poprzedzać statystyki, zgodnie z żądaniem właściciela.
  if (data.historicalNote) {
    const historia = el('div', 'entity-card-historia');
    const sep = el('div', 'entity-card-historia-sep');
    sep.setAttribute('aria-hidden', 'true');
    historia.appendChild(sep);
    const p = el('p', 'entity-card-historia-text');
    p.textContent = data.historicalNote;
    historia.appendChild(p);
    card.appendChild(historia);
  }

  const body = el('div', 'entity-card-body');
  for (const section of data.sections) {
    if (section.rows.length === 0 && (!section.badges || section.badges.length === 0)) continue;
    const sectionEl = buildSectionEl(section, card, data.compactHeaderOnExpand === true);
    body.appendChild(sectionEl);
  }
  card.appendChild(body);

  if (data.civpediaLink) {
    const link = data.civpediaLink;
    const footer = el('div', 'entity-card-footer');
    const btn = el('button', 'entity-card-civpedia-link');
    btn.type = 'button';
    btn.textContent = 'Więcej informacji (Civpedia)';
    btn.setAttribute('data-civpedia-folder', link.folder);
    btn.setAttribute('data-civpedia-slug', link.slug);
    footer.appendChild(btn);
    card.appendChild(footer);
  }

  if (data.actions && data.actions.length > 0) {
    const actionsEl = el('div', 'entity-card-actions');
    for (const action of data.actions) {
      const btn = el('button', `entity-card-action entity-card-action-${action.kind}`);
      btn.type = 'button';
      btn.textContent = action.label;
      btn.setAttribute('data-action-id', action.id);
      btn.addEventListener('click', action.onClick);
      actionsEl.appendChild(btn);
    }
    card.appendChild(actionsEl);
  }

  if (data.medallion.kind === 'unit3d') {
    // Musi być wywołane PO appendChild sekcji medalionu w DOM (patrz plan §7.1 /
    // `unitInfoCard.ts:150-162`) — inaczej Three.js dostaje odłączony element.
    data.medallion.mount(medallionEl);
  }

  // Linkowanie krzyżowe (T10 LINKOWANIE-KRZYZOWE) — dispatch JEDNOLITY dla wszystkich
  // 4 kinds i wszystkich trybów (dialog/inline/hover): klik na dowolny wiersz z
  // `row.linkTo` (renderowany jako `<button data-entity-kind data-entity-id>` w
  // `buildGridRowEl`/`buildPillRowEl` wyżej) otwiera kartę docelową jako NOWY,
  // zagnieżdżony overlay (`mode:'dialog'`, więc zawsze przez `pushOverlay`/`popOverlay`
  // — `openDialog` niżej), NIE zamykając karty źródłowej. Delegowany listener na `card`
  // (nie na każdym przycisku z osobna) — jeden słuchacz per zbudowana karta, jednolity
  // dla wszystkich adapterów, zgodnie z wymogiem dispatchu T10 ("nie osobne wiring
  // per-adapter jak robił T7b tymczasowo"). Selektor `button[data-entity-kind]` celowo
  // nie łapie atrybutów `data-entity-kind`/`data-entity-id` na samym korzeniu `card`
  // (to `div`, nie `button`) — zero kolizji z tożsamością karty nadrzędnej.
  //
  // `stopImmediatePropagation()` po obsłużeniu — ten listener jest rejestrowany TU,
  // wewnątrz `renderEntityCard`, więc zawsze PRZED jakimkolwiek dodatkowym listenerem,
  // który wołający dopina PO otrzymaniu `card` z powrotem (np. lokalne wiązanie
  // `openEntityCard('improvement', ...)` dla sekcji „Ulepszenia terenu" w
  // `techDiscoveryNotice.ts`, pozostawione tam z T7b jako „tymczasowe" — poza allowlistą
  // T10, więc nie usuwane w tym kroku). Bez tego dwa niezależne listenery na tym samym
  // `card` obsłużyłyby TEN SAM klik i otworzyłyby DWIE nakładki naraz — realny,
  // sprawdzony scenariusz regresji (technologyAdapter → sekcja „Ulepszenia terenu").
  card.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const btn = target?.closest('button[data-entity-kind]') as HTMLButtonElement | null;
    let linkKind: EntityKind | null = null;
    let linkId: string | null = null;
    if (btn != null) {
      linkKind = btn.getAttribute('data-entity-kind') as EntityKind | null;
      linkId = btn.getAttribute('data-entity-id');
    } else {
      // RUNDA 2 fallback (patrz komentarz w `buildGridRowEl` przy `data-row-entity-kind`):
      // klik poza przyciskiem (np. w etykietę `.entity-card-row-key` gdy `value` jest
      // puste) trafia tu zamiast w `button[data-entity-kind]` powyżej — atrybut
      // `data-row-entity-*` żyje na `.entity-card-row`, NIE na `card` (który ma własne
      // `data-entity-kind`/`data-entity-id` identyfikujące CAŁĄ kartę, linia 242-243
      // wyżej), więc `closest()` nie może przypadkiem złapać korzenia karty i otworzyć
      // jej samej w pętli.
      const rowEl = target?.closest('.entity-card-row[data-row-entity-kind]') as HTMLElement | null;
      if (rowEl != null) {
        linkKind = rowEl.getAttribute('data-row-entity-kind') as EntityKind | null;
        linkId = rowEl.getAttribute('data-row-entity-id');
      }
    }
    if (linkKind == null || linkId == null) return;
    event.stopImmediatePropagation();
    openEntityCard(linkKind, linkId, { mode: 'dialog' });
  });

  return card;
}

function openDialog(data: EntityCardData): EntityCardDismiss {
  const overlayId = `entity-card-${data.kind}-${data.id}-${overlaySeq++}`;
  const backdrop = el('div', 'entity-card-backdrop');
  const dialog = el('div', 'entity-card-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-label', data.title);
  let closed = false;
  const dismiss = (): void => {
    if (closed) return;
    closed = true;
    popOverlay(overlayId);
    backdrop.remove();
  };
  const card = renderEntityCard(data);
  dialog.appendChild(card);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) dismiss();
  });
  pushOverlay(overlayId, dismiss);
  return dismiss;
}

function openInline(data: EntityCardData, container: HTMLElement): EntityCardDismiss {
  const card = renderEntityCard(data);
  container.appendChild(card);
  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    card.remove();
  };
}

/**
 * Tryb `hover` (T5 MIGRACJA-KARTA-BUDYNKU-PANEL-MIASTA) — doczepia się do
 * `attachHoverDetail(anchor, buildContent, 220, 'left')` (`hoverDetailDock.ts`) zamiast
 * backdropu (`dialog`) czy natychmiastowego appendChild (`inline`). `opts.container` jest
 * tu REUŻYTY jako punkt zaczepienia hover (anchor — np. wiersz listy budynków), NIE jako
 * cel natychmiastowego montażu — `EntityCardCtx`/`OpenEntityCardOptions` (`types.ts`) nie
 * mają osobnego pola `anchor`, a `types.ts` jest poza allowlistą T5; `container` już
 * istnieje w kontrakcie i pasuje semantycznie („element HTML powiązany z otwarciem karty").
 *
 * KRYTYCZNE dla wydajności hover (wymóg dispatchu T5): `buildEntityCardData`/
 * `renderEntityCard` są wołane DOPIERO wewnątrz callbacku `attachHoverDetail` — czyli
 * DOPIERO gdy użytkownik faktycznie najedzie (po `delayMs`), identycznie jak dzisiejsze
 * `attachHoverDetail(row, () => buildXDetailCard(...), ...)` w `cityPanel.ts` — zero
 * kosztu przy samym wywołaniu `openEntityCard(..., {mode:'hover'})` (tylko rejestracja
 * listenerów mouseenter/mouseleave).
 */
function openHover(kind: EntityKind, id: string, ctx: EntityCardCtx, anchor: HTMLElement): EntityCardDismiss {
  attachHoverDetail(anchor, () => {
    const data = buildEntityCardData(kind, id, ctx);
    if (data == null) {
      // eslint-disable-next-line no-console
      console.warn(`[entityCards] openEntityCard(hover): brak encji ${kind}/${id}`);
      return el('div', 'entity-card-hover-empty');
    }
    return renderEntityCard(data);
  }, 220, 'left');
  // `attachHoverDetail` nie oferuje dziś odłączenia własnych listenerów (ten sam brak co
  // wszystkie dzisiejsze wywołania w `cityPanel.ts`) — dismiss() jest tu no-op, spójnie z
  // resztą kodu bazowego, nie regresja wprowadzona przez `openEntityCard`.
  return () => {};
}

/**
 * `openEntityCard(kind, id, opts)` — punkt wejścia publiczny. `dialog`/`inline` w pełni
 * zaimplementowane od T1; `hover` dochodzi w T5 (patrz `openHover` wyżej).
 * Zwraca `dismiss()`. Zwraca funkcję no-op jeśli encja nie istnieje (resolver null) —
 * WYJĄTEK: w trybie `hover` istnienie encji jest sprawdzane DOPIERO przy faktycznym
 * hoverze (patrz `openHover`), więc ta wczesna gałąź go nie dotyczy.
 */
export function openEntityCard(kind: EntityKind, id: string, opts: OpenEntityCardOptions = {}): EntityCardDismiss {
  const mode = opts.mode ?? 'dialog';
  if (mode === 'hover') {
    if (!opts.container) {
      throw new Error('openEntityCard: mode "hover" wymaga opts.container jako punktu zaczepienia (anchor)');
    }
    return openHover(kind, id, opts.ctx ?? {}, opts.container);
  }
  const data = buildEntityCardData(kind, id, opts.ctx ?? {});
  if (data == null) {
    // eslint-disable-next-line no-console
    console.warn(`[entityCards] openEntityCard: brak encji ${kind}/${id}`);
    return () => {};
  }
  if (mode === 'inline') {
    if (!opts.container) throw new Error('openEntityCard: mode "inline" wymaga opts.container');
    return openInline(data, opts.container);
  }
  return openDialog(data);
}

export const ENTITY_CARD_CSS = `
.entity-card-backdrop{position:fixed;inset:0;z-index:520;display:flex;align-items:center;
  justify-content:center;padding:16px;background:rgba(0,0,0,.62);}
.entity-card-dialog{position:relative;max-height:calc(100vh - 32px);overflow:auto;}
.entity-card{width:min(434px,calc(100vw - 32px));border:1px solid rgba(232,216,138,.45);
  border-radius:12px;background:linear-gradient(180deg,rgba(20,26,34,.99),rgba(8,10,16,.99));
  color:#e8e0c8;box-shadow:0 10px 28px rgba(0,0,0,.65);overflow:hidden;
  font-family:var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);}
.entity-card-header{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;
  background:rgba(232,216,138,.06);border-bottom:1px solid rgba(232,216,138,.18);}
.entity-card-medallion{width:34px;height:34px;flex:none;}
.entity-card-title-wrap{min-width:0;flex:1;}
.entity-card-title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.entity-card h2{margin:0;font:600 17px/1.15 Georgia,'Times New Roman',serif;}
.entity-card-subtitle{opacity:.75;font-size:12px;margin-top:2px;}
.entity-card-body{padding:10px 14px;}
.entity-card-section{margin-bottom:10px;}
.entity-card-section h3{margin:0 0 4px;font-size:13px;opacity:.8;}
.entity-card-row{display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:2px 0;}
.entity-card-row-emphasis{font-weight:600;}
/* RUNDA 2 (R-TECHNOLOGIA-KARTA-USUN-OPIS-BUDYNKI-JEDNOSTKI-Q1): kursor spojny z tym, ze
   caly wiersz jest teraz klikalny (fallback data-row-entity-*, patrz renderEntityCard),
   nie tylko przycisk value — najbardziej widoczne, gdy value jest puste. */
.entity-card-row--linked{cursor:pointer;}
/* P-CIVPEDIA-KARTY-LINKI-NIEOSTYLOWANE-REGRES-T10-Q1: brakujace od T1 (c1365bfa) reguly
   dla pary etykieta/wartosc wiersza siatki. Do T10 .entity-card-row-value renderowalo sie
   zawsze jako span — brak stylu byl niewidoczny (dziedziczony kolor otoczenia). T10
   (f17e257e, LINKOWANIE-KRZYZOWE) zamienil wartosci z row.linkTo na button, przez co
   przegladarka ubierala je w natywny, jasny/wypukly przycisk z czarnym tekstem ("dziwne
   napisy na bialym tle" ze zgloszenia wlasciciela). Ponizszy blok: (1) daje etykiecie
   wyciszony kolor, a wartosci wyrownanie do prawej krawedzi wiersza (.entity-card-row to
   flex ze space-between); (2) resetuje natywny wyglad przycisku i nadaje WSZYSTKIM linkom
   krzyzowym (building/unit/technology/improvement, w trzech wariantach wiersza: grid,
   badge/action, pill) DOKLADNIE ten sam, juz zaakceptowany jezyk wizualny co lokalny styl
   linku ulepszenia "Szczegoly ->" z T7b (techDiscoveryNotice.ts): zloty, podkreslony,
   kursor pointer, jasniejszy hover, czytelny focus-ring na ciemnym tle. Brak makiety
   designera dla tego elementu (DO-DESIGN-KARTA-TECHNOLOGII-2026-08-17.md par. 6 odracza
   cross-linking) — swiadome rozszerzenie istniejacego wzorca zamiast nowego projektu. */
/* margin-right:auto zamiast polegania na samym space-between: wiersz z ikona ma TRZY
   dzieci (ikona/klucz/wartosc), wiec space-between wypychal etykiete na SRODEK wiersza
   zamiast trzymac ja przy ikonie. Auto-margines przykleja etykiete do lewej, a wartosc
   do prawej krawedzi — niezaleznie od tego, czy ikona jest. */
.entity-card-row-key{opacity:.72;margin-right:auto;}
/* BEZ text-align:right — sam flex (space-between + auto-margines etykiety) dosuwa pudelko
   wartosci do prawej krawedzi, wiec krotkie wartosci i tak sa wyrownane do prawej, a dlugie,
   zawijane opisy zostaja czytelnie wyrownane do lewej zamiast lamac sie w postrzepiona
   lewa krawedz. min-width NIE jest zerowane — inaczej etykieta moglaby sie sciesnic ponizej
   wlasnej tresci i nachodzic na wartosc. */
.entity-card-row-value{overflow-wrap:anywhere;}
button.entity-card-row-value,
button.entity-card-row-action-text,
button.entity-card-pill-text,
button.entity-card-civpedia-link{-webkit-appearance:none;appearance:none;background:none;border:0;
  margin:0;padding:0;font:inherit;line-height:inherit;cursor:pointer;
  color:var(--tg-gold-primary,#e8d88a);text-decoration:underline;text-underline-offset:2px;}
button.entity-card-row-value,
button.entity-card-row-action-text,
button.entity-card-pill-text,
button.entity-card-civpedia-link{text-align:left;}
button.entity-card-row-value:hover,
button.entity-card-row-action-text:hover,
button.entity-card-pill-text:hover,
button.entity-card-civpedia-link:hover{color:#f4e6a8;}
button.entity-card-row-value:focus-visible,
button.entity-card-row-action-text:focus-visible,
button.entity-card-pill-text:focus-visible,
button.entity-card-civpedia-link:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary,#e8d88a));
  outline-offset:2px;border-radius:3px;}
.entity-card-row-icon{width:15px;height:15px;flex:none;display:flex;align-items:center;
  justify-content:center;opacity:.9;}
.entity-card-row-trailing{opacity:.7;font-size:12px;}
.entity-card-row-action{display:flex;align-items:center;gap:8px;font-size:13px;padding:2px 0;}
.entity-card-row-action-text{flex:1;}
.entity-card-row-badge{border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;
  flex:none;}
.entity-card-row-badge--ok{background:rgba(120,200,120,.18);color:#9fe39f;}
.entity-card-row-badge--warn{background:rgba(230,180,90,.18);color:#e6c07a;}
.entity-card-row-badge--muted{background:rgba(180,180,180,.14);color:#b8b8b8;}
/* R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 T4 runda 2: brakujący styl dla section.badges
   (kontener .entity-card-badges + pojedyncza .entity-card-badge) — istniał od T1, ale zero
   kart do tej pory renderowało >=2 odznak na raz, więc luka pozostawała niewidoczna aż do
   karty jednostki (sekcja „Statusy"), gdzie odznaki bez tego stylu sklejały się w jeden
   nieczytelny ciąg tekstu bez odstępu. Ta sama, neutralna pigułka co .entity-card-row-badge
   (bez wariantu koloru — section.badges to zwykłe stringi, nie {kind,label}). */
.entity-card-badges{display:flex;flex-wrap:wrap;gap:6px;}
.entity-card-badge{border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;
  flex:none;background:rgba(232,216,138,.14);color:#e0d4a0;}
.entity-card-section--hi{background:rgba(232,216,138,.07);border-radius:8px;padding:6px 8px;
  margin-left:-8px;margin-right:-8px;}
.entity-card-section-head{display:flex;align-items:center;gap:6px;width:100%;
  background:none;border:0;padding:0;margin:0 0 4px;color:inherit;font:inherit;
  cursor:pointer;text-align:left;}
.entity-card-section-heading{margin:0 0 4px;font-size:13px;opacity:.8;}
.entity-card-section-heading-label{flex:1;}
.entity-card-section-chevron{opacity:.7;}
.entity-card-section-body{}
.entity-card-section-pills{display:flex;flex-wrap:wrap;gap:6px;}
.entity-card-pill{display:inline-flex;align-items:center;gap:4px;border-radius:999px;
  padding:2px 10px;font-size:12px;background:rgba(232,216,138,.1);
  border:1px solid rgba(232,216,138,.25);}
.entity-card-pill-check{color:#9fe39f;}
.entity-card-more{display:block;width:100%;text-align:left;background:none;border:0;
  color:inherit;font:inherit;opacity:.8;cursor:pointer;padding:2px 0;}
.entity-card--compact .entity-card-medallion{width:24px;height:24px;}
.entity-card-footer{padding:8px 14px;border-top:1px solid rgba(232,216,138,.18);}
.entity-card-actions{display:flex;gap:8px;padding:10px 14px;border-top:1px solid rgba(232,216,138,.18);}
/* P-CIVPEDIA-KARTY-AKCJE-PRZYCISKI-NIEOSTYLOWANE-Q1: brakujace od T1 (c1365bfa) reguly dla
   samych PRZYCISKOW AKCJI karty. Kontener liczby mnogiej (.entity-card-actions, linia wyzej)
   byl ostylowany od poczatku, ale ".entity-card-action" / "-primary" / "-secondary" — czyli
   przyciski budowane z "data.actions" w "renderEntityCard" (np. "Rozpocznij badanie" /
   "Otworz drzewo" ustawiane przez techDiscoveryNotice.ts) — nie mialy w calym repo ZADNEJ
   reguly. Przegladarka rysowala je natywnie; realna sonda Chromium na zywym popupie odkrycia:
   background rgb(239,239,239), color rgb(0,0,0), border-top-width 2px, cursor default — ten sam
   brzydki, jasny prostokat, ktory wlasciciel opisal jako "dziwne napisy na bialym tle" przy
   linkach krzyzowych. To NIE jest regres T10: klasa nie miala stylu od poczatku, po prostu
   zaden test nie renderowal karty z ustawionym "actions" (stad przeoczenie w tamtym temacie).

   Dlaczego INNY jezyk wizualny niz linki (.entity-card-row-value wyzej): tamte to NAWIGACJA
   do innej karty (zloty, podkreslony link). Te sa PRAWDZIWYMI AKCJAMI zmieniajacymi stan gry,
   wiec dostaja wypelniony przycisk. Wzorzec nie jest wymyslony — to 1:1 przedmigracyjny
   przycisk TEJ SAMEJ karty (".tdn-tree-btn", techDiscoveryNotice.ts, stopka starego
   ".tdn-card") oraz kanon design systemu 1E: ".tg-btn-primary" / ".tg-btn-outline"
   (icons/brand/tokens.css, icons/brand/menu-components.css). Hierarchia odpowiada temu, jak
   renderer dostaje "action.kind" z techDiscoveryNotice.ts: "primary" = akcja glowna
   ("Rozpocznij badanie"; a gdy jej nie ma — samotne "Otworz drzewo" awansuje na primary),
   "secondary" = akcja pomocnicza obok juz obecnej glownej. Stad primary = pelny zloty
   gradient, secondary = stonowany ciemny wariant z zlota obwodka. */
.entity-card-action{-webkit-appearance:none;appearance:none;display:inline-flex;
  align-items:center;justify-content:center;gap:8px;padding:7px 18px;
  border-radius:var(--tg-radius-btn,8px);cursor:pointer;
  font-family:var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);font-size:11px;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;line-height:1.2;}
.entity-card-action-primary{border:1px solid #6a5212;border-top-color:#f8eea8;
  background:var(--tg-btn-primary,linear-gradient(180deg,#f0dc88,#b99a28));
  color:var(--tg-btn-primary-ink,#2e2708);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 18px rgba(232,216,138,.2);}
.entity-card-action-primary:hover{filter:brightness(1.06);}
/* font-weight 600 (nie 700) i 2px rant — dokladnie jak .tg-btn-outline w menu-components.css;
   celowo lzejszy niz primary, zeby hierarchia byla czytelna takze bez koloru. */
.entity-card-action-secondary{border:2px solid rgba(232,216,138,.4);
  background:linear-gradient(180deg,#161c28,#0a0d14);color:var(--tg-gold-primary,#e8d88a);
  font-weight:600;box-shadow:inset 0 1px 0 rgba(232,216,138,.14);}
.entity-card-action-secondary:hover{border-color:var(--tg-gold-primary,#e8d88a);color:#f4e6a8;}
.entity-card-action:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary,#e8d88a));
  outline-offset:2px;}
/* koniec bloku P-CIVPEDIA-KARTY-AKCJE-PRZYCISKI-NIEOSTYLOWANE-Q1 — ta linia jest KOTWICA
   KONCOWA dla mutacji w tools/entity-card-action-buttons-real-render-test.cjs (wycina
   dokladnie ten blok z arkusza i sprawdza, ze asercje wracaja na czerwono). Nie usuwaj jej
   przy dopisywaniu kolejnych regul — nowe reguly dopisuj PO niej. */
/* T-KARTY-HISTORIA-INFRA-Q1: "Rys historyczny" — stylistycznie odrebna od sekcji
   mechanicznych (kursywa, przyciszony kolor, delikatny separator w gorze) zgodnie z
   dispatchem ("ciekawostka, nie dana do optymalizacji rozgrywki"). Renderowana tylko
   gdy data.historicalNote jest niepuste (patrz renderEntityCard/types.ts). */
.entity-card-historia{padding:2px 14px 12px;}
.entity-card-historia-sep{height:1px;margin:0 0 8px;
  background:linear-gradient(90deg,rgba(232,216,138,.32),rgba(232,216,138,0));}
.entity-card-historia-text{margin:0;font-style:italic;font-size:12.5px;line-height:1.5;
  color:var(--tg-text-muted,#a89f80);}
/* R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1 — DIORAMA (Wariant A z zaakceptowanej makiety).
   Reguły .entity-card-header/.entity-card-medallion/.entity-card-title-wrap WYŻEJ zostają
   nietknięte i pełnią teraz rolę BAZY dla trybu kompaktowego; ten blok nadpisuje je dla
   normalnego (non-compact) nagłówka przez klasę .entity-card-diorama (ta sama specyficzność,
   późniejsza pozycja w arkuszu), a blok kompaktowy na samym końcu przywraca stary,
   mały layout z wyższą specyficznością (.entity-card--compact ...). Dzięki temu przełączanie
   jest czysto CSS-owe — klasa .entity-card--compact dochodzi do karty DOPIERO po kliknięciu
   „Pokaż pozostałe N" (renderEntityCard/buildSectionEl), a nie w chwili renderu, więc DOM
   musi być jeden dla obu trybów. KOTWICA POCZĄTKOWA mutacji (entity-card-diorama-real-render-test). */
.entity-card-diorama{display:block;position:relative;height:190px;padding:0;gap:0;
  overflow:hidden;border-bottom:1px solid rgba(232,216,138,.28);
  background:radial-gradient(120% 80% at 50% 22%,rgba(88,108,140,.35),rgba(0,0,0,0) 70%),
    linear-gradient(180deg,#232c39 0%,#161d27 55%,#0c1017 100%);}
/* Winieta — przyciemnia krawędzie i dół sceny, żeby overlay tytułu był czytelny nad
   dowolnie jasnym podglądem (canvas 3D ma jasnoniebieskie tło nieba, 0x87ceeb). */
.entity-card-diorama::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:2;
  background:radial-gradient(115% 92% at 50% 34%,rgba(0,0,0,0) 42%,rgba(0,0,0,.5) 100%),
    linear-gradient(180deg,rgba(0,0,0,0) 54%,rgba(6,8,12,.72) 100%);}
.entity-card-diorama-stage{position:absolute;inset:0;z-index:1;display:flex;
  align-items:center;justify-content:center;padding-bottom:26px;}
.entity-card-diorama-ground{position:absolute;left:50%;bottom:27px;transform:translateX(-50%);
  width:172px;height:30px;pointer-events:none;
  background:radial-gradient(closest-side,rgba(0,0,0,.72),rgba(0,0,0,.32) 58%,rgba(0,0,0,0) 100%);}
.entity-card-diorama .entity-card-medallion{position:relative;width:120px;height:120px;flex:none;
  border-radius:14px;overflow:hidden;border:1px solid rgba(232,216,138,.32);
  box-shadow:0 14px 26px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);
  display:flex;align-items:center;justify-content:center;}
/* Skalowanie ZAWARTOŚCI medalionu do nowego rozmiaru — SVG rodzajów „icon" bywa zapisany z
   własnymi atrybutami width/height (34px), a snapshot 3D jest canvasem 80x80 z
   'unitMiniPreview.ts'. Reguła dla canvasa istnieje też lokalnie w 'unitInfoCard.ts'
   (ta sama wartość, wyższa specyficzność) — tu jest po to, żeby ENTITY_CARD_CSS był
   samowystarczalny także na ścieżkach cityPanel/techDiscoveryNotice. */
.entity-card-diorama .entity-card-medallion > svg,
.entity-card-diorama .entity-card-medallion .unit-mini-canvas{width:100%;height:100%;display:block;}
.entity-card-diorama .entity-card-medallion.unit-mini-fallback{font-size:44px;
  color:var(--tg-render-fallback,#e0a06a);}
/* Overlay tytułu — lewy dolny róg sceny, nad winietą (z-index 3). */
.entity-card-diorama .entity-card-title-wrap{position:absolute;left:14px;right:14px;bottom:11px;
  z-index:3;flex:none;text-shadow:0 2px 6px rgba(0,0,0,.9),0 0 2px rgba(0,0,0,.8);}
.entity-card-diorama .entity-card-title-row h2{font-size:19px;}
.entity-card-diorama .entity-card-subtitle{opacity:.88;}
/* Cokolwiek DODATKOWEGO doczepionego do nagłówka przez konsumentów spoza allowlisty
   (przycisk ✕ z 'unitInfoCard.ts'/'techDiscoveryNotice.ts') — nie może zostać w potoku
   układu, bo diorama nie jest już flexem; ląduje w prawym górnym rogu sceny. */
.entity-card-diorama > :not(.entity-card-diorama-stage):not(.entity-card-title-wrap){
  position:absolute;top:10px;right:10px;z-index:4;}
/* TRYB KOMPAKTOWY (.entity-card--compact, ustawiany przez 'technologyAdapter.ts' dla
   zagnieżdżonej listy jednostek w karcie technologii) — ZERO diaromy, stary mały nagłówek
   z medalionem 24px. Blok MUSI stać po blokach diaromy: równa specyficzność z
   '.entity-card-diorama .entity-card-medallion' rozstrzyga się kolejnością. */
.entity-card--compact .entity-card-header{display:flex;align-items:flex-start;gap:10px;
  height:auto;padding:12px 14px;overflow:visible;
  background:rgba(232,216,138,.06);border-bottom:1px solid rgba(232,216,138,.18);}
.entity-card--compact .entity-card-header::after{display:none;}
.entity-card--compact .entity-card-diorama-stage{position:static;display:block;
  width:24px;height:24px;flex:none;padding:0;}
.entity-card--compact .entity-card-diorama-ground{display:none;}
.entity-card--compact .entity-card-medallion{position:static;width:24px;height:24px;
  border:0;border-radius:0;box-shadow:none;display:block;}
.entity-card--compact .entity-card-title-wrap{position:static;flex:1;min-width:0;
  text-shadow:none;}
.entity-card--compact .entity-card-title-row h2{font-size:17px;}
.entity-card--compact .entity-card-header > :not(.entity-card-diorama-stage):not(.entity-card-title-wrap){
  position:static;}
/* KOTWICA KOŃCOWA bloku R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1 — mutacja w
   tools/entity-card-diorama-real-render-test.cjs wycina dokładnie ten zakres. Nowe reguły
   dopisuj PO tej linii. */
`;
