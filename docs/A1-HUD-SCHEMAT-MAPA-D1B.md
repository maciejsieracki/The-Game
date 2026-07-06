# MOCKUP TEKSTOWY — HUD mapy strategicznej (D1=B)

> **Ekran:** mapa świata (strategia, heksy 3D, tura gracza)  
> **Nie dotyczy:** bitwa 3D · panel miasta (osobny pełnoekran)  
> **Wersja:** 2026-06-26 — wszystkie decyzje Macieja z paczki A1  
> **HTML (później):** `UI/Makieta-HUD-D1B-preview.html` — dopiero po akceptacji tego dokumentu

---

## Zasady projektowe (obowiązują wszędzie)

1. **Bez duplikatów** — jeśli funkcja jest na górnym [A] lub dolnym [I] pasku, nie ma drugiej ikony w toolbarze [C].
2. **Nauka = Badania** — jeden wpis (wiersz Badania), bez osobnego „Nauka +X/t".
3. **Brak Idee** — mechanika i UI usunięte (Q7).
4. **Toggle widoku mapy** — kolumna **[F2]** obok minimapy [F] (ikona + pill), nigdy w toolbarze [C].
5. **Styl:** ciemne tło `rgba(4,8,20)` + złoto `#e8d88a` + font UI Trebuchet/Verdana, nagłówki Georgia.

---

## WARSTWY (kolejność od dołu)

```
  0   Mapa 3D WebGL (canvas pełny ekran)
  1   Vignette mapy (ciemne brzegi, pointer-events: none)
  2   Legenda granic (G) — opcjonalna
  3   HUD: pasek górny [A], pasek wojen (B), minimapa [F], toggles [F2], dolny [I]
  4   Panel wydarzeń [E] — prawy
  5   Toolbar overlay [C] — lewy-górny
  6   Panel jednostki (H) — dolny-środek (A2-Q4 OTWARTE)
  7   Okrąg koniec tury [I2] — prawy-dół
  8   Banner TRYB BUDOWA (G2) — górny środek (warunkowy)
  9   Overlaye pełnoekranowe (nauka, dyplo, miasto, menu) — G3
```

---

