# UI → Design: synchronizacja szaty z grą (2026-07-03)

> **Dla Macieja:** wklej designerowi blok **„Hasło START”** na końcu pliku.  
> **Playtest referencyjny (kanon funkcji):** `gra-robocza/START.html` → Ctrl+F5.  
> **Mockup bazowy do edycji:** `brand-book/The Game - HUD Mapy layout (1E).dc.html`  
> **Decyzje gameplay:** D16=A, D17=A, Wiki góra-prawo, D1=C (side panel wydarzeń)

---

## 1. Cel

Stary mockup **HUD Mapy layout (1E)** nie odzwierciedla tego, co jest **już w grze** po batchach W2 + Wiki + D16/D17 + panel miasta.  
Design ma **zaktualizować szatę** (nie logikę) tak, aby:

1. Mockupy 1E = **1:1 z playable build** (wymiary, stany, co widoczne / ukryte).
2. Lane UI mógł później podmienić tymczasowe SVG na assety z `eksport/`.
3. Miasto (W3-miasto-1E) używa **tych samych** chipów górnych i przycisku Wiki co mapa.

**Design NIE implementuje kodu** — tylko `.dc.html`, tokeny, ikony SVG, zip.

---

## 2. Mapa stref — stan docelowy (kanon gry)

| Strefa | Mockup 1E (stary) | **Kanon gry 2026-07-03** | Akcja Design |
|--------|-------------------|---------------------------|--------------|
| **A** | 5 chipów zasobów | **5 chipów** w jednym rzędzie: Skarbiec · Praca · Nauka · Kultura · Ludność (+ stopy `/t` gdzie sens) | Dopasuj ikony do `chip6c` / `HUD Kit (1E)`; **bez** Żywności na mapie (żywność wojska = osobny temat, nie chip A) |
| **A2** | Moc centralna | Bez zmian — tarcza + wartość + „Moc · N rekruci” | Spójność z `power-center` |
| **A3** | Epoka + Osiedla + **tylko Menu** | Epoka + Osiedla + **Wiki** + Menu (kolejność: meta → **Wiki** → Menu) | **DODAJ** przycisk Wiki (zielony akcent `#a8c878`) |
| **B** | 5 medalionów | **5 medalionów** 52×52: Miasto · Nauka · Dyplomacja · Wojsko · Budowa | **Usuń** Kultura/Religia/Cuda z toolbaru — są przy minimapie (F2) lub panelach |
| **D** | 3 banery liderów | **BRAK** (D16=A — ukryte do v1.0) | **Usuń całkowicie** z mockupu mapy |
| **H** | Wydarzenia `top:180px` | Wydarzenia **nad stosem tury** (`bottom:172px`, `right:20px`, szer. 300px) | Przesuń w dół; nagłówek „Wydarzenia” zostaje |
| **C** | Panel kontekstowy zawsze + placeholder | **Ukryty domyślnie**; po wyborze heksu/jednostki — karta z treścią (D17=A) | **3 klatki** (patrz §4) |
| **E** | Minimapa 280×170 + 2 przyciski | Bez zmian wymiarów; obok **Kultura** + **Religia** (toggle zasięgu) | Ikony z brand-book, nie emoji |
| **F** | Pasek akcji jednostki (placeholder) | Pojawia się **tylko** po wyborze własnej jednostki (dolny środek) | Klatka „po wyborze” z realnymi akcjami (Pomiń, Ufortyfikuj…) |
| **G** | Wykonaj + Zakończ turę + etykieta tury | Bez zmian układu (200px szer., prawy dół) | Spójność z `bottomBarHud.ts` |

---

## 3. Pliki do zaktualizowania (kolejność)

| Priorytet | Plik w `brand-book/` | Co |
|-----------|----------------------|-----|
| **P0** | `The Game - HUD Mapy layout (1E).dc.html` | Pełna synchronizacja stref A–G (§2–§5) |
| **P0** | `The Game — HUD Kit (1E).dc.html` | Komponenty: chip zasobu, `.b-wiki`, panel kontekstowy (3 stany), karta wydarzenia |
| **P1** | `The Game - Ekran Miasto (1E).dc.html` | Ten sam pasek A + Wiki; dolny chrome mapy **schowany** w trybie miasta (patrz §6) |
| **P1** | `eksport/icons/ui-wiki.svg` | Ikona książki @16/@24, `currentColor`, line 3C |
| **P2** | `eksport/tokens.css` | `--civ-wiki-accent: #a8c878` (jeśli brak) |
| **P2** | `eksport/HANDOFF.md` | Sekcja „Szata sync 2026-07-03” |
| **P2** | `ostatnie/HUD-map-sync-2026-07-03.zip` | Zip dla Macieja |

