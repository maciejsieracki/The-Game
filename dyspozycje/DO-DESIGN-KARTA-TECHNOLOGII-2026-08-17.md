# DO DESIGN — karta technologii po odkryciu

**Data:** 2026-08-17
**Kontekst:** FALA 291 · prototyp `docs/decyzje/P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1.md` · baza Operator card commit `8bf85cd9`
**Status:** brief dla Designera · docs-only · bez implementacji w `gra/`
**Styl:** kanon 1E (Painted Imperial), zgodny z aktualnym drzewkiem technologii i istniejącymi kartami UI

## 0. Zadanie w jednym zdaniu

Zaprojektuj wieloklatkową kartę technologii otwieraną po faktycznym odkryciu technologii, tak aby gracz natychmiast rozumiał **co zyskał**, **co zostało odblokowane** i **co może teraz zrobić**, bez zatrzymywania tury i bez tworzenia drugiego, niezależnego systemu danych.

To jest wzorzec dla całego drzewa technologii, nie karta tylko dla Brązownictwa. Brązownictwo służy wyłącznie jako przykład technologii z wieloma kategoriami odblokowań.

## 1. Cel ekranu i granice zakresu

### Cel

Po zakończeniu badania gracz powinien w kilka sekund:

1. rozpoznać nazwę i epokę właśnie odkrytej technologii;
2. zrozumieć jej najważniejszy efekt w jednym krótkim zdaniu;
3. zobaczyć najważniejsze nowe możliwości;
4. przejść do szczegółu budynku, jednostki, ulepszenia albo kolejnej technologii;
5. zamknąć kartę i kontynuować grę bez wymuszonego wyboru.

### W zakresie

- karta/modal po faktycznym ukończeniu badania;
- wariant ponownego otwarcia z odkrytego węzła drzewa;
- desktopowy układ bazowy i responsywna wersja węższa;
- komplet stanów wymienionych w §7;
- komponenty, warianty, copy i kontrakt dla implementera;
- klikalne odsyłacze do CivPedii/Wikipedii po stabilnych ID.

### Poza zakresem

- zmiana logiki badań, bramek epoki, kosztów lub danych;
- rozstrzyganie rozbieżności w źródłach danych;
- projektowanie całego drzewa technologii od nowa;
- dopisywanie nieistniejących budynków, jednostek, ulepszeń lub bonusów;
- implementacja w `gra/src`, zmiana `gra/data`, `main.ts`, `WERSJE.md` albo deploy.

## 2. Kanon wizualny i istniejące punkty odniesienia

Karta ma wyglądać jak część istniejącego systemu 1E, nie jak nowy produkt:

- paleta, typografia i komponenty z `brand-book/eksport/tokens.css`;
- złoto jako główny akcent, bez dokładania nowej semantyki kolorystycznej;
- Georgia/serif dla nazwy i nagłówków, Segoe UI dla treści i kontroli;
- istniejące ikony technologii z `brand-book/KANON/eksport/icons/tech/`;
- istniejące wzorce kart/tooltipów z:
  - `gra/src/ui/techTreeView.ts` — karta węzła, stany odkryta/dostępna/w trakcie/zablokowana;
  - `gra/src/ui/sciencePicker.ts` — wymagania i odblokowania;
  - `gra/src/ui/scienceHubHud.ts` — skrócone informacje o badaniu;
  - `docs/ux/claude-design/_dist/DRZEWKO-TECH-v1.1-2026-07-23/` — aktualny kanon drzewa bez krawędzi.

Nie używaj emoji. Jeżeli istnieje pasujący SVG, należy go wykorzystać zamiast projektować nowy asset.

## 3. Układ karty

Projektuj kartę jako jeden spójny modal/overlay z własnym przewijaniem treści. Mapa/HUD pozostają rozpoznawalne w tle, ale karta ma wyraźną hierarchię.

### 3.1 Nagłówek — zawsze widoczny

Nagłówek ma zawierać:

- ikonę technologii;
- etykietę stanu: **„TECHNOLOGIA ODKRYTA”** w trybie nowego odkrycia albo **„TECHNOLOGIA”** przy podglądzie;
- pełną nazwę technologii;
- epokę;
- status odkrycia, np. **„Odkryta”** / **„Ukończona”**;
- przycisk zamknięcia `×` z etykietą/tooltipem i obsługą `Esc`.

