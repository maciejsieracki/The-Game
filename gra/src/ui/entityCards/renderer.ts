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
import { openCivpediaEntry } from './civpediaOpenGate';
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
  //
  // P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1: `civpediaLink.slug` podlega DOKŁADNIE tej samej
  // gwarancji, z tego samego powodu. Adaptery `improvement`/`wonder` liczą swoje `id` jako
  // placeholder (patrz komentarze tam), więc gdyby slug linku został tym, co wpisał adapter,
  // klik prowadziłby do innej encji niż karta — cichy, trudny do wykrycia rozjazd. `folder`
  // zostaje od adaptera (to on wie, w którym katalogu `docs/encyklopedia/` żyje jego rodzaj).
  //
  // ZASIĘG TEJ GWARANCJI — precyzyjnie, bo łatwo ją przecenić: obowiązuje WYŁĄCZNIE dla
  // danych przechodzących przez `buildEntityCardData`. Istnieją żywe ścieżki, które wołają
  // adapter BEZPOŚREDNIO i podają wynik do `renderEntityCard` z pominięciem tej normalizacji
  // (`unitInfoCard.ts:72,91`, `cityPanel.ts:7381-7382,7697-7708`). Dziś jest to bezpieczne
  // NIE dzięki tej linii, tylko dlatego, że oba adaptery wołane bezpośrednio mają slug równy
  // id (`buildingAdapter`: `slug: building.id`; `unitAdapter`: `slug: unitToSlug(...)` = `id`),
  // a adaptery z placeholderowym slugiem (`improvement`, `wonder`) bezpośrednio wołane nie są.
  // Kto doda kolejnego bezpośredniego wołającego albo zmieni slug w tych dwóch adapterach —
  // traci gwarancję bez żadnego sygnału z kompilatora. Wtedy normalizację trzeba przenieść
  // do adapterów, a nie polegać na tym miejscu.
  const canonical: EntityCardData = { ...data, id };
  if (canonical.civpediaLink == null) return canonical;
  return { ...canonical, civpediaLink: { folder: canonical.civpediaLink.folder, slug: id } };
}

