# Plan architektury: wspólny kontrakt karty encji (R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, ECHO=B/A/B/C)

Zweryfikowałem recon względem kodu: `gra/src/ui/unitInfoCard.ts` (297 linii, całość), `techDiscoveryNotice.ts` (552 linie, całość), `cityPanel.ts` (fragmenty 6780–7400: `techIconHintSpan`, `appendTechDetailBlock`, `buildBuildingDetailCard`, `buildBuildingBuildTabDetailCard`, `buildUnitDetailCard`, `attachUnitRowThumb`), `wikiHubHud.ts` (całość), `bundle-wiki-for-game.cjs` (całość), plus realne JSON-y (`gra/data/buildings.json`, `units.json`, `tech.json`, `terrain-improvements.json` — uwaga: NIE `gra/src/data/*.json`, tam jest tylko `wikiBundle.json`), i wywołania w `scienceHubHud.ts`/`techTreeView.ts`. Recon się potwierdził punkt po punkcie; poniżej dodaję szczegóły, których recon nie miał w zakresie (istniejący `slugify`/`techToSlug` w `sciencePicker.ts`, `slugifyImprovementLabel` w `research.ts`, realny mechanizm 3D-preview, rozjazd slugów CivPedia↔JSON).

---

## 1. Kształt wspólnego kontraktu

```ts
// gra/src/ui/entityCards/types.ts
export type EntityKind = 'unit' | 'building' | 'technology' | 'improvement';

interface EntityCardData {
  kind: EntityKind;
  id: string;                 // patrz pkt 2 — kanoniczny EntityId per kind
  title: string;               // nazwa / Jednostka / Technologia / nazwa (improvement)
  subtitle?: string;            // epoka · typ · kategoria
  medallion:
    | { kind: 'icon'; svg: string }
    | { kind: 'unit3d'; mount: (slot: HTMLElement) => void };  // patrz pkt 7.1
  sections: EntityCardSection[];
  civpediaLink?: { folder: string; slug: string } | null;   // ECHO Q2=A — kanał 2, nie scalanie
  statusBadges?: string[];
  actions?: Array<{ id: string; label: string; kind: 'primary' | 'secondary'; onClick: () => void }>;
}

interface EntityCardSection {
  key: string;                 // 'combat' | 'economy' | 'requirements' | 'unlocks' | ...
  title: string;
  rows: Array<{ label: string; value: string; emphasize?: boolean; linkTo?: { kind: EntityKind; id: string } }>;
  badges?: string[];
  collapsible?: boolean; openDefault?: boolean;   // potrzebne dla akordeonów tech-karty
}

// Rozdział "zbierz dane" od "zbuduj DOM" — dziś te dwie rzeczy są zlepione w każdej
// z 3 implementacji. To jest SEDNO refaktoru (ECHO Q1=B), nie kosmetyka.
function buildEntityCardData(kind: EntityKind, id: string, ctx: EntityCardCtx): EntityCardData | null;
function renderEntityCard(data: EntityCardData): HTMLElement;               // jeden DOM-builder dla 4 kinds
function openEntityCard(kind: EntityKind, id: string, opts?: {
  mode?: 'dialog' | 'inline' | 'hover';   // dialog=backdrop+overlay-stack; inline=append do kontenera (cityPanel); hover=attachHoverDetail-style
  container?: HTMLElement;                 // wymagane dla 'inline'
  ctx?: EntityCardCtx;                     // GameData + stan gracza (unlockedTechs, city, ownerId...)
  onOpenTree?: () => void; onStartResearch?: () => void;  // przekazywane 1:1 do adaptera tech (kompatybilność wsteczna)
}): () => void;   // dismiss()
```

`ctx: EntityCardCtx` niesie `GameData` (jak dziś) plus opcjonalny stan zależny od gracza (`unlockedTechs`, `city`, `ownerId`) — to jest to, co dziś `buildBuildingBuildTabDetailCard`/`buildUnitDetailCard` dostają jako osobne argumenty; w kontrakcie schodzi do jednego pola, żeby adaptery miały jeden kształt wejścia.

Każdy z 4 kinds dostaje **adapter** (`entityCards/unitAdapter.ts`, `buildingAdapter.ts`, `technologyAdapter.ts`, `improvementAdapter.ts`) — funkcja `raw row → EntityCardData`, analogiczna do dzisiejszych `buildXDetailCard`, ale zwracająca dane, nie DOM. Jeden `renderer.ts` buduje DOM/CSS dla wszystkich czterech. To jest realny, konkretny kształt „B" z ECHO — nie ogólny wzorzec z podręcznika, tylko rozbicie DOKŁADNIE tych czterech dzisiejszych funkcji na warstwę danych + jedną warstwę renderowania.

