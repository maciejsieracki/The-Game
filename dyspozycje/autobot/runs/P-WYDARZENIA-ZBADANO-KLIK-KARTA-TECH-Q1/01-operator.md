# 01-operator — P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1

STATUS: PASS
DOMAIN: GAME
TEMAT: P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1
MODEL+EFFORT: Opus 5, effort high
RUNDY: 1/5
BAZA: `origin/main` w SHA `0ad2c20a` (SHA z dispatchu; jest przodkiem dzisiejszego
`origin/main`=`8d0eafac`, którego jedyne zmiany w `gra/` to dwa równoległe tematy w
rejonach `main.ts` ~`:913` i ~`:19352` — poza moimi rejonami).

## 1. DIAGNOZA (A) — czym JEST karta „Zbadano: <tech>"

**ODPOWIEDŹ: to NIE jest dedykowany `SidePanelEvent`. To generyczny hint końca tury
(`eot-hint-<tura>-<i>`) z `showHintMessage`.** Karta MA `data-id` i technicznie jest
w zasięgu `onEventClick`, ale jej id nie niesie ŻADNEGO identyfikatora technologii,
więc żadna gałąź `onEventClick` jej nie obsługuje — klik jest no-opem.

Łańcuch, ze ścieżkami i numerami linii (baza `0ad2c20a`):

| # | Miejsce | Co robi |
|---|---|---|
| 1 | `gra/src/main.ts:26193` | `let msg = doneIconHtml + 'Zbadano: ' + done.id + ' (-' + done.koszt + ' nauki)'` |
| 2 | `gra/src/main.ts:26195` | `if (!eraAdvanced) showHintMessage(msg, 3500)` — **jedyne** wyjście tego komunikatu |
| 3 | `gra/src/main.ts:12118-12122` | `showHintMessage` → `if (shouldDeferEotEvents(endTurnInProgress)) { deferredEotHints.push({msg, durationMs}); return; }` — w fazie EOT komunikat NIE jest toastem, tylko wchodzi do generycznej kolejki |
| 4 | `gra/src/game/eot-event-defer.ts:6-9` | `DeferredEotHint = { msg, durationMs }` — kolejka z definicji **gubi kontekst**: żadnego `techId` |
| 5 | `gra/src/game/eot-event-defer.ts` (`deferredHintsToSidePanelEvents`) | `id: 'eot-hint-' + turn + '-' + i`, `title: ''`, `subtitle: msg` po stripie HTML, `kind:'info'` |
| 6 | `gra/src/game/side-panel-event-link.ts` (`LINK_BY_PREFIX`) | `eot-hint-` **świadomie poza tablicą** (audyt P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1) → `sidePanelEventLinkFor` = `null` |
| 7 | `gra/src/ui/sidePanelHud.ts:720-721`, `:351` | brak linku → klasa `sp-no-link` + `cursor:default`, zero CTA |

**Pomiar w ŻYWEJ, zbudowanej grze** (artefakt `vite build` z `0ad2c20a`, `?playtest=mapa`,
karta zainscenizowana dokładnie tak, jak produkuje ją krok 5):

```text
data-id            : eot-hint-12-0
tekst karty        : "ℹ️WydarzenieZbadano: Rolnictwo (-40 nauki)✕"   ← 1:1 zrzut właściciela
.sp-goto-cta       : null            (brak afordancji)
klasa sp-no-link   : true
cursor             : default
role / tabindex    : null / null     (poza kolejnością Tab)
linkFor('eot-hint-12-0') : null
REALNY page.mouse.click (hit-test potwierdzony: elementFromPoint → ta karta):
  → civ-tech-discovery-notice-host: BRAK
  → openViews(): wszystkie false
```

Czyli: karta ze zrzutu właściciela to **hint**, a nie zdarzenie z tożsamością — i już dziś
jawnie deklaruje brak celu (`sp-no-link`, `cursor:default`), zgodnie z konwencją audytu.
Naprawa musi **dać temu zdarzeniu tożsamość** (własne id z identyfikatorem technologii),
a nie „podpiąć handler do `eot-hint-*`" — po id hintu nie da się odzyskać technologii.

## 2. DIAGNOZA (B) — dlaczego karta ulepszenia jest „pod spodem"

**ODPOWIEDŹ: karta ulepszenia ląduje w INNYM hoście o NIŻSZYM `z-index` (520 < 940).
Karta technologii NIE jest zamykana** — zostaje w DOM, widoczna, i to ONA przykrywa
kartę ulepszenia.