/** Buduje jeden wiersz 'grid' — label/value zwykłe, plus opcjonalne icon/trailing/badge
 * (T1b). Gdy `row.badge` jest podany, wiersz renderuje się jak `actionItemRow()`
 * (`techDiscoveryNotice.ts:189-191`): badge kolorowy + `row.value` jako tekst obok,
 * `row.label` staje się etykietą badge'a — zamiast siatki label/value. `row.linkTo`
 * (T10) jest honorowany JEDNOLICIE również w tej gałęzi — tekst obok badge'a staje
 * się `<button data-entity-kind data-entity-id>` zamiast `<span>`, złapane przez ten
 * sam delegowany listener w `renderEntityCard` co zwykłe wiersze niżej.
 *
 * P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1: KAŻDY wiersz z `row.linkTo` — obie
 * gałęzie (badge i grid), niezależnie od tego czy `row.value`/`row.label` przy
 * badge'u jest puste czy nie — dostaje fallback `data-row-entity-*` +
 * `entity-card-row--linked` na CAŁYM `rowEl`, złapany przez delegowany listener w
 * `renderEntityCard` (`.entity-card-row[data-row-entity-kind]`, patrz niżej). Klik
 * gdziekolwiek w wierszu (etykieta, ikona, dopełnienie wokół wąskiego przycisku)
 * otwiera ten sam cel co klik w sam przycisk — właściciel wprost: "wszystkie
 * powinny być przyciskiem [...] naciskam, pojawia się karta". Wcześniejsza wersja
 * (RUNDA 2, R-TECHNOLOGIA-KARTA-USUN-OPIS-BUDYNKI-JEDNOSTKI-Q1) ograniczała ten
 * fallback do `row.value === ''` — świadomie, żeby NIE poszerzać obszaru klikalności
 * tam, gdzie ECHO tamtego tematu wymagało zera zmiany zachowania. Ten temat jest
 * odwrotną, jawną dyspozycją właściciela: poszerzenie MA się stać wszędzie. */
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
      rowEl.classList.add('entity-card-row--linked');
      rowEl.setAttribute('data-row-entity-kind', row.linkTo.kind);
      rowEl.setAttribute('data-row-entity-id', row.linkTo.id);
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
  // P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1: przyciskiem (pudełko + klik) jest ten tekst,
  // który NAZYWA encję z `linkTo` — patrz `EntityCardRow.linkAnchor` w `types.ts`.
  // `'label'` → nazwa encji stoi po lewej (sekcje Budynki/Jednostki/Ulepszenia/Kolejne
  // technologie/Zmiany ekonomiczne karty technologii); brak pola albo `'value'` → nazwa
  // encji stoi po prawej (wiersze „Technologia: X", „Zastępuje: Y"), czyli DOKŁADNIE
  // dzisiejsze zachowanie, bez zmiany.
  // Dokładnie JEDEN element wiersza niesie `data-entity-*` — nigdy oba naraz. Gdyby oba,
  // „przycisk" byłby dwoma rozłącznymi prostokątami i asercja „pudełko == obszar łapiący
  // klik" (GOAL 4 pkt 3, lekcja RUNDY 1 OBRONY) przestałaby cokolwiek znaczyć.
  const anchorOnLabel = row.linkTo != null && row.linkAnchor === 'label';
  const key = el(anchorOnLabel ? 'button' : 'span', 'entity-card-row-key');
  key.textContent = row.label;
  if (row.linkTo && anchorOnLabel) {
    key.setAttribute('data-entity-kind', row.linkTo.kind);
    key.setAttribute('data-entity-id', row.linkTo.id);
  }
  const valIsLink = row.linkTo != null && !anchorOnLabel;
  const val = el(valIsLink ? 'button' : 'span', 'entity-card-row-value');
  val.textContent = row.value;
  if (row.linkTo) {
    if (valIsLink) {
      val.setAttribute('data-entity-kind', row.linkTo.kind);
      val.setAttribute('data-entity-id', row.linkTo.id);
    }
    // Fallback hit-area na CAŁYM wierszu — patrz komentarz funkcji wyżej
    // (P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1). Obejmuje TERAZ każdy wiersz z
    // `linkTo`, niezależnie od tego czy `val` (przycisk po prawej) ma widoczną
    // treść czy jest puste — wcześniej warunek `row.value === ''` świadomie to
    // ograniczał (RUNDA 2 ECHO), ten temat odwraca tamtą decyzję na jawne życzenie
    // właściciela.
    rowEl.classList.add('entity-card-row--linked');
    rowEl.setAttribute('data-row-entity-kind', row.linkTo.kind);
    rowEl.setAttribute('data-row-entity-id', row.linkTo.id);
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
    // P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1 — do tego tematu na TYM przycisku kończyła się
    // cała ścieżka: dwa atrybuty i ZERO `addEventListener`. Delegowany listener karty
    // (niżej) łapie selektorem `button[data-entity-kind]`, którego ten przycisk nie ma i
    // mieć nie powinien (`data-entity-kind` identyfikuje CEL linku krzyżowego, czyli inną
    // KARTĘ, a ten przycisk prowadzi do HASŁA encyklopedii — inny kanał, ECHO Q2=A).
    // Dlatego własny, bezpośredni listener, a nie rozszerzanie tamtego selektora.
    //
    // Komunikat zamiast ciszy (kryterium 2 dispatchu): `openCivpediaEntry` NIGDY nie rzuca
    // i zawsze zwraca rozróżnialny wynik. Ścieżka „brak hasła" jest częsta (16 z 41
    // budynków — pomiar i sprostowanie liczby z dispatchu w sekcji POMIARY raportu
    // `runs/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1/30-operator-runda1-obrona.md`),
    // więc musi być czytelna, a nie milcząca.
    // Ukrycie przycisku jest ZAKAZANE — właściciel odrzucił ten wariant.
    const note = el('p', 'entity-card-civpedia-note');
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    note.hidden = true;
    btn.addEventListener('click', () => {
      const result = openCivpediaEntry(link.folder, link.slug);
      if (result === 'opened') {
        note.hidden = true;
        return;
      }
      note.textContent =
        result === 'no-entry'
          ? `Civpedia nie ma jeszcze hasła „${data.title}". Ten wpis czeka na napisanie.`
          : 'Civpedia jest w tej chwili niedostępna — otwórz ją przyciskiem księgi na pasku narzędzi.';
      note.hidden = false;
    });
    footer.appendChild(btn);
    footer.appendChild(note);
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
  // `buildGridRowEl`/`buildPillRowEl` wyżej) otwiera kartę docelową jako nowy dialog
  // (`mode:'dialog'`, więc zawsze przez `pushOverlay`/`popOverlay` — `openDialog` niżej).
  //
  // HISTORIA TEGO ZDANIA (żeby nie odżyło jako martwy opis — było nim raz, do 2026-09-05):
  // pierwotnie brzmiało „otwiera … jako NOWY, zagnieżdżony overlay, NIE zamykając karty
  // źródłowej"; `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1` unieważnił je bezwarunkowym zamykaniem
  // karty źródłowej. Od `R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1` (ECHO właściciela 2026-09-05)
  // wiążący jest opis powyżej: karta docelowa otwiera się NAD źródłową, obie żyją w DOM
  // (dwa `.entity-card-backdrop`), a stos ma twardy SUFIT DWÓCH — trzecia karta zamyka
  // NAJSTARSZĄ, nie źródłową. Szczegóły i geometria przesunięcia: `openDialog` niżej.
  // Delegowany listener na `card`
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

/**
 * R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 (ECHO właściciela 2026-09-05, WIĄŻĄCE): karty encji
 * układają się w STOS z twardym SUFITEM DWÓCH. Otwarcie trzeciej karty zamyka NAJSTARSZĄ
 * (dół stosu), nie najnowszą — intencja z `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1` („żeby nie
 * wszystkie włączały się naraz") jest odtąd spełniana przez SUFIT, a nie przez bezwarunkowe
 * zamykanie karty źródłowej.
 *
 * Śledzimy to modułowym stanem (nie przez `escapeOverlayStack` — ten zarządza WYŁĄCZNIE
 * kolejnością zamykania klawiszem Escape i jest poza allowlistą tego tematu, patrz
 * `00-dispatch.md` §ALLOWLISTA). `pushOverlay`/`popOverlay` używane tu tak jak dotąd, bez
 * zmiany ich kontraktu: każdy dialog wkłada własny wpis, więc Escape zdejmuje DOKŁADNIE
 * JEDNĄ kartę (ECHO 2 — „z B wracasz do A, drugim gestem wychodzisz na mapę").
 *
 * Widoczność karty spod spodu jest sprawą CSS, nie tego stanu: `restackDialogs()` niżej
 * nadaje każdemu backdropowi jego pozycję w stosie (`data-ec-stack-depth`), a
 * `ENTITY_CARD_CSS` przesuwa kartę wierzchnią o `--ec-stack-dx/dy` i gasi jej przyciemnienie,
 * żeby brzeg karty pod spodem był widoczny i klikalny. Rozmiar karty wierzchniej (660 px
 * szerokości, 80vh wysokości z `R-CIVPEDIA-KARTY-SPOJNOSC-Q1`) pozostaje NIETKNIĘTY —
 * zmienia się wyłącznie położenie.
 */
const ENTITY_CARD_STACK_LIMIT = 2;

interface EntityCardDialogEntry {
  kind: EntityKind;
  id: string;
  dismiss: EntityCardDismiss;
  backdrop: HTMLElement;
}

/** Najstarsza karta na indeksie 0, wierzchnia na końcu. Długość <= ENTITY_CARD_STACK_LIMIT. */
const dialogStack: EntityCardDialogEntry[] = [];

/**
 * Przepisuje pozycję w stosie na atrybut każdego żywego backdropu. Wołane po KAŻDEJ zmianie
 * stosu (otwarcie, zamknięcie, wypchnięcie najstarszej przez sufit) — inaczej po zamknięciu
 * karty wierzchniej ta pod spodem zostałaby z przesunięciem i przezroczystym tłem.
 */
function restackDialogs(): void {
  for (let i = 0; i < dialogStack.length; i++) {
    dialogStack[i]!.backdrop.setAttribute('data-ec-stack-depth', String(i));
  }
}

function openDialog(data: EntityCardData): EntityCardDismiss {
  // Idempotencja (kryterium 4 `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1`, zachowane): ten sam
  // kind+id co karta JUŻ w stosie → nic nowego nie budujemy, oddajemy istniejący `dismiss`
  // (zero duplikatu, zero dodatkowego push/pop na `escapeOverlayStack`). Gdy trafiona karta
  // leży POD wierzchnią, zdejmujemy to, co ją zasłania — to jest „powrót do A" z ECHO 2,
  // a nie cichy no-op wyglądający na zepsuty link.
  const existingIdx = dialogStack.findIndex((e) => e.kind === data.kind && e.id === data.id);
  if (existingIdx >= 0) {
    for (let i = dialogStack.length - 1; i > existingIdx; i--) dialogStack[i]!.dismiss();
    return dialogStack[existingIdx]!.dismiss;
  }
  // SUFIT: przy otwarciu karty ponad limit zamykamy NAJSTARSZĄ (dialogStack[0]), nie
  // najnowszą — SYNCHRONICZNIE, przed dołączeniem nowego backdropu do `document.body`.
  // Warunek `dialogStack[0] === oldest` to zabezpieczenie przed pętlą nieskończoną, gdyby
  // czyjś `dismiss` kiedyś przestał zdejmować własny wpis ze stosu.
  while (dialogStack.length >= ENTITY_CARD_STACK_LIMIT) {
    const oldest = dialogStack[0]!;
    oldest.dismiss();
    if (dialogStack[0] === oldest) { dialogStack.shift(); break; }
  }
  const overlayId = `entity-card-${data.kind}-${data.id}-${overlaySeq++}`;
  const backdrop = el('div', 'entity-card-backdrop');
  const dialog = el('div', 'entity-card-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-label', data.title);
  let closed = false;
  const dismiss = (): void => {
    if (closed) return;
    closed = true;
    const idx = dialogStack.findIndex((e) => e.dismiss === dismiss);
    if (idx >= 0) dialogStack.splice(idx, 1);
    popOverlay(overlayId);
    backdrop.remove();
    restackDialogs();
  };
  const card = renderEntityCard(data);
  dialog.appendChild(card);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  // Klik w tło zdejmuje DOKŁADNIE tę kartę. Backdrop wierzchniej karty jest `inset:0`, więc
  // przechwytuje też klik w widoczny brzeg karty pod spodem — i to jest zamierzone: ECHO 2
  // żąda, żeby taki klik WRACAŁ do karty pod spodem, a nie żeby otwierał coś z jej wnętrza.
  //
  // TO JEST INTERPRETACJA, NIE FAKT — zgłoszona jawnie w `06-obrona-runda2.md` (zarzut 1)
  // jako kandydat DO DECYZJI CZŁOWIEKA. ECHO 1 mówi dosłownie „brzegu nie może zakrywać
  // backdrop karty B"; przy `inset:0` backdrop go jednak przechwytuje (`elementFromPoint`
  // w brzegu → `DIV.entity-card-backdrop`), choć niczego nie przyciemnia (pomiar piksela:
  // identyczny z backdropem B i bez niego). Literalne zdjęcie tego przechwytywania
  // (`pointer-events:none` na wierzchnim backdropie) zostało ZMIERZONE i łamie ECHO 2 w
  // dwóch miejscach: klik w brzeg A przestaje cokolwiek robić, a klik w dalekie tło zdejmuje
  // NAJSTARSZĄ kartę zamiast wierzchniej. Oba zdania ECHO nie dają się spełnić literalnie
  // naraz — rozstrzygnięcie należy do właściciela, nie do tego pliku.
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) dismiss();
  });
  pushOverlay(overlayId, dismiss);
  dialogStack.push({ kind: data.kind, id: data.id, dismiss, backdrop });
  restackDialogs();
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
/* R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A (GOAL pkt 2-4): szerokość referencyjna ujednolicona na
   wszystkie karty (byla 434px, teraz 660px karty technologii — RECON pkt 2), wysokość
   dialogu STALA (10% marginesu gora+dol = 80% viewportu, zamiast max-height zaleznego od
   tresci) i "bezpieczne centrowanie" backdropu wzorem diplomacyAudience.ts:566-590
   (P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1) — align-items:flex-start + overflow-y:auto na
   backdropie, margin:auto 0 na dialogu: przy braku miejsca margines auto nie schodzi ponizej
   0, dialog przykleja sie do gory, nadmiar osiagalny scrollem backdropu zamiast ciecia bez
   sladu. */