---

## 2. Mapowanie 4 źródeł na jeden EntityId — bez przepisywania JSON-ów

Zweryfikowane schematy (`gra/data/*.json`, realne, nie `gra/src/data/*.json`):

| kind | plik | pole identyfikujące dziś | EntityId |
|---|---|---|---|
| building | `buildings.json` | `id` (slug, już istnieje) | `def.id` wprost |
| improvement | `terrain-improvements.json` | klucz obiektu = `ImprovementKey` | klucz wprost |
| technology | `tech.json` | `Technologia` (polska nazwa, BRAK osobnego id) | `techToSlug(row.Technologia)` |
| unit | `units.json` | `Jednostka` (polska nazwa, BRAK osobnego id) | **nowe** `unitToSlug(row.Jednostka)` |

Kluczowe znalezisko: **`techToSlug`/`techNameFromSlug` już istnieją i są wyeksportowane** w `gra/src/ui/sciencePicker.ts:196-210`, używane dziś do budowy drzewka technologii (`slugify()` prywatne w tym pliku, linia 99). Osobno `gra/src/game/research.ts:199` ma `slugifyImprovementLabel()` — inny algorytm (jawna tabela `PL_DIACRITICS`) zamiast NFD-strip z `sciencePicker.ts`. To są **dwie niezależne implementacje tej samej idei już dziś w repo** — konsolidacja do jednego `slugify()` w nowym `gra/src/ui/entityCards/slug.ts` jest częścią tego zadania, ale wymaga **weryfikacji, że oba algorytmy dają identyczny wynik na realnych polskich nazwach** (ą/ć/ę/ł/ń/ó/ś/ź/ż) przed podmianą — inaczej cichy dryf slugów gdzieś, gdzie coś już na nich polega (np. `research.ts` gating budowy ulepszeń).

Dla jednostek nie ma dziś ŻADNEGO sluga — `unitToSlug` to nowa, mała funkcja, ale reużywająca ten sam skonsolidowany `slugify()`, z analogicznym cache `Map<slug, UnitDef>` budowanym raz przy starcie (dokładnie wzorzec `TECH_MAP` z `sciencePicker.ts:193`).

Resolver (`id → surowy wiersz`) jest per-kind, cienki:
- building: `data.buildings.find(b => b.id === id)`
- improvement: `(terrainImprovementsData as Record<string, Row>)[id]`
- technology: **reużyj** istniejący `TECH_MAP`/`techNameFromSlug` z `sciencePicker.ts` zamiast go duplikować
- unit: nowa `Map<slug, UnitDef>`, ten sam wzorzec

Zero zmian w JSON-ach — identyfikator jest wyłącznie pochodną, liczoną w runtime.

---

## 3. Plan migracji trzech działających kart — kolejność i ryzyka

**Zasada nadrzędna**: publiczne eksporty (`buildUnitInfoCard`, `showUnitInfoCardDialog`, `showTechDiscoveryNotice`, `buildBuildingDetailCard`, `buildUnitDetailCard`...) **zachowują dotychczasowe sygnatury**. Wołający (`main.ts:18799`, `scienceHubHud.ts`, `techTreeView.ts`, `attachUnitRowThumb`/`appendBuildableItemRow` w `cityPanel.ts`) dostają zero zmian — zmienia się tylko WNĘTRZE tych funkcji (budują `EntityCardData` przez adapter, renderują przez wspólny `renderer.ts`).

**Kolejność (bezpieczeństwo > szybkość, zgodnie z wnioskami ECHO):**

