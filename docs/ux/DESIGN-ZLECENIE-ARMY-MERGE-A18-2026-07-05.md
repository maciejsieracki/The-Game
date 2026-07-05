# ZLECENIE Design — A-06 + A-18 Armia na mapie (stos · merge · split · styl 1E)

**Od:** Maciej / Lane UI (MASTER)  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-05  
**ZLECENIE-ID:** `ARMY-MERGE-A18-2026-07-05`  
**Priorytet:** **P0** — 3 ekrany lane Cursor bez mockupu 1E · emoji · niespójne akcenty (fiolet/niebieski/zielony)

---

## 0. Problem (dla Designera)

Maciej przesłał **2 screenshoty** (2026-07-05) — oba idą do Designera:

### A) A-18 · Modal „Połączenie armii”

Gracz porusza wojskiem na heks z sojusznikami → modal merge. Lane Cursor **makieta v1.0** — brak mockupu (A-18 = ⬜).

- Emoji **🔗** w nagłówku · **⚔️** przy jednostkach (hardcode `main.ts`)
- Primary **zielony** „Połącz armie” (nie złoty 1E)
- Strzałka `→` Unicode

### B) A-06 · Panel stosu armii (dolny HUD)

Klik stos na mapie → panel **„Armia · (48,31)”** · karty Hastati · staty · Ruch/Ufort./Pomiń.

Lane zrobił **szkic 1E v2** (`armyStackHud.ts`) — **Maciej odrzuca wizualnie** i chce mockup Design (jak POLE-BITWY GAP).

**Screenshot PRZED (Maciej):**

- Nagłówek OK częściowo (SVG `tb-army`) · karty: emoji **⚔️**
- **Rozdziel** = obrys **fioletowy** (`accent-violet`) · **Połącz** = **niebieski** disabled — **niespójne** ze złotym „Ruch” i zaznaczoną kartą
- Pasek HP na karcie: **zielony** gradient (jak stary Civ, nie 1E)
- Staty ATK/OBR/RUCH/ZAS: subtelne ramki — do doprecyzowania w mockupie
- Toast pod panelem: „Połączono: 2 jedn…” — **Maciej: też do Designera** (A-20 / DS-13) — patrz §3 P1 poniżej

Powiązany **Split modal** (przycisk Rozdziel / **[H]**) — ten sam pakiet co A-18.

**Review HTML:** `docs/ux/export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html`

**Werdykt Macieja:** treść panelu OK · wygląd → **Design mockup 1E** (nie zostawiamy szkicu lane).

---

## 1. Jak zobaczyć „PRZED” w grze

| Ekran | Jak wejść | Plik playtest |
|--------|-----------|---------------|
| **A-06 Stack HUD** | Klik stos ≥2 jednostek na heksie (lub jedna po merge) | `gra-kanon/Gra-podglad.html` |
| **A-18 Merge** | Ruch własną jednostką na heks z inną sojuszniczą jednostką | j.w. |
| **A-18 Split** | Panel A-06 → **Rozdziel** (lub **[H]** gdy zaznaczony stos) | j.w. |

**Kod lane (referencja układu — nie zmieniaj pól):**

- Stack HUD: `gra/src/ui/armyStackHud.ts` + `mapUnitHudSkin.ts`
- Merge: `gra/src/ui/armyMergePanel.ts`
- Split: `gra/src/ui/armySplitPanel.ts`
- Ikony hardcode: `gra/src/main.ts` → `mergeUnitRow()` + `buildArmyStackHudState()` (`icon: '⚔️'`)

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
| **Przycisk primary** | gradient **złoty** (jak C-01 / DS-04 fill) — **NIE zielony / NIE niebieski** |
| **Przycisk secondary / toolbar** | outline **złoty** — **NIE** `accent-violet` / **NIE** `accent-blue` (dziś Rozdziel fiolet · Połącz niebieski) |
| **Przycisk disabled** | opacity ~35% · ten sam kształt co aktywny — bez osobnego koloru akcentu |
| Pasek HP na karcie | brand-book 1E (doprecyzuj w mockupie) — **NIE** neonowy zielony `#50b070` |
| Ikony jednostek | SVG z paczki **JEDNOSTKI-INFOGRAFIKI** (poziom B) — `unit-legion.svg` dla Hastati |
| Ikona nagłówka merge | SVG **łańcuch / splecenie** (nowy `icon-merge-armies.svg`) — bez 🔗 |
| Strzałka „dołącza” | SVG `icon-arrow-join.svg` lub ornament brand-book |
| Format pliku | `The Game - A06|A18 <opis> v1 2026-07-05 (1E).dc.html` |
| ZIP | `ARMY-MERGE-A18-2026-07-05.zip` (A-06 + A-18 w jednej paczce) |

