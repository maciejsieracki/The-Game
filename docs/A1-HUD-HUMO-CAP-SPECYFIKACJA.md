# Humo-cap HUD mapy strategicznej — specyfikacja tekstowa (D1=B)

> **Cel:** każdy element opisany **przed** wersją graficzną (`Makieta-HUD-D1B-preview.html`).  
> **Styl:** jak sekcja „Dół [I] + [I2]" — krótko, konkretnie, z pozycją i zachowaniem.  
> **Decyzje:** stan 2026-06-26 (paczka A1 Q5–Q10 + nawigacja + toolbar + Badania).

**Zasada globalna:** nie powielamy tego samego na [A], [I], [F2] i [C].

---

## [A] Pasek górny

```
┌─ EKONOMIA ──────────┐  ┌─ POLITYKA ─┐  ┌─ SPOŁECZNE ────┐  ┌─ IMPERIUM ──────┐
│ 🪙 Złoto   1840     │  │ ⚖️ Wpływ    │  │ 🎭 Kultura      │  │ 🏘️ Osiedla 6/8 │
│    +253/t           │  │   +46/t     │  │   +29/t         │  │ 👑 Grecy        │
│ 🔨 Praca    724     │  └────────────┘  └─────────────────┘  │ 💰 Wealth (D3)  │
│    +88/t            │                                        └─────────────────┘
└─────────────────────┘

┌─ EPOKA & BADANIA (nauka = badania — JEDEN wpis) ─────────────────────────────┐
│ Epoka   [████████░░░░]  Epoka Brązu                              42%        │
│ Badania [██████████░░]  Metalurgia  ·  +38 PN/t                   67%  ←KLIK │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ TURA & DYPLOMACJA ───────────────────────────────────────────────────────────┐
│  Tura 15  ·  1200 p.n.e.     [ 🤝 Dyplomacja ]     (zegar HH:MM — opcj.)     │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ ŻYWNOŚĆ PAŃSTWA (CZEKA lane B5) ─────────────────────────────────────────────┐
│  🍞 Zapasy wojska: XXX    ⚠ alert gdy < 0  (−8% HP/jedn./turę)                │
└───────────────────────────────────────────────────────────────────────────────┘
```

| Parametr | Wartość |
|----------|---------|
| Pozycja | `top:0; left:0; right:0` |
| Wysokość | ~58 px |
| Tło | gradient `#040814` → przezroczysty |
| Obramowanie | dolne 1px złote `rgba(232,216,138,0.30)` |

**Pola — format i interakcja**

| Etykieta | Format | Klik / hover |
|----------|--------|--------------|
| Złoto | wartość + **+X/t** zielony | tooltip (opcj.) |
| Praca | wartość + **+X/t** pomarańcz gdy ujemna | tooltip |
| Wpływ | **+X/t** | tooltip |
| Kultura | **+X/t** | tooltip; szczegóły w panelu miasta |
| Osiedla | `N/max` | — |
| Nacja | nazwa, kolor frakcji | — |
| Wealth | wartość + rate, badge D3 | — |
| Epoka | pasek % + nazwa | — |
| **Badania** | pasek % + tech + **+X PN/t** | **→ drzewko tech (pełny ekran)** |
| Tura | numer + data epoki | — |
| Dyplomacja | przycisk | **→ panel dyplomacji** |
| Żywność państwa | zapasy + alert | po wdrożeniu B5 |

**NIE MA na [A]:** osobna „Nauka" · Idee · zadowolenie/bunt · Miasta/WYKONAJ/Koniec/Menu

---

## (B) Pasek wojen

```
WOJNA:   [ Persja ⚔ ]   [ Egipt ⚔ ]   [ Rzym ⚔ ]
         ↑ klik → Dyplomacja (fokus na tej nacji)
```

| Parametr | Wartość |
|----------|---------|
| Kiedy | tylko wojna **z graczem** (A1-Q5) |
| Pozycja | pod [A], pełna szerokość |
| Wysokość | ~28 px |
| Wygląd | tło czerwone półprzezroczyste, chipy czerwone |

• Wojny AI vs AI **nie tutaj** — tylko Dyplomacja → wywiad  
• Gdy brak wojen z graczem → **strefa ukryta**

---

## [C] Toolbar overlay — lewy-górny

