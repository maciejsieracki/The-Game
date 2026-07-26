# DO DESIGN — ekran Badań (panel boczny „hub nauki" + porządki w KANON)

**Kontekst (Maciej, zrzut ekranu 2026-07-25):** *„do poprawy jest w Designerze wygląd
mockupu badań. On jest przestarzały. Drzewko technologii już jest dawno wymienione."*

**Recon kodu (poniżej) doprecyzowuje diagnozę:** pełnoekranowy GRAF drzewa technologii
faktycznie już NIE jest problemem — makieta „Drzewko technologii siatka v1.1 (1E)"
(2026-07-23) jest wdrożona w grze 1:1, zgadza się. Przestarzały jest **inny, starszy
plik** — `The Game - Ekran Badania (1E).dc.html` z **2026-07-01** — który wciąż siedzi
w `CANON.md` i w hubie START jako pozycja bez adnotacji „(stare)" (w przeciwieństwie do
sąsiedniego „graf v1", który TAKĄ adnotację ma). To on jest tym, co Maciej widzi w
Designerze jako „przestarzały mockup badań". Dodatkowo: panel boczny „Badania" (dokowany
po lewej, z którego gracz realnie dziś korzysta) **nigdy nie miał żadnej makiety Design**
— zbudowany wprost w kodzie, a wczoraj (2026-07-25) doszła mu spora nowa funkcja (kolejka
badań + drag&drop), więc rozjazd tylko się pogłębił.

---

## 0. Skrót — co jest przestarzałe, a co nie

| Ekran | Makieta Design | Stan w kodzie |
|---|---|---|
| Pełnoekranowy graf drzewa („Drzewko technologii") | ✅ aktualna — siatka v1.1, 2026-07-23 | ✅ wdrożone 1:1 (`techTreeView.ts`) — **nie wymaga nowego zlecenia** |
| Panel boczny „Badania" (hub, lista, plan badań) | ❌ **brak jakiejkolwiek makiety** | ✅ w grze, ale styl „z ręki" inżyniera, nie Design |
| Plik `Ekran Badania (1E).dc.html` (2026-07-01) | ❌ przestarzały, ale nadal wpisany w `CANON.md`/hub jako obowiązujący, bez etykiety „stare" | — nie odpowiada żadnemu dzisiejszemu ekranowi gry |
| Kolejka badań (1–3, drag&drop) | ❌ nie istnieje w ŻADNEJ makiecie | ✅ w kodzie od 2026-07-25 (tylko panel boczny) |

---

## 1. Stan faktyczny w grze DZIŚ (z kodu, nie z pamięci)

W grze istnieją dziś **trzy** powierzchnie UI związane z badaniami:

### A) Panel boczny „Badania" — `gra/src/ui/scienceHubHud.ts` (486 linii)

| | |
|---|---|
| Wejście | przycisk „Nauka" na dolnym pasku (`gra/src/ui/mapToolbarHud.ts`, `data-act="science"`, title „Badania") |
| Pozycja/rozmiar | dokowany do lewej krawędzi: `position:fixed; top:56px; left:calc(58px+10px); bottom:calc(56px+2mm); width:min(24vw,340px)` |
| System budowy | czysty DOM + lokalny `<style>` wstrzykiwany raz (`ensureStyles()`), nie komponent Design |

Zawartość, od góry (dokładnie jak w kodzie):
1. Nagłówek „Badania" (ikona sowy) + przycisk zamknij (X, Esc).
2. Blok postępu aktywnego celu: ikona technologii + nazwa, linia „Pula: *X* / *Y* PN · *Z*% ·
   ETA *N* tur · +*R* PN/t", pasek postępu. Stan pusty: „Wybierz technologię z listy poniżej".
3. Złoty przycisk „Drzewko technologii" → otwiera pełnoekranowy graf (B). *(Uwaga historyczna:
   do 2026-07-24 był tu DRUGI, niebieski przycisk „Pełne drzewko technologii" — usunięty
   commitem `6492b30`, „graf epok" przemianowany na „Drzewko technologii". Dziś jest już
   tylko jeden przycisk.)*
