# ZLECENIE Design — A-18 Połączenie / Rozdziel armii (mapa · styl 1E)

**Od:** Maciej / Lane UI (MASTER)  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-05  
**ZLECENIE-ID:** `ARMY-MERGE-A18-2026-07-05`  
**Priorytet:** **P1** — modal w grze bez mockupu · emoji + zielony CTA · ikony ⚔️ zamiast infografik

---

## 0. Problem (dla Designera)

Gracz porusza wojskiem na heks z sojusznikami → pojawia się modal **„Połączenie armii”**. Lane Cursor złożył **makieta v1.0** — działa gameplayowo, ale **nie ma mockupu 1E** (w `brand-book-1E/DYSPOZYCJA.md` A-18 = ⬜).

**Screenshot PRZED (Maciej, 2026-07-05):**

- Modal „POŁĄCZENIE ARMII” · Hastati · Na polu / Przybywa · Zostaw osobno / Połącz armie
- Nagłówek: emoji **🔗** · wiersze jednostek: emoji **⚔️** (hardcode w kodzie)
- Przycisk primary: **zielony gradient** (nie złoty 1E)
- Strzałka środka: znak Unicode `→` (brak SVG brand-book)

Powiązany ekran **Split** („Rozdziel armię”, klawisz **[H]** na stosie) — ten sam styl provizorki, **bez mockupu**.

**Review HTML:** `docs/ux/export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html`

---

## 1. Jak zobaczyć „PRZED” w grze

| Ekran | Jak wejść | Plik playtest |
|--------|-----------|---------------|
| **A-18 Merge** | Ruch własną jednostką na heks z inną sojuszniczą jednostką | `gra-kanon/Gra-podglad.html` lub `Gra-podglad-ROBOCZA.html` |
| **A-18 Split** | Zaznacz stos ≥2 jednostek → **[H]** → wybór jednostek + sąsiedni heks | j.w. |
| **A-06 Stack HUD** | Klik stos na mapie — dolny pasek (już częściowo 1E) | j.w. — **nie redesignuj**, tylko spójność ikon |

**Kod lane (referencja układu — nie zmieniaj pól):**

- Merge: `gra/src/ui/armyMergePanel.ts`
- Split: `gra/src/ui/armySplitPanel.ts`
- Wywołanie: `gra/src/main.ts` → `mergeUnitRow()` (dziś `icon: '⚔️'` hardcode)

---

## 2. Reguły 1E (obowiązkowe)

| Reguła | Wartość |
|--------|---------|
| Styl | **1E** · **zero emoji** |
| Złoto UI | `#e8d88a` · dim `#c9a84c` |
| Tytuły | **Georgia** serif · 11px · uppercase · letter-spacing |
| Body | Segoe UI 13px |
| Panel | `linear-gradient(165deg, rgba(14,20,36,.97), rgba(8,12,24,.98))` · ramka 1–2px złota · radius 14px |
| Overlay | `rgba(4,8,18,.58)` + blur 3px |
| **Przycisk primary** | gradient **złoty** (jak C-01 „Powrót do mapy” / menu outline→fill) — **NIE zielony** |
| **Przycisk secondary** | outline szary/złoty · przezroczyste tło |
| Pasek wyniku | neutralny (złoty/szary) — **NIE zielony** „Stos: N jednostek…” |
| Ikony jednostek | SVG z paczki **JEDNOSTKI-INFOGRAFIKI** (poziom B) — `unit-legion.svg` dla Hastati |
| Ikona nagłówka merge | SVG **łańcuch / splecenie** (nowy `icon-merge-armies.svg`) — bez 🔗 |
| Strzałka „dołącza” | SVG `icon-arrow-join.svg` lub ornament brand-book |
| Format pliku | `The Game - A18 <opis> v1 2026-07-05 (1E).dc.html` |
| ZIP | `ARMY-MERGE-A18-2026-07-05.zip` |

**Wzorzec przycisków:** `docs/ux/claude-design/01-propozycje-z-design/brand-book-1E/` · DS-04 outline · primary złoty.

**Zależność:** ikony jednostek w wierszach = **te same SVG** co w zleceniu `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05` (sync z Designem).

---

## 3. Deliverables — co narysować

### P0 — A-18a · Połączenie armii (Merge modal)

**Plik:** `The Game - A18 Polaczenie armii v1 2026-07-05 (1E).dc.html`

**Układ MUST (treść z kodu — nie dodawaj pól):**

```
┌─────────────────────────────────────────────────────────────┐
│  ─── [SVG łańcuch] ───                                      │
│         POŁĄCZENIE ARMII                                    │
│         Heks (48,31)                                        │
├─────────────────────────────────────────────────────────────┤
│  NA POLU (1)          [SVG →]          PRZYBYWA             │
│  ┌─────────────┐      dołącza         ┌─────────────┐       │
│  │[icon] Hastati│                      │[icon] Hastati│*     │
│  │ 2/2 ruch     │                      │ 1/2 ruch     │      │
│  └─────────────┘                      └─────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  Stos: 2 jednostki na (48,31)          ← pasek info         │
├─────────────────────────────────────────────────────────────┤
│  [ Zostaw osobno ]              [ Połącz armie ]  ← złoty   │
└─────────────────────────────────────────────────────────────┘
```