## PEŁNY EKRAN — widok z góry (mockup tekstowy)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [A] PASEK GÓRNY · rev. A1-revA · lewa kolumna zasobów + prawa meta/tura          ┃
┃──────────────────────────────────────────────────────────────────────────────────────────────┃
┃                                                                                               ┃
┃  ┌─ ZASOBY IMPERIUM (lewa kolumna) ─────────────────────┐  ┌─ PRAWA STRONA ─────────────┐  ┃
┃  │  🍞  ŻYWNOŚĆ    842   +12/t   (bez kliku · B5)        │  │  EPOKA  [████░░] Brąz 42%  │  ┃
┃  │  🪙  ZŁOTO    1 840  +253/t                           │  │  👑 Grecy  ·  🏘 6/8      │  ┃
┃  │  🔨  PRACA      724   +88/t                           │  │  TURA 15 · 1200 p.n.e.     │  ┃
┃  │  🔬  BADANIA   +38 PN/t  Metalurgia 67%  ← KLIK       │  │  [ 🤝 DYPLOMACIA ]         │  ┃
┃  │  💰  BOGACTWO   120    +4/t  (Wealth/D3)               │  └────────────────────────────┘  ┃
┃  │  👥  LUDNOŚĆ  12 450  +124/t                          │                                  ┃
┃  └───────────────────────────────────────────────────────┘                                  ┃
┃  ⚠ Żywność < 0 → alert głodu (−8% HP wojska/t)                                                ┃
┃                                                                                               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ (B) PASEK WOJEN · ~28px · tło czerwone półprzezroczyste · TYLKO gdy wojna Z GRACZEM (A1-Q5)   ┃
┃──────────────────────────────────────────────────────────────────────────────────────────────┃
┃   WOJNA:   [ Persja  ⚔ ]   [ Egipt  ⚔ ]   [ Rzym  ⚔ ]     ← klik = Dyplomacja (ta cywilizacja)┃
┃   (wojny AI vs AI bez gracza — NIE tutaj, tylko w Dyplomacji → sekcja wywiadu)                ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                                               ┃
┃  ┌(C)────────┐                                                              ┌─── [E] ─────┐  ┃
┃  │ TOOLBAR    │                                                              │ WYDARZENIA  │  ┃
┃  │ OVERLAY    │                                                              │ Z TURY      │  ┃
┃  │ lewy-górny │                                                              │ A1-Q8=A     │  ┃
┃  │            │                                                              │ width ~230  │  ┃
┃  │  🏛️ Cuda    │                                                              │             │  ┃
┃  │  🔨 Budowa  │         [D]  MAPA 3D — GŁÓWNE POLE GRY                     │  chipy…     │  ┃
┃  └────────────┘                                                              └─────────────┘  ┃
┃  ┌─ [F] MINIMAPA ─────────────────────┐                                                       ┃
┃  │  label: Minimapa                   │     (G) LEGENDA — środek-dół mapy (gdy granice ON):   ┃
┃  │  ┌────────────────────────────┐   │         ● Terytorium Grecy   ● Terytorium wroga       ┃
┃  │  │ ░░▓▓▓▓░░  siatka heksów 2D │   │                                                       ┃
┃  │  │ ░▓▓██▓▓░  D15=B            │   │     ┌─ (H) PANEL JEDNOSTKI — A2-Q4 OTWARTE ──────┐   ┃
┃  │  │ ░▓███▓░░  ownerColor       │   │     │  🗡 Falanx  ·  HP 80/100  ·  Ruch 2/2       │   ┃
┃  │  │    ┌──────┐  ramka widoku  │   │     │  [ Ruch ] [ Atak ] [ Zatrzymaj ]             │   ┃
┃  │  │    │ VIEW │  przeciągnij   │   │     │  pojawia się po kliku jednostki na hexie     │   ┃
┃  │  │    └──────┘                │   │     └──────────────────────────────────────────────┘   ┃
┃  │  │  klik hex → kamera skacze  │   │                                                       ┃
┃  │  └────────────────────────────┘   │                                                       ┃
┃  ├─ [F2] WARSTWY MAPY (toggle) ──────┤                                                       ┃
┃  │  Widok mapy:                       │                                                       ┃
┃  │  [🗺️ Granice  ●ON ] [🏷️ Nazwy  ○OFF] [⛏️ Surowce ○] [🎖️ Armie ○] [🏗️ Ulepsz. ○] …    │  ┃
┃  │   v1.0 TAK            v1.0 TAK      propozycja lane                                        ┃
┃  └────────────────────────────────────┘                                                       ┃
┃                                                                                               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ [I] DOLNY PASEK · height ~56px · gradient ciemny · border-top złoty                           ┃
┃──────────────────────────────────────────────────────────────────────────────────────────────┃
┃                                                                                               ┃
┃    [ WYKONAJ ]                                              [ ☰ MENU ]                         ┃
┃      ↑ tylko gdy blocking chip                              ↑ zapis, ustawienia               ┃
┃                                                                                               ┃
┃    BRAMA G1: gdy blocking chip w [E] → okrąg [I2] przygaszony                                ┃
┃              WYKONAJ podświetlony → rozstrzyga pierwsze blocking wydarzenie                   ┃
┃                                                                                               ┃
┃                                                              ┌─────────────────────────────┐  ┃
┃                                                              │ [I2]  🏛  Tura 15    ( ⏭ ) │  ┃
┃                                                              │       ⚔  1200 p.n.e.       │  ┃
┃                                                              │  Miasta Wojsko  okrąg G1   │  ┃
┃                                                              └─────────────────────────────┘  ┃
┃                                                         bottom:10px  right:10px               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Strefa [A] — pasek górny (szczegóły)

**Rev. Maciej 2026-06-26:** lewa kolumna = **pełna lista zasobów imperium**; prawa = epoka + meta + tura + dyplomacja.

### Wygląd
- Pozycja: `top: 0; left: 0; right: 0; height: ~58–72px`
- Tło: gradient `#040814` → przezroczysty w dół
- Obramowanie dolne: 1px `rgba(232,216,138,0.30)`
- **Lewa kolumna:** zasoby pionowo (lub 2-kolumnowa siatka przy wąskim oknie)
- **Prawa strona:** epoka, nacja, osiedla, tura, dyplomacja

