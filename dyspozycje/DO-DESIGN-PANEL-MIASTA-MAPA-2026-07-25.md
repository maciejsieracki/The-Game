# DYSPOZYCJE DLA DESIGNERA — panel/kafelek miasta na mapie świata (odświeżenie)

**Zgłoszenie:** `R-DESIGN-PANEL-MIASTA` (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`) · Maciej, playtest 2026-07-25, ze zrzutem ekranu: „tak samo panel widoku miast na mapie głównej jest przestarzały."
**Od:** integrator (sesja chmurowa) · **Zatwierdza:** Maciej
**Ten dokument = ZLECENIE z faktami (stan kodu + rozbieżności).** Nie zawiera propozycji grafiki — to robi Design.

---

> ## ⚠️ AKTUALIZACJA 2026-08-06 — SEKCJE 1 I 3 NIŻEJ SĄ HISTORYCZNE (stan z 2026-07-25), DZIŚ NIEAKTUALNE
> Od tego dokumentu minęło 12 dni intensywnego rozwoju pigułki (6 commitów 2026-08-04→06). **Obrona, ikona
> cywilizacji, produkcja i ostrzeżenie surowców — wszystkie MUST/NICE z sekcji 4 poniżej — SĄ już w grze
> na `main` dziś.** Sekcje 1 i 3 poniżej opisują stan SPRZED tych zmian i służą wyłącznie jako zapis
> historyczny „skąd wystartowaliśmy" — **NIE czytaj ich jako aktualny stan gry.**
>
> **Aktualny, zweryfikowany osobiście stan kodu + konkretne zlecenie dla Design (klatki v2) jest w:**
> **[`dyspozycje/DO-WKLEJENIA-DESIGN-V2-2026-08-06.md`](DO-WKLEJENIA-DESIGN-V2-2026-08-06.md)** — ten plik
> zastępuje sekcje 1, 3, 4 (addendum) i 6 tego dokumentu jako źródło faktów. Decyzja nadrzędna nadal ta
> sama: `docs/decyzje/R-DESIGN-PANEL-MIASTA-V2-Q1.md` = C (polish wizualny PO Q4=B, nie redesign od zera).
>
> Sekcje 2 (stary mockup) i 5 (ograniczenia techniczne — sprite billboard, cache key) tego dokumentu
> pozostają aktualne i ważne, z jednym wyjątkiem: próg obcinania nazwy w sekcji 5 podany jako „~220px" jest
> nieprecyzyjny — realny wzór w kodzie to `maxNameW = 200px − prodW − growthW` (patrz nowy dokument, sekcja 1a).

---

---

## 0. Zakres — o co DOKŁADNIE chodzi

Chodzi wyłącznie o element widoczny **na mapie świata, przy każdym mieście, cały czas** (nazwa + populacja w złotej pigułce, unosząca się nad miastem) — **NIE** o pełny panel miasta (Ekran „Miasto W3", otwierany po kliknięciu/wejściu w miasto — ten ma swoją osobną, nowszą linię mockupów i NIE jest tu ruszany).

Innymi słowy: różnica między „miniaturką na mapie" a „pełnym dashboardem miasta po otwarciu". Ten dokument dotyczy wyłącznie miniaturki.

---

## 1. STAN W GRZE — ⚠️ HISTORYCZNY, 2026-07-25 (przeczytaj banner na górze pliku; aktualny stan → `DO-WKLEJENIA-DESIGN-V2-2026-08-06.md`)

**[NIEAKTUALNE od 2026-08-04]** Sekcja niżej opisuje pigułkę z 2026-07-25, gdy pokazywała wyłącznie nazwę i
populację. **Od tego czasu (6 commitów, 2026-08-04→06) pigułka dostała: 3-stanową tarczę obrony, medalion
cywilizacji (portret władcy / sygnet kultury MP), glif frontu kolejki produkcji, etykietę Wyżywienia (miasta
gracza) i hover z kategorią produkcji + ostrzeżeniem surowców.** Treść niżej zostaje jako zapis „stanu
wyjściowego" tego zlecenia — nie koduj wg niej.

Element składa się z **dwóch niezależnych warstw 3D**, sklejanych nad heksem miasta w `gra/src/render/cities.ts` (`_syncStatChip` + `_syncMapOutline`):

### 1a. Pigułka nazwa+populacja — `gra/src/render/cityMapStatChip.ts` [STAN 2026-07-25, nieaktualne]
Rysowana ręcznie na `<canvas>` (nie DOM/HTML, nie system ikon brand), potem jako tekstura sprite'a Three.js unoszącego się nad modelem miasta (`worldH=0.48` świata — **korekta 2026-08-06: dziś w kodzie `worldH=0.52`**, billboard, zawsze zwrócona do kamery).

Zawartość ówczesna — **dokładnie dwie dane** (dziś: sześć-siedem, patrz dokument v2):
- **Nazwa miasta**, WERSALIKAMI, font Georgia/serif, kolor `#f4f0e8`. Jeśli miasto to kopia-typu klastra (miasto-państwo), doklejony jest dopisek „ · miasto-państwo" (`formatCityMapLabel`, `gra/src/game/display-names.ts:60`) — wydłuża nazwę.
- **Populacja** w złotym kółku Ø30px (`#e8d88a`), liczba czarna wewnątrz.

Tło: zaokrąglona pigułka, gradient grafitowy `rgba(16,22,34,.96)→rgba(8,10,16,.94)`, obwódka złota 2px `rgba(232,216,138,.72)` — **te wartości pozostają aktualne dziś, niezmienione**.
Nazwa jest obcinana (`truncateName`) jeśli przekracza ~220px szerokości — **korekta 2026-08-06: to było zawsze przybliżenie; realny wzór w kodzie to `maxNameW = 200px − prodW − growthW`, patrz dokument v2 sekcja 1a** — przy długich nazwach + dopisku „miasto-państwo" realnie się to zdarza.

### 1b. Obwódka heksu — `gra/src/render/cityMapOutline.ts`
Podwójny pierścień linii wokół heksu miasta: wewnętrzny w kolorze cywilizacji-właściciela (opacity 0.92), zewnętrzny też w kolorze cywilizacji (0.52) — **chyba że miasto jest w stanie wojny z graczem**, wtedy zewnętrzny zmienia się na czerwony (`0xff4444`, opacity 0.55). To jedyny inny sygnał wizualny na mapie poza pigułką. **Ta sekcja jest nadal aktualna dziś, bez zmian.**

### Co NIE było pokazane w 2026-07-25 — DZIŚ NIEAKTUALNE, patrz `DO-WKLEJENIA-DESIGN-V2-2026-08-06.md` sekcja 1
**[NIEAKTUALNE]** W 2026-07-25 żadna z poniższych informacji nie trafiała do pigułki ani do obwódki. **Dziś
(2026-08-06) produkcja, obrona (3 stany) i ostrzeżenie surowców SĄ pokazywane** — patrz dokument v2. Realne
pozostałe luki: Mury vs Cytadela wyglądają identycznie (ta sama tarcza tier 2), Baszta jest niewidoczna,
marker stolicy jest gotowy na osobnym branchu ale jeszcze nie scalony do `main` — szczegóły w dokumencie v2,
sekcje 2 i 5.
- ~~produkcja / kolejka budowy w mieście~~ → pokazywana od `bf5b4ea` (2026-08-05, glif) i `c36bbea` (2026-08-06, hover: kategoria+nazwa)
- ~~mury / obrona (procentowa)~~ → pokazywana od `b45113b` (2026-08-04, 3 stany: brak/palisada/mury-lub-cytadela)
- ~~surowce miasta / magazyn~~ → ostrzeżenie „brak surowców" pokazywane w hover od `c36bbea` (2026-08-06)
- ikony brand-systemu (`brandIconSvg`, `chip6c`) — **nadal aktualne**: pigułka nie korzysta z komponentu chip6c, ale glif produkcji OD `bf5b4ea` już renderuje prawdziwe SVG z brand assets (via `setCityMapBadgeProdIcon`), nie jest już „całkowicie odcięta" od systemu ikon.

(Dla porównania: hex-tooltip po kliknięciu pola — `gra/src/ui/hexContextTooltip.ts` — pokazuje bogaty rozkład plonów terenu i nazwę miasta jako jedną linijkę, ale to osobny element UI, kontekstowy, nie „wisi" przy mieście na mapie.)

---

## 2. STARY MOCKUP DESIGN (referencja) — i dlaczego już wtedy było mało

Plik: `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/The Game - HUD Miasto wybrane (1E).dc.html`, linie 16–18 (fragment „wybrane miasto na mapie").

Datowanie: plik pochodzi z paczki Design z **2026-07-04** (najstarsze zachowane makiety HUD mapy; do repo dowieziony dopiero 2026-07-23 jako część odzyskiwania zaległych plików — patrz `docs/ux/AUDYT-MOCKUPOW-2026-07-23.md`).

Mockup pokazuje: żółtą gwiazdkę + `RZYM` (wersaliki, Georgia) + złote kółko z liczbą `4` (populacja) + przerywany pierścień selekcji dookoła.

**Wniosek: gra dziś realizuje ten mockup niemal 1:1** (ta sama para danych: nazwa + populacja, ten sam układ pigułki, ten sam styl). Różnica jest kosmetyczna (dashed-circle selekcji w mockupie vs. podwójny hex-ring właściciela/wojny w grze).

To znaczy: **problem nie jest w rozjeździe „mockup vs. implementacja"** (są zsynchronizowane, stan 2026-07-25) — problem był w tym, że **od 2026-07-04 do 2026-07-25 minęły ~3 tygodnie, a ten element HUD się nie ruszył**. **[KOREKTA 2026-08-06] To zdanie było prawdziwe TYLKO do 2026-08-04 — od tego dnia pigułka dostała 6 commitów w 4 dni robocze (`b45113b`…`c36bbea`, pełna lista w `DO-WKLEJENIA-DESIGN-V2-2026-08-06.md` sekcja 6). Element dziś jest jednym z najaktywniej rozwijanych fragmentów renderu mapy — NIE cytuj tego zdania jako aktualnego stanu.**

---

## 3. CO DOSZŁO DO GRY OD TAMTEJ PORY — ⚠️ TABELA HISTORYCZNA (stan 2026-07-25), KOLUMNA „Widoczne w pigułce?” DZIŚ NIEAKTUALNA

**[NIEAKTUALNE od 2026-08-04]** Trzy pierwsze wiersze tej tabeli (obrona, ikony brand w glifie produkcji,
ostrzeżenie surowców) miały „NIE” w kolumnie ostatniej w 2026-07-25. **Dziś te odpowiedzi się zmieniły** —
korekty dopisane pogrubieniem. Surowce miasta per-typ (np. „brakuje Kamienia") nadal nie mają pełnej listy w
pigułce — jest wyłącznie zbiorcze ostrzeżenie „brak surowców w magazynie” (hover), nie rozkład per-surowiec.

| Nowość | Kiedy / kanon | Gdzie żyje dziś w UI | Widoczne w pigułce miasta na mapie? |
|---|---|---|---|
| **Obrona procentowa** — Mury samodzielnie **+200%**, Mury+Cytadela **+300%**, Mury+Cytadela+Baszta **+400%** (realne maksimum; wszystkie wartości % Obrony, addytywne — nie mnożnik ×3/×4) | Kanon Maciej 2026-07-25/28 (`gra/data/miasto-params.json`, `gra/src/game/city-defense.ts`) | Wynik walki/oblężenia (silnik); wall-integrity % podczas oblężenia w `siegeHud1E.ts`; model 3D miasta zmienia geometrię | **[KOREKTA 2026-08-06] TAK, częściowo od `b45113b` (2026-08-04)** — pigułka pokazuje 3-stanową tarczę (brak/Palisada szara/Mury-lub-Cytadela złota), ale **nie rozróżnia Mury (+200%) od Mury+Cytadela (+300%)** — ta sama złota tarcza — **i Baszta (+100% dodatkowo, do +400% razem) jest całkowicie niewidoczna**. Szczegóły: dokument v2 sekcje 2–3. |
| **Surowce + magazyny państwa** — cap 500 + 100×(liczba Magazynów), pula wspólna imperium | FALA 6, 2026-07-24 (`R-MAGAZYN-500`, `R-HUD-SUROWCE`) | Chip „Surowce" w górnym HUD + zakładka magazynu w panelu imperium (`empireDetailPanel.ts`) + paski surowców w panelu miasta | **[KOREKTA 2026-08-06] TAK, zbiorczo od `c36bbea` (2026-08-06)** — pigułka w hoverze pokazuje ikonkę ostrzeżenia gdy frontowi kolejki brakuje surowca w magazynie państwa (`canAffordBuildingStock`). Nie pokazuje KTÓREGO surowca ani ile brakuje — tylko binarne ostrzeżenie. |
| **Ikony surowców v4** — 12 nowych ikon brand (`res-brick`, `res-bronze`, `res-copper-ore`, `res-iron-ore`, `res-steel`, `res-ceramics`…), koniec interimowego kolorowania | FALA 6, 2026-07-24 (`R-IKONY-SUROWCE-V4`) | `gra/src/ui/icons/brand/resources-map/*.svg`, resolver `mapResourceIconSvg()` w `brandAssets.ts`, użyte w HUD/panelu miasta/tooltipie heksu | Nadal **NIE** — pigułka nie pokazuje ikon surowców per typ (tylko binarne ostrzeżenie, patrz wiersz wyżej), pozostaje aktualne |
| **Chipy HUD 6C na brand-ikonach** — medalion+etykieta PL+wartość+przyrost (`gra/src/ui/hudChip6c.ts`) | Design System 1E, rozbudowywane cały lipiec | Górny pasek zasobów, panel imperium, panel miasta | Nadal **NIE korzysta z komponentu chip6c** jako całości (własny Canvas 2D) — ale **[KOREKTA 2026-08-06]** glif produkcji od `bf5b4ea` renderuje realne SVG ikon budynków/jednostek z brand assets (`setCityMapBadgeProdIcon`), więc nie jest już „odcięty od systemu ikon" w 100% |
| **Dopisek „· miasto-państwo"** dla kopii-typu klastra | FALA 6.2, 2026-07-24 (`R-MP-PORTRET`) | Etykiety w dyplomacji/bitwie (`formatOwnerDiploLabel`) | TAK, pigułka to pokazuje (`formatCityMapLabel`) — pozostaje aktualne. Próg obcinania nazwy: **[KOREKTA 2026-08-06]** nie „~220px" tylko `maxNameW = 200px − prodW − growthW` |

---

## 4. DANE, KTÓRE PIGUŁKA MIASTA POWINNA POKAZYWAĆ — ⚠️ ZAKRES ZATWIERDZONY I WDROŻONY, poniżej jako zapis historyczny

**[NIEAKTUALNE od 2026-08-04 — punkty 1-3 i 4-5 poniżej SĄ już zaimplementowane, patrz `DO-WKLEJENIA-DESIGN-V2-2026-08-06.md` sekcja 1.]** Ten punkt listy pierwotnie był propozycją otwartą do decyzji — Maciej ją zatwierdził (§4 addendum niżej, Q2=C) i kod ją zrealizował. Zostawiam oryginalne uzasadnienia jako kontekst „dlaczego", ale kolumna „co jeszcze nie istnieje” jest już nieaktualna dla punktów 1., 2., 3., 4., 5.

**MUST (kluczowe dla decyzji „które miasto atakować / bronić / rozwijać" bez klikania każdego z osobna):**
1. Nazwa + populacja — zostaje (działa, potwierdzone mockupem).
2. **Wskaźnik obrony miasta** — minimum 3 stany: brak muru / mur (+200%) / mur+Cytadela (+300%). **[ZROBIONE `b45113b`/`eeeaa2b`, 2026-08-04]** — z zastrzeżeniem: Mury i Mury+Cytadela dziś wyglądają identycznie (jedna „złota” tarcza), a Baszta (+100% dodatkowo, realne maksimum +400%) nie ma żadnej reprezentacji — patrz dokument v2 sekcja 2.
3. Ikona właściciela/cywilizacji zamiast dzisiejszej generycznej gwiazdki. **[ZROBIONE `b45113b`+`8588cb7`, 2026-08-04/05]** — medalion z portretem władcy (gracz+AI major) albo sygnetem kultury (miasta-państwa).

**NICE (wartość informacyjna wysoka, ale można rozważyć jako stan hover/zoom zamiast always-on):**
4. Sygnał „w produkcji" — co najmniej ikona kategorii (budynek/jednostka/cud). **[ZROBIONE `bf5b4ea` always-on glif 2026-08-05 + `c36bbea` hover kategoria/nazwa 2026-08-06]**
5. Sygnał ostrzegawczy surowców — pojedyncza ikonka ostrzegawcza gdy produkcja miasta jest zablokowana brakiem surowca. **[ZROBIONE `c36bbea`, hover, 2026-08-06]** — binarne ostrzeżenie, bez wskazania konkretnego surowca.
6. Spójność z rewoltą — `_syncRevolt` w `cities.ts` ma osobny efekt wizualny dla buntu miasta; **nadal AKTUALNE/otwarte** — revolt i pigułka pozostają dwoma niezależnymi obiektami w scenie, nie zintegrowanymi wizualnie. Poza zakresem obecnej paczki `R-DESIGN-PANEL-MIASTA-V2-Q1=C`.

**Do wyjaśnienia z Design, nie do rozstrzygnięcia w tym dokumencie:**
- Czy elementy 2–6 mają być **zawsze widoczne** (ryzyko zagracenia pigułki przy dużym zoom-out, wiele miast na ekranie) czy **progresywne** (np. tylko przy hover/zbliżeniu — analogicznie do reszty gry, gdzie `hoverDetailDock.ts` dostarcza bogatszy widok na żądanie). Zalecenie: Design dostarcza OBA warianty (always-on „skrócony" + hover „rozszerzony"), decyzję podejmie Maciej na podglądzie.
- Czy przenieść rysowanie pigułki z ręcznego Canvas 2D na system ikon brand (`brandIconSvg`/`mapResourceIconSvg`) — to pytanie techniczne do integratora, ale wpływa na to, jakie assety Design powinien dostarczyć (SVG do wektorowego renderu vs. bitmapy do wpalenia w Canvas).

### §4 addendum — decyzja Macieja 2026-08-04 (R-DESIGN-PANEL-MIASTA Q1A Q2C Q3A)

**Zatwierdzony zakres (Q2=C):**

| Warstwa | Elementy |
|---------|----------|
| **Always-on MUST** | Nazwa + populacja · 3 stany obrony (brak muru / mur / mur+Cytadela) · ikona cywilizacji |
| **Hover rozszerzony** (obowiązkowy deliverable) | Kategoria produkcji (budynek/jednostka/cud) · ostrzeżenie surowców (blokada produkcji / cap magazynu) |

**Deliverable Design — 3 klatki** (nie 2):
1. **Baseline** — spokój, brak muru, brak produkcji.
2. **Pełny MUST** — always-on: mur+Cytadela, ikona cywu, nazwa+pop.
3. **Hover rozszerzony** — MUST + kategoria produkcji + ostrzeżenie surowców.

**Kolejność pracy (Q1=A, Q3=A):** Design dostarcza makieta v2 do `docs/ux/claude-design/_dist/...` → **dopiero wtedy** kod (`działaj`); deploy osobno, nie blokuje FALA 207.

Pełny ECHO: `docs/decyzje/R-DESIGN-PANEL-MIASTA.md`.

**[AKTUALIZACJA 2026-08-06]** Ten zakres (3 klatki: Baseline / Pełny MUST / Hover rozszerzony) pozostaje
obowiązujący — to jest właśnie deliverable `R-DESIGN-PANEL-MIASTA-V2-Q1=C`. Jedyna zmiana: wszystkie 3
klatki opisują funkcje, które **już działają w grze dziś** (nie „zaraz będą działać"), więc Design projektuje
polish istniejącego renderu, nie funkcję w budowie. Pełna, zweryfikowana specyfikacja tych 3 klatek z
dokładnymi wymiarami: `DO-WKLEJENIA-DESIGN-V2-2026-08-06.md` sekcja 4.

---

## 5. OGRANICZENIA TECHNICZNE (żeby Design projektował w realnych ramach)

- To **sprite billboard w scenie 3D** (Three.js `Sprite` z `CanvasTexture`), nie element DOM/HTML — inaczej niż reszta UI (HUD, panel miasta, dyplomacja), które są klasycznym HTML/CSS. Każdy nowy element musi dać się wyrenderować jako bitmapa lub jako osobny sprite/warstwa doklejona do tej samej pozycji świata.
- Musi zostać czytelne przy dużym zoom-out (widok całej mapy z wieloma miastami naraz) — dziś nawet sama nazwa+populacja zajmuje sporo miejsca; dokładanie kolejnych ikon bez hierarchii ważności (patrz pytanie o progressive disclosure w sekcji 4) grozi nieczytelnością.
- Cache tekstur działa po kluczu `cityMapBadgeKey(nazwa, populacja)` (`cityMapStatChip.ts:105-108`) — jeśli nowy design ma więcej zmiennych stanów (obrona, produkcja, ostrzeżenie surowców), integrator musi rozszerzyć klucz cache o te wymiary, inaczej stan się nie odświeży przy zmianie. To informacja dla integratora, nie blokada dla Design, ale warto, żeby projektując stany, Design policzył ile realnych kombinacji wizualnych powstaje (żeby oszacować koszt regeneracji tekstur).
- Obwódka heksu (`cityMapOutline.ts`) już dziś koduje właściciel/wojna kolorem pierścienia — nowy design nie musi tego duplikować w pigułce, może się do tego odwołać jako do istniejącej warstwy.

---

## 6. FORMAT ODDANIA — ⚠️ ZASTĄPIONE, patrz `DO-WKLEJENIA-DESIGN-V2-2026-08-06.md` sekcja 8

**[NIEAKTUALNE — użyj dokumentu v2]** Sekcja niżej to oryginalny format z 2026-07-25 (m.in. folder zapisu
datowany `-2026-07-25`, punkt wyjścia „zrzut z playtestu 2026-07-25”). **Aktualny, obowiązujący format
oddania — z aktualnym folderem zapisu (`-2026-08-06`), listą commitów-referencji zamiast starego zrzutu
i wymogiem listy brakujących assetów — jest w `DO-WKLEJENIA-DESIGN-V2-2026-08-06.md` sekcja 8.** Treść
niżej zostaje wyłącznie dla historii zlecenia.

- **Punkt wyjścia dla Design:** ten dokument + stary mockup (sekcja 2) + realny zrzut ekranu gry z playtestu Macieja 2026-07-25 (dołączony w rozmowie z Maciejem — poproś go bezpośrednio, nie ma kopii w repo).
- **Deliverable:** nowa makieta `.dc.html`, np. `The Game - HUD Miasto na mapie v2 (1E).dc.html`, **3 klatki** (decyzja Maciej 2026-08-04, Q2=C):
  1. Stan spokoju — brak muru, brak produkcji w toku (baseline).
  2. Stan „pełny MUST" — always-on: mur+Cytadela, ikona cywu, nazwa+pop.
  3. Stan hover rozszerzony — MUST + kategoria produkcji + ostrzeżenie surowców.
- **Styl:** 1E (Painted Imperial), tokeny wyłącznie z `eksport/tokens.css` / `brand-book/` (spójne z resztą kanonu — złoto `#e8d88a`, tła grafitowe, Georgia na nazwach).
- **Zapis:** wg utartej struktury `docs/ux/claude-design/_dist/<NAZWA>-2026-07-25/brand-book/KANON/mockupy/` + aktualizacja `CANON.md` i huba, zgodnie z konwencją z poprzednich zleceń (`docs/ux/claude-design/DO-DESIGN-2026-07-23/DYSPOZYCJA-DLA-DESIGN-TURA-2.md`).
- **Po dostarczeniu:** integrator aktualizuje `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (status `R-DESIGN-PANEL-MIASTA-V2-Q1`) i wdraża w `gra/src/render/cityMapStatChip.ts` / `cityMapOutline.ts` / `render/cities.ts`.