1. **Fundament** — nowe pliki `entityCards/**`, zero edycji istniejących kart. Zero ryzyka regresji (nic jeszcze go nie woła).
2. **Technologia** jako pierwsza migrowana karta. Dlaczego pierwsza: to dziś NAJBARDZIEJ zduplikowana treść (3 reimplementacje wg recon), a jej 3 wywołujący (`scienceHubHud.ts:283-285`, `:454-457`, `:625-632`, `techTreeView.ts:939-944`) przekazują niemal identyczny zestaw opcji (`kind`, `onStartResearch`, `onOpenTree`) — to najmniejsza, najlepiej zrozumiana powierzchnia integracji, i jest to modal (`mode:'dialog'`) — czyli najprostszy z trybów renderera do zwalidować jako pierwszy.
   **Świadomie NIE ruszać w tym kroku**: `appendTechDetailBlock` w `cityPanel.ts:6907` (czwarta, wbudowana reimplementacja treści tech wewnątrz karty budynku/jednostki) — zostaje jak jest, ewentualnie zaczyna czytać dane z nowego `technologyAdapter.ts` (współdzielone dane), ale nadal renderuje własnymi `gridDetailRow`, nie generycznym rendererem. Migracja tego miejsca to osobny temat (T10, pkt 6).
3. **Jednostka (mapa)** — `unitInfoCard.ts` → `unitAdapter.ts` + renderer w trybie `dialog`. Najwyższe ryzyko regresji w tej karcie: 3D-podgląd. Zweryfikowałem realny mechanizm (`unitMiniPreview.ts`, `render/units.ts`) — mocowanie 3D **nie jest** generycznym skanem hooków z `main.ts`, tylko imperatywnym wywołaniem `mountUnitMiniPreview(previewEl, unit, ownerColor, fallbackMsg)` bezpośrednio po `appendChild` sekcji (`unitInfoCard.ts:150-162`). To upraszcza migrację: wariant medalionu `{kind:'unit3d', mount}` w kontrakcie z pkt 1 dokładnie odwzorowuje ten wzorzec — renderer po zamontowaniu sekcji w DOM wywołuje `medallion.mount(slotEl)`, identycznie jak dziś. Ryzyko nie znika, tylko jest dokładnie zlokalizowane: renderer MUSI wywołać mount PO faktycznym `appendChild`, nie wcześniej (jak dziś, `unitInfoCard.ts:151-162`).
4. **Budynek w panelu miasta** — `buildBuildingDetailCard`/`buildBuildingBuildTabDetailCard` → `buildingAdapter.ts` + renderer w NOWYM trybie `inline`/`hover` (pierwszy raz w tym miejscu wspólny renderer musi obsłużyć doczepianie do `attachHoverDetail(row, () => ..., 220, 'left')` zamiast backdropu). Niższe ryzyko niż jednostka, bo nie ma dziś konkurencyjnej drugiej implementacji karty budynku.
5. **Jednostka w panelu miasta** (`buildUnitDetailCard`, `cityPanel.ts:7225`) → **ten sam** `unitAdapter.ts` z kroku 3, renderowany w trybie `inline`. To jest krok, który realnie spełnia obietnicę „jeden renderer" — dziś to DWIE różne implementacje tej samej jednostki (mapa: 3D+kontry; rekrutacja: bez 3D, inne pola). Tu jest **największe ryzyko widocznej zmiany** dla gracza: któraś strona ma pola, których druga nie ma (np. „Kontry" jest tylko w `unitInfoCard.ts:190`, w `buildUnitDetailCard` go nie ma wcale). Zabezpieczenie: przed scaleniem sporządzić jawną tabelę wiersz-po-wierszu „co pokazuje karta A / karta B / co pokaże karta wspólna" — to ma być artefakt Evaluatora tego kroku, nie „wygląda podobnie".

**Ogólne zabezpieczenie migracji (keep-old-path-as-fallback)**: każdy krok 2–5 zostawia starą funkcję pod prywatną nazwą (`_legacyBuildX`) osiągalną awaryjnie, dopóki Final Control danego kroku nie potwierdzi parytetu — pozwala wycofać JEDEN kind bez rewertowania całego tematu. Kolejność testów: uruchomić bramki z `R-PROC-AUTOBOT.md §Bramki` PRZED dotknięciem każdej karty (baseline), potem PO KAŻDYM pojedynczym kroku migracji z osobna — nie batchować 2–5 i testować raz na końcu, bo wtedy regresja w adapterze technologii chowa się pod migracją jednostki.

---

## 4. Nowa karta ulepszeń terenu — 3 miejsca wywołania (ECHO Q4=C)

`improvementAdapter.ts`, budowany od razu na kontrakcie (nie ma dziś czego migrować):