Nie ukrywaj nazwy ani statusu podczas przewijania: nagłówek powinien być sticky albo powtarzalnie dostępny.

### 3.2 Krótki efekt — zawsze widoczny

Bezpośrednio pod nagłówkiem umieść jedno krótkie zdanie:

> **„Daje dostęp do …”**

Treść musi pochodzić z danych kanonicznych. Jeżeli technologia nie ma bezpośredniego efektu opisowego, użyj neutralnego copy o odblokowaniach, a nie wymyślonego bonusu.

Opcjonalnie obok/poniżej można pokazać metadane technologii, jeżeli są częścią istniejącego kontraktu danych:

- poziom;
- koszt badania;
- awans do epoki;
- warunek ukończenia.

Nie eksponuj kosztu bazowego jako aktualnego kosztu, jeśli bieżące tempo gry zmienia wartość. W takiej sytuacji implementer ma przekazać wartość wynikającą z runtime albo ukryć pole.

### 3.3 Wymagania — zawsze widoczne, gdy istnieją

Sekcja **„Wymagania”** pokazuje:

- technologie wymagane do odkrycia;
- wymagany budynek;
- wymagane ulepszenie terenu;
- stan spełnienia, jeśli informacja jest dostępna (`spełnione` / `niespełnione`).

W trybie nowo odkrytej technologii wymagania są kontekstem, nie wezwaniem do działania. Nie pokazuj ich jako błędu po zakończeniu badania.

### 3.4 Sekcje zawartości

Każda sekcja ma nagłówek, licznik elementów i stan pusty. Pojedynczy element powinien być kartą/wierszem z ikoną, nazwą i krótkim opisem pochodzącym z danych.

Kolejność domyślna:

1. **Budynki**
2. **Jednostki**
3. **Ulepszenia terenu**
4. **Kolejne technologie**
5. **Zmiany ekonomiczne**
6. **Co możesz teraz zrobić**

#### Budynki

Pokazuj wszystkie budynki kanonicznie odblokowane przez technologię. W elemencie można pokazać tylko dane, które istnieją w kontrakcie:

- nazwa i ikona;
- epoka wejścia;
- wymagania budowy;
- koszt/utrzymanie, jeśli są dostępne i podpisane jednostką;
- krótki efekt.

Nie traktuj samego odblokowania jako automatycznego zbudowania budynku.

#### Jednostki

Pokazuj jednostki kanonicznie powiązane z technologią. Nie zastępuj listy konkretnych jednostek ogólnym hasłem typu „jednostki brązowe”. Jeśli źródła zwracają różne listy, implementer ma użyć uzgodnionego źródła/ID i nie scalać ich heurystycznie w UI.

Element może zawierać:

- ikonę kategorii/jednostki;
- nazwę;
- typ;
- wymagania i koszt rekrutacji, jeśli są dostępne;
- krótką funkcję jednostki.

#### Ulepszenia terenu

Pokazuj wyłącznie ulepszenia rzeczywiście przypisane do technologii w kanonicznym katalogu ulepszeń. Każdy wpis ma wskazywać:

- nazwę;
- ikonę;
- teren/złoże, jeśli dane to deklarują;
- koszt i efekt, jeśli dane je deklarują.

Deklaracja w polu technologii, której nie ma w katalogu ulepszeń, nie może być przedstawiona jako działające odblokowanie.

#### Kolejne technologie

Pokazuj bezpośrednio zależne technologie jako następne węzły drzewa. Element musi jasno rozróżniać:

- **„Możesz badać”** — wszystkie znane bramki spełnione;
- **„Wymaga jeszcze: …”** — technologia zależna, ale z brakującymi wymaganiami;
- **„Następny kierunek”** — zależność istnieje, ale nie ma kompletnej informacji o dostępności.

Nie obiecuj natychmiastowej dostępności tylko dlatego, że technologia jest zależna od właśnie odkrytej.

#### Zmiany ekonomiczne

To sekcja faktów, nie panel balansu. Pokazuj tylko bezpośrednie, kanoniczne skutki ekonomiczne:

- dostęp do surowca;
- produkcję/konwersję;
- koszt lub utrzymanie odblokowanych elementów;
- zmianę zasobu/łańcucha produkcyjnego.

Każda liczba musi mieć nazwany parametr, jednostkę i kontekst, np. **„produkcja Rudy: 20 jednostek na turę”**, a nie „+20”. Brak danych = brak wiersza, nie placeholder z wymyśloną wartością.

#### „Co możesz teraz zrobić”

Ta sekcja ma być najbardziej praktyczna. Pokazuje krótką listę działań możliwych po odkryciu, ale z ważnym rozróżnieniem:

- **„Możesz teraz”** — działanie faktycznie odblokowane;
- **„Najpierw spełnij”** — działanie wymaga osobnej bramki;
- **„Nie oznacza automatycznie”** — karta wyjaśnia, czego odkrycie nie daje samo z siebie.

Przykładowy wzorzec copy dla Brązownictwa:

- „Sprawdź dostęp do łańcucha brązu.”
- „Zbuduj Odlewnię brązu lub Kuźnię brązu, jeśli spełniasz ich wymagania.”
- „Przygotuj odpowiednie ulepszenie na właściwym złożu.”
- „Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.”
- „Odkrycie nie buduje automatycznie budynków i nie dodaje zapasu brązu.”

To są przykłady struktury i copy, nie dodatkowe decyzje gameplayowe. Finalne wartości i lista muszą być generowane z danych kanonicznych.

## 4. Hierarchia, widoczność i responsywność

### Zawsze widoczne bez rozwijania

- nazwa technologii, ikona, epoka i status;
- krótki efekt;
- podstawowe „Co możesz teraz zrobić”;
- liczba elementów w każdej sekcji;
- przycisk zamknięcia;
- kluczowe wymagania, jeśli istnieją;
- informacja o braku odblokowań, jeśli wszystkie sekcje są puste.

### Rozwijane domyślnie lub na żądanie

- pełne listy budynków, jednostek, ulepszeń i kolejnych technologii;
- szczegółowe koszty i utrzymanie;
- dłuższe opisy;
- „Zmiany ekonomiczne”, gdy sekcja ma więcej niż kilka wierszy;
- lista „czego nie daje samo odkrycie”, jeśli jest długa.

Domyślnie otwórz sekcję „Co możesz teraz zrobić” i pierwsze sekcje zawierające elementy. Nie zmuszaj gracza do rozwijania wszystkiego, aby poznać główny efekt.

### Priorytet informacji

1. **Co odkryłem?**
2. **Co to daje?**
3. **Co mogę zrobić teraz?**
4. **Co zostało odblokowane?**
5. **Jakie są wymagania i dalsze kierunki?**
6. **Szczegóły ekonomiczne i pełne opisy.**

### Responsywność

- Desktop jest wariantem referencyjnym: szeroka karta centralna, z czytelną mapą za overlayem.
- Przy węższym viewportcie karta przechodzi w prawie pełną szerokość, sekcje układają się w jedną kolumnę, a listy nie wymagają poziomego scrolla.
- Długie nazwy zawijają się maksymalnie do dwóch linii; nie wolno ucinać nazwy bez tooltipu ani wypychać przycisku zamknięcia.
- Wiele elementów przewija się wewnątrz karty, nie całe okno gry.
- Karta nie blokuje wykonywania tury: po zamknięciu gracz wraca do aktualnego HUD-u i może kontynuować.
- Nie projektuj automatycznego przejścia do kolejnego badania ani obowiązkowego CTA „wybierz technologię”.

## 5. Interakcje

### Zamknięcie

- `×` zamyka kartę;
- `Esc` zamyka kartę;
- klik poza kartą może zamykać tylko wtedy, gdy nie utrudnia to czytania; jeśli Designer proponuje blokadę kliknięcia w tło, musi pozostać dostępny `×` i `Esc`;
- zamknięcie nie cofa odkrycia, nie zmienia celu badań i nie anuluje kolejki.

### Ponowne otwarcie

- kliknięcie odkrytej technologii w drzewie otwiera tę samą kartę w trybie **„Podgląd technologii”**;
- tryb podglądu nie emituje ponownie toastu/animacji „Technologia odkryta”;
- karta może zmienić kicker z „TECHNOLOGIA ODKRYTA” na „TECHNOLOGIA”;
- elementy dostępne w trybie podglądu zachowują te same linki i sekcje.