### Zawartość — lewa kolumna (zasoby imperium)

| # | Etykieta | Format | Interakcja |
|---|----------|--------|------------|
| 1 | **Żywność** | zapasy państwa + **+X/t** (B5) | **brak kliku** · alert głodu |
| 2 | **Złoto** | wartość + **+X/t** (zielony) | tooltip (opcj.) |
| 3 | **Praca** | wartość + **+X/t** (pomarańcz gdy ujemna) | tooltip |
| 4 | **Badania** | **+X PN/t** + nazwa tech + **%** | **KLIK → drzewko tech** |
| 5 | **Bogactwo** | wartość + **+X/t** (Wealth/D3) | tooltip |
| 6 | **Ludność** | suma ludności miast + **+X/t** | tooltip |

### Zawartość — prawa strona

| Etykieta | Format | Interakcja |
|----------|--------|------------|
| Epoka | pasek % + nazwa epoki | — |
| Wojna | chipy wrogów (skrajnie prawo) | **KLIK → dyplomacja (fokus nacja)** |

**OUT z [A]:** Nacja · Osiedla · Tura (→ [I2]) · Dyplomacja (→ ikona [C])

**OTWARTE A1-Q11:** Kultura · Wpływ — doprecyzować czy na liście zasobów.

### Czego NIE MA na [A]
- Osobny wiersz „Nauka" (duplikat Badania)
- Osobny blok „Żywność państwa" (→ wiersz Żywność w kolumnie)
- Osobny blok „Epoka & Badania" (→ Badania w zasobach, Epoka po prawej)
- Zadowolenie / bunt / porządek (→ panel miasta, Q3)
- Idee / postęp idei (Q7)
- Przyciski WYKONAJ, Menu (→ [I]); Miasta + okrąg (→ [I2])
- Dyplomacja / Wojsko (→ ikony [C])
- Overlay 📦 Zasoby (→ usunięte z [C])

---

## Strefa (B) — pasek wojen (szczegóły)

### Kiedy widoczny
- Tylko gdy ≥1 cywilizacja jest **w stanie wojny z graczem**

### Wygląd
- Pod [A], pełna szerokość, ~28px
- Tło: `rgba(48,12,12,0.92)`, border czerwony
- Etykieta: „WOJNA:" (małe caps, czerwony)

### Chip wojny
```
[  Persja  ⚔  ]   ← czerwone tło, kursor pointer, hover jaśniejszy
```
- Klik → otwiera **Dyplomacja** z fokusem na tej nacji
- **Nie** pokazujemy wojen AI-vs-AI tutaj (A1-Q5) — te w Dyplomacji → wywiad

---

## Strefa [C] — toolbar overlay lewy-górny

### Pozycja
- `top: ~70px` (pod [A]+(B)); `left: ~10px`
- Pionowy stos małych kwadratowych przycisków

### Zasada
- Otwiera **overlay / modal**, NIE przełącza warstw mapy (to robi [F2])

### v1.0 — panel sterowania (rev. 2026-06-26)

**Sekcja Imperium** (klik → więcej informacji):

| Ikona | Etykieta | Akcja |
|-------|----------|-------|
| 🏙 | **Miasta** | lista / `cityPanel` |
| 🔬 | **Nauka** | `sciencePicker` |
| 🎭 | **Kultura** | overlay imperium (A1-Q12a) |
| ⛪ | **Religia** | overlay imperium (A1-Q12b) |
| 🏛️ | **Cuda** | lista i postęp cudów |

**Sekcja Akcje:**

| Ikona | Etykieta | Akcja |
|-------|----------|-------|
| 🤝 | **Dyplomacja** | panel dyplomacji |
| ⚔ | **Wojsko** | panel armii (badge = wojny) |
| 🔨 | **Budowa** | tryb placement terenu (D4) |

**Reguła:** Badania na [A] = tylko liczby; klik drzewka → 🔬 [C]. Kultura/religia: treść [C], zasięg ON/OFF przy minimapie [F].

**NIE ma:** Zasoby (liczby na [A]) · Doktryn · Odblokowanych · Epoki · Badania · Idee · toggle mapy (→ [F2])

