# ZLECENIE Design — A-21 Picker Miasto vs Jednostka (styl 1E)

**Od:** Maciej / Lane UI (MASTER)  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-05  
**ZLECENIE-ID:** `A21-CITY-UNIT-PICK-2026-07-05`  
**Priorytet:** **P1** — modal lane Cursor bez mockupu 1E · emoji · niebieski akcent na kafelku jednostki

---

## 0. Problem (dla Designera)

Maciej przesłał **screenshot** (2026-07-05) — modal **„Co wybierasz?”** przy kliku heksu z własnym miastem **i** wojskiem.

**Gameplay OK** (decyzja A2-Q5 ✅ 2026-07-01) — **wygląd lane Cursor** bez mockupu Design (A-21 = ⬜ w `brand-book-1E/DYSPOZYCJA.md`).

**Screenshot PRZED (Maciej):**

- Tytuł „CO WYBIERASZ?” · podtytuł „Na tym heksie jest miasto i wojsko”
- Kafelek **Miasto**: emoji **🏛** · nazwa miasta (Testpolis) · złoty label
- Kafelek **Jednostka**: emoji **⚔** · nazwa typu (Hastati) · hint „Zaznacz i rozkazuj” · label **niebieski** (`#a8d4ff`) — niespójny z 1E
- Anuluj (Esc) — outline szary · OK strukturalnie
- Wąski panel ~300px · overlay blur — bazowo OK

**Review HTML:** `docs/ux/export/A21-CITY-UNIT-PICK-GAP-DLA-DESIGN.html`

**Werdykt Macieja:** flow OK · wygląd → **Design mockup 1E** (zero emoji, spójne złoto).

---

## 1. Jak zobaczyć „PRZED” w grze

| Ekran | Jak wejść | Plik playtest |
|--------|-----------|---------------|
| **A-21 Picker** | Nowa gra → ustaw wojsko na heksie **własnego** miasta → klik heksu | `gra-kanon/Gra-podglad.html` |

**Kod lane (referencja układu — nie zmieniaj pól):**

- `gra/src/ui/cityUnitPick.ts`
- Wpięcie: `gra/src/main.ts` (gałąź kliku mapy · A2-Q5)

**Decyzja gameplay (MUST):** `docs/decyzje/A2-Q5-miasto-vs-jednostka-klik.md`

---

## 2. Reguły 1E (obowiązkowe)

| Reguła | Wartość |
|--------|---------|
| Styl | **1E** · **zero emoji** |
| Złoto UI | `#e8d88a` · dim `#c9a84c` |
| Tytuły | **Georgia** serif · 10–11px · uppercase · letter-spacing |
| Body | Segoe UI 13px |
| Panel | `linear-gradient(165deg, rgba(14,20,36,.98), rgba(8,12,24,.99))` · ramka złota · radius 12–14px |
| Overlay | `rgba(4,8,18,.45–.58)` + blur 2–3px |
| **Kafelki wyboru** | outline złoty przy hover · **oba kafelki ten sam akcent** — **NIE** osobny niebieski na Jednostka |
| Ikona miasta | SVG `icon-city-panel.svg` lub istniejący z brand-book (partenon / miasto) |
| Ikona jednostki | SVG kategorii B z paczki **JEDNOSTKI-INFOGRAFIKI** — np. `unit-legion.svg` |
| Format pliku | `The Game - A21 Picker miasto jednostka v1 2026-07-05 (1E).dc.html` |
| ZIP | `A21-CITY-UNIT-PICK-2026-07-05.zip` |

**Wzorzec modali:** C-04 / C-05 v2 · A-18 merge — ten sam gradient panelu i typografia.

**Zależność:** ikona jednostki = ta sama paczka co `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05`.

---

## 3. Deliverables — co narysować

### P1 — A-21 · Picker Miasto vs Jednostka

**Plik:** `The Game - A21 Picker miasto jednostka v1 2026-07-05 (1E).dc.html`

**Układ MUST (treść z kodu):**

```
┌─────────────────────────────────────────┐
│         CO WYBIERASZ?                   │
│   Na tym heksie jest miasto i wojsko    │
├──────────────────┬──────────────────────┤
│   [SVG miasto]   │   [SVG jednostka]    │
│     Miasto       │     Jednostka        │
│   {cityName}     │   {unitLabel}        │
│                  │  Zaznacz i rozkazuj  │
│                  │  (lub Stos ×N)       │
├──────────────────┴──────────────────────┤
│            Anuluj (Esc)                 │
└─────────────────────────────────────────┘
```

**Stany do mockupu (min. 3):**

1. **Domyślny** — jedna jednostka · hint „Zaznacz i rozkazuj”
2. **Stos ×N** — pod typem jednostki tekst `Stos ×3` zamiast hintu (gdy `stackCount > 1`)
3. **Hover** — kafelek Miasto lub Jednostka · złota ramka (oba symetryczne)

**Skróty (informacyjnie w mockupie — mały tekst footera opcjonalnie):**

- `1` = Miasto · `2` = Jednostka · `Esc` = Anuluj

**SVG nowe (jeśli brak w brand-book):**

| Plik | Użycie |
|------|--------|
| `icon-city-panel.svg` | Kafelek Miasto (biały / złoty stroke) |
| `icon-unit-select.svg` | Kafelek Jednostka (alternatywa: kategoria B z paczki jednostek) |

---

## 4. Po stronie lane UI (po ZIP)

Lane **UI** portuje mockup → `cityUnitPick.ts`:

- Zamiana emoji na SVG inline / `<img>` z brand-book
- Usunięcie `.civ-cup-act.unit .civ-cup-act-lbl { color: #a8d4ff }` — jeden akcent złoty
- CSS z mockupu · bez zmiany API `showCityUnitPick()`

**Handoff:** `docs/ux/claude-design/DESIGN-do-UI_A21.md` (Designer)

**Meldunek:** `MELDUNEK-A21-CITY-UNIT-PICK.md`

---

## 5. Powiązania

| ID | Relacja |
|----|---------|
| A2-Q5 | Decyzja gameplay — **nie zmieniać** |
| A-06 / A-18 | Ten sam styl kafelków / modali mapy |
| B-01 | Wybór „Miasto” → panel miasta (osobny mockup GOTOWY) |
| C-04 / C-05 | Modale mapy oblężenia — wzorzec 1E v2 |

**REJEST:** `docs/ux/REJEST-UX-MASTER.md` · wpis A-21

---

## 6. Checklist Design (DoD)

- [ ] 1 mockup `.dc.html` · 3 stany (domyślny · stos · hover)
- [ ] Zero emoji w mockupie
- [ ] Oba kafelki — spójny złoty akcent (bez niebieskiego labelu)
- [ ] SVG miasto + jednostka (lub placeholder z paczki JEDNOSTKI)
- [ ] `DESIGN-do-UI_A21.md` + `MANIFEST.txt`
- [ ] ZIP `A21-CITY-UNIT-PICK-2026-07-05.zip`

Po gotowości: **„Paczka A21-CITY-UNIT-PICK-2026-07-05.zip gotowa”** + lista plików.
