# 01-operator — P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1

STATUS: PASS
DOMAIN: GAME
TEMAT: P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1
GOAL: Audyt WSZYSTKICH nie-blokujących zdarzeń panelu bocznego („Wydarzenia") pod kątem
pytania właściciela (2026-08-22): „każde wydarzenie powinno być zweryfikowane, czy nie
prowadzi do jakiegoś większego opisu lub miejsca […] część wydarzeń powinna być
przekierowana do innych miejsc." Implementacja WYŁĄCZNIE dla kategorii (ii) — kandydatów
z gotowym, JUŻ ISTNIEJĄCYM miejscem docelowym w kodzie. Zero nowych ekranów.
RUNDY: 1/5

---

## 0. Ustalenie, które zmienia obraz zgłoszenia

Recon wykrył fakt, którego dyspozycja nie zakładała, a który zmienia diagnozę:

**Karty nie-blokujące JUŻ DZIŚ są klikalne w całości** — `sidePanelHud.ts` (przed zmianą,
linie ~715-722) binduje `click` na `.sp-event[data-id]:not(.sp-expanded)` → `onEventClick(id)`.
I **trzy rodziny zdarzeń nie-blokujących miały już pełny handler** w `main.ts` `onEventClick`:

| id | co robiło (przed tematem) |
|---|---|
| `border-march-*` | skok kamery na heks naruszenia (`axialToWorld` + `camCtrl.focusAt`) |
| `war-*` | `openDiploListWarEnemies()` — lista dyplomacji, filtr „wojny" |
| `elim-cs-*` | `showCivElimNotice()` — modal ELIMINACJA! z pełną treścią |

Czego brakowało: **jakiejkolwiek afordancji**. Karta prowadząca do panelu wyglądała
identycznie jak karta martwa — ten sam rant, ten sam `cursor:pointer`, żadnego „→".
Obejściem był tekst wpisany w treść zdarzenia: `elim-cs-*` ma dosłownie w `subtitle`
„**kliknij po szczegóły**" (`recordCivElimEvent`, main.ts). To jest dokładnie to, na co
patrzył właściciel na swoim zrzucie.

Czyli problem jest dwustronny i oba końce są w zakresie zgłoszenia:
1. część zdarzeń **prowadzi gdzieś, ale gracz nie ma jak tego zobaczyć**;
2. część zdarzeń **nigdzie nie prowadzi, a wygląda jakby prowadziła** (`cursor:pointer`
   na każdej karcie bez wyjątku).

---

## 1. AUDYT — PEŁNA lista źródeł zdarzeń panelu bocznego

Metoda: `grep 'SidePanelEvent'` w `gra/src/`, prześledzenie każdego miejsca zapisu do pięciu
logów (`warEventLog`, `villageEventLog`, `tradeRouteEventLog`, `rationAutoEventLog`,
`borderMarchEventLog`), wpisów wstawianych wprost w `collectTurnEvents()` oraz generatora
`deferredHintsToSidePanelEvents()`. Wynik: **11 rodzin nie-blokujących + 5 blokujących**.
Lista jest zamknięta — nie ma innego miejsca w kodzie, które produkuje `SidePanelEvent`
(poza `PLACEHOLDER_EVENTS`, używanym wyłącznie gdy `getEvents` nie jest podane, czyli nigdy
w grze).

### Kategoria (ii) — JEDNOZNACZNI KANDYDACI, gotowe miejsce docelowe → ZAIMPLEMENTOWANE

| # | id / źródło | `kind` | Realna treść (przykład z kodu) | Miejsce docelowe (funkcja, która JUŻ istniała) | Uzasadnienie |
|---|---|---|---|---|---|
| 1 | `elim-cs-<tura>-<owner>` — `recordCivElimEvent` (main.ts) | `diplo`, negative | „ELIMINACJA: Sumerowie · miasto-państwo" / „Wchłonięta dyplomatycznie — kliknij po szczegóły" | `showCivElimNotice({civLabel, details})` — `ui/civElimNotice.ts` | Pełna treść jest już zapisana pod tym samym id w `civElimEventDetails`. Handler istniał, brakowało wyłącznie widocznego skrótu. Etykieta „Szczegóły →" zastępuje prowizorkę w `subtitle`. |
| 2 | `war-<tura>-<a>-<b>` — `recordWarDeclarationEvent` | `enemy` | „Wypowiedzieliśmy wojnę: Egipt" / „W stanie wojny z: Egipt, Rzym" | `openDiploListWarEnemies()` (main.ts ~6028) → lista dyplomacji, filtr `war` | Karta mówi o stanie wojny; lista wojen to jedyny widok pokazujący komplet przeciwników. Handler istniał. |
| 3 | `border-march-violated` / `border-march-trespassing` — `applyBorderMarchPenaltiesEndTurn` | `diplo` | „Granice naruszone" / „Twoje granice naruszone — Egipt: −2 pkt Zaufania/turę" | skok kamery `camCtrl.focusAt(axialToWorld(q,r))`, heks z `borderMarchEventTargets` | Handler istniał (R-PRZEMARSZ-ATRYBUCJA-Q1=B). Nowość: skrót pokazuje się **tylko gdy heks jest faktycznie zapamiętany** (mapa może trzymać `null`) — dotąd klik bywał cichym no-opem. |
| 4 | `village-<tura>-<q>-<r>` — chatka/wioska (main.ts ~20564) | `info`/`city`/`unit` | „Odkryto chatkę" / „Chatka (skarb): +45 złota", „Chatka: dołączyła jednostka — Hastati" | skok kamery na heks; **q/r są zakodowane wprost w id** | Zero niejednoznaczności: id NIESIE współrzędne. Ten sam mechanizm i ten sam precedens co `border-march-*`. Dla nagrody-jednostki skok pokazuje nową jednostkę na miejscu. |
| 5 | `trade-new-<tura>-<routeId>` — `reportTradeRouteEvents` | `city` | „Nowy szlak handlowy" / „Ateny ↔ Memfis (Egipt) · +6 złota/turę" | `openCityPanelForPlayer(city)` → sekcja „Szlaki handlowe" w `ui/cityPanel.ts` | `refreshTradeRoutes` (trade-routes.ts:689) trzyma WYŁĄCZNIE pary gracz→obcy, więc `route.fromCityId` jest **zawsze** miastem gracza — panel miasta jest gracz-only, więc druga strona i tak nie ma dokąd prowadzić. |
| 6 | `trade-lost-<tura>-<routeId>` — j.w. | `city` | „Szlak handlowy zerwany" / „Ateny ↔ Memfis (Egipt) — zerwana Umowa Handlowa" | j.w. | j.w., ale z twardym warunkiem runtime: jeden z powodów zerwania to „miasto zniknęło"/„zmiana właściciela" — jeśli miasto nie należy już do gracza, **skrót się nie pokazuje**. |
| 7 | `auto-ration-t<tura>` — `buildAutoRationSidePanelEvent` (`game/spich-auto-ration-notify.ts`) | `enemy`, negative | „Automatycznie obniżono racje żywnościowe" / „Ateny: Obfite → Normalne · Teby: Normalne → Skromne" | `showEmpireDetailPanel('spichlerz')` — blok Spichlerz panelu imperium | Treść karty **wprost nazywa cel**: „Spichlerz nie pokrywa deficytu miast" (`AUTO_RATION_EVENT_COPY.body`). Zdarzenie jest imperium-szerokie (lista miast), więc panel imperium, nie panel jednego miasta. |
| 8 | `era-<tura>-<era>` — `notifyPlayerEraChangeIfAdvanced` | `science` | „Nowa epoka: Brązu" / „Twoje imperium wkracza w nową epokę." | `showTechTreeView(0)` — drzewo technologii | **Precedens w tej samej funkcji**: emiter karty woła zaraz obok `showTechDiscoveryNotice({ onOpenTree: () => showTechTreeView(0) })` — gra sama już uznaje drzewo za miejsce docelowe dla awansu epokowego. Nie wymyślam nowego ekranu. |

### Kategoria (i) — CZYSTO INFORMACYJNE, brak sensownego miejsca docelowego → BEZ ZMIAN FUNKCJONALNYCH

| # | id / źródło | `kind` | Realna treść (przykłady z kodu) | Dlaczego (i) |
|---|---|---|---|---|
| 9 | `edu-veteran-enemy-q3` — `checkVeteranEnemyFirstEncounter` (C-OBCE-JEDN-Q3 A) | `info` | „Doświadczeni wojownicy" / „Wrogie ★/★★/★★★ — premia do walki po wygranych bitwach. **Kliknij obcą jednostkę po pełną kartę.**" | To porada tutorialowa, której cel to **dowolna** obca jednostka z odznaką, nie jeden konkretny byt. Nie ma czego jednoznacznie wycentrować; sama treść instruuje gracza, co ma kliknąć na mapie. |
| 10 | `eot-hint-<tura>-<i>`, **podzbiór agregujący** — `deferredHintsToSidePanelEvents` | `info` | „Wzrost populacji w 4 miastach", „Głód: spadek populacji w 2 miastach", „Głód: utracono 3 jednostek", „Deficyt Złota: utracono 1 jednostek", „Auto ulepszenia: 3× (−Praca)", „Wyrąb lasu zakończony…" | Zbiorcze sumy tury. Karta nie niesie ID żadnego bytu — tylko gotowy tekst toastu (`DeferredEotHint.msg`). Nie ma jednego miasta/jednostki do otwarcia, a otwieranie „panelu imperium" dla każdej sumy byłoby linkiem-śmieciem. |
| 11 | `eot-hint-*`, **podzbiór dyplomatyczny AI↔AI** (`origin:'other-civs'`) | `diplo` | „Egipt handluje z Rzymem — Cyna" | Wpis „nie-nasz", domyślnie ukryty chipem 🌍 „Inne cyw.". Dotyczy cudzej pary — gracz nie ma do czego przejść. |

### Kategoria (iii) — NIEJEDNOZNACZNE / WYMAGAJĄCE DECYZJI PRODUKTOWEJ → NIE RUSZONE

| # | id / źródło | Realna treść | Dlaczego (iii), a nie (ii) |
|---|---|---|---|
| 12 | `eot-hint-*`, **ELIMINACJA CYWILIZACJI PRZEZ PODBÓJ** — `runCapitalCapturePlunder` (main.ts ~23653) przez `showHintMessage` w fazie EOT | „Sumerowie · miasto-państwo — ELIMINACJA! Ostatnie miasto (Ur) przejęte przez Rzym. Skarbiec, nauka i 2 tech(y) przejęte. Zdobycze Power: +18." | **To jest dokładnie karta ze zrzutu właściciela.** Miejsce docelowe teoretycznie istnieje (`showCivElimNotice`, modal ELIMINACJA!), ale ta ścieżka NIE zapisuje niczego pod id zdarzenia — treść wchodzi do generycznej kolejki `deferredEotHints` jako goły string, bez `ownerId`, bez `civLabel`, bez `details`. Podpięcie wymaga **zmiany emitera** (zamiana toastu na dedykowany wpis w stylu `recordCivElimEvent`), czyli zmiany TREŚCI i KATEGORII karty, a nie „podpięcia gotowego handlera" — to poza definicją (ii) w dyspozycji. Patrz DECISION_REQUIRED #1. |
| 13 | `eot-hint-*`, kapitulacja z głodu — main.ts ~12410 | „Ur — kapitulacja z głodu! Miasto przejęte przez Rzym." (+ ew. człon ELIMINACJA!) | Jw. — nazwa miasta jest tylko w tekście, nie ma id. Dodatkowo: miasto po przejęciu należy do kogoś innego, więc panel miasta (gracz-only) nie jest właściwym celem; sensowny byłby skok kamery, ale współrzędnych w komunikacie nie ma. |
| 14 | `eot-hint-*`, wiadomości dyplomatyczne AI→gracz — „⚔ Egipt — …", „Dyplomacja: propozycja wygasła — wojna" | j.w. | Kandydat na `openDiplomacyAudience(ownerId)`, ale komunikat niesie tylko etykietę cywilizacji jako tekst; parsowanie nazwy z łańcucha byłoby kruche (C-058 — nie zgadywać). Wymaga zmiany emitera + decyzji, czy audiencja to właściwy cel dla noty historycznej. |
| 15 | `eot-hint-*`, „Rajd Ludów Morza — zniszczone ulepszenie: Kopalnia!" | j.w. | Zdarzenie ma konkretne miejsce na mapie, ale komunikat nie niesie q/r. Wymaga zmiany emitera. |

**Wspólny mianownik całej kategorii (iii):** wszystkie to wpisy przechodzące przez
`showHintMessage()` w fazie `endTurnInProgress`, czyli przez **generyczną kolejkę
`deferredEotHints`, która z założenia gubi kontekst** — `DeferredEotHint` to `{msg, durationMs}`
i nic więcej. Dopóki emiter nie zapisze id bytu obok tekstu, żadnego z nich nie da się
przekierować bez zgadywania. To jest jeden, systemowy dług, a nie 4 osobne braki.

### Kategoria — poza zakresem tematu: zdarzenia BLOKUJĄCE (mają już „Otwórz →"/„Rozpatrz →")

`revolt-warn-<cityId>`, `revolt-<cityId>`, `prod-empty-<cityId>` (→ `openCityPanelForPlayer`
+ skok kamery), `diplo-pend-*` (→ `openDiplomacyPendingById`), `negot-*`
(→ `openDiplomacyAudienceForNegotiation`). Nietknięte; test (D) potwierdza brak regresji
wyglądu i zachowania.

---

## 2. ZMIANY/COMMIT

Zasada naczelna implementacji: **jedno źródło prawdy dla afordancji i dla akcji.** Skrót na
karcie i skok po kliknięciu wychodzą z tej samej funkcji (`sidePanelEventLinkFor`), więc
karta NIE MOŻE obiecać przejścia, którego handler nie wykona (ani odwrotnie).

Pliki:

- **`gra/src/game/side-panel-event-link.ts` (NOWY)** — czysta warstwa „po id": mapa prefiks →
  rodzaj skrótu + etykiety + parser heksu chatki (`villageEventHex`, obsługuje ujemne q/r).
  W komentarzu modułu jawnie wypisane, co i dlaczego jest POZA tablicą (kategoria (i)/(iii)).
- **`gra/src/main.ts`** — `sidePanelEventLinkFor(id)` (warstwa runtime: czy cel istnieje TERAZ)
  + `openSidePanelEventLink(id)` (wykonanie); `onEventClick` przepisane tak, że dawne, rozsypane
  gałęzie `border-march-`/`war-`/`elim-cs-` idą przez ten sam resolver (zachowanie 1:1), a
  gałęzie kart blokujących zostają nietknięte; nowa mapa `tradeRouteEventPlayerCityIds`;
  hak testowy `__sidePanelLinkTestDebug` (wzorzec `__eraTestDebug`, tylko odczyt/seed).
- **`gra/src/ui/sidePanelHud.ts`** — nowe pole konfiguracji `getEventLink`; render skrótu
  `.sp-goto-cta` („Panel miasta →") na karcie nie-blokującej z celem; klasa `sp-no-link` +
  `cursor:default` dla karty bez celu; `role="button"`/`tabindex="0"` i obsługa Enter/Spacja
  **tylko** dla kart ze skrótem; CSS pigułki skrótu.
- **`gra/src/ui/hud.ts`** — wyłącznie przelot `getEventLink` z `HudConfig` do `createSidePanelHud`
  (plik nie był w dyspozycji, ale jest jedyną drogą konfiguracji panelu z `main.ts` — bez tej
  linii pole nie dociera do renderera; zero innej logiki).
- **`gra/tools/side-panel-event-link-test.cjs` (NOWY)** — bramka kontraktowa czystej warstwy.
- **`gra/tools/sidepanel-event-przekierowania-real-render-test.cjs` (NOWY)** — bramka żywa.

UX skrótu jest **świadomie inny** niż u kart blokujących (dyspozycja to dopuszcza): karta
informacyjna niczego nie żąda, więc dostaje najlżejszy wariant — pigułkę z konturem, bez
wypełnienia i poświaty. Złocony badge „Wymaga decyzji" i przycisk `tg-btn-primary` „Otwórz →"
zostają zarezerwowane dla kart wymagających decyzji.

## 3. TESTY

Bramki referencyjne (przed zmianą i po — identyczne):

| Bramka | Wynik |
|---|---|
| `npx tsc --noEmit` | **0 błędów** |
| `npx vite build` | **czysty**, single-file `index.html` |
| `node tools/logic-test.cjs` | **213/213** |
| `node tools/tech-tree-test.cjs` | **19/19** |
| `node tools/research-test.cjs` | **33/33** |
| `node tools/unit-replace-test.cjs` | **13/13** |
| `node tools/combat-test.cjs` | **6/6** |

Regresja panelu (wymagana przez dyspozycję):

| Bramka | Wynik |
|---|---|
| `node tools/sidepanel-events-toolbar-test.cjs` | **19/19** (bez zmian) |
| `node tools/eot-event-defer-test.cjs` | **33/33** (bez zmian) |
| `node tools/sidepanel-event-header-wydarzenie-real-render-test.cjs` | **23/23** (bez zmian, łącznie z mutacją D) |
| `node tools/sidepanel-hud-deadzone-test.cjs` | patrz niżej |

Testy tematu:

| Bramka | Wynik |
|---|---|
| `node tools/side-panel-event-link-test.cjs` | **34 pass / 0 fail** |
| `node tools/sidepanel-event-przekierowania-real-render-test.cjs` | **51 pass / 0 fail** |

Test żywy (C-001 — **artefakt `vite build`, zero dev servera**) ładuje zbudowaną grę
(`?playtest=mapa`), inscenizuje 11 kart, klika je **prawdziwą myszą** i czyta stan widoków
**własnymi predykatami gry** (`isCityPanelOpen`, `isEmpireDetailPanelOpen`, `isTechTreeViewOpen`,
`isDiploListHudOpen`, `getOpenCityPanelCityId`, `getDiploListFilter`), nie zgadywaniem po CSS.
Potwierdzone realnym kliknięciem: modal ELIMINACJA!, lista dyplomacji na filtrze „wojny",
panel **tego** miasta gracza, panel imperium, drzewo technologii, dwa skoki kamery na dokładny
heks zdarzenia.

**Dowód nietautologiczności — 4 kontrole negatywne, w tym 2 sprawdzające warstwę runtime, a nie
sam prefiks id:** `eot-hint-*` i `edu-veteran-enemy-q3` (kategoria (i)) nie dostają skrótu;
`border-march-trespassing` BEZ zapamiętanego heksu i `trade-lost-*` wskazujący na nieistniejące
miasto **też nie** — mimo że ich prefiksy są w tablicy. Gdyby afordancja szła po samym prefiksie,
te dwie asercje byłyby czerwone. Dodatkowo klik jest weryfikowany `document.elementFromPoint`
przed wykonaniem (panel jest scrollowalny — bez tego kontrole negatywne byłyby fałszywie zielone,
bo klik po prostu by nie doszedł; ten błąd wystąpił realnie w rundzie i został naprawiony).

Zrzut kart ze skrótami: `--shots` testu żywego.

## 4. BLOKADY

Brak blokad technicznych.

## 5. DEPLOY/PUSH

Commit na branchu `autobot/WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1`, push do `origin`
(jawnie zlecone w dyspozycji). **NIE zintegrowano z `main`, NIE deployowano.**

## 6. NASTĘPNY KROK / DECISION_REQUIRED

Bramka: Evaluator.

**DECISION_REQUIRED #1 — eliminacja cywilizacji/miasta-państwa przez PODBÓJ (karta ze zrzutu
właściciela).** Dziś jest to bierna karta „Wydarzenie" z całą treścią w `subtitle`, bez
przejścia — bo ścieżka `runCapitalCapturePlunder` wysyła zwykły toast do generycznej kolejki
EOT, gubiąc `ownerId`/`civLabel`/`details`. Modal `showCivElimNotice` (ELIMINACJA!) już
istnieje i jest używany przez **drugą** ścieżkę eliminacji (wchłonięcie dyplomatyczne,
`elim-cs-*`). Pytanie: **czy zrównać obie ścieżki** — żeby eliminacja przez podbój też
emitowała dedykowaną kartę „ELIMINACJA: <cyw>" ze skrótem „Szczegóły →" do tego samego
modalu (A), **czy zostawić ją jako czysto informacyjną** notę końca tury (B)? Wariant (A)
zmienia treść i kategorię karty, więc świadomie NIE zrobiłem tego bez decyzji.

**DECISION_REQUIRED #2 — systemowy dług kolejki `deferredEotHints`.** Pozycje 13-15 audytu
(kapitulacja z głodu, wiadomości dyplomatyczne AI→gracz, rajd Ludów Morza) mają realne byty
docelowe, ale kolejka przenosi wyłącznie `{msg, durationMs}`. Pytanie: **czy rozszerzyć
`DeferredEotHint` o opcjonalny kontekst** (`{ hex? , cityId?, ownerId? }`), żeby te i przyszłe
zdarzenia EOT mogły dostać skrót tym samym mechanizmem — czy uznać, że karty końca tury mają
z definicji zostać bierne? To decyzja architektoniczna, nie kosmetyczna, i dotyka pliku
współdzielonego (`game/eot-event-defer.ts`), więc celowo poza tą rundą.

**NIE ma prowizorki:** nigdzie nie dodano linku-donikąd ani placeholdera. Karta bez
potwierdzonego celu jawnie deklaruje brak celu (`sp-no-link`, `cursor:default`).