**Nie edytuj:** plików w `gra/src/` — to robi Lane UI po Twoim zipie.

---

## 4. Panel kontekstowy (D17=A) — obowiązkowe 3 klatki

W mockupie mapy zrób **osobne stany** (tabs lub 3 mini-frame’y w jednym pliku):

### Klatka C0 — domyślna (start gry)
- **Brak** panelu C na ekranie — puste miejsce pod wydarzeniami.
- **NIE** rysuj szarego placeholdera „kliknij jednostkę…”.

### Klatka C1 — wybrany heks
- Karta 300×auto, `top:300px`, `right:20px`.
- Ramka **pełna** (nie dashed): `border:1px solid rgba(212,175,90,0.28)`, tło ciemne jak wydarzenia.
- Przykład treści:
  ```
  Heks (12, 7)
  Równina
  🍞 2 · 🔨 1 · 💰 0
  ```
  (emoji w mockupie OK jako ikony zasobów; w finalnym UI mogą być SVG z brand-book)

### Klatka C2 — wybrana jednostka gracza
- Ta sama pozycja co C1 (zastępuje C1, nie obok).
- Przykład:
  ```
  Wojownik
  Heks (12, 7)
  Ruch: 2 · Atak 5 · Obrona 5
  ```

---

## 5. Wikipedia (obowiązkowe)

Pełna spec: `dyspozycje/_handoff/UI-do-DESIGN_wikipedia-hud-mockup.md`

Skrót:

| Element | Spec |
|---------|------|
| Wejście | Górny prawy róg: **Wiki** przed **Menu** |
| Wygląd przycisku | Jak Menu, ale obwódka/tekst **zielone** `#a8c878`; stan `.on` gdy panel otwarty |
| Panel | Lewy overlay **340px**, złota ramka prawa, zakładki **Poradnik / Encyklopedia**, meta: Skrót · Hasło · Pełny artykuł |
| Zakaz | **Brak** Wiki na lewym toolbarze i przy minimapie |

W mockupie mapy: **2 klatki** — zamknięte (tylko przycisk) + otwarte (panel + mapa w tle).

---

## 6. Ekran miasta — różnice względem mapy

Przy otwartym panelu miasta (W3):

| Element | Na mapie | W trybie miasta |
|---------|----------|-----------------|
| Górny pasek A + Wiki + Menu | Widoczny | **Widoczny** (z-index nad dim) |
| Toolbar B, minimapa E, wydarzenia H, kontekst C, stos tury G | Widoczne | **Ukryte** (nie rysuj w mockupie miasta) |
| Dim / tło | — | **Pełna maska** (opaque), nie półprzezroczysty szary — mapa 3D widać tylko w „oknie” miasta |
| Layout | — | Lewa kolumna produkcja · środek mapa okolicy · prawy rail parametrów (9 ikon) — patrz `START-W3-miasto-1E.md` |

W mockupie miasta **dodaj** ten sam przycisk Wiki co na mapie.

---

## 7. Lewy toolbar B — semantyka ikon (zamknięta)

Kolejność od góry (medalion 52px, gap 12px, `left:22px`, `top:104px`):

| # | Ikona | Tooltip PL | Uwaga |
|---|-------|------------|-------|
| 1 | `tb-cities` | Miasto | aktywny = lista miast |
| 2 | `tb-science` | Badania | niebieski wariant (sowa) |
| 3 | `tb-diplomacy` | Dyplomacja | uścisk dłoni (nie pergamin) |
| 4 | `tb-army` | Wojsko | badge czerwony gdy wojna |
| 5 | `tb-build` | Budowa ulepszeń | aktywny = tryb budowy |

---

## 8. Wydarzenia H — pozycja względem tury