### Tryb Budowa aktywny
- Banner górny: „TRYB BUDOWA — ESC aby wyjść" (**BRAMA G2**)
- Toolbar lekko przygaszony
- Panel boczny: 15 ulepszeń × teren
- Kursor młotek, ghost preview na hexie
- Okrąg [I2] i Koniec tury [I]: disabled w trybie budowy (opcj. — do UX lane)

---

## Strefa [D] — mapa 3D (centrum)

### Zajmuje
- Cały prostokąt między [A], (B), [F], [E], [I] — pełny ekran pod HUD

### Stałe elementy renderu
- Siatka heksów (generator MAPA)
- Teren: trawa, las, góry, woda, wybrzeże…
- Miasta: modele 3D / markery (D12)
- Jednostki: stosy / banery na hexach
- Vignette: radial gradient, ciemne rogi

### Warstwy sterowane [F2]

| Toggle | Gdy ON | Gdy OFF |
|--------|--------|---------|
| 🗺️ Granice | tint terytorium + obrys linii + aura | czysty teren |
| 🏷️ Nazwy | etykiety miast nad heksami | brak etykiet |
| ⛏️ Surowce | ikony zasobów | ukryte |
| 🎖️ Armie | pełne banery jednostek | minimalne / ukryte |
| 🏗️ Ulepszenia | ikony farm, kopalni… | ukryte |
| 🌫️ Mgła | ukryte nieodkryte heksy | pełna widoczność (dev) |

### Interakcja
- **LMB drag** — przesuń kamerę
- **Scroll** — zoom
- **Klik hex** — wybór / ruch / atak (SILNIK)
- **Klik jednostka** → pokaż panel [H] (A2-Q4)

---

## Strefa [E] — panel wydarzeń (prawy)

### Pozycja
- `top: ~68px; right: ~12px; width: ~230px`
- Max-height: ekran minus [A] i [I]

### Nagłówek
```
WYDARZENIA Z TURY          (małe caps, szary, wyrównanie prawo)
```

### Typ chipa (szablon)
```
┌────────────────────────────────────────┐
│  🔬   Ukończono badanie: Metalurgia    │  [ ✕ ]  ← tylko informacyjny
│       Odblokowano epokę Brązu          │
└────────────────────────────────────────┘
   ↑ klik → akcja (otwórz drzewko, miasto, bitwę…)
   kolor lewej krawędzi wg typu:
   · nauka = niebieski
   · wróg = czerwony
   · miasto = zielony
   · jednostka = złoty
   · kultura = fiolet
```

### Chip BLOCKING (A1-Q9)
```
┌────────────────────────────────────────┐
│  ⚔   Wróg atakuje! Rozstrzygnij bitwę  │     ← BEZ ✕
│       Kliknij lub użyj WYKONAJ         │
└────────────────────────────────────────┘
```
- Dopóki istnieje → **BRAMA G1** blokuje Koniec tury [I] i [I2]

### Czego NIE MA
- Chip „Nowa idea dostępna" (Q7)
- Osobny dziennik pod minimapą (Q8=A, tylko chipy)

---

## Strefa [F] — minimapa + ikony kultura/religia (obok)

### Pozycja
- `bottom: ~70px` (nad [I]); `left: ~14px`
- Rozmiar minimapy: ~210 × 140 px
- **Obok** canvasu (po prawej lub w jednym rzędzie): ikony **🎭 Kultura** · **⛪ Religia**

### Zawartość canvas
- Każdy hex = kolor terenu (uproszczony)
- Hex w terytorium = `ownerColor` cywilizacji
- Ramka biała = aktualny widok kamery (przeciągalna)
- Ciemne brzegi = fog of war (D15=B)

### Interakcja minimapy
- **Klik** na hex → `onMinimapClick(q,r)` → kamera skacze
- **Drag** ramki → przesuwa kamerę

### Ikony Kultura / Religia (MAPA-F2-Q1 + A1-Q12)

| Ikona | Akcja | Właściciel spec |
|-------|--------|-----------------|
| **Toggle zasięgu** | ON/OFF overlay zasięgu na mapie [D] | **MAPA** — wygląd ikony + render heksów |
| **Klik → treść** | Overlay/panel imperium (co w środku) | **Grupa A A1-Q12** — **OTWARTE** ABC |