### Kliknięcie elementu

Kliknięcie budynku, jednostki, ulepszenia albo technologii otwiera właściwy szczegół przez stabilny ID. Nie używaj samej nazwy jako klucza nawigacji. Kliknięcie technologii może otworzyć kartę tej technologii albo przejść do węzła drzewa — Designer ma pokazać wybrany wzorzec i przekazać go implementerowi.

## 6. CivPedia/Wikipedia i stabilne linki

Każdy element następujących typów musi być klikalny, jeśli istnieje jego wpis:

- budynek;
- jednostka;
- ulepszenie terenu;
- technologia.

### Kontrakt linku

Wizualnie każdy element powinien wyglądać jak interaktywny wiersz/karta: hover, focus-visible, aktywny stan i jednoznaczny affordance. Implementacyjnie link ma przekazywać:

```ts
type TechDiscoveryLink =
  | { kind: 'building'; id: string }
  | { kind: 'unit'; id: string }
  | { kind: 'terrainImprovement'; id: string }
  | { kind: 'technology'; id: string };
```

`id` jest stabilnym ID kanonicznego rekordu, nie tekstem prezentowanym graczowi. Tłumaczenie/nazwa, ikona i opis są odczytywane osobno z danych.

### Brak wpisu CivPedii

Jeśli rekord gameplayowy istnieje, ale nie ma odpowiadającego hasła CivPedii/Wikipedii:

- element nadal ma być widoczny, bo odblokowanie wynika z danych gry;
- pokaż stan neutralny, np. **„Opis w CivPedii niedostępny”**;
- nie pokazuj martwego przycisku ani linku wyglądającego na aktywny;
- zachowaj miejsce/komponent dla przyszłego wpisu;
- nie zastępuj brakującego hasła zmyślonym opisem.

Designer ma pokazać ten stan na osobnej klatce lub jako wariant komponentu.

## 7. Stany obowiązkowe

Brief wymaga pokazania w makiecie wszystkich poniższych stanów:

1. **Nowo odkryta technologia**
   - kicker „TECHNOLOGIA ODKRYTA”;
   - wyróżniony efekt;
   - sekcja „Co możesz teraz zrobić” otwarta;
   - subtelna animacja wejścia, bez blokowania UI i bez obowiązkowego CTA.

2. **Otwarta ponownie z drzewa**
   - kicker „TECHNOLOGIA” albo „PODGLĄD”;
   - brak toastu/celebracyjnej animacji;
   - ten sam układ i te same linki.

3. **Brak odblokowań**
   - karta nie może wyglądać na uszkodzoną;
   - pokaż komunikat, np. **„Ta technologia nie odblokowuje bezpośrednio nowych elementów.”**;
   - pozostaw efekt, wymagania, kolejne technologie i ekonomię, jeśli istnieją.

4. **Długie nazwy**
   - długa nazwa technologii;
   - długa nazwa budynku/jednostki;
   - zawijanie bez nakładania na ikonę, licznik i zamknięcie.

5. **Wiele elementów**
   - długa lista jednostek i co najmniej kilka elementów w pozostałych sekcjach;
   - liczniki sekcji;
   - scroll wewnętrzny;
   - zachowana kolejność i czytelne grupowanie.

6. **Brak wpisu w CivPedii**
   - rekord widoczny;
   - stan „Opis w CivPedii niedostępny”;
   - brak pozornego linku/przycisku.

7. **Interakcja elementu**
   - normal, hover, focus-visible i aktywny/kliknięty stan linku;
   - wariant elementu z wpisem CivPedii i bez wpisu.

8. **Brak elementów opcjonalnych**
   - brak wymagań;
   - brak kolejnych technologii;
   - brak zmian ekonomicznych;
   - sekcje nie znikają bez wyjaśnienia, tylko pokazują uzgodniony pusty stan albo są zwinięte z licznikiem 0.

## 8. Dane przykładowe: Brązownictwo

Użyj Brązownictwa jako przykładu bogatej karty, ale nie traktuj poniższej listy jako nowego źródła prawdy. Nazwy, liczby i zależności muszą zostać sprawdzone względem aktualnych danych kanonicznych w momencie implementacji.