| # | Miejsce | Co robi |
|---|---|---|
| 1 | `gra/src/ui/techDiscoveryNotice.ts:226` | host karty technologii: `#civ-tech-discovery-notice-host{position:fixed;inset:0;z-index:940;display:flex;...}` |
| 2 | `gra/src/ui/techDiscoveryNotice.ts:660` | wiersz „Szczegóły →" dostaje `linkTo:{kind:'improvement'}` |
| 3 | `gra/src/ui/entityCards/renderer.ts:328-338` | delegowany listener `renderEntityCard` łapie klik PIERWSZY (`stopImmediatePropagation`) i woła `openEntityCard(kind, id, {mode:'dialog'})` |
| 4 | `gra/src/ui/entityCards/renderer.ts:343-364` (`openDialog`) | tworzy **osobny** `.entity-card-backdrop` i wkłada go do `document.body` |
| 5 | `gra/src/ui/entityCards/renderer.ts:438-440` (`ENTITY_CARD_CSS`) | `.entity-card-backdrop{position:fixed;inset:0;z-index:520;...}` — **520 < 940** |

Nigdzie na tej ścieżce nie ma wywołania `close()` karty technologii — potwierdzone
pomiarem, nie lekturą.

**Pomiar `getBoundingClientRect()` OBU kart naraz** (żywe Chromium, viewport 1600×1000,
realny klik myszą w „Szczegóły →" karty „Łowiectwo"):

```text
#civ-tech-discovery-notice-host : x=0    y=0     1600×1000  position=fixed  z-index=940
  .entity-card „Łowiectwo"      : x=470  y=323.5  660×352.9 position=relative z=auto  ← OTWARTA
.entity-card-backdrop (nowy)    : x=0    y=0     1600×1000  position=fixed  z-index=520
  .entity-card „Obóz łowiecki"  : x=583  y=353.7  434×292.5 position=static  z=auto

document.elementFromPoint(środek karty „Obóz łowiecki")
   → SECTION.entity-card-section  ·  closestCard = "Łowiectwo"
```

Obie karty mają niezerową powierzchnię i leżą w viewporcie, ale karta ulepszenia jest
**w całości zasłonięta** przez kartę technologii — hit-test w jej własnym środku trafia
w kartę „Łowiectwo". To dokładnie „pojawia się pod spodem" ze zgłoszenia.

Konsekwencja dla naprawy: to **nie** jest „karta zamykana przed otwarciem", więc naprawą
NIE jest przywracanie karty technologii, tylko **wspólny host / wspólny układ** dla obu kart.

Zrzuty diagnostyczne (przed naprawą): `/tmp/diag-A-przed.png`, `/tmp/diag-B-przed.png`.

---

## 3. ZMIANY / COMMIT

Gałąź `autobot/P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1`, wypchnięta do `origin`.
Commity: `eb56296f` (diagnoza) · `57006261` (A+B) · `cc7100fc` (bramka) · `00be09d8` (lustrzana kolejność).
Cztery pliki, 784 wstawki / 29 usunięć:

| Plik | Co |
|---|---|
| `gra/src/main.ts` (~`:26271`, emiter auto-research) | zamiast gołego `showHintMessage` powstaje dedykowana karta `warEventLog`: `id: 'tech-done-' + turn + '-' + techToSlug(done.id)`, `title: 'Zbadano: <tech>'`, `subtitle: '−<koszt> nauki'`, `kind:'science'`. Toast zostaje tylko poza fazą EOT (dziś nieosiągalne stąd). Wzorzec 1:1 z sąsiednim `era-<tura>-<epoka>`. |
| `gra/src/main.ts` (~`:19090`, przed `mountD1bHud`, ten sam blok co `onEventClick`) | `techDoneEventTechName` (jedyne źródło prawdy) + `techDoneEventLinkFor` (afordancja) + `openTechDoneEventLink` (akcja). |
| `gra/src/main.ts` `:19669`/`:19682` | `getEventLink: … sidePanelEventLinkFor(ev.id) ?? techDoneEventLinkFor(ev.id)` oraz `openSidePanelEventLink` → `openTechDoneEventLink` w `onEventClick` — **kolejność rodzin lustrzana** w obu miejscach. |
| `gra/src/main.ts` (~`:19029`, `handleSidePanelEventDismiss`) | gałąź `tech-done-` — ✕ usuwa wpis TRWALE (`splice`), bo `warEventLog` nie czyści się co turę; ta sama gałąź obsługuje „Usuń wszystkie". |
| `gra/src/ui/techDiscoveryNotice.ts` | `.tdn-stage` (wspólna, wyśrodkowana scena obu kart w JEDNYM hoście) + `wireSideCardLinks` (listener w fazie **capture**) + `openEntityCardBeside` + `addTdnCloseButton` (✕ dla obu kart) + osobny wpis stosu Esc `SIDE_OVERLAY_ID` + CSS progu 1160 px. |
| `gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` (NOWY) | bramka tematu, 77 asercji, żywe Chromium na artefakcie `vite build`. |