> **Nie** lane Nauka/D — wygląd toggle to MAPA; treść panelu to ten czat.

---

## Strefa [F2] — warstwy mapy (obok minimapy)

### Pozycja
- Kolumna po **prawej** od minimapy [F], ten sam układ co zasięg kultury/religii

### v1.0 — 4 wiersze (ikona + pill)

| Ikona | Pill | Akcja |
|-------|------|-------|
| 🗺️ | Widok ○/● | granice terytorium |
| 🏷️ | Widok ○/● | nazwy miast |
| 🎭 | Zasięg ○/● | zasięg kultury |
| ⛪ | Zasięg ○/● | zasięg religii |

**OUT:** osobny panel „Widok mapy" pod minimapą (rev. mockup 2026-06-26).

### Propozycja na później (do decyzji)
- ⛏️ Surowce · 🎖️ Armie · 🏗️ Ulepszenia · 🌫️ Mgła · ⊞ Siatka — ten sam styl ikona + pill

**Reguła:** każdy NOWY przełącznik widoczności mapy 3D → **tylko tutaj**, nigdy [C].

---

## Strefa (G) — legenda granic

### Pozycja
- Środek-dół mapy, nad [I], `bottom: ~68px`

### Zawartość (gdy 🗺️ ON)
```
● Terytorium Grecy        ● Terytorium wroga        — linia na heksach
```

---

## Strefa (H) — panel jednostki (A2-Q4 OTWARTE)

### Pozycja
- Dolny środek, `bottom: ~65px`, wyśrodkowany
- Szerokość ~400px, nad [I] i obok [I2]

### Kiedy widoczny
- Po kliknięciu **własnej jednostki** na hexie strategicznym

### Zawartość (propozycja — czeka A2-Q4)
- Nazwa, typ, HP, ruch pozostały
- Przyciski: Ruch, Atak, Zatrzymaj, Dołącz do armii…

---

## Strefa [I] — dolny pasek

### Pozycja
- `bottom: 0; left: 0; right: 0; height: ~56px`

### Przyciski — lewa → prawa

| Przycisk | Styl | Akcja | Stan |
|----------|------|-------|------|
| *(spacer)* | flex | — | — |
| **WYKONAJ** | pomarańczowy gdy aktywny | pierwsze blocking z [E] | ON gdy blocking · OFF szary |
| **☰ Menu** | secondary, `margin-left: auto` | zapis, wczytaj, ustawienia | zawsze ON |

### Czego NIE MA na [I]
- ~~Miasta~~ → ikona 🏛 [I2]
- ~~Koniec tury~~ → okrąg ⏭ [I2]
- ~~Nauka~~ → [A] Badania
- ~~Dyplomacja~~ → [A] przycisk Dyplomacja

---

## Strefa [I2] — klaster prawy-dół

### Pozycja
- `fixed; bottom: 10px; right: 12px; z-index: 130`
- Kolumna ikon (42×42) + tekst tury/roku + okrąg ~96×96 px

### Elementy (lewa → prawa)

| Element | Styl | Akcja | Stan |
|---------|------|-------|------|
| **🏙 Miasta** | kwadrat 42×42 | `cityPanel` / lista miast | zawsze ON |
| **Tura N** / **rok** | tekst, bez kliku | informacja | — |
| **⏭ Okrąg** | gradient zielony | `onEndTurn()` | OFF gdy G1 · skrót Enter/N |