```
┌(C)────┐
│ 📦    │  Zasoby   → overlay magazynów / surowców (≠ liczby z [A])
│ 🏛️    │  Cuda      → lista i postęp cudów
│ 🔨    │  Budowa    → tryb placement na mapie (D4)
└───────┘
```

| Parametr | Wartość |
|----------|---------|
| Pozycja | `top:~70px; left:~10px` |
| Układ | pionowy stos, ~40×40 px na ikonę |
| Typ | **overlay/modal** — nie toggle mapy |

**NIE MA:** Doktryn · Odblokowanych · Epoki · Badania · Idee · granic/nazw (→ [F2])

### Tryb Budowa aktywny (🔨)

```
┌─ TRYB BUDOWA — ESC aby wyjść ─────────────────────────┐
│  panel: 15 ulepszeń × teren · kursor młotek · ghost   │
└───────────────────────────────────────────────────────┘
```

• **BRAMA G2** — banner górny środek  
• Toolbar lekko przygaszony  
• (opcj.) Koniec tury [I]+[I2] disabled w trybie budowy

---

## [D] Mapa 3D — centrum

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              MAPA 3D — pełny ekran pod HUD                     │
│                                                              │
│   heksy · teren · rzeki · miasta · jednostki                 │
│   warstwy ON/OFF sterowane z [F2]                            │
│   kamera: LMB pan · scroll zoom · klik hex → akcja            │
│   vignette — ciemne rogi                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

| Warstwa [F2] | Gdy ON |
|--------------|--------|
| 🗺️ Granice | tint terytorium + obrys |
| 🏷️ Nazwy | etykiety miast |
| ⛏️ Surowce | ikony zasobów (propozycja v1.0+) |
| 🎖️ Armie | banery jednostek (propozycja) |
| 🏗️ Ulepszenia | ikony farm/kopalni (propozycja) |
| 🌫️ Mgła | ukryte heksy (propozycja) |

• Jedyna strefa **interakcji gry** (ruch, wybór, budowa)  
• Klik jednostki → panel [H]

---

## [E] Panel wydarzeń — prawy

```
                    WYDARZENIA Z TURY
                    ─────────────────

┌─────────────────────────────────────┐
│ 🔬  Ukończono: Metalurgia      [ ✕ ]│  ← informacyjny
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚔   Wróg atakuje! Rozstrzygnij      │  ← BLOCKING, bez ✕
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏙  Produkcja ukończona w Atenach [✕]│
└─────────────────────────────────────┘
```

| Parametr | Wartość |
|----------|---------|
| Pozycja | `top:~68px; right:~12px` |
| Szerokość | ~230 px |
| Max-height | ekran − [A] − [I] |

**Typy chipów (kolor lewej krawędzi):** nauka niebieski · wróg czerwony · miasto zielony · jednostka złoty · kultura fiolet

| Typ | ✕ | Klik |
|-----|---|------|
| Informacyjny | tak | akcja / zamknij |
| **Blocking** | **nie** | akcja — **blokuje Koniec tury (G1)** |

• **NIE MA** chipu „Idee"  
• **NIE MA** osobnego dziennika pod minimapą (A1-Q8=A)

---

## [F] Minimapa

```
┌─ Minimapa ────────────────┐
│ ░▓▓██▓▓░  siatka 2D       │
│ ░▓███▓░░  D15=B           │
│    ┌────┐  ramka widoku   │
│    │VIEW│  przeciągnij    │
│    └────┘                 │
│  klik hex → skok kamery   │
└───────────────────────────┘
```

| Parametr | Wartość |
|----------|---------|
| Pozycja | `bottom:~70px; left:~14px` |
| Rozmiar | ~210 × 140 px |
| Render | canvas 2D — **nie** miniatura 3D |
| Dane | teren + `ownerColor` + fog na brzegach |

---

## [F2] Warstwy mapy — pod minimapą

```
WIDOK MAPY
[ 🗺️ Granice ●ON ]  [ 🏷️ Nazwy ○OFF ]  [ ⛏️ Surowce ]  [ 🎖️ Armie ]  …
```

