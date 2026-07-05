# Dyspozycja: baseline screenshoty UX (Grupy A–E)

**Od:** Maciej (decydent) / koordynacja UI  
**Do:** Grupa A, B, C, D, E — **każda czyta tylko swoją sekcję poniżej**  
**Cel:** zrzuty ekranu paneli **jak wyglądają dziś** — baza „PRZED” poprawkami wyglądu (Figma). Potem porównamy z folderem `after/`.

**Pomocniczo (zasady nazw, foldery):** [`SCREENSHOTS-BASELINE.md`](SCREENSHOTS-BASELINE.md)  
**Playtest (jak wejść w ekran):** [`REJEST-UX-MASTER.md`](REJEST-UX-MASTER.md) — sekcja Waszej grupy, kolumna „Jak zobaczyć”

**Maciej w czacie:** wkleja **jedną** uniwersalną wiadomość do wszystkich grup (patrz [`WKLEJKA-MACIEJ-BASELINE.md`](WKLEJKA-MACIEJ-BASELINE.md)). Każda grupa w pliku poniżej czyta **tylko swoją** sekcję § Grupa A / B / C / D / E.

---

## Wspólne zasady (wszystkie grupy)

1. **Format:** PNG. **Narzędzie:** Win + Shift + S (Windows) — zaznacz okno gry / panel.
2. **Gdzie zapisać:** `docs/ux/baseline/{A|B|C|D|E}/`
3. **Nazwa pliku:** `{ID}_{krótki-opis}.png` — ID z rejestru UX (np. `B-01_panel-miasta-pelny.png`).
4. **Nie wysyłać** PNG na czat — tylko pliki w projekcie.
5. **Po zakończeniu:** uzupełnij wiersz swojej grupy w [`baseline/README.md`](baseline/README.md) i napisz Maciejowi: `Grupa X baseline gotowe`.

**Po redesignie (później, lane UI):** te same nazwy w `docs/ux/after/{A|B|C|D|E}/` — porównanie przed/po.

---

## § Grupa A — Mapa / HUD

**Czas:** ~30–45 min · **Folder:** `docs/ux/baseline/A/`

### Co zrobić

1. Otwórz `Gra-podglad.html` → **Nowa gra** → jesteś na mapie.
2. Dla każdego ekranu z listy **minimum** wejdź wg [`REJEST-UX-MASTER.md`](REJEST-UX-MASTER.md) § Grupa A (kolumna „Jak zobaczyć”).
3. Zrób zrzut → zapisz PNG w `docs/ux/baseline/A/` z nazwą `{ID}_….png`.

### Minimum obowiązkowe (8 plików)

| ID | Plik przykładowy | Jak wejść (skrót) |
|----|------------------|-------------------|
| A-01 | `A-01_hud-gora.png` | Mapa — górny pasek zasobów + ⚜ Wpływ |
| A-02 | `A-02_toolbar.png` | Lewa kolumna ikon |
| A-03 | `A-03_dolny-pasek.png` | Dół — Wykonaj / Koniec tury |
| A-04 | `A-04_panel-wydarzen.png` | Prawa strona — chipy (2–3 tury jeśli pusto) |
| A-06 | `A-06_panel-jednostki.png` | Klik własnej jednostki |
| A-11 | `A-11_lista-dyplomacji.png` | Toolbar 🤝 |
| A-16 | `A-16_pre-bitwa.png` | Atak wroga na sąsiednim heksie |
| A-08 | `A-08_tryb-budowy.png` | Toolbar 🏗 (mile widziane) |

### Dodatkowo (opcjonalnie)

Pozostałe wpisy A-07…A-30 z rejestru — ten sam schemat nazw.

### Zakończenie

`baseline/README.md` → **Grupa A:** `Baseline GOTOWE · [data] · [N] plików`  
Czat do Macieja: **„Grupa A baseline gotowe”**

---

## § Grupa B — Miasto / ekonomia / nauka

**Czas:** ~40–60 min · **Folder:** `docs/ux/baseline/B/`

### Co zrobić

1. Otwórz `Gra-podglad-OKOLICA-UX.html` **lub** `Gra-podglad.html` → Nowa gra → **klik własne miasto**.
2. Dla nauki (B-33, B-34): wyjdź z panelu miasta → mapa → toolbar 🦉.
3. Zrzuty docków hover (B-29, B-30): **osobny plik** z widocznym dockiem po najechaniu.
4. PNG → `docs/ux/baseline/B/`

### Minimum obowiązkowe (8 plików)

