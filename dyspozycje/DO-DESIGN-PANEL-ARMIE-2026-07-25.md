# DYSPOZYCJE DLA DESIGNERA — panel „ARMIE" (lista armii na mapie świata)

**Zgłoszenie:** brak wpisu w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` w chwili pisania tej paczki — proponowany ID `R-DESIGN-PANEL-ARMIE-MAPA` (do zarejestrowania przez integratora przy wdrożeniu; ten dokument NIE edytuje rejestru). Maciej, playtest 2026-07-25, zrzut ekranu panelu „ARMIE".
**Od:** integrator (sesja pomocnicza, dokument) · **Zatwierdza:** Maciej
**Ten dokument = ZLECENIE z faktami (stan kodu + rozbieżności). Nie zawiera propozycji grafiki — to robi Design.**

⚠️ Równolegle nad UI mapy pracują inne sesje (m.in. przycisk pełnego ekranu HUD, bug paska na dole, nazewnictwo danina/podatek w `cityPanel`). Ta paczka **nie rusza kodu gry** — wyłącznie dokumentuje stan i formułuje zlecenie.

---

## 0. Zakres

Panel wywoływany przyciskiem ⚔ w toolbarze mapy świata — lewy, wysuwany panel z listą **wszystkich** własnych armii/jednostek gracza rozrzuconych po mapie. To NIE jest dolny pasek karty armii pojawiający się po kliknięciu konkretnego stosu na heksie — to inny, sąsiedni komponent (patrz „Nie mylić z" w §1).

## 1. Gdzie w kodzie

| | |
|---|---|
| **Plik komponentu** | `gra/src/ui/armyListHud.ts` — samodzielny moduł, DOM + inline `<style>` (`STYLE_ID='civ-army-list-hud-css-v1'`) |
| **Dane** | `gra/src/main.ts`, funkcja `buildPlayerArmyListEntries()`, ok. linii 3297–3332 |
| **Wpięcie** | `main.ts`, ok. linii 9513–9528: `createArmyListHud({ getArmies: buildPlayerArmyListEntries, onSelectArmy, onClose })` |
| **Architektura** | Komentarz w kodzie: „Ten sam układ co cityListHud (lewy panel, ✕, Esc, toggle)" — bliźniaczy komponent z listą miast (`gra/src/ui/cityListHud.ts`). Dziś **nie istnieje** żadna paczka Design dla `cityListHud` — patrz pytanie w §6 |

**Nie mylić z:**
- `gra/src/ui/armyStackHud.ts` — dolny pasek pojawiający się po zaznaczeniu KONKRETNEGO stosu na mapie (karty jednostek, atk/def/mov/rng, akcje). Inny komponent, dziś dotykany przez równoległą sesję („bug paska na dole").
- `gra/src/ui/armyMergePanel.ts` / `armySplitPanel.ts` — modały łączenia/dzielenia stosu.

### Co panel pokazuje dziś (dokładnie, z kodu)

Nagłówek „Armie" (CSS `text-transform:uppercase` → wizualnie „ARMIE") + przycisk ✕ (`title="Zamknij listę (Esc)"`).

Grupowanie: jednostki gracza (`ownerId===0`) grupowane po współrzędnych heksa `q,r` — każda grupa (wszystko na jednym polu) = jeden wiersz listy.

Wiersz (`al-item`):

| Element | Źródło / treść | Zawsze widoczny? |
|---|---|---|
| Ikona | `brandIconSvg('tb-army', 18)` — **ta sama ikona dla KAŻDEGO wiersza**, niezależnie od typu jednostki | tak |
| Nazwa | 1 jednostka → `typeId` (np. „Zwiadowca"); ten sam typ ×N → `„Typ ×N"`; różne typy → `formatArmiaLabel(n)` = „Armia — N jednostek" | tak |
| Heks | `„Heks (" + q + ", " + r + ")"` — surowe współrzędne osiowe silnika + licznik jednostek gdy >1 | tak |
| Pasek ruchu | zielony gradient, szerokość `ruchLeft/ruchMax*100%`, tylko gdy `ruchMax>0` | warunkowo |
| `detailLine` | `„Ruch: X/Y"` (+ „ · armia" gdy grupa >1) LUB „Ruch wykorzystany w tej turze" gdy `ruchLeft===0` | tak, gdy jest treść |
| `metaLine` | lista typów jednostek w stosie — tylko gdy stos ma >1 RÓŻNY typ | warunkowo |
| natywny `title` (tooltip przeglądarki) | „Zaznacz {nazwa}" / „Zaznacz armię — N jednostek" | tak, ale to zwykły atrybut `title`, nie stylowany komponent gry |

Na dole panelu (tylko gdy lista niepusta) — stały blok kursywą, renderowany przy **każdym** otwarciu (brak flagi „widziane"):
> „Kliknij armię, aby ją zaznaczyć na mapie. ✕ lub Esc — powrót. Ponowne ⚔ — zamknij listę."

Stan pusty: „Brak jednostek na mapie — zrekrutuj wojsko w mieście." (bez ikony).

Stan zaznaczenia: aktywnie wybrana armia dostaje zieloną obwódkę + tło (`al-item.on`, sterowane przez `setArmyListSelectedId()`).

⚠️ **Rozbieżność ze zrzutem Macieja:** kod ma w hincie znak **⚔** („Ponowne ⚔ — zamknij listę"), opis zrzutu Macieja mówi o **✕** („Ponowne ✕ — zamknij listę"). Możliwe że to ta sama para znaków źle odczytana w 0.72em italic, albo zrzut pochodzi z innej wersji builda. Nieistotne dla makiety (i tak znak ma zniknąć na rzecz SVG/ikonki), ale integrator powinien to zweryfikować przy wdrożeniu — patrz pytanie w §6.

**Czego panelowi dziś brakuje jako danych (nie tylko wizualnie):** interfejs `ArmyListEntry` (`armyListHud.ts`) **nie ma pola HP**. Silnik je ma — `RuntimeUnit.hp?` (`gra/src/units/setup.ts:65`, `undefined` = pełne HP z definicji jednostki) — i jest ono już używane gdzie indziej (`ArmyStackCard`/`ArmyStackHudState` w `armyStackHud.ts` mają `hp`/`hpMax` per karta), ale nie jest przekazywane do tej listy. **Wariant „armia ranna" nie istnieje dziś jako dana w tym komponencie** — patrz pytanie w §6.

## 2. Diagnoza „zanieczyszczenia" — zweryfikowane w kodzie

1. **„Heks (91, 57)" to dana techniczna** — POTWIERDZONE. Surowe `q,r` z siatki osiowej silnika (`hexLabel: \`(${lead.q}, ${lead.r})\``), nie nazwa regionu ani opisowa lokalizacja. Gracz i tak wybiera klikiem na mapie — liczby są balastem w widoku listy, mają sens jako detal na żądanie.
2. **Instrukcja kursywą (2 linie) to stały balast** — POTWIERDZONE. Renderowana przy każdym otwarciu listy (kod nie ma flagi „widziane"/localStorage), zajmuje więcej pionowej przestrzeni niż pojedynczy wiersz armii. Kandydat na tooltip/ikonkę „?" lub jednorazowy coachmark.
3. **„Ruch: 3/3" duplikuje pasek ruchu tuż nad nim** — POTWIERDZONE. Wiersz renderuje najpierw `al-mvbar` (pasek wypełniony na `ruchLeft/ruchMax*100%`), zaraz pod nim `detailLine` z tekstem „Ruch: X/Y" — ta sama informacja w dwóch formatach (wizualny + liczbowy) naraz, na stałe.
4. **[własne] Ikona jest generyczna, nie per-jednostka.** Każdy wiersz dostaje `tier2/tb-army-24.svg` (skrzyżowane miecze — generyczna ikona „armii" z toolbara), przeskalowaną do 18px, niezależnie czy to zwiadowca, łucznik czy konnica. Gra ma gotowy system `unitIconSvg()` (mapowanie kategoria jednostki → ikona, `unit-icon-map.json`) i używa go w **7 innych panelach**: `cityPanel.ts`, `armyStackHud.ts`, `unitRecruitCard.ts`, `armyMergePanel.ts`, `unitReplacePicker.ts`, `armySplitPanel.ts`, `unitPanelHud.ts`. `armyListHud.ts` jest jedynym z tej rodziny, który nie korzysta z ikon per-typ.
5. **[własne] `metaLine` (rozbicie stosu na typy) to kolejna stała linia tekstu**, doklejana jako trzecia linia opisu (po nazwie i heksie/ruchu) tylko gdy stos ma >1 różny typ, np. „Zwiadowca, Łucznik". Dokładnie ten rodzaj szczegółu pasuje bardziej do tooltipa — na liście wystarczy sygnał „to armia mieszana".
6. **[własne] Natywny `title` już dziś pełni namiastkę roli, o którą prosi Maciej**, ale to zwykły szary tooltip przeglądarki (bez opóźnienia, bez stylu gry) — nie spójny system tooltipów, którego reszta gry już używa (patrz §5).

**Podsumowanie:** wiersz armii ma dziś do 5 elementów tekstowych/graficznych (ikona, nazwa, heks+licznik, pasek, detailLine, opcjonalnie metaLine) plus stały blok instrukcji na dole panelu — na liście, której jedyna funkcja to „wybierz którą armię zaznaczyć". Obserwacje Macieja są trafne i potwierdzone w kodzie.

## 3. Proponowana hierarchia — co zostaje w liście, co idzie do tooltipa

Zasada: **lista służy do WYBORU, nie do analizy** — gracz skanuje, żeby znaleźć konkretną armię; szczegóły ogląda dopiero gdy się na czymś zatrzyma.

**ZOSTAJE w wierszu listy (minimum do wyboru):**
- Ikona jednostki/stosu — ale **per typ**, nie generyczna (patrz §4)
- Nazwa / skład skrócony (np. „Zwiadowca" albo „Armia ×3" — bez wyliczania typów)
- Sygnał gotowości do ruchu — sam pasek (kolor/wypełnienie) wystarcza; do rozważenia zamiana na 3-stanowy znacznik (pełny / częściowy / wyczerpany), jeśli pasek w wąskim wierszu 340px jest mało czytelny
- Sygnał stanu zdrowia, jeśli/gdy dane będą dostępne (§6) — np. cienki czerwony akcent przy rannej jednostce, bez liczby HP w widoku listy

**IDZIE do tooltipa (hover/focus na wierszu):**
- Dokładne współrzędne heksa `(q, r)`
- Ruch liczbowo `X/Y`
- Rozbicie stosu na typy (`metaLine`) przy mieszanej armii
- Dokładne HP/% HP, staty bojowe (atk/def/zasięg) — dane już istnieją w kształcie `ArmyStackCard`/`ArmyStackHudState` (`armyStackHud.ts`), można się nimi wzorować co do zakresu pól
- Status specjalny jednostki, jeśli aktywny — np. `sentry` („czuwa"), `oblegaCityId` („w oblężeniu") — dziś w ogóle niesygnalizowane na liście; naturalne miejsce to tooltip zamiast przeciążania wiersza

**Instrukcja obsługi (Esc/✕/klik):** zdjąć ze stałego bloku na dole panelu, przenieść do ikonki „?"/„i" w nagłówku (tooltip na hover) i/lub jednorazowego coachmarku przy pierwszym otwarciu — do decyzji w §6.

## 4. Ikony

- Panel **już korzysta** z aktualnego systemu brand-ikon (`brandIconSvg()`, katalog `gra/src/ui/icons/brand/`, manifest `icons-manifest.json`) — to nie są stare inline-SVG ani emoji (dla porównania: `cityUnitPick.ts`, opisany w paczce `DO-DESIGN-MODAL-WYBOR-HEKSA-2026-07-25.md`, faktycznie ma wpisane emoji Unicode — `armyListHud` tego problemu nie ma).
- Realny problem to **niewłaściwy dobór ikony**, nie przestarzała technika: każdy wiersz dostaje ten sam plik skrzyżowanych mieczy niezależnie od typu jednostki. To prawdopodobnie ikona, którą Maciej odbiera jako „stare infografiki" na zrzucie — sama grafika jest generyczna i nie zmienia się między zwiadowcą a konnicą, więc nie wygląda jak nowoczesna karta jednostki.
- Do dostarczenia/oceny przez Designera:
  1. **Nie projektować od zera** — `unit-icon-map.json` ma już gotowe pliki per kategoria: `units/unit-scout.svg`, `unit-archer.svg`, `unit-melee.svg`, `unit-cavalry.svg`, `unit-chariot.svg`, `unit-sling.svg`, `unit-naval.svg`, `unit-worker.svg`, `unit-siege.svg`, `unit-elite.svg`, `unit-default.svg` — używane dziś w kartach 24px w innych panelach. Do oceny: czy pasują wizualnie też w wąskim wierszu listy (18–24px), czy potrzebna dedykowana wersja.
  2. Ikona „armia mieszana / wiele typów" (`tb-army`, miecze) zostaje jako fallback dla stosu z >1 różnym typem — do potwierdzenia, czy pasuje stylistycznie do odświeżonych `unit-*`, czy wymaga odświeżenia razem z nimi.
  3. Ikonka „?"/„i" do nagłówka panelu (jeśli wybrany zostanie wariant z coachmarkiem/tooltipem instrukcji z §3) — sprawdzić, czy istnieje już w brand-secie, czy trzeba zaprojektować.

## 5. Zakres dla Designera

**Deliverable:** makieta panelu „Armie" w aktualnym języku wizualnym (ciemny panel `#1e2430` / obwódka `#2e3848`, tytuł złoty uppercase). Jeśli istnieje już makieta bliźniaczego `cityListHud` — użyć jej jako punktu odniesienia dla spójności obu list (patrz pytanie §6, dziś taka makieta nie została znaleziona w repo).

**Warianty treści (min.):**
1. 1 armia (pojedyncza jednostka, pełny ruch)
2. Wiele armii na liście (scroll, ≥4 pozycje różnych typów)
3. Armia ×N tego samego typu ORAZ armia mieszana różnych typów — osobno, bo dziś mają różny label
4. Armia z ruchem częściowo/w pełni wykorzystanym (pasek + stan „Ruch wykorzystany w tej turze")
5. Armia ranna — **UWAGA: to dziś nieistniejący stan danych w komponencie** (§1/§6). Makieta może pokazać propozycję (np. czerwony akcent na ikonie/pasku) oznaczoną jako warunkowa, do wdrożenia dopiero po decyzji Macieja i dograniu pola `hp` po stronie kodu.
6. Stan pusty („Brak jednostek na mapie…")

**Stany interakcji:**
- hover wiersza (dziś `rgba(224,178,74,0.08)` tło + złota obwódka — utrzymać kierunek, doprecyzować w nowym stylu)
- zaznaczona (dziś zielona obwódka/tło `al-item.on`) — zachować: zielony = wybrana, złoty = hover, to jedyne dwa stany koloru dziś
- focus klawiatury (`tabIndex=0`, Enter/Spacja już obsłużone w kodzie) — **dziś brak jakiegokolwiek stylu `:focus-visible`** na wierszach (analogiczny brak jak w `cityUnitPick.ts`, opisany w sąsiedniej paczce) — do zaprojektowania od zera

**Wzór tooltipa — nie projektować nowego systemu, taki komponent już istnieje:**
Gra ma gotowy, wielokrotnie użyty mechanizm „karta szczegółów na hover" — `gra/src/ui/hoverDetailDock.ts` (`attachHoverDetail()` / `attachInteractiveDetail()`, użyty dziś kilkanaście razy w `cityPanel.ts`). Działanie: hover z opóźnieniem (180–350ms, konfigurowalne) pokazuje kartę `.civ-detail-scope .detail-card` — ciemne tło, złota lewa krawędź 3px, nagłówek `dc-h` (ikona + tytuł, złoty), siatka etykieta/wartość `dc-grid`/`dc-l`/`dc-v`, opcjonalne sekcje/formuły/notatki. Karta dokuje się przy prawej/lewej kolumnie UX albo pływa jako floating tooltip gdy nie ma stałej kolumny — dokładnie przypadek panelu Armie (floating). **Design projektuje jeden wzorzec karty szczegółów armii w tym istniejącym stylu `.detail-card`**, z polami: dokładny heks, ruch liczbowo, rozbicie typów (jeśli mieszana), HP/staty bojowe (jeśli/gdy dane dojdą), status specjalny — analogicznie do kart jednostek już istniejących w `cityPanel.ts` (`buildUnitDetailCard`).

## 6. Pytania do Macieja

**[TEMAT: Panel Armie — zakres danych o zdrowiu jednostki]**
Dziś `ArmyListEntry`/`buildPlayerArmyListEntries()` w ogóle nie przekazuje HP (silnik je ma — `RuntimeUnit.hp?`, `gra/src/units/setup.ts:65` — ale nie jest wyciągane do tej listy). Bez tego „armia ranna" nie da się pokazać ani na liście, ani w tooltipie.
- **A — pomiń na razie.** Makieta bez wariantu „ranna", temat osobno później. Za: zero dodatkowej pracy kodowej teraz. Przeciw: gracz z rannymi jednostkami rozrzuconymi po mapie nie ma jak tego zobaczyć z poziomu tej listy — a to dokładnie ten typ informacji, po który by tu zaglądał.
- **B — dograć pole `hp`/`hpMax` do `ArmyListEntry`** (dane już istnieją w silniku; to przekazanie 2 pól przez `buildPlayerArmyListEntries()` + drobna zmiana w `armyListHud.ts`), Design projektuje sygnał (np. czerwony akcent) od razu. Za: kompletny zakres w jednej turze prac, dane tanie do wyciągnięcia. Przeciw: mała zmiana kodu poza zakresem samego Designu (robi integrator).

**Rekomendacja: B** — dane już istnieją w silniku, koszt integracyjny niski, a „armia ranna" jest wymieniona wprost jako oczekiwany wariant. **[ZAŁOŻENIE — do potwierdzenia]**

**[TEMAT: Instrukcja obsługi — tooltip czy coachmark]**
- **A — stała ikonka „?" w nagłówku, tooltip na hover.** Za: zawsze dostępna, zero „znikającej" wiedzy. Przeciw: gracz musi wiedzieć, że tam jest, żeby najechać/kliknąć.
- **B — jednorazowy coachmark przy pierwszym otwarciu panelu w sesji** (potem znika). Za: widoczny dokładnie wtedy, gdy jest potrzebny, nie zaśmieca kolejnych otwarć. Przeciw: wymaga stanu („widziane") — odrobinę więcej kodu integratora.
- **C — połączenie A+B** (coachmark za pierwszym razem + trwała ikonka „?" po nim).

**Rekomendacja: C** — najlepiej pokrywa pierwsze użycie i późniejsze przypomnienie, kosztem niewielkiej dodatkowej pracy integratora. **[ZAŁOŻENIE — do potwierdzenia]**

**Dodatkowo (nie blokuje Designu):**
1. Czy istnieje już gotowa makieta `cityListHud` (bliźniaczy panel list miast) do wykorzystania jako punkt odniesienia dla spójności obu list? Kod deklaruje wprost „ten sam układ co cityListHud", ale w repo nie znaleziono paczki Design dla tego komponentu.
2. Rozbieżność ⚔ vs ✕ w hincie (§1) — literówka odczytu zrzutu, czy inna wersja builda na zrzucie?

## 7. Konwencja dostawy

Zgodnie z formatem poprzednich paczek (`DO-DESIGN-MODAL-WYBOR-HEKSA-2026-07-25.md`, `POLECENIE-DESIGN-IKONY-SUROWCE-MIEJSKIE.md`):
- **Format makiety:** `.dc.html` (jak dotychczasowe), ze wszystkimi wariantami/stanami z §5.
- **Nowe/zmienione SVG jednostek** (jeśli dojdą): `gra/src/ui/icons/brand/units/`, konwencja nazw `unit-*.svg` (zachować istniejącą).
- **Wzorzec karty tooltipa:** opisać jako rozszerzenie istniejącego `.detail-card` (nie nowy komponent) — jeśli Design uzna, że potrzebna zmiana wizualna samej klasy `.detail-card`, zaznaczyć to osobno, bo wpływa na wszystkie miejsca, które już jej dziś używają (`cityPanel.ts`), nie tylko ten panel.
- **Po dostarczeniu (robi integrator, NIE Design):** podmiana ikony per-wiersz na `unitIconSvg()`, przycięcie treści wiersza wg §3, wpięcie `attachHoverDetail()`/`attachInteractiveDetail()` z kartą szczegółów, ewentualne dopięcie `hp`/`hpMax` jeśli zapadnie decyzja B w §6, rejestracja `R-DESIGN-PANEL-ARMIE-MAPA` w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`.

### Checklist Design (DoD)
- [ ] Makieta ze wszystkimi wariantami z §5 (1 armia / wiele / stos ×N / stos mieszany / ruch wykorzystany / pusty stan / propozycja „ranna" oznaczona jako warunkowa)
- [ ] Ikony per typ jednostki (nie generyczne miecze) — z istniejącego zestawu `unit-*.svg` lub nowe w tym samym stylu
- [ ] Stan `:focus-visible` zaprojektowany (dziś nie istnieje)
- [ ] Wzorzec karty tooltipa (`.detail-card`) z polami: heks dokładny, ruch liczbowo, typy w stosie, status specjalny
- [ ] Rozwiązanie na instrukcję obsługi (ikonka „?" / coachmark / oba) — zgodnie z decyzją Macieja §6
- [ ] Odpowiedzi Macieja z §6 uwzględnione w finalnej makiecie