**Wzorzec przycisków:** `docs/ux/claude-design/01-propozycje-z-design/brand-book-1E/` · DS-04 outline · primary złoty.

**Zależność:** ikony jednostek w wierszach = **te same SVG** co w zleceniu `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05` (sync z Designem).

---

## 3. Deliverables — co narysować

### P0 — A-06 · Panel stosu armii (dolny HUD)

**Plik:** `The Game - A06 Panel stosu armii v1 2026-07-05 (1E).dc.html`

**Układ MUST (treść z kodu):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [SVG armia] Armia · (48,31)          [≡ LISTA] [ROZDZIEL] [POŁĄCZ] [×] │
│              2 jedn. na heksie                                            │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐     ← karty jednostek (scroll poziomy >4)     │
│  │[icon]   │  │[icon]   │                                               │
│  │ Hastati │  │ Hastati │   * złota ramka = aktywna                       │
│  │ ▓▓▓▓▓   │  │ ▓▓▓▓▓   │     HP bar                                      │
│  │ 1/2 ruch│  │ 2/2 ruch│                                               │
│  └─────────┘  └─────────┘                                               │
├──────────────────────────────────────────────────────────────────────────┤
│  ATAK   OBRONA   RUCH   ZASIĘG              [RUCH] [UFORT.] [POMIŃ]     │
│   7       7        2       0                 primary  muted   muted      │
└──────────────────────────────────────────────────────────────────────────┘
     ↑ panel „wisi” nad dolnym paskiem mapy (56px od dołu)
```

**Stany do mockupu (min. 4):**

1. **Stos 2 · aktywna karta 1** — jak screenshot Macieja (Połącz disabled)
2. **Stos 2 · Połącz enabled** — sąsiednia armia do merge (obie akcje outline aktywne)
3. **Stos 1** — ukryj **Połącz** i **Rozdziel** (tylko Lista + ×) — *lane już disabled; Design potwierdza układ*
4. **Stos 4+** — scroll kart poziomy

**MUST wizualne (poprawki vs szkic lane):**

| Element | Dziś (źle) | Docelowo |
|---------|------------|----------|
| Ikona na karcie | ⚔️ emoji | SVG kategorii B (JEDNOSTKI-INFOGRAFIKI) |
| Rozdziel / Połącz | fiolet + niebieski outline | **złoty outline 1E** (jak Lista) |
| Ruch (akcja) | złoty — OK | zachowaj spójność z DS-04 |
| HP bar karty | zielony `#50b070` | kolor z brand-book (pergamin/złoto/czerwień HP) |
| Karta aktywna | złota ramka — OK | doprecyzuj cień / gradient |

**Spójność:** karta jednostki w A-06 = wiersz w modalu A-18 merge (ten sam komponent wizualny).

**Referencja szkicu lane (nie kopiuj 1:1):** `docs/ux/export/A-06-panel-jednostki-1E-preview.html`

---

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

### P1 — A-20 / DS-13 · Hint / toast (komunikat mapy)

**Plik:** `The Game - A20 Hint toast v1 2026-07-05 (1E).dc.html`

**Problem (screenshot Maciej):** po merge pod panelem A-06 widać czarny bubble **„Połączono: 2 jedn. na (48,31)”** — lane inline CSS w `main.ts` (`#civ-hint-toast`), **brak mockupu** (A-20 = ⬜ · DS-13 = ⬜).

**Układ MUST:**