### Wygląd okręgu (wzorzec mainview)
- Okrąg ~96×96 px
- Gradient zielony `#3a8c3a` → `#1a4a1a`
- Obramowanie `#44dd88`, cień zielony
- Ikona ⏭ (bez prostokątnego „Koniec tury" na [I])

### Zachowanie
- **BRAMA G1** — przy blocking: okrąg `opacity: 0.4; pointer-events: none`
- Hover okręgu: lekki scale 1.04, jaśniejszy cień
- **Brak** WYKONAJ na okręgu — tylko koniec tury (Q9)

---

## Overlaye pełnoekranowe (poza stałym HUD)

| Wyzwalacz | Co się otwiera | HUD mapy |
|-----------|----------------|----------|
| Klik **Badania** [A] | `sciencePicker` — drzewko tech | w tle / ukryty (G3) |
| **🤝 Dyplomacja** [C] lub chip wojny [A] | `diplomacyPanel` | w tle |
| **🏙 Miasta** [I2] | `cityPanel` — pełny ekran miasta | ukryty |
| **⚔ Wojsko** [C] | panel armii / jednostek | w tle |
| Chip w [E] | preBattle, picker, itd. | w tle |
| **Menu** [I] | `mainMenu` | w tle |
| Toolbar 🔨 [C] | tryb budowy + panel ulepszeń | HUD widoczny + banner G2 |

---

## Bramki — pełna lista

| ID | Warunek | Co zablokowane | Co aktywne |
|----|---------|----------------|------------|
| **G1** | `blockingEvents.length > 0` | Okrąg [I2], Enter/N | WYKONAJ [I] |
| **G2** | tryb Budowa aktywny | (opcj.) Koniec tury | ESC → wyjście |
| **G3** | overlay pełnoekran | interakcja mapy | zamknij overlay |
| **Publikacja** | brak akceptacji mockupu | wdrożenie `hud.ts` | — |
| **Kanon** | brak review Opus | `Gra-podglad.html` | — |

---

## Decyzje zamknięte (A1 — paczka Q5–Q10 + nawigacja)

| Temat | Decyzja |
|-------|---------|
| D1 | HUD D1=B od zera, preview first |
| D15 | Minimapa = siatka 2D |
| Q2 | Bilans +X/t na górnym pasku |
| Q3 | Zadowolenie tylko w panelu miasta |
| A1-Q5 | Wojny: tylko z graczem na mapie |
| A1-Q7 | Brak Idee |
| A1-Q8 | Wydarzenia: chipy prawo |
| A1-Q9 | WYKONAJ + brama końca tury |
| A1-Q10 | Koniec tury: **pasek + okrąg** (A+B) |
| Badania | Nauka = Badania, jeden wiersz |
| Nawigacja | Badania [A]; Dyplo+Wojsko [C]; dół = WYKONAJ·Menu; prawy-dół = Miasta·Tura·okrąg [I2] |
| Toggles mapy | Wszystkie pod minimapą [F2] |
| A1-Q6 | Toolbar: Cuda, Budowa (rev. A1-revA) |
| A1-KLIKI | Mapa kliknięć → `docs/A1-HUD-MAP-KLIKNIEC.md` + Excel `HUD-mapa-kliki` |

---

## Mapa kliknięć (A1-KLIKI)

Pełna tabela: **`docs/A1-HUD-MAP-KLIKNIEC.md`** · Excel: **`Status-projektu-The-Game.xlsx`** → **`HUD-mapa-kliki`**.

Skrót — co **prowadzi klik**:

| Strefa | Interaktywne | Cel |
|--------|--------------|-----|
| [A] | Badania, chipy wojny | `sciencePicker`, `diplomacyPanel` |
| (B) | chip wojny | `diplomacyPanel` (fokus nacja) — **OUT**, chipy w [A] |
| [C] | Dyplomacja, Wojsko, Cuda, Budowa | `diplomacyPanel`, armia, overlay / tryb budowy [D] |
| [D] | miasto, jednostka, hex | `cityPanel`, [H], `preBattle`, ruch |
| [E] | chipy | rozstrzygnięcie / skok; blocking → G1 |
| [F] | hex minimapy | skok kamery |
| [F2] | toggles | warstwa ON/OFF |
| [I] | WYKONAJ, Menu | blocking, `mainMenu` |
| [I2] | Miasta, okrąg | `cityPanel`, `onEndTurn` |

---

## Otwarte (poza tym mockupem)

1. **F2** — które toggles oprócz Granice + Nazwy na v1.0
2. **A2-Q4** — panel jednostki [H]
3. **Akceptacja** mockupu D1B

---

## Pliki powiązane

- `docs/MACIEJ-HUD-CHECKLIST-D1B.md` — checklist do akceptacji
- `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md` — log decyzji ABC
- `dyspozycje/_handoff/UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md`
- `dyspozycje/_handoff/UI-do-MASTER_map-layers-minimap-A1Q6.md`
- Wzorzec okrąg: `gra/src/mainview/index.html` `#btn-end-turn`
