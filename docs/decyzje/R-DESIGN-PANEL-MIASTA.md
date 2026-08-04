# R-DESIGN-PANEL-MIASTA — pigułka miasta na mapie świata (odświeżenie v2)

**Status:** 🟡 ZAPISANA · 2026-08-04  
**Temat:** kafelek/pigułka miasta widoczna na mapie świata (nie pełny panel miasta)  
**Zlecenie Design:** `dyspozycje/DO-DESIGN-PANEL-MIASTA-MAPA-2026-07-25.md`

---

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|--------|
| **R-DESIGN-PANEL-MIASTA-Q1** | **A** | **Czekaj na makieta Design v2**, potem kod — **NIE wdrażać chipu teraz**. Blokada kodu do momentu dostarczenia mockupu w `docs/ux/claude-design/_dist/...`. |
| **R-DESIGN-PANEL-MIASTA-Q2** | **C** | Zakres v1 po dostarczeniu Design: **MUST** (nazwa + populacja, 3 stany obrony, ikona cywilizacji) **+ hover/zoom rozszerzony** (kategoria produkcji + ostrzeżenie surowców przy najechaniu). Design dostarcza **OBA** warianty klatek: always-on skrócony **i** hover rozszerzony. |
| **R-DESIGN-PANEL-MIASTA-Q3** | **A** | Po dostarczeniu makiety Design: **kod od razu** (`działaj`); **deploy osobno później** — nie blokuje playtestu FALA 207. |

---

## ECHO (cytaty)

**Q1=A** — *„Najpierw Design, potem kod — nie ruszaj chipu bez mockupu v2."*

**Q2=C** — *„MUST: nazwa+pop, obrona (3 stany), ikona cywu. Plus hover: kategoria produkcji i ostrzeżenie surowców. Design ma dać obie klatki — skróconą zawsze widoczną i rozszerzoną na hover."*

**Q3=A** — *„Jak Design przyśle — wdrażaj kod od razu; deploy osobno, nie czekać na to przy playteście 207."*

---

## Zakres v1 (Q2=C — zatwierdzony)

### Always-on (MUST — skrócony)

1. **Nazwa miasta + populacja** — zostaje (jak dziś).
2. **Wskaźnik obrony** — 3 stany: brak muru / mur (+200%) / mur + Cytadela (+300%).
3. **Ikona właściciela / cywilizacji** — zamiast generycznej gwiazdki.

### Hover / zoom rozszerzony (obowiązkowy deliverable Design)

4. **Kategoria produkcji** — ikona kategorii (budynek / jednostka / cud), opcjonalnie tury do końca.
5. **Ostrzeżenie surowców** — pojedyncza ikonka ostrzegawcza, gdy produkcja zablokowana brakiem surowca lub magazyn bliski capu.

Design **musi** dostarczyć **obie** klatki (always-on + hover) — nie tylko wariant skrócony.

---

## Deliverable Design (3 klatki)

Ścieżka docelowa: `docs/ux/claude-design/_dist/<NAZWA>-2026-08-04/brand-book/KANON/mockupy/`

| # | Klatka | Zawartość |
|---|--------|-----------|
| 1 | **Baseline** | Spokój — brak muru, brak produkcji |
| 2 | **Pełny MUST** | Mur + Cytadela, ikona cywu, nazwa + pop (always-on) |
| 3 | **Hover rozszerzony** | MUST + kategoria produkcji + ostrzeżenie surowców |

Styl: 1E (Painted Imperial), tokeny z `eksport/tokens.css` / `brand-book/`.

---

## Blokada kodu (Q1=A)

- **ZAKAZ** implementacji w `gra/src/render/cityMapStatChip.ts` / `cityMapOutline.ts` / `cities.ts` do czasu mockupu v2 w `_dist/`.
- Po dostarczeniu makiety: Maciej **`działaj`** → kod natychmiast (Q3=A).
- Deploy do `gra-robocza/` — osobna decyzja Macieja, nie blokuje FALA 207.

---

## Powiązane

- `dyspozycje/DO-DESIGN-PANEL-MIASTA-MAPA-2026-07-25.md` — zlecenie Design (§4 addendum 2026-08-04)
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — status **CZEKA-NA-DESIGN**

---

*Koniec · ECHO 2026-08-04 · czeka Design makieta v2.*