- **Popup odkrycia technologii** (`techDiscoveryNotice.ts:391-398`, sekcja „Ulepszenia terenu", `improvementsSection`) — dziś `unlockItemRow()` renderuje statyczny wiersz. Zmiana: owinąć w `<button data-entity-kind="improvement" data-entity-id="...">`, delegowany listener obok istniejących w `wireInteractions(host)` (`techDiscoveryNotice.ts:449-473`), wołający `openEntityCard('improvement', key, {mode:'dialog'})`.
- **Tryb budowy** (`buildModeHud.ts`) — istniejące wiersze typu ulepszenia mają `data-key` i klik = wybór typu do budowy (linie ok. 548-574 wg grep). **Realne ryzyko**: nie wolno przeciążać tego klika kartą — trzeba rozdzielić strefy klikania dokładnie tak jak w Pytaniu 3 (osobna, zawsze widoczna ikonka „ⓘ" obok, niezależna od wyboru typu), inaczej gracz przypadkiem otwiera kartę zamiast wybierać budowę.
- **Panel miasta** — tu recon NIE potwierdza istnienia dziś żadnej listy „ulepszenia na tym polu/w tym mieście" w `cityPanel.ts` (w przeciwieństwie do budynków/jednostek, które mają jasno zlokalizowane listy). **To jest luka do domknięcia reconem, nie założeniem** — pierwszy pod-krok tematu T7 (pkt 6) musi zlokalizować lub potwierdzić brak takiej listy, zanim ktokolwiek zacznie kodować trzecie miejsce wywołania — inaczej ryzyko wymyślenia powierzchni UI, która nie istnieje / koliduje z czymś planowanym gdzie indziej.

---

## 5. Linkowanie do CivPedii z każdej z 4 kart (ECHO Q2=A — dwa kanały obok siebie)

`EntityCardData.civpediaLink: {folder, slug} | null`. Renderer dokleja jeden wiersz/przycisk „Więcej informacji (Civpedia)" — NIE scala treści.

Zweryfikowałem realny rozjazd slugów, który recon pominął — to jest konkretne ryzyko techniczne tego punktu:

- **Budynki**: `buildings.json[].id` == nazwa pliku w `docs/encyklopedia/budynki/*.md` **1:1** (sprawdzone: `stolarnia`, `kamieniarski`, `kuznia` itd. — wszystkie się zgadzają). Prosty przypadek.
- **Ulepszenia**: **NIE 1:1**. `terrain-improvements.json` ma osobne klucze `kopalnia_miedzi`, `kopalnia_zelaza`, `kopalnia_cyny`, `kopalnia_zlota`, ale w CivPedii jest jeden wspólny plik `kopalnia.md` — mapowanie jest wiele-do-jednego.
- **Jednostki**: pliki w `docs/encyklopedia/jednostki/*.md` używają innej konwencji nazewniczej (kebab-case z myślnikami, np. `berserker-germanski.md`) niż pole `Jednostka` (`"Wojownik"`, `"Hieros Lochos (Święty Zastęp)"`) — sam `slugify()` z pkt 2 tego NIE rozwiąże bezpośrednio bez sprawdzenia każdego przypadku.
- **Technologie**: kategoria w CivPedii **nie istnieje wcale** (potwierdzone: brak folderu `technologie` w `docs/encyklopedia/`).

**Projekt mostka**: zamiast czystego derywowanego sluga, rozszerzyć `bundle-wiki-for-game.cjs` o odczyt opcjonalnego pola frontmatter (ten sam wzorzec co już istniejące `metaField(md, 'kategoria')`, np. nowa linia `| gra-id | kopalnia_miedzi, kopalnia_zelaza, kopalnia_cyny, kopalnia_zlota |`), `EncyEntry` zyskuje `gameIds: string[]`. Rozwiązanie: `civpediaLink` = `ENCY.find(e => e.folder===folder && e.gameIds.includes(id))`, z fallbackiem na `e.slug === id` (pokrywa większość budynków/ulepszeń bez żadnej zmiany treści — tylko rozbieżne wpisy: warianty kopalni, wszystkie jednostki, przyszłe technologie, potrzebują dopisania linii `gra-id` przez autora treści).

Otwieranie: `openEncy()` w `wikiHubHud.ts:280` jest dziś prywatnym domknięciem wewnątrz `createWikiHubHud` — trzeba dodać `openEncyEntry(folder, slug)` do publicznego `WikiHubHudApi` (`wikiHubHud.ts:26-33`), mała, addytywna zmiana, nie przepisywanie.

---

## 6. Podział na tematy AutoBot (kolejność bezpiecznej migracji)

| # | Temat | Zakres plików (allowlist) | Kryterium ukończenia | Zależność |
|---|---|---|---|---|
| T1 | KONTRAKT-KARTA-ENCJI | nowe: `entityCards/{types,renderer,slug,registry}.ts` | Typy się kompilują; renderer ma fixture'y dla 4 kinds w trybie `dialog`, żadna istniejąca karta go jeszcze nie woła | brak |
| T2 | HUB-BADAN-INFO-IKONA (Pytanie 3) | `scienceHubHud.ts`, `techTreeView.ts` | Klik całego wiersza działa jak dziś; osobna, zawsze widoczna ikonka „ⓘ" otwiera tę samą (starą) `showTechDiscoveryNotice` | brak — równolegle z T1 |
| T3 | MIGRACJA-KARTA-TECHNOLOGII | `techDiscoveryNotice.ts` + nowy `technologyAdapter.ts` | 3 dotychczasowi wołający bez zmian; wizualny diff dla technologii wczesnej/środkowej/późnej (0/1/wiele odblokowań) — treść równoważna | T1 |
| T4 | MIGRACJA-KARTA-JEDNOSTKI-MAPA | `unitInfoCard.ts` + nowy `unitAdapter.ts` | `main.ts:18799` bez zmian; 3D-podgląd nadal się montuje (weryfikacja przez skill `run`, realny klik na mapie); parytet wierszy udokumentowany | T1, T3 (dialog mode już sprawdzony) |
| T5 | MIGRACJA-KARTA-BUDYNKU-PANEL-MIASTA | `cityPanel.ts` (tylko `buildBuildingDetailCard`/`buildBuildingBuildTabDetailCard`), `entityCards/renderer.ts` (rozszerzenie o tryb `inline`/`hover`), nowy `buildingAdapter.ts` | Hover-preview w zakładce Budowa i liście posiadanych budynków wizualnie równoważny; brak zauważalnego opóźnienia hover | T1, T4 |
| T6 | MIGRACJA-KARTA-JEDNOSTKI-PANEL-MIASTA | `cityPanel.ts` (`buildUnitDetailCard`, `attachUnitRowThumb`), `unitAdapter.ts` (rozszerzenie o pola specyficzne dla rekrutacji, jeśli brakuje) | Jawna tabela wiersz-po-wierszu (karta mapy vs karta rekrutacji vs karta wspólna) zrecenzowana przez Evaluatora; obie strony pokazują dziś-równoważną treść | T5 |
| T7a | RECON-LISTA-ULEPSZEN-PANEL-MIASTA | tylko odczyt | Potwierdzenie istnienia/braku listy ulepszeń w `cityPanel.ts`; jeśli brak — ABC do właściciela o docelowym miejscu | brak |
| T7b | KARTA-ULEPSZENIA-TERENU | `techDiscoveryNotice.ts` (klikalne wiersze), `buildModeHud.ts` (osobna ikonka „ⓘ", NIE nadpisuje wyboru typu), `cityPanel.ts` (wg T7a), nowy `improvementAdapter.ts` | Wszystkie 3 miejsca otwierają tę samą kartę; klik wyboru typu w trybie budowy działa jak dziś | T1, T7a |
| T8 | CIVPEDIA-KATEGORIA-TECHNOLOGIE | `bundle-wiki-for-game.cjs` (`CAT_LABELS`), `docs/encyklopedia/technologie/**` (treść), `gra/src/data/wikiBundle.json` (regenerowany, nie ręcznie edytowany) | `node gra/tools/bundle-wiki-for-game.cjs` przechodzi czysto; nowa kategoria widoczna w CivPedii | brak (niezależny od refaktoru kart) |
| T9 | CIVPEDIA-MOSTEK-GRA-ID | `bundle-wiki-for-game.cjs` (nowe pole `gra-id`), `wikiHubHud.ts` (`EncyEntry.gameIds`, `api.openEncyEntry`), frontmatter TYLKO w plikach wymagających ujednoznacznienia (warianty kopalni, jednostki, technologie), `wikiBundle.json` (regenerowany) | Dla próbki niejednoznacznych wpisów (`kopalnia_miedzi` itd.) `civpediaLink` trafia do właściwego jednego wpisu | T8 |
| T10 | LINKOWANIE-KRZYZOWE 4×4 | wszystkie 4 adaptery, `cityPanel.ts` (`techIconHintSpan` — dziś martwy, `appendTechDetailBlock`), `entityCards/renderer.ts` (typ wiersza „linkowalny") | Klik na dowolną nazwaną encję gdziekolwiek otwiera właściwą kartę; stos Esc/overlay działa poprawnie przy 2+ zagnieżdżonych kartach | T4–T7b, T9 |

Kolejność bezpieczna: T1 → T2 (równolegle) → T3 → T4 → T5 → T6 → T7a→T7b → T8 → T9 → T10.

---

## 7. Realne ryzyka regresji i zabezpieczenia

1. **3D-podgląd jednostki** (`unitInfoCard.ts`, `mountUnitMiniPreview`). Zweryfikowany mechanizm: montowanie jest imperatywne, wywoływane BEZPOŚREDNIO po `appendChild` slotu (`unitInfoCard.ts:150-162`), nie generyczny skan hooków z `main.ts`. Zabezpieczenie: wariant `{kind:'unit3d', mount}` w kontrakcie musi być wywołany przez renderer w tym samym miejscu w cyklu życia DOM (po appendChild, nie przed) — inaczej Three.js dostaje odłączony element i podgląd milknie bez błędu w konsoli.
2. **Świadome decyzje produktowe wbudowane w kod technologii** — nagłówek `techDiscoveryNotice.ts:1-44` dokumentuje 5 jawnych odstępstw od makiety (pominięty pasek „Efekt", filtrowanie `Uwagi` deweloperskich przez `isDevOnlyPlayerText`/`playerFacingNote`, brak trybu „podgląd" w niektórych wywołaniach, celowy brak przycisku „Otwórz hub badań"). Generyczny adapter MUSI reużyć `playerFacingNote()`/`isDevOnlyPlayerText()` dla WSZYSTKICH 4 kinds (nie tylko tech), inaczej te decyzje cicho znikają przy migracji.
3. **Dwie dziś rozjeżdżające się karty jednostki** (T6, pkt 3 wyżej) — to jest zarazem cel refaktoru i jego największe widoczne ryzyko: pola obecne w jednej, nieobecne w drugiej (np. „Kontry" tylko w `unitInfoCard.ts:190`).
4. **Wydajność hover-preview** — `attachHoverDetail(row, () => buildXDetailCard(...), 220, 'left')` montuje kartę na każdy hover w listach z wieloma wierszami (posiadane budynki, budowa, rekrutacja). Cięższa warstwa abstrakcji (adapter+renderer zamiast bezpośredniego DOM-buildera) ryzykuje zauważalny lag. Zabezpieczenie: adaptery mają być czysto-danowe (bez I/O, bez ciężkich obliczeń), koszt renderowania DOM płacony raz na hover jak dziś — zmierzyć realny czas przed/po na zapisie z dużą liczbą zbudowanych budynków, nie tylko sprawdzić poprawność.
5. **Zagnieżdżone karty / stos Esc.** `appendTechDetailBlock` (wbudowany w kartę budynku/jednostki) po T10 ma linkować do pełnej karty technologii jako OSOBNY overlay — trzeba upewnić się, że każde nowe wywołanie `openEntityCard(..., {mode:'dialog'})` korzysta z `pushOverlay`/`popOverlay` (`escapeOverlayStack.ts`) dokładnie jak dziś wszystkie trzy karty, inaczej Esc/klik-w-tło przestaje poprawnie zamykać zagnieżdżone karty.
6. **Artefakt generowany a allowlista dokumentacyjna.** CLAUDE.md zabrania zmian w `gra/`-zależnych artefaktach przy paczce dokumentacyjnej — T8/T9 dotykają `bundle-wiki-for-game.cjs` i muszą w TYM SAMYM commicie zregenerować `gra/src/data/wikiBundle.json` (nigdy ręcznie edytować), inaczej diff wygląda na paczkę dokumentacyjną, a realnie zmienia artefakt zależny od `gra/`.
7. **Fallback / feature-flag.** Każdy z kroków T3–T7b zostawia starą implementację pod prywatną nazwą (`_legacyBuildX`) do czasu potwierdzenia parytetu przez Evaluatora danego kroku — pozwala wycofać jeden kind bez revertu całego tematu. Wzorując się na stylu już obecnym w `techDiscoveryNotice.ts` (blok „świadome odstępstwa... PYTANIE DO EVALUATORA"), każda migracja adaptera ma zostawić analogiczny komentarz z listą pominiętych/przemianowanych pól — Evaluator dostaje checklistę zamiast gołego diffu do oceny na oko.