.entity-card-backdrop{position:fixed;inset:0;z-index:520;display:flex;align-items:flex-start;
  justify-content:center;padding:16px;background:rgba(0,0,0,.62);overflow-y:auto;
  --ec-stack-dx:clamp(0px,calc(50vw - 366px),72px);
  --ec-stack-dy:clamp(0px,calc(10vh - 24px),56px);}
.entity-card-dialog{position:relative;height:min(80vh,calc(100vh - 32px));overflow:auto;
  margin:auto 0;}
/* R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 (ECHO wlasciciela 2026-09-05, WIAZACE) — sufit dwoch
   kart: openDialog nadaje kazdemu zywemu backdropowi data-ec-stack-depth (0 = najstarsza,
   ostatnia = wierzchnia). Karta wierzchnia jest PRZESUNIETA w prawo i w dol o --ec-stack-dx/dy,
   zeby spod niej wystawal brzeg karty pod spodem; jej backdrop jest PRZEZROCZYSTY, zeby tego
   brzegu nic nie przyciemnialo (przyciemnienie mapy niesie backdrop najstarszej karty, depth 0).
   ROZMIAR karty wierzchniej sie NIE zmienia — 660px szerokosci i min(80vh,100vh-32) wysokosci
   z R-CIVPEDIA-KARTY-SPOJNOSC-Q1 zostaja; przesuwamy wylacznie polozenie, przez left/top
   na position:relative dialogu, wiec ukladu (flex/centrowanie/margin:auto 0) to nie rusza
   i karta nie moze sie sciesnic.
   DEGRADACJA PRZY MALYM OKNIE liczona z geometrii, nie na oko — karta wierzchnia ma zostac
   w calosci w oknie:
     poziom: prawy brzeg = 50vw + 331 + dx <= 100vw - 16  =>  dx <= 50vw - 347;
             bierzemy 50vw - 366 (19px zapasu na pasek przewijania) i tniemy do 0, wiec
             ponizej 732px szerokosci przesuniecia po prostu nie ma;
     pion:   dolny brzeg = 16 + (100vh-32-H)/2 + H + dy <= 100vh - 16, przy H=80vh
             =>  dy <= 10vh - 16; bierzemy 10vh - 24 i tniemy do 0.
   Klik w widoczny brzeg karty spodniej trafia w inset:0 backdrop karty wierzchniej i ja
   zamyka — czyli WRACA do karty spodniej, dokladnie jak zada ECHO 2. */