**Stany do mockupu (min. 3):**

1. **1+1** — jak screenshot (Hastati + Hastati)
2. **2+1** — dwie jednostki „Na polu”, jedna „Przybywa” (scroll w kolumnie lewej jeśli >3)
3. **Mobile** — `@media max-width 480px` — kolumny pionowo, strzałka obrócona 90°

**Wyróżnienie „Przybywa”:** subtelna ramka/akcent (dziś zielony — **zamień na złoty/błękit gracza `#3a6ad0`**, nie zielony gameplay)

**Skróty klawiatury (informacyjnie w mockupie):** Esc = Zostaw osobno · Enter = Połącz

---

### P0 — A-18b · Rozdziel armię (Split modal)

**Plik:** `The Game - A18 Rozdziel armie v1 2026-07-05 (1E).dc.html`

**Układ MUST:**

```
┌─────────────────────────────────────────────────────────────┐
│         ROZDZIEL ARMIĘ                                      │
│         Heks (48,31)                                        │
├─────────────────────────────────────────────────────────────┤
│  Wybierz jednostki do odłączenia                            │
│  ☑ [icon] Hastati                                           │
│  ☐ [icon] Hastati                                           │
│  ☐ [icon] Triarii                                           │
├─────────────────────────────────────────────────────────────┤
│  Docelowy heks (sąsiad)                                     │
│  [ (47,31) ]  [ (49,31) ]  [ (48,30) ]   ← chipy heksów    │
├─────────────────────────────────────────────────────────────┤
│  Na heksie źródłowym musi zostać co najmniej 1 jednostka.   │
├─────────────────────────────────────────────────────────────┤
│                    [ Anuluj ]    [ Rozdziel ]  ← primary     │
└─────────────────────────────────────────────────────────────┘
```

**Stany:** checkbox zaznaczony · chip heksu aktywny · disabled „Rozdziel” gdy 0 zaznaczonych lub zostaje 0 na źródle.

**Primary:** złoty 1E (dziś niebieski gradient w kodzie).

---

### P1 — Ikony pomocnicze (w ZIP)

| Plik SVG | Użycie |
|----------|--------|
| `icon-merge-armies.svg` | Nagłówek merge (zamiast 🔗) |
| `icon-arrow-join.svg` | Środek merge „dołącza” |
| `icon-split-army.svg` | Opcjonalnie nagłówek split |

viewBox 24×24 · `stroke="currentColor"` · styl brand-book.

---

## 4. Co lane zrobi po Twojej paczce

1. Port CSS z `.dc.html` → `armyMergePanel.ts` + `armySplitPanel.ts`
2. Podmiana emoji → SVG (`innerHTML` / `mapUnitBrandIconHtml` wzorzec z `armyStackHud.ts`)
3. MASTER: `mergeUnitRow()` → `categoryOf(typeId)` + `unitIconSvg()` (po paczce JEDNOSTKI)
4. Build + playtest merge/split na mapie

**Lane NIE zmienia:** logiki merge/split, tekstów PL, skrótów Esc/Enter.

---

## 5. Zawartość ZIP

```
ARMY-MERGE-A18-2026-07-05.zip
├── The Game - A18 Polaczenie armii v1 2026-07-05 (1E).dc.html
├── The Game - A18 Rozdziel armie v1 2026-07-05 (1E).dc.html
├── eksport/icons/map/
│   ├── icon-merge-armies.svg
│   ├── icon-arrow-join.svg
│   └── icon-split-army.svg          (opcjonalnie)
├── DESIGN-do-UI_ARMY-MERGE-A18.md
├── MELDUNEK-ARMY-MERGE-A18.md
├── MANIFEST.txt
└── support.js                       (kopia z brand-book jeśli .dc.html wymaga)
```

---

## 6. Kryteria akceptacji (DoD)

- [ ] Zero emoji w mockupach i SVG
- [ ] Primary CTA **złoty** (merge + split)
- [ ] Wiersze jednostek z **infografiką kategorii** (np. legionista dla Hastati) — nie ⚔️
- [ ] Spójność z A-06 stack HUD (ten sam styl karty wiersza / ikony)
- [ ] 3 stany merge + 2 stany split w `.dc.html`
- [ ] `DESIGN-do-UI` z mapowaniem klas CSS → selektory lane

**Po gotowości napisz:**  
`Paczka ARMY-MERGE-A18-2026-07-05.zip gotowa` + lista plików.

---

## 7. Powiązane zlecenia

| ID | Relacja |
|----|---------|
| `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05` | Ikony w wierszach jednostek (poziom B) |
| `POLE-BITWY-v5-gap-2026-07-05` | Ten sam styl przycisków / paneli modalnych |
| A-06 `armyStackHud.ts` | Już 1E — utrzymuj spójność kart |

**Rejestr UX:** `docs/ux/REJEST-UX-MASTER.md` · wiersz A-18.