```
                    ┌─────────────────────────────────────┐
                    │ Połączono: 2 jedn. na (48,31)       │  ← fixed bottom ~24px
                    └─────────────────────────────────────┘
     (ponad dolnym paskem mapy · z-index poniżej panelu A-06 · ~3 s · fade out)
```

**Stany w mockupie (min. 4):**

| # | Tekst (z kodu — przykłady) | Kontekst |
|---|---------------------------|----------|
| 1 | `Połączono: 2 jedn. na (48,31)` | sukces merge A-18 |
| 2 | `Rozdzielono: 1 jedn. → (47,31)` | sukces split |
| 3 | `Brak wolnego sąsiedniego heksu na rozdzielenie.` | błąd split |
| 4 | `Ufortyfikowano (ruch zużyty)` | akcja z panelu A-06 |

**Reguły wizualne:**

- Pozycja: **środek dolnej krawędzi** · `bottom: 24px` (nad paskiem mapy 56px; **pod** panelem A-06 gdy otwarty)
- Ramka złota 1px · tło ciemne · **bez emoji** w tekście
- Opcjonalnie: wariant **sukces** (neutralny złoty) vs **błąd** (obrys czerwony `#c84040`) — lane mapuje klasą
- Animacja: fade in/out ~200ms (Design proponuje; lane portuje)
- **NIE** mylić z toastem POLE-BITWY (osobny lane)

**Kod:** `gra/src/main.ts` → `#civ-hint-toast` · `showHintMessage()`

**W mockupie A-06:** możesz pokazać toast **jako osobny frame** obok panelu (stan „po merge”) — nie musi być na tym samym artboardzie co karty.

---

## 4. Co lane zrobi po Twojej paczce

1. Port CSS z `.dc.html` → `armyStackHud.ts` + `mapUnitHudSkin.ts` + `armyMergePanel.ts` + `armySplitPanel.ts`
2. Usunięcie `accent-violet` / `accent-blue` z toolbaru stosu — jeden system outline 1E
3. Podmiana emoji → SVG (`mapUnitBrandIconHtml` / `unitIconSvg`)
4. MASTER: `mergeUnitRow()` + `buildArmyStackHudState()` → `categoryOf(typeId)` + ikony z paczki JEDNOSTKI
5. Build + playtest: klik stos → merge modal → split modal

**Lane NIE zmienia:** logiki merge/split, tekstów PL, skrótów Esc/Enter/H.

---

## 5. Zawartość ZIP

```
ARMY-MERGE-A18-2026-07-05.zip
├── The Game - A06 Panel stosu armii v1 2026-07-05 (1E).dc.html    ← NOWY P0
├── The Game - A18 Polaczenie armii v1 2026-07-05 (1E).dc.html
├── The Game - A18 Rozdziel armie v1 2026-07-05 (1E).dc.html
├── The Game - A20 Hint toast v1 2026-07-05 (1E).dc.html       ← P1 · DS-13
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

- [ ] **3 mockupy P0** + **A-20 toast P1** `.dc.html`
- [ ] Zero emoji w mockupach i SVG
- [ ] Primary CTA **złoty** · toolbar **złoty outline** (bez fiolet/niebieski)
- [ ] Karty jednostek **identyczne** w A-06 i A-18 (SVG kategorii B)
- [ ] 4 stany A-06 + 3 stany merge + 2 stany split + **4 warianty toastu**
- [ ] `DESIGN-do-UI` z mapowaniem klas CSS → selektory lane

**Po gotowości napisz:**  
`Paczka ARMY-MERGE-A18-2026-07-05.zip gotowa` + lista plików.

---

## 7. Powiązane zlecenia

| ID | Relacja |
|----|---------|
| `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05` | Ikony w wierszach jednostek (poziom B) |
| `POLE-BITWY-v5-gap-2026-07-05` | Ten sam styl przycisków / paneli modalnych |
| A-06 review | `docs/ux/export/A-06-REVIEW-MACIEJ.md` — treść OK · wygląd → Design |
| DS-13 toast | Komponent globalny · ten sam styl dla merge/split/dyplo hints |

**Rejestr UX:** `docs/ux/REJEST-UX-MASTER.md` · wiersze A-06, A-18, A-20.
