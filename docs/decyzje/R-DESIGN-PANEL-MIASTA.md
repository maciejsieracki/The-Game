# R-DESIGN-PANEL-MIASTA — pigułka miasta na mapie świata (odświeżenie v2)

**Status:** 🔵 W TRAKCIE (kod v1 prototyp) · 2026-08-04  
**Temat:** kafelek/pigułka miasta widoczna na mapie świata (nie pełny panel miasta)  
**Zlecenie Design:** `dyspozycje/DO-DESIGN-PANEL-MIASTA-MAPA-2026-07-25.md`

---

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|--------|
| **R-DESIGN-PANEL-MIASTA-Q1** | ~~**A**~~ → **B (prototyp)** | **2026-08-04:** Maciej autoryzuje prototyp **bez makiety Design** (de facto Q1→B). Kod v1 w `gra/src/render/cityMapStatChip.ts` — dopracowanie wizualne po deliverable Design. |
| **R-DESIGN-PANEL-MIASTA-Q2** | **C** | Zakres v1: **MUST** (nazwa + populacja, 3 stany obrony, ikona cywilizacji) **+ hover/zoom rozszerzony** (kategoria produkcji + ostrzeżenie surowców przy najechaniu). Design dostarcza **OBA** warianty klatek: always-on skrócony **i** hover rozszerzony. |
| **R-DESIGN-PANEL-MIASTA-Q3** | **A** | Kod od razu po autoryzacji; **deploy osobno później** — nie blokuje playtestu FALA 207. |

---

## ECHO (cytaty)

**Q1 (superseded 2026-08-04)** — *„Najpierw Design, potem kod — nie ruszaj chipu bez mockupu v2."* → **nadpisane:** *„Brak dostępu do Design — prototypuj najlepiej jak umiesz; mockup później."*

**Q2=C** — *„MUST: nazwa+pop, obrona (3 stany), ikona cywu. Plus hover: kategoria produkcji i ostrzeżenie surowców. Design ma dać obie klatki — skróconą zawsze widoczną i rozszerzoną na hover."*

**Q3=A** — *„Jak Design przyśle — wdrażaj kod od razu; deploy osobno, nie czekać na to przy playteście 207."* (kod v1 prototyp 2026-08-04 bez czekania na Design)

---

## Zakres v1 (Q2=C — zatwierdzony)

### Always-on (MUST — skrócony) — **WDROŻONE (prototyp kod)**

1. **Nazwa miasta + populacja** — zostaje (jak dziś).
2. **Wskaźnik obrony** — 3 stany wizualne (2026-08-04, R-CITY-PILL-SHIELD-EMBLEM):
   - **brak muru** → **bez tarczy** (layout nie rezerwuje miejsca);
   - **palisada** (bez murów i bez cytadeli) → tarcza **szara**;
   - **mury** lub **cytadela** (`fort`) → tarcza **złota**.
   `maMur` bez listy budynków = mury (złota).
3. **Ikona właściciela / cywilizacji** — medalion z **sygnetem SVG** (`civIconSvg`, ten sam co HUD/dyplomacja) + kolor właściciela; powiększony ~1,5× względem v1. Wstrzyknięcie: `setCityMapBadgeCivSigil` w `main.ts`.

### Always-on lite (prototyp bez Design)

4. **Glif produkcji** — mały symbol budynku/jednostki gdy kolejka aktywna (zamiast pełnego hover).

### Hover / zoom rozszerzony — **ODŁOŻONE (czeka Design + wiring mapy)**

5. **Kategoria produkcji** — ikona kategorii (budynek / jednostka / cud), opcjonalnie tury do końca.
6. **Ostrzeżenie surowców** — pojedyncza ikonka ostrzegawcza, gdy produkcja zablokowana brakiem surowca lub magazyn bliski capu.

Design **musi** dostarczyć **obie** klatki (always-on + hover) — nie tylko wariant skrócony.

---

## Deliverable Design (3 klatki) — nadal oczekiwany

Ścieżka docelowa: `docs/ux/claude-design/_dist/<NAZWA>-2026-08-04/brand-book/KANON/mockupy/`

| # | Klatka | Zawartość |
|---|--------|-----------|
| 1 | **Baseline** | Spokój — brak muru, brak produkcji |
| 2 | **Pełny MUST** | Mur + Cytadela, ikona cywu, nazwa + pop (always-on) |
| 3 | **Hover rozszerzony** | MUST + kategoria produkcji + ostrzeżenie surowców |

Styl: 1E (Painted Imperial), tokeny z `eksport/tokens.css` / `brand-book/`.

---

## Kod (prototyp v1 — 2026-08-04)

- `gra/src/render/cityMapStatChip.ts` — rysowanie pigułki, `defenseTierFromCity`, `cityMapBadgeKey`, `setCityMapBadgeCivSigil`
- `gra/src/main.ts` — wstrzyknięcie `civIconSvg` do medalionu
- `gra/src/render/cities.ts` — `_syncStatChip` + opcje `getBuiltBuildingIds` / `getCivIconId` / `getProduction`
- `gra/tools/city-map-badge-test.cjs` — testy pure helpers
- Deploy do `gra-robocza/` — **osobna decyzja Macieja**

---

## Powiązane

- `dyspozycje/DO-DESIGN-PANEL-MIASTA-MAPA-2026-07-25.md` — zlecenie Design (§4 addendum 2026-08-04)
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — status **W TRAKCIE (prototyp kod)**

---

*Koniec · ECHO 2026-08-04 · Q1 superseded → prototyp bez Design.*