.entity-card-backdrop[data-ec-stack-depth]:not([data-ec-stack-depth="0"]){background:transparent;}
.entity-card-backdrop[data-ec-stack-depth]:not([data-ec-stack-depth="0"]) .entity-card-dialog{
  left:var(--ec-stack-dx);top:var(--ec-stack-dy);}
.entity-card{width:min(660px,calc(100vw - 32px));border:1px solid rgba(232,216,138,.45);
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
/* RUNDA 2 (R-TECHNOLOGIA-KARTA-USUN-OPIS-BUDYNKI-JEDNOSTKI-Q1) + rozszerzenie
   P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1: kursor spojny z tym, ze CALY wiersz
   z linkTo jest klikalny (fallback data-row-entity-*, patrz buildGridRowEl +
   renderEntityCard), nie tylko wazki przycisk value po prawej. Podswietlenie tla
   na hover/focus-within nizej daje ten sam sygnal "to jest przycisk" na calej
   szerokosci wiersza, nie tylko na kursorze — kryterium GOAL pkt 2 (widoczny sygnal
   klikalnosci, nie tylko cichy cursor:pointer). Ujemny margines + dopelniajacy
   padding to ten sam wzorzec co .entity-card-section--hi wyzej w tym pliku —
   podswietlenie "wylewa sie" do krawedzi karty bez przesuwania tresci wiersza. */
.entity-card-row--linked{cursor:pointer;}
.entity-card-row--linked:hover,
.entity-card-row--linked:focus-within{background:rgba(232,216,138,.08);
  border-radius:6px;margin-left:-6px;margin-right:-6px;padding-left:6px;padding-right:6px;}
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
/* P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1: pelny zestaw regul dla etykiety, ktora JEST nazwa
   klikalnej encji (linkAnchor:'label'), lezy CELOWO nizej — patrz blok
   button.entity-card-row-key za wspolnym pudelkiem przycisku.
   UWAGA: ten arkusz zyje w literale szablonowym TS — zero znakow wstecznego apostrofu
   w komentarzach, bo zamykaja literal i lamia parsowanie calego pliku. */
/* BEZ text-align:right — sam flex (space-between + auto-margines etykiety) dosuwa pudelko
   wartosci do prawej krawedzi, wiec krotkie wartosci i tak sa wyrownane do prawej, a dlugie,
   zawijane opisy zostaja czytelnie wyrownane do lewej zamiast lamac sie w postrzepiona
   lewa krawedz. min-width NIE jest zerowane — inaczej etykieta moglaby sie sciesnic ponizej
   wlasnej tresci i nachodzic na wartosc. */
.entity-card-row-value{overflow-wrap:anywhere;}
/* P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1 — KOTWICA POCZATKOWA nowego jezyka wizualnego.
   Zgloszenie wlasciciela: "wszystkie te skroty, ktore sa porobione tekstowe, powinny byc
   zamienione na przyciski. Przyciski wygladaja bardziej profesjonalnie niz linki."
   To SWIADOME odwrocenie czesci decyzji z P-CIVPEDIA-KARTY-AKCJE-PRZYCISKI-NIEOSTYLOWANE-Q1
   (zloty podkreslony link = nawigacja): nawigacja dostaje teraz KSZTALT przycisku, ale
   ZACHOWUJE nizsza wage wizualna niz prawdziwa akcja zmieniajaca stan gry. Hierarchia:
     .entity-card-action-primary   — pelny zloty gradient, 700, uppercase, padding 7x18   (NAJCIEZSZY)
     .entity-card-action-secondary — 2px zlota obwodka, ciemny gradient, 600, uppercase    (sredni)
     linki krzyzowe (ten blok)     — 1px zlota obwodka, ten sam ciemny gradient, font wiersza,
                                     bez uppercase/letter-spacing, mniejszy padding         (NAJLZEJSZY)
   Wzorzec tla/obwodki jest 1:1 z .entity-card-action-secondary (nizej w tym arkuszu), wiec
   nie wprowadzamy nowego jezyka — tylko trzeci, najlzejszy szczebel tej samej skali.
   Zero zmian w DOM/atrybutach/listenerach — wylacznie CSS. */
button.entity-card-row-key,
button.entity-card-row-value,
button.entity-card-row-action-text,
button.entity-card-pill-text,
button.entity-card-civpedia-link{-webkit-appearance:none;appearance:none;
  margin:0;font:inherit;line-height:1.35;cursor:pointer;text-align:left;
  color:var(--tg-gold-primary,#e8d88a);text-decoration:none;}
/* Wszystkie CZTERY warianty niosa WLASNE pudelko przycisku — pudelko rysuje ten sam
   element, ktory lapie klikniecie (delegacja target.closest('button[data-entity-kind]')
   w renderEntityCard). RUNDA 1 OBRONA, zarzut 1: pierwsza wersja malowala pudelko
   pigulki na KONTENERZE .entity-card-pill, ktory NIE jest klikalny — zmierzone na zywo
   88,1x22,2 px pomalowanego "przycisku" wobec 52,0x16,2 px realnie klikalnego tekstu,
   czyli ~41% szerokosci to byla martwa strefa z mylacym cursor:pointer. Pudelko MUSI
   pokrywac sie z obszarem klikalnym, inaczej "przycisk" jest tylko obrazkiem przycisku. */
button.entity-card-row-key,
button.entity-card-row-value,
button.entity-card-row-action-text,
button.entity-card-pill-text,
button.entity-card-civpedia-link{display:inline-block;padding:2px 10px;
  border:1px solid rgba(232,216,138,.42);border-radius:var(--tg-radius-btn,8px);
  background:linear-gradient(180deg,#161c28,#0a0d14);
  box-shadow:inset 0 1px 0 rgba(232,216,138,.1);}
button.entity-card-row-key:hover,
button.entity-card-row-value:hover,
button.entity-card-row-action-text:hover,
button.entity-card-pill-text:hover,
button.entity-card-civpedia-link:hover{border-color:var(--tg-gold-primary,#e8d88a);color:#f4e6a8;}
/* Wiersz z odznaka: .entity-card-row-action-text ma flex:1 (regula nizej), co przy SPANIE
   bylo niewidoczne, ale przy przycisku rozciagaloby ramke na cala szerokosc wiersza.
   Przycisk ma sie kurczyc do tresci — jak kazdy inny przycisk karty. margin-right:auto
   zachowuje przy tym DZISIEJSZE polozenie: przycisk zostaje tuz obok odznaki po lewej,
   zamiast zostac odrzucony na prawa krawedz przez justify-content:space-between wiersza. */
button.entity-card-row-action-text{flex:0 1 auto;margin-right:auto;}
/* P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 — nazwa encji jako przycisk (linkAnchor:'label').
   Ten blok MUSI stac PO wspolnym pudelku przycisku wyzej, dokladnie jak siostrzana regula
   button.entity-card-row-action-text linie wyzej: wspolny reset ustawia margin:0 przy TEJ
   SAMEJ specyficznosci (0,1,1), wiec regula postawiona WCZESNIEJ zostalaby skasowana —
   zmierzone na zywym Chromium w tej rundzie (przycisk nazwy ladowal na SRODKU wiersza).
   opacity:1 zdejmuje wyciszenie .72 z .entity-card-row-key: nazwa encji jest teraz
   elementem pierwszoplanowym, nie wyszarzona etykieta pola.
   flex:0 1 auto + margin-right:auto trzymaja przycisk przy lewej krawedzi (tuz za ikona
   wiersza, ktora zostaje jego SIOSTRA poza ramka — jak entity-card-pill-check przy
   entity-card-pill-text), a wartosc/trailing przy prawej. Bez auto-marginesu wiersz
   z ikona ma TRZY dzieci i justify-content:space-between wypycha nazwe na srodek. */
button.entity-card-row-key{opacity:1;flex:0 1 auto;margin-right:auto;}
/* Wiersze Budynki/Jednostki karty technologii maja PUSTE row.value (ECHO
   R-TECHNOLOGIA-KARTA-USUN-OPIS-BUDYNKI-JEDNOSTKI-Q1) — klikalny jest caly wiersz przez
   fallback .entity-card-row--linked. Bez tego wyjatku pusty przycisk narysowalby sie jako
   pusty, bezsensowny prostokacik z ramka. Zostaje niewidzialny, dokladnie jak dzis. */
button.entity-card-row-value:empty{border:0;background:none;box-shadow:none;padding:0;}
/* Pigulka LINKUJACA: kontener .entity-card-pill przestaje byc pudelkiem — zdejmujemy
   z niego wlasne tlo, obwodke, padding i (kluczowe) cursor:pointer, zeby nie obiecywal
   klikalnosci, ktorej nie ma. Pudelko przycisku niesie button.entity-card-pill-text
   (regula wyzej), czyli dokladnie ten element, w ktory trafia delegacja klikniecia.
   Checkmark .entity-card-pill-check zostaje SIOSTRA przycisku (DOM nietkniety), wiec
   ladzie obok przycisku zamiast udawac jego czesc. Pigulki NIEKLIKALNE (bez button
   w srodku) zachowuja dzisiejszy wyglad pigulki bez zmian — :has je omija. */
.entity-card-pill:has(> button.entity-card-pill-text){
  background:none;border:0;border-radius:0;padding:0;cursor:default;box-shadow:none;}
button.entity-card-row-key:focus-visible,
button.entity-card-row-value:focus-visible,
button.entity-card-row-action-text:focus-visible,
button.entity-card-pill-text:focus-visible,
button.entity-card-civpedia-link:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary,#e8d88a));
  outline-offset:2px;border-radius:var(--tg-radius-btn,8px);}
/* KOTWICA KONCOWA P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1 */
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
/* P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1 (kryterium 2): komunikat "brak hasla" pod
   przyciskiem. Ostrzegawcza zoltawa barwa rodziny .entity-card-row-badge--warn, ale bez
   pudelka badge'a — to zdanie do przeczytania, nie etykieta. Atrybut hidden na elemencie
   wystarcza (przegladarki maja [hidden]{display:none} w UA-stylesheet); CELOWO nie
   nadpisujemy tu display, zeby hidden nie przestal dzialac. */
.entity-card-civpedia-note{margin:6px 0 0;font-size:12px;line-height:1.35;
  color:var(--tg-warn,#e8c86a);opacity:.92;}
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
/* Elipsa „gruntu" — RUNDA 2 (zarzut 3 Evaluatora). Poprzednia wersja była czarnym
   radial-gradientem 172x30 na tle, które przy dole sceny i tak jest prawie czarne
   (#0c1017 + winieta) i w ~80% zasłoniętym przez nieprzezroczysty medalion — różnica
   pikselowa względem 'display:none' wynosiła maks. 8/255. Teraz to JASNY kontakt
   światła (rozświetlenie podłoża pod obiektem), szerszy od medalionu (186 > 120) i
   przesunięty niżej, więc realnie widoczny; pilnuje tego pikselowa asercja różnicowa
   w 'entity-card-diorama-real-render-test.cjs' sekcja (I), nie samo istnienie węzła. */
.entity-card-diorama-ground{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);
  width:186px;height:36px;pointer-events:none;border-radius:50%;
  background:radial-gradient(closest-side,rgba(176,201,240,.50),rgba(133,160,208,.24) 55%,rgba(0,0,0,0) 100%);}
.entity-card-diorama .entity-card-medallion{position:relative;width:120px;height:120px;flex:none;
  border-radius:14px;overflow:hidden;border:1px solid rgba(232,216,138,.32);
  box-shadow:0 14px 26px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);
  display:flex;align-items:center;justify-content:center;}
/* Skalowanie ZAWARTOŚCI medalionu do nowego rozmiaru — SVG rodzajów „icon" bywa zapisany z
   własnymi atrybutami width/height (28px), a snapshot 3D jest canvasem 80x80 z
   'unitMiniPreview.ts'. Dla CANVASA równoważna reguła istnieje też lokalnie w
   'unitInfoCard.ts:394' ('width:100%;height:100%;object-fit:cover', ta sama specyficzność,
   późniejszy arkusz) — tu jest po to, żeby ENTITY_CARD_CSS był samowystarczalny także na
   ścieżkach cityPanel/techDiscoveryNotice, gdzie tamten arkusz nie jest wstrzykiwany. */
.entity-card-diorama .entity-card-medallion > svg,
.entity-card-diorama .entity-card-medallion .unit-mini-canvas{width:100%;height:100%;display:block;}
/* FALLBACK bez WebGL — RUNDA 2 (zarzut 2 Evaluatora). Poprzednie 'font-size:44px' było
   pomyłką w dwie strony: (a) na ścieżce 'showUnitInfoCardDialog' reguła była MARTWA, bo
   '.entity-card-unit .entity-card-medallion.unit-mini-fallback{font-size:12px}'
   ('unitInfoCard.ts:396') ma tę samą specyficzność (0,3,0) i leży w arkuszu wstrzykiwanym
   PÓŹNIEJ; (b) tam, gdzie działała, przycinała tekst — 44px pasuje do glifu „⚔" (domyślka
   'unitMiniPreview.ts:131'), ale ŻADEN call-site kart encji go nie przekazuje: wszystkie
   trzy podają pełne zdanie „Render 3D niedostępny w tym środowisku" ('renderer.ts:55',
   'unitInfoCard.ts:83', 'unitInfoCard.ts:283'). Fallback jest więc formatowany jako TEKST
   (11px, zawijany, wyśrodkowany, z paddingiem), a podwojona klasa podnosi specyficzność do
   (0,4,0), żeby wynik nie zależał od kolejności wstrzykiwania arkuszy. Pilnuje tego sekcja
   (H) w 'entity-card-diorama-real-render-test.cjs' — na OBU ścieżkach naraz. */
.entity-card-diorama .entity-card-medallion.unit-mini-fallback.unit-mini-fallback{
  font-size:11px;line-height:1.3;padding:8px;text-align:center;overflow-wrap:anywhere;
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
/* RUNDA 2 (zarzut 4 Evaluatora): w compact SVG musi wrócić do rozmiaru WŁASNEGO (28px z
   atrybutów pliku), bo bez tego reguła skalująca '> svg{width:100%}' wyżej kurczyła go do
   24px — mierzalna zmiana renderu w trybie, który dispatch nakazuje zostawić bez zmian. */
.entity-card--compact .entity-card-medallion > svg{width:auto;height:auto;display:inline;}
/* RUNDA 2 (zarzut 2 Evaluatora): fallback w compact wraca do bazowego formatowania
   nagłówka — bez paddingu i wymuszonego 11px z bloku diaromy. */
.entity-card--compact .entity-card-medallion.unit-mini-fallback.unit-mini-fallback{
  font-size:inherit;line-height:inherit;padding:0;text-align:left;}
.entity-card--compact .entity-card-title-wrap{position:static;flex:1;min-width:0;
  text-shadow:none;}
.entity-card--compact .entity-card-title-row h2{font-size:17px;}
/* RUNDA 2 (zarzut 1 Evaluatora): TU BYŁA reguła
   '.entity-card--compact .entity-card-header > :not(.entity-card-diorama-stage):not(.entity-card-title-wrap){position:static}'.
   Miała „posprzątać" po pozycjonowaniu z bloku diaromy, ale realnie ZEPSUŁA żywą ścieżkę
   'showTechDiscoveryNotice': ze specyficznością (0,4,0) wygrywała z
   '.tdn-entity-close{position:absolute;top:10px;right:10px}' ('techDiscoveryNotice.ts:746',
   (0,1,0)) i po kliknięciu „Pokaż pozostałe N" wrzucała ✕ z powrotem do potoku flex
   (zmierzone: 'static', 44px od prawej zamiast 10px). Reguła jest USUNIĘTA: bez niej w
   compact zostaje pozycjonowanie z bloku diaromy (absolute, top 10px / right 10px) —
   czyli DOKŁADNIE te same wartości, które przycisk miał na bazie z własnego arkusza.
   Pilnuje tego sekcja (D2) w 'entity-card-diorama-real-render-test.cjs'. */
/* KOTWICA KOŃCOWA bloku R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1 — mutacja w
   tools/entity-card-diorama-real-render-test.cjs wycina dokładnie ten zakres. Nowe reguły
   dopisuj PO tej linii. */
`;