```
                    [Wydarzenie 1]
                    [Wydarzenie 2]     ← bottom: 172px (nad stosem)
                    ...
    [Minimapa]                    [Wykonaj]
                                  [Zakończ turę]
                                  Tura N · rok
```

Szerokość karty wydarzenia = **300px** (jak panel kontekstowy).

---

## 9. Tokeny i copy (zamknięte — nie zmieniać)

| Było (stare mockupy) | Jest (kanon) |
|----------------------|--------------|
| Power / Wpływ | **Moc** |
| Banery top 3 AI | **Usunięte** (v1.0) |
| Panel kontekstowy cały czas | **Tylko po wyborze** |
| Wiki w toolbarze / minimapie | **Górny bar obok Menu** |
| Emoji w UI finalnym | **Zero** (wyjątek: mockup może pokazać 🍞 jako placeholder zasobu — docelowo SVG) |
| Nacja „Grecy” na HUD | **OUT** (A1-revB) |

Tokeny: tylko `--tg-*` / `--civ-*` z `eksport/tokens.css` (FROZEN).

---

## 10. DoD (Definition of Done) — Design

- [ ] `HUD Mapy layout (1E).dc.html` — bez strefy D (banery); Wiki w A3; wydarzenia nad turą; brak placeholdera C0
- [ ] Ten sam plik — klatki: C1 heks, C2 jednostka, Wiki otwarte, F po wyborze jednostki
- [ ] `HUD Kit (1E).dc.html` — komponenty wyciągnięte (chip, b-wiki, sp-event, context-card)
- [ ] `Ekran Miasto (1E).dc.html` — Wiki + ukryty dolny chrome mapy + postęp W3 (9 rail, 6 chipów miasta)
- [ ] `eksport/icons/ui-wiki.svg`
- [ ] `eksport/HANDOFF.md` + zip `ostatnie/HUD-map-sync-2026-07-03.zip`
- [ ] 1 linia w `WYMIANA-UI-DESIGN.md` § Szata sync 2026-07-03

---

## 11. Referencje techniczne (tylko podgląd — nie edytować)

| Plik gry | Strefa |
|----------|--------|
| `gra/src/ui/hud.ts` | A, A2, A3, montaż |
| `gra/src/ui/mapToolbarHud.ts` | B |
| `gra/src/ui/sidePanelHud.ts` | H |
| `gra/src/ui/contextPanelHud.ts` | C |
| `gra/src/ui/minimapHud.ts` | E |
| `gra/src/ui/bottomBarHud.ts` | G |
| `gra/src/ui/armyStackHud.ts` | F |
| `gra/src/ui/wikiHubHud.ts` | panel Wiki |
| `gra/src/ui/cityUxFrame.ts` | tryb miasta, maska |

Decyzje Macieja: `docs/master/maciej/MACIEJ-KARTA-DECYZJI.md` (D16, D17).

---

## Hasło START — wklej designerowi

```
START — szata-sync-2026-07-03

Zaktualizuj mockupy 1E do stanu gry (playtest: gra-robocza/START.html).

Czytaj (kolejność):
1) dyspozycje/_handoff/UI-do-DESIGN_szata-sync-2026-07-03.md  ← GŁÓWNA SPECYFIKACJA
2) dyspozycje/_handoff/UI-do-DESIGN_wikipedia-hud-mockup.md
3) brand-book/The Game - HUD Mapy layout (1E).dc.html  ← EDYTUJ
4) brand-book/The Game — HUD Kit (1E).dc.html
5) brand-book/START-W3-miasto-1E.md  ← miasto równolegle

Kluczowe zmiany vs stary 1E:
• USUŃ banery liderów (strefa D)
• DODAJ Wiki obok Menu (zielony akcent)
• Panel kontekstowy: UKRYTY domyślnie; pokaż tylko po wyborze heksu/jednostki
• Wydarzenia: NAD stosem tury (nie u góry)
• Toolbar: 5 medalionów (Miasto, Nauka, Dyplomacja, Wojsko, Budowa)

Deliverable: zaktualizowane .dc.html + ui-wiki.svg + zip ostatnie/HUD-map-sync-2026-07-03.zip
```

*UI → Design · Maciej sign-off D16=A D17=A · 2026-07-03*