4. **NOWY panel (2026-07-25, commit `9be8bce`) „Plan badań (n/3)"** — kolejka do 3 technologii:
   - stan pusty: „Pusty — kliknij technologię na liście lub w drzewku, by dodać do planu."
   - 1–3 wiersze: okrągły złoty numerek pozycji (1/2/3), nazwa technologii, przycisk „×" (usuń);
     pozycja 1 = aktywny cel, wyróżniona ramką/tłem
   - **przeciąganie (drag&drop)** do zmiany kolejności — stany wizualne `dragging` (rząd
     przeciągany, półprzezroczysty) i `drop-target` (rząd docelowy, podświetlona ramka)
5. Lista „Możesz wybrać (N)" — wiersz: ikona technologii (jedna z 32 gotowych SVG, patrz §1.2),
   nazwa, linia „koszt PN · epoka", linia odblokowań („Odblok.: ..."). **Klik = dodaj do planu**
   (od 2026-07-25 to już nie jest „ustaw jako cel od razu", tylko enqueue — zgodnie z decyzją
   C-RES-Q1=C). Jeśli technologia jest już w planie, wiersz dostaje ten sam złoty numerek 1/2/3
   po prawej stronie.
6. Sekcja „Wkrótce (zablokowane)" — do 4 zablokowanych technologii: ikona kłódki, nazwa, powód
   blokady wypisany wprost (np. „brak: Rolnictwo"). Klik = otwiera widok (C), przewinięty do
   tego węzła.
7. Podpowiedź na dole: „Klik tech na liście lub w drzewku = dodaj do planu (do 3). Przeciągnij
   pozycję w planie, by zmienić kolejność. Esc zamyka hub (najpierw drzewko)."

### B) Pełnoekranowy graf „Drzewko technologii" — `gra/src/ui/techTreeView.ts` (1078 linii)

To jest **wdrożona 1:1 makieta „The Game — Drzewko technologii siatka v1.1 (1E)"**
(2026-07-23, decyzja Macieja o usunięciu krawędzi) — komentarz na górze pliku wprost cytuje
nazwę i decyzję. **Ten ekran JEST aktualny i nie wymaga nowego zlecenia.**

- Wejście: złoty przycisk z (A.3).
- Nagłówek: „Badania — drzewo technologii" + podtytuł „Kamień → Brąz → Żelazo · oś: Poziom
  1–9 · bramki AND · zależności opisowo (bez krawędzi)".
- 3 pasma epok w poziomie: Kamień | Brąz | Żelazo, kolumny wg pola „Poziom" (1–9),
  32 węzły (z `gra/data/tech.json` — patrz §1.2).
- 4 stany węzła: odkryta (✓ złoty) / dostępna (chevron, klikalna, poświata) / w trakcie
  (pierścień % postępu) / zablokowana (kłódka + **powód wypisany wprost na węźle**, np.
  „brak: Wymiana · wymaga budynku: Targowisko").
- Najechanie = karta (tooltip): ikona + nazwa + odznaka epoka/poziom, gwiazdka „★ kończy
  epokę/awansuje" jeśli dotyczy, wiersz koszt/postęp (z uwzględnieniem tempa gry i
  poziomu trudności), wiersz „Wymaga" — chipy AND ✓/✗ (technologie + ew. wymagany budynek/
  ulepszenie terenu), wiersz „Odblokowuje" — chipy budynków/jednostek/surowców/terenu.
- **Świadomie BEZ linii/krawędzi** między węzłami — to jest decyzja produktowa Macieja
  z 2026-07-23 (krawędzie były nieczytelne przy 32 węzłach), nie przeoczenie.
- Nawigacja: zoom (scroll/przyciski), pan (przeciąganie), minimapa w prawym dolnym rogu,
  przyciski „skok do epoki" na górze.