Prototyp wskazuje, że przykład powinien ilustrować:

- budynki;
- jednostki;
- ulepszenia terenu;
- dostęp do brązu/łańcucha brązu;
- kolejne technologie;
- awans epoki;
- wymagania AND.

W prototypie opisano rozbieżności między `tech.json`, `units.json` i `terrain-improvements.json` (m.in. różne listy jednostek oraz deklarację „Popalnia brązu”). Designer nie ma ich rozstrzygać. W makiecie można użyć realnych nazw jako placeholderów, ale należy oznaczyć je jako dane przykładowe, a w kontrakcie przekazać, że implementer renderuje wyłącznie rekordy z kanonicznego źródła.

Zakazane:

- wymyślanie premii Nauki, Kultury, Zadowolenia lub Skarbca;
- traktowanie kosztu bazowego jako kosztu runtime bez potwierdzenia;
- obiecywanie automatycznie zbudowanych budynków;
- przedstawianie niezsynchronizowanego ulepszenia jako działającego;
- wpisywanie „wszystkich jednostek brązowych” bez stabilnych ID.

## 9. Akceptacja Designera — wymagane deliverables

### 9.1 Klatki desktopowe

Dostarcz minimum **7 klatek** w jednym pliku `.dc.html` albo równoważnym kanonicznym formacie Design:

1. Nowo odkryta Brązownictwo — karta bogata, sekcja „Co możesz teraz zrobić” otwarta.
2. Otwarta ponownie z drzewa — tryb podglądu.
3. Technologia bez bezpośrednich odblokowań.
4. Wiele elementów — długie listy i przewijanie.
5. Długie nazwy — technologia, budynek i jednostka.
6. Element z wpisem CivPedii: normal/hover/focus-visible.
7. Element bez wpisu CivPedii: stan nieaktywny bez martwego przycisku.

Co najmniej jedna klatka ma pokazywać tło mapy/HUD-u za kartą i potwierdzać, że modal nie zasłania bez potrzeby całego kontekstu.

### 9.2 Responsywność

Dostarcz minimum **2 warianty węższego viewportu**:

- karta szeroka na mniejszym desktopie;
- układ jednokolumnowy z wewnętrznym scrollem.

### 9.3 Komponenty i warianty

Przekaż listę komponentów z nazwami i wariantami:

- `TechnologyDiscoveryCard`;
- `TechnologyCardHeader`;
- `TechnologyEffect`;
- `TechnologyRequirements`;
- `TechnologySection`;
- `UnlockItem`;
- `NextTechnologyItem`;
- `EconomyChangeItem`;
- `ActionList`;
- `CivpediaLink`;
- `CivpediaMissing`;
- `CloseButton`.

Warianty obowiązkowe: `newly-discovered`, `preview`, `empty`, `long-content`, `long-name`, `has-civpedia`, `missing-civpedia`, `hover`, `focus-visible`, `disabled/unavailable`.

### 9.4 Copy

Dołącz tabelę copy:

- etykiety nagłówków;
- kicker nowego odkrycia i podglądu;
- komunikaty pustych sekcji;
- komunikat braku wpisu CivPedii;
- etykiety linków;
- copy „Co możesz teraz zrobić”;
- tekst zamknięcia i tooltipów;
- odmiana liczników elementów.

Copy ma być po polsku, krótkie i gotowe do użycia. Nie wpisuj fikcyjnych wartości gameplayowych.

### 9.5 Eksport

Dostarcz:

- makietę `.dc.html`/uzgodniony format;
- listę wykorzystanych istniejących assetów;
- listę nowych assetów tylko wtedy, gdy istniejące nie wystarczają;
- eksport ikon/assetów w SVG, jeśli zostały zaprojektowane;
- `MANIFEST.txt`;
- `DYSPOZYCJA-WDROZENIE.md` albo równoważny handoff;
- podgląd/standalone działający bez zewnętrznego CDN, jeśli taki jest standard paczki.

Nie twórz nowych tokenów bez wyraźnego oznaczenia i uzasadnienia. Priorytetem jest reużycie kanonu 1E.

## 10. Kontrakt dla implementera

Designer ma przekazać implementerowi następujące założenia:

```ts
type TechnologyDiscoveryViewMode = 'newly-discovered' | 'preview';

type TechnologyDiscoveryItem =
  | {
      kind: 'building' | 'unit' | 'terrainImprovement' | 'technology';
      id: string;
      label: string;
      iconId?: string;
      summary?: string;
      civpediaId?: string;
    }
  | {
      kind: 'building' | 'unit' | 'terrainImprovement' | 'technology';
      id: string;
      label: string;
      iconId?: string;
      summary?: string;
      civpediaId?: undefined;
    };

type TechnologyDiscoveryCardData = {
  technologyId: string;
  name: string;
  eraLabel: string;
  status: 'discovered';
  mode: TechnologyDiscoveryViewMode;
  effectSummary?: string;
  requirements: Array<{
    kind: 'technology' | 'building' | 'terrainImprovement';
    id: string;
    label: string;
    met?: boolean;
  }>;
  buildings: TechnologyDiscoveryItem[];
  units: TechnologyDiscoveryItem[];
  terrainImprovements: TechnologyDiscoveryItem[];
  nextTechnologies: TechnologyDiscoveryItem[];
  economyChanges: Array<{
    id: string;
    label: string;
    value: string;
    summary?: string;
  }>;
  actions: Array<{
    id: string;
    label: string;
    state: 'available' | 'requires-gate' | 'informational';
    summary?: string;
    link?: TechnologyDiscoveryItem;
  }>;
};
```

To jest kontrakt ilustracyjny, nie polecenie zmiany kodu w tej paczce. Implementer musi dopasować go do istniejących typów i loaderów, a nie tworzyć drugi słownik danych.

Wymagania kontraktu:

1. `technologyId` i wszystkie `id` pochodzą z danych kanonicznych.
2. Widok nie zawiera hardkodowanych list Brązownictwa.
3. Brak wpisu CivPedii jest stanem danych, nie błędem renderowania.
4. Brak elementów renderuje stan pusty.
5. Długie listy renderują się z wewnętrznym scrollem.
6. Zamknięcie nie modyfikuje stanu badań.
7. Tryb `preview` nie wywołuje efektu „nowe odkrycie”.
8. Linki są routowane po `kind + id`.
9. Karta nie wymaga nowych decyzji gameplayowych.
10. Karta nie blokuje zakończenia ani wykonania tury.

## 11. Definition of Done

- [ ] Jest jeden spójny brief i jeden plik makiety z wymaganymi klatkami.
- [ ] Cel ekranu i hierarchia odpowiadają kolejności „co odkryłem → co mogę zrobić”.
- [ ] Nagłówek, efekt, wymagania i sześć sekcji są zaprojektowane.
- [ ] Są stany nowego odkrycia, podglądu, pusty, długie nazwy, wiele elementów i brak CivPedii.
- [ ] Jest desktop i responsywność jednokolumnowa.
- [ ] Są stany hover/focus-visible dla elementów klikalnych.
- [ ] Każdy element ma miejsce na stabilny ID i link do CivPedii/Wikipedii.
- [ ] Brak wpisu CivPedii nie tworzy martwego przycisku.
- [ ] Brązownictwo jest przykładem, a nie hardkodowanym zakresem.
- [ ] Nie dodano żadnych niepotwierdzonych danych gameplayowych.
- [ ] Dostarczono komponenty, warianty, copy, eksport i kontrakt dla implementera.
- [ ] Nie zmieniono kodu gry, danych gry ani `dyspozycje/WERSJE.md`.

## 12. Źródła

- `docs/decyzje/P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1.md`
- `docs/decyzje/B3-B4-ui-svg-badania.md`
- `docs/ux/claude-design/_dist/DRZEWKO-TECH-v1.1-2026-07-23/WYMIANA-UI-DESIGN.md`
- `dyspozycje/DO-DESIGN-EKRAN-BADAN-2026-07-25.md`
- `dyspozycje/_handoff/UI-do-DESIGN_wikipedia-hud-mockup.md`
- `dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md`
- `gra/data/tech.json`
- `gra/data/buildings.json`
- `gra/data/units.json`
- `gra/data/terrain-improvements.json`
- `gra/src/ui/techTreeView.ts`
- `gra/src/ui/sciencePicker.ts`
- `gra/src/ui/scienceHubHud.ts`