| ID | Plik przykładowy | Jak wejść (skrót) |
|----|------------------|-------------------|
| B-01 | `B-01_panel-miasta-pelny.png` | Cały panel (lewo + mapa + prawo) |
| B-02 | `B-02_pasek-zasobow.png` | Górny pasek w panelu miasta |
| B-15 | `B-15_budowa-lista.png` | Rail 🏛️ — lista budynków |
| B-17 | `B-17_rekrut-lista.png` | Rail ⚔ — rekrutacja |
| B-29 | `B-29_dock-budynek-hover.png` | 🏛️ → najedź na ikonę budynku ~0,4 s |
| B-30 | `B-30_dock-jednostka-3d.png` | ⚔ → najedź miniaturę jednostki |
| B-33 | `B-33_hub-nauki.png` | Mapa → toolbar 🦉 |
| B-34 | `B-34_drzewko-tech.png` | Hub → „Pełne drzewko” |

### Dodatkowo (opcjonalnie)

Karty po kliku chipów (B-03…B-10), zakładki ⚖ ☤ 🎭 🛕 — wg rejestru.

### Zakończenie

`baseline/README.md` → **Grupa B:** `Baseline GOTOWE · [data] · [N] plików`  
Czat: **„Grupa B baseline gotowe”**

---

## § Grupa C — Walka

**Czas:** ~30–45 min · **Folder:** `docs/ux/baseline/C/`

### Co zrobić

1. **Pre-bitwa:** `Gra-podglad.html` → Nowa gra → atak wroga obok.
2. **Bitwa 3D:** `Gra-podglad-BITWA.html` **lub** w grze klawisz **T** (preset testowy).
3. **Oblężenie:** `Gra-podglad-OBLEZENIE-BITWA.html` **lub** szturm miasta z murem z mapy.
4. PNG → `docs/ux/baseline/C/`

Szczegóły wejścia: rejestr § Grupa C.

### Minimum obowiązkowe (7 plików)

| ID | Plik przykładowy |
|----|------------------|
| C-01 | `C-01_pre-bitwa.png` |
| C-06 | `C-06_deployment.png` |
| C-07 | `C-07_pole-bitwy.png` |
| C-08 | `C-08_hud-gora-bitwa.png` |
| C-09 | `C-09_pasek-komend.png` |
| C-21 | `C-21_ekran-konca-bitwy.png` |
| C-19 | `C-19_oblezenie-mur-hud.png` |

### Zakończenie

`baseline/README.md` → **Grupa C:** `Baseline GOTOWE · [data] · [N] plików`  
Czat: **„Grupa C baseline gotowe”**

---

## § Grupa D — Dyplomacja

**Czas:** ~20–30 min · **Folder:** `docs/ux/baseline/D/`

### Co zrobić

1. `Gra-podglad.html` → Nowa gra → mapa.
2. Flow dyplomacji wg rejestru § Grupa D.
3. PNG → `docs/ux/baseline/D/`

### Minimum obowiązkowe (5 plików)

| ID | Plik przykładowy | Jak wejść (skrót) |
|----|------------------|-------------------|
| D-02 | `D-02_lista-dyplomacji.png` | Toolbar 🤝 |
| D-03 | `D-03_audiencja.png` | Lista → wybór cywilizacji |
| D-04 | `D-04_karty-akcji.png` | Wewnątrz audiencji |
| D-05 | `D-05_modal-wojna.png` | Audiencja → akcja Wojna (jeśli możliwe) |
| D-06 | `D-06_modal-propozycja-ai.png` | Propozycja AI / chip blocking |

D-01 (legacy panel) — opcjonalnie.

### Zakończenie

`baseline/README.md` → **Grupa D:** `Baseline GOTOWE · [data] · [N] plików`  
Czat: **„Grupa D baseline gotowe”**

---

## § Grupa E — Menu / kreator / meta

**Czas:** ~20–30 min · **Folder:** `docs/ux/baseline/E/`

### Co zrobić

1. `Gra-podglad.html` — menu od razu po otwarciu.
2. **Rozpocznij grę** → kroki kreatora 2–4.
3. Ustawienia z menu (E-03).
4. PNG → `docs/ux/baseline/E/`

### Minimum obowiązkowe

| ID | Plik przykładowy |
|----|------------------|
| E-01 | `E-01_menu-glowne.png` |
| E-03 | `E-03_ustawienia.png` |
| E-09 | `E-09_kreator-krok2-epoka.png` |
| E-10 | `E-10_kreator-krok3-cywilizacja.png` |
| E-11 | `E-11_kreator-krok4-ustawienia.png` |
| E-15 | `E-15_game-over.png` — jeśli nie da się wywołać: dopisz w README „E-15 brak” |

### Zakończenie

`baseline/README.md` → **Grupa E:** `Baseline GOTOWE · [data] · [N] plików`  
Czat: **„Grupa E baseline gotowe”**

---

## Dla lane UI / MASTER (po zebraniu A–E)

- Sprawdzić kompletność folderów `baseline/A`…`E`.
- Po redesignie Figmy: te same nazwy → `docs/ux/after/`.
- Porównanie przed/po — bez udziału Macieja w nazewnictwie.

---

*Utworzono: 2026-07-01 · zakres: panele UX/UI · baseline przed Figmą*
