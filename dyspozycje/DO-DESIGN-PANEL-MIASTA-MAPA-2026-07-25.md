# DYSPOZYCJE DLA DESIGNERA — panel/kafelek miasta na mapie świata (odświeżenie)

**Zgłoszenie:** `R-DESIGN-PANEL-MIASTA` (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`) · Maciej, playtest 2026-07-25, ze zrzutem ekranu: „tak samo panel widoku miast na mapie głównej jest przestarzały."
**Od:** integrator (sesja chmurowa) · **Zatwierdza:** Maciej
**Ten dokument = ZLECENIE z faktami (stan kodu + rozbieżności).** Nie zawiera propozycji grafiki — to robi Design.

---

## 0. Zakres — o co DOKŁADNIE chodzi

Chodzi wyłącznie o element widoczny **na mapie świata, przy każdym mieście, cały czas** (nazwa + populacja w złotej pigułce, unosząca się nad miastem) — **NIE** o pełny panel miasta (Ekran „Miasto W3", otwierany po kliknięciu/wejściu w miasto — ten ma swoją osobną, nowszą linię mockupów i NIE jest tu ruszany).

Innymi słowy: różnica między „miniaturką na mapie" a „pełnym dashboardem miasta po otwarciu". Ten dokument dotyczy wyłącznie miniaturki.

---

## 1. STAN W GRZE DZIŚ (kod, nie mockup)

Element składa się z **dwóch niezależnych warstw 3D**, sklejanych nad heksem miasta w `gra/src/render/cities.ts` (`_syncStatChip` + `_syncMapOutline`):

### 1a. Pigułka nazwa+populacja — `gra/src/render/cityMapStatChip.ts`
Rysowana ręcznie na `<canvas>` (nie DOM/HTML, nie system ikon brand), potem jako tekstura sprite'a Three.js unoszącego się nad modelem miasta (`worldH=0.48` świata, billboard, zawsze zwrócona do kamery).

Zawartość — **dokładnie dwie dane**:
- **Nazwa miasta**, WERSALIKAMI, font Georgia/serif, kolor `#f4f0e8`. Jeśli miasto to kopia-typu klastra (miasto-państwo), doklejony jest dopisek „ · miasto-państwo" (`formatCityMapLabel`, `gra/src/game/display-names.ts:60`) — wydłuża nazwę.
- **Populacja** w złotym kółku Ø30px (`#e8d88a`), liczba czarna wewnątrz.

Tło: zaokrąglona pigułka, gradient grafitowy `rgba(16,22,34,.96)→rgba(8,10,16,.94)`, obwódka złota 2px `rgba(232,216,138,.72)`.
Nazwa jest obcinana (`truncateName`) jeśli przekracza ~220px szerokości — przy długich nazwach + dopisku „miasto-państwo" realnie się to zdarza.

### 1b. Obwódka heksu — `gra/src/render/cityMapOutline.ts`
Podwójny pierścień linii wokół heksu miasta: wewnętrzny w kolorze cywilizacji-właściciela (opacity 0.92), zewnętrzny też w kolorze cywilizacji (0.52) — **chyba że miasto jest w stanie wojny z graczem**, wtedy zewnętrzny zmienia się na czerwony (`0xff4444`, opacity 0.55). To jedyny inny sygnał wizualny na mapie poza pigułką.

### Co NIE jest pokazane — potwierdzone w kodzie
Grep po całym `gra/src/render/` i `gra/src/ui/` potwierdza: żadna z poniższych informacji nie trafia do pigułki ani do obwódki:
- produkcja / kolejka budowy w mieście,
- mury / obrona (procentowa),
- surowce miasta / magazyn,
- ikony brand-systemu (`brandIconSvg`, `chip6c`) — pigułka jest osobnym, ręcznie rysowanym mechanizmem, wizualnie i technicznie odciętym od reszty reskinowanego UI.

(Dla porównania: hex-tooltip po kliknięciu pola — `gra/src/ui/hexContextTooltip.ts` — pokazuje bogaty rozkład plonów terenu i nazwę miasta jako jedną linijkę, ale to osobny element UI, kontekstowy, nie „wisi" przy mieście na mapie i też nie pokazuje obrony/surowców miasta.)

---

## 2. STARY MOCKUP DESIGN (referencja) — i dlaczego już wtedy było mało

Plik: `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/The Game - HUD Miasto wybrane (1E).dc.html`, linie 16–18 (fragment „wybrane miasto na mapie").

Datowanie: plik pochodzi z paczki Design z **2026-07-04** (najstarsze zachowane makiety HUD mapy; do repo dowieziony dopiero 2026-07-23 jako część odzyskiwania zaległych plików — patrz `docs/ux/AUDYT-MOCKUPOW-2026-07-23.md`).

Mockup pokazuje: żółtą gwiazdkę + `RZYM` (wersaliki, Georgia) + złote kółko z liczbą `4` (populacja) + przerywany pierścień selekcji dookoła.

**Wniosek: gra dziś realizuje ten mockup niemal 1:1** (ta sama para danych: nazwa + populacja, ten sam układ pigułki, ten sam styl). Różnica jest kosmetyczna (dashed-circle selekcji w mockupie vs. podwójny hex-ring właściciela/wojny w grze).

To znaczy: **problem nie jest w rozjeździe „mockup vs. implementacja"** (są zsynchronizowane) — problem jest w tym, że **od 2026-07-04 minęły ~3 tygodnie intensywnego rozwoju gry, a ten konkretny element HUD nie ruszył się ani razu**. Mockup i gra zestarzały się razem.

---

## 3. CO DOSZŁO DO GRY OD TAMTEJ PORY (i pigułka tego nie pokazuje)

| Nowość | Kiedy / kanon | Gdzie żyje dziś w UI | Widoczne w pigułce miasta na mapie? |
|---|---|---|---|
| **Obrona procentowa** — mur samodzielnie **+200%**, mur+Cytadela **+300%** (łącznie x3.0 / x4.0 obrony bazowej) | Kanon Maciej 2026-07-25 (`gra/src/game/siege.ts:23-24`, `combat.ts:268`, `main.ts:11268-11304`) | Wynik walki/oblężenia (silnik); wall-integrity % **tylko podczas realnego oblężenia** w `siegeHud1E.ts`; model 3D miasta zmienia geometrię przy `maMur=true` | **NIE** — brak jakiejkolwiek ikony/wartości; gracz nie widzi na mapie, które miasto ma mur/Cytadelę bez wejścia w panel lub rozpoczęcia oblężenia |
| **Surowce + magazyny państwa** — cap 500 + 100×(liczba Magazynów), pula wspólna imperium | FALA 6, 2026-07-24 (`R-MAGAZYN-500`, `R-HUD-SUROWCE`) | Chip „Surowce" w górnym HUD + osobna zakładka magazynu w panelu imperium (`empireDetailPanel.ts`) + paski surowców w panelu miasta (budowa/rekrutacja) | **NIE** — pigułka nie sygnalizuje ani czy miasto ma zbudowany Magazyn, ani niedoboru surowca blokującego produkcję |
| **Ikony surowców v4** — 12 nowych ikon brand (`res-brick`, `res-bronze`, `res-copper-ore`, `res-iron-ore`, `res-steel`, `res-ceramics`…), koniec interimowego kolorowania | FALA 6, 2026-07-24 (`R-IKONY-SUROWCE-V4`) | `gra/src/ui/icons/brand/resources-map/*.svg`, resolver `mapResourceIconSvg()` w `brandAssets.ts`, użyte w HUD/panelu miasta/tooltipie heksu | Pigułka miasta w ogóle **nie korzysta z systemu ikon brand** — jest osobnym mechanizmem Canvas 2D, więc żaden z tych 12 symboli nie jest tam nawet potencjalnie dostępny bez przepisania |
| **Chipy HUD 6C na brand-ikonach** — medalion+etykieta PL+wartość+przyrost (`gra/src/ui/hudChip6c.ts`) | Design System 1E, rozbudowywane cały lipiec | Górny pasek zasobów, panel imperium, panel miasta | Pigułka mapy nie używa tego komponentu — stylistycznie i technicznie jest odrębna wyspa w UI, mimo że reszta gry ujednoliciła się na chipach 6C |
| **Dopisek „· miasto-państwo"** dla kopii-typu klastra | FALA 6.2, 2026-07-24 (`R-MP-PORTRET`) | Etykiety w dyplomacji/bitwie (`formatOwnerDiploLabel`) | **TAK, ale problematycznie** — pigułka już to pokazuje (`formatCityMapLabel`), lecz wydłuża nazwę do granicy obcinania (`truncateName` na ~220px) |

---

## 4. DANE, KTÓRE PIGUŁKA MIASTA POWINNA POKAZYWAĆ — propozycja zakresu (do decyzji Design/Maciej, nie do samodzielnego zaprojektowania przeze mnie)

Uzasadnienie każdego punktu wynika wprost z sekcji 3 — to nie są życzenia estetyczne, tylko realne systemy gry bez żadnej reprezentacji na mapie dziś.

**MUST (kluczowe dla decyzji „które miasto atakować / bronić / rozwijać" bez klikania każdego z osobna):**
1. Nazwa + populacja — zostaje (działa, potwierdzone mockupem).
2. **Wskaźnik obrony miasta** — minimum 3 stany: brak muru / mur (+200%) / mur+Cytadela (+300%). To najświeższy mechanizm bojowy w grze (wczoraj, 2026-07-25) i dziś jest kompletnie niewidoczny na mapie — gracz planujący atak nie ma jak ocenić trudności celu bez otwarcia panelu miasta.
3. Ikona właściciela/cywilizacji zamiast dzisiejszej generycznej gwiazdki — dziś każde miasto (gracz, sojusznik, wróg, miasto-państwo) ma identyczną ikonę w pigułce; jedyne odróżnienie to kolor obwódki heksu, łatwy do przeoczenia przy zoom-out.

**NICE (wartość informacyjna wysoka, ale można rozważyć jako stan hover/zoom zamiast always-on):**
4. Sygnał „w produkcji" — co najmniej ikona kategorii (budynek/jednostka/cud), opcjonalnie tury do końca. Dziś jedyny sposób sprawdzenia to wejście w każde miasto z osobna.
5. Sygnał ostrzegawczy surowców — nie pełna lista (za dużo danych na małą pigułkę), tylko pojedyncza ikonka ostrzegawcza (np. `chip-warning`) gdy produkcja miasta jest zablokowana brakiem surowca lub magazyn imperium bliski capu.
6. Spójność z rewoltą — `_syncRevolt` w `cities.ts` już ma osobny efekt wizualny dla buntu miasta; sprawdzić, czy powinien być też sygnalizowany na samej pigułce (dziś efekt revolt i pigułka to dwa niezależne obiekty w scenie, niepewne czy wizualnie się uzupełniają czy kolidują).

**Do wyjaśnienia z Design, nie do rozstrzygnięcia w tym dokumencie:**
- Czy elementy 2–6 mają być **zawsze widoczne** (ryzyko zagracenia pigułki przy dużym zoom-out, wiele miast na ekranie) czy **progresywne** (np. tylko przy hover/zbliżeniu — analogicznie do reszty gry, gdzie `hoverDetailDock.ts` dostarcza bogatszy widok na żądanie). Zalecenie: Design dostarcza OBA warianty (always-on „skrócony" + hover „rozszerzony"), decyzję podejmie Maciej na podglądzie.
- Czy przenieść rysowanie pigułki z ręcznego Canvas 2D na system ikon brand (`brandIconSvg`/`mapResourceIconSvg`) — to pytanie techniczne do integratora, ale wpływa na to, jakie assety Design powinien dostarczyć (SVG do wektorowego renderu vs. bitmapy do wpalenia w Canvas).

---

## 5. OGRANICZENIA TECHNICZNE (żeby Design projektował w realnych ramach)

- To **sprite billboard w scenie 3D** (Three.js `Sprite` z `CanvasTexture`), nie element DOM/HTML — inaczej niż reszta UI (HUD, panel miasta, dyplomacja), które są klasycznym HTML/CSS. Każdy nowy element musi dać się wyrenderować jako bitmapa lub jako osobny sprite/warstwa doklejona do tej samej pozycji świata.
- Musi zostać czytelne przy dużym zoom-out (widok całej mapy z wieloma miastami naraz) — dziś nawet sama nazwa+populacja zajmuje sporo miejsca; dokładanie kolejnych ikon bez hierarchii ważności (patrz pytanie o progressive disclosure w sekcji 4) grozi nieczytelnością.
- Cache tekstur działa po kluczu `cityMapBadgeKey(nazwa, populacja)` (`cityMapStatChip.ts:105-108`) — jeśli nowy design ma więcej zmiennych stanów (obrona, produkcja, ostrzeżenie surowców), integrator musi rozszerzyć klucz cache o te wymiary, inaczej stan się nie odświeży przy zmianie. To informacja dla integratora, nie blokada dla Design, ale warto, żeby projektując stany, Design policzył ile realnych kombinacji wizualnych powstaje (żeby oszacować koszt regeneracji tekstur).
- Obwódka heksu (`cityMapOutline.ts`) już dziś koduje właściciel/wojna kolorem pierścienia — nowy design nie musi tego duplikować w pigułce, może się do tego odwołać jako do istniejącej warstwy.

---

## 6. FORMAT ODDANIA (konwencja jak w poprzednich paczkach DO-DESIGN)

- **Punkt wyjścia dla Design:** ten dokument + stary mockup (sekcja 2) + realny zrzut ekranu gry z playtestu Macieja 2026-07-25 (dołączony w rozmowie z Maciejem — poproś go bezpośrednio, nie ma kopii w repo).
- **Deliverable:** nowa makieta `.dc.html`, np. `The Game - HUD Miasto na mapie v2 (1E).dc.html`, minimum **2 klatki**:
  1. Stan spokoju — brak muru, brak produkcji w toku (baseline).
  2. Stan „pełny" — mur+Cytadela, produkcja w toku, ostrzeżenie surowca — żeby integrator zobaczył od razu wszystkie stany naraz, nie musiał się domyślać.
  Jeśli Design zdecyduje się na wariant progresywny (hover) — dodatkowa 3. klatka pokazująca stan rozszerzony.
- **Styl:** 1E (Painted Imperial), tokeny wyłącznie z `eksport/tokens.css` / `brand-book/` (spójne z resztą kanonu — złoto `#e8d88a`, tła grafitowe, Georgia na nazwach).
- **Zapis:** wg utartej struktury `docs/ux/claude-design/_dist/<NAZWA>-2026-07-25/brand-book/KANON/mockupy/` + aktualizacja `CANON.md` i huba, zgodnie z konwencją z poprzednich zleceń (`docs/ux/claude-design/DO-DESIGN-2026-07-23/DYSPOZYCJA-DLA-DESIGN-TURA-2.md`).
- **Po dostarczeniu:** integrator aktualizuje `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (status `R-DESIGN-PANEL-MIASTA`) i wdraża w `gra/src/render/cityMapStatChip.ts` / `cityMapOutline.ts` / `render/cities.ts`.