- Klik na dostępny węzeł = **od razu START badania** (z modalem potwierdzenia „Zmiana celu
  badań", jeśli zmienia trwający cel) — **NIE dodaje do kolejki planu z (A.4)**, mimo że
  decyzja C-RES-Q1=C (2026-07-25) mówi „oba miejsca [lista i drzewko] współdzielą kolejkę".
  To luka **inżynierska**, nie luka makiety — commit wdrażający kolejkę wprost mówi
  „silnik kolejki nietknięty; techTreeView i ai.ts poza zakresem". Siatka v1.1 nie musi być
  przez to przerabiana teraz, ale nowa makieta panelu bocznego (zlecenie w §3) powinna
  z góry przewidzieć, jak numerek kolejki ma wyglądać NA węźle siatki v1.1 — żeby integrator
  miał gotowy wzór, gdy dorobi tę funkcję w silniku.

### C) Legacy „drzewko zadokowane, z krawędziami" — `gra/src/ui/sciencePicker.ts` (1421 linii)

Fakt do wiedzy, **NIE część tego zlecenia** — ale wart odnotowania, bo jest wizualnie
sprzeczny z (B):

- Wejście: klik zablokowanej technologii w sekcji „Wkrótce" panelu bocznego (A.6).
- Osobny, starszy komponent — renderuje drzewo jako SVG **z liniami/krawędziami** między
  węzłami (funkcja `routeEdges()`) — czyli dokładnie to, co decyzja z 2026-07-23 usunęła
  z widoku (B). To pozostałość sprzed tamtej decyzji, wciąż aktywna w grze.
- Otwiera się jako przyciemniony overlay obok panelu bocznego (mapa lekko przygaszona),
  przewinięty/wyśrodkowany na wskazanym węźle.
- Pytanie otwarte do Macieja w §4 (Q2) — czy ujednolicić z (B), zostawić, czy przeprojektować.

### 1.2 Dane i assety źródłowe (gotowe, nie projektować od nowa)

- `gra/data/tech.json` — **32 technologie**: Kamień 12 / Brąz 12 / Żelazo 8, rozłożone na
  **9 poziomów** („Poziom" 1–9, nie 4 kolumny K0/K1/B0–B3 jak w starym mockupie).
- Ikony technologii — **komplet 32 SVG już dostarczony przez Design** (2026-07-23,
  „Zlecenie 7" w `WYMIANA-UI-DESIGN.md`): `eksport/icons/tech/tech-<slug>.svg` +
  `eksport/tech-icon-map.json` (klucz = id z tech.json). Używane już w (A) i (B).
- Paleta/tokeny 1E: `eksport/tokens.css` — złoto `#e8d88a` jako jedyny akcent, Georgia/serif
  na tytuły, Segoe UI na treść. Widok (B) już z tego korzysta w 100%.

---

## 2. Stary mockup — dokładnie co i dlaczego jest przestarzałe

**Plik:** `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/The Game -
Ekran Badania (1E).dc.html`

- **Data: 2026-07-01** (zadanie D1-5, pierwsza tura Design w projekcie) — najstarszy mockup
  związany z badaniami w całym KANON, sprzed 3,5 tygodnia zmian w grze.
- Wciąż wpisany jako obowiązujący: `CANON.md` wiersz „Badania" (bez adnotacji), oraz karta
  w hubie `START - KANON aktualny (1E).dc.html` — trzecia karta w sekcji „Ekrany pełne",
  tytuł „Badania" / opis „drzewko technologii", **bez etykiety „(stare)"** — w
  przeciwieństwie do sąsiedniej karty „Badania · graf v1 (stare)" / „zastąpione przez v1.1",
  która TAKĄ etykietę ma. To dlatego w Designerze wygląda, jakby ten plik wciąż był aktualny.
- Zamysł z log-a `WYMIANA-UI-DESIGN.md` (wpis 2026-07-23): miał zostać jako „panel wyboru
  badań" — czyli koncepcyjny odpowiednik dzisiejszego panelu bocznego (A). Ale jego
  **rzeczywista treść to pełnoekranowa siatka dwukolumnowa 1920×1080**, nie boczny dokowany
  panel 340px — więc nawet w swojej intencji nie odpowiada dziś niczemu w grze.

### Rozbieżności punkt po punkcie (mockup pokazuje X, gra ma dziś Y)

| # | Mockup „Ekran Badania" (2026-07-01) | Gra dziś |
|---|---|---|
| 1 | 2 epoki: Kamień + Brąz | **3 epoki**: Kamień + Brąz + **Żelazo** (8 technologii) — Żelazo w mockupie nie istnieje w ogóle |
| 2 | Kolumny K0/K1 (Kamień), B0–B3 (Brąz) — 6 kolumn łącznie | Jednolity system „Poziom 1–9" przez wszystkie 3 epoki (siatka v1.1) |
| 3 | Paleta zielono-pomarańczowa (Kamień = zielony `#6aaa38`, Brąz = pomarańcz `#d08030`) | Paleta 1E złoto/granat (`#e8d88a`) — zielony nie występuje nigdzie w dzisiejszym ekranie badań |
| 4 | Jeden pasek „Obecnie badane" na górze, pojedynczy cel | Panel „Plan badań (n/3)" — **kolejka do 3 technologii**, numerki 1/2/3, drag&drop |
| 5 | Brak nawigacji (zoom/pan/minimapa) | (B) ma pełny zestaw: zoom, pan, minimapa, skok do epoki |
| 6 | Brak kart hover z wymaganiami/odblokowaniami | (B) ma kartę: chipy wymagań AND (✓/✗), chipy odblokowań budynek/jednostka/surowiec/teren |
| 7 | Layout: pełnoekranowa siatka dwukolumnowa | (A), realny „panel wyboru badań", to dokowany panel boczny 340px, lista pionowa — nie siatka |
| 8 | Brak ikon technologii (sam tekst) | 32 gotowe ikony SVG per technologia |
| 9 | Zero informacji o zablokowanych poza brakiem odznaczenia ✓ | (A) ma sekcję „Wkrótce" z wypisanym powodem; (B) ma powód wprost na węźle |

---

## 3. Zakres zlecenia — co ma dostarczyć Design

### 3.1 Deliverable główny: NOWA makieta panelu bocznego „Badania" (dziś zero makiety)

Wieloklatkowy `.dc.html`, styl 1E — tokeny WYŁĄCZNIE z `eksport/tokens.css`, spójny z
istniejącym widokiem (B) (ten sam system złota/kart/typografii — **nie projektować nowego
języka wizualnego**, tylko dociągnąć panel boczny do tego, co już obowiązuje w (B)).

Elementy, które MUSZĄ się znaleźć (źródło: kod §1.1.A, nic nie wymyślać ponad to):

1. Nagłówek „Badania" + blok postępu aktywnego celu (ikona, nazwa, pula/koszt PN, %, ETA,
   tempo PN/turę).
2. Przycisk wejścia do pełnoekranowego drzewa — spójny z (B), samo drzewo NIE wchodzi w
   zakres tego zlecenia (jest już gotowe, siatka v1.1).
3. **Panel „Plan badań (n/3)"** — kluczowa nowość bez istniejącej makiety:
   - stan pusty,
   - stan z 1–3 pozycjami: numerki 1/2/3, pozycja 1 = aktywna/wyróżniona, przycisk usuń (×),
   - stan „w trakcie przeciągania" (wiersz przeciągany + wiersz-cel upuszczenia).
4. Lista „Możesz wybrać" — wiersz: ikona tech, nazwa, koszt+epoka, linia odblokowań,
   opcjonalny numerek pozycji w planie (gdy tech jest w kolejce).
5. Sekcja „Wkrótce (zablokowane)" — wiersz: ikona kłódki, nazwa, powód blokady, przygaszony.
6. Stany hover / stan „to jest mój aktywny cel" (dziś jest w kodzie prowizorycznie — dociągnąć
   do 1E).

### 3.2 Deliverable poboczny: sprzątanie KANON (dosłanie, nie projektowanie)

- Oznaczyć `Ekran Badania (1E).dc.html` jako **„(stare)"** w karcie huba START — analogicznie
  do istniejącej karty „Badania · graf v1 (stare)" — oraz dopisać adnotację w `CANON.md`.
- Podmienić kartę „Badania" w hubie/`CANON.md` tak, by wskazywała na nową makietę panelu
  bocznego z §3.1 jako aktualny „panel wyboru badań" (rola, którą stary plik miał pełnić,
  ale wizualnie nigdy nie pełnił).