| Parametr | Wartość |
|----------|---------|
| Pozycja | bezpośrednio pod [F], szer. ~210 px |
| Typ | **toggle** ON/OFF — nie otwiera okna |
| v1.0 **TAK** | 🗺️ Granice · 🏷️ Nazwy |
| Reszta | propozycja lane — do decyzji Macieja |

• **Każdy** nowy przełącznik widoku mapy 3D → **tylko tutaj**  
• Stan ON: złote obramowanie · OFF: szary

---

## (G) Legenda granic — opcjonalna

```
        ● Terytorium gracza    ● Terytorium wroga
        ─────────────────────────────────────────
        pozycja: środek-dół mapy, nad [I]
        widoczna gdy 🗺️ Granice = ON
```

---

## (H) Panel jednostki — A2-Q4 OTWARTE

```
        ┌─ jednostka na hexie ─────────────────────┐
        │ 🗡 Falanx  ·  HP 80/100  ·  Ruch 2/2   │
        │ [ Ruch ] [ Atak ] [ Zatrzymaj ]          │
        └──────────────────────────────────────────┘
        pozycja: dolny-środek, nad [I]
        widoczny: po kliku własnej jednostki na [D]
```

• Zawartość i przyciski — **czeka decyzja A2-Q4**

---

## [I] Dolny pasek + [I2] Okrąg

```
[ 🏙️ Miasta ]                    [ WYKONAJ ]  [ ▶ Koniec tury ]  [ ☰ Menu ]
                                                      ┌─────────────┐
                                                      │  ⏭ KONIEC   │  okrąg ~96px
                                                      │    TURY     │  prawy-dół
                                                      └─────────────┘
```

| Parametr | Wartość |
|----------|---------|
| [I] pozycja | `bottom:0; left:0; right:0` |
| [I] wysokość | ~56 px |
| [I2] pozycja | `fixed; bottom:10px; right:10px` |
| [I2] rozmiar | okrąg ~96×96 px, zielony gradient (wzorzec mainview) |

| Przycisk | Akcja | Stan |
|----------|-------|------|
| **Miasta** | lista / skok / panel miasta | zawsze ON |
| **WYKONAJ** | pierwsze blocking z [E] | ON tylko gdy blocking · inaczej szary |
| **Koniec tury** [I] | `onEndTurn()` | OFF gdy G1 · skrót Enter/N |
| **Menu** | zapis, wczytaj, ustawienia | zawsze ON |
| **Okrąg [I2]** | **ta sama** akcja co Koniec tury | OFF gdy G1 · przygaszony |

• **WYKONAJ** — tylko gdy blocking chipy (A1-Q9)  
• **Koniec tury** — **oba** [I] i [I2] (A1-Q10=A+B), ta sama brama G1  
• **NIE MA:** Nauka · Dyplomacja (→ [A])

---

## Overlaye pełnoekranowe (poza stałym HUD)

| Wyzwalacz | Co się otwiera | HUD mapy |
|-----------|----------------|----------|
| Klik **Badania** [A] | drzewko technologii | ukryty / w tle (G3) |
| **Dyplomacja** [A] lub chip [B] | panel dyplomacji | w tle |
| **Miasta** [I] | panel miasta | ukryty |
| Chip [E] | preBattle, picker… | w tle |
| **Menu** [I] | menu główne | w tle |
| **Zasoby / Cuda / Budowa** [C] | overlay lane | w tle (+ banner G2 dla Budowy) |

---

## Bramki (skrót)

| ID | Warunek | Efekt |
|----|---------|-------|
| **G1** | blocking chip w [E] | Koniec tury OFF [I]+[I2] · WYKONAJ ON |
| **G2** | tryb Budowa | banner ESC · (opcj.) block koniec tury |
| **G3** | overlay pełnoekran | mapa nieaktywna |
| **Publikacja** | brak akceptacji humo-cap | brak kodu HTML/kanonu |

---

## Checklist przed wersją graficzną

- [ ] Maciej akceptuje ten humo-cap tekstowy  
- [ ] F2: które toggles oprócz Granice + Nazwy (v1.0)  
- [ ] A2-Q4: panel [H]  
- [ ] Dopiero potem: `UI/Makieta-HUD-D1B-preview.html`

**Powiązane:** `docs/A1-HUD-SCHEMAT-MAPA-D1B.md` (duży ASCII) · `docs/MACIEJ-HUD-CHECKLIST-D1B.md`