**Dlaczego (A) NIE jest „podpięciem handlera do `eot-hint-*`":** po id hintu technologii nie da się
odzyskać (diagnoza §1, krok 4). Zdarzenie musiało dostać własną tożsamość. Slug jest **jedynym**
nośnikiem — świadomie **bez mapy pomocniczej**: dzięki temu karta nie wygasa przy przerysowaniu
panelu ani przy zmianie tury (wymóg 4), a reset partii (`warEventLog.length = 0`, `:7902`) nie
wymaga sprzątania żadnej dodatkowej struktury.

**Dlaczego (B) NIE dotyka `renderer.ts`** (dyspozycja: „jeśli da się bez — to lepsze"):
`renderEntityCard` rejestruje własny delegowany listener na karcie i kończy go
`stopImmediatePropagation()`, więc każdy listener dopięty PO nim jest martwy (to spotkało dawny
lokalny listener T7b — nigdy się nie wykonywał). Listener w fazie **capture** na karcie-przodku
biegnie PRZED fazą bąbelkową na tej samej karcie, więc odbiera klik zanim renderer otworzy
osobny `dialog`. Wspólny renderer kart jednostek/budynków/CivPedii jest **nietknięty** —
potwierdzone bramkami migracyjnymi (§4). `entityCards/buildingAdapter.ts` też nietknięty.

**Zakres poprawki (B) jest szerszy niż samo „Szczegóły →":** przechwytywane są WSZYSTKIE linki
krzyżowe karty technologii (`button[data-entity-kind][data-entity-id]` — ulepszenia, budynki,
jednostki, kolejne technologie), bo wszystkie miały dokładnie ten sam defekt (520 < 940). Link
z karty satelity podmienia satelitę — nadal dwie karty widoczne, zero stosu pod hostem.

## 4. TESTY

Bramki referencyjne — **baseline (przed zmianą) == po zmianie**:

| Bramka | Przed | Po |
|---|---|---|
| `node ./node_modules/typescript/bin/tsc --noEmit` | 0 błędów | **0 błędów** |
| `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-op-wydarzenia --emptyOutDir` | czysty | **czysty** |
| `tools/logic-test.cjs` | 213/213 | **213/213** |
| `tools/tech-tree-test.cjs` | 19/0 | **19/0** |
| `tools/research-test.cjs` | 33/33 | **33/33** |
| `tools/unit-replace-test.cjs` | 13/13 | **13/13** |
| `tools/combat-test.cjs` | 6/6 | **6/6** |

Bramki obszaru kart/wydarzeń/CivPedii — **wszystkie zmierzone PRZED i PO, identyczne**:

| Bramka | Przed → Po |
|---|---|
| `entity-card-contract-test` | 75/0 → **75/0** |
| `entity-card-cross-links-nested-overlay-test` | 24/0 → **24/0** |
| `entity-card-action-buttons-real-render-test` | 31/0 → **31/0** |
| `civpedia-cross-link-style-real-render-test` | 19/0 → **19/0** |
| `civpedia-gra-id-mostek-test` | PASS → **PASS** |
| `building-detail-card-entitycard-migration-test` | 52/0 → **52/0** |
| `unit-detail-card-entitycard-migration-test` | 39/0 → **39/0** |
| `unit-info-card-entitycard-migration-test` | 26/0 → **26/0** |
| `tech-discovery-card-click-test` | 13/0 → **13/0** |
| `tech-discovery-card-real-click-test` | 12/0 → **12/0** |
| `technology-discovery-card-visual-test` | 48/0 → **48/0** |
| `sidepanel-events-toolbar-test` | 19/0 → **19/0** |
| `eot-event-defer-test` | 33/33 → **33/33** |
| `sidepanel-event-header-wydarzenie-real-render-test` | 23/0 → **23/0** |
| `sidepanel-event-przekierowania-real-render-test` | 51/0 → **51/0** |
| `sidepanel-hud-deadzone-test` | 43/0 → **43/0** |

Bramka tematu: `tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` — **77 pass / 0 fail**.

**Realny klik myszą (wymóg antyhalucynacyjny a):** żywe Chromium, artefakt `vite build`,
`?playtest=mapa`, hit-test `document.elementFromPoint` w punkcie kliku PRZED `page.mouse.click`:

```text
tech-done-12-rolnictwo  → klik → karta technologii OTWARTA, H2 = „Rolnictwo"
tech-done-12-owiectwo   → klik → karta technologii OTWARTA, H2 = „Łowiectwo"
```
Dwie technologie w jednej turze, klik na PIERWSZĄ otwiera PIERWSZĄ (wymóg d). Karta działa też
po przerysowaniu panelu. ✕ usuwa kartę i **nie** otwiera karty technologii.

**Pomiar obu kart naraz (wymóg antyhalucynacyjny b)** — 1600×1000, po realnym kliku „Szczegóły →":

```text
PRZED naprawą:  „Łowiectwo"      x=470 y=323.5 660×352.9   host z-index 940
                „Obóz łowiecki"  x=583 y=353.7 434×292.5   backdrop z-index 520
                elementFromPoint(środek „Obóz łowiecki") → karta „Łowiectwo"   ← ZASŁONIĘTA

PO naprawie:    „Łowiectwo"      x=246 … right=906
                „Obóz łowiecki"  x=920 … right=1354
                prostokąty rozłączne · obie w viewporcie · niezerowe
                elementFromPoint(środek każdej) → TA karta · .entity-card-backdrop: 0 szt.
```
Wąskie okno 1000×950: układ pionowy, obie karty nadal widoczne, rozłączne, w viewporcie.
Zamknięcie satelity zostawia kartę technologii (pomiar). Esc: 1× zamyka satelitę, 2× technologię.
✕ karty technologii zamyka obie. Zrzuty uzupełniające: `/tmp/zbadano-shots/`, `/tmp/diag-B-{przed,po}.png`.

**Trzy rodziny z audytu (wymóg e) — pomiar, nie założenie:** `war-*` → lista dyplomacji,
`elim-cs-*` → modal ELIMINACJA!, `border-march-*` → skok kamery na dokładny heks. Wszystkie
przez realny klik w bramce tematu **oraz** pełny `sidepanel-event-przekierowania-real-render-test`
(51/0, bez zmian w tamtym pliku testowym).

**DOWÓD NIETAUTOLOGICZNOŚCI (wymóg f) — 4 celowane mutacje, każda: mutacja → rebuild → bramka:**

| Mutacja (jedna zmiana w źródle) | Wynik bramki |
|---|---|
| M1 `techDoneEventLinkFor` → decyzja po samym prefiksie id (bez resolvera) | **70 pass / 7 fail** — padają wszystkie kontrole negatywne (N1, N2) i kotwica (0b) |
| M2 `openTechDoneEventLink` → `techName: 'Rolnictwo'` na sztywno | **76 pass / 1 fail** — „otwarta karta dotyczy «Łowiectwo»" czerwone (`got:"Rolnictwo"`) |
| M3 `wireSideCardLinks` → `false` zamiast `true` (bąbelkowanie zamiast capture) | **4 fail** i przebieg PRZERWANY (`TimeoutError` na szukaniu ✕ karty satelity) — karta satelity nie powstaje, `strayBackdrops:1`: dokładny powrót do stanu sprzed naprawy |
| M5 usunięty `stopPropagation()` na ✕ + jego druga straż | **76 pass / 1 fail** — „✕ NIE otworzył karty technologii" czerwone |

(M4 — usunięcie samej straży `target.closest('.sp-close')` — bramki **nie** zaczerwieniła:
izolację ✕ zapewnia `stopPropagation()` na jego własnym listenerze, straż jest zapasowa.
Zapisuję to jako fakt zmierzony, nie ukrywam nieudanej mutacji.)

## 5. BLOKADY / BRAK DOWODU (§13a)

**BRAK DOWODU — pełny przebieg emitera w żywej rozgrywce.** Nie udało się doprowadzić w scenariuszu
`?playtest=mapa` do ukończenia badania BEZ awansu epoki, żeby zobaczyć kartę `tech-done-*`
powstałą przez `researchStep`, a nie zainscenizowaną. Powód **zmierzony**, nie domniemany:
scenariusz kończy się zwycięstwem przez dominację w turze 2, a przy `prepareOneTechFromBronze()`
zatrzymuje się w turze 3 na `canPlayerInitiateEndTurn()===false` (odroczona bitwa: „Wróg atakuje
twoje wojsko!"). Jedyne dostępne przygotowanie stanu (`__eraTestDebug.prepareOneTechFromBronze`)
z definicji wymusza awans epoki, czyli gałąź `eraAdvanced`, w której ten komunikat nie powstaje.
Zamiast tego pokryte: (i) kotwica źródłowa (0a) na dokładnym wyrażeniu budującym id;
(ii) realny klik w kartę o TYM SAMYM id i formacie, przez normalny `onEventClick`;
(iii) sprawdzenie poza przeglądarką, że wszystkie **32** nazwy z `data/tech.json` dają unikalne
slugi, żaden nie zawiera `-` (znak rozdzielający tura↔slug), a przypadek brzegowy „ł"
(`Łowiectwo` → `owiectwo`, NFD gubi „ł") jest w bramce **jedną z dwóch klikanych technologii**.
Rozszerzenie haka testowego o „ukończ dowolną technologię bez awansu epoki" leży poza allowlistą
tego tematu — do rozważenia jako osobne zadanie infrastrukturalne.

**Odstępstwa od allowlisty — jawnie:**
1. `handleSidePanelEventDismiss` (~`:19029`) — poza literalnym „okolice `:26185-26215` i
   `onEventClick`". To handler ✕ podpięty w TYM SAMYM bloku konfiguracji co `onEventClick`
   (`onEventDismiss:`), a wymóg 5 dyspozycji wprost go dotyczy; `clearAllSidePanelEvents` woła
   go per id, więc gałąź musi być tam, nie w owijce przy konfiguracji. 13 linii, jedna gałąź.
2. Resolver rodziny `tech-done-*` leży w `main.ts` (~`:19090`), a nie w
   `gra/src/game/side-panel-event-link.ts`, gdzie mieszkają pozostałe rodziny — **ten plik jest
   poza allowlistą tematu**. Zasada naczelna audytu (jedno źródło dla afordancji i dla akcji)
   jest zachowana, tylko trzymana lokalnie. Jeśli Evaluator uzna to za dług — to jedna
   przeprowadzka do `side-panel-event-link.ts` w osobnym temacie.
3. `gra/src/ui/sidePanelHud.ts`, `gra/src/ui/entityCards/renderer.ts`,
   `gra/src/ui/entityCards/buildingAdapter.ts` — **w allowliście, ale NIETKNIĘTE**.
4. `gra/src/data/wikiBundle.json` — `vite build` przestempluje w nim pole `generated` (data).
   Przywrócone (`git checkout`), **nie ma go w żadnym commicie**; drzewo czyste.

**NOTA (nie zmiana):** `main.ts` ~`:26286` nadal otwiera automatyczny modal dla
`step.completed[step.completed.length - 1]` — czyli przy dwóch technologiach w jednej turze
sam z siebie pokaże tylko OSTATNIĄ. To jest odrębne od zgłoszenia (dotyczy modala po turze, nie
kliknięcia) i po tej zmianie **przestaje być stratą informacji**: obie technologie mają teraz
własne, klikalne karty w panelu WYDARZENIA. Zmiana tamtego miejsca oznaczałaby stos N modali
naraz — decyzja produktowa, świadomie poza tą rundą.

Brak blokad technicznych. Zero `npx`, zero `npm run build/dev`, zero `git add -A`,
`map-gen-regression-test` nieuruchamiany, każde wywołanie w `timeout`.

## 6. NASTĘPNY KROK

Bramka: **Evaluator** (Opus 5, effort high). Do sprawdzenia w pierwszej kolejności: trzy
odstępstwa od allowlisty z §5 oraz BRAK DOWODU na pełny przebieg emitera.

DEPLOY/PUSH: **NIE WYKONANO** (push wyłącznie na gałąź tematu, jawnie zlecony w dyspozycji;
brak integracji z `main`, brak deployu).