### 3.3 Konsystencja z (B) na przyszłość — jedna dodatkowa klatka

Zaprojektować (może być 1 dodatkowa klatka w tej samej paczce), jak numerek pozycji w
kolejce (1/2/3, ten sam styl co w panelu bocznym) powinien wyglądać **na węźle siatki v1.1**,
obok istniejącego badge'a stanu w rogu węzła (patrz §1.1.B, ostatni akapit) — to zamyka lukę
z decyzji C-RES-Q1=C i daje integratorowi gotowy wzór, gdy dorobi wpięcie kolejki do (B).
Nie wymaga przeprojektowania całej siatki — tylko dodatkowego elementu na istniejącym węźle.

---

## 4. Pytania do Macieja

**[TEMAT: Sprzątanie starego mockupu „Ekran Badania"]**
**ID: C-DESIGN-BADANIA-Q1**
**Sytuacja:** Plik z 2026-07-01 wciąż figuruje w `CANON.md` i hubie START bez etykiety
„stare", mimo że realnie nie odpowiada dzisiejszej grze (§2).
**Cel pytania:** ustalić, co ma się stać z plikiem/wpisem po dostarczeniu nowej makiety (§3.1).
**Dlaczego teraz:** żeby zlecenie do Design od razu zawierało jednoznaczną instrukcję sprzątania,
zamiast kolejnej rundy pytań po dostawie.

- **A — Oznaczyć „(stare)" i zostawić plik** (tak jak potraktowano „graf v1"). *Za:* spójne
  z istniejącą konwencją, tania operacja, zachowuje historię/ciągłość starych linków.
  *Przeciw:* w KANON zostają 3 pozycje „badania" zamiast 2, trochę bałaganu.
