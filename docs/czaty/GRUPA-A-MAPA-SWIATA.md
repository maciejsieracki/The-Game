# Charter — Grupa A — Mapa świata (strategia)

> **Zakładka Cursor:** `Grupa A — Mapa świata (strategia)`  
> **Ten czat = tylko mapa strategiczna (heksy, HUD imperium, jednostki na świecie).**  
> Obowiązuje: `docs/decyzje/DYSPOZYCJA-STALA.md` + ten plik.  
> **Hub plików roboczych:** `docs/grupa-a/README-INDEX.md` · audyt: `docs/grupa-a/AUDIT-2026-06-27.md`  
> **Paczka ABC (blokery):** `docs/grupa-a/PACZKA-ABC-BLOKERY-2026-06-27.md`  
> **Paczka ABC PEŁNA (do decyzji):** `docs/grupa-a/PACZKA-ABC-PEŁNA-2026-06-27.md`  
> **C3 oblężenie + preBattle C1:** `docs/grupa-a/C3-PYTANIA-PACZKA-*.md` · granica: `docs/grupa-c/GRANICA-C-vs-MAPA.md`

## Przepływ i raportowanie

**Obieg:** `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` · `docs/obieg/_ZASADY.md`

1. Implementacja modułów Grupy A — **bez** `main.ts`, **bez** `Gra-podglad.html`.
2. Raport: `docs/obieg/A-mapa.md` · `REJESTR-DECYZJI.md`.
3. Maciej: **`przekaż do Mastera`** → handoff + Slack → Master → Integrator F → kanon → **REJESTR §2** (lane milczy · playtest = Master).

**Hasła Macieja:** `działaj` · `przekaż do Mastera` · A/B/C · `format`

---

## Za co odpowiadacie

| Obszar | Odpowiedzialność |
|--------|------------------|
| **HUD mapy** | Pasek imperium, minimapa, zasoby na mapie, panel boczny |
| **Jednostka na mapie** | Klik/heks, panel wybranej jednostki, ruch po heksach |
| **Armie i ruch** | Łączenie armii, pathfinding, zasięgi na mapie świata |
| **Pre-battle (C1)** | Overlay przed walką: Auto / Ręczna / Wycofaj, skład — **do startu C2** |
| **Oblężenie (C3)** | Start, panel, głód, atrycja, machiny, AI oblężenia (C3-Q1…Q10) |
| **Budowanie z mapy** | Ulepszenia terenu, budowle na heksie (wg D4) |
| **Wygląd mapy** | Render terenu, miasta na mapie, granice, posterunki |

**Moduły (tylko te):** `map/*`, `render/*`, `ui/hud`, `ui/preBattle` — patrz `docs/decyzje/README.md` → temat per grupa.

**NIE edytujecie:** `main.ts`, `Gra-podglad.html` → Maciej: **`przekaż do Mastera`**

---

## Tematy w tym czacie (A1–A5)

| ID | Nazwa | Plik decyzji | Pytania do Macieja | Status |
|----|-------|--------------|-------------------|--------|
| **A1** | HUD mapy | `A1-hud-mapy.md` | **A1-Q*** · D1, D15 | **ZAMKNIĘTE dec.** · wpięcie **F-HUD** |
| **A2** | Jednostka na mapie | `A2-jednostka-mapa.md` | **A2-Q4** | **ZAMKNIĘTE → A** · wpięcie F-HUD |
| **A3** | Ruch i armie | *(brak pliku — D6/D8 KARTA)* | **A3-Q*** | CZĘŚCIOWO |
| **A4** | Budowanie mapa | `A4-D4-przeglad-ulepszen-terenu.md` | **ZAMKNIĘTE** A4-D4-Q1=A · A4-Q1=A | 2026-06-27 |
| **A5** | Wygląd mapy | *(brak pliku — D12 KARTA)* | **A5-Q*** | CZĘŚCIOWO |

**Numeracja pytań:** zawsze `<ID>-Qn` (np. `A2-Q4`, nie „Q4" bez prefiksu).

**Ekran w każdym pytaniu:** `[EKRAN: Mapa świata]` — **zawsze**.

---

## Jakie pytania ABC wolno Maciejowi (tylko ta grupa)

**WOLNO pytać o:**
- Układ HUD, minimapa, zasoby na pasku mapy (A1)
- **Treść overlay po kliku ikon kultura/religia obok minimapy (A1-Q12)** — toggle zasięgu = **MAPA**, nie ten czat
- Panel wybranej **jednostki na heksie strategicznym** (A2) — **to NIE jest bitwa**
- Ruch, łączenie armii, zasięg na mapie świata (A3)
- Budowa/ulepszenie z mapy vs z panelu miasta (A4 — tu decydujesz mapę; panel → Grupa B)
- Wygląd terenu, miast, granic na mapie (A5)
- **Całe oblężenie C3 (C3-Q1…Q10)** — start, panel, głód, machiny, AI, wizual
- **Pre-battle C1** — overlay Auto / Ręczna / Wycofaj **przed** sceną bitwy (C2)
- Stare **Q1–Q10** dotyczą **wyłącznie mapy świata** (`MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md`)

**ZAKAZ pytań w tym czacie (→ inna zakładka):**

| Temat | Gdzie |
|-------|--------|
| Panel miasta, produkcja, Wealth, suwaki, żywność w mieście, drzewko nauki | **Grupa B** |
| **Pole bitwy 3D (C2)**, reguły **w trakcie walki (C4)** | **Grupa C** — **od** wyboru Auto/Ręczna |
| Dyplomacja, bonusy cywilizacji, AI rywali | **Grupa D** |
| Menu nowej gry, warunki zwycięstwa (meta), globalny shell UI | **Grupa E** |
| **A2-Q4 ≠ C2-Q*** — jednostka na **mapie świata** vs **polu bitwy** | A2 tu · C2 w Grupie C |

---

## Pytania do Mastera (technika)

Plik per temat: `docs/decyzje/<ID>-PYTANIA-DO-SILNIKA.md` (np. `A2-PYTANIA-DO-SILNIKA.md`).

Raport wykonania: `dyspozycje/UI-DO-MASTERA.md`, `dyspozycje/MAPA-DO-MASTERA.md`.

---

## Kolejność pracy (rekomendacja)

1. **A1** (HUD) → **A2** (Q4–Q10) → **A3** → **A4** → **A5**  
2. Jedna paczka pytań = **jeden temat** (max 5 ABC)  
3. Po odpowiedzi Macieja → KROK A–G z `DYSPOZYCJA-STALA.md`

---

## Mockupy / odniesienia

- **Hub:** `docs/grupa-a/README-INDEX.md`
- Playtest: `UI/Makieta-START.html` → `UI/Makieta-HUD-D1B-preview.html`
- Ulepszenia A4: `Civ-MAPA/Gra-podglad-ULEPSZENIA.html`
- Archiwum (nie używać): `UI/_archiwum/Makieta-HUD-mapa-swiata.html`
- **NIE** używaj `Gra-podglad-BITWA.html` w tym czacie — to Grupa C