- **B — Usunąć wpis całkowicie** z `CANON.md` i huba (plik może zostać w repo, tylko bez
  linku). *Za:* czystszy hub. *Przeciw:* niespójne z tym, jak potraktowano „graf v1".
- **C — Nowa makieta PRZEJMUJE nazwę** „Ekran Badania (1E)" (nadpisuje plik/kartę), zero
  starego linku w ogóle. *Za:* zero śmieci w KANON. *Przeciw:* traci się historię tego, co
  było wcześniej (mniejszy problem, bo wersjonowanie jest w `_dist/`).

**Rekomendacja: A** — spójność z tym, jak już rozwiązano identyczny przypadek („graf v1").

**[TEMAT: Legacy „drzewko zadokowane z krawędziami" (sciencePicker.ts)]**
**ID: C-DESIGN-BADANIA-Q2**
**Sytuacja:** widok (C) w §1.1 renderuje drzewo Z liniami/krawędziami — dokładnie to, co
decyzja z 2026-07-23 usunęła z widoku (B). Dwa wizualnie sprzeczne systemy tego samego
konceptu (drzewo technologii) żyją dziś równolegle w grze.
**Cel pytania:** ustalić, czy to wchodzi w zakres tego zlecenia, czy zostaje osobnym tematem.
**Dlaczego teraz:** żeby Design wiedział, czy przy okazji tej paczki dotykać ten trzeci ekran.

- **A — Ujednolicić** z (B): ten sam system bez krawędzi, tylko przewinięty/wycentrowany na
  wskazanej technologii. *Za:* spójność wizualna, mniej kodu do utrzymania (jeden renderer
  zamiast dwóch). *Przeciw:* dodatkowa praca integratora (wymiana silnika renderowania), poza
  tym, co dziś zlecone.
- **B — Zostawić jak jest, osobne zadanie później.** *Za:* nie mnoży zakresu tej paczki,
  panel boczny + sprzątanie KANON dowożone szybciej. *Przeciw:* problem nazwany, ale nie
  rozwiązany — użytkownik wciąż zobaczy niespójność, jeśli kliknie zablokowaną technologię.
- **C — Nowa, uproszczona wersja „mini-focus" bez krawędzi** jako 3. deliverable tej paczki.
  *Za:* zamyka temat od razu. *Przeciw:* rozszerza zakres/czas dostawy głównego zlecenia (§3.1).

**Rekomendacja: B** — nie mnożyć zakresu tej paczki; panel boczny i porządek w KANON to
realny, pilny problem (to, co zgłosił Maciej), legacy-drzewko-z-krawędziami to osobny,
mniej pilny dług techniczny do jawnego zaplanowania później.

**[TEMAT: Numerki kolejki na siatce v1.1 — teraz czy później]**
**ID: C-DESIGN-BADANIA-Q3**
**Sytuacja:** §3.3 proponuje dorzucić 1 klatkę pokazującą wygląd numerka kolejki na węźle
siatki v1.1, mimo że silnik jeszcze nie wpina tam kolejki (luka inżynierska, nie designerska).
**Cel pytania:** czy zlecić to Designowi teraz (przy okazji), czy odłożyć.
**Dlaczego teraz:** tania decyzja, ale wpływa na zakres jednej paczki.

- **A — Teraz, razem z (3.1).** *Za:* integrator ma gotowy wzór, gdy dorobi wpięcie w
  silniku — brak kolejnej rundy z Designem za kilka dni. *Przeciw:* jedna dodatkowa klatka
  w paczce, która i tak nie jest jeszcze wpięta w kod.
- **B — Odłożyć**, osobne mikro-zlecenie gdy silnik będzie gotowy. *Za:* dziś zero pracy
  ponad to, co realnie widać w grze. *Przeciw:* kolejna, osobna runda z Designem później za
  coś bardzo małego.

**Rekomendacja: A** — koszt krańcowy jednej dodatkowej klatki jest niski, a oszczędza rundę
komunikacji później.

### Formularz odpowiedzi
- C-DESIGN-BADANIA-Q1: A (Rekomendacja) / B / C
- C-DESIGN-BADANIA-Q2: A / B (Rekomendacja) / C
- C-DESIGN-BADANIA-Q3: A (Rekomendacja) / B

---

## 5. Konwencja dostawy

Zgodnie z formatem poprzednich zleceń w tym repo (`DYSPOZYCJA-DLA-DESIGN-TURA-2.md`,
`POLECENIE-DESIGN-IKONY-SUROWCE-MIEJSKIE.md`, `DO-DESIGN-MODAL-WYBOR-HEKSA-2026-07-25.md`):

- **Format oddania:** ZIP → `_dist/<NAZWA>-2026-07-25/` zawierający `MANIFEST.txt` +
  `DYSPOZYCJA-WDROZENIE.md` + makieta `.dc.html` (wieloklatkowa, wszystkie stany z §3.1) +
  aktualizacja huba `START - KANON aktualny (1E).dc.html` i `CANON.md` (§3.2).
- **Styl:** 1E (Painted Imperial) — tokeny WYŁĄCZNIE z `eksport/tokens.css`, ten sam co (B).
- **Ikony:** reużyć istniejące 32 SVG technologii (`eksport/icons/tech/`) i istniejące ikony
  UI (kłódka, sowa/nauka, X) — nie projektować od zera, jeśli już są.
- **Dane przykładowe do makiety:** realne nazwy z `gra/data/tech.json` (32 technologie,
  3 epoki, nie wymyślać nowych).

### Checklist Design (DoD)
- [ ] Panel boczny „Badania" — wszystkie stany z §3.1 (1–6), w tym pusty plan i plan 1–3 poz.
- [ ] Stan drag&drop (przeciąganie + cel upuszczenia) zaprojektowany
- [ ] Sekcja „Wkrótce (zablokowane)" z przykładowym powodem blokady
- [ ] Spójność wizualna z (B) — ten sam gold/typografia/karty, nie nowy język
- [ ] Klatka z numerkiem kolejki na węźle siatki v1.1 (jeśli C-DESIGN-BADANIA-Q3 = A)
- [ ] `CANON.md` + karta w hubie START zaktualizowane zgodnie z decyzją C-DESIGN-BADANIA-Q1

---

## Źródła (recon 2026-07-26)

- Kod: `gra/src/ui/scienceHubHud.ts`, `gra/src/ui/techTreeView.ts`, `gra/src/ui/sciencePicker.ts`,
  `gra/src/ui/mapToolbarHud.ts` (przycisk wejścia), `gra/data/tech.json`
- Git log: `git log --oneline -- gra/src/ui/scienceHubHud.ts gra/src/ui/techTreeView.ts
  gra/src/ui/sciencePicker.ts` → `9be8bce` (kolejka+drag&drop, 2026-07-25), `6492b30`
  (usunięcie starego przycisku, rename „graf epok"→„Drzewko technologii", 2026-07-24)
- Mockupy: `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/`
  (`Ekran Badania (1E)`, `Drzewko technologii graf v1 (1E)`, `Drzewko technologii siatka v1.1 (1E)`)
- Decyzje: `dyspozycje/DECYZJE-AUTONOMICZNE-2026-07-25.md` (C-RES-Q1..Q4)
- Historia zleceń: `docs/ux/claude-design/DO-DESIGN-2026-07-23/DYSPOZYCJA-DLA-DESIGN-TURA-2.md`,
  `docs/ux/claude-design/01-propozycje-z-design/brand-book/SUROWCE-IKONY-MAKIETA-2026-07-24/WYMIANA-UI-DESIGN.md`
- Gap od dawna znany, nigdy nie zrealizowany: `dyspozycje/UI-INVENTORY-DESIGN-vs-GRA.md`,
  wiersz „NAU-01 | Hub nauki + drzewko | HOLD Macieja" (od 2026-07-05)
